Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:32:44 EST

# Tiered Compression Storage in RuVector & AgentDB

## Overview

Tiered compression storage is a critical feature of the RuVector and AgentDB ecosystem that enables efficient memory management through intelligent data lifecycle management using hot, warm, and cold storage tiers.

## Architecture

### Three-Tier Storage Model

```
┌─────────────────────────────────────────────────────────────┐
│                    HOT TIER (Active)                        │
│  • Recent data (< 1 hour old)                               │
│  • No compression                                           │
│  • Fastest access (< 1ms latency)                          │
│  • Stored in RAM/SSD                                        │
│  • HNSW index fully loaded                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓ Age-based migration
┌─────────────────────────────────────────────────────────────┐
│                   WARM TIER (Recent)                        │
│  • Data 1-24 hours old                                      │
│  • LZ4 compression (4:1 ratio)                              │
│  • Medium access (< 10ms latency)                          │
│  • Stored on SSD                                            │
│  • Partial HNSW index                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓ Age-based migration
┌─────────────────────────────────────────────────────────────┐
│                   COLD TIER (Archive)                       │
│  • Data > 24 hours old                                      │
│  • ZSTD compression (10:1 ratio)                            │
│  • Slower access (< 100ms latency)                         │
│  • Stored on HDD/Object Storage                            │
│  • Minimal index, reconstructed on demand                  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation in RuVector

### Configuration

```javascript
const { RuVector } = require('ruvector');

const store = new RuVector({
  tieredStorage: {
    enabled: true,
    hotTier: {
      maxAge: 3600000,        // 1 hour in ms
      maxSize: '1GB',
      compression: 'none'
    },
    warmTier: {
      maxAge: 86400000,       // 24 hours in ms
      maxSize: '10GB',
      compression: 'lz4',
      compressionLevel: 4
    },
    coldTier: {
      maxAge: Infinity,
      maxSize: '100GB',
      compression: 'zstd',
      compressionLevel: 19
    }
  }
});
```

### Compression Algorithms

| Algorithm | Ratio | Speed | Use Case |
|-----------|-------|-------|----------|
| None | 1:1 | Fastest | Hot tier, real-time access |
| LZ4 | 4:1 | Very Fast | Warm tier, balanced |
| ZSTD | 10:1 | Medium | Cold tier, archival |
| Brotli | 12:1 | Slow | Deep archive |

### Automatic Migration

```javascript
// Background migration runs automatically
store.on('migration', (event) => {
  console.log(`Migrated ${event.count} vectors from ${event.from} to ${event.to}`);
  console.log(`Space saved: ${event.spaceSaved} bytes`);
});

// Manual migration trigger
await store.migrateTier({
  from: 'hot',
  to: 'warm',
  olderThan: 1800000  // 30 minutes
});
```

## Memory Optimization

### Quantization Integration

Tiered storage works with vector quantization:

```javascript
const store = new RuVector({
  tieredStorage: { enabled: true },
  quantization: {
    hot: 'float32',     // Full precision
    warm: 'float16',    // Half precision (50% size)
    cold: 'int8'        // 8-bit quantized (75% size)
  }
});
```

### Memory Reduction Results

| Tier | Base Size | After Compression | After Quantization | Total Reduction |
|------|-----------|-------------------|-------------------|-----------------|
| Hot | 100MB | 100MB | 100MB | 0% |
| Warm | 100MB | 25MB | 12.5MB | 87.5% |
| Cold | 100MB | 10MB | 2.5MB | 97.5% |

## Access Patterns

### Tier-Aware Queries

```javascript
// Query prioritizes hot tier, falls back to colder tiers
const results = await store.search(queryVector, {
  k: 10,
  tierStrategy: 'cascade',  // hot → warm → cold
  maxLatency: 50           // Skip cold if over 50ms
});

// Force specific tier
const archiveResults = await store.search(queryVector, {
  k: 10,
  tier: 'cold',
  rehydrate: true  // Temporarily load into hot tier
});
```

### Prefetching

```javascript
// Predictive prefetching based on access patterns
store.enablePrefetch({
  strategy: 'temporal',     // Time-based patterns
  lookAhead: 3600000,       // 1 hour
  maxPrefetch: '100MB'
});
```

## Integration with AgentDB

### Agent Memory Tiering

```javascript
const { AgentDB } = require('agentdb');

const agent = new AgentDB({
  memory: {
    tieredStorage: true,
    episodic: {
      hot: 100,    // Last 100 episodes in hot tier
      warm: 1000,  // Next 1000 in warm
      cold: 'all'  // Rest in cold
    },
    semantic: {
      hot: '1GB',
      warm: '10GB',
      cold: 'unlimited'
    }
  }
});
```

### Experience Replay Integration

```javascript
// Experience replay samples from appropriate tiers
const batch = await agent.sampleExperiences({
  count: 32,
  tierWeights: {
    hot: 0.7,    // 70% from recent experiences
    warm: 0.25,  // 25% from medium-term
    cold: 0.05   // 5% from long-term memory
  }
});
```

## Performance Benchmarks

### Latency by Tier

| Operation | Hot | Warm | Cold |
|-----------|-----|------|------|
| Point lookup | 0.1ms | 2ms | 50ms |
| Vector search (k=10) | 1ms | 10ms | 100ms |
| Batch insert (1000) | 50ms | 100ms | 500ms |
| Full scan | 100ms | 1s | 10s |

### Storage Efficiency

- **10x memory reduction** with tiered compression
- **50% faster queries** by keeping hot data in RAM
- **99% storage cost reduction** for cold data

## Best Practices

1. **Set appropriate tier boundaries** based on access patterns
2. **Use LZ4 for warm tier** - best balance of speed and compression
3. **Enable ZSTD for cold tier** - maximum compression for archival
4. **Combine with quantization** for additional memory savings
5. **Monitor tier distribution** to optimize boundaries
6. **Set TTLs for cold tier** to manage storage growth

## Related Features

- **EWC Consolidation**: Preserves important weights during migration
- **HNSW Indexing**: Maintains fast search across tiers
- **QUIC Sync**: Efficient cross-node tier synchronization
- **SafeTensors**: Secure serialization for tier persistence
