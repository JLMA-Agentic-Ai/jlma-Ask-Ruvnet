#!/usr/bin/env node
/**
 * Ingest ALL RuvNet GitHub Repository Documentation to KB
 *
 * Fetches README and docs from all ruvnet GitHub repos
 * and ingests them into the PostgreSQL knowledge base.
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
  password: 'guruKB2025',
  database: 'postgres'
});

const SCHEMA = 'ask_ruvnet';
const TEMP_DIR = '/tmp/ruvnet-repos';

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
 * Get list of all RuvNet repos from GitHub using gh CLI
 */
function getRuvnetRepos() {
  try {
    const result = spawnSync('gh', [
      'repo', 'list', 'ruvnet',
      '--limit', '150',
      '--json', 'name',
      '--jq', '.[] | .name'
    ], { encoding: 'utf-8', timeout: 30000 });

    if (result.error) throw result.error;
    return result.stdout.trim().split('\n').filter(r => r);
  } catch (e) {
    console.error('Error fetching repo list:', e.message);
    return [];
  }
}

/**
 * Clone or update a repo to temp directory using git CLI safely
 */
function cloneRepo(repoName) {
  const repoPath = path.join(TEMP_DIR, repoName);
  const repoUrl = `https://github.com/ruvnet/${repoName}.git`;

  if (fs.existsSync(repoPath)) {
    // Update existing
    try {
      const result = spawnSync('git', ['pull', '--quiet'], {
        cwd: repoPath,
        timeout: 60000,
        encoding: 'utf-8'
      });
      if (result.status === 0) return repoPath;
      // Failed to pull, remove and re-clone
      fs.rmSync(repoPath, { recursive: true, force: true });
    } catch {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }

  // Clone fresh using execFileSync for safety
  try {
    execFileSync('git', ['clone', '--depth', '1', '--quiet', repoUrl, repoPath], {
      timeout: 120000
    });
    return repoPath;
  } catch (e) {
    console.warn(`  Failed to clone ${repoName}: ${e.message}`);
    return null;
  }
}

/**
 * Find all markdown files in a repo
 */
function findMarkdownFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);

    // Skip common non-doc directories
    if (['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__', 'venv'].includes(item)) {
      continue;
    }

    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (stat.isFile() && /\.(md|txt|rst)$/i.test(item)) {
        files.push(fullPath);
      }
    } catch {}
  }

  return files;
}

/**
 * Ingest a single file into KB
 */
async function ingestFile(filePath, repoName, repoPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(repoPath + '/', '');
  const hash = getHash(content);
  const pathHash = hash.substring(0, 8);

  // Delete old entries for this file
  await pool.query(
    `DELETE FROM ${SCHEMA}.architecture_docs WHERE file_path = $1`,
    [filePath]
  );

  const chunks = chunkText(content, 600);
  let ingested = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const docId = `github-${repoName}-${pathHash}-${i}`;
    const titleMatch = chunk.match(/^#\s+(.+)/m) || chunk.match(/^(.{1,80})/);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath);

    const embedding = await getEmbedding(chunk);

    // Extract topics from content
    const topics = ['github-repo', repoName];
    if (/agent|swarm|orchestrat/i.test(chunk)) topics.push('agents');
    if (/vector|embed/i.test(chunk)) topics.push('vectors');
    if (/neural|ml|ai/i.test(chunk)) topics.push('ai');
    if (/api|endpoint|rest/i.test(chunk)) topics.push('api');
    if (/docker|deploy|cloud/i.test(chunk)) topics.push('deployment');

    await pool.query(`
      INSERT INTO ${SCHEMA}.architecture_docs
      (doc_id, title, content, file_path, section_index, file_hash,
       package_name, package_version, doc_type, topics, embedding)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (doc_id) DO UPDATE SET
        content = $3, embedding = $11, updated_at = NOW()
    `, [
      docId, title, chunk, filePath, i, hash,
      repoName, 'github', 'github-repository',
      topics, embedding
    ]);
    ingested++;
  }

  return ingested;
}

/**
 * Ingest all docs from a repo
 */
async function ingestRepo(repoName) {
  const repoPath = cloneRepo(repoName);
  if (!repoPath) return 0;

  const files = findMarkdownFiles(repoPath);
  if (files.length === 0) {
    console.log(`  ${repoName}: No markdown files found`);
    return 0;
  }

  let total = 0;
  for (const file of files) {
    try {
      const chunks = await ingestFile(file, repoName, repoPath);
      total += chunks;
    } catch (e) {
      console.warn(`    Error ingesting ${path.basename(file)}: ${e.message}`);
    }
  }

  console.log(`  ${repoName}: ${files.length} files, ${total} chunks`);
  return total;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  INGESTING ALL RUVNET GITHUB REPOSITORIES');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Get all repos
  console.log('Fetching repository list from GitHub...\n');
  const repos = getRuvnetRepos();
  console.log(`Found ${repos.length} repositories\n`);

  if (repos.length === 0) {
    console.log('No repositories found. Check gh CLI authentication.');
    await pool.end();
    return;
  }

  // Priority repos to process first
  const priorityRepos = [
    'flow-nexus', 'daa', 'SAFLA', 'sublinear-time-solver', 'midstream',
    'genesis', 'QuDAG', 'Quantum-Virtual-Machine', 'Synaptic-Mesh',
    'dreamfactory', 'ARCADIA', 'chatgpt-dev-mode', 'agentic-search'
  ];

  // Sort repos: priority first, then alphabetical
  const sortedRepos = [
    ...priorityRepos.filter(r => repos.includes(r)),
    ...repos.filter(r => !priorityRepos.includes(r)).sort()
  ];

  let totalChunks = 0;
  let processedRepos = 0;

  console.log('Processing repositories:\n');

  for (const repo of sortedRepos) {
    try {
      const chunks = await ingestRepo(repo);
      totalChunks += chunks;
      processedRepos++;
    } catch (e) {
      console.error(`  Error processing ${repo}: ${e.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  GITHUB INGESTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Repositories processed: ${processedRepos}`);
  console.log(`  Total chunks ingested:  ${totalChunks}`);

  // Show updated stats
  const stats = await pool.query(`
    SELECT doc_type, COUNT(*) as count
    FROM ${SCHEMA}.architecture_docs
    GROUP BY doc_type ORDER BY count DESC
  `);
  console.log('\nKB by doc_type:');
  for (const row of stats.rows) {
    console.log(`  ${(row.doc_type || 'unknown').padEnd(25)} ${row.count}`);
  }

  await pool.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  pool.end();
  process.exit(1);
});
