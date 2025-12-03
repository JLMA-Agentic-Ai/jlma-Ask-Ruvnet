const express = require('express');
process.env.FORCE_TRANSFORMERS = 'true';
const bodyParser = require('body-parser');
const RuvectorStore = require('../core/RuvectorStore');
const { OpenAI } = require('openai');
const path = require('path');
const repoMonitor = require('./RepoMonitor');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
const fs = require('fs');
app.use(express.static(path.join(__dirname, '../ui/dist'))); // Serve frontend
app.use('/frames', express.static(path.join(__dirname, '../../data_ingestion_ruv_coaching'))); // Serve video frames

// Initialize Agentic Flow Components
let modelRouter;
let reasoningBank;

async function initAgenticFlow() {
    try {
        // Dynamic imports for ESM modules
        const routerModule = await import('agentic-flow/router');
        const bankModule = await import('agentic-flow/reasoningbank');

        modelRouter = new routerModule.ModelRouter();

        // Initialize module to run DB migrations
        if (typeof bankModule.initialize === 'function') {
            await bankModule.initialize();
        }

        const { HybridReasoningBank } = bankModule;
        reasoningBank = new HybridReasoningBank({ preferWasm: false });

        console.log('✅ Agentic Flow Initialized (Router + HybridReasoningBank)');
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

    try {
        // Check cache first for instant responses (removed as per instruction)
        // const cachedResponse = getCachedResponse(message);
        // if (cachedResponse) {
        //     return res.json(cachedResponse);
        console.log('Received chat request:', message);

        // 1. Retrieve Context from ReasoningBank (Reflexion Memory)
        let context = "";
        let sources = [];

        if (reasoningBank && reasoningBank.reflexion) {
            console.log(`Searching ReasoningBank for: "${message}"`);
            try {
                // Use retrieveRelevant to get full episode details including 'input' (content)
                const results = await reasoningBank.reflexion.retrieveRelevant({
                    task: message,
                    k: 2 // Reduce k to avoid token limits
                });
                console.log(`Retrieved ${results.length} results from ReasoningBank`);

                sources = results.map(r => {
                    const timestamp = r.metadata?.timestamp ? new Date(r.metadata.timestamp).getTime() : 0;
                    const now = Date.now();
                    const daysOld = (now - timestamp) / (1000 * 60 * 60 * 24);

                    // Recency Boost: Boost score by up to 20% for very recent items (decaying over 30 days)
                    let recencyBoost = 0;
                    if (timestamp > 0) {
                        recencyBoost = Math.max(0, 0.2 * (1 - daysOld / 30));
                    }

                    return {
                        id: r.metadata?.docId || r.id,
                        content: (r.input || r.task || "").substring(0, 2000),
                        score: (r.similarity || 0) + recencyBoost, // Apply boost
                        source: r.metadata?.source,
                        timestamp: r.metadata?.timestamp
                    };
                });

                // Re-sort by boosted score
                sources.sort((a, b) => b.score - a.score);

                context = sources.map(s => `[Source: ${s.source || s.id} | Score: ${s.score.toFixed(2)}]\n${s.content}`).join('\n\n');
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
        }

        const responseData = {
            answer,
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
        if (fs.existsSync(githubDir)) {
            const items = fs.readdirSync(githubDir);
            knowledge.repos = items.filter(file => {
                try {
                    return fs.statSync(path.join(githubDir, file)).isDirectory();
                } catch (e) { return false; }
            }).map(repo => ({
                name: repo,
                type: 'GitHub Repository',
                status: 'Live Sync 🟢'
            }));
        }
    } catch (e) {
        console.error("Error reading GitHub dir:", e);
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
app.get('/api/repo-monitor/status', (req, res) => {
    res.json({
        monitor: repoMonitor.getStatus(),
        message: 'Repository monitor checks for updates every 2 days'
    });
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
    console.log(`Agentic Learner initialized.`);

    // Start automatic repo monitoring (checks every 2 days)
    repoMonitor.start().catch(err => {
        console.error('Failed to start repo monitor:', err);
    });
});
