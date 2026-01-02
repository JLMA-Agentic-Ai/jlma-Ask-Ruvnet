Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:35:48 EST

# SafeTensors Serialization in RuVector & AgentDB

## Overview

SafeTensors is a secure, fast serialization format for neural network weights and vector data. In the RuVector ecosystem, SafeTensors provides safe, efficient storage for agent models, embeddings, and learned weights with guaranteed security - only numerical tensor data is loaded, preventing code execution vulnerabilities.

## Key Benefits

1. **Security**: Cannot execute arbitrary code during deserialization
2. **Speed**: 25x faster loading than legacy formats
3. **Memory Efficiency**: Supports memory mapping for large models
4. **Cross-Platform**: Works across Python, JavaScript, Rust, and more

## Implementation in RuVector

### Saving Models

```javascript
const { RuVector } = require('ruvector');
const { safetensors } = require('ruvector/safetensors');

const store = new RuVector({ dimensions: 128 });

// Add vectors and metadata
await store.addVectors([...vectors]);

// Save with SafeTensors format
await safetensors.save(store, 'knowledge-base.safetensors', {
  metadata: {
    version: '1.0.0',
    created: Date.now(),
    dimensions: 128,
    vectorCount: store.size
  }
});
```

### Loading Models

```javascript
// Secure loading - only tensor data is processed
const store = await safetensors.load('knowledge-base.safetensors', {
  validateChecksum: true,
  framework: 'node'
});

console.log(store.metadata);
// { version: '1.0.0', created: ..., dimensions: 128, vectorCount: 1000 }
```

## File Format

### Structure

```
SafeTensors File:
┌──────────────────────────────────────────┐
│ Header (8 bytes)                         │
│ - Header size (u64 little-endian)        │
├──────────────────────────────────────────┤
│ JSON Metadata (variable)                 │
│ {                                        │
│   "__metadata__": {...},                 │
│   "tensor_name": {                       │
│     "dtype": "F32",                      │
│     "shape": [1000, 128],                │
│     "data_offsets": [0, 512000]          │
│   }                                      │
│ }                                        │
├──────────────────────────────────────────┤
│ Tensor Data (binary)                     │
│ [raw bytes, aligned]                     │
└──────────────────────────────────────────┘
```

### Supported Data Types

| Type | Description | Size | Use Case |
|------|-------------|------|----------|
| F32 | 32-bit float | 4 bytes | Standard vectors |
| F16 | 16-bit float | 2 bytes | Quantized vectors |
| BF16 | Brain float16 | 2 bytes | ML training |
| I8 | 8-bit int | 1 byte | Heavy quantization |
| I32 | 32-bit int | 4 bytes | Indices |
| U8 | Unsigned 8-bit | 1 byte | Metadata |

## AgentDB Integration

### Saving Agent State

```javascript
const { AgentDB } = require('agentdb');

const agent = new AgentDB({
  serialization: 'safetensors'  // Default format
});

// Train agent
await agent.train(...);

// Save complete agent state
await agent.save('agent_checkpoint.safetensors', {
  includeOptimizer: true,
  includeMemory: true,
  includeEWC: true,  // Include Fisher information
  compression: 'zstd'
});
```

### Checkpoint Contents

```javascript
// What gets saved in an agent checkpoint
{
  // Model weights
  "policy_network.layer1.weight": { dtype: "F32", shape: [256, 128] },
  "policy_network.layer1.bias": { dtype: "F32", shape: [256] },
  "value_network.layer1.weight": { dtype: "F32", shape: [256, 128] },

  // Memory embeddings
  "episodic_memory.embeddings": { dtype: "F16", shape: [10000, 128] },
  "semantic_memory.embeddings": { dtype: "F16", shape: [5000, 128] },

  // EWC Fisher information
  "ewc.fisher_diagonal": { dtype: "F32", shape: [50000] },
  "ewc.optimal_params": { dtype: "F32", shape: [50000] },

  // Metadata
  "__metadata__": {
    "agent_version": "2.0.0",
    "training_steps": "1000000",
    "performance": "0.95"
  }
}
```

### Loading Agent State

```javascript
// Load with validation
const agent = await AgentDB.load('agent_checkpoint.safetensors', {
  validateArchitecture: true,
  device: 'cpu',
  strict: false  // Allow missing keys
});

// Partial loading for transfer learning
const agent = await AgentDB.load('agent_checkpoint.safetensors', {
  loadOnly: ['policy_network', 'semantic_memory'],
  skipLayers: ['value_network']
});
```

## Streaming and Memory Mapping

### Memory-Mapped Loading

```javascript
// Load large files without full memory allocation
const store = await safetensors.mmap('large_model.safetensors', {
  lazyLoad: true,
  pageSize: 4096
});

// Only loads tensor data when accessed
const weights = await store.getTensor('layer1.weight');
```

### Streaming for Large Models

```javascript
// Stream tensors for models that don't fit in memory
const stream = safetensors.createReadStream('huge_model.safetensors');

for await (const { name, tensor } of stream) {
  await processLayer(name, tensor);
  // Tensor is garbage collected after use
}
```

## Security Features

### Checksum Validation

```javascript
// Validate file integrity
const isValid = await safetensors.validate('model.safetensors', {
  checksum: 'sha256',
  expectedHash: 'abc123...'
});
```

### Schema Validation

```javascript
// Ensure model matches expected architecture
const schema = {
  tensors: {
    'layer1.weight': { dtype: 'F32', shape: [256, 128] },
    'layer1.bias': { dtype: 'F32', shape: [256] }
  }
};

await safetensors.load('model.safetensors', {
  schema,
  strict: true  // Fail if schema doesn't match
});
```

## Performance Benchmarks

### Load Time Comparison

| Format | 100MB Model | 1GB Model | 10GB Model |
|--------|-------------|-----------|------------|
| Legacy | 2.5s | 25s | 250s |
| SafeTensors | 0.1s | 1s | 10s |
| SafeTensors (mmap) | 0.01s | 0.01s | 0.01s |

### File Size Comparison

| Format | Base | With ZSTD Compression |
|--------|------|----------------------|
| Legacy | 100% | 45% |
| SafeTensors | 100% | 38% |

## Best Practices

1. **Always use SafeTensors for model storage**
2. **Enable checksum validation in production**
3. **Use memory mapping for large models**
4. **Include version metadata for compatibility**
5. **Compress for cold storage, uncompressed for hot**
6. **Use F16 quantization to halve storage size**

## Related Features

- **Tiered Compression**: SafeTensors storage across tiers
- **EWC Consolidation**: Secure Fisher matrix storage
- **QUIC Sync**: Fast model transfer between nodes
- **Federated Learning**: Secure weight aggregation
