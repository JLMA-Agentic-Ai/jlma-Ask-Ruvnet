Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:00:45 EST

# Monitoring and Observability Guide

## Overview

Comprehensive monitoring and observability setup for the RuvLLM + RuVector + Agentic-Flow stack, covering metrics collection, logging, alerting, and health checks.

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   METRICS    │  │    LOGS      │  │   TRACES     │              │
│  │  Prometheus  │  │   Winston    │  │   OpenTel    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         └────────────┬────┴────────────────┘                       │
│                      │                                              │
│              ┌───────▼───────┐                                      │
│              │  AGGREGATION  │                                      │
│              │   & STORAGE   │                                      │
│              └───────┬───────┘                                      │
│                      │                                              │
│         ┌────────────┼────────────┐                                │
│         │            │            │                                 │
│  ┌──────▼─────┐ ┌────▼────┐ ┌────▼────┐                           │
│  │ DASHBOARDS │ │ ALERTS  │ │ ANALYSIS│                           │
│  │  Grafana   │ │  Rules  │ │  Tools  │                           │
│  └────────────┘ └─────────┘ └─────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Metrics Collection

### RuVector Metrics

```javascript
const { MetricsCollector } = require('ruvector/metrics');

const metrics = new MetricsCollector({
  prefix: 'ruvector',
  labels: {
    environment: process.env.NODE_ENV,
    instance: process.env.HOSTNAME
  }
});

// Built-in metrics
metrics.register([
  // Vector operations
  { name: 'vectors_total', type: 'gauge', help: 'Total vectors in store' },
  { name: 'search_latency_ms', type: 'histogram', help: 'Search latency' },
  { name: 'insert_latency_ms', type: 'histogram', help: 'Insert latency' },
  { name: 'search_rate', type: 'counter', help: 'Searches per second' },

  // Index health
  { name: 'hnsw_layers', type: 'gauge', help: 'HNSW graph layers' },
  { name: 'hnsw_connections', type: 'gauge', help: 'Average connections' },
  { name: 'index_memory_bytes', type: 'gauge', help: 'Index memory usage' },

  // Persistence
  { name: 'wal_size_bytes', type: 'gauge', help: 'WAL file size' },
  { name: 'last_save_timestamp', type: 'gauge', help: 'Last save time' },
  { name: 'backup_count', type: 'gauge', help: 'Available backups' }
]);

// Expose metrics endpoint
metrics.createServer({ port: 9090, path: '/metrics' });
```

### RuvLLM Metrics

```javascript
const { LLMMetrics } = require('@ruvector/ruvllm/metrics');

const llmMetrics = new LLMMetrics({
  prefix: 'ruvllm',
  trackTokens: true,
  trackLatency: true,
  trackErrors: true
});

// Token usage tracking
llmMetrics.on('generation', (data) => {
  llmMetrics.increment('tokens_input', data.inputTokens);
  llmMetrics.increment('tokens_output', data.outputTokens);
  llmMetrics.observe('generation_latency_ms', data.latencyMs);
});

// Model availability
llmMetrics.gauge('model_available', 1, { model: 'qwen3:8b' });
llmMetrics.gauge('fallback_active', 0);
```

### Agentic-Flow Metrics

```javascript
const { SwarmMetrics } = require('agentic-flow/metrics');

const swarmMetrics = new SwarmMetrics({
  swarmId: 'production-swarm',
  collectInterval: 5000
});

// Agent metrics
swarmMetrics.track([
  'agents_active',
  'agents_idle',
  'agents_failed',
  'tasks_completed',
  'tasks_pending',
  'tasks_failed',
  'coordination_latency_ms',
  'memory_operations_per_sec'
]);
```

## Logging Configuration

### Structured Logging Setup

```javascript
const { Logger } = require('agentic-flow/logging');

const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  transports: [
    {
      type: 'console',
      format: 'pretty',
      level: 'debug'
    },
    {
      type: 'file',
      filename: './logs/app.log',
      maxSize: '100m',
      maxFiles: 10,
      compress: true
    },
    {
      type: 'memory',
      store: flow.memory,
      namespace: 'logs',
      ttl: 86400000  // 24 hours
    }
  ],
  defaultMeta: {
    service: 'ruvnet-integration',
    version: process.env.npm_package_version
  }
});

// Log levels
logger.debug('Detailed debug information');
logger.info('General information');
logger.warn('Warning conditions');
logger.error('Error conditions');

// Structured logging
logger.info('VectorSearch', {
  query: 'How does HNSW work?',
  results: 10,
  latencyMs: 15,
  filters: { category: 'docs' }
});
```

### Log Aggregation

```javascript
const { LogAggregator } = require('agentic-flow/logging');

const aggregator = new LogAggregator({
  sources: [
    './logs/app.log',
    './logs/ruvector.log',
    './logs/ollama.log'
  ],
  output: {
    type: 'unified',
    path: './logs/unified.log'
  },
  enrichment: {
    addTimestamp: true,
    addHostname: true,
    parseJson: true
  }
});

// Query logs
const errors = await aggregator.query({
  level: 'error',
  timeRange: { from: '-1h', to: 'now' },
  contains: 'RuVector'
});
```

## Health Checks

### Component Health Endpoints

```javascript
const { HealthChecker } = require('agentic-flow/health');

const health = new HealthChecker({
  checks: [
    {
      name: 'ollama',
      type: 'http',
      url: 'http://localhost:11434/api/tags',
      interval: 10000,
      timeout: 5000
    },
    {
      name: 'ruvector',
      type: 'custom',
      check: async () => {
        const stats = store.getStats();
        return {
          healthy: stats.vectorCount > 0,
          details: { vectors: stats.vectorCount }
        };
      },
      interval: 30000
    },
    {
      name: 'memory_db',
      type: 'file',
      path: '.swarm/memory.db',
      interval: 60000
    },
    {
      name: 'disk_space',
      type: 'disk',
      path: '.',
      threshold: 0.9,  // Alert at 90% full
      interval: 300000
    }
  ]
});

// Expose health endpoint
health.createEndpoint({ port: 9091, path: '/health' });

// Response format
// GET /health
// {
//   "status": "healthy",
//   "timestamp": "2025-12-29T05:55:00Z",
//   "checks": {
//     "ollama": { "status": "up", "latencyMs": 45 },
//     "ruvector": { "status": "up", "vectors": 1501 },
//     "memory_db": { "status": "up", "sizeBytes": 7692000 },
//     "disk_space": { "status": "up", "usedPercent": 65 }
//   }
// }
```

### Liveness and Readiness Probes

```javascript
// Kubernetes-compatible probes
health.addProbe('liveness', {
  path: '/healthz',
  check: () => ({ alive: true })
});

health.addProbe('readiness', {
  path: '/ready',
  check: async () => {
    const ollamaReady = await ollama.isConnected();
    const ruvectorReady = store.isLoaded();
    return {
      ready: ollamaReady && ruvectorReady,
      components: { ollama: ollamaReady, ruvector: ruvectorReady }
    };
  }
});
```

## Alerting Rules

### Alert Configuration

```javascript
const { AlertManager } = require('agentic-flow/alerts');

const alerts = new AlertManager({
  channels: [
    {
      type: 'console',
      level: 'warning'
    },
    {
      type: 'webhook',
      url: process.env.ALERT_WEBHOOK_URL,
      level: 'critical'
    },
    {
      type: 'memory',
      store: flow.memory,
      namespace: 'alerts'
    }
  ]
});

// Define alert rules
alerts.addRule({
  name: 'HighSearchLatency',
  condition: 'ruvector_search_latency_ms > 100',
  duration: '5m',
  severity: 'warning',
  message: 'Search latency exceeds 100ms for 5 minutes'
});

alerts.addRule({
  name: 'OllamaDown',
  condition: 'health_ollama_status == 0',
  duration: '1m',
  severity: 'critical',
  message: 'Ollama service is down'
});

alerts.addRule({
  name: 'LowVectorCount',
  condition: 'ruvector_vectors_total < 1000',
  duration: '0s',
  severity: 'warning',
  message: 'Vector count dropped below 1000'
});

alerts.addRule({
  name: 'HighErrorRate',
  condition: 'rate(errors_total[5m]) > 10',
  duration: '2m',
  severity: 'critical',
  message: 'Error rate exceeds 10/sec'
});
```

## Dashboard Configuration

### Key Metrics Dashboard

```yaml
# dashboard.yaml
title: RuvNet Integration Dashboard
refresh: 10s

panels:
  - title: System Overview
    type: stat
    metrics:
      - ruvector_vectors_total
      - ruvllm_model_available
      - agentic_agents_active

  - title: Search Performance
    type: graph
    metrics:
      - ruvector_search_latency_ms{quantile="0.5"}
      - ruvector_search_latency_ms{quantile="0.95"}
      - ruvector_search_latency_ms{quantile="0.99"}

  - title: Token Usage
    type: counter
    metrics:
      - ruvllm_tokens_input
      - ruvllm_tokens_output

  - title: Agent Status
    type: table
    metrics:
      - agentic_agents_active
      - agentic_agents_idle
      - agentic_tasks_pending

  - title: Error Rate
    type: graph
    metrics:
      - rate(errors_total[5m])
```

## Performance Benchmarking

```javascript
const { Benchmark } = require('agentic-flow/benchmark');

const benchmark = new Benchmark({
  warmupIterations: 10,
  iterations: 100,
  concurrency: 10
});

// Run benchmarks
const results = await benchmark.run([
  {
    name: 'vector_search',
    fn: async () => {
      await store.search({ vector: testVector, k: 10 });
    }
  },
  {
    name: 'embedding_generation',
    fn: async () => {
      await llm.embed('Test document for embedding');
    }
  },
  {
    name: 'rag_query',
    fn: async () => {
      await rag.query({ question: 'Test question' });
    }
  }
]);

// Output results
console.log(results);
// {
//   vector_search: { avg: 12ms, p95: 25ms, p99: 45ms },
//   embedding_generation: { avg: 85ms, p95: 120ms, p99: 180ms },
//   rag_query: { avg: 450ms, p95: 800ms, p99: 1200ms }
// }
```

## Tracing

### Distributed Tracing Setup

```javascript
const { Tracer } = require('agentic-flow/tracing');

const tracer = new Tracer({
  serviceName: 'ruvnet-integration',
  exporter: {
    type: 'otlp',
    endpoint: process.env.OTLP_ENDPOINT
  }
});

// Trace RAG query
async function tracedRagQuery(question) {
  return tracer.startSpan('rag.query', async (span) => {
    span.setAttribute('question.length', question.length);

    // Trace embedding
    const embedding = await tracer.startSpan('rag.embed', async () => {
      return await llm.embed(question);
    });

    // Trace search
    const results = await tracer.startSpan('rag.search', async () => {
      return await store.search({ vector: embedding, k: 10 });
    });

    // Trace generation
    const answer = await tracer.startSpan('rag.generate', async () => {
      return await llm.generate({
        prompt: buildPrompt(question, results)
      });
    });

    span.setAttribute('results.count', results.length);
    return answer;
  });
}
```

## Best Practices

1. **Collect metrics at all layers** - infrastructure, application, business
2. **Use structured logging** with consistent fields
3. **Set up alerting** before going to production
4. **Monitor error rates** alongside latency
5. **Track resource usage** (CPU, memory, disk)
6. **Enable distributed tracing** for complex flows
7. **Create runbooks** for common alerts
8. **Review dashboards regularly** and remove unused metrics

## Related Documentation

- [API Reference](./API_INTEGRATION_REFERENCE.md)
- [Error Handling](./ERROR_HANDLING_RECOVERY.md)
- [Security Guide](./SECURITY_ACCESS_CONTROL.md)
- [Scalability Guide](./SCALABILITY_LOAD_BALANCING.md)
