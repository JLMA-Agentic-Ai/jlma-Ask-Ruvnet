/**
 * Utilities API - Shared RuvNet Tools Knowledge Base
 * Updated: 2025-12-29 17:55:00 EST | Version 1.0.0
 *
 * READ-ONLY service providing shared tool documentation:
 * - Agent spawning patterns (150+ agent types)
 * - Swarm configurations (hierarchical, mesh, ring, star)
 * - Consensus protocols (Byzantine, Raft, CRDT, Gossip)
 * - RL algorithms (Decision Transformer, Actor-Critic, PPO)
 * - Deployment guides (Docker, Railway, K8s)
 * - Memory architectures
 *
 * This is the SINGLE SOURCE OF TRUTH for tool documentation.
 * Businesses query this API in development, embed snapshot for production.
 */

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Configuration
const config = {
  port: parseInt(process.env.PORT || '5100'),
  dataPath: process.env.DATA_PATH || './data',
  ruvnetToolsPath: process.env.RUVNET_TOOLS_PATH || './ruvnet-tools'
};

// In-memory utilities store
let utilitiesData = [];
let utilitiesIndex = new Map();

/**
 * Load utilities from RuvNet tools knowledge base
 */
async function loadUtilities() {
  console.log('[Utilities] Loading RuvNet tools knowledge base...');

  // Try to load from linked ruvnet-tools directory
  const metadataPath = path.join(config.ruvnetToolsPath, 'metadata.json');
  const vectorsPath = path.join(config.ruvnetToolsPath, 'vectors.bin');

  if (fs.existsSync(metadataPath) && fs.existsSync(vectorsPath)) {
    try {
      // Load metadata
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const idIndex = metadata.idIndex || [];

      // Load vectors (binary)
      const vectorBuffer = fs.readFileSync(vectorsPath);
      const dimensions = 128;
      const expectedSize = idIndex.length * dimensions * 4;

      if (vectorBuffer.length !== expectedSize) {
        throw new Error(`Vector file size mismatch: expected ${expectedSize}, got ${vectorBuffer.length}`);
      }

      // Reconstruct data
      let offset = 0;
      for (const id of idIndex) {
        const embedding = [];
        for (let i = 0; i < dimensions; i++) {
          embedding.push(vectorBuffer.readFloatLE(offset));
          offset += 4;
        }

        const meta = metadata.metadata[id] || {};
        utilitiesData.push({
          id,
          content: meta.content || '',
          embedding,
          metadata: meta
        });

        utilitiesIndex.set(id, utilitiesData.length - 1);
      }

      console.log(`[Utilities] Loaded ${utilitiesData.length} vectors from RuvNet tools KB`);
    } catch (err) {
      console.error('[Utilities] Failed to load RuvNet tools:', err.message);
    }
  } else {
    console.log(`[Utilities] RuvNet tools KB not found at ${config.ruvnetToolsPath}`);
    console.log('[Utilities] Starting with empty utilities (add via API)');
  }
}

/**
 * Generate embedding for text (simple hash-based)
 */
function generateEmbedding(text, dimensions = 128) {
  const vector = new Float32Array(dimensions);
  const str = String(text).toLowerCase();

  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
    vector[i % dimensions] = (vector[i % dimensions] + (hash % 1000) / 1000) % 1;
  }

  for (let i = 0; i < str.length - 2; i++) {
    const ngram = str.slice(i, i + 3);
    let ngramHash = 0;
    for (let j = 0; j < ngram.length; j++) {
      ngramHash = ((ngramHash << 5) - ngramHash + ngram.charCodeAt(j)) >>> 0;
    }
    vector[ngramHash % dimensions] = (vector[ngramHash % dimensions] + 0.1) % 1;
  }

  let mag = 0;
  for (let i = 0; i < dimensions; i++) mag += vector[i] * vector[i];
  mag = Math.sqrt(mag) || 1;
  for (let i = 0; i < dimensions; i++) vector[i] /= mag;

  return Array.from(vector);
}

/**
 * Compute cosine similarity
 */
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * (b[i] || 0);
    magA += a[i] * a[i];
    magB += (b[i] || 0) * (b[i] || 0);
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

/**
 * Search utilities
 */
function searchUtilities(query, k = 5) {
  const queryEmbedding = generateEmbedding(query);

  const scored = utilitiesData.map(item => ({
    id: item.id,
    content: item.content,
    score: cosineSimilarity(queryEmbedding, item.embedding),
    metadata: item.metadata,
    source: 'utilities',
    readonly: true
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'utilities',
    vectorCount: utilitiesData.length,
    readonly: true
  });
});

/**
 * Search utilities
 */
app.post('/api/search', (req, res) => {
  const { query, k = 5 } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const results = searchUtilities(query, k);

  res.json({
    query,
    results,
    totalVectors: utilitiesData.length
  });
});

/**
 * Get statistics
 */
app.get('/api/stats', (req, res) => {
  res.json({
    service: 'utilities',
    vectorCount: utilitiesData.length,
    dimensions: 128,
    readonly: true,
    source: 'ruvnet-tools'
  });
});

/**
 * Export all utilities for embedding in production deployments
 * Returns complete dataset that can be bundled with business deploys
 */
app.get('/api/export', (req, res) => {
  res.json({
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    vectorCount: utilitiesData.length,
    dimensions: 128,
    data: utilitiesData.map(item => ({
      id: item.id,
      content: item.content,
      embedding: item.embedding,
      metadata: {
        name: item.metadata?.name,
        source: item.metadata?.source,
        type: item.metadata?.type
      }
    }))
  });
});

/**
 * Get specific utility by ID
 */
app.get('/api/utilities/:id', (req, res) => {
  const idx = utilitiesIndex.get(req.params.id);
  if (idx === undefined) {
    return res.status(404).json({ error: 'Utility not found' });
  }

  const item = utilitiesData[idx];
  res.json({
    id: item.id,
    content: item.content,
    metadata: item.metadata
  });
});

// ============================================
// START SERVER
// ============================================

loadUtilities()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[Utilities] API running on port ${config.port}`);
      console.log(`[Utilities] Serving ${utilitiesData.length} vectors (READ-ONLY)`);
    });
  })
  .catch(err => {
    console.error('[Utilities] Failed to initialize:', err);
    process.exit(1);
  });

module.exports = app;
