Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:39:55 EST

# Episodic Memory in AgentDB

## Overview

Episodic memory stores specific experiences, events, and interactions with their temporal and contextual details. Unlike semantic memory which stores facts, episodic memory captures "what happened, when, and where" - enabling agents to learn from experience, recall past interactions, and make decisions based on personal history.

## Episodic vs Semantic Memory

```
┌─────────────────────────────────────────────────────────────────┐
│                      MEMORY SYSTEMS                              │
├─────────────────────────────┬───────────────────────────────────┤
│      EPISODIC MEMORY        │        SEMANTIC MEMORY            │
├─────────────────────────────┼───────────────────────────────────┤
│ • Specific experiences      │ • General knowledge              │
│ • Time-stamped events       │ • Facts without context          │
│ • Personal context          │ • Universal truths               │
│ • "I saw a cat yesterday"   │ • "Cats are mammals"             │
│ • First-person perspective  │ • Third-person perspective       │
│ • Decays over time          │ • More stable                    │
└─────────────────────────────┴───────────────────────────────────┘
```

## Implementation in AgentDB

### Configuration

```javascript
const { AgentDB } = require('agentdb');

const agent = new AgentDB({
  memory: {
    episodic: {
      enabled: true,
      capacity: 100000,          // Max episodes to store
      embeddingDimensions: 128,  // Vector size for similarity
      temporalDecay: {
        enabled: true,
        halfLife: 86400000 * 7   // 7-day half-life
      },
      consolidation: {
        enabled: true,
        threshold: 0.8,          // Consolidate if similarity > 0.8
        interval: 3600000        // Check every hour
      }
    }
  }
});
```

### Storing Episodes

```javascript
// Store an interaction episode
await agent.memory.storeEpisode({
  type: 'interaction',
  content: {
    userQuery: "What's the weather like?",
    agentResponse: "It's sunny and 72°F in San Francisco.",
    outcome: 'helpful'
  },
  context: {
    userId: 'user_123',
    location: 'San Francisco',
    timestamp: Date.now(),
    sessionId: 'session_abc'
  },
  emotions: {
    valence: 0.7,      // Positive
    arousal: 0.3,      // Calm
    dominance: 0.5     // Neutral control
  }
});
```

### Episode Structure

```javascript
// Full episode schema
const episode = {
  id: 'ep_uuid',
  type: 'interaction',  // or 'observation', 'action', 'reflection'

  // Core content
  content: {
    situation: "User asked about weather",
    action: "Looked up current conditions",
    result: "Provided accurate weather info",
    outcome: "User thanked me"
  },

  // Temporal information
  temporal: {
    timestamp: 1703836800000,
    duration: 2500,  // ms
    sequence: 42     // Episode number in session
  },

  // Contextual embedding
  embedding: Float32Array(128),

  // Associated entities
  entities: ['user_123', 'weather_api', 'san_francisco'],

  // Emotional markers
  emotions: { valence: 0.7, arousal: 0.3, dominance: 0.5 },

  // Importance score (for retrieval priority)
  importance: 0.75,

  // Links to related episodes
  links: ['ep_previous', 'ep_similar']
};
```

## Retrieval

### Similarity-Based Retrieval

```javascript
// Retrieve similar past experiences
const relevantEpisodes = await agent.memory.recallEpisodes({
  query: "How did I handle weather questions before?",
  limit: 5,
  minSimilarity: 0.7,
  temporalWeight: 0.3  // Weight recent episodes more
});

// Returns episodes with similarity scores
// [{ episode: {...}, similarity: 0.92, recency: 0.85 }, ...]
```

### Temporal Queries

```javascript
// Recall recent episodes
const recentEpisodes = await agent.memory.recallEpisodes({
  timeRange: {
    from: Date.now() - 3600000,  // Last hour
    to: Date.now()
  },
  limit: 20
});

// Recall episodes from specific session
const sessionEpisodes = await agent.memory.recallEpisodes({
  filter: { sessionId: 'session_abc' },
  orderBy: 'sequence'
});
```

### Contextual Retrieval

```javascript
// Retrieve by context
const userEpisodes = await agent.memory.recallEpisodes({
  filter: {
    'context.userId': 'user_123',
    'outcome': 'helpful'
  },
  limit: 10
});

// Combine multiple retrieval strategies
const episodes = await agent.memory.recallEpisodes({
  query: "error handling",        // Semantic similarity
  filter: { type: 'action' },     // Filter by type
  timeRange: { from: lastWeek },  // Temporal filter
  minImportance: 0.5              // Importance threshold
});
```

## Memory Consolidation

### Automatic Consolidation

```javascript
// Similar episodes are consolidated over time
agent.on('consolidation', (event) => {
  console.log(`Consolidated ${event.sourceCount} episodes into ${event.targetCount}`);
  console.log(`Common patterns: ${event.patterns.join(', ')}`);
});

// Trigger manual consolidation
await agent.memory.consolidate({
  similarityThreshold: 0.85,
  preserveDetails: false,  // Keep only essential info
  createSummary: true      // Generate consolidated summary
});
```

### Episode Generalization

```javascript
// Extract patterns from episodes
const patterns = await agent.memory.extractPatterns({
  episodes: recentEpisodes,
  minSupport: 3,  // Pattern must appear in 3+ episodes
  maxPatterns: 10
});

// Patterns can be promoted to semantic memory
for (const pattern of patterns) {
  await agent.memory.promoteToSemantic({
    content: pattern.description,
    source: 'episodic_consolidation',
    confidence: pattern.support / recentEpisodes.length
  });
}
```

## Temporal Decay

### Forgetting Curve

```javascript
// Importance decays over time (Ebbinghaus curve)
const decayedImportance = originalImportance * Math.pow(0.5, age / halfLife);

// Retrieve with temporal weighting
const episodes = await agent.memory.recallEpisodes({
  query: "previous errors",
  scoring: {
    semantic: 0.5,   // 50% weight on content similarity
    temporal: 0.3,   // 30% weight on recency
    importance: 0.2  // 20% weight on original importance
  }
});
```

### Selective Retention

```javascript
// Important episodes decay slower
const episode = {
  content: { ... },
  importance: 0.95,  // High importance
  retention: {
    protected: true,  // Won't be auto-deleted
    reviewSchedule: 'spaced'  // Spaced repetition for retention
  }
};

// Replay important episodes to prevent forgetting
await agent.memory.replayEpisodes({
  filter: { importance: { $gt: 0.8 } },
  replayStrength: 0.5  // Boost retention by 50%
});
```

## Experience Replay

### For Reinforcement Learning

```javascript
// Sample episodes for training
const batch = await agent.memory.sampleEpisodes({
  count: 32,
  strategy: 'prioritized',  // Prioritize high-reward episodes
  includeNegative: true     // Include failure cases
});

// Update policy based on past experiences
await agent.train({
  data: batch,
  method: 'experience_replay'
});
```

### Counterfactual Replay

```javascript
// Generate "what if" variations
const counterfactuals = await agent.memory.generateCounterfactuals({
  episode: originalEpisode,
  variations: [
    { action: 'alternative_action_1' },
    { action: 'alternative_action_2' }
  ],
  predict: true  // Predict outcomes
});
```

## Integration with Other Systems

### Semantic Memory Link

```javascript
// Episodes can reference semantic knowledge
const episode = {
  content: { situation: "User asked about cats" },
  semanticReferences: ['cats_are_mammals', 'cats_behavior']
};

// Retrieve with semantic enrichment
const enrichedEpisode = await agent.memory.enrichEpisode(episode, {
  includeSemantic: true,
  maxSemanticDepth: 2
});
```

### Working Memory Integration

```javascript
// Load relevant episodes into working memory
await agent.workingMemory.load({
  episodes: await agent.memory.recallEpisodes({
    query: currentContext,
    limit: 5
  }),
  maxTokens: 2000  // Limit context size
});
```

## Metrics and Analytics

```javascript
// Memory statistics
const stats = await agent.memory.getStats();
console.log(stats);
// {
//   episodeCount: 50000,
//   averageImportance: 0.62,
//   oldestEpisode: timestamp,
//   consolidationRate: 0.15,
//   retrievalLatency: '5ms'
// }

// Episode distribution
const distribution = await agent.memory.getDistribution({
  groupBy: 'type',
  timeRange: { from: lastMonth }
});
```

## Best Practices

1. **Set appropriate capacity limits** to prevent unbounded growth
2. **Use importance scoring** to retain valuable experiences
3. **Enable consolidation** to extract patterns and save space
4. **Combine retrieval strategies** for best recall
5. **Link to semantic memory** for enriched context
6. **Regular replay** of important episodes for retention
7. **Monitor decay rates** and adjust half-life as needed

## Use Cases

- **Conversational agents**: Remember past user interactions
- **Learning agents**: Build on previous experiences
- **Diagnostic agents**: Recall similar past issues
- **Personal assistants**: Remember user preferences and history
- **Game AI**: Learn from previous game sessions

## Related Features

- **Semantic Memory**: Factual knowledge storage
- **Experience Replay**: RL training from episodes
- **EWC Consolidation**: Prevent catastrophic forgetting
- **Knowledge Distillation**: Extract patterns from episodes
