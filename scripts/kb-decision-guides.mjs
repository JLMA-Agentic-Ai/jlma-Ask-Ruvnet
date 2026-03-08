#!/usr/bin/env node
/**
 * KB Decision Guides v1.0 - Curated Architectural Decision Guides
 *
 * Inserts 25 curated decision guide entries into ask_ruvnet.architecture_docs
 * with ONNX-generated embeddings. Each guide helps Stuart make the right
 * architectural choice by explaining criteria, correct answer, consequences
 * of wrong choices, and a quick reference.
 *
 * Usage:
 *   node scripts/kb-decision-guides.mjs
 *   node scripts/kb-decision-guides.mjs --dry-run   # Preview without inserting
 */
import pg from 'pg';
import crypto from 'crypto';

const DRY_RUN = process.argv.includes('--dry-run');
const SCHEMA = 'ask_ruvnet';
const TABLE = 'architecture_docs';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  password: '',
  database: 'postgres',
  max: 2
});

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

// --- ONNX Embedding ---
let svc = null;

async function initOnnx() {
  const embeddingsPath = '/Users/stuartkerr/.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js';
  const mod = await import(embeddingsPath);
  svc = await mod.createEmbeddingServiceAsync({
    provider: 'transformers',
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384
  });
  await svc.embed('warmup');
  log('ONNX embedding service ready');
}

async function embed(text) {
  const result = await svc.embed(text);
  const vec = result.embedding || result;
  return '[' + Array.from(vec).join(',') + ']';
}

// --- Decision Guides ---
const guides = [
  {
    title: 'Decision Guide: When to use HNSW vs IVFFlat indexes',
    content: `## When to use HNSW vs IVFFlat indexes in ruvector PostgreSQL

### The Decision
You need a vector index on your PostgreSQL table. Should you use HNSW or IVFFlat?

### Decision Criteria
- **Row count**: How many rows does the table have or will it grow to?
- **Memory budget**: How much RAM can you dedicate to the index?
- **Query accuracy needs**: Do you need the best possible results, or is "good enough" acceptable?
- **Build time tolerance**: Can you wait longer for index creation?

### The Correct Choice
**Use HNSW for tables under 500,000 rows** (which covers nearly all of Stuart's use cases). HNSW provides better recall (more accurate search results) and does not require training data. It works immediately after creation.

**Use IVFFlat only when**: you have 500K+ rows AND memory is constrained AND you can accept slightly less accurate results. IVFFlat builds faster and uses less memory, but requires a training step and returns slightly worse results.

### What Happens If You Choose Wrong
- **HNSW on a huge table with low memory**: The index build can consume massive amounts of RAM and potentially crash PostgreSQL. You need to set maintenance_work_mem appropriately (512MB minimum for large tables).
- **IVFFlat on a small table**: You waste effort on training and get slightly worse search quality for no benefit.

### Quick Reference
| Factor | HNSW | IVFFlat |
|--------|------|---------|
| Best for | <500K rows | >500K rows |
| Recall quality | Higher | Lower |
| Build speed | Slower | Faster |
| Memory usage | Higher | Lower |
| Needs training? | No | Yes |

**Bottom line**: For the Ask-Ruvnet KB (currently ~17K entries), always use HNSW. It is the default and correct choice.`
  },
  {
    title: 'Decision Guide: Choosing embedding dimensions',
    content: `## Choosing Embedding Dimensions for Vector Search

### The Decision
When generating embeddings (the numerical representations of text that enable semantic search), you must choose a model and its output dimensions. The three common choices are 384, 768, and 1536 dimensions.

### Decision Criteria
- **Use case**: What are you searching? KB articles, code, long documents?
- **Speed requirements**: How fast must search be?
- **Storage budget**: Higher dimensions = more disk and memory per row.
- **API cost**: Are you using a paid embedding API or running locally?

### The Correct Choice
**Use 384 dimensions (MiniLM-L6-v2) for KB and semantic search.** This is the standard for Ask-Ruvnet. It runs locally via ONNX (free, fast, no API calls), produces high-quality results for knowledge base lookups, and keeps storage manageable.

**Use 768 (BERT-based) when** you need deeper semantic understanding for research-grade NLP tasks. Rarely needed for KB search.

**Use 1536 (OpenAI text-embedding-ada-002) when** you are building a production API product and need maximum quality, AND you are willing to pay per embedding.

### What Happens If You Choose Wrong
- **Mixing dimensions**: If you embed some entries at 384 and others at 768, the vectors are incompatible and search will return garbage. The ruvector column type enforces dimension consistency, so mismatched inserts will fail with a clear error.
- **Over-engineering with 1536**: You pay per embedding, search is slower, storage is 4x larger, and for KB search the quality improvement is negligible.
- **Under-engineering with 384 for production API**: Acceptable quality but you miss some nuance in complex queries.

### Quick Reference
| Dimensions | Model | Cost | Speed | Quality | Use For |
|-----------|-------|------|-------|---------|---------|
| 384 | MiniLM-L6-v2 | Free (ONNX) | Fastest | Good | KB search, semantic lookup |
| 768 | BERT variants | Free/Low | Medium | Better | Research, deep NLP |
| 1536 | OpenAI ada-002 | Paid API | Slowest | Best | Production APIs |

**Bottom line**: 384 via ONNX is the standard. Do not change this unless you have a specific reason and understand the tradeoffs.`
  },
  {
    title: 'Decision Guide: When to use sequential scan vs HNSW index',
    content: `## When to Use Sequential Scan vs HNSW Index for Vector Search

### The Decision
When querying vectors in PostgreSQL, should you create an HNSW index or just let PostgreSQL do a sequential scan (checking every row one by one)?

### Decision Criteria
- **Table size**: How many rows are in the table?
- **Query frequency**: How often do you search?
- **Index build cost**: Can you afford the upfront time and memory to build the index?

### The Correct Choice
**Tables under 1,000 rows: Sequential scan is fine.** PostgreSQL can scan 1,000 rows of vectors in milliseconds. Adding an index adds complexity with no meaningful speed gain.

**Tables over 1,000 rows: Create an HNSW index.** Without an index, a 17,000-row table takes noticeably longer to search. An HNSW index makes it near-instant regardless of table size.

### What Happens If You Choose Wrong
- **No index on a large table**: Search queries slow down linearly as the table grows. At 17K rows, queries that should be 2ms take 200ms+. At 100K rows, they become painfully slow.
- **Index on a tiny table**: Wastes disk space and build time, but does not break anything. The index just sits there doing nothing useful.
- **Building HNSW with default maintenance_work_mem (4MB)**: On tables over ~10K rows, the index build will crash with an out-of-memory error. You MUST increase it: SET maintenance_work_mem = '512MB' before CREATE INDEX.

### Quick Reference
| Table Size | Recommendation | Why |
|-----------|---------------|-----|
| <1,000 rows | No index needed | Seq scan is fast enough |
| 1,000 - 10,000 | HNSW (default settings) | Noticeable speed improvement |
| 10,000 - 500,000 | HNSW + 512MB maintenance_work_mem | Needed to avoid build crash |
| >500,000 | Consider IVFFlat or partitioning | HNSW memory gets expensive |

**Bottom line**: The Ask-Ruvnet KB has ~17K rows. It needs an HNSW index with maintenance_work_mem set to 512MB.`
  },
  {
    title: 'Decision Guide: ONNX vs ruvector_embed for embeddings',
    content: `## ONNX vs ruvector_embed() for Generating Embeddings

### The Decision
There are two ways to generate embeddings in the Ask-Ruvnet system: (1) ONNX via the @claude-flow/embeddings package running Xenova/all-MiniLM-L6-v2, or (2) the ruvector_embed() SQL function built into the ruvector PostgreSQL extension.

### Decision Criteria
- **Consistency**: Are all existing embeddings from the same model?
- **Search quality**: Will search results be accurate if you mix models?

### The Correct Choice
**ALWAYS use ONNX (Xenova/all-MiniLM-L6-v2).** This is the standard embedding model for the entire Ask-Ruvnet knowledge base. Every single entry in the KB was embedded with this model.

**NEVER use ruvector_embed()** for the Ask-Ruvnet KB. The ruvector_embed() function uses a DIFFERENT underlying model. Even though both produce 384-dimensional vectors, the vectors are in completely different "spaces" — they encode meaning differently.

### What Happens If You Choose Wrong
- **Mixing ONNX and ruvector_embed embeddings**: Search results become unreliable. A query embedded with ONNX searching against ruvector_embed vectors will return irrelevant results because the two models disagree on what "similar" means. This is the most common and hardest-to-debug embedding problem.
- **Switching entirely to ruvector_embed**: You would need to re-embed ALL 17,000+ entries, which takes significant time. And you lose the ability to embed client-side (in Node.js scripts).

### Quick Reference
| Method | Model | Use For | Compatible? |
|--------|-------|---------|-------------|
| ONNX (Xenova/all-MiniLM-L6-v2) | sentence-transformers | ALL Ask-Ruvnet entries | YES - this is the standard |
| ruvector_embed() | Built-in model | Other projects, not Ask-Ruvnet | NO - different vector space |

**Bottom line**: One KB = one embedding model. Ask-Ruvnet uses ONNX. Never mix models. If you see ruvector_embed() in an Ask-Ruvnet script, it is a bug.`
  },
  {
    title: 'Decision Guide: Ruflo topology selection',
    content: `## Choosing the Right Ruflo Swarm Topology

### The Decision
When spawning multiple AI agents to work on a task together, you need to choose how they communicate. This is the "topology" — the structure of the agent team.

### Decision Criteria
- **Team size**: How many agents are you spawning?
- **Control needs**: Do you need tight control or flexible collaboration?
- **Task type**: Is the work hierarchical (plan then execute) or collaborative (brainstorming)?
- **Drift risk**: How important is it that agents stay on task?

### The Correct Choice
**Hierarchical for teams of 1-8 agents (default).** A coordinator agent manages all workers directly. This prevents "drift" — where agents go off-track or produce conflicting work. This is the recommended default for nearly all tasks.

**Hierarchical-mesh for teams of 10-15 agents.** Combines a coordinator (queen) with peer-to-peer communication between workers. Workers can share findings directly without routing everything through the coordinator, which reduces bottlenecks.

**Mesh for fully peer-to-peer work.** All agents talk to each other directly. Only use for brainstorming or research where there is no "right answer" and you want maximum exploration.

**Star for central coordinator patterns.** Similar to hierarchical but with a hub-and-spoke model. Less common but useful for fan-out/fan-in patterns.

### What Happens If You Choose Wrong
- **Mesh with 15 agents**: Agents drift in different directions, produce conflicting output, waste tokens, and you get chaos instead of results.
- **Hierarchical with 15 agents**: The coordinator becomes a bottleneck. Every agent waits for the coordinator, causing delays.
- **No topology specified**: Defaults to mesh, which works for small teams but causes drift at scale.

### Quick Reference
| Topology | Best For | Max Agents | Drift Risk |
|----------|----------|------------|------------|
| hierarchical | Most tasks | 8 | Low |
| hierarchical-mesh | Large teams | 15 | Medium |
| mesh | Research/brainstorm | 6 | High |
| star | Fan-out/fan-in | 10 | Medium |

**Bottom line**: Use hierarchical with max-agents 8 and strategy specialized. This is the anti-drift configuration.`
  },
  {
    title: 'Decision Guide: When to spawn a swarm vs single agent',
    content: `## When to Spawn a Swarm vs Use a Single Agent

### The Decision
Should you launch multiple agents working in parallel (a swarm), or have a single agent handle the task?

### Decision Criteria
- **Number of files affected**: How many files need to change?
- **Task complexity**: Is it a simple fix or a multi-step operation?
- **Time sensitivity**: Do you need it done fast?
- **Interdependencies**: Do the changes depend on each other?

### The Correct Choice
**Single agent when**: You are editing 1-2 files, fixing a simple bug (1-2 lines), updating documentation, changing configuration, or asking a question. A single agent is faster to start and has no coordination overhead.

**Swarm when**: You are touching 3+ files, implementing a new feature, refactoring across modules, doing security reviews, performance optimization, or database schema changes. The parallel work saves significant time.

### What Happens If You Choose Wrong
- **Swarm for a simple task**: You waste time on initialization, coordination, and synthesis. A 30-second single-agent fix becomes a 3-minute swarm operation. It also costs more in API tokens.
- **Single agent for a complex task**: The agent tries to do everything sequentially, misses things, and takes much longer. A feature that 5 parallel agents could build in 3 minutes takes a single agent 15+ minutes.

### Quick Reference
| Task Type | Use | Why |
|-----------|-----|-----|
| Single file edit | Single agent | No coordination needed |
| Simple bug fix | Single agent | Quick and focused |
| Config change | Single agent | Trivial scope |
| New feature (3+ files) | Swarm (5 agents) | Parallel implementation |
| Refactoring | Swarm (5 agents) | Multiple files change |
| Security audit | Swarm (3 agents) | Multiple analysis angles |
| Performance work | Swarm (3 agents) | Profiling + fixing parallel |

**Bottom line**: If you are thinking "this is going to touch several files," spawn a swarm. If it is a quick fix, use a single agent.`
  },
  {
    title: 'Decision Guide: maintenance_work_mem sizing for HNSW',
    content: `## Sizing maintenance_work_mem for HNSW Index Builds

### The Decision
When building an HNSW index in PostgreSQL, how much memory should you allocate via the maintenance_work_mem setting?

### Decision Criteria
- **Table row count**: How many vectors are being indexed?
- **Vector dimensions**: 384 dims use less memory than 1536 dims per row.
- **Available system RAM**: How much can PostgreSQL safely use?

### The Correct Choice
**Always set maintenance_work_mem before building HNSW indexes.** The PostgreSQL default of 4MB is almost always too small for vector indexes.

For the Ask-Ruvnet KB (~17K rows, 384 dimensions): **512MB** is correct and safe. Run this before CREATE INDEX:
\`\`\`sql
SET maintenance_work_mem = '512MB';
CREATE INDEX CONCURRENTLY idx_name ON table USING hnsw (embedding ruvector_l2_ops);
\`\`\`

### What Happens If You Choose Wrong
- **Using the 4MB default**: The index build WILL crash with an out-of-memory error on any table over ~10,000 rows. PostgreSQL logs an error and the index is left in an INVALID state. You then need to DROP the invalid index and try again with more memory.
- **Setting too high (e.g., 8GB on a 128GB system)**: PostgreSQL allocates this per-connection during index builds. If multiple connections build indexes simultaneously, you can exhaust system RAM.
- **Forgetting to reset after build**: maintenance_work_mem stays elevated for the session. Not dangerous but wastes memory for subsequent queries.

### Quick Reference
| Row Count | Recommended Setting | Notes |
|-----------|-------------------|-------|
| <1,000 | Default (4MB) is fine | No index needed anyway |
| 1,000 - 10,000 | 128MB | Safe for small indexes |
| 10,000 - 100,000 | 512MB | Standard for Ask-Ruvnet |
| 100,000 - 500,000 | 1GB - 2GB | Monitor memory usage |
| >500,000 | 2GB+ or use IVFFlat | HNSW gets expensive |

**Bottom line**: Run SET maintenance_work_mem = '512MB' before any HNSW index build. Reset it after with RESET maintenance_work_mem.`
  },
  {
    title: 'Decision Guide: LaunchAgent vs cron for scheduled tasks',
    content: `## LaunchAgent vs cron for Scheduled Tasks on macOS

### The Decision
You need to run a script automatically on a schedule (like the KB evergreen refresh at 4 AM daily). Should you use a macOS LaunchAgent or a cron job?

### Decision Criteria
- **Operating system**: Are you on macOS or Linux?
- **Reliability**: Must the task run even after reboots?
- **Logging**: Do you need structured logs and error tracking?
- **Resource management**: Should the system manage CPU/memory for the task?

### The Correct Choice
**On macOS: ALWAYS use LaunchAgents.** LaunchAgents are the native macOS way to schedule tasks. They survive reboots, integrate with the system logging (Console.app), support environment variable management, and can be monitored via launchctl.

**NEVER use crontab on macOS.** While cron exists on macOS, it is a legacy compatibility layer. It does not integrate properly with macOS security permissions (Full Disk Access, etc.), does not survive some system updates, and provides no structured logging.

### What Happens If You Choose Wrong
- **Using crontab on macOS**: The job may silently fail due to permission issues (macOS privacy protections block cron from accessing many directories). You get no notification of failure. After a macOS update, the cron job may stop running entirely.
- **Forgetting to load the LaunchAgent after creating it**: The plist file sits in ~/Library/LaunchAgents but does not run. You must run: launchctl load ~/Library/LaunchAgents/com.yourname.task.plist

### Quick Reference
| Feature | LaunchAgent | cron |
|---------|------------|------|
| macOS native | Yes | No (legacy) |
| Survives reboot | Yes | Maybe |
| Structured logging | Yes (Console.app) | No |
| Permission handling | Proper | Broken |
| Error notification | Built-in | None |
| Configuration | XML plist | crontab line |

**Bottom line**: On macOS, the only correct answer is LaunchAgents. Save the plist to ~/Library/LaunchAgents/ and load it with launchctl.`
  },
  {
    title: 'Decision Guide: PostgreSQL connection pooling',
    content: `## PostgreSQL Connection Pooling in Node.js Scripts

### The Decision
When connecting to PostgreSQL from a Node.js script, should you use a single connection or a connection pool? And how should you size the pool?

### Decision Criteria
- **Script type**: Is it a one-shot script or a long-running server?
- **Concurrency**: Will you run multiple queries in parallel?
- **Resource usage**: How many connections can the database handle?

### The Correct Choice
**Always use pg.Pool, never pg.Client directly for scripts.** Even for simple scripts, pg.Pool handles connection errors, automatic reconnection, and cleanup better than a raw Client.

**Pool sizing**:
- **max: 2** for simple scripts that run one query at a time (ingestion, one-off lookups).
- **max: 4-10** for scripts that run parallel queries (batch embedding, bulk updates).
- **max: 10** is the practical maximum for scripts. The database has a connection limit.

**Always call pool.end() when done.** Without this, the script hangs forever waiting for idle connections to time out.

### What Happens If You Choose Wrong
- **Using pg.Client**: If the connection drops mid-script, you get an unhandled error and the script crashes. pg.Pool automatically retries.
- **Pool too large (max: 50)**: You exhaust PostgreSQL's max_connections (default: 100). Other tools and scripts cannot connect.
- **Forgetting pool.end()**: The script finishes its work but hangs indefinitely. You have to Ctrl+C to kill it. This is the most common mistake.

### Quick Reference
\`\`\`javascript
import pg from 'pg';

// Simple script (1-2 concurrent queries)
const pool = new pg.Pool({
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  password: '',
  database: 'postgres',
  max: 2
});

// ... do your work ...

// ALWAYS do this at the end:
await pool.end();
\`\`\`

**Bottom line**: Use pg.Pool with max: 2 for simple scripts, max: 4-10 for parallel workloads. Always call pool.end().`
  },
  {
    title: 'Decision Guide: Chunk size for KB ingestion',
    content: `## Choosing Chunk Size for Knowledge Base Ingestion

### The Decision
When ingesting documents into the KB, you split them into chunks before embedding. How large should each chunk be, and how much overlap between chunks?

### Decision Criteria
- **Content type**: Is it code, documentation, or conversational text?
- **Search precision**: Do you need pinpoint answers or broader context?
- **Embedding quality**: Smaller text = more focused embedding. Larger = more context but diluted meaning.

### The Correct Choice
**For code**: 800 characters with 100 character overlap. Code is dense — every line matters. Smaller chunks mean search results point to the exact relevant function or block, not a whole file.

**For documentation**: 2000 characters with 200 character overlap. Documentation is more narrative. Larger chunks preserve the flow of an explanation and give the reader enough context to understand the answer.

**Overlap is critical.** Without overlap, a relevant passage that falls on a chunk boundary gets split across two chunks, and neither chunk contains the full answer. Overlap ensures boundary content appears in both adjacent chunks.

### What Happens If You Choose Wrong
- **Chunks too small (100 chars)**: Each chunk is a sentence fragment. The embedding captures almost no meaning. Search returns random fragments.
- **Chunks too large (10,000 chars)**: The embedding averages over too much text. A search for "HNSW parameters" matches a chunk about 50 different topics because HNSW was mentioned once in 10,000 characters.
- **No overlap**: Important information at chunk boundaries is lost. You get "the answer is split across two results" problems.
- **Too much overlap (50%+)**: Massive duplication in the database. Storage doubles, search returns near-duplicate results.

### Quick Reference
| Content Type | Chunk Size | Overlap | Rationale |
|-------------|-----------|---------|-----------|
| Source code | 800 chars | 100 | Dense, precise search |
| Documentation | 2000 chars | 200 | Narrative context |
| Chat/conversation | 1000 chars | 150 | Balanced |
| Short entries (curated) | No chunking | N/A | Already right-sized |

**Bottom line**: 800/100 for code, 2000/200 for docs. Do not change these without testing search quality.`
  },
  {
    title: 'Decision Guide: When to REINDEX HNSW',
    content: `## When to Rebuild (REINDEX) an HNSW Vector Index

### The Decision
Your HNSW index exists and was working. When do you need to rebuild it?

### Decision Criteria
- **Extension upgrade**: Did you update the ruvector extension?
- **Data churn**: How much of the data has changed since the index was built?
- **Search quality**: Are search results suddenly wrong or missing relevant entries?

### The Correct Choice
**REINDEX after a major ruvector extension upgrade.** New versions may change the internal index format. A REINDEX ensures compatibility.

**REINDEX after >50% of rows change.** HNSW handles incremental inserts and deletes, but if more than half the data changes, the index structure becomes suboptimal. A fresh build produces a better graph.

**REINDEX when search returns wrong results.** If you know an entry exists but search does not find it, the index may be corrupted or built with the wrong parameters.

### What Happens If You Choose Wrong
- **Never reindexing after major changes**: Search quality degrades gradually. You may not notice at first, but recall drops over time as the HNSW graph becomes unbalanced.
- **Reindexing too often**: Each REINDEX takes time and memory (remember maintenance_work_mem). On a 17K row table it takes 30-60 seconds. Not harmful, just wasteful if done after every small insert.
- **Reindexing without setting maintenance_work_mem**: The reindex crashes just like the initial build would. Always SET maintenance_work_mem = '512MB' first.

### Quick Reference
| Trigger | Reindex? | Priority |
|---------|----------|----------|
| ruvector extension upgrade | Yes | High |
| >50% rows changed | Yes | Medium |
| Search returning wrong results | Yes | High |
| <10% rows changed | No | N/A |
| After single INSERT | No | N/A |
| After dropping and recreating table | Index does not exist, create new | High |

**Bottom line**: REINDEX is maintenance, not routine. Do it after upgrades, major data changes, or when search seems broken. Always set maintenance_work_mem first.`
  },
  {
    title: 'Decision Guide: Vector distance operators in ruvector',
    content: `## Choosing Vector Distance Operators in ruvector PostgreSQL

### The Decision
ruvector supports multiple distance operators for comparing vectors. Which should you use in your queries?

### Decision Criteria
- **Index compatibility**: Does the operator work with your HNSW index?
- **Vector normalization**: Are your vectors normalized (unit length)?
- **Mathematical meaning**: L2 measures absolute distance. Cosine measures angle between vectors.

### The Correct Choice
**Use <-> (L2/Euclidean distance) for all HNSW-indexed queries.** This is the operator that works reliably with HNSW indexes in the current ruvector version.

**KNOWN BUG: <=> (cosine distance) does not work correctly with HNSW indexes.** It returns 0 or 1 results instead of the requested number. This is a documented issue. The workaround is to use <-> instead.

**For normalized vectors (like MiniLM-L6-v2 output), L2 and cosine give the SAME ranking.** When vectors are normalized to unit length, sorting by L2 distance produces the same order as sorting by cosine distance. So using <-> loses nothing.

### What Happens If You Choose Wrong
- **Using <=> with HNSW index**: Your ORDER BY ... LIMIT 10 query returns 0-1 results instead of 10. This looks like "the database has no data" when it actually has 17,000 entries. This is the most confusing bug — everything looks correct but search returns nothing.
- **Using <-> without an index**: Works fine, just slower (sequential scan). Not wrong, just slow on large tables.

### Quick Reference
| Operator | Distance Type | Works with HNSW? | Use? |
|----------|-------------|-------------------|------|
| <-> | L2 (Euclidean) | Yes | YES - use this |
| <=> | Cosine | BROKEN with HNSW | NO - known bug |
| <#> | Inner product | Yes (if supported) | Rarely needed |

\`\`\`sql
-- CORRECT: Use <-> for HNSW queries
SELECT title, content, embedding <-> $1::ruvector AS distance
FROM ask_ruvnet.architecture_docs
ORDER BY embedding <-> $1::ruvector
LIMIT 10;

-- BROKEN: <=> returns 0-1 results with HNSW
-- Do NOT use this until the bug is fixed
\`\`\`

**Bottom line**: Always use <-> for vector search. The cosine operator <=> is broken with HNSW indexes.`
  },
  {
    title: 'Decision Guide: MCP version pinning policy',
    content: `## MCP Server Version Pinning Policy

### The Decision
When installing MCP (Model Context Protocol) servers, should you pin to a specific version (e.g., @1.2.3) or use a floating tag (e.g., @latest)?

### Decision Criteria
- **Stability**: Will a specific version protect you from breaking changes?
- **Compatibility**: Does Claude Code expect a specific version range?
- **Maintenance**: How much effort to keep versions updated?

### The Correct Choice
**NEVER pin MCP versions. Always use @latest or @alpha.** MCP servers are tightly coupled to Claude Code's expectations. When Claude Code updates, it may expect new MCP protocol features. A pinned old version breaks silently — the MCP server starts but tools fail or return unexpected results.

The correct installation pattern:
\`\`\`bash
claude mcp add ruflo -- npx -y @claude-flow/cli@latest
claude mcp add flow-nexus -- npx -y flow-nexus@latest mcp start
\`\`\`

### What Happens If You Choose Wrong
- **Pinning to a specific version**: Initially works fine. Then Claude Code updates, the protocol evolves, and your pinned MCP server silently fails. Tools return errors or no results. You spend hours debugging "why did my tools stop working?" when the answer is just "update the MCP server."
- **Using @alpha when @latest exists**: Alpha versions may have experimental features that break. Only use @alpha when specifically instructed (e.g., ruflo uses @latest which tracks the stable channel).

### Quick Reference
| Pattern | Example | Correct? |
|---------|---------|----------|
| @latest | npx -y @claude-flow/cli@latest | YES |
| @alpha | npx -y package@alpha | YES (when directed) |
| @1.2.3 | npx -y package@1.2.3 | NO - never pin |
| No tag | npx -y package | RISKY - may cache old version |

**Bottom line**: Always @latest. Never pin. If something breaks after an update, the fix is to report it upstream, not to freeze the version.`
  },
  {
    title: 'Decision Guide: CLI installation location',
    content: `## Where to Install CLI Tools on macOS

### The Decision
When installing Node.js CLI tools globally (like claude, openclaw, etc.), where should they go?

### Decision Criteria
- **Permissions**: Does the location require sudo?
- **Isolation**: Can different users have different tool versions?
- **macOS compatibility**: Does the location survive system updates?

### The Correct Choice
**ALWAYS install to ~/.npm-global/bin.** This is your user-local global npm directory. It requires no sudo, is isolated to your user account, and survives macOS updates.

Set it up once:
\`\`\`bash
npm config set prefix ~/.npm-global
# Ensure ~/.npm-global/bin is in your PATH (add to ~/.zshrc)
export PATH="$HOME/.npm-global/bin:$PATH"
\`\`\`

### What Happens If You Choose Wrong
- **Installing to /usr/local/**: Requires sudo for every install and update. Risk of permission conflicts. On Apple Silicon Macs, /usr/local/ has special security restrictions. Homebrew also uses /usr/local/ (or /opt/homebrew) and you can get conflicts.
- **Installing to /usr/bin/**: System-protected on macOS. Will fail even with sudo due to System Integrity Protection (SIP).
- **No prefix set at all**: npm defaults to /usr/local/lib/node_modules, which requires sudo and causes all the problems above.

### Quick Reference
| Location | Correct? | Why |
|----------|----------|-----|
| ~/.npm-global/bin | YES | User-local, no sudo, isolated |
| /usr/local/bin | NO | Needs sudo, permission conflicts |
| /usr/bin | NO | SIP protected, will fail |
| /opt/homebrew/bin | NO | Homebrew territory, not for npm |

**Bottom line**: ~/.npm-global/bin is the only correct answer. Set npm prefix once and forget it.`
  },
  {
    title: 'Decision Guide: Database choice for KB storage',
    content: `## Choosing Where to Store Knowledge Base Data

### The Decision
You need a database to store KB entries with vector embeddings. What should you use?

### Decision Criteria
- **Vector support**: Does the database natively handle vector operations?
- **Local vs cloud**: Do you need data on your machine or in the cloud?
- **Cost**: Free local vs paid cloud?
- **Latency**: How fast must queries be?

### The Correct Choice
**ALWAYS use ruvector-postgres running locally on port 5435.** This is the purpose-built PostgreSQL instance with the ruvector extension for vector operations. It runs on your machine, is free, has sub-millisecond latency, and you control all the data.

Authentication is via ~/.pgpass (never inline passwords in scripts or config files).

### What Happens If You Choose Wrong
- **Using Supabase**: Adds network latency to every query (50-200ms vs <1ms local). Costs money. Requires internet. Your KB becomes unavailable when offline. The vector extension may be a different version with different behavior.
- **Using a separate PostgreSQL without ruvector**: No native vector operations. You would need to store embeddings as arrays and do cosine similarity in application code — slow, error-prone, and loses all the benefits of HNSW indexes.
- **Inlining passwords in scripts**: Security risk. If the script is committed to git, the password is exposed. Always use ~/.pgpass.

### Quick Reference
| Option | Correct? | Why |
|--------|----------|-----|
| ruvector-postgres (port 5435) | YES | Local, fast, free, vector-native |
| Supabase | NO | Cloud latency, cost, dependency |
| Plain PostgreSQL | NO | No vector support |
| SQLite | NO | No vector extension |
| MongoDB | NO | Wrong paradigm for vector search |

**Bottom line**: ruvector-postgres on port 5435. Always. Auth via ~/.pgpass. Never inline passwords.`
  },
  {
    title: 'Decision Guide: WhatsApp automation safety',
    content: `## WhatsApp Automation Safety Parameters

### The Decision
You have WhatsApp automation configured. What are the safe operating parameters?

### Decision Criteria
- **Rate limiting**: How fast can you send messages without triggering WhatsApp's anti-spam?
- **Scope**: Individual messages vs group messages?
- **Risk level**: What happens if WhatsApp flags your account?

### The Correct Choice
**debounceMs must be >= 5000 (currently set to 8000).** This is the minimum delay between automated messages. 8000ms (8 seconds) is the current safe setting. Never lower it.

**NEVER automate group messages.** Group automation is the fastest way to get your WhatsApp account banned. WhatsApp's anti-spam is much more aggressive for groups.

**Individual messages only, with rate limiting.**

### What Happens If You Choose Wrong
- **debounceMs < 5000**: WhatsApp detects automated behavior. Your account gets flagged, rate-limited, or permanently banned. There is no appeal process — a banned WhatsApp number is gone forever.
- **Automating group messages**: Almost instant ban. WhatsApp monitors group message patterns aggressively.
- **Bursting messages (sending many at once then waiting)**: WhatsApp detects burst patterns even if the average rate is low. Consistent debounce is safer than bursting.

### Quick Reference
| Parameter | Safe Value | Minimum | Never |
|-----------|-----------|---------|-------|
| debounceMs | 8000 | 5000 | <5000 |
| Group automation | OFF | OFF | ON |
| Daily message limit | <50 | - | >200 |
| Burst size | 1 | 1 | >3 |

**Bottom line**: debounceMs = 8000. Individual messages only. Never automate groups. Your WhatsApp number is not replaceable.`
  },
  {
    title: 'Decision Guide: Agent count based on system resources',
    content: `## How Many Agents to Run Based on System Resources

### The Decision
You are spawning a swarm of AI agents. How many can your M3 Max with 128GB RAM handle?

### Decision Criteria
- **CPU utilization**: How busy is the processor right now?
- **Memory usage**: How much RAM is available?
- **Task type**: Are agents CPU-intensive (embedding, analysis) or I/O-bound (file reading, API calls)?

### The Correct Choice
**Monitor CPU usage via the status bar and adjust accordingly:**

- **CPU < 50%**: Safe to run up to 10 agents. The system has plenty of headroom.
- **CPU 50-75%**: Run 5-7 agents. The system is working but has room.
- **CPU > 75%**: Reduce to 3 agents maximum. The system is under load and adding more agents will cause everything to slow down.

**Memory is rarely the bottleneck** with 128GB RAM. Each Claude agent uses primarily API calls (network-bound), not local memory. The exception is ONNX embedding — each ONNX instance uses ~500MB RAM.

### What Happens If You Choose Wrong
- **Too many agents at high CPU**: Everything slows to a crawl. Each agent takes 3-5x longer because they are fighting for CPU time. The total wall-clock time is WORSE than running fewer agents sequentially.
- **Too few agents at low CPU**: You are wasting available capacity. A task that could finish in 2 minutes takes 10 minutes because agents are running sequentially when they could run in parallel.
- **Ignoring ONNX memory**: If 10 agents each load an ONNX model, that is 5GB of RAM just for models. On 128GB this is fine, but on a smaller machine it matters.

### Quick Reference
| CPU Usage | Max Agents | Notes |
|-----------|-----------|-------|
| <50% | 10 | Full parallel capacity |
| 50-75% | 5-7 | Moderate load |
| >75% | 3 | Reduce to avoid thrashing |
| >90% | 1-2 | System overloaded |

**Bottom line**: Check the status bar. CPU < 50% = go big (10). CPU > 75% = go small (3). The M3 Max is powerful but not infinite.`
  },
  {
    title: 'Decision Guide: When to consult Ruflo Architect',
    content: `## When to Consult the Ruflo Architect Agent

### The Decision
Should you make this architectural decision yourself, or route it through the Ruflo Architect agent for analysis?

### Decision Criteria
- **Reversibility**: Can you easily undo this decision if it is wrong?
- **Scope**: Does it affect one file or the entire system?
- **Expertise needed**: Does it require knowledge of distributed systems, security, or infrastructure?
- **Cost of being wrong**: Will a wrong choice waste hours or days?

### The Correct Choice
**Consult the Architect for ANY non-trivial decision.** Specifically:
- Self-healing and resilience design
- Service architecture (LaunchAgents, daemons, gateways)
- Infrastructure decisions (what to install, how to configure)
- Database schema changes
- Security architecture
- Any decision where a wrong choice wastes significant time or money

Route via: npx ruflo@latest route "task description" --agent architect

**Skip the Architect for**: trivial one-line fixes, file reads, slash commands, and confirmations.

### What Happens If You Choose Wrong
- **Skipping Architect for infrastructure**: You install something the wrong way, configure it suboptimally, or miss a security hole. Hours later you discover the problem and have to redo everything.
- **Consulting Architect for trivial tasks**: Small time overhead (~30 seconds) but no real harm. Erring on the side of consulting is safer than skipping.
- **Not cross-checking with Opus**: The Architect agent uses a specific model. Cross-checking with Opus (system-architect subagent) catches edge cases the Architect might miss.

### Quick Reference
| Decision Type | Consult Architect? |
|--------------|-------------------|
| Infrastructure install/config | YES |
| Database schema change | YES |
| Security architecture | YES |
| Self-healing design | YES |
| Service configuration | YES |
| Single file bug fix | No |
| Documentation update | No |
| Config value change | No |

**Bottom line**: When in doubt, consult the Architect. The 30-second overhead is always cheaper than redoing a wrong decision.`
  },
  {
    title: 'Decision Guide: Quality score weighting in KB search',
    content: `## How to Weight Quality Scores in KB Search Results

### The Decision
When searching the KB, results have both a semantic similarity score (how well the text matches the query) and a quality_score (how reliable the source is). How should you combine them?

### Decision Criteria
- **Result accuracy**: Do you want the most semantically similar result or the most authoritative?
- **Source reliability**: Are curated guides more trustworthy than auto-ingested code?
- **User experience**: Should a perfect-match low-quality result beat a good-match high-quality result?

### The Correct Choice
**Use 70% semantic similarity + 30% quality score.** This ensures that semantic relevance is the primary factor (you get results that actually answer the question), but curated, high-quality entries get a meaningful boost.

In practice:
\`\`\`sql
SELECT title, content,
  (0.7 * (1 - (embedding <-> query_vec) / max_dist)) +
  (0.3 * (quality_score / 100.0)) AS combined_score
FROM ask_ruvnet.architecture_docs
ORDER BY combined_score DESC
LIMIT 10;
\`\`\`

### What Happens If You Choose Wrong
- **100% semantic, 0% quality**: Auto-ingested code fragments with quality_score 50 rank alongside curated guides with quality_score 95. The user gets noisy, low-quality results mixed in.
- **50% semantic, 50% quality**: Quality dominates too much. A curated guide about HNSW might outrank a perfectly matching code example about the exact function the user asked about.
- **0% semantic, 100% quality**: Search becomes "show me the highest-quality entries" regardless of relevance. Completely useless for finding specific answers.

### Quick Reference
| Weighting | Effect | Recommendation |
|-----------|--------|----------------|
| 70/30 (semantic/quality) | Balanced, quality boost | YES - use this |
| 100/0 | Pure semantic | Too noisy |
| 50/50 | Quality dominates | Over-filters |
| 0/100 | Ignores relevance | Broken search |

**Bottom line**: 70% semantic + 30% quality. Curated entries (quality 95) naturally surface above raw fragments (quality 50) without overriding relevance.`
  },
  {
    title: 'Decision Guide: KB evergreen refresh strategy',
    content: `## Knowledge Base Evergreen Refresh Strategy

### The Decision
How should the KB stay up to date as source repositories change?

### Decision Criteria
- **Freshness**: How quickly must new content appear in the KB?
- **Efficiency**: Should you re-ingest everything or only changes?
- **Reliability**: Must the refresh run automatically without manual intervention?

### The Correct Choice
**Automated daily refresh at 4 AM via LaunchAgent.** The kb-evergreen.mjs script handles this:

1. Query the KB for the last ingest timestamp per repository
2. Check the GitHub API for repos with commits since that timestamp
3. Only re-ingest repos that have new commits (skip unchanged repos)
4. Chunk, embed via ONNX, and upsert into the KB
5. Clean up orphaned entries from deleted files
6. Log results for audit trail

### What Happens If You Choose Wrong
- **Manual refresh only**: The KB gradually becomes stale. New features, bug fixes, and documentation updates in source repos never make it to the KB. Search returns outdated information.
- **Re-ingesting everything daily**: Wastes time and compute. Processing 17K+ entries takes 15-20 minutes when only 50 entries changed. The incremental approach takes seconds for the common case.
- **Running during work hours**: Competes with your active tasks for CPU, memory, and database connections. 4 AM is chosen because the machine is idle.
- **No orphan cleanup**: Deleted files leave ghost entries in the KB. Search returns content that no longer exists in the source, leading to confusion.

### Quick Reference
| Strategy | Correct? | Why |
|----------|----------|-----|
| Daily at 4 AM, incremental | YES | Efficient, automated, non-disruptive |
| Manual only | NO | KB goes stale |
| Full re-ingest daily | NO | Wastes 15+ minutes for no benefit |
| Real-time (on every commit) | Overkill | Too complex, unnecessary for KB |

**Bottom line**: kb-evergreen.mjs runs daily at 4 AM via LaunchAgent. It only re-ingests repos with new commits. Set it and forget it.`
  },
  {
    title: 'Decision Guide: Staging table pattern for bulk updates',
    content: `## Using Staging Tables for Bulk Embedding Updates

### The Decision
You need to update embeddings for thousands of rows. Should you UPDATE each row individually or use a staging table?

### Decision Criteria
- **Row count**: How many rows need new embeddings?
- **Speed requirements**: How fast must the update complete?
- **Index overhead**: Does the main table have indexes that slow down individual UPDATEs?

### The Correct Choice
**Use an UNLOGGED staging table for batch embedding writes.** The pattern:

1. CREATE UNLOGGED TABLE _embed_staging (id INT PRIMARY KEY, vec TEXT)
2. Generate embeddings in batches of 100 via ONNX
3. INSERT embeddings into the staging table (fast — no indexes, no WAL logging)
4. JOIN UPDATE: UPDATE main_table SET embedding = staging.vec FROM staging WHERE main_table.id = staging.id
5. TRUNCATE staging table
6. Repeat until all rows are processed
7. DROP the staging table when done

### What Happens If You Choose Wrong
- **Individual UPDATEs**: Each UPDATE triggers index maintenance, WAL logging, and MVCC overhead. On a table with HNSW index, each UPDATE partially rebuilds the index. 17K individual UPDATEs can take 30+ minutes. The staging pattern does it in 2-3 minutes.
- **Forgetting UNLOGGED**: The staging table gets WAL-logged like a normal table. Slower but not catastrophic. UNLOGGED skips WAL because the staging data is ephemeral — if the server crashes, you just regenerate.
- **Not dropping staging after use**: The staging table sits around consuming space. Not harmful but messy.

### Quick Reference
\`\`\`sql
-- 1. Create staging
CREATE UNLOGGED TABLE ask_ruvnet._embed_staging (id INT PRIMARY KEY, vec TEXT);
-- 2. Bulk insert embeddings (from Node.js)
-- 3. Join update
UPDATE ask_ruvnet.architecture_docs d
SET embedding = s.vec::ruvector(384)
FROM ask_ruvnet._embed_staging s WHERE d.id = s.id;
-- 4. Cleanup
DROP TABLE ask_ruvnet._embed_staging;
\`\`\`

**Bottom line**: For any bulk embedding update (>100 rows), use the staging table pattern. It is 10-15x faster than individual UPDATEs.`
  },
  {
    title: 'Decision Guide: Error handling in embedding pipelines',
    content: `## Error Handling Strategy for Embedding Pipelines

### The Decision
When embedding thousands of text entries via ONNX, how should you handle errors?

### Decision Criteria
- **Failure rate**: How often do individual embeddings fail?
- **Batch size**: If one fails in a batch of 100, do you lose all 100?
- **Recovery**: Can you retry failed entries without re-processing successful ones?

### The Correct Choice
**Catch individual embedding failures. Never abort the entire batch for one failure.** The pattern:

1. Process entries in batches of 100
2. Within each batch, wrap individual embed() calls in try/catch
3. Log failed entries with their IDs and error messages
4. Continue processing the rest of the batch
5. At the end, report total successes, failures, and the IDs of failed entries
6. Optionally retry failed entries with smaller batch size or individually

### What Happens If You Choose Wrong
- **No error handling (let it crash)**: One malformed text entry (null, empty, too long, weird Unicode) crashes the entire pipeline. If you were 90% done, you lose all progress and have to start over.
- **Catching at batch level only**: One bad entry causes the entire batch of 100 to fail. You lose 99 good embeddings because of 1 bad one.
- **Silent failures (catch and ignore)**: The entry gets no embedding and you never know about it. Search never returns that entry. Data silently disappears from results.

### Quick Reference
\`\`\`javascript
// CORRECT: Individual error handling
for (const entry of batch) {
  try {
    const vec = await svc.embed(entry.text);
    results.push({ id: entry.id, vec });
  } catch (err) {
    console.error('Failed to embed entry ' + entry.id + ': ' + err.message);
    failures.push(entry.id);
    // Continue processing — do NOT throw
  }
}
console.log('Batch: ' + results.length + ' OK, ' + failures.length + ' failed');
\`\`\`

**Bottom line**: Catch per-entry, log failures, continue processing. Report at the end. Never let one bad entry kill the pipeline.`
  },
  {
    title: 'Decision Guide: HNSW m and ef_construction parameters',
    content: `## Tuning HNSW m and ef_construction Parameters

### The Decision
When creating an HNSW index, two parameters control quality and speed: m (connections per node) and ef_construction (search width during build). What values should you use?

### Decision Criteria
- **Table size**: Larger tables benefit more from tuned parameters.
- **Recall requirements**: How important is finding the actual best match vs a good-enough match?
- **Build time budget**: Higher parameters = longer index build time.
- **Memory budget**: Higher m = more memory per index.

### The Correct Choice
**m=16, ef_construction=200 is the golden standard.** This is the recommended configuration for the Ask-Ruvnet KB and most use cases up to 500K rows.

\`\`\`sql
SET maintenance_work_mem = '512MB';
CREATE INDEX idx_arch_docs_embedding
ON ask_ruvnet.architecture_docs
USING hnsw (embedding ruvector_l2_ops)
WITH (m = 16, ef_construction = 200);
\`\`\`

### What Happens If You Choose Wrong
- **m too low (m=4)**: Each node connects to only 4 neighbors. The HNSW graph is poorly connected, search "gets stuck" in local optima, and recall drops significantly. You miss relevant results.
- **m too high (m=64)**: Each node stores 64 connections. The index consumes 4x more memory than m=16, build time increases substantially, but recall improvement is marginal (diminishing returns past m=16 for most datasets).
- **ef_construction too low (ef_construction=40)**: The index is built with a narrow search beam. The resulting graph has poor quality connections. Search recall suffers permanently — this cannot be fixed without rebuilding.
- **ef_construction too high (ef_construction=1000)**: Build time increases dramatically (10x+) with minimal recall improvement over 200. Wastes time on index construction.

### Quick Reference
| Parameter | Recommended | Range | Effect of Increasing |
|-----------|------------|-------|---------------------|
| m | 16 | 8-64 | Better recall, more memory |
| ef_construction | 200 | 64-512 | Better graph quality, slower build |

| Table Size | m | ef_construction | Notes |
|-----------|---|-----------------|-------|
| <10K rows | 16 | 200 | Standard settings |
| 10K-100K | 16 | 200 | Same — these are robust |
| 100K-500K | 16-24 | 200-300 | Consider tuning up |
| >500K | 24-32 | 300-400 | Or switch to IVFFlat |

**Bottom line**: m=16, ef_construction=200. Do not change these unless you are beyond 100K rows and have benchmarked the alternatives.`
  },
  {
    title: 'Decision Guide: Session management in Ruflo',
    content: `## Session Management in Ruflo

### The Decision
Ruflo supports session persistence — saving the state of a conversation or task across multiple interactions. Should you use it, and how?

### Decision Criteria
- **Task continuity**: Will you return to this task later?
- **Learning retention**: Do you want the system to remember patterns from this session?
- **Metrics tracking**: Do you want to measure agent performance over time?

### The Correct Choice
**Always restore the previous session at the start of work.** This loads learned patterns, agent configurations, and task context from the last session.

**Always persist state at the end of work.** This saves everything learned during the session for next time.

\`\`\`bash
# At session start
npx ruflo@latest session restore --latest

# At session end
npx ruflo@latest hooks session-end --generate-summary true --persist-state true --export-metrics true
\`\`\`

### What Happens If You Choose Wrong
- **Never restoring sessions**: Every conversation starts from scratch. The system cannot learn from past successes or failures. You repeat the same mistakes and rediscover the same patterns every time.
- **Never persisting sessions**: Good work is lost. Optimized agent configurations, learned routing patterns, and task context evaporate when the session ends.
- **Not exporting metrics**: You cannot track whether the system is improving over time. No data means no optimization.

### Quick Reference
| Action | When | Command |
|--------|------|---------|
| Restore session | Start of every session | session restore --latest |
| Persist state | End of every session | hooks session-end --persist-state true |
| Export metrics | End of every session | hooks session-end --export-metrics true |
| Generate summary | End of significant sessions | hooks session-end --generate-summary true |

**Bottom line**: Restore at start, persist at end. Every session. This is how the system gets smarter over time.`
  },
  {
    title: 'Decision Guide: Document versioning standard',
    content: `## Document Versioning Standard

### The Decision
How should you version documents, configuration files, and system documentation?

### Decision Criteria
- **Change tracking**: Can you tell when a document was last updated?
- **Change magnitude**: Can you tell if a change was a typo fix or a major rewrite?
- **History**: Can you trace the evolution of a document?

### The Correct Choice
**Every versioned document must have these two lines at the top:**

Line 1: Updated: YYYY-MM-DD HH:MM:SS TZ | Version X.Y.Z
Line 2: Created: YYYY-MM-DD HH:MM:SS TZ

**Version numbering follows semantic versioning:**
- **Bugfix (0.0.X)**: Typo fixes, minor corrections, formatting changes. The content meaning does not change.
- **Minor (0.X.0)**: New sections added, existing content updated, feature additions. The document covers more or different ground.
- **Major (X.0.0)**: Fundamental restructuring, paradigm changes, breaking changes to how the document should be interpreted or used.

### What Happens If You Choose Wrong
- **No versioning**: You cannot tell when a document was last updated. Is this guide from last week or six months ago? Is it still accurate? Nobody knows.
- **Only timestamps, no version numbers**: You know WHEN it changed but not HOW MUCH. A timestamp update could be a typo fix or a complete rewrite.
- **Inconsistent format**: Different documents use different versioning styles. Some have dates, some have versions, some have neither. The system becomes unreliable.
- **Not updating version when editing**: The document shows "v1.0.0" but has been edited 50 times. The version is meaningless.

### Quick Reference
| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Typo fix | 0.0.X (bugfix) | 1.0.0 -> 1.0.1 |
| Add new section | 0.X.0 (minor) | 1.0.1 -> 1.1.0 |
| Major rewrite | X.0.0 (major) | 1.1.0 -> 2.0.0 |

\`\`\`
Updated: 2026-02-18 14:30:00 EST | Version 1.2.3
Created: 2026-01-15 09:00:00 EST
\`\`\`

**Bottom line**: If you touch a document, update the version. Line 1 = updated timestamp + version. Line 2 = created timestamp. No exceptions.`
  }
];

// --- Main ---
async function main() {
  console.log('=== KB Decision Guides v1.0 ===');
  console.log(`Entries to insert: ${guides.length}`);
  console.log(`Target: ${SCHEMA}.${TABLE}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  if (DRY_RUN) {
    for (const g of guides) {
      console.log(`  [DRY] ${g.title} (${g.content.length} chars)`);
    }
    console.log(`\n${guides.length} guides would be inserted.`);
    await pool.end();
    return;
  }

  // Initialize ONNX
  log('Loading ONNX embedding model...');
  await initOnnx();

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < guides.length; i++) {
    const g = guides[i];
    const label = `[${i + 1}/${guides.length}]`;

    try {
      // Generate embedding
      const vecStr = await embed(`${g.title}\n\n${g.content}`);

      // Generate a stable doc_id from the title
      const docId = 'decision-guide-' + crypto.createHash('md5').update(g.title).digest('hex').slice(0, 12);
      const fileHash = crypto.createHash('md5').update(g.content).digest('hex');

      // Insert with ON CONFLICT DO NOTHING (doc_id uniqueness)
      const result = await pool.query(`
        INSERT INTO ${SCHEMA}.${TABLE} (doc_id, title, content, file_path, file_hash, category, doc_type, quality_score, is_duplicate, embedding)
        VALUES ($1, $2, $3, 'curated/decision-guides', $4, 'decision-guide', 'curated', 95, false, $5::ruvector(384))
        ON CONFLICT (doc_id) DO NOTHING
        RETURNING id
      `, [docId, g.title, g.content, fileHash, vecStr]);

      if (result.rowCount > 0) {
        log(`${label} Inserted: ${g.title} (id=${result.rows[0].id})`);
        inserted++;
      } else {
        log(`${label} Skipped (already exists): ${g.title}`);
        skipped++;
      }
    } catch (err) {
      console.error(`${label} FAILED: ${g.title} - ${err.message}`);
      failed++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (duplicate): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${guides.length}`);

  await pool.end();
  log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  pool.end().then(() => process.exit(1));
});
