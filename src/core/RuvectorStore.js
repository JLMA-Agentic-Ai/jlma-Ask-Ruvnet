// Note: agentic-flow is ESM, use dynamic import in initialize() method
const { applyRecencyBoost } = require('./RecencyBoost');
require('dotenv').config();

/**
 * RuvectorStore - Robust Implementation backed by Agentic Flow's ReasoningBank
 * 
 * This implementation replaces the unstable native 'ruvector' package with
 * the robust, SQLite-based HybridReasoningBank from agentic-flow.
 * It maintains the same API surface for compatibility but ensures stability.
 */
class RuvectorStore {
    constructor() {
        this.bank = null;
        // Ensure we use local transformers for consistency and cost-savings
        process.env.FORCE_TRANSFORMERS = 'true';
    }

    async initialize() {
        console.log('[RuvectorStore] Initializing Robust Backend (ReasoningBank)...');

        try {
            // Initialize the ReasoningBank (SQLite + Transformers)
            const bankModule = await import('agentic-flow/reasoningbank');
            if (bankModule.initialize) {
                await bankModule.initialize();
            }

            this.bank = new bankModule.HybridReasoningBank({ preferWasm: false });

            console.log('[RuvectorStore] ✅ Ruvector (ReasoningBank) initialized successfully');
            console.log('[RuvectorStore] Backend: SQLite + Transformers.js');

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

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];

            try {
                // Store in ReasoningBank
                // We map 'content' to the 'input' field of the episode
                // We map 'metadata' to the 'context' or 'task' fields
                await this.bank.store(doc.content, {
                    task: doc.name || 'Knowledge Base Entry',
                    source: doc.metadata?.source || 'Unknown',
                    type: doc.mimeType || 'text',
                    timestamp: new Date().toISOString(),
                    ...doc.metadata
                });

                if ((i + 1) % 10 === 0) {
                    process.stdout.write('.');
                }
            } catch (error) {
                console.error(`[RuvectorStore] ❌ Error processing document:`, error.message);
            }
        }
        console.log(''); // Newline
    }

    async commit() {
        // ReasoningBank (SQLite) auto-commits on insert.
        // No explicit build/save step needed, but we log for compatibility.
        console.log('[RuvectorStore] ✅ Data persisted to SQLite (Auto-commit)');
    }

    // Embedding generation is handled internally by ReasoningBank
    async generateEmbedding(text) {
        // This method is kept for API compatibility but might not be used directly
        // if we rely on bank.store()
        return [];
    }

    async search(query, topK = 5) {
        try {
            // Search using ReasoningBank's semantic retrieval
            // It handles embedding generation and cosine similarity internally
            const results = await this.bank.reflexion.retrieveRelevant({
                task: query,
                k: topK * 2 // Get more for recency filtering
            });

            // Map ReasoningBank results to RuvectorStore format
            const enrichedResults = results.map(result => {
                return {
                    id: result.id || `res_${Date.now()}_${Math.random()}`,
                    score: result.similarity,
                    content: result.input || '[Content not found]',
                    metadata: {
                        task: result.task,
                        timestamp: result.timestamp, // Ensure timestamp exists for recency boost
                        ...result.metadata
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

    getStats() {
        // Return basic stats if available
        return {
            backend: 'ReasoningBank (SQLite)',
            status: 'Active'
        };
    }
}

module.exports = RuvectorStore;
