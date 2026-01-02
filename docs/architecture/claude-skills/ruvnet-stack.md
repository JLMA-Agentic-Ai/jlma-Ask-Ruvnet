Updated: 2025-12-30 14:25:00 EST | Version 3.0.0
Created: 2025-12-29 16:45:00 EST

# RuvNet Stack Skill

## Skill Overview

**Name:** `/ruvnet-stack` (RuvNet Ecosystem Installer)
**Purpose:** Install and configure the complete RuvNet AI ecosystem including claude-flow, agentic-flow, ruvector, ruvector-postgres, AND the kb-gateway MCP server.

---

## What This Does

1. **Starts ruvector-postgres** Docker container on port 5435
2. **Creates isolated schema** for this project
3. **Installs** claude-flow, agentic-flow, ruvector, @ruvector/ruvllm
4. **Initializes** claude-flow with agents and hive-mind
5. **Sets up kb-gateway** MCP server for KB-enforced code generation
6. **Copies ruvnet-knowledgebase-patterns** documentation

---

## Quick Install

```bash
# Install packages
npm install claude-flow@alpha agentic-flow@alpha ruvector @ruvector/ruvllm @ruvector/agentic-synth

# Start ruvector-postgres
docker run -d --name ruvector-kb \
  --restart=always \
  -e POSTGRES_PASSWORD=guruKB2025 \
  -p 5435:5432 \
  -v ruvector-kb-data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest

# Initialize claude-flow
npx claude-flow@alpha init --force
```

---

## Packages Included

| Package | Purpose |
|---------|---------|
| `claude-flow` | Enterprise orchestration, Hive Mind |
| `agentic-flow` | 150+ agents, 213 MCP tools |
| `ruvector` | Vector database with HNSW |
| `ruvector-postgres` | PostgreSQL + pgvector |
| `kb-gateway` | MCP server for KB-enforced code generation |

---

## KB-Gateway MCP Server

**This is the most important component.** It makes KB the ONLY path to code generation.

### Setup

The kb-gateway MCP server should already be installed at:
```
~/.claude/mcp-servers/kb-gateway/
```

If not, create it:
```bash
mkdir -p ~/.claude/mcp-servers/kb-gateway/{bin,src}
# Copy server.js, cli.js, package.json from reference implementation
```

### Registration

Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "kb-gateway": {
      "command": "node",
      "args": ["~/.claude/mcp-servers/kb-gateway/src/server.js"],
      "type": "stdio",
      "env": {
        "RUVECTOR_PG_HOST": "localhost",
        "RUVECTOR_PG_PORT": "5435",
        "RUVECTOR_PG_PASSWORD": "guruKB2025"
      },
      "enabled": true
    }
  }
}
```

### Tools Provided

| Tool | Purpose |
|------|---------|
| `kb_code_gen` | **PRIMARY** - Generate code from KB patterns |
| `kb_search` | Query KB for patterns |
| `kb_status` | Check connection/stats |
| `kb_validate` | Validate code compliance |

---

## Documentation Folder

After running `/ruvnet-stack`, copy the KB patterns documentation to your project:

```bash
# Copy to project
cp -r ~/.claude/docs/ruvnet-knowledgebase-patterns docs/

# Or if using the Ask-Ruvnet reference:
cp -r /path/to/Ask-Ruvnet/docs/ruvnet-knowledgebase-patterns docs/
```

### Required Documents

| File | Purpose |
|------|---------|
| `knowledge-base-patterns.md` | Quick reference, Golden Rule |
| `kb-construction.md` | HOW to build KB |
| `kb-agent-integration.md` | Anti-simplification patterns |
| `kb-production.md` | Deployment guide |
| `kb-gateway-architecture.md` | **MCP server for code generation** |

---

## Complete Setup Workflow

```bash
# 1. Install packages
npm install claude-flow@alpha agentic-flow@alpha ruvector @ruvector/ruvllm

# 2. Start ruvector-postgres (if not running)
docker ps | grep ruvector-kb || \
docker run -d --name ruvector-kb \
  --restart=always \
  -e POSTGRES_PASSWORD=guruKB2025 \
  -p 5435:5432 \
  -v ruvector-kb-data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest

# 3. Create schema for this project
SCHEMA=$(basename $(pwd) | tr '[:upper:]' '[:lower:]' | tr '-' '_')
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -c "
CREATE SCHEMA IF NOT EXISTS $SCHEMA;
CREATE TABLE IF NOT EXISTS $SCHEMA.architecture_docs (
  id SERIAL PRIMARY KEY,
  doc_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT NOT NULL,
  section_header TEXT,
  section_index INTEGER DEFAULT 0,
  file_hash TEXT NOT NULL,
  embedding real[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fts_$SCHEMA ON $SCHEMA.architecture_docs
  USING gin(to_tsvector('english', title || ' ' || content));
"

# 4. Initialize claude-flow
npx claude-flow@alpha init --force

# 5. Verify kb-gateway MCP is registered
cat ~/.claude.json | jq '.mcpServers["kb-gateway"]'

# 6. Copy documentation
mkdir -p docs/ruvnet-knowledgebase-patterns
cp ~/.claude/docs/ruvnet-knowledgebase-patterns/*.md docs/ruvnet-knowledgebase-patterns/ 2>/dev/null || true
```

---

## Verification

```bash
# Check Docker
docker ps | grep ruvector-kb

# Check database connection
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -c "SELECT 1"

# Check schema exists
SCHEMA=$(basename $(pwd) | tr '[:upper:]' '[:lower:]' | tr '-' '_')
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -c "\dn" | grep $SCHEMA

# Check MCP registration
cat ~/.claude.json | jq '.mcpServers | keys'

# Test kb-gateway
node ~/.claude/mcp-servers/kb-gateway/bin/cli.js status
```

---

## Related Commands

| Command | Purpose |
|---------|---------|
| `/ruvnet-update` | Update packages |
| `/ruvnet-kb` | Link tool knowledge |
| `/ruvnet-kb-visual` | KB visualization |
| `/kb-build` | Full KB workflow automation |

---

## After Installation

1. **Read ALL documents** in `docs/ruvnet-knowledgebase-patterns/`
2. **Ingest your content** to the KB
3. **Run quality loop** until scores ≥ 98
4. **Generate visualization** with `/ruvnet-kb-visual`
5. **Build apps** using `kb_code_gen` (NOT raw `Write`)

---

## The Golden Rule

```
Code MUST go through kb_code_gen, NOT raw Write.
Every file MUST have KB citation header.
No code without KB query first.
No "slop" - generic code that ignores KB.
```
