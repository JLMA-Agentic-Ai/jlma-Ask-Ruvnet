/**
 * KB-First v3.0 - Attention Router Template
 * 
 * Intelligent routing and comparison using attention mechanisms.
 * Use this for applications that need to route queries to experts
 * or compare multiple options.
 */

import { Pool } from 'pg';

// =============================================================================
// TYPES
// =============================================================================

export interface Expert {
  id: string;
  name: string;
  description: string;
  embedding: number[];
  handler: (query: string, context?: any) => Promise<any>;
  domains: string[];
  confidence?: number;
}

export interface RouteResult {
  expert: Expert;
  score: number;
  reasoning: string;
}

export interface CompareResult {
  winner: string;
  scores: Record<string, number>;
  breakdown: Record<string, Record<string, number>>;
  confidence: number;
}

export type AttentionMechanism = 
  | 'moe'           // Mixture of Experts routing
  | 'cross'         // Cross-attention for comparison
  | 'flash'         // Fast processing of large content
  | 'linear'        // O(n) for long sequences
  | 'multi_head'    // General purpose
  | 'graph'         // Graph-aware attention
  | 'hyperbolic';   // Hierarchical attention

export interface AttentionConfig {
  mechanism: AttentionMechanism;
  heads?: number;
  blockSize?: number;  // For flash attention
  curvature?: number;  // For hyperbolic
  topK?: number;       // For MoE routing
  temperature?: number;
}

// =============================================================================
// ATTENTION ROUTER
// =============================================================================

export class AttentionRouter {
  private pool: Pool;
  private experts: Map<string, Expert>;
  private defaultConfig: AttentionConfig;

  constructor(config?: { databaseUrl?: string; defaultMechanism?: AttentionMechanism }) {
    if (config?.databaseUrl) {
      this.pool = new Pool({ connectionString: config.databaseUrl });
    }
    this.experts = new Map();
    this.defaultConfig = {
      mechanism: config?.defaultMechanism || 'multi_head',
      heads: 8
    };
  }

  // ---------------------------------------------------------------------------
  // EXPERT MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Register an expert domain
   */
  registerExpert(expert: Expert): void {
    this.experts.set(expert.id, expert);
  }

  /**
   * Register multiple experts
   */
  registerExperts(experts: Expert[]): void {
    for (const expert of experts) {
      this.registerExpert(expert);
    }
  }

  /**
   * Get all registered experts
   */
  getExperts(): Expert[] {
    return Array.from(this.experts.values());
  }

  // ---------------------------------------------------------------------------
  // ROUTING (MoE)
  // ---------------------------------------------------------------------------

  /**
   * Route a query to the most appropriate expert(s)
   */
  async route(
    query: string,
    queryEmbedding: number[],
    options: { topK?: number; threshold?: number } = {}
  ): Promise<RouteResult[]> {
    const { topK = 1, threshold = 0.3 } = options;

    if (this.experts.size === 0) {
      throw new Error('No experts registered');
    }

    // Calculate similarity to each expert
    const scores: { expert: Expert; score: number }[] = [];

    for (const expert of this.experts.values()) {
      const score = this.cosineSimilarity(queryEmbedding, expert.embedding);
      if (score >= threshold) {
        scores.push({ expert, score });
      }
    }

    // Sort by score and take top K
    scores.sort((a, b) => b.score - a.score);
    const topExperts = scores.slice(0, topK);

    return topExperts.map(({ expert, score }) => ({
      expert,
      score,
      reasoning: `Query matches ${expert.name} domain with ${(score * 100).toFixed(1)}% confidence`
    }));
  }

  /**
   * Route using SQL (if database available)
   */
  async routeSQL(
    queryEmbedding: number[],
    options: { topK?: number; namespace?: string } = {}
  ): Promise<RouteResult[]> {
    const { topK = 1, namespace } = options;
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          id, name, description, domains,
          1 - (embedding <=> $1) as score
        FROM attention_experts
        WHERE ($2::text IS NULL OR namespace = $2)
        ORDER BY embedding <=> $1
        LIMIT $3
      `, [JSON.stringify(queryEmbedding), namespace, topK]);

      return result.rows.map(row => ({
        expert: {
          id: row.id,
          name: row.name,
          description: row.description,
          embedding: [],  // Not returned for efficiency
          handler: this.experts.get(row.id)?.handler || (async () => null),
          domains: row.domains
        },
        score: row.score,
        reasoning: `Routed to ${row.name} with ${(row.score * 100).toFixed(1)}% match`
      }));
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // COMPARISON (Cross-Attention)
  // ---------------------------------------------------------------------------

  /**
   * Compare two items using cross-attention
   */
  async compare(
    itemA: { id: string; embedding: number[]; attributes: Record<string, any> },
    itemB: { id: string; embedding: number[]; attributes: Record<string, any> },
    criteria: string[]
  ): Promise<CompareResult> {
    const breakdown: Record<string, Record<string, number>> = {};
    const scores: Record<string, number> = { [itemA.id]: 0, [itemB.id]: 0 };

    for (const criterion of criteria) {
      const valueA = itemA.attributes[criterion];
      const valueB = itemB.attributes[criterion];

      // Score based on criterion type
      const criterionScores = this.scoreCriterion(criterion, valueA, valueB);
      
      breakdown[criterion] = {
        [itemA.id]: criterionScores.a,
        [itemB.id]: criterionScores.b
      };

      scores[itemA.id] += criterionScores.a;
      scores[itemB.id] += criterionScores.b;
    }

    // Normalize scores
    const totalCriteria = criteria.length;
    scores[itemA.id] /= totalCriteria;
    scores[itemB.id] /= totalCriteria;

    // Add embedding similarity bonus
    const embeddingSimilarity = this.cosineSimilarity(itemA.embedding, itemB.embedding);

    return {
      winner: scores[itemA.id] >= scores[itemB.id] ? itemA.id : itemB.id,
      scores,
      breakdown,
      confidence: Math.abs(scores[itemA.id] - scores[itemB.id]) + 0.5
    };
  }

  /**
   * Compare multiple items and rank them
   */
  async rankOptions(
    items: { id: string; embedding: number[]; attributes: Record<string, any> }[],
    criteria: string[],
    weights?: Record<string, number>
  ): Promise<{ id: string; score: number; rank: number }[]> {
    const defaultWeight = 1 / criteria.length;
    const criteriaWeights = weights || 
      Object.fromEntries(criteria.map(c => [c, defaultWeight]));

    const scores = items.map(item => {
      let totalScore = 0;

      for (const criterion of criteria) {
        const value = item.attributes[criterion];
        const normalizedValue = this.normalizeValue(criterion, value, items);
        totalScore += normalizedValue * (criteriaWeights[criterion] || defaultWeight);
      }

      return { id: item.id, score: totalScore };
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Add rank
    return scores.map((s, index) => ({ ...s, rank: index + 1 }));
  }

  // ---------------------------------------------------------------------------
  // ATTENTION MECHANISMS (SQL)
  // ---------------------------------------------------------------------------

  /**
   * Apply multi-head attention via SQL
   */
  async multiHeadAttention(
    query: number[][],
    key: number[][],
    value: number[][],
    heads: number = 8
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_attention_multi_head($1, $2, $3, $4) as attended
      `, [query, key, value, heads]);
      return result.rows[0].attended;
    } finally {
      client.release();
    }
  }

  /**
   * Apply flash attention for efficiency
   */
  async flashAttention(
    query: number[][],
    key: number[][],
    value: number[][],
    blockSize: number = 256
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_attention_flash($1, $2, $3, $4) as attended
      `, [query, key, value, blockSize]);
      return result.rows[0].attended;
    } finally {
      client.release();
    }
  }

  /**
   * Apply linear attention for long sequences
   */
  async linearAttention(
    query: number[][],
    key: number[][],
    value: number[][]
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_attention_linear($1, $2, $3) as attended
      `, [query, key, value]);
      return result.rows[0].attended;
    } finally {
      client.release();
    }
  }

  /**
   * Apply hyperbolic attention for hierarchies
   */
  async hyperbolicAttention(
    query: number[][],
    key: number[][],
    value: number[][],
    curvature: number = -1.0
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_attention_hyperbolic($1, $2, $3, $4) as attended
      `, [query, key, value, curvature]);
      return result.rows[0].attended;
    } finally {
      client.release();
    }
  }

  /**
   * Apply graph attention
   */
  async graphAttention(
    nodeFeatures: number[][],
    adjacencyMatrix: number[][],
    heads: number = 4
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_attention_graph($1, $2, $3) as attended
      `, [nodeFeatures, adjacencyMatrix, heads]);
      return result.rows[0].attended;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // MECHANISM SELECTION
  // ---------------------------------------------------------------------------

  /**
   * Select the appropriate attention mechanism for a task
   */
  selectMechanism(task: {
    type: 'route' | 'compare' | 'analyze' | 'navigate';
    tokenCount?: number;
    optionCount?: number;
    isHierarchical?: boolean;
    isGraph?: boolean;
  }): AttentionConfig {
    // Routing tasks use MoE
    if (task.type === 'route') {
      return { mechanism: 'moe', topK: 2, temperature: 0.7 };
    }

    // Comparison tasks use cross-attention
    if (task.type === 'compare') {
      if (task.optionCount && task.optionCount > 10) {
        return { mechanism: 'cross', heads: 4 };  // Fewer heads for many options
      }
      return { mechanism: 'cross', heads: 8 };
    }

    // Analysis tasks
    if (task.type === 'analyze') {
      // Long sequences need linear or flash
      if (task.tokenCount && task.tokenCount > 8000) {
        return { mechanism: 'linear' };
      }
      if (task.tokenCount && task.tokenCount > 4000) {
        return { mechanism: 'flash', blockSize: 256 };
      }
      return { mechanism: 'multi_head', heads: 8 };
    }

    // Navigation tasks
    if (task.type === 'navigate') {
      if (task.isHierarchical) {
        return { mechanism: 'hyperbolic', curvature: -1.0 };
      }
      if (task.isGraph) {
        return { mechanism: 'graph', heads: 4 };
      }
    }

    // Default
    return { mechanism: 'multi_head', heads: 8 };
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private scoreCriterion(
    criterion: string,
    valueA: any,
    valueB: any
  ): { a: number; b: number } {
    // Numeric comparison (lower is better for cost, higher for value)
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      const lowerIsBetter = criterion.includes('cost') || 
                            criterion.includes('price') || 
                            criterion.includes('time') ||
                            criterion.includes('risk');
      
      if (lowerIsBetter) {
        const total = valueA + valueB;
        return {
          a: total === 0 ? 0.5 : valueB / total,
          b: total === 0 ? 0.5 : valueA / total
        };
      } else {
        const total = valueA + valueB;
        return {
          a: total === 0 ? 0.5 : valueA / total,
          b: total === 0 ? 0.5 : valueB / total
        };
      }
    }

    // Boolean comparison
    if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
      return {
        a: valueA ? 1 : 0,
        b: valueB ? 1 : 0
      };
    }

    // Default: equal
    return { a: 0.5, b: 0.5 };
  }

  private normalizeValue(
    criterion: string,
    value: any,
    allItems: { attributes: Record<string, any> }[]
  ): number {
    if (typeof value !== 'number') return 0.5;

    const allValues = allItems
      .map(i => i.attributes[criterion])
      .filter(v => typeof v === 'number') as number[];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    if (max === min) return 0.5;

    const lowerIsBetter = criterion.includes('cost') || 
                          criterion.includes('price') || 
                          criterion.includes('time') ||
                          criterion.includes('risk');

    const normalized = (value - min) / (max - min);
    return lowerIsBetter ? 1 - normalized : normalized;
  }
}

// =============================================================================
// SCHEMA FOR ATTENTION TABLES
// =============================================================================

export const ATTENTION_SCHEMA = `
-- Attention Experts
CREATE TABLE IF NOT EXISTS attention_experts (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  domains TEXT[] DEFAULT '{}',
  embedding vector(384),
  handler_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routing History (for learning)
CREATE TABLE IF NOT EXISTS attention_routing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_embedding vector(384),
  routed_expert TEXT REFERENCES attention_experts(id),
  score REAL,
  outcome_success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS attention_experts_namespace_idx ON attention_experts(namespace);
CREATE INDEX IF NOT EXISTS attention_experts_embedding_idx ON attention_experts 
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS attention_routing_expert_idx ON attention_routing_history(routed_expert);
`;

export default AttentionRouter;
