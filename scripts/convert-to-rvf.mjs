/**
 * convert-to-rvf.mjs — Convert PersistentVectorDB data to RVF (RuVector Format)
 *
 * Reads: .ruvector/knowledge-base/vectors.bin + metadata.json
 * Writes: knowledge.rvf (single self-contained file with HNSW index)
 *
 * Usage:
 *   node scripts/convert-to-rvf.mjs [--output path] [--compression none|scalar|product]
 *
 * Updated: 2026-03-02 09:40:00 EST | Version 1.0.0
 * Created: 2026-03-02
 */

import { RvfDatabase } from '@ruvector/rvf';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
const DIMENSIONS = 384;
const BATCH_SIZE = 500;
const SOURCE_DIR = path.resolve('.ruvector/knowledge-base');
const DEFAULT_OUTPUT = 'knowledge.rvf';

// Parse CLI args
const args = process.argv.slice(2);
const outputIdx = args.indexOf('--output');
const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : DEFAULT_OUTPUT;
const compIdx = args.indexOf('--compression');
const compression = compIdx >= 0 ? args[compIdx + 1] : 'scalar';

console.log('=== RVF Conversion Tool ===');
console.log(`Source:      ${SOURCE_DIR}`);
console.log(`Output:      ${outputPath}`);
console.log(`Compression: ${compression}`);
console.log(`Dimensions:  ${DIMENSIONS}`);
console.log('');

// --- Step 1: Load source data ---
console.log('Step 1: Loading source data...');

const manifestPath = path.join(SOURCE_DIR, 'manifest.json');
const vectorsPath = path.join(SOURCE_DIR, 'vectors.bin');
const metadataPath = path.join(SOURCE_DIR, 'metadata.json');

if (!fs.existsSync(manifestPath) || !fs.existsSync(vectorsPath) || !fs.existsSync(metadataPath)) {
  console.error('ERROR: Source data not found at', SOURCE_DIR);
  console.error('Expected: manifest.json, vectors.bin, metadata.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log(`  Manifest: ${manifest.vectorCount} vectors, ${manifest.dimensions}D, metric=${manifest.distanceMetric}`);

if (manifest.dimensions !== DIMENSIONS) {
  console.error(`ERROR: Expected ${DIMENSIONS} dimensions, got ${manifest.dimensions}`);
  process.exit(1);
}

// Load vectors binary
const vectorBuffer = fs.readFileSync(vectorsPath);
const expectedBytes = manifest.vectorCount * DIMENSIONS * 4; // Float32 = 4 bytes
if (vectorBuffer.length !== expectedBytes) {
  console.error(`ERROR: Vector file size mismatch. Expected ${expectedBytes}, got ${vectorBuffer.length}`);
  process.exit(1);
}
const allVectors = new Float32Array(vectorBuffer.buffer, vectorBuffer.byteOffset, manifest.vectorCount * DIMENSIONS);
console.log(`  Vectors:  ${vectorBuffer.length} bytes loaded (${manifest.vectorCount} × ${DIMENSIONS} × 4)`);

// Load metadata
// Format: { idIndex: ["kb_1", "kb_2", ...], metadata: { "kb_1": {...}, "kb_2": {...} } }
console.log('  Loading metadata.json (this may take a moment for large files)...');
const metadataRaw = fs.readFileSync(metadataPath, 'utf8');
const metadataFile = JSON.parse(metadataRaw);
const idIndex = metadataFile.idIndex;  // Array of IDs in vector order
const metadataMap = metadataFile.metadata;  // Map of ID → metadata object
console.log(`  Metadata: ${idIndex.length} entries in idIndex, ${Object.keys(metadataMap).length} in metadata map`);

if (idIndex.length !== manifest.vectorCount) {
  console.warn(`  WARNING: idIndex count (${idIndex.length}) != vector count (${manifest.vectorCount})`);
}

// --- Step 2: Create RVF file ---
console.log('');
console.log('Step 2: Creating RVF file...');

// Remove existing output if present
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
  console.log(`  Removed existing ${outputPath}`);
}

const db = await RvfDatabase.create(outputPath, {
  dimensions: DIMENSIONS,
  metric: 'cosine',
  compression: compression,
  m: 16,
  efConstruction: 200,
});
console.log('  RVF database created');

// --- Step 3: Ingest in batches ---
console.log('');
console.log('Step 3: Ingesting vectors in batches...');

const totalEntries = idIndex.length;
const totalBatches = Math.ceil(totalEntries / BATCH_SIZE);
let totalAccepted = 0;
let totalRejected = 0;
const startTime = Date.now();

for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
  const batchStart = batchNum * BATCH_SIZE;
  const batchEnd = Math.min(batchStart + BATCH_SIZE, totalEntries);

  const entries = [];
  for (let i = batchStart; i < batchEnd; i++) {
    const entryId = idIndex[i];
    const meta = metadataMap[entryId] || {};
    const vectorOffset = i * DIMENSIONS;
    const vector = allVectors.slice(vectorOffset, vectorOffset + DIMENSIONS);

    // Extract useful metadata fields for RVF filter support
    // Note: RVF metadata values must be string | number | boolean
    const rvfMeta = {};
    if (meta.title) rvfMeta.title = String(meta.title).substring(0, 500);
    if (meta.quality_score != null) rvfMeta.quality_score = Number(meta.quality_score) || 0;
    if (meta.category) rvfMeta.category = String(meta.category);
    if (meta.knowledge_type) rvfMeta.knowledge_type = String(meta.knowledge_type);
    if (meta.package_name) rvfMeta.package_name = String(meta.package_name);
    if (meta.doc_type) rvfMeta.doc_type = String(meta.doc_type);
    if (meta.is_curated) rvfMeta.is_curated = true;
    if (meta.source_table) rvfMeta.source_table = String(meta.source_table);

    entries.push({
      id: String(entryId),
      vector,
      metadata: rvfMeta,
    });
  }

  try {
    const result = await db.ingestBatch(entries);
    totalAccepted += result.accepted;
    totalRejected += result.rejected;
  } catch (err) {
    console.error(`  ERROR in batch ${batchNum + 1}: ${err.message}`);
    totalRejected += entries.length;
  }

  // Progress every 10 batches
  if ((batchNum + 1) % 10 === 0 || batchNum === totalBatches - 1) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = (((batchNum + 1) / totalBatches) * 100).toFixed(1);
    const rate = ((totalAccepted + totalRejected) / ((Date.now() - startTime) / 1000)).toFixed(0);
    console.log(`  Batch ${batchNum + 1}/${totalBatches} (${pct}%) — ${totalAccepted} accepted, ${totalRejected} rejected — ${elapsed}s (${rate}/s)`);
  }
}

// --- Step 4: Finalize ---
console.log('');
console.log('Step 4: Finalizing...');

const status = await db.status();
console.log(`  Total vectors: ${status.totalVectors}`);
console.log(`  Total segments: ${status.totalSegments}`);
console.log(`  Epoch: ${status.epoch}`);

// Compact to reclaim any dead space
console.log('  Running compaction...');
const compResult = await db.compact();
console.log(`  Compacted: ${compResult.segmentsCompacted} segments, ${compResult.bytesReclaimed} bytes reclaimed`);

await db.close();

// --- Step 5: Report ---
const outputStat = fs.statSync(outputPath);
const sourceStat = fs.statSync(vectorsPath);
const metaStat = fs.statSync(metadataPath);
const sourceTotal = sourceStat.size + metaStat.size;
const compressionRatio = ((1 - outputStat.size / sourceTotal) * 100).toFixed(1);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('');
console.log('=== Conversion Complete ===');
console.log(`  Source size:     ${(sourceTotal / 1024 / 1024).toFixed(1)} MB (vectors.bin + metadata.json)`);
console.log(`  RVF size:        ${(outputStat.size / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Compression:     ${compressionRatio}% reduction`);
console.log(`  Vectors:         ${totalAccepted} accepted, ${totalRejected} rejected`);
console.log(`  Time:            ${elapsed}s`);
console.log(`  Output:          ${path.resolve(outputPath)}`);
console.log('');
console.log('Next steps:');
console.log('  1. Test: node -e "const {RvfDatabase}=require(\'@ruvector/rvf\');(async()=>{const db=await RvfDatabase.openReadonly(\'knowledge.rvf\');console.log(await db.status());await db.close()})()"');
console.log('  2. Replace split tarballs with single knowledge.rvf in git');
console.log('  3. Update app.js to use @ruvector/rvf instead of PersistentVectorDB');
