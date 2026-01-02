Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-25 14:03:33 EST

# RuvNet Ecosystem Complete Reference

> **CRITICAL DOCUMENT** - This is the authoritative reference for all RuvNet packages
> **Last Updated**: December 17, 2025
> **Author**: ruvnet (ruv@ruv.net)

---

## Table of Contents

1. [Quick Reference Card](#quick-reference-card)
2. [Known Issues & Workarounds](#known-issues--workarounds)
3. [RuVector - Vector Database](#ruvector---vector-database)
4. [RuvLLM - Self-Learning LLM Orchestration](#ruvllm---self-learning-llm-orchestration)
5. [Agentic Flow - Agent Orchestration](#agentic-flow---agent-orchestration)
6. [Claude Flow - Enterprise Orchestration](#claude-flow---enterprise-orchestration)
7. [NPM Package Inventory](#npm-package-inventory)
8. [Installation Commands](#installation-commands)
9. [API Quick Reference](#api-quick-reference)
10. [File Locations](#file-locations)

---

## Quick Reference Card

### Working Installation (Copy & Paste)

```bash
# RECOMMENDED: All packages that work together (always use latest)
npm install ruvector@latest @ruvector/ruvllm agentic-flow claude-flow

# Individual packages
npm install ruvector@latest        # Vector DB (ALWAYS USE LATEST)
npm install @ruvector/ruvllm       # LLM orchestration
npm install agentic-flow           # 150+ agents, 213 MCP tools
npm install claude-flow            # Enterprise orchestration
```

### GitHub Repositories

| Package | GitHub URL |
|---------|-----------|
| RuVector | https://github.com/ruvnet/ruvector |
| Agentic Flow | https://github.com/ruvnet/agentic-flow |
| Claude Flow | https://github.com/ruvnet/claude-flow |

### NPM Registry

| Package | NPM URL |
|---------|---------|
| ruvector | https://www.npmjs.com/package/ruvector |
| @ruvector/ruvllm | https://www.npmjs.com/package/@ruvector/ruvllm |
| agentic-flow | https://www.npmjs.com/package/agentic-flow |
| claude-flow | https://www.npmjs.com/package/claude-flow |

---

## Known Issues & Workarounds

### ruvector - ALWAYS USE LATEST

**UPDATE (December 2025)**: The dependency issues have been resolved. Always use the latest version:
```bash
npm install ruvector@latest
```

**Current Latest**: 0.1.35 (as of December 17, 2025)

**Historical Note**: Earlier versions (0.1.33) had issues with missing `@ruvector/core@^0.1.25`. These have been fixed.

### Package Name Confusion

| You might search for | Actual package name |
|---------------------|---------------------|
| `ruvllm` | `@ruvector/ruvllm` (SCOPED!) |
| `ruvector-core` | `@ruvector/core` |
| `ruvector` | `ruvector` (use @latest) |

---

## RuVector - Vector Database

### Overview

High-performance distributed vector database written in Rust with:
- **HNSW indexing**: 61µs p50 latency, 16,400 QPS
- **Cypher queries**: Neo4j-compatible graph queries
- **39 attention mechanisms**: Flash, Linear, Graph, Hyperbolic
- **SONA**: Self-Optimizing Neural Architecture
- **Auto-sharding**: Consistent hashing, Raft consensus

### Quick Start

```javascript
const ruvector = require('ruvector');

// Vector search
const db = new ruvector.VectorDB(128);
db.insert('doc1', embedding1);
const results = db.search(queryEmbedding, 10);

// Graph queries (Cypher)
db.execute("CREATE (a:Person {name: 'Alice'})-[:KNOWS]->(b:Person {name: 'Bob'})");
db.execute("MATCH (p:Person)-[:KNOWS]->(friend) RETURN friend.name");
```

### Rust Usage

```rust
use ruvector_gnn::RuvectorLayer;
let layer = RuvectorLayer::new(128, 256, 4, 0.1);
let enhanced = layer.forward(&query, &neighbors, &weights);
```

### Performance Benchmarks

| Operation | Dimensions | Latency | Throughput |
|-----------|-----------|---------|-----------|
| HNSW Search (k=10) | 384 | 61µs | 16,400 QPS |
| Cosine Distance | 1536 | 143ns | 7M ops/sec |
| Batch Distance (1000) | 384 | 237µs | 4.2M/sec |

---

## RuvLLM - Self-Learning LLM Orchestration

### Overview

Self-learning LLM system that improves from every interaction:
- **TRM (Tiny Recursive Models)**: 135M-2.6B params reasoning
- **SONA Engine**: LoRA + EWC++ + ReasoningBank
- **FastGRNN Router**: Intelligent model selection
- **HNSW Memory**: Adaptive synaptic mesh
- **SIMD Inference**: AVX2/AVX512/SSE4.1 optimized

### NPM Package

```bash
npm install @ruvector/ruvllm
npx @ruvector/ruvllm --help
```

### Three Learning Loops

1. **Instant Loop** (<100μs): Per-request MicroLoRA adaptation
2. **Background Loop** (Hourly): K-means++ pattern extraction
3. **Deep Loop** (Weekly): EWC++ consolidation, dream memory

### JavaScript API

```javascript
const { RuvLLM, Config } = require('@ruvector/ruvllm');

const config = {
  embeddingDim: 768,
  routerHiddenDim: 128,
  learningEnabled: true
};

const llm = new RuvLLM(config);
const session = llm.newSession();
const response = await llm.querySession(session, "What is ML?");

console.log(response.text);
console.log(response.routingInfo.model);
console.log(response.confidence);
```

### Rust API

```rust
use ruvllm::{Config, RuvLLM};

let config = Config::builder()
    .embedding_dim(768)
    .router_hidden_dim(128)
    .learning_enabled(true)
    .build()?;

let llm = RuvLLM::new(config).await?;
let session = llm.new_session();
let response = llm.query_session(&session, "What is ML?").await?;
```

### WASM Usage (Browser)

```javascript
import init, { WasmSonaEngine } from '@ruvector/ruvllm/wasm';

await init();
const engine = new WasmSonaEngine(256);

const embedding = new Float32Array(256).fill(0.1);
const trajectoryId = engine.startTrajectory(embedding);
engine.recordStep(trajectoryId, 42, 0.8, 1000);
engine.endTrajectory(trajectoryId, 0.85);

const output = engine.applyLora(embedding);
engine.runInstantCycle();
```

### Performance

- Initialization: 3.71ms
- Average Query: 0.09ms
- Throughput: ~38,000 queries/second
- Memory: ~50MB base

---

## Agentic Flow - Agent Orchestration

### Overview

Production-ready AI agent platform with:
- **150+ specialized agents**: coder, reviewer, researcher, etc.
- **213 MCP tools**: Swarm, memory, GitHub, workflows
- **ReasoningBank**: Persistent learning memory
- **Multi-Model Router**: 100+ LLMs supported
- **Agent Booster**: 352x faster code operations

### Quick Start

```bash
npm install -g agentic-flow

# Run an agent
npx agentic-flow --agent researcher --task "Analyze patterns"

# With optimization
npx agentic-flow --agent coder --task "Build auth system" --optimize
```

### JavaScript API

```javascript
import { ModelRouter } from 'agentic-flow/router';
import * as reasoningbank from 'agentic-flow/reasoningbank';

// Model routing
const router = new ModelRouter();
const response = await router.chat({
  model: 'auto',
  priority: 'cost',
  messages: [{ role: 'user', content: 'Hello' }]
});

// Learning memory
await reasoningbank.initialize();
await reasoningbank.storeMemory('pattern', 'value', { namespace: 'api' });
const results = await reasoningbank.queryMemories('search term');
```

### Available Agents (Key Selection)

**Development**:
- `coder`, `reviewer`, `tester`, `planner`, `researcher`
- `backend-dev`, `mobile-dev`, `ml-developer`, `system-architect`

**Swarm Coordinators**:
- `hierarchical-coordinator`, `mesh-coordinator`
- `adaptive-coordinator`, `swarm-memory-manager`

**GitHub**:
- `pr-manager`, `code-review-swarm`, `issue-tracker`
- `release-manager`, `workflow-automation`

### MCP Tools (213 Total)

| Category | Count | Examples |
|----------|-------|----------|
| claude-flow | 101 | Swarm init, agent spawn, memory ops |
| flow-nexus | 96 | E2B sandboxes, neural training |
| agentic-payments | 10 | Payment authorization |
| Internal | 7 | MCP server management |

### Cost Optimization

| Model Tier | Example | Cost/1M tokens |
|------------|---------|----------------|
| Tier 1 | Claude Sonnet 4.5, GPT-4o | Highest |
| Tier 2 | DeepSeek R1, V3 | $0.55/$2.19 |
| Tier 3 | Gemini 2.5 Flash, Llama 70B | Medium |
| Tier 4 | Llama 8B | Low |
| Tier 5 | ONNX Phi-4 | Free (local) |

---

## Claude Flow - Enterprise Orchestration

### Overview

Enterprise-grade AI orchestration with:
- **25 Claude Skills**: Natural language activation
- **AgentDB v1.3.9**: 96x-164x faster vector search
- **Hive-mind coordination**: Specialized worker agents
- **100 MCP tools**: Swarm orchestration
- **Advanced hooks**: Automated workflows

### Quick Start

```bash
npm install -g @anthropic-ai/claude-code
claude --dangerously-skip-permissions
npx claude-flow@alpha init --force
```

### Workflows

```bash
# Single feature
npx claude-flow@alpha hive-mind spawn "Implement auth" --claude

# Query memory
npx claude-flow@alpha memory query "auth" --recent

# Multi-feature project
npx claude-flow@alpha init --force --project-name "my-app"
npx claude-flow@alpha hive-mind spawn "auth-system" --namespace auth --claude
```

### Performance

- 84.8% SWE-Bench solve rate
- 32.3% token reduction
- 2.8-4.4x speed improvement
- 64 specialized agents
- 180+ AgentDB tests

---

## NPM Package Inventory

### Core Packages

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `ruvector` | 0.1.35 | WORKS | **ALWAYS USE LATEST** |
| `@ruvector/core` | 0.1.17 | WORKS | Core Rust bindings |
| `@ruvector/ruvllm` | 0.2.3 | WORKS | LLM orchestration |
| `agentic-flow` | 2.0.1-alpha | WORKS | Agent platform |
| `claude-flow` | 2.7.47 | WORKS | Enterprise orchestration |

### @ruvector Scoped Packages

```
@ruvector/ruvllm@0.2.3        - LLM orchestration
@ruvector/core@0.1.17         - Core bindings
@ruvector/gnn@0.1.22          - Graph Neural Networks
@ruvector/graph-node@0.1.25   - Graph database
@ruvector/cluster@0.1.0       - Distributed clustering
@ruvector/server@0.1.0        - HTTP/gRPC server
@ruvector/attention-wasm@0.1.0 - Attention WASM
@ruvector/gnn-wasm@0.1.0      - GNN for browsers
```

### Platform Bindings

```
ruvector-core-darwin-arm64    - macOS Apple Silicon
ruvector-core-darwin-x64      - macOS Intel
ruvector-core-linux-x64-gnu   - Linux x64
ruvector-core-linux-arm64-gnu - Linux ARM64
ruvector-core-win32-x64-msvc  - Windows x64
```

---

## Installation Commands

### Full Stack (Recommended)

```bash
# All packages together (always use latest ruvector)
npm install ruvector@latest @ruvector/ruvllm agentic-flow claude-flow

# Verify installation
node -e "console.log('ruvector:', typeof require('ruvector'))"
node -e "console.log('ruvllm:', typeof require('@ruvector/ruvllm'))"
node -e "console.log('agentic-flow:', typeof require('agentic-flow'))"
```

### Global CLI Tools

```bash
npm install -g agentic-flow claude-flow @ruvector/ruvllm

# Test CLIs
npx agentic-flow --help
npx claude-flow --help
npx @ruvector/ruvllm --help
```

### Optional Packages

```bash
# Graph capabilities
npm install @ruvector/gnn @ruvector/graph-node

# Distributed clustering
npm install @ruvector/cluster @ruvector/server
```

---

## API Quick Reference

### RuVector

```javascript
// Vector operations
const db = new ruvector.VectorDB(dimensions);
db.insert(id, embedding);
db.search(queryEmbedding, k);
db.delete(id);

// Graph queries
db.execute("CYPHER QUERY");
```

### RuvLLM

```javascript
// Orchestration
const llm = new RuvLLM(config);
const session = llm.newSession();
const response = await llm.querySession(session, query);

// SONA learning
const coordinator = new LoopCoordinator(config);
coordinator.instantLoop().recordTrajectory(query, response, quality);
```

### Agentic Flow

```javascript
// Model routing
const router = new ModelRouter();
const response = await router.chat({ model: 'auto', messages });

// Memory
await reasoningbank.initialize();
await reasoningbank.storeMemory(key, value, options);
const results = await reasoningbank.queryMemories(query);
```

### Claude Flow

```bash
# Hive-mind
npx claude-flow@alpha hive-mind spawn "task" --claude

# Memory
npx claude-flow@alpha memory query "search" --recent
```

---

## File Locations

### Global (All Projects)

```
~/.claude/
├── CLAUDE.md                           # Global instructions
├── knowledge/
│   └── RUVNET_ECOSYSTEM_COMPLETE.md    # THIS FILE
├── commands/
│   └── ruvnet-stack.md                 # RuvNet stack command
└── hooks/
    └── session-start.sh                # Auto-update hook
```

### Project-Level

```
/your-project/
├── node_modules/
│   ├── ruvector/                       # Vector DB
│   ├── @ruvector/
│   │   ├── ruvllm/                     # LLM orchestration
│   │   ├── core/                       # Core bindings
│   │   └── gnn/                        # Graph networks
│   ├── agentic-flow/                   # Agents
│   └── claude-flow/                    # Enterprise
└── .claude/
    └── CLAUDE.md                       # Project-specific config
```

### This Project (claude-presentation-master)

```
/Users/stuartkerr/Code/PresenterMode/claude-presentation-master/
├── ruvector/                           # Knowledge base YAML
│   └── presentation-knowledge.yaml
├── docs/
│   └── RUVECTOR_ECOSYSTEM_REFERENCE.md # Project reference
└── node_modules/                       # Installed packages
```

---

## Version Compatibility Matrix

| ruvector | @ruvector/core | Status |
|----------|----------------|--------|
| 0.1.35 | latest | WORKS |
| 0.1.34 | latest | WORKS |
| 0.1.33+ | ^0.1.25 | FIXED |

**ALWAYS use `ruvector@latest` - issues have been resolved.**

---

## Implementation Best Practices

### Project Setup - Local Installation (Recommended)

Always install RuvNet packages **locally per project**, not globally:

```bash
# Initialize project
npm init -y

# Install RuvNet stack locally
npm install ruvector @ruvector/ruvllm agentic-flow claude-flow --save

# Initialize claude-flow for the project
npx claude-flow@alpha init --force
```

**Why Local?**
- **Isolation**: Each project has its own knowledge base and memory
- **Version Control**: Different projects can use different versions
- **No Pollution**: No cross-project data contamination
- **Reproducibility**: `package.json` defines exact dependencies

### Data Storage Locations

| Data Type | Location | Scope |
|-----------|----------|-------|
| Claude Flow memory | `.swarm/memory.db` | Project-local |
| RuVector knowledge | `.ruvector/` | Project-local |
| ReasoningBank | Namespaced in memory | Project-local |
| YAML knowledge | `ruvector/*.yaml` | Project-local |

### Session Update Hook

A hook runs on Claude Code session start to check for RuvNet updates:
- Location: `~/.claude/hooks/ruvnet-update-check.sh`
- **Non-destructive**: Only shows available updates
- Run `npm update` manually when ready

---

## Adding Dynamic Intelligence to Applications

### Step 1: Initialize RuVector Knowledge Base

```javascript
const ruvector = require('ruvector');

// Create vector database for semantic search
const db = new ruvector.VectorDB(768); // Match your embedding dimensions

// Store knowledge with embeddings
async function addKnowledge(id, text, embedding) {
  db.insert(id, embedding);
  // Also store in .ruvector/ for persistence
}

// Query semantically similar content
const results = db.search(queryEmbedding, 10); // Top 10 matches
```

### Step 2: Integrate RuvLLM for Self-Learning

```javascript
const { RuvLLM } = require('@ruvector/ruvllm');

const llm = new RuvLLM({
  embeddingDim: 768,
  learningEnabled: true,
  // Three learning loops:
  // - Instant (<100μs): Per-request adaptation
  // - Background (Hourly): Pattern extraction
  // - Deep (Weekly): Consolidation
});

// Every query improves the system
const session = llm.newSession();
const response = await llm.querySession(session, userQuery);
```

### Step 3: Use Agentic Flow for Complex Tasks

```javascript
import { ModelRouter } from 'agentic-flow/router';
import * as reasoningbank from 'agentic-flow/reasoningbank';

// Initialize persistent learning memory
await reasoningbank.initialize();

// Store patterns and learnings
await reasoningbank.storeMemory('user_preference', data, {
  namespace: 'myapp'
});

// Route to optimal model based on task
const router = new ModelRouter();
const response = await router.chat({
  model: 'auto',
  priority: 'quality', // or 'cost', 'speed'
  messages: [{ role: 'user', content: query }]
});
```

### Step 4: Orchestrate with Claude Flow

```bash
# For complex multi-step tasks
npx claude-flow@alpha hive-mind spawn "Analyze user data and generate insights" --claude

# Query learned memories
npx claude-flow@alpha memory query "user insights" --recent
```

---

## Deployment Guide

### Deployment Platform Comparison

| Platform | Native Modules | Persistent Storage | Best For |
|----------|---------------|-------------------|----------|
| **Railway** | ✅ Full support | ✅ Volumes | Full-stack apps |
| **Docker** | ✅ Full support | ✅ Volumes | Enterprise/Private |
| **Vercel** | ⚠️ Limited | ❌ Ephemeral | Static/API only |
| **Cloudflare** | ❌ No Node.js | ❌ No | Not recommended |

### Railway Deployment (Recommended for Production)

Railway supports Node.js native modules and persistent storage:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up
```

**railway.json configuration:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

**Key Railway Features:**
- ✅ Node.js v22 support
- ✅ Native module compilation (node-gyp)
- ✅ Persistent volumes for `.swarm/` and `.ruvector/`
- ✅ Auto-scaling on traffic
- ✅ Zero-config Node.js detection

**Mount persistent volume for data:**
```bash
railway volume create --mount /app/.swarm
railway volume create --mount /app/.ruvector
```

### Docker Deployment (Enterprise/Self-Hosted)

**Dockerfile for RuvNet apps:**
```dockerfile
# Multi-stage build for native modules
FROM node:20-alpine AS builder

# Install build tools for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production image
FROM node:20-alpine

# Security: Run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Persistent data directories
VOLUME ["/app/.swarm", "/app/.ruvector"]

EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - swarm-data:/app/.swarm
      - ruvector-data:/app/.ruvector
    environment:
      - NODE_ENV=production
    restart: unless-stopped

volumes:
  swarm-data:
  ruvector-data:
```

**Run with:**
```bash
docker-compose up -d
```

### Vercel Deployment (Limited - Read-Only Use Cases)

**⚠️ Limitations:**
- Ephemeral storage (no persistent `.swarm/` or `.ruvector/`)
- Native module GLIBC compatibility issues
- 10-second function timeout (hobby), 60s (pro)
- No WebSocket support in serverless

**When Vercel Works:**
- Static sites with pre-built knowledge bases
- API routes that query external databases
- Read-only vector search (bundle data at build time)

**Workaround for read-only:**
```javascript
// Bundle knowledge at build time
import knowledgeBase from './data/knowledge.json';

// Create in-memory database from bundled data
const db = new ruvector.VectorDB(768);
knowledgeBase.forEach(item => db.insert(item.id, item.embedding));
```

**For Vercel, consider:**
- Use Vercel Postgres or Vercel KV for persistence
- Pre-compute embeddings at build time
- Use external vector DB (Pinecone, Weaviate Cloud)

---

## Private/Enterprise Deployment (Air-Gapped)

### Use Case: No External AI APIs Allowed

For companies where data cannot leave the network, use local LLMs:

### Option 1: Ollama + Qwen (Recommended)

**Install Ollama:**
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

**Run Qwen locally:**
```bash
# Choose model size based on hardware
ollama run qwen2.5:3b   # 3B params - Laptop (8GB RAM)
ollama run qwen2.5:7b   # 7B params - Workstation (16GB RAM)
ollama run qwen2.5:14b  # 14B params - Server (32GB RAM)
ollama run qwen2.5:32b  # 32B params - GPU Server (24GB VRAM)
ollama run qwen2.5:72b  # 72B params - Enterprise GPU (80GB VRAM)
```

**Integrate with Node.js:**
```javascript
// Using official ollama-js library
import ollama from 'ollama';

async function queryLocal(prompt) {
  const response = await ollama.chat({
    model: 'qwen2.5:7b',
    messages: [{ role: 'user', content: prompt }],
    stream: false
  });
  return response.message.content;
}

// With streaming
async function* queryLocalStream(prompt) {
  const response = await ollama.chat({
    model: 'qwen2.5:7b',
    messages: [{ role: 'user', content: prompt }],
    stream: true
  });
  for await (const part of response) {
    yield part.message.content;
  }
}
```

**Configure agentic-flow for local models:**
```javascript
import { ModelRouter } from 'agentic-flow/router';

const router = new ModelRouter({
  providers: {
    ollama: {
      baseUrl: 'http://localhost:11434',
      models: ['qwen2.5:7b', 'qwen2.5:14b']
    }
  },
  defaultProvider: 'ollama'
});
```

### Option 2: ONNX Local Inference (CPU-Only)

Agentic Flow includes built-in ONNX support for 100% offline inference:

```bash
# Use ONNX with Microsoft Phi-4
npx agentic-flow --model onnx:phi-4 --task "Your task here"
```

**Performance:**
- CPU: ~6 tokens/sec
- GPU: 60-300 tokens/sec

### Option 3: Docker + Ollama (Fully Containerized)

**docker-compose.yml for air-gapped deployment:**
```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]  # For GPU support

  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - swarm-data:/app/.swarm
      - ruvector-data:/app/.ruvector
    environment:
      - OLLAMA_HOST=http://ollama:11434
      - NODE_ENV=production
    depends_on:
      - ollama

volumes:
  ollama-models:
  swarm-data:
  ruvector-data:
```

**Pre-load models for air-gapped:**
```bash
# On internet-connected machine
ollama pull qwen2.5:7b
ollama pull qwen2.5:14b

# Export models
tar -czf ollama-models.tar.gz ~/.ollama/models/

# Transfer to air-gapped network and import
tar -xzf ollama-models.tar.gz -C ~/.ollama/
```

### Hardware Requirements for Local LLMs

| Model | Parameters | RAM/VRAM | Use Case |
|-------|-----------|----------|----------|
| qwen2.5:3b | 3B | 8GB RAM | Laptops, basic tasks |
| qwen2.5:7b | 7B | 16GB RAM | Workstations, general use |
| qwen2.5:14b | 14B | 32GB RAM | Servers, complex tasks |
| qwen2.5:32b | 32B | 24GB VRAM | GPU servers |
| qwen2.5:72b | 72B | 80GB VRAM | Enterprise clusters |

### Security Considerations for Enterprise

1. **Network Isolation**: Run Ollama on internal network only
2. **No Telemetry**: Ollama and Qwen don't phone home
3. **Audit Logging**: Log all queries for compliance
4. **Data Encryption**: Encrypt `.swarm/` and `.ruvector/` at rest
5. **Access Control**: Use reverse proxy with authentication

---

## Troubleshooting Deployment Issues

### Native Module Errors

**Problem:** `Error: Cannot find module '@ruvector/core'`

**Solution:** RuVector auto-falls back to WebAssembly:
```javascript
// Force WASM mode if native fails
const ruvector = require('ruvector/wasm');
```

### Vercel GLIBC Errors

**Problem:** `Error: /lib/x86_64-linux-gnu/libc.so.6: version 'GLIBC_2.28' not found`

**Solution:** Use Railway or Docker instead, or bundle pre-computed data.

### Memory Issues with Large Knowledge Bases

**Problem:** Out of memory with large vector collections

**Solution:**
```javascript
// Use streaming inserts
for await (const batch of batchedData) {
  await db.insertBatch(batch);
}

// Or use PostgreSQL backend for scale
// docker run -d ruvnet/ruvector-postgres
```

### Ollama Connection Refused

**Problem:** `ECONNREFUSED 127.0.0.1:11434`

**Solution:**
```bash
# Start Ollama server
ollama serve

# Or check if running
curl http://localhost:11434/api/tags
```

---

## Support & Contact

- **Maintainer**: ruvnet (ruv@ruv.net)
- **GitHub**: https://github.com/ruvnet
- **NPM Profile**: https://www.npmjs.com/~ruvnet
- **Issues**: https://github.com/ruvnet/ruvector/issues

### Deployment Resources

- [Railway Node.js Guide](https://docs.railway.app/guides/nodejs)
- [Ollama Documentation](https://ollama.com/docs)
- [Qwen Official Docs](https://qwen.readthedocs.io/)
- [Docker Node.js Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

*This document is the authoritative reference for all RuvNet ecosystem packages.*
*Location: ~/.claude/knowledge/RUVNET_ECOSYSTEM_COMPLETE.md*
*Last Updated: December 2025*
