Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:14:45 EST

# RuvNet Stack Reinforcement Learning Algorithms

## Complete Technical Reference

This document provides comprehensive documentation for all 9 reinforcement learning algorithms available in the RuvNet stack through AgentDB's LearningSystem. Each algorithm includes mathematical formulations, implementation details, configuration parameters, use cases, and code examples.

---

## Table of Contents

1. [Q-Learning](#1-q-learning)
2. [SARSA](#2-sarsa)
3. [DQN (Deep Q-Network)](#3-dqn-deep-q-network)
4. [Policy Gradient (REINFORCE)](#4-policy-gradient-reinforce)
5. [Actor-Critic](#5-actor-critic)
6. [PPO (Proximal Policy Optimization)](#6-ppo-proximal-policy-optimization)
7. [Decision Transformer](#7-decision-transformer)
8. [MCTS (Monte Carlo Tree Search)](#8-mcts-monte-carlo-tree-search)
9. [Model-Based RL](#9-model-based-rl)
10. [Additional Algorithms](#10-additional-algorithms)
11. [Architecture Overview](#11-architecture-overview)
12. [Quick Start Guide](#12-quick-start-guide)

---

## 1. Q-Learning

### Overview

Q-Learning is a model-free, off-policy temporal difference (TD) learning algorithm. It learns the optimal action-value function Q*(s,a) by iteratively updating Q-values based on observed rewards and estimates of future value.

### Mathematical Formulation

**Bellman Optimality Equation:**
```
Q*(s,a) = E[r + gamma * max_a' Q*(s',a') | s, a]
```

**Q-Learning Update Rule:**
```
Q(s,a) <- Q(s,a) + alpha * [r + gamma * max_a' Q(s',a') - Q(s,a)]
```

Where:
- `Q(s,a)`: Current Q-value for state-action pair
- `alpha`: Learning rate (step size)
- `r`: Observed reward
- `gamma`: Discount factor
- `max_a' Q(s',a')`: Maximum Q-value for next state (greedy action)

### Exploration Strategies

**Epsilon-Greedy:**
```
With probability epsilon: select random action (exploration)
With probability 1-epsilon: select argmax_a Q(s,a) (exploitation)
```

**Epsilon Decay:**
```
epsilon_new = max(epsilon_min, epsilon * epsilon_decay)
```

### Implementation in AgentDB LearningSystem

```typescript
// LearningSystem Q-Learning update (simplified)
case 'q-learning': {
  // Q(s,a) <- Q(s,a) + alpha[r + gamma * max Q(s',a') - Q(s,a)]
  let maxNextQ = 0;
  if (feedback.nextState) {
    const nextActions = Object.keys(policy.qValues)
      .filter(k => k.startsWith(feedback.nextState + '|'));
    maxNextQ = Math.max(...nextActions.map(k => policy.qValues[k]), 0);
  }
  const target = feedback.reward + gamma * maxNextQ;
  policy.qValues[key] += alpha * (target - policy.qValues[key]);
  break;
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `learningRate` | number | 0.1 | Step size for Q-value updates (alpha) |
| `discountFactor` | number | 0.95 | Future reward discount (gamma) |
| `explorationRate` | number | 0.3 | Epsilon for epsilon-greedy |
| `explorationDecay` | number | 0.995 | Epsilon decay rate per episode |
| `minExplorationRate` | number | 0.01 | Minimum exploration rate |
| `useExperienceReplay` | boolean | true | Enable experience replay buffer |
| `replayBufferSize` | number | 10000 | Maximum replay buffer capacity |
| `batchSize` | number | 32 | Batch size for experience replay |

### Use Cases

- **Grid worlds and navigation tasks**: Discrete state/action spaces
- **Board games**: Chess, checkers, tic-tac-toe
- **Resource allocation**: Discrete resource assignment problems
- **Recommendation systems**: Item selection from discrete set

### Code Example

```typescript
import { createAgentDBAdapter } from 'agentic-flow/reasoningbank';

// Initialize adapter with learning enabled
const adapter = await createAgentDBAdapter({
  dbPath: '.agentdb/q-learning.db',
  enableLearning: true,
});

// Start Q-Learning session
const sessionId = await adapter.learningSystem.startSession(
  'user-123',
  'q-learning',
  {
    learningRate: 0.1,
    discountFactor: 0.95,
    explorationRate: 0.3,
    batchSize: 32,
  }
);

// Predict action
const state = 'current_game_state';
const prediction = await adapter.learningSystem.predict(sessionId, state);
console.log('Recommended action:', prediction.action);
console.log('Confidence:', prediction.confidence);
console.log('Q-value:', prediction.qValue);

// Submit feedback after action execution
await adapter.learningSystem.submitFeedback({
  sessionId,
  state,
  action: prediction.action,
  reward: 1.0,  // Positive reward for success
  nextState: 'new_game_state',
  success: true,
  timestamp: Date.now(),
});

// Train on collected experiences
const result = await adapter.learningSystem.train(
  sessionId,
  epochs: 100,
  batchSize: 32,
  learningRate: 0.1
);
console.log('Training loss:', result.finalLoss);
console.log('Convergence rate:', result.convergenceRate);

// End session
await adapter.learningSystem.endSession(sessionId);
```

### CLI Usage

```bash
# Create Q-Learning plugin
npx agentdb@latest create-plugin -t q-learning -n my-q-agent

# List plugins
npx agentdb@latest list-plugins

# Get plugin info
npx agentdb@latest plugin-info my-q-agent
```

---

## 2. SARSA

### Overview

SARSA (State-Action-Reward-State-Action) is an on-policy TD learning algorithm. Unlike Q-Learning, SARSA updates Q-values using the actual action taken in the next state, making it more conservative and safer for exploration.

### Mathematical Formulation

**SARSA Update Rule:**
```
Q(s,a) <- Q(s,a) + alpha * [r + gamma * Q(s',a') - Q(s,a)]
```

Where `a'` is the action **actually taken** in state `s'` (not the greedy action).

**Expected SARSA (variance reduction):**
```
Q(s,a) <- Q(s,a) + alpha * [r + gamma * E[Q(s',a')] - Q(s,a)]
E[Q(s',a')] = epsilon/|A| * sum(Q(s',a)) + (1-epsilon) * max(Q(s',a))
```

### Key Differences from Q-Learning

| Aspect | Q-Learning | SARSA |
|--------|------------|-------|
| Policy Type | Off-policy | On-policy |
| Update Target | max Q(s',a') | Q(s',a') actual |
| Exploration Risk | Ignores exploration in target | Accounts for exploration |
| Convergence | Optimal Q* | Q for current policy |
| Safety | Less conservative | More conservative |

### Implementation in AgentDB

```typescript
// SARSALearner.ts - On-policy TD(0) implementation
update(experience: Experience, nextAction?: Action) {
  const stateKey = this.encodeState(experience.state);
  const actionKey = this.encodeAction(experience.action);
  const nextStateKey = this.encodeState(experience.nextState);

  // Get current Q-value Q(s,a)
  const currentQ = this.getQValue(stateKey, actionKey);

  // SARSA: Get Q-value for actual next action taken
  let nextQ = 0;
  if (nextAction) {
    const nextActionKey = this.encodeAction(nextAction);
    nextQ = this.getQValue(nextStateKey, nextActionKey);
  } else {
    // Expected SARSA approximation for batch updates
    nextQ = this.getExpectedValue(experience.nextState, nextStateActions);
  }

  // SARSA update: Q(s,a) = Q(s,a) + alpha * [r + gamma * Q(s',a') - Q(s,a)]
  const tdTarget = experience.reward + this.config.discountFactor * nextQ;
  const tdError = tdTarget - currentQ;
  const newQ = currentQ + this.config.learningRate * tdError;

  this.setQValue(stateKey, actionKey, newQ);
}

// Expected value under epsilon-greedy policy
getExpectedValue(nextState, nextStateActions) {
  const epsilon = this.config.explorationRate;
  const numActions = nextStateActions.size;

  let sumQ = 0, maxQ = -Infinity;
  for (const qValue of nextStateActions.values()) {
    sumQ += qValue.value;
    maxQ = Math.max(maxQ, qValue.value);
  }
  const avgQ = sumQ / numActions;

  // E[Q] = epsilon * (average) + (1-epsilon) * (max)
  return epsilon * avgQ + (1 - epsilon) * maxQ;
}
```

### Safety Properties

SARSA is preferred when:
1. **Cliff Walking**: Exploration near dangerous states is risky
2. **Real-world Robotics**: Cannot afford costly mistakes during learning
3. **Online Learning**: Policy must be safe during training
4. **Risk-sensitive Applications**: Need conservative exploration

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `learningRate` | number | 0.1 | Step size (alpha) |
| `discountFactor` | number | 0.95 | Future reward discount (gamma) |
| `explorationRate` | number | 0.3 | Higher than Q-Learning for safety |
| `explorationDecay` | number | 0.995 | Slower decay for safety |
| `minExplorationRate` | number | 0.01 | Minimum epsilon |
| `useExperienceReplay` | boolean | true | Enable replay buffer |
| `replayBufferSize` | number | 10000 | Replay buffer size |
| `batchSize` | number | 32 | Batch size |

### Use Cases

- **Safety-critical control systems**: Industrial automation
- **Online learning with real consequences**: Trading systems
- **Cliff-walking environments**: Risky exploration scenarios
- **Human-in-the-loop learning**: When mistakes are costly

### Code Example

```typescript
import { SARSALearner } from 'agentic-qe/learning/algorithms';

// Create SARSA learner
const sarsa = new SARSALearner({
  learningRate: 0.1,
  discountFactor: 0.95,
  explorationRate: 0.3,
  explorationDecay: 0.995,
  minExplorationRate: 0.01,
});

// Online learning loop
let state = getInitialState();
let action = sarsa.selectAction(state, getAvailableActions(state));

while (!isDone()) {
  // Execute action
  const { reward, nextState } = executeAction(action);

  // Select next action using current policy (key SARSA difference)
  const nextAction = sarsa.selectAction(nextState, getAvailableActions(nextState));

  // Update with (s, a, r, s', a') - the full SARSA tuple
  sarsa.selectAndUpdate(state, action, reward, nextState, getAvailableActions(nextState));

  state = nextState;
  action = nextAction;
}

// End episode
sarsa.endEpisode();

// Get convergence metrics
const metrics = sarsa.getConvergenceMetrics();
console.log('Is converging:', metrics.isConverging);
console.log('Stability:', metrics.stability);
```

### CLI Usage

```bash
# Create SARSA plugin
npx agentdb@latest create-plugin -t sarsa -n safe-agent
```

---

## 3. DQN (Deep Q-Network)

### Overview

Deep Q-Network extends Q-Learning with neural network function approximation, experience replay, and target networks. In AgentDB's implementation, DQN uses tabular Q-tables with the stability techniques from the original DQN paper.

### Mathematical Formulation

**DQN Loss Function:**
```
L(theta) = E[(r + gamma * max_a' Q(s',a'; theta_target) - Q(s,a; theta))^2]
```

**Target Network Update:**
```
theta_target <- tau * theta + (1 - tau) * theta_target  (soft update)
or
theta_target <- theta  (hard update every N steps)
```

### Key Components

1. **Experience Replay Buffer**: Breaks correlation in sequential data
2. **Target Network**: Stabilizes training by using fixed Q-targets
3. **Epsilon-Greedy Exploration**: Balanced exploration/exploitation

### Implementation in AgentDB

```typescript
// DQN uses the base Q-Learning with experience replay and target updates
// LearningSystem implementation
case 'dqn':
case 'q-learning':
  // Same update rule, but DQN adds:
  // 1. Experience replay (enabled by useExperienceReplay: true)
  // 2. Target network (targetUpdateFrequency)
  const target = feedback.reward + gamma * maxNextQ;
  policy.qValues[key] += alpha * (target - policy.qValues[key]);
  break;

// Experience replay is built into AbstractRLLearner
batchUpdate() {
  if (!this.replayBuffer || !this.replayBuffer.canSample(this.config.batchSize)) {
    return;
  }
  const batch = this.replayBuffer.sample(this.config.batchSize);
  for (const experience of batch) {
    this.update(experience);
  }
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `learningRate` | number | 0.001 | Lower for stability |
| `discountFactor` | number | 0.99 | Higher for long-term rewards |
| `explorationRate` | number | 1.0 | Start with full exploration |
| `explorationDecay` | number | 0.995 | Gradual decay |
| `minExplorationRate` | number | 0.01 | Final exploration rate |
| `useExperienceReplay` | boolean | true | **Required for DQN** |
| `replayBufferSize` | number | 10000 | Large buffer for diversity |
| `batchSize` | number | 32 | Mini-batch size |
| `targetUpdateFrequency` | number | 100 | Steps between target updates |

### Use Cases

- **Complex discrete control**: Atari games
- **Large state spaces**: Image-based observations
- **Sample efficiency**: When interactions are expensive
- **Stable learning**: When training stability is crucial

### Code Example

```typescript
// Start DQN session
const sessionId = await adapter.learningSystem.startSession(
  'user-123',
  'dqn',
  {
    learningRate: 0.001,
    discountFactor: 0.99,
    explorationRate: 1.0,
    explorationDecay: 0.995,
    minExplorationRate: 0.01,
    batchSize: 32,
    targetUpdateFrequency: 100,
  }
);

// Collect experiences
for (let episode = 0; episode < 1000; episode++) {
  let state = env.reset();

  while (!done) {
    const prediction = await adapter.learningSystem.predict(sessionId, state);
    const { reward, nextState, done } = env.step(prediction.action);

    await adapter.learningSystem.submitFeedback({
      sessionId,
      state,
      action: prediction.action,
      reward,
      nextState,
      success: reward > 0,
      timestamp: Date.now(),
    });

    state = nextState;
  }
}

// Train with experience replay
const result = await adapter.learningSystem.train(
  sessionId,
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001
);
```

---

## 4. Policy Gradient (REINFORCE)

### Overview

Policy Gradient methods directly optimize the policy rather than learning a value function. REINFORCE is the foundational policy gradient algorithm using Monte Carlo returns.

### Mathematical Formulation

**Policy Gradient Theorem:**
```
grad J(theta) = E[sum_t grad log pi(a_t|s_t; theta) * G_t]
```

Where `G_t` is the return from time t:
```
G_t = sum_{k=0}^{T-t} gamma^k * r_{t+k}
```

**Policy Update:**
```
theta <- theta + alpha * grad log pi(a|s; theta) * G
```

### Implementation in AgentDB

```typescript
// LearningSystem policy gradient update
case 'policy-gradient': {
  // Update average reward (Monte Carlo return estimate)
  policy.visitCounts[key]++;
  const n = policy.visitCounts[key];
  policy.avgRewards[key] += (feedback.reward - policy.avgRewards[key]) / n;
  break;
}

// Action scoring uses average rewards
case 'policy-gradient':
case 'actor-critic':
case 'ppo':
  score = policy.avgRewards[key] || 0;
  break;
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `learningRate` | number | 0.01 | Policy learning rate |
| `discountFactor` | number | 0.99 | Return discount factor |
| `explorationRate` | number | 0.1 | Exploration via stochastic policy |

### Use Cases

- **Continuous action spaces**: Robotics control
- **Stochastic policies needed**: When randomness is beneficial
- **High-dimensional actions**: Continuous control tasks

### Code Example

```typescript
// Start policy gradient session
const sessionId = await adapter.learningSystem.startSession(
  'user-123',
  'policy-gradient',
  {
    learningRate: 0.01,
    discountFactor: 0.99,
  }
);

// Collect full episodes for Monte Carlo returns
const trajectory = [];

while (!done) {
  const prediction = await adapter.learningSystem.predict(sessionId, state);
  const { reward, nextState, done } = env.step(prediction.action);

  trajectory.push({ state, action: prediction.action, reward });
  state = nextState;
}

// Compute returns and update
let G = 0;
for (let t = trajectory.length - 1; t >= 0; t--) {
  G = trajectory[t].reward + gamma * G;

  await adapter.learningSystem.submitFeedback({
    sessionId,
    state: trajectory[t].state,
    action: trajectory[t].action,
    reward: G,  // Use return as reward signal
    success: true,
    timestamp: Date.now(),
  });
}
```

---

## 5. Actor-Critic

### Overview

Actor-Critic combines policy gradient (actor) with value function estimation (critic). The critic reduces variance in policy gradient updates by providing a learned baseline.

### Mathematical Formulation

**Advantage Function:**
```
A(s,a) = Q(s,a) - V(s) = r + gamma * V(s') - V(s) = delta (TD error)
```

**Actor Update (Policy):**
```
theta <- theta + alpha_a * delta * grad log pi(a|s; theta) + beta * H(pi)
```

**Critic Update (Value):**
```
V(s) <- V(s) + alpha_c * delta
```

Where `H(pi)` is entropy bonus for exploration.

### Implementation in AgentDB

```typescript
// ActorCriticLearner.ts implementation
update(experience: Experience, nextAction?: Action) {
  const { state, action, reward, nextState, done } = this.extractExperience(experience);

  // Critic: Get state values
  const currentV = this.getStateValue(state);
  const nextV = done ? 0 : this.getTargetStateValue(nextState);

  // Calculate TD error (advantage)
  let advantage = reward + this.config.discountFactor * nextV - currentV;

  // Normalize advantage if enabled
  if (this.actorConfig.normalizeAdvantage) {
    advantage = this.normalizeAdvantage(advantage);
  }

  // Update critic (value function)
  this.updateCritic(stateKey, currentV, advantage);

  // Update actor (policy)
  this.updateActor(stateKey, actionKey, advantage);

  // Sync target network periodically
  if (++this.updatesSinceTargetSync >= this.actorConfig.targetUpdateFrequency) {
    this.syncTargetNetwork();
    this.updatesSinceTargetSync = 0;
  }
}

// Critic update: V(s) += alpha_c * delta
updateCritic(stateKey, currentV, advantage) {
  const newValue = currentV + this.actorConfig.criticLearningRate * advantage;
  this.valueTable.set(stateKey, { value: newValue, ... });
}

// Actor update: preference(s,a) += alpha_a * (advantage + entropy_bonus)
updateActor(stateKey, actionKey, advantage) {
  const entropyBonus = this.calculateEntropyBonus(stateKey);
  const newPref = currentPref + this.actorConfig.actorLearningRate * (advantage + entropyBonus);
  statePolicy.set(actionKey, { probability: newPref, ... });
}

// Entropy calculation: H(pi) = -sum pi(a|s) * log pi(a|s)
calculateEntropyBonus(stateKey) {
  // ... calculate entropy over action distribution
  return this.actorConfig.entropyCoefficient * entropy;
}
```

### Action Selection (Softmax Policy)

```typescript
// Softmax policy: pi(a|s) = exp(preference(s,a)/tau) / sum exp(preference(s,a')/tau)
getActionProbabilities(stateKey, availableActions) {
  const temperature = this.actorConfig.temperature;
  const preferences = availableActions.map(action =>
    this.getPreference(stateKey, this.encodeAction(action)) / temperature
  );

  // Softmax with numerical stability
  const maxPref = Math.max(...preferences);
  const expPrefs = preferences.map(p => Math.exp(p - maxPref));
  const sumExp = expPrefs.reduce((sum, e) => sum + e, 0);
  return expPrefs.map(e => e / sumExp);
}

// Sample from categorical distribution
selectAction(state, availableActions) {
  if (Math.random() < this.config.explorationRate) {
    return availableActions[Math.floor(Math.random() * availableActions.length)];
  }
  return this.sampleFromPolicy(state, availableActions);
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `learningRate` | number | 0.1 | General learning rate |
| `actorLearningRate` | number | 0.01 | Policy update rate |
| `criticLearningRate` | number | 0.1 | Value update rate |
| `discountFactor` | number | 0.95 | Future reward discount |
| `explorationRate` | number | 0.3 | Epsilon for exploration fallback |
| `explorationDecay` | number | 0.995 | Exploration decay |
| `minExplorationRate` | number | 0.01 | Minimum exploration |
| `entropyCoefficient` | number | 0.01 | Entropy bonus weight |
| `temperature` | number | 1.0 | Softmax temperature |
| `normalizeAdvantage` | boolean | true | Normalize advantages |
| `targetUpdateFrequency` | number | 100 | Target network sync |
| `useExperienceReplay` | boolean | true | Enable replay buffer |
| `replayBufferSize` | number | 10000 | Replay buffer size |
| `batchSize` | number | 32 | Batch size |

### Use Cases

- **Continuous control**: Robotic manipulation
- **Game playing**: Complex strategy games
- **Multi-agent systems**: Cooperative/competitive scenarios
- **Sample-efficient learning**: When reducing variance is critical

### Code Example

```typescript
import { ActorCriticLearner, createDefaultActorCriticConfig } from 'agentic-qe/learning/algorithms';

// Create with default config
const config = createDefaultActorCriticConfig();
config.actorLearningRate = 0.01;
config.criticLearningRate = 0.1;
config.entropyCoefficient = 0.01;

const ac = new ActorCriticLearner(config);

// Training loop
for (let episode = 0; episode < 1000; episode++) {
  let state = env.reset();

  while (!done) {
    const action = ac.selectAction(state, env.getAvailableActions());
    const { reward, nextState, done } = env.step(action);

    ac.update({
      state,
      action,
      reward,
      nextState,
      done,
      taskId: `ep-${episode}`,
      taskType: 'training',
      timestamp: new Date(),
      agentId: 'ac-agent',
    });

    state = nextState;
  }

  ac.endEpisode();
}

// Get statistics
const stats = ac.getActorCriticStatistics();
console.log('Average state value:', stats.avgStateValue);
console.log('Average entropy:', stats.avgEntropy);
console.log('Advantage std:', stats.advantageStd);

// Export trained model
const exported = ac.exportActorCritic();
```

---

## 6. PPO (Proximal Policy Optimization)

### Overview

PPO is a state-of-the-art policy gradient algorithm that achieves strong performance while being simpler than TRPO. It uses clipped surrogate objectives to prevent large policy updates.

### Mathematical Formulation

**PPO-Clip Objective:**
```
L^CLIP(theta) = E[min(r(theta) * A, clip(r(theta), 1-eps, 1+eps) * A)]
```

Where:
- `r(theta) = pi_theta(a|s) / pi_theta_old(a|s)` (probability ratio)
- `A` is the advantage estimate
- `eps` is the clip parameter (typically 0.2)

**Generalized Advantage Estimation (GAE):**
```
A_t = sum_{l=0}^{T-t} (gamma * lambda)^l * delta_{t+l}
delta_t = r_t + gamma * V(s_{t+1}) - V(s_t)
```

**Value Function Loss:**
```
L^V(theta) = (V_theta(s) - V_target)^2
```

**Total Objective:**
```
L(theta) = L^CLIP(theta) - c1 * L^V(theta) + c2 * H(pi)
```

### Implementation in AgentDB

```typescript
// PPOLearner.ts implementation
trainMiniBatch(batch) {
  for (const step of batch) {
    // Compute probability ratio
    const newLogProb = this.getLogProb(step.state, step.action);
    const oldLogProb = step.logProb;
    const ratio = Math.exp(newLogProb - oldLogProb);

    // Clipped and unclipped objectives
    const eps = this.ppoConfig.clipEpsilon;
    const surr1 = ratio * step.advantage;
    const surr2 = Math.max(Math.min(ratio, 1 + eps), 1 - eps) * step.advantage;

    // Policy loss (negative because maximizing)
    const policyLoss = -Math.min(surr1, surr2);

    // Value loss with optional clipping
    let valueLoss = (currentValue - valueTarget) ** 2;
    if (this.ppoConfig.clipValueLoss) {
      const clippedValue = step.value + Math.max(Math.min(currentValue - step.value, eps), -eps);
      valueLoss = Math.max(valueLoss, (clippedValue - valueTarget) ** 2);
    }

    // Entropy bonus
    const entropy = this.computeEntropy(step.state);
    const entropyLoss = -this.ppoConfig.entropyCoefficient * entropy;

    // Update policy and value
    this.updatePolicy(step.state, step.action, step.advantage, ratio);
    this.updateValue(step.state, valueTarget);
  }
}

// Compute GAE advantages
computeGAE() {
  const gamma = this.config.discountFactor;
  const lambda = this.ppoConfig.gaeLambda;
  let lastGaeLam = 0;

  // Compute backwards
  for (let t = this.trajectory.length - 1; t >= 0; t--) {
    const step = this.trajectory[t];
    const nextValue = step.done ? 0 : this.valueTable.get(step.nextState) ?? 0;

    // TD error
    const delta = step.reward + gamma * nextValue - step.value;

    // GAE: A_t = delta + gamma * lambda * A_{t+1}
    lastGaeLam = step.done ? delta : delta + gamma * lambda * lastGaeLam;
    step.advantage = lastGaeLam;
    step.returns = step.advantage + step.value;
  }

  // Normalize advantages
  const mean = this.trajectory.reduce((s, t) => s + t.advantage, 0) / this.trajectory.length;
  const std = Math.sqrt(this.trajectory.reduce((s, t) => s + (t.advantage - mean) ** 2, 0) / this.trajectory.length) + 1e-8;
  this.trajectory.forEach(step => step.advantage = (step.advantage - mean) / std);
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `learningRate` | number | 0.0003 | General learning rate |
| `policyLearningRate` | number | 0.0003 | Policy update rate |
| `valueLearningRate` | number | 0.001 | Value update rate |
| `discountFactor` | number | 0.99 | Future reward discount |
| `clipEpsilon` | number | 0.2 | PPO clipping parameter |
| `ppoEpochs` | number | 4 | Training epochs per trajectory |
| `miniBatchSize` | number | 64 | Mini-batch size |
| `valueLossCoefficient` | number | 0.5 | Value loss weight (c1) |
| `entropyCoefficient` | number | 0.01 | Entropy bonus weight (c2) |
| `gaeLambda` | number | 0.95 | GAE lambda parameter |
| `maxGradNorm` | number | 0.5 | Gradient clipping |
| `clipValueLoss` | boolean | true | Clip value function loss |
| `explorationRate` | number | 0.0 | PPO uses entropy, not epsilon |
| `replayBufferSize` | number | 2048 | Trajectory buffer size |

### Use Cases

- **Complex continuous control**: MuJoCo, robotics
- **Game playing**: Dota 2, StarCraft
- **Robotic manipulation**: Dexterous hands
- **Production deployments**: Stable training for real applications

### Code Example

```typescript
import { PPOLearner, createDefaultPPOConfig } from 'agentic-qe/learning/algorithms';

// Create PPO learner
const config = createDefaultPPOConfig();
config.clipEpsilon = 0.2;
config.ppoEpochs = 4;
config.gaeLambda = 0.95;

const ppo = new PPOLearner(config);

// Collect trajectory
for (let step = 0; step < trajectoryLength; step++) {
  const action = ppo.selectAction(state, env.getAvailableActions());
  const { reward, nextState, done } = env.step(action);

  ppo.collectStep(state, action, reward, nextState, done);
  state = nextState;

  if (done) {
    state = env.reset();
  }
}

// Train on collected trajectory
ppo.trainOnTrajectory();

// Get PPO-specific statistics
const stats = ppo.getPPOStatistics();
console.log('Trajectory length:', stats.trajectoryLength);
console.log('Average value:', stats.avgValue);
console.log('Average advantage:', stats.avgAdvantage);

// Export/Import for persistence
const exported = ppo.exportPPO();
// ... save to disk ...

const ppo2 = new PPOLearner(createDefaultPPOConfig());
ppo2.importPPO(exported);
```

---

## 7. Decision Transformer

### Overview

Decision Transformer frames RL as a sequence modeling problem. It uses transformer architecture to model trajectories conditioned on desired returns, enabling offline RL from logged data.

### Mathematical Formulation

**Trajectory Representation:**
```
tau = (R_1, s_1, a_1, R_2, s_2, a_2, ..., R_T, s_T, a_T)
```

Where `R_t = sum_{t'=t}^T r_t'` is the return-to-go.

**Autoregressive Prediction:**
```
a_t = DT(R_t, s_t, a_{<t}, s_{<t}, R_{<t})
```

The model predicts actions conditioned on:
- Desired return-to-go `R_t`
- Current state `s_t`
- History of states, actions, and returns

### Implementation in AgentDB

```typescript
// LearningSystem Decision Transformer scoring
case 'decision-transformer':
  // Use reward-conditioned probability
  score = this.calculateTransformerScore(state, action, policy);
  break;

calculateTransformerScore(state, action, policy) {
  const key = `${state}|${action}`;
  return policy.avgRewards[key] || 0;
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `algorithm` | string | 'decision-transformer' | Algorithm type |
| `model_size` | string | 'base' | Model size (base/large) |
| `context_length` | number | 20 | Context window length |
| `embed_dim` | number | 128 | Embedding dimension |
| `n_heads` | number | 8 | Attention heads |
| `n_layers` | number | 6 | Transformer layers |

### Use Cases

- **Offline RL**: Learning from logged data without environment interaction
- **Imitation learning**: Learning from expert demonstrations
- **Safe learning**: No online exploration needed
- **Large-scale learning**: Leverage existing datasets

### Code Example

```typescript
// Create Decision Transformer plugin
npx agentdb@latest create-plugin -t decision-transformer -n dt-agent

// API usage
const adapter = await createAgentDBAdapter({
  dbPath: '.agentdb/decision-transformer.db',
  enableLearning: true,
});

// Start session
const sessionId = await adapter.learningSystem.startSession(
  'user-123',
  'decision-transformer',
  {
    learningRate: 0.001,
    discountFactor: 0.99,
  }
);

// Store historical experiences (offline data)
for (const experience of historicalData) {
  await adapter.insertPattern({
    type: 'experience',
    domain: 'offline-rl',
    pattern_data: JSON.stringify({
      embedding: await computeEmbedding(JSON.stringify(experience)),
      pattern: {
        state: experience.state,
        action: experience.action,
        reward: experience.reward,
        return_to_go: experience.return_to_go,
        timestep: experience.timestep,
      }
    }),
    confidence: experience.reward > 0 ? 0.9 : 0.5,
  });
}

// Train model
const metrics = await adapter.train({
  epochs: 50,
  batchSize: 32,
});

// Query for action conditioned on desired return
const desiredReturn = 100;  // Want high-reward trajectory
const prediction = await adapter.learningSystem.predict(sessionId, state);
```

---

## 8. MCTS (Monte Carlo Tree Search)

### Overview

MCTS is a planning algorithm that builds a search tree by simulating trajectories and backing up values. It's particularly effective when a simulator is available.

### Mathematical Formulation

**UCB1 Selection:**
```
UCB1(s,a) = Q(s,a) + c * sqrt(ln(N(s)) / N(s,a))
```

Where:
- `Q(s,a)`: Average value of action a from state s
- `N(s)`: Visit count for state s
- `N(s,a)`: Visit count for action a from state s
- `c`: Exploration constant (typically sqrt(2))

**MCTS Phases:**
1. **Selection**: Traverse tree using UCB1 until leaf
2. **Expansion**: Add new node for unexplored action
3. **Simulation**: Rollout with random/learned policy
4. **Backpropagation**: Update visit counts and values

### Implementation in AgentDB

```typescript
// LearningSystem MCTS scoring
case 'mcts':
  // Use UCB1 formula
  score = this.calculateUCB1(state, action, policy);
  break;

calculateUCB1(state, action, policy) {
  const key = `${state}|${action}`;
  const q = policy.avgRewards[key] || 0;
  const n = policy.visitCounts[key] || 1;
  const N = Object.values(policy.visitCounts).reduce((sum, val) => sum + val, 0) || 1;

  // UCB1: Q + c * sqrt(ln(N) / n)
  const exploration = Math.sqrt(2 * Math.log(N) / n);
  return q + exploration;
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `explorationConstant` | number | 1.41 | UCB exploration constant (sqrt(2)) |
| `simulationDepth` | number | 50 | Maximum rollout depth |
| `numSimulations` | number | 100 | Simulations per decision |
| `discountFactor` | number | 0.99 | Future reward discount |

### Use Cases

- **Game playing**: Go, Chess (AlphaGo/AlphaZero)
- **Planning with simulators**: When model is available
- **Combinatorial optimization**: Search space exploration
- **Sequential decision making**: When look-ahead is valuable

### Code Example

```typescript
const sessionId = await adapter.learningSystem.startSession(
  'user-123',
  'mcts',
  {
    learningRate: 0.1,
    discountFactor: 0.99,
    explorationRate: 0.0,  // MCTS uses UCB for exploration
  }
);

// MCTS naturally balances exploration/exploitation via UCB1
const prediction = await adapter.learningSystem.predict(sessionId, state);

// The prediction.qValue includes the UCB1 exploration bonus
console.log('UCB1 score:', prediction.qValue);
console.log('Action:', prediction.action);
```

---

## 9. Model-Based RL

### Overview

Model-Based RL learns a dynamics model of the environment and uses it for planning or generating synthetic experience. This can dramatically improve sample efficiency.

### Mathematical Formulation

**Dynamics Model:**
```
s_{t+1}, r_t = f(s_t, a_t; phi)
```

**Model-Based Planning:**
```
a* = argmax_a E[sum_{t=0}^H gamma^t * r_t | s_0, a_0=a, f]
```

**Dyna-Q Style Learning:**
1. Experience real transition: (s, a, r, s')
2. Update Q from real experience
3. Update model f from real experience
4. Generate N simulated transitions using f
5. Update Q from simulated experiences

### Implementation in AgentDB

```typescript
// LearningSystem Model-Based scoring
case 'model-based':
  // Use model prediction (in this implementation, average rewards)
  score = this.calculateModelScore(state, action, policy);
  break;

calculateModelScore(state, action, policy) {
  const key = `${state}|${action}`;
  return policy.avgRewards[key] || 0;
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `modelLearningRate` | number | 0.01 | Dynamics model learning rate |
| `planningHorizon` | number | 10 | Look-ahead depth |
| `simulatedTransitions` | number | 10 | Simulated experiences per step |
| `modelUpdateFrequency` | number | 1 | Steps between model updates |

### Use Cases

- **Sample-expensive environments**: Real robotics
- **Safety-critical applications**: Can plan before acting
- **System identification**: Learn environment dynamics
- **What-if analysis**: Simulate counterfactuals

---

## 10. Additional Algorithms

### MAML (Model-Agnostic Meta-Learning)

MAML enables few-shot learning by learning an initialization that allows fast adaptation to new tasks.

**Update Rule:**
```
Inner loop: theta'_i = theta - alpha * grad L(theta, support_i)
Outer loop: theta = theta - beta * sum_i grad L(theta'_i, query_i)
```

```typescript
import { MAMLMetaLearner, createDefaultMAMLConfig } from 'agentic-qe/learning/algorithms';

const maml = new MAMLMetaLearner({
  ...createDefaultMAMLConfig(),
  innerLearningRate: 0.1,  // Fast adaptation
  innerSteps: 5,            // 5-shot learning
  metaLearningRate: 0.01,
  taskBatchSize: 5,
});

// Fast adaptation to new task with 5 examples
const adaptedQTable = await maml.fastAdapt(fewExamples);

// Perform meta-learning update across task distribution
const metaEpisode = await maml.performMetaUpdate();
console.log('Pre-adaptation loss:', metaEpisode.preAdaptationLoss);
console.log('Post-adaptation loss:', metaEpisode.postAdaptationLoss);
console.log('Improvement:', metaEpisode.improvement, '%');
```

### Active Learning

Query-based learning that selects most informative samples for labeling.

### Adversarial Training

Robustness enhancement through adversarial perturbations.

### Curriculum Learning

Progressive difficulty training for complex tasks.

### Federated Learning

Privacy-preserving distributed learning across multiple agents.

### Multi-Task Learning

Shared representations for related tasks.

---

## 11. Architecture Overview

### AbstractRLLearner Base Class

All RL algorithms inherit from `AbstractRLLearner`:

```typescript
abstract class AbstractRLLearner {
  // Core properties
  protected config: RLConfig;
  protected qTable: Map<string, Map<string, QValue>>;
  protected replayBuffer?: ExperienceReplayBuffer;
  protected stepCount: number;
  protected episodeCount: number;

  // Core methods
  selectAction(state, availableActions): Action;  // Epsilon-greedy
  getBestAction(state, availableActions): Action; // Greedy
  getQValue(state, action): number;
  setQValue(stateKey, actionKey, value): void;

  // Abstract methods (implement in subclasses)
  abstract update(experience, nextAction?): void;
  abstract getDefaultExplorationRate(): number;

  // Lifecycle
  batchUpdate(): void;
  decayExploration(): void;
  endEpisode(): void;

  // State encoding
  encodeState(state): string;
  encodeAction(action): string;

  // Persistence
  export(): ExportedState;
  import(state: ExportedState): void;
}
```

### LearningSystem Controller

High-level session management for all algorithms:

```typescript
class LearningSystem {
  // Session management
  startSession(userId, sessionType, config): Promise<string>;
  endSession(sessionId): Promise<void>;

  // Core operations
  predict(sessionId, state): Promise<ActionPrediction>;
  submitFeedback(feedback: ActionFeedback): Promise<void>;
  train(sessionId, epochs, batchSize, learningRate): Promise<TrainingResult>;

  // Advanced features
  getMetrics(options): Promise<Metrics>;
  transferLearning(options): Promise<TransferResult>;
  explainAction(options): Promise<Explanation>;
  recordExperience(options): Promise<number>;
  calculateReward(options): number;
}
```

### AgentDB Integration

Integration with AgentDB for persistent vector-based learning:

```typescript
// Create adapter with learning enabled
const adapter = await createAgentDBAdapter({
  dbPath: '.agentdb/learning.db',
  enableLearning: true,
  enableReasoning: true,
});

// Store experiences with embeddings
await adapter.insertPattern({
  type: 'experience',
  domain: 'task-domain',
  pattern_data: JSON.stringify({
    embedding: await computeEmbedding(stateAction),
    pattern: { state, action, reward, next_state, done }
  }),
  confidence: reward > 0 ? 0.9 : 0.5,
});

// Train learning model
await adapter.train({ epochs: 50, batchSize: 32 });

// Retrieve with reasoning
const result = await adapter.retrieveWithReasoning(queryEmbedding, {
  synthesizeContext: true,
  k: 10,
});
```

---

## 12. Quick Start Guide

### Installation

```bash
# Install via agentic-flow (includes AgentDB)
npm install agentic-flow

# Or standalone AgentDB
npm install agentdb
```

### CLI Commands

```bash
# Create learning plugin
npx agentdb@latest create-plugin -t <algorithm> -n <name>

# Available templates:
# decision-transformer, q-learning, sarsa, actor-critic, curiosity-driven

# List plugins
npx agentdb@latest list-plugins

# Get plugin info
npx agentdb@latest plugin-info <name>

# List templates
npx agentdb@latest list-templates
```

### Basic Training Loop

```typescript
import { createAgentDBAdapter } from 'agentic-flow/reasoningbank';

async function trainAgent() {
  // Initialize
  const adapter = await createAgentDBAdapter({
    dbPath: '.agentdb/agent.db',
    enableLearning: true,
  });

  // Start session (choose algorithm)
  const sessionId = await adapter.learningSystem.startSession(
    'user-id',
    'ppo',  // or: q-learning, sarsa, dqn, policy-gradient, actor-critic, decision-transformer, mcts, model-based
    {
      learningRate: 0.0003,
      discountFactor: 0.99,
      explorationRate: 0.0,
    }
  );

  // Training loop
  for (let episode = 0; episode < 1000; episode++) {
    let state = env.reset();

    while (!done) {
      // Get action
      const prediction = await adapter.learningSystem.predict(sessionId, state);

      // Execute
      const { reward, nextState, done } = env.step(prediction.action);

      // Learn
      await adapter.learningSystem.submitFeedback({
        sessionId,
        state,
        action: prediction.action,
        reward,
        nextState,
        success: reward > 0,
        timestamp: Date.now(),
      });

      state = nextState;
    }
  }

  // Final training pass
  const result = await adapter.learningSystem.train(sessionId, 100, 32, 0.0003);
  console.log('Final loss:', result.finalLoss);
  console.log('Convergence:', result.convergenceRate);

  // Cleanup
  await adapter.learningSystem.endSession(sessionId);
}
```

### Algorithm Selection Guide

| Scenario | Recommended Algorithm |
|----------|----------------------|
| Discrete actions, sample-efficient | **Q-Learning** |
| Safety-critical online learning | **SARSA** |
| Large state spaces, stable learning | **DQN** |
| Continuous actions, simple | **Policy Gradient** |
| Continuous actions, variance reduction | **Actor-Critic** |
| Production deployment, stable | **PPO** |
| Offline/logged data only | **Decision Transformer** |
| Simulator available, planning | **MCTS** |
| Sample-expensive, need model | **Model-Based RL** |
| Few-shot adaptation | **MAML** |

---

## References

1. Watkins & Dayan (1992). Q-Learning. Machine Learning.
2. Rummery & Niranjan (1994). SARSA. Cambridge Technical Report.
3. Mnih et al. (2015). DQN. Nature.
4. Williams (1992). REINFORCE. Machine Learning.
5. Sutton (1984). Actor-Critic. PhD Thesis.
6. Schulman et al. (2017). PPO. arXiv.
7. Chen et al. (2021). Decision Transformer. NeurIPS.
8. Coulom (2007). MCTS. CGW.
9. Sutton (1990). Dyna Architecture. Machine Learning.
10. Finn et al. (2017). MAML. ICML.

---

*Documentation generated from RuvNet Stack source code analysis.*
*AgentDB v1.0.7+ | agentic-flow v2.0.0+ | agentic-qe*
