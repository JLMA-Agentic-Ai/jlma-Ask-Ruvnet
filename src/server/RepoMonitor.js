const { trackRepos } = require('../../scripts/ingestion/track_repos');
const { execSync } = require('child_process');
const path = require('path');

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

class RepoMonitor {
    constructor() {
        this.isRunning = false;
        this.mergeScript = path.resolve(__dirname, '../../scripts/ingestion/merge_knowledge.js');
        this.ingestScript = path.resolve(__dirname, '../../scripts/ingestion/ingest_correct.js');
    }

    async start() {
        console.log('🤖 Starting Automatic Repo Monitor...');
        console.log(`   Check interval: Every 2 days`);

        // Run immediately on startup
        await this.checkAndUpdate();

        // Then schedule every 2 days
        this.intervalId = setInterval(async () => {
            await this.checkAndUpdate();
        }, TWO_DAYS_MS);

        this.isRunning = true;
        console.log('✅ Repo Monitor is active');
    }

    async checkAndUpdate() {
        console.log('\n🔍 [Repo Monitor] Running scheduled check...');
        const timestamp = new Date().toISOString();

        try {
            // Run repo tracker
            const updatesFound = await trackRepos();

            if (updatesFound > 0) {
                console.log(`🔄 [Repo Monitor] ${updatesFound} repo updates detected!`);

                // Merge new knowledge
                console.log('📦 [Repo Monitor] Merging knowledge...');
                execSync(`node "${this.mergeScript}"`, { stdio: 'inherit' });

                // Re-ingest into database
                console.log('💾 [Repo Monitor] Re-ingesting into database...');
                execSync(`node "${this.ingestScript}"`, { stdio: 'inherit' });

                console.log('✅ [Repo Monitor] Knowledge base updated successfully!');
            } else {
                console.log('✅ [Repo Monitor] No repository updates found');
            }

            console.log(`⏰ [Repo Monitor] Next check in 2 days (${new Date(Date.now() + TWO_DAYS_MS).toISOString()})`);
        } catch (error) {
            console.error('❌ [Repo Monitor] Error during check:', error.message);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            console.log('🛑 Repo Monitor stopped');
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            checkIntervalMs: TWO_DAYS_MS,
            checkIntervalHuman: '2 days'
        };
    }
}

// Singleton instance
const repoMonitor = new RepoMonitor();

module.exports = repoMonitor;
