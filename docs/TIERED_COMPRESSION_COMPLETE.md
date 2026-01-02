Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:50:26 EST

# Tiered Storage & Compression Strategies

## Complete Reference for RuVector & AgentDB

**Version:** 2.0.0
**Last Updated:** December 2025

---

## Table of Contents

1. [Tiered Storage Architecture](#tiered-storage-architecture)
2. [Compression Algorithms](#compression-algorithms)
3. [Vector Quantization](#vector-quantization)
4. [Memory-Optimized Tiers](#memory-optimized-tiers)
5. [Implementation Patterns](#implementation-patterns)
6. [Configuration Reference](#configuration-reference)

---

## Tiered Storage Architecture

### What is Tiered Storage?

Tiered storage automatically moves data between storage layers based on access patterns, age, and importance. For vector databases, this means:

- **Hot tier**: Frequently accessed vectors in RAM
- **Warm tier**: Less frequent vectors on SSD
- **Cold tier**: Archival vectors with compression

### Tiered Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TIERED STORAGE                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  HOT TIER (RAM)                      │   │
│  │  • Uncompressed vectors                             │   │
│  │  • Sub-millisecond access                           │   │
│  │  • Most frequently accessed                         │   │
│  │  • ~10% of total data                               │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │ LRU eviction                      │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 WARM TIER (SSD)                      │   │
│  │  • Light compression (LZ4)                          │   │
│  │  • 1-10ms access                                    │   │
│  │  • Moderate frequency access                        │   │
│  │  • ~30% of total data                               │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │ Time-based migration              │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 COLD TIER (HDD/S3)                   │   │
│  │  • Heavy compression (ZSTD)                         │   │
│  │  • 10-100ms access                                  │   │
│  │  • Rarely accessed                                  │   │
│  │  • ~60% of total data                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tiered Storage Configuration

```javascript
const tieredConfig = {
  tiers: {
    hot: {
      type: 'memory',
      maxSize: '1GB',              // Max RAM usage
      compression: 'none',         // No compression for speed
      evictionPolicy: 'lru',       // Least Recently Used
      ttl: null                    // Never expires
    },
    warm: {
      type: 'ssd',
      path: '.ruvector/warm',
      compression: 'lz4',          // Fast compression
      compressionLevel: 3,
      evictionPolicy: 'lru',
      ttl: 86400000               // 24 hours
    },
    cold: {
      type: 'hdd',                // Or 's3' for cloud
      path: '.ruvector/cold',
      compression: 'zstd',         // High compression
      compressionLevel: 9,
      ttl: null                   // Permanent storage
    }
  },

  // Migration policies
  migration: {
    hotToWarm: {
      trigger: 'access_count',
      threshold: 10,              // Move after 10 accesses without new access
      interval: 3600000           // Check every hour
    },
    warmToCold: {
      trigger: 'age',
      threshold: 604800000,       // 7 days
      interval: 86400000          // Check daily
    }
  }
};
```

---

## Compression Algorithms

### Algorithm Comparison

| Algorithm | Compression Ratio | Speed | Use Case |
|-----------|-------------------|-------|----------|
| **None** | 1:1 | Fastest | Hot tier, real-time |
| **LZ4** | 2:1 - 3:1 | Very Fast | Warm tier, balanced |
| **Snappy** | 2:1 - 2.5:1 | Very Fast | Stream processing |
| **ZSTD** | 3:1 - 5:1 | Medium | Cold tier, archival |
| **ZSTD-dict** | 4:1 - 8:1 | Medium | Similar documents |
| **Brotli** | 4:1 - 6:1 | Slow | Maximum compression |

### Compression Implementation

```javascript
const compressionConfig = {
  // LZ4 for warm tier (fast)
  lz4: {
    level: 3,                     // 1-12, higher = smaller
    blockSize: 65536,             // 64KB blocks
    streaming: true
  },

  // ZSTD for cold tier (high ratio)
  zstd: {
    level: 9,                     // 1-22, higher = smaller
    dictionary: null,             // Optional trained dictionary
    windowLog: 23,                // 8MB window
    checksumFlag: true
  },

  // Dictionary compression for similar vectors
  zstdDict: {
    level: 9,
    dictionarySize: 112640,       // 110KB dictionary
    trainingSamples: 1000         // Vectors to train on
  }
};

// Train compression dictionary
async function trainDictionary(vectors, config) {
  const samples = vectors.slice(0, config.trainingSamples);
  const sampleBuffers = samples.map(v => Buffer.from(v.data));

  return zstd.trainDictionary(sampleBuffers, {
    maxSize: config.dictionarySize
  });
}
```

### Compression Results for Vector Data

```
Original: 768-dim float32 vectors (3,072 bytes each)

No Compression:     3,072 bytes/vector  (1.0x)
LZ4 (level 3):      1,536 bytes/vector  (2.0x)
LZ4 (level 9):      1,024 bytes/vector  (3.0x)
ZSTD (level 9):       768 bytes/vector  (4.0x)
ZSTD-dict:            384 bytes/vector  (8.0x) *with trained dictionary
```

---

## Vector Quantization

### What is Quantization?

Quantization reduces vector precision to save memory. Instead of 32-bit floats, use 8-bit or 4-bit integers.

### Quantization Types

```
┌─────────────────────────────────────────────────────────────┐
│                  QUANTIZATION TYPES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Float32 (Original)     Float16 (Half)       Int8 (Byte)   │
│  ┌────────────────┐    ┌─────────────┐     ┌───────────┐   │
│  │ 32 bits/dim    │    │ 16 bits/dim │     │ 8 bits/dim│   │
│  │ 100% accuracy  │    │ 99% accuracy│     │ 95% accuracy  │
│  │ 3072 bytes/vec │    │ 1536 bytes  │     │ 768 bytes │   │
│  └────────────────┘    └─────────────┘     └───────────┘   │
│                                                             │
│  Int4 (Nibble)         Binary (1-bit)                      │
│  ┌───────────────┐     ┌─────────────┐                     │
│  │ 4 bits/dim    │     │ 1 bit/dim   │                     │
│  │ 90% accuracy  │     │ 70% accuracy│                     │
│  │ 384 bytes/vec │     │ 96 bytes/vec│                     │
│  └───────────────┘     └─────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Quantization Implementation

```javascript
// Scalar quantization (simple, fast)
function quantizeInt8(vector) {
  const min = Math.min(...vector);
  const max = Math.max(...vector);
  const scale = 255 / (max - min);

  const quantized = new Int8Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    quantized[i] = Math.round((vector[i] - min) * scale) - 128;
  }

  return { quantized, min, scale };
}

// Product quantization (high compression, maintains accuracy)
class ProductQuantizer {
  constructor(config = {}) {
    this.numSubvectors = config.numSubvectors || 8;
    this.numCentroids = config.numCentroids || 256;
    this.codebooks = null;
  }

  train(vectors) {
    const subvectorDim = vectors[0].length / this.numSubvectors;

    this.codebooks = [];
    for (let i = 0; i < this.numSubvectors; i++) {
      // Extract subvectors
      const subvectors = vectors.map(v =>
        v.slice(i * subvectorDim, (i + 1) * subvectorDim)
      );

      // K-means clustering
      this.codebooks[i] = kmeans(subvectors, this.numCentroids);
    }
  }

  encode(vector) {
    const subvectorDim = vector.length / this.numSubvectors;
    const codes = new Uint8Array(this.numSubvectors);

    for (let i = 0; i < this.numSubvectors; i++) {
      const subvector = vector.slice(i * subvectorDim, (i + 1) * subvectorDim);
      codes[i] = this.findNearestCentroid(subvector, this.codebooks[i]);
    }

    return codes;  // 8 bytes instead of 3072!
  }
}
```

### Quantization in RuVector

```javascript
const store = new RuvectorStore({
  dimension: 768,
  quantization: {
    type: 'int8',                 // 'none', 'int8', 'int4', 'pq'
    training: {
      sampleSize: 10000,
      warmup: true                // Train on first N vectors
    }
  }
});

// Or product quantization for maximum compression
const pqStore = new RuvectorStore({
  dimension: 768,
  quantization: {
    type: 'pq',
    numSubvectors: 8,
    numCentroids: 256,
    training: {
      sampleSize: 50000
    }
  }
});
```

---

## Memory-Optimized Tiers

### Tier-Specific Optimizations

```javascript
const memoryOptimizedConfig = {
  // Hot tier: Speed over size
  hot: {
    indexType: 'hnsw',
    hnswConfig: {
      M: 32,                      // More connections = faster search
      efConstruction: 200,
      efSearch: 100
    },
    caching: {
      enabled: true,
      maxSize: '500MB',
      preload: true               // Load on startup
    }
  },

  // Warm tier: Balanced
  warm: {
    indexType: 'hnsw',
    hnswConfig: {
      M: 16,                      // Fewer connections = smaller index
      efConstruction: 100,
      efSearch: 50
    },
    compression: 'lz4',
    mmap: true                    // Memory-mapped files
  },

  // Cold tier: Size over speed
  cold: {
    indexType: 'flat',            // No index, linear scan
    compression: 'zstd',
    compressionLevel: 15,
    quantization: 'int8',
    chunking: {
      size: 10000,                // Vectors per chunk
      lazyLoad: true              // Load on demand
    }
  }
};
```

### Automatic Tier Migration

```javascript
class TieredVectorStore {
  constructor(config) {
    this.tiers = {
      hot: new HotTier(config.hot),
      warm: new WarmTier(config.warm),
      cold: new ColdTier(config.cold)
    };

    this.accessCounts = new Map();
    this.lastAccess = new Map();
  }

  async search(query, k = 10) {
    // Search hot tier first
    let results = await this.tiers.hot.search(query, k);

    // If not enough results, search warm tier
    if (results.length < k) {
      const warmResults = await this.tiers.warm.search(query, k - results.length);
      results = [...results, ...warmResults];
    }

    // Cold tier only if explicitly requested
    return results;
  }

  async migrateVector(id, fromTier, toTier) {
    const vector = await this.tiers[fromTier].get(id);
    await this.tiers[toTier].insert(vector);
    await this.tiers[fromTier].delete(id);
  }

  async runMigration() {
    const now = Date.now();

    for (const [id, lastAccess] of this.lastAccess) {
      const age = now - lastAccess;
      const accessCount = this.accessCounts.get(id) || 0;

      // Hot -> Warm: Not accessed in 1 hour
      if (age > 3600000 && accessCount < 10) {
        await this.migrateVector(id, 'hot', 'warm');
      }

      // Warm -> Cold: Not accessed in 7 days
      if (age > 604800000) {
        await this.migrateVector(id, 'warm', 'cold');
      }
    }
  }
}
```

---

## Implementation Patterns

### Pattern 1: Age-Based Tiering

```javascript
const ageBasedTiering = {
  policies: [
    { age: '0-1h', tier: 'hot', compression: 'none' },
    { age: '1h-24h', tier: 'hot', compression: 'none' },
    { age: '1d-7d', tier: 'warm', compression: 'lz4' },
    { age: '7d-30d', tier: 'cold', compression: 'zstd' },
    { age: '30d+', tier: 'archive', compression: 'zstd-max' }
  ]
};
```

### Pattern 2: Access-Based Tiering

```javascript
const accessBasedTiering = {
  policies: [
    { accessRate: '>100/day', tier: 'hot' },
    { accessRate: '10-100/day', tier: 'warm' },
    { accessRate: '<10/day', tier: 'cold' }
  ]
};
```

### Pattern 3: Importance-Based Tiering

```javascript
const importanceBasedTiering = {
  policies: [
    { score: '>0.9', tier: 'hot', compression: 'none' },
    { score: '0.7-0.9', tier: 'warm', compression: 'lz4' },
    { score: '<0.7', tier: 'cold', compression: 'zstd' }
  ]
};
```

---

## Configuration Reference

### Full Tiered Storage Config

```javascript
module.exports = {
  tieredStorage: {
    enabled: true,

    tiers: {
      hot: {
        type: 'memory',
        maxSize: '2GB',
        compression: 'none',
        quantization: 'none',
        index: 'hnsw'
      },
      warm: {
        type: 'ssd',
        path: '.ruvector/warm',
        compression: 'lz4',
        compressionLevel: 6,
        quantization: 'int8',
        index: 'hnsw'
      },
      cold: {
        type: 'hdd',
        path: '.ruvector/cold',
        compression: 'zstd',
        compressionLevel: 15,
        quantization: 'pq',
        index: 'flat'
      }
    },

    migration: {
      schedule: '0 * * * *',       // Every hour
      hotToWarm: { maxAge: 3600000 },
      warmToCold: { maxAge: 604800000 }
    },

    compression: {
      algorithm: 'zstd',
      level: 9,
      dictionary: true,
      dictionaryPath: '.ruvector/dict.zst'
    },

    quantization: {
      type: 'pq',
      numSubvectors: 8,
      numCentroids: 256
    }
  }
};
```

### Environment Variables

```bash
# Tiered Storage
RUVECTOR_TIERED_ENABLED=true
RUVECTOR_HOT_MAX_SIZE=2GB
RUVECTOR_WARM_PATH=.ruvector/warm
RUVECTOR_COLD_PATH=.ruvector/cold

# Compression
RUVECTOR_COMPRESSION=zstd
RUVECTOR_COMPRESSION_LEVEL=9
RUVECTOR_USE_DICTIONARY=true

# Quantization
RUVECTOR_QUANTIZATION=pq
RUVECTOR_PQ_SUBVECTORS=8
RUVECTOR_PQ_CENTROIDS=256

# Migration
RUVECTOR_MIGRATION_SCHEDULE=0 * * * *
RUVECTOR_HOT_TO_WARM_AGE=3600000
RUVECTOR_WARM_TO_COLD_AGE=604800000
```

---

## Size & Performance Reference

### Storage Size Comparison

| Configuration | 1M Vectors (768-dim) | Search Speed | Accuracy |
|---------------|---------------------|--------------|----------|
| Uncompressed | 3.0 GB | 1ms | 100% |
| LZ4 compressed | 1.5 GB | 2ms | 100% |
| ZSTD compressed | 750 MB | 5ms | 100% |
| Int8 quantized | 768 MB | 1.5ms | 95% |
| PQ (8 subvectors) | 8 MB | 3ms | 90% |
| PQ + ZSTD | 4 MB | 10ms | 90% |

### Memory Footprint by Tier

| Tier | 100K Vectors | 1M Vectors | 10M Vectors |
|------|--------------|------------|-------------|
| Hot (RAM) | 300 MB | 3 GB | 30 GB |
| Warm (SSD+LZ4) | 150 MB | 1.5 GB | 15 GB |
| Cold (HDD+ZSTD) | 75 MB | 750 MB | 7.5 GB |
| Archive (PQ+ZSTD) | 8 MB | 80 MB | 800 MB |

---

*Document generated for RuVector Knowledge Base - December 2025*
