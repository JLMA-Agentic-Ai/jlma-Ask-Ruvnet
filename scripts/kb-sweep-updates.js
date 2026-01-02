#!/usr/bin/env node
/**
 * KB Sweep Updates Tool v1.0.0
 *
 * Automatically checks for RuvNet ecosystem updates every 12 hours
 * and ingests new documentation into the knowledge base.
 *
 * Usage:
 *   node scripts/kb-sweep-updates.js          # Run once
 *   node scripts/kb-sweep-updates.js --watch  # Run every 12 hours
 *   node scripts/kb-sweep-updates.js --force  # Force re-fetch all
 */

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  packages: [
    { name: 'ruvector', repo: 'ruvnet/ruvector' },
    { name: '@ruvector/ruvllm', repo: 'ruvnet/ruvector' },
    { name: '@ruvector/agentic-synth', repo: 'ruvnet/ruvector' },
    { name: '@ruvector/rvlite', repo: 'ruvnet/ruvector' },
    { name: 'agentic-flow', repo: 'ruvnet/agentic-flow' },
    { name: 'claude-flow', repo: 'ruvnet/claude-flow' },
  ],
  stateFile: path.join(__dirname, '../.ruvector/sweep-state.json'),
  docsDir: path.join(__dirname, '../docs'),
  sweepIntervalHours: 12,
};

// Ensure state directory exists
const stateDir = path.dirname(CONFIG.stateFile);
if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
}

// Load or initialize state
function loadState() {
  if (fs.existsSync(CONFIG.stateFile)) {
    return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf-8'));
  }
  return { lastSweep: null, versions: {}, updates: [] };
}

function saveState(state) {
  state.lastSweep = new Date().toISOString();
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

// Safe command execution using execFileSync
function safeExec(command, args, options = {}) {
  try {
    const result = execFileSync(command, args, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, output: '', error: error.message };
  }
}

// Get current npm version
function getNpmVersion(packageName) {
  const result = safeExec('npm', ['view', packageName, 'version']);
  return result.success ? result.output : null;
}

// Get last modified date from npm
function getNpmModified(packageName) {
  const result = safeExec('npm', ['view', packageName, 'time.modified']);
  return result.success ? result.output : null;
}

// Check for package updates
function checkPackageUpdates(state) {
  console.log('\n📦 Checking RuvNet Package Updates...\n');

  const updates = [];

  for (const pkg of CONFIG.packages) {
    const currentVersion = getNpmVersion(pkg.name);
    const modified = getNpmModified(pkg.name);
    const previousVersion = state.versions[pkg.name];

    const isNew = currentVersion !== previousVersion;
    const status = isNew ? '🆕 NEW' : '✅ Current';

    console.log(`   ${pkg.name.padEnd(25)} ${(currentVersion || 'N/A').padEnd(20)} ${status}`);

    if (isNew && currentVersion) {
      updates.push({
        name: pkg.name,
        repo: pkg.repo,
        oldVersion: previousVersion,
        newVersion: currentVersion,
        modified,
      });
      state.versions[pkg.name] = currentVersion;
    }
  }

  return updates;
}

// Fetch docs from GitHub repo
async function fetchRepoDocs(repo, targetDir) {
  console.log(`\n📥 Fetching docs from ${repo}...`);

  const repoName = repo.replace('/', '-');
  const tmpDir = path.join('/tmp', `ruvnet-${repoName}`);
  const repoUrl = `https://github.com/${repo}.git`;

  try {
    // Clone or pull repo using safe execFileSync
    if (fs.existsSync(tmpDir)) {
      safeExec('git', ['-C', tmpDir, 'pull', '--quiet']);
    } else {
      safeExec('git', ['clone', '--depth', '1', repoUrl, tmpDir]);
    }

    // Find and copy markdown files
    const docsPath = path.join(tmpDir, 'docs');
    const readmePath = path.join(tmpDir, 'README.md');
    const repoShortName = repo.split('/')[1];

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

    console.log(`   ✅ Copied ${filesCopied} docs from ${repo}`);
    return filesCopied;
  } catch (error) {
    console.log(`   ⚠️  Failed to fetch ${repo}: ${error.message}`);
    return 0;
  }
}

// Run KB ingestion using npm
function runKBIngest() {
  console.log('\n🔄 Running KB Ingestion...\n');

  try {
    const result = spawnSync('npm', ['run', 'kb:ingest'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    return result.status === 0;
  } catch (error) {
    console.error('❌ KB ingestion failed:', error.message);
    return false;
  }
}

// Main sweep function
async function sweep(forceRefresh = false) {
  console.log('═'.repeat(60));
  console.log('🔍 KB SWEEP UPDATES');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  const state = loadState();

  // Check last sweep time
  if (state.lastSweep && !forceRefresh) {
    const lastSweep = new Date(state.lastSweep);
    const hoursSinceLastSweep = (Date.now() - lastSweep.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastSweep < CONFIG.sweepIntervalHours) {
      console.log(`\n⏳ Last sweep: ${lastSweep.toISOString()}`);
      console.log(`   Next sweep in ${(CONFIG.sweepIntervalHours - hoursSinceLastSweep).toFixed(1)} hours`);
      console.log(`   Use --force to run now\n`);
      return;
    }
  }

  // Check for updates
  const updates = checkPackageUpdates(state);

  if (updates.length > 0 || forceRefresh) {
    console.log(`\n📊 Found ${updates.length} package update(s)`);

    // Get unique repos to fetch
    const repos = [...new Set(updates.map(u => u.repo))];

    for (const repo of repos) {
      await fetchRepoDocs(repo, CONFIG.docsDir);
    }

    // Run KB ingestion
    runKBIngest();

    // Record updates
    state.updates.push({
      timestamp: new Date().toISOString(),
      packages: updates.map(u => `${u.name}@${u.newVersion}`),
    });

    // Keep only last 50 updates
    if (state.updates.length > 50) {
      state.updates = state.updates.slice(-50);
    }
  } else {
    console.log('\n✅ All packages up to date - no ingestion needed');
  }

  saveState(state);

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Sweep complete');
  console.log('═'.repeat(60));
}

// Watch mode - run every 12 hours
function watchMode() {
  console.log(`\n👀 Watch mode enabled - checking every ${CONFIG.sweepIntervalHours} hours`);
  console.log('   Press Ctrl+C to stop\n');

  // Run immediately
  sweep();

  // Then run on interval
  setInterval(() => {
    sweep();
  }, CONFIG.sweepIntervalHours * 60 * 60 * 1000);
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--watch')) {
  watchMode();
} else if (args.includes('--force')) {
  sweep(true);
} else if (args.includes('--help')) {
  console.log(`
KB Sweep Updates Tool

Usage:
  node scripts/kb-sweep-updates.js          # Run once (skips if <12h since last)
  node scripts/kb-sweep-updates.js --watch  # Run every 12 hours
  node scripts/kb-sweep-updates.js --force  # Force refresh all packages
  node scripts/kb-sweep-updates.js --help   # Show this help

Crontab example (every 12 hours):
  0 */12 * * * cd /path/to/project && node scripts/kb-sweep-updates.js
`);
} else {
  sweep();
}
