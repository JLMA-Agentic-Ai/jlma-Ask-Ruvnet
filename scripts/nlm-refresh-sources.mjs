#!/usr/bin/env node
/**
 * nlm-refresh-sources.mjs
 *
 * Automated NotebookLM source refresh pipeline.
 * Detects GitHub repo/gist changes via commit SHA polling,
 * then deletes + re-adds stale sources in NotebookLM.
 *
 * Usage:
 *   node scripts/nlm-refresh-sources.mjs               # normal run
 *   node scripts/nlm-refresh-sources.mjs --dry-run      # detect changes only
 *   node scripts/nlm-refresh-sources.mjs --force         # refresh ALL sources
 *   node scripts/nlm-refresh-sources.mjs --source ruflo  # single source by ID prefix
 *   node scripts/nlm-refresh-sources.mjs --check-auth    # verify auth works
 *   node scripts/nlm-refresh-sources.mjs --bootstrap     # first-run: sync NLM source IDs
 *
 * Updated: 2026-03-06 11:30:00 EST | Version 1.0.0
 * Created: 2026-03-06
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REGISTRY_FILE = path.join(__dirname, 'nlm-url-registry.json');
const STATE_FILE = path.join(PROJECT_ROOT, 'data', '.nlm-refresh-state.json');
const AUDIT_LOG = path.join(PROJECT_ROOT, 'logs', 'nlm-refresh-audit.jsonl');

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_REQUEST_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const CHECK_AUTH = args.includes('--check-auth');
const BOOTSTRAP = args.includes('--bootstrap');
const SOURCE_FILTER = args.includes('--source')
  ? args[args.indexOf('--source') + 1]
  : null;
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// ---------------------------------------------------------------------------
// State management (pattern from monitor-ruvnet-repos.mjs)
// ---------------------------------------------------------------------------

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn(`[nlm-refresh] Warning: could not read state file: ${err.message}`);
  }
  return { sources: {}, lastRun: null, runCount: 0 };
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    throw new Error(`Registry not found: ${REGISTRY_FILE}\nRun the setup first.`);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

function audit(entry) {
  const dir = path.dirname(AUDIT_LOG);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() });
  fs.appendFileSync(AUDIT_LOG, line + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// HTTP helpers (pattern from monitor-ruvnet-repos.mjs)
// ---------------------------------------------------------------------------

// Try to get GitHub token from env or gh CLI
let _ghToken = null;
function getGitHubToken() {
  if (_ghToken !== null) return _ghToken;
  _ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  if (!_ghToken) {
    try {
      _ghToken = execFileSync('/opt/homebrew/bin/gh', ['auth', 'token'], {
        encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      if (_ghToken) console.log('[nlm-refresh] Using GitHub token from gh CLI (5000 req/hr)');
    } catch {
      _ghToken = '';
      console.warn('[nlm-refresh] No GitHub token found — using unauthenticated API (60 req/hr)');
    }
  }
  return _ghToken;
}

async function httpGet(url, headers = {}) {
  const ghToken = getGitHubToken();
  const defaultHeaders = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'AskRuvNet-NLM-Refresh/1.0',
  };
  if (ghToken) defaultHeaders['Authorization'] = `Bearer ${ghToken}`;

  const res = await fetch(url, { headers: { ...defaultHeaders, ...headers } });

  const remaining = res.headers.get('x-ratelimit-remaining');
  if (remaining !== null && parseInt(remaining) < 10) {
    const resetTs = res.headers.get('x-ratelimit-reset');
    const resetDate = resetTs ? new Date(parseInt(resetTs) * 1000).toISOString() : 'unknown';
    console.warn(`[nlm-refresh] GitHub rate limit low: ${remaining} remaining, resets at ${resetDate}`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// NLM CLI helpers (uses execFileSync for safety — no shell injection)
// ---------------------------------------------------------------------------

function getNlmBin() {
  return loadRegistry().nlmBin;
}

function nlmExec(argsArray, timeout = 60000) {
  const nlmBin = getNlmBin();
  if (VERBOSE) console.log(`  $ ${nlmBin} ${argsArray.join(' ')}`);
  try {
    const result = execFileSync(nlmBin, argsArray, {
      encoding: 'utf8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    if (stderr.includes('401') || stderr.includes('auth') || stderr.includes('login')) {
      throw new Error('AUTH_EXPIRED');
    }
    throw err;
  }
}

function nlmExecJson(argsArray, timeout = 60000) {
  const raw = nlmExec(argsArray, timeout);
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Change detection
// ---------------------------------------------------------------------------

/**
 * Check if a GitHub repo has new commits since lastSha.
 * Returns { changed: boolean, currentSha: string | null }
 */
async function checkGitHubRepo(owner, repo, lastSha) {
  try {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=1`;
    const commits = await httpGet(url);
    if (!Array.isArray(commits) || commits.length === 0) {
      return { changed: false, currentSha: lastSha };
    }
    const currentSha = commits[0].sha;
    const changed = !lastSha || lastSha !== currentSha;
    return { changed, currentSha };
  } catch (err) {
    console.warn(`  Could not check ${owner}/${repo}: ${err.message}`);
    return { changed: false, currentSha: lastSha };
  }
}

/**
 * Check if a GitHub gist has been updated.
 * Returns { changed: boolean, currentUpdatedAt: string | null }
 */
async function checkGitHubGist(gistId, lastUpdatedAt) {
  try {
    const url = `${GITHUB_API_BASE}/gists/${gistId}`;
    const gist = await httpGet(url);
    const currentUpdatedAt = gist.updated_at || null;
    const changed = !lastUpdatedAt || lastUpdatedAt !== currentUpdatedAt;
    return { changed, currentUpdatedAt };
  } catch (err) {
    console.warn(`  Could not check gist ${gistId}: ${err.message}`);
    return { changed: false, currentUpdatedAt: lastUpdatedAt };
  }
}

// ---------------------------------------------------------------------------
// NLM source operations
// ---------------------------------------------------------------------------

/**
 * Delete a source from NotebookLM by its source ID.
 */
function deleteNlmSource(notebookId, sourceId) {
  try {
    nlmExec(['source', 'delete', sourceId, '--confirm'], 30000);
    return true;
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') throw err;
    console.warn(`  Delete warning for ${sourceId}: ${err.message?.slice(0, 100)}`);
    return true; // 404 = already gone
  }
}

/**
 * Add a URL source to NotebookLM.
 * Returns the new source ID or null.
 */
function addNlmSource(notebookId, url) {
  try {
    const result = nlmExecJson(
      ['source', 'add', notebookId, '--type', 'url', '--url', url],
      120000
    );
    if (typeof result === 'object' && result.id) {
      return result.id;
    }
    if (typeof result === 'string') {
      const match = result.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (match) return match[1];
    }
    console.warn(`  Could not extract source ID from add response`);
    return null;
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') throw err;
    console.error(`  Add failed for ${url}: ${err.message?.slice(0, 100)}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bootstrap: match existing NLM sources to registry entries by URL
// ---------------------------------------------------------------------------

async function bootstrapSources(registry, state) {
  console.log('[nlm-refresh] Bootstrapping: syncing NLM source IDs to registry...');
  const notebookId = registry.notebookId;

  let nlmSources;
  try {
    nlmSources = nlmExecJson(['source', 'list', notebookId], 30000);
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') {
      console.error('[nlm-refresh] Auth expired. Run: nlm login');
      process.exit(2);
    }
    throw err;
  }

  if (!Array.isArray(nlmSources)) {
    console.error('[nlm-refresh] Could not list NLM sources');
    return state;
  }

  console.log(`  Found ${nlmSources.length} sources in NotebookLM`);

  // Build URL -> NLM source map
  const urlToNlm = new Map();
  for (const src of nlmSources) {
    if (src.url) {
      const normalizedUrl = src.url.replace(/\/$/, '').toLowerCase();
      urlToNlm.set(normalizedUrl, { id: src.id, title: src.title });
    }
  }

  let matched = 0;
  for (const source of registry.sources) {
    if (!source.url) continue;
    const normalizedUrl = source.url.replace(/\/$/, '').toLowerCase();
    const nlmMatch = urlToNlm.get(normalizedUrl);

    if (nlmMatch) {
      if (!state.sources[source.nlmSourceId]) {
        state.sources[source.nlmSourceId] = {};
      }
      state.sources[source.nlmSourceId].managedNlmId = nlmMatch.id;
      state.sources[source.nlmSourceId].matchedTitle = nlmMatch.title;
      matched++;
    }
  }

  console.log(`  Matched ${matched}/${registry.sources.length} registry entries to NLM sources`);
  return state;
}

// ---------------------------------------------------------------------------
// Main refresh logic
// ---------------------------------------------------------------------------

async function refreshSources() {
  const registry = loadRegistry();
  let state = loadState();
  const notebookId = registry.notebookId;

  console.log('=== NotebookLM Source Refresh ===');
  console.log(`Notebook: ${notebookId}`);
  console.log(`Mode: ${FORCE ? 'FORCE' : DRY_RUN ? 'DRY RUN' : 'incremental'}`);
  if (SOURCE_FILTER) console.log(`Filter: ${SOURCE_FILTER}`);
  console.log(`Sources: ${registry.sources.length} total`);
  console.log('');

  // Auth pre-flight
  try {
    nlmExec(['notebook', 'list'], 15000);
    console.log('[nlm-refresh] Auth: OK');
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') {
      console.error('[nlm-refresh] Auth expired. Run: nlm login');
      audit({ event: 'auth_expired', exitCode: 2 });
      process.exit(2);
    }
    throw err;
  }

  // Bootstrap on first run (or explicit --bootstrap)
  if (BOOTSTRAP || !state.lastRun) {
    state = await bootstrapSources(registry, state);
    if (!DRY_RUN) saveState(state);
    if (BOOTSTRAP) {
      console.log('\n[nlm-refresh] Bootstrap complete.');
      return;
    }
  }

  // Filter sources
  let sources = registry.sources.filter(s => s.enabled !== false);
  if (SOURCE_FILTER) {
    sources = sources.filter(s =>
      s.nlmSourceId.includes(SOURCE_FILTER) ||
      (s.repo && s.repo.includes(SOURCE_FILTER)) ||
      (s.title && s.title.toLowerCase().includes(SOURCE_FILTER.toLowerCase()))
    );
    console.log(`Filtered to ${sources.length} source(s)`);
  }

  const stats = { checked: 0, changed: 0, refreshed: 0, errors: 0, skipped: 0 };

  for (const source of sources) {
    const sourceState = state.sources[source.nlmSourceId] || {};
    let changed = false;
    let newStateData = { ...sourceState };

    // --- Change detection by category ---
    if (source.category === 'github-repo' && source.owner && source.repo) {
      stats.checked++;
      const result = await checkGitHubRepo(source.owner, source.repo, sourceState.lastSha);
      changed = result.changed;
      newStateData.lastSha = result.currentSha;

      if (VERBOSE || changed) {
        const status = changed ? 'CHANGED' : 'up-to-date';
        console.log(`  [${status}] ${source.owner}/${source.repo} (${result.currentSha?.slice(0, 7) || '???'})`);
      }
      await delay(GITHUB_REQUEST_DELAY_MS);

    } else if (source.category === 'github-gist' && source.gistId) {
      stats.checked++;
      const result = await checkGitHubGist(source.gistId, sourceState.lastUpdatedAt);
      changed = result.changed;
      newStateData.lastUpdatedAt = result.currentUpdatedAt;

      if (VERBOSE || changed) {
        const status = changed ? 'CHANGED' : 'up-to-date';
        console.log(`  [${status}] gist:${source.gistId.slice(0, 8)}`);
      }
      await delay(GITHUB_REQUEST_DELAY_MS);

    } else if (source.refreshPolicy === 'weekly') {
      const lastRefresh = sourceState.lastRefreshedAt
        ? new Date(sourceState.lastRefreshedAt)
        : null;
      const daysSince = lastRefresh
        ? (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;
      changed = daysSince >= 7;
      stats.checked++;

      if (VERBOSE || changed) {
        console.log(`  [${changed ? 'DUE' : 'fresh'}] ${source.title || source.url} (${daysSince === Infinity ? 'never' : daysSince.toFixed(0) + 'd ago'})`);
      }

    } else if (source.refreshPolicy === 'manual') {
      stats.skipped++;
      continue;
    }

    // Force mode overrides change detection
    if (FORCE && source.url) changed = true;

    if (!changed) continue;
    stats.changed++;

    // --- Refresh in NotebookLM ---
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would refresh: ${source.url || source.title}`);
      continue;
    }

    if (!source.url) {
      console.log(`  [SKIP] No URL for: ${source.title}`);
      stats.skipped++;
      continue;
    }

    try {
      // Delete existing source
      const existingNlmId = sourceState.managedNlmId || source.nlmSourceId;
      if (existingNlmId) {
        console.log(`  Deleting old source ${existingNlmId.slice(0, 8)}...`);
        deleteNlmSource(notebookId, existingNlmId);
        await delay(1000);
      }

      // Add fresh source
      console.log(`  Adding fresh: ${source.url}`);
      const newNlmId = addNlmSource(notebookId, source.url);

      if (newNlmId) {
        newStateData.managedNlmId = newNlmId;
        newStateData.lastRefreshedAt = new Date().toISOString();
        newStateData.consecutiveErrors = 0;
        stats.refreshed++;
        audit({
          event: 'refreshed',
          source: source.nlmSourceId,
          url: source.url,
          oldNlmId: existingNlmId,
          newNlmId,
        });
        console.log(`  OK: ${newNlmId.slice(0, 8)}`);
      } else {
        newStateData.managedNlmId = null;
        stats.errors++;
        audit({ event: 'add_failed', source: source.nlmSourceId, url: source.url });
      }

      await delay(2000); // Throttle NLM operations

    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') {
        console.error('\n[nlm-refresh] Auth expired mid-run. Saving state and exiting.');
        audit({ event: 'auth_expired_mid_run', lastSource: source.nlmSourceId });
        state.sources[source.nlmSourceId] = newStateData;
        state.lastRun = new Date().toISOString();
        saveState(state);
        process.exit(2);
      }

      stats.errors++;
      const consecutiveErrors = (sourceState.consecutiveErrors || 0) + 1;
      newStateData.consecutiveErrors = consecutiveErrors;

      if (consecutiveErrors >= 3) {
        console.warn(`  [SKIP] ${source.url} — ${consecutiveErrors} consecutive errors, skipping`);
        audit({ event: 'skipped_errors', source: source.nlmSourceId, errors: consecutiveErrors });
      } else {
        console.error(`  [ERROR] ${source.url}: ${err.message?.slice(0, 100)}`);
        audit({ event: 'error', source: source.nlmSourceId, error: err.message?.slice(0, 200) });
      }
    }

    state.sources[source.nlmSourceId] = newStateData;
  }

  // Save final state
  state.lastRun = new Date().toISOString();
  state.runCount = (state.runCount || 0) + 1;
  if (!DRY_RUN) saveState(state);

  // Summary
  console.log('\n=== Refresh Summary ===');
  console.log(`Checked:   ${stats.checked}`);
  console.log(`Changed:   ${stats.changed}`);
  console.log(`Refreshed: ${stats.refreshed}`);
  console.log(`Errors:    ${stats.errors}`);
  console.log(`Skipped:   ${stats.skipped}`);

  audit({ event: 'run_complete', mode: FORCE ? 'force' : DRY_RUN ? 'dry-run' : 'incremental', stats });
}

// ---------------------------------------------------------------------------
// Check-auth mode
// ---------------------------------------------------------------------------

async function checkAuth() {
  console.log('[nlm-refresh] Checking NLM authentication...');
  try {
    const notebooks = nlmExecJson(['notebook', 'list'], 15000);
    if (Array.isArray(notebooks)) {
      console.log(`Auth OK. ${notebooks.length} notebook(s) accessible.`);
      const target = notebooks.find(n => n.id === loadRegistry().notebookId);
      if (target) {
        console.log(`Target notebook: "${target.title}" (${target.source_count} sources)`);
      } else {
        console.warn('Target notebook not found in listing!');
      }
    } else {
      console.log('Auth OK (non-array response).');
    }
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') {
      console.error('Auth EXPIRED. Run: nlm login');
      process.exit(2);
    }
    console.error(`Auth check failed: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (CHECK_AUTH) {
  checkAuth().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
} else {
  refreshSources().catch(err => {
    console.error('Fatal:', err);
    audit({ event: 'fatal_error', error: err.message });
    process.exit(1);
  });
}
