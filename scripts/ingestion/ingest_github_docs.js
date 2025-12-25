/**
 * Ingest GitHub Documentation to Agentic Flow
 *
 * This script ingests the downloaded ruvNet documentation into the
 * HybridReasoningBank (SQLite-based) which will be available to the app.
 * When deployed to Railway, the app can migrate this to Native RuVector.
 */

const fs = require('fs');
const path = require('path');

// Force transformers
process.env.FORCE_TRANSFORMERS = 'true';

// Text chunker inline (to avoid module loading issues)
class SimpleChunker {
    constructor(chunkSize = 2000, overlap = 200) {
        this.chunkSize = chunkSize;
        this.overlap = overlap;
    }

    chunk(text, metadata = {}) {
        const chunks = [];
        let start = 0;
        let index = 0;

        while (start < text.length) {
            const end = Math.min(start + this.chunkSize, text.length);
            const chunkText = text.substring(start, end);

            chunks.push({
                text: chunkText,
                metadata: {
                    ...metadata,
                    chunkIndex: index,
                    charStart: start,
                    charEnd: end
                }
            });

            start = end - this.overlap;
            if (start >= text.length - this.overlap) break;
            index++;
        }

        return chunks;
    }
}

const chunker = new SimpleChunker(2000, 200);

async function ingestDocs() {
    console.log('🚀 Starting GitHub Documentation Ingestion...');
    console.log('=' .repeat(60));

    // Initialize agentic-flow reasoning bank
    const bankModule = await import('agentic-flow/reasoningbank');

    if (bankModule.initialize) {
        await bankModule.initialize();
    }

    const bank = new bankModule.HybridReasoningBank({
        preferWasm: false,
        dbPath: path.resolve(__dirname, '../../.swarm/memory.db')
    });

    console.log('✅ ReasoningBank initialized');

    // Find all markdown files
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
                continue;
            }

            const metadata = {
                source: `github/ruvnet/${repo}`,
                repo: repo,
                filename: filename,
                type: 'documentation',
                timestamp: new Date().toISOString()
            };

            // Chunk large documents
            if (content.length > 3000) {
                const chunks = chunker.chunk(content, metadata);

                for (const chunk of chunks) {
                    await bank.reflexion.storeEpisode({
                        task: `github/ruvnet/${repo}/${filename}`,
                        input: chunk.text,
                        output: '',
                        success: true,
                        metadata: {
                            ...chunk.metadata,
                            docId: `ruvnet_${repo}_${filename}_chunk${chunk.metadata.chunkIndex}`,
                            isChunk: true
                        }
                    });
                    totalChunks++;
                }
            } else {
                await bank.reflexion.storeEpisode({
                    task: `github/ruvnet/${repo}/${filename}`,
                    input: content,
                    output: '',
                    success: true,
                    metadata: {
                        ...metadata,
                        docId: `ruvnet_${repo}_${filename}`,
                        isChunk: false
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

    console.log('\n' + '=' .repeat(60));
    console.log('✅ INGESTION COMPLETE');
    console.log('=' .repeat(60));
    console.log(`   Files processed: ${totalDocuments}`);
    console.log(`   Total chunks stored: ${totalChunks}`);
    console.log(`   Errors: ${errors}`);
    console.log('=' .repeat(60));
}

ingestDocs().catch(error => {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
});
