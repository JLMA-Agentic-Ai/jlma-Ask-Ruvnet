Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:03:59 EST

# Configuration Best Practices Guide

## Overview

Comprehensive configuration guide for the RuvLLM + RuVector + Agentic-Flow stack, covering environment setup, optimization patterns, deployment configurations, and production best practices.

## Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION PRECEDENCE                          │
│                                                                      │
│  Highest Priority                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  1. Command Line Arguments                                  │    │
│  │     --port=3000 --model=qwen3:8b                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  2. Environment Variables                                   │    │
│  │     RUVLLM_PROVIDER=ollama PORT=3000                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  3. Environment-Specific Config Files                       │    │
│  │     .env.production, .env.development                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  4. Default Config Files                                    │    │
│  │     config/ruvllm.config.js, .env                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  5. Built-in Defaults                                       │    │
│  │     Hardcoded sensible defaults                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│  Lowest Priority                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Development Environment

```bash
# .env.development
NODE_ENV=development

# Ollama - Local development
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b          # Smaller model for faster iteration
OLLAMA_EMBEDDING_MODEL=nomic-embed-text:latest

# RuVector - Development settings
RUVECTOR_KB_PATH=.ruvector/dev-knowledge-base
RUVECTOR_DIMENSIONS=128
RUVECTOR_PERSISTENCE=true
RUVECTOR_WAL_ENABLED=false     # Disable WAL for faster writes

# Memory - Smaller footprint
CLAUDE_FLOW_DB_PATH=.swarm/dev-memory.db
MEMORY_NAMESPACE=dev

# Server
PORT=3000
LOG_LEVEL=debug
ENABLE_CORS=true
CORS_ORIGIN=*

# Performance - Relaxed for development
REQUEST_TIMEOUT=60000
MAX_CONCURRENT_REQUESTS=10
CACHE_ENABLED=false
```

### Production Environment

```bash
# .env.production
NODE_ENV=production

# Ollama - Production cluster
OLLAMA_BASE_URL=http://ollama.internal:11434
OLLAMA_MODEL=qwen3:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text:latest
OLLAMA_TIMEOUT=120000
OLLAMA_KEEP_ALIVE=5m

# RuVector - Production settings
RUVECTOR_KB_PATH=/data/ruvector/knowledge-base
RUVECTOR_DIMENSIONS=128
RUVECTOR_DISTANCE_METRIC=Cosine
RUVECTOR_PERSISTENCE=true
RUVECTOR_WAL_ENABLED=true
RUVECTOR_AUTO_SAVE_INTERVAL=60000
RUVECTOR_BACKUP_ENABLED=true
RUVECTOR_BACKUP_INTERVAL=21600000  # 6 hours

# Memory - Production database
CLAUDE_FLOW_DB_PATH=/data/swarm/memory.db
MEMORY_NAMESPACE=production
ENABLE_PERSISTENT_MEMORY=true

# Server
PORT=3000
LOG_LEVEL=info
ENABLE_CORS=true
CORS_ORIGIN=https://app.ruvnet.com

# Security
ENCRYPTION_KEY=           # Set via secrets manager
JWT_SECRET=               # Set via secrets manager
API_KEY_REQUIRED=true

# Performance
REQUEST_TIMEOUT=30000
MAX_CONCURRENT_REQUESTS=100
CACHE_ENABLED=true
CACHE_TTL=300000

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
TRACING_ENABLED=true
TRACING_SAMPLE_RATE=0.1
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging

# Mirrors production but with more logging
OLLAMA_BASE_URL=http://ollama-staging.internal:11434
OLLAMA_MODEL=qwen3:8b
LOG_LEVEL=debug
TRACING_SAMPLE_RATE=1.0
CACHE_ENABLED=true
CACHE_TTL=60000             # Shorter TTL for testing
```

## Component Configurations

### Complete RuvLLM Configuration

```javascript
// config/ruvllm.config.js
require('dotenv').config();

module.exports = {
  // Provider selection
  provider: process.env.RUVLLM_PROVIDER || 'ollama',

  // Ollama configuration
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'qwen3:8b',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text:latest',

    // Model generation options
    options: {
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7,
      top_p: parseFloat(process.env.OLLAMA_TOP_P) || 0.9,
      top_k: parseInt(process.env.OLLAMA_TOP_K) || 40,
      num_ctx: parseInt(process.env.OLLAMA_CONTEXT_SIZE) || 8192,
      num_predict: parseInt(process.env.OLLAMA_MAX_TOKENS) || 2048,
      repeat_penalty: parseFloat(process.env.OLLAMA_REPEAT_PENALTY) || 1.1,
      seed: process.env.OLLAMA_SEED ? parseInt(process.env.OLLAMA_SEED) : undefined
    },

    // Connection settings
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 120000,
    keepAlive: process.env.OLLAMA_KEEP_ALIVE || '5m',
    stream: process.env.OLLAMA_STREAM !== 'false',

    // Retry configuration
    retry: {
      maxRetries: parseInt(process.env.OLLAMA_MAX_RETRIES) || 3,
      initialDelay: parseInt(process.env.OLLAMA_RETRY_DELAY) || 1000,
      maxDelay: parseInt(process.env.OLLAMA_MAX_RETRY_DELAY) || 10000,
      backoffMultiplier: parseFloat(process.env.OLLAMA_BACKOFF_MULTIPLIER) || 2
    }
  },

  // Fallback providers
  fallback: {
    enabled: process.env.FALLBACK_ENABLED === 'true',
    provider: process.env.RUVLLM_FALLBACK_PROVIDER || 'groq',

    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      maxTokens: parseInt(process.env.GROQ_MAX_TOKENS) || 4096
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096
    }
  },

  // RuVector integration
  ruvector: {
    knowledgeBasePath: process.env.RUVECTOR_KB_PATH || '.ruvector/knowledge-base',
    dimensions: parseInt(process.env.RUVECTOR_DIMENSIONS) || 128,
    distanceMetric: process.env.RUVECTOR_DISTANCE_METRIC || 'Cosine',
    persistence: process.env.RUVECTOR_PERSISTENCE !== 'false',
    walEnabled: process.env.RUVECTOR_WAL_ENABLED !== 'false',

    // HNSW index settings
    hnsw: {
      M: parseInt(process.env.HNSW_M) || 16,
      efConstruction: parseInt(process.env.HNSW_EF_CONSTRUCTION) || 200,
      efSearch: parseInt(process.env.HNSW_EF_SEARCH) || 100
    },

    // Backup settings
    backup: {
      enabled: process.env.RUVECTOR_BACKUP_ENABLED === 'true',
      path: process.env.RUVECTOR_BACKUP_PATH || '.ruvector/backups',
      interval: parseInt(process.env.RUVECTOR_BACKUP_INTERVAL) || 21600000,
      retention: parseInt(process.env.RUVECTOR_BACKUP_RETENTION) || 7
    }
  },

  // Memory and persistence
  memory: {
    enabled: process.env.ENABLE_PERSISTENT_MEMORY !== 'false',
    namespace: process.env.MEMORY_NAMESPACE || 'ruvnet-integration',
    dbPath: process.env.CLAUDE_FLOW_DB_PATH || '.swarm/memory.db',

    // Tiered storage
    tiered: {
      hot: {
        maxAge: parseInt(process.env.MEMORY_HOT_MAX_AGE) || 3600000,
        compression: 'none'
      },
      warm: {
        maxAge: parseInt(process.env.MEMORY_WARM_MAX_AGE) || 86400000,
        compression: 'lz4'
      },
      cold: {
        maxAge: Infinity,
        compression: 'zstd'
      }
    }
  },

  // RAG configuration
  rag: {
    enabled: process.env.RAG_ENABLED !== 'false',
    topK: parseInt(process.env.RAG_TOP_K) || 10,
    minSimilarity: parseFloat(process.env.RAG_MIN_SIMILARITY) || 0.5,
    reranking: process.env.RAG_RERANKING !== 'false',
    contextWindow: parseInt(process.env.RAG_CONTEXT_WINDOW) || 8000,

    // Prompt template
    promptTemplate: process.env.RAG_PROMPT_TEMPLATE || `You are an expert assistant.
Use the following context to answer the question accurately.

Context:
{context}

Question: {question}

Answer based on the context provided. If the information isn't available, say so.`
  },

  // Caching
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL) || 300000,
    maxSize: process.env.CACHE_MAX_SIZE || '512mb'
  }
};
```

### Complete Server Configuration

```javascript
// config/server.config.js
require('dotenv').config();

module.exports = {
  // Server basics
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',

  // CORS
  cors: {
    enabled: process.env.ENABLE_CORS !== 'false',
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: 'Too many requests, please try again later'
  },

  // Request handling
  request: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    maxBodySize: process.env.MAX_BODY_SIZE || '10mb',
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      path: process.env.LOG_FILE_PATH || './logs/app.log',
      maxSize: process.env.LOG_MAX_SIZE || '100m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10
    }
  },

  // Health checks
  health: {
    enabled: true,
    path: '/health',
    detailed: process.env.HEALTH_DETAILED === 'true'
  },

  // Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
    port: parseInt(process.env.METRICS_PORT) || 9090,
    path: '/metrics'
  },

  // Tracing
  tracing: {
    enabled: process.env.TRACING_ENABLED === 'true',
    serviceName: process.env.TRACING_SERVICE_NAME || 'ruvnet-api',
    sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE) || 0.1,
    exporter: process.env.TRACING_EXPORTER || 'otlp',
    endpoint: process.env.TRACING_ENDPOINT
  },

  // Security
  security: {
    apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
    jwtEnabled: process.env.JWT_ENABLED === 'true',
    helmet: {
      enabled: process.env.HELMET_ENABLED !== 'false'
    }
  }
};
```

## Docker Configuration

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
      - "9090:9090"
    environment:
      - NODE_ENV=production
      - OLLAMA_BASE_URL=http://ollama:11434
      - RUVECTOR_KB_PATH=/data/ruvector/knowledge-base
      - CLAUDE_FLOW_DB_PATH=/data/swarm/memory.db
    volumes:
      - ruvector-data:/data/ruvector
      - swarm-data:/data/swarm
    depends_on:
      ollama:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_KEEP_ALIVE=5m
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 16G
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  ruvector-data:
  swarm-data:
  ollama-models:
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app .

# Create data directories
RUN mkdir -p /data/ruvector /data/swarm && \
    chown -R nodejs:nodejs /data

USER nodejs

EXPOSE 3000 9090

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/server/app.js"]
```

## Kubernetes Configuration

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ruvnet-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ruvnet-api
  template:
    metadata:
      labels:
        app: ruvnet-api
    spec:
      containers:
        - name: api
          image: ruvnet/api:latest
          ports:
            - containerPort: 3000
            - containerPort: 9090
          envFrom:
            - configMapRef:
                name: ruvnet-config
            - secretRef:
                name: ruvnet-secrets
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: ruvnet-pvc
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ruvnet-config
data:
  NODE_ENV: production
  OLLAMA_BASE_URL: http://ollama-service:11434
  RUVECTOR_KB_PATH: /data/ruvector/knowledge-base
  LOG_LEVEL: info
  METRICS_ENABLED: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: ruvnet-secrets
type: Opaque
stringData:
  ENCRYPTION_KEY: "${ENCRYPTION_KEY}"
  JWT_SECRET: "${JWT_SECRET}"
```

## Configuration Validation

```javascript
// config/validator.js
const Joi = require('joi');

const configSchema = Joi.object({
  provider: Joi.string().valid('ollama', 'groq', 'openai').required(),

  ollama: Joi.object({
    baseUrl: Joi.string().uri().required(),
    model: Joi.string().required(),
    embeddingModel: Joi.string().required(),
    timeout: Joi.number().min(1000).max(600000),
    options: Joi.object({
      temperature: Joi.number().min(0).max(2),
      top_p: Joi.number().min(0).max(1),
      num_ctx: Joi.number().min(512).max(128000)
    })
  }).required(),

  ruvector: Joi.object({
    knowledgeBasePath: Joi.string().required(),
    dimensions: Joi.number().valid(64, 128, 256, 384, 512, 768, 1024, 1536).required(),
    distanceMetric: Joi.string().valid('Cosine', 'Euclidean', 'DotProduct').required()
  }).required(),

  rag: Joi.object({
    topK: Joi.number().min(1).max(100),
    minSimilarity: Joi.number().min(0).max(1)
  })
});

function validateConfig(config) {
  const { error, value } = configSchema.validate(config, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    throw new Error(`Configuration validation failed: ${messages}`);
  }

  return value;
}

module.exports = { validateConfig };
```

## Best Practices Summary

1. **Use environment-specific configs** - Separate dev/staging/production
2. **Never commit secrets** - Use environment variables or secrets managers
3. **Validate configuration** - Check on startup, fail fast
4. **Document all options** - Include defaults and valid values
5. **Use sensible defaults** - Work out-of-box for development
6. **Layer configurations** - Allow overrides at multiple levels
7. **Version your configs** - Track changes in version control
8. **Test configuration changes** - Validate before deploying
9. **Monitor config drift** - Detect unauthorized changes
10. **Automate config deployment** - Use infrastructure as code

## Related Documentation

- [API Reference](./API_INTEGRATION_REFERENCE.md)
- [Error Handling](./ERROR_HANDLING_RECOVERY.md)
- [Monitoring Guide](./MONITORING_OBSERVABILITY.md)
- [Security Guide](./SECURITY_ACCESS_CONTROL.md)
- [Scalability Guide](./SCALABILITY_LOAD_BALANCING.md)
