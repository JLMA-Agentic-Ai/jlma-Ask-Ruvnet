#!/usr/bin/env node
/**
 * fetch-adrs.mjs — Pull all ADRs from RuLake and RuVector to local cache.
 *
 * Output:
 *   data/adrs-cache/<bucket>/<name>.md
 *   data/adrs-cache/inventory.json
 *
 * Concurrency: 20 parallel fetches. Resumable (size-matched cache hits skip).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT  = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'data/adrs-cache');

const SOURCES = [
  { repo: 'ruvnet/RuLake',   apiPath: 'docs/adrs',                       cacheDir: 'rulake' },
  { repo: 'ruvnet/RuVector', apiPath: 'docs/adr',                        cacheDir: 'ruvector' },
  { repo: 'ruvnet/RuVector', apiPath: 'docs/adr/coherence-engine',       cacheDir: 'ruvector-coherence' },
  { repo: 'ruvnet/RuVector', apiPath: 'docs/adr/delta-behavior',         cacheDir: 'ruvector-delta' },
  { repo: 'ruvnet/RuVector', apiPath: 'docs/adr/quantum-engine',         cacheDir: 'ruvector-quantum' },
  { repo: 'ruvnet/RuVector', apiPath: 'docs/adr/temporal-tensor-store',  cacheDir: 'ruvector-temporal' },
];

function listDir(repo, apiPath) {
  // execFileSync — no shell, no injection vector. Inputs are hardcoded constants above.
  const out = execFileSync('gh', ['api', `repos/${repo}/contents/${apiPath}`], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  return JSON.parse(out)
    .filter(f => f.type === 'file' && f.name.endsWith('.md') && f.name !== 'README.md')
    .map(f => ({ name: f.name, size: f.size, url: f.download_url, sha: f.sha }));
}

async function fetchOne(file, dir) {
  const dest = path.join(CACHE, dir, file.name);
  if (fs.existsSync(dest) && fs.statSync(dest).size === file.size) return { ...file, cached: true };
  const res = await fetch(file.url);
  if (!res.ok) throw new Error(`${file.url}: HTTP ${res.status}`);
  const md = await res.text();
  fs.writeFileSync(dest, md);
  return { ...file, cached: false };
}

async function pool(items, fn, concurrency = 20) {
  const results = new Array(items.length);
  let i = 0, completed = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await fn(items[idx]); }
      catch (e) { results[idx] = { error: e.message, item: items[idx] }; }
      completed++;
      if (completed % 25 === 0) process.stdout.write(`\r  fetched ${completed}/${items.length}`);
    }
  });
  await Promise.all(workers);
  process.stdout.write(`\r  fetched ${completed}/${items.length}\n`);
  return results;
}

async function main() {
  const inventory = { fetchedAt: new Date().toISOString(), sources: [] };
  let totalFiles = 0, totalErrors = 0;

  for (const src of SOURCES) {
    console.log(`\n→ ${src.repo}/${src.apiPath}`);
    fs.mkdirSync(path.join(CACHE, src.cacheDir), { recursive: true });
    const files = listDir(src.repo, src.apiPath);
    console.log(`  found ${files.length} ADRs`);
    const results = await pool(files, (f) => fetchOne(f, src.cacheDir), 20);
    const errors = results.filter(r => r.error);
    const cached = results.filter(r => !r.error && r.cached).length;
    const fresh  = results.filter(r => !r.error && !r.cached).length;
    console.log(`  cached=${cached} fresh=${fresh} errors=${errors.length}`);
    if (errors.length) errors.forEach(e => console.error(`  ✗ ${e.item.name}: ${e.error}`));
    totalFiles += files.length; totalErrors += errors.length;
    inventory.sources.push({
      repo: src.repo, apiPath: src.apiPath, cacheDir: src.cacheDir,
      count: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, sha: f.sha })),
    });
  }

  fs.writeFileSync(path.join(CACHE, 'inventory.json'), JSON.stringify(inventory, null, 2));
  console.log(`\n✅ Fetched ${totalFiles} ADRs total (${totalErrors} errors)`);
  console.log(`   Inventory: ${path.relative(ROOT, path.join(CACHE, 'inventory.json'))}`);
}

main().catch(e => { console.error(e); process.exit(1); });
