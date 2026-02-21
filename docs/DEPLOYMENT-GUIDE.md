Updated: 2026-02-21 00:00:00 EST | Version 2.0.0
Created: 2025-12-29 00:12:59 EST

# Ask-RuvNet Deployment Guide

> **Production deployment documentation for Ask-RuvNet**
> Running on Render.com (web service) with Neon PostgreSQL as the vector database.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [First-Time Render Deployment](#first-time-render-deployment)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Neon Database Setup](#neon-database-setup)
5. [Local Development Setup](#local-development-setup)
6. [Monitoring and Logs](#monitoring-and-logs)
7. [Triggering Manual Redeploys](#triggering-manual-redeploys)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

Ask-RuvNet uses a two-service production architecture: a Node.js web server hosted on Render.com and a serverless PostgreSQL database with pgvector hosted on Neon.

```
User Request
     |
     v
Render.com (Free Tier Web Service)
  - Runtime: Node.js
  - Region: Oregon (us-west-2)
  - Branch: main (auto-deploy on push)
  - Build: NODE_ENV=development npm install --include=dev && npm run build
  - Start: node src/server/app.js
  - Health check: /api/health
  - URL: https://ask-ruvnet.onrender.com
     |
     v
Neon PostgreSQL (pgvector)
  - Project: ask-ruvnet-kb (fragrant-math-26433511)
  - Host: ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech
  - Database: neondb
  - Schema: ask_ruvnet
  - Table: architecture_docs (55,111 rows)
  - Extension: pgvector
  - Index: HNSW (m=16, ef_construction=64)
  - Stored procedure: ask_ruvnet.knowledge_search()
```

### Why this architecture

- **Render free tier** handles the Node.js server with zero ongoing cost. It spins down after 15 minutes of inactivity and cold-starts on the next request (typically 30-60 seconds).
- **Neon** provides serverless PostgreSQL with native pgvector support. The database persists permanently regardless of Render's spin-down behaviour.
- **render.yaml** in the repo root tells Render everything it needs. There is no separate build configuration required.

---

## First-Time Render Deployment

### Prerequisites

- A Render account at [render.com](https://render.com)
- The `render` CLI installed: `npm install -g @render-ql/render-cli` or via Homebrew
- A Neon account with a database already created (see [Neon Database Setup](#neon-database-setup))
- A Groq API key

### Step 1: Connect your repository

1. Log in to the Render dashboard at [dashboard.render.com](https://dashboard.render.com).
2. Click **New** > **Web Service**.
3. Connect your GitHub account and select the `Ask-Ruvnet` repository.
4. Render will detect `render.yaml` automatically and pre-fill the configuration.

### Step 2: Confirm build settings

Render reads these values from `render.yaml`. Verify they match before deploying:

| Setting | Value |
|---------|-------|
| Runtime | Node |
| Plan | Free |
| Region | Oregon |
| Branch | main |
| Build command | `NODE_ENV=development npm install --include=dev && NODE_ENV=development npm run build` |
| Start command | `node src/server/app.js` |
| Health check path | `/api/health` |
| Auto-deploy | Yes (on every push to main) |

> The build command sets `NODE_ENV=development` deliberately during the build step. This ensures Vite and other dev dependencies are installed and available for the build. If `NODE_ENV=production` is set during `npm install`, dev dependencies are skipped and the build fails with a "vite not found" error. See [Troubleshooting](#troubleshooting) for more detail.

### Step 3: Add environment variables

Before clicking **Deploy**, set the required environment variables in the Render dashboard under **Environment**. See [Environment Variables Setup](#environment-variables-setup) for the full list.

### Step 4: Deploy

Click **Create Web Service**. Render will:

1. Clone the repository.
2. Run the build command.
3. Start the server with the start command.
4. Poll `/api/health` to confirm the service is healthy.

The service URL will be `https://ask-ruvnet.onrender.com` once the deploy succeeds.

---

## Environment Variables Setup

Set these in the Render dashboard under your service > **Environment**. Do not commit these values to the repository.

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require` | Full connection string from Neon dashboard. Set `sync: false` in render.yaml so it is never stored in git. |
| `GROQ_API_KEY` | `gsk_...` | Set in Render dashboard. Used for LLM inference. |
| `NODE_ENV` | `production` | Already set in render.yaml. Controls runtime behaviour after the build step. |
| `PORT` | `3000` | Already set in render.yaml. |

### Setting variables via the Render CLI

```bash
# Authenticate first
render login

# Set a secret variable (will prompt for value)
render env set DATABASE_URL --service srv-d6ctal0gjchc73e43d80

render env set GROQ_API_KEY --service srv-d6ctal0gjchc73e43d80
```

### Where to find your Neon connection string

1. Open [console.neon.tech](https://console.neon.tech).
2. Select the **ask-ruvnet-kb** project.
3. Go to **Connection Details**.
4. Copy the **Connection string** (it includes the password).
5. Append `?sslmode=require` if not already present.

---

## Neon Database Setup

This section applies if you are setting up a brand-new Neon database. If you are using the existing `ask-ruvnet-kb` project, skip to [Environment Variables Setup](#environment-variables-setup).

### Step 1: Create a Neon project

1. Log in to [console.neon.tech](https://console.neon.tech).
2. Click **New Project**.
3. Name it `ask-ruvnet-kb`, select the **US West (Oregon)** region to match Render, and click **Create Project**.
4. Copy the connection string shown on the project page.

### Step 2: Enable the pgvector extension

Connect to your Neon database using the connection string and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Verify it is active:

```sql
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
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
    embedding   vector(1536),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 4: Create the HNSW index

The HNSW index enables fast approximate nearest-neighbour search on the embedding column.

```sql
CREATE INDEX IF NOT EXISTS architecture_docs_embedding_hnsw
    ON ask_ruvnet.architecture_docs
    USING hnsw (embedding vector_l2_ops)
    WITH (m = 16, ef_construction = 64);
```

### Step 5: Create the knowledge_search stored procedure

```sql
CREATE OR REPLACE FUNCTION ask_ruvnet.knowledge_search(
    query_embedding vector(1536),
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
        id,
        title,
        content,
        source,
        tags,
        1 - (embedding <=> query_embedding) AS similarity
    FROM ask_ruvnet.architecture_docs
    WHERE 1 - (embedding <=> query_embedding) >= similarity_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
```

### Step 6: Verify row count

After ingestion the table should contain approximately 55,111 rows:

```sql
SELECT COUNT(*) FROM ask_ruvnet.architecture_docs;
```

---

## Local Development Setup

Local development uses a Docker-based PostgreSQL instance running on port 5435. You do not need a `DATABASE_URL` environment variable locally — the application falls back to `localhost:5435` automatically when `DATABASE_URL` is absent.

### Prerequisites

- Docker Desktop running
- Node.js 20 or later
- npm 9 or later

### Step 1: Start the local database

```bash
# Pull and start the RuVector postgres container (port 5435)
docker run -d \
  --name ruvector-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5435:5432 \
  ruvnet/ruvector-postgres:latest
```

If the container already exists from a previous session:

```bash
docker start ruvector-postgres
```

### Step 2: Install dependencies

```bash
cd /Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet

NODE_ENV=development npm install --include=dev
```

### Step 3: Build the frontend

```bash
NODE_ENV=development npm run build
```

### Step 4: Start the development server

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

### Local vs production difference

| | Local | Production |
|--|-------|-----------|
| Database | Docker ruvector-postgres on port 5435 | Neon PostgreSQL via `DATABASE_URL` |
| DATABASE_URL | Not required (falls back to localhost:5435) | Required (set in Render dashboard) |
| NODE_ENV at start | development | production |
| Server | `npm run dev` | `node src/server/app.js` |

---

## Monitoring and Logs

### Viewing live logs

Use the Render CLI to tail logs for the running service:

```bash
render logs -r srv-d6ctal0gjchc73e43d80
```

Add `--tail` to follow logs in real time:

```bash
render logs -r srv-d6ctal0gjchc73e43d80 --tail
```

### Checking the health endpoint

The health endpoint returns a JSON response indicating whether the server and database are reachable:

```bash
curl https://ask-ruvnet.onrender.com/api/health
```

Expected response when healthy:

```json
{ "status": "ok", "database": "connected", "version": "1.8.13" }
```

### Render dashboard metrics

Open [dashboard.render.com](https://dashboard.render.com) and select the **ask-ruvnet** service to view:

- CPU and memory usage graphs
- Deploy history with build logs for each deploy
- Event log (spin-up, spin-down, health check failures)

### Free tier spin-down behaviour

The Render free tier spins the service down after 15 minutes without incoming requests. The next request triggers a cold start that takes approximately 30-60 seconds. This is normal behaviour for the free tier and does not indicate an error. Upgrade to a paid plan to eliminate cold starts.

---

## Triggering Manual Redeploys

### Via the Render CLI

```bash
render deploys trigger -r srv-d6ctal0gjchc73e43d80
```

### Via the Render dashboard

1. Open the **ask-ruvnet** service in [dashboard.render.com](https://dashboard.render.com).
2. Click **Manual Deploy** > **Deploy latest commit**.

### Via a git push

Because `autoDeploy: true` is set in `render.yaml`, every push to the `main` branch triggers a deploy automatically:

```bash
git push origin main
```

---

## Troubleshooting

### Build fails: "vite: not found" or "sh: vite: command not found"

**Cause**: The build command is running with `NODE_ENV=production`, which causes npm to skip dev dependencies. Vite is a dev dependency, so it is not installed and the build fails.

**Fix**: Ensure the build command explicitly sets `NODE_ENV=development`:

```
NODE_ENV=development npm install --include=dev && NODE_ENV=development npm run build
```

This is already set in `render.yaml`. If the issue reappears, verify the Render service is reading the `render.yaml` from the repo root and that the file has not been edited to remove the `NODE_ENV=development` prefix.

---

### Server starts but returns 500 on all API routes

**Cause**: The `DATABASE_URL` environment variable is missing or incorrect. The server cannot connect to Neon.

**Fix**:

1. Open the Render dashboard > **ask-ruvnet** service > **Environment**.
2. Confirm `DATABASE_URL` is set and contains `sslmode=require` at the end.
3. Test the connection string directly by running from a local terminal:

```bash
psql "postgresql://neondb_owner:...@ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM ask_ruvnet.architecture_docs;"
```

If this returns a row count, the connection string is valid. Trigger a redeploy after correcting the variable.

---

### Health check fails and Render marks the deploy as failed

**Cause**: The server did not start within Render's health check window, or `/api/health` returned a non-200 status.

**Steps to diagnose**:

1. Check the deploy build logs in the Render dashboard for startup errors.
2. Tail the live logs with:

```bash
render logs -r srv-d6ctal0gjchc73e43d80 --tail
```

3. Look for database connection errors, missing environment variables, or uncaught exceptions at startup.

---

### Service is returning a 503 or timing out on first request after inactivity

**Cause**: This is expected behaviour on the free tier. The service has spun down and is cold-starting.

**Fix**: Wait 30-60 seconds and retry the request. If cold starts are unacceptable, upgrade to a Render paid plan (Starter or above), which keeps the service alive continuously.

---

### Neon connection times out from Render

**Cause**: Neon's serverless compute may have suspended. The first query after a period of inactivity wakes the compute and takes a few seconds longer than usual.

**Fix**: This is normal for Neon's free tier. If consistent slow starts are a problem, upgrade to a Neon paid plan that keeps compute always-on, or set the Neon project's suspension timeout to a longer value in the Neon console under **Project Settings > Compute**.

---

### npm install fails with peer dependency errors during build

**Fix**: The build command uses `--include=dev` without `--legacy-peer-deps`. If a newly added package introduces peer conflicts, either resolve them in `package.json` or add `--legacy-peer-deps` to the build command in `render.yaml`:

```yaml
buildCommand: NODE_ENV=development npm install --include=dev --legacy-peer-deps && NODE_ENV=development npm run build
```

---

## Quick Reference

| Item | Value |
|------|-------|
| Production URL | https://ask-ruvnet.onrender.com |
| Health endpoint | https://ask-ruvnet.onrender.com/api/health |
| Render service ID | srv-d6ctal0gjchc73e43d80 |
| Neon project | ask-ruvnet-kb (fragrant-math-26433511) |
| Neon host | ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech |
| Neon schema | ask_ruvnet |
| Neon table | architecture_docs (55,111 rows) |
| Tail logs | `render logs -r srv-d6ctal0gjchc73e43d80 --tail` |
| Trigger redeploy | `render deploys trigger -r srv-d6ctal0gjchc73e43d80` |
| Local dev server | `npm run dev` (localhost:3000) |
| Local database | Docker ruvector-postgres on port 5435 |
