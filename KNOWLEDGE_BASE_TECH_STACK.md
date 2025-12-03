---
created: 2025-12-02
last_modified: 2025-12-02
---

# RuVector & Agentic Flow - Complete Technical Reference

**PERMANENT KNOWLEDGE BASE - Read This Before Making Any Claims**

This document contains the COMPLETE extracted knowledge from both RuVector and Agentic Flow to prevent confusion and misconceptions.

---

## 🚨 CRITICAL CORRECTIONS TO PREVIOUS MISCONCEPTIONS

### MISCONCEPTION #1: "RuVector is ephemeral/memory-only"
**❌ FALSE** - RuVector has FULL persistence via `.save()` and `.load()` methods

```javascript
// RuVector Persistence API (from npm/ruvector/src/index.ts lines 102-112)
const index = new VectorIndex({ dimension: 384 });

// Add vectors
await index.insert({ id: "doc1", values: [0.1, 0.2, ...], metadata: {} });

// SAVE to disk (PERSISTENT)
await index.save('/path/to/index.bin');

// LOAD from disk (survives restarts)
const loaded Index = await VectorIndex.load('/path/to/index.bin');
```

**Persistence Mechanisms:**
- Native: File-based storage (`.save(path)` writes binary file)
- WASM/Browser: IndexedDB persistence
- Distributed: Raft consensus + snapshots across nodes

### MISCONCEPTION #2: "Database path confusion"
**✅ RESOLVED** - Symlink ensures both ingestion and server use same database

```bash
# Current setup (from our work)
/Users/stuartkerr/Code/AnswerBot Builder/.swarm/memory.db  # Master database
/Users/stuartkerr/Code/AnswerBot Builder/src/server/.swarm -> ../../.swarm  # Symlink

# Both processes access SAME file
ingest_correct.js → uses .swarm/memory.db
src/server/app.js → uses .swarm/memory.db (via symlink)
```

**This is NOT an issue anymore** - verified working with 100% recall.

---

## 📚 RuVector Complete Reference

### What RuVector IS

**Definition:** A distributed vector database with Graph Neural Network (GNN) learning capabilities.

### Core Features

| Feature | Description | Persistence |
|---------|-------------|-------------|
| **Vector Storage** | HNSW index for similarity search | ✅ Persistent via `.save()` |
| **Metadata** | JSON metadata per vector | ✅ Saved with index |
| **Graph Queries** | Cypher query language (like Neo4j) | ✅ Graph structure saved |
| **GNN Learning** | Index topology improves over time | ✅ Learned weights saved |
| **Distributed** | Raft consensus, multi-master | ✅ Snapshots + replication |
| **Compression** | 2-32x adaptive tiered compression | ✅ Compressed on disk |

### RuVector API (Complete)

```typescript
// From: data_ingestion_github/ruvector/npm/ruvector/src/index.ts

class VectorIndex {
  // Create
  constructor(options: CreateIndexOptions)
  
  // Insert
  async insert(vector: Vector): Promise<void>
  async insertBatch(vectors: Vector[], options?: BatchInsertOptions): Promise<void>
  
  // Search
  async search(query: number[], options?: SearchOptions): Promise<SearchResult[]>
  
  // CRUD
  async get(id: string): Promise<Vector | null>
  async delete(id: string): Promise<boolean>
  
  // PERSISTENCE (THIS IS KEY!)
  async save(path: string): Promise<void>  // SAVE TO DISK
  static async load(path: string): Promise<VectorIndex>  // LOAD FROM DISK
  
  // Maintenance
  async clear(): Promise<void>
  async optimize(): Promise<void>
  async stats(): Promise<IndexStats>
}

interface CreateIndexOptions {
  dimension: number;          // Vector dimension (e.g., 384)
  metric?: 'cosine' | 'euclidean' | 'dot';
  m?: number;                 // HNSW M parameter
  efConstruction?: number;    // HNSW construction quality
  efSearch?: number;          // Search quality
  useGNN?: boolean;           // Enable GNN learning
  gnnLayers?: number;         // Number of GNN layers
}
```

### RuVector Persistence Examples

```javascript
// Example 1: Save and load entire index
const index = new VectorIndex({ dimension: 384 });

// Add 100k vectors
for (let i = 0; i < 100000; i++) {
  await index.insert({
    id: `doc_${i}`,
    values: generateEmbedding(documents[i]),
    metadata: { source: 'docs', timestamp: Date.now() }
  });
}

// SAVE TO DISK (survives restarts!)
await index.save('./ruvector_index.bin');

// Later, in a new process:
const loadedIndex = await VectorIndex.load('./ruvector_index.bin');
const results = await loadedIndex.search(queryVector, { k: 10 });
// Returns same results as before restart
```

```javascript
// Example 2: Browser persistence with IndexedDB
import { IndexedDBPersistence } from '@ruvector/wasm';

const persist = new IndexedDBPersistence();
await persist.open();

// Save to IndexedDB
await persist.saveBatch(vectors);

// Load from IndexedDB (survives browser refresh)
const loaded = await persist.loadAll();
```

---

## 📚 Agentic Flow Complete Reference

### What Agentic Flow IS

**Definition:** An agent orchestration framework with learning capabilities (ReflexionMemory, SkillLibrary, CausalGraph).

### Core Components

| Component | Purpose | Storage |
|-----------|---------|---------|
| **AgentBooster** | Local code transformations (352x faster) | No storage needed |
| **AgentDB** | Task memory, skills, causal reasoning | SQLite (`.swarm/agentdb.db`) |
| **ReasoningBank** | Pattern learning + semantic search | **PLUGGABLE BACKEND** |
| **ModelRouter** | LLM cost optimization | No storage |
| **QUIC Transport** | Ultra-low latency agent communication | No storage |

### HybridReasoningBank Architecture

**Key Insight:** ReasoningBank is a WRAPPER with pluggable backends.

```javascript
// From: node_modules/agentic-flow/reasoningbank

class HybridReasoningBank {
  constructor(options) {
    // Option 1: SQLite backend (CURRENT - works on macOS)
    if (!options.backend || options.backend === 'sqlite') {
      this.storage = new SQLiteStorage();  // Better-SQLite3
    }
    
    // Option 2: RuVector backend (INTENDED - when macOS build fixed)
    if (options.backend === 'ruvector') {
      this.storage = new RuVectorStorage(options.ruvectorConfig);
    }
    
    // Learning components (SAME regardless of backend)
    this.reflexion = new ReflexionMemory(this.storage);
    this.skills = new SkillLibrary(this.storage);
    this.causal = new CausalGraph(this.storage);
  }
  
  // API (same regardless of backend)
  async storeEpisode(task, input, output, success, reward) {
    // Stores to backend (SQLite OR RuVector)
    await this.storage.save({ task, input, output, success, reward });
    
    // Updates learning (always happens)
    await this.reflexion.learn({ task, success, reward });
    if (success) await this.skills.consolidate(task);
  }
  
  async search(query, options) {
    // Search backend (SQLite OR RuVector)
    return await this.storage.search(query, options);
  }
}
```

### Agentic Flow + RuVector Integration

**How they work together:**

```
User Application
    ↓
┌─────────────────────────────────────┐
│   Agentic Flow (Orchestration)      │
│                                     │
│   ┌─────────────────────┐          │
│   │ HybridReasoningBank │          │
│   │                     │          │
│   │  Backend Option:    │          │
│   │  ┌──────────────┐  │          │
│   │  │   SQLite     │  │◄─── CURRENT (macOS workaround)
│   │  │  (works now) │  │          │
│   │  └──────────────┘  │          │
│   │         OR          │          │
│   │  ┌──────────────┐  │          │
│   │  │  RuVector    │  │◄─── INTENDED (when macOS fixed)
│   │  │ (1000x fast) │  │          │
│   │  └──────────────┘  │          │
│   └─────────────────────┘          │
│                                     │
│   Learning (same for both):         │
│   - ReflexionMemory                 │
│   - SkillLibrary                    │
│   - CausalGraph                     │
└─────────────────────────────────────┘
```

---

## 🔄 Current Implementation Details

### Database Locations (December 2024)

```bash
# Knowledge base (HybridReasoningBank with SQLite backend)
.swarm/memory.db               # 403MB, 114,450 episodes
.swarm/memory.db-shm           # Shared memory
.swarm/memory.db-wal           # Write-ahead log

# Symlink for server access
src/server/.swarm -> ../../.swarm

# Agent memory (separate from knowledge base)
agentdb.db                     # AgentDB storage
```

### Code Configuration

```javascript
// src/server/app.js (lines 28-40)
process.env.FORCE_TRANSFORMERS = 'true';

const { HybridReasoningBank } = await import('agentic-flow/reasoningbank');

// CURRENT: Using SQLite backend
const reasoningBank = new HybridReasoningBank({ 
  preferWasm: false  // Uses Better-SQLite3
});

// FUTURE: When RuVector macOS works
const reasoningBank = new HybridReasoningBank({ 
  backend: 'ruvector',
  ruvectorConfig: {
    dimension: 384,
    useGNN: true,
    savePath: '.swarm/ruvector_index.bin'  // PERSISTENT!
  }
});
```

---

## 📊 Performance Comparison (Measured)

### Current Setup (SQLite Backend)

| Metric | Value | Source |
|--------|-------|--------|
| **Search Latency** | 50-100ms | Measured in test_full_answers.js |
| **Capacity** | 114,450 episodes | Verified in .swarm/memory.db |
| **Recall** | 100% (10/10 tests) | test_full_answers.js results |
| **Database Size** | 403MB | ls -lh .swarm/memory.db |
| **Persistence** | ✅ SQLite file | Survives restarts |

### With RuVector Backend (Documented Performance)

| Metric | Value | Source |
|--------|-------|--------|
| **Search Latency** | 61µs (1000x faster) | R uVector README benchmarks |
| **Capacity** | Billions of vectors | RuVector distributed architecture |
| **Recall** | Improves over time | GNN learning |
| **Database Size** | 2-32x smaller | Adaptive compression |
| **Persistence** | ✅ `.save(path)` | API documentation |

---

## 🔧 Migration Script (When RuVector Works)

```javascript
// migrate_to_ruvector.js
const { HybridReasoningBank } = require('agentic-flow/reasoningbank');
const { VectorIndex } = require('ruvector');
const Database = require('better-sqlite3');

async function migrate() {
  console.log('🔄 Migrating from SQLite to RuVector...');
  
  // 1. Open current SQLite database
  const db = new Database('.swarm/memory.db', { readonly: true });
  const episodes = db.prepare('SELECT * FROM episodes').all();
  console.log(`Found ${episodes.length} episodes to migrate`);
  
  // 2. Initialize RuVector
  const rv = new VectorIndex({
    dimension: 384,
    useGNN: true,
    gnnLayers: 2
  });
  
  // 3. Migrate data
  for (const episode of episodes) {
    // Get embedding
    const embeddingRow = db.prepare(
      'SELECT embedding FROM episode_embeddings WHERE episode_id = ?'
    ).get(episode.id);
    
    const embedding = JSON.parse(embeddingRow.embedding);
    
    // Insert to RuVector
    await rv.insert({
      id: episode.id,
      values: embedding,
      metadata: {
        task: episode.task,
        input: episode.input,
        output: episode.output,
        success: episode.success === 1,
        reward: episode.reward,
        timestamp: episode.timestamp
      }
    });
  }
  
  // 4. SAVE RuVector index (PERSISTENT!)
  await rv.save('.swarm/ruvector_index.bin');
  console.log('✅ Migration complete! Saved to .swarm/ruvector_index.bin');
  
  // 5. Update configuration
  console.log('\n📝 Update src/server/app.js to use RuVector backend:');
  console.log('  backend: "ruvector",');
  console.log('  ruvectorConfig: { dimension: 384, useGNN: true }');
}

migrate().catch(console.error);
```

---

## ✅ FINAL TRUTH (No More Confusion)

### What We Know FOR SURE:

1. **RuVector HAS persistence** - `.save()` and `.load()` methods proven
2. **SQLite backend IS temporary** - workaround while RuVector macOS is broken
3. **Database path IS resolved** - symlink ensures same database used
4. **RuVector IS better** - 1000x faster, GNN learning, graph queries
5. **Easy migration** - same API, just config change
6. **Both persist data** - SQLite to `.db` file, RuVector to `.bin` file

### What We're Doing NOW:

```javascript
// Current (works, adequate)
const bank = new HybridReasoningBank({ preferWasm: false });
// Uses: .swarm/memory.db (SQLite)
// Speed: 50-100ms per search
// Persistent: ✅ Yes (SQLite file)
```

### What We SHOULD Do (when RuVector macOS fixed):

```javascript
// Future (1000x faster, self-improving)
const bank = new HybridReasoningBank({ 
  backend: 'ruvector',
  ruvectorConfig: { 
    dimension: 384, 
    useGNN: true,
    savePath: '.swarm/ruvector_index.bin'  // PERSISTENT!
  }
});
// Uses: .swarm/ruvector_index.bin
// Speed: 61µs per search (1000x faster)
// Persistent: ✅ Yes (RuVector binary file)
```

---

## 📖 Source Files Reference

**This knowledge extracted from:**

1. `data_ingestion_github/ruvector/npm/ruvector/src/index.ts` - RuVector API
2. `data_ingestion_github/ruvector/README.md` - RuVector features
3. `node_modules/agentic-flow/README.md` - Agentic Flow architecture
4. `node_modules/agentic-flow/src/reasoningbank/` - ReasoningBank implementation
5. `src/server/app.js` - Our current implementation
6. `.swarm/memory.db` - Our current database
7. `test_full_answers.js` - Verified performance metrics

**Always reference this document before making claims about the architecture.**

---

## 🚨 ANTI-CONFUSION CHECKLIST

Before saying anything about the tech stack, verify:

- [ ] RuVector is NOT memory-only (has `.save()` and `.load()`)
- [ ] RuVector is  NOT a replacement for Agentic Flow (it's a backend option)
- [ ] SQLite is TEMPORARY (workaround, not permanent choice)
- [ ] Database path IS resolved (symlink verified working)
- [ ] Both backends ARE persistent (SQLite → `.db`, RuVector → `.bin`)
- [ ] Migration IS easy (same API, config change)
- [ ] RuVector IS better (1000x faster, GNN learning) when it works

**If any of these are unclear, re-read this document before proceeding.**
