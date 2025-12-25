/**
 * NativeRuvectorStore - True RuVector Implementation with Native Rust Performance
 *
 * This implementation uses the actual ruvector npm package (0.1.35+) for
 * blazing-fast vector search (1000x faster than SQLite). Features include:
 * - HNSW indexing for <0.5ms query latency
 * - 52,000+ inserts/sec with native Rust
 * - ~50 bytes per vector with advanced quantization
 * - Automatic WASM fallback for universal compatibility
 */

const { applyRecencyBoost } = require('./RecencyBoost');
require('dotenv').config();

class NativeRuvectorStore {
    constructor(options = {}) {
        this.db = null;
        this.dimensions = options.dimensions || 384; // MiniLM-L6-v2 default
        this.maxElements = options.maxElements || 200000;
        this.storagePath = options.storagePath || './data/ruvector.db';
        this.embedder = null;
        this.isInitialized = false;
        this.useNative = true;
    }

    async initialize() {
        console.log('[NativeRuvectorStore] 🚀 Initializing RuVector Native Backend...');
        console.log(`[NativeRuvectorStore] Dimensions: ${this.dimensions}, Max: ${this.maxElements}`);

        try {
            // Load RuVector
            const { VectorDb } = require('ruvector');

            // Initialize the vector database
            this.db = new VectorDb({
                dimensions: this.dimensions,
                maxElements: this.maxElements,
                storagePath: this.storagePath
            });

            // Initialize embedding model (Xenova transformers)
            const { pipeline } = await import('@xenova/transformers');
            this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            this.isInitialized = true;

            // Check if using native or WASM
            const info = this.db.info ? this.db.info() : { implementation: 'native' };
            this.useNative = info.implementation !== 'wasm';

            console.log('[NativeRuvectorStore] ✅ RuVector initialized successfully');
            console.log(`[NativeRuvectorStore] Backend: ${this.useNative ? 'Native Rust (blazing fast)' : 'WASM (universal)'}`);
            console.log(`[NativeRuvectorStore] Storage: ${this.storagePath}`);

            return true;
        } catch (error) {
            console.error('[NativeRuvectorStore] ❌ Initialization error:', error.message);
            // Attempt fallback to WASM-only mode
            return await this.initializeWithWasmFallback(error);
        }
    }

    async initializeWithWasmFallback(originalError) {
        console.log('[NativeRuvectorStore] Attempting WASM fallback...');
        try {
            const { VectorDb } = require('ruvector');

            this.db = new VectorDb({
                dimensions: this.dimensions,
                maxElements: this.maxElements,
                storagePath: this.storagePath,
                forceWasm: true // Force WASM mode
            });

            const { pipeline } = await import('@xenova/transformers');
            this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            this.isInitialized = true;
            this.useNative = false;

            console.log('[NativeRuvectorStore] ✅ WASM fallback successful');
            return true;
        } catch (fallbackError) {
            console.error('[NativeRuvectorStore] ❌ WASM fallback failed:', fallbackError.message);
            throw originalError;
        }
    }

    /**
     * Generate embeddings for text using local transformers
     */
    async generateEmbedding(text) {
        if (!this.embedder) {
            throw new Error('Embedder not initialized');
        }

        const output = await this.embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    /**
     * Add a single document
     */
    async addDocument(doc) {
        if (!this.isInitialized) {
            throw new Error('NativeRuvectorStore not initialized');
        }

        try {
            const content = doc.content || '';
            const embedding = await this.generateEmbedding(content.substring(0, 512));

            await this.db.insert({
                id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                vector: new Float32Array(embedding),
                metadata: {
                    content: content,
                    name: doc.name || 'Unknown',
                    source: doc.metadata?.source || 'Unknown',
                    type: doc.mimeType || 'text',
                    timestamp: new Date().toISOString(),
                    ...doc.metadata
                }
            });

            return true;
        } catch (error) {
            console.error('[NativeRuvectorStore] Insert error:', error.message);
            return false;
        }
    }

    /**
     * Batch add documents
     */
    async addDocuments(documents) {
        return await this.addDocumentsBatch(documents);
    }

    async addDocumentsBatch(documents) {
        console.log(`\n[NativeRuvectorStore] 📥 Adding batch of ${documents.length} documents...`);

        let successCount = 0;
        const startTime = Date.now();

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];

            try {
                const content = doc.content || '';
                const embedding = await this.generateEmbedding(content.substring(0, 512));

                await this.db.insert({
                    id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    vector: new Float32Array(embedding),
                    metadata: {
                        content: content,
                        name: doc.name || 'Unknown',
                        source: doc.metadata?.source || 'Unknown',
                        type: doc.mimeType || 'text',
                        timestamp: new Date().toISOString(),
                        chunkIndex: doc.chunkIndex,
                        ...doc.metadata
                    }
                });

                successCount++;

                if ((i + 1) % 100 === 0) {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const rate = Math.round(successCount / elapsed);
                    process.stdout.write(`\r[NativeRuvectorStore] Progress: ${i + 1}/${documents.length} (${rate} docs/sec)`);
                }
            } catch (error) {
                console.error(`\n[NativeRuvectorStore] ❌ Error at doc ${i}:`, error.message);
            }
        }

        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`\n[NativeRuvectorStore] ✅ Added ${successCount}/${documents.length} documents in ${elapsed.toFixed(1)}s`);

        return successCount;
    }

    /**
     * Commit changes (RuVector auto-persists, but we ensure sync)
     */
    async commit() {
        if (this.db && this.db.save) {
            await this.db.save();
        }
        console.log('[NativeRuvectorStore] ✅ Data persisted to RuVector');
    }

    /**
     * Search for similar documents
     */
    async search(query, topK = 5) {
        if (!this.isInitialized) {
            throw new Error('NativeRuvectorStore not initialized');
        }

        try {
            const startTime = Date.now();

            // Generate query embedding
            const queryEmbedding = await this.generateEmbedding(query);

            // Search using RuVector's native HNSW
            const results = await this.db.search({
                vector: new Float32Array(queryEmbedding),
                k: topK * 2, // Get more for recency filtering
                threshold: 0.35 // Similarity threshold
            });

            const searchTime = Date.now() - startTime;

            // Map RuVector results to standard format
            const enrichedResults = results.map(result => ({
                id: result.id,
                score: result.score || result.similarity || 0,
                content: result.metadata?.content || '[Content not found]',
                metadata: {
                    source: result.metadata?.source,
                    name: result.metadata?.name,
                    type: result.metadata?.type,
                    timestamp: result.metadata?.timestamp,
                    ...result.metadata
                }
            }));

            // Apply recency boost
            const boostedResults = applyRecencyBoost(enrichedResults);

            console.log(`[NativeRuvectorStore] 🔍 Search completed in ${searchTime}ms (${this.useNative ? 'native' : 'wasm'})`);

            return boostedResults.slice(0, topK);
        } catch (error) {
            console.error('[NativeRuvectorStore] Search error:', error);
            return [];
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        try {
            const count = this.db ? await this.db.len() : 0;
            return {
                backend: `RuVector ${this.useNative ? 'Native Rust' : 'WASM'}`,
                status: this.isInitialized ? 'Active' : 'Not initialized',
                documentCount: count,
                dimensions: this.dimensions,
                maxElements: this.maxElements,
                storagePath: this.storagePath
            };
        } catch (error) {
            return {
                backend: 'RuVector',
                status: 'Error',
                error: error.message
            };
        }
    }

    /**
     * Get a specific document by ID
     */
    async get(id) {
        if (!this.db || !this.isInitialized) return null;
        try {
            return await this.db.get(id);
        } catch (error) {
            return null;
        }
    }

    /**
     * Delete a document by ID
     */
    async delete(id) {
        if (!this.db || !this.isInitialized) return false;
        try {
            return await this.db.delete(id);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get total document count
     */
    async count() {
        if (!this.db || !this.isInitialized) return 0;
        try {
            return await this.db.len();
        } catch (error) {
            return 0;
        }
    }
}

module.exports = NativeRuvectorStore;
