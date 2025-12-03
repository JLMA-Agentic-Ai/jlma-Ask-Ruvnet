const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const OUTPUT_FILE = path.resolve(__dirname, 'existing_transcripts.json');

function findTranscripts(dir = ROOT_DIR, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findTranscripts(filePath, fileList);
        } else if (file.endsWith('.srt') || file.endsWith('.txt') || file.endsWith('.vtt')) {
            // Filter out system files and known non-transcripts
            if (!file.includes('processed_knowledge') &&
                !file.includes('video_transcripts') &&
                !file.includes('image_knowledge') &&
                !file.includes('repo_knowledge')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function cleanSrt(content) {
    // Remove timestamps and indices from SRT
    return content
        .replace(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n\n+/g, '\n')
        .trim();
}

function processTranscripts() {
    console.log('📄 Processing EXISTING Transcripts');
    console.log('='.repeat(80));

    const transcripts = findTranscripts();
    console.log(`Found ${transcripts.length} transcript files`);

    const entries = [];
    let totalChars = 0;

    for (const filePath of transcripts) {
        try {
            const filename = path.basename(filePath);
            let content = fs.readFileSync(filePath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();

            // Clean content based on type
            if (ext === '.srt' || ext === '.vtt') {
                content = cleanSrt(content);
            }

            // Skip empty or very short files
            if (content.length < 100) continue;

            const entry = {
                content: `Transcript Source: ${filename}

CONTENT:
${content}

CONTEXT:
This is a direct transcript of Ruv's coaching/hackathon session. 
Use this to capture his voice, explanations, and technical instructions.`,
                metadata: {
                    source: filename,
                    type: 'existing_transcript',
                    path: filePath,
                    format: ext,
                    text_length: content.length,
                    timestamp: fs.statSync(filePath).mtime.toISOString()
                }
            };

            entries.push(entry);
            totalChars += content.length;
            console.log(`   ✅ Processed: ${filename} (${(content.length / 1024).toFixed(1)} KB)`);

        } catch (error) {
            console.error(`   ❌ Error processing ${filePath}:`, error.message);
        }
    }

    // Save
    fs.writeFileSync(OUTPUT_FILE,
        entries.map(e => JSON.stringify(e)).join('\n')
    );

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Processed ${entries.length} transcripts`);
    console.log(`Total Text: ${(totalChars / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log('='.repeat(80));
}

processTranscripts();
