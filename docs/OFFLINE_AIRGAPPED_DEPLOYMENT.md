# Offline and Air-Gapped Deployment Guide for RuvNet

## Overview

This guide covers deploying RuvNet systems in environments with limited or no internet connectivity. Air-gapped deployments are critical for:

- **High-security environments** (government, defense, financial)
- **Industrial/OT networks** (manufacturing, utilities)
- **Remote locations** (offshore, expeditions, rural)
- **Compliance requirements** (data sovereignty, HIPAA, PCI-DSS)

## Architecture Patterns

### Pattern 1: Fully Air-Gapped (No External Network)

```
┌─────────────────────────────────────────────────────────────┐
│                    AIR-GAPPED NETWORK                        │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Local LLM  │    │   Ruvector   │    │ Claude-Flow  │   │
│  │  (Ollama/    │◄──►│   Postgres   │◄──►│   Memory     │   │
│  │   vLLM)      │    │   (local)    │    │   (SQLite)   │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│          │                   │                   │          │
│          └───────────────────┼───────────────────┘          │
│                              │                              │
│                    ┌─────────▼─────────┐                    │
│                    │   Agent Swarm     │                    │
│                    │   (local exec)    │                    │
│                    └───────────────────┘                    │
│                                                              │
│ ════════════════════ DATA DIODE ═════════════════════════   │
│                    (one-way only)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (updates only, manual transfer)
                    ┌─────────────────┐
                    │  Update Server  │
                    │  (external)     │
                    └─────────────────┘
```

### Pattern 2: Intermittent Connectivity

```javascript
// Sync when connection available
const { SyncManager } = require('claude-flow/offline');

const sync = new SyncManager({
  mode: 'opportunistic',

  // Queue operations when offline
  offlineQueue: {
    storage: 'indexeddb',  // or 'sqlite'
    maxSize: '500MB',
    priority: 'fifo'
  },

  // Sync strategy
  sync: {
    onConnect: true,
    interval: null,  // Manual trigger
    conflictResolution: 'server-wins'
  },

  // Connection detection
  connectivity: {
    checkEndpoint: '/api/health',
    checkInterval: 30000,
    timeout: 5000
  }
});

// Queue operations while offline
await sync.queue({
  type: 'memory-store',
  data: { key: 'findings', value: analysisResults }
});

// When back online
sync.on('connected', async () => {
  const synced = await sync.flush();
  console.log(`Synced ${synced.count} operations`);
});
```

### Pattern 3: Edge Computing with Local AI

```javascript
// Browser-based offline AI
const { OfflineAI } = require('agentic-flow/edge');

const ai = new OfflineAI({
  // Use WASM-optimized models
  models: {
    embedding: 'all-MiniLM-L6-v2-onnx',
    inference: 'phi-2-onnx',  // Small but capable
    quantization: 'q4_k_m'     // 4-bit for memory efficiency
  },

  // Local storage
  storage: {
    vectors: 'indexeddb',
    models: 'cache-api',
    memory: 'localstorage'
  },

  // No external calls
  network: {
    enabled: false,
    fallback: 'local-only'
  }
});

// Works completely offline
const result = await ai.process({
  task: 'Analyze this document',
  document: localDocument
});
```

## Local LLM Setup

### Option 1: Ollama (Recommended for Simplicity)

```bash
# Install Ollama (pre-download on connected machine)
curl -fsSL https://ollama.com/install.sh | sh

# Download models (on connected machine)
ollama pull llama2:13b
ollama pull codellama:7b
ollama pull mistral:7b

# Export models for transfer
ollama export llama2:13b > llama2-13b.tar
ollama export codellama:7b > codellama-7b.tar

# On air-gapped machine
ollama import llama2-13b.tar
ollama import codellama-7b.tar

# Start Ollama server
ollama serve
```

### Option 2: vLLM (Recommended for Production)

```bash
# Create offline package (on connected machine)
pip download vllm torch --dest ./offline-packages/
pip download transformers accelerate --dest ./offline-packages/

# Download model weights
python -c "
from huggingface_hub import snapshot_download
snapshot_download('meta-llama/Llama-2-13b-chat-hf', local_dir='./models/llama2-13b')
"

# Transfer to air-gapped machine, then install
pip install --no-index --find-links ./offline-packages/ vllm torch

# Start vLLM server
python -m vllm.entrypoints.openai.api_server \
  --model ./models/llama2-13b \
  --port 8000 \
  --tensor-parallel-size 2
```

### Option 3: llama.cpp (Recommended for Resource-Constrained)

```bash
# Build from source (on connected machine)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make LLAMA_CUBLAS=1  # With GPU support

# Download and quantize models
./quantize ./models/llama-2-13b.gguf ./models/llama-2-13b-q4_k_m.gguf q4_k_m

# Transfer binary and model to air-gapped machine
# Start server
./server -m ./models/llama-2-13b-q4_k_m.gguf -c 4096 --port 8080
```

## Ruvector Offline Configuration

### PostgreSQL Setup

```bash
# Install PostgreSQL with pgvector extension
# Pre-package all dependencies on connected machine

# Create offline installer package
pg_dump -Fc template1 > postgres-template.dump

# On air-gapped machine
docker load < ruvector-postgres.tar

docker run -d \
  --name ruvector-offline \
  -e POSTGRES_PASSWORD=secure_password \
  -v /data/postgres:/var/lib/postgresql/data \
  -p 5432:5432 \
  ruvnet/ruvector-postgres:latest

# Initialize with pre-built indexes
psql -h localhost -U postgres -f /setup/initialize-offline.sql
```

### Pre-computed Embeddings

```javascript
// Generate embeddings on connected machine, export for air-gapped use
const { Ruvector, EmbeddingService } = require('ruvector');

// On connected machine: generate embeddings
const embedder = new EmbeddingService({
  model: 'all-MiniLM-L6-v2',
  provider: 'huggingface'
});

const documents = await loadDocuments();
const embeddings = [];

for (const doc of documents) {
  const vector = await embedder.embed(doc.text);
  embeddings.push({
    id: doc.id,
    vector,
    metadata: doc.metadata
  });
}

// Export for transfer
fs.writeFileSync('embeddings.json', JSON.stringify(embeddings));

// On air-gapped machine: import pre-computed embeddings
const db = new Ruvector({
  dimensions: 384,
  persistPath: '/data/vectors.db'
});

const imported = JSON.parse(fs.readFileSync('embeddings.json'));
await db.importBatch(imported);
```

### ONNX Local Embeddings

```javascript
// Use ONNX runtime for fully offline embeddings
const { Ruvector } = require('ruvector');

const db = new Ruvector({
  dimensions: 384,

  // Local ONNX embedding (no network required)
  embedding: {
    provider: 'onnx',
    modelPath: './models/all-MiniLM-L6-v2.onnx',

    // SIMD acceleration
    executionProviders: ['wasm'],
    wasmSimd: true
  }
});

// Works completely offline
await db.insertDocument({
  id: 'doc-1',
  text: 'Content to embed locally...'
});
```

## Claude-Flow Offline Mode

### Memory Persistence

```javascript
// Configure for offline operation
const config = {
  memory: {
    // Use local SQLite instead of remote
    storage: 'sqlite',
    path: '/data/claude-flow/memory.db',

    // Disable cloud sync
    sync: {
      enabled: false
    },

    // Local backup
    backup: {
      enabled: true,
      interval: 3600,
      path: '/backup/memory/'
    }
  },

  // Disable telemetry
  telemetry: {
    enabled: false
  },

  // Local model for neural features
  neural: {
    provider: 'local',
    modelPath: './models/neural-patterns.onnx'
  }
};
```

### Agent Coordination Without Cloud

```javascript
// File-based coordination for air-gapped swarms
const { FileCoordinator } = require('claude-flow/offline');

const coordinator = new FileCoordinator({
  // Shared filesystem for coordination
  basePath: '/shared/swarm-coord/',

  // Coordination files
  files: {
    registry: 'agents.json',
    tasks: 'task-queue.json',
    results: 'results.json',
    locks: 'locks/'
  },

  // Polling instead of websockets
  polling: {
    interval: 1000,
    timeout: 30000
  }
});

// Agents discover each other via filesystem
await coordinator.register({
  id: 'agent-1',
  type: 'coder',
  capabilities: ['javascript', 'python']
});

// Task assignment via file queue
await coordinator.submitTask({
  id: 'task-1',
  description: 'Implement feature X',
  assignTo: 'coder'
});
```

## Data Transfer Protocols

### Secure Transfer via Data Diode

```javascript
// One-way data transfer (external -> air-gapped)
const { DataDiode } = require('claude-flow/security');

// On external side
const sender = new DataDiode.Sender({
  protocol: 'serial',  // or 'optical', 'custom'
  port: '/dev/ttyUSB0',
  baudRate: 115200,

  // Error correction
  encoding: {
    type: 'reed-solomon',
    redundancy: 0.2
  },

  // Integrity verification
  integrity: {
    hash: 'sha256',
    signature: true
  }
});

await sender.send({
  type: 'model-update',
  data: modelWeights,
  manifest: {
    version: '2.0.0',
    checksum: 'sha256:...'
  }
});

// On air-gapped side
const receiver = new DataDiode.Receiver({
  protocol: 'serial',
  port: '/dev/ttyUSB0',

  // Verification before acceptance
  verify: {
    signatures: [trustedPublicKey],
    checksums: true
  },

  // Quarantine before deployment
  quarantine: {
    enabled: true,
    scanners: ['clamav'],
    timeout: 3600
  }
});

receiver.on('data', async (transfer) => {
  if (transfer.verified) {
    await deployUpdate(transfer.data);
  }
});
```

### Manual USB Transfer Protocol

```javascript
// Secure USB transfer workflow
const { USBTransfer } = require('claude-flow/offline');

// Step 1: Prepare package on connected machine
const transfer = new USBTransfer.Packager({
  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.TRANSFER_KEY
  }
});

await transfer.package({
  contents: [
    { type: 'model', path: './models/llama2-13b.gguf' },
    { type: 'vectors', path: './data/embeddings.json' },
    { type: 'config', path: './config/offline.json' }
  ],
  output: '/media/usb/transfer-2024-01-15.enc',
  manifest: true
});

// Step 2: On air-gapped machine, verify and import
const importer = new USBTransfer.Importer({
  decryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.TRANSFER_KEY
  },

  // Scan before import
  security: {
    virusScan: true,
    integrityCheck: true,
    signatureVerify: true
  }
});

const result = await importer.import('/media/usb/transfer-2024-01-15.enc');
console.log('Imported:', result.files);
```

## Model Management

### Model Registry for Air-Gapped

```javascript
// Local model registry
const { ModelRegistry } = require('agentic-flow/models');

const registry = new ModelRegistry({
  basePath: '/models',

  // Model inventory
  manifest: {
    'llama2-13b': {
      path: 'llm/llama-2-13b-q4_k_m.gguf',
      type: 'llm',
      quantization: 'q4_k_m',
      size: '7.3GB',
      checksum: 'sha256:...'
    },
    'embedding-v1': {
      path: 'embeddings/all-MiniLM-L6-v2.onnx',
      type: 'embedding',
      dimensions: 384,
      size: '90MB'
    },
    'classifier-v1': {
      path: 'classifiers/document-classifier.onnx',
      type: 'classifier',
      classes: ['technical', 'business', 'legal']
    }
  }
});

// Load model with verification
const model = await registry.load('llama2-13b', {
  verify: true,  // Check checksum
  warmup: true   // Run inference warmup
});
```

### Version Control Without Git Remote

```javascript
// Local version control for models and configs
const { LocalVCS } = require('claude-flow/vcs');

const vcs = new LocalVCS({
  repo: '/data/ruvnet-repo',

  // Git-compatible but local-only
  remote: null,

  // Track specific directories
  track: [
    'models/',
    'configs/',
    'workflows/',
    'memory/'
  ]
});

// Commit changes locally
await vcs.commit({
  message: 'Update model weights v2.1.0',
  files: ['models/llama2-13b.gguf']
});

// Create release packages for transfer
await vcs.package({
  version: 'v2.1.0',
  output: '/exports/release-v2.1.0.tar.gz',
  sign: privateKey
});
```

## Monitoring in Air-Gapped Environments

### Local Metrics Collection

```javascript
// Prometheus-compatible local monitoring
const { LocalMetrics } = require('claude-flow/monitoring');

const metrics = new LocalMetrics({
  storage: '/data/metrics',

  // Rotate logs locally
  retention: {
    raw: '7d',
    aggregated: '90d'
  },

  // Export for external analysis
  export: {
    format: 'prometheus',
    path: '/exports/metrics/',
    interval: 3600
  }
});

// Track system health
metrics.gauge('model_inference_latency_ms', 150);
metrics.counter('queries_processed_total', 1);
metrics.histogram('memory_usage_bytes', process.memoryUsage().heapUsed);

// Generate reports locally
const report = await metrics.report({
  timeRange: '24h',
  format: 'html'
});
fs.writeFileSync('/reports/daily-metrics.html', report);
```

### Alerting Without External Services

```javascript
// Local alerting system
const { LocalAlerting } = require('claude-flow/alerting');

const alerting = new LocalAlerting({
  // Local notification methods
  channels: {
    console: { enabled: true },
    file: { path: '/logs/alerts.log' },
    email: null,  // Disabled in air-gapped

    // Local display/dashboard
    display: {
      enabled: true,
      port: 3001
    }
  },

  // Alert rules
  rules: [
    {
      name: 'high-latency',
      condition: 'model_inference_latency_ms > 5000',
      severity: 'warning'
    },
    {
      name: 'disk-space',
      condition: 'disk_usage_percent > 90',
      severity: 'critical'
    }
  ]
});
```

## Deployment Checklist

### Pre-Deployment (Connected Environment)

```markdown
□ Download all required models
  □ LLM models (Llama, Mistral, CodeLlama)
  □ Embedding models (all-MiniLM-L6-v2)
  □ Specialized models (classifiers, etc.)

□ Package all dependencies
  □ npm packages (node_modules.tar.gz)
  □ Python packages (pip download)
  □ System packages (dpkg, rpm)

□ Generate pre-computed data
  □ Embeddings for knowledge base
  □ Model quantization
  □ Index pre-building

□ Create transfer packages
  □ Encrypt with approved keys
  □ Generate manifests
  □ Sign packages

□ Prepare configuration
  □ Disable all external endpoints
  □ Configure local storage paths
  □ Set up local authentication
```

### Post-Deployment (Air-Gapped Environment)

```markdown
□ Verify transfer integrity
  □ Check all checksums
  □ Verify signatures
  □ Run security scans

□ Install and configure
  □ Extract packages
  □ Configure services
  □ Start local servers

□ Validate operation
  □ Test LLM inference
  □ Test vector search
  □ Test agent coordination

□ Set up monitoring
  □ Configure local metrics
  □ Set up alerting
  □ Create backup schedule
```

## Security Considerations

### Key Management

```javascript
// Air-gapped key management
const { KeyVault } = require('claude-flow/security');

const vault = new KeyVault({
  // Local HSM or encrypted file
  storage: {
    type: 'file',  // or 'hsm'
    path: '/secure/keys.enc',
    encryption: 'aes-256-gcm'
  },

  // Key rotation (manual process)
  rotation: {
    automatic: false,
    notify: true
  }
});

// Generate keys locally
const transferKey = await vault.generate({
  type: 'symmetric',
  algorithm: 'aes-256-gcm',
  purpose: 'data-transfer'
});
```

### Audit Logging

```javascript
// Comprehensive audit trail
const { AuditLog } = require('claude-flow/security');

const audit = new AuditLog({
  storage: '/audit/logs',

  // Tamper-evident logging
  integrity: {
    chaining: true,  // Hash chain
    signing: true,   // Sign entries
    timestamps: 'local'  // No NTP
  },

  // Retention
  retention: {
    period: '7y',  // Compliance requirement
    compression: true
  }
});

// Log all significant events
audit.log({
  event: 'model-inference',
  user: 'system',
  details: { model: 'llama2-13b', latency: 150 },
  timestamp: Date.now()
});
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Model won't load | Missing dependencies | Verify all ONNX/CUDA libs installed |
| Slow inference | CPU-only mode | Check GPU drivers, enable CUDA |
| Memory exhausted | Model too large | Use quantized model (q4_k_m) |
| Embedding mismatch | Wrong model version | Verify model checksum matches |
| Coordination fails | File permissions | Check shared filesystem permissions |

### Diagnostic Commands

```bash
# Check system resources
nvidia-smi  # GPU status
free -h     # Memory
df -h       # Disk space

# Test local LLM
curl http://localhost:8080/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "max_tokens": 10}'

# Test vector database
psql -h localhost -U postgres -c "SELECT count(*) FROM vectors;"

# Check agent coordination
ls -la /shared/swarm-coord/
cat /shared/swarm-coord/agents.json
```

## Performance Optimization

### Resource Allocation

```javascript
// Optimize for limited resources
const config = {
  llm: {
    // Limit concurrent requests
    maxConcurrent: 2,

    // Batch processing
    batching: {
      enabled: true,
      maxBatchSize: 4,
      maxWaitMs: 100
    },

    // Memory limits
    memory: {
      maxModelMemory: '8GB',
      kvCacheSize: '2GB'
    }
  },

  vectors: {
    // Optimize for read-heavy workload
    caching: {
      enabled: true,
      maxSize: '1GB'
    },

    // Limit search parallelism
    searchThreads: 4
  }
};
```

This guide ensures RuvNet can be deployed in the most restrictive environments while maintaining full functionality for AI-powered workflows.
