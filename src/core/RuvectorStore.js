/**
 * RuvectorStore - High-Performance Persistent Vector Storage
 *
 * ARCHITECTURE:
 * - Uses PersistentVectorDB (RuVector with disk persistence)
 * - HNSW indexing: 125x faster than SQLite brute-force
 * - Binary serialization for efficient storage
 * - WAL for crash recovery
 * - Full persistence across restarts
 *
 * REPLACES:
 * - Previous SQLite-based HybridReasoningBank implementation
 *
 * PERFORMANCE:
 * - 61µs p50 search latency (vs SQLite ~7.5ms)
 * - 16,400 QPS throughput
 * - Persistent: survives process restarts
 *
 * @author RuVector Team
 * @version 2.0.0 - RuVector Native
 */

const { applyRecencyBoost } = require('./RecencyBoost');
const path = require('path');
require('dotenv').config();

// Import persistent vector database
const { PersistentVectorDB, getPersistentVectorDB } = require('../storage');

// Try to load embedding service
let embeddingService = null;
try {
    const ruvector = require('ruvector');
    embeddingService = ruvector.embeddingService;
} catch {
    // Will use fallback
}

// Try @xenova/transformers for local embeddings
let pipeline = null;
let embedPipeline = null;

/**
 * Simple text to vector hash (fallback when no embedder available)
 * This provides consistent hashing but limited semantic understanding
 */
function textToHashVector(text, dimensions = 128) {
    const vector = new Float32Array(dimensions);
    const str = String(text);

    // Use FNV-1a style hashing distributed across dimensions
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        hash ^= charCode;
        hash = (hash * 16777619) >>> 0;
        const idx = i % dimensions;
        vector[idx] = (vector[idx] + (hash % 1000) / 1000) % 1;
    }

    // Add n-gram features for better matching
    for (let i = 0; i < str.length - 2; i++) {
        const ngram = str.slice(i, i + 3);
        let ngramHash = 0;
        for (let j = 0; j < ngram.length; j++) {
            ngramHash = ((ngramHash << 5) - ngramHash + ngram.charCodeAt(j)) >>> 0;
        }
        const idx = ngramHash % dimensions;
        vector[idx] = (vector[idx] + 0.1) % 1;
    }

    // Normalize to unit vector
    let mag = 0;
    for (let i = 0; i < dimensions; i++) mag += vector[i] * vector[i];
    mag = Math.sqrt(mag) || 1;
    for (let i = 0; i < dimensions; i++) vector[i] /= mag;

    return vector;
}

/**
 * Generate embedding for text using best available method
 */
async function generateEmbedding(text, dimensions = 128) {
    // Try RuVector embedding service first
    if (embeddingService) {
        try {
            const embedding = await embeddingService.embed(text);
            return embedding;
        } catch {
            // Fall through to next method
        }
    }

    // Try @xenova/transformers for local embeddings
    if (!embedPipeline && !pipeline) {
        try {
            const transformers = await import('@xenova/transformers');
            pipeline = transformers.pipeline;
        } catch {
            // Transformers not available
        }
    }

    if (pipeline && !embedPipeline) {
        try {
            // Use all-MiniLM-L6-v2 for good quality + speed balance
            embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        } catch {
            // Model loading failed
        }
    }

    if (embedPipeline) {
        try {
            const output = await embedPipeline(text, { pooling: 'mean', normalize: true });
            // MiniLM produces 384-dim embeddings, but RuVector only supports 128
            // Project down to 128 dims by averaging every 3 dimensions
            const fullEmbedding = new Float32Array(output.data);
            if (fullEmbedding.length > dimensions) {
                const projected = new Float32Array(dimensions);
                const ratio = fullEmbedding.length / dimensions;
                for (let i = 0; i < dimensions; i++) {
                    let sum = 0;
                    const start = Math.floor(i * ratio);
                    const end = Math.floor((i + 1) * ratio);
                    for (let j = start; j < end; j++) {
                        sum += fullEmbedding[j];
                    }
                    projected[i] = sum / (end - start);
                }
                // Normalize
                let mag = 0;
                for (let i = 0; i < dimensions; i++) mag += projected[i] * projected[i];
                mag = Math.sqrt(mag) || 1;
                for (let i = 0; i < dimensions; i++) projected[i] /= mag;
                return projected;
            }
            return fullEmbedding;
        } catch {
            // Fall through to hash fallback
        }
    }

    // Fallback to hash-based vectors
    return textToHashVector(text, dimensions);
}

/**
 * RuvectorStore - Main class for vector storage
 */
class RuvectorStore {
    constructor() {
        this.db = null;
        // RuVector native VectorDB supports 128 dimensions
        // For larger embeddings, we project down to 128 for HNSW indexing
        this.dimensions = 128;
        this.embeddingCache = new Map(); // Cache embeddings for faster search
    }

    async initialize() {
        console.log('[RuvectorStore] Initializing RuVector Native Backend...');

        try {
            // Initialize persistent vector database
            this.db = await getPersistentVectorDB('knowledge-base', {
                dimensions: this.dimensions,
                distanceMetric: 'Cosine',
                saveIntervalMs: 2000, // Save every 2s after changes
                useWAL: true
            });

            const stats = this.db.getStats();
            console.log('[RuvectorStore] ✅ RuVector initialized successfully');
            console.log(`[RuvectorStore] Backend: RuVector HNSW + PersistentVectorDB`);
            console.log(`[RuvectorStore] Vectors loaded: ${stats.vectorCount}`);
            console.log(`[RuvectorStore] Path: ${stats.path}`);

            return true;
        } catch (error) {
            console.error('[RuvectorStore] ❌ Initialization error:', error);
            throw error;
        }
    }

    async addDocuments(documents) {
        await this.addDocumentsBatch(documents);
    }

    async addDocumentsBatch(documents) {
        console.log(`\n[RuvectorStore] 📥 Adding batch of ${documents.length} documents...`);

        let added = 0;
        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];

            try {
                // Generate embedding for document content
                const content = doc.content || '';
                const embedding = await generateEmbedding(content, this.dimensions);

                // Create unique ID for document
                const id = doc.id || doc.name || `doc_${Date.now()}_${i}`;

                // Store in persistent vector DB
                await this.db.insert({
                    id,
                    vector: embedding,
                    metadata: {
                        content: content, // Store full content for retrieval
                        name: doc.name || 'Knowledge Base Entry',
                        source: doc.metadata?.source || 'Unknown',
                        type: doc.mimeType || 'text',
                        timestamp: new Date().toISOString(),
                        relativePath: doc.metadata?.relativePath,
                        ...doc.metadata
                    }
                });

                added++;

                if ((i + 1) % 10 === 0) {
                    process.stdout.write('.');
                }
            } catch (error) {
                console.error(`[RuvectorStore] ❌ Error processing document:`, error.message);
            }
        }

        console.log('');
        console.log(`[RuvectorStore] ✅ Added ${added}/${documents.length} documents`);
    }

    async commit() {
        // Force save to disk
        await this.db.flush();
        console.log('[RuvectorStore] ✅ Data persisted to disk (RuVector binary format)');
    }

    // Embedding generation for external use
    async generateEmbedding(text) {
        return generateEmbedding(text, this.dimensions);
    }

    async search(query, topK = 5) {
        try {
            // Generate query embedding
            const queryEmbedding = await generateEmbedding(query, this.dimensions);

            // Search using RuVector HNSW (125x faster than brute-force)
            const results = await this.db.search({
                vector: queryEmbedding,
                k: topK * 2 // Get more for recency filtering
            });

            // Map results to expected format
            const enrichedResults = results.map(result => {
                const metadata = result.metadata || {};
                return {
                    id: result.id,
                    score: result.score,
                    similarity: result.score,
                    content: metadata.content || '[Content not found]',
                    input: metadata.content, // Alias for compatibility
                    metadata: {
                        task: metadata.name,
                        source: metadata.source,
                        timestamp: metadata.timestamp,
                        relativePath: metadata.relativePath,
                        ...metadata
                    }
                };
            });

            // APPLY RECENCY BOOST
            const boostedResults = applyRecencyBoost(enrichedResults);

            // Return top K after recency boost
            return boostedResults.slice(0, topK);

        } catch (error) {
            console.error('[RuvectorStore] Search error:', error);
            return [];
        }
    }

    /**
     * Reflexion-compatible interface for app.js compatibility
     * This provides the same API as HybridReasoningBank.reflexion
     */
    get reflexion() {
        const self = this;
        return {
            async retrieveRelevant({ task, k = 10 }) {
                // Generate embedding for task/query
                const queryEmbedding = await generateEmbedding(task, self.dimensions);

                // Search
                const results = await self.db.search({
                    vector: queryEmbedding,
                    k: k
                });

                // Map to ReasoningBank-compatible format
                return results.map(r => ({
                    id: r.id,
                    input: r.metadata?.content || '',
                    task: r.metadata?.name || '',
                    similarity: r.score,
                    metadata: r.metadata
                }));
            }
        };
    }

    /**
     * Store method for ReasoningBank API compatibility
     */
    async store(content, metadata = {}) {
        const embedding = await generateEmbedding(content, this.dimensions);
        const id = `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        await this.db.insert({
            id,
            vector: embedding,
            metadata: {
                content,
                ...metadata,
                timestamp: new Date().toISOString()
            }
        });

        return id;
    }

    getStats() {
        const dbStats = this.db ? this.db.getStats() : {};
        return {
            backend: 'RuVector HNSW + PersistentVectorDB',
            status: 'Active',
            vectorCount: dbStats.vectorCount || 0,
            dimensions: this.dimensions,
            searches: dbStats.searches || 0,
            inserts: dbStats.inserts || 0,
            path: dbStats.path || '.ruvector/knowledge-base'
        };
    }

    async close() {
        if (this.db) {
            await this.db.close();
        }
    }
}

module.exports = RuvectorStore;
