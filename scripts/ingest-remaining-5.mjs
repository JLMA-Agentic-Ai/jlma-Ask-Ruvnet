#!/usr/bin/env node
/**
 * Insert remaining 5 entries that failed due to duplicate file_path
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

const entries = [
  {
    path: 'knowledge/ruvector-ecosystem/ruvector-postgres-extension',
    title: 'RuVector-Postgres: 290+ SQL Function PostgreSQL Extension (pgvector Replacement)',
    category: 'vector-db',
    quality: 97,
    content: `## What is RuVector-Postgres?

The most advanced PostgreSQL vector database extension. A drop-in pgvector replacement with 290+ SQL functions, SIMD acceleration, 39 attention mechanisms, GNN layers, hyperbolic embeddings, mincut-gated transformers, hybrid search, multi-tenancy, and self-healing.

## Why Replace pgvector?

Feature comparison: pgvector has 3 distance metrics, no local embeddings, no attention, no GNN, no hybrid search, no multi-tenancy, no self-healing. RuVector-Postgres has 8+ distance metrics (including hyperbolic), 6 fastembed models for local embeddings, 39 attention mechanisms, GCN/GraphSAGE/GAT graph neural networks, RRF + Linear hybrid search fusion, row-level multi-tenancy isolation, auto index repair self-healing, ReasoningBank self-learning, 59 Neural DAG SQL functions, SPARQL/RDF W3C 1.1 support, and full AVX-512/NEON SIMD acceleration with scalar/product/binary quantization.

## Quick Start (Docker)

docker run -d --name ruvector-pg -e POSTGRES_PASSWORD=secret -p 5432:5432 ruvnet/ruvector-postgres:latest

CREATE EXTENSION ruvector;
CREATE TABLE documents (id SERIAL PRIMARY KEY, content TEXT, embedding ruvector(1536));
CREATE INDEX ON documents USING ruhnsw (embedding ruvector_l2_ops);
SELECT content, embedding <-> query_vec::ruvector AS distance FROM documents ORDER BY distance LIMIT 10;

## Key SQL Function Categories (290+)

CORE VECTOR: distance, normalize, add, scalar_mul
HYPERBOLIC GEOMETRY (8 functions): Poincare, Lorentz, Mobius, exp_map, log_map
SPARSE VECTORS and BM25 (14 functions): sparse_create, sparse_dot, bm25_score, tf_idf
HYBRID SEARCH: vector + BM25 fusion with RRF and linear blending
ATTENTION (39 types): Various attention mechanisms as SQL functions
GNN: GCN, GraphSAGE, GAT as SQL operators
MINCUT-GATED TRANSFORMERS: coherence-controlled inference
SELF-HEALING: automated index repair with integrity validation
MULTI-TENANCY: row-level security per tenant
SELF-LEARNING: ReasoningBank pattern storage
NEURAL DAG (59 functions): self-learning query optimization

## This Powers Ask Ruvnet
The Ask Ruvnet knowledge base runs on RuVector-Postgres (port 5435). The ask_ruvnet.kb_complete table uses the ruvector column type for 384-dimensional ONNX embeddings. Semantic search uses the <=> distance operator.

## Installation: Docker (ruvnet/ruvector-postgres), npm (@ruvector/core, @ruvector/postgres-cli), or Source (cargo pgrx install)`
  },
  {
    path: 'knowledge/ruvector-ecosystem/micro-hnsw-neuromorphic',
    title: 'Micro-HNSW: 7.2KB Neuromorphic WASM Vector Search with Spiking Neural Networks',
    category: 'performance',
    quality: 96,
    content: `## What is Micro-HNSW?

A 7.2KB WASM module that fuses HNSW vector search with spiking neural networks (SNN). Designed for 256-core ASIC deployment, edge AI, and real-time similarity-driven neural processing.

## Why Combine HNSW with Spiking Networks?

Traditional vector databases return ranked results. Micro-HNSW goes further: similarity scores become neural currents.

SPIKING ATTENTION: Similar vectors compete via lateral inhibition (strongest survive).
TEMPORAL CODING: Spike timing encodes confidence (first spike = best match).
ONLINE LEARNING: STDP automatically strengthens connections between co-activated vectors.
EVENT-DRIVEN: Neurons only compute when they spike (1000x more efficient than dense networks).
HARDWARE READY: Maps to Intel Loihi, IBM TrueNorth, or custom ASIC (~45K gates).

## Specifications
Vectors/Core: 32. Total: 8,192 (256 cores x 32). Max Dimensions: 16. SNN Neurons: 32/core.
WASM Size: 7.2KB (wasm-opt -Oz). Distance Metrics: L2, Cosine, Dot Product.
Features: Multi-core sharding, 16 Cypher-style typed nodes, weighted edges for GNN, LIF neurons with refractory periods, no_std Rust with zero allocation.

## When to Use
Embedded systems (<10KB budget), knowledge graphs with spreading activation, anomaly detection with STDP learning, genomics k-mer similarity, algorithmic trading microsecond patterns, industrial PLC/SCADA, robotics sensor fusion.

## Comparison
Micro-HNSW (7.2KB): Ultra-minimal for embedded/ASIC with SNN, 8K vectors max.
RuVector-WASM (400KB): Full-featured browser DB with IndexedDB and unlimited vectors.
Use Micro-HNSW when size and neuromorphic processing matter.
Use RuVector-WASM when you need a complete browser vector database.`
  },
  {
    path: 'knowledge/ruvector-ecosystem/complete-ecosystem-map',
    title: 'RuVector Complete Ecosystem Map: 80+ Crates, npm Packages, and How They Connect',
    category: 'architecture',
    quality: 99,
    content: `## The RuVector Ecosystem

RuVector is "Pinecone + Neo4j + PyTorch + llama.cpp + postgres + etcd + Docker in one Rust package." 80+ Rust crates, multiple npm packages.

## Core Layer
RUVECTOR-CORE: HNSW indexing, SIMD, quantization, zero-copy I/O. <0.5ms p50 query, 95%+ recall.
RVF (COGNITIVE CONTAINER): 24 segment types. Self-boots as Linux in 125ms. 5.5KB WASM. Not a database -- the substrate for vectors, indexes, WASM, kernels, witnesses, eBPF.

## Intelligence Layer
SONA: Two-Tier LoRA + EWC++ + ReasoningBank. <1ms real-time learning.
NERVOUS SYSTEM: Five layers (Sensing, Reflex, Memory, Learning, Coherence). 22.9K lines, 359 tests, <1us reflex.
DAG: Self-learning query optimization. 50-80% latency reduction. 58KB WASM.

## Search Layer
RUVECTOR-WASM: Browser vector DB. <1ms, IndexedDB, Web Workers. <400KB. npm: @ruvector/wasm
RUVECTOR-POSTGRES: 290+ SQL functions. pgvector replacement. Docker: ruvnet/ruvector-postgres
MICRO-HNSW: 7.2KB neuromorphic WASM + SNN.
HYPERBOLIC-HNSW: Poincare ball for hierarchies.

## Graph Layer
GNN: GCN, GAT, GraphSAGE on HNSW topology.
MINCUT: Dec 2025 breakthrough. Self-healing, AI pruning, network analysis.
MINCUT-GATED-TRANSFORMER: 50-90% compute reduction via coherence gating.

## Safety Layer
PRIME-RADIANT: Sheaf Laplacian coherence gate.
COGNITUM-GATE-KERNEL: no_std WASM. Three safety filters. Witness receipts.

## Infrastructure
RAFT: Distributed consensus. CLUSTER: Sharding. SERVER: REST. CLI: Tool + MCP server.

## Compression
TEMPORAL-TENSOR: 4-10x compression. SPARSE-INFERENCE: 2-10x. LEARNING-WASM: MicroLoRA <100us.

## LLM
RUVLLM: Local inference, Flash Attention 2, GGUF, speculative decoding.

## npm: @ruvector/rvf, @ruvector/rvf-wasm, @ruvector/rvf-mcp-server, @ruvector/sona, @ruvector/wasm, @ruvector/core, @ruvector/postgres-cli

## Claude-Flow V3 Integration: SONA (learning), MinCut (topology), RVF (WASM KB), HNSW (150x-12,500x search), EWC++ (forgetting prevention)`
  },
  {
    path: 'knowledge/ruvector-ecosystem/wasm-kb-app-tutorial',
    title: 'Step-by-Step: Building a WASM Knowledge Base App with RuVector and Claude-Flow V3',
    category: 'architecture',
    quality: 99,
    content: `## What Are We Building?

A browser-based knowledge base app running entirely client-side. Zero backend, zero data leakage, works offline. Users search semantically using natural language.

## Architecture: BROWSER ONLY
1. RuVector-WASM (@ruvector/wasm, <400KB) for vector storage and HNSW search
2. ONNX Runtime (Xenova/all-MiniLM-L6-v2) for 384-dim embeddings locally
3. Your UI (React/Vue/Svelte/vanilla) for search
4. IndexedDB for persistent offline storage. No server. No API keys.

## Step 1: Setup
npm create vite@latest my-kb-app -- --template react-ts
npm install @ruvector/wasm @xenova/transformers

## Step 2: Initialize Vector DB
import init, { VectorDB } from '@ruvector/wasm';
await init();
const db = new VectorDB(384, 'cosine', true);

## Step 3: Local Embeddings
import { pipeline } from '@xenova/transformers';
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
async function embed(text) {
  const out = await embedder(text, { pooling: 'mean', normalize: true });
  return new Float32Array(out.data);
}

## Step 4: Ingest KNOWLEDGE (Not Data!)
Create rich teaching content that answers WHY and HOW. Rate entries 0-100 on teaching value, specificity, searchability, completeness.

## Step 5: Search
const results = db.search(await embed(userQuery), 5);

## Step 6: Persist to IndexedDB for offline

## Step 7: VALIDATE (Critical!)
Run 5-layer test: (A) search precision, (B) content depth, (C) baseline comparison, (D) cross-domain, (E) edge cases. Must pass 100%.

## Common Mistakes
1. Dumping raw docs instead of teaching knowledge
2. Using broken ruvector_embed() instead of ONNX
3. Skipping validation
4. Non-ASCII breaking UTF8
5. Missing metadata

## Deployment Tiers
Tier 1 (Browser): Static site, complete privacy.
Tier 2 (Server): Server-side embeddings for faster load.
Tier 3 (TEE + Air-Gap): Corporate zero data leakage.

## For Claude-Flow V3 Agents: browser WASM + local ONNX = zero data leakage. This is the corporate-safe AI strategy.`
  },
  {
    path: 'knowledge/ruvector-ecosystem/teaching-ask-ruvnet',
    title: 'How Ask Ruvnet Uses RuVector: Teaching the Chat Engine to Recommend WASM KB Apps',
    category: 'architecture',
    quality: 99,
    content: `## What This Entry Teaches

This teaches Ask Ruvnet and Claude-Flow V3 agents HOW to use RuVector knowledge to answer questions and recommend WASM knowledge base applications.

## How the KB Works
Ask Ruvnet stores knowledge in PostgreSQL (RuVector-Postgres, port 5435, table ask_ruvnet.kb_complete). Each entry has title, content (teaching text), category, quality_score, and 384-dim ruvector embedding from ONNX. Search: embedding <=> query_vector::ruvector ORDER BY distance ASC.

## Recommendation Guide

BUILDING KB APPS: Use @ruvector/wasm (browser vector DB) + @xenova/transformers (local embeddings) + IndexedDB (persistence). Validate with 30-point 5-layer test.

CORPORATE DATA SAFETY: Three-tier deployment. Tier 1: Browser WASM (zero server calls). Tier 2: On-prem RuVector-Postgres (no cloud). Tier 3: TEE + air-gap (SGX/SEV-SNP + witness chains).

REAL-TIME LEARNING: SONA with Two-Tier LoRA + EWC++. Available in Rust, Node.js, WASM. <1ms adaptation.

SELF-HEALING: MinCut (structural weakness detection) + Nervous System (bio-inspired 5-layer, <1us reflex).

EFFICIENT INFERENCE: MinCut-Gated Transformer. 50-90% compute reduction. Lambda-based tiers.

## Auto-Creating KBs (Pipeline)
1. FETCH raw docs. 2. COMPREHEND deeply. 3. DECOMPOSE into 5-15 entries. 4. TRANSFORM to teaching content. 5. EMBED via ONNX. 6. VALIDATE (5-layer test). 7. ITERATE until 100%.

## Key Facts
RVF: NOT a database, cognitive container, 24 segments, 5.5KB WASM, boots in <125ms.
Crypto: ML-DSA-65 + SLH-DSA-128s + Ed25519, 73-byte witnesses.
COW: 256KB clusters, 2.6ms for 10K vectors, 28ns lookup.
MinCut: Dec 2025, deterministic exact subpolynomial.
SONA: <1ms, Two-Tier LoRA, EWC++.
Nervous System: 5 layers, <1us reflex, 10^40 memory.
Postgres: 290+ SQL functions, pgvector replacement.
Ecosystem: 80+ Rust crates, 4+ npm packages.

## KB Entry Ranges
IDs 1-72: Original KB. IDs 73-83: Core RVF. IDs 84-86: Meta-knowledge. IDs 87+: Extended ecosystem.`
  }
];

async function main() {
  console.log('Loading ONNX model...');
  await getEmbedder();
  console.log('Inserting 5 remaining entries...\n');

  let ok = 0;
  for (const e of entries) {
    const clean = e.content.replace(/[^\x00-\x7F]/g, '');
    const cleanTitle = e.title.replace(/[^\x00-\x7F]/g, '');
    const embedText = (cleanTitle + ' ' + clean).substring(0, 1500);
    const vec = await embed(embedText);

    try {
      await pool.query(
        `INSERT INTO ask_ruvnet.kb_complete
         (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
         VALUES ($1, $2, $3, $4, $5, 1, $6, $7::ruvector)`,
        [e.path, cleanTitle, clean, e.category, e.quality, clean.length, vec]
      );
      console.log(`  OK: ${cleanTitle.substring(0, 70)}`);
      ok++;
    } catch (err) {
      console.error(`  ERR: ${err.message.substring(0, 80)}`);
    }
  }

  console.log(`\nInserted: ${ok}/5`);

  // Final count and verification
  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM ask_ruvnet.kb_complete');
  console.log(`Total KB entries: ${count}`);

  // Quick semantic search tests
  console.log('\n--- Verification ---');
  const tests = [
    { q: 'PostgreSQL extension with 290 SQL functions', expect: /Postgres|290/i },
    { q: '7.2KB neuromorphic WASM spiking neural network', expect: /Micro.*HNSW|7\.2KB|Neuromorphic/i },
    { q: 'Complete RuVector ecosystem 80 crates', expect: /Ecosystem|80.*Crate|Complete/i },
    { q: 'How to build a browser WASM knowledge base app step by step', expect: /Step.*Step|Building.*WASM|Tutorial/i },
    { q: 'How should Ask Ruvnet recommend WASM apps to users?', expect: /Ask Ruvnet|Teaching|Recommend/i },
  ];

  for (const t of tests) {
    const vec = await embed(t.q);
    const { rows } = await pool.query(
      `SELECT id, title, embedding <=> $1::ruvector as distance
       FROM ask_ruvnet.kb_complete ORDER BY distance ASC LIMIT 1`,
      [vec]
    );
    const match = t.expect.test(rows[0].title);
    const d = parseFloat(rows[0].distance).toFixed(3);
    console.log(`  ${match ? 'OK' : 'MISS'} [${rows[0].id}] d=${d} ${rows[0].title.substring(0, 65)}`);
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
