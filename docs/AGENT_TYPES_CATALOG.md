Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:11:11 EST

# Complete Agent Types Catalog

## Overview

This catalog documents all 150+ agent types available in Claude-Flow and Agentic-Flow for building intelligent multi-agent systems. Agents are spawned using the Task tool and coordinated through swarm topologies.

## Agent Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENT TAXONOMY                                    │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │  CORE DEV      │  │  SPECIALIZED   │  │  COORDINATION  │        │
│  │  coder         │  │  ml-developer  │  │  coordinator   │        │
│  │  reviewer      │  │  mobile-dev    │  │  orchestrator  │        │
│  │  tester        │  │  backend-dev   │  │  planner       │        │
│  │  architect     │  │  frontend-arch │  │  task-orch     │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │  RESEARCH      │  │  SWARM         │  │  CONSENSUS     │        │
│  │  researcher    │  │  hierarchical  │  │  byzantine     │        │
│  │  analyst       │  │  mesh-coord    │  │  raft-manager  │        │
│  │  explorer      │  │  adaptive      │  │  gossip-coord  │        │
│  │  deep-research │  │  queen-coord   │  │  crdt-sync     │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │  SPARC         │  │  PERFORMANCE   │  │  GITHUB        │        │
│  │  specification │  │  perf-analyzer │  │  pr-manager    │        │
│  │  pseudocode    │  │  benchmarker   │  │  issue-tracker │        │
│  │  architecture  │  │  optimizer     │  │  code-review   │        │
│  │  refinement    │  │  profiler      │  │  release-mgr   │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Development Agents

### coder
**Purpose**: Implementation specialist for writing clean, efficient code.

```javascript
await Task("Implement feature", `
  Implement the user authentication module with:
  - JWT token generation
  - Password hashing with bcrypt
  - Session management
  Follow existing code patterns.
`, "coder");
```

**Capabilities**: Code generation, refactoring, debugging, optimization
**Best For**: Feature implementation, bug fixes, code optimization

### reviewer
**Purpose**: Code review and quality assurance specialist.

```javascript
await Task("Review PR", `
  Review the authentication module for:
  - Security vulnerabilities
  - Code quality and style
  - Performance issues
  - Test coverage
`, "reviewer");
```

**Capabilities**: Static analysis, security review, best practices enforcement
**Best For**: Pull request reviews, code audits, quality gates

### tester
**Purpose**: Comprehensive testing and quality assurance specialist.

```javascript
await Task("Create tests", `
  Create comprehensive test suite for auth module:
  - Unit tests with >90% coverage
  - Integration tests
  - Edge case handling
`, "tester");
```

**Capabilities**: Unit testing, integration testing, TDD, test automation
**Best For**: Test creation, coverage improvement, regression testing

### planner
**Purpose**: Strategic planning and task orchestration.

```javascript
await Task("Plan implementation", `
  Create implementation plan for new feature:
  - Break down into subtasks
  - Identify dependencies
  - Estimate complexity
`, "planner");
```

**Capabilities**: Task decomposition, dependency analysis, roadmap creation
**Best For**: Sprint planning, architecture decisions, project scoping

### researcher
**Purpose**: Deep research and information gathering specialist.

```javascript
await Task("Research options", `
  Research database options for our use case:
  - Compare PostgreSQL vs MongoDB vs CockroachDB
  - Analyze performance characteristics
  - Recommend best fit
`, "researcher");
```

**Capabilities**: Web research, documentation analysis, comparative studies
**Best For**: Technology evaluation, best practices research, problem investigation

## Specialized Development Agents

### system-architect
**Purpose**: High-level system design and architecture decisions.

```javascript
await Task("Design system", `
  Design microservices architecture for e-commerce platform:
  - Service boundaries
  - Data flow diagrams
  - API contracts
  - Scalability considerations
`, "system-architect");
```

### backend-dev
**Purpose**: Backend API development specialist.

```javascript
await Task("Build API", `
  Build REST API with Express.js:
  - CRUD endpoints for products
  - Authentication middleware
  - Rate limiting
  - Error handling
`, "backend-dev");
```

### frontend-architect
**Purpose**: Frontend architecture and UI development.

```javascript
await Task("Design UI", `
  Design React component architecture:
  - Component hierarchy
  - State management strategy
  - Performance optimization
`, "frontend-architect");
```

### mobile-dev
**Purpose**: React Native mobile development.

```javascript
await Task("Build mobile app", `
  Implement mobile authentication flow:
  - Login/signup screens
  - Biometric authentication
  - Secure token storage
`, "mobile-dev");
```

### ml-developer
**Purpose**: Machine learning model development and deployment.

```javascript
await Task("Train model", `
  Develop recommendation model:
  - Feature engineering
  - Model training
  - Evaluation metrics
  - Deployment pipeline
`, "ml-developer");
```

### security-engineer
**Purpose**: Security vulnerability identification and compliance.

```javascript
await Task("Security audit", `
  Perform security audit:
  - OWASP Top 10 check
  - Dependency vulnerabilities
  - Authentication/authorization review
`, "security-engineer");
```

### devops-architect
**Purpose**: Infrastructure and deployment automation.

```javascript
await Task("Setup CI/CD", `
  Configure CI/CD pipeline:
  - GitHub Actions workflow
  - Docker containerization
  - Kubernetes deployment
`, "devops-architect");
```

### cicd-engineer
**Purpose**: GitHub Actions and pipeline optimization.

```javascript
await Task("Optimize pipeline", `
  Optimize build pipeline:
  - Parallel job execution
  - Caching strategies
  - Test splitting
`, "cicd-engineer");
```

### api-docs
**Purpose**: OpenAPI/Swagger documentation specialist.

```javascript
await Task("Document API", `
  Create OpenAPI specification:
  - Endpoint documentation
  - Request/response schemas
  - Authentication examples
`, "api-docs");
```

## Swarm Coordination Agents

### hierarchical-coordinator
**Purpose**: Tree-structured swarm coordination with clear chain of command.

```javascript
await Task("Coordinate team", `
  Coordinate development team with hierarchy:
  - Assign tasks to specialists
  - Aggregate results
  - Report to parent coordinator
`, "hierarchical-coordinator");
```

**Topology**: Tree structure with parent-child relationships
**Best For**: Large teams, clear delegation, complex projects

### mesh-coordinator
**Purpose**: Peer-to-peer coordination with distributed decision making.

```javascript
await Task("Mesh coordination", `
  Coordinate peer agents:
  - Distribute work evenly
  - Enable direct communication
  - Handle node failures
`, "mesh-coordinator");
```

**Topology**: Fully connected mesh
**Best For**: Fault tolerance, equal participation, consensus-based decisions

### adaptive-coordinator
**Purpose**: Dynamic topology switching based on workload.

```javascript
await Task("Adaptive coordination", `
  Dynamically adjust coordination:
  - Monitor workload
  - Switch topology as needed
  - Optimize for current task
`, "adaptive-coordinator");
```

**Topology**: Switches between hierarchical, mesh, star
**Best For**: Variable workloads, optimization, self-organizing systems

### queen-coordinator
**Purpose**: Hive-mind leader for hierarchical swarms.

```javascript
await Task("Lead hive", `
  Lead the hive mind:
  - Strategic decision making
  - Resource allocation
  - Worker delegation
  - Hive coherence
`, "queen-coordinator");
```

**Topology**: Hive-mind with queen and workers
**Best For**: Complex multi-agent tasks, emergent behavior, collective intelligence

### worker-specialist
**Purpose**: Dedicated task execution in hive structures.

```javascript
await Task("Execute task", `
  Execute assigned work:
  - Complete task precisely
  - Report progress
  - Coordinate with peers
`, "worker-specialist");
```

### scout-explorer
**Purpose**: Information reconnaissance for the hive.

```javascript
await Task("Explore territory", `
  Gather intelligence:
  - Explore codebase
  - Report findings
  - Update hive memory
`, "scout-explorer");
```

### collective-intelligence-coordinator
**Purpose**: Distributed cognitive processes across agents.

```javascript
await Task("Collective reasoning", `
  Orchestrate collective decision:
  - Gather perspectives
  - Build consensus
  - Synthesize wisdom
`, "collective-intelligence-coordinator");
```

### swarm-memory-manager
**Purpose**: Distributed memory across the hive mind.

```javascript
await Task("Manage memory", `
  Coordinate swarm memory:
  - Ensure consistency
  - Handle persistence
  - Optimize retrieval
`, "swarm-memory-manager");
```

## Consensus Agents

### byzantine-coordinator
**Purpose**: Byzantine fault-tolerant consensus with malicious actor detection.

```javascript
await Task("BFT consensus", `
  Achieve consensus despite faults:
  - Detect malicious agents
  - Reach agreement
  - Handle network partitions
`, "byzantine-coordinator");
```

**Protocol**: PBFT (Practical Byzantine Fault Tolerance)
**Tolerance**: Up to 1/3 faulty nodes

### raft-manager
**Purpose**: Raft consensus for leader election and log replication.

```javascript
await Task("Raft consensus", `
  Manage Raft cluster:
  - Leader election
  - Log replication
  - Membership changes
`, "raft-manager");
```

**Protocol**: Raft
**Best For**: Strong consistency, leader-based coordination

### gossip-coordinator
**Purpose**: Gossip-based eventual consistency.

```javascript
await Task("Gossip sync", `
  Propagate information via gossip:
  - Epidemic broadcast
  - Failure detection
  - Membership protocol
`, "gossip-coordinator");
```

**Protocol**: Gossip/Epidemic
**Best For**: Large scale, eventual consistency, partition tolerance

### crdt-synchronizer
**Purpose**: Conflict-free replicated data types for state sync.

```javascript
await Task("CRDT sync", `
  Synchronize state with CRDTs:
  - Merge concurrent updates
  - Resolve conflicts automatically
  - Maintain consistency
`, "crdt-synchronizer");
```

**Protocol**: CRDTs (G-Counter, LWW-Register, OR-Set)
**Best For**: Offline-first, concurrent updates, conflict resolution

### quorum-manager
**Purpose**: Dynamic quorum adjustment and membership.

```javascript
await Task("Manage quorum", `
  Manage voting quorum:
  - Adjust for node changes
  - Ensure availability
  - Handle split-brain
`, "quorum-manager");
```

### security-manager
**Purpose**: Security mechanisms for consensus protocols.

```javascript
await Task("Secure consensus", `
  Implement security:
  - Message authentication
  - Replay protection
  - Access control
`, "security-manager");
```

## SPARC Methodology Agents

### specification
**Purpose**: Requirements analysis and specification.

```javascript
await Task("Gather requirements", `
  Analyze and specify requirements:
  - User stories
  - Acceptance criteria
  - Non-functional requirements
`, "specification");
```

### pseudocode
**Purpose**: Algorithm design in pseudocode.

```javascript
await Task("Design algorithm", `
  Design algorithm in pseudocode:
  - Core logic
  - Edge cases
  - Complexity analysis
`, "pseudocode");
```

### architecture
**Purpose**: System architecture design.

```javascript
await Task("Design architecture", `
  Create system architecture:
  - Component diagrams
  - Data flow
  - Integration points
`, "architecture");
```

### refinement
**Purpose**: Iterative improvement and TDD.

```javascript
await Task("Refine implementation", `
  Iteratively improve code:
  - Write tests first
  - Implement to pass
  - Refactor for quality
`, "refinement");
```

### sparc-coder
**Purpose**: Transform specifications into code with TDD.

```javascript
await Task("Implement with TDD", `
  Transform spec to code:
  - Follow TDD cycle
  - Meet acceptance criteria
  - Document as you go
`, "sparc-coder");
```

### sparc-coord
**Purpose**: SPARC methodology orchestration.

```javascript
await Task("Orchestrate SPARC", `
  Coordinate SPARC phases:
  - Sequence phases correctly
  - Manage handoffs
  - Ensure quality gates
`, "sparc-coord");
```

## Performance Agents

### perf-analyzer
**Purpose**: Performance bottleneck analysis.

```javascript
await Task("Analyze performance", `
  Identify performance bottlenecks:
  - Profile execution
  - Memory analysis
  - Database queries
`, "perf-analyzer");
```

### performance-benchmarker
**Purpose**: Comprehensive performance benchmarking.

```javascript
await Task("Run benchmarks", `
  Execute benchmark suite:
  - Throughput tests
  - Latency measurements
  - Regression detection
`, "performance-benchmarker");
```

### performance-engineer
**Purpose**: Measurement-driven optimization.

```javascript
await Task("Optimize performance", `
  Optimize based on measurements:
  - Identify hotspots
  - Apply optimizations
  - Verify improvements
`, "performance-engineer");
```

## GitHub Integration Agents

### pr-manager
**Purpose**: Pull request lifecycle management.

```javascript
await Task("Manage PR", `
  Handle pull request:
  - Create with proper description
  - Request reviews
  - Handle feedback
  - Merge when ready
`, "pr-manager");
```

### issue-tracker
**Purpose**: Intelligent issue management.

```javascript
await Task("Triage issues", `
  Manage GitHub issues:
  - Categorize and prioritize
  - Assign to appropriate team
  - Track progress
`, "issue-tracker");
```

### code-review-swarm
**Purpose**: Multi-agent code review.

```javascript
await Task("Swarm review", `
  Deploy review swarm:
  - Security reviewer
  - Performance reviewer
  - Style reviewer
  - Aggregate findings
`, "code-review-swarm");
```

### release-manager
**Purpose**: Automated release coordination.

```javascript
await Task("Manage release", `
  Coordinate release:
  - Version bumping
  - Changelog generation
  - Tag and publish
`, "release-manager");
```

### workflow-automation
**Purpose**: GitHub Actions workflow creation.

```javascript
await Task("Automate workflow", `
  Create CI/CD workflow:
  - Build and test
  - Deploy to staging
  - Production release
`, "workflow-automation");
```

## Specialized Research Agents

### deep-research-agent
**Purpose**: Comprehensive research with adaptive strategies.

```javascript
await Task("Deep research", `
  Conduct thorough research:
  - Multiple sources
  - Verify findings
  - Synthesize conclusions
`, "deep-research-agent");
```

### root-cause-analyst
**Purpose**: Systematic problem investigation.

```javascript
await Task("Find root cause", `
  Investigate issue:
  - Gather evidence
  - Form hypotheses
  - Test and verify
`, "root-cause-analyst");
```

### requirements-analyst
**Purpose**: Requirements discovery and specification.

```javascript
await Task("Analyze requirements", `
  Transform ideas to specs:
  - Stakeholder interviews
  - Use case analysis
  - Acceptance criteria
`, "requirements-analyst");
```

## Utility Agents

### code-analyzer
**Purpose**: Advanced code quality analysis.

```javascript
await Task("Analyze code", `
  Comprehensive code analysis:
  - Complexity metrics
  - Code smells
  - Improvement suggestions
`, "code-analyzer");
```

### refactoring-expert
**Purpose**: Systematic code improvement.

```javascript
await Task("Refactor code", `
  Improve code quality:
  - Apply SOLID principles
  - Reduce complexity
  - Improve testability
`, "refactoring-expert");
```

### technical-writer
**Purpose**: Technical documentation creation.

```javascript
await Task("Write docs", `
  Create documentation:
  - API reference
  - User guides
  - Architecture docs
`, "technical-writer");
```

### learning-guide
**Purpose**: Teaching through progressive examples.

```javascript
await Task("Teach concept", `
  Explain concept:
  - Progressive complexity
  - Practical examples
  - Interactive exercises
`, "learning-guide");
```

### quality-engineer
**Purpose**: Comprehensive testing strategies.

```javascript
await Task("Ensure quality", `
  Implement quality strategy:
  - Test pyramid
  - Edge case detection
  - Coverage goals
`, "quality-engineer");
```

## Agent Spawning Patterns

### Single Agent

```javascript
await Task("Task description", "Detailed instructions...", "agent-type");
```

### Parallel Agents (Same Message)

```javascript
// All spawn in parallel
await Task("Research", "Research topic A...", "researcher");
await Task("Implement", "Build feature B...", "coder");
await Task("Test", "Test component C...", "tester");
```

### Sequential with Dependencies

```javascript
const plan = await Task("Plan", "Create plan...", "planner");
// Use plan output in next task
await Task("Implement", `Based on plan: ${plan}...`, "coder");
```

### Swarm Coordination

```javascript
// Initialize swarm topology first
await mcp__claude-flow__swarm_init({ topology: "hierarchical" });

// Then spawn coordinated agents
await Task("Coordinate", "Lead the swarm...", "hierarchical-coordinator");
await Task("Work", "Execute tasks...", "worker-specialist");
```

## Best Practices

1. **Choose the right agent** for the task type
2. **Provide detailed context** in prompts
3. **Spawn in parallel** when tasks are independent
4. **Use coordination agents** for complex multi-agent work
5. **Match topology to task** - hierarchical for clear delegation, mesh for consensus
6. **Enable memory sharing** for context persistence
7. **Monitor progress** with TodoWrite and status checks

## Related Documentation

- [Swarm Topologies](./HIVE_MIND_CONSENSUS.md)
- [Agent Communication](./AGENT_COMMUNICATION_PROTOCOLS.md)
- [Memory Patterns](./EPISODIC_MEMORY_AGENTDB.md)
