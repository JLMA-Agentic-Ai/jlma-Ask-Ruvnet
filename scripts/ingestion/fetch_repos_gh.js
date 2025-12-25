#!/usr/bin/env node
/**
 * GitHub API-based Repository Knowledge Fetcher
 * Uses `gh api` to fetch content from all tracked repos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_CONFIG = path.resolve(__dirname, 'repo_knowledge.json');
const OUTPUT_FILE = path.resolve(__dirname, 'processed_knowledge.json');

// Files to fetch from each repo
const FILES_TO_FETCH = [
    'README.md',
    'package.json',
    'CHANGELOG.md',
    'docs/README.md',
    'src/index.js',
    'src/index.ts',
    'lib/index.js'
];

function parseGitHubUrl(url) {
    // Handle tree/branch/subdir format
    const treeMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/);
    if (treeMatch) {
        return { owner: treeMatch[1], repo: treeMatch[2], branch: treeMatch[3], subdir: treeMatch[4] };
    }
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
        return { owner: match[1], repo: match[2], branch: 'main', subdir: '' };
    }
    return null;
}

function fetchFileViaGH(owner, repo, filePath) {
    try {
        // Use gh api to get file content (base64 encoded)
        const result = execSync(
            `gh api repos/${owner}/${repo}/contents/${filePath} --jq '.content' 2>/dev/null`,
            { encoding: 'utf8', timeout: 30000 }
        ).trim();

        if (result && result !== 'null') {
            // Decode base64
            return Buffer.from(result, 'base64').toString('utf8');
        }
    } catch (e) {
        // File doesn't exist or API error
    }
    return null;
}

function fetchReadmeViaGH(owner, repo) {
    try {
        const result = execSync(
            `gh api repos/${owner}/${repo}/readme --jq '.content' 2>/dev/null`,
            { encoding: 'utf8', timeout: 30000 }
        ).trim();

        if (result && result !== 'null') {
            return Buffer.from(result, 'base64').toString('utf8');
        }
    } catch (e) {
        // No README
    }
    return null;
}

async function main() {
    console.log('🚀 GitHub API Repository Knowledge Fetcher\n');
    console.log('='.repeat(60));

    const repos = JSON.parse(fs.readFileSync(REPO_CONFIG, 'utf8'));
    console.log(`📚 Processing ${repos.length} repositories\n`);

    const allEntries = [];

    for (const repo of repos) {
        console.log(`\n📦 ${repo.name}`);
        console.log('-'.repeat(40));

        const parsed = parseGitHubUrl(repo.github);
        if (!parsed) {
            console.log(`   ⚠️  Invalid GitHub URL`);
            continue;
        }

        const { owner, repo: repoName, branch, subdir } = parsed;
        console.log(`   📂 ${owner}/${repoName}${subdir ? ` (${subdir})` : ''}`);

        // Fetch README
        const readme = fetchReadmeViaGH(owner, repoName);
        if (readme) {
            console.log(`   ✅ README.md (${readme.length} chars)`);
            allEntries.push({
                content: readme,
                metadata: {
                    source: `${repo.name}/README.md`,
                    type: 'readme',
                    repo_name: repo.name,
                    version: repo.version,
                    npm_package: repo.npm,
                    github_url: repo.github,
                    recency_score: 1.0,
                    fetched_at: new Date().toISOString()
                }
            });
        }

        // Fetch other files
        for (const file of FILES_TO_FETCH) {
            if (file === 'README.md') continue; // Already fetched

            const filePath = subdir ? `${subdir}/${file}` : file;
            const content = fetchFileViaGH(owner, repoName, filePath);

            if (content) {
                console.log(`   ✅ ${file} (${content.length} chars)`);
                allEntries.push({
                    content: content,
                    metadata: {
                        source: `${repo.name}/${file}`,
                        type: file.endsWith('.json') ? 'json' : file.endsWith('.md') ? 'markdown' : 'code',
                        repo_name: repo.name,
                        file_path: filePath,
                        version: repo.version,
                        recency_score: 1.0,
                        fetched_at: new Date().toISOString()
                    }
                });
            }
        }
    }

    // Write output
    console.log('\n' + '='.repeat(60));
    console.log(`📝 Writing ${allEntries.length} entries to processed_knowledge.json`);

    const outputStream = fs.createWriteStream(OUTPUT_FILE);
    for (const entry of allEntries) {
        outputStream.write(JSON.stringify(entry) + '\n');
    }
    outputStream.end();

    // Summary table
    console.log('\n📊 Summary:\n');
    console.log('| Repository      | Entries |');
    console.log('|-----------------|---------|');
    for (const repo of repos) {
        const count = allEntries.filter(e => e.metadata.repo_name === repo.name).length;
        console.log(`| ${repo.name.padEnd(15)} | ${count.toString().padEnd(7)} |`);
    }
    console.log(`| **TOTAL**       | ${allEntries.length.toString().padEnd(7)} |`);

    console.log('\n✅ Knowledge fetch complete!');
    console.log('🔄 Next: Run `node scripts/ingestion/ingest_correct.js` to build the SQLite knowledge base');
}

main().catch(console.error);
