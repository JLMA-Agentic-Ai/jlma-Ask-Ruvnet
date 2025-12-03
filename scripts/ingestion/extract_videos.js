const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

const VIDEO_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const OUTPUT_FILE = path.resolve(__dirname, 'video_knowledge.json');

// Find all video files recursively
function findVideos(dir = VIDEO_DIR, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findVideos(filePath, fileList);
        } else if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.avi') || file.endsWith('.mkv') || file.endsWith('.webm')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

async function extractVideoData() {
    console.log('🎬 Starting Video Knowledge Extraction...');

    const videos = findVideos();
    console.log(`Found ${videos.length} video files\n`);

    // Load already processed videos
    let processedVideos = new Set();
    if (fs.existsSync(OUTPUT_FILE)) {
        const existing = fs.readFileSync(OUTPUT_FILE, 'utf8')
            .split('\n')
            .filter(l => l.trim())
            .map(l => JSON.parse(l));
        processedVideos = new Set(existing.map(e => e.metadata?.source));
        console.log(`Resuming... Already processed ${processedVideos.size} videos\n`);
    }

    for (let i = 0; i < videos.length; i++) {
        const videoPath = videos[i];
        const filename = path.basename(videoPath);

        if (processedVideos.has(filename)) {
            console.log(`Skipping ${i + 1}/${videos.length}: ${filename} (Already processed)`);
            continue;
        }

        console.log(`Processing ${i + 1}/${videos.length}: ${filename}...`);

        try {
            const stat = fs.statSync(videoPath);

            // For now, create metadata entry
            // In a full implementation, you'd extract frames and OCR them,
            // or use speech-to-text for audio transcription
            const entry = {
                content: `Video: ${filename}
                
This is a video file from the rUVnet coaching series. 
Video files contain visual and audio information that requires frame extraction 
and transcription for full text analysis.

Metadata:
- Filename: ${filename}
- Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB
- Modified: ${stat.mtime.toISOString()}
- Type: Video Content

Note: For complete text extraction, frames should be extracted and processed with OCR, 
and audio should be transcribed using speech-to-text services.`,
                metadata: {
                    source: filename,
                    type: 'video_metadata',
                    path: videoPath,
                    size_mb: (stat.size / 1024 / 1024).toFixed(2),
                    timestamp: stat.mtime.toISOString(),
                    requires_transcription: true
                }
            };

            fs.appendFileSync(OUTPUT_FILE, JSON.stringify(entry) + '\n');
            console.log(`   ✅ Metadata extracted`);

        } catch (error) {
            console.error(`   ❌ Error processing ${filename}:`, error.message);
        }
    }

    console.log('\n🎉 Video metadata extraction complete!');
    console.log(`Output: ${OUTPUT_FILE}`);
}

extractVideoData();
