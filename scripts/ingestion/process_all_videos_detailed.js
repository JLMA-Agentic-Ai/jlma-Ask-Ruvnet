const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createWorker } = require('tesseract.js');

const VIDEO_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const FRAMES_DIR = path.resolve(__dirname, '../../video_frames_detailed');
const OUTPUT_FILE = path.resolve(__dirname, 'video_transcripts_detailed.json');

// DENSE SAMPLING: 1 frame every 15 seconds for ALL videos
const FRAME_INTERVAL_SECONDS = 15;

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
    const expectedFrames = Math.floor(duration / FRAME_INTERVAL_SECONDS);

    const framePattern = path.join(videoFrameDir, 'frame_%04d.jpg');

    try {
        execSync(
            `ffmpeg -i "${videoPath}" -vf "fps=1/${FRAME_INTERVAL_SECONDS}" -q:v 2 "${framePattern}" -y`,
            { stdio: 'pipe', maxBuffer: 1024 * 1024 * 100 }
        );

        const frames = fs.readdirSync(videoFrameDir).filter(f => f.endsWith('.jpg'));
        return { dir: videoFrameDir, count: frames.length, duration };
    } catch (error) {
        console.error(`      ❌ FFmpeg error:`, error.message);
        return { dir: videoFrameDir, count: 0, duration };
    }
}

async function processFramesWithCommands(frameDir, videoName) {
    const frames = fs.readdirSync(frameDir)
        .filter(f => f.endsWith('.jpg'))
        .sort()
        .map(f => path.join(frameDir, f));

    if (frames.length === 0) return { text: '', commands: [] };

    console.log(`      OCR processing ${frames.length} frames...`);

    const worker = await createWorker('eng');
    let allText = [];
    let detectedCommands = [];

    for (let i = 0; i < frames.length; i++) {
        if (i % 20 === 0) {
            console.log(`      Progress: ${i}/${frames.length} frames`);
        }

        try {
            const { data: { text } } = await worker.recognize(frames[i]);
            const cleaned = text.trim();

            if (cleaned.length > 20) {
                const timestamp = `[${Math.floor(i * FRAME_INTERVAL_SECONDS / 60)}:${String(i * FRAME_INTERVAL_SECONDS % 60).padStart(2, '0')}]`;
                allText.push(`${timestamp}\n${cleaned}\n${'='.repeat(80)}`);

                // Detect commands
                const lines = cleaned.split('\n');
                for (const line of lines) {
                    if (line.match(/^[\$#>]|npm|node|git|docker|curl|python|pip|cd |ls |mkdir|rm |cp |mv |chmod|chown|cat |grep|sed|awk|vim|nano/i)) {
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

    await worker.terminate();
    return {
        text: allText.join('\n\n'),
        commands: detectedCommands
    };
}

async function processAllVideosDetailed() {
    console.log('🎬 COMPREHENSIVE Video Processing - All Videos @ 15s Intervals');
    console.log('='.repeat(80));
    console.log('This will capture ALL commands and screen content');
    console.log('Estimated time: ~3-4 hours for 21 videos');
    console.log('='.repeat(80));
    console.log('');

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

    const startTime = Date.now();
    let totalCommands = 0;
    let totalText = 0;

    for (let i = 0; i < videos.length; i++) {
        const videoPath = videos[i];
        const filename = path.basename(videoPath);

        if (processedVideos.has(filename)) {
            console.log(`✓ [${i + 1}/${videos.length}] ${filename} (Already done)`);
            continue;
        }

        console.log(`\n[${'='.repeat(78)}]`);
        console.log(`[${i + 1}/${videos.length}] ${filename}`);
        console.log(`[${'='.repeat(78)}]`);

        try {
            const stat = fs.statSync(videoPath);
            const duration = getVideoDuration(videoPath);

            console.log(`   📹 Duration: ${(duration / 60).toFixed(1)} min`);

            // Extract frames
            console.log(`   ⚙️  Extracting frames...`);
            const frameInfo = await extractDenseFrames(videoPath, FRAMES_DIR);
            console.log(`   ✅ ${frameInfo.count} frames extracted`);

            if (frameInfo.count === 0) continue;

            // OCR
            const ocrResult = await processFramesWithCommands(frameInfo.dir, filename);
            console.log(`   ✅ ${ocrResult.text.length.toLocaleString()} chars, ${ocrResult.commands.length} commands`);

            totalCommands += ocrResult.commands.length;
            totalText += ocrResult.text.length;

            const entry = {
                content: `Video: ${filename}

Duration: ${(frameInfo.duration / 60).toFixed(1)} minutes
Frames: ${frameInfo.count} (1 every ${FRAME_INTERVAL_SECONDS}s)
Commands Detected: ${ocrResult.commands.length}

COMMANDS:
${ocrResult.commands.slice(0, 50).map(c => `${c.timestamp} ${c.command}`).join('\n')}
${ocrResult.commands.length > 50 ? `\n... and ${ocrResult.commands.length - 50} more commands` : ''}

FULL TRANSCRIPT:
${ocrResult.text}`,
                metadata: {
                    source: filename,
                    type: 'video_detailed_transcript',
                    sampling_rate: `${FRAME_INTERVAL_SECONDS}s`,
                    frames_extracted: frameInfo.count,
                    duration_seconds: frameInfo.duration,
                    commands_detected: ocrResult.commands.length,
                    text_length: ocrResult.text.length,
                    timestamp: stat.mtime.toISOString()
                }
            };

            fs.appendFileSync(OUTPUT_FILE, JSON.stringify(entry) + '\n');

        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
        }

        // Progress update
        const elapsed = (Date.now() - startTime) / 1000 / 60;
        const rate = (i + 1) / elapsed;
        const remaining = (videos.length - i - 1) / rate;
        console.log(`   ⏱️  Elapsed: ${elapsed.toFixed(0)}m, ETA: ${remaining.toFixed(0)}m`);
    }

    const totalTime = (Date.now() - startTime) / 1000 / 60;

    console.log('\n' + '='.repeat(80));
    console.log('🎉 ALL VIDEOS PROCESSED!');
    console.log('='.repeat(80));
    console.log(`Total Time: ${totalTime.toFixed(1)} minutes`);
    console.log(`Total Commands Captured: ${totalCommands.toLocaleString()}`);
    console.log(`Total Text Extracted: ${totalText.toLocaleString()} characters`);
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log('='.repeat(80));
}

processAllVideosDetailed();
