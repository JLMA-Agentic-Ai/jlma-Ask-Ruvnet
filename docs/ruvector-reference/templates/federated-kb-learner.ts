/**
 * KB-First v3.0 - Federated Learning Template
 *
 * Distributed expert knowledge curation using agentic-flow's
 * FederatedLearningCoordinator and EphemeralLearningAgent.
 *
 * Use this for:
 * - Multi-expert knowledge aggregation
 * - Quality-gated KB ingestion
 * - Distributed learning without centralizing data
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ExpertAgent {
  id: string;
  domain: string;
  expertise: string[];
  qualityThreshold: number;
  learningRate: number;
  contributionCount: number;
}

export interface KnowledgeContribution {
  agentId: string;
  domain: string;
  title: string;
  content: string;
  sourceUrl: string;
  confidence: number;
  metadata: Record<string, unknown>;
  qualityScore: number;
}

export interface AggregationResult {
  accepted: KnowledgeContribution[];
  rejected: KnowledgeContribution[];
  aggregatedConfidence: number;
  qualityMetrics: {
    avgQuality: number;
    minQuality: number;
    maxQuality: number;
    consensusLevel: number;
  };
}

export interface FederatedConfig {
  // Quality gating
  qualityThreshold: number;      // Min quality to accept (0.6-0.9)
  consensusRequired: number;     // Number of agents that must agree (1-5)

  // Aggregation strategy
  aggregationStrategy: 'weighted' | 'majority' | 'quality_first' | 'expert_weighted';
  weightByExpertise: boolean;

  // Scale limits
  maxAgents: number;
  maxContributionsPerRound: number;

  // Learning parameters
  learningRate: number;
  adaptiveThreshold: boolean;    // Adjust threshold based on domain
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: FederatedConfig = {
  qualityThreshold: 0.7,
  consensusRequired: 2,
  aggregationStrategy: 'quality_first',
  weightByExpertise: true,
  maxAgents: 50,
  maxContributionsPerRound: 100,
  learningRate: 0.1,
  adaptiveThreshold: true
};

// =============================================================================
// FEDERATED KB COORDINATOR
// =============================================================================

export class FederatedKBCoordinator {
  private config: FederatedConfig;
  private agents: Map<string, ExpertAgent>;
  private pendingContributions: KnowledgeContribution[];
  private domainThresholds: Map<string, number>;

  // Integration with agentic-flow (lazy loaded)
  private agenticCoordinator: any = null;

  constructor(config: Partial<FederatedConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.agents = new Map();
    this.pendingContributions = [];
    this.domainThresholds = new Map();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Initialize connection to agentic-flow's FederatedLearningCoordinator
   */
  async initialize(): Promise<boolean> {
    try {
      const agenticFlow = await import('agentic-flow');

      if (agenticFlow.FederatedLearningCoordinator) {
        this.agenticCoordinator = new agenticFlow.FederatedLearningCoordinator({
          qualityThreshold: this.config.qualityThreshold,
          aggregationStrategy: this.config.aggregationStrategy,
          maxAgents: this.config.maxAgents
        });

        console.log('[FEDERATED-KB] Initialized with agentic-flow coordinator');
        return true;
      }

      console.log('[FEDERATED-KB] Running in standalone mode');
      return false;
    } catch (e) {
      console.log('[FEDERATED-KB] agentic-flow not available, using standalone mode');
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // AGENT MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Register an expert agent for knowledge contribution
   */
  registerAgent(agent: Omit<ExpertAgent, 'contributionCount'>): ExpertAgent {
    const fullAgent: ExpertAgent = {
      ...agent,
      contributionCount: 0
    };

    this.agents.set(agent.id, fullAgent);

    // Set domain-specific threshold if adaptive
    if (this.config.adaptiveThreshold && !this.domainThresholds.has(agent.domain)) {
      this.domainThresholds.set(agent.domain, this.config.qualityThreshold);
    }

    console.log(`[FEDERATED-KB] Registered agent: ${agent.id} (domain: ${agent.domain})`);
    return fullAgent;
  }

  /**
   * Create an ephemeral learning agent for temporary tasks
   */
  async createEphemeralAgent(
    domain: string,
    task: string,
    options: {
      expertise?: string[];
      qualityThreshold?: number;
      ttlMinutes?: number;
    } = {}
  ): Promise<ExpertAgent> {
    const agentId = `ephemeral-${domain}-${Date.now()}`;

    const agent = this.registerAgent({
      id: agentId,
      domain,
      expertise: options.expertise || [domain],
      qualityThreshold: options.qualityThreshold || this.config.qualityThreshold,
      learningRate: this.config.learningRate
    });

    // If agentic-flow is available, create a real ephemeral agent
    if (this.agenticCoordinator) {
      try {
        const agenticFlow = await import('agentic-flow');
        if (agenticFlow.EphemeralLearningAgent) {
          const ephemeralAgent = new agenticFlow.EphemeralLearningAgent({
            id: agentId,
            domain,
            task,
            ttlMinutes: options.ttlMinutes || 30,
            contributeTo: this.agenticCoordinator
          });

          console.log(`[FEDERATED-KB] Created ephemeral agent with agentic-flow: ${agentId}`);
        }
      } catch (e) {
        // Standalone mode
      }
    }

    return agent;
  }

  /**
   * Get all registered agents
   */
  getAgents(domain?: string): ExpertAgent[] {
    const agents = [...this.agents.values()];
    return domain ? agents.filter(a => a.domain === domain) : agents;
  }

  // ---------------------------------------------------------------------------
  // CONTRIBUTION SUBMISSION
  // ---------------------------------------------------------------------------

  /**
   * Submit a knowledge contribution from an agent
   */
  async submitContribution(
    agentId: string,
    contribution: Omit<KnowledgeContribution, 'agentId' | 'qualityScore'>
  ): Promise<{ accepted: boolean; qualityScore: number; reason?: string }> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { accepted: false, qualityScore: 0, reason: 'Agent not registered' };
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(contribution, agent);

    const fullContribution: KnowledgeContribution = {
      ...contribution,
      agentId,
      qualityScore
    };

    // Check against threshold
    const threshold = this.config.adaptiveThreshold
      ? this.domainThresholds.get(contribution.domain) || this.config.qualityThreshold
      : this.config.qualityThreshold;

    if (qualityScore < threshold) {
      return {
        accepted: false,
        qualityScore,
        reason: `Quality score ${qualityScore.toFixed(2)} below threshold ${threshold}`
      };
    }

    // Add to pending contributions
    this.pendingContributions.push(fullContribution);
    agent.contributionCount++;

    // Auto-aggregate if we have enough contributions
    if (this.pendingContributions.length >= this.config.maxContributionsPerRound) {
      await this.aggregateContributions();
    }

    return { accepted: true, qualityScore };
  }

  /**
   * Calculate quality score for a contribution
   */
  private calculateQualityScore(
    contribution: Omit<KnowledgeContribution, 'agentId' | 'qualityScore'>,
    agent: ExpertAgent
  ): number {
    let score = contribution.confidence;

    // Weight by agent's expertise match
    if (this.config.weightByExpertise) {
      const expertiseMatch = agent.expertise.some(e =>
        contribution.domain.toLowerCase().includes(e.toLowerCase()) ||
        e.toLowerCase().includes(contribution.domain.toLowerCase())
      );
      if (expertiseMatch) {
        score *= 1.2; // 20% boost for expertise match
      }
    }

    // Content quality factors
    const contentLength = contribution.content.length;
    if (contentLength > 500 && contentLength < 10000) {
      score *= 1.1; // Boost for good content length
    }
    if (contentLength < 100) {
      score *= 0.7; // Penalty for too short
    }
    if (contentLength > 20000) {
      score *= 0.9; // Slight penalty for too long
    }

    // Source URL bonus
    if (contribution.sourceUrl && contribution.sourceUrl.startsWith('https://')) {
      score *= 1.05;
    }

    // Normalize to 0-1 range
    return Math.min(1, Math.max(0, score));
  }

  // ---------------------------------------------------------------------------
  // AGGREGATION
  // ---------------------------------------------------------------------------

  /**
   * Aggregate pending contributions and ingest to KB
   */
  async aggregateContributions(): Promise<AggregationResult> {
    const contributions = [...this.pendingContributions];
    this.pendingContributions = [];

    if (contributions.length === 0) {
      return {
        accepted: [],
        rejected: [],
        aggregatedConfidence: 0,
        qualityMetrics: { avgQuality: 0, minQuality: 0, maxQuality: 0, consensusLevel: 0 }
      };
    }

    // Group by domain for consensus checking
    const byDomain = new Map<string, KnowledgeContribution[]>();
    contributions.forEach(c => {
      const list = byDomain.get(c.domain) || [];
      list.push(c);
      byDomain.set(c.domain, list);
    });

    const accepted: KnowledgeContribution[] = [];
    const rejected: KnowledgeContribution[] = [];

    // Apply aggregation strategy
    for (const [domain, domainContributions] of byDomain) {
      const { pass, fail } = this.applyAggregationStrategy(domainContributions);
      accepted.push(...pass);
      rejected.push(...fail);
    }

    // Calculate quality metrics
    const qualities = accepted.map(c => c.qualityScore);
    const qualityMetrics = {
      avgQuality: qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 0,
      minQuality: qualities.length > 0 ? Math.min(...qualities) : 0,
      maxQuality: qualities.length > 0 ? Math.max(...qualities) : 0,
      consensusLevel: accepted.length / (accepted.length + rejected.length) || 0
    };

    // Update adaptive thresholds based on quality metrics
    if (this.config.adaptiveThreshold) {
      this.updateAdaptiveThresholds(accepted);
    }

    // Ingest accepted contributions to KB
    if (accepted.length > 0) {
      await this.ingestToKB(accepted);
    }

    console.log(`[FEDERATED-KB] Aggregation complete: ${accepted.length} accepted, ${rejected.length} rejected`);

    return {
      accepted,
      rejected,
      aggregatedConfidence: qualityMetrics.avgQuality,
      qualityMetrics
    };
  }

  /**
   * Apply the configured aggregation strategy
   */
  private applyAggregationStrategy(contributions: KnowledgeContribution[]): {
    pass: KnowledgeContribution[];
    fail: KnowledgeContribution[];
  } {
    const pass: KnowledgeContribution[] = [];
    const fail: KnowledgeContribution[] = [];

    switch (this.config.aggregationStrategy) {
      case 'quality_first':
        // Sort by quality, take top ones above threshold
        contributions
          .sort((a, b) => b.qualityScore - a.qualityScore)
          .forEach(c => {
            if (c.qualityScore >= this.config.qualityThreshold) {
              pass.push(c);
            } else {
              fail.push(c);
            }
          });
        break;

      case 'weighted':
        // Weight by agent expertise and quality
        contributions.forEach(c => {
          const agent = this.agents.get(c.agentId);
          const expertiseBonus = agent?.expertise.length ? 0.1 * agent.expertise.length : 0;
          const weightedScore = c.qualityScore + expertiseBonus;
          if (weightedScore >= this.config.qualityThreshold) {
            pass.push(c);
          } else {
            fail.push(c);
          }
        });
        break;

      case 'majority':
        // Group similar contributions and require majority agreement
        const grouped = this.groupSimilarContributions(contributions);
        grouped.forEach(group => {
          if (group.length >= this.config.consensusRequired) {
            // Take the highest quality one from the group
            const best = group.sort((a, b) => b.qualityScore - a.qualityScore)[0];
            pass.push(best);
            group.slice(1).forEach(c => fail.push(c));
          } else {
            group.forEach(c => fail.push(c));
          }
        });
        break;

      case 'expert_weighted':
        // Weight heavily by agent contribution history
        contributions.forEach(c => {
          const agent = this.agents.get(c.agentId);
          const contributionBonus = Math.min(0.2, (agent?.contributionCount || 0) * 0.01);
          const weightedScore = c.qualityScore + contributionBonus;
          if (weightedScore >= this.config.qualityThreshold) {
            pass.push(c);
          } else {
            fail.push(c);
          }
        });
        break;
    }

    return { pass, fail };
  }

  /**
   * Group similar contributions for consensus checking
   */
  private groupSimilarContributions(contributions: KnowledgeContribution[]): KnowledgeContribution[][] {
    // Simple title-based grouping (could be enhanced with embeddings)
    const groups: KnowledgeContribution[][] = [];
    const used = new Set<number>();

    contributions.forEach((c, i) => {
      if (used.has(i)) return;

      const group = [c];
      used.add(i);

      contributions.forEach((other, j) => {
        if (i === j || used.has(j)) return;

        // Simple similarity check (could use embeddings for better matching)
        const titleSimilar = this.stringSimilarity(c.title, other.title) > 0.7;
        const domainMatch = c.domain === other.domain;

        if (titleSimilar && domainMatch) {
          group.push(other);
          used.add(j);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * Simple string similarity (Jaccard index on words)
   */
  private stringSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  }

  /**
   * Update adaptive thresholds based on domain performance
   */
  private updateAdaptiveThresholds(accepted: KnowledgeContribution[]): void {
    const byDomain = new Map<string, number[]>();

    accepted.forEach(c => {
      const list = byDomain.get(c.domain) || [];
      list.push(c.qualityScore);
      byDomain.set(c.domain, list);
    });

    byDomain.forEach((scores, domain) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const currentThreshold = this.domainThresholds.get(domain) || this.config.qualityThreshold;

      // Slowly adapt threshold toward observed quality
      const newThreshold = currentThreshold + this.config.learningRate * (avg - currentThreshold);
      this.domainThresholds.set(domain, Math.max(0.5, Math.min(0.95, newThreshold)));
    });
  }

  /**
   * Ingest accepted contributions to the KB
   */
  private async ingestToKB(contributions: KnowledgeContribution[]): Promise<void> {
    try {
      // Import kb-client dynamically
      const kbClient = await import('./kb-client');

      for (const contribution of contributions) {
        await kbClient.ingestDocument(
          contribution.domain,
          `federated/${contribution.agentId}/${contribution.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
          contribution.title,
          contribution.content,
          {
            sourceExpert: `federated:${contribution.agentId}`,
            sourceUrl: contribution.sourceUrl,
            confidence: contribution.qualityScore,
            metadata: {
              ...contribution.metadata,
              federatedAgent: contribution.agentId,
              aggregatedAt: new Date().toISOString()
            }
          }
        );
      }

      console.log(`[FEDERATED-KB] Ingested ${contributions.length} contributions to KB`);
    } catch (e) {
      console.error('[FEDERATED-KB] KB ingestion failed:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // STATISTICS & MONITORING
  // ---------------------------------------------------------------------------

  /**
   * Get coordinator statistics
   */
  getStats(): {
    totalAgents: number;
    pendingContributions: number;
    domainThresholds: Record<string, number>;
    topContributors: Array<{ id: string; domain: string; contributions: number }>;
  } {
    const agents = [...this.agents.values()];

    return {
      totalAgents: agents.length,
      pendingContributions: this.pendingContributions.length,
      domainThresholds: Object.fromEntries(this.domainThresholds),
      topContributors: agents
        .sort((a, b) => b.contributionCount - a.contributionCount)
        .slice(0, 10)
        .map(a => ({ id: a.id, domain: a.domain, contributions: a.contributionCount }))
    };
  }
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

export const PRESETS = {
  /**
   * Strict quality gating for critical domains (medical, legal, finance)
   */
  strict: {
    qualityThreshold: 0.85,
    consensusRequired: 3,
    aggregationStrategy: 'majority' as const,
    weightByExpertise: true,
    maxAgents: 20,
    maxContributionsPerRound: 50,
    learningRate: 0.05,
    adaptiveThreshold: false
  },

  /**
   * Balanced for general knowledge domains
   */
  balanced: {
    qualityThreshold: 0.7,
    consensusRequired: 2,
    aggregationStrategy: 'quality_first' as const,
    weightByExpertise: true,
    maxAgents: 50,
    maxContributionsPerRound: 100,
    learningRate: 0.1,
    adaptiveThreshold: true
  },

  /**
   * Permissive for rapidly evolving domains (tech, news)
   */
  permissive: {
    qualityThreshold: 0.5,
    consensusRequired: 1,
    aggregationStrategy: 'weighted' as const,
    weightByExpertise: false,
    maxAgents: 100,
    maxContributionsPerRound: 200,
    learningRate: 0.2,
    adaptiveThreshold: true
  },

  /**
   * Expert-focused for specialized domains
   */
  expertFocused: {
    qualityThreshold: 0.75,
    consensusRequired: 2,
    aggregationStrategy: 'expert_weighted' as const,
    weightByExpertise: true,
    maxAgents: 30,
    maxContributionsPerRound: 75,
    learningRate: 0.1,
    adaptiveThreshold: true
  }
};

// =============================================================================
// CONVENIENCE FACTORY
// =============================================================================

/**
 * Create a federated coordinator with a preset configuration
 */
export function createFederatedCoordinator(
  preset: keyof typeof PRESETS = 'balanced',
  overrides: Partial<FederatedConfig> = {}
): FederatedKBCoordinator {
  const config = { ...PRESETS[preset], ...overrides };
  return new FederatedKBCoordinator(config);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  FederatedKBCoordinator,
  createFederatedCoordinator,
  PRESETS
};
