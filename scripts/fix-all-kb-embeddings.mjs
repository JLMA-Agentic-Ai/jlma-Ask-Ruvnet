#!/usr/bin/env node
/**
 * Fix All KB Embeddings v1.0
 * Generates ONNX embeddings for all tables with NULL embedding columns.
 *
 * Research-verified schema for each table (2026-02-16):
 * - All embedding columns are typed ruvector(384)
 * - Content columns and embed column names vary per table
 * - Uses staging table + bulk UPDATE for speed
 *
 * Usage: node scripts/fix-all-kb-embeddings.mjs [--dry-run]
 */
import pg from 'pg';

const DRY_RUN = process.argv.includes('--dry-run');
const ONNX_BATCH = 100;
const MAX_TEXT_LEN = 2000;

const pool = new pg.Pool({
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  password: '',
  database: 'postgres',
  max: 4
});

/**
 * Table definitions - verified against information_schema.columns
 * Each entry defines:
 *   schema, table, embedCol: where to write the embedding
 *   textSql: SQL expression that produces the text to embed (using table columns)
 *   idCol: primary key column name
 *   idType: 'int' or 'bigint' for staging table
 */
const TABLES = [
  {
    schema: 'answerbot_builder', table: 'knowledge',
    embedCol: 'embedding_vec', idCol: 'id', idType: 'INT',
    textSql: `COALESCE(title, '') || E'\\n' || COALESCE(LEFT(content, ${MAX_TEXT_LEN}), '')`,
    label: 'answerbot_builder.knowledge'
  },
  {
    schema: 'bricksmith', table: 'knowledge',
    embedCol: 'embedding_vec', idCol: 'id', idType: 'INT',
    textSql: `COALESCE(title, '') || E'\\n' || COALESCE(LEFT(content, ${MAX_TEXT_LEN}), '')`,
    label: 'bricksmith.knowledge'
  },
  {
    schema: 'travel_agent_graph', table: 'nodes',
    embedCol: 'embedding', idCol: 'id', idType: 'BIGINT',
    textSql: `COALESCE(node_type, '') || ': ' || COALESCE(name, '') || E'\\n' || COALESCE(LEFT(properties::text, ${MAX_TEXT_LEN}), '')`,
    label: 'travel_agent_graph.nodes'
  },
  {
    schema: 'travel_agent_graph', table: 'edges',
    embedCol: 'embedding', idCol: 'id', idType: 'BIGINT',
    textSql: `COALESCE(edge_type, '') || E'\\n' || COALESCE(LEFT(properties::text, ${MAX_TEXT_LEN}), '')`,
    label: 'travel_agent_graph.edges'
  },
  {
    schema: 'travel_agent_graph', table: 'hyperedges',
    embedCol: 'embedding', idCol: 'id', idType: 'BIGINT',
    textSql: `COALESCE(hyperedge_type, '') || ': ' || COALESCE(LEFT(description, ${MAX_TEXT_LEN}), '')`,
    label: 'travel_agent_graph.hyperedges'
  },
  {
    schema: 'viral_social', table: 'viral_psychology',
    embedCol: 'embedding_vec', idCol: 'id', idType: 'INT',
    textSql: `COALESCE(title, '') || E'\\n' || COALESCE(LEFT(content, ${MAX_TEXT_LEN}), '')`,
    label: 'viral_social.viral_psychology'
  },
  {
    schema: 'viral_social', table: 'viral_posts',
    embedCol: 'embedding', idCol: 'id', idType: 'INT',
    textSql: `COALESCE(LEFT(content, ${MAX_TEXT_LEN}), '') || E'\\n' || COALESCE(hook, '') || E'\\n' || COALESCE(why_viral, '')`,
    label: 'viral_social.viral_posts'
  },
  {
    schema: 'viral_social', table: 'algorithm_guides',
    embedCol: 'embedding_vec', idCol: 'id', idType: 'INT',
    textSql: `COALESCE(title, '') || ' (' || COALESCE(platform, '') || ')' || E'\\n' || COALESCE(LEFT(content, ${MAX_TEXT_LEN}), '')`,
    label: 'viral_social.algorithm_guides'
  },
  {
    schema: 'viral_social', table: 'engagement_tactics',
    embedCol: 'embedding_vec', idCol: 'id', idType: 'INT',
    textSql: `COALESCE(tactic_name, '') || ' [' || COALESCE(tactic_type, '') || ']' || E'\\n' || COALESCE(LEFT(description, ${MAX_TEXT_LEN}), '')`,
    label: 'viral_social.engagement_tactics'
  },
];

async function main() {
  console.log(`=== Fix All KB Embeddings v1.0 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // 1. Pre-flight: verify all tables exist and have the expected columns
  console.log('Pre-flight checks...');
  for (const t of TABLES) {
    const res = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      AND column_name IN ($3, $4)
    `, [t.schema, t.table, t.embedCol, t.idCol]);

    const cols = res.rows.map(r => r.column_name);
    if (!cols.includes(t.embedCol)) {
      console.error(`  FAIL: ${t.label} missing column '${t.embedCol}'`);
      process.exit(1);
    }
    if (!cols.includes(t.idCol)) {
      console.error(`  FAIL: ${t.label} missing column '${t.idCol}'`);
      process.exit(1);
    }

    // Count NULL embeddings
    const countRes = await pool.query(
      `SELECT COUNT(*) AS total, COUNT(${t.embedCol}) AS has_emb FROM ${t.schema}.${t.table}`
    );
    t.total = parseInt(countRes.rows[0].total);
    t.hasEmb = parseInt(countRes.rows[0].has_emb);
    t.missing = t.total - t.hasEmb;

    const status = t.missing === 0 ? 'SKIP (all embedded)' : `${t.missing}/${t.total} need embedding`;
    console.log(`  ${t.label}: ${status}`);
  }

  const totalMissing = TABLES.reduce((s, t) => s + t.missing, 0);
  if (totalMissing === 0) {
    console.log('\nAll tables have 100% embeddings! Nothing to do.');
    await pool.end();
    return;
  }
  console.log(`\nTotal rows to embed: ${totalMissing}\n`);

  if (DRY_RUN) {
    console.log('Dry run complete. Remove --dry-run to execute.');
    await pool.end();
    return;
  }

  // 2. Load ONNX
  console.log('Loading ONNX embedding model...');
  const embeddingsPath = '/Users/stuartkerr/.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js';
  const mod = await import(embeddingsPath);
  const svc = await mod.createEmbeddingServiceAsync({
    provider: 'transformers',
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384
  });
  await svc.embed('warmup');
  console.log('ONNX model ready.\n');

  const globalStart = Date.now();
  let globalProcessed = 0;
  let globalErrors = 0;

  // 3. Process each table
  for (const t of TABLES) {
    if (t.missing === 0) continue;

    console.log(`--- ${t.label} (${t.missing} rows) ---`);
    const tableStart = Date.now();

    // Create staging table for this batch
    const stagingTable = `${t.schema}._embed_staging_fix`;
    await pool.query(`CREATE UNLOGGED TABLE IF NOT EXISTS ${stagingTable} (id ${t.idType} PRIMARY KEY, vec TEXT NOT NULL)`);

    let processed = 0;
    while (processed < t.missing) {
      // Fetch batch of NULL-embedding rows
      const fetchRes = await pool.query(`
        SELECT ${t.idCol} AS id, ${t.textSql} AS txt
        FROM ${t.schema}.${t.table}
        WHERE ${t.embedCol} IS NULL
        ORDER BY ${t.idCol} LIMIT 500
      `);
      if (fetchRes.rows.length === 0) break;
      const items = fetchRes.rows;

      // ONNX batch embed
      const allEmbeddings = [];
      for (let i = 0; i < items.length; i += ONNX_BATCH) {
        const batchTexts = items.slice(i, i + ONNX_BATCH).map(r => (r.txt || 'empty').trim().slice(0, MAX_TEXT_LEN));
        const result = await svc.embedBatch(batchTexts);
        for (const item of result.embeddings) {
          allEmbeddings.push(item.embedding || item);
        }
      }

      // Stage embeddings
      await pool.query(`TRUNCATE ${stagingTable}`);
      const values = [];
      const params = [];
      let paramIdx = 1;
      let skipped = 0;

      for (let i = 0; i < items.length; i++) {
        const vec = allEmbeddings[i];
        if (!vec || vec.length !== 384) {
          skipped++;
          continue;
        }
        values.push(`($${paramIdx}, $${paramIdx + 1})`);
        params.push(items[i].id);
        params.push('[' + Array.from(vec).join(',') + ']');
        paramIdx += 2;
      }

      if (values.length > 0) {
        await pool.query(
          `INSERT INTO ${stagingTable} (id, vec) VALUES ${values.join(',')}`,
          params
        );
        await pool.query(`
          UPDATE ${t.schema}.${t.table} main
          SET ${t.embedCol} = s.vec::ruvector(384)
          FROM ${stagingTable} s
          WHERE main.${t.idCol} = s.id
        `);
      }

      processed += items.length;
      globalProcessed += items.length;
      if (skipped > 0) globalErrors += skipped;

      const rate = Math.round(processed / ((Date.now() - tableStart) / 1000));
      console.log(`  ${processed}/${t.missing} (${rate} rows/sec)${skipped > 0 ? ` [${skipped} skipped]` : ''}`);
    }

    // Cleanup staging
    await pool.query(`DROP TABLE IF EXISTS ${stagingTable}`);

    // Verify
    const verifyRes = await pool.query(
      `SELECT COUNT(*) AS total, COUNT(${t.embedCol}) AS has_emb FROM ${t.schema}.${t.table}`
    );
    const finalTotal = parseInt(verifyRes.rows[0].total);
    const finalEmb = parseInt(verifyRes.rows[0].has_emb);
    const pct = ((finalEmb / finalTotal) * 100).toFixed(1);
    console.log(`  Verified: ${finalEmb}/${finalTotal} (${pct}%) embedded\n`);
  }

  const totalTime = ((Date.now() - globalStart) / 1000).toFixed(1);
  console.log(`=== Complete ===`);
  console.log(`Processed: ${globalProcessed} rows in ${totalTime}s`);
  console.log(`Errors: ${globalErrors}`);

  await pool.end();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  pool.end().catch(() => {});
  process.exit(1);
});
