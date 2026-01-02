#!/usr/bin/env node
/**
 * Knowledge Base Ingestion Script
 *
 * Ingests comprehensive documentation into RuVector knowledge base.
 * Uses semantic chunking by sections and generates embeddings.
 *
 * WHAT IT INGESTS:
 * - ~/.claude/knowledge/RUVNET_ECOSYSTEM_COMPLETE.md (Core documentation)
 * - Any other .md files in knowledge directories
 *
 * RUN:
 * node scripts/ingest-knowledge-base.js
 *
 * OPTIONS:
 * --dry-run    Show what would be ingested without doing it
 * --force      Clear existing knowledge and re-ingest
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { PersistentVectorDB } = require('../src/storage');

// Configuration
const KNOWLEDGE_SOURCES = [
    { path: path.join(os.homedir(), '.claude/knowledge/RUVNET_ECOSYSTEM_COMPLETE.md'), priority: 1 },
    { path: path.join(process.cwd(), 'docs'), priority: 2 },
    { path: path.join(process.cwd(), 'CLAUDE.md'), priority: 3 },
];

const DIMENSIONS = 128;

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

/**
 * Generate text embedding (hash-based for now, but structured for semantic search)
 * Uses n-gram features for better topic matching
 */
function generateEmbedding(text, dimensions = 128) {
    const vector = new Float32Array(dimensions);
    const str = String(text).toLowerCase();

    // FNV-1a style hashing
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        hash ^= charCode;
        hash = (hash * 16777619) >>> 0;
        const idx = i % dimensions;
        vector[idx] = (vector[idx] + (hash % 1000) / 1000) % 1;
    }

    // Add word features for semantic meaning
    const words = str.split(/\s+/);
    for (const word of words) {
        if (word.length > 2) {
            let wordHash = 0;
            for (let j = 0; j < word.length; j++) {
                wordHash = ((wordHash << 5) - wordHash + word.charCodeAt(j)) >>> 0;
            }
            const idx = wordHash % dimensions;
            vector[idx] = (vector[idx] + 0.2) % 1;
        }
    }

    // Add n-gram features for better matching
    for (let i = 0; i < str.length - 2; i++) {
        const ngram = str.slice(i, i + 3);
        let ngramHash = 0;
        for (let j = 0; j < ngram.length; j++) {
            ngramHash = ((ngramHash << 5) - ngramHash + ngram.charCodeAt(j)) >>> 0;
        }
        const idx = ngramHash % dimensions;
        vector[idx] = (vector[idx] + 0.1) % 1;
    }

    // Normalize to unit vector
    let mag = 0;
    for (let i = 0; i < dimensions; i++) mag += vector[i] * vector[i];
    mag = Math.sqrt(mag) || 1;
    for (let i = 0; i < dimensions; i++) vector[i] /= mag;

    return vector;
}

/**
 * Parse markdown into semantic chunks by section
 */
function parseMarkdownIntoChunks(content, filePath) {
    const chunks = [];
    const lines = content.split('\n');

    let currentSection = { title: 'Introduction', level: 0, content: [], startLine: 0 };
    const sectionStack = [currentSection];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

        if (headerMatch) {
            // Save current section if it has content
            if (currentSection.content.length > 0) {
                const sectionContent = currentSection.content.join('\n').trim();
                if (sectionContent.length > 50) { // Only keep substantial sections
                    chunks.push({
                        id: `${path.basename(filePath)}_${currentSection.startLine}`,
                        title: currentSection.title,
                        content: sectionContent,
                        metadata: {
                            source: filePath,
                            section: currentSection.title,
                            level: currentSection.level,
                            startLine: currentSection.startLine,
                            endLine: i
                        }
                    });
                }
            }

            // Start new section
            const level = headerMatch[1].length;
            const title = headerMatch[2].trim();

            currentSection = {
                title,
                level,
                content: [],
                startLine: i
            };
        } else {
            currentSection.content.push(line);
        }
    }

    // Don't forget the last section
    if (currentSection.content.length > 0) {
        const sectionContent = currentSection.content.join('\n').trim();
        if (sectionContent.length > 50) {
            chunks.push({
                id: `${path.basename(filePath)}_${currentSection.startLine}`,
                title: currentSection.title,
                content: sectionContent,
                metadata: {
                    source: filePath,
                    section: currentSection.title,
                    level: currentSection.level,
                    startLine: currentSection.startLine,
                    endLine: lines.length
                }
            });
        }
    }

    return chunks;
}

/**
 * Detect topics from content
 */
function detectTopics(content) {
    const topics = [];
    const contentLower = content.toLowerCase();

    const topicPatterns = [
        { pattern: /ruvector|vector\s*db|hnsw|embedding/i, topic: 'RuVector' },
        { pattern: /ruvllm|sona|learning\s*loop|trm/i, topic: 'RuvLLM' },
        { pattern: /agentic[- ]flow|agent|reasoningbank/i, topic: 'Agentic Flow' },
        { pattern: /claude[- ]flow|hive[- ]mind|swarm/i, topic: 'Claude Flow' },
        { pattern: /npm|install|package/i, topic: 'Installation' },
        { pattern: /api|endpoint|query|search/i, topic: 'API Reference' },
        { pattern: /deploy|railway|docker|vercel/i, topic: 'Deployment' },
        { pattern: /ollama|qwen|local\s*llm|air[- ]gapped/i, topic: 'Local LLM' },
        { pattern: /performance|benchmark|latency|throughput/i, topic: 'Performance' },
        { pattern: /persist|storage|memory|database/i, topic: 'Persistence' },
        { pattern: /config|setting|option/i, topic: 'Configuration' },
        { pattern: /troubleshoot|error|fix|issue/i, topic: 'Troubleshooting' },
        { pattern: /mcp|tool|server/i, topic: 'MCP Tools' },
        { pattern: /github|repo|pr|issue/i, topic: 'GitHub' },
        { pattern: /rust|wasm|native/i, topic: 'Native/WASM' },
    ];

    for (const { pattern, topic } of topicPatterns) {
        if (pattern.test(contentLower)) {
            topics.push(topic);
        }
    }

    return [...new Set(topics)];
}

/**
 * Process a single file
 */
async function processFile(filePath, db) {
    console.log(`\n📄 Processing: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️ File not found, skipping`);
        return { chunks: 0, skipped: true };
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        // Process directory
        let totalChunks = 0;
        const files = fs.readdirSync(filePath).filter(f => f.endsWith('.md'));
        for (const file of files) {
            const result = await processFile(path.join(filePath, file), db);
            totalChunks += result.chunks;
        }
        return { chunks: totalChunks };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const chunks = parseMarkdownIntoChunks(content, filePath);

    console.log(`   Found ${chunks.length} sections`);

    if (dryRun) {
        for (const chunk of chunks) {
            const topics = detectTopics(chunk.content);
            console.log(`   • ${chunk.title} (${topics.join(', ') || 'general'})`);
        }
        return { chunks: chunks.length, dryRun: true };
    }

    let ingested = 0;
    for (const chunk of chunks) {
        try {
            const topics = detectTopics(chunk.content);
            const vector = generateEmbedding(chunk.title + ' ' + chunk.content);

            await db.insert({
                id: chunk.id,
                vector,
                metadata: {
                    title: chunk.title,
                    content: chunk.content,
                    topics,
                    source: filePath,
                    type: 'documentation',
                    section: chunk.metadata.section,
                    level: chunk.metadata.level,
                    ingestedAt: new Date().toISOString()
                }
            });

            ingested++;
        } catch (err) {
            console.log(`   ⚠️ Error ingesting "${chunk.title}": ${err.message}`);
        }
    }

    console.log(`   ✅ Ingested ${ingested}/${chunks.length} sections`);
    return { chunks: ingested };
}

/**
 * Main ingestion function
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RuVector Knowledge Base Ingestion');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Options: ${dryRun ? 'DRY RUN' : ''} ${force ? 'FORCE' : ''}`);
    console.log('');

    // Initialize database
    const dbPath = path.join(process.cwd(), '.ruvector', 'knowledge-base');

    if (force && !dryRun) {
        console.log('🗑️  Clearing existing knowledge base...');
        const manifestPath = path.join(dbPath, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            fs.rmSync(dbPath, { recursive: true });
        }
    }

    let db = null;
    if (!dryRun) {
        db = new PersistentVectorDB({
            path: dbPath,
            dimensions: DIMENSIONS,
            distanceMetric: 'Cosine',
            saveIntervalMs: 2000,
            useWAL: true
        });
        await db.initialize();
    }

    let totalChunks = 0;

    for (const source of KNOWLEDGE_SOURCES) {
        const result = await processFile(source.path, db);
        totalChunks += result.chunks || 0;
    }

    // Force save
    if (db && !dryRun) {
        await db.flush();
        await db.close();
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Ingestion Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Total sections ingested: ${totalChunks}`);
    console.log(`  Knowledge base path: ${dbPath}`);
    console.log('');

    if (dryRun) {
        console.log('  ℹ️  This was a DRY RUN. Run without --dry-run to actually ingest.');
    } else {
        console.log('  ✅ Knowledge base ready!');
        console.log('');
        console.log('  To verify, run:');
        console.log('    node scripts/ingest-knowledge-base.js --dry-run');
    }
    console.log('═══════════════════════════════════════════════════════════');
}

// Run ingestion
main().catch(err => {
    console.error('Ingestion failed:', err);
    process.exit(1);
});
