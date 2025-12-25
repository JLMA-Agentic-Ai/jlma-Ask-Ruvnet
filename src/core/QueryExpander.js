/**
 * QueryExpander - Expands queries with synonyms and reformulations
 *
 * Improves retrieval by generating multiple query variants that capture
 * different ways users might express the same concept.
 */

class QueryExpander {
    constructor() {
        // Domain-specific synonyms for AI/coding topics
        this.synonymMap = new Map([
            // Programming concepts
            ['function', ['method', 'procedure', 'routine', 'func']],
            ['variable', ['var', 'parameter', 'argument', 'value']],
            ['array', ['list', 'collection', 'vector']],
            ['object', ['instance', 'entity', 'class instance']],
            ['loop', ['iteration', 'cycle', 'repeat']],
            ['error', ['bug', 'issue', 'problem', 'exception', 'failure']],
            ['fix', ['solve', 'resolve', 'repair', 'debug', 'patch']],
            ['create', ['make', 'build', 'generate', 'initialize', 'instantiate']],
            ['delete', ['remove', 'destroy', 'drop', 'clear']],
            ['update', ['modify', 'change', 'edit', 'alter']],

            // AI/ML concepts
            ['model', ['neural network', 'algorithm', 'classifier']],
            ['train', ['fine-tune', 'learn', 'fit']],
            ['inference', ['prediction', 'output', 'forward pass']],
            ['embedding', ['vector', 'representation', 'encoding']],
            ['llm', ['large language model', 'gpt', 'claude', 'language model']],
            ['prompt', ['instruction', 'query', 'input']],
            ['rag', ['retrieval augmented generation', 'knowledge retrieval']],
            ['agent', ['autonomous agent', 'ai agent', 'assistant']],

            // Agentic/Claude specific
            ['agentic', ['autonomous', 'agent-based', 'self-directed']],
            ['claude', ['anthropic', 'claude ai', 'assistant']],
            ['mcp', ['model context protocol', 'context protocol']],
            ['sparc', ['specification', 'pseudocode', 'refinement']],
            ['ruvector', ['vector database', 'vector store', 'embedding store']],

            // Commands/Tools
            ['npm', ['node package manager', 'package manager']],
            ['git', ['version control', 'source control', 'repository']],
            ['docker', ['container', 'containerization']],
            ['api', ['endpoint', 'interface', 'service']],
            ['cli', ['command line', 'terminal', 'shell']],

            // Actions
            ['install', ['setup', 'configure', 'add']],
            ['run', ['execute', 'start', 'launch']],
            ['deploy', ['publish', 'release', 'ship']],
            ['test', ['verify', 'check', 'validate']],

            // Questions
            ['how', ['what way', 'method to', 'steps to']],
            ['why', ['reason', 'cause', 'explanation']],
            ['what', ['which', 'explain', 'describe']]
        ]);

        // Query reformulation patterns
        this.reformulationPatterns = [
            // Convert questions to statements
            { pattern: /^how (?:do|can|to) (.+)\?*$/i, replacement: '$1 tutorial' },
            { pattern: /^what is (.+)\?*$/i, replacement: '$1 definition explanation' },
            { pattern: /^why (.+)\?*$/i, replacement: '$1 reason cause' },
            { pattern: /^where (.+)\?*$/i, replacement: '$1 location find' },

            // Add context keywords
            { pattern: /^(.+) not working$/i, replacement: '$1 error fix troubleshoot' },
            { pattern: /^(.+) example$/i, replacement: '$1 code sample demonstration' },
            { pattern: /^(.+) best practice$/i, replacement: '$1 recommended approach pattern' }
        ];
    }

    /**
     * Expand a query into multiple variants
     * @param {string} query - Original query
     * @returns {Array<string>} Array of expanded queries
     */
    expand(query) {
        if (!query || typeof query !== 'string') {
            return [query || ''];
        }

        const expandedQueries = new Set([query]); // Always include original

        // 1. Apply synonym expansion
        const synonymExpanded = this.applySynonyms(query);
        synonymExpanded.forEach(q => expandedQueries.add(q));

        // 2. Apply reformulation patterns
        const reformulated = this.applyReformulations(query);
        reformulated.forEach(q => expandedQueries.add(q));

        // 3. Extract key concepts for focused search
        const concepts = this.extractKeyConcepts(query);
        if (concepts.length > 0) {
            expandedQueries.add(concepts.join(' '));
        }

        return Array.from(expandedQueries).slice(0, 5); // Limit to 5 variants
    }

    /**
     * Apply synonym replacements to query
     */
    applySynonyms(query) {
        const words = query.toLowerCase().split(/\s+/);
        const expanded = [];

        for (const word of words) {
            const synonyms = this.synonymMap.get(word);
            if (synonyms) {
                // Create variant with first synonym
                const variant = query.toLowerCase().replace(
                    new RegExp(`\\b${word}\\b`, 'gi'),
                    synonyms[0]
                );
                expanded.push(variant);
            }
        }

        return expanded;
    }

    /**
     * Apply reformulation patterns
     */
    applyReformulations(query) {
        const reformulated = [];

        for (const { pattern, replacement } of this.reformulationPatterns) {
            if (pattern.test(query)) {
                const variant = query.replace(pattern, replacement);
                if (variant !== query) {
                    reformulated.push(variant);
                }
            }
        }

        return reformulated;
    }

    /**
     * Extract key concepts from query
     */
    extractKeyConcepts(query) {
        // Remove common words and extract meaningful terms
        const stopwords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she',
            'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
            'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when',
            'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
            'most', 'some', 'any', 'no', 'not', 'only', 'same', 'so', 'than',
            'too', 'very', 'just', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again', 'further',
            'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
            'me', 'him', 'her', 'us', 'them', 'please', 'thanks', 'thank'
        ]);

        const words = query.toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopwords.has(w));

        return words;
    }

    /**
     * Detect query complexity (used for adaptive k)
     * @returns {string} 'simple' | 'moderate' | 'complex'
     */
    detectComplexity(query) {
        const words = query.split(/\s+/).length;
        const hasMultipleConcepts = (query.match(/\band\b|\bor\b|\bwith\b|\busing\b/gi) || []).length > 0;
        const hasComparison = /\bvs\b|\bversus\b|\bcompare\b|\bdifference\b/i.test(query);
        const isHowTo = /^how\s+(do|can|to|should)/i.test(query);

        if (hasComparison || (hasMultipleConcepts && words > 10)) {
            return 'complex';
        } else if (isHowTo || words > 6) {
            return 'moderate';
        }
        return 'simple';
    }

    /**
     * Get recommended k value based on query complexity
     */
    getRecommendedK(query) {
        const complexity = this.detectComplexity(query);
        switch (complexity) {
            case 'complex': return 12;
            case 'moderate': return 8;
            default: return 5;
        }
    }
}

module.exports = QueryExpander;
