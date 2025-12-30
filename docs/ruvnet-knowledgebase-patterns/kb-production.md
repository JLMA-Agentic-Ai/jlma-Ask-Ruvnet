Updated: 2025-12-30 14:30:00 EST | Version 1.0.0
Created: 2025-12-30 14:30:00 EST

# KB Production Deployment

**Deployment Patterns** - Docker, architecture, troubleshooting

---

## Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK                          │
└─────────────────────────────────────────────────────────────┘

                        ┌─────────────────┐
                        │   APPLICATION   │
                        │   (Express/Next)│
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
     │ MCP SERVER   │   │  REST API    │   │  WEBHOOKS    │
     │ (Claude Code)│   │  (Public)    │   │  (Events)    │
     └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   KB ACCESS LAYER   │
                    │   EnforcedKBAccess  │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
  │  RUVECTOR-     │  │   UTILITIES    │  │   BUSINESS     │
  │  POSTGRES      │  │   CONTAINER    │  │   CONTAINER    │
  │  Port: 5435    │  │   (Shared)     │  │   (Isolated)   │
  └────────────────┘  └────────────────┘  └────────────────┘
```

---

## Docker Compose

```yaml
version: '3.8'
services:
  ruvector-kb:
    image: ruvnet/ruvector-postgres:latest
    container_name: ruvector-kb
    restart: always
    environment:
      POSTGRES_PASSWORD: ${RUVECTOR_PASSWORD}
    ports:
      - "5435:5432"
    volumes:
      - ruvector-kb-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  ruvector-kb-data:
```

---

## Quick Start

```bash
# 1. Start ruvector-postgres
docker run -d --name ruvector-kb \
  -e POSTGRES_PASSWORD=your_password \
  -p 5435:5432 \
  -v ruvector-kb-data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest

# 2. Create schema
PGPASSWORD=your_password psql -h localhost -p 5435 -U postgres -c "
CREATE SCHEMA IF NOT EXISTS project_name;
CREATE TABLE project_name.knowledge (
    id SERIAL PRIMARY KEY,
    title TEXT, content TEXT, source TEXT,
    embedding real[], created_at TIMESTAMP DEFAULT NOW()
);"

# 3. Ingest content
npm run kb:ingest

# 4. Verify
npm run kb:status
```

---

## Key APIs

```javascript
// Initialize KB access
const kb = new EnforcedKBAccess(kbClient, sessionId);

// Query with enforcement
const result = await kb.query("your query", {
    limit: 5,
    minSimilarity: 0.65
});

// Verify citation
kb.verifyCitation(response, result.metadata);

// Get query log for audit
const log = kb.getQueryLog();
```

---

## npm Scripts

```json
{
  "scripts": {
    "kb:ingest": "node scripts/kb-architecture-sync.js --ingest",
    "kb:watch": "node scripts/kb-architecture-sync.js --watch",
    "kb:status": "node scripts/kb-architecture-sync.js --status",
    "kb:query": "node scripts/kb-architecture-sync.js --query"
  }
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "No KB results" | Query too specific | Broaden query, lower minSimilarity |
| Low similarity | Embedding mismatch | Verify embedding model |
| Slow queries | Missing index | Create IVFFlat/HNSW index |
| Citation violations | Agent ignoring KB | Strengthen system prompt |
| Stale data | No re-ingestion | Use `npm run kb:watch` |

### Debug Commands

```bash
npm run kb:status   # Check KB health
npm run kb:query    # Test search
npm run kb:ingest   # Force re-ingest
npm run kb:watch    # Start file watcher
```

### Container Health

```bash
# Check container status
docker ps | grep ruvector

# View logs
docker logs ruvector-kb --tail 50

# Test connection
PGPASSWORD=pwd psql -h localhost -p 5435 -U postgres -c "SELECT 1"
```

---

## Performance Tuning

### Index Creation

```sql
-- HNSW index for faster search
CREATE INDEX knowledge_embedding_idx
ON project_name.knowledge
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);
```

### Connection Pooling

```javascript
const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5435,
    database: 'postgres',
    user: 'postgres',
    password: process.env.RUVECTOR_PASSWORD,
    max: 20,  // Pool size
    idleTimeoutMillis: 30000
});
```

---

## Backup & Recovery

```bash
# Backup
docker exec ruvector-kb pg_dump -U postgres > backup.sql

# Restore
docker exec -i ruvector-kb psql -U postgres < backup.sql

# Volume backup
docker run --rm -v ruvector-kb-data:/data -v $(pwd):/backup \
    alpine tar czf /backup/kb-backup.tar.gz /data
```
