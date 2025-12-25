const express = require('express');
process.env.FORCE_TRANSFORMERS = 'true';
const bodyParser = require('body-parser');
const RuvectorStore = require('../core/RuvectorStore');
const NativeRuvectorStore = require('../core/NativeRuvectorStore');
const RuvLLMOrchestrator = require('../core/RuvLLMOrchestrator');
const HybridSearch = require('../core/HybridSearch');
const TextChunker = require('../core/TextChunker');
const QueryExpander = require('../core/QueryExpander');
const ReRanker = require('../core/ReRanker');
const ContextCompressor = require('../core/ContextCompressor');
const MultiHopRetriever = require('../core/MultiHopRetriever');
const { OpenAI } = require('openai');
const path = require('path');
// const repoMonitor = require('./RepoMonitor');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ============================================================================
// RUVECTOR + RUVLLM CONFIGURATION
// ============================================================================
const USE_NATIVE_RUVECTOR = process.env.USE_NATIVE_RUVECTOR !== 'false'; // Default: true
const USE_RUVLLM = process.env.USE_RUVLLM !== 'false'; // Default: true

// Initialize RuvLLM Orchestrator for self-learning LLM capabilities
let ruvLLMOrchestrator = null;

// ============================================================================
// OPTIMIZED: Initialize all RAG enhancement modules
// ============================================================================
let hybridSearch = null;
const textChunker = new TextChunker({ chunkSize: 2000, overlap: 200 });
const queryExpander = new QueryExpander();
const reRanker = new ReRanker({
    semanticWeight: 0.35,
    keywordWeight: 0.25,
    alignmentWeight: 0.20,
    recencyWeight: 0.10,
    diversityWeight: 0.10
});
const contextCompressor = new ContextCompressor({
    maxContextLength: 16000,  // Increased for more context
    maxPerSource: 4000,
    preserveCode: true
});
const multiHopRetriever = new MultiHopRetriever({
    maxHops: 2,
    minConfidence: 0.3
});

// ============================================================================
// OPTIMIZED: Diversity Filter to avoid redundant context from similar sources
// ============================================================================
function applyDiversityFilter(sources, maxSources = 6) {
    if (sources.length <= maxSources) return sources;

    const diverse = [];
    const seenPrefixes = new Set();

    for (const source of sources) {
        // Extract source prefix (e.g., video name, repo name) for diversity check
        const sourceId = source.source || source.id || '';
        const prefix = sourceId.split('/').slice(0, 2).join('/'); // First 2 path segments

        // Calculate content fingerprint using first 200 chars
        const contentFingerprint = (source.content || '').substring(0, 200).toLowerCase().replace(/\s+/g, ' ');

        // Check if we already have very similar content
        let isDuplicate = false;
        for (const existing of diverse) {
            const existingFingerprint = (existing.content || '').substring(0, 200).toLowerCase().replace(/\s+/g, ' ');
            const similarity = calculateJaccardSimilarity(contentFingerprint, existingFingerprint);
            if (similarity > 0.7) {
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate) {
            diverse.push(source);
            seenPrefixes.add(prefix);
        }

        if (diverse.length >= maxSources) break;
    }

    return diverse;
}

// Simple Jaccard similarity for content deduplication
function calculateJaccardSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 3));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
const fs = require('fs');
app.use(express.static(path.join(__dirname, '../ui/dist'))); // Serve frontend
app.use('/frames', express.static(path.join(__dirname, '../../data_ingestion_ruv_coaching'))); // Serve video frames

// Initialize Agentic Flow Components
let modelRouter;
let reasoningBank;
let nativeVectorStore = null; // NEW: Native RuVector store

async function initAgenticFlow() {
    try {
        // ================================================================
        // PRIORITY: Initialize Native RuVector Store (if enabled)
        // ================================================================
        if (USE_NATIVE_RUVECTOR) {
            console.log('🚀 Initializing Native RuVector Store...');
            nativeVectorStore = new NativeRuvectorStore({
                dimensions: 384,  // MiniLM-L6-v2
                maxElements: 200000,
                storagePath: path.resolve(__dirname, '../../data/ruvector.db')
            });

            try {
                await nativeVectorStore.initialize();
                const stats = await nativeVectorStore.getStats();
                console.log('✅ Native RuVector Store initialized');
                console.log(`   Backend: ${stats.backend}`);
                console.log(`   Documents: ${stats.documentCount}`);
            } catch (ruvectorError) {
                console.warn('⚠️ Native RuVector failed, falling back to SQLite:', ruvectorError.message);
                nativeVectorStore = null;
            }
        }

        // Dynamic imports for ESM modules (fallback)
        const routerModule = await import('agentic-flow/router');
        const bankModule = await import('agentic-flow/reasoningbank');

        modelRouter = new routerModule.ModelRouter();

        // Initialize module to run DB migrations
        if (typeof bankModule.initialize === 'function') {
            await bankModule.initialize();
        }

        const { HybridReasoningBank } = bankModule;
        reasoningBank = new HybridReasoningBank({ preferWasm: false });

        console.log('✅ Agentic Flow Initialized (Router + HybridReasoningBank - fallback)');

        // ================================================================
        // Initialize RuvLLM Orchestrator for self-learning capabilities
        // ================================================================
        if (USE_RUVLLM) {
            console.log('🧠 Initializing RuvLLM Orchestrator...');
            ruvLLMOrchestrator = new RuvLLMOrchestrator({
                learningEnabled: true,
                useRecursiveReasoning: true,
                fallbackLLM: 'groq'
            });
            const ruvllmInitialized = await ruvLLMOrchestrator.initialize();
            if (ruvllmInitialized) {
                console.log('✅ RuvLLM Orchestrator ready (SONA + TRM enabled)');
            } else {
                console.log('⚠️ RuvLLM not available, using standard LLM pipeline');
            }
        }

        // OPTIMIZED: Initialize hybrid search index for BM25 + semantic fusion
        await initHybridSearchIndex();
    } catch (error) {
        console.error('❌ Failed to initialize Agentic Flow:', error);
        // Fallback to OpenAI if Agentic Flow fails to initialize
        // This part is not in the instruction, but good for robustness
        // const openai = new OpenAI({
        //     apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
        //     baseURL: process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined
        // });
        // modelRouter = { chat: async ({ messages, model }) => {
        //     const response = await openai.chat.completions.create({
        //         model: model === 'auto' ? (process.env.GROQ_API_KEY ? 'llama3-70b-8192' : 'gpt-4o') : model,
        //         messages: messages,
        //         temperature: 0.3,
        //         max_tokens: 4096
        //     });
        //     return { content: response.choices[0].message.content };
        // }};
        // console.warn('⚠️ Falling back to direct OpenAI calls due to Agentic Flow initialization failure.');
    }
}

// ============================================================================
// OPTIMIZED: Initialize BM25 hybrid search index from existing knowledge base
// ============================================================================
async function initHybridSearchIndex() {
    try {
        if (!reasoningBank || !reasoningBank.reflexion) {
            console.log('⚠️ ReasoningBank not ready, skipping hybrid search initialization');
            return;
        }

        hybridSearch = new HybridSearch({
            semanticWeight: 0.55,  // 55% weight for semantic (embedding) search
            bm25Weight: 0.45       // 45% weight for keyword (BM25) search
        });

        // OPTIMIZED: Fetch ALL documents for comprehensive keyword index
        // Using multiple queries to get broader coverage
        console.log('🔍 Building comprehensive BM25 hybrid search index...');

        const allDocuments = new Map();

        // Query 1: Empty query for recent/random docs
        const batch1 = await reasoningBank.reflexion.retrieveRelevant({ task: '', k: 2000 });
        batch1.forEach(r => allDocuments.set(r.id, r));

        // Query 2: Common technical terms
        const technicalQueries = ['code', 'function', 'api', 'install', 'config'];
        for (const term of technicalQueries) {
            try {
                const batch = await reasoningBank.reflexion.retrieveRelevant({ task: term, k: 500 });
                batch.forEach(r => allDocuments.set(r.id, r));
            } catch (e) {
                // Continue on individual query failures
            }
        }

        if (allDocuments.size > 0) {
            const documents = Array.from(allDocuments.values()).map(r => ({
                id: r.metadata?.docId || r.id,
                content: r.input || r.task || '',
                metadata: r.metadata,
                source: r.metadata?.source
            }));

            hybridSearch.buildIndex(documents);
            console.log(`✅ Hybrid search initialized with ${documents.length} documents (comprehensive index)`);
        } else {
            console.log('⚠️ No documents found for hybrid search index');
        }
    } catch (error) {
        console.error('❌ Failed to initialize hybrid search:', error.message);
        hybridSearch = null;  // Fall back to pure semantic search
    }
}

initAgenticFlow();

// Response cache for common queries (removed as per instruction, but keeping for context if needed later)
// const responseCache = new Map();
// const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// function getCacheKey(message) {
//     return message.toLowerCase().trim();
// }

// function getCachedResponse(message) {
//     const key = getCacheKey(message);
//     const cached = responseCache.get(key);
//     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
//         console.log('[Cache] Hit:', key);
//         return cached.response;
//     }
//     return null;
// }

// function setCachedResponse(message, response) {
//     const key = getCacheKey(message);
//     responseCache.set(key, { response, timestamp: Date.now() });
//     console.log('[Cache] Set:', key);
// }

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    console.log(`[Chat] Received: ${message}`);

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
        console.error('❌ GROQ_API_KEY is missing!');
        return res.status(500).json({ error: 'Server configuration error: GROQ_API_KEY missing' });
    }

    try {
        // Check cache first for instant responses (removed as per instruction)
        // const cachedResponse = getCachedResponse(message);
        // if (cachedResponse) {
        //     return res.json(cachedResponse);
        console.log('Received chat request:', message);

        // 1. Retrieve Context - PRIORITY: Native RuVector, fallback to ReasoningBank
        let context = "";
        let sources = [];

        // Determine which backend to use
        const useNativeBackend = nativeVectorStore && nativeVectorStore.isInitialized;
        const useFallbackBackend = reasoningBank && reasoningBank.reflexion;

        if (useNativeBackend || useFallbackBackend) {
            console.log(`Searching ${useNativeBackend ? '🚀 Native RuVector' : '📦 ReasoningBank (fallback)'} for: "${message}"`);
            try {
                // ================================================================
                // STAGE 1: Query Expansion - Generate multiple query variants
                // ================================================================
                const expandedQueries = queryExpander.expand(message);
                const adaptiveK = queryExpander.getRecommendedK(message);
                console.log(`📝 Query expanded to ${expandedQueries.length} variants, adaptive k=${adaptiveK}`);

                // ================================================================
                // STAGE 2: Define search function for retrieval
                // PRIORITY: Use Native RuVector if available
                // ================================================================
                const semanticSearchFn = async (query, k) => {
                    if (useNativeBackend) {
                        // Use Native RuVector - 1000x faster with HNSW
                        console.log('⚡ Using Native RuVector HNSW search');
                        const results = await nativeVectorStore.search(query, k);
                        return results.map(r => ({
                            id: r.id,
                            content: r.content || '',
                            score: r.score || 0,
                            similarity: r.score || 0,
                            source: r.metadata?.source,
                            metadata: r.metadata,
                            timestamp: r.metadata?.timestamp
                        }));
                    } else {
                        // Fallback to ReasoningBank
                        const semanticResults = await reasoningBank.reflexion.retrieveRelevant({
                            task: query,
                            k: k
                        });
                        return semanticResults.map(r => ({
                            id: r.metadata?.docId || r.id,
                            content: r.input || r.task || '',
                            score: r.similarity || 0,
                            similarity: r.similarity || 0,
                            source: r.metadata?.source,
                            metadata: r.metadata,
                            timestamp: r.metadata?.timestamp
                        }));
                    }
                };

                // ================================================================
                // STAGE 3: Multi-hop retrieval for complex queries
                // ================================================================
                let allResults = [];

                if (multiHopRetriever.needsMultiHop(message)) {
                    console.log('🔄 Complex query detected - using multi-hop retrieval...');
                    if (hybridSearch) {
                        allResults = await multiHopRetriever.retrieve(
                            message,
                            async (q, k) => await hybridSearch.hybridSearch(q, semanticSearchFn, k),
                            adaptiveK
                        );
                    } else {
                        allResults = await multiHopRetriever.retrieve(message, semanticSearchFn, adaptiveK);
                    }
                } else {
                    // Standard retrieval with query expansion
                    const resultsMap = new Map();

                    for (const query of expandedQueries) {
                        let queryResults;
                        if (hybridSearch) {
                            console.log('🔀 Using hybrid search (semantic + BM25)...');
                            queryResults = await hybridSearch.hybridSearch(query, semanticSearchFn, adaptiveK);
                        } else {
                            console.log('🔍 Using semantic search only...');
                            queryResults = await semanticSearchFn(query, adaptiveK);
                        }

                        // Aggregate results (boost for appearing in multiple query variants)
                        for (const result of queryResults) {
                            const id = result.id;
                            if (resultsMap.has(id)) {
                                const existing = resultsMap.get(id);
                                existing.score = Math.max(existing.score, result.score) + 0.05; // Small boost for multiple matches
                                existing.queryMatches = (existing.queryMatches || 1) + 1;
                            } else {
                                resultsMap.set(id, { ...result, queryMatches: 1 });
                            }
                        }
                    }

                    allResults = Array.from(resultsMap.values());
                }

                console.log(`Retrieved ${allResults.length} total results from search`);

                // ================================================================
                // STAGE 4: Re-ranking with cross-encoder style scoring
                // ================================================================
                const rerankedResults = reRanker.rerank(message, allResults, { maxResults: 12 });
                console.log(`📊 Re-ranked to ${rerankedResults.length} results`);

                // ================================================================
                // STAGE 5: Apply similarity threshold
                // ================================================================
                const SIMILARITY_THRESHOLD = 0.15; // Lower threshold since re-ranker normalizes scores
                const filteredResults = rerankedResults.filter(r => (r.rerankedScore || r.score || 0) >= SIMILARITY_THRESHOLD);
                console.log(`After threshold filter (>=${SIMILARITY_THRESHOLD}): ${filteredResults.length} results`);

                // ================================================================
                // STAGE 6: Map to sources with full content
                // ================================================================
                sources = filteredResults.map(r => ({
                    id: r.id,
                    content: r.content || r.input || '',
                    score: r.rerankedScore || r.score || 0,
                    source: r.source || r.metadata?.source,
                    timestamp: r.timestamp || r.metadata?.timestamp,
                    scoreBreakdown: r.scoreBreakdown
                }));

                // ================================================================
                // STAGE 7: Diversity filter to avoid redundant content
                // ================================================================
                sources = applyDiversityFilter(sources, 8); // Keep top 8 diverse sources
                console.log(`After diversity filter: ${sources.length} sources`);

                // ================================================================
                // STAGE 8: Context compression for optimal LLM utilization
                // ================================================================
                context = contextCompressor.compress(sources, message);
                console.log(`📦 Context compressed to ${context.length} chars`);

                // ================================================================
                // STAGE 9: RuvLLM Context Enhancement (if available)
                // ================================================================
                if (ruvLLMOrchestrator && ruvLLMOrchestrator.isInitialized) {
                    try {
                        context = await ruvLLMOrchestrator.enhanceContext(message, context);
                        console.log(`🧠 Context enhanced with SONA learned patterns`);
                    } catch (enhanceErr) {
                        // Silent fail - enhancement is optional
                    }
                }

            } catch (err) {
                console.error('Error retrieving from ReasoningBank:', err);
                // Continue without context
            }
        } else {
            console.warn('ReasoningBank not initialized or reflexion memory unavailable.');
        }

        // 2. Construct System Prompt with RUV'S AUTHENTIC VOICE
        const { RUV_PERSONA } = require('./RuvPersona');
        console.log("Constructing system prompt with Ruv's authentic voice...");

        const systemPrompt = `${RUV_PERSONA}

===== KNOWLEDGE BASE CONTEXT =====
${context || 'No specific context retrieved for this query. Use your general knowledge and coaching style.'}

===== USER'S QUESTION =====
${message}

===== YOUR RESPONSE =====
Answer as Ruv would in a live coaching session. Be practical, show examples, and keep it real.`;

        // 3. Generate Response using Groq directly
        let answer = "";
        let errorMsg = null;
        try {
            console.log('Calling Groq API...');
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...(history || []),
                        { role: 'user', content: message }
                    ],
                    temperature: 0.3,
                    max_tokens: 4096
                })
            });

            console.log('Groq status:', response.status);
            const data = await response.json();
            console.log('Groq response:', JSON.stringify(data).substring(0, 200));

            if (data.choices && data.choices[0]) {
                answer = data.choices[0].message.content;
                console.log('✅ Got answer from Groq');

                // ================================================================
                // STAGE 10: RuvLLM Learning - Record successful interaction
                // ================================================================
                if (ruvLLMOrchestrator && ruvLLMOrchestrator.isInitialized) {
                    try {
                        // Let RuvLLM learn from this interaction for future improvement
                        await ruvLLMOrchestrator.process(message, context, {
                            response: answer,
                            success: true
                        });
                        console.log('🧠 RuvLLM: Interaction recorded for learning');
                    } catch (learnErr) {
                        // Silent fail - learning is optional
                    }
                }
            } else if (data.error) {
                throw new Error(`Groq error: ${data.error.message || JSON.stringify(data.error)} `);
            } else {
                throw new Error('No response from API: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error calling Groq:', error.message);
            answer = "I apologize, but I encountered an error generating a response. Please try again.";
            errorMsg = error.message;
        }

        const responseData = {
            answer,
            error: errorMsg,
            sources: sources.map(s => ({
                id: s.id,
                score: s.score,
                content: s.content
            }))
        };

        // Cache the response (Optional, Agentic Flow might handle this)
        // setCachedResponse(cacheKey, responseData);

        res.json(responseData);

    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health Check Endpoint
app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date(),
        version: '2.0.0-ruvector',
        checks: {
            server: 'ok',
            vectorStore: nativeVectorStore?.isInitialized ? 'native-ruvector' : (reasoningBank ? 'sqlite-fallback' : 'unknown'),
            ruvllm: ruvLLMOrchestrator?.isInitialized ? 'active' : 'fallback'
        },
        backend: {
            primary: nativeVectorStore?.isInitialized ? 'Native RuVector (HNSW)' : 'SQLite (agentic-flow)',
            ruvectorStats: nativeVectorStore ? await nativeVectorStore.getStats() : null,
            documentsIndexed: nativeVectorStore?.isInitialized ? await nativeVectorStore.count() : 'unknown'
        },
        features: {
            nativeRuvector: USE_NATIVE_RUVECTOR,
            nativeRuvectorActive: nativeVectorStore?.isInitialized || false,
            ruvllmEnabled: USE_RUVLLM,
            ruvllmStats: ruvLLMOrchestrator?.getStats() || null,
            ragPipeline: {
                queryExpansion: true,
                hybridSearch: hybridSearch !== null,
                multiHopRetrieval: true,
                reranking: true,
                contextCompression: true,
                sonaLearning: ruvLLMOrchestrator?.isInitialized || false
            }
        }
    };
    res.json(health);
});

// Debug Endpoint
app.get('/api/debug', (req, res) => {
    const cwd = process.cwd();
    const docsPath = path.join(cwd, 'data_ingestion_ruv_coaching/Other Documents');
    let docsFiles = [];
    let error = null;

    try {
        if (fs.existsSync(docsPath)) {
            docsFiles = fs.readdirSync(docsPath);
        } else {
            error = "Path does not exist";
        }
    } catch (e) {
        error = e.message;
    }

    res.json({
        cwd,
        docsPath,
        exists: fs.existsSync(docsPath),
        files: docsFiles,
        error
    });
});


// Chat Endpoint
app.post('/api/special', async (req, res) => {
    const { action, content } = req.body;
    console.log(`[Special] Action: ${action} `);

    try {
        let result = '';

        switch (action) {
            case 'simplify':
                // Use DeepSeek for simplification
                result = await openai.chat.completions.create({
                    model: "gpt-4o-mini", //  Cheaper, faster for simplification
                    messages: [{
                        role: "system",
                        content: "You are a master simplifier. Take complex technical content and explain it using everyday analogies and simple language. Use metaphors from daily life."
                    }, {
                        role: "user",
                        content: `Simplify this: \n\n${content} `
                    }]
                });
                break;

            case 'code':
                // Generate runnable code example
                result = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{
                        role: "system",
                        content: "You are a code generator. Given a concept, provide a minimal, runnable code example with comments. Use JavaScript/Node.js unless  otherwise specified."
                    }, {
                        role: "user",
                        content: `Show me code for: \n\n${content} `
                    }]
                });
                break;

            case 'diagram':
                // Generate Mermaid diagram
                result = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{
                        role: "system",
                        content: "You are a diagram expert. Create a Mermaid.js diagram to visualize the concept. Use flowcharts, sequence diagrams, or architecture diagrams as appropriate."
                    }, {
                        role: "user",
                        content: `Create a diagram for: \n\n${content} `
                    }]
                });
                break;

            default:
                result = { choices: [{ message: { content: "Unknown action" } }] };
        }

        res.json({ result: result.choices[0].message.content });

    } catch (error) {
        console.error('[Special] Error:', error);
        res.status(500).json({ error: 'Failed to process action' });
    }
});

// --- AGENTIC LEARNING LOOP ---
const { exec } = require('child_process');

function runAutoLearner() {
    console.log("🧠 Agentic Learner: Checking for new knowledge...");
    exec('node auto_updater.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Learner Error: ${error.message} `);
            return;
        }
        if (stdout.includes('Changes detected')) {
            console.log("🚀 Agentic Learner: Knowledge Base Updated!");
            // Ideally, we would reload the vector store here, but for now, 
            // the next request will pick up the new index files if they were saved.
        } else {
            console.log("💤 Agentic Learner: No new updates found.");
        }
    });
}

// Run Learner every 6 hours
setInterval(runAutoLearner, 6 * 60 * 60 * 1000);

// Manual Trigger Endpoint
app.post('/api/learn', (req, res) => {
    console.log("🧠 Manual Learning Triggered");
    runAutoLearner();
    res.json({ message: "Learning process started in background." });
});

// Serve Other Documents
app.use('/assets/docs', express.static(path.join(__dirname, '../../data_ingestion_ruv_coaching/Other Documents')));

// Knowledge Base Inventory Endpoint
app.get('/api/knowledge', (req, res) => {
    // Use process.cwd() since we run from project root
    const rootDir = process.cwd();
    const githubDir = path.join(rootDir, 'data_ingestion_github');
    const dataDir = path.join(rootDir, 'data');
    const docsDir = path.join(rootDir, 'data_ingestion_ruv_coaching/Other Documents');

    console.log(`🔍 Scanning Knowledge Base(Root: ${rootDir}): `);
    console.log(`   - GitHub Dir: ${githubDir} `);
    console.log(`   - Data Dir: ${dataDir} `);
    console.log(`   - Docs Dir: ${docsDir} `);

    const knowledge = {
        repos: [],
        websites: [],
        docs: [],
        lastUpdate: new Date().toISOString()
    };

    try {
        const repoFile = path.join(rootDir, 'scripts/ingestion/repo_knowledge.json');
        if (fs.existsSync(repoFile)) {
            console.log(`   - Loading Repos from: ${repoFile}`);
            const repoData = JSON.parse(fs.readFileSync(repoFile, 'utf8'));
            knowledge.repos = Array.isArray(repoData) ? repoData : [repoData];
        } else if (fs.existsSync(githubDir)) {
            const items = fs.readdirSync(githubDir);
            knowledge.repos = items.filter(file => {
                try {
                    return fs.statSync(path.join(githubDir, file)).isDirectory();
                } catch (e) { return false; }
            }).map(repo => ({
                name: repo,
                type: 'GitHub Repository',
                status: 'Live Sync 🟢',
                version: 'latest'
            }));
        }
    } catch (e) {
        console.error("Error reading Repo Knowledge:", e);
    }

    try {
        if (fs.existsSync(dataDir)) {
            const items = fs.readdirSync(dataDir);
            knowledge.websites = items.filter(file => {
                return file.endsWith('.txt') || file.endsWith('.md');
            }).map(file => ({
                name: file.replace(/_/g, ' ').replace('.txt', '').replace('.md', ''),
                file: file,
                type: 'Documentation',
                status: 'Indexed 🟢'
            }));
        }
    } catch (e) {
        console.error("Error reading Data dir:", e);
    }

    try {
        if (fs.existsSync(docsDir)) {
            const items = fs.readdirSync(docsDir);
            knowledge.docs = items.filter(file => {
                return !file.startsWith('.'); // Ignore hidden files
            }).map(file => ({
                name: file,
                url: `/ assets / docs / ${encodeURIComponent(file)} `,
                type: file.endsWith('.pdf') ? 'PDF' : file.endsWith('.mp4') ? 'Video' : 'File',
                status: 'Available 🟢'
            }));
        }
    } catch (e) {
        console.error("Error reading Docs dir:", e);
    }

    // Calculate Video Stats
    let videoCount = 0;
    try {
        const videoDir1 = path.join(rootDir, 'data_ingestion_ruv_coaching/Agentic Coding Training/Agentics Videos');
        const videoDir2 = path.join(rootDir, 'data_ingestion_ruv_coaching/Ruv Coaching');

        if (fs.existsSync(videoDir1)) videoCount += fs.readdirSync(videoDir1).filter(f => !f.startsWith('.')).length;
        if (fs.existsSync(videoDir2)) videoCount += fs.readdirSync(videoDir2).filter(f => !f.startsWith('.')).length;
    } catch (e) {
        console.error("Error counting videos:", e);
    }
    knowledge.videoStats = { total: videoCount, weeks: 4 };

    console.log(`   ✅ Returning ${knowledge.repos.length} repos, ${knowledge.websites.length} docs, ${knowledge.docs.length} files, ${videoCount} videos.`);
    res.json(knowledge);
});

// Repo Monitor Status Endpoint
// app.get('/api/repo-monitor/status', (req, res) => {
//     res.json({
//         monitor: repoMonitor.getStatus(),
//         message: 'Repository monitor checks for updates every 2 days'
//     });
// });


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
    console.log(`Agentic Learner initialized.`);

    // Start automatic repo monitoring (checks every 2 days)
    // TEMPORARILY DISABLED FOR STABILITY
    // repoMonitor.start().catch(err => {
    //     console.error('Failed to start repo monitor:', err);
    // });
});
