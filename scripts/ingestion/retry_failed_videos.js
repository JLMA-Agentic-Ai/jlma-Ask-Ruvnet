const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

/**
 * Chunk and retry failed video transcriptions
 */
class VideoChunker {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.chunkDuration = 600; // 10 minutes per chunk (Whisper can handle ~25MB)
    }

    /**
     * Split video into chunks using ffmpeg
     */
    async chunkVideo(videoPath, outputDir) {
        console.log(`[VideoChunker] Chunking: ${path.basename(videoPath)}`);

        // Create output directory
        fs.mkdirSync(outputDir, { recursive: true });

        return new Promise((resolve, reject) => {
            const chunks = [];
            let chunkIndex = 0;

            ffmpeg(videoPath)
                .on('end', () => {
                    console.log(`[VideoChunker] ✅ Created ${chunkIndex} chunks`);
                    resolve(chunks);
                })
                .on('error', (err) => {
                    console.error(`[VideoChunker] ❌ Error: ${err.message}`);
                    reject(err);
                })
                .outputOptions([
                    `-f segment`,
                    `-segment_time ${this.chunkDuration}`,
                    `-c copy`,
                    `-reset_timestamps 1`
                ])
                .output(path.join(outputDir, 'chunk_%03d.mp4'))
                .on('progress', (progress) => {
                    if (progress.targetSize) {
                        chunkIndex = Math.floor(progress.timemark / this.chunkDuration);
                    }
                })
                .run();

            // Collect chunk paths
            const intervalId = setInterval(() => {
                const files = fs.readdirSync(outputDir).filter(f => f.startsWith('chunk_'));
                files.forEach(file => {
                    const fullPath = path.join(outputDir, file);
                    if (!chunks.includes(fullPath)) {
                        chunks.push(fullPath);
                    }
                });
            }, 1000);

            // Clear interval on completion
            ffmpeg(videoPath).on('end', () => clearInterval(intervalId));
        });
    }

    /**
     * Transcribe a single chunk
     */
    async transcribeChunk(chunkPath) {
        try {
            console.log(`[VideoChunker] Transcribing: ${path.basename(chunkPath)}`);
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(chunkPath),
                model: "whisper-1",
            });
            return transcription.text;
        } catch (error) {
            console.error(`[VideoChunker] ❌ Failed: ${error.message}`);
            return `[Chunk transcription failed: ${error.message}]`;
        }
    }

    /**
     * Process failed video: chunk + transcribe + merge
     */
    async retryFailedVideo(videoPath) {
        console.log(`\n[VideoChunker] 🔄 Retrying: ${videoPath}\n`);

        const videoName = path.basename(videoPath, path.extname(videoPath));
        const tempDir = path.join(__dirname, 'temp_chunks', videoName);

        try {
            // Step 1: Chunk the video
            const chunks = await this.chunkVideo(videoPath, tempDir);

            // Step 2: Transcribe each chunk
            const transcripts = [];
            for (let i = 0; i < chunks.length; i++) {
                console.log(`[VideoChunker] Progress: ${i + 1}/${chunks.length}`);
                const text = await this.transcribeChunk(chunks[i]);
                transcripts.push(text);
            }

            // Step 3: Merge transcripts
            const fullTranscript = transcripts.join('\n\n');

            // Step 4: Save transcript
            const transcriptPath = videoPath.replace(/\.(mp4|mov|avi|mkv)$/i, '_transcript.txt');
            fs.writeFileSync(transcriptPath, fullTranscript);
            console.log(`[VideoChunker] ✅ Saved transcript: ${transcriptPath}`);

            // Step 5: Cleanup chunks
            fs.rmSync(tempDir, { recursive: true, force: true });

            return {
                success: true,
                transcriptPath,
                text: fullTranscript
            };

        } catch (error) {
            console.error(`[VideoChunker] ❌ Retry failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * Retry all failed videos from log
 */
async function retryFailedVideos() {
    const failureLogPath = 'failed_videos.json';

    if (!fs.existsSync(failureLogPath)) {
        console.log('✅ No failed videos to retry!');
        return;
    }

    // Read failure log
    const lines = fs.readFileSync(failureLogPath, 'utf8').trim().split('\n');
    const failures = lines.map(line => JSON.parse(line));

    console.log(`\n🔄 === RETRYING ${failures.length} FAILED VIDEOS ===\n`);

    const chunker = new VideoChunker();
    const results = [];

    for (let i = 0; i < failures.length; i++) {
        const failure = failures[i];
        console.log(`\n[${i + 1}/${failures.length}] Retrying: ${failure.file}`);

        const result = await chunker.retryFailedVideo(failure.file);
        results.push({
            file: failure.file,
            ...result
        });
    }

    // Save results
    fs.writeFileSync('retry_results.json', JSON.stringify(results, null, 2));

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    console.log(`\n✅ Retry Complete!`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📄 Results saved to: retry_results.json\n`);
}

module.exports = { VideoChunker, retryFailedVideos };

// CLI usage
if (require.main === module) {
    retryFailedVideos()
        .then(() => console.log('Done!'))
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}
