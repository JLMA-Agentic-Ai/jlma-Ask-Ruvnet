#!/usr/bin/env node
/**
 * Comprehensive Repository Knowledge Fetcher
 * Fetches README, docs, and source files from all tracked repos
 * Builds processed_knowledge.json for ingestion into RuVector knowledge base
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load repos from repo_knowledge.json
const REPO_CONFIG_FILE = path.resolve(__dirname, 'repo_knowledge.json');
const OUTPUT_FILE = path.resolve(__dirname, 'processed_knowledge.json');
const TEMP_DIR = path.resolve(__dirname, '../../.temp_repos');

// GitHub raw content URL builder
function getRawUrl(owner, repo, branch, filePath) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

// Fetch URL content
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, {
            headers: { 'User-Agent': 'Ask-Ruvnet-Knowledge-Fetcher' }
        }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                fetchUrl(response.headers.location).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
        });
        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Parse GitHub URL to get owner/repo
function parseGitHubUrl(url) {
    // Handle tree/main/npm/packages/subdir format
    const treeMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/);
    if (treeMatch) {
        return {
            owner: treeMatch[1],
            repo: treeMatch[2],
            branch: treeMatch[3],
            subdir: treeMatch[4]
        };
    }

    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
        return { owner: match[1], repo: match[2], branch: 'main', subdir: '' };
    }
    return null;
}

// Key files to fetch from each repo
const FILES_TO_FETCH = [
    'README.md',
    'package.json',
    'CHANGELOG.md',
    'docs/README.md',
    'docs/API.md',
    'docs/GUIDE.md',
    'src/index.js',
    'src/index.ts',
    'lib/index.js',
    'index.js',
    'index.ts'
];

async function fetchRepoContent(repoInfo, branch = 'main', subdir = '') {
    const parsed = parseGitHubUrl(repoInfo.github);
    if (!parsed) {
        console.log(`   ⚠️  Invalid GitHub URL: ${repoInfo.github}`);
        return [];
    }

    const { owner, repo, branch: urlBranch, subdir: urlSubdir } = parsed;
    const effectiveBranch = urlBranch || branch;
    const effectiveSubdir = urlSubdir || subdir;

    console.log(`   📂 Fetching from ${owner}/${repo} (${effectiveBranch})${effectiveSubdir ? ` subdir: ${effectiveSubdir}` : ''}`);

    const entries = [];

    for (const file of FILES_TO_FETCH) {
        const filePath = effectiveSubdir ? `${effectiveSubdir}/${file}` : file;
        const url = getRawUrl(owner, repo, effectiveBranch, filePath);

        try {
            const content = await fetchUrl(url);
            console.log(`      ✅ ${filePath}`);

            entries.push({
                content: content,
                metadata: {
                    source: `${repoInfo.name}/${filePath}`,
                    type: 'repo_file',
                    repo_name: repoInfo.name,
                    file_path: filePath,
                    version: repoInfo.version || 'latest',
                    github_url: repoInfo.github,
                    npm_package: repoInfo.npm || null,
                    recency_score: 1.0,
                    fetched_at: new Date().toISOString()
                }
            });
        } catch (e) {
            // File doesn't exist or fetch failed - that's ok
        }
    }

    return entries;
}

async function fetchNpmPackageInfo(packageName) {
    if (!packageName) return null;

    const url = `https://registry.npmjs.org/${packageName}`;
    try {
        const data = await fetchUrl(url);
        const pkg = JSON.parse(data);

        return {
            name: pkg.name,
            description: pkg.description,
            latest: pkg['dist-tags']?.latest,
            alpha: pkg['dist-tags']?.alpha || pkg['dist-tags']?.next,
            readme: pkg.readme,
            keywords: pkg.keywords || []
        };
    } catch (e) {
        console.log(`   ⚠️  npm fetch failed for ${packageName}: ${e.message}`);
        return null;
    }
}

async function main() {
    console.log('🚀 Comprehensive Repository Knowledge Fetcher\n');
    console.log('='.repeat(60));

    // Load repo config
    if (!fs.existsSync(REPO_CONFIG_FILE)) {
        console.error('❌ repo_knowledge.json not found!');
        process.exit(1);
    }

    const repos = JSON.parse(fs.readFileSync(REPO_CONFIG_FILE, 'utf8'));
    console.log(`📚 Found ${repos.length} repositories to process\n`);

    const allEntries = [];
    const versionUpdates = {};

    for (const repo of repos) {
        console.log(`\n📦 Processing: ${repo.name}`);
        console.log('-'.repeat(40));

        // Fetch npm package info if available
        if (repo.npm) {
            console.log(`   🔍 Checking npm: ${repo.npm}`);
            const npmInfo = await fetchNpmPackageInfo(repo.npm);

            if (npmInfo) {
                versionUpdates[repo.name] = {
                    version_latest: npmInfo.latest,
                    version_alpha: npmInfo.alpha
                };

                console.log(`      Latest: ${npmInfo.latest || 'N/A'}`);
                console.log(`      Alpha: ${npmInfo.alpha || 'N/A'}`);

                // Add npm README as knowledge
                if (npmInfo.readme) {
                    allEntries.push({
                        content: npmInfo.readme,
                        metadata: {
                            source: `${repo.name}/npm-readme`,
                            type: 'npm_readme',
                            repo_name: repo.name,
                            npm_package: repo.npm,
                            version: npmInfo.latest,
                            description: npmInfo.description,
                            keywords: npmInfo.keywords,
                            recency_score: 1.0,
                            fetched_at: new Date().toISOString()
                        }
                    });
                }
            }
        }

        // Fetch GitHub content
        if (repo.github) {
            const repoEntries = await fetchRepoContent(repo, repo.branch || 'main');
            allEntries.push(...repoEntries);
            console.log(`   📄 Fetched ${repoEntries.length} files from GitHub`);
        }
    }

    // Update repo_knowledge.json with latest versions
    console.log('\n' + '='.repeat(60));
    console.log('📝 Updating repo_knowledge.json with latest versions...');

    for (const repo of repos) {
        if (versionUpdates[repo.name]) {
            repo.version_latest = versionUpdates[repo.name].version_latest || repo.version_latest;
            repo.version_alpha = versionUpdates[repo.name].version_alpha || repo.version_alpha;

            // Use higher version
            if (repo.version_latest && repo.version_alpha) {
                const latest = repo.version_latest.replace(/[^0-9.]/g, '');
                const alpha = repo.version_alpha.replace(/[^0-9.]/g, '');
                repo.version = latest > alpha ? repo.version_latest : repo.version_alpha;
            } else {
                repo.version = repo.version_latest || repo.version_alpha || repo.version;
            }
        }
        repo.last_update = new Date().toISOString();
    }

    fs.writeFileSync(REPO_CONFIG_FILE, JSON.stringify(repos, null, 4));
    console.log('✅ repo_knowledge.json updated');

    // Write processed_knowledge.json
    console.log('\n📝 Writing processed_knowledge.json...');

    // Clear existing file and write new entries
    const outputStream = fs.createWriteStream(OUTPUT_FILE);
    for (const entry of allEntries) {
        outputStream.write(JSON.stringify(entry) + '\n');
    }
    outputStream.end();

    console.log(`✅ Wrote ${allEntries.length} knowledge entries`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:\n');
    console.log('| Repository | Version | Files Fetched |');
    console.log('|------------|---------|---------------|');

    for (const repo of repos) {
        const count = allEntries.filter(e => e.metadata.repo_name === repo.name).length;
        console.log(`| ${repo.name.padEnd(10)} | ${(repo.version || 'N/A').padEnd(7)} | ${count.toString().padEnd(13)} |`);
    }

    console.log('\n✅ Knowledge fetch complete!');
    console.log('🔄 Run `node scripts/ingestion/ingest_correct.js` to build the knowledge base');
}

main().catch(console.error);
