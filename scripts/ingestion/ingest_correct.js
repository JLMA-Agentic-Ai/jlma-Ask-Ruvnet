const { HybridReasoningBank } = require('agentic-flow/reasoningbank');
const fs = require('fs');
const path = require('path');

// Force transformers
process.env.FORCE_TRANSFORMERS = 'true';

async function ingest() {
    console.log('🚀 Starting CORRECT ingestion using HybridReasoningBank API...');

    // Initialize the bank
    const bankModule = await import('agentic-flow/reasoningbank');
    if (bankModule.initialize) {
        await bankModule.initialize();
    }

    const bank = new bankModule.HybridReasoningBank({
        preferWasm: false,
        dbPath: path.resolve(__dirname, 'src/server/.swarm/memory.db')
    });

    console.log('✅ ReasoningBank initialized');

    // Read knowledge file
    const knowledgeFile = path.resolve(__dirname, 'processed_knowledge.json');
    const lines = fs.readFileSync(knowledgeFile, 'utf8').split('\n').filter(l => l.trim());

    console.log(`📚 Found ${lines.length} knowledge entries`);

    let count = 0;
    for (const line of lines) {
        try {
            const entry = JSON.parse(line);

            // Use the framework's API
            await bank.reflexion.storeEpisode({
                task: entry.metadata?.source || 'Knowledge',
                input: entry.content,
                output: '',
                success: true,
                metadata: entry.metadata
            });

            count++;
            if (count % 100 === 0) {
                console.log(`   Processed ${count}/${lines.length}...`);
            }
        } catch (e) {
            console.error(`Error on entry ${count}:`, e.message);
        }
    }

    console.log(`\n✅ Ingested ${count} entries into ReasoningBank`);
}

ingest().catch(console.error);
