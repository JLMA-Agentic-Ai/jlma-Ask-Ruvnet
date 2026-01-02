# RuVector-Postgres Complete Reference v0.2.6

Updated: 2026-01-02 10:00:00 EST | Version 1.0.0
Created: 2026-01-02 10:00:00 EST

> **290+ SQL Functions** for vector operations, embeddings, attention mechanisms, GNN layers, graph/RDF storage, and self-learning - all within PostgreSQL.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Docker Deployment](#docker-deployment)
3. [Vector Types & Operators](#vector-types--operators)
4. [Index Types (HNSW & IVFFlat)](#index-types-hnsw--ivfflat)
5. [Core Functions](#core-functions)
6. [Local Embeddings](#local-embeddings)
7. [Sparse Vectors](#sparse-vectors)
8. [Hyperbolic Geometry](#hyperbolic-geometry)
9. [Attention Mechanisms](#attention-mechanisms)
10. [Graph Neural Networks](#graph-neural-networks)
11. [Graph Storage & Cypher](#graph-storage--cypher)
12. [SPARQL & RDF](#sparql--rdf)
13. [Agent Routing](#agent-routing)
14. [Self-Learning](#self-learning)
15. [Quantization](#quantization)
16. [Hybrid Search](#hybrid-search)
17. [Multi-Tenancy](#multi-tenancy)
18. [Self-Healing](#self-healing)
19. [SIMD Acceleration](#simd-acceleration)
20. [Schema Isolation](#schema-isolation)
21. [Performance Tuning](#performance-tuning)
22. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 5-Minute Setup

```bash
# 1. Start PostgreSQL with RuVector
docker run -d --name ruvector-pg \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  ruvnet/ruvector-postgres:latest

# 2. Connect
PGPASSWORD=secret psql -h localhost -p 5432 -U postgres
```

```sql
-- 3. Enable extension
CREATE EXTENSION ruvector;

-- 4. Create table with vectors
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding ruvector(384)
);

-- 5. Add index
CREATE INDEX ON documents USING ruhnsw (embedding ruvector_cosine_ops);

-- 6. Insert with auto-embedding
INSERT INTO documents (content, embedding)
VALUES ('Hello world', ruvector_embed('Hello world'));

-- 7. Search
SELECT content, embedding <=> ruvector_embed('greeting')::ruvector AS distance
FROM documents ORDER BY distance LIMIT 5;
```

---

## Docker Deployment

### Basic Run

```bash
docker run -d --name ruvector-pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_USER=ruvector \
  -e POSTGRES_DB=vectordb \
  -p 5432:5432 \
  -v ruvector_data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  ruvector-postgres:
    image: ruvnet/ruvector-postgres:latest
    container_name: ruvector-pg
    environment:
      POSTGRES_USER: ruvector
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secret}
      POSTGRES_DB: vectordb
    ports:
      - "5432:5432"
    volumes:
      - ruvector_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ruvector"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  ruvector_data:
```

### With Persistent Knowledge Base

```bash
# For project-specific KB on port 5435
docker run -d --name project-kb \
  --restart=always \
  -e POSTGRES_PASSWORD=guruKB2025 \
  -p 5435:5432 \
  -v ruvector-kb-data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest
```

---

## Vector Types & Operators

### Data Types

| Type | Description | Storage |
|------|-------------|---------|
| `ruvector(n)` | Dense float32 vector | 8 + 4×n bytes |
| `halfvec(n)` | Half-precision float16 | 8 + 2×n bytes |
| `sparsevec(n)` | Sparse (index:value) | 12 + 8×nnz bytes |

### Distance Operators

| Operator | Metric | Use Case |
|----------|--------|----------|
| `<->` | L2 (Euclidean) | Image embeddings |
| `<=>` | Cosine | Text embeddings |
| `<#>` | Inner Product | Normalized vectors |
| `<+>` | Manhattan (L1) | Sparse features |

### Usage Examples

```sql
-- Cosine similarity search (text embeddings)
SELECT id, content, embedding <=> query_vec::ruvector AS distance
FROM documents
ORDER BY distance LIMIT 10;

-- L2 distance search (image embeddings)
SELECT id, embedding <-> query_vec::ruvector AS distance
FROM images
ORDER BY distance LIMIT 10;

-- Convert between types
SELECT vector::ruvector(384);  -- Cast to specific dimension
SELECT vector::halfvec(384);   -- Convert to half precision
```

---

## Index Types (HNSW & IVFFlat)

### HNSW Index (Recommended)

Best for: High recall, fast queries, <10M vectors

```sql
-- Create HNSW index
CREATE INDEX idx_docs_hnsw ON documents
USING ruhnsw (embedding ruvector_cosine_ops)
WITH (m = 16, ef_construction = 100);

-- Set search quality at query time
SET ruvector.ef_search = 100;
```

**Parameters:**

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `m` | 16 | 4-64 | More = better recall, more memory |
| `ef_construction` | 100 | 16-500 | More = better index, slower build |
| `ef_search` | 40 | 10-1000 | More = better recall, slower query |

**Presets:**

```sql
-- High Recall (>99%)
CREATE INDEX idx_high ON docs USING ruhnsw (embedding ruvector_cosine_ops)
WITH (m = 32, ef_construction = 200);
SET ruvector.ef_search = 200;

-- Balanced (95-99%) - DEFAULT
CREATE INDEX idx_balanced ON docs USING ruhnsw (embedding ruvector_cosine_ops)
WITH (m = 16, ef_construction = 100);
SET ruvector.ef_search = 64;

-- Fast (<95%)
CREATE INDEX idx_fast ON docs USING ruhnsw (embedding ruvector_cosine_ops)
WITH (m = 8, ef_construction = 50);
SET ruvector.ef_search = 20;
```

### IVFFlat Index

Best for: Large datasets (>10M vectors), lower memory

```sql
-- Create IVFFlat index
CREATE INDEX idx_docs_ivf ON documents
USING ruivfflat (embedding ruvector_cosine_ops)
WITH (lists = 100);

-- Set probes at query time
SET ruvector.ivfflat_probes = 10;
```

**List count by dataset size:**

| Vectors | Lists |
|---------|-------|
| 10K | 30-50 |
| 100K | 100-400 |
| 1M | 300-1200 |
| 10M | 1000-4000 |

---

## Core Functions

### Distance Functions

```sql
-- Array-based (native PostgreSQL arrays)
SELECT cosine_distance_arr(a::real[], b::real[]);
SELECT l2_distance_arr(a::real[], b::real[]);
SELECT inner_product_arr(a::real[], b::real[]);

-- Vector-based
SELECT ruvector_distance(a, b, 'cosine');  -- 'cosine' | 'l2' | 'ip'
SELECT ruvector_manhattan_distance(a, b);
```

### Vector Manipulation

```sql
-- Create random vector
SELECT ruvector_random(384);

-- Get dimension
SELECT ruvector_dim(embedding);

-- Normalize to unit length
SELECT ruvector_normalize(embedding);

-- Concatenate vectors
SELECT ruvector_concat(vec_a, vec_b);

-- Mean of vectors
SELECT ruvector_mean(ARRAY_AGG(embedding));

-- Element-wise operations
SELECT ruvector_add(a, b);
SELECT ruvector_scalar_mul(embedding, 2.0);
```

### Vector Information

```sql
-- Get extension version
SELECT ruvector_version();

-- Get SIMD status
SELECT ruvector_simd_info();
-- {"type": "avx2", "width": 256, "enabled": true}

-- Memory statistics
SELECT ruvector_memory_stats();
```

---

## Local Embeddings

Generate embeddings directly in the database - no external API required!

### Functions

```sql
-- Generate embedding (default: all-MiniLM-L6-v2, 384 dims)
SELECT ruvector_embed('Your text here');

-- With specific model
SELECT ruvector_embed('Text', 'bge-large-en-v1.5');

-- Batch embedding
SELECT ruvector_embed_batch(ARRAY['text1', 'text2', 'text3']);

-- List available models
SELECT ruvector_list_models();

-- Get model info
SELECT ruvector_model_info('all-MiniLM-L6-v2');
-- {"dimensions": 384, "max_tokens": 512}

-- Preload model for performance
SELECT ruvector_preload_model('all-MiniLM-L6-v2');
```

### Available Models

| Model | Dimensions | Use Case |
|-------|------------|----------|
| `all-MiniLM-L6-v2` | 384 | Default, fast |
| `bge-small-en-v1.5` | 384 | Retrieval optimized |
| `bge-base-en-v1.5` | 768 | Better quality |
| `bge-large-en-v1.5` | 1024 | Best quality |
| `nomic-embed-text-v1.5` | 768 | 8192 token context |

### Auto-Embed Pattern

```sql
-- Insert with automatic embedding
INSERT INTO documents (title, content, embedding)
VALUES (
  'API Guide',
  'This document explains the API...',
  ruvector_embed('API Guide This document explains the API')
);

-- Trigger for auto-embedding
CREATE OR REPLACE FUNCTION auto_embed() RETURNS TRIGGER AS $$
BEGIN
  NEW.embedding := ruvector_embed(NEW.title || ' ' || NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER embed_on_insert
BEFORE INSERT ON documents
FOR EACH ROW EXECUTE FUNCTION auto_embed();
```

---

## Sparse Vectors

For high-dimensional sparse data (BM25, TF-IDF, etc.)

### Creation

```sql
-- From indices and values
SELECT ruvector_to_sparse(
  ARRAY[0, 5, 10]::int[],        -- indices
  ARRAY[0.5, 0.3, 0.2]::real[],  -- values
  10000                           -- total dimension
);

-- From dense (with threshold)
SELECT ruvector_sparse_from_dense(dense_vec::float4[], 0.01);
```

### Distance Functions

```sql
SELECT ruvector_sparse_dot(a::text, b::text);
SELECT ruvector_sparse_cosine(a::text, b::text);
SELECT ruvector_sparse_euclidean(a::text, b::text);
SELECT ruvector_sparse_manhattan(a::text, b::text);
```

### Text Retrieval (BM25)

```sql
-- BM25 scoring
SELECT ruvector_sparse_bm25(
  query::text,
  doc::text,
  doc_len::int,
  avg_doc_len::float,
  k1::float DEFAULT 1.2,
  b::float DEFAULT 0.75
);

-- TF-IDF
SELECT ruvector_tf_idf(term_freq, doc_freq, total_docs);
```

### Utilities

```sql
SELECT ruvector_sparse_dim(sparse::text);    -- Dimension
SELECT ruvector_sparse_nnz(sparse::text);    -- Non-zero count
SELECT ruvector_sparse_norm(sparse::text);   -- L2 norm
SELECT ruvector_sparse_top_k(sparse::text, 100);  -- Top k values
SELECT ruvector_sparse_prune(sparse::text, 0.01); -- Remove small values
SELECT ruvector_sparse_to_dense(sparse::text);    -- Convert to dense
```

---

## Hyperbolic Geometry

For hierarchical data (taxonomies, ontologies, trees)

### Poincare Ball Model

```sql
-- Distance in Poincare ball
SELECT ruvector_poincare_distance(a::real[], b::real[], -1.0);

-- Mobius addition (translation)
SELECT ruvector_mobius_add(a::real[], b::real[], -1.0);

-- Map tangent vector to manifold
SELECT ruvector_exp_map(base::real[], tangent::real[], -1.0);

-- Map point to tangent space
SELECT ruvector_log_map(base::real[], target::real[], -1.0);
```

### Lorentz (Hyperboloid) Model

```sql
-- Distance in hyperboloid
SELECT ruvector_lorentz_distance(a::real[], b::real[], -1.0);

-- Minkowski inner product
SELECT ruvector_minkowski_dot(a::real[], b::real[]);
```

### Model Conversion

```sql
-- Poincare to Lorentz
SELECT ruvector_poincare_to_lorentz(poincare::real[], -1.0);

-- Lorentz to Poincare
SELECT ruvector_lorentz_to_poincare(lorentz::real[], -1.0);
```

### Use Case: Taxonomy Search

```sql
-- Store taxonomy with hyperbolic embeddings
CREATE TABLE taxonomy (
  id SERIAL PRIMARY KEY,
  name TEXT,
  parent_id INTEGER,
  embedding real[]  -- Hyperbolic embedding
);

-- Find hierarchically similar items
SELECT name, ruvector_poincare_distance(embedding, query_emb, -1.0) AS dist
FROM taxonomy
ORDER BY dist LIMIT 10;
```

---

## Attention Mechanisms

39 transformer-style attention functions for neural operations

### Core Attention

```sql
-- Scaled dot-product attention
SELECT ruvector_attention_scaled_dot(query, keys, values);

-- Multi-head attention
SELECT ruvector_attention_multi_head(query, keys, values, 8);

-- Flash attention (memory-efficient)
SELECT ruvector_attention_flash(query, keys, values, 64);

-- Linear attention (O(n) complexity)
SELECT ruvector_attention_linear(query, keys, values);

-- Causal/masked attention
SELECT ruvector_attention_causal(query, keys, values);
```

### Specialized Attention

```sql
-- Cross-attention
SELECT ruvector_attention_cross(query, context_keys, context_values);

-- Self-attention
SELECT ruvector_attention_self(input, 8);

-- Sparse attention
SELECT ruvector_attention_sparse(query, keys, values, 'local');

-- Graph attention
SELECT ruvector_attention_graph(query, keys, values, edge_index);

-- Rotary position embedding (RoPE)
SELECT ruvector_attention_rope(query, keys, values);
```

### Attention Helpers

```sql
-- Compute attention score
SELECT attention_score(query::real[], key::real[]);

-- Apply softmax
SELECT attention_softmax(scores::real[]);

-- Single attention step
SELECT attention_single(query, key, value, offset);

-- Weighted accumulation
SELECT attention_weighted_add(accumulator, value, weight);

-- Initialize accumulator
SELECT attention_init(384);
```

---

## Graph Neural Networks

5 GNN functions for relational data

### Layer Operations

```sql
-- GCN (Graph Convolutional Network)
SELECT ruvector_gcn_forward(
  features::real[][],
  src_indices::int[],
  dst_indices::int[],
  weights::real[][] DEFAULT NULL,
  output_dim::int
);

-- GraphSAGE
SELECT ruvector_graphsage_forward(
  features::real[][],
  src_indices::int[],
  dst_indices::int[],
  output_dim::int,
  sample_size::int DEFAULT 10
);

-- GAT (Graph Attention Network)
SELECT ruvector_gat_forward(
  features::real[][],
  src_indices::int[],
  dst_indices::int[],
  output_dim::int,
  num_heads::int DEFAULT 8
);
```

### Message Passing

```sql
-- Pass messages along edges
SELECT ruvector_gnn_message_pass(node_features, edge_index, edge_weights);

-- Aggregate messages
SELECT ruvector_gnn_aggregate(messages, 'mean');  -- 'mean' | 'max' | 'sum'
```

---

## Graph Storage & Cypher

Property graph storage with Cypher query language

### Node/Edge Management

```sql
-- Create node
SELECT ruvector_graph_create_node(
  ARRAY['Person', 'Employee'],  -- labels
  '{"name": "Alice", "age": 30}'::jsonb,
  embedding::ruvector
);

-- Create edge
SELECT ruvector_graph_create_edge(
  from_node_id,
  to_node_id,
  'KNOWS',
  '{"since": 2020}'::jsonb
);

-- Get neighbors
SELECT ruvector_graph_get_neighbors(node_id, 'KNOWS', 2);

-- Shortest path
SELECT ruvector_graph_shortest_path(start_id, end_id);

-- PageRank
SELECT ruvector_graph_pagerank('edges_table', 0.85, 100);
```

### Cypher Queries

```sql
-- Execute Cypher
SELECT ruvector_cypher_query('MATCH (n:Person) RETURN n LIMIT 10');

-- Find relationships
SELECT ruvector_cypher_query('MATCH (a)-[r:KNOWS]->(b) RETURN a,r,b');

-- Property filter
SELECT ruvector_cypher_query('MATCH (n {name: "Alice"}) RETURN n');

-- Variable-length paths
SELECT ruvector_cypher_query('MATCH p=(a)-[*1..3]->(b) RETURN p');

-- Create node via Cypher
SELECT ruvector_cypher_query('CREATE (n:Person {name: "Bob"}) RETURN n');
```

### Vector-Enhanced Graph Search

```sql
-- Combine graph traversal with vector similarity
SELECT ruvector_graph_similarity_search(embedding, 'Person', 10);

-- Traverse and rank by vector similarity
SELECT ruvector_graph_traverse(start_node, 'outbound', 3);
```

---

## SPARQL & RDF

W3C-standard semantic web operations

### RDF Store Management

```sql
-- Create store
SELECT ruvector_create_rdf_store('my_ontology');

-- Insert triple
SELECT ruvector_insert_triple(
  'my_ontology',
  'http://example.org/Alice',
  'http://xmlns.com/foaf/0.1/knows',
  'http://example.org/Bob'
);

-- Bulk load N-Triples
SELECT ruvector_load_ntriples('my_ontology', ntriples_data);

-- Store statistics
SELECT ruvector_rdf_stats('my_ontology');

-- Export to N-Triples
SELECT ruvector_export_ntriples('my_ontology');
```

### SPARQL Queries

```sql
-- SELECT query
SELECT ruvector_sparql('my_ontology', '
  SELECT ?person ?name
  WHERE {
    ?person foaf:name ?name .
    ?person foaf:knows ?friend .
  }
', 'json');

-- ASK query (boolean)
SELECT ruvector_sparql_ask('my_ontology', 'ASK { ?s foaf:knows ?o }');

-- CONSTRUCT query
SELECT ruvector_construct_query('my_ontology', sparql);

-- DESCRIBE query
SELECT ruvector_describe_query('my_ontology', 'http://example.org/Alice');

-- UPDATE query
SELECT ruvector_sparql_update('my_ontology', '
  INSERT DATA {
    <http://example.org/Charlie> foaf:name "Charlie" .
  }
');
```

---

## Agent Routing

Route queries to optimal AI agents (Tiny Dancer)

### Agent Management

```sql
-- Register agent
SELECT ruvector_register_agent(
  'gpt-4',           -- name
  'llm',             -- type
  ARRAY['code', 'analysis'],  -- capabilities
  0.03,              -- cost per request
  500.0,             -- avg latency ms
  0.95               -- quality score
);

-- Route to best agent
SELECT ruvector_route(
  embedding::real[],
  'balanced',        -- 'cost' | 'latency' | 'quality' | 'balanced'
  '{"max_cost": 0.1}'::jsonb
);

-- Update metrics after use
SELECT ruvector_update_agent_metrics('gpt-4', 450.0, true, 0.96);

-- List all agents
SELECT * FROM ruvector_list_agents();

-- Find by capability
SELECT * FROM ruvector_find_agents_by_capability('code', 10);

-- Set active/inactive
SELECT ruvector_set_agent_active('gpt-4', true);

-- Routing statistics
SELECT ruvector_routing_stats();

-- Remove agent
SELECT ruvector_remove_agent('old-agent');
```

---

## Self-Learning

ReasoningBank - Adaptive search optimization

### Enable Learning

```sql
-- Enable for table
SELECT ruvector_enable_learning('embeddings', '{
  "max_trajectories": 10000,
  "num_clusters": 50,
  "learning_rate": 0.01,
  "exploration_rate": 0.1
}'::jsonb);
```

### Record Feedback

```sql
-- Record search feedback
SELECT ruvector_record_feedback(
  'embeddings',
  query_vector,
  ARRAY[123, 456, 789],  -- relevant IDs (clicked)
  ARRAY[101, 202]        -- irrelevant IDs (ignored)
);
```

### Get Optimized Parameters

```sql
-- Auto-optimize search params
SELECT ruvector_get_search_params('embeddings', query_vector);
-- {"ef_search": 85, "probes": 12, "confidence": 0.87}

-- Run auto-tuning
SELECT ruvector_auto_tune('embeddings', 'balanced', sample_queries);

-- Get learning statistics
SELECT ruvector_learning_stats('embeddings');

-- Extract learned patterns
SELECT ruvector_extract_patterns('embeddings', 10);
```

---

## Quantization

Reduce memory with compressed vectors

### Binary Quantization (32x compression)

```sql
-- Quantize to binary
SELECT binary_quantize_arr(vector::real[]);
SELECT ruvector_binary_quantize(embedding);

-- Hamming distance for binary vectors
SELECT bit_count(a # b)::int AS hamming_distance;
```

### Scalar Quantization (4x compression)

```sql
-- Quantize to 8-bit integers
SELECT scalar_quantize_arr(vector::real[]);
SELECT ruvector_scalar_quantize(embedding, 8);
```

### Two-Stage Search Pattern

```sql
-- Pre-filter with binary, re-rank with full
WITH candidates AS (
  SELECT id, embedding_full
  FROM embeddings_quantized
  WHERE bit_count(embedding_binary # query_binary) < 50
  LIMIT 100
)
SELECT id, embedding_full <=> query AS distance
FROM candidates
ORDER BY distance LIMIT 10;
```

---

## Hybrid Search

Combine vector similarity with keyword search

### Linear Blending

```sql
-- Alpha blending: alpha × vector + (1-alpha) × keyword
SELECT ruvector_hybrid_linear(vector_results, keyword_results, 0.7);
```

### Reciprocal Rank Fusion

```sql
-- RRF: 1/(k + rank_vector) + 1/(k + rank_keyword)
SELECT ruvector_hybrid_rrf(vector_results, keyword_results, 60);
```

### Combined Search

```sql
-- Single function for hybrid search
SELECT ruvector_hybrid_search(
  'machine learning',      -- keyword query
  ruvector_embed('machine learning'),  -- vector
  'documents',             -- table
  'content',               -- text column
  'embedding',             -- vector column
  10                       -- k
);
```

### Configuration

```sql
-- Get/set parameters
SELECT ruvector_get_hybrid_alpha();
SELECT ruvector_set_hybrid_alpha(0.7);
SELECT ruvector_get_hybrid_rrf_k();
SELECT ruvector_set_hybrid_rrf_k(60);
```

---

## Multi-Tenancy

Row-level isolation with automatic filtering

### Tenant Management

```sql
-- Set current tenant
SELECT ruvector_set_tenant('tenant_123');

-- Get current tenant
SELECT ruvector_get_tenant();

-- Create tenant table
SELECT ruvector_create_tenant_table('documents', schema_definition);

-- List all tenants
SELECT ruvector_list_tenants();

-- Tenant statistics
SELECT ruvector_tenant_stats('tenant_123');

-- Migrate tenant
SELECT ruvector_migrate_tenant('old_tenant', 'new_tenant');

-- Admin cross-tenant query
SELECT ruvector_admin_query_all_tenants('documents', 'SELECT count(*)');
```

### Usage Pattern

```sql
-- All queries automatically filtered by tenant
SELECT ruvector_set_tenant('customer_abc');
SELECT * FROM shared_documents WHERE embedding <=> query < 0.5;
-- Only sees customer_abc's documents
```

---

## Self-Healing

Automated index maintenance and repair

### Health Checks

```sql
-- Check index health
SELECT ruvector_index_health('idx_embeddings_hnsw');
-- {fragmentation: 0.12, connectivity: 0.98, last_repair: ...}

-- Validate connectivity
SELECT ruvector_validate_graph_connectivity('idx');

-- Check for orphaned vectors
SELECT ruvector_check_orphaned_vectors('documents');

-- Check for duplicates
SELECT ruvector_check_duplicate_vectors('documents', 0.99);
```

### Repair Operations

```sql
-- Automatic repair
SELECT ruvector_auto_repair('idx_embeddings_hnsw');

-- Compact index
SELECT ruvector_compact_index('idx');

-- Rebalance HNSW graph
SELECT ruvector_rebalance_hnsw('idx');

-- Rebuild IVF centroids
SELECT ruvector_rebuild_ivf_centroids('idx');
```

### Maintenance Scheduling

```sql
-- Schedule periodic maintenance
SELECT ruvector_schedule_maintenance('idx', '1 day', 0.2);

-- Check healing status
SELECT ruvector_healing_status();

-- Get repair log
SELECT ruvector_last_repair_log('idx');
```

---

## SIMD Acceleration

Automatic CPU optimization

### Supported Instructions

| Set | Platform | Speedup |
|-----|----------|---------|
| AVX-512 | Modern Intel/AMD | 4-8x |
| AVX2 | Intel/AMD (2013+) | 3-4x |
| NEON | ARM/Apple Silicon | 3-4x |
| SSE4.2 | Legacy x86 | 2x |

### Check Status

```sql
SELECT ruvector_simd_info();
-- {"type": "avx2", "width": 256, "enabled": true}
```

### Performance Impact

| Operation | Scalar | With SIMD | Speedup |
|-----------|--------|-----------|---------|
| L2 Distance (1536d) | 140ns | 38ns | 3.7x |
| Cosine Distance | 190ns | 51ns | 3.7x |
| Inner Product | 130ns | 36ns | 3.7x |

---

## Schema Isolation

Per-project knowledge base isolation

### Create Project Schema

```sql
-- Create isolated schema
CREATE SCHEMA IF NOT EXISTS my_project;

-- Create knowledge table
CREATE TABLE my_project.knowledge (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  embedding real[] NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX ON my_project.knowledge
USING hnsw ((embedding::ruvector(384)) ruvector_cosine_ops)
WITH (m = 16, ef_construction = 100);
```

### Search Within Schema

```sql
-- Semantic search in project KB
SELECT
  title,
  content,
  1 - cosine_distance_arr(embedding, ruvector_embed($1)::real[]) AS similarity
FROM my_project.knowledge
WHERE 1 - cosine_distance_arr(embedding, ruvector_embed($1)::real[]) > 0.65
ORDER BY similarity DESC
LIMIT 5;
```

### Cross-Schema Query (Admin)

```sql
-- Query all project schemas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
FROM pg_tables
WHERE tablename = 'knowledge';
```

---

## Performance Tuning

### Benchmarks

| Operation | 10K | 100K | 1M |
|-----------|-----|------|-----|
| HNSW Build | 0.8s | 8.2s | 95s |
| Search (k=10) | 0.3ms | 0.5ms | 1.2ms |
| Insert | 0.1ms | 0.2ms | 0.5ms |

### Memory Estimation

```
HNSW Memory = vectors × dimensions × 4 + vectors × m × 16

1M vectors, 384 dims, m=16:
= 1M × 384 × 4 + 1M × 16 × 16
= 1,536 MB + 256 MB = ~1.8 GB
```

### Optimization Tips

```sql
-- 1. Tune ef_search dynamically
SET ruvector.ef_search = 200;  -- High quality
SET ruvector.ef_search = 20;   -- Fast

-- 2. Use appropriate index
-- HNSW for < 10M vectors
-- IVFFlat for > 10M vectors

-- 3. Filter before vector search
SELECT * FROM docs
WHERE category = 'tech'  -- Pre-filter
ORDER BY embedding <=> query LIMIT 10;

-- 4. Use quantization for memory
SELECT binary_quantize_arr(embedding);

-- 5. Batch insertions
INSERT INTO docs (content, embedding)
SELECT content, ruvector_embed(content)
FROM source_data;  -- Single statement

-- 6. Vacuum regularly
VACUUM ANALYZE docs;
```

---

## Troubleshooting

### Common Issues

**Slow queries:**
```sql
-- Check index is being used
EXPLAIN ANALYZE SELECT * FROM docs ORDER BY embedding <=> query LIMIT 10;

-- Increase ef_search
SET ruvector.ef_search = 100;
```

**Out of memory:**
```sql
-- Use quantization
ALTER TABLE docs ADD COLUMN embedding_binary bit(384);
UPDATE docs SET embedding_binary = binary_quantize_arr(embedding::real[]);

-- Or lower m parameter
DROP INDEX idx_docs;
CREATE INDEX idx_docs ON docs USING ruhnsw (embedding ruvector_cosine_ops)
WITH (m = 8);
```

**Dimension mismatch:**
```sql
-- Check vector dimensions
SELECT ruvector_dim(embedding) FROM docs LIMIT 1;

-- Ensure consistent dimensions
ALTER TABLE docs ADD CONSTRAINT dim_check
CHECK (array_length(embedding, 1) = 384);
```

**Extension not found:**
```sql
-- Check installation
SELECT * FROM pg_extension WHERE extname = 'ruvector';

-- Install if missing
CREATE EXTENSION ruvector;
```

### Health Check Script

```sql
-- Comprehensive health check
SELECT
  ruvector_version() AS version,
  ruvector_simd_info() AS simd,
  (SELECT count(*) FROM pg_indexes WHERE indexdef LIKE '%ruhnsw%') AS hnsw_indexes,
  (SELECT count(*) FROM pg_indexes WHERE indexdef LIKE '%ruivfflat%') AS ivf_indexes;
```

---

## Quick Reference Card

```sql
-- Enable extension
CREATE EXTENSION ruvector;

-- Create table
CREATE TABLE docs (id SERIAL, content TEXT, embedding ruvector(384));

-- Create index
CREATE INDEX ON docs USING ruhnsw (embedding ruvector_cosine_ops);

-- Insert with embedding
INSERT INTO docs (content, embedding)
VALUES ('text', ruvector_embed('text'));

-- Search
SELECT * FROM docs ORDER BY embedding <=> ruvector_embed('query') LIMIT 10;

-- Filter search
SELECT * FROM docs WHERE category = 'x' ORDER BY embedding <=> query LIMIT 10;

-- Set search quality
SET ruvector.ef_search = 100;

-- Hybrid search
SELECT ruvector_hybrid_search('text', embedding, 'docs', 'content', 'embedding', 10);

-- Check health
SELECT ruvector_version(), ruvector_simd_info();
```

---

*RuVector-Postgres v0.2.6 | Documentation v1.0.0 | 2026-01-02*
