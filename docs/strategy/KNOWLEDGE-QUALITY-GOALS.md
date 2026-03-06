Updated: 2026-02-28 14:30:00 EST | Version 2.0.0
Created: 2026-02-28 11:45:00 EST

# Ask-RuvNet Knowledge Quality Goals

## Purpose

This document defines what gold-level knowledge looks like in Ask-RuvNet.
Every piece of content in the KB must meet these standards before we consider
the application optimized. No more surface-level SQL reclassification — this
is the specification that all ingestion and curation must deliver against.

---

## 1. What "Gold" Knowledge Looks Like

A gold-level KB entry is a **teaching document**, not a text fragment. It must
pass all five of these tests:

### The Five Tests

| # | Test | Question | Pass Criteria |
|---|------|----------|---------------|
| 1 | **Standalone** | Can someone understand this without reading anything else? | No hanging fragments, no "Part 3 of 7", no orphaned bullet lists |
| 2 | **Teaches** | Does the reader learn something specific and actionable? | Contains at least 2 concrete facts (a number, a command, a config, a benchmark) |
| 3 | **Structured** | Is it organized for scanning and retrieval? | Has a clear title, at least 2 section headings, and flows logically |
| 4 | **Honest** | Does it avoid vague marketing language? | No "revolutionary", "cutting-edge" without evidence. Claims backed by specifics |
| 5 | **Connected** | Does it explain how this fits the bigger picture? | References related tools/concepts in the RuvNet ecosystem where relevant |

### Gold Standard Template

Every teaching entry should follow this structure (sections are optional if
the source material doesn't support them — a shorter accurate doc beats a
longer hallucinated one):

```markdown
# [Topic Name]: What It Is and Why It Matters

## Overview
[2-3 sentences in plain English. Use an analogy if it helps.
Someone who has never heard of this should understand this paragraph.]

## How It Works
[Technical explanation with specifics. Architecture details,
key algorithms, design patterns. Bullet points for clarity.]

## Key Numbers
[Performance stats, limits, benchmarks — anything quantitative.
Bullet list format.]

## Code Example
[Clean, commented code showing real usage.
Only include if source material contains code.]

## How It Connects
[Relationship to other RuvNet tools — AgentDB, RuVector,
Ruflo, Agentic Flow, etc. Only mention connections
that are documented, never fabricated.]

## Summary
[3-5 bullet point TL;DR]
```

### Proven Examples from Our KB

These entries score 98-100/100 and demonstrate the standard:

**"PostgreSQL Errors Decoded"** (ID: 148, quality: 99)
- Teaches 10 common errors with plain-English explanations
- Problem → Fix format — immediately actionable
- A developer hits an error, searches, finds the answer

**"What Is AIMDS?"** (ID: 278, quality: 99)
- Clear acronym definition, security context, actionable info
- Someone who's never heard of AIMDS understands it in 30 seconds

**"Why Search Returns Wrong Results"** (ID: 145, quality: 99)
- Problem → Why → Solution structure
- Addresses a real pain point developers actually have

**What these have in common**: They answer a question someone would actually ask.

---

## 2. What the KB Currently Looks Like (Honest Assessment)

### The Numbers

| Metric | Current State | Problem |
|--------|--------------|---------|
| Total entries | 174,784 | Scale is fine |
| Hand-authored gold (kb_complete) | 331 entries, avg 98/100 | These work perfectly |
| Auto-ingested (architecture_docs) | 174,453 entries | 78% are GitHub scrape fragments |
| Garbage tier | 23,838 entries (14%) | Malformed, corrupted, useless |
| Unclassified knowledge_type | 120,173 entries (68%) | Can't route what you can't classify |
| Corrupted titles | ~14,400 entries | "s();", "---", "ε²)", mid-sentence fragments |
| Short fragments (<500 chars) | 22,571 entries | Missing context, not standalone |

### Why Changing quality_score Doesn't Fix This

The 174K entries were bulk-scraped from GitHub repos and chunked into fragments.
A single README gets split into 30-400 chunks. Each chunk is a slice of a
document with no beginning, middle, or end. Changing its quality_score from 0
to 85 doesn't change what it says — it still says "checkpoint-20250730-201250"
or "s();" or the middle 200 characters of a table.

**The content itself must change.** Fragments must be merged back together,
evaluated, and rewritten into teaching documents — or deleted.

---

## 3. Content Types We Need

The KB should contain these categories of knowledge, each with specific quality
criteria:

### A. Concept Docs ("What Is X?")
**Purpose**: Explain what a tool/concept is to someone encountering it for the first time.
**Quality bar**: Passes all 5 tests above. 800-2500 words. Contains an analogy.
**Coverage needed**: One per tool/concept (13 core tools = 13 concept docs minimum)
**Current state**: 8 anchor docs created, need 5+ more. 331 in kb_complete.

### B. How-To Guides ("How Do I X?")
**Purpose**: Step-by-step instructions for accomplishing a specific task.
**Quality bar**: Numbered steps, prerequisites listed, expected output shown.
**Coverage needed**: 3-5 per core tool (39-65 guides)
**Current state**: 22,013 entries tagged "procedure" but most are fragments.

### C. Architecture Decision Records (ADRs)
**Purpose**: Explain WHY a design choice was made, what alternatives existed.
**Quality bar**: Context, decision, consequences format. Links to related ADRs.
**Coverage needed**: Already have 10,991 — need quality not quantity.
**Current state**: Scored 65-85 but many are raw markdown fragments.

### D. Reference Docs
**Purpose**: API signatures, configuration options, function parameters.
**Quality bar**: Complete, accurate, with usage examples for each entry.
**Coverage needed**: One per public API surface (varies by tool).
**Current state**: 24,589 entries tagged "reference" — many are fragments.

### E. Troubleshooting Guides
**Purpose**: Common errors and how to fix them.
**Quality bar**: Error message → Cause → Fix format.
**Coverage needed**: Top 10 errors per tool.
**Current state**: 2,075 entries — some good (like "PostgreSQL Errors Decoded").

### F. Teaching/Curriculum Docs
**Purpose**: Progressive learning paths that build understanding sequentially.
**Quality bar**: Prerequisites defined, builds on prior concepts, includes exercises.
**Coverage needed**: 3-5 learning paths across difficulty levels.
**Current state**: 105 teaching entries in kb_complete — good foundation.

---

## 4. The 13 Core Tools That Must Have Complete Coverage

| # | Tool | What It Does | Min Entries Needed |
|---|------|-------------|-------------------|
| 1 | **RuVector** | Vector database engine (HNSW, 150x-12,500x faster) | 15 |
| 2 | **Ruflo** | Agent orchestration framework | 15 |
| 3 | **Agentic Flow** | Agent runtime & self-learning | 15 |
| 4 | **AgentDB** | Agent memory & persistence | 12 |
| 5 | **AIMDS** | AI security middleware (3-layer pipeline) | 10 |
| 6 | **RVF** | Cognitive container format (24 segments, WASM) | 10 |
| 7 | **ruv-swarm** | Multi-agent swarm coordination | 10 |
| 8 | **Flow Nexus** | Cloud platform for agent deployment | 8 |
| 9 | **SONA** | Self-Optimizing Neural Architecture | 8 |
| 10 | **MinCut** | Graph partitioning for self-healing | 6 |
| 11 | **Micro-HNSW** | 7.2KB neuromorphic WASM with spiking neural nets | 6 |
| 12 | **RuVector-WASM** | Browser vector DB (<400KB, zero backend) | 6 |
| 13 | **RuVector-Postgres** | 290+ SQL functions (pgvector replacement) | 8 |
| | **Total** | | **129 minimum** |

Each tool needs at minimum:
- 1 "What Is X?" concept doc
- 2-3 "How Do I?" guides
- 1 troubleshooting guide
- 1-2 reference docs
- 1 "How It Connects" doc showing integration with other tools

---

## 5. What Must Be Deleted

Not all 174K entries deserve to exist. The following should be permanently
removed (marked `is_duplicate = true`) — not reclassified:

| Category | Estimated Count | Why |
|----------|----------------|-----|
| Raw changelogs | 1,286 | Version bump lists teach nothing |
| Git commit messages | 851 | "fix: bump version" is not knowledge |
| CI/CD output | ~2,000 | Build logs, test results |
| JSON/YAML config fragments | ~3,000 | Config without explanation |
| Corrupted/truncated entries | ~14,400 | Titles like "s();", "---", "ε²)" |
| Entries < 100 characters | ~1,072 | Not enough content to teach anything |
| Badge/license sections | ~2,000 | "MIT License. See LICENSE file" |
| **Total to remove** | **~24,600** | **~14% of KB** |

---

## 6. What Must Be Merged

The biggest quality problem is over-chunking. Examples:

| File | Current Chunks | Should Be |
|------|---------------|-----------|
| ruflo README | 389 fragments | 15-25 topic documents |
| ruvector README | 352 fragments | 12-20 topic documents |
| agentic-flow README | ~200 fragments | 10-15 topic documents |

**Rule**: No file should produce more than 30 KB entries. If a README was
chunked into 389 pieces, those pieces must be merged by topic section into
coherent, standalone teaching documents.

**Merge strategy**: Group by `file_path` + `section_header`, then use
embedding similarity to sub-cluster within sections. Each cluster becomes
one merged document.

---

## 7. Success Criteria

The KB optimization is DONE when:

### Quantitative Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Retrieval quality score | 8+/10 on 25 test queries | Automated retrieval test (see Section 8) |
| Standalone entries | 95%+ pass the standalone test | Sample 50 random entries |
| Garbage entries | < 500 remaining (< 0.3%) | `SELECT COUNT(*) WHERE triage_tier='garbage' AND is_duplicate=false` |
| Fragment entries (<300 chars) | < 200 remaining | `SELECT COUNT(*) WHERE char_length(content)<300 AND is_duplicate=false AND source_authority<>'expert-curated'` |
| Knowledge type classified | 95%+ | `SELECT COUNT(*) WHERE knowledge_type='unknown' AND is_duplicate=false` |
| 13 core tools covered | All 13 have concept + how-to + troubleshoot docs | Manual check |

### The Real Test

Ask these 5 questions and verify the response is rich, accurate, and cited:

1. **"What is RuVector and how is it different from pgvector?"**
   → Should get a clear comparison with performance numbers, architecture differences

2. **"How do I set up Ruflo for multi-agent orchestration?"**
   → Should get step-by-step setup with code examples

3. **"Why did RuvNet choose HNSW over IVF for vector indexing?"**
   → Should get an ADR-quality answer with tradeoffs explained

4. **"What security does AIMDS provide?"**
   → Should get 3-layer pipeline explanation with specific protections

5. **"Show me how to use RVF cognitive containers"**
   → Should get code example with 24-segment format explained

If all 5 produce satisfying, well-sourced answers → KB is gold.
If any produce vague, fragmented, or unsourced answers → more work needed.

---

## 8. Verification Protocol

### Automated Retrieval Test

Before AND after the curation pipeline, run 25 test queries against the KB.
For each query:

1. Generate embedding
2. Retrieve top-5 results from `architecture_docs`
3. Send results + query to an LLM
4. Score: relevance (1-10), completeness (1-10), coherence (1-10)
5. Average across all queries

**Baseline score** (current state): Run this BEFORE any changes.
**Target score**: 8.0+/10 average.
**Minimum improvement**: +2.0 points over baseline.

### Fragment Detection Test

After pipeline, these SQL queries should return near-zero:

```sql
-- Orphan fragments
SELECT COUNT(*) FROM ask_ruvnet.architecture_docs
WHERE is_duplicate = false
  AND source_authority <> 'expert-curated'
  AND char_length(content) < 300;
-- Target: < 200

-- "Part N" entries
SELECT COUNT(*) FROM ask_ruvnet.architecture_docs
WHERE is_duplicate = false
  AND title LIKE '%Part %';
-- Target: 0

-- Unstructured rewrites
SELECT COUNT(*) FROM ask_ruvnet.architecture_docs
WHERE is_duplicate = false
  AND content NOT LIKE '%## %'
  AND char_length(content) > 500
  AND source_authority = 'llm-generated';
-- Target: 0
```

### Human Spot-Check

Pull 10 random rewritten entries. For each, ask:
1. If I asked "What is [topic]?", would this answer satisfy me?
2. Does it contain at least one specific fact?
3. Could I explain this topic to someone else after reading it?

Pass: 7/10 or better on all three questions.

---

## 9. The Ingestion Architecture (How We Get There)

### Pipeline: 5 Stages

```
Stage 0: PRE-FILTER (SQL only, no LLM, instant)
  → Delete garbage, protect expert-curated entries
  → Eliminates ~25K entries at zero cost

Stage 1: TOPIC CLUSTERING (SQL + embeddings, no LLM)
  → Group fragments by file_path + section_header + embedding similarity
  → Collapses ~126K entries into ~20-25K topic groups

Stage 2: TRIAGE (Groq llama-3.3-70b, free tier)
  → LLM reads each group, returns: KEEP / MERGE / REWRITE / DELETE
  → Cheap, overnight (~12 hours on free tier)

Stage 3: MERGE + REWRITE (Claude Haiku 3.5)
  → Fragments marked MERGE/REWRITE get combined into teaching docs
  → Uses the gold template from Section 1 above
  → ~$68 total cost

Stage 4: EMBED + STORE (ONNX local, no API cost)
  → New entries get embeddings, old fragments marked is_duplicate=true

Stage 5: QUALITY AUDIT (Claude Opus, 50 samples)
  → Random sample scored against gold standard
  → If <70% score GOLD, rewrite prompt gets adjusted and Stage 3 re-runs
```

### Cost: ~$70 total
### Time: ~13 hours unattended (Groq free tier) + 30 min active work
### Rollback: Fully non-destructive — old entries kept as is_duplicate, new entries tagged source_authority='llm-generated'

### Pipeline Properties
- **Resumable**: Crashes mid-stage → restart picks up where it left off
- **Reversible**: Single SQL statement rolls back all changes
- **Auditable**: Every decision logged in `curation_decisions` table
- **Idempotent**: Re-running produces same results (new run ID, same logic)

---

## 10. What This Document Is NOT

This document is NOT a plan to:
- Change quality_score numbers without changing content
- Add more raw scraped data to the KB
- Build another ingestion script that chunks markdown into fragments
- Declare victory based on SQL counts

This document IS the specification that all KB work must deliver against.
Every entry that passes through the curation pipeline must meet the Five
Tests in Section 1. If it doesn't, it gets rewritten or deleted — not
reclassified.

---

## 11. Implementation Architecture (For Engineers)

This section explains the technical architecture so engineers can implement,
debug, and extend the curation pipeline.

### Database Schema

All curation data lives in the `ask_ruvnet` schema on PostgreSQL (port 5435).

```sql
-- The main content table (174K+ entries)
ask_ruvnet.architecture_docs (
  id              SERIAL PRIMARY KEY,
  doc_id          TEXT NOT NULL UNIQUE,        -- e.g. "curated-1740767123-a3f8k2"
  title           TEXT,
  content         TEXT,
  file_path       TEXT,                        -- source file or "curated/group-name"
  file_hash       TEXT,                        -- md5 of content
  package_name    TEXT,                        -- e.g. "ruflo", "ruvector"
  doc_type        TEXT,                        -- "documentation", "adr", "changelog"
  category        TEXT,                        -- "general", "api", "security"
  knowledge_type  TEXT,                        -- "concept", "procedure", "reference"
  quality_score   INTEGER,                     -- 0-100
  triage_tier     TEXT,                        -- "gold", "silver", "garbage"
  source_authority TEXT,                       -- "expert-curated", "llm-generated", "github-scrape"
  expertise_level TEXT,                        -- "beginner", "intermediate", "advanced"
  is_duplicate    BOOLEAN DEFAULT false,       -- soft-delete flag
  canonical_id    INTEGER,                     -- points to merged entry if is_duplicate
  section_header  TEXT,                        -- markdown section from source
  section_index   INTEGER,                     -- order within source file
  topics          TEXT[],                      -- tag array
  concepts        TEXT[],                      -- concept array
  summary         TEXT,                        -- first 300 chars
  embedding       VECTOR(384)                  -- all-MiniLM-L6-v2 embedding
);

-- Pipeline tracking
ask_ruvnet.curation_pipeline (
  id              SERIAL PRIMARY KEY,
  run_id          UUID,
  stage           TEXT,                        -- "prefilter", "cluster", "triage", "rewrite", "embed"
  status          TEXT,                        -- "running", "completed", "failed"
  entries_processed INTEGER,
  entries_total   INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Per-entry decisions (audit trail)
ask_ruvnet.curation_decisions (
  id              SERIAL PRIMARY KEY,
  run_id          UUID,
  entry_id        INTEGER REFERENCES architecture_docs(id),
  stage           TEXT,
  action          TEXT,                        -- "KEEP", "DELETE", "MERGE", "REWRITE", "PROTECT"
  reason          TEXT,
  merge_group_id  TEXT,                        -- groups entries for merge/rewrite
  topic_extracted TEXT,                        -- LLM-extracted topic
  facts_extracted TEXT[],                      -- LLM-extracted key facts
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id, entry_id, stage)
);

-- Lineage tracking (which fragments became which gold doc)
ask_ruvnet.curation_lineage (
  id              SERIAL PRIMARY KEY,
  new_entry_id    INTEGER,                     -- the merged gold doc
  source_entry_id INTEGER,                     -- the original fragment
  run_id          UUID,
  action          TEXT                         -- "merged_from"
);
```

### Data Flow (Request Path)

When a user asks a question in Ask-RuvNet:

```
User query
  → Embedding generated (all-MiniLM-L6-v2, 384 dims)
  → Vector similarity search: embedding <=> query_embedding
     WHERE is_duplicate = false
     ORDER BY similarity DESC LIMIT 8
  → Top-8 results sent to LLM as context
  → LLM generates response citing the context
  → Response + source cards returned to frontend
```

**Key implication**: `is_duplicate = true` entries are invisible to search.
This is the soft-delete mechanism — original fragments remain in the DB
for rollback but never appear in results.

### Rollback (Single Statement)

```sql
-- Undo ALL curation for a specific run
BEGIN;
  -- Restore soft-deleted fragments
  UPDATE ask_ruvnet.architecture_docs
  SET is_duplicate = false, canonical_id = NULL
  WHERE canonical_id IN (
    SELECT new_entry_id FROM ask_ruvnet.curation_lineage
    WHERE run_id = '<run-id>'
  );
  -- Remove new gold entries
  DELETE FROM ask_ruvnet.architecture_docs
  WHERE doc_id LIKE 'curated-%'
    AND id IN (
      SELECT new_entry_id FROM ask_ruvnet.curation_lineage
      WHERE run_id = '<run-id>'
    );
  -- Clean up decisions
  DELETE FROM ask_ruvnet.curation_decisions WHERE run_id = '<run-id>';
  DELETE FROM ask_ruvnet.curation_lineage WHERE run_id = '<run-id>';
COMMIT;
```

---

## 12. Common Issues and How to Handle Them

These are problems we've already hit during curation. If you're running the
pipeline or writing new ingestion code, read this first.

### Issue 1: LLM Cookie-Cutter Output

**Problem**: When you ask an LLM to rewrite 400+ documents, it falls into
patterns. Our first run produced "Think of it as..." in 92% of entries.

**Root cause**: The rewrite prompt didn't constrain repetitive patterns.

**Fix**: The v2.0 prompt (in `scripts/kb-curate/prompts/rewrite.js`) now:
- Bans "Think of it as..." as an opener
- Requires 4 different opening patterns, rotated across docs
- Has an explicit banned-word list (seamlessly, leverage, cutting-edge, etc.)
- Requires all performance numbers to include measurement context

**Lesson**: Always run a quality audit on 50+ samples before scaling to
thousands. Score each dimension separately (structure, honesty, connected).

### Issue 2: Unqualified Performance Claims

**Problem**: Source material says "150x faster" but doesn't say compared to
what, on what hardware, with what dataset. The LLM repeats the claim as fact.

**Fix**: The rewrite prompt now requires qualification:
- BAD: "150x faster than alternatives"
- GOOD: "150x faster than brute-force cosine similarity on 1M vectors (benchmarked on M1 Mac)"
- If source doesn't specify: "reported as 150x faster (benchmark details not specified in source)"

**Lesson**: LLMs are amplifiers — they'll repeat marketing claims with
confidence unless explicitly told not to. Your prompt must enforce honesty.

### Issue 3: Over-Chunking Creates Garbage

**Problem**: A 50KB README chunked into 400 fragments. Each fragment is
200-500 characters. Most are mid-sentence, mid-table, or mid-code-block.

**Root cause**: Naive fixed-size chunking ignores document structure.

**Fix**: Stage 1 re-groups by `file_path` + `section_header`. Stage 3
merges groups back into coherent documents.

**Lesson**: Never chunk by character count alone. Always chunk by structural
boundaries (headers, sections, paragraphs). If you must use fixed-size
chunks, overlap by 20% and include the section header in every chunk.

### Issue 4: Hallucinated Cross-References

**Problem**: LLM fabricates connections between tools that don't exist in
source material. "RuVector integrates with AIMDS for security-aware indexing"
when no such integration exists.

**Fix**: The prompt says: "Only mention connections documented in source
material. If no connections are documented, write 'No documented integrations
in source material.'" We also have a refusal-detection pattern that catches
when the LLM refuses to write (indicating garbage input).

**Lesson**: "How It Connects" is the highest-risk section for hallucination.
Always audit this section specifically.

### Issue 5: doc_id NOT NULL Constraint

**Problem**: Stage 3 insert fails with `null value in column "doc_id"`.

**Root cause**: The original code didn't generate a `doc_id` for new entries.

**Fix**: Generate unique doc_id: `curated-${Date.now()}-${random_string}`

**Lesson**: Always check the target table's NOT NULL constraints before
building INSERT statements.

### Issue 6: Rate Limiting on Free Tiers

**Problem**: Groq free tier allows ~25 RPM. Stage 2 triage needs 21K+ calls.

**Fix**: Built-in rate limiter with 60s backoff on 429 responses. Pipeline
is fully resumable — if it crashes, restart picks up from last completed
entry via the `curation_decisions` table's UNIQUE constraint.

**Time math**: 21K groups ÷ 25 RPM = 840 minutes = ~14 hours.

---

## 13. Behavioral Changes for Getting Good Results

The KB is a RAG system. The quality of answers depends on both content
quality AND how you query it. Here's what engineers need to change.

### How Vector Search Actually Works

Vector search doesn't do keyword matching. It converts your query into
a 384-dimensional vector (using all-MiniLM-L6-v2) and finds the closest
vectors in the KB by cosine similarity.

**This means:**
- "HNSW algorithm" and "approximate nearest neighbor search" will match
  the same entries — they're semantically similar
- "How does HNSW work?" will match better than "HNSW" alone because the
  embedding captures intent
- Typos don't matter much — "ruvecotr" still has high similarity to "ruvector"
- BUT short queries (<3 words) produce weak embeddings — add context

### Query Patterns That Work

| Query Pattern | Why It Works |
|--------------|-------------|
| "What is RuVector and how does it compare to pgvector?" | Clear question with comparison context |
| "How do I set up Ruflo for multi-agent orchestration?" | Specific task with tool named |
| "Why was HNSW chosen over IVF for vector indexing?" | Decision question — matches ADRs |
| "Common errors when using RuVector-Postgres" | Problem-oriented — matches troubleshooting docs |

### Query Patterns That Don't Work

| Query Pattern | Why It Fails | Fix |
|--------------|-------------|-----|
| "HNSW" | Too short, weak embedding | "How does HNSW indexing work in RuVector?" |
| "help" | No semantic content | Ask a specific question |
| "show me everything about security" | Too broad, matches everything weakly | "What security protections does AIMDS provide?" |

### How knowledge_type Affects Routing

The `knowledge_type` field determines which content gets prioritized:

| knowledge_type | Best For | Example Query |
|---------------|---------|---------------|
| `concept` | "What is X?" questions | "What is Ruflo?" |
| `procedure` | "How do I?" questions | "How do I deploy a swarm?" |
| `reference` | API/config lookups | "What parameters does ruvector_embed take?" |
| `adr` | Design rationale | "Why was X designed this way?" |
| `troubleshooting` | Error resolution | "Why does my embedding search return wrong results?" |

### Writing Content That Retrieves Well

If you're adding entries to the KB, follow these rules:

1. **Title = the question it answers**: "What Is HNSW and Why RuVector Uses It"
   scores better than "HNSW Overview" because the title embedding matches
   user questions more closely.

2. **First paragraph matters most**: The embedding of a document is heavily
   weighted toward the opening. Put the key concept in the first 2 sentences.

3. **Use the actual terms users would search for**: If users say "vector
   database" not "embedding store", use "vector database" in the title and
   first paragraph.

4. **800-2500 words is the sweet spot**: Shorter entries produce weak
   embeddings. Longer entries dilute the signal. The gold template targets
   this range.

5. **One topic per entry**: "RuVector HNSW + AIMDS Security + Ruflo
   Setup" in one doc means it matches all three queries weakly instead of
   one query strongly.

---

## 14. Quality Audit Process (How We Test)

Quality is measured, not assumed. Here's exactly how to run an audit.

### Automated Audit (50-sample)

```javascript
// Pull 50 random rewritten entries
const samples = await pool.query(`
  SELECT id, title, content FROM ask_ruvnet.architecture_docs
  WHERE source_authority = 'llm-generated'
    AND is_duplicate = false
  ORDER BY RANDOM() LIMIT 50
`);

// For each, score on 5 dimensions using an LLM judge
for (const entry of samples.rows) {
  const score = await llmJudge(entry, {
    dimensions: ['standalone', 'teaches', 'structured', 'honest', 'connected'],
    scale: '1-10 per dimension',
    rubric: 'See Five Tests in Section 1'
  });
  // Log: entry.id, entry.title, score per dimension, overall
}
```

### What to Check Manually

After the automated audit, pull the 10 lowest-scoring entries and read them:

1. **Does the overview make sense in 30 seconds?** If not → rewrite prompt
   needs work.
2. **Are performance numbers qualified?** "150x faster" without context
   = dishonest. "150x faster than brute-force on 1M vectors" = honest.
3. **Does "Related Tools" cite real connections?** If it mentions an
   integration that doesn't exist, that's hallucination.
4. **Is there cookie-cutter language?** If 5 out of 10 start with the
   same phrase, the prompt is too rigid.
5. **Would this answer satisfy an engineer who asked the question?** This
   is the ultimate test.

### Score Thresholds

| Dimension | Target | Unacceptable | What to Fix |
|-----------|--------|-------------|-------------|
| Standalone | 9.0+ | <7.0 | Entry is a fragment — needs context added |
| Teaches | 8.0+ | <6.0 | Entry is vague — needs concrete facts |
| Structured | 8.5+ | <7.0 | Entry lacks headings — template not followed |
| Honest | 8.0+ | <6.0 | Unqualified claims — prompt needs tighter rules |
| Connected | 6.0+ | <4.0 | Missing cross-refs — prompt needs examples |

### First Audit Results (v1.0 prompt, 92 samples)

| Dimension | Score | Issue Found |
|-----------|-------|-------------|
| Structure | 8.2 | Good — 100% follow template |
| Teaching | 8.0 | Good — concrete facts present |
| Honesty | 6.1 | BAD — unqualified performance claims |
| Connected | 5.0 | BAD — zero cross-references |
| Overall | 6.9 | Below target (8.0+) |

**Additional findings:**
- "Think of it as..." appeared in 92% of entries (monotony)
- "seamlessly" in 15 entries, "intelligent" in 24 entries (filler)
- 1 suspicious entry with possibly hallucinated content

**Action taken**: Rewrote prompt to v2.0 (see Section 12, Issue 1).

---

## 15. Extending the Pipeline

### Adding a New Stage

Each stage is a standalone Node.js module in `scripts/kb-curate/stages/`.
To add a new stage:

1. Create `scripts/kb-curate/stages/05-your-stage.js`
2. Export a function: `async function stage05_yourStage(runId, options) {}`
3. Use `pool` from `../config` for database access
4. Record decisions in `curation_decisions` with your stage name
5. Wire it into `scripts/kb-curate/index.js`

### Running the Pipeline

```bash
# Full pipeline (all stages)
node scripts/kb-curate/index.js

# Single stage
node scripts/kb-curate/index.js --stage 2

# Dry run (no database changes)
node scripts/kb-curate/index.js --stage 3 --dry-run

# Test mode (process 3 entries then stop)
node scripts/kb-curate/index.js --stage 3 --test

# New run (fresh run_id instead of resuming)
node scripts/kb-curate/index.js --new-run

# Limit entries
node scripts/kb-curate/index.js --stage 2 --limit 100
```

### Environment Variables

```bash
PG_HOST=localhost        # PostgreSQL host
PG_PORT=5435             # PostgreSQL port
PG_USER=postgres         # PostgreSQL user
PG_DATABASE=postgres     # PostgreSQL database
GROQ_API_KEY=...         # For Stage 2 triage (free tier ok)
ANTHROPIC_API_KEY=...    # For Stage 3 rewrite (Haiku)
```

### Cost Estimates

| Stage | Model | Cost | Time |
|-------|-------|------|------|
| Stage 0 | SQL only | $0 | <1 min |
| Stage 1 | SQL only | $0 | <5 min |
| Stage 2 | Groq llama-3.3-70b (free) | $0 | ~14 hours |
| Stage 3 | Claude Haiku 3.5 | ~$68 | ~2 hours |
| Stage 4 | ONNX local | $0 | ~30 min |
| Stage 5 | Claude Opus (50 samples) | ~$2 | <5 min |
| **Total** | | **~$70** | **~17 hours** |
