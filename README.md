# Ask-RuvNet

> Updated: 2026-03-28 | Version 4.12.0

**The front door to one of the most ambitious open-source AI architecture projects ever built.**

Ask-RuvNet is a RAG-powered knowledge interface for the RuVector ecosystem. It makes 200+ interconnected repositories, 114 Rust crates across 17 capability areas, and years of engineering decisions searchable, explainable, and visual -- powered by 502 expert-curated knowledge entries, HNSW vector search, and Claude Sonnet 4.6.

**Production:** https://ask-ruvnet.up.railway.app

---

## Architecture

Ask-RuvNet has no PostgreSQL dependency. The knowledge base lives in a single flat file (`kb-master.json`) and is compiled into RVF format for production.

```
kb-master.json (502 entries, source of truth)
  |
  +-> build-lean-rvf.mjs -----> knowledge.rvf (HNSW-indexed, content embedded)
  |                              + content-sidecar.json.gz
  |                              + .ruvector/knowledge-base/
  |
  +-> build-quantized-rvf.mjs -> SQ8 browser assets (knowledge-sq8.bin, knowledge-meta.json)
  |
  +-> export-mcp-kb.mjs ------> MCP server format (kb-data/)
  |
  +-> git push main -----------> Railway auto-deploys
```

### Key Stats

| Metric | Value |
|--------|-------|
| Knowledge entries | 502 (expert-curated, avg quality 97/100) |
| Rust crates covered | 114 across 17 capability areas |
| Technologies covered | 200+ |
| Embedding model | ONNX Xenova/all-MiniLM-L6-v2 |
| Embedding dimensions | 384 |
| Index type | HNSW (M=16, efConstruction=200, cosine) |
| Query latency | ~0.3ms (HNSW native) |
| Storage format | RVF cognitive container |
| External DB required | None |

### Three Consumers, One Source

```
kb-master.json (502 gold entries)
       |
       +---> knowledge.rvf         ---> Railway server (read-only, /api/search)
       |
       +---> SQ8 browser assets    ---> Browser client (WASM HNSW, ~5ms search)
       |
       +---> MCP embedded KB       ---> Claude Code MCP tools (kb_search, etc.)
```

Every consumer reads the same data compiled from the same source.

---

## Features

### RAG Pipeline

Every question goes through a multi-stage pipeline before reaching the LLM:

| Stage | Module | What It Does |
|-------|--------|-------------|
| 1. Expand | `QueryExpander` | Rewrites terse queries into richer search terms |
| 2. Search | `HybridSearch` | Combines BM25 keyword matching with semantic HNSW vector search |
| 3. Rank | `ReRanker` | Scores results using 5 weighted factors (semantic similarity 40%, intent alignment 20%, source authority 15%, quality score 15%, usefulness 10%) |
| 4. Compress | `ContextCompressor` | Trims context to fit the token window, preserving code blocks |
| 5. Retrieve | `MultiHopRetriever` | Follows cross-references for multi-step questions |

### 5-Model LLM Fallback Chain

Ask-RuvNet automatically detects configured API keys and builds a resilient fallback chain:

| Priority | Provider | Model | Notes |
|----------|----------|-------|-------|
| 1 | OpenRouter | claude-sonnet-4.6 | Multi-model gateway, primary |
| 2 | Anthropic | claude-sonnet-4.6 | Direct API |
| 3 | Groq | llama-3.3-70b-versatile | Free tier available |
| 4 | OpenAI | gpt-4o | Paid |
| 5 | DeepSeek | deepseek-chat | Last resort |

Set `LLM_PROVIDER` to override the primary.

### Interactive UI

- DIKW hero section with live ecosystem statistics
- Product on-ramp cards for exploring the ecosystem
- Mermaid diagram generation in responses
- Source citations with relevance scores and direct links
- Follow-up suggestion pills for deeper exploration
- Light and dark mode with proper theming
- Mobile-responsive layout with fullscreen canvas overlay

### RuVector Catalog

Interactive explorer at `/ruvector-catalog.html` showing all 114 crates across 17 capability areas. 47 detailed catalog entries covering every RuVector crate, with descriptions, use cases, and integration guidance.

### Installable Claude Code Skill

Users can install the `ruvector-catalog` skill to get RuVector technology recommendations directly in their own Claude Code sessions. The skill proactively activates when tasks could benefit from vector search, graph intelligence, self-learning, attention mechanisms, or other RuVector capabilities.

### RVF Cognitive Containers

Knowledge is packaged in the RVF (RuVector Format) cognitive container format:
- Crypto file identity and provenance tracking
- Segmented binary with vectors, HNSW index, and metadata
- Forward-compatible (unknown segments preserved)
- Self-contained -- no external database needed at runtime

---

## Getting Started

### Prerequisites

- Node.js 22+
- At least one LLM API key (Groq free tier works)

### Setup

```bash
git clone https://github.com/stuinfla/Ask-Ruvnet.git
cd Ask-Ruvnet

# Install backend dependencies
npm install

# Install frontend dependencies
cd src/ui && npm install && cd ../..

# Build the knowledge base from kb-master.json (no PostgreSQL needed)
node scripts/build-lean-rvf.mjs
node scripts/build-quantized-rvf.mjs

# Build the frontend
cd src/ui && npm run build && cd ../..

# Create .env with your credentials
cp .env.example .env
# Edit .env: set at least one LLM API key

# Start the server
node src/server/app.js
```

The app runs at http://localhost:3000.

---

## KB Management

The knowledge base source of truth is `kb-master.json` -- a flat JSON file with 502 expert-curated entries. No PostgreSQL required.

```bash
# Summary of KB contents
node scripts/kb-inspect.mjs

# Search the KB
node scripts/kb-inspect.mjs --search "attention mechanisms"

# Category breakdown
node scripts/kb-inspect.mjs --categories

# Add catalog entries
node scripts/ingest-catalog.mjs
```

### Build Commands (Run in Order)

```bash
node scripts/build-lean-rvf.mjs       # kb-master.json -> .ruvector/ + knowledge.rvf + sidecar
node scripts/build-quantized-rvf.mjs   # .ruvector/ -> SQ8 browser assets
cd src/ui && npm run build && cd ../.. # Frontend with quantized assets
```

### Entry Categories (502 entries)

teaching, videos, wasm-local-llm, agents, general, security, architecture, vector-db, neural, algorithms, deployment, performance, swarms, RL, memory, sparc, and catalog entries covering 114 Rust crates.

---

## Deployment

### Railway (Production)

| Item | Value |
|------|-------|
| Platform | Railway |
| Container | Docker (node:22-bookworm-slim) |
| Auto-deploy | Yes (push to `main`) |
| URL | https://ask-ruvnet.up.railway.app |

### Deploy

```bash
bash scripts/deployment/deploy.sh patch   # Bug fix: bump, build, push
bash scripts/deployment/deploy.sh minor   # New feature
bash scripts/deployment/deploy.sh major   # Breaking change
# Railway auto-deploys from main
```

### Verifying a Deployment

```bash
# Health check
curl https://ask-ruvnet.up.railway.app/health

# KB status
curl https://ask-ruvnet.up.railway.app/api/kb-stats

# LLM providers
curl https://ask-ruvnet.up.railway.app/api/providers
```

---

## API Reference

### GET /health

```bash
curl https://ask-ruvnet.up.railway.app/health
```

```json
{ "status": "ok", "version": "4.12.0" }
```

### POST /api/chat

Submit a question and receive a grounded answer with source citations.

```bash
curl -X POST https://ask-ruvnet.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What swarm topologies does ruflo support?"}'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | The user's question |

**Response:** JSON object with `answer` (string) and `sources` (array).

### POST /api/visualize

Generate an architectural visualization using Gemini.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `concept` | string | Yes | What to visualize |
| `style` | string | No | Visual style hint |
| `resolution` | string | No | `"1K"` or `"2K"` (default: `"1K"`) |

### POST /api/special

Perform special actions: `simplify`, `code`, `diagram`, or `visualize`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | `simplify`, `code`, `diagram`, or `visualize` |
| `content` | string | Yes | The content to act on |

### Other Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/providers` | Active LLM fallback chain |
| `GET /api/kb-stats` | Knowledge base status and entry counts |
| `GET /api/ecosystem-stats` | Aggregated RuVector ecosystem statistics |
| `GET /api/latest-repos` | Live npm version data for ecosystem packages |
| `POST /api/learn` | Submit feedback to improve answer quality |

---

## Environment Variables

### LLM Providers (at least one required)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq (free tier: 1M tokens/day) |
| `OPENAI_API_KEY` | OpenAI (gpt-4o) |
| `ANTHROPIC_API_KEY` | Anthropic (Claude Sonnet 4.6). Also accepts `CLAUDE_API_KEY`. |
| `OPENROUTER_API_KEY` | OpenRouter multi-model gateway |
| `DEEPSEEK_API_KEY` | DeepSeek |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | auto-detect | Override the primary provider |
| `GEMINI_API_KEY` | -- | Gemini API key for visualization |
| `NODE_ENV` | `development` | Set to `production` on Railway |
| `PORT` | `3000` | Server port |

---

## What You Can Ask

**Architecture and Design**
- "What swarm topologies does Ruflo support?"
- "How does SONA achieve sub-millisecond adaptation?"
- "Explain the RVF cognitive container format"

**Practical Usage**
- "How do I set up a hierarchical swarm with 8 agents?"
- "Show me how to use RuVector HNSW indexing"
- "What crates are available for attention mechanisms?"

**Decision-Making**
- "When should I use mesh topology vs hierarchical?"
- "What are the tradeoffs between RuVector-WASM and RuVector-Postgres?"
- "Which consensus protocol should I use for my use case?"

**Deep Technical**
- "How does the ReasoningBank implement self-learning with LoRA?"
- "Explain EWC++ and how it prevents catastrophic forgetting"
- "What Rust crates does the ecosystem depend on?"

---

## The Big Picture

Ruben Cohen (rUv) has built an ecosystem of interlocking AI systems spanning agent orchestration, self-learning vector databases, graph neural networks, cognitive containers, distributed swarm intelligence, and neuromorphic computing.

Across **200+ repositories** in three GitHub organizations (ruvnet, openclaw, VibiumDev), the RuVector ecosystem covers:

- **Agent orchestration** -- Ruflo, ruv-swarm, agentic-flow
- **Vector databases** -- RuVector (114 Rust crates: PostgreSQL-native, WASM, neuromorphic)
- **Self-learning AI** -- SONA, AIMDS, ReasoningBank, LoRA adapters
- **Cognitive containers** -- RVF format (24-segment, self-booting, 5.5KB WASM)
- **Graph intelligence** -- GNN, min-cut analysis, Louvain community detection
- **Distributed consensus** -- Byzantine, Raft, CRDT, Gossip protocols

Ask-RuvNet is the knowledge interface for all of it.

---

## Project Structure

```
Ask-Ruvnet/
+-- kb-master.json                       # Source of truth (502 entries, flat file)
+-- knowledge.rvf                        # HNSW-indexed binary KB
+-- content-sidecar.json.gz              # Full-text content for RVF entries
+-- src/
|   +-- server/
|   |   +-- app.js                       # Express server, all endpoints
|   |   +-- RuvPersona.js                # LLM system prompt and persona
|   +-- core/                            # RAG pipeline modules
|   |   +-- RvfStore.js                  # Primary KB backend (RVF HNSW search)
|   |   +-- HybridSearch.js              # BM25 + semantic fusion
|   |   +-- QueryExpander.js             # Query expansion
|   |   +-- ReRanker.js                  # 5-factor result reranking
|   |   +-- ContextCompressor.js         # Context length management
|   |   +-- MultiHopRetriever.js         # Multi-step query handling
|   +-- ui/
|       +-- src/                         # React source (Vite)
|       +-- dist/                        # Built frontend
+-- scripts/
|   +-- build-lean-rvf.mjs              # kb-master.json -> RVF
|   +-- build-quantized-rvf.mjs         # RVF -> SQ8 browser assets
|   +-- export-mcp-kb.mjs              # RVF -> MCP format
|   +-- kb-inspect.mjs                  # KB inspection and search
|   +-- ingest-catalog.mjs             # Add catalog entries
|   +-- deployment/
|       +-- deploy.sh                   # Version bump + build + push
+-- bin/
|   +-- mcp-server.js                   # MCP server (embedded-only mode)
+-- kb-data/                             # MCP server data (generated)
+-- Dockerfile                           # Railway Docker build
+-- package.json                         # Version source of truth
+-- README.md                            # This file
```

---

## Troubleshooting

**Chat returns generic answers or no results**
Check `/api/kb-stats` -- it should show `"connected": true` with a non-zero vector count. If the count is 0, the RVF knowledge base was not loaded. Run `node scripts/build-lean-rvf.mjs` to rebuild.

**Frontend not loading**
Run `cd src/ui && npm run build` and check for errors. The `dist/` directory must exist at `src/ui/dist/`.

**All LLM providers failing**
Check `/api/providers` to see which are configured. At least one API key must be set.

**Visualization not generating**
The `/api/visualize` endpoint requires a Gemini API key. Check that `GEMINI_API_KEY` is set.

---

## Deployment History

| Date | Version | Change |
|------|---------|--------|
| 2026-03-28 | 4.12.0 | 502 entries, kb-master.json flat-file architecture (no PG dependency), RuVector Catalog (114 crates, 17 capability areas), installable Claude Code skill, 47 catalog entries |
| 2026-03-19 | 4.10.0 | 434 gold entries, auto-curation pipeline, verification suite (36 checks, 7 layers) |
| 2026-03-14 | 4.0.1 | Ground-up v4 redesign, DIKW framework, PaperBanana illustrations, RVF-first pipeline |
| 2026-03-07 | 3.5.0 | NotebookLM studio pipeline, Ruflo rebrand |
| 2026-03-03 | 3.3.0 | RVF Cognitive Container with Transformers.js semantic search |
| 2026-03-02 | 3.2.0 | RVF-first architecture, zero external DB dependency |
| 2026-03-01 | 3.0.0 | Complete visual overhaul: glassmorphism, aurora background, stats bar |
| 2026-02-27 | 2.2.0 | Rich responses with source citations, evolutionary knowledge |
| 2026-02-23 | 2.1.2 | Multi-provider LLM fallback chain |
| 2026-01-14 | 2.0.0 | PostgreSQL KB wired to chat engine |

---

## Contributing

Contributions are welcome -- especially around knowledge coverage, RAG pipeline improvements, and frontend UX.

1. Fork the repository
2. Create a feature branch
3. Run `cd src/ui && npm run build` and verify no errors before submitting
4. Open a pull request against `main`

---

## Author

**Ruben Cohen (rUv)**
- GitHub: [@ruvnet](https://github.com/ruvnet)
- Ecosystem: 200+ repositories across [ruvnet](https://github.com/ruvnet), [openclaw](https://github.com/openclaw), [VibiumDev](https://github.com/VibiumDev)

**Maintained by:** [@stuinfla](https://github.com/stuinfla)
**Production:** https://ask-ruvnet.up.railway.app

---

## License

MIT
