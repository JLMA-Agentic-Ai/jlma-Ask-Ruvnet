/**
 * SONA Engine Configuration Template
 * Self-Optimizing Neural Architecture for KB-First Applications
 * 
 * Use this template for Scenario Learning and Continuous Optimization patterns.
 */

import { Pool } from 'pg';

// ============================================
// CONFIGURATION INTERFACES
// ============================================

export interface SonaConfig {
  // Core architecture
  hidden_dim: number;           // Hidden layer dimension (128, 256, 512)
  pattern_clusters: number;     // Number of pattern clusters (32, 64, 128)
  
  // Learning parameters
  ewc_lambda: number;           // Elastic Weight Consolidation (0.2-0.6)
  base_lora_rank: number;       // LoRA rank for base learning (4-16)
  micro_lora_rank: number;      // LoRA rank for instant learning (2-4)
  
  // Pattern storage
  pattern_quality_threshold: number;  // Min quality to store (0.6-0.8)
  max_patterns_per_cluster: number;   // Prevent unbounded growth
  
  // Trajectory tracking
  trajectory_timeout_seconds: number;       // Auto-end incomplete trajectories
  trajectory_consolidate_seconds: number;   // Background consolidation interval
  
  // Database
  connectionString: string;
}

// ============================================
// PRESET CONFIGURATIONS BY DOMAIN
// ============================================

export const PRESETS = {
  /**
   * STABLE DOMAINS (Finance, Law, Medicine)
   * - High anti-forgetting (ewc_lambda)
   * - Deep pattern learning (high lora_rank)
   * - High quality threshold
   */
  stable: {
    hidden_dim: 256,
    pattern_clusters: 64,
    ewc_lambda: 0.6,
    base_lora_rank: 16,
    micro_lora_rank: 4,
    pattern_quality_threshold: 0.8,
    max_patterns_per_cluster: 1000,
    trajectory_timeout_seconds: 86400,      // 24 hours
    trajectory_consolidate_seconds: 3600,   // 1 hour
  },
  
  /**
   * MODERATE DOMAINS (Business, Travel, Education)
   * - Balanced anti-forgetting
   * - Moderate pattern learning
   * - Moderate quality threshold
   */
  moderate: {
    hidden_dim: 256,
    pattern_clusters: 64,
    ewc_lambda: 0.4,
    base_lora_rank: 12,
    micro_lora_rank: 3,
    pattern_quality_threshold: 0.7,
    max_patterns_per_cluster: 500,
    trajectory_timeout_seconds: 43200,      // 12 hours
    trajectory_consolidate_seconds: 1800,   // 30 minutes
  },
  
  /**
   * FAST-CHANGING DOMAINS (SEO, Markets, Social Media)
   * - Low anti-forgetting (rapid adaptation)
   * - Fast pattern learning (low lora_rank)
   * - Lower quality threshold (learn from modest wins)
   */
  fastChanging: {
    hidden_dim: 128,
    pattern_clusters: 32,
    ewc_lambda: 0.2,
    base_lora_rank: 4,
    micro_lora_rank: 2,
    pattern_quality_threshold: 0.6,
    max_patterns_per_cluster: 200,
    trajectory_timeout_seconds: 7200,       // 2 hours
    trajectory_consolidate_seconds: 300,    // 5 minutes
  }
};

// ============================================
// SONA ENGINE CLASS
// ============================================

export class SonaEngine {
  private config: SonaConfig;
  private pool: Pool;
  
  constructor(config: Partial<SonaConfig> & { connectionString: string }) {
    this.config = {
      ...PRESETS.moderate,  // Default to moderate
      ...config
    };
    this.pool = new Pool({ connectionString: this.config.connectionString });
  }
  
  // ------------------------------------------
  // PATTERN STORAGE
  // ------------------------------------------
  
  /**
   * Store a successful pattern for future recall
   */
  async storePattern(pattern: {
    embedding: number[];
    pattern: Record<string, unknown>;
    quality: number;
    namespace?: string;
  }): Promise<string> {
    // Only store if meets quality threshold
    if (pattern.quality < this.config.pattern_quality_threshold) {
      return null;
    }
    
    const result = await this.pool.query(`
      INSERT INTO reasoning_bank (
        namespace, embedding, pattern_data, quality_score, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [
      pattern.namespace || 'default',
      JSON.stringify(pattern.embedding),
      JSON.stringify(pattern.pattern),
      pattern.quality
    ]);
    
    return result.rows[0].id;
  }
  
  /**
   * Recall patterns similar to a profile/query
   */
  async recallPatterns(
    embedding: number[],
    options: {
      namespace?: string;
      limit?: number;
      minQuality?: number;
    } = {}
  ): Promise<Array<{
    id: string;
    pattern: Record<string, unknown>;
    quality: number;
    similarity: number;
  }>> {
    const { namespace = 'default', limit = 10, minQuality = 0.5 } = options;
    
    const result = await this.pool.query(`
      SELECT id, pattern_data, quality_score,
             1.0 / (1.0 + (embedding::vector <=> $1::vector)) as similarity
      FROM reasoning_bank
      WHERE namespace = $2
        AND quality_score >= $3
      ORDER BY embedding::vector <=> $1::vector
      LIMIT $4
    `, [
      JSON.stringify(embedding),
      namespace,
      minQuality,
      limit
    ]);
    
    return result.rows.map(row => ({
      id: row.id,
      pattern: row.pattern_data,
      quality: row.quality_score,
      similarity: row.similarity
    }));
  }
  
  // ------------------------------------------
  // TRAJECTORY TRACKING
  // ------------------------------------------
  
  private activeTrajectories = new Map<string, {
    startTime: Date;
    embedding: number[];
    steps: Array<{ action: string; timestamp: Date }>;
  }>();
  
  /**
   * Start tracking a trajectory (for learning from outcomes)
   */
  startTrajectory(id: string, embedding: number[]): void {
    this.activeTrajectories.set(id, {
      startTime: new Date(),
      embedding,
      steps: []
    });
    
    // Auto-timeout
    setTimeout(() => {
      if (this.activeTrajectories.has(id)) {
        this.endTrajectory(id, 0); // End with zero score if timed out
      }
    }, this.config.trajectory_timeout_seconds * 1000);
  }
  
  /**
   * Add a step to an active trajectory
   */
  addTrajectoryStep(id: string, action: string): void {
    const trajectory = this.activeTrajectories.get(id);
    if (trajectory) {
      trajectory.steps.push({ action, timestamp: new Date() });
    }
  }
  
  /**
   * End a trajectory and optionally store as pattern
   */
  async endTrajectory(id: string, outcomeScore: number): Promise<void> {
    const trajectory = this.activeTrajectories.get(id);
    if (!trajectory) return;
    
    this.activeTrajectories.delete(id);
    
    // Store as pattern if outcome was good
    if (outcomeScore >= this.config.pattern_quality_threshold) {
      await this.storePattern({
        embedding: trajectory.embedding,
        pattern: {
          steps: trajectory.steps,
          duration: Date.now() - trajectory.startTime.getTime(),
          outcome: outcomeScore
        },
        quality: outcomeScore
      });
    }
  }
  
  // ------------------------------------------
  // HEALTH & DIAGNOSTICS
  // ------------------------------------------
  
  async getStats(namespace = 'default'): Promise<{
    patternCount: number;
    avgQuality: number;
    clusterDistribution: Record<string, number>;
  }> {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as pattern_count,
        AVG(quality_score) as avg_quality
      FROM reasoning_bank
      WHERE namespace = $1
    `, [namespace]);
    
    return {
      patternCount: parseInt(result.rows[0].pattern_count),
      avgQuality: parseFloat(result.rows[0].avg_quality) || 0,
      clusterDistribution: {} // Would need clustering analysis
    };
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createSonaEngine(
  domainType: 'stable' | 'moderate' | 'fastChanging',
  connectionString: string,
  overrides: Partial<SonaConfig> = {}
): SonaEngine {
  return new SonaEngine({
    ...PRESETS[domainType],
    ...overrides,
    connectionString
  });
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// For a retirement planning app (stable domain):
const sona = createSonaEngine('stable', process.env.DATABASE_URL);

// Store a successful pattern
await sona.storePattern({
  embedding: await embedProfile(userProfile),
  pattern: {
    profile: { age: 55, risk: 'moderate', goal: 'early_retirement' },
    recommendation: 'delayed_ss_roth_conversion',
    outcome: 'user_followed_85%'
  },
  quality: 0.85
});

// Recall for new user
const similar = await sona.recallPatterns(
  await embedProfile(newUserProfile),
  { limit: 5, minQuality: 0.7 }
);
*/
