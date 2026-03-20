# SONA Configuration Reference

## Self-Optimizing Neural Architecture for KB-First Applications

SONA enables your knowledge base to learn from every interaction, improving search quality and response accuracy over time.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SONA Architecture                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   User Query ──► KB Search ──► Response ──► Feedback ──► Learning       │
│        │              │            │            │            │          │
│        ▼              ▼            ▼            ▼            ▼          │
│   ┌─────────┐   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│   │Embedding│   │ Vector  │  │Response │  │ Score   │  │  SONA   │    │
│   │         │   │ Search  │  │ Builder │  │ Rating  │  │ Engine  │    │
│   └─────────┘   └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Three Learning Loops                         │   │
│   │  ┌──────────┐   ┌──────────┐   ┌──────────┐                    │   │
│   │  │ Instant  │   │Background│   │   Deep   │                    │   │
│   │  │  Loop A  │   │  Loop B  │   │  Loop C  │                    │   │
│   │  │ <100μs   │   │  Hourly  │   │  Weekly  │                    │   │
│   │  └──────────┘   └──────────┘   └──────────┘                    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Installation

### Rust

```toml
# Cargo.toml
[dependencies]
ruvector-sona = "0.1"
```

```rust
use ruvector_sona::{SonaEngine, SonaConfig};
```

### Node.js

```bash
npm install @ruvector/sona
```

```javascript
const { SonaEngine } = require('@ruvector/sona');
```

### Browser (WASM)

```javascript
import init, { WasmSonaEngine } from '@ruvector/sona/wasm';

await init();
const engine = new WasmSonaEngine(256);
```

---

## Configuration Options

### SonaConfig

```typescript
interface SonaConfig {
  // Dimensions
  hidden_dim: number;      // Default: 256 - Internal representation size
  embedding_dim: number;   // Default: 256 - Input embedding size
  
  // LoRA Configuration
  micro_lora_rank: number; // Default: 2 (recommended: 1-2)
  base_lora_rank: number;  // Default: 16 (recommended: 4-16)
  lora_alpha: number;      // Default: 1.0 - Scaling factor
  lora_dropout: number;    // Default: 0.0 - Dropout rate
  
  // Trajectory Buffer
  trajectory_buffer_size: number;  // Default: 10000
  max_trajectory_steps: number;    // Default: 50
  
  // EWC++ Configuration
  ewc_lambda: number;       // Default: 0.4 - Constraint strength
  ewc_gamma: number;        // Default: 0.95 - Decay rate
  ewc_fisher_samples: number; // Default: 100
  ewc_online: boolean;      // Default: true
  
  // ReasoningBank
  pattern_clusters: number;           // Default: 32
  pattern_quality_threshold: number;  // Default: 0.7
  consolidation_interval: number;     // Default: 1000
  
  // Learning Rates
  micro_lr: number;  // Default: 0.01
  base_lr: number;   // Default: 0.001
}
```

### Configuration by Use Case

**High-Frequency Updates (Chat)**
```typescript
const config = {
  micro_lora_rank: 1,      // Minimal per-request overhead
  base_lora_rank: 8,       // Moderate long-term learning
  trajectory_buffer_size: 20000,
  ewc_lambda: 0.3          // Lower to allow more adaptation
};
```

**Enterprise Knowledge Base**
```typescript
const config = {
  micro_lora_rank: 2,
  base_lora_rank: 16,      // Higher for stable patterns
  pattern_quality_threshold: 0.8,  // Stricter quality
  ewc_lambda: 0.6          // Stronger anti-forgetting
};
```

**Edge/Browser Deployment**
```typescript
const config = {
  hidden_dim: 128,         // Smaller for memory
  micro_lora_rank: 1,
  base_lora_rank: 4,
  trajectory_buffer_size: 1000,
  pattern_clusters: 16
};
```

---

## Core Components

### 1. MicroLoRA (Instant Adaptation)

Ultra-low rank adaptation for per-request learning.

```typescript
// MicroLoRA applies immediately after each query
// Rank 1-2 keeps overhead < 100μs

// Automatic application during search
const results = await kb.search(query);
// MicroLoRA weights automatically adjusted based on result quality

// Manual application
const optimizedEmbedding = sona.applyMicroLora(queryEmbedding);
```

**When MicroLoRA Fires:**
- After every KB search
- Updates based on result relevance
- Instant, no batch required

### 2. BaseLoRA (Background Learning)

Standard LoRA for long-term pattern learning.

```typescript
// BaseLoRA consolidates patterns hourly
// Rank 4-16 captures deeper relationships

// Patterns extracted from successful trajectories
// Applied during the Background Loop

// Force consolidation (if needed)
sona.consolidatePatterns();
```

**When BaseLoRA Updates:**
- Hourly by default
- After N trajectories (configurable)
- Manual trigger available

### 3. EWC++ (Elastic Weight Consolidation)

Prevents catastrophic forgetting when learning new patterns.

```typescript
// EWC++ maintains Fisher information matrix
// Penalizes changes to important weights

const config = {
  ewc_lambda: 0.4,    // Constraint strength (0.3-0.6 typical)
  ewc_gamma: 0.95,    // Decay for old constraints
  ewc_online: true    // Online Fisher estimation
};

// Task boundaries detected automatically
// Or mark manually:
sona.markTaskBoundary('financial-queries');
```

**Tuning ewc_lambda:**
| Value | Effect |
|-------|--------|
| 0.0 | No anti-forgetting (full plasticity) |
| 0.1-0.3 | Weak constraint (adapt quickly) |
| 0.4-0.6 | Balanced (recommended) |
| 0.7-1.0 | Strong constraint (stable, slow to learn) |

### 4. ReasoningBank (Pattern Storage)

K-means++ clustering for storing successful reasoning patterns.

```typescript
// ReasoningBank stores:
// - Query patterns
// - Successful responses
// - KB nodes used
// - Attention weights

// Store successful pattern
sona.storePattern({
  queryPattern: 'retirement withdrawal strategy',
  response: 'The 4% rule suggests...',
  nodesUsed: ['kb://retirement/withdrawal-rates'],
  feedbackScore: 0.95
});

// Recall similar patterns
const similar = sona.recallPatterns(queryEmbedding, { limit: 3 });
```

**Pattern Quality Threshold:**
```typescript
pattern_quality_threshold: 0.7  // Only store patterns with score >= 0.7
```

---

## Learning Loops

### Loop A: Instant (Per-Request)

```
Query ──► MicroLoRA Update ──► Response
          │
          └── ~34μs latency
```

**What Happens:**
1. Query embedding received
2. MicroLoRA weights adjusted (SIMD-accelerated)
3. Trajectory step recorded (lock-free buffer)
4. Response returned

**Performance:** 2,236 ops/sec on typical hardware

### Loop B: Background (Hourly)

```
Trajectories ──► Pattern Extraction ──► BaseLoRA Update
                │
                └── K-means++ clustering (1.3ms for 100 clusters)
```

**What Happens:**
1. Accumulated trajectories analyzed
2. Successful patterns extracted
3. BaseLoRA weights updated
4. ReasoningBank populated

**Trigger:** Hourly or after N trajectories

### Loop C: Deep (Weekly)

```
All Patterns ──► EWC++ Consolidation ──► Model Checkpoint
                │
                └── Prevents catastrophic forgetting
```

**What Happens:**
1. Fisher information matrix updated
2. Task boundaries identified
3. Old concepts archived
4. Model checkpoint created

**Trigger:** Weekly or manual

---

## API Reference

### Initialization

```typescript
// Create engine with defaults
const sona = new SonaEngine();

// Create with custom config
const sona = new SonaEngine({
  hidden_dim: 256,
  micro_lora_rank: 2,
  base_lora_rank: 16,
  ewc_lambda: 0.4
});

// Node.js specific
const sona = SonaEngine.withConfig(2, 16, 10000, 0.4);
```

### Trajectory Recording

```typescript
// Start trajectory
const trajId = sona.startTrajectory(queryEmbedding);

// Record steps (each KB node visited)
sona.recordStep(trajId, nodeId, confidenceScore, latencyMs);
sona.recordStep(trajId, nodeId2, confidenceScore2, latencyMs2);

// End trajectory with final score
sona.endTrajectory(trajId, finalScore);
```

### Feedback Processing

```typescript
// Learn from positive feedback (thumbs up)
sona.learnFromFeedback({
  type: 'positive',
  weight: 50.0,      // Reward magnitude
  quality: 0.95      // Response quality score
});

// Learn from negative feedback (thumbs down)
sona.learnFromFeedback({
  type: 'negative',
  weight: 25.0,
  quality: 0.3
});
```

### Pattern Operations

```typescript
// Store successful pattern
sona.storePattern({
  queryPattern: 'query text or embedding',
  response: 'successful response',
  nodesUsed: ['node-1', 'node-2'],
  attentionWeights: { mechanism: 'multi_head' },
  feedbackScore: 0.9
});

// Recall similar patterns
const patterns = sona.recallPatterns(queryEmbedding, {
  limit: 5,
  minScore: 0.7
});

// Get pattern stats
const stats = sona.getPatternStats();
```

### Applying Learning

```typescript
// Apply LoRA to embedding
const optimized = sona.applyLora(queryEmbedding);

// Check if pattern exists
const hasPattern = sona.hasRelevantPattern(queryEmbedding, 0.8);

// Get learning stats
const stats = sona.getStats();
// {
//   trajectoriesProcessed: 1234,
//   patternsStored: 567,
//   microLoraUpdates: 8901,
//   baseLoraUpdates: 23,
//   ewcConsolidations: 4
// }
```

---

## Integration with KB-First

### Pre-Query Hook

```typescript
// Before KB search
async function preQuery(query: string, embedding: number[]): Promise<{
  enhancedEmbedding: number[];
  patterns: Pattern[];
}> {
  // Apply SONA optimization
  const enhanced = sona.applyLora(embedding);
  
  // Check ReasoningBank for similar patterns
  const patterns = sona.recallPatterns(embedding, { limit: 3 });
  
  return { enhancedEmbedding: enhanced, patterns };
}
```

### Post-Query Hook

```typescript
// After KB search and response
async function postQuery(
  query: string,
  embedding: number[],
  results: KBResult[],
  response: string,
  score: number
): Promise<void> {
  // Record trajectory
  const trajId = sona.startTrajectory(embedding);
  for (const result of results) {
    sona.recordStep(trajId, result.id, result.confidence, result.latency);
  }
  sona.endTrajectory(trajId, score);
  
  // Store successful pattern
  if (score >= 0.7) {
    sona.storePattern({
      queryPattern: query,
      response,
      nodesUsed: results.map(r => r.id),
      feedbackScore: score
    });
  }
}
```

### Feedback Hook

```typescript
// User thumbs up/down
async function onFeedback(
  trajId: string,
  positive: boolean
): Promise<void> {
  sona.learnFromFeedback({
    type: positive ? 'positive' : 'negative',
    weight: positive ? 50.0 : 25.0,
    quality: positive ? 0.9 : 0.3
  });
}
```

---

## Persistence

### Checkpoint Save/Load

```typescript
// Save state
const checkpoint = sona.checkpoint();
fs.writeFileSync('sona-state.json', JSON.stringify(checkpoint));

// Load state
const saved = JSON.parse(fs.readFileSync('sona-state.json', 'utf-8'));
sona.restore(saved);
```

### Export to HuggingFace

```typescript
import { HuggingFaceExporter } from '@ruvector/sona';

const exporter = new HuggingFaceExporter({
  modelName: 'my-kb-adapter',
  baseModel: 'all-MiniLM-L6-v2'
});

await exporter.export(sona, './output');
// Creates adapter files compatible with HuggingFace transformers
```

---

## Performance Benchmarks

| Operation | Latency | Throughput |
|-----------|---------|------------|
| MicroLoRA update | ~34μs | 29,000/sec |
| Trajectory record | ~112ns | 8.9M/sec |
| Pattern recall (100 clusters) | ~1.3ms | 770/sec |
| BaseLoRA consolidation | ~5ms | Background |
| EWC++ update | ~50ms | Weekly |

Memory usage:
- MicroLoRA (rank 2, dim 256): ~4KB
- BaseLoRA (rank 16, dim 256): ~32KB
- ReasoningBank (1000 patterns): ~1MB
- Trajectory buffer (10K entries): ~10MB

---

## Best Practices

### 1. Start Conservative
```typescript
// Begin with low ranks, increase if needed
const config = {
  micro_lora_rank: 1,
  base_lora_rank: 4
};
```

### 2. Monitor Pattern Quality
```typescript
// Check pattern stats regularly
const stats = sona.getPatternStats();
if (stats.avgScore < 0.7) {
  console.warn('Pattern quality declining');
}
```

### 3. Tune EWC for Domain
```typescript
// Financial (stable): Higher lambda
ewc_lambda: 0.6

// Research (evolving): Lower lambda  
ewc_lambda: 0.3
```

### 4. Use Task Boundaries
```typescript
// Mark when switching domains
sona.markTaskBoundary('switching-to-legal-queries');
```

### 5. Regular Checkpoints
```typescript
// Save state periodically
setInterval(() => {
  const cp = sona.checkpoint();
  saveCheckpoint(cp);
}, 3600000); // Hourly
```

---

## Troubleshooting

### "Learning not improving"
- Check feedback is being recorded
- Verify pattern_quality_threshold isn't too high
- Ensure trajectory steps are being logged

### "Forgetting old patterns"
- Increase ewc_lambda
- Check consolidation_interval
- Review task boundary detection

### "High latency"
- Reduce micro_lora_rank to 1
- Decrease pattern_clusters
- Check trajectory_buffer_size

### "Memory issues"
- Reduce trajectory_buffer_size
- Lower pattern_clusters
- Use WASM build for browser

---

*SONA Configuration Reference - KB-First v2.9*
