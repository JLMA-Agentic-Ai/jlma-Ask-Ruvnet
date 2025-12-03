const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createWorker } = require('tesseract.js');

const VIDEO_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const FRAMES_DIR = path.resolve(__dirname, '../../video_frames_extracted');
const OUTPUT_FILE = path.resolve(__dirname, 'video_transcripts.json');

// KEY OPTIMIZATION: Only extract 5 strategic frames per video
const FRAMES_PER_VIDEO = 5;

if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

function findVideos(dir = VIDEO_DIR, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findVideos(filePath, fileList);
        } else if (file.endsWith('.mp4') || file.endsWith('.mov')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

// Get video duration
function getVideoDuration(videoPath) {
    try {
        const output = execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
            { encoding: 'utf8' }
        );
        return parseFloat(output.trim());
    } catch {
        return 0;
    }
}

// Extract ONLY 5 strategic frames
async function extractKeyFrames(videoPath, outputDir) {
    const basename = path.basename(videoPath, path.extname(videoPath));
    const videoFrameDir = path.join(outputDir, basename);

    if (!fs.existsSync(videoFrameDir)) {
        fs.mkdirSync(videoFrameDir, { recursive: true });
    }

    const duration = getVideoDuration(videoPath);
    if (duration === 0 || duration > 10800) { // Skip if >3 hours
        console.log(`   ⏭️  Skipping (duration: ${(duration / 60).toFixed(0)}min)`);
        return { dir: videoFrameDir, count: 0 };
    }

    // Extract at: 0%, 25%, 50%, 75%, 95%
    const timestamps = [
        duration * 0.00,  // Start
        duration * 0.25,  // Quarter
        duration * 0.50,  // Middle
        duration * 0.75,  // Three-quarter
        duration * 0.95   // Near end
    ];

    console.log(`   📹 Duration: ${(duration / 60).toFixed(1)}min - Extracting ${FRAMES_PER_VIDEO} key frames...`);

    let extractedCount = 0;
    for (let i = 0; i < timestamps.length; i++) {
        const outputPath = path.join(videoFrameDir, `key_frame_${i + 1}.jpg`);
        try {
            execSync(
                `ffmpeg -ss ${timestamps[i]} -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}" -y`,
                { stdio: 'pipe' }
            );
            extractedCount++;
        } catch (error) {
            console.error(`      ❌ Frame ${i + 1} failed`);
        }
    }

    return { dir: videoFrameDir, count: extractedCount, duration };
}

// Fast OCR - skip bad frames immediately
async function processFramesFast(frameDir) {
    const frames = fs.readdirSync(frameDir)
        .filter(f => f.endsWith('.jpg'))
        .map(f => path.join(frameDir, f));

    if (frames.length === 0) return '';

    const worker = await createWorker('eng');
    let allText = [];

    for (let i = 0; i < frames.length; i++) {
        try {
            const { data: { text, confidence } } = await worker.recognize(frames[i]);

            // Only keep if meaningful text AND good confidence
            if (text.trim().length > 100 && confidence > 50) {
                allText.push(`[Frame ${i + 1}]: ${text.trim()}`);
            }
        } catch (error) {
            // Skip bad frames silently
        }
    }

    await worker.terminate();
    return allText.join('\n\n');
}

async function processVideosFast() {
    console.log('🚀 FAST Video Processing (5 Frames/Video + Smart Filtering)...\n');

    const videos = findVideos();
    console.log(`Found ${videos.length} videos\n`);

    let processedVideos = new Set();
    if (fs.existsSync(OUTPUT_FILE)) {
        const existing = fs.readFileSync(OUTPUT_FILE, 'utf8')
            .split('\n')
            .filter(l => l.trim())
            .map(l => JSON.parse(l));
        processedVideos = new Set(existing.map(e => e.metadata?.source));
        console.log(`Resuming... Already processed ${processedVideos.size} videos\n`);
    }

    let processedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < videos.length; i++) {
        const videoPath = videos[i];
        const filename = path.basename(videoPath);

        if (processedVideos.has(filename)) {
            console.log(`✓ ${i + 1}/${videos.length}: ${filename} (Already done)`);
            continue;
        }

        console.log(`\n[${i + 1}/${videos.length}] ${filename}`);

        try {
            const stat = fs.statSync(videoPath);

            // Extract key frames
            const frameInfo = await extractKeyFrames(videoPath, FRAMES_DIR);

            if (frameInfo.count === 0) {
                skippedCount++;
                continue;
            }

            console.log(`   ✅ ${frameInfo.count} frames extracted`);

            // OCR
            const screenText = await processFramesFast(frameInfo.dir);
            console.log(`   ✅ OCR: ${screenText.length} chars`);

            const entry = {
                content: `Video: ${filename}

Duration: ${(frameInfo.duration / 60).toFixed(1)} minutes
Frames Analyzed: ${frameInfo.count}

Screen Content:
${screenText || '[No readable text found in frames]'}`,
                metadata: {
                    source: filename,
                    type: 'video_transcript',
                    path: videoPath,
                    duration_seconds: frameInfo.duration,
                    frames_extracted: frameInfo.count,
                    screen_text_length: screenText.length,
                    timestamp: stat.mtime.toISOString()
                }
            };

            fs.appendFileSync(OUTPUT_FILE, JSON.stringify(entry) + '\n');
            processedCount++;

        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
            skippedCount++;
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Complete!`);
    console.log(`   Processed: ${processedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Output: ${OUTPUT_FILE}`);
    console.log(`${'='.repeat(60)}`);
}

processVideosFast();
