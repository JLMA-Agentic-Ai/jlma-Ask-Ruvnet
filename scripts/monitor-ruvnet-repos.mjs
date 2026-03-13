#!/usr/bin/env node
/**
 * monitor-ruvnet-repos.mjs
 *
 * Checks GitHub API and npm registry for new releases, commits, and package
 * versions across the RuvNet ecosystem since the last recorded check.
 *
 * Returns a structured list of ChangeEvents — new releases, changed
 * CHANGELOG.md content, new npm versions, and newly-added documentation files.
 *
 * This module is consumed by kb-sync-ruvnet.mjs which handles embedding
 * and DB ingestion. It can also be imported directly for inspection.
 *
 * Usage (standalone inspection):
 *   node scripts/monitor-ruvnet-repos.mjs
 *   node scripts/monitor-ruvnet-repos.mjs --force   # ignore last-check timestamps
 *   node scripts/monitor-ruvnet-repos.mjs --dry-run # print events, skip state write
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const STATE_FILE = path.join(PROJECT_ROOT, '.ruvnet-monitor-state.json');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GITHUB_API_BASE = 'https://api.github.com';
const NPM_REGISTRY_BASE = 'https://registry.npmjs.org';

// GitHub API rate limit for unauthenticated requests: 60/hour.
// We batch carefully and add small delays to stay well under the limit.
const GITHUB_REQUEST_DELAY_MS = 500;

/**
 * Repos and npm packages to monitor.
 *
 * Adding a new repo: append an entry here and re-run the sync.
 * The monitor will automatically detect all historical content on first run,
 * then track only new content on subsequent runs.
 */
export const WATCH_TARGETS = [
  {
    id: 'ruflo',
    owner: 'ruvnet',
    repo: 'ruflo',
    npm: 'ruflo',
    // Doc files to watch for additions (paths relative to repo root)
    watchDocs: ['CHANGELOG.md', 'README.md', 'docs/'],
    label: 'Ruflo',
  },
  {
    // Legacy entry — tracks the old ruflo repo for backward compatibility
    id: 'ruflo',
    owner: 'ruvnet',
    repo: 'ruflo',
    npm: '@claude-flow/cli',
    watchDocs: ['CHANGELOG.md', 'README.md'],
    label: 'Ruflo (legacy)',
  },
  {
    id: 'agentic-flow',
    owner: 'ruvnet',
    repo: 'agentic-flow',
    npm: 'agentic-flow',
    watchDocs: ['CHANGELOG.md', 'README.md'],
    label: 'Agentic Flow',
  },
  {
    id: 'ruvector',
    owner: 'ruvnet',
    repo: 'ruvector',
    npm: 'ruvector',
    watchDocs: ['CHANGELOG.md', 'README.md'],
    label: 'RuVector',
  },
  {
    id: 'ruv-swarm',
    owner: 'ruvnet',
    repo: 'ruv-swarm',
    npm: 'ruv-swarm',
    watchDocs: ['CHANGELOG.md', 'README.md'],
    label: 'Ruv Swarm',
  },
  {
    id: 'ruview',
    owner: 'ruvnet',
    repo: 'RuView',
    npm: null,
    watchDocs: ['CHANGELOG.md', 'README.md', 'docs/'],
    label: 'RuView (DensePose)',
  },
];

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

/**
 * Default state shape — one entry per target ID.
 *
 * lastReleaseTag:   the tag_name of the newest release already processed
 * lastCommitSha:    the SHA of the newest commit on main already processed
 * lastNpmVersion:   the newest npm version string already processed
 * lastDocShas:      map of { filePath -> sha } for watched doc files
 * checkedAt:        ISO timestamp of the last successful check
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[monitor] Warning: could not read state file: ${err.message}`);
  }
  return {};
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function getTargetState(state, targetId) {
  return state[targetId] || {
    lastReleaseTag: null,
    lastCommitSha: null,
    lastNpmVersion: null,
    lastDocShas: {},
    checkedAt: null,
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function httpGet(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'AskRuvNet-Monitor/1.0',
      ...headers,
    },
  });

  // Surface rate-limit state for debugging
  const remaining = res.headers.get('x-ratelimit-remaining');
  const resetTs = res.headers.get('x-ratelimit-reset');
  if (remaining !== null && parseInt(remaining) < 10) {
    const resetDate = resetTs ? new Date(parseInt(resetTs) * 1000).toISOString() : 'unknown';
    console.warn(`[monitor] Warning: GitHub rate limit low — ${remaining} remaining, resets at ${resetDate}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// GitHub: releases
// ---------------------------------------------------------------------------

/**
 * Fetch the N most recent releases for a repo.
 * Returns them newest-first (GitHub's default order).
 */
async function fetchRecentReleases(owner, repo, perPage = 10) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=${perPage}`;
  try {
    const releases = await httpGet(url);
    return Array.isArray(releases) ? releases : [];
  } catch (err) {
    console.warn(`[monitor] Could not fetch releases for ${owner}/${repo}: ${err.message}`);
    return [];
  }
}

/**
 * Given a list of releases (newest-first) and the last known tag, return
 * only the releases that are newer than lastKnownTag.
 */
function filterNewReleases(releases, lastKnownTag) {
  if (!lastKnownTag) return releases;
  const idx = releases.findIndex(r => r.tag_name === lastKnownTag);
  if (idx === -1) return releases; // entire page is newer, return all
  return releases.slice(0, idx);
}

// ---------------------------------------------------------------------------
// GitHub: commits and CHANGELOG diffs
// ---------------------------------------------------------------------------

/**
 * Fetch the most recent commits on the default branch.
 */
async function fetchRecentCommits(owner, repo, perPage = 30) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${perPage}`;
  try {
    const commits = await httpGet(url);
    return Array.isArray(commits) ? commits : [];
  } catch (err) {
    console.warn(`[monitor] Could not fetch commits for ${owner}/${repo}: ${err.message}`);
    return [];
  }
}

/**
 * Given a list of commits (newest-first) and the last known SHA, return
 * only the commits that are newer.
 */
function filterNewCommits(commits, lastKnownSha) {
  if (!lastKnownSha) return commits;
  const idx = commits.findIndex(c => c.sha === lastKnownSha);
  if (idx === -1) return commits;
  return commits.slice(0, idx);
}

/**
 * Fetch the raw content of a file from a repo at a given ref.
 * Returns the decoded string or null on error.
 */
async function fetchFileContent(owner, repo, filePath, ref = 'HEAD') {
  const encodedPath = filePath.replace(/ /g, '%20');
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;
  try {
    const data = await httpGet(url);
    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch directory listing from GitHub contents API.
 * Returns array of { name, path, sha, type } or [] on error.
 */
async function fetchDirectoryListing(owner, repo, dirPath, ref = 'HEAD') {
  const encodedPath = dirPath.replace(/ /g, '%20');
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;
  try {
    const data = await httpGet(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Get the current SHA for a file (for change detection).
 */
async function fetchFileSha(owner, repo, filePath) {
  const encodedPath = filePath.replace(/ /g, '%20');
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}`;
  try {
    const data = await httpGet(url);
    return data.sha || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// npm registry
// ---------------------------------------------------------------------------

/**
 * Fetch version metadata from the npm registry.
 * Returns { latest, versions: [{ version, date, description }] } or null.
 */
async function fetchNpmPackageInfo(packageName) {
  const encoded = encodeURIComponent(packageName).replace('%40', '@');
  const url = `${NPM_REGISTRY_BASE}/${encoded}`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'AskRuvNet-Monitor/1.0' },
    });
    if (!res.ok) {
      console.warn(`[monitor] npm registry returned ${res.status} for ${packageName}`);
      return null;
    }
    const data = await res.json();
    const times = data.time || {};
    const versions = Object.keys(data.versions || {})
      .filter(v => v !== 'created' && v !== 'modified')
      .map(v => ({
        version: v,
        date: times[v] || null,
        description: data.versions[v]?.description || data.description || '',
        keywords: data.versions[v]?.keywords || data.keywords || [],
      }))
      .sort((a, b) => {
        // Sort by publish date desc, falling back to version string
        if (a.date && b.date) return new Date(b.date) - new Date(a.date);
        return b.version.localeCompare(a.version, undefined, { numeric: true });
      });

    return {
      latest: data['dist-tags']?.latest || versions[0]?.version || null,
      versions,
    };
  } catch (err) {
    console.warn(`[monitor] Could not fetch npm info for ${packageName}: ${err.message}`);
    return null;
  }
}

/**
 * Given the full sorted version list and the last known version string,
 * return only versions newer than lastKnown (by publish date or position).
 */
function filterNewNpmVersions(versions, lastKnownVersion) {
  if (!lastKnownVersion) return versions;
  const idx = versions.findIndex(v => v.version === lastKnownVersion);
  if (idx === -1) return versions;
  return versions.slice(0, idx);
}

// ---------------------------------------------------------------------------
// Change event construction
// ---------------------------------------------------------------------------

/**
 * A ChangeEvent is the normalized unit that kb-sync-ruvnet.mjs ingests.
 *
 * type:           'github-release' | 'changelog-update' | 'npm-version' | 'doc-added'
 * targetId:       matches a WATCH_TARGETS[].id
 * label:          human-readable package name
 * version:        relevant version string (or null)
 * title:          KB entry title
 * content:        KB entry body text
 * source:         canonical URL or path identifier
 * publishedAt:    ISO date string or null
 * knowledge_type: 'reference' | 'changelog' | 'concept'
 */
function makeReleaseEvent(target, release) {
  const version = release.tag_name || release.name || 'unknown';
  const body = (release.body || '').trim() || `Release ${version} of ${target.label}. No release notes provided.`;
  const publishedAt = release.published_at || release.created_at || null;

  return {
    type: 'github-release',
    targetId: target.id,
    label: target.label,
    version,
    title: `${target.label} ${version} Release Notes`,
    content: [
      `Package: ${target.label} (github.com/${target.owner}/${target.repo})`,
      `Version: ${version}`,
      publishedAt ? `Published: ${publishedAt}` : null,
      `Release Name: ${release.name || version}`,
      release.prerelease ? 'Status: Pre-release' : 'Status: Stable release',
      '',
      '## Release Notes',
      '',
      body,
    ].filter(l => l !== null).join('\n'),
    source: `github:${target.owner}/${target.repo}/releases/${version}`,
    publishedAt,
    knowledge_type: 'changelog',
  };
}

function makeChangelogUpdateEvent(target, commits, changelogContent) {
  const topCommit = commits[0];
  const commitDate = topCommit?.commit?.author?.date || topCommit?.commit?.committer?.date || null;
  const commitShas = commits.map(c => c.sha.slice(0, 7)).join(', ');
  const messages = commits
    .map(c => `- ${c.commit.message.split('\n')[0].trim()}`)
    .join('\n');

  const content = [
    `Package: ${target.label} (github.com/${target.owner}/${target.repo})`,
    commitDate ? `Updated: ${commitDate}` : null,
    `Commits: ${commitShas}`,
    '',
    '## Recent Commits',
    '',
    messages,
    '',
    '## Current CHANGELOG',
    '',
    changelogContent ? changelogContent.slice(0, 3000) : '(No CHANGELOG.md found)',
  ].filter(l => l !== null).join('\n');

  return {
    type: 'changelog-update',
    targetId: target.id,
    label: target.label,
    version: null,
    title: `${target.label} CHANGELOG — ${commitDate ? new Date(commitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent Updates'}`,
    content,
    source: `github:${target.owner}/${target.repo}/blob/main/CHANGELOG.md`,
    publishedAt: commitDate,
    knowledge_type: 'changelog',
  };
}

function makeNpmVersionEvent(target, versionInfo) {
  const content = [
    `Package: ${target.npm} (npm)`,
    `Version: ${versionInfo.version}`,
    versionInfo.date ? `Published: ${versionInfo.date}` : null,
    versionInfo.description ? `Description: ${versionInfo.description}` : null,
    versionInfo.keywords?.length
      ? `Keywords: ${versionInfo.keywords.join(', ')}`
      : null,
    '',
    `Install: npm install ${target.npm}@${versionInfo.version}`,
    `Registry: https://www.npmjs.com/package/${target.npm}/v/${versionInfo.version}`,
  ].filter(l => l !== null).join('\n');

  return {
    type: 'npm-version',
    targetId: target.id,
    label: target.label,
    version: versionInfo.version,
    title: `${target.label} npm ${versionInfo.version}`,
    content,
    source: `npm:${target.npm}@${versionInfo.version}`,
    publishedAt: versionInfo.date || null,
    knowledge_type: 'reference',
  };
}

function makeDocAddedEvent(target, filePath, fileContent) {
  const fileName = path.basename(filePath);
  return {
    type: 'doc-added',
    targetId: target.id,
    label: target.label,
    version: null,
    title: `${target.label} Documentation: ${fileName}`,
    content: [
      `Package: ${target.label} (github.com/${target.owner}/${target.repo})`,
      `File: ${filePath}`,
      '',
      fileContent ? fileContent.slice(0, 4000) : '(Content unavailable)',
    ].join('\n'),
    source: `github:${target.owner}/${target.repo}/blob/main/${filePath}`,
    publishedAt: null,
    knowledge_type: 'concept',
  };
}

// ---------------------------------------------------------------------------
// Main monitor logic per target
// ---------------------------------------------------------------------------

/**
 * Check one target for new content.
 * Returns { events: ChangeEvent[], newState: object }
 */
async function checkTarget(target, currentState, opts = {}) {
  const { force = false } = opts;
  const targetState = getTargetState(currentState, target.id);
  const events = [];
  const newState = { ...targetState };

  console.log(`\n[monitor] Checking ${target.label} (${target.owner}/${target.repo})`);

  // --- GitHub Releases ---
  console.log(`  Fetching GitHub releases...`);
  const releases = await fetchRecentReleases(target.owner, target.repo, 20);
  const lastTag = force ? null : targetState.lastReleaseTag;
  const newReleases = filterNewReleases(releases, lastTag);

  if (newReleases.length > 0) {
    console.log(`  Found ${newReleases.length} new release(s).`);
    for (const rel of newReleases) {
      events.push(makeReleaseEvent(target, rel));
    }
    newState.lastReleaseTag = releases[0]?.tag_name || targetState.lastReleaseTag;
  } else {
    console.log(`  No new releases since ${lastTag || 'beginning'}.`);
    // Still update lastReleaseTag if this is the first check
    if (!targetState.lastReleaseTag && releases[0]) {
      newState.lastReleaseTag = releases[0].tag_name;
    }
  }

  await delay(GITHUB_REQUEST_DELAY_MS);

  // --- Recent Commits + CHANGELOG ---
  console.log(`  Fetching recent commits...`);
  const commits = await fetchRecentCommits(target.owner, target.repo, 30);
  const lastSha = force ? null : targetState.lastCommitSha;
  const newCommits = filterNewCommits(commits, lastSha);

  if (newCommits.length > 0) {
    console.log(`  Found ${newCommits.length} new commit(s). Fetching CHANGELOG...`);
    await delay(GITHUB_REQUEST_DELAY_MS);
    const changelog = await fetchFileContent(target.owner, target.repo, 'CHANGELOG.md');
    events.push(makeChangelogUpdateEvent(target, newCommits, changelog));
    newState.lastCommitSha = commits[0]?.sha || targetState.lastCommitSha;
  } else {
    console.log(`  No new commits since ${lastSha?.slice(0, 7) || 'beginning'}.`);
    if (!targetState.lastCommitSha && commits[0]) {
      newState.lastCommitSha = commits[0].sha;
    }
  }

  await delay(GITHUB_REQUEST_DELAY_MS);

  // --- Watched doc files for SHA-change detection ---
  const lastDocShas = targetState.lastDocShas || {};
  const currentDocShas = {};

  for (const docPath of target.watchDocs || []) {
    const isDir = docPath.endsWith('/');
    if (isDir) {
      // Check directory for newly added files
      const dirPath = docPath.slice(0, -1);
      const listing = await fetchDirectoryListing(target.owner, target.repo, dirPath);
      await delay(GITHUB_REQUEST_DELAY_MS);

      for (const item of listing) {
        if (item.type !== 'file') continue;
        const knownSha = lastDocShas[item.path];
        currentDocShas[item.path] = item.sha;

        if (!knownSha) {
          // Newly discovered file in directory
          if (force || !targetState.checkedAt) {
            // On first run, just record SHAs without generating events (avoid flood)
            continue;
          }
          console.log(`  New doc file detected: ${item.path}`);
          await delay(GITHUB_REQUEST_DELAY_MS);
          const content = await fetchFileContent(target.owner, target.repo, item.path);
          events.push(makeDocAddedEvent(target, item.path, content));
        }
      }
    } else {
      // Single file — check for SHA change
      await delay(GITHUB_REQUEST_DELAY_MS);
      const sha = await fetchFileSha(target.owner, target.repo, docPath);
      if (sha) {
        currentDocShas[docPath] = sha;
        const knownSha = lastDocShas[docPath];
        if (knownSha && knownSha !== sha && !force) {
          console.log(`  Doc changed: ${docPath} (${knownSha.slice(0, 7)} -> ${sha.slice(0, 7)})`);
          await delay(GITHUB_REQUEST_DELAY_MS);
          const content = await fetchFileContent(target.owner, target.repo, docPath);
          events.push(makeDocAddedEvent(target, docPath, content));
        }
      }
    }
  }

  newState.lastDocShas = { ...lastDocShas, ...currentDocShas };

  // --- npm versions ---
  if (target.npm) {
    console.log(`  Fetching npm versions for ${target.npm}...`);
    const npmInfo = await fetchNpmPackageInfo(target.npm);
    if (npmInfo) {
      const lastVer = force ? null : targetState.lastNpmVersion;
      const newVersions = filterNewNpmVersions(npmInfo.versions, lastVer);

      if (newVersions.length > 0) {
        console.log(`  Found ${newVersions.length} new npm version(s).`);
        // Cap at 10 to avoid flooding KB on first run
        const toProcess = targetState.lastNpmVersion ? newVersions : newVersions.slice(0, 10);
        for (const ver of toProcess) {
          events.push(makeNpmVersionEvent(target, ver));
        }
        newState.lastNpmVersion = npmInfo.versions[0]?.version || targetState.lastNpmVersion;
      } else {
        console.log(`  No new npm versions since ${lastVer || 'beginning'}.`);
        if (!targetState.lastNpmVersion && npmInfo.versions[0]) {
          newState.lastNpmVersion = npmInfo.versions[0].version;
        }
      }
    }
  }

  newState.checkedAt = new Date().toISOString();
  return { events, newState };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the monitor across all configured targets.
 *
 * Options:
 *   force   {boolean}  — ignore last-check state, re-check everything
 *   dryRun  {boolean}  — skip writing updated state back to disk
 *   targets {string[]} — limit check to specific target IDs
 *
 * Returns { events: ChangeEvent[], summary: object }
 */
export async function runMonitor(opts = {}) {
  const { force = false, dryRun = false, targets: targetFilter = null } = opts;

  const state = loadState();
  const allEvents = [];
  const newState = { ...state };

  const targets = targetFilter
    ? WATCH_TARGETS.filter(t => targetFilter.includes(t.id))
    : WATCH_TARGETS;

  for (const target of targets) {
    try {
      const { events, newState: updatedTargetState } = await checkTarget(target, state, { force });
      allEvents.push(...events);
      newState[target.id] = updatedTargetState;
    } catch (err) {
      console.error(`[monitor] Error checking ${target.id}: ${err.message}`);
    }
  }

  if (!dryRun) {
    saveState(newState);
    console.log(`\n[monitor] State saved to ${STATE_FILE}`);
  }

  const summary = {
    totalEvents: allEvents.length,
    byType: allEvents.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
    byTarget: allEvents.reduce((acc, e) => {
      acc[e.targetId] = (acc[e.targetId] || 0) + 1;
      return acc;
    }, {}),
  };

  return { events: allEvents, summary };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  console.log('=== AskRuvNet Repo Monitor ===');
  console.log(`Mode: ${force ? 'FORCE (ignore state)' : 'incremental'} | ${dryRun ? 'DRY RUN' : 'live'}\n`);

  runMonitor({ force, dryRun })
    .then(({ events, summary }) => {
      console.log('\n=== Monitor Summary ===');
      console.log(`Total new events: ${summary.totalEvents}`);
      if (summary.totalEvents > 0) {
        console.log('\nBy type:');
        for (const [type, count] of Object.entries(summary.byType)) {
          console.log(`  ${type}: ${count}`);
        }
        console.log('\nBy target:');
        for (const [id, count] of Object.entries(summary.byTarget)) {
          console.log(`  ${id}: ${count}`);
        }
        console.log('\nEvents:');
        for (const ev of events) {
          console.log(`  [${ev.type}] ${ev.title}`);
        }
      } else {
        console.log('No new content detected.');
      }
    })
    .catch(err => {
      console.error('Fatal:', err);
      process.exit(1);
    });
}
