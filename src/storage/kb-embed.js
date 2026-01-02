/**
 * KB Embedding Helper v1.0.0
 *
 * Uses PostgreSQL's ruvector_embed() for ALL embeddings.
 * This ensures consistency - same model, same implementation.
 *
 * Why PostgreSQL instead of Node.js?
 * - Rust-based ruvector_embed() runs inside PostgreSQL container
 * - No WASM loading issues
 * - Guaranteed consistent embeddings
 * - 384-dimensional all-MiniLM-L6-v2 vectors
 */

const { Pool } = require('pg');

const DEFAULT_CONFIG = {
  host: process.env.RUVECTOR_HOST || 'localhost',
  port: parseInt(process.env.RUVECTOR_PORT || '5435'),
  database: 'postgres',
  user: 'postgres',
  password: process.env.RUVECTOR_PASSWORD || 'guruKB2025'
};

let pool = null;

function getPool(config = {}) {
  if (!pool) {
    pool = new Pool({ ...DEFAULT_CONFIG, ...config });
  }
  return pool;
}

/**
 * Generate embedding using PostgreSQL's ruvector_embed()
 * @param {string} text - Text to embed
 * @param {object} config - Optional DB config override
 * @returns {Promise<number[]>} 384-dimensional embedding
 */
async function embed(text, config = {}) {
  const db = getPool(config);
  const result = await db.query(
    'SELECT ruvector_embed($1) as embedding',
    [text.slice(0, 1500)]
  );
  return result.rows[0].embedding;
}

/**
 * Batch embed multiple texts
 * @param {string[]} texts - Array of texts
 * @param {object} config - Optional DB config override
 * @returns {Promise<number[][]>} Array of embeddings
 */
async function embedBatch(texts, config = {}) {
  const db = getPool(config);
  const client = await db.connect();
  const embeddings = [];

  try {
    for (const text of texts) {
      const result = await client.query(
        'SELECT ruvector_embed($1) as embedding',
        [text.slice(0, 1500)]
      );
      embeddings.push(result.rows[0].embedding);
    }
  } finally {
    client.release();
  }

  return embeddings;
}

/**
 * Insert document with automatic embedding
 * @param {string} schema - Schema name
 * @param {object} doc - Document {title, content, source, ...}
 * @param {object} config - Optional DB config override
 */
async function insertWithEmbedding(schema, doc, config = {}) {
  const db = getPool(config);
  const text = `${doc.title} ${doc.content}`.slice(0, 1500);

  await db.query(`
    INSERT INTO ${schema}.architecture_docs (title, content, source, embedding)
    VALUES ($1, $2, $3, ruvector_embed($4))
  `, [doc.title, doc.content, doc.source || 'ingestion', text]);
}

/**
 * Close the connection pool
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  embed,
  embedBatch,
  insertWithEmbedding,
  close,
  getPool
};
