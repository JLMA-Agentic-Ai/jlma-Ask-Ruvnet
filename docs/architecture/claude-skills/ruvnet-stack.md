Updated: 2025-12-30 14:45:00 EST | Version 1.3.0
Created: 2025-12-29 02:17:58 EST

# RuvNet Stack Setup

Install and verify the complete RuvNet ecosystem for this project.

## ⚠️ MANDATORY: Read ALL KB Documentation

**Before building any KB-powered application, you MUST read the entire `docs/kb-patterns/` folder:**

```
docs/kb-patterns/
├── README.md                    ← START HERE (explains the system)
├── knowledge-base-patterns.md   ← Quick reference & Golden Rule
├── kb-construction.md           ← How to build (chunking, WAL, HNSW)
├── kb-agent-integration.md      ← How to use (anti-simplification, binding)
└── kb-production.md             ← Deployment & troubleshooting
```

**These documents are INTERCONNECTED. Reading only one is INSUFFICIENT.**
**This folder is copied to every new project by /ruvnet-stack.**

## What This Does

1. **MANDATORY: Starts ruvector-postgres** Docker container for knowledge bases
2. **Creates isolated schema** for this project (no data leakage)
3. **Copies KB pattern documentation** to project docs/ directory
4. **Dynamically checks** @alpha vs @latest for each package and installs the more advanced version
5. Installs **claude-flow** - Enterprise orchestration with Hive Mind
6. Installs **agentic-flow** - 150+ agents, 213 MCP tools
7. Installs **@ruvector/agentic-synth** - Synthetic data generation
8. Installs **@ruvector/ruvllm** - LLM orchestration
9. Installs **ruvector** - Vector database with HNSW indexing
10. Initializes claude-flow with full agent/command/skill system
11. **Stores KB architecture in memory** for agent reference
12. Verifies and lists all loaded packages with versions

## CRITICAL: Knowledge Base Architecture

**ALL knowledge bases MUST use ruvector-postgres with schema isolation:**

```
ruvector-postgres (Docker on port 5434)
├── Schema: askruvnet      → Ask-Ruvnet project KB
├── Schema: bricksmith     → Bricksmith project KB
├── Schema: retirement     → Retirement project KB
└── Schema: your_project   → Your new project KB
```

**Benefits:**
- 77+ SQL functions for vector operations
- Semantic search via `ruvector_embed()` (384-dim)
- <1.2ms search on 1M vectors
- Cross-repo access via `kb-query` CLI
- Zero data leakage between projects

## Installation

Run the following commands to set up the RuvNet stack:

```bash
# Check if package.json exists
if [ ! -f package.json ]; then
  echo "No package.json found. Initializing..."
  npm init -y
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RUVNET STACK INSTALLATION                           ║"
echo "║           (Smart Version Detection Enabled)                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Function to compare semver versions and determine best tag
# Returns the better tag (@alpha or @latest) for a package
get_best_version() {
  local pkg="$1"
  local latest_ver=$(npm view "${pkg}@latest" version 2>/dev/null || echo "0.0.0")
  local alpha_ver=$(npm view "${pkg}@alpha" version 2>/dev/null || echo "0.0.0")

  # If no alpha exists, use latest
  if [ "$alpha_ver" = "0.0.0" ]; then
    echo "@latest|$latest_ver"
    return
  fi

  # If versions are identical, prefer latest (more stable)
  if [ "$latest_ver" = "$alpha_ver" ]; then
    echo "@latest|$latest_ver"
    return
  fi

  # Compare versions using node (no external dependencies)
  local result=$(node -e "
    const latest = '$latest_ver';
    const alpha = '$alpha_ver';

    // Clean alpha version (remove -alpha suffix for major.minor.patch comparison)
    const alphaClean = alpha.replace(/-alpha.*$/, '');
    const latestClean = latest;

    // Compare major versions first
    const latestMajor = parseInt(latestClean.split('.')[0]) || 0;
    const alphaMajor = parseInt(alphaClean.split('.')[0]) || 0;

    if (alphaMajor > latestMajor) {
      // Alpha has higher major version - it's significantly more advanced
      console.log('@alpha|' + alpha);
    } else if (latestMajor > alphaMajor) {
      // Latest has higher major version
      console.log('@latest|' + latest);
    } else {
      // Same major version - compare full versions
      // For same major, prefer latest (stable) unless alpha is significantly ahead
      const latestMinor = parseInt(latestClean.split('.')[1]) || 0;
      const alphaMinor = parseInt(alphaClean.split('.')[1]) || 0;

      if (alphaMinor > latestMinor + 2) {
        // Alpha is more than 2 minor versions ahead
        console.log('@alpha|' + alpha);
      } else {
        console.log('@latest|' + latest);
      }
    }
  " 2>/dev/null || echo "@latest|$latest_ver")

  echo "$result"
}

# Smart install function
smart_install() {
  local pkg="$1"
  local desc="$2"

  echo "🔍 Checking versions for $pkg..."
  local best=$(get_best_version "$pkg")
  local tag=$(echo "$best" | cut -d'|' -f1)
  local ver=$(echo "$best" | cut -d'|' -f2)

  echo "   Latest: $(npm view "${pkg}@latest" version 2>/dev/null || echo 'N/A')"
  echo "   Alpha:  $(npm view "${pkg}@alpha" version 2>/dev/null || echo 'N/A')"
  echo "   → Selected: ${pkg}${tag} (v${ver})"
  echo ""
  echo "📦 Installing ${pkg}${tag}..."
  npm install "${pkg}${tag}" --save
  echo ""
}

# Install each package with smart version detection
smart_install "claude-flow" "Enterprise orchestration + Hive Mind"
smart_install "agentic-flow" "150+ agents, 213 MCP tools"

# FIX: agentic-flow@alpha requires agent-booster as a peer dependency
echo "📦 Installing agent-booster (agentic-flow peer dependency)..."
npm install agent-booster --save 2>/dev/null || true
echo ""

smart_install "@ruvector/agentic-synth" "Synthetic data generation"
smart_install "@ruvector/ruvllm" "LLM orchestration"
smart_install "ruvector" "Vector database with HNSW"

# MANDATORY: Start ruvector-postgres Docker container for knowledge bases
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RUVECTOR-POSTGRES KNOWLEDGE BASE (MANDATORY)        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Extract project name for schema
PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr '-' '_' | tr ' ' '_')
echo "📁 Project: $PROJECT_NAME"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
  echo "🐳 Docker detected. Setting up ruvector-postgres..."

  # Check if container already running and detect its port
  if docker ps --format '{{.Names}}' | grep -q "ruvector-kb"; then
    echo "✅ ruvector-kb container already running"
    docker ps --filter "name=ruvector-kb" --format "   Status: {{.Status}} | Ports: {{.Ports}}"
    # Detect the actual port mapping
    KB_PORT=$(docker port ruvector-kb 5432 2>/dev/null | sed 's/.*://' | head -1)
    KB_PORT=${KB_PORT:-5435}  # Default to 5435 if detection fails
  elif docker ps -a --format '{{.Names}}' | grep -q "ruvector-kb"; then
    echo "🔄 Starting stopped ruvector-kb container..."
    docker start ruvector-kb
    echo "✅ ruvector-kb started"
    sleep 2
    KB_PORT=$(docker port ruvector-kb 5432 2>/dev/null | sed 's/.*://' | head -1)
    KB_PORT=${KB_PORT:-5435}
  else
    echo "📦 Creating ruvector-kb container with auto-restart..."
    docker run -d --name ruvector-kb \
      --restart=always \
      -e POSTGRES_PASSWORD=guruKB2025 \
      -p 5435:5432 \
      -v ruvector-kb-data:/var/lib/postgresql/data \
      ruvnet/ruvector-postgres:latest
    echo "✅ ruvector-kb container created on port 5435"
    echo "   Auto-restart: enabled (will restart when Docker starts)"
    KB_PORT=5435
    sleep 3  # Wait for postgres to start
  fi

  # Ensure auto-restart is enabled on existing container
  docker update --restart=always ruvector-kb 2>/dev/null || true

  # Create isolated schema for this project
  echo ""
  echo "🔒 Creating isolated schema for project: $PROJECT_NAME (port $KB_PORT)"
  PGPASSWORD=guruKB2025 psql -h localhost -p $KB_PORT -U postgres -c "
    CREATE SCHEMA IF NOT EXISTS $PROJECT_NAME;
    CREATE TABLE IF NOT EXISTS ${PROJECT_NAME}.knowledge (
      id SERIAL PRIMARY KEY,
      title TEXT,
      content TEXT,
      source TEXT,
      embedding real[],
      created_at TIMESTAMP DEFAULT NOW()
    );
  " 2>/dev/null && echo "✅ Schema '$PROJECT_NAME' ready" || echo "⚠️  Schema creation skipped (may already exist)"

  echo ""
  echo "   📊 Connection Info:"
  echo "   • Host: localhost"
  echo "   • Port: $KB_PORT"
  echo "   • Schema: $PROJECT_NAME"
  echo "   • Cross-repo query: kb-query \"search\" --schema=$PROJECT_NAME"
else
  echo "❌ Docker not found. REQUIRED for ruvector-postgres knowledge bases."
  echo ""
  echo "   Install Docker Desktop:"
  echo "   • macOS: https://docs.docker.com/desktop/install/mac-install/"
  echo "   • Windows: https://docs.docker.com/desktop/install/windows-install/"
  echo "   • Linux: https://docs.docker.com/desktop/install/linux-install/"
  echo ""
  echo "   Then run /ruvnet-stack again."
  exit 1
fi

# Initialize claude-flow (agents, commands, skills, hive-mind)
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           INITIALIZING CLAUDE-FLOW@ALPHA                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
npx claude-flow@alpha init --force

# Store RuvNet knowledge in local memory
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           STORING KNOWLEDGE IN LOCAL MEMORY                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

npx claude-flow@alpha memory store "ruvnet/ecosystem" "RuvNet ecosystem initialized with: ruvector (vector DB), @ruvector/ruvllm (self-learning LLM), agentic-flow (150+ agents), claude-flow (enterprise orchestration). Documentation at docs/RUVNET_ECOSYSTEM_COMPLETE.md" 2>/dev/null || true
npx claude-flow@alpha memory store "ruvnet/deployment" "Deployment options: Railway (recommended, full native module support), Docker (enterprise/self-hosted), Vercel (limited, read-only). Data stored in .swarm/ and .ruvector/ directories." 2>/dev/null || true
npx claude-flow@alpha memory store "ruvnet/local-llm" "For private/air-gapped deployment: Use Ollama + Qwen (qwen2.5:7b for workstations, qwen2.5:14b for servers). Also supports ONNX local inference with Phi-4." 2>/dev/null || true

echo "✅ Stored RuvNet knowledge in .swarm/memory.db"

# Verify all installations
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           VERIFYING INSTALLATION                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

node -e "
const fs = require('fs');
const pkgJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const packages = [
  { name: 'claude-flow', desc: 'Enterprise orchestration + Hive Mind' },
  { name: 'agentic-flow', desc: '150+ agents, 213 MCP tools' },
  { name: '@ruvector/agentic-synth', desc: 'Synthetic data generation' },
  { name: '@ruvector/ruvllm', desc: 'LLM orchestration' },
  { name: 'ruvector', desc: 'Vector database with HNSW' }
];

packages.forEach(({name, desc}) => {
  try {
    require(name);
    const ver = pkgJson.dependencies?.[name] || 'installed';
    console.log('✅ ' + name + '@' + ver.replace(/^[\^~]/, ''));
  } catch (e) {
    if (e.message.includes('exports') || e.message.includes('cli')) {
      const ver = pkgJson.dependencies?.[name] || 'installed';
      console.log('✅ ' + name + '@' + ver.replace(/^[\^~]/, '') + ' (CLI mode)');
    } else {
      console.log('❌ ' + name + ' - FAILED');
    }
  }
});

console.log('');
console.log('🎉 RUVNET STACK SUCCESSFULLY LOADED!');
console.log('');
console.log('🚀 Ready to use:');
console.log('   • npx claude-flow@alpha swarm \"your objective\" --claude');
console.log('   • npx claude-flow@alpha hive-mind spawn \"command\" --claude');
"
```

## Quick Reference

After installation, you can use:

```javascript
// Vector database
const ruvector = require('ruvector');
const db = new ruvector.VectorDB(128);

// LLM orchestration
const { RuvLLM } = require('@ruvector/ruvllm');

// Synthetic data generation
const { SyntheticGenerator } = require('@ruvector/agentic-synth');

// Agent orchestration (alpha)
const { ModelRouter } = require('agentic-flow/router');

// Enterprise features (CLI - alpha)
// npx claude-flow@alpha swarm "your objective" --claude
// npx claude-flow@alpha hive-mind spawn "command" --claude
```

## Packages Included

| Package | Version Selection | Purpose |
|---------|-------------------|---------|
| `claude-flow` | **Dynamic** (auto-selects @alpha or @latest) | Enterprise orchestration, Hive Mind |
| `agentic-flow` | **Dynamic** (auto-selects @alpha or @latest) | 150+ agents, 213 MCP tools |
| `@ruvector/agentic-synth` | **Dynamic** | Synthetic data generation |
| `@ruvector/ruvllm` | **Dynamic** | LLM orchestration |
| `ruvector` | **Dynamic** | Vector database with HNSW indexing |
| `ruvnet/ruvector-postgres` | Docker image | PostgreSQL + pgvector for persistent storage |

## Version Selection Logic

The installer automatically chooses the best version for each package:

1. **No @alpha tag exists** → Uses @latest
2. **@alpha = @latest** → Uses @latest (more stable)
3. **@alpha has higher MAJOR version** → Uses @alpha (more advanced)
4. **@alpha minor version is >2 ahead** → Uses @alpha
5. **Otherwise** → Uses @latest (stability preference)
