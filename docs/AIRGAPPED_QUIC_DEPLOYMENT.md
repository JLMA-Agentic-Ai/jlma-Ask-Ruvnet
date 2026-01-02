Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:23:35 EST

# Air-Gapped Deployment & QUIC Synchronization

## Complete Deployment Reference

**Version:** 2.0.0
**Last Updated:** December 2025

---

## Table of Contents

1. [Air-Gapped Deployment Overview](#air-gapped-deployment-overview)
2. [QUIC Protocol for Synchronization](#quic-protocol-for-synchronization)
3. [Offline-First Architecture](#offline-first-architecture)
4. [Model Bundling Strategies](#model-bundling-strategies)
5. [Implementation Patterns](#implementation-patterns)
6. [Configuration Reference](#configuration-reference)

---

## Air-Gapped Deployment Overview

### What is Air-Gapped Deployment?

Air-gapped deployment runs the complete RuVector + RuvLLM + Agentic-Flow stack without any external network connectivity. This is critical for:

- **Security-sensitive environments** (government, defense, healthcare)
- **Edge deployments** (factories, remote sites)
- **Offline applications** (field research, disaster response)

### Air-Gapped Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               AIR-GAPPED DEPLOYMENT                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  APPLICATION                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │ Agentic-Flow│  │   RuvLLM    │  │  RuVector   │   │  │
│  │  │   Agents    │  │ Orchestrate │  │  Vectors    │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │  │
│  │         │                │                │          │  │
│  │         └────────────────┼────────────────┘          │  │
│  │                          ▼                           │  │
│  │              ┌─────────────────────┐                │  │
│  │              │   Ollama (Local)    │                │  │
│  │              │  ┌───────┐ ┌─────┐  │                │  │
│  │              │  │ LLM   │ │Embed│  │                │  │
│  │              │  └───────┘ └─────┘  │                │  │
│  │              └─────────────────────┘                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  PERSISTENCE                          │  │
│  │  .ruvector/     .swarm/         models/              │  │
│  │  knowledge-base memory.db       qwen3:8b             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ══════════════════ NO NETWORK ═══════════════════════════  │
└─────────────────────────────────────────────────────────────┘
```

### Air-Gapped Components

| Component | Purpose | Size | Pre-bundled |
|-----------|---------|------|-------------|
| **Ollama** | Local LLM runtime | ~100MB | Yes |
| **qwen3:8b** | Language model | ~5GB | Yes |
| **nomic-embed-text** | Embeddings | ~300MB | Yes |
| **RuVector** | Vector database | ~5MB | Yes |
| **RuvLLM** | Orchestration | ~2MB | Yes |
| **Agentic-Flow** | Agents | ~10MB | Yes |
| **Knowledge Base** | Pre-built vectors | Variable | Yes |

### Air-Gapped Setup Script

```bash
#!/bin/bash
# setup-airgapped.sh - Run on connected machine first

# 1. Bundle Ollama and models
mkdir -p airgap-bundle/models
curl -fsSL https://ollama.ai/install.sh > airgap-bundle/install-ollama.sh
ollama pull qwen3:8b
ollama pull nomic-embed-text:latest
cp -r ~/.ollama/models/* airgap-bundle/models/

# 2. Bundle npm packages (offline install)
npm pack ruvector @ruvector/ruvllm agentic-flow claude-flow
mv *.tgz airgap-bundle/packages/

# 3. Bundle knowledge base
cp -r .ruvector/knowledge-base airgap-bundle/

# 4. Create install script for air-gapped machine
cat > airgap-bundle/install.sh << 'EOF'
#!/bin/bash
# Install Ollama
bash install-ollama.sh

# Load models
cp -r models/* ~/.ollama/models/

# Install npm packages offline
npm install --offline packages/*.tgz

# Copy knowledge base
mkdir -p .ruvector
cp -r knowledge-base .ruvector/

echo "Air-gapped installation complete!"
EOF

# 5. Create tarball
tar -czvf airgap-bundle.tar.gz airgap-bundle/
echo "Bundle ready: airgap-bundle.tar.gz"
```

---

## QUIC Protocol for Synchronization

### What is QUIC?

QUIC (Quick UDP Internet Connections) is a modern transport protocol that provides:

- **Multiplexed streams** (no head-of-line blocking)
- **0-RTT connection establishment**
- **Built-in encryption** (TLS 1.3)
- **Connection migration** (survives IP changes)

### QUIC vs TCP for Vector Sync

| Feature | TCP | QUIC | Benefit |
|---------|-----|------|---------|
| Connection setup | 3 RTT | 0-1 RTT | 66% faster |
| Head-of-line blocking | Yes | No | Better parallelism |
| Connection migration | No | Yes | Mobile resilience |
| Encryption | Optional | Mandatory | Secure by default |
| Stream multiplexing | Multiple connections | Single connection | Lower overhead |

### QUIC Synchronization Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│   PRIMARY NODE  │                    │  REPLICA NODE   │
│                 │      QUIC          │                 │
│  ┌───────────┐  │    Connection      │  ┌───────────┐  │
│  │ RuVector  │◄─┼───────────────────►│  │ RuVector  │  │
│  │ (Source)  │  │                    │  │ (Replica) │  │
│  └───────────┘  │  Stream 0: Vectors │  └───────────┘  │
│                 │  Stream 1: Metadata│                 │
│  ┌───────────┐  │  Stream 2: WAL     │  ┌───────────┐  │
│  │ Memory.db │◄─┼───────────────────►│  │ Memory.db │  │
│  └───────────┘  │  Stream 3: Memory  │  └───────────┘  │
└─────────────────┘                    └─────────────────┘
```

### QUIC Sync Implementation

```javascript
const QUICSync = require('@ruvector/quic-sync');

// Initialize QUIC sync
const sync = new QUICSync({
  mode: 'primary',  // or 'replica'
  port: 4433,
  cert: './certs/server.crt',
  key: './certs/server.key',

  // Sync configuration
  syncInterval: 5000,      // Sync every 5 seconds
  batchSize: 1000,         // Vectors per batch
  compressionLevel: 6,     // zstd compression

  // Streams
  streams: {
    vectors: { priority: 'high', reliable: true },
    metadata: { priority: 'high', reliable: true },
    wal: { priority: 'critical', reliable: true },
    memory: { priority: 'medium', reliable: true }
  }
});

// Start sync on primary
await sync.startPrimary({
  ruvectorPath: '.ruvector/knowledge-base',
  memoryPath: '.swarm/memory.db'
});

// Start sync on replica
await sync.startReplica({
  primaryHost: 'primary.local',
  primaryPort: 4433,
  ruvectorPath: '.ruvector/knowledge-base',
  memoryPath: '.swarm/memory.db'
});

// Monitor sync status
sync.on('sync', (status) => {
  console.log(`Synced: ${status.vectorsSynced} vectors, ${status.latency}ms`);
});
```

### QUIC Sync Features

#### 0-RTT Reconnection

```javascript
// Enable 0-RTT for fast reconnection
const sync = new QUICSync({
  zeroRTT: {
    enabled: true,
    ticketLifetime: 86400,  // 24 hours
    maxEarlyData: 16384     // Bytes
  }
});
```

#### Connection Migration

```javascript
// Handle network changes (mobile, failover)
sync.on('migration', (event) => {
  console.log(`Migrated from ${event.oldAddr} to ${event.newAddr}`);
});
```

#### Delta Sync

```javascript
// Only sync changes since last checkpoint
const delta = await sync.getDelta({
  sinceCheckpoint: 'cp-12345',
  includeDeletes: true
});
```

---

## Offline-First Architecture

### Design Principles

1. **Local-first**: All operations work locally first
2. **Sync when possible**: Opportunistic synchronization
3. **Conflict resolution**: Automatic merge strategies
4. **Eventual consistency**: Converges to same state

### Offline-First Implementation

```javascript
class OfflineFirstStore {
  private local: RuvectorStore;
  private sync: QUICSync;
  private pendingChanges: Change[] = [];

  async insert(data: VectorData): Promise<void> {
    // Always write locally first
    await this.local.insert(data);

    // Queue for sync
    this.pendingChanges.push({
      type: 'insert',
      data,
      timestamp: Date.now()
    });

    // Try to sync if online
    await this.trySyncPending();
  }

  async trySyncPending(): Promise<void> {
    if (!this.sync.isConnected()) return;

    const batch = this.pendingChanges.splice(0, 100);
    try {
      await this.sync.pushChanges(batch);
    } catch (error) {
      // Re-queue on failure
      this.pendingChanges.unshift(...batch);
    }
  }

  // Conflict resolution
  async handleConflict(local: Change, remote: Change): Promise<Change> {
    // Last-write-wins by default
    if (local.timestamp > remote.timestamp) {
      return local;
    }
    return remote;
  }
}
```

---

## Model Bundling Strategies

### Strategy 1: Full Bundle

Include all models in deployment package:

```bash
# Full bundle structure
airgap-bundle/
├── ollama/
│   └── install.sh
├── models/
│   ├── qwen3-8b/
│   │   ├── config.json
│   │   ├── model.safetensors
│   │   └── tokenizer.json
│   └── nomic-embed-text/
│       ├── config.json
│       └── model.safetensors
├── packages/
│   ├── ruvector-0.1.35.tgz
│   ├── ruvllm-0.2.3.tgz
│   └── agentic-flow-2.0.1-alpha.5.tgz
└── knowledge-base/
    ├── vectors.bin
    └── metadata.json
```

### Strategy 2: Modular Bundle

Separate core and optional components:

```bash
# Modular bundle structure
core-bundle/           # Required (~500MB)
├── ollama/
├── models/
│   └── nomic-embed-text/
└── packages/

llm-bundle/            # Optional (~5GB)
└── models/
    └── qwen3-8b/

knowledge-bundle/      # Optional (variable)
└── knowledge-base/
```

### Strategy 3: Quantized Models

Use quantized models for smaller deployments:

```javascript
const modelConfig = {
  llm: {
    model: 'qwen3:8b-q4_K_M',  // 4-bit quantization
    size: '2.5GB',            // vs 5GB full precision
    quality: 0.95             // 95% of full quality
  },
  embedding: {
    model: 'nomic-embed-text:q8_0',
    size: '150MB',
    quality: 0.99
  }
};
```

---

## Implementation Patterns

### Pattern 1: Docker Air-Gapped Deployment

```yaml
# docker-compose.airgapped.yml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ./models:/root/.ollama/models
      - ollama-data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  app:
    build:
      context: .
      dockerfile: Dockerfile.airgapped
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - RUVECTOR_PERSISTENCE=true
      - RUVECTOR_KB_PATH=/data/knowledge-base
    volumes:
      - ./data:/data
    depends_on:
      - ollama

volumes:
  ollama-data:
```

### Pattern 2: Kubernetes Air-Gapped

```yaml
# k8s-airgapped.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: airgapped-config
data:
  OLLAMA_BASE_URL: "http://ollama-service:11434"
  RUVECTOR_PERSISTENCE: "true"
  NETWORK_MODE: "offline"
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ruvector-app
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: ollama
          image: internal-registry/ollama:latest
          volumeMounts:
            - name: models
              mountPath: /root/.ollama/models
        - name: app
          image: internal-registry/ruvector-app:latest
          envFrom:
            - configMapRef:
                name: airgapped-config
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: models
          persistentVolumeClaim:
            claimName: models-pvc
        - name: data
          persistentVolumeClaim:
            claimName: data-pvc
```

### Pattern 3: Hybrid (Air-Gap + Periodic Sync)

```javascript
class HybridDeployment {
  private local: RuvectorStore;
  private syncSchedule: 'daily' | 'weekly' | 'manual';

  async performPeriodicSync(usbPath: string): Promise<SyncResult> {
    // Export changes since last sync
    const changes = await this.local.getChangesSince(this.lastSyncTime);

    // Write to USB drive
    await this.writeToUSB(usbPath, changes);

    // Import updates from USB
    const updates = await this.readFromUSB(usbPath);
    await this.local.applyChanges(updates);

    this.lastSyncTime = Date.now();
    return { exported: changes.length, imported: updates.length };
  }
}
```

---

## Configuration Reference

### Air-Gapped Configuration

```javascript
module.exports = {
  deployment: {
    mode: 'airgapped',

    // Ollama (local)
    ollama: {
      baseUrl: 'http://localhost:11434',
      models: {
        llm: 'qwen3:8b',
        embedding: 'nomic-embed-text:latest'
      }
    },

    // Persistence
    persistence: {
      ruvector: {
        path: '.ruvector/knowledge-base',
        wal: true
      },
      memory: {
        path: '.swarm/memory.db'
      }
    },

    // Network (disabled)
    network: {
      enabled: false,
      allowLocal: true
    }
  }
};
```

### QUIC Sync Configuration

```javascript
module.exports = {
  quicSync: {
    enabled: true,
    mode: 'primary',  // or 'replica'

    // Connection
    connection: {
      port: 4433,
      cert: './certs/server.crt',
      key: './certs/server.key'
    },

    // Sync settings
    sync: {
      interval: 5000,
      batchSize: 1000,
      compression: 'zstd',
      compressionLevel: 6
    },

    // 0-RTT
    zeroRTT: {
      enabled: true,
      ticketLifetime: 86400
    },

    // Streams
    streams: {
      vectors: { priority: 'high' },
      metadata: { priority: 'high' },
      wal: { priority: 'critical' },
      memory: { priority: 'medium' }
    }
  }
};
```

### Environment Variables

```bash
# Deployment Mode
DEPLOYMENT_MODE=airgapped
NETWORK_ENABLED=false

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text:latest

# Persistence
RUVECTOR_PERSISTENCE=true
RUVECTOR_KB_PATH=.ruvector/knowledge-base
RUVECTOR_WAL_ENABLED=true

# QUIC Sync (when connected)
QUIC_SYNC_ENABLED=true
QUIC_SYNC_MODE=primary
QUIC_SYNC_PORT=4433
QUIC_SYNC_INTERVAL=5000
```

---

*Document generated for RuVector Knowledge Base - December 2025*
