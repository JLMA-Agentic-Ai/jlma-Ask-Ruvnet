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

// Initialize OpenAI client for special endpoints (if API key available)
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }));
app.use(express.json({ limit: '1mb' }));
const fs = require('fs');
app.use(express.static(path.join(__dirname, '../ui/dist'))); // Serve frontend
app.use('/frames', express.static(path.join(__dirname, '../../data_ingestion_ruv_coaching'))); // Serve video frames

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

            } catch (err) {
                console.error('Error retrieving from ReasoningBank:', err);
                // Continue without context
            }
        } else {
            console.warn('ReasoningBank not initialized or reflexion memory unavailable.');
        }

        // 2. Construct System Prompt
        const { RUV_PERSONA } = require('./RuvPersona');
        console.log("Constructing system prompt...");

        const systemPrompt = `${RUV_PERSONA}

===== KNOWLEDGE BASE CONTEXT =====
${context || 'No specific context was found in the knowledge base for this query. You MUST tell the user that you do not have enough information in your knowledge base to answer this question accurately, and suggest they rephrase or ask about a topic covered in the knowledge base. Do NOT use general knowledge or guess.'}

===== USER'S QUESTION =====
${message}

===== YOUR RESPONSE =====
Provide a clear, accurate, and helpful response based ONLY on the knowledge base context above. If the context is insufficient, say so honestly rather than guessing.`;

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
        checks: {
            server: 'ok',
            vectorStore: 'unknown'
        }
    };
    res.json(health);
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


// Special Actions Endpoint (simplify, code, diagram)
app.post('/api/special', async (req, res) => {
    const { action, content } = req.body;
    console.log(`[Special] Action: ${action} `);

    // Check if OpenAI is configured
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

// Manual Trigger Endpoint
app.post('/api/learn', (req, res) => {
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

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Ask rUVnet v${APP_VERSION} initialized.`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => process.exit(0));
});
