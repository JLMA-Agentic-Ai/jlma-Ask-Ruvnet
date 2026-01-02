Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:41:48 EST

# Experience Replay in AgentDB

## Overview

Experience replay enables agents to learn from past experiences by storing and sampling from a buffer of previous interactions. This breaks temporal correlation in learning, improves sample efficiency, and enables offline learning from historical data.

## Why Experience Replay?

### The Problem with Online Learning

```
Online Learning:
State 1 → State 2 → State 3 → State 4 → State 5
  ↓         ↓         ↓         ↓         ↓
Learn    Learn     Learn     Learn     Learn

Problems:
- Correlated samples (state 3 similar to state 4)
- Catastrophic forgetting (forgets early states)
- Sample inefficient (each experience used once)
```

### Experience Replay Solution

```
Experience Replay:
       ┌─────────────────────────────────┐
       │      REPLAY BUFFER              │
       │  ┌───┬───┬───┬───┬───┬───┬───┐ │
       │  │ 5 │ 2 │ 8 │ 1 │ 4 │ 7 │ 3 │ │
       │  └───┴───┴───┴───┴───┴───┴───┘ │
       └───────────────┬─────────────────┘
                       │ Random Sample
                       ▼
              ┌────────────────┐
              │  Mini-batch    │
              │  [8, 2, 5, 1]  │
              └────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │    LEARN       │
              │  (Decorrelated)│
              └────────────────┘
```

## Implementation in AgentDB

### Basic Configuration

```javascript
const { AgentDB } = require('agentdb');

const agent = new AgentDB({
  learning: {
    experienceReplay: {
      enabled: true,
      bufferSize: 100000,    // Max experiences to store
      batchSize: 32,         // Samples per training step
      minSamples: 1000,      // Min experiences before training
      storage: 'ruvector'    // Use RuVector for storage
    }
  }
});
```

### Storing Experiences

```javascript
// Store experience after each interaction
await agent.storeExperience({
  state: currentState,       // Observation
  action: actionTaken,       // What agent did
  reward: receivedReward,    // Feedback
  nextState: newState,       // Resulting state
  done: episodeEnded,        // Terminal flag
  info: {                    // Optional metadata
    timestamp: Date.now(),
    confidence: 0.8
  }
});
```

### Sampling Strategies

```javascript
// Uniform random sampling (default)
const batch = await agent.sampleExperiences({
  count: 32,
  strategy: 'uniform'
});

// Prioritized experience replay (PER)
const prioritizedBatch = await agent.sampleExperiences({
  count: 32,
  strategy: 'prioritized',
  alpha: 0.6,  // Priority exponent
  beta: 0.4    // Importance sampling correction
});

// Stratified sampling
const stratifiedBatch = await agent.sampleExperiences({
  count: 32,
  strategy: 'stratified',
  strata: {
    positive: 0.5,   // 50% positive rewards
    negative: 0.3,   // 30% negative rewards
    neutral: 0.2     // 20% neutral
  }
});
```

## Prioritized Experience Replay (PER)

### Priority Calculation

```javascript
// Priority based on TD-error
const agent = new AgentDB({
  learning: {
    experienceReplay: {
      strategy: 'prioritized',
      priority: {
        metric: 'td_error',     // |target - prediction|
        alpha: 0.6,             // Priority exponent (0-1)
        beta: 0.4,              // IS correction start
        betaGrowth: 0.001,      // Increase beta over time
        maxPriority: 1.0        // Clamp priority
      }
    }
  }
});

// Sampling probability: P(i) = p_i^α / Σ p_k^α
// Importance sampling weight: w_i = (N * P(i))^(-β) / max(w)
```

### Priority Update

```javascript
// After training, update priorities based on TD-errors
await agent.updatePriorities(batch, tdErrors);

// Or with automatic tracking
agent.on('trainStep', async (result) => {
  await agent.updatePriorities(result.batch, result.tdErrors);
});
```

## Buffer Types

### Circular Buffer (Default)

```javascript
// FIFO replacement when full
const agent = new AgentDB({
  learning: {
    experienceReplay: {
      bufferType: 'circular',
      bufferSize: 100000
    }
  }
});

// When buffer full, oldest experiences removed
```

### Reservoir Sampling

```javascript
// Uniform probability of keeping any experience
const agent = new AgentDB({
  learning: {
    experienceReplay: {
      bufferType: 'reservoir',
      bufferSize: 100000
    }
  }
});

// Good for: Unbiased sampling from streams
```

### Prioritized Replacement

```javascript
// Remove lowest priority experiences
const agent = new AgentDB({
  learning: {
    experienceReplay: {
      bufferType: 'prioritized_replacement',
      bufferSize: 100000,
      minPriority: 0.01  // Remove below this
    }
  }
});
```

## Hindsight Experience Replay (HER)

### Goal-Conditioned Learning

```javascript
// Learn from failures by relabeling goals
const agent = new AgentDB({
  learning: {
    experienceReplay: {
      her: {
        enabled: true,
        strategy: 'future',  // 'final', 'episode', or 'random'
        k: 4                 // Relabel with k alternative goals
      }
    }
  }
});

// Original: state → goal (failed to reach)
// Relabeled: state → achieved_state (success!)
```

### HER Strategies

```javascript
// 'final' - Use final achieved state as goal
// 'future' - Use k random future states as goals
// 'episode' - Use k random states from episode as goals
// 'random' - Use k random states from buffer as goals
```

## Multi-Step Returns

### N-Step Experience Storage

```javascript
const agent = new AgentDB({
  learning: {
    experienceReplay: {
      nStep: 3,              // 3-step returns
      gamma: 0.99            // Discount factor
    }
  }
});

// Stores: (s_t, a_t, R_{t:t+n}, s_{t+n})
// Where R_{t:t+n} = r_t + γ*r_{t+1} + γ²*r_{t+2}
```

## Distributed Experience Replay

### Shared Buffer Across Workers

```javascript
const { DistributedReplayBuffer } = require('agentdb/distributed');

const sharedBuffer = new DistributedReplayBuffer({
  workers: 8,
  bufferSize: 1000000,
  backend: 'redis',  // or 'ruvector'
  sharding: 'consistent_hash'
});

// Each worker contributes and samples
const worker = new AgentDB({
  learning: {
    experienceReplay: {
      buffer: sharedBuffer
    }
  }
});
```

### Actor-Learner Separation

```javascript
// Actors collect experiences
const actor = new AgentDB({ role: 'actor' });
await actor.collectExperiences(environment);

// Learner trains from shared buffer
const learner = new AgentDB({ role: 'learner' });
await learner.trainFromBuffer({
  updateFrequency: 100,
  batchSize: 256
});
```

## Tiered Buffer Storage

### Hot-Warm-Cold Experiences

```javascript
const agent = new AgentDB({
  learning: {
    experienceReplay: {
      tiered: {
        hot: {
          size: 10000,
          priority: 'recent'  // Most recent
        },
        warm: {
          size: 90000,
          priority: 'high_td_error'
        },
        cold: {
          size: 'unlimited',
          storage: 'disk',
          compression: 'zstd'
        }
      }
    }
  }
});

// Sampling weights by tier
const batch = await agent.sampleExperiences({
  tierWeights: { hot: 0.5, warm: 0.4, cold: 0.1 }
});
```

## Metrics and Analytics

```javascript
// Buffer statistics
const stats = await agent.getReplayStats();
console.log(stats);
// {
//   size: 85000,
//   capacity: 100000,
//   utilization: 0.85,
//   avgPriority: 0.42,
//   priorityDistribution: {...},
//   samplesSinceReset: 150000,
//   avgRewardInBuffer: 0.23
// }

// Sample efficiency
const efficiency = agent.getSampleEfficiency();
// {
//   totalExperiences: 100000,
//   uniqueExperiences: 85000,
//   avgReplayCount: 3.2,  // Each experience used 3.2x
//   effectiveSampleSize: 272000
// }
```

## Best Practices

1. **Buffer size 10-100x episode length** for good coverage
2. **Use PER for sparse rewards** to prioritize rare successes
3. **Enable HER for goal-conditioned** tasks with frequent failures
4. **Start with uniform sampling** before adding complexity
5. **Monitor priority distribution** to detect staleness
6. **Use tiered storage** for very large buffers
7. **Update priorities after training** to maintain relevance

## Integration with Other Features

### EWC + Experience Replay

```javascript
// Protect old knowledge while learning from replay
const agent = new AgentDB({
  learning: {
    experienceReplay: { enabled: true },
    ewc: {
      enabled: true,
      replayForFisher: true  // Use replay for Fisher estimation
    }
  }
});
```

### Episodic Memory Link

```javascript
// Replay particularly memorable episodes
const memorableEpisodes = await agent.memory.recallEpisodes({
  importance: { $gt: 0.8 }
});

await agent.addToReplayBuffer(memorableEpisodes);
```

## Related Features

- **Episodic Memory**: Stores meaningful experiences
- **EWC Consolidation**: Prevents forgetting during replay
- **Knowledge Distillation**: Compress replay buffer
- **Federated Learning**: Distributed experience collection
