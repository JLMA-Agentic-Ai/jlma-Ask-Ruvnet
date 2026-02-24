Updated: 2026-02-24 01:50:00 EST | Version 2.1.5
Created: 2025-12-29 00:12:59 EST

# Ask-RuvNet Deployment Guide

> **Production deployment documentation for Ask-RuvNet**
> Running on Railway (Hobby plan, $5/month, Docker) with Neon PostgreSQL as the vector database.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Railway Deployment](#railway-deployment)
3. [Environment Variables](#environment-variables)
4. [Neon Database Setup](#neon-database-setup)
5. [Local Development Setup](#local-development-setup)
6. [Managing Railway via GraphQL API](#managing-railway-via-graphql-api)
7. [Monitoring and Verification](#monitoring-and-verification)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference](#quick-reference)

---

## Architecture Overview

Ask-RuvNet uses a two-service production architecture: a Node.js web server in a Docker container on Railway, and a serverless PostgreSQL database with pgvector on Neon.

```
User Request
     |
     v
Railway (Hobby Plan, $5/month)
  - Container: Docker (node:22-bookworm-slim)
  - Region: us-west-2
  - Branch: main (auto-deploy on push)
  - Build: Dockerfile (npm install + frontend build)
  - Start: bash scripts/deployment/start-railway.sh
  - Health check: /health
  - URL: https://ask-ruvnet-production.up.railway.app
  - Always-on: Yes (no cold starts)
     |
     v
Neon PostgreSQL (pgvector)
  - Project: ask-ruvnet-kb (fragrant-math-26433511)
  - Host: ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech
  - Database: neondb
  - Schema: ask_ruvnet
  - Table: architecture_docs (54,543 rows)
  - Extension: pgvector
  - Index: HNSW (m=16, ef_construction=64)
  - Stored procedure: ask_ruvnet.knowledge_search()
     |
     v
Multi-Provider LLM Fallback Chain
  - groq-free → openai → anthropic → openrouter → deepseek
  - Auto-detects all configured API keys
  - Falls to next provider on rate-limit or error
```

### Why Railway (not Render)

| Factor | Railway Hobby ($5/mo) | Render Free ($0) |
|--------|----------------------|-------------------|
| Always-on | Yes | No (spins down after 15 min) |
| Cold start | None | 60-120 seconds |
| Docker support | Native | Limited |
| Auto-deploy | Yes (GitHub push) | Yes (GitHub push) |
| Custom domains | Yes | Yes |
| Volume mounts | Yes | No |

Railway Hobby plan keeps the container running 24/7. There is no spin-down or cold-start delay. This was the deciding factor — Render's free tier cold-starts made the app unusable for demos.

---

## Railway Deployment

### How It Works

1. Push to `main` triggers Railway auto-deploy via GitHub integration.
2. Railway builds the Docker image from `Dockerfile` in the repo root.
3. The Dockerfile installs system deps, runs `npm install`, builds the React frontend.
4. Container starts via `CMD ["bash", "scripts/deployment/start-railway.sh"]`.
5. The startup script checks for `DATABASE_URL`, then runs `node src/server/app.js`.

### Railway Project Details

| Resource | ID |
|----------|------|
| Project name | Ask-Ruvnet |
| Project ID | `8344da50-ba32-4973-abb5-c73dd11ca69d` |
| Service ID | `e10d03b5-bc26-47c2-8ae9-3d444a083560` |
| Environment ID | `3e37ece4-3af3-4be5-94e6-c61b9983e95e` |
| Public domain | `ask-ruvnet-production.up.railway.app` |
| Volume | `.swarm` mounted at `/app/.swarm` |

### Deploying a New Version

```bash
# Bump version, commit, push — Railway auto-deploys
npm version patch
git push origin main
```

### First-Time Setup

If deploying to a fresh Railway project:

1. Create a new project on [railway.com](https://railway.com).
2. Connect the GitHub repository (main branch).
3. Railway detects the `Dockerfile` and uses it automatically.
4. Add environment variables (see next section).
5. Deploy.

---

## Environment Variables

Set these in the Railway dashboard under your service > **Variables** tab. Or use the GraphQL API (see below).

### Critical Warning

**The variable name must be `DATABASE_URL` (with underscore).** Railway accepts hyphens in variable names, but Node.js `process.env` cannot access variables with hyphens. `DATABASE-URL` will silently fail.

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string. Must end with `?sslmode=require`. |
| `NODE_ENV` | Set to `production`. |
| `PORT` | Set to `3000`. |

### LLM Provider Keys (at least one required)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq free tier (1M tokens/day). Primary provider in the fallback chain. |
| `GROQ_PAID_API_KEY` | Groq paid tier. Inserted between groq-free and openai. |
| `OPENAI_API_KEY` | OpenAI (gpt-4o). |
| `ANTHROPIC_API_KEY` | Anthropic Claude. Also accepts `CLAUDE_API_KEY`. |
| `OPENROUTER_API_KEY` | OpenRouter multi-model gateway. |
| `DEEPSEEK_API_KEY` | DeepSeek. |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | auto-detect | Override the primary LLM provider. |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Override Groq model for both tiers. |
| `OPENAI_MODEL` | `gpt-4o` | Override OpenAI model. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Override Anthropic model. |

### Where to Find Your Neon Connection String

1. Open [console.neon.tech](https://console.neon.tech).
2. Select the **ask-ruvnet-kb** project.
3. Go to **Connection Details**.
4. Copy the **Connection string** (it includes the password).
5. Append `?sslmode=require` if not already present.

---

## Neon Database Setup

This section applies if setting up a brand-new Neon database. If using the existing `ask-ruvnet-kb` project, skip to [Environment Variables](#environment-variables).

### Step 1: Create a Neon project

1. Log in to [console.neon.tech](https://console.neon.tech).
2. Click **New Project**.
3. Name it `ask-ruvnet-kb`, select **US West (Oregon)** region.
4. Copy the connection string.

### Step 2: Enable pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3: Create the schema and table

```sql
CREATE SCHEMA IF NOT EXISTS ask_ruvnet;

CREATE TABLE IF NOT EXISTS ask_ruvnet.architecture_docs (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT,
    content     TEXT,
    source      TEXT,
    tags        TEXT[],
    embedding   vector(384),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 4: Create the HNSW index

```sql
CREATE INDEX IF NOT EXISTS architecture_docs_embedding_hnsw
    ON ask_ruvnet.architecture_docs
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

### Step 5: Create the knowledge_search stored procedure

```sql
CREATE OR REPLACE FUNCTION ask_ruvnet.knowledge_search(
    query_embedding vector(384),
    match_count      INT DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
    id         BIGINT,
    title      TEXT,
    content    TEXT,
    source     TEXT,
    tags       TEXT[],
    similarity FLOAT
)
LANGUAGE sql STABLE AS $$
    SELECT
        id, title, content, source, tags,
        1 - (embedding <=> query_embedding) AS similarity
    FROM ask_ruvnet.architecture_docs
    WHERE 1 - (embedding <=> query_embedding) >= similarity_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
```

### Step 6: Verify row count

```sql
SELECT COUNT(*) FROM ask_ruvnet.architecture_docs;
-- Expected: 54543
```

---

## Local Development Setup

### Prerequisites

- Node.js 22+
- npm 9+
- A Neon database connection string (or local Docker PostgreSQL)
- At least one LLM API key

### Quick Start

```bash
cd /path/to/Ask-Ruvnet

# Install dependencies
npm install

# Build the frontend
npm run build

# Create .env from template
cp .env.example .env
# Edit .env with your actual API keys and DATABASE_URL

# Start the server
node src/server/app.js
```

### Local vs Production

| | Local | Production |
|--|-------|-----------|
| Database | Docker ruvector-postgres (port 5435) or Neon via DATABASE_URL | Neon PostgreSQL via DATABASE_URL |
| LLM | Any configured provider | 5-provider fallback chain |
| NODE_ENV | development | production |
| Server | `node src/server/app.js` | Docker → `start-railway.sh` |
| URL | http://localhost:3000 | https://ask-ruvnet-production.up.railway.app |

---

## Managing Railway via GraphQL API

The Railway CLI requires account-scoped tokens, which are not available on the Hobby plan. Use the GraphQL API with a project-scoped token instead. This provides full control over variables, deployments, and service configuration.

### Authentication

Create a project token in the Railway dashboard: **Project Settings > Tokens > Create Token**.

### Check Deployment Status

```bash
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "{ deployments(first: 1, input: { projectId: \"8344da50-ba32-4973-abb5-c73dd11ca69d\", environmentId: \"3e37ece4-3af3-4be5-94e6-c61b9983e95e\", serviceId: \"e10d03b5-bc26-47c2-8ae9-3d444a083560\" }) { edges { node { id status createdAt } } } }"}'
```

### Read Variables

```bash
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "{ variables(projectId: \"8344da50-ba32-4973-abb5-c73dd11ca69d\", environmentId: \"3e37ece4-3af3-4be5-94e6-c61b9983e95e\", serviceId: \"e10d03b5-bc26-47c2-8ae9-3d444a083560\") }"}'
```

### Set a Variable (triggers auto-redeploy)

```bash
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "mutation { variableUpsert(input: { projectId: \"8344da50-ba32-4973-abb5-c73dd11ca69d\", environmentId: \"3e37ece4-3af3-4be5-94e6-c61b9983e95e\", serviceId: \"e10d03b5-bc26-47c2-8ae9-3d444a083560\", name: \"VAR_NAME\", value: \"VAR_VALUE\" }) }"}'
```

### Delete a Variable

```bash
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "mutation { variableDelete(input: { projectId: \"8344da50-ba32-4973-abb5-c73dd11ca69d\", environmentId: \"3e37ece4-3af3-4be5-94e6-c61b9983e95e\", serviceId: \"e10d03b5-bc26-47c2-8ae9-3d444a083560\", name: \"VAR_NAME\" }) }"}'
```

---

## Monitoring and Verification

### Health Check

```bash
curl https://ask-ruvnet-production.up.railway.app/health
```

Expected:
```json
{ "status": "ok", "uptime": 12345, "version": "2.1.5" }
```

### KB Connection

```bash
curl https://ask-ruvnet-production.up.railway.app/api/kb-stats
```

Expected: `"connected": true`, `"total": 54543`

### Provider Chain

```bash
curl https://ask-ruvnet-production.up.railway.app/api/providers
```

Expected: 5 providers with groq-free as primary.

### Railway Deploy Logs

View in the Railway dashboard under your service > **Deployments** > click a deployment > **Logs**.

---

## Troubleshooting

### KB shows connected: false or vectorCount: 0

**Cause**: `DATABASE_URL` is missing, misspelled, or uses a hyphen instead of underscore.

**Fix**:
1. Check Railway Variables — the name must be exactly `DATABASE_URL` (underscore).
2. Verify the value contains `?sslmode=require` at the end.
3. Test the connection string: `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM ask_ruvnet.architecture_docs;"`
4. If you changed the variable, Railway auto-redeploys. Wait for the deploy to complete.

### Chat returns generic (non-KB) answers

**Cause**: The LLM is generating without KB context because the database connection failed silently.

**Fix**: Same as above — check `DATABASE_URL`. Also check `/api/kb-stats` to confirm `connected: true`.

### Deploy fails during Docker build

**Cause**: Usually npm install failures or missing system dependencies.

**Fix**: Check the build logs in Railway dashboard. Common issues:
- Peer dependency conflicts: add `--legacy-peer-deps` to the npm install in Dockerfile
- Missing native deps: add to the `apt-get install` line in Dockerfile

### All LLM providers fail

**Cause**: No valid API keys configured in Railway Variables.

**Fix**: Set at least `GROQ_API_KEY`. Check `/api/providers` to see what's configured.

### Railway CLI returns "Unauthorized"

**Cause**: Railway Hobby plan only offers project-scoped tokens. The CLI's `whoami` and `link` commands require account-scoped tokens.

**Fix**: Use the GraphQL API instead (see [Managing Railway via GraphQL API](#managing-railway-via-graphql-api)). Project tokens work perfectly with the API.

---

## Quick Reference

| Item | Value |
|------|-------|
| Production URL | https://ask-ruvnet-production.up.railway.app |
| Health endpoint | https://ask-ruvnet-production.up.railway.app/health |
| Railway project ID | `8344da50-ba32-4973-abb5-c73dd11ca69d` |
| Railway service ID | `e10d03b5-bc26-47c2-8ae9-3d444a083560` |
| Railway environment ID | `3e37ece4-3af3-4be5-94e6-c61b9983e95e` |
| Neon project | ask-ruvnet-kb (fragrant-math-26433511) |
| Neon host | ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech |
| Neon schema | ask_ruvnet |
| Neon table | architecture_docs (54,543 rows) |
| KB stats | `curl .../api/kb-stats` |
| Providers | `curl .../api/providers` |
| GraphQL API | `https://backboard.railway.app/graphql/v2` |
| Local dev | `node src/server/app.js` (localhost:3000) |
| Local database | Docker ruvector-postgres on port 5435 |
