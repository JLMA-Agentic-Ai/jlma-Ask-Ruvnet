#!/usr/bin/env node
/**
 * Teaching Batch 4: Gap closers to push from 82 to 95+
 * Targets the weakest areas: advanced concepts, deep debugging, end-to-end examples, CF ops
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
  if (rows.length > 0) { kbId = rows[0].id; }
  else {
    const { rows: [existing] } = await pool.query(`SELECT id FROM ask_ruvnet.kb_complete WHERE file_path = $1`, [entry.path]);
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
// === ADVANCED CONCEPTS IN PLAIN ENGLISH (6) ===
{
  path: 'knowledge/teaching/what-is-lora-ewc',
  title: 'LoRA and EWC: How AI Learns Without Forgetting',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['lora', 'ewc', 'learning', 'forgetting', 'fine-tuning', 'beginner'],
  content: `## The Problem: Catastrophic Forgetting

Imagine learning Spanish, and every time you learn a new word, you forget an English word. That is catastrophic forgetting -- the biggest problem in AI learning. When an AI learns something new, it tends to overwrite what it already knew.

## LoRA: The Cheat Sheet Approach

LoRA (Low-Rank Adaptation) is like giving a student a specialized cheat sheet instead of rewriting their entire brain.

Instead of changing ALL the weights (numbers) in an AI model, LoRA only changes a tiny subset -- like adding sticky notes to a textbook instead of rewriting the textbook. The result: the AI gets specialized for your task while keeping all its original knowledge intact.

In Claude Flow, micro-LoRA learning happens during use. As Claude works on your code, it builds tiny specialized adaptations for YOUR codebase patterns without losing its general coding ability.

## EWC: The Elastic Safety Net

EWC (Elastic Weight Consolidation) works differently. It identifies which weights in the model are IMPORTANT for tasks the AI already knows, then makes those weights "sticky" -- harder to change.

Analogy: Imagine your brain has a "lock importance" dial for each memory. The memories of how to breathe and walk are locked at maximum. Memories of what you had for lunch are barely locked. EWC does this for AI -- it locks the important knowledge and lets less important knowledge be updated.

EWC++ (used in Claude Flow) is the advanced version that can handle learning many tasks sequentially without degradation.

## Why You Should Care

Without LoRA and EWC, your AI tutor would forget yesterday's lessons every time it learns something new. WITH them, the AI accumulates knowledge like a human expert -- each session adds to the foundation without destroying it. This is why Claude Flow gets smarter over time instead of resetting.`
},
{
  path: 'knowledge/teaching/what-is-byzantine-consensus',
  title: 'Byzantine Consensus: How AI Agents Agree When Some Might Be Wrong',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['byzantine', 'consensus', 'fault tolerance', 'voting', 'swarm', 'beginner'],
  content: `## The Byzantine Generals Problem

Imagine 10 army generals surrounding a city. They need to agree: attack or retreat. But 3 of the generals are traitors who will send conflicting messages. How do the loyal generals make a correct decision when they cannot trust everyone?

This is the Byzantine Generals Problem, and it is EXACTLY the challenge AI swarms face. When you have 10 agents working on a task, some might malfunction, produce garbage, or even be manipulated by prompt injection. How does the swarm make correct decisions anyway?

## The Solution: Byzantine Fault Tolerance (BFT)

BFT works if fewer than 1/3 of participants are faulty. With 10 agents, up to 3 can malfunction and the group still makes correct decisions.

How it works:
1. Each agent proposes an answer
2. All agents share their proposals with everyone else
3. Each agent checks: "Do most agents agree?"
4. The majority answer wins, even if some agents lied

## In Claude Flow

Claude Flow's hive-mind consensus system uses BFT. When agents vote on a decision (like "should we refactor this function?"), the system tolerates malfunctioning agents. If 2 out of 8 agents produce bad answers, the other 6 overrule them.

## When This Matters

For your personal tutor: rarely. BFT matters most in production systems where agents process user data or make critical decisions. But understanding it helps you understand WHY Claude Flow has consensus protocols -- it is building for reliability at scale.

## The Jury Analogy

A jury verdict requires majority agreement. Even if some jurors are confused or biased, the group usually reaches a correct verdict. BFT is the mathematical guarantee that this works, with precise limits on how many "bad jurors" the system can tolerate.`
},
{
  path: 'knowledge/teaching/what-is-crdt',
  title: 'CRDTs: How Distributed AI Agents Share State Without Conflicts',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['crdt', 'distributed', 'conflict', 'state', 'synchronization', 'beginner'],
  content: `## The Problem: Two Agents Edit the Same Thing

Agent A adds "function login()" to a file. Agent B adds "function logout()" to the same file. At the same time. Without coordination, one overwrites the other. This is the conflict problem in distributed systems.

## CRDTs: Conflict-Free by Design

CRDT stands for Conflict-free Replicated Data Type. It is a special kind of data structure where ANY combination of edits can be merged automatically without conflicts.

The key insight: design your data so that merging is always possible. Instead of "set the value to X" (which conflicts), use "add X to the set" (which never conflicts -- you just union the sets).

## Real-World Analogy: The Shopping List

You and your partner both have a copy of the shopping list on your phones. You add "milk." They add "eggs." When your phones sync, the list has both "milk" and "eggs." No conflict, no data loss. That is a CRDT -- a grow-only set where additions never conflict.

## In Claude Flow

Claude Flow uses CRDTs for agent memory synchronization. When multiple agents write to shared memory simultaneously, CRDTs ensure all updates are preserved. Agent A stores "found auth bug in line 45" and Agent B stores "found auth bug in line 67" -- both entries survive, no conflict.

The alternative (locks and transactions) would force agents to wait in line, destroying the speed advantage of parallel execution.

## When This Matters

CRDTs matter whenever agents work in parallel on shared state. For a personal tutor, this means your agents can all update memory simultaneously without losing information.`
},
{
  path: 'knowledge/teaching/what-is-sona-simple',
  title: 'SONA: The Self-Tuning Brain That Makes Everything Faster',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['sona', 'self-optimizing', 'neural', 'adaptation', 'performance', 'beginner'],
  content: `## What SONA Does

SONA (Self-Optimizing Neural Architecture) automatically tunes Claude Flow's behavior based on what is happening RIGHT NOW. In under 0.05 milliseconds -- that is 50 microseconds, faster than you can blink -- SONA adjusts how the system processes your request.

## The Thermostat Analogy

A thermostat does not just heat or cool. It SENSES the current temperature, COMPARES it to your desired temperature, and ADJUSTS accordingly. If you open a window, it adapts instantly.

SONA does this for AI operations:
- Task is simple? Route to a fast, cheap model (Haiku).
- Task is complex? Route to a powerful model (Opus).
- System under heavy load? Reduce parallelism.
- Pattern recognized from last time? Skip the research phase.

## Why 0.05ms Matters

If SONA took 1 second to decide how to route a task, you would NOTICE the delay. At 0.05ms, the optimization happens so fast it is invisible. Every request is automatically optimized without any perceptible cost.

## How It Learns

SONA uses the Mixture of Experts (MoE) pattern. Think of it as having 10 specialists, and SONA learns which specialist is best for which type of task. Over time, routing gets more accurate because SONA has seen more examples.

## For Stuart

You do not need to configure SONA. It runs automatically inside Claude Flow. But understanding it helps you appreciate WHY Claude Flow gets faster and more accurate the more you use it. It is not magic -- it is adaptive optimization.`
},
{
  path: 'knowledge/teaching/what-is-mincut-graph',
  title: 'MinCut: How AI Systems Self-Heal by Cutting Bad Connections',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['mincut', 'graph', 'self-healing', 'partitioning', 'network', 'beginner'],
  content: `## The Problem: Bad Connections

In a network of AI agents, some connections may become unreliable -- an agent is slow, producing errors, or compromised. How do you isolate the problem without shutting down the whole network?

## MinCut: The Surgical Approach

MinCut is a graph algorithm that finds the MINIMUM number of connections to cut in order to separate a network into two parts. Think of it like a surgeon removing a tumor -- cut the minimum amount of tissue to isolate the problem while keeping the rest of the body healthy.

## The Bridge Analogy

Imagine a city with many bridges. A flood is coming from the east side. You need to find the FEWEST bridges to close to protect the west side. MinCut finds those bridges -- the minimum cuts that separate the safe zone from the danger zone.

## In RuVector and Claude Flow

Dynamic MinCut is used for:
1. SELF-HEALING: When an agent malfunctions, MinCut isolates it from the swarm by cutting the minimum connections, keeping the rest of the swarm working.
2. GRAPH PARTITIONING: When the agent network grows too large, MinCut divides it into efficient sub-networks.
3. SECURITY: When a potential threat is detected, MinCut quarantines the affected agents with minimal disruption.

The "dynamic" part means it adapts in real-time as the network changes. Agents join, leave, or fail, and MinCut continuously recalculates the optimal cuts.

## Why You Should Care

MinCut is why Claude Flow swarms are resilient. If one of your 8 agents crashes, the system does not collapse -- MinCut isolates the failed agent and the other 7 continue working. This is self-healing in action.`
},
{
  path: 'knowledge/teaching/what-is-hyperbolic-embedding',
  title: 'Hyperbolic Embeddings: When Regular Vectors Are Not Enough',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['hyperbolic', 'embeddings', 'poincare', 'hierarchy', 'tree', 'advanced'],
  content: `## The Problem with Regular Embeddings

Regular embeddings (like our 384-dimensional vectors) work great for flat relationships -- "dog" is similar to "cat." But they struggle with HIERARCHICAL relationships -- "poodle is a type of dog, which is a type of animal."

In flat space, you cannot represent hierarchies well. It is like trying to draw a family tree on a flat piece of paper where everyone is the same distance apart.

## Hyperbolic Space: Where Trees Live Naturally

Hyperbolic space is curved space where the amount of room GROWS exponentially as you move outward from the center. Think of it like a tree: the trunk is at the center, branches spread outward, and leaves are at the edges. There is much more room at the edges than at the center.

In hyperbolic space, "animal" lives near the center, "dog" is one branch out, "poodle" is at the edge. The hierarchical relationship is captured naturally by the geometry.

## The Poincare Ball Model

The Poincare ball is the standard way to implement hyperbolic embeddings. Imagine a snow globe: the center represents the most general concepts, and the surface represents the most specific. Distance from center = specificity.

## In RuVector

RuVector supports hyperbolic embeddings through the Poincare ball model. This is critical for:
- CODE HIERARCHIES: Modules contain classes, classes contain methods. Hyperbolic embeddings capture this naturally.
- KNOWLEDGE TAXONOMIES: General concepts (AI) -> specific concepts (HNSW index optimization). The hierarchy is preserved in the embedding.
- AGENT HIERARCHIES: Queen -> coordinators -> workers. The command structure is embedded geometrically.

## When to Use

Regular embeddings: For most KB searches where you want "find similar content."
Hyperbolic embeddings: When your data has tree-like hierarchies and you need to preserve parent-child relationships in the embedding space.

Most of your daily usage will be regular embeddings. Hyperbolic embeddings are the advanced tool for when hierarchy matters.`
},

// === END-TO-END EXAMPLES (3) ===
{
  path: 'knowledge/teaching/example-complete-feature-walkthrough',
  title: 'End-to-End: Building a Complete Feature with Claude Flow',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['end-to-end', 'feature', 'walkthrough', 'complete', 'tutorial'],
  content: `## The Scenario

You want to add a "search history" feature to Ask Ruvnet. Users should be able to see their recent searches and re-run them.

## Phase 1: Plan (5 minutes)

Tell Claude: "I want to add search history. Plan it."

Claude Flow routes to a planner agent. The planner:
1. Searches the KB for existing patterns
2. Checks the codebase structure
3. Proposes: new PostgreSQL table, API endpoint, UI component

## Phase 2: Swarm Execution (15 minutes)

Claude spawns a swarm:
- ARCHITECT designs the table schema and API
- CODER implements the database migration
- CODER implements the API endpoint
- CODER implements the UI component
- TESTER writes tests for all three parts

All work in parallel. The hierarchical coordinator keeps them aligned.

## Phase 3: Review (5 minutes)

Claude spawns a reviewer agent that checks:
- Security: Is search history per-user? Can users see others' history?
- Performance: Is the history table indexed?
- Quality: Does the code match existing patterns?

## Phase 4: Verify (2 minutes)

Run the tests. Check the database. Manually test the feature.

## Phase 5: Learn (1 minute)

Post-task hook stores: "search history feature pattern: new table + API + UI component. Used hierarchical swarm with 5 agents. Completed in 27 minutes."

Next time you build a similar feature, Claude starts with this pattern.

## Total Time: ~28 minutes

Without Claude Flow: You'd write everything yourself, sequentially. Probably 2-3 hours.
With Claude Flow: Parallel execution + KB patterns + learned optimizations = under 30 minutes.

## The Key Takeaway

The power is not in any single step. It is in the PIPELINE: plan with KB context, execute in parallel, review automatically, learn for next time. Each step makes the next one better.`
},
{
  path: 'knowledge/teaching/example-debug-real-scenario',
  title: 'Real Debugging Scenario: Search Returns Empty Results',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['debugging', 'real-world', 'search', 'empty results', 'walkthrough'],
  content: `## The Problem

You ask Claude about HNSW and get "I could not find relevant information in the knowledge base." But you KNOW there are entries about HNSW. What went wrong?

## Step 1: Check the MCP Connection

Ask Claude to run: mcp__Ruvnet-KB-first__kb_status()

If this fails, the MCP server is not connected. Restart Claude Code. Problem solved.

If it succeeds, continue.

## Step 2: Check the Database Directly

psql -h localhost -p 5435 -U postgres -c "SELECT COUNT(*) FROM ask_ruvnet.architecture_docs WHERE title ILIKE '%hnsw%'"

If count is 0: The entries are in kb_complete but NOT in architecture_docs. The MCP server only searches architecture_docs. Run migrate-kb-to-mcp.mjs to copy them.

If count > 0: The entries exist. The problem is in the search.

## Step 3: Test the Embedding

Generate an embedding for "HNSW" and check distances:

SELECT title, embedding <=> query_vec as distance FROM ask_ruvnet.architecture_docs WHERE title ILIKE '%hnsw%'

If distance is NULL: The entry has no embedding. Re-embed it.
If distance > 0.7: The embedding does not match well. The content may need rewriting.
If distance < 0.5: The entry should be found. Check the knowledge_search() function parameters.

## Step 4: Check knowledge_search() Parameters

The MCP server calls knowledge_search() with specific parameters. If min_quality is set too high, or max_expertise too low, entries get filtered out.

## The Fix

In this real scenario, the most common cause is: entries in kb_complete but NOT mirrored to architecture_docs. The fix is always: run the migration script, verify both tables have the entry, test the search.

## Lesson Learned

When search returns nothing, trace the pipeline: MCP connected? -> Entry in architecture_docs? -> Entry has embedding? -> Embedding matches query? -> Filters not excluding it? The problem is always in one of these five steps.`
},
{
  path: 'knowledge/teaching/example-deploy-to-production',
  title: 'From Local Development to Production: Deployment Walkthrough',
  category: 'teaching', quality: 99, knowledge_type: 'procedure',
  concepts: ['deployment', 'production', 'walkthrough', 'checklist', 'tutorial'],
  content: `## The Journey

Your AI system works on your laptop. Now you want it running 24/7 for real users. Here is what changes and why.

## Step 1: Database (PostgreSQL)

LOCAL: PostgreSQL on port 5435, no password, localhost.
PRODUCTION: PostgreSQL on a managed service (AWS RDS, Railway, etc.), strong password, SSL required, connection pooling.

Change: Update connection strings, add SSL, use environment variables for credentials (NEVER hardcode).

## Step 2: Embeddings

LOCAL: ONNX model downloaded to ~/.cache, runs on your CPU.
PRODUCTION: Same ONNX model, but pre-downloaded in the Docker image. Consider GPU instance for high-volume embedding.

Change: Include model in deployment, add health check for model loading.

## Step 3: MCP Server

LOCAL: Runs via stdio, started by Claude Code.
PRODUCTION: Runs as a standalone HTTP service, behind a load balancer.

Change: Switch transport from stdio to HTTP. Add authentication. Add rate limiting.

## Step 4: Security Checklist

- All API keys in environment variables (not in code)
- Database credentials via secrets manager
- HTTPS only (no HTTP)
- Rate limiting on all endpoints
- Input validation on all user inputs
- PII scanning on AI outputs
- Audit logging enabled

## Step 5: Monitoring

- Health check endpoint (returns 200 if everything works)
- Error tracking (Sentry or similar)
- Database connection monitoring
- Embedding model health check
- Search quality metrics (average distance of top results)

## The Key Difference

Development is about making it WORK. Production is about making it KEEP WORKING when things go wrong -- and they will. Every production checklist item exists because someone learned the hard way that skipping it causes outages.`
},

// === DEEP DEBUGGING (3) ===
{
  path: 'knowledge/teaching/debug-kb-search-quality-deep',
  title: 'Deep Guide: Why My KB Search Results Are Bad (And How to Fix Them)',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['search quality', 'debugging', 'embeddings', 'ranking', 'deep guide'],
  content: `## The Diagnosis Framework

Bad search results have exactly 5 possible causes. Check them in order.

## Cause 1: The Content Does Not Match the Query Vocabulary

Your entry is titled "RVF Cognitive Containers" but users search for "vector database." The embedding for "RVF Cognitive Containers" is far from "vector database" in meaning-space because RVF is a proprietary term not in the embedding model's vocabulary.

FIX: Rewrite the first 200 words to include common search terms. "RVF (Root Vector Format) is a cognitive container -- think of it as an intelligent vector database that..." Now the embedding captures both the proprietary term AND the common term.

## Cause 2: The Entry Is Too Short

An entry with only 50 words produces a weak embedding -- not enough signal for the model to understand meaning. Short entries embed as vague, generic vectors that match many queries poorly.

FIX: Expand to at least 300 words. Include context, examples, and related terms.

## Cause 3: The Entry Is Too Broad

A mega-entry covering "Everything About AI" matches every query somewhat but no query well. It is the jack of all trades, master of none.

FIX: Split into focused entries. One entry per concept. "What Is HNSW" and "What Is ONNX" rank better than "All About AI Infrastructure."

## Cause 4: Competing Entries

Two entries cover similar topics. The less relevant one sometimes outranks the better one because its embedding happens to be slightly closer to the query.

FIX: Differentiate the entries. Make sure each has unique vocabulary in its first 200 words. Or merge them if they really cover the same thing.

## Cause 5: Wrong Quality Scores

Auto-ingested entries (quality 50) compete with expert-curated entries (quality 99). The knowledge_search() function uses quality scores for ranking. If your expert entry has a lower quality score than it should, it gets outranked.

FIX: Ensure all expert-curated entries have quality 95-99 and source_authority = 'expert-curated'.

## The Testing Protocol

1. Pick 10 queries you KNOW the KB should answer.
2. For each, record: top result, distance, was it the RIGHT result?
3. For each wrong result, diagnose which of the 5 causes applies.
4. Fix and re-test. Iterate until 9/10 queries return the right result.`
},
{
  path: 'knowledge/teaching/debug-hooks-not-firing',
  title: 'Hooks Not Working? Debugging the Self-Learning Pipeline',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['hooks', 'debugging', 'self-learning', 'claude flow', 'troubleshooting'],
  content: `## The Problem

You set up self-learning hooks but the AI does not seem to be getting smarter. Patterns are not being stored, or stored patterns are not being found.

## Check 1: Is the Daemon Running?

Hooks run through the Claude Flow daemon. If it is not running, hooks do not fire.

npx @claude-flow/cli@latest daemon status

If stopped: npx @claude-flow/cli@latest daemon start

## Check 2: Are Hooks Registered?

npx @claude-flow/cli@latest hooks list

You should see pre-task, post-task, and other hooks listed. If empty, hooks were never configured.

## Check 3: Is Memory Working?

npx @claude-flow/cli@latest memory list --namespace patterns

If empty: no patterns have been stored. Either post-task hooks are not storing, or the memory backend is not configured.

Test manually: npx @claude-flow/cli@latest memory store --key "test-hook" --value "hello" --namespace patterns
Then: npx @claude-flow/cli@latest memory retrieve --key "test-hook" --namespace patterns

If the test works but hooks don't: the hook is not calling memory store correctly.

## Check 4: Is the Hook Actually Executing?

Add --verbose to hook commands:
npx @claude-flow/cli@latest hooks pre-task --description "test task" --verbose

This shows exactly what the hook does. If it errors, you'll see why.

## The Most Common Issue

The most common reason hooks "don't work" is that they ARE working, but the stored patterns are in a different namespace than where you're searching. Make sure store and search use the same --namespace.

## The Electrician Analogy

Debugging hooks is like debugging electrical wiring. Check: Is there power? (daemon running) Is the circuit connected? (hooks registered) Is the outlet working? (memory backend) Is the device plugged in correctly? (right namespace)? Follow the current from source to destination.`
},
{
  path: 'knowledge/teaching/debug-network-and-api-issues',
  title: 'Network and API Issues: When the Cloud Fails You',
  category: 'teaching', quality: 99, knowledge_type: 'troubleshooting',
  concepts: ['network', 'api', 'rate limit', 'timeout', 'debugging', 'cloud'],
  content: `## Common API Failures and Their Fixes

### Rate Limiting (429 Too Many Requests)
MEANS: You're sending too many requests too fast. The API is protecting itself.
FIX: Reduce parallel agents (from 10 to 5), add delays between requests, or use a rate limiter.
SYMPTOMS: Agents work for a while then all stop at once.

### Timeout (Request Timeout)
MEANS: The API took too long to respond. Usually because the model is processing a complex prompt.
FIX: Simplify the prompt, reduce context length, or increase timeout settings.
SYMPTOMS: Agent works on simple tasks but fails on complex ones.

### Connection Refused
MEANS: Cannot reach the server at all. Internet down, DNS failure, or server outage.
FIX: Check your internet. Check status.anthropic.com. Try again in a few minutes.
SYMPTOMS: Nothing works, all agents fail immediately.

### Authentication Error (401/403)
MEANS: Your API key is wrong, expired, or lacks permission.
FIX: Check ANTHROPIC_API_KEY environment variable. Regenerate if needed.
SYMPTOMS: Consistent failure on all requests with auth error messages.

### Context Too Long (400 Bad Request)
MEANS: You're sending more text than the model's context window allows.
FIX: Reduce the amount of context. Use summaries instead of full files. Break tasks into smaller pieces.
SYMPTOMS: Works on small tasks, fails on tasks involving large files.

## The Diagnosis Order

1. Can you reach the internet? (ping google.com)
2. Is the API up? (check status page)
3. Is your key valid? (simple test request)
4. Are you within rate limits? (check response headers)
5. Is your request too large? (check payload size)

## The Phone Call Analogy

API failures are like failed phone calls:
- Rate limit = busy signal (too many callers)
- Timeout = no answer (taking too long)
- Connection refused = no service (network down)
- Auth error = wrong number (bad credentials)
- Context too long = voicemail full (too much data)`
},

// === CLAUDE FLOW OPS & PRODUCTION (3) ===
{
  path: 'knowledge/teaching/cf-limitations-honest',
  title: 'Claude Flow Limitations: What It Cannot Do (Honest Assessment)',
  category: 'teaching', quality: 99, knowledge_type: 'concept',
  concepts: ['claude flow', 'limitations', 'honest', 'trade-offs', 'reality'],
  content: `## What Claude Flow Cannot Do

Being honest about limitations is more useful than overpromising. Here is what CF cannot do well -- and what to do instead.

### Cannot Replace Human Judgment on Critical Decisions
CF agents can analyze, recommend, and implement. But for decisions with significant consequences (deploying to production, deleting data, choosing architecture for a startup), a human should make the final call. Use CF to INFORM your decision, not MAKE it.

### Cannot Guarantee Agent Quality
Agents produce variable quality output. A coder agent might write perfect code or introduce a subtle bug. ALWAYS review agent output before committing to production. The reviewer agent helps, but it is not perfect either.

### Cannot Learn Across Different Projects Automatically
CF memory is per-project. Patterns learned in Project A do not automatically transfer to Project B. You can manually transfer via the hooks transfer command, but it is not automatic.

### Cannot Run Truly Unlimited Agents
Claude Code has a 15-agent practical limit. Claude API has rate limits. Your machine has CPU and memory limits. Running 15 agents simultaneously sounds great but can hit rate limits within minutes.

### Cannot Process Real Video Content
CF cannot watch videos, take screenshots, or extract visual information. For video knowledge, you need external transcription services. The metadata and descriptions can be ingested, but the visual content cannot.

### Cannot Self-Correct Without Good Data
Self-learning is only as good as the patterns stored. If wrong patterns are stored (because a bad solution was marked as successful), CF will learn the wrong thing. Garbage in, garbage out applies to self-learning too.

## The Honest Trade-Off

CF trades simplicity for power. A single Claude Code session is simpler but less capable. CF adds complexity (daemon, hooks, memory, swarms) in exchange for coordination, persistence, and learning. For simple tasks, the complexity is not worth it. For complex, repeated tasks, it is transformative.`
},
{
  path: 'knowledge/teaching/cf-model-selection-guide',
  title: 'Which Claude Model? Haiku vs Sonnet vs Opus Decision Guide',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['model selection', 'haiku', 'sonnet', 'opus', 'cost', 'speed', 'decision'],
  content: `## The Three Models

### Haiku (Fast and Cheap)
Speed: Fastest. Cost: Lowest. Quality: Good for simple tasks.
USE FOR: Quick classifications, simple edits, formatting, translations, summaries of short text.
DO NOT USE FOR: Complex reasoning, architecture decisions, long code generation.

### Sonnet (Balanced)
Speed: Fast. Cost: Moderate. Quality: Very good for most tasks.
USE FOR: Code generation, debugging, research, most day-to-day development work.
DO NOT USE FOR: The most complex architectural decisions or novel problem-solving.

### Opus (Most Capable)
Speed: Slower. Cost: Highest. Quality: Best for complex reasoning.
USE FOR: Architecture decisions, complex debugging, novel solutions, critical code review, tasks where quality matters most.
DO NOT USE FOR: Simple tasks where Haiku would suffice (waste of money and time).

## The Decision Matrix

"Is this a simple, mechanical task?" -> Haiku
"Is this normal development work?" -> Sonnet
"Is this a critical decision or complex problem?" -> Opus
"Am I building my tutor's knowledge?" -> Opus (quality matters)
"Am I running 10 agents in parallel?" -> Sonnet (cost control)

## Cost Perspective

If Opus costs $1 per complex task:
- Sonnet does it for ~$0.30 at 90% quality
- Haiku does it for ~$0.05 at 70% quality

For 100 tasks/day: Opus = $100, Sonnet = $30, Haiku = $5.

## SONA's Role

SONA (Claude Flow's optimizer) automatically routes tasks to the best model. Simple pattern matches go to Haiku. Complex reasoning goes to Opus. You do not need to manually choose -- but understanding the trade-offs helps you override when needed.`
},
{
  path: 'knowledge/teaching/cf-build-vs-buy',
  title: 'Build vs Buy: When to Use Claude Flow vs Other AI Frameworks',
  category: 'teaching', quality: 99, knowledge_type: 'decision',
  concepts: ['build vs buy', 'comparison', 'langchain', 'crewai', 'autogen', 'decision'],
  content: `## The Landscape

There are many AI orchestration frameworks. Here is how Claude Flow compares to the main alternatives.

## Claude Flow vs LangChain
LangChain: Chain-based. Good for linear pipelines (A -> B -> C). Large ecosystem of integrations.
Claude Flow: Agent-based. Good for parallel execution and self-learning. Integrated memory and hooks.
CHOOSE Claude Flow when: You need multi-agent coordination, persistent learning, or swarm patterns.
CHOOSE LangChain when: You need a simple linear pipeline with many third-party integrations.

## Claude Flow vs CrewAI
CrewAI: Role-based agents with simple coordination. Easy to set up.
Claude Flow: More complex but more powerful. Self-learning, consensus, fault tolerance.
CHOOSE Claude Flow when: You need production-grade reliability, self-learning, or 10+ agents.
CHOOSE CrewAI when: You want quick prototyping with 3-5 agents and simple roles.

## Claude Flow vs AutoGen
AutoGen: Microsoft's multi-agent framework. Good for conversational agent patterns.
Claude Flow: Better for coordinated work with memory persistence.
CHOOSE Claude Flow when: You need persistent memory, HNSW search, or deployment on a single machine.
CHOOSE AutoGen when: You're in the Microsoft ecosystem and need conversational agent patterns.

## Claude Flow's Unique Advantages
What NO other framework has:
1. Self-learning hooks (27 hooks that make the system smarter over time)
2. HNSW-indexed pattern memory (150x-12,500x faster pattern search)
3. Byzantine fault-tolerant consensus (survives malfunctioning agents)
4. RuVector integration (native vector search in PostgreSQL)
5. SONA adaptive routing (0.05ms model selection)

## The Bottom Line
Claude Flow is the most powerful option for serious, production-grade AI orchestration. The trade-off is complexity -- it has more moving parts than simpler frameworks. For Stuart's use case (personal AI tutor with persistent knowledge), Claude Flow is the right choice because the self-learning and KB integration are core requirements.`
},
];

async function main() {
  console.log(`=== Teaching Batch 4 (Gap Closers): ${entries.length} Entries ===\n`);
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
      (SELECT COUNT(*) FROM ask_ruvnet.kb_complete WHERE category = 'videos') as kb_videos,
      (SELECT COUNT(*) FROM ask_ruvnet.kb_complete) as kb_total,
      (SELECT COUNT(*) FROM ask_ruvnet.architecture_docs WHERE doc_id LIKE 'kb-complete-%' AND source_authority = 'expert-curated') as arch_expert
  `);

  console.log(`\n=== Batch 4 Complete ===`);
  console.log(`Inserted: ${inserted} | Skipped: ${skipped}`);
  console.log(`\nKB TOTALS:`);
  console.log(`  Teaching: ${counts.kb_teaching}`);
  console.log(`  Videos: ${counts.kb_videos}`);
  console.log(`  Total kb_complete: ${counts.kb_total}`);
  console.log(`  Expert-curated in architecture_docs: ${counts.arch_expert}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
