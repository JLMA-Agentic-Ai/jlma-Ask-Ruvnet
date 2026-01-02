Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:00:40 EST

# RuvLLM + RuVector API Integration Reference

## Overview

This document provides comprehensive API documentation for the integrated RuvLLM, RuVector, and Agentic-Flow stack, enabling developers to build intelligent agentic applications with persistent memory and RAG capabilities.

## Core APIs

### RuVector API

#### Initialization

```javascript
const { RuVector } = require('ruvector');

const store = new RuVector({
  dimensions: 128,
  distanceMetric: 'Cosine',  // 'Cosine', 'Euclidean', 'DotProduct'
  persistence: {
    enabled: true,
    path: '.ruvector/knowledge-base',
    walEnabled: true,
    autoSave: true,
    autoSaveInterval: 60000  // ms
  },
  hnsw: {
    M: 16,
    efConstruction: 200,
    efSearch: 100
  }
});
```

#### Vector Operations

```javascript
// Insert single vector
await store.insert({
  id: 'doc-001',
  vector: new Float32Array(128),
  metadata: {
    source: 'knowledge-base',
    category: 'technical',
    timestamp: Date.now()
  }
});

// Batch insert
await store.batchInsert([
  { id: 'doc-002', vector: [...], metadata: {...} },
  { id: 'doc-003', vector: [...], metadata: {...} }
], { batchSize: 100 });

// Search with filters
const results = await store.search({
  vector: queryVector,
  k: 10,
  filter: {
    category: { $eq: 'technical' },
    timestamp: { $gt: Date.now() - 86400000 }
  },
  includeMetadata: true,
  includeVectors: false
});

// Delete vectors
await store.delete('doc-001');
await store.batchDelete(['doc-002', 'doc-003']);

// Update metadata
await store.updateMetadata('doc-001', {
  lastAccessed: Date.now(),
  accessCount: 5
});
```

#### Persistence Operations

```javascript
// Manual save
await store.save();

// Load from disk
await store.load();

// Create backup
await store.backup('.ruvector/backups/backup-' + Date.now());

// Restore from backup
await store.restore('.ruvector/backups/backup-1234567890');

// Get statistics
const stats = store.getStats();
// { vectorCount: 1501, dimensions: 128, indexSize: 750KB, ... }
```

### RuvLLM API

#### Configuration

```javascript
const { RuvLLM } = require('@ruvector/ruvllm');

const llm = new RuvLLM({
  provider: 'ollama',
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'qwen3:8b',
    embeddingModel: 'nomic-embed-text:latest',
    options: {
      temperature: 0.7,
      top_p: 0.9,
      num_ctx: 8192,
      num_predict: 2048
    }
  },
  fallback: {
    provider: 'groq',
    apiKey: process.env.GROQ_API_KEY
  }
});
```

#### Generation Methods

```javascript
// Simple completion
const response = await llm.generate({
  prompt: 'Explain vector databases',
  maxTokens: 500,
  temperature: 0.7
});

// Chat completion
const chatResponse = await llm.chat({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is HNSW?' }
  ],
  stream: false
});

// Streaming response
const stream = await llm.generate({
  prompt: 'Write a tutorial...',
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}

// Embedding generation
const embedding = await llm.embed('Your text here');
// Returns: Float32Array(768)

// Batch embeddings
const embeddings = await llm.embedBatch([
  'First document',
  'Second document',
  'Third document'
], { batchSize: 10 });
```

### RAG Pipeline API

#### Setup

```javascript
const { RAGPipeline } = require('@ruvector/ruvllm');

const rag = new RAGPipeline({
  vectorStore: store,      // RuVector instance
  llm: llm,                // RuvLLM instance
  config: {
    topK: 10,
    minSimilarity: 0.5,
    reranking: true,
    rerankModel: 'cross-encoder',
    contextWindow: 8000,
    chunkOverlap: 200
  }
});
```

#### Query Methods

```javascript
// Simple RAG query
const answer = await rag.query({
  question: 'How does Strange Loop architecture work?',
  includeContext: true,
  includeSources: true
});
// Returns: { answer: '...', context: [...], sources: [...] }

// Query with custom prompt template
const customAnswer = await rag.query({
  question: 'Explain HNSW indexing',
  promptTemplate: `Based on the following context:
{context}

Answer this question: {question}

Provide a detailed technical explanation.`
});

// Multi-turn conversation with RAG
const conversation = rag.createConversation();
await conversation.addMessage('What is RuVector?');
await conversation.addMessage('How does it compare to Pinecone?');
const history = conversation.getHistory();
```

#### Document Ingestion

```javascript
// Ingest single document
await rag.ingest({
  id: 'doc-001',
  content: 'Full document text...',
  metadata: { source: 'manual', category: 'docs' },
  chunkSize: 512,
  chunkOverlap: 50
});

// Ingest from file
await rag.ingestFile('./docs/README.md', {
  metadata: { source: 'file' }
});

// Ingest directory
await rag.ingestDirectory('./docs/', {
  extensions: ['.md', '.txt', '.js'],
  recursive: true,
  metadata: { source: 'bulk-import' }
});
```

### Agentic-Flow Integration

#### Memory Operations

```javascript
const { AgenticFlow } = require('agentic-flow');

const flow = new AgenticFlow({
  memory: {
    backend: 'ruvector',
    vectorStore: store,
    namespace: 'agent-memory'
  }
});

// Store agent memory
await flow.memory.store({
  key: 'task/result',
  value: { completed: true, output: '...' },
  ttl: 3600000,  // 1 hour
  tags: ['task', 'completed']
});

// Retrieve memory
const memory = await flow.memory.retrieve('task/result');

// Search memory semantically
const relevant = await flow.memory.search({
  query: 'task completion status',
  limit: 5,
  filter: { tags: { $contains: 'task' } }
});
```

#### Agent Coordination

```javascript
// Spawn coordinated agents
await flow.spawn([
  { type: 'researcher', task: 'Gather information' },
  { type: 'coder', task: 'Implement solution' },
  { type: 'reviewer', task: 'Review code quality' }
], {
  topology: 'hierarchical',
  coordinator: 'researcher',
  memorySharing: true
});

// Inter-agent communication
await flow.broadcast({
  from: 'researcher',
  message: { findings: [...] },
  targets: ['coder', 'reviewer']
});
```

## HTTP REST API

### Endpoints

#### Vector Operations

```
POST   /api/v1/vectors          Insert vector(s)
GET    /api/v1/vectors/:id      Get vector by ID
DELETE /api/v1/vectors/:id      Delete vector
POST   /api/v1/vectors/search   Search vectors
POST   /api/v1/vectors/batch    Batch operations
```

#### RAG Operations

```
POST   /api/v1/rag/query        RAG query
POST   /api/v1/rag/ingest       Ingest document
GET    /api/v1/rag/sources      List sources
DELETE /api/v1/rag/sources/:id  Remove source
```

#### LLM Operations

```
POST   /api/v1/llm/generate     Generate completion
POST   /api/v1/llm/chat         Chat completion
POST   /api/v1/llm/embed        Generate embedding
GET    /api/v1/llm/models       List available models
```

### Request/Response Examples

```bash
# Search vectors
curl -X POST http://localhost:3000/api/v1/vectors/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "k": 10,
    "filter": {"category": "docs"}
  }'

# RAG query
curl -X POST http://localhost:3000/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How does HNSW work?",
    "topK": 5,
    "includeContext": true
  }'
```

## Error Codes

| Code | Description |
|------|-------------|
| `RUVECTOR_001` | Vector dimension mismatch |
| `RUVECTOR_002` | Vector ID not found |
| `RUVECTOR_003` | Persistence write failed |
| `RUVECTOR_004` | Index corruption detected |
| `RUVLLM_001` | Ollama connection failed |
| `RUVLLM_002` | Model not available |
| `RUVLLM_003` | Token limit exceeded |
| `RAG_001` | No relevant context found |
| `RAG_002` | Ingestion failed |

## Rate Limits

| Operation | Default Limit |
|-----------|--------------|
| Vector insert | 1000/sec |
| Vector search | 500/sec |
| LLM generate | 10/sec |
| Embedding batch | 100/sec |

## Related Documentation

- [Error Handling Guide](./ERROR_HANDLING_RECOVERY.md)
- [Monitoring Guide](./MONITORING_OBSERVABILITY.md)
- [Security Guide](./SECURITY_ACCESS_CONTROL.md)
- [Scalability Guide](./SCALABILITY_LOAD_BALANCING.md)
