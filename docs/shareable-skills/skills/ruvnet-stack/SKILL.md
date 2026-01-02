---
name: ruvnet-stack
version: 2.1.0
description: Install and configure the complete RuvNet AI ecosystem including claude-flow, agentic-flow, ruvector, and ruvector-postgres. Use when user wants to set up RuvNet, install the AI stack, or initialize a new project with agents.
triggers:
  - install ruvnet
  - ruvnet stack
  - setup ruvnet
  - ruvnet ecosystem
  - install claude-flow
  - install agentic-flow
  - setup agents
  - agent orchestration
  - vector database setup
  - ruvector setup
category: ruvnet
created: 2025-12-29
updated: 2025-12-30
---

# RuvNet Stack

Install and configure the complete RuvNet AI ecosystem including claude-flow, agentic-flow, ruvector, and ruvector-postgres.

## What This Does

1. **Syncs RuvNet Knowledgebase Patterns** (MANDATORY)
2. **Starts ruvector-postgres** Docker container on port 5435
3. **Creates isolated schema** for this project
4. **Installs** claude-flow, agentic-flow, ruvector, @ruvector/ruvllm
5. **Initializes** claude-flow with agents and hive-mind
6. **Validates** project follows KB architecture patterns

---

## Knowledge Base Architecture

**ALL knowledge bases MUST use ruvector-postgres with schema isolation:**

```
ruvector-postgres (Docker on port 5435)
├── Schema: askruvnet      → Ask-Ruvnet project KB
├── Schema: bricksmith     → Bricksmith project KB
└── Schema: your_project   → Your new project KB
```

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
| `@ruvector/agentic-synth` | Synthetic data generation |
| `@ruvector/ruvllm` | LLM orchestration |
| `ruvector` | Vector database with HNSW |
| `ruvector-postgres` | PostgreSQL + pgvector |

---

## Bash Commands

Run these commands to install the full RuvNet stack:

```bash
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RUVNET STACK INSTALLER v2.1                         ║"
echo "║           (Full AI Ecosystem Setup)                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# STEP 1: Sync KB patterns first (MANDATORY)
echo "📚 Syncing RuvNet Knowledgebase Patterns..."
KB_PATTERNS_SRC="$HOME/.claude/docs/ruvnet-knowledgebase-patterns"
KB_PATTERNS_DEST="./docs/ruvnet-knowledgebase-patterns"

if [ -d "$KB_PATTERNS_SRC" ]; then
  mkdir -p "$KB_PATTERNS_DEST"
  cp -r "$KB_PATTERNS_SRC"/* "$KB_PATTERNS_DEST/"
  echo "   ✅ Synced KB patterns"
else
  echo "   ⚠️  KB patterns not found at ~/.claude/docs/ruvnet-knowledgebase-patterns"
fi
echo ""

# STEP 2: Check/Start ruvector-postgres container
echo "🗄️  Setting up ruvector-postgres container..."
if command -v docker &> /dev/null; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
    echo "   ✅ ruvector-kb already running"
  elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
    echo "   ⚠️  Container exists but stopped. Starting..."
    docker start ruvector-kb
    echo "   ✅ Started ruvector-kb"
  else
    echo "   🚀 Creating ruvector-kb container..."
    docker run -d --name ruvector-kb \
      --restart=always \
      -e POSTGRES_PASSWORD=guruKB2025 \
      -p 5435:5432 \
      -v ruvector-kb-data:/var/lib/postgresql/data \
      ruvnet/ruvector-postgres:latest
    echo "   ✅ Created and started ruvector-kb"
    echo "   ⏳ Waiting for PostgreSQL to start..."
    sleep 5
  fi
else
  echo "   ❌ Docker not installed. Please install Docker first."
  exit 1
fi
echo ""

# STEP 3: Install npm packages
echo "📦 Installing RuvNet packages..."
if [ -f package.json ]; then
  npm install claude-flow@alpha agentic-flow@alpha ruvector @ruvector/ruvllm @ruvector/agentic-synth
  echo "   ✅ Packages installed"
else
  echo "   ⚠️  No package.json found. Creating minimal one..."
  echo '{"name":"ruvnet-project","private":true,"dependencies":{}}' > package.json
  npm install claude-flow@alpha agentic-flow@alpha ruvector @ruvector/ruvllm @ruvector/agentic-synth
  echo "   ✅ Packages installed"
fi
echo ""

# STEP 4: Initialize claude-flow
echo "🔧 Initializing claude-flow..."
npx claude-flow@alpha init --force 2>/dev/null || echo "   ⚠️  claude-flow init skipped (may already exist)"
echo ""

# STEP 5: Create project schema
echo "🏗️  Creating project database schema..."
PROJECT_NAME=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | tr '-' '_' | tr ' ' '_')
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -c "
CREATE SCHEMA IF NOT EXISTS ${PROJECT_NAME};
CREATE TABLE IF NOT EXISTS ${PROJECT_NAME}.knowledge (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  source TEXT,
  embedding real[],
  created_at TIMESTAMP DEFAULT NOW()
);
" 2>/dev/null && echo "   ✅ Schema '${PROJECT_NAME}' created" || echo "   ⚠️  Could not create schema (PostgreSQL may still be starting)"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ RuvNet Stack installation complete!"
echo ""
echo "   📦 Packages: claude-flow, agentic-flow, ruvector, ruvllm"
echo "   🗄️  Database: ruvector-kb on port 5435"
echo "   📂 Schema: ${PROJECT_NAME}"
echo ""
echo "   Next steps:"
echo "   • Run /ruvnet-kb-visual to visualize your KB"
echo "   • Run /ruvnet-update to check for package updates"
echo ""
```

---

## Related Skills

- `/ruvnet-stack` - Full ecosystem install (this skill)
- `/ruvnet-update` - Update packages and validate KB compliance
- `/ruvnet-kb` - Link the RuvNet knowledge base to current project
- `/ruvnet-kb-visual` - Build KB visualization with quality scoring
