Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:02:13 EST

# @ruvector/postgres-cli v0.2.6 - Complete Reference

**Package**: `@ruvector/postgres-cli`
**Version**: 0.2.6
**Published**: 2025-12-08
**License**: MIT
**Repository**: [github.com/ruvnet/ruvector](https://github.com/ruvnet/ruvector)
**NPM**: [@ruvector/postgres-cli](https://www.npmjs.com/package/@ruvector/postgres-cli)

> **The most advanced AI vector database CLI for PostgreSQL.** A drop-in pgvector replacement with 77+ SQL functions, 39 attention mechanisms, GNN layers, hyperbolic embeddings, and self-learning capabilities.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [CLI Commands Reference](#cli-commands-reference)
3. [SQL Functions Reference (230+)](#sql-functions-reference)
4. [Docker Deployment](#docker-deployment)
5. [Tiered Compression Architecture](#tiered-compression-architecture)
6. [HNSW Index Configuration](#hnsw-index-configuration)
7. [IVFFlat Index Configuration](#ivfflat-index-configuration)
8. [ReasoningBank Integration](#reasoningbank-integration)
9. [Performance Benchmarks](#performance-benchmarks)
10. [Environment Configuration](#environment-configuration)

---

## Quick Start

### One-Command Install

```bash
# Auto-detect best method (Docker preferred)
npx @ruvector/postgres-cli install

# Native installation (no Docker)
npx @ruvector/postgres-cli install --method native

# Global installation
npm install -g @ruvector/postgres-cli
```

### Supported Platforms

| Platform | Architecture | Docker | Native |
|----------|-------------|--------|--------|
| Ubuntu/Debian | x64, arm64 | Yes | Yes |
| RHEL/CentOS/Fedora | x64, arm64 | Yes | Yes |
| Arch Linux | x64 | Yes | Yes |
| macOS | Intel, Apple Silicon | Yes | Yes |
| Windows | x64 | Yes (WSL2) | No |

**PostgreSQL Versions**: 14, 15, 16, 17

---

## CLI Commands Reference

### Installation & Server Management

| Command | Description | Example |
|---------|-------------|---------|
| `ruvector-pg install` | Install PostgreSQL + RuVector | `ruvector-pg install --method docker` |
| `ruvector-pg status` | Check installation status | `ruvector-pg status` |
| `ruvector-pg start` | Start the database server | `ruvector-pg start` |
| `ruvector-pg stop` | Stop the database server | `ruvector-pg stop` |
| `ruvector-pg logs` | View server logs | `ruvector-pg logs --follow` |
| `ruvector-pg psql` | Connect with psql | `ruvector-pg psql "SELECT 1;"` |
| `ruvector-pg info` | Show extension info | `ruvector-pg info` |
| `ruvector-pg uninstall` | Remove installation | `ruvector-pg uninstall` |

#### Install Command Options

```bash
ruvector-pg install [options]

Options:
  -m, --method <type>     Installation method: docker, native, auto (default: "auto")
  -p, --port <number>     PostgreSQL port (default: "5432")
  -u, --user <name>       Database user (default: "ruvector")
  --password <pass>       Database password (default: "ruvector")
  -d, --database <name>   Database name (default: "ruvector")
  --data-dir <path>       Persistent data directory (Docker only)
  --name <name>           Container name (default: "ruvector-postgres")
  --version <version>     RuVector version (default: "0.2.5")
  --pg-version <version>  PostgreSQL version for native (14, 15, 16, 17)
  --skip-postgres         Skip PostgreSQL installation (use existing)
  --skip-rust             Skip Rust installation (use existing)
```

### Vector Operations

```bash
# Create vector table
ruvector-pg vector create <table> --dim <dimensions> --index <hnsw|ivfflat>

# Insert vectors from file
ruvector-pg vector insert <table> --file data.json

# Search vectors
ruvector-pg vector search <table> --query "[0.1, 0.2, ...]" --top-k 10 --metric cosine

# Compute distance
ruvector-pg vector distance --a "[0.1, 0.2]" --b "[0.3, 0.4]" --metric <cosine|l2|ip>

# Normalize vector
ruvector-pg vector normalize --vector "[0.5, 0.3, 0.2]"
```

### Attention Mechanisms (39 Types)

```bash
# Compute attention
ruvector-pg attention compute \
  --query "[0.1, 0.2, 0.3]" \
  --keys "[[0.1, 0.2], [0.3, 0.4]]" \
  --values "[[0.5, 0.6], [0.7, 0.8]]" \
  --type scaled_dot

# List available types
ruvector-pg attention list-types
```

**Available Attention Types**:
- Core: `scaled_dot_product_attention`, `multi_head_attention`, `flash_attention`
- Sparse: `sparse_attention`, `local_attention`, `strided_attention`, `random_attention`, `longformer_attention`
- Memory: `memory_attention`, `compressive_attention`, `memory_compressed_attention`
- Cross-Modal: `cross_attention`, `cross_modal_attention`, `multimodal_attention`
- Efficient: `linear_attention`, `performer_attention`, `reformer_attention`, `synthesizer_attention`
- Positional: `relative_attention`, `rotary_attention`, `alibi_attention`, `rope_attention`
- Graph: `graph_attention`, `gat_attention`, `sparse_graph_attention`
- Advanced: `self_attention`, `causal_attention`, `bidirectional_attention`, `grouped_query_attention`

### Graph Neural Networks

```bash
# Create GNN layer
ruvector-pg gnn create <name> --type <gcn|graphsage|gat|gin> --input-dim 384 --output-dim 128

# Forward pass
ruvector-pg gnn forward <layer> --features features.json --edges edges.json

# List GNN types
ruvector-pg gnn list-types
```

**GNN Layer Types**:
| Type | Description |
|------|-------------|
| `gcn` | Graph Convolutional Network - Spectral graph convolutions using Chebyshev polynomials |
| `graphsage` | GraphSAGE - Inductive learning with neighborhood sampling and aggregation |
| `gat` | Graph Attention Network - Attention-weighted message passing between nodes |
| `gin` | Graph Isomorphism Network - Provably as powerful as WL-test |

### Graph Operations (Cypher)

```bash
# Execute Cypher query
ruvector-pg graph query "MATCH (n) RETURN n LIMIT 10"

# Create graph
ruvector-pg graph create <name>

# Create node
ruvector-pg graph create-node <graph> --labels "Person,Employee" --properties '{"name": "Alice"}'

# Create edge
ruvector-pg graph create-edge <graph> --from 1 --to 2 --type "KNOWS"

# Traverse graph
ruvector-pg graph traverse --start 1 --depth 3 --type bfs
```

**Cypher Query Examples**:
```cypher
-- Return first 10 nodes
MATCH (n) RETURN n LIMIT 10

-- Find all Person nodes
MATCH (n:Person) RETURN n

-- Find relationships
MATCH (a)-[r]->(b) RETURN a,r,b

-- Find by property
MATCH (n {name: 'Alice'}) RETURN n

-- Variable-length path
MATCH p=(a)-[*1..3]->(b) RETURN p

-- Create a node
CREATE (n:Person {name: 'Bob'}) RETURN n
```

### Hyperbolic Geometry

```bash
# Poincare distance
ruvector-pg hyperbolic poincare-distance --a "[0.1, 0.2]" --b "[0.3, 0.4]" --curvature -1.0

# Lorentz distance
ruvector-pg hyperbolic lorentz-distance --a "[0.1, 0.2]" --b "[0.3, 0.4]" --curvature -1.0

# Mobius addition
ruvector-pg hyperbolic mobius-add --a "[0.1, 0.2]" --b "[0.05, 0.1]" --curvature -1.0

# Exponential map
ruvector-pg hyperbolic exp-map --base "[0.0, 0.0]" --tangent "[0.1, 0.2]" --curvature -1.0

# Log map
ruvector-pg hyperbolic log-map --base "[0.0, 0.0]" --target "[0.1, 0.2]" --curvature -1.0

# Convert Poincare to Lorentz
ruvector-pg hyperbolic poincare-to-lorentz --vector "[0.1, 0.2]" --curvature -1.0

# Convert Lorentz to Poincare
ruvector-pg hyperbolic lorentz-to-poincare --vector "[1.02, 0.1, 0.2]" --curvature -1.0
```

### Sparse Vectors & BM25

```bash
# Create sparse vector
ruvector-pg sparse create --indices "[0, 5, 10]" --values "[0.5, 0.3, 0.2]" --dim 10000

# Compute BM25 score
ruvector-pg sparse bm25 \
  --query '{"indices": [1,5,10], "values": [0.8,0.5,0.3]}' \
  --doc '{"indices": [1,5], "values": [2,1]}' \
  --doc-len 150 \
  --avg-doc-len 200

# Compute sparse distance
ruvector-pg sparse distance --a "sparse1" --b "sparse2" --metric <dot|cosine|euclidean|manhattan>

# Get sparse vector info
ruvector-pg sparse info --vector "sparse_vector"

# Prune sparse vector
ruvector-pg sparse prune --vector "sparse_vector" --threshold 0.01

# Get top-k elements
ruvector-pg sparse top-k --vector "sparse_vector" --k 100
```

### Agent Routing (Tiny Dancer)

```bash
# Register agent
ruvector-pg routing register \
  --name "gpt-4" \
  --type llm \
  --capabilities "code,translation,analysis" \
  --cost 0.03 \
  --latency 500 \
  --quality 0.95

# Register with full config
ruvector-pg routing register-full --config '{"name": "claude", "type": "llm", ...}'

# Route request
ruvector-pg routing route \
  --embedding "[0.1, 0.2, ...]" \
  --optimize-for balanced \
  --constraints '{"max_cost": 0.1}'

# List agents
ruvector-pg routing list

# Get agent details
ruvector-pg routing get <name>

# Find by capability
ruvector-pg routing find --capability "code" --limit 10

# Update metrics
ruvector-pg routing update --name "gpt-4" --latency 450 --success true --quality 0.96

# Set active/inactive
ruvector-pg routing set-active <name> true|false

# Remove agent
ruvector-pg routing remove <name>

# Get routing stats
ruvector-pg routing stats

# Clear all agents
ruvector-pg routing clear
```

**Optimization Targets**:
- `cost` - Minimize request cost
- `latency` - Minimize response time
- `quality` - Maximize output quality
- `balanced` - Balance all factors (default)

### Self-Learning (ReasoningBank)

```bash
# Enable learning for table
ruvector-pg learning enable <table> \
  --max-trajectories 1000 \
  --num-clusters 10

# Record trajectory
ruvector-pg learning record \
  --input "[0.1, 0.2, ...]" \
  --output "[0.3, 0.4, ...]" \
  --success true

# Get optimized parameters
ruvector-pg learning get-params <table> --query "[0.15, 0.25, ...]"

# View learning stats
ruvector-pg learning stats <table>

# Train from trajectories
ruvector-pg learning train --file trajectories.json --epochs 10

# Make prediction
ruvector-pg learning predict --input "[0.1, 0.2, ...]"

# Get learning status
ruvector-pg learning status
```

### Quantization

```bash
# Binary quantization (32x compression)
ruvector-pg quantization binary --vector "[0.1, -0.2, 0.3, ...]"

# Scalar quantization (4x compression)
ruvector-pg quantization scalar --vector "[0.1, -0.2, 0.3, ...]"

# Compare methods
ruvector-pg quantization compare "[0.1, 0.2, 0.3, ...]"

# Get stats
ruvector-pg quantization stats
```

**Quantization Methods**:
| Method | Bits/Dim | Compression | Accuracy Loss | Speed Boost |
|--------|----------|-------------|---------------|-------------|
| Binary (BQ) | 1 | 32x | ~20-30% | ~10-20x |
| Scalar (SQ8) | 8 | 4x | ~1-5% | ~2-4x |
| Product (PQ) | Variable | 8-32x | ~5-15% | ~5-10x |

### Benchmarking

```bash
# Run benchmarks
ruvector-pg bench run --type all --size 10000 --dim 384

# Available types: vector, attention, gnn, all

# Generate report
ruvector-pg bench report --format <table|json|markdown>

# Show benchmark info
ruvector-pg bench info
```

---

## SQL Functions Reference

### Core Vector Functions (77+)

#### Distance Functions

```sql
-- Cosine distance (array-based)
SELECT cosine_distance_arr(a::real[], b::real[]);

-- L2/Euclidean distance (array-based)
SELECT l2_distance_arr(a::real[], b::real[]);

-- Inner product (array-based)
SELECT inner_product_arr(a::real[], b::real[]);

-- Vector normalization
SELECT vector_normalize(v::real[]);

-- Generic distance with metric parameter
SELECT ruvector_distance(a, b, 'cosine');  -- 'cosine', 'l2', 'ip'
```

#### Vector Operators

```sql
-- Cosine distance operator
SELECT embedding <=> query::ruvector AS distance;

-- L2 distance operator
SELECT embedding <-> query::ruvector AS distance;

-- Inner product operator (negative)
SELECT embedding <#> query::ruvector AS distance;
```

#### Vector Creation & Manipulation

```sql
-- Create random vector
SELECT ruvector_random(dimensions);

-- Get vector dimension
SELECT ruvector_dim(embedding);

-- Normalize vector
SELECT ruvector_normalize(embedding);

-- Concatenate vectors
SELECT ruvector_concat(a, b);

-- Mean of vectors
SELECT ruvector_mean(ARRAY_AGG(embedding));
```

### Sparse Vector Functions

```sql
-- Create sparse vector from indices/values
SELECT ruvector_to_sparse(indices::int[], values::real[], dimension);

-- Sparse distances
SELECT ruvector_sparse_dot(a::text, b::text);
SELECT ruvector_sparse_cosine(a::text, b::text);
SELECT ruvector_sparse_euclidean(a::text, b::text);
SELECT ruvector_sparse_manhattan(a::text, b::text);

-- BM25 scoring
SELECT ruvector_sparse_bm25(
  query::text,
  doc::text,
  doc_len::int,
  avg_doc_len::float,
  k1::float DEFAULT 1.2,
  b::float DEFAULT 0.75
);

-- Sparse vector info
SELECT ruvector_sparse_dim(sparse::text);
SELECT ruvector_sparse_nnz(sparse::text);  -- Non-zero elements
SELECT ruvector_sparse_norm(sparse::text);

-- Sparse operations
SELECT ruvector_sparse_top_k(sparse::text, k::int);
SELECT ruvector_sparse_prune(sparse::text, threshold::float);
SELECT ruvector_dense_to_sparse(dense::real[]);
SELECT ruvector_sparse_to_dense(sparse::text);

-- Convert from dense
SELECT ruvector_sparse_from_dense(dense::float4[]);
```

### Hyperbolic Geometry Functions

```sql
-- Poincare ball distance
SELECT ruvector_poincare_distance(a::real[], b::real[], curvature::float DEFAULT -1.0);

-- Lorentz (hyperboloid) distance
SELECT ruvector_lorentz_distance(a::real[], b::real[], curvature::float DEFAULT -1.0);

-- Mobius addition in Poincare ball
SELECT ruvector_mobius_add(a::real[], b::real[], curvature::float DEFAULT -1.0);

-- Exponential map (tangent space to manifold)
SELECT ruvector_exp_map(base::real[], tangent::real[], curvature::float DEFAULT -1.0);

-- Logarithmic map (manifold to tangent space)
SELECT ruvector_log_map(base::real[], target::real[], curvature::float DEFAULT -1.0);

-- Model conversions
SELECT ruvector_poincare_to_lorentz(poincare::real[], curvature::float DEFAULT -1.0);
SELECT ruvector_lorentz_to_poincare(lorentz::real[], curvature::float DEFAULT -1.0);

-- Minkowski inner product
SELECT ruvector_minkowski_dot(a::real[], b::real[]);
```

### Attention Mechanism Functions

```sql
-- Basic attention score (scaled dot-product)
SELECT attention_score(query::real[], key::real[]);

-- Softmax normalization
SELECT attention_softmax(scores::real[]);

-- Single query-key-value attention
SELECT attention_single(query::real[], key::real[], value::real[], offset::float);

-- Weighted accumulation
SELECT attention_weighted_add(accumulator::real[], value::real[], weight::real);

-- Initialize zero accumulator
SELECT attention_init(dim::int);
```

### Graph Neural Network Functions

```sql
-- GCN forward pass
SELECT ruvector_gcn_forward(
  features::real[][],
  src_indices::int[],
  dst_indices::int[],
  weights::real[][] DEFAULT NULL,
  output_dim::int
);

-- GraphSAGE forward pass
SELECT ruvector_graphsage_forward(
  features::real[][],
  src_indices::int[],
  dst_indices::int[],
  output_dim::int,
  sample_size::int DEFAULT 10
);

-- GAT forward pass (if available)
SELECT ruvector_gat_forward(
  features::real[][],
  src_indices::int[],
  dst_indices::int[],
  output_dim::int,
  num_heads::int DEFAULT 8
);
```

### Graph/Cypher Functions

```sql
-- Create graph
SELECT ruvector_create_graph(name::text);

-- Execute Cypher query
SELECT ruvector_cypher(graph_name::text, query::text, params::jsonb DEFAULT NULL);

-- Add node
SELECT ruvector_add_node(graph_name::text, labels::text[], properties::jsonb);

-- Add edge
SELECT ruvector_add_edge(
  graph_name::text,
  source_id::bigint,
  target_id::bigint,
  edge_type::text,
  properties::jsonb DEFAULT '{}'
);

-- Shortest path
SELECT ruvector_shortest_path(
  graph_name::text,
  start_id::bigint,
  end_id::bigint,
  max_hops::int DEFAULT 10
);

-- Graph statistics
SELECT ruvector_graph_stats(graph_name::text);

-- List all graphs
SELECT ruvector_list_graphs();

-- Delete graph
SELECT ruvector_delete_graph(graph_name::text);
```

### Agent Routing Functions (Tiny Dancer)

```sql
-- Register agent
SELECT ruvector_register_agent(
  name::text,
  agent_type::text,
  capabilities::text[],
  cost_per_request::float,
  avg_latency_ms::float,
  quality_score::float
);

-- Register with full config
SELECT ruvector_register_agent_full(config::jsonb);

-- Update agent metrics
SELECT ruvector_update_agent_metrics(
  name::text,
  latency_ms::float,
  success::boolean,
  quality::float DEFAULT NULL
);

-- Remove agent
SELECT ruvector_remove_agent(name::text);

-- Set agent active/inactive
SELECT ruvector_set_agent_active(name::text, is_active::boolean);

-- Route request to best agent
SELECT ruvector_route(
  embedding::real[],
  optimize_for::text DEFAULT 'balanced',
  constraints::jsonb DEFAULT NULL
);

-- List all agents
SELECT * FROM ruvector_list_agents();

-- Get agent details
SELECT ruvector_get_agent(name::text);

-- Find agents by capability
SELECT * FROM ruvector_find_agents_by_capability(capability::text, limit_count::int DEFAULT 10);

-- Get routing statistics
SELECT ruvector_routing_stats();

-- Clear all agents
SELECT ruvector_clear_agents();
```

### Self-Learning Functions (ReasoningBank)

```sql
-- Enable learning for table
SELECT ruvector_enable_learning(table_name::text, config::jsonb DEFAULT NULL);

-- Record search feedback
SELECT ruvector_record_feedback(
  table_name::text,
  query_vector::real[],
  relevant_ids::bigint[],
  irrelevant_ids::bigint[]
);

-- Get learning statistics
SELECT ruvector_learning_stats(table_name::text);

-- Auto-tune search parameters
SELECT ruvector_auto_tune(
  table_name::text,
  optimize_for::text DEFAULT 'balanced',
  sample_queries::real[][] DEFAULT NULL
);

-- Extract learned patterns
SELECT ruvector_extract_patterns(table_name::text, num_clusters::int DEFAULT 10);

-- Get optimized search parameters
SELECT ruvector_get_search_params(table_name::text, query_vector::real[]);

-- Clear learning data
SELECT ruvector_clear_learning(table_name::text);
```

### Quantization Functions

```sql
-- Binary quantization (1-bit per dimension)
SELECT binary_quantize_arr(vector::real[]);

-- Scalar quantization (8-bit per dimension)
SELECT scalar_quantize_arr(vector::real[]);

-- For ruvector type
SELECT ruvector_binary_quantize(embedding);
SELECT ruvector_scalar_quantize(embedding, bits::int DEFAULT 8);

-- Hamming distance for binary vectors
SELECT bit_count(a # b)::int AS hamming_distance;
```

### Extension Info Functions

```sql
-- Get extension version
SELECT ruvector_version();

-- Get SIMD info
SELECT ruvector_simd_info();

-- Get memory statistics
SELECT ruvector_memory_stats();
```

### Utility Functions

```sql
-- Check if extension is installed
SELECT extversion FROM pg_extension WHERE extname = 'ruvector';

-- Check available functions
SELECT proname FROM pg_proc WHERE proname LIKE 'ruvector_%';

-- Check available index types
SELECT amname FROM pg_am WHERE amname IN ('hnsw', 'ivfflat');
```

---

## Docker Deployment

### Quick Start

```bash
# Pull and run
docker run -d --name ruvector-pg \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  ruvnet/ruvector-postgres:latest

# Connect
docker exec -it ruvector-pg psql -U postgres
```

### Full Configuration

```bash
docker run -d --name ruvector-pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_USER=ruvector \
  -e POSTGRES_DB=ruvector \
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
      POSTGRES_DB: ruvector
    ports:
      - "5432:5432"
    volumes:
      - ruvector_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ruvector -d ruvector"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  ruvector_data:
```

### Using CLI with Docker

```bash
# Via npx
npx @ruvector/postgres-cli install --method docker --port 5433

# Server management
npx @ruvector/postgres-cli status
npx @ruvector/postgres-cli logs --follow
npx @ruvector/postgres-cli stop
npx @ruvector/postgres-cli start
```

---

## Tiered Compression Architecture

RuVector implements a 5-tier compression architecture for optimal storage and performance:

### Tier Overview

| Tier | Name | Format | Compression | Memory Reduction | Use Case |
|------|------|--------|-------------|------------------|----------|
| 0 | **Hot** | f32 | None | 1x | Active queries, real-time search |
| 1 | **Warm** | f16 | 2x | 2x | Recently accessed data |
| 2 | **Cool** | int8 (SQ8) | 4x | 4x | Infrequent access |
| 3 | **Cold** | int4 | 8x | 8x | Archive, batch processing |
| 4 | **Archive** | Binary | 32x | 32x | Long-term storage, coarse filtering |

### Configuration

```sql
-- Enable tiered compression for a table
SELECT ruvector_enable_tiering(
  table_name::text,
  hot_retention::interval DEFAULT '1 hour',
  warm_retention::interval DEFAULT '1 day',
  cool_retention::interval DEFAULT '7 days',
  cold_retention::interval DEFAULT '30 days'
);

-- Manual tier migration
SELECT ruvector_migrate_tier(table_name::text, tier::int);

-- Get tier statistics
SELECT ruvector_tier_stats(table_name::text);
```

### Quantization Details

#### Binary Quantization (BQ)
```sql
-- Convert vector to binary (sign-based)
SELECT binary_quantize_arr(vector::real[]);
-- Result: 1 bit per dimension, 32x compression
-- Use: Fast pre-filtering, approximate search
```

#### Scalar Quantization (SQ8)
```sql
-- Convert vector to 8-bit integers
SELECT scalar_quantize_arr(vector::real[]);
-- Result: 8 bits per dimension, 4x compression
-- Reconstruction: original[i] = quantized[i] * scale + offset
```

#### Product Quantization (PQ)
```sql
-- Configure PQ codebook
SELECT ruvector_pq_train(table_name::text, num_subvectors::int, bits_per_subvector::int);
-- Typical: 8 subvectors, 8 bits each = 64 bits total for 256-dim vector
```

---

## HNSW Index Configuration

### Creating HNSW Index

```sql
-- Create table with HNSW index
CREATE TABLE embeddings (
    id SERIAL PRIMARY KEY,
    embedding ruvector,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index with configuration
CREATE INDEX idx_embeddings_hnsw
ON embeddings USING hnsw (embedding ruvector_cosine_ops)
WITH (m = 16, ef_construction = 100);
```

### HNSW Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `m` | 16 | 4-64 | Max connections per layer. Higher = better recall, more memory |
| `ef_construction` | 100 | 16-500 | Build-time search quality. Higher = better index, slower build |
| `ef_search` | 40 | 10-1000 | Query-time search quality. Higher = better recall, slower query |

### Distance Operators

| Operator | Function | Description |
|----------|----------|-------------|
| `<=>` | `ruvector_cosine_ops` | Cosine distance (1 - cosine similarity) |
| `<->` | `ruvector_l2_ops` | Euclidean (L2) distance |
| `<#>` | `ruvector_ip_ops` | Negative inner product |

### Optimal Settings by Use Case

```sql
-- High recall (> 99%), slower
CREATE INDEX idx_high_recall ON embeddings
USING hnsw (embedding ruvector_cosine_ops)
WITH (m = 32, ef_construction = 200);
SET hnsw.ef_search = 200;

-- Balanced (95-99% recall)
CREATE INDEX idx_balanced ON embeddings
USING hnsw (embedding ruvector_cosine_ops)
WITH (m = 16, ef_construction = 100);
SET hnsw.ef_search = 64;

-- Fast search (< 95% recall)
CREATE INDEX idx_fast ON embeddings
USING hnsw (embedding ruvector_cosine_ops)
WITH (m = 8, ef_construction = 50);
SET hnsw.ef_search = 20;
```

### Memory Estimation

```
HNSW Memory = vectors * dimensions * 4 bytes + vectors * m * 8 bytes * 2
```

Example: 1M vectors, 384 dimensions, m=16:
```
= 1,000,000 * 384 * 4 + 1,000,000 * 16 * 8 * 2
= 1,536 MB + 256 MB = ~1.8 GB
```

---

## IVFFlat Index Configuration

### Creating IVFFlat Index

```sql
-- Create IVFFlat index
CREATE INDEX idx_embeddings_ivfflat
ON embeddings USING ivfflat (embedding ruvector_cosine_ops)
WITH (lists = 100);
```

### IVFFlat Parameters

| Parameter | Default | Recommended | Description |
|-----------|---------|-------------|-------------|
| `lists` | 100 | sqrt(n) to 4*sqrt(n) | Number of inverted lists/clusters |
| `probes` | 1 | 10-50 | Lists to search at query time |

### Optimal List Count

| Dataset Size | Recommended Lists |
|--------------|-------------------|
| 10K | 30-50 |
| 100K | 100-400 |
| 1M | 300-1200 |
| 10M | 1000-4000 |

### Query Configuration

```sql
-- Set probes for better recall
SET ivfflat.probes = 10;

-- Query with configured probes
SELECT id, embedding <=> query::ruvector AS distance
FROM embeddings
ORDER BY distance
LIMIT 10;
```

### HNSW vs IVFFlat Comparison

| Aspect | HNSW | IVFFlat |
|--------|------|---------|
| **Build Time** | Slower | Faster |
| **Query Speed** | Faster | Slower |
| **Memory Usage** | Higher | Lower |
| **Recall** | Higher | Lower |
| **Insertions** | Efficient | Requires rebuild |
| **Best For** | < 10M vectors | > 10M vectors |

---

## ReasoningBank Integration

ReasoningBank enables self-learning capabilities that allow the database to improve search quality over time based on user feedback.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ReasoningBank System                       │
├─────────────────────────────────────────────────────────────────┤
│  Trajectory Recording                                           │
│    └── Record (query, results, feedback) tuples                │
├─────────────────────────────────────────────────────────────────┤
│  Pattern Extraction                                             │
│    └── Cluster trajectories, identify success patterns         │
├─────────────────────────────────────────────────────────────────┤
│  Parameter Optimization                                         │
│    └── Learn optimal ef_search, probes per query type          │
├─────────────────────────────────────────────────────────────────┤
│  Inference                                                      │
│    └── Predict optimal parameters for new queries              │
└─────────────────────────────────────────────────────────────────┘
```

### Enabling Self-Learning

```sql
-- Enable learning for a table
SELECT ruvector_enable_learning('embeddings', '{
  "max_trajectories": 10000,
  "num_clusters": 50,
  "learning_rate": 0.01,
  "exploration_rate": 0.1
}'::jsonb);
```

### Recording Feedback

```sql
-- Record positive/negative feedback on search results
SELECT ruvector_record_feedback(
  'embeddings',
  query_vector,
  ARRAY[123, 456, 789],  -- relevant IDs
  ARRAY[101, 202]        -- irrelevant IDs
);
```

### Using Learned Parameters

```sql
-- Get optimized parameters for a query
SELECT ruvector_get_search_params('embeddings', query_vector);
-- Returns: {"ef_search": 85, "probes": 12, "confidence": 0.87}

-- Apply learned parameters
SET hnsw.ef_search = 85;
SELECT * FROM embeddings
WHERE embedding <=> query_vector::ruvector < 0.5
ORDER BY embedding <=> query_vector::ruvector
LIMIT 10;
```

### Trajectory Format

```json
{
  "state": [0.1, 0.2, ...],      // Query context vector
  "action": "expand_hnsw",       // Action taken (ef_search increase)
  "parameters": {"ef_search": 64},
  "outcome": "success",          // Result quality
  "reward": 0.95,                // Performance score
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Training from Trajectories

```bash
# CLI training
ruvector-pg learning train --file trajectories.json --epochs 10

# View training progress
ruvector-pg learning status
```

### Reinforcement Learning Algorithms

RuVector supports 9 RL algorithms for learning:
1. Q-Learning
2. SARSA
3. Decision Transformer
4. Actor-Critic
5. PPO (Proximal Policy Optimization)
6. DQN (Deep Q-Network)
7. Rainbow DQN
8. SAC (Soft Actor-Critic)
9. TD3 (Twin Delayed DDPG)

---

## Performance Benchmarks

### Hardware Configuration

- **CPU**: AMD EPYC 7763 (64 cores)
- **RAM**: 256GB
- **Storage**: NVMe SSD

### SIMD Acceleration

RuVector uses SIMD instructions for ~2x performance improvement:
- AVX-512 (Intel/AMD modern CPUs)
- AVX2 (Intel/AMD older CPUs)
- NEON (ARM/Apple Silicon)

### Benchmark Results

| Operation | 10K vectors | 100K vectors | 1M vectors |
|-----------|-------------|--------------|------------|
| **HNSW Build** | 0.8s | 8.2s | 95s |
| **HNSW Search (top-10)** | 0.3ms | 0.5ms | 1.2ms |
| **Cosine Distance** | 0.01ms | 0.01ms | 0.01ms |
| **Poincare Distance** | 0.02ms | 0.02ms | 0.02ms |
| **GCN Forward** | 2.1ms | 18ms | 180ms |
| **BM25 Score** | 0.05ms | 0.08ms | 0.15ms |
| **Binary Quantization** | 0.001ms | 0.001ms | 0.001ms |
| **Scalar Quantization** | 0.002ms | 0.002ms | 0.002ms |

*Dimensions: 384 for vector ops, 128 for GNN*

### Throughput Metrics

| Metric | Value |
|--------|-------|
| Search Latency (k=10) | ~61 microseconds |
| Queries Per Second | ~16,400 QPS |
| Batch Insert Rate | 100,000+ vectors/second |

### Running Benchmarks

```bash
# Run all benchmarks
ruvector-pg bench run --type all --size 100000 --dim 384

# Vector-specific benchmark
ruvector-pg bench run --type vector --size 1000000 --dim 768

# Generate report
ruvector-pg bench report --format markdown
```

---

## Environment Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://localhost:5432/ruvector` |
| `RUVECTOR_POOL_SIZE` | Connection pool size | `10` |
| `RUVECTOR_TIMEOUT` | Query timeout (ms) | `30000` |
| `RUVECTOR_RETRIES` | Max retry attempts | `3` |

### Connection Pooling

```javascript
// Pool configuration
{
  maxConnections: 10,
  idleTimeoutMs: 30000,
  connectionTimeoutMs: 5000,
  statementTimeoutMs: 30000
}
```

### Retry Configuration

```javascript
// Automatic retry with exponential backoff
{
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000
}
```

### Retryable Error Codes

- `08000` - connection_exception
- `08003` - connection_does_not_exist
- `08006` - connection_failure
- `40001` - serialization_failure
- `40P01` - deadlock_detected
- `57P01` - admin_shutdown
- `57P02` - crash_shutdown
- `57P03` - cannot_connect_now

---

## Comparison with pgvector

| Feature | pgvector | RuVector |
|---------|----------|----------|
| **Vector Search** | HNSW, IVFFlat | HNSW, IVFFlat |
| **Distance Metrics** | 3 | 8+ (including hyperbolic) |
| **Attention Mechanisms** | None | 39 types |
| **Graph Neural Networks** | None | GCN, GraphSAGE, GAT, GIN |
| **Hyperbolic Embeddings** | None | Poincare, Lorentz |
| **Sparse Vectors / BM25** | None | Full support |
| **Self-Learning** | None | ReasoningBank |
| **Agent Routing** | None | Tiny Dancer |
| **Quantization** | None | Binary, Scalar, Product |
| **SIMD Acceleration** | Basic | AVX-512/AVX2/NEON |
| **Cypher Queries** | None | Full support |
| **SPARQL** | None | W3C SPARQL 1.1 |

---

## Related Packages

- [`ruvector-postgres`](https://crates.io/crates/ruvector-postgres) - Rust PostgreSQL extension (v0.2.5)
- [`ruvector-core`](https://crates.io/crates/ruvector-core) - Core vector operations library
- [`ruvector`](https://www.npmjs.com/package/ruvector) - JavaScript/TypeScript client

---

## Troubleshooting

### Docker Issues

```bash
# Check if Docker is running
docker info

# View container logs
npx @ruvector/postgres-cli logs

# Restart container
npx @ruvector/postgres-cli stop && npx @ruvector/postgres-cli start
```

### Native Installation Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check pgrx installation
cargo pgrx --version

# Reinstall extension
npx @ruvector/postgres-cli install --method native --skip-postgres --skip-rust
```

### Extension Not Found

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS ruvector CASCADE;

-- Verify installation
SELECT extversion FROM pg_extension WHERE extname = 'ruvector';
```

---

## Sources

- [NPM Package: @ruvector/postgres-cli](https://www.npmjs.com/package/@ruvector/postgres-cli)
- [GitHub Repository: ruvnet/ruvector](https://github.com/ruvnet/ruvector)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

*Documentation generated for @ruvector/postgres-cli v0.2.6*
*Last updated: 2025-12-28*
