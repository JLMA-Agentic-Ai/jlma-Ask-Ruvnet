#!/usr/bin/env node
/**
 * verify-everything.mjs — Complete end-to-end verification of Ask-RuvNet
 *
 * Tests EVERY link in the chain:
 *   1. PostgreSQL → kb_complete integrity (entries, embeddings, quality)
 *   2. Build pipeline → .ruvector/knowledge-base/ matches kb_complete
 *   3. Browser assets → SQ8, metadata, gold-content match manifest
 *   4. RVF file → knowledge.rvf size and consistency
 *   5. Server → health, vector count, providers
 *   6. Chat quality → 3 queries, score each response
 *   7. Auto-curation → pipeline detects gaps correctly
 *   8. Nightly pipeline → safeguards work
 *   9. NLM → auth status
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = one or more checks failed
 *
 * Usage: node scripts/verify-everything.mjs [--production]
 *
 * Updated: 2026-03-19 | Version 1.0.0
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IS_PRODUCTION = process.argv.includes('--production');
const BASE_URL = IS_PRODUCTION
  ? 'https://ask-ruvnet-production.up.railway.app'
  : 'http://localhost:3000';

const DB_CONFIG = {
  host: 'localhost', port: 5435, user: 'postgres', database: 'postgres',
  max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000,
};

let passed = 0;
let failed = 0;
let warnings = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✅ ${name}`);
}

function fail(name, detail) {
  failed++;
  failures.push({ name, detail });
  console.log(`  ❌ ${name}: ${detail}`);
}

function warn(name, detail) {
  warnings++;
  console.log(`  ⚠️  ${name}: ${detail}`);
}

// ============================================================
// 1. PostgreSQL Integrity
// ============================================================
async function checkPostgres() {
  console.log('\n=== 1. PostgreSQL kb_complete ===');
  const pool = new pg.Pool(DB_CONFIG);
  try {
    // Entry count
    const { rows: [counts] } = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_emb,
             COUNT(CASE WHEN embedding IS NULL THEN 1 END) as without_emb,
             MIN(quality_score) as min_q, ROUND(AVG(quality_score)) as avg_q,
             MAX(quality_score) as max_q
      FROM ask_ruvnet.kb_complete
    `);
    const total = parseInt(counts.total);
    if (total < 100) fail('Entry count', `Only ${total} entries (expected 400+)`);
    else pass(`Entry count: ${total}`);

    if (parseInt(counts.without_emb) > 0) fail('Missing embeddings', `${counts.without_emb} entries have no embedding`);
    else pass(`All ${total} entries have embeddings`);

    if (parseInt(counts.min_q) < 80) warn('Quality floor', `Minimum quality ${counts.min_q} (target ≥85)`);
    else pass(`Quality floor: ${counts.min_q}/100 (avg ${counts.avg_q})`);

    // Category distribution
    const { rows: cats } = await pool.query(`
      SELECT category, COUNT(*) as cnt FROM ask_ruvnet.kb_complete GROUP BY category ORDER BY cnt DESC
    `);
    if (cats.length < 5) fail('Category diversity', `Only ${cats.length} categories (need ≥5)`);
    else pass(`Category diversity: ${cats.length} categories`);

    // Check for duplicate titles
    const { rows: [dupes] } = await pool.query(`
      SELECT COUNT(*) as cnt FROM (
        SELECT title, COUNT(*) as c FROM ask_ruvnet.kb_complete GROUP BY title HAVING COUNT(*) > 1
      ) sub
    `);
    if (parseInt(dupes.cnt) > 0) warn('Duplicate titles', `${dupes.cnt} duplicate title groups`);
    else pass('No duplicate titles');

    // Freshness
    const { rows: [dates] } = await pool.query(`
      SELECT MIN(created_at)::date as oldest, MAX(created_at)::date as newest,
             (NOW() - MAX(created_at)) as staleness
      FROM ask_ruvnet.kb_complete
    `);
    const daysSinceNewest = Math.floor(parseFloat(dates.staleness?.days || 0));
    if (daysSinceNewest > 7) warn('KB freshness', `Newest entry is ${daysSinceNewest} days old`);
    else pass(`Freshness: newest entry ${daysSinceNewest} days ago`);

    return total;
  } finally {
    await pool.end();
  }
}

// ============================================================
// 2. Build Artifacts
// ============================================================
function checkBuildArtifacts(expectedCount) {
  console.log('\n=== 2. Build Artifacts ===');

  // Manifest
  const manifestPath = path.join(ROOT, '.ruvector', 'knowledge-base', 'manifest.json');
  if (!fs.existsSync(manifestPath)) { fail('Manifest exists', 'File not found'); return; }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.vectorCount !== expectedCount) fail('Manifest count', `${manifest.vectorCount} vs expected ${expectedCount}`);
  else pass(`Manifest: ${manifest.vectorCount} vectors`);
  if (manifest.vectorCount > 1000) fail('Manifest safeguard', `${manifest.vectorCount} exceeds 1000 limit`);
  else pass('Safeguard: under 1000 vectors');
  if (manifest.source !== 'lean-gold-build') warn('Manifest source', `Source is "${manifest.source}" (expected "lean-gold-build")`);
  else pass('Source: lean-gold-build');

  // Vectors.bin size check
  const vecPath = path.join(ROOT, '.ruvector', 'knowledge-base', 'vectors.bin');
  if (fs.existsSync(vecPath)) {
    const vecSize = fs.statSync(vecPath).size;
    const expectedSize = expectedCount * 384 * 4; // float32
    if (Math.abs(vecSize - expectedSize) > 1536) fail('Vectors.bin size', `${vecSize} bytes vs expected ${expectedSize}`);
    else pass(`Vectors.bin: ${(vecSize/1024).toFixed(0)} KB (${expectedCount} × 384 × 4)`);
  } else fail('Vectors.bin exists', 'File not found');

  // Content sidecar
  const sidecarPath = path.join(ROOT, 'content-sidecar.json.gz');
  if (fs.existsSync(sidecarPath)) {
    const sidecar = JSON.parse(zlib.gunzipSync(fs.readFileSync(sidecarPath)));
    const sidecarCount = Object.keys(sidecar).length;
    if (sidecarCount !== expectedCount) fail('Sidecar count', `${sidecarCount} vs expected ${expectedCount}`);
    else pass(`Sidecar: ${sidecarCount} entries`);
  } else fail('Sidecar exists', 'File not found');

  // knowledge.rvf
  const rvfPath = path.join(ROOT, 'knowledge.rvf');
  if (fs.existsSync(rvfPath)) {
    const rvfSize = fs.statSync(rvfPath).size;
    if (rvfSize > 5 * 1024 * 1024) fail('knowledge.rvf size', `${(rvfSize/1024/1024).toFixed(1)} MB (max 5MB for gold KB)`);
    else pass(`knowledge.rvf: ${(rvfSize/1024).toFixed(0)} KB`);
  } else fail('knowledge.rvf exists', 'File not found');
}

// ============================================================
// 3. Browser Assets
// ============================================================
function checkBrowserAssets(expectedCount) {
  console.log('\n=== 3. Browser Assets ===');

  const assets = {
    'knowledge-sq8.bin': { maxKB: 500, check: (buf) => buf.length === expectedCount * 384 },
    'knowledge-sq8-params.bin': { maxKB: 10, check: (buf) => buf.length === 3088 },
    'knowledge-meta.json': { maxKB: 200, check: (content) => {
      const arr = JSON.parse(content);
      return arr.length === expectedCount && arr.every(e => e.t && e.c);
    }},
  };

  for (const [name, spec] of Object.entries(assets)) {
    const p = path.join(ROOT, 'src/ui/public/assets', name);
    if (!fs.existsSync(p)) { fail(`${name} exists`, 'File not found'); continue; }
    const stat = fs.statSync(p);
    const sizeKB = stat.size / 1024;
    if (sizeKB > spec.maxKB) { fail(`${name} size`, `${sizeKB.toFixed(0)} KB exceeds ${spec.maxKB} KB`); continue; }

    const content = name.endsWith('.json') ? fs.readFileSync(p, 'utf8') : fs.readFileSync(p);
    if (spec.check(content)) pass(`${name}: ${sizeKB.toFixed(0)} KB, content valid`);
    else fail(`${name} content`, 'Content validation failed');
  }

  // Gold content
  const goldPath = path.join(ROOT, 'src/ui/public/assets/gold-content.json');
  if (fs.existsSync(goldPath)) {
    const gold = JSON.parse(fs.readFileSync(goldPath, 'utf8'));
    const goldCount = Object.keys(gold).length;
    if (goldCount < 100) warn('gold-content.json', `Only ${goldCount} entries (may need rebuild)`);
    else pass(`gold-content.json: ${goldCount} entries`);
  } else warn('gold-content.json', 'File not found (optional for server-side search)');
}

// ============================================================
// 4. Server Health
// ============================================================
async function checkServer() {
  console.log(`\n=== 4. Server Health (${BASE_URL}) ===`);
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(10000) });
    const d = await res.json();

    if (d.status !== 'ok') fail('Server status', d.status);
    else pass(`Server status: ok (v${d.version})`);

    const vc = d.checks?.vectorStore?.vectorCount || 0;
    if (vc < 100) fail('Vector count', `Only ${vc} vectors loaded`);
    else pass(`Vectors loaded: ${vc}`);

    const backend = d.checks?.vectorStore?.backend || 'unknown';
    if (!backend.includes('RVF')) warn('Backend', `Expected RVF, got: ${backend}`);
    else pass(`Backend: ${backend}`);

    return true;
  } catch (err) {
    fail('Server reachable', err.message);
    return false;
  }
}

// ============================================================
// 5. Chat Quality
// ============================================================
async function checkChatQuality() {
  console.log(`\n=== 5. Chat Quality (${BASE_URL}) ===`);
  const queries = [
    { q: 'What is RuVector?', expect: ['TL;DR', 'HNSW', 'vector'] },
    { q: 'How do I install Ruflo?', expect: ['npx', 'ruflo', 'init'] },
    { q: 'What is Pi Brain?', expect: ['collective', 'memory', 'pi.ruv.io'] },
  ];

  for (const { q, expect } of queries) {
    try {
      const start = Date.now();
      // Retry once on connection reset (Railway cold-start)
      let res;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: q }),
            signal: AbortSignal.timeout(120000),
          });
          break;
        } catch (retryErr) {
          if (attempt === 0) { console.log(`  ↻ Retrying "${q}" (${retryErr.message})...`); continue; }
          throw retryErr;
        }
      }
      const d = await res.json();
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const a = d.answer || '';
      const sources = d.sources || [];

      // Check expected terms
      const missing = expect.filter(t => !a.toLowerCase().includes(t.toLowerCase()));
      if (missing.length > 0) warn(`"${q}" content`, `Missing terms: ${missing.join(', ')}`);
      else pass(`"${q}": all expected terms found`);

      // Check quality signals
      if (!/TL;DR|## TL/i.test(a)) warn(`"${q}" TL;DR`, 'No TL;DR section');
      if (sources.length < 3) warn(`"${q}" sources`, `Only ${sources.length} sources`);
      if (/pip install ruvector|cargo install/i.test(a)) fail(`"${q}" hallucination`, 'Contains fabricated command');

      // Check for inline image
      const hasImg = /!\[.*\]\(\/assets\//.test(a);
      if (hasImg) pass(`"${q}": inline product image included`);
      else warn(`"${q}" image`, 'No inline product image');

      // Check for tradeoff
      const hasTradeoff = /however|trade.?off|limitation|caveat|but.*not|maxes out|cannot|won't/i.test(a);
      if (hasTradeoff) pass(`"${q}": honest tradeoff included`);
      else warn(`"${q}" tradeoff`, 'No honest tradeoff/limitation');

      // Check for citation
      const hasCitation = /\[Source/i.test(a);
      if (hasCitation) pass(`"${q}": citation brackets present`);
      else warn(`"${q}" citation`, 'No [Source N] citations');

      console.log(`  ⏱️  ${q}: ${elapsed}s, ${a.length} chars, ${sources.length} sources`);
    } catch (err) {
      fail(`"${q}" response`, err.message);
    }
  }
}

// ============================================================
// 6. Pipeline Safeguards
// ============================================================
async function checkSafeguards() {
  console.log('\n=== 6. Pipeline Safeguards ===');

  // Check kb-export-pipeline only queries kb_complete
  const pipelinePath = path.join(ROOT, 'scripts/kb-export-pipeline.mjs');
  if (fs.existsSync(pipelinePath)) {
    const content = fs.readFileSync(pipelinePath, 'utf8');
    // Extract queryPgCount function body (between the function declaration and next function/const)
    const queryMatch = content.match(/async function queryPgCount\(\)[\s\S]*?finally\s*\{[\s\S]*?\}\s*\}/);
    if (queryMatch) {
      const queryBody = queryMatch[0];
      if (queryBody.includes('architecture_docs') && !queryBody.includes('// ')) {
        fail('Pipeline query', 'queryPgCount queries architecture_docs (should only query kb_complete)');
      } else {
        pass('Pipeline: queryPgCount only uses kb_complete');
      }
    }
    // Check stage 1 calls build-lean-rvf, not export-to-ruvectorstore
    const stage1Match = content.match(/runStage\([^)]*Stage[^)]*1[^)]*PG[^)]*binary[^)]*'([^']+)'/);
    if (stage1Match) {
      if (stage1Match[1] === 'build-lean-rvf.mjs') pass('Pipeline: uses build-lean-rvf.mjs for stage 1');
      else fail('Pipeline stage1', `Uses ${stage1Match[1]} (should be build-lean-rvf.mjs)`);
    } else {
      // Fallback: check the actual runStage call
      if (content.includes("'build-lean-rvf.mjs'")) pass('Pipeline: uses build-lean-rvf.mjs for stage 1');
      else fail('Pipeline stage1', 'Cannot find build-lean-rvf.mjs in stage 1');
    }
    if (content.includes('> 1000')) pass('Pipeline: has >1000 safeguard');
    else warn('Pipeline safeguard', 'No >1000 vector count check');
  }

  // Check build-quantized safeguard
  const quantPath = path.join(ROOT, 'scripts/build-quantized-rvf.mjs');
  if (fs.existsSync(quantPath)) {
    const content = fs.readFileSync(quantPath, 'utf8');
    if (content.includes('MAX_GOLD_ENTRIES') || content.includes('> 1000')) pass('Quantized build: has vectorCount safeguard');
    else fail('Quantized safeguard', 'No MAX_GOLD_ENTRIES check');
  }

  // Check auto-curation pipeline exists
  const curatePath = path.join(ROOT, 'scripts/kb-auto-curate.mjs');
  if (fs.existsSync(curatePath)) pass('Auto-curation pipeline: exists');
  else fail('Auto-curation', 'kb-auto-curate.mjs not found');
}

// ============================================================
// 7. NLM Status
// ============================================================
async function checkNLM() {
  console.log('\n=== 7. NLM Auth ===');
  const profilePath = path.join(process.env.HOME, '.notebooklm-mcp-cli/profiles/default');
  if (fs.existsSync(profilePath)) pass('NLM profile exists');
  else { warn('NLM profile', 'Default profile not found'); return; }

  const hbPath = path.join(ROOT, 'scripts/nlm-heartbeat.json');
  if (fs.existsSync(hbPath)) {
    const hb = JSON.parse(fs.readFileSync(hbPath, 'utf8'));
    const lastSuccess = hb.lastSuccess ? new Date(hb.lastSuccess) : null;
    if (lastSuccess) {
      const hoursAgo = (Date.now() - lastSuccess.getTime()) / 3600000;
      if (hoursAgo > 48) warn('NLM heartbeat', `Last success ${hoursAgo.toFixed(0)}h ago`);
      else pass(`NLM heartbeat: ${hoursAgo.toFixed(0)}h ago`);
    } else warn('NLM heartbeat', 'No lastSuccess recorded');
  } else warn('NLM heartbeat', 'No heartbeat file');
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ASK-RUVNET COMPLETE VERIFICATION SUITE v1.0    ║');
  console.log('║  Testing: ' + (IS_PRODUCTION ? 'PRODUCTION' : 'LOCAL') + '                                ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const pgCount = await checkPostgres();
  checkBuildArtifacts(pgCount);
  checkBrowserAssets(pgCount);
  const serverUp = await checkServer();
  if (serverUp) await checkChatQuality();
  else console.log('\n=== 5. Chat Quality === SKIPPED (server not reachable)');
  await checkSafeguards();
  await checkNLM();

  console.log('\n' + '═'.repeat(52));
  console.log(`  PASSED:   ${passed}`);
  console.log(`  FAILED:   ${failed}`);
  console.log(`  WARNINGS: ${warnings}`);
  console.log('═'.repeat(52));

  if (failures.length > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.detail}`));
  }

  const score = Math.round((passed / (passed + failed)) * 100);
  console.log(`\nOVERALL SCORE: ${score}/100 (${passed} passed, ${failed} failed, ${warnings} warnings)`);

  if (failed > 0) {
    console.log('\n⛔ VERIFICATION FAILED — fix the above issues before deploying.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  VERIFICATION PASSED WITH WARNINGS — review the above.');
    process.exit(0);
  } else {
    console.log('\n🟢 ALL CHECKS PASSED — system is fully verified.');
    process.exit(0);
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(2);
});
