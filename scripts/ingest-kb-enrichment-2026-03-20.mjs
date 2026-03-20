#!/usr/bin/env node
/**
 * KB ENRICHMENT: Fill identified gaps (2026-03-20)
 *
 * Adds entries for topics identified as MISSING or THIN in the KB audit:
 * - rvAgent (Rust agent framework) — 0 entries
 * - ruvix cognitive OS — 0 entries
 * - Formal verification / Lean proofs — 0 entries
 * - Hard gates (quality enforcement) — 0 entries
 * - Hooks integration (Claude Code) — 0 entries
 * - Decision Web (GNN pattern) — 0 entries
 * - Scenario Learning (SONA pattern) — 0 entries
 * - Continuous Optimization pattern — 0 entries
 * - Attention Router (MoE template) — 0 entries
 * - GNN Engine (Louvain + MinCut template) — 0 entries
 * - Error Recovery (phase failure procedures) — 0 entries
 *
 * Uses ONNX embeddings (Xenova/all-MiniLM-L6-v2).
 * Writes to ask_ruvnet.kb_complete with HNSW-indexed vectors.
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REF_DIR = join(ROOT, 'docs', 'ruvector-reference');

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres', max: 2
});

let embedder;
async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function embed(text) {
  const e = await getEmbedder();
  const out = await e(text, { pooling: 'mean', normalize: true });
  return '[' + Array.from(out.data).join(',') + ']';
}

function readRef(subpath) {
  try {
    return readFileSync(join(REF_DIR, subpath), 'utf-8');
  } catch {
    return null;
  }
}

// ============================================================
// KNOWLEDGE ENTRIES — teaching-quality, validated content
// ============================================================
const entries = [

// ─── 1. rvAgent: Rust Agent Framework ───
{
  title: 'rvAgent: RuVector Rust Agent Framework with MCP/ACP Protocol Support',
  category: 'agents',
  quality: 95,
  content: `## What is rvAgent?

rvAgent is a complete Rust-native AI agent framework in the RuVector ecosystem. It provides the foundation for building autonomous agents that communicate via both MCP (Model Context Protocol) and ACP (Agent Communication Protocol).

## Architecture

rvAgent is organized as a Rust workspace with these crates:
- **rvagent-core** — Agent lifecycle, state machine, message routing
- **rvagent-backends** — LLM provider integrations (OpenAI, Anthropic, local models via ruvllm)
- **rvagent-middleware** — Request/response processing pipeline (logging, rate limiting, auth)
- **rvagent-tools** — Tool registration, schema validation, execution sandboxing
- **rvagent-subagents** — Hierarchical agent spawning with parent-child communication
- **rvagent-cli** — CLI interface for agent management and testing
- **rvagent-wasm** — WASM compilation target for browser-based agents

## Key Features

1. **Dual Protocol Support** — Agents can expose tools via MCP (for Claude Code integration) and communicate with other agents via ACP
2. **Middleware Pipeline** — Composable middleware for authentication, rate limiting, PII detection, and audit logging
3. **Subagent Orchestration** — Parent agents can spawn child agents with scoped permissions and shared memory
4. **WASM Portability** — Compile agents to WASM for deployment in browsers, edge workers, or Deno

## When to Use rvAgent vs Ruflo Agents

- **rvAgent**: When you need bare-metal performance, custom protocol handling, or WASM deployment
- **Ruflo agents**: When you need rapid orchestration with Claude Code integration, task management, and the full MCP tool ecosystem

rvAgent is the low-level foundation; Ruflo is the high-level orchestrator that can use rvAgent agents as execution backends.`
},

// ─── 2. ruvix: Cognitive Operating System ───
{
  title: 'ruvix: Cognitive Operating System Kernel for Autonomous AI Hardware',
  category: 'architecture',
  quality: 93,
  content: `## What is ruvix?

ruvix is a bare-metal operating system kernel designed specifically for AI workloads. Written in Rust with AArch64 assembly, it implements a capabilities-based security model and is designed to run AI agents directly on hardware without a traditional OS layer.

## Architecture

ruvix implements these subsystems:
- **Nucleus** — Microkernel core with capability-based access control
- **HAL (Hardware Abstraction Layer)** — AArch64-specific hardware interface
- **Region Manager** — Physical memory management with NUMA awareness
- **Scheduler** — Multi-queue scheduler optimized for AI inference workloads
- **VecGraph** — In-kernel vector graph engine for agent state management
- **DMA Engine** — Direct memory access for GPU/accelerator communication
- **Network Stack** — Lightweight TCP/IP for distributed agent communication
- **Shell** — Minimal shell for debugging and agent management

## Key Capabilities

1. **Capabilities-Based Security** — Every resource access requires a capability token. Agents cannot access memory, devices, or network without explicit capabilities granted by the nucleus.
2. **SMP Support** — Symmetric multiprocessing for multi-core AI inference
3. **QEMU Swarm Testing** — Built-in support for testing swarms of ruvix instances in QEMU
4. **Device Tree (DTB)** — Automatic hardware discovery and configuration

## When to Use ruvix

ruvix is experimental/research-grade. Use it when:
- Building dedicated AI appliances that run agents without Linux overhead
- Researching trusted execution environments for AI
- Need capability-based isolation between agent workloads
- Academic research on AI-optimized operating systems

For production deployments, use standard Linux + RuVector + Ruflo instead.`
},

// ─── 3. Formal Verification with Lean ───
{
  title: 'RuVector Verified: Formal Verification of Vector Operations with Lean Proofs',
  category: 'algorithms',
  quality: 92,
  content: `## What is ruvector-verified?

ruvector-verified provides mathematically proven correctness guarantees for critical RuVector operations using the Lean theorem prover. The companion crate lean-agentic extends Lean with agent-specific verification patterns.

## What Gets Verified

1. **Distance Functions** — Cosine similarity, L2 distance, and inner product implementations are proven correct against their mathematical definitions
2. **HNSW Invariants** — The navigable small world graph structure maintains its connectivity guarantees after insertions and deletions
3. **Quantization Bounds** — Binary and scalar quantization error bounds are proven, ensuring recall guarantees
4. **MinCut Correctness** — The min-cut algorithm is proven to return the actual minimum cut (not an approximation)

## Why This Matters

Vector databases are increasingly used in safety-critical applications:
- Medical diagnosis (similarity search over patient records)
- Financial fraud detection (anomaly detection via embeddings)
- Autonomous systems (scene understanding via vector matching)

In these domains, "probably correct" is not sufficient. Formal verification provides mathematical certainty.

## How It Works

The verification pipeline:
1. Rust implementation in ruvector-core
2. Lean specification of the mathematical properties
3. lean-agentic generates proof obligations from the Rust code
4. Lean verifies each proof obligation
5. Verified code is tagged and published as ruvector-verified

## Current Status

ruvector-verified covers the core distance functions and basic HNSW operations. Full coverage of the dynamic min-cut algorithm and attention mechanisms is in progress.`
},

// ─── 4. Hard Gates: Quality Enforcement ───
{
  title: 'Hard Gates: Non-Negotiable Quality Gates for KB-Powered Application Development',
  category: 'architecture',
  quality: 94,
  content: readRef('references/hard-gates.md') || `## Hard Gates System

Hard Gates define 8 non-negotiable quality checkpoints in the KB-First development methodology. Each gate must pass before proceeding to the next phase.

### Gate Definitions

| Gate | Transition | Requirement | Verification |
|------|-----------|-------------|--------------|
| G0 | Assessment → Storage | User explicitly says "PROCEED" | Manual confirmation |
| G1 | Storage → KB Creation | Database schema deployed, indexes created | SQL verification |
| G2 | KB Creation → Persistence | KB Score >= 98/100 on 7 dimensions | Automated scoring |
| G3 | Persistence → Visualization | All embeddings present, HNSW index built | Vector count check |
| G4 | Visualization → Integration | Dashboard loads, all categories render | Visual verification |
| G5 | Integration → Scaffold | TypeScript compiles with zero errors | tsc --noEmit |
| G6 | Scaffold → Build | All API endpoints respond correctly | Integration tests |
| G7 | Build → Verification | All 8 verification checks pass | Automated suite |

### Philosophy

Hard gates exist because skipping quality checks creates technical debt that compounds. A KB with a score of 85 will produce inferior search results in every query for the lifetime of the application. The 13 points between 85 and 98 represent thousands of poor results over time.

### Enforcement

Gates are enforced by the KB-First CLI and hooks system. Attempting to run a phase before its gate passes produces an error with specific remediation steps.`
},

// ─── 5. Hooks Integration ───
{
  title: 'Claude Code Hooks Integration: PreToolUse and PostToolUse for KB Enforcement',
  category: 'architecture',
  quality: 93,
  content: `## Hooks Integration for KB-First Applications

Claude Code hooks allow KB-First applications to enforce quality standards automatically during development. Hooks intercept tool calls and inject KB-aware behavior.

### Hook Types

1. **PreToolUse** — Fires before Claude uses Read, Edit, Write, or Bash tools
   - Check if the file being edited is KB-governed
   - Inject relevant KB context into Claude's reasoning
   - Block edits that would violate architectural patterns

2. **PostToolUse** — Fires after tool execution
   - Log tool usage patterns for analytics
   - Trigger KB updates when code changes affect documented patterns
   - Run verification checks after edits

3. **SessionStart** — Fires when a Claude Code session begins
   - Load project-specific KB context
   - Initialize curation pipeline state
   - Inject CLAUDE.md-level instructions

4. **SessionEnd** — Fires when a session ends
   - Persist learned patterns to KB
   - Update quality scores based on session outcomes
   - Sync local changes to PostgreSQL

### Configuration

Hooks are defined in ~/.claude/settings.json or project-level .claude/settings.json:

{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": "node hooks/kb-enforce.js" }]
    }]
  }
}

### Integration with Ruflo

Ruflo's hooks system (hooks_pre-edit, hooks_post-edit, hooks_intelligence_learn) provides a complementary layer. KB-First hooks handle content quality; Ruflo hooks handle agent orchestration and learning.`
},

// ─── 6. Decision Web Pattern (GNN) ───
{
  title: 'Decision Web Pattern: Using Graph Neural Networks for Cascade Effect Prediction',
  category: 'algorithms',
  quality: 94,
  content: readRef('patterns/decision-web.md')?.slice(0, 4000) || `## Decision Web Pattern

The Decision Web pattern uses Graph Neural Networks (GNN) to model and predict cascade effects in complex decision systems. It is one of four intelligence patterns in the KB-First architecture.

### When to Use

Use the Decision Web when your application needs to:
- Predict how one decision cascades through a system (e.g., changing a pricing tier affects user behavior, revenue, support load)
- Model interdependencies between business entities
- Detect feedback loops and unintended consequences before they happen

### Architecture

1. **GNN Engine** (ruvector-gnn) — Processes the decision graph
   - GCN layers for neighborhood aggregation
   - GAT layers for attention-weighted message passing
   - Louvain clustering for community detection within the decision space

2. **MinCut Integration** — Identifies critical decision boundaries
   - Which decisions are most "load-bearing" in the cascade?
   - Where are the natural partition boundaries?

3. **Simulation Engine** — Runs forward predictions
   - Monte Carlo simulation over the decision graph
   - Confidence intervals for cascade magnitude

### Implementation

The GNN Engine template (templates/gnn-engine.ts) provides a 1092-line TypeScript implementation with:
- Graph construction from entity relationships
- Louvain clustering with configurable resolution
- MinCut analysis for boundary detection
- Cascade simulation with configurable depth

### Quality Metrics

- Cascade prediction accuracy > 85%
- Graph processing latency < 200ms for graphs under 10K nodes
- Louvain convergence within 50 iterations`
},

// ─── 7. Scenario Learning Pattern (SONA) ───
{
  title: 'Scenario Learning Pattern: Adaptive AI with SONA for Domain-Specific Expertise',
  category: 'neural',
  quality: 93,
  content: readRef('patterns/scenario-learning.md')?.slice(0, 4000) || `## Scenario Learning Pattern

The Scenario Learning pattern uses SONA (Self-Optimizing Neural Architecture) to build AI systems that learn from each interaction and adapt to domain-specific scenarios over time.

### When to Use

Use Scenario Learning when:
- Your application serves a specialized domain (finance, healthcare, legal)
- Users repeatedly query about similar scenarios with variations
- The AI needs to get better at domain-specific tasks over time
- You need to preserve knowledge across model updates (catastrophic forgetting prevention)

### SONA Components

1. **Elastic Weight Consolidation (EWC)** — Prevents catastrophic forgetting
   - ewc_lambda parameter controls forgetting resistance (0.2 for fast-changing domains, 0.6 for stable domains)
   - Higher lambda = more resistance to forgetting old knowledge

2. **Micro-LoRA Adapters** — Lightweight domain adaptation
   - base_lora_rank controls adapter capacity (4-16 typical)
   - Each scenario type gets its own adapter
   - Adapters can be hot-swapped at inference time

3. **Reasoning Bank** — Stores successful reasoning chains
   - When the AI solves a problem well, the reasoning chain is compressed and stored
   - Future similar queries retrieve and adapt stored reasoning
   - pattern_threshold controls match sensitivity (0.75 typical)

### Domain-Specific Configuration

| Domain | ewc_lambda | lora_rank | pattern_threshold |
|--------|-----------|-----------|-------------------|
| Finance | 0.6 | 8 | 0.85 |
| Healthcare | 0.5 | 12 | 0.80 |
| Legal | 0.4 | 16 | 0.75 |
| Marketing | 0.3 | 4 | 0.70 |
| General | 0.2 | 8 | 0.75 |`
},

// ─── 8. Continuous Optimization Pattern ───
{
  title: 'Continuous Optimization Pattern: Real-Time Performance Tuning with Flash Attention',
  category: 'neural',
  quality: 92,
  content: readRef('patterns/continuous-optimization.md')?.slice(0, 4000) || `## Continuous Optimization Pattern

The Continuous Optimization pattern combines Flash Attention mechanisms with SONA's learning capabilities to create systems that continuously tune their own performance characteristics.

### When to Use

Use Continuous Optimization when:
- Your system needs to maintain optimal performance as data distributions shift
- Query patterns change over time (seasonal, user growth, content evolution)
- You need automatic HNSW index parameter tuning
- Embedding model selection should adapt to actual query patterns

### Architecture

1. **Performance Monitor** — Tracks query latency, recall, and throughput
2. **Flash Attention Layer** — Rapid pattern matching for optimization decisions
3. **SONA Learner** — Stores and retrieves successful optimization strategies
4. **Parameter Tuner** — Adjusts HNSW ef_search, quantization levels, cache sizes

### Auto-Tuning Cycle

1. Monitor detects performance regression (latency > threshold or recall < target)
2. Flash Attention identifies the most similar past performance state
3. SONA retrieves the optimization strategy that resolved that state
4. Parameter Tuner applies adjustments (HNSW ef_search, batch sizes, cache eviction)
5. Monitor verifies improvement; SONA stores the outcome

### Key Parameters

- monitoring_window: How many queries before checking (default: 1000)
- regression_threshold: Latency increase % that triggers optimization (default: 15%)
- recall_floor: Minimum acceptable recall (default: 0.95)
- max_ef_search: Upper bound for HNSW search parameter (default: 500)`
},

// ─── 9. Attention Router Template ───
{
  title: 'Attention Router: Mixture-of-Experts Routing with Cross-Attention for KB Search',
  category: 'algorithms',
  quality: 93,
  content: `## Attention Router

The Attention Router is a TypeScript implementation that combines Mixture-of-Experts (MoE) routing with cross-attention mechanisms to route queries to the most relevant KB experts.

### How It Works

1. **Query Embedding** — Input query is embedded using the same model as KB entries
2. **Expert Matching** — Cosine similarity ranks the query against expert profiles
3. **Cross-Attention** — Top-k experts attend to the query to produce weighted responses
4. **Response Fusion** — Attention-weighted expert outputs are fused into a single response

### Key Classes

- **AttentionRouter** — Main router class (534 lines)
  - route(queryEmbedding): Returns ranked expert matches with confidence scores
  - compare(expertA, expertB, query): Head-to-head expert comparison
  - addExpert(expert): Register a new expert with profile embedding

- **Expert** — Expert profile with embedding, domain, and response function
- **RouteResult** — Ranked list of expert matches with scores and metadata

### Integration with PostgreSQL

The router can use SQL-based routing for large expert pools:
SELECT id, title, 1 - (embedding <=> query_vec) as similarity
FROM ask_ruvnet.kb_complete
ORDER BY embedding <=> query_vec
LIMIT 10;

### When to Use

- KB has 100+ entries across 10+ categories — simple vector search isn't precise enough
- Different categories need different response strategies (code examples vs explanations)
- You need explainable routing decisions (why was this expert chosen?)

### Performance

- Routing latency: 2-5ms for up to 50 experts (in-memory)
- SQL routing: 15-30ms for 10K+ entries (with HNSW index)`
},

// ─── 10. GNN Engine Template ───
{
  title: 'GNN Engine: Graph Neural Network with Louvain Clustering and MinCut Analysis',
  category: 'algorithms',
  quality: 93,
  content: `## GNN Engine

The GNN Engine is a 1092-line TypeScript implementation providing graph neural network capabilities for KB-powered applications. It combines GCN/GAT layers, Louvain community detection, and MinCut analysis.

### Capabilities

1. **Graph Construction** — Build graphs from entity relationships, KB entries, or user interaction patterns
2. **Louvain Clustering** — Detect natural communities in the graph (configurable resolution parameter)
3. **GCN Layers** — Graph Convolutional Network for feature propagation across neighbors
4. **GAT Layers** — Graph Attention Network for attention-weighted message passing
5. **MinCut Analysis** — Find minimum cuts to identify weak connections and partition boundaries
6. **Cascade Simulation** — Forward propagation to predict cascade effects

### Key Methods

- buildGraph(entities, relations): Construct a directed weighted graph
- louvainCluster(resolution): Detect communities, returns cluster assignments
- gcnForward(features, adjacency, weights): One GCN layer forward pass
- gatForward(features, adjacency, attention): One GAT layer with multi-head attention
- minCut(source, sink): Find minimum cut between two nodes
- simulateCascade(startNode, depth): Monte Carlo cascade simulation

### Use Cases

1. **KB Organization** — Cluster KB entries by semantic relatedness (not just category tags)
2. **Dependency Analysis** — Model code dependencies as a graph, find critical paths
3. **User Behavior** — Model user navigation patterns, predict next actions
4. **Network Security** — Find bottleneck nodes whose compromise would partition the network

### Integration with RuVector

For large graphs (10K+ nodes), use ruvector-gnn (Rust, WASM-compiled) instead of this TypeScript implementation. The API is similar but performance is 100x better.`
},

// ─── 11. Error Recovery Procedures ───
{
  title: 'Error Recovery: Phase Failure Procedures for KB-First Development',
  category: 'architecture',
  quality: 91,
  content: readRef('references/error-recovery.md')?.slice(0, 4000) || `## Error Recovery Procedures

When a phase or gate fails in the KB-First development methodology, these procedures guide recovery without data loss.

### Phase-Specific Recovery

**Phase 0 (Assessment) Failures:**
- Symptom: Cannot determine app type (greenfield vs brownfield)
- Recovery: Check for package.json, existing DB schemas, git history. If ambiguous, default to brownfield assessment.

**Phase 1 (Storage) Failures:**
- Symptom: PostgreSQL connection refused or schema creation fails
- Recovery: Check port 5435 (ruvector-postgres default). Verify Docker container is running. Recreate schema if corrupted.

**Phase 2 (KB Creation) Failures:**
- Symptom: KB score below 98/100
- Recovery: Run gap analysis (scripts/test-kb-completeness.mjs). Identify weakest dimension. Add targeted entries for that dimension. Re-score.

**Phase 3 (Persistence) Failures:**
- Symptom: Embeddings missing or dimension mismatch
- Recovery: Re-run embedding generation (scripts/fix-all-kb-embeddings.mjs). Verify model outputs 384 dimensions. Rebuild HNSW index.

**Phase 8 (Verification) Failures:**
- Symptom: One or more verification checks fail
- Recovery: Run each check individually to isolate the failure. Common causes: missing imports, stale TypeScript types, environment variable not set.

### General Recovery Principles

1. **Never skip a gate** — Fix the root cause, don't bypass the check
2. **Preserve data** — Always backup before attempting recovery (pg_dump the schema)
3. **Re-run from the failed phase** — Don't restart from Phase 0 unless data is corrupted
4. **Check logs** — scripts/logs/ contains detailed output from each phase run`
}

];

// ============================================================
// INGESTION PIPELINE
// ============================================================
async function ingest() {
  console.log(`\n=== KB Enrichment: ${entries.length} new entries ===\n`);

  let inserted = 0;
  let skipped = 0;

  for (const entry of entries) {
    // Check for duplicate by title
    const existing = await pool.query(
      'SELECT id FROM ask_ruvnet.kb_complete WHERE title = $1',
      [entry.title]
    );

    if (existing.rows.length > 0) {
      console.log(`  SKIP (exists): ${entry.title.slice(0, 60)}`);
      skipped++;
      continue;
    }

    // Generate embedding
    const embText = `${entry.title}\n\n${entry.content.slice(0, 1000)}`;
    console.log(`  Embedding: ${entry.title.slice(0, 60)}...`);
    const vec = await embed(embText);

    // Insert
    await pool.query(
      `INSERT INTO ask_ruvnet.kb_complete
       (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
       VALUES ($1, $2, $3, $4, $5, 1, $6, $7)`,
      [
        `enrichment/2026-03-20/${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
        entry.title,
        entry.content,
        entry.category,
        entry.quality,
        entry.content.length,
        vec
      ]
    );
    inserted++;
    console.log(`  INSERTED: ${entry.title.slice(0, 60)} (${entry.category}, q=${entry.quality})`);
  }

  console.log(`\n=== Done: ${inserted} inserted, ${skipped} skipped ===`);

  // Show new total
  const { rows } = await pool.query('SELECT count(*) as total FROM ask_ruvnet.kb_complete');
  console.log(`Total KB entries: ${rows[0].total}\n`);

  await pool.end();
}

ingest().catch(err => { console.error(err); process.exit(1); });
