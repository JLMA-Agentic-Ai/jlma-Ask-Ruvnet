/**
 * PostgresKnowledgeBase - Connects AskRuvNet to the RuVector PostgreSQL KB
 *
 * Provides intent-aware semantic search over 54K+ enriched knowledge entries
 * using the knowledge_search() stored procedure with:
 * - 40% semantic distance scoring
 * - 20% intent-type match (how-to, what-is, why, example, troubleshoot)
 * - 15% source authority weighting
 * - 15% quality score (gold/silver/bronze tiers)
 * - 10% usefulness feedback
 * - Knowledge graph relationship context
 */

const { Pool } = require('pg');

// ONNX embeddings - same model as MCP server for consistency
let embedPipeline = null;
let embedPipelinePromise = null;

async function getEmbedPipeline() {
  if (embedPipeline) return embedPipeline;
  if (embedPipelinePromise) return embedPipelinePromise;

  embedPipelinePromise = (async () => {
    try {
      const { pipeline } = await import('@xenova/transformers');
      embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('[PostgresKB] ✅ ONNX pipeline loaded (Xenova/all-MiniLM-L6-v2, 384d)');
      return embedPipeline;
    } catch (err) {
      console.warn('[PostgresKB] ⚠️ ONNX pipeline unavailable:', err.message);
      embedPipelinePromise = null;
      return null;
    }
  })();

  return embedPipelinePromise;
}

async function generateEmbedding(text) {
  const pipe = await getEmbedPipeline();
  if (!pipe) return null;
  const output = await pipe(String(text).slice(0, 512), { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Intent detection - maps query patterns to knowledge_search intent parameter
function detectIntent(query) {
  const q = query.toLowerCase().trim();
  if (/^how\s+(do|to|can|does|did|would|should)\b/.test(q) ||
      /\b(step[s]?|install|setup|configure|implement|deploy|create|build)\b/.test(q)) return 'how-to';
  if (/^what\s+is\b/.test(q) || /^what\s+are\b/.test(q) ||
      /\b(define|definition|explain what|describe|overview of)\b/.test(q)) return 'what-is';
  if (/^why\s/.test(q) || /\b(reason|because|rationale|motivation)\b/.test(q)) return 'why';
  if (/\b(example[s]?|show me|demonstrate|sample|use case)\b/.test(q)) return 'example';
  if (/\b(error|bug|fix|broken|fail|issue|problem|troubleshoot|debug|not working)\b/.test(q)) return 'troubleshoot';
  return 'general';
}

class PostgresKnowledgeBase {
  constructor() {
    this.pool = null;
    this.ready = false;
    this._stats = null;

    // Connection: Railway DATABASE_URL takes priority over local
    this.connectionConfig = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          max: 5,
          idleTimeoutMillis: 30000,
        }
      : {
          host: process.env.PG_HOST || 'localhost',
          port: parseInt(process.env.PG_PORT || '5435'),
          user: process.env.PG_USER || 'postgres',
          database: process.env.PG_DATABASE || 'postgres',
          max: 5,
          idleTimeoutMillis: 30000,
        };
  }

  async initialize() {
    try {
      this.pool = new Pool(this.connectionConfig);

      // Test connection and get entry count
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          "SELECT COUNT(*) as cnt FROM ask_ruvnet.architecture_docs WHERE is_duplicate = false"
        );
        const count = parseInt(result.rows[0].cnt);
        console.log(`[PostgresKB] ✅ Connected — ${count.toLocaleString()} searchable entries in ask_ruvnet`);
      } finally {
        client.release();
      }

      // Pre-warm embedding pipeline in background
      getEmbedPipeline().catch(() => {});

      this.ready = true;
      return true;
    } catch (err) {
      console.warn('[PostgresKB] ⚠️ PostgreSQL unavailable, will use local fallback:', err.message);
      this.ready = false;
      if (this.pool) { this.pool.end().catch(() => {}); this.pool = null; }
      return false;
    }
  }

  async search(query, options = {}) {
    if (!this.ready) return [];

    const {
      limit = 10,
      minQuality = 40,
      intent: overrideIntent = null,
    } = options;

    const intent = overrideIntent || detectIntent(query);

    try {
      const embedding = await generateEmbedding(query);
      if (!embedding || embedding.length === 0) {
        console.warn('[PostgresKB] No embedding generated');
        return [];
      }

      // Format as PostgreSQL ruvector literal
      const vectorLiteral = `[${embedding.join(',')}]`;

      const client = await this.pool.connect();
      try {
        const result = await client.query(
          `SELECT id, title, summary, content, category,
                  knowledge_type, concepts, expertise_level,
                  distance, quality, source_authority,
                  relevance_score, relationship_context
           FROM ask_ruvnet.knowledge_search(
             $1::ruvector,
             $2::text,
             $3::text,
             NULL::text[],
             NULL::text,
             $4::integer,
             'expert'::text,
             $5::integer,
             true
           )`,
          [vectorLiteral, query, intent, minQuality, limit]
        );

        return result.rows.map(r => ({
          id: String(r.id),
          title: r.title || 'Untitled',
          content: r.content || '',
          summary: r.summary || '',
          score: parseFloat(r.relevance_score) || 0,
          similarity: Math.max(0, 1 - parseFloat(r.distance || 1)),
          source: `postgresql:ask_ruvnet/${r.category || 'general'}`,
          metadata: {
            docId: String(r.id),
            title: r.title,
            category: r.category,
            knowledge_type: r.knowledge_type,
            concepts: r.concepts || [],
            expertise_level: r.expertise_level,
            quality: r.quality,
            source_authority: r.source_authority,
            source: `ask_ruvnet:${r.category}`,
            intent,
            relationship_context: r.relationship_context,
            timestamp: new Date().toISOString(),
          }
        }));
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[PostgresKB] Search error:', err.message);
      return [];
    }
  }

  async getKBStats() {
    if (!this.ready) return null;
    if (this._stats) return this._stats; // Cache stats

    const client = await this.pool.connect();
    try {
      // Query each domain individually so missing schemas don't break everything
      const domainQueries = [
        { key: 'ask_ruvnet', sql: "SELECT COUNT(*) FILTER (WHERE is_duplicate=false) as total, COUNT(*) FILTER (WHERE is_duplicate=false AND triage_tier='gold') as gold FROM ask_ruvnet.architecture_docs" },
        { key: 'travel_agent', sql: "SELECT COUNT(*) FILTER (WHERE is_duplicate=false) as total FROM travel_agent.knowledge" },
        { key: 'viral_social', sql: "SELECT COUNT(*) FILTER (WHERE is_duplicate=false) as total FROM viral_social.knowledge" },
        { key: 'retirewell', sql: "SELECT COUNT(*) FILTER (WHERE is_duplicate=false) as total FROM retirewell.guru_knowledge" },
      ];

      const domains = {};
      let total = 0;

      for (const { key, sql } of domainQueries) {
        try {
          const result = await client.query(sql);
          const row = result.rows[0];
          const domainTotal = parseInt(row.total) || 0;
          domains[key] = { total: domainTotal };
          if (row.gold !== undefined) domains[key].gold = parseInt(row.gold) || 0;
          total += domainTotal;
        } catch (err) {
          console.warn(`[PostgresKB] Schema ${key} unavailable: ${err.message}`);
          domains[key] = { total: 0, error: 'schema unavailable' };
        }
      }

      this._stats = {
        backend: 'PostgreSQL RuVector',
        domains,
        total,
        lastUpdated: new Date().toISOString(),
      };

      // Expire cache after 5 minutes
      setTimeout(() => { this._stats = null; }, 5 * 60 * 1000);

      return this._stats;
    } finally {
      client.release();
    }
  }

  /**
   * Reflexion-compatible interface — drop-in replacement for RuvectorStore.reflexion
   * This is what app.js uses via reasoningBank.reflexion.retrieveRelevant()
   */
  get reflexion() {
    const self = this;
    return {
      async retrieveRelevant({ task, k = 10 }) {
        const results = await self.search(task, { limit: k });
        // Return in ReasoningBank-compatible format
        return results.map(r => ({
          id: r.id,
          input: r.content || '',
          task: r.title || '',
          similarity: r.score || 0,
          metadata: {
            ...r.metadata,
            content: r.content,
          }
        }));
      }
    };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this.ready = false;
  }
}

module.exports = PostgresKnowledgeBase;
