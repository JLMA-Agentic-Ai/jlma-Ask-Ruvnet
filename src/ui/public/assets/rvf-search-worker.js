/**
 * rvf-search-worker.js — Web Worker for RVF WASM vector search
 *
 * Loads scalar-quantized vectors, dequantizes to f32,
 * builds an in-memory HNSW index via @ruvector/rvf-wasm,
 * and handles search queries.
 *
 * Messages:
 *   { type: 'init', baseUrl: '/assets' }  → starts loading
 *   { type: 'search', query: Float32Array, k: 10 }  → returns results
 *   { type: 'status' }  → returns current state
 *
 * Updated: 2026-03-02 22:15:00 EST | Version 1.0.0
 */

let state = 'idle'; // idle → loading → ready → error
let vectorCount = 0;
let dimensions = 384;
let metadata = null; // compact metadata array
let wasm = null; // WASM exports
let storeHandle = 0; // WASM store handle
let loadProgress = 0; // 0-100

self.onmessage = async (event) => {
  const { type, ...data } = event.data;

  switch (type) {
    case 'init':
      await initialize(data.baseUrl || '/assets');
      break;
    case 'search':
      await handleSearch(data.query, data.k || 10);
      break;
    case 'status':
      self.postMessage({ type: 'status', state, vectorCount, loadProgress });
      break;
    default:
      self.postMessage({ type: 'error', message: `Unknown message type: ${type}` });
  }
};

async function initialize(baseUrl) {
  if (state === 'loading' || state === 'ready') return;
  state = 'loading';
  loadProgress = 0;
  self.postMessage({ type: 'progress', state, progress: 0, message: 'Starting...' });

  try {
    // Step 1: Fetch SQ params (tiny, ~3KB)
    self.postMessage({ type: 'progress', state: 'loading', progress: 5, message: 'Loading quantization params...' });
    const paramsResp = await fetch(`${baseUrl}/knowledge-sq8-params.bin`);
    const paramsBuffer = await paramsResp.arrayBuffer();
    const paramsView = new DataView(paramsBuffer);

    // Parse header: [MAGIC 8B][vectorCount u32][dimensions u32][dimMin f32×D][dimMax f32×D]
    vectorCount = paramsView.getUint32(8, true);
    dimensions = paramsView.getUint32(12, true);
    const dimMin = new Float32Array(paramsBuffer, 16, dimensions);
    const dimMax = new Float32Array(paramsBuffer, 16 + dimensions * 4, dimensions);

    // Compute range for dequantization
    const dimRange = new Float32Array(dimensions);
    for (let d = 0; d < dimensions; d++) {
      dimRange[d] = dimMax[d] - dimMin[d];
      if (dimRange[d] === 0) dimRange[d] = 1;
    }

    self.postMessage({ type: 'progress', state: 'loading', progress: 10, message: `Loading ${vectorCount} quantized vectors...` });

    // Step 2: Fetch quantized vectors (gzipped — browser auto-decompresses with Accept-Encoding)
    // Try .gz first (if server serves with Content-Encoding), fall back to raw
    let vectorsBuffer;
    try {
      const resp = await fetch(`${baseUrl}/knowledge-sq8.bin`);
      vectorsBuffer = await resp.arrayBuffer();
    } catch {
      const resp = await fetch(`${baseUrl}/knowledge-sq8.bin.gz`);
      // If we get the .gz file, we need to decompress
      const ds = new DecompressionStream('gzip');
      const decompressed = resp.body.pipeThrough(ds);
      const reader = decompressed.getReader();
      const chunks = [];
      let totalSize = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalSize += value.length;
      }
      const combined = new Uint8Array(totalSize);
      let off = 0;
      for (const chunk of chunks) {
        combined.set(chunk, off);
        off += chunk.length;
      }
      vectorsBuffer = combined.buffer;
    }

    const quantizedVectors = new Uint8Array(vectorsBuffer);
    self.postMessage({ type: 'progress', state: 'loading', progress: 50, message: 'Dequantizing vectors...' });

    // Step 3: Dequantize uint8 → f32
    const BATCH_SIZE = 5000;
    const allVectors = new Float32Array(vectorCount * dimensions);

    for (let start = 0; start < vectorCount; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE, vectorCount);
      for (let i = start; i < end; i++) {
        const srcOff = i * dimensions;
        const dstOff = i * dimensions;
        for (let d = 0; d < dimensions; d++) {
          allVectors[dstOff + d] = dimMin[d] + (quantizedVectors[srcOff + d] / 255) * dimRange[d];
        }
      }
      const pct = 50 + Math.round((start / vectorCount) * 30);
      self.postMessage({ type: 'progress', state: 'loading', progress: pct, message: `Dequantized ${end}/${vectorCount}...` });
    }

    self.postMessage({ type: 'progress', state: 'loading', progress: 80, message: 'Building HNSW index...' });

    // Step 4: Load WASM and build index
    // Try to import the WASM module
    try {
      const wasmModule = await import('/node_modules/@ruvector/rvf-wasm/pkg/rvf_wasm.mjs');
      wasm = await wasmModule.default();
    } catch {
      // Fallback: build a simple brute-force search (no WASM needed)
      wasm = null;
    }

    if (wasm && wasm.rvf_store_create) {
      // Use WASM HNSW store
      storeHandle = wasm.rvf_store_create(dimensions, 2); // 2 = cosine metric
      if (storeHandle <= 0) throw new Error('Failed to create WASM store');

      // Ingest in batches
      const INGEST_BATCH = 1000;
      for (let start = 0; start < vectorCount; start += INGEST_BATCH) {
        const end = Math.min(start + INGEST_BATCH, vectorCount);
        const batchCount = end - start;
        const batchVecs = allVectors.slice(start * dimensions, end * dimensions);
        const batchIds = new BigUint64Array(batchCount);
        for (let i = 0; i < batchCount; i++) batchIds[i] = BigInt(start + i);

        const vecsPtr = wasm.rvf_alloc(batchVecs.byteLength);
        const idsPtr = wasm.rvf_alloc(batchIds.byteLength);
        new Float32Array(wasm.memory.buffer, vecsPtr, batchVecs.length).set(batchVecs);
        new BigUint64Array(wasm.memory.buffer, idsPtr, batchIds.length).set(batchIds);
        wasm.rvf_store_ingest(storeHandle, vecsPtr, idsPtr, batchCount);
        wasm.rvf_free(vecsPtr, batchVecs.byteLength);
        wasm.rvf_free(idsPtr, batchIds.byteLength);

        const pct = 80 + Math.round(((start / vectorCount) * 15));
        if (start % 10000 === 0) {
          self.postMessage({ type: 'progress', state: 'loading', progress: pct, message: `Indexing ${end}/${vectorCount}...` });
        }
      }
    } else {
      // Fallback: store vectors for brute-force search
      self._allVectors = allVectors;
      self._dimMin = dimMin;
      self._dimRange = dimRange;
    }

    // Step 5: Load metadata
    self.postMessage({ type: 'progress', state: 'loading', progress: 95, message: 'Loading metadata...' });
    try {
      const metaResp = await fetch(`${baseUrl}/knowledge-meta.json`);
      metadata = await metaResp.json();
    } catch {
      try {
        const metaResp = await fetch(`${baseUrl}/knowledge-meta.json.gz`);
        const ds = new DecompressionStream('gzip');
        const decompressed = metaResp.body.pipeThrough(ds);
        const text = await new Response(decompressed).text();
        metadata = JSON.parse(text);
      } catch {
        metadata = [];
      }
    }

    state = 'ready';
    loadProgress = 100;
    self.postMessage({
      type: 'ready',
      vectorCount,
      dimensions,
      metadataCount: metadata.length,
      hasWasm: !!wasm,
    });

  } catch (err) {
    state = 'error';
    self.postMessage({ type: 'error', message: err.message });
  }
}

async function handleSearch(queryArray, k) {
  if (state !== 'ready') {
    self.postMessage({ type: 'results', results: [], error: 'Store not ready' });
    return;
  }

  const query = queryArray instanceof Float32Array ? queryArray : new Float32Array(queryArray);
  const startTime = performance.now();

  let results = [];

  if (wasm && storeHandle > 0) {
    // WASM HNSW search
    const queryPtr = wasm.rvf_alloc(query.byteLength);
    new Float32Array(wasm.memory.buffer, queryPtr, query.length).set(query);
    const outSize = k * 12; // 8 bytes id + 4 bytes distance
    const outPtr = wasm.rvf_alloc(outSize);

    const count = wasm.rvf_store_query(storeHandle, queryPtr, k, 0, outPtr);
    const view = new DataView(wasm.memory.buffer);

    for (let i = 0; i < count; i++) {
      const off = outPtr + i * 12;
      const id = Number(view.getBigUint64(off, true));
      const distance = view.getFloat32(off + 8, true);
      const meta = metadata[id] || {};
      results.push({
        id: meta.id || String(id),
        distance,
        title: meta.t || '',
        category: meta.c || '',
        quality_score: meta.q || 0,
        knowledge_type: meta.k || '',
        package_name: meta.p || '',
      });
    }

    wasm.rvf_free(queryPtr, query.byteLength);
    wasm.rvf_free(outPtr, outSize);
  } else {
    // Brute-force fallback
    const allVectors = self._allVectors;
    const scores = [];

    for (let i = 0; i < vectorCount; i++) {
      const offset = i * dimensions;
      let dot = 0, normA = 0, normB = 0;
      for (let d = 0; d < dimensions; d++) {
        const a = query[d];
        const b = allVectors[offset + d];
        dot += a * b;
        normA += a * a;
        normB += b * b;
      }
      const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
      scores.push({ idx: i, distance: 1 - sim });
    }

    scores.sort((a, b) => a.distance - b.distance);
    results = scores.slice(0, k).map(s => {
      const meta = metadata[s.idx] || {};
      return {
        id: meta.id || String(s.idx),
        distance: s.distance,
        title: meta.t || '',
        category: meta.c || '',
        quality_score: meta.q || 0,
        knowledge_type: meta.k || '',
        package_name: meta.p || '',
      };
    });
  }

  const elapsed = performance.now() - startTime;
  self.postMessage({
    type: 'results',
    results,
    elapsed: elapsed.toFixed(1),
    method: wasm ? 'wasm-hnsw' : 'brute-force',
  });
}
