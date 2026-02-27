#!/usr/bin/env node
/**
 * Ingest GitHub Evolutionary Knowledge to KB
 *
 * Targets the WHY behind decisions: ADRs, changelogs, release notes,
 * and commit history from all RuVNet ecosystem repositories.
 *
 * Usage: node scripts/ingest-github-evolution.js
 *
 * Sources ingested:
 *   - ADR files (Architecture Decision Records)
 *   - CHANGELOG.md entries (tagged by version)
 *   - Release notes (via gh API)
 *   - Commit messages (grouped by conventional commit prefix)
 *
 * Security note: This script uses execFileSync and spawnSync (not exec)
 * to prevent shell injection. All arguments are passed as arrays.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const pool = new Pool({
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  password: process.env.RUVECTOR_PASSWORD || '',
  database: 'postgres'
});

const SCHEMA = 'ask_ruvnet';
const TEMP_DIR = '/tmp/ruvnet-repos';

// Orgs to scan and their priority repos
const ORGS = ['ruvnet', 'openclaw', 'VibiumDev'];
const PRIORITY_REPOS = [
  { org: 'ruvnet', name: 'claude-flow' },
  { org: 'ruvnet', name: 'ruvector' },
  { org: 'ruvnet', name: 'agentic-flow' },
  { org: 'ruvnet', name: 'flow-nexus' },
  { org: 'ruvnet', name: 'daa' },
  { org: 'openclaw', name: 'openclaw' },
  { org: 'VibiumDev', name: 'vibium' }
];

// Try to load ONNX embedder
let embedder = null;
try {
  const ruvector = require('ruvector');
  if (ruvector.embeddingService) embedder = ruvector.embeddingService;
} catch {}

function hashToVector(text, dim = 384) {
  const vector = new Float32Array(dim);
  for (let i = 0; i < text.length; i++) {
    vector[i % dim] = (vector[i % dim] * 31 + text.charCodeAt(i)) % 1000 / 1000;
  }
  let mag = 0;
  for (let i = 0; i < dim; i++) mag += vector[i] * vector[i];
  mag = Math.sqrt(mag) || 1;
  for (let i = 0; i < dim; i++) vector[i] /= mag;
  return Array.from(vector);
}

async function getEmbedding(text) {
  if (embedder && embedder.embed) {
    try { return await embedder.embed(text); } catch {}
  }
  return hashToVector(text, 384);
}

function getHash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function chunkText(text, maxSize = 600) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';
  for (const para of paragraphs) {
    if ((current + para).length > maxSize && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Run gh CLI command and return parsed JSON or raw string.
 * Uses spawnSync (no shell) to prevent injection.
 */
function ghApi(args, parseJson = true) {
  try {
    const result = spawnSync('gh', args, {
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      const stderr = (result.stderr || '').trim();
      if (stderr) throw new Error(stderr);
      return parseJson ? [] : '';
    }
    const output = (result.stdout || '').trim();
    if (!output) return parseJson ? [] : '';
    if (parseJson) {
      return JSON.parse(output);
    }
    return output;
  } catch (e) {
    if (e instanceof SyntaxError) return parseJson ? [] : '';
    throw e;
  }
}

/**
 * Get list of repos for an org
 */
function getOrgRepos(org) {
  try {
    const result = spawnSync('gh', [
      'repo', 'list', org,
      '--limit', '150',
      '--json', 'name',
      '--jq', '.[] | .name'
    ], { encoding: 'utf-8', timeout: 30000 });

    if (result.error) throw result.error;
    return result.stdout.trim().split('\n').filter(r => r).map(name => ({ org, name }));
  } catch (e) {
    console.error(`  Error fetching repos for ${org}: ${e.message}`);
    return [];
  }
}

/**
 * Clone or update a repo to temp directory.
 * Uses execFileSync (no shell) to prevent injection.
 */
function cloneRepo(org, repoName) {
  const repoPath = path.join(TEMP_DIR, `${org}--${repoName}`);
  const repoUrl = `https://github.com/${org}/${repoName}.git`;

  if (fs.existsSync(repoPath)) {
    try {
      const result = spawnSync('git', ['pull', '--quiet'], {
        cwd: repoPath,
        timeout: 60000,
        encoding: 'utf-8'
      });
      if (result.status === 0) return repoPath;
      fs.rmSync(repoPath, { recursive: true, force: true });
    } catch {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }

  try {
    execFileSync('git', ['clone', '--depth', '1', '--quiet', repoUrl, repoPath], {
      timeout: 120000
    });
    return repoPath;
  } catch (e) {
    console.warn(`    Failed to clone ${org}/${repoName}: ${e.message}`);
    return null;
  }
}

/**
 * Insert a document chunk into the KB, idempotent via ON CONFLICT
 */
async function upsertChunk(docId, title, content, filePath, sectionIndex, fileHash, packageName, packageVersion, docType, topics) {
  const rawEmbedding = await getEmbedding(content);
  // Format as bracket-enclosed string for ruvector column type
  const embedding = '[' + (Array.isArray(rawEmbedding) ? rawEmbedding : Array.from(rawEmbedding)).join(',') + ']';
  await pool.query(`
    INSERT INTO ${SCHEMA}.architecture_docs
    (doc_id, title, content, file_path, section_index, file_hash,
     package_name, package_version, doc_type, topics, embedding)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::ruvector)
    ON CONFLICT (doc_id) DO UPDATE SET
      title = $2, content = $3, file_path = $4, file_hash = $6,
      package_version = $8, topics = $10, embedding = $11::ruvector, updated_at = NOW()
  `, [
    docId, title, content, filePath, sectionIndex, fileHash,
    packageName, packageVersion, docType, topics, embedding
  ]);
}

// ---------------------------------------------------------------------------
// ADR Ingestion
// ---------------------------------------------------------------------------

/**
 * Recursively find ADR files in a cloned repo
 */
function findAdrFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__', 'venv'].includes(item)) continue;
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        // Check if this directory name looks ADR-related
        if (/^adr/i.test(item) || /^decisions?$/i.test(item)) {
          // Grab all markdown inside ADR directories
          findMarkdownInDir(fullPath, files);
        } else {
          findAdrFiles(fullPath, files);
        }
      } else if (stat.isFile() && /\.md$/i.test(item) && /adr/i.test(item)) {
        // Also catch standalone ADR files like ADR-001.md at any level
        files.push(fullPath);
      }
    } catch {}
  }
  return files;
}

function findMarkdownInDir(dir, files) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findMarkdownInDir(fullPath, files);
      } else if (stat.isFile() && /\.md$/i.test(item)) {
        files.push(fullPath);
      }
    } catch {}
  }
}

async function ingestAdrs(org, repoName, repoPath) {
  const adrFiles = findAdrFiles(repoPath);
  if (adrFiles.length === 0) return 0;

  let count = 0;
  for (const filePath of adrFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) continue;

    const relativePath = filePath.replace(repoPath + '/', '');
    const hash = getHash(content);
    const pathHash = hash.substring(0, 8);
    const chunks = chunkText(content, 600);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const docId = `evo-adr-${org}-${repoName}-${pathHash}-${i}`;
      const titleMatch = chunk.match(/^#\s+(.+)/m) || chunk.match(/^(.{1,80})/);
      const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');
      const topics = ['adr', 'decision', 'architecture', repoName];

      // Extract extra topics from ADR content
      if (/deprecat|replac|supersed/i.test(chunk)) topics.push('deprecation');
      if (/security|auth|encrypt/i.test(chunk)) topics.push('security');
      if (/performance|optim|latenc/i.test(chunk)) topics.push('performance');

      await upsertChunk(docId, title, chunk, `github://${org}/${repoName}/${relativePath}`, i, hash, repoName, 'latest', 'adr', topics);
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Changelog Ingestion
// ---------------------------------------------------------------------------

/**
 * Parse a CHANGELOG.md into version-tagged entries
 */
function parseChangelog(content) {
  const entries = [];
  // Split by version headings like ## [1.2.3] or ## 1.2.3 or ## v1.2.3
  const versionRegex = /^##\s+\[?v?(\d+\.\d+[^\]\s]*)\]?.*$/gm;
  const headings = [];
  let match;

  while ((match = versionRegex.exec(content)) !== null) {
    headings.push({ version: match[1], index: match.index, headerEnd: match.index + match[0].length });
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].headerEnd;
    const end = i + 1 < headings.length ? headings[i + 1].index : content.length;
    const body = content.substring(start, end).trim();
    if (body) {
      entries.push({ version: headings[i].version, body });
    }
  }

  // If no version headings found, treat entire content as one entry
  if (entries.length === 0 && content.trim().length > 20) {
    entries.push({ version: 'unknown', body: content.trim() });
  }

  return entries;
}

async function ingestChangelog(org, repoName, repoPath) {
  // Look for CHANGELOG.md, CHANGES.md, HISTORY.md
  const candidates = ['CHANGELOG.md', 'changelog.md', 'Changelog.md', 'CHANGES.md', 'HISTORY.md'];
  let changelogPath = null;
  for (const name of candidates) {
    const p = path.join(repoPath, name);
    if (fs.existsSync(p)) { changelogPath = p; break; }
  }
  if (!changelogPath) return 0;

  const content = fs.readFileSync(changelogPath, 'utf-8');
  const entries = parseChangelog(content);
  if (entries.length === 0) return 0;

  let count = 0;
  for (const entry of entries) {
    const chunks = chunkText(entry.body, 600);
    const hash = getHash(entry.body);
    const pathHash = hash.substring(0, 8);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const docId = `evo-changelog-${org}-${repoName}-${entry.version}-${pathHash}-${i}`;
      const title = `${repoName} v${entry.version} changelog`;
      const topics = ['changelog', 'evolution', 'version', repoName];

      // Tag with change categories found in content
      if (/breaking/i.test(chunk)) topics.push('breaking-change');
      if (/deprecat/i.test(chunk)) topics.push('deprecation');
      if (/security|cve|vulnerab/i.test(chunk)) topics.push('security');
      if (/feat|feature|add/i.test(chunk)) topics.push('feature');
      if (/fix|bug|patch/i.test(chunk)) topics.push('bugfix');

      await upsertChunk(docId, title, chunk, `github://${org}/${repoName}/CHANGELOG.md#${entry.version}`, i, hash, repoName, entry.version, 'changelog', topics);
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Release Notes Ingestion
// ---------------------------------------------------------------------------

async function ingestReleases(org, repoName) {
  let releases;
  try {
    releases = ghApi([
      'api', `repos/${org}/${repoName}/releases`,
      '--jq', '[.[] | {tag_name, name, body, published_at}]'
    ]);
  } catch (e) {
    console.warn(`    Could not fetch releases for ${org}/${repoName}: ${e.message}`);
    return 0;
  }

  if (!Array.isArray(releases) || releases.length === 0) return 0;

  let count = 0;
  for (const release of releases) {
    const body = (release.body || '').trim();
    if (!body) continue;

    const tag = release.tag_name || 'unknown';
    const releaseName = release.name || tag;
    const hash = getHash(body);
    const pathHash = hash.substring(0, 8);
    const chunks = chunkText(body, 600);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const docId = `evo-release-${org}-${repoName}-${tag}-${pathHash}-${i}`;
      const title = `${repoName} release ${releaseName}`;
      const topics = ['release', 'evolution', repoName];

      if (/breaking/i.test(chunk)) topics.push('breaking-change');
      if (/security|cve/i.test(chunk)) topics.push('security');
      if (/migration|migrat/i.test(chunk)) topics.push('migration');

      const filePath = `github://${org}/${repoName}/releases/${tag}`;

      await upsertChunk(docId, title, chunk, filePath, i, hash, repoName, tag, 'release-note', topics);
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Commit History Ingestion (grouped by conventional commit prefix)
// ---------------------------------------------------------------------------

/**
 * Conventional commit prefix categories
 */
const COMMIT_CATEGORIES = {
  'feat': 'feature',
  'fix': 'bugfix',
  'docs': 'documentation',
  'style': 'style',
  'refactor': 'refactor',
  'perf': 'performance',
  'test': 'testing',
  'build': 'build',
  'ci': 'ci',
  'chore': 'chore',
  'revert': 'revert',
  'breaking': 'breaking-change'
};

function categorizeCommit(message) {
  const lower = message.toLowerCase();
  for (const [prefix, category] of Object.entries(COMMIT_CATEGORIES)) {
    if (lower.startsWith(prefix + ':') || lower.startsWith(prefix + '(')) {
      return category;
    }
  }
  // Heuristic fallback
  if (/\bfix\b/i.test(message)) return 'bugfix';
  if (/\badd\b|\bnew\b|\bfeat/i.test(message)) return 'feature';
  if (/\bupdate\b|\bupgrade\b/i.test(message)) return 'update';
  if (/\bremove\b|\bdelete\b|\bdrop\b/i.test(message)) return 'removal';
  if (/\brefactor/i.test(message)) return 'refactor';
  if (/\bdoc/i.test(message)) return 'documentation';
  if (/\btest/i.test(message)) return 'testing';
  return 'other';
}

/**
 * Build a narrative summary for a group of commits
 */
function buildCommitNarrative(category, commits) {
  const lines = [];
  lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Changes\n`);
  lines.push(`${commits.length} commit(s) in this category:\n`);

  for (const c of commits) {
    const date = c.date ? c.date.substring(0, 10) : '';
    const author = c.author || 'unknown';
    const shortSha = (c.sha || '').substring(0, 7);
    lines.push(`- [${shortSha}] ${c.message} (${author}, ${date})`);
  }

  return lines.join('\n');
}

async function ingestCommits(org, repoName) {
  let commits;
  try {
    commits = ghApi([
      'api', `repos/${org}/${repoName}/commits`,
      '--method', 'GET',
      '-f', 'per_page=50',
      '--jq', '[.[] | {sha: .sha, message: .commit.message, author: .commit.author.name, date: .commit.author.date}]'
    ]);
  } catch (e) {
    console.warn(`    Could not fetch commits for ${org}/${repoName}: ${e.message}`);
    return 0;
  }

  if (!Array.isArray(commits) || commits.length === 0) return 0;

  // Group commits by category
  const groups = {};
  for (const commit of commits) {
    // Use only the first line of commit message
    const firstLine = (commit.message || '').split('\n')[0].trim();
    if (!firstLine) continue;

    const category = categorizeCommit(firstLine);
    if (!groups[category]) groups[category] = [];
    groups[category].push({
      sha: commit.sha,
      message: firstLine,
      author: commit.author,
      date: commit.date
    });
  }

  let count = 0;
  for (const [category, groupCommits] of Object.entries(groups)) {
    const narrative = buildCommitNarrative(category, groupCommits);
    const hash = getHash(narrative);
    const pathHash = hash.substring(0, 8);
    const chunks = chunkText(narrative, 600);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const docId = `evo-commits-${org}-${repoName}-${category}-${pathHash}-${i}`;
      const title = `${repoName} commit history: ${category}`;
      const topics = ['commit', 'evolution', repoName];

      if (category !== 'other') topics.push(category);
      if (/security|auth|cve/i.test(chunk)) topics.push('security');

      const filePath = `github://${org}/${repoName}/commits/${category}`;

      await upsertChunk(docId, title, chunk, filePath, i, hash, repoName, 'HEAD', 'commit-history', topics);
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Main Orchestration
// ---------------------------------------------------------------------------

async function processRepo(org, repoName) {
  console.log(`\n  [${org}/${repoName}]`);

  // Clone for file-based ingestion (ADRs, changelogs)
  const repoPath = cloneRepo(org, repoName);

  let adrCount = 0;
  let changelogCount = 0;
  let releaseCount = 0;
  let commitCount = 0;

  // ADRs and changelogs require a clone
  if (repoPath) {
    try {
      adrCount = await ingestAdrs(org, repoName, repoPath);
    } catch (e) {
      console.warn(`    ADR error: ${e.message}`);
    }

    try {
      changelogCount = await ingestChangelog(org, repoName, repoPath);
    } catch (e) {
      console.warn(`    Changelog error: ${e.message}`);
    }
  }

  // Releases and commits use the API (no clone needed)
  try {
    releaseCount = await ingestReleases(org, repoName);
  } catch (e) {
    console.warn(`    Release error: ${e.message}`);
  }

  try {
    commitCount = await ingestCommits(org, repoName);
  } catch (e) {
    console.warn(`    Commit error: ${e.message}`);
  }

  const total = adrCount + changelogCount + releaseCount + commitCount;
  if (total > 0) {
    console.log(`    ADRs: ${adrCount} | Changelog: ${changelogCount} | Releases: ${releaseCount} | Commits: ${commitCount} | Total: ${total}`);
  } else {
    console.log('    No evolutionary content found');
  }

  return { adrCount, changelogCount, releaseCount, commitCount };
}

async function main() {
  console.log('=========================================================================');
  console.log('  INGESTING GITHUB EVOLUTIONARY KNOWLEDGE');
  console.log('  ADRs | Changelogs | Release Notes | Commit History');
  console.log('=========================================================================');

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Collect all repos from all orgs
  console.log('\nFetching repository lists...');
  const allRepos = [];
  for (const org of ORGS) {
    const repos = getOrgRepos(org);
    console.log(`  ${org}: ${repos.length} repos`);
    allRepos.push(...repos);
  }

  if (allRepos.length === 0) {
    console.log('\nNo repositories found. Check gh CLI authentication.');
    await pool.end();
    return;
  }

  // Build ordered list: priority repos first, then the rest
  const priorityKeys = new Set(PRIORITY_REPOS.map(r => `${r.org}/${r.name}`));
  const seen = new Set();

  const orderedRepos = [];

  // Add priority repos first (in declared order)
  for (const pr of PRIORITY_REPOS) {
    const key = `${pr.org}/${pr.name}`;
    const found = allRepos.find(r => r.org === pr.org && r.name === pr.name);
    if (found) {
      orderedRepos.push(found);
      seen.add(key);
    }
  }

  // Add remaining repos alphabetically
  const remaining = allRepos
    .filter(r => !seen.has(`${r.org}/${r.name}`))
    .sort((a, b) => `${a.org}/${a.name}`.localeCompare(`${b.org}/${b.name}`));
  orderedRepos.push(...remaining);

  console.log(`\nProcessing ${orderedRepos.length} repositories (${seen.size} priority)...\n`);

  // Totals
  let totalAdrs = 0;
  let totalChangelogs = 0;
  let totalReleases = 0;
  let totalCommits = 0;
  let processedRepos = 0;
  let reposWithContent = 0;

  for (const repo of orderedRepos) {
    try {
      const result = await processRepo(repo.org, repo.name);
      totalAdrs += result.adrCount;
      totalChangelogs += result.changelogCount;
      totalReleases += result.releaseCount;
      totalCommits += result.commitCount;
      processedRepos++;

      const repoTotal = result.adrCount + result.changelogCount + result.releaseCount + result.commitCount;
      if (repoTotal > 0) reposWithContent++;
    } catch (e) {
      console.error(`  Error processing ${repo.org}/${repo.name}: ${e.message}`);
    }
  }

  const grandTotal = totalAdrs + totalChangelogs + totalReleases + totalCommits;

  console.log('\n=========================================================================');
  console.log('  EVOLUTIONARY KNOWLEDGE INGESTION COMPLETE');
  console.log('=========================================================================');
  console.log(`  Repositories scanned:       ${processedRepos}`);
  console.log(`  Repositories with content:  ${reposWithContent}`);
  console.log(`  ---`);
  console.log(`  ADR chunks:                 ${totalAdrs}`);
  console.log(`  Changelog chunks:           ${totalChangelogs}`);
  console.log(`  Release note chunks:        ${totalReleases}`);
  console.log(`  Commit history chunks:      ${totalCommits}`);
  console.log(`  ---`);
  console.log(`  Total chunks ingested:      ${grandTotal}`);

  // Show updated stats from KB
  try {
    const stats = await pool.query(`
      SELECT doc_type, COUNT(*) as count
      FROM ${SCHEMA}.architecture_docs
      GROUP BY doc_type ORDER BY count DESC
    `);
    console.log('\nKB by doc_type:');
    for (const row of stats.rows) {
      console.log(`  ${(row.doc_type || 'unknown').padEnd(25)} ${row.count}`);
    }
  } catch (e) {
    console.warn(`\nCould not fetch KB stats: ${e.message}`);
  }

  await pool.end();
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  pool.end();
  process.exit(1);
});
