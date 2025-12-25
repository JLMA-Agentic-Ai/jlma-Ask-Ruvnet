/**
 * Ingest Documents to Native RuVector Store
 *
 * This script ingests documentation directly into the Native RuVector store
 * for blazing-fast HNSW-based retrieval. Documents are chunked for optimal
 * granularity and embedded using local transformers.
 */

const fs = require('fs');
const path = require('path');
const NativeRuvectorStore = require('../../src/core/NativeRuvectorStore');
const TextChunker = require('../../src/core/TextChunker');

// Force transformers
process.env.FORCE_TRANSFORMERS = 'true';

// Initialize text chunker
const chunker = new TextChunker({
    chunkSize: 2000,
    overlap: 200,
    minChunkSize: 100
});

async function ingestToRuvector() {
    console.log('🚀 Starting Native RuVector Ingestion...');
    console.log('=' .repeat(60));

    // Initialize Native RuVector Store
    const store = new NativeRuvectorStore({
        dimensions: 384,
        maxElements: 200000,
        storagePath: path.resolve(__dirname, '../../data/ruvector.db')
    });

    try {
        await store.initialize();
        console.log('✅ Native RuVector Store initialized');

        const initialStats = await store.getStats();
        console.log(`   Current documents: ${initialStats.documentCount}`);
    } catch (error) {
        console.error('❌ Failed to initialize RuVector:', error.message);
        process.exit(1);
    }

    // Find all markdown files in ruvnet_repos
    const reposDir = path.resolve(__dirname, '../../data_ingestion_github/ruvnet_repos');

    if (!fs.existsSync(reposDir)) {
        console.error('❌ Repos directory not found:', reposDir);
        process.exit(1);
    }

    // Collect all markdown files
    const markdownFiles = [];

    function findMarkdownFiles(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                findMarkdownFiles(fullPath);
            } else if (item.endsWith('.md')) {
                markdownFiles.push(fullPath);
            }
        }
    }

    findMarkdownFiles(reposDir);
    console.log(`📚 Found ${markdownFiles.length} markdown files`);

    // Process each file
    let totalDocuments = 0;
    let totalChunks = 0;
    let errors = 0;

    for (let i = 0; i < markdownFiles.length; i++) {
        const filePath = markdownFiles[i];
        const relativePath = path.relative(reposDir, filePath);
        const repo = relativePath.split(path.sep)[0];
        const filename = path.basename(filePath);

        try {
            const content = fs.readFileSync(filePath, 'utf8');

            if (!content || content.trim().length < 50) {
                continue; // Skip empty or tiny files
            }

            // Chunk large documents
            if (content.length > 3000) {
                const chunks = chunker.chunk(content, {
                    source: `github/ruvnet/${repo}`,
                    name: filename,
                    type: 'documentation'
                });

                for (let j = 0; j < chunks.length; j++) {
                    const chunk = chunks[j];
                    await store.addDocument({
                        id: `ruvnet_${repo}_${filename}_chunk${j}`,
                        content: chunk.text,
                        name: `${filename} (part ${j + 1})`,
                        metadata: {
                            source: `github/ruvnet/${repo}`,
                            repo: repo,
                            filename: filename,
                            chunkIndex: j,
                            totalChunks: chunks.length,
                            type: 'documentation',
                            timestamp: new Date().toISOString()
                        }
                    });
                    totalChunks++;
                }
            } else {
                // Store small documents as-is
                await store.addDocument({
                    id: `ruvnet_${repo}_${filename}`,
                    content: content,
                    name: filename,
                    metadata: {
                        source: `github/ruvnet/${repo}`,
                        repo: repo,
                        filename: filename,
                        type: 'documentation',
                        timestamp: new Date().toISOString()
                    }
                });
                totalChunks++;
            }

            totalDocuments++;

            if ((i + 1) % 20 === 0) {
                console.log(`   Processed ${i + 1}/${markdownFiles.length} files (${totalChunks} chunks)...`);
            }
        } catch (error) {
            console.error(`   ❌ Error processing ${relativePath}:`, error.message);
            errors++;
        }
    }

    // Commit to persistence
    console.log('\n💾 Committing to RuVector...');
    await store.commit();

    // Final stats
    const finalStats = await store.getStats();

    console.log('\n' + '=' .repeat(60));
    console.log('✅ INGESTION COMPLETE');
    console.log('=' .repeat(60));
    console.log(`   Files processed: ${totalDocuments}`);
    console.log(`   Total chunks stored: ${totalChunks}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Final document count: ${finalStats.documentCount}`);
    console.log(`   Backend: ${finalStats.backend}`);
    console.log('=' .repeat(60));
}

// Run ingestion
ingestToRuvector().catch(error => {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
});
