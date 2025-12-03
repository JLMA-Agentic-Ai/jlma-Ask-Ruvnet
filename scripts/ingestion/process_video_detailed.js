const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createWorker } = require('tesseract.js');

// Target: One specific video for detailed analysis
const TARGET_VIDEO = '2025-12-1 Ruv Coaching.mp4';
const VIDEO_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const FRAMES_DIR = path.resolve(__dirname, '../../video_frames_detailed');
const OUTPUT_FILE = path.resolve(__dirname, 'video_detailed_sample.json');

// DENSE SAMPLING: 1 frame every 15 seconds
const FRAME_INTERVAL_SECONDS = 15;

if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

function findVideo(targetName, dir = VIDEO_DIR) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            const result = findVideo(targetName, filePath);
            if (result) return result;
        } else if (file === targetName) {
            return filePath;
        }
    }
    return null;
}

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

async function extractDenseFrames(videoPath, outputDir) {
    const basename = path.basename(videoPath, path.extname(videoPath));
    const videoFrameDir = path.join(outputDir, basename);

    if (!fs.existsSync(videoFrameDir)) {
        fs.mkdirSync(videoFrameDir, { recursive: true });
    }

    const duration = getVideoDuration(videoPath);
    console.log(`\n📹 Video Duration: ${(duration / 60).toFixed(1)} minutes`);

    const expectedFrames = Math.floor(duration / FRAME_INTERVAL_SECONDS);
    console.log(`📊 Extracting 1 frame every ${FRAME_INTERVAL_SECONDS}s = ~${expectedFrames} frames`);

    // Extract frames at specified interval
    const framePattern = path.join(videoFrameDir, 'frame_%04d.jpg');

    try {
        console.log(`⚙️  Running FFmpeg...`);
        execSync(
            `ffmpeg -i "${videoPath}" -vf "fps=1/${FRAME_INTERVAL_SECONDS}" -q:v 2 "${framePattern}" -y`,
            { stdio: 'pipe', maxBuffer: 1024 * 1024 * 100 }
        );

        const frames = fs.readdirSync(videoFrameDir).filter(f => f.endsWith('.jpg'));
        console.log(`✅ Extracted ${frames.length} frames`);
        return { dir: videoFrameDir, count: frames.length, duration };
    } catch (error) {
        console.error(`❌ FFmpeg error:`, error.message);
        return { dir: videoFrameDir, count: 0, duration };
    }
}

async function processFramesDetailed(frameDir) {
    const frames = fs.readdirSync(frameDir)
        .filter(f => f.endsWith('.jpg'))
        .sort()
        .map(f => path.join(frameDir, f));

    if (frames.length === 0) return { text: '', commands: [] };

    console.log(`\n🔍 Running OCR on ${frames.length} frames...`);

    const worker = await createWorker('eng', 1, {
        logger: m => {
            if (m.status === 'recognizing text') {
                process.stdout.write(`\r   Progress: ${Math.round(m.progress * 100)}%`);
            }
        }
    });

    let allText = [];
    let detectedCommands = [];

    for (let i = 0; i < frames.length; i++) {
        try {
            const { data: { text } } = await worker.recognize(frames[i]);
            const cleaned = text.trim();

            if (cleaned.length > 20) {
                const timestamp = `[${Math.floor(i * FRAME_INTERVAL_SECONDS / 60)}:${String(i * FRAME_INTERVAL_SECONDS % 60).padStart(2, '0')}]`;
                allText.push(`${timestamp}\n${cleaned}\n${'='.repeat(80)}`);

                // Detect command-like patterns
                const lines = cleaned.split('\n');
                for (const line of lines) {
                    if (line.match(/^[\$#>]|npm|node|git|docker|curl|python|pip|cd |ls |mkdir|rm |cp |mv /i)) {
                        detectedCommands.push({
                            timestamp,
                            command: line.trim()
                        });
                    }
                }
            }
        } catch (error) {
            // Skip bad frames
        }
    }

    console.log(`\n✅ OCR complete`);
    console.log(`   Total text blocks: ${allText.length}`);
    console.log(`   Commands detected: ${detectedCommands.length}`);

    await worker.terminate();
    return {
        text: allText.join('\n\n'),
        commands: detectedCommands
    };
}

async function processDetailedVideo() {
    console.log('🎬 DETAILED Video Analysis - Command Extraction');
    console.log('='.repeat(80));
    console.log(`Target: ${TARGET_VIDEO}`);
    console.log(`Sampling Rate: 1 frame every ${FRAME_INTERVAL_SECONDS} seconds`);
    console.log('='.repeat(80));

    const videoPath = findVideo(TARGET_VIDEO);
    if (!videoPath) {
        console.error(`❌ Video not found: ${TARGET_VIDEO}`);
        return;
    }

    console.log(`\n📂 Found: ${videoPath}`);

    const stat = fs.statSync(videoPath);

    // Extract dense frames
    const frameInfo = await extractDenseFrames(videoPath, FRAMES_DIR);

    if (frameInfo.count === 0) {
        console.error('❌ No frames extracted');
        return;
    }

    // OCR with command detection
    const ocrResult = await processFramesDetailed(frameInfo.dir);

    // Save detailed entry
    const entry = {
        content: `DETAILED VIDEO ANALYSIS: ${TARGET_VIDEO}

Duration: ${(frameInfo.duration / 60).toFixed(1)} minutes
Frames Extracted: ${frameInfo.count} (1 every ${FRAME_INTERVAL_SECONDS}s)
Commands Detected: ${ocrResult.commands.length}

DETECTED COMMANDS:
${ocrResult.commands.map(c => `${c.timestamp} ${c.command}`).join('\n')}

COMPLETE TRANSCRIPT (Frame-by-Frame):
${ocrResult.text}`,
        metadata: {
            source: TARGET_VIDEO,
            type: 'video_detailed_transcript',
            sampling_rate: `${FRAME_INTERVAL_SECONDS}s`,
            frames_extracted: frameInfo.count,
            duration_seconds: frameInfo.duration,
            commands_detected: ocrResult.commands.length,
            text_length: ocrResult.text.length,
            timestamp: stat.mtime.toISOString()
        }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(entry, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('✅ DETAILED ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log(`\nComparison:`);
    console.log(`  Previous (5 frames): ~1,895 characters`);
    console.log(`  Detailed (${frameInfo.count} frames): ${ocrResult.text.length.toLocaleString()} characters`);
    console.log(`  Commands captured: ${ocrResult.commands.length}`);
}

processDetailedVideo();
