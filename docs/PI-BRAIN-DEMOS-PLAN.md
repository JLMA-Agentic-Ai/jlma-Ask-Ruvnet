# Pi-Brain Demo Suite — Research-Backed Redesign v3
Updated: 2026-03-15 17:00:00 EDT | Version 3.0.0

## Research Foundation

Based on two deep-research agents analyzing:
- Current competitive landscape (Pinecone, Weaviate, Qdrant, Turbopuffer, LangChain, LlamaIndex)
- Developer pain points from HN, Reddit, industry reports (Gartner, Forrester, BCG)
- Landing page patterns from Vercel, Supabase, Linear, Stripe, Resend, Neon, Turso, Railway
- EU AI Act regulatory timeline (enforcement August 2, 2026)

## Audience

Developers and technical decision-makers evaluating AI infrastructure. Smart, busy, skeptical. They've seen a hundred "we're faster" claims. They won't read your docs unless you first make them curious.

## What's Table Stakes (Don't Lead With)
- HNSW vector search — everyone has it
- Basic RAG — commoditized
- "We're 1000x faster" — needs context
- "AI forgets everything" — context windows improved
- "Run offline" — Ollama does inference offline

## What's Genuinely Differentiated (Lead With)
1. Knowledge quality monitoring & drift detection — NOBODY else does this
2. Built-in security + EU AI Act compliance (August 2, 2026 deadline)
3. Edge-native KNOWLEDGE search (not just inference) — 41KB WASM
4. Cross-org collective intelligence (Pi-Brain)
5. Knowledge-native storage (meaning, context, quality, relationships — not just vectors)

---

## Demo 1: "Is Your Knowledge Rotting?"

### The Pain
60% of enterprise knowledge is outdated. AI confidently serves wrong answers from stale data. No vector database monitors this.

### Stages

**Stage 0 — "Everything Looks Fine"**
- Visual: Dashboard showing a healthy knowledge base. 10,000 entries. All green. Search works. Metrics normal.
- But underneath: animated reveal showing 60% of entries are outdated, contradictory, or duplicated
- The green dashboard is the LIE. The knowledge is rotting and the dashboard can't see it.
- Caption: "Your knowledge base looks healthy. It isn't. And your tools can't tell the difference."

**Stage 1 — "Silent Decay"**
- Visual: Timeline (Mar→Aug) showing docs vs reality diverging
- Left panel: "What Your Docs Say" — stays frozen
- Right panel: "What's Actually True" — evolves as API changes
- Accuracy meter drains from 100% to 30%
- Caption: "Documentation decays silently. By the time someone complains, you're 6 months behind."

**Stage 2 — "What If Your Knowledge Could Watch Itself?"**
- Visual: Same timeline replayed, but now with drift detection
- At month 1: conflict detected, warning fires, stale entry flagged
- Radar pulse, CV metric, alert notification
- Detection gap comparison: "Without monitoring: 5 months. With: 1 month."
- Caption: "Drift detection catches conflicts automatically. You learn about problems in days, not months."

**Stage 3 — "Quality That Evolves"**
- Visual: 6 knowledge entries about the same topic, all starting at 0.50 quality
- Bayesian votes animate: best rises to 0.92, outdated sinks to 0.23
- Bars reorder. Colors shift (cyan=high, red=low)
- Simple explanation: "Not thumbs up/down. Mathematical confidence that gets sharper with more evidence."
- Caption: "The best answer rises. The wrong answer fades. Nobody edits anything — the math does it."

**Stage 4 — "Try It: Live Knowledge Search"**
- Search Pi-Brain's 965 memories
- Each result shows quality score, freshness, category
- Vote buttons let you participate
- Caption: "This collective has been quality-monitored for 3 months. 59 contributors. 947 votes. Search it yourself."

---

## Demo 2: "Your AI's Knowledge Is Trapped"

### The Pain
You can run AI inference locally. But your knowledge search still hits the cloud. Your "local AI" isn't local.

### Stages

**Stage 0 — "The Local AI Lie"**
- Visual: A developer's setup. Ollama running locally (green check). Model loaded (green check). "Fully local AI!" label.
- Then: the model needs to search the knowledge base. Arrow goes OUT to cloud (Pinecone/Weaviate). Data leaves the network.
- The "local" badge flickers and changes to "PARTIALLY LOCAL"
- Caption: "You brought inference to the edge. Your knowledge is still in the cloud. Every query leaks data."

**Stage 1 — "What If Knowledge Traveled With the App?"**
- Visual: Same setup, but now the knowledge is a single file (RVF container)
- Animated: the file contains vectors + HNSW index + metadata + WASM search kernel — all self-contained
- No cloud arrow. Everything stays local.
- Size comparison: Their stack (K8s cluster + managed DB + API gateway = $$$) vs RVF (one file, 535KB)
- Caption: "One file. Self-describing. Self-searching. Everything the app needs to be intelligent — offline."

**Stage 2 — "41KB That Searches 100,000 Documents"**
- Visual: The WASM kernel visualization
- Size comparisons: 41KB kernel vs competing infrastructure
- Speed demo: animated search through 100K vectors in <1ms
- Deployment comparison: their pipeline (6 services, 3 cloud providers) vs yours (1 file, 1 binary)
- Caption: "The entire search engine fits in a QR code. It searches 100,000 documents in under a millisecond. No internet required."

**Stage 3 — "Where This Changes Everything"**
- Three scenario cards:
  1. **Military/classified**: AI that never connects to the internet. Knowledge stays air-gapped. Full search capability.
  2. **Healthcare**: Patient data never leaves the device. AI assistance without HIPAA concerns.
  3. **Field workers**: Engineers on oil rigs, disaster zones, submarines. Full knowledge search with zero connectivity.
- Caption: "Edge-native knowledge isn't a feature. It's an entirely new category of applications that couldn't exist before."

**Stage 4 — "This Demo Is the Proof"**
- Reveal: "The search you've been using in this demo? It's running a 41KB WASM kernel. In your browser. Right now."
- Live search with latency badge showing <5ms response time
- Caption: "You've been using edge-native knowledge search for the last 2 minutes. Did you notice?"

---

## Demo 3: "In 5 Months, You'll Need Receipts"

### The Pain
EU AI Act enforcement starts August 2, 2026. Every AI decision needs an audit trail. Are you ready?

### Stages

**Stage 0 — "The Deadline"**
- Visual: Calendar showing TODAY → August 2, 2026. Countdown: "X days remaining"
- Three requirements appearing one by one:
  1. "Automatic event logging for AI decisions" — check or X?
  2. "Minimum 6-month audit trail retention" — check or X?
  3. "PII detection and handling documentation" — check or X?
- Most organizations: ❌ ❌ ❌
- Caption: "EU AI Act. California SB 942. Both enforceable August 2, 2026. This isn't a feature request — it's law."

**Stage 1 — "The Shadow AI Problem"**
- Visual: An organization diagram. Official AI tools on one side. Then: shadow AI usage appearing everywhere.
- Stats animating in:
  - "40-75% of employees use unapproved AI tools"
  - "223 data policy violations per month (average)"
  - "PII embedded in vector databases with no way to extract it"
- A query flowing through an AI system, with PII highlighted in red at each stage
- Caption: "Your employees are putting customer data into AI tools you don't control. Every day. Right now."

**Stage 2 — "What Compliance Actually Requires"**
- Visual: Three layers of protection, animated one at a time:
  1. **Witness Chains**: Ed25519 cryptographic signatures on every piece of knowledge. Who contributed, when, what changed.
  2. **PII Stripping**: 15 regex patterns automatically redact personal data BEFORE it enters the knowledge system.
  3. **AIMDS Middleware**: Input scanning, output validation, threat detection — three layers, built in, not bolted on.
- Each layer lights up as explained
- Caption: "Not three separate tools you integrate. One middleware layer that handles all of it."

**Stage 3 — "Knowledge With Provenance"**
- Visual: A single knowledge entry with its full audit trail revealed:
  - Created by [pseudonymous ID] on [date]
  - Modified 3 times (each with contributor, timestamp, diff)
  - Voted on 12 times (quality history graph)
  - Witness hash: cryptographic proof of integrity
  - PII scan: "0 personal data detected"
- Caption: "Every piece of knowledge has a paper trail. When the auditor asks 'where did this come from?', you have the answer."

**Stage 4 — "Search With Provenance"**
- Live Pi-Brain search
- Each result shows not just content, but provenance metadata
- Vote + contribute functionality
- Caption: "Search the collective. Every result has a witness chain. That's what compliant AI looks like."

---

## Files to Modify
- `src/ui/public/pi-executable-knowledge.html` — new stage titles/structure for Demo 1
- `src/ui/public/assets/pi-executable-knowledge.js` — complete rewrite
- `src/ui/public/pi-living-graph.html` — new stage titles/structure for Demo 2
- `src/ui/public/assets/pi-living-graph.js` — complete rewrite
- `src/ui/public/pi-learning-loop.html` — new stage titles/structure for Demo 3
- `src/ui/public/assets/pi-learning-loop.js` — complete rewrite

## Build & Deploy
1. Rewrite all 6 files
2. `cd src/ui && npm run build` — zero errors
3. `bash scripts/deployment/deploy.sh minor`
4. Screenshot all stages on production
5. Visual QA: does each stage tell the story effectively?
