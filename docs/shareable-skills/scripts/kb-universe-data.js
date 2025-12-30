#!/usr/bin/env node
/**
 * KB Universe Data Generator
 * Updated: 2025-12-30 09:45:00 EST | Version 1.0.0
 * Created: 2025-12-30 09:45:00 EST
 *
 * Generates JSON data structure from ruvector-postgres KB
 * for the Knowledge Universe visualization.
 *
 * SEPARATION OF CONCERNS:
 * - This script generates DATA (JSON)
 * - kb-universe-template.html renders it SAFELY
 * - No innerHTML, no XSS vulnerabilities
 *
 * Usage: node scripts/kb-universe-data.js [--output path]
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const KB_PORT = process.env.KB_PORT || 5435;
const KB_PASSWORD = process.env.KB_PASSWORD || 'guruKB2025';

// Get project info
function getProjectInfo() {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return {
            name: pkg.name || 'Unknown Project',
            version: pkg.version || '0.0.0',
            description: pkg.description || 'Knowledge Base'
        };
    }
    return {
        name: path.basename(process.cwd()),
        version: '1.0.0',
        description: 'Knowledge Base'
    };
}

// Get schema name from project
function getSchemaName() {
    const projectDir = path.basename(process.cwd());
    return projectDir.toLowerCase().replace(/-/g, '_').replace(/ /g, '_');
}

// Category colors for visual variety
const CATEGORY_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6366f1', // indigo
    '#14b8a6', // teal
];

// Build knowledge hierarchy from flat KB data
function buildHierarchy(rows, projectInfo) {
    const categories = {};

    // Group by source/category
    for (const row of rows) {
        const source = row.source || 'General';
        const category = source.replace(/\.md$/, '').replace(/_/g, ' ').replace(/-/g, ' ');

        if (!categories[category]) {
            categories[category] = {
                items: [],
                sources: new Set()
            };
        }

        categories[category].items.push({
            id: `item_${row.id}`,
            title: row.title || 'Untitled',
            content: (row.content || '').substring(0, 200) + '...',
            source: row.source,
            type: row.type || 'document'
        });
        categories[category].sources.add(row.source);
    }

    // Build tree structure
    const children = Object.entries(categories).map(([name, data], index) => {
        const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

        // Group items into subcategories by first word of title
        const subgroups = {};
        for (const item of data.items) {
            const firstWord = (item.title.split(' ')[0] || 'Other').substring(0, 20);
            if (!subgroups[firstWord]) {
                subgroups[firstWord] = [];
            }
            subgroups[firstWord].push(item);
        }

        const subcategories = Object.entries(subgroups).map(([subName, items]) => ({
            id: `sub_${name}_${subName}`.replace(/\s+/g, '_').toLowerCase(),
            name: subName,
            color: color,
            count: items.length,
            children: items.map(item => ({
                id: item.id,
                name: item.title,
                description: item.content,
                color: color,
                source: item.source,
                type: item.type
            }))
        }));

        return {
            id: `cat_${name}`.replace(/\s+/g, '_').toLowerCase(),
            name: name,
            color: color,
            count: data.items.length,
            children: subcategories.length > 1 ? subcategories : subcategories[0]?.children || []
        };
    });

    return {
        id: 'root',
        name: projectInfo.name,
        color: '#64b5f6',
        description: projectInfo.description,
        version: projectInfo.version,
        children: children,
        metadata: {
            totalItems: rows.length,
            categories: Object.keys(categories).length,
            generatedAt: new Date().toISOString()
        }
    };
}

// Fallback: build from local .ruvector files
function buildFromLocalKB() {
    const kbPath = path.join(process.cwd(), '.ruvector', 'knowledge-base');
    const metadataPath = path.join(kbPath, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const entries = metadata.entries || [];

    return entries.map((entry, index) => ({
        id: index + 1,
        title: entry.metadata?.title || 'Untitled',
        content: entry.metadata?.content || '',
        source: entry.metadata?.source || 'local',
        type: entry.metadata?.type || 'document'
    }));
}

// Main function
async function generateKBData(outputPath) {
    console.log('');
    console.log('🌌 KB Universe Data Generator');
    console.log('═══════════════════════════════════════════════════════════');

    const projectInfo = getProjectInfo();
    const schemaName = getSchemaName();

    console.log(`📁 Project: ${projectInfo.name} v${projectInfo.version}`);
    console.log(`🗄️  Schema: ${schemaName}`);
    console.log('');

    let rows = [];

    // Try PostgreSQL first
    try {
        console.log('🔌 Connecting to ruvector-postgres...');
        const pool = new Pool({
            host: 'localhost',
            port: KB_PORT,
            user: 'postgres',
            password: KB_PASSWORD,
            database: 'postgres',
            connectionTimeoutMillis: 5000
        });

        const result = await pool.query(`
            SELECT id, title, content, source,
                   COALESCE(type, 'document') as type
            FROM ${schemaName}.knowledge
            ORDER BY created_at DESC
            LIMIT 1000
        `);

        rows = result.rows;
        await pool.end();
        console.log(`✅ Loaded ${rows.length} entries from PostgreSQL`);

    } catch (pgErr) {
        console.log(`⚠️  PostgreSQL unavailable: ${pgErr.message}`);
        console.log('📂 Falling back to local .ruvector storage...');

        const localRows = buildFromLocalKB();
        if (localRows && localRows.length > 0) {
            rows = localRows;
            console.log(`✅ Loaded ${rows.length} entries from local storage`);
        } else {
            console.log('⚠️  No KB data found. Creating sample structure...');
            rows = [
                { id: 1, title: 'Getting Started', content: 'Welcome to the knowledge base. Add content using kb:ingest.', source: 'README.md', type: 'guide' },
                { id: 2, title: 'Architecture', content: 'This system uses vector embeddings for semantic search.', source: 'architecture.md', type: 'technical' },
                { id: 3, title: 'API Reference', content: 'API documentation will appear here after ingestion.', source: 'api.md', type: 'reference' }
            ];
        }
    }

    // Build hierarchy
    console.log('');
    console.log('🔨 Building knowledge hierarchy...');
    const hierarchy = buildHierarchy(rows, projectInfo);

    console.log(`   • Categories: ${hierarchy.metadata.categories}`);
    console.log(`   • Total items: ${hierarchy.metadata.totalItems}`);

    // Write output
    const finalOutput = outputPath || path.join(process.cwd(), 'public', 'kb-universe-data.json');
    const outputDir = path.dirname(finalOutput);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(finalOutput, JSON.stringify(hierarchy, null, 2));

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Data generated: ${finalOutput}`);
    console.log(`   Size: ${(fs.statSync(finalOutput).size / 1024).toFixed(1)} KB`);

    return hierarchy;
}

// CLI
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

generateKBData(outputPath).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});

module.exports = { generateKBData, buildHierarchy, getProjectInfo };
