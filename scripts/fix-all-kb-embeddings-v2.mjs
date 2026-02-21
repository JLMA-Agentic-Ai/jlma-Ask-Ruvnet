#!/usr/bin/env node
/**
 * Fix ALL KB embeddings using ONNX local model
 * Replaces broken ruvector_embed() constant vectors with real semantic embeddings
 * Targets: ask_ruvnet.kb_complete (all entries with stale embeddings)
 */
import pg from 'pg';

const BATCH_SIZE = 10;

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
  console.log('=== KB Embedding Fix (ALL entries) ===');
  console.log('Loading ONNX model (Xenova/all-MiniLM-L6-v2)...');
  const embedder = await getEmbedder();
  console.log('Model loaded.\n');

  // Get ALL entries that need fixing (skip 73-83 which are already done)
  const { rows } = await pool.query(
    `SELECT id, title, LEFT(content, 1400) as content
     FROM ask_ruvnet.kb_complete
     WHERE id < 73
     ORDER BY id`
  );

  console.log(`Found ${rows.length} entries to re-embed.\n`);

  let done = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      try {
        const text = (row.title + ' ' + row.content).substring(0, 1500);
        const vec = await embed(embedder, text);
        const vecStr = '[' + vec.join(',') + ']';

        await pool.query(
          `UPDATE ask_ruvnet.kb_complete SET embedding = $1::ruvector, updated_at = NOW() WHERE id = $2`,
          [vecStr, row.id]
        );
        done++;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (done / (elapsed || 1)).toFixed(1);
        process.stdout.write(`\r  [${done}/${rows.length}] ${rate}/sec | ${row.title.substring(0, 55)}...`);
      } catch (err) {
        errors++;
        console.error(`\n  ERROR [${row.id}]: ${err.message}`);
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\nDone: ${done} updated, ${errors} errors in ${totalTime}s`);

  // Verify diversity
  const check = await pool.query(
    `SELECT COUNT(DISTINCT LEFT(embedding::text, 40)) as unique_embeddings,
            COUNT(*) as total
     FROM ask_ruvnet.kb_complete
     WHERE embedding IS NOT NULL`
  );
  console.log(`Embedding diversity: ${check.rows[0].unique_embeddings} unique out of ${check.rows[0].total} total`);

  // Test a semantic search
  console.log('\n--- Semantic Search Test: "corporate data leakage offline AI" ---');
  const testVec = await embed(embedder, 'corporate data leakage offline AI WASM knowledge base');
  const testStr = '[' + testVec.join(',') + ']';
  const { rows: results } = await pool.query(
    `SELECT id, title, embedding <=> '${testStr}'::ruvector as distance
     FROM ask_ruvnet.kb_complete
     ORDER BY distance ASC LIMIT 8`
  );
  results.forEach(r => console.log(`  [${r.id}] d=${parseFloat(r.distance).toFixed(3)} | ${r.title}`));

  console.log('\n--- Semantic Search Test: "swarm agents multi-agent coordination" ---');
  const testVec2 = await embed(embedder, 'swarm agents multi-agent coordination hive mind');
  const testStr2 = '[' + testVec2.join(',') + ']';
  const { rows: results2 } = await pool.query(
    `SELECT id, title, embedding <=> '${testStr2}'::ruvector as distance
     FROM ask_ruvnet.kb_complete
     ORDER BY distance ASC LIMIT 5`
  );
  results2.forEach(r => console.log(`  [${r.id}] d=${parseFloat(r.distance).toFixed(3)} | ${r.title}`));

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
