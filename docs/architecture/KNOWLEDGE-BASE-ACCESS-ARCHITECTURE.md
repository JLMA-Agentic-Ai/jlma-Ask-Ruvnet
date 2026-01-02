Updated: 2025-12-29 01:15:00 EST | Version 1.1.0
Created: 2025-12-29 00:00:00 EST

# Knowledge Base Access Architecture

## Executive Summary

This document evaluates architecture options for making the PostgreSQL-based knowledge base (`ruvector-kb`) accessible to Claude Code instances, AI agents, and external applications across different repositories and contexts.

**Recommended Primary Pattern:** MCP Server with REST Fallback
**Recommended Secondary Pattern:** Direct PostgreSQL access via connection string

---

## Current State Analysis

### Infrastructure

| Component | Value |
|-----------|-------|
| Container | `ruvector-kb` |
| Port | 5435 (maps to internal 5432) |
| Database | `postgres` (not `ruvector` as initially stated) |
| User | `postgres` |
| Password | `guruKB2025` |
| Extension | `ruvector 0.1.0` |
| PostgreSQL | 17.7 |

### Data Profile

| Metric | Value |
|--------|-------|
| Total Vectors | 656 |
| Content Size | 720 KB |
| Embedding Size | 997 KB |
| Embedding Model | all-MiniLM-L6-v2 (384 dimensions) |
| Schemas | `askruvnet`, `ruvector_test`, `public` |

### Schema Isolation Pattern

```
postgres (database)
├── public (ruvector extension + functions)
├── askruvnet (project: Ask-Ruvnet)
│   └── guru_knowledge (656 vectors)
├── presenter_mode (project: Presenter)
│   └── [knowledge table]
└── [future_project] (isolated schema per project)
```

---

## Architecture Options Evaluated

### Option 1: MCP Server Integration

**Description:** Create a dedicated MCP server that wraps the PostgreSQL knowledge base, exposing semantic search, retrieval, and management functions.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code Instances                    │
├─────────────────────────────────────────────────────────────┤
│  Instance A     │    Instance B     │    Instance C          │
│  (Ask-Ruvnet)   │    (Presenter)    │    (Any Project)       │
└────────┬────────┴────────┬──────────┴─────────┬──────────────┘
         │                 │                    │
         └────────────────┬┴───────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   ruvector-kb-mcp     │
              │   (MCP Server)        │
              ├───────────────────────┤
              │ • kb_search           │
              │ • kb_retrieve         │
              │ • kb_ingest           │
              │ • kb_list_schemas     │
              │ • kb_stats            │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    ruvector-kb        │
              │    (PostgreSQL 17)    │
              │    Port 5435          │
              └───────────────────────┘
```

**Evaluation:**

| Criterion | Score (1-10) | Notes |
|-----------|--------------|-------|
| Simplicity | 9 | Claude Code natively understands MCP |
| Security | 8 | Schema isolation via MCP tool parameters |
| Performance | 7 | Small overhead for MCP protocol |
| Cross-platform | 9 | Works anywhere Claude Code runs |
| Ease of use | 10 | Natural language queries via tools |

**Pros:**
- Native Claude Code integration (no external tools needed)
- Schema isolation enforced at MCP layer
- Semantic search exposed as simple tool calls
- Works from any directory/project
- Audit logging built-in

**Cons:**
- Requires MCP server running
- Slight latency overhead
- Need to maintain MCP server code

---

### Option 2: REST API Layer

**Description:** Deploy a lightweight HTTP API (Express/Fastify) that exposes the knowledge base via REST endpoints.

**Architecture:**
```
┌──────────────────────────────────────────────────────────────┐
│                        Consumers                              │
├──────────────────────────────────────────────────────────────┤
│  Claude Code    │   External Apps   │   Other AI Agents       │
│  (via fetch)    │   (any language)  │   (langchain, etc)      │
└────────┬────────┴────────┬──────────┴─────────┬──────────────┘
         │                 │                    │
         └────────────────┬┴───────────────────┘
                          │ HTTP/HTTPS
                          ▼
              ┌───────────────────────┐
              │   ruvector-kb-api     │
              │   (Express/Fastify)   │
              │   Port 3456           │
              ├───────────────────────┤
              │ GET  /search          │
              │ GET  /retrieve/:id    │
              │ POST /ingest          │
              │ GET  /schemas         │
              │ GET  /health          │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    ruvector-kb        │
              │    (PostgreSQL 17)    │
              └───────────────────────┘
```

**Evaluation:**

| Criterion | Score (1-10) | Notes |
|-----------|--------------|-------|
| Simplicity | 7 | Need to deploy and maintain API server |
| Security | 7 | Requires auth implementation |
| Performance | 8 | HTTP overhead, but can cache |
| Cross-platform | 10 | Any language can consume |
| Ease of use | 7 | Requires HTTP client knowledge |

**Pros:**
- Universal access (any language/platform)
- Standard REST conventions
- Easy to add caching layer
- Can expose via public URL for remote access

**Cons:**
- Another service to deploy/maintain
- Need authentication implementation
- Claude Code needs to use Bash/fetch (less native)
- More complex than MCP for AI agents

---

### Option 3: Direct PostgreSQL Access

**Description:** Share the connection string and let consumers connect directly via psql, pg library, or native drivers.

**Architecture:**
```
┌──────────────────────────────────────────────────────────────┐
│                        Consumers                              │
├──────────────────────────────────────────────────────────────┤
│  Claude Code    │   Node.js Apps   │   Python Scripts         │
│  (psql/Bash)    │   (pg library)   │   (psycopg2)             │
└────────┬────────┴────────┬─────────┴─────────┬───────────────┘
         │                 │                   │
         └────────────────┬┴──────────────────┘
                          │ PostgreSQL Protocol
                          ▼
              ┌───────────────────────┐
              │    ruvector-kb        │
              │    PostgreSQL 17      │
              │    Port 5435          │
              │    Host: localhost    │
              └───────────────────────┘
```

**Evaluation:**

| Criterion | Score (1-10) | Notes |
|-----------|--------------|-------|
| Simplicity | 6 | Requires SQL knowledge |
| Security | 5 | Shared credentials, harder to isolate |
| Performance | 10 | Direct connection, no overhead |
| Cross-platform | 8 | Need PostgreSQL driver |
| Ease of use | 5 | Need to write SQL queries |

**Pros:**
- Zero overhead
- Full SQL power
- No additional services
- Works with existing PostgreSQL tooling

**Cons:**
- Consumers need SQL knowledge
- Harder to enforce schema isolation
- No abstraction layer (tight coupling)
- Credentials exposed to consumers

---

### Option 4: GraphQL Interface

**Description:** Deploy a GraphQL server that exposes the knowledge base with typed queries.

**Evaluation:**

| Criterion | Score (1-10) | Notes |
|-----------|--------------|-------|
| Simplicity | 5 | Complex to set up and maintain |
| Security | 7 | Can implement field-level auth |
| Performance | 6 | Query parsing overhead |
| Cross-platform | 8 | GraphQL clients available |
| Ease of use | 6 | GraphQL learning curve |

**Verdict:** Overkill for this use case. REST or MCP provides sufficient flexibility.

---

### Option 5: Unix Socket / Local IPC

**Description:** Expose PostgreSQL via Unix socket for local-only access.

**Evaluation:**

| Criterion | Score (1-10) | Notes |
|-----------|--------------|-------|
| Simplicity | 4 | Docker socket mounting complex |
| Security | 9 | Local-only access |
| Performance | 10 | Fastest possible |
| Cross-platform | 3 | macOS/Linux only |
| Ease of use | 3 | Complex configuration |

**Verdict:** Too platform-specific. Not recommended for cross-project access.

---

### Option 6: Shared Volume Approach

**Description:** Mount the PostgreSQL data directory as a shared volume accessible by other containers.

**Verdict:** Dangerous. PostgreSQL does not support concurrent access from multiple instances. Data corruption risk.

---

## Recommended Architecture

### Primary: MCP Server (`ruvector-kb-mcp`)

**Why MCP?**
1. **Native Claude Code Integration:** Claude Code already understands MCP tools
2. **Natural Language Interface:** Queries become simple tool calls
3. **Schema Isolation:** MCP enforces project boundaries
4. **Zero Configuration:** Add to `~/.claude.json` once, works everywhere
5. **Audit Trail:** MCP logs all access

**Implementation:**

```javascript
// ~/.npm-global/lib/node_modules/ruvector-kb-mcp/src/server.js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5435,
  database: 'postgres',
  user: 'postgres',
  password: 'guruKB2025'
});

const tools = [
  {
    name: 'kb_search',
    description: 'Semantic search across knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query' },
        schema: { type: 'string', description: 'Project schema (e.g., askruvnet)' },
        limit: { type: 'number', default: 10 }
      },
      required: ['query', 'schema']
    }
  },
  {
    name: 'kb_retrieve',
    description: 'Retrieve specific knowledge entry by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        schema: { type: 'string' }
      },
      required: ['id', 'schema']
    }
  },
  {
    name: 'kb_ingest',
    description: 'Add new knowledge to the database',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        source: { type: 'string' },
        schema: { type: 'string' }
      },
      required: ['title', 'content', 'schema']
    }
  },
  {
    name: 'kb_list_schemas',
    description: 'List available knowledge base schemas',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'kb_stats',
    description: 'Get statistics for a schema',
    inputSchema: {
      type: 'object',
      properties: { schema: { type: 'string' } },
      required: ['schema']
    }
  }
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'kb_search':
      const { query, schema, limit = 10 } = args;
      const searchResult = await pool.query(`
        SELECT id, title, content, source,
               1 - (embedding <=> ruvector_embed($1)) AS similarity
        FROM ${schema}.guru_knowledge
        ORDER BY embedding <=> ruvector_embed($1)
        LIMIT $2
      `, [query, limit]);
      return searchResult.rows;

    case 'kb_retrieve':
      const { id, schema: s } = args;
      const retrieveResult = await pool.query(
        `SELECT * FROM ${s}.guru_knowledge WHERE id = $1`,
        [id]
      );
      return retrieveResult.rows[0];

    case 'kb_ingest':
      const { title, content, source, schema: sch } = args;
      const insertResult = await pool.query(`
        INSERT INTO ${sch}.guru_knowledge (title, content, source, embedding)
        VALUES ($1, $2, $3, ruvector_embed($4))
        RETURNING id
      `, [title, content, source, title + ' ' + content]);
      return { id: insertResult.rows[0].id, status: 'ingested' };

    case 'kb_list_schemas':
      const schemas = await pool.query(`
        SELECT nspname FROM pg_namespace
        WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'public')
      `);
      return schemas.rows.map(r => r.nspname);

    case 'kb_stats':
      const { schema: statSchema } = args;
      const stats = await pool.query(`
        SELECT COUNT(*) as count,
               pg_size_pretty(pg_total_relation_size('${statSchema}.guru_knowledge')) as size
        FROM ${statSchema}.guru_knowledge
      `);
      return stats.rows[0];
  }
}
```

**Configuration (`~/.claude.json`):**

```json
{
  "mcpServers": {
    "ruvector-kb": {
      "command": "npx",
      "args": ["ruvector-kb-mcp", "start"],
      "env": {
        "RUVECTOR_KB_HOST": "localhost",
        "RUVECTOR_KB_PORT": "5435",
        "RUVECTOR_KB_PASSWORD": "guruKB2025"
      }
    }
  }
}
```

**Usage from Any Claude Code Session:**

```
> Search the knowledge base for information about agent spawning

[Claude uses kb_search tool with query="agent spawning" schema="askruvnet"]

Found 5 relevant entries:
1. Agent Spawning Patterns (score: 0.89)
2. Swarm Coordination Guide (score: 0.82)
...
```

---

### Secondary: Direct PostgreSQL Access (Fallback)

**When to Use:**
- MCP server not running
- Need raw SQL power
- Bulk operations
- Non-Claude-Code consumers

**Connection String:**
```
postgresql://postgres:guruKB2025@localhost:5435/postgres
```

**CLI Wrapper Script (`kb`):**

```bash
#!/bin/bash
# ~/.local/bin/kb - Knowledge Base CLI

PGPASSWORD="guruKB2025"
PGHOST="localhost"
PGPORT="5435"
PGUSER="postgres"
PGDB="postgres"

case "$1" in
  search)
    shift
    SCHEMA="${1:-askruvnet}"
    shift
    QUERY="$*"
    PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDB -c "
      SELECT id, title,
             LEFT(content, 200) || '...' as preview,
             ROUND((1 - (embedding <=> ruvector_embed('$QUERY')))::numeric, 3) as score
      FROM $SCHEMA.guru_knowledge
      ORDER BY embedding <=> ruvector_embed('$QUERY')
      LIMIT 10;
    "
    ;;
  get)
    SCHEMA="${2:-askruvnet}"
    ID="$3"
    PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDB -c "
      SELECT * FROM $SCHEMA.guru_knowledge WHERE id = $ID;
    "
    ;;
  stats)
    SCHEMA="${2:-askruvnet}"
    PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDB -c "
      SELECT
        '$SCHEMA' as schema,
        COUNT(*) as vectors,
        pg_size_pretty(pg_total_relation_size('$SCHEMA.guru_knowledge')) as size
      FROM $SCHEMA.guru_knowledge;
    "
    ;;
  schemas)
    PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDB -c "
      SELECT nspname as schema FROM pg_namespace
      WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'public')
      ORDER BY nspname;
    "
    ;;
  *)
    echo "Usage: kb <command> [args]"
    echo ""
    echo "Commands:"
    echo "  search <schema> <query>  - Semantic search"
    echo "  get <schema> <id>        - Get entry by ID"
    echo "  stats <schema>           - Show statistics"
    echo "  schemas                  - List available schemas"
    ;;
esac
```

---

## Implementation Complexity

| Component | Effort | Priority |
|-----------|--------|----------|
| MCP Server | 2-3 hours | High |
| kb CLI wrapper | 30 mins | Medium |
| REST API | 4-6 hours | Low (optional) |
| Documentation | 1 hour | High |

---

## Security Considerations

### Schema Isolation

Each project gets its own schema:
```sql
CREATE SCHEMA IF NOT EXISTS myproject;
CREATE TABLE myproject.guru_knowledge (
  -- same structure as askruvnet.guru_knowledge
);
```

### Access Control (Future Enhancement)

```sql
-- Create read-only role for consumers
CREATE ROLE kb_reader;
GRANT USAGE ON SCHEMA askruvnet TO kb_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA askruvnet TO kb_reader;

-- Create project-specific roles
CREATE ROLE askruvnet_admin;
GRANT ALL ON SCHEMA askruvnet TO askruvnet_admin;
```

### MCP-Level Validation

The MCP server should validate schema names to prevent SQL injection:

```javascript
const ALLOWED_SCHEMAS = ['askruvnet', 'presenter_mode', 'ruvector_test'];

function validateSchema(schema) {
  if (!ALLOWED_SCHEMAS.includes(schema)) {
    throw new Error(`Invalid schema: ${schema}`);
  }
}
```

---

## Cross-Project Usage Example

### From Ask-Ruvnet (This Project)

```
> What do we know about retirement planning?

[kb_search query="retirement planning" schema="askruvnet"]
```

### From Presenter Project

```
> Search for presentation templates

[kb_search query="presentation templates" schema="presenter_mode"]
```

### From New Project (First Time)

```
> Initialize knowledge base for my new project "financial-advisor"

[kb_create_schema schema="financial_advisor"]
[kb_ingest schema="financial_advisor" ...]
```

---

## Decision Matrix

| Criterion | Weight | MCP Server | REST API | Direct PG |
|-----------|--------|------------|----------|-----------|
| Claude Code Native | 30% | 10 | 5 | 3 |
| External Access | 20% | 6 | 10 | 8 |
| Security | 20% | 8 | 7 | 5 |
| Performance | 15% | 7 | 7 | 10 |
| Maintenance | 15% | 7 | 5 | 9 |
| **Weighted Score** | | **7.75** | **6.65** | **6.35** |

---

## Recommended Implementation Order

1. **Phase 1 (Immediate):** Create `kb` CLI wrapper for direct access
2. **Phase 2 (This Week):** Build and deploy MCP server
3. **Phase 3 (Optional):** Add REST API if external access needed

---

## Appendix: Quick Reference

### Connection Details

```
Host: localhost
Port: 5435
Database: postgres
User: postgres
Password: guruKB2025
```

### Key SQL Functions

**IMPORTANT:** The `<=>` (cosine distance) operator requires `ruvector` type, but
`ruvector_embed()` returns `real[]`. You must convert arrays to ruvector type:

```sql
-- Generate embedding (returns real[])
SELECT ruvector_embed('your text here');

-- Convert real[] to ruvector type
SELECT ('[' || array_to_string(ruvector_embed('text'), ',') || ']')::ruvector;

-- Semantic search with proper type conversion
SELECT
    id, title, content,
    ROUND((1 - (
        ('[' || array_to_string(embedding, ',') || ']')::ruvector
        <=>
        ('[' || array_to_string(ruvector_embed('query'), ',') || ']')::ruvector
    ))::numeric, 3) as score
FROM askruvnet.guru_knowledge
WHERE embedding IS NOT NULL
ORDER BY
    ('[' || array_to_string(embedding, ',') || ']')::ruvector
    <=>
    ('[' || array_to_string(ruvector_embed('query'), ',') || ']')::ruvector
LIMIT 10;

-- Insert with auto-embedding
INSERT INTO askruvnet.guru_knowledge (title, content, source, embedding)
VALUES ('Title', 'Content', 'source.md', ruvector_embed('Title Content'));
```

**Future Improvement:** Consider migrating the `embedding` column from `real[]`
to native `ruvector` type to eliminate the conversion overhead.

### Available Embedding Models

| Model | Dimensions | Speed | Quality |
|-------|------------|-------|---------|
| all-MiniLM-L6-v2 | 384 | Fast | Good |
| BAAI/bge-small-en-v1.5 | 384 | Fast | Better |
| BAAI/bge-base-en-v1.5 | 768 | Medium | High |
| BAAI/bge-large-en-v1.5 | 1024 | Slow | Highest |

---

## Conclusion

**Primary Recommendation:** MCP Server integration provides the best balance of Claude Code native experience, security through schema isolation, and ease of use across projects.

**Secondary Recommendation:** Direct PostgreSQL access via the `kb` CLI wrapper serves as a reliable fallback and enables use from non-Claude-Code contexts.

The architecture allows the knowledge base to serve as a shared resource while maintaining project isolation through PostgreSQL schemas.
