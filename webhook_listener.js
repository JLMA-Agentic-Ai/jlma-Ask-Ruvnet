const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ContentProcessor = require('./src/core/ContentProcessor');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Directory to save incoming webhooks
const DATA_DIR = path.join(__dirname, 'data_ingestion_ruv_coaching');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log(`
================================================================
READ.AI WEBHOOK LISTENER
================================================================
Listening on port ${PORT}...
Public URL: [Waiting for ngrok...]

INSTRUCTIONS:
1. I will start an 'ngrok' tunnel to give you a public URL.
2. Go to Read.ai -> Integrations -> Webhooks.
3. Click "Add webhook".
4. Paste the ngrok URL (e.g., https://xyz.ngrok-free.app/webhook).
5. Set Trigger to "Meeting End" (or similar).
6. Click "Save".
7. IMPORTANT: Since we want PAST meetings, you might need to "Re-run" or "Test" the webhook on existing meetings if Read.ai allows, OR we rely on the Google Drive sync you already have set up.

NOTE: Your screenshot shows "Google Drive - Syncing". 
If that is already syncing to a folder, using the Google Drive Connector is still the most robust way for PAST data.
Webhooks are great for FUTURE meetings.
================================================================
`);

app.post('/webhook', async (req, res) => {
    console.log('\n[Webhook] Received data from Read.ai!');
    const data = req.body;

    // Save raw data
    const filename = `webhook_${Date.now()}.json`;
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
    console.log(`[Webhook] Saved raw data to ${filename}`);

    // Extract content
    // Read.ai webhook payload usually contains: { title, date, summary, transcript, ... }
    // We need to adapt based on the actual payload structure.

    try {
        const processor = new ContentProcessor();
        const doc = {
            id: data.session_id || `webhook_${Date.now()}`,
            name: data.title || 'Untitled Meeting',
            mimeType: 'application/json', // Treat as JSON metadata + text content
            path: path.join(DATA_DIR, filename),
            metadata: {
                source: 'read_ai_webhook',
                url: data.report_url,
                date: data.date
            }
        };

        // If transcript is in the payload, save it as a text file
        if (data.transcript) {
            const transcriptPath = path.join(DATA_DIR, `${doc.name}_transcript.txt`);
            fs.writeFileSync(transcriptPath, data.transcript);
            doc.path = transcriptPath; // Point to the text file for processing
            doc.mimeType = 'text/plain';
        }

        const processed = await processor.processDocument(doc);
        console.log(`[Webhook] Processed meeting: ${processed.name}`);

        // Append to knowledge base
        // In a real DB, we'd upsert. For now, we append to a JSON file.
        const kbPath = 'ruv_coaching_knowledge.json';
        let kb = [];
        if (fs.existsSync(kbPath)) {
            kb = JSON.parse(fs.readFileSync(kbPath));
        }
        kb.push(processed);
        fs.writeFileSync(kbPath, JSON.stringify(kb, null, 2));
        console.log('[Webhook] Added to Knowledge Base.');

    } catch (err) {
        console.error('[Webhook] Error processing payload:', err.message);
    }

    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
