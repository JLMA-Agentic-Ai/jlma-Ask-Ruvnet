# Claude Code Configuration - Ruflo v3.5

## 🔴 MANDATORY RULE — TEST BEFORE DECLARING DONE (NO EXCEPTIONS)

**Stuart's instruction (2026-02-22): Never say "I think I fixed it." You MUST verify before telling Stuart it works.**

### The Non-Negotiable Standard:
> "I wrote it, I tested it, I proved it, I'm sure it works, this looks great — use it."

### Required Steps Before Saying Anything Is Done:

1. **Build** — run `npm run build` and confirm it succeeds with zero errors
2. **Screenshot the live result** — use Playwright to take real browser screenshots:
   ```bash
   node --input-type=module <<'EOF'
   import { chromium } from '/Users/stuartkerr/.npm-global/lib/node_modules/playwright/index.mjs';
   const b = await chromium.launch();
   const p = await b.newPage();
   await p.goto('http://localhost:3000');
   await p.screenshot({ path: '/tmp/snap-verify.png' });
   await b.close();
   EOF
   ```
3. **Read the screenshots** — use the Read tool to view the PNG. Check visually: does it look right? Is anything broken, missing, or wrong?
4. **Test the specific change** — if you added a UI element, click it. If you fixed a loading bug, wait and confirm loading is gone. If you fixed a layout, confirm sidebar + header are intact.
5. **Only THEN declare it done** — with confidence, not hedging.

### What Failure Looks Like (Never Again):
- "I think I fixed it" ❌
- "This should work now" ❌
- "Let me know if it looks right" ❌
- Shipping code that breaks navigation ❌
- Shipping code that creates duplicate elements ❌
- Shipping code with a still-spinning loader ❌

### What Success Looks Like:
- "I built it, ran Playwright, reviewed the screenshot, the loader is gone, the orb renders, the sidebar is intact — it works." ✓

---

## ⚡ ABSOLUTE RULE — RUFLO OWNS EVERY COMMAND (NO EXCEPTIONS)

**Stuart's instruction (2026-02-21): Every command given in this project MUST be immediately handed to Ruflo. Claude Code is the executor only — Ruflo is the brain.**

### The Mandatory Flow for EVERY Request:

```
Stuart gives command
       ↓
Ruflo receives it (FIRST)
       ↓
Ruflo queries RuvVector KB (RVF-first: knowledge.rvf + MCP embedded WASM KB)
       ↓
Ruflo selects agents from RuvNet architecture
       ↓
Agents execute using agentic-flow + RuvNet tools
       ↓
Claude Code executes file/bash operations only
```

### Implementation (Run on EVERY command, no exceptions):

```bash
# Step 1: Route to Ruflo immediately
npx ruflo@latest hooks route --task "[Stuart's command]"

# Step 2: Initialize swarm for any non-trivial task
npx ruflo@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# Step 3: Query RuvVector KB before any action
mcp__Ruvnet-KB-first__kb_search({ query: "[relevant terms]", limit: 5 })
```

### Agent Dispatch Rules:
| Command Type | Ruflo Routes To |
|---|---|
| Any question | researcher + KB search first |
| Architecture/design | system-architect (Opus model) |
| Code changes | coder + reviewer |
| Deployment/infra | devops-architect |
| Cleanup/audit | Explore agent + coder |
| Docs update | technical-writer |
| Bug fix | root-cause-analyst + coder |
| Testing | quality-engineer |

**VIOLATION = failing to route through Ruflo. Claude Code NEVER answers directly without CF orchestration.**

---

## RULE ZERO: KB-FIRST + RUFLO-FIRST (NON-NEGOTIABLE)

**This project has a 353-entry expert-curated knowledge base (v5.0.0, 10 tools, 148 teaching entries) with teaching content that is NOT in any LLM's training data.** It covers RuVector, agents, swarms, AIMDS, embeddings, HNSW, ONNX, MCP, RVF, Ruflo, and advanced agentic patterns. Much of this technology was created after your knowledge cutoff.

### Before Answering ANY Question:

**STEP 1: Check the KB.** For ANY question about agents, swarms, vectors, embeddings, HNSW, ONNX, MCP, RVF, AIMDS, security, Ruflo, architecture, knowledge bases, RuVector, coding concepts, debugging, or how things work:

```sql
-- Via MCP (preferred — 10 tools available):
mcp__Ruvnet-KB-first__kb_search({ query: "<user's question>", limit: 5 })
-- For teaching/explanations:
mcp__Ruvnet-KB-first__kb_teach({ query: "<concept>", limit: 3 })
-- For WASM/browser apps:
mcp__Ruvnet-KB-first__kb_wasm({ query: "<wasm topic>", limit: 5 })

-- Via direct SQL (if MCP unavailable — query kb_complete FIRST, not architecture_docs):
psql -h localhost -p 5435 -U postgres -c "
  SELECT title, LEFT(content, 500) FROM ask_ruvnet.kb_complete
  WHERE quality_score >= 80
  ORDER BY embedding <=> '<query_embedding>'::ruvector LIMIT 5;"
```

**STEP 2: Route through Ruflo.** Do NOT answer complex questions as raw Claude Code. Use Ruflo agents:
- Architecture questions -> `Task(subagent_type="system-architect")`
- Code implementation -> `Task(subagent_type="coder")`
- Research/exploration -> `Task(subagent_type="researcher")`
- Security questions -> `Task(subagent_type="security-engineer")`
- Teaching/explaining -> Check KB first, THEN answer using KB content

**STEP 3: Teach from the KB, not from training data.** If the KB has a teaching entry (category='teaching'), use ITS analogies and plain English. Stuart is learning -- every response is a teaching moment. The KB entries were written specifically for his learning level.

### Why This Matters:
- Stuart is a vibe coder growing into advanced agentic development
- The KB contains deep teaching knowledge about technologies that are TOO NEW for any LLM's training data
- Ruflo understands RuVector natively -- Claude Code does not
- Every time Claude Code answers without checking the KB, it risks giving stale or wrong information
- The KB has beginner-friendly explanations that Claude Code would not generate on its own

### What the KB Knows (That You Don't):
- RVF cognitive container format (24 segments, self-booting, 5.5KB WASM)
- AIMDS: 3-layer security pipeline, 25-level meta-learning, Lyapunov chaos detection
- SONA: Self-optimizing neural architecture (<1ms real-time learning)
- MinCut: Dynamic graph partitioning for self-healing AI (Dec 2025 breakthrough)
- RuVector-Postgres: 290+ SQL functions (pgvector replacement)
- RuVector-WASM: Complete browser vector DB (<400KB, zero backend)
- Micro-HNSW: 7.2KB neuromorphic WASM with spiking neural networks
- 80+ Rust crates and their interconnections
- Teaching entries with plain-English analogies for every major concept
- Progressive learning paths from vibe coding to advanced agent building
- Decision frameworks (when to use WASM vs Postgres, hierarchical vs mesh, etc.)
- Debugging guides written for non-coders

### Skip KB Check ONLY When:
- Stuart says "just do it" or "skip the KB"
- The task is purely mechanical (git commit, file rename, formatting)
- You are reading/displaying a file without interpreting it

---

## 🚨 AUTOMATIC SWARM ORCHESTRATION

**When starting work on complex tasks, Claude Code MUST automatically:**

1. **Initialize the swarm** using CLI tools via Bash
2. **Spawn concurrent agents** using Claude Code's Task tool
3. **Coordinate via hooks** and memory

### 🚨 CRITICAL: CLI + Task Tool in SAME Message

**When user says "spawn swarm" or requests complex work, Claude Code MUST in ONE message:**
1. Call CLI tools via Bash to initialize coordination
2. **IMMEDIATELY** call Task tool to spawn REAL working agents
3. Both CLI and Task calls must be in the SAME response

**CLI coordinates, Task tool agents do the actual work!**

### 🛡️ Anti-Drift Config (PREFERRED)

**Use this to prevent agent drift:**
```bash
# Small teams (6-8 agents) - use hierarchical for tight control
npx ruflo@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# Large teams (10-15 agents) - use hierarchical-mesh for V3 queen + peer communication
npx ruflo@latest swarm init --topology hierarchical-mesh --max-agents 15 --strategy specialized
```

**Valid Topologies:**
- `hierarchical` - Queen controls workers directly (anti-drift for small teams)
- `hierarchical-mesh` - V3 queen + peer communication (recommended for 10+ agents)
- `mesh` - Fully connected peer network
- `ring` - Circular communication pattern
- `star` - Central coordinator with spokes
- `hybrid` - Dynamic topology switching

**Anti-Drift Guidelines:**
- **hierarchical**: Coordinator catches divergence
- **max-agents 6-8**: Smaller team = less drift
- **specialized**: Clear roles, no overlap
- **consensus**: raft (leader maintains state)

---

### 🔄 Auto-Start Swarm Protocol (Background Execution)

When the user requests a complex task, **spawn agents in background and WAIT for completion:**

```javascript
// STEP 1: Initialize swarm coordination (anti-drift config)
Bash("npx ruflo@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized")

// STEP 2: Spawn ALL agents IN BACKGROUND in a SINGLE message
// Use run_in_background: true so agents work concurrently
Task({
  prompt: "Research requirements, analyze codebase patterns, store findings in memory",
  subagent_type: "researcher",
  description: "Research phase",
  run_in_background: true  // ← CRITICAL: Run in background
})
Task({
  prompt: "Design architecture based on research. Document decisions.",
  subagent_type: "system-architect",
  description: "Architecture phase",
  run_in_background: true
})
Task({
  prompt: "Implement the solution following the design. Write clean code.",
  subagent_type: "coder",
  description: "Implementation phase",
  run_in_background: true
})
Task({
  prompt: "Write comprehensive tests for the implementation.",
  subagent_type: "tester",
  description: "Testing phase",
  run_in_background: true
})
Task({
  prompt: "Review code quality, security, and best practices.",
  subagent_type: "reviewer",
  description: "Review phase",
  run_in_background: true
})

// STEP 3: WAIT - Tell user agents are working, then STOP
// Say: "I've spawned 5 agents to work on this in parallel. They'll report back when done."
// DO NOT check status repeatedly. Just wait for user or agent responses.
```

### ⏸️ CRITICAL: Spawn and Wait Pattern

**After spawning background agents:**

1. **TELL USER** - "I've spawned X agents working in parallel on: [list tasks]"
2. **STOP** - Do not continue with more tool calls
3. **WAIT** - Let the background agents complete their work
4. **RESPOND** - When agents return results, review and synthesize

**Example response after spawning:**
```
I've launched 5 concurrent agents to work on this:
- 🔍 Researcher: Analyzing requirements and codebase
- 🏗️ Architect: Designing the implementation approach
- 💻 Coder: Implementing the solution
- 🧪 Tester: Writing tests
- 👀 Reviewer: Code review and security check

They're working in parallel. I'll synthesize their results when they complete.
```

### 🚫 DO NOT:
- Continuously check swarm status
- Poll TaskOutput repeatedly
- Add more tool calls after spawning
- Ask "should I check on the agents?"

### ✅ DO:
- Spawn all agents in ONE message
- Tell user what's happening
- Wait for agent results to arrive
- Synthesize results when they return

## 🧠 AUTO-LEARNING PROTOCOL

### Before Starting Any Task
```bash
# 1. Search memory for relevant patterns from past successes
Bash("npx ruflo@latest memory search --query '[task keywords]' --namespace patterns")

# 2. Check if similar task was done before
Bash("npx ruflo@latest memory search --query '[task type]' --namespace tasks")

# 3. Load learned optimizations
Bash("npx ruflo@latest hooks route --task '[task description]'")
```

### After Completing Any Task Successfully
```bash
# 1. Store successful pattern for future reference
Bash("npx ruflo@latest memory store --namespace patterns --key '[pattern-name]' --value '[what worked]'")

# 2. Train neural patterns on the successful approach
Bash("npx ruflo@latest hooks post-edit --file '[main-file]' --train-neural true")

# 3. Record task completion with metrics
Bash("npx ruflo@latest hooks post-task --task-id '[id]' --success true --store-results true")

# 4. Trigger optimization worker if performance-related
Bash("npx ruflo@latest hooks worker dispatch --trigger optimize")
```

### Continuous Improvement Triggers

| Trigger | Worker | When to Use |
|---------|--------|-------------|
| After major refactor | `optimize` | Performance optimization |
| After adding features | `testgaps` | Find missing test coverage |
| After security changes | `audit` | Security analysis |
| After API changes | `document` | Update documentation |
| Every 5+ file changes | `map` | Update codebase map |
| Complex debugging | `deepdive` | Deep code analysis |

### Memory-Enhanced Development

**ALWAYS check memory before:**
- Starting a new feature (search for similar implementations)
- Debugging an issue (search for past solutions)
- Refactoring code (search for learned patterns)
- Performance work (search for optimization strategies)

**ALWAYS store in memory after:**
- Solving a tricky bug (store the solution pattern)
- Completing a feature (store the approach)
- Finding a performance fix (store the optimization)
- Discovering a security issue (store the vulnerability pattern)

### 📋 Agent Routing (Anti-Drift)

| Code | Task | Agents |
|------|------|--------|
| 1 | Bug Fix | coordinator, researcher, coder, tester |
| 3 | Feature | coordinator, architect, coder, tester, reviewer |
| 5 | Refactor | coordinator, architect, coder, reviewer |
| 7 | Performance | coordinator, perf-engineer, coder |
| 9 | Security | coordinator, security-architect, auditor |
| 11 | Docs | researcher, api-docs |

**Codes 1-9: hierarchical/specialized (anti-drift). Code 11: mesh/balanced**

### 🎯 Task Complexity Detection

**AUTO-INVOKE SWARM when task involves:**
- Multiple files (3+)
- New feature implementation
- Refactoring across modules
- API changes with tests
- Security-related changes
- Performance optimization
- Database schema changes

**SKIP SWARM for:**
- Single file edits
- Simple bug fixes (1-2 lines)
- Documentation updates
- Configuration changes
- Quick questions/exploration

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Claude Code)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Config (Anti-Drift Defaults)

- **Topology**: hierarchical (prevents drift)
- **Max Agents**: 8 (smaller = less drift)
- **Strategy**: specialized (clear roles)
- **Consensus**: raft
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

## 🚀 V3 CLI Commands (26 Commands, 140+ Subcommands)

### Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization with wizard, presets, skills, hooks |
| `agent` | 8 | Agent lifecycle (spawn, list, status, stop, metrics, pool, health, logs) |
| `swarm` | 6 | Multi-agent swarm coordination and orchestration |
| `memory` | 11 | AgentDB memory with vector search (150x-12,500x faster) |
| `mcp` | 9 | MCP server management and tool execution |
| `task` | 6 | Task creation, assignment, and lifecycle |
| `session` | 7 | Session state management and persistence |
| `config` | 7 | Configuration management and provider setup |
| `status` | 3 | System status monitoring with watch mode |
| `workflow` | 6 | Workflow execution and template management |
| `hooks` | 17 | Self-learning hooks + 12 background workers |
| `hive-mind` | 6 | Queen-led Byzantine fault-tolerant consensus |

### Advanced Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `daemon` | 5 | Background worker daemon (start, stop, status, trigger, enable) |
| `neural` | 5 | Neural pattern training (train, status, patterns, predict, optimize) |
| `security` | 6 | Security scanning (scan, audit, cve, threats, validate, report) |
| `performance` | 5 | Performance profiling (benchmark, profile, metrics, optimize, report) |
| `providers` | 5 | AI providers (list, add, remove, test, configure) |
| `plugins` | 5 | Plugin management (list, install, uninstall, enable, disable) |
| `deployment` | 5 | Deployment management (deploy, rollback, status, environments, release) |
| `embeddings` | 4 | Vector embeddings (embed, batch, search, init) - 75x faster with agentic-flow |
| `claims` | 4 | Claims-based authorization (check, grant, revoke, list) |
| `migrate` | 5 | V2 to V3 migration with rollback support |
| `doctor` | 1 | System diagnostics with health checks |
| `completions` | 4 | Shell completions (bash, zsh, fish, powershell) |

### Quick CLI Examples

```bash
# Initialize project
npx ruflo@latest init --wizard

# Start daemon with background workers
npx ruflo@latest daemon start

# Spawn an agent
npx ruflo@latest agent spawn -t coder --name my-coder

# Initialize swarm
npx ruflo@latest swarm init --v3-mode

# Search memory (HNSW-indexed)
npx ruflo@latest memory search --query "authentication patterns"

# System diagnostics
npx ruflo@latest doctor --fix

# Security scan
npx ruflo@latest security scan --depth full

# Performance benchmark
npx ruflo@latest performance benchmark --suite all
```

## 🚀 Available Agents (60+ Types)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### V3 Specialized Agents
`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

### 🔐 @ruflo/security
CVE remediation, input validation, path security:
- `InputValidator` - Zod validation
- `PathValidator` - Traversal prevention
- `SafeExecutor` - Injection protection

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

## 🪝 V3 Hooks System (27 Hooks + 12 Workers)

### All Available Hooks

| Hook | Description | Key Options |
|------|-------------|-------------|
| `pre-edit` | Get context before editing files | `--file`, `--operation` |
| `post-edit` | Record editing outcome for learning | `--file`, `--success`, `--train-neural` |
| `pre-command` | Assess risk before commands | `--command`, `--validate-safety` |
| `post-command` | Record command execution outcome | `--command`, `--track-metrics` |
| `pre-task` | Record task start, get agent suggestions | `--description`, `--coordinate-swarm` |
| `post-task` | Record task completion for learning | `--task-id`, `--success`, `--store-results` |
| `session-start` | Start/restore session (v2 compat) | `--session-id`, `--auto-configure` |
| `session-end` | End session and persist state | `--generate-summary`, `--export-metrics` |
| `session-restore` | Restore a previous session | `--session-id`, `--latest` |
| `route` | Route task to optimal agent | `--task`, `--context`, `--top-k` |
| `route-task` | (v2 compat) Alias for route | `--task`, `--auto-swarm` |
| `explain` | Explain routing decision | `--topic`, `--detailed` |
| `pretrain` | Bootstrap intelligence from repo | `--model-type`, `--epochs` |
| `build-agents` | Generate optimized agent configs | `--agent-types`, `--focus` |
| `metrics` | View learning metrics dashboard | `--v3-dashboard`, `--format` |
| `transfer` | Transfer patterns via IPFS registry | `store`, `from-project` |
| `list` | List all registered hooks | `--format` |
| `intelligence` | RuVector intelligence system | `trajectory-*`, `pattern-*`, `stats` |
| `worker` | Background worker management | `list`, `dispatch`, `status`, `detect` |
| `progress` | Check V3 implementation progress | `--detailed`, `--format` |
| `statusline` | Generate dynamic statusline | `--json`, `--compact`, `--no-color` |
| `coverage-route` | Route based on test coverage gaps | `--task`, `--path` |
| `coverage-suggest` | Suggest coverage improvements | `--path` |
| `coverage-gaps` | List coverage gaps with priorities | `--format`, `--limit` |
| `pre-bash` | (v2 compat) Alias for pre-command | Same as pre-command |
| `post-bash` | (v2 compat) Alias for post-command | Same as post-command |

### 12 Background Workers

| Worker | Priority | Description |
|--------|----------|-------------|
| `ultralearn` | normal | Deep knowledge acquisition |
| `optimize` | high | Performance optimization |
| `consolidate` | low | Memory consolidation |
| `predict` | normal | Predictive preloading |
| `audit` | critical | Security analysis |
| `map` | normal | Codebase mapping |
| `preload` | low | Resource preloading |
| `deepdive` | normal | Deep code analysis |
| `document` | normal | Auto-documentation |
| `refactor` | normal | Refactoring suggestions |
| `benchmark` | normal | Performance benchmarking |
| `testgaps` | normal | Test coverage analysis |

### Essential Hook Commands

```bash
# Core hooks
npx ruflo@latest hooks pre-task --description "[task]"
npx ruflo@latest hooks post-task --task-id "[id]" --success true
npx ruflo@latest hooks post-edit --file "[file]" --train-neural true

# Session management
npx ruflo@latest hooks session-start --session-id "[id]"
npx ruflo@latest hooks session-end --export-metrics true
npx ruflo@latest hooks session-restore --session-id "[id]"

# Intelligence routing
npx ruflo@latest hooks route --task "[task]"
npx ruflo@latest hooks explain --topic "[topic]"

# Neural learning
npx ruflo@latest hooks pretrain --model-type moe --epochs 10
npx ruflo@latest hooks build-agents --agent-types coder,tester

# Background workers
npx ruflo@latest hooks worker list
npx ruflo@latest hooks worker dispatch --trigger audit
npx ruflo@latest hooks worker status

# Coverage-aware routing
npx ruflo@latest hooks coverage-gaps --format table
npx ruflo@latest hooks coverage-route --task "[task]"

# Statusline (for Claude Code integration)
npx ruflo@latest hooks statusline
npx ruflo@latest hooks statusline --json
```

## 🔄 Migration (V2 to V3)

```bash
# Check migration status
npx ruflo@latest migrate status

# Run migration with backup
npx ruflo@latest migrate run --backup

# Rollback if needed
npx ruflo@latest migrate rollback

# Validate migration
npx ruflo@latest migrate validate
```

## 🧠 Intelligence System (RuVector)

V3 includes the RuVector Intelligence System:
- **SONA**: Self-Optimizing Neural Architecture (<0.05ms adaptation)
- **MoE**: Mixture of Experts for specialized routing
- **HNSW**: 150x-12,500x faster pattern search
- **EWC++**: Elastic Weight Consolidation (prevents forgetting)
- **Flash Attention**: 2.49x-7.47x speedup

The 4-step intelligence pipeline:
1. **RETRIEVE** - Fetch relevant patterns via HNSW
2. **JUDGE** - Evaluate with verdicts (success/failure)
3. **DISTILL** - Extract key learnings via LoRA
4. **CONSOLIDATE** - Prevent catastrophic forgetting via EWC++

## 📦 Embeddings Package (v3.0.0-alpha.12)

Features:
- **sql.js**: Cross-platform SQLite persistent cache (WASM, no native compilation)
- **Document chunking**: Configurable overlap and size
- **Normalization**: L2, L1, min-max, z-score
- **Hyperbolic embeddings**: Poincaré ball model for hierarchical data
- **75x faster**: With agentic-flow ONNX integration
- **Neural substrate**: Integration with RuVector

## 🐝 Hive-Mind Consensus

### Topologies
- `hierarchical` - Queen controls workers directly
- `mesh` - Fully connected peer network
- `hierarchical-mesh` - Hybrid (recommended)
- `adaptive` - Dynamic based on load

### Consensus Strategies
- `byzantine` - BFT (tolerates f < n/3 faulty)
- `raft` - Leader-based (tolerates f < n/2)
- `gossip` - Epidemic for eventual consistency
- `crdt` - Conflict-free replicated data types
- `quorum` - Configurable quorum-based

## V3 Performance Targets

| Metric | Target |
|--------|--------|
| Flash Attention | 2.49x-7.47x speedup |
| HNSW Search | 150x-12,500x faster |
| Memory Reduction | 50-75% with quantization |
| MCP Response | <100ms |
| CLI Startup | <500ms |
| SONA Adaptation | <0.05ms |

## 📊 Performance Optimization Protocol

### Automatic Performance Tracking
```bash
# After any significant operation, track metrics
Bash("npx ruflo@latest hooks post-command --command '[operation]' --track-metrics true")

# Periodically run benchmarks (every major feature)
Bash("npx ruflo@latest performance benchmark --suite all")

# Analyze bottlenecks when performance degrades
Bash("npx ruflo@latest performance profile --target '[component]'")
```

### Session Persistence (Cross-Conversation Learning)
```bash
# At session start - restore previous context
Bash("npx ruflo@latest session restore --latest")

# At session end - persist learned patterns
Bash("npx ruflo@latest hooks session-end --generate-summary true --persist-state true --export-metrics true")
```

### Neural Pattern Training
```bash
# Train on successful code patterns
Bash("npx ruflo@latest neural train --pattern-type coordination --epochs 10")

# Predict optimal approach for new tasks
Bash("npx ruflo@latest neural predict --input '[task description]'")

# View learned patterns
Bash("npx ruflo@latest neural patterns --list")
```

## 🔧 Environment Variables

```bash
# Configuration
RUFLO_CONFIG=./ruflo.config.json
RUFLO_LOG_LEVEL=info

# Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# MCP Server
RUFLO_MCP_PORT=3000
RUFLO_MCP_HOST=localhost
RUFLO_MCP_TRANSPORT=stdio

# Memory
RUFLO_MEMORY_BACKEND=hybrid
RUFLO_MEMORY_PATH=./data/memory
```

## 🔍 Doctor Health Checks

Run `npx ruflo@latest doctor` to check:
- Node.js version (20+)
- npm version (9+)
- Git installation
- Config file validity
- Daemon status
- Memory database
- API keys
- MCP servers
- Disk space
- TypeScript installation

## 🚀 Quick Setup

```bash
# Add MCP servers (auto-detects MCP mode when stdin is piped)
claude mcp add ruflo -- npx -y ruflo@latest
claude mcp add ruv-swarm -- npx -y ruv-swarm mcp start  # Optional
claude mcp add flow-nexus -- npx -y flow-nexus@latest mcp start  # Optional

# Start daemon
npx ruflo@latest daemon start

# Run doctor
npx ruflo@latest doctor --fix
```

## 🎯 Claude Code vs CLI Tools

### Claude Code Handles ALL EXECUTION:
- **Task tool**: Spawn and run agents concurrently
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- TodoWrite and task management
- Git operations

### CLI Tools Handle Coordination (via Bash):
- **Swarm init**: `npx ruflo@latest swarm init --topology <type>`
- **Swarm status**: `npx ruflo@latest swarm status`
- **Agent spawn**: `npx ruflo@latest agent spawn -t <type> --name <name>`
- **Memory store**: `npx ruflo@latest memory store --key "mykey" --value "myvalue" --namespace patterns`
- **Memory search**: `npx ruflo@latest memory search --query "search terms"`
- **Memory list**: `npx ruflo@latest memory list --namespace patterns`
- **Memory retrieve**: `npx ruflo@latest memory retrieve --key "mykey" --namespace patterns`
- **Hooks**: `npx ruflo@latest hooks <hook-name> [options]`

## 📝 Memory Commands Reference (IMPORTANT)

### Store Data (ALL options shown)
```bash
# REQUIRED: --key and --value
# OPTIONAL: --namespace (default: "default"), --ttl, --tags
npx ruflo@latest memory store --key "pattern-auth" --value "JWT with refresh tokens" --namespace patterns
npx ruflo@latest memory store --key "bug-fix-123" --value "Fixed null check" --namespace solutions --tags "bugfix,auth"
```

### Search Data (semantic vector search)
```bash
# REQUIRED: --query (full flag, not -q)
# OPTIONAL: --namespace, --limit, --threshold
npx ruflo@latest memory search --query "authentication patterns"
npx ruflo@latest memory search --query "error handling" --namespace patterns --limit 5
```

### List Entries
```bash
# OPTIONAL: --namespace, --limit
npx ruflo@latest memory list
npx ruflo@latest memory list --namespace patterns --limit 10
```

### Retrieve Specific Entry
```bash
# REQUIRED: --key
# OPTIONAL: --namespace (default: "default")
npx ruflo@latest memory retrieve --key "pattern-auth"
npx ruflo@latest memory retrieve --key "pattern-auth" --namespace patterns
```

### Initialize Memory Database
```bash
npx ruflo@latest memory init --force --verbose
```

**KEY**: CLI coordinates the strategy via Bash, Claude Code's Task tool executes with real agents.

## Support

- Documentation: https://github.com/ruvnet/ruflo
- Issues: https://github.com/ruvnet/ruflo/issues

---

Remember: **Ruflo coordinates, Claude Code Task tool creates!**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.

## 🚨 SWARM EXECUTION RULES (CRITICAL)
1. **SPAWN IN BACKGROUND**: Use `run_in_background: true` for all agent Task calls
2. **SPAWN ALL AT ONCE**: Put ALL agent Task calls in ONE message for parallel execution
3. **TELL USER**: After spawning, list what each agent is doing (use emojis for clarity)
4. **STOP AND WAIT**: After spawning, STOP - do NOT add more tool calls or check status
5. **NO POLLING**: Never poll TaskOutput or check swarm status - trust agents to return
6. **SYNTHESIZE**: When agent results arrive, review ALL results before proceeding
7. **NO CONFIRMATION**: Don't ask "should I check?" - just wait for results

Example spawn message:
```
"I've launched 4 agents in background:
- 🔍 Researcher: [task]
- 💻 Coder: [task]
- 🧪 Tester: [task]
- 👀 Reviewer: [task]
Working in parallel - I'll synthesize when they complete."
```
