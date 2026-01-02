Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:03:04 EST

# Flow-Nexus v0.1.128 - Complete Knowledge Base

> **Comprehensive documentation for the Flow-Nexus MCP Server platform**
> **Version:** 0.1.128
> **Generated:** 2025-12-28

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Complete MCP Tools Reference (70+)](#2-complete-mcp-tools-reference)
3. [Swarm Orchestration Patterns](#3-swarm-orchestration-patterns)
4. [E2B Sandbox Integration](#4-e2b-sandbox-integration)
5. [Neural Training Capabilities](#5-neural-training-capabilities)
6. [Gamification Features](#6-gamification-features)
7. [Cloud Deployment Architecture](#7-cloud-deployment-architecture)
8. [API Reference](#8-api-reference)

---

## 1. Architecture Overview

### 1.1 Core Platform Components

Flow-Nexus is a cloud-based MCP (Model Context Protocol) server that provides:

- **Multi-Agent Swarm Orchestration** - Distributed agent coordination with multiple topologies
- **E2B Cloud Sandboxes** - Secure code execution environments
- **Neural Network Training** - DIY neural training with WASM SIMD acceleration
- **Gamification System** - rUv credits, challenges, achievements, and leaderboards
- **Supabase Backend** - Auth, database, real-time subscriptions, and storage

### 1.2 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| MCP Server | `@modelcontextprotocol/sdk` | Tool protocol implementation |
| Database | Supabase PostgreSQL | Persistent storage, RLS security |
| Authentication | Supabase Auth | User management, sessions |
| Sandboxes | E2B | Cloud code execution |
| Real-time | Supabase Realtime | Live updates, subscriptions |
| Storage | Supabase Storage | File management |
| Payments | Stripe (via Edge Functions) | Credit purchases |
| Neural Ops | WASM SIMD | High-performance ML operations |

### 1.3 Operating Modes

Flow-Nexus supports multiple operating modes for different use cases:

```javascript
const MODES = {
  complete: {
    name: 'Flow Nexus Complete',
    description: 'Full suite with all tools and resources including payments',
    tools: ['swarm', 'neural', 'github', 'daa', 'workflow', 'sandbox',
            'app-store', 'auth', 'user-management', 'realtime', 'storage',
            'application', 'system', 'payment'],
    resources: ['docs', 'templates', 'examples', 'configs']
  },
  store: {
    name: 'App Store Only',
    tools: ['app-store', 'application', 'storage', 'auth', 'user-management']
  },
  swarm: {
    name: 'Swarm Coordination',
    tools: ['swarm', 'neural', 'daa', 'auth', 'realtime']
  },
  dev: {
    name: 'Development Tools',
    tools: ['sandbox', 'workflow', 'github', 'auth', 'storage', 'system']
  },
  gamer: {
    name: 'Gamification Features',
    tools: ['app-store', 'auth', 'user-management'],
    filter: ['challenge', 'achievement', 'leaderboard', 'ruv', 'gamification']
  },
  enterprise: {
    name: 'Enterprise Suite',
    tools: ['swarm', 'neural', 'github', 'daa', 'workflow', 'sandbox',
            'app-store', 'auth', 'user-management', 'realtime', 'storage',
            'application', 'system', 'payment']
  },
  workflow: {
    name: 'Advanced Workflow System',
    tools: ['workflow', 'swarm', 'daa', 'auth', 'realtime'],
    features: ['pgmq', 'vector', 'audit', 'agents']
  },
  'neural-network': {
    name: 'Flow Nexus Neural',
    tools: ['neural', 'app-store', 'auth', 'storage', 'payment'],
    features: ['ruv-fann', 'wasm', 'divergent', 'templates', 'validation']
  }
};
```

---

## 2. Complete MCP Tools Reference

### 2.1 Tool Categories Overview

| Category | Tool Count | Description |
|----------|------------|-------------|
| Authentication | 2 | User auth and session management |
| Swarm | 9 | Multi-agent swarm orchestration |
| Agent | 1 | Agent spawning and management |
| Sandbox | 9 | E2B code execution environments |
| Neural (DIY) | 10 | DIY neural network training |
| Neural (Distributed) | 7 | Distributed cluster training |
| Workflow | 7 | Event-driven workflow automation |
| App Store | 11 | Templates, challenges, gamification |
| User Management | 10 | User CRUD and profiles |
| Real-time | 7 | Live subscriptions and streaming |
| Storage | 4 | File management |
| Application | 5 | App management and analytics |
| System | 4 | Health, audit, market data, Seraphina |
| Payment | 4 | Credits, billing, auto-refill |
| GitHub | 1 | Repository analysis |
| DAA | 1 | Decentralized autonomous agents |

**Total: 92+ MCP Tools**

---

### 2.2 Authentication Tools

#### `auth_status`
Check authentication status and permissions.

```json
{
  "name": "auth_status",
  "inputSchema": {
    "properties": {
      "detailed": { "type": "boolean", "description": "Include detailed auth info" }
    }
  }
}
```

**Response:**
```json
{
  "status": "authenticated | unauthenticated",
  "mode": "complete",
  "user": { "id": "uuid", "email": "user@example.com", "role": "user" },
  "permissions": "full | limited",
  "database_connected": true,
  "session_persisted": true
}
```

#### `auth_init`
Initialize secure authentication.

```json
{
  "name": "auth_init",
  "inputSchema": {
    "properties": {
      "mode": { "type": "string", "enum": ["user", "service"] }
    },
    "required": ["mode"]
  }
}
```

---

### 2.3 Swarm Tools

#### `swarm_init`
Initialize multi-agent swarm with specified topology.

```json
{
  "name": "swarm_init",
  "inputSchema": {
    "properties": {
      "topology": {
        "type": "string",
        "enum": ["hierarchical", "mesh", "ring", "star"],
        "description": "Swarm topology type"
      },
      "maxAgents": {
        "type": "number",
        "minimum": 1,
        "maximum": 100,
        "default": 8
      },
      "strategy": {
        "type": "string",
        "enum": ["balanced", "specialized", "adaptive"],
        "default": "balanced"
      }
    },
    "required": ["topology"]
  }
}
```

**Credit Cost:** `3 + (maxAgents * 2)` rUv credits

**Response:**
```json
{
  "success": true,
  "swarmId": "uuid",
  "topology": "mesh",
  "maxAgents": 8,
  "agents": [
    { "id": "agent_0", "type": "coordinator", "template": "base", "sandboxId": "...", "status": "active" }
  ],
  "credits_deducted": 19
}
```

#### `agent_spawn`
Create specialized AI agent in swarm.

```json
{
  "name": "agent_spawn",
  "inputSchema": {
    "properties": {
      "type": {
        "type": "string",
        "enum": ["researcher", "coder", "analyst", "optimizer", "coordinator"]
      },
      "capabilities": { "type": "array", "items": { "type": "string" } },
      "name": { "type": "string" }
    },
    "required": ["type"]
  }
}
```

#### `task_orchestrate`
Orchestrate complex task across swarm agents.

```json
{
  "name": "task_orchestrate",
  "inputSchema": {
    "properties": {
      "task": { "type": "string", "description": "Task description" },
      "priority": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
      "strategy": { "type": "string", "enum": ["parallel", "sequential", "adaptive"] },
      "maxAgents": { "type": "number", "minimum": 1, "maximum": 10 }
    },
    "required": ["task"]
  }
}
```

#### `swarm_list`
List active swarms.

```json
{
  "name": "swarm_list",
  "inputSchema": {
    "properties": {
      "status": { "type": "string", "enum": ["active", "destroyed", "all"], "default": "active" }
    }
  }
}
```

#### `swarm_status`
Get swarm status and details.

```json
{
  "name": "swarm_status",
  "inputSchema": {
    "properties": {
      "swarm_id": { "type": "string" }
    }
  }
}
```

#### `swarm_scale`
Scale swarm up or down.

```json
{
  "name": "swarm_scale",
  "inputSchema": {
    "properties": {
      "swarm_id": { "type": "string" },
      "target_agents": { "type": "number", "minimum": 1, "maximum": 100 }
    },
    "required": ["target_agents"]
  }
}
```

#### `swarm_destroy`
Destroy swarm and clean up resources.

```json
{
  "name": "swarm_destroy",
  "inputSchema": {
    "properties": {
      "swarm_id": { "type": "string" }
    }
  }
}
```

#### `swarm_create_from_template`
Create swarm from app store template.

```json
{
  "name": "swarm_create_from_template",
  "inputSchema": {
    "properties": {
      "template_id": { "type": "string" },
      "template_name": { "type": "string" },
      "overrides": {
        "type": "object",
        "properties": {
          "maxAgents": { "type": "number" },
          "strategy": { "type": "string", "enum": ["balanced", "specialized", "adaptive"] }
        }
      }
    }
  }
}
```

#### `swarm_templates_list`
List available swarm templates.

```json
{
  "name": "swarm_templates_list",
  "inputSchema": {
    "properties": {
      "category": { "type": "string", "enum": ["quickstart", "specialized", "enterprise", "custom", "all"] },
      "includeStore": { "type": "boolean", "default": true }
    }
  }
}
```

---

### 2.4 Sandbox Tools (E2B Integration)

#### `sandbox_create`
Create new code execution sandbox.

```json
{
  "name": "sandbox_create",
  "inputSchema": {
    "properties": {
      "template": {
        "type": "string",
        "enum": ["node", "python", "react", "nextjs", "vanilla", "base", "claude-code"]
      },
      "name": { "type": "string" },
      "env_vars": { "type": "object", "additionalProperties": { "type": "string" } },
      "api_key": { "type": "string", "description": "Custom E2B API key" },
      "anthropic_key": { "type": "string", "description": "Anthropic API key for Claude Code" },
      "timeout": { "type": "number", "default": 3600 },
      "metadata": { "type": "object" },
      "install_packages": { "type": "array", "items": { "type": "string" } },
      "startup_script": { "type": "string" }
    },
    "required": ["template"]
  }
}
```

#### `sandbox_execute`
Execute code in sandbox environment.

```json
{
  "name": "sandbox_execute",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" },
      "code": { "type": "string" },
      "language": { "type": "string", "default": "javascript" },
      "env_vars": { "type": "object" },
      "working_dir": { "type": "string" },
      "timeout": { "type": "number", "default": 60 },
      "capture_output": { "type": "boolean", "default": true }
    },
    "required": ["sandbox_id", "code"]
  }
}
```

#### `sandbox_list`
List all sandboxes.

```json
{
  "name": "sandbox_list",
  "inputSchema": {
    "properties": {
      "status": { "type": "string", "enum": ["running", "stopped", "all"], "default": "all" }
    }
  }
}
```

#### `sandbox_stop`
Stop a running sandbox.

```json
{
  "name": "sandbox_stop",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" }
    },
    "required": ["sandbox_id"]
  }
}
```

#### `sandbox_configure`
Configure environment variables and settings for existing sandbox.

```json
{
  "name": "sandbox_configure",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" },
      "env_vars": { "type": "object" },
      "anthropic_key": { "type": "string" },
      "install_packages": { "type": "array", "items": { "type": "string" } },
      "run_commands": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["sandbox_id"]
  }
}
```

#### `sandbox_delete`
Delete a sandbox.

```json
{
  "name": "sandbox_delete",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" }
    },
    "required": ["sandbox_id"]
  }
}
```

#### `sandbox_status`
Get sandbox status.

```json
{
  "name": "sandbox_status",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" }
    },
    "required": ["sandbox_id"]
  }
}
```

#### `sandbox_upload`
Upload file to sandbox.

```json
{
  "name": "sandbox_upload",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" },
      "file_path": { "type": "string" },
      "content": { "type": "string" }
    },
    "required": ["sandbox_id", "file_path", "content"]
  }
}
```

#### `sandbox_logs`
Get sandbox logs.

```json
{
  "name": "sandbox_logs",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" },
      "lines": { "type": "number", "default": 100, "minimum": 1, "maximum": 1000 }
    },
    "required": ["sandbox_id"]
  }
}
```

---

### 2.5 Neural Training Tools (DIY)

#### `neural_train`
Train a neural network with custom configuration.

```json
{
  "name": "neural_train",
  "inputSchema": {
    "properties": {
      "config": {
        "type": "object",
        "properties": {
          "architecture": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["feedforward", "lstm", "gan", "autoencoder", "transformer"] },
              "layers": { "type": "array", "items": { "type": "object" } }
            }
          },
          "training": {
            "type": "object",
            "properties": {
              "epochs": { "type": "number" },
              "batch_size": { "type": "number" },
              "learning_rate": { "type": "number" },
              "optimizer": { "type": "string" }
            }
          },
          "divergent": {
            "type": "object",
            "properties": {
              "enabled": { "type": "boolean" },
              "pattern": { "type": "string", "enum": ["lateral", "quantum", "chaotic", "associative", "evolutionary"] },
              "factor": { "type": "number" }
            }
          }
        }
      },
      "tier": { "type": "string", "enum": ["nano", "mini", "small", "medium", "large"] },
      "user_id": { "type": "string" }
    },
    "required": ["config"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "train_1703800000000_abc123",
  "modelId": "model_1703800000000_xyz789",
  "status": "completed",
  "estimatedCost": 50,
  "tier": "nano",
  "result": {
    "loss": 0.28,
    "accuracy": 0.91,
    "epochs_completed": 10,
    "training_time": 542.3
  }
}
```

#### `neural_predict`
Run inference on a trained model.

```json
{
  "name": "neural_predict",
  "inputSchema": {
    "properties": {
      "model_id": { "type": "string" },
      "input": { "type": "array" },
      "user_id": { "type": "string" }
    },
    "required": ["model_id", "input"]
  }
}
```

#### `neural_list_templates`
List available neural network templates.

```json
{
  "name": "neural_list_templates",
  "inputSchema": {
    "properties": {
      "category": { "type": "string", "enum": ["timeseries", "classification", "regression", "nlp", "vision", "anomaly", "generative", "reinforcement", "custom"] },
      "tier": { "type": "string", "enum": ["free", "paid"] },
      "search": { "type": "string" },
      "limit": { "type": "number", "default": 20 }
    }
  }
}
```

#### `neural_deploy_template`
Deploy a template from the app store.

```json
{
  "name": "neural_deploy_template",
  "inputSchema": {
    "properties": {
      "template_id": { "type": "string" },
      "custom_config": { "type": "object" },
      "user_id": { "type": "string" }
    },
    "required": ["template_id"]
  }
}
```

#### `neural_training_status`
Check status of a training job.

```json
{
  "name": "neural_training_status",
  "inputSchema": {
    "properties": {
      "job_id": { "type": "string" }
    },
    "required": ["job_id"]
  }
}
```

#### `neural_list_models`
List user's trained models.

```json
{
  "name": "neural_list_models",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" },
      "include_public": { "type": "boolean", "default": false }
    },
    "required": ["user_id"]
  }
}
```

#### `neural_validation_workflow`
Create a validation workflow for a model.

```json
{
  "name": "neural_validation_workflow",
  "inputSchema": {
    "properties": {
      "model_id": { "type": "string" },
      "validation_type": { "type": "string", "enum": ["performance", "accuracy", "robustness", "comprehensive"] },
      "user_id": { "type": "string" }
    },
    "required": ["model_id", "user_id"]
  }
}
```

#### `neural_publish_template`
Publish a model as a template.

```json
{
  "name": "neural_publish_template",
  "inputSchema": {
    "properties": {
      "model_id": { "type": "string" },
      "name": { "type": "string" },
      "description": { "type": "string" },
      "category": { "type": "string", "enum": ["timeseries", "classification", "regression", "nlp", "vision", "anomaly", "generative", "reinforcement", "custom"] },
      "price": { "type": "number", "default": 0 },
      "user_id": { "type": "string" }
    },
    "required": ["model_id", "name", "description", "user_id"]
  }
}
```

#### `neural_rate_template`
Rate a template.

```json
{
  "name": "neural_rate_template",
  "inputSchema": {
    "properties": {
      "template_id": { "type": "string" },
      "rating": { "type": "number", "minimum": 1, "maximum": 5 },
      "review": { "type": "string" },
      "user_id": { "type": "string" }
    },
    "required": ["template_id", "rating", "user_id"]
  }
}
```

#### `neural_performance_benchmark`
Run performance benchmarks on a model.

```json
{
  "name": "neural_performance_benchmark",
  "inputSchema": {
    "properties": {
      "model_id": { "type": "string" },
      "benchmark_type": { "type": "string", "enum": ["inference", "throughput", "memory", "comprehensive"] }
    },
    "required": ["model_id"]
  }
}
```

---

### 2.6 Distributed Neural Tools

#### `neural_cluster_init`
Initialize a distributed neural network cluster using E2B sandboxes.

```json
{
  "name": "neural_cluster_init",
  "inputSchema": {
    "properties": {
      "name": { "type": "string" },
      "topology": { "type": "string", "enum": ["mesh", "ring", "star", "hierarchical"], "default": "mesh" },
      "architecture": { "type": "string", "enum": ["transformer", "cnn", "rnn", "gnn", "hybrid"], "default": "transformer" },
      "wasmOptimization": { "type": "boolean", "default": true },
      "daaEnabled": { "type": "boolean", "default": true },
      "consensus": { "type": "string", "enum": ["proof-of-learning", "byzantine", "raft", "gossip"], "default": "proof-of-learning" }
    },
    "required": ["name"]
  }
}
```

#### `neural_node_deploy`
Deploy a neural network node in an E2B sandbox.

```json
{
  "name": "neural_node_deploy",
  "inputSchema": {
    "properties": {
      "cluster_id": { "type": "string" },
      "node_type": { "type": "string", "enum": ["worker", "parameter_server", "aggregator", "validator"], "default": "worker" },
      "model": { "type": "string", "enum": ["base", "large", "xl", "custom"], "default": "base" },
      "capabilities": { "type": "array", "default": ["training", "inference"] },
      "autonomy": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.8 },
      "template": { "type": "string", "default": "nodejs" },
      "layers": { "type": "array" }
    },
    "required": ["cluster_id"]
  }
}
```

#### `neural_cluster_connect`
Connect nodes in the neural cluster based on topology.

```json
{
  "name": "neural_cluster_connect",
  "inputSchema": {
    "properties": {
      "cluster_id": { "type": "string" },
      "topology": { "type": "string", "enum": ["mesh", "ring", "star", "hierarchical"] }
    },
    "required": ["cluster_id"]
  }
}
```

#### `neural_train_distributed`
Start distributed neural network training across sandbox cluster.

```json
{
  "name": "neural_train_distributed",
  "inputSchema": {
    "properties": {
      "cluster_id": { "type": "string" },
      "dataset": { "type": "string" },
      "epochs": { "type": "integer", "minimum": 1, "maximum": 1000, "default": 10 },
      "batch_size": { "type": "integer", "minimum": 1, "maximum": 512, "default": 32 },
      "learning_rate": { "type": "number", "minimum": 0.00001, "maximum": 1, "default": 0.001 },
      "optimizer": { "type": "string", "enum": ["adam", "sgd", "rmsprop", "adagrad"], "default": "adam" },
      "federated": { "type": "boolean", "default": false }
    },
    "required": ["cluster_id", "dataset"]
  }
}
```

#### `neural_cluster_status`
Get status of distributed neural cluster and training sessions.

```json
{
  "name": "neural_cluster_status",
  "inputSchema": {
    "properties": {
      "cluster_id": { "type": "string" }
    },
    "required": ["cluster_id"]
  }
}
```

#### `neural_predict_distributed`
Run inference across distributed neural network.

```json
{
  "name": "neural_predict_distributed",
  "inputSchema": {
    "properties": {
      "cluster_id": { "type": "string" },
      "input_data": { "type": "string" },
      "aggregation": { "type": "string", "enum": ["mean", "majority", "weighted", "ensemble"], "default": "mean" }
    },
    "required": ["cluster_id", "input_data"]
  }
}
```

#### `neural_cluster_terminate`
Terminate distributed neural cluster and cleanup sandboxes.

```json
{
  "name": "neural_cluster_terminate",
  "inputSchema": {
    "properties": {
      "cluster_id": { "type": "string" }
    },
    "required": ["cluster_id"]
  }
}
```

---

### 2.7 Workflow Tools

#### `workflow_create`
Create advanced workflow with event-driven processing.

```json
{
  "name": "workflow_create",
  "inputSchema": {
    "properties": {
      "name": { "type": "string" },
      "description": { "type": "string" },
      "steps": { "type": "array" },
      "triggers": { "type": "array" },
      "priority": { "type": "integer", "minimum": 0, "maximum": 10 },
      "metadata": { "type": "object" }
    },
    "required": ["name", "steps"]
  }
}
```

#### `workflow_execute`
Execute workflow with message queue processing.

```json
{
  "name": "workflow_execute",
  "inputSchema": {
    "properties": {
      "workflow_id": { "type": "string" },
      "input_data": { "type": "object" },
      "async": { "type": "boolean" }
    },
    "required": ["workflow_id"]
  }
}
```

#### `workflow_status`
Get workflow execution status and metrics.

```json
{
  "name": "workflow_status",
  "inputSchema": {
    "properties": {
      "workflow_id": { "type": "string" },
      "execution_id": { "type": "string" },
      "include_metrics": { "type": "boolean" }
    }
  }
}
```

#### `workflow_list`
List workflows with filtering.

```json
{
  "name": "workflow_list",
  "inputSchema": {
    "properties": {
      "limit": { "type": "integer", "default": 10 },
      "offset": { "type": "integer", "default": 0 },
      "status": { "type": "string" }
    }
  }
}
```

#### `workflow_agent_assign`
Assign optimal agent to workflow task.

```json
{
  "name": "workflow_agent_assign",
  "inputSchema": {
    "properties": {
      "task_id": { "type": "string" },
      "agent_type": { "type": "string" },
      "use_vector_similarity": { "type": "boolean" }
    },
    "required": ["task_id"]
  }
}
```

#### `workflow_queue_status`
Check message queue status.

```json
{
  "name": "workflow_queue_status",
  "inputSchema": {
    "properties": {
      "queue_name": { "type": "string" },
      "include_messages": { "type": "boolean" }
    }
  }
}
```

#### `workflow_audit_trail`
Get workflow audit trail.

```json
{
  "name": "workflow_audit_trail",
  "inputSchema": {
    "properties": {
      "workflow_id": { "type": "string" },
      "limit": { "type": "integer", "default": 50 },
      "start_time": { "type": "string" }
    }
  }
}
```

---

### 2.8 App Store & Gamification Tools

#### `template_list`
List available deployment templates.

```json
{
  "name": "template_list",
  "inputSchema": {
    "properties": {
      "category": { "type": "string" },
      "template_type": { "type": "string" },
      "featured": { "type": "boolean" },
      "limit": { "type": "number", "default": 20, "minimum": 1, "maximum": 100 }
    }
  }
}
```

#### `template_get`
Get specific template details.

```json
{
  "name": "template_get",
  "inputSchema": {
    "properties": {
      "template_id": { "type": "string" },
      "template_name": { "type": "string" }
    }
  }
}
```

#### `template_deploy`
Deploy a template with variables.

```json
{
  "name": "template_deploy",
  "inputSchema": {
    "properties": {
      "template_id": { "type": "string" },
      "template_name": { "type": "string" },
      "deployment_name": { "type": "string" },
      "variables": { "type": "object" },
      "env_vars": { "type": "object" }
    }
  }
}
```

#### `app_store_list_templates`
List available application templates.

```json
{
  "name": "app_store_list_templates",
  "inputSchema": {
    "properties": {
      "category": { "type": "string" },
      "limit": { "type": "number", "default": 20 },
      "tags": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

#### `app_store_publish_app`
Publish new application to store.

```json
{
  "name": "app_store_publish_app",
  "inputSchema": {
    "properties": {
      "name": { "type": "string" },
      "description": { "type": "string" },
      "category": { "type": "string" },
      "source_code": { "type": "string" },
      "version": { "type": "string", "default": "1.0.0" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "metadata": { "type": "object" }
    },
    "required": ["name", "description", "category", "source_code"]
  }
}
```

#### `challenges_list`
List available challenges.

```json
{
  "name": "challenges_list",
  "inputSchema": {
    "properties": {
      "difficulty": { "type": "string", "enum": ["beginner", "intermediate", "advanced", "expert"] },
      "category": { "type": "string" },
      "status": { "type": "string", "enum": ["active", "completed", "locked"], "default": "active" },
      "limit": { "type": "number", "default": 20 }
    }
  }
}
```

#### `challenge_get`
Get specific challenge details.

```json
{
  "name": "challenge_get",
  "inputSchema": {
    "properties": {
      "challenge_id": { "type": "string" }
    },
    "required": ["challenge_id"]
  }
}
```

#### `challenge_submit`
Submit solution for a challenge.

```json
{
  "name": "challenge_submit",
  "inputSchema": {
    "properties": {
      "challenge_id": { "type": "string" },
      "user_id": { "type": "string" },
      "solution_code": { "type": "string" },
      "language": { "type": "string" },
      "execution_time": { "type": "number" }
    },
    "required": ["challenge_id", "user_id", "solution_code"]
  }
}
```

#### `leaderboard_get`
Get leaderboard rankings.

```json
{
  "name": "leaderboard_get",
  "inputSchema": {
    "properties": {
      "type": { "type": "string", "enum": ["global", "weekly", "monthly", "challenge"], "default": "global" },
      "challenge_id": { "type": "string" },
      "limit": { "type": "number", "default": 10 }
    }
  }
}
```

#### `achievements_list`
List user achievements and badges.

```json
{
  "name": "achievements_list",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" },
      "category": { "type": "string" }
    },
    "required": ["user_id"]
  }
}
```

#### `app_store_earn_ruv`
Award rUv credits to user.

```json
{
  "name": "app_store_earn_ruv",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" },
      "amount": { "type": "number", "minimum": 1 },
      "reason": { "type": "string" },
      "source": { "type": "string" }
    },
    "required": ["user_id", "amount", "reason"]
  }
}
```

---

### 2.9 User Management Tools

#### `user_register`
Register new user account.

```json
{
  "name": "user_register",
  "inputSchema": {
    "properties": {
      "email": { "type": "string" },
      "password": { "type": "string" },
      "username": { "type": "string" },
      "full_name": { "type": "string" }
    },
    "required": ["email", "password"]
  }
}
```

#### `user_login`
Login user and create session.

```json
{
  "name": "user_login",
  "inputSchema": {
    "properties": {
      "email": { "type": "string" },
      "password": { "type": "string" }
    },
    "required": ["email", "password"]
  }
}
```

#### `user_logout`
Logout user and clear session.

```json
{
  "name": "user_logout",
  "inputSchema": { "properties": {} }
}
```

#### `user_verify_email`
Verify email with token.

```json
{
  "name": "user_verify_email",
  "inputSchema": {
    "properties": {
      "token": { "type": "string" }
    },
    "required": ["token"]
  }
}
```

#### `user_reset_password`
Request password reset.

```json
{
  "name": "user_reset_password",
  "inputSchema": {
    "properties": {
      "email": { "type": "string" }
    },
    "required": ["email"]
  }
}
```

#### `user_update_password`
Update password with reset token.

```json
{
  "name": "user_update_password",
  "inputSchema": {
    "properties": {
      "token": { "type": "string" },
      "new_password": { "type": "string" }
    },
    "required": ["token", "new_password"]
  }
}
```

#### `user_upgrade`
Upgrade user tier.

```json
{
  "name": "user_upgrade",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" },
      "tier": { "type": "string", "enum": ["pro", "enterprise"] }
    },
    "required": ["user_id", "tier"]
  }
}
```

#### `user_stats`
Get user statistics.

```json
{
  "name": "user_stats",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" }
    },
    "required": ["user_id"]
  }
}
```

#### `user_profile`
Get user profile.

```json
{
  "name": "user_profile",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" }
    },
    "required": ["user_id"]
  }
}
```

#### `user_update_profile`
Update user profile.

```json
{
  "name": "user_update_profile",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" },
      "updates": { "type": "object" }
    },
    "required": ["user_id", "updates"]
  }
}
```

---

### 2.10 Real-time & Streaming Tools

#### `execution_stream_subscribe`
Subscribe to real-time execution stream updates.

```json
{
  "name": "execution_stream_subscribe",
  "inputSchema": {
    "properties": {
      "sandbox_id": { "type": "string" },
      "deployment_id": { "type": "string" },
      "stream_type": { "type": "string", "enum": ["claude-code", "claude-flow-swarm", "claude-flow-hive-mind", "github-integration"] }
    }
  }
}
```

#### `execution_stream_status`
Get current status of execution stream.

```json
{
  "name": "execution_stream_status",
  "inputSchema": {
    "properties": {
      "stream_id": { "type": "string" },
      "sandbox_id": { "type": "string" }
    }
  }
}
```

#### `execution_files_list`
List files created during execution.

```json
{
  "name": "execution_files_list",
  "inputSchema": {
    "properties": {
      "stream_id": { "type": "string" },
      "sandbox_id": { "type": "string" },
      "file_type": { "type": "string" },
      "created_by": { "type": "string", "enum": ["claude-code", "claude-flow", "git-clone", "user"] }
    }
  }
}
```

#### `execution_file_get`
Get specific file content from execution.

```json
{
  "name": "execution_file_get",
  "inputSchema": {
    "properties": {
      "file_id": { "type": "string" },
      "stream_id": { "type": "string" },
      "file_path": { "type": "string" }
    }
  }
}
```

#### `realtime_subscribe`
Subscribe to real-time database changes.

```json
{
  "name": "realtime_subscribe",
  "inputSchema": {
    "properties": {
      "table": { "type": "string" },
      "event": { "type": "string", "enum": ["INSERT", "UPDATE", "DELETE", "*"], "default": "*" },
      "filter": { "type": "string" }
    },
    "required": ["table"]
  }
}
```

#### `realtime_unsubscribe`
Unsubscribe from real-time changes.

```json
{
  "name": "realtime_unsubscribe",
  "inputSchema": {
    "properties": {
      "subscription_id": { "type": "string" }
    },
    "required": ["subscription_id"]
  }
}
```

#### `realtime_list`
List active subscriptions.

```json
{
  "name": "realtime_list",
  "inputSchema": { "properties": {} }
}
```

---

### 2.11 Storage Tools

#### `storage_upload`
Upload file to storage.

```json
{
  "name": "storage_upload",
  "inputSchema": {
    "properties": {
      "bucket": { "type": "string" },
      "path": { "type": "string" },
      "content": { "type": "string" },
      "content_type": { "type": "string" }
    },
    "required": ["bucket", "path", "content"]
  }
}
```

#### `storage_delete`
Delete file from storage.

```json
{
  "name": "storage_delete",
  "inputSchema": {
    "properties": {
      "bucket": { "type": "string" },
      "path": { "type": "string" }
    },
    "required": ["bucket", "path"]
  }
}
```

#### `storage_list`
List files in storage bucket.

```json
{
  "name": "storage_list",
  "inputSchema": {
    "properties": {
      "bucket": { "type": "string" },
      "path": { "type": "string", "default": "" },
      "limit": { "type": "number", "default": 100 }
    },
    "required": ["bucket"]
  }
}
```

#### `storage_get_url`
Get public URL for file.

```json
{
  "name": "storage_get_url",
  "inputSchema": {
    "properties": {
      "bucket": { "type": "string" },
      "path": { "type": "string" },
      "expires_in": { "type": "number", "default": 3600 }
    },
    "required": ["bucket", "path"]
  }
}
```

---

### 2.12 Application Tools

#### `app_get`
Get specific application details.

```json
{
  "name": "app_get",
  "inputSchema": {
    "properties": {
      "app_id": { "type": "string" }
    },
    "required": ["app_id"]
  }
}
```

#### `app_update`
Update application information.

```json
{
  "name": "app_update",
  "inputSchema": {
    "properties": {
      "app_id": { "type": "string" },
      "updates": { "type": "object" }
    },
    "required": ["app_id", "updates"]
  }
}
```

#### `app_search`
Search applications with filters.

```json
{
  "name": "app_search",
  "inputSchema": {
    "properties": {
      "search": { "type": "string" },
      "category": { "type": "string" },
      "featured": { "type": "boolean" },
      "limit": { "type": "number", "default": 20 }
    }
  }
}
```

#### `app_analytics`
Get application analytics.

```json
{
  "name": "app_analytics",
  "inputSchema": {
    "properties": {
      "app_id": { "type": "string" },
      "timeframe": { "type": "string", "enum": ["24h", "7d", "30d", "90d"], "default": "30d" }
    },
    "required": ["app_id"]
  }
}
```

#### `app_installed`
Get user installed applications.

```json
{
  "name": "app_installed",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" }
    },
    "required": ["user_id"]
  }
}
```

---

### 2.13 System Tools

#### `system_health`
Check system health status.

```json
{
  "name": "system_health",
  "inputSchema": { "properties": {} }
}
```

#### `audit_log`
Get audit log entries.

```json
{
  "name": "audit_log",
  "inputSchema": {
    "properties": {
      "user_id": { "type": "string" },
      "limit": { "type": "number", "default": 100 }
    }
  }
}
```

#### `market_data`
Get market statistics and trends.

```json
{
  "name": "market_data",
  "inputSchema": { "properties": {} }
}
```

#### `seraphina_chat`
Seek audience with Queen Seraphina for guidance and wisdom.

```json
{
  "name": "seraphina_chat",
  "inputSchema": {
    "properties": {
      "message": { "type": "string", "description": "Your message or question for Queen Seraphina" },
      "enable_tools": { "type": "boolean", "default": false, "description": "Enable Seraphina to use tools" },
      "conversation_history": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "role": { "type": "string", "enum": ["user", "assistant"] },
            "content": { "type": "string" }
          }
        }
      }
    },
    "required": ["message"]
  }
}
```

---

### 2.14 Payment Tools

#### `check_balance`
Check current credit balance and auto-refill status.

```json
{
  "name": "check_balance",
  "inputSchema": { "properties": {} }
}
```

**Response:**
```json
{
  "success": true,
  "balance": 150,
  "auto_refill_enabled": true,
  "auto_refill_threshold": 20,
  "auto_refill_amount": 50,
  "low_balance_warning": false
}
```

#### `create_payment_link`
Create a secure payment link for purchasing credits.

```json
{
  "name": "create_payment_link",
  "inputSchema": {
    "properties": {
      "amount": { "type": "number", "minimum": 10, "maximum": 10000 }
    },
    "required": ["amount"]
  }
}
```

**Credit Conversion:** `1 USD = 100 credits` (with 10% bonus for purchases >= $100)

#### `configure_auto_refill`
Configure automatic credit refill settings.

```json
{
  "name": "configure_auto_refill",
  "inputSchema": {
    "properties": {
      "enabled": { "type": "boolean" },
      "threshold": { "type": "number", "minimum": 10 },
      "amount": { "type": "number", "minimum": 10 }
    },
    "required": ["enabled"]
  }
}
```

#### `get_payment_history`
Get recent payment and transaction history.

```json
{
  "name": "get_payment_history",
  "inputSchema": {
    "properties": {
      "limit": { "type": "number", "default": 10, "minimum": 1, "maximum": 100 }
    }
  }
}
```

---

### 2.15 GitHub Tools

#### `github_repo_analyze`
Analyze GitHub repository.

```json
{
  "name": "github_repo_analyze",
  "inputSchema": {
    "properties": {
      "repo": { "type": "string", "description": "Repository name (owner/repo)" },
      "analysis_type": { "type": "string", "enum": ["code_quality", "performance", "security"] }
    },
    "required": ["repo"]
  }
}
```

---

### 2.16 DAA Tools (Decentralized Autonomous Agents)

#### `daa_agent_create`
Create decentralized autonomous agent.

```json
{
  "name": "daa_agent_create",
  "inputSchema": {
    "properties": {
      "agent_type": { "type": "string" },
      "capabilities": { "type": "array", "items": { "type": "string" } },
      "resources": { "type": "object" }
    },
    "required": ["agent_type"]
  }
}
```

---

## 3. Swarm Orchestration Patterns

### 3.1 Supported Topologies

| Topology | Description | Best For |
|----------|-------------|----------|
| **hierarchical** | Tree structure with coordinator at root | Complex multi-stage tasks |
| **mesh** | Fully connected peer-to-peer | Collaborative parallel processing |
| **ring** | Circular chain of agents | Sequential pipeline workflows |
| **star** | Central hub with spoke agents | Centralized coordination tasks |

### 3.2 Agent Types

| Type | Role | Capabilities |
|------|------|--------------|
| **coordinator** | Orchestrates other agents | Task assignment, monitoring, aggregation |
| **researcher** | Information gathering | Search, analysis, summarization |
| **coder** | Code generation/modification | Programming, debugging, refactoring |
| **analyst** | Data analysis | Pattern recognition, metrics, insights |
| **optimizer** | Performance tuning | Optimization, benchmarking, efficiency |
| **worker** | General task execution | Flexible task handling |

### 3.3 Distribution Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **balanced** | Even distribution across agents | General workloads |
| **specialized** | Route to specialists | Domain-specific tasks |
| **adaptive** | Dynamic based on load/performance | Variable workloads |

### 3.4 Example: Creating a Research Swarm

```javascript
// 1. Initialize swarm
const swarm = await flow_nexus.swarm_init({
  topology: "mesh",
  maxAgents: 5,
  strategy: "specialized"
});

// 2. Spawn specialized agents
await flow_nexus.agent_spawn({ type: "researcher", name: "web-researcher" });
await flow_nexus.agent_spawn({ type: "analyst", name: "data-analyst" });
await flow_nexus.agent_spawn({ type: "coder", name: "implementation" });

// 3. Orchestrate task
await flow_nexus.task_orchestrate({
  task: "Research and implement a rate limiter",
  priority: "high",
  strategy: "adaptive",
  maxAgents: 3
});
```

---

## 4. E2B Sandbox Integration

### 4.1 Available Templates

| Template | Language/Framework | Version | Use Case |
|----------|-------------------|---------|----------|
| `node` / `nodejs` | Node.js | 18.x | JavaScript/TypeScript |
| `python` | Python | 3.11 | Python scripting, ML |
| `react` | React | 18.2 | Frontend development |
| `nextjs` | Next.js | 14.0 | Full-stack React |
| `vanilla` | Vanilla JS | ES2022 | Pure JavaScript |
| `base` | Base environment | - | General purpose |
| `claude-code` | Claude Code SDK | - | AI-assisted development |

### 4.2 Sandbox Lifecycle

```
create -> configure -> execute -> (upload/logs) -> stop -> delete
```

### 4.3 E2B Service Implementation

The E2B service (`src/services/e2b-service.js`) provides:

```javascript
class E2BService {
  constructor() {
    this.apiKey = process.env.E2B_API_KEY;
    this.baseUrl = 'https://api.e2b.dev/v1';
    this.sandboxes = new Map();
  }

  // Core methods
  async createSandbox(template, name);
  async executeCode(sandboxId, code, language);
  async stopSandbox(sandboxId);
  async deleteSandbox(sandboxId);
  async uploadFile(sandboxId, filePath, content);
  async downloadFile(sandboxId, filePath);
  async runCommand(sandboxId, command);
  async getLogs(sandboxId, lines);
  async executeInSandbox(sandboxId, params);  // Neural tools compatibility
}
```

### 4.4 Example: Execute Code in Sandbox

```javascript
// Create a Python sandbox
const sandbox = await flow_nexus.sandbox_create({
  template: "python",
  name: "ml-sandbox",
  install_packages: ["numpy", "pandas", "scikit-learn"],
  env_vars: { "DEBUG": "true" }
});

// Execute code
const result = await flow_nexus.sandbox_execute({
  sandbox_id: sandbox.id,
  code: `
import numpy as np
import pandas as pd

data = np.random.randn(100, 5)
df = pd.DataFrame(data, columns=['A', 'B', 'C', 'D', 'E'])
print(df.describe())
  `,
  language: "python"
});

// Get logs
const logs = await flow_nexus.sandbox_logs({
  sandbox_id: sandbox.id,
  lines: 50
});
```

---

## 5. Neural Training Capabilities

### 5.1 Architecture Types

| Architecture | Description | Use Cases |
|--------------|-------------|-----------|
| `feedforward` | Standard forward-only network | Classification, regression |
| `lstm` | Long Short-Term Memory | Time series, sequences |
| `gan` | Generative Adversarial Network | Image generation |
| `autoencoder` | Encoder-decoder architecture | Dimensionality reduction |
| `transformer` | Attention-based architecture | NLP, sequence modeling |

### 5.2 Training Tiers

| Tier | Cost | Resources | Daily Limit (Free) |
|------|------|-----------|-------------------|
| `nano` | Free | Minimal | Limited |
| `mini` | Low | Basic | N/A |
| `small` | Medium | Standard | N/A |
| `medium` | High | Enhanced | N/A |
| `large` | Premium | Maximum | N/A |

### 5.3 Divergent Thinking Patterns

| Pattern | Description |
|---------|-------------|
| `lateral` | Explore unexpected connections |
| `quantum` | Probabilistic exploration |
| `chaotic` | Random perturbation-based |
| `associative` | Pattern association |
| `evolutionary` | Genetic algorithm-inspired |

### 5.4 Example: Train a Neural Network

```javascript
const result = await flow_nexus.neural_train({
  config: {
    architecture: {
      type: "feedforward",
      layers: [
        { type: "input", size: 10 },
        { type: "hidden", size: 32, activation: "relu" },
        { type: "hidden", size: 16, activation: "relu" },
        { type: "output", size: 3, activation: "softmax" }
      ]
    },
    training: {
      epochs: 100,
      batch_size: 32,
      learning_rate: 0.001,
      optimizer: "adam"
    },
    divergent: {
      enabled: true,
      pattern: "lateral",
      factor: 0.1
    }
  },
  tier: "small"
});
```

### 5.5 Distributed Neural Clusters

For large-scale training, use distributed clusters:

```javascript
// Initialize cluster
const cluster = await flow_nexus.neural_cluster_init({
  name: "training-cluster",
  topology: "mesh",
  architecture: "transformer",
  wasmOptimization: true,
  daaEnabled: true,
  consensus: "proof-of-learning"
});

// Deploy nodes
await flow_nexus.neural_node_deploy({
  cluster_id: cluster.id,
  node_type: "worker",
  model: "large",
  autonomy: 0.8
});

// Start distributed training
await flow_nexus.neural_train_distributed({
  cluster_id: cluster.id,
  dataset: "my-dataset",
  epochs: 50,
  batch_size: 64,
  federated: true
});
```

---

## 6. Gamification Features

### 6.1 rUv Credits System

| Action | Credits |
|--------|---------|
| Registration | 100 (welcome bonus) |
| Challenge completion | 10-100 (varies by difficulty) |
| Template publishing | 50 |
| Referral | 25 |

**Credit Costs:**
- Swarm init: `3 + (maxAgents * 2)` credits
- Neural training: Varies by tier
- Seraphina chat: Varies by model tier

### 6.2 Model Tiers (Seraphina Chat)

| Tier | Model | Credits/Request | Max Tokens |
|------|-------|-----------------|------------|
| `basic` | Claude 3 Haiku | 2 | 1024 |
| `standard` | Claude 3.5 Sonnet | 4 | 2048 |
| `premium` | Claude 3 Opus | 20 | 4096 |
| `advanced` | Claude 3.5 Sonnet Extended | 8 | 4096 |

### 6.3 Challenge Difficulties

| Difficulty | Skill Level | Typical Reward |
|------------|-------------|----------------|
| `beginner` | New users | 10-25 credits |
| `intermediate` | Some experience | 25-50 credits |
| `advanced` | Experienced | 50-75 credits |
| `expert` | Master level | 75-100 credits |

### 6.4 Leaderboard Types

| Type | Scope | Reset Period |
|------|-------|--------------|
| `global` | All-time rankings | Never |
| `weekly` | Weekly competition | Every Monday |
| `monthly` | Monthly competition | First of month |
| `challenge` | Per-challenge rankings | Never |

### 6.5 Example: Gamification Workflow

```javascript
// List available challenges
const challenges = await flow_nexus.challenges_list({
  difficulty: "intermediate",
  status: "active"
});

// Get challenge details
const challenge = await flow_nexus.challenge_get({
  challenge_id: challenges[0].id
});

// Submit solution
const submission = await flow_nexus.challenge_submit({
  challenge_id: challenge.id,
  user_id: "user-123",
  solution_code: "function solve(input) { ... }",
  language: "javascript"
});

// Check balance after completion
const balance = await flow_nexus.ruv_balance({ user_id: "user-123" });

// View leaderboard
const leaderboard = await flow_nexus.leaderboard_get({
  type: "weekly",
  limit: 10
});
```

---

## 7. Cloud Deployment Architecture

### 7.1 Infrastructure Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Flow-Nexus MCP Server                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ Swarm Manager │  │ Neural Engine │  │ Workflow      │        │
│  │   (Agents)    │  │   (Training)  │  │   Manager     │        │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘        │
│          │                  │                  │                 │
│  ┌───────┴──────────────────┴──────────────────┴───────┐        │
│  │                    E2B Sandboxes                      │        │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │        │
│  │  │ Node.js │ │ Python  │ │  React  │ │ Claude  │    │        │
│  │  │ Sandbox │ │ Sandbox │ │ Sandbox │ │  Code   │    │        │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │        │
│  └──────────────────────────────────────────────────────┘        │
│                              │                                    │
├──────────────────────────────┼────────────────────────────────────┤
│                    Supabase Backend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ PostgreSQL  │  │    Auth     │  │  Real-time  │  │ Storage  │ │
│  │  Database   │  │   (JWT)     │  │   (WS)      │  │  (S3)    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
│                              │                                    │
│  ┌───────────────────────────┴───────────────────────────────────┐│
│  │                    Edge Functions                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           ││
│  │  │ mcp-tools-  │  │  create-    │  │  neural-    │           ││
│  │  │    e2b      │  │  payment    │  │  training   │           ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘           ││
│  └───────────────────────────────────────────────────────────────┘│
│                              │                                    │
│  ┌───────────────────────────┴───────────────────────────────────┐│
│  │                    Stripe Payments                             ││
│  │           (PCI DSS SAQ-A Compliant via Vault)                 ││
│  └───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles and settings |
| `user_swarms` | Swarm configurations |
| `sandboxes` | E2B sandbox tracking |
| `neural_training_jobs` | Training job queue |
| `neural_models` | Trained model storage |
| `neural_templates` | Publishable templates |
| `neural_predictions` | Inference logs |
| `validation_workflows` | Model validation |
| `app_store_templates` | App store items |
| `challenges` | Gamification challenges |
| `achievements` | User achievements |
| `ruv_transactions` | Credit transactions |
| `stripe_transactions` | Payment records |
| `audit_logs` | System audit trail |

### 7.3 Authentication Flow

```
1. user_register -> Creates Supabase auth user + profile
2. user_login -> Returns JWT session token
3. Token stored in FLOW_NEXUS_SESSION env var
4. All MCP tools validate session via getSessionContext()
5. RLS policies enforce data isolation
```

### 7.4 Security Features

- **PCI DSS SAQ-A Compliant** - No card data stored locally
- **Stripe Keys in Vault** - API keys stored in Supabase vault
- **Row-Level Security (RLS)** - Database-level access control
- **JWT Sessions** - Secure token-based authentication
- **Edge Functions** - Sensitive operations isolated
- **Rate Limiting** - Daily limits on free tier operations

---

## 8. API Reference

### 8.1 MCP Server Configuration

**Add to Claude MCP config:**

```json
{
  "mcpServers": {
    "flow-nexus": {
      "command": "npx",
      "args": ["flow-nexus@0.1.128", "mcp", "start"],
      "env": {
        "FLOW_NEXUS_MODE": "complete",
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

### 8.2 CLI Commands

```bash
# Start MCP server
npx flow-nexus mcp start

# Start with specific mode
npx flow-nexus mcp start --mode=swarm

# Register new user
npx flow-nexus register

# Login
npx flow-nexus login

# Check status
npx flow-nexus status
```

### 8.3 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `E2B_API_KEY` | E2B sandbox API key | For sandboxes |
| `ANTHROPIC_API_KEY` | Anthropic API key | For Seraphina |
| `FLOW_NEXUS_SESSION` | Persisted user session | For auth |
| `FLOW_NEXUS_MODE` | Operating mode | No (default: complete) |
| `NODE_ENV` | Environment (test/production) | No |

### 8.4 Resource URIs

Flow-Nexus exposes resources via MCP protocol:

| URI | Description |
|-----|-------------|
| `flow://docs` | Documentation resources |
| `flow://templates` | Template configurations |
| `flow://examples` | Example code |
| `flow://configs` | System configurations |

---

## Quick Reference Card

### Essential Tool Categories

| Need | Tool |
|------|------|
| Create agents | `swarm_init` + `agent_spawn` |
| Run code | `sandbox_create` + `sandbox_execute` |
| Train ML | `neural_train` or `neural_cluster_init` |
| Automate | `workflow_create` + `workflow_execute` |
| Gamify | `challenges_list` + `challenge_submit` |
| Chat AI | `seraphina_chat` |
| Auth | `user_register` + `user_login` |
| Payments | `check_balance` + `create_payment_link` |

### Credit Quick Reference

| Operation | Cost Formula |
|-----------|--------------|
| Swarm init | `3 + (agents * 2)` |
| Seraphina (basic) | 2 credits |
| Seraphina (standard) | 4 credits |
| Seraphina (premium) | 20 credits |
| Neural training | Varies by tier |

---

*End of Flow-Nexus v0.1.128 Knowledge Base*
