#!/usr/bin/env node
/**
 * Repository Version Checker
 * Checks npm for latest and alpha versions of tracked packages
 * Updates repo_knowledge.json with current versions
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_KNOWLEDGE_PATH = path.resolve(__dirname, 'repo_knowledge.json');

// Fetch package info from npm registry
async function fetchNpmInfo(packageName) {
    return new Promise((resolve, reject) => {
        const url = `https://registry.npmjs.org/${packageName}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Compare semver versions (returns 1 if a > b, -1 if a < b, 0 if equal)
function compareVersions(a, b) {
    if (!a) return -1;
    if (!b) return 1;

    // Remove leading 'v' and alpha/beta suffixes for base comparison
    const cleanA = a.replace(/^v/, '').split('-')[0];
    const cleanB = b.replace(/^v/, '').split('-')[0];

    const partsA = cleanA.split('.').map(Number);
    const partsB = cleanB.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }

    // If base versions equal, check for alpha/beta
    const hasAlphaA = a.includes('-alpha') || a.includes('-beta');
    const hasAlphaB = b.includes('-alpha') || b.includes('-beta');

    // Stable > alpha/beta for same base version
    if (!hasAlphaA && hasAlphaB) return 1;
    if (hasAlphaA && !hasAlphaB) return -1;

    return 0;
}

async function checkPackageVersions(repo) {
    if (!repo.npm) {
        console.log(`  ⏭️  ${repo.name}: No npm package defined`);
        return repo;
    }

    try {
        console.log(`  🔍 Checking ${repo.npm}...`);
        const info = await fetchNpmInfo(repo.npm);

        if (info.error) {
            console.log(`  ❌ ${repo.name}: ${info.error}`);
            return repo;
        }

        const distTags = info['dist-tags'] || {};
        const latest = distTags.latest || null;
        const alpha = distTags.alpha || distTags.next || distTags.beta || null;

        // Determine which version to use (higher of latest vs alpha)
        let useVersion = latest;
        let useBranch = 'main';

        if (alpha && compareVersions(alpha, latest) > 0) {
            useVersion = alpha;
            useBranch = 'alpha';
            console.log(`  🔶 ${repo.name}: Alpha ${alpha} > Latest ${latest} → using alpha`);
        } else if (alpha) {
            console.log(`  🟢 ${repo.name}: Latest ${latest} >= Alpha ${alpha} → using latest`);
        } else {
            console.log(`  🟢 ${repo.name}: Latest ${latest} (no alpha available)`);
        }

        return {
            ...repo,
            version_latest: latest,
            version_alpha: alpha,
            version: useVersion,
            branch: useBranch,
            last_update: new Date().toISOString()
        };

    } catch (error) {
        console.log(`  ❌ ${repo.name}: Error - ${error.message}`);
        return repo;
    }
}

async function main() {
    console.log('🔄 Repository Version Checker\n');
    console.log('=' .repeat(50));

    // Load current repo knowledge
    let repos;
    try {
        repos = JSON.parse(fs.readFileSync(REPO_KNOWLEDGE_PATH, 'utf8'));
        console.log(`📂 Loaded ${repos.length} repositories from repo_knowledge.json\n`);
    } catch (error) {
        console.error('❌ Failed to load repo_knowledge.json:', error.message);
        process.exit(1);
    }

    // Check each repository
    const updatedRepos = [];
    for (const repo of repos) {
        const updated = await checkPackageVersions(repo);
        updatedRepos.push(updated);
    }

    // Save updated repo knowledge
    fs.writeFileSync(REPO_KNOWLEDGE_PATH, JSON.stringify(updatedRepos, null, 4));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Updated repo_knowledge.json\n');

    // Summary table
    console.log('📊 Version Summary:\n');
    console.log('| Package | Latest | Alpha | Using | Branch |');
    console.log('|---------|--------|-------|-------|--------|');
    for (const repo of updatedRepos) {
        const latest = repo.version_latest || 'N/A';
        const alpha = repo.version_alpha || 'N/A';
        const using = repo.version || 'N/A';
        const branch = repo.branch || 'main';
        console.log(`| ${repo.name.padEnd(15)} | ${latest.padEnd(10)} | ${alpha.padEnd(15)} | ${using.padEnd(10)} | ${branch.padEnd(6)} |`);
    }
}

main().catch(console.error);
