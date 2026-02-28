/**
 * ReRanker - Cross-encoder style re-ranking for improved result quality
 *
 * Uses multiple signals to re-rank results after initial retrieval:
 * - Semantic relevance (embedding similarity)
 * - Keyword overlap (exact match bonus)
 * - Position/recency weighting
 * - Source diversity scoring
 * - Query-document alignment scoring
 * - Authority boost by document type (ADRs, changelogs, etc.)
 */

class ReRanker {
    constructor(options = {}) {
        // Weights for different ranking signals
        this.weights = {
            semantic: options.semanticWeight || 0.35,
            keyword: options.keywordWeight || 0.25,
            alignment: options.alignmentWeight || 0.20,
            recency: options.recencyWeight || 0.10,
            diversity: options.diversityWeight || 0.10
        };

        // Ensure weights sum to 1
        const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
        Object.keys(this.weights).forEach(k => this.weights[k] /= total);

        // Authority boosts by doc_type — additive bonus applied after
        // weighted scoring so high-value document types surface higher.
        this.authorityBoosts = {
            adr:       options.adrBoost       || 0.15,  // Architectural Decision Records
            changelog: options.changelogBoost || 0.10,  // Recent change documentation
            release:   options.releaseBoost   || 0.08,  // Release notes
            commit:    options.commitBoost    || 0.05   // Commit messages
        };

        // Query term importance (TF-IDF style)
        this.idfCache = new Map();
    }

    /**
     * Re-rank results using multiple signals
     * @param {string} query - Original query
     * @param {Array} results - Initial retrieval results
     * @param {Object} options - Re-ranking options
     * @returns {Array} Re-ranked results
     */
    rerank(query, results, options = {}) {
        if (!results || results.length === 0) return results;

        const queryTerms = this.tokenize(query);
        const maxResults = options.maxResults || results.length;

        // Calculate scores for each result
        const scored = results.map((result, index) => {
            const content = result.content || result.input || '';
            const docTerms = this.tokenize(content);

            // 1. Semantic score (pass-through from initial retrieval)
            const semanticScore = this.normalizeScore(result.score || result.similarity || 0);

            // 2. Keyword overlap score
            const keywordScore = this.calculateKeywordScore(queryTerms, docTerms);

            // 3. Query-document alignment score
            const alignmentScore = this.calculateAlignmentScore(query, content);

            // 4. Recency score
            const recencyScore = this.calculateRecencyScore(result);

            // 5. Diversity penalty (applied later)
            const diversityScore = 1.0; // Will be adjusted in post-processing

            // 6. Authority boost based on doc_type
            const authorityBoost = this.calculateAuthorityBoost(result);

            // Combined score (authority boost is additive, not weighted)
            const combinedScore =
                (semanticScore * this.weights.semantic) +
                (keywordScore * this.weights.keyword) +
                (alignmentScore * this.weights.alignment) +
                (recencyScore * this.weights.recency) +
                (diversityScore * this.weights.diversity) +
                authorityBoost;

            return {
                ...result,
                rerankedScore: combinedScore,
                scoreBreakdown: {
                    semantic: semanticScore,
                    keyword: keywordScore,
                    alignment: alignmentScore,
                    recency: recencyScore,
                    authority: authorityBoost
                }
            };
        });

        // Sort by combined score
        scored.sort((a, b) => b.rerankedScore - a.rerankedScore);

        // Apply diversity penalty to avoid too-similar results
        const diversified = this.applyDiversityPenalty(scored);

        // Return top results
        return diversified.slice(0, maxResults);
    }

    /**
     * Tokenize text into terms
     */
    tokenize(text) {
        if (!text) return [];
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);
    }

    /**
     * Normalize score to 0-1 range
     */
    normalizeScore(score) {
        // Handle different score ranges
        if (score > 1) {
            // BM25-style scores can be > 1
            return score / (1 + score);
        }
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Calculate keyword overlap score
     */
    calculateKeywordScore(queryTerms, docTerms) {
        if (queryTerms.length === 0) return 0;

        const docTermSet = new Set(docTerms);
        let matchCount = 0;
        let weightedMatch = 0;

        for (const term of queryTerms) {
            if (docTermSet.has(term)) {
                matchCount++;
                // Longer terms are more specific, give them more weight
                weightedMatch += Math.min(1, term.length / 8);
            }

            // Partial match bonus for compound words
            for (const docTerm of docTerms) {
                if (docTerm.includes(term) || term.includes(docTerm)) {
                    weightedMatch += 0.3;
                    break;
                }
            }
        }

        // Combine raw match ratio with weighted match
        const matchRatio = matchCount / queryTerms.length;
        const weightedRatio = weightedMatch / queryTerms.length;

        return (matchRatio * 0.6 + Math.min(1, weightedRatio) * 0.4);
    }

    /**
     * Calculate query-document alignment score
     * Measures how well the document structure matches the query intent
     */
    calculateAlignmentScore(query, content) {
        if (!content) return 0;

        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();

        let score = 0;

        // Exact phrase match bonus
        if (contentLower.includes(queryLower)) {
            score += 0.5;
        }

        // Check for question-answer alignment
        if (queryLower.startsWith('how')) {
            // Look for instructional content
            if (/step\s*\d|first|then|next|finally|to\s+\w+,/i.test(content)) {
                score += 0.3;
            }
        } else if (queryLower.startsWith('what')) {
            // Look for definitional content
            if (/\bis\s+(a|an|the)\b|\bmeans?\b|\brefers?\s+to/i.test(content)) {
                score += 0.3;
            }
        } else if (queryLower.startsWith('why')) {
            // Look for explanatory content
            if (/because|reason|due\s+to|in\s+order|therefore/i.test(content)) {
                score += 0.3;
            }
        }

        // Code presence bonus for technical queries
        const hasTechnicalTerms = /function|class|import|const|let|var|def|async|await/i.test(queryLower);
        const hasCode = /```|function\s*\(|const\s+\w+\s*=|import\s+\{/i.test(content);
        if (hasTechnicalTerms && hasCode) {
            score += 0.2;
        }

        return Math.min(1, score);
    }

    /**
     * Calculate recency score
     */
    calculateRecencyScore(result) {
        const timestamp = result.metadata?.timestamp || result.timestamp;
        if (!timestamp) return 0.5; // Default for unknown age

        const date = new Date(timestamp);
        const now = new Date();
        const daysDiff = (now - date) / (1000 * 60 * 60 * 24);

        // Exponential decay with 60-day half-life
        const halfLife = 60;
        return Math.exp(-daysDiff * Math.LN2 / halfLife);
    }

    /**
     * Calculate authority boost based on doc_type.
     * ADRs, changelogs, releases, and commits each get an additive boost
     * so that high-value architectural documents surface higher in results.
     */
    calculateAuthorityBoost(result) {
        const docType = (result.doc_type || result.metadata?.doc_type || '').toLowerCase();
        return this.authorityBoosts[docType] || 0;
    }

    /**
     * Apply diversity penalty to avoid redundant results
     */
    applyDiversityPenalty(results) {
        if (results.length <= 1) return results;

        const diversified = [results[0]]; // Keep top result
        const seenContent = [this.getContentFingerprint(results[0])];

        for (let i = 1; i < results.length; i++) {
            const candidate = results[i];
            const fingerprint = this.getContentFingerprint(candidate);

            // Check similarity to already selected results
            let maxSimilarity = 0;
            for (const seen of seenContent) {
                const similarity = this.calculateFingerPrintSimilarity(fingerprint, seen);
                maxSimilarity = Math.max(maxSimilarity, similarity);
            }

            // Apply penalty for high similarity
            if (maxSimilarity > 0.7) {
                candidate.rerankedScore *= (1 - (maxSimilarity - 0.7) * 2);
            }

            diversified.push(candidate);
            seenContent.push(fingerprint);
        }

        // Re-sort after penalty
        return diversified.sort((a, b) => b.rerankedScore - a.rerankedScore);
    }

    /**
     * Get content fingerprint for diversity checking
     */
    getContentFingerprint(result) {
        const content = (result.content || result.input || '').substring(0, 500);
        return new Set(this.tokenize(content));
    }

    /**
     * Calculate similarity between fingerprints
     */
    calculateFingerPrintSimilarity(fp1, fp2) {
        const intersection = [...fp1].filter(x => fp2.has(x)).length;
        const union = new Set([...fp1, ...fp2]).size;
        return union > 0 ? intersection / union : 0;
    }
}

module.exports = ReRanker;
