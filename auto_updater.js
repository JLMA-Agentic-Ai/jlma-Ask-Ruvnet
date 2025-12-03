const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
require('dotenv').config();

const REPO_DIR = path.join(__dirname, 'data_ingestion_github');
const INGESTION_SCRIPT = 'rebuild_knowledge_base.js';
const GITHUB_USER = 'ruvnet';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

console.log(`🔄 Starting Advanced Auto-Updater for ${GITHUB_USER}...`);

if (!GITHUB_TOKEN) {
    console.error("❌ Error: GITHUB_TOKEN not found in .env");
    process.exit(1);
}

// Ensure directory exists
if (!fs.existsSync(REPO_DIR)) {
    fs.mkdirSync(REPO_DIR, { recursive: true });
}

// 1. Fetch Top 10 Recently Updated Repos
const options = {
    hostname: 'api.github.com',
    path: `/users/${GITHUB_USER}/repos?sort=updated&per_page=10`,
    method: 'GET',
    headers: {
        'User-Agent': 'Ask-RuvNet-Bot',
        'Authorization': `token ${GITHUB_TOKEN}`
    }
};

let changesDetected = false;

// 3. Scrape Websites
async function scrapeWebsites() {
    console.log("🌍 Checking Websites for updates...");
    const sites = [
        { url: 'https://neural-trader.ruv.io/', file: 'neural_trader.txt' },
        { url: 'https://agentics.ruv.io/', file: 'agentics.txt' },
        { url: 'https://ruv.io/', file: 'ruv_io.txt' }
    ];

    const DATA_DIR = path.join(__dirname, 'data');
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

    for (const site of sites) {
        try {
            // Use curl to fetch content (simple text extraction)
            await new Promise(resolve => {
                exec(`curl -L "${site.url}"`, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
                    if (err) {
                        console.error(`❌ Failed to fetch ${site.url}:`, err.message);
                        resolve();
                        return;
                    }

                    // Simple HTML to Text (strip tags)
                    const text = stdout.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    const filePath = path.join(DATA_DIR, site.file);

                    // Check if content changed
                    let oldContent = '';
                    if (fs.existsSync(filePath)) {
                        oldContent = fs.readFileSync(filePath, 'utf8');
                        // Only compare the body, ignore headers we added manually
                        const oldBody = oldContent.split('---FETCHED CONTENT---')[1] || '';
                        if (oldBody.trim() === text) {
                            console.log(`✅ ${site.url} is unchanged.`);
                            resolve();
                            return;
                        }
                    }

                    // Update File
                    const newContent = `URL: ${site.url}\nFetched: ${new Date().toISOString()}\n\n---FETCHED CONTENT---\n${text}`;
                    fs.writeFileSync(filePath, newContent);
                    console.log(`🚀 UPDATED content from ${site.url}`);
                    changesDetected = true;
                    resolve();
                });
            });
        } catch (e) {
            console.error(`❌ Error scraping ${site.url}:`, e.message);
        }
    }
}

// Main Execution
(async () => {
    // 1. GitHub Updates
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', async () => {
            if (res.statusCode !== 200) {
                console.error(`❌ GitHub API Error: ${res.statusCode} ${res.statusMessage}`);
                console.error(data);
            } else {
                const repos = JSON.parse(data);
                console.log(`🔎 Found ${repos.length} recently updated repositories.`);

                for (const repo of repos) {
                    const repoName = repo.name;
                    const cloneUrl = repo.clone_url;
                    const repoPath = path.join(REPO_DIR, repoName);

                    if (fs.existsSync(repoPath)) {
                        // UPDATE EXISTING
                        await new Promise(resolve => {
                            exec('git pull', { cwd: repoPath }, (err, stdout) => {
                                if (err) console.error(`❌ Update failed for ${repoName}:`, err.message);
                                else if (!stdout.includes('Already up to date')) {
                                    console.log(`🚀 UPDATED ${repoName}`);
                                    changesDetected = true;
                                } else {
                                    console.log(`✅ ${repoName} is up to date.`);
                                }
                                resolve();
                            });
                        });
                    } else {
                        // CLONE NEW
                        console.log(`🆕 NEW REPO FOUND: ${repoName}`);
                        console.log(`📥 Cloning ${cloneUrl}...`);
                        await new Promise(resolve => {
                            exec(`git clone ${cloneUrl}`, { cwd: REPO_DIR }, (err) => {
                                if (err) console.error(`❌ Clone failed for ${repoName}:`, err.message);
                                else {
                                    console.log(`✅ Cloned ${repoName}`);
                                    changesDetected = true;
                                }
                                resolve();
                            });
                        });
                    }
                }
            }

            // 2. Run Website Scraper
            await scrapeWebsites();

            // 3. Trigger Ingestion if needed
            if (changesDetected) {
                console.log("\n📢 Changes detected! Triggering Knowledge Base Rebuild...");
                const ingestProcess = exec(`node ${INGESTION_SCRIPT} "${REPO_DIR}"`);

                ingestProcess.stdout.on('data', data => console.log(data.toString()));
                ingestProcess.stderr.on('data', data => console.error(data.toString()));

                ingestProcess.on('exit', (code) => {
                    console.log(`\n✅ Rebuild complete (Exit Code: ${code})`);
                });
            } else {
                console.log("\n✨ All sources are up to date. No rebuild needed.");
            }
        });
    });

    req.on('error', (e) => console.error(`❌ Request Error: ${e.message}`));
    req.end();
})();
