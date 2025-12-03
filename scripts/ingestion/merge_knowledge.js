const fs = require('fs');
const path = require('path');

const BASE_FILE = path.resolve(__dirname, 'processed_knowledge.json');
const IMAGE_FILE = path.resolve(__dirname, 'image_knowledge.json');
const REPO_FILE = path.resolve(__dirname, 'repo_knowledge.json');
const VIDEO_FILE = path.resolve(__dirname, 'video_knowledge.json');
const VIDEO_TRANSCRIPT_FILE = path.resolve(__dirname, 'video_transcripts.json');

function merge() {
    console.log('🔄 Merging knowledge files...');

    let baseData = [];
    if (fs.existsSync(BASE_FILE)) {
        const content = fs.readFileSync(BASE_FILE, 'utf8');
        baseData = content.split('\n').filter(l => l.trim());
    }

    let imageData = [];
    if (fs.existsSync(IMAGE_FILE)) {
        const content = fs.readFileSync(IMAGE_FILE, 'utf8');
        imageData = content.split('\n').filter(l => l.trim());
    }

    let repoData = [];
    if (fs.existsSync(REPO_FILE)) {
        const content = fs.readFileSync(REPO_FILE, 'utf8');
        repoData = content.split('\n').filter(l => l.trim());
    }

    let videoData = [];
    if (fs.existsSync(VIDEO_FILE)) {
        const content = fs.readFileSync(VIDEO_FILE, 'utf8');
        videoData = content.split('\n').filter(l => l.trim());
    }

    let videoTranscriptData = [];
    if (fs.existsSync(VIDEO_TRANSCRIPT_FILE)) {
        const content = fs.readFileSync(VIDEO_TRANSCRIPT_FILE, 'utf8');
        videoTranscriptData = content.split('\n').filter(l => l.trim());
    }

    console.log(`   Base entries: ${baseData.length}`);
    console.log(`   Image entries: ${imageData.length}`);
    console.log(`   Repo entries: ${repoData.length}`);
    console.log(`   Video metadata: ${videoData.length}`);
    console.log(`   Video transcripts: ${videoTranscriptData.length}`);

    // Append image data to base file
    // We append directly to the file to avoid memory issues if it's huge, 
    // but here we just read/write for simplicity as it's NDJSON.

    // Check if images are already in base (simple check)
    const baseContent = fs.readFileSync(BASE_FILE, 'utf8');
    let newEntries = 0;

    const stream = fs.createWriteStream(BASE_FILE, { flags: 'a' });

    for (const line of imageData) {
        if (!baseContent.includes(line)) { // Very rough check, but prevents exact duplicates
            stream.write(line + '\n');
            newEntries++;
        }
    }

    for (const line of repoData) {
        if (!baseContent.includes(line)) {
            stream.write(line + '\n');
            newEntries++;
        }
    }

    for (const line of videoData) {
        if (!baseContent.includes(line)) {
            stream.write(line + '\n');
            newEntries++;
        }
    }

    for (const line of videoTranscriptData) {
        if (!baseContent.includes(line)) {
            stream.write(line + '\n');
            newEntries++;
        }
    }
    stream.end();

    console.log(`✅ Merged ${newEntries} new entries into processed_knowledge.json`);
}

merge();
