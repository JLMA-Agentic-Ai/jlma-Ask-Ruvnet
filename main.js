const SourceManager = require('./src/connectors/SourceManager');
const path = require('path');
require('dotenv').config();

async function main() {
    const args = process.argv.slice(2);
    const sourceType = args.find(arg => arg.startsWith('--source='))?.split('=')[1] || 'google_drive';
    const sourceId = args.find(arg => arg.startsWith('--id='))?.split('=')[1] || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!sourceId) {
        console.error('Error: Please provide a source ID via --id=... or set GOOGLE_DRIVE_FOLDER_ID in .env');
        process.exit(1);
    }

    console.log(`
================================================================
UNIVERSAL ANSWERBOT INGESTION CLI
================================================================
Source Type: ${sourceType}
Source ID:   ${sourceId}
================================================================
  `);

    const config = {
        keyFilePath: path.join(__dirname, 'service-account.json'),
        downloadDir: path.join(__dirname, 'data_ingestion'),
        directory: sourceId // For local_directory connector
    };

    try {
        const connector = SourceManager.getConnector(sourceType, config);
        const documents = await connector.process(sourceId);

        console.log('\n[Ingestion Complete]');
        console.log(`Total Documents Downloaded: ${documents.length}`);

        // Initialize Content Processor
        const ContentProcessor = require('./src/core/ContentProcessor');
        const processor = new ContentProcessor();

        console.log('\n[Starting Smart Content Extraction]');
        console.log('----------------------------------------------------------------');

        const processedDocs = [];
        for (const doc of documents) {
            const processed = await processor.processDocument(doc);
            processedDocs.push(processed);
        }

        console.log('----------------------------------------------------------------');
        console.log('Ready for Vectorization phase.');

        // Save processed state for next phase
        const fs = require('fs');
        fs.writeFileSync('processed_knowledge.json', JSON.stringify(processedDocs, null, 2));
        console.log('Knowledge Base saved to processed_knowledge.json');

    } catch (error) {
        console.error('Ingestion Failed:', error);
    }
}

main();
