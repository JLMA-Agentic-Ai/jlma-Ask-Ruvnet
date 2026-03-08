#!/usr/bin/env node
/**
 * nlm-generate-video.mjs
 *
 * On-demand NotebookLM video summary generation.
 * Creates a business-focused video overview from the RuvNet notebook.
 *
 * Usage:
 *   node scripts/nlm-generate-video.mjs                     # default explainer
 *   node scripts/nlm-generate-video.mjs --style whiteboard   # whiteboard style
 *   node scripts/nlm-generate-video.mjs --focus "..."        # custom focus prompt
 *   node scripts/nlm-generate-video.mjs --download-only      # grab latest completed video
 *   node scripts/nlm-generate-video.mjs --list               # list existing studios
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
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'data', 'nlm-videos');

const DEFAULT_FOCUS = `Business-focused overview of the RuVector and Ruflo ecosystem: what problems they solve, performance advantages, agentic architecture, and why enterprise teams choose this over alternatives. Cover key capabilities: multi-agent orchestration, 150x faster vector search, self-learning systems, and production deployment patterns.`;

const VALID_STYLES = ['auto_select', 'whiteboard', 'classic'];
const POLL_INTERVAL_MS = 30000; // 30 seconds
const MAX_POLL_TIME_MS = 20 * 60 * 1000; // 20 minutes

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const STYLE = args.includes('--style')
  ? args[args.indexOf('--style') + 1]
  : 'auto_select';
const FOCUS = args.includes('--focus')
  ? args[args.indexOf('--focus') + 1]
  : DEFAULT_FOCUS;
const DOWNLOAD_ONLY = args.includes('--download-only');
const LIST_STUDIOS = args.includes('--list');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

if (!VALID_STYLES.includes(STYLE)) {
  console.error(`Invalid style: ${STYLE}. Valid: ${VALID_STYLES.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    throw new Error(`Registry not found: ${REGISTRY_FILE}`);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
}

function nlmExec(argsArray, timeout = 60000) {
  const nlmBin = loadRegistry().nlmBin;
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// List existing studios
// ---------------------------------------------------------------------------

async function listStudios() {
  const registry = loadRegistry();
  const notebookId = registry.notebookId;

  console.log(`Listing studios for notebook ${notebookId}...`);
  try {
    // nlm studio list is not available — use studio_status on known IDs
    // For now, just check auth and report
    nlmExec(['notebook', 'list'], 15000);
    console.log('Auth OK. Use --download-only with a known studio ID to download.');
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') {
      console.error('Auth expired. Run: nlm login');
      process.exit(2);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Create video
// ---------------------------------------------------------------------------

async function createVideo() {
  const registry = loadRegistry();
  const notebookId = registry.notebookId;

  console.log('=== NotebookLM Video Generator ===');
  console.log(`Notebook: ${notebookId}`);
  console.log(`Style:    ${STYLE}`);
  console.log(`Focus:    ${FOCUS.slice(0, 80)}...`);
  console.log('');

  // Auth check
  try {
    nlmExec(['notebook', 'list'], 15000);
    console.log('[nlm-video] Auth: OK');
  } catch (err) {
    if (err.message === 'AUTH_EXPIRED') {
      console.error('[nlm-video] Auth expired. Run: nlm login');
      process.exit(2);
    }
    throw err;
  }

  // Create studio (video)
  console.log('\n[nlm-video] Creating video studio...');
  let studioResult;
  try {
    studioResult = nlmExecJson(
      ['studio', 'create', notebookId, '--type', 'audio', '--instructions', FOCUS],
      120000
    );
  } catch (err) {
    console.error(`[nlm-video] Studio creation failed: ${err.message}`);
    process.exit(1);
  }

  console.log('[nlm-video] Studio creation initiated.');
  if (VERBOSE) console.log('  Response:', JSON.stringify(studioResult, null, 2));

  // Extract studio ID
  let studioId = null;
  if (typeof studioResult === 'object') {
    studioId = studioResult.id || studioResult.studio_id || studioResult.studioId;
  }
  if (typeof studioResult === 'string') {
    const match = studioResult.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (match) studioId = match[1];
  }

  if (!studioId) {
    console.log('[nlm-video] Could not extract studio ID. Check NotebookLM manually.');
    console.log('  Raw response:', JSON.stringify(studioResult));
    return;
  }

  console.log(`[nlm-video] Studio ID: ${studioId}`);
  console.log(`[nlm-video] Polling for completion (max ${MAX_POLL_TIME_MS / 60000} min)...`);

  // Poll for completion
  const startTime = Date.now();
  let status = 'pending';

  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    await delay(POLL_INTERVAL_MS);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write(`  [${elapsed}s] Checking status... `);

    try {
      const statusResult = nlmExecJson(['studio', 'status', studioId], 30000);

      if (typeof statusResult === 'object') {
        status = statusResult.status || statusResult.state || 'unknown';
      } else if (typeof statusResult === 'string') {
        status = statusResult.toLowerCase().includes('complete') ? 'completed'
          : statusResult.toLowerCase().includes('fail') ? 'failed'
          : 'pending';
      }

      console.log(status);

      if (status === 'completed' || status === 'complete' || status === 'ready') {
        console.log('\n[nlm-video] Studio completed!');
        await downloadVideo(notebookId, studioId);
        return;
      }

      if (status === 'failed' || status === 'error') {
        console.error('\n[nlm-video] Studio creation failed.');
        if (typeof statusResult === 'object') {
          console.error('  Details:', JSON.stringify(statusResult, null, 2));
        }
        process.exit(1);
      }
    } catch (err) {
      console.log(`error: ${err.message?.slice(0, 60)}`);
    }
  }

  console.error(`\n[nlm-video] Timed out after ${MAX_POLL_TIME_MS / 60000} minutes.`);
  console.log(`  Studio ID: ${studioId}`);
  console.log('  Run with --download-only later to check and download.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Download video
// ---------------------------------------------------------------------------

async function downloadVideo(notebookId, studioId) {
  ensureOutputDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputFile = path.join(OUTPUT_DIR, `ruvnet-video-${timestamp}.mp4`);

  console.log(`[nlm-video] Downloading to ${outputFile}...`);

  try {
    // nlm download_artifact --type audio
    nlmExec(
      ['download_artifact', notebookId, '--type', 'audio', '--output', outputFile],
      300000 // 5 min timeout for download
    );

    if (fs.existsSync(outputFile)) {
      const size = (fs.statSync(outputFile).size / (1024 * 1024)).toFixed(1);
      console.log(`[nlm-video] Downloaded: ${outputFile} (${size} MB)`);
    } else {
      console.log('[nlm-video] Download command ran but file not found. Check output manually.');
    }
  } catch (err) {
    console.error(`[nlm-video] Download failed: ${err.message?.slice(0, 200)}`);
    console.log('  Try downloading manually from NotebookLM.');
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (LIST_STUDIOS) {
  listStudios().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
} else if (DOWNLOAD_ONLY) {
  const registry = loadRegistry();
  console.log('[nlm-video] Download-only mode.');
  console.log('  Check NotebookLM for the latest completed video.');
  downloadVideo(registry.notebookId, 'latest').catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
} else {
  createVideo().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
