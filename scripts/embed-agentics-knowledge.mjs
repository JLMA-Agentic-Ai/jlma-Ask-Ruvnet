#!/usr/bin/env node
/**
 * Embed Agentics Knowledge via ONNX (930 embeds/sec)
 * 1. Insert RVF/SONA/RvLite entries (trigger disabled)
 * 2. ONNX-embed all agentics-knowledge entries missing embeddings
 * 3. Re-enable trigger
 */
import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres', max: 4
});

function esc(s) { return (s || '').replace(/'/g, "''"); }

async function run() {
  console.log('=== Agentics Knowledge Embed Pipeline ===\n');

  // Step 0: Ensure trigger is disabled
  await pool.query(`ALTER TABLE openclaw_memory.operational_knowledge DISABLE TRIGGER trg_auto_embed_opknowledge`);
  console.log('[1/5] Trigger disabled');

  // Step 1: Insert RVF, SONA, RvLite knowledge entries
  const newEntries = [
    {
      category: 'agentics-architecture',
      title: 'RVF: RuVector Format - Cognitive Container',
      content: `RVF (RuVector Format) is a universal binary substrate that merges database, model, graph engine, kernel, and attestation into a single deployable file. It is NOT a database format — it is an executable knowledge unit.

A .rvf file can store vector embeddings, carry LoRA adapter deltas, embed GNN graph state, include a bootable Linux microkernel, run queries in a 5.5 KB WASM runtime, and prove every operation through a cryptographic witness chain — all in one file that runs anywhere from a browser to bare metal.

Compute and Execution:
- Self-boot as a microservice: contains a real Linux kernel, boots in under 125ms on Firecracker VMs, no install or dependencies
- Hardware-speed lookups via eBPF: hot vectors served directly in the Linux kernel data path, bypassing userspace entirely with three real C programs for distance, filtering, and routing
- Runs in any browser: a 5.5 KB WebAssembly runtime lets the same file serve queries in a browser tab with zero backend

AI and Data Storage:
- Ships models, graphs, and quantum state: one file carries LoRA fine-tune weights, graph neural network state, and quantum circuit snapshots alongside vectors
- Git-like branching: child files share parent data via COW (copy-on-write), a 1M-vector parent with 100 edits produces approximately 2.5 MB child instead of 512 MB copy

Security and Trust:
- Tamper-evident audit trail: every mutation appends a SHAKE-256 hash-linked log entry, creating an append-only chain similar to a blockchain
- Quantum-safe signatures: uses ML-DSA-65 (FIPS 204) lattice signatures, believed secure against quantum computers
- DNA-style lineage: each file embeds parent hashes, branch metadata, and merge proofs for full provenance tracking
- TEE attestations: can carry Intel SGX or ARM TrustZone attestation reports proving the file was created inside a secure enclave

HNSW Progressive Indexing:
- Three-layer system: L0 (brute-force, always correct), L1 (HNSW, builds while queries run), L2 (LSH, instant approximate)
- Queries start at L2, get refined through L1, verified at L0

Temperature-Tiered Quantization:
- Hot tier: full f32 precision for frequently accessed vectors
- Warm tier: f16 half-precision, 50% memory savings
- Cold tier: int8 quantization, 75% memory savings
- Automatic promotion/demotion based on access patterns

The ecosystem comprises 22 Rust crates (64K+ lines of code), 46 runnable examples, and 1,156 passing tests.

AGI Cognitive Container: RVF includes an AGI-ready container type for autonomous AI systems that need self-contained knowledge, reasoning, and execution capabilities.

Source: github.com/ruvnet/ruvector/crates/rvf`,
      tags: ['agentics-knowledge','rvf','ruvector-format','cognitive-container','wasm','ebpf','quantum-safe','kernel'],
      confidence: 0.95
    },
    {
      category: 'agentics-architecture',
      title: 'SONA: Self-Optimizing Neural Architecture',
      content: `SONA (Self-Optimizing Neural Architecture) is a real-time learning system enabling AI applications to learn from user feedback in sub-millisecond time without expensive retraining.

Core Innovations:

Two-Tier LoRA System:
- MicroLoRA: instant parameter adjustments at approximately 45 microseconds latency. Learns from individual interactions immediately.
- BaseLoRA: deeper learning that consolidates MicroLoRA patterns over time. Runs in background without blocking inference.

EWC++ (Elastic Weight Consolidation Plus Plus):
- Prevents catastrophic forgetting — the system remembers old patterns while learning new ones
- Tracks which parameters are important for existing knowledge and protects them during updates
- This is the key differentiator: most fine-tuning approaches lose previously learned knowledge

ReasoningBank:
- Stores successful interaction patterns using K-means++ clustering
- New queries are matched against stored patterns for instant recall
- Patterns are versioned and prunable to prevent unbounded growth

Performance Benchmarks:
- 2.2x better performance than design targets
- Sub-millisecond adaptation latency (<0.05ms for SONA, ~45 microseconds for MicroLoRA)
- Zero-downtime learning: system continues serving while learning

Integration:
- Core component of Claude Flow V3 intelligence pipeline
- Powers the hooks system real-time learning (post-edit, post-task hooks trigger SONA updates)
- Works with RuVector WASM runtime for edge deployment

Tutorials available: first SONA app, adaptive chatbot, LLM router with learning, browser WASM deployment, Node.js backend, production deployment.

Source: github.com/ruvnet/ruvector/crates/sona`,
      tags: ['agentics-knowledge','sona','neural-architecture','micro-lora','ewc','real-time-learning','catastrophic-forgetting'],
      confidence: 0.95
    },
    {
      category: 'agentics-architecture',
      title: 'RvLite: Lightweight WASM Vector Database',
      content: `RvLite is a lightweight, standalone vector database that runs entirely in WebAssembly. It works in browsers, Node.js, Deno, Bun, Cloudflare Workers, and Vercel Edge Functions.

Architecture:
RvLite is a thin orchestration layer that reuses battle-tested WASM crates:
- ruvector-core: core vector operations
- ruvector-wasm: WASM runtime bindings
- ruvector-graph-wasm: graph query engine
- ruvector-gnn-wasm: graph neural network inference
- sona: self-optimizing neural architecture
- micro-hnsw-wasm: lightweight HNSW index

Target size: under 3MB gzipped for the complete bundle.

Planned query interfaces: SQL, SPARQL, and Cypher for maximum compatibility.

Current status: proof-of-concept (v0.1.0)
- Phase 1 (POC): validates compilation and bundle size
- Phase 2: core integration with all WASM crates
- Phase 3: query interfaces and feature completion
- Phase 4: production release

Significance:
RvLite brings the full RuVector stack to the edge — any device with a browser or JS runtime can run vector search, GNN inference, and SONA learning locally. No server needed.

Source: github.com/ruvnet/ruvector/crates/rvlite`,
      tags: ['agentics-knowledge','rvlite','wasm','edge-computing','vector-database','browser'],
      confidence: 0.85
    },
    {
      category: 'agentics-architecture',
      title: 'RuVector: Distributed Learning Vector Database',
      content: `RuVector is a distributed vector database that learns — storing embeddings, querying with Cypher, scaling horizontally with Raft consensus, and improving itself through Graph Neural Networks.

Key Differentiator:
Unlike traditional query optimizers that use static rules, RuVector DAG (Directed Acyclic Graph) optimizer learns from actual execution patterns. The more queries it processes, the faster it gets.

ONNX Embeddings:
- Native embedding generation with 8+ pretrained models: all-MiniLM, BGE, E5, GTE families
- GPU acceleration support: CUDA, TensorRT, CoreML, WebGPU
- ~930 embeddings per second on CPU, faster with GPU

Scale:
- 42+ documented capabilities
- 49+ npm packages in the ecosystem
- 83+ Rust crates
- Multi-platform: browser (WASM), Node.js, native binary, edge devices

Ecosystem Components:
- RVF (RuVector Format): cognitive container file format
- SONA: self-optimizing neural architecture
- RvLite: lightweight WASM vector database
- rvf-server: HTTP server for RVF files
- rvf-solver-wasm: constraint solver in WASM
- rvf-wire: network protocol for RVF distribution

Mincut Algorithm:
RuVector uses the mincut algorithm for graph partitioning in distributed deployments. Mincut finds the minimum number of edges to cut to split a graph into two components — used for:
- Optimal data sharding across nodes
- Network topology optimization for agent swarms
- Bioacoustic signal segmentation (Seven Cents project uses mincut to separate animal vocalizations from background noise)

Integration with Claude Flow:
RuVector is the storage and intelligence layer beneath Claude Flow V3. All agent memory, pattern recognition, and semantic search flows through RuVector.

Source: github.com/ruvnet/ruvector`,
      tags: ['agentics-knowledge','ruvector','distributed-database','gnn','raft-consensus','mincut','onnx-embeddings','cypher'],
      confidence: 0.95
    }
  ];

  let newInserted = 0;
  for (const e of newEntries) {
    const exists = await pool.query(
      `SELECT 1 FROM openclaw_memory.operational_knowledge WHERE title = $1 LIMIT 1`, [e.title]
    );
    if (exists.rows.length > 0) { console.log(`  Skip (exists): ${e.title}`); continue; }

    await pool.query(
      `INSERT INTO openclaw_memory.operational_knowledge (category, title, content, tags, learned_from, confidence)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [e.category, e.title, e.content, e.tags, 'github.com/ruvnet/ruvector + Agentics videos', e.confidence]
    );
    newInserted++;
    console.log(`  Inserted: ${e.title}`);
  }
  console.log(`[2/5] ${newInserted} new entries inserted\n`);

  // Step 2: Count what needs embedding
  const countRes = await pool.query(
    `SELECT count(*) as total, count(embedding) as done FROM openclaw_memory.operational_knowledge WHERE tags @> ARRAY['agentics-knowledge']`
  );
  const total = parseInt(countRes.rows[0].total);
  const done = parseInt(countRes.rows[0].done);
  console.log(`[3/5] ${total} total entries, ${done} already embedded, ${total - done} need embedding\n`);

  if (total - done === 0) {
    console.log('All already embedded!');
    await cleanup();
    return;
  }

  // Step 3: Load ONNX
  console.log('Loading ONNX model...');
  const embPath = '/Users/stuartkerr/.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js';
  const mod = await import(embPath);
  const createFn = mod.createEmbeddingServiceAsync || mod.default?.createEmbeddingServiceAsync;
  const svc = await createFn({ provider: 'transformers', model: 'Xenova/all-MiniLM-L6-v2', dimensions: 384 });
  await svc.embed('warmup');
  console.log('[4/5] ONNX ready\n');

  // Step 4: Embed all missing
  const rows = await pool.query(
    `SELECT id, left(content, 2000) as text FROM openclaw_memory.operational_knowledge WHERE tags @> ARRAY['agentics-knowledge'] AND embedding IS NULL ORDER BY id`
  );

  const startTime = Date.now();
  for (let i = 0; i < rows.rows.length; i++) {
    const r = rows.rows[i];
    const result = await svc.embed(r.text);
    // svc.embed returns {embedding: Float32Array|number[], latencyMs: number}
    let emb = result?.embedding || result;
    if (emb && emb[0] && Array.isArray(emb[0])) emb = emb[0]; // unwrap nested
    const arr = Array.from(emb).slice(0, 384); // ensure 384 dims
    const vecStr = '[' + arr.join(',') + ']';
    await pool.query(
      `UPDATE openclaw_memory.operational_knowledge SET embedding = $1::ruvector WHERE id = $2`,
      [vecStr, r.id]
    );
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = ((i + 1) / elapsed * 1).toFixed(1);
    console.log(`  [${i + 1}/${rows.rows.length}] id=${r.id} embedded (${elapsed}s, ${rate}/s)`);
  }

  // Step 5: Re-enable trigger + verify
  await pool.query(`ALTER TABLE openclaw_memory.operational_knowledge ENABLE TRIGGER trg_auto_embed_opknowledge`);

  const verifyRes = await pool.query(
    `SELECT count(*) as total, count(embedding) as embedded FROM openclaw_memory.operational_knowledge WHERE tags @> ARRAY['agentics-knowledge']`
  );
  console.log(`\n[5/5] DONE: ${verifyRes.rows[0].total} entries, ${verifyRes.rows[0].embedded} embedded`);

  // Quick search test
  const testResult = await svc.embed('What is Claude Flow V3 architecture?');
  let testEmb = testResult?.embedding || testResult;
  if (testEmb && testEmb[0] && Array.isArray(testEmb[0])) testEmb = testEmb[0];
  const testStr = '[' + Array.from(testEmb).slice(0, 384).join(',') + ']';
  const searchRes = await pool.query(
    `SELECT title, 1 - (embedding <=> $1::ruvector) as similarity
     FROM openclaw_memory.operational_knowledge
     WHERE tags @> ARRAY['agentics-knowledge'] AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::ruvector LIMIT 5`,
    [testStr]
  );
  console.log('\n=== SEARCH TEST: "What is Claude Flow V3 architecture?" ===');
  for (const r of searchRes.rows) {
    console.log(`  ${(r.similarity * 100).toFixed(1)}% - ${r.title}`);
  }

  await cleanup();
}

async function cleanup() {
  await pool.end();
  process.exit(0);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
