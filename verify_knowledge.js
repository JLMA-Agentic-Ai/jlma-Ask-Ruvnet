const fs = require('fs');
const path = require('path');

const KNOWLEDGE_FILE = path.resolve(__dirname, 'scripts/ingestion/processed_knowledge.json');

function verifyKnowledge() {
    if (!fs.existsSync(KNOWLEDGE_FILE)) {
        console.error('❌ Knowledge file not found!');
        return;
    }

    const content = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const entries = lines.map(l => JSON.parse(l));

    console.log('📊 Knowledge Base Verification');
    console.log('='.repeat(40));
    console.log(`Total Entries: ${entries.length}`);

    const types = {};
    entries.forEach(e => {
        const type = e.metadata?.type || 'unknown';
        types[type] = (types[type] || 0) + 1;
    });

    console.log('\nBreakdown by Type:');
    Object.entries(types).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`);
    });

    // Check for specific content
    const hasGitHub = entries.some(e => e.metadata?.type === 'github_commands');
    const hasTranscripts = entries.some(e => e.metadata?.type === 'existing_transcript');
    const hasOptimism = entries.some(e => e.content.toLowerCase().includes('cool') || e.content.toLowerCase().includes('genius'));

    console.log('\nContent Checks:');
    console.log(`- Has GitHub Commands: ${hasGitHub ? '✅' : '❌'}`);
    console.log(`- Has Transcripts: ${hasTranscripts ? '✅' : '❌'}`);

    console.log('\nSample Transcript Title:');
    const transcript = entries.find(e => e.metadata?.type === 'existing_transcript');
    if (transcript) {
        console.log(`"${transcript.metadata.source}"`);
    }

    console.log('='.repeat(40));
}

verifyKnowledge();
