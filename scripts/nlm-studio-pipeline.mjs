#!/usr/bin/env node
/**
 * nlm-studio-pipeline.mjs
 *
 * End-to-end NotebookLM studio orchestration:
 *   1. Read studio registry (prompts, types, filenames)
 *   2. Detect which studios need regeneration (source changes or forced)
 *   3. Delete old artifacts, create new ones from prompts
 *   4. Poll for completion, download to assets dir
 *   5. Update App.jsx RESOURCE_DOCS automatically
 *
 * Usage:
 *   node scripts/nlm-studio-pipeline.mjs --status          # show current state
 *   node scripts/nlm-studio-pipeline.mjs --download-missing # retry failed downloads only
 *   node scripts/nlm-studio-pipeline.mjs --regenerate-all   # delete + recreate all studios
 *   node scripts/nlm-studio-pipeline.mjs --regenerate id    # regenerate one studio by ID
 *   node scripts/nlm-studio-pipeline.mjs --refresh-changed  # only recreate studios whose sources changed
 *   node scripts/nlm-studio-pipeline.mjs --sync-app         # update App.jsx RESOURCE_DOCS from registry
 *   node scripts/nlm-studio-pipeline.mjs --check-auth       # verify NLM auth
 *
 * Updated: 2026-03-07 09:45:00 EST | Version 1.0.0
 * Created: 2026-03-07
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadRegistry() {
  const f = path.join(__dirname, 'nlm-studio-registry.json');
  if (!fs.existsSync(f)) throw new Error(`Registry not found: ${f}`);
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function loadSourceRefreshState() {
  const f = path.join(PROJECT_ROOT, 'data', '.nlm-refresh-state.json');
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function loadStudioState() {
  const reg = loadRegistry();
  const f = path.join(PROJECT_ROOT, reg.stateFile);
  if (!fs.existsSync(f)) return { studios: {}, lastRun: null };
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function saveStudioState(state) {
  const reg = loadRegistry();
  const f = path.join(PROJECT_ROOT, reg.stateFile);
  const dir = path.dirname(f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(state, null, 2));
}

function appendAudit(entry) {
  const reg = loadRegistry();
  const f = path.join(PROJECT_ROOT, reg.auditLog);
  const dir = path.dirname(f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(f, JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const STATUS = args.includes('--status');
const DOWNLOAD_MISSING = args.includes('--download-missing');
const REGENERATE_ALL = args.includes('--regenerate-all');
const REFRESH_CHANGED = args.includes('--refresh-changed');
const SYNC_APP = args.includes('--sync-app');
const CHECK_AUTH = args.includes('--check-auth');
const REGENERATE_ONE = args.includes('--regenerate')
  ? args[args.indexOf('--regenerate') + 1]
  : null;

// ---------------------------------------------------------------------------
// NLM execution helpers
// ---------------------------------------------------------------------------

function nlmExec(reg, argsArray, timeout = 60000) {
  if (VERBOSE) console.log(`  $ ${reg.nlmBin} ${argsArray.join(' ')}`);
  try {
    const result = execFileSync(reg.nlmBin, argsArray, {
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

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Auth check
// ---------------------------------------------------------------------------

function checkAuth(reg) {
  try {
    nlmExec(reg, ['notebook', 'list'], 15000);
    return true;
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') return false;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Get GitHub token for SHA queries
// ---------------------------------------------------------------------------

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync('/opt/homebrew/bin/gh', ['auth', 'token'], {
      encoding: 'utf8', timeout: 5000
    }).trim();
  } catch { return null; }
}

async function httpGet(url, token) {
  const headers = { 'User-Agent': 'nlm-studio-pipeline' };
  if (token) headers['Authorization'] = `token ${token}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// Detect which studios need regeneration based on source changes
// ---------------------------------------------------------------------------

async function detectChangedStudios(reg) {
  const refreshState = loadSourceRefreshState();
  const studioState = loadStudioState();
  const changed = [];

  // Load URL registry once (not per-studio) with error handling
  let urlRegistry = null;
  try {
    const urlRegPath = path.join(__dirname, 'nlm-url-registry.json');
    if (fs.existsSync(urlRegPath)) {
      urlRegistry = JSON.parse(fs.readFileSync(urlRegPath, 'utf8'));
    }
  } catch (err) {
    console.log(`[warn] Could not load nlm-url-registry.json: ${err.message}`);
  }

  for (const studio of reg.studios) {
    if (!studio.enabled) continue;
    if (!studio.sourceIds || studio.sourceIds.length === 0) {
      // Studios using all sources — check if ANY source changed since last studio run
      const lastStudioRun = studioState.studios[studio.id]?.lastCreatedAt;
      if (!lastStudioRun) { changed.push(studio.id); continue; }

      if (refreshState?.lastRun && new Date(refreshState.lastRun) > new Date(lastStudioRun)) {
        // Source refresh ran after this studio was last created — check if anything actually changed
        const sourceEntries = Object.values(refreshState.sources || {});
        const anyRefreshed = sourceEntries.some(s =>
          s.lastRefreshedAt && new Date(s.lastRefreshedAt) > new Date(lastStudioRun)
        );
        if (anyRefreshed) changed.push(studio.id);
      }
      continue;
    }

    // Studios with specific source IDs — check if those specific repos changed
    if (!urlRegistry) continue; // Can't check without URL registry
    const lastStudioRun = studioState.studios[studio.id]?.lastCreatedAt;

    for (const sourceId of studio.sourceIds) {
      // Find this source in the URL registry by NLM ID
      const urlSource = urlRegistry.sources.find(s => {
        const stateEntry = refreshState?.sources?.[s.id];
        return stateEntry?.managedNlmId === sourceId;
      });

      if (!urlSource) continue;
      if (!lastStudioRun) { changed.push(studio.id); break; }

      // Check if this source was refreshed after the studio was created
      const stateEntry = refreshState?.sources?.[urlSource.id];
      if (stateEntry?.lastRefreshedAt && new Date(stateEntry.lastRefreshedAt) > new Date(lastStudioRun)) {
        changed.push(studio.id);
        break;
      }
    }
  }

  return [...new Set(changed)];
}

// ---------------------------------------------------------------------------
// Status display
// ---------------------------------------------------------------------------

async function showStatus() {
  const reg = loadRegistry();
  const state = loadStudioState();
  const assetsDir = path.join(PROJECT_ROOT, reg.assetsDir);

  console.log('=== NLM Studio Pipeline Status ===\n');
  console.log(`Notebook: ${reg.notebookId}`);
  console.log(`Studios:  ${reg.studios.length} configured + ${reg.staticAssets.length} static`);
  console.log(`Last run: ${state.lastRun || 'never'}\n`);

  console.log('Studio                           | Artifact ID      | File Exists | Size');
  console.log('-'.repeat(90));

  for (const studio of reg.studios) {
    const s = state.studios[studio.id] || {};
    const filePath = path.join(assetsDir, studio.filename);
    const exists = fs.existsSync(filePath);
    const size = exists ? `${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(0)}MB` : '-';
    const artId = s.artifactId ? s.artifactId.slice(0, 8) : 'none';
    const name = studio.title.padEnd(32);
    console.log(`${name} | ${artId.padEnd(16)} | ${exists ? '✓' : '✗'.padEnd(11)} | ${size}`);
  }

  for (const asset of reg.staticAssets) {
    const filePath = path.join(assetsDir, asset.filename);
    const exists = fs.existsSync(filePath);
    const size = exists ? `${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(0)}MB` : '-';
    console.log(`${(asset.title + ' (static)').padEnd(32)} | ${'n/a'.padEnd(16)} | ${exists ? '✓' : '✗'.padEnd(11)} | ${size}`);
  }

  // Check for changed sources
  console.log('\n--- Change Detection ---');
  try {
    const changed = await detectChangedStudios(reg);
    if (changed.length === 0) {
      console.log('All studios up to date (no source changes since last creation).');
    } else {
      console.log(`${changed.length} studio(s) have changed sources: ${changed.join(', ')}`);
    }
  } catch (err) {
    console.log(`Change detection error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Download a studio artifact
// ---------------------------------------------------------------------------

async function downloadStudio(reg, studio, artifactId, retries = null) {
  const maxRetries = retries ?? reg.downloadRetries;
  const assetsDir = path.join(PROJECT_ROOT, reg.assetsDir);
  const outputPath = path.join(assetsDir, studio.filename);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`  [download] Attempt ${attempt}/${maxRetries} for ${studio.filename}...`);

    try {
      // Use nlm download <type> <notebookId> --id <artifactId> -o <outputPath>
      const typeMap = {
        audio: 'audio',
        video: 'video',
        slide_deck: 'slide-deck',
        infographic: 'infographic',
        report: 'report',
      };
      const dlType = typeMap[studio.artifactType] || studio.artifactType;
      const dlArgs = ['download', dlType, reg.notebookId, '-o', outputPath, '--no-progress'];
      if (artifactId) dlArgs.push('--id', artifactId);

      nlmExec(reg, dlArgs, 300000);

      if (fs.existsSync(outputPath)) {
        const size = fs.statSync(outputPath).size;
        // Validate: must be > 100KB (HTML error pages are ~1MB of text, valid media is multi-MB binary)
        if (size < 100000) {
          // Check if it's HTML (error page)
          const head = fs.readFileSync(outputPath, 'utf8').slice(0, 200);
          if (head.includes('<!DOCTYPE') || head.includes('<html')) {
            console.log(`  [download] Got HTML error page (${(size/1024).toFixed(0)}KB) — not a valid file.`);
            fs.unlinkSync(outputPath);
            if (attempt < maxRetries) {
              console.log(`  [download] Retrying in ${reg.downloadRetryDelayMs/1000}s...`);
              await delay(reg.downloadRetryDelayMs);
              continue;
            }
            return false;
          }
        }
        console.log(`  [download] Success: ${studio.filename} (${(size / (1024*1024)).toFixed(1)}MB)`);
        return true;
      }
    } catch (err) {
      console.log(`  [download] Failed: ${err.message?.slice(0, 100)}`);
    }

    if (attempt < maxRetries) {
      console.log(`  [download] Retrying in ${reg.downloadRetryDelayMs/1000}s...`);
      await delay(reg.downloadRetryDelayMs);
    }
  }

  console.log(`  [download] All ${maxRetries} attempts failed for ${studio.filename}`);
  return false;
}

// ---------------------------------------------------------------------------
// Create a studio from registry config
// ---------------------------------------------------------------------------

async function createStudio(reg, studio) {
  console.log(`\n[create] ${studio.title} (${studio.artifactType})...`);

  // FIX (2026-03-19): nlm CLI v0.4.9 removed `studio create` command.
  // Use MCP bridge to call the MCP server's studio_create tool directly.
  const bridgePath = path.join(ROOT, 'scripts', 'nlm-mcp-bridge.mjs');
  const bridgeArgs = [
    bridgePath, 'studio_create',
    '--notebook_id', reg.notebookId,
    '--artifact_type', studio.artifactType,
    '--confirm', 'true',
  ];

  if (studio.focusPrompt) {
    bridgeArgs.push('--focus_prompt', studio.focusPrompt);
  }

  if (studio.artifactType === 'audio') {
    if (studio.audioFormat) bridgeArgs.push('--audio_format', studio.audioFormat);
    if (studio.audioLength) bridgeArgs.push('--audio_length', studio.audioLength);
  } else if (studio.artifactType === 'video') {
    if (studio.videoFormat) bridgeArgs.push('--video_format', studio.videoFormat);
    if (studio.visualStyle) bridgeArgs.push('--visual_style', studio.visualStyle);
  } else if (studio.artifactType === 'slide_deck') {
    if (studio.slideFormat) bridgeArgs.push('--slide_format', studio.slideFormat);
  } else if (studio.artifactType === 'infographic') {
    bridgeArgs.push('--infographic_style', studio.infographicStyle || 'professional');
    bridgeArgs.push('--orientation', studio.orientation || 'landscape');
  }

  try {
    const result = execFileSync('/usr/local/bin/node', bridgeArgs, {
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: ROOT,
    }).trim();
    // Extract artifact ID from result
    let artifactId = null;
    try {
      const parsed = JSON.parse(result);
      artifactId = parsed.id || parsed.artifact_id || parsed.studioId;
    } catch {
      const match = result.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (match) artifactId = match[1];
    }

    if (artifactId) {
      console.log(`  [create] Started: ${artifactId}`);
    } else {
      console.log(`  [create] Started (no ID extracted). Raw: ${result.slice(0, 200)}`);
    }
    return artifactId;
  } catch (err) {
    console.error(`  [create] Failed: ${err.message?.slice(0, 200)}`);
    appendAudit({ event: 'create_failed', studioId: studio.id, error: err.message?.slice(0, 200) });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Poll for completion
// ---------------------------------------------------------------------------

async function pollCompletion(reg, artifactId) {
  const startTime = Date.now();
  const timeout = reg.pollTimeoutMs;
  const interval = reg.pollIntervalMs;

  while (Date.now() - startTime < timeout) {
    await delay(interval);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write(`  [poll ${elapsed}s] `);

    try {
      const result = nlmExec(reg, ['studio', 'status', artifactId], 30000);
      let status = 'unknown';
      try {
        const parsed = JSON.parse(result);
        status = parsed.status || parsed.state || 'unknown';
      } catch {
        status = result.toLowerCase().includes('complete') ? 'completed'
          : result.toLowerCase().includes('fail') ? 'failed'
          : 'pending';
      }

      console.log(status);

      if (status === 'completed' || status === 'complete' || status === 'ready') return 'completed';
      if (status === 'failed' || status === 'error') return 'failed';
    } catch (err) {
      console.log(`error: ${err.message?.slice(0, 60)}`);
    }
  }

  return 'timeout';
}

// ---------------------------------------------------------------------------
// Regenerate studios
// ---------------------------------------------------------------------------

async function regenerateStudios(reg, studioIds) {
  const state = loadStudioState();
  const results = { created: 0, downloaded: 0, failed: 0 };

  for (const studioId of studioIds) {
    const studio = reg.studios.find(s => s.id === studioId);
    if (!studio) { console.log(`Unknown studio: ${studioId}`); continue; }
    if (!studio.enabled) { console.log(`Skipping disabled studio: ${studioId}`); continue; }

    // Delete old artifact if exists
    const oldArtifactId = state.studios[studio.id]?.artifactId;
    if (oldArtifactId) {
      console.log(`  [delete] Removing old artifact ${oldArtifactId.slice(0, 8)}...`);
      try {
        nlmExec(reg, ['studio', 'delete', reg.notebookId, '--artifact-id', oldArtifactId, '--confirm'], 30000);
      } catch (err) {
        console.log(`  [delete] Warning: ${err.message?.slice(0, 80)} (continuing)`);
      }
    }

    // Create new
    const newArtifactId = await createStudio(reg, studio);
    if (!newArtifactId) { results.failed++; continue; }

    // Poll
    const status = await pollCompletion(reg, newArtifactId);
    if (status !== 'completed') {
      console.log(`  [poll] ${studio.title}: ${status}`);
      state.studios[studio.id] = {
        ...state.studios[studio.id],
        artifactId: newArtifactId,
        lastStatus: status,
        lastCreatedAt: new Date().toISOString(),
      };
      saveStudioState(state);
      results.failed++;
      continue;
    }

    results.created++;

    // Download
    const downloaded = await downloadStudio(reg, studio, newArtifactId);
    if (downloaded) {
      results.downloaded++;
      state.studios[studio.id] = {
        artifactId: newArtifactId,
        lastStatus: 'downloaded',
        lastCreatedAt: new Date().toISOString(),
        lastDownloadedAt: new Date().toISOString(),
      };
    } else {
      state.studios[studio.id] = {
        ...state.studios[studio.id],
        artifactId: newArtifactId,
        lastStatus: 'completed_not_downloaded',
        lastCreatedAt: new Date().toISOString(),
      };
    }

    saveStudioState(state);
    appendAudit({
      event: downloaded ? 'studio_refreshed' : 'studio_created_download_failed',
      studioId: studio.id,
      artifactId: newArtifactId,
    });

    // Rate limit between studios
    await delay(3000);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Download missing assets
// ---------------------------------------------------------------------------

async function downloadMissing(reg) {
  const state = loadStudioState();
  const assetsDir = path.join(PROJECT_ROOT, reg.assetsDir);
  let downloaded = 0;

  for (const studio of reg.studios) {
    if (!studio.enabled) continue;
    const filePath = path.join(assetsDir, studio.filename);
    if (fs.existsSync(filePath)) continue;

    const artId = state.studios[studio.id]?.artifactId;
    if (!artId) {
      console.log(`  [skip] ${studio.title}: no artifact ID — needs regeneration`);
      continue;
    }

    console.log(`\n[download] ${studio.title} (artifact ${artId.slice(0, 8)})...`);
    const ok = await downloadStudio(reg, studio, artId);
    if (ok) {
      downloaded++;
      state.studios[studio.id] = {
        ...state.studios[studio.id],
        lastStatus: 'downloaded',
        lastDownloadedAt: new Date().toISOString(),
      };
      saveStudioState(state);
    }
  }

  return downloaded;
}

// ---------------------------------------------------------------------------
// Sync App.jsx RESOURCE_DOCS from registry
// ---------------------------------------------------------------------------

function syncAppResourceDocs(reg) {
  const appFile = path.join(PROJECT_ROOT, 'src', 'ui', 'src', 'App.jsx');
  if (!fs.existsSync(appFile)) {
    console.log('[sync-app] App.jsx not found — skipping.');
    return false;
  }

  const assetsDir = path.join(PROJECT_ROOT, reg.assetsDir);
  let content = fs.readFileSync(appFile, 'utf8');

  // Build RESOURCE_DOCS entries from registry — only for files that exist on disk
  const entries = [];

  for (const studio of reg.studios) {
    if (!studio.enabled) continue;
    const filePath = path.join(assetsDir, studio.filename);
    if (!fs.existsSync(filePath)) continue;

    entries.push(
      `  { file: '${studio.filename}', title: '${studio.title.replace(/'/g, "\\'")}', desc: '${studio.desc.replace(/'/g, "\\'")}', icon: '${studio.icon}', type: '${studio.appType}' },`
    );
  }

  for (const asset of reg.staticAssets) {
    const filePath = path.join(assetsDir, asset.filename);
    if (!fs.existsSync(filePath)) continue;

    entries.push(
      `  { file: '${asset.filename}', title: '${asset.title.replace(/'/g, "\\'")}', desc: '${asset.desc.replace(/'/g, "\\'")}', icon: '${asset.icon}', type: '${asset.appType}' },`
    );
  }

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '-');
  const newBlock = `// Resource documents available at /assets/docs/ — Auto-synced ${dateStr}\nconst RESOURCE_DOCS = [\n${entries.join('\n')}\n];`;

  // Replace existing RESOURCE_DOCS block
  const pattern = /\/\/ Resource documents available at \/assets\/docs\/[^\n]*\nconst RESOURCE_DOCS = \[[\s\S]*?\];/;
  if (!pattern.test(content)) {
    console.log('[sync-app] Could not find RESOURCE_DOCS block in App.jsx — skipping.');
    return false;
  }

  const updated = content.replace(pattern, newBlock);
  if (updated === content) {
    console.log('[sync-app] RESOURCE_DOCS already up to date.');
    return false;
  }

  fs.writeFileSync(appFile, updated);
  console.log(`[sync-app] Updated RESOURCE_DOCS with ${entries.length} entries.`);
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const reg = loadRegistry();

  console.log('=== NLM Studio Pipeline ===');
  console.log(`Notebook: ${reg.notebookId}`);
  console.log(`Studios:  ${reg.studios.filter(s => s.enabled).length} enabled\n`);

  // Auth check (always)
  if (!CHECK_AUTH && !STATUS && !SYNC_APP) {
    const authOk = checkAuth(reg);
    if (!authOk) {
      console.error('[auth] NLM auth expired. Run: nlm login');
      process.exit(2);
    }
    console.log('[auth] OK\n');
  }

  if (CHECK_AUTH) {
    const ok = checkAuth(reg);
    console.log(ok ? 'Auth: OK' : 'Auth: EXPIRED — run nlm login');
    process.exit(ok ? 0 : 2);
  }

  if (STATUS) {
    await showStatus();
    return;
  }

  if (SYNC_APP) {
    syncAppResourceDocs(reg);
    return;
  }

  if (DOWNLOAD_MISSING) {
    const n = await downloadMissing(reg);
    console.log(`\nDownloaded ${n} file(s).`);
    if (n > 0) syncAppResourceDocs(reg);
    return;
  }

  let studioIds = [];

  if (REGENERATE_ALL) {
    studioIds = reg.studios.filter(s => s.enabled).map(s => s.id);
    console.log(`Regenerating ALL ${studioIds.length} studios...`);
  } else if (REGENERATE_ONE) {
    studioIds = [REGENERATE_ONE];
    console.log(`Regenerating studio: ${REGENERATE_ONE}`);
  } else if (REFRESH_CHANGED) {
    studioIds = await detectChangedStudios(reg);
    if (studioIds.length === 0) {
      console.log('No sources changed since last studio creation. Nothing to do.');
      // Still check for missing downloads
      const n = await downloadMissing(reg);
      if (n > 0) syncAppResourceDocs(reg);
      return;
    }
    console.log(`${studioIds.length} studio(s) have changed sources: ${studioIds.join(', ')}`);
  } else {
    console.log('No action specified. Use --status, --download-missing, --regenerate-all, --regenerate <id>, --refresh-changed, or --sync-app');
    return;
  }

  const results = await regenerateStudios(reg, studioIds);

  console.log('\n=== Results ===');
  console.log(`Created:    ${results.created}`);
  console.log(`Downloaded: ${results.downloaded}`);
  console.log(`Failed:     ${results.failed}`);

  // Sync App.jsx
  if (results.downloaded > 0) {
    syncAppResourceDocs(reg);
  }

  // Update state
  const state = loadStudioState();
  state.lastRun = new Date().toISOString();
  saveStudioState(state);

  appendAudit({ event: 'pipeline_complete', results });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
