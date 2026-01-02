Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:41:45 EST

# Hive Mind & Consensus Protocols in Claude-Flow

## Overview

Hive Mind architecture enables collective intelligence through coordinated multi-agent swarms. Combined with consensus protocols (Byzantine, Raft, Gossip), it provides fault-tolerant, distributed decision-making for complex agentic workflows.

## Hive Mind Architecture

### Queen-Led Hierarchy

```
                    ┌─────────────────────┐
                    │   QUEEN COORDINATOR │
                    │  (Central Control)  │
                    └─────────┬───────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  WORKER 1   │    │  WORKER 2   │    │  WORKER 3   │
    │  (Research) │    │  (Coding)   │    │  (Testing)  │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                  │                  │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  DRONE 1a   │    │  DRONE 2a   │    │  DRONE 3a   │
    │  DRONE 1b   │    │  DRONE 2b   │    │  DRONE 3b   │
    └─────────────┘    └─────────────┘    └─────────────┘
```

### Implementation

```javascript
const { ClaudeFlow } = require('claude-flow');

// Initialize hive mind swarm
const hive = await ClaudeFlow.initHive({
  topology: 'hierarchical',
  queen: {
    role: 'coordinator',
    capabilities: ['planning', 'delegation', 'aggregation']
  },
  workers: [
    { role: 'researcher', count: 2 },
    { role: 'coder', count: 3 },
    { role: 'tester', count: 2 }
  ],
  consensus: 'raft'  // Consensus protocol
});

// Queen delegates tasks
await hive.queen.delegate({
  task: "Implement user authentication",
  strategy: 'parallel',
  timeout: 300000
});
```

## Swarm Topologies

### Mesh Topology

```javascript
// All agents connected to all others
const meshSwarm = await ClaudeFlow.initSwarm({
  topology: 'mesh',
  maxAgents: 8,
  communication: 'broadcast'  // All hear all
});

// Good for: High redundancy, no single point of failure
// Bad for: High communication overhead at scale
```

### Star Topology

```javascript
// Central coordinator, spoke agents
const starSwarm = await ClaudeFlow.initSwarm({
  topology: 'star',
  coordinator: { capabilities: ['routing', 'aggregation'] },
  workers: 6
});

// Good for: Simple coordination, clear hierarchy
// Bad for: Coordinator is single point of failure
```

### Ring Topology

```javascript
// Agents connected in a ring
const ringSwarm = await ClaudeFlow.initSwarm({
  topology: 'ring',
  maxAgents: 10,
  direction: 'bidirectional'  // or 'unidirectional'
});

// Good for: Pipeline processing, ordered workflows
// Bad for: Single failure breaks ring
```

### Hierarchical Topology

```javascript
// Multi-level tree structure
const hierarchySwarm = await ClaudeFlow.initSwarm({
  topology: 'hierarchical',
  levels: 3,
  branchingFactor: 3  // Each node has 3 children
});

// Good for: Large scale, delegation patterns
// Bad for: Deep hierarchies add latency
```

## Consensus Protocols

### Byzantine Fault Tolerance (BFT)

```javascript
// Tolerates malicious/faulty agents
const bftSwarm = await ClaudeFlow.initSwarm({
  consensus: {
    protocol: 'byzantine',
    faultTolerance: 0.33,  // Tolerate 1/3 faulty
    timeout: 5000,
    quorum: 'supermajority'  // 2/3 + 1
  }
});

// Vote on decision
const result = await bftSwarm.proposeAndVote({
  proposal: "Should we refactor the auth module?",
  options: ['yes', 'no', 'defer'],
  timeout: 30000
});

console.log(result);
// { decision: 'yes', votes: { yes: 5, no: 1, defer: 1 }, consensus: true }
```

### Raft Consensus

```javascript
// Leader-based consensus (simpler, non-Byzantine)
const raftSwarm = await ClaudeFlow.initSwarm({
  consensus: {
    protocol: 'raft',
    electionTimeout: [150, 300],  // Random between 150-300ms
    heartbeatInterval: 50
  }
});

// Leader election happens automatically
raftSwarm.on('leaderElected', (leader) => {
  console.log(`New leader: ${leader.id}`);
});

// All writes go through leader
await raftSwarm.leader.append({
  type: 'decision',
  content: "Use TypeScript for new modules"
});
```

### Gossip Protocol

```javascript
// Epidemic-style information spread
const gossipSwarm = await ClaudeFlow.initSwarm({
  consensus: {
    protocol: 'gossip',
    fanout: 3,           // Tell 3 random peers
    gossipInterval: 100, // ms between gossip rounds
    convergenceTime: 1000  // Expected convergence
  }
});

// Gossip spreads information eventually
await gossipSwarm.gossip({
  type: 'discovery',
  content: "Found critical bug in payment module"
});

// All agents eventually receive (eventual consistency)
```

## Collective Intelligence

### Swarm Decision Making

```javascript
// Aggregate insights from all agents
const collectiveInsight = await hive.collectiveReason({
  question: "What's the best architecture for this system?",
  method: 'ensemble',  // Combine all perspectives
  weights: {
    researcher: 0.3,
    architect: 0.4,
    coder: 0.2,
    tester: 0.1
  }
});

console.log(collectiveInsight);
// {
//   recommendation: "Microservices with event-driven communication",
//   confidence: 0.87,
//   dissent: [{ agent: 'coder-2', view: 'Monolith simpler for small team' }]
// }
```

### Memory Sharing

```javascript
// Shared memory across hive
await hive.sharedMemory.store('architecture_decision', {
  decision: 'microservices',
  rationale: '...',
  timestamp: Date.now()
});

// All workers can access
const decision = await worker.sharedMemory.get('architecture_decision');
```

### Experience Replay Across Hive

```javascript
// Share successful experiences
await hive.shareExperience({
  agent: 'coder-1',
  experience: {
    task: 'Implemented OAuth2',
    approach: 'Used passport.js',
    outcome: 'success',
    learnings: ['Handle token refresh', 'Store in httpOnly cookies']
  }
});

// Other coders learn from this
const relevantExperiences = await coder2.recallSharedExperiences({
  query: 'authentication implementation',
  limit: 5
});
```

## Agent-Booster Integration

### Multi-Model Routing

```javascript
const { AgentBooster } = require('claude-flow/booster');

// Route tasks to optimal models
const booster = new AgentBooster({
  models: {
    'claude-opus': { strength: 'reasoning', cost: 'high' },
    'claude-sonnet': { strength: 'balanced', cost: 'medium' },
    'claude-haiku': { strength: 'speed', cost: 'low' }
  },
  routing: 'adaptive'  // Learn optimal routing
});

// Automatically selects best model for task
const result = await booster.execute({
  task: "Complex architectural analysis",
  constraints: { maxLatency: 5000 }
});
// Routes to claude-opus for reasoning task
```

### Parallel Execution

```javascript
// Run multiple agents in parallel
const results = await booster.parallel([
  { agent: 'researcher', task: 'Analyze competitors' },
  { agent: 'coder', task: 'Prototype feature' },
  { agent: 'designer', task: 'Create mockups' }
], {
  timeout: 60000,
  failStrategy: 'continue'  // Continue if one fails
});
```

## Fault Tolerance

### Self-Healing Swarm

```javascript
const resilientSwarm = await ClaudeFlow.initSwarm({
  faultTolerance: {
    enabled: true,
    healthCheck: {
      interval: 5000,
      timeout: 2000
    },
    recovery: {
      autoRestart: true,
      maxRestarts: 3,
      backoff: 'exponential'
    }
  }
});

// Automatic recovery on agent failure
resilientSwarm.on('agentFailed', async (agent) => {
  console.log(`Agent ${agent.id} failed, recovering...`);
  // System automatically restarts or replaces
});
```

### Quorum-Based Decisions

```javascript
// Require minimum agreement for actions
const quorumSwarm = await ClaudeFlow.initSwarm({
  quorum: {
    size: 'majority',  // or exact number
    timeout: 10000,
    fallback: 'leader_decides'
  }
});

// Decision requires quorum
const approved = await quorumSwarm.voteWithQuorum({
  proposal: "Deploy to production",
  requiredVotes: 'majority'
});
```

## Metrics and Monitoring

```javascript
// Hive status
const status = await hive.getStatus();
// {
//   queen: { status: 'active', load: 0.3 },
//   workers: { total: 7, active: 6, idle: 1 },
//   consensus: { protocol: 'raft', leader: 'worker-3' },
//   health: 0.92
// }

// Consensus metrics
const consensusMetrics = await hive.consensus.getMetrics();
// {
//   decisionsReached: 150,
//   avgConsensusTime: 230,  // ms
//   failedConsensus: 3,
//   currentLeader: 'worker-3'
// }
```

## Best Practices

1. **Choose topology based on task** - mesh for redundancy, hierarchy for delegation
2. **Use Byzantine consensus** when agents might be unreliable
3. **Use Raft** for simpler, high-performance consensus
4. **Use Gossip** for large-scale eventual consistency
5. **Enable shared memory** for knowledge propagation
6. **Monitor consensus health** to detect issues early
7. **Set appropriate quorum sizes** to balance speed vs reliability

## Related Features

- **Swarm Memory Manager**: Distributed memory across hive
- **Experience Replay**: Share successful strategies
- **ReasoningBank**: Collective reasoning traces
- **Multi-Model Router**: Optimal model selection
