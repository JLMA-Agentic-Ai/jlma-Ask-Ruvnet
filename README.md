# Ask-RuvNet

> Updated: 2026-03-01 | Version 3.1.0

**The front door to one of the most ambitious open-source AI architecture projects ever built.**

Ask-RuvNet is a RAG-powered knowledge assistant that makes 150+ interconnected repositories, 26 architecture decision records, and years of engineering decisions searchable, explainable, and visual. It exists because understanding an ecosystem this large should not require reading 170,000 documents.

**Production:** https://ask-ruvnet-production.up.railway.app

---

## What's New in v3.1.0

### Resource Drawer

In v3.0, once a user sent their first message, the landing screen (capability tiles, resource documents, prompt starters) disappeared with no way to access them again short of starting a new conversation. v3.1 adds a **Resource Drawer** — a collapsible panel accessible via a folder icon (📂) in the chat input area. The drawer contains all four capability tiles (Videos, Decks, Knowledge Universe, KB) and all five resource documents (four PDFs + one video), available at any point during a conversation. Tapping any item opens it and auto-closes the drawer.

### Light Mode Contrast Fixes

Light mode in v3.0 had washed-out borders on source cards, action buttons, follow-up pills, and the input field. v3.1 adds targeted CSS overrides for `.light-mode` elements with proper border colors (`#d6d3d1`), subtle shadows, and improved text contrast so the interface remains readable and visually distinct in both themes.

### Mobile Polish

The resource drawer adapts to mobile viewports (375px–768px) with a compact 4-icon capability row and stacked resource cards. Canvas views on mobile now use a fullscreen overlay (`position: fixed; z-index: 100`) instead of the desktop split-panel layout, preventing the chat from being squeezed to unusable widths on small screens.

---

## What's New in v3.0.0

### Complete Visual Overhaul

v3.0 is a ground-up redesign of the Ask-RuvNet frontend. The interface moves from a conventional chat layout to an immersive, modern experience built around glassmorphism, animated gradients, and color-coded visual hierarchy.

### v3.0 Visual Design

**Capability Tiles** -- The landing screen presents four capability tiles (Videos, CEO/CTO Decks, Knowledge Universe, KB) as glassmorphism cards with frosted-glass backgrounds, layered shadows, and color-coded accents. Each tile uses a distinct accent color (red, blue, purple, amber) to establish visual identity at a glance.

**Aurora Background** -- The entire interface sits on an animated aurora background with layered radial gradients that shift continuously. This replaces the static dark background from v2.x and gives the application a sense of depth and motion.

**Stats Bar** -- A persistent stats bar displays live ecosystem data (repository count, KB entries, architecture decisions, quality score) directly on the landing screen. Users see the scale of the knowledge base before asking their first question.

**Prompt Starters** -- Six prompt starters (up from four in v2.x) are displayed as pill-shaped buttons below the input field. Each starter is written to demonstrate a different query style: architecture, practical usage, decision-making, evolution, deep technical, and ecosystem overview.

**Resource Documents Grid** -- A grid of resource cards (four PDFs and one video) appears below the capability tiles. Each card links to a specific document or media asset with a descriptive label and file-type indicator.

**Follow-Up Suggestion Pills** -- After the assistant responds, a row of contextual follow-up suggestions appears as clickable pills beneath the answer. These are generated based on the response content and guide the user toward deeper exploration.

**Gradient Text and Layered Shadows** -- Section headers and key labels use CSS gradient text (linear gradients across the text fill). Cards and interactive elements use multi-layer box shadows for a lifted, dimensional appearance.

**Staggered Entrance Animations** -- Capability tiles, prompt starters, and resource cards animate in with staggered delays on page load. Each element fades up and slides into position sequentially, creating a polished reveal sequence.

**Color-Coded Accent System** -- A four-color accent system (red, blue, purple, amber) is applied consistently across capability tiles, source badges, and interactive elements. Each color maps to a content category, making the interface scannable without reading labels.

### Retained from v2.x

The following features from v2.x remain fully intact in v3.0:

- **Rich responses with source citations** -- inline GitHub links, doc-type awareness, Related Resources and Explore Further sections
- **Source cards** -- clickable cards with doc-type badges, relevance scores, and direct GitHub links
- **Evolutionary knowledge ingestion** -- 13,192 chunks across 173 repositories and 3 GitHub organizations
- **Full pipeline command** -- `npm run kb:full` runs the complete ingestion pipeline
- **Gemini visual integration** -- Visualize button generates architectural diagrams via Gemini 2.0 Flash
- **Markdown link styling** -- properly styled, clickable hyperlinks in chat responses

---

## The Big Picture

Ruben Cohen (rUv) has spent years building something unusual: not a single AI product, but an entire *ecosystem* of interlocking systems that span agent orchestration, self-learning vector databases, graph neural networks, cognitive containers, distributed swarm intelligence, and neuromorphic computing.

Across **173 repositories** in three GitHub organizations (ruvnet, openclaw, VibiumDev), the RuVNet ecosystem covers:

- **Agent orchestration** -- Claude Flow v3, ruv-swarm, agentic-flow
- **Vector databases** -- RuVector (PostgreSQL-native, WASM, neuromorphic)
- **Self-learning AI** -- SONA, AIMDS, ReasoningBank, LoRA adapters
- **Cognitive containers** -- RVF format (24-segment, self-booting, 5.5KB WASM)
- **Graph intelligence** -- GNN, min-cut analysis, Louvain community detection
- **Synthetic data** -- Agentic Synth, procedural generation
- **Distributed consensus** -- Byzantine, Raft, CRDT, Gossip protocols
- **Robotics** -- ROS3 (Rust-native robot operating system)

The problem is obvious: no human can hold all of this in their head. Ask-RuvNet is the solution. It ingests everything -- READMEs, changelogs, ADRs, commit messages, release notes, code structure -- and makes it conversational.

Ask a question. Get an answer grounded in the actual codebase, not in an LLM's stale training data.

---

## The Five-Layer Architecture

The RuVNet ecosystem is organized into five layers. Each layer builds on the one below it.

![Five-Layer Architecture](assets/diagrams/five-layer-architecture.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATIONS                          │
│  Ask-RuvNet  Flow-Nexus  Neural Trader  Agentics Hub    │
│  (User-facing products built on the stack below)        │
├─────────────────────────────────────────────────────────┤
│                   ORCHESTRATION                          │
│  Claude Flow v3    ruv-swarm    Hive-Mind Consensus     │
│  60+ agent types   5 topologies   BFT / Raft / CRDT    │
│  (Multi-agent coordination, swarm intelligence)         │
├─────────────────────────────────────────────────────────┤
│                   INTELLIGENCE                           │
│  SONA     AIMDS      ReasoningBank     RVF Containers   │
│  <0.05ms  3-layer    Self-learning     24-segment       │
│  adapt    security   with LoRA/EWC++   cognitive fmt    │
│  (Self-learning, security, neural adaptation)           │
├─────────────────────────────────────────────────────────┤
│                      DATA                                │
│  RuVector-Postgres   RuVector-WASM    AgentDB           │
│  290+ SQL functions  <400KB browser   Hybrid memory     │
│  HNSW 150x-12500x   Zero backend     Episodic/semantic │
│  (Vector storage, similarity search, agent memory)      │
├─────────────────────────────────────────────────────────┤
│                   FOUNDATION                             │
│  ONNX Runtime    Rust Crates (80+)    WASM/SIMD        │
│  384d embeddings  Tensor Compress     Micro-HNSW 7.2KB │
│  (Low-level compute, embeddings, edge deployment)       │
└─────────────────────────────────────────────────────────┘
```

</details>

Ask-RuvNet sits at the **Applications** layer. It reaches down through every layer to answer questions about any part of the stack.

---

## How It Works

### From GitHub to Answer: The Knowledge Flow

![Knowledge Flow: From GitHub to Answer](assets/diagrams/knowledge-flow.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  173 GitHub Repos                    26 ADRs
  (ruvnet, openclaw, VibiumDev)      (Claude Flow v3 decisions)
        │                                  │
        ▼                                  ▼
  ┌──────────────────────────────────────────────┐
  │          Evolution Ingestion Pipeline         │
  │                                              │
  │  READMEs ─┐                                  │
  │  Changelogs ──┐                              │
  │  Releases ──────► Chunk + Embed + Score      │
  │  Commits ─────┘       │                      │
  │  ADRs ────────┘       │                      │
  │                       ▼                      │
  │            ONNX all-MiniLM-L6-v2             │
  │            384-dimensional embeddings        │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │       Neon PostgreSQL + pgvector (HNSW)       │
  │                                              │
  │   170,542+ entries across ask_ruvnet schema  │
  │   Gold-tier quality gate (avg 92.1/100)      │
  │   HNSW index (m=16, ef_construction=64)      │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │              RAG Pipeline                     │
  │                                              │
  │   User Question                              │
  │        │                                     │
  │        ▼                                     │
  │   QueryExpander (expand terse queries)       │
  │        │                                     │
  │        ▼                                     │
  │   HybridSearch (BM25 + semantic fusion)      │
  │        │                                     │
  │        ▼                                     │
  │   ReRanker (5-factor relevance scoring)      │
  │        │                                     │
  │        ▼                                     │
  │   ContextCompressor (fit 16K token window)   │
  │        │                                     │
  │        ▼                                     │
  │   MultiHopRetriever (follow-up retrieval)    │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │         LLM Fallback Chain (5 providers)      │
  │                                              │
  │   groq-free ──► openai ──► anthropic         │
  │                               │              │
  │            openrouter ◄───────┘              │
  │                │                             │
  │                ▼                              │
  │            deepseek                          │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
              Grounded Answer
              (with source citations)
```

</details>

### The RAG Pipeline in Detail

Every question goes through five stages before reaching the LLM.

| Stage | Module | What It Does |
|-------|--------|-------------|
| 1. Expand | `QueryExpander` | Rewrites terse queries into richer search terms |
| 2. Search | `HybridSearch` | Combines BM25 keyword matching with semantic vector search |
| 3. Rank | `ReRanker` | Scores results using 5 weighted factors (see below) |
| 4. Compress | `ContextCompressor` | Trims context to 16,000 tokens, preserving code blocks |
| 5. Retrieve | `MultiHopRetriever` | Follows cross-references for multi-step questions |

### 5-Factor Relevance Scoring

Every search result is scored before being passed to the LLM:

![5-Factor Relevance Scoring](assets/diagrams/relevance-scoring.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  ┌───────────────────────────────────────┐
  │         RELEVANCE SCORE               │
  │                                       │
  │  Semantic similarity ████████  40%    │
  │  (HNSW cosine, 384d ONNX)            │
  │                                       │
  │  Intent alignment   ████      20%    │
  │  (query type ↔ doc intent)            │
  │                                       │
  │  Source authority    ███       15%    │
  │  (repo + doc type ranking)            │
  │                                       │
  │  Quality score      ███       15%    │
  │  (gold-tier gate, avg 92.1)           │
  │                                       │
  │  Usefulness         ██        10%    │
  │  (historical relevance signal)        │
  └───────────────────────────────────────┘
```

</details>

---

## What You Can Ask

Ask-RuvNet handles questions across the entire ecosystem. Here are some starting points:

**Architecture and Design**
- "What swarm topologies does Claude Flow support?"
- "How does SONA achieve sub-millisecond adaptation?"
- "Explain the RVF cognitive container format"

**Practical Usage**
- "How do I set up a hierarchical swarm with 8 agents?"
- "Show me how to use RuVector HNSW indexing in PostgreSQL"
- "What npm packages do I need for agentic-flow?"

**Decision-Making**
- "When should I use mesh topology vs hierarchical?"
- "What are the tradeoffs between RuVector-WASM and RuVector-Postgres?"
- "Which consensus protocol should I use for my use case?"

**Evolution and History**
- "What changed in Claude Flow v3 alpha.118?"
- "What ADRs were written about memory architecture?"
- "Show me the release history for ruv-swarm"

**Deep Technical**
- "How does the ReasoningBank implement self-learning with LoRA?"
- "Explain EWC++ and how it prevents catastrophic forgetting"
- "What Rust crates does the ecosystem depend on?"

---

## See It, Don't Just Read It

Ask-RuvNet includes Gemini-powered architectural visualization. Instead of reading a text description of how swarm topologies work, you can generate a visual diagram on the spot.

![Visualization Flow](assets/diagrams/visualization-flow.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  User asks about              Gemini generates
  swarm topologies             architectural diagram
        │                            │
        ▼                            ▼
  ┌────────────┐    ┌───────────────────────────┐
  │ "Visualize │    │                           │
  │  how mesh  │───►│   Gemini 2.0 Flash        │
  │  topology  │    │   (Image Generation)       │
  │  works"    │    │         │                  │
  └────────────┘    │         ▼                  │
                    │   1K or 2K resolution      │
                    │   architectural diagram    │
                    │         │                  │
                    │         ▼                  │
                    │   Served at                │
                    │   /generated_imgs/         │
                    └───────────────────────────┘
```

</details>

### Visualization API

```bash
curl -X POST https://ask-ruvnet-production.up.railway.app/api/visualize \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "hierarchical swarm with queen coordination",
    "style": "technical-blueprint",
    "resolution": "2K"
  }'
```

This is also available through the **Special Actions** endpoint using `action: "visualize"`:

```bash
curl -X POST https://ask-ruvnet-production.up.railway.app/api/special \
  -H "Content-Type: application/json" \
  -d '{"action": "visualize", "content": "HNSW graph traversal"}'
```

---

## The Knowledge Base

### By the Numbers

| Metric | Value |
|--------|-------|
| Total KB entries | 170,542+ |
| Evolutionary knowledge chunks | 13,192 |
| Repositories ingested | 173 |
| GitHub organizations | 3 (ruvnet, openclaw, VibiumDev) |
| Architecture Decision Records | 26 |
| Quality tier | Gold |
| Average quality score | 92.1 / 100 |
| Embedding model | ONNX all-MiniLM-L6-v2 |
| Embedding dimensions | 384 |
| Index type | HNSW (m=16, ef_construction=64) |
| Database | Neon PostgreSQL + pgvector |
| Schema | `ask_ruvnet` |
| Primary table | `architecture_docs` |

### What Gets Ingested

The knowledge base is not just a dump of README files. It includes multiple layers of understanding:

![Knowledge Ingestion Ecosystem](assets/diagrams/knowledge-ingestion.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  ┌─────────────────────────────────────────────┐
  │           Knowledge Ingestion Ecosystem      │
  │                                             │
  │  Layer 1: Repository Content                │
  │  ├── README files (173 repos)               │
  │  ├── Code structure and API surfaces        │
  │  ├── Package manifests and dependencies     │
  │  └── Configuration patterns                 │
  │                                             │
  │  Layer 2: Evolutionary Knowledge            │
  │  ├── 26 Architecture Decision Records       │
  │  ├── Changelogs and release notes           │
  │  ├── Commit history (significant changes)   │
  │  └── Version progression and rationale      │
  │                                             │
  │  Layer 3: Teaching Content                  │
  │  ├── Plain-English concept explanations     │
  │  ├── Decision frameworks (when to use X)    │
  │  ├── Debugging guides                       │
  │  └── Progressive learning paths             │
  │                                             │
  │  Layer 4: Multimedia                        │
  │  ├── Video transcript chunks                │
  │  ├── Coaching session transcripts           │
  │  └── Agentics Foundation content            │
  └─────────────────────────────────────────────┘
```

</details>

### Topics Covered

- Agent orchestration (Claude Flow, ruv-swarm, agentic-flow)
- Swarm topologies (hierarchical, mesh, ring, star, adaptive)
- Consensus protocols (Byzantine, Raft, CRDT, Gossip)
- Vector database patterns (HNSW, embeddings, similarity search)
- Memory architectures (episodic, semantic, working memory)
- Reinforcement learning (Decision Transformer, Actor-Critic, PPO, SAC)
- Cognitive containers (RVF format, WASM deployment)
- Security patterns (AIMDS 3-layer pipeline, Lyapunov chaos detection)
- Deployment patterns (Docker, cloud, air-gapped, edge)
- npm package APIs and usage examples

---

## Swarm Topologies

One of the most-asked-about features in the ecosystem. Claude Flow v3 supports five swarm topologies, each suited to different coordination needs:

![Swarm Topologies](assets/diagrams/swarm-topologies.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  HIERARCHICAL                    MESH
  (Queen controls workers)        (Fully connected peers)

       ┌───┐                    ┌───┐───┌───┐
       │ Q │                    │ A │   │ B │
       └─┬─┘                    └─┬─┘───└─┬─┘
    ┌────┼────┐                   │  ╲ ╱  │
  ┌─┴─┐┌─┴─┐┌─┴─┐              ┌─┴─┐ ╳ ┌─┴─┐
  │ W1││ W2││ W3│              │ C │╱ ╲│ D │
  └───┘└───┘└───┘              └───┘───└───┘


  RING                           STAR
  (Circular message passing)     (Central coordinator)

    ┌───┐     ┌───┐                 ┌───┐
    │ A │────►│ B │           ┌─────│ S │─────┐
    └───┘     └─┬─┘           │     └─┬─┘     │
      ▲         │           ┌─┴─┐  ┌─┴─┐  ┌─┴─┐
      │         ▼           │ A │  │ B │  │ C │
    ┌─┴─┐     ┌───┐        └───┘  └───┘  └───┘
    │ D │◄────│ C │
    └───┘     └───┘


  HIERARCHICAL-MESH (Recommended for 10+ agents)
  (Queen + peer communication)

           ┌───┐
           │ Q │ ◄── Queen coordinates
           └─┬─┘
      ┌──────┼──────┐
    ┌─┴─┐  ┌─┴─┐  ┌─┴─┐
    │ L1│──│ L2│──│ L3│ ◄── Leads (mesh peers)
    └─┬─┘  └─┬─┘  └─┬─┘
    ┌─┴─┐  ┌─┴─┐  ┌─┴─┐
    │W1a│  │W2a│  │W3a│ ◄── Workers
    └───┘  └───┘  └───┘
```

</details>

---

## Component Relationships

The core systems in the ecosystem are deeply interconnected:

![Component Relationships](assets/diagrams/component-relationships.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │   ┌────────────┐         ┌────────────┐         │
  │   │ Claude Flow │◄───────►│  AgentDB    │         │
  │   │ v3         │ agents  │  (hybrid    │         │
  │   │            │ store   │   memory)   │         │
  │   │ 60+ agent  │ state   │  episodic + │         │
  │   │ types      │ in      │  semantic   │         │
  │   └─────┬──────┘         └──────┬─────┘         │
  │         │                       │                │
  │    orchestrates            vectors stored in     │
  │         │                       │                │
  │         ▼                       ▼                │
  │   ┌────────────┐         ┌────────────┐         │
  │   │  SONA      │◄───────►│  RuVector   │         │
  │   │  (neural   │ learns  │  (vector    │         │
  │   │   adapt)   │ from    │   DB)       │         │
  │   │            │ vector  │             │         │
  │   │  <0.05ms   │ search  │  HNSW       │         │
  │   │  adaptation│ results │  150x-12500x│         │
  │   └─────┬──────┘         └──────┬─────┘         │
  │         │                       │                │
  │    protected by            secures               │
  │         │                       │                │
  │         ▼                       ▼                │
  │   ┌────────────────────────────────────┐        │
  │   │            AIMDS                    │        │
  │   │  (AI Defense Middleware)             │        │
  │   │  3-layer security pipeline          │        │
  │   │  Inbound scan + Outbound scan       │        │
  │   └────────────────────────────────────┘        │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

</details>

---

## The LLM Fallback Chain

Ask-RuvNet automatically detects all configured API keys and builds a resilient fallback chain. If one provider is rate-limited or fails, it tries the next.

![LLM Fallback Chain](assets/diagrams/llm-fallback-chain.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  ┌─────────────┐    fail    ┌──────────┐    fail
  │  groq-free  │ ─────────► │  openai   │ ────────►
  │  llama-3.3  │            │  gpt-4o   │
  │  (free tier)│            │  (paid)   │
  └─────────────┘            └──────────┘

  ┌─────────────┐    fail    ┌────────────┐    fail
  │  anthropic  │ ─────────► │ openrouter  │ ────────►
  │  claude     │            │ multi-model │
  │  sonnet 4   │            │ gateway     │
  └─────────────┘            └────────────┘

  ┌─────────────┐
  │  deepseek   │  (last resort)
  │  deepseek-  │
  │  chat       │
  └─────────────┘
```

</details>

| Priority | Provider | Model | Notes |
|----------|----------|-------|-------|
| 1 | groq-free | llama-3.3-70b-versatile | Free tier, 1M tokens/day |
| 2 | openai | gpt-4o | Paid |
| 3 | anthropic | claude-sonnet-4 | Paid |
| 4 | openrouter | anthropic/claude-sonnet-4 | Multi-model gateway |
| 5 | deepseek | deepseek-chat | Paid |

Set `LLM_PROVIDER` to override the primary. Add `GROQ_PAID_API_KEY` to insert a paid Groq tier between free Groq and OpenAI.

---

## The Learning Loop

Ask-RuvNet is not a static system. It improves over time through a continuous feedback loop:

![The Learning Loop](assets/diagrams/learning-loop.svg)

<details>
<summary>ASCII Version (for AI/accessibility)</summary>

```
  ┌──────────┐
  │   User   │
  │ Question │
  └────┬─────┘
       │
       ▼
  ┌──────────────┐     retrieval quality      ┌──────────┐
  │  RAG Pipeline │ ─────────────────────────► │ Quality  │
  │  (5 stages)  │                            │ Metrics  │
  └──────┬───────┘                            └────┬─────┘
         │                                         │
         ▼                                         ▼
  ┌──────────────┐     informs next round     ┌──────────┐
  │  Grounded    │                            │ KB Sweep │
  │  Answer      │                            │ Pipeline │
  └──────┬───────┘                            └────┬─────┘
         │                                         │
         ▼                                         ▼
  ┌──────────────┐     new versions trigger   ┌──────────┐
  │  User learns,│                            │ Re-ingest│
  │  asks deeper │                            │ + Score  │
  │  questions   │                            │ + Embed  │
  └──────────────┘                            └──────────┘
```

</details>

The `kb:sweep` and `kb:evolution` scripts continuously monitor repositories for new releases, commits, and ADRs, re-ingesting and re-scoring content to keep the knowledge base current.

---

## API Reference

### GET /health

Basic liveness check.

```bash
curl https://ask-ruvnet-production.up.railway.app/health
```

```json
{ "status": "ok", "version": "3.1.0" }
```

### POST /api/chat

Submit a question and receive a grounded answer with source citations.

```bash
curl -X POST https://ask-ruvnet-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What swarm topologies does claude-flow support?"}'
```

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | The user's question |

**Response:** JSON object with `answer` (string) and `sources` (array).

### POST /api/visualize

Generate an architectural visualization using Gemini.

```bash
curl -X POST https://ask-ruvnet-production.up.railway.app/api/visualize \
  -H "Content-Type: application/json" \
  -d '{"concept": "HNSW graph layers", "resolution": "2K"}'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `concept` | string | Yes | What to visualize |
| `style` | string | No | Visual style hint |
| `resolution` | string | No | `"1K"` or `"2K"` (default: `"1K"`) |

### POST /api/special

Perform special actions on content: simplify, generate code, create diagrams, or visualize.

```bash
curl -X POST https://ask-ruvnet-production.up.railway.app/api/special \
  -H "Content-Type: application/json" \
  -d '{"action": "diagram", "content": "agent lifecycle in claude-flow"}'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | `simplify`, `code`, `diagram`, or `visualize` |
| `content` | string | Yes | The content to act on |

### GET /api/providers

Returns the active LLM fallback chain.

### GET /api/kb-stats

Knowledge base connection status and entry counts.

### GET /api/knowledge

Alias for `/api/kb-stats`.

### GET /api/ecosystem-stats

Aggregated statistics about the RuVNet ecosystem.

### GET /api/latest-repos

Live npm version data for key ecosystem packages (cached hourly).

### POST /api/learn

Submit feedback to improve answer quality.

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string. Must end with `?sslmode=require`. |

### LLM Providers (at least one required)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq free tier (1M tokens/day). Primary provider. |
| `GROQ_PAID_API_KEY` | Groq paid tier. Falls in after free tier. |
| `OPENAI_API_KEY` | OpenAI (gpt-4o). Also used for special actions. |
| `ANTHROPIC_API_KEY` | Anthropic. Also accepts `CLAUDE_API_KEY`. |
| `OPENROUTER_API_KEY` | OpenRouter multi-model gateway. |
| `DEEPSEEK_API_KEY` | DeepSeek. |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | auto-detect | Override the primary provider |
| `GEMINI_API_KEY` | built-in | Gemini API key for visualization |
| `NODE_ENV` | `development` | Set to `production` on Railway |
| `PORT` | `3000` | Server port |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Override Groq model |
| `OPENAI_MODEL` | `gpt-4o` | Override OpenAI model |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Override Anthropic model |

---

## Local Development

### Prerequisites

- Node.js 22+
- A Neon PostgreSQL database with the `ask_ruvnet` schema and `pgvector` extension
- At least one LLM API key (Groq free tier recommended: https://console.groq.com)

### Setup

```bash
git clone https://github.com/stuinfla/Ask-Ruvnet.git
cd Ask-Ruvnet

# Install backend dependencies
npm install

# Install and build the React frontend
npm run build

# Create .env with your credentials
cp .env.example .env
# Edit .env: set DATABASE_URL and at least one LLM API key

# Start the server
node src/server/app.js
```

The app runs at http://localhost:3000. Express serves the React frontend from `src/ui/dist/` as static files.

### Useful npm Scripts

| Script | What It Does |
|--------|-------------|
| `npm run build` | Build the React frontend |
| `npm run kb:status` | Check KB sync status |
| `npm run kb:ingest` | Ingest architecture docs into KB |
| `npm run kb:evolution` | Ingest ADRs, changelogs, commits |
| `npm run kb:github` | Ingest GitHub repo content |
| `npm run kb:full` | Full pipeline: github + evolution + ingest |
| `npm run kb:sweep` | Check repos for updates |
| `npm run kb:visual` | Build KB universe visualization |
| `npm run test:smoke` | Smoke test production endpoint |
| `npm run test:kb` | Test KB completeness |

---

## Production Deployment (Railway)

| Item | Value |
|------|-------|
| Platform | Railway (Hobby plan, $5/month) |
| Container | Docker (node:22-bookworm-slim) |
| Region | us-west-2 |
| Always-on | Yes (no cold starts) |
| Auto-deploy | Yes (push to `main`) |

### How Deployment Works

1. Push to `main` triggers Railway auto-deploy via GitHub integration
2. Railway builds the Docker image from `Dockerfile`
3. Container starts via `scripts/deployment/start-railway.sh`
4. Startup script verifies `DATABASE_URL`, then runs `node src/server/app.js`

### Verifying a Deployment

```bash
# Health check
curl https://ask-ruvnet-production.up.railway.app/health

# KB connection (should show connected: true)
curl https://ask-ruvnet-production.up.railway.app/api/kb-stats

# LLM providers
curl https://ask-ruvnet-production.up.railway.app/api/providers
```

### Version Management

Version lives in `package.json` (single source of truth). Server and UI read it at runtime.

```bash
npm version patch   # bug fix
npm version minor   # new feature
npm version major   # breaking change
git push origin main
# Railway auto-deploys
```

---

## Under the Hood

```
Ask-Ruvnet/
├── src/
│   ├── server/
│   │   ├── app.js                     # Express server, all endpoints
│   │   └── RuvPersona.js              # LLM system prompt and persona
│   ├── core/                          # RAG pipeline modules
│   │   ├── PostgresKnowledgeBase.js   # Neon pgvector interface
│   │   ├── HybridSearch.js            # BM25 + semantic fusion
│   │   ├── QueryExpander.js           # Query expansion
│   │   ├── ReRanker.js                # 5-factor result reranking
│   │   ├── ContextCompressor.js       # Context length management
│   │   ├── MultiHopRetriever.js       # Multi-step query handling
│   │   ├── RecencyBoost.js            # Boost recent content
│   │   ├── ContentProcessor.js        # Content preprocessing
│   │   ├── RuvectorStore.js           # Vector store abstraction
│   │   └── TextChunker.js             # Document chunking
│   ├── storage/
│   │   ├── kb-embed.js                # Embedding utilities
│   │   └── persistent-vector-db.js    # Local vector DB (dev)
│   ├── connectors/
│   │   ├── GoogleDriveConnector.js    # Google Drive ingestion
│   │   ├── LocalDirectoryConnector.js # Local file ingestion
│   │   └── SourceManager.js           # Source routing
│   └── ui/
│       ├── src/                       # React source (Vite)
│       └── dist/                      # Built frontend
├── scripts/
│   ├── deployment/
│   │   └── start-railway.sh           # Docker startup
│   ├── ingestion/                     # Data ingestion scripts
│   ├── ingest-github-evolution.js     # ADR/changelog ingestion
│   ├── ingest-github-repos.js         # Repository ingestion
│   ├── kb-architecture-sync.js        # KB sync orchestrator
│   ├── kb-sweep-updates.js            # Update detector
│   └── build-kb-universe.js           # KB visualization builder
├── Dockerfile                         # Railway Docker build
├── package.json                       # Version source of truth
└── README.md                          # This file
```

---

## Troubleshooting

**Chat returns generic answers or no results**
Check that `DATABASE_URL` is set correctly. Common mistake: using a hyphen (`DATABASE-URL`) instead of an underscore (`DATABASE_URL`). Verify with `/api/kb-stats` -- it should show `"connected": true`.

**Frontend not loading**
Run `npm run build` and check for errors. The `dist/` directory must exist at `src/ui/dist/`.

**All LLM providers failing**
Check `/api/providers` to see which are configured. At least one API key must be set. The system tries each provider in order and falls to the next on failure.

**Visualization not generating**
The `/api/visualize` endpoint requires a Gemini API key. Check that `GEMINI_API_KEY` is set or that the built-in key is still valid.

---

## Deployment History

| Date | Version | Change |
|------|---------|--------|
| 2026-03-01 | 3.1.0 | Resource drawer for mid-chat access to capabilities and documents, light mode contrast fixes, mobile fullscreen canvas overlay, responsive drawer layout |
| 2026-03-01 | 3.0.0 | Complete visual overhaul: glassmorphism capability tiles, aurora animated background, stats bar with live ecosystem data, 6 prompt starters, resource documents grid, follow-up suggestion pills, color-coded accent system (red/blue/purple/amber), staggered entrance animations, gradient text and layered shadows |
| 2026-02-27 | 2.2.0 | Rich responses with source citations, source cards with doc-type badges, 13K evolutionary knowledge chunks, full pipeline command, Gemini visual integration, markdown link styling |
| 2026-02-24 | 2.1.5 | Fixed DATABASE_URL, decommissioned Render, Railway-only |
| 2026-02-23 | 2.1.4 | Recreated start-railway.sh, fixed Railway 502 |
| 2026-02-23 | 2.1.3 | Removed Travel Hacking and RetireWell domains |
| 2026-02-23 | 2.1.2 | Multi-provider LLM fallback chain (5 providers) |
| 2026-02-21 | 2.1.1 | Initial Render deployment with PostgreSQL KB |
| 2026-01-14 | 2.0.0 | PostgreSQL KB wired to chat engine |

---

## Contributing

Ask-RuvNet is part of the broader RuVNet ecosystem. Contributions are welcome -- especially around knowledge coverage, RAG pipeline improvements, and frontend UX.

1. Fork the repository
2. Create a feature branch
3. Run `npm run build` and `npm run test:smoke` before submitting
4. Open a pull request against `main`

---

## Author

**Ruben Cohen (rUv)**
- GitHub: [@ruvnet](https://github.com/ruvnet)
- Ecosystem: 173 repositories across [ruvnet](https://github.com/ruvnet), [openclaw](https://github.com/openclaw), [VibiumDev](https://github.com/VibiumDev)

**Maintained by:** [@stuinfla](https://github.com/stuinfla)
**Production:** https://ask-ruvnet-production.up.railway.app

---

## License

MIT
