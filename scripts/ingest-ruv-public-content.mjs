/**
 * Ingest rUv's public content into ask_ruvnet knowledge base
 * Sources (all 100% public, no login required):
 *   - GitHub READMEs: ruflo, agentic-flow, ruvector, flow-nexus, sparc, ruvbot, ruvnet profile
 *   - ruv.net about page (biography, philosophy, projects)
 *   - agentics.ruv.io blog posts
 */
import pg from '/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/node_modules/pg/lib/index.js';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';

const { Pool } = pg;
const pool = new Pool({ host: 'localhost', port: 5435, user: 'postgres', database: 'postgres', max: 3 });
const client = await pool.connect();

function makeEmbedding(text) {
  const embedding = new Array(384).fill(0);
  const hash = createHash('sha256').update(text).digest();
  for (let i = 0; i < 384; i++) {
    embedding[i] = ((hash[i % 32] / 255) * 2 - 1) * 0.1;
  }
  const terms = ['ruv','ruvnet','claude','agentic','swarm','mcp','hnsw','vector','sparc','neural',
                 'coaching','decision','architecture','pattern','pact','enterprise','autonomous'];
  terms.forEach((t, i) => {
    if (text.toLowerCase().includes(t)) embedding[i * 10] += 0.3;
  });
  return '[' + embedding.join(',') + ']';
}

async function ingestChunks(docId, title, text, filePath, category, docType, topics, date) {
  const words = text.split(/\s+/);
  const CHUNK = 600, OVL = 80;
  let count = 0;
  for (let i = 0; i < words.length; i += CHUNK - OVL) {
    const chunk = words.slice(i, i + CHUNK).join(' ');
    if (chunk.trim().length < 100) continue;
    const idx = Math.floor(i / (CHUNK - OVL));
    const chunkId = `${docId}-chunk-${idx}`;
    const fileHash = createHash('md5').update(chunk).digest('hex');
    const embedding = makeEmbedding(chunk);
    try {
      await client.query(`
        INSERT INTO ask_ruvnet.architecture_docs
        (doc_id, title, content, file_path, section_header, section_index, file_hash,
         package_name, package_version, doc_type, topics, category, quality_score,
         is_duplicate, embedding, knowledge_type, expertise_level, source_authority, triage_tier)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::ruvector(384),$16,$17,$18,$19)
        ON CONFLICT (doc_id) DO UPDATE SET
          content = EXCLUDED.content, title = EXCLUDED.title,
          quality_score = EXCLUDED.quality_score, updated_at = NOW()
      `, [
        chunkId, `${title} — Part ${idx + 1}`, chunk,
        filePath, title, idx, fileHash,
        'ruv-public-content', date, docType, topics, category,
        88, false, embedding, 'concept', 'advanced', 'expert-curated', 'silver'
      ]);
      count++;
    } catch(e) {
      console.error(`  ✗ Insert failed: ${e.message.substring(0, 80)}`);
    }
  }
  return count;
}

// ── Content sources ──────────────────────────────────────────────────────────

const SOURCES = [
  // GitHub READMEs
  {
    file: '/tmp/ruv-content/ruflo-README.md',
    id: 'ruv-github-ruflo-readme',
    title: 'Ruflo V3 — Official README by rUv',
    filePath: 'ruv-public/github/ruflo/README',
    category: 'ruv-content',
    docType: 'documentation',
    topics: ['ruflo', 'ruv', 'swarm', 'mcp', 'agentic', 'orchestration', 'ruvnet'],
    date: '2025-01-01'
  },
  {
    file: '/tmp/ruv-content/agentic-flow-README.md',
    id: 'ruv-github-agentic-flow-readme',
    title: 'Agentic-Flow — Official README by rUv',
    filePath: 'ruv-public/github/agentic-flow/README',
    category: 'ruv-content',
    docType: 'documentation',
    topics: ['agentic-flow', 'ruv', 'workflow', 'multi-agent', 'ruvnet'],
    date: '2025-01-01'
  },
  {
    file: '/tmp/ruv-content/ruvector-README.md',
    id: 'ruv-github-ruvector-readme',
    title: 'RuVector — Official README by rUv',
    filePath: 'ruv-public/github/ruvector/README',
    category: 'ruv-content',
    docType: 'documentation',
    topics: ['ruvector', 'ruv', 'vector', 'hnsw', 'postgresql', 'ruvnet'],
    date: '2025-01-01'
  },
  {
    file: '/tmp/ruv-content/flow-nexus-README.md',
    id: 'ruv-github-flow-nexus-readme',
    title: 'Flow Nexus — Official README by rUv',
    filePath: 'ruv-public/github/flow-nexus/README',
    category: 'ruv-content',
    docType: 'documentation',
    topics: ['flow-nexus', 'ruv', 'agentic', 'cloud', 'ruvnet'],
    date: '2025-01-01'
  },
  {
    file: '/tmp/ruv-content/sparc-README.md',
    id: 'ruv-github-sparc-readme',
    title: 'SPARC Methodology — Official README by rUv',
    filePath: 'ruv-public/github/sparc/README',
    category: 'ruv-content',
    docType: 'documentation',
    topics: ['sparc', 'ruv', 'methodology', 'agentic', 'ruvnet'],
    date: '2025-01-01'
  },
  {
    file: '/tmp/ruv-content/ruvnet-profile-README.md',
    id: 'ruv-github-profile-readme',
    title: 'rUv GitHub Profile — Overview of All Projects',
    filePath: 'ruv-public/github/ruvnet/profile',
    category: 'ruv-content',
    docType: 'reference',
    topics: ['ruv', 'ruvnet', 'projects', 'overview', 'agentic'],
    date: '2025-01-01'
  },
  {
    file: '/tmp/ruv-content/ruvbot-README.md',
    id: 'ruv-github-ruvbot-readme',
    title: 'ruvBot — AI Bot About rUv',
    filePath: 'ruv-public/github/ruvbot/README',
    category: 'ruv-content',
    docType: 'reference',
    topics: ['ruv', 'ruvbot', 'biography', 'ruvnet'],
    date: '2025-01-01'
  },
];

// Inline content (scraped via Playwright — no file)
const INLINE_SOURCES = [
  {
    id: 'ruv-website-about',
    title: 'rUv Biography & Agentic Engineering Philosophy — ruv.net',
    filePath: 'ruv-public/ruv.net/about',
    category: 'ruv-content',
    docType: 'reference',
    topics: ['ruv', 'biography', 'philosophy', 'pact', 'agentics', 'enterprise', 'ruvnet'],
    date: '2026-02-01',
    text: `rUv (Reuven Cohen) — Agentic Engineering Philosophy and Biography

PACT Methodology: Proactive, Autonomous, Collaborative, and Targeted
Definition: Agentics — The field of study and AI engineering practice focused on creating intelligent systems that are Proactive (anticipating and initiating changes), Autonomous (operating independently), Collaborative (working effectively with other systems or agents), and Targeted (pursuing defined objectives).

Core Principles:
- Develop agents for specific, valuable tasks. rUv focuses on building agents that solve real-world problems with measurable outcomes, not just theoretical constructs.
- Optimize for reliability and autonomy. Every agent should function consistently with minimal oversight while maintaining alignment with its intended purpose.
- Design for collaboration from the start. True agentic power emerges when multiple agents work together seamlessly, each handling specialized tasks in a coordinated fashion.

Expertise Areas: AI Agent Development, PACT Methodologies, Autonomous Systems, Multi-Agent Coordination, LLM Infrastructure. Approach: Technical, outcome-driven mentoring with practical implementations.

Clients: AWS, Microsoft, Ernst & Young, Baxter, OpenAI, Sun Microsystems, Meta, Kellogg/Northwestern, Rotman/UofT, and dozens of Fortune 500 enterprises across technology, finance, healthcare, and consulting sectors.

Biography: rUv is an independent AI consultant working with some of the largest companies in the world on their enterprise AI architecture and management strategies. He played a pivotal role in the 2023 deployment of EY's enterprise AI stack EY.ai, used by more than 400,000 employees, 1.5 million end users and a $1.4B budget.

A seasoned technology expert with a career spanning over three decades. From the early days of the internet, he was instrumental in shaping digital experiences as an alpha/beta tester for trailblazing companies such as Napster, AOL, and Sierra Online.

Reuven's foresight and expertise extended to cloud computing. He founded Enomaly Inc., a pioneering cloud computing company, and coined the term "infrastructure as a service" in 2005, a full year before Amazon's launch of EC2. As an inaugural member of the Amazon Web Services advisory board, his influence in the field is undeniable.

He served as an alpha/beta tester for OpenAI, contributing to advancements in AI programming and engineering and designed one of the largest enterprise systems at EY with a more than $1 billion budget and 400,000 users.

Reuven's track record includes advising governments and international organizations, including the US Federal CIO Council. In 2009, he co-authored the first US Cloud Definition with NIST, providing a foundation for cloud policy and implementation. He co-founded CloudCamp in 2008 — a global grassroots initiative that grew to hundreds of cities and introduced over 100,000 people to cloud computing.`
  },
  {
    id: 'ruv-website-projects',
    title: 'rUv Project Portfolio — All Agentic Engineering Tools',
    filePath: 'ruv-public/ruv.net/projects',
    category: 'ruv-content',
    docType: 'reference',
    topics: ['ruv', 'projects', 'ruflo', 'ruvector', 'agentdb', 'flow-nexus', 'sparc', 'ruvnet'],
    date: '2026-02-01',
    text: `rUv Featured Projects Portfolio (ruv.net)

Ruflo V3: Enterprise-grade AI orchestration platform. Hive-mind swarm intelligence, neural pattern recognition, 87+ advanced MCP tools. Reimagines how developers build with AI. Features: Swarm Intelligence, MCP Tools, Neural Patterns, Enterprise-Ready.

Agentic-Flow: Agent Workflow Engine. Powerful workflow orchestration system for building multi-agent AI applications. Create complex agent workflows with built-in state management, error handling, and execution monitoring for production-grade autonomous systems. Features: Workflow Engine, State Management, Multi-Agent, Production-Ready.

AgentDB: Sub-Millisecond Memory Engine. Cognitive layer that starts in milliseconds, runs entirely in disk or memory, keeps swarms synchronized in real time. Features HNSW vector graph search for 116x faster similarity queries. Boots in under 10ms with 20 MCP tools for seamless AI integration.

Flow Nexus: Agentic Hacker Arena. Deploy autonomous agent swarms into cloud-hosted agentic sandboxes using Claude Code/Desktop, OpenAI Codex, Cursor, GitHub Copilot, and other MCP-enabled tools. Build, compete, and monetize creations in the ultimate agentic playground.

RuVector: Self-Learning Vector Database. Distributed vector database that learns and improves over time. Features 39 attention mechanisms, Graph Neural Networks for self-optimization, Cypher queries, Raft consensus for horizontal scaling, WASM support.

research-swarm: Deep research system that never stops learning. Self-learning, researching forever. Monitors competitors, laws, compliance. Train it to manage ads, trade stocks, analyze markets 24/7.

agentic-payments: Enable AI agents to make autonomous purchases, execute trades, and coordinate multi-agent transactions with cryptographic authorization. MCP integration, Ed25519 signatures, Byzantine consensus.

lean-agentic: Hybrid language combining Lean4 formal verification with blazing-fast compilation, actor-based orchestration, vector-backed memory. 150x faster equality checks, Ed25519 proof signatures.

Goalie: AI-powered research planning using A* pathfinding and dynamic agent coordination. Create custom research agents embeddable into websites.

midstreamer: WebAssembly temporal analysis powered by Rust. 10-100x faster DTW/LCS algorithms, real-time streaming, AgentDB integration with 96-164x faster pattern matching.

AIMDS (AI Defense System): Production-ready adversarial defense system with real-time threat detection (<10ms), behavioral analysis, formal verification.

Neural Trader: Advanced autonomous trading system powered by neural networks and agentic AI. Real-time market analysis, risk management, adaptive learning algorithms.

Agentic Jujutsu: Quantum-ready version control system for AI agents. 23x faster than Git for multi-agent coordination, self-learning AI, quantum-resistant security. Built for code swarms of 1000s with lock-free architecture.

Agentic Robotics: Rust-powered AI-native framework for autonomous robotic systems. 5000x faster than traditional frameworks, self-learning AI, 200+ MCP tools, production-ready multi-robot swarm coordination.

Agent Name Service (ANS): Secure registry for AI agents based on OWASP GenAI Security Protocol.
SAFLA: Production-ready autonomous AI system with hybrid memory and meta-cognitive reasoning.
MidStream: Real-time LLM streaming platform with inflight data analysis built in Rust.
FACT: Fast Augmented Context Tools. Revolutionary LLM data retrieval with sub-100ms responses and 60-90% cost reduction.
QuDAG: Quantum-resistant distributed communication platform for autonomous AI agents and zero-person businesses.`
  },
  {
    id: 'ruv-agentics-about',
    title: 'Agentics Foundation — Mission, Vision & Community',
    filePath: 'ruv-public/agentics.ruv.io/about',
    category: 'ruv-content',
    docType: 'overview',
    topics: ['ruv', 'agentics', 'foundation', 'community', 'education', 'coaching'],
    date: '2026-02-01',
    text: `Agentics Foundation — Founded by rUv (Reuven Cohen)

Mission: Democratize AI education, fostering a collaborative community that drives innovation in artificial intelligence and autonomous agents through open source code.

Vision: Democratize access to cutting-edge AI knowledge and resources, empowering individuals and organizations to harness the transformative potential of AI. Cultivate a culture of continuous learning and growth, where contributions are recognized and rewarded based on merit and impact.

The Ai Hackerspace Collective is a pioneering non-profit dedicated to advancing artificial intelligence education and innovation. Inspired by the meritocratic principles of the Apache Foundation, committed to creating an ecosystem where talent and effort drive success.

Programs:
- AI Hackerspace Live: Weekly live events for AI enthusiasts and professionals to collaborate, learn, and innovate. Attendees earn badges and rewards, fostering a vibrant community of learners and contributors.
- Educational Programs: Biweekly classes on various Agentic topics led by industry experts. Cover wide range of AI subjects providing valuable knowledge and practical skills.
- Coaching Services: Tailored 1:1 and group coaching sessions providing personalized guidance. Leverage expertise of community leaders to help individuals and organizations achieve their AI goals.

Weekly Schedule: Live coding sessions Thursdays 12 noon Eastern (~1.5 hours). Show and tell Fridays 12 noon Eastern. Platform: video.agentics.org`
  }
];

// ── Run ingestion ──────────────────────────────────────────────────────────

let totalInserted = 0;
console.log('🧠 Ingesting rUv public content into KB\n');

// File-based sources
for (const src of SOURCES) {
  if (!existsSync(src.file)) { console.log(`⏭  ${src.id}: file missing`); continue; }
  const text = readFileSync(src.file, 'utf8');
  if (text.length < 200) { console.log(`⏭  ${src.id}: file too small`); continue; }

  // Clear existing
  await client.query(`DELETE FROM ask_ruvnet.architecture_docs WHERE doc_id LIKE $1`, [`${src.id}-%`]);

  const count = await ingestChunks(src.id, src.title, text, src.filePath, src.category, src.docType, src.topics, src.date);
  totalInserted += count;
  console.log(`✓ ${src.id}: ${count} chunks (${Math.round(text.length/1000)}K chars)`);
}

// Inline sources
for (const src of INLINE_SOURCES) {
  await client.query(`DELETE FROM ask_ruvnet.architecture_docs WHERE doc_id LIKE $1`, [`${src.id}-%`]);
  const count = await ingestChunks(src.id, src.title, src.text, src.filePath, src.category, src.docType, src.topics, src.date);
  totalInserted += count;
  console.log(`✓ ${src.id}: ${count} chunks`);
}

console.log(`\n✅ Total inserted: ${totalInserted} chunks`);

// Stats
const r = await client.query(`SELECT COUNT(*) FROM ask_ruvnet.architecture_docs WHERE category = 'ruv-content'`);
console.log(`📊 Total ruv-content entries in KB: ${r.rows[0].count}`);

client.release();
await pool.end();
