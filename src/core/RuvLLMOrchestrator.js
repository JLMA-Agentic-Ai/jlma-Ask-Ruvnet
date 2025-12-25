/**
 * RuvLLMOrchestrator - Self-Learning LLM Orchestration with RuvLLM
 *
 * Integrates @ruvector/ruvllm for intelligent LLM routing and self-learning:
 * - SONA (Self-Optimizing Neural Architecture) with 3 temporal learning loops
 * - TRM (Tiny Recursive Models) for parameter-efficient reasoning
 * - FastGRNN routing for intelligent model selection
 * - HNSW memory for adaptive context retrieval
 * - MicroLoRA for per-request adaptation
 */

require('dotenv').config();

class RuvLLMOrchestrator {
    constructor(options = {}) {
        this.ruvllm = null;
        this.sona = null;
        this.trm = null;
        this.isInitialized = false;
        this.learningEnabled = options.learningEnabled !== false;
        this.useRecursiveReasoning = options.useRecursiveReasoning !== false;
        this.fallbackLLM = options.fallbackLLM || 'groq'; // groq, openai, gemini

        // Learning stats
        this.stats = {
            queriesProcessed: 0,
            patternsLearned: 0,
            routingDecisions: 0,
            avgLatency: 0
        };
    }

    async initialize() {
        console.log('[RuvLLMOrchestrator] 🧠 Initializing Self-Learning LLM System...');

        try {
            // Import RuvLLM
            const ruvllm = await import('@ruvector/ruvllm');

            // Initialize SONA (Self-Optimizing Neural Architecture)
            if (ruvllm.SONA) {
                this.sona = new ruvllm.SONA({
                    learningRate: 0.01,
                    microLoraRank: 2, // Per-request adaptation
                    ewcLambda: 2000, // Prevent catastrophic forgetting
                    enableLoopA: true, // Instant learning (per-request)
                    enableLoopB: true, // Background learning (hourly)
                    enableLoopC: false // Weekly deep learning (disabled for production)
                });
                console.log('[RuvLLMOrchestrator] ✅ SONA initialized (3-tier temporal learning)');
            }

            // Initialize TRM (Tiny Recursive Models) if available
            if (ruvllm.TRM && this.useRecursiveReasoning) {
                this.trm = new ruvllm.TRM({
                    maxIterations: 5, // K recursive refinements
                    confidenceThreshold: 0.85, // Early stopping
                    adaptiveK: true, // SONA-driven iteration count
                    nanSafe: true // Production stability
                });
                console.log('[RuvLLMOrchestrator] ✅ TRM initialized (7M param recursive reasoning)');
            }

            // Initialize main RuvLLM orchestrator
            if (ruvllm.RuvLLM) {
                this.ruvllm = new ruvllm.RuvLLM({
                    sona: this.sona,
                    trm: this.trm,
                    memoryCapacity: 10000, // HNSW memory nodes
                    routerModel: 'fastgrnn' // Intelligent routing
                });
            } else if (ruvllm.default) {
                this.ruvllm = ruvllm.default;
            }

            this.isInitialized = true;
            console.log('[RuvLLMOrchestrator] ✅ RuvLLM Orchestrator ready');
            console.log('[RuvLLMOrchestrator] Features: SONA learning, TRM reasoning, FastGRNN routing');

            return true;
        } catch (error) {
            console.warn('[RuvLLMOrchestrator] ⚠️ RuvLLM not available, using fallback mode');
            console.warn('[RuvLLMOrchestrator] Error:', error.message);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Process a query with intelligent routing and learning
     */
    async process(query, context, options = {}) {
        const startTime = Date.now();
        this.stats.queriesProcessed++;

        try {
            if (this.isInitialized && this.ruvllm) {
                // Use RuvLLM's intelligent processing
                const result = await this.processWithRuvLLM(query, context, options);
                this.updateStats(Date.now() - startTime);
                return result;
            } else {
                // Fallback to standard processing
                return await this.processFallback(query, context, options);
            }
        } catch (error) {
            console.error('[RuvLLMOrchestrator] Processing error:', error.message);
            return await this.processFallback(query, context, options);
        }
    }

    /**
     * Process with RuvLLM's full capabilities
     */
    async processWithRuvLLM(query, context, options) {
        // Step 1: Record trajectory for learning
        const trajectory = {
            query: query,
            context: context.substring(0, 1000),
            timestamp: Date.now()
        };

        // Step 2: Get routing decision
        let routingDecision = null;
        if (this.ruvllm.route) {
            routingDecision = await this.ruvllm.route(query, context);
            this.stats.routingDecisions++;
        }

        // Step 3: Apply TRM recursive reasoning if complex query
        let refinedQuery = query;
        if (this.trm && this.isComplexQuery(query)) {
            const trmResult = await this.trm.refine({
                question: query,
                context: context.substring(0, 2000)
            });
            refinedQuery = trmResult.refinedQuery || query;
            console.log(`[RuvLLMOrchestrator] TRM refined query (${trmResult.iterations} iterations)`);
        }

        // Step 4: Generate response using routed model
        const response = await this.generateResponse(refinedQuery, context, routingDecision, options);

        // Step 5: Learn from interaction (if enabled)
        if (this.learningEnabled && this.sona) {
            await this.sona.learn({
                ...trajectory,
                response: response.substring(0, 500),
                success: true
            });
            this.stats.patternsLearned++;
        }

        return response;
    }

    /**
     * Fallback processing without RuvLLM
     */
    async processFallback(query, context, options) {
        // Use standard LLM processing
        return {
            response: null, // Signals to use external LLM
            useExternal: true,
            query: query,
            context: context
        };
    }

    /**
     * Generate response using the appropriate LLM backend
     */
    async generateResponse(query, context, routingDecision, options) {
        // If RuvLLM provides a response, use it
        if (this.ruvllm && this.ruvllm.generate) {
            try {
                const result = await this.ruvllm.generate({
                    query: query,
                    context: context,
                    routing: routingDecision,
                    maxTokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7
                });
                return result.text || result.response || result;
            } catch (error) {
                console.warn('[RuvLLMOrchestrator] Generation fallback:', error.message);
            }
        }

        // Return null to signal external LLM should be used
        return null;
    }

    /**
     * Detect complex queries that benefit from TRM
     */
    isComplexQuery(query) {
        const complexIndicators = [
            /step.?by.?step|walkthrough/i,
            /explain.*how|how.*work/i,
            /compare.*and|difference between/i,
            /why.*and.*how/i,
            /analyze|evaluate|assess/i,
            /relationship between|connection/i
        ];

        return complexIndicators.some(pattern => pattern.test(query));
    }

    /**
     * Enhance context using SONA memory retrieval
     */
    async enhanceContext(query, baseContext) {
        if (!this.isInitialized || !this.sona) {
            return baseContext;
        }

        try {
            // Retrieve relevant patterns from SONA memory
            const memoryResults = await this.sona.retrieve({
                query: query,
                k: 3
            });

            if (memoryResults && memoryResults.length > 0) {
                const memoryContext = memoryResults
                    .map(r => r.pattern || r.content)
                    .filter(Boolean)
                    .join('\n\n');

                if (memoryContext) {
                    return `${baseContext}\n\n[Learned Patterns]\n${memoryContext}`;
                }
            }
        } catch (error) {
            // Silent fail - memory enhancement is optional
        }

        return baseContext;
    }

    /**
     * Get optimal parameters based on query characteristics
     */
    getOptimalParams(query, context) {
        // Use routing intelligence if available
        if (this.ruvllm && this.ruvllm.suggestParams) {
            return this.ruvllm.suggestParams(query, context);
        }

        // Default intelligent params based on query analysis
        const isFactual = /what is|who is|when|where|define/i.test(query);
        const isCreative = /write|create|generate|suggest/i.test(query);
        const isAnalytical = /analyze|compare|evaluate|explain why/i.test(query);

        return {
            temperature: isFactual ? 0.3 : isCreative ? 0.8 : 0.6,
            maxTokens: isAnalytical ? 2048 : 1024,
            topP: isFactual ? 0.9 : 0.95
        };
    }

    /**
     * Record feedback for learning
     */
    async recordFeedback(queryId, feedback) {
        if (!this.learningEnabled || !this.sona) return;

        try {
            await this.sona.feedback({
                queryId: queryId,
                score: feedback.score || (feedback.positive ? 1.0 : 0.0),
                type: feedback.type || 'user'
            });
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Update performance stats
     */
    updateStats(latency) {
        const alpha = 0.1; // Exponential moving average factor
        this.stats.avgLatency = this.stats.avgLatency * (1 - alpha) + latency * alpha;
    }

    /**
     * Get orchestrator statistics
     */
    getStats() {
        return {
            ...this.stats,
            isInitialized: this.isInitialized,
            learningEnabled: this.learningEnabled,
            recursiveReasoningEnabled: this.useRecursiveReasoning,
            features: {
                sona: this.sona !== null,
                trm: this.trm !== null,
                ruvllm: this.ruvllm !== null
            }
        };
    }

    /**
     * Export learned patterns for federation
     */
    async exportPatterns() {
        if (!this.sona) return null;

        try {
            return await this.sona.export();
        } catch (error) {
            return null;
        }
    }

    /**
     * Import patterns from federated learning
     */
    async importPatterns(patterns) {
        if (!this.sona || !patterns) return false;

        try {
            await this.sona.import(patterns);
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = RuvLLMOrchestrator;
