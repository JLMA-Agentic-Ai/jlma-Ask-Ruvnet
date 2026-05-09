#!/usr/bin/env node
/**
 * synthesize-adrs.mjs — Cluster 263 ADRs into ~40 themed prescriptive entries.
 *
 * For each cluster:
 *   1. Read member ADR markdown files from data/adrs-cache/
 *   2. Send to Claude API (Sonnet) with prescriptive synthesis prompt
 *   3. Receive a 600-1500 char prescriptive entry: decision, why, alternatives, when-to-apply, references
 *   4. Embed via ONNX (Xenova/all-MiniLM-L6-v2, 384-dim)
 *   5. Append to kb-master.json with category 'adr-<source>-<theme>'
 *
 * Output: kb-master.json grows by ~40 entries.
 * Idempotent: skips clusters already present (matched by id prefix 'adr_').
 *
 * Usage:
 *   node scripts/synthesize-adrs.mjs                  # full run
 *   node scripts/synthesize-adrs.mjs --dry-run        # build cluster map, don't call API
 *   node scripts/synthesize-adrs.mjs --cluster <name> # synthesize one cluster only
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';

const ROOT = path.resolve(import.meta.dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const CACHE     = path.join(ROOT, 'data/adrs-cache');
const MASTER    = path.join(ROOT, 'kb-master.json');
const DRY_RUN   = process.argv.includes('--dry-run');
const SINGLE    = process.argv.includes('--cluster') ? process.argv[process.argv.indexOf('--cluster') + 1] : null;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const CONCURRENCY = 4;
const MODEL = 'claude-sonnet-4-5-20250929'; // proven, prescriptive synthesis quality

if (!ANTHROPIC_KEY && !DRY_RUN) { console.error('❌ ANTHROPIC_API_KEY missing'); process.exit(1); }

// ─── Cluster definitions (~40 themed groups) ───────────────────────────────
// Each cluster: { name, label, source, category, members(filename rules) }
// Rules: { dir, match: filename predicate fn or regex, exclude?: regex }

const CLUSTERS = [
  // RuLake — 8 ADRs → 2 clusters; the 155-158 set is also mirrored in RuVector repo, capture both copies
  { name: 'rulake-substrate-architecture',
    label: 'RuLake Substrate Architecture: rvDNA, ruQu, Memory Substrate, Optional Accelerator/Rotation Planes',
    source: 'RuLake',
    category: 'adr-rulake',
    rules: [
      { dir: 'rulake',   match: /ADR-(007|008|156|157|158)/ },
      { dir: 'ruvector', match: /^ADR-(156|157|158)/ },
    ] },
  { name: 'rulake-deployment-strategy',
    label: 'RuLake Deployment & Repository Strategy: Standalone Repo, Console UI, Datalake Layer',
    source: 'RuLake',
    category: 'adr-rulake',
    rules: [
      { dir: 'rulake',   match: /ADR-(001|006|155)/ },
      { dir: 'ruvector', match: /^ADR-155/ },
    ] },

  // RuVector core
  { name: 'ruvector-core-architecture',
    label: 'RuVector Core Architecture & WASM Runtime',
    source: 'RuVector', category: 'adr-ruvector-core',
    rules: [{ dir: 'ruvector', match: /^ADR-(001|005|006)-/ }] },

  // LLM / inference
  { name: 'ruvector-llm-inference',
    label: 'RuVLLM Integration: Mistral, Structured Output, Function Calling, Prefix Caching',
    source: 'RuVector', category: 'adr-ruvector-llm',
    rules: [{ dir: 'ruvector', match: /^ADR-(002|008|009|010|011|074|084)-/ }] },
  { name: 'ruvector-llm-serving',
    label: 'LLM Serving Engines: Continuous Batching, Pi Cluster, BitNet Quantization',
    source: 'RuVector', category: 'adr-ruvector-llm',
    rules: [{ dir: 'ruvector', match: /^ADR-(179|180|181)-/ }] },

  // KV cache
  { name: 'ruvector-kv-cache',
    label: 'KV Cache Management: Static, Dynamic Partition, Stacked Tri-Attention',
    source: 'RuVector', category: 'adr-ruvector-perf',
    rules: [{ dir: 'ruvector', match: /^ADR-(004|124|147)-/ }] },

  // SIMD / perf
  { name: 'ruvector-simd-performance',
    label: 'SIMD Optimization & Performance Engineering',
    source: 'RuVector', category: 'adr-ruvector-perf',
    rules: [{ dir: 'ruvector', match: /^ADR-(003|149|151)-/ }] },

  // Security
  { name: 'ruvector-security',
    label: 'Security: Audits, Remediation, AIDefence/TEE, Hash & Hailo Hardening',
    source: 'RuVector', category: 'adr-ruvector-security',
    rules: [{ dir: 'ruvector', match: /^ADR-(007|012|042|058|073|079|082|114|172)-/ }] },

  // Coherence top-level + nested CE-*
  { name: 'ruvector-coherence-top',
    label: 'Coherence Engine: Gated Transformer, Kernel Integration',
    source: 'RuVector', category: 'adr-ruvector-coherence',
    rules: [{ dir: 'ruvector', match: /^ADR-(014|015|141)-/ }] },
  { name: 'ruvector-coherence-engine-deep',
    label: 'Coherence Engine Deep Architecture (22 ADRs): Sheaf Laplacians, Storage, Governance, Compute Ladders',
    source: 'RuVector', category: 'adr-ruvector-coherence',
    rules: [{ dir: 'ruvector-coherence', match: /\.md$/ }] },

  // Delta behavior nested
  { name: 'ruvector-delta-behavior',
    label: 'Delta Behavior DDD: Encoding, Propagation, Conflict Resolution, Compression',
    source: 'RuVector', category: 'adr-ruvector-delta',
    rules: [{ dir: 'ruvector-delta', match: /\.md$/ }, { dir: 'ruvector', match: /^ADR-016-/ }] },

  // Quantum engine
  { name: 'ruvector-quantum-engine',
    label: 'Quantum Engine: VQE, Grover, QAOA, Surface Codes, Tensor Networks',
    source: 'RuVector', category: 'adr-ruvector-quantum',
    rules: [{ dir: 'ruvector-quantum', match: /\.md$/ }] },

  // Temporal tensor store nested + top-level temporal
  { name: 'ruvector-temporal-tensor-store',
    label: 'Temporal Tensor Compression: Block Storage, Tiered Quantization, Delta Reconstruction, WASM API',
    source: 'RuVector', category: 'adr-ruvector-temporal',
    rules: [{ dir: 'ruvector-temporal', match: /\.md$/ }, { dir: 'ruvector', match: /^ADR-017-/ }] },
  { name: 'ruvector-common-crawl-temporal',
    label: 'Common Crawl Temporal Compression Pipeline',
    source: 'RuVector', category: 'adr-ruvector-temporal',
    rules: [{ dir: 'ruvector', match: /^ADR-(115|118|119|120)-/ }] },

  // RVF format & cognitive containers
  { name: 'ruvector-rvf-format',
    label: 'RVF Canonical Format & Cognitive Containers',
    source: 'RuVector', category: 'adr-ruvector-rvf',
    rules: [{ dir: 'ruvector', match: /^ADR-(026|029|030|031|037|038|056|072)-/ }] },
  { name: 'ruvector-rvf-applications',
    label: 'RVF Applications: Solver-WASM-AGI, App Gallery, Knowledge Export, Federated Transfer',
    source: 'RuVector', category: 'adr-ruvector-rvf',
    rules: [{ dir: 'ruvector', match: /^ADR-(032|036|039|057|113)-/ }] },

  // Brain / Pi-Brain
  { name: 'ruvector-brain-cloud',
    label: 'Shared Brain Architecture: Google Cloud Deployment, Capabilities, Reasoning Kernel, Brainpedia',
    source: 'RuVector', category: 'adr-ruvector-brain',
    rules: [{ dir: 'ruvector', match: /^ADR-(059|060|061|062|069)/ }] },
  { name: 'ruvector-pi-brain',
    label: 'Pi-Brain Infrastructure: Hardware, Web Memory, API v2, Tailscale, Hypothesis Engine',
    source: 'RuVector', category: 'adr-ruvector-brain',
    rules: [{ dir: 'ruvector', match: /^ADR-(064|094-pi|095-pi|148|149|150)/ }] },
  { name: 'ruvector-brain-training',
    label: 'Brain Training: Server Deploy, Hardening, Training Loops, Cognitive Enrichment',
    source: 'RuVector', category: 'adr-ruvector-brain',
    rules: [{ dir: 'ruvector', match: /^ADR-(077|078|081|082|083|123)/ }] },
  { name: 'ruvector-brain-bitnet',
    label: 'Brain Quantization: Craftsman Ultra 30B 1-bit BitNet, AGI Stack',
    source: 'RuVector', category: 'adr-ruvector-brain',
    rules: [{ dir: 'ruvector', match: /^ADR-(024|075|076|090-ultra|091-int8|092)/ }] },

  // HNSW / RaBitQ / Vector indexing
  { name: 'ruvector-hnsw-rabitq',
    label: 'HNSW & Vector Indexing: Parameterized Queries, RaBitQ Rotation, ACORN Filtered, DiskANN-Vamana',
    source: 'RuVector', category: 'adr-ruvector-vector-index',
    rules: [{ dir: 'ruvector', match: /^ADR-(027|144-diskann|146|154|160|161|162|033)/ }] },

  // Graph / GNN
  { name: 'ruvector-graph-transformer',
    label: 'Graph Transformer: Architecture, Bindings, Sublinear Attention, Verified Training',
    source: 'RuVector', category: 'adr-ruvector-graph',
    rules: [{ dir: 'ruvector', match: /^ADR-(046|047|048|049|050)-/ }] },
  { name: 'ruvector-graph-physics-bio',
    label: 'Graph Layers: Physics-Informed, Biological, Temporal-Causal, Economic, Manifold',
    source: 'RuVector', category: 'adr-ruvector-graph',
    rules: [{ dir: 'ruvector', match: /^ADR-(051|052|053|054|055)-/ }] },

  // Sparse attention
  { name: 'ruvector-sparse-attention-core',
    label: 'Sparse Attention: Online Softmax, Landmark Fixes, Edge Cases, GQA/MQA, Causal Masking',
    source: 'RuVector', category: 'adr-ruvector-attention',
    rules: [{ dir: 'ruvector', match: /^ADR-(183|184|185|186|187|188|189|190)-/ }] },
  { name: 'ruvector-sparse-attention-edge',
    label: 'Sparse Attention on Edge: Pi Zero 2W Hardening, no_std ESP32 Support',
    source: 'RuVector', category: 'adr-ruvector-attention',
    rules: [{ dir: 'ruvector', match: /^ADR-(191|192)-/ }] },

  // RVAgent / DeepAgents
  { name: 'ruvector-deepagents-architecture',
    label: 'DeepAgents Rust Conversion: Backend Protocols, Middleware, Tool System, Subagents, Memory/Skills/Summarization, Testing, Implementation Roadmap',
    source: 'RuVector', category: 'adr-ruvector-rvagent',
    rules: [{ dir: 'ruvector', match: /^ADR-(093-deepagents|094-deepagents|095-deepagents|096-deepagents|097-deepagents|098-deepagents|099-deepagents|100-deepagents|101-deepagents|102-deepagents|103-deepagents)/ }] },
  { name: 'ruvector-rvagent-mcp',
    label: 'RVAgent MCP Server: Skills Topology, Implementation, Native Swarm WASM, RuvBot, Ruvocal UI',
    source: 'RuVector', category: 'adr-ruvector-rvagent',
    rules: [{ dir: 'ruvector', match: /^ADR-(104|105|107|108|111|112|122)/ }] },
  { name: 'ruvector-rvagent-protocol-runtime',
    label: 'RVAgent A2A Protocol & Agent Runtime Adapter, Claude Code Optimization',
    source: 'RuVector', category: 'adr-ruvector-rvagent',
    rules: [{ dir: 'ruvector', match: /^ADR-(139-rvagent|140|159)/ }] },

  // Hailo NPU
  { name: 'ruvector-hailo-npu',
    label: 'Hailo NPU Embedding Backend: CLI Surface, Cache, Tracing, Edge Node, Cluster',
    source: 'RuVector', category: 'adr-ruvector-hailo',
    rules: [{ dir: 'ruvector', match: /^ADR-(167|168|169|170|171|178|182)-/ }] },
  { name: 'ruvector-hailo-llm-edge',
    label: 'Hailo Edge LLM, Pi5 Thermal, HEF Integration, Pi4 Deploy',
    source: 'RuVector', category: 'adr-ruvector-hailo',
    rules: [{ dir: 'ruvector', match: /^ADR-(173|174|175|176|177)-/ }] },

  // ESP32 / tiny
  { name: 'ruvector-esp32-tiny',
    label: 'Tiny RuVLLM on ESP32: Cross-Compile Bringup, Operations',
    source: 'RuVector', category: 'adr-ruvector-edge',
    rules: [{ dir: 'ruvector', match: /^ADR-(165|166)-/ }] },

  // MCP / SSE
  { name: 'ruvector-mcp-transport',
    label: 'MCP Transport: SSE, Gate-Permit System, Decoupling Midstream Queue',
    source: 'RuVector', category: 'adr-ruvector-mcp',
    rules: [{ dir: 'ruvector', match: /^ADR-(066|067|130)-/ }] },

  // Decompiler / mincut
  { name: 'ruvector-mincut-decompiler',
    label: 'MinCut Decompiler with Witness Chains: Proof Verifier, GPU Deobfuscation, Memory Reconstruction, LLM Weights, Canonical Algorithms',
    source: 'RuVector', category: 'adr-ruvector-decompiler',
    rules: [{ dir: 'ruvector', match: /^ADR-(117-canonical|135|136|137-npm|138-llm)/ }] },

  // Cognitum / medical / domain
  { name: 'ruvector-domain-medical',
    label: 'Domain Verticals: eHealth, Dermatology, HearMusica Tympan, Whisper Transcription',
    source: 'RuVector', category: 'adr-ruvector-domain',
    rules: [{ dir: 'ruvector', match: /^ADR-(028|117-dragnes|143|144-candle|144-monorepo)-/ }] },

  // Trader
  { name: 'ruvector-neural-trader',
    label: 'Neural Trader: RuVector Integration, WASM, Kalshi',
    source: 'RuVector', category: 'adr-ruvector-trader',
    rules: [{ dir: 'ruvector', match: /^ADR-(085|086|153)-/ }] },

  // Cloud / Edge / Deploy
  { name: 'ruvector-cloud-edge-deploy',
    label: 'Cloud & Appliance Deployment: Google Edge, Backup Recovery, Boot Sequence, TEE Verification',
    source: 'RuVector', category: 'adr-ruvector-deploy',
    rules: [{ dir: 'ruvector', match: /^ADR-(069|109|137-bare|139-appliance|142)-/ }] },

  // Crawl / pipeline
  { name: 'ruvector-crawl-pipeline',
    label: 'Crawl & Pipeline Strategy: Cost-Effective Crawl, Historical, WET, Cloud Realtime, Gemini Grounding',
    source: 'RuVector', category: 'adr-ruvector-pipeline',
    rules: [{ dir: 'ruvector', match: /^ADR-(096|118|119|120|121)-/ }] },

  // Cognitum hypervisor / partitioning
  { name: 'ruvector-ruvix-cognition',
    label: 'Ruvix Cognition Kernel & Hypervisor Core, Partition Object Model',
    source: 'RuVector', category: 'adr-ruvector-ruvix',
    rules: [{ dir: 'ruvector', match: /^ADR-(087|106|132-ruvix|133-partition)-/ }] },

  // Witness / consciousness / metrics
  { name: 'ruvector-witness-consciousness',
    label: 'Witness Schema, Consciousness Metrics, Proof-Gated Mutation',
    source: 'RuVector', category: 'adr-ruvector-witness',
    rules: [{ dir: 'ruvector', match: /^ADR-(131|134-witness|117-canonical-mincut-pseudo)-/ }] },

  // Misc/cleanup catch-all
  { name: 'ruvector-misc-tooling',
    label: 'RuVector Tooling: Publishing, Capability Reports, External Providers, Postgres Extension, CNN, Internal Voice, Consciousness Metrics',
    source: 'RuVector', category: 'adr-ruvector-tooling',
    rules: [{ dir: 'ruvector', match: /^ADR-(013|035|043|044|063|065|068|070|071|080|088|089|090-imp|091-imp|093-daily|110|116|121|125|126|127|128|129|131|132-e2e|133-claude|134-ruvector|143-imp|145)/ }] },

  // Specialized exotic / discovery clusters
  { name: 'ruvector-exotic-discovery',
    label: 'Exotic Integrations & Discoveries: Exo-AI Multiparadigm, Causal Atlas Planet Detection, Lean Agentic, Domain Expansion',
    source: 'RuVector', category: 'adr-ruvector-exotic',
    rules: [{ dir: 'ruvector', match: /^ADR-(025|040|040a|040b|045|068|034)/ }] },

  // Cognitive seed / hardware bringup
  { name: 'ruvector-cognitive-seed',
    label: 'Cognitive Seed Hardware: QR Cognitive Seed, Seed Hardware Bring-Up, WASM Executable Nodes',
    source: 'RuVector', category: 'adr-ruvector-seed',
    rules: [{ dir: 'ruvector', match: /^ADR-(034|063|138-seed)/ }] },
];

// ─── Cluster assignment ────────────────────────────────────────────────────

function assignClusters() {
  const inv = JSON.parse(fs.readFileSync(path.join(CACHE, 'inventory.json'), 'utf8'));
  const allFiles = [];
  for (const src of inv.sources) {
    for (const f of src.files) allFiles.push({ ...f, dir: src.cacheDir });
  }
  const assignments = new Map(); // filename → clusterName
  const clusterMembers = {}; // clusterName → [{name, dir, size}]

  for (const cluster of CLUSTERS) {
    clusterMembers[cluster.name] = [];
    for (const file of allFiles) {
      if (assignments.has(`${file.dir}/${file.name}`)) continue;
      for (const rule of cluster.rules) {
        if (rule.dir !== file.dir) continue;
        if (rule.exclude && rule.exclude.test(file.name)) continue;
        const matches = rule.match instanceof RegExp ? rule.match.test(file.name) : rule.match(file.name);
        if (matches) {
          assignments.set(`${file.dir}/${file.name}`, cluster.name);
          clusterMembers[cluster.name].push(file);
          break;
        }
      }
    }
  }

  const unmatched = allFiles.filter(f => !assignments.has(`${f.dir}/${f.name}`));
  if (unmatched.length) clusterMembers.__unmatched = unmatched;
  return { clusterMembers, totalFiles: allFiles.length, unmatched };
}

// ─── Synthesis via Claude API ──────────────────────────────────────────────

async function callClaude(model, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return await res.json();
}

async function synthesize(cluster, members) {
  const adrs = members.map(m => {
    const md = fs.readFileSync(path.join(CACHE, m.dir, m.name), 'utf8');
    const repo = m.dir === 'rulake' ? 'RuLake' : 'RuVector';
    const subPath = m.dir.startsWith('ruvector-') ? `docs/adr/${m.dir.replace('ruvector-', '')}` : (m.dir === 'rulake' ? 'docs/adrs' : 'docs/adr');
    const url = `https://github.com/ruvnet/${repo}/blob/main/${subPath}/${m.name}`;
    const truncated = md.length > 8000 ? md.slice(0, 8000) + '\n...[truncated]' : md;
    return `### ${m.name}\n${url}\n\n${truncated}`;
  }).join('\n\n---\n\n');

  const prompt = `You are synthesizing prescriptive knowledge-base entries for the Ask-RuvNet KB. The KB serves engineers building on the RuVector/Ruflo stack — they need to know WHAT was decided, WHY, and WHEN to apply each pattern.

CLUSTER: ${cluster.label}
MEMBER ADRs (${members.length}):
${adrs}

TASK: Write ONE prescriptive KB entry that synthesizes this cluster. Format as markdown:

# ${cluster.label}

## What was decided
2-3 sentences. The concrete architectural decision(s).

## Why this approach
3-4 sentences covering tradeoffs vs alternatives that were rejected. Be specific — name the alternatives.

## When to apply
Bullet list of 3-5 concrete situations where this pattern fits. Be prescriptive.

## What's unique
1-2 sentences on what makes this approach distinctive vs industry-standard solutions.

## Reference ADRs
List each member ADR as: \`- ADR-XXX: <one-line summary> ([link](url))\`

CONSTRAINTS:
- Total length: 600-1500 characters in the body (excluding the reference list).
- Be concrete. Don't say "leverages advanced techniques" — name the technique.
- If multiple ADRs cover related ground, synthesize the throughline, don't list them separately.
- Prescriptive voice. "Use X when Y" not "X may be useful in some cases."
- Output ONLY the markdown entry. No preamble, no explanation.`;

  // Try Sonnet first, fall back to Haiku on refusal (some ADR content trips safety classifiers).
  let data = await callClaude(MODEL, prompt);
  if (!data.content?.[0]?.text) {
    console.error(`\n[fallback] ${cluster.name} stop_reason=${data.stop_reason} on ${MODEL}; retrying with Haiku`);
    data = await callClaude('claude-haiku-4-5-20251001', prompt);
  }
  if (!data.content?.[0]?.text) {
    throw new Error(`Both Sonnet and Haiku returned no text. stop_reason=${data.stop_reason}`);
  }
  return data.content[0].text;
}

// ─── ONNX embeddings ───────────────────────────────────────────────────────

let onnxSvc = null;
async function initOnnx() {
  const embPath = path.join(os.homedir(), '.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js');
  if (!fs.existsSync(embPath)) throw new Error(`ONNX embeddings not found: ${embPath}`);
  const mod = await import(embPath);
  onnxSvc = await mod.createEmbeddingServiceAsync({ provider: 'transformers', model: 'Xenova/all-MiniLM-L6-v2', dimensions: 384 });
  await onnxSvc.embed('warmup');
}
async function embed(text) {
  const r = await onnxSvc.embed(text.slice(0, 2000));
  return Array.from(r.embedding);
}

// ─── pool ──────────────────────────────────────────────────────────────────
async function pool(items, fn, concurrency) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = { ok: true, value: await fn(items[idx]) }; }
      catch (e) { results[idx] = { ok: false, error: e.message, item: items[idx] }; }
    }
  }));
  return results;
}

// ─── main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Building cluster map from ${path.relative(ROOT, CACHE)}…`);
  const { clusterMembers, totalFiles, unmatched } = assignClusters();

  console.log(`\n=== Cluster assignment ===`);
  let assignedTotal = 0;
  for (const c of CLUSTERS) {
    const members = clusterMembers[c.name] || [];
    assignedTotal += members.length;
    console.log(`  ${members.length.toString().padStart(3)} • ${c.name}`);
  }
  console.log(`\n  ${unmatched.length} unmatched`);
  console.log(`  ${assignedTotal} assigned + ${unmatched.length} unmatched = ${assignedTotal + unmatched.length} (total ${totalFiles})\n`);

  if (unmatched.length) {
    console.log('UNMATCHED ADRs:');
    unmatched.slice(0, 30).forEach(f => console.log(`  - ${f.dir}/${f.name}`));
    if (unmatched.length > 30) console.log(`  ... +${unmatched.length - 30} more`);
  }

  if (DRY_RUN) { console.log('\n--dry-run: stopping before API calls'); return; }

  // Process clusters
  const master = JSON.parse(fs.readFileSync(MASTER, 'utf8'));
  const existing = new Set(master.entries.filter(e => e.id?.startsWith('adr_')).map(e => e.id));

  const toProcess = CLUSTERS.filter(c => {
    if (SINGLE && c.name !== SINGLE) return false;
    const id = `adr_${c.name}`;
    if (existing.has(id) && !SINGLE) return false;
    if (!(clusterMembers[c.name]?.length)) return false;
    return true;
  });
  console.log(`\nWill process ${toProcess.length} clusters (skipping ${CLUSTERS.length - toProcess.length} already present or empty).`);

  console.log('Initializing ONNX…');
  await initOnnx();
  console.log('ONNX ready.\n');

  const results = await pool(toProcess, async (cluster) => {
    const members = clusterMembers[cluster.name];
    process.stdout.write(`  → ${cluster.name} (${members.length} ADRs)…`);
    const t0 = Date.now();
    const content = await synthesize(cluster, members);
    const embedding = await embed(`${cluster.label}\n\n${content.slice(0, 1500)}`);
    const ms = Date.now() - t0;
    process.stdout.write(` ${(ms/1000).toFixed(1)}s\n`);
    return { cluster, members, content, embedding };
  }, CONCURRENCY);

  const ok = results.filter(r => r.ok);
  const errs = results.filter(r => !r.ok);
  console.log(`\nSynthesized ${ok.length}/${toProcess.length} clusters (${errs.length} errors)`);
  if (errs.length) errs.forEach(e => console.error(`  ✗ ${e.item.name}: ${e.error}`));

  // Append to kb-master.json
  const now = new Date().toISOString();
  for (const r of ok) {
    const { cluster, members, content, embedding } = r.value;
    const id = `adr_${cluster.name}`;
    const entry = {
      id,
      title: cluster.label,
      content,
      category: cluster.category,
      quality_score: 96,
      file_path: `adrs/${cluster.source.toLowerCase()}/${cluster.name}.md`,
      embedding,
      created_at: now,
      updated_at: now,
      adr_members: members.map(m => `${m.dir}/${m.name}`),
    };
    const idx = master.entries.findIndex(e => e.id === id);
    if (idx >= 0) master.entries[idx] = entry;
    else master.entries.push(entry);
  }
  master.entryCount = master.entries.length;

  fs.writeFileSync(MASTER, JSON.stringify(master, null, 2));
  console.log(`\n✅ kb-master.json now has ${master.entryCount} entries (was ${master.entryCount - ok.length}).`);
}

main().catch(e => { console.error(e); process.exit(1); });
