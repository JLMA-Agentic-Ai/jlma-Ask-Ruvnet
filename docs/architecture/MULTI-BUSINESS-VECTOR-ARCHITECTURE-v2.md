Updated: 2025-12-29 17:45:00 EST | Version 2.0.0
Created: 2025-12-29 17:45:00 EST

# Multi-Business Vector Database Architecture v2

## Executive Summary

This document defines the CORRECT architecture for multi-business knowledge base management that satisfies:

1. **Independent Production Deployments** - Each business can be forked to its own Railway/Supabase Postgres
2. **Shared Utility Access** - All businesses can query RuvNet tools knowledge base
3. **Clean Local Development** - Convenient development with all businesses accessible
4. **Easy Forking Path** - Minimal effort to move local business to production

---

## Architecture Decision: Federated Multi-Container with API Gateway

### Why NOT Single Container (Option A from previous discussion)?

The single-container approach has a fatal flaw:

```
PROBLEM: If all businesses share one PostgreSQL container...
- How do you "fork" retirewell to Railway?
- You'd need to EXTRACT schema + data (messy)
- Production deployments become nightmares
- No clean isolation boundary
```

### The Correct Architecture

```
+------------------------------------------------------------------+
|                        LOCAL DEVELOPMENT                          |
+------------------------------------------------------------------+
|                                                                    |
|  +-----------------------+     +-----------------------+          |
|  | UTILITIES CONTAINER   |     | UTILITIES API         |          |
|  | (PostgreSQL/pgvector) |<--->| :5100/api/utilities   |          |
|  +-----------------------+     +-----------------------+          |
|           |                            ^                          |
|           | (RuvNet Tools KB)          | (READ-ONLY)              |
|           | 2,152 vectors              |                          |
|           v                            |                          |
|  +------------------------------------+|                          |
|  | Shared via API - Never duplicated ||                          |
|  +------------------------------------+|                          |
|                                        |                          |
|  +----------------+  +----------------+|  +----------------+      |
|  | RETIREWELL     |  | PRESENTERMODE  ||  | FUTURE-BIZ     |      |
|  | CONTAINER      |  | CONTAINER      ||  | CONTAINER      |      |
|  | (PostgreSQL)   |  | (PostgreSQL)   ||  | (PostgreSQL)   |      |
|  | :5432          |  | :5433          ||  | :5434          |      |
|  +-------+--------+  +-------+--------+|  +-------+--------+      |
|          |                   |         |          |               |
|          v                   v         |          v               |
|  +----------------+  +----------------+|  +----------------+      |
|  | API :5101      |  | API :5102      ||  | API :5103      |      |
|  +----------------+  +----------------+|  +----------------+      |
|          |                   |---------+          |               |
|          +-------------------+--------------------+               |
|                              |                                    |
|                              v                                    |
|                    +------------------+                           |
|                    | API GATEWAY      |                           |
|                    | :5000            |                           |
|                    | Routes queries   |                           |
|                    +------------------+                           |
|                              ^                                    |
|                              |                                    |
|                    +------------------+                           |
|                    | Client Apps      |                           |
|                    +------------------+                           |
+------------------------------------------------------------------+
```

---

## Key Design Principles

### 1. One Container Per Business (Isolation)

Each business gets its OWN PostgreSQL container:

```yaml
# Each business is a self-contained unit
retirewell/
  ├── docker-compose.yml      # Standalone compose file
  ├── .env                    # Business-specific config
  ├── Dockerfile              # Optional custom image
  └── data/                   # Persistent volume mount

presentermode/
  ├── docker-compose.yml
  ├── .env
  ├── Dockerfile
  └── data/
```

**Why?** When you want to "fork" to Railway, you just:
1. `railway up` in the business directory
2. Point it at Railway Postgres
3. Done. No extraction needed.

### 2. Utilities KB is a SERVICE, Not Data (API Pattern)

The RuvNet tools knowledge base is accessed via API, NEVER duplicated:

```javascript
// CORRECT: Query utilities via API
async function searchUtilities(query) {
  const response = await fetch('http://utilities:5100/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, k: 5 })
  });
  return response.json();
}

// WRONG: Embed utilities in each business DB
// This duplicates 2,152 vectors across every business
```

**Why API pattern?**
- Utilities update once, all businesses get updates
- No data duplication (saves ~3MB per business)
- Clean separation of concerns
- Easy to host utilities on CDN/edge

### 3. Production Gets Embedded Utilities (Exception)

When a business goes to production WITHOUT utilities API access:

```javascript
// Production mode: utilities are pre-embedded at deploy time
if (process.env.NODE_ENV === 'production' && !process.env.UTILITIES_API_URL) {
  // Use local embedded utilities snapshot
  return await localUtilitiesDB.search(query);
}
```

**Deployment script embeds utilities snapshot:**
```bash
#!/bin/bash
# deploy-to-railway.sh

# 1. Export utilities snapshot (one-time, ~3MB)
curl http://utilities:5100/api/export > utilities-snapshot.json

# 2. Bundle with business
railway up --include utilities-snapshot.json
```

---

## Data Flow Diagrams

### Local Development Query Flow

```
Client Request: "How do I spawn 150 agents for retirement planning?"

1. API Gateway receives query
   └── Route to: retirewell API (domain context)

2. Retirewell API processes:
   a. Search LOCAL business KB
      └── "retirement planning" context
      └── Returns: retirement docs, client data patterns

   b. Search UTILITIES API (parallel)
      └── "spawn agents" technical query
      └── Returns: agent spawning patterns, swarm configs

   c. Merge results with relevance scoring
      └── Domain docs + Tool docs = Complete answer

3. Return merged results to client
```

### Production Query Flow (Independent Business)

```
Client Request: "How do I spawn 150 agents for retirement planning?"

1. Retirewell Production API processes:
   a. Search LOCAL business KB (Railway Postgres)
      └── Retirement domain knowledge

   b. Search EMBEDDED utilities snapshot
      └── Agent spawning patterns (pre-bundled)

   c. Merge results

2. Return to client
   └── No external dependencies
   └── Fully self-contained
```

---

## Directory Structure

### Local Development Root

```
multi-business-kb/
├── docker-compose.yml           # Orchestrates ALL containers
├── gateway/
│   ├── index.js                 # API Gateway router
│   └── Dockerfile
│
├── utilities/                   # Shared tools KB (READ-ONLY)
│   ├── docker-compose.yml       # Can run standalone
│   ├── Dockerfile
│   ├── api/
│   │   └── index.js             # Utilities search API
│   └── data/                    # RuvNet tools vectors
│       ├── vectors.bin
│       ├── metadata.json
│       └── manifest.json
│
├── businesses/
│   ├── retirewell/              # Business 1
│   │   ├── docker-compose.yml   # STANDALONE - can deploy independently
│   │   ├── railway.json         # Railway config for easy deploy
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── data/
│   │   │   ├── vectors.bin
│   │   │   ├── metadata.json
│   │   │   └── manifest.json
│   │   └── utilities-snapshot/  # Embedded for production
│   │       └── utilities.json
│   │
│   ├── presentermode/           # Business 2
│   │   ├── docker-compose.yml
│   │   ├── railway.json
│   │   ├── api/
│   │   └── data/
│   │
│   └── [future-business]/
│
└── scripts/
    ├── fork-to-railway.sh       # Deploy any business to Railway
    ├── sync-utilities.sh        # Update embedded utilities snapshots
    └── local-dev.sh             # Start all containers
```

---

## Docker Compose Files

### Root Orchestrator (Local Development)

```yaml
# docker-compose.yml (ROOT - local dev only)
version: '3.8'

services:
  # API Gateway - routes to all services
  gateway:
    build: ./gateway
    ports:
      - "5000:5000"
    environment:
      - UTILITIES_URL=http://utilities:5100
      - RETIREWELL_URL=http://retirewell:5101
      - PRESENTERMODE_URL=http://presentermode:5102
    depends_on:
      - utilities
      - retirewell
      - presentermode

  # Shared Utilities KB (RuvNet Tools)
  utilities:
    build: ./utilities
    ports:
      - "5100:5100"
    volumes:
      - utilities_data:/app/data
    environment:
      - PGVECTOR_ENABLED=true
      - READ_ONLY=true

  # Business: RetireWell
  retirewell:
    build: ./businesses/retirewell
    ports:
      - "5101:5101"
    volumes:
      - retirewell_data:/app/data
    environment:
      - BUSINESS_NAME=retirewell
      - UTILITIES_API_URL=http://utilities:5100
      - DATABASE_URL=postgres://postgres:postgres@retirewell-db:5432/retirewell

  retirewell-db:
    image: pgvector/pgvector:pg16
    volumes:
      - retirewell_pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=retirewell
      - POSTGRES_PASSWORD=postgres

  # Business: PresenterMode
  presentermode:
    build: ./businesses/presentermode
    ports:
      - "5102:5102"
    volumes:
      - presentermode_data:/app/data
    environment:
      - BUSINESS_NAME=presentermode
      - UTILITIES_API_URL=http://utilities:5100
      - DATABASE_URL=postgres://postgres:postgres@presentermode-db:5432/presentermode

  presentermode-db:
    image: pgvector/pgvector:pg16
    volumes:
      - presentermode_pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=presentermode
      - POSTGRES_PASSWORD=postgres

volumes:
  utilities_data:
  retirewell_data:
  retirewell_pgdata:
  presentermode_data:
  presentermode_pgdata:
```

### Standalone Business Compose (For Forking)

```yaml
# businesses/retirewell/docker-compose.yml
# This file is used when deploying retirewell INDEPENDENTLY
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5101:5101"
    environment:
      - BUSINESS_NAME=retirewell
      - DATABASE_URL=${DATABASE_URL:-postgres://postgres:postgres@db:5432/retirewell}
      # Production: No UTILITIES_API_URL = use embedded snapshot
      - UTILITIES_API_URL=${UTILITIES_API_URL:-}
      - NODE_ENV=${NODE_ENV:-development}
    depends_on:
      - db

  db:
    image: pgvector/pgvector:pg16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=retirewell
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}

volumes:
  pgdata:
```

---

## API Implementations

### Business API (businesses/retirewell/api/index.js)

```javascript
/**
 * RetireWell Business API
 *
 * This API is INDEPENDENTLY DEPLOYABLE:
 * - Has its own PostgreSQL with pgvector
 * - Can query utilities API in dev, uses embedded snapshot in prod
 * - Zero coupling to other businesses
 */

const express = require('express');
const { PersistentVectorDB } = require('./storage');

const app = express();
app.use(express.json());

// Initialize business knowledge base
let businessDB;
let utilitiesDB; // Embedded snapshot for production

async function init() {
  businessDB = new PersistentVectorDB({
    path: process.env.DATA_PATH || './data',
    dimensions: 128
  });
  await businessDB.initialize();

  // Load embedded utilities if no API available
  if (!process.env.UTILITIES_API_URL) {
    console.log('Loading embedded utilities snapshot...');
    utilitiesDB = new PersistentVectorDB({
      path: './utilities-snapshot',
      dimensions: 128
    });
    await utilitiesDB.initialize();
  }
}

/**
 * Search endpoint - queries both business KB and utilities
 */
app.post('/api/search', async (req, res) => {
  const { query, k = 5, includeUtilities = true } = req.body;

  // 1. Search business knowledge base
  const businessResults = await businessDB.search({
    query,
    k: Math.ceil(k * 0.7) // 70% from business
  });

  // 2. Search utilities (API or embedded)
  let utilityResults = [];
  if (includeUtilities) {
    utilityResults = await searchUtilities(query, Math.ceil(k * 0.3));
  }

  // 3. Merge and re-rank
  const merged = mergeResults(businessResults, utilityResults, k);

  res.json({
    results: merged,
    sources: {
      business: businessResults.length,
      utilities: utilityResults.length
    }
  });
});

/**
 * Search utilities - API in dev, embedded in prod
 */
async function searchUtilities(query, k) {
  if (process.env.UTILITIES_API_URL) {
    // Development: Query utilities API
    const response = await fetch(`${process.env.UTILITIES_API_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, k })
    });
    return (await response.json()).results;
  } else if (utilitiesDB) {
    // Production: Query embedded snapshot
    return await utilitiesDB.search({ query, k });
  }
  return [];
}

/**
 * Merge results with source tagging
 */
function mergeResults(business, utilities, k) {
  const all = [
    ...business.map(r => ({ ...r, source: 'business' })),
    ...utilities.map(r => ({ ...r, source: 'utilities' }))
  ];

  // Sort by score, take top k
  return all
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    business: process.env.BUSINESS_NAME,
    utilitiesMode: process.env.UTILITIES_API_URL ? 'api' : 'embedded'
  });
});

init().then(() => {
  app.listen(5101, () => console.log('RetireWell API running on :5101'));
});
```

### Utilities API (utilities/api/index.js)

```javascript
/**
 * Utilities API - Shared RuvNet Tools Knowledge Base
 *
 * READ-ONLY service providing:
 * - Agent spawning patterns
 * - Swarm configurations
 * - Deployment guides
 * - MCP tool references
 *
 * This is the SINGLE SOURCE OF TRUTH for tool documentation.
 */

const express = require('express');
const { PersistentVectorDB } = require('./storage');

const app = express();
app.use(express.json());

let utilitiesDB;

async function init() {
  utilitiesDB = new PersistentVectorDB({
    path: process.env.DATA_PATH || './data',
    dimensions: 128
  });
  await utilitiesDB.initialize();
  console.log(`Utilities KB loaded: ${(await utilitiesDB.size())} vectors`);
}

/**
 * Search utilities knowledge base
 */
app.post('/api/search', async (req, res) => {
  const { query, k = 5 } = req.body;

  const results = await utilitiesDB.search({ query, k });

  res.json({
    results: results.map(r => ({
      ...r,
      source: 'utilities',
      readonly: true
    }))
  });
});

/**
 * Export utilities snapshot for embedding in production deploys
 */
app.get('/api/export', async (req, res) => {
  // Export all vectors + metadata as JSON for embedding
  const allData = await utilitiesDB.exportAll();

  res.json({
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    vectorCount: allData.length,
    data: allData
  });
});

/**
 * Stats endpoint
 */
app.get('/api/stats', async (req, res) => {
  res.json({
    vectorCount: await utilitiesDB.size(),
    dimensions: 128,
    readonly: true,
    source: 'ruvnet-tools'
  });
});

init().then(() => {
  app.listen(5100, () => console.log('Utilities API running on :5100'));
});
```

---

## Fork to Railway Script

```bash
#!/bin/bash
# scripts/fork-to-railway.sh
#
# Forks any business to Railway with minimal effort

set -e

BUSINESS=$1
if [ -z "$BUSINESS" ]; then
  echo "Usage: ./fork-to-railway.sh <business-name>"
  echo "Example: ./fork-to-railway.sh retirewell"
  exit 1
fi

BUSINESS_DIR="businesses/$BUSINESS"

if [ ! -d "$BUSINESS_DIR" ]; then
  echo "Error: Business directory not found: $BUSINESS_DIR"
  exit 1
fi

echo "=== Forking $BUSINESS to Railway ==="

# Step 1: Embed utilities snapshot
echo "1. Embedding utilities snapshot..."
mkdir -p "$BUSINESS_DIR/utilities-snapshot"

curl -s http://localhost:5100/api/export > "$BUSINESS_DIR/utilities-snapshot/utilities.json"

# Convert JSON to binary format for efficiency
node scripts/convert-utilities-snapshot.js "$BUSINESS_DIR/utilities-snapshot"

echo "   Utilities snapshot embedded: $(wc -c < "$BUSINESS_DIR/utilities-snapshot/vectors.bin") bytes"

# Step 2: Create railway.json if not exists
if [ ! -f "$BUSINESS_DIR/railway.json" ]; then
  cat > "$BUSINESS_DIR/railway.json" << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node api/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
EOF
fi

# Step 3: Deploy to Railway
echo "2. Deploying to Railway..."
cd "$BUSINESS_DIR"

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
  echo "Error: Railway CLI not found. Install with: npm i -g @railway/cli"
  exit 1
fi

# Link to Railway project (creates if not exists)
railway link --project "$BUSINESS"

# Add PostgreSQL if not already added
echo "3. Provisioning PostgreSQL..."
railway add --plugin postgresql 2>/dev/null || echo "   PostgreSQL already provisioned"

# Deploy
echo "4. Deploying application..."
railway up --detach

# Get deployment URL
DEPLOY_URL=$(railway status --json | jq -r '.deploymentUrl')

echo ""
echo "=== Deployment Complete ==="
echo "Business: $BUSINESS"
echo "URL: https://$DEPLOY_URL"
echo "Health: https://$DEPLOY_URL/health"
echo ""
echo "Database: Railway PostgreSQL (auto-configured)"
echo "Utilities: Embedded snapshot (no external deps)"
```

---

## Migration Scenarios

### Scenario 1: Local Development Setup

```bash
# Start everything
docker-compose up -d

# Verify services
curl http://localhost:5000/health          # Gateway
curl http://localhost:5100/api/stats       # Utilities
curl http://localhost:5101/health          # RetireWell
curl http://localhost:5102/health          # PresenterMode

# Test unified query
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How to spawn agents for retirement planning", "business": "retirewell"}'
```

### Scenario 2: Fork RetireWell to Railway

```bash
# 1. Run fork script
./scripts/fork-to-railway.sh retirewell

# 2. Set environment variables in Railway dashboard
#    - NODE_ENV=production
#    - BUSINESS_NAME=retirewell
#    (DATABASE_URL is auto-configured by Railway)

# 3. Test production deployment
curl https://retirewell-production.up.railway.app/health
# Should show: {"status":"healthy","utilitiesMode":"embedded"}
```

### Scenario 3: Fork to Supabase Instead

```bash
# 1. Create Supabase project
# 2. Enable pgvector extension
# 3. Get connection string

# 4. Deploy with Supabase connection
cd businesses/retirewell
DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres" \
  docker-compose up -d api

# Or deploy to any hosting with Supabase as DB
fly deploy --env DATABASE_URL="postgresql://..."
```

### Scenario 4: Update Utilities KB Globally

```bash
# 1. Update utilities container
cd utilities
# ... add new tool documentation ...
docker-compose restart

# 2. Re-embed for production deployments
./scripts/sync-utilities.sh

# This updates utilities-snapshot/ in all businesses
# Next deployment picks up new utilities automatically
```

---

## Key Differentiators from Previous Architecture

| Aspect | Previous (Single Container) | New (Federated) |
|--------|---------------------------|-----------------|
| Business isolation | Shared DB, schema separation | Separate containers |
| Fork to production | Extract schema + data | Just `railway up` |
| Utilities access | Duplicated in each schema | API (dev) / Embedded (prod) |
| Local dev complexity | Simple (one compose) | Moderate (multiple services) |
| Production complexity | Complex (extract/migrate) | Simple (standalone) |
| Data independence | Partial (shared host) | Complete (own DB) |
| Scale per business | Shared resources | Independent scaling |

---

## Summary

This architecture provides:

1. **True Independence**: Each business is a complete, deployable unit
2. **Shared Utilities via API**: No data duplication in development
3. **Embedded Utilities for Production**: No external dependencies when deployed
4. **Easy Forking**: `./fork-to-railway.sh retirewell` = done
5. **Multiple Deployment Targets**: Railway, Supabase, Fly.io, any PostgreSQL

The key insight is that **utilities are a SERVICE in development but EMBEDDED DATA in production**. This gives you the best of both worlds: convenient development with shared resources, and clean production with zero external dependencies.
