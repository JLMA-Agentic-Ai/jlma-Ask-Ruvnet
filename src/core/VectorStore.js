const { Document, VectorStoreIndex, storageContextFromDefaults, Settings } = require("llamaindex");
const { OpenAIEmbedding } = require("@llamaindex/openai");
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configure LlamaIndex
Settings.embedModel = new OpenAIEmbedding({ apiKey: process.env.OPENAI_API_KEY });


class VectorStore {
    constructor() {
        this.storageDir = path.join(__dirname, '../../storage');
        this.index = null;
    }

    async addDocuments(documents) {
        console.log(`[VectorStore] Adding ${documents.length} documents using LlamaIndex...`);

        const llamaDocs = documents.map(doc => new Document({
            text: doc.content,
            metadata: {
                ...doc.metadata,
                fileName: doc.name,
                sourceId: doc.id
            }
        }));

        // Create Storage Context
        const storageContext = await storageContextFromDefaults({ persistDir: this.storageDir });

        // Create Index with Storage Context
        this.index = await VectorStoreIndex.fromDocuments(llamaDocs, { storageContext });

        // It persists automatically on creation if persistDir is set in storageContext? 
        // Or we might need to call something on the stores.
        // But usually storageContextFromDefaults handles the filesystem.
        console.log(`[VectorStore] Index created in ${this.storageDir}`);
    }

    async search(query, limit = 5) {
        if (!this.index) {
            // Load from storage if not in memory
            try {
                const { storageContextFromDefaults, VectorStoreIndex } = require("llamaindex");
                const storageContext = await storageContextFromDefaults({ persistDir: this.storageDir });
                this.index = await VectorStoreIndex.init({ storageContext });
            } catch (e) {
                console.log("[VectorStore] No existing index found, creating empty.");
                return [];
            }
        }

        const retriever = this.index.asRetriever({ similarityTopK: limit });
        const results = await retriever.retrieve(query);

        return results.map(r => ({
            id: r.node.metadata.fileName,
            content: r.node.text,
            score: r.score
        }));
    }
}

module.exports = VectorStore;
