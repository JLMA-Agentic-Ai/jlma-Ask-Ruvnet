#!/usr/bin/env node
/**
 * integrity-check.mjs — Run on every startup. Checks everything.
 * Reports problems to stdout so they show up in Railway logs.
 * Exit 0 always (don't block startup), but log LOUD warnings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const problems = [];

function check(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  OK: ${name}`);
    } else {
      problems.push(`${name}: ${result}`);
      console.log(`  FAIL: ${name} — ${result}`);
    }
  } catch (err) {
    problems.push(`${name}: ${err.message}`);
    console.log(`  FAIL: ${name} — ${err.message}`);
  }
}

console.log('=== Ask-RuvNet Integrity Check ===');

// 1. knowledge.rvf exists and is reasonable size
check('knowledge.rvf exists', () => {
  const p = path.join(ROOT, 'knowledge.rvf');
  if (!fs.existsSync(p)) return 'MISSING';
  const size = fs.statSync(p).size;
  if (size > 10_000_000) return `TOO LARGE: ${(size/1024/1024).toFixed(1)}MB (should be <1MB, was it rebuilt from 180K entries?)`;
  if (size < 100_000) return `TOO SMALL: ${(size/1024).toFixed(0)}KB`;
  return true;
});

// 2. content-sidecar exists
check('content-sidecar.json.gz exists', () => {
  const p = path.join(ROOT, 'content-sidecar.json.gz');
  if (!fs.existsSync(p)) return 'MISSING';
  return true;
});

// 3. Entry count consistency
check('Entry count consistency', () => {
  const sidecar = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'content-sidecar.json.gz'))));
  const sidecarCount = Object.keys(sidecar).length;

  // Check both source and dist locations (Docker build removes src/ui/src but keeps public/)
  const metaPaths = [
    path.join(ROOT, 'src/ui/public/assets/knowledge-meta.json'),
    path.join(ROOT, 'src/ui/dist/assets/knowledge-meta.json'),
  ];
  let metaCount = 0;
  for (const mp of metaPaths) {
    if (fs.existsSync(mp)) {
      try {
        metaCount = JSON.parse(fs.readFileSync(mp)).length;
        if (metaCount > 0) break;
      } catch {}
    }
  }

  if (sidecarCount !== metaCount) {
    return `MISMATCH: sidecar=${sidecarCount}, meta=${metaCount}`;
  }
  return true;
});

// 4. NLM heartbeat
check('NLM nightly refresh', () => {
  const hbPath = path.join(ROOT, 'scripts/nlm-heartbeat.json');
  if (!fs.existsSync(hbPath)) return 'No heartbeat file — nightly pipeline may not be configured';
  const hb = JSON.parse(fs.readFileSync(hbPath, 'utf8'));

  if (hb.authStatus === 'auth_expired') return 'AUTH EXPIRED — run: nlm login';
  if (hb.consecutiveFailures > 0) return `${hb.consecutiveFailures} consecutive failures. Last error: ${hb.lastError}`;

  if (hb.lastSuccess) {
    const hoursSince = (Date.now() - new Date(hb.lastSuccess).getTime()) / 3600000;
    if (hoursSince > 48) return `Last success was ${Math.round(hoursSince)}h ago (should be <48h)`;
  }
  return true;
});

// 5. Package version matches what we expect
check('Version sanity', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const version = pkg.version;
  if (!version.startsWith('4.')) return `Version ${version} — expected 4.x`;
  return true;
});

// 6. Key PDF assets exist
check('CEO deck exists', () => {
  const candidates = ['CEO-Deck-RuvNet-2026-v2.pdf'];
  for (const f of candidates) {
    if (fs.existsSync(path.join(ROOT, 'src/ui/public/assets/docs', f))) return true;
  }
  return 'No CEO deck PDF found';
});

// 7. Product images exist
check('Product images', () => {
  const required = ['hero-ecosystem.png', 'card-ruflo.png', 'card-ruvector.png', 'card-pi.png', 'card-aimds.png'];
  const missing = required.filter(f => !fs.existsSync(path.join(ROOT, 'src/ui/public/assets/product', f)));
  if (missing.length > 0) return `Missing: ${missing.join(', ')}`;
  return true;
});

// Summary
console.log('');
if (problems.length === 0) {
  console.log('=== ALL CHECKS PASSED ===');
} else {
  console.log(`=== ${problems.length} PROBLEM(S) FOUND ===`);
  problems.forEach(p => console.log(`  !! ${p}`));
}

// Write results to a file the server can read
const results = {
  timestamp: new Date().toISOString(),
  passed: problems.length === 0,
  problems,
  checksRun: 7,
};
fs.writeFileSync(path.join(ROOT, 'scripts/integrity-results.json'), JSON.stringify(results, null, 2));
