Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:21:12 EST

# Decision Transformer & Actor-Critic Algorithms

## Reinforcement Learning for Agentic Systems

**Version:** 2.0.0
**Last Updated:** December 2025

---

## Table of Contents

1. [Decision Transformer Overview](#decision-transformer-overview)
2. [Actor-Critic Architecture](#actor-critic-architecture)
3. [Integration with AgentDB](#integration-with-agentdb)
4. [Implementation Patterns](#implementation-patterns)
5. [Configuration Reference](#configuration-reference)

---

## Decision Transformer Overview

### What is Decision Transformer?

Decision Transformer reframes reinforcement learning as a sequence modeling problem. Instead of learning value functions or policy gradients, it uses transformer architecture to predict actions conditioned on desired returns.

### Key Innovation

```
Traditional RL: State → Policy → Action → Reward
Decision Transformer: (Return, State, Action) Sequence → Next Action
```

### Decision Transformer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DECISION TRANSFORMER                        │
│                                                             │
│  Input Sequence:                                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Return₁ │ │ State₁  │ │ Action₁ │ │ Return₂ │ ...      │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       │           │           │           │                │
│       ▼           ▼           ▼           ▼                │
│  ┌─────────────────────────────────────────────┐          │
│  │          Transformer Encoder               │          │
│  │  (Causal Self-Attention + FFN layers)      │          │
│  └─────────────────────────────────────────────┘          │
│                          │                                 │
│                          ▼                                 │
│                   ┌──────────────┐                        │
│                   │ Action Head  │                        │
│                   └──────────────┘                        │
│                          │                                 │
│                          ▼                                 │
│                   Predicted Action                         │
└─────────────────────────────────────────────────────────────┘
```

### Decision Transformer in AgentDB

AgentDB implements Decision Transformer through the learning plugins system:

```typescript
import { DecisionTransformerPlugin } from 'agentdb/learning';

const dtPlugin = new DecisionTransformerPlugin({
  contextLength: 20,           // Sequence length
  embeddingDim: 128,           // Hidden dimension
  numHeads: 4,                 // Attention heads
  numLayers: 3,                // Transformer layers
  returnScale: 100,            // Normalize returns
  actionSpace: 'discrete',     // or 'continuous'
  targetReturn: 0.9            // Desired return for inference
});

// Train from trajectory data
await dtPlugin.train(trajectories, {
  epochs: 100,
  batchSize: 64,
  learningRate: 0.0001
});

// Inference: predict action given desired return
const action = await dtPlugin.predict({
  targetReturn: 0.95,
  states: recentStates,
  actions: recentActions
});
```

### Decision Transformer Configuration

```javascript
const dtConfig = {
  // Model architecture
  architecture: {
    type: 'gpt2',              // Transformer variant
    contextLength: 20,
    embeddingDim: 128,
    numHeads: 4,
    numLayers: 3,
    dropout: 0.1
  },

  // Training settings
  training: {
    epochs: 100,
    batchSize: 64,
    learningRate: 1e-4,
    weightDecay: 1e-4,
    warmupSteps: 1000,
    gradientClipping: 1.0
  },

  // Return conditioning
  returnConditioning: {
    scale: 100,                // Normalize returns to [-1, 1]
    targetReturn: 0.9,         // Default target for inference
    returnToGo: true           // Use return-to-go vs total return
  },

  // State/action encoding
  encoding: {
    stateEncoder: 'mlp',       // or 'cnn', 'transformer'
    actionEncoder: 'embedding', // or 'mlp' for continuous
    positionEncoding: 'learned' // or 'sinusoidal'
  }
};
```

---

## Actor-Critic Architecture

### What is Actor-Critic?

Actor-Critic combines policy gradient (actor) with value function approximation (critic). The actor learns the policy, while the critic evaluates actions to reduce variance.

### Actor-Critic Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ACTOR-CRITIC                             │
│                                                             │
│              ┌─────────────────┐                           │
│              │     State       │                           │
│              └────────┬────────┘                           │
│                       │                                     │
│         ┌─────────────┴─────────────┐                      │
│         ▼                           ▼                      │
│  ┌──────────────┐           ┌──────────────┐              │
│  │    ACTOR     │           │    CRITIC    │              │
│  │   (Policy)   │           │   (Value)    │              │
│  │              │           │              │              │
│  │  π(a|s; θ)   │           │   V(s; w)    │              │
│  └──────┬───────┘           └──────┬───────┘              │
│         │                          │                       │
│         ▼                          ▼                       │
│  ┌──────────────┐           ┌──────────────┐              │
│  │    Action    │           │    Value     │              │
│  │ Distribution │           │   Estimate   │              │
│  └──────────────┘           └──────────────┘              │
│         │                          │                       │
│         └──────────┬───────────────┘                       │
│                    ▼                                        │
│            ┌──────────────┐                                │
│            │   Advantage  │                                │
│            │   A = Q - V  │                                │
│            └──────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### Actor-Critic Variants

#### 1. Advantage Actor-Critic (A2C)

```javascript
const a2cConfig = {
  type: 'a2c',
  actor: {
    hiddenLayers: [256, 256],
    activation: 'relu',
    outputActivation: 'softmax'  // For discrete actions
  },
  critic: {
    hiddenLayers: [256, 256],
    activation: 'relu',
    outputActivation: 'linear'
  },
  training: {
    learningRate: 0.0007,
    gamma: 0.99,                 // Discount factor
    entropyCoeff: 0.01,          // Exploration bonus
    valueLossCoeff: 0.5,         // Critic loss weight
    maxGradNorm: 0.5
  }
};
```

#### 2. Asynchronous Advantage Actor-Critic (A3C)

```javascript
const a3cConfig = {
  type: 'a3c',
  numWorkers: 8,                 // Parallel environments
  updateFrequency: 5,            // Steps between updates
  sharedOptimizer: true,

  actor: {
    hiddenLayers: [256, 256],
    activation: 'relu'
  },
  critic: {
    hiddenLayers: [256, 256],
    activation: 'relu'
  },
  training: {
    learningRate: 0.0001,
    gamma: 0.99,
    entropyCoeff: 0.01,
    valueLossCoeff: 0.5
  }
};
```

#### 3. Soft Actor-Critic (SAC)

```javascript
const sacConfig = {
  type: 'sac',

  // SAC uses two Q-networks for stability
  actor: {
    hiddenLayers: [256, 256],
    activation: 'relu',
    logStdMin: -20,
    logStdMax: 2
  },
  critic: {
    numQNetworks: 2,             // Twin Q-networks
    hiddenLayers: [256, 256],
    activation: 'relu'
  },

  training: {
    actorLR: 0.0003,
    criticLR: 0.0003,
    alphaLR: 0.0003,             // Entropy coefficient learning rate
    gamma: 0.99,
    tau: 0.005,                  // Soft update coefficient
    targetEntropy: 'auto',       // -dim(action_space)
    replayBuffer: {
      capacity: 1000000,
      batchSize: 256
    }
  }
};
```

### Actor-Critic in AgentDB

```typescript
import { ActorCriticPlugin } from 'agentdb/learning';

const acPlugin = new ActorCriticPlugin({
  variant: 'sac',                // 'a2c', 'a3c', 'sac', 'ppo'
  stateSpace: { dim: 128, type: 'continuous' },
  actionSpace: { dim: 10, type: 'continuous' },

  actor: {
    layers: [256, 256],
    activation: 'relu'
  },
  critic: {
    layers: [256, 256],
    activation: 'relu'
  },

  training: {
    learningRate: 0.0003,
    gamma: 0.99,
    batchSize: 256
  }
});

// Training loop
for (const episode of episodes) {
  const trajectory = await collectTrajectory(env, acPlugin);
  await acPlugin.update(trajectory);
}

// Inference
const action = await acPlugin.selectAction(state, { deterministic: true });
```

---

## Integration with AgentDB

### Learning Plugin Architecture

```typescript
// Base learning plugin interface
interface LearningPlugin {
  // Training methods
  train(data: TrainingData, config?: TrainingConfig): Promise<TrainingResult>;
  update(trajectory: Trajectory): Promise<void>;

  // Inference methods
  selectAction(state: State, options?: ActionOptions): Promise<Action>;
  predict(input: PredictionInput): Promise<Prediction>;

  // Model management
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
  getMetrics(): LearningMetrics;
}

// Decision Transformer implementation
class DecisionTransformerPlugin implements LearningPlugin {
  private model: TransformerModel;
  private tokenizer: StateActionTokenizer;

  async train(trajectories: Trajectory[], config: DTTrainingConfig) {
    // Convert trajectories to sequences
    const sequences = this.trajectoriesToSequences(trajectories);

    // Train transformer
    for (let epoch = 0; epoch < config.epochs; epoch++) {
      for (const batch of this.getBatches(sequences, config.batchSize)) {
        const loss = await this.model.trainStep(batch);
        this.recordMetric('loss', loss);
      }
    }
  }

  async predict(input: DTPredictionInput): Promise<Action> {
    const sequence = this.buildSequence(
      input.targetReturn,
      input.states,
      input.actions
    );
    return this.model.forward(sequence);
  }
}
```

### Combining Decision Transformer with Actor-Critic

```typescript
// Hybrid approach: DT for planning, AC for execution
class HybridLearner {
  private dt: DecisionTransformerPlugin;
  private ac: ActorCriticPlugin;

  async selectAction(state: State, targetReturn: number): Promise<Action> {
    // Use DT for long-horizon planning
    const plannedActions = await this.dt.predict({
      targetReturn,
      states: this.recentStates,
      actions: this.recentActions,
      horizonSteps: 5
    });

    // Use AC for fine-grained execution
    const refinedAction = await this.ac.selectAction(state, {
      guidance: plannedActions[0],
      deterministic: false
    });

    return refinedAction;
  }
}
```

---

## Implementation Patterns

### Pattern 1: Offline RL with Decision Transformer

```typescript
// Train from logged data (no environment interaction)
async function trainOfflineRL(loggedData: Dataset) {
  const dt = new DecisionTransformerPlugin({
    contextLength: 20,
    embeddingDim: 256
  });

  // Load offline trajectories
  const trajectories = await loadTrajectories(loggedData);

  // Train on logged data
  await dt.train(trajectories, {
    epochs: 100,
    batchSize: 64,
    learningRate: 1e-4
  });

  // Inference with desired return
  const agent = {
    selectAction: async (state) => {
      return dt.predict({
        targetReturn: 0.95,
        states: [state],
        actions: []
      });
    }
  };

  return agent;
}
```

### Pattern 2: Online Actor-Critic

```typescript
// Interactive learning with environment
async function trainOnlineAC(env: Environment) {
  const ac = new ActorCriticPlugin({
    variant: 'ppo',
    stateSpace: env.observationSpace,
    actionSpace: env.actionSpace
  });

  for (let episode = 0; episode < 1000; episode++) {
    let state = env.reset();
    const trajectory = [];

    while (!done) {
      const action = await ac.selectAction(state);
      const { nextState, reward, done } = env.step(action);

      trajectory.push({ state, action, reward, nextState, done });
      state = nextState;
    }

    // Update policy
    await ac.update(trajectory);
  }

  return ac;
}
```

### Pattern 3: ReasoningBank Integration

```typescript
// Use ReasoningBank for trajectory storage and learning
import { ReasoningBank } from 'agentdb';

class ReasoningBankLearner {
  private rb: ReasoningBank;
  private dt: DecisionTransformerPlugin;

  async recordTrajectory(trajectory: Trajectory) {
    // Store in ReasoningBank for analysis
    for (const step of trajectory) {
      await this.rb.storeEpisode({
        sessionId: trajectory.id,
        task: step.action.description,
        reward: step.reward,
        success: step.reward > 0
      });
    }
  }

  async learnFromHistory() {
    // Retrieve successful trajectories
    const goodTrajectories = await this.rb.recallSuccessful({
      minReward: 0.8,
      limit: 1000
    });

    // Train DT on successful patterns
    await this.dt.train(goodTrajectories);
  }
}
```

---

## Configuration Reference

### Decision Transformer Configuration

```javascript
module.exports = {
  decisionTransformer: {
    // Model architecture
    model: {
      type: 'gpt2',
      contextLength: 20,
      embeddingDim: 128,
      numHeads: 4,
      numLayers: 3,
      dropout: 0.1
    },

    // Training
    training: {
      epochs: 100,
      batchSize: 64,
      learningRate: 1e-4,
      weightDecay: 1e-4,
      warmupSteps: 1000
    },

    // Inference
    inference: {
      targetReturn: 0.9,
      returnScale: 100,
      temperature: 1.0
    }
  }
};
```

### Actor-Critic Configuration

```javascript
module.exports = {
  actorCritic: {
    variant: 'sac',  // 'a2c', 'a3c', 'sac', 'ppo'

    // Actor network
    actor: {
      layers: [256, 256],
      activation: 'relu',
      logStdRange: [-20, 2]
    },

    // Critic network
    critic: {
      layers: [256, 256],
      activation: 'relu',
      numQNetworks: 2
    },

    // Training
    training: {
      learningRate: 3e-4,
      gamma: 0.99,
      tau: 0.005,
      batchSize: 256
    },

    // Replay buffer
    replayBuffer: {
      capacity: 1000000,
      prioritized: false
    }
  }
};
```

### Environment Variables

```bash
# Decision Transformer
DT_CONTEXT_LENGTH=20
DT_EMBEDDING_DIM=128
DT_TARGET_RETURN=0.9
DT_LEARNING_RATE=0.0001

# Actor-Critic
AC_VARIANT=sac
AC_LEARNING_RATE=0.0003
AC_GAMMA=0.99
AC_BATCH_SIZE=256
AC_REPLAY_CAPACITY=1000000
```

---

*Document generated for RuVector Knowledge Base - December 2025*
