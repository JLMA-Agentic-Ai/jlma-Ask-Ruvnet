#!/usr/bin/env node
/**
 * KB Universe Data Generator
 * Updated: 2025-12-30 10:50:00 EST | Version 2.0.0
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
const KB_PASSWORD = process.env.KB_PASSWORD || '';

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

// Calculate KB Quality Score (1-100) across multiple dimensions
function calculateKBScore(rows, categories) {
    const scores = {};
    const recommendations = [];

    // 1. COVERAGE SCORE (0-100): How much content exists?
    // Optimal: 500+ items = 100, scales down from there
    const coverageOptimal = 500;
    const coverageScore = Math.min(100, Math.round((rows.length / coverageOptimal) * 100));
    scores.coverage = coverageScore;
    if (coverageScore < 50) {
        recommendations.push({
            category: 'Coverage',
            priority: 'high',
            issue: `Only ${rows.length} knowledge items detected`,
            action: 'Add more documentation, FAQs, and reference materials',
            impact: '+' + Math.round((coverageOptimal - rows.length) / 5) + ' potential points'
        });
    } else if (coverageScore < 80) {
        recommendations.push({
            category: 'Coverage',
            priority: 'medium',
            issue: `${rows.length} items is good but could be better`,
            action: 'Consider adding edge cases, troubleshooting guides, and examples',
            impact: '+' + Math.round((coverageOptimal - rows.length) / 5) + ' potential points'
        });
    }

    // 2. DEPTH SCORE (0-100): How well organized is the hierarchy?
    // Optimal: 8-15 categories with balanced distribution
    const categoryCount = Object.keys(categories).length;
    let depthScore = 0;
    if (categoryCount >= 5 && categoryCount <= 20) {
        depthScore = 100 - Math.abs(12 - categoryCount) * 5;
    } else if (categoryCount < 5) {
        depthScore = categoryCount * 15;
    } else {
        depthScore = Math.max(50, 100 - (categoryCount - 20) * 3);
    }
    depthScore = Math.max(0, Math.min(100, depthScore));
    scores.depth = depthScore;
    if (categoryCount < 5) {
        recommendations.push({
            category: 'Organization',
            priority: 'high',
            issue: `Only ${categoryCount} categories - knowledge may be poorly organized`,
            action: 'Break down content into more specific topic areas',
            impact: '+15-25 potential points'
        });
    } else if (categoryCount > 20) {
        recommendations.push({
            category: 'Organization',
            priority: 'medium',
            issue: `${categoryCount} categories may be too fragmented`,
            action: 'Consider consolidating related topics',
            impact: '+10-15 potential points'
        });
    }

    // 3. BALANCE SCORE (0-100): Is content evenly distributed?
    const categoryValues = Object.values(categories);
    const avgItems = rows.length / categoryCount;
    const variance = categoryValues.reduce((sum, cat) => {
        return sum + Math.pow(cat.items.length - avgItems, 2);
    }, 0) / categoryCount;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = (stdDev / avgItems) * 100;
    // Lower CV = better balance. CV of 0 = 100 points, CV of 100+ = 0 points
    const balanceScore = Math.max(0, Math.min(100, 100 - coeffOfVariation));
    scores.balance = Math.round(balanceScore);
    if (balanceScore < 50) {
        const largest = categoryValues.reduce((max, cat) =>
            cat.items.length > max.items.length ? cat : max
        , categoryValues[0]);
        recommendations.push({
            category: 'Balance',
            priority: 'medium',
            issue: 'Content is unevenly distributed across categories',
            action: `Consider splitting large categories or expanding smaller ones`,
            impact: '+10-20 potential points'
        });
    }

    // 4. QUALITY SCORE (0-100): Content richness
    const avgContentLength = rows.reduce((sum, r) => sum + (r.content?.length || 0), 0) / rows.length;
    // Optimal: 500+ chars average
    const qualityScore = Math.min(100, Math.round((avgContentLength / 500) * 100));
    scores.quality = qualityScore;
    if (qualityScore < 60) {
        recommendations.push({
            category: 'Quality',
            priority: 'high',
            issue: `Average content length is ${Math.round(avgContentLength)} chars - content may be too brief`,
            action: 'Expand entries with more detail, examples, and context',
            impact: '+15-25 potential points'
        });
    }

    // 5. SOURCES SCORE (0-100): Diversity of knowledge sources
    const uniqueSources = new Set(rows.map(r => r.source)).size;
    // Optimal: 20+ unique sources
    const sourcesScore = Math.min(100, Math.round((uniqueSources / 20) * 100));
    scores.sources = sourcesScore;
    if (sourcesScore < 50) {
        recommendations.push({
            category: 'Sources',
            priority: 'medium',
            issue: `Only ${uniqueSources} unique sources`,
            action: 'Add content from more diverse sources (APIs, guides, FAQs)',
            impact: '+10-15 potential points'
        });
    }

    // Calculate overall score (weighted average)
    const weights = { coverage: 0.25, depth: 0.15, balance: 0.15, quality: 0.30, sources: 0.15 };
    const overallScore = Math.round(
        scores.coverage * weights.coverage +
        scores.depth * weights.depth +
        scores.balance * weights.balance +
        scores.quality * weights.quality +
        scores.sources * weights.sources
    );

    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Grade the KB
    let grade = 'F';
    if (overallScore >= 90) grade = 'A+';
    else if (overallScore >= 85) grade = 'A';
    else if (overallScore >= 80) grade = 'A-';
    else if (overallScore >= 75) grade = 'B+';
    else if (overallScore >= 70) grade = 'B';
    else if (overallScore >= 65) grade = 'B-';
    else if (overallScore >= 60) grade = 'C+';
    else if (overallScore >= 55) grade = 'C';
    else if (overallScore >= 50) grade = 'C-';
    else if (overallScore >= 40) grade = 'D';
    else grade = 'F';

    return {
        overall: overallScore,
        grade: grade,
        dimensions: scores,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        rawStats: {
            totalItems: rows.length,
            categories: categoryCount,
            avgContentLength: Math.round(avgContentLength),
            uniqueSources: uniqueSources
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

        // Try architecture_docs table first (kb-architecture-sync format)
        let result;
        try {
            result = await pool.query(`
                SELECT id, title, content, file_path as source,
                       COALESCE(section_header, 'document') as type
                FROM ${schemaName}.architecture_docs
                ORDER BY created_at DESC
                LIMIT 1000
            `);
        } catch (archErr) {
            // Fallback to knowledge table (standard format)
            result = await pool.query(`
                SELECT id, title, content, source,
                       COALESCE(type, 'document') as type
                FROM ${schemaName}.knowledge
                ORDER BY created_at DESC
                LIMIT 1000
            `);
        }

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

    // Build categories for scoring
    const categories = {};
    for (const row of rows) {
        const source = row.source || 'General';
        const category = source.replace(/\.md$/, '').replace(/_/g, ' ').replace(/-/g, ' ');
        if (!categories[category]) {
            categories[category] = { items: [], sources: new Set() };
        }
        categories[category].items.push(row);
        categories[category].sources.add(row.source);
    }

    // Calculate KB Score
    console.log('');
    console.log('📊 Calculating KB Quality Score...');
    const kbScore = calculateKBScore(rows, categories);
    console.log(`   • Overall Score: ${kbScore.overall}/100 (${kbScore.grade})`);
    console.log(`   • Coverage: ${kbScore.dimensions.coverage}/100`);
    console.log(`   • Depth: ${kbScore.dimensions.depth}/100`);
    console.log(`   • Balance: ${kbScore.dimensions.balance}/100`);
    console.log(`   • Quality: ${kbScore.dimensions.quality}/100`);
    console.log(`   • Sources: ${kbScore.dimensions.sources}/100`);
    if (kbScore.recommendations.length > 0) {
        console.log(`   • ${kbScore.recommendations.length} enhancement recommendations`);
    }

    // Build hierarchy
    console.log('');
    console.log('🔨 Building knowledge hierarchy...');
    const hierarchy = buildHierarchy(rows, projectInfo);

    // Add scoring to hierarchy
    hierarchy.score = kbScore;

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
