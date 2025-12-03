const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Configuration - OPTIMIZED with Gemini Flash
const VIDEO_DIR = path.resolve(__dirname, 'data_ingestion_ruv_coaching');
const OUTPUT_FILE = path.resolve(__dirname, 'video_visual_knowledge.json');
const FRAMES_DIR = path.resolve(__dirname, 'temp_frames');
const FRAME_INTERVAL_SECONDS = 30; // Every 30 seconds
const MODEL_ID = 'gemini-2.0-flash-exp'; // Latest, fastest, FREE

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_ID });

// Ensure directories exist
if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function processVideos() {
    console.log('🎥 Starting Video Visual Analysis with Gemini Flash...');
    console.log(`📂 Scanning: ${VIDEO_DIR}`);

    const files = getAllFiles(VIDEO_DIR).filter(f => f.toLowerCase().endsWith('.mp4'));
    console.log(`Found ${files.length} video files.`);

    for (let i = 0; i < files.length; i++) {
        const videoPath = files[i];
        const videoName = path.basename(videoPath);

        console.log(`\n[${i + 1}/${files.length}] Processing: ${videoName}`);

        try {
            // 1. Extract Frames
            const frames = await extractFrames(videoPath);
            console.log(`   📸 Extracted ${frames.length} frames.`);

            // 2. Analyze Frames with Gemini
            const analysisResults = [];
            for (const frame of frames) {
                const description = await analyzeFrame(frame.path);
                if (description && description.hasCode) {
                    analysisResults.push({
                        timestamp: frame.timestamp,
                        description: description.text
                    });
                }
                // Cleanup frame file
                fs.unlinkSync(frame.path);
            }

            // 3. Save Knowledge
            if (analysisResults.length > 0) {
                const knowledgeEntry = {
                    id: `vid_vis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    content: formatVisualContent(videoName, analysisResults),
                    metadata: {
                        source: videoPath,
                        type: 'video_visuals',
                        timestamp: new Date().toISOString(),
                        videoName: videoName,
                        framesWithCode: analysisResults.length
                    }
                };

                fs.appendFileSync(OUTPUT_FILE, JSON.stringify(knowledgeEntry) + '\n');
                console.log(`   ✅ Saved ${analysisResults.length} frames with code/commands`);
            } else {
                console.log(`   ⚠️  No code/commands found (skipped)`);
            }

        } catch (error) {
            console.error(`   ❌ Error processing ${videoName}:`, error.message);
        }
    }

    console.log('\n🎉 Video Visual Analysis Complete!');
    // Cleanup temp dir
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

async function extractFrames(videoPath) {
    const frames = [];
    // Get duration
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    let duration = 0;
    try {
        duration = parseFloat(execSync(durationCmd).toString());
    } catch (e) {
        console.error('   ⚠️  Could not determine duration, skipping.');
        return [];
    }

    // Extract 1 frame every 30 seconds
    for (let time = 0; time < duration; time += FRAME_INTERVAL_SECONDS) {
        const timestamp = new Date(time * 1000).toISOString().substr(11, 8); // HH:MM:SS
        const frameName = `frame_${time}.jpg`;
        const framePath = path.join(FRAMES_DIR, frameName);

        const cmd = `ffmpeg -ss ${time} -i "${videoPath}" -frames:v 1 -q:v 2 "${framePath}" -y -loglevel error`;

        try {
            execSync(cmd);
            if (fs.existsSync(framePath)) {
                frames.push({ path: framePath, timestamp: timestamp });
            }
        } catch (e) {
            // Ignore errors for specific frames
        }
    }
    return frames;
}

async function analyzeFrame(framePath) {
    try {
        const imageBuffer = fs.readFileSync(framePath);
        const base64Image = imageBuffer.toString('base64');

        const prompt = `You are analyzing a coding tutorial video frame. 

ONLY respond if this frame shows CODE, TERMINAL COMMANDS, FILE PATHS, or TECHNICAL DIAGRAMS.

If it's just a person talking, respond with: SKIP

If technical content is present, extract ALL visible:
- Code (exact syntax)
- Terminal commands (exact commands)
- File paths and names
- Tool/library names
- Configuration settings
- Error messages

Be precise and complete.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            }
        ]);

        const text = result.response.text();

        // Filter out non-technical frames
        if (text.includes("SKIP") || text.includes("person talking") || text.length < 20) {
            return null;
        }

        return { hasCode: true, text: text };

    } catch (error) {
        console.error('   ⚠️  Gemini API Error:', error.message);
        return null;
    }
}

function formatVisualContent(videoName, results) {
    let content = `Visual Technical Content from Video: ${videoName}\n\n`;
    results.forEach(res => {
        content += `[${res.timestamp}] Screen shows:\n${res.description}\n\n---\n\n`;
    });
    return content;
}

processVideos().catch(console.error);
