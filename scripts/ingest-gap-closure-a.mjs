import pg from 'pg';
import { pipeline } from '@xenova/transformers';
import crypto from 'crypto';

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres',
  password: 'guruKB2025', database: 'postgres'
});

let embedder;
async function embed(text) {
  if (!embedder) embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const out = await embedder(text, { pooling: 'mean', normalize: true });
  return '[' + Array.from(out.data).join(',') + ']';
}

const entries = [
  // ═══ TEACHING GAPS ═══
  {
    path: 'teaching/deployment-learning-path',
    title: 'Learning Path: From Local Dev to Production Deployment',
    content: `This guide walks you through the journey from running code on your laptop to deploying it for real users.

Level 1: Local Development
You start by running everything on your own machine. Your database, your AI agents, your web server - all running locally. This is where you experiment, break things, and learn. The command is usually something like 'npm run dev' or 'docker-compose up'.

Why it matters: Local development is your sandbox. You can try anything without consequences. If you break the database, you just restart it.

Level 2: Docker Containers
Once your app works locally, you package it into Docker containers. A container is like a shipping container for software - it includes everything your app needs to run, packaged in a standardized format. This means "it works on my machine" becomes "it works everywhere."

Key concepts:
- Dockerfile: The recipe for building your container
- docker-compose.yml: Orchestrates multiple containers (your app + database + cache)
- Volumes: Persistent storage that survives container restarts
- Environment variables: Configuration that changes between environments

Level 3: Staging Environment
Before going live, you deploy to a staging environment that mimics production. This is where you catch bugs that only appear when services communicate over real networks instead of localhost. Railway, Render, and Fly.io make this easy with one-click deploys.

Level 4: Production
The real thing. Real users, real data, real consequences. Production adds:
- SSL certificates (HTTPS)
- Domain name configuration
- Monitoring and alerting (know when things break)
- Backups (never lose data)
- Rate limiting (prevent abuse)
- Health checks (automatic restart on failure)

Level 5: Operations
Running in production means you need to:
- Monitor performance and errors
- Scale up when traffic increases
- Roll back deployments that cause problems
- Manage database migrations carefully
- Keep dependencies updated for security

Common mistakes to avoid:
- Hardcoding secrets (use environment variables)
- No health checks (your app crashes silently)
- No monitoring (you find out from users, not alerts)
- Deploying on Friday afternoon (just dont)`,
    category: 'teaching',
    quality: 98,
    knowledge_type: 'procedure',
    concepts: ['deployment', 'docker', 'staging', 'production', 'devops']
  },
  {
    path: 'teaching/monitoring-ops-learning-path',
    title: 'Learning Path: Monitoring and Operating AI Systems',
    content: `How do you know if your AI system is working? You monitor it. Here is the complete path from zero monitoring to professional operations.

Why Monitoring Matters:
Without monitoring, you are flying blind. Your AI agents could be failing, your database could be running out of space, your API could be timing out - and you would not know until a user complains. Good monitoring means you find problems before users do.

Level 1: Logs
The simplest form of monitoring. Every important action writes a line to a log file. When something goes wrong, you read the logs to figure out what happened.

Best practices:
- Log every API call with timing
- Log errors with full context (what was the input? what was the state?)
- Use structured logging (JSON format) so you can search and filter
- Never log passwords, API keys, or personal data

Level 2: Health Checks
A health check is a simple endpoint that says "yes, I am alive and working." Your deployment platform pings this endpoint every few seconds. If it stops responding, the platform restarts your service automatically.

What a good health check tests:
- Can the app respond to requests?
- Can it reach the database?
- Can it reach external APIs it depends on?

Level 3: Metrics
Numbers that tell you how your system is performing:
- Response time: How long requests take (p50, p95, p99)
- Error rate: What percentage of requests fail
- Token usage: How many AI tokens you are consuming (and the cost)
- Queue depth: How many tasks are waiting to be processed
- Memory and CPU usage: Resource consumption trends

Level 4: Alerting
Metrics are useless if nobody looks at them. Alerts notify you when metrics cross thresholds:
- Error rate above 5%: Something is wrong
- Response time above 2 seconds: Performance degrading
- Token spend above daily budget: Cost control
- Disk usage above 80%: Running out of space

Level 5: Observability
The ability to understand what happened inside your system by examining its outputs. This combines logs, metrics, and traces (following a single request through all services it touches). Tools like Grafana, Datadog, or simple PostgreSQL queries give you this visibility.

For Ruflo specifically:
- The hooks system (27 hooks) provides built-in monitoring points
- The statusline shows real-time agent state
- Background workers track drift, performance, and security
- Memory search lets you find what agents have learned`,
    category: 'teaching',
    quality: 98,
    knowledge_type: 'procedure',
    concepts: ['monitoring', 'operations', 'health-checks', 'alerting', 'observability']
  },
  {
    path: 'teaching/error-messages-glossary',
    title: 'Error Messages Glossary: What They Actually Mean in Plain English',
    content: `When your system throws an error, it is trying to tell you something. Here is what the most common errors actually mean and what to do about them.

CONNECTION ERRORS:
"ECONNREFUSED" - Your app tried to connect to something (database, API, service) that is not running. Fix: Start the service, check the port number, check if Docker containers are running.

"ETIMEDOUT" - The connection attempt took too long. The service might be overloaded, the network might be slow, or the address might be wrong. Fix: Check if the service is reachable, increase timeout settings.

"password authentication failed" - Wrong database password. Fix: Check your .pgpass file or PGPASSWORD environment variable. For our setup, the password is in ~/.pgpass.

JAVASCRIPT/NODE ERRORS:
"Cannot find module X" - A package is not installed. Fix: Run 'npm install' or 'npm install X'.

"SyntaxError: Unexpected token" - Your code has a typo or formatting error. The error message tells you the line number. Fix: Look at that line for missing brackets, commas, or quotes.

"TypeError: X is not a function" - You are trying to call something that is not callable. Common cause: importing wrong thing, or the API changed. Fix: Check the import and the documentation.

"RangeError: Maximum call stack size exceeded" - Infinite recursion. A function calls itself forever. Fix: Add a base case or check your recursive logic.

DATABASE ERRORS:
"relation X does not exist" - The table you are querying does not exist. Fix: Check the table name, check the schema (ask_ruvnet.kb_complete not just kb_complete).

"violates check constraint" - You tried to insert data that does not match the allowed values. Fix: Check what values the column accepts (like knowledge_type must be one of: concept, reference, procedure, etc).

"duplicate key violates unique constraint" - You tried to insert something that already exists. Fix: Use ON CONFLICT DO NOTHING or UPDATE.

AI/AGENT ERRORS:
"context window exceeded" - Too much text for the AI model. Fix: Reduce input size, use summarization, or chunk the input.

"rate limit exceeded" - Too many API calls too fast. Fix: Add delays between calls, use exponential backoff, or upgrade your plan.

"token budget exceeded" - You have used too many tokens. Fix: Optimize prompts, use cheaper models for simple tasks (Haiku vs Opus).

DOCKER ERRORS:
"port already in use" - Another service is using that port. Fix: Stop the other service or change the port number.

"no space left on device" - Disk is full. Fix: Run 'docker system prune' to clean up old images and containers.`,
    category: 'teaching',
    quality: 98,
    knowledge_type: 'reference',
    concepts: ['error-messages', 'debugging', 'troubleshooting', 'common-errors']
  },
  {
    path: 'teaching/deploy-to-production-cookbook',
    title: 'Cookbook: Deploying Ruflo to Production Step by Step',
    content: `This is the step-by-step recipe for deploying a Ruflo powered application to production.

Prerequisites:
- Your app runs locally and passes tests
- You have a Railway, Render, or similar account
- You have a domain name (optional but recommended)
- Your database is accessible externally (not just localhost)

Step 1: Containerize Your App
Create a Dockerfile that packages your app:
- Base image: node:20-slim (small and secure)
- Install only production dependencies (npm ci --production)
- Copy your built application code
- Set environment variables for production mode
- Expose the port your app listens on
- Health check endpoint configured

Step 2: Database Setup
Your local PostgreSQL on port 5435 works for development. For production you need:
- A managed database service (Railway PostgreSQL, Neon, Supabase)
- The ruvector extension installed (for vector operations)
- Your schema migrated (ask_ruvnet.kb_complete, architecture_docs)
- Connection pooling configured (PgBouncer or built-in)
- Regular automated backups

Step 3: Environment Configuration
Never hardcode secrets. Use environment variables:
- DATABASE_URL: Your production database connection string
- ANTHROPIC_API_KEY: For Claude API access
- NODE_ENV=production: Tells your app to use production settings
- PORT: The port your hosting platform assigns

Step 4: Deploy
On Railway: Connect your GitHub repo, set env vars, deploy.
On Render: Similar - connect repo, configure build command, set env vars.
On Docker host: docker-compose up -d with production compose file.

Step 5: Verify
- Hit your health check endpoint
- Run a test query through your API
- Check logs for any errors
- Verify database connectivity
- Test the search functionality

Step 6: Monitor
- Set up uptime monitoring (UptimeRobot, free tier)
- Configure error alerting (email or Slack notifications)
- Watch token usage for cost control
- Monitor response times

Step 7: Iterate
- Use blue-green or rolling deployments for zero-downtime updates
- Always be able to roll back to the previous version
- Test in staging before production
- Keep a deployment log of what changed and when`,
    category: 'teaching',
    quality: 98,
    knowledge_type: 'procedure',
    concepts: ['deployment', 'docker', 'railway', 'production', 'ci-cd']
  },
  {
    path: 'teaching/ai-to-business-value-bridge',
    title: 'Bridge: Connecting Technical AI Concepts to Business Outcomes',
    content: `You understand the tech. But how do you explain the VALUE to someone who writes the checks? This guide bridges technical AI concepts to business outcomes.

Vector Search = Instant Answers
Technical: HNSW-indexed embeddings enable sub-millisecond similarity search across millions of documents.
Business value: Your customer support bot finds the right answer in 0.001 seconds instead of 3 seconds. That means happier customers and fewer support tickets. At scale, this saves $50-100K per year in support costs.

Self-Learning Systems = Getting Better Without Paying Developers
Technical: Trajectory learning with neural pathway recording and reinforcement from outcomes.
Business value: The system gets better at its job every day without anyone writing new code. After 3 months, it handles 40% more edge cases than it did on day one. That is like having an employee who improves themselves without training.

Swarm Coordination = Doing More With Less
Technical: Hierarchical mesh topology with drift detection and agent specialization.
Business value: Instead of one expensive AI doing everything slowly, you have a team of cheap specialized AIs doing things in parallel. A task that takes 1 hour with one model takes 10 minutes with a coordinated swarm - at lower cost.

Edge Computing = No Cloud Bills
Technical: WASM-compiled models running locally on device hardware.
Business value: Your AI runs on the users device. No cloud API calls, no per-request costs, no latency, no data leaving the device. For a product with 100K users, this saves $10-50K per month in API costs.

Token Optimization = 75% Lower AI Costs
Technical: Tiny Dancer routing, model selection, and local AST editing.
Business value: Most AI startups spend 30-50% of revenue on API costs. Token optimization cuts that to 10-15%. On $100K monthly revenue, that is $20-35K saved every month going straight to profit.

Privacy-First Architecture = Market Access
Technical: Federated learning, PII stripping, on-device processing.
Business value: You can sell to healthcare (HIPAA), European markets (GDPR), and government (FedRAMP) because data never leaves the users control. These markets pay 3-10x more than consumer markets.

Mathematical Verification = Trust
Technical: Prime Radiant coherence engine, deterministic validation.
Business value: Your AI can prove its answers are correct, not just guess. For legal, medical, and financial applications, this is the difference between a toy and a product that enterprises will actually buy.`,
    category: 'teaching',
    quality: 99,
    knowledge_type: 'concept',
    concepts: ['business-value', 'roi', 'cost-optimization', 'market-access', 'enterprise']
  },

  // ═══ AGENTS GAPS ═══
  {
    path: 'agents/agent-lifecycle-deep-dive',
    title: 'Agent Lifecycle: Spawn, Execute, Report, Terminate',
    content: `Every agent in Ruflo goes through a predictable lifecycle. Understanding this lifecycle helps you debug problems and design better systems.

Phase 1: SPAWN
The agent is created with a specific type, task, and configuration. This is like hiring someone - you define their role, give them their assignment, and set boundaries.

What happens during spawn:
- Agent type determines capabilities (coder, researcher, tester, etc.)
- Task description tells the agent what to accomplish
- Memory context is loaded from previous sessions
- Resource limits are set (max tokens, max time)
- The agent is registered with the coordinator

Phase 2: EXECUTE
The agent works on its task autonomously. It reads files, writes code, runs commands, and makes decisions based on its specialization.

During execution:
- The agent follows its type-specific instructions
- It can use tools (file operations, bash commands, web searches)
- It stores findings in memory as it works
- Hooks fire at key points (pre-edit, post-edit, pre-command)
- The coordinator monitors for drift

Phase 3: REPORT
When the agent finishes (or hits a limit), it reports results back. This includes what it accomplished, what it learned, and any issues encountered.

The report includes:
- Task completion status (success, partial, failed)
- Output artifacts (code written, tests created, docs generated)
- Metrics (tokens used, time elapsed, files modified)
- Learned patterns stored in memory for future use

Phase 4: TERMINATE
The agent is cleaned up. Resources are released, temporary state is cleared, but learned patterns persist in memory.

What persists after termination:
- Patterns stored in AgentDB memory
- Metrics logged for performance analysis
- Neural pathways trained from outcomes
- Nothing else - agents are stateless between invocations

Common Lifecycle Problems:
- Agent hangs: Usually waiting for a tool that timed out. Check with swarm status.
- Agent drifts: Doing something other than its task. The hierarchical topology catches this.
- Agent fails silently: No report generated. Check logs and increase verbosity.
- Agent loops: Repeating the same action. Usually a retry bug - check exit conditions.`,
    category: 'agents',
    quality: 98,
    knowledge_type: 'concept',
    concepts: ['agent-lifecycle', 'spawn', 'execute', 'terminate', 'debugging']
  },
  {
    path: 'agents/agent-communication-patterns',
    title: 'How Agents Talk to Each Other: Memory, Events, and Direct Communication',
    content: `Agents need to share information. Here are the three main ways agents communicate in Ruflo.

Pattern 1: SHARED MEMORY (Most Common)
Agents write to and read from a shared memory store. One agent stores a finding, another agent reads it later. This is asynchronous - the sender does not wait for the receiver.

How it works:
- Agent A stores: memory store --key "auth-pattern" --value "Use JWT with refresh tokens"
- Agent B searches: memory search --query "authentication" and finds Agent As finding
- The memory is HNSW-indexed, so semantic search finds related content even with different words

When to use: When agents work on related tasks but not at the same time. The researcher finds information, the coder uses it later.

Pattern 2: EVENT-BASED (Hooks)
The hooks system fires events that other agents can respond to. When Agent A edits a file, a post-edit hook fires. This can trigger Agent B to review the change.

How it works:
- Agent A edits a file -> post-edit hook fires
- The hook checks if a reviewer agent should be notified
- If yes, a review task is created and assigned
- Agent B picks up the review task

When to use: When you want automatic reactions to specific actions. Every code change triggers a review. Every test failure triggers debugging.

Pattern 3: COORDINATOR-MEDIATED (Swarm)
In a hierarchical topology, agents communicate through the coordinator (queen). Agent A reports to the queen, the queen decides what Agent B needs to know, and forwards relevant information.

How it works:
- Agent A completes task and reports to coordinator
- Coordinator analyzes the result and updates the plan
- Coordinator assigns next task to Agent B with relevant context from Agent A
- Agent B never talks directly to Agent A

When to use: When you need tight control over information flow. Prevents agents from overwhelming each other with irrelevant data.

Anti-Pattern: Direct Agent Communication
Agents should NOT talk directly to each other in most cases. This creates tight coupling, makes debugging harder, and can cause infinite loops (Agent A asks Agent B, who asks Agent A, who asks Agent B...).

The Exception: Mesh topology deliberately uses direct communication for speed, but includes drift detection to prevent loops.`,
    category: 'agents',
    quality: 98,
    knowledge_type: 'concept',
    concepts: ['agent-communication', 'shared-memory', 'hooks', 'coordinator', 'anti-patterns']
  },
  {
    path: 'agents/agent-failure-recovery',
    title: 'When Agents Fail: Recovery Patterns for Resilient Systems',
    content: `Agents fail. The question is not IF but WHEN and HOW you handle it. Here are the failure patterns and recovery strategies.

Failure Type 1: TIMEOUT
The agent takes too long. Maybe the API is slow, maybe the task is bigger than expected.
Recovery: Set reasonable timeouts. When an agent times out, log what it accomplished so far and either retry with a longer timeout or break the task into smaller pieces.

Failure Type 2: API ERROR
The AI provider returns an error (rate limit, server error, invalid request).
Recovery: Implement exponential backoff - wait 1 second, then 2, then 4, then 8. Most temporary errors resolve within 30 seconds. For persistent errors, switch to a different model or provider.

Failure Type 3: DRIFT
The agent wanders off-task, doing something unrelated to its assignment.
Recovery: The hierarchical topology catches this. The coordinator compares the agents actions against its task description. If they diverge too far, the agent is stopped and the task is reassigned. Prevention is better: use specialized agents with narrow scope.

Failure Type 4: INFINITE LOOP
The agent repeats the same action over and over without making progress.
Recovery: Track action history. If the same action (or very similar actions) repeat more than 3 times, force-stop the agent. Usually caused by a retry mechanism without proper exit conditions.

Failure Type 5: RESOURCE EXHAUSTION
The agent uses too many tokens, too much memory, or too much disk space.
Recovery: Set hard limits before spawning. The agent is terminated when limits are reached. Its partial work is saved so another agent can continue from where it left off.

Failure Type 6: CASCADING FAILURE
One agent fails, which causes other agents that depend on it to fail.
Recovery: Use the dead mans switch pattern - agents report health periodically. Silence means failure. The coordinator detects missing heartbeats and reassigns dependent tasks. Never design chains where one failure brings down everything.

Best Practice: Design for Failure
- Every agent task should be idempotent (safe to retry)
- Store progress checkpoints so work is not lost
- Use ON CONFLICT DO NOTHING for database writes
- Log everything so you can diagnose after the fact
- Test failure scenarios deliberately (chaos engineering for agents)`,
    category: 'agents',
    quality: 98,
    knowledge_type: 'concept',
    concepts: ['failure-recovery', 'resilience', 'timeout', 'drift', 'cascading-failure']
  },
  {
    path: 'agents/custom-agent-creation-guide',
    title: 'Creating Your Own Custom Agent Types in Ruflo',
    content: `Ruflo comes with 60+ agent types, but sometimes you need something specific. Here is how to create your own.

Step 1: Define the Role
What does this agent DO? Be specific. Instead of "handles data," say "ingests CSV files into PostgreSQL with ONNX embeddings." The narrower the role, the better the agent performs.

Step 2: Choose the Base Type
Start from an existing agent that is closest to what you need:
- coder: For agents that write or modify code
- researcher: For agents that gather and analyze information
- tester: For agents that validate and verify
- reviewer: For agents that check quality
- system-architect: For agents that make design decisions

Step 3: Create the Skill
A skill defines the agents behavior. It includes:
- System prompt: The agents personality and expertise
- Tools available: What the agent can use (file ops, bash, web)
- Constraints: What the agent should NOT do
- Output format: How results should be structured

Step 4: Register with Ruflo
Add your agent type to the configuration so Ruflo knows how to spawn it:
- Agent type name (must be unique)
- Default model (Haiku for simple tasks, Opus for complex)
- Memory namespace (keeps this agents knowledge separate)
- Hook subscriptions (which events trigger this agent)

Step 5: Test Extensively
Spawn your custom agent with various tasks and verify:
- Does it stay on-task? (no drift)
- Does it produce correct output?
- Does it handle errors gracefully?
- Does it respect resource limits?
- Does it store useful patterns in memory?

Example: KB Ingestion Agent
Role: Ingest documents into the knowledge base with ONNX embeddings
Base: coder
Skill: Read files, generate embeddings with Xenova, insert into PostgreSQL
Constraints: Never modify existing entries, always use ON CONFLICT DO NOTHING
Output: Count of entries inserted, any errors encountered
Model: Haiku (embeddings are mechanical, dont need reasoning power)

The key insight: Custom agents are just skills attached to execution engines. The agent framework handles lifecycle, memory, and coordination. You just define WHAT the agent knows and does.`,
    category: 'agents',
    quality: 98,
    knowledge_type: 'procedure',
    concepts: ['custom-agents', 'skills', 'agent-creation', 'configuration', 'testing']
  },

  // ═══ GENERAL GAPS ═══
  {
    path: 'general/what-is-agentic-ai-explainer',
    title: 'What is Agentic AI? Plain English for Non-Coders',
    content: `Imagine you have an incredibly smart assistant. But instead of just answering questions when asked, this assistant can:
- Notice problems on its own and fix them
- Break big tasks into smaller pieces and work through them
- Learn from experience and get better over time
- Coordinate with other assistants to get complex things done
- Keep working even when you are not watching

THAT is agentic AI. The word "agentic" means "having agency" - the ability to act independently.

How is this different from ChatGPT?
ChatGPT (and similar chatbots) are REACTIVE. You ask a question, they answer. You ask another, they answer. They cannot take action on their own.

Agentic AI is PROACTIVE. You give it a goal ("make my website faster"), and it:
1. Analyzes the current performance
2. Identifies bottlenecks
3. Writes the code to fix them
4. Tests that the fixes work
5. Reports back what it did

All without you asking "what is the bottleneck?" then "how do I fix it?" then "please write the code" then "please test it."

Real-World Analogy:
Regular AI is like having a brilliant consultant on the phone. They give great advice, but you have to do everything yourself.
Agentic AI is like hiring a team that gets the job done. You say what you want, they figure out how and do it.

The Key Components:
1. AGENTS: Specialized AI workers (like team members with different skills)
2. ORCHESTRATION: The system that coordinates agents (like a project manager)
3. MEMORY: How agents remember what they have learned (like a shared knowledge base)
4. TOOLS: What agents can use to take action (file editing, running code, web browsing)
5. LEARNING: How agents improve over time (like on-the-job training)

Why Should You Care?
Because agentic AI is the difference between AI as a novelty and AI as a genuine productivity multiplier. When AI can act autonomously, it can handle the 80% of work that is repetitive, leaving you to focus on the creative 20%.

Ruflo is one implementation of agentic AI. It provides the agents, orchestration, memory, tools, and learning all in one system.`,
    category: 'general',
    quality: 99,
    knowledge_type: 'concept',
    concepts: ['agentic-ai', 'autonomy', 'agents', 'orchestration', 'learning']
  },
  {
    path: 'general/ai-jargon-decoder',
    title: 'AI Jargon Decoder: 30 Confusing Terms Explained Simply',
    content: `AI is full of intimidating jargon. Here is what the terms actually mean.

LLM (Large Language Model): A very large AI that learned to write by reading the internet. Examples: Claude, GPT, Gemini.

Token: A piece of text, roughly 3/4 of a word. "Hello world" is 2 tokens. You pay per token when using AI APIs.

Embedding: Converting text into a list of numbers that captures meaning. Similar texts get similar numbers. This is how AI "understands" similarity.

Vector: Just a list of numbers. An embedding IS a vector. When people say "vector search," they mean finding similar embeddings.

HNSW: A fast way to search through millions of vectors. Instead of comparing every single one, it uses a clever shortcut that gets 99% accuracy in 0.001% of the time.

Cosine Similarity: How you measure if two vectors point in the same direction. 1.0 = identical, 0 = unrelated, -1.0 = opposite.

RAG (Retrieval Augmented Generation): Instead of the AI guessing, it first searches a knowledge base for relevant info, then answers using that info. Your Ask Ruvnet system uses RAG.

Fine-tuning: Teaching an existing AI model new tricks by training it on specific examples. Like giving a general doctor specialized training.

LoRA (Low-Rank Adaptation): A cheap way to fine-tune. Instead of changing the whole model, you add small adapter layers. 100x cheaper than full fine-tuning.

Context Window: How much text the AI can consider at once. Claude has 200K tokens. Bigger window = more information considered.

Hallucination: When AI confidently makes something up. Like a student who writes a convincing essay about a book they never read.

Prompt Engineering: Crafting your instructions to get better AI output. The difference between "write code" and "write production-ready Python with error handling and type hints."

MCP (Model Context Protocol): A standardized way for AI to use external tools. Like USB but for AI capabilities.

Swarm: Multiple AI agents working together on a task, coordinating their efforts.

Topology: How agents are connected. Star = all talk to one center. Mesh = everyone talks to everyone. Hierarchical = chain of command.

Drift: When an AI gradually wanders away from its intended task. Like a meeting that goes off-topic.

WASM: Code that runs anywhere - browser, server, phone. Ruflo uses it for cross-platform compatibility.

ADR: Architectural Decision Record. A document that captures WHY a technical decision was made.

SPARC: Specification, Pseudocode, Architecture, Refinement, Completion. A methodology for building with AI.

Inference: When an AI generates output. Training teaches it, inference uses what it learned.`,
    category: 'general',
    quality: 99,
    knowledge_type: 'reference',
    concepts: ['jargon', 'glossary', 'ai-terms', 'definitions', 'beginner']
  },
  {
    path: 'general/ruvnet-ecosystem-map',
    title: 'The RuvNet Ecosystem: How All the Pieces Connect',
    content: `The RuvNet ecosystem has many components. Here is how they all fit together.

THE CORE: Root Vector (RueVector)
At the center of everything is Root Vector, the engine that makes things fast. It combines hypergraph structures with vector operations. Think of it as the engine in a car - you dont interact with it directly, but everything depends on it.

Root Vector provides:
- Vector embeddings (turning text into searchable numbers)
- Graph neural networks (understanding relationships)
- HNSW indexing (fast similarity search)
- WASM compilation (runs anywhere)

THE ORCHESTRATOR: Ruflo
Ruflo is the system that coordinates everything. It manages agents, handles memory, routes tasks, and ensures quality. Think of it as the conductor of an orchestra.

Ruflo provides:
- Agent spawning and lifecycle management
- Swarm coordination (multiple agents working together)
- Memory and learning (patterns persist across sessions)
- Hooks system (27 event-driven triggers for automation)
- Security (threat detection, PII stripping, jailbreak protection)

THE KNOWLEDGE BASE: Ask Ruvnet
This is YOUR personal AI tutor. It stores curated knowledge in PostgreSQL with RueVector embeddings, making it searchable by meaning rather than just keywords.

Ask Ruvnet provides:
- Expert-curated knowledge entries
- Semantic search via embeddings
- Teaching content for learning AI concepts
- Video knowledge from Agentics Foundation sessions

THE TOOLS:
- AgentDB: Database library for agent memory and learning
- Agentic Flow: Core library for agent operations
- FlowNexus: Integration layer connecting all systems
- Tiny Dancer: Token optimization through smart model routing

THE COMMUNITY: Agentics Foundation
The non-profit organization behind the ecosystem. Over 100K members worldwide. Organizes hackathons, meetups, and educational content.

How data flows:
1. You ask a question to Ask Ruvnet
2. The MCP server searches the KB using RueVector embeddings
3. Relevant entries are found via HNSW index
4. Claude uses those entries as context to answer your question
5. The system learns from the interaction for next time`,
    category: 'general',
    quality: 98,
    knowledge_type: 'reference',
    concepts: ['ecosystem', 'root-vector', 'ruflo', 'ask-ruvnet', 'agentics-foundation']
  }
];

async function ingestEntry(entry, idx, total) {
  const clean = entry.content.replace(/[^\x00-\x7F]/g, '');
  const cleanTitle = entry.title.replace(/[^\x00-\x7F]/g, '');
  const embedText = (cleanTitle + ' ' + clean).substring(0, 1500);
  const vec = await embed(embedText);
  const { rows } = await pool.query(
    `INSERT INTO ask_ruvnet.kb_complete (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
     VALUES ($1, $2, $3, $4, $5, 1, $6, $7::ruvector) ON CONFLICT (file_path) DO NOTHING RETURNING id`,
    [entry.path, cleanTitle, clean, entry.category, entry.quality, clean.length, vec]);
  let kbId;
  if (rows.length > 0) { kbId = rows[0].id; }
  else { const { rows: [e] } = await pool.query(`SELECT id FROM ask_ruvnet.kb_complete WHERE file_path = $1`, [entry.path]); kbId = e.id; }
  const docId = `kb-complete-${kbId}`;
  const summary = clean.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 3).join(' ').replace(/\s+/g, ' ').trim().substring(0, 300);
  const fileHash = crypto.createHash('sha256').update(clean).digest('hex').substring(0, 16);
  await pool.query(
    `INSERT INTO ask_ruvnet.architecture_docs (doc_id, title, content, file_path, file_hash, category, quality_score, knowledge_type, concepts, summary, expertise_level, source_authority, triage_tier, is_duplicate, embedding)
     SELECT $1, $2, kc.content, $3, $4, $5, kc.quality_score, $6, $7::text[], $8, 'expert', 'expert-curated', 'gold', false, kc.embedding
     FROM ask_ruvnet.kb_complete kc WHERE kc.id = $9 ON CONFLICT (doc_id) DO NOTHING`,
    [docId, cleanTitle, `kb-complete/${entry.path}`, fileHash, entry.category, entry.knowledge_type, entry.concepts, summary, kbId]);
  console.log(`[${idx+1}/${total}] ${cleanTitle} (${entry.category})`);
}

async function main() {
  console.log(`Gap closure batch A: ${entries.length} entries`);
  const t0 = Date.now();
  for (let i = 0; i < entries.length; i++) await ingestEntry(entries[i], i, entries.length);
  console.log(`Done! ${entries.length} in ${((Date.now()-t0)/1000).toFixed(1)}s`);
  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) as count FROM ask_ruvnet.kb_complete');
  console.log(`KB total: ${count}`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
