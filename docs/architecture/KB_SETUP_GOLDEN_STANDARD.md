# Ruvector Knowledge Base: Golden Standard Setup Guide

**Updated:** 2026-01-02 22:20:00 EST | Version 1.0.0
**Created:** 2026-01-02 22:20:00 EST

> This is the DEFINITIVE guide for setting up a Ruvector knowledge base correctly.
> Follow these standards to avoid common pitfalls and ensure optimal performance.

---

## Quick Setup (Production-Ready in 5 Minutes)

```sql
-- 1. Create isolated schema
CREATE SCHEMA IF NOT EXISTS your_project;

-- 2. Create table with CORRECT types
CREATE TABLE your_project.knowledge (
    id SERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    embedding ruvector,  -- CRITICAL: Use ruvector type, NOT real[]
    quality_score INT DEFAULT 50 CHECK (quality_score BETWEEN 0 AND 100),
    is_duplicate BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create HNSW index BEFORE bulk insert
CREATE INDEX idx_kb_hnsw ON your_project.knowledge
USING hnsw (embedding ruvector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Create supporting indexes
CREATE INDEX idx_kb_category ON your_project.knowledge (category);
CREATE INDEX idx_kb_quality ON your_project.knowledge (quality_score DESC);
CREATE INDEX idx_kb_active ON your_project.knowledge (id) WHERE NOT is_duplicate;
```

---

## Embedding Model Options

### Available Models (ONNX-Powered)

| Model | Dims | Speed | Quality | Memory | Use Case |
|-------|------|-------|---------|--------|----------|
| **all-MiniLM-L6-v2** | 384 | Fast | Good | ~90MB | General purpose (DEFAULT) |
| BAAI/bge-small-en-v1.5 | 384 | Fast | Better | ~130MB | Semantic search focused |
| BAAI/bge-base-en-v1.5 | 768 | Medium | Great | ~440MB | Higher accuracy needed |
| BAAI/bge-large-en-v1.5 | 1024 | Slow | Best | ~1.3GB | Maximum accuracy |
| all-mpnet-base-v2 | 768 | Medium | Great | ~420MB | Sentence similarity |
| nomic-embed-text-v1.5 | 768 | Medium | Great | ~550MB | Modern architecture |

### How to Choose

```sql
-- Check available models
SELECT * FROM ruvector_embedding_models();

-- Set model for session
SELECT ruvector_set_model('BAAI/bge-small-en-v1.5');

-- Generate embedding with specific model
SELECT ruvector_embed('your text', 'BAAI/bge-base-en-v1.5');
```

### Model Selection Guide

- **Small KBs (<10K entries):** all-MiniLM-L6-v2 (fast, efficient)
- **Production semantic search:** BAAI/bge-small-en-v1.5 (quality + speed)
- **High-accuracy requirements:** BAAI/bge-base-en-v1.5 (balanced)
- **Research/maximum quality:** BAAI/bge-large-en-v1.5 (best results)

---

## HNSW Index Options

### Parameters Explained

| Parameter | Default | Range | Purpose |
|-----------|---------|-------|---------|
| `m` | 16 | 2-100 | Max connections per layer (higher = better recall, more memory) |
| `ef_construction` | 64 | 16-512 | Build-time search depth (higher = better index, slower build) |

### Preset Configurations

```sql
-- FAST (small KB, <10K entries)
CREATE INDEX ... WITH (m = 8, ef_construction = 32);

-- BALANCED (medium KB, 10K-100K entries) [RECOMMENDED]
CREATE INDEX ... WITH (m = 16, ef_construction = 64);

-- HIGH-RECALL (large KB, 100K+ entries)
CREATE INDEX ... WITH (m = 24, ef_construction = 128);

-- MAXIMUM-QUALITY (research, accuracy-critical)
CREATE INDEX ... WITH (m = 32, ef_construction = 256);
```

### Search Parameters

```sql
-- Set at query time for recall/speed tradeoff
SET hnsw.ef_search = 40;   -- Fast (default)
SET hnsw.ef_search = 100;  -- Balanced
SET hnsw.ef_search = 200;  -- High recall
```

---

## Distance Metrics

### Available Operator Classes

| Operator Class | Symbol | Use Case |
|----------------|--------|----------|
| `ruvector_cosine_ops` | `<->` | Semantic similarity (RECOMMENDED) |
| `ruvector_l2_ops` | `<->` | Euclidean distance |
| `ruvector_ip_ops` | `<#>` | Inner product (normalized vectors) |

### When to Use Each

- **Cosine (default):** Text embeddings, semantic search, content similarity
- **L2 (Euclidean):** Image embeddings, geographic data
- **Inner Product:** Pre-normalized vectors, maximum speed

---

## Schema Architecture Patterns

### Pattern 1: Single Project KB

```sql
CREATE SCHEMA myproject;
CREATE TABLE myproject.knowledge (...);
```

### Pattern 2: Multi-Tenant KB

```sql
-- Shared table with tenant isolation
CREATE SCHEMA shared_kb;
CREATE TABLE shared_kb.knowledge (
    tenant_id TEXT NOT NULL,
    -- ... other columns
);
CREATE INDEX ON shared_kb.knowledge (tenant_id);
```

### Pattern 3: Federated KBs

```sql
-- Each project = separate schema
CREATE SCHEMA project_alpha;
CREATE SCHEMA project_beta;
-- Query across schemas with UNION
```

---

## Required Column Standards

### Minimum Viable KB

```sql
CREATE TABLE schema.kb (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding ruvector
);
```

### Production KB (Recommended)

```sql
CREATE TABLE schema.kb (
    id SERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,           -- Deduplication
    title TEXT NOT NULL,                    -- Display/search
    content TEXT NOT NULL,                  -- Full content
    source TEXT,                            -- Origin tracking
    category TEXT DEFAULT 'general',        -- Classification
    embedding ruvector,                     -- Semantic vector
    quality_score INT DEFAULT 50,           -- 0-100 rating
    is_duplicate BOOLEAN DEFAULT false,     -- Dedup flag
    canonical_id INT REFERENCES schema.kb(id),  -- Dedup reference
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Enterprise KB (Full Features)

```sql
CREATE TABLE schema.kb (
    -- Core
    id SERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,                           -- Auto-generated summary

    -- Metadata
    source TEXT,
    source_url TEXT,
    file_path TEXT,
    file_hash TEXT,                         -- Content fingerprint

    -- Classification
    category TEXT DEFAULT 'general',
    subcategory TEXT,
    topics TEXT[],                          -- Tag array
    language TEXT DEFAULT 'en',

    -- Semantic
    embedding ruvector,
    embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2',

    -- Quality
    quality_score INT DEFAULT 50,
    relevance_score INT,
    freshness_score INT,

    -- Deduplication
    is_duplicate BOOLEAN DEFAULT false,
    canonical_id INT REFERENCES schema.kb(id),
    similarity_hash TEXT,

    -- Versioning
    version INT DEFAULT 1,
    previous_id INT REFERENCES schema.kb(id),

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);
```

---

## Search Function Templates

### Basic Search

```sql
CREATE FUNCTION schema.search(query TEXT, lim INT DEFAULT 5)
RETURNS TABLE(id INT, title TEXT, content TEXT, distance FLOAT) AS $$
    SELECT id, title, content,
           (embedding <-> ruvector_embed(query)::ruvector)::FLOAT
    FROM schema.kb
    WHERE embedding IS NOT NULL
    ORDER BY embedding <-> ruvector_embed(query)::ruvector
    LIMIT lim;
$$ LANGUAGE sql;
```

### Filtered Search

```sql
CREATE FUNCTION schema.search_category(
    query TEXT,
    cat TEXT,
    min_quality INT DEFAULT 40,
    lim INT DEFAULT 5
) RETURNS TABLE(id INT, title TEXT, content TEXT, distance FLOAT) AS $$
    SELECT id, title, content,
           (embedding <-> ruvector_embed(query)::ruvector)::FLOAT
    FROM schema.kb
    WHERE embedding IS NOT NULL
      AND category = cat
      AND quality_score >= min_quality
      AND is_duplicate = false
    ORDER BY embedding <-> ruvector_embed(query)::ruvector
    LIMIT lim;
$$ LANGUAGE sql;
```

### Hybrid Search (Semantic + Keyword)

```sql
CREATE FUNCTION schema.hybrid_search(
    query TEXT,
    keyword TEXT DEFAULT NULL,
    lim INT DEFAULT 5
) RETURNS TABLE(id INT, title TEXT, score FLOAT) AS $$
    WITH semantic AS (
        SELECT id, title,
               1 - (embedding <-> ruvector_embed(query)::ruvector) as semantic_score
        FROM schema.kb
        WHERE embedding IS NOT NULL
    ),
    keyword_match AS (
        SELECT id,
               CASE WHEN keyword IS NOT NULL AND content ILIKE '%' || keyword || '%'
                    THEN 0.3 ELSE 0 END as keyword_score
        FROM schema.kb
    )
    SELECT s.id, s.title,
           (s.semantic_score + COALESCE(k.keyword_score, 0)) as score
    FROM semantic s
    LEFT JOIN keyword_match k ON s.id = k.id
    ORDER BY score DESC
    LIMIT lim;
$$ LANGUAGE sql;
```

---

## Quality Gates & Validation

### Entry Quality Checklist

| Criterion | Minimum | Target | Critical |
|-----------|---------|--------|----------|
| Content length | 100 chars | 500+ chars | Yes |
| Has embedding | Yes | Yes | Yes |
| Title present | Yes | Yes | Yes |
| Category assigned | Yes | Yes | No |
| Quality score | 40+ | 70+ | No |
| Unique (not duplicate) | Yes | Yes | Yes |

### Validation Queries

```sql
-- Check embedding coverage
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as embedded,
    ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / COUNT(*), 1) as pct
FROM schema.kb;

-- Check category distribution
SELECT category, COUNT(*),
       ROUND(AVG(quality_score), 1) as avg_quality
FROM schema.kb
GROUP BY category
ORDER BY count DESC;

-- Find quality issues
SELECT id, title,
       LENGTH(content) as content_len,
       quality_score
FROM schema.kb
WHERE quality_score < 40 OR LENGTH(content) < 100
LIMIT 20;

-- Check for duplicates
SELECT title, COUNT(*) as copies
FROM schema.kb
WHERE is_duplicate = false
GROUP BY title
HAVING COUNT(*) > 1;
```

---

## Performance Monitoring

### Index Health

```sql
-- Check index status
SELECT indexname, indexdef,
       pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
WHERE schemaname = 'your_schema'
AND indexdef LIKE '%hnsw%';

-- Verify index is valid
SELECT indexrelid::regclass, indisvalid, indisready
FROM pg_index
WHERE indexrelid = 'schema.idx_name'::regclass;
```

### Query Performance

```sql
-- Enable timing
\timing

-- Explain search query
EXPLAIN ANALYZE
SELECT id, title
FROM schema.kb
ORDER BY embedding <-> ruvector_embed('test')::ruvector
LIMIT 5;

-- Should see "Index Scan using idx_..._hnsw" in output
```

---

## Common Mistakes (NEVER DO THESE)

### 1. Wrong Embedding Type
```sql
-- WRONG: Using real[] or float4[]
embedding real[],
embedding float4[],
embedding float8[],

-- CORRECT: Using ruvector
embedding ruvector,
```

### 2. Missing HNSW Index
```sql
-- WRONG: No index or wrong index type
CREATE INDEX ON kb (embedding);  -- B-tree, useless for vectors

-- CORRECT: HNSW with operator class
CREATE INDEX ON kb USING hnsw (embedding ruvector_cosine_ops);
```

### 3. Dimension Mismatch
```sql
-- WRONG: Mixing 128d and 384d embeddings
-- This causes silent failures in search

-- CORRECT: Pick ONE model, use consistently
SELECT ruvector_embed('text', 'all-MiniLM-L6-v2');  -- Always 384d
```

### 4. Missing Schema Prefix
```sql
-- WRONG: Creating in public schema
CREATE TABLE knowledge (...);

-- CORRECT: Isolated schema
CREATE SCHEMA myproject;
CREATE TABLE myproject.knowledge (...);
```

### 5. Bulk Insert Before Index
```sql
-- WRONG: Insert 100K rows, then create index (very slow)
INSERT INTO kb ... (100K rows);
CREATE INDEX ...;

-- CORRECT: Create index first, then insert
CREATE INDEX ...;
INSERT INTO kb ... (100K rows);
-- Or use CREATE INDEX CONCURRENTLY for existing data
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│           RUVECTOR KB SETUP QUICK REFERENCE                 │
├─────────────────────────────────────────────────────────────┤
│ Embedding Type:     ruvector (not real[])                   │
│ Default Model:      all-MiniLM-L6-v2 (384d)                 │
│ Index Type:         HNSW with ruvector_cosine_ops           │
│ Index Params:       m=16, ef_construction=64 (balanced)     │
│ Search Param:       SET hnsw.ef_search = 40-200             │
│ Quality Threshold:  quality_score >= 40                     │
│ Schema Pattern:     One schema per project                  │
├─────────────────────────────────────────────────────────────┤
│ VERIFY:                                                     │
│   SELECT * FROM ruvector_embedding_models();                │
│   SELECT pg_typeof(embedding) FROM schema.kb LIMIT 1;       │
│   EXPLAIN ... (should show "Index Scan using hnsw")         │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix: Full Schema Template

```sql
-- Complete production-ready KB schema
-- Copy and customize for your project

BEGIN;

-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS {{PROJECT_NAME}};

-- 2. Create main table
CREATE TABLE {{PROJECT_NAME}}.knowledge (
    id SERIAL PRIMARY KEY,
    doc_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    category TEXT DEFAULT 'general',
    embedding ruvector,
    quality_score INT DEFAULT 50 CHECK (quality_score BETWEEN 0 AND 100),
    is_duplicate BOOLEAN DEFAULT false,
    canonical_id INT REFERENCES {{PROJECT_NAME}}.knowledge(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_{{PROJECT_NAME}}_hnsw
    ON {{PROJECT_NAME}}.knowledge
    USING hnsw (embedding ruvector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_{{PROJECT_NAME}}_category
    ON {{PROJECT_NAME}}.knowledge (category);

CREATE INDEX idx_{{PROJECT_NAME}}_quality
    ON {{PROJECT_NAME}}.knowledge (quality_score DESC);

CREATE INDEX idx_{{PROJECT_NAME}}_active
    ON {{PROJECT_NAME}}.knowledge (id)
    WHERE is_duplicate = false AND quality_score >= 40;

-- 4. Create search function
CREATE FUNCTION {{PROJECT_NAME}}.search(
    query TEXT,
    limit_count INT DEFAULT 5
) RETURNS TABLE(
    id INT,
    title TEXT,
    content TEXT,
    category TEXT,
    distance FLOAT
) AS $$
    SELECT k.id, k.title, k.content, k.category,
           (k.embedding <-> ruvector_embed(query)::ruvector)::FLOAT
    FROM {{PROJECT_NAME}}.knowledge k
    WHERE k.embedding IS NOT NULL
      AND k.is_duplicate = false
      AND k.quality_score >= 40
    ORDER BY k.embedding <-> ruvector_embed(query)::ruvector
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

-- 5. Create update trigger
CREATE OR REPLACE FUNCTION {{PROJECT_NAME}}.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_timestamp
    BEFORE UPDATE ON {{PROJECT_NAME}}.knowledge
    FOR EACH ROW EXECUTE FUNCTION {{PROJECT_NAME}}.update_timestamp();

COMMIT;
```

---

*This document is the single source of truth for Ruvector KB setup.*
*Last validated: 2026-01-02 with ruvector-postgres latest*
