/**
 * RVF vs Legacy PersistentVectorDB Benchmark
 *
 * Measures: cold start, search latency, memory usage
 * Compares: RvfStore (native NAPI-RS) vs RuvectorStore (JS PersistentVectorDB)
 *
 * Updated: 2026-03-02 | Version 1.0.0
 */

import { createRequire } from 'module';
import { performance } from 'perf_hooks';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

const require = createRequire(import.meta.url);
const PROJECT = path.resolve(new URL('.', import.meta.url).pathname, '..');
process.chdir(PROJECT);

// ── Test queries ────────────────────────────────────────────────────────────
const QUERIES = [
  'What is Claude Flow V3?',
  'How does HNSW work?',
  'What is RVF format?',
  'Explain vector embeddings',
  'How to build an AI agent swarm',
  'What is AIMDS security?',
  'How does SONA self-optimization work?',
  'What are cognitive containers?',
  'Explain the RuVector architecture',
  'How to use MCP tools?',
];

const TOP_K = 5;

// ── Utility ─────────────────────────────────────────────────────────────────
function fmt(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} us`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function fmtMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function memSnap() {
  const m = process.memoryUsage();
  return { rss: m.rss, heap: m.heapUsed, external: m.external };
}

function memDelta(before, after) {
  return {
    rss: after.rss - before.rss,
    heap: after.heap - before.heap,
    external: after.external - before.external,
  };
}

function printTable(rows, headers) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => String(r[i]).length))
  );
  const sep = widths.map(w => '-'.repeat(w + 2)).join('+');
  const fmtRow = r => r.map((c, i) => ` ${String(c).padEnd(widths[i])} `).join('|');

  console.log(sep);
  console.log(fmtRow(headers));
  console.log(sep);
  rows.forEach(r => console.log(fmtRow(r)));
  console.log(sep);
}

// ── ONNX embedding service (shared by both stores) ──────────────────────────
const ONNX_PATH = process.env.CLAUDE_FLOW_EMBEDDINGS_PATH ||
  path.join(require('os').homedir(), '.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js');

let onnxSvc = null;
async function getOnnx() {
  if (onnxSvc) return onnxSvc;
  try {
    const mod = await import(ONNX_PATH);
    onnxSvc = await mod.createEmbeddingServiceAsync({
      provider: 'transformers',
      model: 'Xenova/all-MiniLM-L6-v2',
      dimensions: 384,
    });
    return onnxSvc;
  } catch (e) {
    console.warn('[bench] ONNX unavailable:', e.message);
    return null;
  }
}

async function embed(text) {
  const svc = await getOnnx();
  if (svc) {
    const r = await svc.embed(text);
    if (r?.embedding) return new Float32Array(r.embedding);
    if (r?.length) return new Float32Array(r);
  }
  // hash fallback
  const dim = 384;
  const v = new Float32Array(dim);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = (h * 16777619) >>> 0;
    v[i % dim] = (v[i % dim] + (h % 1000) / 1000) % 1;
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) v[i] /= norm;
  return v;
}

// ── Warm up ONNX once before both benchmarks ────────────────────────────────
async function warmUpOnnx() {
  console.log('\n[warm-up] Loading ONNX embedding model...');
  const t0 = performance.now();
  await embed('warm up query');
  console.log(`[warm-up] ONNX ready in ${fmt(performance.now() - t0)}\n`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  BENCHMARK 1: RvfStore (native @ruvector/rvf)
// ═════════════════════════════════════════════════════════════════════════════
async function benchRvf() {
  console.log('='.repeat(70));
  console.log(' RVF NATIVE BENCHMARK (@ruvector/rvf — NAPI-RS Rust bindings)');
  console.log('='.repeat(70));

  const rvfPath = path.resolve('knowledge.rvf');
  const sidecarPath = path.resolve('content-sidecar.json.gz');

  if (!fs.existsSync(rvfPath)) {
    console.log('[SKIP] knowledge.rvf not found');
    return null;
  }

  const memBefore = memSnap();

  // ── Cold start: open RVF + load sidecar ──────────────────────────────────
  const t0 = performance.now();

  const { RvfDatabase } = await import('@ruvector/rvf');
  const rvfDb = await RvfDatabase.openReadonly(rvfPath);
  const status = await rvfDb.status();

  let contentMap = {};
  if (fs.existsSync(sidecarPath)) {
    const gz = fs.readFileSync(sidecarPath);
    contentMap = JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
  }

  const coldOpenMs = performance.now() - t0;
  const memAfterLoad = memSnap();

  console.log(`  Vectors:       ${status.totalVectors.toLocaleString()}`);
  console.log(`  Segments:      ${status.totalSegments}`);
  console.log(`  Sidecar:       ${Object.keys(contentMap).length.toLocaleString()} entries`);
  console.log(`  Cold open:     ${fmt(coldOpenMs)}`);
  console.log(`  Mem delta:     RSS ${fmtMB(memAfterLoad.rss - memBefore.rss)}, Heap ${fmtMB(memAfterLoad.heap - memBefore.heap)}, External ${fmtMB(memAfterLoad.external - memBefore.external)}`);
  console.log('');

  // ── Cold start: first query (includes embedding generation) ──────────────
  const tFirst0 = performance.now();
  const firstEmb = await embed(QUERIES[0]);
  const tEmbedDone = performance.now();
  const firstResults = await rvfDb.query(firstEmb, TOP_K * 2);
  const coldFirstMs = performance.now() - tFirst0;
  const firstEmbedMs = tEmbedDone - tFirst0;
  const firstSearchMs = coldFirstMs - firstEmbedMs;

  console.log(`  First query:   ${fmt(coldFirstMs)} total (embed ${fmt(firstEmbedMs)} + search ${fmt(firstSearchMs)})`);
  console.log(`  Results:       ${firstResults.length} hits`);
  console.log('');

  // ── Warm search: 10 queries ──────────────────────────────────────────────
  const latencies = [];
  const embedLatencies = [];
  const searchLatencies = [];
  const resultCounts = [];

  for (const q of QUERIES) {
    const tq0 = performance.now();
    const qEmb = await embed(q);
    const tqEmb = performance.now();
    const results = await rvfDb.query(qEmb, TOP_K * 2);
    const tq1 = performance.now();

    embedLatencies.push(tqEmb - tq0);
    searchLatencies.push(tq1 - tqEmb);
    latencies.push(tq1 - tq0);
    resultCounts.push(results.length);
  }

  const memAfterSearch = memSnap();
  await rvfDb.close();

  const avgTotal = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const avgEmbed = embedLatencies.reduce((a, b) => a + b, 0) / embedLatencies.length;
  const avgSearch = searchLatencies.reduce((a, b) => a + b, 0) / searchLatencies.length;
  const p50 = [...searchLatencies].sort((a, b) => a - b)[Math.floor(searchLatencies.length / 2)];
  const p99 = [...searchLatencies].sort((a, b) => a - b)[Math.floor(searchLatencies.length * 0.99)];
  const minSearch = Math.min(...searchLatencies);
  const maxSearch = Math.max(...searchLatencies);

  return {
    name: 'RVF Native',
    vectors: status.totalVectors,
    coldOpenMs,
    coldFirstMs,
    firstEmbedMs,
    firstSearchMs,
    avgTotal,
    avgEmbed,
    avgSearch,
    p50,
    p99,
    minSearch,
    maxSearch,
    memLoad: memDelta(memBefore, memAfterLoad),
    memSearch: memDelta(memBefore, memAfterSearch),
    latencies,
    embedLatencies,
    searchLatencies,
    resultCounts,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  BENCHMARK 2: Legacy PersistentVectorDB
// ═════════════════════════════════════════════════════════════════════════════
async function benchLegacy() {
  console.log('\n' + '='.repeat(70));
  console.log(' LEGACY BENCHMARK (PersistentVectorDB — JavaScript HNSW)');
  console.log('='.repeat(70));

  const kbPath = path.resolve('.ruvector/knowledge-base');
  const manifestPath = path.join(kbPath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.log('[SKIP] .ruvector/knowledge-base/manifest.json not found');
    return null;
  }

  const memBefore = memSnap();

  // ── Cold start ───────────────────────────────────────────────────────────
  const t0 = performance.now();

  const { getPersistentVectorDB } = require(path.resolve('src/storage'));
  const db = await getPersistentVectorDB('knowledge-base', {
    dimensions: 384,
    distanceMetric: 'Cosine',
    saveIntervalMs: 0,
    useWAL: false,
  });

  const stats = db.getStats();
  const coldOpenMs = performance.now() - t0;
  const memAfterLoad = memSnap();

  console.log(`  Vectors:       ${(stats.vectorCount || 0).toLocaleString()}`);
  console.log(`  Cold open:     ${fmt(coldOpenMs)}`);
  console.log(`  Mem delta:     RSS ${fmtMB(memAfterLoad.rss - memBefore.rss)}, Heap ${fmtMB(memAfterLoad.heap - memBefore.heap)}, External ${fmtMB(memAfterLoad.external - memBefore.external)}`);
  console.log('');

  // ── Cold first query ─────────────────────────────────────────────────────
  const tFirst0 = performance.now();
  const firstEmb = await embed(QUERIES[0]);
  const tEmbedDone = performance.now();
  const firstResults = await db.search({ vector: firstEmb, k: TOP_K * 2 });
  const coldFirstMs = performance.now() - tFirst0;
  const firstEmbedMs = tEmbedDone - tFirst0;
  const firstSearchMs = coldFirstMs - firstEmbedMs;

  console.log(`  First query:   ${fmt(coldFirstMs)} total (embed ${fmt(firstEmbedMs)} + search ${fmt(firstSearchMs)})`);
  console.log(`  Results:       ${firstResults.length} hits`);
  console.log('');

  // ── Warm search: 10 queries ──────────────────────────────────────────────
  const latencies = [];
  const embedLatencies = [];
  const searchLatencies = [];
  const resultCounts = [];

  for (const q of QUERIES) {
    const tq0 = performance.now();
    const qEmb = await embed(q);
    const tqEmb = performance.now();
    const results = await db.search({ vector: qEmb, k: TOP_K * 2 });
    const tq1 = performance.now();

    embedLatencies.push(tqEmb - tq0);
    searchLatencies.push(tq1 - tqEmb);
    latencies.push(tq1 - tq0);
    resultCounts.push(results.length);
  }

  const memAfterSearch = memSnap();
  await db.close();

  const avgTotal = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const avgEmbed = embedLatencies.reduce((a, b) => a + b, 0) / embedLatencies.length;
  const avgSearch = searchLatencies.reduce((a, b) => a + b, 0) / searchLatencies.length;
  const p50 = [...searchLatencies].sort((a, b) => a - b)[Math.floor(searchLatencies.length / 2)];
  const p99 = [...searchLatencies].sort((a, b) => a - b)[Math.floor(searchLatencies.length * 0.99)];
  const minSearch = Math.min(...searchLatencies);
  const maxSearch = Math.max(...searchLatencies);

  return {
    name: 'Legacy PersistentVectorDB',
    vectors: stats.vectorCount || 0,
    coldOpenMs,
    coldFirstMs,
    firstEmbedMs,
    firstSearchMs,
    avgTotal,
    avgEmbed,
    avgSearch,
    p50,
    p99,
    minSearch,
    maxSearch,
    memLoad: memDelta(memBefore, memAfterLoad),
    memSearch: memDelta(memBefore, memAfterSearch),
    latencies,
    embedLatencies,
    searchLatencies,
    resultCounts,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN — run both and compare
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n  Ask-RuvNet Search Performance Benchmark');
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log(`  Node: ${process.version}`);
  console.log(`  Platform: ${process.platform} ${process.arch}`);
  console.log(`  Queries: ${QUERIES.length}, topK: ${TOP_K}`);
  console.log('');

  await warmUpOnnx();

  const rvf = await benchRvf();
  const legacy = await benchLegacy();

  // ── Per-query detail ────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log(' PER-QUERY LATENCY DETAIL (search only, excludes embedding)');
  console.log('='.repeat(70));

  const detailRows = QUERIES.map((q, i) => {
    const short = q.length > 35 ? q.slice(0, 32) + '...' : q;
    const rvfMs = rvf ? fmt(rvf.searchLatencies[i]) : 'N/A';
    const legMs = legacy ? fmt(legacy.searchLatencies[i]) : 'N/A';
    const speedup = (rvf && legacy) ? `${(legacy.searchLatencies[i] / rvf.searchLatencies[i]).toFixed(1)}x` : '-';
    return [short, rvfMs, legMs, speedup];
  });
  printTable(detailRows, ['Query', 'RVF Native', 'Legacy JS', 'Speedup']);

  // ── Summary comparison ────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log(' SUMMARY COMPARISON');
  console.log('='.repeat(70));

  const summaryRows = [];
  const push = (label, rvfVal, legVal, unit = '') => {
    const r = rvf ? rvfVal(rvf) : 'N/A';
    const l = legacy ? legVal(legacy) : 'N/A';
    summaryRows.push([label, String(r) + unit, String(l) + unit]);
  };

  push('Vectors', r => r.vectors.toLocaleString(), l => l.vectors.toLocaleString());
  push('Cold open (DB load)', r => fmt(r.coldOpenMs), l => fmt(l.coldOpenMs));
  push('First query (total)', r => fmt(r.coldFirstMs), l => fmt(l.coldFirstMs));
  push('  - Embed time', r => fmt(r.firstEmbedMs), l => fmt(l.firstEmbedMs));
  push('  - Search time', r => fmt(r.firstSearchMs), l => fmt(l.firstSearchMs));
  push('Avg search (10q)', r => fmt(r.avgSearch), l => fmt(l.avgSearch));
  push('P50 search', r => fmt(r.p50), l => fmt(l.p50));
  push('Min search', r => fmt(r.minSearch), l => fmt(l.minSearch));
  push('Max search', r => fmt(r.maxSearch), l => fmt(l.maxSearch));
  push('Avg embed', r => fmt(r.avgEmbed), l => fmt(l.avgEmbed));
  push('Avg total (embed+search)', r => fmt(r.avgTotal), l => fmt(l.avgTotal));
  push('Mem RSS after load', r => fmtMB(r.memLoad.rss), l => fmtMB(l.memLoad.rss));
  push('Mem Heap after load', r => fmtMB(r.memLoad.heap), l => fmtMB(l.memLoad.heap));
  push('Mem External after load', r => fmtMB(r.memLoad.external), l => fmtMB(l.memLoad.external));
  push('Mem RSS after search', r => fmtMB(r.memSearch.rss), l => fmtMB(l.memSearch.rss));

  printTable(summaryRows, ['Metric', 'RVF Native', 'Legacy JS']);

  // ── Speedup calculation ───────────────────────────────────────────────
  if (rvf && legacy) {
    console.log('\n' + '='.repeat(70));
    console.log(' SPEEDUP (Legacy / RVF — higher is better for RVF)');
    console.log('='.repeat(70));
    const searchSpeedup = legacy.avgSearch / rvf.avgSearch;
    const totalSpeedup = legacy.avgTotal / rvf.avgTotal;
    const coldSpeedup = legacy.coldOpenMs / rvf.coldOpenMs;
    const memRatio = legacy.memLoad.rss / (rvf.memLoad.rss || 1);

    console.log(`  Search speedup:    ${searchSpeedup.toFixed(1)}x`);
    console.log(`  Total speedup:     ${totalSpeedup.toFixed(1)}x`);
    console.log(`  Cold open speedup: ${coldSpeedup.toFixed(1)}x`);
    console.log(`  Memory ratio:      ${memRatio.toFixed(2)}x (RSS)`);
    console.log('');

    if (searchSpeedup > 1) {
      console.log(`  RESULT: RVF Native is ${searchSpeedup.toFixed(1)}x faster for vector search.`);
    } else {
      console.log(`  RESULT: Legacy JS is ${(1/searchSpeedup).toFixed(1)}x faster for vector search.`);
    }
  }

  console.log('\nBenchmark complete.\n');
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
