Updated: 2026-03-02 00:00:00 EST | Version 3.0.0
Created: 2025-12-29 00:12:59 EST

# Ask-RuvNet Deployment Guide

> **Production deployment documentation for Ask-RuvNet v3.1.3+**
> Running on Railway (Hobby plan, $5/month, Docker) with RuvectorStore as the self-contained vector database.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Railway Deployment](#railway-deployment)
3. [Environment Variables](#environment-variables)
4. [RuvectorStore Data](#ruvectorstore-data)
5. [Local Development Setup](#local-development-setup)
6. [Managing Railway via GraphQL API](#managing-railway-via-graphql-api)
7. [Monitoring and Verification](#monitoring-and-verification)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference](#quick-reference)

---

## Architecture Overview

Ask-RuvNet uses a single-service architecture: a Node.js web server in a Docker container on Railway with an embedded RuvectorStore binary knowledge base. No external database is required.

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
RuvectorStore (embedded, no external DB)
  - Format: HNSW-indexed binary vectors + JSON metadata
  - Entries: 103,755 curated knowledge entries
  - Dimensions: 384 (all-MiniLM-L6-v2)
  - Source: Compressed tarball (ruvector-kb.tar.gz, ~164MB)
  - Extracted at startup to .ruvector/knowledge-base/
  - Includes: 323 gold curated teaching entries + 103,432 architecture docs
     |
     v
Multi-Provider LLM Fallback Chain
  - openai → groq-free → anthropic → openrouter → deepseek
  - Auto-detects all configured API keys
  - Falls to next provider on rate-limit or error
```

### Key Architecture Decision

As of v3.1.3, Ask-RuvNet uses **RuvectorStore** (embedded binary format) instead of an external PostgreSQL database. This eliminates:
- External database dependency (no Neon, no connection strings)
- Connection timeout issues
- SSL/TLS configuration complexity
- Database hosting costs

The knowledge base is shipped as a compressed tarball (`ruvector-kb.tar.gz`) tracked via Git LFS. At container startup, it's extracted to `.ruvector/knowledge-base/`.

### Why Railway (not Render)

| Factor | Railway Hobby ($5/mo) | Render Free ($0) |
|--------|----------------------|-------------------|
| Always-on | Yes | No (spins down after 15 min) |
| Cold start | None | 60-120 seconds |
| Docker support | Native | Limited |
| Auto-deploy | Yes (GitHub push) | Yes (GitHub push) |
| Custom domains | Yes | Yes |
| Volume mounts | Yes | No |

Railway Hobby plan keeps the container running 24/7. There is no spin-down or cold-start delay.

---

## Railway Deployment

### How It Works

1. Push to `main` triggers Railway auto-deploy via GitHub integration.
2. Railway builds the Docker image from `Dockerfile` in the repo root.
3. The Dockerfile installs system deps, runs `npm install`, builds the React frontend.
4. Container starts via `CMD ["bash", "scripts/deployment/start-railway.sh"]`.
5. The startup script extracts `ruvector-kb.tar.gz` → `.ruvector/knowledge-base/`, then runs `node src/server/app.js`.

### Railway Project Details

| Resource | ID |
|----------|------|
| Project name | Ask-Ruvnet |
| Project ID | `8344da50-ba32-4973-abb5-c73dd11ca69d` |
| Service ID | `e10d03b5-bc26-47c2-8ae9-3d444a083560` |
| Environment ID | `3e37ece4-3af3-4be5-94e6-c61b9983e95e` |
| Public domain | `ask-ruvnet-production.up.railway.app` |

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

Set these in the Railway dashboard under your service > **Variables** tab.

### Required Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production`. |
| `PORT` | Set to `3000`. |

### LLM Provider Keys (at least one required)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI (gpt-4o). Primary provider. |
| `GROQ_API_KEY` | Groq free tier (1M tokens/day). |
| `GROQ_PAID_API_KEY` | Groq paid tier. |
| `ANTHROPIC_API_KEY` | Anthropic Claude. Also accepts `CLAUDE_API_KEY`. |
| `OPENROUTER_API_KEY` | OpenRouter multi-model gateway. |
| `DEEPSEEK_API_KEY` | DeepSeek. |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | auto-detect | Override the primary LLM provider. |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Override Groq model. |
| `OPENAI_MODEL` | `gpt-4o` | Override OpenAI model. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Override Anthropic model. |

**Note:** `DATABASE_URL` is no longer required. The knowledge base is embedded in the container.

---

## RuvectorStore Data

### How the Knowledge Base is Stored

The knowledge base is a binary vector database stored in `.ruvector/knowledge-base/`:

| File | Size | Description |
|------|------|-------------|
| `vectors.bin` | ~152MB | Raw Float32 embedding vectors (384 dimensions × 103,755 entries) |
| `metadata.json` | ~191MB | JSON metadata for all entries (titles, content, categories, quality scores) |
| `manifest.json` | <1KB | Database configuration (dimensions, distance metric) |
| `wal.log` | 0B | Write-ahead log (empty after clean shutdown) |

### Compressed for Git

The entire `.ruvector/` directory compresses to `ruvector-kb.tar.gz` (~164MB), tracked via Git LFS. This is committed to the repo.

### Updating the Knowledge Base

To rebuild the knowledge base from the Docker PostgreSQL source:

```bash
# 1. Ensure Docker ruvector-postgres is running on port 5435
# 2. Run the export script
node scripts/export-to-ruvectorstore.mjs --fresh

# 3. Recompress
tar czf ruvector-kb.tar.gz .ruvector/knowledge-base/

# 4. Commit (Git LFS handles the large file)
git add ruvector-kb.tar.gz
git commit -m "Update RuvectorStore knowledge base"
git push origin main
```

### Data Sources

| Source | Entries | Description |
|--------|---------|-------------|
| `kb_complete` | 323 | Expert-curated gold teaching entries (avg quality 97.8/100) |
| `architecture_docs` | 103,432 | Curated architecture documentation from 155+ repos |
| **Total** | **103,755** | All entries have 384-dim embeddings |

---

## Local Development Setup

### Prerequisites

- Node.js 22+
- npm 9+
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
# Edit .env with your actual API keys

# Extract RuvectorStore data (if not already present)
tar xzf ruvector-kb.tar.gz

# Start the server
node src/server/app.js
```

### Local vs Production

| | Local | Production |
|--|-------|-----------|
| Knowledge base | `.ruvector/knowledge-base/` (extracted) | Same (extracted from tarball at startup) |
| LLM | Any configured provider | 5-provider fallback chain |
| NODE_ENV | development | production |
| Server | `node src/server/app.js` | Docker → `start-railway.sh` |
| URL | http://localhost:3000 | https://ask-ruvnet-production.up.railway.app |

---

## Managing Railway via GraphQL API

The Railway CLI requires account-scoped tokens, which are not available on the Hobby plan. Use the GraphQL API with a project-scoped token instead.

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

---

## Monitoring and Verification

### Health Check

```bash
curl https://ask-ruvnet-production.up.railway.app/health
```

Expected:
```json
{ "status": "ok", "uptime": 12345, "version": "3.1.3" }
```

### KB Connection

```bash
curl https://ask-ruvnet-production.up.railway.app/api/kb-stats
```

Expected:
```json
{
  "backend": "RuVector HNSW + PersistentVectorDB",
  "connected": true,
  "status": "Active",
  "vectorCount": 103755,
  "dimensions": 384,
  "path": ".ruvector/knowledge-base"
}
```

### Ecosystem Stats

```bash
curl https://ask-ruvnet-production.up.railway.app/api/ecosystem-stats
```

Expected:
```json
{
  "totalRepos": 155,
  "totalEntries": 103755,
  "kbBackend": "RuvectorStore (HNSW binary)"
}
```

### Provider Chain

```bash
curl https://ask-ruvnet-production.up.railway.app/api/providers
```

Expected: 5 providers with openai as primary.

---

## Troubleshooting

### KB shows vectorCount: 0

**Cause**: `ruvector-kb.tar.gz` was not extracted, or the file was not included in the Docker build.

**Fix**:
1. Check Railway build logs — does the tarball exist in the container?
2. Verify Git LFS is pulling the file: `git lfs pull`
3. Check startup logs for "Extracting RuvectorStore knowledge base..."

### Chat returns generic (non-KB) answers

**Cause**: The KB loaded but search returned no relevant results.

**Fix**: Check `/api/kb-stats` to confirm `vectorCount > 0`. If zero, see above.

### Deploy fails during Docker build

**Cause**: Usually npm install failures or missing system dependencies.

**Fix**: Check the build logs in Railway dashboard. Common issues:
- Peer dependency conflicts: add `--legacy-peer-deps` to the npm install in Dockerfile
- Missing native deps: add to the `apt-get install` line in Dockerfile

### Git LFS issues on Railway

**Cause**: Railway may not pull Git LFS files by default.

**Fix**: Add a `.railwayignore` or ensure the Dockerfile copies the tarball. If LFS doesn't work, consider:
1. Adding `GIT_LFS_SKIP_SMUDGE=0` to Railway environment
2. Adding `RUN git lfs pull` to the Dockerfile
3. Hosting the tarball externally and downloading at build time

### All LLM providers fail

**Cause**: No valid API keys configured in Railway Variables.

**Fix**: Set at least `OPENAI_API_KEY` or `GROQ_API_KEY`. Check `/api/providers` to see what's configured.

---

## Quick Reference

| Item | Value |
|------|-------|
| Production URL | https://ask-ruvnet-production.up.railway.app |
| Health endpoint | /health |
| Railway project ID | `8344da50-ba32-4973-abb5-c73dd11ca69d` |
| Railway service ID | `e10d03b5-bc26-47c2-8ae9-3d444a083560` |
| Railway environment ID | `3e37ece4-3af3-4be5-94e6-c61b9983e95e` |
| KB backend | RuvectorStore (HNSW binary, 103,755 entries) |
| KB data file | `ruvector-kb.tar.gz` (~164MB, Git LFS) |
| KB stats | `curl .../api/kb-stats` |
| Providers | `curl .../api/providers` |
| GraphQL API | `https://backboard.railway.app/graphql/v2` |
| Local dev | `node src/server/app.js` (localhost:3000) |
