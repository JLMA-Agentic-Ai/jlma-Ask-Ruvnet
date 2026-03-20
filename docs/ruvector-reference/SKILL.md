Updated: 2026-01-02 13:45:00 EST | Version 6.5.0
Created: 2026-01-01 15:00:00 EST

# RuvNet KB-First Application Builder v6.5

## Score-Driven Architecture: Scoring IS Enforcement + UX Excellence

**Version:** 6.5.0
**NPM Package:** `ruvnet-kb-first`
**Philosophy:** Every operation requires baseline scoring. Every change shows delta. Negative delta BLOCKS progress. No shortcuts. Applications must be excellent, not just functional.

---

## What's New in v6.3.0 - Three-Tier KB Architecture

| Feature | Description |
|---------|-------------|
| **Three-Tier KB System** | Full (230K+) → Starter (500) → Structural fallback |
| **Unified Dashboard** | `npx ruvnet-kb-first` shows comprehensive project status |
| **KB Auto-Detection** | Automatically finds and connects to available KB |
| **Graceful Degradation** | Works without KB, with increasing capability as KB added |
| **`--kb` Connection Flag** | Connect to existing KB schemas (e.g., `--kb ask_ruvnet`) |
| **Live KB Stats** | Dashboard shows real-time entry count and connection status |
| **npx-First Distribution** | Always use `npx ruvnet-kb-first@latest` - no global installs |

### KB Tier System

| Tier | Description | Entries | Features |
|------|-------------|---------|----------|
| **Tier 1: Full KB** | ruvector-postgres on port 5435 | 230K+ | Semantic search, KB citations, gap detection |
| **Tier 2: Starter KB** | Bundled in .ruvector/ | 500 | Basic semantic search, core patterns |
| **Tier 3: Structural** | No KB required | 0 | Directory scoring, phase tracking, setup wizard |

### Quick Start (v6.3)

```bash
# Run from any project directory
npx ruvnet-kb-first@latest

# Connect to existing KB
npx ruvnet-kb-first init --kb ask_ruvnet

# Check status
npx ruvnet-kb-first status
```

### MCP Server Configuration

```json
{
  "mcpServers": {
    "ruvnet-kb-first": {
      "command": "npx",
      "args": ["ruvnet-kb-first@latest", "mcp"]
    }
  }
}
```

---

## What's New in v6.5.0 - Embedded WASM KB

| Feature | Description |
|---------|-------------|
| **Embedded KB** | 16,575 entries bundled in npm package (~10MB) |
| **WASM Search** | 15-30ms queries via RvLite (vs 6.7s PostgreSQL brute-force) |
| **Offline Capable** | Works without database connection |
| **Cross-Platform** | Windows, Mac, Linux, CI/CD pipelines |
| **Auto-Update Detection** | Checks PostgreSQL hash, notifies of updates |
| **Binary Quantization** | 32x compression (384 floats → 48 bytes per vector) |

### WASM KB Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NPM PACKAGE (~22MB)                      │
├─────────────────────────────────────────────────────────────┤
│  kb-data/                                                   │
│  ├── kb-metadata.json   (1KB)   Version, hash, categories  │
│  ├── kb-entries.json    (9MB)   Titles, content, metadata  │
│  ├── kb-embeddings.bin  (0.8MB) Binary quantized vectors   │
│  └── kb-loader.js       (6KB)   WASM loader + search API   │
├─────────────────────────────────────────────────────────────┤
│  @ruvector/edge-full    (1.3MB) RvLite WASM runtime        │
└─────────────────────────────────────────────────────────────┘
```

### Performance Comparison

| Metric | PostgreSQL | WASM Embedded |
|--------|------------|---------------|
| Query latency | 6,700ms | **15-30ms** |
| Infrastructure | Docker + 2GB RAM | **None** |
| Offline | No | **Yes** |
| CI/CD ready | Complex | **Just works** |
| Package size | 160KB | 22MB |
| Recall quality | 100% | ~90% |

### Usage

```javascript
// Import from npm package
import { search, loadKB, checkForUpdates } from 'ruvnet-kb-first/kb-data/kb-loader.js';

// Load KB (once per session)
await loadKB();

// Search (15-30ms)
const results = await search('how to create agents', 5);
console.log(results.results);

// Check for PostgreSQL updates
const status = await checkForUpdates();
if (status.needsUpdate) {
  console.log('Update available:', status.message);
}
```

### Auto-Update Workflow

```
1. npx ruvnet-kb-first (loads embedded WASM KB)
2. Checks PostgreSQL hash (if available)
3. If hash differs → notifies user
4. User runs: npm update ruvnet-kb-first
5. Gets new KB version
```

### KB Export Command

```bash
# Re-export KB when PostgreSQL is updated
node scripts/kb-export-wasm.js --schema ask_ruvnet --output kb-data/

# This generates:
# - kb-metadata.json (with new content hash)
# - kb-entries.json (titles, content, categories)
# - kb-embeddings.bin (binary quantized vectors)
# - kb-loader.js (WASM loader)
```

---

## What's New in v6.4.0 - KB Quality Pipeline

| Feature | Description |
|---------|-------------|
| **KB Ingestion Template** | 6-step process with SHA-256 deduplication, auto-categorization, quality scoring |
| **KB Quality Audit** | 7-dimension scoring: embeddings, deduplication, categories, structure, content, recall, indexes |
| **KB Optimization Script** | ruvector-native optimization with `cosine_distance()` and `semantic_search()` functions |
| **15 Auto-Categories** | Automatic categorization: agents, workflows, embeddings, memory, llm, mcp, swarms, etc. |
| **Quality Scoring 0-100** | Content length, formatting, completeness scoring per entry |

### KB Quality Pipeline

When creating ANY knowledge base, the following process is **ALWAYS** followed:

```
1. INGEST     → scripts/kb-ingest-template.js (SHA-256 dedup, 15 categories, quality 0-100)
2. AUDIT      → scripts/kb-quality-audit.js (7-dimension scoring, grade A-F)
3. OPTIMIZE   → scripts/kb-optimize.sql (indexes, views, semantic_search function)
4. VERIFY     → Re-audit until score ≥ 85 (B+ or higher)
```

### KB Quality Dimensions (7 Total)

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| Embedding Quality | 15% | Completeness, variance, dimensionality |
| Deduplication | 15% | Hash-based duplicate detection |
| Category Coverage | 15% | Balanced distribution across 15 categories |
| Structural Integrity | 15% | Hierarchy, relationships, navigation |
| Content Quality | 15% | Length, formatting, source attribution |
| Recall Performance | 15% | Semantic search returns relevant results |
| Index Optimization | 10% | Supporting indexes, materialized views |

### KB Ingestion Template

```bash
# Ingest content into optimized KB
node scripts/kb-ingest-template.js --schema your_project

# Features:
# - SHA-256 content hashing for deduplication
# - 15 category auto-classification
# - Quality scoring 0-100 per entry
# - ruvector_embed() for 384-dim embeddings
```

### KB Quality Audit

```bash
# Score any existing KB
node scripts/kb-quality-audit.js --schema ask_ruvnet

# Output: Grade (A-F), 7-dimension breakdown, specific fixes
```

### KB Optimization

```bash
# Run optimization script (ruvector-native)
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -f scripts/kb-optimize.sql

# Creates:
# - cosine_distance(real[], real[]) function
# - semantic_search(query, limit, max_distance) function
# - Optimized indexes and materialized views
# - ask_ruvnet.kb view for high-quality entries
```

### Semantic Search Usage

```sql
-- Simple semantic search
SELECT * FROM ask_ruvnet.semantic_search('how to create agents', 5);

-- Direct cosine distance
SELECT title, cosine_distance(embedding, ruvector_embed('query')::real[]) as dist
FROM ask_ruvnet.kb ORDER BY dist LIMIT 10;

-- Category-filtered search
SELECT * FROM ask_ruvnet.kb WHERE category = 'agents' LIMIT 10;
```

---

## What's New in v6.2.0 - UX Excellence

| Feature | Description |
|---------|-------------|
| **UX Quality Dimension** | 7th KB dimension: Visual design, emotional appeal, user flow |
| **Phase 12: UX Quality Review** | Playwright-based end-user perspective audit |
| **`kb_first_ux_review` Tool** | Captures screenshots, checks versioning, critical review |
| **Version Display Check** | Verifies version in header/footer (major.minor.patch) |
| **Cache-Busting Check** | Ensures users see latest version, not cached content |
| **Critical Review Questions** | How good? How could it be better? Where falling down? What would excellent look like? |
| **Playwright Auto-Install** | Offers to install Playwright if not present |

### The 7 MCP Tools (v6.3)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `kb_first_assess` | Score ALL dimensions (7 KB + 13 Phases) | **FIRST** - before any work |
| `kb_first_plan` | Generate enhancement plan with predictions | After assess, shows gaps |
| `kb_first_confirm` | User confirms readiness to proceed | Before execution |
| `kb_first_execute` | Execute plan phase by phase | After confirmation |
| `kb_first_verify` | Compare predicted vs actual, recursive until 98+ | After execution |
| `kb_first_ux_review` | Playwright-based visual quality audit | For UX excellence |
| `kb_first_status` | **NEW** Check KB connection and tier status | Diagnostics |

### UX Quality Criteria (Scored in UX Review)

| Criterion | Weight | Checks |
|-----------|--------|--------|
| Version Display | 15% | Header/footer shows major.minor.patch |
| Cache Management | 10% | Version change detection, user notification |
| Visual Design Excellence | 20% | Typography, color, spacing, not generic AI look |
| Emotional Appeal | 15% | Creates confidence, celebrates success, softens errors |
| Loading States | 10% | Skeleton loaders, progress indicators, graceful |
| Error Handling UX | 10% | Clear messages, actionable, no technical jargon |
| User Flow | 10% | Intuitive navigation, clear CTAs, minimal friction |
| Accessibility | 10% | Keyboard nav, screen reader, contrast, focus |

---

## What's New in v6.0 - BREAKING CHANGES

| Feature | Description |
|---------|-------------|
| **Score-Driven Architecture** | Scoring is THE enforcement mechanism, not just a metric |
| **4 MCP Tools** | Simplified from 7 CLI commands to 4 focused MCP tools |
| **Delta Enforcement** | Every phase requires before/after comparison |
| **Hard Gate Blocking** | Negative score delta BLOCKS progress - no bypass |
| **Baseline Requirement** | Cannot start work without establishing baseline |
| **Automatic Refresh** | Baseline resets after each gate passage |

### The Original 4 MCP Tools (v6.0)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `kb_first_assess` | Calculate baseline scores | **FIRST** - before any work |
| `kb_first_phase` | Get phase guidance with baseline | After assess, shows tasks |
| `kb_first_delta` | Compare current vs baseline | After work, shows improvement |
| `kb_first_gate` | Hard gate - blocks on regression | When ready to proceed |

### The Score-Driven Workflow

```
1. kb_first_assess → Establishes baseline (saves to .ruvector/baseline.json)
2. kb_first_phase  → Get phase tasks, see baseline reminder
3. [Do the work]
4. kb_first_delta  → Compare scores, PASS if delta ≥ 0, FAIL if < 0
5. kb_first_gate   → Verify gate, proceed OR blocked
6. REPEAT from step 1 for next phase
```

### Quick Start (MCP Only)

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "ruvnet-kb-first": {
      "command": "npx",
      "args": ["ruvnet-kb-first", "mcp"]
    }
  }
}
```

Then use the tools:
```
kb_first_assess      # Start here - get your baseline
kb_first_phase 0     # Get Phase 0 (Assessment) guidance
# ... do the work ...
kb_first_delta       # Check your improvement
kb_first_gate 0      # Pass gate, move to Phase 1
```

---

## Scoring Formula (100 Points Total)

### KB Score (40 points)
| Component | Points | Measurement |
|-----------|--------|-------------|
| Entries | 10 | KB has content (2 pts per 5 entries) |
| Coverage | 10 | Domain docs exist (2 pts per doc) |
| Embeddings | 10 | Vectors generated |
| Freshness | 10 | Updated within 24h=10, 7d=7, 30d=4 |

### App Score (40 points)
| Component | Points | Measurement |
|-----------|--------|-------------|
| KB Citations | 15 | Code files cite KB sources |
| Gap Resolution | 10 | 10 - (unresolved gaps) |
| Test Coverage | 10 | Tests exist and pass |
| Security | 5 | .gitignore excludes .env |

### Process Score (20 points)
| Component | Points | Measurement |
|-----------|--------|-------------|
| Phase Completion | 10 | % of phases completed |
| Gates Passed | 5 | % of gates verified |
| Documentation | 5 | README, API docs, architecture |

---

## How It Works

### 1. `kb_first_assess` - Establish Baseline

**ALWAYS RUN FIRST.** Returns:
```json
{
  "action": "BASELINE_ESTABLISHED",
  "total": 47,
  "grade": "D",
  "summary": { "kb": "12/40", "app": "25/40", "process": "10/20" },
  "breakdown": { ... component details ... }
}
```

### 2. `kb_first_phase` - Get Phase Guidance

**Shows phase tasks and reminds you of baseline:**
```json
{
  "phase": 3,
  "name": "KB Population",
  "baseline": { "score": 47, "grade": "D" },
  "tasks": ["Collect domain content", "Generate embeddings", ...],
  "reminder": "⚠️ Run kb_first_delta when complete"
}
```

### 3. `kb_first_delta` - Measure Improvement

**THE ENFORCEMENT MECHANISM:**
```json
{
  "verdict": "PASS",
  "canProceed": true,
  "baseline": { "score": 47 },
  "current": { "score": 62 },
  "delta": { "total": "+15", "kb": "+10", "app": "+3", "process": "+2" }
}
```

Or if regression:
```json
{
  "verdict": "FAIL",
  "canProceed": false,
  "delta": { "total": "-3" },
  "blockReason": "Score dropped by 3 points. You CANNOT proceed until score improves."
}
```

### 4. `kb_first_gate` - Pass or Block

**Hard gate that enforces progress:**
```json
{
  "canProceed": true,
  "gateStatus": "PASSED",
  "scoreImprovement": "+15",
  "nextPhase": 4,
  "nextPhaseName": "Scoring & Gaps"
}
```

Or if blocked:
```json
{
  "canProceed": false,
  "blockReason": "GATE_BLOCKED: Score regression detected (-3 points)."
}
```

---

## Why Score-Driven?

> "When you just stare at something, you take shortcuts."

The previous version (v5.0) had 7 CLI commands, a skill file, a command file, and an MCP server. **Too much complexity, not enough rigor.**

v6.0 simplifies to:
- **One interface:** MCP server with 4 tools
- **One enforcement mechanism:** Scoring with delta comparison
- **One rule:** No negative deltas allowed

This prevents:
- Skipping phases
- Claiming "good enough" without measurement
- Forgetting to verify improvements
- Proceeding with regressions

---

## Trigger Phrases

- "Score my project" → `kb_first_assess`
- "What phase am I on?" → `kb_first_phase`
- "Did I improve?" → `kb_first_delta`
- "Can I proceed?" → `kb_first_gate`

---

## ⛔ Critical Rules (NEVER VIOLATE)

```
⛔ NEVER skip Phase 0 for brownfield applications
⛔ NEVER assume the KB is "good enough" without scoring
⛔ NEVER proceed past a gate without verification
⛔ NEVER mark a phase complete without running checks
⛔ NEVER skip scoring before AND after transformation
```

---

## Part 1: Intelligence Architecture

### The Four Technologies

Every KB-First application uses some combination of these:

#### 1. GNN — Graph Neural Networks (`@ruvector/gnn`)

**What it does:** Sees relationships between decisions and predicts cascading effects.

**When it's PRIMARY:**
- Decisions affect other decisions
- Need to answer "what happens if I do X?"
- Many interdependent variables

**Example domains:** Retirement planning, medical diagnosis, investment portfolios

```typescript
// GNN simulates decision cascades
const impact = await gnn.simulate(graph, {
  node: 'ss_claiming_age',
  newValue: 70
});
// Returns: effects on tax bracket, Roth space, Medicare premiums, etc.
```

#### 2. Attention Mechanisms (`@ruvector/attention`)

**What it does:** Routes queries to the right expert, compares options, focuses processing.

**When it's PRIMARY:**
- Multiple expert domains (travel: awards vs cash vs positioning)
- Need to compare many options efficiently
- Processing large amounts of content

**Key mechanisms:**
| Mechanism | Purpose |
|-----------|---------|
| MoE (Mixture of Experts) | Route query to right specialist |
| Cross-Attention | Compare two or more options |
| Flash Attention | Fast processing of large content |
| Graph Attention | Navigate relationship networks |
| Hyperbolic | Navigate hierarchies |

```typescript
// MoE routes to the right expert
const expert = await attention.routeToExpert(query, experts);
// Returns: best expert(s) for this query
```

#### 3. SONA — Self-Optimizing Neural Architecture (`@ruvector/sona`)

**What it does:** Learns from outcomes and remembers what worked.

**When it's PRIMARY:**
- "What worked for people like me?" is the core value
- You have feedback to learn from
- Building institutional knowledge over time

**Three learning loops:**
| Loop | Timing | Function |
|------|--------|----------|
| Instant (MicroLoRA) | Per-request | Fine-tune based on immediate feedback |
| Background (BaseLoRA) | Hourly | Extract patterns from successful interactions |
| Deep (EWC++) | Weekly | Consolidate without forgetting |

```typescript
// SONA recalls similar successful patterns
const patterns = await sona.recallPatterns(userProfile);
// Returns: what worked for similar users/situations
```

#### 4. Vector Search (Foundation)

**What it does:** Semantic retrieval from the knowledge base.

**Always required.** The foundation for all KB-First applications.

```sql
SELECT title, content, source_expert, confidence,
       embedding <=> $query_embedding AS distance
FROM kb_nodes
WHERE namespace = $namespace
ORDER BY distance
LIMIT 10;
```

---

### Intelligence Pattern Selection

Answer these questions to identify your pattern:

```
Q1: Does changing one variable affect many others?
    YES → Decision Web (GNN-first)
    NO  → Continue to Q2

Q2: Do you need to route queries to different expert domains?
    YES → Combinatorial Routing (Attention-first)
    NO  → Continue to Q3

Q3: Is "what worked for similar cases" the core value?
    YES → Scenario Learning (SONA-first)
    NO  → Continue to Q4

Q4: Is this a continuous monitoring/optimization loop?
    YES → Continuous Optimization (Attention + SONA)
    NO  → Standard KB-First (Vector Search primary)
```

### Technology Matrix by Pattern

| Pattern | GNN | Attention | SONA | Vector |
|---------|-----|-----------|------|--------|
| Decision Web | 🔴 PRIMARY | 🟡 Compare | 🟠 Learn patterns | ✅ Foundation |
| Combinatorial Routing | 🟠 Networks | 🔴 PRIMARY | 🟡 Success patterns | ✅ Foundation |
| Scenario Learning | 🟠 Dynamics | 🟡 Parameters | 🔴 PRIMARY | ✅ Foundation |
| Continuous Optimization | 🟡 Structure | 🔴 PRIMARY | 🔴 PRIMARY | ✅ Foundation |

---

## Part 2: The 9-Phase Build Process

Every KB-First application is built through these phases with HARD quality gates.

### Phase Overview

| Phase | Name | Sub-Phases | Gate Type |
|-------|------|------------|-----------|
| 0 | Assessment | 6 | ⛔ User Confirmation |
| 1 | Storage | 6 | Script Check |
| 1.5 | Hooks Setup | 4 | Hook Verify |
| 2 | KB Creation | 8 | Score ≥98 |
| 3 | Persistence | - | SQL Check |
| 4 | Visualization | - | Manual/Playwright |
| 5 | Integration | - | Compile Check |
| 6 | Scaffold | - | File Check |
| 7 | Build | 7 | Script Check |
| 8 | Verification | 8 | All Must Pass |
| 9 | Security | 6 | Security Audit |
| 10 | Documentation | 6 | Docs Complete |
| 11 | Deployment | 6 | Go-Live Check |

**Total Sub-Phases:** 57

---

### Phase 0: Assessment (Brownfield Only)

**Purpose:** Score existing KB and app BEFORE making any changes.

**⛔ MANDATORY for existing applications. DO NOT SKIP.**

| Sub-Phase | Name | Output |
|-----------|------|--------|
| 0.1 | Detect Application Type | greenfield/brownfield |
| 0.2 | Score Existing KB | 0-100 score |
| 0.3 | Score App Compliance | 0-100 score |
| 0.4 | Generate Gap Report | Detailed gaps list |
| 0.5 | Calculate Scope | Effort estimate |
| 0.6 | Get Confirmation | User types "PROCEED" |

**Quality Gate:** ⛔ User must type "PROCEED" to continue.

**Detailed instructions:** `./phases/00-assessment.md`

---

### Phase 1: Storage Setup

**Purpose:** Ensure persistent storage is available.

**Steps:**
```bash
# Check for running storage
docker ps | grep ruvector-db

# If not running, start it
docker run -d --name ruvector-db \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=${RUVECTOR_PASSWORD:-secret} \
  -p 5432:5432 \
  -v ~/ruvector-data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest

# Verify connection
export DATABASE_URL="postgresql://postgres:${RUVECTOR_PASSWORD:-secret}@localhost:5432/postgres"
psql "$DATABASE_URL" -c "SELECT 1"

# Initialize schema
psql "$DATABASE_URL" -f templates/schema.sql
```

**Quality Gate:** ✅ Connection verified, schema created.

**Detailed instructions:** `./phases/01-storage.md`

---

### Phase 1.5: Hooks Setup

**Purpose:** Configure Claude Code hooks for automatic KB enforcement.

**⛔ CRITICAL: Without hooks, KB-First is an honor system.**

| Sub-Phase | Name | Purpose |
|-----------|------|---------|
| 1.5.1 | Install Hooks | Install RuVector hook scripts |
| 1.5.2 | Configure Settings | Update ~/.claude/settings.json |
| 1.5.3 | Pre-train ReasoningBank | Seed KB-First patterns |
| 1.5.4 | Verify Functionality | Test hooks fire correctly |

**Quick Setup:**
```bash
# Install and configure hooks
npx @ruvector/cli hooks init
npx @ruvector/cli hooks install

# Pre-train with KB-First patterns
npx @ruvector/cli reasoningbank seed --kb-first

# Verify
./scripts/1.5-hooks-verify.sh
```

**Quality Gate:** ✅ All checks pass in `./scripts/1.5-hooks-verify.sh`

**Detailed instructions:** `./phases/01.5-hooks-setup.md`

---

### Phase 2: World-Class Knowledge Base Creation

**Purpose:** Build a KB representing the collective expertise of top 100 world experts.

This phase has 8 sub-phases:

| Sub-Phase | Purpose | Output |
|-----------|---------|--------|
| 2.1 | Domain Scoping | Formal definition, boundaries |
| 2.2 | Perspective Expansion | User types, questions, edge cases |
| 2.3 | Expert Discovery | 100 experts, 500+ content items, 1000+ insights |
| 2.4 | Completeness Audit | 30+ identified gaps |
| 2.5 | Gap Filling | All gaps addressed with sources |
| 2.6 | Structure Organization | ≤9 primary nodes, unlimited depth |
| 2.7 | Recursive Depth | Actual data at all leaf nodes |
| 2.8 | Quality Loop | Iterate until score ≥98/100 |

**Key prompts:**
- Expert discovery: `./prompts/expert-discovery.md`
- Completeness audit: `./prompts/completeness-audit.md`
- Quality critique: `./prompts/quality-critique.md`

**Quality Gate:** ✅ KB score ≥98/100, all sub-phases complete.

**Detailed instructions:** `./phases/02-kb-creation.md`

---

### Phase 3: Persistence & Verification

**Purpose:** Store KB to PostgreSQL with embeddings and verify retrieval.

**Steps:**
1. Generate embeddings for all content
2. Insert nodes with expert attribution
3. Create HNSW index for fast search
4. Verify semantic search returns relevant results
5. Generate KB statistics report

```typescript
// Verify search quality
const results = await searchKB("withdrawal rate retirement", namespace);
assert(results.length > 0);
assert(results[0].sourceExpert); // Must have attribution
assert(results[0].confidence >= 0.5); // Must have confidence
```

**Quality Gate:** ✅ All nodes persisted, semantic search returns relevant results.

**Detailed instructions:** `./phases/03-persistence.md`

---

### Phase 4: Visualization

**Purpose:** Generate interactive visualization for human verification.

**Requirements:**
- Interactive tree (expandable/collapsible)
- Click node to see content + sources
- Search functionality
- Breadcrumb navigation
- Statistics display

**Quality Gate:** ✅ Full tree renders, navigation works, leaf content visible with sources.

**Detailed instructions:** `./phases/04-visualization.md`

---

### Phase 5: KB Integration Layer

**Purpose:** Generate TypeScript SDK for application to access KB.

**Output structure:**
```
src/kb/
├── client.ts      # Query functions
├── types.ts       # TypeScript interfaces
├── tree.ts        # Tree navigation
├── validator.ts   # Startup verification
└── index.ts       # Single export
```

**The SDK enforces:**
- All queries return sources
- Confidence scores on all results
- Gap logging for unanswered queries
- Connection verification on startup

**Quality Gate:** ✅ All files compile, exports work.

**Detailed instructions:** `./phases/05-integration.md`

---

### Phase 6: Application Scaffold

**Purpose:** Create project structure with KB enforcement built in.

**Output structure:**
```
[PROJECT]/
├── src/
│   ├── kb/           # FROM PHASE 5 (read-only)
│   ├── domain/       # Domain logic (MUST use kb/)
│   ├── api/          # Routes
│   ├── components/   # UI
│   ├── pages/        # Page compositions
│   └── index.ts      # Entry point (KB verification FIRST)
├── visualization/    # FROM PHASE 4
└── KB_ENFORCEMENT.md # Rules document
```

**Quality Gate:** ✅ Structure complete, entry point verifies KB first.

**Detailed instructions:** `./phases/06-scaffold.md`

---

### Phase 7: Application Build (KB Enforced)

**Purpose:** Build the application with strict KB enforcement.

**⚠️ THIS IS WHERE SHORTCUTS HAPPEN. MAXIMUM ENFORCEMENT.**

### KB Enforcement Rules

```
RULE 1: No hardcoded domain logic
        ❌ const rate = 0.04;
        ✅ const rate = await kb.search("withdrawal rate");

RULE 2: Every domain function queries KB
        Every file in src/domain/ imports from ../kb

RULE 3: All responses include kbSources
        Traceability is mandatory

RULE 4: Startup verification required
        App exits if KB unavailable

RULE 5: No fallback logic
        ❌ rules = kb.get() || DEFAULT_RULES
        ✅ rules = kb.get(); if (!rules) throw Error("KB missing");
```

### Build Sequence

1. Generate `KB_ENFORCEMENT.md` (keep in context always)
2. Plan domain functions (list them all first)
3. Implement ONE function at a time
4. **VERIFY after EACH function:**
   - Does it import from kb/?
   - Does it return kbSources?
   - Any hardcoded values?
   - If FAIL → fix before continuing
5. Implement API layer
6. Implement UI
7. Implement pages
8. Integration testing

**Quality Gate:** ✅ All functions verified, no hardcoded values, all responses have kbSources.

**Detailed instructions:** `./phases/07-build.md`

---

### Phase 8: Final Verification

**Purpose:** Comprehensive check that all rules are followed.

**Verification checklist:**
```
[ ] No hardcoded domain values (grep for patterns)
[ ] All domain files import from kb/
[ ] All responses include kbSources array
[ ] Startup verifies KB connection before anything else
[ ] No fallback logic (no || DEFAULT patterns)
[ ] All experts have attribution
[ ] All nodes have confidence scores
[ ] Gap logging is active
[ ] Intelligence layer (GNN/Attention/SONA) properly integrated
```

**Quality Gate:** ✅ All checks pass.

**Detailed instructions:** `./phases/08-verification.md`

---

### Phase 9: Security Audit

**Purpose:** Ensure the application has no security vulnerabilities before production.

| Sub-Phase | Name | Purpose |
|-----------|------|---------|
| 9.1 | Dependency Audit | Check for vulnerable packages |
| 9.2 | OWASP Top 10 | Common vulnerability scan |
| 9.3 | SQL Injection | Verify parameterized queries |
| 9.4 | Auth & Authz | Verify access controls |
| 9.5 | Secrets | No hardcoded secrets |
| 9.6 | API Security | Rate limiting, CORS, validation |

**Quick Check:**
```bash
./scripts/9-security-audit.sh
```

**Quality Gate:** ✅ Security audit passes with 0 critical/high issues.

**Detailed instructions:** `./phases/09-security.md`

---

### Phase 10: Documentation & Versioning

**Purpose:** Complete documentation and proper versioning before production.

| Sub-Phase | Name | Purpose |
|-----------|------|---------|
| 10.1 | README | Complete project overview |
| 10.2 | API Docs | OpenAPI/Swagger specification |
| 10.3 | KB Schema | Knowledge base structure docs |
| 10.4 | Architecture | System design and diagrams |
| 10.5 | Operator Guide | Deployment and operations |
| 10.6 | Versioning | SemVer, changelog, releases |

**Quality Gate:** ✅ All documentation complete and accurate.

**Detailed instructions:** `./phases/10-documentation.md`

---

### Phase 11: Deployment Planning

**Purpose:** Deploy to production with public access.

| Sub-Phase | Name | Purpose |
|-----------|------|---------|
| 11.1 | Infrastructure | Select and provision hosting |
| 11.2 | Environment | Production configuration |
| 11.3 | CI/CD | Automated deployment pipeline |
| 11.4 | Database | Production DB setup/migration |
| 11.5 | Monitoring | Observability and alerting |
| 11.6 | Go-Live | Final verification and launch |

**Quality Gate:** ✅ Application live with monitoring active.

**Detailed instructions:** `./phases/11-deployment.md`

---

## Part 3: Pattern Implementation Guides

Detailed implementation guides for each pattern:

| Pattern | Guide |
|---------|-------|
| Decision Web | `./patterns/decision-web.md` |
| Combinatorial Routing | `./patterns/combinatorial-routing.md` |
| Scenario Learning | `./patterns/scenario-learning.md` |
| Continuous Optimization | `./patterns/continuous-optimization.md` |

---

## Part 4: Quick Reference

### SONA Configuration by Domain

| Domain Stability | ewc_lambda | base_lora_rank | pattern_threshold |
|------------------|------------|----------------|-------------------|
| Very stable (finance, law) | 0.6 | 16 | 0.8 |
| Moderate (business, travel) | 0.4 | 8-12 | 0.7 |
| Fast-changing (SEO, markets) | 0.2 | 4-8 | 0.6 |

### Attention Mechanism Selection

| Task | Mechanism |
|------|-----------|
| Route to expert | MoE |
| Compare 2 options | Cross-attention |
| Compare many options | Cross-attention + batching |
| Process long document | Flash attention |
| Process 8K+ tokens | Linear attention |
| Navigate hierarchy | Hyperbolic attention |
| Navigate graph | Graph attention |

### File References

| Reference | Path |
|-----------|------|
| PostgreSQL Functions | `./references/ruvector-functions.md` |
| Attention Mechanisms | `./references/attention-mechanisms.md` |
| SONA Configuration | `./references/sona-config.md` |
| Claude Code Hooks | `./references/hooks-integration.md` |

### Templates

| Template | Path |
|----------|------|
| Database Schema | `./templates/schema.sql` |
| KB Client | `./templates/kb-client.ts` |
| GNN Engine | `./templates/gnn-engine.ts` |
| Attention Router | `./templates/attention-router.ts` |
| SONA Config | `./templates/sona-config.ts` |

---

## Part 5: Diagnostic Mode

When reviewing an existing application, Claude checks:

### 1. Pattern Identification
- What intelligence pattern does this application need?
- Is it currently implemented correctly?

### 2. Missing Intelligence
- **Decision Web apps:** Is GNN implemented? Are relationships modeled?
- **Routing apps:** Is MoE routing to experts? Are experts defined?
- **Learning apps:** Is SONA configured? Is outcome tracking present?
- **Optimization apps:** Is the feedback loop closed?

### 3. KB Enforcement
- Are all domain values from KB?
- Do all responses have sources?
- Is startup verification in place?
- Is gap logging active?

### 4. Configuration Issues
- Is SONA ewc_lambda appropriate for domain stability?
- Are attention mechanisms matching cognitive tasks?
- Is graph structure complete (for GNN apps)?

### Diagnostic Checklist

```
INTELLIGENCE LAYER:
[ ] Primary technology identified and implemented
[ ] Secondary technology integrated
[ ] Tertiary technology available

KB ENFORCEMENT:
[ ] No hardcoded domain values
[ ] All responses have kbSources
[ ] Expert attribution on all nodes
[ ] Confidence scores present
[ ] Gap detection active
[ ] Startup verification present

CONFIGURATION:
[ ] SONA ewc_lambda matches domain stability
[ ] Attention mechanisms match tasks
[ ] Graph relationships complete (if GNN)
[ ] Expert domains defined (if MoE)
```

---

## The Core Principle

**Your knowledge base is not just storage. It's the foundation for a reasoning system.**

- **Vector search** finds relevant content
- **GNN** sees how things connect and cascade
- **Attention** routes to the right expertise and compares options
- **SONA** remembers what worked

The magic happens when these work together. A retirement advisor that just searches is a fancy FAQ. A retirement advisor with GNN modeling decision interdependencies, SONA learning from thousands of users, and cross-attention comparing scenarios — that's an intelligent system that gets smarter over time.

**Build intelligence, not just retrieval.**

---

*KB-First v3.0 — Intelligence-First Architecture*
