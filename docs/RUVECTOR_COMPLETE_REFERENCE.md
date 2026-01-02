# RuVector Complete Reference v0.1.88

Updated: 2026-01-02 09:55:00 EST | Version 1.0.0
Created: 2026-01-02 09:55:00 EST

> **The definitive guide to RuVector** - A high-performance vector database with HNSW indexing, neural attention mechanisms, GNN layers, and self-learning capabilities.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [VectorDB API](#vectordb-api)
5. [HNSW Indexing](#hnsw-indexing)
6. [Embedding Generation](#embedding-generation)
7. [Query Methods](#query-methods)
8. [Persistence](#persistence)
9. [Attention Mechanisms](#attention-mechanisms)
10. [GNN Layers](#gnn-layers)
11. [SONA Architecture](#sona-architecture)
12. [Learning Engine](#learning-engine)
13. [Intelligence Engine](#intelligence-engine)
14. [Neural Embeddings](#neural-embeddings)
15. [CLI Reference](#cli-reference)
16. [Integration Patterns](#integration-patterns)
17. [Performance Tuning](#performance-tuning)
18. [Error Handling](#error-handling)
19. [Troubleshooting](#troubleshooting)
20. [Use Cases](#use-cases)

---

## Quick Start

### 10-Minute Tutorial

```javascript
// 1. Import RuVector
const { VectorDB } = require('ruvector');

// 2. Create database with HNSW index
const db = new VectorDB({
  dimensions: 384,
  metric: 'cosine',
  hnsw: { m: 16, efConstruction: 100 }
});

// 3. Add vectors with metadata
await db.add([
  { id: 'doc1', vector: embeddings[0], metadata: { title: 'Introduction' } },
  { id: 'doc2', vector: embeddings[1], metadata: { title: 'Getting Started' } }
]);

// 4. Search for similar vectors
const results = await db.search(queryVector, { k: 10 });
console.log(results);
// [{ id: 'doc1', score: 0.95, metadata: {...} }, ...]

// 5. Save to disk
await db.save('./my-database.ruvector');
```

**That's it!** You now have a working vector database with semantic search.

---

## Installation

### NPM Installation

```bash
# Standard installation
npm install ruvector

# With all optional dependencies
npm install ruvector @ruvector/ruvllm @ruvector/agentic-synth
```

### Verify Installation

```javascript
const ruvector = require('ruvector');
console.log(ruvector.version); // "0.1.88"
console.log(ruvector.available); // true (embeddings available)
```

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 18.x | 20.x+ |
| RAM | 512MB | 4GB+ |
| Disk | 100MB | 1GB+ |
| CPU | Any | AVX2/NEON |

---

## Core Concepts

### What is a Vector Database?

A vector database stores high-dimensional vectors (embeddings) and enables **similarity search** - finding vectors closest to a query vector. This powers:

- **Semantic Search**: Find documents by meaning, not keywords
- **Recommendation Systems**: Find similar products/content
- **RAG (Retrieval-Augmented Generation)**: Provide context to LLMs
- **Anomaly Detection**: Find outliers in data
- **Image/Audio Search**: Find similar media

### Key Terms

| Term | Definition |
|------|------------|
| **Vector/Embedding** | Array of floats representing semantic meaning (e.g., 384 dimensions) |
| **Dimension** | Number of elements in a vector (384, 768, 1536 common) |
| **Distance Metric** | How similarity is measured (cosine, L2, inner product) |
| **HNSW Index** | Hierarchical Navigable Small World - fast approximate search |
| **k-NN Search** | Find k nearest neighbors to query vector |
| **Recall** | Percentage of true nearest neighbors found |

### Distance Metrics

```javascript
// Cosine Distance - Best for text embeddings (normalized)
// Range: 0 (identical) to 2 (opposite)
const db = new VectorDB({ metric: 'cosine' });

// L2 (Euclidean) Distance - General purpose
// Range: 0 (identical) to infinity
const db = new VectorDB({ metric: 'l2' });

// Inner Product - For already-normalized vectors
// Higher is more similar
const db = new VectorDB({ metric: 'ip' });
```

**When to use which:**
- **Cosine**: Text embeddings (OpenAI, Sentence Transformers)
- **L2**: Image embeddings, general purpose
- **Inner Product**: When vectors are pre-normalized

---

## VectorDB API

### Constructor Options

```javascript
const { VectorDB } = require('ruvector');

const db = new VectorDB({
  // Required
  dimensions: 384,              // Vector dimension (must match embeddings)

  // Optional
  metric: 'cosine',             // 'cosine' | 'l2' | 'ip'

  // HNSW Index Configuration
  hnsw: {
    m: 16,                      // Max connections per node (4-64)
    efConstruction: 100,        // Build-time search quality (16-500)
    efSearch: 50                // Query-time search quality (10-1000)
  },

  // Persistence
  autosave: false,              // Auto-save on changes
  savePath: './db.ruvector',    // Auto-save location

  // Memory Management
  maxVectors: 1000000,          // Max vectors (for memory planning)
  quantization: null            // 'binary' | 'scalar' | null
});
```

### Adding Vectors

```javascript
// Single vector
await db.add({
  id: 'unique-id',
  vector: [0.1, 0.2, ...],      // Float array matching dimensions
  metadata: { title: 'Doc', category: 'tech' }
});

// Batch add (more efficient)
await db.add([
  { id: 'id1', vector: vec1, metadata: { ... } },
  { id: 'id2', vector: vec2, metadata: { ... } },
  // ... up to 10,000 per batch
]);

// With embeddings generation (if available)
await db.addWithEmbedding({
  id: 'doc1',
  text: 'This text will be embedded automatically',
  metadata: { source: 'manual' }
});
```

### Searching Vectors

```javascript
// Basic search - returns k nearest neighbors
const results = await db.search(queryVector, { k: 10 });

// With metadata filter
const results = await db.search(queryVector, {
  k: 10,
  filter: { category: 'tech' }
});

// With score threshold
const results = await db.search(queryVector, {
  k: 100,
  threshold: 0.7  // Only return if similarity > 0.7
});

// Search result format
[
  { id: 'doc1', score: 0.95, metadata: { title: 'Best Match' } },
  { id: 'doc2', score: 0.89, metadata: { title: 'Second Best' } },
  // ...
]
```

### Updating Vectors

```javascript
// Update vector only
await db.update('id1', { vector: newVector });

// Update metadata only
await db.update('id1', { metadata: { title: 'New Title' } });

// Update both
await db.update('id1', {
  vector: newVector,
  metadata: { title: 'New Title', updated: Date.now() }
});

// Upsert (insert or update)
await db.upsert({
  id: 'maybe-exists',
  vector: vec,
  metadata: { ... }
});
```

### Deleting Vectors

```javascript
// Delete single
await db.delete('id1');

// Delete multiple
await db.delete(['id1', 'id2', 'id3']);

// Delete by filter
await db.deleteWhere({ category: 'outdated' });

// Clear all
await db.clear();
```

### Getting Vectors

```javascript
// Get by ID
const item = await db.get('id1');
// { id: 'id1', vector: [...], metadata: {...} }

// Get multiple
const items = await db.getMany(['id1', 'id2']);

// Check existence
const exists = await db.has('id1'); // true/false

// Get count
const count = await db.count(); // number

// Get all IDs
const ids = await db.ids(); // ['id1', 'id2', ...]
```

---

## HNSW Indexing

### What is HNSW?

**Hierarchical Navigable Small World** is a graph-based algorithm for approximate nearest neighbor search. It builds a multi-layer graph where:

- Top layers have few, long-range connections (fast navigation)
- Bottom layers have many, short-range connections (precise search)

### Configuration Guide

```javascript
const db = new VectorDB({
  dimensions: 384,
  hnsw: {
    m: 16,              // Connections per node
    efConstruction: 100, // Build quality
    efSearch: 50         // Query quality
  }
});
```

**Parameter Impact:**

| Parameter | Increase | Decrease |
|-----------|----------|----------|
| `m` | Better recall, more memory | Faster build, less memory |
| `efConstruction` | Better index, slower build | Faster build, worse index |
| `efSearch` | Better recall, slower query | Faster query, worse recall |

### Recommended Settings

```javascript
// High Recall (>99%) - Accuracy critical
const highRecall = {
  m: 32,
  efConstruction: 200,
  efSearch: 200
};

// Balanced (95-99%) - Most use cases
const balanced = {
  m: 16,
  efConstruction: 100,
  efSearch: 64
};

// Fast Search (<95%) - Speed critical
const fast = {
  m: 8,
  efConstruction: 50,
  efSearch: 20
};

// Large Scale (10M+ vectors)
const largeScale = {
  m: 24,
  efConstruction: 150,
  efSearch: 100
};
```

### Dynamic efSearch

```javascript
// Adjust at runtime based on needs
db.setEfSearch(200);  // High quality
const results = await db.search(query, { k: 10 });

db.setEfSearch(20);   // Fast mode
const quickResults = await db.search(query, { k: 10 });
```

### Memory Estimation

```
Memory = vectors × dimensions × 4 bytes + vectors × m × 8 bytes × 2

Example: 1M vectors, 384 dimensions, m=16
= 1,000,000 × 384 × 4 + 1,000,000 × 16 × 8 × 2
= 1,536 MB + 256 MB
= ~1.8 GB
```

---

## Embedding Generation

### Built-in ONNX Embeddings

RuVector includes ONNX WASM embeddings for zero-dependency embedding generation:

```javascript
const { generateEmbedding, batchEmbeddings } = require('ruvector');

// Single text
const embedding = await generateEmbedding('Hello world');
// Float32Array(384) [0.023, -0.156, ...]

// Batch processing (more efficient)
const embeddings = await batchEmbeddings([
  'First document',
  'Second document',
  'Third document'
]);
// [Float32Array(384), Float32Array(384), Float32Array(384)]
```

### Model Information

| Model | Dimensions | Speed | Quality |
|-------|------------|-------|---------|
| all-MiniLM-L6-v2 (default) | 384 | Fast | Good |
| bge-small-en-v1.5 | 384 | Fast | Better |
| nomic-embed-text-v1 | 768 | Medium | Best |

### Check Availability

```javascript
const { embeddingsAvailable, getModelInfo } = require('ruvector');

if (embeddingsAvailable()) {
  const info = getModelInfo();
  console.log(info);
  // { model: 'all-MiniLM-L6-v2', dimensions: 384, maxTokens: 512 }
}
```

### Using External Embeddings

```javascript
// OpenAI
const { OpenAI } = require('openai');
const openai = new OpenAI();

async function getOpenAIEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}

// Use with RuVector
const embedding = await getOpenAIEmbedding('Hello world');
await db.add({ id: 'doc1', vector: embedding, metadata: {} });
```

---

## Query Methods

### Basic Similarity Search

```javascript
// Find 10 most similar vectors
const results = await db.search(queryVector, { k: 10 });
```

### Filtered Search

```javascript
// Filter by metadata before vector search
const results = await db.search(queryVector, {
  k: 10,
  filter: {
    category: 'technology',
    date: { $gte: '2024-01-01' }
  }
});
```

**Filter Operators:**

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equals (default) | `{ status: 'active' }` |
| `$ne` | Not equals | `{ status: { $ne: 'deleted' } }` |
| `$gt` | Greater than | `{ score: { $gt: 0.5 } }` |
| `$gte` | Greater or equal | `{ date: { $gte: '2024-01-01' } }` |
| `$lt` | Less than | `{ price: { $lt: 100 } }` |
| `$lte` | Less or equal | `{ count: { $lte: 10 } }` |
| `$in` | In array | `{ tag: { $in: ['ai', 'ml'] } }` |
| `$nin` | Not in array | `{ status: { $nin: ['deleted', 'archived'] } }` |

### Threshold Search

```javascript
// Only return results above similarity threshold
const results = await db.search(queryVector, {
  k: 100,
  threshold: 0.7  // Cosine similarity > 0.7
});
```

### Range Search

```javascript
// Find all vectors within distance
const results = await db.searchRange(queryVector, {
  maxDistance: 0.3,  // Cosine distance < 0.3
  limit: 1000
});
```

### Hybrid Search

Combine vector similarity with keyword/metadata search:

```javascript
const results = await db.hybridSearch({
  vector: queryVector,
  text: 'machine learning',
  textField: 'content',
  alpha: 0.7  // 70% vector, 30% text
});
```

---

## Persistence

### Manual Save/Load

```javascript
// Save to file
await db.save('./my-database.ruvector');

// Load from file
const db = await VectorDB.load('./my-database.ruvector');

// Export to JSON (for inspection/migration)
await db.exportJSON('./export.json');

// Import from JSON
await db.importJSON('./export.json');
```

### Auto-Persistence

```javascript
const db = new VectorDB({
  dimensions: 384,
  autosave: true,
  savePath: './auto-saved.ruvector',
  saveInterval: 60000  // Save every 60 seconds
});
```

### Write-Ahead Log (WAL)

```javascript
const db = new VectorDB({
  dimensions: 384,
  wal: {
    enabled: true,
    path: './wal',
    flushInterval: 1000  // Flush every second
  }
});

// Recover from WAL after crash
const db = await VectorDB.recover('./wal');
```

### Snapshots

```javascript
// Create snapshot
const snapshotId = await db.createSnapshot();

// List snapshots
const snapshots = await db.listSnapshots();

// Restore from snapshot
await db.restoreSnapshot(snapshotId);
```

---

## Attention Mechanisms

RuVector includes 10+ neural attention mechanisms for advanced processing:

### Available Mechanisms

```javascript
const { attention } = require('ruvector');

// Multi-Head Attention
const output = attention.multiHead(query, keys, values, { numHeads: 8 });

// Flash Attention (memory-efficient)
const output = attention.flash(query, keys, values, { blockSize: 64 });

// Linear Attention (O(n) complexity)
const output = attention.linear(query, keys, values);

// Hyperbolic Attention (for hierarchical data)
const output = attention.hyperbolic(query, keys, values, { curvature: -1 });

// Sparse Attention
const output = attention.sparse(query, keys, values, { pattern: 'local' });

// Graph Attention (GAT-style)
const output = attention.graph(query, keys, values, { edgeIndex });

// Mixture of Experts
const output = attention.moe(query, keys, values, { numExperts: 4 });

// Rotary Position Embedding (RoPE)
const output = attention.rope(query, keys, values, { maxSeqLen: 2048 });
```

### When to Use Which

| Mechanism | Best For | Complexity |
|-----------|----------|------------|
| Multi-Head | General transformers | O(n²) |
| Flash | Long sequences, memory-constrained | O(n²) memory O(n) |
| Linear | Very long sequences | O(n) |
| Hyperbolic | Hierarchies, taxonomies | O(n²) |
| Sparse | Local patterns, efficiency | O(n√n) |
| Graph | Graph-structured data | O(E) |
| MoE | Multi-domain tasks | O(n²/k) |

---

## GNN Layers

Graph Neural Network layers for relational data:

### RuvectorLayer

```javascript
const { gnn } = require('ruvector');

// Create GNN layer
const layer = new gnn.RuvectorLayer({
  inputDim: 384,
  outputDim: 128,
  aggregation: 'mean'  // 'mean' | 'max' | 'sum'
});

// Forward pass
const nodeFeatures = await layer.forward(features, edgeIndex);
```

### Differentiable Search

```javascript
// Search that maintains gradients
const { differentiableSearch } = require('ruvector');

const results = differentiableSearch({
  query: queryVector,
  database: db,
  k: 10,
  temperature: 0.1  // Softmax temperature
});
// Results can be used in training loops
```

### Hierarchical Forward

```javascript
// Multi-level GNN processing
const output = await gnn.hierarchicalForward({
  features: nodeFeatures,
  edgeIndex: edges,
  levels: [
    { aggregation: 'mean', outputDim: 256 },
    { aggregation: 'max', outputDim: 128 },
    { aggregation: 'attention', outputDim: 64 }
  ]
});
```

---

## SONA Architecture

**Self-Optimizing Neural Architecture** - Adaptive learning system:

### Components

```javascript
const { sona } = require('ruvector');

// Initialize SONA
const agent = new sona.Agent({
  // Micro-LoRA for fast adaptation
  microLora: {
    rank: 4,
    alpha: 16,
    targetModules: ['query', 'key', 'value']
  },

  // Base-LoRA for stable learning
  baseLora: {
    rank: 16,
    alpha: 32
  },

  // Trajectory tracking
  trajectoryBuffer: {
    maxSize: 10000,
    prioritized: true
  }
});
```

### Trajectory Tracking

```javascript
// Record decision trajectory
agent.recordTrajectory({
  state: currentState,
  action: actionTaken,
  reward: rewardReceived,
  nextState: resultingState
});

// Learn from trajectories
await agent.learn({
  batchSize: 32,
  epochs: 10
});
```

---

## Learning Engine

9 reinforcement learning algorithms for self-improving systems:

### Available Algorithms

```javascript
const { learning } = require('ruvector');

// Q-Learning
const qLearner = new learning.QLearning({
  stateSize: 384,
  actionSize: 10,
  learningRate: 0.1,
  discountFactor: 0.99
});

// SARSA
const sarsa = new learning.SARSA({ ... });

// Actor-Critic
const ac = new learning.ActorCritic({
  actorLr: 0.001,
  criticLr: 0.005
});

// PPO (Proximal Policy Optimization)
const ppo = new learning.PPO({
  clipRatio: 0.2,
  entropyCoef: 0.01
});

// SAC (Soft Actor-Critic)
const sac = new learning.SAC({
  alpha: 0.2,  // Temperature
  autoAlpha: true
});

// Decision Transformer
const dt = new learning.DecisionTransformer({
  contextLength: 20,
  nHeads: 8,
  nLayers: 6
});

// TD3 (Twin Delayed DDPG)
const td3 = new learning.TD3({ ... });

// DQN (Deep Q-Network)
const dqn = new learning.DQN({ ... });

// A2C (Advantage Actor-Critic)
const a2c = new learning.A2C({ ... });
```

### Training Loop

```javascript
// Example PPO training
const ppo = new learning.PPO({
  stateSize: 384,
  actionSize: 10
});

for (let episode = 0; episode < 1000; episode++) {
  const state = env.reset();
  let done = false;

  while (!done) {
    const action = ppo.selectAction(state);
    const { nextState, reward, done: isDone } = env.step(action);

    ppo.remember(state, action, reward, nextState, isDone);
    state = nextState;
    done = isDone;
  }

  // Update policy
  await ppo.update();
}
```

---

## Intelligence Engine

Full-stack intelligence combining memory, routing, and learning:

```javascript
const { IntelligenceEngine } = require('ruvector');

const engine = new IntelligenceEngine({
  // Memory component
  memory: {
    vectorDB: db,
    shortTermCapacity: 100,
    longTermThreshold: 0.7
  },

  // Router component
  router: {
    agents: ['gpt-4', 'claude-3', 'local-llm'],
    strategy: 'adaptive'  // 'cost' | 'quality' | 'latency' | 'adaptive'
  },

  // Learning component
  learner: {
    algorithm: 'ppo',
    rewardShaping: true
  }
});

// Process query with full intelligence stack
const response = await engine.process({
  query: 'What is machine learning?',
  context: { userId: 'user123' }
});
```

---

## Neural Embeddings

Advanced embedding features:

### Drift Detection

```javascript
const { detectDrift } = require('ruvector');

// Monitor embedding distribution changes
const driftScore = detectDrift(oldEmbeddings, newEmbeddings);
if (driftScore > 0.3) {
  console.log('Significant drift detected - consider retraining');
}
```

### Memory Physics

```javascript
const { memoryPhysics } = require('ruvector');

// Apply forgetting curve to old memories
const decayedMemories = memoryPhysics.applyDecay(memories, {
  halfLife: 7 * 24 * 60 * 60 * 1000,  // 7 days
  minRetention: 0.1
});

// Consolidate memories (spaced repetition)
const consolidated = memoryPhysics.consolidate(memories, {
  repetitionBonus: 1.5,
  similarityThreshold: 0.9
});
```

### Swarm Coordination

```javascript
const { swarmEmbeddings } = require('ruvector');

// Coordinate embeddings across multiple agents
const coordinator = new swarmEmbeddings.Coordinator({
  agents: ['agent1', 'agent2', 'agent3'],
  consensusThreshold: 0.8
});

// Merge embeddings from multiple agents
const mergedEmbedding = await coordinator.merge(agentEmbeddings);
```

---

## CLI Reference

### Database Commands

```bash
# Initialize new database
ruvector init --dimensions 384 --metric cosine

# Add vectors from file
ruvector add ./vectors.json

# Search
ruvector search "query text" --k 10

# Export database
ruvector export ./backup.json

# Import database
ruvector import ./backup.json

# Database info
ruvector info
```

### GNN Commands

```bash
# Train GNN layer
ruvector gnn train --input ./graph.json --epochs 100

# Inference
ruvector gnn infer --input ./nodes.json

# Visualize graph
ruvector gnn visualize --output ./graph.html
```

### Attention Commands

```bash
# Run attention analysis
ruvector attention analyze --input ./sequences.json

# Visualize attention weights
ruvector attention visualize --output ./attention.html
```

### Hooks Commands

```bash
# List available hooks
ruvector hooks list

# Run pre-task hook
ruvector hooks pre-task --description "Processing documents"

# Run post-task hook
ruvector hooks post-task --task-id "task123"
```

---

## Integration Patterns

### Claude Code Hooks

```javascript
// .claude/hooks/pre-task.js
const { VectorDB } = require('ruvector');

module.exports = async function(context) {
  const db = await VectorDB.load('./knowledge.ruvector');

  // Find relevant context for task
  const embedding = await generateEmbedding(context.taskDescription);
  const relevant = await db.search(embedding, { k: 5 });

  // Inject into context
  context.relevantDocs = relevant.map(r => r.metadata.content);

  return context;
};
```

### RAG Pipeline

```javascript
async function ragPipeline(query) {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Retrieve relevant documents
  const results = await db.search(queryEmbedding, {
    k: 5,
    threshold: 0.7
  });

  // 3. Build context
  const context = results
    .map(r => r.metadata.content)
    .join('\n\n');

  // 4. Generate response with context
  const response = await llm.generate({
    prompt: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`,
    maxTokens: 500
  });

  return response;
}
```

### MCP Server

```javascript
const { createMCPServer } = require('ruvector');

const server = createMCPServer({
  db: await VectorDB.load('./knowledge.ruvector'),
  tools: [
    {
      name: 'search_knowledge',
      description: 'Search the knowledge base',
      parameters: {
        query: { type: 'string', required: true },
        k: { type: 'number', default: 5 }
      }
    }
  ]
});

server.listen(3000);
```

---

## Performance Tuning

### Benchmarks

| Operation | 10K vectors | 100K vectors | 1M vectors |
|-----------|-------------|--------------|------------|
| Build Index | 0.8s | 8.2s | 95s |
| Search (k=10) | 0.3ms | 0.5ms | 1.2ms |
| Insert | 0.1ms | 0.2ms | 0.5ms |
| Batch Insert (1000) | 50ms | 80ms | 150ms |

### Optimization Tips

```javascript
// 1. Use batch operations
await db.add(vectors);  // Instead of loop with single adds

// 2. Pre-allocate if size known
const db = new VectorDB({
  dimensions: 384,
  maxVectors: 1000000  // Helps memory allocation
});

// 3. Tune HNSW for your recall/speed needs
const db = new VectorDB({
  hnsw: {
    m: 16,           // Lower for speed, higher for recall
    efSearch: 50     // Adjust at runtime
  }
});

// 4. Use quantization for memory savings
const db = new VectorDB({
  quantization: 'scalar'  // 4x memory reduction
});

// 5. Filter before vector search when possible
const results = await db.search(query, {
  filter: { category: 'tech' },  // Reduces search space
  k: 10
});
```

---

## Error Handling

### Graceful Fallbacks

```javascript
const { VectorDB, embeddingsAvailable } = require('ruvector');

// Check embedding availability
if (!embeddingsAvailable()) {
  console.warn('Local embeddings not available, using external API');
  // Fallback to OpenAI/other
}

// Safe database operations
try {
  const results = await db.search(query, { k: 10 });
} catch (error) {
  if (error.code === 'DIMENSION_MISMATCH') {
    console.error('Query vector dimension does not match database');
  } else if (error.code === 'INDEX_NOT_READY') {
    console.error('Index still building, try again later');
  } else {
    throw error;
  }
}
```

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `DIMENSION_MISMATCH` | Vector dimension wrong | Check embedding model |
| `INDEX_NOT_READY` | HNSW still building | Wait for build completion |
| `VECTOR_NOT_FOUND` | ID doesn't exist | Check ID before operations |
| `INVALID_FILTER` | Filter syntax error | Review filter operators |
| `PERSISTENCE_ERROR` | Save/load failed | Check file permissions |

---

## Troubleshooting

### Common Issues

**Q: Search returns unexpected results**
```javascript
// Check: Are embeddings normalized?
const norm = Math.sqrt(vector.reduce((a, b) => a + b*b, 0));
if (Math.abs(norm - 1) > 0.01) {
  console.log('Vectors not normalized - use cosine metric');
}

// Check: Is efSearch high enough?
db.setEfSearch(200);  // Increase for better recall
```

**Q: Out of memory**
```javascript
// Use quantization
const db = new VectorDB({
  quantization: 'binary'  // 32x memory reduction
});

// Or reduce m parameter
const db = new VectorDB({
  hnsw: { m: 8 }  // Less memory, lower recall
});
```

**Q: Search is slow**
```javascript
// Lower efSearch for speed
db.setEfSearch(20);

// Or use pre-filtering
const results = await db.search(query, {
  filter: { category: 'specific' },  // Reduce search space
  k: 10
});
```

**Q: Embeddings not available**
```bash
# Check ONNX runtime
npm ls onnxruntime-node

# Reinstall if missing
npm install ruvector --force
```

---

## Use Cases

### 1. Semantic Document Search

```javascript
// Index documents
for (const doc of documents) {
  await db.add({
    id: doc.id,
    vector: await generateEmbedding(doc.content),
    metadata: { title: doc.title, url: doc.url }
  });
}

// Search
const results = await db.search(
  await generateEmbedding('how to deploy to production'),
  { k: 10 }
);
```

### 2. Recommendation System

```javascript
// Get user's viewed items
const userHistory = await getUserHistory(userId);
const userEmbedding = await aggregateEmbeddings(userHistory);

// Find similar items
const recommendations = await db.search(userEmbedding, {
  k: 20,
  filter: { $nin: userHistory.map(h => h.id) }  // Exclude seen
});
```

### 3. Anomaly Detection

```javascript
// Find outliers
const allVectors = await db.getAll();
const avgVector = computeCentroid(allVectors);

const anomalies = allVectors.filter(v => {
  const distance = cosineDistance(v.vector, avgVector);
  return distance > 0.5;  // Threshold
});
```

### 4. Question Answering with RAG

```javascript
async function answerQuestion(question) {
  const questionEmbedding = await generateEmbedding(question);
  const context = await db.search(questionEmbedding, { k: 3 });

  const prompt = `
    Based on the following context, answer the question.

    Context:
    ${context.map(c => c.metadata.content).join('\n\n')}

    Question: ${question}
  `;

  return await llm.generate(prompt);
}
```

---

## Quick Reference Card

```javascript
// Create
const db = new VectorDB({ dimensions: 384 });

// Add
await db.add({ id: 'x', vector: [...], metadata: {} });

// Search
const results = await db.search(query, { k: 10 });

// Filter search
const results = await db.search(query, { k: 10, filter: { type: 'doc' } });

// Update
await db.update('x', { vector: [...], metadata: {} });

// Delete
await db.delete('x');

// Save
await db.save('./db.ruvector');

// Load
const db = await VectorDB.load('./db.ruvector');

// Embeddings
const vec = await generateEmbedding('text');
```

---

*RuVector v0.1.88 | Documentation v1.0.0 | 2026-01-02*
