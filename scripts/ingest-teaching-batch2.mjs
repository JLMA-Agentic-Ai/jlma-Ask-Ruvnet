#!/usr/bin/env node
/**
 * Teaching Batch 2: Debugging (8) + Worked Examples (7) + Decision Frameworks (10) = 25 entries
 * Direct ingestion into both kb_complete and architecture_docs
 */
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres', max: 2
});

let embedder;
async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function embed(text) {
  const e = await getEmbedder();
  const out = await e(text, { pooling: 'mean', normalize: true });
  return '[' + Array.from(out.data).join(',') + ']';
}

async function ingestEntry(entry, idx, total) {
  const clean = entry.content.replace(/[^\x00-\x7F]/g, '');
  const cleanTitle = entry.title.replace(/[^\x00-\x7F]/g, '');
  const embedText = (cleanTitle + ' ' + clean).substring(0, 1500);
  const vec = await embed(embedText);

  const { rows } = await pool.query(
    `INSERT INTO ask_ruvnet.kb_complete
     (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
     VALUES ($1, $2, $3, $4, $5, 1, $6, $7::ruvector)
     ON CONFLICT (file_path) DO NOTHING RETURNING id`,
    [entry.path, cleanTitle, clean, entry.category, entry.quality, clean.length, vec]
  );

  let kbId;
  if (rows.length > 0) {
    kbId = rows[0].id;
  } else {
    const { rows: [existing] } = await pool.query(
      `SELECT id FROM ask_ruvnet.kb_complete WHERE file_path = $1`, [entry.path]
    );
    kbId = existing.id;
  }

  const docId = `kb-complete-${kbId}`;
  const summary = clean.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 3).join(' ').replace(/\s+/g, ' ').trim().substring(0, 300);
  const fileHash = crypto.createHash('sha256').update(clean).digest('hex').substring(0, 16);

  await pool.query(
    `INSERT INTO ask_ruvnet.architecture_docs
     (doc_id, title, content, file_path, file_hash, category, quality_score,
      knowledge_type, concepts, summary, expertise_level, source_authority,
      triage_tier, is_duplicate, embedding)
     SELECT $1, $2, kc.content, $3, $4, $5, kc.quality_score,
            $6, $7::text[], $8, 'expert',
            'expert-curated', 'gold', false, kc.embedding
     FROM ask_ruvnet.kb_complete kc WHERE kc.id = $9
     ON CONFLICT (doc_id) DO NOTHING`,
    [docId, cleanTitle, `kb-complete/${entry.path}`, fileHash,
     entry.category, entry.knowledge_type, entry.concepts, summary, kbId]
  );

  const status = rows.length > 0 ? 'INSERTED' : 'EXISTS';
  console.log(`[${idx}/${total}] ${status} | ${cleanTitle.substring(0, 65)}`);
}

const entries = [
// === DEBUGGING & TROUBLESHOOTING (8 entries) ===
{
  path: 'knowledge/teaching/debug-agent-not-responding',
  title: 'My Agent Is Not Responding: A Troubleshooting Checklist',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['debugging', 'agent', 'troubleshooting', 'mcp', 'timeout', 'beginner'],
  content: `## The Problem

You asked Claude to do something and it seems stuck. No output, no progress, just silence. Before you panic, let us walk through a checklist -- like a mechanic checking a car that will not start.

## Step 1: Is the Process Even Running?

The most common reason an agent "stops responding" is that it finished or crashed and you did not notice. Check:
- In Claude Code: Look at the bottom of your terminal. Is there a spinner? If yes, it is still working. If no, it finished or errored.
- For background agents: Use TaskOutput to check if the agent completed. A completed agent is not stuck -- it is done.
- For swarm agents: Run swarm status to see which agents are active.

Think of it like checking if your car engine is actually on before diagnosing engine problems.

## Step 2: Is the MCP Server Connected?

If Claude tries to use a tool (like searching your KB) and the MCP server is down, the tool call hangs. Symptoms: Claude says it will search something, then goes silent.

Check: Look for MCP error messages in your terminal. The most common fix is restarting the MCP server. For the Ruvnet-KB-first server, it runs via stdio -- if Claude Code restarted, the MCP connection may need to re-establish.

This is like checking if your phone has signal before wondering why your call is not going through.

## Step 3: Is the Model Available?

API rate limits, network issues, or model outages can cause agents to stall. If you are running multiple agents in parallel, you may hit rate limits.

Check: Look for "rate limit" or "429" errors in the output. Fix: Reduce the number of parallel agents, or wait a few minutes.

## Step 4: Is the Context Window Full?

Every AI model has a maximum amount of text it can process at once (the context window). If your conversation or task generates too much text, the model hits its limit and stops.

Symptoms: Agent was working fine, then suddenly stops after processing a large amount of data.

Fix: Start a new conversation, or break the task into smaller pieces. This is like a notebook running out of pages -- you need a fresh one.

## Step 5: Is the Prompt Too Vague?

Agents need clear goals. A vague prompt like "make it better" can cause an agent to loop endlessly trying different approaches. A clear prompt like "fix the null check on line 45 of auth.js" gives the agent a specific target.

If an agent seems to be doing random things, the prompt is probably too vague.

## The Quick Fix Checklist

1. Check: Is it still running? (spinner, TaskOutput)
2. Check: Any error messages? (scroll up in terminal)
3. Check: MCP servers connected? (tool calls working?)
4. Check: Rate limits? (429 errors, too many parallel agents)
5. Check: Context full? (very long conversation)
6. Check: Clear prompt? (specific goal, not vague)

If none of these fix it, kill the agent and start fresh with a clearer, smaller task. Do not throw good time after bad.`
},
{
  path: 'knowledge/teaching/debug-search-wrong-results',
  title: 'Why Search Returns Wrong Results and How to Fix It',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['search', 'embeddings', 'distance', 'debugging', 'quality', 'threshold'],
  content: `## The Problem

You search for "how does HNSW work" and get results about cooking recipes. Or you search for something specific and the top result is completely unrelated. Vector search is finding the wrong things.

## Why This Happens

Vector search finds entries that are CLOSEST in meaning-space. If it returns wrong results, one of these is true:

1. THE EMBEDDINGS ARE BAD: The entry was embedded with garbage text, or the embedding model was different, or the embedding is null.

2. THE ENTRY CONTENT IS WRONG: The content does not actually match what the title promises. An entry titled "HNSW Explained" but containing mostly boilerplate code will embed as "code" not as "HNSW explanation."

3. THE THRESHOLD IS WRONG: You are accepting results that are too far away. A distance of 0.8 means "barely related" -- you probably want results under 0.5.

4. BETTER MATCHES DO NOT EXIST: If no entry in your KB covers the topic, the search returns the "least bad" match, which may be unrelated.

## How to Diagnose

Run a test query directly against the database:
SELECT title, embedding <=> query_vec as distance FROM ask_ruvnet.kb_complete ORDER BY distance LIMIT 5;

Look at the distances. If the top result has distance > 0.6, your KB probably does not have good content for that query.

## How to Fix

FOR BAD EMBEDDINGS: Re-embed the entry. Delete and re-insert with fresh ONNX embeddings. Make sure you are using Xenova/all-MiniLM-L6-v2 (384 dimensions) consistently.

FOR WRONG CONTENT: Rewrite the entry content to actually match the topic. Front-load the key concepts in the first 200 words -- that is what gets embedded most strongly.

FOR WRONG THRESHOLD: In knowledge_search(), the quality_score and source_authority help rank results. Expert-curated entries rank higher. Increase min_quality to filter out low-quality matches.

FOR MISSING CONTENT: Add a new entry that covers the topic. This is the KB equivalent of "the answer is not in the textbook, so add it."

## The GPS Analogy

Think of wrong search results like GPS giving you wrong directions. The problem is either: (a) the map is wrong (bad embeddings), (b) the destination is mislabeled (wrong content), (c) you set the wrong radius (threshold too loose), or (d) the destination does not exist yet (missing entry).`
},
{
  path: 'knowledge/teaching/debug-embeddings-broken',
  title: 'Embeddings Broken? Here Is Your Fix-It Guide',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['embeddings', 'onnx', 'dimensions', 'null', 'debugging', 'ruvector'],
  content: `## Common Embedding Problems and Their Fixes

### Problem 1: Null Embeddings
Your entry exists in the database but the embedding column is NULL. This means the entry was inserted without generating an embedding first, or the embedding generation failed silently.

FIX: Re-generate the embedding with ONNX and update the row:
1. Load the embedder: pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
2. Generate: embedder(text, { pooling: 'mean', normalize: true })
3. Update: UPDATE kb_complete SET embedding = vec::ruvector WHERE id = X

### Problem 2: Wrong Dimensions
The embedding has the wrong number of dimensions. Our system uses 384 (from all-MiniLM-L6-v2). If you accidentally used a different model (like OpenAI ada-002 which produces 1536), the dimensions will not match and searches will fail or produce garbage.

FIX: Check dimensions: SELECT array_length(embedding::float[], 1) FROM kb_complete LIMIT 1. If it is not 384, re-embed everything with the correct model.

### Problem 3: ONNX Model Not Loading
The @xenova/transformers package downloads the model on first use (~90MB). If the download was interrupted or cached incorrectly, the model loads garbage.

FIX: Clear the cache: rm -rf ~/.cache/huggingface/hub/models--Xenova--all-MiniLM-L6-v2. Then re-run -- it will download fresh.

### Problem 4: NaN Values in Embeddings
If you embed empty strings or strings with only special characters, the model may produce NaN (Not a Number) values. These make ALL distance calculations return NaN.

FIX: Always clean text before embedding. Remove non-ASCII characters, ensure the text has actual words (not just symbols), and check that the cleaned text is at least 10 characters long.

### Problem 5: Type Casting Errors
PostgreSQL error: "could not determine data type of parameter." This happens when you try to pass an embedding as a direct parameter with a type cast like $1::ruvector.

FIX: Use the INSERT...SELECT pattern instead. Insert into kb_complete first, then copy to architecture_docs using: INSERT INTO architecture_docs SELECT ... FROM kb_complete WHERE id = X. This lets PostgreSQL handle the ruvector type natively without casting.

### The Quick Diagnostic
1. Is the embedding NULL? -> Re-generate it
2. Is the dimension count 384? -> If not, wrong model
3. Does the ONNX model load? -> Clear cache, re-download
4. Are there NaN values? -> Clean your input text
5. Type cast errors? -> Use INSERT...SELECT pattern`
},
{
  path: 'knowledge/teaching/debug-mcp-connection',
  title: 'MCP Will Not Connect: Fixing the Plumbing',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['mcp', 'connection', 'debugging', 'server', 'stdio', 'transport'],
  content: `## What Is Happening

MCP (Model Context Protocol) connects Claude to external tools. When MCP breaks, Claude loses access to your knowledge base, file tools, and everything else that makes it useful. It is like unplugging the USB cable from your computer -- everything that was connected stops working.

## Symptom: Tool Calls Hang or Fail

If Claude says "Let me search the KB" and then nothing happens, the MCP server is probably not responding.

## The Troubleshooting Steps

### 1. Is the MCP Server Running?
The Ruvnet-KB-first MCP server runs via stdio transport -- it starts when Claude Code starts and communicates through standard input/output. If Claude Code restarted, the MCP server should restart too.

Check your Claude Code config: claude mcp list. You should see Ruvnet-KB-first listed.

### 2. Can the Server Reach the Database?
The MCP server connects to PostgreSQL on port 5435. If PostgreSQL is not running, the MCP server starts but cannot answer queries.

Check: psql -h localhost -p 5435 -U postgres -c "SELECT 1". If this fails, start PostgreSQL first.

### 3. Is the Transport Correct?
MCP supports two transport types: stdio and HTTP. Our setup uses stdio (the server reads from stdin, writes to stdout). If the config accidentally specifies HTTP, it will not connect.

Check .mcp.json for the correct configuration.

### 4. Are the Tools Registered?
Even if the MCP server is running, Claude needs to know which tools it provides. Run: claude mcp list-tools Ruvnet-KB-first. You should see 8 tools (kb_search, kb_search_all, kb_add, kb_feedback, kb_related, kb_domains, kb_stats, kb_status).

### 5. The Nuclear Option: Restart Everything
If nothing else works: quit Claude Code, make sure PostgreSQL is running on port 5435, then restart Claude Code. The MCP server will reinitialize.

## The Phone Analogy
MCP is like a phone connection between Claude and your tools. To troubleshoot: Is the phone on? (server running) Is there signal? (database reachable) Is the number right? (transport config) Can they hear you? (tools registered) If all else fails, hang up and redial (restart).`
},
{
  path: 'knowledge/teaching/debug-postgresql-errors',
  title: 'PostgreSQL Errors Decoded: What They Really Mean',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['postgresql', 'errors', 'debugging', 'sql', 'database', 'beginner'],
  content: `## The Top 10 PostgreSQL Errors in Plain English

### 1. "relation does not exist"
MEANS: The table you are trying to use does not exist, or you spelled it wrong, or you forgot the schema name.
FIX: Use the full schema.table name: ask_ruvnet.kb_complete, not just kb_complete.

### 2. "could not determine data type of parameter"
MEANS: PostgreSQL cannot figure out what type your parameter is. This happens most often with ruvector embeddings.
FIX: Use the INSERT...SELECT pattern instead of passing embeddings as direct parameters.

### 3. "duplicate key value violates unique constraint"
MEANS: You are trying to insert a row that already exists (same primary key or unique column value).
FIX: Use ON CONFLICT DO NOTHING or ON CONFLICT DO UPDATE to handle duplicates gracefully.

### 4. "null value in column violates not-null constraint"
MEANS: You are trying to insert NULL into a column that requires a value.
FIX: Check which column is NULL and provide a value. Common culprit: forgetting to generate the embedding before inserting.

### 5. "value too long for type character varying(N)"
MEANS: Your text is longer than the column allows.
FIX: Truncate the text with .substring(0, N) before inserting.

### 6. "connection refused"
MEANS: PostgreSQL is not running, or it is running on a different port.
FIX: Check that PostgreSQL is running on port 5435 (our custom port, not the default 5432).

### 7. "permission denied for schema"
MEANS: Your database user does not have permission to access this schema.
FIX: GRANT USAGE ON SCHEMA ask_ruvnet TO postgres;

### 8. "invalid input syntax for type ruvector"
MEANS: The embedding string format is wrong. It needs to be a bracket-enclosed list like [0.1,0.2,0.3,...].
FIX: Make sure your embedding is formatted as '[' + values.join(',') + ']'.

### 9. "canceling statement due to statement timeout"
MEANS: The query took too long and was killed by the timeout setting.
FIX: Add an index (HNSW for vector searches) or optimize the query. For vector search, make sure you have an HNSW index on the embedding column.

### 10. "out of memory"
MEANS: The query is trying to use more memory than PostgreSQL has allocated.
FIX: For vector operations, this usually means you are trying to process too many embeddings at once. Use LIMIT to restrict results.

## The Translation Rule
Every PostgreSQL error is the database telling you exactly what is wrong -- just in database language. Read the error message literally. "relation does not exist" = "this table is not here." "duplicate key" = "this row already exists." Trust the error message.`
},
{
  path: 'knowledge/teaching/debug-swarm-drift',
  title: 'When Agents Go Off-Script: Understanding Swarm Drift',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['swarm', 'drift', 'coordination', 'topology', 'debugging', 'hierarchical'],
  content: `## What Is Drift?

Drift is when AI agents gradually stop doing what you asked and start doing something else. You told 5 agents to fix a bug, and when you check back, one is refactoring the entire codebase, another is writing documentation nobody asked for, and only two are actually working on the bug.

This is exactly like delegating work to employees and coming back to find them doing their own thing. The difference is that AI agents drift faster because they do not have the social pressure of a boss watching.

## Why Drift Happens

1. VAGUE PROMPTS: "Improve the code" could mean anything. Each agent interprets it differently.
2. NO COORDINATOR: Without a hierarchical topology, agents have no one keeping them on track.
3. TOO MANY AGENTS: More agents = more interpretations = more drift. A team of 15 drifts faster than a team of 5.
4. NO CHECKPOINTS: If agents run for 30 minutes without reporting back, drift accumulates silently.

## How to Prevent Drift

### Use Hierarchical Topology
The coordinator agent acts as a boss -- it assigns specific tasks, checks results, and catches drift early. This is why the CLAUDE.md defaults to hierarchical topology.

### Keep Teams Small
6-8 agents maximum. Smaller teams have less room for miscommunication.

### Write Specific Prompts
BAD: "Fix the authentication system"
GOOD: "Fix the null pointer error on line 45 of src/auth/login.js that occurs when the user session expires"

### Use Specialized Roles
Each agent should have ONE clear job. A coder codes. A tester tests. A researcher researches. Overlap causes confusion.

## How to Detect Drift

If an agent's output does not match its assignment, it has drifted. Check:
- Is the agent modifying files it was not assigned?
- Is the agent's output about a different topic than its task?
- Has the agent created files that nobody asked for?

## How to Fix Active Drift

1. Stop the swarm
2. Review what each agent actually did
3. Keep the good work, discard the rest
4. Re-launch with clearer prompts and hierarchical topology`
},
{
  path: 'knowledge/teaching/debug-memory-issues',
  title: 'AI Memory Problems: Why Your Agent Forgot Everything',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['memory', 'context window', 'persistence', 'session', 'debugging'],
  content: `## The Problem

You spent 30 minutes teaching Claude about your project. You start a new conversation and Claude has no idea what you are talking about. All that context is gone.

## Why This Happens

AI models like Claude have a CONTEXT WINDOW -- a fixed amount of text they can "remember" in a single conversation. Think of it like a whiteboard: you can write a lot on it, but eventually you run out of space. When you start a new conversation, you get a fresh whiteboard.

The context window is NOT permanent memory. It is working memory -- like the stuff you hold in your head while solving a math problem. The moment you move on, it is gone.

## The Three Levels of AI Memory

### Level 1: Context Window (Working Memory)
What: Everything in the current conversation. Duration: This conversation only. Size: Large but limited (about 200K tokens for Claude). When it fills up, old messages get compressed or lost.

### Level 2: Session Memory (Notes)
What: Claude Flow's memory system -- you can explicitly store things for later. Duration: Across conversations in the same project. How: memory store --key "pattern-name" --value "what you learned" --namespace patterns. This is like writing notes in a notebook you keep between meetings.

### Level 3: Knowledge Base (Encyclopedia)
What: The PostgreSQL KB with embeddings. Duration: Permanent until deleted. How: Entries in kb_complete and architecture_docs. This is like an encyclopedia that Claude can search any time.

## Common Memory Mistakes

MISTAKE 1: Expecting Claude to remember between conversations without any persistence mechanism. FIX: Use CLAUDE.md to set up rules that persist, and the KB for knowledge that persists.

MISTAKE 2: Storing everything in context instead of the KB. If you explain something once and Claude needs it forever, put it in the KB. Do not re-explain it every conversation.

MISTAKE 3: Not using the KB-first pattern. If CLAUDE.md does not tell Claude to check the KB before answering, Claude will answer from its training data, which does not include your custom technology.

## The Fix

For things Claude should ALWAYS know: Put them in CLAUDE.md (loaded every conversation).
For knowledge Claude should SEARCH for: Put them in the KB (searched via MCP).
For temporary working notes: Use Claude Flow memory store.
For conversation-specific context: Just talk -- it is in the context window.`
},
{
  path: 'knowledge/teaching/debug-performance-slow',
  title: 'Everything Is Slow: Diagnosing AI Performance Issues',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['performance', 'speed', 'hnsw', 'indexing', 'debugging', 'optimization'],
  content: `## The Slowness Checklist

When your AI system feels slow, the bottleneck is in one of these places. Check them in order -- the most common causes are first.

### 1. Embedding Generation (Most Common)
Generating embeddings with ONNX takes time, especially the FIRST call which loads the model (~90MB). After the first call, subsequent embeddings are fast (~50ms each).

FIX: Load the model once at startup, then reuse it. Never create a new pipeline() for each embedding.

### 2. No HNSW Index on Vector Column
Without an HNSW index, every vector search checks EVERY row in the table. With 54,000 entries, that is 54,000 distance calculations per search.

FIX: CREATE INDEX ON ask_ruvnet.architecture_docs USING hnsw (embedding ruvector_cosine_ops). This takes the search from seconds to milliseconds.

### 3. Too Many Parallel Agents
Running 15 agents simultaneously sounds fast, but each agent makes API calls. If you hit rate limits, agents queue up and everything slows down.

FIX: Start with 5-8 agents. Only increase if you confirm you are not hitting rate limits.

### 4. Large Content in Queries
If you are selecting full content (SELECT content FROM ...) for thousands of rows, you are moving megabytes of text through the wire for no reason.

FIX: Select only what you need: SELECT id, title, distance FROM ... and fetch full content only for the top few results.

### 5. Connection Pool Exhaustion
If your script opens too many database connections, new queries wait for a connection to free up.

FIX: Set max: 2 or max: 3 in your pg.Pool config. More connections is not always faster.

### The Traffic Jam Analogy
Performance problems are like traffic jams. To find the bottleneck, trace the path: Start (prompt) -> Embed (ONNX) -> Search (PostgreSQL) -> Retrieve (network) -> Generate (API). Time each step. The slowest step is your bottleneck. Fix that one thing and ignore the rest.`
},

// === WORKED EXAMPLES (7 entries) ===
{
  path: 'knowledge/teaching/example-build-simple-kb',
  title: 'Build Your First Knowledge Base in 30 Minutes',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['knowledge base', 'tutorial', 'beginner', 'postgresql', 'embeddings', 'step-by-step'],
  content: `## What You Will Build

A tiny knowledge base with 5 entries that you can search by meaning. By the end, you will understand every step of the KB pipeline: create table, add entries, embed them, search them.

## Step 1: Create the Table

Connect to PostgreSQL and create a simple table:

CREATE TABLE my_first_kb (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding ruvector(384)
);

This creates a table with: an auto-incrementing ID, a title, content, and a 384-dimensional vector column for embeddings.

## Step 2: Write a Simple Ingestion Script

Create a file called my-kb.mjs:

import pg from 'pg';
const pool = new pg.Pool({ host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres' });
const { pipeline } = await import('@xenova/transformers');
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function embed(text) {
  const out = await embedder(text, { pooling: 'mean', normalize: true });
  return '[' + Array.from(out.data).join(',') + ']';
}

const entries = [
  { title: 'What is JavaScript', content: 'JavaScript is a programming language for the web.' },
  { title: 'What is Python', content: 'Python is a programming language popular for data science.' },
  { title: 'What is PostgreSQL', content: 'PostgreSQL is a powerful open-source relational database.' },
  { title: 'What is an API', content: 'An API is a way for programs to communicate with each other.' },
  { title: 'What is Git', content: 'Git is a version control system that tracks changes to code.' },
];

for (const e of entries) {
  const vec = await embed(e.title + ' ' + e.content);
  await pool.query('INSERT INTO my_first_kb (title, content, embedding) VALUES ($1, $2, $3::ruvector)', [e.title, e.content, vec]);
  console.log('Inserted:', e.title);
}

## Step 3: Run It
node my-kb.mjs

## Step 4: Search It
Now search by meaning, not keywords:

SELECT title, embedding <=> (SELECT embedding FROM my_first_kb WHERE title = 'What is JavaScript') as distance
FROM my_first_kb ORDER BY distance LIMIT 3;

Python will be closer to JavaScript than PostgreSQL is, because they are both programming languages. That is semantic search working.

## What Just Happened
You: Created a vector table, embedded 5 entries with ONNX, and searched by meaning. This is exactly what Ask Ruvnet does -- just at a larger scale (54,000+ entries instead of 5).`
},
{
  path: 'knowledge/teaching/example-add-mcp-server',
  title: 'Adding Your First MCP Server: A Step-by-Step Walkthrough',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['mcp', 'server', 'tutorial', 'configuration', 'tools', 'step-by-step'],
  content: `## What You Will Do

Add an MCP server to Claude Code so Claude gets access to new tools. This is like installing an app on your phone -- it gives Claude new capabilities.

## Step 1: Understand What You Are Adding

An MCP server is a program that provides TOOLS to Claude. For example, the Ruvnet-KB-first server provides 8 tools for searching your knowledge base. Without it, Claude cannot search your KB.

## Step 2: Add the Server

Run this command in your terminal:

claude mcp add my-server -- node /path/to/my-server.js

This tells Claude Code: "When you start, also start this server and connect to its tools."

For npm packages that provide MCP servers:
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest

## Step 3: Verify It Works

claude mcp list

You should see your server listed. Then:

claude mcp list-tools my-server

This shows all the tools the server provides. If you see tools listed, the connection works.

## Step 4: Use It in a Conversation

Start a new Claude Code session. Claude now has access to the tools from your MCP server. You can ask Claude to use them, or Claude will use them automatically when relevant.

## The App Store Analogy

Think of MCP like an app store for AI:
- The MCP server = the app
- The tools it provides = the app's features
- claude mcp add = installing the app
- claude mcp list = seeing your installed apps

The key difference from regular apps: MCP tools are used BY Claude, not by you directly. You tell Claude what you want, and Claude picks the right tool.

## Common Gotcha

If you add an MCP server and Claude does not seem to use its tools, check: (1) Did you restart Claude Code after adding? (2) Is the server path correct? (3) Does the server require environment variables (like API keys)?`
},
{
  path: 'knowledge/teaching/example-run-first-swarm',
  title: 'Running Your First AI Swarm: From Zero to Five Agents',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['swarm', 'tutorial', 'agents', 'claude flow', 'parallel', 'step-by-step'],
  content: `## What You Will Do

Launch 5 AI agents that work on a task simultaneously. By the end, you will understand how swarms work in practice.

## Step 1: Initialize the Swarm

In Claude Code, the swarm is initialized via the CLI:

npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

This sets up: hierarchical topology (one coordinator, workers below), max 8 agents, specialized strategy (each agent has a clear role).

## Step 2: Spawn Agents Using the Task Tool

In Claude Code, agents are spawned using the Task tool with run_in_background: true. Here is what it looks like when Claude spawns a swarm:

Task({ subagent_type: "researcher", prompt: "Research the codebase for authentication patterns", run_in_background: true })
Task({ subagent_type: "coder", prompt: "Implement the login function based on research", run_in_background: true })
Task({ subagent_type: "tester", prompt: "Write tests for the authentication system", run_in_background: true })

All three launch at the same time and work in parallel.

## Step 3: Wait for Results

The agents work independently. When they finish, their results come back to Claude Code. Claude then synthesizes all the results into a coherent answer.

## Step 4: Review and Synthesize

Claude reviews what each agent found/built/tested and combines it. If there are conflicts (researcher says one thing, coder did another), Claude resolves them.

## What Actually Happened

You just ran 3 agents simultaneously. In a linear workflow, this would take 3x as long because each step would wait for the previous one. With a swarm, they all run at once.

## The Construction Crew Analogy

You did not personally lay bricks, wire electricity, or test the plumbing. You told the foreman (Claude Code) what you wanted, and the foreman dispatched specialists (agents) to handle each part. That is swarm orchestration.

## When to Do This

Use swarms when: the task has multiple independent parts, you need multiple skills (research + code + test), or the task would take too long with one agent. Do NOT use swarms for: simple questions, single-file edits, or tasks where each step depends on the previous one.`
},
{
  path: 'knowledge/teaching/example-semantic-search-query',
  title: 'Writing Your First Semantic Search Query',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['semantic search', 'query', 'embeddings', 'distance', 'tutorial', 'step-by-step'],
  content: `## What You Will Do

Write a query that finds knowledge entries by MEANING, not by exact keyword matching. This is the core operation that powers Ask Ruvnet.

## The Old Way (Keyword Search)

SELECT * FROM entries WHERE content LIKE '%vector%';

This finds entries that contain the exact word "vector." It misses entries about "embeddings" or "semantic representations" even though they mean similar things.

## The New Way (Semantic Search)

Step 1: Convert your question to an embedding (384 numbers):
const vec = await embed("how do I make my AI search smarter");

Step 2: Find the closest entries in meaning-space:
SELECT title, embedding <=> $1::ruvector as distance FROM ask_ruvnet.kb_complete ORDER BY distance ASC LIMIT 5;

Step 3: Read the results. The closest entries (lowest distance) are the best matches.

## Understanding the Results

distance 0.15 = Almost exactly what you asked for
distance 0.30 = Very relevant, good match
distance 0.50 = Related but not specific
distance 0.70 = Loosely related at best
distance 0.90 = Completely different topic

## The MCP Way

When Claude searches the KB through MCP, it calls knowledge_search() which does all of this automatically plus applies quality scoring and source authority ranking. Expert-curated entries rank higher than auto-ingested ones.

## Why This Matters

Keyword search requires you to guess the exact words in the document. Semantic search understands what you MEAN. Search for "keeping data safe from AI leaks" and find an entry titled "Corporate Data Security in Zero-Trust AI Architectures" -- even though none of the words match. That is the power of embeddings.`
},
{
  path: 'knowledge/teaching/example-ingest-document',
  title: 'Ingesting Your First Document into the Knowledge Base',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['ingestion', 'knowledge base', 'embeddings', 'tutorial', 'step-by-step'],
  content: `## What You Will Do

Take a piece of text, clean it, embed it, store it in the database, and verify it is searchable. This is the process for adding ANY new knowledge to Ask Ruvnet.

## The Pipeline

Raw Text -> Clean -> Embed -> Store in kb_complete -> Mirror to architecture_docs -> Verify

## Step 1: Clean the Text

Remove non-ASCII characters that can break embeddings:
const clean = rawText.replace(/[^\\x00-\\x7F]/g, '');

Remove smart quotes, emojis, and special characters. The embedding model works best with plain ASCII English.

## Step 2: Generate the Embedding

const { pipeline } = await import('@xenova/transformers');
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const embedText = (title + ' ' + clean).substring(0, 1500);
const out = await embedder(embedText, { pooling: 'mean', normalize: true });
const vec = '[' + Array.from(out.data).join(',') + ']';

Key detail: we embed the TITLE + CONTENT together, limited to 1500 characters. The title is important because it tells the embedding model what the entry is about.

## Step 3: Insert into kb_complete

INSERT INTO ask_ruvnet.kb_complete (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
VALUES ($1, $2, $3, $4, $5, 1, $6, $7::ruvector);

## Step 4: Mirror to architecture_docs

Use INSERT...SELECT to copy the embedding natively (do NOT try to pass embeddings as direct parameters -- it fails with type cast errors):

INSERT INTO ask_ruvnet.architecture_docs (doc_id, title, content, ..., embedding)
SELECT 'kb-complete-' || $1, $2, kc.content, ..., kc.embedding
FROM ask_ruvnet.kb_complete kc WHERE kc.id = $1;

## Step 5: Verify

Search for it: SELECT title, embedding <=> query_vec as distance FROM ask_ruvnet.kb_complete ORDER BY distance LIMIT 3;

If your entry appears in the top 3 for a relevant query, it is working.

## Why Two Tables?

kb_complete is the primary knowledge store. architecture_docs is what the MCP server searches. Both need the entry. Think of it like: kb_complete is your master file, architecture_docs is the published version that customers (Claude via MCP) can access.`
},
{
  path: 'knowledge/teaching/example-create-teaching-entry',
  title: 'Creating a Teaching Entry That Actually Teaches',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['teaching', 'writing', 'knowledge base', 'quality', 'analogies', 'meta'],
  content: `## The Rubric: Would a Smart Non-Coder Understand This?

A teaching entry is not documentation. Documentation tells you WHAT to do. Teaching tells you WHY it works and WHAT it means. The difference is crucial.

## The Five Rules of Good Teaching Entries

### Rule 1: Start with Why Should I Care
Every entry should open with why this concept matters to the reader. Not "HNSW is a graph-based approximate nearest neighbor algorithm" but "Without HNSW, searching your knowledge base would take 10 seconds instead of 10 milliseconds. Here is why."

### Rule 2: Use One Core Analogy
Pick ONE analogy and use it throughout. The GPS analogy for embeddings. The restaurant kitchen for swarms. The USB port for MCP. One good analogy beats five mediocre ones.

### Rule 3: Build from Known to Unknown
Start with something the reader already understands, then bridge to the new concept. "You already use Google Search (known). Vector search is like Google but for meaning instead of keywords (bridge). Here is how it works (new)."

### Rule 4: Include a Glossary
End every teaching entry with key terms defined in plain English. Not everyone reads top to bottom -- some people skip to the glossary first.

### Rule 5: Tell Claude How to Use This
End with a section "For Claude Flow / Claude Code" that tells the AI how to reference this entry when answering questions. This is meta-teaching: you are teaching the teacher.

## Quality Score: 99

Teaching entries should be quality 99 (the highest). This ensures they rank above auto-ingested documentation in search results. When a user asks a beginner question, the teaching entry should appear FIRST.

## The Test

After writing, ask yourself: "If Stuart read only this entry, would he understand the concept well enough to explain it to someone else?" If yes, it passes. If no, rewrite.`
},
{
  path: 'knowledge/teaching/example-hook-self-learning',
  title: 'Setting Up Self-Learning Hooks: Making AI Remember What Works',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['hooks', 'self-learning', 'memory', 'patterns', 'claude flow', 'step-by-step'],
  content: `## What You Will Do

Set up hooks so that every time Claude completes a task successfully, it records WHAT WORKED. Next time a similar task comes up, Claude starts smarter because it already knows the solution pattern.

## The Coach Analogy

A good coach reviews game tape after every game. What plays worked? What failed? Next game, the team starts with that knowledge. Hooks are your AI's game tape system.

## Step 1: Pre-Task Hook (Before Starting)

Before starting a task, Claude checks if it has solved something similar before:

npx @claude-flow/cli@latest hooks pre-task --description "fix authentication bug"

This searches Claude Flow's memory for patterns related to "fix authentication bug." If a previous session stored a pattern like "JWT bugs usually involve expired token checks," Claude starts with that knowledge.

## Step 2: Do the Work

Claude does the task normally. Nothing changes here.

## Step 3: Post-Task Hook (After Completing)

After successfully completing the task, store what worked:

npx @claude-flow/cli@latest hooks post-task --task-id "auth-fix-1" --success true --store-results true

Then explicitly store the pattern:

npx @claude-flow/cli@latest memory store --key "pattern-auth-bug" --value "JWT auth bugs: check token expiry, refresh token flow, and session cleanup" --namespace patterns

## Step 4: Next Time

When a similar task comes up, the pre-task hook finds "pattern-auth-bug" and Claude starts with that knowledge instead of from scratch. Over time, Claude accumulates a library of solved patterns.

## What Makes This Powerful

Without hooks: Every conversation starts from zero.
With hooks: Every conversation builds on all previous conversations.

This is the difference between an employee who takes notes and one who does not. After a year, the note-taker is dramatically more effective because they have a personal knowledge base of solutions.

## The Critical Insight

The KB (knowledge base entries) teaches Claude about CONCEPTS. Hooks teach Claude about PATTERNS -- what actually worked in practice. Both together create an AI that knows the theory AND the practice.`
},

// === DECISION FRAMEWORKS (10 entries) ===
{
  path: 'knowledge/teaching/decide-when-to-use-swarm',
  title: 'Do I Need a Swarm? A Decision Guide',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['swarm', 'decision', 'single agent', 'complexity', 'framework'],
  content: `## The Quick Decision

Ask yourself ONE question: "Does this task have multiple independent parts?"

YES -> Use a swarm. Each part gets its own agent.
NO -> Use a single agent. Simpler is better.

## The Detailed Flowchart

### How many files does this change?
1-2 files -> Single agent. A swarm is overkill.
3-5 files -> Maybe a swarm. Depends on complexity.
6+ files -> Definitely a swarm. Too much for one agent to hold in context.

### Does this need multiple skills?
Just coding -> Single agent (coder).
Research + coding -> Maybe a swarm (researcher + coder).
Research + design + coding + testing + review -> Definitely a swarm.

### How long will this take?
Under 5 minutes -> Single agent.
5-30 minutes -> Consider a swarm if parallelizable.
Over 30 minutes -> A swarm will save you time.

### Is there a risk of drift?
If the task is well-defined (fix bug on line 45) -> Single agent.
If the task is open-ended (improve performance) -> Swarm with hierarchical topology to prevent drift.

## The Hiring Analogy

Would you hire one person or a team for this job?
- Changing a light bulb: One person (single agent).
- Remodeling a bathroom: A team of specialists (swarm).
- Painting one wall: One person (single agent).
- Building a house: Definitely a team (swarm).

## Default Swarm Config

When in doubt, use: --topology hierarchical --max-agents 8 --strategy specialized. This prevents drift and keeps the team small enough to manage.`
},
{
  path: 'knowledge/teaching/decide-vector-db-choice',
  title: 'Which Vector Database? PostgreSQL vs Specialized Options',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['vector database', 'postgresql', 'ruvector', 'pinecone', 'decision', 'comparison'],
  content: `## The Short Answer

Use PostgreSQL with ruvector. Here is why, and when you might consider alternatives.

## PostgreSQL + ruvector Wins When:
- You already have PostgreSQL (you do -- port 5435)
- You need SQL for filtering and joins alongside vector search
- You want one database for everything (knowledge, users, metadata, vectors)
- Your dataset is under 10 million vectors
- You care about data privacy (everything stays on your machine)
- You want to avoid vendor lock-in

## Specialized Vector DBs Win When:
- You have billions of vectors (Pinecone, Weaviate scale to billions)
- You need cloud-native managed infrastructure
- You need multi-tenant isolation at massive scale
- You are building a product where vector search IS the product

## The Comparison

POSTGRESQL + RUVECTOR: Free, local, SQL support, HNSW indexes, up to ~10M vectors efficiently. Downside: you manage it yourself.

PINECONE: Cloud-managed, scales to billions, easy API. Downside: costs money, data leaves your machine, vendor lock-in.

CHROMADB: Lightweight, embeds in your app, good for prototyping. Downside: not designed for production scale.

WEAVIATE: Full-featured, GraphQL support, modules for auto-embedding. Downside: complex setup, heavier resource usage.

## Why We Chose PostgreSQL

Ask Ruvnet has ~54,000 entries. That is well within PostgreSQL's comfort zone. We already use PostgreSQL for everything else. Adding ruvector let us add vector search without adding a new service. One database, one backup, one connection pool.

## The Kitchen Analogy

PostgreSQL is like a kitchen that can also do laundry (it does many things well). Pinecone is like a dedicated laundry service (it does one thing extremely well at scale). If you have a normal amount of laundry, the kitchen is fine. If you run a hotel, get the dedicated service.`
},
{
  path: 'knowledge/teaching/decide-embedding-model',
  title: 'Which Embedding Model? Size vs Speed vs Quality',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['embedding model', 'onnx', 'miniLM', 'openai', 'decision', 'comparison'],
  content: `## The Short Answer

We use all-MiniLM-L6-v2 (384 dimensions). Here is why.

## The Options

### all-MiniLM-L6-v2 (Our Choice)
Dimensions: 384. Speed: Fast (~50ms per embedding). Quality: Good. Cost: Free. Privacy: 100% local via ONNX. Size: ~90MB model.

### OpenAI text-embedding-ada-002
Dimensions: 1536. Speed: Fast (API call). Quality: Better. Cost: $0.0001 per 1K tokens. Privacy: Data sent to OpenAI. Requires internet.

### OpenAI text-embedding-3-small
Dimensions: 1536 (configurable). Speed: Fast (API call). Quality: Best. Cost: $0.00002 per 1K tokens. Privacy: Data sent to OpenAI.

### Cohere embed-v3
Dimensions: 1024. Speed: Fast (API call). Quality: Very good. Cost: $0.0001 per 1K tokens. Privacy: Data sent to Cohere.

## Why We Chose MiniLM

1. PRIVACY: Embeddings are generated locally. Your knowledge base content never leaves your machine. For a personal tutor that knows your entire codebase, this matters.

2. COST: Free. We generate thousands of embeddings. With an API model, that adds up.

3. SPEED: No network round-trip. Embedding generation happens in milliseconds on your M3 Max.

4. GOOD ENOUGH: For a knowledge base of ~200 entries covering specific technical topics, 384 dimensions captures enough nuance. The quality difference between MiniLM and OpenAI matters more when you have millions of very similar documents.

## When to Switch

Consider switching to an API model if: your search results are consistently wrong despite good content, you need to embed very long documents (MiniLM handles ~512 tokens well), or you are building a commercial product where embedding quality directly affects revenue.

## The Camera Analogy

MiniLM is like a good phone camera: portable, free to use, great for most situations. OpenAI is like a professional DSLR: better quality, but costs money and requires carrying extra equipment. For taking photos of your lunch, the phone camera is perfect. For a magazine cover, get the DSLR.`
},
{
  path: 'knowledge/teaching/decide-topology',
  title: 'Which Swarm Topology? A Visual Decision Guide',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['topology', 'hierarchical', 'mesh', 'star', 'swarm', 'decision'],
  content: `## The Five Topologies Explained

### Hierarchical (Boss and Workers)
Shape: Tree. One coordinator at top, workers below.
Best for: Most tasks. Anti-drift. Clear control.
Use when: You want predictable results and tight control.
Like: A traditional office with a manager.

### Mesh (Everyone Talks to Everyone)
Shape: Web. All agents connected to all others.
Best for: Creative brainstorming, research exploration.
Use when: Agents need to build on each other's ideas.
Risk: High drift potential. Agents can go off-track.
Like: A brainstorming session with no facilitator.

### Hierarchical-Mesh (Hybrid)
Shape: Tree with cross-links. Coordinator at top, workers can also talk to each other.
Best for: Large teams (10+ agents) where the coordinator would be a bottleneck.
Use when: You need both control and agent collaboration.
Like: A company with departments that coordinate with each other.

### Star (Hub and Spokes)
Shape: Wheel. One central agent, all others connect only to center.
Best for: Information gathering. The center collects from many sources.
Use when: One agent needs input from many specialists.
Like: A journalist interviewing multiple experts.

### Ring (Assembly Line)
Shape: Circle. Each agent passes to the next.
Best for: Pipeline tasks where each step builds on the previous.
Use when: The task has a natural sequence (research -> design -> code -> test).
Like: A factory assembly line.

## The Quick Decision

"I want control and predictability" -> Hierarchical
"I want creativity and exploration" -> Mesh
"I have a big team" -> Hierarchical-Mesh
"I need to gather information" -> Star
"I have a sequential pipeline" -> Ring
"I do not know" -> Hierarchical (safest default)`
},
{
  path: 'knowledge/teaching/decide-security-level',
  title: 'How Much AI Security Do I Need? A Risk Assessment',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['security', 'aimds', 'risk', 'decision', 'threat model'],
  content: `## The Three Levels

### Level 1: Personal Project (Basic Security)
Who: Solo developer, private code, no sensitive data.
Threats: Accidental data exposure, prompt injection from pasted content.
What you need: Input sanitization, no API keys in code, basic prompt hygiene.
Like: Locking your front door. Basic but important.

### Level 2: Startup / Small Team (Moderate Security)
Who: Team of developers, some user data, commercial product.
Threats: Prompt injection attacks, data leakage through AI responses, unauthorized access.
What you need: AIMDS detection layer, PII scanning, role-based access, audit logging.
Like: Home security system. Cameras, alarms, professional monitoring.

### Level 3: Enterprise (Full AIMDS Stack)
Who: Large organization, sensitive data, regulatory requirements.
Threats: Sophisticated adversarial attacks, insider threats, supply chain compromise.
What you need: Full AIMDS (3-layer pipeline), 25-level meta-learning, Lyapunov chaos detection, 4 security agents, zero-trust architecture.
Like: Military base security. Multiple checkpoints, continuous monitoring, defense in depth.

## Where You Are

As a vibe coder building a personal tutor: Level 1, trending toward Level 2. Your KB contains no user PII, but it does contain your architectural decisions and system knowledge. Basic security is appropriate now. Learn AIMDS concepts so you can scale up when needed.

## The Key Insight

Security is not binary (secure vs insecure). It is a spectrum. Match your security investment to your actual threat model. Over-securing a personal project wastes time. Under-securing a commercial product risks everything.`
},
{
  path: 'knowledge/teaching/decide-local-vs-cloud',
  title: 'Local AI vs Cloud AI: When to Keep It on Your Machine',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['local', 'cloud', 'privacy', 'onnx', 'api', 'decision'],
  content: `## The Trade-Off Matrix

### Local AI (ONNX on your machine)
PROS: Private (data never leaves), free after setup, no internet needed, fast for small operations.
CONS: Limited by your hardware, smaller models, you manage updates.
USE FOR: Embedding generation, small model inference, sensitive data processing.

### Cloud AI (API calls to Anthropic/OpenAI)
PROS: Most powerful models (Claude, GPT-4), no hardware limits, always up-to-date.
CONS: Costs money, requires internet, data leaves your machine, rate limits.
USE FOR: Complex reasoning, code generation, natural language understanding, anything requiring large language models.

## Our Hybrid Approach

Ask Ruvnet uses BOTH:
- LOCAL (ONNX): Generating embeddings with all-MiniLM-L6-v2. Privacy-critical, high-volume, no API cost.
- CLOUD (Claude API via MCP): Answering questions, generating code, reasoning about knowledge. Requires the power of a large model.

This is the optimal split. Use local for mechanical operations (embedding, search indexing) and cloud for intelligence operations (reasoning, generation).

## The Cooking Analogy

Local AI is like cooking at home: cheaper, private, you control the ingredients, but limited by your kitchen.
Cloud AI is like a restaurant: more capable, wider menu, professional quality, but costs money and you trust someone else with your food.
The smart approach: cook simple meals at home (embeddings locally), eat out for special occasions (Claude for complex reasoning).

## Decision Checklist

Is privacy critical for this operation? -> Local
Does this need large-model reasoning? -> Cloud
Is this high-volume (thousands of operations)? -> Local (avoid API costs)
Is this a one-off complex task? -> Cloud
Can a small model handle this? -> Local
Does this need the latest knowledge? -> Cloud`
},
{
  path: 'knowledge/teaching/decide-knowledge-type',
  title: 'Concept, Procedure, Decision, or Reference? Categorizing Knowledge',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['knowledge type', 'categorization', 'concept', 'procedure', 'decision', 'reference'],
  content: `## The Four Types

Every piece of knowledge in the KB is one of these types. Choosing correctly helps search return the right kind of answer.

### Concept (What is it?)
Purpose: Explains what something IS and why it matters.
Example: "What Is HNSW?" explains the concept, uses analogies, builds understanding.
When to use: The reader does not know what this thing is.
Search trigger: "What is X?" "Explain X" "How does X work?"

### Procedure (How do I do it?)
Purpose: Step-by-step instructions for accomplishing something.
Example: "Build Your First Knowledge Base" walks through each step.
When to use: The reader knows what they want to do but not how.
Search trigger: "How do I X?" "Steps to X" "Tutorial for X"

### Decision (When should I choose what?)
Purpose: Helps choose between options with clear trade-offs.
Example: "Which Embedding Model?" compares options with a decision matrix.
When to use: The reader faces a choice and needs guidance.
Search trigger: "Should I use X or Y?" "Which X is best?" "When to use X?"

### Reference (Look it up)
Purpose: Quick-access factual information, glossaries, specifications.
Example: "PostgreSQL Errors Decoded" is a reference you consult when you hit an error.
When to use: The reader needs a specific fact, not understanding.
Search trigger: "What does error X mean?" "List of X" "X specification"

## The Textbook Analogy

Concept = textbook chapter (teaches understanding)
Procedure = lab manual (teaches doing)
Decision = advisor meeting (helps choosing)
Reference = appendix (quick lookup)

## Why This Matters

When the knowledge_search() function runs, knowledge_type helps rank results. If someone asks "how do I build a KB?" a procedure entry ranks higher than a concept entry. If someone asks "what is HNSW?" a concept entry ranks higher. Correct categorization = better search results.`
},
{
  path: 'knowledge/teaching/decide-agent-type',
  title: 'Choosing the Right Agent for the Job',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['agent', 'agent type', 'coder', 'researcher', 'tester', 'decision'],
  content: `## The Agent Roster

Claude Code has 60+ agent types. Here are the 10 you will use most often:

### coder
Does: Writes and edits code.
Use when: You need code written, refactored, or fixed.
Prompt tip: Be specific about the file, function, and expected behavior.

### researcher
Does: Searches codebases, reads files, gathers information.
Use when: You need to understand existing code before changing it.
Prompt tip: Tell it exactly what to look for and where.

### tester
Does: Writes and runs tests.
Use when: You need verification that code works.
Prompt tip: Specify what scenarios to test.

### reviewer
Does: Reviews code for quality, security, and best practices.
Use when: Code is written and needs a quality check.
Prompt tip: Tell it what to focus on (security? performance? readability?).

### system-architect
Does: Designs system architecture and evaluates approaches.
Use when: You need to make an architectural decision.
Prompt tip: Describe the problem, constraints, and options you see.

### security-auditor
Does: Scans for security vulnerabilities.
Use when: You are about to deploy or handle sensitive data.
Prompt tip: Point it at specific files or features to audit.

### planner
Does: Creates implementation plans and task breakdowns.
Use when: A task is too complex to start without a plan.
Prompt tip: Describe the end goal and let it create the roadmap.

### python-expert / backend-dev / frontend-architect
Does: Specialized coding in specific domains.
Use when: The task requires domain-specific expertise.
Prompt tip: Same as coder, but you get domain-specific patterns.

## The Hiring Analogy

Choosing an agent type is like choosing which employee to assign a task. You would not send the accountant to fix the plumbing. Match the agent's specialty to the task. When in doubt, start with researcher (understand first) then coder (implement second).`
},
{
  path: 'knowledge/teaching/decide-memory-strategy',
  title: 'Choosing Your AI Memory Strategy',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['memory', 'context window', 'persistence', 'database', 'decision'],
  content: `## The Three Memory Options

### Option 1: Context Window (Working Memory)
What it is: The current conversation.
Duration: This conversation only.
Best for: Short tasks, quick questions, throwaway work.
Like: A whiteboard you erase after the meeting.

### Option 2: Claude Flow Memory (Session Notes)
What it is: Key-value store that persists across conversations.
Duration: As long as you want.
Best for: Patterns, preferences, working notes, task state.
How: memory store --key "name" --value "content" --namespace patterns
Like: A notebook you keep in your desk drawer.

### Option 3: Knowledge Base (Permanent Library)
What it is: PostgreSQL with embeddings, searchable by meaning.
Duration: Permanent.
Best for: Teaching content, architecture decisions, procedures, reference material.
How: Insert into kb_complete + architecture_docs with ONNX embeddings.
Like: An encyclopedia on the shelf.

## Decision Matrix

"Will I need this in 5 minutes?" -> Context window
"Will I need this next week?" -> Claude Flow memory
"Will I need this in 6 months?" -> Knowledge Base
"Should Claude find this automatically?" -> Knowledge Base (MCP searches it)
"Is this a quick note?" -> Claude Flow memory
"Is this a teaching concept?" -> Knowledge Base

## The Key Insight

Most people under-use persistent memory. They re-explain the same things every conversation. Every time you find yourself saying "as I explained before," that is a signal: put it in the KB or Claude Flow memory so you never have to explain it again.

## CLAUDE.md: The Secret Fourth Option

CLAUDE.md is loaded into EVERY conversation automatically. It is the most reliable persistence mechanism for rules, preferences, and configuration. If something should be true in every single conversation, put it in CLAUDE.md.`
},
{
  path: 'knowledge/teaching/decide-quality-vs-speed',
  title: 'Quality vs Speed: When Good Enough Is Good Enough',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['quality', 'speed', 'optimization', 'trade-off', 'decision'],
  content: `## The Fundamental Trade-Off

Every AI operation has a quality-speed dial. Turning up quality takes more time. Turning up speed reduces quality. The skill is knowing where to set the dial for each situation.

## Examples

### Embedding Quality
FAST: Embed the first 500 characters. Quick but misses nuance.
BALANCED: Embed title + first 1500 characters. Good coverage, reasonable speed. (This is what we do.)
THOROUGH: Embed full document in chunks, store multiple embeddings per entry. Best quality, 5x slower.

### Search Precision
FAST: Return top 3 results, no quality filtering. Instant.
BALANCED: Return top 5, filter by quality score and source authority. Milliseconds.
THOROUGH: Return top 10, re-rank with a second model, cross-reference. Seconds.

### Agent Thoroughness
FAST: One agent, do it now. Good for simple tasks.
BALANCED: 3-5 agents with specialized roles. Good for features.
THOROUGH: 8+ agents with consensus and review. Good for critical infrastructure.

## The Decision Rule

Ask: "What is the cost of getting this wrong?"

LOW COST (typo fix, formatting): Go fast. Speed over quality.
MEDIUM COST (new feature, refactor): Balance. Good enough is good enough.
HIGH COST (security, data migration, production deploy): Go thorough. Quality over speed.

## The Spell-Check Analogy

Real-time squiggly lines (fast, catches 90% of errors) vs. professional proofreader (slow, catches 99.9%). For a Slack message, squiggly lines are fine. For a legal contract, hire the proofreader. Match your quality investment to the stakes.`
},
];

async function main() {
  console.log(`=== Teaching Batch 2: ${entries.length} Entries ===\n`);
  console.log('Loading ONNX model...');
  await getEmbedder();
  console.log('Ready.\n');

  let inserted = 0, skipped = 0;
  for (let i = 0; i < entries.length; i++) {
    try {
      await ingestEntry(entries[i], i + 1, entries.length);
      inserted++;
    } catch (err) {
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        console.log(`[${i + 1}/${entries.length}] EXISTS | ${entries[i].title.substring(0, 65)}`);
        skipped++;
      } else {
        console.error(`[${i + 1}/${entries.length}] ERROR | ${err.message.substring(0, 100)}`);
      }
    }
  }

  // Verify counts
  const { rows: [counts] } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM ask_ruvnet.kb_complete WHERE category = 'teaching') as kb_teaching,
      (SELECT COUNT(*) FROM ask_ruvnet.architecture_docs WHERE doc_id LIKE 'kb-complete-%' AND source_authority = 'expert-curated') as arch_expert
  `);

  console.log(`\n=== Batch 2 Complete ===`);
  console.log(`Inserted: ${inserted} | Skipped: ${skipped}`);
  console.log(`Total teaching in kb_complete: ${counts.kb_teaching}`);
  console.log(`Total expert-curated in architecture_docs: ${counts.arch_expert}`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
