const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for tracked repositories
const TRACKED_REPOS = [
    {
        name: 'Ask-Ruvnet',
        url: 'https://github.com/stuinfla/Ask-Ruvnet.git',
        path: path.resolve(__dirname, '../../') // Self
    }
    // Add more repos here as needed
];

const KNOWLEDGE_FILE = path.resolve(__dirname, 'repo_knowledge.json');
const VERSION_FILE = path.resolve(__dirname, 'repo_versions.json');

// Load previous versions
function loadVersions() {
    if (fs.existsSync(VERSION_FILE)) {
        return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    }
    return {};
}

// Save current versions
function saveVersions(versions) {
    fs.writeFileSync(VERSION_FILE, JSON.stringify(versions, null, 2));
}

async function trackRepos() {
    console.log('🤖 Starting Agentic Repo Tracker...');

    const previousVersions = loadVersions();
    const currentVersions = {};
    let updatesFound = 0;

    for (const repo of TRACKED_REPOS) {
        console.log(`\n📂 Checking ${repo.name}...`);
        try {
            // Get latest commit info
            const lastCommit = execSync(`cd "${repo.path}" && git log -1 --format=%H`).toString().trim();
            const lastMessage = execSync(`cd "${repo.path}" && git log -1 --format=%s`).toString().trim();
            const lastDate = execSync(`cd "${repo.path}" && git log -1 --format=%aI`).toString().trim();
            const branch = execSync(`cd "${repo.path}" && git rev-parse --abbrev-ref HEAD`).toString().trim();

            currentVersions[repo.name] = {
                commit: lastCommit,
                date: lastDate,
                branch: branch
            };

            // Check if this is an update
            const isUpdate = previousVersions[repo.name] &&
                previousVersions[repo.name].commit !== lastCommit;

            if (!previousVersions[repo.name]) {
                console.log(`   ✨ NEW: First time tracking this repo`);
            } else if (isUpdate) {
                console.log(`   🔄 UPDATE DETECTED!`);
                console.log(`      Old: ${previousVersions[repo.name].commit.substring(0, 7)}`);
                console.log(`      New: ${lastCommit.substring(0, 7)}`);
                updatesFound++;
            } else {
                console.log(`   ✅ No changes since last check`);
                continue; // Skip ingestion if no changes
            }

            console.log(`   📝 ${lastMessage}`);
            console.log(`   📅 ${lastDate}`);

            // Create versioned knowledge entry
            const entry = {
                content: `[Repository: ${repo.name}]
Version: ${lastCommit.substring(0, 7)}
Branch: ${branch}
Last Update: ${lastDate}
Latest Changes: ${lastMessage}

This repository is actively tracked and automatically updated.`,
                metadata: {
                    source: `repo_${repo.name}`,
                    type: 'repo_version',
                    repo_name: repo.name,
                    version: lastCommit,
                    version_short: lastCommit.substring(0, 7),
                    branch: branch,
                    timestamp: lastDate,
                    last_message: lastMessage,
                    recency_score: 1.0,
                    is_update: isUpdate
                }
            };

            // Append to knowledge file
            fs.appendFileSync(KNOWLEDGE_FILE, JSON.stringify(entry) + '\n');
            console.log(`   ✅ Version tracked and ingested`);

        } catch (e) {
            console.error(`   ❌ Error tracking ${repo.name}:`, e.message);
        }
    }

    // Save current versions
    saveVersions(currentVersions);

    console.log(`\n🎯 Summary:`);
    console.log(`   Repos Tracked: ${TRACKED_REPOS.length}`);
    console.log(`   Updates Found: ${updatesFound}`);
    console.log(`   Version File: ${VERSION_FILE}`);
    console.log('✅ Repo tracking complete.');

    return updatesFound;
}

// If run directly
if (require.main === module) {
    trackRepos();
}

module.exports = { trackRepos };
