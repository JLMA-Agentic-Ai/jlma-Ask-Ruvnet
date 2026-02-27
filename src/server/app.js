const express = require('express');
process.env.FORCE_TRANSFORMERS = 'true';
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const RuvectorStore = require('../core/RuvectorStore');
const PostgresKnowledgeBase = require('../core/PostgresKnowledgeBase');
const HybridSearch = require('../core/HybridSearch');
const TextChunker = require('../core/TextChunker');
const QueryExpander = require('../core/QueryExpander');
const ReRanker = require('../core/ReRanker');
const ContextCompressor = require('../core/ContextCompressor');
const MultiHopRetriever = require('../core/MultiHopRetriever');
const { OpenAI } = require('openai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Version from single source of truth (package.json)
const { version: APP_VERSION } = require('../../package.json');

// ============================================================================
// Live npm version cache (refreshes every hour)
// ============================================================================
const NPM_PACKAGES = {
    'claude-flow':    '@claude-flow/cli',
    'agentic-flow':   'agentic-flow',
    'ruvector':       'ruvector',
    'ruvllm':         '@ruvector/ruvllm',
    'ruv-swarm':      'ruv-swarm',
    'agentic-synth':  '@ruvector/agentic-synth',
};
let npmVersionCache = {};
let npmCacheExpiry = 0;

async function refreshNpmVersions() {
    const now = Date.now();
    if (now < npmCacheExpiry) return npmVersionCache;
    const results = {};
    await Promise.all(Object.entries(NPM_PACKAGES).map(async ([repoName, pkg]) => {
        try {
            const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const d = await res.json();
                results[repoName] = d.version;
            }
        } catch (_) {}
    }));
    npmVersionCache = results;
    npmCacheExpiry = now + 3600_000; // 1 hour
    console.log('📦 npm versions refreshed:', results);
    return results;
}

// Initialize OpenAI client for special endpoints (if API key available)
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Initialize Gemini client for image generation (visualize endpoint)
const { GoogleGenAI } = require('@google/genai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDR-2kQuxZ1HJyZ2-IhUHmPN0XG3DS4HgY';
const geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ============================================================================
// MULTI-PROVIDER LLM — automatic fallback chain for chat
// Default chain: groq-free → groq-paid → openai → anthropic → together → openrouter → deepseek
// Set GROQ_API_KEY (free tier) and GROQ_PAID_API_KEY (paid tier) for dual-Groq setup.
// When free Groq hits its daily rate limit, it seamlessly falls through to paid, then others.
// Override order with LLM_PROVIDER env var if desired.
// ============================================================================
const LLM_PROVIDERS = [];

function registerProviders() {
    const preferred = (process.env.LLM_PROVIDER || '').toLowerCase();

    // All supported providers — order matters (this is the default fallback chain)
    const all = [
        { name: 'groq-free',  key: process.env.GROQ_API_KEY,       url: 'https://api.groq.com/openai/v1/chat/completions',    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' },
        { name: 'groq-paid',  key: process.env.GROQ_PAID_API_KEY,  url: 'https://api.groq.com/openai/v1/chat/completions',    model: process.env.GROQ_PAID_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' },
        { name: 'openai',     key: process.env.OPENAI_API_KEY,     url: 'https://api.openai.com/v1/chat/completions',         model: process.env.OPENAI_MODEL || 'gpt-4o' },
        { name: 'anthropic',  key: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY, url: null, /* uses native SDK format */ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514' },
        { name: 'openrouter', key: process.env.OPENROUTER_API_KEY, url: 'https://openrouter.ai/api/v1/chat/completions',      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4' },
        { name: 'deepseek',   key: process.env.DEEPSEEK_API_KEY,   url: 'https://api.deepseek.com/v1/chat/completions',       model: process.env.DEEPSEEK_MODEL || 'deepseek-chat' },
    ];

    // Filter to providers with keys set
    const available = all.filter(p => p.key);

    // If user sets LLM_PROVIDER, put that provider family first
    if (preferred) {
        // Match both exact name and family (e.g. "groq" matches "groq-free" and "groq-paid")
        const matchIdx = available.findIndex(p => p.name === preferred || p.name.startsWith(preferred + '-'));
        if (matchIdx > 0) {
            const [pref] = available.splice(matchIdx, 1);
            available.unshift(pref);
        }
    }

    LLM_PROVIDERS.length = 0;
    LLM_PROVIDERS.push(...available);

    if (LLM_PROVIDERS.length === 0) {
        console.error('❌ No LLM API keys configured! Set at least one: GROQ_API_KEY, OPENAI_API_KEY, CLAUDE_API_KEY, etc.');
    } else {
        console.log(`🤖 LLM fallback chain (${LLM_PROVIDERS.length}): ${LLM_PROVIDERS.map(p => p.name).join(' → ')}`);
    }
}

async function callAnthropicAPI(provider, messages, temperature, maxTokens) {
    // Anthropic uses a different API format than OpenAI-compatible providers
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': provider.key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: provider.model,
            max_tokens: maxTokens,
            temperature,
            system: systemMsg ? systemMsg.content : undefined,
            messages: nonSystemMsgs
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(`Anthropic: ${data.error.message}`);
    if (!data.content || !data.content[0]) throw new Error('Anthropic: empty response');
    return data.content[0].text;
}

async function callOpenAICompatible(provider, messages, temperature, maxTokens) {
    const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: provider.model,
            messages,
            temperature,
            max_tokens: maxTokens
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(`${provider.name}: ${data.error.message}`);
    if (!data.choices || !data.choices[0]) throw new Error(`${provider.name}: empty response`);
    return data.choices[0].message.content;
}

async function llmChat(messages, { temperature = 0.3, maxTokens = 4096 } = {}) {
    if (LLM_PROVIDERS.length === 0) {
        throw new Error('No LLM providers configured');
    }

    const errors = [];
    for (const provider of LLM_PROVIDERS) {
        try {
            console.log(`🤖 Trying ${provider.name} (${provider.model})...`);
            let answer;
            if (provider.name === 'anthropic') {
                answer = await callAnthropicAPI(provider, messages, temperature, maxTokens);
            } else {
                answer = await callOpenAICompatible(provider, messages, temperature, maxTokens);
            }
            console.log(`✅ ${provider.name} responded (${answer.length} chars)`);
            return { answer, provider: provider.name, model: provider.model };
        } catch (err) {
            console.warn(`⚠️ ${provider.name} failed: ${err.message}`);
            errors.push(`${provider.name}: ${err.message}`);
        }
    }

    throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
}

registerProviders();

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

// Trust Railway's load balancer for accurate IP-based rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : '*')
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }));
app.use(express.json({ limit: '1mb' }));
const fs = require('fs');
app.use(express.static(path.join(__dirname, '../ui/dist'))); // Serve frontend
app.use('/frames', express.static(path.join(__dirname, '../../data_ingestion_ruv_coaching'))); // Serve video frames
app.use('/generated_imgs', express.static(path.join(__dirname, '../../generated_imgs'))); // Serve generated visualizations

// Initialize RuVector Native Components (replaces SQLite-based HybridReasoningBank)
let modelRouter;
let reasoningBank; // Now a RuvectorStore instance with reflexion-compatible API
let pgKB = null;

async function initAgenticFlow() {
    try {
        // Dynamic import for ESM router module (optional - for LLM routing)
        try {
            const routerModule = await import('agentic-flow/router');
            modelRouter = new routerModule.ModelRouter();
            console.log('✅ Agentic Flow Router initialized');
        } catch {
            console.log('⚠️ Agentic Flow Router not available (optional)');
        }

        // PRIMARY: Try PostgreSQL knowledge base (54K+ enriched entries)
        pgKB = new PostgresKnowledgeBase();
        const pgConnected = await pgKB.initialize();

        if (pgConnected) {
            reasoningBank = pgKB;
            console.log('✅ PostgreSQL Knowledge Base connected (54K+ entries, intent-aware search)');
        } else {
            // FALLBACK: Local RuvectorStore (file-based vector DB)
            console.log('⚠️ PostgreSQL unavailable — falling back to local RuvectorStore');
            const ruvectorStore = new RuvectorStore();
            await ruvectorStore.initialize();
            reasoningBank = ruvectorStore;
            console.log('✅ RuVector Local Backend Initialized (HNSW + PersistentVectorDB)');
        }

        console.log('📊 Knowledge Backend: ' + (pgConnected ? 'PostgreSQL RuVector (54K+ entries)' : 'Local RuVector file DB'));

        // OPTIMIZED: Initialize hybrid search index for BM25 + semantic fusion
        await initHybridSearchIndex();
    } catch (error) {
        console.error('❌ Failed to initialize RuVector:', error);
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

        console.log('🔍 Building comprehensive BM25 hybrid search index...');

        const allDocuments = new Map();

        // If PostgreSQL is available, fetch ALL documents directly for full BM25 coverage
        if (pgKB && pgKB.ready && pgKB.pool) {
            try {
                const client = await pgKB.pool.connect();
                try {
                    const result = await client.query(`
                        SELECT id::text, title, LEFT(content, 2000) as content, category, source
                        FROM ask_ruvnet.architecture_docs
                        WHERE is_duplicate = false AND triage_tier != 'garbage'
                        ORDER BY id
                        LIMIT 10000
                    `);
                    result.rows.forEach(r => allDocuments.set(r.id, {
                        id: r.id,
                        input: `${r.title}\n${r.content}`,
                        task: r.title,
                        metadata: { docId: r.id, source: `postgresql:ask_ruvnet/${r.category}`, content: r.content }
                    }));
                    console.log(`📊 Loaded ${allDocuments.size} documents directly from PostgreSQL for BM25`);
                } finally {
                    client.release();
                }
            } catch (e) {
                console.warn('⚠️ Direct PostgreSQL fetch failed, falling back to embedding-based sampling:', e.message);
            }
        }

        // Fallback: if PostgreSQL direct fetch didn't work, use embedding-based sampling
        if (allDocuments.size === 0) {
            const batch1 = await reasoningBank.reflexion.retrieveRelevant({ task: '', k: 2000 });
            batch1.forEach(r => allDocuments.set(r.id, r));

            const technicalQueries = ['code', 'function', 'api', 'install', 'config'];
            for (const term of technicalQueries) {
                try {
                    const batch = await reasoningBank.reflexion.retrieveRelevant({ task: term, k: 500 });
                    batch.forEach(r => allDocuments.set(r.id, r));
                } catch (e) {
                    // Continue on individual query failures
                }
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

app.post('/api/chat', async (req, res) => {
    const { message, history, mode } = req.body;
    console.log(`[Chat] Received: ${message} (level: ${mode || 'Balanced'})`);

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (message.length > 10000) {
        return res.status(400).json({ error: 'Message too long (max 10,000 characters)' });
    }

    if (LLM_PROVIDERS.length === 0) {
        console.error('❌ No LLM API keys configured!');
        return res.status(500).json({ error: 'Server configuration error: No LLM API keys set. Configure OPENAI_API_KEY, CLAUDE_API_KEY, or GROQ_API_KEY.' });
    }

    try {
        console.log('Received chat request:', message);

        // 1. Retrieve Context from ReasoningBank (Reflexion Memory)
        let context = "";
        let sources = [];

        if (reasoningBank && reasoningBank.reflexion) {
            console.log(`Searching ReasoningBank for: "${message}"`);
            try {
                // ================================================================
                // STAGE 1: Query Expansion - Generate multiple query variants
                // ================================================================
                const expandedQueries = queryExpander.expand(message);
                const adaptiveK = queryExpander.getRecommendedK(message);
                console.log(`📝 Query expanded to ${expandedQueries.length} variants, adaptive k=${adaptiveK}`);

                // ================================================================
                // STAGE 2: Define search function for retrieval
                // ================================================================
                const semanticSearchFn = async (query, k) => {
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
                // STAGE 4b: Recency boost — coaching & video entries are our
                // freshest knowledge (Oct 2025 – Jan 2026 sessions). Boost their
                // scores so they surface ahead of older generic docs.
                // ================================================================
                const NOW_MS = Date.now();
                const RECENCY_BOOST_MAX = 0.25; // up to +25% score boost
                const applyRecencyBoost = (r) => {
                    const src = (r.source || r.metadata?.source || '').toLowerCase();
                    const isCoaching = src.includes('/coaching') || src.includes('coaching');
                    const isVideo = src.includes('/videos') || src.includes('video');
                    // Check if a date string is embedded in the source or metadata
                    const rawDate = r.metadata?.package_version || r.metadata?.session_date || r.timestamp || null;
                    let ageDays = null;
                    if (rawDate) {
                        const parsed = Date.parse(String(rawDate));
                        if (!isNaN(parsed)) {
                            ageDays = (NOW_MS - parsed) / (24 * 60 * 60 * 1000);
                        }
                    }
                    let boost = 0;
                    if (ageDays !== null) {
                        // Linear taper: entries <60 days old get full boost, older get less
                        const freshness = Math.max(0, 1 - ageDays / 60);
                        boost = RECENCY_BOOST_MAX * freshness;
                    } else if (isCoaching) {
                        // No date available but category is coaching — apply flat 15% boost
                        boost = 0.15;
                    } else if (isVideo) {
                        boost = 0.10;
                    }
                    if (boost > 0) {
                        const base = r.rerankedScore || r.score || 0;
                        r.rerankedScore = Math.min(1.0, base + base * boost);
                    }
                    return r;
                };
                const boostedResults = rerankedResults.map(applyRecencyBoost);
                // Re-sort after boost so higher-scored recent entries bubble up
                boostedResults.sort((a, b) => (b.rerankedScore || b.score || 0) - (a.rerankedScore || a.score || 0));
                console.log(`📅 Recency boost applied to ${boostedResults.filter(r => (r.source || '').includes('coaching') || (r.source || '').includes('video')).length} coaching/video results`);

                // ================================================================
                // STAGE 5: Apply similarity threshold
                // ================================================================
                const SIMILARITY_THRESHOLD = 0.15; // Lower threshold since re-ranker normalizes scores
                const filteredResults = boostedResults.filter(r => (r.rerankedScore || r.score || 0) >= SIMILARITY_THRESHOLD);
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
                    scoreBreakdown: r.scoreBreakdown,
                    package_name: r.package_name || r.metadata?.package_name || null,
                    doc_type: r.doc_type || r.metadata?.doc_type || null,
                    file_path: r.file_path || r.metadata?.file_path || null,
                    topics: r.topics || r.metadata?.topics || [],
                    metadata: r.metadata,
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

            } catch (err) {
                console.error('Error retrieving from ReasoningBank:', err);
                // Continue without context
            }
        } else {
            console.warn('ReasoningBank not initialized or reflexion memory unavailable.');
        }

        // 2. Construct System Prompt with Learning Level adaptation
        const { RUV_PERSONA } = require('./RuvPersona');
        console.log("Constructing system prompt...");

        const learningLevel = mode || 'Balanced';
        const levelInstructions = {
            'Simple': 'Explain like I\'m 5. Use everyday analogies, avoid all jargon, keep sentences short. Use emojis to make concepts visual.',
            'Beginner': 'Explain for someone new to programming. Define technical terms when first used, use real-world analogies, include "why this matters" context.',
            'Balanced': 'Provide a clear, well-structured response suitable for an intermediate audience. Balance depth with accessibility.',
            'Technical': 'Provide detailed technical depth. Include implementation details, code snippets, architecture considerations, and performance implications. Assume strong engineering background.'
        };

        const systemPrompt = `${RUV_PERSONA}

===== RESPONSE STYLE =====
Learning Level: ${learningLevel}
${levelInstructions[learningLevel] || levelInstructions['Balanced']}

===== KNOWLEDGE BASE CONTEXT =====
${context || 'No specific context was found in the knowledge base for this query. You MUST tell the user that you do not have enough information in your knowledge base to answer this question accurately, and suggest they rephrase or ask about a topic covered in the knowledge base. Do NOT use general knowledge or guess.'}

===== USER'S QUESTION =====
${message}

===== YOUR RESPONSE =====
Provide a clear, accurate, and helpful response based ONLY on the knowledge base context above, adapted to the ${learningLevel} learning level. If the context is insufficient, say so honestly rather than guessing.`;

        // 3. Generate Response using multi-provider LLM (with automatic fallback)
        let answer = "";
        let errorMsg = null;
        let usedProvider = null;
        try {
            const llmMessages = [
                { role: 'system', content: systemPrompt },
                ...(history || []),
                { role: 'user', content: message }
            ];
            const result = await llmChat(llmMessages);
            answer = result.answer;
            usedProvider = result.provider;
            console.log(`✅ Got answer from ${result.provider} (${result.model})`);
        } catch (error) {
            console.error('Error calling LLM:', error.message);
            answer = "I apologize, but I encountered an error generating a response. Please try again.";
            errorMsg = error.message;
        }

        const responseData = {
            answer,
            error: errorMsg,
            provider: usedProvider || null,
            sources: sources.map(s => ({
                id: s.id,
                score: s.score,
                content: (s.content || '').substring(0, 200),
                title: s.metadata?.title || s.source || s.id,
                package_name: s.package_name || s.metadata?.package_name || null,
                doc_type: s.doc_type || s.metadata?.doc_type || null,
                file_path: s.file_path || s.metadata?.file_path || null,
                topics: s.topics || s.metadata?.topics || [],
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
        checks: {
            server: 'ok',
            vectorStore: 'unknown'
        }
    };
    res.json(health);
});

// LLM Provider Status — shows which providers are configured and the fallback chain
app.get('/api/providers', (req, res) => {
    res.json({
        providers: LLM_PROVIDERS.map(p => ({ name: p.name, model: p.model })),
        primary: LLM_PROVIDERS[0]?.name || 'none',
        fallbackChain: LLM_PROVIDERS.map(p => p.name).join(' → '),
        configured: LLM_PROVIDERS.length,
    });
});

// KB Statistics Endpoint - shows real PostgreSQL KB state
app.get('/api/kb-stats', async (req, res) => {
    try {
        if (pgKB && pgKB.ready) {
            const stats = await pgKB.getKBStats();
            res.json({
                backend: 'PostgreSQL RuVector',
                connected: true,
                ...stats
            });
        } else {
            const vectorStats = reasoningBank ? reasoningBank.getStats?.() || {} : {};
            res.json({
                backend: 'Local RuvectorStore',
                connected: false,
                ...vectorStats
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Latest Repos Endpoint - returns 20 most recently updated repos from KB
let latestReposCache = null;
let latestReposCacheExpiry = 0;

app.get('/api/latest-repos', async (req, res) => {
    try {
        const now = Date.now();
        if (latestReposCache && now < latestReposCacheExpiry) {
            return res.json(latestReposCache);
        }

        if (pgKB && pgKB.ready && pgKB.pool) {
            const result = await pgKB.pool.query(`
                SELECT
                    package_name,
                    MAX(created_at) as last_updated,
                    COUNT(*) as entry_count
                FROM ask_ruvnet.architecture_docs
                WHERE package_name IS NOT NULL AND package_name != ''
                  AND is_duplicate = false AND triage_tier != 'garbage'
                GROUP BY package_name
                ORDER BY last_updated DESC
                LIMIT 20
            `);

            const repos = result.rows.map(row => ({
                name: row.package_name,
                description: `${parseInt(row.entry_count, 10).toLocaleString()} KB entries`,
                lastUpdated: row.last_updated,
                entryCount: parseInt(row.entry_count, 10)
            }));

            latestReposCache = repos;
            latestReposCacheExpiry = now + 3600_000; // 1 hour
            console.log(`[KB] Latest repos refreshed: ${repos.length} repos`);
            return res.json(repos);
        }

        // Fallback when PostgreSQL is not available
        res.json([
            { name: 'ruvnet/ask-ruvnet', description: 'Ask RuvNet - AI Knowledge Platform', lastUpdated: new Date().toISOString(), entryCount: 0 },
            { name: 'ruvnet/agentic-flow', description: 'Agentic Flow - Multi-Agent Framework', lastUpdated: new Date().toISOString(), entryCount: 0 }
        ]);
    } catch (err) {
        console.error('[KB] Error fetching latest repos:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Ecosystem Stats Endpoint - aggregate stats from the KB
let ecosystemStatsCache = null;
let ecosystemStatsCacheExpiry = 0;

app.get('/api/ecosystem-stats', async (req, res) => {
    try {
        const now = Date.now();
        if (ecosystemStatsCache && now < ecosystemStatsCacheExpiry) {
            return res.json(ecosystemStatsCache);
        }

        if (pgKB && pgKB.ready && pgKB.pool) {
            const result = await pgKB.pool.query(`
                SELECT
                    COUNT(DISTINCT package_name) as total_repos,
                    COUNT(*) as total_entries,
                    COUNT(DISTINCT doc_type) as doc_types,
                    MAX(created_at) as last_updated
                FROM ask_ruvnet.architecture_docs
                WHERE is_duplicate = false AND triage_tier != 'garbage'
            `);

            const row = result.rows[0] || {};
            const stats = {
                totalRepos: parseInt(row.total_repos, 10) || 0,
                totalEntries: parseInt(row.total_entries, 10) || 0,
                docTypes: parseInt(row.doc_types, 10) || 0,
                lastUpdated: row.last_updated,
                kbBackend: 'PostgreSQL RuVector'
            };

            ecosystemStatsCache = stats;
            ecosystemStatsCacheExpiry = now + 3600_000; // 1 hour
            console.log(`[KB] Ecosystem stats refreshed: ${stats.totalEntries} entries across ${stats.totalRepos} repos`);
            return res.json(stats);
        }

        // Fallback when PostgreSQL is not available
        res.json({
            totalRepos: 0,
            totalEntries: 0,
            docTypes: 0,
            lastUpdated: null,
            kbBackend: 'Not connected'
        });
    } catch (err) {
        console.error('[KB] Error fetching ecosystem stats:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Debug Endpoint - only available in development
if (process.env.NODE_ENV !== 'production') {
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
}


// ============================================================================
// Visualization Helper — Gemini image generation with KB context
// ============================================================================
async function generateVisualization(concept, style, resolution) {
    // 1. Query KB for context about the concept
    let kbContext = '';
    if (pgKB && pgKB.ready && pgKB.pool) {
        try {
            const kbResult = await pgKB.pool.query(`
                SELECT title, LEFT(content, 300) AS snippet
                FROM ask_ruvnet.kb_complete
                WHERE title ILIKE $1 OR content ILIKE $1
                ORDER BY quality_score DESC NULLS LAST
                LIMIT 3
            `, [`%${concept}%`]);
            if (kbResult.rows.length > 0) {
                kbContext = kbResult.rows.map(r => `- ${r.title}: ${r.snippet}`).join('\n');
            }
        } catch (err) {
            console.warn('[Visualize] KB lookup failed (non-fatal):', err.message);
        }
    }

    // 2. Build the image generation prompt
    const styleInstruction = style || 'modern flat design';
    const resLabel = resolution === '2K' ? '2048x2048' : '1024x1024';
    const prompt = [
        `Create a technical architecture diagram in ${styleInstruction} style.`,
        `Dark background (#1a1a2e), use vibrant accent colors (cyan #00d4ff, purple #7c3aed, green #10b981).`,
        `Include labeled components with clean connecting lines.`,
        `Professional technical illustration, no gradients, annotated.`,
        `Resolution target: ${resLabel}.`,
        ``,
        `Subject: "${concept}"`,
        kbContext ? `\nContext from knowledge base:\n${kbContext}` : '',
        ``,
        `Show the key components, their relationships, and data flows. Make labels clear and readable.`,
    ].join('\n');

    // 3. Call Gemini image generation
    const response = await geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseModalities: ['TEXT', 'IMAGE'] }
    });

    // 4. Extract the image from the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error('Gemini returned no candidates');
    }

    let imageBuffer = null;
    for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
            imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            break;
        }
    }

    if (!imageBuffer) {
        throw new Error('Gemini response did not contain an image');
    }

    // 5. Save image to generated_imgs/
    const slug = concept.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
    const timestamp = Date.now();
    const filename = `viz-${slug}-${timestamp}.png`;
    const imgDir = path.join(__dirname, '../../generated_imgs');

    // Ensure directory exists
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
    }

    const filePath = path.join(imgDir, filename);
    fs.writeFileSync(filePath, imageBuffer);
    console.log(`[Visualize] Saved: ${filePath} (${imageBuffer.length} bytes)`);

    return {
        imageUrl: `/generated_imgs/${filename}`,
        prompt,
        concept
    };
}

// POST /api/visualize — Generate architectural diagram images via Gemini
app.post('/api/visualize', async (req, res) => {
    const { concept, style, resolution } = req.body;

    if (!concept || typeof concept !== 'string') {
        return res.status(400).json({ error: 'concept is a required string' });
    }

    const validResolutions = ['1K', '2K'];
    if (resolution && !validResolutions.includes(resolution)) {
        return res.status(400).json({ error: 'resolution must be "1K" or "2K"' });
    }

    console.log(`[Visualize] Concept: "${concept}", Style: ${style || 'default'}, Resolution: ${resolution || '1K'}`);

    try {
        const result = await generateVisualization(concept, style, resolution);
        res.json(result);
    } catch (error) {
        console.error('[Visualize] Error:', error);
        res.status(500).json({ error: `Visualization failed: ${error.message}` });
    }
});

// Special Actions Endpoint (simplify, code, diagram, visualize)
app.post('/api/special', async (req, res) => {
    const { action, content } = req.body;

    if (!action || !content || typeof action !== 'string' || typeof content !== 'string') {
        return res.status(400).json({ error: 'action and content are required strings' });
    }

    if (!['simplify', 'code', 'diagram', 'visualize'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be: simplify, code, diagram, or visualize' });
    }

    console.log(`[Special] Action: ${action} `);

    // Visualize action uses Gemini, not OpenAI — handle separately
    if (action === 'visualize') {
        try {
            const vizResult = await generateVisualization(content);
            return res.json({ result: vizResult.imageUrl, imageUrl: vizResult.imageUrl, concept: vizResult.concept });
        } catch (error) {
            console.error('[Special/Visualize] Error:', error);
            return res.status(500).json({ error: `Visualization failed: ${error.message}` });
        }
    }

    // Check if OpenAI is configured (required for simplify, code, diagram)
    if (!openai) {
        return res.status(503).json({
            error: 'OpenAI API not configured. Set OPENAI_API_KEY environment variable.'
        });
    }

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
const { execFile } = require('child_process');

function runAutoLearner() {
    console.log("🧠 Agentic Learner: Checking for new knowledge...");
    const updaterPath = path.resolve(__dirname, '../../scripts/kb-incremental-update.sh');
    execFile(updaterPath, [], (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Learner Error: ${error.message} `);
            return;
        }
        if (stdout.includes('Changes detected') || stdout.includes('Inserted/updated')) {
            console.log("🚀 Agentic Learner: Knowledge Base Updated!");
        } else {
            console.log("💤 Agentic Learner: No new updates found.");
        }
    });
}

// Run Learner every 6 hours
setInterval(runAutoLearner, 6 * 60 * 60 * 1000);

// Manual Trigger Endpoint - requires API key in production
app.post('/api/learn', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${process.env.LEARN_API_KEY}`) {
            return res.status(401).json({ error: 'Unauthorized. Requires LEARN_API_KEY.' });
        }
    }
    console.log("🧠 Manual Learning Triggered");
    runAutoLearner();
    res.json({ message: "Learning process started in background." });
});

// Serve Other Documents (PDFs and video from UI dist folder)
app.use('/assets/docs', express.static(path.join(__dirname, '../ui/dist/assets/docs')));

// Knowledge Base Inventory Endpoint
app.get('/api/knowledge', async (req, res) => {
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
                url: `/assets/docs/${encodeURIComponent(file)}`,
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

    // Sort repos by last_update (newest first), with Claude-Flow V3 Alpha prioritized at top
    knowledge.repos.sort((a, b) => {
        // Prioritize Claude-Flow V3 at the very top (it's the main feature)
        if (a.name === 'claude-flow' && a.version && a.version.includes('alpha')) return -1;
        if (b.name === 'claude-flow' && b.version && b.version.includes('alpha')) return 1;

        // Then prioritize other alpha versions
        const aIsRealAlpha = a.version && a.version.includes('alpha');
        const bIsRealAlpha = b.version && b.version.includes('alpha');
        if (aIsRealAlpha && !bIsRealAlpha) return -1;
        if (!aIsRealAlpha && bIsRealAlpha) return 1;

        // Then sort by last_update date (newest first)
        const dateA = new Date(a.last_update || 0);
        const dateB = new Date(b.last_update || 0);
        return dateB - dateA;
    });

    // Enrich with live npm versions (non-blocking, cached)
    try {
        const liveVersions = await refreshNpmVersions();
        knowledge.repos = knowledge.repos.map(repo => {
            const live = liveVersions[repo.name];
            if (live) {
                return { ...repo, version: live, version_latest: live, version_alpha: live.includes('alpha') ? live : repo.version_alpha };
            }
            return repo;
        });
    } catch (_) {}

    // Add version status indicator to each repo
    knowledge.repos = knowledge.repos.map(repo => ({
        ...repo,
        versionStatus: repo.version_alpha ? 'ALPHA' :
                       repo.version === repo.version_latest ? 'LATEST' :
                       'STABLE'
    }));

    // Add app version to response
    knowledge.version = APP_VERSION;

    // Add real KB stats from PostgreSQL if available
    if (pgKB && pgKB.ready) {
        try {
            const kbStats = await pgKB.getKBStats();
            if (kbStats) {
                knowledge.kb_stats = kbStats;
                knowledge.kb_backend = 'PostgreSQL RuVector';
                knowledge.kb_total_entries = kbStats.total;
            }
        } catch (e) {
            console.error('Error fetching KB stats:', e.message);
        }
    }

    console.log(`   ✅ Returning ${knowledge.repos.length} repos, ${knowledge.websites.length} docs, ${knowledge.docs.length} files, ${videoCount} videos.`);
    res.json(knowledge);
});

// Error handler middleware (must be last)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start Server (only when run directly, not when imported as a module)
if (require.main === module) {
    const HOST = process.env.HOST || '127.0.0.1';
    const server = app.listen(PORT, HOST, () => {
        console.log(`Server running on ${HOST}:${PORT}`);
        console.log(`Ask rUVnet v${APP_VERSION} initialized.`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(() => process.exit(0));
    });
}

// Export app for testing and module imports
module.exports = app;
