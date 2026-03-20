#!/usr/bin/env node
/**
 * KB GAP CLOSURE: 11 HIGH-priority upstream crate systems + 5 refreshes
 * Source: Live GitHub crawl of ruvnet/RuVector (2026-03-20 06:44 EDT)
 */
import pg from 'pg';

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

// ============================================================
// NEW ENTRIES — 11 HIGH priority upstream crate systems
// ============================================================
const newEntries = [

{
  title: 'RuVector Delta System: Behavioral Vector Change Tracking (5 Crates)',
  category: 'algorithms',
  quality: 95,
  content: `## What is the Delta System?

The ruvector-delta system (5 crates: core, wasm, index, graph, consensus) tracks how vectors CHANGE over time — not just what they are, but how they evolve. This enables drift detection, behavioral anomaly monitoring, and temporal pattern analysis.

## Architecture

- **ruvector-delta-core** — Core delta types and traits. Defines DeltaVector (the difference between two vector states), DeltaStream (time-ordered sequence of changes), and DeltaPolicy (rules for when changes are significant).
- **ruvector-delta-index** — Indexes delta vectors for efficient temporal queries. "Show me all vectors that changed more than 15% in the last hour."
- **ruvector-delta-graph** — Tracks changes across graph structures. When a node's embedding shifts, propagates awareness to connected nodes.
- **ruvector-delta-consensus** — Multi-node consensus on whether a delta represents true drift or noise. Uses voting across replica observations.
- **ruvector-delta-wasm** — WASM bindings for browser-based drift monitoring dashboards.

## When to Use

- **Embedding drift detection** — Monitor production ML models for distribution shift
- **User behavior change** — Detect when a user's query patterns diverge from historical baseline
- **Knowledge base freshness** — Identify KB entries whose embeddings have drifted from current document content
- **Security anomaly detection** — Flag vectors that suddenly change direction (possible adversarial injection)

## Key APIs

\`\`\`rust
let delta = DeltaVector::between(&old_embedding, &new_embedding);
let magnitude = delta.l2_magnitude(); // How much did it change?
let direction = delta.cosine_direction(); // Which direction?
let is_significant = policy.is_drift(&delta); // Does this matter?
\`\`\`

## Integration with SONA

Delta feeds into SONA's learning loop — significant deltas trigger re-evaluation of cached reasoning patterns, preventing stale knowledge from being served.`
},

{
  title: 'Cognitum Gate: Anytime-Valid Coherence Gate Fabric (3 Crates)',
  category: 'architecture',
  quality: 94,
  content: `## What is Cognitum Gate?

The Cognitum Gate system (cognitum-gate-kernel, cognitum-gate-tilezero, mcp-gate) provides a 256-tile coherence fabric for verifiable AI computation. It ensures that AI outputs are mathematically coherent with their inputs — not just plausible, but provably correct.

## Architecture

- **cognitum-gate-kernel** — No-std WASM kernel implementing the 256-tile coherence gate fabric. Each tile is an independent verification unit that can validate a portion of a computation. Tiles communicate via a gossip protocol to reach consensus on coherence scores.
- **cognitum-gate-tilezero** — Native arbiter for TileZero, the root tile that bootstraps the coherence verification chain. TileZero is the trust anchor — if TileZero validates, the entire fabric is coherent.
- **mcp-gate** — MCP server exposing the coherence gate as tools for Claude Code. Allows agents to submit computations for coherence verification before acting on results.

## Key Concept: Anytime-Valid

Unlike batch verification (check everything at the end), the coherence gate provides anytime-valid guarantees — you can query the coherence score at ANY point during computation, and the result is valid up to that moment. This enables:

- **Early stopping** — If coherence drops below threshold mid-computation, abort early
- **Progressive confidence** — Report confidence levels as computation progresses
- **Real-time monitoring** — Dashboard shows live coherence across all tiles

## When to Use

Use Cognitum Gate when you need mathematical guarantees about AI output quality:
- Financial calculations where errors have regulatory consequences
- Medical AI where incorrect similarity matches could affect diagnosis
- Legal document analysis where missed precedents have case impact
- Any domain where "the AI said so" is insufficient — you need "the AI proved so"`
},

{
  title: 'MCP Brain: Shared Brain Server for Cross-Session Learning (2 Crates)',
  category: 'agents',
  quality: 95,
  content: `## What is MCP Brain?

MCP Brain (mcp-brain + mcp-brain-server) enables Claude Code sessions to share learned knowledge across sessions, users, and even organizations. It's a "collective intelligence" layer — what one session learns, all sessions can access.

## Architecture

- **mcp-brain** — MCP server (local) that connects Claude Code to the Shared Brain. Exposes tools for storing, searching, and retrieving shared knowledge. Runs as an MCP server alongside Ruflo and Ruvnet-KB-first.
- **mcp-brain-server** — Cloud Run backend (axum REST API) with Firestore for metadata, GCS for vector storage, and Common Crawl integration for web-scale knowledge augmentation.

## Key Features (Updated Mar 15-17, 2026)

1. **Common Crawl Integration** (ADR-115) — Semantic compression of Common Crawl data. CDX/WARC format processing with PiQ3 quantization for efficient storage.
2. **Brain Trainer** — Core module for training shared knowledge models from session transcripts
3. **Shared Web Memory** (ADR-094) — Platform for sharing learned patterns across web-connected sessions
4. **Transfer Learning** — Knowledge learned in one domain (e.g., finance) can transfer to related domains (e.g., risk analysis)

## When to Use

- **Consulting teams** — Multiple consultants working on related client problems share discovered patterns
- **Enterprise deployment** — Company-wide Claude Code deployment where engineering best practices should propagate
- **Research labs** — Experimental findings from one researcher's session benefit all others
- **Knowledge accumulation** — Instead of each session starting from scratch, build on collective experience

## Integration

MCP Brain is designed to work alongside Ruflo (orchestration) and Ruvnet-KB-first (curated knowledge). The hierarchy: KB-first provides foundational knowledge → MCP Brain adds experiential knowledge → Ruflo orchestrates access to both.`
},

{
  title: 'RvLite: Standalone WASM Vector Database with SQL, SPARQL, and Cypher',
  category: 'wasm-local-llm',
  quality: 94,
  content: `## What is RvLite?

RvLite is a self-contained vector database that runs entirely in WASM — no server, no backend, no network. It supports three query languages (SQL, SPARQL, Cypher) and is powered by ruvector-core underneath.

## Capabilities

- **SQL queries** over vector data — SELECT, INSERT, UPDATE with vector distance operators
- **SPARQL** for RDF/knowledge graph queries — CONSTRUCT, SELECT, UPDATE
- **Cypher** for property graph queries — MATCH, CREATE, MERGE patterns
- **HNSW indexing** — Same high-performance index as ruvector-core
- **Zero dependencies** — Compiles to a single WASM module

## Target Environments

- **Browsers** — Client-side vector search (no server round-trips)
- **Node.js** — Embedded vector DB for CLI tools and scripts
- **Deno** — Native WASM support
- **Bun** — High-performance JS runtime
- **Cloudflare Workers** — Edge-deployed vector search
- **Vercel Edge Functions** — Serverless vector operations

## When to Use

- **Offline-first apps** — Vector search works without internet
- **Privacy-sensitive** — Data never leaves the client
- **Low-latency** — No network hop for search queries (15-30ms in WASM)
- **Prototyping** — Quick vector DB without infrastructure setup
- **Edge computing** — Run vector search at CDN edge locations

## Relationship to RuVector Ecosystem

RvLite is a lightweight subset of the full ruvector-postgres stack. Use RvLite for client-side/edge; use ruvector-postgres for server-side production with full SQL support, HNSW tuning, and replication.`
},

{
  title: 'ruQu: Quantum Coherence Assessment with QAOA Solver (5 Crates)',
  category: 'algorithms',
  quality: 93,
  content: `## What is ruQu?

ruQu (5 crates: ruqu-core, ruqu-algorithms, ruqu-wasm, ruqu-exotic, and the parent ruQu) is a "classical nervous system for quantum machines." It provides real-time coherence assessment using dynamic min-cut algorithms and includes a QAOA (Quantum Approximate Optimization Algorithm) solver.

## Architecture

- **ruqu-core** — Core types for quantum state representation, coherence metrics, and decoherence modeling
- **ruqu-algorithms** — Classical algorithms that simulate/assess quantum behavior: QAOA solver, variational circuits, graph-cut partitioning for qubit assignment
- **ruqu-wasm** — WASM compilation for browser-based quantum simulation dashboards
- **ruqu-exotic** — Experimental algorithms: topological error correction, exotic qubit encodings

## Key Capability: QAOA Graph-Cut Solver

The QAOA solver uses RuVector's min-cut infrastructure to solve combinatorial optimization problems:
1. Encode the problem as a graph (e.g., portfolio optimization, resource scheduling)
2. QAOA finds approximate solutions by alternating between problem Hamiltonian and mixing operator
3. Min-cut provides the partition boundaries for the solution
4. Classical post-processing refines the quantum-approximate result

## Application Domains (from upstream commits Mar 15)

Graph-cut pipelines have been built for:
- **Exomoon detection** — Signal processing for planet-finding
- **Medical imaging** — Tissue boundary detection
- **Genomics** — Gene regulatory network partitioning
- **Fintech** — Portfolio partitioning for risk isolation
- **Climate modeling** — Atmospheric circulation pattern detection

## When to Use

ruQu is primarily a research/simulation tool. Use it when:
- Exploring quantum-inspired optimization for classical problems
- Benchmarking QAOA against classical min-cut solutions
- Building coherence monitoring dashboards for quantum hardware
- Teaching quantum computing concepts with visual WASM simulations`
},

{
  title: 'RuVector Cognitive Container: Verifiable WASM with Canonical Witness Chains',
  category: 'architecture',
  quality: 93,
  content: `## What is the Cognitive Container?

ruvector-cognitive-container provides verifiable WASM execution — every computation produces a canonical witness chain that proves the computation was performed correctly. This is the bridge between "trust the code" and "verify the output."

## How It Works

1. **Computation** — Vector operations (search, distance, embedding) run inside the cognitive container
2. **Witness Generation** — Each step produces a cryptographic witness (hash of input + output + intermediate state)
3. **Chain Assembly** — Witnesses are linked into a Merkle-like chain
4. **Verification** — Anyone with the chain can verify the computation without re-executing it

## Key Components

- **Canonical Witness** — A deterministic proof of a single computation step
- **Delta Evidence** — Tracks what changed between states (integrates with ruvector-delta)
- **Shard Management** — Large computations are sharded across tiles (integrates with Cognitum Gate)
- **Report Generation** — Human-readable verification reports

## When to Use

- **Audit trails** — Prove that a similarity search returned the correct results
- **Regulatory compliance** — Demonstrate that AI decisions followed the correct algorithm
- **Multi-party verification** — Multiple parties can verify the same computation independently
- **Tamper detection** — Any modification to the computation chain breaks the witness chain`
},

{
  title: 'RuVector Graph Transformer: Proof-Gated Mutation Substrate (3 Crates)',
  category: 'neural',
  quality: 94,
  content: `## What is the Graph Transformer?

ruvector-graph-transformer (+ wasm + node) is a unified graph transformer architecture with a proof-gated mutation substrate. It combines transformer attention with graph structure, and gates mutations (graph changes) behind mathematical proofs.

## 8 Verified Intelligence Modules

1. **Physics Intelligence** — Simulate physical systems as graphs (particle interactions, field propagation)
2. **Biological Intelligence** — Model biological networks (protein interactions, gene regulation, neural circuits)
3. **Manifold Intelligence** — Process data on non-Euclidean manifolds (hyperbolic, spherical, product spaces)
4. **Temporal Intelligence** — Handle time-series graph data (evolving networks, temporal knowledge graphs)
5. **Economic Intelligence** — Model economic systems (market networks, supply chains, trade flows)
6. **Social Intelligence** — Process social networks (influence propagation, community dynamics)
7. **Spatial Intelligence** — Geographic and spatial graph processing (routing, coverage, proximity)
8. **Abstract Intelligence** — Pure mathematical graph theory (spectral analysis, topological features)

## Proof-Gated Mutations

When the graph transformer wants to modify the graph (add/remove nodes/edges), it must provide a proof that the mutation is valid:
- The proof is verified by the Cognitum Gate fabric
- Invalid mutations are rejected without side effects
- Valid mutations are recorded with canonical witnesses

## When to Use

Use when you need graph neural network capabilities with mathematical guarantees about correctness. Critical for domains where graph mutations have irreversible real-world consequences (financial networks, infrastructure graphs, biological pathways).`
},

{
  title: 'RuVector Sparse Inference: PowerInfer-Style Edge AI (2 Crates)',
  category: 'neural',
  quality: 93,
  content: `## What is Sparse Inference?

ruvector-sparse-inference (+ wasm) implements PowerInfer-style sparse neural network inference — running large models on small devices by only activating the neurons that matter for each specific input.

## How It Works

1. **Neuron Activation Prediction** — A lightweight predictor determines which neurons will be activated for the current input
2. **Selective Computation** — Only activated neurons are computed; inactive neurons are skipped entirely
3. **Hot/Cold Partitioning** — Frequently-activated neurons (hot) are kept in fast memory; rarely-activated neurons (cold) are loaded on demand
4. **WASM Deployment** — The entire sparse inference engine compiles to WASM for edge/browser execution

## Performance Characteristics

- **70-90% computation savings** on typical inputs (most neurons are inactive for any given input)
- **Sub-second inference** for billion-parameter models on consumer hardware
- **Memory proportional to active neurons**, not model size
- **WASM target** enables browser-based inference without GPU

## When to Use

- **Edge AI** — Run large models on phones, tablets, IoT devices
- **Browser-based AI** — Client-side inference without server round-trips
- **Cost optimization** — Reduce cloud inference costs by skipping unnecessary computation
- **Latency-critical** — Real-time applications where full model inference is too slow

## Integration

Works with ruvllm for full model loading and ruvector-attention for sparse attention computation. The quantization stack (PiQ3, INT8) further reduces memory requirements.`
},

{
  title: 'RuVector Attention-MinCut: Graph-Based Alternative to Softmax Attention',
  category: 'algorithms',
  quality: 94,
  content: `## What is Attention-MinCut?

ruvector-attn-mincut replaces traditional softmax attention with a dynamic graph-based min-cut operator. Instead of computing attention weights via softmax(QK^T/√d), it constructs a token interaction graph and uses min-cut to determine which tokens should attend to each other.

## Why Replace Softmax?

Softmax attention has known limitations:
- **Quadratic complexity** — O(n²) in sequence length
- **Uniform distribution bias** — Softmax spreads attention even to irrelevant tokens
- **No structural awareness** — Treats all token-pairs identically regardless of semantic relationships

Min-cut attention addresses all three:
- **Sparse by construction** — Only tokens connected in the min-cut graph attend to each other
- **Structurally aware** — Graph edges encode semantic relationships between tokens
- **Interpretable** — The min-cut partition shows exactly why certain tokens attend to others

## How It Works

1. Build a token interaction graph (edge weights from embedding similarity)
2. Compute dynamic min-cut to partition tokens into attending/non-attending groups
3. Apply attention only within attending groups
4. Update edge weights based on attention output (dynamic graph evolution)

## When to Use

- **Long context** — When sequence length makes softmax attention impractical
- **Structured data** — When tokens have natural graph relationships (code, molecules, networks)
- **Interpretability** — When you need to explain WHY the model attended to specific tokens
- **Edge deployment** — Sparse attention is more WASM-friendly than dense softmax`
},

{
  title: 'RuVector MinCut-Gated Transformer: Ultra-Low Latency Inference (2 Crates)',
  category: 'neural',
  quality: 93,
  content: `## What is the MinCut-Gated Transformer?

ruvector-mincut-gated-transformer (+ wasm) combines the transformer architecture with min-cut gating for ultra-low latency inference. The gate uses min-cut analysis to dynamically prune transformer layers and attention heads that are not contributing to the current input.

## Architecture

1. **Layer Gating** — Before each transformer layer, a lightweight min-cut analysis determines if the layer adds value for the current input. Non-contributing layers are skipped entirely.
2. **Head Pruning** — Within active layers, individual attention heads are pruned via min-cut on the head interaction graph
3. **Coherence Control** — The Cognitum Gate fabric monitors coherence throughout, ensuring pruning doesn't degrade output quality below threshold
4. **Dynamic Depth** — Different inputs use different numbers of layers — simple inputs exit early, complex inputs use the full stack

## Performance

- **2-5x speedup** over standard transformers on typical workloads
- **Maintains 95%+ quality** through coherence-gated pruning
- **WASM-compatible** for edge deployment
- **Deterministic** — Same input always produces same gating decisions (important for reproducibility)

## When to Use

- **Real-time applications** — Chat, code completion, live translation where latency matters
- **Resource-constrained environments** — Edge devices, WASM, mobile
- **Batch processing** — When processing millions of inputs, 3x speedup saves significant compute cost
- **Quality-guaranteed pruning** — Unlike random pruning, min-cut gating is mathematically optimal`
},

{
  title: 'RVF: RuVector Format Binary Ecosystem (18+ Sub-Crates)',
  category: 'architecture',
  quality: 95,
  content: `## What is RVF?

RVF (RuVector Format) is the binary container format for the entire RuVector ecosystem. Think of it as the "PDF of vector data" — a self-contained, portable, cryptographically signed format for storing and distributing vector databases, knowledge bases, and AI models.

## Sub-Crate Architecture (18+ crates)

**Core Format:**
- **rvf-types** — Core type definitions (VectorStore, Manifest, Index, Metadata)
- **rvf-wire** — Serialization/deserialization (binary wire format)
- **rvf-manifest** — Package manifest (version, dependencies, capabilities)
- **rvf-index** — HNSW and flat index serialization
- **rvf-quant** — Quantization (binary, scalar, PQ, PiQ3)
- **rvf-crypto** — Ed25519 signatures, content hashing, integrity verification

**Runtime:**
- **rvf-runtime** — Load and query RVF files at runtime
- **rvf-kernel** — WASM kernel for RVF execution
- **rvf-wasm** — Browser/edge WASM bindings
- **rvf-node** — Node.js bindings (NAPI-RS)
- **rvf-server** — HTTP server for serving RVF files

**Adapters:**
- **rvf-import** — Import from other formats (CSV, JSON, Parquet)
- **rvf-adapter-claude-flow** — Claude Flow/Ruflo integration
- **rvf-adapter-agentdb** — AgentDB integration
- **rvf-adapter-ospipe** — OS pipe integration
- **rvf-adapter-agentic-flow** — Agentic Flow integration
- **rvf-solver-wasm** — Mathematical solver in WASM

## Key Design Principles

1. **Self-describing** — An RVF file contains everything needed to use it (vectors, index, metadata, query engine)
2. **Cryptographically signed** — Ed25519 signatures prevent tampering
3. **Quantization-aware** — Multiple quantization levels in one file (full precision + compressed)
4. **Portable** — Same file works in Rust, Node.js, browser WASM, Deno, Bun, Workers
5. **Streamable** — Can be read progressively (don't need to load entire file)

## The RVF File in Ask-Ruvnet

Your \`knowledge.rvf\` file (628KB) is an RVF container. It holds all 423 KB entries with HNSW-indexed vectors in a single portable file. The MCP server can serve from either the RVF file or the exploded kb-data/ directory.`
}
];

// ============================================================
// REFRESH ENTRIES — 5 existing entries that need updates
// ============================================================
const refreshes = [
{
  titleMatch: 'ruvllm',
  appendContent: `

## Updates (March 12-13, 2026)

- **Ultra-Low-Bit QAT (ADR-090)** — Quantization-Aware Training now supports 2-bit and 3-bit weights with PiQ3 (pi-digit dithering) for near-lossless compression at extreme ratios
- **Pi-Quantization** — Novel quantization using pi-digit sequences for deterministic dithering, achieving better accuracy than random dithering at the same bit-width
- **MoE Memory-Aware Routing (ADR-092)** — Mixture-of-Experts routing now tracks expert memory footprint and routes to experts that fit in available memory, preventing OOM on constrained devices
- **SIMD Kernel Optimization** — MoE routing uses buffer reuse to eliminate allocation overhead in hot paths
- **WASM Type Fix** — Resolved WASM type mismatch in hnsw_router (Mar 18)`
},
{
  titleMatch: 'ruvector-cnn',
  appendContent: `

## Updates (March 12, 2026)

- **INT8 CNN Quantization (ADR-091)** — Full INT8 inference pipeline with SIMD-accelerated kernels. Quantizes both weights and activations to 8-bit integers for 4x throughput improvement on CPU. Includes contrastive learning for maintaining feature quality through quantization.`
},
{
  titleMatch: 'rvAgent',
  appendContent: `

## Updates (March 16, 2026)

- **DeepAgents Rust Conversion (ADR-093 to ADR-103)** — Complete conversion of the DeepAgents framework from Python to Rust. 10 Architecture Decision Records covering: agent lifecycle management, tool execution sandboxing, subagent communication protocols, middleware pipeline optimization, and WASM compilation targets. This makes rvAgent a fully self-contained Rust agent framework with no Python dependencies.`
},
{
  titleMatch: 'ruvix',
  appendContent: `

## Updates (March 14, 2026)

- **CLI Implementation** — Full command-line interface for interacting with the ruvix kernel: boot, halt, inspect memory regions, manage capabilities, launch agents
- **Kernel Shell** — Interactive shell running inside the ruvix kernel for debugging and agent management
- **PBFT Consensus** — Practical Byzantine Fault Tolerance consensus protocol for multi-node ruvix deployments, enabling distributed agent orchestration with Byzantine fault tolerance`
},
{
  titleMatch: 'SONA: Self-Optimizing',
  appendContent: `

## Updates (March 17, 2026)

- **Security Patches** — Fixed command injection vulnerability in SONA configuration parsing
- **Bug Fixes** — Resolved issues with EWC lambda overflow at extreme values, LoRA adapter hot-swap race condition
- **Published Versions** — ruvector-sona 0.1.6 on crates.io, @ruvector/sona on npm`
}
];

// ============================================================
// PIPELINE
// ============================================================
async function main() {
  console.log(`\n=== Gap Closure: ${newEntries.length} new + ${refreshes.length} refreshes ===\n`);

  let inserted = 0, refreshed = 0, skipped = 0;

  // Insert new entries
  for (const entry of newEntries) {
    const existing = await pool.query(
      'SELECT id FROM ask_ruvnet.kb_complete WHERE title = $1', [entry.title]
    );
    if (existing.rows.length > 0) {
      console.log(`  SKIP (exists): ${entry.title.slice(0, 55)}`);
      skipped++;
      continue;
    }

    const embText = `${entry.title}\n\n${entry.content.slice(0, 1000)}`;
    console.log(`  Embedding: ${entry.title.slice(0, 55)}...`);
    const vec = await embed(embText);

    await pool.query(
      `INSERT INTO ask_ruvnet.kb_complete
       (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
       VALUES ($1, $2, $3, $4, $5, 1, $6, $7)`,
      [
        `upstream-gaps/2026-03-20/${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
        entry.title, entry.content, entry.category, entry.quality, entry.content.length, vec
      ]
    );
    inserted++;
    console.log(`  INSERTED: ${entry.title.slice(0, 55)}`);
  }

  // Refresh existing entries
  for (const refresh of refreshes) {
    const existing = await pool.query(
      "SELECT id, title, content FROM ask_ruvnet.kb_complete WHERE title ILIKE $1 LIMIT 1",
      [`%${refresh.titleMatch}%`]
    );
    if (existing.rows.length === 0) {
      console.log(`  SKIP REFRESH (not found): ${refresh.titleMatch}`);
      continue;
    }

    const row = existing.rows[0];
    const newContent = row.content + refresh.appendContent;
    const embText = `${row.title}\n\n${newContent.slice(0, 1000)}`;
    console.log(`  Refreshing: ${row.title.slice(0, 55)}...`);
    const vec = await embed(embText);

    await pool.query(
      `UPDATE ask_ruvnet.kb_complete SET content = $1, embedding = $2, updated_at = now() WHERE id = $3`,
      [newContent, vec, row.id]
    );
    refreshed++;
    console.log(`  REFRESHED: ${row.title.slice(0, 55)}`);
  }

  console.log(`\n=== Done: ${inserted} inserted, ${refreshed} refreshed, ${skipped} skipped ===`);
  const { rows } = await pool.query('SELECT count(*) as total FROM ask_ruvnet.kb_complete');
  console.log(`Total KB entries: ${rows[0].total}\n`);

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
