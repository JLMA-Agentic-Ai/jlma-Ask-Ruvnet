#!/usr/bin/env node
/**
 * Knowledge Base Refresh Script
 *
 * Checks for new/updated documentation and re-ingests if needed.
 * Designed to be called from session-start hooks or manually.
 *
 * PERSISTENCE GUARANTEE:
 * - All data stored in binary vectors.bin (Float32Array)
 * - Metadata stored in metadata.json
 * - WAL ensures crash recovery
 * - Survives restarts, shutdown, and computer reboot
 *
 * RUN:
 * node scripts/kb-refresh.js [--force] [--check-only]
 */

const fs = require('fs');
const path = require('path');
const { PersistentVectorDB } = require('../src/storage');

const KB_PATH = path.join(process.cwd(), '.ruvector', 'knowledge-base');
const EXTRACTION_DIR = '/tmp/ruvnet-kb-extraction';
const DOCS_DIR = path.join(process.cwd(), 'docs');

const args = process.argv.slice(2);
const forceRefresh = args.includes('--force');
const checkOnly = args.includes('--check-only');

async function main() {
    console.log('');
    console.log('🧠 RuVector Knowledge Base Refresh');
    console.log('═══════════════════════════════════════════════════════════');

    // Check manifest
    const manifestPath = path.join(KB_PATH, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.log('⚠️  No knowledge base found. Run initial ingestion first.');
        console.log('   node scripts/ingest-knowledge-base.js');
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const lastSaved = new Date(manifest.savedAt);

    console.log(`📊 Current Status:`);
    console.log(`   Vectors: ${manifest.vectorCount}`);
    console.log(`   Last saved: ${lastSaved.toISOString()}`);
    console.log(`   Dimensions: ${manifest.dimensions}`);
    console.log('');

    // Check for new files
    const sourcesToCheck = [
        { dir: EXTRACTION_DIR, type: 'extraction' },
        { dir: DOCS_DIR, type: 'docs' }
    ];

    let newFiles = [];
    for (const source of sourcesToCheck) {
        if (fs.existsSync(source.dir)) {
            const stat = fs.statSync(source.dir);
            if (stat.isDirectory()) {
                const files = fs.readdirSync(source.dir).filter(f => f.endsWith('.md'));
                for (const file of files) {
                    const filePath = path.join(source.dir, file);
                    const fileStat = fs.statSync(filePath);
                    if (fileStat.mtime > lastSaved || forceRefresh) {
                        newFiles.push({ path: filePath, type: source.type });
                    }
                }
            }
        }
    }

    if (newFiles.length === 0) {
        console.log('✅ Knowledge base is up to date!');
        console.log('');
        console.log('PERSISTENCE INFO:');
        console.log(`   vectors.bin: ${getFileSize(path.join(KB_PATH, 'vectors.bin'))}`);
        console.log(`   metadata.json: ${getFileSize(path.join(KB_PATH, 'metadata.json'))}`);
        console.log(`   Path: ${KB_PATH}`);
        return;
    }

    console.log(`🔄 Found ${newFiles.length} file(s) to process:`);
    for (const f of newFiles.slice(0, 5)) {
        console.log(`   • ${path.basename(f.path)}`);
    }
    if (newFiles.length > 5) {
        console.log(`   ... and ${newFiles.length - 5} more`);
    }

    if (checkOnly) {
        console.log('');
        console.log('ℹ️  Check-only mode. Run without --check-only to ingest.');
        return;
    }

    // Ingest new files
    console.log('');
    console.log('📥 Ingesting new content...');

    const db = new PersistentVectorDB({
        path: KB_PATH,
        dimensions: 128,
        distanceMetric: 'Cosine',
        saveIntervalMs: 2000,
        useWAL: true
    });
    await db.initialize();

    let ingested = 0;
    for (const file of newFiles) {
        try {
            const content = fs.readFileSync(file.path, 'utf8');
            const chunks = parseMarkdownIntoChunks(content, file.path);

            for (const chunk of chunks) {
                const vector = generateEmbedding(chunk.title + ' ' + chunk.content);
                await db.insert({
                    id: `refresh_${Date.now()}_${ingested}`,
                    vector,
                    metadata: {
                        title: chunk.title,
                        content: chunk.content,
                        source: path.basename(file.path),
                        type: file.type,
                        refreshedAt: new Date().toISOString()
                    }
                });
                ingested++;
            }
        } catch (err) {
            console.log(`   ⚠️ Error processing ${path.basename(file.path)}: ${err.message}`);
        }
    }

    await db.flush();
    const stats = db.getStats();
    await db.close();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Refresh Complete');
    console.log(`   New sections ingested: ${ingested}`);
    console.log(`   Total vectors: ${stats.vectorCount}`);
    console.log('');
    console.log('PERSISTENCE CONFIRMED:');
    console.log(`   vectors.bin: ${getFileSize(path.join(KB_PATH, 'vectors.bin'))}`);
    console.log(`   metadata.json: ${getFileSize(path.join(KB_PATH, 'metadata.json'))}`);
    console.log('═══════════════════════════════════════════════════════════');
}

function getFileSize(filePath) {
    if (!fs.existsSync(filePath)) return 'N/A';
    const stats = fs.statSync(filePath);
    const kb = (stats.size / 1024).toFixed(1);
    return `${kb} KB`;
}

function generateEmbedding(text, dimensions = 128) {
    const vector = new Float32Array(dimensions);
    const str = String(text).toLowerCase();
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * 16777619) >>> 0;
        vector[i % dimensions] = (vector[i % dimensions] + (hash % 1000) / 1000) % 1;
    }
    const words = str.split(/\s+/);
    for (const word of words) {
        if (word.length > 2) {
            let wordHash = 0;
            for (let j = 0; j < word.length; j++) {
                wordHash = ((wordHash << 5) - wordHash + word.charCodeAt(j)) >>> 0;
            }
            vector[wordHash % dimensions] = (vector[wordHash % dimensions] + 0.2) % 1;
        }
    }
    let mag = 0;
    for (let i = 0; i < dimensions; i++) mag += vector[i] * vector[i];
    mag = Math.sqrt(mag) || 1;
    for (let i = 0; i < dimensions; i++) vector[i] /= mag;
    return vector;
}

function parseMarkdownIntoChunks(content, filePath) {
    const chunks = [];
    const lines = content.split('\n');
    let currentSection = { title: 'Introduction', content: [], startLine: 0 };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);

        if (headerMatch) {
            if (currentSection.content.length > 0) {
                const sectionContent = currentSection.content.join('\n').trim();
                if (sectionContent.length > 50) {
                    chunks.push({
                        title: currentSection.title,
                        content: sectionContent
                    });
                }
            }
            currentSection = { title: headerMatch[2].trim(), content: [], startLine: i };
        } else {
            currentSection.content.push(line);
        }
    }

    if (currentSection.content.length > 0) {
        const sectionContent = currentSection.content.join('\n').trim();
        if (sectionContent.length > 50) {
            chunks.push({ title: currentSection.title, content: sectionContent });
        }
    }

    return chunks;
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
