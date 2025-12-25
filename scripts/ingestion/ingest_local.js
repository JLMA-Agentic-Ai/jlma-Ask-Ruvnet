#!/usr/bin/env node
/**
 * Local Repository Knowledge Ingestion
 * Ingests content from the current Ask-Ruvnet repo and any available local files
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const OUTPUT_FILE = path.resolve(__dirname, 'processed_knowledge.json');
const REPO_CONFIG = path.resolve(__dirname, 'repo_knowledge.json');

// File patterns to include
const INCLUDE_PATTERNS = [
    /\.js$/,
    /\.ts$/,
    /\.jsx$/,
    /\.tsx$/,
    /\.md$/,
    /\.json$/
];

// Directories to exclude
const EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.swarm',
    '.temp_repos',
    'knowledge_assets'
];

// Files to exclude
const EXCLUDE_FILES = [
    'package-lock.json',
    'processed_knowledge.json',
    'existing_transcripts.json',
    'video_transcripts_detailed.json',
    'video_transcripts.json'
];

function shouldInclude(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);

    // Check excludes
    if (EXCLUDE_FILES.includes(fileName)) return false;
    for (const dir of EXCLUDE_DIRS) {
        if (filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`)) return false;
    }

    // Check includes
    for (const pattern of INCLUDE_PATTERNS) {
        if (pattern.test(filePath)) return true;
    }
    return false;
}

function walkDir(dir, files = []) {
    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            // Skip excluded directories upfront
            if (EXCLUDE_DIRS.includes(item)) continue;

            const fullPath = path.join(dir, item);

            try {
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    walkDir(fullPath, files);
                } else if (stat.isFile() && shouldInclude(fullPath)) {
                    files.push(fullPath);
                }
            } catch (e) {
                // Skip files/dirs we can't stat
            }
        }
    } catch (e) {
        // Skip dirs we can't read
    }

    return files;
}

function getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'react',
        '.tsx': 'react-typescript',
        '.md': 'markdown',
        '.json': 'json'
    };
    return types[ext] || 'text';
}

async function main() {
    console.log('🏠 Local Repository Knowledge Ingestion\n');
    console.log('='.repeat(60));

    // Load repo config
    const repos = JSON.parse(fs.readFileSync(REPO_CONFIG, 'utf8'));
    const askRuvnet = repos.find(r => r.name === 'Ask-Ruvnet');

    console.log(`📂 Scanning: ${ROOT_DIR}\n`);

    const files = walkDir(ROOT_DIR);
    console.log(`📄 Found ${files.length} files to process\n`);

    const entries = [];

    // Add repo metadata entry
    entries.push({
        content: `# Ask-Ruvnet Repository

## Version: ${askRuvnet?.version || '1.7.5'}

Ask-Ruvnet is an AI-powered knowledge assistant that provides intelligent Q&A
capabilities backed by the RuVector knowledge base. It tracks and ingests
content from multiple rUv repositories:

- **agentic-flow**: Core orchestration framework for AI agents
- **ruvector**: Vector database backend for semantic search
- **ruvllm**: Self-learning LLM toolkit
- **claude-flow**: Agentic workflow engine
- **neural-trader**: Market analysis agent
- **agentic-synth**: Synthetic data generator

## Architecture

Built on agentic-flow's HybridReasoningBank with:
- SQLite-based persistent memory
- Recency-boosted retrieval
- Multi-source knowledge ingestion
- Real-time version tracking`,
        metadata: {
            source: 'Ask-Ruvnet/overview',
            type: 'repo_overview',
            repo_name: 'Ask-Ruvnet',
            version: askRuvnet?.version || '1.7.5',
            recency_score: 1.0,
            fetched_at: new Date().toISOString()
        }
    });

    // Process each file
    for (const filePath of files) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(ROOT_DIR, filePath);

            // Skip very large files
            if (content.length > 100000) {
                console.log(`   ⏭️  Skipping large file: ${relativePath}`);
                continue;
            }

            entries.push({
                content: content,
                metadata: {
                    source: `Ask-Ruvnet/${relativePath}`,
                    type: getFileType(filePath),
                    repo_name: 'Ask-Ruvnet',
                    file_path: relativePath,
                    version: askRuvnet?.version || '1.7.5',
                    recency_score: 1.0,
                    fetched_at: new Date().toISOString()
                }
            });

            if (entries.length % 10 === 0) {
                console.log(`   📝 Processed ${entries.length} files...`);
            }
        } catch (e) {
            console.error(`   ❌ Error reading ${filePath}: ${e.message}`);
        }
    }

    // Write output
    console.log(`\n📝 Writing ${entries.length} entries to processed_knowledge.json...`);

    const outputStream = fs.createWriteStream(OUTPUT_FILE);
    for (const entry of entries) {
        outputStream.write(JSON.stringify(entry) + '\n');
    }
    outputStream.end();

    console.log('✅ Local ingestion complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: node scripts/ingestion/ingest_correct.js');
    console.log('   2. This will build the .swarm/memory.db knowledge base');
    console.log('   3. Commit and push to trigger Railway deployment');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total entries: ${entries.length}`);
    console.log(`   Repository: Ask-Ruvnet`);
    console.log(`   Version: ${askRuvnet?.version || '1.7.5'}`);
}

main().catch(console.error);
