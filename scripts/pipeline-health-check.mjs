#!/usr/bin/env node
/**
 * pipeline-health-check.mjs — Dead man's switch for the nightly KB pipeline
 *
 * Checks that every step of the nightly pipeline ran successfully.
 * Sends macOS notification if any step is stale or failed.
 *
 * Run manually: node scripts/pipeline-health-check.mjs
 * Or add as a LaunchAgent at 8:00 AM to verify the 4/5/6 AM pipeline.
 *
 * Updated: 2026-03-30 | Version 1.0.0
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MAX_HOURS = 48;
const NOW = Date.now();

function hoursAgo(isoDate) {
  if (!isoDate) return Infinity;
  return (NOW - new Date(isoDate).getTime()) / 3600000;
}

const ALERT_EMAIL = 'sikerr@gmail.com';
const GMAIL_USER = 'sikerr@gmail.com';
const GMAIL_APP_PASSWORD = process.env.PERSONAL_GMAIL_APP_PASSWORD || '';

function notify(title, msg) {
  // macOS notification
  try {
    execFileSync('osascript', ['-e', 'display notification "' + msg.replace(/"/g, '\\"') + '" with title "' + title.replace(/"/g, '\\"') + '"']);
  } catch {}
}

function sendEmail(subject, body) {
  if (!GMAIL_APP_PASSWORD) {
    console.log('  (No PERSONAL_GMAIL_APP_PASSWORD — email skipped)');
    return;
  }
  try {
    const curlArgs = [
      '--ssl-reqd',
      '--url', 'smtps://smtp.gmail.com:465',
      '--user', GMAIL_USER + ':' + GMAIL_APP_PASSWORD,
      '--mail-from', GMAIL_USER,
      '--mail-rcpt', ALERT_EMAIL,
      '-T', '-',
      '--max-time', '15',
    ];
    const emailContent = 'From: Ask-RuvNet Pipeline <' + GMAIL_USER + '>\r\n' +
      'To: ' + ALERT_EMAIL + '\r\n' +
      'Subject: ' + subject + '\r\n' +
      'Content-Type: text/plain; charset=utf-8\r\n' +
      '\r\n' +
      body + '\r\n';
    execFileSync('curl', curlArgs, { input: emailContent, timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('  Email sent to ' + ALERT_EMAIL);
  } catch (e) {
    console.log('  Email failed: ' + (e.message || '').substring(0, 60));
  }
}

function lastJsonlEntry(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
  if (lines.length === 0) return null;
  try { return JSON.parse(lines[lines.length - 1]); } catch { return null; }
}

const issues = [];

// 1. Evergreen (4 AM)
const evEntry = lastJsonlEntry(path.join(ROOT, 'logs', 'kb-evergreen.jsonl'));
if (evEntry) {
  const h = hoursAgo(evEntry.timestamp);
  if (h > MAX_HOURS) issues.push('Evergreen: last run ' + h.toFixed(0) + 'h ago (max ' + MAX_HOURS + 'h)');
  if (evEntry.errors > 0) issues.push('Evergreen: ' + evEntry.errors + ' errors in last run');
} else {
  issues.push('Evergreen: no audit log (logs/kb-evergreen.jsonl)');
}

// 2. Raw manifest (.ruvector/raw/)
const rawManifest = path.join(ROOT, '.ruvector', 'raw', 'manifest.json');
if (fs.existsSync(rawManifest)) {
  const m = JSON.parse(fs.readFileSync(rawManifest, 'utf8'));
  const h = hoursAgo(m.lastRun);
  const repoCount = Object.keys(m.repos || {}).length;
  if (h > MAX_HOURS) issues.push('Raw manifest: lastRun ' + h.toFixed(0) + 'h ago');
  if (repoCount < 50) issues.push('Raw manifest: only ' + repoCount + ' repos (expected 100+)');
} else {
  issues.push('Raw manifest: .ruvector/raw/manifest.json not found');
}

// 3. Curate heartbeat
const curateHb = path.join(ROOT, 'logs', 'kb-curate-heartbeat.json');
if (fs.existsSync(curateHb)) {
  const hb = JSON.parse(fs.readFileSync(curateHb, 'utf8'));
  const h = hoursAgo(hb.lastAttempt);
  if (h > MAX_HOURS) issues.push('Curate: last attempt ' + h.toFixed(0) + 'h ago');
  if (hb.errors > 0) issues.push('Curate: ' + hb.errors + ' errors in last run');
} else {
  // Fall back to checking kb-curate.jsonl
  const curateEntry = lastJsonlEntry(path.join(ROOT, 'logs', 'kb-curate.jsonl'));
  if (curateEntry) {
    const h = hoursAgo(curateEntry.timestamp);
    if (h > MAX_HOURS) issues.push('Curate: last run ' + h.toFixed(0) + 'h ago');
  } else {
    issues.push('Curate: no heartbeat or audit log');
  }
}

// 4. kb-master.json freshness
const masterPath = path.join(ROOT, 'kb-master.json');
if (fs.existsSync(masterPath)) {
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  if (master.entryCount < 100) issues.push('kb-master.json: only ' + master.entryCount + ' entries (expected 400+)');
} else {
  issues.push('kb-master.json: NOT FOUND');
}

// 5. Export pipeline
const exportEntry = lastJsonlEntry(path.join(ROOT, 'logs', 'kb-export-pipeline.jsonl'));
if (exportEntry) {
  const h = hoursAgo(exportEntry.timestamp);
  if (h > MAX_HOURS) issues.push('Export: last run ' + h.toFixed(0) + 'h ago');
} else {
  issues.push('Export: no audit log');
}

// 6. NLM heartbeat
const nlmHb = path.join(ROOT, 'scripts', 'nlm-heartbeat.json');
if (fs.existsSync(nlmHb)) {
  const hb = JSON.parse(fs.readFileSync(nlmHb, 'utf8'));
  const h = hoursAgo(hb.lastSuccess);
  if (h > MAX_HOURS) issues.push('NLM: last success ' + h.toFixed(0) + 'h ago');
  if (hb.consecutiveFailures > 2) issues.push('NLM: ' + hb.consecutiveFailures + ' consecutive failures');
} else {
  issues.push('NLM: no heartbeat');
}

// 7. Production health
try {
  const res = execFileSync('curl', ['-s', '--max-time', '10', 'https://ask-ruvnet.up.railway.app/health'], { timeout: 15000 }).toString();
  const health = JSON.parse(res);
  if (health.status !== 'ok') issues.push('Production: status=' + health.status);
  if (health.checks?.vectorStore?.vectorCount < 100) issues.push('Production: only ' + health.checks.vectorStore.vectorCount + ' vectors');
} catch (e) {
  issues.push('Production: health check failed (' + (e.message || '').substring(0, 50) + ')');
}

// Report
console.log('=== Pipeline Health Check ===');
console.log('Time: ' + new Date().toISOString());
console.log('');

if (issues.length === 0) {
  console.log('ALL OK — no issues detected');
  process.exit(0);
} else {
  console.log(issues.length + ' ISSUE(S) FOUND:\n');
  issues.forEach(i => console.log('  [!] ' + i));
  notify('KB Pipeline Alert', issues.length + ' issue(s). Check logs.');
  sendEmail(
    '[Ask-RuvNet] Pipeline Alert: ' + issues.length + ' issue(s)',
    'Ask-RuvNet Nightly Pipeline Health Check\n' +
    'Time: ' + new Date().toISOString() + '\n\n' +
    'ISSUES:\n' + issues.map(i => '  - ' + i).join('\n') + '\n\n' +
    'Action: Check logs at ~/Code/Ask-Ruvnet/Ask-Ruvnet/logs/\n' +
    'Run: node scripts/pipeline-health-check.mjs\n'
  );
  process.exit(1);
}
