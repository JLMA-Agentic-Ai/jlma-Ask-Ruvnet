#!/usr/bin/env node
/**
 * test-kb-completeness.mjs
 * AskRuvNet Knowledge Base Completeness and Quality Analysis
 *
 * Connects directly to the local ruvector-postgres database (port 5435)
 * and runs quality/coverage analysis across the ask_ruvnet schema.
 *
 * What it checks:
 *   - Total entry count vs thresholds
 *   - Category distribution and concentration risk
 *   - Knowledge type coverage (concept, procedure, reference, etc.)
 *   - Quality score distribution (gold/silver/bronze/below-threshold)
 *   - Duplicate rate
 *   - Entries missing embeddings
 *   - Entries missing quality scores
 *   - Triage tier breakdown (gold/silver/bronze/garbage)
 *   - Low-quality entry identification (< 40 quality score)
 *
 * Usage:
 *   node scripts/test-kb-completeness.mjs
 *
 *   With custom connection:
 *   PG_HOST=localhost PG_PORT=5435 PG_USER=postgres PG_DATABASE=postgres \
 *     node scripts/test-kb-completeness.mjs
 *
 * Exit codes:
 *   0 = all assertions passed
 *   1 = one or more assertions failed
 */

import pg from 'pg';

const { Pool } = pg;

// ─── Connection config ─────────────────────────────────────────────────────────
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 3,
        idleTimeoutMillis: 10000,
      }
    : {
        host:     process.env.PG_HOST     || 'localhost',
        port:     parseInt(process.env.PG_PORT || '5435'),
        user:     process.env.PG_USER     || 'postgres',
        database: process.env.PG_DATABASE || 'postgres',
        max:      3,
        idleTimeoutMillis: 10000,
      }
);

// ─── Colour helpers ────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

const pass  = (msg) => console.log(`  ${GREEN}PASS${RESET}  ${msg}`);
const fail  = (msg) => console.log(`  ${RED}FAIL${RESET}  ${msg}`);
const warn  = (msg) => console.log(`  ${YELLOW}WARN${RESET}  ${msg}`);
const info  = (msg) => console.log(`  ${CYAN}INFO${RESET}  ${msg}`);
const label = (msg) => console.log(`\n${BOLD}${msg}${RESET}`);

// ─── Test runner ───────────────────────────────────────────────────────────────
let totalTests  = 0;
let passedTests = 0;
let failedTests = 0;
const failures  = [];
const warnings  = [];

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    pass(testName);
    return true;
  } else {
    failedTests++;
    const msg = detail ? `${testName} — ${detail}` : testName;
    fail(msg);
    failures.push(msg);
    return false;
  }
}

function warnCheck(condition, testName, detail = '') {
  if (!condition) {
    warn(`${testName}${detail ? ` — ${detail}` : ''}`);
    warnings.push(testName);
  } else {
    pass(testName);
  }
}

// ─── Query helper ──────────────────────────────────────────────────────────────
async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function pct(numerator, denominator) {
  if (!denominator) return '0.0%';
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function num(n) {
  return typeof n === 'number' ? n.toLocaleString() : String(n);
}

function bar(value, max, width = 30) {
  const filled = Math.round((value / max) * width);
  return '[' + '='.repeat(filled) + ' '.repeat(width - filled) + ']';
}

// ─── Check 1: Connection ───────────────────────────────────────────────────────
async function checkConnection() {
  label('Check 1: Database Connection');
  try {
    const rows = await query('SELECT version()');
    info(`PostgreSQL: ${rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    pass('Connected to ruvector-postgres');
    totalTests++; passedTests++;
    return true;
  } catch (err) {
    fail(`Cannot connect to PostgreSQL — ${err.message}`);
    failures.push(`DB connection failed: ${err.message}`);
    totalTests++; failedTests++;
    return false;
  }
}

// ─── Check 2: Schema Existence ────────────────────────────────────────────────
async function checkSchema() {
  label('Check 2: Schema and Table Existence');

  const schemas = await query(`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name IN ('ask_ruvnet', 'openclaw_memory')
    ORDER BY schema_name
  `);
  const schemaNames = schemas.map(r => r.schema_name);

  assert(schemaNames.includes('ask_ruvnet'), 'ask_ruvnet schema exists');

  if (schemaNames.includes('openclaw_memory')) {
    pass('openclaw_memory schema exists');
    totalTests++; passedTests++;
  } else {
    warn('openclaw_memory schema not found (operational knowledge not accessible)');
    warnings.push('openclaw_memory schema missing');
  }

  // Check table
  const tables = await query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'ask_ruvnet' AND table_name = 'architecture_docs'
  `);
  assert(tables.length > 0, 'ask_ruvnet.architecture_docs table exists');

  // Check knowledge_search function
  const funcs = await query(`
    SELECT routine_name FROM information_schema.routines
    WHERE routine_schema = 'ask_ruvnet' AND routine_name = 'knowledge_search'
  `);
  assert(funcs.length > 0, 'ask_ruvnet.knowledge_search() function exists');
}

// ─── Check 3: Entry Count ─────────────────────────────────────────────────────
async function checkEntryCount() {
  label('Check 3: Entry Count Thresholds');

  const rows = await query(`
    SELECT
      COUNT(*)                                       AS total_raw,
      COUNT(*) FILTER (WHERE is_duplicate = false)   AS total_active,
      COUNT(*) FILTER (WHERE is_duplicate = true)    AS total_duplicates,
      COUNT(*) FILTER (WHERE embedding IS NOT NULL
                       AND is_duplicate = false)     AS has_embedding,
      COUNT(*) FILTER (WHERE quality IS NOT NULL
                       AND is_duplicate = false)     AS has_quality
    FROM ask_ruvnet.architecture_docs
  `);

  const r = rows[0];
  const totalRaw      = parseInt(r.total_raw);
  const totalActive   = parseInt(r.total_active);
  const totalDupes    = parseInt(r.total_duplicates);
  const hasEmbedding  = parseInt(r.has_embedding);
  const hasQuality    = parseInt(r.has_quality);

  info(`Total raw entries:       ${num(totalRaw)}`);
  info(`Active (non-duplicate):  ${num(totalActive)}`);
  info(`Duplicates:              ${num(totalDupes)} (${pct(totalDupes, totalRaw)})`);
  info(`Has embedding:           ${num(hasEmbedding)} (${pct(hasEmbedding, totalActive)} of active)`);
  info(`Has quality score:       ${num(hasQuality)} (${pct(hasQuality, totalActive)} of active)`);

  assert(totalActive > 50000,
    'Active entries > 50,000',
    `got ${num(totalActive)}`
  );
  assert(totalActive >= 45000,
    'Active entries above alert threshold (45,000)',
    `got ${num(totalActive)}`
  );

  const dupeRate = totalRaw > 0 ? totalDupes / totalRaw : 0;
  assert(dupeRate <= 0.05,
    'Duplicate rate <= 5%',
    `got ${pct(totalDupes, totalRaw)}`
  );

  const embeddingCoverage = totalActive > 0 ? hasEmbedding / totalActive : 0;
  assert(embeddingCoverage >= 0.90,
    'Embedding coverage >= 90% of active entries',
    `got ${pct(hasEmbedding, totalActive)}`
  );

  const qualityCoverage = totalActive > 0 ? hasQuality / totalActive : 0;
  assert(qualityCoverage >= 0.90,
    'Quality score coverage >= 90% of active entries',
    `got ${pct(hasQuality, totalActive)}`
  );

  return { totalActive, totalRaw };
}

// ─── Check 4: Category Distribution ───────────────────────────────────────────
async function checkCategoryDistribution(totalActive) {
  label('Check 4: Category Distribution');

  const rows = await query(`
    SELECT
      COALESCE(category, 'uncategorized') AS category,
      COUNT(*)                            AS cnt
    FROM ask_ruvnet.architecture_docs
    WHERE is_duplicate = false
    GROUP BY category
    ORDER BY cnt DESC
    LIMIT 20
  `);

  info(`Distinct categories: ${rows.length}`);
  assert(rows.length >= 5, 'At least 5 distinct categories', `got ${rows.length}`);

  const max = rows.length > 0 ? parseInt(rows[0].cnt) : 0;
  const topCategory = rows[0]?.category || 'none';
  const topPct = totalActive > 0 ? max / totalActive : 0;

  assert(topPct <= 0.40,
    `No single category dominates > 40% of entries`,
    `"${topCategory}" has ${pct(max, totalActive)}`
  );

  console.log('\n  Category breakdown (top 10):');
  rows.slice(0, 10).forEach(r => {
    const count = parseInt(r.cnt);
    const percentage = pct(count, totalActive);
    const barStr = bar(count, max, 25);
    console.log(`    ${barStr} ${percentage.padStart(6)} | ${num(count).padStart(8)} | ${r.category}`);
  });

  // Warn about uncategorized entries
  const uncategorized = rows.find(r => r.category === 'uncategorized');
  if (uncategorized) {
    const uncatPct = parseInt(uncategorized.cnt) / totalActive;
    if (uncatPct > 0.10) {
      warn(`${pct(parseInt(uncategorized.cnt), totalActive)} of entries are uncategorized (> 10% threshold)`);
      warnings.push('High uncategorized entry rate');
    }
  }
}

// ─── Check 5: Knowledge Type Coverage ─────────────────────────────────────────
async function checkKnowledgeTypes(totalActive) {
  label('Check 5: Knowledge Type Coverage');

  const rows = await query(`
    SELECT
      COALESCE(knowledge_type, 'untyped') AS knowledge_type,
      COUNT(*)                            AS cnt
    FROM ask_ruvnet.architecture_docs
    WHERE is_duplicate = false
    GROUP BY knowledge_type
    ORDER BY cnt DESC
  `);

  const typeMap = {};
  rows.forEach(r => { typeMap[r.knowledge_type] = parseInt(r.cnt); });

  const requiredTypes = ['concept', 'procedure', 'reference', 'example', 'troubleshooting'];
  const presentTypes  = Object.keys(typeMap).filter(t => t !== 'untyped' && typeMap[t] > 0);

  info(`Distinct knowledge types: ${rows.length}`);
  info(`Present types: ${presentTypes.join(', ')}`);

  assert(presentTypes.length >= 3,
    'At least 3 knowledge types present',
    `got: [${presentTypes.join(', ')}]`
  );

  console.log('\n  Knowledge type breakdown:');
  rows.forEach(r => {
    const count = parseInt(r.cnt);
    const missing = requiredTypes.includes(r.knowledge_type) ? '' : ' (extra)';
    console.log(`    ${num(count).padStart(8)} (${pct(count, totalActive).padStart(6)}) | ${r.knowledge_type}${missing}`);
  });

  // Warn about missing required types
  const missingTypes = requiredTypes.filter(t => !typeMap[t] || typeMap[t] === 0);
  if (missingTypes.length > 0) {
    warn(`Missing required knowledge types: [${missingTypes.join(', ')}] — ingestion gap`);
    warnings.push(`Missing knowledge types: ${missingTypes.join(', ')}`);
  } else {
    pass('All 5 required knowledge types present');
    totalTests++; passedTests++;
  }

  // Untyped entries
  const untyped = typeMap['untyped'] || 0;
  if (untyped > 0) {
    const untypedPct = untyped / totalActive;
    warnCheck(untypedPct <= 0.05, 'Untyped entries <= 5%', `got ${pct(untyped, totalActive)}`);
    totalTests++;
    if (untypedPct > 0.05) failedTests++; else passedTests++;
  }
}

// ─── Check 6: Quality Score Distribution ──────────────────────────────────────
async function checkQualityDistribution(totalActive) {
  label('Check 6: Quality Score Distribution');

  const rows = await query(`
    SELECT
      COUNT(*) FILTER (WHERE quality >= 80)              AS gold,
      COUNT(*) FILTER (WHERE quality >= 60 AND quality < 80) AS silver,
      COUNT(*) FILTER (WHERE quality >= 40 AND quality < 60) AS bronze,
      COUNT(*) FILTER (WHERE quality < 40 AND quality IS NOT NULL) AS below_threshold,
      COUNT(*) FILTER (WHERE quality IS NULL)            AS no_score,
      MIN(quality)                                       AS min_quality,
      MAX(quality)                                       AS max_quality,
      ROUND(AVG(quality)::numeric, 2)                    AS avg_quality,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quality) AS median_quality
    FROM ask_ruvnet.architecture_docs
    WHERE is_duplicate = false
  `);

  const q = rows[0];
  const gold          = parseInt(q.gold)           || 0;
  const silver        = parseInt(q.silver)         || 0;
  const bronze        = parseInt(q.bronze)         || 0;
  const belowThresh   = parseInt(q.below_threshold)|| 0;
  const noScore       = parseInt(q.no_score)       || 0;
  const avgQuality    = parseFloat(q.avg_quality)  || 0;
  const medianQuality = parseFloat(q.median_quality)|| 0;

  info(`Quality distribution:`);
  info(`  Gold   (>= 80): ${num(gold).padStart(8)} — ${pct(gold, totalActive)}`);
  info(`  Silver (60-79): ${num(silver).padStart(8)} — ${pct(silver, totalActive)}`);
  info(`  Bronze (40-59): ${num(bronze).padStart(8)} — ${pct(bronze, totalActive)}`);
  info(`  Below  (< 40):  ${num(belowThresh).padStart(8)} — ${pct(belowThresh, totalActive)}`);
  info(`  No score:       ${num(noScore).padStart(8)} — ${pct(noScore, totalActive)}`);
  info(`  Min / Max / Avg / Median: ${q.min_quality} / ${q.max_quality} / ${avgQuality} / ${medianQuality}`);

  // Assertions
  assert(gold >= 3000,
    'Gold tier entries >= 3,000',
    `got ${num(gold)}`
  );

  const silverPlusPct = totalActive > 0 ? (gold + silver) / totalActive : 0;
  assert(silverPlusPct >= 0.40,
    'Gold + Silver entries >= 40% of active',
    `got ${pct(gold + silver, totalActive)}`
  );

  const belowPct = totalActive > 0 ? belowThresh / totalActive : 0;
  assert(belowPct <= 0.20,
    'Below-threshold entries (<40 quality) <= 20% of active',
    `got ${pct(belowThresh, totalActive)}`
  );

  assert(avgQuality >= 50,
    'Average quality score >= 50',
    `got ${avgQuality}`
  );

  warnCheck(gold >= 5000, 'Gold tier entries >= 5,000 (optimal)', `got ${num(gold)}`);

  return { gold, silver, bronze, belowThresh };
}

// ─── Check 7: Triage Tier Breakdown ───────────────────────────────────────────
async function checkTriageTiers(totalActive) {
  label('Check 7: Triage Tier Breakdown');

  const rows = await query(`
    SELECT
      COALESCE(triage_tier, 'unset') AS tier,
      COUNT(*)                       AS cnt
    FROM ask_ruvnet.architecture_docs
    WHERE is_duplicate = false
    GROUP BY triage_tier
    ORDER BY cnt DESC
  `);

  const tierMap = {};
  rows.forEach(r => { tierMap[r.tier] = parseInt(r.cnt); });

  console.log('\n  Triage tier breakdown:');
  rows.forEach(r => {
    const count = parseInt(r.cnt);
    console.log(`    ${num(count).padStart(8)} (${pct(count, totalActive).padStart(6)}) | ${r.tier}`);
  });

  const garbageCount = tierMap['garbage'] || 0;
  const garbagePct   = totalActive > 0 ? garbageCount / totalActive : 0;

  assert(garbagePct <= 0.10,
    'Garbage-tier entries <= 10% of active',
    `got ${pct(garbageCount, totalActive)}`
  );

  if (tierMap['unset'] && tierMap['unset'] > 0) {
    warn(`${num(tierMap['unset'])} entries have no triage tier set`);
    warnings.push(`${num(tierMap['unset'])} entries with unset triage tier`);
  }
}

// ─── Check 8: Low Quality Samples ─────────────────────────────────────────────
async function checkLowQualitySamples() {
  label('Check 8: Low Quality Entry Samples (quality < 40)');

  const rows = await query(`
    SELECT id, title, category, quality, triage_tier, is_duplicate
    FROM ask_ruvnet.architecture_docs
    WHERE quality < 40
      AND quality IS NOT NULL
      AND is_duplicate = false
    ORDER BY quality ASC
    LIMIT 10
  `);

  if (rows.length === 0) {
    pass('No low-quality entries (quality < 40) found');
    totalTests++; passedTests++;
    return;
  }

  warn(`Found ${rows.length} low-quality entries (showing up to 10):`);
  rows.forEach(r => {
    console.log(`    ID: ${r.id} | Quality: ${r.quality} | Tier: ${r.triage_tier} | Category: ${r.category}`);
    console.log(`    Title: ${(r.title || '').substring(0, 80)}`);
  });

  // Not a hard failure — just information — but we track via the distribution check
  pass('Low quality sample check completed (see output above)');
  totalTests++; passedTests++;
}

// ─── Check 9: Embedding Dimension Integrity ────────────────────────────────────
async function checkEmbeddingIntegrity() {
  label('Check 9: Embedding Dimension Integrity (spot-check 10 random entries)');

  // Sample 10 random entries with embeddings and check dimension
  let rows;
  try {
    rows = await query(`
      SELECT id,
             title,
             array_length(embedding::float[], 1) AS embed_dim
      FROM ask_ruvnet.architecture_docs
      WHERE embedding IS NOT NULL
        AND is_duplicate = false
      ORDER BY random()
      LIMIT 10
    `);
  } catch (err) {
    // If the embedding column type doesn't support array_length, try alternative
    warn(`Embedding dimension check failed (${err.message}) — trying text cast`);
    try {
      rows = await query(`
        SELECT id, title,
               (LENGTH(embedding::text) > 100) AS has_embedding
        FROM ask_ruvnet.architecture_docs
        WHERE embedding IS NOT NULL
          AND is_duplicate = false
        ORDER BY random()
        LIMIT 10
      `);
      assert(rows.length === 10, 'Retrieved 10 sample entries with embeddings');
      rows.forEach(r => {
        assert(r.has_embedding === true, `Entry ${r.id} has non-trivial embedding`);
      });
      return;
    } catch (err2) {
      fail(`Cannot check embedding dimensions: ${err2.message}`);
      failures.push('Embedding dimension check error');
      failedTests++; totalTests++;
      return;
    }
  }

  assert(rows.length > 0, 'Retrieved sample entries with embeddings', `got ${rows.length}`);

  let allCorrectDimension = true;
  rows.forEach(r => {
    const dim = parseInt(r.embed_dim);
    if (dim !== 384) {
      allCorrectDimension = false;
      fail(`Entry ${r.id} has embedding dimension ${dim}, expected 384`);
      failures.push(`Wrong embedding dimension on entry ${r.id}: ${dim}`);
      failedTests++; totalTests++;
    }
  });

  if (allCorrectDimension && rows.length > 0) {
    pass(`All ${rows.length} sampled entries have correct 384-dimension embeddings`);
    totalTests++; passedTests++;
  }
}

// ─── Check 10: Multi-Domain Stats ─────────────────────────────────────────────
async function checkMultiDomainStats() {
  label('Check 10: Multi-Domain KB Coverage');

  const domains = [
    { schema: 'travel_agent',    table: 'knowledge' },
    { schema: 'viral_social',    table: 'knowledge' },
    { schema: 'retirewell',      table: 'guru_knowledge' },
  ];

  for (const d of domains) {
    try {
      const rows = await query(`
        SELECT COUNT(*) FILTER (WHERE is_duplicate = false) AS total
        FROM ${d.schema}.${d.table}
      `);
      const count = parseInt(rows[0].total) || 0;
      info(`${d.schema}.${d.table}: ${num(count)} active entries`);
      totalTests++;
      if (count >= 0) { passedTests++; pass(`${d.schema} schema accessible`); }
    } catch (err) {
      warn(`${d.schema}.${d.table} unavailable: ${err.message}`);
      warnings.push(`${d.schema} schema unavailable`);
    }
  }
}

// ─── Check 11: Recent Ingestion Activity ──────────────────────────────────────
async function checkIngestionRecency() {
  label('Check 11: Recent Ingestion Activity');

  try {
    const rows = await query(`
      SELECT
        MAX(created_at)                                     AS latest_entry,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'
                         AND is_duplicate = false)          AS last_7_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'
                         AND is_duplicate = false)          AS last_30_days
      FROM ask_ruvnet.architecture_docs
      WHERE created_at IS NOT NULL
    `);

    const r = rows[0];
    const latest    = r.latest_entry ? new Date(r.latest_entry).toISOString() : 'unknown';
    const last7d    = parseInt(r.last_7_days)  || 0;
    const last30d   = parseInt(r.last_30_days) || 0;

    info(`Latest entry timestamp: ${latest}`);
    info(`Entries added in last 7 days:  ${num(last7d)}`);
    info(`Entries added in last 30 days: ${num(last30d)}`);

    warnCheck(last30d > 0,
      'At least 1 entry added in the last 30 days (KB is not stale)',
      'no entries in last 30 days — KB may be stale'
    );
    totalTests++;
    if (last30d > 0) passedTests++; else failedTests++;

  } catch (err) {
    warn(`created_at column check failed: ${err.message}`);
    warn('Ingestion recency check skipped (column may not exist)');
  }
}

// ─── Main runner ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}AskRuvNet KB Completeness and Quality Analysis${RESET}`);
  const host = process.env.PG_HOST || 'localhost';
  const port = process.env.PG_PORT || '5435';
  console.log(`Target: ${CYAN}PostgreSQL at ${host}:${port}${RESET}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  console.log('─'.repeat(60));

  // Check connection first — bail early if can't connect
  const connected = await checkConnection();
  if (!connected) {
    console.log(`\n${RED}Cannot connect to database. Ensure ruvector-postgres is running on port 5435.${RESET}`);
    console.log('Check: ~/.pgpass for credentials, or set DATABASE_URL environment variable.\n');
    await pool.end();
    process.exit(1);
  }

  await checkSchema();

  const { totalActive } = await checkEntryCount();
  await checkCategoryDistribution(totalActive);
  await checkKnowledgeTypes(totalActive);
  await checkQualityDistribution(totalActive);
  await checkTriageTiers(totalActive);
  await checkLowQualitySamples();
  await checkEmbeddingIntegrity();
  await checkMultiDomainStats();
  await checkIngestionRecency();

  await pool.end();

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log(`\n${BOLD}Analysis Summary${RESET}`);
  console.log(`  Total assertions: ${totalTests}`);
  console.log(`  ${GREEN}Passed:  ${passedTests}${RESET}`);
  console.log(`  ${failedTests > 0 ? RED : GREEN}Failed:  ${failedTests}${RESET}`);
  console.log(`  ${YELLOW}Warnings: ${warnings.length}${RESET}`);

  const pctPass = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  console.log(`  Score:   ${pctPass}%`);

  if (failures.length > 0) {
    console.log(`\n${RED}${BOLD}Failures requiring action:${RESET}`);
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }

  if (warnings.length > 0) {
    console.log(`\n${YELLOW}${BOLD}Warnings (review recommended):${RESET}`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  // ─── Recommendations ────────────────────────────────────────────────────────
  console.log(`\n${BOLD}Recommendations:${RESET}`);
  if (failures.some(f => f.includes('embedding'))) {
    console.log('  - Run scripts/fix-all-kb-embeddings.mjs to repair missing embeddings');
  }
  if (failures.some(f => f.includes('quality'))) {
    console.log('  - Run scripts/kb-qa-validation.js to re-score low-quality entries');
  }
  if (failures.some(f => f.includes('50,000'))) {
    console.log('  - Run ingestion scripts to restore entry count above threshold');
  }
  if (warnings.some(w => w.includes('knowledge types'))) {
    console.log('  - Ingest content to cover missing knowledge types (procedure, example, troubleshooting)');
  }
  if (warnings.some(w => w.includes('stale'))) {
    console.log('  - Run kb-incremental-update.sh or a full KB refresh to bring knowledge current');
  }

  console.log(`\nFinished: ${new Date().toISOString()}\n`);
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(`\n${RED}Fatal error: ${err.message}${RESET}`);
  console.error(err.stack);
  await pool.end().catch(() => {});
  process.exit(1);
});
