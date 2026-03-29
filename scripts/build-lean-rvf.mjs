#!/usr/bin/env node
/**
 * build-lean-rvf.mjs — Build a lean production RVF from kb_complete only
 *
 * Exports ONLY the curated gold entries (353 entries, ~2-5MB total)
 * Skips architecture_docs (252K entries, 1.5GB) — those are reference only.
 *
 * Outputs:
 *   .ruvector/knowledge-base/  — vectors.bin + metadata.json + manifest.json
 *   content-sidecar.json.gz    — text content keyed by ID
 *   knowledge.rvf              — single RVF container (HNSW indexed)
 *
 * Usage: node scripts/build-lean-rvf.mjs
 */

import pg from 'pg';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DIMENSIONS = 384;
const BYTES_PER_VECTOR = DIMENSIONS * 4;
const DB_CONFIG = {
  host: 'localhost', port: 5435, user: 'postgres', database: 'postgres',
  max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000,
};

function parseEmbedding(str) {
  if (!str) return null;
  try {
    const vals = str.replace(/^\[/, '').replace(/\]$/, '').split(',').map(Number);
    if (vals.some(isNaN) || vals.length !== DIMENSIONS) return null;
    return new Float32Array(vals);
  } catch { return null; }
}

console.log('=== Lean RVF Build (Gold Curated Only) ===\n');

// ── Step 1: Query kb_complete from PostgreSQL ────────────────────────
console.log('[1/4] Querying kb_complete from PostgreSQL...');
const pool = new pg.Pool(DB_CONFIG);

const { rows } = await pool.query(`
  SELECT id, title, content, category, quality_score, embedding::text
  FROM ask_ruvnet.kb_complete
  WHERE embedding IS NOT NULL
  ORDER BY id
`);
await pool.end();

console.log(`      Found ${rows.length} entries with embeddings`);

// ── Step 2: Write .ruvector/ binary format ───────────────────────────
console.log('[2/4] Writing .ruvector/ binary format...');

const outDir = path.join(ROOT, '.ruvector', 'knowledge-base');
fs.mkdirSync(outDir, { recursive: true });

// Build vectors buffer and metadata
const vectorsBuf = Buffer.alloc(rows.length * BYTES_PER_VECTOR);
const idIndex = {};
const sidecar = {};

let written = 0;
for (const row of rows) {
  const emb = parseEmbedding(row.embedding);
  if (!emb) {
    console.warn(`      Skipping id=${row.id} — invalid embedding`);
    continue;
  }

  const id = `kb_${row.id}`;
  const offset = written * BYTES_PER_VECTOR;
  Buffer.from(emb.buffer).copy(vectorsBuf, offset);

  idIndex[written] = id;
  sidecar[id] = {
    title: row.title,
    content: row.content,
    category: row.category,
    quality_score: row.quality_score,
    is_curated: true,
    source: 'kb_complete',
    knowledge_type: 'teaching',
  };
  written++;
}

// Trim vectors buffer to actual written count
const finalVectors = vectorsBuf.subarray(0, written * BYTES_PER_VECTOR);

// Write vectors.bin
fs.writeFileSync(path.join(outDir, 'vectors.bin'), finalVectors);
console.log(`      vectors.bin: ${(finalVectors.length / 1024).toFixed(0)} KB (${written} vectors)`);

// Write metadata.json
const metadata = { idIndex, metadataIndex: {} };
for (const [idx, id] of Object.entries(idIndex)) {
  metadata.metadataIndex[idx] = sidecar[id];
}
fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata));
console.log(`      metadata.json written`);

// Write manifest.json
const manifest = {
  vectorCount: written,
  dimensions: DIMENSIONS,
  distanceMetric: 'Cosine',
  createdAt: new Date().toISOString(),
  source: 'lean-gold-build',
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`      manifest.json: ${written} vectors, ${DIMENSIONS}D`);

// ── Step 3: Write content-sidecar.json.gz ────────────────────────────
console.log('[3/4] Writing content-sidecar.json.gz...');
const sidecarJson = JSON.stringify(sidecar);
const sidecarGz = zlib.gzipSync(Buffer.from(sidecarJson), { level: 9 });
fs.writeFileSync(path.join(ROOT, 'content-sidecar.json.gz'), sidecarGz);
console.log(`      content-sidecar.json.gz: ${(sidecarGz.length / 1024).toFixed(0)} KB (${written} entries)`);

// ── Step 4: Convert to RVF ───────────────────────────────────────────
console.log('[4/4] Converting to knowledge.rvf...');

try {
  const { RvfDatabase } = await import('@ruvector/rvf');
  const rvfPath = path.join(ROOT, 'knowledge.rvf');

  // Remove old RVF if exists
  if (fs.existsSync(rvfPath)) fs.unlinkSync(rvfPath);

  const db = await RvfDatabase.create(rvfPath, {
    dimensions: DIMENSIONS,
    metric: 'cosine',
  });

  // Insert vectors WITH payload (content embedded in RVF)
  const encoder = new TextEncoder();
  const BATCH = 100;
  for (let i = 0; i < written; i += BATCH) {
    const end = Math.min(i + BATCH, written);
    const batch = [];
    for (let j = i; j < end; j++) {
      const id = idIndex[j];
      const vecStart = j * BYTES_PER_VECTOR;
      const vec = new Float32Array(finalVectors.buffer, finalVectors.byteOffset + vecStart, DIMENSIONS);
      // Encode content as Uint8Array payload — stored INSIDE the RVF container
      const payloadJson = JSON.stringify(sidecar[id]);
      const payload = encoder.encode(payloadJson);
      batch.push({ id, vector: Array.from(vec), payload });
    }
    await db.ingestBatch(batch);
  }

  // Log witness chain and file identity for integrity verification
  try {
    const { RvfSolver } = await import('@ruvector/rvf');
    const solver = new RvfSolver(db);
    const witness = solver.witnessChain();
    console.log(`      Witness chain: ${JSON.stringify(witness).substring(0, 120)}...`);
    solver.destroy();
  } catch (e) {
    console.log(`      Witness chain: not available (${e.message})`);
  }

  const fid = await db.fileId();
  console.log(`      File ID: ${fid}`);
  console.log(`      Lineage depth: ${await db.lineageDepth()}`);

  await db.close();

  const rvfSize = fs.statSync(rvfPath).size;
  console.log(`      knowledge.rvf: ${(rvfSize / 1024 / 1024).toFixed(1)} MB`);
} catch (err) {
  console.error(`      RVF conversion failed: ${err.message}`);
  console.log('      Falling back — knowledge.rvf not updated');
  console.log('      The content-sidecar.json.gz is still valid for text search');
}

// ── Summary ──────────────────────────────────────────────────────────
const rvfSize = fs.existsSync(path.join(ROOT, 'knowledge.rvf'))
  ? fs.statSync(path.join(ROOT, 'knowledge.rvf')).size
  : 0;

console.log('\n=== Lean RVF Build Complete ===');
console.log(`  Gold entries:      ${written}`);
console.log(`  Vectors:           ${(finalVectors.length / 1024).toFixed(0)} KB`);
console.log(`  Content sidecar:   ${(sidecarGz.length / 1024).toFixed(0)} KB (gzipped)`);
console.log(`  knowledge.rvf:     ${rvfSize > 0 ? (rvfSize / 1024 / 1024).toFixed(1) + ' MB' : 'not built'}`);
console.log(`  Total:             ${((finalVectors.length + sidecarGz.length + rvfSize) / 1024 / 1024).toFixed(1)} MB`);
console.log('');
console.log('Next: Remove LFS tracking, push, and deploy');
