Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:21:15 EST

# Episodic & Semantic Memory Architectures

## Complete Reference for AgentDB Memory Systems

**Version:** 2.0.0
**Last Updated:** December 2025

---

## Table of Contents

1. [Memory Architecture Overview](#memory-architecture-overview)
2. [Episodic Memory System](#episodic-memory-system)
3. [Semantic Memory System](#semantic-memory-system)
4. [Working Memory Integration](#working-memory-integration)
5. [Memory Consolidation](#memory-consolidation)
6. [RuVector Persistence Patterns](#ruvector-persistence-patterns)
7. [Configuration Reference](#configuration-reference)

---

## Memory Architecture Overview

### Human-Inspired Memory Model

AgentDB implements a cognitive memory architecture inspired by human memory systems:

```
┌─────────────────────────────────────────────────────────────┐
│                    COGNITIVE MEMORY                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 WORKING MEMORY                        │  │
│  │  (Active context, current task, attention focus)      │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│         ┌─────────────────┴─────────────────┐              │
│         ▼                                   ▼              │
│  ┌──────────────────┐            ┌──────────────────┐     │
│  │  EPISODIC MEMORY │            │  SEMANTIC MEMORY │     │
│  │                  │            │                  │     │
│  │  • Experiences   │◄──────────►│  • Facts         │     │
│  │  • Events        │ Consol-    │  • Concepts      │     │
│  │  • Context       │ idation    │  • Relationships │     │
│  │  • Timestamps    │            │  • Skills        │     │
│  └────────┬─────────┘            └────────┬─────────┘     │
│           │                                │               │
│           └────────────────┬───────────────┘               │
│                            ▼                               │
│                 ┌──────────────────┐                      │
│                 │  LONG-TERM STORE │                      │
│                 │   (RuVector)     │                      │
│                 └──────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Memory Types Comparison

| Aspect | Episodic Memory | Semantic Memory | Working Memory |
|--------|-----------------|-----------------|----------------|
| **Content** | Experiences, events | Facts, concepts | Active context |
| **Temporal** | Time-stamped | Atemporal | Current moment |
| **Organization** | Sequential | Hierarchical | Attention-based |
| **Retrieval** | Context-driven | Concept-driven | Immediate access |
| **Persistence** | Long-term | Long-term | Short-term |
| **Capacity** | Unlimited | Unlimited | Limited (~7 items) |

---

## Episodic Memory System

### What is Episodic Memory?

Episodic memory stores specific experiences and events with their contextual details (when, where, what happened). In AgentDB, this enables agents to learn from past actions and outcomes.

### Episodic Memory Schema

```typescript
interface Episode {
  id: number;
  sessionId: string;
  timestamp: Date;

  // Event details
  task: string;
  action: string;
  outcome: string;

  // Context
  context: {
    environment: Record<string, any>;
    priorState: string;
    postState: string;
  };

  // Evaluation
  reward: number;
  success: boolean;
  critique?: string;

  // Relationships
  parentEpisodeId?: number;
  relatedEpisodeIds?: number[];

  // Vector representation
  embedding: number[];
}
```

### ReflexionMemory Implementation

```typescript
import { ReflexionMemory } from 'agentdb/controllers';

// Initialize episodic memory
const reflexion = new ReflexionMemory(db, embedder, {
  maxEpisodes: 10000,
  similarityThreshold: 0.7,
  recencyWeight: 0.3
});

// Store an episode
const episodeId = await reflexion.storeEpisode({
  sessionId: 'coding-session-123',
  task: 'Fix authentication bug',
  action: 'Modified JWT validation logic',
  outcome: 'Tests passing, bug resolved',
  reward: 0.95,
  success: true,
  critique: 'Could have added more edge case tests'
});

// Recall similar experiences
const similar = await reflexion.recallSimilar({
  query: 'authentication error handling',
  k: 5,
  filters: {
    success: true,
    minReward: 0.8
  }
});

// Recall by temporal context
const recent = await reflexion.recallRecent({
  sessionId: 'coding-session-123',
  limit: 10,
  since: new Date(Date.now() - 3600000) // Last hour
});

// Generate reflection
const reflection = await reflexion.reflect({
  episodes: similar,
  task: 'Handle new auth bug',
  generateInsights: true
});
```

### Episodic Memory Patterns

#### Pattern 1: Experience Replay

```typescript
// Store experiences for later learning
class ExperienceBuffer {
  private reflexion: ReflexionMemory;

  async addExperience(exp: Experience) {
    await this.reflexion.storeEpisode({
      sessionId: exp.agentId,
      task: exp.task,
      action: JSON.stringify(exp.action),
      outcome: exp.result,
      reward: exp.reward,
      success: exp.success
    });
  }

  async sampleBatch(size: number): Promise<Episode[]> {
    // Prioritized experience replay
    return this.reflexion.recallSimilar({
      query: 'high value experiences',
      k: size,
      filters: { minReward: 0.5 },
      sortBy: 'reward',
      sortOrder: 'desc'
    });
  }
}
```

#### Pattern 2: Temporal Context Window

```typescript
// Maintain sliding window of recent episodes
class TemporalContext {
  private windowSize: number = 10;
  private reflexion: ReflexionMemory;

  async getContext(sessionId: string): Promise<Episode[]> {
    return this.reflexion.recallRecent({
      sessionId,
      limit: this.windowSize,
      includeContext: true
    });
  }

  async buildNarrative(sessionId: string): Promise<string> {
    const episodes = await this.getContext(sessionId);
    return episodes.map(e =>
      `[${e.timestamp}] ${e.task}: ${e.outcome}`
    ).join('
');
  }
}
```

---

## Semantic Memory System

### What is Semantic Memory?

Semantic memory stores general knowledge, facts, and concepts without specific temporal context. In AgentDB, this enables agents to accumulate and retrieve knowledge across sessions.

### Semantic Memory Schema

```typescript
interface SemanticNode {
  id: number;
  type: 'concept' | 'fact' | 'skill' | 'note';

  // Content
  content: string;
  title?: string;

  // Categorization
  category: string;
  tags: string[];

  // Relationships
  relationships: {
    nodeId: number;
    type: 'is_a' | 'part_of' | 'related_to' | 'causes' | 'enables';
    strength: number;
  }[];

  // Metadata
  confidence: number;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;

  // Vector representation
  embedding: number[];
}
```

### Semantic Memory Implementation

```typescript
import { SemanticMemory } from 'agentdb/controllers';

// Initialize semantic memory
const semantic = new SemanticMemory(db, embedder, {
  maxNodes: 100000,
  consolidationThreshold: 0.85,
  decayFactor: 0.99
});

// Store a fact
const factId = await semantic.storeFact({
  content: 'RuVector uses HNSW indexing for O(log n) similarity search',
  category: 'database',
  tags: ['ruvector', 'hnsw', 'vector-search'],
  confidence: 0.95,
  source: 'documentation'
});

// Store a concept
const conceptId = await semantic.storeConcept({
  title: 'Vector Database',
  content: 'A database optimized for storing and querying high-dimensional vectors',
  category: 'technology',
  relationships: [
    { nodeId: factId, type: 'related_to', strength: 0.9 }
  ]
});

// Query semantic memory
const knowledge = await semantic.query({
  question: 'How does RuVector perform similarity search?',
  k: 5,
  includeRelated: true
});

// Get concept hierarchy
const hierarchy = await semantic.getHierarchy({
  rootConcept: 'database',
  depth: 3
});
```

### Semantic Memory Patterns

#### Pattern 1: Knowledge Graph Building

```typescript
class KnowledgeGraphBuilder {
  private semantic: SemanticMemory;

  async addKnowledge(knowledge: KnowledgeItem) {
    // Extract entities
    const entities = await this.extractEntities(knowledge.text);

    // Store each entity as a concept
    for (const entity of entities) {
      const nodeId = await this.semantic.storeConcept({
        title: entity.name,
        content: entity.description,
        category: entity.type
      });

      // Create relationships
      for (const rel of entity.relationships) {
        await this.semantic.createRelationship({
          fromId: nodeId,
          toId: rel.targetId,
          type: rel.type,
          strength: rel.confidence
        });
      }
    }
  }

  async queryGraph(question: string): Promise<KnowledgeResponse> {
    // Vector search + graph traversal
    const seeds = await this.semantic.query({ question, k: 3 });

    // Expand via relationships
    const expanded = await this.semantic.expandNodes({
      nodeIds: seeds.map(s => s.id),
      maxHops: 2,
      minStrength: 0.5
    });

    return this.synthesizeAnswer(question, expanded);
  }
}
```

#### Pattern 2: Skill Library

```typescript
class SkillLibrary {
  private semantic: SemanticMemory;

  async registerSkill(skill: Skill) {
    await this.semantic.storeSkill({
      title: skill.name,
      content: skill.description,
      category: 'skill',
      tags: skill.tags,
      metadata: {
        parameters: skill.parameters,
        examples: skill.examples,
        prerequisites: skill.prerequisites
      }
    });
  }

  async findSkill(task: string): Promise<Skill | null> {
    const matches = await this.semantic.query({
      question: task,
      k: 1,
      filters: { type: 'skill' }
    });

    return matches[0] || null;
  }

  async getSkillChain(goal: string): Promise<Skill[]> {
    // Find goal skill
    const goalSkill = await this.findSkill(goal);
    if (!goalSkill) return [];

    // Recursively get prerequisites
    return this.getPrerequisiteChain(goalSkill);
  }
}
```

---

## Working Memory Integration

### Working Memory Architecture

```typescript
interface WorkingMemory {
  // Capacity-limited active buffer
  activeItems: WorkingMemoryItem[];
  maxCapacity: number;  // ~7 items

  // Attention mechanism
  attention: {
    focus: string;
    relevanceScores: Map<string, number>;
  };

  // Context bindings
  context: {
    currentTask: string;
    environment: Record<string, any>;
    goals: string[];
  };
}

class WorkingMemoryController {
  private maxCapacity = 7;
  private activeItems: WorkingMemoryItem[] = [];

  // Add item to working memory
  async attend(item: MemoryItem): Promise<void> {
    if (this.activeItems.length >= this.maxCapacity) {
      // Remove least relevant item
      this.evictLeastRelevant();
    }
    this.activeItems.push({
      ...item,
      activatedAt: Date.now(),
      relevance: 1.0
    });
  }

  // Retrieve from long-term memory to working memory
  async retrieve(query: string, episodic: ReflexionMemory, semantic: SemanticMemory): Promise<void> {
    // Get episodic memories
    const episodes = await episodic.recallSimilar({ query, k: 3 });

    // Get semantic knowledge
    const knowledge = await semantic.query({ question: query, k: 3 });

    // Load most relevant into working memory
    for (const item of [...episodes, ...knowledge].slice(0, this.maxCapacity)) {
      await this.attend(item);
    }
  }

  // Decay relevance over time
  decay(): void {
    const now = Date.now();
    for (const item of this.activeItems) {
      const age = now - item.activatedAt;
      item.relevance *= Math.exp(-age / 60000); // Decay over 1 minute
    }
  }
}
```

---

## Memory Consolidation

### Consolidation Process

Memory consolidation transfers important information from episodic to semantic memory, creating lasting knowledge from experiences.

```typescript
class MemoryConsolidator {
  private episodic: ReflexionMemory;
  private semantic: SemanticMemory;

  async consolidate(config: ConsolidationConfig): Promise<ConsolidationResult> {
    // Get episodes ready for consolidation
    const episodes = await this.episodic.recallForConsolidation({
      minAge: config.minAge,          // e.g., 24 hours
      minReward: config.minReward,    // e.g., 0.7
      minSimilarity: config.minSimilarity  // e.g., 0.8
    });

    // Cluster similar episodes
    const clusters = await this.clusterEpisodes(episodes);

    // Extract patterns from each cluster
    for (const cluster of clusters) {
      const pattern = await this.extractPattern(cluster);

      // Store as semantic knowledge
      await this.semantic.storeFact({
        content: pattern.insight,
        category: 'learned-pattern',
        tags: pattern.tags,
        confidence: pattern.confidence,
        source: 'consolidation'
      });
    }

    return { consolidated: clusters.length };
  }

  // Extract generalizable pattern from episode cluster
  private async extractPattern(episodes: Episode[]): Promise<Pattern> {
    // Find common elements
    const commonTask = this.findCommonPattern(episodes.map(e => e.task));
    const commonAction = this.findCommonPattern(episodes.map(e => e.action));
    const avgReward = episodes.reduce((s, e) => s + e.reward, 0) / episodes.length;

    return {
      insight: `When ${commonTask}, doing ${commonAction} leads to success`,
      tags: this.extractTags(episodes),
      confidence: avgReward
    };
  }
}
```

### EWC (Elastic Weight Consolidation)

Prevents catastrophic forgetting when learning new tasks:

```typescript
import { EWCConsolidation } from 'agentdb/controllers';

const ewc = new EWCConsolidation({
  importance: 1000,        // Fisher information weight
  onlineMode: true,        // Continuous consolidation
  samplesForFisher: 1000   // Samples to estimate importance
});

// Consolidate after learning a task
await ewc.consolidate(model, taskData);

// Continue learning with regularization
const loss = originalLoss + ewc.penalty(model);
```

---

## RuVector Persistence Patterns

### Persisting Memory to RuVector

```typescript
class PersistentMemoryStore {
  private ruvector: RuvectorStore;

  constructor() {
    this.ruvector = new RuvectorStore({
      dimension: 768,
      persistence: {
        enabled: true,
        path: '.ruvector/memory',
        wal: true
      }
    });
  }

  // Store episodic memory
  async storeEpisode(episode: Episode): Promise<void> {
    await this.ruvector.insert({
      id: `episode-${episode.id}`,
      vector: episode.embedding,
      metadata: {
        type: 'episode',
        sessionId: episode.sessionId,
        task: episode.task,
        reward: episode.reward,
        timestamp: episode.timestamp.toISOString()
      }
    });
  }

  // Store semantic memory
  async storeSemantic(node: SemanticNode): Promise<void> {
    await this.ruvector.insert({
      id: `semantic-${node.id}`,
      vector: node.embedding,
      metadata: {
        type: node.type,
        category: node.category,
        content: node.content,
        confidence: node.confidence
      }
    });
  }

  // Unified search across memory types
  async search(query: string, options: SearchOptions): Promise<MemoryItem[]> {
    const embedding = await this.embed(query);

    const results = await this.ruvector.search({
      vector: embedding,
      k: options.k || 10,
      threshold: options.threshold || 0.5,
      filter: options.type ? { type: options.type } : undefined
    });

    return results.map(r => ({
      ...r.metadata,
      score: r.score
    }));
  }
}
```

---

## Configuration Reference

### Complete Memory Configuration

```javascript
module.exports = {
  memory: {
    // Episodic memory settings
    episodic: {
      maxEpisodes: 10000,
      similarityThreshold: 0.7,
      recencyWeight: 0.3,
      consolidationAge: 86400000,  // 24 hours
      consolidationThreshold: 0.8
    },

    // Semantic memory settings
    semantic: {
      maxNodes: 100000,
      consolidationThreshold: 0.85,
      decayFactor: 0.99,
      relationshipThreshold: 0.7
    },

    // Working memory settings
    working: {
      maxCapacity: 7,
      decayRate: 0.001,
      retrievalK: 3
    },

    // Consolidation settings
    consolidation: {
      enabled: true,
      schedule: 'daily',
      ewcImportance: 1000,
      minClusterSize: 3
    },

    // Persistence settings
    persistence: {
      enabled: true,
      path: '.ruvector/memory',
      wal: true,
      autoSave: true,
      saveInterval: 30000
    }
  }
};
```

### Environment Variables

```bash
# Episodic Memory
EPISODIC_MAX_EPISODES=10000
EPISODIC_SIMILARITY_THRESHOLD=0.7
EPISODIC_RECENCY_WEIGHT=0.3

# Semantic Memory
SEMANTIC_MAX_NODES=100000
SEMANTIC_DECAY_FACTOR=0.99

# Working Memory
WORKING_MEMORY_CAPACITY=7
WORKING_MEMORY_DECAY_RATE=0.001

# Consolidation
CONSOLIDATION_ENABLED=true
CONSOLIDATION_SCHEDULE=daily
EWC_IMPORTANCE=1000

# Persistence
MEMORY_PERSISTENCE_ENABLED=true
MEMORY_PERSISTENCE_PATH=.ruvector/memory
MEMORY_WAL_ENABLED=true
```

---

*Document generated for RuVector Knowledge Base - December 2025*
