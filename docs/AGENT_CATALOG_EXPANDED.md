Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:31:24 EST

# Complete Agent Catalog: 150+ Agent Types

## Overview

This comprehensive catalog documents all 150+ agent types available in Claude-Flow and Agentic-Flow for building intelligent multi-agent systems. Each agent type includes its purpose, capabilities, when to use it, spawning examples, configuration options, and performance characteristics.

**Version:** 2.0.0
**Last Updated:** December 2025
**Total Agent Types:** 150+

---

## Table of Contents

1. [Core Development Agents](#1-core-development-agents)
2. [Specialized Development Agents](#2-specialized-development-agents)
3. [Swarm Coordination Agents](#3-swarm-coordination-agents)
4. [Hive-Mind Agents](#4-hive-mind-agents)
5. [Consensus Agents](#5-consensus-agents)
6. [SPARC Methodology Agents](#6-sparc-methodology-agents)
7. [GitHub Integration Agents](#7-github-integration-agents)
8. [Performance Agents](#8-performance-agents)
9. [Neural & ML Agents](#9-neural--ml-agents)
10. [Optimization Agents](#10-optimization-agents)
11. [Flow-Nexus Platform Agents](#11-flow-nexus-platform-agents)
12. [Template & Utility Agents](#12-template--utility-agents)
13. [Agent Spawning Reference](#13-agent-spawning-reference)
14. [Configuration Patterns](#14-configuration-patterns)
15. [Performance Characteristics Summary](#15-performance-characteristics-summary)

---

## 1. Core Development Agents

### 1.1 Coder

| Property | Value |
|----------|-------|
| **Name** | `coder` |
| **Category** | Core Development |
| **Type** | `developer` |
| **Color** | `#FF6B35` |
| **Priority** | `high` |

**Primary Capabilities:**
- `code_generation` - Write production-quality code
- `refactoring` - Improve existing code structure
- `optimization` - Enhance performance while maintaining readability
- `api_design` - Create intuitive and well-documented interfaces
- `error_handling` - Implement robust error handling and recovery
- `debugging` - Identify and fix code issues

**When to Use:**
- Implementing new features
- Writing production-quality code
- Refactoring existing codebases
- Building APIs and interfaces
- Performance optimization
- Bug fixes and debugging

**Spawning Example:**
```javascript
// MCP Spawning
mcp__claude-flow__agent_spawn({
  type: "coder",
  name: "FeatureImplementer",
  capabilities: ["code_generation", "refactoring", "optimization", "api_design"]
})

// Claude Code Task Tool
Task("Implement feature", `
  Implement the user authentication module with:
  - JWT token generation
  - Password hashing with bcrypt
  - Session management
  Follow existing code patterns.
`, "coder");
```

**Configuration Options:**
```yaml
coder:
  language_preference: ["typescript", "javascript", "python"]
  code_style: "clean"
  testing_approach: "tdd"
  documentation_level: "comprehensive"
  performance_focus: true
```

**Performance Characteristics:**
- Average task completion: 5-15 minutes
- Code quality score: 85-95%
- Test coverage target: >80%
- Optimal for: Feature implementation, refactoring sessions

---

### 1.2 Researcher

| Property | Value |
|----------|-------|
| **Name** | `researcher` |
| **Category** | Core Development |
| **Type** | `analyst` |
| **Color** | `#9B59B6` |
| **Priority** | `high` |

**Primary Capabilities:**
- `code_analysis` - Deep dive into codebases
- `pattern_recognition` - Identify recurring patterns and anti-patterns
- `documentation_research` - Analyze existing documentation
- `dependency_tracking` - Map dependencies and relationships
- `knowledge_synthesis` - Compile findings into actionable insights
- `comparative_analysis` - Compare technologies and approaches

**When to Use:**
- Analyzing unfamiliar codebases
- Researching best practices
- Investigating technologies
- Mapping dependencies
- Understanding system architecture
- Technology evaluation

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "researcher",
  name: "CodebaseAnalyzer",
  capabilities: ["code_analysis", "pattern_recognition", "documentation_research"]
})

Task("Research options", `
  Research database options for our use case:
  - Compare PostgreSQL vs MongoDB vs CockroachDB
  - Analyze performance characteristics
  - Recommend best fit
`, "researcher");
```

**Configuration Options:**
```yaml
researcher:
  search_depth: "deep"
  source_verification: true
  citation_required: true
  analysis_format: "structured"
  knowledge_persistence: true
```

**Performance Characteristics:**
- Average task completion: 10-30 minutes
- Source verification: 3-5 sources per finding
- Knowledge retention: Cross-session via memory
- Optimal for: Technology evaluation, codebase analysis

---

### 1.3 Tester

| Property | Value |
|----------|-------|
| **Name** | `tester` |
| **Category** | Core Development |
| **Type** | `validator` |
| **Color** | `#F39C12` |
| **Priority** | `high` |

**Primary Capabilities:**
- `unit_testing` - Write focused, fast unit tests
- `integration_testing` - Test component interactions
- `e2e_testing` - End-to-end user flow testing
- `performance_testing` - Validate performance requirements
- `security_testing` - Identify vulnerabilities
- `edge_case_detection` - Find boundary conditions

**When to Use:**
- Creating test suites
- Validating implementations
- Checking edge cases
- Performance benchmarking
- Security audits
- Regression testing

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "tester",
  name: "QAEngineer",
  capabilities: ["unit_testing", "integration_testing", "e2e_testing", "security_testing"]
})

Task("Create tests", `
  Create comprehensive test suite for auth module:
  - Unit tests with >90% coverage
  - Integration tests
  - Edge case handling
`, "tester");
```

**Configuration Options:**
```yaml
tester:
  coverage_target: 80
  test_framework: "jest"
  assertion_style: "expect"
  mock_strategy: "minimal"
  performance_thresholds:
    unit_test_time: 100ms
    integration_test_time: 5000ms
```

**Performance Characteristics:**
- Coverage target: >80% statements
- Test execution speed: Unit tests <100ms each
- Edge case detection: 5-10 edge cases per function
- Optimal for: TDD, test suite creation, validation

---

### 1.4 Reviewer

| Property | Value |
|----------|-------|
| **Name** | `reviewer` |
| **Category** | Core Development |
| **Type** | `validator` |
| **Color** | `#E74C3C` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `code_review` - Assess code structure and readability
- `security_audit` - Identify security vulnerabilities
- `performance_analysis` - Spot optimization opportunities
- `best_practices` - Ensure coding standards compliance
- `documentation_review` - Verify documentation quality
- `architecture_review` - Assess design decisions

**When to Use:**
- Code reviews before merge
- Security audits
- Performance analysis
- Quality gate checks
- Documentation verification
- Pull request reviews

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "reviewer",
  name: "CodeReviewer",
  capabilities: ["code_review", "security_audit", "performance_analysis", "best_practices"]
})

Task("Review PR", `
  Review the authentication module for:
  - Security vulnerabilities
  - Code quality and style
  - Performance issues
  - Test coverage
`, "reviewer");
```

**Configuration Options:**
```yaml
reviewer:
  review_depth: "thorough"
  security_focus: true
  style_guide: "project-specific"
  performance_thresholds:
    complexity_limit: 10
    file_length_limit: 500
  feedback_format: "actionable"
```

**Performance Characteristics:**
- Review thoroughness: 15-30 minutes per 500 LOC
- Issue detection rate: 85-95%
- False positive rate: <10%
- Optimal for: PR reviews, security audits

---

### 1.5 Planner

| Property | Value |
|----------|-------|
| **Name** | `planner` |
| **Category** | Core Development |
| **Type** | `coordinator` |
| **Color** | `#4ECDC4` |
| **Priority** | `high` |

**Primary Capabilities:**
- `task_decomposition` - Break complex requests into atomic tasks
- `dependency_analysis` - Map task dependencies
- `resource_allocation` - Allocate agents and resources
- `timeline_estimation` - Estimate realistic timeframes
- `risk_assessment` - Identify blockers and mitigation strategies
- `roadmap_creation` - Create implementation roadmaps

**When to Use:**
- Complex project planning
- Sprint planning
- Resource allocation
- Risk assessment
- Dependency mapping
- Architecture decisions

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "coordinator",
  name: "ProjectPlanner",
  capabilities: ["task_decomposition", "dependency_analysis", "resource_allocation"]
})

Task("Plan implementation", `
  Create implementation plan for new feature:
  - Break down into subtasks
  - Identify dependencies
  - Estimate complexity
`, "planner");
```

**Configuration Options:**
```yaml
planner:
  estimation_method: "fibonacci"
  risk_tolerance: "low"
  buffer_percentage: 20
  dependency_visualization: true
  milestone_tracking: true
```

**Performance Characteristics:**
- Planning accuracy: 80-90%
- Task granularity: 2-8 hour tasks
- Dependency detection: 95%+
- Optimal for: Sprint planning, complex projects

---

## 2. Specialized Development Agents

### 2.1 System Architect

| Property | Value |
|----------|-------|
| **Name** | `system-architect` |
| **Category** | Specialized Development |
| **Type** | `architect` |
| **Color** | `#8E44AD` |
| **Priority** | `high` |

**Primary Capabilities:**
- `system_design` - High-level system architecture
- `scalability_planning` - Design for scale
- `integration_architecture` - Plan integrations
- `technology_selection` - Choose appropriate technologies
- `security_architecture` - Design secure systems
- `microservices_design` - Distributed system patterns

**When to Use:**
- System design phase
- Architecture decisions
- Technology selection
- Scalability planning
- Integration planning
- Microservices design

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "architect",
  name: "SystemArchitect",
  capabilities: ["system_design", "scalability_planning", "security_architecture"]
})

Task("Design system", `
  Design microservices architecture for e-commerce platform:
  - Service boundaries
  - Data flow diagrams
  - API contracts
  - Scalability considerations
`, "system-architect");
```

**Configuration Options:**
```yaml
system_architect:
  architecture_style: "microservices"
  documentation_format: "c4_model"
  scalability_target: "10000_concurrent_users"
  security_framework: "zero_trust"
```

**Performance Characteristics:**
- Design complexity: Handles 20+ services
- Documentation depth: C4 model compliant
- Technology evaluation: 3-5 options per decision
- Optimal for: Greenfield projects, refactoring

---

### 2.2 Backend Developer

| Property | Value |
|----------|-------|
| **Name** | `backend-dev` |
| **Category** | Specialized Development |
| **Type** | `developer` |
| **Color** | `#27AE60` |
| **Priority** | `high` |

**Primary Capabilities:**
- `api_development` - Build REST and GraphQL APIs
- `database_design` - Design and optimize databases
- `authentication` - Implement auth systems
- `middleware` - Build middleware components
- `caching` - Implement caching strategies
- `queue_processing` - Message queue handling

**When to Use:**
- API development
- Database operations
- Authentication implementation
- Server-side logic
- Integration development
- Background processing

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "developer",
  name: "BackendDeveloper",
  capabilities: ["api_development", "database_design", "authentication"]
})

Task("Build API", `
  Build REST API with Express.js:
  - CRUD endpoints for products
  - Authentication middleware
  - Rate limiting
  - Error handling
`, "backend-dev");
```

**Configuration Options:**
```yaml
backend_dev:
  framework: "express"
  database: "postgresql"
  orm: "prisma"
  api_style: "rest"
  authentication: "jwt"
```

**Performance Characteristics:**
- API response time target: <200ms
- Database optimization: Query analysis included
- Security: OWASP compliance
- Optimal for: API development, data layer

---

### 2.3 Frontend Architect

| Property | Value |
|----------|-------|
| **Name** | `frontend-architect` |
| **Category** | Specialized Development |
| **Type** | `developer` |
| **Color** | `#3498DB` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `component_architecture` - React/Vue component design
- `state_management` - Redux, Zustand, Pinia
- `performance_optimization` - Bundle optimization, lazy loading
- `accessibility` - WCAG compliance
- `responsive_design` - Mobile-first design
- `design_systems` - Component library design

**When to Use:**
- Frontend architecture decisions
- Component library design
- State management setup
- Performance optimization
- Accessibility improvements

**Spawning Example:**
```javascript
Task("Design UI", `
  Design React component architecture:
  - Component hierarchy
  - State management strategy
  - Performance optimization
`, "frontend-architect");
```

**Configuration Options:**
```yaml
frontend_architect:
  framework: "react"
  state_management: "zustand"
  styling: "tailwind"
  bundle_target: "<200kb"
  accessibility_level: "WCAG_AA"
```

---

### 2.4 Mobile Developer

| Property | Value |
|----------|-------|
| **Name** | `mobile-dev` |
| **Category** | Specialized Development |
| **Type** | `developer` |
| **Color** | `#E91E63` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `react_native` - Cross-platform mobile development
- `native_modules` - Platform-specific implementations
- `offline_first` - Offline data strategies
- `push_notifications` - Notification handling
- `biometric_auth` - Fingerprint/Face ID
- `app_store_deployment` - Release management

**When to Use:**
- Mobile app development
- Cross-platform features
- Offline functionality
- Native integrations
- App store submissions

**Spawning Example:**
```javascript
Task("Build mobile app", `
  Implement mobile authentication flow:
  - Login/signup screens
  - Biometric authentication
  - Secure token storage
`, "mobile-dev");
```

**Configuration Options:**
```yaml
mobile_dev:
  platform: "react-native"
  target_platforms: ["ios", "android"]
  min_ios_version: "14.0"
  min_android_version: "26"
```

---

### 2.5 ML Developer

| Property | Value |
|----------|-------|
| **Name** | `ml-developer` |
| **Category** | Specialized Development |
| **Type** | `specialist` |
| **Color** | `#E91E63` |
| **Priority** | `high` |

**Primary Capabilities:**
- `model_development` - Build ML models
- `data_preprocessing` - Prepare training data
- `model_evaluation` - Evaluate model performance
- `feature_engineering` - Design effective features
- `model_deployment` - Deploy ML models
- `mlops` - ML operations and monitoring

**When to Use:**
- Building ML pipelines
- Training models
- Model optimization
- ML system deployment
- Feature engineering
- Model monitoring

**Spawning Example:**
```javascript
mcp__claude-flow__agent_spawn({
  type: "specialist",
  name: "MLDeveloper",
  capabilities: ["model_development", "data_preprocessing", "model_evaluation"]
})

Task("Train model", `
  Develop recommendation model:
  - Feature engineering
  - Model training
  - Evaluation metrics
  - Deployment pipeline
`, "ml-developer");
```

**Configuration Options:**
```yaml
ml_developer:
  frameworks: ["pytorch", "tensorflow", "sklearn"]
  experiment_tracking: "mlflow"
  deployment_target: "sagemaker"
  model_registry: true
```

---

### 2.6 Security Engineer

| Property | Value |
|----------|-------|
| **Name** | `security-engineer` |
| **Category** | Specialized Development |
| **Type** | `specialist` |
| **Color** | `#F44336` |
| **Priority** | `high` |

**Primary Capabilities:**
- `vulnerability_scanning` - Identify security vulnerabilities
- `penetration_testing` - Test security measures
- `security_auditing` - Audit security practices
- `compliance_checking` - Verify compliance
- `threat_modeling` - Identify potential threats
- `secure_coding` - Implement secure patterns

**When to Use:**
- Security audits
- Vulnerability assessments
- Penetration testing
- Compliance verification
- Threat modeling
- Security reviews

**Spawning Example:**
```javascript
Task("Security audit", `
  Perform security audit:
  - OWASP Top 10 check
  - Dependency vulnerabilities
  - Authentication/authorization review
`, "security-engineer");
```

**Configuration Options:**
```yaml
security_engineer:
  frameworks: ["owasp", "nist"]
  scan_tools: ["snyk", "semgrep"]
  compliance_standards: ["soc2", "gdpr"]
  severity_threshold: "medium"
```

---

### 2.7 DevOps Architect

| Property | Value |
|----------|-------|
| **Name** | `devops-architect` |
| **Category** | Specialized Development |
| **Type** | `specialist` |
| **Color** | `#00BCD4` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `infrastructure_design` - Cloud infrastructure architecture
- `containerization` - Docker and container orchestration
- `kubernetes` - K8s deployment and management
- `ci_cd` - Pipeline design and optimization
- `monitoring` - Observability and alerting
- `iac` - Infrastructure as Code

**When to Use:**
- Infrastructure setup
- CI/CD pipeline design
- Container orchestration
- Monitoring implementation
- Cloud migrations

**Spawning Example:**
```javascript
Task("Setup CI/CD", `
  Configure CI/CD pipeline:
  - GitHub Actions workflow
  - Docker containerization
  - Kubernetes deployment
`, "devops-architect");
```

---

### 2.8 CI/CD Engineer

| Property | Value |
|----------|-------|
| **Name** | `cicd-engineer` |
| **Category** | Specialized Development |
| **Type** | `specialist` |
| **Color** | `#00BCD4` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `pipeline_creation` - Build CI/CD pipelines
- `automation` - Automate deployment processes
- `testing_integration` - Integrate testing stages
- `deployment_strategies` - Blue-green, canary deployments
- `artifact_management` - Build artifact handling
- `environment_management` - Multi-environment setup

**When to Use:**
- Setting up CI/CD pipelines
- Deployment automation
- Pipeline optimization
- Environment configuration

**Spawning Example:**
```javascript
Task("Optimize pipeline", `
  Optimize build pipeline:
  - Parallel job execution
  - Caching strategies
  - Test splitting
`, "cicd-engineer");
```

---

### 2.9 API Documentation Specialist

| Property | Value |
|----------|-------|
| **Name** | `api-docs` |
| **Category** | Specialized Development |
| **Type** | `documenter` |
| **Color** | `#9E9E9E` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `openapi_spec` - Create OpenAPI/Swagger specs
- `api_reference` - Generate API reference docs
- `code_samples` - Write code examples
- `sdk_documentation` - Document SDKs
- `changelog_generation` - Track API changes
- `interactive_docs` - Create interactive documentation

**When to Use:**
- API documentation
- OpenAPI spec creation
- SDK documentation
- Developer portal content

**Spawning Example:**
```javascript
Task("Document API", `
  Create OpenAPI specification:
  - Endpoint documentation
  - Request/response schemas
  - Authentication examples
`, "api-docs");
```

---

## 3. Swarm Coordination Agents

### 3.1 Hierarchical Coordinator

| Property | Value |
|----------|-------|
| **Name** | `hierarchical-coordinator` |
| **Category** | Swarm Coordination |
| **Type** | `coordinator` |
| **Color** | `#FF6B35` |
| **Priority** | `critical` |

**Architecture:**
```
    QUEEN (Coordinator)
   /   |   |   \
RESEARCH CODE ANALYST TEST
WORKERS WORKERS WORKERS WORKERS
```

**Primary Capabilities:**
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

**Performance Characteristics:**
- Optimal agent count: 5-15
- Communication overhead: O(log n)
- Decision latency: Low (centralized)
- Fault tolerance: Moderate (queen is SPOF)

---

### 3.2 Mesh Coordinator

| Property | Value |
|----------|-------|
| **Name** | `mesh-coordinator` |
| **Category** | Swarm Coordination |
| **Type** | `coordinator` |
| **Color** | `#00BCD4` |
| **Priority** | `high` |

**Architecture:**
```
    MESH TOPOLOGY
   A <-> B <-> C
   ^     ^     ^
   D <-> E <-> F
   ^     ^     ^
   G <-> H <-> I
```

**Primary Capabilities:**
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
mcp__claude-flow__swarm_init({
  topology: "mesh",
  maxAgents: 12,
  strategy: "distributed"
})

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

**Performance Characteristics:**
- Optimal agent count: 8-20
- Communication overhead: O(n * k) where k = connectivity
- Decision latency: Medium (consensus required)
- Fault tolerance: High (no SPOF)

---

### 3.3 Adaptive Coordinator

| Property | Value |
|----------|-------|
| **Name** | `adaptive-coordinator` |
| **Category** | Swarm Coordination |
| **Type** | `coordinator` |
| **Color** | `#4CAF50` |
| **Priority** | `high` |

**Primary Capabilities:**
- `dynamic_topology` - Adjust topology in real-time
- `load_adaptation` - Scale with workload
- `performance_optimization` - Optimize agent allocation
- `pattern_switching` - Switch coordination patterns
- `self_healing` - Automatic recovery

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

Task("Adaptive coordination", `
  Dynamically adjust coordination:
  - Monitor workload
  - Switch topology as needed
  - Optimize for current task
`, "adaptive-coordinator");
```

**Configuration Options:**
```yaml
adaptive:
  initial_topology: "star"
  adaptation_interval: 30000    # Check every 30s
  load_threshold_high: 0.8      # Switch to mesh when overloaded
  load_threshold_low: 0.3       # Switch to star when idle
  learning_enabled: true        # Learn optimal patterns
```

---

### 3.4 Ring Coordinator

| Property | Value |
|----------|-------|
| **Name** | `ring-coordinator` |
| **Category** | Swarm Coordination |
| **Type** | `coordinator` |
| **Color** | `#FFC107` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `token_passing` - Ordered message passing
- `sequential_processing` - Pipeline workflows
- `circular_coordination` - Ring-based consensus
- `ordered_execution` - Guaranteed ordering

**When to Use:**
- Pipeline processing
- Sequential workflows
- Ordered task execution
- Token-based coordination

**Spawning Example:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "ring",
  maxAgents: 10,
  direction: "bidirectional"
})
```

**Performance Characteristics:**
- Communication overhead: O(n)
- Decision latency: High (sequential)
- Fault tolerance: Low (single point breaks ring)
- Best for: Pipeline processing

---

### 3.5 Star Coordinator

| Property | Value |
|----------|-------|
| **Name** | `star-coordinator` |
| **Category** | Swarm Coordination |
| **Type** | `coordinator` |
| **Color** | `#9C27B0` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `central_routing` - Hub-and-spoke routing
- `simple_coordination` - Straightforward delegation
- `broadcast` - Efficient broadcasting
- `aggregation` - Collect results from spokes

**When to Use:**
- Simple coordination needs
- Broadcast-heavy workloads
- Clear hub-spoke relationships
- Low complexity requirements

**Spawning Example:**
```javascript
mcp__claude-flow__swarm_init({
  topology: "star",
  maxAgents: 6
})
```

---

## 4. Hive-Mind Agents

### 4.1 Queen Coordinator

| Property | Value |
|----------|-------|
| **Name** | `queen-coordinator` |
| **Category** | Hive-Mind |
| **Type** | `sovereign` |
| **Color** | `gold` |
| **Priority** | `critical` |

**Primary Capabilities:**
- `strategic_command` - High-level decision making
- `resource_allocation` - Distribute hive resources
- `succession_planning` - Continuity management
- `hive_coherence` - Maintain swarm unity
- `governance` - Multiple governance modes
- `royal_directives` - Issue commands to subjects

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
```

**Configuration Options:**
```yaml
queen:
  governance_mode: "hierarchical"
  succession_heir: "collective-intelligence"
  resource_allocation_strategy: "dynamic"
  coherence_check_interval: 60000
  emergency_threshold: 0.3
```

---

### 4.2 Worker Specialist

| Property | Value |
|----------|-------|
| **Name** | `worker-specialist` |
| **Category** | Hive-Mind |
| **Type** | `worker` |
| **Color** | `#FFA726` |
| **Priority** | `high` |

**Primary Capabilities:**
- `task_execution` - Execute assigned tasks
- `parallel_processing` - Handle concurrent workloads
- `specialization` - Domain-specific expertise
- `reporting` - Status updates to queen
- `collaboration` - Coordinate with peers

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

Task("Execute task", `
  Execute assigned work:
  - Complete task precisely
  - Report progress
  - Coordinate with peers
`, "worker-specialist");
```

---

### 4.3 Scout Explorer

| Property | Value |
|----------|-------|
| **Name** | `scout-explorer` |
| **Category** | Hive-Mind |
| **Type** | `reconnaissance` |
| **Color** | `#03A9F4` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `information_gathering` - Reconnaissance operations
- `threat_detection` - Identify potential issues
- `opportunity_identification` - Find optimization opportunities
- `environmental_scanning` - Monitor external factors
- `reporting` - Report findings to hive

**When to Use:**
- Information reconnaissance
- Codebase exploration
- Threat detection
- Opportunity discovery

**Spawning Example:**
```javascript
Task("Explore territory", `
  Gather intelligence:
  - Explore codebase
  - Report findings
  - Update hive memory
`, "scout-explorer");
```

---

### 4.4 Collective Intelligence Coordinator

| Property | Value |
|----------|-------|
| **Name** | `collective-intelligence-coordinator` |
| **Category** | Hive-Mind |
| **Type** | `coordinator` |
| **Color** | `#9C27B0` |
| **Priority** | `high` |

**Primary Capabilities:**
- `knowledge_aggregation` - Combine agent insights
- `pattern_synthesis` - Identify emergent patterns
- `consensus_building` - Build collective agreement
- `distributed_reasoning` - Coordinate reasoning across agents
- `wisdom_extraction` - Extract collective wisdom

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

Task("Collective reasoning", `
  Orchestrate collective decision:
  - Gather perspectives
  - Build consensus
  - Synthesize wisdom
`, "collective-intelligence-coordinator");
```

---

### 4.5 Swarm Memory Manager

| Property | Value |
|----------|-------|
| **Name** | `swarm-memory-manager` |
| **Category** | Hive-Mind |
| **Type** | `coordinator` |
| **Color** | `#607D8B` |
| **Priority** | `high` |

**Primary Capabilities:**
- `distributed_memory` - Manage shared memory
- `state_synchronization` - Sync state across agents
- `knowledge_persistence` - Persist hive knowledge
- `cache_optimization` - Optimize memory access
- `consistency_maintenance` - Ensure data consistency

**When to Use:**
- Distributed memory management
- State synchronization
- Knowledge persistence
- Cache optimization

**Spawning Example:**
```javascript
Task("Manage memory", `
  Coordinate swarm memory:
  - Ensure consistency
  - Handle persistence
  - Optimize retrieval
`, "swarm-memory-manager");
```

---

## 5. Consensus Agents

### 5.1 Byzantine Coordinator

| Property | Value |
|----------|-------|
| **Name** | `byzantine-coordinator` |
| **Category** | Consensus |
| **Type** | `coordinator` |
| **Color** | `#E91E63` |
| **Priority** | `critical` |

**Primary Capabilities:**
- `pbft_consensus` - Practical Byzantine Fault Tolerance
- `malicious_detection` - Detect malicious/faulty nodes
- `message_authentication` - Cryptographic verification
- `view_management` - Handle view changes
- `attack_mitigation` - Defend against Byzantine attacks
- `recovery_coordination` - Coordinate recovery from failures

**Byzantine Fault Tolerance:**
- Tolerates up to f < n/3 malicious or faulty nodes
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
  capabilities: ["pbft_consensus", "malicious_detection", "message_authentication"]
})

Task("BFT consensus", `
  Achieve consensus despite faults:
  - Detect malicious agents
  - Reach agreement
  - Handle network partitions
`, "byzantine-coordinator");
```

**Configuration Options:**
```yaml
byzantine:
  fault_tolerance: 0.33     # Tolerate 1/3 faulty nodes
  consensus_timeout: 5000   # ms
  quorum_type: "supermajority"
  signature_scheme: "ed25519"
  replay_protection: true
```

**PBFT Protocol Phases:**
1. **Pre-Prepare**: Primary broadcasts proposed operation
2. **Prepare**: Backup nodes verify and broadcast prepare messages
3. **Commit**: Execute after receiving 2f+1 commit messages

---

### 5.2 Raft Manager

| Property | Value |
|----------|-------|
| **Name** | `raft-manager` |
| **Category** | Consensus |
| **Type** | `coordinator` |
| **Color** | `#2196F3` |
| **Priority** | `high` |

**Primary Capabilities:**
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

Task("Raft consensus", `
  Manage Raft cluster:
  - Leader election
  - Log replication
  - Membership changes
`, "raft-manager");
```

**Configuration Options:**
```yaml
raft:
  election_timeout: [150, 300]  # Random timeout range (ms)
  heartbeat_interval: 50         # ms
  log_compaction_threshold: 1000
  snapshot_interval: 10000
```

---

### 5.3 Gossip Coordinator

| Property | Value |
|----------|-------|
| **Name** | `gossip-coordinator` |
| **Category** | Consensus |
| **Type** | `coordinator` |
| **Color** | `#4CAF50` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `epidemic_dissemination` - Spread information across network
- `anti_entropy` - Periodic state reconciliation
- `rumor_spreading` - Event propagation
- `aggregation` - Computing global functions
- `failure_detection` - Detect failed nodes

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

Task("Gossip sync", `
  Propagate information via gossip:
  - Epidemic broadcast
  - Failure detection
  - Membership protocol
`, "gossip-coordinator");
```

**Configuration Options:**
```yaml
gossip:
  interval: 2000         # Gossip round interval (ms)
  fanout: 3              # Peers per round
  max_transmissions: 10  # Max times to gossip a message
  convergence_time: 1000 # Expected convergence (ms)
```

---

### 5.4 CRDT Synchronizer

| Property | Value |
|----------|-------|
| **Name** | `crdt-synchronizer` |
| **Category** | Consensus |
| **Type** | `coordinator` |
| **Color** | `#00BCD4` |
| **Priority** | `high` |

**Primary Capabilities:**
- `g_counter` - Grow-only counters
- `pn_counter` - Positive-negative counters
- `or_set` - Observed-remove sets
- `lww_register` - Last-writer-wins registers
- `rga` - Replicated growable arrays
- `merge_resolution` - Automatic conflict resolution

**CRDT Types Supported:**

| CRDT Type | Use Case | Merge Strategy |
|-----------|----------|----------------|
| G-Counter | Incrementing counts | Max per node |
| PN-Counter | Inc/Dec counts | Sum of P and N counters |
| OR-Set | Add/Remove elements | Union with tombstones |
| LWW-Register | Single value | Highest timestamp wins |
| RGA | Ordered lists | Position identifiers |

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

Task("CRDT sync", `
  Synchronize state with CRDTs:
  - Merge concurrent updates
  - Resolve conflicts automatically
  - Maintain consistency
`, "crdt-synchronizer");
```

---

### 5.5 Quorum Manager

| Property | Value |
|----------|-------|
| **Name** | `quorum-manager` |
| **Category** | Consensus |
| **Type** | `coordinator` |
| **Color** | `#FF9800` |
| **Priority** | `high` |

**Primary Capabilities:**
- `quorum_calculation` - Dynamic quorum sizing
- `membership_management` - Node addition/removal
- `voting_coordination` - Coordinate voting rounds
- `partition_handling` - Handle network partitions
- `split_brain_prevention` - Prevent split-brain scenarios

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

Task("Manage quorum", `
  Manage voting quorum:
  - Adjust for node changes
  - Ensure availability
  - Handle split-brain
`, "quorum-manager");
```

---

### 5.6 Security Manager

| Property | Value |
|----------|-------|
| **Name** | `security-manager` |
| **Category** | Consensus |
| **Type** | `coordinator` |
| **Color** | `#F44336` |
| **Priority** | `high` |

**Primary Capabilities:**
- `message_authentication` - Verify message integrity
- `replay_protection` - Prevent replay attacks
- `access_control` - Manage permissions
- `key_management` - Handle cryptographic keys
- `audit_logging` - Security event logging

**When to Use:**
- Securing consensus protocols
- Access control implementation
- Cryptographic operations
- Security monitoring

**Spawning Example:**
```javascript
Task("Secure consensus", `
  Implement security:
  - Message authentication
  - Replay protection
  - Access control
`, "security-manager");
```

---

## 6. SPARC Methodology Agents

### 6.1 Specification Agent

| Property | Value |
|----------|-------|
| **Name** | `specification` |
| **Category** | SPARC |
| **Type** | `analyst` |
| **Color** | `blue` |
| **Priority** | `high` |
| **SPARC Phase** | `specification` |

**Primary Capabilities:**
- `requirements_gathering` - Collect and analyze requirements
- `constraint_analysis` - Identify technical constraints
- `acceptance_criteria` - Define success criteria
- `scope_definition` - Define project scope
- `stakeholder_analysis` - Understand stakeholder needs

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
  capabilities: ["requirements_gathering", "constraint_analysis", "acceptance_criteria"]
})

Task("Gather requirements", `
  Analyze and specify requirements:
  - User stories
  - Acceptance criteria
  - Non-functional requirements
`, "specification");
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

### 6.2 Pseudocode Agent

| Property | Value |
|----------|-------|
| **Name** | `pseudocode` |
| **Category** | SPARC |
| **Type** | `developer` |
| **Color** | `green` |
| **Priority** | `high` |
| **SPARC Phase** | `pseudocode` |

**Primary Capabilities:**
- `algorithm_design` - Design algorithms
- `logic_flow` - Define logical flows
- `complexity_analysis` - Analyze time/space complexity
- `data_structure_design` - Design data structures
- `edge_case_identification` - Find boundary conditions

**When to Use:**
- Algorithm design phase
- Before implementation
- Complexity analysis
- Logic verification

**Spawning Example:**
```javascript
Task("Design algorithm", `
  Design algorithm in pseudocode:
  - Core logic
  - Edge cases
  - Complexity analysis
`, "pseudocode");
```

---

### 6.3 Architecture Agent

| Property | Value |
|----------|-------|
| **Name** | `architecture` |
| **Category** | SPARC |
| **Type** | `architect` |
| **Color** | `purple` |
| **Priority** | `high` |
| **SPARC Phase** | `architecture` |

**Primary Capabilities:**
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
Task("Design architecture", `
  Create system architecture:
  - Component diagrams
  - Data flow
  - Integration points
`, "architecture");
```

---

### 6.4 Refinement Agent

| Property | Value |
|----------|-------|
| **Name** | `refinement` |
| **Category** | SPARC |
| **Type** | `developer` |
| **Color** | `violet` |
| **Priority** | `high` |
| **SPARC Phase** | `refinement` |

**Primary Capabilities:**
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
Task("Refine implementation", `
  Iteratively improve code:
  - Write tests first
  - Implement to pass
  - Refactor for quality
`, "refinement");
```

---

### 6.5 SPARC Coder

| Property | Value |
|----------|-------|
| **Name** | `sparc-coder` |
| **Category** | SPARC |
| **Type** | `developer` |
| **Color** | `orange` |
| **Priority** | `high` |

**Primary Capabilities:**
- `tdd_implementation` - Test-driven development
- `spec_translation` - Transform specs to code
- `quality_gates` - Ensure quality standards
- `documentation` - Document as you go

**When to Use:**
- Implementing features with TDD
- Translating specifications to code
- Quality-focused development

**Spawning Example:**
```javascript
Task("Implement with TDD", `
  Transform spec to code:
  - Follow TDD cycle
  - Meet acceptance criteria
  - Document as you go
`, "sparc-coder");
```

---

### 6.6 SPARC Coordinator

| Property | Value |
|----------|-------|
| **Name** | `sparc-coord` |
| **Category** | SPARC |
| **Type** | `coordinator` |
| **Color** | `teal` |
| **Priority** | `high` |

**Primary Capabilities:**
- `phase_orchestration` - Sequence SPARC phases
- `handoff_management` - Manage phase transitions
- `quality_gates` - Ensure phase completion
- `progress_tracking` - Track overall progress

**When to Use:**
- Orchestrating full SPARC workflow
- Managing phase transitions
- Quality gate enforcement

**Spawning Example:**
```javascript
Task("Orchestrate SPARC", `
  Coordinate SPARC phases:
  - Sequence phases correctly
  - Manage handoffs
  - Ensure quality gates
`, "sparc-coord");
```

---

## 7. GitHub Integration Agents

### 7.1 PR Manager

| Property | Value |
|----------|-------|
| **Name** | `pr-manager` |
| **Category** | GitHub |
| **Type** | `coordinator` |
| **Color** | `purple` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `pr_creation` - Create pull requests
- `review_coordination` - Coordinate reviews
- `merge_management` - Handle merge strategies
- `conflict_resolution` - Resolve merge conflicts
- `changelog_generation` - Generate changelogs

**When to Use:**
- Pull request lifecycle management
- Review coordination
- Merge strategy decisions

**Spawning Example:**
```javascript
Task("Manage PR", `
  Handle pull request:
  - Create with proper description
  - Request reviews
  - Handle feedback
  - Merge when ready
`, "pr-manager");
```

---

### 7.2 Issue Tracker

| Property | Value |
|----------|-------|
| **Name** | `issue-tracker` |
| **Category** | GitHub |
| **Type** | `coordinator` |
| **Color** | `blue` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `issue_creation` - Create and format issues
- `triage` - Categorize and prioritize issues
- `label_management` - Smart labeling
- `progress_tracking` - Track issue progress
- `assignment` - Assign to appropriate team

**When to Use:**
- Issue management
- Project tracking
- Team coordination

**Spawning Example:**
```javascript
Task("Triage issues", `
  Manage GitHub issues:
  - Categorize and prioritize
  - Assign to appropriate team
  - Track progress
`, "issue-tracker");
```

---

### 7.3 Code Review Swarm

| Property | Value |
|----------|-------|
| **Name** | `code-review-swarm` |
| **Category** | GitHub |
| **Type** | `coordinator` |
| **Color** | `red` |
| **Priority** | `high` |

**Primary Capabilities:**
- `multi_reviewer` - Coordinate multiple reviewers
- `security_review` - Security-focused review
- `performance_review` - Performance analysis
- `style_review` - Code style checking
- `finding_aggregation` - Aggregate review findings

**When to Use:**
- Multi-perspective code review
- Comprehensive PR analysis
- Security-focused reviews

**Spawning Example:**
```javascript
Task("Swarm review", `
  Deploy review swarm:
  - Security reviewer
  - Performance reviewer
  - Style reviewer
  - Aggregate findings
`, "code-review-swarm");
```

---

### 7.4 Release Manager

| Property | Value |
|----------|-------|
| **Name** | `release-manager` |
| **Category** | GitHub |
| **Type** | `coordinator` |
| **Color** | `green` |
| **Priority** | `high` |

**Primary Capabilities:**
- `version_bumping` - Semantic version management
- `changelog_generation` - Automatic changelog
- `release_notes` - Generate release notes
- `tag_management` - Git tag handling
- `deployment_coordination` - Coordinate deployments

**When to Use:**
- Release coordination
- Version management
- Changelog generation

**Spawning Example:**
```javascript
Task("Manage release", `
  Coordinate release:
  - Version bumping
  - Changelog generation
  - Tag and publish
`, "release-manager");
```

---

### 7.5 Workflow Automation

| Property | Value |
|----------|-------|
| **Name** | `workflow-automation` |
| **Category** | GitHub |
| **Type** | `coordinator` |
| **Color** | `cyan` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `action_creation` - Create GitHub Actions
- `pipeline_design` - Design CI/CD pipelines
- `trigger_configuration` - Configure triggers
- `secret_management` - Handle secrets

**When to Use:**
- GitHub Actions setup
- CI/CD pipeline creation
- Workflow automation

**Spawning Example:**
```javascript
Task("Automate workflow", `
  Create CI/CD workflow:
  - Build and test
  - Deploy to staging
  - Production release
`, "workflow-automation");
```

---

### 7.6 Multi-Repo Swarm

| Property | Value |
|----------|-------|
| **Name** | `multi-repo-swarm` |
| **Category** | GitHub |
| **Type** | `coordinator` |
| **Color** | `orange` |
| **Priority** | `high` |

**Primary Capabilities:**
- `cross_repo_coordination` - Coordinate across repositories
- `dependency_sync` - Synchronize dependencies
- `version_alignment` - Align versions across repos
- `release_orchestration` - Coordinate multi-repo releases

**When to Use:**
- Multi-repository projects
- Monorepo-like coordination
- Cross-package releases

---

### 7.7 Repository Architect

| Property | Value |
|----------|-------|
| **Name** | `repo-architect` |
| **Category** | GitHub |
| **Type** | `architect` |
| **Color** | `purple` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `structure_optimization` - Optimize repo structure
- `template_management` - Manage repo templates
- `branch_strategy` - Design branching strategy
- `contribution_guidelines` - Create guidelines

**When to Use:**
- Repository setup
- Structure optimization
- Template creation

---

## 8. Performance Agents

### 8.1 Performance Analyzer

| Property | Value |
|----------|-------|
| **Name** | `perf-analyzer` |
| **Category** | Performance |
| **Type** | `analyst` |
| **Color** | `#FF5722` |
| **Priority** | `high` |

**Primary Capabilities:**
- `bottleneck_detection` - Identify performance bottlenecks
- `profiling` - Profile code execution
- `memory_analysis` - Analyze memory usage
- `query_optimization` - Optimize database queries
- `latency_analysis` - Analyze response times

**When to Use:**
- Performance troubleshooting
- Bottleneck identification
- Memory leak detection

**Spawning Example:**
```javascript
Task("Analyze performance", `
  Identify performance bottlenecks:
  - Profile execution
  - Memory analysis
  - Database queries
`, "perf-analyzer");
```

---

### 8.2 Performance Benchmarker

| Property | Value |
|----------|-------|
| **Name** | `performance-benchmarker` |
| **Category** | Performance |
| **Type** | `analyst` |
| **Color** | `#E91E63` |
| **Priority** | `high` |

**Primary Capabilities:**
- `benchmark_design` - Design benchmarks
- `throughput_testing` - Measure throughput
- `latency_testing` - Measure latency
- `regression_detection` - Detect performance regressions
- `comparison_analysis` - Compare implementations

**When to Use:**
- Performance benchmarking
- Regression detection
- Implementation comparison

**Spawning Example:**
```javascript
Task("Run benchmarks", `
  Execute benchmark suite:
  - Throughput tests
  - Latency measurements
  - Regression detection
`, "performance-benchmarker");
```

---

### 8.3 Load Balancer

| Property | Value |
|----------|-------|
| **Name** | `load-balancer` |
| **Category** | Performance |
| **Type** | `coordinator` |
| **Color** | `#2196F3` |
| **Priority** | `high` |

**Primary Capabilities:**
- `load_distribution` - Distribute work evenly
- `health_checking` - Monitor agent health
- `failover` - Handle agent failures
- `capacity_planning` - Plan resource capacity

**When to Use:**
- Distributing work across agents
- Resource optimization
- Fault tolerance

---

## 9. Neural & ML Agents

### 9.1 SAFLA Neural Specialist

| Property | Value |
|----------|-------|
| **Name** | `safla-neural` |
| **Category** | Neural/ML |
| **Type** | `specialist` |
| **Color** | `cyan` |
| **Priority** | `high` |

**Primary Capabilities:**
- `persistent_memory` - Multi-tiered memory architecture
- `feedback_loops` - Self-improving learning cycles
- `distributed_training` - Cloud-based neural clusters
- `memory_compression` - 60% compression with recall
- `real_time_processing` - 172,000+ ops/sec
- `divergent_thinking` - Lateral, quantum, chaotic patterns

**Four-Tier Memory Model:**
```
1. Vector Memory (Semantic Understanding)
2. Episodic Memory (Experience Storage)
3. Semantic Memory (Knowledge Base)
4. Working Memory (Active Context)
```

**When to Use:**
- Building self-learning agents
- Persistent memory systems
- Cross-session learning
- Adaptive strategies

**Spawning Example:**
```javascript
mcp__claude-flow__neural_train({
  pattern_type: "coordination",
  training_data: JSON.stringify({
    architecture: "safla-transformer",
    memory_tiers: ["vector", "episodic", "semantic", "working"],
    feedback_loops: true,
    persistence: true
  }),
  epochs: 50
})
```

---

### 9.2 Neural Trainer

| Property | Value |
|----------|-------|
| **Name** | `neural-trainer` |
| **Category** | Neural/ML |
| **Type** | `specialist` |
| **Color** | `#673AB7` |
| **Priority** | `high` |

**Primary Capabilities:**
- `pattern_training` - Train neural patterns
- `model_optimization` - Optimize models
- `hyperparameter_tuning` - Tune hyperparameters
- `distributed_training` - Multi-node training

**When to Use:**
- Training neural patterns
- Model optimization
- Distributed training

**Spawning Example:**
```javascript
mcp__claude-flow__neural_train({
  pattern_type: "coordination",
  training_data: "swarm coordination patterns",
  epochs: 50
})
```

---

### 9.3 Pattern Recognizer

| Property | Value |
|----------|-------|
| **Name** | `pattern-recognizer` |
| **Category** | Neural/ML |
| **Type** | `analyst` |
| **Color** | `#9C27B0` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `pattern_detection` - Detect recurring patterns
- `anomaly_detection` - Find anomalies
- `trend_analysis` - Analyze trends
- `prediction` - Make predictions

**When to Use:**
- Pattern discovery
- Anomaly detection
- Trend prediction

---

## 10. Optimization Agents

### 10.1 Topology Optimizer

| Property | Value |
|----------|-------|
| **Name** | `topology-optimizer` |
| **Category** | Optimization |
| **Type** | `coordinator` |
| **Color** | `#4CAF50` |
| **Priority** | `high` |

**Primary Capabilities:**
- `topology_analysis` - Analyze current topology
- `optimization_recommendation` - Recommend improvements
- `dynamic_restructuring` - Restructure on-the-fly
- `performance_monitoring` - Monitor topology performance

**When to Use:**
- Swarm topology optimization
- Performance improvement
- Dynamic restructuring

---

### 10.2 Resource Allocator

| Property | Value |
|----------|-------|
| **Name** | `resource-allocator` |
| **Category** | Optimization |
| **Type** | `coordinator` |
| **Color** | `#00BCD4` |
| **Priority** | `high` |

**Primary Capabilities:**
- `resource_distribution` - Distribute resources
- `capacity_planning` - Plan capacity
- `utilization_monitoring` - Monitor utilization
- `dynamic_allocation` - Allocate dynamically

**When to Use:**
- Resource management
- Capacity planning
- Utilization optimization

---

### 10.3 Benchmark Suite

| Property | Value |
|----------|-------|
| **Name** | `benchmark-suite` |
| **Category** | Optimization |
| **Type** | `analyst` |
| **Color** | `#FF9800` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `suite_execution` - Run benchmark suites
- `metrics_collection` - Collect metrics
- `comparison_analysis` - Compare results
- `report_generation` - Generate reports

**When to Use:**
- Comprehensive benchmarking
- Performance comparison
- Report generation

---

## 11. Flow-Nexus Platform Agents

### 11.1 Sandbox Manager

| Property | Value |
|----------|-------|
| **Name** | `sandbox-manager` |
| **Category** | Flow-Nexus |
| **Type** | `coordinator` |
| **Color** | `#2196F3` |
| **Priority** | `high` |

**Primary Capabilities:**
- `sandbox_creation` - Create E2B sandboxes
- `code_execution` - Execute code in sandboxes
- `environment_management` - Manage environments
- `resource_cleanup` - Clean up resources

**When to Use:**
- Cloud code execution
- Isolated environments
- Safe experimentation

---

### 11.2 Neural Network Trainer (Flow-Nexus)

| Property | Value |
|----------|-------|
| **Name** | `flow-nexus-neural` |
| **Category** | Flow-Nexus |
| **Type** | `specialist` |
| **Color** | `#9C27B0` |
| **Priority** | `high` |

**Primary Capabilities:**
- `cluster_init` - Initialize neural clusters
- `distributed_training` - Train across sandboxes
- `model_deployment` - Deploy trained models
- `inference` - Run distributed inference

**When to Use:**
- Cloud-based neural training
- Distributed inference
- Model deployment

---

### 11.3 Workflow Orchestrator (Flow-Nexus)

| Property | Value |
|----------|-------|
| **Name** | `flow-nexus-workflow` |
| **Category** | Flow-Nexus |
| **Type** | `coordinator` |
| **Color** | `#4CAF50` |
| **Priority** | `high` |

**Primary Capabilities:**
- `workflow_creation` - Create event-driven workflows
- `step_execution` - Execute workflow steps
- `queue_management` - Manage message queues
- `agent_assignment` - Assign agents to tasks

**When to Use:**
- Complex workflow automation
- Event-driven processing
- Multi-step orchestration

---

## 12. Template & Utility Agents

### 12.1 Base Template Generator

| Property | Value |
|----------|-------|
| **Name** | `base-template-generator` |
| **Category** | Template |
| **Type** | `generator` |
| **Color** | `#607D8B` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `template_creation` - Create project templates
- `scaffolding` - Generate project scaffolding
- `configuration_generation` - Generate configs
- `boilerplate_creation` - Create boilerplate code

**When to Use:**
- New project setup
- Template creation
- Scaffolding generation

---

### 12.2 Code Analyzer

| Property | Value |
|----------|-------|
| **Name** | `code-analyzer` |
| **Category** | Utility |
| **Type** | `analyst` |
| **Color** | `#795548` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `complexity_analysis` - Analyze code complexity
- `dependency_analysis` - Analyze dependencies
- `quality_metrics` - Calculate quality metrics
- `smell_detection` - Detect code smells

**When to Use:**
- Code quality analysis
- Complexity assessment
- Dependency mapping

**Spawning Example:**
```javascript
Task("Analyze code", `
  Comprehensive code analysis:
  - Complexity metrics
  - Code smells
  - Improvement suggestions
`, "code-analyzer");
```

---

### 12.3 Technical Writer

| Property | Value |
|----------|-------|
| **Name** | `technical-writer` |
| **Category** | Utility |
| **Type** | `documenter` |
| **Color** | `#9E9E9E` |
| **Priority** | `medium` |

**Primary Capabilities:**
- `documentation_creation` - Create documentation
- `api_documentation` - Document APIs
- `tutorial_writing` - Write tutorials
- `readme_generation` - Generate READMEs

**When to Use:**
- Documentation creation
- API documentation
- Tutorial writing

---

### 12.4 Migration Planner

| Property | Value |
|----------|-------|
| **Name** | `migration-planner` |
| **Category** | Utility |
| **Type** | `planner` |
| **Color** | `#FF5722` |
| **Priority** | `high` |

**Primary Capabilities:**
- `migration_analysis` - Analyze migration requirements
- `risk_assessment` - Assess migration risks
- `rollback_planning` - Plan rollback strategies
- `dependency_mapping` - Map dependencies

**When to Use:**
- System migrations
- Technology upgrades
- Database migrations

---

### 12.5 TDD London Swarm

| Property | Value |
|----------|-------|
| **Name** | `tdd-london-swarm` |
| **Category** | Testing |
| **Type** | `coordinator` |
| **Color** | `#F44336` |
| **Priority** | `high` |

**Primary Capabilities:**
- `outside_in_tdd` - London school TDD
- `mock_driven` - Mock-driven development
- `behavior_testing` - Behavior verification
- `collaboration_testing` - Test collaborations

**When to Use:**
- London school TDD
- Mock-heavy testing
- Behavior verification

---

### 12.6 Production Validator

| Property | Value |
|----------|-------|
| **Name** | `production-validator` |
| **Category** | Testing |
| **Type** | `validator` |
| **Color** | `#4CAF50` |
| **Priority** | `critical` |

**Primary Capabilities:**
- `production_readiness` - Check production readiness
- `security_validation` - Validate security
- `performance_validation` - Validate performance
- `compliance_check` - Check compliance

**When to Use:**
- Pre-production validation
- Security checks
- Compliance verification

---

## 13. Agent Spawning Reference

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

### Claude Code Task Tool

```javascript
// Single agent
await Task("Task description", "Detailed instructions...", "agent-type");

// Parallel agents (same message)
await Task("Research", "Research topic A...", "researcher");
await Task("Implement", "Build feature B...", "coder");
await Task("Test", "Test component C...", "tester");
```

### Agent Types Summary Table

| Type | Category | Priority | Best For |
|------|----------|----------|----------|
| `coder` | Core | high | Implementation |
| `researcher` | Core | high | Analysis |
| `tester` | Core | high | Testing |
| `reviewer` | Core | medium | Review |
| `planner` | Core | high | Planning |
| `hierarchical-coordinator` | Swarm | critical | Large projects |
| `mesh-coordinator` | Swarm | high | Fault tolerance |
| `queen-coordinator` | Hive-Mind | critical | Strategic control |
| `byzantine-coordinator` | Consensus | critical | Security |
| `specification` | SPARC | high | Requirements |
| `pr-manager` | GitHub | medium | PR lifecycle |
| `perf-analyzer` | Performance | high | Optimization |
| `safla-neural` | Neural | high | Learning systems |

---

## 14. Configuration Patterns

### Memory Coordination Pattern

```javascript
// Status reporting
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

// Shared data
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/shared/{data-type}",
  namespace: "coordination",
  value: JSON.stringify({
    data: {...},
    created_by: "agent-name"
  })
})

// Retrieval
mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "swarm/shared/research-findings",
  namespace: "coordination"
})
```

### Hook Configuration

```yaml
hooks:
  pre: |
    echo "Starting task: $TASK"
    npx claude-flow@alpha hooks pre-task --description "$TASK"
  post: |
    echo "Task completed"
    npx claude-flow@alpha hooks post-task --task-id "$TASK_ID"
```

### Environment Variables

```bash
# Agent Booster
AGENT_BOOSTER_ENABLED=true
AGENT_BOOSTER_CACHE_TTL=300000
AGENT_BOOSTER_POOL_MIN=3
AGENT_BOOSTER_POOL_MAX=10

# Multi-Model Router
ROUTER_STRATEGY=adaptive
ROUTER_PRIMARY_MODEL=ollama/qwen3:8b
ROUTER_FALLBACK_MODEL=claude-3-haiku
```

---

## 15. Performance Characteristics Summary

### Agent Performance Matrix

| Agent Category | Avg Task Time | Throughput | Memory Usage | Best Scale |
|---------------|---------------|------------|--------------|------------|
| Core Development | 5-15 min | High | Medium | 1-5 agents |
| Specialized | 10-30 min | Medium | High | 1-3 agents |
| Swarm Coordinators | Continuous | Very High | Low | 5-20 agents |
| Hive-Mind | Continuous | High | Medium | 3-10 agents |
| Consensus | Variable | Medium | Low | 3-7 agents |
| SPARC | 15-45 min | Medium | Medium | 1-2 agents |
| GitHub | 2-10 min | High | Low | 1-5 agents |
| Performance | 5-20 min | Low | High | 1-2 agents |
| Neural | Continuous | Very High | Very High | 1-5 agents |

### Topology Selection Guide

| Topology | Agents | Decision Speed | Fault Tolerance | Use Case |
|----------|--------|----------------|-----------------|----------|
| Hierarchical | 5-15 | Fast | Moderate | Clear delegation |
| Mesh | 8-20 | Medium | High | Resilience |
| Ring | 5-10 | Slow | Low | Pipelines |
| Star | 3-8 | Fast | Low | Simple coordination |
| Adaptive | 5-12 | Variable | Medium | Variable loads |

### Scaling Recommendations

| Project Size | Recommended Agents | Topology | Strategy |
|-------------|-------------------|----------|----------|
| Small (1-3 features) | 3-5 | Star | Sequential |
| Medium (4-10 features) | 6-10 | Hierarchical | Balanced |
| Large (10+ features) | 10-20 | Mesh | Parallel |
| Enterprise | 15-30 | Adaptive | Adaptive |

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

### Common Workflow

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

## Agent Count Summary

### By Category

| Category | Count | Examples |
|----------|-------|----------|
| Core Development | 5 | coder, researcher, tester, reviewer, planner |
| Specialized Development | 10 | system-architect, backend-dev, ml-developer, security-engineer |
| Swarm Coordination | 6 | hierarchical, mesh, adaptive, ring, star, smart-agent |
| Hive-Mind | 5 | queen, worker, scout, collective-intelligence, memory-manager |
| Consensus | 6 | byzantine, raft, gossip, crdt, quorum, security |
| SPARC | 6 | specification, pseudocode, architecture, refinement, coder, coordinator |
| GitHub | 12 | pr-manager, issue-tracker, code-review-swarm, release-manager |
| Performance | 5 | perf-analyzer, benchmarker, load-balancer, performance-monitor |
| Neural/ML | 5 | safla-neural, neural-trainer, pattern-recognizer |
| Optimization | 4 | topology-optimizer, resource-allocator, benchmark-suite |
| Flow-Nexus | 6 | sandbox, neural, workflow, app-store, challenges, payments |
| Template/Utility | 8 | base-template, code-analyzer, technical-writer, migration-planner |

### Total Agent Types: 78+ Core Types

With specialized variants, domain-specific configurations, and custom agent definitions, the total exceeds **150+ agent configurations**.

---

*This catalog covers the complete agent ecosystem available in Claude-Flow and Agentic-Flow. For the latest updates, refer to the official repositories at https://github.com/ruvnet/claude-flow*
