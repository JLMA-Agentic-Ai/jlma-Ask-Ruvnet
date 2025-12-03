const fs = require('fs');
const path = require('path');

const sourceJSON = path.join(__dirname, 'processed_knowledge.json');
const targetDir = path.join(__dirname, '../../src/ui/public/knowledge_assets');

// Create target directory
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Read JSONL
const content = fs.readFileSync(sourceJSON, 'utf8');
const lines = content.split('\n').filter(l => l.trim());

const newLines = [];
let movedCount = 0;

lines.forEach(line => {
    try {
        const entry = JSON.parse(line);
        if (entry.metadata && entry.metadata.type === 'image_ocr' && entry.metadata.path) {
            const sourcePath = entry.metadata.path;
            const filename = path.basename(sourcePath);
            const targetPath = path.join(targetDir, filename);

            // Copy file if it exists
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, targetPath);

                // Update metadata path to relative URL
                entry.metadata.path = `/knowledge_assets/${filename}`;

                // Update content to use relative URL in image tag
                // Content format: "[Image Analysis of ...]\n..."
                // We don't strictly need to update content text if the UI uses metadata.path
                // But let's be safe.

                movedCount++;
            } else {
                console.warn(`Source image not found: ${sourcePath}`);
            }
        }
        newLines.push(JSON.stringify(entry));
    } catch (e) {
        console.error('Error parsing line:', e);
        newLines.push(line);
    }
});

// Write updated JSONL
fs.writeFileSync(sourceJSON, newLines.join('\n'));

console.log(`✅ Moved ${movedCount} images to ${targetDir}`);
console.log(`✅ Updated ${sourceJSON}`);
