/**
 * RvfStore — RVF-native knowledge store for Ask-RuvNet
 *
 * Replaces RuvectorStore (PersistentVectorDB) with @ruvector/rvf native format.
 * Uses knowledge.rvf for vector search + content-sidecar.json.gz for text content.
 *
 * API-compatible with RuvectorStore — drop-in replacement in app.js.
 *
 * Updated: 2026-03-02 10:00:00 EST | Version 1.0.0
 * Created: 2026-03-02
 */

const { applyRecencyBoost } = require('./RecencyBoost');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
require('dotenv').config();

// ONNX fast embeddings for query embedding
let onnxService = null;
let onnxInitPromise = null;
const ONNX_EMBEDDINGS_PATH = process.env.CLAUDE_FLOW_EMBEDDINGS_PATH ||
    path.join(require('os').homedir(), '.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js');

async function getOnnxService() {
    if (onnxService) return onnxService;
    if (onnxInitPromise) return onnxInitPromise;
    onnxInitPromise = (async () => {
        try {
            const mod = await import(ONNX_EMBEDDINGS_PATH);
            const svc = await mod.createEmbeddingServiceAsync({
                provider: 'transformers',
                model: 'Xenova/all-MiniLM-L6-v2',
                dimensions: 384
            });
            onnxService = svc;
            console.log('[RvfStore] ONNX fast embeddings loaded');
            return svc;
        } catch (err) {
            console.warn('[RvfStore] ONNX unavailable:', err.message);
            onnxInitPromise = null;
            return null;
        }
    })();
    return onnxInitPromise;
}

// @xenova/transformers fallback
let pipeline = null;
let embedPipeline = null;

/**
 * Hash-based fallback embedding (last resort)
 */
function textToHashVector(text, dimensions = 384) {
    const vector = new Float32Array(dimensions);
    const str = String(text);
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * 16777619) >>> 0;
        vector[i % dimensions] = (vector[i % dimensions] + (hash % 1000) / 1000) % 1;
    }
    for (let i = 0; i < str.length - 2; i++) {
        const ngram = str.slice(i, i + 3);
        let ngramHash = 0;
        for (let j = 0; j < ngram.length; j++) {
            ngramHash = (ngramHash * 31 + ngram.charCodeAt(j)) >>> 0;
        }
        const idx = ngramHash % dimensions;
        vector[idx] += 0.1;
    }
    // Normalize
    let norm = 0;
    for (let i = 0; i < dimensions; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < dimensions; i++) vector[i] /= norm;
    return vector;
}

/**
 * Generate embedding using the best available method
 */
async function generateEmbedding(text, dimensions = 384) {
    if (!text || typeof text !== 'string') {
        return new Float32Array(dimensions);
    }
    const truncated = text.substring(0, 8000);

    // Try ONNX first
    try {
        const svc = await getOnnxService();
        if (svc) {
            const result = await svc.embed(truncated);
            if (result?.embedding) return new Float32Array(result.embedding);
        }
    } catch {}

    // Try @xenova/transformers
    try {
        if (!embedPipeline) {
            if (!pipeline) {
                const transformers = await import('@xenova/transformers');
                pipeline = transformers.pipeline || transformers.default?.pipeline;
            }
            if (pipeline) {
                embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            }
        }
        if (embedPipeline) {
            const output = await embedPipeline(truncated, { pooling: 'mean', normalize: true });
            return new Float32Array(output.data);
        }
    } catch {}

    // Hash fallback
    return textToHashVector(truncated, dimensions);
}


class RvfStore {
    constructor() {
        this.rvfDb = null;           // @ruvector/rvf RvfDatabase instance
        this.contentMap = null;      // id -> { title, content, category, ... }
        this.dimensions = 384;
        this.vectorCount = 0;
        this.rvfPath = null;
    }

    async initialize() {
        console.log('[RvfStore] Initializing RVF Native Backend...');

        // Find RVF file
        const candidates = [
            path.resolve('knowledge.rvf'),
            path.resolve('.ruvector/knowledge.rvf'),
        ];
        this.rvfPath = candidates.find(p => fs.existsSync(p));

        if (!this.rvfPath) {
            throw new Error('knowledge.rvf not found. Run: node scripts/convert-to-rvf.mjs');
        }

        // Load RVF database (read-only for production serving)
        const { RvfDatabase } = await import('@ruvector/rvf');
        this.rvfDb = await RvfDatabase.openReadonly(this.rvfPath);
        const status = await this.rvfDb.status();
        this.vectorCount = status.totalVectors;
        console.log(`[RvfStore] RVF loaded: ${this.vectorCount.toLocaleString()} vectors, ${status.totalSegments} segments`);

        // Load content sidecar
        const sidecarCandidates = [
            path.resolve('content-sidecar.json.gz'),
            path.resolve('.ruvector/content-sidecar.json.gz'),
        ];
        const sidecarPath = sidecarCandidates.find(p => fs.existsSync(p));

        if (sidecarPath) {
            console.log('[RvfStore] Loading content sidecar...');
            const compressed = fs.readFileSync(sidecarPath);
            const json = zlib.gunzipSync(compressed).toString('utf8');
            this.contentMap = JSON.parse(json);
            console.log(`[RvfStore] Content sidecar loaded: ${Object.keys(this.contentMap).length.toLocaleString()} entries`);
        } else {
            console.warn('[RvfStore] No content sidecar found — search will work but content will be empty');
            this.contentMap = {};
        }

        console.log('[RvfStore] Backend: RVF Native (HNSW-indexed cognitive container)');
        return true;
    }

    async search(query, topK = 5) {
        try {
            const queryEmbedding = await generateEmbedding(query, this.dimensions);

            const results = await this.rvfDb.query(queryEmbedding, topK * 2);

            const enrichedResults = results.map(result => {
                const content = this.contentMap[result.id] || {};
                return {
                    id: result.id,
                    score: 1 / (1 + result.distance), // Convert distance to similarity score
                    similarity: 1 / (1 + result.distance),
                    content: content.content || '[Content not found]',
                    input: content.content,
                    title: content.title || null,
                    metadata: {
                        task: content.title,
                        title: content.title,
                        content: content.content,
                        source: content.source_table || 'rvf',
                        category: content.category,
                        quality_score: content.quality_score,
                        knowledge_type: content.knowledge_type,
                        package_name: content.package_name,
                        doc_type: content.doc_type,
                        is_curated: content.is_curated,
                    }
                };
            });

            const boostedResults = applyRecencyBoost(enrichedResults);
            return boostedResults.slice(0, topK);

        } catch (error) {
            console.error('[RvfStore] Search error:', error);
            return [];
        }
    }

    /**
     * Reflexion-compatible interface (same API as RuvectorStore.reflexion)
     */
    get reflexion() {
        const self = this;
        return {
            async retrieveRelevant({ task, k = 10 }) {
                const queryEmbedding = await generateEmbedding(task, self.dimensions);
                const results = await self.rvfDb.query(queryEmbedding, k);

                return results.map(r => {
                    const content = self.contentMap[r.id] || {};
                    return {
                        id: r.id,
                        input: content.content || '',
                        task: content.title || '',
                        similarity: 1 / (1 + r.distance),
                        content: content.content || '',
                        title: content.title || '',
                        metadata: {
                            title: content.title,
                            content: content.content,
                            source: content.source_table || 'rvf',
                            category: content.category,
                            quality_score: content.quality_score,
                            knowledge_type: content.knowledge_type,
                            package_name: content.package_name,
                            doc_type: content.doc_type,
                            is_curated: content.is_curated,
                        }
                    };
                });
            }
        };
    }

    /**
     * db-like interface for app.js compatibility (getAllMetadata for BM25 index)
     */
    get db() {
        const self = this;
        return {
            getAllMetadata() {
                return Object.entries(self.contentMap).map(([id, meta]) => ({
                    id,
                    metadata: meta
                }));
            },
            getStats() {
                return {
                    vectorCount: self.vectorCount,
                    path: self.rvfPath,
                };
            }
        };
    }

    getStats() {
        return {
            backend: 'RVF Native (HNSW cognitive container)',
            status: 'Active',
            vectorCount: this.vectorCount,
            dimensions: this.dimensions,
            path: this.rvfPath
        };
    }

    async close() {
        if (this.rvfDb && !this.rvfDb.isClosed) {
            await this.rvfDb.close();
        }
    }
}

module.exports = RvfStore;
