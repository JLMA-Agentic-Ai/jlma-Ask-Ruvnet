#!/usr/bin/env node
/**
 * create-gold-rvf.mjs
 *
 * Extracts gold/curated entries from the full knowledge base and produces
 * browser-ready assets:
 *
 *   gold-knowledge.bin   — binary: header + Float32 vectors + JSON id-list
 *   gold-content.json    — {id: {title, content, category, quality_score}}
 *
 * Gold criteria: is_curated === true  OR  quality_score >= 90
 *
 * Binary format (little-endian):
 *   [0..3]   uint32  magic   0x476F6C64 ("Gold")
 *   [4..5]   uint16  version 1
 *   [6..9]   uint32  count   number of vectors
 *   [10..11] uint16  dim     vector dimensionality (384)
 *   [12..15] uint32  idsLen  byte-length of the trailing JSON id array
 *   [16 .. 16 + count*dim*4 - 1]  Float32[]  packed vectors
 *   [16 + count*dim*4 .. end]      UTF-8 JSON string[] of ids (same order)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { gunzipSync, gzipSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Configuration ───────────────────────────────────────────────────────────
const SIDECAR_PATH    = join(ROOT, 'content-sidecar.json.gz');
const VECTORS_PATH    = join(ROOT, '.ruvector', 'knowledge-base', 'vectors.bin');
const METADATA_PATH   = join(ROOT, '.ruvector', 'knowledge-base', 'metadata.json');
const MANIFEST_PATH   = join(ROOT, '.ruvector', 'knowledge-base', 'manifest.json');
const OUTPUT_DIR      = join(ROOT, 'src', 'ui', 'public', 'assets');

const QUALITY_THRESHOLD = 90;
const MAGIC = 0x476F6C64; // "Gold"
const FORMAT_VERSION = 1;

// ── Step 1: Load manifest to confirm dimensions ────────────────────────────
console.log('[1/6] Loading manifest...');
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
const DIM = manifest.dimensions;
const BYTES_PER_VECTOR = DIM * 4; // Float32
console.log(`      Dimensions: ${DIM}, Total vectors: ${manifest.vectorCount}`);

// ── Step 2: Load sidecar and filter gold entries ────────────────────────────
console.log('[2/6] Loading content sidecar...');
const sidecar = JSON.parse(gunzipSync(readFileSync(SIDECAR_PATH)).toString());
const allEntries = Object.entries(sidecar);
console.log(`      Total sidecar entries: ${allEntries.length}`);

const goldEntries = allEntries.filter(([_id, entry]) =>
  entry.is_curated === true ||
  (entry.quality_score !== undefined && entry.quality_score >= QUALITY_THRESHOLD)
);
console.log(`      Gold entries (curated OR quality >= ${QUALITY_THRESHOLD}): ${goldEntries.length}`);

const goldIds = new Set(goldEntries.map(([id]) => id));

// ── Step 3: Build reverse index  (string-id -> numeric-offset) ─────────────
console.log('[3/6] Loading metadata index...');
const metadata = JSON.parse(readFileSync(METADATA_PATH, 'utf-8'));
const reverseIndex = new Map();
for (const [numIdx, strId] of Object.entries(metadata.idIndex)) {
  reverseIndex.set(strId, parseInt(numIdx, 10));
}
console.log(`      Index entries: ${reverseIndex.size}`);

// Verify every gold ID has a vector offset
let missingCount = 0;
for (const id of goldIds) {
  if (!reverseIndex.has(id)) {
    missingCount++;
    console.warn(`      WARNING: gold ID "${id}" not found in vector index`);
  }
}
if (missingCount > 0) {
  console.warn(`      ${missingCount} gold IDs missing from vector index — they will be skipped`);
}

// ── Step 4: Extract vectors from vectors.bin ────────────────────────────────
console.log('[4/6] Extracting gold vectors from vectors.bin...');
const vectorsBuf = readFileSync(VECTORS_PATH);
console.log(`      vectors.bin size: ${(vectorsBuf.length / 1024 / 1024).toFixed(1)} MB`);

// Collect gold vectors in insertion order (same order as goldEntries)
const orderedIds = [];
const vectorChunks = [];

for (const [id] of goldEntries) {
  const offset = reverseIndex.get(id);
  if (offset === undefined) continue;

  const byteStart = offset * BYTES_PER_VECTOR;
  const byteEnd = byteStart + BYTES_PER_VECTOR;

  if (byteEnd > vectorsBuf.length) {
    console.warn(`      WARNING: vector for "${id}" at offset ${offset} exceeds file bounds — skipping`);
    continue;
  }

  orderedIds.push(id);
  vectorChunks.push(vectorsBuf.subarray(byteStart, byteEnd));
}

const count = orderedIds.length;
console.log(`      Extracted ${count} vectors (${(count * BYTES_PER_VECTOR / 1024 / 1024).toFixed(1)} MB raw)`);

// ── Step 5: Build binary file ───────────────────────────────────────────────
console.log('[5/6] Building gold-knowledge.bin...');

const idsJson = Buffer.from(JSON.stringify(orderedIds), 'utf-8');
const HEADER_SIZE = 16;
const vectorsSize = count * BYTES_PER_VECTOR;
const totalSize = HEADER_SIZE + vectorsSize + idsJson.length;

const outBuf = Buffer.alloc(totalSize);

// Header
outBuf.writeUInt32LE(MAGIC, 0);
outBuf.writeUInt16LE(FORMAT_VERSION, 4);
outBuf.writeUInt32LE(count, 6);
outBuf.writeUInt16LE(DIM, 10);
outBuf.writeUInt32LE(idsJson.length, 12);

// Vectors (copy each chunk sequentially)
let writeOffset = HEADER_SIZE;
for (const chunk of vectorChunks) {
  chunk.copy(outBuf, writeOffset);
  writeOffset += BYTES_PER_VECTOR;
}

// ID list JSON
idsJson.copy(outBuf, writeOffset);

// Write raw binary
mkdirSync(OUTPUT_DIR, { recursive: true });
const binPath = join(OUTPUT_DIR, 'gold-knowledge.bin');
writeFileSync(binPath, outBuf);
console.log(`      Wrote ${binPath}`);
console.log(`      Raw size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// Also write gzipped version for CDN/browser fetch with Accept-Encoding
const gzBuf = gzipSync(outBuf, { level: 9 });
const gzPath = join(OUTPUT_DIR, 'gold-knowledge.bin.gz');
writeFileSync(gzPath, gzBuf);
console.log(`      Gzipped size: ${(gzBuf.length / 1024 / 1024).toFixed(2)} MB`);

// ── Step 6: Build content JSON ──────────────────────────────────────────────
console.log('[6/6] Building gold-content.json...');

const contentMap = {};
for (const id of orderedIds) {
  const entry = sidecar[id];
  contentMap[id] = {
    title: entry.title,
    content: entry.content,
    category: entry.category,
    quality_score: entry.quality_score,
  };
}

const contentJson = JSON.stringify(contentMap);
const contentPath = join(OUTPUT_DIR, 'gold-content.json');
writeFileSync(contentPath, contentJson);
console.log(`      Wrote ${contentPath}`);
console.log(`      Size: ${(contentJson.length / 1024 / 1024).toFixed(2)} MB`);

// Gzipped content for browser fetch
const contentGz = gzipSync(Buffer.from(contentJson), { level: 9 });
const contentGzPath = join(OUTPUT_DIR, 'gold-content.json.gz');
writeFileSync(contentGzPath, contentGz);
console.log(`      Gzipped size: ${(contentGz.length / 1024 / 1024).toFixed(2)} MB`);

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n=== Gold-Lite Build Complete ===');
console.log(`  Entries:    ${count}`);
console.log(`  Dimensions: ${DIM}`);
console.log(`  Binary:     ${(outBuf.length / 1024 / 1024).toFixed(2)} MB  (gz: ${(gzBuf.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  Content:    ${(contentJson.length / 1024 / 1024).toFixed(2)} MB  (gz: ${(contentGz.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  Total gz:   ${((gzBuf.length + contentGz.length) / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Output dir: ${OUTPUT_DIR}`);
