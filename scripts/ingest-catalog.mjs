#!/usr/bin/env node
/**
 * ingest-catalog.mjs — Ingests the ruvector-catalog into kb_complete
 *
 * Reads all 17 catalog docs + catalog.json, creates teaching-quality KB entries
 * for every crate/technology, generates ONNX embeddings, and upserts to kb-master.json.
 *
 * Usage: node scripts/ingest-catalog.mjs [--dry-run] [--doc <name>]
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(import.meta.dirname, '..');
const CATALOG_DIR = path.join(ROOT, '..', 'ruvector-catalog', 'ruvector-catalog');
const DOCS_DIR = path.join(CATALOG_DIR, 'docs');
const MASTER_PATH = path.join(ROOT, 'kb-master.json');
const DRY_RUN = process.argv.includes('--dry-run');
const SINGLE_DOC = process.argv.includes('--doc') ? process.argv[process.argv.indexOf('--doc') + 1] : null;

const DIMENSIONS = 384;
const QUALITY_SCORE = 97; // Catalog entries are source-verified, high quality

// Category mapping for each doc
const DOC_CATEGORIES = {
  vector_search: 'vector-db',
  graph_intelligence: 'architecture',
  attention_mechanisms: 'neural',
  self_learning: 'neural',
  coherence_safety: 'security',
  nervous_system: 'neural',
  mathematics: 'algorithms',
  solvers: 'algorithms',
  mincut: 'algorithms',
  llm_runtime: 'wasm-local-llm',
  quantum: 'algorithms',
  distributed: 'architecture',
  storage: 'vector-db',
  ospipe: 'architecture',
  robotics: 'architecture',
  financial: 'architecture',
  exotic: 'algorithms',
};

let onnxSvc = null;
let master = null; // kb-master.json data
let stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

// ─── ONNX Embedding Service ────────────────────────────────────────────────

async function initOnnx() {
  const embPath = path.join(
    os.homedir(),
    '.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js'
  );
  if (!fs.existsSync(embPath)) {
    console.error('❌ ONNX embedding service not found at', embPath);
    process.exit(1);
  }
  const mod = await import(embPath);
  onnxSvc = await mod.createEmbeddingServiceAsync({
    provider: 'transformers',
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: DIMENSIONS,
  });
  await onnxSvc.embed('warmup');
  console.log('✅ ONNX embedding service ready (384-dim)');
}

async function embed(text) {
  const truncated = text.substring(0, 2000);
  const result = await onnxSvc.embed(truncated);
  return Array.from(result.embedding);
}

// ─── kb-master.json (replaces PostgreSQL) ─────────────────────────────────

function initMaster() {
  if (!fs.existsSync(MASTER_PATH)) {
    console.error('❌ kb-master.json not found. Run: node scripts/migrate-pg-to-master.mjs');
    process.exit(1);
  }
  master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
  console.log(`✅ kb-master.json loaded — ${master.entryCount} existing entries`);
}

function saveMaster() {
  master.entryCount = master.entries.length;
  fs.writeFileSync(MASTER_PATH, JSON.stringify(master, null, 2));
}

async function upsertEntry(entry) {
  const filePath = `catalog/${entry.domain}/${slug(entry.title)}`;

  if (DRY_RUN) {
    console.log(`  [DRY] Would upsert: "${entry.title}" (${entry.category}) [${entry.content.length} chars]`);
    stats.created++;
    return;
  }

  const embedding = await embed(entry.title + '\n' + entry.content);
  const existing = master.entries.findIndex(e => e.file_path === filePath);

  const record = {
    id: `catalog_${slug(entry.title)}`,
    title: entry.title,
    content: entry.content,
    category: entry.category,
    quality_score: entry.quality_score || QUALITY_SCORE,
    file_path: filePath,
    embedding: embedding,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing >= 0) {
    record.created_at = master.entries[existing].created_at;
    master.entries[existing] = record;
    stats.updated++;
    console.log(`  🔄 Updated: "${entry.title}"`);
  } else {
    master.entries.push(record);
    stats.created++;
    console.log(`  ✅ Created: "${entry.title}"`);
  }
}

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// ─── Entry Definitions ────────────────────────────────────────────────────
// Each function returns an array of { title, content, category, domain }

function vectorSearchEntries(doc) {
  return [
    {
      title: 'RuVector Vector Search: Complete Capability Guide (6 Algorithms)',
      domain: 'vector_search',
      category: 'vector-db',
      content: `RuVector provides 6 distinct vector search algorithms across multiple crates, each optimized for different use cases.

## Algorithms

**1. HNSW (ruvector-core)** — The default. Hierarchical Navigable Small World graph for approximate nearest neighbor search. 61μs p50 query latency, O(log n) complexity. Configurable: M (graph connectivity), ef_construction (build quality), ef_search (query accuracy). Production-ready.

**2. DiskANN/Vamana (ruvector-core)** — For billion-scale datasets backed by SSD storage. When your data doesn't fit in RAM. Experimental status.

**3. ColBERT (ruvector-core)** — Late interaction retrieval using per-token embeddings. Better accuracy for complex queries because it matches at the token level, not just the document level. Production-ready.

**4. Matryoshka Embeddings (ruvector-core)** — Variable-dimension embeddings that can be truncated without retraining. Store full 384-dim for accuracy or 64-dim for speed. Like nesting dolls — each smaller version is still useful.

**5. Neural Hashing (ruvector-core)** — Learned binary hash codes for 32x compression. When you need massive scale and can trade some accuracy for memory savings. Production-ready.

**6. Micro HNSW (micro-hnsw-wasm)** — 11.8KB WASM binary with spiking neural network integration. For IoT, edge devices, and ASIC targets where every byte matters. Experimental.

## Hybrid Search
RuVector supports keyword+semantic hybrid search with Reciprocal Rank Fusion (RRF). Benchmarks show 20-49% better retrieval than either method alone.

## Quantization Levels
- Binary (1-bit): 32x compression, fast approximate search
- Product Quantization (PQ): Codebook-based, tunable compression
- Int8: 4x compression with minimal accuracy loss
- Temperature-tiered (via RVF): f32 for hot data → f16 → u8 → binary as data ages

## Feature Flags (ruvector-core)
\`simd\` (AVX2/SSE4/NEON), \`parallel\` (Rayon), \`storage\` (redb + memmap2), \`hnsw\`, \`memory-only\` (WASM), \`api-embeddings\` (HTTP), \`onnx-embeddings\` (local ONNX)

## Distance Metrics
Cosine, Euclidean, DotProduct, Manhattan

## Key Types
VectorDB, VectorEntry, SearchQuery, HnswConfig, DistanceMetric, DbOptions

Source: ruvector/crates/ruvector-core, ruvector/crates/micro-hnsw-wasm, catalog v3.1.0`
    },
    {
      title: 'Hyperbolic HNSW: Poincaré Ball Vector Search for Hierarchical Data',
      domain: 'vector_search',
      category: 'vector-db',
      content: `ruvector-hyperbolic-hnsw (+ WASM variant) implements HNSW search in the Poincaré ball model of hyperbolic space. This is critical for data with natural hierarchies.

## Why Hyperbolic?
Regular (Euclidean) vector spaces struggle with hierarchical data — taxonomies, org charts, knowledge graphs, category trees. Hyperbolic space naturally represents tree-like structures because it has exponentially more room as you move away from the center.

## How It Works
- Vectors live in the Poincaré ball (unit disk/sphere)
- Distance uses the hyperbolic metric: d(x,y) = acosh(1 + 2||x-y||²/((1-||x||²)(1-||y||²)))
- HNSW graph is built using this distance
- Möbius operations (addition, scalar multiplication) replace Euclidean ones
- Tangent space mapping for gradient-based operations

## When to Use
- Taxonomy/ontology search (e.g., product categories)
- Knowledge graph embeddings (entities with is-a relationships)
- Organizational hierarchies
- Any data where "parent-child" relationships matter
- 20x memory reduction on taxonomy data vs Euclidean

## Crates
- ruvector-hyperbolic-hnsw (native Rust)
- ruvector-hyperbolic-hnsw-wasm (browser)
- Also used in ruvector-attention hyperbolic module

Source: ruvector/crates/ruvector-hyperbolic-hnsw, catalog v3.1.0`
    },
    {
      title: 'ruvector-filter: Advanced Payload Filtering for Vector Search',
      domain: 'vector_search',
      category: 'vector-db',
      content: `ruvector-filter provides structured metadata filtering that runs alongside vector similarity search. Instead of searching ALL vectors, you first narrow by metadata, then rank by similarity.

## Filter Types
- **Equality**: exact match on string/number fields
- **Range**: greater than, less than, between for numeric fields
- **Geo**: geographic bounding box and radius queries
- **Text**: substring and prefix matching
- **Boolean**: true/false field filtering
- **Compound**: AND/OR/NOT logical combinations of any filter type

## Why It Matters
Pure vector search returns the most similar items regardless of constraints. In production, you almost always need: "find similar products BUT only in this category AND under this price AND in stock." Filters make vector search practical.

## Usage Pattern
Filters are applied at the HNSW search level, not post-search. This means filtered search is efficient — it doesn't scan all vectors then discard.

Source: ruvector/crates/ruvector-filter, catalog v3.1.0`
    },
    {
      title: 'ruvector-collections: Multi-Collection Management with Aliases',
      domain: 'vector_search',
      category: 'vector-db',
      content: `ruvector-collections manages multiple independent vector collections within a single RuVector instance, with alias support for zero-downtime collection swaps.

## Features
- Create/delete/list collections independently
- Each collection has its own HNSW index, distance metric, and dimension
- Aliases: point a name to a collection, swap atomically (zero-downtime reindexing)
- Collection statistics: vector count, memory usage, index health
- Persistence: collections survive restarts
- Thread-safe: DashMap-based concurrent access

## Use Cases
- Multi-tenant systems (one collection per tenant)
- A/B testing search configs (alias swap between versions)
- Separate collections for different data types (products, users, documents)
- Blue/green reindexing (build new index, alias-swap when ready)

Source: ruvector/crates/ruvector-collections, catalog v3.1.0`
    },
  ];
}

function graphIntelligenceEntries(doc) {
  return [
    {
      title: 'RuVector Graph Intelligence: Complete Capability Guide (6 Systems)',
      domain: 'graph_intelligence',
      category: 'architecture',
      content: `RuVector provides a full graph intelligence stack — from Neo4j-compatible hypergraph database to Graph Neural Networks to formal verification.

## 1. ruvector-graph (+ WASM + Node.js)
Neo4j-compatible hypergraph database with:
- **Cypher query language** (two parsers: Pest and LALRPOP)
- **230+ SQL functions** via ruvector-postgres
- **Algorithms**: PageRank, Louvain community detection, EigenTrust, BFS, DFS, Dijkstra, Kruskal MST, connected components, shortest path, betweenness centrality
- **Modules**: cypher/, distributed/ (Raft+sharding), executor/, hybrid/, optimization/
- **Feature flags**: \`distributed\` (Raft+cluster), \`federation\` (gRPC), \`fulltext\`, \`geospatial\`, \`temporal\`, \`cypher-pest\`, \`cypher-lalrpop\`

## 2. rvlite (Embedded WASM)
Standalone embedded vector DB for browsers with three query languages:
- SQL (standard relational queries)
- SPARQL (W3C standard for RDF/semantic web)
- Cypher (Neo4j-compatible graph queries)
- IndexedDB persistence for browser storage
- Zero backend required

## 3. ruvector-gnn (+ WASM + Node.js)
Graph Neural Networks built on HNSW topology:
- **GCN** (Graph Convolutional Networks): neighborhood aggregation
- **GAT** (Graph Attention Networks): attention-weighted neighbors
- **GraphSAGE**: inductive learning, sampling-based
- Feature flags: \`mmap\` (large graphs), \`cold-tier\` (hyperbatch), \`napi\`

## 4. ruvector-graph-transformer (+ WASM + Node.js)
8-module proof-gated transformer:
- Physics, biological, manifold, Boltzmann modules
- Proof-gated mutations (changes must pass formal verification)

## 5. ruvector-dag (+ WASM)
DAG structures for query optimization with:
- Neural learning for query planning
- **QuDAG**: quantum-resistant patterns (ML-DSA-65 Dilithium3, ML-KEM-768 Kyber768)
- SONA integration for self-improving query plans
- Modules: dag/, attention/, healing/, mincut/, qudag/, sona/

## 6. ruvector-sparsifier (+ WASM)
Spectral graph sparsification preserving Laplacian eigenvalue properties. Reduces edge count while maintaining graph structure for faster algorithms.

Source: ruvector/crates/ruvector-graph, ruvector/crates/rvlite, ruvector/crates/ruvector-gnn, catalog v3.1.0`
    },
    {
      title: 'QuDAG: Quantum-Resistant DAG Infrastructure for AI Agent Networks',
      domain: 'graph_intelligence',
      category: 'security',
      content: `QuDAG (inside ruvector-dag) implements post-quantum cryptographic primitives for distributed AI agent coordination. It ensures that agent communication and state management remain secure even against quantum computers.

## Cryptographic Primitives
- **ML-DSA-65 (Dilithium3)**: Post-quantum digital signatures for agent message authentication
- **ML-KEM-768 (Kyber768)**: Post-quantum key encapsulation for secure agent-to-agent channels
- **Differential privacy**: Mathematical privacy guarantees for federated learning
- **Zeroize keystore**: Cryptographic keys are securely wiped from memory after use

## Governance
- Governance tokens for DAG participation rights
- Staking mechanism for validator nodes
- Reward distribution for honest participants

## Why It Matters
Traditional cryptography (RSA, ECDSA) will be broken by quantum computers. QuDAG future-proofs agent infrastructure with NIST-approved post-quantum algorithms. This is relevant NOW because "harvest now, decrypt later" attacks target today's communications.

Source: ruvector/crates/ruvector-dag (qudag/ module), catalog v3.1.0`
    },
    {
      title: 'Graph Algorithms in RuVector: PageRank, Louvain, EigenTrust, and More',
      domain: 'graph_intelligence',
      category: 'algorithms',
      content: `RuVector's graph crates implement 10+ classic graph algorithms, available in Rust, WASM, and Node.js.

## Implemented Algorithms

**Ranking & Trust:**
- **PageRank**: Iterative importance scoring (Google's algorithm). Available via ruvector-graph and ruvector-solver (Forward/Backward Push variants).
- **EigenTrust**: Distributed trust computation for peer-to-peer networks. Converges in O(log n) iterations.

**Community Detection:**
- **Louvain**: Fast community detection via modularity optimization. Finds natural groups in code, data, or social networks.
- **Spectral Clustering**: K-cluster grouping using graph Laplacian eigenvectors.

**Traversal:**
- **BFS** (Breadth-First Search): Level-by-level exploration
- **DFS** (Depth-First Search): Deep exploration with backtracking
- **Dijkstra**: Shortest path with non-negative weights

**Structure:**
- **Kruskal's MST**: Minimum spanning tree
- **Connected Components**: Finding disconnected subgraphs
- **Betweenness Centrality**: Finding bridge nodes
- **Shortest Path**: Between any two nodes

## Where They Live
- ruvector-graph: Full graph DB with all algorithms
- ruvector-solver: Specialized PageRank solvers (Forward/Backward Push, Hybrid Random Walk)
- ruvector-mincut: Graph partitioning (Gomory-Hu, Karger, Stoer-Wagner)
- ruvector-gnn: Neural graph algorithms (GCN, GAT, GraphSAGE)

Source: ruvector/crates/ruvector-graph, ruvector/crates/ruvector-solver, catalog v3.1.0`
    },
  ];
}

function attentionMechanismsEntries(doc) {
  return [
    {
      title: 'RuVector Attention: 18+ Variants Across 16 Deep Modules',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `ruvector-attention is one of the most comprehensive attention mechanism libraries in existence — 18+ variants across 16 deep modules, available in Rust, WASM, Node.js, and as a CLI/HTTP server.

## Crates
- ruvector-attention (core, 16 modules)
- ruvector-attention-wasm, ruvector-attention-unified-wasm (browser)
- ruvector-attention-node (Node.js NAPI)
- ruvector-attention-cli (CLI + HTTP server)
- ruvector-attn-mincut (Dinic's max-flow graph gating)
- ruvector-mincut-gated-transformer + wasm (KV cache, SQUAT, kernel fusion)
- ruvector-fpga-transformer + wasm (FPGA hardware, INT4/INT8)

## 16 Deep Modules
1. **attention/**: Core multi-head + FlashAttention-3 (O(n) memory tiled attention)
2. **curvature/**: Mixed geometry E^e × H^h × S^s with tangent space mapping
3. **graph/**: GAT-style adjacency-weighted attention
4. **hyperbolic/**: Poincaré ball with Möbius operations
5. **info_bottleneck/**: Variational Information Bottleneck with KL divergence
6. **info_geometry/**: Fisher metric + natural gradient + K-FAC (3-5x fewer iterations than Adam)
7. **moe/**: Mixture of Experts with memory-aware routing and EMA affinity (ADR-092)
8. **pde_attention/**: Continuous-time PDE attention via heat equation on graph Laplacian
9. **sdk/**: High-level composition API
10. **sheaf/**: Coherence-Gated Transformer (ADR-015) with restriction maps and energy-based exit
11. **sparse/**: Efficient sparse attention patterns
12. **topology/**: 3-mode policy gating (stable/cautious/freeze)
13. **training/**: Training utilities
14. **transport/**: Optimal Transport attention (Sliced Wasserstein, Centroid OT, histogram CDF)
15. **unified_report/**: Cross-variant benchmarking with Kruskal MST
16. **spiking/**: Event-driven spiking graph attention (energy-efficient)

## Selection Guide
| Need | Use |
|------|-----|
| Long sequences | FlashAttention-3 |
| Very long (>100K tokens) | Mamba S5 (O(n) linear) |
| Expert routing | MoE Attention |
| Coherence verification | Sheaf Attention |
| Continuous dynamics | PDE Attention |
| Distribution matching | Transport (Wasserstein) |
| Hierarchy-aware | Hyperbolic |
| Graph-structured data | GAT |
| Energy-efficient | Spiking Graph |
| Hardware acceleration | FPGA Transformer |
| Graph-based gating | attn-mincut (Dinic's) |

Source: ruvector/crates/ruvector-attention, catalog v3.1.0`
    },
    {
      title: 'Sheaf Attention: Algebraic Topology for Coherence-Gated Transformers (ADR-015)',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `Sheaf Attention (ruvector-attention sheaf/ module) applies algebraic topology to transformer attention, enabling coherence verification at the attention level.

## What Is a Sheaf?
A sheaf assigns data to every part of a space and defines consistency rules (restriction maps) between overlapping parts. In attention: each attention head is a "stalk" and restriction maps verify that neighboring heads agree.

## How It Works
1. Each attention head computes its output (stalk)
2. Restriction maps check consistency between neighboring heads
3. Residual energy measures disagreement
4. If energy is too high, the output is gated (reduced or blocked)
5. Energy-based early exit: if all heads agree, skip remaining layers

## Key Properties
- Residual-sparse: only non-zero residuals need processing
- Restriction maps can be learned (via prime-radiant learned_rho/ module)
- Sheaf Laplacian L_F provides a mathematical measure of global coherence
- H^0 (global sections) = consistent information, H^1 (obstructions) = contradictions

## When to Use
- When you need formal coherence guarantees in attention
- Anti-hallucination: contradictions between heads are detected mathematically
- Multi-agent systems: sheaf structure verifies agent consensus

Source: ruvector/crates/ruvector-attention (sheaf/ module), ADR-015, catalog v3.1.0`
    },
    {
      title: 'PDE Attention: Continuous-Time Dynamics via Partial Differential Equations',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `PDE Attention (ruvector-attention pde_attention/ module) replaces discrete attention steps with continuous-time dynamics governed by partial differential equations.

## How It Works
Attention scores evolve according to the heat equation on the graph Laplacian L = D - W:
- D is the degree matrix
- W is the adjacency/attention weight matrix
- Information diffuses across the graph over continuous time
- Time parameter controls how far information spreads

## Why It Matters
- Standard attention is a single-step computation. PDE attention lets information propagate over multiple "time steps" continuously
- Naturally handles varying-length dependencies
- Mathematically principled — connects attention to well-studied physics (diffusion, heat flow)
- Can model temporal dynamics in sequential data

## Related Modules
- graph/ module: GAT-style attention using graph structure
- transport/ module: Optimal transport-based attention
- sheaf/ module: Algebraic topology-based coherence

Source: ruvector/crates/ruvector-attention (pde_attention/ module), catalog v3.1.0`
    },
    {
      title: 'Information Geometry Attention: Fisher Metric and Natural Gradient (3-5x Faster Training)',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `The info_geometry/ module in ruvector-attention implements attention using concepts from information geometry — the study of probability distributions as geometric objects.

## Key Concepts
- **Fisher Information Matrix (FIM)**: Measures how much information data carries about model parameters. It defines a Riemannian metric on the space of probability distributions.
- **Natural Gradient**: Instead of following the steepest direction in parameter space (like SGD/Adam), follows the steepest direction in distribution space. This is 3-5x more efficient because it accounts for the geometry of the problem.
- **K-FAC (Kronecker-Factored Approximate Curvature)**: Practical approximation of the Fisher matrix that makes natural gradient tractable for large models.
- **Conjugate Gradient solver**: Used internally for efficient matrix-vector products.

## Why 3-5x Fewer Iterations
Adam/SGD treat all parameter directions equally. Natural gradient uses the Fisher metric to understand which directions matter more, leading to better updates per step.

## When to Use
- When training convergence is the bottleneck
- When you can afford slightly more compute per step for far fewer total steps
- Research and high-quality models where training efficiency matters

Source: ruvector/crates/ruvector-attention (info_geometry/ module), catalog v3.1.0`
    },
    {
      title: 'Optimal Transport Attention: Wasserstein Distance for Distribution Matching',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `The transport/ module in ruvector-attention implements attention based on optimal transport theory — measuring the cheapest way to transform one distribution into another.

## Algorithms
- **Sliced Wasserstein**: O(n log n) approximation using random 1D projections. Fast and practical.
- **Centroid OT**: Finds the Wasserstein barycenter (average distribution) of multiple inputs.
- **Histogram CDF**: Fast computation using cumulative distribution functions.

## How It Differs from Standard Attention
Standard attention uses softmax over dot products. Transport attention measures how much "work" it takes to move mass from queries to keys, producing a transport plan instead of attention weights.

## When to Use
- Distribution matching: when inputs are distributions, not just vectors
- Set-to-set matching: comparing collections of items
- When you need mathematically principled distribution comparison
- Data with inherent mass/weight semantics

## Related
- ruvector-math optimal_transport/ module: Standalone Wasserstein/Sinkhorn/Gromov-Wasserstein
- ruvector-attention sheaf/ module: Another principled attention alternative

Source: ruvector/crates/ruvector-attention (transport/ module), catalog v3.1.0`
    },
    {
      title: 'MoE Attention: Memory-Aware Expert Routing with EMA Affinity (ADR-092)',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `The moe/ module in ruvector-attention implements Mixture of Experts attention with memory-aware routing, following ADR-092.

## How It Works
1. A router network decides which expert(s) process each token
2. Only a subset of experts activate per token (sparse activation)
3. **EMA affinity tracking**: Exponential Moving Average tracks which experts prefer which inputs, improving routing over time
4. **Memory-aware routing**: Router considers cache residency — prefers experts whose weights are already in fast memory
5. Target latency: <10μs per routing decision

## Why Memory-Aware?
In large MoE models, expert weights may not all fit in cache. Naive routing causes constant cache misses. Memory-aware routing prefers experts already in L2/L3 cache, dramatically reducing latency.

## Key Features
- EMA affinity tracking (learns expert preferences)
- Cache residency bonus (reduces memory thrashing)
- Load balancing auxiliary loss (prevents expert collapse)
- Compatible with SONA learning loops

Source: ruvector/crates/ruvector-attention (moe/ module), ADR-092, catalog v3.1.0`
    },
    {
      title: 'FPGA Transformer: Deterministic Latency Hardware Inference with Coherence Gating',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `ruvector-fpga-transformer (+ WASM) implements transformer inference optimized for FPGA hardware with deterministic latency guarantees.

## Key Features
- **INT4/INT8 quantization**: Reduced precision for FPGA efficiency
- **Zero-allocation hot path**: No dynamic memory allocation during inference
- **Kernel fusion**: Multiple operations combined into single FPGA passes
- **Coherence gating**: Output quality is verified before release
- **Witness logging**: Every inference is logged for audit
- **Deterministic latency**: Guaranteed timing bounds — critical for real-time systems

## When to Use
- Real-time systems requiring guaranteed response times
- Safety-critical applications (aviation, medical, automotive)
- Edge hardware with FPGA capabilities
- When GPU latency variance is unacceptable

## Related Crates
- ruvector-mincut-gated-transformer: KV cache with SQUAT compression, PCA-based cache eviction
- ruvector-attn-mincut: Dinic's max-flow for graph-based attention gating

Source: ruvector/crates/ruvector-fpga-transformer, catalog v3.1.0`
    },
    {
      title: 'MinCut-Gated Transformer: KV Cache Compression with SQUAT and PCA Eviction',
      domain: 'attention_mechanisms',
      category: 'neural',
      content: `ruvector-mincut-gated-transformer (+ WASM) combines min-cut graph partitioning with transformer inference for intelligent KV cache management.

## How It Works
1. KV cache entries are organized as a graph
2. Min-cut partitioning identifies which cache entries can be evicted with minimal information loss
3. **SQUAT compression**: Quantized attention values in the KV cache
4. **PCA-based cache eviction**: Principal Component Analysis identifies the least important cache entries
5. **Kernel fusion**: Combined min-cut + attention in single pass

## Why It Matters
Long-context LLMs need massive KV caches. This crate intelligently compresses and evicts cache entries using graph theory, maintaining quality while reducing memory 6-8x (TurboQuant).

Source: ruvector/crates/ruvector-mincut-gated-transformer, catalog v3.1.0`
    },
  ];
}

function selfLearningEntries(doc) {
  return [
    {
      title: 'SONA Three Learning Loops: Instant, Background, and Deep Consolidation',
      domain: 'self_learning',
      category: 'neural',
      content: `SONA (Self-Optimizing Neural Architecture) operates three concurrent learning loops, each at a different timescale. This is what makes AI systems improve from use.

## Loop A: Instant (<1ms per request)
- **Mechanism**: MicroLoRA rank-1 or rank-2 adaptation
- **Size**: <1MB per adaptation
- **When**: Every request that has a quality signal
- **What it learns**: Immediate corrections — "this response was good/bad, adjust"
- **Analogy**: Reflexes — instant adjustment without thinking

## Loop B: Background (Hourly)
- **Mechanism**: Base LoRA + pattern clustering
- **Latency**: Seconds
- **When**: Accumulates instant learnings, consolidates into larger patterns
- **What it learns**: Recurring patterns — "this type of question keeps coming up"
- **Analogy**: Short-term memory — noticing patterns over a workday

## Loop C: Deep Consolidation (Weekly)
- **Mechanism**: EWC++ (Elastic Weight Consolidation)
- **Latency**: Minutes
- **When**: Merges all accumulated learning into base model
- **What it learns**: Permanent knowledge — "this is how things work in this domain"
- **Benefit**: 45% less catastrophic forgetting vs naive fine-tuning
- **Analogy**: Long-term memory — sleep consolidation of the day's experiences

## SONA Modules
- engine.rs: SonaEngine (begin_trajectory, end_trajectory, apply_micro_lora)
- lora.rs: MicroLoRA and Base LoRA implementations
- ewc.rs: EWC++ consolidation
- reasoning_bank.rs: HNSW-indexed pattern store (150x faster)
- trajectory.rs: Execution path recording with quality metrics
- loops/: instant.rs, background.rs, coordinator.rs
- training/: Templates (code-agent, research, customer-support)
- export/: HuggingFace SafeTensors, JSONL, DPO/RLHF preference pairs

Source: ruvector/crates/sona, catalog v3.1.0`
    },
    {
      title: 'Bio-Inspired Learning Rules: BTSP, EWC, STDP, and E-prop',
      domain: 'self_learning',
      category: 'neural',
      content: `ruvector-nervous-system's plasticity/ module implements four bio-inspired learning rules from neuroscience.

## BTSP (Behavioral Timescale Synaptic Plasticity)
- **Type**: One-shot learning from a single exposure
- **Biological basis**: Hippocampal CA1 neurons can form new associations in one trial
- **Use case**: When you can't afford multiple training passes — learn a new pattern instantly
- **Status**: Experimental

## EWC (Elastic Weight Consolidation)
- **Type**: Continual learning without forgetting
- **Mechanism**: Identifies which parameters are important for old tasks (via Fisher Information Matrix) and constrains them while learning new tasks
- **Benefit**: 45% less catastrophic forgetting
- **Status**: Production (used in SONA Loop C)

## STDP (Spike-Timing-Dependent Plasticity)
- **Type**: Temporal correlation learning
- **Mechanism**: If neuron A fires just before neuron B, strengthen the A→B connection. If A fires just after B, weaken it.
- **Biological basis**: Hebb's rule with precise timing ("neurons that fire together, wire together")
- **Status**: Experimental

## E-prop (Eligibility Propagation)
- **Type**: Online learning in spiking networks
- **Mechanism**: O(1) memory per synapse — no backpropagation needed
- **Biological basis**: Eligibility traces in cortical neurons
- **Use case**: Real-time adaptation in spiking neural networks
- **Status**: Experimental

Source: ruvector/crates/ruvector-nervous-system (plasticity/ module), catalog v3.1.0`
    },
    {
      title: 'Domain Expansion: Cross-Domain Transfer Learning with Meta Thompson Sampling',
      domain: 'self_learning',
      category: 'neural',
      content: `ruvector-domain-expansion (+ WASM) enables AI systems to transfer knowledge between different domains — learning in one area helps performance in others.

## How It Works
1. **Meta Thompson Sampling**: Uses Bayesian exploration (Beta priors) to decide how much knowledge to transfer between domains
2. **Dampened priors**: New domain starts with reduced influence from source domain (prevents negative transfer)
3. **Population-based policy search**: Maintains a population of transfer strategies, evolving the best ones

## Domains
Three built-in domains:
- **Rust synthesis**: Code generation and analysis
- **Planning**: Task decomposition and scheduling
- **Tool orchestration**: MCP tool selection and composition

## Acceptance Criteria
Transfer is only accepted if it improves the target domain WITHOUT regressing the source domain. This prevents catastrophic interference between domains.

## When to Use
- Multi-skill agents that need to learn across different task types
- When learning in a data-rich domain should accelerate a data-poor domain
- Agent bootstrapping: use general knowledge to jumpstart specialized skills

Source: ruvector/crates/ruvector-domain-expansion, catalog v3.1.0`
    },
  ];
}

function coherenceSafetyEntries(doc) {
  return [
    {
      title: 'Prime Radiant Deep Dive: 9 Modules for Universal AI Coherence',
      domain: 'coherence_safety',
      category: 'security',
      content: `Prime Radiant is RuVector's universal coherence engine — the mathematical framework that prevents AI hallucination and ensures consistency.

## 9 Modules

**1. cohomology/** — Sheaf Cohomology
- H^0 (global sections): Information consistent across the entire system
- H^1 (obstructions): Contradictions and inconsistencies
- Sheaf Laplacian L_F: Mathematical operator measuring coherence

**2. governance/** — Immutable Audit Trails
- Blake3 hash chains (witness chains)
- Policy bundles with multi-party approval
- Lineage records tracking provenance

**3. substrate/** — Knowledge Graph
- SheafNode (stalks = local data)
- SheafEdge (restriction maps = consistency rules)
- Residual energy = disagreement measure

**4. tiles/** — 256-Tile WASM Fabric
- CoherenceFabric distributes verification across 256 parallel tiles
- TileAdapter maps data to tiles
- FabricReport aggregates results

**5. learned_rho/** — GNN-Learned Restriction Maps
- Restriction maps are learned from data using GNN
- EWC prevents forgetting previously learned consistency rules
- Replay buffer and learning rate scheduling

**6. neural_gate/** — Bio-Inspired Gating
- Dendritic coincidence detection (multiple evidence streams)
- Hysteresis (prevents flipping on borderline decisions)
- Global workspace (conscious access bottleneck)
- HDC encoding (10,000-bit hypervector representation)
- Kuramoto oscillator synchronization

**7. signal/** — Signal Validation
- Raw signal normalization
- Input validation before coherence processing

**8. mincut/** — Min-Cut Adapter
- Connects to ruvector-mincut for coherence graph partitioning

**9. security/** — Security Primitives
- Cryptographic operations for witness chains

Source: ruvector/crates/prime-radiant, catalog v3.1.0`
    },
    {
      title: 'Cognitum Gate: 256-Tile WASM Coherence Fabric with Crypto-Signed Permits',
      domain: 'coherence_safety',
      category: 'security',
      content: `The Cognitum Gate is a two-tier coherence verification system: 256 parallel WASM tile kernels + a central TileZero arbiter.

## cognitum-gate-kernel (Per-Tile, 64KB each)
Each of the 256 tiles is a self-contained WASM kernel:
- **CompactGraph (~42KB)**: Local knowledge graph for this tile's domain
- **EvidenceAccumulator (~2KB)**: Collects evidence from observations
- **TileState (~1KB)**: Current tile status and metrics
- **WASM exports**: ingest_delta (new data), tick (advance state), get_witness_fragment (proof output)
- **E-value sequential testing**: Anytime-valid statistical testing (no fixed sample sizes)

## cognitum-gate-tilezero (Central Arbiter)
Merges results from all 256 tiles:
- **Supergraph merging**: Combines local tile graphs into global view
- **Three-filter decision**: Structural (graph properties) + Evidence (statistical) + Decision (policy)
- **Crypto-signed permit tokens**: Approved outputs get signed permits
- **Hash-chained witness receipt log**: Every decision is auditable

## Why 256 Tiles?
Coherence verification is embarrassingly parallel — each tile can verify its domain independently. 256 tiles provide fine-grained coverage while fitting in WASM memory constraints (64KB per tile = 16MB total).

Source: ruvector/crates/cognitum-gate-kernel, ruvector/crates/cognitum-gate-tilezero, catalog v3.1.0`
    },
    {
      title: 'ruvector-verified: SAT/SMT Solver and Formal Verification for AI Systems',
      domain: 'coherence_safety',
      category: 'security',
      content: `ruvector-verified (+ WASM) provides formal verification capabilities — mathematical proofs that AI system properties hold.

## Capabilities
- **SAT solver**: Boolean satisfiability — can these constraints all be true simultaneously?
- **SMT solver**: Satisfiability Modulo Theories — SAT extended with arithmetic, arrays, bitvectors
- **Bounded model checking**: Verify properties hold for all states up to a depth bound
- **K-induction proofs**: Prove properties hold for ALL states (unbounded), not just bounded
- **Property-based testing**: Automatic generation of test cases from property specifications

## Performance
Sub-microsecond overhead for property checks during runtime.

## 10 Verified Application Examples
The examples/verified-applications directory demonstrates formal verification for:
1. Weapons filters
2. Legal forensics
3. Financial compliance
4. Medical diagnosis
5. Autonomous vehicles
6. Nuclear safety
7. Aviation control
8. Pharmaceutical
9. Critical infrastructure
10. Election systems

Source: ruvector/crates/ruvector-verified, catalog v3.1.0`
    },
    {
      title: 'Post-Quantum Cryptography in RuVector: SHA3-512 and HQC-128',
      domain: 'coherence_safety',
      category: 'security',
      content: `RuVector implements post-quantum cryptographic algorithms to future-proof data integrity and authentication.

## Algorithms
- **SHA3-512**: Keccak-based hash function, quantum-resistant (Grover's algorithm only provides quadratic speedup against hashing)
- **HQC-128 (Hamming Quasi-Cyclic)**: Post-quantum key encapsulation mechanism based on error-correcting codes
- **Ed25519**: Digital signatures (via rvf-crypto)
- **Blake3**: Fast hash for witness chains (via prime-radiant governance)
- **ML-DSA-65 (Dilithium3)**: Post-quantum signatures (via QuDAG)
- **ML-KEM-768 (Kyber768)**: Post-quantum key encapsulation (via QuDAG)

## Where Used
- ruvector-core: SHA3-512 and HQC-128 for data integrity
- rvf-crypto: Ed25519 signatures for cognitive containers
- prime-radiant: Blake3 witness chains for governance
- ruvector-dag (QuDAG): Full post-quantum suite for agent networks
- cognitum-gate-tilezero: Crypto-signed permit tokens

Source: ruvector/crates/ruvector-core, ruvector/crates/rvf-crypto, catalog v3.1.0`
    },
  ];
}

function nervousSystemEntries(doc) {
  return [
    {
      title: 'RuVector Nervous System: 9 Deep Modules for Bio-Inspired Computing',
      domain: 'nervous_system',
      category: 'neural',
      content: `ruvector-nervous-system (+ WASM) implements a 5-layer bio-inspired neural architecture with 9 deep modules, each inspired by real neuroscience.

## 5 Layers
1. **Sensing** → Spiking neural networks (LIF neurons), DVS event processing
2. **Reflex** → Winner-Take-All competition (<1μs for 1000 neurons)
3. **Memory** → Hopfield networks + Hyperdimensional Computing
4. **Learning** → BTSP, EWC, STDP, E-prop plasticity
5. **Coherence** → Kuramoto oscillators, Global Workspace, Predictive Coding

## 9 Deep Modules

### hopfield/ — Modern Hopfield Networks
Ramsauer 2020 formulation with exponential storage capacity 2^(d/2). Uses softmax-weighted retrieval with tunable β parameter. Vastly more powerful than classic Hopfield (which stores ~0.14*N patterns).

### hdc/ — Hyperdimensional Computing
10,000-bit binary hypervectors stored as 157 u64 words. Operations: bind (XOR), bundle (majority), permute (rotate), invert (NOT). SIMD-optimized. <100ns Hamming distance computation. HdcMemory provides associative memory storage.

### dendrite/ — Dendritic Computation
Models individual dendrite branches with NMDA receptor nonlinearity. Compartmental models with plateau potentials (100-500ms). Ca²⁺ dynamics. DendriticTree with multi-branch soma integration. <10μs for 100 synapses.

### compete/ — Winner-Take-All
- WTA: Single winner via lateral inhibition (<1μs for 1000 neurons)
- K-WTA: Sparse distributed coding, selects top-k (<10μs for k=50)
- Use: Fast routing decisions, attention head selection, HNSW layer selection

### eventbus/ — DVS Event Bus
Event-driven stream processing inspired by Dynamic Vision Sensors. Lock-free ring buffers. Region sharding for parallel processing. Backpressure controller. 10,000+ events/ms throughput.

### routing/ — Oscillatory Routing
- Kuramoto oscillators: 40Hz gamma-band synchronization for binding features
- Global Workspace (Baars 1988): 4-7 item conscious access bottleneck

### plasticity/ — Learning Rules
BTSP (one-shot), EWC (continual, 45% less forgetting), E-prop (online spiking, O(1) memory/synapse)

### separate/ — Signal Separation
### integration/ — Cross-Module Integration

Source: ruvector/crates/ruvector-nervous-system, catalog v3.1.0`
    },
    {
      title: 'Hopfield Networks (Modern): Exponential Storage with Softmax Retrieval',
      domain: 'nervous_system',
      category: 'neural',
      content: `The hopfield/ module implements Modern Hopfield Networks (Ramsauer et al., 2020) — a dramatic improvement over classic Hopfield networks.

## Classic vs Modern
- **Classic Hopfield (1982)**: Stores ~0.14*N patterns in N neurons. Binary. Limited capacity.
- **Modern Hopfield (2020)**: Stores **2^(d/2)** patterns. Continuous values. Exponential capacity increase.

## How It Works
1. Patterns are stored as rows in a matrix
2. Retrieval uses softmax-weighted energy minimization
3. The β (inverse temperature) parameter controls retrieval sharpness:
   - Low β: blurry retrieval (average of similar patterns)
   - High β: sharp retrieval (nearest pattern exactly)
4. Convergence is guaranteed (energy function is bounded below)

## Connection to Transformers
Modern Hopfield networks are mathematically equivalent to a single attention head. The key-value memory of transformers IS a Hopfield network. This means transformers are doing associative memory retrieval at every layer.

## When to Use
- Associative memory (content-addressable storage)
- Pattern completion from partial inputs
- One-shot learning of new patterns
- Denoising corrupted inputs

Source: ruvector/crates/ruvector-nervous-system (hopfield/ module), catalog v3.1.0`
    },
    {
      title: 'Hyperdimensional Computing (HDC): 10,000-Bit Binary Vectors for Ultra-Fast Pattern Matching',
      domain: 'nervous_system',
      category: 'neural',
      content: `The hdc/ module implements Hyperdimensional Computing — a brain-inspired computing paradigm using very high-dimensional binary vectors.

## Core Concept
Instead of floating-point vectors (like in neural networks), HDC uses 10,000-bit binary hypervectors. Operations are simple bitwise: XOR (binding), majority vote (bundling), rotation (permutation).

## Implementation
- 10,000-bit vectors stored as 157 u64 words
- SIMD-optimized operations (AVX2/NEON)
- Hamming distance: <100 nanoseconds
- HdcMemory: associative memory store

## Operations
- **Bind (XOR)**: Creates associations ("dog" XOR "black" = "black dog")
- **Bundle (majority)**: Creates sets ("dog" + "cat" + "bird" = "animals")
- **Permute (rotate)**: Creates sequences (rotate by position = ordered set)
- **Invert (NOT)**: Negation

## Why 10,000 Dimensions?
Random binary vectors in high dimensions are quasi-orthogonal with high probability. This means you can store thousands of independent concepts without interference.

## When to Use
- Ultra-fast pattern matching (<100ns)
- Edge/embedded devices (simple hardware operations)
- One-shot learning (single example per class)
- Compositional representations (combining concepts)

Source: ruvector/crates/ruvector-nervous-system (hdc/ module), catalog v3.1.0`
    },
    {
      title: 'Dendritic Computation: NMDA Coincidence Detection and Plateau Potentials',
      domain: 'nervous_system',
      category: 'neural',
      content: `The dendrite/ module models individual dendrite branches of neurons — the tree-like input structures that perform local computation before signals reach the cell body (soma).

## Why Dendrites Matter
Traditional neural networks model neurons as simple sum-then-threshold units. Real neurons have elaborate dendritic trees that perform local computation, pattern detection, and coincidence detection BEFORE the soma.

## Implementation
- **NMDA receptors**: Voltage-gated channels that detect when multiple inputs arrive simultaneously (coincidence detection)
- **Compartmental models**: Each dendrite branch is an independent computational unit
- **Plateau potentials**: Long-lasting (100-500ms) depolarizations triggered by strong coincident input
- **Ca²⁺ dynamics**: Calcium signaling that controls local plasticity
- **DendriticTree**: Multi-branch tree with soma integration
- **Performance**: <10μs for 100 synapses

## When to Use
- Noise filtering: only pass signals with coincident evidence
- Feature binding: detect combinations of inputs (not just individual inputs)
- Local credit assignment: each dendrite learns independently
- Integration with spiking networks

Source: ruvector/crates/ruvector-nervous-system (dendrite/ module), catalog v3.1.0`
    },
    {
      title: 'Predictive Coding and Circadian Control: 90-99% Bandwidth Reduction',
      domain: 'nervous_system',
      category: 'neural',
      content: `Two coherence-layer mechanisms from the nervous system that dramatically reduce compute costs.

## Predictive Coding
The brain doesn't process raw sensory data — it only processes prediction ERRORS. What you expected vs what you got.

**Implementation**: Each layer maintains a prediction of what the next layer will produce. Only the difference (error signal) is transmitted upward. This achieves 90-99% bandwidth reduction because most sensory input is predictable.

**Use case**: When processing streams of similar data (video frames, repeated queries, monitoring data). Instead of processing every input fully, only process what changed.

## Circadian Control
The brain's activity levels follow circadian rhythms — not everything runs at full power all the time.

**Implementation**: Time-of-day-aware compute scheduling. During low-activity periods, reduce model precision, increase batch sizes, consolidate learning. During peak activity, maximize responsiveness.

**Savings**: 5-50x compute reduction by not running everything at maximum precision all the time.

**Use case**: Agent systems that run 24/7. Nightly periods for learning consolidation (like SONA Loop C). Daytime periods for responsive serving.

Source: ruvector/crates/ruvector-nervous-system (routing/ module), catalog v3.1.0`
    },
  ];
}

function mathematicsEntries(doc) {
  return [
    {
      title: 'RuVector Mathematics: 10 Modules of Advanced Math for AI',
      domain: 'mathematics',
      category: 'algorithms',
      content: `ruvector-math (+ WASM) provides 10 modules covering advanced mathematical algorithms used throughout the RuVector ecosystem.

## Modules

### 1. optimal_transport/ — Distribution Comparison
- **Wasserstein distance**: Earth Mover's Distance — minimum cost to transform one distribution into another
- **Sinkhorn algorithm**: Log-stabilized entropic regularization for fast approximate Wasserstein
- **Gromov-Wasserstein**: Cross-space optimal transport (compare distributions in different metric spaces)
- **Sliced Wasserstein**: O(n log n) approximation via random 1D projections

### 2. tropical/ — Max-Plus Semiring
- Tropical algebra replaces (×,+) with (+,max) or (+,min)
- Neural network linear region counting (how many linear pieces does a ReLU network have?)
- Tropical eigenvalues for combinatorial optimization
- Floyd-Warshall shortest paths via tropical matrix multiplication

### 3. homology/ — Topological Data Analysis (TDA)
- Persistent homology: finds topological features (holes, voids) that persist across scales
- Betti numbers: count connected components (β0), loops (β1), voids (β2)
- Persistence diagrams: visualize feature lifespans
- Bottleneck and Wasserstein distances between diagrams

### 4. information_geometry/ — Probability Manifold Optimization
- Fisher Information Matrix: metric tensor on probability distributions
- K-FAC: Kronecker-Factored Approximate Curvature
- Natural gradient: 3-5x fewer iterations than Adam/SGD
- Used in ruvector-attention info_geometry/ module

### 5. product_manifold/ — Mixed-Curvature Geometry
- H^h × E^e × S^s: product of hyperbolic, Euclidean, and spherical spaces
- 20x memory reduction on taxonomy/hierarchy data
- Used in ruvector-attention curvature/ module

### 6. tensor_networks/ — High-Dimensional Compression
- Tensor Train (TT), Tucker decomposition, CP decomposition (CANDECOMP/PARAFAC)
- Network contraction for efficient computation

### 7. spherical/ — Spherical Operations
- Stereographic projection (map sphere to plane)
- Spherical harmonics (frequency analysis on the sphere)

### 8. spectral/ — Eigenvalue Methods
- Chebyshev polynomials for spectral approximation
- Lanczos eigenvalue computation (sparse symmetric matrices)
- Power iteration (dominant eigenvalue)

### 9-10. utils/ — Shared utilities

Source: ruvector/crates/ruvector-math, catalog v3.1.0`
    },
    {
      title: 'Topological Data Analysis (TDA): Finding Shape in Data with Persistent Homology',
      domain: 'mathematics',
      category: 'algorithms',
      content: `The homology/ module in ruvector-math implements Topological Data Analysis — a mathematical framework for understanding the "shape" of data.

## Core Idea
Data has shape. A ring of points has a hole. A cluster of points is connected. TDA mathematically detects these features across all scales, from fine to coarse.

## Persistent Homology
1. Start with points in space
2. Gradually increase a distance threshold (growing balls around points)
3. Track topological features as they appear (born) and disappear (die)
4. Features that persist across many scales are "real"; short-lived ones are noise

## Betti Numbers
- β0: Number of connected components (clusters)
- β1: Number of loops/holes
- β2: Number of voids (enclosed empty spaces)

## Outputs
- **Persistence diagrams**: 2D plot of (birth, death) for each feature
- **Bottleneck distance**: Compare two persistence diagrams (structural similarity)
- **Wasserstein distance**: Alternative diagram comparison metric

## When to Use
- Anomaly detection: abnormal data has different topology
- Drug discovery: molecular shape analysis
- Sensor network coverage: detecting coverage holes
- Time series: detecting periodic patterns
- Data quality: finding structural issues

Source: ruvector/crates/ruvector-math (homology/ module), catalog v3.1.0`
    },
  ];
}

function solversEntries(doc) {
  return [
    {
      title: 'RuVector Sublinear Solvers: 8 Algorithms with Auto-Router Decision Logic',
      domain: 'solvers',
      category: 'algorithms',
      content: `ruvector-solver (+ WASM + Node.js) provides 8 specialized algorithms for sparse linear systems and graph problems, plus an auto-router that selects the best algorithm automatically.

## The 8 Algorithms

**1. Neumann Series** — O(k × nnz)
When: Diag-dominant matrix with spectral radius < 1. Like a converging geometric series: x = Σ(I-A)^k * b.

**2. Conjugate Gradient** — O(√κ × log(1/ε))
When: Symmetric positive-definite (SPD), well-conditioned. The gold standard for SPD systems. κ is condition number.

**3. Forward Push** — O(1/(α×ε))
When: Single-source PageRank. Pushes probability mass forward through the graph. α is damping factor.

**4. Backward Push** — O(1/(α×ε))
When: Reverse PageRank, backward reachability. Same as forward but in reverse direction.

**5. Hybrid Random Walk** — Sublinear in graph size
When: Large-scale pairwise PageRank. Combines random walks with algebraic methods. Doesn't even need to read the whole graph.

**6. BMSSP Multigrid** — O(nnz × log n)
When: Laplacian/SPD, multi-scale problems. Uses Gauss-Seidel as smoother with hierarchical coarsening.

**7. TRUE Solver** — O(log n)
When: Batch systems via Johnson-Lindenstrauss projection + spectral sparsification. Research-stage but theoretically optimal.

**8. Auto-Router** — Varies
When: You don't know which solver to use. Analyzes matrix properties (symmetry, diagonal dominance, spectral radius, condition number, sparsity) and routes to the best algorithm. 9 routing rules with fallback chain: primary → CG → Dense.

## Additional Named Algorithms
Jacobi iteration, Gauss-Seidel, PCG32 PRNG, Johnson-Lindenstrauss projection, Welford's online variance, power iteration, dense Gaussian elimination fallback.

Source: ruvector/crates/ruvector-solver, catalog v3.1.0`
    },
  ];
}

function mincutEntries(doc) {
  return [
    {
      title: 'Dynamic Min-Cut Deep Dive: 22 Modules in 45,911 Lines of Rust',
      domain: 'mincut',
      category: 'algorithms',
      content: `ruvector-mincut is the LARGEST crate in RuVector at 45,911 lines of Rust. It implements subpolynomial O(n^0.12) amortized dynamic minimum cut — meaning it handles graph changes (insertions/deletions) without recomputing from scratch.

## Properties
- **Subpolynomial**: O(n^0.12) amortized update time (faster than any polynomial)
- **Deterministic**: Same input always gives same output
- **Exact**: No approximation — finds the true minimum cut
- **Dynamic**: Handles edge insertions and deletions
- **256-core parallel**: Scales to 256 cores via the 'agentic' feature flag

## 22 Source Modules
algorithm/, canonical/ (3 sub: source_anchored, tree_packing, dynamic), certificate/, cluster/, compact/, connectivity/, core/, euler/, expander/, fragment/, fragmentation/, graph/, instance/, integration/, jtree/, linkcut/, localkcut/, monitoring/, optimization/, parallel/, pool/, snn/, sparsify/, subpolynomial/, tree/, wasm/, witness/, wrapper/

## Named Algorithms Inside
- **Gomory-Hu trees**: All-pairs min-cut via n-1 max-flow computations
- **Expander decomposition**: Partition graph into well-connected pieces
- **j-tree hierarchical decomposition**: Key to subpolynomial updates
- **Link-Cut trees**: O(log n) dynamic path queries (Sleator-Tarjan)
- **Karger's randomized min-cut**: Random edge contraction
- **Stoer-Wagner**: Deterministic min-cut (simpler but slower)
- **Euler tour trees**: Dynamic tree maintenance
- **Dinic's max-flow**: Via ruvector-attn-mincut

## Feature Flags
\`exact\`, \`approximate\` (1+ε), \`jtree\`, \`tiered\` (two-tier), \`canonical\` (3-tier), \`agentic\` (256-core), \`all-cut-queries\` (sparsest cut, multiway, multicut), \`integration\` (GraphDB), \`monitoring\` (real-time callbacks)

## Canonical 3-Tier Architecture
1. Source-anchored: handles small cuts efficiently
2. Tree packing: maintains spanning tree packing
3. Dynamic: handles arbitrary updates

Source: ruvector/crates/ruvector-mincut, catalog v3.1.0`
    },
  ];
}

function llmRuntimeEntries(doc) {
  return [
    {
      title: 'RuVLLM: Complete Local LLM Runtime with 21 Modules',
      domain: 'llm_runtime',
      category: 'wasm-local-llm',
      content: `ruvllm (+ CLI + WASM) is a complete local LLM inference engine with self-learning capabilities, 21 source modules, and support for Apple Metal, CUDA, and WebGPU.

## 21 Modules

### Core Inference
- **gguf/**: GGUF model loading with memory-mapped I/O (mmap)
- **context/**: KV cache management, paged attention, prefix sharing
- **kernels/**: Compute kernels for inference
- **models/**: Model architecture definitions
- **serving/**: Continuous batching with prefill/decode scheduling, preemption, request queuing
- **backends/**: Provider abstraction layer

### Quantization
- **bitnet/**: BitNet b1.58 ternary {-1, 0, +1} quantization — multiplication-free inference (only additions and subtractions)
- **qat/**: Quantization-Aware Training with STE variants, calibration, knowledge distillation, reasoning loss, LoRA-QAT
- **quantize/**: Weight quantization utilities

### Learning & Intelligence
- **sona/**: SONA learning integration (models improve with use)
- **lora/**: MicroLoRA per-request adaptation (<1MB, rank-2)
- **reasoning_bank/**: Learn from Claude/LLM trajectories, HNSW-indexed
- **reflection/**: ReflectiveAgent, IoE (If-or-Else) confidence scoring, multi-perspective critique, error pattern learning
- **intelligence/**: Intelligence metrics and evaluation
- **quality/**: Output quality assessment

### Hardware Acceleration
- **metal/**: Apple Silicon (M4 Pro) kernels — Flash Attention, GEMM (simdgroup_half8x8), RMSNorm, LayerNorm, RoPE
- **moe/**: Memory-aware expert routing (ADR-092), EMA affinity, <10μs target

### Other
- **hub/**: Model download management
- **optimization/**: Performance tuning
- **training/**: Training utilities
- **claude_flow/**: Ruflo integration

## Feature Flags
\`candle\`, \`metal\`, \`metal-compute\`, \`cuda\`, \`inference-metal\`, \`inference-metal-native\`, \`inference-cuda\`, \`mmap\`/\`gguf-mmap\`, \`coreml\`, \`hybrid-ane\` (Apple Neural Engine), \`ruvector-full\`, \`quantize\`

## Key Technologies
- **BitNet b1.58**: No multiplications needed — 10x energy reduction
- **TurboQuant**: 6-8x KV cache compression
- **Prefix Caching**: 10x latency reduction for repeated prompts
- **Continuous Batching**: Production serving with preemption
- **WebGPU**: Browser-based inference via ruvllm-wasm

Source: ruvector/crates/ruvllm, catalog v3.1.0`
    },
    {
      title: 'BitNet b1.58: Multiplication-Free LLM Inference with Ternary Weights',
      domain: 'llm_runtime',
      category: 'wasm-local-llm',
      content: `BitNet b1.58 (ruvllm bitnet/ module) implements ternary quantization where every weight is {-1, 0, +1}. This eliminates ALL matrix multiplications from inference.

## How It Works
- Weights are constrained to three values: -1, 0, or +1
- Matrix multiplication becomes: additions and subtractions only
- No floating-point multiply units needed
- 10x energy reduction vs FP16

## Why "b1.58"
- 1.58 bits per weight: log2(3) ≈ 1.585
- Compare: FP16 = 16 bits, INT8 = 8 bits, INT4 = 4 bits
- Roughly 10x smaller than FP16 models

## Quality
Modern BitNet research (Microsoft) shows that BitNet b1.58 matches FP16 quality at sufficient scale. The key insight: the model learns to use the ternary constraint effectively during training.

## Implementation
RuVLLM's bitnet/ module handles:
- Weight quantization to ternary values
- Custom inference kernels that use only add/subtract
- Integration with SONA for continued learning
- Compatible with GGUF model loading

Source: ruvector/crates/ruvllm (bitnet/ module), catalog v3.1.0`
    },
  ];
}

function quantumEntries(doc) {
  return [
    {
      title: 'ruQu Quantum Computing: Full Simulation Engine with 8 Exotic Hybrids',
      domain: 'quantum',
      category: 'algorithms',
      content: `ruQu is RuVector's quantum computing stack — from gate-level simulation to exotic quantum-classical hybrid algorithms.

## Crates
- **ruQu**: Classical nervous system for quantum machines (256-tile WASM fabric, syndrome processing)
- **ruqu-core**: Full state-vector quantum simulation, gates, measurement, noise channels, SIMD. Up to 25 qubits in browser.
- **ruqu-algorithms**: VQE, Grover's, QAOA, Surface Code
- **ruqu-exotic**: 8 novel quantum-classical hybrid algorithms
- **ruqu-wasm**: Complete browser runtime

## Standard Algorithms (ruqu-algorithms)
- **VQE (Variational Quantum Eigensolver)**: Molecular chemistry — find ground state energy of H2
- **Grover's Search**: Quadratic speedup for unstructured search (√N vs N)
- **QAOA (Quantum Approximate Optimization Algorithm)**: MaxCut optimization
- **Surface Code**: Distance-3 quantum error correction with stabilizer measurement and syndrome decoding

## 8 Exotic Hybrids (ruqu-exotic)
1. **Quantum Decay**: Embeddings decohere via T1/T2 noise instead of TTL deletion — graceful degradation
2. **Interference Search**: Concepts interfere during retrieval, resolving polysemy via constructive/destructive interference
3. **Quantum Collapse**: Nondeterministic top-k with Grover-like amplitude bias toward high-similarity results
4. **Reasoning QEC**: Surface-code error correction applied to reasoning traces — detect and correct reasoning errors
5. **Reversible Memory**: Time-reversible state for counterfactual debugging ("what if this observation was missing?")
6. **Swarm Interference**: Agents interfere instead of voting for consensus — quantum-inspired collective decision
7. **Syndrome Diagnosis**: QEC syndrome extraction for system health monitoring
8. **Reality Check**: Browser-native quantum verification circuits

Source: ruvector/crates/ruqu-core, ruvector/crates/ruqu-algorithms, ruvector/crates/ruqu-exotic, catalog v3.1.0`
    },
  ];
}

function distributedEntries(doc) {
  return [
    {
      title: 'RuVector Distributed Systems: 11 Crates for Multi-Node AI Infrastructure',
      domain: 'distributed',
      category: 'architecture',
      content: `RuVector provides a complete distributed systems stack — from Raft consensus to CRDT replication to credit economies.

## Core Consensus
- **ruvector-raft**: Full Raft consensus implementation — leader election, log replication, snapshots, AppendEntries/RequestVote/InstallSnapshot RPCs

## Clustering
- **ruvector-cluster**: Consistent hashing with 150 virtual nodes, DAG consensus, gossip discovery, static discovery, shard routing

## Replication
- **ruvector-replication**: Multi-node with vector clocks, CRDTs, sync/async/semi-sync modes, change data capture, automatic failover, split-brain prevention

## Delta System (5 Crates)
Behavioral change tracking at the vector level:
- **ruvector-delta-core**: Delta streams, windowed aggregation, sparse/dense encoding, compression
- **ruvector-delta-consensus**: CRDT merging with hybrid logical clocks, vector clocks, causal ordering
- **ruvector-delta-graph**: Incremental graph updates with delta-aware traversal
- **ruvector-delta-index**: Delta-aware HNSW with automatic repair and recall monitoring
- **ruvector-delta-wasm**: Browser bindings for all delta operations

## Economy
- **ruvector-economy-wasm**: CRDT credit economy — G-Counter/PN-Counter, stake/slash, 10x early-adopter multiplier, reputation scoring (accuracy+uptime+stake), Merkle verification

## Infrastructure
- **ruvector-snapshot**: Point-in-time backup/restore with compression and checksums
- **ruvector-metrics**: Prometheus-compatible observability — search latency histograms, insert counters, memory gauges, health checks, readiness probes

Source: ruvector/crates/ruvector-raft through ruvector-metrics, catalog v3.1.0`
    },
  ];
}

function storageEntries(doc) {
  return [
    {
      title: 'RVF Cognitive Containers: 19 Sub-Crates for Self-Contained AI Packages',
      domain: 'storage',
      category: 'vector-db',
      content: `RVF (RuVector Format) is a binary container format for packaging complete AI systems — vectors, models, indexes, crypto, and runtime. 19 sub-crates provide everything from wire format to Linux microkernel hosting.

## 19 Sub-Crates

### Core Format
- **rvf-types**: Segment headers, enums, type definitions
- **rvf-wire**: Zero-copy serialization (no parsing overhead)
- **rvf-manifest**: Two-level segment tracking (directory of what's inside)
- **rvf-crypto**: SHA-3 hashing + Ed25519 digital signatures

### Runtime
- **rvf-runtime**: RvfStore API, compaction, streaming read/write
- **rvf-wasm**: Browser runtime
- **rvf-node**: Node.js bindings

### Indexing & Quantization
- **rvf-index**: Progressive HNSW with three layers (A: exact, B: quantized, C: binary)
- **rvf-quant**: Temperature-tiered quantization (f32 for hot → f16 → u8 → binary for cold)

### Integration Adapters
- **rvf-adapters**: AgentDB, SONA, OSpipe, RVLite, claude-flow (Ruflo), agentic-flow

### Import/Export
- **rvf-import**: JSON, CSV, NumPy format ingestion
- **rvf-server**: TCP/HTTP streaming server

### Advanced
- **rvf-kernel**: Linux microkernel builder (embed RVF in a bootable kernel)
- **rvf-launch**: QEMU microVM launcher (run RVF in isolated VMs)
- **rvf-ebpf**: Kernel-level vector distance computation via eBPF
- **rvf-federation**: PII stripping, differential privacy, federated averaging

### Tooling
- **rvf-cli**: Command-line tools
- **rvf-solver-wasm**: Solver algorithms in WASM

## Temperature-Tiered Storage
Data ages through precision tiers:
- Hot (recently accessed): f32 (full precision)
- Warm (hours old): f16 (half precision)
- Cool (days old): u8 (8-bit quantized)
- Cold (weeks old): binary (1-bit, 32x compression)

Source: ruvector/crates/rvf-*, catalog v3.1.0`
    },
    {
      title: 'ruvector-postgres Deep Dive: 230+ SQL Functions Across 24 Modules',
      domain: 'storage',
      category: 'vector-db',
      content: `ruvector-postgres is a PostgreSQL extension that replaces pgvector with 230+ SQL functions spanning vectors, graphs, attention, solvers, learning, and more.

## 24 Modules
attention/, dag/, distance/, domain_expansion/, embeddings/, gated_transformer/, gnn/, graph/ (cypher+sparql), healing/, hybrid/, hyperbolic/, index/, integrity/, learning/, math/, quantization/, routing/, solver/, sona/, sparse/, tda/ (topological data analysis), tenancy/ (multi-tenant), types/, workers/

## What Makes It Different from pgvector
pgvector does one thing: approximate nearest-neighbor search with IVFFlat/HNSW indexes.

ruvector-postgres does that PLUS:
- Graph queries (Cypher + SPARQL)
- Attention mechanisms accessible from SQL
- SONA self-learning within the database
- Solver algorithms (PageRank, etc.)
- TDA (topological data analysis)
- Multi-tenant isolation
- Auto-healing indexes
- GNN inference from SQL
- Domain expansion and transfer learning

## Drop-In Replacement
ruvector-postgres is designed as a pgvector drop-in: same vector type syntax, same distance operators. You can migrate gradually.

Source: ruvector/crates/ruvector-postgres, catalog v3.1.0`
    },
  ];
}

function ospipeEntries(doc) {
  return [
    {
      title: 'OSpipe: ScreenPipe + RuVector Integration for Semantic AI Memory (9 Components)',
      domain: 'ospipe',
      category: 'architecture',
      content: `OSpipe (examples/OSpipe, 31 source files) integrates ScreenPipe screen capture with RuVector's vector intelligence to create a searchable semantic memory of everything you do on your computer.

## 9 Key Components

### Safety & Deduplication
1. **SafetyGate** (safety/gate.rs): PII redaction before storage — strips emails, phone numbers, SSNs, etc.
2. **FrameDeduplicator** (pipeline/dedup.rs): Cosine similarity window with threshold 0.95 — drops near-duplicate frames

### Storage
3. **HnswVectorStore** (storage/vector_store.rs): HNSW config: M=16, ef_construction=200, ef_search=40

### Search (5 modes)
4. **QueryRouter** (search/router.rs): Routes to optimal search mode — semantic, keyword, graph, temporal, or hybrid
5. **AttentionReranker** (search/reranker.rs): Scaled dot-product attention reranking, 60% attention + 40% cosine blend
6. **MmrReranker** (search/mmr.rs): Maximal Marginal Relevance for diversity, λ=0.7
7. **QuantumSearch** (quantum/mod.rs): QAOA MaxCut diversity selection (activates above threshold=8 results)

### Learning
8. **SearchLearner** (learning/mod.rs): EWC++ continual learning from search patterns (λ=100.0)
9. **EmbeddingQuantizer** (learning/mod.rs): Age-based quantization tiers: f32 (<1h) → f16 (1-24h) → PQ8 (1-7d) → binary (>7d)

## API
- POST /v2/search — Vector search with automatic routing
- POST /v2/route — Explicit query routing mode selection
- GET /v2/stats — Collection statistics
- GET /v2/health — Health check

## npm Packages
@ruvector/ospipe (native), @ruvector/ospipe-wasm (browser)

Source: ruvector/examples/OSpipe, catalog v3.1.0`
    },
  ];
}

function roboticsEntries(doc) {
  return [
    {
      title: 'RuVector Robotics: 7 Crates for Cognitive Robotics and ROS3',
      domain: 'robotics',
      category: 'architecture',
      content: `RuVector's robotics stack spans from embedded (no_std) hardware to cognitive architecture to ROS3/Zenoh integration.

## 7 Crates

### Core Framework
1. **agentic-robotics-core**: Core types, traits, and abstractions for robotics agents
2. **agentic-robotics-rt**: Real-time runtime with dual-runtime architecture (guarantees timing constraints)
3. **agentic-robotics-embedded**: Embedded systems, no_std compatible — RTIC and Embassy frameworks for bare-metal microcontrollers

### Integration
4. **agentic-robotics-mcp**: MCP protocol integration for remote control and monitoring
5. **agentic-robotics-node**: Node.js bindings for JavaScript robotics applications
6. **agentic-robotics-benchmarks**: Performance benchmarking suite

### Cognitive Platform
7. **ruvector-robotics**: Full cognitive robotics platform with:
   - **bridge/**: ROS3 + Zenoh types (modern robot middleware)
   - **perception/**: Sensor data pipeline (camera, LiDAR, IMU fusion)
   - **cognitive/**: Cognitive architecture (planning, reasoning, learning)
   - **mcp/**: MCP tools for external tool access

## Deployment Targets
- Full Linux robots (agentic-robotics-rt)
- Bare-metal microcontrollers (agentic-robotics-embedded, no_std)
- Browser simulation (via WASM)
- Remote monitoring (via MCP)

Source: ruvector/crates/agentic-robotics-*, ruvector/crates/ruvector-robotics, catalog v3.1.0`
    },
  ];
}

function financialEntries(doc) {
  return [
    {
      title: 'Neural Trader Architecture: Coherence-Gated Trading with RVF Audit Trails',
      domain: 'financial',
      category: 'architecture',
      content: `The Neural Trader is RuVector's financial trading system — 4 crates implementing coherence-gated trading signals with full auditability.

## 4 Crates

### 1. neural-trader-core
Canonical market event types with nanosecond-precision timestamps:
- MarketEvent: event_id, ts_exchange_ns, ts_ingest_ns, venue_id, symbol_id, event_type, side, price_fp (fixed-point), qty_fp, order_id_hash, participant_id_hash
- Graph schema for market structure
- Ingest traits for data feeds

### 2. neural-trader-coherence
Every trading decision must pass through a coherence gate:
- **MinCut coherence gate**: Uses graph min-cut to assess system health
- **CUSUM drift detection**: Cumulative Sum statistics to detect distributional drift in market data
- **Proof-gated mutations**: Changes to strategy/models require proof of coherence
- **CoherenceDecision**: allow_retrieve, allow_write, allow_learn, allow_act, mincut_value, drift_score, cusum_score

### 3. neural-trader-replay
Witnessable replay for auditing and backtesting:
- **ReplaySegment**: events, embeddings, labels, coherence stats
- Segments are sealed and signed (tamper-evident)
- RVF serialization for long-term audit storage
- Audit receipt logging

### 4. neural-trader-wasm
Browser bindings for all of the above

## Architecture (ADR-084)
Market events → graph schema → embeddings → coherence gate → actions
Every decision is witnessed and auditable. No action without coherence approval.

Source: ruvector/crates/neural-trader-*, ADR-084, catalog v3.1.0`
    },
  ];
}

function exoticEntries(doc) {
  return [
    {
      title: 'RuVector Exotic Technologies: 10 Specialized Crates for Novel Computing',
      domain: 'exotic',
      category: 'algorithms',
      content: `RuVector includes research-stage and specialized crates pushing boundaries in novel computing paradigms.

## 1. ruvector-exotic-wasm
Three exotic AI paradigms:
- **Neural Autonomous Organizations (NAO)**: Decentralized governance for AI collectives. Stake-weighted quadratic voting. Oscillatory synchronization for consensus.
- **Morphogenetic Networks**: Developmental biology-inspired coordination. Growth patterns for distributed systems.
- **Time Crystals**: Periodic state without energy input. Stability patterns for distributed computation.

## 2. thermorust
Thermodynamic neural computation — energy-driven state transitions:
- Ising model, SoftSpin, Langevin dynamics
- Metropolis-Hastings sampling, Boltzmann distribution
- Poisson spike noise channels
- Motifs: ring, fully-connected, Hopfield, soft-spin
- Landauer dissipation (minimum energy per bit erasure)

## 3. ruvector-crv
Coordinate Remote Viewing protocol mapped to RuVector subsystems:
Stage I (ideograms) → Poincaré embeddings, Stage II (sensory) → multi-head attention, Stage III (dimensional) → GNN topology, Stage IV (emotional) → SNN temporal, Stage V (interrogation) → differentiable search, Stage VI (3D model) → MinCut partitioning

## 4. ruvector-dither
Pre-quantization dithering for neural network inference:
- **GoldenRatioDither**: Best 1-D equidistribution (φ = (1+√5)/2)
- **PiDither**: Table of π digits, period=256
- Deterministic, reproducible across WASM/x86/ARM. No RNG needed.
- Supports 3/5/7-bit precision lanes

## 5. ruvector-sparse-inference + wasm
PowerInfer-style activation locality for 2.5-10x inference speedup:
- P·Q low-rank neuron activation prediction
- Hot/cold neuron caching (frequently activated neurons stay in fast memory)
- π integration (calibration, drift detection, angular embeddings, chaos seeding)
- Precision lanes: 3/5/7-bit with graduation policies

## 6. ruvector-temporal-tensor + wasm
Time-series tensor compression with TurboQuant. Tiered quantization over time.

## 7. ruvector-cognitive-container
Sealed WASM container with tamper-evident witness chains. Epoch budgeting. Graph ingest, min-cut, spectral analysis, evidence accumulation.

## 8. ruvector-profiler
Profiling suite: MemoryTracker, PowerTracker, LatencyRecord with CSV emitters.

## Specialized Examples
- examples/dna (rvDNA): 20-SNP biomarker scoring, 23andMe pharmacogenomics
- examples/scipix: Scientific OCR, LaTeX/MathML extraction, ONNX GPU
- examples/dragnes: DrAgnes dermatology intelligence
- examples/vibecast-7sense: Bioacoustic intelligence
- examples/ultra-low-latency-sim: Quadrillion sims/sec with SIMD
- examples/exo-ai-2025: Advanced cognitive substrate

Source: ruvector/crates/thermorust, ruvector/crates/ruvector-crv, ruvector/crates/ruvector-exotic-wasm, catalog v3.1.0`
    },
  ];
}

function deploymentEntries() {
  return [
    {
      title: 'RuVector WASM Deployment Tiers: From 11.8KB Micro to 2.5MB Full AI',
      domain: 'deployment',
      category: 'wasm-local-llm',
      content: `RuVector provides 25+ WASM crates organized into 4 size tiers, plus Node.js NAPI bindings and edge deployment targets.

## WASM Size Tiers

### Micro (11.8KB) — micro-hnsw-wasm
Smallest possible vector search: HNSW + spiking neural networks in 11.8KB. For IoT, ASIC, ultra-constrained environments.

### Small (247KB) — ruvector-wasm
Core vector database: HNSW, search, insert, delete, persistence. Everything needed for a basic vector app.

### Medium (812KB)
Core + graph + attention + solver. Most common deployment: full-featured vector+graph database.

### AI (2.5MB)
Everything: vector, graph, attention (18 variants), GNN, learning, nervous system, min-cut, solvers, math. Full cognitive computing in the browser.

## 25+ WASM Crates
micro-hnsw-wasm, ruvector-wasm, ruvector-attention-wasm, ruvector-attention-unified-wasm, ruvector-graph-wasm, ruvector-mincut-wasm, ruvector-solver-wasm, ruvector-gnn-wasm, ruvector-learning-wasm, ruvector-economy-wasm, ruvector-exotic-wasm, ruqu-wasm, ruvector-cnn-wasm, ruvector-dag-wasm, ruvector-delta-wasm, ruvector-domain-expansion-wasm, ruvector-fpga-transformer-wasm, ruvector-hyperbolic-hnsw-wasm, ruvector-math-wasm, ruvector-mincut-gated-transformer-wasm, ruvector-nervous-system-wasm, ruvector-sparse-inference-wasm, ruvector-sparsifier-wasm, ruvector-temporal-tensor-wasm, ruvector-verified-wasm, ruvector-router-wasm, ruvector-tiny-dancer-wasm, rvf-wasm, rvf-solver-wasm, ruvllm-wasm, rvagent-wasm, neural-trader-wasm

## Node.js NAPI Bindings (11 packages)
ruvector-node, ruvector-attention-node, ruvector-gnn-node, ruvector-graph-node, ruvector-graph-transformer-node, ruvector-mincut-node, ruvector-solver-node, ruvector-tiny-dancer-node, ruvector-router-ffi, ruvector-mincut-brain-node, rvf-node

## Edge Targets
Vercel, Cloudflare, Deno — all via WASM crates

## Embedded
agentic-robotics-embedded: no_std, RTIC+Embassy for bare-metal microcontrollers

## FPGA
ruvector-fpga-transformer: Deterministic latency hardware inference

## PostgreSQL
ruvector-postgres: Native database extension

Source: catalog.json deployment_targets, catalog v3.1.0`
    },
  ];
}

function agentEntries() {
  return [
    {
      title: 'rvAgent Framework Deep Dive: 9 Sub-Crates for Rust-Native AI Agents',
      domain: 'agents',
      category: 'agents',
      content: `rvAgent is RuVector's Rust-native agent framework — 9 sub-crates providing everything from graph state machines to MCP integration to browser execution.

## 9 Sub-Crates

### 1. rvagent-core
Agent graph state machine with:
- Copy-on-write state (O(1) clone for branching)
- Bump arena allocator (fast temporary allocations)
- AGI containers (RVF B1 format)
- Resource budgets (CPU, memory, time limits)
- Lock-free metrics collection
- String pooling (reduce memory for repeated strings)

### 2. rvagent-middleware (19 types)
SONA learning, HNSW retrieval, MCP bridge, filesystem, retry with backoff, tool sanitizer, unicode security (prevents homoglyph attacks), witness logging, prompt caching, summarization, todolist management, HITL (human-in-the-loop), skills framework, RVF manifest reader, subagent spawning

### 3. rvagent-subagents
CRDT merge with vector clocks for parallel agent results. Orchestration of child agents. Result validation per ADR-103 C8.

### 4. rvagent-backends
Filesystem, shell, composite, state store, sandbox execution environments

### 5. rvagent-mcp
MCP (Model Context Protocol) tools, resources, transport — connect agents to external services

### 6. rvagent-tools
Built-in tools: ls, read, write, edit, glob, grep, execute, todos, task management

### 7. rvagent-acp
Agent Communication Protocol server — authenticated, rate-limited, TLS-encrypted agent-to-agent communication

### 8. rvagent-cli
Terminal coding agent with TUI (text user interface), session management, interactive prompts

### 9. rvagent-wasm
Browser and Node.js agent execution — run agents client-side

## Related Crates
- **ruvector-tiny-dancer-core** + node + wasm: FastGRNN neural routing (picks optimal model per query)
- **ruvector-router-core** + cli + ffi + wasm: Neural routing inference engine
- **mcp-brain** + **mcp-brain-server**: Shared brain via Firestore + GCS, cross-session transfer learning

Source: ruvector/crates/rvagent-*, catalog v3.1.0`
    },
  ];
}

function examplesEntry() {
  return [
    {
      title: 'RuVector 44 Example Applications: Complete Usage Pattern Reference',
      domain: 'examples',
      category: 'teaching',
      content: `RuVector ships with 44 example applications, each demonstrating real-world usage patterns.

## By Category

### Vector Search & WASM
- **wasm**: Basic browser vector search
- **wasm-react**: React integration
- **wasm-vanilla**: Vanilla JS integration
- **pwa-loader**: Progressive Web App loader
- **onnx-embeddings**: Local ONNX embedding pipeline
- **onnx-embeddings-wasm**: Browser ONNX with SIMD

### Graph & Knowledge
- **graph**: Graph database usage
- **delta-behavior**: Behavioral vector change tracking
- **prime-radiant**: Sheaf cohomology, category theory, HoTT, quantum topology
- **train-discoveries**: Cross-domain ETL with sublinear solver

### AI & Cognition
- **meta-cognition-spiking-neural-network**: Meta-cognitive SNN
- **spiking-network**: ASIC-optimized neuromorphic computing
- **exo-ai-2025**: Advanced cognitive substrate
- **refrag-pipeline**: 30x RAG latency reduction

### Agents & Infrastructure
- **OSpipe**: ScreenPipe + RuVector semantic memory (31 files)
- **agentic-jujutsu**: Quantum-resistant version control for agents
- **apify**: Web scraping integration
- **neural-trader**: Coherence-gated trading system
- **nodejs**: Node.js integration examples

### RVF & Containers
- **rvf**: RVF format usage
- **rvf-desktop**: Causal Atlas native desktop app
- **rvf-kernel-optimized**: Linux kernel embedding with formal proofs

### Domain Applications
- **dna (rvDNA)**: 20-SNP biomarker scoring, 23andMe pharmacogenomics
- **scipix**: Scientific OCR, LaTeX/MathML extraction
- **dragnes**: DrAgnes dermatology intelligence (11 research docs)
- **vibecast-7sense**: Bioacoustic intelligence
- **robotics**: Cognitive robotics demo

### Edge & Deployment
- **edge**: Edge deployment
- **edge-full**: Full edge stack
- **edge-net**: Distributed compute network
- **google-cloud**: GCP deployment
- **app-clip**: App Clip integration

### Performance & Verification
- **ultra-low-latency-sim**: Quadrillion simulations/sec with SIMD
- **subpolynomial-time**: Dynamic min-cut demo
- **verified-applications**: 10 formal verification demos
- **benchmarks**: Comprehensive benchmark suite
- **data**: Data loading utilities

### Min-Cut & Exotic
- **mincut**: Temporal attractors, strange loops, causal discovery
- **vwm-viewer**: Visual working memory viewer

Source: ruvector/examples/*, catalog v3.1.0`
    },
  ];
}

function namedAlgorithmsEntry() {
  return [
    {
      title: 'RuVector Named Algorithm Index: 100+ Algorithms Implemented in Rust',
      domain: 'algorithms_index',
      category: 'algorithms',
      content: `RuVector implements 100+ named algorithms from computer science, mathematics, physics, and neuroscience. All are available in Rust with most also in WASM.

## Search & Indexing
HNSW, DiskANN/Vamana, ColBERT, Matryoshka embeddings, Neural Hashing, BFS, DFS, Dijkstra

## Linear Algebra & Optimization
Adam, SGD, Conjugate Gradient, Gauss-Seidel, Jacobi iteration, Power iteration, SVD, PCA, QR decomposition, Lanczos eigenvalue, Johnson-Lindenstrauss projection, Neumann Series, TRUE Solver

## Graph Algorithms
PageRank (Forward/Backward Push, Hybrid Random Walk), Louvain community detection, EigenTrust, Kruskal's MST, Gomory-Hu trees, Karger's min-cut, Stoer-Wagner, Dinic's max-flow, Euler tour trees, Link-Cut trees, Floyd-Warshall (tropical), Betweenness centrality, Connected components

## Neural Networks
FlashAttention-3, Multi-Head Attention, GAT, GCN, GraphSAGE, Mamba S5, RWKV, ReLU, GELU, SiLU, Softmax, RMSNorm, LayerNorm, RoPE (Rotary Position Embedding), LoRA/MicroLoRA

## Learning & Plasticity
EWC/EWC++, BTSP, STDP, E-prop, Thompson Sampling, Monte Carlo, Bayesian inference, MoE routing, Knowledge distillation

## Bio-Inspired
LIF neurons (spiking), Hopfield networks (Modern), HDC (10,000-bit hypervectors), Winner-Take-All, K-WTA, Kuramoto oscillators, NMDA coincidence detection, Predictive coding

## Mathematics
Wasserstein/Sinkhorn (optimal transport), Fisher metric, Tropical algebra (max-plus), Persistent homology (TDA), Tensor networks (TT/Tucker/CP), Chebyshev polynomials, Spherical harmonics, Stereographic projection, Welford's online variance, Golden-ratio dithering

## Cryptography
SHA-3/SHA-512, Blake3, Ed25519, ChaCha20, ML-DSA-65 (Dilithium), ML-KEM-768 (Kyber), HQC-128

## Quantum
VQE, QAOA, Grover's search, Surface Code (QEC), Ising model, Metropolis-Hastings, Langevin dynamics, Gibbs sampling, Boltzmann distribution

## Quantization
BitNet b1.58, Product Quantization, Int8, TurboQuant, PCG32 PRNG

Source: SKILL.md Named Algorithms section, catalog v3.1.0`
    },
  ];
}

function researchLibraryEntry() {
  return [
    {
      title: 'RuVector Research Library: 25 Directories, 213 Documents',
      domain: 'research',
      category: 'architecture',
      content: `RuVector includes an extensive research library with 213 documents across 25 directories, covering foundational research, implementation analysis, and integration strategies.

## Research Directories (with document counts)
- **DrAgnes** (11): Dermatology AI research
- **FalkorDB** (1): Graph database integration analysis
- **agentic-robotics** (5): SOTA integration with RuVector
- **cnn** (4): CNN feature extraction research
- **cognitive-frontier** (3): Includes Delta Behavior paradigm
- **dspy** (4): DSPy.ts integration for prompt optimization
- **federated-rvf** (2): Federated learning with RVF containers
- **gnn-v2** (46): GNN research including consciousness/self-awareness
- **knowledge-export** (1): Knowledge pipeline research
- **latent-space** (34): Latent space exploration and manipulation
- **mincut** (3): LocalKCut algorithm documentation
- **models** (1): Craftsman Ultra 30b model analysis
- **pglite** (3): PGLite integration for embedded PostgreSQL
- **pi-brain** (1): Collective intelligence research
- **quantization-edge** (9): Edge quantization strategies
- **quantum-crypto** (3): Blockchain forensics beyond SOTA
- **rv2** (8): Cognitum thesis (coherence engine theory)
- **rvagent-gemini-grounding** (3): Grounding with Gemini models
- **rvf** (19): RVF format design and rationale
- **sota-gap-implementation** (1): State-of-the-art gap analysis
- **sparql** (5): SPARQL query language research
- **spectral-sparsification** (5): Graph sparsification theory
- **sublinear-time-solver** (34): Solver algorithm analysis, AGI optimization
- **wasm-integration-2026** (6): WASM integration roadmap

## 135 ADRs (Architecture Decision Records)
RuVector maintains 135 ADRs documenting every major architectural decision, from ADR-015 (Sheaf Attention) to ADR-092 (MoE Routing) to ADR-103 (Subagent Validation).

Source: ruvector/docs/research/*, ruvector/docs/adr/*, catalog v3.1.0`
    },
  ];
}

function monorepoOverviewEntry() {
  return [
    {
      title: 'RuVector Monorepo: 1.58M Lines, 114 Crates, Complete Technology Map',
      domain: 'overview',
      category: 'architecture',
      content: `RuVector is a Rust monorepo containing 1,586,481 lines of code across 114 crates, 3,691 source files, 56 npm packages, 44 examples, and 135 ADRs.

## Scale
- 1,586,481 lines of Rust
- 3,691 source files
- 114 crates (Rust packages)
- 56 npm packages
- 44 example applications
- 135 Architecture Decision Records
- 32 documentation directories
- 213 research documents
- 25 research directories

## 17 Capability Areas
1. **Vector Search**: HNSW, DiskANN, ColBERT, Matryoshka, Neural Hashing, Micro HNSW (ruvector-core)
2. **Graph Intelligence**: Hypergraph DB, GNN, Graph Transformer, DAG, Sparsifier (ruvector-graph, ruvector-gnn)
3. **Attention Mechanisms**: 18+ variants across 16 modules (ruvector-attention)
4. **Self-Learning**: SONA 3-loop, EWC++, MicroLoRA, ReasoningBank, Domain Expansion (sona)
5. **Coherence & Safety**: Sheaf Laplacian, 256-tile fabric, formal verification (prime-radiant, cognitum-gate)
6. **Nervous System**: 5-layer bio-inspired (Hopfield, HDC, dendrites, spiking, WTA) (ruvector-nervous-system)
7. **Mathematics**: Optimal transport, tropical geometry, TDA, tensor networks (ruvector-math)
8. **Solvers**: 8 algorithms + auto-router (ruvector-solver)
9. **Min-Cut**: 45,911 LOC, subpolynomial O(n^0.12) dynamic (ruvector-mincut)
10. **LLM Runtime**: BitNet, Metal, CUDA, WebGPU, SONA learning (ruvllm)
11. **Quantum**: VQE, QAOA, Grover, Surface Code, 8 exotic hybrids (ruqu)
12. **Distributed**: Raft, CRDT, delta streams, credit economy (ruvector-raft, ruvector-cluster)
13. **Storage**: PostgreSQL (230+ functions), RVF (19 sub-crates), rvlite (ruvector-postgres, rvf)
14. **Agents**: 9-crate framework, MCP, ACP, browser execution (rvAgent)
15. **Robotics**: 7 crates, ROS3, Zenoh, embedded (agentic-robotics)
16. **Financial**: Coherence-gated trading, CUSUM drift, audit trails (neural-trader)
17. **Exotic**: NAO, thermodynamic computing, time crystals, CRV, sparse inference

## Deployment Targets
Native (Linux/macOS/Windows), WASM (11.8KB to 2.5MB), Node.js (NAPI-RS), PostgreSQL, Edge (Vercel/Cloudflare/Deno), Embedded (no_std), FPGA

Source: catalog.json, catalog v3.1.0, commit 3bbc8170`
    },
  ];
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔄 RuVector Catalog → KB Ingestion');
  console.log(`   Catalog: ${CATALOG_DIR}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (SINGLE_DOC) console.log(`   Single doc: ${SINGLE_DOC}`);

  // Verify catalog exists
  if (!fs.existsSync(path.join(CATALOG_DIR, 'catalog.json'))) {
    console.error('❌ Catalog not found at', CATALOG_DIR);
    process.exit(1);
  }

  // Initialize services
  if (!DRY_RUN) {
    await initOnnx();
    initMaster();
  }

  // Collect all entries
  const allEntries = [
    ...vectorSearchEntries(),
    ...graphIntelligenceEntries(),
    ...attentionMechanismsEntries(),
    ...selfLearningEntries(),
    ...coherenceSafetyEntries(),
    ...nervousSystemEntries(),
    ...mathematicsEntries(),
    ...solversEntries(),
    ...mincutEntries(),
    ...llmRuntimeEntries(),
    ...quantumEntries(),
    ...distributedEntries(),
    ...storageEntries(),
    ...ospipeEntries(),
    ...roboticsEntries(),
    ...financialEntries(),
    ...exoticEntries(),
    ...deploymentEntries(),
    ...agentEntries(),
    ...examplesEntry(),
    ...namedAlgorithmsEntry(),
    ...researchLibraryEntry(),
    ...monorepoOverviewEntry(),
  ];

  // Filter to single doc if specified
  const entries = SINGLE_DOC
    ? allEntries.filter(e => e.domain === SINGLE_DOC)
    : allEntries;

  console.log(`\n📊 Total entries to process: ${entries.length}`);

  // Process entries
  for (const entry of entries) {
    if (entry.content.length < 200) {
      console.log(`  ⚠️ Skipping "${entry.title}" — content too short (${entry.content.length} chars)`);
      stats.skipped++;
      continue;
    }
    await upsertEntry(entry);
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Created: ${stats.created}`);
  console.log(`🔄 Updated: ${stats.updated}`);
  console.log(`⚠️  Skipped: ${stats.skipped}`);
  console.log(`❌ Errors:  ${stats.errors}`);
  console.log(`📊 Total:   ${stats.created + stats.updated + stats.skipped + stats.errors}`);
  console.log('═══════════════════════════════════════');

  if (!DRY_RUN) {
    saveMaster();
    console.log(`\n📚 KB master now has ${master.entryCount} total entries`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
