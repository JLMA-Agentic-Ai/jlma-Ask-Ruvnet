Updated: 2026-02-21 00:00:00 UTC | Version 1.0.0
Created: 2026-02-21

# AskRuvNet Testing Plan

## Overview

This document defines the comprehensive testing strategy for the AskRuvNet application — a Node.js/Express RAG (Retrieval-Augmented Generation) server backed by an RVF knowledge base of 102,857 vectors (knowledge.rvf, HNSW-indexed), ONNX embeddings (all-MiniLM-L6-v2, 384 dimensions), and a 5-provider LLM fallback chain (groq-free → openai → anthropic → openrouter → deepseek).

Production URL: https://ask-ruvnet-production.up.railway.app

---

## 1. Risk Assessment and Test Prioritization

### Critical Path (P0 — Breaks user experience immediately)
- Health endpoint returns non-200
- Chat endpoint returns no answer
- KB entry count drops below 50,000
- ONNX embedding pipeline fails to initialize
- RVF file fails to load or is corrupt

### High Risk (P1 — Degrades quality silently)
- Search returns low-relevance results
- Re-ranker produces incorrect ordering
- Query expansion generates noise queries
- Context compressor strips critical content
- Diversity filter removes all results

### Medium Risk (P2 — Edge cases and boundaries)
- Messages at exactly 10,000 character limit
- Empty query strings
- History arrays exceeding normal length
- Unknown mode values
- Concurrent requests under rate limit

### Low Risk (P3 — Nice-to-have coverage)
- /api/special endpoint (requires optional OPENAI_API_KEY)
- /api/learn endpoint (protected, background process)
- /api/knowledge file inventory accuracy
- Static asset serving

---

## 2. Production Smoke Tests

These tests run against the live deployment and must pass before any release is considered stable.

### 2.1 Health Check

**Endpoint:** GET /health
**Expectation:**
- HTTP 200
- Response body contains `status: "ok"`
- Response contains `uptime` (numeric, > 0)
- Response time < 2000ms

**Failure action:** Page on-call. Server may be down or unresponsive.

### 2.2 KB Stats Validation

**Endpoint:** GET /api/kb-stats
**Expectation:**
- HTTP 200
- `backend` field contains `"RuVector"` or `"RVF"`
- `connected` field equals `true`
- `domains.ask_ruvnet.total` > 50,000
- Response time < 3000ms

**Failure action:** RVF file may not be loaded. Check that knowledge.rvf exists and was extracted at startup. No DATABASE_URL needed — KB is embedded.

### 2.3 Knowledge Inventory

**Endpoint:** GET /api/knowledge
**Expectation:**
- HTTP 200
- `kb_stats.total` > 50,000
- `kb_backend` field contains `"RuVector"` or `"RVF"`
- `repos` array is non-empty
- Response time < 5000ms

### 2.4 Chat Smoke Test

**Endpoint:** POST /api/chat
**Payload:** `{ "message": "what is HNSW vector search" }`
**Expectation:**
- HTTP 200
- `answer` field is non-empty string (> 100 chars)
- `sources` array has at least 1 entry
- Each source has `id`, `score`, and `content` fields
- `score` values are between 0 and 1
- Response time < 15,000ms (Groq + embedding pipeline cold start)

**Note on cold starts:** Render's free tier spins down after inactivity. First request after sleep may take 30–60 seconds. Smoke tests should account for this with a wake-up request before timing assertions.

---

## 3. API Endpoint Tests

Complete coverage of all routes defined in src/server/app.js.

### 3.1 GET /health
| Test Case | Input | Expected |
|-----------|-------|----------|
| Basic health check | GET /health | 200, status: "ok" |
| Uptime present | GET /health | uptime > 0 |
| Timestamp present | GET /health | timestamp is ISO date string |

### 3.2 GET /api/kb-stats
| Test Case | Input | Expected |
|-----------|-------|----------|
| Connected state | GET /api/kb-stats | 200, connected: true |
| Entry count | GET /api/kb-stats | total > 50000 |
| Backend label | GET /api/kb-stats | backend contains "RuVector" or "RVF" |
| Domain breakdown | GET /api/kb-stats | domains object present |

### 3.3 GET /api/knowledge
| Test Case | Input | Expected |
|-----------|-------|----------|
| Response shape | GET /api/knowledge | 200, repos/websites/docs arrays |
| KB stats embedded | GET /api/knowledge | kb_stats.total present |
| Version present | GET /api/knowledge | version string matches package.json |
| Video stats | GET /api/knowledge | videoStats.total >= 0 |

### 3.4 POST /api/chat
| Test Case | Input | Expected |
|-----------|-------|----------|
| Valid message | { message: "what is HNSW" } | 200, answer non-empty |
| HNSW topic | { message: "what is HNSW vector search" } | answer contains "HNSW" or "vector" or "index" |
| RuVector topic | { message: "how do I use ruvector postgres" } | sources.length >= 1 |
| Ruflo topic | { message: "explain Ruflo swarm agents" } | answer non-empty |
| Missing message | {} | 400, error present |
| Empty string | { message: "" } | 400 |
| Non-string message | { message: 12345 } | 400 |
| Message too long | { message: "x".repeat(10001) } | 400 |
| Exact limit | { message: "x".repeat(10000) } | 200 (not rejected) |
| With valid mode | { message: "test", mode: "Technical" } | 200 |
| With invalid mode | { message: "test", mode: "Unknown" } | 200 (falls back to Balanced) |
| With history | { message: "test", history: [{role:"user", content:"hi"}] } | 200 |
| Sources in response | { message: "what is HNSW" } | sources array present |
| Source score range | { message: "what is HNSW" } | all scores between 0 and 1 |

### 3.5 POST /api/special
| Test Case | Input | Expected |
|-----------|-------|----------|
| Missing action | { content: "test" } | 400 |
| Missing content | { action: "simplify" } | 400 |
| Invalid action | { action: "unknown", content: "test" } | 400 |
| No OPENAI_API_KEY | { action: "simplify", content: "test" } | 503 (if not configured) |
| Valid simplify | { action: "simplify", content: "test" } | 200, result string (if configured) |
| Valid code | { action: "code", content: "HNSW" } | 200, result string (if configured) |
| Valid diagram | { action: "diagram", content: "RAG pipeline" } | 200, result string (if configured) |

### 3.6 POST /api/learn
| Test Case | Input | Expected |
|-----------|-------|----------|
| No auth in production | POST /api/learn | 401 |
| Invalid API key | Authorization: Bearer wrong | 401 |
| Valid API key | Authorization: Bearer {LEARN_API_KEY} | 200, message contains "started" |

---

## 4. KB Quality Tests

These tests validate the search pipeline quality — not just that it returns results, but that the results are relevant.

### 4.1 Search Relevance Test Matrix

For each test query, the top result should achieve a relevance score >= 0.4 and the result content should contain expected terminology.

| Query | Expected Content Signals | Min Score | Min Results |
|-------|--------------------------|-----------|-------------|
| "what is HNSW vector search" | hnsw, vector, index, approximate | 0.40 | 3 |
| "how do I use ruvector postgres" | ruvector, postgres, postgresql, vector | 0.40 | 3 |
| "explain Ruflo swarm agents" | ruflo, swarm, agent, orchestrat | 0.35 | 2 |
| "how to deploy to Railway" | railway, deploy, docker, environment | 0.35 | 2 |
| "what is RAG retrieval augmented generation" | retrieval, augmented, generation, context | 0.40 | 3 |
| "error handling in Node.js" | error, node, handler, catch, try | 0.30 | 2 |
| "how to configure pgvector extension" | pgvector, extension, postgres, vector | 0.35 | 2 |
| "what are embeddings" | embed, vector, dimension, model | 0.40 | 3 |

### 4.2 Intent Detection Accuracy

The intent detection logic must classify queries correctly. Test by verifying that intent-specific searches return appropriately typed content.

| Query Pattern | Expected Intent |
|---------------|----------------|
| "how do I install..." | how-to |
| "what is..." | what-is |
| "why does..." | why |
| "show me an example of..." | example |
| "fix error: cannot read property..." | troubleshoot |
| "ruvector overview" | general |

### 4.3 Diversity Filter Validation

When searching a broad topic, the returned sources should NOT all come from the same document or source prefix. Verify that sources[0].source !== sources[1].source for broad queries.

### 4.4 Re-Ranker Score Ordering

Verify that `sources` returned by /api/chat are ordered by descending score. The first source should always have the highest score.

---

## 5. Performance Benchmarks

### 5.1 Latency Targets

| Operation | P50 Target | P95 Target | P99 Target |
|-----------|------------|------------|------------|
| GET /health | < 200ms | < 500ms | < 1000ms |
| GET /api/kb-stats | < 500ms | < 1500ms | < 3000ms |
| ONNX embedding generation (384d) | < 500ms | < 2000ms | < 5000ms |
| PostgreSQL HNSW search (k=10) | < 100ms | < 500ms | < 1000ms |
| GET /api/knowledge | < 1000ms | < 3000ms | < 5000ms |
| POST /api/chat (warm) | < 8000ms | < 12000ms | < 20000ms |
| POST /api/chat (cold start) | < 45000ms | < 60000ms | N/A |

### 5.2 Concurrency Test

Run 5 simultaneous /api/chat requests. Expectation:
- All 5 return 200
- No request exceeds 30 seconds
- No database connection pool errors
- Rate limiter (100 req/15min) is not triggered by this batch

### 5.3 Rate Limit Validation

Send 101 requests to any endpoint within 15 minutes from the same IP. The 101st request must receive HTTP 429.

### 5.4 Payload Size Limits

POST /api/chat with a 1.1MB JSON body should return 413 (express limit is 1mb).

---

## 6. KB Completeness and Quality Tests

These tests run against the local ruvector-postgres database (port 5435) to assess the internal state of the knowledge base.

### 6.1 Entry Count Thresholds

| Schema | Min Expected | Alert Threshold |
|--------|-------------|-----------------|
| ask_ruvnet.architecture_docs (non-duplicate) | 50,000 | < 45,000 |
| Gold tier entries | 5,000 | < 3,000 |
| Entries with embeddings | 95% of total | < 90% |
| Entries with quality score | 95% of total | < 90% |

### 6.2 Category Distribution

At least 5 distinct categories must be represented in the KB. No single category should represent more than 40% of all entries (concentration risk).

### 6.3 Knowledge Type Coverage

The KB should contain entries across these knowledge types:
- concept
- procedure
- reference
- example
- troubleshooting

If any type has zero entries, that is a coverage gap requiring ingestion.

### 6.4 Quality Score Distribution

| Quality Tier | Min Expected % |
|-------------|----------------|
| Gold (>= 80) | 10% |
| Silver (>= 60) | 40% |
| Bronze (>= 40) | 30% |
| Below threshold (< 40) | <= 20% |

Entries with quality score < 40 should be flagged for review or re-enrichment.

### 6.5 Duplicate Detection

`is_duplicate = true` entries should not exceed 5% of the raw total. High duplicate ratios indicate ingestion problems.

---

## 7. Regression Tests (Post-Ingestion Validation)

Run these after every new KB ingestion to confirm quality has not degraded.

### 7.1 Regression Query Suite

Run the following queries before and after ingestion. Compare result counts and top-3 scores. Alert if any score drops > 0.10 from baseline.

Baseline queries (stored in test-production.mjs):
1. "what is HNSW vector search"
2. "how do I use ruvector postgres"
3. "explain Ruflo swarm agents"
4. "what are ONNX embeddings"
5. "how to deploy Node.js to Railway"

### 7.2 Entry Count Regression

Total entry count must not decrease after ingestion (unless a deliberate cleanup was performed and documented). If count drops > 1,000 without explanation, halt ingestion and investigate.

### 7.3 Gold Tier Preservation

Ingestion scripts must never downgrade existing gold-tier entries. After ingestion, gold count must be >= pre-ingestion gold count.

### 7.4 Embedding Integrity

After ingestion, run a spot-check: select 10 random entries, verify each has a non-null embedding of exactly 384 dimensions.

---

## 8. Security Tests

### 8.1 Input Validation
- POST /api/chat with `{ "message": "<script>alert(1)</script>" }` — verify response is safe text, no XSS reflected
- POST /api/chat with SQL injection in message — verify no database error leaks in response
- POST /api/chat with extremely nested JSON — verify parser does not crash

### 8.2 Rate Limiting
- Verify 429 after 100 requests in 15 minutes from same IP
- Verify rate limit headers are present in responses

### 8.3 Auth Protection
- POST /api/learn with no Authorization header in production mode — must return 401
- POST /api/learn with wrong Bearer token — must return 401

### 8.4 Debug Endpoint Isolation
- GET /api/debug — must return 404 in production (route only registered in non-production)

### 8.5 CORS
- Request from unlisted origin in production must be rejected (CORS_ORIGIN is set)

---

## 9. Test Scripts

| Script | Purpose | How to Run |
|--------|---------|------------|
| scripts/test-production.mjs | Smoke + API + performance tests against live URL | `node scripts/test-production.mjs` |
| scripts/test-kb-completeness.mjs | KB quality + completeness vs local PostgreSQL | `node scripts/test-kb-completeness.mjs` |

Both scripts produce a pass/fail summary with latency and quality metrics. Exit code 0 = all passed, exit code 1 = one or more failures.

---

## 10. CI/CD Integration Recommendations

1. Add `"test:smoke": "node scripts/test-production.mjs"` to package.json scripts
2. Add `"test:kb": "node scripts/test-kb-completeness.mjs"` to package.json scripts
3. Run test:smoke after every deployment to Render (use Render deploy hooks or GitHub Actions)
4. Run test:kb after every KB ingestion script completes
5. Store baseline scores in a JSON file (tests/baselines.json) and fail regression if scores drop

---

## 11. Known Gaps and Future Test Coverage

| Gap | Priority | Notes |
|-----|---------|-------|
| No unit tests for QueryExpander logic | P1 | Add Jest unit tests for expand() method |
| No unit tests for ReRanker scoring | P1 | Score weighting logic needs isolation testing |
| No unit tests for detectIntent() | P2 | 6 intent types, each needs positive + negative cases |
| No load test for concurrent embedding generation | P1 | ONNX pipeline is singleton; concurrency may cause queue |
| No test for BM25 hybrid search index building | P2 | initHybridSearchIndex() is complex and untested |
| No test for multi-hop retrieval | P2 | multiHopRetriever.needsMultiHop() threshold untested |
| No test for context compressor output length | P2 | maxContextLength: 16000 limit not verified |
| Frontend UI tests | P3 | React component tests not yet defined |
