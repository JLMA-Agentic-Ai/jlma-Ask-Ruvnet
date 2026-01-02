Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:00:42 EST

# Error Handling and Recovery Procedures

## Overview

This guide covers comprehensive error handling strategies, recovery procedures, and resilience patterns for the RuvLLM + RuVector + Agentic-Flow integration stack.

## Error Classification

### Severity Levels

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR SEVERITY MATRIX                     │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   LEVEL     │   IMPACT    │   RESPONSE  │   RECOVERY TIME   │
├─────────────┼─────────────┼─────────────┼───────────────────┤
│ CRITICAL    │ System down │ Immediate   │ < 1 minute        │
│ HIGH        │ Degraded    │ Priority    │ < 5 minutes       │
│ MEDIUM      │ Partial     │ Standard    │ < 30 minutes      │
│ LOW         │ Minimal     │ Deferred    │ Next maintenance  │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

### Error Categories

1. **Infrastructure Errors**: Ollama, network, storage failures
2. **Data Errors**: Corruption, validation, consistency issues
3. **Application Errors**: Logic, configuration, integration bugs
4. **Resource Errors**: Memory, CPU, disk exhaustion

## Error Handling Patterns

### Try-Catch with Fallback

```javascript
const { RuvLLM } = require('@ruvector/ruvllm');
const { ErrorHandler } = require('@ruvector/ruvllm/errors');

const errorHandler = new ErrorHandler({
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  fallbackProvider: 'groq'
});

async function generateWithFallback(prompt) {
  try {
    return await llm.generate({ prompt });
  } catch (error) {
    if (error.code === 'RUVLLM_001') {
      // Ollama connection failed - try fallback
      console.warn('Primary LLM unavailable, using fallback');
      return await errorHandler.fallback({ prompt });
    }

    if (error.retryable) {
      return await errorHandler.retry(() => llm.generate({ prompt }));
    }

    throw error;
  }
}
```

### Circuit Breaker Pattern

```javascript
const { CircuitBreaker } = require('agentic-flow/resilience');

const breaker = new CircuitBreaker({
  failureThreshold: 5,       // Open after 5 failures
  resetTimeout: 30000,       // Try again after 30s
  halfOpenRequests: 3,       // Test with 3 requests
  monitorInterval: 10000     // Check health every 10s
});

// Wrap risky operations
const safeGenerate = breaker.wrap(async (prompt) => {
  return await llm.generate({ prompt });
});

// Handle circuit states
breaker.on('open', () => {
  console.error('Circuit opened - LLM unavailable');
  notifyOps('LLM circuit breaker opened');
});

breaker.on('halfOpen', () => {
  console.log('Circuit half-open - testing recovery');
});

breaker.on('close', () => {
  console.log('Circuit closed - service recovered');
});
```

### Graceful Degradation

```javascript
const { DegradationManager } = require('agentic-flow/resilience');

const degradation = new DegradationManager({
  modes: {
    full: {
      llm: 'qwen3:8b',
      ragTopK: 10,
      reranking: true
    },
    reduced: {
      llm: 'qwen3:4b',
      ragTopK: 5,
      reranking: false
    },
    minimal: {
      llm: 'qwen3:1.7B',
      ragTopK: 3,
      reranking: false,
      cacheOnly: true
    }
  },
  triggers: {
    reduced: { cpuThreshold: 80, latencyMs: 5000 },
    minimal: { cpuThreshold: 95, latencyMs: 10000 }
  }
});

// Auto-adjust based on system health
degradation.monitor();

// Get current mode config
const config = degradation.getCurrentConfig();
```

## RuVector Error Handling

### Index Corruption Recovery

```javascript
const { RuVector } = require('ruvector');

async function recoverFromCorruption(store) {
  console.log('Index corruption detected, initiating recovery...');

  // Step 1: Attempt WAL replay
  try {
    await store.replayWAL();
    console.log('WAL replay successful');
    return true;
  } catch (walError) {
    console.warn('WAL replay failed:', walError);
  }

  // Step 2: Restore from latest backup
  const backups = await store.listBackups();
  if (backups.length > 0) {
    const latest = backups.sort((a, b) => b.timestamp - a.timestamp)[0];
    try {
      await store.restore(latest.path);
      console.log('Restored from backup:', latest.path);
      return true;
    } catch (restoreError) {
      console.error('Backup restore failed:', restoreError);
    }
  }

  // Step 3: Rebuild index from metadata
  try {
    await store.rebuildIndex();
    console.log('Index rebuilt from metadata');
    return true;
  } catch (rebuildError) {
    console.error('Index rebuild failed:', rebuildError);
  }

  throw new Error('All recovery methods exhausted');
}
```

### Persistence Failure Handling

```javascript
const store = new RuVector({
  persistence: {
    enabled: true,
    path: '.ruvector/knowledge-base',
    walEnabled: true,
    onWriteError: async (error, operation) => {
      console.error('Persistence error:', error);

      // Log to monitoring
      await monitoring.logError({
        type: 'persistence_failure',
        operation: operation,
        error: error.message
      });

      // Attempt alternative storage
      if (error.code === 'ENOSPC') {
        await cleanupOldBackups();
        return 'retry';
      }

      // Queue for later retry
      await retryQueue.add(operation);
      return 'queued';
    }
  }
});
```

## Ollama Error Handling

### Connection Recovery

```javascript
const { OllamaClient } = require('@ruvector/ruvllm/ollama');

const ollama = new OllamaClient({
  baseUrl: 'http://localhost:11434',
  connectionPool: {
    maxConnections: 10,
    idleTimeout: 30000
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  healthCheck: {
    enabled: true,
    interval: 5000,
    timeout: 2000
  }
});

// Auto-reconnect on failure
ollama.on('disconnected', async () => {
  console.warn('Ollama disconnected, attempting reconnect...');

  for (let i = 0; i < 5; i++) {
    await sleep(Math.pow(2, i) * 1000);
    try {
      await ollama.connect();
      console.log('Reconnected to Ollama');
      return;
    } catch (e) {
      console.warn(`Reconnect attempt ${i + 1} failed`);
    }
  }

  // Switch to fallback provider
  await switchToFallback();
});
```

### Model Loading Errors

```javascript
async function loadModelWithFallback(primaryModel, fallbackModels) {
  const modelsToTry = [primaryModel, ...fallbackModels];

  for (const model of modelsToTry) {
    try {
      await ollama.pull(model);
      await ollama.load(model);
      console.log(`Successfully loaded model: ${model}`);
      return model;
    } catch (error) {
      console.warn(`Failed to load ${model}:`, error.message);
      continue;
    }
  }

  throw new Error('All model loading attempts failed');
}

// Usage
const activeModel = await loadModelWithFallback(
  'qwen3:8b',
  ['qwen3:4b', 'qwen3:1.7B', 'llama3.2:3b']
);
```

## Agentic-Flow Error Handling

### Agent Failure Recovery

```javascript
const { AgenticFlow } = require('agentic-flow');

const flow = new AgenticFlow({
  agents: {
    onFailure: async (agent, error) => {
      console.error(`Agent ${agent.id} failed:`, error);

      // Log failure for analysis
      await flow.memory.store({
        key: `failures/${agent.id}/${Date.now()}`,
        value: {
          error: error.message,
          stack: error.stack,
          context: agent.getContext()
        }
      });

      // Attempt restart with fresh state
      if (error.retryable && agent.restartCount < 3) {
        await agent.restart({ preserveMemory: true });
        return 'restarted';
      }

      // Reassign task to another agent
      const backup = await flow.findAvailableAgent(agent.type);
      if (backup) {
        await backup.assignTask(agent.currentTask);
        return 'reassigned';
      }

      return 'failed';
    }
  }
});
```

### Swarm Self-Healing

```javascript
const swarm = await flow.initSwarm({
  topology: 'mesh',
  selfHealing: {
    enabled: true,
    healthCheckInterval: 5000,
    maxFailedAgents: 2,
    autoRestart: true,
    autoScale: true
  }
});

swarm.on('agentDied', async (agentId) => {
  console.warn(`Agent ${agentId} died, initiating recovery...`);

  // Redistribute tasks
  const deadAgent = swarm.getAgent(agentId);
  const pendingTasks = deadAgent.getPendingTasks();

  for (const task of pendingTasks) {
    await swarm.redistributeTask(task);
  }

  // Spawn replacement
  await swarm.spawnAgent(deadAgent.type, {
    inheritMemory: true,
    sourceAgent: agentId
  });
});
```

## Recovery Procedures

### Full System Recovery

```javascript
async function fullSystemRecovery() {
  console.log('=== INITIATING FULL SYSTEM RECOVERY ===');

  const steps = [
    { name: 'Stop active operations', fn: stopOperations },
    { name: 'Verify Ollama', fn: verifyOllama },
    { name: 'Verify RuVector', fn: verifyRuVector },
    { name: 'Restore memory DB', fn: restoreMemoryDB },
    { name: 'Rebuild indexes', fn: rebuildIndexes },
    { name: 'Validate data integrity', fn: validateIntegrity },
    { name: 'Restart services', fn: restartServices },
    { name: 'Run health checks', fn: runHealthChecks }
  ];

  for (const step of steps) {
    console.log(`[RECOVERY] ${step.name}...`);
    try {
      await step.fn();
      console.log(`[RECOVERY] ${step.name} ✓`);
    } catch (error) {
      console.error(`[RECOVERY] ${step.name} FAILED:`, error);
      throw new Error(`Recovery failed at: ${step.name}`);
    }
  }

  console.log('=== RECOVERY COMPLETE ===');
}
```

### Automated Backup Recovery

```javascript
const { BackupManager } = require('ruvector/backup');

const backupManager = new BackupManager({
  sourcePath: '.ruvector/knowledge-base',
  backupPath: '.ruvector/backups',
  schedule: '0 */6 * * *',  // Every 6 hours
  retention: {
    hourly: 24,
    daily: 7,
    weekly: 4
  },
  verification: true
});

// Automatic recovery on startup
backupManager.on('corruptionDetected', async () => {
  const latest = await backupManager.getLatestValid();
  await backupManager.restore(latest);
});
```

## Error Logging and Monitoring

```javascript
const { ErrorLogger } = require('agentic-flow/logging');

const logger = new ErrorLogger({
  destinations: [
    { type: 'console', level: 'debug' },
    { type: 'file', path: './logs/errors.log', level: 'error' },
    { type: 'memory', store: flow.memory, namespace: 'errors' }
  ],
  format: {
    timestamp: true,
    stack: true,
    context: true
  }
});

// Structured error logging
logger.error('VectorSearchFailed', {
  query: queryVector.slice(0, 5),
  error: error.message,
  latency: endTime - startTime,
  recoveryAction: 'retry'
});
```

## Best Practices

1. **Always use timeouts** for external calls (Ollama, network)
2. **Implement circuit breakers** for critical paths
3. **Enable WAL** for RuVector persistence
4. **Schedule regular backups** with verification
5. **Log errors with context** for debugging
6. **Monitor error rates** and set alerts
7. **Test recovery procedures** regularly
8. **Document runbooks** for common failures

## Related Documentation

- [API Reference](./API_INTEGRATION_REFERENCE.md)
- [Monitoring Guide](./MONITORING_OBSERVABILITY.md)
- [Security Guide](./SECURITY_ACCESS_CONTROL.md)
