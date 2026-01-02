# Core Package Tutorials for RuvNet Ecosystem

## Overview

This guide provides step-by-step tutorials for implementing the core RuvNet packages. Each tutorial includes complete working examples, common patterns, and best practices.

---

## Part 1: Ruvector - Vector Database

### Tutorial 1.1: Basic Vector Storage

```javascript
// Step 1: Install ruvector
// npm install ruvector

// Step 2: Initialize the database
const { Ruvector } = require('ruvector');

const db = new Ruvector({
  dimensions: 384,        // Match your embedding model
  metric: 'cosine',       // cosine, euclidean, or dot
  indexType: 'hnsw',      // hnsw for fast search
  persistPath: './my-vectors.db'
});

// Step 3: Insert vectors
await db.insert({
  id: 'doc-001',
  vector: [0.1, 0.2, 0.3, ...],  // 384 dimensions
  metadata: {
    title: 'Introduction to AI',
    category: 'technology',
    timestamp: Date.now()
  }
});

// Step 4: Search for similar vectors
const results = await db.search({
  vector: queryVector,
  k: 5,                   // Return top 5 matches
  filter: { category: 'technology' }
});

console.log(results);
// [{ id: 'doc-001', score: 0.95, metadata: {...} }, ...]
```

### Tutorial 1.2: Semantic Search with Embeddings

```javascript
const { Ruvector, EmbeddingService } = require('ruvector');

// Initialize with built-in embeddings
const db = new Ruvector({
  dimensions: 384,
  embedding: {
    model: 'all-MiniLM-L6-v2',  // ONNX model
    provider: 'local'           // No API needed
  }
});

// Insert documents (auto-embeds text)
await db.insertDocument({
  id: 'article-1',
  text: 'Machine learning enables computers to learn from data.',
  metadata: { source: 'tech-blog' }
});

await db.insertDocument({
  id: 'article-2',
  text: 'Neural networks mimic the human brain structure.',
  metadata: { source: 'research-paper' }
});

// Search by natural language query (auto-embeds query)
const results = await db.searchByText({
  query: 'How do AI systems learn?',
  k: 3
});

// Results ranked by semantic similarity
```

### Tutorial 1.3: HNSW Index Configuration

```javascript
const db = new Ruvector({
  dimensions: 384,
  index: {
    type: 'hnsw',
    config: {
      M: 16,              // Connections per layer (higher = better recall, more memory)
      efConstruction: 200, // Build quality (higher = better index, slower build)
      efSearch: 100       // Search quality (higher = better recall, slower search)
    }
  }
});

// Performance tuning guide:
// - Small dataset (<10K): M=8, efConstruction=100, efSearch=50
// - Medium dataset (10K-1M): M=16, efConstruction=200, efSearch=100
// - Large dataset (>1M): M=32, efConstruction=400, efSearch=200

// Check index statistics
const stats = await db.getStats();
console.log(stats);
// { vectors: 50000, dimensions: 384, indexSize: '45MB', avgSearchTime: '1.2ms' }
```

### Tutorial 1.4: Batch Operations

```javascript
// Batch insert for performance
const documents = [
  { id: '1', text: 'Document one content...', metadata: {} },
  { id: '2', text: 'Document two content...', metadata: {} },
  // ... hundreds more
];

// Insert in batches of 100
const batchSize = 100;
for (let i = 0; i < documents.length; i += batchSize) {
  const batch = documents.slice(i, i + batchSize);
  await db.insertBatch(batch);
  console.log(`Inserted ${Math.min(i + batchSize, documents.length)}/${documents.length}`);
}

// Batch search
const queries = ['query 1', 'query 2', 'query 3'];
const batchResults = await db.searchBatch({
  queries,
  k: 5
});
// Returns array of result arrays
```

---

## Part 2: Claude-Flow - Enterprise Orchestration

### Tutorial 2.1: Basic Swarm Setup

```javascript
// Step 1: Install claude-flow
// npm install claude-flow

// Step 2: Initialize a swarm
const swarm = await mcp__claude_flow__swarm_init({
  topology: 'mesh',      // mesh, hierarchical, ring, star
  maxAgents: 5,
  strategy: 'balanced'
});

console.log(`Swarm initialized: ${swarm.swarmId}`);

// Step 3: Spawn specialized agents
const researcher = await mcp__claude_flow__agent_spawn({
  type: 'researcher',
  name: 'research-agent-1',
  capabilities: ['web-search', 'document-analysis']
});

const coder = await mcp__claude_flow__agent_spawn({
  type: 'coder',
  name: 'code-agent-1',
  capabilities: ['javascript', 'python', 'testing']
});

// Step 4: Orchestrate a task
const task = await mcp__claude_flow__task_orchestrate({
  task: 'Research and implement a REST API for user management',
  strategy: 'parallel',
  priority: 'high'
});
```

### Tutorial 2.2: Memory Persistence

```javascript
// Store data across sessions
await mcp__claude_flow__memory_usage({
  action: 'store',
  key: 'project/config',
  value: JSON.stringify({
    database: 'postgresql',
    port: 5432,
    features: ['auth', 'api', 'webhooks']
  }),
  namespace: 'my-project',
  ttl: 86400 * 30  // 30 days
});

// Retrieve stored data
const config = await mcp__claude_flow__memory_usage({
  action: 'retrieve',
  key: 'project/config',
  namespace: 'my-project'
});

// Search memory with patterns
const results = await mcp__claude_flow__memory_search({
  pattern: 'project/*',
  namespace: 'my-project',
  limit: 10
});

// List all keys in namespace
const keys = await mcp__claude_flow__memory_usage({
  action: 'list',
  namespace: 'my-project'
});
```

### Tutorial 2.3: Neural Pattern Training

```javascript
// Train coordination patterns
const training = await mcp__claude_flow__neural_train({
  pattern_type: 'coordination',
  training_data: JSON.stringify({
    scenarios: [
      { input: 'api-task', optimal_topology: 'star', agents: ['coder', 'tester'] },
      { input: 'research-task', optimal_topology: 'mesh', agents: ['researcher', 'analyst'] },
      { input: 'complex-task', optimal_topology: 'hierarchical', agents: ['coordinator', 'specialist'] }
    ]
  }),
  epochs: 50
});

// Analyze patterns
const patterns = await mcp__claude_flow__neural_patterns({
  action: 'analyze',
  operation: 'api-development',
  outcome: 'success'
});

// Predict optimal configuration
const prediction = await mcp__claude_flow__neural_predict({
  modelId: 'coordination-model',
  input: 'Build microservices architecture'
});
```

### Tutorial 2.4: GitHub Integration

```javascript
// Analyze repository
const analysis = await mcp__claude_flow__github_repo_analyze({
  repo: 'owner/repo-name',
  analysis_type: 'code_quality'  // or 'performance', 'security'
});

// Manage pull requests
await mcp__claude_flow__github_pr_manage({
  repo: 'owner/repo-name',
  action: 'review',  // or 'merge', 'close'
  pr_number: 42
});

// Automated code review
await mcp__claude_flow__github_code_review({
  repo: 'owner/repo-name',
  pr: 42
});

// Track issues
await mcp__claude_flow__github_issue_track({
  repo: 'owner/repo-name',
  action: 'triage'
});
```

---

## Part 3: Agentic-Flow - Multi-Agent Systems

### Tutorial 3.1: Agent Booster Configuration

```javascript
const { AgentBooster } = require('agentic-flow');

// Initialize with multi-model routing
const booster = new AgentBooster({
  models: {
    primary: 'claude-3-opus',
    fast: 'claude-3-haiku',
    fallback: 'gpt-4-turbo'
  },
  routing: {
    complexity_threshold: 0.7,  // Route complex tasks to primary
    cost_optimization: true,
    latency_target: 2000        // ms
  }
});

// Process with automatic model selection
const result = await booster.process({
  task: 'Analyze this codebase and suggest improvements',
  context: codebaseContent,
  priority: 'quality'  // or 'speed', 'cost'
});

console.log(result.model_used);  // 'claude-3-opus' (auto-selected)
```

### Tutorial 3.2: Consensus Mechanisms

```javascript
const { ConsensusBuilder } = require('agentic-flow/consensus');

// Byzantine Fault Tolerant consensus
const bft = new ConsensusBuilder({
  type: 'byzantine',
  threshold: 0.67,  // 2/3 agreement required
  timeout: 5000
});

// Add participants
bft.addParticipant('agent-1', { weight: 1.0, trusted: true });
bft.addParticipant('agent-2', { weight: 0.8, trusted: true });
bft.addParticipant('agent-3', { weight: 0.6, trusted: false });

// Propose and vote
const proposal = await bft.propose({
  action: 'deploy',
  version: '2.0.0'
});

// Collect votes
await bft.vote('agent-1', { approve: true, signature: '...' });
await bft.vote('agent-2', { approve: true, signature: '...' });
await bft.vote('agent-3', { approve: false, signature: '...' });

// Reach consensus
const result = await bft.finalize();
// { approved: true, votes: { for: 2, against: 1 }, confidence: 0.9 }
```

### Tutorial 3.3: Reinforcement Learning Agents

```javascript
const { RLAgent, DecisionTransformer } = require('agentic-flow/learning');

// Create Decision Transformer agent
const agent = new RLAgent({
  algorithm: 'decision-transformer',
  config: {
    contextLength: 20,
    embeddingDim: 128,
    numHeads: 4,
    numLayers: 3
  }
});

// Train from trajectories
await agent.train({
  trajectories: [
    {
      states: [s1, s2, s3],
      actions: [a1, a2, a3],
      rewards: [r1, r2, r3],
      returns: [R1, R2, R3]  // Return-to-go
    }
  ],
  epochs: 100,
  targetReturn: 100
});

// Get action conditioned on desired return
const action = await agent.act({
  state: currentState,
  targetReturn: 50  // Desired cumulative reward
});
```

### Tutorial 3.4: Swarm Topologies

```javascript
const { SwarmManager } = require('agentic-flow/swarm');

// Hierarchical topology (tree structure)
const hierarchical = new SwarmManager({
  topology: 'hierarchical',
  config: {
    maxDepth: 3,
    branchFactor: 4,
    coordinatorAtRoot: true
  }
});

// Mesh topology (peer-to-peer)
const mesh = new SwarmManager({
  topology: 'mesh',
  config: {
    maxConnections: 8,
    gossipInterval: 1000,
    redundancy: 2
  }
});

// Ring topology (circular)
const ring = new SwarmManager({
  topology: 'ring',
  config: {
    bidirectional: true,
    tokenPassing: true
  }
});

// Star topology (centralized)
const star = new SwarmManager({
  topology: 'star',
  config: {
    hubFailover: true,
    loadBalancing: 'round-robin'
  }
});

// Adaptive topology (auto-switches)
const adaptive = new SwarmManager({
  topology: 'adaptive',
  config: {
    metrics: ['latency', 'throughput', 'error_rate'],
    switchThreshold: 0.8,
    evaluationInterval: 5000
  }
});
```

---

## Part 4: RuvLLM - LLM Orchestration

### Tutorial 4.1: Multi-Provider Setup

```javascript
const { RuvLLM } = require('@ruvector/ruvllm');

// Initialize with multiple providers
const llm = new RuvLLM({
  providers: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
    },
    local: {
      endpoint: 'http://localhost:11434',
      models: ['llama2', 'mistral']
    }
  },
  defaultProvider: 'anthropic',
  defaultModel: 'claude-3-sonnet'
});

// Simple completion
const response = await llm.complete({
  prompt: 'Explain quantum computing in simple terms.',
  maxTokens: 500
});

// With specific model
const opus = await llm.complete({
  prompt: 'Complex reasoning task...',
  model: 'claude-3-opus',
  provider: 'anthropic'
});
```

### Tutorial 4.2: Streaming Responses

```javascript
// Stream tokens as they arrive
const stream = await llm.stream({
  prompt: 'Write a detailed analysis of...',
  maxTokens: 2000
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);

  if (chunk.done) {
    console.log('\n--- Complete ---');
    console.log('Total tokens:', chunk.usage.total_tokens);
  }
}

// With callback
await llm.stream({
  prompt: 'Generate code for...',
  onToken: (token) => console.log(token),
  onComplete: (result) => console.log('Done:', result.usage)
});
```

### Tutorial 4.3: Function Calling

```javascript
// Define tools
const tools = [
  {
    name: 'search_database',
    description: 'Search the product database',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results' }
      },
      required: ['query']
    }
  },
  {
    name: 'send_email',
    description: 'Send an email to a customer',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['to', 'subject', 'body']
    }
  }
];

// LLM decides which tool to use
const response = await llm.complete({
  prompt: 'Find all products under $50 and email the list to customer@example.com',
  tools,
  toolChoice: 'auto'
});

// Handle tool calls
for (const call of response.toolCalls) {
  if (call.name === 'search_database') {
    const results = await searchDatabase(call.arguments);
    // Continue conversation with results...
  }
}
```

### Tutorial 4.4: Caching and Rate Limiting

```javascript
const llm = new RuvLLM({
  providers: { /* ... */ },

  // Enable semantic caching
  cache: {
    enabled: true,
    storage: 'redis',  // or 'memory', 'sqlite'
    ttl: 3600,         // 1 hour
    similarityThreshold: 0.95  // Cache hit if 95% similar
  },

  // Rate limiting
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000,
    strategy: 'sliding-window'
  },

  // Automatic retries
  retry: {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000
  }
});

// Check cache stats
const stats = await llm.getCacheStats();
console.log(stats);
// { hits: 150, misses: 50, hitRate: 0.75, savedTokens: 45000 }
```

---

## Part 5: Agentic-Synth - Agent Synthesis

### Tutorial 5.1: Creating Custom Agents

```javascript
const { AgentSynth } = require('@ruvector/agentic-synth');

// Define agent specification
const agentSpec = {
  name: 'financial-analyst',
  description: 'Analyzes financial data and provides investment insights',

  capabilities: [
    'data-analysis',
    'report-generation',
    'risk-assessment'
  ],

  tools: [
    { name: 'fetch_stock_data', handler: fetchStockData },
    { name: 'calculate_metrics', handler: calculateMetrics },
    { name: 'generate_chart', handler: generateChart }
  ],

  personality: {
    tone: 'professional',
    verbosity: 'detailed',
    riskTolerance: 'conservative'
  }
};

// Synthesize the agent
const synth = new AgentSynth();
const agent = await synth.create(agentSpec);

// Use the agent
const analysis = await agent.run({
  task: 'Analyze AAPL stock performance over the last quarter',
  context: { portfolio: userPortfolio }
});
```

### Tutorial 5.2: Agent Composition

```javascript
// Compose multiple agents into a team
const team = await synth.compose({
  name: 'investment-team',
  agents: [
    { spec: financialAnalystSpec, count: 2 },
    { spec: riskManagerSpec, count: 1 },
    { spec: reportWriterSpec, count: 1 }
  ],

  coordination: {
    type: 'hierarchical',
    leader: 'risk-manager',
    communication: 'structured'
  },

  workflow: {
    steps: [
      { agent: 'financial-analyst', action: 'analyze-data' },
      { agent: 'risk-manager', action: 'assess-risk' },
      { agent: 'report-writer', action: 'compile-report' }
    ]
  }
});

// Execute team workflow
const result = await team.execute({
  objective: 'Quarterly portfolio review',
  data: portfolioData
});
```

---

## Part 6: Integration Patterns

### Tutorial 6.1: Full Stack Integration

```javascript
// Complete RuvNet stack integration
const { Ruvector } = require('ruvector');
const { RuvLLM } = require('@ruvector/ruvllm');
const { AgentBooster } = require('agentic-flow');

// Initialize all components
const vectorDb = new Ruvector({ dimensions: 384 });
const llm = new RuvLLM({ providers: { anthropic: { apiKey: '...' } } });
const booster = new AgentBooster({ models: { primary: 'claude-3-opus' } });

// RAG Pipeline
async function ragQuery(question) {
  // 1. Search for relevant context
  const context = await vectorDb.searchByText({
    query: question,
    k: 5
  });

  // 2. Build prompt with context
  const prompt = `
    Context:
    ${context.map(r => r.metadata.text).join('\n\n')}

    Question: ${question}

    Answer based on the context provided:
  `;

  // 3. Generate response with boosted routing
  const response = await booster.process({
    task: prompt,
    priority: 'quality'
  });

  return {
    answer: response.content,
    sources: context.map(r => r.metadata.source),
    model: response.model_used
  };
}
```

### Tutorial 6.2: Event-Driven Architecture

```javascript
const { EventEmitter } = require('events');

class RuvNetOrchestrator extends EventEmitter {
  constructor(config) {
    super();
    this.vectorDb = new Ruvector(config.vector);
    this.llm = new RuvLLM(config.llm);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.on('document:added', async (doc) => {
      await this.vectorDb.insertDocument(doc);
      this.emit('document:indexed', doc.id);
    });

    this.on('query:received', async (query) => {
      const results = await this.processQuery(query);
      this.emit('query:complete', results);
    });

    this.on('error', (error) => {
      console.error('Orchestrator error:', error);
      // Implement recovery logic
    });
  }

  async processQuery(query) {
    const start = Date.now();
    const context = await this.vectorDb.searchByText({ query, k: 5 });
    const response = await this.llm.complete({ prompt: query, context });

    return {
      response,
      latency: Date.now() - start,
      contextUsed: context.length
    };
  }
}
```

---

## Quick Reference

### Package Installation

```bash
# Core packages
npm install ruvector
npm install claude-flow
npm install agentic-flow
npm install @ruvector/ruvllm
npm install @ruvector/agentic-synth

# All at once
npm install ruvector claude-flow agentic-flow @ruvector/ruvllm @ruvector/agentic-synth
```

### Environment Variables

```bash
# API Keys
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."

# Database
export RUVECTOR_DB_PATH="./vectors.db"
export POSTGRES_CONNECTION="postgresql://localhost:5435/postgres"

# Claude Flow
export CLAUDE_FLOW_MEMORY_PATH="./.swarm/memory.db"
```

### Common Patterns Cheat Sheet

| Task | Package | Method |
|------|---------|--------|
| Store vectors | ruvector | `db.insert()` |
| Semantic search | ruvector | `db.searchByText()` |
| Initialize swarm | claude-flow | `swarm_init()` |
| Spawn agent | claude-flow | `agent_spawn()` |
| Store memory | claude-flow | `memory_usage({ action: 'store' })` |
| LLM completion | ruvllm | `llm.complete()` |
| Create agent | agentic-synth | `synth.create()` |
| Multi-model route | agentic-flow | `booster.process()` |

