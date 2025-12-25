/**
 * MultiHopRetriever - Multi-hop retrieval for complex queries
 *
 * Handles complex queries that require information from multiple sources
 * by decomposing queries and iteratively retrieving related context.
 */

class MultiHopRetriever {
    constructor(options = {}) {
        this.maxHops = options.maxHops || 2; // Max retrieval iterations
        this.minConfidence = options.minConfidence || 0.3;
        this.expansionFactor = options.expansionFactor || 1.5;
    }

    /**
     * Detect if query needs multi-hop retrieval
     */
    needsMultiHop(query) {
        const complexIndicators = [
            /\band\b.*\band\b/i,  // Multiple "and"s
            /compare|versus|vs\b|difference between/i,  // Comparisons
            /how.*then|first.*then/i,  // Sequential steps
            /relationship between|connection|related to/i,  // Relationships
            /why.*and.*how/i,  // Multiple question types
            /all.*about|everything.*about/i,  // Comprehensive queries
            /step.?by.?step|walkthrough|tutorial/i  // Detailed explanations
        ];

        return complexIndicators.some(pattern => pattern.test(query));
    }

    /**
     * Decompose complex query into sub-queries
     */
    decomposeQuery(query) {
        const subQueries = [query]; // Always include original

        // Split on conjunctions
        const conjunctionSplit = query.split(/\s+(?:and|or|but|then)\s+/i);
        if (conjunctionSplit.length > 1) {
            subQueries.push(...conjunctionSplit.filter(q => q.length > 10));
        }

        // Handle comparison queries
        const comparisonMatch = query.match(/(.+?)\s+(?:vs\.?|versus|compared? to)\s+(.+)/i);
        if (comparisonMatch) {
            subQueries.push(comparisonMatch[1].trim());
            subQueries.push(comparisonMatch[2].trim());
        }

        // Handle "how to X and Y" queries
        const howToMatch = query.match(/how\s+to\s+(.+)\s+and\s+(.+)/i);
        if (howToMatch) {
            subQueries.push(`how to ${howToMatch[1]}`);
            subQueries.push(`how to ${howToMatch[2]}`);
        }

        // Extract entities/concepts for follow-up queries
        const concepts = this.extractConcepts(query);
        for (const concept of concepts.slice(0, 2)) {
            subQueries.push(`what is ${concept}`);
        }

        // Deduplicate and limit
        const unique = [...new Set(subQueries)];
        return unique.slice(0, 4);
    }

    /**
     * Extract key concepts from query
     */
    extractConcepts(query) {
        // Look for technical terms (often capitalized or hyphenated)
        const technicalTerms = query.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b|\b\w+-\w+\b/g) || [];

        // Look for quoted terms
        const quotedTerms = query.match(/"([^"]+)"|'([^']+)'/g) || [];

        // Look for known concept patterns
        const conceptPatterns = [
            /\b(?:using|with)\s+(\w+(?:\s+\w+)?)/gi,
            /\b(?:in|for)\s+(\w+(?:\s+\w+)?)/gi
        ];

        const concepts = [...technicalTerms, ...quotedTerms.map(q => q.replace(/['"]/g, ''))];

        for (const pattern of conceptPatterns) {
            let match;
            while ((match = pattern.exec(query)) !== null) {
                if (match[1] && match[1].length > 3) {
                    concepts.push(match[1]);
                }
            }
        }

        return [...new Set(concepts)].slice(0, 3);
    }

    /**
     * Perform multi-hop retrieval
     * @param {string} query - Original query
     * @param {Function} searchFn - Search function(query, k) => results
     * @param {number} k - Base number of results per hop
     * @returns {Array} Aggregated and deduplicated results
     */
    async retrieve(query, searchFn, k = 5) {
        const allResults = new Map(); // id -> result (for deduplication)
        const seenContent = new Set();

        // Hop 1: Initial retrieval with original query
        const initialResults = await searchFn(query, k);
        this.addResults(allResults, seenContent, initialResults, 1.0);

        // Check if multi-hop is needed
        if (!this.needsMultiHop(query)) {
            return Array.from(allResults.values());
        }

        console.log(`[MultiHop] Complex query detected, performing multi-hop retrieval...`);

        // Decompose query
        const subQueries = this.decomposeQuery(query);
        console.log(`[MultiHop] Decomposed into ${subQueries.length} sub-queries`);

        // Hop 2+: Retrieve for each sub-query
        for (let hop = 0; hop < Math.min(this.maxHops, subQueries.length - 1); hop++) {
            const subQuery = subQueries[hop + 1]; // Skip original (already done)
            if (!subQuery) continue;

            const subResults = await searchFn(subQuery, Math.ceil(k / 2));

            // Apply decay factor for later hops
            const decayFactor = Math.pow(0.8, hop + 1);
            this.addResults(allResults, seenContent, subResults, decayFactor);
        }

        // Extract follow-up concepts from top results
        const topResults = Array.from(allResults.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        const followUpConcepts = this.extractFollowUpConcepts(query, topResults);

        // Hop 3: Follow-up on discovered concepts (if any)
        for (const concept of followUpConcepts.slice(0, 2)) {
            const followUpResults = await searchFn(concept, 2);
            this.addResults(allResults, seenContent, followUpResults, 0.6);
        }

        // Sort all results by score and return
        return Array.from(allResults.values())
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Add results to aggregation map with deduplication
     */
    addResults(allResults, seenContent, results, scoreFactor) {
        for (const result of results) {
            const id = result.id || result.source;
            const content = (result.content || '').substring(0, 200);
            const contentHash = this.hashContent(content);

            // Skip if we've seen very similar content
            if (seenContent.has(contentHash)) continue;
            seenContent.add(contentHash);

            const adjustedScore = (result.score || result.similarity || 0) * scoreFactor;

            if (allResults.has(id)) {
                // Boost existing result
                const existing = allResults.get(id);
                existing.score = Math.max(existing.score, adjustedScore);
                existing.hopCount = (existing.hopCount || 1) + 1;
            } else {
                allResults.set(id, {
                    ...result,
                    score: adjustedScore,
                    hopCount: 1
                });
            }
        }
    }

    /**
     * Simple content hash for deduplication
     */
    hashContent(content) {
        const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
        // Simple hash based on first and last 50 chars + length
        const prefix = normalized.substring(0, 50);
        const suffix = normalized.substring(normalized.length - 50);
        return `${prefix}|${suffix}|${normalized.length}`;
    }

    /**
     * Extract concepts from results for follow-up queries
     */
    extractFollowUpConcepts(originalQuery, results) {
        const queryTerms = new Set(
            originalQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );

        const conceptCounts = new Map();

        for (const result of results) {
            const content = result.content || '';

            // Find technical terms not in original query
            const technicalTerms = content.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) || [];
            const hyphenated = content.match(/\b\w+-\w+(-\w+)?\b/g) || [];

            for (const term of [...technicalTerms, ...hyphenated]) {
                const lower = term.toLowerCase();
                if (!queryTerms.has(lower) && lower.length > 4) {
                    conceptCounts.set(term, (conceptCounts.get(term) || 0) + 1);
                }
            }
        }

        // Return most common concepts
        return Array.from(conceptCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([term]) => term);
    }
}

module.exports = MultiHopRetriever;
