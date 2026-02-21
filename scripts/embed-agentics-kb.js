#!/usr/bin/env node
/**
 * Re-embed all agentics-knowledge entries using ONNX
 */
const { embed } = require('../src/storage/kb-embed');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost', port: 5435, database: 'postgres', user: 'postgres'
});

async function main() {
  // Warm up ONNX
  await embed('warmup');
  console.log('ONNX ready');

  // Get all agentics-knowledge entries
  const { rows } = await pool.query(
    "SELECT id, title, LEFT(content, 500) as content FROM openclaw_memory.operational_knowledge WHERE tags @> ARRAY['agentics-knowledge'] ORDER BY id"
  );
  console.log(`Embedding ${rows.length} entries...`);

  let done = 0;
  for (const row of rows) {
    const text = (row.title + '. ' + row.content).slice(0, 500);
    const vector = await embed(text);
    const vecStr = '[' + vector.join(',') + ']';
    await pool.query(
      "UPDATE openclaw_memory.operational_knowledge SET embedding = $1::ruvector WHERE id = $2",
      [vecStr, row.id]
    );
    done++;
    console.log(`  [${done}/${rows.length}] ${row.title.slice(0, 50)}`);
  }

  // Verify with a test search
  const testVec = await embed('What is the RVF cognitive container format');
  const testStr = '[' + testVec.join(',') + ']';
  const { rows: results } = await pool.query(
    "SELECT title, embedding <=> $1::ruvector as distance FROM openclaw_memory.operational_knowledge WHERE tags @> ARRAY['agentics-knowledge'] ORDER BY distance LIMIT 5",
    [testStr]
  );
  console.log('\nSearch test: "What is RVF cognitive container format"');
  results.forEach((r, i) => console.log(`  ${i+1}. ${r.title} (dist: ${parseFloat(r.distance).toFixed(4)})`));

  // Second test
  const testVec2 = await embed('How does hive mind swarm coordination work');
  const testStr2 = '[' + testVec2.join(',') + ']';
  const { rows: results2 } = await pool.query(
    "SELECT title, embedding <=> $1::ruvector as distance FROM openclaw_memory.operational_knowledge WHERE tags @> ARRAY['agentics-knowledge'] ORDER BY distance LIMIT 5",
    [testStr2]
  );
  console.log('\nSearch test: "How does hive mind swarm coordination work"');
  results2.forEach((r, i) => console.log(`  ${i+1}. ${r.title} (dist: ${parseFloat(r.distance).toFixed(4)})`));

  await pool.end();
  console.log('\nDONE - all entries embedded and search verified');
}

main().catch(e => { console.error(e); process.exit(1); });
