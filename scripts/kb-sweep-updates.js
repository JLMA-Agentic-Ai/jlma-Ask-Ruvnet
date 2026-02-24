#!/usr/bin/env node
/**
 * KB Sweep Updates Tool v2.0.0
 *
 * Dynamically discovers ALL ruvnet repos via GitHub CLI, compares
 * pushedAt timestamps against PostgreSQL sweep state, and only
 * ingests repos that have actually changed.
 *
 * State is stored in PostgreSQL (ask_ruvnet.repo_sweep_state),
 * NOT in flat files.
 *
 * Usage:
 *   node scripts/kb-sweep-updates.js          # Run once
 *   node scripts/kb-sweep-updates.js --watch  # Run every 12 hours
 *   node scripts/kb-sweep-updates.js --force  # Force re-fetch all
 *   node scripts/kb-sweep-updates.js --help   # Show this help
 *
 * Requires:
 *   - DATABASE_URL env var (Neon PostgreSQL)
 *   - gh CLI (/opt/homebrew/bin/gh) authenticated
 *   - pg npm module (project dependency)
 */

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CONFIG = {
  ghBin: '/opt/homebrew/bin/gh',
  ghOrg: 'ruvnet',
  ghLimit: 200,
  docsDir: path.join(__dirname, '../docs'),
  sweepIntervalHours: 12,
};

// ---------------------------------------------------------------------------
// PostgreSQL connection (Neon via DATABASE_URL)
// ---------------------------------------------------------------------------
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Ensure the sweep-state table exists in ask_ruvnet schema.
 */
async function ensureSweepTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ask_ruvnet.repo_sweep_state (
      repo_name         TEXT PRIMARY KEY,
      last_pushed_at    TIMESTAMPTZ,
      last_swept_at     TIMESTAMPTZ,
      description       TEXT,
      stars             INTEGER DEFAULT 0,
      primary_language  TEXT,
      entry_count       INTEGER DEFAULT 0
    );
  `);
}

// ---------------------------------------------------------------------------
// GitHub repo discovery
// ---------------------------------------------------------------------------

/**
 * Fetch all source repos for the ruvnet org/user via `gh repo list`.
 * Returns an array of { name, pushedAt, description, stars, language }.
 */
function fetchAllRepos() {
  const fields = 'name,pushedAt,description,stargazerCount,primaryLanguage';
  const args = [
    'repo', 'list', CONFIG.ghOrg,
    '--limit', String(CONFIG.ghLimit),
    '--source',
    '--json', fields,
  ];

  try {
    const raw = execFileSync(CONFIG.ghBin, args, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const repos = JSON.parse(raw);
    return repos.map(r => ({
      name: r.name,
      pushedAt: r.pushedAt,
      description: r.description || '',
      stars: r.stargazerCount || 0,
      language: r.primaryLanguage ? r.primaryLanguage.name : null,
    }));
  } catch (error) {
    console.error('   Failed to list repos via gh CLI:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sweep state (PostgreSQL)
// ---------------------------------------------------------------------------

/**
 * Load all existing sweep state rows into a Map keyed by repo_name.
 */
async function loadSweepState() {
  const { rows } = await pool.query(
    'SELECT repo_name, last_pushed_at, last_swept_at, entry_count FROM ask_ruvnet.repo_sweep_state'
  );
  const map = new Map();
  for (const row of rows) {
    map.set(row.repo_name, row);
  }
  return map;
}

/**
 * Upsert a repo's sweep state after successful ingestion.
 */
async function updateSweepState(repo, entryCount) {
  await pool.query(`
    INSERT INTO ask_ruvnet.repo_sweep_state
      (repo_name, last_pushed_at, last_swept_at, description, stars, primary_language, entry_count)
    VALUES ($1, $2, NOW(), $3, $4, $5, $6)
    ON CONFLICT (repo_name) DO UPDATE SET
      last_pushed_at   = EXCLUDED.last_pushed_at,
      last_swept_at    = NOW(),
      description      = EXCLUDED.description,
      stars            = EXCLUDED.stars,
      primary_language = EXCLUDED.primary_language,
      entry_count      = EXCLUDED.entry_count;
  `, [repo.name, repo.pushedAt, repo.description, repo.stars, repo.language, entryCount]);
}

// ---------------------------------------------------------------------------
// Determine which repos need ingestion
// ---------------------------------------------------------------------------

/**
 * Compare GitHub repo list against DB sweep state.
 * Returns repos where pushedAt > last_swept_at, or that are brand new.
 */
function findStaleRepos(allRepos, sweepState, forceRefresh) {
  const stale = [];

  for (const repo of allRepos) {
    const existing = sweepState.get(repo.name);

    if (forceRefresh) {
      stale.push({ ...repo, reason: 'forced' });
      continue;
    }

    if (!existing) {
      stale.push({ ...repo, reason: 'new' });
      continue;
    }

    const pushedAt = new Date(repo.pushedAt);
    const sweptAt = existing.last_swept_at ? new Date(existing.last_swept_at) : new Date(0);

    if (pushedAt > sweptAt) {
      stale.push({ ...repo, reason: 'updated' });
    }
  }

  return stale;
}

// ---------------------------------------------------------------------------
// Repo doc fetching (preserved from v1, now accepts dynamic repo info)
// ---------------------------------------------------------------------------

/**
 * Clone/pull a repo and copy its markdown docs into the target directory.
 * Returns the number of files copied.
 */
async function fetchRepoDocs(repoFullName, targetDir) {
  console.log(`\n   Fetching docs from ${repoFullName}...`);

  const repoSafeName = repoFullName.replace('/', '-');
  const tmpDir = path.join('/tmp', `ruvnet-${repoSafeName}`);
  const repoUrl = `https://github.com/${repoFullName}.git`;

  try {
    if (fs.existsSync(tmpDir)) {
      execFileSync('git', ['-C', tmpDir, 'pull', '--quiet'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      execFileSync('git', ['clone', '--depth', '1', repoUrl, tmpDir], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }

    const docsPath = path.join(tmpDir, 'docs');
    const readmePath = path.join(tmpDir, 'README.md');
    const repoShortName = repoFullName.split('/')[1];

    let filesCopied = 0;

    if (fs.existsSync(docsPath)) {
      const files = fs.readdirSync(docsPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const src = path.join(docsPath, file);
        const dest = path.join(targetDir, `${repoShortName}-${file}`);
        fs.copyFileSync(src, dest);
        filesCopied++;
      }
    }

    if (fs.existsSync(readmePath)) {
      const dest = path.join(targetDir, `${repoShortName}-README.md`);
      fs.copyFileSync(readmePath, dest);
      filesCopied++;
    }

    console.log(`   Copied ${filesCopied} doc(s) from ${repoShortName}`);
    return filesCopied;
  } catch (error) {
    console.log(`   Warning: failed to fetch ${repoFullName}: ${error.message}`);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// KB ingestion (preserved from v1)
// ---------------------------------------------------------------------------

/**
 * Run the project's kb:ingest npm script to push docs into the KB.
 */
function runKBIngest() {
  console.log('\n   Running KB ingestion...\n');

  try {
    const result = spawnSync('npm', ['run', 'kb:ingest'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    return result.status === 0;
  } catch (error) {
    console.error('   KB ingestion failed:', error.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main sweep
// ---------------------------------------------------------------------------

async function sweep(forceRefresh = false) {
  console.log('='.repeat(60));
  console.log('KB SWEEP UPDATES v2.0.0 (dynamic repo discovery)');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Ensure the sweep state table exists
  await ensureSweepTable();

  // Load existing sweep state from PostgreSQL
  const sweepState = await loadSweepState();

  // Check last global sweep time (most recent last_swept_at across all repos)
  if (!forceRefresh && sweepState.size > 0) {
    let mostRecent = new Date(0);
    for (const [, row] of sweepState) {
      if (row.last_swept_at) {
        const d = new Date(row.last_swept_at);
        if (d > mostRecent) mostRecent = d;
      }
    }

    const hoursSince = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60);
    if (hoursSince < CONFIG.sweepIntervalHours) {
      console.log(`\n   Last sweep: ${mostRecent.toISOString()}`);
      console.log(`   Next sweep in ${(CONFIG.sweepIntervalHours - hoursSince).toFixed(1)} hours`);
      console.log('   Use --force to run now\n');
      return;
    }
  }

  // Discover all ruvnet repos from GitHub
  console.log(`\n   Discovering repos from github.com/${CONFIG.ghOrg}...`);
  const allRepos = fetchAllRepos();
  console.log(`   Found ${allRepos.length} source repo(s)\n`);

  if (allRepos.length === 0) {
    console.log('   No repos returned from gh CLI. Check authentication.\n');
    return;
  }

  // Determine which repos need ingestion
  const stale = findStaleRepos(allRepos, sweepState, forceRefresh);

  // Print summary table
  console.log('   ' + 'Repo'.padEnd(35) + 'Stars'.padEnd(8) + 'Language'.padEnd(15) + 'Status');
  console.log('   ' + '-'.repeat(68));

  for (const repo of allRepos) {
    const match = stale.find(s => s.name === repo.name);
    let status = 'up to date';
    if (match) {
      status = match.reason === 'new' ? 'NEW' :
               match.reason === 'forced' ? 'FORCED' :
               'UPDATED';
    }
    console.log(
      '   ' +
      repo.name.padEnd(35) +
      String(repo.stars).padEnd(8) +
      (repo.language || '-').padEnd(15) +
      status
    );
  }

  if (stale.length === 0) {
    console.log('\n   All repos up to date - no ingestion needed');
  } else {
    console.log(`\n   ${stale.length} repo(s) need ingestion`);

    let totalDocs = 0;

    for (const repo of stale) {
      const repoFullName = `${CONFIG.ghOrg}/${repo.name}`;
      const docCount = await fetchRepoDocs(repoFullName, CONFIG.docsDir);
      totalDocs += docCount;

      // Update sweep state in PostgreSQL after each repo
      await updateSweepState(repo, docCount);
    }

    if (totalDocs > 0) {
      runKBIngest();
    } else {
      console.log('\n   No new docs found across changed repos - skipping ingestion');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`   Sweep complete. ${allRepos.length} repos checked, ${stale.length} ingested.`);
  console.log('='.repeat(60));
}

// ---------------------------------------------------------------------------
// Watch mode
// ---------------------------------------------------------------------------

function watchMode() {
  console.log(`\n   Watch mode enabled - checking every ${CONFIG.sweepIntervalHours} hours`);
  console.log('   Press Ctrl+C to stop\n');

  // Run immediately
  sweep().catch(err => console.error('Sweep error:', err.message));

  // Then run on interval
  setInterval(() => {
    sweep().catch(err => console.error('Sweep error:', err.message));
  }, CONFIG.sweepIntervalHours * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Cleanup on exit
// ---------------------------------------------------------------------------

async function cleanup() {
  await pool.end();
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
KB Sweep Updates Tool v2.0.0

Dynamically discovers ALL ruvnet repos via GitHub CLI, compares
pushedAt timestamps against PostgreSQL sweep state, and only
ingests repos that have actually changed.

Usage:
  node scripts/kb-sweep-updates.js          # Run once (skips if <12h since last)
  node scripts/kb-sweep-updates.js --watch  # Run every 12 hours
  node scripts/kb-sweep-updates.js --force  # Force refresh all repos
  node scripts/kb-sweep-updates.js --help   # Show this help

State is stored in: ask_ruvnet.repo_sweep_state (PostgreSQL)
Requires: DATABASE_URL env var, gh CLI (/opt/homebrew/bin/gh)

Crontab example (every 12 hours):
  0 */12 * * * cd /path/to/project && node scripts/kb-sweep-updates.js
`);
} else if (args.includes('--watch')) {
  watchMode();
} else {
  const forceRefresh = args.includes('--force');
  sweep(forceRefresh)
    .catch(err => {
      console.error('Sweep failed:', err.message);
      process.exit(1);
    })
    .finally(() => cleanup());
}
