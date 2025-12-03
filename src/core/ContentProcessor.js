const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { OpenAI } = require('openai');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

class ContentProcessor {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        // We can add other clients like Anthropic here if needed for specific modalities
    }

    async processDocument(doc) {
        console.log(`[ContentProcessor] Processing ${doc.name} (${doc.mimeType})...`);

        let processedContent = {
            text: '',
            imageDescriptions: [],
            metadata: { ...doc.metadata }
        };

        try {
            if (doc.mimeType.includes('image')) {
                processedContent = await this.processImage(doc.path);
            } else if (doc.mimeType === 'application/pdf') {
                processedContent = await this.processPDF(doc.path);
            } else if (doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                processedContent = await this.processWord(doc.path);
            } else if (doc.mimeType.includes('audio') || doc.mimeType.includes('video')) {
                processedContent = await this.processAudioVideo(doc.path);
            } else {
                // Default text processing
                const content = fs.readFileSync(doc.path, 'utf8');
                processedContent.text = content;
            }
        } catch (error) {
            console.error(`[ContentProcessor] Error processing ${doc.name}:`, error.message);
            processedContent.text = `[Error processing file: ${error.message}]`;
        }

        return {
            ...doc,
            content: processedContent.text,
            imageDescriptions: processedContent.imageDescriptions,
            frames: processedContent.frames || [], // NEW: Include frame metadata
            processed: true
        };
    }

    async processImage(filePath) {
        console.log(`[Vision] Analyzing image: ${path.basename(filePath)}`);
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');

        const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this image in extreme detail. Describe all diagrams, text, charts, and visual elements. If it's a document screenshot, transcribe it perfectly. If it's a diagram, explain the relationships." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const description = response.choices[0].message.content;
        return {
            text: `[IMAGE ANALYSIS]\n${description}`,
            imageDescriptions: [description]
        };
    }

    async processPDF(filePath) {
        console.log(`[PDF] Extracting text from: ${path.basename(filePath)}`);
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);

        // TODO: For "Perfect Recall", we should also extract images from the PDF 
        // and pass them to processImage(). For now, we rely on text.
        // Advanced: Convert PDF pages to images and run Vision on them.

        return {
            text: data.text,
            imageDescriptions: []
        };
    }

    async processWord(filePath) {
        console.log(`[Word] Extracting text from: ${path.basename(filePath)}`);
        const result = await mammoth.extractRawText({ path: filePath });
        return {
            text: result.value,
            imageDescriptions: []
        };
    }



    async processAudioVideo(filePath) {
        console.log(`[Audio/Video] Processing: ${path.basename(filePath)}`);

        let textContent = '';
        const baseName = path.basename(filePath, path.extname(filePath));
        const dirName = path.dirname(filePath);

        // 1. Check for existing transcript file (e.g. "Video Name.txt" or "Video Name Transcript.txt")
        // The user has "Ruv Coaching Recording (1).mp4" and "Ruv Coaching Transcript (1).txt"
        // We need a flexible matcher.
        const potentialTranscriptFiles = fs.readdirSync(dirName).filter(f => f.endsWith('.txt'));

        // Simple heuristic: check if the transcript filename contains the video number or significant part
        // For "Ruv Coaching Recording (1).mp4", we look for "(1)" in the txt files.
        const matchId = baseName.match(/\(\d+\)/);
        let transcriptFile = null;

        if (matchId) {
            transcriptFile = potentialTranscriptFiles.find(f => f.includes(matchId[0]));
        } else {
            // Try exact match or fuzzy match
            transcriptFile = potentialTranscriptFiles.find(f => f.startsWith(baseName.replace('Recording', 'Transcript')));
        }

        if (transcriptFile) {
            console.log(`[Audio/Video] Found existing transcript: ${transcriptFile}`);
            textContent = fs.readFileSync(path.join(dirName, transcriptFile), 'utf8');
        } else {
            console.log(`[Audio/Video] No transcript found. Transcribing with Whisper...`);
            // TODO: Implement chunked upload for large files if needed.
            // For now, we'll assume we might hit limits and warn.
            try {
                const transcription = await this.openai.audio.transcriptions.create({
                    file: fs.createReadStream(filePath),
                    model: "whisper-1",
                });
                textContent = transcription.text;
            } catch (err) {
                console.error(`[Audio/Video] Transcription failed (likely too big): ${err.message}`);
                textContent = "[Transcription Failed - File too large]";

                // LOG FAILURE FOR RETRY
                const failureLog = {
                    file: filePath,
                    error: err.message,
                    timestamp: new Date().toISOString()
                };
                fs.appendFileSync('failed_videos.json', JSON.stringify(failureLog) + '\n');
                console.log(`[Audio/Video] ⚠️  Logged to failed_videos.json for chunked retry`);
            }
        }

        // 2. Extract Frames for Visual Context
        console.log(`[Audio/Video] Extracting key frames for visual analysis...`);
        const frames = await this.extractFrames(filePath);
        const visualDescriptions = [];
        const frameMetadata = []; // NEW: Store frame info

        for (const framePath of frames) {
            const description = await this.processImage(framePath);
            visualDescriptions.push(description.text);

            // Extract timestamp from frame filename (e.g., frame_timestamp_5.jpg)
            const frameNumber = parseInt(framePath.match(/_(\d+)\.jpg$/)?.[1] || '0');
            const timestampSeconds = frameNumber * 120; // 1 frame per 2 minutes

            // Store frame metadata
            frameMetadata.push({
                framePath: framePath,
                frameNumber: frameNumber,
                timestamp: timestampSeconds,
                description: description.text
            });

            // Don't cleanup frames - we need them for serving!
            // fs.unlinkSync(framePath);  // REMOVED
        }

        return {
            text: `[TRANSCRIPT]\n${textContent}\n\n[VISUAL CONTEXT]\n${visualDescriptions.join('\n\n')}`,
            imageDescriptions: visualDescriptions,
            frames: frameMetadata // NEW: Return frame metadata
        };
    }

    async extractFrames(videoPath) {
        return new Promise((resolve, reject) => {
            const frames = [];
            const outputPattern = path.join(path.dirname(videoPath), `frame_${Date.now()}_%d.jpg`);

            // Extract 1 frame every 2 minutes (1/120 fps) to avoid overload but get key slides
            ffmpeg(videoPath)
                .on('end', () => {
                    // Find generated files
                    const dir = path.dirname(videoPath);
                    const files = fs.readdirSync(dir).filter(f => f.startsWith(`frame_`) && f.endsWith('.jpg'));
                    resolve(files.map(f => path.join(dir, f)));
                })
                .on('error', (err) => {
                    console.error('Error extracting frames:', err);
                    resolve([]); // Return empty on error to not block
                })
                .outputOptions(['-vf', 'fps=1/120']) // 1 frame every 120 seconds
                .output(outputPattern)
                .run();
        });
    }
}

module.exports = ContentProcessor;
