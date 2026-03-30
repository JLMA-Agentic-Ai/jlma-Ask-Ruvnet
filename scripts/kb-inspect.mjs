#!/usr/bin/env node
/**
 * kb-inspect.mjs — Inspect and query kb-master.json (replaces ad-hoc SQL)
 *
 * Usage:
 *   node scripts/kb-inspect.mjs                     # summary stats
 *   node scripts/kb-inspect.mjs --list              # list all titles
 *   node scripts/kb-inspect.mjs --category security # filter by category
 *   node scripts/kb-inspect.mjs --search "attention" # search titles/content
 *   node scripts/kb-inspect.mjs --id kb_42          # show single entry
 *   node scripts/kb-inspect.mjs --categories        # category breakdown
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MASTER_PATH = path.join(ROOT, 'kb-master.json');

if (!fs.existsSync(MASTER_PATH)) {
  console.error('kb-master.json not found');
  process.exit(1);
}

const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
const entries = master.entries;
const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : null;
}

if (args.includes('--categories')) {
  const cats = {};
  entries.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
  console.log('\nCategory Breakdown:');
  Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`  ${c.padEnd(20)} ${n}`);
  });
  console.log(`\n  TOTAL${' '.repeat(15)}${entries.length}`);
} else if (args.includes('--list')) {
  const cat = getArg('--category');
  const filtered = cat ? entries.filter(e => e.category === cat) : entries;
  filtered.sort((a, b) => a.title.localeCompare(b.title)).forEach(e => {
    console.log(`  [${e.category}] ${e.title} (q:${e.quality_score})`);
  });
  console.log(`\n${filtered.length} entries`);
} else if (args.includes('--search')) {
  const q = getArg('--search').toLowerCase();
  const matches = entries.filter(e =>
    e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
  );
  matches.forEach(e => {
    console.log(`  [${e.category}] ${e.title} (q:${e.quality_score})`);
  });
  console.log(`\n${matches.length} matches for "${q}"`);
} else if (args.includes('--id')) {
  const id = getArg('--id');
  const entry = entries.find(e => e.id === id);
  if (entry) {
    console.log(`Title: ${entry.title}`);
    console.log(`Category: ${entry.category}`);
    console.log(`Quality: ${entry.quality_score}`);
    console.log(`File Path: ${entry.file_path}`);
    console.log(`Created: ${entry.created_at}`);
    console.log(`---`);
    console.log(entry.content);
  } else {
    console.log(`Entry ${id} not found`);
  }
} else {
  // Summary stats
  const cats = {};
  let minQ = 100, maxQ = 0, sumQ = 0;
  entries.forEach(e => {
    cats[e.category] = (cats[e.category] || 0) + 1;
    if (e.quality_score < minQ) minQ = e.quality_score;
    if (e.quality_score > maxQ) maxQ = e.quality_score;
    sumQ += e.quality_score;
  });
  const avgQ = (sumQ / entries.length).toFixed(1);
  const hasEmb = entries.filter(e => e.embedding?.length === 384).length;
  const sizeMB = (fs.statSync(MASTER_PATH).size / 1024 / 1024).toFixed(1);

  console.log(`\n=== KB Master Summary ===`);
  console.log(`  Entries:      ${entries.length}`);
  console.log(`  With embeddings: ${hasEmb}`);
  console.log(`  Categories:   ${Object.keys(cats).length}`);
  console.log(`  Quality:      min=${minQ} avg=${avgQ} max=${maxQ}`);
  console.log(`  File size:    ${sizeMB} MB`);
  console.log(`  Format:       ${master.format} v${master.version}`);
  console.log(`  Dimensions:   ${master.dimensions}`);
  console.log(`  Migrated:     ${master.migratedAt || 'N/A'}`);
  console.log(`\nTop categories:`);
  Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([c, n]) => {
    console.log(`  ${c.padEnd(20)} ${n}`);
  });
}
