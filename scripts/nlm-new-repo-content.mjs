#!/usr/bin/env node
/**
 * nlm-new-repo-content.mjs
 *
 * Detects new GitHub repos under the ruvnet org and generates targeted
 * NLM studio content (video, audio, slides) for each new repo using
 * README-derived prompts.
 *
 * Usage:
 *   node scripts/nlm-new-repo-content.mjs              # full run
 *   node scripts/nlm-new-repo-content.mjs --dry-run    # detect + generate prompts, skip NLM calls
 *   node scripts/nlm-new-repo-content.mjs --verbose    # extra logging
 *
 * Updated: 2026-03-15 10:00:00 EST | Version 1.0.0
 * Created: 2026-03-15
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const KNOWN_REPOS_FILE = path.join(__dirname, 'nlm-known-repos.json');
const REGISTRY_FILE = path.join(__dirname, 'nlm-studio-registry.json');
const RESULTS_DIR = path.join(PROJECT_ROOT, 'data', 'nlm-new-repo-results');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// Studio types to generate for each new repo
const STUDIO_TYPES = [
  { type: 'video', format: 'explainer', style: 'whiteboard' },
  { type: 'audio', format: 'deep_dive', length: 'default' },
  { type: 'slide_deck', format: 'detailed_deck' },
];

// ---------------------------------------------------------------------------
// GitHub token
// ---------------------------------------------------------------------------

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync('/opt/homebrew/bin/gh', ['auth', 'token'], {
      encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// HTTP + NLM helpers
// ---------------------------------------------------------------------------

async function ghFetch(urlPath) {
  const token = getGitHubToken();
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'AskRuvNet-NewRepoContent/1.0',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = urlPath.startsWith('http') ? urlPath : `https://api.github.com${urlPath}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) throw new Error(`Registry not found: ${REGISTRY_FILE}`);
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
}

function nlmExec(argsArray, timeout = 120000) {
  const reg = loadRegistry();
  if (VERBOSE) console.log(`  $ ${reg.nlmBin} ${argsArray.join(' ')}`);
  try {
    const result = execFileSync(reg.nlmBin, argsArray, {
      encoding: 'utf8', timeout, stdio: ['pipe', 'pipe', 'pipe'],
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

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

function loadKnownRepos() {
  if (!fs.existsSync(KNOWN_REPOS_FILE)) {
    return { lastChecked: null, repos: [] };
  }
  return JSON.parse(fs.readFileSync(KNOWN_REPOS_FILE, 'utf8'));
}

function saveKnownRepos(data) {
  fs.writeFileSync(KNOWN_REPOS_FILE, JSON.stringify(data, null, 2));
}

function saveResults(results) {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const f = path.join(RESULTS_DIR, `run-${timestamp}.json`);
  fs.writeFileSync(f, JSON.stringify(results, null, 2));
  console.log(`[results] Saved to ${f}`);
}

// ---------------------------------------------------------------------------
// Detect new repos
// ---------------------------------------------------------------------------

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const batch = await ghFetch(`/users/ruvnet/repos?per_page=100&sort=created&direction=desc&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return repos;
}

function detectNewRepos(allRepos, knownNames) {
  const knownSet = new Set(knownNames);
  return allRepos.filter(r => !knownSet.has(r.name));
}

// ---------------------------------------------------------------------------
// README parsing + prompt generation
// ---------------------------------------------------------------------------

async function fetchReadme(owner, repoName) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repoName}/readme`);
    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    return null;
  } catch {
    return null;
  }
}

function extractFeatures(readme) {
  if (!readme) return [];
  const features = [];
  const lines = readme.split('\n');
  let inFeatureSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    // Detect feature-like headings
    if (/^#+\s*(features|key features|highlights|capabilities|what it does)/i.test(line)) {
      inFeatureSection = true;
      continue;
    }
    // Stop at next heading
    if (inFeatureSection && /^#+\s/.test(line) && !/feature/i.test(line)) {
      inFeatureSection = false;
    }
    // Capture bullet points in feature sections
    if (inFeatureSection && /^[\s]*[-*]\s+/.test(line)) {
      const cleaned = line.replace(/^[\s]*[-*]\s+/, '').replace(/\*\*/g, '').trim();
      if (cleaned.length > 5 && cleaned.length < 200) {
        features.push(cleaned);
      }
    }
  }

  // Fallback: grab first few bold items or bullet points from anywhere
  if (features.length === 0) {
    for (const line of lines) {
      if (/^[\s]*[-*]\s+\*\*/.test(line)) {
        const cleaned = line.replace(/^[\s]*[-*]\s+/, '').replace(/\*\*/g, '').trim();
        if (cleaned.length > 5 && cleaned.length < 200) {
          features.push(cleaned);
        }
      }
      if (features.length >= 6) break;
    }
  }

  return features.slice(0, 8);
}

function generateOneLineHook(description, features) {
  if (description && description.length > 10) {
    // Use the repo description as the hook, but make it punchy
    const hook = description.replace(/\.$/, '');
    return hook.length > 80 ? hook.slice(0, 77) + '...' : hook;
  }
  if (features.length > 0) {
    return features[0].replace(/\.$/, '');
  }
  return 'A New Tool Worth Knowing About';
}

function buildStudioPrompt(repoName, description, features) {
  const featureBlock = features.length > 0
    ? features.map(f => `- ${f}`).join('\n')
    : '- See the README for full details';

  const hook = generateOneLineHook(description, features);

  return `Create a compelling explainer about ${repoName}: ${description || 'a new open-source project by ruvnet'}.

Key features:
${featureBlock}

The audience is technical leaders evaluating this for their organization.
They should finish watching thinking "I need to try this."

Title this: "${repoName}: ${hook}"`;
}

// ---------------------------------------------------------------------------
// Studio creation
// ---------------------------------------------------------------------------

async function createStudiosForRepo(repoName, prompt) {
  const reg = loadRegistry();
  const notebookId = reg.notebookId;
  const studioIds = [];

  for (const studio of STUDIO_TYPES) {
    const label = `${repoName} (${studio.type})`;
    console.log(`  [create] ${label}...`);

    const createArgs = ['studio', 'create', notebookId, '--type', studio.type === 'slide_deck' ? 'slide_deck' : studio.type];
    createArgs.push('--instructions', prompt);

    if (studio.type === 'audio') {
      if (studio.format) createArgs.push('--format', studio.format);
      if (studio.length) createArgs.push('--length', studio.length);
    } else if (studio.type === 'video') {
      if (studio.format) createArgs.push('--format', studio.format);
      if (studio.style) createArgs.push('--style', studio.style);
    } else if (studio.type === 'slide_deck') {
      if (studio.format) createArgs.push('--format', studio.format);
    }

    createArgs.push('--confirm');

    try {
      const result = nlmExec(createArgs, 120000);
      let studioId = null;
      try {
        const parsed = JSON.parse(result);
        studioId = parsed.id || parsed.artifact_id || parsed.studioId;
      } catch {
        const match = result.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (match) studioId = match[1];
      }

      if (studioId) {
        console.log(`  [create] OK: ${studioId.slice(0, 8)} (${studio.type})`);
        studioIds.push({ type: studio.type, studioId });
      } else {
        console.log(`  [create] Started but no ID extracted for ${label}`);
        studioIds.push({ type: studio.type, studioId: null, raw: result.slice(0, 100) });
      }
    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') throw err;
      console.error(`  [create] Failed ${label}: ${err.message?.slice(0, 100)}`);
      studioIds.push({ type: studio.type, studioId: null, error: err.message?.slice(0, 100) });
    }

    // Rate-limit between studio creations
    await new Promise(r => setTimeout(r, 3000));
  }

  return studioIds;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== NLM New Repo Content Generator ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'live'}\n`);

  // 1. Fetch all ruvnet repos
  console.log('[fetch] Loading repos from GitHub...');
  const allRepos = await fetchAllRepos();
  console.log(`[fetch] Found ${allRepos.length} repos under ruvnet\n`);

  // 2. Compare against known list
  const known = loadKnownRepos();
  const newRepos = detectNewRepos(allRepos, known.repos);

  if (newRepos.length === 0) {
    console.log('[check] No new repos detected. All up to date.');
    known.lastChecked = new Date().toISOString();
    saveKnownRepos(known);
    return;
  }

  console.log(`[check] ${newRepos.length} NEW repo(s) detected:`);
  for (const r of newRepos) {
    console.log(`  + ${r.name} — ${r.description || '(no description)'}`);
  }
  console.log('');

  // 3. Process each new repo
  const results = [];

  for (const repo of newRepos) {
    console.log(`\n--- Processing: ${repo.name} ---`);

    // Fetch README
    const readme = await fetchReadme('ruvnet', repo.name);
    if (readme) {
      console.log(`[readme] Fetched (${readme.length} chars)`);
    } else {
      console.log('[readme] Not found, using description only');
    }

    // Extract features + build prompt
    const features = extractFeatures(readme);
    if (features.length > 0) {
      console.log(`[features] Extracted ${features.length}:`);
      for (const f of features) console.log(`  - ${f}`);
    }

    const prompt = buildStudioPrompt(repo.name, repo.description, features);

    if (VERBOSE || DRY_RUN) {
      console.log('\n[prompt]\n' + prompt + '\n');
    }

    const entry = {
      repo: repo.name,
      description: repo.description,
      features,
      prompt,
      studios: [],
      createdAt: new Date().toISOString(),
    };

    // Create studios (skip in dry-run)
    if (!DRY_RUN) {
      entry.studios = await createStudiosForRepo(repo.name, prompt);
    } else {
      console.log('[dry-run] Would create: video, audio, slide_deck');
    }

    results.push(entry);
  }

  // 4. Update known repos list
  const allRepoNames = allRepos.map(r => r.name);
  known.repos = allRepoNames;
  known.lastChecked = new Date().toISOString();
  if (!DRY_RUN) {
    saveKnownRepos(known);
    console.log(`\n[state] Updated known repos (${allRepoNames.length} total)`);
  }

  // 5. Save results
  if (results.length > 0) {
    saveResults(results);
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`New repos:  ${newRepos.length}`);
  console.log(`Processed:  ${results.length}`);
  if (!DRY_RUN) {
    const totalStudios = results.reduce((n, r) => n + r.studios.filter(s => s.studioId).length, 0);
    console.log(`Studios:    ${totalStudios} created`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
