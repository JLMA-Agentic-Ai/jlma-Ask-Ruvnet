const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const VIDEO_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const AUDIO_DIR = path.resolve(__dirname, '../../audio_extracted');
const OUTPUT_FILE = path.resolve(__dirname, 'audio_transcripts.json');

// Initialize OpenAI for Whisper
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Find all videos
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

// Extract audio from video
function extractAudio(videoPath) {
    const basename = path.basename(videoPath, path.extname(videoPath));
    const audioPath = path.join(AUDIO_DIR, `${basename}.mp3`);

    if (fs.existsSync(audioPath)) {
        console.log(`   ♻️  Using existing audio file`);
        return audioPath;
    }

    try {
        console.log(`   🎵 Extracting audio...`);
        execSync(
            `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 "${audioPath}" -y`,
            { stdio: 'pipe' }
        );
        console.log(`   ✅ Audio extracted`);
        return audioPath;
    } catch (error) {
        console.error(`   ❌ FFmpeg error:`, error.message);
        return null;
    }
}

// Transcribe audio with Whisper
async function transcribeAudio(audioPath, videoName) {
    try {
        console.log(`   🎤 Transcribing with Whisper...`);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: 'whisper-1',
            response_format: 'verbose_json'
        });

        console.log(`   ✅ Transcribed: ${transcription.text.length} chars`);
        return transcription;

    } catch (error) {
        console.error(`   ❌ Whisper error:`, error.message);
        return null;
    }
}

async function processAllAudio() {
    console.log('🎙️  AUDIO TRANSCRIPTION with Whisper API');
    console.log('='.repeat(80));
    console.log('This will capture Ruv\'s explanations, context, and reasoning');
    console.log('='.repeat(80));
    console.log('');

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not found in environment');
        return;
    }

    const videos = findVideos();
    console.log(`Found ${videos.length} videos\n`);

    // Load already processed
    let processedVideos = new Set();
    if (fs.existsSync(OUTPUT_FILE)) {
        const existing = fs.readFileSync(OUTPUT_FILE, 'utf8')
            .split('\n')
            .filter(l => l.trim())
            .map(l => JSON.parse(l));
        processedVideos = new Set(existing.map(e => e.metadata?.source));
        console.log(`Resuming... Already processed ${processedVideos.size} videos\n`);
    }

    let totalTranscribed = 0;

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

            // Extract audio
            const audioPath = extractAudio(videoPath);
            if (!audioPath) continue;

            // Transcribe
            const transcription = await transcribeAudio(audioPath, filename);
            if (!transcription) continue;

            // Create entry
            const entry = {
                content: `Audio Transcript: ${filename}

Duration: ${(transcription.duration / 60).toFixed(1)} minutes

RUVAS EXPLANATION (From Audio):
${transcription.text}

This is Ruv speaking in his own words, explaining concepts, commands, 
and reasoning. Use this to understand his teaching style and approach.`,
                metadata: {
                    source: filename,
                    type: 'audio_transcript',
                    path: videoPath,
                    duration_seconds: transcription.duration,
                    language: transcription.language,
                    text_length: transcription.text.length,
                    timestamp: stat.mtime.toISOString()
                }
            };

            fs.appendFileSync(OUTPUT_FILE, JSON.stringify(entry) + '\n');
            totalTranscribed++;
            console.log(`   ✅ Saved transcript`);

        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Transcribed ${totalTranscribed} videos`);
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log('🎯 These transcripts capture Ruv\'s voice, explanations, and teaching style');
    console.log('='.repeat(80));
}

processAllAudio().catch(console.error);
