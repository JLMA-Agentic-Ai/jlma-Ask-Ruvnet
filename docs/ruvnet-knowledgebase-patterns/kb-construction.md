Updated: 2025-12-30 14:30:00 EST | Version 1.0.0
Created: 2025-12-30 14:30:00 EST

# KB Construction Patterns

**How to Build Knowledge Bases** - Chunking, embeddings, persistence, WAL

---

## Knowledge Organization

### Section-Based Chunking (REQUIRED)

```javascript
function parseMarkdownIntoChunks(content, filePath) {
    const chunks = [];
    const lines = content.split('\n');
    let currentSection = { title: 'Introduction', content: [], startLine: 0 };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

        if (headerMatch) {
            if (currentSection.content.length > 0) {
                const sectionContent = currentSection.content.join('\n').trim();
                if (sectionContent.length > 50) {
                    chunks.push({
                        id: `${path.basename(filePath)}_${currentSection.startLine}`,
                        title: currentSection.title,
                        content: sectionContent,
                        metadata: { source: filePath, section: currentSection.title }
                    });
                }
            }
            currentSection = { title: headerMatch[2].trim(), content: [], startLine: i };
        } else {
            currentSection.content.push(line);
        }
    }
    return chunks;
}
```

### Topic Detection

```javascript
const topicPatterns = [
    { pattern: /ruvector|vector\s*db|hnsw|embedding/i, topic: 'RuVector' },
    { pattern: /ruvllm|sona|learning\s*loop/i, topic: 'RuvLLM' },
    { pattern: /agentic[- ]flow|agent|reasoningbank/i, topic: 'Agentic Flow' },
    { pattern: /ruflo|hive[- ]mind|swarm/i, topic: 'Ruflo' },
];
```

### Metadata Enrichment (REQUIRED)

```javascript
const enrichedMetadata = {
    source: { path: filePath, type: 'documentation', hash: contentHash },
    structure: { section: chunk.title, level: chunk.level },
    semantic: { topics: detectTopics(chunk.content) },
    temporal: { ingestedAt: new Date().toISOString(), version: 1 }
};
```

---

## Ingestion Pipeline

```
Document → Parsing → Chunking → Embedding → Storage → Indexing
```

### Multi-Format Support

| Format | Parser | Chunking |
|--------|--------|----------|
| Markdown | Header-based | Section-based |
| PDF | LlamaParse | Paragraph-based |
| Code | AST | Function-based |
| JSON/YAML | Structure | Object-based |

### Deduplication (REQUIRED)

```javascript
const crypto = require('crypto');

function generateContentHash(content) {
    return crypto.createHash('md5').update(content.trim()).digest('hex');
}

async function insertWithDedup(db, entry) {
    const contentHash = generateContentHash(entry.content);
    const existing = await db.query(
        'SELECT id, version FROM knowledge WHERE content_hash = $1', [contentHash]
    );

    if (existing.rows.length > 0) {
        // Update version, don't duplicate
        await db.query('UPDATE knowledge SET version = version + 1 WHERE id = $1',
            [existing.rows[0].id]);
        return { deduplicated: true };
    }
    // Insert new
    return { deduplicated: false };
}
```

---

## Persistence Patterns

### File Structure

```
.ruvector/
├── knowledge-base/
│   ├── vectors.bin       # Binary vectors (Float32Array)
│   ├── metadata.json     # Metadata index
│   ├── manifest.json     # Database manifest
│   └── wal.log           # Write-ahead log
```

### Binary Serialization

```javascript
async save() {
    const vectorBuffer = Buffer.alloc(vectorCount * dimensions * 4);
    let offset = 0;
    for (const [id, vector] of this.vectorCache.entries()) {
        for (let i = 0; i < vector.length; i++) {
            vectorBuffer.writeFloatLE(vector[i], offset);
            offset += 4;
        }
    }
    // Atomic write: temp file then rename (crash-safe)
    await writeFile(paths.vectorsTemp, vectorBuffer);
    await rename(paths.vectorsTemp, paths.vectors);
}
```

### Write-Ahead Log (WAL)

```javascript
async writeWAL(op, data) {
    const entry = { op, ts: Date.now(), data };
    await appendFile(this.walPath, JSON.stringify(entry) + '\n');
}

async replayWAL() {
    const lines = (await readFile(this.walPath, 'utf8')).split('\n');
    for (const line of lines.filter(l => l)) {
        const entry = JSON.parse(line);
        if (entry.op === 'INSERT') {
            this.vectorCache.set(entry.data.id, new Float32Array(entry.data.vector));
        }
    }
}
```

---

## ruvector-postgres (RECOMMENDED)

```sql
-- Schema isolation
CREATE SCHEMA IF NOT EXISTS project_name;

-- Knowledge table
CREATE TABLE project_name.knowledge (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    embedding real[] NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert with auto-embedding
INSERT INTO project_name.knowledge (title, content, embedding)
VALUES ('Title', 'Content', ruvector_embed('Title Content'));

-- Semantic search
SELECT title, content,
    1 - cosine_distance_arr(embedding, ruvector_embed($query)) AS similarity
FROM project_name.knowledge
WHERE 1 - cosine_distance_arr(embedding, ruvector_embed($query)) > 0.65
ORDER BY similarity DESC LIMIT 5;
```

---

## HNSW Configuration

```javascript
const hnswConfig = {
    M: 16,                    // Connections per layer (16-32)
    efConstruction: 200,      // Build quality (200-400)
    efSearch: 100,            // Search quality (100-200)
};
```

---

## Quality Assurance

### Coverage Analysis

```javascript
async function analyzeCoverage(db) {
    const expectedTopics = ['RuVector', 'RuvLLM', 'Agentic Flow', 'Ruflo'];
    const topicCounts = {};

    // Count topics in KB
    for (const entry of allEntries) {
        for (const topic of entry.metadata?.topics || []) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
    }

    // Find gaps
    const gaps = expectedTopics.filter(t => !topicCounts[t] || topicCounts[t] < 3);
    return { topicDistribution: topicCounts, gaps };
}
```
