# Phase 3: Persistence & Verification

## Purpose

Store the knowledge base to PostgreSQL with embeddings and verify that retrieval works correctly.

---

## Steps

### 3.1 Generate Embeddings

For each KB node, generate an embedding:

```typescript
import { embed } from './embedding';

async function generateEmbeddings(nodes: KBNode[]) {
  for (const node of nodes) {
    // Combine title and content for embedding
    const text = `${node.title} ${node.content}`;
    node.embedding = await embed(text);
  }
}
```

**Using ruvector (if available):**
```sql
-- Generate embedding inline
UPDATE kb_nodes 
SET embedding = ruvector_embed('all-MiniLM-L6-v2', title || ' ' || content)
WHERE embedding IS NULL;
```

**Using external API (OpenAI, etc.):**
```typescript
const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: text
});
node.embedding = response.data[0].embedding;
```

### 3.2 Insert Nodes

```sql
INSERT INTO kb_nodes (
  namespace, path, title, content,
  source_expert, source_url, confidence,
  embedding, metadata
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
)
ON CONFLICT (namespace, path) DO UPDATE SET
  content = EXCLUDED.content,
  source_expert = EXCLUDED.source_expert,
  source_url = EXCLUDED.source_url,
  confidence = EXCLUDED.confidence,
  embedding = EXCLUDED.embedding,
  updated_at = NOW();
```

### 3.3 Create Index

```sql
-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS kb_nodes_embedding_idx 
ON kb_nodes USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Text search index
CREATE INDEX IF NOT EXISTS kb_nodes_content_idx 
ON kb_nodes USING gin(to_tsvector('english', content));
```

### 3.4 Verify Retrieval

Test semantic search:
```sql
SELECT title, source_expert, confidence,
       embedding <=> $query_embedding AS distance
FROM kb_nodes
WHERE namespace = 'your-namespace'
ORDER BY distance
LIMIT 5;
```

Test hybrid search:
```sql
SELECT title, source_expert,
  0.7 * (1.0 / (1.0 + (embedding <=> $query_embedding))) +
  0.3 * ts_rank(to_tsvector('english', content), plainto_tsquery('english', $keywords))
  AS score
FROM kb_nodes
WHERE namespace = 'your-namespace'
ORDER BY score DESC
LIMIT 5;
```

### 3.5 Generate Statistics Report

```sql
SELECT 
  namespace,
  COUNT(*) as node_count,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
  AVG(confidence) as avg_confidence,
  COUNT(DISTINCT source_expert) as expert_count
FROM kb_nodes
GROUP BY namespace;
```

---

## Quality Gate

- [ ] All nodes have embeddings
- [ ] HNSW index created
- [ ] Semantic search returns relevant results
- [ ] All nodes have source_expert attribution
- [ ] All nodes have confidence scores

---

**Proceed to Phase 4: Visualization**
