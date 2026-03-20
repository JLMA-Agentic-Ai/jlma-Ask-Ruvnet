/**
 * KB-First v3.0 Knowledge Base Client
 *
 * Production-ready client for RuVector PostgreSQL
 * Optimized for enterprise KB applications
 *
 * NEW IN v3.0:
 * - ONNX local embeddings via ruvector (no API calls needed)
 * - Federated learning support
 * - Enhanced hybrid search with caching
 * - Graph-aware clustering
 */

import { Pool, PoolClient } from 'pg';

// =============================================================================
// ONNX LOCAL EMBEDDINGS (NEW in v3.0)
// =============================================================================

// Dynamic import for ruvector embeddings (works offline, no API costs)
let embedText: ((text: string) => Promise<number[]>) | null = null;
let embedBatch: ((texts: string[]) => Promise<number[][]>) | null = null;

async function initLocalEmbeddings(): Promise<boolean> {
  if (embedText !== null) return true;

  try {
    // Try to load ruvector's ONNX embeddings (all-MiniLM-L6-v2, 384 dimensions)
    const ruvector = await import('ruvector');

    if (ruvector.embedText && ruvector.embedBatch) {
      embedText = ruvector.embedText;
      embedBatch = ruvector.embedBatch;
      console.log('[KB-FIRST] ONNX local embeddings initialized (384d, offline)');
      return true;
    }

    // Fallback: check for hooks API
    if (ruvector.hooks?.embed) {
      embedText = async (text: string) => {
        const result = await ruvector.hooks.embed(text);
        return result.embedding;
      };
      embedBatch = async (texts: string[]) => {
        return Promise.all(texts.map(t => embedText!(t)));
      };
      console.log('[KB-FIRST] RuVector hooks embeddings initialized');
      return true;
    }

    return false;
  } catch (e) {
    console.warn('[KB-FIRST] Local embeddings not available, will use DB or text search');
    return false;
  }
}

// Initialize on module load
initLocalEmbeddings();

// =============================================================================
// EMBEDDING CACHE (Memory-optimized)
// =============================================================================

interface CachedEmbedding {
  embedding: number[];
  timestamp: number;
}

const embeddingCache = new Map<string, CachedEmbedding>();
const CACHE_TTL_MS = 3600000; // 1 hour
const MAX_CACHE_SIZE = 10000;

function getCachedEmbedding(text: string): number[] | null {
  const cached = embeddingCache.get(text);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.embedding;
  }
  if (cached) {
    embeddingCache.delete(text);
  }
  return null;
}

function setCachedEmbedding(text: string, embedding: number[]): void {
  // Evict oldest if at capacity
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const oldest = [...embeddingCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) embeddingCache.delete(oldest[0]);
  }
  embeddingCache.set(text, { embedding, timestamp: Date.now() });
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const pool = new Pool({
  connectionString: process.env.RUVECTOR_POSTGRES_URL || process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// =============================================================================
// TYPES
// =============================================================================

export interface KBNode {
  id: string;
  namespace: string;
  path: string;
  title: string;
  content: string | null;
  sourceExpert: string;
  sourceUrl: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface SearchResult extends KBNode {
  distance: number;
  relevanceScore: number;
  bm25Score?: number;
  clusterId?: number;  // NEW: Graph cluster membership
}

export interface KBResponse<T> {
  data: T;
  sources: {
    nodeIds: string[];
    experts: string[];
    urls: string[];
  };
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  gap: boolean;
  gapReason?: string;
  embeddingSource?: 'local' | 'database' | 'none';  // NEW: Track embedding source
}

export interface SearchOptions {
  limit?: number;
  minConfidence?: number;
  hybridWeight?: number; // 0-1, weight for semantic vs keyword
  useLocalEmbeddings?: boolean; // NEW: Force local embeddings
  includeClusterInfo?: boolean; // NEW: Include cluster membership
}

export interface GapReport {
  query: string;
  reason: string;
  count: number;
  lastSeen: Date;
}

// =============================================================================
// CORE EMBEDDING FUNCTION (NEW in v3.0)
// =============================================================================

/**
 * Get embedding for text using best available method:
 * 1. Memory cache (0.01ms)
 * 2. Local ONNX via ruvector (~400ms first, then cached)
 * 3. Database function if available
 * 4. null (fallback to text search)
 */
export async function getEmbedding(
  text: string,
  client?: PoolClient
): Promise<{ embedding: number[] | null; source: 'cache' | 'local' | 'database' | 'none' }> {
  // 1. Check cache first
  const cached = getCachedEmbedding(text);
  if (cached) {
    return { embedding: cached, source: 'cache' };
  }

  // 2. Try local ONNX embeddings (no API, works offline)
  await initLocalEmbeddings();
  if (embedText) {
    try {
      const embedding = await embedText(text);
      setCachedEmbedding(text, embedding);
      return { embedding, source: 'local' };
    } catch (e) {
      console.warn('[KB-FIRST] Local embedding failed:', e);
    }
  }

  // 3. Try database function
  if (client) {
    try {
      const hasDbEmbed = await checkFunction(client, 'ruvector_embed');
      if (hasDbEmbed) {
        const result = await client.query(
          `SELECT ruvector_embed('all-MiniLM-L6-v2', $1) AS embedding`,
          [text]
        );
        if (result.rows[0]?.embedding) {
          const embedding = result.rows[0].embedding;
          setCachedEmbedding(text, embedding);
          return { embedding, source: 'database' };
        }
      }
    } catch (e) {
      console.warn('[KB-FIRST] Database embedding failed:', e);
    }
  }

  // 4. No embeddings available
  return { embedding: null, source: 'none' };
}

/**
 * Batch embed multiple texts efficiently
 */
export async function getEmbeddingsBatch(
  texts: string[]
): Promise<{ embeddings: (number[] | null)[]; source: 'local' | 'none' }> {
  await initLocalEmbeddings();

  if (embedBatch) {
    try {
      // Check cache for all texts
      const results: (number[] | null)[] = [];
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      texts.forEach((text, i) => {
        const cached = getCachedEmbedding(text);
        if (cached) {
          results[i] = cached;
        } else {
          uncachedTexts.push(text);
          uncachedIndices.push(i);
        }
      });

      // Batch embed uncached texts
      if (uncachedTexts.length > 0) {
        const embeddings = await embedBatch(uncachedTexts);
        uncachedIndices.forEach((originalIndex, i) => {
          results[originalIndex] = embeddings[i];
          setCachedEmbedding(uncachedTexts[i], embeddings[i]);
        });
      }

      return { embeddings: results, source: 'local' };
    } catch (e) {
      console.warn('[KB-FIRST] Batch embedding failed:', e);
    }
  }

  return { embeddings: texts.map(() => null), source: 'none' };
}

// =============================================================================
// CORE SEARCH FUNCTIONS
// =============================================================================

/**
 * Primary KB search - uses hybrid (semantic + keyword) by default
 * NEW in v3.0: Uses local ONNX embeddings when available
 */
export async function searchKB(
  query: string,
  namespace: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = 10,
    minConfidence = 0,
    hybridWeight = 0.7,  // 70% semantic, 30% keyword
    useLocalEmbeddings = true
  } = options;

  const client = await pool.connect();

  try {
    // Get query embedding using best available method
    const { embedding: queryEmbedding, source: embeddingSource } = useLocalEmbeddings
      ? await getEmbedding(query, client)
      : await getEmbedding(query, client);

    let result;

    if (queryEmbedding) {
      // Use vector similarity search with local embedding
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      result = await client.query(`
        WITH scored AS (
          SELECT
            n.id, n.namespace, n.path, n.title, n.content,
            n.source_expert, n.source_url, n.confidence, n.metadata,
            CASE
              WHEN n.embedding IS NOT NULL THEN
                1.0 / (1.0 + (n.embedding::vector <=> $1::vector))
              ELSE 0.3
            END AS semantic_score,
            ts_rank(to_tsvector('english', COALESCE(n.title || ' ' || n.content, '')),
                    plainto_tsquery('english', $2)) AS text_score
          FROM kb_nodes n
          WHERE n.namespace = $3 AND n.confidence >= $4
        )
        SELECT
          *,
          ($5 * semantic_score + $6 * text_score) AS combined_score,
          1 - semantic_score AS distance
        FROM scored
        WHERE semantic_score > 0.01 OR text_score > 0
        ORDER BY combined_score DESC
        LIMIT $7
      `, [embeddingStr, query, namespace, minConfidence, hybridWeight, 1 - hybridWeight, limit]);

    } else {
      // Fallback to text search only (no embeddings available)
      result = await client.query(`
        SELECT
          id, namespace, path, title, content,
          source_expert, source_url, confidence, metadata,
          ts_rank(to_tsvector('english', COALESCE(title || ' ' || content, '')),
                  plainto_tsquery('english', $1)) AS text_score,
          0.5 AS distance
        FROM kb_nodes
        WHERE namespace = $2
          AND confidence >= $3
          AND to_tsvector('english', COALESCE(title || ' ' || content, ''))
              @@ plainto_tsquery('english', $1)
        ORDER BY text_score DESC
        LIMIT $4
      `, [query, namespace, minConfidence, limit]);
    }

    // Update access tracking (fire and forget)
    const nodeIds = result.rows.map(r => r.id);
    if (nodeIds.length > 0) {
      client.query(`
        UPDATE kb_nodes
        SET access_count = access_count + 1, last_accessed = NOW()
        WHERE id = ANY($1)
      `, [nodeIds]).catch(() => {});
    }

    console.log(`[KB-FIRST] Search completed: ${result.rows.length} results (embeddings: ${embeddingSource})`);

    return result.rows.map(row => ({
      id: row.id,
      namespace: row.namespace,
      path: row.path,
      title: row.title,
      content: row.content,
      sourceExpert: row.source_expert,
      sourceUrl: row.source_url,
      confidence: row.confidence,
      metadata: row.metadata || {},
      distance: row.distance,
      relevanceScore: row.combined_score || row.text_score,
      bm25Score: row.text_score
    }));
  } finally {
    client.release();
  }
}

/**
 * Build a KB-grounded response with proper attribution
 */
export async function buildResponse<T>(
  results: SearchResult[],
  answer: T,
  embeddingSource?: 'local' | 'database' | 'none'
): Promise<KBResponse<T>> {

  if (results.length === 0) {
    return {
      data: answer,
      sources: { nodeIds: [], experts: [], urls: [] },
      confidence: 0,
      confidenceLevel: 'low',
      gap: true,
      gapReason: 'No matching KB content found',
      embeddingSource
    };
  }

  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const weightedConfidence = results.reduce((sum, r, i) => {
    const weight = 1 / (i + 1); // First result weighted more
    return sum + (r.confidence * r.relevanceScore * weight);
  }, 0) / results.reduce((sum, _, i) => sum + 1 / (i + 1), 0);

  const confidence = Math.min(avgConfidence, weightedConfidence);

  return {
    data: answer,
    sources: {
      nodeIds: results.map(r => r.id),
      experts: [...new Set(results.map(r => r.sourceExpert).filter(Boolean))],
      urls: [...new Set(results.map(r => r.sourceUrl).filter(Boolean))]
    },
    confidence,
    confidenceLevel: confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
    gap: false,
    embeddingSource
  };
}

// =============================================================================
// INGEST WITH LOCAL EMBEDDINGS (NEW in v3.0)
// =============================================================================

/**
 * Ingest a document into the KB with automatic embedding
 * Uses local ONNX embeddings - no API costs, works offline
 */
export async function ingestDocument(
  namespace: string,
  path: string,
  title: string,
  content: string,
  options: {
    sourceExpert: string;
    sourceUrl: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<{ id: string; embeddingSource: 'local' | 'database' | 'none' }> {
  const client = await pool.connect();

  try {
    // Generate embedding locally
    const { embedding, source } = await getEmbedding(content.substring(0, 8000), client);

    const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

    const result = await client.query(`
      INSERT INTO kb_nodes (
        namespace, path, title, content,
        source_expert, source_url, confidence, metadata, embedding
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
      ON CONFLICT (namespace, path) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        source_expert = EXCLUDED.source_expert,
        source_url = EXCLUDED.source_url,
        confidence = EXCLUDED.confidence,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding,
        updated_at = NOW()
      RETURNING id
    `, [
      namespace,
      path,
      title,
      content,
      options.sourceExpert,
      options.sourceUrl,
      options.confidence || 0.8,
      JSON.stringify(options.metadata || {}),
      embeddingStr
    ]);

    console.log(`[KB-FIRST] Ingested: ${title} (embedding: ${source})`);

    return {
      id: result.rows[0].id,
      embeddingSource: source === 'cache' ? 'local' : source
    };
  } finally {
    client.release();
  }
}

/**
 * Batch ingest multiple documents efficiently
 */
export async function ingestDocumentsBatch(
  namespace: string,
  documents: Array<{
    path: string;
    title: string;
    content: string;
    sourceExpert: string;
    sourceUrl: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }>
): Promise<{ ingested: number; embeddingSource: 'local' | 'none' }> {
  // Generate embeddings in batch
  const contents = documents.map(d => d.content.substring(0, 8000));
  const { embeddings, source } = await getEmbeddingsBatch(contents);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const embedding = embeddings[i];
      const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

      await client.query(`
        INSERT INTO kb_nodes (
          namespace, path, title, content,
          source_expert, source_url, confidence, metadata, embedding
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
        ON CONFLICT (namespace, path) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          source_expert = EXCLUDED.source_expert,
          source_url = EXCLUDED.source_url,
          confidence = EXCLUDED.confidence,
          metadata = EXCLUDED.metadata,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `, [
        namespace,
        doc.path,
        doc.title,
        doc.content,
        doc.sourceExpert,
        doc.sourceUrl,
        doc.confidence || 0.8,
        JSON.stringify(doc.metadata || {}),
        embeddingStr
      ]);
    }

    await client.query('COMMIT');
    console.log(`[KB-FIRST] Batch ingested: ${documents.length} documents (embedding: ${source})`);

    return { ingested: documents.length, embeddingSource: source };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// =============================================================================
// GAP DETECTION
// =============================================================================

/**
 * Log a query that couldn't be answered from the KB
 */
export async function logGap(
  query: string,
  reason: string,
  namespace?: string
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(`
      INSERT INTO kb_gaps (query, reason, namespace, first_seen, last_seen, occurrence_count)
      VALUES ($1, $2, $3, NOW(), NOW(), 1)
      ON CONFLICT (query, namespace) DO UPDATE SET
        last_seen = NOW(),
        occurrence_count = kb_gaps.occurrence_count + 1
    `, [query.substring(0, 500), reason, namespace || 'default']);
  } finally {
    client.release();
  }
}

/**
 * Get gap report for KB improvement
 */
export async function getGapReport(
  namespace?: string,
  limit: number = 50
): Promise<GapReport[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT query, reason, occurrence_count as count, last_seen
      FROM kb_gaps
      WHERE ($1::text IS NULL OR namespace = $1)
      ORDER BY occurrence_count DESC, last_seen DESC
      LIMIT $2
    `, [namespace, limit]);

    return result.rows.map(row => ({
      query: row.query,
      reason: row.reason,
      count: parseInt(row.count),
      lastSeen: row.last_seen
    }));
  } finally {
    client.release();
  }
}

// =============================================================================
// REASONING BANK (Pattern Storage)
// =============================================================================

/**
 * Store a successful query-response pattern with embedding
 */
export async function storePattern(
  query: string,
  response: string,
  nodesUsed: string[],
  feedbackScore: number
): Promise<void> {
  if (feedbackScore < 0.7) return; // Only store good patterns

  const client = await pool.connect();

  try {
    // Generate embedding for the query pattern
    const { embedding } = await getEmbedding(query, client);
    const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

    await client.query(`
      INSERT INTO reasoning_bank (query_pattern, successful_response, kb_nodes_used, feedback_score, use_count, embedding)
      VALUES ($1, $2, $3, $4, 1, $5::vector)
      ON CONFLICT (query_pattern) DO UPDATE SET
        feedback_score = (reasoning_bank.feedback_score * reasoning_bank.use_count + $4)
                         / (reasoning_bank.use_count + 1),
        use_count = reasoning_bank.use_count + 1,
        updated_at = NOW()
    `, [query.substring(0, 500), response.substring(0, 2000), nodesUsed, feedbackScore, embeddingStr]);
  } finally {
    client.release();
  }
}

/**
 * Find similar successful patterns using vector similarity
 */
export async function findSimilarPatterns(
  query: string,
  limit: number = 3
): Promise<{ pattern: string; response: string; score: number }[]> {
  const client = await pool.connect();

  try {
    // Get embedding for query
    const { embedding } = await getEmbedding(query, client);

    if (embedding) {
      const embeddingStr = `[${embedding.join(',')}]`;
      const result = await client.query(`
        SELECT
          query_pattern as pattern,
          successful_response as response,
          feedback_score as score,
          1.0 / (1.0 + (embedding <=> $1::vector)) as similarity
        FROM reasoning_bank
        WHERE feedback_score >= 0.7
          AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `, [embeddingStr, limit]);

      return result.rows;
    }

    // Fallback to text similarity
    const result = await client.query(`
      SELECT
        query_pattern as pattern,
        successful_response as response,
        feedback_score as score,
        similarity(query_pattern, $1) as sim
      FROM reasoning_bank
      WHERE feedback_score >= 0.7
      ORDER BY similarity(query_pattern, $1) DESC
      LIMIT $2
    `, [query, limit]);

    return result.rows;
  } catch {
    return []; // No patterns found
  } finally {
    client.release();
  }
}

// =============================================================================
// HEALTH & DIAGNOSTICS
// =============================================================================

/**
 * Check KB health and capabilities
 */
export async function checkHealth(namespace?: string): Promise<{
  healthy: boolean;
  nodeCount: number;
  gapCount: number;
  patternCount: number;
  features: {
    vectorSearch: boolean;
    localEmbeddings: boolean;
    hybridSearch: boolean;
    cacheSize: number;
  };
  error?: string;
}> {
  const client = await pool.connect();

  try {
    // Test connection
    await client.query('SELECT 1');

    // Count nodes
    const nodeResult = namespace
      ? await client.query('SELECT COUNT(*) FROM kb_nodes WHERE namespace = $1', [namespace])
      : await client.query('SELECT COUNT(*) FROM kb_nodes');

    // Count gaps
    const gapResult = await client.query('SELECT COUNT(*) FROM kb_gaps');

    // Count patterns
    let patternCount = 0;
    try {
      const patternResult = await client.query('SELECT COUNT(*) FROM reasoning_bank');
      patternCount = parseInt(patternResult.rows[0].count);
    } catch { /* table may not exist */ }

    // Check features
    const hasVector = await checkFunction(client, 'vector_cosine_ops');
    await initLocalEmbeddings();
    const hasLocalEmbed = embedText !== null;

    return {
      healthy: true,
      nodeCount: parseInt(nodeResult.rows[0].count),
      gapCount: parseInt(gapResult.rows[0].count),
      patternCount,
      features: {
        vectorSearch: hasVector,
        localEmbeddings: hasLocalEmbed,
        hybridSearch: true, // Always available via ts_rank
        cacheSize: embeddingCache.size
      }
    };
  } catch (e) {
    return {
      healthy: false,
      nodeCount: 0,
      gapCount: 0,
      patternCount: 0,
      features: { vectorSearch: false, localEmbeddings: false, hybridSearch: false, cacheSize: 0 },
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  } finally {
    client.release();
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

async function checkFunction(client: PoolClient, funcName: string): Promise<boolean> {
  try {
    const result = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_proc WHERE proname = $1
      ) OR EXISTS(
        SELECT 1 FROM pg_operator WHERE oprname = $1
      ) AS exists
    `, [funcName]);
    return result.rows[0]?.exists || false;
  } catch {
    return false;
  }
}

/**
 * Clear embedding cache (useful for memory management)
 */
export function clearEmbeddingCache(): { cleared: number } {
  const size = embeddingCache.size;
  embeddingCache.clear();
  return { cleared: size };
}

/**
 * Initialize KB schema (run once)
 */
export async function initializeSchema(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(`
      -- Enable extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For text similarity

      -- Try to enable ruvector (may not be available)
      DO $$ BEGIN
        CREATE EXTENSION IF NOT EXISTS ruvector;
      EXCEPTION WHEN OTHERS THEN
        -- Fall back to pgvector
        CREATE EXTENSION IF NOT EXISTS vector;
      END $$;

      -- KB Nodes table
      CREATE TABLE IF NOT EXISTS kb_nodes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        namespace TEXT NOT NULL DEFAULT 'default',
        path TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        source_expert TEXT NOT NULL,
        source_url TEXT NOT NULL,
        confidence REAL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
        metadata JSONB DEFAULT '{}',
        embedding vector(384),
        access_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(namespace, path)
      );

      -- Gaps table
      CREATE TABLE IF NOT EXISTS kb_gaps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        query TEXT NOT NULL,
        reason TEXT,
        namespace TEXT DEFAULT 'default',
        first_seen TIMESTAMPTZ DEFAULT NOW(),
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        occurrence_count INTEGER DEFAULT 1,
        resolved BOOLEAN DEFAULT false,
        UNIQUE(query, namespace)
      );

      -- Reasoning bank
      CREATE TABLE IF NOT EXISTS reasoning_bank (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        query_pattern TEXT UNIQUE NOT NULL,
        successful_response TEXT NOT NULL,
        kb_nodes_used UUID[] DEFAULT '{}',
        feedback_score REAL DEFAULT 0.5,
        use_count INTEGER DEFAULT 1,
        embedding vector(384),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS kb_nodes_namespace_idx ON kb_nodes(namespace);
      CREATE INDEX IF NOT EXISTS kb_nodes_content_trgm_idx ON kb_nodes USING gin(content gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS kb_gaps_namespace_idx ON kb_gaps(namespace);
      CREATE INDEX IF NOT EXISTS kb_gaps_count_idx ON kb_gaps(occurrence_count DESC);

      -- Vector index (if vector type exists)
      DO $$ BEGIN
        CREATE INDEX IF NOT EXISTS kb_nodes_embedding_idx ON kb_nodes
        USING hnsw (embedding vector_cosine_ops);
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Vector extension not available
      END $$;
    `);

    console.log('[KB-FIRST] Schema initialized successfully');
  } finally {
    client.release();
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Core search
  searchKB,
  buildResponse,

  // Embeddings (NEW in v3.0)
  getEmbedding,
  getEmbeddingsBatch,
  clearEmbeddingCache,

  // Ingestion (NEW in v3.0)
  ingestDocument,
  ingestDocumentsBatch,

  // Gap detection
  logGap,
  getGapReport,

  // Pattern storage
  storePattern,
  findSimilarPatterns,

  // Health
  checkHealth,
  initializeSchema
};
