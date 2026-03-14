/**
 * build-quantized-rvf.mjs — Build scalar-quantized RVF binary for browser WASM search
 *
 * Reads: .ruvector/knowledge-base/vectors.bin + metadata.json
 * Writes: src/ui/public/assets/knowledge-sq8.bin (quantized vectors)
 *         src/ui/public/assets/knowledge-sq8-params.bin (SQ min/max params)
 *         src/ui/public/assets/knowledge-meta.json.gz (metadata sidecar)
 *
 * The WASM runtime uses rvf_load_sq_params + rvf_dequant_i8 to dequantize at query time.
 *
 * Updated: 2026-03-02 22:00:00 EST | Version 1.0.0
 * Created: 2026-03-02
 */

import fs from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const DIMENSIONS = 384;
const SOURCE_DIR = path.resolve('.ruvector/knowledge-base');
const OUTPUT_DIR = path.resolve('src/ui/public/assets');

// --- MAGIC bytes for our quantized format ---
const MAGIC = Buffer.from('RVFSQ8\x00\x01'); // RVF Scalar Quantized 8-bit, version 1

console.log('=== RVF Scalar Quantization Build ===\n');

// --- Step 1: Load source vectors ---
console.log('Step 1: Loading source vectors...');
const manifest = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'manifest.json'), 'utf8'));
const vectorCount = manifest.vectorCount;
console.log(`  ${vectorCount} vectors, ${DIMENSIONS} dimensions`);

const vectorBuffer = fs.readFileSync(path.join(SOURCE_DIR, 'vectors.bin'));
const vectors = new Float32Array(vectorBuffer.buffer, vectorBuffer.byteOffset, vectorCount * DIMENSIONS);
console.log(`  Loaded ${(vectorBuffer.length / 1024 / 1024).toFixed(1)} MB of float32 vectors`);

// --- Step 2: Compute per-dimension min/max (SQ parameters) ---
console.log('\nStep 2: Computing scalar quantization parameters...');
const dimMin = new Float32Array(DIMENSIONS).fill(Infinity);
const dimMax = new Float32Array(DIMENSIONS).fill(-Infinity);

for (let i = 0; i < vectorCount; i++) {
  const offset = i * DIMENSIONS;
  for (let d = 0; d < DIMENSIONS; d++) {
    const val = vectors[offset + d];
    if (val < dimMin[d]) dimMin[d] = val;
    if (val > dimMax[d]) dimMax[d] = val;
  }
  if ((i + 1) % 25000 === 0) {
    console.log(`  Scanned ${i + 1}/${vectorCount} vectors...`);
  }
}
console.log('  Min/max computed for all dimensions');

// Compute range (avoid division by zero)
const dimRange = new Float32Array(DIMENSIONS);
for (let d = 0; d < DIMENSIONS; d++) {
  dimRange[d] = dimMax[d] - dimMin[d];
  if (dimRange[d] === 0) dimRange[d] = 1; // prevent div/0 for constant dimensions
}

// --- Step 3: Quantize f32 → uint8 ---
console.log('\nStep 3: Quantizing vectors (f32 → uint8)...');
const quantized = new Uint8Array(vectorCount * DIMENSIONS);
const startTime = Date.now();

for (let i = 0; i < vectorCount; i++) {
  const srcOffset = i * DIMENSIONS;
  const dstOffset = i * DIMENSIONS;
  for (let d = 0; d < DIMENSIONS; d++) {
    const normalized = (vectors[srcOffset + d] - dimMin[d]) / dimRange[d];
    quantized[dstOffset + d] = Math.round(Math.max(0, Math.min(1, normalized)) * 255);
  }
  if ((i + 1) % 25000 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  Quantized ${i + 1}/${vectorCount} (${elapsed}s)...`);
  }
}
console.log(`  Quantization complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

// --- Step 4: Write binary files ---
console.log('\nStep 4: Writing output files...');

// 4a: SQ params file (min + max per dimension, used by rvf_load_sq_params)
// Format: [MAGIC 8B][vectorCount u32][dimensions u32][dimMin f32×D][dimMax f32×D]
const paramsSize = 8 + 4 + 4 + DIMENSIONS * 4 * 2;
const paramsBuffer = Buffer.alloc(paramsSize);
let offset = 0;
MAGIC.copy(paramsBuffer, offset); offset += 8;
paramsBuffer.writeUInt32LE(vectorCount, offset); offset += 4;
paramsBuffer.writeUInt32LE(DIMENSIONS, offset); offset += 4;
Buffer.from(dimMin.buffer).copy(paramsBuffer, offset); offset += DIMENSIONS * 4;
Buffer.from(dimMax.buffer).copy(paramsBuffer, offset); offset += DIMENSIONS * 4;

const paramsPath = path.join(OUTPUT_DIR, 'knowledge-sq8-params.bin');
fs.writeFileSync(paramsPath, paramsBuffer);
console.log(`  SQ params: ${paramsPath} (${paramsBuffer.length} bytes)`);

// 4b: Quantized vectors file (raw uint8, no header — params file has the header)
const vectorsPath = path.join(OUTPUT_DIR, 'knowledge-sq8.bin');
fs.writeFileSync(vectorsPath, Buffer.from(quantized.buffer));
console.log(`  Vectors:   ${vectorsPath} (${quantized.length} bytes = ${(quantized.length / 1024 / 1024).toFixed(1)} MB)`);

// 4c: Gzip compress vectors
const gzVectorsPath = vectorsPath + '.gz';
await pipeline(
  Readable.from(Buffer.from(quantized.buffer)),
  createGzip({ level: 9 }),
  fs.createWriteStream(gzVectorsPath)
);
const gzSize = fs.statSync(gzVectorsPath).size;
console.log(`  Gzipped:   ${gzVectorsPath} (${(gzSize / 1024 / 1024).toFixed(1)} MB)`);

// 4d: Gzip compress params too
const gzParamsPath = paramsPath + '.gz';
await pipeline(
  Readable.from(paramsBuffer),
  createGzip({ level: 9 }),
  fs.createWriteStream(gzParamsPath)
);
const gzParamsSize = fs.statSync(gzParamsPath).size;
console.log(`  GZ params: ${gzParamsPath} (${gzParamsSize} bytes)`);

// --- Step 5: Load and compress metadata ---
console.log('\nStep 5: Building metadata index...');
const metadataRaw = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'metadata.json'), 'utf8'));
const rawIdIndex = metadataRaw.idIndex;
// Handle both array and object formats from different build scripts
const idIndex = Array.isArray(rawIdIndex)
  ? rawIdIndex
  : Object.keys(rawIdIndex).sort((a, b) => Number(a) - Number(b)).map(k => rawIdIndex[k]);
const metadataMap = metadataRaw.metadata || metadataRaw.metadataIndex || {};

// Build a compact metadata array: [{id, title, category, quality_score}]
const compactMeta = idIndex.map((id) => {
  const m = metadataMap[id] || {};
  return {
    id,
    t: m.title ? String(m.title).substring(0, 200) : '',
    c: m.category || '',
    q: m.quality_score != null ? Number(m.quality_score) : 0,
    k: m.knowledge_type || '',
    p: m.package_name || '',
  };
});

const metaJson = JSON.stringify(compactMeta);
const metaPath = path.join(OUTPUT_DIR, 'knowledge-meta.json');
fs.writeFileSync(metaPath, metaJson);
console.log(`  Metadata:  ${metaPath} (${(metaJson.length / 1024 / 1024).toFixed(1)} MB)`);

const gzMetaPath = metaPath + '.gz';
await pipeline(
  Readable.from(Buffer.from(metaJson)),
  createGzip({ level: 9 }),
  fs.createWriteStream(gzMetaPath)
);
const gzMetaSize = fs.statSync(gzMetaPath).size;
console.log(`  GZ meta:   ${gzMetaPath} (${(gzMetaSize / 1024 / 1024).toFixed(1)} MB)`);

// --- Step 6: Verification ---
console.log('\nStep 6: Verification...');
// Dequantize a random vector and compare with original
const testIdx = Math.floor(Math.random() * vectorCount);
const origVec = vectors.slice(testIdx * DIMENSIONS, (testIdx + 1) * DIMENSIONS);
const quantVec = quantized.slice(testIdx * DIMENSIONS, (testIdx + 1) * DIMENSIONS);

// Dequantize
const dequantVec = new Float32Array(DIMENSIONS);
for (let d = 0; d < DIMENSIONS; d++) {
  dequantVec[d] = dimMin[d] + (quantVec[d] / 255) * dimRange[d];
}

// Compute cosine similarity between original and dequantized
let dotProd = 0, normA = 0, normB = 0;
for (let d = 0; d < DIMENSIONS; d++) {
  dotProd += origVec[d] * dequantVec[d];
  normA += origVec[d] * origVec[d];
  normB += dequantVec[d] * dequantVec[d];
}
const cosineSim = dotProd / (Math.sqrt(normA) * Math.sqrt(normB));
console.log(`  Test vector ${testIdx}: cosine similarity = ${cosineSim.toFixed(6)} (1.0 = perfect)`);

// --- Summary ---
const rawSize = vectorBuffer.length;
const totalCompressed = gzSize + gzParamsSize + gzMetaSize;
const totalUncompressed = quantized.length + paramsBuffer.length + metaJson.length;

console.log('\n=== Build Complete ===');
console.log(`  Source (f32):       ${(rawSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Quantized (uint8):  ${(quantized.length / 1024 / 1024).toFixed(1)} MB (4x compression)`);
console.log(`  + SQ params:        ${paramsBuffer.length} bytes`);
console.log(`  + Metadata:         ${(metaJson.length / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Total uncompressed: ${(totalUncompressed / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Total gzipped:      ${(totalCompressed / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Overall ratio:      ${((1 - totalCompressed / rawSize) * 100).toFixed(1)}% reduction from raw f32`);
console.log(`  Quality:            ${cosineSim.toFixed(4)} cosine similarity (>0.99 = excellent)`);
console.log('');
console.log('Output files:');
console.log(`  ${gzVectorsPath}`);
console.log(`  ${gzParamsPath}`);
console.log(`  ${gzMetaPath}`);
