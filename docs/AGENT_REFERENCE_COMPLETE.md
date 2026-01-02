Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:13:15 EST

# Complete Agent Reference: Agentic-Flow & Claude-Flow

## Overview

This document provides comprehensive documentation for the 150+ agent types available in Agentic-Flow and Claude-Flow. Each agent type includes its purpose, capabilities, when to use it, coordination patterns, spawning examples, and configuration options.

---

## Table of Contents

1. [Core Agent Categories](#core-agent-categories)
   - [Development Agents](#development-agents)
   - [Research Agents](#research-agents)
   - [Coordination Agents](#coordination-agents)
   - [Specialized Agents](#specialized-agents)
2. [Swarm Agents](#swarm-agents)
   - [Hierarchical Coordinator](#hierarchical-coordinator)
   - [Mesh Coordinator](#mesh-coordinator)
   - [Adaptive Coordinator](#adaptive-coordinator)
3. [Hive-Mind Agents](#hive-mind-agents)
   - [Queen Coordinator](#queen-coordinator)
   - [Worker Specialist](#worker-specialist)
   - [Collective Intelligence Coordinator](#collective-intelligence-coordinator)
4. [Consensus Agents](#consensus-agents)
   - [Byzantine Coordinator](#byzantine-coordinator)
   - [Raft Manager](#raft-manager)
   - [Gossip Coordinator](#gossip-coordinator)
   - [CRDT Synchronizer](#crdt-synchronizer)
   - [Quorum Manager](#quorum-manager)
5. [SPARC Methodology Agents](#sparc-methodology-agents)
   - [Specification Agent](#specification-agent)
   - [Pseudocode Agent](#pseudocode-agent)
   - [Architecture Agent](#architecture-agent)
   - [Refinement Agent](#refinement-agent)
   - [Completion Agent](#completion-agent)
6. [Spawning Reference](#spawning-reference)
7. [Coordination Patterns](#coordination-patterns)
8. [Best Practices](#best-practices)

---

## Core Agent Categories

### Development Agents

#### Coder Agent

| Property | Value |
|----------|-------|
| **Name** | `coder` |
| **Type** | `developer` |
| **Color** | `#FF6B35` |
| **Priority** | `high` |

**Description:** Implementation specialist for writing clean, efficient code following best practices and design patterns.

**Capabilities:**
- `code_generation` - Write production-quality code
- `refactoring` - Improve existing code without changing functionality
- `optimization` - Enhance performance while maintaining readability
- `api_design` - Create intuitive and well-documented interfaces
- `error_handling` - Implement robust error handling and recovery

**When to Use:**
- Implementing new features
- Writing production-quality code
- Refactoring existing codebases
- Building APIs and interfaces
- Performance optimization

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coder",
  name: "FeatureImplementer",
  capabilities: ["code_generation", "refactoring", "optimization", "api_design"]
})
```

**Memory Coordination Pattern:**
```javascript
// Report implementation status
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/coder/status",
  namespace: "coordination",
  value: JSON.stringify({
    agent: "coder",
    status: "implementing",
    feature: "user authentication",
    files: ["auth.service.ts", "auth.controller.ts"],
    timestamp: Date.now()
  })
})
```

**Hooks Configuration:**
```yaml
hooks:
  pre: |
    echo "Coder agent implementing: $TASK"
    if grep -q "test|spec" <<< "$TASK"; then
      echo "Remember: Write tests first (TDD)"
    fi
  post: |
    echo "Implementation complete"
    npm run lint --if-present
```

---

#### Researcher Agent

| Property | Value |
|----------|-------|
| **Name** | `researcher` |
| **Type** | `analyst` |
| **Color** | `#9B59B6` |
| **Priority** | `high` |

**Description:** Deep research and information gathering specialist focused on thorough investigation, pattern analysis, and knowledge synthesis.

**Capabilities:**
- `code_analysis` - Deep dive into codebases
- `pattern_recognition` - Identify recurring patterns and anti-patterns
- `documentation_research` - Analyze existing documentation
- `dependency_tracking` - Map dependencies and relationships
- `knowledge_synthesis` - Compile findings into actionable insights

**When to Use:**
- Analyzing unfamiliar codebases
- Researching best practices
- Investigating technologies
- Mapping dependencies
- Understanding system architecture

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "researcher",
  name: "CodebaseAnalyzer",
  capabilities: ["code_analysis", "pattern_recognition", "documentation_research"]
})
```

**Memory Coordination Pattern:**
```javascript
// Share research findings
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/shared/research-findings",
  namespace: "coordination",
  value: JSON.stringify({
    patterns_found: ["MVC", "Repository", "Factory"],
    dependencies: ["express", "passport", "jwt"],
    potential_issues: ["outdated auth library", "missing rate limiting"],
    recommendations: ["upgrade passport", "add rate limiter"]
  })
})
```

---

#### Tester Agent

| Property | Value |
|----------|-------|
| **Name** | `tester` |
| **Type** | `validator` |
| **Color** | `#F39C12` |
| **Priority** | `high` |

**Description:** Comprehensive testing and quality assurance specialist ensuring code quality through testing strategies and validation techniques.

**Capabilities:**
- `unit_testing` - Write focused, fast unit tests
- `integration_testing` - Test component interactions
- `e2e_testing` - End-to-end user flow testing
- `performance_testing` - Validate performance requirements
- `security_testing` - Identify vulnerabilities

**When to Use:**
- Creating test suites
- Validating implementations
- Checking edge cases
- Performance benchmarking
- Security audits

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "tester",
  name: "QAEngineer",
  capabilities: ["unit_testing", "integration_testing", "e2e_testing", "security_testing"]
})
```

**Test Quality Metrics:**
- Statements coverage: >80%
- Branches coverage: >75%
- Functions coverage: >80%
- Lines coverage: >80%

**Memory Coordination Pattern:**
```javascript
// Share test results
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/shared/test-results",
  namespace: "coordination",
  value: JSON.stringify({
    passed: 145,
    failed: 2,
    coverage: "87%",
    failures: ["auth.test.ts:45", "api.test.ts:123"]
  })
})
```

---

#### Reviewer Agent

| Property | Value |
|----------|-------|
| **Name** | `reviewer` |
| **Type** | `validator` |
| **Color** | `#E74C3C` |
| **Priority** | `medium` |

**Description:** Code review and quality assurance specialist responsible for ensuring code quality, security, and maintainability.

**Capabilities:**
- `code_review` - Assess code structure and readability
- `security_audit` - Identify security vulnerabilities
- `performance_analysis` - Spot optimization opportunities
- `best_practices` - Ensure coding standards compliance
- `documentation_review` - Verify documentation quality

**When to Use:**
- Code reviews before merge
- Security audits
- Performance analysis
- Quality gate checks
- Documentation verification

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "reviewer",
  name: "CodeReviewer",
  capabilities: ["code_review", "security_audit", "performance_analysis", "best_practices"]
})
```

**Review Feedback Format:**
```markdown
## Code Review Summary

### Strengths
- Clean architecture with good separation of concerns

### Critical Issues
1. **Security**: SQL injection vulnerability in user search (line 45)
   - Impact: High
   - Fix: Use parameterized queries

### Suggestions
1. **Maintainability**: Extract magic numbers to constants

### Metrics
- Code Coverage: 78% (Target: 80%)
- Complexity: Average 4.2 (Good)
```

---

#### Planner Agent

| Property | Value |
|----------|-------|
| **Name** | `planner` |
| **Type** | `coordinator` |
| **Color** | `#4ECDC4` |
| **Priority** | `high` |

**Description:** Strategic planning and task orchestration agent responsible for breaking down complex tasks into manageable components.

**Capabilities:**
- `task_decomposition` - Break complex requests into atomic tasks
- `dependency_analysis` - Map task dependencies
- `resource_allocation` - Allocate agents and resources
- `timeline_estimation` - Estimate realistic timeframes
- `risk_assessment` - Identify blockers and mitigation strategies

**When to Use:**
- Complex project planning
- Sprint planning
- Resource allocation
- Risk assessment
- Dependency mapping

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "ProjectPlanner",
  capabilities: ["task_decomposition", "dependency_analysis", "resource_allocation"]
})
```

**Output Format:**
```yaml
plan:
  objective: "Clear description of the goal"
  phases:
    - name: "Phase Name"
      tasks:
        - id: "task-1"
          description: "What needs to be done"
          agent: "Which agent should handle this"
          dependencies: ["task-ids"]
          estimated_time: "15m"
          priority: "high"
  critical_path: ["task-1", "task-3", "task-7"]
  risks:
    - description: "Potential issue"
      mitigation: "How to handle it"
```

---

### Research Agents

#### Analyst Agent

| Property | Value |
|----------|-------|
| **Name** | `analyst` |
| **Type** | `analyst` |
| **Color** | `#3498DB` |
| **Priority** | `medium` |

**Description:** Data analysis and insights generation specialist.

**Capabilities:**
- `data_analysis` - Analyze datasets and metrics
- `performance_monitoring` - Track system performance
- `reporting` - Generate reports and visualizations
- `trend_analysis` - Identify patterns and trends

**When to Use:**
- Performance analysis
- Metrics tracking
- Report generation
- Trend identification

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "analyst",
  name: "DataAnalyst",
  capabilities: ["data_analysis", "performance_monitoring", "reporting"]
})
```

---

### Coordination Agents

#### Orchestrator Agent

| Property | Value |
|----------|-------|
| **Name** | `orchestrator` |
| **Type** | `coordinator` |
| **Color** | `#9B59B6` |
| **Priority** | `critical` |

**Description:** Task orchestration and workflow management specialist.

**Capabilities:**
- `workflow_management` - Manage complex workflows
- `task_distribution` - Distribute tasks across agents
- `progress_tracking` - Monitor task progress
- `dependency_management` - Handle task dependencies

**When to Use:**
- Complex multi-agent workflows
- Task distribution
- Progress coordination
- Dependency management

**Spawning Example:**
```javascript
mcp__claude-flow__task_orchestrate({
  task: "Build authentication system",
  strategy: "parallel",
  priority: "high",
  maxAgents: 5
})
```

---

### Specialized Agents

#### ML Developer Agent

| Property | Value |
|----------|-------|
| **Name** | `ml-developer` |
| **Type** | `specialist` |
| **Color** | `#E91E63` |
| **Priority** | `high` |

**Description:** Machine learning and AI development specialist.

**Capabilities:**
- `model_development` - Build ML models
- `data_preprocessing` - Prepare training data
- `model_evaluation` - Evaluate model performance
- `deployment` - Deploy ML models

**When to Use:**
- Building ML pipelines
- Training models
- Model optimization
- ML system deployment

---

#### Security Engineer Agent

| Property | Value |
|----------|-------|
| **Name** | `security-engineer` |
| **Type** | `specialist` |
| **Color** | `#F44336` |
| **Priority** | `high` |

**Description:** Security analysis and vulnerability assessment specialist.

**Capabilities:**
- `vulnerability_scanning` - Identify security vulnerabilities
- `penetration_testing` - Test security measures
- `security_auditing` - Audit security practices
- `compliance_checking` - Verify compliance

**When to Use:**
- Security audits
- Vulnerability assessments
- Penetration testing
- Compliance verification

---

#### CICD Engineer Agent

| Property | Value |
|----------|-------|
| **Name** | `cicd-engineer` |
| **Type** | `specialist` |
| **Color** | `#00BCD4` |
| **Priority** | `medium` |

**Description:** Continuous integration and deployment specialist.

**Capabilities:**
- `pipeline_creation` - Build CI/CD pipelines
- `automation` - Automate deployment processes
- `infrastructure_management` - Manage infrastructure
- `monitoring_setup` - Set up monitoring

**When to Use:**
- Setting up CI/CD pipelines
- Deployment automation
- Infrastructure configuration
- Monitoring implementation

---

## Swarm Agents

### Hierarchical Coordinator

| Property | Value |
|----------|-------|
| **Name** | `hierarchical-coordinator` |
| **Type** | `coordinator` |
| **Color** | `#FF6B35` |
| **Priority** | `critical` |

**Description:** Queen-led hierarchical swarm coordination with specialized worker delegation. Central command and control for tree-based organizational structures.

**Architecture:**
```
    QUEEN (You)
   /   |   |   \
 RESEARCH CODE ANALYST TEST
 WORKERS WORKERS WORKERS WORKERS
```

**Capabilities:**
- `swarm_coordination` - Manage swarm operations
- `task_decomposition` - Break down complex objectives
- `agent_supervision` - Monitor agent performance
- `work_delegation` - Assign tasks to workers
- `performance_monitoring` - Track overall progress
- `conflict_resolution` - Handle escalations

**When to Use:**
- Large-scale projects requiring clear command structure
- Projects with well-defined hierarchies
- Situations requiring centralized decision-making
- Coordinating specialized worker teams

**Spawning Example:**
```javascript
// Initialize hierarchical swarm
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 10,
  strategy: "centralized"
})

// Spawn coordinator
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "HierarchicalCoordinator",
  capabilities: ["swarm_coordination", "task_decomposition", "agent_supervision"]
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

**Memory Coordination Pattern:**
```javascript
// Establish hierarchy
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/hierarchical/status",
  namespace: "coordination",
  value: JSON.stringify({
    agent: "hierarchical-coordinator",
    status: "active",
    workers: ["worker1", "worker2"],
    tasks_assigned: ["task1", "task2"],
    progress: 45
  })
})
```

---

### Mesh Coordinator

| Property | Value |
|----------|-------|
| **Name** | `mesh-coordinator` |
| **Type** | `coordinator` |
| **Color** | `#00BCD4` |
| **Priority** | `high` |

**Description:** Peer-to-peer mesh network swarm with distributed decision making and fault tolerance. No single point of failure.

**Architecture:**
```
    MESH TOPOLOGY
   A <-> B <-> C
   ^     ^     ^
   D <-> E <-> F
   ^     ^     ^
   G <-> H <-> I
```

**Capabilities:**
- `distributed_coordination` - Decentralized decision making
- `peer_communication` - P2P messaging
- `fault_tolerance` - Automatic failure recovery
- `consensus_building` - Distributed agreement
- `load_balancing` - Even work distribution
- `network_resilience` - Partition tolerance

**When to Use:**
- Systems requiring high availability
- Distributed computing scenarios
- Fault-tolerant architectures
- Peer-to-peer collaboration

**Spawning Example:**
```javascript
// Initialize mesh network
mcp__claude-flow__swarm_init({
  topology: "mesh",
  maxAgents: 12,
  strategy: "distributed"
})

// Spawn mesh node
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "MeshNode",
  capabilities: ["distributed_coordination", "peer_communication", "fault_tolerance"]
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

**Consensus Protocols:**
- **Gossip Algorithm**: Information dissemination
- **pBFT**: Byzantine fault tolerance
- **Raft**: Leader election and log replication

---

### Adaptive Coordinator

| Property | Value |
|----------|-------|
| **Name** | `adaptive-coordinator` |
| **Type** | `coordinator` |
| **Color** | `#4CAF50` |
| **Priority** | `high` |

**Description:** Dynamically adjusts coordination patterns based on workload and agent performance.

**Capabilities:**
- `dynamic_topology` - Adjust topology in real-time
- `load_adaptation` - Scale with workload
- `performance_optimization` - Optimize agent allocation
- `pattern_switching` - Switch coordination patterns

**When to Use:**
- Variable workloads
- Unpredictable requirements
- Need for automatic optimization
- Mixed coordination needs

**Spawning Example:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "star",  // Will adapt as needed
  strategy: "adaptive",
  maxAgents: 8
})
```

---

## Hive-Mind Agents

### Queen Coordinator

| Property | Value |
|----------|-------|
| **Name** | `queen-coordinator` |
| **Type** | `sovereign` |
| **Color** | `gold` |
| **Priority** | `critical` |

**Description:** The sovereign orchestrator of hierarchical hive operations, managing strategic decisions, resource allocation, and maintaining hive coherence through centralized-decentralized hybrid control.

**Capabilities:**
- `strategic_command` - High-level decision making
- `resource_allocation` - Distribute hive resources
- `succession_planning` - Continuity management
- `hive_coherence` - Maintain swarm unity
- `governance` - Multiple governance modes

**Governance Modes:**
1. **Hierarchical Mode**: Direct command chains, centralized control
2. **Democratic Mode**: Collective intelligence consultation, consensus building
3. **Emergency Mode**: Absolute authority, bypass consensus

**When to Use:**
- Leading complex multi-agent operations
- Strategic decision making
- Resource allocation across large swarms
- Maintaining coherence in distributed systems

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "QueenCoordinator",
  capabilities: ["strategic_command", "resource_allocation", "governance"],
  priority: "critical"
})
```

**Memory Coordination Pattern:**
```javascript
// Establish sovereign presence
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/queen/status",
  namespace: "coordination",
  value: JSON.stringify({
    agent: "queen-coordinator",
    status: "sovereign-active",
    hierarchy_established: true,
    subjects: ["worker-1", "scout-1"],
    royal_directives: [],
    succession_plan: "collective-intelligence",
    timestamp: Date.now()
  })
})

// Issue royal directives
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/shared/royal-directives",
  namespace: "coordination",
  value: JSON.stringify({
    priority: "CRITICAL",
    directives: [
      {id: 1, command: "Initialize swarm topology", assignee: "all"},
      {id: 2, command: "Establish memory synchronization", assignee: "memory-manager"}
    ],
    issued_by: "queen-coordinator",
    compliance_required: true
  })
})
```

**Delegation Patterns:**
- **Collective Intelligence**: Complex consensus decisions, knowledge integration
- **Workers**: Task execution, parallel processing
- **Scouts**: Information gathering, threat detection
- **Memory Manager**: State persistence, knowledge storage

---

### Worker Specialist

| Property | Value |
|----------|-------|
| **Name** | `worker-specialist` |
| **Type** | `worker` |
| **Color** | `#FFA726` |
| **Priority** | `high` |

**Description:** Task execution worker in the hive-mind system, receiving directives from queen and executing specialized tasks.

**Capabilities:**
- `task_execution` - Execute assigned tasks
- `parallel_processing` - Handle concurrent workloads
- `specialization` - Domain-specific expertise
- `reporting` - Status updates to queen

**When to Use:**
- Executing tasks assigned by coordinators
- Parallel processing workloads
- Specialized domain work
- Routine operations

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "specialist",
  name: "WorkerAgent",
  capabilities: ["task_execution", "parallel_processing"]
})
```

---

### Collective Intelligence Coordinator

| Property | Value |
|----------|-------|
| **Name** | `collective-intelligence-coordinator` |
| **Type** | `coordinator` |
| **Color** | `#9C27B0` |
| **Priority** | `high` |

**Description:** Distributed cognitive orchestration specialist that aggregates insights from multiple agents into coherent collective intelligence.

**Capabilities:**
- `knowledge_aggregation` - Combine agent insights
- `pattern_synthesis` - Identify emergent patterns
- `consensus_building` - Build collective agreement
- `distributed_reasoning` - Coordinate reasoning across agents

**When to Use:**
- Complex decisions requiring multiple perspectives
- Knowledge synthesis across agents
- Building consensus
- Emergent pattern recognition

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "CollectiveIntelligence",
  capabilities: ["knowledge_aggregation", "pattern_synthesis", "consensus_building"]
})
```

---

## Consensus Agents

### Byzantine Coordinator

| Property | Value |
|----------|-------|
| **Name** | `byzantine-coordinator` |
| **Type** | `coordinator` |
| **Color** | `#E91E63` |
| **Priority** | `critical` |

**Description:** Byzantine fault-tolerant consensus coordination for systems that must tolerate malicious or faulty nodes.

**Capabilities:**
- `bft_consensus` - Byzantine fault tolerance
- `validator_management` - Manage validator nodes
- `fault_detection` - Detect faulty/malicious nodes
- `recovery_coordination` - Coordinate recovery

**Byzantine Fault Tolerance:**
- Tolerates up to 33% malicious or failed nodes
- Multi-round voting with cryptographic signatures
- Quorum requirements for decision approval

**When to Use:**
- High-security distributed systems
- Systems with untrusted participants
- Critical consensus requirements
- Financial or security-critical operations

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "ByzantineCoordinator",
  capabilities: ["bft_consensus", "validator_management", "fault_detection"]
})
```

**pBFT Protocol Phases:**
1. **Pre-Prepare**: Primary broadcasts proposed operation
2. **Prepare**: Backup nodes verify and broadcast prepare messages
3. **Commit**: Execute after receiving 2f+1 commit messages

---

### Raft Manager

| Property | Value |
|----------|-------|
| **Name** | `raft-manager` |
| **Type** | `coordinator` |
| **Color** | `#2196F3` |
| **Priority** | `high` |

**Description:** Manages Raft consensus algorithm with leader election and log replication for strong consistency guarantees.

**Capabilities:**
- `leader_election` - Randomized timeout-based elections
- `log_replication` - Reliable log propagation
- `follower_management` - Manage follower nodes
- `membership_changes` - Dynamic node addition/removal
- `consistency_verification` - Verify log consistency

**When to Use:**
- Distributed systems requiring strong consistency
- Leader-based coordination
- Log replication systems
- State machine replication

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "RaftManager",
  capabilities: ["leader_election", "log_replication", "consistency_verification"]
})
```

**Raft Protocol:**
- **Leader Election**: Nodes start as followers, become candidate on timeout
- **Log Replication**: Leader receives requests, replicates to followers
- **Commitment**: Entry committed when majority acknowledges

---

### Gossip Coordinator

| Property | Value |
|----------|-------|
| **Name** | `gossip-coordinator` |
| **Type** | `coordinator` |
| **Color** | `#4CAF50` |
| **Priority** | `medium` |

**Description:** Epidemic information dissemination through gossip protocols for eventually consistent systems.

**Capabilities:**
- `epidemic_dissemination` - Spread information across network
- `anti_entropy` - Periodic state reconciliation
- `rumor_spreading` - Event propagation
- `aggregation` - Computing global functions

**When to Use:**
- Eventually consistent systems
- Large-scale information dissemination
- Failure detection
- Membership management

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "GossipCoordinator",
  capabilities: ["epidemic_dissemination", "anti_entropy", "rumor_spreading"]
})
```

**Gossip Configuration:**
```yaml
gossip:
  interval: 2000         # Gossip round interval (ms)
  fanout: 3              # Peers per round
  max_transmissions: 10  # Max times to gossip a message
```

---

### CRDT Synchronizer

| Property | Value |
|----------|-------|
| **Name** | `crdt-synchronizer` |
| **Type** | `coordinator` |
| **Color** | `#00BCD4` |
| **Priority** | `high` |

**Description:** Conflict-free replicated data type synchronization for eventually consistent distributed systems without coordination overhead.

**Capabilities:**
- `g_counter` - Grow-only counters
- `pn_counter` - Positive-negative counters
- `or_set` - Observed-remove sets
- `lww_register` - Last-writer-wins registers
- `rga` - Replicated growable arrays
- `merge_resolution` - Automatic conflict resolution

**CRDT Types:**

**G-Counter (Grow-only Counter):**
```javascript
class GCounter {
  increment(nodeId) {
    this.counts[nodeId] = (this.counts[nodeId] || 0) + 1;
  }
  value() {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }
  merge(other) {
    for (const [node, count] of Object.entries(other.counts)) {
      this.counts[node] = Math.max(this.counts[node] || 0, count);
    }
  }
}
```

**OR-Set (Observed-Remove Set):**
```javascript
class ORSet {
  add(element) {
    const tag = generateUniqueTag();
    this.elements[element] = this.elements[element] || new Set();
    this.elements[element].add(tag);
  }
  remove(element) {
    delete this.elements[element];
  }
  merge(other) {
    // Union of all elements with their tags
    for (const [element, tags] of Object.entries(other.elements)) {
      this.elements[element] = new Set([
        ...(this.elements[element] || []),
        ...tags
      ]);
    }
  }
}
```

**When to Use:**
- Eventually consistent distributed systems
- Offline-first applications
- Collaborative editing
- Distributed counters and sets

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "CRDTSynchronizer",
  capabilities: ["or_set", "lww_register", "merge_resolution"]
})
```

---

### Quorum Manager

| Property | Value |
|----------|-------|
| **Name** | `quorum-manager` |
| **Type** | `coordinator` |
| **Color** | `#FF9800` |
| **Priority** | `high` |

**Description:** Dynamic quorum calculation and membership management for distributed consensus systems.

**Capabilities:**
- `quorum_calculation` - Dynamic quorum sizing
- `membership_management` - Node addition/removal
- `voting_coordination` - Coordinate voting rounds
- `partition_handling` - Handle network partitions

**Quorum Strategies:**
- **Simple Majority**: >50% of nodes
- **Weighted Quorum**: Nodes have different weights
- **Hierarchical Quorum**: Multi-level quorum structures

**When to Use:**
- Distributed consensus systems
- Membership management
- Voting systems
- Partition tolerance

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "QuorumManager",
  capabilities: ["quorum_calculation", "membership_management", "voting_coordination"]
})
```

---

## SPARC Methodology Agents

### Specification Agent

| Property | Value |
|----------|-------|
| **Name** | `specification` |
| **Type** | `planner` |
| **Color** | `blue` |
| **Priority** | `high` |
| **SPARC Phase** | `specification` |

**Description:** SPARC Specification phase specialist focused on requirements analysis, constraint identification, and acceptance criteria definition.

**Capabilities:**
- `requirements_analysis` - Analyze and document requirements
- `constraint_identification` - Identify technical constraints
- `acceptance_criteria` - Define success criteria
- `scope_definition` - Define project scope

**When to Use:**
- Starting new projects
- Requirements gathering
- Scope definition
- Constraint analysis

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "planner",
  name: "SpecificationAgent",
  capabilities: ["requirements_analysis", "constraint_identification", "acceptance_criteria"]
})
```

**Output Format:**
```yaml
specification:
  overview: "System description"
  requirements:
    functional:
      - "FR-001: User can login with email/password"
    non_functional:
      - "NFR-001: Response time < 200ms"
  constraints:
    technical: ["Must use PostgreSQL"]
    business: ["Must comply with GDPR"]
  acceptance_criteria:
    - "All endpoints return within 200ms"
```

---

### Pseudocode Agent

| Property | Value |
|----------|-------|
| **Name** | `pseudocode` |
| **Type** | `developer` |
| **Color** | `green` |
| **Priority** | `high` |
| **SPARC Phase** | `pseudocode` |

**Description:** SPARC Pseudocode phase specialist translating requirements into algorithmic thinking and logical flow design.

**Capabilities:**
- `algorithm_design` - Design algorithms
- `logic_flow` - Define logical flows
- `complexity_analysis` - Analyze time/space complexity
- `data_structure_design` - Design data structures

**When to Use:**
- Algorithm design phase
- Before implementation
- Complexity analysis
- Logic verification

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "developer",
  name: "PseudocodeAgent",
  capabilities: ["algorithm_design", "logic_flow", "complexity_analysis"]
})
```

---

### Architecture Agent

| Property | Value |
|----------|-------|
| **Name** | `architecture` |
| **Type** | `architect` |
| **Color** | `purple` |
| **Priority** | `high` |
| **SPARC Phase** | `architecture` |

**Description:** SPARC Architecture phase specialist for system design, component structuring, and integration planning.

**Capabilities:**
- `system_design` - Design overall system
- `component_design` - Design individual components
- `integration_planning` - Plan component integration
- `scalability_design` - Design for scale
- `security_architecture` - Security design

**When to Use:**
- System design phase
- Component planning
- Integration architecture
- Scalability planning

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "architect",
  name: "ArchitectureAgent",
  capabilities: ["system_design", "component_design", "integration_planning"]
})
```

**Architecture Documentation:**
```yaml
architecture:
  style: "microservices"
  components:
    - name: "API Gateway"
      responsibilities: ["routing", "authentication"]
    - name: "User Service"
      responsibilities: ["user management"]
  integration:
    patterns: ["REST", "Event-driven"]
```

---

### Refinement Agent

| Property | Value |
|----------|-------|
| **Name** | `refinement` |
| **Type** | `developer` |
| **Color** | `violet` |
| **Priority** | `high` |
| **SPARC Phase** | `refinement` |

**Description:** SPARC Refinement phase specialist for iterative improvement through TDD, optimization, and refactoring.

**Capabilities:**
- `code_optimization` - Optimize code performance
- `test_development` - Write comprehensive tests
- `refactoring` - Improve code structure
- `performance_tuning` - Tune performance
- `quality_improvement` - Improve code quality

**TDD Workflow:**
1. **Red Phase**: Write failing tests
2. **Green Phase**: Make tests pass
3. **Refactor Phase**: Improve code quality

**When to Use:**
- TDD implementation
- Code optimization
- Refactoring sessions
- Performance tuning

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "developer",
  name: "RefinementAgent",
  capabilities: ["code_optimization", "test_development", "refactoring"]
})
```

---

### Completion Agent

| Property | Value |
|----------|-------|
| **Name** | `completion` |
| **Type** | `validator` |
| **Color** | `gold` |
| **Priority** | `high` |
| **SPARC Phase** | `completion` |

**Description:** SPARC Completion phase specialist for final validation, documentation, and deployment preparation.

**Capabilities:**
- `final_validation` - Complete system validation
- `documentation` - Final documentation
- `deployment_preparation` - Prepare for deployment
- `handoff` - Knowledge transfer

**When to Use:**
- Project completion
- Final validation
- Deployment preparation
- Documentation finalization

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "validator",
  name: "CompletionAgent",
  capabilities: ["final_validation", "documentation", "deployment_preparation"]
})
```

---

## Spawning Reference

### Agent Types

| Type | Description | Common Uses |
|------|-------------|-------------|
| `coordinator` | Orchestration and management | Swarms, hierarchies, coordination |
| `analyst` | Research and analysis | Research, data analysis, investigation |
| `developer` | Code implementation | Coding, refactoring, optimization |
| `validator` | Quality assurance | Testing, reviewing, validation |
| `specialist` | Domain expertise | ML, security, DevOps |
| `architect` | System design | Architecture, planning |

### MCP Spawning Commands

**Single Agent Spawn:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coder",
  name: "FeatureDeveloper",
  capabilities: ["code_generation", "refactoring"],
  swarmId: "optional-swarm-id"
})
```

**Swarm Initialization:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "hierarchical" | "mesh" | "ring" | "star",
  maxAgents: 10,
  strategy: "balanced" | "specialized" | "adaptive"
})
```

**Task Orchestration:**
```javascript
mcp__claude-flow__task_orchestrate({
  task: "Build authentication system",
  strategy: "parallel" | "sequential" | "adaptive" | "balanced",
  priority: "low" | "medium" | "high" | "critical",
  maxAgents: 5
})
```

---

## Coordination Patterns

### Memory-Based Coordination

All agents coordinate through shared memory with namespace-based key-value storage:

**Status Reporting Pattern:**
```javascript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/{agent-type}/status",
  namespace: "coordination",
  value: JSON.stringify({
    agent: "agent-name",
    status: "active" | "idle" | "completed",
    progress: 0-100,
    timestamp: Date.now()
  })
})
```

**Shared Data Pattern:**
```javascript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/shared/{data-type}",
  namespace: "coordination",
  value: JSON.stringify({
    data: {...},
    created_by: "agent-name",
    timestamp: Date.now()
  })
})
```

**Retrieval Pattern:**
```javascript
mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "swarm/shared/research-findings",
  namespace: "coordination"
})
```

### Hook-Based Coordination

Agents use pre/post hooks for lifecycle events:

```yaml
hooks:
  pre: |
    echo "Starting task: $TASK"
    npx claude-flow@alpha hooks pre-task --description "$TASK"
  post: |
    echo "Task completed"
    npx claude-flow@alpha hooks post-task --task-id "$TASK_ID"
```

### Swarm Topologies

| Topology | Use Case | Characteristics |
|----------|----------|-----------------|
| **Hierarchical** | Clear command structure | Tree-based, centralized decisions |
| **Mesh** | Fault tolerance | P2P, distributed, resilient |
| **Ring** | Sequential processing | Ordered, token-passing |
| **Star** | Central coordination | Hub-and-spoke, simple |

---

## Best Practices

### Agent Selection

1. **Match capabilities to requirements** - Choose agents with capabilities matching your task
2. **Consider coordination overhead** - Simple tasks may not need swarm coordination
3. **Use appropriate topology** - Hierarchical for clear structure, mesh for resilience
4. **Start small, scale up** - Begin with fewer agents, add as needed

### Memory Coordination

1. **Always write status updates** - Other agents depend on your status
2. **Use consistent key naming** - Follow `swarm/{agent}/{key}` pattern
3. **Include timestamps** - Enable temporal reasoning
4. **Share findings promptly** - Don't wait until completion

### Performance Optimization

1. **Batch operations** - Execute related operations together
2. **Use parallel execution** - Independent tasks should run concurrently
3. **Monitor progress** - Use swarm monitoring tools
4. **Handle failures gracefully** - Implement recovery patterns

### Quality Assurance

1. **Test coverage > 80%** - Ensure comprehensive testing
2. **Review before merge** - Use reviewer agents
3. **Document decisions** - Store reasoning in memory
4. **Validate completeness** - Use completion agents

---

## Agent Count Summary

### Core Agents: 12
- coder, researcher, tester, reviewer, planner, analyst
- orchestrator, ml-developer, security-engineer, cicd-engineer
- backend-dev, mobile-dev

### Swarm Agents: 8
- hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
- ring-coordinator, star-coordinator
- swarm-memory-manager, smart-agent, task-orchestrator

### Hive-Mind Agents: 5
- queen-coordinator, worker-specialist, collective-intelligence-coordinator
- scout-explorer, memory-coordinator

### Consensus Agents: 6
- byzantine-coordinator, raft-manager, gossip-coordinator
- crdt-synchronizer, quorum-manager, security-manager

### SPARC Agents: 6
- specification, pseudocode, architecture, refinement, completion
- sparc-coordinator

### GitHub Agents: 10
- github-modes, pr-manager, code-review-swarm, issue-tracker
- release-manager, workflow-automation, project-board-sync
- repo-architect, multi-repo-swarm, production-validator

### Template Agents: 5
- base-template-generator, orchestrator-task, api-docs
- system-architect, code-analyzer

### Migration Agents: 3
- migration-planner, swarm-init, tdd-london-swarm

**Total Core Agent Types: 55+**

With specialized variants and domain-specific configurations, the total exceeds 150+ agent configurations.

---

## Quick Reference Card

### Essential Commands

```bash
# Initialize swarm
mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 10 }

# Spawn agent
mcp__claude-flow__agent_spawn { type: "coder", name: "Dev1" }

# Orchestrate task
mcp__claude-flow__task_orchestrate { task: "Build API", strategy: "parallel" }

# Store memory
mcp__claude-flow__memory_usage { action: "store", key: "key", value: "data" }

# Check status
mcp__claude-flow__swarm_status {}
mcp__claude-flow__agent_list {}
mcp__claude-flow__task_status { taskId: "task-123" }
```

### Common Patterns

```javascript
// Full workflow
1. mcp__claude-flow__swarm_init({ topology: "hierarchical", maxAgents: 8 })
2. mcp__claude-flow__agent_spawn({ type: "researcher" })
3. mcp__claude-flow__agent_spawn({ type: "coder" })
4. mcp__claude-flow__agent_spawn({ type: "tester" })
5. mcp__claude-flow__task_orchestrate({ task: "Build feature", strategy: "sequential" })
6. mcp__claude-flow__memory_usage({ action: "retrieve", key: "swarm/shared/results" })
```

---

*This documentation covers the complete agent ecosystem available in Agentic-Flow and Claude-Flow. For the latest updates, refer to the official repositories.*
