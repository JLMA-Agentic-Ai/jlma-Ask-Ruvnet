# RuVector PostgreSQL Functions Reference

## Complete API for ruvector-postgres v0.2.0

This reference documents the 77+ SQL functions available in the RuVector PostgreSQL extension.

---

## Installation

```bash
# Docker (recommended)
docker run -d --name ruvector-pg \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  ruvnet/ruvector-postgres:latest

# Connect
PGPASSWORD=secret psql -h localhost -p 5432 -U postgres

# Enable extension
CREATE EXTENSION IF NOT EXISTS ruvector;
```

---

## Vector Distance Functions

### Operators (pgvector-compatible)

```sql
-- Cosine distance (most common for semantic similarity)
SELECT embedding <=> query_embedding AS cosine_distance FROM items;

-- L2 (Euclidean) distance
SELECT embedding <-> query_embedding AS l2_distance FROM items;

-- Inner product (negative, for normalized vectors)
SELECT embedding <#> query_embedding AS neg_inner_product FROM items;
```

### Distance Functions

```sql
-- Explicit function calls
SELECT ruvector_cosine_distance(a, b);
SELECT ruvector_l2_distance(a, b);
SELECT ruvector_inner_product(a, b);

-- Manhattan distance
SELECT ruvector_l1_distance(a, b);
```

---

## Index Types

### HNSW (Hierarchical Navigable Small World)

Best for: High recall, fast queries

```sql
-- Create HNSW index
CREATE INDEX items_embedding_idx ON items
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Query with ef_search parameter
SET hnsw.ef_search = 100;
SELECT * FROM items ORDER BY embedding <=> query LIMIT 10;
```

Parameters:
- `m`: Max connections per layer (default: 16)
- `ef_construction`: Size of dynamic candidate list (default: 64)
- `ef_search`: Query-time candidate list size (default: 40)

### IVFFlat (Inverted File Flat)

Best for: Large datasets, faster build time

```sql
-- Create IVFFlat index (train on data first)
CREATE INDEX items_embedding_idx ON items
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Query with probes parameter
SET ivfflat.probes = 10;
SELECT * FROM items ORDER BY embedding <=> query LIMIT 10;
```

Parameters:
- `lists`: Number of inverted lists (default: 100)
- `probes`: Lists to search at query time (default: 1)

---

## Hyperbolic Embeddings

For hierarchical data (taxonomies, org charts, trees).

### Poincaré Ball Model

```sql
-- Poincaré distance between two points
SELECT ruvector_poincare_distance(
  embedding_a,
  embedding_b,
  -1.0  -- curvature (negative for hyperbolic)
) AS hyperbolic_dist;

-- Map to Poincaré ball
SELECT ruvector_poincare_exp_map(tangent_vector, base_point, -1.0);

-- Map from Poincaré ball
SELECT ruvector_poincare_log_map(point, base_point, -1.0);

-- Möbius addition (vector addition in hyperbolic space)
SELECT ruvector_poincare_mobius_add(a, b, -1.0);

-- Project to valid Poincaré ball (numerical stability)
SELECT ruvector_poincare_project(point, -1.0);
```

### Lorentz (Hyperboloid) Model

```sql
-- Lorentz distance
SELECT ruvector_lorentz_distance(embedding_a, embedding_b);

-- Convert between models
SELECT ruvector_poincare_to_lorentz(poincare_point, -1.0);
SELECT ruvector_lorentz_to_poincare(lorentz_point, -1.0);
```

### Usage Example

```sql
-- Taxonomy search using hyperbolic embeddings
SELECT 
  name,
  ruvector_poincare_distance(embedding, $query_embedding, -1.0) AS distance
FROM taxonomy_nodes
ORDER BY distance
LIMIT 10;
```

---

## Sparse Vectors

For BM25, TF-IDF, and high-dimensional sparse data.

### Creation

```sql
-- Create from indices, values, dimension
SELECT ruvector_sparse_create(
  ARRAY[0, 5, 10],      -- indices
  ARRAY[0.5, 0.3, 0.2], -- values
  100                    -- total dimension
);

-- Convert dense to sparse (with threshold)
SELECT ruvector_sparse_from_dense(dense_vector, 0.01);

-- Convert sparse to dense
SELECT ruvector_sparse_to_dense(sparse_vector, 100);
```

### Operations

```sql
-- Distance/similarity
SELECT ruvector_sparse_dot(a, b);
SELECT ruvector_sparse_cosine(a, b);
SELECT ruvector_sparse_l2_distance(a, b);

-- Arithmetic
SELECT ruvector_sparse_add(a, b);
SELECT ruvector_sparse_scale(vec, 2.0);
SELECT ruvector_sparse_normalize(vec);

-- Utility
SELECT ruvector_sparse_topk(vec, 10);  -- Top-k elements
SELECT ruvector_sparse_nnz(vec);       -- Non-zero count
```

---

## BM25 / TF-IDF

Text scoring functions for hybrid search.

```sql
-- BM25 score
SELECT ruvector_bm25_score(
  query_terms,     -- ARRAY of query term frequencies
  doc_freqs,       -- ARRAY of document frequencies
  doc_len,         -- Document length
  avg_doc_len,     -- Average document length
  total_docs       -- Total documents in collection
) AS bm25;

-- TF-IDF score
SELECT ruvector_tf_idf(
  term_freq,       -- Term frequency in document
  doc_freq,        -- Documents containing term
  total_docs       -- Total documents
) AS tfidf;
```

### Hybrid Search Example

```sql
-- Combine semantic and keyword search
SELECT 
  content,
  0.7 * (1.0 / (1.0 + (embedding <=> $query_vector))) +
  0.3 * ruvector_bm25_score(terms, doc_freqs, length, avg_len, total)
  AS combined_score
FROM documents
ORDER BY combined_score DESC
LIMIT 10;
```

---

## Local Embeddings

Generate embeddings without external APIs.

### Available Models

| Model | Dimensions | Best For |
|-------|------------|----------|
| `all-MiniLM-L6-v2` | 384 | General purpose (default) |
| `BGE-small-en-v1.5` | 384 | Search & retrieval |
| `BGE-base-en-v1.5` | 768 | Higher quality |
| `all-mpnet-base-v2` | 768 | Production RAG |
| `paraphrase-MiniLM-L6-v2` | 384 | Paraphrase detection |
| `e5-small-v2` | 384 | E5 family |

### Usage

```sql
-- Generate embedding
SELECT ruvector_embed('all-MiniLM-L6-v2', 'Your text here') AS embedding;

-- Use in INSERT
INSERT INTO kb_nodes (title, content, embedding)
VALUES (
  'My Title',
  'My content text',
  ruvector_embed('all-MiniLM-L6-v2', 'My content text')
);

-- Similarity search with inline embedding
SELECT * FROM kb_nodes
ORDER BY embedding <=> ruvector_embed('all-MiniLM-L6-v2', 'search query')
LIMIT 10;
```

---

## GNN Layers

Graph Neural Network operations in SQL.

### Graph Convolutional Network (GCN)

```sql
-- Apply GCN layer
SELECT ruvector_gnn_gcn_layer(
  node_features,      -- Matrix of node features
  adjacency_matrix,   -- Graph adjacency matrix
  trained_weights     -- Weight matrix
) AS updated_features;
```

### Graph Attention Network (GAT)

```sql
-- Apply GAT layer with attention
SELECT ruvector_gnn_gat_layer(
  node_features,
  adjacency_matrix,
  attention_weights,
  num_heads
) AS attended_features;
```

### Message Passing

```sql
-- Generic message passing
SELECT ruvector_gnn_message_pass(
  node_features,
  edge_index,
  edge_features,
  aggregation_type  -- 'sum', 'mean', 'max'
) AS aggregated;
```

---

## Attention Mechanisms

39 attention mechanisms available via SQL.

### Basic Attention

```sql
-- Multi-head attention
SELECT ruvector_attention_multi_head(
  query,    -- Query vectors
  key,      -- Key vectors
  value,    -- Value vectors
  8         -- Number of heads
) AS attended;

-- Flash attention (memory efficient)
SELECT ruvector_attention_flash(
  query, key, value,
  block_size
) AS attended;

-- Linear attention (O(n) complexity)
SELECT ruvector_attention_linear(
  query, key, value
) AS attended;
```

### Graph Attention

```sql
-- Graph attention for GNNs
SELECT ruvector_attention_graph(
  node_features,
  adjacency_matrix,
  num_heads
) AS attended;

-- Edge-featured attention
SELECT ruvector_attention_edge_featured(
  node_features,
  edge_features,
  adjacency_matrix
) AS attended;
```

### Hyperbolic Attention

```sql
-- Attention in hyperbolic space
SELECT ruvector_attention_hyperbolic(
  query, key, value,
  curvature
) AS attended;
```

---

## Intelligent Routing

Route queries to appropriate handlers.

```sql
-- Route query to best agent
SELECT ruvector_route_query(
  $user_query_embedding,
  (SELECT array_agg(row(name, capabilities, embedding)) FROM agents)
) AS best_agent;

-- Semantic routing with multiple options
SELECT ruvector_route_semantic(
  query_text,
  ARRAY['finance', 'legal', 'technical'],
  route_embeddings
) AS best_route;
```

---

## SPARQL Support

W3C SPARQL 1.1 with 50+ RDF functions.

### Store Management

```sql
-- Create RDF store
SELECT ruvector_rdf_create_store('my_store');

-- Load Turtle format
SELECT ruvector_rdf_load_turtle('my_store', '
  @prefix ex: <http://example.org/> .
  ex:item1 ex:name "First Item" .
');

-- Load N-Triples
SELECT ruvector_rdf_load_ntriples('my_store', '<s> <p> <o> .');

-- Get store statistics
SELECT ruvector_rdf_stats('my_store');
```

### SPARQL Queries

```sql
-- Execute SPARQL query
SELECT ruvector_sparql('my_store', '
  SELECT ?s ?p ?o 
  WHERE { ?s ?p ?o }
  LIMIT 10
');

-- SPARQL with JSON output
SELECT ruvector_sparql_json('my_store', 'SELECT * WHERE { ?s ?p ?o }');

-- SPARQL CONSTRUCT
SELECT ruvector_sparql('my_store', '
  CONSTRUCT { ?s ?p ?o }
  WHERE { ?s a <http://example.org/Type> ; ?p ?o }
');
```

### SPARQL Update

```sql
-- INSERT DATA
SELECT ruvector_sparql_update('my_store', '
  INSERT DATA {
    <http://example.org/item2> <http://example.org/name> "Second Item" .
  }
');

-- DELETE
SELECT ruvector_sparql_update('my_store', '
  DELETE WHERE {
    <http://example.org/item1> ?p ?o .
  }
');
```

---

## Utility Functions

### Vector Operations

```sql
-- Normalize vector
SELECT ruvector_normalize(embedding);

-- Vector addition
SELECT ruvector_add(a, b);

-- Scalar multiplication
SELECT ruvector_scale(embedding, 0.5);

-- Dimensionality
SELECT ruvector_dim(embedding);

-- L2 norm
SELECT ruvector_norm(embedding);
```

### Quantization

```sql
-- Quantize to lower precision
SELECT ruvector_quantize_int8(embedding);
SELECT ruvector_quantize_binary(embedding);

-- Product quantization
SELECT ruvector_pq_encode(embedding, codebook);
SELECT ruvector_pq_decode(codes, codebook);
```

### Batch Operations

```sql
-- Batch distance computation
SELECT ruvector_batch_cosine(
  query_vectors,    -- Array of queries
  database_vectors  -- Array of database vectors
) AS distances;

-- Centroid computation
SELECT ruvector_centroid(
  ARRAY(SELECT embedding FROM items WHERE category = 'books')
);
```

---

## Performance Tips

### Index Selection

| Scenario | Index | Why |
|----------|-------|-----|
| <100K vectors | None (exact) | Fast enough |
| 100K-1M vectors | HNSW | Best recall/speed |
| >1M vectors | IVFFlat | Faster build |
| Hierarchical data | HNSW + hyperbolic | Tree structure |

### Query Optimization

```sql
-- Pre-filter before vector search
WITH filtered AS (
  SELECT * FROM items WHERE category = 'electronics'
)
SELECT * FROM filtered
ORDER BY embedding <=> $query
LIMIT 10;

-- Use index hints
SET hnsw.ef_search = 200;  -- Higher = better recall, slower
SET ivfflat.probes = 20;   -- Higher = better recall, slower
```

### SIMD Acceleration

RuVector automatically uses:
- **AVX-512**: Intel (Skylake-X+), AMD (Zen 4+)
- **AVX2**: Most modern x86 CPUs
- **NEON**: ARM processors (M1/M2, AWS Graviton)

Verify with:
```sql
SELECT ruvector_simd_info();
```

---

## Error Handling

```sql
-- Check if extension is loaded
SELECT * FROM pg_extension WHERE extname = 'ruvector';

-- Check available functions
SELECT proname FROM pg_proc WHERE proname LIKE 'ruvector_%';

-- Verify embedding dimension
SELECT ruvector_dim(embedding) FROM items LIMIT 1;
```

---

## Migration from pgvector

RuVector is pgvector-compatible. To migrate:

1. Change extension name:
   ```sql
   DROP EXTENSION vector;
   CREATE EXTENSION ruvector;
   ```

2. All operators (`<=>`, `<->`, `<#>`) work identically

3. Indexes are compatible (rebuild for optimization):
   ```sql
   REINDEX INDEX items_embedding_idx;
   ```

---

*Reference based on ruvector-postgres v0.2.0*
