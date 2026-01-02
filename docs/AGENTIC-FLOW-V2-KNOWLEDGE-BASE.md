Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:01:14 EST

# Agentic Flow v2.0.1-alpha Complete Knowledge Base

**Version**: 2.0.1-alpha.5
**NPM Package**: `agentic-flow`
**Repository**: https://github.com/ruvnet/agentic-flow
**Author**: rUv (https://github.com/ruvnet)

---

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Complete Agent List (150+)](#complete-agent-list-150)
4. [All 213 MCP Tools](#all-213-mcp-tools)
5. [ReasoningBank API & Persistence](#reasoningbank-api--persistence)
6. [Multi-Model Router Configuration](#multi-model-router-configuration)
7. [Agent Booster (352x Optimization)](#agent-booster-352x-optimization)
8. [Cost Optimization Tiers](#cost-optimization-tiers)
9. [Installation & Usage](#installation--usage)

---

## Overview

Agentic Flow is a production-ready AI agent orchestration platform featuring:

- **150+ specialized agents** across development, swarm coordination, GitHub, and more
- **213 MCP tools** across 4 servers (Claude Flow, Flow Nexus, Agentic Payments, SDK)
- **ReasoningBank** - Persistent learning memory system (46% faster, 100% success rate)
- **Agent Booster** - 352x faster local code transformations via Rust/WASM
- **Multi-Model Router** - 85-99% cost savings across 10+ LLM providers

### Performance Metrics

| Metric | Result |
|--------|--------|
| SWE-Bench Solve Rate | 84.8% |
| Token Reduction | 32.3% |
| Speed Improvement | 2.8-4.4x |
| Neural Models | 27+ |
| Agent Booster Speedup | 352x |
| Cost Savings (Router) | 85-99% |
| ReasoningBank Improvement | 46% faster |

---

## Core Components

### 1. Agent Booster
Ultra-fast local code transformations via Rust/WASM

- **Performance**: 352x faster than LLM APIs
- **Cost**: $0 (100% free local execution)
- **Single edit**: 352ms (LLM) -> 1ms (Booster)
- **1000 files**: 5.87 minutes -> 1 second

### 2. AgentDB
State-of-the-art memory with causal reasoning

- **p95 latency**: < 50ms
- **Hit rate**: 80%
- **Features**: Reflexion memory, skill library, causal graphs

### 3. ReasoningBank
Persistent learning memory system

- **Improvement**: 46% faster task completion
- **Success rate**: 100% on recurring patterns
- **Token reduction**: 32.3%

### 4. Multi-Model Router
Intelligent cost optimization across 100+ LLMs

- **Cost savings**: 85-99%
- **Providers**: Anthropic, OpenAI, OpenRouter, Gemini, Ollama, ONNX

### 5. QUIC Transport
Ultra-low latency agent communication

- **Improvement**: 50-70% faster than TCP
- **Feature**: 0-RTT instant reconnection

### 6. Federation Hub (v2.0)
Ephemeral agents with persistent memory

- **Agent lifetime**: 5s-15min
- **Scaling**: Infinite scale, zero waste

---

## Complete Agent List (150+)

### Core Development Agents

| Agent | Description | Capabilities |
|-------|-------------|--------------|
| `coder` | Implementation specialist | Clean, efficient code writing |
| `reviewer` | Code review and QA | Quality assurance, best practices |
| `tester` | Comprehensive testing | 90%+ coverage, edge cases |
| `planner` | Strategic planning | Task decomposition, roadmaps |
| `researcher` | Deep research | Information gathering, analysis |

### Specialized Development Agents

| Agent | Description | Focus Area |
|-------|-------------|------------|
| `backend-dev` | REST/GraphQL API development | Server-side code |
| `mobile-dev` | React Native mobile apps | Mobile applications |
| `ml-developer` | Machine learning model creation | ML/AI systems |
| `system-architect` | System design and architecture | High-level design |
| `cicd-engineer` | CI/CD pipeline creation | DevOps automation |
| `api-docs` | OpenAPI/Swagger documentation | API documentation |

### Swarm Coordinator Agents

| Agent | Description | Topology |
|-------|-------------|----------|
| `hierarchical-coordinator` | Tree-based leadership | Hierarchical |
| `mesh-coordinator` | Peer-to-peer coordination | Mesh |
| `adaptive-coordinator` | Dynamic topology switching | Adaptive |
| `collective-intelligence-coordinator` | Hive-mind patterns | Collective |
| `swarm-memory-manager` | Cross-agent memory sync | Memory |

### Consensus & Distributed Agents

| Agent | Description | Protocol |
|-------|-------------|----------|
| `byzantine-coordinator` | Byzantine fault tolerance | BFT |
| `raft-manager` | Raft consensus protocol | Raft |
| `gossip-coordinator` | Gossip protocol coordination | Gossip |
| `consensus-builder` | Multi-protocol consensus | Multi |
| `crdt-synchronizer` | CRDT data synchronization | CRDT |
| `quorum-manager` | Quorum-based decisions | Quorum |
| `security-manager` | Security and access control | Security |

### Performance & Optimization Agents

| Agent | Description | Focus |
|-------|-------------|-------|
| `perf-analyzer` | Performance analysis | Metrics |
| `performance-benchmarker` | Benchmarking | Testing |
| `task-orchestrator` | Task distribution | Orchestration |
| `memory-coordinator` | Memory optimization | Resources |
| `smart-agent` | Adaptive learning | Intelligence |

### GitHub & Repository Agents

| Agent | Description | Actions |
|-------|-------------|---------|
| `github-modes` | Multi-mode GitHub operations | Various |
| `pr-manager` | Pull request lifecycle | PR management |
| `code-review-swarm` | Multi-agent code review | Reviews |
| `issue-tracker` | Intelligent issue management | Issues |
| `release-manager` | Automated release coordination | Releases |
| `workflow-automation` | GitHub Actions specialist | CI/CD |
| `project-board-sync` | Project board management | Projects |
| `repo-architect` | Repository architecture | Structure |
| `multi-repo-swarm` | Multi-repository coordination | Multi-repo |

### SPARC Methodology Agents

| Agent | Description | Phase |
|-------|-------------|-------|
| `sparc-coord` | SPARC workflow coordination | Coordination |
| `sparc-coder` | SPARC coding implementation | Coding |
| `specification` | Requirements analysis | Specification |
| `pseudocode` | Algorithm design | Pseudocode |
| `architecture` | System architecture | Architecture |
| `refinement` | TDD implementation | Refinement |

### Testing & Validation Agents

| Agent | Description | Scope |
|-------|-------------|-------|
| `tdd-london-swarm` | Test-driven development | TDD |
| `production-validator` | Production validation | Validation |

### Migration & Planning Agents

| Agent | Description | Focus |
|-------|-------------|-------|
| `migration-planner` | Migration strategy | Migrations |
| `swarm-init` | Swarm initialization | Setup |

### Additional Agent Types

| Agent Type | Count | Categories |
|------------|-------|------------|
| Direct API Agent | 1 | API integration |
| Claude Agent | 1 | Claude SDK |
| Claude Flow Agent | 1 | Flow orchestration |
| Code Review Agent | 1 | Reviews |
| Data Agent | 1 | Data processing |
| Web Research Agent | 1 | Web research |

**Total: 150+ agents available via `npx agentic-flow --list`**

---

## All 213 MCP Tools

### Tool Distribution by Server

| Server | Tools | Focus Area |
|--------|-------|------------|
| **Claude Flow** | 101 | Agent orchestration, memory, neural |
| **Flow Nexus** | 96 | Cloud execution, sandboxes, payments |
| **Agentic Payments** | 12 | Payment authorization, mandates |
| **Claude Flow SDK** | 4 | Low-level SDK integration |
| **Total** | **213** | Universal AI capabilities |

### 1. Swarm & Agent Orchestration (20 tools)

#### Core Swarm Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `swarm_init` | `topology: mesh\|hierarchical\|ring\|star`, `maxAgents: number`, `strategy: balanced\|specialized\|adaptive` | Initialize swarm with topology |
| `agent_spawn` | `type: coder\|researcher\|analyst\|optimizer\|coordinator`, `name: string`, `capabilities: string[]` | Spawn specialized agent |
| `task_orchestrate` | `task: string`, `strategy: parallel\|sequential\|adaptive`, `priority: low\|medium\|high\|critical`, `maxAgents: number` | Orchestrate complex task |
| `swarm_status` | `swarmId: string` | Get swarm status |
| `agent_list` | `filter: all\|active\|idle\|busy` | List active agents |
| `agent_metrics` | `agentId: string`, `metric: all\|cpu\|memory\|tasks\|performance` | Agent performance metrics |
| `swarm_scale` | `swarmId: string`, `targetSize: number` | Scale swarm up/down |
| `topology_optimize` | `swarmId: string` | Optimize topology dynamically |
| `swarm_destroy` | `swarmId: string` | Gracefully shutdown swarm |
| `agents_spawn_parallel` | `agents: AgentConfig[]`, `maxConcurrency: number`, `batchSize: number` | Spawn multiple agents (10-20x faster) |

#### Task Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `task_status` | `taskId: string` | Check task execution status |
| `task_results` | `taskId: string` | Get task completion results |
| `load_balance` | `swarmId: string`, `tasks: Task[]` | Distribute tasks efficiently |
| `coordination_sync` | `swarmId: string` | Sync agent coordination |

### 2. Memory & Learning (18 tools)

#### Memory Storage & Retrieval

| Tool | Parameters | Description |
|------|------------|-------------|
| `memory_usage` | `action: store\|retrieve\|list\|delete\|search`, `key: string`, `value: string`, `namespace: string`, `ttl: number` | Memory operations with TTL |
| `memory_search` | `pattern: string`, `namespace: string`, `limit: number` | Search memories with patterns |
| `memory_backup` | `path: string` | Create memory backup |
| `memory_restore` | `backupPath: string` | Restore from backup |
| `memory_persist` | `sessionId: string` | Cross-session persistence |
| `memory_namespace` | `namespace: string`, `action: create\|delete\|list` | Namespace management |
| `memory_compress` | `namespace: string` | Compress memory data |
| `memory_sync` | `target: string` | Sync across instances |
| `memory_analytics` | `timeframe: string` | Analyze memory usage |
| `cache_manage` | `action: get\|set\|clear`, `key: string` | Coordination cache management |
| `state_snapshot` | `name: string` | Create state snapshots |
| `context_restore` | `snapshotId: string` | Restore execution context |

### 3. Neural Networks & AI (15 tools)

#### Training & Inference

| Tool | Parameters | Description |
|------|------------|-------------|
| `neural_train` | `pattern_type: coordination\|optimization\|prediction`, `training_data: string`, `epochs: number` | Train with WASM SIMD |
| `neural_status` | `modelId: string` | Check neural status |
| `neural_predict` | `modelId: string`, `input: string` | Make AI predictions |
| `neural_patterns` | `action: analyze\|learn\|predict`, `operation: string`, `outcome: string` | Analyze cognitive patterns |
| `model_load` | `modelPath: string` | Load pre-trained models |
| `model_save` | `modelId: string`, `path: string` | Save trained models |
| `neural_compress` | `modelId: string`, `ratio: number` | Compress neural models |
| `inference_run` | `modelId: string`, `data: any[]` | Run neural inference |
| `pattern_recognize` | `data: any[]`, `patterns: any[]` | Pattern recognition |
| `cognitive_analyze` | `behavior: string` | Cognitive behavior analysis |
| `learning_adapt` | `experience: object` | Adaptive learning |
| `ensemble_create` | `models: string[]`, `strategy: string` | Create model ensembles |
| `transfer_learn` | `sourceModel: string`, `targetDomain: string` | Transfer learning |
| `neural_explain` | `modelId: string`, `prediction: object` | AI explainability |
| `wasm_optimize` | `operation: string` | WASM SIMD optimization |

### 4. Cloud Execution & Sandboxes (24 tools)

#### Flow Nexus Sandbox Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `sandbox_create` | `template: node\|python\|react\|nextjs\|vanilla\|base\|claude-code`, `name: string`, `env_vars: object`, `timeout: number` | Create code execution sandbox |
| `sandbox_execute` | `sandbox_id: string`, `code: string`, `language: string`, `timeout: number` | Execute code in sandbox |
| `sandbox_upload` | `sandbox_id: string`, `file_path: string`, `content: string` | Upload file to sandbox |
| `sandbox_status` | `sandbox_id: string` | Get sandbox status |
| `sandbox_list` | `status: running\|stopped\|all` | List all sandboxes |
| `sandbox_configure` | `sandbox_id: string`, `env_vars: object`, `install_packages: string[]` | Configure sandbox |
| `sandbox_stop` | `sandbox_id: string` | Stop running sandbox |
| `sandbox_delete` | `sandbox_id: string` | Delete sandbox |
| `sandbox_logs` | `sandbox_id: string`, `lines: number` | Get sandbox logs |

### 5. GitHub Integration (16 tools)

| Tool | Parameters | Description |
|------|------------|-------------|
| `github_repo_analyze` | `repo: string`, `analysis_type: code_quality\|performance\|security` | Analyze repository |
| `github_pr_manage` | `repo: string`, `pr_number: number`, `action: review\|merge\|close` | PR management |
| `github_code_review` | `repo: string`, `pr: number` | Automated code review |
| `github_issue_track` | `repo: string`, `action: triage\|assign\|label\|close` | Issue tracking |
| `github_release_coord` | `repo: string`, `version: string` | Release coordination |
| `github_workflow_auto` | `repo: string`, `workflow: object` | Workflow automation |
| `github_sync_coord` | `repos: string[]` | Multi-repo sync |
| `github_metrics` | `repo: string` | Repository metrics |

### 6. Payment Authorization (12 tools)

#### Agentic Payments

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_active_mandate` | `agent: string`, `holder: string`, `amount: number`, `currency: string`, `period: string`, `kind: string`, `merchant_allow: string[]`, `expires_at: string` | Create payment mandate |
| `sign_mandate` | `mandate: object`, `private_key: string` | Sign mandate with Ed25519 |
| `verify_mandate` | `signed_mandate: object`, `check_guards: boolean` | Verify mandate signature |
| `create_intent_mandate` | `merchant_id: string`, `customer_id: string`, `intent: string`, `max_amount: number`, `currency: string` | Intent-based mandate |
| `create_cart_mandate` | `merchant_id: string`, `customer_id: string`, `items: CartItem[]`, `currency: string` | Cart-based mandate |
| `revoke_mandate` | `mandate_id: string`, `reason: string` | Revoke mandate |

### 7. Workflow Automation (22 tools)

| Tool | Parameters | Description |
|------|------------|-------------|
| `workflow_create` | `name: string`, `steps: Step[]`, `triggers: string[]` | Create workflow |
| `workflow_execute` | `workflow_id: string`, `input_data: object`, `async: boolean` | Execute workflow |
| `workflow_status` | `workflow_id: string`, `include_metrics: boolean` | Get workflow status |
| `workflow_list` | `status: string`, `limit: number` | List workflows |
| `workflow_agent_assign` | `task_id: string`, `agent_type: string`, `use_vector_similarity: boolean` | Assign optimal agent |
| `workflow_queue_status` | `queue_name: string`, `include_messages: boolean` | Check queue status |
| `workflow_audit_trail` | `workflow_id: string`, `start_time: string`, `limit: number` | Get audit trail |
| `workflow_export` | `workflowId: string`, `format: string` | Export workflow |
| `workflow_template` | `action: string`, `template: object` | Manage templates |
| `automation_setup` | `rules: Rule[]` | Setup automation rules |
| `pipeline_create` | `config: object` | Create CI/CD pipelines |
| `scheduler_manage` | `action: string`, `schedule: object` | Task scheduling |
| `trigger_setup` | `events: string[]`, `actions: string[]` | Setup event triggers |
| `batch_process` | `items: any[]`, `operation: string` | Batch processing |
| `parallel_execute` | `tasks: Task[]` | Execute tasks in parallel |

### 8. Performance & Monitoring (18 tools)

| Tool | Parameters | Description |
|------|------------|-------------|
| `performance_report` | `timeframe: 24h\|7d\|30d`, `format: summary\|detailed\|json` | Performance reports |
| `bottleneck_analyze` | `component: string`, `metrics: string[]` | Identify bottlenecks |
| `token_usage` | `operation: string`, `timeframe: string` | Token consumption |
| `benchmark_run` | `suite: swarm\|wasm\|agent\|task`, `iterations: number` | Performance benchmarks |
| `metrics_collect` | `components: string[]` | Collect system metrics |
| `trend_analysis` | `metric: string`, `period: string` | Analyze performance trends |
| `cost_analysis` | `timeframe: string` | Cost and resource analysis |
| `quality_assess` | `target: string`, `criteria: string[]` | Quality assessment |
| `error_analysis` | `logs: string[]` | Error pattern analysis |
| `usage_stats` | `component: string` | Usage statistics |
| `health_check` | `components: string[]` | System health monitoring |
| `diagnostic_run` | `components: string[]` | System diagnostics |
| `log_analysis` | `logFile: string`, `patterns: string[]` | Log analysis & insights |
| `features_detect` | `component: string` | Feature detection |
| `security_scan` | `target: string`, `depth: string` | Security scanning |
| `backup_create` | `components: string[]`, `destination: string` | Create system backups |
| `restore_system` | `backupId: string` | System restoration |

### 9. App Store & Templates (12 tools)

| Tool | Parameters | Description |
|------|------------|-------------|
| `template_list` | `category: string`, `featured: boolean`, `limit: number` | List templates |
| `template_get` | `template_id: string` | Get template details |
| `template_deploy` | `template_id: string`, `deployment_name: string`, `variables: object` | Deploy template |
| `app_store_list_templates` | `category: string`, `limit: number`, `tags: string[]` | List app templates |
| `app_store_publish_app` | `name: string`, `description: string`, `category: string`, `source_code: string`, `tags: string[]` | Publish app |
| `app_get` | `app_id: string` | Get app details |
| `app_update` | `app_id: string`, `updates: object` | Update app |
| `app_search` | `search: string`, `category: string`, `featured: boolean` | Search apps |
| `app_analytics` | `app_id: string`, `timeframe: string` | Get app analytics |
| `app_installed` | `user_id: string` | Get installed apps |

### 10. User Management & Auth (16 tools)

| Tool | Parameters | Description |
|------|------------|-------------|
| `user_register` | `email: string`, `password: string`, `full_name: string` | Register user |
| `user_login` | `email: string`, `password: string` | Login user |
| `user_logout` | - | Logout user |
| `user_verify_email` | `token: string` | Verify email |
| `user_reset_password` | `email: string` | Request password reset |
| `user_update_password` | `token: string`, `new_password: string` | Update password |
| `user_profile` | `user_id: string` | Get user profile |
| `user_update_profile` | `user_id: string`, `updates: object` | Update profile |
| `user_stats` | `user_id: string` | Get user statistics |
| `user_upgrade` | `user_id: string`, `tier: pro\|enterprise` | Upgrade user tier |
| `auth_status` | `detailed: boolean` | Check auth status |
| `auth_init` | `mode: user\|service` | Initialize auth |

### 11. Dynamic Agent Architecture (DAA) Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `daa_agent_create` | `agent_type: string`, `capabilities: string[]`, `resources: object` | Create dynamic agent |
| `daa_capability_match` | `task_requirements: string[]`, `available_agents: string[]` | Match capabilities |
| `daa_resource_alloc` | `resources: object`, `agents: string[]` | Resource allocation |
| `daa_lifecycle_manage` | `agentId: string`, `action: string` | Agent lifecycle |
| `daa_communication` | `from: string`, `to: string`, `message: object` | Inter-agent communication |
| `daa_consensus` | `agents: string[]`, `proposal: object` | Consensus mechanisms |
| `daa_fault_tolerance` | `agentId: string`, `strategy: string` | Fault tolerance |
| `daa_optimization` | `target: string`, `metrics: string[]` | Performance optimization |

### 12. Query Control Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `query_control` | `action: pause\|resume\|terminate\|change_model`, `queryId: string`, `model: string` | Control running queries |
| `query_list` | `includeHistory: boolean` | List active queries |

---

## ReasoningBank API & Persistence

### Overview

ReasoningBank is a closed-loop memory system based on Google DeepMind research (arXiv:2509.25140).

### Core Exports

```typescript
// Main classes
import { HybridReasoningBank } from 'agentic-flow/reasoningbank';
import { AdvancedMemorySystem } from 'agentic-flow/reasoningbank';

// AgentDB integration
import { ReflexionMemory } from 'agentdb/controllers/ReflexionMemory';
import { SkillLibrary } from 'agentdb/controllers/SkillLibrary';
import { CausalMemoryGraph } from 'agentdb/controllers/CausalMemoryGraph';
import { CausalRecall } from 'agentdb/controllers/CausalRecall';
import { NightlyLearner } from 'agentdb/controllers/NightlyLearner';
import { EmbeddingService } from 'agentdb/controllers/EmbeddingService';

// Core functions
import {
  retrieveMemories,
  formatMemoriesForPrompt,
  judgeTrajectory,
  distillMemories,
  consolidate,
  shouldConsolidate,
  mattsParallel,
  mattsSequential,
  computeEmbedding,
  clearEmbeddingCache,
  mmrSelection,
  cosineSimilarity,
  scrubPII,
  containsPII,
  scrubMemory,
  loadConfig
} from 'agentic-flow/reasoningbank';
```

### Main API Functions

```typescript
// Initialize ReasoningBank
await initialize(): Promise<void>;

// Run task with memory augmentation
await runTask(options: {
  taskId: string;
  agentId: string;
  query: string;
  domain?: string;
  executeFn: (memories: any[]) => Promise<any>;
}): Promise<{
  verdict: any;
  usedMemories: any[];
  newMemories: string[];
  consolidated: boolean;
}>;
```

### Types

```typescript
interface ReasoningMemory {
  id: string;
  content: string;
  embedding: number[];
  metadata: object;
  createdAt: Date;
}

interface PatternEmbedding {
  pattern: string;
  embedding: number[];
  successRate: number;
}

interface TaskTrajectory {
  taskId: string;
  steps: TrajectoryStep[];
  outcome: 'success' | 'failure' | 'partial';
}

interface Verdict {
  success: boolean;
  confidence: number;
  reasoning: string;
}

interface DistilledMemory {
  key: string;
  value: string;
  importance: number;
}
```

### Configuration

```javascript
// reasoningbank.config.js
module.exports = {
  storage: {
    provider: 'chromadb',
    host: 'localhost',
    port: 8000,
    collectionName: 'reasoning-patterns'
  },
  learning: {
    minSimilarityThreshold: 0.75,
    maxPatternsPerQuery: 10,
    learningRate: 0.1,
    experienceRetention: '90d'
  },
  optimization: {
    autoConsolidate: true,
    autoPrune: true,
    pruneThreshold: 0.3,
    consolidationInterval: '7d'
  },
  quality: {
    minSuccessRate: 0.7,
    minUsageCount: 3,
    feedbackRequired: true,
    manualApproval: false
  }
};
```

### Performance Metrics

| Metric | Baseline | With ReasoningBank | Improvement |
|--------|----------|-------------------|-------------|
| Bug fix time | 45 min | 24 min | 46% faster |
| Feature implementation | 2.5 hrs | 1.4 hrs | 44% faster |
| Code reviews | 15 min | 9 min | 40% faster |
| Token usage | 10,500 | 7,200 | 31.4% reduction |

---

## Multi-Model Router Configuration

### Configuration File Location

- **Default**: `~/.agentic-flow/router.config.json`
- **Custom**: `--router-config <path>`
- **Environment**: `AGENTIC_FLOW_ROUTER_CONFIG`

### Complete Configuration Schema

```json
{
  "version": "1.0",
  "defaultProvider": "anthropic",
  "fallbackChain": ["anthropic", "openai", "ollama"],
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "baseUrl": "https://api.anthropic.com",
      "models": {
        "default": "claude-3-5-sonnet-20241022",
        "fast": "claude-3-5-haiku-20241022",
        "advanced": "claude-3-opus-20240229"
      },
      "timeout": 120000,
      "maxRetries": 3,
      "rateLimit": {
        "requestsPerMinute": 50,
        "tokensPerMinute": 100000
      }
    },
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "organization": "${OPENAI_ORG_ID}",
      "baseUrl": "https://api.openai.com/v1",
      "models": {
        "default": "gpt-4-turbo-preview",
        "fast": "gpt-3.5-turbo",
        "advanced": "gpt-4"
      }
    },
    "openrouter": {
      "apiKey": "${OPENROUTER_API_KEY}",
      "baseUrl": "https://openrouter.ai/api/v1",
      "models": {
        "default": "anthropic/claude-3.5-sonnet",
        "fast": "anthropic/claude-3-haiku",
        "advanced": "anthropic/claude-3-opus"
      }
    },
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "models": {
        "default": "llama3:8b",
        "fast": "phi3:mini",
        "advanced": "llama3:70b"
      },
      "gpuLayers": 35,
      "contextWindow": 8192
    },
    "litellm": {
      "enabled": true,
      "fallbackModels": [
        "gpt-4-turbo-preview",
        "claude-3-opus-20240229",
        "command-r-plus"
      ]
    }
  },
  "routing": {
    "mode": "cost-optimized",
    "rules": [
      {
        "condition": {
          "agentType": ["researcher", "planner"],
          "complexity": "low"
        },
        "action": {
          "provider": "openai",
          "model": "gpt-3.5-turbo"
        }
      },
      {
        "condition": {
          "agentType": ["coder", "reviewer"],
          "requiresTools": true
        },
        "action": {
          "provider": "anthropic",
          "model": "claude-3-5-sonnet-20241022"
        }
      }
    ],
    "costOptimization": {
      "enabled": true,
      "maxCostPerRequest": 0.50,
      "budgetAlerts": {
        "daily": 10.00,
        "monthly": 250.00
      }
    }
  },
  "toolCalling": {
    "translationEnabled": true,
    "defaultFormat": "anthropic",
    "fallbackStrategy": "disable-tools"
  },
  "monitoring": {
    "enabled": true,
    "logLevel": "info",
    "metrics": {
      "trackCost": true,
      "trackLatency": true,
      "trackTokens": true
    }
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 1000,
    "strategy": "lru"
  }
}
```

### Routing Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `manual` | User explicitly selects provider/model | Testing |
| `cost-optimized` | Automatically select cheapest suitable provider | Production |
| `performance-optimized` | Prioritize fastest provider | Real-time |
| `quality-optimized` | Prioritize most capable model | Critical tasks |
| `rule-based` | Use custom routing rules | Custom logic |

### CLI Override Options

```bash
# Override provider
npx agentic-flow --provider openai --task "..."

# Override model
npx agentic-flow --model gpt-4 --task "..."

# Override routing mode
npx agentic-flow --router-mode cost-optimized --task "..."

# Use custom config
npx agentic-flow --router-config ./custom-router.json --task "..."
```

---

## Agent Booster (352x Optimization)

### Performance Benchmarks

| Operation | LLM API | Agent Booster | Speedup |
|-----------|---------|---------------|---------|
| Single edit | 352ms | 1ms | **352x** |
| 10 files | 3.52s | 10ms | 352x |
| 100 files | 35.2s | 100ms | 352x |
| 1000 files | 5.87 min | 1s | 352x |

### Cost Comparison

| Operation | LLM API | Agent Booster | Savings |
|-----------|---------|---------------|---------|
| Single edit | $0.01 | $0.00 | 100% |
| 100 edits/day | $1.00/day | $0.00/day | $365/year |
| 1000 files | $10.00 | $0.00 | $10.00 |

### Modes

#### 1. Single File Edit
```bash
npx agentic-flow agent-booster edit \
  --file src/api.ts \
  --instructions "Add error handling" \
  --code '...'
```

#### 2. Batch Edit
```bash
npx agentic-flow agent-booster batch --config batch-edits.json
```

#### 3. Markdown Parse (LLM-Compatible)
```markdown
filepath=src/user.ts instruction="Add type annotation"
\`\`\`typescript
const user: User = { id: string; name: string; };
\`\`\`
```

### Configuration

```yaml
# agent-booster.yaml
agent_booster:
  max_concurrent_edits: 10
  batch_size: 100
  backup_files: true
  dry_run: false
  validate_syntax: true
  run_formatter: true
  log_level: "info"
```

### Use Cases

| Use Case | Appropriate For |
|----------|-----------------|
| Variable renaming | Agent Booster |
| Import statements | Agent Booster |
| Code formatting | Agent Booster |
| Function signatures | Agent Booster |
| Complex refactoring | LLM required |
| Bug fixes | LLM required |
| Feature implementation | LLM required |

---

## Cost Optimization Tiers

### Model Tiers

#### Tier 1: Flagship (Premium Quality)

| Model | Input Cost | Output Cost | Best For |
|-------|------------|-------------|----------|
| Claude Sonnet 4.5 | $3.00/1M | $15.00/1M | Complex reasoning |
| GPT-4o | $2.50/1M | $10.00/1M | General advanced |
| Claude Opus | $15.00/1M | $75.00/1M | Expert tasks |

#### Tier 2: Cost-Effective (2025 Models)

| Model | Input Cost | Output Cost | Savings |
|-------|------------|-------------|---------|
| DeepSeek R1 | $0.55/1M | $2.19/1M | 85% vs flagship |
| DeepSeek Chat V3 | $0.14/1M | $0.28/1M | 98% vs flagship |

#### Tier 3: Balanced

| Model | Input Cost | Output Cost | Speed |
|-------|------------|-------------|-------|
| Gemini 2.5 Flash | $0.07/1M | $0.30/1M | Fastest |
| Llama 3.3 70B | $0.30/1M | $0.30/1M | Open source |

#### Tier 4: Budget

| Model | Input Cost | Output Cost | Use Case |
|-------|------------|-------------|----------|
| Llama 3.1 8B | $0.055/1M | $0.055/1M | Ultra-low cost |
| GPT-3.5-turbo | $0.50/1M | $1.50/1M | General development |

#### Tier 5: Local/Privacy (Free)

| Model | Cost | Features |
|-------|------|----------|
| ONNX Phi-4 | FREE | Offline, private, no API |
| Ollama Llama3 | FREE | Local inference |

### Billing Tiers (Platform)

| Tier | Price | Agent Hours | API Requests | Deployments |
|------|-------|-------------|--------------|-------------|
| **Free** | $0/mo | 10 hrs | 1,000 | 5 |
| **Starter** | $29/mo | 50 hrs | 10,000 | 25 |
| **Professional** | $99/mo | 200 hrs | 100,000 | 100 |
| **Business** | $299/mo | 1,000 hrs | 1,000,000 | 500 |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited |

### Cost Savings Examples

**Code Review Agent (100 reviews/day)**:
- Without optimization: $240/month
- With Multi-Model Router: $36/month
- Savings: **$204/month (85%)**

**Codebase Migration (1000 files)**:
- LLM for all: $10 + 5.87 minutes
- With Agent Booster: $0 + 1 second
- Savings: **$10 + 5.85 minutes**

---

## Installation & Usage

### Prerequisites

- Node.js >= 18.0.0
- API keys for providers (at least one)

### Installation

```bash
# Global installation
npm install -g agentic-flow

# Or use with npx
npx agentic-flow --help

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...
```

### Basic Usage

```bash
# Run agent locally
npx agentic-flow --agent researcher --task "Analyze trends"

# With OpenRouter for cost savings
export OPENROUTER_API_KEY=sk-or-v1-...
npx agentic-flow --agent coder --task "Build API" \
  --model "meta-llama/llama-3.1-8b-instruct"

# With optimization
npx agentic-flow --agent coder --task "Build REST API" --optimize

# List all agents
npx agentic-flow --list
```

### AgentDB CLI (17 Commands)

```bash
npx agentdb reflexion store "session-1" "implement_auth" 0.95 true "Success!"
npx agentdb skill search "authentication" 10
npx agentdb causal query "" "code_quality" 0.8
npx agentdb learner run
```

### Programmatic API

```javascript
// Import components
import { ModelRouter } from 'agentic-flow/router';
import * as reasoningbank from 'agentic-flow/reasoningbank';
import { AgentBooster } from 'agentic-flow/agent-booster';
import { QuicTransport } from 'agentic-flow/transport/quic';

// Router usage
const router = new ModelRouter();
const response = await router.chat({
  model: 'auto',
  priority: 'cost',
  messages: [{ role: 'user', content: 'Your prompt' }]
});

// ReasoningBank usage
await reasoningbank.initialize();
await reasoningbank.storeMemory('pattern', 'value', { namespace: 'api' });
const results = await reasoningbank.queryMemories('search', { namespace: 'api' });
```

### MCP Server Setup

```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Add Flow Nexus (optional)
claude mcp add flow-nexus npx flow-nexus@latest mcp start

# Add Ruv Swarm (optional)
claude mcp add ruv-swarm npx ruv-swarm mcp start
```

---

## Version Information

- **Package Version**: 2.0.1-alpha.5
- **ReasoningBank Version**: 1.7.1
- **Paper Reference**: https://arxiv.org/html/2509.25140v1
- **License**: MIT
- **Node.js Requirement**: >= 18.0.0

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @anthropic-ai/claude-agent-sdk | ^0.1.5 | Claude agent runtime |
| @anthropic-ai/sdk | ^0.65.0 | Anthropic API |
| agentdb | ^2.0.0-alpha.2.18 | Memory system |
| fastmcp | ^3.19.0 | MCP server |
| better-sqlite3 | ^11.10.0 | Local storage |
| @xenova/transformers | ^2.17.2 | Embeddings |

---

*Generated from agentic-flow v2.0.1-alpha.5 source documentation*
