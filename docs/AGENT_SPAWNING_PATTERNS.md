Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:28:02 EST

# Agent Spawning Patterns: Complete Reference Guide

## Overview

This comprehensive guide covers all 150+ agent types available in Claude-Flow and Agentic-Flow, including spawning patterns, capability matching algorithms, coordination topologies, and performance optimization strategies.

---

## Table of Contents

1. [Complete Agent Catalog (150+ Types)](#complete-agent-catalog-150-types)
2. [Agent Capability Matching Algorithms](#agent-capability-matching-algorithms)
3. [Parallel Agent Spawning (10-20x Faster)](#parallel-agent-spawning-10-20x-faster)
4. [Agent Lifecycle Management](#agent-lifecycle-management)
5. [Coordination Topologies](#coordination-topologies)
6. [Best Practices by Task Type](#best-practices-by-task-type)
7. [Performance Benchmarks](#performance-benchmarks)
8. [Configuration Reference](#configuration-reference)

---

## Complete Agent Catalog (150+ Types)

### Core Development Agents (12 Types)

| Agent | Type | Priority | Capabilities |
|-------|------|----------|--------------|
| `coder` | developer | high | code_generation, refactoring, optimization, api_design |
| `researcher` | analyst | high | code_analysis, pattern_recognition, documentation_research |
| `tester` | validator | high | unit_testing, integration_testing, e2e_testing, security_testing |
| `reviewer` | validator | medium | code_review, security_audit, performance_analysis, best_practices |
| `planner` | coordinator | high | task_decomposition, dependency_analysis, resource_allocation |
| `analyst` | analyst | medium | data_analysis, performance_monitoring, reporting, trend_analysis |
| `backend-dev` | specialist | high | rest_api, graphql, database_design, authentication |
| `mobile-dev` | specialist | high | react_native, ios, android, mobile_ux |
| `ml-developer` | specialist | high | model_development, data_preprocessing, model_evaluation |
| `security-engineer` | specialist | high | vulnerability_scanning, penetration_testing, security_auditing |
| `cicd-engineer` | specialist | medium | pipeline_creation, automation, infrastructure_management |
| `api-docs` | specialist | medium | openapi, swagger, documentation |

**Spawning Example:**
```javascript
// Single agent spawn via MCP
mcp__claude-flow__agent_spawn({
  type: "coder",
  name: "FeatureImplementer",
  capabilities: ["code_generation", "refactoring", "optimization"]
})

// Via Claude Code Task tool (recommended for execution)
await Task("Implement feature", `
  Implement user authentication module with:
  - JWT token generation
  - Password hashing with bcrypt
  - Session management
  Follow existing patterns in the codebase.
`, "coder");
```

---

### Swarm Coordination Agents (8 Types)

| Agent | Type | Topology | Use Case |
|-------|------|----------|----------|
| `hierarchical-coordinator` | coordinator | tree | Clear command structure, large teams |
| `mesh-coordinator` | coordinator | mesh | Fault tolerance, P2P collaboration |
| `adaptive-coordinator` | coordinator | dynamic | Variable workloads, auto-optimization |
| `ring-coordinator` | coordinator | ring | Sequential processing, token-passing |
| `star-coordinator` | coordinator | star | Central coordination, simple projects |
| `swarm-memory-manager` | coordinator | any | Cross-agent memory sync |
| `smart-agent` | coordinator | any | Adaptive learning, intelligent routing |
| `task-orchestrator` | coordinator | any | Task distribution, progress tracking |

**Spawning Example:**
```javascript
// Initialize mesh swarm with 8 agents
mcp__claude-flow__swarm_init({
  topology: "mesh",
  maxAgents: 8,
  strategy: "distributed"
})

// Spawn mesh node
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "MeshNode-1",
  capabilities: ["distributed_coordination", "peer_communication", "fault_tolerance"]
})
```

---

### Hive-Mind Agents (5 Types)

| Agent | Role | Capabilities |
|-------|------|--------------|
| `queen-coordinator` | sovereign | strategic_command, resource_allocation, governance |
| `worker-specialist` | worker | task_execution, parallel_processing, specialization |
| `scout-explorer` | scout | information_gathering, threat_detection, reconnaissance |
| `collective-intelligence-coordinator` | coordinator | knowledge_aggregation, pattern_synthesis, consensus_building |
| `memory-coordinator` | coordinator | state_persistence, knowledge_storage, context_management |

**Hive-Mind Architecture:**
```
        QUEEN (Strategic Command)
       /   |   |   \
   SCOUT  WORKER WORKER COLLECTIVE
    ↓       ↓       ↓       ↓
  INTEL   TASKS   TASKS  SYNTHESIS
```

**Spawning Example:**
```javascript
// Initialize hive-mind hierarchy
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 10,
  strategy: "centralized"
})

// Spawn queen
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "QueenCoordinator",
  capabilities: ["strategic_command", "resource_allocation", "governance"],
  priority: "critical"
})

// Spawn workers
mcp__claude-flow__agent_spawn({
  type: "specialist",
  name: "Worker-1",
  capabilities: ["task_execution", "parallel_processing"]
})
```

---

### Consensus Agents (7 Types)

| Agent | Protocol | Fault Tolerance | Use Case |
|-------|----------|-----------------|----------|
| `byzantine-coordinator` | pBFT | 33% faulty nodes | High-security, untrusted participants |
| `raft-manager` | Raft | N/2 nodes | Strong consistency, leader-based |
| `gossip-coordinator` | Gossip | Partition tolerant | Large scale, eventual consistency |
| `consensus-builder` | Multi | Configurable | Custom consensus requirements |
| `crdt-synchronizer` | CRDTs | Conflict-free | Offline-first, concurrent updates |
| `quorum-manager` | Quorum | Configurable | Dynamic membership, voting |
| `security-manager` | N/A | N/A | Authentication, access control |

**Byzantine Fault Tolerance Example:**
```javascript
// Initialize BFT cluster with 7 nodes (tolerates 2 failures)
mcp__claude-flow__swarm_init({
  topology: "mesh",
  maxAgents: 7,
  strategy: "balanced"
})

mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "ByzantineValidator-1",
  capabilities: ["bft_consensus", "validator_management", "fault_detection"]
})

// PBFT Protocol Phases:
// 1. Pre-Prepare: Primary broadcasts proposed operation
// 2. Prepare: Backup nodes verify and broadcast
// 3. Commit: Execute after 2f+1 commit messages
```

---

### SPARC Methodology Agents (6 Types)

| Agent | Phase | Focus |
|-------|-------|-------|
| `specification` | Specification | Requirements analysis, constraint identification |
| `pseudocode` | Pseudocode | Algorithm design, complexity analysis |
| `architecture` | Architecture | System design, component structuring |
| `refinement` | Refinement | TDD implementation, optimization |
| `completion` | Completion | Validation, documentation, deployment |
| `sparc-coord` | Coordination | Phase orchestration, quality gates |

**SPARC Workflow:**
```javascript
// Complete SPARC pipeline
await mcp__claude-flow__task_orchestrate({
  task: "Build authentication system using SPARC methodology",
  strategy: "sequential",
  priority: "high"
});

// Or spawn individual phase agents
await Task("Specification", "Analyze auth requirements...", "specification");
await Task("Pseudocode", "Design auth algorithm...", "pseudocode");
await Task("Architecture", "Design auth system...", "architecture");
await Task("Refinement", "Implement with TDD...", "refinement");
await Task("Completion", "Validate and document...", "completion");
```

---

### GitHub Integration Agents (10 Types)

| Agent | Scope | Actions |
|-------|-------|---------|
| `github-modes` | Multi-mode | Various GitHub operations |
| `pr-manager` | Pull Requests | Create, review, merge, close |
| `code-review-swarm` | Reviews | Multi-agent parallel review |
| `issue-tracker` | Issues | Triage, assign, label, track |
| `release-manager` | Releases | Version, changelog, deploy |
| `workflow-automation` | CI/CD | GitHub Actions specialist |
| `project-board-sync` | Projects | Board management, automation |
| `repo-architect` | Repository | Structure, standards, governance |
| `multi-repo-swarm` | Multi-repo | Cross-repository coordination |
| `production-validator` | Validation | Pre-production checks |

**Code Review Swarm Example:**
```javascript
// Deploy review swarm for comprehensive PR analysis
await Task("Security Review", "Check for vulnerabilities...", "security-engineer");
await Task("Performance Review", "Analyze performance...", "perf-analyzer");
await Task("Style Review", "Check code style...", "reviewer");
await Task("Test Coverage", "Verify test coverage...", "tester");

// Aggregate findings via coordination
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/shared/review-findings",
  namespace: "coordination",
  value: JSON.stringify({
    security: [...],
    performance: [...],
    style: [...],
    coverage: {...}
  })
})
```

---

### Performance & Optimization Agents (5 Types)

| Agent | Focus | Metrics |
|-------|-------|---------|
| `perf-analyzer` | Bottleneck analysis | CPU, memory, I/O |
| `performance-benchmarker` | Benchmarking | Throughput, latency |
| `performance-engineer` | Optimization | Hotspots, tuning |
| `memory-coordinator` | Memory | Allocation, GC, leaks |
| `optimizer` | General | Multi-objective optimization |

---

### Template & Migration Agents (6 Types)

| Agent | Purpose |
|-------|---------|
| `base-template-generator` | Create project templates |
| `orchestrator-task` | Task orchestration templates |
| `system-architect` | Architecture templates |
| `code-analyzer` | Analysis templates |
| `migration-planner` | Migration strategy |
| `tdd-london-swarm` | TDD methodology |

---

### Additional Specialized Agents (91+ Types)

The complete catalog includes 150+ agent configurations with specialized variants:

- **Frontend Agents**: `frontend-architect`, `ui-developer`, `ux-researcher`
- **Database Agents**: `db-architect`, `query-optimizer`, `migration-specialist`
- **DevOps Agents**: `kubernetes-engineer`, `terraform-specialist`, `monitoring-setup`
- **Documentation Agents**: `technical-writer`, `api-documenter`, `readme-generator`
- **Research Agents**: `deep-research-agent`, `root-cause-analyst`, `requirements-analyst`
- **Quality Agents**: `quality-engineer`, `refactoring-expert`, `learning-guide`

---

## Agent Capability Matching Algorithms

### 1. Task-to-Agent Matching

The capability matching system uses a weighted scoring algorithm:

```javascript
function matchAgentToTask(task, availableAgents) {
  const scores = availableAgents.map(agent => ({
    agent,
    score: calculateMatchScore(task, agent)
  }));

  return scores.sort((a, b) => b.score - a.score)[0].agent;
}

function calculateMatchScore(task, agent) {
  let score = 0;

  // Capability overlap (40% weight)
  const requiredCapabilities = extractCapabilities(task);
  const overlap = agent.capabilities.filter(c =>
    requiredCapabilities.includes(c)
  ).length;
  score += (overlap / requiredCapabilities.length) * 40;

  // Priority match (20% weight)
  if (task.priority === agent.priority) score += 20;

  // Type match (25% weight)
  if (task.type === agent.type) score += 25;

  // Historical performance (15% weight)
  score += agent.successRate * 15;

  return score;
}
```

### 2. MCP Capability Matching Tool

```javascript
// Use the DAA capability matching tool
mcp__claude-flow__daa_capability_match({
  task_requirements: [
    "code_generation",
    "typescript",
    "testing",
    "security_review"
  ],
  available_agents: ["coder-1", "tester-1", "reviewer-1"]
})
```

### 3. Automatic Agent Selection Matrix

| Task Type | Primary Agent | Secondary Agents |
|-----------|---------------|------------------|
| Feature Implementation | `coder` | `tester`, `reviewer` |
| Bug Investigation | `researcher` | `coder`, `tester` |
| Code Review | `reviewer` | `security-engineer`, `perf-analyzer` |
| Architecture Design | `system-architect` | `planner`, `researcher` |
| Performance Tuning | `perf-analyzer` | `coder`, `performance-benchmarker` |
| Security Audit | `security-engineer` | `reviewer`, `tester` |
| Documentation | `api-docs` | `technical-writer`, `researcher` |
| Refactoring | `coder` | `reviewer`, `tester` |
| Testing | `tester` | `quality-engineer`, `coder` |
| Release | `release-manager` | `cicd-engineer`, `production-validator` |

---

## Parallel Agent Spawning (10-20x Faster)

### The `agents_spawn_parallel` Tool

The parallel spawning tool provides 10-20x performance improvement over sequential spawning:

```javascript
// Spawn 6 agents in parallel (10-20x faster than sequential)
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "researcher", name: "data-analyzer", capabilities: ["analysis"] },
    { type: "coder", name: "api-developer", capabilities: ["code_generation"] },
    { type: "coder", name: "frontend-developer", capabilities: ["ui_development"] },
    { type: "tester", name: "qa-engineer", capabilities: ["testing"] },
    { type: "reviewer", name: "code-reviewer", capabilities: ["review"] },
    { type: "architect", name: "system-designer", capabilities: ["architecture"] }
  ],
  maxConcurrency: 5,  // Max parallel spawns
  batchSize: 3        // Agents per batch
})
```

### Performance Comparison

| Spawning Method | 6 Agents | 12 Agents | 20 Agents |
|-----------------|----------|-----------|-----------|
| Sequential | 6s | 12s | 20s |
| Parallel (batch=3) | 0.6s | 1.2s | 2s |
| Parallel (batch=5) | 0.4s | 0.8s | 1.4s |
| **Speedup** | **10-15x** | **10-15x** | **10-20x** |

### Resource-Aware Parallel Spawning Rules

```
| CPU Usage | Memory Usage | Recommended Max Parallel Agents |
|-----------|--------------|--------------------------------|
| < 50%     | < 60%        | Up to 10 agents                |
| 50-75%    | 60-80%       | Up to 5 agents                 |
| > 75%     | > 80%        | Up to 3 agents                 |
| > 90%     | > 90%        | Single agent only              |
```

### Parallel Spawning Patterns

#### Pattern 1: Full-Stack Development Swarm

```javascript
// Single message spawns all agents in parallel
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "coder", name: "backend-dev", capabilities: ["rest_api", "database"] },
    { type: "coder", name: "frontend-dev", capabilities: ["react", "typescript"] },
    { type: "coder", name: "mobile-dev", capabilities: ["react_native"] },
    { type: "tester", name: "qa-backend", capabilities: ["api_testing"] },
    { type: "tester", name: "qa-frontend", capabilities: ["e2e_testing"] },
    { type: "reviewer", name: "tech-lead", capabilities: ["code_review"] },
    { type: "architect", name: "system-arch", capabilities: ["system_design"] },
    { type: "cicd-engineer", name: "devops", capabilities: ["pipeline"] }
  ],
  maxConcurrency: 8,
  batchSize: 4
})
```

#### Pattern 2: Code Review Swarm

```javascript
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "reviewer", name: "security-reviewer", capabilities: ["security_audit"] },
    { type: "reviewer", name: "perf-reviewer", capabilities: ["performance_analysis"] },
    { type: "reviewer", name: "style-reviewer", capabilities: ["best_practices"] },
    { type: "tester", name: "coverage-checker", capabilities: ["test_coverage"] }
  ],
  maxConcurrency: 4,
  batchSize: 4
})
```

#### Pattern 3: Research & Analysis Swarm

```javascript
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "researcher", name: "tech-researcher", capabilities: ["technology_research"] },
    { type: "researcher", name: "market-researcher", capabilities: ["market_analysis"] },
    { type: "analyst", name: "data-analyst", capabilities: ["data_analysis"] },
    { type: "planner", name: "strategy-planner", capabilities: ["roadmap_planning"] }
  ],
  maxConcurrency: 4,
  batchSize: 2
})
```

---

## Agent Lifecycle Management

### Lifecycle States

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT LIFECYCLE                          │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ SPAWNING │ -> │  ACTIVE  │ -> │ COMPLETE │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│       │              │  ^             │                    │
│       v              v  │             v                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  FAILED  │    │ WAITING  │    │ ARCHIVED │             │
│  └──────────┘    └──────────┘    └──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Lifecycle Management API

```javascript
// Create agent
mcp__claude-flow__daa_agent_create({
  agent_type: "coder",
  capabilities: ["code_generation", "refactoring"],
  resources: {
    maxTokens: 100000,
    timeout: 300000
  }
})

// Manage lifecycle
mcp__claude-flow__daa_lifecycle_manage({
  agentId: "agent-123",
  action: "pause"  // pause, resume, terminate, restart
})

// Monitor agent health
mcp__claude-flow__agent_metrics({
  agentId: "agent-123",
  metric: "all"  // all, cpu, memory, tasks, performance
})

// Fault tolerance
mcp__claude-flow__daa_fault_tolerance({
  agentId: "agent-123",
  strategy: "restart"  // restart, failover, ignore, escalate
})
```

### Session Management with Hooks

```bash
# Before work
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"

# During work
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"

# After work
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Memory Coordination Pattern

```javascript
// Report agent status
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/coder/status",
  namespace: "coordination",
  value: JSON.stringify({
    agent: "coder",
    status: "active",
    currentTask: "implementing auth",
    progress: 45,
    files: ["auth.service.ts", "auth.controller.ts"],
    timestamp: Date.now()
  })
})

// Share work results
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/shared/implementation",
  namespace: "coordination",
  value: JSON.stringify({
    type: "code",
    patterns: ["singleton", "factory"],
    dependencies: ["express", "jwt"],
    api_endpoints: ["/auth/login", "/auth/logout"]
  })
})

// Retrieve other agent's work
const results = await mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "swarm/shared/research-findings",
  namespace: "coordination"
})
```

---

## Coordination Topologies

### 1. Hierarchical Topology

**Architecture:**
```
           QUEEN (You)
          /   |   |   \
      RESEARCH CODE ANALYST TEST
       WORKERS WORKERS WORKERS WORKERS
```

**Configuration:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 10,
  strategy: "centralized"
})
```

**Configuration Options:**
```yaml
hierarchical:
  max_depth: 3               # Maximum hierarchy levels
  delegation_style: "direct" # direct, delegated, autonomous
  reporting_interval: 5000   # Status update frequency (ms)
  escalation_threshold: 0.7  # Performance threshold for escalation
```

**When to Use:**
- Large-scale projects requiring clear command structure
- Projects with well-defined hierarchies
- Situations requiring centralized decision-making
- Coordinating specialized worker teams

---

### 2. Mesh Topology

**Architecture:**
```
    MESH TOPOLOGY
   A <-> B <-> C
   ^     ^     ^
   D <-> E <-> F
   ^     ^     ^
   G <-> H <-> I
```

**Configuration:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "mesh",
  maxAgents: 12,
  strategy: "distributed"
})
```

**Configuration Options:**
```yaml
mesh:
  connectivity: 3-5           # Connections per node
  gossip_interval: 2000       # Gossip protocol interval (ms)
  fanout_factor: 3            # Peers per gossip round
  consensus_threshold: 0.67   # Quorum requirement
  partition_tolerance: true   # Handle network splits
```

**When to Use:**
- Systems requiring high availability
- Distributed computing scenarios
- Fault-tolerant architectures
- Peer-to-peer collaboration

---

### 3. Ring Topology

**Architecture:**
```
        A --> B
        ^     |
        |     v
        D <-- C
```

**Configuration:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "ring",
  maxAgents: 8,
  strategy: "sequential"
})
```

**Configuration Options:**
```yaml
ring:
  token_timeout: 5000      # Token holding timeout (ms)
  rotation_direction: "cw" # clockwise, counter-clockwise
  skip_failed_nodes: true  # Skip unresponsive nodes
```

**When to Use:**
- Sequential processing pipelines
- Token-based coordination
- Ordered task execution
- Round-robin processing

---

### 4. Star Topology

**Architecture:**
```
        B
        |
    A --HUB-- C
        |
        D
```

**Configuration:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "star",
  maxAgents: 8,
  strategy: "balanced"
})
```

**Configuration Options:**
```yaml
star:
  hub_failover: true       # Enable hub failover
  backup_hubs: 1           # Number of backup hubs
  spoke_timeout: 10000     # Spoke response timeout (ms)
```

**When to Use:**
- Central coordination required
- Simple projects with clear leader
- Hub-and-spoke communication patterns
- Broadcast-heavy workloads

---

### 5. Adaptive Topology

Dynamically switches between topologies based on workload:

```javascript
mcp__claude-flow__swarm_init({
  topology: "star",        // Starting topology
  strategy: "adaptive",    // Enable adaptive switching
  maxAgents: 10
})

// Optimize topology based on current workload
mcp__claude-flow__topology_optimize({
  swarmId: "swarm-123"
})
```

**Switching Rules:**
| Workload Pattern | Recommended Topology |
|------------------|---------------------|
| Centralized decisions | Hierarchical |
| High fault tolerance | Mesh |
| Sequential pipeline | Ring |
| Simple coordination | Star |

---

## Best Practices by Task Type

### 1. Feature Development

```javascript
// Recommended: Parallel swarm with coder, tester, reviewer
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "coder", name: "feature-dev", capabilities: ["code_generation"] },
    { type: "tester", name: "test-dev", capabilities: ["unit_testing"] },
    { type: "reviewer", name: "code-review", capabilities: ["code_review"] }
  ],
  maxConcurrency: 3
})

// Coordination pattern
await Task("Implement feature", "...", "coder");
await Task("Write tests", "...", "tester");
await Task("Review code", "...", "reviewer");
```

### 2. Bug Investigation

```javascript
// Sequential approach: Research -> Fix -> Test
await Task("Investigate", "Analyze the bug...", "researcher");
// Use findings for fix
await Task("Fix", "Based on research: ...", "coder");
await Task("Verify", "Confirm fix works...", "tester");
```

### 3. Architecture Design

```javascript
// Hierarchical topology for clear decision making
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 5,
  strategy: "centralized"
})

await Task("Design system", "...", "system-architect");
await Task("Review design", "...", "reviewer");
await Task("Document", "...", "api-docs");
```

### 4. Code Review

```javascript
// Parallel review swarm for comprehensive coverage
mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "reviewer", name: "security", capabilities: ["security_audit"] },
    { type: "reviewer", name: "performance", capabilities: ["performance_analysis"] },
    { type: "reviewer", name: "style", capabilities: ["best_practices"] },
    { type: "tester", name: "coverage", capabilities: ["test_coverage"] }
  ],
  maxConcurrency: 4
})
```

### 5. Release Preparation

```javascript
// Sequential pipeline for release
mcp__claude-flow__swarm_init({
  topology: "ring",
  maxAgents: 6,
  strategy: "sequential"
})

// Pipeline: Test -> Review -> Build -> Deploy -> Validate
await Task("Run tests", "...", "tester");
await Task("Final review", "...", "reviewer");
await Task("Build release", "...", "cicd-engineer");
await Task("Deploy", "...", "cicd-engineer");
await Task("Validate", "...", "production-validator");
```

### 6. Large-Scale Refactoring

```javascript
// Mesh topology for fault-tolerant parallel work
mcp__claude-flow__swarm_init({
  topology: "mesh",
  maxAgents: 10,
  strategy: "distributed"
})

mcp__claude-flow__agents_spawn_parallel({
  agents: [
    { type: "coder", name: "refactor-1", capabilities: ["refactoring"] },
    { type: "coder", name: "refactor-2", capabilities: ["refactoring"] },
    { type: "coder", name: "refactor-3", capabilities: ["refactoring"] },
    { type: "tester", name: "regression-1", capabilities: ["testing"] },
    { type: "tester", name: "regression-2", capabilities: ["testing"] },
    { type: "reviewer", name: "quality", capabilities: ["code_review"] }
  ],
  maxConcurrency: 6
})
```

---

## Performance Benchmarks

### Spawning Performance

| Method | 1 Agent | 5 Agents | 10 Agents | 20 Agents |
|--------|---------|----------|-----------|-----------|
| Sequential | 1s | 5s | 10s | 20s |
| Parallel (batch=3) | 1s | 1.7s | 3.4s | 6.8s |
| Parallel (batch=5) | 1s | 1s | 2s | 4s |
| **Improvement** | 1x | **3-5x** | **3-5x** | **3-5x** |

### Swarm Coordination Overhead

| Topology | Latency | Throughput | Fault Tolerance |
|----------|---------|------------|-----------------|
| Star | Low (2ms) | High | Low (SPOF) |
| Ring | Medium (5ms) | Medium | Medium |
| Hierarchical | Medium (4ms) | High | Medium |
| Mesh | High (8ms) | Medium | High |

### Memory Coordination

| Operation | Latency | Notes |
|-----------|---------|-------|
| Store | <5ms | Namespace-based storage |
| Retrieve | <3ms | Key-value lookup |
| Search | <10ms | Pattern matching |
| Sync | <15ms | Cross-instance |

### Claude-Flow Performance Metrics

| Metric | Value |
|--------|-------|
| SWE-Bench Solve Rate | 84.8% |
| Token Reduction | 32.3% |
| Speed Improvement | 2.8-4.4x |
| Neural Models | 27+ |

---

## Configuration Reference

### Complete Swarm Configuration

```yaml
# claude-flow-swarm.yaml
swarm:
  topology: "hierarchical"  # hierarchical, mesh, ring, star
  maxAgents: 10
  strategy: "balanced"      # balanced, specialized, adaptive

coordination:
  memory:
    namespace: "swarm"
    ttl: 3600000            # 1 hour
    sync_interval: 5000     # 5 seconds

  consensus:
    protocol: "raft"        # raft, pbft, gossip
    quorum: 0.67
    timeout: 10000

  hooks:
    pre_task: true
    post_task: true
    post_edit: true
    session_management: true

agents:
  defaults:
    timeout: 300000         # 5 minutes
    maxTokens: 100000
    retries: 3

  types:
    coder:
      priority: "high"
      capabilities:
        - code_generation
        - refactoring
        - optimization

    researcher:
      priority: "high"
      capabilities:
        - code_analysis
        - pattern_recognition
        - documentation_research

    tester:
      priority: "high"
      capabilities:
        - unit_testing
        - integration_testing
        - security_testing

performance:
  parallel_spawning:
    enabled: true
    max_concurrency: 5
    batch_size: 3

  resource_limits:
    cpu_threshold: 75
    memory_threshold: 80
    scale_down_at: 90

monitoring:
  enabled: true
  metrics:
    - agent_performance
    - task_completion
    - memory_usage
    - coordination_overhead
```

### Agent Spawn Configuration

```javascript
// Complete agent spawn configuration
mcp__claude-flow__agent_spawn({
  type: "coder",                    // Required: agent type
  name: "FeatureDeveloper",         // Optional: custom name
  capabilities: [                    // Optional: specific capabilities
    "code_generation",
    "refactoring",
    "typescript",
    "testing"
  ],
  swarmId: "swarm-123",             // Optional: join specific swarm
  priority: "high",                 // Optional: low, medium, high, critical
  resources: {                       // Optional: resource limits
    maxTokens: 100000,
    timeout: 300000
  }
})
```

### Task Orchestration Configuration

```javascript
mcp__claude-flow__task_orchestrate({
  task: "Build authentication system",  // Required: task description
  strategy: "parallel",                  // parallel, sequential, adaptive, balanced
  priority: "high",                      // low, medium, high, critical
  maxAgents: 5,                          // Maximum agents to use
  dependencies: [                         // Optional: task dependencies
    "task-1",
    "task-2"
  ]
})
```

---

## Quick Reference Card

### Essential MCP Commands

```javascript
// Initialize swarm
mcp__claude-flow__swarm_init({ topology: "mesh", maxAgents: 10 })

// Spawn single agent
mcp__claude-flow__agent_spawn({ type: "coder", name: "Dev1" })

// Spawn parallel agents (10-20x faster)
mcp__claude-flow__agents_spawn_parallel({ agents: [...], maxConcurrency: 5 })

// Orchestrate task
mcp__claude-flow__task_orchestrate({ task: "Build API", strategy: "parallel" })

// Store memory
mcp__claude-flow__memory_usage({ action: "store", key: "key", value: "data" })

// Check status
mcp__claude-flow__swarm_status({})
mcp__claude-flow__agent_list({})
mcp__claude-flow__task_status({ taskId: "task-123" })
```

### Topology Quick Selection

| Requirement | Topology |
|-------------|----------|
| Clear command chain | Hierarchical |
| Maximum fault tolerance | Mesh |
| Sequential pipeline | Ring |
| Simple coordination | Star |
| Variable workload | Adaptive |

### Agent Quick Selection

| Task | Primary Agent |
|------|---------------|
| Code implementation | `coder` |
| Research/investigation | `researcher` |
| Testing | `tester` |
| Code review | `reviewer` |
| Architecture | `system-architect` |
| Security | `security-engineer` |
| Performance | `perf-analyzer` |
| Documentation | `api-docs` |
| CI/CD | `cicd-engineer` |
| Release | `release-manager` |

---

## Related Documentation

- [Agent Reference Complete](./AGENT_REFERENCE_COMPLETE.md)
- [Agent Types Catalog](./AGENT_TYPES_CATALOG.md)
- [Agentic-Flow Knowledge Base](./AGENTIC-FLOW-V2-KNOWLEDGE-BASE.md)
- [Hive-Mind Consensus](./HIVE_MIND_CONSENSUS.md)
- [Memory Architectures](./MEMORY_ARCHITECTURES_COMPLETE.md)

---

*Generated from Claude-Flow v2.0.0 and Agentic-Flow v2.0.1-alpha.5 documentation. For the latest updates, refer to the official repositories.*
