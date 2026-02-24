# AskRuvNet - AI Knowledge Base Assistant

> Updated: 2026-02-24 | Version 2.1.5

**Production URL:** https://ask-ruvnet-production.up.railway.app
**npm package name:** answerbot-builder
**Deployment Platform:** Railway (Hobby plan, Docker, always-on)

AskRuvNet is an AI-powered assistant that answers questions about the RuvNet ecosystem. It combines a 54,543-entry gold-tier knowledge base stored in Neon PostgreSQL with a 5-provider LLM fallback chain to deliver accurate, context-grounded responses about RuvNet packages, agent orchestration, vector databases, and AI development patterns.

---

## Architecture

```
                          ┌─────────────────────┐
                          │       User           │
                          └──────────┬──────────┘
                                     │ HTTPS
                                     ▼
                    ┌────────────────────────────────┐
                    │  Railway (Hobby Plan, $5/mo)   │
                    │  Docker container, always-on   │
                    │  Region: us-west-2             │
                    │  Auto-deploy on push to main   │
                    └──────────┬─────────────────────┘
                               │
                    ┌──────────▼─────────────────────┐
                    │   Express.js Server (port 3000)│
                    │   src/server/app.js             │
                    └──────┬───────────┬─────────────┘
                           │           │
              ┌────────────▼──┐   ┌────▼──────────────────┐
              │ LLM Provider  │   │  RAG Pipeline          │
              │ Fallback Chain│   │                        │
              │               │   │  HybridSearch          │
              │ 1. groq-free  │   │  (BM25 + semantic)     │
              │ 2. openai     │   │        │               │
              │ 3. anthropic  │   │  QueryExpander         │
              │ 4. openrouter │   │        │               │
              │ 5. deepseek   │   │  ReRanker              │
              └───────┬───────┘   │        │               │
                      │           │  ContextCompressor     │
                      │           │        │               │
                      │           │  MultiHopRetriever     │
                      │           └────────┬───────────────┘
                      │                    │
                      │           ┌────────▼───────────────┐
                      │           │  PostgresKnowledgeBase  │
                      │           │  Neon PostgreSQL        │
                      │           │  + pgvector HNSW        │
                      │           │  54,543 entries         │
                      │           │  384d ONNX embeddings   │
                      │           └────────────────────────┘
                      │
              ┌───────▼───────┐
              │ Streamed      │
              │ Response      │
              └───────────────┘
```

### Multi-Provider LLM Fallback Chain

The app automatically detects all configured API keys and builds a fallback chain. If one provider is rate-limited or fails, it tries the next.

| Priority | Provider | Model | Notes |
|----------|----------|-------|-------|
| 1 | groq-free | llama-3.3-70b-versatile | Free tier (1M tokens/day) |
| 2 | openai | gpt-4o | Paid |
| 3 | anthropic | claude-sonnet-4 | Paid |
| 4 | openrouter | anthropic/claude-sonnet-4 | Multi-model gateway |
| 5 | deepseek | deepseek-chat | Paid |

Set `LLM_PROVIDER` to override the primary. Add `GROQ_PAID_API_KEY` to insert a paid Groq tier between free Groq and OpenAI.

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
| Gold tier entries | 22,667 |
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
curl https://ask-ruvnet-production.up.railway.app/health
```

Response:
```json
{ "status": "ok", "version": "2.1.5" }
```

### GET /api/providers

Returns the active LLM fallback chain.

```bash
curl https://ask-ruvnet-production.up.railway.app/api/providers
```

Response:
```json
{
  "providers": [
    {"name": "groq-free", "model": "llama-3.3-70b-versatile"},
    {"name": "openai", "model": "gpt-4o"},
    {"name": "anthropic", "model": "claude-sonnet-4-20250514"},
    {"name": "openrouter", "model": "anthropic/claude-sonnet-4"},
    {"name": "deepseek", "model": "deepseek-chat"}
  ],
  "primary": "groq-free",
  "fallbackChain": "groq-free → openai → anthropic → openrouter → deepseek",
  "configured": 5
}
```

### GET /api/kb-stats

Knowledge base statistics.

```bash
curl https://ask-ruvnet-production.up.railway.app/api/kb-stats
```

### GET /api/knowledge

Returns knowledge base statistics (alias for kb-stats).

### POST /api/chat

Submit a question and receive a streamed answer grounded in the knowledge base.

```bash
curl -X POST https://ask-ruvnet-production.up.railway.app/api/chat \
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

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (includes pgvector). Must end with `?sslmode=require`. |

### LLM Providers (at least one required)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq free tier (1M tokens/day). Primary provider. |
| `GROQ_PAID_API_KEY` | Groq paid tier. Used after free tier exhausted. |
| `OPENAI_API_KEY` | OpenAI API key (gpt-4o). |
| `ANTHROPIC_API_KEY` | Anthropic API key. Also accepts `CLAUDE_API_KEY`. |
| `OPENROUTER_API_KEY` | OpenRouter API key. |
| `DEEPSEEK_API_KEY` | DeepSeek API key. |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | auto-detect | Override the primary provider. |
| `NODE_ENV` | `development` | Set to `production` on Railway. |
| `PORT` | `3000` | Server port. |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Override Groq model. |
| `OPENAI_MODEL` | `gpt-4o` | Override OpenAI model. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Override Anthropic model. |

---

## Local Development

### Prerequisites

- Node.js 22+
- A Neon PostgreSQL database with the `ask_ruvnet` schema and `pgvector` extension
- At least one LLM API key (Groq free tier recommended: https://console.groq.com)

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
cp .env.example .env
# Edit .env with your actual API keys and DATABASE_URL

# Start the server
node src/server/app.js
```

The app runs at http://localhost:3000. The Express server serves the React frontend from `/src/ui/dist/` as static files.

### Rebuilding the Frontend

After editing files in `src/ui/src/`, rebuild before testing:

```bash
npm run build
# Then restart the server
node src/server/app.js
```

---

## Production Deployment (Railway)

### Platform Details

| Item | Value |
|------|-------|
| Platform | Railway (Hobby plan, $5/month) |
| Container | Docker (node:22-bookworm-slim) |
| Region | us-west-2 |
| Always-on | Yes (no cold starts) |
| Auto-deploy | Yes (on push to main) |
| Production URL | https://ask-ruvnet-production.up.railway.app |

### How It Works

1. Push to `main` triggers Railway auto-deploy via GitHub integration.
2. Railway builds the Docker image from `Dockerfile`.
3. The container starts via `scripts/deployment/start-railway.sh`.
4. The startup script verifies `DATABASE_URL` is set, then runs `node src/server/app.js`.

### Railway Project IDs

| Resource | ID |
|----------|------|
| Project | `8344da50-ba32-4973-abb5-c73dd11ca69d` |
| Service | `e10d03b5-bc26-47c2-8ae9-3d444a083560` |
| Environment | `3e37ece4-3af3-4be5-94e6-c61b9983e95e` |

### Managing Railway via GraphQL API

The Railway CLI requires account-scoped tokens (not available on Hobby plan). Use the GraphQL API instead with a project-scoped token:

```bash
# Check deployment status
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RAILWAY_TOKEN" \
  -d '{"query": "{ deployments(first: 1, input: { projectId: \"8344da50-ba32-4973-abb5-c73dd11ca69d\", environmentId: \"3e37ece4-3af3-4be5-94e6-c61b9983e95e\", serviceId: \"e10d03b5-bc26-47c2-8ae9-3d444a083560\" }) { edges { node { id status createdAt } } } }"}'

# Read environment variables
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RAILWAY_TOKEN" \
  -d '{"query": "{ variables(projectId: \"8344da50-ba32-4973-abb5-c73dd11ca69d\", environmentId: \"3e37ece4-3af3-4be5-94e6-c61b9983e95e\", serviceId: \"e10d03b5-bc26-47c2-8ae9-3d444a083560\") }"}'

# Set an environment variable (triggers auto-redeploy)
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RAILWAY_TOKEN" \
  -d '{"query": "mutation { variableUpsert(input: { projectId: \"8344da50-ba32-4973-abb5-c73dd11ca69d\", environmentId: \"3e37ece4-3af3-4be5-94e6-c61b9983e95e\", serviceId: \"e10d03b5-bc26-47c2-8ae9-3d444a083560\", name: \"VAR_NAME\", value: \"VAR_VALUE\" }) }"}'
```

### Verifying a Deployment

```bash
# Check health
curl https://ask-ruvnet-production.up.railway.app/health

# Check KB connection (should show connected: true, total: 54543)
curl https://ask-ruvnet-production.up.railway.app/api/kb-stats

# Check LLM providers
curl https://ask-ruvnet-production.up.railway.app/api/providers
```

### Setting Environment Variables

Set variables in the Railway dashboard under your service > **Variables** tab. Or use the GraphQL API as shown above.

**Critical**: The variable name must be `DATABASE_URL` (with underscore), not `DATABASE-URL` (with hyphen). Environment variable names with hyphens are not accessible via `process.env`.

---

## Neon Database

| Item | Value |
|------|-------|
| Project | ask-ruvnet-kb (fragrant-math-26433511) |
| Host | ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech |
| Database | neondb |
| Schema | ask_ruvnet |
| Table | architecture_docs (54,543 rows) |
| Extension | pgvector |
| Index | HNSW (m=16, ef_construction=64) |
| Stored procedure | ask_ruvnet.knowledge_search() |

### Verifying the Database

```bash
psql "postgresql://neondb_owner:PASSWORD@ep-holy-pine-aksbss0s.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require" \
  -c "SELECT COUNT(*) FROM ask_ruvnet.architecture_docs;"
# Expected: 54543
```

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
│   │   └── RuvectorStore.js           # Vector store abstraction (local fallback)
│   ├── storage/
│   │   ├── kb-embed.js                # Embedding utilities
│   │   └── persistent-vector-db.js    # Local vector DB (dev/testing)
│   └── ui/
│       ├── src/                       # React source (Vite)
│       └── dist/                      # Built frontend (served by Express)
├── scripts/
│   └── deployment/
│       └── start-railway.sh           # Docker/Railway startup script
├── docs/                              # Documentation
├── Dockerfile                         # Railway Docker build
├── package.json                       # Dependencies — version source of truth
└── README.md                          # This file
```

---

## Version Management

The application version is stored in one place: `package.json`.

```json
{
  "name": "answerbot-builder",
  "version": "2.1.5"
}
```

The server and UI both import this value at runtime. To release a new version:

```bash
npm version patch  # or minor, or major
git push origin main
# Railway auto-deploys from main
```

Use semantic versioning: `MAJOR.MINOR.PATCH`
- PATCH — bug fixes and small changes
- MINOR — new features, backward compatible
- MAJOR — breaking changes or significant rewrites

---

## Troubleshooting

### Chat returns no results or generic answers

Check that `DATABASE_URL` is set correctly in Railway Variables. Common mistake: using a hyphen (`DATABASE-URL`) instead of an underscore (`DATABASE_URL`). Test the database directly:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM ask_ruvnet.architecture_docs;"
```

Expected result: `54543`

Also check `/api/kb-stats` — it should show `"connected": true`.

### Frontend not loading

Verify the build completed successfully. The `dist/` directory must exist at `src/ui/dist/`. Run `npm run build` locally and check for errors.

### LLM provider errors

Check `/api/providers` to see which providers are configured. The app tries each in order and falls to the next on failure. If all providers fail, check that at least one API key is set in Railway Variables.

### Railway deploy fails

Check Railway deploy logs in the dashboard. Common causes:
- Missing system dependencies (Dockerfile handles these)
- npm install failures (try `--legacy-peer-deps`)
- Missing `scripts/deployment/start-railway.sh`

---

## Deployment History

| Date | Version | Change |
|------|---------|--------|
| 2026-02-24 | 2.1.5 | Fixed DATABASE_URL (hyphen→underscore), decommissioned Render, Railway-only |
| 2026-02-23 | 2.1.4 | Recreated start-railway.sh, fixed Railway 502 |
| 2026-02-23 | 2.1.3 | Removed Travel Hacking and RetireWell domains |
| 2026-02-23 | 2.1.2 | Multi-provider LLM fallback chain (5 providers) |
| 2026-02-21 | 2.1.1 | Initial Render deployment with PostgreSQL KB |
| 2026-01-14 | 2.0.0 | PostgreSQL KB wired to chat engine |

---

## License

MIT

---

## Author

**rUVnet**
- GitHub: [@ruvnet](https://github.com/ruvnet)
- Production: https://ask-ruvnet-production.up.railway.app
