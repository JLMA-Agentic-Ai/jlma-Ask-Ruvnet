const { HybridReasoningBank } = require('agentic-flow/reasoningbank');
const fs = require('fs');
const path = require('path');
const TextChunker = require('../../src/core/TextChunker');

// Force transformers
process.env.FORCE_TRANSFORMERS = 'true';

// OPTIMIZED: Initialize text chunker for large document splitting
const chunker = new TextChunker({
    chunkSize: 2000,   // ~500 tokens per chunk
    overlap: 200,      // 200 char overlap for context continuity
    minChunkSize: 100  // Don't create tiny fragments
});

// Threshold for chunking (documents larger than this get chunked)
const CHUNK_THRESHOLD = 3000; // Characters

async function ingest() {
    console.log('🚀 Starting OPTIMIZED ingestion with text chunking...');

    // Initialize the bank
    const bankModule = await import('agentic-flow/reasoningbank');
    if (bankModule.initialize) {
        await bankModule.initialize();
    }

    const bank = new bankModule.HybridReasoningBank({
        preferWasm: false,
        dbPath: path.resolve(__dirname, '../../.swarm/memory.db')
    });

    console.log('✅ ReasoningBank initialized');

    // Read knowledge file
    const knowledgeFile = path.resolve(__dirname, 'processed_knowledge.json');
    const lines = fs.readFileSync(knowledgeFile, 'utf8').split('\n').filter(l => l.trim());

    console.log(`📚 Found ${lines.length} knowledge entries`);

    let entryCount = 0;
    let chunkCount = 0;
    let chunkedDocs = 0;

    for (const line of lines) {
        try {
            const entry = JSON.parse(line);
            const content = entry.content || '';

            // OPTIMIZED: Chunk large documents for better granular retrieval
            if (content.length > CHUNK_THRESHOLD) {
                const chunks = chunker.chunk(content, entry.metadata);
                chunkedDocs++;

                for (const chunk of chunks) {
                    await bank.reflexion.storeEpisode({
                        task: entry.metadata?.source || 'Knowledge',
                        input: chunk.text,
                        output: '',
                        success: true,
                        metadata: {
                            ...entry.metadata,
                            ...chunk.metadata,
                            originalDocId: entry.metadata?.docId || `doc_${entryCount}`,
                            isChunk: true
                        }
                    });
                    chunkCount++;
                }
            } else {
                // Small document - store as-is
                await bank.reflexion.storeEpisode({
                    task: entry.metadata?.source || 'Knowledge',
                    input: content,
                    output: '',
                    success: true,
                    metadata: {
                        ...entry.metadata,
                        isChunk: false
                    }
                });
                chunkCount++;
            }

            entryCount++;
            if (entryCount % 100 === 0) {
                console.log(`   Processed ${entryCount}/${lines.length} entries (${chunkCount} total chunks)...`);
            }
        } catch (e) {
            console.error(`Error on entry ${entryCount}:`, e.message);
        }
    }

    console.log(`\n✅ Ingestion complete!`);
    console.log(`   📄 Original entries: ${entryCount}`);
    console.log(`   🔪 Documents chunked: ${chunkedDocs}`);
    console.log(`   📦 Total chunks stored: ${chunkCount}`);
}

ingest().catch(console.error);
