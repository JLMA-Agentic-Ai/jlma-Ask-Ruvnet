const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '../../data_ingestion_ruv_coaching');
const OUTPUT_FILE = path.resolve(__dirname, 'image_knowledge.json');

async function findImages(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.resolve(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(await findImages(filePath));
        } else {
            if (file.match(/\.(jpg|jpeg|png|bmp|webp)$/i)) {
                results.push(filePath);
            }
        }
    }
    return results;
}

async function extract() {
    console.log('🖼️  Starting Image Extraction...');
    const images = await findImages(SOURCE_DIR);
    console.log(`📸 Found ${images.length} images.`);

    // Load existing processed images
    let processedImages = new Set();
    if (fs.existsSync(OUTPUT_FILE)) {
        const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
        content.split('\n').forEach(line => {
            if (line.trim()) {
                try {
                    const entry = JSON.parse(line);
                    processedImages.add(entry.metadata.source);
                } catch (e) { }
            }
        });
    }
    console.log(`🔄 Resuming... Already processed ${processedImages.size} images.`);

    for (let i = 0; i < images.length; i++) {
        const imgPath = images[i];
        const filename = path.basename(imgPath);
        const stat = fs.statSync(imgPath);

        if (processedImages.has(filename)) {
            console.log(`Skipping ${i + 1}/${images.length}: ${filename} (Already processed)`);
            continue;
        }

        console.log(`Processing ${i + 1}/${images.length}: ${filename}...`);

        try {
            const { data: { text } } = await Tesseract.recognize(imgPath, 'eng', {
                logger: m => { } // Silence logger
            });

            if (text.trim().length > 10) { // Filter out empty/noise
                const entry = {
                    content: `[Image Analysis of ${filename}]\n${text}`,
                    metadata: {
                        source: filename,
                        type: 'image_ocr',
                        path: imgPath,
                        timestamp: stat.mtime.toISOString()
                    }
                };
                fs.appendFileSync(OUTPUT_FILE, JSON.stringify(entry) + '\n');
                console.log(`   ✅ Extracted ${text.length} chars.`);
            } else {
                console.log('   ⚠️  No significant text found.');
            }
        } catch (err) {
            console.error(`   ❌ Error processing ${filename}:`, err.message);
        }
    }

    console.log('🎉 Image extraction complete!');
}

extract();
