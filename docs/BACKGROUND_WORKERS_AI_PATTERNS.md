# Background Workers AI Patterns for RuvNet

## Overview

Background workers enable AI processing without blocking user interactions. This guide covers patterns for implementing AI workloads in:

- **Service Workers** (browser background processing)
- **Web Workers** (parallel computation)
- **Node.js Workers** (server-side parallelism)
- **Message Queues** (distributed processing)
- **Cron Jobs** (scheduled AI tasks)

## Service Worker AI Patterns

### Pattern 1: Offline AI with Service Workers

```javascript
// sw.js - Service Worker with AI capabilities
import { Pipeline } from '@xenova/transformers';

let classifier = null;
let embedder = null;

// Initialize models on service worker activation
self.addEventListener('activate', async (event) => {
  event.waitUntil(async () => {
    // Load models into service worker
    classifier = await Pipeline.create('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    embedder = await Pipeline.create('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log('AI models loaded in service worker');
  });
});

// Handle AI requests even when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/api/classify') {
    event.respondWith(handleClassification(event.request));
  } else if (url.pathname === '/api/embed') {
    event.respondWith(handleEmbedding(event.request));
  }
});

async function handleClassification(request) {
  const { text } = await request.json();
  const result = await classifier(text);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleEmbedding(request) {
  const { text } = await request.json();
  const output = await embedder(text, { pooling: 'mean', normalize: true });

  return new Response(JSON.stringify({ embedding: Array.from(output.data) }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Pattern 2: Background Sync with AI

```javascript
// sw.js - Sync AI results when back online
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-ai-results') {
    event.waitUntil(syncPendingAnalysis());
  }
});

async function syncPendingAnalysis() {
  const db = await openDB('ai-queue', 1);
  const pending = await db.getAll('pending');

  for (const item of pending) {
    try {
      // Process with AI
      const result = await analyzeWithAI(item.data);

      // Sync to server
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({ id: item.id, result })
      });

      // Remove from queue
      await db.delete('pending', item.id);
    } catch (e) {
      console.error('Sync failed, will retry:', e);
    }
  }
}

// Register for background sync from main thread
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-ai-results');
});
```

### Pattern 3: Push Notification AI Processing

```javascript
// sw.js - Process push notifications with AI
self.addEventListener('push', async (event) => {
  const data = event.data.json();

  // AI-powered notification prioritization
  const priority = await classifyNotificationPriority(data);

  // AI-generated summary
  const summary = await summarizeNotification(data.body);

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: summary,
      icon: priority === 'high' ? '/icons/urgent.png' : '/icons/normal.png',
      badge: '/icons/badge.png',
      tag: data.id,
      data: { ...data, aiPriority: priority }
    })
  );
});

async function classifyNotificationPriority(data) {
  const result = await classifier(data.body);
  return result[0].score > 0.8 ? 'high' : 'normal';
}

async function summarizeNotification(text) {
  // Use local summarization model
  if (text.length > 100) {
    const summary = await summarizer(text, { max_length: 50 });
    return summary[0].summary_text;
  }
  return text;
}
```

## Web Worker AI Patterns

### Pattern 4: Dedicated AI Worker

```javascript
// ai-worker.js - Dedicated worker for AI tasks
import { Ruvector } from 'ruvector';
import { Pipeline } from '@xenova/transformers';

// Initialize AI components
let vectorDb = null;
let embedder = null;
let classifier = null;

self.onmessage = async (event) => {
  const { type, payload, id } = event.data;

  try {
    let result;

    switch (type) {
      case 'init':
        result = await initialize(payload);
        break;
      case 'embed':
        result = await generateEmbedding(payload);
        break;
      case 'search':
        result = await semanticSearch(payload);
        break;
      case 'classify':
        result = await classify(payload);
        break;
      case 'batch':
        result = await processBatch(payload);
        break;
    }

    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};

async function initialize(config) {
  // Initialize vector database
  vectorDb = new Ruvector({
    dimensions: 384,
    storage: 'indexeddb'
  });

  // Load models
  embedder = await Pipeline.create('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  classifier = await Pipeline.create('text-classification', 'Xenova/distilbert-base-uncased');

  return { status: 'initialized' };
}

async function generateEmbedding(text) {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function semanticSearch(query) {
  const embedding = await generateEmbedding(query.text);
  return await vectorDb.search({
    vector: embedding,
    k: query.k || 5
  });
}

async function classify(text) {
  return await classifier(text);
}

async function processBatch(items) {
  const results = [];
  for (const item of items) {
    const embedding = await generateEmbedding(item.text);
    await vectorDb.insert({ id: item.id, vector: embedding, metadata: item });
    results.push({ id: item.id, status: 'processed' });

    // Report progress
    self.postMessage({
      type: 'progress',
      progress: results.length / items.length
    });
  }
  return results;
}
```

```javascript
// main.js - Using the AI worker
class AIWorkerClient {
  constructor() {
    this.worker = new Worker('ai-worker.js', { type: 'module' });
    this.pending = new Map();
    this.nextId = 0;

    this.worker.onmessage = (event) => {
      const { id, success, result, error, type, progress } = event.data;

      if (type === 'progress') {
        this.onProgress?.(progress);
        return;
      }

      const resolve = this.pending.get(id);
      if (resolve) {
        this.pending.delete(id);
        resolve(success ? result : Promise.reject(new Error(error)));
      }
    };
  }

  send(type, payload) {
    return new Promise((resolve) => {
      const id = this.nextId++;
      this.pending.set(id, resolve);
      this.worker.postMessage({ type, payload, id });
    });
  }

  async init(config) {
    return this.send('init', config);
  }

  async embed(text) {
    return this.send('embed', text);
  }

  async search(query) {
    return this.send('search', query);
  }

  async classify(text) {
    return this.send('classify', text);
  }

  async processBatch(items, onProgress) {
    this.onProgress = onProgress;
    return this.send('batch', items);
  }
}

// Usage
const ai = new AIWorkerClient();
await ai.init({ model: 'all-MiniLM-L6-v2' });

const results = await ai.search({ text: 'machine learning', k: 5 });
```

### Pattern 5: Worker Pool for Parallel AI

```javascript
// worker-pool.js - Pool of AI workers
class AIWorkerPool {
  constructor(size = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.queue = [];
    this.size = size;

    // Initialize worker pool
    for (let i = 0; i < size; i++) {
      this.workers.push(this.createWorker(i));
    }
  }

  createWorker(id) {
    const worker = new Worker('ai-worker.js', { type: 'module' });
    return {
      id,
      worker,
      busy: false,
      taskCount: 0
    };
  }

  async execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0) return;

    // Find available worker (least loaded)
    const available = this.workers
      .filter(w => !w.busy)
      .sort((a, b) => a.taskCount - b.taskCount)[0];

    if (!available) return;

    const { task, resolve, reject } = this.queue.shift();
    available.busy = true;
    available.taskCount++;

    available.worker.postMessage(task);
    available.worker.onmessage = (event) => {
      available.busy = false;

      if (event.data.success) {
        resolve(event.data.result);
      } else {
        reject(new Error(event.data.error));
      }

      this.processQueue();  // Process next task
    };
  }

  // Parallel batch processing
  async parallelProcess(items, batchSize = 100) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    // Distribute batches across workers
    const promises = batches.map((batch, i) =>
      this.execute({
        type: 'batch',
        payload: batch,
        workerId: i % this.size
      })
    );

    const results = await Promise.all(promises);
    return results.flat();
  }

  terminate() {
    this.workers.forEach(w => w.worker.terminate());
  }
}

// Usage
const pool = new AIWorkerPool(4);

// Process 10,000 documents in parallel
const documents = [...];
const results = await pool.parallelProcess(documents, 250);
```

## Node.js Worker Threads

### Pattern 6: Node.js AI Worker Thread

```javascript
// ai-thread.js - Node.js worker thread
const { parentPort, workerData } = require('worker_threads');
const { Ruvector } = require('ruvector');

// Initialize from workerData
const db = new Ruvector(workerData.vectorConfig);

parentPort.on('message', async (message) => {
  const { type, data, id } = message;

  try {
    let result;

    switch (type) {
      case 'insert':
        result = await db.insert(data);
        break;
      case 'search':
        result = await db.search(data);
        break;
      case 'batch-insert':
        result = await batchInsert(data);
        break;
    }

    parentPort.postMessage({ id, result, success: true });
  } catch (error) {
    parentPort.postMessage({ id, error: error.message, success: false });
  }
});

async function batchInsert(items) {
  let inserted = 0;
  for (const item of items) {
    await db.insert(item);
    inserted++;

    // Report progress every 100 items
    if (inserted % 100 === 0) {
      parentPort.postMessage({
        type: 'progress',
        progress: inserted / items.length
      });
    }
  }
  return { inserted };
}
```

```javascript
// main.js - Using worker threads
const { Worker } = require('worker_threads');
const os = require('os');

class VectorWorkerPool {
  constructor(config) {
    this.workers = [];
    this.numWorkers = config.workers || os.cpus().length;

    for (let i = 0; i < this.numWorkers; i++) {
      this.workers.push(this.createWorker(config, i));
    }
  }

  createWorker(config, id) {
    const worker = new Worker('./ai-thread.js', {
      workerData: {
        vectorConfig: config.vector,
        workerId: id
      }
    });

    return {
      worker,
      id,
      busy: false
    };
  }

  async run(type, data) {
    const worker = this.getAvailableWorker();
    worker.busy = true;

    return new Promise((resolve, reject) => {
      const id = Date.now();

      const handler = (message) => {
        if (message.id === id) {
          worker.busy = false;
          worker.worker.off('message', handler);

          if (message.success) {
            resolve(message.result);
          } else {
            reject(new Error(message.error));
          }
        }
      };

      worker.worker.on('message', handler);
      worker.worker.postMessage({ type, data, id });
    });
  }

  getAvailableWorker() {
    const available = this.workers.find(w => !w.busy);
    if (!available) {
      // Round-robin if all busy
      return this.workers[Math.floor(Math.random() * this.workers.length)];
    }
    return available;
  }

  async terminate() {
    await Promise.all(this.workers.map(w => w.worker.terminate()));
  }
}

// Usage
const pool = new VectorWorkerPool({
  workers: 8,
  vector: { dimensions: 384 }
});

// Parallel vector operations
const results = await Promise.all([
  pool.run('search', { query: 'machine learning', k: 10 }),
  pool.run('search', { query: 'neural networks', k: 10 }),
  pool.run('search', { query: 'deep learning', k: 10 })
]);
```

## Message Queue Patterns

### Pattern 7: Redis-Based AI Queue

```javascript
// ai-queue-producer.js - Add tasks to queue
const Redis = require('ioredis');
const redis = new Redis();

class AITaskProducer {
  constructor(queueName = 'ai-tasks') {
    this.queue = queueName;
    this.results = `${queueName}:results`;
  }

  async submitTask(task) {
    const taskId = `task:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    await redis.lpush(this.queue, JSON.stringify({
      id: taskId,
      ...task,
      submittedAt: Date.now()
    }));

    return taskId;
  }

  async submitBatch(tasks) {
    const taskIds = tasks.map((_, i) =>
      `batch:${Date.now()}:${i}`
    );

    const pipeline = redis.pipeline();
    tasks.forEach((task, i) => {
      pipeline.lpush(this.queue, JSON.stringify({
        id: taskIds[i],
        ...task,
        submittedAt: Date.now()
      }));
    });

    await pipeline.exec();
    return taskIds;
  }

  async getResult(taskId, timeout = 30000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const result = await redis.hget(this.results, taskId);
      if (result) {
        return JSON.parse(result);
      }
      await new Promise(r => setTimeout(r, 100));
    }

    throw new Error('Task timeout');
  }
}
```

```javascript
// ai-queue-worker.js - Process queue tasks
const Redis = require('ioredis');
const { Ruvector } = require('ruvector');

const redis = new Redis();
const db = new Ruvector({ dimensions: 384 });

class AITaskWorker {
  constructor(queueName = 'ai-tasks') {
    this.queue = queueName;
    this.results = `${queueName}:results`;
    this.running = false;
  }

  async start() {
    this.running = true;
    console.log('AI Worker started');

    while (this.running) {
      try {
        // Block until task available (30s timeout)
        const task = await redis.brpop(this.queue, 30);

        if (task) {
          await this.processTask(JSON.parse(task[1]));
        }
      } catch (error) {
        console.error('Worker error:', error);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  async processTask(task) {
    const startTime = Date.now();
    let result;

    try {
      switch (task.type) {
        case 'embed':
          result = await this.embed(task.data);
          break;
        case 'search':
          result = await this.search(task.data);
          break;
        case 'analyze':
          result = await this.analyze(task.data);
          break;
      }

      await redis.hset(this.results, task.id, JSON.stringify({
        success: true,
        result,
        processingTime: Date.now() - startTime
      }));

      // Set expiry for results (1 hour)
      await redis.expire(`${this.results}:${task.id}`, 3600);

    } catch (error) {
      await redis.hset(this.results, task.id, JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  }

  async embed(data) {
    return await db.embed(data.text);
  }

  async search(data) {
    return await db.search({
      query: data.query,
      k: data.k || 10
    });
  }

  async analyze(data) {
    // Complex analysis task
    const embedding = await db.embed(data.text);
    const similar = await db.search({ vector: embedding, k: 5 });
    return { embedding: embedding.slice(0, 10), similar };
  }

  stop() {
    this.running = false;
  }
}

// Start worker
const worker = new AITaskWorker();
worker.start();
```

### Pattern 8: BullMQ for Advanced Queuing

```javascript
// bull-ai-queue.js - BullMQ with AI processing
const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis({ maxRetriesPerRequest: null });

// Create queue
const aiQueue = new Queue('ai-processing', { connection });

// Queue scheduler for delayed jobs
const scheduler = new QueueScheduler('ai-processing', { connection });

// Producer: Add jobs
async function submitAIJob(data, options = {}) {
  return await aiQueue.add('ai-task', data, {
    priority: options.priority || 5,
    delay: options.delay || 0,
    attempts: options.attempts || 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 }
  });
}

// Consumer: Process jobs
const aiWorker = new Worker('ai-processing', async (job) => {
  const { type, data } = job.data;

  // Update progress
  await job.updateProgress(0);

  let result;
  switch (type) {
    case 'batch-embed':
      result = await processBatchEmbedding(data, job);
      break;
    case 'semantic-search':
      result = await processSemanticSearch(data);
      break;
    case 'train-model':
      result = await processModelTraining(data, job);
      break;
  }

  await job.updateProgress(100);
  return result;

}, {
  connection,
  concurrency: 5,  // Process 5 jobs in parallel
  limiter: {
    max: 100,      // Max 100 jobs
    duration: 60000  // Per minute
  }
});

// Event handlers
aiWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

aiWorker.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

aiWorker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// Process batch with progress updates
async function processBatchEmbedding(data, job) {
  const { documents } = data;
  const results = [];

  for (let i = 0; i < documents.length; i++) {
    const embedding = await generateEmbedding(documents[i]);
    results.push(embedding);

    await job.updateProgress(Math.floor((i / documents.length) * 100));
  }

  return results;
}
```

## Scheduled AI Tasks

### Pattern 9: Cron-Based AI Processing

```javascript
// scheduled-ai.js - Scheduled AI tasks
const cron = require('node-cron');
const { Ruvector } = require('ruvector');

const db = new Ruvector({ dimensions: 384 });

// Daily model retraining at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily model retraining...');

  try {
    // Collect training data from recent interactions
    const trainingData = await collectTrainingData();

    // Retrain models
    await retrainModels(trainingData);

    // Update index
    await db.rebuildIndex();

    console.log('Daily retraining complete');
  } catch (error) {
    console.error('Retraining failed:', error);
    await sendAlert('Model retraining failed', error);
  }
});

// Hourly index optimization
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly index optimization...');

  const stats = await db.getStats();

  if (stats.fragmentationRatio > 0.3) {
    await db.compactIndex();
    console.log('Index compacted');
  }
});

// Every 5 minutes: process pending items
cron.schedule('*/5 * * * *', async () => {
  const pending = await getPendingItems();

  if (pending.length > 0) {
    console.log(`Processing ${pending.length} pending items`);
    await processPendingItems(pending);
  }
});

// Weekly: full database maintenance
cron.schedule('0 3 * * 0', async () => {
  console.log('Starting weekly maintenance...');

  // Backup
  await db.backup('/backups/weekly');

  // Clean old vectors
  await db.deleteWhere({
    'metadata.createdAt': { $lt: Date.now() - 90 * 24 * 60 * 60 * 1000 }
  });

  // Rebuild index
  await db.rebuildIndex();

  console.log('Weekly maintenance complete');
});
```

### Pattern 10: Event-Driven Scheduled Tasks

```javascript
// event-scheduler.js - Event-driven AI scheduling
const { EventEmitter } = require('events');

class AIScheduler extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.running = new Set();
  }

  schedule(name, config) {
    this.tasks.set(name, {
      ...config,
      lastRun: null,
      nextRun: this.calculateNextRun(config)
    });

    this.emit('task:scheduled', { name, config });
  }

  calculateNextRun(config) {
    if (config.interval) {
      return Date.now() + config.interval;
    }
    if (config.cron) {
      return this.parseCron(config.cron);
    }
    return null;
  }

  async start() {
    setInterval(() => this.tick(), 1000);
    console.log('AI Scheduler started');
  }

  async tick() {
    const now = Date.now();

    for (const [name, task] of this.tasks) {
      if (task.nextRun && task.nextRun <= now && !this.running.has(name)) {
        this.running.add(name);
        this.runTask(name, task);
      }
    }
  }

  async runTask(name, task) {
    this.emit('task:start', { name });

    try {
      const result = await task.handler();

      task.lastRun = Date.now();
      task.nextRun = this.calculateNextRun(task);

      this.emit('task:complete', { name, result });
    } catch (error) {
      this.emit('task:error', { name, error });

      if (task.retryOnError) {
        task.nextRun = Date.now() + (task.retryDelay || 60000);
      }
    } finally {
      this.running.delete(name);
    }
  }
}

// Usage
const scheduler = new AIScheduler();

scheduler.schedule('embedding-refresh', {
  interval: 3600000,  // Every hour
  handler: async () => {
    const stale = await findStaleEmbeddings();
    for (const doc of stale) {
      await refreshEmbedding(doc);
    }
    return { refreshed: stale.length };
  },
  retryOnError: true,
  retryDelay: 300000
});

scheduler.schedule('model-health-check', {
  interval: 300000,  // Every 5 minutes
  handler: async () => {
    const health = await checkModelHealth();
    if (!health.healthy) {
      await alertOps('Model unhealthy', health);
    }
    return health;
  }
});

scheduler.on('task:complete', ({ name, result }) => {
  console.log(`Task ${name} completed:`, result);
});

scheduler.start();
```

## Integration with RuvNet

### Claude-Flow Background Workers

```javascript
// claude-flow-workers.js - Background workers with Claude-Flow
const { WorkerManager } = require('claude-flow/workers');

const workers = new WorkerManager({
  // Worker configuration
  workers: {
    embedding: {
      count: 4,
      handler: 'embedding-worker.js',
      queue: 'embeddings'
    },
    inference: {
      count: 2,
      handler: 'inference-worker.js',
      queue: 'inference'
    },
    training: {
      count: 1,
      handler: 'training-worker.js',
      queue: 'training',
      exclusive: true  // Only one at a time
    }
  },

  // Queue configuration
  queues: {
    embeddings: { priority: 'high', concurrency: 10 },
    inference: { priority: 'medium', concurrency: 5 },
    training: { priority: 'low', concurrency: 1 }
  },

  // Memory integration
  memory: {
    enabled: true,
    namespace: 'workers',
    persistence: true
  }
});

// Submit work
await workers.submit('embedding', {
  documents: [...],
  callback: 'https://api.example.com/webhook/complete'
});

// Monitor workers
workers.on('worker:busy', (worker) => {
  console.log(`Worker ${worker.id} is busy`);
});

workers.on('queue:backlog', (queue, count) => {
  if (count > 100) {
    workers.scale(queue.name, workers.count(queue.name) + 2);
  }
});
```

## Performance Considerations

### Resource Management

```javascript
// worker-resources.js - Resource-aware workers
class ResourceAwareWorker {
  constructor(config) {
    this.maxMemory = config.maxMemory || 1024 * 1024 * 1024;  // 1GB
    this.maxCpu = config.maxCpu || 80;  // 80%
    this.checkInterval = config.checkInterval || 5000;
  }

  async canProcess() {
    const memory = process.memoryUsage();
    const cpu = await this.getCpuUsage();

    return memory.heapUsed < this.maxMemory && cpu < this.maxCpu;
  }

  async processWithBackpressure(task) {
    while (!await this.canProcess()) {
      console.log('Waiting for resources...');
      await new Promise(r => setTimeout(r, this.checkInterval));
    }

    return await this.process(task);
  }
}
```

### Best Practices Summary

| Pattern | Use Case | Pros | Cons |
|---------|----------|------|------|
| Service Worker | Offline AI | Works offline | Limited computation |
| Web Worker | Browser parallelism | Non-blocking UI | No DOM access |
| Worker Thread | Node.js parallelism | Full CPU utilization | Memory overhead |
| Message Queue | Distributed processing | Scalable, persistent | Infrastructure needed |
| Cron Jobs | Scheduled tasks | Simple, reliable | Not real-time |

This guide ensures RuvNet systems can handle AI workloads efficiently without blocking main threads or user interactions.
