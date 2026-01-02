#!/usr/bin/env node
/**
 * SQLite to RuVector Migration Script
 *
 * This script migrates data from the old SQLite-based storage to the new
 * RuVector PersistentVectorDB storage system.
 *
 * WHAT IT MIGRATES:
 * - agentdb.db → .ruvector/knowledge-base/
 * - .swarm/memory.db → .ruvector/swarm-memory/
 * - .hive-mind/hive.db → .ruvector/hive-memory/
 *
 * RUN:
 * node scripts/migrate-sqlite-to-ruvector.js
 *
 * OPTIONS:
 * --dry-run    Show what would be migrated without actually doing it
 * --force      Overwrite existing RuVector data
 * --backup     Create backup of SQLite files before migration
 */

const fs = require('fs');
const path = require('path');
const { PersistentVectorDB, getPersistentVectorDB } = require('../src/storage');

// Configuration
const SQLITE_FILES = [
    { path: 'agentdb.db', target: 'knowledge-base', description: 'Main knowledge base' },
    { path: '.swarm/memory.db', target: 'swarm-memory', description: 'Swarm agent memory' },
    { path: '.hive-mind/hive.db', target: 'hive-memory', description: 'Hive mind memory' }
];

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const backup = args.includes('--backup');

// Try to load better-sqlite3 for reading SQLite data
let Database = null;
try {
    Database = require('better-sqlite3');
} catch {
    console.log('⚠️ better-sqlite3 not installed, trying sqlite3...');
    try {
        // Try async sqlite3
        const sqlite3 = require('sqlite3').verbose();
        Database = {
            async: true,
            open: (path) => new sqlite3.Database(path)
        };
    } catch {
        console.log('⚠️ No SQLite driver found');
    }
}

/**
 * Try to read episodes from SQLite database
 */
async function readSQLiteEpisodes(dbPath) {
    if (!Database) {
        console.log('❌ No SQLite driver available');
        return [];
    }

    const episodes = [];

    try {
        if (Database.async) {
            // Using sqlite3 (async)
            const db = Database.open(dbPath);
            return new Promise((resolve, reject) => {
                db.all('SELECT * FROM episodes LIMIT 10000', [], (err, rows) => {
                    if (err) {
                        // Try alternative table names
                        db.all('SELECT * FROM memory LIMIT 10000', [], (err2, rows2) => {
                            db.close();
                            if (err2) resolve([]);
                            else resolve(rows2 || []);
                        });
                    } else {
                        db.close();
                        resolve(rows || []);
                    }
                });
            });
        } else {
            // Using better-sqlite3 (sync)
            const db = new Database(dbPath, { readonly: true });

            // Try to find data tables
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            console.log(`  Tables found: ${tables.map(t => t.name).join(', ')}`);

            for (const table of tables) {
                try {
                    const rows = db.prepare(`SELECT * FROM ${table.name} LIMIT 10000`).all();
                    if (rows.length > 0) {
                        episodes.push(...rows.map(r => ({
                            ...r,
                            _table: table.name
                        })));
                    }
                } catch {
                    // Skip tables we can't read
                }
            }

            db.close();
        }
    } catch (err) {
        console.log(`  ⚠️ Could not read ${dbPath}: ${err.message}`);
    }

    return episodes;
}

/**
 * Generate text embedding (simple hash-based for migration)
 * Using 128 dimensions to match RuVector's native HNSW index limit
 */
function generateEmbedding(text, dimensions = 128) {
    const vector = new Float32Array(dimensions);
    const str = String(text);

    // FNV-1a style hashing
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        hash ^= charCode;
        hash = (hash * 16777619) >>> 0;
        const idx = i % dimensions;
        vector[idx] = (vector[idx] + (hash % 1000) / 1000) % 1;
    }

    // Normalize
    let mag = 0;
    for (let i = 0; i < dimensions; i++) mag += vector[i] * vector[i];
    mag = Math.sqrt(mag) || 1;
    for (let i = 0; i < dimensions; i++) vector[i] /= mag;

    return vector;
}

/**
 * Migrate a single SQLite database to RuVector
 */
async function migrateDatabase(sqliteFile) {
    console.log(`\n📂 Migrating: ${sqliteFile.description}`);
    console.log(`   SQLite: ${sqliteFile.path}`);
    console.log(`   Target: .ruvector/${sqliteFile.target}/`);

    // Check if SQLite file exists
    const sqlitePath = path.join(process.cwd(), sqliteFile.path);
    if (!fs.existsSync(sqlitePath)) {
        console.log(`   ⚠️ SQLite file not found, skipping`);
        return { migrated: 0, skipped: true };
    }

    // Check if target already has data
    const targetPath = path.join(process.cwd(), '.ruvector', sqliteFile.target);
    const manifestPath = path.join(targetPath, 'manifest.json');
    if (fs.existsSync(manifestPath) && !force) {
        console.log(`   ⚠️ Target already has data, use --force to overwrite`);
        return { migrated: 0, skipped: true };
    }

    // Backup if requested
    if (backup && !dryRun) {
        const backupPath = sqlitePath + '.backup-' + Date.now();
        fs.copyFileSync(sqlitePath, backupPath);
        console.log(`   📦 Backup created: ${backupPath}`);
    }

    // Read episodes from SQLite
    console.log(`   Reading SQLite data...`);
    const episodes = await readSQLiteEpisodes(sqlitePath);
    console.log(`   Found ${episodes.length} records`);

    if (episodes.length === 0) {
        return { migrated: 0, skipped: false };
    }

    if (dryRun) {
        console.log(`   🔍 DRY RUN: Would migrate ${episodes.length} records`);
        return { migrated: episodes.length, dryRun: true };
    }

    // Create RuVector database with matching dimensions
    // Using 128 dims to match RuVector's native VectorDB limit
    const DIMENSIONS = 128;
    const db = new PersistentVectorDB({
        path: path.join(process.cwd(), '.ruvector', sqliteFile.target),
        dimensions: DIMENSIONS,
        distanceMetric: 'Cosine',
        saveIntervalMs: 5000
    });
    await db.initialize();

    // Migrate each episode
    let migrated = 0;
    for (const episode of episodes) {
        try {
            // Extract content from various possible field names
            const content = episode.input || episode.content || episode.text || episode.value || JSON.stringify(episode);
            const id = episode.id || `migrated_${Date.now()}_${migrated}`;

            // Generate embedding
            const vector = generateEmbedding(content);

            // Insert into RuVector
            await db.insert({
                id: String(id),
                vector,
                metadata: {
                    content,
                    migratedFrom: sqliteFile.path,
                    migratedAt: new Date().toISOString(),
                    originalTable: episode._table,
                    ...episode
                }
            });

            migrated++;

            if (migrated % 100 === 0) {
                process.stdout.write('.');
            }
        } catch (err) {
            console.log(`\n   ⚠️ Failed to migrate record: ${err.message}`);
        }
    }

    // Force save
    await db.flush();

    console.log(`\n   ✅ Migrated ${migrated}/${episodes.length} records`);

    return { migrated, total: episodes.length };
}

/**
 * Main migration function
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SQLite → RuVector Migration Tool');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Options: ${dryRun ? 'DRY RUN' : ''} ${force ? 'FORCE' : ''} ${backup ? 'BACKUP' : ''}`);
    console.log('');

    const results = {
        total: 0,
        migrated: 0,
        skipped: 0
    };

    for (const sqliteFile of SQLITE_FILES) {
        const result = await migrateDatabase(sqliteFile);
        results.total++;
        if (result.skipped) {
            results.skipped++;
        } else {
            results.migrated += result.migrated || 0;
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Databases processed: ${results.total}`);
    console.log(`  Databases skipped: ${results.skipped}`);
    console.log(`  Records migrated: ${results.migrated}`);
    console.log('');

    if (dryRun) {
        console.log('  ℹ️  This was a DRY RUN. Run without --dry-run to actually migrate.');
    } else if (results.migrated > 0) {
        console.log('  ✅ Migration complete!');
        console.log('  📍 Data stored in .ruvector/ directory');
        console.log('');
        console.log('  To verify, run the persistence test:');
        console.log('    node tests/storage/test-persistence.js');
    }

    console.log('═══════════════════════════════════════════════════════════');
}

// Run migration
main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
