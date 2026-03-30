#!/usr/bin/env node
/**
 * kb-auto-curate.mjs — Automated KB Curation Pipeline (PG-FREE, v3.0.0)
 *
 * Detects stale/missing gold entries by comparing .ruvector/raw/ (NDJSON chunks)
 * against kb-master.json (gold entries). Synthesizes new teaching entries with
 * Claude Sonnet, generates ONNX embeddings, writes to kb-master.json, and
 * optionally triggers a full RVF rebuild.
 *
 * NO PostgreSQL dependency. Reads/writes flat files only.
 *
 * LaunchAgent: ai.openclaw.kb-curate (5:00 AM daily)
 * Usage: node scripts/kb-auto-curate.mjs [--rebuild] [--dry-run] [--force] [--repo <name>]
 *
 * Updated: 2026-03-30 | Version 3.0.0 (ADR-001: PG eliminated)
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const RAW_DIR = path.join(ROOT, '.ruvector', 'raw');
const RAW_MANIFEST = path.join(RAW_DIR, 'manifest.json');
const MASTER_PATH = path.join(ROOT, 'kb-master.json');
const NODE_BIN = '/usr/local/bin/node';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '';
const LLM_MODEL = 'anthropic/claude-sonnet-4-6';
const MAX_NEW_ENTRIES_PER_RUN = 20;
const MIN_CHUNKS_FOR_ENTRY = 10;
const QUALITY_THRESHOLD = 85;

const REBUILD = process.argv.includes('--rebuild');
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const SINGLE_REPO = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;

let onnxSvc = null;
const startTime = Date.now();

function log(msg) { console.log('[' + new Date().toLocaleTimeString() + '] ' + msg); }

async function initOnnx() {
  const embPath = path.join(os.homedir(), '.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js');
  const mod = await import(embPath);
  onnxSvc = await mod.createEmbeddingServiceAsync({ provider: 'transformers', model: 'Xenova/all-MiniLM-L6-v2', dimensions: 384 });
  await onnxSvc.embed('warmup');
}

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// ─── Read raw chunks from .ruvector/raw/ ───────────────────────────────

function loadRawManifest() {
  if (fs.existsSync(RAW_MANIFEST)) return JSON.parse(fs.readFileSync(RAW_MANIFEST, 'utf8'));
  return { repos: {} };
}

function loadRepoChunks(repoName) {
  const filePath = path.join(RAW_DIR, repoName + '.ndjson.gz');
  if (!fs.existsSync(filePath)) return [];
  const raw = zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8');
  return raw.split('\n').filter(Boolean).map(line => JSON.parse(line));
}

// ─── Read/write kb-master.json ─────────────────────────────────────────

function loadMaster() {
  if (!fs.existsSync(MASTER_PATH)) { log('ERROR: kb-master.json not found'); process.exit(1); }
  return JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
}

function saveMaster(master) {
  master.entryCount = master.entries.length;
  fs.writeFileSync(MASTER_PATH, JSON.stringify(master, null, 2));
}

// ─── Gap Detection (replaces PG CTE query) ─────────────────────────────

function detectGaps(rawManifest, master) {
  const goldRepos = new Set();
  for (const entry of master.entries) {
    // Match entries to repos by checking if repo name appears in title/content/file_path
    for (const repoName of Object.keys(rawManifest.repos)) {
      const lower = repoName.toLowerCase();
      if ((entry.title || '').toLowerCase().includes(lower) ||
          (entry.file_path || '').toLowerCase().includes(lower)) {
        goldRepos.add(repoName);
      }
    }
  }

  const gaps = [];
  for (const [repoName, info] of Object.entries(rawManifest.repos)) {
    if (info.chunkCount < MIN_CHUNKS_FOR_ENTRY) continue;
    if (SINGLE_REPO && repoName !== SINGLE_REPO) continue;

    const hasGold = goldRepos.has(repoName);
    if (FORCE || !hasGold) {
      gaps.push({
        package_name: repoName,
        chunk_count: info.chunkCount,
        status: hasGold ? 'STALE' : 'GAP',
        lastUpdated: info.lastUpdated,
      });
    }
  }

  gaps.sort((a, b) => (a.status === 'GAP' ? 0 : 1) - (b.status === 'GAP' ? 0 : 1));
  return gaps.slice(0, MAX_NEW_ENTRIES_PER_RUN);
}

// ─── LLM Synthesis ─────────────────────────────────────────────────────

async function synthesizeGoldEntry(repoName, chunks, existingTitles) {
  if (!OPENROUTER_KEY) { log('  No OPENROUTER_API_KEY — skipping synthesis'); return null; }

  // Sample representative chunks (prefer README, longest first)
  const sorted = [...chunks].sort((a, b) => b.content.length - a.content.length);
  const readmeChunks = sorted.filter(c => /readme|overview|getting.started/i.test(c.path || ''));
  const sample = [...readmeChunks.slice(0, 3), ...sorted.slice(0, 5)].slice(0, 8);
  const context = sample.map(c => c.content.slice(0, 1500)).join('\n\n---\n\n');

  const prompt = 'You are a technical writer creating expert teaching entries for the RuvNet knowledge base.\n\n' +
    'Based on these code/documentation chunks from the "' + repoName + '" repository, write 1-5 teaching-quality knowledge base entries.\n\n' +
    '--- SOURCE CHUNKS ---\n' + context + '\n--- END CHUNKS ---\n\n' +
    'EXISTING TITLES (do NOT duplicate): ' + existingTitles.join(', ') + '\n\n' +
    'Return a JSON array. Each entry: { "title": "...", "content": "... (500-2000 words, plain English, analogies)", "category": "one of: agents, vector-db, architecture, security, neural, swarms, deployment, performance, teaching, general, wasm-local-llm, memory, algorithms", "quality_score": 85-100 }';

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OPENROUTER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: LLM_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 4096 }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const entries = JSON.parse(jsonMatch[0]);
    return entries.filter(e => e.title && e.content && e.content.length >= 200);
  } catch (e) {
    log('  LLM error: ' + e.message);
    return null;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  log('==================================================');
  log('KB Auto-Curate v3.0.0 (PG-FREE)');
  log('==================================================\n');

  const rawManifest = loadRawManifest();
  const master = loadMaster();
  const repoCount = Object.keys(rawManifest.repos).length;

  log('Raw repos: ' + repoCount + ', Gold entries: ' + master.entryCount);

  // Detect gaps
  const gaps = detectGaps(rawManifest, master);
  log('Gaps found: ' + gaps.length + ' (' + gaps.filter(g => g.status === 'GAP').length + ' new, ' + gaps.filter(g => g.status === 'STALE').length + ' stale)');

  if (gaps.length === 0) { log('No gaps. KB is up to date.'); return; }

  for (const gap of gaps) {
    log('  ' + gap.status + ': ' + gap.package_name + ' (' + gap.chunk_count + ' chunks)');
  }

  if (DRY_RUN) { log('\nDry run — no changes made.'); return; }

  // Initialize ONNX
  log('\nLoading ONNX...');
  await initOnnx();

  let created = 0, updated = 0, errors = 0;

  for (const gap of gaps) {
    log('\nProcessing: ' + gap.package_name);

    // Load raw chunks for this repo
    const chunks = loadRepoChunks(gap.package_name);
    if (chunks.length === 0) { log('  No chunks found — skipping'); continue; }

    // Get existing titles to avoid duplication
    const existingTitles = master.entries
      .filter(e => (e.title || '').toLowerCase().includes(gap.package_name.toLowerCase()))
      .map(e => e.title);

    // Synthesize with LLM
    const newEntries = await synthesizeGoldEntry(gap.package_name, chunks, existingTitles);
    if (!newEntries || newEntries.length === 0) { log('  No entries synthesized'); errors++; continue; }

    // Embed and upsert to kb-master.json
    for (const entry of newEntries) {
      if (entry.quality_score < QUALITY_THRESHOLD) { log('  Skipping "' + entry.title + '" — quality ' + entry.quality_score); continue; }

      const text = (entry.title + '\n' + entry.content).substring(0, 2000);
      const embResult = await onnxSvc.embed(text);
      const embedding = Array.from(embResult.embedding);
      const filePath = 'auto-curated/' + gap.package_name + '/' + slug(entry.title);

      const existingIdx = master.entries.findIndex(e => e.file_path === filePath);
      const record = {
        id: 'curated_' + slug(entry.title),
        title: entry.title,
        content: entry.content,
        category: entry.category,
        quality_score: entry.quality_score,
        file_path: filePath,
        embedding: embedding,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        record.created_at = master.entries[existingIdx].created_at;
        master.entries[existingIdx] = record;
        updated++;
        log('  Updated: "' + entry.title + '"');
      } else {
        master.entries.push(record);
        created++;
        log('  Created: "' + entry.title + '"');
      }
    }
  }

  // Save kb-master.json
  saveMaster(master);
  log('\nSaved kb-master.json: ' + master.entryCount + ' entries');

  // Summary
  log('\n==================================================');
  log('Curation Complete — ' + created + ' created, ' + updated + ' updated, ' + errors + ' errors');
  log('Time: ' + ((Date.now() - startTime) / 1000).toFixed(1) + 's');
  log('==================================================');

  // Optional rebuild
  if (REBUILD && (created > 0 || updated > 0)) {
    log('\nTriggering RVF rebuild...');
    try {
      execFileSync(NODE_BIN, [path.join(ROOT, 'scripts/build-lean-rvf.mjs')], { cwd: ROOT, stdio: 'inherit', timeout: 300000 });
      execFileSync(NODE_BIN, [path.join(ROOT, 'scripts/build-quantized-rvf.mjs')], { cwd: ROOT, stdio: 'inherit', timeout: 120000 });
      execFileSync(NODE_BIN, [path.join(ROOT, 'scripts/export-mcp-kb.mjs'), '--output', 'kb-data/'], { cwd: ROOT, stdio: 'inherit', timeout: 120000 });
      log('RVF rebuild + MCP export complete.');
    } catch (err) {
      log('WARNING: RVF rebuild failed: ' + err.message);
    }
  } else if (created > 0 || updated > 0) {
    log('\nRun with --rebuild to automatically rebuild RVF after curation.');
  }
}

main().catch(err => { log('FATAL: ' + err.message); process.exit(1); });
