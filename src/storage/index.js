/**
 * Storage Module - Intelligent Persistent Vector Storage
 *
 * This module provides persistent vector storage that leverages the full
 * RuVector architecture while surviving process restarts.
 *
 * EXPORTS:
 * - PersistentVectorDB: Core persistent vector database
 * - SwarmVectorMemory: Swarm memory with semantic search
 *
 * REPLACES:
 * - SQLite-based .swarm/memory.db
 * - SQLite-based agentdb.db
 *
 * PROVIDES:
 * - 125x faster similarity search (HNSW via RuVector)
 * - Semantic memory retrieval
 * - Full persistence across restarts
 * - WAL for crash recovery
 */

const { PersistentVectorDB, getPersistentVectorDB, closeAllDatabases } = require('./persistent-vector-db');
const { SwarmVectorMemory, getSwarmMemory } = require('./swarm-vector-memory');

module.exports = {
  // Core classes
  PersistentVectorDB,
  SwarmVectorMemory,

  // Factory functions
  getPersistentVectorDB,
  getSwarmMemory,

  // Cleanup
  closeAllDatabases
};
