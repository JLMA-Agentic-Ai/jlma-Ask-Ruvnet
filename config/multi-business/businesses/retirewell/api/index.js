/**
 * RetireWell Business API
 * Updated: 2025-12-29 17:55:00 EST | Version 1.0.0
 *
 * INDEPENDENTLY DEPLOYABLE business knowledge base API.
 *
 * Features:
 * - Own PostgreSQL with pgvector for business knowledge
 * - Utilities access via API (development) or embedded snapshot (production)
 * - Zero coupling to other businesses
 * - Health checks for container orchestration
 *
 * Deployment modes:
 * - Development: UTILITIES_API_URL set -> queries utilities service
 * - Production: UTILITIES_API_URL empty -> uses embedded snapshot
 */

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Configuration
const config = {
  businessName: process.env.BUSINESS_NAME || 'retirewell',
  port: parseInt(process.env.PORT || '5101'),
  databaseUrl: process.env.DATABASE_URL,
  utilitiesApiUrl: process.env.UTILITIES_API_URL,
  dataPath: process.env.DATA_PATH || './data',
  utilitiesSnapshotPath: process.env.UTILITIES_SNAPSHOT_PATH || './utilities-snapshot'
};

// Database connection
let pool;
let utilitiesSnapshot = null;

/**
 * Initialize database and utilities
 */
async function initialize() {
  console.log(`[${config.businessName}] Initializing...`);

  // Connect to PostgreSQL
  pool = new Pool({
    connectionString: config.databaseUrl
  });

  // Test connection
  try {
    await pool.query('SELECT 1');
    console.log(`[${config.businessName}] PostgreSQL connected`);
  } catch (err) {
    console.error(`[${config.businessName}] PostgreSQL connection failed:`, err.message);
    throw err;
  }

  // Initialize pgvector extension
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

  // Create vectors table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_vectors (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      embedding vector(128),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Create HNSW index for fast similarity search
  await pool.query(`
    CREATE INDEX IF NOT EXISTS knowledge_vectors_embedding_idx
    ON knowledge_vectors
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
  `);

  // Load utilities (API or embedded)
  if (!config.utilitiesApiUrl) {
    console.log(`[${config.businessName}] Loading embedded utilities snapshot...`);
    try {
      const fs = require('fs');
      const snapshotPath = `${config.utilitiesSnapshotPath}/utilities.json`;
      if (fs.existsSync(snapshotPath)) {
        utilitiesSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        console.log(`[${config.businessName}] Utilities snapshot loaded: ${utilitiesSnapshot.vectorCount} vectors`);
      } else {
        console.log(`[${config.businessName}] No utilities snapshot found at ${snapshotPath}`);
      }
    } catch (err) {
      console.warn(`[${config.businessName}] Failed to load utilities snapshot:`, err.message);
    }
  } else {
    console.log(`[${config.businessName}] Utilities API: ${config.utilitiesApiUrl}`);
  }

  console.log(`[${config.businessName}] Initialization complete`);
}

/**
 * Generate embedding for text
 * Uses simple hash-based embedding as fallback
 * In production, integrate with OpenAI/Cohere/etc.
 */
function generateEmbedding(text, dimensions = 128) {
  const vector = new Float32Array(dimensions);
  const str = String(text).toLowerCase();

  // FNV-1a style hashing
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
    vector[i % dimensions] = (vector[i % dimensions] + (hash % 1000) / 1000) % 1;
  }

  // N-gram features
  for (let i = 0; i < str.length - 2; i++) {
    const ngram = str.slice(i, i + 3);
    let ngramHash = 0;
    for (let j = 0; j < ngram.length; j++) {
      ngramHash = ((ngramHash << 5) - ngramHash + ngram.charCodeAt(j)) >>> 0;
    }
    vector[ngramHash % dimensions] = (vector[ngramHash % dimensions] + 0.1) % 1;
  }

  // Normalize
  let mag = 0;
  for (let i = 0; i < dimensions; i++) mag += vector[i] * vector[i];
  mag = Math.sqrt(mag) || 1;
  for (let i = 0; i < dimensions; i++) vector[i] /= mag;

  return Array.from(vector);
}

/**
 * Search business knowledge base
 */
async function searchBusiness(query, k = 5) {
  const embedding = generateEmbedding(query);
  const embeddingStr = `[${embedding.join(',')}]`;

  const result = await pool.query(`
    SELECT
      id,
      content,
      metadata,
      1 - (embedding <=> $1::vector) as score
    FROM knowledge_vectors
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `, [embeddingStr, k]);

  return result.rows.map(row => ({
    id: row.id,
    content: row.content,
    score: parseFloat(row.score),
    metadata: row.metadata,
    source: 'business'
  }));
}

/**
 * Search utilities (API or embedded snapshot)
 */
async function searchUtilities(query, k = 5) {
  if (config.utilitiesApiUrl) {
    // Development: Query utilities API
    try {
      const response = await fetch(`${config.utilitiesApiUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, k })
      });

      if (!response.ok) {
        throw new Error(`Utilities API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (err) {
      console.warn(`[${config.businessName}] Utilities API error:`, err.message);
      return [];
    }
  } else if (utilitiesSnapshot && utilitiesSnapshot.data) {
    // Production: Search embedded snapshot
    const queryEmbedding = generateEmbedding(query);

    // Compute cosine similarity with all vectors
    const scored = utilitiesSnapshot.data.map(item => {
      let dot = 0, magA = 0, magB = 0;
      for (let i = 0; i < queryEmbedding.length; i++) {
        dot += queryEmbedding[i] * (item.embedding[i] || 0);
        magA += queryEmbedding[i] * queryEmbedding[i];
        magB += (item.embedding[i] || 0) * (item.embedding[i] || 0);
      }
      const score = dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);

      return {
        id: item.id,
        content: item.content,
        score,
        metadata: item.metadata,
        source: 'utilities'
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  return [];
}

/**
 * Merge and rank results from multiple sources
 */
function mergeResults(businessResults, utilityResults, k) {
  const all = [...businessResults, ...utilityResults];

  // Sort by score descending
  all.sort((a, b) => b.score - a.score);

  // Deduplicate by content similarity (simple hash check)
  const seen = new Set();
  const deduped = all.filter(r => {
    const hash = r.content.slice(0, 100);
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });

  return deduped.slice(0, k);
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check
 */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      business: config.businessName,
      utilitiesMode: config.utilitiesApiUrl ? 'api' : 'embedded',
      utilitiesLoaded: !!utilitiesSnapshot || !!config.utilitiesApiUrl
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

/**
 * Search knowledge base
 */
app.post('/api/search', async (req, res) => {
  try {
    const { query, k = 5, includeUtilities = true } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Search both sources in parallel
    const businessK = includeUtilities ? Math.ceil(k * 0.7) : k;
    const utilityK = includeUtilities ? Math.ceil(k * 0.3) : 0;

    const [businessResults, utilityResults] = await Promise.all([
      searchBusiness(query, businessK),
      includeUtilities ? searchUtilities(query, utilityK) : Promise.resolve([])
    ]);

    const merged = mergeResults(businessResults, utilityResults, k);

    res.json({
      query,
      results: merged,
      sources: {
        business: businessResults.length,
        utilities: utilityResults.length
      },
      mode: config.utilitiesApiUrl ? 'development' : 'production'
    });
  } catch (err) {
    console.error(`[${config.businessName}] Search error:`, err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add document to knowledge base
 */
app.post('/api/documents', async (req, res) => {
  try {
    const { id, content, metadata = {} } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const docId = id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const embedding = generateEmbedding(content);
    const embeddingStr = `[${embedding.join(',')}]`;

    await pool.query(`
      INSERT INTO knowledge_vectors (id, content, embedding, metadata)
      VALUES ($1, $2, $3::vector, $4)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `, [docId, content, embeddingStr, JSON.stringify(metadata)]);

    res.json({
      success: true,
      id: docId
    });
  } catch (err) {
    console.error(`[${config.businessName}] Insert error:`, err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get document by ID
 */
app.get('/api/documents/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, content, metadata, created_at FROM knowledge_vectors WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete document
 */
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM knowledge_vectors WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true, deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) as count FROM knowledge_vectors');

    res.json({
      business: config.businessName,
      documentCount: parseInt(countResult.rows[0].count),
      utilitiesMode: config.utilitiesApiUrl ? 'api' : 'embedded',
      utilitiesVectorCount: utilitiesSnapshot?.vectorCount || 'via API'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================

initialize()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[${config.businessName}] API running on port ${config.port}`);
      console.log(`[${config.businessName}] Utilities: ${config.utilitiesApiUrl || 'embedded snapshot'}`);
    });
  })
  .catch(err => {
    console.error(`[${config.businessName}] Failed to initialize:`, err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log(`[${config.businessName}] Shutting down...`);
  await pool.end();
  process.exit(0);
});

module.exports = app;
