# AskRuvNet - AI Knowledge Base Assistant

> Updated: 2026-02-21 | Version 2.1.1

**Production URL:** https://ask-ruvnet.onrender.com
**npm package name:** answerbot-builder
**Deployment Platform:** Render.com (render.yaml auto-detected)

AskRuvNet is an AI-powered assistant that answers questions about the RuvNet ecosystem. It combines a 54,543-entry gold-tier knowledge base stored in Neon PostgreSQL with Groq's llama-3.3-70b-versatile model to deliver accurate, context-grounded responses about RuvNet packages, agent orchestration, vector databases, and AI development patterns.

---

## Architecture

```
User
  |
  | HTTPS
  v
React Frontend (Vite)          served from /src/ui/dist/
  |
  | /api/*
  v
Express.js Server              src/server/app.js  (port 3000)
  |
  | RAG Pipeline
  v
PostgresKnowledgeBase.js       Neon PostgreSQL + pgvector
  |  HybridSearch (BM25 + semantic)
  |  QueryExpander
  |  ReRanker
  |  ContextCompressor
  |  MultiHopRetriever
  v
knowledge_search() stored procedure
  HNSW index, 5-factor relevance scoring
  |
  v
ask_ruvnet.architecture_docs   54,543 entries
  embedding: real[] (384d, ONNX all-MiniLM-L6-v2)
  avg quality score: 92.1
  |
  | context + query
  v
Groq LLM                       llama-3.3-70b-versatile
  |
  v
Streamed response to user
```

### 5-Factor Relevance Scoring

Every search result is scored using five weighted signals before being passed to the LLM:

| Factor | Weight | Description |
|--------|--------|-------------|
| Semantic similarity | 40% | Cosine distance via HNSW (ONNX 384d embeddings) |
| Intent alignment | 20% | Query type matched to document intent |
| Source authority | 15% | Repository and document type ranking |
| Quality score | 15% | Per-entry gold-tier quality gate (avg 92.1) |
| Usefulness | 10% | Historical relevance signal |

### RAG Pipeline Modules

| Module | Location | Purpose |
|--------|----------|---------|
| PostgresKnowledgeBase | `src/core/PostgresKnowledgeBase.js` | Neon pgvector interface |
| HybridSearch | `src/core/HybridSearch.js` | BM25 + semantic fusion |
| QueryExpander | `src/core/QueryExpander.js` | Expands terse queries |
| ReRanker | `src/core/ReRanker.js` | Cross-encoder style reranking |
| ContextCompressor | `src/core/ContextCompressor.js` | Trims context to 16,000 tokens |
| MultiHopRetriever | `src/core/MultiHopRetriever.js` | Handles multi-step queries |

---

## Knowledge Base

| Stat | Value |
|------|-------|
| Total entries | 54,543 |
| Quality tier | Gold |
| Avg quality score | 92.1 / 100 |
| Embedding model | ONNX all-MiniLM-L6-v2 |
| Embedding dimensions | 384 |
| Index type | HNSW (pgvector) |
| Database | Neon PostgreSQL |
| Schema | ask_ruvnet |
| Table | architecture_docs |

### Topics Covered

- Agent orchestration (claude-flow, ruv-swarm, agentic-flow)
- Swarm topologies (hierarchical, mesh, ring, star, adaptive)
- Consensus protocols (Byzantine, Raft, CRDT, Gossip)
- Vector database patterns (HNSW, embeddings, similarity search)
- Memory architectures (episodic, semantic, working memory)
- RL algorithms (Decision Transformer, Actor-Critic, PPO, SAC)
- Deployment patterns (Docker, cloud, air-gapped)
- RuvNet npm package APIs and usage examples

---

## API Endpoints

### GET /health

Basic liveness check.

```bash
curl https://ask-ruvnet.onrender.com/health
```

Response:
```json
{ "status": "ok", "version": "2.1.1" }
```

### GET /api/knowledge

Returns knowledge base statistics.

```bash
curl https://ask-ruvnet.onrender.com/api/knowledge
```

Response includes entry count, quality metrics, and database connection status.

### POST /api/chat

Submit a question and receive a streamed answer grounded in the knowledge base.

```bash
curl -X POST https://ask-ruvnet.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What swarm topologies does claude-flow support?"}'
```

Request body:
```json
{
  "message": "string (required) — the user question"
}
```

The response is a JSON object with `answer` (string) and `sources` (array) fields.

### GET /api/kb-stats

Detailed knowledge base statistics including per-source breakdown.

```bash
curl https://ask-ruvnet.onrender.com/api/kb-stats
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (includes pgvector) |
| `GROQ_API_KEY` | Yes | API key for Groq LLM (llama-3.3-70b-versatile) |
| `NODE_ENV` | Yes | Set to `production` on Render |
| `PORT` | Yes | Server port — Render sets this to `3000` |

All variables except `DATABASE_URL` are configured in `render.yaml`. `DATABASE_URL` must be set manually in the Render dashboard because it contains credentials.

---

## Local Development

### Prerequisites

- Node.js 22+
- A Neon PostgreSQL database with the `ask_ruvnet` schema and `pgvector` extension
- A Groq API key (free tier at https://console.groq.com)

### Setup

```bash
# Clone the repository
git clone https://github.com/stuinfla/Ask-Ruvnet.git
cd Ask-Ruvnet

# Install backend dependencies
npm install

# Install and build the React frontend
npm run build

# Create a .env file with your credentials
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GROQ_API_KEY=gsk_your_key_here
NODE_ENV=development
PORT=3000
EOF

# Start the server
node src/server/app.js
```

The app runs at http://localhost:3000. The Express server serves the React frontend from `/src/ui/dist/` as static files — no separate frontend dev server needed for local testing.

### Rebuilding the Frontend

After editing files in `src/ui/src/`, rebuild before testing:

```bash
npm run build
# Then restart the server
node src/server/app.js
```

---

## Production Deployment (Render.com)

The application deploys automatically to Render.com from the `main` branch. The `render.yaml` file in the repository root is auto-detected by Render on first connect.

### render.yaml Summary

```yaml
services:
  - type: web
    name: ask-ruvnet
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: node src/server/app.js
    healthCheckPath: /health
    autoDeploy: true
```

### Deployment Steps

1. Push changes to the `main` branch:
   ```bash
   git push origin main
   ```

2. Render detects the push, runs `npm install && npm run build`, and starts the server with `node src/server/app.js`.

3. Verify the deployment:
   ```bash
   curl https://ask-ruvnet.onrender.com/health
   ```

### Setting Environment Variables on Render

In the Render dashboard, navigate to your service and open the Environment tab. Add:

- `DATABASE_URL` — paste the full Neon connection string
- `GROQ_API_KEY` — paste your Groq key

`NODE_ENV` and `PORT` are already defined in `render.yaml` and do not need to be set manually.

---

## Project Structure

```
Ask-Ruvnet/
├── src/
│   ├── server/
│   │   ├── app.js                     # Express server — main entry point
│   │   └── RuvPersona.js              # LLM system prompt and persona
│   ├── core/                          # RAG pipeline modules
│   │   ├── PostgresKnowledgeBase.js   # Neon pgvector interface
│   │   ├── HybridSearch.js            # BM25 + semantic fusion
│   │   ├── QueryExpander.js           # Query expansion
│   │   ├── ReRanker.js                # Result reranking
│   │   ├── ContextCompressor.js       # Context length management
│   │   ├── MultiHopRetriever.js       # Multi-step query handling
│   │   └── RuvectorStore.js           # Vector store abstraction
│   ├── storage/
│   │   ├── kb-embed.js                # Embedding utilities
│   │   └── persistent-vector-db.js    # Local vector DB (dev/testing)
│   └── ui/
│       ├── src/                       # React source (Vite)
│       └── dist/                      # Built frontend (served by Express)
├── scripts/                           # KB management and ingestion scripts
├── docs/                              # Documentation
├── render.yaml                        # Render.com deployment config
├── package.json                       # Dependencies — version source of truth
└── README.md                          # This file
```

---

## Version Management

The application version is stored in one place: `package.json`.

```json
{
  "name": "answerbot-builder",
  "version": "2.1.1"
}
```

The server and UI both import this value at runtime. To release a new version:

```bash
# Edit version in package.json, then:
git add package.json
git commit -m "v2.1.2: description of changes"
git push origin main
```

Use semantic versioning: `MAJOR.MINOR.PATCH`
- PATCH — bug fixes and small changes
- MINOR — new features, backward compatible
- MAJOR — breaking changes or significant rewrites

---

## Troubleshooting

### Chat returns no results

Check that `DATABASE_URL` is set correctly in the Render environment. The Neon connection string must include `?sslmode=require`. Test the database directly:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM ask_ruvnet.architecture_docs;"
```

Expected result: `54543`

### Frontend not loading

Verify the build completed successfully. The `dist/` directory must exist at `src/ui/dist/`. Run `npm run build` locally and check for errors.

### Groq API errors

Verify `GROQ_API_KEY` is set and valid. Test with:

```bash
curl https://ask-ruvnet.onrender.com/health
```

If the server is up but chat fails, check Render logs for `GROQ_API_KEY` authentication errors.

### Cold start delays

Render free-tier services spin down after inactivity. The first request after a cold start may take 30-60 seconds while the server restarts and loads the ONNX embedding model.

---

## License

MIT

---

## Author

**rUVnet**
- GitHub: [@ruvnet](https://github.com/ruvnet)
- Production: https://ask-ruvnet.onrender.com
