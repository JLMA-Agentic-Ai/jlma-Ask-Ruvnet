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

# RuvNet Stack Setup

Install and verify the complete RuvNet ecosystem for this project.

## What This Does

1. **Syncs RuvNet Knowledgebase Patterns** (MANDATORY architecture docs)
2. **READS AND INTERNALIZES** all KB pattern documents (Claude MUST do this)
3. **MANDATORY: Starts ruvector-postgres** Docker container for knowledge bases
4. **Creates isolated schema** for this project (no data leakage)
5. **Dynamically checks** @alpha vs @latest for each package
6. Installs **claude-flow** - Enterprise orchestration with Hive Mind
7. Installs **agentic-flow** - 150+ agents, 213 MCP tools
8. Installs **@ruvector/agentic-synth** - Synthetic data generation
9. Installs **@ruvector/ruvllm** - LLM orchestration
10. Installs **ruvector** - Vector database with HNSW indexing
11. **Validates** project follows KB architecture patterns

---

## CRITICAL INSTRUCTION FOR CLAUDE

After running the bash commands below, you MUST:

### Step 1: Read ALL KB Pattern Documents (IN ORDER)

```
docs/ruvnet-knowledgebase-patterns/README.md
docs/ruvnet-knowledgebase-patterns/knowledge-base-patterns.md
docs/ruvnet-knowledgebase-patterns/kb-construction.md
docs/ruvnet-knowledgebase-patterns/kb-agent-integration.md
docs/ruvnet-knowledgebase-patterns/kb-production.md
```

Use the Read tool to read each file. These are INTERCONNECTED - reading only one is INSUFFICIENT.

### Step 2: Internalize The Golden Rule

```
Agents MUST query the KB for EVERY question.
Agents MUST NOT simplify KB into rules.
Agents MUST cite sources in EVERY response.
```

### Step 3: Guide KB Setup

After reading the patterns, help the user:
- Set up their project's knowledge base following the patterns
- Implement `EnforcedKBAccess` wrapper if building agents
- Configure the Knowledge Universe visualization
- Follow anti-simplification patterns

### Step 4: Report Setup Status

Provide a setup report showing:
- What's properly configured
- What needs attention
- Next steps to complete KB setup

---

## Knowledge Base Architecture

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
echo "║           RUVNET STACK INSTALLATION v2.1                      ║"
echo "║           (KB Patterns + Packages + Compliance)               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# STEP 0: Sync ruvnet-knowledgebase-patterns documentation (MANDATORY FIRST)
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           SYNCING RUVNET KNOWLEDGEBASE PATTERNS               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
KB_PATTERNS_SRC="$HOME/.claude/docs/ruvnet-knowledgebase-patterns"
KB_PATTERNS_DEST="./docs/ruvnet-knowledgebase-patterns"

if [ -d "$KB_PATTERNS_SRC" ]; then
  mkdir -p "$KB_PATTERNS_DEST"
  cp -r "$KB_PATTERNS_SRC"/* "$KB_PATTERNS_DEST/"
  FILE_COUNT=$(ls -1 "$KB_PATTERNS_DEST"/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "✅ Synced $FILE_COUNT KB pattern documents to docs/ruvnet-knowledgebase-patterns/"
  echo ""
  echo "   ╔════════════════════════════════════════════════════════════╗"
  echo "   ║  CLAUDE: After install completes, you MUST READ all       ║"
  echo "   ║  files in docs/ruvnet-knowledgebase-patterns/ and         ║"
  echo "   ║  ensure the KB is built following these patterns!         ║"
  echo "   ╚════════════════════════════════════════════════════════════╝"
else
  echo "⚠️  Global KB patterns not found at ~/.claude/docs/ruvnet-knowledgebase-patterns"
  echo "   Run /ruvnet-update from Ask-Ruvnet project first to populate global patterns"
fi
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

# Copy RuvNet documentation to project
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           COPYING RUVNET DOCUMENTATION                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p docs/ruvnet
if [ -f "$HOME/.claude/knowledge/RUVNET_ECOSYSTEM_COMPLETE.md" ]; then
  cp "$HOME/.claude/knowledge/RUVNET_ECOSYSTEM_COMPLETE.md" docs/RUVNET_ECOSYSTEM_COMPLETE.md
  echo "✅ Copied RUVNET_ECOSYSTEM_COMPLETE.md to docs/"
else
  echo "⚠️  RUVNET_ECOSYSTEM_COMPLETE.md not found in ~/.claude/knowledge/"
fi

# Copy knowledge architecture documentation
if [ -f "$HOME/.claude/docs/ruvnet/KNOWLEDGE-ARCHITECTURE.md" ]; then
  cp "$HOME/.claude/docs/ruvnet/KNOWLEDGE-ARCHITECTURE.md" docs/ruvnet/KNOWLEDGE-ARCHITECTURE.md
  echo "✅ Copied KNOWLEDGE-ARCHITECTURE.md to docs/ruvnet/"
fi

# Link RuvNet Tool Knowledge (READ-ONLY) + Create Domain KB Structure
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           SETTING UP TWO-LAYER KNOWLEDGE ARCHITECTURE         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "   Layer 1: Tool Knowledge (HOW to use agentic tools) - READ-ONLY"
echo "   Layer 2: Domain Knowledge (YOUR project content) - READ-WRITE"
echo ""

# Create the two-layer structure
mkdir -p .ruvector/domain

if [ -d "$HOME/.claude/knowledge/ruvnet-kb" ]; then
  # Handle old single-KB structure (migrate if needed)
  if [ -L ".ruvector/knowledge-base" ]; then
    echo "📦 Migrating from old single-KB structure..."
    rm ".ruvector/knowledge-base"
  fi

  # Link tool knowledge
  if [ -L ".ruvector/ruvnet-tools" ]; then
    echo "✅ Tool knowledge already linked at .ruvector/ruvnet-tools/"
  else
    ln -s "$HOME/.claude/knowledge/ruvnet-kb" ".ruvector/ruvnet-tools"
    echo "✅ Linked tool knowledge (READ-ONLY)"
  fi

  # Show status
  VECTOR_COUNT=$(node -e "const m=require('$HOME/.claude/knowledge/ruvnet-kb/metadata.json');console.log(m.idIndex?m.idIndex.length:0)" 2>/dev/null || echo "unknown")
  echo ""
  echo "   📊 Tool Knowledge (ruvnet-tools/):"
  echo "   • Vectors: $VECTOR_COUNT"
  echo "   • Coverage: 38 features @ 100%"
  echo "   • Content: HOW to use agents, swarms, deployment"
  echo ""
  echo "   📁 Domain Knowledge (domain/):"
  echo "   • Location: .ruvector/domain/"
  echo "   • Content: YOUR project-specific docs"
  echo "   • Status: Ready for your content"
else
  echo "⚠️  Global tool knowledge not found at ~/.claude/knowledge/ruvnet-kb"
  echo "   Tool knowledge will not be available until it's built."
  echo ""
  echo "   📁 Domain Knowledge (domain/):"
  echo "   • Location: .ruvector/domain/"
  echo "   • Status: Ready for your content"
fi

echo ""
echo "   ┌─────────────────────────────────────────────────────────────┐"
echo "   │  Tool knowledge and domain knowledge are COMPLETELY        │"
echo "   │  SEPARATE. Your project content never mixes with tool      │"
echo "   │  documentation. Each project has its own domain/ folder.   │"
echo "   └─────────────────────────────────────────────────────────────┘"

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

# Verify all installations and display loaded packages
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           VERIFYING INSTALLATION                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

node -e "
const fs = require('fs');
const path = require('path');

// Read package.json to get installed versions
let pkgJson = {};
try {
  pkgJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
} catch (e) {}

const packages = [
  { name: 'claude-flow', pkg: 'claude-flow', desc: 'Enterprise orchestration + Hive Mind (ALPHA)' },
  { name: 'agentic-flow', pkg: 'agentic-flow', desc: '150+ agents, 213 MCP tools (ALPHA)' },
  { name: '@ruvector/agentic-synth', pkg: '@ruvector/agentic-synth', desc: 'Synthetic data generation for AI/ML' },
  { name: '@ruvector/ruvllm', pkg: '@ruvector/ruvllm', desc: 'LLM orchestration and routing' },
  { name: 'ruvector', pkg: 'ruvector', desc: 'Vector database with HNSW indexing' }
];

let allGood = true;
let loadedPackages = [];

packages.forEach(({name, pkg, desc}) => {
  try {
    require(pkg);
    // Get version from package.json dependencies
    let version = pkgJson.dependencies?.[name] || 'installed';
    version = version.replace('^', '').replace('~', '');
    loadedPackages.push({ name, version, desc, status: 'ok' });
    console.log('✅ ' + name + '@' + version);
  } catch (e) {
    // Check if it's just a package.json exports issue vs actual failure
    if (e.message.includes('Package subpath') || e.message.includes('cli.mjs') || e.message.includes('exports')) {
      let version = pkgJson.dependencies?.[name] || 'installed';
      version = version.replace('^', '').replace('~', '');
      loadedPackages.push({ name, version, desc, status: 'cli' });
      console.log('✅ ' + name + '@' + version + ' (CLI/MCP mode)');
    } else {
      console.log('❌ ' + name + ' - FAILED: ' + e.message.split('\n')[0]);
      allGood = false;
    }
  }
});

console.log('');
console.log('═══════════════════════════════════════════════════════════════');

if (allGood) {
  console.log('');
  console.log('🎉 RUVNET STACK SUCCESSFULLY LOADED!');
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           LOADED PACKAGES                                     ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  loadedPackages.forEach(p => {
    const line = '║ • ' + p.name.padEnd(28) + p.version.padEnd(12) + '║';
    console.log(line);
    console.log('║   ' + p.desc.padEnd(56) + '║');
  });
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🚀 Ready to use! Try these commands:');
  console.log('   • npx claude-flow@alpha swarm \"your objective\" --claude');
  console.log('   • npx claude-flow@alpha hive-mind spawn \"command\" --claude');
  console.log('   • npx agentic-flow@alpha --help');
  console.log('');
} else {
  console.log('');
  console.log('⚠️  Some packages failed to load. Check errors above.');
  console.log('');
}
"

# Final: Prompt Claude to read and understand the documentation
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           CLAUDE: MANDATORY READING REQUIRED                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📚 RuvNet Knowledgebase Patterns (READ ALL - IN ORDER):"
echo "   1. docs/ruvnet-knowledgebase-patterns/README.md"
echo "   2. docs/ruvnet-knowledgebase-patterns/knowledge-base-patterns.md"
echo "   3. docs/ruvnet-knowledgebase-patterns/kb-construction.md"
echo "   4. docs/ruvnet-knowledgebase-patterns/kb-agent-integration.md"
echo "   5. docs/ruvnet-knowledgebase-patterns/kb-production.md"
echo ""
echo "📖 Also available:"
echo "   • docs/RUVNET_ECOSYSTEM_COMPLETE.md (full ecosystem reference)"
echo ""
echo "🧠 Memory stored in .swarm/memory.db:"
echo "   • ruvnet/ecosystem, ruvnet/deployment, ruvnet/local-llm"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔍 CLAUDE: You MUST now:"
echo "   1. READ all 5 files in docs/ruvnet-knowledgebase-patterns/"
echo "   2. INTERNALIZE the Golden Rule and anti-simplification patterns"
echo "   3. GUIDE the user to set up their KB following these patterns"
echo "   4. REPORT what's configured and what needs attention"
echo ""
echo "═══════════════════════════════════════════════════════════════"
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
// npx agentic-flow@alpha --help

// Docker: ruvector-postgres (persistent vector storage)
// docker run -d --name ruvector-postgres -p 5432:5432 -e POSTGRES_PASSWORD=ruvector ruvnet/ruvector-postgres:latest
// Connection: postgresql://postgres:ruvector@localhost:5432/ruvector
```

## Packages Included

| Package | Version Selection | Purpose |
|---------|-------------------|---------|
| `claude-flow` | **Dynamic** (auto-selects @alpha or @latest) | Enterprise orchestration, Hive Mind, swarm management |
| `agentic-flow` | **Dynamic** (auto-selects @alpha or @latest) | 150+ agents, 213 MCP tools, model routing |
| `@ruvector/agentic-synth` | **Dynamic** (auto-selects @alpha or @latest) | Synthetic data generation for AI/ML training |
| `@ruvector/ruvllm` | **Dynamic** (auto-selects @alpha or @latest) | LLM orchestration and routing |
| `ruvector` | **Dynamic** (auto-selects @alpha or @latest) | High-performance vector database with HNSW indexing |
| `ruvnet/ruvector-postgres` | Docker image | PostgreSQL + pgvector for persistent vector storage |

### Version Selection Logic

The installer automatically chooses the best version for each package:

1. **No @alpha tag exists** - Uses @latest
2. **@alpha = @latest** - Uses @latest (more stable)
3. **@alpha has higher MAJOR version** - Uses @alpha (significantly more advanced)
4. **@alpha minor version is >2 ahead** - Uses @alpha
5. **Otherwise** - Uses @latest (stability preference)

## Known Issues

- **npm cache permissions**: If you see EACCES errors, run: `sudo chown -R $(whoami):staff ~/.npm`
- **agent-booster dependency**: agentic-flow@alpha requires agent-booster as a peer dependency. This is now auto-installed by the script.

## Full Documentation

See ~/.claude/knowledge/RUVNET_ECOSYSTEM_COMPLETE.md for comprehensive API reference.
