const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const OUTPUT_FILE = path.resolve(__dirname, 'processed_knowledge.json');

function scanDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(scanDir(file));
        } else {
            if (file.endsWith('.txt') || file.endsWith('.md') || file.endsWith('.json')) {
                results.push(file);
            }
        }
    });
    return results;
}

console.log(`Scanning ${SOURCE_DIR}...`);
const files = scanDir(SOURCE_DIR);
console.log(`Found ${files.length} files.`);

const knowledge = [];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(SOURCE_DIR, file);

        // Skip the output file itself if it exists there
        if (file === OUTPUT_FILE) return;

        knowledge.push({
            content: content,
            metadata: {
                source: relativePath,
                type: path.extname(file).substring(1),
                ingestedAt: new Date().toISOString()
            }
        });
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledge, null, 2)); // Save as array of objects
// Wait, ingest_correct.js expects line-delimited JSON?
// Let's check line 26: fs.readFileSync(knowledgeFile, 'utf8').split('\n')
// Yes, it expects NDJSON (Newline Delimited JSON).

console.log('Converting to NDJSON...');
const ndjson = knowledge.map(k => JSON.stringify(k)).join('\n');
fs.writeFileSync(OUTPUT_FILE, ndjson);

console.log(`✅ Generated ${OUTPUT_FILE} with ${knowledge.length} entries.`);
