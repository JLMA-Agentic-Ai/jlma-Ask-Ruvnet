#!/usr/bin/env node
/**
 * Fix RVF KB entry embeddings using ONNX local model
 * Targets ask_ruvnet.kb_complete IDs 73-83
 */
import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres', max: 2
});

async function getEmbedder() {
  const { pipeline } = await import('@xenova/transformers');
  return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
}

async function embed(embedder, text) {
  const out = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

async function main() {
  console.log('Loading ONNX model...');
  const embedder = await getEmbedder();
  console.log('Model loaded. Fetching entries 73-83...');

  const { rows } = await pool.query(
    `SELECT id, title, LEFT(content, 1400) as content FROM ask_ruvnet.kb_complete WHERE id BETWEEN 73 AND 83 ORDER BY id`
  );

  console.log(`Processing ${rows.length} entries...`);

  for (const row of rows) {
    const text = (row.title + ' ' + row.content).substring(0, 1500);
    const vec = await embed(embedder, text);
    const vecStr = '[' + vec.join(',') + ']';

    await pool.query(
      `UPDATE ask_ruvnet.kb_complete SET embedding = $1::ruvector, updated_at = NOW() WHERE id = $2`,
      [vecStr, row.id]
    );
    console.log(`  [${row.id}] ${row.title.substring(0, 60)}... (${vec.length}d)`);
  }

  // Verify diversity
  const check = await pool.query(
    `SELECT id, LEFT(embedding::text, 30) as prefix FROM ask_ruvnet.kb_complete WHERE id BETWEEN 73 AND 83`
  );
  const unique = new Set(check.rows.map(r => r.prefix)).size;
  console.log(`\nEmbedding diversity: ${unique} unique prefixes out of ${check.rows.length} entries`);
  console.log(unique === check.rows.length ? 'All embeddings are unique!' : 'WARNING: Some duplicates remain');

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
