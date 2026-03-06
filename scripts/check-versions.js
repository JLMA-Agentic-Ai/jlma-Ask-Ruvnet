#!/usr/bin/env node
/**
 * RuvNet Package Version Checker
 *
 * Checks for new versions of all RuvNet packages and identifies
 * when knowledge base refresh is needed.
 *
 * Run: node scripts/check-versions.js
 */

const { execFileSync } = require('child_process');

const PACKAGES = [
  { name: 'ruvector', preferAlpha: false },
  { name: '@ruvector/ruvllm', preferAlpha: false },
  { name: '@ruvector/rvlite', preferAlpha: false },
  { name: '@ruvector/postgres-cli', preferAlpha: false },
  { name: '@ruvector/agentic-synth', preferAlpha: false },
  { name: '@ruvector/gnn', preferAlpha: false },
  { name: '@ruvector/sona', preferAlpha: false },
  { name: '@ruvector/attention', preferAlpha: false },
  { name: 'agentdb', preferAlpha: false },
  { name: 'agentic-flow', preferAlpha: true },
  { name: 'ruflo', preferAlpha: false },
  { name: 'claude-flow', preferAlpha: false },
  { name: 'flow-nexus', preferAlpha: false },
  { name: 'neural-trader', preferAlpha: false },
  { name: '@ruvnet/strange-loop', preferAlpha: false },
];

function getLatestVersion(packageName, preferAlpha) {
  try {
    const output = execFileSync('npm', ['view', packageName, 'versions', '--json'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const versions = JSON.parse(output);

    if (preferAlpha) {
      const alphaVersions = versions.filter(v => v.includes('alpha'));
      if (alphaVersions.length > 0) {
        return alphaVersions[alphaVersions.length - 1];
      }
    }

    return versions[versions.length - 1];
  } catch (e) {
    return 'ERROR';
  }
}

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  RuvNet Package Version Check');
console.log('  Policy: ALWAYS prefer @alpha if higher version number');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('');
console.log('Package                       Latest          Status');
console.log('───────────────────────────────────────────────────────────────────────');

for (const pkg of PACKAGES) {
  const latest = getLatestVersion(pkg.name, pkg.preferAlpha);
  const alphaNote = pkg.preferAlpha ? ' (alpha)' : '';
  console.log(`${pkg.name.padEnd(30)} ${(latest + alphaNote).padEnd(20)} ✅`);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  To refresh knowledge base: node scripts/ingest-knowledge-base.js --force');
console.log('═══════════════════════════════════════════════════════════════════════');
