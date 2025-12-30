Updated: 2025-12-30 14:30:00 EST | Version 4.0.0
Created: 2025-12-29 01:12:53 EST

# Knowledge Base Architecture - Quick Reference

**Version:** 4.0.0 | **Status:** CANONICAL
**Scope:** Any repo using `/ruvnet-stack` or `/ruvnet-update` MUST follow these patterns

---

## The Golden Rule

```
╔═══════════════════════════════════════════════════════════════════════════╗
║   Agents MUST query the KB for EVERY question.                            ║
║   Agents MUST NOT simplify KB into rules.                                 ║
║   Agents MUST cite sources in EVERY response.                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Quick Start

```bash
# 1. Start ruvector-postgres
docker run -d --name ruvector-kb \
  -e POSTGRES_PASSWORD=your_password \
  -p 5435:5432 \
  ruvnet/ruvector-postgres:latest

# 2. Create schema
PGPASSWORD=your_password psql -h localhost -p 5435 -U postgres -c "
CREATE SCHEMA IF NOT EXISTS project_name;
CREATE TABLE project_name.knowledge (
    id SERIAL PRIMARY KEY,
    title TEXT, content TEXT, source TEXT,
    embedding real[], created_at TIMESTAMP DEFAULT NOW()
);"

# 3. Ingest & verify
npm run kb:ingest && npm run kb:status
```

---

## Performance Metrics

| Metric | RuVector | ruvector-postgres |
|--------|----------|-------------------|
| Search Latency | 61 μs | <1.2ms |
| Throughput | 16,400 QPS | 10,000+ QPS |
| SQL Functions | N/A | 77+ |

---

## Module Documentation

This quick reference links to detailed guides:

### 📘 [KB Construction](./architecture/kb-construction.md)
**How to Build** - Chunking, embeddings, persistence, WAL, HNSW

### 📗 [KB Agent Integration](./architecture/kb-agent-integration.md)
**How to Use with Agents** - Binding protocol, anti-simplification, enforcement

### 📙 [KB Production](./architecture/kb-production.md)
**Deployment** - Docker, architecture, troubleshooting

---

## Core Patterns Summary

### Required Response Structure

```javascript
{
    answer: "...",
    kb_queries_made: ["query1"],      // REQUIRED
    kb_results_used: [{title, source, similarity}],  // REQUIRED
    kb_coverage: "full|partial|gap",  // REQUIRED
    raw_kb_content: "..."             // REQUIRED
}
```

### EnforcedKBAccess (Required Wrapper)

```javascript
class EnforcedKBAccess {
    constructor(kbClient, sessionId) {
        this.kb = kbClient;
        this.NO_CACHE = true;  // Cache FORBIDDEN
    }

    async query(queryText, options = {}) {
        const results = await this.kb.search({
            query: queryText, ...options,
            nocache: true, timestamp: Date.now()
        });
        return { results, metadata: { mustCite: true, sources: [...] } };
    }

    verifyCitation(response, metadata) {
        if (!response.kb_results_used) throw new Error("VIOLATION");
    }
}
```

### Forbidden Patterns

```yaml
FORBIDDEN:
  - "Based on my understanding of the KB..."
  - "The key principles are..."
  - "Generally speaking..."

REQUIRED:
  - "Let me query the knowledge base..."
  - "The KB returns [X results]..."
  - "According to [KB source]: [content]..."
```

---

## npm Scripts

```bash
npm run kb:ingest   # Ingest docs to KB
npm run kb:watch    # Watch for changes
npm run kb:status   # Check KB status
npm run kb:query    # Search KB
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0.0 | 2025-12-30 | Split into modular docs (token optimization) |
| 3.0.0 | 2025-12-30 | Added agent integration, anti-simplification |
| 2.0.0 | 2025-12-29 | Added retrieval optimization |
| 1.0.0 | 2025-12-29 | Initial patterns |
