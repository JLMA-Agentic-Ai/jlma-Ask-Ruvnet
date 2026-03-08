#!/usr/bin/env node
/**
 * Agentics Video Knowledge -> PostgreSQL KB with ONNX Embeddings
 * Uses kb-embed.js for proper all-MiniLM-L6-v2 embeddings via ONNX
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { embed, embedBatch, close, getPool } = require('../src/storage/kb-embed.js');

const pool = getPool();

async function upsertKnowledge(entry) {
  const text = `${entry.title} ${entry.content}`.slice(0, 2000);
  const vec = await embed(text);
  const vecStr = '[' + vec.join(',') + ']';

  // Check if exists
  const existing = await pool.query(
    "SELECT id FROM openclaw_memory.operational_knowledge WHERE title = $1 AND tags @> ARRAY['agentics-knowledge'] LIMIT 1",
    [entry.title]
  );

  if (existing.rows.length > 0) {
    // Update embedding on existing
    await pool.query(
      "UPDATE openclaw_memory.operational_knowledge SET content = $1, embedding = $2::ruvector(384), tags = $3, confidence = $4 WHERE id = $5",
      [entry.content, vecStr, entry.tags, entry.confidence, existing.rows[0].id]
    );
    return 'updated';
  }

  await pool.query(
    `INSERT INTO openclaw_memory.operational_knowledge (category, title, content, tags, learned_from, confidence, embedding)
     VALUES ($1, $2, $3, $4, $5, $6, $7::ruvector(384))`,
    [entry.category, entry.title, entry.content, entry.tags, entry.learned_from, entry.confidence, vecStr]
  );
  return 'inserted';
}

const entries = [
  {
    category: 'agentics-architecture',
    title: 'Ruflo V3: Complete Architecture Overview',
    content: `Ruflo V3 is an agentic AI orchestration framework with 500K+ downloads and 12K+ GitHub stars (as of Jan 2026). Root Vector compiled to WASM sits at the core — an intelligent vector database replacing PGVector with attention mechanisms. Hierarchical mesh is the default agent coordination topology — a queen coordinates workers who can also peer-communicate. Agent DB manages data with vector and graph implementations. Memory uses trajectory recording stored as neural pathways for continuous learning. Model routing selects between Haiku/Sonnet/Opus in <0.5ms based on task complexity. Key capabilities include incremental learning via micro-LoRa training during use, 27 hooks system for intelligent learning at every stage, 12 background workers for continuous optimization, drift detection and monitoring, defense system with 0.04ms threat detection, real-time PII stripping, jailbreak monitoring. Agent architecture uses 3-tier model: coordinator to specialists to workers. 15 agent limit in Claude Code with workaround via sub-agent invocation and headless instances. 14,000+ vetted skills from GitHub, transferable between Claude desktop/code/web via zip files. Ruflo V3 differs from Crew AI, LangGraph, and Autogen by including: learning capabilities, pattern recognition, expert routing, attention mechanisms, QLoRA fine-tuning, vector memory, and true swarm coordination.`,
    tags: ['agentics-knowledge','ruflo','v3','architecture','wasm','root-vector','agent-orchestration','hierarchical-mesh'],
    learned_from: 'Synthesized from 12+ Agentics Foundation videos (Oct 2025-Jan 2026)',
    confidence: 0.95
  },
  {
    category: 'agentics-architecture',
    title: 'Root Vector: Intelligent Vector Database System',
    content: `Root Vector is a next-generation vector database that replaces PGVector with attention-based mechanisms. It is the core storage engine inside Ruflo V3. Compiled to WASM for cross-platform deployment (runs locally in browser, Node.js, edge devices). Uses hyperbolic embeddings in Poincare ball model for hierarchical data representation. Graph neural networks for relationship-aware search. Self-learning mechanisms improve search quality over time. Features include real-time learning that adapts embeddings based on usage patterns, adaptive recommendations based on query history, privacy-preserving local processing via WASM. HNSW indexing provides 150x-12,500x faster pattern search vs brute force, 50-75% memory reduction via quantization, sub-millisecond query latency. Samsung Smart TV integration demonstrated at Global AI Hackathon Dec 2025. Root Vector powers the RuVector PostgreSQL extension (port 5435) with HNSW indexing via ruvector_embed() for semantic search.`,
    tags: ['agentics-knowledge','root-vector','vector-database','wasm','hnsw','hyperbolic-embeddings'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.95
  },
  {
    category: 'agentics-architecture',
    title: 'Prime Radiant: AI Anti-Hallucination Coherence Engine',
    content: `The Prime Radiant is a coherence engine designed to solve AI hallucinations and unverifiable confidence scores. Named after Asimov Foundation series. Uses mathematical determinism over probabilistic outputs — if a statement cannot be mathematically verified, it is flagged. Recursive language models verify their own outputs in a loop. Built in Rust for performance and safety. Designed for edge computing — runs locally without cloud dependency. Integrates with agent swarms to verify collective outputs. Process: AI generates response, Prime Radiant scores for mathematical coherence, incoherent segments flagged and re-generated, recursive verification until threshold met, final output includes verifiable integrity scores. Serves as verification layer in Ruflo V3 quality pipeline combined with QE Fleet (51 agents across 12 domains).`,
    tags: ['agentics-knowledge','prime-radiant','anti-hallucination','coherence-engine','rust','verification'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.9
  },
  {
    category: 'agentics-architecture',
    title: 'AI Symbolic Protocol: Reducing Ambiguity to Under 2 Percent',
    content: `The AI Symbolic Protocol (created by Brad Ross) is a mathematical language system reducing ambiguity in AI specifications from 40% to less than 2%. Uses 512 carefully designed symbols representing common AI/software concepts unambiguously with precise mathematical definitions. Implementations include NPM validation package for JavaScript/TypeScript, Rust WASM for browser/edge, Lean4 for formal mathematical verification. Traditional natural language specifications have 40% ambiguity — agents misinterpret 4 out of 10 times. The protocol drops this to under 2%. Use cases: agent-to-agent swarm communication, specification writing for autonomous coding, formal verification of AI outputs, cross-model communication between different LLMs.`,
    tags: ['agentics-knowledge','ai-symbolic-protocol','specification','ambiguity-reduction','formal-verification'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.9
  },
  {
    category: 'agentics-projects',
    title: 'Beacon: Wi-Fi Mesh Disaster Rescue System',
    content: `Beacon is disaster rescue technology using Wi-Fi mesh networks for life detection through rubble. Detects human presence through walls via Wi-Fi signal analysis. Measures movement, breathing, heartbeat at 0.1Hz resolution. Self-organizing mesh networks in disaster zones with no infrastructure. Cost: 5-20 dollars per device on ESP32-class microcontrollers, battery-powered. Quantum-resistant algorithms prevent signal spoofing with encrypted mesh communication. Deployment: drop hundreds from drones over earthquake rubble, they self-organize, detect life signs, report locations. Total cost for building collapse coverage under 1000 dollars.`,
    tags: ['agentics-knowledge','beacon','disaster-rescue','wifi-mesh','life-detection','quantum-resistant'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.85
  },
  {
    category: 'agentics-architecture',
    title: 'Emily OS: Agent Swarm Orchestration Platform',
    content: `Emily OS is an orchestration layer for large-scale agent swarms, LLM-agnostic. Scales from 2 to 100,000 agents. Works with Claude, GPT, Llama, Mistral, or any model. One-to-many swarm communication patterns. Built on PostgreSQL + vector DB for state management with Celery task orchestration. Agents defined by capabilities not model type. Dynamic scaling based on task complexity. Fault-tolerant — agents can fail and be replaced without losing swarm state. Complementary to Ruflo V3: Emily OS manages the fleet, Ruflo handles individual agent intelligence.`,
    tags: ['agentics-knowledge','emily-os','orchestration','llm-agnostic','swarm-management','scalability'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.85
  },
  {
    category: 'agentics-architecture',
    title: 'Hive Mind Architecture: Distributed Superintelligence',
    content: `Hive Mind Architecture enables distributed cognition across 1,000+ agents achieving behavior beyond any single agent. Shared memory with sub-millisecond latency. No context window limitations — knowledge distributed across swarm. Byzantine fault-tolerant consensus (tolerates f < n/3 malicious agents). Topologies: Hierarchical (queen controls workers, anti-drift), Mesh (fully connected peers), Hierarchical-mesh (recommended for 10+), Adaptive (dynamic switching). Consensus: Byzantine FT, Raft leader-based, Gossip epidemic, CRDT conflict-free. Demonstrations: universe simulation (10K agents, 60 FPS, 2.89M interactions/sec), drone swarm (1K drones, 100% coverage), smart city traffic (100K vehicles), microbiome analysis (250M agents, 40GB data, 187M interactions/sec).`,
    tags: ['agentics-knowledge','hive-mind','distributed-intelligence','byzantine-fault-tolerance','swarm-coordination','consensus'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.9
  },
  {
    category: 'agentics-projects',
    title: 'QE Fleet: 51-Agent Quality Engineering System',
    content: `QE Fleet (Quality Engineering Fleet) by Dragon: 51 specialized agents across 12 quality domains built on Ruflo V3. Domains: unit testing, integration testing, performance testing, security testing, accessibility testing, API testing, UI testing, data validation, regression testing, load testing, compliance testing, code quality analysis. Process: code changes submitted, coordinator analyzes scope, relevant specialists activated in parallel, results aggregated with confidence scores, unified quality report with pass/fail/warning per domain. Uses Prime Radiant coherence scoring to verify test results, preventing false positives/negatives.`,
    tags: ['agentics-knowledge','qe-fleet','quality-engineering','testing','multi-agent'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.85
  },
  {
    category: 'agentics-projects',
    title: 'Fox Flow Database: 12.8 Million QPS Vector Database',
    content: `Fox Flow by Colby: high-performance vector database achieving 12.8 million QPS (previous best Redis at 3,000 QPS). 9 million read ops/sec, 12 million write ops/sec. Nuclear mode with shadow fox for max throughput. 1-bit quantization for extreme memory efficiency. Custom memory layout for vector operations. Lock-free concurrent data structures. Demonstrates purpose-built vector databases can outperform general-purpose by 4,000x. Implications for real-time AI inference, recommendation systems, agent memory.`,
    tags: ['agentics-knowledge','fox-flow','vector-database','high-performance','quantization'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.85
  },
  {
    category: 'agentics-projects',
    title: 'Neural Trading: Entropy-Based Stock Prediction',
    content: `Neural Trading: entropy-based stock market prediction. Uses information entropy rather than traditional technical indicators. Entropy measures uncertainty/disorder in price movements. Sub-millisecond decision latency. 53.8% general accuracy (above 50% random baseline), 87% on walk-forward testing (out-of-sample, prevents overfitting). Architecture: vector embeddings of market microstructure, real-time entropy across timeframes, agent-based execution with risk guardrails.`,
    tags: ['agentics-knowledge','neural-trading','entropy','stock-prediction'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.8
  },
  {
    category: 'agentics-projects',
    title: 'OS-Level AI Optimizer with RuVector',
    content: `Self-learning OS optimizer using RuVector for intelligent resource management. Three.js desktop app for real-time monitoring. Thermal-aware CPU scheduling routes tasks to cooler cores. GPU memory optimization for AI workloads. AI defense at kernel level detects malicious processes. Predictive prefetch via Markov chain preloads files. Time-traveling config checkpoints for rollback. 5MB compiled UI. Windows complete, Mac planned, Linux for servers. Uses RuVector embeddings to learn system patterns over time. Demonstrates agentic AI at OS level, not just application level.`,
    tags: ['agentics-knowledge','os-optimizer','ruvector','system-optimization','thermal-aware'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.85
  },
  {
    category: 'agentics-projects',
    title: 'Microbiome Analysis: Largest Graph Database in Biology',
    content: `Massive microbiome graph database using agentic systems for biological discovery. 40GB data, 8,000 samples, 250 million agents in parallel, 187 million interactions/sec, 18,000 PubMed papers ingested. Discovered correlations between gut microbiome and Huntingtons disease, identified depression-related microbiome signatures, auto cross-referenced against medical literature. Graph database for microbial relationships, 250M lightweight agents each analyzing subsets, gossip protocol aggregation, PubMed embeddings for semantic matching. Demonstrates agentic AI at scale impossible for human researchers.`,
    tags: ['agentics-knowledge','microbiome','biology','graph-database','medical-research'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.85
  },
  {
    category: 'agentics-projects',
    title: 'Multiverse Oracle: Predictive Time Series via Lorenz Attractors',
    content: `Multiverse Oracle: predictive system using chaos theory (Lorenz attractors). Simulates 100,000 parallel universes with slightly different initial conditions. Predictions emerge from consensus across simulations. 99% accuracy vs chaos, 0.68ms prediction latency, 1,400 predictions/sec. Process: capture state, 100K simulations diverge, evolve via Lorenz dynamics, consensus reveals most probable future, confidence from simulation agreement. Applications: financial markets, weather, network traffic, any chaotic deterministic system.`,
    tags: ['agentics-knowledge','multiverse-oracle','chaos-theory','prediction','time-series'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.8
  },
  {
    category: 'agentics-architecture',
    title: 'Agentic Security: Defense Systems and Threat Detection',
    content: `Security across Agentics ecosystem: real-time defense, prompt injection prevention, quantum-resistant algorithms. Ruflo V3: 0.04ms threat detection, real-time PII stripping, jailbreak monitoring, ADRs for security decisions. Four defense layers: input validation scanning for injection, output filtering for PII, behavioral drift detection for compromised agents, Byzantine consensus preventing single-agent attacks. AIMDS (AI Defense System) provides 25-level adaptive mitigation for prompt injection. Beacon project uses quantum-resistant algorithms.`,
    tags: ['agentics-knowledge','security','prompt-injection','pii-detection','threat-detection'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.9
  },
  {
    category: 'agentics-architecture',
    title: 'Skills System: Bounded Contexts for Agent Capabilities',
    content: `Ruflo V3 Skills System treats capabilities as transferable, composable units. Skills are learned abilities (bounded contexts defining WHAT), agents are executors (defining WHO). Skills transfer between Claude Desktop/Code/Web as zip files. Progressive discovery: loaded on-demand. 14,000+ vetted skills from GitHub with quality validation. Skills compose — one invokes others. YAML manifests define capabilities/inputs/outputs. DDD bounded context pattern — skills own their logic and data. Version-controlled independently from agents. Skills aggregation follows topology: Star (central registry), Mesh (peer-to-peer sharing), Hierarchical (queen catalog).`,
    tags: ['agentics-knowledge','skills-system','bounded-contexts','agent-capabilities','ddd'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.9
  },
  {
    category: 'agentics-architecture',
    title: 'Network Topologies for Agent Coordination',
    content: `Ruflo V3 supports multiple agent coordination topologies. Hierarchical: queen controls workers, best for 6-8 agents, anti-drift, single point of failure risk. Hierarchical-Mesh (recommended for 10+): queen strategy with peer communication, balances control and flexibility. Mesh: fully connected, best for equal-capability agents, quadratic communication overhead. Ring: circular neighbors-only, best for pipelines. Star: flat central coordinator. Adaptive: dynamic switching, starts hierarchical for planning, mesh for execution. Selection: bug fixes (hierarchical, 4 agents), features (hierarchical, 5), refactoring (hierarchical, 5), performance (hierarchical, 3), security (hierarchical, 3), docs (mesh, 2).`,
    tags: ['agentics-knowledge','network-topology','hierarchical','mesh','agent-coordination','swarm-patterns'],
    learned_from: 'Synthesized from Agentics Foundation videos',
    confidence: 0.95
  },
  {
    category: 'agentics-community',
    title: 'Agentics Foundation: Global Community and Chapters',
    content: `Agentics Foundation (Agentix Foundation): global non-profit advancing agentic AI. Three pillars: Education, Community Building, Measurable Impact. Chapters: London, Vancouver, Bangalore, Toronto, Halifax, Charlotte, Chicago, Hamburg, Amsterdam, Brisbane, Paris, Assam (NE India). Key people: Reuven Cohen (ruvnet, creator of Ruflo/Root Vector/Ask Ruvnet), Robert Ranson (speaker, Devoxx), Bill McGraw (Vancouver), David Gratton (Vancouver), Dragon (QE Fleet), Brad Ross (AI Symbolic Protocol). Events: weekly Zoom, monthly vibe coding, AI Hackerspace Live, London meetups, Global AI Hackathon (Dec 2025: 80 registered, 29 forks). Notable projects: Cinesphere geolocation discovery, Seven Cents bioacoustics, Samsung Smart TV integration. Uses Kaltura MediaSpace for video. Retro-futuristic 1984 Atari/Sega branding.`,
    tags: ['agentics-knowledge','agentics-foundation','community','chapters','reuven-cohen'],
    learned_from: 'Synthesized from 47 Agentics Foundation videos',
    confidence: 0.9
  },
  {
    category: 'agentics-projects',
    title: 'Global AI Hackathon: Streaming Content Discovery',
    content: `Agentics Foundation Global AI Hackathon (Dec 2025): solving streaming content fragmentation across Netflix, Hulu, Amazon, Disney+. Cinesphere: geolocation-based cross-platform discovery with privacy-preserving personalization. Root Vector replaced PGVector with attention mechanisms and hyperbolic embeddings for content hierarchy. Samsung Smart TV app with Supabase user profiles. Tech stack: graph neural networks, federated learning, self-learning recommendation engine, swarm intelligence, EU regulation compliance. 80 participants, 29 active forks, 72-hour format, distributed global teams.`,
    tags: ['agentics-knowledge','hackathon','streaming','content-discovery','cinesphere','federated-learning'],
    learned_from: 'Synthesized from Agentics Foundation hackathon videos',
    confidence: 0.85
  }
];

async function main() {
  console.log(`Ingesting ${entries.length} knowledge articles with ONNX embeddings...`);
  let inserted = 0, updated = 0, failed = 0;

  for (const entry of entries) {
    try {
      const result = await upsertKnowledge(entry);
      if (result === 'inserted') inserted++;
      else updated++;
      console.log(`  [${inserted + updated}/${entries.length}] ${result}: ${entry.title}`);
    } catch (err) {
      failed++;
      console.error(`  FAILED: ${entry.title} - ${err.message}`);
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${updated} updated, ${failed} failed`);

  // Verify with a test search
  console.log('\n--- SEARCH VERIFICATION ---');
  const queries = [
    'How does Ruflo V3 architecture work?',
    'What is Root Vector database?',
    'disaster rescue wifi mesh',
    'prevent AI hallucinations',
    'which network topology for agents'
  ];

  for (const q of queries) {
    const qvec = await embed(q);
    const qstr = '[' + qvec.join(',') + ']';
    const result = await pool.query(`
      SELECT title, confidence,
        embedding <=> $1::ruvector(384) as distance
      FROM openclaw_memory.operational_knowledge
      WHERE tags @> ARRAY['agentics-knowledge']
      ORDER BY embedding <=> $1::ruvector(384)
      LIMIT 3
    `, [qstr]);
    console.log(`\nQ: "${q}"`);
    for (const r of result.rows) {
      console.log(`  ${r.distance?.toFixed(4) || '?'} | ${r.title}`);
    }
  }

  await close();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
