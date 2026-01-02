Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-28 23:54:04 EST

# RuvNet Packages Complete Documentation

> Comprehensive reference for the RuvNet AI ecosystem packages, including vector databases, agent memory systems, cloud orchestration, and synthetic data generation.

---

## Table of Contents

1. [@ruvector/rvlite](#1-ruvectorrvlite-v024)
2. [@ruvector/postgres-cli](#2-ruvectorpostgres-cli-v026)
3. [agentdb](#3-agentdb-v161)
4. [flow-nexus](#4-flow-nexus-v01128)
5. [@ruvector/agentic-synth](#5-ruvectoragentic-synth-v016)
6. [PostgreSQL SQL Functions Reference](#6-postgresql-sql-functions-reference)
7. [Tiered Compression Architecture](#7-tiered-compression-architecture)
8. [ReasoningBank PostgreSQL Persistence](#8-reasoningbank-postgresql-persistence)
9. [Docker Deployment Patterns](#9-docker-deployment-patterns)
10. [Integration Patterns](#10-integration-patterns)

---

## 1. @ruvector/rvlite v0.2.4

### Description
RvLite is an SQLite-style vector database for browsers and edge environments. It provides a unified SQL + SPARQL + Cypher query interface with zero dependencies, running anywhere JavaScript runs - browsers, Node.js, Deno, Bun, Cloudflare Workers, and Vercel Edge.

### Installation

```bash
npm install @rvlite/wasm
# or
npm install ruvector  # All-in-one package
```

### Complete API Reference

#### Core Class: `RvLite`

```javascript
import { RvLite } from '@rvlite/wasm';

// Create database instance
const db = await RvLite.create(options);
```

**Constructor Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | string | `:memory:` | Database file path |
| `dimensions` | number | 384 | Default vector dimensions |
| `indexType` | string | `hnsw` | Index type (hnsw, ivfflat) |
| `m` | number | 16 | HNSW connections per layer |
| `efConstruction` | number | 64 | HNSW construction quality |

#### SQL Interface

```javascript
// CREATE TABLE with vector column
await db.sql(`CREATE TABLE docs (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding VECTOR(384)
)`);

// INSERT with embedding
await db.sql(`INSERT INTO docs (content, embedding) VALUES ($1, $2)`, [
  'Document text',
  '[0.1, 0.2, ...]'
]);

// Vector similarity search
const results = await db.sql(`
  SELECT content, embedding <-> $1 AS distance
  FROM docs
  ORDER BY distance
  LIMIT 10
`, [[0.15, 0.25, ...]]);
```

#### SPARQL Interface

```javascript
// RDF triple queries
const results = await db.sparql(`
  SELECT ?subject ?predicate ?object
  WHERE {
    ?subject rdf:type ex:Document .
    ?subject ex:hasContent ?object .
    FILTER(CONTAINS(?object, "search term"))
  }
  ORDER BY ?subject
  LIMIT 10
`);

// CONSTRUCT queries
const graph = await db.sparql(`
  CONSTRUCT {
    ?doc ex:relatedTo ?related
  }
  WHERE {
    ?doc ex:topic ?topic .
    ?related ex:topic ?topic .
    FILTER(?doc != ?related)
  }
`);
```

#### Cypher Interface

```javascript
// Graph pattern matching
const results = await db.cypher(`
  MATCH (d:Document)-[:SIMILAR]->(related:Document)
  WHERE d.id = $docId
  RETURN related.content, related.score
  ORDER BY related.score DESC
  LIMIT 5
`, { docId: 123 });

// Create relationships
await db.cypher(`
  MATCH (a:Document), (b:Document)
  WHERE a.id = $aId AND b.id = $bId
  CREATE (a)-[:SIMILAR {score: $score}]->(b)
`, { aId: 1, bId: 2, score: 0.95 });
```

#### Vector Operations

```javascript
// Insert vectors
await db.insert(id, embedding, metadata);

// Batch insert
await db.insertBatch([
  { id: '1', embedding: [...], metadata: { title: 'Doc 1' } },
  { id: '2', embedding: [...], metadata: { title: 'Doc 2' } }
]);

// Search
const results = await db.search(queryEmbedding, {
  k: 10,
  filter: { category: 'technical' },
  includeMetadata: true
});

// Delete
await db.delete(id);
```

### Configuration Options

```javascript
const config = {
  // Storage
  path: './vectors.db',           // File path (or :memory:)
  persist: true,                  // Enable persistence

  // Index
  indexType: 'hnsw',              // hnsw | ivfflat
  m: 16,                          // HNSW connections
  efConstruction: 64,             // Build quality
  efSearch: 100,                  // Search quality

  // Performance
  cacheSize: 1000,                // LRU cache entries
  batchSize: 100,                 // Batch operation size

  // SONA Integration
  reasoningBank: true,            // Enable self-learning
  learningRate: 0.01              // Pattern adaptation rate
};
```

### Usage Examples

#### Browser Usage
```html
<script type="module">
  import { RvLite } from 'https://cdn.skypack.dev/@rvlite/wasm';

  const db = await RvLite.create();
  await db.sql(`CREATE TABLE items (id INT, vec VECTOR(128))`);
</script>
```

#### Edge Function (Cloudflare Workers)
```javascript
import { RvLite } from '@rvlite/wasm';

export default {
  async fetch(request, env) {
    const db = await RvLite.create({ path: ':memory:' });
    // Handle vector operations
    return new Response(JSON.stringify(results));
  }
};
```

#### Multi-Query Unified Search
```javascript
// Combine SQL, SPARQL, and Cypher for comprehensive search
async function unifiedSearch(query) {
  // SQL for structured data
  const sqlResults = await db.sql(`
    SELECT * FROM documents WHERE content ILIKE $1
  `, [`%${query}%`]);

  // SPARQL for semantic relationships
  const sparqlResults = await db.sparql(`
    SELECT ?doc WHERE {
      ?doc ex:mentions "${query}" .
    }
  `);

  // Cypher for graph traversal
  const cypherResults = await db.cypher(`
    MATCH (d:Document)-[:REFERENCES*1..3]->(related)
    WHERE d.content CONTAINS $query
    RETURN DISTINCT related
  `, { query });

  return { sql: sqlResults, sparql: sparqlResults, cypher: cypherResults };
}
```

---

## 2. @ruvector/postgres-cli v0.2.6

### Description
The most advanced AI vector database CLI for PostgreSQL. A drop-in pgvector replacement with 77+ SQL functions, 39 attention mechanisms, GNN layers, hyperbolic embeddings, and self-learning capabilities.

### Installation

```bash
# Global installation
npm install -g @ruvector/postgres-cli

# One-time usage
npx @ruvector/postgres-cli <command>

# Rust crate (for custom builds)
cargo add ruvector-postgres
```

### Complete CLI Commands

#### Server Management
```bash
# Install extension
ruvector-pg install [--method native|docker] [--pg-version 16]

# Server status
ruvector-pg status

# Start/stop
ruvector-pg start
ruvector-pg stop

# View logs
ruvector-pg logs [--follow] [--lines 100]

# Extension info
ruvector-pg info
```

#### Vector Operations
```bash
# Create vector table
ruvector-pg vector create <table> --dim 384 [--index hnsw|ivfflat]

# Insert vectors
ruvector-pg vector insert <table> --data '[0.1, 0.2, ...]' --id 'doc-1'

# Search
ruvector-pg vector search <table> --query '[0.1, 0.2, ...]' --k 10

# Delete
ruvector-pg vector delete <table> --id 'doc-1'

# List tables
ruvector-pg vector list
```

#### Attention Mechanisms (39 Types)
```bash
# List all mechanisms
ruvector-pg attention list

# Get mechanism info
ruvector-pg attention info <mechanism>

# Benchmark
ruvector-pg attention benchmark [--type flash|scaled|multi-head]

# Available mechanisms:
# scaled-dot-product, multi-head, flash, sparse, linear,
# causal, cross, self, rotary, alibi, sliding-window,
# grouped-query, multi-query, local, global, axial,
# performer, linformer, longformer, bigbird, reformer,
# synthesizer, talking-heads, mixture-of-experts, routing,
# memory, external, compressed, low-rank, factorized,
# kernel, random-feature, nystrom, fourier, wavelet,
# spectral, graph, hyperbolic, poincare
```

#### GNN Operations
```bash
# Graph Convolutional Network
ruvector-pg gnn gcn --features "[[...]]" --adj "[[...]]"

# GraphSAGE
ruvector-pg gnn sage --features "[[...]]" --neighbors 10

# Graph Attention Network
ruvector-pg gnn gat --features "[[...]]" --heads 4

# Message passing
ruvector-pg gnn message-pass --graph "graph.json" --iterations 3
```

#### Hyperbolic Embeddings
```bash
# Poincare distance
ruvector-pg hyperbolic poincare-distance --a "[0.1, 0.2]" --b "[0.3, 0.4]"

# Lorentz distance
ruvector-pg hyperbolic lorentz-distance --a "[1.0, 0.1, 0.2]" --b "[1.0, 0.3, 0.4]"

# Mobius addition
ruvector-pg hyperbolic mobius-add --a "[0.1, 0.2]" --b "[0.3, 0.4]"

# Exponential map
ruvector-pg hyperbolic exp-map --point "[0.1, 0.2]" --tangent "[0.01, 0.02]"

# Logarithmic map
ruvector-pg hyperbolic log-map --point "[0.1, 0.2]" --target "[0.3, 0.4]"
```

#### Graph Queries (Cypher)
```bash
# Execute Cypher query
ruvector-pg graph query "MATCH (n:Document) RETURN n LIMIT 10"

# Create nodes
ruvector-pg graph create-node --label Document --properties '{"title": "Test"}'

# Create relationships
ruvector-pg graph create-edge --from node1 --to node2 --type SIMILAR

# Shortest path
ruvector-pg graph shortest-path --from node1 --to node2

# PageRank
ruvector-pg graph pagerank --iterations 20
```

#### Sparse Vectors & BM25
```bash
# Create sparse vector
ruvector-pg sparse create --indices "[0, 5, 10]" --values "[1.0, 0.5, 0.3]"

# BM25 score
ruvector-pg sparse bm25 --query "search terms" --document "doc-id"

# TF-IDF
ruvector-pg sparse tfidf --terms '["term1", "term2"]' --corpus "corpus-id"
```

#### Agent Routing (Tiny Dancer)
```bash
# Route query to agents
ruvector-pg routing route --query "[0.1, 0.2, ...]" --agents agents.json

# Calculate affinity
ruvector-pg routing affinity --query "[...]" --agent "agent-1"

# List agents
ruvector-pg routing list-agents

# Update agent embeddings
ruvector-pg routing update-agent --id "agent-1" --embedding "[...]"
```

#### Self-Learning (ReasoningBank)
```bash
# Adaptive search
ruvector-pg learning adaptive-search --context "[...]" --query "pattern"

# Record trajectory
ruvector-pg learning record --action "search" --outcome "success"

# Train patterns
ruvector-pg learning train --data trajectories.json

# Get recommendations
ruvector-pg learning recommend --context "current situation"
```

#### Benchmarking
```bash
# Run all benchmarks
ruvector-pg bench run --type all --size 10000

# Specific benchmark
ruvector-pg bench run --type hnsw --size 100000 --dimensions 384

# Compare with pgvector
ruvector-pg bench compare --against pgvector
```

### SQL Functions Reference

#### Core Vector Operations
```sql
-- Distance calculations
SELECT embedding <-> '[...]'::ruvector AS l2_dist FROM docs;      -- L2/Euclidean
SELECT embedding <=> '[...]'::ruvector AS cosine_dist FROM docs;  -- Cosine
SELECT embedding <#> '[...]'::ruvector AS inner_prod FROM docs;   -- Inner product
SELECT embedding <+> '[...]'::ruvector AS manhattan FROM docs;    -- Manhattan

-- Vector arithmetic
SELECT rv_add(a.embedding, b.embedding) FROM docs a, docs b;
SELECT rv_subtract(a.embedding, b.embedding) FROM docs a, docs b;
SELECT rv_multiply(embedding, 2.0) FROM docs;
SELECT rv_normalize(embedding) FROM docs;
SELECT rv_magnitude(embedding) FROM docs;
SELECT rv_dot(a.embedding, b.embedding) FROM docs a, docs b;
```

#### Hyperbolic Geometry (8 Functions)
```sql
SELECT rv_poincare_distance(a, b) FROM vectors;
SELECT rv_lorentz_distance(a, b) FROM vectors;
SELECT rv_mobius_add(a, b) FROM vectors;
SELECT rv_mobius_scalar(v, 0.5) FROM vectors;
SELECT rv_exp_map(point, tangent) FROM vectors;
SELECT rv_log_map(point, target) FROM vectors;
SELECT rv_parallel_transport(v, from_pt, to_pt) FROM vectors;
SELECT rv_geodesic(a, b, 0.5) FROM vectors;  -- Midpoint
```

#### Attention Mechanisms
```sql
SELECT rv_scaled_dot_attention(q, k, v) FROM attention_data;
SELECT rv_multi_head_attention(q, k, v, 8) FROM attention_data;  -- 8 heads
SELECT rv_flash_attention(q, k, v) FROM attention_data;
SELECT rv_sparse_attention(q, k, v, pattern) FROM attention_data;
SELECT rv_linear_attention(q, k, v, kernel) FROM attention_data;
SELECT rv_causal_attention(q, k, v) FROM attention_data;
SELECT rv_cross_attention(q, k_ext, v_ext) FROM attention_data;
```

#### GNN Functions
```sql
SELECT rv_gcn_layer(features, adjacency, weights) FROM graphs;
SELECT rv_sage_layer(features, neighbors, aggregator) FROM graphs;
SELECT rv_gat_layer(features, adjacency, attention_weights) FROM graphs;
SELECT rv_message_pass(graph, messages, aggregate_fn) FROM graphs;
SELECT rv_graph_pool(node_features, pool_type) FROM graphs;
```

#### SPARQL/RDF Functions
```sql
SELECT rv_sparql_select(query_text, graph_name) AS results;
SELECT rv_sparql_construct(query_text, graph_name) AS triples;
SELECT rv_sparql_ask(query_text, graph_name) AS bool_result;
SELECT rv_sparql_describe(uri, graph_name) AS description;
SELECT rv_rdf_insert(subject, predicate, object, graph) AS success;
SELECT rv_rdf_delete(subject, predicate, object, graph) AS success;
```

### Configuration Options

```yaml
# ruvector-pg.yaml
server:
  host: localhost
  port: 5432
  database: vectors

extension:
  version: "0.2.6"
  simd: auto  # auto | avx512 | avx2 | neon | none

indexes:
  hnsw:
    m: 16
    ef_construction: 64
    ef_search: 100
  ivfflat:
    lists: 100
    probes: 10

learning:
  enabled: true
  trajectory_retention: 30d
  pattern_threshold: 0.7

embeddings:
  default_model: all-MiniLM-L6-v2
  cache_size: 10000
```

### Performance Benchmarks

| Operation | ruvector-postgres | pgvector | Improvement |
|-----------|------------------|----------|-------------|
| HNSW Build (1M vectors) | 95s | 180s | 1.9x |
| HNSW Search (top-10) | 1.2ms | 2.8ms | 2.3x |
| Cosine Distance | 38ns | 85ns | 2.2x |
| GCN Forward Pass | 180ms | N/A | - |
| BM25 Scoring | 0.5ms | N/A | - |

---

## 3. agentdb v1.6.1

### Description
Lightning-fast vector database and memory system for AI agents. Features sub-millisecond operations, HNSW indexing, 9 reinforcement learning algorithms, and 29 MCP tools for seamless AI integration.

### Installation

```bash
# npm
npm install agentdb

# Global CLI
npm install -g agentdb

# Start MCP server
npx agentdb@latest mcp

# Add to Claude Code
claude mcp add agentdb npx agentdb@latest mcp
```

### Complete API Reference

#### Core Database Class

```javascript
import { createVectorDB, AgentDB } from 'agentdb';

// Simple creation
const db = await createVectorDB({
  path: './agent-memory.db',
  dimensions: 384
});

// Full configuration
const db = new AgentDB({
  path: './agent-memory.db',
  dimensions: 384,
  indexType: 'hnsw',
  quantization: 'scalar',
  cacheSize: 1000
});

await db.initialize();
```

#### Vector Operations

```javascript
// Insert single vector
await db.insert({
  id: 'doc-1',
  embedding: [0.1, 0.2, ...],  // 384 dimensions
  metadata: {
    title: 'Document Title',
    category: 'technical',
    timestamp: Date.now()
  }
});

// Batch insert
await db.insertBatch([
  { id: 'doc-1', embedding: [...], metadata: {...} },
  { id: 'doc-2', embedding: [...], metadata: {...} }
]);

// Search with options
const results = await db.search({
  query: [0.1, 0.2, ...],
  k: 10,
  filter: { category: 'technical' },
  threshold: 0.7,
  includeMetadata: true,
  metric: 'cosine'  // cosine | euclidean | dot
});

// MMR diversity search
const diverse = await db.searchMMR({
  query: [...],
  k: 10,
  lambda: 0.5,  // Diversity factor (0=max diversity, 1=max relevance)
  fetchK: 50    // Initial candidates
});

// Delete
await db.delete('doc-1');

// Update metadata
await db.updateMetadata('doc-1', { category: 'updated' });

// Get by ID
const doc = await db.get('doc-1');
```

#### Pattern Storage

```javascript
// Store reasoning pattern
await db.patternStore({
  key: 'memory_leak_fix',
  content: 'Memory leaks from unclosed listeners. Use removeEventListener.',
  domain: 'debugging',
  confidence: 0.85,
  tags: ['memory', 'javascript', 'performance']
});

// Search patterns
const patterns = await db.patternSearch({
  query: 'memory leak',
  domain: 'debugging',
  minConfidence: 0.7,
  limit: 5
});

// Get pattern statistics
const stats = await db.patternStats();
```

#### Learning Plugins

```javascript
import { createLearningPlugin } from 'agentdb/learning';

// Create Decision Transformer plugin
const dtPlugin = await createLearningPlugin({
  algorithm: 'decision-transformer',
  config: {
    contextLength: 20,
    hiddenSize: 256,
    numHeads: 4,
    numLayers: 3
  }
});

// Train plugin
await dtPlugin.train({
  trajectories: [
    {
      states: [[...], [...], ...],
      actions: [0, 1, 2, ...],
      rewards: [1.0, 0.5, -0.2, ...],
      returnsToGo: [3.5, 2.5, 2.0, ...]
    }
  ],
  epochs: 100,
  batchSize: 32
});

// Get action prediction
const action = await dtPlugin.predict({
  state: [...],
  targetReturn: 5.0
});
```

**Available Learning Algorithms:**
1. **decision-transformer** - Offline RL from logged experiences
2. **q-learning** - Value-based, off-policy
3. **sarsa** - Value-based, on-policy (safer)
4. **actor-critic** - Policy gradient with baseline
5. **ppo** - Proximal Policy Optimization
6. **dqn** - Deep Q-Network
7. **a2c** - Advantage Actor-Critic
8. **reinforce** - Monte Carlo policy gradient
9. **curiosity-driven** - Intrinsic motivation exploration

#### Causal Memory

```javascript
// Add causal edge
await db.causalAddEdge({
  cause: 'user_clicked_button',
  effect: 'modal_opened',
  strength: 0.95,
  metadata: { context: 'ui_interaction' }
});

// Query causal relationships
const causes = await db.causalQuery({
  effect: 'modal_opened',
  minStrength: 0.5,
  depth: 3
});
```

#### Reflexion Memory

```javascript
// Store reflection
await db.reflexionStore({
  experience: 'Failed to parse JSON due to trailing comma',
  reflection: 'Always validate JSON before parsing',
  lesson: 'Use try-catch and JSON.parse validation',
  importance: 0.9
});

// Retrieve relevant reflections
const reflections = await db.reflexionRetrieve({
  context: 'JSON parsing error',
  limit: 5
});
```

#### Skill Library

```javascript
// Create skill
await db.skillCreate({
  name: 'api_error_handler',
  description: 'Handles API errors with retry logic',
  implementation: `
    async function handleApiError(error, retries = 3) {
      if (retries === 0) throw error;
      await sleep(1000 * (4 - retries));
      return retry();
    }
  `,
  tags: ['api', 'error-handling', 'resilience']
});

// Search skills
const skills = await db.skillSearch({
  query: 'error handling',
  tags: ['api'],
  limit: 5
});
```

### MCP Tools Reference (29 Total)

#### Core Vector DB Tools (5)
| Tool | Description | Parameters |
|------|-------------|------------|
| `agentdb_init` | Initialize database | `path`, `dimensions`, `indexType` |
| `agentdb_insert` | Insert single vector | `id`, `embedding`, `metadata` |
| `agentdb_insert_batch` | Insert multiple vectors | `vectors[]` |
| `agentdb_search` | Vector similarity search | `query`, `k`, `filter`, `metric` |
| `agentdb_delete` | Delete vector | `id` |

#### Core AgentDB Tools (5)
| Tool | Description | Parameters |
|------|-------------|------------|
| `agentdb_stats` | Get database statistics | - |
| `agentdb_pattern_store` | Store reasoning pattern | `key`, `content`, `domain`, `confidence` |
| `agentdb_pattern_search` | Search patterns | `query`, `domain`, `minConfidence` |
| `agentdb_pattern_stats` | Pattern statistics | - |
| `agentdb_clear_cache` | Clear LRU cache | - |

#### Frontier Memory Tools (9)
| Tool | Description | Parameters |
|------|-------------|------------|
| `causal_add_edge` | Add causal relationship | `cause`, `effect`, `strength` |
| `causal_query` | Query causal graph | `effect`, `minStrength`, `depth` |
| `reflexion_store` | Store reflection | `experience`, `reflection`, `lesson` |
| `reflexion_retrieve` | Retrieve reflections | `context`, `limit` |
| `skill_create` | Create skill | `name`, `description`, `implementation` |
| `skill_search` | Search skills | `query`, `tags`, `limit` |
| `recall_with_certificate` | Certified recall | `query`, `requireCert` |
| `db_stats` | Detailed statistics | - |
| `learner_discover` | Discover learning opportunities | `context` |

#### Learning Tools (10)
| Tool | Description | Parameters |
|------|-------------|------------|
| `learning_create_plugin` | Create learning plugin | `algorithm`, `config` |
| `learning_train` | Train plugin | `pluginId`, `data`, `epochs` |
| `learning_predict` | Get prediction | `pluginId`, `state` |
| `learning_save` | Save model | `pluginId`, `path` |
| `learning_load` | Load model | `path` |
| `learning_stats` | Plugin statistics | `pluginId` |
| `learning_list_algorithms` | List available algorithms | - |
| `learning_create_trajectory` | Create trajectory | `states`, `actions`, `rewards` |
| `learning_replay_buffer` | Manage replay buffer | `action`, `data` |
| `learning_hyperparameters` | Tune hyperparameters | `pluginId`, `params` |

### Configuration Options

```javascript
const config = {
  // Storage
  path: './agent-memory.db',
  persistToDisk: true,

  // Vectors
  dimensions: 384,
  indexType: 'hnsw',  // hnsw | flat | ivf

  // HNSW Configuration
  hnswM: 16,              // Connections per layer
  hnswEf: 100,            // Dynamic candidate list size
  hnswEfConstruction: 64, // Build-time quality

  // Quantization
  quantization: 'scalar', // none | binary | scalar | product

  // Performance
  cacheSize: 1000,        // LRU cache entries
  batchSize: 100,         // Batch operation size

  // Learning
  learningEnabled: false,
  learningAlgorithm: 'decision-transformer',

  // ReasoningBank
  reasoningEnabled: false,
  reasoningConfidenceThreshold: 0.7,

  // Distributed
  quicSyncEnabled: false,
  syncEndpoint: null
};
```

**Environment Variables:**
```bash
AGENTDB_ENABLED=true
AGENTDB_PATH=.agentdb/memory.db
AGENTDB_QUANTIZATION=scalar  # binary|scalar|product|none
AGENTDB_CACHE_SIZE=1000
AGENTDB_HNSW_M=16
AGENTDB_HNSW_EF=100
AGENTDB_LEARNING=false
AGENTDB_LEARNING_ALGORITHM=decision-transformer
AGENTDB_REASONING=false
AGENTDB_QUIC_SYNC=false
```

### Performance Benchmarks

| Operation | AgentDB | Traditional | Improvement |
|-----------|---------|-------------|-------------|
| Pattern Search | 100us | 15ms | 150x |
| Batch Insert (100) | 2ms | 1s | 500x |
| Large Query (1M) | 8ms | 100s | 12,500x |
| Memory (with quantization) | 4-32x reduction | - | - |

### CLI Commands

```bash
# Initialize database
agentdb init ./my-agent-memory.db

# Insert vector
agentdb insert ./db.sqlite --embedding "[0.1, 0.2, ...]" --id "doc-1"

# Query with metrics
agentdb query ./db.sqlite "[0.1, 0.2, ...]" -k 10 -m cosine

# List templates
agentdb list-templates

# Create learning plugin
agentdb create-plugin --algorithm decision-transformer

# Start MCP server
agentdb mcp

# Database statistics
agentdb stats ./db.sqlite

# Export data
agentdb export ./db.sqlite --format json --output export.json
```

---

## 4. flow-nexus v0.1.128

### Description
The first competitive agentic platform built entirely on MCP (Model Context Protocol). Deploy autonomous AI swarms, train neural networks, and compete in coding challenges while earning rUv credits. Features 70+ MCP tools for swarm management, sandbox execution, workflow automation, and distributed neural training.

### Installation

```bash
# Basic usage
npx flow-nexus

# Global installation
npm install -g flow-nexus

# Initialize project
npx claude-flow@alpha init --flow-nexus

# Add MCP servers
claude mcp add flow-nexus npx flow-nexus@latest mcp start
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm@latest mcp start
```

### Authentication

```bash
# Register
npx flow-nexus auth register -e your@email.com -p password

# Login
npx flow-nexus auth login -e your@email.com -p password

# Check status
npx flow-nexus auth status
```

**New User Bonus:** 356 rUv credits (100 registration + 256 first-time)

### Complete MCP Tools Reference (70+)

#### Authentication & Users (10 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `user_register` | Register new user | `email`, `password`, `username` |
| `user_login` | Authenticate user | `email`, `password` |
| `user_logout` | End session | - |
| `user_verify_email` | Verify email | `token` |
| `user_reset_password` | Request reset | `email` |
| `user_update_password` | Update password | `token`, `new_password` |
| `user_upgrade` | Upgrade tier | `user_id`, `tier` |
| `user_stats` | Get statistics | `user_id` |
| `user_profile` | Get profile | `user_id` |
| `user_update_profile` | Update profile | `user_id`, `updates` |

#### Swarm Management (10 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `swarm_init` | Initialize swarm | `topology`, `maxAgents`, `strategy` |
| `agent_spawn` | Create agent | `type`, `name`, `capabilities` |
| `task_orchestrate` | Orchestrate tasks | `task`, `strategy`, `priority`, `maxAgents` |
| `swarm_list` | List swarms | `status` |
| `swarm_status` | Get status | `swarm_id` |
| `swarm_scale` | Scale swarm | `swarm_id`, `target_agents` |
| `swarm_destroy` | Destroy swarm | `swarm_id` |
| `swarm_create_from_template` | From template | `template_id`, `overrides` |
| `swarm_templates_list` | List templates | `category`, `includeStore` |
| `swarm_monitor` | Monitor activity | `swarm_id`, `duration`, `interval` |

**Swarm Topologies:**
- `mesh` - Peer-to-peer communication
- `star` - Centralized coordinator
- `ring` - Circular distribution
- `hierarchical` - Tree structure

**Agent Types:**
- `researcher`, `coder`, `analyst`, `optimizer`, `coordinator`

#### Sandbox Operations (10 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `sandbox_create` | Create sandbox | `template`, `name`, `env_vars`, `install_packages`, `timeout` |
| `sandbox_execute` | Execute code | `sandbox_id`, `code`, `language`, `env_vars`, `timeout` |
| `sandbox_list` | List sandboxes | `status` |
| `sandbox_stop` | Stop sandbox | `sandbox_id` |
| `sandbox_configure` | Configure sandbox | `sandbox_id`, `env_vars`, `install_packages` |
| `sandbox_delete` | Delete sandbox | `sandbox_id` |
| `sandbox_status` | Get status | `sandbox_id` |
| `sandbox_upload` | Upload file | `sandbox_id`, `file_path`, `content` |
| `sandbox_logs` | Get logs | `sandbox_id`, `lines` |
| `sandbox_connect` | Connect to sandbox | `sandbox_id` |

**Sandbox Templates:**
- `node` - Node.js environment
- `python` - Python environment
- `react` - React development
- `nextjs` - Next.js development
- `vanilla` - Basic JavaScript
- `base` - Minimal environment
- `claude-code` - Claude Code integration

#### Neural Network Tools (12 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `neural_train` | Train model | `config`, `tier`, `user_id` |
| `neural_predict` | Run inference | `model_id`, `input`, `user_id` |
| `neural_list_templates` | List templates | `category`, `tier`, `search` |
| `neural_deploy_template` | Deploy template | `template_id`, `custom_config` |
| `neural_training_status` | Check training | `job_id` |
| `neural_list_models` | List models | `user_id`, `include_public` |
| `neural_validation_workflow` | Validate model | `model_id`, `validation_type` |
| `neural_publish_template` | Publish template | `model_id`, `name`, `description`, `price` |
| `neural_rate_template` | Rate template | `template_id`, `rating`, `review` |
| `neural_performance_benchmark` | Benchmark | `model_id`, `benchmark_type` |
| `neural_cluster_init` | Init cluster | `name`, `architecture`, `topology`, `consensus` |
| `neural_train_distributed` | Distributed training | `cluster_id`, `dataset`, `epochs`, `batch_size` |

**Neural Architectures:**
- `transformer`, `cnn`, `rnn`, `gnn`, `hybrid`

**Training Tiers:**
- `nano`, `mini`, `small`, `medium`, `large`

#### Workflow Automation (10 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `workflow_create` | Create workflow | `name`, `steps`, `triggers`, `priority` |
| `workflow_execute` | Execute workflow | `workflow_id`, `input_data`, `async` |
| `workflow_status` | Get status | `workflow_id`, `execution_id` |
| `workflow_list` | List workflows | `status`, `limit`, `offset` |
| `workflow_agent_assign` | Assign agent | `task_id`, `agent_type` |
| `workflow_queue_status` | Queue status | `queue_name` |
| `workflow_audit_trail` | Audit trail | `workflow_id`, `limit` |
| `workflow_pause` | Pause workflow | `workflow_id` |
| `workflow_resume` | Resume workflow | `workflow_id` |
| `workflow_cancel` | Cancel workflow | `workflow_id` |

#### Template & App Store (8 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `template_list` | List templates | `category`, `featured`, `limit` |
| `template_get` | Get template | `template_id` |
| `template_deploy` | Deploy template | `template_id`, `variables`, `env_vars` |
| `app_store_list_templates` | List apps | `category`, `tags`, `limit` |
| `app_store_publish_app` | Publish app | `name`, `description`, `category`, `source_code` |
| `app_get` | Get app details | `app_id` |
| `app_update` | Update app | `app_id`, `updates` |
| `app_search` | Search apps | `search`, `category`, `featured` |

#### Challenges & Gamification (8 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `challenges_list` | List challenges | `difficulty`, `category`, `status` |
| `challenge_get` | Get challenge | `challenge_id` |
| `challenge_submit` | Submit solution | `challenge_id`, `user_id`, `solution_code`, `language` |
| `app_store_complete_challenge` | Complete challenge | `challenge_id`, `user_id`, `submission_data` |
| `leaderboard_get` | Get leaderboard | `type`, `challenge_id`, `limit` |
| `achievements_list` | List achievements | `user_id`, `category` |
| `app_store_earn_ruv` | Earn credits | `user_id`, `amount`, `reason`, `source` |
| `ruv_balance` | Check balance | `user_id` |

#### Credits & Payments (4 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `check_balance` | Check balance | - |
| `create_payment_link` | Purchase credits | `amount` |
| `configure_auto_refill` | Auto refill | `enabled`, `threshold`, `amount` |
| `get_payment_history` | Get history | `limit` |

#### Storage (4 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `storage_upload` | Upload file | `bucket`, `path`, `content`, `content_type` |
| `storage_delete` | Delete file | `bucket`, `path` |
| `storage_list` | List files | `bucket`, `path`, `limit` |
| `storage_get_url` | Get public URL | `bucket`, `path`, `expires_in` |

#### Real-time & Monitoring (6 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `execution_stream_subscribe` | Subscribe to stream | `stream_type`, `sandbox_id` |
| `execution_stream_status` | Stream status | `stream_id` |
| `execution_files_list` | List files | `stream_id`, `file_type` |
| `execution_file_get` | Get file | `file_id`, `file_path` |
| `realtime_subscribe` | DB subscribe | `table`, `event`, `filter` |
| `realtime_unsubscribe` | Unsubscribe | `subscription_id` |

#### System (4 tools)
| Tool | Description | Parameters |
|------|-------------|------------|
| `auth_status` | Auth status | `detailed` |
| `auth_init` | Init auth | `mode` |
| `system_health` | System health | - |
| `audit_log` | Audit log | `user_id`, `limit` |

#### AI Assistant (1 tool)
| Tool | Description | Parameters |
|------|-------------|------------|
| `seraphina_chat` | Chat with Queen Seraphina | `message`, `conversation_history`, `enable_tools` |

### CLI Commands

```bash
# Project management
npx flow-nexus init                    # Create new project
npx flow-nexus status                  # Project status

# Authentication
npx flow-nexus auth register -e EMAIL -p PASSWORD
npx flow-nexus auth login -e EMAIL -p PASSWORD
npx flow-nexus auth status

# Swarm management
npx flow-nexus swarm create mesh       # Create mesh swarm
npx flow-nexus swarm list              # List swarms
npx flow-nexus swarm status <id>       # Swarm status

# Sandbox operations
npx flow-nexus sandbox create          # Create sandbox
npx flow-nexus sandbox list            # List sandboxes
npx flow-nexus sandbox logs <id>       # View logs

# Challenges
npx flow-nexus challenge list          # List challenges
npx flow-nexus challenge get <id>      # Challenge details
npx flow-nexus challenge submit <id>   # Submit solution

# Templates
npx flow-nexus template list           # List templates
npx flow-nexus template deploy <id>    # Deploy template

# Credits
npx flow-nexus credits balance         # Check balance
npx flow-nexus credits history         # Transaction history

# AI Assistant
npx flow-nexus seraphina "How do I create a swarm?"

# MCP server
npx flow-nexus mcp start               # Start MCP server

# Interactive mode
npx flow-nexus                         # Launch interactive menu
```

### Credit Costs

| Operation | Cost (rUv) |
|-----------|------------|
| Swarm Init | 10 |
| Agent Spawn | 3 |
| Sandbox Create | 1 |
| Code Execute | 2 |
| Neural Small | 10 |
| Neural Large | 50 |
| Queen Seraphina (Basic) | 2 |
| Template Deploy | 2 |
| Challenge Submit | 2 |
| Workflow Template | 8 |

**Free Operations:** Auth, profile, status checks, browsing, leaderboards

**Earning Credits:**
- Daily login: 100 rUv
- Challenge 1st place: 500 rUv
- Challenge 2nd place: 300 rUv
- Publisher badge: 100 rUv

### Usage Examples

#### Deploy AI Code Review Swarm
```javascript
// Initialize swarm
const swarm = await mcp__flow_nexus__swarm_init({
  topology: 'hierarchical',
  maxAgents: 5,
  strategy: 'specialized'
});

// Spawn specialized agents
await mcp__flow_nexus__agent_spawn({ type: 'analyst', name: 'code-analyzer' });
await mcp__flow_nexus__agent_spawn({ type: 'reviewer', name: 'quality-checker' });
await mcp__flow_nexus__agent_spawn({ type: 'optimizer', name: 'perf-optimizer' });

// Orchestrate review task
await mcp__flow_nexus__task_orchestrate({
  task: 'Review PR #123 for security, performance, and code quality',
  strategy: 'parallel',
  priority: 'high',
  maxAgents: 3
});
```

#### Create Development Sandbox
```javascript
const sandbox = await mcp__flow_nexus__sandbox_create({
  template: 'nextjs',
  name: 'my-app-dev',
  env_vars: {
    DATABASE_URL: 'postgres://...',
    API_KEY: 'sk-...'
  },
  install_packages: ['prisma', '@tanstack/react-query'],
  timeout: 3600
});

// Execute setup
await mcp__flow_nexus__sandbox_execute({
  sandbox_id: sandbox.id,
  code: 'npx prisma migrate dev',
  language: 'bash'
});
```

#### Distributed Neural Training
```javascript
// Initialize cluster
const cluster = await mcp__flow_nexus__neural_cluster_init({
  name: 'ml-training',
  architecture: 'transformer',
  topology: 'mesh',
  consensus: 'proof-of-learning',
  wasmOptimization: true
});

// Deploy worker nodes
await mcp__flow_nexus__neural_node_deploy({
  cluster_id: cluster.id,
  role: 'worker',
  model: 'large',
  capabilities: ['training', 'inference']
});

// Start training
await mcp__flow_nexus__neural_train_distributed({
  cluster_id: cluster.id,
  dataset: 'training_data.json',
  epochs: 50,
  batch_size: 32,
  learning_rate: 0.001,
  federated: true
});
```

---

## 5. @ruvector/agentic-synth v0.1.6

### Description
Self-learning synthetic data generator for AI/ML applications. Generates realistic synthetic data at scale using neural architecture that learns from patterns, supporting 37+ data types across multiple domains including healthcare, finance, and e-commerce.

### Installation

```bash
npm install @ruvector/agentic-synth
# or
npm install ruvector  # All-in-one package
```

### Complete API Reference

#### Core Generator Class

```javascript
import { AgenticSynth, createGenerator } from '@ruvector/agentic-synth';

// Quick creation
const generator = await createGenerator({
  domain: 'healthcare',
  schema: patientSchema
});

// Full configuration
const synth = new AgenticSynth({
  domain: 'finance',
  learningEnabled: true,
  embeddingModel: 'all-MiniLM-L6-v2',
  cachePatterns: true
});

await synth.initialize();
```

#### Data Generation

```javascript
// Generate single record
const patient = await generator.generate({
  type: 'patient',
  constraints: {
    age: { min: 18, max: 65 },
    gender: 'female',
    conditions: ['diabetes']
  }
});

// Batch generation
const patients = await generator.generateBatch({
  type: 'patient',
  count: 1000,
  constraints: {...},
  diversity: 0.8  // Variation factor
});

// Generate with relationships
const family = await generator.generateRelated({
  primary: { type: 'patient', id: 'patient-1' },
  relations: [
    { type: 'prescription', count: 5 },
    { type: 'lab_result', count: 10 },
    { type: 'visit', count: 3 }
  ]
});
```

#### Domain-Specific Generators

```javascript
// Healthcare
const healthcareGen = await createGenerator({ domain: 'healthcare' });
const fhirBundle = await healthcareGen.generateFHIR({
  resourceType: 'Patient',
  count: 100,
  includeConditions: true,
  includeMedications: true,
  includeProcedures: true
});

// Finance
const financeGen = await createGenerator({ domain: 'finance' });
const transactions = await financeGen.generateTransactions({
  accountType: 'checking',
  dateRange: { start: '2024-01-01', end: '2024-12-31' },
  count: 500,
  includeAnomalies: true,
  anomalyRate: 0.02
});

// E-commerce
const ecommerceGen = await createGenerator({ domain: 'ecommerce' });
const orders = await ecommerceGen.generateOrders({
  count: 200,
  includeProducts: true,
  includeCustomers: true,
  includeReviews: true
});
```

#### Schema Definition

```javascript
const patientSchema = {
  name: 'Patient',
  fields: [
    { name: 'id', type: 'uuid' },
    { name: 'firstName', type: 'firstName' },
    { name: 'lastName', type: 'lastName' },
    { name: 'dateOfBirth', type: 'date', constraints: { min: '1940-01-01', max: '2006-01-01' } },
    { name: 'gender', type: 'enum', values: ['male', 'female', 'other'] },
    { name: 'ssn', type: 'ssn', mask: true },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'phone', format: 'US' },
    { name: 'address', type: 'address', country: 'US' },
    { name: 'insurance', type: 'object', schema: insuranceSchema },
    { name: 'conditions', type: 'array', items: { type: 'icd10Code' } }
  ],
  relationships: [
    { name: 'encounters', target: 'Encounter', type: 'hasMany' },
    { name: 'medications', target: 'Medication', type: 'hasMany' }
  ]
};

const generator = await createGenerator({ schema: patientSchema });
```

#### Self-Learning (SONA)

```javascript
// Enable learning
const synth = new AgenticSynth({
  learningEnabled: true,
  learningRate: 0.01
});

// Learn from real data patterns
await synth.learnPatterns({
  data: realDataset,
  fields: ['price', 'quantity', 'category'],
  correlations: true
});

// Generate with learned patterns
const synthetic = await synth.generate({
  count: 1000,
  useLearnedPatterns: true
});

// Export learned model
await synth.exportModel('patterns.json');

// Import model
await synth.importModel('patterns.json');
```

#### Embedding & Semantic Generation

```javascript
// Generate semantically similar data
const similar = await synth.generateSimilar({
  reference: existingDocument,
  count: 10,
  similarity: 0.85,  // Cosine similarity threshold
  embeddingModel: 'all-MiniLM-L6-v2'
});

// Generate with semantic constraints
const docs = await synth.generateWithConstraints({
  type: 'document',
  semanticConstraints: {
    topic: 'machine learning',
    sentiment: 'positive',
    readingLevel: 'technical'
  },
  count: 50
});
```

### Supported Data Types (37+)

| Category | Types |
|----------|-------|
| Identity | `uuid`, `firstName`, `lastName`, `fullName`, `email`, `phone`, `ssn`, `passport` |
| Location | `address`, `city`, `state`, `country`, `zipCode`, `latitude`, `longitude` |
| DateTime | `date`, `time`, `datetime`, `timestamp`, `duration` |
| Finance | `currency`, `creditCard`, `iban`, `bitcoin`, `price`, `quantity` |
| Healthcare | `icd10Code`, `cptCode`, `ndc`, `fhirResource`, `hl7Message` |
| Text | `sentence`, `paragraph`, `article`, `summary`, `keywords` |
| Technical | `ipAddress`, `macAddress`, `userAgent`, `httpMethod`, `statusCode` |
| Business | `company`, `jobTitle`, `department`, `product`, `sku` |
| Numeric | `integer`, `float`, `percentage`, `currency`, `distribution` |

### Configuration Options

```javascript
const config = {
  // Domain
  domain: 'healthcare',  // healthcare | finance | ecommerce | generic

  // Schema
  schema: customSchema,

  // Learning
  learningEnabled: true,
  learningRate: 0.01,
  patternRetention: 0.95,

  // Embedding
  embeddingModel: 'all-MiniLM-L6-v2',
  embeddingDimensions: 384,

  // Performance
  batchSize: 100,
  cachePatterns: true,
  cacheSize: 10000,

  // Output
  format: 'json',  // json | csv | parquet | fhir
  compress: false,

  // Privacy
  maskPII: true,
  anonymize: ['ssn', 'email']
};
```

### CLI Commands

```bash
# Generate data
agentic-synth generate --schema patient.json --count 1000 --output data.json

# Generate FHIR bundle
agentic-synth fhir --resource Patient --count 100 --output patients.json

# Learn from data
agentic-synth learn --input real_data.csv --output model.json

# Generate with model
agentic-synth generate --model model.json --count 500 --output synthetic.json

# Validate output
agentic-synth validate --data synthetic.json --schema patient.json
```

### Performance Benchmarks

| Operation | Records | Time |
|-----------|---------|------|
| Generate 100 | 100 | 1ms |
| Generate 1,000 | 1,000 | 8ms |
| Generate 10,000 | 10,000 | 65ms |
| Generate 50,000 | 50,000 | 215ms |
| FHIR Bundle (100) | 100 | 15ms |
| Learn Patterns | 10,000 | 2s |

---

## 6. PostgreSQL SQL Functions Reference

### Complete Function Categories (77+ Functions)

#### Core Vector Operations (10 functions)

```sql
-- Distance functions
rv_l2_distance(a ruvector, b ruvector) -> float8
rv_cosine_distance(a ruvector, b ruvector) -> float8
rv_inner_product(a ruvector, b ruvector) -> float8
rv_manhattan_distance(a ruvector, b ruvector) -> float8

-- Vector arithmetic
rv_add(a ruvector, b ruvector) -> ruvector
rv_subtract(a ruvector, b ruvector) -> ruvector
rv_multiply(v ruvector, scalar float8) -> ruvector
rv_divide(v ruvector, scalar float8) -> ruvector
rv_normalize(v ruvector) -> ruvector
rv_magnitude(v ruvector) -> float8
```

#### Hyperbolic Geometry (8 functions)

```sql
-- Poincare ball model
rv_poincare_distance(a ruvector, b ruvector) -> float8
rv_mobius_add(a ruvector, b ruvector) -> ruvector
rv_mobius_scalar(v ruvector, scalar float8) -> ruvector
rv_exp_map_poincare(base ruvector, tangent ruvector) -> ruvector
rv_log_map_poincare(base ruvector, target ruvector) -> ruvector

-- Lorentz model
rv_lorentz_distance(a ruvector, b ruvector) -> float8
rv_lorentz_inner(a ruvector, b ruvector) -> float8
rv_geodesic(a ruvector, b ruvector, t float8) -> ruvector
```

#### Sparse Vectors & BM25 (14 functions)

```sql
-- Sparse vector operations
rv_sparse_create(indices int[], values float8[]) -> sparsevec
rv_sparse_dot(a sparsevec, b sparsevec) -> float8
rv_sparse_magnitude(v sparsevec) -> float8
rv_sparse_add(a sparsevec, b sparsevec) -> sparsevec
rv_sparse_to_dense(v sparsevec, dim int) -> ruvector

-- Text scoring
rv_bm25_score(query text, document text) -> float8
rv_bm25_score_batch(query text, documents text[]) -> float8[]
rv_tfidf_vector(document text) -> sparsevec
rv_tfidf_similarity(a text, b text) -> float8

-- Tokenization
rv_tokenize(text text) -> text[]
rv_ngrams(text text, n int) -> text[]
rv_stemmer(word text, language text) -> text
rv_stopwords_remove(tokens text[], language text) -> text[]
rv_word_frequency(document text) -> jsonb
```

#### Attention Mechanisms (39 functions)

```sql
-- Core attention
rv_scaled_dot_attention(q ruvector, k ruvector, v ruvector) -> ruvector
rv_multi_head_attention(q ruvector, k ruvector, v ruvector, heads int) -> ruvector
rv_flash_attention(q ruvector, k ruvector, v ruvector) -> ruvector

-- Efficient attention variants
rv_linear_attention(q ruvector, k ruvector, v ruvector, kernel text) -> ruvector
rv_sparse_attention(q ruvector, k ruvector, v ruvector, pattern jsonb) -> ruvector
rv_performer_attention(q ruvector, k ruvector, v ruvector, features int) -> ruvector
rv_linformer_attention(q ruvector, k ruvector, v ruvector, k_dim int) -> ruvector
rv_longformer_attention(q ruvector, k ruvector, v ruvector, window int) -> ruvector

-- Positional attention
rv_rotary_attention(q ruvector, k ruvector, v ruvector, dim int) -> ruvector
rv_alibi_attention(q ruvector, k ruvector, v ruvector, slopes float8[]) -> ruvector
rv_relative_attention(q ruvector, k ruvector, v ruvector, positions int[]) -> ruvector

-- Causal/Masked attention
rv_causal_attention(q ruvector, k ruvector, v ruvector) -> ruvector
rv_sliding_window_attention(q ruvector, k ruvector, v ruvector, window int) -> ruvector
rv_local_attention(q ruvector, k ruvector, v ruvector, block_size int) -> ruvector

-- Cross attention
rv_cross_attention(q ruvector, k_ext ruvector, v_ext ruvector) -> ruvector
rv_gated_attention(q ruvector, k ruvector, v ruvector, gate ruvector) -> ruvector

-- Graph attention
rv_graph_attention(nodes ruvector[], adjacency int[][]) -> ruvector[]
rv_hyperbolic_attention(q ruvector, k ruvector, v ruvector, curvature float8) -> ruvector
```

#### GNN Functions (5 functions)

```sql
rv_gcn_layer(features ruvector[], adjacency float8[][], weights float8[][]) -> ruvector[]
rv_sage_layer(features ruvector[], neighbors int[][], aggregator text) -> ruvector[]
rv_gat_layer(features ruvector[], adjacency float8[][], attention_weights float8[]) -> ruvector[]
rv_message_pass(graph jsonb, messages ruvector[], aggregate_fn text) -> ruvector[]
rv_graph_pool(node_features ruvector[], pool_type text) -> ruvector
```

#### Agent Routing - Tiny Dancer (11 functions)

```sql
rv_route_query(query ruvector, agents jsonb) -> jsonb
rv_agent_affinity(query ruvector, agent_embedding ruvector) -> float8
rv_update_agent_embedding(agent_id text, embedding ruvector) -> boolean
rv_list_agents() -> jsonb
rv_register_agent(agent_id text, embedding ruvector, capabilities jsonb) -> boolean
rv_unregister_agent(agent_id text) -> boolean
rv_adaptive_route(query ruvector, context jsonb) -> jsonb
rv_route_with_fallback(query ruvector, agents jsonb, fallback text) -> jsonb
rv_batch_route(queries ruvector[], agents jsonb) -> jsonb[]
rv_route_history(agent_id text, limit int) -> jsonb
rv_agent_stats(agent_id text) -> jsonb
```

#### Local Embeddings (6 functions)

```sql
rv_embed(text text, model text DEFAULT 'all-MiniLM-L6-v2') -> ruvector
rv_embed_batch(texts text[], model text) -> ruvector[]
rv_list_embedding_models() -> jsonb
rv_embedding_dimensions(model text) -> int
rv_embedding_info(model text) -> jsonb
rv_preload_model(model text) -> boolean

-- Available models:
-- all-MiniLM-L6-v2 (384d) - Fast, general-purpose
-- bge-small-en-v1.5 (384d) - MTEB top performer
-- bge-base-en-v1.5 (768d) - Balanced
-- bge-large-en-v1.5 (1024d) - Highest accuracy
-- nomic-embed-text-v1 (768d) - Long context (8192 tokens)
-- nomic-embed-text-v1.5 (768d) - Improved long context
```

#### Self-Learning / ReasoningBank (7 functions)

```sql
rv_adaptive_search(context ruvector, query text) -> jsonb
rv_record_trajectory(action text, outcome text, context jsonb) -> boolean
rv_train_patterns(data jsonb) -> boolean
rv_get_recommendation(context text) -> jsonb
rv_pattern_confidence(pattern_id text) -> float8
rv_prune_patterns(threshold float8) -> int
rv_export_patterns(format text) -> text
```

#### Graph Storage & Cypher (8 functions)

```sql
rv_cypher_query(query text) -> jsonb
rv_create_graph(name text) -> boolean
rv_drop_graph(name text) -> boolean
rv_add_node(graph text, label text, properties jsonb) -> text
rv_add_edge(graph text, from_id text, to_id text, type text, properties jsonb) -> text
rv_shortest_path(graph text, from_id text, to_id text) -> jsonb
rv_pagerank(graph text, iterations int, damping float8) -> jsonb
rv_community_detection(graph text, algorithm text) -> jsonb
```

#### SPARQL & RDF (14 functions)

```sql
-- Query execution
rv_sparql_select(query text, graph text) -> jsonb
rv_sparql_construct(query text, graph text) -> jsonb
rv_sparql_ask(query text, graph text) -> boolean
rv_sparql_describe(uri text, graph text) -> jsonb

-- RDF management
rv_rdf_insert(subject text, predicate text, object text, graph text) -> boolean
rv_rdf_delete(subject text, predicate text, object text, graph text) -> boolean
rv_rdf_update(pattern text, insert_data text, graph text) -> boolean

-- Graph management
rv_rdf_create_graph(name text) -> boolean
rv_rdf_drop_graph(name text) -> boolean
rv_rdf_list_graphs() -> text[]
rv_rdf_graph_size(graph text) -> bigint

-- Import/Export
rv_rdf_import(data text, format text, graph text) -> bigint
rv_rdf_export(graph text, format text) -> text
rv_rdf_clear(graph text) -> boolean
```

---

## 7. Tiered Compression Architecture

### Overview

RuVector implements automatic tiered storage similar to a computer's memory hierarchy. Frequently accessed vectors stay in fast storage while rarely used vectors are automatically compressed to save memory.

### Compression Tiers

| Tier | Access Frequency | Format | Compression | Latency |
|------|-----------------|--------|-------------|---------|
| **Hot** | >80% | f32 | 1x (baseline) | Instant |
| **Warm** | 40-80% | f16 | 2x | <1ms |
| **Cool** | 10-40% | PQ8 | 8x | ~1ms |
| **Cold** | 1-10% | PQ4 | 16x | 1-2ms |
| **Archive** | <1% | Binary | 32x | 2-5ms |

### How It Works

```sql
-- Vectors are automatically promoted/demoted based on access patterns
-- No manual configuration required

-- Example: Insert vector (starts in Hot tier)
INSERT INTO documents (content, embedding)
VALUES ('New document', '[0.1, 0.2, ...]'::ruvector);

-- As access frequency decreases, vector moves to cooler tiers
-- Query performance remains excellent due to intelligent caching
```

### Technical Details

#### Format Specifications

**f32 (Hot)**
- Full IEEE 754 single-precision floats
- 4 bytes per dimension
- Zero compression overhead
- Maximum precision for frequently accessed vectors

**f16 (Warm)**
- IEEE 754 half-precision floats
- 2 bytes per dimension
- 50% memory reduction
- Imperceptible accuracy loss for most use cases

**PQ8 (Cool)**
- Product Quantization with 8-bit centroids
- 256 centroids per subspace
- ~97% accuracy retention
- 8x memory reduction

**PQ4 (Cold)**
- Product Quantization with 4-bit centroids
- 16 centroids per subspace
- ~95% accuracy retention
- 16x memory reduction

**Binary (Archive)**
- 1-bit per dimension
- Hamming distance for initial filtering
- Re-ranking with full precision on final candidates
- 32x memory reduction

### Configuration

```sql
-- View current tier distribution
SELECT rv_tier_stats();

-- Manually set tier thresholds (optional)
SELECT rv_set_tier_config('{
  "hot_threshold": 0.80,
  "warm_threshold": 0.40,
  "cool_threshold": 0.10,
  "cold_threshold": 0.01,
  "promotion_rate": 0.1,
  "demotion_rate": 0.05
}'::jsonb);

-- Force promotion to hot tier
SELECT rv_promote_vector(vector_id, 'hot');

-- Archive rarely used vectors
SELECT rv_archive_old_vectors(interval '30 days');
```

### Memory Savings Example

| Vectors | Hot (f32) | Mixed Tiers | Savings |
|---------|-----------|-------------|---------|
| 1M (384d) | 1.54 GB | 0.19 GB | 88% |
| 10M (384d) | 15.4 GB | 1.9 GB | 88% |
| 100M (384d) | 154 GB | 19 GB | 88% |

---

## 8. ReasoningBank PostgreSQL Persistence

### Overview

ReasoningBank is a self-learning memory system that persists reasoning patterns to SQLite by default. This section covers how to persist ReasoningBank data to PostgreSQL for production deployments.

### Database Schema

```sql
-- Core tables
CREATE TABLE patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    domain TEXT,
    confidence FLOAT8 DEFAULT 0.5,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pattern_embeddings (
    pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
    embedding ruvector(1024),  -- SHA-512 hash vector
    PRIMARY KEY (pattern_id)
);

CREATE TABLE pattern_links (
    source_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
    target_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL,
    strength FLOAT8 DEFAULT 0.5,
    PRIMARY KEY (source_id, target_id, link_type)
);

CREATE TABLE task_trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_query TEXT NOT NULL,
    steps JSONB NOT NULL,
    outcome TEXT CHECK (outcome IN ('success', 'failure')),
    patterns_used UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory tables
CREATE TABLE memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    embedding ruvector(384),
    ttl INTERVAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(namespace, key)
);

CREATE TABLE collective_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    memory_type TEXT NOT NULL,
    content JSONB NOT NULL,
    shared_with TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session tables
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    state JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE session_metrics (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value FLOAT8,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Neural tables
CREATE TABLE neural_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL,
    weights FLOAT8[],
    activations FLOAT8[],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_data JSONB NOT NULL,
    expected_output JSONB,
    actual_output JSONB,
    loss FLOAT8,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_patterns_domain ON patterns(domain);
CREATE INDEX idx_patterns_confidence ON patterns(confidence DESC);
CREATE INDEX idx_patterns_tags ON patterns USING GIN(tags);
CREATE INDEX idx_pattern_embeddings_vector ON pattern_embeddings USING ruhnsw(embedding ruvector_l2_ops);
CREATE INDEX idx_memory_namespace ON memory(namespace);
CREATE INDEX idx_memory_embedding ON memory USING ruhnsw(embedding ruvector_l2_ops);
CREATE INDEX idx_trajectories_outcome ON task_trajectories(outcome);
```

### Integration Code

```javascript
import { ReasoningBank } from 'claude-flow/reasoningbank';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const reasoningBank = new ReasoningBank({
  storage: 'postgres',
  postgres: {
    pool: pool,
    schema: 'reasoningbank'
  },
  embedding: {
    enabled: true,
    model: 'all-MiniLM-L6-v2',
    dimensions: 384
  },
  learning: {
    bayesianUpdates: true,
    successMultiplier: 1.20,
    failureMultiplier: 0.85,
    maxConfidence: 0.95,
    minConfidence: 0.05
  }
});

// Store pattern
await reasoningBank.storePattern({
  key: 'api_retry_pattern',
  content: 'Implement exponential backoff with jitter for API retries',
  domain: 'api-development',
  tags: ['api', 'resilience', 'retry']
});

// Query patterns
const patterns = await reasoningBank.queryPatterns({
  query: 'API error handling',
  domain: 'api-development',
  minConfidence: 0.7,
  limit: 5
});

// Record trajectory
await reasoningBank.recordTrajectory({
  taskQuery: 'Implement rate limiting',
  steps: [
    { action: 'analyze_requirements', result: 'success' },
    { action: 'design_algorithm', result: 'success' },
    { action: 'implement_code', result: 'success' }
  ],
  outcome: 'success',
  patternsUsed: ['rate_limit_token_bucket']
});

// Train patterns from trajectories
await reasoningBank.trainPatterns();
```

### Bayesian Confidence Updates

```sql
-- Update pattern confidence based on outcome
CREATE OR REPLACE FUNCTION update_pattern_confidence(
    pattern_key TEXT,
    outcome TEXT  -- 'success' or 'failure'
) RETURNS VOID AS $$
DECLARE
    current_confidence FLOAT8;
    new_confidence FLOAT8;
BEGIN
    SELECT confidence INTO current_confidence
    FROM patterns WHERE key = pattern_key;

    IF outcome = 'success' THEN
        -- Success multiplier: 1.20, capped at 0.95
        new_confidence := LEAST(current_confidence * 1.20, 0.95);
        UPDATE patterns
        SET confidence = new_confidence,
            success_count = success_count + 1,
            updated_at = NOW()
        WHERE key = pattern_key;
    ELSE
        -- Failure multiplier: 0.85, floored at 0.05
        new_confidence := GREATEST(current_confidence * 0.85, 0.05);
        UPDATE patterns
        SET confidence = new_confidence,
            failure_count = failure_count + 1,
            updated_at = NOW()
        WHERE key = pattern_key;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### Semantic Search with PostgreSQL

```sql
-- Search patterns by semantic similarity
CREATE OR REPLACE FUNCTION search_patterns_semantic(
    query_embedding ruvector,
    domain_filter TEXT DEFAULT NULL,
    min_confidence FLOAT8 DEFAULT 0.5,
    result_limit INT DEFAULT 10
) RETURNS TABLE (
    key TEXT,
    content TEXT,
    confidence FLOAT8,
    similarity FLOAT8
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.key,
        p.content,
        p.confidence,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM patterns p
    JOIN pattern_embeddings pe ON p.id = pe.pattern_id
    WHERE p.confidence >= min_confidence
      AND (domain_filter IS NULL OR p.domain = domain_filter)
    ORDER BY pe.embedding <=> query_embedding
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Docker Deployment Patterns

### RuVector PostgreSQL Docker

```yaml
# docker-compose.yml
version: '3.8'

services:
  ruvector-postgres:
    image: ruvnet/ruvector-postgres:latest
    container_name: ruvector-db
    environment:
      POSTGRES_USER: ruvector
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: vectors
      # Extension configuration
      RUVECTOR_SIMD: auto  # auto | avx512 | avx2 | neon
      RUVECTOR_HNSW_M: 16
      RUVECTOR_HNSW_EF: 100
    ports:
      - "5432:5432"
    volumes:
      - ruvector_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ruvector -d vectors"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

volumes:
  ruvector_data:
```

### Initialization Script

```sql
-- init/01-extensions.sql
CREATE EXTENSION IF NOT EXISTS ruvector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Create default schemas
CREATE SCHEMA IF NOT EXISTS vectors;
CREATE SCHEMA IF NOT EXISTS graphs;
CREATE SCHEMA IF NOT EXISTS agents;

-- Create sample vector table
CREATE TABLE vectors.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding ruvector(384),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index
CREATE INDEX documents_embedding_idx ON vectors.documents
USING ruhnsw (embedding ruvector_l2_ops)
WITH (m = 16, ef_construction = 64);
```

### Multi-Container Architecture

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  ruvector-postgres:
    image: ruvnet/ruvector-postgres:latest
    deploy:
      replicas: 1
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - ruvector-net

  agentdb:
    image: ruvnet/agentdb:latest
    deploy:
      replicas: 2
    environment:
      DATABASE_URL: postgres://ruvector@ruvector-postgres:5432/vectors
      AGENTDB_QUANTIZATION: scalar
    depends_on:
      - ruvector-postgres
    networks:
      - ruvector-net

  flow-nexus:
    image: ruvnet/flow-nexus:latest
    deploy:
      replicas: 1
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://ruvector@ruvector-postgres:5432/vectors
      E2B_API_KEY_FILE: /run/secrets/e2b_key
    secrets:
      - e2b_key
    depends_on:
      - ruvector-postgres
      - agentdb
    networks:
      - ruvector-net

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - flow-nexus
    networks:
      - ruvector-net

secrets:
  db_password:
    external: true
  e2b_key:
    external: true

volumes:
  pgdata:

networks:
  ruvector-net:
    driver: overlay
```

### Kubernetes Deployment

```yaml
# k8s/ruvector-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ruvector-postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ruvector-postgres
  template:
    metadata:
      labels:
        app: ruvector-postgres
    spec:
      containers:
        - name: ruvector-postgres
          image: ruvnet/ruvector-postgres:latest
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: ruvector-secrets
                  key: db-password
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "2Gi"
              cpu: "1000m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
      volumes:
        - name: pgdata
          persistentVolumeClaim:
            claimName: ruvector-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: ruvector-postgres
spec:
  selector:
    app: ruvector-postgres
  ports:
    - port: 5432
      targetPort: 5432
  type: ClusterIP
```

---

## 10. Integration Patterns

### Full Stack Integration

```javascript
// Full RuvNet ecosystem integration
import { createVectorDB } from 'agentdb';
import { AgenticSynth } from '@ruvector/agentic-synth';
import { Pool } from 'pg';

// PostgreSQL with ruvector extension
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// AgentDB for fast in-memory operations
const agentdb = await createVectorDB({
  path: './agent-memory.db',
  dimensions: 384,
  quantization: 'scalar'
});

// Synthetic data generator
const synth = new AgenticSynth({
  domain: 'generic',
  learningEnabled: true
});

// Hybrid search: AgentDB for real-time, PostgreSQL for persistence
async function hybridSearch(query, embedding) {
  // Fast search in AgentDB
  const agentResults = await agentdb.search({
    query: embedding,
    k: 5
  });

  // Persistent search in PostgreSQL
  const pgResults = await pool.query(`
    SELECT id, content, embedding <=> $1 AS distance
    FROM documents
    ORDER BY distance
    LIMIT 5
  `, [JSON.stringify(embedding)]);

  // Merge and deduplicate
  return mergeResults(agentResults, pgResults.rows);
}

// Generate synthetic training data
async function generateTrainingData(schema, count) {
  const synthetic = await synth.generateBatch({
    schema: schema,
    count: count,
    diversity: 0.8
  });

  // Insert into PostgreSQL
  for (const record of synthetic) {
    await pool.query(`
      INSERT INTO training_data (input, expected_output)
      VALUES ($1, $2)
    `, [record.input, record.output]);
  }

  return synthetic;
}
```

### MCP Server Orchestration

```javascript
// Coordinating multiple MCP servers
async function orchestrateAgents(task) {
  // Initialize swarm via Flow Nexus
  const swarm = await mcp__flow_nexus__swarm_init({
    topology: 'hierarchical',
    maxAgents: 5,
    strategy: 'specialized'
  });

  // Spawn agents
  const researcher = await mcp__flow_nexus__agent_spawn({
    type: 'researcher',
    capabilities: ['web_search', 'document_analysis']
  });

  const coder = await mcp__flow_nexus__agent_spawn({
    type: 'coder',
    capabilities: ['code_generation', 'refactoring']
  });

  // Store context in AgentDB
  await agentdb.insert({
    id: `task-${Date.now()}`,
    embedding: await embed(task),
    metadata: { task, swarm_id: swarm.id, agents: [researcher.id, coder.id] }
  });

  // Orchestrate task
  const result = await mcp__flow_nexus__task_orchestrate({
    task: task,
    strategy: 'parallel',
    priority: 'high',
    maxAgents: 2
  });

  // Persist result patterns to PostgreSQL ReasoningBank
  await pool.query(`
    INSERT INTO patterns (key, content, domain, confidence)
    VALUES ($1, $2, $3, $4)
  `, [
    `task-${Date.now()}`,
    JSON.stringify(result),
    'task_completion',
    0.8
  ]);

  return result;
}
```

### Browser + Edge Integration

```javascript
// RvLite in browser + AgentDB on edge
import { RvLite } from '@rvlite/wasm';

// Browser-side vector operations
const browserDB = await RvLite.create({
  path: ':memory:',
  dimensions: 384
});

// Edge function (Cloudflare Workers)
export default {
  async fetch(request, env) {
    // Initialize edge AgentDB
    const edgeDB = await createVectorDB({
      path: ':memory:',
      dimensions: 384
    });

    const { query, embedding } = await request.json();

    // Fast vector search on edge
    const results = await edgeDB.search({
      query: embedding,
      k: 10
    });

    // Fallback to origin PostgreSQL for comprehensive search
    if (results.length < 10) {
      const pgResults = await env.DB.prepare(`
        SELECT * FROM rv_search_vectors($1, 10)
      `).bind(JSON.stringify(embedding)).all();

      results.push(...pgResults);
    }

    return new Response(JSON.stringify(results));
  }
};
```

---

## Sources and References

### Official Documentation
- [RuVector GitHub Repository](https://github.com/ruvnet/ruvector)
- [AgentDB Website](https://agentdb.ruv.io/)
- [Flow Nexus GitHub](https://github.com/ruvnet/flow-nexus)
- [Claude Flow GitHub](https://github.com/ruvnet/claude-flow)

### NPM Packages
- [@ruvector/postgres-cli](https://www.npmjs.com/package/@ruvector/postgres-cli)
- [agentdb](https://www.npmjs.com/package/agentdb)
- [flow-nexus](https://www.npmjs.com/package/flow-nexus)
- [ruvector](https://www.npmjs.com/package/ruvector)

### Research Papers
- [ReasoningBank: Scaling Agent Self-Evolving with Reasoning Memory](https://arxiv.org/abs/2509.25140) - Google DeepMind

### Related Resources
- [RuVector Postgres Crate](https://crates.io/crates/ruvector-postgres)
- [Agentic Synth on Apify](https://apify.com/ruv/ai-synthetic-data-generator)
- [Claude Flow Integration Guide](https://github.com/ruvnet/claude-flow/issues/732)

---

*Documentation compiled: 2025-12-28*
*Last verified versions: rvlite v0.2.4, postgres-cli v0.2.6, agentdb v1.6.1, flow-nexus v0.1.128, agentic-synth v0.1.6*
