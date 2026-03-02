#!/usr/bin/env node
/**
 * Export PostgreSQL KB → RuvectorStore Binary Format (Resumable)
 *
 * Exports entries from Docker PostgreSQL into RuvectorStore binary format.
 * Uses fresh DB connections per batch to avoid idle timeouts.
 * Supports resume — skips already-exported IDs.
 *
 * Usage: node scripts/export-to-ruvectorstore.mjs [--fresh]
 */

import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRESH = process.argv.includes('--fresh');

const { PersistentVectorDB } = await import(path.join(PROJECT_ROOT, 'src/storage/index.js'));

const BATCH_SIZE = 200;
const DIMENSIONS = 384;
const DB_CONFIG = {
  host: 'localhost', port: 5435, user: 'postgres', database: 'postgres', max: 2,
  idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000,
};

function parseEmbedding(str) {
  if (!str) return null;
  try {
    const vals = str.replace(/^\[/, '').replace(/\]$/, '').split(',').map(Number);
    if (vals.some(isNaN) || vals.length !== DIMENSIONS) return null;
    return new Float32Array(vals);
  } catch { return null; }
}

async function queryBatch(sql, params) {
  const pool = new pg.Pool(DB_CONFIG);
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } finally {
    await pool.end();
  }
}

async function run() {
  console.log('=== PostgreSQL → RuvectorStore Export (Resumable) ===\n');

  const dbPath = path.join(PROJECT_ROOT, '.ruvector', 'knowledge-base');

  if (FRESH && fs.existsSync(dbPath)) {
    console.log('  Clearing existing export...');
    fs.rmSync(dbPath, { recursive: true });
  }

  const db = new PersistentVectorDB({
    path: dbPath, dimensions: DIMENSIONS, distanceMetric: 'Cosine',
    saveIntervalMs: 10000, useWAL: true,
  });
  await db.initialize();

  const existingCount = db.getStats().vectorCount;
  console.log(`  Existing vectors: ${existingCount.toLocaleString()}`);

  // Get existing IDs to skip
  const existingIds = new Set();
  if (existingCount > 0) {
    const allMeta = db.getAllMetadata();
    for (const e of allMeta) existingIds.add(e.id);
  }

  // Count totals
  const counts = await queryBatch(`
    SELECT
      (SELECT count(*) FROM ask_ruvnet.architecture_docs WHERE is_duplicate = false AND embedding IS NOT NULL) as arch,
      (SELECT count(*) FROM ask_ruvnet.kb_complete WHERE embedding IS NOT NULL) as kb
  `);
  const archCount = parseInt(counts[0].arch);
  const kbCount = parseInt(counts[0].kb);
  console.log(`  Total to export: ${(archCount + kbCount).toLocaleString()} (${archCount} arch + ${kbCount} kb)\n`);

  let exported = existingCount;
  let skipped = 0;
  const startTime = Date.now();

  // Export kb_complete
  if (!existingIds.has('kb_1')) {
    console.log('[1/2] Exporting kb_complete...');
    const kbRows = await queryBatch(
      `SELECT id, title, content, category, quality_score, embedding::text
       FROM ask_ruvnet.kb_complete WHERE embedding IS NOT NULL ORDER BY id`
    );
    for (const r of kbRows) {
      const id = `kb_${r.id}`;
      if (existingIds.has(id)) { skipped++; continue; }
      const emb = parseEmbedding(r.embedding);
      if (!emb) continue;
      await db.insert({ id, vector: emb, metadata: {
        content: r.content, title: r.title, category: r.category,
        quality_score: r.quality_score, source: 'kb_complete',
        knowledge_type: 'teaching', is_curated: true,
        timestamp: new Date().toISOString(),
      }});
      exported++;
    }
    console.log(`  kb_complete: ${kbRows.length} entries`);
  } else {
    console.log('[1/2] kb_complete already exported, skipping');
  }

  // Export architecture_docs in batches
  console.log('[2/2] Exporting architecture_docs...');
  let lastId = 0;

  // Find the highest already-exported arch ID to resume from
  for (const id of existingIds) {
    if (id.startsWith('arch_')) {
      const num = parseInt(id.substring(5));
      if (num > lastId) lastId = num;
    }
  }
  if (lastId > 0) console.log(`  Resuming from id > ${lastId}`);

  let batchNum = 0;
  while (true) {
    let rows;
    try {
      rows = await queryBatch(
        `SELECT id, title, content, package_name, doc_type, category,
                knowledge_type, quality_score, triage_tier, source_authority,
                topics, concepts, expertise_level, summary, embedding::text
         FROM ask_ruvnet.architecture_docs
         WHERE is_duplicate = false AND embedding IS NOT NULL AND id > $1
         ORDER BY id LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
    } catch (e) {
      console.error(`  DB error, retrying in 2s: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    if (rows.length === 0) break;

    for (const r of rows) {
      const id = `arch_${r.id}`;
      lastId = r.id;
      if (existingIds.has(id)) { skipped++; continue; }
      const emb = parseEmbedding(r.embedding);
      if (!emb) continue;
      await db.insert({ id, vector: emb, metadata: {
        content: r.content, title: r.title, package_name: r.package_name,
        doc_type: r.doc_type, category: r.category, knowledge_type: r.knowledge_type,
        quality_score: r.quality_score, triage_tier: r.triage_tier,
        source_authority: r.source_authority, topics: r.topics,
        concepts: r.concepts, expertise_level: r.expertise_level,
        summary: r.summary, source: 'architecture_docs', is_curated: false,
        timestamp: new Date().toISOString(),
      }});
      exported++;
    }

    batchNum++;
    if (batchNum % 20 === 0) {
      await db.flush();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const total = archCount + kbCount;
      const pct = ((exported / total) * 100).toFixed(1);
      console.log(`  [${exported.toLocaleString()}/${total.toLocaleString()}] ${pct}% (${elapsed}s)`);
    }
  }

  await db.flush();
  const stats = db.getStats();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n=== EXPORT COMPLETE ===`);
  console.log(`  Vectors: ${stats.vectorCount.toLocaleString()}`);
  console.log(`  Skipped (already existed): ${skipped}`);
  console.log(`  Time: ${elapsed}s`);
  console.log(`  Path: ${stats.path}`);

  process.exit(0);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
