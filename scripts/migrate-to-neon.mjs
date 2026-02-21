#!/usr/bin/env node
/**
 * Migrate ask_ruvnet.architecture_docs from local ruvector-postgres to Neon pgvector
 *
 * Streams rows in batches of 5000 to avoid memory pressure.
 * The ruvector embedding::text format "[x,x,...]" is identical to pgvector's
 * vector text input format, so no conversion is needed.
 */

import pg from 'pg';

const SOURCE = {
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  password: '',
  database: 'postgres',
  max: 3,
};

const NEON_URL = 'postgresql://neondb_owner:npg_WYTmhPck1Sv9@ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require';

const BATCH_SIZE = 5000;

const COLS = [
  'doc_id','title','content','summary','file_path','section_header',
  'section_index','file_hash','package_name','package_version','doc_type',
  'category','knowledge_type','concepts','topics','expertise_level',
  'source_authority','quality_score','triage_tier','is_duplicate',
  'canonical_id','valid_from','valid_until','retrieval_count',
  'usefulness_score','embedding','created_at','updated_at'
];

// Valid check constraint values - clean data before insert
const VALID_KNOWLEDGE_TYPES = new Set(['concept','procedure','decision','reference','troubleshooting','pattern','example','overview','unknown']);
const VALID_EXPERTISE = new Set(['beginner','intermediate','advanced','expert']);
const VALID_AUTHORITY = new Set(['official-docs','verified-code','expert-curated','auto-ingested','llm-generated','community']);
const VALID_TRIAGE = new Set(['gold','silver','bronze','garbage','unclassified']);

const KT_MAP = { 'how-to':'procedure','howto':'procedure','guide':'procedure','tutorial':'procedure','best-practice':'pattern','best-practices':'pattern','faq':'troubleshooting' };

function normalize(value, validSet, fallback, map = {}) {
  if (!value) return fallback;
  const lower = value.toLowerCase();
  if (map[lower]) return map[lower];
  if (validSet.has(lower)) return lower;
  return fallback;
}

async function main() {
  console.log('=== AskRuvNet Migration: local ruvector → Neon pgvector ===\n');

  const srcPool = new pg.Pool(SOURCE);
  const neonPool = new pg.Pool({ connectionString: NEON_URL, max: 5, ssl: { rejectUnauthorized: false } });

  // Get total count
  const { rows: [{ total }] } = await srcPool.query('SELECT COUNT(*) as total FROM ask_ruvnet.architecture_docs');
  console.log(`Source rows: ${parseInt(total).toLocaleString()}`);

  // Check what's already on Neon
  const { rows: [{ existing }] } = await neonPool.query('SELECT COUNT(*) as existing FROM ask_ruvnet.architecture_docs');
  console.log(`Already on Neon: ${parseInt(existing).toLocaleString()}`);

  if (parseInt(existing) > 0) {
    console.log('Neon already has data — resuming from where we left off (using ON CONFLICT DO NOTHING)');
  }

  console.log(`\nMigrating in batches of ${BATCH_SIZE.toLocaleString()}...\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  let offset = 0;

  // Build insert SQL with ON CONFLICT DO NOTHING (safe for resume)
  const placeholders = COLS.map((_, i) => {
    if (COLS[i] === 'embedding') return `$${i + 1}::vector`;
    return `$${i + 1}`;
  }).join(',');
  const insertSQL = `
    INSERT INTO ask_ruvnet.architecture_docs (${COLS.join(',')})
    VALUES (${placeholders})
    ON CONFLICT (doc_id) DO NOTHING
  `;

  while (offset < parseInt(total)) {
    const batchNum = Math.floor(offset / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(parseInt(total) / BATCH_SIZE);
    process.stdout.write(`Batch ${batchNum}/${totalBatches} (offset ${offset.toLocaleString()})... `);

    // Fetch batch from source
    const { rows } = await srcPool.query(`
      SELECT
        doc_id, COALESCE(title,'') as title, content, summary,
        file_path, section_header, section_index, file_hash,
        package_name, package_version, doc_type, category,
        knowledge_type, concepts, topics, expertise_level,
        source_authority, quality_score, triage_tier, is_duplicate,
        canonical_id, valid_from, valid_until, retrieval_count,
        usefulness_score, embedding::text as embedding,
        created_at, updated_at
      FROM ask_ruvnet.architecture_docs
      ORDER BY id
      LIMIT $1 OFFSET $2
    `, [BATCH_SIZE, offset]);

    if (rows.length === 0) break;

    // Insert batch to Neon
    const neonClient = await neonPool.connect();
    try {
      await neonClient.query('BEGIN');
      let batchInserted = 0;

      for (const row of rows) {
        try {
          const values = [
            row.doc_id,
            row.title || '',
            row.content,
            row.summary,
            row.file_path,
            row.section_header,
            row.section_index,
            row.file_hash,
            row.package_name,
            row.package_version,
            row.doc_type,
            row.category,
            normalize(row.knowledge_type, VALID_KNOWLEDGE_TYPES, 'unknown', KT_MAP),
            row.concepts,
            row.topics,
            normalize(row.expertise_level, VALID_EXPERTISE, 'intermediate'),
            normalize(row.source_authority, VALID_AUTHORITY, 'auto-ingested'),
            row.quality_score ?? 50,
            normalize(row.triage_tier, VALID_TRIAGE, 'unclassified'),
            row.is_duplicate ?? false,
            row.canonical_id,
            row.valid_from,
            row.valid_until,
            row.retrieval_count ?? 0,
            row.usefulness_score ?? 0.5,
            row.embedding, // already in [x,x,...] format - pgvector accepts this
            row.created_at,
            row.updated_at,
          ];

          const result = await neonClient.query(insertSQL, values);
          if (result.rowCount > 0) batchInserted++;
          else skipped++;
        } catch (err) {
          errors++;
          if (errors <= 5) console.error(`\n  Row error (${row.doc_id}): ${err.message.substring(0, 100)}`);
        }
      }

      await neonClient.query('COMMIT');
      inserted += batchInserted;
      console.log(`✅ ${batchInserted} inserted, ${rows.length - batchInserted} skipped`);
    } catch (err) {
      await neonClient.query('ROLLBACK');
      console.error(`\n  Batch error: ${err.message}`);
      errors++;
    } finally {
      neonClient.release();
    }

    offset += BATCH_SIZE;
  }

  // Final count on Neon
  const { rows: [{ final }] } = await neonPool.query('SELECT COUNT(*) as final FROM ask_ruvnet.architecture_docs');

  await srcPool.end();
  await neonPool.end();

  console.log('\n=== Migration Complete ===');
  console.log(`  Source total   : ${parseInt(total).toLocaleString()}`);
  console.log(`  Inserted       : ${inserted.toLocaleString()}`);
  console.log(`  Skipped (dup)  : ${skipped.toLocaleString()}`);
  console.log(`  Errors         : ${errors}`);
  console.log(`  Neon final     : ${parseInt(final).toLocaleString()}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
