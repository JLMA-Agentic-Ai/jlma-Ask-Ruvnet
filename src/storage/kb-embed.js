/**
 * KB Embedding Helper v2.0.0
 *
 * Primary: ONNX via @claude-flow/embeddings (~930 embeds/sec) [Ruflo ecosystem]
 * Fallback: PostgreSQL ruvector_embed() (~17 embeds/sec)
 *
 * The ONNX service is lazy-loaded on first use. If it fails to
 * initialize (missing package, unsupported platform, etc.), all
 * calls transparently fall back to PostgreSQL ruvector_embed().
 *
 * Both paths produce 384-dimensional all-MiniLM-L6-v2 vectors.
 */

const { Pool } = require('pg');

const DEFAULT_CONFIG = {
  host: process.env.RUVECTOR_HOST || 'localhost',
  port: parseInt(process.env.RUVECTOR_PORT || '5435'),
  database: 'postgres',
  user: 'postgres',
  password: process.env.RUVECTOR_PASSWORD || ''
};

const ONNX_BATCH_SIZE = 100; // texts per ONNX inference call
const MAX_TEXT_LEN = 2000;   // max chars sent to embedding model

let pool = null;

// ONNX service state: lazy-loaded, singleton
let onnxService = null;
let onnxInitPromise = null;
let onnxAvailable = null; // null = untested, true/false after first attempt

function getPool(config = {}) {
  if (!pool) {
    pool = new Pool({ ...DEFAULT_CONFIG, ...config });
  }
  return pool;
}

/**
 * Lazy-load the ONNX embedding service.
 * Returns the service instance or null if unavailable.
 * Only attempts initialization once; caches the result.
 */
async function getOnnxService() {
  if (onnxAvailable === false) return null;
  if (onnxService) return onnxService;

  if (!onnxInitPromise) {
    onnxInitPromise = (async () => {
      try {
        const embeddingsPath = process.env.RUFLO_EMBEDDINGS_PATH || process.env.CLAUDE_FLOW_EMBEDDINGS_PATH ||
          require('path').join(require('os').homedir(), '.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js');
        const mod = await import(embeddingsPath);

        const createFn = mod.createEmbeddingServiceAsync || mod.default?.createEmbeddingServiceAsync;
        if (!createFn) {
          throw new Error('createEmbeddingServiceAsync not found in @claude-flow/embeddings');
        }

        const svc = await createFn({
          provider: 'transformers',
          model: 'Xenova/all-MiniLM-L6-v2',
          dimensions: 384
        });

        // Warm up the model with a single inference
        await svc.embed('warmup');

        onnxService = svc;
        onnxAvailable = true;
        console.log('[kb-embed] ONNX embedding service loaded (~55x faster)');
        return svc;
      } catch (err) {
        onnxAvailable = false;
        console.warn('[kb-embed] ONNX unavailable, using PostgreSQL fallback:', err.message);
        return null;
      }
    })();
  }

  return onnxInitPromise;
}

// ---------------------------------------------------------------------------
// PostgreSQL fallback helpers
// ---------------------------------------------------------------------------

async function embedViaPg(text, config = {}) {
  const db = getPool(config);
  const result = await db.query(
    'SELECT ruvector_embed($1) as embedding',
    [text.slice(0, MAX_TEXT_LEN)]
  );
  return result.rows[0].embedding;
}

async function embedBatchViaPg(texts, config = {}) {
  const db = getPool(config);
  const client = await db.connect();
  const embeddings = [];
  try {
    for (const text of texts) {
      const result = await client.query(
        'SELECT ruvector_embed($1) as embedding',
        [text.slice(0, MAX_TEXT_LEN)]
      );
      embeddings.push(result.rows[0].embedding);
    }
  } finally {
    client.release();
  }
  return embeddings;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate embedding for a single text.
 * Uses ONNX when available, falls back to PostgreSQL ruvector_embed().
 *
 * @param {string} text - Text to embed
 * @param {object} config - Optional DB config override (used only for PG fallback)
 * @returns {Promise<number[]>} 384-dimensional embedding
 */
async function embed(text, config = {}) {
  const svc = await getOnnxService();
  if (svc) {
    const truncated = text.slice(0, MAX_TEXT_LEN);
    const result = await svc.embed(truncated);
    // result may be Float32Array or {embedding: Float32Array}
    const vec = result.embedding || result;
    return Array.from(vec);
  }
  return embedViaPg(text, config);
}

/**
 * Batch embed multiple texts.
 * Uses ONNX true batch inference when available (~55x faster),
 * falls back to sequential PostgreSQL ruvector_embed() calls.
 *
 * @param {string[]} texts - Array of texts
 * @param {object} config - Optional DB config override (used only for PG fallback)
 * @returns {Promise<number[][]>} Array of 384-dimensional embeddings
 */
async function embedBatch(texts, config = {}) {
  const svc = await getOnnxService();
  if (svc) {
    return embedBatchOnnx(texts);
  }
  return embedBatchViaPg(texts, config);
}

/**
 * ONNX-only batch embedding with sub-batching for memory efficiency.
 * Processes texts in chunks of ONNX_BATCH_SIZE (default 100).
 *
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of 384-dimensional embeddings
 * @throws {Error} If ONNX service is not available
 */
async function embedBatchOnnx(texts) {
  const svc = await getOnnxService();
  if (!svc) {
    throw new Error('ONNX embedding service is not available. Install @claude-flow/embeddings or use embedBatch() for automatic fallback.');
  }

  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += ONNX_BATCH_SIZE) {
    const batch = texts.slice(i, i + ONNX_BATCH_SIZE).map(t => t.slice(0, MAX_TEXT_LEN));
    const result = await svc.embedBatch(batch);

    // embedBatch returns { embeddings: Array<{embedding: Float32Array}>, ... }
    for (const item of result.embeddings) {
      const vec = item.embedding || item;
      allEmbeddings.push(Array.from(vec));
    }
  }

  return allEmbeddings;
}

/**
 * Insert document with automatic embedding.
 * Uses ONNX for the embedding when available, then inserts via SQL
 * with a pre-computed vector. Falls back to ruvector_embed() in SQL.
 *
 * @param {string} schema - Schema name
 * @param {object} doc - Document {title, content, source, ...}
 * @param {object} config - Optional DB config override
 */
async function insertWithEmbedding(schema, doc, config = {}) {
  const db = getPool(config);
  const text = `${doc.title} ${doc.content}`.slice(0, MAX_TEXT_LEN);

  const svc = await getOnnxService();
  if (svc) {
    const embedding = await embed(text);
    const vecStr = '[' + embedding.join(',') + ']';
    await db.query(`
      INSERT INTO ${schema}.architecture_docs (title, content, source, embedding)
      VALUES ($1, $2, $3, $4::ruvector(384))
    `, [doc.title, doc.content, doc.source || 'ingestion', vecStr]);
  } else {
    await db.query(`
      INSERT INTO ${schema}.architecture_docs (title, content, source, embedding)
      VALUES ($1, $2, $3, ruvector_embed($4))
    `, [doc.title, doc.content, doc.source || 'ingestion', text]);
  }
}

/**
 * Close the connection pool and release ONNX resources
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  // Reset ONNX state so it can be re-initialized if needed
  onnxService = null;
  onnxInitPromise = null;
  onnxAvailable = null;
}

module.exports = {
  embed,
  embedBatch,
  embedBatchOnnx,
  insertWithEmbedding,
  close,
  getPool
};
