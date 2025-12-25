/**
 * HybridSearch - Combines BM25 keyword search with semantic vector search
 *
 * This provides the best of both worlds:
 * - BM25: Exact keyword matching (good for specific terms, commands, error messages)
 * - Semantic: Conceptual similarity (good for paraphrased questions, related topics)
 */

class HybridSearch {
    constructor(options = {}) {
        // Weight for semantic search results (0-1)
        this.semanticWeight = options.semanticWeight || 0.6;
        // Weight for BM25 keyword search (0-1)
        this.bm25Weight = options.bm25Weight || 0.4;
        // BM25 parameters
        this.k1 = options.k1 || 1.5;  // Term frequency saturation
        this.b = options.b || 0.75;    // Length normalization
        // Document index for BM25
        this.documents = [];
        this.docFrequency = new Map();  // Term -> document frequency
        this.avgDocLength = 0;
        this.totalDocs = 0;
        // Stopwords to ignore in keyword search
        this.stopwords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
            'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
            'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'
        ]);
    }

    /**
     * Tokenize text for BM25
     */
    tokenize(text) {
        if (!text || typeof text !== 'string') return [];

        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, ' ')  // Remove special chars except hyphens
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.stopwords.has(word));
    }

    /**
     * Build BM25 index from documents
     * @param {Array} documents - Array of {id, content, metadata} objects
     */
    buildIndex(documents) {
        this.documents = [];
        this.docFrequency = new Map();
        let totalLength = 0;

        // First pass: tokenize and count document frequencies
        for (const doc of documents) {
            const tokens = this.tokenize(doc.content || doc.text || '');
            const uniqueTokens = new Set(tokens);

            this.documents.push({
                id: doc.id,
                tokens,
                length: tokens.length,
                content: doc.content || doc.text,
                metadata: doc.metadata
            });

            totalLength += tokens.length;

            // Update document frequency for each unique term
            for (const token of uniqueTokens) {
                this.docFrequency.set(token, (this.docFrequency.get(token) || 0) + 1);
            }
        }

        this.totalDocs = documents.length;
        this.avgDocLength = totalLength / Math.max(1, this.totalDocs);

        console.log(`[HybridSearch] Indexed ${this.totalDocs} documents, ${this.docFrequency.size} unique terms`);
    }

    /**
     * Calculate BM25 score for a document given a query
     */
    bm25Score(queryTokens, doc) {
        let score = 0;
        const docLength = doc.length;
        const termFreq = new Map();

        // Count term frequencies in document
        for (const token of doc.tokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }

        for (const queryTerm of queryTokens) {
            const tf = termFreq.get(queryTerm) || 0;
            if (tf === 0) continue;

            const df = this.docFrequency.get(queryTerm) || 0;
            if (df === 0) continue;

            // IDF component: log((N - df + 0.5) / (df + 0.5))
            const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5) + 1);

            // TF component with saturation and length normalization
            const tfNorm = (tf * (this.k1 + 1)) /
                (tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength)));

            score += idf * tfNorm;
        }

        return score;
    }

    /**
     * Search using BM25 keyword matching
     * @param {string} query - Search query
     * @param {number} k - Number of results to return
     * @returns {Array} Scored results sorted by BM25 score
     */
    bm25Search(query, k = 10) {
        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0) return [];

        const scored = this.documents.map(doc => ({
            id: doc.id,
            content: doc.content,
            metadata: doc.metadata,
            bm25Score: this.bm25Score(queryTokens, doc)
        }));

        // Filter out zero scores and sort
        return scored
            .filter(r => r.bm25Score > 0)
            .sort((a, b) => b.bm25Score - a.bm25Score)
            .slice(0, k);
    }

    /**
     * Combine semantic and BM25 search results using reciprocal rank fusion
     * @param {Array} semanticResults - Results from semantic search [{id, score, content, metadata}]
     * @param {Array} bm25Results - Results from BM25 search [{id, bm25Score, content, metadata}]
     * @param {number} k - Final number of results to return
     * @returns {Array} Fused and re-ranked results
     */
    fuseResults(semanticResults, bm25Results, k = 5) {
        const fusedScores = new Map();
        const resultData = new Map();

        // Reciprocal Rank Fusion constant (controls smoothing)
        const RRF_K = 60;

        // Process semantic results
        semanticResults.forEach((result, rank) => {
            const id = result.id || result.source;
            // Normalize semantic score to 0-1 range
            const normalizedScore = Math.min(1, Math.max(0, result.score || result.similarity || 0));
            // RRF score component
            const rrfScore = 1 / (RRF_K + rank + 1);
            // Combined with semantic weight
            const weightedScore = (normalizedScore * this.semanticWeight) + (rrfScore * this.semanticWeight);

            fusedScores.set(id, (fusedScores.get(id) || 0) + weightedScore);
            resultData.set(id, result);
        });

        // Process BM25 results
        bm25Results.forEach((result, rank) => {
            const id = result.id;
            // Normalize BM25 score (BM25 scores can be > 1, so we use a sigmoid-like normalization)
            const normalizedScore = result.bm25Score / (1 + result.bm25Score);
            // RRF score component
            const rrfScore = 1 / (RRF_K + rank + 1);
            // Combined with BM25 weight
            const weightedScore = (normalizedScore * this.bm25Weight) + (rrfScore * this.bm25Weight);

            fusedScores.set(id, (fusedScores.get(id) || 0) + weightedScore);
            if (!resultData.has(id)) {
                resultData.set(id, result);
            }
        });

        // Sort by fused score and return top k
        return Array.from(fusedScores.entries())
            .map(([id, fusedScore]) => ({
                ...resultData.get(id),
                fusedScore,
                score: fusedScore  // Override score with fused score
            }))
            .sort((a, b) => b.fusedScore - a.fusedScore)
            .slice(0, k);
    }

    /**
     * Perform hybrid search combining semantic and keyword search
     * This is the main method to use for retrieval
     */
    async hybridSearch(query, semanticSearchFn, k = 5) {
        // Get semantic search results
        const semanticResults = await semanticSearchFn(query, k * 2);

        // Get BM25 results
        const bm25Results = this.bm25Search(query, k * 2);

        // Fuse and return
        return this.fuseResults(semanticResults, bm25Results, k);
    }

    /**
     * Get statistics about the index
     */
    getStats() {
        return {
            totalDocuments: this.totalDocs,
            uniqueTerms: this.docFrequency.size,
            avgDocumentLength: this.avgDocLength,
            semanticWeight: this.semanticWeight,
            bm25Weight: this.bm25Weight
        };
    }
}

module.exports = HybridSearch;
