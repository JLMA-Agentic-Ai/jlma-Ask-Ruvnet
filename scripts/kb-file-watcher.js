#!/usr/bin/env node
/**
 * KB File Watcher - Auto-rebuild visualization on KB changes
 *
 * Usage: node kb-file-watcher.js [--watch-dirs=docs,data] [--debounce=5000]
 *
 * This is a GLOBAL TOOL - copy to any repo with ruvector-postgres KB
 */
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    watchDirs: (process.argv.find(a => a.startsWith('--watch-dirs='))?.split('=')[1] || 'docs,data').split(','),
    debounceMs: parseInt(process.argv.find(a => a.startsWith('--debounce='))?.split('=')[1] || '5000'),
    autoIngest: !process.argv.includes('--no-ingest'),
    autoRebuild: !process.argv.includes('--no-rebuild'),
    targetScore: parseInt(process.argv.find(a => a.startsWith('--target='))?.split('=')[1] || '98'),
};

const scriptsDir = __dirname;
let debounceTimer = null;
let isProcessing = false;

function log(message, level = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', watch: '👁️' };
    console.log(`[${timestamp}] ${icons[level] || '•'} ${message}`);
}

function runScript(scriptName, args = []) {
    const scriptPath = path.join(scriptsDir, scriptName);
    if (!fs.existsSync(scriptPath)) {
        log(`Script not found: ${scriptName}`, 'warning');
        return false;
    }
    try {
        log(`Running ${scriptName}...`);
        execFileSync('node', [scriptPath, ...args], {
            cwd: path.dirname(scriptsDir),
            stdio: 'inherit'
        });
        return true;
    } catch (e) {
        log(`Error running ${scriptName}: ${e.message}`, 'error');
        return false;
    }
}

async function processChanges(changedFiles) {
    if (isProcessing) {
        log('Already processing, skipping...', 'warning');
        return;
    }
    isProcessing = true;

    try {
        log(`Processing ${changedFiles.length} changed file(s)`, 'watch');
        changedFiles.forEach(f => log(`  • ${f}`));

        // Step 1: Re-ingest changed docs
        if (CONFIG.autoIngest && changedFiles.some(f => f.endsWith('.md'))) {
            log('Re-ingesting documentation...', 'info');
            runScript('ingest-docs-to-kb.js');
        }

        // Step 2: Rebuild visualization
        if (CONFIG.autoRebuild) {
            log('Rebuilding KB visualization...', 'info');
            runScript('kb-universe-data.js');
        }

        // Step 3: Check score and auto-enhance if needed
        const scoreResult = execFileSync('node', [path.join(scriptsDir, 'kb-universe-data.js'), '--score-only'], {
            cwd: path.dirname(scriptsDir),
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        const match = scoreResult.match(/Overall Score:\s*(\d+)\/100/);
        const score = match ? parseInt(match[1]) : 0;

        log(`Current KB Score: ${score}/100`, score >= CONFIG.targetScore ? 'success' : 'warning');

        if (score < CONFIG.targetScore) {
            log(`Score below target (${CONFIG.targetScore}), triggering auto-enhancement...`, 'warning');
            runScript('kb-auto-enhance.js', [`--target=${CONFIG.targetScore}`, '--max-iterations=3']);
        }

        log('Processing complete', 'success');
    } finally {
        isProcessing = false;
    }
}

function setupWatcher(dir) {
    const watchPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(watchPath)) {
        log(`Directory not found: ${dir}`, 'warning');
        return;
    }

    let pendingChanges = [];

    fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.md')) return;

        const fullPath = path.join(dir, filename);
        if (!pendingChanges.includes(fullPath)) {
            pendingChanges.push(fullPath);
        }

        // Debounce
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const files = [...pendingChanges];
            pendingChanges = [];
            processChanges(files);
        }, CONFIG.debounceMs);
    });

    log(`Watching: ${watchPath}`, 'watch');
}

function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👁️  KB File Watcher - Auto-rebuild on changes');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Watch directories: ${CONFIG.watchDirs.join(', ')}`);
    console.log(`   Debounce: ${CONFIG.debounceMs}ms`);
    console.log(`   Auto-ingest: ${CONFIG.autoIngest}`);
    console.log(`   Auto-rebuild: ${CONFIG.autoRebuild}`);
    console.log(`   Target score: ${CONFIG.targetScore}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Set up watchers
    CONFIG.watchDirs.forEach(setupWatcher);

    // Run initial build
    log('Running initial KB build...', 'info');
    runScript('kb-universe-data.js');

    log('\nWatching for changes... Press Ctrl+C to stop.\n', 'watch');
}

main();
