const fs = require('fs');
const path = require('path');
const ContentProcessor = require('./src/core/ContentProcessor');

/**
 * Recursively scan directory for all files (supports nested date folders)
 */
const IGNORED_DIRS = new Set([
    '.git', 'node_modules', 'dist', 'build', 'out', 'coverage', '.next', '.nuxt', '.output',
    'vendor', 'target', 'bin', 'obj', '.idea', '.vscode', '__pycache__', '.swarm', 'tmp'
]);

const IGNORED_FILES = new Set([
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'poetry.lock',
    'Cargo.lock', 'composer.lock', '.DS_Store', 'Thumbs.db', 'processed_knowledge.json'
]);

const IGNORED_EXTENSIONS = new Set([
    '.map', '.min.js', '.min.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mov', '.avi', '.zip', '.tar', '.gz',
    '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war', '.pyc', '.db', '.sqlite'
]);

function scanDirectory(dir, fileList = []) {
    try {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            try {
                const stat = fs.lstatSync(filePath);

                if (stat.isSymbolicLink()) return;

                if (stat.isDirectory()) {
                    if (!IGNORED_DIRS.has(file)) {
                        scanDirectory(filePath, fileList);
                    }
                } else {
                    const ext = path.extname(file).toLowerCase();
                    // Skip ignored files, extensions, and files larger than 500KB (text only)
                    if (!IGNORED_FILES.has(file) &&
                        !IGNORED_EXTENSIONS.has(ext) &&
                        stat.size < 500 * 1024) {

                        fileList.push({
                            absolutePath: filePath,
                            relativePath: path.relative(dir, filePath), // Note: relative to recursive root
                            name: file,
                            size: stat.size,
                            modified: stat.mtime
                        });
                    }
                }
            } catch (e) {
                // Ignore access errors
            }
        });
    } catch (e) {
        // Ignore dir errors
    }

    return fileList;
}

/**
 * Ingest all files from a directory (including nested subfolders)
 */
async function ingestDirectory(rootDir) {
    console.log(`\n=== Scanning Directory: ${rootDir} ===\n`);

    // Scan all files recursively
    const allFiles = scanDirectory(rootDir);
    console.log(`Found ${allFiles.length} files\n`);

    // Group by type
    const filesByType = {
        videos: allFiles.filter(f => /\.(mp4|mov|avi|mkv)$/i.test(f.name)),
        transcripts: allFiles.filter(f => /transcript.*\.txt$/i.test(f.name)),
        pdfs: allFiles.filter(f => /\.pdf$/i.test(f.name)),
        images: allFiles.filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f.name)),
        other: allFiles.filter(f => !/\.(mp4|mov|avi|mkv|txt|pdf|png|jpg|jpeg|gif)$/i.test(f.name))
    };

    console.log('📊 File Distribution:');
    console.log(`  🎥 Videos: ${filesByType.videos.length}`);
    console.log(`  📄 Transcripts: ${filesByType.transcripts.length}`);
    console.log(`  📕 PDFs: ${filesByType.pdfs.length}`);
    console.log(`  🖼️  Images: ${filesByType.images.length}`);
    console.log(`  📁 Other: ${filesByType.other.length}\n`);

    // Process all files
    const processor = new ContentProcessor();
    const processed = [];

    for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];

        console.log(`[${i + 1}/${allFiles.length}] Processing: ${file.relativePath}`);

        try {
            const doc = {
                id: file.relativePath.replace(/[^a-zA-Z0-9]/g, '_'),
                name: file.name,
                path: file.absolutePath,
                mimeType: getMimeType(file.name),
                metadata: {
                    source: rootDir,
                    relativePath: file.relativePath,
                    size: file.size,
                    modified: file.modified.toISOString(),
                    // EXTRACT DATE FROM PATH/FILENAME
                    date: extractDateFromPath(file.relativePath) || file.modified.toISOString()
                }
            };

            const result = await processor.processDocument(doc);
            processed.push(result);

        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }

    // Save processed data as NDJSON to avoid string length limits
    const outputFile = 'processed_knowledge.json';
    const stream = fs.createWriteStream(outputFile, { flags: 'a' });

    console.log(`\n💾 Saving processed documents to ${outputFile} (NDJSON)...`);

    for (const item of processed) {
        stream.write(JSON.stringify(item) + '\n');
    }

    stream.end();
    console.log(`✅ Saved ${processed.length} processed documents\n`);

    return processed;
}

/**
 * Extract date from path (supports YYYY-MM-DD format)
 */
function extractDateFromPath(filePath) {
    const datePattern = /(\d{4})-(\d{2})-(\d{2})/;
    const match = filePath.match(datePattern);

    if (match) {
        const [_, year, month, day] = match;
        return `${year}-${month}-${day}`;
    }
    return null;
}

/**
 * Simple MIME type detection
 */
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif'
    };
    return mimeMap[ext] || 'application/octet-stream';
}

module.exports = { ingestDirectory, scanDirectory };

// CLI usage
if (require.main === module) {
    const targetDir = process.argv[2];

    if (!targetDir) {
        console.error('Usage: node ingest_recursive.js <directory_path>');
        process.exit(1);
    }

    if (!fs.existsSync(targetDir)) {
        console.error(`Error: Directory not found: ${targetDir}`);
        process.exit(1);
    }

    ingestDirectory(targetDir)
        .then(() => console.log('✅ Ingestion complete!'))
        .catch(err => {
            console.error('❌ Ingestion failed:', err);
            process.exit(1);
        });
}
