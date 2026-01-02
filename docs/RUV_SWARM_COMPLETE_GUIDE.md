# Ruv-Swarm Complete Guide

## Overview

Ruv-swarm is a high-performance multi-agent coordination system built on WebAssembly with SIMD acceleration. It provides:

- **WASM-Accelerated Processing**: 10-100x faster neural operations
- **Multiple Topologies**: Mesh, hierarchical, ring, star, adaptive
- **Decentralized Autonomous Agents (DAA)**: Self-learning, self-organizing agents
- **Neural Pattern Training**: Coordination, optimization, prediction patterns
- **Consensus Mechanisms**: Byzantine, Raft, Gossip, CRDT protocols

## Installation

```bash
# Install globally
npm install -g ruv-swarm

# Or use npx
npx ruv-swarm@latest mcp start

# Add to MCP configuration
claude mcp add ruv-swarm npx ruv-swarm@latest mcp start
```

## Core Concepts

### Swarm Topologies

#### Mesh Topology (Peer-to-Peer)
All agents connect directly to each other. Best for collaborative tasks requiring full information sharing.

```javascript
// Initialize mesh swarm
await mcp__ruv_swarm__swarm_init({
  topology: 'mesh',
  maxAgents: 8,
  strategy: 'balanced'
});

// Mesh characteristics:
// - O(n²) connections
// - Highest fault tolerance
// - Best for <10 agents
// - Full information propagation
```

```
    ┌──────┐
    │Agent1│
    └──┬───┘
   ╱   │   ╲
  ╱    │    ╲
┌▼─────┴─────▼┐
│Agent2│Agent3│
└──┬───┴───┬──┘
   │   ╲╱  │
   │   ╱╲  │
┌──▼───┬───▼──┐
│Agent4│Agent5│
└──────┴──────┘
```

#### Hierarchical Topology (Tree)
Coordinator at top, workers organized in layers. Best for complex tasks with clear delegation.

```javascript
await mcp__ruv_swarm__swarm_init({
  topology: 'hierarchical',
  maxAgents: 16,
  strategy: 'specialized'
});

// Hierarchical characteristics:
// - Clear command structure
// - Efficient task delegation
// - Single point of coordination
// - Best for complex workflows
```

```
         ┌────────────┐
         │Coordinator │
         └─────┬──────┘
      ┌────────┼────────┐
      ▼        ▼        ▼
  ┌───────┐┌───────┐┌───────┐
  │Manager││Manager││Manager│
  └───┬───┘└───┬───┘└───┬───┘
    ┌─┴─┐    ┌─┴─┐    ┌─┴─┐
    ▼   ▼    ▼   ▼    ▼   ▼
  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐
  │W1 ││W2 ││W3 ││W4 ││W5 ││W6 │
  └───┘└───┘└───┘└───┘└───┘└───┘
```

#### Ring Topology (Circular)
Agents connected in a ring, messages pass around. Best for sequential processing pipelines.

```javascript
await mcp__ruv_swarm__swarm_init({
  topology: 'ring',
  maxAgents: 6,
  strategy: 'adaptive'
});

// Ring characteristics:
// - O(n) connections
// - Predictable latency
// - Good for pipelines
// - Token-based coordination
```

```
       ┌───────┐
       │Agent1 │
       └───┬───┘
           │
    ┌──────▼──────┐
    │Agent6│Agent2│
    └──┬───┴───┬──┘
       │       │
    ┌──▼───────▼──┐
    │Agent5│Agent3│
    └──────┬──────┘
           │
       ┌───▼───┐
       │Agent4 │
       └───────┘
```

#### Star Topology (Centralized)
Central hub coordinating all agents. Best for simple coordination with clear leader.

```javascript
await mcp__ruv_swarm__swarm_init({
  topology: 'star',
  maxAgents: 10,
  strategy: 'balanced'
});

// Star characteristics:
// - O(n) connections
// - Simple coordination
// - Hub bottleneck risk
// - Easy to monitor
```

```
      ┌───────┐
      │Agent1 │
      └───┬───┘
          │
   ┌──────▼──────┐
   │Agent5  Agent2│
   └──┬─────┬────┘
      │ HUB │
   ┌──▼─────▼────┐
   │Agent4  Agent3│
   └─────────────┘
```

## Agent Types

### Core Agents

```javascript
// Researcher - Information gathering
await mcp__ruv_swarm__agent_spawn({
  type: 'researcher',
  name: 'research-agent',
  capabilities: ['web-search', 'document-analysis', 'summarization']
});

// Coder - Code generation and modification
await mcp__ruv_swarm__agent_spawn({
  type: 'coder',
  name: 'code-agent',
  capabilities: ['javascript', 'python', 'testing', 'debugging']
});

// Analyst - Data analysis and insights
await mcp__ruv_swarm__agent_spawn({
  type: 'analyst',
  name: 'analyst-agent',
  capabilities: ['data-analysis', 'visualization', 'reporting']
});

// Optimizer - Performance optimization
await mcp__ruv_swarm__agent_spawn({
  type: 'optimizer',
  name: 'optimizer-agent',
  capabilities: ['profiling', 'optimization', 'benchmarking']
});

// Coordinator - Swarm coordination
await mcp__ruv_swarm__agent_spawn({
  type: 'coordinator',
  name: 'coord-agent',
  capabilities: ['task-distribution', 'monitoring', 'consensus']
});
```

## Task Orchestration

### Basic Task Execution

```javascript
// Orchestrate a task
const task = await mcp__ruv_swarm__task_orchestrate({
  task: 'Build a REST API for user management with authentication',
  strategy: 'parallel',  // or 'sequential', 'adaptive'
  priority: 'high',      // or 'low', 'medium', 'critical'
  maxAgents: 5
});

// Check task status
const status = await mcp__ruv_swarm__task_status({
  taskId: task.taskId,
  detailed: true
});

// Get results
const results = await mcp__ruv_swarm__task_results({
  taskId: task.taskId,
  format: 'detailed'  // or 'summary', 'raw'
});
```

### Execution Strategies

```javascript
// Parallel: All agents work simultaneously
await mcp__ruv_swarm__task_orchestrate({
  task: 'Analyze multiple codebases',
  strategy: 'parallel',
  // Best for: Independent subtasks, research, testing
});

// Sequential: One agent after another
await mcp__ruv_swarm__task_orchestrate({
  task: 'Design, implement, test, deploy',
  strategy: 'sequential',
  // Best for: Dependencies between tasks, pipelines
});

// Adaptive: System decides based on task analysis
await mcp__ruv_swarm__task_orchestrate({
  task: 'Complex feature implementation',
  strategy: 'adaptive',
  // Best for: Unknown complexity, mixed dependencies
});
```

## Decentralized Autonomous Agents (DAA)

### DAA Initialization

```javascript
// Initialize DAA service
await mcp__ruv_swarm__daa_init({
  enableLearning: true,
  enableCoordination: true,
  persistenceMode: 'disk'  // or 'memory', 'auto'
});
```

### Creating Autonomous Agents

```javascript
// Create autonomous agent with learning
await mcp__ruv_swarm__daa_agent_create({
  id: 'auto-agent-1',
  capabilities: ['code-analysis', 'optimization'],
  cognitivePattern: 'adaptive',  // convergent, divergent, lateral, systems, critical
  enableMemory: true,
  learningRate: 0.1
});

// Available cognitive patterns:
// - convergent: Focused, logical problem-solving
// - divergent: Creative, multiple solution generation
// - lateral: Unconventional, cross-domain thinking
// - systems: Holistic, interconnected analysis
// - critical: Analytical, evidence-based reasoning
// - adaptive: Switches patterns based on task
```

### Agent Adaptation

```javascript
// Adapt agent based on feedback
await mcp__ruv_swarm__daa_agent_adapt({
  agentId: 'auto-agent-1',
  performanceScore: 0.85,
  feedback: 'Good analysis but missed edge cases',
  suggestions: [
    'Consider boundary conditions',
    'Test with empty inputs',
    'Add error handling scenarios'
  ]
});
```

### DAA Workflows

```javascript
// Create autonomous workflow
await mcp__ruv_swarm__daa_workflow_create({
  id: 'code-review-flow',
  name: 'Automated Code Review',
  steps: [
    { id: 'analyze', action: 'static-analysis' },
    { id: 'security', action: 'security-scan' },
    { id: 'quality', action: 'quality-metrics' },
    { id: 'report', action: 'generate-report' }
  ],
  strategy: 'adaptive',
  dependencies: {
    security: ['analyze'],
    quality: ['analyze'],
    report: ['security', 'quality']
  }
});

// Execute workflow
await mcp__ruv_swarm__daa_workflow_execute({
  workflowId: 'code-review-flow',
  agentIds: ['auto-agent-1', 'auto-agent-2'],
  parallelExecution: true
});
```

### Knowledge Sharing

```javascript
// Share knowledge between agents
await mcp__ruv_swarm__daa_knowledge_share({
  sourceAgentId: 'expert-agent',
  targetAgentIds: ['learner-1', 'learner-2'],
  knowledgeDomain: 'security-patterns',
  knowledgeContent: {
    patterns: ['SQL injection', 'XSS', 'CSRF'],
    examples: [...],
    mitigations: [...]
  }
});
```

### Meta-Learning

```javascript
// Enable meta-learning across domains
await mcp__ruv_swarm__daa_meta_learning({
  sourceDomain: 'code-optimization',
  targetDomain: 'query-optimization',
  transferMode: 'adaptive',  // or 'direct', 'gradual'
  agentIds: ['agent-1', 'agent-2']
});
```

### Cognitive Pattern Management

```javascript
// Analyze agent's cognitive patterns
const analysis = await mcp__ruv_swarm__daa_cognitive_pattern({
  agentId: 'auto-agent-1',
  action: 'analyze'
});

// Change cognitive pattern
await mcp__ruv_swarm__daa_cognitive_pattern({
  agentId: 'auto-agent-1',
  action: 'change',
  pattern: 'systems'  // Switch to systems thinking
});
```

## Neural Features

### Neural Training

```javascript
// Train neural agents
await mcp__ruv_swarm__neural_train({
  iterations: 100,
  agentId: 'neural-agent-1'  // optional, trains all if not specified
});
```

### Neural Patterns

```javascript
// Get cognitive pattern information
const patterns = await mcp__ruv_swarm__neural_patterns({
  pattern: 'all'  // or specific: 'convergent', 'divergent', etc.
});

// Pattern types:
// - convergent: Focused analytical reasoning
// - divergent: Creative exploration
// - lateral: Cross-domain connections
// - systems: Holistic understanding
// - critical: Evidence-based analysis
// - abstract: High-level conceptualization
```

### Neural Status

```javascript
// Check neural agent status
const status = await mcp__ruv_swarm__neural_status({
  agentId: 'neural-agent-1'
});
```

## Monitoring and Metrics

### Swarm Status

```javascript
// Get swarm status
const status = await mcp__ruv_swarm__swarm_status({
  verbose: true  // Include detailed agent information
});
```

### Agent Metrics

```javascript
// Get agent performance metrics
const metrics = await mcp__ruv_swarm__agent_metrics({
  agentId: 'agent-1',  // optional
  metric: 'all'  // or 'cpu', 'memory', 'tasks', 'performance'
});
```

### Swarm Monitoring

```javascript
// Real-time monitoring
const monitor = await mcp__ruv_swarm__swarm_monitor({
  duration: 60,   // seconds
  interval: 5     // update every 5 seconds
});
```

### Agent Listing

```javascript
// List all agents
const agents = await mcp__ruv_swarm__agent_list({
  filter: 'all'  // or 'active', 'idle', 'busy'
});
```

## Memory Management

### Memory Usage

```javascript
// Get memory statistics
const memory = await mcp__ruv_swarm__memory_usage({
  detail: 'detailed'  // or 'summary', 'by-agent'
});
```

## Benchmarking

### Performance Benchmarks

```javascript
// Run benchmarks
const benchmark = await mcp__ruv_swarm__benchmark_run({
  type: 'all',  // or 'wasm', 'swarm', 'agent', 'task'
  iterations: 50
});
```

### Feature Detection

```javascript
// Detect available features
const features = await mcp__ruv_swarm__features_detect({
  category: 'all'  // or 'wasm', 'simd', 'memory', 'platform'
});
```

## DAA Performance Metrics

```javascript
// Get comprehensive DAA metrics
const daaMetrics = await mcp__ruv_swarm__daa_performance_metrics({
  category: 'all',  // or 'system', 'performance', 'efficiency', 'neural'
  timeRange: '24h'  // or '1h', '7d'
});

// Get learning status
const learning = await mcp__ruv_swarm__daa_learning_status({
  agentId: 'auto-agent-1',  // optional
  detailed: true
});
```

## Complete Example: Full-Stack Development

```javascript
// 1. Initialize swarm
await mcp__ruv_swarm__swarm_init({
  topology: 'hierarchical',
  maxAgents: 10,
  strategy: 'specialized'
});

// 2. Initialize DAA
await mcp__ruv_swarm__daa_init({
  enableLearning: true,
  enableCoordination: true,
  persistenceMode: 'disk'
});

// 3. Create specialized agents
await mcp__ruv_swarm__daa_agent_create({
  id: 'architect',
  capabilities: ['system-design', 'architecture'],
  cognitivePattern: 'systems',
  enableMemory: true
});

await mcp__ruv_swarm__daa_agent_create({
  id: 'backend-dev',
  capabilities: ['nodejs', 'express', 'postgresql'],
  cognitivePattern: 'convergent',
  enableMemory: true
});

await mcp__ruv_swarm__daa_agent_create({
  id: 'frontend-dev',
  capabilities: ['react', 'typescript', 'css'],
  cognitivePattern: 'divergent',
  enableMemory: true
});

await mcp__ruv_swarm__daa_agent_create({
  id: 'qa-engineer',
  capabilities: ['testing', 'automation', 'security'],
  cognitivePattern: 'critical',
  enableMemory: true
});

// 4. Create workflow
await mcp__ruv_swarm__daa_workflow_create({
  id: 'fullstack-build',
  name: 'Full-Stack Application Build',
  steps: [
    { id: 'design', action: 'system-design', agent: 'architect' },
    { id: 'api', action: 'build-api', agent: 'backend-dev' },
    { id: 'ui', action: 'build-ui', agent: 'frontend-dev' },
    { id: 'test', action: 'test-all', agent: 'qa-engineer' }
  ],
  strategy: 'adaptive',
  dependencies: {
    api: ['design'],
    ui: ['design'],
    test: ['api', 'ui']
  }
});

// 5. Execute workflow
const execution = await mcp__ruv_swarm__daa_workflow_execute({
  workflowId: 'fullstack-build',
  agentIds: ['architect', 'backend-dev', 'frontend-dev', 'qa-engineer'],
  parallelExecution: true
});

// 6. Monitor progress
const status = await mcp__ruv_swarm__swarm_status({ verbose: true });

// 7. Get metrics
const metrics = await mcp__ruv_swarm__daa_performance_metrics({
  category: 'all'
});

// 8. Adapt based on results
await mcp__ruv_swarm__daa_agent_adapt({
  agentId: 'backend-dev',
  performanceScore: 0.92,
  feedback: 'Excellent API design, consider adding rate limiting'
});
```

## MCP Tool Reference

### Swarm Management
| Tool | Purpose |
|------|---------|
| `swarm_init` | Initialize swarm with topology |
| `swarm_status` | Get swarm status |
| `swarm_monitor` | Real-time monitoring |

### Agent Management
| Tool | Purpose |
|------|---------|
| `agent_spawn` | Create new agent |
| `agent_list` | List all agents |
| `agent_metrics` | Agent performance metrics |

### Task Orchestration
| Tool | Purpose |
|------|---------|
| `task_orchestrate` | Execute complex task |
| `task_status` | Check task progress |
| `task_results` | Get task results |

### DAA Tools
| Tool | Purpose |
|------|---------|
| `daa_init` | Initialize DAA service |
| `daa_agent_create` | Create autonomous agent |
| `daa_agent_adapt` | Adapt agent from feedback |
| `daa_workflow_create` | Create autonomous workflow |
| `daa_workflow_execute` | Execute workflow |
| `daa_knowledge_share` | Share knowledge |
| `daa_learning_status` | Learning progress |
| `daa_cognitive_pattern` | Manage cognitive patterns |
| `daa_meta_learning` | Cross-domain learning |
| `daa_performance_metrics` | DAA metrics |

### Neural Tools
| Tool | Purpose |
|------|---------|
| `neural_train` | Train neural agents |
| `neural_patterns` | Cognitive patterns |
| `neural_status` | Neural agent status |

### Utility Tools
| Tool | Purpose |
|------|---------|
| `benchmark_run` | Performance benchmarks |
| `features_detect` | Feature detection |
| `memory_usage` | Memory statistics |

## Best Practices

1. **Choose appropriate topology**: Mesh for <10 agents, hierarchical for complex workflows
2. **Use DAA for learning tasks**: Agents improve over time with feedback
3. **Enable persistence**: Use `persistenceMode: 'disk'` for production
4. **Monitor continuously**: Use `swarm_monitor` for real-time insights
5. **Adapt agents regularly**: Provide feedback for continuous improvement
6. **Share knowledge**: Use `daa_knowledge_share` for team learning
7. **Match cognitive patterns**: Assign patterns based on task type

This guide covers the complete ruv-swarm functionality for building sophisticated multi-agent systems.
