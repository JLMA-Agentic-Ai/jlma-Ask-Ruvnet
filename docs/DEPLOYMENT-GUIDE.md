Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:12:59 EST

# RuvNet Ecosystem Deployment Guide

> **Comprehensive deployment documentation for the RuvNet AI ecosystem**
> **Version**: 1.0.0
> **Last Updated**: December 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Docker Deployment](#docker-deployment)
3. [Railway Deployment](#railway-deployment)
4. [Air-Gapped Deployment](#air-gapped-deployment)
5. [Production Checklist](#production-checklist)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The RuvNet ecosystem consists of several interconnected packages that work together to provide AI-powered vector search, LLM orchestration, and agent coordination:

| Package | Purpose | Deployment Considerations |
|---------|---------|---------------------------|
| `ruvector` | Vector database with HNSW indexing | Native bindings, WASM fallback |
| `@ruvector/ruvllm` | Self-learning LLM orchestration | SONA engine, FastGRNN router |
| `agentic-flow` | 150+ AI agents, 213 MCP tools | ReasoningBank memory |
| `claude-flow` | Enterprise orchestration | AgentDB, hive-mind coordination |
| `@ruvector/postgres-cli` | PostgreSQL vector extension | Docker or native installation |

### Deployment Platform Comparison

| Platform | Native Modules | Persistent Storage | GPU Support | Best For |
|----------|---------------|-------------------|-------------|----------|
| **Docker** | Full support | Volumes | nvidia-docker | Enterprise/Self-hosted |
| **Railway** | Full support | Volumes | Limited | Full-stack apps |
| **Kubernetes** | Full support | PVCs | GPU nodes | Large-scale production |
| **Air-gapped** | Full support | Local storage | Full | Secure environments |

---

## Docker Deployment

### Quick Start

```bash
# Pull the RuVector PostgreSQL image
docker pull ruvnet/ruvector-postgres:latest

# Run with persistent storage
docker run -d --name ruvector-pg \
  -e POSTGRES_USER=ruvector \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=ruvector \
  -p 5432:5432 \
  -v ruvector_data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest
```

### Full Application docker-compose.yml

```yaml
version: '3.8'

services:
  # RuVector PostgreSQL with vector extensions
  ruvector-postgres:
    image: ruvnet/ruvector-postgres:latest
    container_name: ruvector-pg
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-ruvector}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secret}
      POSTGRES_DB: ${POSTGRES_DB:-ruvector}
      # Performance tuning
      POSTGRES_SHARED_BUFFERS: 256MB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 768MB
      POSTGRES_WORK_MEM: 64MB
    ports:
      - "5432:5432"
    volumes:
      - ruvector_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-ruvector} -d ${POSTGRES_DB:-ruvector}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    networks:
      - ruvnet-network

  # Application server
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ruvnet-app
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER:-ruvector}:${POSTGRES_PASSWORD:-secret}@ruvector-postgres:5432/${POSTGRES_DB:-ruvector}
      # API Keys (mount via secrets in production)
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:-}
    ports:
      - "3000:3000"
    volumes:
      # Persistent memory and knowledge bases
      - swarm_data:/app/.swarm
      - ruvector_kb:/app/.ruvector
      - hive_mind:/app/.hive-mind
    depends_on:
      ruvector-postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
    networks:
      - ruvnet-network

  # Redis for caching and session management (optional)
  redis:
    image: redis:7-alpine
    container_name: ruvnet-redis
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - ruvnet-network

networks:
  ruvnet-network:
    driver: bridge

volumes:
  ruvector_data:
    driver: local
  swarm_data:
    driver: local
  ruvector_kb:
    driver: local
  hive_mind:
    driver: local
  redis_data:
    driver: local
```

### Production-Ready Dockerfile

```dockerfile
# Multi-stage build for RuvNet applications
# Stage 1: Build native modules
FROM node:22-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:22-bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

WORKDIR /app

# Copy only production node_modules from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Create persistent data directories
RUN mkdir -p .swarm .ruvector .hive-mind && \
    chown -R nodejs:nodejs .swarm .ruvector .hive-mind

# Switch to non-root user
USER nodejs

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
```

### Docker Volume Management

```bash
# Create named volumes for persistent storage
docker volume create ruvector_data
docker volume create swarm_data
docker volume create ruvector_kb

# Backup volumes
docker run --rm \
  -v ruvector_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/ruvector-data-$(date +%Y%m%d).tar.gz -C /data .

# Restore volumes
docker run --rm \
  -v ruvector_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/ruvector-data-20251229.tar.gz -C /data

# Inspect volume usage
docker system df -v
```

### Docker Health Checks

```yaml
# Enhanced health check configuration
services:
  ruvector-postgres:
    healthcheck:
      test: |
        pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB} && \
        psql -U $${POSTGRES_USER} -d $${POSTGRES_DB} -c "SELECT extversion FROM pg_extension WHERE extname = 'ruvector';" | grep -q "0.2"
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  app:
    healthcheck:
      test: |
        curl -sf http://localhost:3000/health && \
        curl -sf http://localhost:3000/api/v1/status | grep -q '"healthy":true'
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

### Multi-Container Setup with Observability

```yaml
version: '3.8'

services:
  # Core services (from above)
  ruvector-postgres:
    # ... (as defined above)

  app:
    # ... (as defined above)

  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: otel-collector
    command: ['--config=/etc/otel-collector-config.yaml']
    volumes:
      - ./config/otel-collector-config.yaml:/etc/otel-collector-config.yaml:ro
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Prometheus metrics
      - "13133:13133" # Health check
    networks:
      - ruvnet-network

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - ruvnet-network

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_USERS_ALLOW_SIGN_UP: false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./config/grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - ruvnet-network

  # Jaeger for distributed tracing
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    environment:
      COLLECTOR_OTLP_ENABLED: true
    ports:
      - "16686:16686" # Jaeger UI
      - "14268:14268" # Jaeger HTTP
    networks:
      - ruvnet-network

volumes:
  prometheus_data:
  grafana_data:
```

---

## Railway Deployment

### railway.toml Configuration

```toml
[build]
# Use npm install for alpha package compatibility
installCommand = "npm install --legacy-peer-deps"
buildCommand = "npm run build"

[deploy]
# Start command
startCommand = "bash scripts/deployment/start-railway.sh"
# Health check path
healthcheckPath = "/health"
healthcheckTimeout = 300
# Restart policy
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

### railway.json Configuration

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml Configuration

```toml
[phases.setup]
nixPkgs = ["nodejs-22_x", "python3", "ffmpeg", "gnumake", "gcc"]

# Use npm install for alpha package compatibility
[phases.install]
cmds = ["npm install --legacy-peer-deps"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### Railway Volume Setup

```bash
# Create persistent volumes via Railway CLI
railway volume create --name swarm-memory --mount /app/.swarm
railway volume create --name ruvector-data --mount /app/.ruvector
railway volume create --name hive-mind --mount /app/.hive-mind

# Link volumes to service
railway link
railway volume attach swarm-memory
railway volume attach ruvector-data
railway volume attach hive-mind
```

### Railway Environment Variables

```bash
# Required environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=postgresql://...

# API Keys (sensitive - use Railway's encrypted variables)
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set OPENAI_API_KEY=sk-...
railway variables set OPENROUTER_API_KEY=sk-or-v1-...

# Application configuration
railway variables set PORT=3000
railway variables set LOG_LEVEL=info

# Memory and knowledge base paths
railway variables set SWARM_DB_PATH=/app/.swarm/memory.db
railway variables set RUVECTOR_DATA_PATH=/app/.ruvector
```

### Railway Scaling Options

```bash
# Scale compute resources
railway service update --memory 2048  # 2GB RAM
railway service update --cpu 2        # 2 vCPU

# Enable auto-scaling
railway service update --min-replicas 1 --max-replicas 5

# Configure scaling triggers
railway service update \
  --scale-to-zero false \
  --scale-up-threshold 70 \
  --scale-down-threshold 30
```

### Railway Startup Script

```bash
#!/bin/bash
# scripts/deployment/start-railway.sh

set -e

DB_PATH="${SWARM_DB_PATH:-/app/.swarm/memory.db}"
INGEST_SCRIPT="scripts/ingestion/ingest_correct.js"

echo "Starting RuvNet application on Railway..."

# Check for latest package versions on deploy
echo "Checking for package updates..."
node scripts/ingestion/check_repo_versions.js 2>/dev/null || echo "Version check skipped"

# Verify knowledge base
if [ -f "FORCE_REBUILD" ]; then
  echo "FORCE_REBUILD detected, removing existing database..."
  rm -f "$DB_PATH"
fi

if [ ! -f "$DB_PATH" ]; then
  echo "Knowledge base not found, initiating rebuild..."

  # Fetch latest repository content if gh is available
  if command -v gh &> /dev/null; then
    echo "Fetching latest repository content..."
    node scripts/ingestion/fetch_repos_gh.js || echo "Repo fetch failed, using cached knowledge"
  fi

  # Run ingestion
  echo "Building knowledge base..."
  node $INGEST_SCRIPT

  if [ $? -eq 0 ]; then
    echo "Knowledge base rebuilt successfully"
  else
    echo "Knowledge base rebuild failed, starting with limited functionality"
  fi
else
  echo "Knowledge base found: $(du -h $DB_PATH | cut -f1)"
fi

# Start the application
echo "Starting Node.js server..."
exec node src/server/app.js
```

---

## Air-Gapped Deployment

### Overview

Air-gapped deployments are essential for secure environments where external network access is prohibited. The RuvNet ecosystem supports full offline operation using local LLMs.

### Option 1: Ollama + Qwen Integration

#### Install Ollama

```bash
# Linux/macOS (online machine)
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

#### Pre-download Models for Air-Gap Transfer

```bash
# On internet-connected machine, pull required models
ollama pull qwen2.5:7b      # 7B params - General use
ollama pull qwen2.5:14b     # 14B params - Complex tasks
ollama pull qwen2.5-coder:7b # Code-specialized

# Export models for transfer
tar -czf ollama-models.tar.gz ~/.ollama/models/

# Transfer to air-gapped network (USB, secure network transfer, etc.)
# On air-gapped machine:
tar -xzf ollama-models.tar.gz -C ~/.ollama/
```

#### Offline docker-compose.yml

```yaml
version: '3.8'

services:
  # Ollama for local LLM inference
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    volumes:
      - ollama_models:/root/.ollama
      - ./models:/models:ro  # Pre-downloaded models
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_HOST=0.0.0.0
    # GPU support (if available)
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped
    networks:
      - airgap-network

  # RuVector PostgreSQL
  ruvector-postgres:
    image: ruvnet/ruvector-postgres:latest
    container_name: ruvector-pg
    environment:
      POSTGRES_USER: ruvector
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-airgap-secure-password}
      POSTGRES_DB: ruvector
    volumes:
      - ruvector_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ruvector -d ruvector"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - airgap-network

  # Application with local LLM configuration
  app:
    build:
      context: .
      dockerfile: Dockerfile.airgap
    container_name: ruvnet-airgap
    environment:
      NODE_ENV: production
      # Local Ollama endpoint (no external APIs)
      OLLAMA_HOST: http://ollama:11434
      LLM_PROVIDER: ollama
      LLM_MODEL: qwen2.5:7b
      # Database connection
      DATABASE_URL: postgresql://ruvector:${POSTGRES_PASSWORD:-airgap-secure-password}@ruvector-postgres:5432/ruvector
      # Disable external API calls
      DISABLE_EXTERNAL_APIS: true
      DISABLE_TELEMETRY: true
    volumes:
      - swarm_data:/app/.swarm
      - ruvector_kb:/app/.ruvector
    depends_on:
      ollama:
        condition: service_started
      ruvector-postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - airgap-network

networks:
  airgap-network:
    driver: bridge
    internal: true  # No external network access

volumes:
  ollama_models:
  ruvector_data:
  swarm_data:
  ruvector_kb:
```

#### Local LLM Configuration

```javascript
// config/llm-local.js
const { ModelRouter } = require('agentic-flow/router');

const router = new ModelRouter({
  providers: {
    ollama: {
      baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
      models: ['qwen2.5:7b', 'qwen2.5:14b', 'qwen2.5-coder:7b'],
      defaultModel: 'qwen2.5:7b'
    }
  },
  defaultProvider: 'ollama',
  // Disable external providers
  enabledProviders: ['ollama']
});

module.exports = { router };
```

### Option 2: ONNX Local Inference

For CPU-only environments without GPU access:

```javascript
// Use ONNX Runtime for fully offline inference
// Included in agentic-flow package

const { ONNXInference } = require('agentic-flow/onnx');

const inference = new ONNXInference({
  modelPath: './models/phi-4-onnx',
  executionProvider: 'cpu'  // or 'cuda' for GPU
});

// Performance: ~6 tokens/sec (CPU), 60-300 tokens/sec (GPU)
const response = await inference.generate('Your prompt here');
```

### Hardware Requirements

| Model | Parameters | RAM Required | VRAM (GPU) | Use Case |
|-------|-----------|--------------|------------|----------|
| qwen2.5:3b | 3B | 8GB | 4GB | Laptops, basic tasks |
| qwen2.5:7b | 7B | 16GB | 8GB | Workstations, general use |
| qwen2.5:14b | 14B | 32GB | 16GB | Servers, complex tasks |
| qwen2.5:32b | 32B | 64GB | 24GB | GPU servers |
| qwen2.5:72b | 72B | 128GB | 80GB | Enterprise clusters |
| ONNX Phi-4 | 14B | 32GB | N/A | CPU-only environments |

### Air-Gap Security Considerations

```yaml
# security-hardening.yml
security:
  network:
    # No external egress
    block_external: true
    allowed_internal_only:
      - ruvector-postgres
      - ollama
      - app

  data:
    # Encrypt data at rest
    encrypt_volumes: true
    encryption_key_source: "hardware-security-module"

  access:
    # Authentication required for all endpoints
    require_auth: true
    auth_method: "mTLS"

  audit:
    # Log all queries for compliance
    enable_query_logging: true
    log_retention_days: 365

  telemetry:
    # Disable all telemetry
    disable_telemetry: true
    disable_analytics: true
```

---

## Production Checklist

### Pre-Deployment

- [ ] **Environment Variables**: All secrets configured via secure secrets manager
- [ ] **Database**: PostgreSQL with RuVector extension installed and tested
- [ ] **Volumes**: Persistent storage configured for `.swarm/`, `.ruvector/`, `.hive-mind/`
- [ ] **Health Checks**: Endpoints returning 200 OK
- [ ] **Logging**: Structured logging configured with appropriate levels
- [ ] **Monitoring**: Prometheus metrics endpoints exposed

### Security Hardening

```yaml
# security-checklist.yml
security:
  secrets:
    - name: "API Keys"
      check: "No API keys in environment files or code"
      severity: critical

    - name: "Database Credentials"
      check: "Using secrets manager, not environment variables"
      severity: critical

    - name: "TLS/SSL"
      check: "All endpoints using HTTPS"
      severity: high

  container:
    - name: "Non-root User"
      check: "Container runs as non-root user"
      severity: high

    - name: "Read-only Filesystem"
      check: "Root filesystem is read-only"
      severity: medium

    - name: "Resource Limits"
      check: "Memory and CPU limits configured"
      severity: medium

  network:
    - name: "Network Policies"
      check: "Ingress/egress rules defined"
      severity: high

    - name: "Internal Only"
      check: "Database not exposed externally"
      severity: critical
```

### Performance Tuning

```yaml
# PostgreSQL performance settings
postgresql:
  shared_buffers: "25% of RAM"  # e.g., 256MB for 1GB RAM
  effective_cache_size: "75% of RAM"  # e.g., 768MB for 1GB RAM
  work_mem: "64MB"
  maintenance_work_mem: "512MB"
  max_connections: 100

  # Vector search optimization
  hnsw:
    ef_search: 64
    m: 16
    ef_construction: 100

  ivfflat:
    lists: 100
    probes: 10
```

```yaml
# Node.js performance settings
nodejs:
  node_options:
    - "--max-old-space-size=4096"  # 4GB heap
    - "--gc-interval=100"

  clustering:
    workers: "CPU_COUNT"

  connection_pooling:
    max_connections: 10
    idle_timeout_ms: 30000
```

### Backup Strategies

```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec ruvector-pg pg_dump -U ruvector -d ruvector \
  --format=custom \
  --file=/tmp/backup.dump

docker cp ruvector-pg:/tmp/backup.dump \
  ${BACKUP_DIR}/postgres_${DATE}.dump

# Backup application data volumes
echo "Backing up application data..."
docker run --rm \
  -v swarm_data:/data/swarm:ro \
  -v ruvector_kb:/data/ruvector:ro \
  -v ${BACKUP_DIR}:/backup \
  alpine tar czf /backup/app_data_${DATE}.tar.gz -C /data .

# Cleanup old backups (keep last 7 days)
find ${BACKUP_DIR} -name "*.dump" -mtime +7 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete

echo "Backup complete: ${BACKUP_DIR}/*_${DATE}.*"
```

```bash
#!/bin/bash
# scripts/restore.sh

set -e

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: restore.sh YYYYMMDD_HHMMSS"
  exit 1
fi

BACKUP_DIR="/backups"

# Restore PostgreSQL
echo "Restoring PostgreSQL from ${BACKUP_DATE}..."
docker cp ${BACKUP_DIR}/postgres_${BACKUP_DATE}.dump \
  ruvector-pg:/tmp/backup.dump

docker exec ruvector-pg pg_restore -U ruvector -d ruvector \
  --clean --if-exists \
  /tmp/backup.dump

# Restore application data
echo "Restoring application data..."
docker-compose stop app

docker run --rm \
  -v swarm_data:/data/swarm \
  -v ruvector_kb:/data/ruvector \
  -v ${BACKUP_DIR}:/backup:ro \
  alpine tar xzf /backup/app_data_${BACKUP_DATE}.tar.gz -C /data

docker-compose start app

echo "Restore complete"
```

### Disaster Recovery

```yaml
# disaster-recovery.yml
recovery:
  rpo: "1 hour"  # Recovery Point Objective
  rto: "15 minutes"  # Recovery Time Objective

  procedures:
    database_corruption:
      steps:
        - "Stop application services"
        - "Restore PostgreSQL from latest backup"
        - "Verify data integrity with checksums"
        - "Start application services"
        - "Run health checks"

    volume_loss:
      steps:
        - "Create new volumes"
        - "Restore from backup"
        - "Update volume mounts"
        - "Restart services"

    full_recovery:
      steps:
        - "Provision new infrastructure"
        - "Deploy Docker stack"
        - "Restore PostgreSQL"
        - "Restore application volumes"
        - "Verify all health checks"
        - "Update DNS/load balancer"
```

---

## Monitoring and Observability

### Prometheus Configuration

```yaml
# config/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ruvnet-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['ruvector-postgres:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/rules/*.yml'
```

### Alert Rules

```yaml
# config/prometheus/rules/ruvnet-alerts.yml
groups:
  - name: ruvnet
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseConnectionFailure
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL connection failed"

      - alert: VectorSearchLatency
        expr: histogram_quantile(0.99, rate(vector_search_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Vector search p99 latency above 500ms"

      - alert: MemoryUsageHigh
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container memory usage above 85%"
```

### OpenTelemetry Collector Configuration

```yaml
# config/otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1000

  resource:
    attributes:
      - key: service.name
        value: ruvnet
        action: upsert
      - key: deployment.environment
        from_attribute: env
        action: insert

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: ruvnet

  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [jaeger, logging]

    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [prometheus, logging]
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "RuvNet Ecosystem Overview",
    "panels": [
      {
        "title": "Vector Search Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, rate(vector_search_duration_seconds_bucket[5m]))",
            "legendFormat": "p99"
          },
          {
            "expr": "histogram_quantile(0.50, rate(vector_search_duration_seconds_bucket[5m]))",
            "legendFormat": "p50"
          }
        ]
      },
      {
        "title": "Queries Per Second",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(vector_search_total[1m])"
          }
        ]
      },
      {
        "title": "PostgreSQL Connections",
        "type": "gauge",
        "targets": [
          {
            "expr": "pg_stat_activity_count{state='active'}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{name=~'ruvnet.*'}"
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting

### Common Issues

#### Native Module Errors

```bash
# Problem: Error: Cannot find module '@ruvector/core'
# Solution: Force rebuild native modules

docker-compose exec app npm rebuild
docker-compose restart app

# Or use WASM fallback
docker-compose exec app npm install ruvector/wasm
```

#### PostgreSQL Extension Not Found

```sql
-- Problem: extension "ruvector" does not exist
-- Solution: Install extension

CREATE EXTENSION IF NOT EXISTS ruvector CASCADE;

-- Verify installation
SELECT extversion FROM pg_extension WHERE extname = 'ruvector';
```

#### Memory Issues

```bash
# Problem: Out of memory with large vector collections
# Solution: Increase container memory limits

docker-compose down
docker-compose up -d --scale app=1 --memory 4g

# Or use quantization for memory reduction
# Binary: 32x compression
# Scalar: 4x compression
```

#### Ollama Connection Refused (Air-Gap)

```bash
# Problem: ECONNREFUSED 127.0.0.1:11434
# Solution: Start Ollama server

ollama serve

# Check if running
curl http://localhost:11434/api/tags

# In Docker, ensure network connectivity
docker-compose exec app curl http://ollama:11434/api/tags
```

### Debug Commands

```bash
# Check container logs
docker-compose logs -f app
docker-compose logs -f ruvector-postgres

# Inspect container health
docker inspect --format='{{json .State.Health}}' ruvector-pg | jq

# Test database connection
docker-compose exec app node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(console.error);
"

# Check vector extension
docker-compose exec ruvector-postgres psql -U ruvector -c "SELECT ruvector_version();"

# Test vector search
docker-compose exec ruvector-postgres psql -U ruvector -c "
  SELECT * FROM ruvector_test_search('[0.1, 0.2, 0.3]'::real[], 10);
"
```

### Log Analysis

```bash
# Search for errors
docker-compose logs app 2>&1 | grep -i error

# Monitor real-time with filtering
docker-compose logs -f app | grep -E '(ERROR|WARN|error|warn)'

# Export logs for analysis
docker-compose logs --no-color > logs.txt
```

---

## References

- [RuVector Documentation](https://github.com/ruvnet/ruvector)
- [Agentic Flow Documentation](https://github.com/ruvnet/agentic-flow)
- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [Railway Node.js Guide](https://docs.railway.app/guides/nodejs)
- [Ollama Documentation](https://ollama.com/docs)
- [Docker Node.js Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

*Documentation generated for RuvNet Ecosystem v1.7.15*
*Last Updated: December 2025*
