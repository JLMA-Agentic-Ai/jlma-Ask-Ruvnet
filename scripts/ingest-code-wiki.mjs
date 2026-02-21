#!/usr/bin/env node
/**
 * Code Wiki Ingestion Script (ESM)
 * Reads large markdown files from Code-Wiki/, chunks by headings,
 * embeds via ONNX (@claude-flow/embeddings), and inserts into
 * ask_ruvnet.architecture_docs with ruvector(384) embeddings.
 *
 * Usage: node scripts/ingest-code-wiki.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const CODE_WIKI_DIR = path.join(__dirname, '..', 'Code-Wiki');
const SCHEMA = 'ask_ruvnet';
const TABLE = 'architecture_docs';
const MAX_CONTENT_CHARS = 1500;
const EMBED_BATCH_SIZE = 50;

const FILES = {
  'OpenClaw-code-wikki.md': 'openclaw',
  'claude-flow-code-wikki.md': 'agents',
  'ruvector-code-wikki.md': 'vector-db',
};

const pool = new pg.Pool({
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  password: '',
  database: 'postgres',
  max: 4,
});

// --- Heading-based chunking ---

/**
 * Parse markdown into chunks split by ## or ### headings.
 * Each chunk carries a breadcrumb title built from parent headings.
 */
function chunkByHeadings(markdown, source, category) {
  const lines = markdown.split('\n');
  const chunks = [];

  // Track the current heading hierarchy: level -> heading text
  // e.g. { 1: 'Main Title', 2: 'Section', 3: 'Subsection' }
  const hierarchy = {};
  let currentLevel = 0;
  let currentContent = [];
  let currentTitle = '';

  function buildBreadcrumb(level) {
    const parts = [];
    for (let l = 1; l <= level; l++) {
      if (hierarchy[l]) parts.push(hierarchy[l]);
    }
    return parts.join(' > ');
  }

  function flushChunk() {
    const text = currentContent.join('\n').trim();
    if (text.length < 30) return; // skip trivially small chunks
    // Truncate to MAX_CONTENT_CHARS
    const content = text.length > MAX_CONTENT_CHARS
      ? text.slice(0, MAX_CONTENT_CHARS) + '\n...[truncated]'
      : text;
    chunks.push({
      title: currentTitle || source,
      content,
      source,
      category,
    });
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // Only split on ## or ### (levels 2 and 3)
      if (level === 2 || level === 3) {
        // Flush the previous chunk
        flushChunk();
        currentContent = [];

        // Update hierarchy: set this level's heading and clear deeper levels
        hierarchy[level] = headingText;
        for (let l = level + 1; l <= 6; l++) delete hierarchy[l];

        currentLevel = level;
        currentTitle = buildBreadcrumb(level);

        // Include the heading line in the chunk content
        currentContent.push(line);
      } else if (level === 1) {
        // Track # headings for breadcrumb context but don't split on them
        hierarchy[1] = headingText;
        for (let l = 2; l <= 6; l++) delete hierarchy[l];
        currentContent.push(line);
      } else {
        // Level 4-6: just include in current chunk
        currentContent.push(line);
      }
    } else {
      currentContent.push(line);
    }
  }
  // Flush the last chunk
  flushChunk();

  return chunks;
}

// --- Main ---

async function main() {
  console.log('=== Code Wiki Ingestion (ONNX + ruvector) ===\n');

  // 1. Read and chunk all files
  const allChunks = [];
  for (const [filename, category] of Object.entries(FILES)) {
    const filePath = path.join(CODE_WIKI_DIR, filename);
    console.log(`Reading ${filename}...`);
    const markdown = await fs.readFile(filePath, 'utf-8');
    const lines = markdown.split('\n').length;
    const chunks = chunkByHeadings(markdown, filename, category);
    console.log(`  ${lines} lines -> ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }
  console.log(`\nTotal chunks: ${allChunks.length}\n`);

  // 2. Initialize ONNX embedding service
  console.log('Loading ONNX embedding model...');
  const embeddingsPath = '/Users/stuartkerr/.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js';
  const mod = await import(embeddingsPath);
  const svc = await mod.createEmbeddingServiceAsync({
    provider: 'transformers',
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
  });
  // Warm up
  await svc.embed('warmup');
  console.log('ONNX model ready.\n');

  // 3. Embed in batches
  console.log(`Embedding ${allChunks.length} chunks in batches of ${EMBED_BATCH_SIZE}...`);
  const embeddings = [];
  const startTime = Date.now();

  for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map(c => c.title + '\n' + c.content);
    const result = await svc.embedBatch(texts);
    for (const item of result.embeddings) {
      embeddings.push(item.embedding || item);
    }
    const done = Math.min(i + EMBED_BATCH_SIZE, allChunks.length);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  [${elapsed}s] Embedded ${done}/${allChunks.length}`);
  }
  console.log(`Embedding complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);

  // 4. Insert into PostgreSQL
  console.log('Inserting into PostgreSQL...');
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const vec = embeddings[i];
    if (!vec || vec.length !== 384) {
      console.warn(`  Skipping chunk ${i}: bad embedding (length=${vec?.length})`);
      errors++;
      continue;
    }

    const docId = `code-wiki-${chunk.source.replace(/\.md$/, '')}-${i}`;
    const vecStr = '[' + Array.from(vec).join(',') + ']';
    const filePath = chunk.source; // relative from Code-Wiki/

    // Generate a simple hash for file_hash (required NOT NULL)
    const fileHash = docId;

    try {
      await pool.query(
        `INSERT INTO ${SCHEMA}.${TABLE} (doc_id, title, content, category, embedding, file_path, file_hash, doc_type, section_header, section_index, quality_score, is_duplicate)
         VALUES ($1, $2, $3, $4, $5::ruvector(384), $6, $7, $8, $9, $10, $11, false)
         ON CONFLICT (doc_id) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           category = EXCLUDED.category,
           embedding = EXCLUDED.embedding,
           file_path = EXCLUDED.file_path,
           doc_type = EXCLUDED.doc_type,
           section_header = EXCLUDED.section_header,
           section_index = EXCLUDED.section_index,
           updated_at = NOW()`,
        [docId, chunk.title, chunk.content, chunk.category, vecStr, filePath, fileHash, 'code-wiki', chunk.title, i, 85]
      );
      inserted++;
    } catch (err) {
      console.error(`  Error on chunk ${i} (${docId}): ${err.message}`);
      errors++;
    }

    // Progress every 100 rows
    if ((i + 1) % 100 === 0 || i === allChunks.length - 1) {
      console.log(`  Inserted ${inserted}/${i + 1} (${errors} errors)`);
    }
  }

  // 5. Final report
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Done ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors:   ${errors}`);
  console.log(`Total:    ${allChunks.length} chunks from ${Object.keys(FILES).length} files`);
  console.log(`Time:     ${totalTime}s`);

  // Verify count
  const res = await pool.query(
    `SELECT COUNT(*) FROM ${SCHEMA}.${TABLE} WHERE doc_id LIKE 'code-wiki-%'`
  );
  console.log(`DB rows with code-wiki prefix: ${res.rows[0].count}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  pool.end().catch(() => {});
  process.exit(1);
});
