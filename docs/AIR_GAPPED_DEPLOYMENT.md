Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:39:52 EST

# Air-Gapped Deployment for RuVector & AgentDB

## Overview

Air-gapped deployment enables RuVector and AgentDB to operate in completely isolated environments without internet connectivity. This is essential for high-security environments, classified systems, and edge deployments where network isolation is mandatory.

## Architecture

### Air-Gapped Stack

```
┌────────────────────────────────────────────────────────────┐
│                    AIR-GAPPED ENVIRONMENT                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   RuVector Stack                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  RuVector   │  │   AgentDB   │  │   Ollama    │  │  │
│  │  │   (Vector)  │  │   (Agent)   │  │   (LLM)     │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │         ↑               ↑               ↑           │  │
│  │         └───────────────┴───────────────┘           │  │
│  │                         │                            │  │
│  │              Local Storage Layer                     │  │
│  │              (SafeTensors, SQLite)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ════════════════════ AIR GAP ══════════════════════════  │
│                                                            │
└────────────────────────────────────────────────────────────┘
            ↓ One-way data diode (if needed)
┌────────────────────────────────────────────────────────────┐
│                    EXTERNAL NETWORK                         │
└────────────────────────────────────────────────────────────┘
```

## Installation

### Offline Package Bundle

```bash
# On connected machine: Create offline bundle
npx ruvector bundle create \
  --packages ruvector agentdb @ruvector/ruvllm \
  --models llama2-7b mistral-7b \
  --output airgap-bundle.tar.gz

# Transfer bundle via secure media (USB, DVD)
# On air-gapped machine: Install from bundle
tar -xzf airgap-bundle.tar.gz
cd airgap-bundle
./install.sh
```

### Docker-Based Air-Gap

```yaml
# docker-compose.airgap.yml
version: '3.8'
services:
  ruvector:
    image: ruvector/ruvector:latest
    volumes:
      - ./data:/data
      - ./models:/models
    environment:
      - OFFLINE_MODE=true
      - MODEL_PATH=/models
    network_mode: none  # Complete network isolation

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ./ollama-models:/root/.ollama
    network_mode: none

  agentdb:
    image: ruvector/agentdb:latest
    depends_on:
      - ruvector
      - ollama
    environment:
      - RUVECTOR_URL=http://ruvector:8080
      - OLLAMA_URL=http://ollama:11434
      - OFFLINE_MODE=true
    network_mode: none
```

## Ollama Integration

### Pre-Loading Models

```bash
# Download models on connected machine
ollama pull llama2:7b
ollama pull mistral:7b
ollama pull codellama:13b

# Export for air-gapped transfer
ollama export llama2:7b > llama2-7b.tar
ollama export mistral:7b > mistral-7b.tar

# On air-gapped machine: Import models
ollama import llama2-7b.tar
ollama import mistral-7b.tar
```

### Configuring AgentDB for Ollama

```javascript
const { AgentDB } = require('agentdb');
const { RuVLLM } = require('@ruvector/ruvllm');

const llm = new RuVLLM({
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama2:7b',
  offline: true  // No external API calls
});

const agent = new AgentDB({
  llm,
  offline: true,
  storage: {
    path: '/data/agentdb',
    format: 'safetensors'
  }
});
```

## Data Transfer Protocols

### One-Way Data Diode

```javascript
// Export data for one-way transfer out
const exporter = new RuVector.AirGapExporter({
  format: 'encrypted',
  encryption: {
    algorithm: 'aes-256-gcm',
    keyFile: '/secure/export-key.pem'
  }
});

// Export knowledge base
await exporter.export(store, '/media/usb/export.enc', {
  includeVectors: true,
  includeMetadata: true,
  merkleProof: true  // Verify integrity
});
```

### Secure Import

```javascript
// Import on air-gapped system
const importer = new RuVector.AirGapImporter({
  verifySignature: true,
  signatureKey: '/secure/import-key.pub',
  scanMalware: true  // If scanner available
});

await importer.import('/media/usb/export.enc', store, {
  validateMerkle: true,
  quarantineOnFailure: true
});
```

## Federated Learning in Air-Gap

### Sneakernet Federation

```javascript
// Node A (air-gapped): Compute local update
const localUpdate = await agent.computeFederatedUpdate({
  rounds: 100,
  differentialPrivacy: { epsilon: 1.0 }
});

// Export update
await agent.exportUpdate(localUpdate, '/media/usb/update_nodeA.enc');

// Transfer via secure courier

// Coordinator: Aggregate updates
const aggregator = new FederatedAggregator();
const updates = await aggregator.loadUpdates([
  '/media/usb/update_nodeA.enc',
  '/media/usb/update_nodeB.enc'
]);

const globalModel = await aggregator.aggregate(updates, {
  method: 'fedAvg',
  secureAggregation: true
});

// Export global model for distribution
await aggregator.exportModel(globalModel, '/media/usb/global_model.enc');
```

## Persistence and Backup

### Local Redundancy

```javascript
const store = new RuVector({
  storage: {
    primary: '/data/ruvector',
    mirrors: [
      '/backup1/ruvector',
      '/backup2/ruvector'
    ],
    sync: 'immediate'  // Sync to mirrors immediately
  }
});
```

### Cold Storage Backup

```javascript
// Schedule regular backups
const backup = new RuVector.BackupManager({
  schedule: '0 2 * * *',  // Daily at 2 AM
  destination: '/backup/cold',
  retention: 30,  // Keep 30 days
  format: 'safetensors',
  compression: 'zstd',
  encryption: true
});

// Manual backup with verification
await backup.createBackup({
  verify: true,
  merkleProof: true
});
```

## Security Hardening

### System Configuration

```javascript
const store = new RuVector({
  security: {
    encryption: {
      atRest: true,
      algorithm: 'aes-256-gcm'
    },
    accessControl: {
      enabled: true,
      rbac: true
    },
    audit: {
      enabled: true,
      logPath: '/var/log/ruvector/audit.log',
      tamperProof: true
    }
  }
});
```

### Memory Protection

```javascript
// Secure memory handling
const agent = new AgentDB({
  memory: {
    secure: true,
    zeroOnFree: true,  // Zero memory on deallocation
    mlock: true,       // Prevent swapping to disk
    canary: true       // Buffer overflow detection
  }
});
```

## Monitoring Without Network

### Local Metrics Collection

```javascript
const monitor = new RuVector.Monitor({
  storage: '/var/lib/ruvector/metrics',
  retention: '30d',
  exportFormat: 'csv'  // For manual analysis
});

// Export metrics for external analysis
await monitor.exportMetrics('/media/usb/metrics_export.csv', {
  from: '2024-12-01',
  to: '2024-12-29'
});
```

### Health Checks

```javascript
// Automated health verification
const health = await store.healthCheck({
  vectors: true,
  index: true,
  storage: true,
  memory: true
});

// Log to local syslog
if (!health.healthy) {
  syslog.error('RuVector health check failed', health.issues);
}
```

## Update Procedures

### Secure Software Updates

```bash
# On connected machine: Download and verify update
npm pack ruvector@latest --verify-signature
gpg --verify ruvector-*.tgz.sig

# Transfer via secure media
# On air-gapped machine: Verify and install
gpg --verify ruvector-*.tgz.sig
npm install ./ruvector-*.tgz
```

### Model Updates

```bash
# Export new model from connected system
ollama export new-model:latest > new-model.tar
sha256sum new-model.tar > new-model.tar.sha256

# Verify on air-gapped system
sha256sum -c new-model.tar.sha256
ollama import new-model.tar
```

## Best Practices

1. **Use SafeTensors format** - secure serialization without code execution risks
2. **Enable Merkle proofs** for all data transfers
3. **Encrypt all exports** with strong keys
4. **Maintain offline model cache** for all required LLMs
5. **Regular verified backups** with integrity checks
6. **Document all data transfers** for audit trail
7. **Use write-once media** for one-way exports when possible

## Compliance Considerations

- **NIST 800-53**: Meets SC-7 (Boundary Protection) requirements
- **ICD 503**: Compatible with classified system requirements
- **GDPR**: Data isolation supports privacy requirements
- **HIPAA**: Suitable for protected health information

## Related Features

- **Ollama Integration**: Local LLM inference
- **SafeTensors**: Secure model storage
- **Merkle Proofs**: Data integrity verification
- **Federated Learning**: Privacy-preserving collaboration
