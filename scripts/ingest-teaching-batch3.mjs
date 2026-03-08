#!/usr/bin/env node
/**
 * Teaching Batch 3: Glossary (5) + Ruflo Cookbook (10) + CF Awareness (5) = 20 entries
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
// === GLOSSARY (5 entries) ===
{
  path: 'knowledge/teaching/glossary-core-terms',
  title: 'Core AI Glossary: 30 Terms Every Vibe Coder Should Know',
  category: 'teaching', quality: 99, knowledge_type: 'reference',
  concepts: ['glossary', 'terminology', 'beginner', 'reference', 'definitions'],
  content: `## A-Z of AI Terms in Plain English

AGENT: An AI that can use tools and pursue goals autonomously. Unlike a chatbot (which only responds), an agent decides what to do next on its own. Like an employee vs a Magic 8-Ball.

CHUNK: A piece of a larger document. Long documents get split into chunks for embedding because embedding models have input limits. Like cutting a book into chapters for easier filing.

CLAUDE CODE: The CLI tool that lets you interact with Claude in your terminal. It reads files, edits code, runs commands, and spawns agents.

CLAUDE FLOW: The orchestration system that coordinates multiple agents, manages memory, and enables self-learning. The "operating system" for AI teams.

CONTEXT WINDOW: The maximum amount of text an AI can process in one conversation. Like the size of a whiteboard -- when it fills up, old stuff gets erased.

COSINE SIMILARITY: A way to measure how similar two vectors are by looking at the angle between them. Ranges from 0 (identical) to 2 (opposite). Our distance operator <=> uses this.

DIMENSION: One number in a vector. Our embeddings have 384 dimensions -- 384 numbers that together represent meaning.

DISTANCE: How far apart two embeddings are in meaning-space. Lower distance = more similar. 0.1-0.3 = great match. 0.7+ = weak match.

EMBEDDING: A list of numbers that represents the meaning of text. "Happy dog" and "joyful puppy" have similar embeddings because they mean similar things.

FINE-TUNING: Training a model on specific data to make it better at a particular task. Like giving an employee specialized training.

HNSW: Hierarchical Navigable Small World. An index structure that makes vector search fast. Like building highways through meaning-space so you can find nearby vectors without checking every single one.

INFERENCE: Running a model to get a prediction or output. When Claude answers your question, that is inference.

INGEST: The process of adding data to a knowledge base: clean, embed, store, verify.

KNOWLEDGE BASE (KB): A curated collection of information that AI can search. Not just raw data -- structured, embedded, and quality-scored.

MCP: Model Context Protocol. A standard way for AI to connect to external tools. Like USB for AI.

NORMALIZE: Scaling a vector so its length equals 1. This makes distance calculations consistent regardless of the original text length.

ONNX: Open Neural Network Exchange. A format that lets AI models run anywhere (browser, laptop, server) without cloud APIs.

PIPELINE: A sequence of processing steps. The KB pipeline: clean text -> embed -> store -> mirror -> verify.

POOLING: Combining multiple word-level embeddings into one sentence-level embedding. "Mean pooling" averages them all together.

PROMPT: The text you send to an AI model. The quality of the prompt determines the quality of the response.

QUALITY SCORE: A 0-100 rating on KB entries. Higher scores rank higher in search. Expert-curated entries score 95-99.

RAG: Retrieval Augmented Generation. AI looks up relevant information before generating a response. Like an open-book test.

RUVECTOR: The PostgreSQL data type that stores embedding vectors. Like how INTEGER stores numbers, RUVECTOR stores meaning.

SCHEMA: A namespace in PostgreSQL that groups related tables. Our KB uses the ask_ruvnet schema.

SEMANTIC SEARCH: Finding information by meaning instead of exact keyword matching. "How do I protect my data?" finds entries about "data security" even without the word "protect."

SWARM: Multiple AI agents working together on a task. Like a construction crew where each worker specializes.

TOKEN: The smallest unit of text that AI processes. Roughly 4 characters or 0.75 words per token.

TOOL USE: When an AI uses external tools (like searching a database, reading a file, or running code) instead of just generating text.

TOPOLOGY: How agents in a swarm are connected to each other. Hierarchical, mesh, star, ring, or hybrid.

VECTOR: A list of numbers. In AI, vectors represent meaning. A 384-dimensional vector = a list of 384 numbers.`
},
{
  path: 'knowledge/teaching/glossary-security-terms',
  title: 'AI Security Glossary: 20 Terms That Keep You Safe',
  category: 'teaching', quality: 99, knowledge_type: 'reference',
  concepts: ['glossary', 'security', 'aimds', 'terminology', 'reference'],
  content: `## Security Terms in Plain English

ADVERSARIAL INPUT: Text crafted to trick an AI into doing something unintended. Like a con artist who knows exactly what to say to get past security.

AIMDS: AI Manipulation Defense System. A 3-layer defense pipeline that detects, analyzes, and responds to manipulation attempts in under 160ms total.

AIR-GAP: Complete network isolation. An air-gapped AI has zero internet connection. Maximum security at the cost of cloud model access.

BEHAVIORAL ANALYSIS: Monitoring AI behavior patterns over time to detect anomalies. If an agent suddenly starts accessing files it never touched before, that is suspicious.

BYZANTINE FAULT TOLERANCE: A system that works correctly even if some participants are lying or malfunctioning. Named after the Byzantine Generals Problem where some generals might be traitors.

CLAIMS-BASED AUTH: Access control where agents carry "claims" (like badges) that determine what they can do. Agent A has the "read-kb" claim but not "write-kb."

DATA EXFILTRATION: Stealing data by tricking the AI into including sensitive information in its responses. Like asking cleverly worded questions to extract confidential data.

DEFENSE IN DEPTH: Multiple layers of security so that if one layer fails, others catch the attack. Like a castle with walls, a moat, AND guards.

GUARDIAN AGENT: A security agent that monitors all agent inputs and outputs for manipulation attempts. The security camera of the AI system.

INJECTION ANALYST: A specialized agent that deeply analyzes suspected prompt injection attempts using pattern recognition and historical data.

JAILBREAK: A prompt designed to make an AI ignore its safety rules. Different from prompt injection because it targets the model itself rather than the application.

LYAPUNOV CHAOS DETECTION: A mathematical method for detecting when system behavior is becoming chaotic or unpredictable. Borrowed from chaos theory. Used in AIMDS to catch subtle manipulation.

META-LEARNING: Learning how to learn. In AIMDS, the 25-level meta-learning system adapts its defense strategies based on what attacks it has seen before. Each level builds on the previous.

PII: Personally Identifiable Information. Names, emails, phone numbers, addresses. The PII detector agent scans for this before it can leak.

PROMPT INJECTION: Hiding instructions in data that trick the AI into following the attacker's commands instead of the user's. Like hiding a fake memo in a stack of real documents.

PRIVILEGE ESCALATION: Gaining more access than you should have. An agent with read-only access somehow getting write access.

SECURITY ARCHITECT: An agent specialized in designing secure system architectures. It reviews designs for vulnerabilities before they are built.

STRANGE LOOP: A self-referential feedback loop where the system monitors itself monitoring itself. Used in AIMDS meta-learning for recursive self-improvement.

THREAT PATTERN: A known attack signature stored in memory. When AIMDS sees a similar pattern, it can respond faster because it has seen this before.

ZERO-TRUST: Never trust, always verify. Every request is treated as potentially hostile, even from internal agents. The opposite of "trust everything inside the firewall."`
},
{
  path: 'knowledge/teaching/glossary-ruflo-terms',
  title: 'Ruflo Glossary: 25 Terms for Swarm Masters',
  category: 'teaching', quality: 99, knowledge_type: 'reference',
  concepts: ['glossary', 'claude flow', 'terminology', 'swarm', 'reference'],
  content: `## Ruflo Terms in Plain English

AGENTDB: The database system that stores agent memory, patterns, and learning data. The institutional memory of your AI workforce.

BACKGROUND WORKER: One of 12 automated processes that run continuously: ultralearn, optimize, consolidate, predict, audit, map, preload, deepdive, document, refactor, benchmark, testgaps.

CONSOLIDATE: Merging and optimizing stored patterns to prevent memory bloat. Like cleaning out a filing cabinet -- keep what matters, archive the rest.

COORDINATOR: The agent in a hierarchical swarm that assigns tasks and checks results. The manager of the AI team.

DAEMON: A background process that runs Ruflo services continuously. Start it with: npx ruflo@latest daemon start.

EWC (Elastic Weight Consolidation): A technique that prevents the AI from forgetting old patterns when learning new ones. Like studying for a new exam without forgetting last semester's material.

FLASH ATTENTION: An optimized attention mechanism that processes information 2.49x-7.47x faster than standard attention. The "speed boost" for neural operations.

HIVE MIND: The collective intelligence system where multiple agents vote on decisions using Byzantine fault-tolerant consensus. Majority rules, and even if some agents malfunction, the group still makes good decisions.

HOOK: A trigger that fires before or after an event. Pre-hooks check context, post-hooks record results. The nervous system of self-learning.

LORA (Low-Rank Adaptation): A lightweight way to specialize an AI model for specific tasks without retraining the whole thing. Like giving an employee a cheat sheet instead of sending them back to school.

MEMORY NAMESPACE: A category for organizing stored memories. "patterns" for solution patterns, "tasks" for task history, "default" for everything else.

MOE (Mixture of Experts): A routing system that sends each task to the most qualified specialist. Like a hospital triage nurse directing patients to the right department.

NEURAL PATTERN: A learned behavior pattern stored in Ruflo's neural system. Over time, the system learns which approaches work for which types of tasks.

PRETRAIN: Bootstrap intelligence from a repository by analyzing existing code patterns. Like a new employee reading all the company documentation on their first day.

QUEEN: The top-level coordinator in a hierarchical-mesh topology. Named after the queen bee who coordinates the hive.

RAFT: A consensus algorithm where agents elect a leader who maintains the official state. If the leader fails, a new one is elected. Like a parliamentary system.

REASONINGBANK: A database of reasoning trajectories -- step-by-step records of how the AI solved previous problems. Used to improve future reasoning.

SESSION: A conversation or work period with state that can be saved and restored. Like bookmarking your place in a book.

SONA: Self-Optimizing Neural Architecture. Adapts in under 0.05ms based on task characteristics. The automatic performance tuner.

SPAWN: Creating a new agent instance. Like hiring a new worker for a specific job.

STATUSLINE: The real-time display in Claude Code showing what agents are doing. Your project management dashboard.

SWARM: Multiple coordinated agents working on a shared goal. The AI equivalent of a project team.

TASK ORCHESTRATE: The command that analyzes a task and recommends the optimal approach (which agents, which topology, which tools).

TOPOLOGY: How agents in a swarm are connected: hierarchical, mesh, hierarchical-mesh, star, or ring.

WORKER: A non-coordinator agent that does actual work (coding, testing, researching). The employees of the AI team.`
},
{
  path: 'knowledge/teaching/glossary-database-terms',
  title: 'Database Glossary: 20 Terms for AI Knowledge Systems',
  category: 'teaching', quality: 99, knowledge_type: 'reference',
  concepts: ['glossary', 'database', 'postgresql', 'sql', 'reference'],
  content: `## Database Terms in Plain English

CONNECTION POOL: A set of pre-opened database connections that get reused instead of opening a new one each time. Like having a few phone lines open instead of dialing a new number for every call. Set with: new pg.Pool({ max: 3 }).

CREATE INDEX: Build a lookup structure that makes searches faster. Without an index, the database reads every row. With an index, it jumps straight to the answer. CREATE INDEX ON table USING hnsw (embedding ruvector_cosine_ops).

FOREIGN KEY: A column that references a row in another table. Like a pointer saying "this belongs to that." Ensures data consistency.

HNSW INDEX: A special index for vector columns that makes similarity search fast. Without it, searching 54K embeddings checks all 54K. With it, checks about 100. The difference between minutes and milliseconds.

INSERT...SELECT: A pattern where you insert into one table by selecting from another. Critical for our system because it copies ruvector embeddings natively without type-casting issues.

IVFFLAT: An older vector index type. Faster to build than HNSW but slower to search. We use HNSW instead.

JOIN: Combining data from two tables based on a shared column. Like matching employee records with department records using employee_id.

MIGRATION: Changing the database structure (adding tables, columns, indexes). Should be versioned and reversible.

ON CONFLICT: What to do when an insert would create a duplicate. ON CONFLICT DO NOTHING = skip it. ON CONFLICT DO UPDATE = overwrite it.

ORM: Object-Relational Mapping. A library that lets you use code objects instead of raw SQL. We use raw SQL (pg library) because it gives us full control over ruvector operations.

PRIMARY KEY: The unique identifier for each row. Usually an auto-incrementing integer (SERIAL). Every row must have one.

QUERY: A request to the database. SELECT = read data. INSERT = add data. UPDATE = change data. DELETE = remove data.

RETURNING: A PostgreSQL feature that returns data from the rows you just inserted/updated/deleted. INSERT INTO table (col) VALUES (val) RETURNING id gives you the new ID immediately.

RUVECTOR: The custom PostgreSQL type for storing embedding vectors. Supports distance operators like <=> for cosine distance.

SCHEMA: A namespace that groups related tables. Our tables live in the ask_ruvnet schema. Access with: ask_ruvnet.table_name.

TABLE: A structured collection of rows and columns. Like a spreadsheet where each row is an entry and each column is a field.

TRANSACTION: A group of operations that either ALL succeed or ALL fail. Prevents partial updates that leave data in a broken state.

UPSERT: Insert if new, update if existing. Achieved with INSERT ... ON CONFLICT DO UPDATE. Like "save" in a word processor -- creates or overwrites.

VACUUM: PostgreSQL cleanup operation that reclaims storage from deleted or updated rows. Like emptying the trash on your computer.

WHERE: Filters rows in a query. SELECT * FROM table WHERE category = 'teaching' returns only teaching entries.`
},
{
  path: 'knowledge/teaching/glossary-architecture-terms',
  title: 'Architecture Glossary: 15 Terms for System Builders',
  category: 'teaching', quality: 99, knowledge_type: 'reference',
  concepts: ['glossary', 'architecture', 'systems', 'infrastructure', 'reference'],
  content: `## Architecture Terms in Plain English

API (Application Programming Interface): A way for programs to talk to each other. When Claude calls the KB, it uses an API. Like a waiter taking your order to the kitchen -- you talk to the waiter (API), not the chef (database) directly.

CACHE: A fast-access copy of frequently used data. Instead of querying the database every time, store recent results in memory. Like keeping frequently used phone numbers on speed dial instead of looking them up every time.

CDN (Content Delivery Network): Copies of your content stored around the world so users get fast responses. Not relevant for local AI but important if you deploy publicly.

CI/CD (Continuous Integration / Continuous Deployment): Automated systems that test and deploy your code when you push changes. GitHub Actions is a CI/CD system.

CONTAINER (Docker): A lightweight package that bundles your app with all its dependencies. Like a shipping container -- everything the app needs is inside, and it runs the same everywhere.

EVENT-DRIVEN: A system where things happen in response to events (triggers) rather than following a fixed script. Hooks in Ruflo are event-driven: "when a task completes, store the pattern."

INFRASTRUCTURE AS CODE: Defining your servers, databases, and services in configuration files instead of clicking through dashboards. Repeatable, version-controlled, reviewable.

LOAD BALANCER: Distributes work across multiple servers so no single server gets overwhelmed. Like a host at a restaurant seating guests at different tables.

MESSAGE QUEUE: A system where components communicate by sending messages to a queue. The sender does not wait for the receiver. Like leaving a voicemail instead of waiting for someone to pick up.

MICROSERVICE: A small, independent service that does one thing well. The alternative is a MONOLITH (one big program that does everything). Ruflo is microservice-oriented.

MONOLITH: One big program that handles everything. Simpler to start with, harder to scale. Good for small projects, painful for large ones.

PUB/SUB (Publish/Subscribe): A messaging pattern where publishers send messages to topics, and subscribers listen to topics they care about. Like subscribing to a newsletter -- you get updates without asking each time.

REST: A style of API where each URL represents a resource and HTTP methods (GET, POST, PUT, DELETE) represent actions. The most common API style.

WEBHOOK: A URL that receives notifications when something happens. Like giving someone your phone number and saying "call me when the package arrives."

WEBSOCKET: A persistent two-way connection between client and server. Unlike REST (one question, one answer), WebSockets allow continuous conversation. Like a phone call vs texting.`
},

// === CLAUDE FLOW COOKBOOK (10 entries) ===
{
  path: 'knowledge/teaching/cookbook-spawn-single-agent',
  title: 'Recipe: Spawning a Single Agent to Do Your Bidding',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'agent', 'spawn', 'task tool', 'claude flow', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: One clear task, one agent type, one prompt.

STEP 1: Choose the agent type.
- Need code written? -> coder
- Need research? -> researcher
- Need tests? -> tester
- Need architecture decisions? -> system-architect
- Not sure? -> researcher (understand first, act second)

STEP 2: Write a clear prompt.
BAD: "Fix the auth" (vague, which auth? what is broken?)
GOOD: "Fix the null pointer error in src/auth/login.js line 45 that occurs when session.user is undefined"

STEP 3: Spawn it.
In Claude Code, this happens via the Task tool:
Task({ subagent_type: "coder", prompt: "Fix the null pointer...", description: "Fix auth bug" })

STEP 4: Get the result.
The agent works autonomously and returns its result. Review it, apply it, done.

## When to Use This

Single agent is right when: one file, one problem, one skill needed. If the task touches multiple files or needs multiple skills, consider a swarm instead.

## Common Mistakes

MISTAKE: Spawning a coder when you should spawn a researcher first. Always understand before changing.
MISTAKE: Vague prompts that cause the agent to guess. Be specific about files, functions, and expected behavior.
MISTAKE: Not specifying the agent type. The default may not be the best fit for your task.`
},
{
  path: 'knowledge/teaching/cookbook-parallel-agents',
  title: 'Recipe: Running Multiple Agents in Parallel for Speed',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'parallel', 'agents', 'background', 'speed', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: A task with independent parts, multiple agent types, run_in_background: true.

STEP 1: Identify independent parts.
"Add user authentication" breaks into:
- Research existing auth patterns (independent)
- Design the auth system (depends on research)
- Implement the design (depends on design)
- Write tests (partially independent)
- Review code (depends on implementation)

The research and initial test planning can happen in parallel.

STEP 2: Spawn all independent agents in ONE message.
Critical: all Task calls must be in the SAME response with run_in_background: true.

Task({ subagent_type: "researcher", prompt: "Find auth patterns in codebase", run_in_background: true })
Task({ subagent_type: "system-architect", prompt: "Design auth approach", run_in_background: true })
Task({ subagent_type: "tester", prompt: "Plan test scenarios for auth", run_in_background: true })

STEP 3: Wait. Do not poll. Do not check status every 10 seconds. Let agents work.

STEP 4: When results arrive, synthesize them. The researcher found patterns, the architect designed a system, the tester planned scenarios. Combine into a coherent implementation plan.

## The Key Rule

All agents in ONE message. If you spawn them across multiple messages, they run sequentially, not in parallel. You lose the speed benefit.

## Speed Math

3 agents sequentially: 5 + 5 + 5 = 15 minutes.
3 agents in parallel: max(5, 5, 5) = 5 minutes.
3x faster. The more independent parts, the bigger the speedup.`
},
{
  path: 'knowledge/teaching/cookbook-memory-store-retrieve',
  title: 'Recipe: Storing and Retrieving AI Memory Across Sessions',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'memory', 'persistence', 'sessions', 'claude flow', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: Something worth remembering, a namespace, a key.

## Storing a Memory

npx ruflo@latest memory store --key "pattern-jwt-auth" --value "JWT auth: always check token expiry in middleware, use refresh tokens with 7-day TTL, store tokens in httpOnly cookies" --namespace patterns

Breaking it down:
- --key: A unique name for this memory (like a filename)
- --value: The actual content to remember
- --namespace: A category (patterns, solutions, tasks, default)

## Retrieving a Specific Memory

npx ruflo@latest memory retrieve --key "pattern-jwt-auth" --namespace patterns

This returns the exact value you stored.

## Searching by Meaning

npx ruflo@latest memory search --query "authentication token security" --namespace patterns

This uses vector search to find memories RELATED to your query, even if the words do not match exactly. You might find "pattern-jwt-auth" even though you searched for "authentication token security."

## Listing All Memories

npx ruflo@latest memory list --namespace patterns

Shows all stored memories in a namespace.

## Practical Example

Session 1: You fix a tricky database connection bug.
-> Store: memory store --key "fix-pg-pool-exhaustion" --value "PostgreSQL pool exhaustion: set max:3 in pg.Pool config, add idle timeout, use connection release in finally blocks"

Session 5: You hit another connection problem.
-> Search: memory search --query "database connection problem"
-> Found: "fix-pg-pool-exhaustion" -- you already solved this before!

## The Notebook Analogy

Memory store = writing in your notebook.
Memory retrieve = opening to a specific page.
Memory search = flipping through the notebook looking for something related.
Memory list = reading the table of contents.`
},
{
  path: 'knowledge/teaching/cookbook-kb-search-in-chat',
  title: 'Recipe: Making Every Chat Check the KB First',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'kb', 'mcp', 'search', 'claude.md', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: CLAUDE.md file, KB-first rule, MCP server running.

## The Problem

By default, Claude answers from its training data. But your KB has custom knowledge about RuVector, AIMDS, Ruflo, and your specific architecture that is NOT in any training data. If Claude does not check the KB first, it gives generic answers instead of your expert-curated knowledge.

## The Fix: CLAUDE.md Rule

Add this to your project's CLAUDE.md:

Before answering ANY question about agents, swarms, vectors, embeddings, HNSW, ONNX, MCP, RVF, AIMDS, security, Ruflo, architecture, knowledge bases, or RuVector:

STEP 1: Search the KB
mcp__Ruvnet-KB-first__kb_search({ query: "user's question here", limit: 5 })

STEP 2: Use KB results to inform your answer

STEP 3: If the KB has relevant teaching entries, teach from those, not from training data.

## Why This Works

CLAUDE.md is loaded into EVERY conversation. It is the most reliable way to change Claude's default behavior. By putting the KB-first rule in CLAUDE.md, every future session automatically checks the KB before answering.

## Testing It

Ask Claude: "What is HNSW?"

WITHOUT the rule: Claude gives a generic textbook answer.
WITH the rule: Claude searches the KB, finds your teaching entry "What Is HNSW? The Highway System That Makes AI Search Fast," and teaches from YOUR analogy with YOUR examples.

## The Key Insight

The KB is only useful if Claude actually looks at it. CLAUDE.md is the enforcement mechanism. Without it, the KB is a library that nobody visits.`
},
{
  path: 'knowledge/teaching/cookbook-self-learning-hooks',
  title: 'Recipe: Teaching AI to Learn From Every Task',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'hooks', 'self-learning', 'patterns', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: Ruflo hooks, memory store, discipline.

## Before Each Task

npx ruflo@latest hooks pre-task --description "what you are about to do"

This searches for relevant patterns from previous tasks. If you solved something similar before, the pattern shows up and you start smarter.

## After Each Successful Task

npx ruflo@latest hooks post-task --task-id "task-name" --success true --store-results true

Then store the specific pattern:
npx ruflo@latest memory store --key "pattern-name" --value "what worked and why" --namespace patterns

## After Each Failed Task

Still store it -- failures are more valuable than successes:
npx ruflo@latest memory store --key "antipattern-name" --value "what failed and why -- do NOT repeat this approach" --namespace patterns

## The Compound Effect

Session 1: 0 patterns. Start from scratch.
Session 10: 15 patterns. Start with context.
Session 50: 80 patterns. Start almost expert.
Session 100: You have built a comprehensive institutional knowledge base of what works in YOUR specific project.

## The Journaling Analogy

Self-learning hooks are like a developer journal. After every task, write down: what worked, what failed, what you would do differently. After a year, that journal is more valuable than any textbook because it is about YOUR code, YOUR architecture, YOUR patterns.`
},
{
  path: 'knowledge/teaching/cookbook-security-scan',
  title: 'Recipe: Running a Security Scan on Your AI System',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'security', 'scan', 'audit', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: Ruflo CLI, security commands, time to review results.

## Quick Scan (5 minutes)

npx ruflo@latest security scan --depth quick

This checks for: exposed API keys, common vulnerabilities, insecure configurations. Like a quick walk-through of the building checking that doors are locked.

## Full Audit (30 minutes)

npx ruflo@latest security scan --depth full
npx ruflo@latest security audit

This checks for: everything in quick scan PLUS dependency vulnerabilities, code injection risks, data exposure paths, authentication weaknesses. Like a professional security inspection.

## Interpreting Results

CRITICAL: Fix immediately. This is a real vulnerability that could be exploited.
HIGH: Fix soon. Significant risk but may require specific conditions to exploit.
MEDIUM: Fix when convenient. Minor risk, good practice to address.
LOW: Nice to fix. Minimal risk, mostly about best practices.

## What to Do With Results

1. Fix all CRITICAL issues immediately
2. Create tasks for HIGH issues (fix this week)
3. Note MEDIUM issues for next refactor
4. Ignore LOW unless you have spare time

## When to Scan

After adding new dependencies: new packages may have vulnerabilities.
Before deploying: catch issues before they go live.
Monthly: regular checkups catch drift.
After security incidents: find what else might be affected.`
},
{
  path: 'knowledge/teaching/cookbook-swarm-bug-fix',
  title: 'Recipe: Using a Swarm to Fix a Complex Bug',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'swarm', 'bug fix', 'debugging', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: A bug that spans multiple files, a hierarchical swarm, patience.

## When to Use This

Use a swarm for bugs when: the bug involves 3+ files, you do not know the root cause, or fixing it requires both investigation and implementation.

Do NOT use a swarm for: simple bugs with obvious fixes, single-file issues, or typos.

## The Swarm

STEP 1: Initialize with anti-drift config:
npx ruflo@latest swarm init --topology hierarchical --max-agents 6 --strategy specialized

STEP 2: Spawn the bug-fixing team (all in ONE message):

Task({ subagent_type: "researcher", prompt: "Investigate bug: [description]. Search codebase for related code. Check git log for recent changes. Identify the root cause.", run_in_background: true })

Task({ subagent_type: "coder", prompt: "Once root cause is found, implement the fix. Ensure backward compatibility.", run_in_background: true })

Task({ subagent_type: "tester", prompt: "Write tests that reproduce the bug, then verify the fix resolves it.", run_in_background: true })

STEP 3: Wait for results.

STEP 4: Review. The researcher found the cause, the coder fixed it, the tester verified. Check that the fix makes sense and the tests pass.

## The SWAT Team Analogy

A complex bug is like a crime scene. The researcher is the detective (finds the cause). The coder is the engineer (fixes the damage). The tester is the inspector (verifies everything is safe). Each has a clear role. The hierarchical topology keeps everyone on-task.`
},
{
  path: 'knowledge/teaching/cookbook-ingest-new-knowledge',
  title: 'Recipe: Adding Any New Knowledge to Your KB',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'ingestion', 'knowledge base', 'embeddings', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: Text to ingest, ONNX embedder, PostgreSQL running on port 5435.

## The 5-Step Pipeline

STEP 1: CLEAN the text.
Remove non-ASCII: text.replace(/[^\\x00-\\x7F]/g, '')
Remove smart quotes, emojis, special characters.
Why: The embedding model works best with clean ASCII English.

STEP 2: EMBED the text.
Load ONNX: const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
Embed: const out = await embedder(title + ' ' + text, { pooling: 'mean', normalize: true })
Format: const vec = '[' + Array.from(out.data).join(',') + ']'
Why: 384-dimensional vector that represents the MEANING of your text.

STEP 3: INSERT into kb_complete (primary KB).
INSERT INTO ask_ruvnet.kb_complete (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding) VALUES ($1, $2, $3, $4, $5, 1, $6, $7::ruvector)
Why: This is your master knowledge store.

STEP 4: MIRROR to architecture_docs (MCP-visible).
Use INSERT...SELECT to copy the embedding natively:
INSERT INTO ask_ruvnet.architecture_docs (..., embedding) SELECT ..., kc.embedding FROM ask_ruvnet.kb_complete kc WHERE kc.id = $X
Why: The MCP server searches architecture_docs, not kb_complete. Both tables need the entry.

STEP 5: VERIFY it is searchable.
Search for it: SELECT title, embedding <=> query_vec as distance FROM ask_ruvnet.kb_complete ORDER BY distance LIMIT 3
If your entry appears in the top 3 for a relevant query, it works.

## The Library Analogy

You are adding a book to a smart library. Clean it (Step 1), create a meaning index card (Step 2), file the original (Step 3), put a copy in the public catalog (Step 4), test that the librarian can find it (Step 5).`
},
{
  path: 'knowledge/teaching/cookbook-monitor-swarm',
  title: 'Recipe: Monitoring What Your AI Agents Are Doing',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'monitoring', 'swarm', 'status', 'agents', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: A running swarm, monitoring commands, patience.

## Check Swarm Status

npx ruflo@latest swarm status

Shows: active agents, their roles, current status (working/idle/done), and how long they have been running.

## Check Individual Agent

npx ruflo@latest agent status --name my-coder

Shows: what the agent is currently doing, files it has touched, time elapsed.

## Check Memory Activity

npx ruflo@latest memory list --namespace tasks

Shows: what patterns and results have been stored by agents.

## The Dashboard View

Think of monitoring like a project management dashboard:
- GREEN: Agent is working, producing output, making progress.
- YELLOW: Agent is taking longer than expected but still active.
- RED: Agent has stalled, errored, or drifted off-task.

## When to Intervene

DO NOT intervene if: agents are working and producing relevant output. Even if it seems slow, give them time.

INTERVENE if: an agent has been idle for 5+ minutes with no output, an agent is modifying files unrelated to its task (drift), or you see error messages.

## The Kitchen Check

Monitoring a swarm is like a head chef checking the kitchen. You do not stand over every cook's shoulder. You walk through, check that each station is working on the right dish, and step in only if something is burning or someone is making the wrong order.`
},
{
  path: 'knowledge/teaching/cookbook-optimize-search',
  title: 'Recipe: Tuning Search Quality for Better Results',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['recipe', 'search', 'quality', 'tuning', 'threshold', 'cookbook'],
  content: `## The Recipe

INGREDIENTS: Test queries, distance measurements, quality score adjustments.

## Step 1: Establish a Baseline

Pick 10 questions that you know the KB should answer well. Run each through knowledge_search() and record the results. Note: which entry came first? What was the distance? Was it the RIGHT entry?

## Step 2: Identify Problems

PROBLEM A: Wrong entry ranks first.
FIX: Check the quality_score and source_authority of competing entries. Expert-curated (quality 99) should outrank auto-ingested (quality 50). If not, the content of the wrong entry may be a closer semantic match -- rewrite your target entry to use more specific language.

PROBLEM B: Right entry not in top 5.
FIX: The entry's content may not cover the vocabulary of the query. Rewrite the first 200 words to include the key terms people would search for. The first 1500 characters are what gets embedded.

PROBLEM C: All results have high distance (>0.6).
FIX: Your KB does not have good content for this topic. Add a new teaching entry that specifically addresses it.

## Step 3: Re-test

After making changes, re-run your 10 test queries. Compare to the baseline. Each change should improve at least some queries without making others worse.

## The Metal Detector Analogy

Tuning search is like calibrating a metal detector:
- Too sensitive (threshold too high): You find everything, including trash. Many irrelevant results.
- Too strict (threshold too low): You miss buried treasure. Good results filtered out.
- Just right: You find coins and jewelry, skip the bottle caps.

The sweet spot for most KB searches: accept results with distance < 0.5, flag results 0.5-0.7 as "possibly relevant," ignore anything > 0.7.`
},

// === CLAUDE FLOW AWARENESS (5 entries) ===
{
  path: 'knowledge/teaching/cf-why-ruflo-exists',
  title: 'Why Ruflo Exists: The Problem It Solves',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['claude flow', 'orchestration', 'agents', 'coordination', 'history'],
  content: `## The Problem Before Ruflo

Without Ruflo, every AI interaction is:
- ONE agent at a time (Claude Code runs one conversation)
- NO memory between sessions (start from scratch every time)
- NO coordination between agents (if you spawn multiple, they cannot share information)
- NO self-learning (the AI makes the same mistakes repeatedly)
- NO fault tolerance (if something fails, you start over manually)

This is like running a company where every employee works alone, has amnesia every morning, cannot talk to coworkers, never learns from mistakes, and quits if they hit any obstacle.

## What Ruflo Adds

MULTI-AGENT ORCHESTRATION: Run 5-15 agents simultaneously, each with a specialized role. The coordinator ensures they work toward the same goal.

PERSISTENT MEMORY: Store patterns, solutions, and context that survive across conversations. The AI gets smarter over time.

SELF-LEARNING HOOKS: Automatic triggers that record what works and what fails. Every task makes the system better at the next task.

CONSENSUS PROTOCOLS: When agents disagree, they vote. Byzantine fault tolerance means the group decision is correct even if some agents malfunction.

FAULT TOLERANCE: If an agent fails, the swarm continues. The coordinator reassigns the failed task or spawns a replacement.

## The Operating System Analogy

Before Ruflo, using AI was like running one program at a time on an old computer. Ruflo is like installing a modern operating system: now you can run multiple programs, they share memory, they communicate, and the system manages resources automatically.

## For Stuart Specifically

Your goal is to build a personal AI tutor. Without Ruflo, every session starts from zero and you re-explain everything. With Ruflo: the KB provides the knowledge, hooks provide the learning, memory provides the context, and swarms provide the workforce. The system gets better every time you use it.`
},
{
  path: 'knowledge/teaching/cf-architecture-overview',
  title: 'Ruflo Architecture: The 10,000-Foot View',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['claude flow', 'architecture', 'layers', 'overview', 'system design'],
  content: `## The Five Layers

Think of Ruflo as a five-story building. Each floor serves a different purpose, and they work together.

### Floor 1: CLI Commands (The Lobby)
What you interact with. Commands like swarm init, agent spawn, memory search. This is the front door of the building -- you tell it what you want, and it routes your request to the right floor.

### Floor 2: Agent System (The Offices)
Where agents live and work. The Task tool spawns agents, each with a type (coder, researcher, tester). Agents run independently in their own context, like employees in their own offices.

### Floor 3: Memory System (The Library)
Where knowledge lives. Three parts: AgentDB (fast key-value store), PostgreSQL KB (permanent vector-searchable knowledge), and session state (conversation context). Agents can read and write to the library.

### Floor 4: Hook System (The Nervous System)
27 hooks that fire on events. Pre-task hooks check memory before starting. Post-task hooks store results after finishing. Route hooks decide which agent should handle a task. Like the building's wiring -- you do not see it, but it makes everything work.

### Floor 5: Neural Patterns (The Brain)
SONA, MoE, and HNSW-indexed patterns. The system learns which approaches work for which tasks. Over time, routing gets smarter, agents get more effective, and the system adapts. Like the building getting smarter about its own energy usage.

## How They Connect

A request enters at Floor 1 (CLI). Floor 4 (hooks) checks memory on Floor 3 (library). Floor 2 (agents) does the work. Results go back through Floor 4 (hooks) to Floor 3 (memory) and Floor 5 (patterns). Next time, Floor 5 makes Floor 4 route better, which makes Floor 2 work smarter.

## The Key Insight

No single floor is the "important" one. The power is in how they connect. An agent without memory forgets everything. Memory without hooks is never updated. Hooks without agents have nothing to trigger on. The system is greater than the sum of its parts.`
},
{
  path: 'knowledge/teaching/cf-memory-system-deep',
  title: 'Ruflo Memory: Three Levels of Remembering',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['memory', 'persistence', 'context window', 'agentdb', 'postgresql', 'claude flow'],
  content: `## Level 1: Context Window (Short-Term Memory)

What: Everything in the current conversation -- your messages, Claude's responses, tool results, file contents.
Duration: This conversation only. When you start a new chat, it is gone.
Size: About 200K tokens (roughly 150K words) for Claude.
Analogy: The stuff you can hold in your head while working on a problem. Useful RIGHT NOW but gone when you sleep.

When context fills up, old messages get compressed (summarized to save space) or dropped. This is why long conversations sometimes "forget" things from the beginning.

## Level 2: Ruflo Memory (Medium-Term Memory)

What: Key-value pairs stored in AgentDB with vector search capability.
Duration: As long as you want -- survives across conversations.
Access: memory store / memory retrieve / memory search CLI commands.
Analogy: A notebook you keep in your desk. You write important things down, and can flip through it later.

Namespaces organize memories by category:
- "patterns" = solution patterns that worked
- "tasks" = task history and outcomes
- "default" = everything else

## Level 3: Knowledge Base (Long-Term Memory)

What: Curated entries in PostgreSQL with ONNX embeddings, searchable by meaning.
Duration: Permanent.
Access: MCP kb_search (Claude searches it automatically), or direct SQL queries.
Analogy: An encyclopedia on the shelf. Comprehensive, well-organized, always available.

The KB is different from memory in that it is CURATED. Someone (you, or an ingestion script) deliberately created each entry, quality-scored it, and embedded it. Memory is notes. KB is published knowledge.

## How They Work Together

Example: Stuart asks "What is HNSW?"

1. Claude checks context window -- was HNSW discussed earlier in this conversation?
2. Claude searches KB via MCP -- finds the teaching entry "What Is HNSW? The Highway System..."
3. Claude checks Ruflo memory -- has this question been asked before? Was there a pattern stored?

The answer combines: fresh context (Level 1) + curated knowledge (Level 3) + learned patterns (Level 2). This is why the system gets better over time -- each level adds a layer of intelligence.`
},
{
  path: 'knowledge/teaching/cf-hooks-nervous-system',
  title: 'Ruflo Hooks: The Nervous System of Self-Learning',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['hooks', 'self-learning', 'nervous system', 'triggers', 'claude flow'],
  content: `## Hooks Are Triggers

A hook is code that runs automatically when something happens. Like a motion sensor that turns on lights when you walk into a room -- you do not manually flip the switch every time.

## The Four Types of Hooks

### Sensory Hooks (Input)
PRE-EDIT: Fires before editing a file. Checks: what context should the editor know? What patterns worked for this file before?
PRE-COMMAND: Fires before running a command. Checks: is this command safe? Has it failed before?
PRE-TASK: Fires before starting a task. Checks: has a similar task been done? What worked last time?

### Processing Hooks (Routing)
ROUTE: Analyzes a task and recommends which agent type should handle it. Like a hospital triage nurse.
EXPLAIN: Explains why a particular routing decision was made.
COVERAGE-ROUTE: Routes based on test coverage gaps -- prioritizes under-tested areas.

### Motor Hooks (Output)
POST-EDIT: Fires after editing a file. Records: did the edit succeed? Should the pattern be stored for training?
POST-COMMAND: Fires after running a command. Records: did it succeed? How long did it take?
POST-TASK: Fires after completing a task. Records: success/failure, what approach was used, should this pattern be stored?

### Learning Hooks (Growth)
PRETRAIN: Analyzes the entire repository and bootstraps intelligence.
BUILD-AGENTS: Generates optimized agent configurations based on learned patterns.
METRICS: Shows a dashboard of learning progress.
NEURAL: Trains neural patterns on accumulated data.

## The Nervous System Analogy

Your nervous system works in the same four stages:
1. SENSE (sensory hooks): Touch something hot
2. PROCESS (routing hooks): Brain routes signal to the right response
3. ACT (motor hooks): Pull your hand away
4. LEARN (learning hooks): Remember not to touch that again

Ruflo's hooks do exactly this for AI tasks. Sense the context, route to the right handler, execute the action, learn from the result.

## Why This Matters for Stuart

Without hooks, you manually have to remind Claude about patterns, manually check for mistakes, and manually store what worked. With hooks, all of this happens automatically. The system learns as a side effect of normal usage.`
},
{
  path: 'knowledge/teaching/cf-swarm-patterns-five',
  title: 'Five Swarm Patterns for Common Tasks',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['swarm', 'patterns', 'templates', 'recipes', 'claude flow'],
  content: `## Pattern 1: Code Sprint (Build a Feature)

TOPOLOGY: Hierarchical. AGENTS: 6-8.
TEAM: coordinator + researcher + architect + 2 coders + tester + reviewer.
FLOW: Research -> Design -> Implement (parallel coders) -> Test -> Review.
USE WHEN: Building a new feature that touches multiple files.

## Pattern 2: Research Mission (Understand Something)

TOPOLOGY: Mesh. AGENTS: 3-5.
TEAM: 3-5 researcher agents, each exploring a different angle.
FLOW: All research in parallel -> Synthesize findings.
USE WHEN: You need to understand a codebase, debug a complex issue, or evaluate options.

## Pattern 3: Security Audit (Find Vulnerabilities)

TOPOLOGY: Star (security-architect at center). AGENTS: 4-6.
TEAM: security-architect + security-auditor + pii-detector + code-analyzer + reviewer.
FLOW: All agents scan independently -> Security architect synthesizes.
USE WHEN: Before deploying, after adding new features, or on a regular schedule.

## Pattern 4: Bug Hunt (Fix Complex Bugs)

TOPOLOGY: Hierarchical. AGENTS: 4.
TEAM: coordinator + researcher + coder + tester.
FLOW: Researcher investigates -> Coder fixes -> Tester verifies.
USE WHEN: Bug spans multiple files or root cause is unknown.

## Pattern 5: Full Feature (Everything)

TOPOLOGY: Hierarchical-mesh. AGENTS: 8-12.
TEAM: coordinator + 2 researchers + architect + 3 coders + 2 testers + reviewer.
FLOW: Research -> Design -> Implement (parallel) -> Test (parallel) -> Review.
USE WHEN: Major feature or significant refactor. The "all hands on deck" pattern.

## Choosing a Pattern

Simple bug -> Pattern 4 (Bug Hunt)
Understanding code -> Pattern 2 (Research Mission)
New feature -> Pattern 1 (Code Sprint)
Security check -> Pattern 3 (Security Audit)
Major work -> Pattern 5 (Full Feature)

## The Key Insight

You do not need to design a new swarm for every task. These five patterns cover 90% of development work. Pick the pattern, adjust the prompts, run it.`
},
];

async function main() {
  console.log(`=== Teaching Batch 3: ${entries.length} Entries ===\n`);
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

  const { rows: [counts] } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM ask_ruvnet.kb_complete WHERE category = 'teaching') as kb_teaching,
      (SELECT COUNT(*) FROM ask_ruvnet.kb_complete) as kb_total,
      (SELECT COUNT(*) FROM ask_ruvnet.architecture_docs WHERE doc_id LIKE 'kb-complete-%' AND source_authority = 'expert-curated') as arch_expert
  `);

  console.log(`\n=== Batch 3 Complete ===`);
  console.log(`Inserted: ${inserted} | Skipped: ${skipped}`);
  console.log(`Total teaching in kb_complete: ${counts.kb_teaching}`);
  console.log(`Total entries in kb_complete: ${counts.kb_total}`);
  console.log(`Total expert-curated in architecture_docs: ${counts.arch_expert}`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
