#!/usr/bin/env node
/**
 * Quick ONNX embed for agentics knowledge entries
 * Targets: openclaw_memory.operational_knowledge WHERE tags @> ARRAY['agentics-knowledge'] AND embedding IS NULL
 */
import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres', max: 2
});

async function main() {
  // 1. Find entries needing embeddings
  const res = await pool.query(`
    SELECT id, LEFT(content, 2000) as txt
    FROM openclaw_memory.operational_knowledge
    WHERE tags @> ARRAY['agentics-knowledge'] AND embedding IS NULL
    ORDER BY id
  `);
  console.log(`Found ${res.rows.length} entries needing embeddings`);
  if (res.rows.length === 0) { await pool.end(); return; }

  // 2. Load ONNX
  const embeddingsPath = '/Users/stuartkerr/.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js';
  const mod = await import(embeddingsPath);
  const svc = await mod.createEmbeddingServiceAsync({
    provider: 'transformers',
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384
  });
  await svc.embed('warmup');
  console.log('ONNX ready');

  // 3. Embed and update each row
  let done = 0;
  for (const row of res.rows) {
    const result = await svc.embed(row.txt || 'empty');
    const vec = result.embedding || result;
    const vecStr = '[' + Array.from(vec).join(',') + ']';
    await pool.query(
      `UPDATE openclaw_memory.operational_knowledge SET embedding = $1::ruvector(384) WHERE id = $2`,
      [vecStr, row.id]
    );
    done++;
    process.stdout.write(`\r  Embedded ${done}/${res.rows.length}`);
  }

  console.log(`\nDone! ${done} embeddings generated and stored.`);

  // 4. Verify
  const verify = await pool.query(`
    SELECT count(*) as total, count(embedding) as with_emb
    FROM openclaw_memory.operational_knowledge
    WHERE tags @> ARRAY['agentics-knowledge']
  `);
  console.log(`Verification: ${verify.rows[0].with_emb}/${verify.rows[0].total} have embeddings`);

  // 5. Test search
  const testQ = await svc.embed('How does Ruflo V3 coordinate agents?');
  const testVec = '[' + Array.from(testQ.embedding || testQ).join(',') + ']';
  const searchRes = await pool.query(`
    SELECT title, 1 - (embedding <=> $1::ruvector(384)) as similarity
    FROM openclaw_memory.operational_knowledge
    WHERE tags @> ARRAY['agentics-knowledge'] AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::ruvector(384)
    LIMIT 5
  `, [testVec]);
  console.log('\nTest search: "How does Ruflo V3 coordinate agents?"');
  for (const r of searchRes.rows) {
    console.log(`  ${(r.similarity * 100).toFixed(1)}% - ${r.title}`);
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
