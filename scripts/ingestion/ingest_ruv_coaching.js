const { google } = require('googleapis');
const path = require('path');
const SourceManager = require('./src/connectors/SourceManager');
const ContentProcessor = require('./src/core/ContentProcessor');
const fs = require('fs');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

async function waitForFolderAndIngest() {
    const drive = google.drive({ version: 'v3', auth });
    const folderName = 'Ruv Coaching';

    console.log(`
================================================================
WAITING FOR DATA SOURCE: "${folderName}"
================================================================
I am ready to ingest. 

ACTION REQUIRED FROM YOU:
1. Go to Google Drive.
2. Create a folder named "${folderName}".
3. Share it with: answerbot@ruvectorchatbot.iam.gserviceaccount.com
4. Drag your Read.ai exports (PDFs, Videos, etc.) into it.
================================================================
Checking every 10 seconds...
  `);

    let folderId = null;

    while (!folderId) {
        try {
            const res = await drive.files.list({
                q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
                fields: 'files(id, name)',
            });

            if (res.data.files.length > 0) {
                folderId = res.data.files[0].id;
                console.log(`\n[SUCCESS] Found folder: ${folderName} (${folderId})`);
                console.log('Starting ingestion sequence...');
            } else {
                process.stdout.write('.');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        } catch (error) {
            console.error('\nError checking Drive:', error.message);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    // Start Ingestion
    try {
        const config = {
            keyFilePath: KEY_FILE_PATH,
            downloadDir: path.join(__dirname, 'data_ingestion_ruv_coaching'),
        };

        const connector = SourceManager.getConnector('google_drive', config);
        const documents = await connector.process(folderId);

        console.log(`\n[Ingestion Complete] Downloaded ${documents.length} files.`);

        if (documents.length === 0) {
            console.log('WARNING: The folder is empty! Please add your Read.ai files to it.');
            return;
        }

        // Process Content
        const processor = new ContentProcessor();
        console.log('\n[Processing Content] Extracting text & analyzing images...');

        const processedDocs = [];
        for (const doc of documents) {
            const processed = await processor.processDocument(doc);
            processedDocs.push(processed);
        }

        fs.writeFileSync('ruv_coaching_knowledge.json', JSON.stringify(processedDocs, null, 2));
        console.log('\n[SUCCESS] Knowledge Base built and saved to ruv_coaching_knowledge.json');

    } catch (error) {
        console.error('Ingestion Failed:', error);
    }
}

waitForFolderAndIngest();
