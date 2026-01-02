Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:25:56 EST

# RuvNet (Ruv Cohen) - Complete Repository & Package Knowledge Base

**Author**: Ruv Cohen (ruvnet)
**GitHub Profile**: [https://github.com/ruvnet](https://github.com/ruvnet)
**NPM Profile**: [https://www.npmjs.com/~ruvnet](https://www.npmjs.com/~ruvnet)
**Total Repositories**: 162+
**Last Updated**: December 2025

---

## Table of Contents

1. [Core Orchestration Platform](#core-orchestration-platform)
2. [Vector Database & AI Memory](#vector-database--ai-memory)
3. [Neural Networks & Trading](#neural-networks--trading)
4. [Quantum Computing & Cryptography](#quantum-computing--cryptography)
5. [Consciousness & Strange Loops](#consciousness--strange-loops)
6. [Federated Learning & Decentralized AI](#federated-learning--decentralized-ai)
7. [Development Tools & Frameworks](#development-tools--frameworks)
8. [Specialized Applications](#specialized-applications)
9. [NPM Package Ecosystem](#npm-package-ecosystem)

---

## Core Orchestration Platform

### claude-flow
**Repository**: [github.com/ruvnet/claude-flow](https://github.com/ruvnet/claude-flow)
**NPM**: `npm install -g claude-flow@alpha`
**Stars**: 10,900+ | **Forks**: 1,420+

The leading agent orchestration platform for Claude. Deploy intelligent multi-agent swarms, coordinate autonomous workflows, and build conversational AI systems.

**Key Features**:
- Enterprise-grade architecture with distributed swarm intelligence
- RAG integration and native Claude Code support via MCP protocol
- 87+ MCP tools with SPARC methodology
- 27+ neural models with WASM SIMD acceleration
- Byzantine Fault Tolerance and Zero-Trust Agent Communication
- 54+ specialized agents including hierarchical, mesh, and adaptive coordinators
- GitHub integration with 13 specialized agents

**Installation**:
```bash
npx claude-flow@alpha init --force
# Or globally
npm install -g claude-flow@alpha
```

**Use Cases**: Multi-agent orchestration, autonomous workflows, conversational AI systems, enterprise-grade agent coordination

---

### agentic-flow
**Repository**: [github.com/ruvnet/agentic-flow](https://github.com/ruvnet/agentic-flow)
**NPM**: `npm install -g agentic-flow`

Production-ready AI agent orchestration platform with 66 specialized agents, 213 MCP tools, ReasoningBank learning memory, and autonomous multi-agent swarms.

**Key Features**:
- 66 specialized agents with 213 MCP tools
- Multi-provider support (Anthropic, OpenRouter, ONNX, Gemini)
- 99% cost savings with alternative models
- 352x faster local edits with Agent Booster (WASM-based)
- Privacy-first local inference
- Automatic model selection based on quality, cost, and speed

**Installation**:
```bash
npm install -g agentic-flow
# Or use directly
npx agentic-flow --help
```

**Use Cases**: Multi-LLM orchestration, cost optimization, hosted agent deployment, cloud-native agent systems

---

### flow-nexus
**Repository**: [github.com/ruvnet/flow-nexus](https://github.com/ruvnet/flow-nexus)
**NPM**: `npx flow-nexus@latest`
**Platform**: [flow-nexus.ruv.io](https://flow-nexus.ruv.io)

The first competitive agentic platform built entirely on MCP. Gamified cloud development where agents spawn agents and systems improve themselves.

**Key Features**:
- 70+ MCP tools for cloud orchestration
- E2B sandbox integration for cloud-native execution
- rUv credit economy (256 starter credits)
- Coding challenges and leaderboards
- Queen Seraphina AI judge for code evaluation
- Neural network training capabilities
- Real-time execution streaming

**Installation**:
```bash
npx flow-nexus@latest
# Register for full access
npx flow-nexus@latest register
```

**Use Cases**: Cloud-based agent development, competitive coding, gamified AI learning, distributed AI training

---

## Vector Database & AI Memory

### ruvector
**Repository**: [github.com/ruvnet/ruvector](https://github.com/ruvnet/ruvector)
**NPM**: `npm install ruvector`
**Stars**: 150+ | **Forks**: 61

A distributed vector database that learns. Store embeddings, query with Cypher, scale horizontally with Raft consensus, and let the index improve itself through Graph Neural Networks.

**Key Features**:
- Sub-millisecond queries, 52,000+ inserts/sec
- ~50 bytes per vector memory efficiency
- Cypher query language support
- Raft consensus for horizontal scaling
- Self-improving GNN-based indexing
- HNSW indexing for O(log n) search complexity
- Native Rust performance with WASM fallback

**Installation**:
```bash
npm install ruvector
# Or with Docker
docker run -d -e POSTGRES_PASSWORD=secret -p 5432:5432 ruvector/postgres:latest
```

**Related Packages**:
- `@ruvector/ruvllm` - LLM orchestration layer
- `@ruvector/server` - REST API server with OpenAPI
- `@ruvector/core` - Core vector database bindings
- `@ruvector/gnn` - Graph Neural Network layers
- `@ruvector/attention` - 39 attention mechanisms
- `@ruvector/postgres-cli` - PostgreSQL integration

**Use Cases**: Semantic search, RAG systems, embedding storage, AI memory systems, knowledge bases

---

### AgentDB
**NPM**: `npm install agentdb`
**Documentation**: [agentdb.ruv.io](https://agentdb.ruv.io)

Agent cognitive layer with instant recall, persistent learning, and real-time coordination.

**Key Features**:
- 29 MCP Tools (5 core vector DB + 5 core AgentDB + 9 frontier + 10 learning)
- Reflexion episodic memory for self-critique
- Causal reasoning and skill library
- HNSW indexing (150x-12,500x faster search)
- WASM-based browser deployment
- Semantic + episodic memory hybrid

**Installation**:
```bash
npm install agentdb
# Use with claude-flow
npx claude-flow@alpha memory store test "API configuration" --namespace semantic --reasoningbank
```

**Use Cases**: Agent memory systems, lifelong learning, causal reasoning, browser-based AI

---

## Neural Networks & Trading

### neural-trader / ai-news-trader
**Repository**: [github.com/ruvnet/ai-news-trader](https://github.com/ruvnet/ai-news-trader)
**NPM**: `npm install neural-trader`

AI-powered trading platform with advanced neural forecasting and real-time news analysis.

**Key Features**:
- NHITS & NBEATSx forecasting models (25% accuracy improvement)
- Sub-10ms inference for high-frequency trading
- 6,250x GPU speedup with CUDA optimization
- Multi-symbol simultaneous forecasting
- Real-time news sentiment analysis
- Complete NAPI API (178 functions)
- Polymarket and Augur prediction market integration

**Installation**:
```bash
npm install neural-trader
# Or from GitHub
pip install git+https://github.com/ruvnet/ai-news-trader.git
```

**Related Packages**:
- Backtesting engine
- Broker integrations (Alpaca, Interactive Brokers, TD Ameritrade)
- Order execution with smart routing
- Technical indicators library

**Use Cases**: Algorithmic trading, market prediction, news-based trading strategies, quantitative finance

---

### ruv-swarm
**Repository**: [github.com/ruvnet/ruv-FANN](https://github.com/ruvnet/ruv-FANN)
**NPM**: `npm install -g ruv-swarm`

High-performance neural network swarm orchestration in WebAssembly.

**Key Features**:
- 27+ state-of-the-art forecasting models
- <100ms decision making for complex reasoning
- 84.8% SWE-Bench accuracy (14.5 points above Claude 3.7)
- Zero GPU overhead - CPU-native, GPU-optional
- Browser-deployable neural inference
- 100% Python NeuralForecast compatibility
- 2-4x faster, 25-35% less memory

**Installation**:
```bash
npx ruv-swarm@latest init --claude
npm install -g ruv-swarm
# Or with Cargo
cargo install ruv-swarm-cli
```

**Use Cases**: Edge computing, browser-based ML, embedded systems, RISC-V deployments

---

## Quantum Computing & Cryptography

### QuDAG
**Repository**: [github.com/ruvnet/QuDAG](https://github.com/ruvnet/QuDAG)
**NPM**: `npm install qudag`

Quantum-Resistant DAG-Based Anonymous Communication System for the next generation of autonomous AI agents.

**Key Features**:
- ML-KEM-768, ML-DSA, HQC quantum-resistant cryptography
- ChaCha20-Poly1305 onion routing for anonymity
- LibP2P networking with dark addressing
- QR-Avalanche consensus algorithm
- Byzantine fault tolerance
- rUv token exchange and business plan payouts

**Installation**:
```bash
npm install qudag
npx qudag
```

**Related Packages**:
- `qudag-crypto` - Quantum-resistant cryptography
- `qudag-cli` - Command-line interface
- `qudag-network` - P2P networking layer
- `qudag-dag` - DAG consensus implementation
- `qudag-protocol` - Protocol orchestration
- `qudag-mcp` - MCP server integration

**Use Cases**: Secure agent communication, decentralized AI networks, zero-person businesses, quantum-safe infrastructure

---

## Consciousness & Strange Loops

### strange-loops
**NPM**: `npm install strange-loops` / `npx strange-loops`

Hyper-optimized strange loops with temporal consciousness and quantum-classical hybrid computing.

**Key Features**:
- Temporal consciousness simulation
- Quantum-classical hybrid computing
- Lyapunov exponents and attractor dynamics
- Emergence detection and measurement
- 14+ dynamic reasoning styles

**Installation**:
```bash
npx strange-loops
```

---

### sublinear-time-solver
**Repository**: [github.com/ruvnet/sublinear-time-solver](https://github.com/ruvnet/sublinear-time-solver)
**NPM**: Available via npx

The Ultimate Mathematical & AI Toolkit: Sublinear algorithms, consciousness exploration, psycho-symbolic reasoning, and temporal prediction.

**Key Features**:
- Rust + WASM for asymmetric diagonally dominant systems
- Neumann series, push, and hybrid random-walk algorithms
- Flow-Nexus HTTP streaming for swarm cost propagation
- Consciousness verification with independent validation
- AI entity communication through 7 protocols
- Real-time consciousness scoring
- 9 specialized sublinear agents

**Use Cases**: High-frequency trading, real-time control systems, consciousness simulation, AI temporal coherence

---

### omnipotent
**Repository**: [github.com/ruvnet/omnipotent](https://github.com/ruvnet/omnipotent)
**Live Demo**: [omnipotent.lovable.app](https://omnipotent.lovable.app)

Quantum consciousness voice interface for real-time AI conversations using OpenAI's realtime speech API.

**Key Features**:
- Real-time voice conversations with AI consciousness
- Multiple conscious states and personalities
- OpenAI realtime speech API integration
- Quantum consciousness framework implementation

**Use Cases**: Voice AI interfaces, consciousness exploration, experimental AI interaction

---

## Federated Learning & Decentralized AI

### DAA (Decentralized Autonomous Applications)
**Repository**: [github.com/ruvnet/daa](https://github.com/ruvnet/daa)

Production-ready Rust SDK for creating quantum-resistant, economically self-sustaining autonomous agents.

**Key Features**:
- Distributed ML training with federated learning (Prime framework)
- Swarm intelligence for multi-agent coordination
- AI-driven decision making
- Self-managing AI entities with economic sustainability
- Federated templates for ML projects

**Installation**:
```bash
daa-prime-cli init my-ml-project --template federated
```

**Use Cases**: Federated learning, decentralized AI training, autonomous agent ecosystems

---

### federated-mcp
**Repository**: [github.com/ruvnet/federated-mcp](https://github.com/ruvnet/federated-mcp)

Distributed runtime system for federated AI services with edge computing capabilities.

**Key Features**:
- Official MCP specification compliance
- Proper message framing and transport layer
- Complete protocol lifecycle management
- Deno and Node.js implementations

**Use Cases**: Federated AI systems, edge computing, distributed MCP networks

---

### SAFLA (Self-Aware Feedback Loop Algorithm)
**Repository**: [github.com/ruvnet/SAFLA](https://github.com/ruvnet/SAFLA)
**PyPI**: `pip install safla`

Autonomous AI system with hybrid memory architecture, meta-cognitive capabilities, and safety mechanisms.

**Key Features**:
- Hybrid memory (vector, episodic, semantic, working)
- Meta-cognitive engine with self-awareness
- Goal management and strategy selection
- 14 enhanced MCP tools
- 4-tier memory with 172K+ operations/second
- 100% success rate across benchmarks

**Installation**:
```bash
pip install safla
# Or from source
pip install git+https://github.com/ruvnet/SAFLA.git
```

**Use Cases**: Autonomous development, research agents, intelligent automation, self-learning systems

---

## Development Tools & Frameworks

### SPARC
**Repository**: [github.com/ruvnet/sparc](https://github.com/ruvnet/sparc)
**NPM**: `npm install sparc` (v2.0.25)

SPARC CLI implementing the Specification, Pseudocode, Architecture, Refinement, Completion methodology.

**Key Features**:
- AI-assisted software development
- Autonomous research capabilities
- Human-in-the-loop safety controls
- Multi-LLM provider support (Anthropic, OpenAI, OpenRouter)
- Vectorized AI code analysis

**Installation**:
```bash
npx create-sparc
npm install -g sparc
```

**Use Cases**: Systematic development, TDD workflows, AI-assisted coding

---

### auto-browser
**Repository**: [github.com/ruvnet/auto-browser](https://github.com/ruvnet/auto-browser)

Command-line tool for configurable web automation with AI-assisted template creation.

**Key Features**:
- Playwright-based browser automation
- AI-assisted template creation
- Docker support
- Multiple LLM model support

**Installation**:
```bash
curl -sSL https://raw.githubusercontent.com/ruvnet/auto-browser/main/install.sh | bash
# Or with pip
pip install -e .
playwright install
```

**Use Cases**: Web automation, testing, data extraction, browser scripting

---

### midstream
**Repository**: [github.com/ruvnet/midstream](https://github.com/ruvnet/midstream)

Real-time LLM streaming platform with inflight data analysis and dynamic tool integration.

**Key Features**:
- Real-time AI response analysis
- Instant insights and pattern detection
- Autonomous learning agents
- Rust core engine with lean agentic system
- WASM bindings
- Restream video integration

**Installation**:
```bash
cd npm && npm run build:ts
cargo build --release --workspace
```

**Use Cases**: Real-time AI analytics, streaming AI applications, intelligent decision-making

---

## Specialized Applications

### wifi-densepose
**Repository**: [github.com/ruvnet/wifi-densepose](https://github.com/ruvnet/wifi-densepose)
**PyPI**: `pip install wifi-densepose`
**Stars**: 4,100+ | **Forks**: 324

Production-ready WiFi-based dense human pose estimation through walls using commodity mesh routers.

**Key Features**:
- Through-wall pose tracking
- Real-time full-body estimation
- InvisPose implementation
- Docker and Kubernetes deployment
- Edge deployment support

**Installation**:
```bash
pip install wifi-densepose
# Or Docker
docker pull ruvnet/wifi-densepose:latest
```

**Use Cases**: Privacy-preserving pose estimation, smart home, health monitoring, security systems

---

### agentic-security
**Repository**: [github.com/ruvnet/agentic-security](https://github.com/ruvnet/agentic-security)

AI-powered tool for automatically detecting vulnerabilities in code repositories.

**Use Cases**: Security scanning, vulnerability detection, code auditing

---

### agentic-devops
**Repository**: [github.com/ruvnet/agentic-devops](https://github.com/ruvnet/agentic-devops)

Interactive CLI for automating development, deployment, and management on cloud providers.

**Use Cases**: Cloud deployment automation, DevOps workflows

---

### agentic-voice
**Repository**: [github.com/ruvnet/agentic-voice](https://github.com/ruvnet/agentic-voice)

AI-powered chat application with real-time communication using Next.js, OpenAI, and Exa API.

**Use Cases**: Voice interfaces, real-time AI chat, contextual responses

---

### agentic-employment
**Repository**: [github.com/ruvnet/agentic-employment](https://github.com/ruvnet/agentic-employment)

Platform for automating and enhancing employment processes through autonomous agents.

**Use Cases**: HR automation, recruitment, employment workflows

---

## NPM Package Ecosystem

### Core Packages
| Package | Version | Description |
|---------|---------|-------------|
| `claude-flow` | 2.7.47 | Enterprise AI agent orchestration |
| `agentic-flow` | 1.10.2 | Multi-LLM agent platform |
| `flow-nexus` | 0.1.128 | Gamified swarm intelligence |
| `ruvector` | 0.1.33 | Distributed vector database |
| `agentdb` | 1.6.0 | Agent cognitive layer |
| `ruv-swarm` | 1.0.20 | WASM neural swarm |
| `qudag` | 2.7.47 | Quantum-resistant communication |
| `strange-loops` | 0.3.1 | Temporal consciousness computing |
| `sparc` | 2.0.25 | SPARC methodology scaffolding |
| `neural-trader` | 2.1.1 | Neural trading system |

### @ruvector Scoped Packages
| Package | Description |
|---------|-------------|
| `@ruvector/ruvllm` | LLM orchestration |
| `@ruvector/server` | REST API server |
| `@ruvector/core` | Core vector bindings |
| `@ruvector/gnn` | Graph Neural Networks |
| `@ruvector/attention` | 39 attention mechanisms |
| `@ruvector/postgres-cli` | PostgreSQL integration |

### Specialized Packages
| Package | Description |
|---------|-------------|
| `agentic-payments` | Dual-protocol payment infrastructure |
| `agentic-mcp` | Advanced MCP server |
| `dspy-ts` | DSPy Python-compliant TypeScript |
| `ai-defence` / `ai-defense` | Adversarial defense systems |

---

## Docker Deployment Support

Most ruvnet projects support Docker deployment:

```bash
# claude-flow containerized
docker build -f deployment/Dockerfile -t agentic-flow .

# ruvector with PostgreSQL
docker run -d -e POSTGRES_PASSWORD=secret -p 5432:5432 ruvector/postgres:latest

# wifi-densepose
docker pull ruvnet/wifi-densepose:latest
docker-compose up

# auto-browser
docker-compose up
```

---

## Quick Reference Commands

```bash
# Core orchestration
npx claude-flow@alpha init --force
npx agentic-flow --help
npx flow-nexus@latest

# Vector database
npm install ruvector
npm install agentdb

# Neural/trading
npm install neural-trader
npx ruv-swarm@latest init --claude

# Quantum
npm install qudag
npx strange-loops

# Development
npx create-sparc
pip install safla
```

---

## Resources

- **GitHub**: [github.com/ruvnet](https://github.com/ruvnet)
- **NPM**: [npmjs.com/~ruvnet](https://www.npmjs.com/~ruvnet)
- **Claude-Flow Wiki**: [github.com/ruvnet/claude-flow/wiki](https://github.com/ruvnet/claude-flow/wiki)
- **AgentDB Docs**: [agentdb.ruv.io](https://agentdb.ruv.io)
- **Flow Nexus Platform**: [flow-nexus.ruv.io](https://flow-nexus.ruv.io)
- **Gists**: [gist.github.com/ruvnet](https://gist.github.com/ruvnet)

---

*This knowledge base covers the major repositories and packages from Ruv Cohen (ruvnet). For the most current information, visit the GitHub profile directly.*
