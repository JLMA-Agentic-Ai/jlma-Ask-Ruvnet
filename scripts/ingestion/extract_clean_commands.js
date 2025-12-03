const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.resolve(__dirname, 'video_transcripts_detailed.json');
const OUTPUT_FILE = path.resolve(__dirname, 'video_commands_clean.json');

// Command patterns to extract
const COMMAND_PATTERNS = [
    /^(npm|yarn|pnpm)\s+.+$/i,
    /^(node|nodemon)\s+.+$/i,
    /^git\s+(clone|commit|push|pull|add|status|checkout|branch|merge|rebase).+$/i,
    /^docker\s+(run|build|ps|images|exec|compose).+$/i,
    /^(curl|wget)\s+.+$/i,
    /^python3?\s+.+$/i,
    /^pip3?\s+(install|list|show).+$/i,
    /^(cd|ls|mkdir|rm|cp|mv|cat|grep|find|chmod|chown)\s+.+$/i,
    /^(export|source|echo)\s+.+$/i,
    /^\$\s+.+$/,  // Shell prompts
    /^>\s+.+$/     // PowerShell prompts
];

function isValidCommand(line) {
    const cleaned = line.trim();

    // Must match at least one pattern
    if (!COMMAND_PATTERNS.some(pattern => pattern.test(cleaned))) {
        return false;
    }

    // Filter out garbage
    if (cleaned.length < 5) return false;
    if (cleaned.match(/[^\x00-\x7F]{3,}/)) return false; // Too many non-ASCII
    if (cleaned.match(/^[\W\d]{5,}$/)) return false; // Only symbols/numbers
    if (cleaned.includes('github.dev') && !cleaned.includes('git clone')) return false; // UI noise

    return true;
}

function cleanCommand(cmd) {
    // Remove timestamp prefix
    let cleaned = cmd.replace(/^\[\d+:\d+\]\s*/, '');

    // Remove common OCR artifacts
    cleaned = cleaned.replace(/[®©™]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.trim();

    return cleaned;
}

function extractCommands() {
    console.log('🧹 Extracting Clean Commands from Video Transcripts');
    console.log('='.repeat(80));

    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ Input file not found:', INPUT_FILE);
        return;
    }

    const entries = fs.readFileSync(INPUT_FILE, 'utf8')
        .split('\n')
        .filter(l => l.trim())
        .map(l => JSON.parse(l));

    console.log(`\nProcessing ${entries.length} video transcripts...`);

    let cleanedEntries = [];
    let totalCommands = 0;

    for (const entry of entries) {
        const videoName = entry.metadata.source;
        const content = entry.content;

        // Extract all lines
        const lines = content.split('\n');
        const commands = [];

        for (const line of lines) {
            if (isValidCommand(line)) {
                const cleaned = cleanCommand(line);
                if (cleaned.length > 5 && !commands.includes(cleaned)) {
                    commands.push(cleaned);
                }
            }
        }

        totalCommands += commands.length;

        // Create cleaned entry
        const cleanedEntry = {
            content: `Video: ${videoName}

Commands Demonstrated (${commands.length} unique commands):

${commands.map((cmd, i) => `${i + 1}. ${cmd}`).join('\n')}

Duration: ${(entry.metadata.duration_seconds / 60).toFixed(1)} minutes
Original Frames: ${entry.metadata.frames_extracted}
Quality: Cleaned and deduplicated commands only`,
            metadata: {
                source: videoName,
                type: 'video_commands_clean',
                commands_count: commands.length,
                duration_seconds: entry.metadata.duration_seconds,
                timestamp: entry.metadata.timestamp
            }
        };

        cleanedEntries.push(cleanedEntry);

        console.log(`✅ ${videoName}: ${commands.length} clean commands`);
    }

    // Write cleaned entries
    fs.writeFileSync(OUTPUT_FILE,
        cleanedEntries.map(e => JSON.stringify(e)).join('\n')
    );

    console.log('\n' + '='.repeat(80));
    console.log('✅ Command Extraction Complete');
    console.log('='.repeat(80));
    console.log(`Videos Processed: ${entries.length}`);
    console.log(`Total Clean Commands: ${totalCommands}`);
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log(`\nSignal-to-Noise Improvement: Commands only, no UI garbage`);
    console.log('='.repeat(80));
}

extractCommands();
