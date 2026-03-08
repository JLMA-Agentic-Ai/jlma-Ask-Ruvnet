Updated: 2026-01-01 16:00:00 EST | Version 6.2.0
Created: 2025-12-29 10:05:00 EST

# RuvNet Update Skill

## Skill Overview

**Name:** `/ruvnet-update`
**Purpose:** Smart RuvNet package updates + intelligent analysis of new features + project-specific recommendations.

---

## Two-Phase Execution

### Phase 1: Fast Update (Bash)
- Version comparison (@latest vs @alpha)
- Single npm install
- ~30 seconds

### Phase 2: Intelligent Analysis (Agent)
- Read changelogs for NEW features
- Analyze project structure and current usage
- Generate specific implementation recommendations
- ~2 minutes of thoughtful analysis

---

## Phase 1: Update Commands

### Step 1: Version Check

```bash
echo "╔══════════════════════════════════════════════════════╗"
echo "║         RUVNET UPDATE v6.2                           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📊 VERSION CHECK:"
echo ""
echo "   Package          @latest      @alpha         → Best"
echo "   ───────────────  ───────────  ─────────────  ─────────"

for pkg in agentic-flow ruflo ruv-swarm ruvector; do
  latest=$(npm view "$pkg@latest" version 2>/dev/null || echo "N/A")
  alpha=$(npm view "$pkg@alpha" version 2>/dev/null || echo "N/A")
  if [ "$alpha" != "N/A" ]; then best="$alpha (alpha)"; else best="$latest (latest)"; fi
  printf "   %-16s %-12s %-14s → %s\n" "$pkg" "$latest" "$alpha" "$best"
done
```

### Step 2: Infrastructure Check

```bash
echo ""
echo "🏗️  INFRASTRUCTURE:"
docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb" && echo "   ✅ ruvector-kb running" || echo "   ⚠️  ruvector-kb not running"
grep -q "kb-gateway" ~/.claude.json 2>/dev/null && echo "   ✅ kb-gateway MCP" || echo "   ⚠️  kb-gateway not registered"
SCHEMA=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr '-' '_')
COUNT=$(PGPASSWORD=${PGPASSWORD} psql -h localhost -p 5435 -U postgres -t -c "SELECT COUNT(*) FROM $SCHEMA.architecture_docs" 2>/dev/null | tr -d ' ')
[ -n "$COUNT" ] && echo "   📊 KB: $COUNT entries"
```

### Step 3: Install Updates

```bash
echo ""
echo "🔄 INSTALLING..."
npm install agentic-flow@alpha ruflo@latest ruv-swarm@latest ruvector@latest --save 2>&1 | grep -E "^(added|updated|changed)" | head -3
echo "   ✅ Done"

echo ""
echo "📦 INSTALLED:"
for pkg in agentic-flow ruflo ruv-swarm ruvector; do
  [ -f "node_modules/$pkg/package.json" ] && echo "   $pkg: $(jq -r '.version' node_modules/$pkg/package.json)"
done
```

---

## Phase 2: Intelligent Analysis (Agent Instructions)

**AFTER the bash commands complete, the agent MUST perform this analysis:**

### 2.1 Read What's New

For each updated package, read the changelog:

```
Read: node_modules/agentic-flow/CHANGELOG.md (first 100 lines)
Read: node_modules/ruvector/CHANGELOG.md (first 100 lines)
Read: node_modules/ruvector/README.md (first 80 lines - for feature list)
```

Extract and summarize:
- New APIs/functions added
- New capabilities
- Breaking changes
- Performance improvements

### 2.2 Analyze Current Project

Discover how the project currently uses RuvNet packages:

```bash
# Find imports
grep -r "require('ruvector\|from 'ruvector\|require('agentic\|from 'agentic" --include="*.js" --include="*.ts" . 2>/dev/null | grep -v node_modules

# Find config files
ls -la .ruvectorrc ruvector.config.* .agentic-flow/ 2>/dev/null

# Check scripts
jq -r '.scripts | keys[]' package.json 2>/dev/null | head -10

# Understand project purpose
ls docs/*.md 2>/dev/null | head -5
head -50 README.md 2>/dev/null
```

### 2.3 Generate Recommendations

Based on the analysis, produce a structured recommendation report:

```
╔══════════════════════════════════════════════════════════════════════════╗
║              RECOMMENDATIONS FOR [PROJECT_NAME]                          ║
╚══════════════════════════════════════════════════════════════════════════╝

📊 PROJECT PROFILE:
   Type: [e.g., Knowledge base, API, Agent system]
   Current RuvNet usage: [List files/imports found]
   Key characteristic: [e.g., Heavy embedding usage, swarm coordination]

🆕 NEW FEATURES + APPLICABILITY:

1. [FEATURE NAME] ⭐ [HIGH/MEDIUM/LOW VALUE]
   ──────────────────────────────────────
   What: [Brief description from changelog]
   Why it applies: [Based on project analysis]
   Where to apply: [Specific files in project]

   Implementation:
   ```javascript
   // Before (current approach)
   [existing code pattern]

   // After (new feature)
   [updated code pattern]
   ```

2. [NEXT FEATURE]...

PRIORITY ORDER:
  1. [Highest value change] → [Why first]
  2. [Next change] → [Why second]
  ...
```

---

## Feature Reference (Current Versions)

### agentic-flow 2.0.1-alpha.38
| Feature | Description | Use When |
|---------|-------------|----------|
| Federated Learning | 50+ agents learn and aggregate | Distributed knowledge systems |
| EphemeralLearningAgent | Temporary agents with memory | Short-lived specialized tasks |
| FederatedLearningCoordinator | Quality-based aggregation | Multi-agent consensus |
| Query Control | Change model mid-execution | Cost optimization |
| E2B Sandbox | Secure cloud execution | Untrusted code execution |
| Plugin System | Load tools from NPM/URLs | Dynamic capabilities |

### ruvector 0.1.77
| Feature | Description | Use When |
|---------|-------------|----------|
| ONNX Local Embeddings | all-MiniLM-L6-v2 via WASM | Offline/fast embedding |
| AST Analysis | Symbol extraction, complexity | Code documentation |
| Diff Embeddings | Semantic change classification | Git/change analysis |
| Graph Algorithms | Louvain, MinCut, Spectral | Clustering, boundaries |
| Security Scanning | Vulnerability patterns | Code review |
| MCP Server (30+ tools) | Vector operations via MCP | Claude Code integration |

### ruflo 2.7.47
| Feature | Description | Use When |
|---------|-------------|----------|
| 100+ MCP Tools | Swarm/memory/neural | Orchestration |
| Memory Persistence | TTL + namespacing | Cross-session state |
| Neural Patterns | Pattern analysis | Learning from success |
| GitHub Integration | Repo/PR management | Development workflow |
| DAA | Decentralized agents | Autonomous coordination |

### ruv-swarm 1.0.20
| Feature | Description | Use When |
|---------|-------------|----------|
| Neural Networks | 27+ models (LSTM, TCN) | Predictions |
| Topologies | Mesh/ring/hierarchical | Agent coordination |
| 84.8% SWE-Bench | High accuracy | Complex coding tasks |
| Zero GPU | CPU-native | Broad deployment |

---

## Example Recommendation Output

For a knowledge base project with vector storage:

```
╔══════════════════════════════════════════════════════════════════════════╗
║              RECOMMENDATIONS FOR my-kb-project                           ║
╚══════════════════════════════════════════════════════════════════════════╝

📊 PROJECT PROFILE:
   Type: Knowledge base with 1,500+ entries
   Current usage: RuvectorStore in scripts/ingest.js, src/storage/
   Key characteristic: Heavy embedding API usage for ingestion

🆕 NEW FEATURES + APPLICABILITY:

1. ONNX LOCAL EMBEDDINGS ⭐ HIGH VALUE
   ──────────────────────────────────────
   What: all-MiniLM-L6-v2 runs locally via WASM, no API needed
   Why it applies: Your ingestion scripts call embedding APIs 200+ times
   Where to apply: scripts/ingest.js:45, src/storage/vector-db.js:23

   Implementation:
   ```javascript
   // Before (API-dependent, slow, costs money)
   const embedding = await openai.embeddings.create({ input: text });

   // After (local, fast, free)
   const { RuVector } = require('ruvector');
   const db = new RuVector({ embeddingModel: 'onnx-local' });
   await db.insert({ id: docId, content: text }); // Embeds locally
   ```

   Impact: 10x faster ingestion, $0 API cost, works offline

2. GRAPH CLUSTERING ⭐ MEDIUM VALUE
   ──────────────────────────────────────
   What: Louvain community detection for vector clusters
   Why it applies: Could auto-organize your 1,500 KB entries into topics
   Where to apply: New script or enhance scripts/analyze.js

   Implementation:
   ```javascript
   const { graphClusters } = require('ruvector');
   const topics = await graphClusters(allVectors, { algorithm: 'louvain' });
   // Returns: { clusters: [{id: 1, docs: [...]}, ...], modularity: 0.82 }
   ```

PRIORITY ORDER:
  1. ONNX Embeddings → Immediate cost/speed win
  2. Graph Clustering → Better KB organization
  3. AST Analysis → If you have code docs
```

---

## Quick Reference

| Need | Package | Feature |
|------|---------|---------|
| Local embeddings | ruvector | `embeddingModel: 'onnx-local'` |
| Code analysis | ruvector | `astAnalyze()` |
| Topic clustering | ruvector | `graphClusters()` |
| Multi-agent learning | agentic-flow | `FederatedLearningCoordinator` |
| Ephemeral agents | agentic-flow | `EphemeralLearningAgent` |
| Model switching | agentic-flow | `QueryController` |
| Swarm MCP | ruflo | `mcp__ruflo__*` |
| Neural predictions | ruv-swarm | `npx ruv-swarm predict` |

---

## Version Tag Priority

| Package | Use Tag | Reason |
|---------|---------|--------|
| agentic-flow | @alpha | Alpha has newest features (2.x vs 1.x) |
| ruflo | @latest | Stable only |
| ruv-swarm | @latest | Stable only |
| ruvector | @latest | Stable only |

---

## Related Skills

| Skill | Use When |
|-------|----------|
| `/ruvnet-stack` | First-time full setup |
| `/ruvnet-kb` | Link knowledge base |
| `/ruvnet-kb-visual` | KB visualization |

---

## The Complete Flow

```
/ruvnet-update executes:

PHASE 1 (Bash - 30s):
  ├─ Check @latest vs @alpha for each package
  ├─ Check infrastructure (docker, kb-gateway, schema)
  ├─ npm install highest versions
  └─ Report installed versions

PHASE 2 (Agent Analysis - 2min):
  ├─ Read CHANGELOG.md for each updated package
  ├─ Read README.md for feature details
  ├─ Scan project for current RuvNet usage
  ├─ Identify project type and patterns
  └─ Generate specific recommendations:
      ├─ Which new features apply
      ├─ Where in the codebase to apply them
      ├─ Before/after code examples
      └─ Priority ordering
```
