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
    // Add more repos here
];

const KNOWLEDGE_FILE = path.resolve(__dirname, 'repo_knowledge.json');

async function trackRepos() {
    console.log('🕵️‍♀️ Starting Repo Tracker Agent...');

    for (const repo of TRACKED_REPOS) {
        console.log(`Checking ${repo.name}...`);
        try {
            // Check for updates (git fetch)
            // This is a simplified simulation. In a real agent, we would pull and diff.
            const lastCommit = execSync(`cd "${repo.path}" && git log -1 --format=%H`).toString().trim();
            const lastMessage = execSync(`cd "${repo.path}" && git log -1 --format=%s`).toString().trim();
            const lastDate = execSync(`cd "${repo.path}" && git log -1 --format=%aI`).toString().trim();

            console.log(`   Latest Commit: ${lastCommit.substring(0, 7)} - ${lastMessage}`);
            console.log(`   Date: ${lastDate}`);

            // Ingest this metadata as "Recency" signal
            const entry = {
                content: `[Repo Update: ${repo.name}]\nLatest commit: ${lastMessage}\nDate: ${lastDate}\nHash: ${lastCommit}`,
                metadata: {
                    source: `repo_${repo.name}`,
                    type: 'repo_update',
                    timestamp: lastDate,
                    recency_score: 1.0 // High priority
                }
            };

            // Append to knowledge
            fs.appendFileSync(KNOWLEDGE_FILE, JSON.stringify(entry) + '\n');
            console.log('   ✅ Ingested update.');

        } catch (e) {
            console.error(`   ❌ Error tracking ${repo.name}:`, e.message);
        }
    }
    console.log('🎉 Repo tracking complete.');
}

trackRepos();
