const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createWorker } = require('tesseract.js');

const VIDEO_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const FRAMES_DIR = path.resolve(__dirname, '../../video_frames_extracted');
const OUTPUT_FILE = path.resolve(__dirname, 'video_transcripts.json');

// Ensure frames directory exists
if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

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

// Check if ffmpeg is available
function checkFFmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Extract frames from video using ffmpeg
async function extractFrames(videoPath, outputDir) {
    const basename = path.basename(videoPath, path.extname(videoPath));
    const videoFrameDir = path.join(outputDir, basename);

    if (!fs.existsSync(videoFrameDir)) {
        fs.mkdirSync(videoFrameDir, { recursive: true });
    }

    // Extract 1 frame every 30 seconds
    const framePattern = path.join(videoFrameDir, 'frame_%04d.jpg');

    try {
        console.log(`   Extracting frames (1 per 30s)...`);
        execSync(
            `ffmpeg -i "${videoPath}" -vf "fps=1/30" -q:v 2 "${framePattern}" -y`,
            { stdio: 'pipe' }
        );

        // Count extracted frames
        const frames = fs.readdirSync(videoFrameDir).filter(f => f.endsWith('.jpg'));
        return { dir: videoFrameDir, count: frames.length };
    } catch (error) {
        console.error(`   ❌ FFmpeg error:`, error.message);
        return { dir: videoFrameDir, count: 0 };
    }
}

// OCR on frames
async function processFrames(frameDir) {
    const frames = fs.readdirSync(frameDir)
        .filter(f => f.endsWith('.jpg'))
        .map(f => path.join(frameDir, f));

    if (frames.length === 0) return '';

    console.log(`   Running OCR on ${frames.length} frames...`);

    const worker = await createWorker('eng');
    let allText = [];

    for (let i = 0; i < frames.length; i++) {
        try {
            const { data: { text } } = await worker.recognize(frames[i]);
            if (text.trim().length > 50) { // Only keep meaningful text
                allText.push(`[Frame ${i + 1}]: ${text.trim()}`);
            }
        } catch (error) {
            console.error(`      Error on frame ${i + 1}:`, error.message);
        }
    }

    await worker.terminate();
    return allText.join('\n\n');
}

async function processVideos() {
    console.log('🎬 Starting FULL Video Processing (Frames + OCR)...\n');

    // Check for ffmpeg
    const hasFFmpeg = checkFFmpeg();
    if (!hasFFmpeg) {
        console.log('⚠️  FFmpeg not found! Installing instructions:');
        console.log('   macOS: brew install ffmpeg');
        console.log('   Linux: apt-get install ffmpeg');
        console.log('\nContinuing with existing frames only...\n');
    }

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

        console.log(`\n${'='.repeat(80)}`);
        console.log(`Processing ${i + 1}/${videos.length}: ${filename}`);
        console.log(`${'='.repeat(80)}`);

        try {
            const stat = fs.statSync(videoPath);
            let screenText = '';
            let frameInfo = { count: 0 };

            // Extract frames if ffmpeg available
            if (hasFFmpeg) {
                frameInfo = await extractFrames(videoPath, FRAMES_DIR);
                console.log(`   ✅ Extracted ${frameInfo.count} frames`);

                // OCR on frames
                if (frameInfo.count > 0) {
                    screenText = await processFrames(frameInfo.dir);
                    console.log(`   ✅ OCR completed - ${screenText.length} chars extracted`);
                }
            }

            // Create comprehensive entry
            const entry = {
                content: `Video: ${filename}

${screenText || 'Screen text extraction pending - FFmpeg required for frame extraction.'}

Video Information:
- Duration: Requires FFmpeg analysis
- Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB
- Frames Extracted: ${frameInfo.count}
- Modified: ${stat.mtime.toISOString()}

Note: Audio transcription requires Whisper or similar speech-to-text service.`,
                metadata: {
                    source: filename,
                    type: 'video_transcript',
                    path: videoPath,
                    frames_extracted: frameInfo.count,
                    frame_dir: frameInfo.dir,
                    size_mb: (stat.size / 1024 / 1024).toFixed(2),
                    timestamp: stat.mtime.toISOString(),
                    has_screen_text: screenText.length > 0,
                    screen_text_length: screenText.length
                }
            };

            fs.appendFileSync(OUTPUT_FILE, JSON.stringify(entry) + '\n');
            console.log(`   ✅ Transcript saved`);

        } catch (error) {
            console.error(`   ❌ Error processing ${filename}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 Video processing complete!');
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log('='.repeat(80));
}

processVideos();
