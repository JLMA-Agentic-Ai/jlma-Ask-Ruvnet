    // ===== KNOWLEDGE BASE DATA =====
    const KB_DATA = {
        id: "root", name: "Ask Ruvnet Knowledge Universe", color: "#4ecdc4", count: 54543,
        description: "54,543 expert-curated entries across 15 categories covering RuVector, Ruflo, AI Security, Teaching, Algorithms, Video Knowledge, and Infrastructure.",
        children: [
            {
                id: "ruvector", name: "RuVector Ecosystem", color: "#3b82f6", count: 63,
                description: "The core vector database and cognitive container technology. 80+ Rust crates, RVF format, HNSW indexing, and neuromorphic computing.",
                children: [
                    {
                        id: "rv-core", name: "RuVector Core", color: "#3b82f6", count: 5,
                        description: "Foundation components of the RuVector vector database system.",
                        children: [
                            { id: "rv-core-1", name: "RuVector", color: "#3b82f6", description: "Core vector database engine written in Rust. Provides high-performance vector storage, HNSW indexing, and similarity search with sub-millisecond query times.", tags: ["rust","vector-db","core"] },
                            { id: "rv-core-2", name: "RVF Cognitive Container", color: "#3b82f6", description: "The RVF (RuVector Format) cognitive container is a 24-segment binary format that encapsulates AI models, embeddings, and runtime in a single self-booting file. At just 5.5KB WASM, it enables offline AI.", tags: ["rvf","container","wasm"] },
                            { id: "rv-core-3", name: "RVF Architecture 24-Segment", color: "#3b82f6", description: "The 24-segment binary architecture defines how cognitive containers store model weights, embeddings, metadata, security chains, and compute instructions in a portable format.", tags: ["rvf","architecture","binary"] },
                            { id: "rv-core-4", name: "RVF SDK & Packages", color: "#3b82f6", description: "NPM packages including @ruvector/rvf, @ruvector/rvf-wasm, @ruvector/rvf-mcp-server for building applications with the RVF cognitive container format.", tags: ["sdk","npm","packages"] },
                            { id: "rv-core-5", name: "RVCOW Copy-on-Write", color: "#3b82f6", description: "Copy-on-Write memory management for RuVector, enabling efficient concurrent reads with minimal memory overhead and zero-copy operations.", tags: ["memory","cow","performance"] }
                        ]
                    },
                    {
                        id: "rv-search", name: "Vector Search & Databases", color: "#60a5fa", count: 14,
                        description: "Vector search engines, database integrations, and embedding infrastructure.",
                        children: [
                            { id: "rv-s-1", name: "HNSW: Why 150x-12500x Faster", color: "#60a5fa", description: "Hierarchical Navigable Small World graphs enable logarithmic-time approximate nearest neighbor search instead of linear scan. Multi-layer skip-list structure provides 150x-12,500x speedup over brute force.", tags: ["hnsw","performance","algorithm"] },
                            { id: "rv-s-2", name: "Embeddings: Quality Determines Everything", color: "#60a5fa", description: "Why embedding quality is the single most important factor in AI search. Covers dimensionality, normalization (L2, L1, min-max, z-score), and how bad embeddings make even perfect indexes useless.", tags: ["embeddings","quality"] },
                            { id: "rv-s-3", name: "Embeddings: Building Intuition", color: "#60a5fa", description: "Plain-English guide to understanding what embeddings actually are: turning meaning into numbers so computers can measure similarity between concepts.", tags: ["embeddings","teaching"] },
                            { id: "rv-s-4", name: "RuVector-Postgres: 290+ SQL Functions", color: "#60a5fa", description: "PostgreSQL extension providing 290+ functions for vector operations, replacing pgvector with native RuVector integration. Supports HNSW indexes, ruvector(384) type, and SQL-native similarity search.", tags: ["postgres","sql","extension"] },
                            { id: "rv-s-5", name: "RuVector-WASM: Browser DB Zero Backend", color: "#60a5fa", description: "Complete vector database running in the browser via WebAssembly. Under 400KB, zero backend required. Enables offline-first AI applications with full HNSW search.", tags: ["wasm","browser","offline"] },
                            { id: "rv-s-6", name: "Strange Loop & Sublinear Solver", color: "#60a5fa", description: "Advanced algorithmic optimization achieving sublinear search complexity through recursive self-referencing patterns in the vector space.", tags: ["algorithm","optimization"] },
                            { id: "rv-s-7", name: "WASM SIMD Optimization", color: "#60a5fa", description: "WebAssembly SIMD (Single Instruction Multiple Data) optimizations for vector operations, achieving near-native performance in browser environments.", tags: ["wasm","simd","performance"] },
                            { id: "rv-s-8", name: "@ruvector/graph-node", color: "#60a5fa", description: "Graph node package for building knowledge graphs on top of vector embeddings, enabling relationship-aware semantic search.", tags: ["graph","package"] },
                            { id: "rv-s-9", name: "@ruvector/postgres-cli", color: "#60a5fa", description: "CLI tool for managing RuVector-Postgres instances, running migrations, and performing vector operations from the command line.", tags: ["cli","postgres","tool"] },
                            { id: "rv-s-10", name: "RuvLLM Integration", color: "#60a5fa", description: "Integration layer connecting RuVector with large language models for retrieval-augmented generation (RAG) pipelines.", tags: ["llm","rag","integration"] },
                            { id: "rv-s-11", name: "Hyperbolic Embeddings", color: "#60a5fa", description: "Poincare ball model embeddings for hierarchical data. Unlike flat Euclidean embeddings, hyperbolic space naturally represents tree-like structures with exponentially growing capacity.", tags: ["embeddings","hyperbolic","math"] },
                            { id: "rv-s-12", name: "Document Chunking Strategies", color: "#60a5fa", description: "Configurable overlap and size strategies for splitting documents into embeddable chunks. Covers fixed-size, semantic, and recursive approaches.", tags: ["chunking","preprocessing"] },
                            { id: "rv-s-13", name: "L2 Normalization & Distance Metrics", color: "#60a5fa", description: "How different distance metrics (cosine, L2, dot product) affect search quality and when to use each. Includes normalization best practices.", tags: ["math","distance","normalization"] },
                            { id: "rv-s-14", name: "Vector Index Tuning", color: "#60a5fa", description: "How to tune HNSW parameters (ef_construction, M, ef_search) for optimal tradeoff between recall, speed, and memory usage.", tags: ["hnsw","tuning","performance"] }
                        ]
                    },
                    {
                        id: "rv-rvf", name: "RVF Format", color: "#2563eb", count: 8,
                        description: "The Ruvector Format cognitive container: self-booting AI in a binary file.",
                        children: [
                            { id: "rvf-1", name: "RVF Cognitive Container Core Concepts", color: "#2563eb", description: "Core concepts behind the cognitive container: how it packages model, embeddings, runtime, and security into a single portable binary that self-boots.", tags: ["rvf","core"] },
                            { id: "rvf-2", name: "RVF Architecture 24-Segment Binary", color: "#2563eb", description: "Detailed breakdown of all 24 segments in the RVF binary format: header, model weights, embedding tables, WASM runtime, security witnesses, and more.", tags: ["rvf","binary","architecture"] },
                            { id: "rvf-3", name: "RVF Self-Booting Three-Tier Compute", color: "#2563eb", description: "Three-tier compute model: Tier 1 (edge/browser WASM), Tier 2 (server with full model), Tier 3 (cloud with distributed inference). Containers adapt to available compute.", tags: ["rvf","compute","tiered"] },
                            { id: "rvf-4", name: "RVF Progressive Indexing", color: "#2563eb", description: "How RVF containers build their HNSW index progressively as more data arrives, rather than requiring batch rebuilds. Enables streaming ingestion.", tags: ["rvf","indexing","streaming"] },
                            { id: "rvf-5", name: "RVF WASM Runtime Browser Apps", color: "#2563eb", description: "Building browser applications with RVF WASM runtime. Includes tutorials for creating offline-capable AI apps that run entirely client-side.", tags: ["rvf","wasm","browser"] },
                            { id: "rvf-6", name: "RVF Security Witness Chains", color: "#2563eb", description: "Cryptographic witness chains that verify the integrity and provenance of cognitive containers. Ensures models haven't been tampered with.", tags: ["rvf","security","crypto"] },
                            { id: "rvf-7", name: "RVF Corporate-Safe Offline AI", color: "#2563eb", description: "How corporations use RVF for air-gapped, fully offline AI deployments. No data leaves the premises, no external API calls, complete audit trail.", tags: ["rvf","corporate","offline"] },
                            { id: "rvf-8", name: "RVF AGI Cognitive Container (ADR-036)", color: "#2563eb", description: "Architecture Decision Record 036: the roadmap for evolving RVF containers toward artificial general intelligence capabilities with self-modifying cognitive architectures.", tags: ["rvf","agi","adr"] }
                        ]
                    },
                    {
                        id: "rv-neuro", name: "Neuromorphic & Advanced", color: "#1d4ed8", count: 7,
                        description: "Brain-inspired computing, spiking neural networks, advanced graph algorithms, and coherence engines.",
                        children: [
                            { id: "neuro-1", name: "Micro-HNSW 7.2KB Neuromorphic WASM", color: "#1d4ed8", description: "A 7.2KB WebAssembly module implementing HNSW with spiking neural network principles. Achieves neuromorphic computing in the browser with minimal footprint.", tags: ["neuromorphic","wasm","hnsw"] },
                            { id: "neuro-2", name: "MinCut-Gated Transformer", color: "#1d4ed8", description: "Novel transformer architecture using minimum cut graph partitioning for attention gating. Achieves ultra-low latency inference by pruning unnecessary attention paths.", tags: ["transformer","mincut","attention"] },
                            { id: "neuro-3", name: "MinCut Dynamic Graph Partitioning", color: "#1d4ed8", description: "December 2025 breakthrough: dynamic graph partitioning using Stoer-Wagner algorithm for real-time self-healing AI systems. Identifies and isolates failing components.", tags: ["mincut","graph","self-healing"] },
                            { id: "neuro-4", name: "MinCut Nervous System Bio-Inspired", color: "#1d4ed8", description: "Bio-inspired nervous system architecture for distributed AI. Uses biological neural network patterns for fault tolerance and adaptive routing.", tags: ["nervous-system","bio","distributed"] },
                            { id: "neuro-5", name: "Prime Radiant: Coherence Engine", color: "#1d4ed8", description: "Real-time mathematical coherence gate for AI anti-hallucination. Uses Sheaf Laplacian math to detect contradictions with cryptographic proofs. Scoring: <0.1 approve, 0.1-0.4 verify, 0.4-0.7 deep analysis, >0.7 human escalation. Blake3 audit trail, GPU/SIMD acceleration via wgpu + AVX-512/NEON (4-16x speedup).", tags: ["prime-radiant","coherence","anti-hallucination","sheaf-laplacian"] },
                            { id: "neuro-6", name: "Cognitum v0: Agentic Processing Unit", color: "#1d4ed8", description: "The world's first agentic processing unit by ChipStart (TekStart). CES 2026 Innovation Award Honoree. Ultra-low-power, high-performance AI processor for edge devices. 256-core WASM fabric for real-time agent safety decisions with cryptographic verification. Coherence-gated routing, global workspace buffer, reservoir computing temporal lanes. Targets: smart surveillance, AR/VR wearables, industrial automation, agricultural tech. See cognitum.one", tags: ["cognitum","chip","edge","ces-2026","hardware","agentic"] },
                            { id: "neuro-7", name: "Agentic Splice (Model Switching)", color: "#1d4ed8", description: "Runtime model-switching capability in Agentic Flow: 'splice in' cheaper models (Haiku, Sonnet, local ONNX) at runtime without changing agent logic. Enables cost optimization by routing simple tasks to small models and complex tasks to large ones — seamlessly.", tags: ["splice","model-switching","cost-optimization","routing"] }
                        ]
                    },
                    {
                        id: "rv-npm", name: "npm Packages & SDKs", color: "#93c5fd", count: 12,
                        description: "Published npm packages that expose RuVector capabilities to JavaScript/TypeScript applications.",
                        children: [
                            { id: "npm-1", name: "@ruvector/edge-full", color: "#93c5fd", description: "Complete WASM toolkit for edge AI: vector search, graph DB, neural networks, DAG workflows, SQL/SPARQL/Cypher, and ONNX inference — all running in browser. The 'everything package' for client-side AI.", tags: ["wasm","edge","all-in-one"] },
                            { id: "npm-2", name: "@ruvector/ruvllm v2.4.1", color: "#93c5fd", description: "Self-learning LLM orchestration with SONA adaptive learning, HNSW memory, RLM recursive retrieval, FastGRNN routing, and SIMD inference. The brain that routes queries to the right model.", tags: ["llm","sona","routing"] },
                            { id: "npm-3", name: "@ruvector/gnn v0.1.23", color: "#93c5fd", description: "Graph Neural Network capabilities: Node.js native bindings via napi-rs. Enables GNN learning on top of vector data for relationship-aware embeddings and pattern discovery.", tags: ["gnn","graph","neural"] },
                            { id: "npm-4", name: "@ruvector/gnn-wasm", color: "#93c5fd", description: "GNN for browsers via WebAssembly. Run graph neural network inference client-side with no server required.", tags: ["gnn","wasm","browser"] },
                            { id: "npm-5", name: "@ruvector/attention-wasm", color: "#93c5fd", description: "High-performance attention mechanisms in WASM: flash attention, hyperbolic attention, mixture-of-experts routing — all running in browser at near-native speed.", tags: ["attention","wasm","flash"] },
                            { id: "npm-6", name: "@ruvector/agentic-synth v0.1.6", color: "#93c5fd", description: "Synthetic data generator for AI/ML training, RAG systems, and agentic workflows. Integrates with DSPy.ts, Gemini, OpenRouter, and vector databases.", tags: ["synthetic","data","training"] },
                            { id: "npm-7", name: "ruvector v0.1.99", color: "#93c5fd", description: "The main ruvector npm package: high-performance vector database for Node.js with automatic native/WASM fallback. HNSW, SONA, LoRA, EWC, flash attention built-in.", tags: ["core","npm","main"] },
                            { id: "npm-8", name: "ruvector-extensions", color: "#93c5fd", description: "Advanced features: OpenAI/Cohere embeddings, graph visualization, Neo4j export, temporal tracking, and persistence layers.", tags: ["extensions","embeddings","visualization"] },
                            { id: "npm-9", name: "@ruvnet/bmssp v1.0.0", color: "#93c5fd", description: "Blazing fast graph pathfinding SDK powered by WASM. 10-15x faster than JavaScript: Dijkstra, bidirectional, multi-source routing.", tags: ["graph","pathfinding","wasm"] },
                            { id: "npm-10", name: "@ruvnet/strange-loop v0.3.1", color: "#93c5fd", description: "Hyper-optimized strange loops with temporal consciousness and quantum-classical hybrid computing. Recursive self-referencing patterns for advanced AI reasoning.", tags: ["strange-loop","temporal","quantum"] },
                            { id: "npm-11", name: "neural-trader v2.7.1", color: "#93c5fd", description: "Neural trading system: native HNSW vector search + SIMD (150x faster), 178 NAPI functions, GPU acceleration, real-time execution, multi-agent swarm coordination.", tags: ["trading","neural","finance"] },
                            { id: "npm-12", name: "dspy.ts v2.1.1", color: "#93c5fd", description: "100% DSPy Python compliant TypeScript framework. Multi-agent orchestration, MIPROv2 optimizer, chain-of-thought, ReAct, powered by AgentDB and ReasoningBank.", tags: ["dspy","typescript","framework"] }
                        ]
                    }
                ]
            },
            {
                id: "ruflo", name: "Ruflo & Agents", color: "#8b5cf6", count: 70,
                description: "AI orchestration platform with 150+ agent types, swarm coordination, memory systems, and self-learning hooks.",
                children: [
                    {
                        id: "ruflo-platform", name: "Ruflo Platform", color: "#8b5cf6", count: 6,
                        description: "The operating system for AI teams: architecture, memory, and hooks.",
                        children: [
                            { id: "cf-p-1", name: "Ruflo: Operating System for AI Teams", color: "#8b5cf6", description: "Ruflo is an operating system for AI agents. It spawns, coordinates, and monitors multiple AI agents working together on complex tasks, like a project manager for AI.", tags: ["ruflo","overview"] },
                            { id: "cf-p-2", name: "Ruflo Architecture: 10,000-Foot View", color: "#8b5cf6", description: "High-level architecture: CLI layer, MCP server, agent pool, memory system (3 levels), hooks nervous system, and swarm coordinator. 26 commands, 140+ subcommands.", tags: ["architecture","overview"] },
                            { id: "cf-p-3", name: "Ruflo Memory: Three Levels", color: "#8b5cf6", description: "Three memory tiers: Working (session), Episodic (task history), Semantic (learned patterns). HNSW-indexed for 150x-12,500x faster retrieval than flat search.", tags: ["memory","hnsw"] },
                            { id: "cf-p-4", name: "Ruflo Hooks: Nervous System", color: "#8b5cf6", description: "27 hooks + 12 background workers form the nervous system. Pre/post hooks for edits, commands, tasks. Auto-learning from successes and failures.", tags: ["hooks","learning"] },
                            { id: "cf-p-5", name: "Why Ruflo Exists", color: "#8b5cf6", description: "The problem Ruflo solves: single AI agents hit walls on complex tasks. Ruflo coordinates multiple specialized agents with shared memory and self-learning.", tags: ["motivation","problem"] },
                            { id: "cf-p-6", name: "Ruflo Limitations", color: "#8b5cf6", description: "Honest assessment of current limitations: token costs, agent drift, context window constraints, and when NOT to use Ruflo.", tags: ["limitations","honest"] }
                        ]
                    },
                    {
                        id: "cf-agents", name: "Agent Systems", color: "#a78bfa", count: 7,
                        description: "150+ agent types, lifecycle management, and inter-agent communication.",
                        children: [
                            { id: "cf-a-1", name: "Complete Agent Catalog: 150+ Types", color: "#a78bfa", description: "Full catalog of agent types: coder, reviewer, tester, researcher, security-architect, performance-engineer, and 140+ more specialized agents.", tags: ["agents","catalog"] },
                            { id: "cf-a-2", name: "Agent Lifecycle: Spawn, Execute, Report", color: "#a78bfa", description: "How agents are born, do their work, and report back. Covers spawning, task assignment, execution, result collection, and graceful shutdown.", tags: ["lifecycle","agents"] },
                            { id: "cf-a-3", name: "Agent Spawning Patterns", color: "#a78bfa", description: "Five spawning patterns: single agent, parallel batch, sequential pipeline, swarm with coordinator, and background daemon agents.", tags: ["spawning","patterns"] },
                            { id: "cf-a-4", name: "Creating Custom Agent Types", color: "#a78bfa", description: "How to define custom agent types with specific skills, tools, and behavioral constraints. Template-based approach for rapid agent creation.", tags: ["custom","agents"] },
                            { id: "cf-a-5", name: "How Agents Talk to Each Other", color: "#a78bfa", description: "Inter-agent communication via shared memory, message passing, and event hooks. Covers synchronous and asynchronous communication patterns.", tags: ["communication","agents"] },
                            { id: "cf-a-6", name: "When Agents Fail: Recovery Patterns", color: "#a78bfa", description: "Failure recovery: retry with backoff, fallback to different agent type, escalate to human, checkpoint and resume, and graceful degradation.", tags: ["recovery","failure"] },
                            { id: "cf-a-7", name: "Agent Booster: Multi-Model Routing", color: "#a78bfa", description: "Intelligent routing of tasks to the optimal AI model (Haiku for speed, Sonnet for balance, Opus for reasoning) based on task complexity analysis.", tags: ["routing","models"] }
                        ]
                    },
                    {
                        id: "cf-swarm", name: "Swarm Intelligence", color: "#7c3aed", count: 5,
                        description: "Multi-agent coordination, topology selection, and consensus protocols.",
                        children: [
                            { id: "cf-sw-1", name: "Choosing the Right Swarm Topology", color: "#7c3aed", description: "When to use hierarchical (tight control), mesh (peer-to-peer), ring (sequential), star (centralized), or hybrid (adaptive) topologies.", tags: ["topology","swarm"] },
                            { id: "cf-sw-2", name: "Keeping Agents On Track: Anti-Drift", color: "#7c3aed", description: "Preventing agent drift: hierarchical control, max-agents limits, specialized roles, consensus protocols, and coordinator oversight patterns.", tags: ["anti-drift","control"] },
                            { id: "cf-sw-3", name: "Five Swarm Patterns", color: "#7c3aed", description: "Research swarm, implementation swarm, review swarm, security audit swarm, and full-stack development swarm. When to use each pattern.", tags: ["patterns","swarm"] },
                            { id: "cf-sw-4", name: "Hive Mind Consensus Protocols", color: "#7c3aed", description: "Byzantine fault tolerance, Raft leader election, gossip protocol, CRDTs, and quorum-based consensus. How agents agree on shared state.", tags: ["consensus","hive-mind"] },
                            { id: "cf-sw-5", name: "AI Marketing Swarms: 15-Agent", color: "#7c3aed", description: "Case study: 15-agent marketing swarm with researcher, copywriter, designer, analyst, and coordinator agents working in parallel.", tags: ["marketing","case-study"] }
                        ]
                    },
                    {
                        id: "cf-memory", name: "Memory & Learning", color: "#6d28d9", count: 10,
                        description: "Neural patterns, self-optimizing architectures, and knowledge retention.",
                        children: [
                            { id: "cf-m-1", name: "Neural Patterns: What They Are", color: "#6d28d9", description: "Learned behavioral patterns from successful task completions. Stored as vector embeddings in HNSW-indexed memory for rapid retrieval.", tags: ["neural","patterns"] },
                            { id: "cf-m-2", name: "SONA: Self-Optimizing Architecture", color: "#6d28d9", description: "Self-Optimizing Neural Architecture achieves <0.05ms adaptation. Continuously adjusts routing and parameters based on task outcomes.", tags: ["sona","optimization"] },
                            { id: "cf-m-3", name: "ReasoningBank: Learning From Decisions", color: "#6d28d9", description: "A bank of reasoning traces from past decisions. Agents consult it before making new decisions, learning from both successes and failures.", tags: ["reasoning","learning"] },
                            { id: "cf-m-4", name: "LoRA and EWC: Learning Without Forgetting", color: "#6d28d9", description: "Low-Rank Adaptation (LoRA) for efficient fine-tuning. Elastic Weight Consolidation (EWC++) prevents catastrophic forgetting of old knowledge.", tags: ["lora","ewc","learning"] },
                            { id: "cf-m-5", name: "Mixture of Experts Routing", color: "#6d28d9", description: "MoE routing selects specialized expert sub-networks for each task. Only activates relevant parameters, reducing compute while maintaining quality.", tags: ["moe","routing"] },
                            { id: "cf-m-6", name: "Flash Attention", color: "#6d28d9", description: "2.49x-7.47x speedup in attention computation through tiled computation and reduced memory I/O. Critical for processing long contexts efficiently.", tags: ["attention","performance"] },
                            { id: "cf-m-7", name: "Episodic Memory", color: "#6d28d9", description: "Task-by-task memory of what happened, what worked, and what failed. Like a project journal that agents consult before starting similar work.", tags: ["episodic","memory"] },
                            { id: "cf-m-8", name: "Semantic Memory", color: "#6d28d9", description: "Distilled knowledge from many episodes. General patterns and principles rather than specific events. The wisdom extracted from experience.", tags: ["semantic","memory"] },
                            { id: "cf-m-9", name: "Experience Replay", color: "#6d28d9", description: "Re-processing past experiences to strengthen learning. Prevents recency bias and ensures important lessons aren't forgotten.", tags: ["replay","learning"] },
                            { id: "cf-m-10", name: "Knowledge Distillation", color: "#6d28d9", description: "Transferring knowledge from a large expert model to a smaller, faster student model. Enables deploying smaller models that perform like larger ones.", tags: ["distillation","transfer"] }
                        ]
                    },
                    {
                        id: "cf-agentic", name: "Agentic Flow", color: "#9333ea", count: 4,
                        description: "Agentic Flow platform, AgentDB, and skills systems.",
                        children: [
                            { id: "cf-af-1", name: "Agentic Flow (Main)", color: "#9333ea", description: "The agentic-flow npm package: 75x faster embeddings with ONNX integration, AgentDB for persistent agent state, and the Voyager skills system.", tags: ["agentic-flow","main"] },
                            { id: "cf-af-2", name: "Agentic Flow v2.0.7", color: "#9333ea", description: "Latest stable release with HybridReasoningBank, improved ONNX embedding pipeline (75x faster), sql.js cross-platform cache, and enhanced document chunking.", tags: ["agentic-flow","release"] },
                            { id: "cf-af-3", name: "AgentDB v2.0.0-alpha", color: "#9333ea", description: "RuVector-powered graph database with Cypher queries, hyperedges, ACID persistence, 150x faster than SQLite. Reflexion memory, skill library, and lifelong learning for agents.", tags: ["agentdb","database"] },
                            { id: "cf-af-4", name: "Voyager Skills & Reflexion", color: "#9333ea", description: "Voyager-inspired skill library where agents learn reusable skills. Reflexion enables agents to reflect on failures and improve.", tags: ["voyager","skills","reflexion"] }
                        ]
                    },
                    {
                        id: "cf-bg", name: "Background Systems", color: "#7e22ce", count: 3,
                        description: "Background workers, SPARC framework, and automated processes.",
                        children: [
                            { id: "cf-bg-1", name: "Background Workers: AI Patterns", color: "#7e22ce", description: "12 background workers: ultralearn, optimize, consolidate, predict, audit, map, preload, deepdive, document, refactor, benchmark, testgaps.", tags: ["workers","background"] },
                            { id: "cf-bg-2", name: "SPARC Framework", color: "#7e22ce", description: "Specification, Pseudocode, Architecture, Refinement, Completion. Structured methodology for breaking complex tasks into manageable agent-friendly steps.", tags: ["sparc","methodology"] },
                            { id: "cf-bg-3", name: "SPARC Methodology Complete", color: "#7e22ce", description: "Full SPARC methodology with examples: how to write specifications, pseudocode planning, architecture decisions, iterative refinement, and completion criteria.", tags: ["sparc","complete"] }
                        ]
                    },
                    {
                        id: "ruflo-ecosystem", name: "Ruflo Ecosystem", color: "#c084fc", count: 8,
                        description: "The extended Ruflo package ecosystem: MCP servers, guidance, codex adapters, quality engineering, and cloud platform.",
                        children: [
                            { id: "cf-eco-1", name: "@claude-flow/guidance v3.0.0-alpha.1", color: "#c084fc", description: "Guidance Control Plane: compiles, retrieves, enforces, and evolves guidance rules for Claude Code sessions. Proof chains, trust systems, adversarial defense, prompt injection protection.", tags: ["guidance","governance","security"] },
                            { id: "cf-eco-2", name: "@claude-flow/mcp v3.0.0-alpha.8", color: "#c084fc", description: "Standalone MCP (Model Context Protocol) server with stdio/http/websocket transports, connection pooling, and tool registry. The universal AI tool connector.", tags: ["mcp","server","protocol"] },
                            { id: "cf-eco-3", name: "@claude-flow/codex v3.0.0-alpha.9", color: "#c084fc", description: "OpenAI Codex CLI integration for Ruflo. Bridges Ruflo agent orchestration to the Codex platform with AGENTS.md support.", tags: ["codex","openai","adapter"] },
                            { id: "cf-eco-4", name: "flow-nexus v0.1.128 (Cloud Platform)", color: "#c084fc", description: "Cloud-hosted AI orchestration: sandboxes, workflows, swarm deployment, neural training, app store, and credit-based billing. The SaaS layer on top of Ruflo.", tags: ["cloud","saas","platform"] },
                            { id: "cf-eco-5", name: "Agentic QE v3.6.15 (QE Fleet)", color: "#c084fc", description: "Quality Engineering with 59 specialized QE agents, 13 bounded contexts (DDD), O(log n) coverage analysis, ReasoningBank learning, and mathematical coherence verification.", tags: ["qe","testing","quality"] },
                            { id: "cf-eco-6", name: "AgentDB v2 (Graph Database)", color: "#c084fc", description: "RuVector-powered graph database: Cypher queries, hyperedges, ACID persistence, 150x faster than SQLite. Reflexion memory, skill library, lifelong learning for agents.", tags: ["agentdb","graph","persistence"] },
                            { id: "cf-eco-7", name: "RuvNet KB-First v6.5.3", color: "#c084fc", description: "Knowledge-Base-First Application Builder: build intelligent apps on expert knowledge. GNN attention routing, SONA vector search, MCP server with 10 tools.", tags: ["kb","builder","mcp"] },
                            { id: "cf-eco-8", name: "Gemini Code Flow", color: "#c084fc", description: "Gemini CLI adaptation of Ruflo: brings the same agent orchestration, SPARC methodology, and swarm patterns to Google's Gemini ecosystem.", tags: ["gemini","adaptation","cross-platform"] }
                        ]
                    }
                ]
            },
            {
                id: "security", name: "AI Security (AIMDS)", color: "#ef4444", count: 22,
                description: "Autonomous Intelligent Meta-Defense System: 3-layer pipeline, 25-level meta-learning, Lyapunov chaos detection, and production security stacks.",
                children: [
                    {
                        id: "sec-core", name: "AIMDS Core", color: "#ef4444", count: 5,
                        description: "The core AIMDS architecture: multi-layer defense, meta-learning, and behavioral analysis.",
                        children: [
                            { id: "sec-c-1", name: "What Is AIMDS", color: "#ef4444", description: "Autonomous Intelligent Meta-Defense System: AI that defends AI. A 3-layer security pipeline that analyzes, detects, and neutralizes threats to AI systems in real-time.", tags: ["aimds","overview"] },
                            { id: "sec-c-2", name: "AIMDS Complete Architecture: Three-Layer Pipeline", color: "#ef4444", description: "Layer 1: Input Analysis (pattern matching, tokenization). Layer 2: Behavioral Analysis (Lyapunov chaos detection). Layer 3: Meta-Learning (25-level Strange Loop).", tags: ["aimds","architecture","pipeline"] },
                            { id: "sec-c-3", name: "AIMDS Architecture: Five Security Packages", color: "#ef4444", description: "Five specialized security packages: input-validator, behavioral-analyzer, threat-detector, meta-learner, and response-sanitizer. Each handles a specific defense domain.", tags: ["aimds","packages"] },
                            { id: "sec-c-4", name: "AIMDS 25-Level Meta-Learning Strange-Loop", color: "#ef4444", description: "25 levels of recursive self-improvement where the security system learns from its own detection patterns. Strange loop creates self-referencing defense that adapts to novel attacks.", tags: ["meta-learning","strange-loop"] },
                            { id: "sec-c-5", name: "AIMDS Behavioral Analysis: Lyapunov Chaos", color: "#ef4444", description: "Lyapunov exponent analysis detects chaotic patterns in input sequences that indicate adversarial manipulation. Catches attacks that rule-based systems miss.", tags: ["lyapunov","chaos","behavioral"] }
                        ]
                    },
                    {
                        id: "sec-detect", name: "Detection & Defense", color: "#f87171", count: 6,
                        description: "Threat detection, PII protection, and prompt injection defense.",
                        children: [
                            { id: "sec-d-1", name: "7 Types of Prompt Injection Attack", color: "#f87171", description: "Direct injection, indirect injection, jailbreaking, role-play attacks, encoding attacks, context manipulation, and multi-turn manipulation. How each works and defenses.", tags: ["injection","attacks"] },
                            { id: "sec-d-2", name: "AIMDS Detection Levels: Quick vs Full", color: "#f87171", description: "Quick scan (<5ms) for common patterns vs full analysis (50-100ms) with behavioral modeling and chaos detection. When to use each level.", tags: ["detection","levels"] },
                            { id: "sec-d-3", name: "PII Detection", color: "#f87171", description: "Automatic detection and masking of personally identifiable information: names, emails, phone numbers, SSNs, addresses, and custom patterns.", tags: ["pii","privacy"] },
                            { id: "sec-d-4", name: "Defending Against Prompt Injection", color: "#f87171", description: "Defense strategies: input sanitization, output filtering, context boundaries, role enforcement, and multi-layer validation. Defense in depth approach.", tags: ["defense","injection"] },
                            { id: "sec-d-5", name: "AIMDS MCP Tools", color: "#f87171", description: "MCP server tools for AIMDS: scan-input, analyze-behavior, check-threat, validate-output, and security-report. Integrates into any MCP-compatible workflow.", tags: ["mcp","tools"] },
                            { id: "sec-d-6", name: "AIMDS ReasoningBank HNSW Threat Memory", color: "#f87171", description: "HNSW-indexed memory of past threats and their signatures. Enables instant recognition of attack patterns similar to previously seen threats.", tags: ["reasoning","hnsw","threats"] }
                        ]
                    },
                    {
                        id: "sec-prod", name: "Production Security", color: "#dc2626", count: 6,
                        description: "Production deployment security stacks and hardening guides.",
                        children: [
                            { id: "sec-p-1", name: "RuvBot 5-Layer AIMDS Protection Stack", color: "#dc2626", description: "Five layers of production security: input validation, behavioral analysis, threat detection, output sanitization, and audit logging. Complete production hardening.", tags: ["ruvbot","production","layers"] },
                            { id: "sec-p-2", name: "RuvBot AIDefence Gate: 6-Layer", color: "#dc2626", description: "Six-layer gate protecting the AI pipeline: rate limiting, input validation, context verification, model protection, output filtering, and response signing.", tags: ["gate","defense","production"] },
                            { id: "sec-p-3", name: "Ruflo Security CLI", color: "#dc2626", description: "Security scanning from the command line: npx @claude-flow/cli security scan --depth full. Covers CVEs, input validation, path security, and injection protection.", tags: ["cli","scanning"] },
                            { id: "sec-p-4", name: "Ruflo Adversarial Model", color: "#dc2626", description: "How Ruflo models adversarial scenarios: threat modeling, attack surface analysis, and automated red-teaming for AI systems.", tags: ["adversarial","modeling"] },
                            { id: "sec-p-5", name: "Input Validation & Path Security", color: "#dc2626", description: "Zod validation for input schemas, path traversal prevention, and injection protection. The first line of defense in any AI application.", tags: ["validation","path","zod"] },
                            { id: "sec-p-6", name: "Security Agents: Four Specialized Defenders", color: "#dc2626", description: "Four security agent types: security-architect (design), security-auditor (review), threat-detector (runtime), and incident-responder (recovery).", tags: ["agents","security"] }
                        ]
                    }
                ]
            },
            {
                id: "teaching", name: "Teaching & Learning", color: "#10b981", count: 118,
                description: "Educational content from beginner to advanced. Plain-English explanations, decision guides, recipes, debugging guides, and learning paths.",
                children: [
                    {
                        id: "t-start", name: "Start Here", color: "#10b981", count: 5,
                        description: "Begin your journey from vibe coder to agent builder.",
                        children: [
                            { id: "t-s-1", name: "From Vibe Coder to Agent Builder (Start Here)", color: "#10b981", description: "Your starting point. You already know more than you think. This guide maps your existing skills to agentic AI concepts and shows the learning path ahead.", tags: ["start","beginner"] },
                            { id: "t-s-2", name: "What is Agentic AI: Plain English", color: "#10b981", description: "AI that acts on your behalf. Instead of just answering questions, agentic AI takes actions: reads files, writes code, searches databases, and coordinates with other agents.", tags: ["agentic","beginner"] },
                            { id: "t-s-3", name: "You Already Know How to Build Agents", color: "#10b981", description: "If you can write a prompt, you can build an agent. This entry maps familiar concepts (prompts, templates, workflows) to agent-building terminology.", tags: ["encouragement","mapping"] },
                            { id: "t-s-4", name: "From Asking Questions to Building Systems", color: "#10b981", description: "The progression: asking AI questions -> giving AI tasks -> building AI teams -> creating self-improving AI systems. Each step builds on the last.", tags: ["progression","learning"] },
                            { id: "t-s-5", name: "From Vibe Coding to Real Coding", color: "#10b981", description: "Bridge from intuitive AI-assisted coding to understanding what the code actually does. Not about memorizing syntax, but understanding patterns and architecture.", tags: ["coding","bridge"] }
                        ]
                    },
                    {
                        id: "t-concepts", name: "Core Concepts Explained", color: "#34d399", count: 14,
                        description: "Plain-English explanations of every major concept.",
                        children: [
                            { id: "t-c-1", name: "What Are Vector Embeddings", color: "#34d399", description: "Numbers that capture meaning. 'King' and 'Queen' are close in embedding space because they share royal meaning. Computers use these numbers to understand similarity.", tags: ["embeddings","teaching"] },
                            { id: "t-c-2", name: "What Is an AI Agent", color: "#34d399", description: "An AI that can take actions, not just generate text. It has tools (read files, search web), memory (remember past tasks), and goals (complete objectives autonomously).", tags: ["agent","teaching"] },
                            { id: "t-c-3", name: "What Is MCP", color: "#34d399", description: "Model Context Protocol: a universal plug system for AI. Like USB for AI tools. Any AI can use any tool through a standard interface, regardless of provider.", tags: ["mcp","teaching"] },
                            { id: "t-c-4", name: "What Is a Swarm", color: "#34d399", description: "Multiple agents working together on a task. Like a team of specialists: one researches, one codes, one tests, one reviews. Together they handle complexity no single agent can.", tags: ["swarm","teaching"] },
                            { id: "t-c-5", name: "What Is RAG", color: "#34d399", description: "Retrieval-Augmented Generation: instead of making stuff up, the AI first searches a knowledge base for relevant facts, then generates an answer grounded in real data.", tags: ["rag","teaching"] },
                            { id: "t-c-6", name: "What Is HNSW", color: "#34d399", description: "Hierarchical Navigable Small Worlds: an express elevator for finding similar things. Instead of checking every item (slow), it uses a multi-layer shortcut map (fast).", tags: ["hnsw","teaching"] },
                            { id: "t-c-7", name: "What Is ONNX", color: "#34d399", description: "Open Neural Network Exchange: a universal model format. Train a model anywhere, run it anywhere. Like PDF for AI models - one format that works everywhere.", tags: ["onnx","teaching"] },
                            { id: "t-c-8", name: "What Is Semantic Search", color: "#34d399", description: "Search by meaning, not keywords. 'How to fix a flat tire' finds 'tire puncture repair guide' even though the words are different. Understands intent, not just text.", tags: ["search","teaching"] },
                            { id: "t-c-9", name: "What Is PostgreSQL for AI", color: "#34d399", description: "A database that speaks AI. PostgreSQL with vector extensions stores both regular data AND embeddings, so your AI can search by meaning inside a real database.", tags: ["postgres","teaching"] },
                            { id: "t-c-10", name: "What Is RVF", color: "#34d399", description: "RuVector Format: AI in a box. A single file containing everything needed to run AI offline: the model, the data, the search index, and the runtime. Self-contained intelligence.", tags: ["rvf","teaching"] },
                            { id: "t-c-11", name: "What Is a Knowledge Base", color: "#34d399", description: "A curated collection of expert knowledge that AI can search. Not a database dump - carefully written, scored, and embedded information designed for AI retrieval.", tags: ["kb","teaching"] },
                            { id: "t-c-12", name: "What Is Ruflo", color: "#34d399", description: "An operating system for AI teams. It spawns agents, assigns tasks, manages memory, and coordinates work. Like a project manager that never sleeps and learns from every project.", tags: ["ruflo","teaching"] },
                            { id: "t-c-13", name: "What Is Min-Cut", color: "#34d399", description: "Finding the weakest link in a network. Min-cut identifies where a system is most likely to break by finding the minimum set of connections whose removal splits the graph.", tags: ["mincut","teaching"] },
                            { id: "t-c-14", name: "What Is a Cognitive Container", color: "#34d399", description: "An RVF file that contains not just data but reasoning capability. It can boot itself, process queries, and learn - all without an internet connection or external API.", tags: ["cognitive","teaching"] }
                        ]
                    },
                    {
                        id: "t-paths", name: "Learning Paths", color: "#059669", count: 7,
                        description: "Structured paths from beginner to expert.",
                        children: [
                            { id: "t-lp-1", name: "From Vibe Coder to Agent Builder", color: "#059669", description: "Complete learning path: 1) Understand prompts, 2) Add tools, 3) Build single agents, 4) Coordinate swarms, 5) Create self-learning systems.", tags: ["path","progression"] },
                            { id: "t-lp-2", name: "Building Your First KB", color: "#059669", description: "Step-by-step: Choose a topic, write 10 entries, embed with ONNX, store in PostgreSQL, test with semantic search. Your first knowledge base in 30 minutes.", tags: ["kb","tutorial"] },
                            { id: "t-lp-3", name: "From Single Agent to Swarm", color: "#059669", description: "Progression from one agent to many: single agent -> agent pairs -> small team (3-5) -> full swarm (8-15) -> self-organizing hive mind.", tags: ["swarm","progression"] },
                            { id: "t-lp-4", name: "Understanding AI Security", color: "#059669", description: "Security learning path: threats landscape, input validation, behavioral detection, meta-learning defense, and production hardening.", tags: ["security","path"] },
                            { id: "t-lp-5", name: "The RuVector Ecosystem", color: "#059669", description: "Map of 80+ Rust crates and how they interconnect: core -> extensions -> applications. Understanding the full technology stack.", tags: ["ecosystem","map"] },
                            { id: "t-lp-6", name: "From Local Dev to Production", color: "#059669", description: "Taking your AI project from laptop to production: local testing, staging, Railway deployment, monitoring, and scaling.", tags: ["deployment","production"] },
                            { id: "t-lp-7", name: "Monitoring and Operating", color: "#059669", description: "How to monitor AI systems in production: health checks, performance metrics, error tracking, and automated recovery.", tags: ["monitoring","operations"] }
                        ]
                    },
                    {
                        id: "t-decision", name: "Decision Guides", color: "#047857", count: 14,
                        description: "When to use what: architecture, models, databases, and topologies.",
                        children: [
                            { id: "t-d-1", name: "When to Use What Architecture", color: "#047857", description: "Monolith vs microservices vs serverless for AI applications. Decision tree based on team size, budget, and complexity.", tags: ["architecture","decision"] },
                            { id: "t-d-2", name: "Which Claude Model: Haiku vs Sonnet vs Opus", color: "#047857", description: "Haiku: fast/cheap for simple tasks. Sonnet: balanced for most work. Opus: deep reasoning for complex problems. Cost comparison and use cases.", tags: ["models","decision"] },
                            { id: "t-d-3", name: "Which Embedding Model", color: "#047857", description: "all-MiniLM-L6-v2 (fast, 384d), all-mpnet-base-v2 (quality, 768d), instructor models (task-specific). When to use each.", tags: ["embeddings","decision"] },
                            { id: "t-d-4", name: "Which Swarm Topology", color: "#047857", description: "Hierarchical for control, mesh for collaboration, ring for pipelines, star for coordination, hybrid for flexibility. Decision matrix.", tags: ["topology","decision"] },
                            { id: "t-d-5", name: "Which Vector Database", color: "#047857", description: "RuVector-Postgres for production, RuVector-WASM for browser, Pinecone for managed, ChromaDB for prototyping. Feature comparison.", tags: ["database","decision"] },
                            { id: "t-d-6", name: "Do I Need a Swarm?", color: "#047857", description: "Single agent handles 80% of tasks. Use swarms for: multi-file changes, cross-domain work, parallel research, and tasks needing diverse expertise.", tags: ["swarm","decision"] },
                            { id: "t-d-7", name: "How Much Security?", color: "#047857", description: "Level 1: Basic input validation. Level 2: + PII detection. Level 3: + behavioral analysis. Level 4: + meta-learning. Level 5: Full AIMDS pipeline.", tags: ["security","decision"] },
                            { id: "t-d-8", name: "Build vs Buy: Ruflo", color: "#047857", description: "When to build custom orchestration vs using Ruflo. Ruflo wins when you need swarms, memory, hooks, or multi-model routing.", tags: ["build-buy","decision"] },
                            { id: "t-d-9", name: "Local vs Cloud AI", color: "#047857", description: "Local: privacy, no latency, no API costs. Cloud: more powerful models, no hardware investment. Hybrid: local for speed, cloud for reasoning.", tags: ["local","cloud","decision"] },
                            { id: "t-d-10", name: "Quality vs Speed", color: "#047857", description: "When to prioritize quality (production KB, security scanning) vs speed (prototyping, exploration, batch processing). Practical guidelines.", tags: ["quality","speed"] },
                            { id: "t-d-11", name: "HNSW Index vs Sequential Scan", color: "#047857", description: "HNSW for >1000 vectors (logarithmic). Sequential scan for <1000 (simpler, no index overhead). Break-even analysis.", tags: ["hnsw","performance","decision"] },
                            { id: "t-d-12", name: "Client-Side vs Server-Side Embedding", color: "#047857", description: "Client (WASM ONNX): privacy, offline. Server (API): more models, higher quality. Hybrid: embed locally, search remotely.", tags: ["embedding","architecture"] },
                            { id: "t-d-13", name: "Curated KB vs Bulk Corpus", color: "#047857", description: "Curated: higher quality, better search results, more expensive to build. Bulk: faster to create, noisier results. When each approach wins.", tags: ["kb","quality"] },
                            { id: "t-d-14", name: "RVF WASM vs RuVector-WASM", color: "#047857", description: "RVF WASM: cognitive containers with self-booting AI. RuVector-WASM: pure vector database in browser. Different tools for different needs.", tags: ["wasm","comparison"] }
                        ]
                    },
                    {
                        id: "t-recipes", name: "Recipes & How-To", color: "#065f46", count: 10,
                        description: "Step-by-step recipes for common AI tasks.",
                        children: [
                            { id: "t-r-1", name: "Spawning a Single Agent", color: "#065f46", description: "npx @claude-flow/cli agent spawn -t coder --name my-coder. Complete walkthrough from spawn to result collection.", tags: ["recipe","agent"] },
                            { id: "t-r-2", name: "Running Multiple Agents in Parallel", color: "#065f46", description: "Using Task tool with run_in_background: true. Spawn 5 agents simultaneously, wait for results, synthesize output.", tags: ["recipe","parallel"] },
                            { id: "t-r-3", name: "Storing & Retrieving AI Memory", color: "#065f46", description: "memory store --key 'pattern-auth' --value 'JWT refresh tokens' --namespace patterns. Then memory search --query 'authentication'.", tags: ["recipe","memory"] },
                            { id: "t-r-4", name: "Making Every Chat Check the KB", color: "#065f46", description: "Configure Claude Code to always call kb_search before answering. CLAUDE.md rule setup and MCP server configuration.", tags: ["recipe","kb"] },
                            { id: "t-r-5", name: "Teaching AI to Learn From Tasks", color: "#065f46", description: "Post-task hooks: store successful patterns, train neural patterns, trigger optimization workers. Building a self-improving system.", tags: ["recipe","learning"] },
                            { id: "t-r-6", name: "Running a Security Scan", color: "#065f46", description: "npx @claude-flow/cli security scan --depth full. Interpreting results, fixing vulnerabilities, and scheduling regular scans.", tags: ["recipe","security"] },
                            { id: "t-r-7", name: "Using a Swarm to Fix a Complex Bug", color: "#065f46", description: "Coordinator + researcher + coder + tester swarm. Researcher finds the bug, coder fixes it, tester verifies. Real example walkthrough.", tags: ["recipe","swarm"] },
                            { id: "t-r-8", name: "Adding New Knowledge to the KB", color: "#065f46", description: "Write entry (2000-7000 chars), embed with ONNX pipeline, store with parameterized query, verify unique embedding. Complete workflow.", tags: ["recipe","kb"] },
                            { id: "t-r-9", name: "Monitoring Your Agents", color: "#065f46", description: "agent status, agent metrics, agent health, agent logs. Setting up alerts for failures and performance degradation.", tags: ["recipe","monitoring"] },
                            { id: "t-r-10", name: "Tuning Search Quality", color: "#065f46", description: "Adjusting ef_search, using reranking, filtering by metadata, and hybrid keyword+vector search. Getting the best results from your KB.", tags: ["recipe","search"] }
                        ]
                    },
                    {
                        id: "t-debug", name: "Debugging & Troubleshooting", color: "#14532d", count: 14,
                        description: "When things break: diagnosis, fixes, and error guides.",
                        children: [
                            { id: "t-db-1", name: "Why Things Break", color: "#14532d", description: "Most AI system failures come from: bad embeddings, context overflow, agent drift, network issues, or misconfiguration. Diagnostic decision tree.", tags: ["debugging","overview"] },
                            { id: "t-db-2", name: "Debugging AI Systems", color: "#14532d", description: "Systematic approach: check embeddings, verify search quality, inspect agent logs, test memory retrieval, and trace the full pipeline.", tags: ["debugging","systematic"] },
                            { id: "t-db-3", name: "Agent Not Responding", color: "#14532d", description: "Checklist: Is the daemon running? Is the API key valid? Is the model available? Is context too large? Step-by-step recovery.", tags: ["debugging","agent"] },
                            { id: "t-db-4", name: "When Agents Go Off-Script", color: "#14532d", description: "Agent drift diagnosis: check prompt clarity, verify constraints, inspect swarm topology, add coordinator oversight, reduce team size.", tags: ["drift","agents"] },
                            { id: "t-db-5", name: "Embeddings Broken: Fix Guide", color: "#14532d", description: "ruvector_embed() returns constants. Fix: use ONNX pipeline with Xenova/all-MiniLM-L6-v2. Verify: COUNT(DISTINCT) must equal COUNT(*).", tags: ["embeddings","fix"] },
                            { id: "t-db-6", name: "MCP Won't Connect", color: "#14532d", description: "Common issues: wrong transport, port conflict, missing API key, version mismatch. Diagnostic steps and fixes for each.", tags: ["mcp","connection"] },
                            { id: "t-db-7", name: "PostgreSQL Errors Decoded", color: "#14532d", description: "Common pg errors: UTF8 encoding issues (strip non-ASCII), UNIQUE violations, type mismatches, connection refused. Plain English explanations.", tags: ["postgres","errors"] },
                            { id: "t-db-8", name: "AI Memory Problems", color: "#14532d", description: "Memory not retrieving? Check: embeddings quality, namespace correct, HNSW index built, query matches stored format. Step-by-step fix.", tags: ["memory","debugging"] },
                            { id: "t-db-9", name: "Everything Is Slow", color: "#14532d", description: "Performance diagnosis: check embedding latency, HNSW recall, database connections, network roundtrips, model selection. Optimization checklist.", tags: ["performance","slow"] },
                            { id: "t-db-10", name: "Why Search Returns Wrong Results", color: "#14532d", description: "Bad results? Likely: poor embeddings, wrong distance metric, no normalization, stale index, or insufficient data. Fix each issue.", tags: ["search","quality"] },
                            { id: "t-db-11", name: "Deep Guide: Bad Search Results", color: "#14532d", description: "Comprehensive guide to diagnosing and fixing search quality: embedding analysis, index inspection, query reformulation, and reranking strategies.", tags: ["search","deep-dive"] },
                            { id: "t-db-12", name: "Hooks Not Working", color: "#14532d", description: "Hook debugging: check registration, verify trigger conditions, inspect hook output, test manually. Common hook configuration mistakes.", tags: ["hooks","debugging"] },
                            { id: "t-db-13", name: "Network & API Issues", color: "#14532d", description: "API timeout, rate limiting, authentication failures, DNS resolution. Network debugging toolkit for AI applications.", tags: ["network","api"] },
                            { id: "t-db-14", name: "Error Messages Glossary", color: "#14532d", description: "Alphabetical glossary of common error messages with plain English explanations and fixes. From ECONNREFUSED to VECTOR_DIM_MISMATCH.", tags: ["errors","glossary"] }
                        ]
                    },
                    {
                        id: "t-deep", name: "Deep Dives", color: "#166534", count: 9,
                        description: "Advanced topics explored in depth.",
                        children: [
                            { id: "t-dd-1", name: "How Ask Ruvnet Actually Works", color: "#166534", description: "End-to-end architecture: user query -> MCP server -> KB search (HNSW) -> context assembly -> LLM generation -> response. The complete pipeline.", tags: ["architecture","deep-dive"] },
                            { id: "t-dd-2", name: "What Ruflo Should Do Automatically", color: "#166534", description: "Vision document: auto-swarm detection, self-healing agents, predictive task routing, continuous optimization, and zero-config deployment.", tags: ["vision","automation"] },
                            { id: "t-dd-3", name: "Hyperbolic Embeddings", color: "#166534", description: "Poincare ball model: embedding hierarchical data in hyperbolic space where the circumference grows exponentially. Perfect for tree structures and taxonomies.", tags: ["hyperbolic","math"] },
                            { id: "t-dd-4", name: "Byzantine Consensus", color: "#166534", description: "How agents agree when some might be lying. Byzantine fault tolerance ensures correct consensus even when up to 1/3 of agents are faulty or malicious.", tags: ["byzantine","consensus"] },
                            { id: "t-dd-5", name: "CRDTs: Distributed State", color: "#166534", description: "Conflict-free Replicated Data Types allow multiple agents to update shared state independently and merge without conflicts. Eventually consistent, always available.", tags: ["crdt","distributed"] },
                            { id: "t-dd-6", name: "SONA: Self-Tuning Brain", color: "#166534", description: "Self-Optimizing Neural Architecture: <0.05ms adaptation time. Continuously adjusts its own parameters based on real-time performance feedback.", tags: ["sona","optimization"] },
                            { id: "t-dd-7", name: "Min-Cut: Weakest Link", color: "#166534", description: "Stoer-Wagner algorithm finds the minimum cut of a graph. Applied to AI systems: identifies critical failure points, bottlenecks, and vulnerability paths.", tags: ["mincut","algorithm"] },
                            { id: "t-dd-8", name: "Complete RuVector Intelligence Toolkit", color: "#166534", description: "Full toolkit: SONA + MoE + HNSW + EWC++ + Flash Attention. How all intelligence components work together in the 4-step pipeline: Retrieve, Judge, Distill, Consolidate.", tags: ["intelligence","toolkit"] },
                            { id: "t-dd-9", name: "Bridge: Technical to Business", color: "#166534", description: "Translating AI capabilities into business value. How to explain vector search, embeddings, and agent swarms to stakeholders who care about ROI.", tags: ["business","communication"] }
                        ]
                    },
                    {
                        id: "t-gloss", name: "Glossaries", color: "#15803d", count: 6,
                        description: "Quick-reference term definitions across all domains.",
                        children: [
                            { id: "t-g-1", name: "Core AI Glossary: 30 Terms", color: "#15803d", description: "30 essential AI terms explained: embedding, vector, similarity, HNSW, RAG, agent, swarm, MCP, token, context window, and 20 more.", tags: ["glossary","core"] },
                            { id: "t-g-2", name: "AI Jargon Decoder", color: "#15803d", description: "Translating buzzwords: 'fine-tuning' = teaching, 'inference' = asking, 'embedding' = meaning-as-numbers, 'hallucination' = confident guessing.", tags: ["jargon","decoder"] },
                            { id: "t-g-3", name: "Ruflo Glossary: 25 Terms", color: "#15803d", description: "Ruflo specific terms: agent, swarm, hook, worker, topology, consensus, memory tier, SPARC, hive mind, and 16 more.", tags: ["glossary","ruflo"] },
                            { id: "t-g-4", name: "Database Glossary: 20 Terms", color: "#15803d", description: "Database terms for AI: vector column, HNSW index, embedding dimension, similarity operator (<=>), ruvector type, and 15 more.", tags: ["glossary","database"] },
                            { id: "t-g-5", name: "Architecture Glossary: 15 Terms", color: "#15803d", description: "Architecture terms: microservice, monolith, serverless, edge computing, CDN, load balancer, container, orchestrator, and 7 more.", tags: ["glossary","architecture"] },
                            { id: "t-g-6", name: "AI Security Glossary: 20 Terms", color: "#15803d", description: "Security terms: prompt injection, jailbreak, PII, AIMDS, behavioral analysis, Lyapunov exponent, meta-learning, witness chain, and 12 more.", tags: ["glossary","security"] }
                        ]
                    }
                ]
            },
            {
                id: "algorithms", name: "Algorithms & Performance", color: "#f59e0b", count: 19,
                description: "Graph algorithms, performance engineering, and optimization techniques powering the RuVector ecosystem.",
                children: [
                    {
                        id: "algo-graph", name: "Graph Algorithms", color: "#f59e0b", count: 6,
                        description: "Min-cut, community detection, spectral clustering, and bridge detection.",
                        children: [
                            { id: "ag-1", name: "Stoer-Wagner: How Min-Cut Works", color: "#f59e0b", description: "The Stoer-Wagner algorithm finds the minimum cut of an undirected weighted graph in O(VE + V^2 log V). Used for fault detection and network resilience analysis.", tags: ["algorithm","mincut"] },
                            { id: "ag-2", name: "Beyond Min-Cut: Louvain & Spectral", color: "#f59e0b", description: "Complementary algorithms: Louvain for community detection (O(n log n)), spectral clustering for k-way partitioning. When min-cut isn't enough.", tags: ["algorithm","clustering"] },
                            { id: "ag-3", name: "Louvain Community Detection", color: "#f59e0b", description: "Fast modularity optimization for finding communities in large networks. Identifies natural clusters of related nodes, useful for organizing knowledge bases.", tags: ["louvain","community"] },
                            { id: "ag-4", name: "Spectral Clustering: K-Cluster", color: "#f59e0b", description: "Using eigenvalues of the graph Laplacian to find optimal k-way partitions. More mathematically principled than heuristic approaches.", tags: ["spectral","clustering"] },
                            { id: "ag-5", name: "Bridge & Articulation Point Detection", color: "#f59e0b", description: "Finding single-point-of-failure nodes (articulation points) and edges (bridges) in networks. Critical for resilience analysis.", tags: ["graph","resilience"] },
                            { id: "ag-6", name: "Dynamic Min-Cut: Real-Time Monitoring", color: "#f59e0b", description: "Maintaining min-cut incrementally as the graph changes, without recomputing from scratch. Enables real-time health monitoring of distributed systems.", tags: ["dynamic","monitoring"] }
                        ]
                    },
                    {
                        id: "algo-perf", name: "Performance Engineering", color: "#d97706", count: 13,
                        description: "Flash attention, token optimization, and benchmark results.",
                        children: [
                            { id: "ap-1", name: "Flash Attention: 2.49x-7.47x Faster", color: "#d97706", description: "Tiled attention computation that reduces memory I/O from O(n^2) to O(n). Achieves 2.49x speedup on short sequences and up to 7.47x on long sequences.", tags: ["flash-attention","performance"] },
                            { id: "ap-2", name: "Token Optimization: 50-75% Cost Reduction", color: "#d97706", description: "Techniques for reducing token usage: smart context truncation, summary caching, selective retrieval, and prompt compression. Cuts API costs significantly.", tags: ["tokens","cost"] },
                            { id: "ap-3", name: "Micro-HNSW 7.2KB Neuromorphic", color: "#d97706", description: "The smallest HNSW implementation: 7.2KB WASM with spiking neural network principles. Achieves competitive recall in extreme resource-constrained environments.", tags: ["micro-hnsw","wasm"] },
                            { id: "ap-4", name: "MinCut-Gated Transformer: Ultra-Low Latency", color: "#d97706", description: "Transformer variant using min-cut to prune attention heads dynamically. Achieves ultra-low latency by computing only the most impactful attention paths.", tags: ["transformer","latency"] },
                            { id: "ap-5", name: "RVF Progressive Indexing Benchmarks", color: "#d97706", description: "Benchmark results: progressive indexing vs batch rebuild. Progressive maintains 98% recall while indexing 10x faster for streaming data.", tags: ["benchmarks","indexing"] },
                            { id: "ap-6", name: "WASM Performance Profiling", color: "#d97706", description: "Tools and techniques for profiling WebAssembly performance: Chrome DevTools, wasm-pack profiling, memory analysis, and SIMD optimization.", tags: ["wasm","profiling"] },
                            { id: "ap-7", name: "Memory Quantization: 50-75% Reduction", color: "#d97706", description: "Quantizing vector embeddings from float32 to int8 or binary. Trades small recall loss for massive memory savings and faster distance computation.", tags: ["quantization","memory"] },
                            { id: "ap-8", name: "Batch Processing Optimization", color: "#d97706", description: "Optimizing batch embedding and ingestion: parallel ONNX inference, connection pooling, bulk INSERT, and pipeline architecture.", tags: ["batch","optimization"] },
                            { id: "ap-9", name: "Core Web Vitals for AI Apps", color: "#d97706", description: "Meeting LCP, FID, and CLS targets in AI-powered applications. Streaming responses, progressive loading, and optimistic UI patterns.", tags: ["web-vitals","frontend"] },
                            { id: "ap-10", name: "Connection Pooling Strategies", color: "#d97706", description: "PostgreSQL connection pooling for AI workloads: PgBouncer configuration, pool sizing, and handling long-running embedding queries.", tags: ["pooling","postgres"] },
                            { id: "ap-11", name: "CDN & Edge Caching for AI", color: "#d97706", description: "Caching strategies for AI responses: embedding cache, query result cache, and model artifact CDN distribution.", tags: ["cdn","caching"] },
                            { id: "ap-12", name: "Fox Flow: 12.8M QPS", color: "#d97706", description: "Fox Flow benchmark achieving 12.8 million queries per second. Architecture analysis and optimization techniques that enabled this throughput.", tags: ["benchmark","high-performance"] },
                            { id: "ap-13", name: "SONA <0.05ms Adaptation", color: "#d97706", description: "How SONA achieves sub-50-microsecond adaptation: in-place weight updates, gradient-free optimization, and hardware-aware scheduling.", tags: ["sona","latency"] }
                        ]
                    }
                ]
            },
            {
                id: "video", name: "Video Knowledge", color: "#ec4899", count: 70,
                description: "Conference talks, demos, deep dives, and 20 watchable live sessions from the Agentics Foundation — all indexed in RuVector with summaries and key topics.",
                children: [
                    {
                        id: "v-ruflo3", name: "Ruflo v3 Series", color: "#ec4899", count: 7,
                        description: "Video series covering Ruflo v3 architecture, self-learning, security, and community.",
                        children: [
                            { id: "v-cf-1", name: "Ruflo v3: Architecture, Agents, Workers", color: "#ec4899", description: "Deep dive into v3 architecture: new agent pool, background workers, hooks nervous system, and the shift from V2 sequential to V3 concurrent execution.", tags: ["video","ruflo-v3","architecture"] },
                            { id: "v-cf-2", name: "Ruflo v3: Self-Learning Vector Systems", color: "#ec4899", description: "How v3 uses HNSW-indexed pattern memory to learn from every task. Neural pattern training, experience replay, and knowledge distillation in action.", tags: ["video","ruflo-v3","learning"] },
                            { id: "v-cf-3", name: "Ruflo v3: Security & Self-Learning", color: "#ec4899", description: "Security architecture in v3: AIMDS integration, adversarial testing, and how the security system learns from attacks to improve defenses.", tags: ["video","ruflo-v3","security"] },
                            { id: "v-cf-4", name: "Ruflo v3: Everything Revealed", color: "#ec4899", description: "Comprehensive overview of all v3 features: 26 commands, 140+ subcommands, 12 workers, 27 hooks, and the complete ecosystem.", tags: ["video","ruflo-v3","complete"] },
                            { id: "v-cf-5", name: "Ruflo v3: Community QE Fleet", color: "#ec4899", description: "Community quality engineering: how the open-source community tests, validates, and improves Ruflo through collaborative QE fleets.", tags: ["video","ruflo-v3","community"] },
                            { id: "v-cf-6", name: "Ruflo v3: Hive Mind Architecture", color: "#ec4899", description: "Hive mind consensus deep dive: Byzantine fault tolerance, Raft leader election, gossip protocols, and how agents achieve distributed agreement.", tags: ["video","ruflo-v3","hive-mind"] },
                            { id: "v-cf-7", name: "Ruflo v3 Release: 500K Downloads", color: "#ec4899", description: "Milestone celebration and retrospective on the v3 release reaching 500,000 downloads. Community growth, adoption patterns, and roadmap.", tags: ["video","ruflo-v3","milestone"] }
                        ]
                    },
                    {
                        id: "v-rv", name: "RuVector Deep Dives", color: "#f472b6", count: 5,
                        description: "Technical deep dives into RuVector performance, graphs, and databases.",
                        children: [
                            { id: "v-rv-1", name: "Root Vector: Fastest AI Search", color: "#f472b6", description: "Performance deep dive: how RuVector achieves industry-leading vector search speeds through HNSW optimization, SIMD, and memory-efficient data structures.", tags: ["video","ruvector","performance"] },
                            { id: "v-rv-2", name: "Root Vector: Graph Neural Networks", color: "#f472b6", description: "Integrating graph neural networks with vector search: knowledge graph embeddings, relationship-aware retrieval, and graph-vector fusion.", tags: ["video","ruvector","gnn"] },
                            { id: "v-rv-3", name: "Root Vector: Development & Benchmarking", color: "#f472b6", description: "Development workflow and benchmarking methodology: how RuVector measures and optimizes performance across different hardware configurations.", tags: ["video","ruvector","benchmarks"] },
                            { id: "v-rv-4", name: "Root Vector: Intelligent Database", color: "#f472b6", description: "RuVector-Postgres as an intelligent database: 290+ SQL functions, native vector types, and seamless integration with existing PostgreSQL workflows.", tags: ["video","ruvector","postgres"] },
                            { id: "v-rv-5", name: "Fox Flow: 12.8M QPS Deep Dive", color: "#f472b6", description: "How Fox Flow achieved 12.8 million queries per second: architecture decisions, optimization techniques, and benchmark methodology.", tags: ["video","fox-flow","performance"] }
                        ]
                    },
                    {
                        id: "v-agentic", name: "Agentic Foundation", color: "#db2777", count: 7,
                        description: "Foundational talks on agentic AI, community building, and global adoption.",
                        children: [
                            { id: "v-ag-1", name: "Agentic AI Revolution", color: "#db2777", description: "Keynote on the shift from passive AI to agentic AI. How autonomous agents are transforming software development, business operations, and creative work.", tags: ["video","agentic","keynote"] },
                            { id: "v-ag-2", name: "Global Community Building", color: "#db2777", description: "How to build a global open-source AI community: governance, contribution models, and scaling from 10 to 10,000 contributors.", tags: ["video","community"] },
                            { id: "v-ag-3", name: "London Meetup: Content Creation", color: "#db2777", description: "London meetup talk on AI-powered content creation: from ideation to production using agent swarms for writing, editing, and publishing.", tags: ["video","meetup","content"] },
                            { id: "v-ag-4", name: "Finland: AI-Native Government", color: "#db2777", description: "Case study: Finland's approach to AI-native government services. How agentic AI can transform public services and citizen engagement.", tags: ["video","government","finland"] },
                            { id: "v-ag-5", name: "Building Agentic Solutions", color: "#db2777", description: "Practical guide to building agentic solutions: from problem identification to agent design to production deployment. Real-world examples and patterns.", tags: ["video","agentic","practical"] },
                            { id: "v-ag-6", name: "Building Agentic at Scale", color: "#db2777", description: "Scaling agentic systems: from single agent to enterprise deployment. Infrastructure, monitoring, cost management, and organizational adoption.", tags: ["video","scale","enterprise"] },
                            { id: "v-ag-7", name: "Network Topologies & Skills", color: "#db2777", description: "Deep dive into network topologies for agent communication and the Voyager skills system for reusable agent capabilities.", tags: ["video","topologies","skills"] }
                        ]
                    },
                    {
                        id: "v-arch", name: "Architecture & Design", color: "#be185d", count: 5,
                        description: "Architecture talks covering protocol design, transformers, and decision records.",
                        children: [
                            { id: "v-ar-1", name: "Prime Radiant: Coherence Engine", color: "#be185d", description: "The Prime Radiant coherence engine: maintaining consistency across distributed AI systems through gravitational coherence fields.", tags: ["video","prime-radiant"] },
                            { id: "v-ar-2", name: "AI Symbolic Protocol", color: "#be185d", description: "Combining symbolic reasoning with neural networks. How the AI Symbolic Protocol bridges traditional logic programming with modern AI.", tags: ["video","symbolic","protocol"] },
                            { id: "v-ar-3", name: "Novel Transformer Architectures", color: "#be185d", description: "Beyond standard transformers: MinCut-gated attention, sparse transformers, mixture-of-experts transformers, and their performance characteristics.", tags: ["video","transformers"] },
                            { id: "v-ar-4", name: "Hyperbolic Space Visualization", color: "#be185d", description: "Visualizing hierarchical data in hyperbolic space: Poincare disk model, Klein model, and interactive exploration of knowledge graphs.", tags: ["video","hyperbolic","visualization"] },
                            { id: "v-ar-5", name: "ADRs for Complex Systems", color: "#be185d", description: "Architecture Decision Records: documenting why decisions were made. 88 ADRs in RuVector as a case study for complex system governance.", tags: ["video","adr","governance"] }
                        ]
                    },
                    {
                        id: "v-tools", name: "Tools & Platforms", color: "#9d174d", count: 6,
                        description: "Tools, platforms, and operating systems for AI development.",
                        children: [
                            { id: "v-t-1", name: "Emily OS: Multi-Agent Orchestration", color: "#9d174d", description: "Emily OS platform for visual multi-agent orchestration. Drag-and-drop agent composition with real-time monitoring and debugging.", tags: ["video","emily-os","orchestration"] },
                            { id: "v-t-2", name: "Beacon: WiFi Mesh Disaster Recovery", color: "#9d174d", description: "Beacon: decentralized WiFi mesh network for disaster recovery. AI agents coordinate emergency response through ad-hoc networks.", tags: ["video","beacon","disaster"] },
                            { id: "v-t-3", name: "Rue Optimizer: Self-Learning OS", color: "#9d174d", description: "Self-learning operating system optimizer: monitors system performance, learns optimal configurations, and auto-tunes without human intervention.", tags: ["video","optimizer","os"] },
                            { id: "v-t-4", name: "OS-Level AI Optimizer", color: "#9d174d", description: "Integrating AI optimization at the operating system level: process scheduling, memory management, and I/O optimization driven by learned patterns.", tags: ["video","os","optimization"] },
                            { id: "v-t-5", name: "Edge Computing Revolution", color: "#9d174d", description: "Running AI at the edge: WASM runtimes, on-device inference, and the shift from cloud-dependent to edge-first AI architectures.", tags: ["video","edge","computing"] },
                            { id: "v-t-6", name: "Skills Deep Dive", color: "#9d174d", description: "Deep dive into the Voyager skills system: how agents learn, store, retrieve, and compose reusable skills for increasingly complex tasks.", tags: ["video","skills","voyager"] }
                        ]
                    },
                    {
                        id: "v-extra", name: "Additional Video Content", color: "#831843", count: 20,
                        description: "Additional conference talks, tutorials, and recorded sessions.",
                        children: [
                            { id: "v-e-1", name: "Introduction to Vector Databases", color: "#831843", description: "Beginner-friendly introduction to vector databases: what they are, why they matter, and how they differ from traditional databases.", tags: ["video","intro","vector-db"] },
                            { id: "v-e-2", name: "Building RAG Applications", color: "#831843", description: "Step-by-step tutorial: building a Retrieval-Augmented Generation application from scratch using RuVector and Claude.", tags: ["video","rag","tutorial"] },
                            { id: "v-e-3", name: "MCP Protocol Explained", color: "#831843", description: "Visual explanation of Model Context Protocol: how tools, resources, and prompts flow between AI models and external services.", tags: ["video","mcp","explained"] },
                            { id: "v-e-4", name: "Agent Debugging Workshop", color: "#831843", description: "Workshop recording: live debugging of agent issues including drift, memory failures, and communication breakdowns.", tags: ["video","debugging","workshop"] },
                            { id: "v-e-5", name: "Production Deployment Guide", color: "#831843", description: "Deploying AI systems to production: Railway setup, environment configuration, monitoring, and scaling strategies.", tags: ["video","deployment","production"] },
                            { id: "v-e-6", name: "Security Hardening Workshop", color: "#831843", description: "Hands-on workshop: implementing AIMDS security layers, testing with adversarial inputs, and configuring production security.", tags: ["video","security","workshop"] },
                            { id: "v-e-7", name: "Knowledge Base Architecture", color: "#831843", description: "Designing knowledge bases for AI: entry structure, embedding strategy, quality scoring, and search optimization.", tags: ["video","kb","architecture"] },
                            { id: "v-e-8", name: "Swarm Coordination Patterns", color: "#831843", description: "Visual demonstrations of swarm patterns: hierarchical, mesh, ring, star, and hybrid topologies in action.", tags: ["video","swarm","patterns"] },
                            { id: "v-e-9", name: "WASM for AI Applications", color: "#831843", description: "Tutorial on using WebAssembly for AI: compiling models to WASM, running inference in browsers, and performance optimization.", tags: ["video","wasm","tutorial"] },
                            { id: "v-e-10", name: "PostgreSQL for AI Developers", color: "#831843", description: "PostgreSQL crash course for AI developers: vector types, HNSW indexes, full-text search, and hybrid query strategies.", tags: ["video","postgres","tutorial"] },
                            { id: "v-e-11", name: "Ruflo CLI Masterclass", color: "#831843", description: "Complete CLI walkthrough: all 26 commands, key subcommands, workflow examples, and power-user tips.", tags: ["video","cli","masterclass"] },
                            { id: "v-e-12", name: "ONNX Embedding Pipeline", color: "#831843", description: "Building an ONNX embedding pipeline: model selection, batch processing, caching, and integration with vector databases.", tags: ["video","onnx","pipeline"] },
                            { id: "v-e-13", name: "Self-Healing AI Systems", color: "#831843", description: "Designing self-healing systems: health checks, automatic recovery, fallback strategies, and min-cut based resilience.", tags: ["video","self-healing","resilience"] },
                            { id: "v-e-14", name: "Cognitive Container Workshop", color: "#831843", description: "Hands-on: creating, deploying, and running RVF cognitive containers. From build to self-boot in a browser.", tags: ["video","rvf","workshop"] },
                            { id: "v-e-15", name: "Neural Architecture Search", color: "#831843", description: "Automated architecture search: how SONA discovers optimal neural network configurations through evolutionary and gradient-based methods.", tags: ["video","nas","sona"] },
                            { id: "v-e-16", name: "Open Source AI Governance", color: "#831843", description: "Governance models for open source AI: licensing, contribution guidelines, security disclosure, and community management.", tags: ["video","governance","open-source"] },
                            { id: "v-e-17", name: "Multi-Modal AI Agents", color: "#831843", description: "Agents that see, hear, and read: integrating vision, audio, and text models into multi-modal agent architectures.", tags: ["video","multimodal","agents"] },
                            { id: "v-e-18", name: "Cost Optimization for AI Teams", color: "#831843", description: "Reducing AI costs: model selection, caching, batch processing, prompt optimization, and when to use local vs cloud.", tags: ["video","cost","optimization"] },
                            { id: "v-e-19", name: "Real-Time AI Applications", color: "#831843", description: "Building real-time AI: streaming responses, WebSocket integration, server-sent events, and sub-100ms response targets.", tags: ["video","realtime","streaming"] },
                            { id: "v-e-20", name: "Future of Agentic AI", color: "#831843", description: "Panel discussion: where agentic AI is heading. Self-improving agents, cross-organization swarms, and the path to AGI.", tags: ["video","future","panel"] }
                        ]
                    },
                    {
                        id: "v-live", name: "Live Sessions — Watch Now", color: "#f43f5e", count: 20,
                        description: "20 recorded Agentics Foundation sessions — all watchable on video.agentics.org. Every session has been fully ingested into RuVector: session summaries, key topics, speaker insights, code examples, and screenshots captured. Ask anything about these sessions and get answers grounded in the actual content.",
                        children: [
                            { id: "vl-1",  name: "Building Agentic Systems at Scale",         color: "#f43f5e", date: "2026-01-16", duration: "1h 51m", videoUrl: "https://video.agentics.org/media/t/1_s07kapkb", description: "Architecture, security, and real-world implementation of agentic systems at scale. ADRs, the Rue Optimizer, Fox Flow database, and the complete agentic infrastructure stack.", tags: ["video","agentic","scale","architecture"] },
                            { id: "vl-2",  name: "Ruflo v3 Release",                           color: "#f43f5e", date: "2026-01-16", duration: "1h 49m", videoUrl: "https://video.agentics.org/media/t/1_xlre6ukc", description: "Revolutionary release hitting 500K+ downloads. Covers hive-mind intelligence, self-learning hooks, HNSW memory, security architecture, and the complete v3 ecosystem.", tags: ["video","ruflo","v3","release"] },
                            { id: "vl-3",  name: "Building Agentic Systems: Topologies",     color: "#f43f5e", date: "2026-01-23", duration: "2h 1m",  videoUrl: "https://video.agentics.org/media/t/1_8afwqubg", description: "Network topologies for agent coordination, the Voyager skills aggregation system, and AI infrastructure patterns for production deployments.", tags: ["video","topologies","skills","infrastructure"] },
                            { id: "vl-4",  name: "Agentix Foundation Community",              color: "#f43f5e", date: "2026-01-29", duration: "1h 5m",  videoUrl: "https://video.agentics.org/media/t/1_33xvl0xn", description: "Building a global community for agentic AI development. Governance models, open-source contribution at scale, and the Agentix Foundation mission.", tags: ["video","community","agentix"] },
                            { id: "vl-5",  name: "London Meetup: Sheet Music to Semantics",  color: "#f43f5e", date: "2026-01-28", duration: "1h 14m", videoUrl: "https://video.agentics.org/media/t/1_rozlzilu", description: "AI-powered content creation from structured data. Semantic graphs, content discovery, and building intelligent media applications.", tags: ["video","london","content","semantics"] },
                            { id: "vl-6",  name: "Ruflo v3: Hive-Mind Intelligence",          color: "#f43f5e", date: "2026-01-?", duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_nvkgdvm8", description: "Deep dive into hive-mind consensus architecture: Byzantine fault tolerance, how agents achieve distributed agreement, and collective intelligence patterns.", tags: ["video","ruflo","hive-mind","consensus"] },
                            { id: "vl-7",  name: "Ruflo v3: Self-Learning Vectors",          color: "#f43f5e", date: "2026-01-?", duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_392oe5oa", description: "Self-learning with vector systems: HNSW pattern memory, neural training from task outcomes, and knowledge distillation in Ruflo v3.", tags: ["video","ruflo","v3","learning","vectors"] },
                            { id: "vl-8",  name: "Ruflo v3: Future of AI Dev",               color: "#f43f5e", date: "2026-01-?", duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_oowknql6", description: "Building the future of AI development with Ruflo v3 and agentic systems. Live coding, demonstrations, and Q&A.", tags: ["video","ruflo","v3","agentic"] },
                            { id: "vl-9",  name: "AI Hackerspace Live — Nov 7",              color: "#f43f5e", date: "2025-11-14", duration: "1h 32m", videoUrl: "https://video.agentics.org/media/t/1_04q83xk2", description: "November AI Hackerspace session. Community projects, live demonstrations, agent experiments, and open Q&A.", tags: ["video","hackerspace","community","live"] },
                            { id: "vl-10", name: "Global AI Hackathon",                      color: "#f43f5e", date: "2025-12-06", duration: "5h",     videoUrl: "https://video.agentics.org/media/t/1_x6y3m453", description: "5-hour hackathon building AI-powered media discovery and smart TV integration. Root Vector, content silos, and streaming discovery.", tags: ["video","hackathon","media","smart-tv"] },
                            { id: "vl-11", name: "Agentic AI Revolution",                    color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_dpwbbr66", description: "Keynote on the shift from passive AI to fully autonomous agentic systems. Building autonomous intelligent systems for real-world impact.", tags: ["video","agentic","revolution","keynote"] },
                            { id: "vl-12", name: "Building the Prime Radiant",               color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_dxehuvpf", description: "How to build the Prime Radiant coherence engine for AI anti-hallucination. Sheaf Laplacian math, contradiction detection, and cryptographic proof chains.", tags: ["video","prime-radiant","anti-hallucination","coherence"] },
                            { id: "vl-13", name: "From Concept to Code with Claude AI",      color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_hpe5jw3w", description: "How Claude AI and agentic systems are reshaping software development. Vibe coding, rapid prototyping, and AI-assisted development workflows.", tags: ["video","claude","vibe-coding","development"] },
                            { id: "vl-14", name: "Building Agentic AI Solutions",            color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_rtjw6iv4", description: "Ruflo, Anti-Gravity, and real-world agentic applications. Practical patterns for production agent systems.", tags: ["video","agentic","solutions","practical"] },
                            { id: "vl-15", name: "Devoxx BE: Rise of AI Agents",             color: "#f43f5e", date: "2025-10-17", duration: "5m",    videoUrl: "https://video.agentics.org/media/t/1_b72cmcnd", description: "Conference talk at Devoxx Belgium on the rise of AI agents. Concise overview of the agentic shift for software developers.", tags: ["video","devoxx","conference","agents"] },
                            { id: "vl-16", name: "Root Vector: World's Fastest AI Search",  color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_prlsngek", description: "Deep dive on Root Vector: building the world's fastest AI search system. HNSW architecture, Graph Neural Networks, and benchmark methodology.", tags: ["video","root-vector","search","performance"] },
                            { id: "vl-17", name: "Finland: AI-Native Government",           color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_2156iluo", description: "Case study on Finland's AI-native government transformation. How agentic AI is reshaping public services and citizen engagement at national scale.", tags: ["video","finland","government","ai-native"] },
                            { id: "vl-18", name: "Breaking Down Content Silos: Hackathon",  color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_ay4ozec9", description: "72-hour hackathon to unify streaming content discovery. Breaking down silos between Netflix, Spotify, YouTube using semantic graphs.", tags: ["video","hackathon","content","streaming"] },
                            { id: "vl-19", name: "From Hackathon to Market",                 color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_3c70sv2p", description: "Taking AI-powered media discovery from hackathon prototype to market-ready product. Scaling, validation, and go-to-market strategy.", tags: ["video","hackathon","media","startup"] },
                            { id: "vl-20", name: "OS-Level Automation and Agentic AI",      color: "#f43f5e", date: "2025-?",    duration: "—",      videoUrl: "https://video.agentics.org/media/t/1_40wp4k60", description: "Building the future of computer use through OS-level automation. Agentic systems that control applications, automate workflows, and adapt to user behavior.", tags: ["video","os-automation","computer-use","agentic"] }
                        ]
                    }
                ]
            },
            {
                id: "infra", name: "Infrastructure & Deployment", color: "#06b6d4", count: 33,
                description: "Deployment guides, configuration, ecosystem documentation, and knowledge base operations.",
                children: [
                    {
                        id: "inf-deploy", name: "Deployment", color: "#06b6d4", count: 4,
                        description: "Deployment guides for various environments.",
                        children: [
                            { id: "inf-d-1", name: "Deploying on Railway", color: "#06b6d4", description: "Complete Railway deployment guide: Dockerfile configuration, environment variables, PostgreSQL provisioning, and custom domains.", tags: ["railway","deployment"] },
                            { id: "inf-d-2", name: "Air-Gapped Deployment", color: "#06b6d4", description: "Deploying AI systems in air-gapped environments: offline model packaging, RVF containers, and zero-internet-dependency architecture.", tags: ["air-gapped","offline"] },
                            { id: "inf-d-3", name: "Offline Deployment Guide", color: "#06b6d4", description: "Step-by-step offline deployment: pre-downloading models, bundling dependencies, WASM runtimes, and local-only configuration.", tags: ["offline","guide"] },
                            { id: "inf-d-4", name: "Ecosystem Deployment Guide", color: "#06b6d4", description: "Deploying the complete RuVector ecosystem: coordinating multiple services, shared databases, and inter-service communication.", tags: ["ecosystem","deployment"] }
                        ]
                    },
                    {
                        id: "inf-config", name: "Configuration", color: "#0891b2", count: 4,
                        description: "Configuration best practices, monitoring, and error handling.",
                        children: [
                            { id: "inf-c-1", name: "Configuration Best Practices", color: "#0891b2", description: "Environment variables, .env files, config hierarchies, and secrets management. Never inline passwords, always use .pgpass.", tags: ["config","best-practices"] },
                            { id: "inf-c-2", name: "Monitoring & Observability", color: "#0891b2", description: "Monitoring AI systems: health endpoints, metric collection, log aggregation, alerting rules, and dashboard design.", tags: ["monitoring","observability"] },
                            { id: "inf-c-3", name: "Scalability & Load Balancing", color: "#0891b2", description: "Scaling AI workloads: horizontal scaling, load balancer configuration, connection pooling, and auto-scaling triggers.", tags: ["scaling","load-balancing"] },
                            { id: "inf-c-4", name: "Error Handling & Recovery", color: "#0891b2", description: "Graceful error handling: retry strategies, circuit breakers, fallback responses, and dead letter queues for failed operations.", tags: ["errors","recovery"] }
                        ]
                    },
                    {
                        id: "inf-eco", name: "Ecosystem", color: "#0e7490", count: 4,
                        description: "How all the pieces connect: packages, documentation, and reference guides.",
                        children: [
                            { id: "inf-e-1", name: "RuvNet Ecosystem: How All Pieces Connect", color: "#0e7490", description: "Map of the complete ecosystem: RuVector (database) + Ruflo (orchestration) + AIMDS (security) + RVF (containers). How they interact.", tags: ["ecosystem","map"] },
                            { id: "inf-e-2", name: "RuvNet Complete Reference", color: "#0e7490", description: "Comprehensive reference documentation: all packages, all APIs, all configurations, and all deployment options in one place.", tags: ["reference","complete"] },
                            { id: "inf-e-3", name: "Core Package Tutorials", color: "#0e7490", description: "Getting started tutorials for each core package: @ruvector/core, @ruvector/rvf, @claude-flow/cli, and @ruvector/rvf-mcp-server.", tags: ["tutorials","packages"] },
                            { id: "inf-e-4", name: "RuvNet Packages Complete Documentation", color: "#0e7490", description: "Full documentation for all published npm packages: APIs, configuration options, examples, and migration guides.", tags: ["packages","docs"] }
                        ]
                    },
                    {
                        id: "inf-kb", name: "Knowledge Base Ops", color: "#155e75", count: 3,
                        description: "Building, scoring, and maintaining knowledge bases.",
                        children: [
                            { id: "inf-k-1", name: "Optimal KB Architecture", color: "#155e75", description: "Architecture for production knowledge bases: table design, embedding strategy, quality scoring, deduplication, and search optimization.", tags: ["kb","architecture"] },
                            { id: "inf-k-2", name: "KB Quality Scoring Rubric", color: "#155e75", description: "Scoring rubric: teaching clarity (0-25), technical accuracy (0-25), practical utility (0-25), completeness (0-25). Entries must score 70+ to be included.", tags: ["kb","quality"] },
                            { id: "inf-k-3", name: "Proven Methodology: Data to Knowledge Pipeline", color: "#155e75", description: "The pipeline: raw data -> cleaning -> chunking -> enrichment -> embedding -> validation -> ingestion. Each step with quality gates.", tags: ["methodology","pipeline"] }
                        ]
                    },
                    {
                        id: "inf-repos", name: "GitHub Repositories", color: "#22d3ee", count: 18,
                        description: "Key GitHub repositories from rUv (github.com/ruvnet) that comprise the broader RuvNet ecosystem.",
                        children: [
                            { id: "repo-1", name: "ruvector (80+ Rust crates)", color: "#22d3ee", description: "Core RuVector monorepo: 80+ Rust crates including rvf, ruvector-core, ruvector-mincut, sona, ruvector-nervous-system, ruvector-wasm, ruvector-postgres, micro-hnsw-wasm, prime-radiant, and more. The foundation of everything.", tags: ["github","rust","core"] },
                            { id: "repo-2", name: "ruflo v3.5.2 (AI Orchestration)", color: "#22d3ee", description: "Ruflo v3.5: The #1 ranked agent-based framework. 60+ specialized agents, swarm coordination, MCP server, self-learning hooks, vector memory. TypeScript.", tags: ["github","orchestration","agents"] },
                            { id: "repo-3", name: "agentic-flow (Model Switching)", color: "#22d3ee", description: "Agentic Flow: switch between low-cost AI models in Claude Code/Agent SDK. 66 agents, 213 MCP tools, ReasoningBank. Deploy locally then move to cloud.", tags: ["github","agentic","models"] },
                            { id: "repo-4", name: "flow-nexus (Cloud Platform)", color: "#22d3ee", description: "Flow Nexus: competitive agentic platform built on MCP. Deploy swarms, train neural networks, coding challenges, rUv credits. Gamified cloud development.", tags: ["github","cloud","platform"] },
                            { id: "repo-5", name: "SAFLA (Self-Aware Feedback Loop)", color: "#22d3ee", description: "Self-Aware Feedback Loop Algorithm: Python framework for building self-improving AI systems with autonomous feedback loops and meta-learning.", tags: ["github","safla","python","self-aware"] },
                            { id: "repo-6", name: "dspy.ts (DSPy for TypeScript)", color: "#22d3ee", description: "100% DSPy Python compliant TypeScript framework. MIPROv2 optimizer, chain-of-thought, ReAct, multi-agent. Bridges Python DSPy ecosystem to JavaScript.", tags: ["github","dspy","typescript"] },
                            { id: "repo-7", name: "SynthLang (Prompt Language)", color: "#22d3ee", description: "Hyper-efficient prompt language using logographical scripts and symbolic constructs. Optimizes LLM interactions with compressed, unambiguous prompts.", tags: ["github","synthlang","prompt"] },
                            { id: "repo-8", name: "sparc (Methodology)", color: "#22d3ee", description: "SPARC: Specification, Pseudocode, Architecture, Refinement, Completion. The structured methodology for agent-friendly task decomposition.", tags: ["github","sparc","methodology"] },
                            { id: "repo-9", name: "Synaptic-Mesh (Neural Fabric)", color: "#22d3ee", description: "Self-evolving peer-to-peer neural fabric: every element is an agent learning and communicating across a globally coordinated DAG substrate. Rust.", tags: ["github","synaptic","mesh","p2p"] },
                            { id: "repo-10", name: "midstream (Real-Time AI)", color: "#22d3ee", description: "Real-time AI conversation analysis: analyzes responses as they stream for instant insights, pattern detection, and intelligent decision-making. Rust.", tags: ["github","streaming","realtime"] },
                            { id: "repo-11", name: "Cognitum / ChipStart", color: "#22d3ee", description: "Hardware: The world's first agentic processing unit. CES 2026 Honoree. 256-core WASM fabric, ultra-low power edge AI. cognitum.one", tags: ["github","hardware","chip","ces"] },
                            { id: "repo-12", name: "agentic-robotics", color: "#22d3ee", description: "Modular agentic Python framework for robotics: IoT, physical devices, hospitality sector, consumer household tasks. TypeScript.", tags: ["github","robotics","iot"] },
                            { id: "repo-13", name: "FACT (Fast Augmented Context)", color: "#22d3ee", description: "FACT: Lean retrieval pattern that skips vector search. Caches static tokens, fetches live facts via Arcade.dev tools. Deterministic answers, sub-100ms.", tags: ["github","fact","retrieval"] },
                            { id: "repo-14", name: "QuDAG (Quantum-Resistant DAG)", color: "#22d3ee", description: "Quantum-resistant DAG-based anonymous communication system. Post-quantum cryptography for secure agent-to-agent communication. Rust.", tags: ["github","quantum","dag","security"] },
                            { id: "repo-15", name: "wifi-densepose (WiFi Pose)", color: "#22d3ee", description: "InvisPose: WiFi-based dense human pose estimation. Real-time full-body tracking through walls using commodity mesh routers. Python.", tags: ["github","wifi","pose","vision"] },
                            { id: "repo-16", name: "ruv-FANN (Neural Network Lib)", color: "#22d3ee", description: "Blazing-fast memory-safe neural network library for Rust. Brings FANN (Fast Artificial Neural Network) to modern Rust with safety guarantees.", tags: ["github","neural","rust","fann"] },
                            { id: "repo-17", name: "ARCADIA (AI Game Engine)", color: "#22d3ee", description: "AI-powered game engine for dynamic, personalized experiences in evolving worlds. Ethical, accessible, inclusive. Rust.", tags: ["github","games","ai","engine"] },
                            { id: "repo-18", name: "sublinear-time-solver", color: "#22d3ee", description: "Rust + WASM sublinear-time solver for asymmetric diagonally dominant systems. Neumann series, push, hybrid random-walk algorithms. npm/npx CLI.", tags: ["github","solver","wasm","math"] }
                        ]
                    }
                ]
            }
        ]
    };

    // ===== STATE =====
    let currentNode = KB_DATA;
    let navPath = [KB_DATA];
    let viewNodes = [];
    let autoRotate = true;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let rotX = 0, rotY = 0, targetRotX = 0, targetRotY = 0;
    let zoom = 1, targetZoom = 1;
    let pulsePhase = 0;
    let isExploded = false;
    let touchStartDist = 0;
    let animProgress = 0;
    let hoverNode = null;

    // ===== CANVAS =====
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * devicePixelRatio;
        canvas.height = H * devicePixelRatio;
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    // ===== SEARCH INDEX =====
    const searchIndex = [];
    function buildSearchIndex(node, path) {
        const p = path ? path + ' > ' + node.name : node.name;
        if (!node.children || node.children.length === 0 || (node.children[0] && !node.children[0].children)) {
            // leaf or near-leaf
        }
        searchIndex.push({ node, path: p, name: node.name.toLowerCase(), desc: (node.description || '').toLowerCase(), tags: (node.tags || []).join(' ').toLowerCase() });
        if (node.children) node.children.forEach(c => buildSearchIndex(c, p));
    }
    buildSearchIndex(KB_DATA, '');

    // ===== SEARCH UI =====
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        if (q.length < 2) { searchResults.style.display = 'none'; return; }
        const matches = searchIndex.filter(s => s.name.includes(q) || s.desc.includes(q) || s.tags.includes(q)).slice(0, 8);
        if (matches.length === 0) { searchResults.style.display = 'none'; return; }
        searchResults.style.display = 'block';
        searchResults.textContent = '';
        matches.forEach(m => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            const title = document.createElement('div');
            title.className = 'sr-title';
            title.textContent = m.node.name;
            if (m.node.count) {
                const badge = document.createElement('span');
                badge.className = 'sr-badge';
                badge.style.background = (m.node.color || '#4ecdc4') + '30';
                badge.style.color = m.node.color || '#4ecdc4';
                badge.textContent = m.node.count + ' entries';
                title.appendChild(badge);
            }
            div.appendChild(title);
            const pathDiv = document.createElement('div');
            pathDiv.className = 'sr-path';
            pathDiv.textContent = m.path;
            div.appendChild(pathDiv);
            div.addEventListener('click', () => {
                navigateToNode(m.node);
                searchInput.value = '';
                searchResults.style.display = 'none';
            });
            searchResults.appendChild(div);
        });
    });

    searchInput.addEventListener('blur', () => { setTimeout(() => searchResults.style.display = 'none', 200); });

    // ===== NAVIGATION =====
    function findPathTo(target, node, path) {
        if (node === target) return [...path, node];
        if (node.children) {
            for (const c of node.children) {
                const r = findPathTo(target, c, [...path, node]);
                if (r) return r;
            }
        }
        return null;
    }

    function navigateToNode(target) {
        const path = findPathTo(target, KB_DATA, []);
        if (!path) return;
        navPath = path;
        currentNode = target;
        isExploded = true;
        animProgress = 0;
        document.getElementById('click-prompt').classList.add('hidden');
        setupViewNodes();
        updateInfoPanel();
        updateBreadcrumb();
        updateCatHighlight();
    }

    function goHome() {
        navPath = [KB_DATA];
        currentNode = KB_DATA;
        isExploded = false;
        animProgress = 0;
        setupViewNodes();
        updateInfoPanel();
        updateBreadcrumb();
        updateCatHighlight();
    }

    function goBack() {
        if (navPath.length <= 1) { goHome(); return; }
        navPath.pop();
        currentNode = navPath[navPath.length - 1];
        animProgress = 0;
        setupViewNodes();
        updateInfoPanel();
        updateBreadcrumb();
        updateCatHighlight();
    }

    // ===== VIEW NODE SETUP =====
    function setupViewNodes() {
        viewNodes = [];
        if (!isExploded) {
            // Show just the root orb
            viewNodes.push({ node: KB_DATA, tx: 0, ty: 0, tz: 0, x: 0, y: 0, z: 0, isCenter: true, size: 60 });
            return;
        }
        const node = currentNode;
        if (!node.children || node.children.length === 0) {
            // Leaf node - show parent's view
            if (navPath.length >= 2) {
                const parent = navPath[navPath.length - 2];
                showChildrenOf(parent);
            }
            return;
        }
        showChildrenOf(node);
    }

    function showChildrenOf(parent) {
        viewNodes = [];
        const children = parent.children;
        const n = children.length;

        // Center node (parent)
        viewNodes.push({ node: parent, tx: 0, ty: 0, tz: 0, x: 0, y: 0, z: 0, isCenter: true, size: 45 });

        // Children in elliptical orbit
        const baseRadius = Math.min(280, 160 + n * 15);
        children.forEach((child, i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const rx = baseRadius;
            const ry = baseRadius * 0.55;
            const rz = 80;
            viewNodes.push({
                node: child,
                tx: Math.cos(angle) * rx,
                ty: Math.sin(angle) * ry,
                tz: Math.sin(angle) * rz,
                x: 0, y: 0, z: 0,
                isCenter: false,
                size: child.children ? Math.min(35, 18 + Math.sqrt(child.count || child.children.length) * 3) : 18
            });
        });
    }

    // ===== 3D PROJECTION =====
    function project(x, y, z) {
        const perspective = 900;
        const cX = Math.cos(rotX), sX = Math.sin(rotX);
        const cY = Math.cos(rotY), sY = Math.sin(rotY);
        let x1 = x * cY - z * sY;
        let z1 = x * sY + z * cY;
        let y1 = y * cX - z1 * sX;
        let z2 = y * sX + z1 * cX;
        const s = perspective / (perspective + z2) * zoom;
        return { x: W / 2 + x1 * s, y: H / 2 + y1 * s, scale: s, z: z2 };
    }

    // ===== COLOR HELPERS =====
    function lighten(hex, pct) {
        const n = parseInt(hex.replace('#',''), 16);
        const r = Math.min(255, (n >> 16) + Math.round(2.55 * pct));
        const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(2.55 * pct));
        const b = Math.min(255, (n & 0xff) + Math.round(2.55 * pct));
        return `rgb(${r},${g},${b})`;
    }
    function hexToRgba(hex, a) {
        const n = parseInt(hex.replace('#',''), 16);
        return `rgba(${n>>16},${(n>>8)&0xff},${n&0xff},${a})`;
    }

    // ===== RENDER =====
    function render() {
        ctx.clearRect(0, 0, W, H);
        pulsePhase += 0.025;
        animProgress = Math.min(1, animProgress + 0.03);
        const ease = 1 - Math.pow(1 - animProgress, 3);

        // Auto-rotate
        if (autoRotate && !isDragging) {
            targetRotY += 0.0015;
        }
        rotX += (targetRotX - rotX) * 0.08;
        rotY += (targetRotY - rotY) * 0.08;
        zoom += (targetZoom - zoom) * 0.1;

        // Animate positions
        viewNodes.forEach(vn => {
            vn.x += (vn.tx - vn.x) * 0.06;
            vn.y += (vn.ty - vn.y) * 0.06;
            vn.z += (vn.tz - vn.z) * 0.06;
        });

        // Compute screen positions on ORIGINAL viewNodes (for hit testing)
        viewNodes.forEach(vn => {
            const p = project(vn.x, vn.y, vn.z);
            vn.p = p;
            const pulse = 1 + Math.sin(pulsePhase + (vn.isCenter ? 0 : vn.tx * 0.01)) * 0.04;
            vn.sr = vn.size * p.scale * pulse;
            vn.sx = p.x;
            vn.sy = p.y;
        });

        // Sort by Z for painter's algorithm (sorted refs same objects)
        const sorted = [...viewNodes].sort((a, b) => b.p.z - a.p.z);

        // Draw connections
        const centerVn = sorted.find(s => s.isCenter);
        if (centerVn) {
            sorted.forEach(vn => {
                if (vn.isCenter) return;
                ctx.beginPath();
                ctx.moveTo(centerVn.p.x, centerVn.p.y);
                ctx.lineTo(vn.p.x, vn.p.y);
                const color = vn.node.color || centerVn.node.color || '#4ecdc4';
                ctx.strokeStyle = hexToRgba(color, 0.15 + (hoverNode === vn.node ? 0.2 : 0));
                ctx.lineWidth = hoverNode === vn.node ? 2 : 1;
                ctx.stroke();
            });
        }

        // Draw nodes
        sorted.forEach(vn => {
            const { p, node, isCenter, size } = vn;
            const r = vn.sr;
            const color = node.color || '#4ecdc4';
            const isHover = hoverNode === node;

            // Outer glow
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
            glow.addColorStop(0, hexToRgba(color, isHover ? 0.5 : 0.35));
            glow.addColorStop(0.4, hexToRgba(color, isHover ? 0.2 : 0.12));
            glow.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();

            // Core sphere
            const core = ctx.createRadialGradient(p.x - r * 0.25, p.y - r * 0.25, 0, p.x, p.y, r);
            core.addColorStop(0, lighten(color, 50));
            core.addColorStop(0.7, color);
            core.addColorStop(1, hexToRgba(color, 0.8));
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = core;
            ctx.fill();

            // Specular highlight
            const spec = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, 0, p.x - r * 0.15, p.y - r * 0.2, r * 0.6);
            spec.addColorStop(0, 'rgba(255,255,255,0.35)');
            spec.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = spec;
            ctx.fill();

            // Ring for navigable nodes
            if (node.children && node.children.length > 0 && !isCenter) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2);
                ctx.strokeStyle = hexToRgba(color, 0.3 + Math.sin(pulsePhase * 2) * 0.15);
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Label
            const labelSize = Math.max(10, Math.min(14, r * 0.35));
            ctx.font = `${isCenter ? 600 : 400} ${labelSize}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = isHover ? '#fff' : 'rgba(255,255,255,0.85)';
            const label = node.name.length > 32 ? node.name.substring(0, 30) + '...' : node.name;
            ctx.fillText(label, p.x, p.y + r + 16);

            // Count badge
            if (node.count && !isCenter) {
                ctx.font = '10px system-ui';
                ctx.fillStyle = hexToRgba(color, 0.8);
                ctx.fillText(node.count + ' entries', p.x, p.y + r + 28);
            } else if (node.children && node.children.length > 0 && !isCenter) {
                ctx.font = '10px system-ui';
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillText(node.children.length + ' items', p.x, p.y + r + 28);
            }
        });

        requestAnimationFrame(render);
    }

    // ===== HIT TEST =====
    function hitTest(mx, my) {
        // Test in reverse (front to back)
        for (let i = viewNodes.length - 1; i >= 0; i--) {
            const vn = viewNodes[i];
            if (vn.sx === undefined) continue;
            const dx = mx - vn.sx, dy = my - vn.sy;
            if (Math.sqrt(dx * dx + dy * dy) < vn.sr + 8) return vn;
        }
        return null;
    }

    // ===== MOUSE EVENTS =====
    canvas.addEventListener('mousedown', e => {
        isDragging = true;
        lastX = e.clientX; lastY = e.clientY;
        autoRotate = false;
    });
    canvas.addEventListener('mousemove', e => {
        // Hover detection
        const hit = hitTest(e.clientX, e.clientY);
        hoverNode = hit ? hit.node : null;
        canvas.style.cursor = hit ? 'pointer' : (isDragging ? 'grabbing' : 'grab');

        if (!isDragging) return;
        targetRotY += (e.clientX - lastX) * 0.005;
        targetRotX += (e.clientY - lastY) * 0.005;
        targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
        lastX = e.clientX; lastY = e.clientY;
    });
    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => { isDragging = false; hoverNode = null; });

    canvas.addEventListener('click', e => {
        const hit = hitTest(e.clientX, e.clientY);
        if (!hit) return;
        const node = hit.node;

        if (!isExploded) {
            // First click - explode root
            isExploded = true;
            currentNode = KB_DATA;
            navPath = [KB_DATA];
            animProgress = 0;
            document.getElementById('click-prompt').classList.add('hidden');
            setupViewNodes();
            updateInfoPanel();
            updateBreadcrumb();
            updateCatHighlight();
            return;
        }

        if (hit.isCenter) {
            // Clicked center - go back
            goBack();
            return;
        }

        // Navigate into clicked node
        if (node.children && node.children.length > 0) {
            navPath.push(node);
            currentNode = node;
            animProgress = 0;
            setupViewNodes();
            updateInfoPanel();
            updateBreadcrumb();
            updateCatHighlight();
        } else {
            // Leaf node - show info
            navPath.push(node);
            currentNode = node;
            updateInfoPanel();
            updateBreadcrumb();
        }
    });

    // Scroll zoom
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        targetZoom = Math.max(0.3, Math.min(3, targetZoom - e.deltaY * 0.001));
    }, { passive: false });

    // ===== TOUCH EVENTS =====
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
            autoRotate = false;
        } else if (e.touches.length === 2) {
            touchStartDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
            targetRotY += (e.touches[0].clientX - lastX) * 0.005;
            targetRotX += (e.touches[0].clientY - lastY) * 0.005;
            targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
            lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
            targetZoom = Math.max(0.3, Math.min(3, targetZoom * (dist / touchStartDist)));
            touchStartDist = dist;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        if (e.touches.length === 0) {
            isDragging = false;
            // Tap detection
            if (e.changedTouches.length === 1) {
                const t = e.changedTouches[0];
                const hit = hitTest(t.clientX, t.clientY);
                if (hit) canvas.dispatchEvent(new MouseEvent('click', { clientX: t.clientX, clientY: t.clientY }));
            }
        }
    });

    // ===== KEYBOARD =====
    document.addEventListener('keydown', e => {
        if (e.target === searchInput) return;
        if (e.key === 'r' || e.key === 'R') {
            targetRotX = 0; targetRotY = 0; targetZoom = 1; autoRotate = true;
        }
        if (e.key === 'Escape') goBack();
    });

    // Zoom buttons
    document.getElementById('btn-zin').addEventListener('click', () => targetZoom = Math.min(3, targetZoom + 0.2));
    document.getElementById('btn-zout').addEventListener('click', () => targetZoom = Math.max(0.3, targetZoom - 0.2));
    document.getElementById('btn-zreset').addEventListener('click', () => { targetRotX = 0; targetRotY = 0; targetZoom = 1; autoRotate = true; });

    // ===== UI UPDATES =====
    function updateBreadcrumb() {
        const bc = document.getElementById('breadcrumb');
        bc.textContent = '';
        navPath.forEach((node, i) => {
            if (i > 0) {
                const sep = document.createElement('span');
                sep.className = 'bc-sep';
                sep.textContent = ' > ';
                bc.appendChild(sep);
            }
            const item = document.createElement('span');
            item.className = 'bc-item' + (i === navPath.length - 1 ? ' current' : '');
            item.textContent = i === 0 ? 'Root' : node.name;
            if (i < navPath.length - 1) {
                const idx = i;
                item.addEventListener('click', () => {
                    navPath = navPath.slice(0, idx + 1);
                    currentNode = navPath[navPath.length - 1];
                    if (idx === 0) { goHome(); return; }
                    animProgress = 0;
                    setupViewNodes();
                    updateInfoPanel();
                    updateBreadcrumb();
                    updateCatHighlight();
                });
            }
            bc.appendChild(item);
        });
    }

    function updateCatHighlight() {
        document.querySelectorAll('.cat-item').forEach(el => {
            el.classList.toggle('active', navPath.length > 1 && el.dataset.id === navPath[1].id);
        });
    }

    function updateInfoPanel() {
        const panel = document.getElementById('info-panel');
        const content = document.getElementById('info-content');
        panel.classList.add('visible');
        content.textContent = '';

        const node = currentNode;

        // Back button
        if (navPath.length > 1) {
            const back = document.createElement('div');
            back.className = 'info-back';
            back.textContent = '<-- Back';
            back.addEventListener('click', goBack);
            content.appendChild(back);
        }

        // Title
        const title = document.createElement('div');
        title.id = 'info-title';
        title.textContent = node.name;
        content.appendChild(title);

        // Badge
        const badge = document.createElement('div');
        badge.className = 'info-badge';
        badge.style.background = (node.color || '#4ecdc4') + '25';
        badge.style.color = node.color || '#4ecdc4';
        badge.style.border = '1px solid ' + (node.color || '#4ecdc4') + '40';
        if (node.count) {
            badge.textContent = node.count + ' entries';
        } else if (node.children) {
            badge.textContent = node.children.length + ' sub-items';
        } else {
            badge.textContent = 'Entry';
        }
        content.appendChild(badge);

        // Description
        const desc = document.createElement('div');
        desc.id = 'info-desc';
        desc.textContent = node.description || '';
        content.appendChild(desc);

        // Knowledge indexed banner for watchable video sessions
        if (node.videoUrl) {
            const indexedBanner = document.createElement('div');
            indexedBanner.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;margin:8px 0;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;font-size:0.78em;color:#34d399;';
            const dot = document.createElement('span');
            dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;flex-shrink:0;';
            const label = document.createElement('span');
            label.textContent = 'Knowledge indexed in RuVector \u2014 full session summary, key topics & transcripts captured';
            indexedBanner.appendChild(dot);
            indexedBanner.appendChild(label);
            content.appendChild(indexedBanner);
        }

        // Tags
        if (node.tags && node.tags.length > 0) {
            const tagContainer = document.createElement('div');
            tagContainer.style.marginBottom = '12px';
            node.tags.forEach(t => {
                const tag = document.createElement('span');
                tag.className = 'info-tag';
                tag.textContent = t;
                tagContainer.appendChild(tag);
            });
            content.appendChild(tagContainer);
        }

        // Children list
        if (node.children && node.children.length > 0) {
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'info-section-title';
            sectionTitle.textContent = node.children[0].children ? 'Sub-domains (' + node.children.length + ')' : 'Entries (' + node.children.length + ')';
            content.appendChild(sectionTitle);

            node.children.forEach(child => {
                const item = document.createElement('div');
                item.className = 'info-list-item';
                const dot = document.createElement('span');
                dot.className = 'dot';
                dot.style.background = child.color || node.color || '#4ecdc4';
                dot.style.boxShadow = '0 0 4px ' + (child.color || node.color || '#4ecdc4');
                item.appendChild(dot);
                const text = document.createElement('span');
                text.textContent = child.name;
                text.style.flex = '1';
                item.appendChild(text);
                if (child.count) {
                    const cnt = document.createElement('span');
                    cnt.style.fontSize = '0.7em';
                    cnt.style.color = '#64748b';
                    cnt.textContent = child.count;
                    item.appendChild(cnt);
                } else if (child.children) {
                    const cnt = document.createElement('span');
                    cnt.style.fontSize = '0.7em';
                    cnt.style.color = '#475569';
                    cnt.textContent = child.children.length;
                    item.appendChild(cnt);
                }
                item.addEventListener('click', () => navigateToNode(child));
                content.appendChild(item);
            });
        }

        // Leaf node key facts
        if (!node.children && node.description) {
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'info-section-title';
            sectionTitle.textContent = 'Details';
            content.appendChild(sectionTitle);
            const detail = document.createElement('div');
            detail.className = 'info-detail';
            const p = document.createElement('p');
            p.textContent = node.description;
            detail.appendChild(p);
            content.appendChild(detail);
        }

        // Watch button for video nodes with a real URL
        if (node.videoUrl) {
            // Video meta (date + duration)
            if (node.date || node.duration) {
                const meta = document.createElement('div');
                meta.className = 'video-meta';
                if (node.date) {
                    const d = document.createElement('span');
                    d.textContent = '\uD83D\uDCC5 ' + node.date;
                    meta.appendChild(d);
                }
                if (node.duration) {
                    const t = document.createElement('span');
                    t.textContent = '\u23F1 ' + node.duration;
                    meta.appendChild(t);
                }
                content.appendChild(meta);
            }
            const watchBtn = document.createElement('a');
            watchBtn.className = 'watch-btn';
            watchBtn.href = node.videoUrl;
            watchBtn.target = '_blank';
            watchBtn.rel = 'noopener noreferrer';
            const playIcon = document.createElement('span');
            playIcon.className = 'play-icon';
            playIcon.textContent = '\u25B6';
            const btnText = document.createElement('span');
            btnText.textContent = 'Watch on Agentics Foundation';
            watchBtn.appendChild(playIcon);
            watchBtn.appendChild(btnText);
            content.appendChild(watchBtn);
        }
    }

    // ===== CATEGORY SIDEBAR =====
    function buildCategorySidebar() {
        const list = document.getElementById('cat-list');
        list.textContent = '';
        KB_DATA.children.forEach(domain => {
            const item = document.createElement('div');
            item.className = 'cat-item';
            item.dataset.id = domain.id;
            const dot = document.createElement('div');
            dot.className = 'cat-dot';
            dot.style.background = domain.color;
            dot.style.color = domain.color;
            item.appendChild(dot);
            const name = document.createElement('span');
            name.className = 'cat-name';
            name.textContent = domain.name;
            item.appendChild(name);
            const count = document.createElement('span');
            count.className = 'cat-count';
            count.textContent = domain.count;
            item.appendChild(count);
            item.addEventListener('click', () => navigateToNode(domain));
            list.appendChild(item);
        });
    }

    // ===== INIT =====
    function init() {
        // Re-run resize so canvas has correct dimensions now that iframe is laid out
        resize();
        buildCategorySidebar();
        setupViewNodes();
        // Use style.display directly — more reliable than classList in iframe context
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        render();
    }

    // Use ResizeObserver on the canvas to detect when the iframe has real
    // layout dimensions. This fires as soon as the browser paints the iframe,
    // making it reliable across localhost, HTTPS, headless, and all browsers.
    // Falls back to a 500ms timeout as a safety net.
    let initiated = false;
    function safeInit() {
        if (initiated) return;
        initiated = true;
        // Use canvas or body dimensions as fallback for window.innerWidth
        const w = canvas.clientWidth || document.documentElement.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || document.documentElement.clientHeight || window.innerHeight;
        if (w > 0) {
            W = w; H = h;
            canvas.width = w * devicePixelRatio;
            canvas.height = h * devicePixelRatio;
            ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        }
        init();
    }
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(entries => {
            for (const e of entries) {
                if (e.contentRect.width > 0) { ro.disconnect(); safeInit(); break; }
            }
        });
        ro.observe(document.body);
    }
    // Safety fallback: if ResizeObserver never fires, run after 500ms
    setTimeout(safeInit, 500);
