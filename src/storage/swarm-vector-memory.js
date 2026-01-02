/**
 * SwarmVectorMemory - Drop-in replacement for SQLite-based swarm memory
 *
 * This integrates PersistentVectorDB with claude-flow's swarm memory system,
 * providing semantic search capabilities instead of key-value lookups.
 *
 * REPLACES:
 * - .swarm/memory.db (SQLite)
 * - agentdb.db (SQLite)
 *
 * PROVIDES:
 * - Semantic memory retrieval (find by meaning, not just key)
 * - 125x faster similarity search (HNSW via RuVector)
 * - Full persistence across restarts
 * - WAL for crash recovery
 *
 * USAGE:
 * const { swarmMemory } = require('./swarm-vector-memory');
 * await swarmMemory.store('agent-1', 'task-completed', { result: 'success' });
 * const similar = await swarmMemory.findSimilar('task completed successfully');
 *
 * @author RuVector Team
 */

const { PersistentVectorDB, getPersistentVectorDB } = require('./persistent-vector-db');

// Try to load ONNX embedding service (ruvector 0.1.77+)
let embedder = null;
let useONNX = false;
try {
  const ruvector = require('ruvector');
  // Prefer ONNX local embeddings (faster, offline, free)
  if (ruvector.ONNXEmbedder) {
    embedder = new ruvector.ONNXEmbedder();
    useONNX = true;
  } else if (ruvector.createEmbedder) {
    embedder = ruvector.createEmbedder({ model: 'all-MiniLM-L6-v2' });
    useONNX = true;
  } else if (ruvector.embeddingService) {
    embedder = ruvector.embeddingService;
  }
} catch {
  // Will use text hashing as fallback
}

/**
 * Simple text to vector hash (fallback when no embedder available)
 * This provides consistent hashing but no semantic understanding
 */
function textToHashVector(text, dimensions = 1536) {
  const vector = new Float32Array(dimensions);
  const str = String(text);

  // Use FNV-1a style hashing distributed across dimensions
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const idx = i % dimensions;
    vector[idx] = (vector[idx] * 31 + charCode) % 1000 / 1000;
  }

  // Normalize
  let mag = 0;
  for (let i = 0; i < dimensions; i++) mag += vector[i] * vector[i];
  mag = Math.sqrt(mag) || 1;
  for (let i = 0; i < dimensions; i++) vector[i] /= mag;

  return vector;
}

/**
 * Generate embedding for text
 */
async function getEmbedding(text, dimensions = 1536) {
  if (embedder) {
    try {
      return await embedder.embed(text);
    } catch (e) {
      console.warn('Embedding failed, using hash fallback:', e.message);
    }
  }
  return textToHashVector(text, dimensions);
}

/**
 * SwarmVectorMemory - Semantic memory for swarm agents
 */
class SwarmVectorMemory {
  constructor(options = {}) {
    // ONNX all-MiniLM-L6-v2 uses 384 dimensions
    // Fallback uses 1536 dimensions
    const defaultDims = useONNX ? 384 : 1536;
    this.options = {
      path: options.path || '.ruvector/swarm-memory',
      dimensions: options.dimensions || defaultDims,
      ...options
    };
    this.db = null;
    this.initialized = false;
    console.log(`SwarmVectorMemory: ${useONNX ? 'ONNX (384d)' : 'Default (1536d)'} embedding mode`);
  }

  /**
   * Initialize the memory system
   */
  async initialize() {
    if (this.initialized) return;
    this.db = await getPersistentVectorDB('swarm-memory', this.options);
    this.initialized = true;
    console.log('SwarmVectorMemory initialized with persistent storage');
  }

  async ensureInit() {
    if (!this.initialized) await this.initialize();
  }

  /**
   * Store a memory entry
   *
   * @param {string} namespace - Namespace (e.g., 'agent-1', 'task', 'session')
   * @param {string} key - Memory key
   * @param {any} value - Value to store (will be serialized)
   * @param {Object} metadata - Additional metadata
   */
  async store(namespace, key, value, metadata = {}) {
    await this.ensureInit();

    const id = `${namespace}::${key}`;
    const textContent = typeof value === 'string' ? value : JSON.stringify(value);

    // Generate embedding for semantic search
    const vector = await getEmbedding(textContent, this.options.dimensions);

    await this.db.insert({
      id,
      vector,
      metadata: {
        namespace,
        key,
        value: textContent,
        valueType: typeof value,
        timestamp: Date.now(),
        ...metadata
      }
    });

    return id;
  }

  /**
   * Retrieve a memory entry by key
   */
  async retrieve(namespace, key) {
    await this.ensureInit();

    const id = `${namespace}::${key}`;
    const entry = await this.db.get(id);

    if (!entry) return null;

    const meta = entry.metadata;
    let value = meta.value;

    // Parse JSON if it was an object
    if (meta.valueType === 'object') {
      try {
        value = JSON.parse(value);
      } catch {}
    }

    return {
      key: meta.key,
      value,
      timestamp: meta.timestamp,
      metadata: meta
    };
  }

  /**
   * Find semantically similar memories
   *
   * @param {string} query - Query text
   * @param {number} k - Number of results
   * @param {Object} filter - Optional metadata filter
   */
  async findSimilar(query, k = 10, filter = null) {
    await this.ensureInit();

    const queryVector = await getEmbedding(query, this.options.dimensions);
    const results = await this.db.search({ vector: queryVector, k, filter });

    return results.map(r => ({
      key: r.metadata?.key,
      namespace: r.metadata?.namespace,
      value: r.metadata?.value,
      similarity: r.score,
      timestamp: r.metadata?.timestamp,
      metadata: r.metadata
    }));
  }

  /**
   * Find memories by namespace
   */
  async findByNamespace(namespace, k = 100) {
    await this.ensureInit();

    // Use a search with namespace filter
    // Since we need to iterate, we'll do a broad search and filter
    const results = await this.db.search({
      vector: new Float32Array(this.options.dimensions).fill(0),
      k: 10000  // Large limit to get all
    });

    return results
      .filter(r => r.metadata?.namespace === namespace)
      .slice(0, k)
      .map(r => ({
        key: r.metadata?.key,
        value: r.metadata?.value,
        timestamp: r.metadata?.timestamp,
        metadata: r.metadata
      }));
  }

  /**
   * List all memory keys in a namespace
   */
  async list(namespace) {
    const memories = await this.findByNamespace(namespace);
    return memories.map(m => m.key);
  }

  /**
   * Delete a memory entry
   */
  async delete(namespace, key) {
    await this.ensureInit();

    const id = `${namespace}::${key}`;
    return this.db.delete(id);
  }

  /**
   * Clear all memories in a namespace
   */
  async clearNamespace(namespace) {
    await this.ensureInit();

    const memories = await this.findByNamespace(namespace);
    for (const mem of memories) {
      await this.delete(namespace, mem.key);
    }
  }

  /**
   * Get memory statistics
   */
  async getStats() {
    await this.ensureInit();
    return this.db.getStats();
  }

  /**
   * Force save to disk
   */
  async flush() {
    await this.ensureInit();
    return this.db.flush();
  }

  /**
   * Close the memory system
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.initialized = false;
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let defaultMemory = null;

/**
 * Get the default swarm memory instance
 */
async function getSwarmMemory(options = {}) {
  if (!defaultMemory) {
    defaultMemory = new SwarmVectorMemory(options);
    await defaultMemory.initialize();
  }
  return defaultMemory;
}

// Convenience exports
module.exports = {
  SwarmVectorMemory,
  getSwarmMemory,

  // Convenience singleton access
  get swarmMemory() {
    if (!defaultMemory) {
      throw new Error('Swarm memory not initialized. Call getSwarmMemory() first.');
    }
    return defaultMemory;
  }
};
