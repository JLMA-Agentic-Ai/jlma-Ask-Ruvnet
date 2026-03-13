Updated: 2026-03-13 00:00:00 EST | Version 4.0.0
Created: 2025-12-29 00:12:59 EST

# Ask-RuvNet Deployment Guide

> **Production deployment documentation for Ask-RuvNet v3.6+**
> Running on Railway (Hobby plan, $5/month, Docker) with an embedded RVF knowledge base.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Railway Deployment](#railway-deployment)
3. [Environment Variables](#environment-variables)
4. [Knowledge Base (RVF)](#knowledge-base-rvf)
5. [Local Development Setup](#local-development-setup)
6. [Managing Railway via GraphQL API](#managing-railway-via-graphql-api)
7. [Monitoring and Verification](#monitoring-and-verification)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference](#quick-reference)

---

## Architecture Overview

Ask-RuvNet uses a single-service, embedded-only architecture: a Node.js web server in a Docker container on Railway with an embedded RVF (RuVector Format) knowledge base. No external database is required at runtime.

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
RVF Knowledge Base (embedded, read-only)
  - Format: knowledge.rvf (single HNSW-indexed binary file)
  - Entries: 102,857 curated knowledge entries
  - Dimensions: 384 (all-MiniLM-L6-v2)
  - Includes: 323 gold curated teaching entries + 102,534 architecture docs
  - Loaded at startup via RvfStore.js
     |
     v
Multi-Provider LLM Fallback Chain
  - openai -> groq-free -> anthropic -> openrouter -> deepseek
  - Auto-detects all configured API keys
  - Falls to next provider on rate-limit or error
```

### Key Architecture Decision

Ask-RuvNet uses a **single RVF file** (`knowledge.rvf`) as the entire knowledge base. This is a self-contained HNSW-indexed binary containing all vectors and metadata. There is no external database dependency — no PostgreSQL, no connection strings, no network calls for search.

The RVF file is generated nightly from the authoring PostgreSQL database (local Docker, port 5435) and shipped via Git LFS.

### Three Consumers, Same Source

The nightly pipeline generates formats for three consumers from the same PostgreSQL source:

| Consumer | Format | Size | Search Engine |
|----------|--------|------|---------------|
| **Railway** (online) | `knowledge.rvf` | 151 MB | RvfStore.js (HNSW) |
| **MCP** (Claude Code) | `kb-entries.json.gz` + `kb-embeddings.bin` | 35 MB | Binary hamming distance |
| **Browser** (WASM) | SQ8 assets | 10 MB | WASM worker |

### Why Railway (not Render)

| Factor | Railway Hobby ($5/mo) | Render Free ($0) |
|--------|----------------------|-------------------|
| Always-on | Yes | No (spins down after 15 min) |
| Cold start | None | 60-120 seconds |
| Docker support | Native | Limited |
| Auto-deploy | Yes (GitHub push) | Yes (GitHub push) |

Railway Hobby plan keeps the container running 24/7. There is no spin-down or cold-start delay.

---

## Railway Deployment

### How It Works

1. Push to `main` triggers Railway auto-deploy via GitHub integration.
2. Railway builds the Docker image from `Dockerfile` in the repo root.
3. The Dockerfile installs system deps, runs `npm install`, builds the React frontend.
4. At build time, `knowledge.rvf.gz` parts are reassembled and decompressed.
5. Container starts via `CMD ["bash", "scripts/deployment/start-railway.sh"]`.
6. RvfStore.js opens `knowledge.rvf` read-only and serves search queries.

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

No `DATABASE_URL` is needed. The knowledge base is embedded in the container as `knowledge.rvf`.

---

## Knowledge Base (RVF)

### How the Knowledge Base is Stored

The knowledge base is a single RVF file (`knowledge.rvf`) containing HNSW-indexed vectors, metadata, and content:

| Item | Description |
|------|-------------|
| File | `knowledge.rvf` (~151 MB) |
| Format | RuVector Format — single binary with HNSW index |
| Entries | 102,857 curated knowledge entries |
| Dimensions | 384 (all-MiniLM-L6-v2) |
| Search | RvfStore.js (src/core/RvfStore.js) |
| Content | `content-sidecar.json.gz` for full-text content |

### Shipped via Git LFS

The RVF file is split into parts for Git LFS compatibility and reassembled during Docker build:

```
knowledge.rvf.gz.part-aa  (50MB each, tracked by Git LFS)
knowledge.rvf.gz.part-ab
knowledge.rvf.gz.part-ac
```

The Dockerfile reassembles: `cat *.part-* > knowledge.rvf.gz && gunzip knowledge.rvf.gz`

### Updating the Knowledge Base

The knowledge base is updated via a nightly pipeline:

```bash
# 1. Ensure Docker ruvector-postgres is running on port 5435
# 2. Run kb-evergreen to update PG from all GitHub repos
node scripts/kb-evergreen.mjs

# 3. Export PG to RVF format
node scripts/export-to-ruvectorstore.mjs --fresh

# 4. Build the RVF file
# (RvfStore reads from .ruvector/knowledge-base/ at this point)

# 5. Commit and push (Git LFS handles the large files)
git add knowledge.rvf.gz.part-*
git commit -m "Update knowledge base"
git push origin main
```

A daily cron job (`schedule-mcp-kb-daily-publish`, 3 AM ET) runs this pipeline automatically.

### Data Sources

| Source | Entries | Description |
|--------|---------|-------------|
| `kb_complete` | 323 | Expert-curated gold teaching entries (avg quality 97.8/100) |
| `architecture_docs` | 102,534 | Curated architecture documentation from 155+ repos |
| **Total** | **102,857** | All entries have 384-dim embeddings |

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

# Ensure knowledge.rvf exists (download or build from PG)
ls knowledge.rvf || echo "Need to build knowledge.rvf from PG"

# Start the server
node src/server/app.js
```

### Local vs Production

| | Local | Production |
|--|-------|-----------|
| Knowledge base | `knowledge.rvf` (local file) | Same (assembled from parts at Docker build) |
| LLM | Any configured provider | 5-provider fallback chain |
| NODE_ENV | development | production |
| Server | `node src/server/app.js` | Docker + `start-railway.sh` |
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
{ "status": "ok", "uptime": 12345, "version": "3.6.4" }
```

### KB Stats

```bash
curl https://ask-ruvnet-production.up.railway.app/api/kb-stats
```

Expected:
```json
{
  "backend": "RVF",
  "connected": true,
  "status": "Active",
  "vectorCount": 102857,
  "dimensions": 384,
  "path": "knowledge.rvf"
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
  "totalEntries": 102857,
  "kbBackend": "RVF (HNSW binary)"
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

**Cause**: `knowledge.rvf` was not built or not included in the Docker image.

**Fix**:
1. Check Railway build logs for "Reassembling knowledge.rvf"
2. Verify Git LFS is pulling the parts: `git lfs pull`
3. Check that `knowledge.rvf.gz.part-*` files exist in the repo root

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

**Fix**:
1. Add `GIT_LFS_SKIP_SMUDGE=0` to Railway environment
2. Split the RVF file into parts small enough for regular Git (current approach)
3. Ensure the Dockerfile `COPY . .` includes the part files

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
| KB backend | RVF (knowledge.rvf, 102,857 entries) |
| KB format | Single HNSW-indexed binary (151 MB) |
| KB stats | `curl .../api/kb-stats` |
| Providers | `curl .../api/providers` |
| GraphQL API | `https://backboard.railway.app/graphql/v2` |
| Local dev | `node src/server/app.js` (localhost:3000) |
