Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:02:47 EST

# AgentDB v1.6.1 - Complete Knowledge Base

## Overview

AgentDB is a frontier vector database designed for AI agent memory systems. It combines vector search with causal reasoning, reinforcement learning, and explainable AI to enable agents to learn from experience, reason about causality, and provide traceable decisions.

**Version**: 1.6.1
**NPM Package**: `agentdb`
**License**: MIT

---

## Table of Contents

1. [Complete API Reference](#complete-api-reference)
2. [29 MCP Tools](#29-mcp-tools)
3. [9 Reinforcement Learning Algorithms](#9-reinforcement-learning-algorithms)
4. [HNSW Indexing Configuration](#hnsw-indexing-configuration)
5. [Quantization Options](#quantization-options)
6. [Reflexion Memory Patterns](#reflexion-memory-patterns)
7. [Skill Library System](#skill-library-system)
8. [Integration with Claude Flow and Agentic Flow](#integration-with-claude-flow-and-agentic-flow)

---

## Complete API Reference

### Core Controllers

#### 1. EmbeddingService

Generates vector embeddings using transformers.js or OpenAI.

```typescript
interface EmbeddingConfig {
  model: string;           // Default: 'Xenova/all-MiniLM-L6-v2'
  dimension: number;       // Default: 384
  provider: 'transformers' | 'openai';
  openaiApiKey?: string;
}

class EmbeddingService {
  constructor(config?: Partial<EmbeddingConfig>);
  initialize(): Promise<void>;
  embed(text: string): Promise<Float32Array>;
  embedBatch(texts: string[]): Promise<Float32Array[]>;
}
```

#### 2. ReflexionMemory

Episodic replay memory for agent self-improvement (based on Reflexion paper).

```typescript
interface Episode {
  id?: number;
  ts?: number;
  sessionId: string;
  task: string;
  input?: string;
  output?: string;
  critique?: string;
  reward: number;
  success: boolean;
  latencyMs?: number;
  tokensUsed?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface ReflexionQuery {
  task: string;
  currentState?: string;
  k?: number;                  // Default: 5
  minReward?: number;
  onlyFailures?: boolean;
  onlySuccesses?: boolean;
  timeWindowDays?: number;
}

class ReflexionMemory {
  constructor(db: Database, embedder: EmbeddingService);
  storeEpisode(episode: Episode): Promise<number>;
  retrieveRelevant(query: ReflexionQuery): Promise<EpisodeWithEmbedding[]>;
  getTaskStats(task: string, timeWindowDays?: number): TaskStats;
  getCritiqueSummary(query: ReflexionQuery): Promise<string>;
  getSuccessStrategies(query: ReflexionQuery): Promise<string>;
  pruneEpisodes(config: PruneConfig): number;
}
```

#### 3. SkillLibrary

Lifelong learning skill management (based on Voyager paper).

```typescript
interface Skill {
  id?: number;
  name: string;
  description?: string;
  signature: {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
  };
  code?: string;
  successRate: number;
  uses: number;
  avgReward: number;
  avgLatencyMs: number;
  createdFromEpisode?: number;
  metadata?: Record<string, any>;
}

interface SkillLink {
  parentSkillId: number;
  childSkillId: number;
  relationship: 'prerequisite' | 'alternative' | 'refinement' | 'composition';
  weight: number;
  metadata?: Record<string, any>;
}

class SkillLibrary {
  constructor(db: Database, embedder: EmbeddingService);
  createSkill(skill: Skill): Promise<number>;
  updateSkillStats(skillId: number, success: boolean, reward: number, latencyMs: number): void;
  searchSkills(query: SkillQuery): Promise<Skill[]>;
  retrieveSkills(query: SkillQuery): Promise<Skill[]>;
  linkSkills(link: SkillLink): void;
  getSkillPlan(skillId: number): SkillPlan;
  consolidateEpisodesIntoSkills(config: ConsolidateConfig): Promise<ConsolidateResult>;
  pruneSkills(config: PruneConfig): number;
}
```

#### 4. CausalMemoryGraph

Causal reasoning over agent memories using Pearl's do-calculus.

```typescript
interface CausalEdge {
  id?: number;
  fromMemoryId: number;
  fromMemoryType: 'episode' | 'skill' | 'note' | 'fact';
  toMemoryId: number;
  toMemoryType: 'episode' | 'skill' | 'note' | 'fact';
  similarity: number;
  uplift?: number;           // E[y|do(x)] - E[y]
  confidence: number;
  sampleSize?: number;
  evidenceIds?: string[];
  experimentIds?: string[];
  confounderScore?: number;
  mechanism?: string;
  metadata?: Record<string, any>;
}

interface CausalExperiment {
  id?: number;
  name: string;
  hypothesis: string;
  treatmentId: number;
  treatmentType: string;
  controlId?: number;
  startTime: number;
  endTime?: number;
  sampleSize: number;
  treatmentMean?: number;
  controlMean?: number;
  uplift?: number;
  pValue?: number;
  confidenceIntervalLow?: number;
  confidenceIntervalHigh?: number;
  status: 'running' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

class CausalMemoryGraph {
  constructor(db: Database);
  addCausalEdge(edge: CausalEdge): number;
  createExperiment(experiment: CausalExperiment): number;
  recordObservation(observation: CausalObservation): void;
  calculateUplift(experimentId: number): UpliftResult;
  queryCausalEffects(query: CausalQuery): CausalEdge[];
  getCausalChain(fromMemoryId: number, toMemoryId: number, maxDepth?: number): CausalChain[];
  calculateCausalGain(treatmentId: number, outcomeType: string): CausalGain;
  detectConfounders(edgeId: number): ConfounderResult;
}
```

#### 5. CausalRecall

Utility-based reranking with causal uplift.

```typescript
interface RerankConfig {
  alpha: number;    // Similarity weight (default: 0.7)
  beta: number;     // Uplift weight (default: 0.2)
  gamma: number;    // Latency penalty (default: 0.1)
  minConfidence?: number;  // Default: 0.6
}

// Utility formula: U = α*similarity + β*uplift − γ*latencyCost

class CausalRecall {
  constructor(db: Database, embedder: EmbeddingService);
  recall(agentId: string, query: string, k?: number, config?: RerankConfig, accessLevel?: string): Promise<RecallResult>;
}
```

#### 6. ExplainableRecall

Provenance tracking with Merkle proofs and minimal hitting sets.

```typescript
interface RecallCertificate {
  id: string;
  queryId: string;
  queryText: string;
  chunkIds: string[];
  minimalWhy: string[];          // Minimal hitting set
  redundancyRatio: number;
  completenessScore: number;
  merkleRoot: string;
  sourceHashes: string[];
  proofChain: MerkleProof[];
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}

class ExplainableRecall {
  constructor(db: Database, embedder: EmbeddingService);
  recall(agentId: string, query: string, k?: number, config?: RerankConfig, accessLevel?: string): Promise<ExplainableRecallResult>;
  verifyCertificate(certificateId: string): Promise<VerifyResult>;
}
```

#### 7. ReasoningBank

Pattern storage and retrieval with embeddings.

```typescript
interface ReasoningPattern {
  id?: number;
  taskType: string;
  approach: string;
  successRate: number;
  embedding?: Float32Array;
  uses?: number;
  avgReward?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt?: number;
  similarity?: number;
}

interface PatternSearchQuery {
  taskEmbedding: Float32Array;
  k?: number;
  threshold?: number;
  filters?: {
    taskType?: string;
    minSuccessRate?: number;
    tags?: string[];
  };
}

class ReasoningBank {
  constructor(db: Database, embedder: EmbeddingService);
  storePattern(pattern: ReasoningPattern): Promise<number>;
  searchPatterns(query: PatternSearchQuery): Promise<ReasoningPattern[]>;
  getPatternStats(): PatternStats;
  updatePatternStats(patternId: number, success: boolean, reward: number): void;
  getPattern(patternId: number): ReasoningPattern | null;
  deletePattern(patternId: number): boolean;
  clearCache(): void;
}
```

#### 8. LearningSystem

Reinforcement learning session management supporting 9 algorithms.

```typescript
interface LearningSession {
  id: string;
  userId: string;
  sessionType: 'q-learning' | 'sarsa' | 'dqn' | 'policy-gradient' |
               'actor-critic' | 'ppo' | 'decision-transformer' | 'mcts' | 'model-based';
  config: LearningConfig;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

interface LearningConfig {
  learningRate: number;
  discountFactor: number;
  explorationRate?: number;
  batchSize?: number;
  targetUpdateFrequency?: number;
}

interface ActionPrediction {
  action: string;
  confidence: number;
  qValue?: number;
  alternatives: Array<{ action: string; confidence: number; qValue?: number }>;
}

class LearningSystem {
  constructor(db: Database, embedder: EmbeddingService);
  startSession(userId: string, sessionType: SessionType, config: LearningConfig): Promise<string>;
  endSession(sessionId: string): Promise<void>;
  predict(sessionId: string, state: string): Promise<ActionPrediction>;
  submitFeedback(feedback: ActionFeedback): Promise<void>;
  train(sessionId: string, epochs?: number, batchSize?: number, learningRate?: number): Promise<TrainingResult>;
  getMetrics(config: MetricsConfig): Promise<LearningMetrics>;
  transferLearning(config: TransferConfig): Promise<TransferResult>;
  explainAction(config: ExplainConfig): Promise<ExplainResult>;
  recordExperience(experience: Experience): Promise<number>;
  calculateReward(config: RewardConfig): number;
}
```

#### 9. NightlyLearner

Automated causal discovery using doubly robust learner.

```typescript
interface LearnerConfig {
  minSimilarity: number;       // Default: 0.7
  minSampleSize: number;       // Default: 30
  confidenceThreshold: number; // Default: 0.6
  upliftThreshold: number;     // Default: 0.05
  pruneOldEdges: boolean;      // Default: true
  edgeMaxAgeDays: number;      // Default: 90
  autoExperiments: boolean;    // Default: true
  experimentBudget: number;    // Default: 10
}

// Doubly Robust Learner formula:
// τ̂(x) = μ1(x) − μ0(x) + [a*(y−μ1(x)) / e(x)] − [(1−a)*(y−μ0(x)) / (1−e(x))]

class NightlyLearner {
  constructor(db: Database, embedder: EmbeddingService, config?: LearnerConfig);
  run(): Promise<LearnerReport>;
  discover(config: DiscoverConfig): Promise<CausalEdge[]>;
  updateConfig(config: Partial<LearnerConfig>): void;
}
```

#### 10. HNSWIndex

High-performance approximate nearest neighbor search.

```typescript
interface HNSWConfig {
  M: number;                    // Max connections per layer (default: 16)
  efConstruction: number;       // Construction candidate list (default: 200)
  efSearch: number;             // Search candidate list (default: 100)
  metric: 'cosine' | 'l2' | 'ip';
  dimension: number;            // Default: 1536
  maxElements: number;          // Default: 100000
  persistIndex: boolean;
  indexPath?: string;
  rebuildThreshold: number;     // Default: 0.1 (10%)
}

class HNSWIndex {
  constructor(db: Database, config?: Partial<HNSWConfig>);
  buildIndex(tableName?: string): Promise<void>;
  search(query: Float32Array, k: number, options?: SearchOptions): Promise<HNSWSearchResult[]>;
  addVector(id: number, embedding: Float32Array): void;
  removeVector(id: number): void;
  needsRebuild(): boolean;
  getStats(): HNSWStats;
  setEfSearch(ef: number): void;
  clear(): void;
  isReady(): boolean;
}
```

#### 11. WASMVectorSearch

WASM-accelerated vector operations with SIMD support.

```typescript
interface VectorSearchConfig {
  enableWASM: boolean;
  enableSIMD: boolean;
  batchSize: number;           // Default: 100
  indexThreshold: number;      // Default: 1000
}

class WASMVectorSearch {
  constructor(db: Database, config?: Partial<VectorSearchConfig>);
  cosineSimilarity(a: Float32Array, b: Float32Array): number;
  batchSimilarity(query: Float32Array, vectors: Float32Array[]): number[];
  findKNN(query: Float32Array, k: number, tableName?: string, options?: SearchOptions): Promise<VectorSearchResult[]>;
  buildIndex(vectors: Float32Array[], ids: number[], metadata?: any[]): void;
  searchIndex(query: Float32Array, k: number, threshold?: number): VectorSearchResult[];
  getStats(): WASMStats;
  clearIndex(): void;
}
```

#### 12. BatchOperations

Optimized batch processing with transactions.

```typescript
interface BatchConfig {
  batchSize: number;           // Default: 100
  parallelism: number;         // Default: 4
  progressCallback?: (progress: number, total: number) => void;
}

class BatchOperations {
  constructor(db: Database, embedder: EmbeddingService, config?: Partial<BatchConfig>);
  insertEpisodes(episodes: Episode[]): Promise<number>;
  regenerateEmbeddings(episodeIds?: number[]): Promise<number>;
  processInParallel<T, R>(items: T[], processor: (item: T) => Promise<R>): Promise<R[]>;
  bulkDelete(table: string, conditions: Record<string, any>): number;
  bulkUpdate(table: string, updates: Record<string, any>, conditions: Record<string, any>): number;
  optimize(): void;
  getStats(): BatchStats;
}
```

---

## 29 MCP Tools

AgentDB exposes 29 MCP tools organized into categories:

### Core Vector DB Operations (5 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `agentdb_init` | Initialize database with schema and optimizations | `db_path?: string`, `reset?: boolean` |
| `agentdb_insert` | Insert single vector with auto-generated embedding | `text: string`, `metadata?: object`, `session_id?: string`, `tags?: string[]` |
| `agentdb_insert_batch` | Batch insert with parallel embedding generation | `items: array`, `batch_size?: number` |
| `agentdb_search` | Semantic k-NN search with cosine similarity | `query: string`, `k?: number`, `min_similarity?: number`, `filters?: object` |
| `agentdb_delete` | Delete vectors by ID or filters | `id?: number`, `filters?: object` |

### Frontier Memory Features (9 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `reflexion_store` | Store episode with self-critique | `session_id: string`, `task: string`, `reward: number`, `success: boolean`, `critique?: string`, `input?: string`, `output?: string` |
| `reflexion_retrieve` | Retrieve relevant past episodes | `task: string`, `k?: number`, `only_failures?: boolean`, `only_successes?: boolean`, `min_reward?: number` |
| `skill_create` | Create reusable skill | `name: string`, `description: string`, `code?: string`, `success_rate?: number` |
| `skill_search` | Search skills by semantic similarity | `task: string`, `k?: number`, `min_success_rate?: number` |
| `causal_add_edge` | Add causal relationship | `cause: string`, `effect: string`, `uplift: number`, `confidence?: number`, `sample_size?: number` |
| `causal_query` | Query causal effects | `cause?: string`, `effect?: string`, `min_confidence?: number`, `min_uplift?: number`, `limit?: number` |
| `recall_with_certificate` | Retrieve with causal utility and provenance | `query: string`, `k?: number`, `alpha?: number`, `beta?: number`, `gamma?: number` |
| `learner_discover` | Auto-discover causal patterns | `min_attempts?: number`, `min_success_rate?: number`, `min_confidence?: number`, `dry_run?: boolean` |
| `db_stats` | Get database statistics | (none) |

### Learning System Tools (10 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `learning_start_session` | Start RL session with algorithm | `user_id: string`, `session_type: string`, `config: object` |
| `learning_end_session` | End session and save policy | `session_id: string` |
| `learning_predict` | Get AI action recommendation | `session_id: string`, `state: string` |
| `learning_feedback` | Submit learning feedback | `session_id: string`, `state: string`, `action: string`, `reward: number`, `success: boolean`, `next_state?: string` |
| `learning_train` | Train RL policy | `session_id: string`, `epochs?: number`, `batch_size?: number`, `learning_rate?: number` |
| `learning_metrics` | Get learning performance metrics | `session_id?: string`, `time_window_days?: number`, `include_trends?: boolean`, `group_by?: string` |
| `learning_transfer` | Transfer learning between sessions | `source_session?: string`, `target_session?: string`, `source_task?: string`, `target_task?: string`, `min_similarity?: number`, `transfer_type?: string` |
| `learning_explain` | Explain action recommendations | `query: string`, `k?: number`, `explain_depth?: string`, `include_confidence?: boolean`, `include_evidence?: boolean`, `include_causal?: boolean` |
| `experience_record` | Record tool execution experience | `session_id: string`, `tool_name: string`, `action: string`, `outcome: string`, `reward: number`, `success: boolean` |
| `reward_signal` | Calculate reward signal | `success: boolean`, `episode_id?: number`, `target_achieved?: boolean`, `efficiency_score?: number`, `quality_score?: number` |

### AgentDB Core Tools (5 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `agentdb_stats` | Comprehensive database statistics | `detailed?: boolean` |
| `agentdb_pattern_store` | Store reasoning pattern | `taskType: string`, `approach: string`, `successRate: number`, `tags?: string[]`, `metadata?: object` |
| `agentdb_pattern_search` | Search patterns semantically | `task: string`, `k?: number`, `threshold?: number`, `filters?: object` |
| `agentdb_pattern_stats` | Get pattern statistics | (none) |
| `agentdb_clear_cache` | Clear query cache | `cache_type?: string` |

---

## 9 Reinforcement Learning Algorithms

AgentDB's LearningSystem supports 9 RL algorithms:

### 1. Q-Learning
- **Type**: Model-free, off-policy
- **Update Rule**: Q(s,a) = Q(s,a) + α[r + γ max_a' Q(s',a') - Q(s,a)]
- **Best For**: Discrete state/action spaces, simple environments

### 2. SARSA (State-Action-Reward-State-Action)
- **Type**: Model-free, on-policy
- **Update Rule**: Q(s,a) = Q(s,a) + α[r + γ Q(s',a') - Q(s,a)]
- **Best For**: Safety-critical applications where exploration must be conservative

### 3. DQN (Deep Q-Network)
- **Type**: Model-free, off-policy with neural network
- **Features**: Experience replay, target networks
- **Best For**: High-dimensional state spaces, visual inputs

### 4. Policy Gradient
- **Type**: Model-free, on-policy
- **Update Rule**: ∇J(θ) = E[∇log π(a|s;θ) * G]
- **Best For**: Continuous action spaces, direct policy optimization

### 5. Actor-Critic
- **Type**: Hybrid value/policy method
- **Components**: Actor (policy), Critic (value function)
- **Best For**: Balancing variance reduction with policy optimization

### 6. PPO (Proximal Policy Optimization)
- **Type**: Model-free, on-policy with clipped updates
- **Objective**: L^CLIP(θ) = E[min(r_t(θ)A_t, clip(r_t(θ), 1-ε, 1+ε)A_t)]
- **Best For**: Stable training, large-scale applications

### 7. Decision Transformer
- **Type**: Sequence modeling approach to RL
- **Architecture**: GPT-style transformer conditioned on returns
- **Best For**: Offline RL, leveraging large-scale pretraining

### 8. MCTS (Monte Carlo Tree Search)
- **Type**: Model-based planning
- **Steps**: Selection, Expansion, Simulation, Backpropagation
- **Best For**: Game playing, planning with known models

### 9. Model-Based RL
- **Type**: Learns environment dynamics model
- **Approach**: Learn P(s'|s,a), then plan using learned model
- **Best For**: Sample-efficient learning, environments with clear dynamics

### Configuration Options

```typescript
interface LearningConfig {
  learningRate: number;            // α - step size (0.001 - 0.1)
  discountFactor: number;          // γ - future reward discount (0.9 - 0.99)
  explorationRate?: number;        // ε - exploration vs exploitation (0.1)
  batchSize?: number;              // Mini-batch size for training (32)
  targetUpdateFrequency?: number;  // Steps between target network updates (100)
}
```

---

## HNSW Indexing Configuration

HNSW (Hierarchical Navigable Small World) provides 10-100x speedup over brute-force search.

### Configuration Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `M` | 16 | 4-64 | Max connections per layer. Higher = better recall, more memory |
| `efConstruction` | 200 | 100-500 | Candidate list during construction. Higher = better index quality |
| `efSearch` | 100 | 50-500 | Candidate list during search. Higher = better recall, slower search |
| `metric` | 'cosine' | cosine, l2, ip | Distance metric |
| `dimension` | 1536 | 128-4096 | Vector dimension (must match embeddings) |
| `maxElements` | 100000 | 1000-10M | Maximum vectors in index |
| `persistIndex` | true | - | Save index to disk for persistence |
| `rebuildThreshold` | 0.1 | 0.05-0.5 | Rebuild when updates exceed this % |

### Performance Characteristics

- **Build Time**: O(N * log(N) * M * efConstruction)
- **Search Time**: O(log(N) * efSearch)
- **Memory**: O(N * M * dimension * 4 bytes)
- **Recall@10**: 95-99% with default settings

### Distance Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| `cosine` | 1 - (a·b)/(||a|| * ||b||) | Text embeddings, normalized vectors |
| `l2` (Euclidean) | sqrt(Σ(a_i - b_i)²) | Image features, spatial data |
| `ip` (Inner Product) | -a·b | Maximum inner product search |

### Similarity Conversion

```typescript
switch (metric) {
  case 'cosine':    return 1 - distance;        // Distance to similarity
  case 'l2':        return Math.exp(-distance);  // Exponential decay
  case 'ip':        return -distance;            // Negate for similarity
}
```

---

## Quantization Options

AgentDB supports 4-32x memory reduction through quantization.

### Binary Quantization (32x compression)

```typescript
interface BinaryQuantizeOptions {
  vector: string;  // JSON-encoded float vector
}

// Converts float32 to 1-bit representation
// -32x memory reduction
// ~5-10% recall loss
// Best for: Large-scale filtering, first-stage retrieval
```

### Scalar Quantization (4x compression)

```typescript
interface ScalarQuantizeOptions {
  vector: string;  // JSON-encoded float vector
}

// Converts float32 to int8 representation
// -4x memory reduction
// ~1-2% recall loss
// Best for: Production deployments balancing quality/memory
```

### Quantization Commands (CLI)

```typescript
class QuantizationCommands {
  // Convert vector to binary representation
  static binaryQuantize(client: RuVectorClient, options: BinaryQuantizeOptions): Promise<void>;

  // Convert vector to scalar (int8) representation
  static scalarQuantize(client: RuVectorClient, options: ScalarQuantizeOptions): Promise<void>;

  // Get quantization statistics
  static stats(client: RuVectorClient): Promise<void>;

  // Compare quantized vs original accuracy
  static compare(client: RuVectorClient, vector: string): Promise<void>;
}
```

### Quantized Search

```typescript
interface QuantizedSearchOptions {
  table: string;
  query: string;
  topK?: string;
  quantType?: 'binary' | 'scalar';
}
```

### Memory Savings Summary

| Quantization | Compression | Memory Reduction | Recall Loss |
|--------------|-------------|------------------|-------------|
| None (float32) | 1x | Baseline | 0% |
| Scalar (int8) | 4x | 75% | 1-2% |
| Binary (1-bit) | 32x | 96.9% | 5-10% |
| Product (PQ) | 8-16x | 87-94% | 2-5% |

---

## Reflexion Memory Patterns

Based on the paper "Reflexion: Language Agents with Verbal Reinforcement Learning."

### Core Concept

Reflexion enables agents to learn from past experiences through:
1. **Task Execution**: Agent attempts a task
2. **Self-Critique**: Agent reflects on performance
3. **Memory Storage**: Episode stored with embedding
4. **Future Retrieval**: Similar past experiences inform new attempts

### Episode Structure

```typescript
interface Episode {
  id?: number;
  ts?: number;              // Timestamp
  sessionId: string;        // Session identifier
  task: string;             // Task description
  input?: string;           // Task input
  output?: string;          // Task output/result
  critique?: string;        // Self-reflection/critique
  reward: number;           // Performance score (0-1)
  success: boolean;         // Binary success indicator
  latencyMs?: number;       // Execution time
  tokensUsed?: number;      // Token consumption
  tags?: string[];          // Categorization tags
  metadata?: Record<string, any>;  // Additional context
}
```

### Query Patterns

#### Retrieve Relevant Episodes
```typescript
const episodes = await reflexion.retrieveRelevant({
  task: "Implement authentication",
  k: 5,                    // Top-k results
  onlySuccesses: true,     // Only successful attempts
  minReward: 0.8,          // High-quality episodes only
  timeWindowDays: 30       // Recent episodes
});
```

#### Get Critique Summary
```typescript
// Summarize lessons from past failures
const critiques = await reflexion.getCritiqueSummary({
  task: "API integration",
  k: 3
});
// Returns: "Prior failures and lessons learned:
//   1. Forgot rate limiting (reward: 0.3)
//   2. Missing error handling (reward: 0.4)
//   3. Incomplete retry logic (reward: 0.5)"
```

#### Get Success Strategies
```typescript
// Extract successful approaches
const strategies = await reflexion.getSuccessStrategies({
  task: "Database optimization",
  minReward: 0.8
});
```

### Task Statistics

```typescript
interface TaskStats {
  totalAttempts: number;
  successRate: number;
  avgReward: number;
  avgLatency: number;
  improvementTrend: number;  // Recent vs older performance
}
```

### Pruning Configuration

```typescript
reflexion.pruneEpisodes({
  minReward: 0.3,      // Remove low-reward episodes
  maxAgeDays: 30,      // Remove old episodes
  keepMinPerTask: 5    // Keep at least 5 per task
});
```

---

## Skill Library System

Based on the paper "Voyager: An Open-Ended Embodied Agent with Large Language Models."

### Core Concept

The Skill Library enables agents to:
1. **Extract Skills**: Convert successful episodes into reusable skills
2. **Semantic Search**: Find applicable skills for new tasks
3. **Composition**: Build complex behaviors from simpler skills
4. **Continuous Learning**: Update skills based on performance

### Skill Structure

```typescript
interface Skill {
  id?: number;
  name: string;              // Unique skill name
  description?: string;      // What the skill does
  signature: {
    inputs: Record<string, any>;   // Input parameters
    outputs: Record<string, any>;  // Output types
  };
  code?: string;             // Implementation code
  successRate: number;       // Historical success rate
  uses: number;              // Usage count
  avgReward: number;         // Average reward when used
  avgLatencyMs: number;      // Average execution time
  createdFromEpisode?: number;  // Source episode ID
  metadata?: Record<string, any>;
}
```

### Skill Relationships

```typescript
interface SkillLink {
  parentSkillId: number;
  childSkillId: number;
  relationship: 'prerequisite' | 'alternative' | 'refinement' | 'composition';
  weight: number;           // Relationship strength
  metadata?: Record<string, any>;
}
```

| Relationship | Description |
|--------------|-------------|
| `prerequisite` | Must execute child before parent |
| `alternative` | Child can substitute for parent |
| `refinement` | Child is improved version of parent |
| `composition` | Parent combines multiple children |

### Skill Consolidation

Automatically promote high-reward episodes to skills:

```typescript
const result = await skills.consolidateEpisodesIntoSkills({
  minAttempts: 3,          // Minimum attempts required
  minReward: 0.7,          // Minimum average reward
  timeWindowDays: 7,       // Look back period
  extractPatterns: true    // Extract common patterns
});

// Returns:
// {
//   created: 5,            // New skills created
//   updated: 12,           // Existing skills updated
//   patterns: [            // Extracted patterns
//     {
//       task: "API integration",
//       commonPatterns: ["retry logic", "rate limiting"],
//       successIndicators: ["High consistency (80% above average)"],
//       avgReward: 0.85
//     }
//   ]
// }
```

### Skill Score Calculation

```typescript
// Composite score for skill ranking
const score =
  skill.similarity * 0.4 +           // Semantic relevance
  skill.successRate * 0.3 +          // Historical success
  Math.min(skill.uses / 1000, 1.0) * 0.1 +  // Experience factor
  skill.avgReward * 0.2;             // Average quality
```

### Getting Skill Plans

```typescript
const plan = skills.getSkillPlan(skillId);
// Returns:
// {
//   skill: Skill,              // The main skill
//   prerequisites: Skill[],    // Required skills first
//   alternatives: Skill[],     // Alternative approaches
//   refinements: Skill[]       // Improved versions
// }
```

---

## Integration with Claude Flow and Agentic Flow

### Claude Flow Integration

AgentDB integrates with Claude Flow through MCP (Model Context Protocol):

#### MCP Server Configuration

```json
{
  "mcpServers": {
    "agentdb": {
      "command": "npx",
      "args": ["agentdb-mcp-server"],
      "env": {
        "AGENTDB_PATH": "./agentdb.db"
      }
    }
  }
}
```

#### Memory Coordination with Claude Flow

```typescript
// Store in coordination memory
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/agent/learning-session",
  namespace: "coordination",
  value: JSON.stringify({
    sessionId: "session-123",
    algorithm: "ppo",
    status: "training",
    metrics: { avgReward: 0.85, successRate: 0.9 }
  })
});

// Retrieve shared patterns
mcp__claude-flow__memory_search({
  pattern: "swarm/*/patterns",
  namespace: "coordination"
});
```

#### Neural Pattern Training

```typescript
// Train coordination patterns with AgentDB data
mcp__claude-flow__neural_train({
  pattern_type: "coordination",
  training_data: JSON.stringify({
    source: "agentdb",
    episodes: episodeIds,
    algorithm: "decision-transformer"
  }),
  epochs: 50
});
```

### Agentic Flow Integration

AgentDB provides the memory layer for Agentic Flow agents:

#### Agent Memory Setup

```typescript
import { AgentDB } from 'agentdb';
import { Agent } from 'agentic-flow';

const db = await AgentDB.create('./agent-memory.db');
const embedder = new EmbeddingService();
await embedder.initialize();

const agent = new Agent({
  memory: {
    reflexion: new ReflexionMemory(db, embedder),
    skills: new SkillLibrary(db, embedder),
    causal: new CausalMemoryGraph(db),
    learning: new LearningSystem(db, embedder)
  }
});
```

#### Skill Transfer Between Agents

```typescript
// Agent A learns a skill
const skillId = await agentA.memory.skills.createSkill({
  name: "API rate limiting",
  description: "Handle rate limits with exponential backoff",
  code: "...",
  successRate: 0.95
});

// Transfer to Agent B via learning_transfer MCP tool
await mcp__agentdb__learning_transfer({
  source_task: "API integration",
  target_task: "Service calls",
  transfer_type: "skills",
  min_similarity: 0.8
});
```

#### Causal Knowledge Sharing

```typescript
// Discover causal patterns across agents
const patterns = await learner.discover({
  minAttempts: 5,
  minConfidence: 0.8
});

// Share via memory coordination
await mcp__claude-flow__memory_usage({
  action: "store",
  key: "shared/causal-patterns",
  value: JSON.stringify(patterns),
  namespace: "coordination"
});
```

### WASM Acceleration

AgentDB uses ReasoningBank WASM for 10-50x speedup:

```typescript
// WASM vector search
const wasmSearch = new WASMVectorSearch(db, {
  enableWASM: true,
  enableSIMD: true,    // Use SIMD when available
  batchSize: 100
});

// Check acceleration status
const stats = wasmSearch.getStats();
// {
//   wasmAvailable: true,
//   simdAvailable: true,
//   indexBuilt: true,
//   indexSize: 50000
// }
```

### Database Synchronization

For multi-agent systems:

```typescript
// QUIC-based synchronization
import { QUICClient, QUICSyncCoordinator } from 'agentdb';

const syncCoord = new QUICSyncCoordinator(db, {
  serverId: "agent-1",
  peers: ["agent-2:8443", "agent-3:8443"]
});

await syncCoord.sync();
```

---

## Database Schema

AgentDB uses SQLite with the following core tables:

### Episodes Table
```sql
CREATE TABLE episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER DEFAULT (strftime('%s', 'now')),
  session_id TEXT NOT NULL,
  task TEXT NOT NULL,
  input TEXT,
  output TEXT,
  critique TEXT,
  reward REAL NOT NULL,
  success INTEGER NOT NULL,
  latency_ms INTEGER,
  tokens_used INTEGER,
  tags TEXT,
  metadata TEXT
);
```

### Skills Table
```sql
CREATE TABLE skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER DEFAULT (strftime('%s', 'now')),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  signature TEXT,
  code TEXT,
  success_rate REAL DEFAULT 0.0,
  uses INTEGER DEFAULT 0,
  avg_reward REAL DEFAULT 0.0,
  avg_latency_ms REAL DEFAULT 0.0,
  tags TEXT,
  metadata TEXT
);
```

### Causal Edges Table
```sql
CREATE TABLE causal_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER DEFAULT (strftime('%s', 'now')),
  from_memory_id INTEGER NOT NULL,
  from_memory_type TEXT NOT NULL,
  to_memory_id INTEGER NOT NULL,
  to_memory_type TEXT NOT NULL,
  similarity REAL DEFAULT 0.0,
  uplift REAL NOT NULL,
  confidence REAL DEFAULT 0.95,
  sample_size INTEGER DEFAULT 0,
  evidence_ids TEXT,
  experiment_ids TEXT,
  confounder_score REAL DEFAULT 0.0,
  mechanism TEXT,
  metadata TEXT
);
```

### Learning Sessions Table
```sql
CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_type TEXT NOT NULL,
  config TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  status TEXT NOT NULL,
  metadata TEXT
);
```

### Reasoning Patterns Table
```sql
CREATE TABLE reasoning_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER DEFAULT (strftime('%s', 'now')),
  task_type TEXT NOT NULL,
  approach TEXT NOT NULL,
  success_rate REAL NOT NULL DEFAULT 0.0,
  uses INTEGER DEFAULT 0,
  avg_reward REAL DEFAULT 0.0,
  tags TEXT,
  metadata TEXT
);
```

---

## Quick Start

### Installation

```bash
npm install agentdb
```

### Basic Usage

```typescript
import {
  createDatabase,
  EmbeddingService,
  ReflexionMemory,
  SkillLibrary,
  LearningSystem
} from 'agentdb';

// Initialize
const db = await createDatabase('./agent-memory.db');
const embedder = new EmbeddingService();
await embedder.initialize();

// Create controllers
const reflexion = new ReflexionMemory(db, embedder);
const skills = new SkillLibrary(db, embedder);
const learning = new LearningSystem(db, embedder);

// Store an episode
const episodeId = await reflexion.storeEpisode({
  sessionId: 'session-1',
  task: 'Implement user authentication',
  input: 'Create JWT-based auth',
  output: 'Auth system with refresh tokens',
  critique: 'Added rate limiting for security',
  reward: 0.9,
  success: true
});

// Start learning session
const sessionId = await learning.startSession(
  'user-1',
  'ppo',
  { learningRate: 0.01, discountFactor: 0.99 }
);

// Get AI recommendation
const prediction = await learning.predict(sessionId, 'Current task state');
console.log(`Recommended: ${prediction.action} (${prediction.confidence * 100}% confidence)`);
```

### MCP Server Usage

```bash
# Start MCP server
npx agentdb-mcp-server

# Or with custom database path
AGENTDB_PATH=./custom.db npx agentdb-mcp-server
```

---

## References

- **Reflexion Paper**: [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)
- **Voyager Paper**: [Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/abs/2305.16291)
- **Pearl's Causality**: [Causality: Models, Reasoning, and Inference](https://www.cambridge.org/core/books/causality/B0046844FAE10CBF274D4ACBDAEB5F5B)
- **HNSW Algorithm**: [Efficient and Robust Approximate Nearest Neighbor Search](https://arxiv.org/abs/1603.09320)
- **Decision Transformer**: [Decision Transformer: Reinforcement Learning via Sequence Modeling](https://arxiv.org/abs/2106.01345)
- **PPO**: [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347)

---

*Generated: December 28, 2025*
*AgentDB Version: 1.6.1*
