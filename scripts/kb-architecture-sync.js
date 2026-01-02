#!/usr/bin/env node
/**
 * Architecture Knowledge Base Sync
 *
 * Monitors docs/architecture for changes and auto-syncs to ruvector-postgres.
 * Uses the standard KB architecture with schema isolation.
 *
 * USAGE:
 *   node scripts/kb-architecture-sync.js --ingest      # Full ingest
 *   node scripts/kb-architecture-sync.js --watch       # Watch for changes
 *   node scripts/kb-architecture-sync.js --status      # Show status
 *   node scripts/kb-architecture-sync.js --query "..." # Test query
 *
 * PERSISTENCE:
 *   - All data stored in ruvector-postgres (Docker on port 5435)
 *   - Schema: ask_ruvnet (isolated per project)
 *   - Embeddings: 384-dimensional (MiniLM)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

// Configuration
const CONFIG = {
    // PostgreSQL connection (ruvector-postgres)
    pg: {
        host: process.env.RUVECTOR_HOST || 'localhost',
        port: parseInt(process.env.RUVECTOR_PORT || '5435'),
        database: 'postgres',
        user: 'postgres',
        password: process.env.RUVECTOR_PASSWORD || 'guruKB2025'
    },

    // Schema for this project
    schema: 'ask_ruvnet',

    // Directories to monitor
    watchDirs: [
        'docs/architecture',
        'docs/architecture/claude-skills'
    ],

    // File patterns
    patterns: ['**/*.md'],

    // Embedding dimensions (MiniLM)
    dimensions: 384,

    // Manifest path
    manifestPath: '.ruvector/architecture-manifest.json'
};

// ============================================================================
// DATABASE LAYER
// ============================================================================

class ArchitectureKB {
    constructor(config = CONFIG) {
        this.config = config;
        this.pool = null;
    }

    async connect() {
        this.pool = new Pool(this.config.pg);

        // Test connection
        const client = await this.pool.connect();
        try {
            await client.query('SELECT 1');
            console.log(`✅ Connected to ruvector-postgres on port ${this.config.pg.port}`);
        } finally {
            client.release();
        }

        return this;
    }

    async initialize() {
        const client = await this.pool.connect();
        try {
            // Create schema
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.config.schema}`);

            // Create architecture knowledge table
            await client.query(`
                CREATE TABLE IF NOT EXISTS ${this.config.schema}.architecture_docs (
                    id SERIAL PRIMARY KEY,
                    doc_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    section_header TEXT,
                    section_index INTEGER DEFAULT 0,
                    file_hash TEXT NOT NULL,
                    embedding real[],
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Create index for semantic search
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_arch_embedding
                ON ${this.config.schema}.architecture_docs
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
            `).catch(() => {
                // IVFFlat may not be available, fallback to btree
                console.log('   Note: IVFFlat not available, using standard index');
            });

            // Create file tracking table
            await client.query(`
                CREATE TABLE IF NOT EXISTS ${this.config.schema}.file_tracking (
                    id SERIAL PRIMARY KEY,
                    file_path TEXT UNIQUE NOT NULL,
                    file_hash TEXT NOT NULL,
                    last_synced TIMESTAMP DEFAULT NOW(),
                    chunk_count INTEGER DEFAULT 0
                )
            `);

            console.log(`✅ Initialized schema: ${this.config.schema}`);
        } finally {
            client.release();
        }

        return this;
    }

    async getFileHash(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
    }

    async isFileChanged(filePath) {
        const currentHash = await this.getFileHash(filePath);

        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `SELECT file_hash FROM ${this.config.schema}.file_tracking WHERE file_path = $1`,
                [filePath]
            );

            if (result.rows.length === 0) return true; // New file
            return result.rows[0].file_hash !== currentHash;
        } finally {
            client.release();
        }
    }

    async generateEmbedding(text) {
        // Use ruvector_embed function if available, otherwise use simple hash-based
        const client = await this.pool.connect();
        try {
            // Try ruvector_embed first
            const result = await client.query(
                `SELECT ruvector_embed($1) as embedding`,
                [text.substring(0, 8000)] // Limit text length
            );
            return result.rows[0].embedding;
        } catch (err) {
            // Fallback to simple deterministic embedding
            console.log('   Using fallback embedding (ruvector_embed not available)');
            return this.fallbackEmbedding(text);
        } finally {
            client.release();
        }
    }

    fallbackEmbedding(text) {
        // Deterministic hash-based embedding for fallback
        const vector = new Array(this.config.dimensions).fill(0);
        const str = String(text).toLowerCase();

        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
            vector[i % this.config.dimensions] += (hash % 1000) / 1000;
        }

        // Normalize
        const mag = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
        return vector.map(v => v / mag);
    }

    async ingestFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileHash = crypto.createHash('md5').update(content).digest('hex');
        const fileName = path.basename(filePath, '.md');

        // Parse into sections
        const sections = this.parseMarkdown(content, filePath);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Remove old entries for this file
            await client.query(
                `DELETE FROM ${this.config.schema}.architecture_docs WHERE file_path = $1`,
                [filePath]
            );

            // Insert new sections
            let ingested = 0;
            for (const section of sections) {
                const docId = `${fileName}-${section.index}`;
                const embedding = await this.generateEmbedding(
                    `${section.title} ${section.content}`
                );

                await client.query(`
                    INSERT INTO ${this.config.schema}.architecture_docs
                    (doc_id, title, content, file_path, section_header, section_index, file_hash, embedding)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (doc_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        content = EXCLUDED.content,
                        file_hash = EXCLUDED.file_hash,
                        embedding = EXCLUDED.embedding,
                        updated_at = NOW()
                `, [
                    docId,
                    section.title,
                    section.content,
                    filePath,
                    section.header,
                    section.index,
                    fileHash,
                    embedding
                ]);

                ingested++;
            }

            // Update file tracking
            await client.query(`
                INSERT INTO ${this.config.schema}.file_tracking (file_path, file_hash, chunk_count)
                VALUES ($1, $2, $3)
                ON CONFLICT (file_path) DO UPDATE SET
                    file_hash = EXCLUDED.file_hash,
                    chunk_count = EXCLUDED.chunk_count,
                    last_synced = NOW()
            `, [filePath, fileHash, ingested]);

            await client.query('COMMIT');

            return ingested;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    parseMarkdown(content, filePath) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = {
            title: path.basename(filePath, '.md'),
            header: null,
            content: [],
            index: 0
        };

        for (const line of lines) {
            const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);

            if (headerMatch) {
                // Save current section if it has content
                if (currentSection.content.length > 0) {
                    const sectionContent = currentSection.content.join('\n').trim();
                    if (sectionContent.length > 50) {
                        sections.push({
                            title: currentSection.title,
                            header: currentSection.header,
                            content: sectionContent,
                            index: sections.length
                        });
                    }
                }

                // Start new section
                currentSection = {
                    title: headerMatch[2].trim(),
                    header: headerMatch[2].trim(),
                    content: [],
                    index: sections.length
                };
            } else {
                currentSection.content.push(line);
            }
        }

        // Don't forget last section
        if (currentSection.content.length > 0) {
            const sectionContent = currentSection.content.join('\n').trim();
            if (sectionContent.length > 50) {
                sections.push({
                    title: currentSection.title,
                    header: currentSection.header,
                    content: sectionContent,
                    index: sections.length
                });
            }
        }

        return sections;
    }

    async ingestDirectory(dirPath) {
        const files = [];

        // Recursive file finder
        const findFiles = (dir) => {
            if (!fs.existsSync(dir)) return;

            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    findFiles(fullPath);
                } else if (item.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        };

        findFiles(dirPath);

        console.log(`\n📁 Found ${files.length} markdown files in ${dirPath}\n`);

        let totalChunks = 0;
        for (const file of files) {
            const relativePath = path.relative(process.cwd(), file);
            const changed = await this.isFileChanged(file);

            if (changed) {
                const chunks = await this.ingestFile(file);
                console.log(`   ✅ ${relativePath}: ${chunks} sections`);
                totalChunks += chunks;
            } else {
                console.log(`   ⏭️  ${relativePath}: unchanged`);
            }
        }

        return { files: files.length, chunks: totalChunks };
    }

    async search(query, limit = 5) {
        const queryEmbedding = await this.generateEmbedding(query);

        const client = await this.pool.connect();
        try {
            // Try vector similarity search
            const result = await client.query(`
                SELECT
                    doc_id,
                    title,
                    content,
                    file_path,
                    section_header,
                    1 - (embedding <=> $1::real[]) AS similarity
                FROM ${this.config.schema}.architecture_docs
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> $1::real[]
                LIMIT $2
            `, [queryEmbedding, limit]);

            return result.rows;
        } catch (err) {
            // Fallback to text search
            console.log('   Using text search fallback');
            const result = await client.query(`
                SELECT
                    doc_id,
                    title,
                    content,
                    file_path,
                    section_header,
                    0.5 AS similarity
                FROM ${this.config.schema}.architecture_docs
                WHERE content ILIKE $1 OR title ILIKE $1
                LIMIT $2
            `, [`%${query}%`, limit]);

            return result.rows;
        } finally {
            client.release();
        }
    }

    async getStatus() {
        const client = await this.pool.connect();
        try {
            // Total docs
            const docsResult = await client.query(
                `SELECT COUNT(*) as count FROM ${this.config.schema}.architecture_docs`
            );

            // Files tracked
            const filesResult = await client.query(
                `SELECT COUNT(*) as count, MAX(last_synced) as last_sync
                 FROM ${this.config.schema}.file_tracking`
            );

            // Unique files
            const uniqueFilesResult = await client.query(
                `SELECT COUNT(DISTINCT file_path) as count
                 FROM ${this.config.schema}.architecture_docs`
            );

            return {
                totalSections: parseInt(docsResult.rows[0].count),
                trackedFiles: parseInt(filesResult.rows[0].count),
                uniqueFiles: parseInt(uniqueFilesResult.rows[0].count),
                lastSync: filesResult.rows[0].last_sync,
                schema: this.config.schema,
                pgPort: this.config.pg.port
            };
        } finally {
            client.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

// ============================================================================
// FILE WATCHER
// ============================================================================

class ArchitectureWatcher {
    constructor(kb, watchDirs) {
        this.kb = kb;
        this.watchDirs = watchDirs;
        this.watchers = [];
        this.debounceTimers = {};
    }

    start() {
        console.log('\n👁️  Starting file watcher...\n');

        for (const dir of this.watchDirs) {
            const fullPath = path.join(process.cwd(), dir);

            if (!fs.existsSync(fullPath)) {
                console.log(`   ⚠️  Directory not found: ${dir}`);
                continue;
            }

            const watcher = fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
                if (filename && filename.endsWith('.md')) {
                    this.handleChange(path.join(fullPath, filename), eventType);
                }
            });

            this.watchers.push(watcher);
            console.log(`   📁 Watching: ${dir}`);
        }

        console.log('\n✅ Watcher active. Press Ctrl+C to stop.\n');
    }

    handleChange(filePath, eventType) {
        // Debounce multiple rapid changes
        if (this.debounceTimers[filePath]) {
            clearTimeout(this.debounceTimers[filePath]);
        }

        this.debounceTimers[filePath] = setTimeout(async () => {
            const relativePath = path.relative(process.cwd(), filePath);

            if (!fs.existsSync(filePath)) {
                console.log(`🗑️  File deleted: ${relativePath}`);
                // TODO: Handle deletion
                return;
            }

            console.log(`📝 File changed: ${relativePath}`);

            try {
                const chunks = await this.kb.ingestFile(filePath);
                console.log(`   ✅ Re-ingested: ${chunks} sections`);
            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
            }
        }, 500); // 500ms debounce
    }

    stop() {
        for (const watcher of this.watchers) {
            watcher.close();
        }
        console.log('\n👋 Watcher stopped');
    }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.length === 0) {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║           ARCHITECTURE KNOWLEDGE BASE SYNC                                 ║
║           ruvector-postgres + Auto-Embedding                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/kb-architecture-sync.js <command>

COMMANDS:
  --ingest      Full ingest of docs/architecture to KB
  --watch       Watch for changes and auto-sync
  --status      Show KB status
  --query "..." Search the KB

EXAMPLES:
  # Full ingest
  node scripts/kb-architecture-sync.js --ingest

  # Watch mode (auto-sync on changes)
  node scripts/kb-architecture-sync.js --watch

  # Query the KB
  node scripts/kb-architecture-sync.js --query "anti-simplification"

STORAGE:
  • Container: ruvector-kb (Docker on port 5435)
  • Schema: ask_ruvnet
  • Embeddings: 384-dimensional

MONITORED DIRECTORIES:
  • docs/architecture
  • docs/architecture/claude-skills
`);
        return;
    }

    const kb = new ArchitectureKB();

    try {
        await kb.connect();
        await kb.initialize();

        if (args.includes('--ingest')) {
            console.log('\n📥 Full Architecture KB Ingest\n');
            console.log('═'.repeat(60));

            for (const dir of CONFIG.watchDirs) {
                const fullPath = path.join(process.cwd(), dir);
                if (fs.existsSync(fullPath)) {
                    await kb.ingestDirectory(fullPath);
                }
            }

            const status = await kb.getStatus();
            console.log('\n═'.repeat(60));
            console.log(`✅ Ingest complete!`);
            console.log(`   Total sections: ${status.totalSections}`);
            console.log(`   Files tracked: ${status.trackedFiles}`);
        }

        else if (args.includes('--watch')) {
            // Initial ingest
            console.log('\n📥 Initial sync before watching...\n');
            for (const dir of CONFIG.watchDirs) {
                const fullPath = path.join(process.cwd(), dir);
                if (fs.existsSync(fullPath)) {
                    await kb.ingestDirectory(fullPath);
                }
            }

            // Start watcher
            const watcher = new ArchitectureWatcher(kb, CONFIG.watchDirs);
            watcher.start();

            // Handle shutdown
            process.on('SIGINT', async () => {
                watcher.stop();
                await kb.close();
                process.exit(0);
            });

            // Keep process alive
            await new Promise(() => {});
        }

        else if (args.includes('--status')) {
            const status = await kb.getStatus();

            console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    ARCHITECTURE KB STATUS                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Schema:           ${status.schema.padEnd(54)}║
║  PostgreSQL Port:  ${String(status.pgPort).padEnd(54)}║
║  Total Sections:   ${String(status.totalSections).padEnd(54)}║
║  Tracked Files:    ${String(status.trackedFiles).padEnd(54)}║
║  Unique Files:     ${String(status.uniqueFiles).padEnd(54)}║
║  Last Sync:        ${(status.lastSync ? new Date(status.lastSync).toISOString() : 'Never').padEnd(54)}║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
        }

        else if (args.includes('--query')) {
            const queryIndex = args.indexOf('--query') + 1;
            const query = args[queryIndex];

            if (!query) {
                console.error('❌ Please provide a query');
                process.exit(1);
            }

            console.log(`\n🔍 Query: "${query}"\n`);
            const results = await kb.search(query, 5);

            if (results.length === 0) {
                console.log('   No results found');
            } else {
                for (const result of results) {
                    console.log(`\n📄 ${result.title}`);
                    console.log(`   File: ${path.basename(result.file_path)}`);
                    console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
                    console.log(`   Preview: ${result.content.substring(0, 200)}...`);
                }
            }
        }

        await kb.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

// Export for programmatic use
module.exports = { ArchitectureKB, ArchitectureWatcher, CONFIG };

// Run CLI
if (require.main === module) {
    main();
}
