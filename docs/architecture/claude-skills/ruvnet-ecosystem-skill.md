Updated: 2025-12-29 02:26:43 EST | Version 1.0.1
Created: 2025-12-19 10:31:00 EST

# RuvNet Ecosystem Skill

## Triggers
- "ruvnet", "ruvector", "vector database", "ruvllm", "agentic-flow", "claude-flow"
- "ai orchestration", "agent swarm", "neural patterns", "multi-agent"

## Overview

RuvNet is a comprehensive AI orchestration ecosystem with high-performance vector databases, self-learning LLM orchestration, and enterprise agent coordination.

---

## Quick Install

### One-Line Global Setup
```bash
curl -sL https://raw.githubusercontent.com/stuinfla/ruvnet-claude-integration/main/install.sh | bash
```

### NPM Packages (Always Try Latest First)
```bash
# Install all packages - try latest versions
npm install ruvector@latest @ruvector/ruvllm@latest agentic-flow@latest claude-flow@latest

# Verify ruvector loads
node -e "require('ruvector')" && echo "ruvector loaded successfully"
```

---

## Package Reference

| Package | Version | Purpose |
|---------|---------|---------|
| `ruvector` | @latest | Vector DB, HNSW indexing, 61μs latency |
| `@ruvector/ruvllm` | 0.2.3 | Self-learning LLM, TRM reasoning, SONA |
| `agentic-flow` | 1.10.2 | 150+ agents, 213 MCP tools, ReasoningBank |
| `claude-flow` | 2.7.47 | Enterprise orchestration, AgentDB |

---

## API Quick Reference

### RuVector - Vector Database
```javascript
const ruvector = require('ruvector');

// Vector operations
const db = new ruvector.VectorDB(128); // 128 dimensions
db.insert('doc1', embedding);
const results = db.search(queryEmbedding, 10); // k=10

// Graph queries (Cypher)
db.execute("CREATE (a:Person {name: 'Alice'})-[:KNOWS]->(b:Person)");
db.execute("MATCH (p:Person) RETURN p.name");
```

### RuvLLM - LLM Orchestration
```javascript
const { RuvLLM, Config } = require('@ruvector/ruvllm');

const llm = new RuvLLM({
  embeddingDim: 768,
  routerHiddenDim: 128,
  learningEnabled: true
});

const session = llm.newSession();
const response = await llm.querySession(session, "What is ML?");
console.log(response.text);
console.log(response.routingInfo.model);
```

### Agentic Flow - Agent Platform
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
await reasoningbank.storeMemory('key', 'value', { namespace: 'api' });
```

### Claude Flow - Enterprise
```bash
# Initialize project
npx claude-flow@alpha init --force

# Spawn hive-mind agent
npx claude-flow@alpha hive-mind spawn "Implement auth" --claude

# Query memory
npx claude-flow@alpha memory query "auth" --recent
```

---

## Key Features

### RuVector Performance
- HNSW Search: 61μs p50 latency, 16,400 QPS
- Cosine Distance: 143ns, 7M ops/sec
- 39 attention mechanisms (Flash, Linear, Graph, Hyperbolic)
- SONA: Self-Optimizing Neural Architecture

### RuvLLM Learning Loops
1. **Instant Loop** (<100μs): Per-request MicroLoRA adaptation
2. **Background Loop** (Hourly): K-means++ pattern extraction
3. **Deep Loop** (Weekly): EWC++ consolidation

### Agentic Flow Agents
- Development: coder, reviewer, tester, planner, researcher
- Swarm: hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
- GitHub: pr-manager, code-review-swarm, issue-tracker, release-manager

### Claude Flow Enterprise
- 84.8% SWE-Bench solve rate
- 32.3% token reduction
- 64 specialized agents
- AgentDB v1.3.9: 96x-164x faster vector search

---

## Common Issues & Solutions

### Issue: ruvector installation
```bash
# WORKS - use latest:
npm install ruvector

# Verify it loads:
node -e "require('ruvector')" && echo "OK"
```

### Issue: Package not found
```bash
# Wrong name:
npm install ruvllm           # FAILS

# Correct (scoped):
npm install @ruvector/ruvllm # WORKS
```

### Issue: Verify installation
```bash
node -e "console.log('ruvector:', typeof require('ruvector'))"
node -e "console.log('ruvllm:', typeof require('@ruvector/ruvllm'))"
node -e "console.log('agentic-flow:', typeof require('agentic-flow'))"
```

---

## GitHub Repositories

| Package | URL |
|---------|-----|
| RuVector | https://github.com/ruvnet/ruvector |
| Agentic Flow | https://github.com/ruvnet/agentic-flow |
| Claude Flow | https://github.com/ruvnet/claude-flow |
| Integration | https://github.com/stuinfla/ruvnet-claude-integration |

---

## When to Use

- **ruvector**: Semantic search, RAG, embeddings, graph queries
- **@ruvector/ruvllm**: Self-learning LLMs, routing, SONA optimization
- **agentic-flow**: Multi-agent workflows, 150+ specialized agents
- **claude-flow**: Enterprise coordination, hive-mind, AgentDB

---

**Version**: 1.0.0 | **Lines**: ~180 | **Tokens**: ~2,500
