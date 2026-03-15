# Pi-Brain Interactive Demo Suite — Implementation Plan
Updated: 2026-03-15 13:30:00 EDT | Version 1.0.0
Created: 2026-03-15

## Purpose

Three interactive demo pages for Ask-RuvNet that showcase Pi-Brain's collective intelligence capabilities. Each contrasts standard AI limitations against Ruflo/Pi-Brain's approach through animated, stage-based visualizations.

**Narrative arc:**
- Demo 1: "Knowledge should DO, not just TELL" (Executable Knowledge)
- Demo 2: "Knowledge should GROW, not just STORE" (Living Knowledge Graph)
- Demo 3: "Knowledge should IMPROVE, not just EXIST" (Learning Loop)

---

## Pi-Brain API Reference (for browser demos)

All endpoints confirmed via KB entry "Pi Brain MCP Tools Reference" (21 tools).

### REST Endpoints (base: `https://pi.ruv.io/v1`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/status` | GET | None | System health: memories, edges, clusters, quality |
| `/memories/search?q=...&limit=N` | GET | None | Semantic search (no auth for reads) |
| `/memories/{id}` | GET | None | Get single memory with provenance |
| `/memories` | POST | Optional | Share new knowledge |
| `/memories/{id}/vote` | POST | Optional | Vote up/down (Bayesian update) |
| `/memories/list?limit=N` | GET | None | List recent memories |

### Rate Limits
- Reads: 5000/hr per IP
- Writes: 500/hr per contributor
- Anti-Sybil IP limits apply

### CORS Strategy
The SSE transport (`new EventSource("https://pi.ruv.io/sse")`) works from browsers, suggesting CORS headers are set. If REST CORS fails, add proxy routes to `src/server/app.js`:
```javascript
app.get('/api/pi/status', async (req, res) => {
  const r = await fetch('https://pi.ruv.io/v1/status');
  res.json(await r.json());
});
// Similar for /api/pi/search, /api/pi/vote
```

### Live Stats (as of 2026-03-15)
- 965 memories, 59 contributors, 947 votes, 20 clusters
- 125,429 graph edges, 128-dim embeddings
- Avg quality: 0.58, MicroLoRA epoch 2

---

## Architecture Pattern

All demos follow the proven `rvf-engine.html` pattern:

```
src/ui/public/
  pi-executable-knowledge.html  ← Self-contained HTML + inline CSS
  pi-living-graph.html
  pi-learning-loop.html
  assets/
    pi-executable-knowledge.js  ← External JS (CSP compliance)
    pi-living-graph.js
    pi-learning-loop.js
```

### Shared Design Tokens
```css
--bg: #0a0a0f       --surface: #12121a     --surface-2: #1a1a28
--border: #2a2a3a    --cyan: #00d4ff        --gold: #f0c020
--purple: #a855f7    --green: #10b981       --red: #ef4444
--text: #e8eaed      --text-dim: #8892a4
Glass: rgba(255,255,255,0.03) + backdrop-filter: blur(8px)
Fonts: Inter (sans), JetBrains Mono (mono)
```

### Shared Patterns (copy from rvf-engine.js)
- Particle system: 1800 particles, category-weighted colors, stage-specific formations
- Stage management: `goToStage(n)`, dot nav, prev/next, keyboard, auto-play
- Animation: `animateCount()`, staggered visibility, CSS transitions

### Integration (App.jsx changes)
Each demo gets a capability tile + `handleCapability` case + resource drawer entry:
```javascript
case 'pi-executable':
  setCanvasContent({ type: 'iframe', content: '/pi-executable-knowledge.html',
    title: 'Executable Knowledge', action: 'pi-executable' });
  break;
```

---

## Demo 1: Executable Knowledge (6 Stages)

**File**: `pi-executable-knowledge.html` + `assets/pi-executable-knowledge.js`
**Status**: HTML created, JS pending

### Stage-by-Stage Spec

#### Stage 0 — "The Old Way"
- **Visual**: Fake chat UI. User asks "How does HNSW work?" → wall of text streams in
- **Animation**: Typewriter effect (15ms/char), engagement meter drains 100%→12% over 6s
- **Colors**: User msg = cyan border, AI msg = gray text that fades to 35% opacity
- **Tech**: DOM manipulation, setInterval for typewriter, CSS transition for meter

#### Stage 1 — "The New Way" (HNSW Visualizer)
- **Visual**: Canvas 2D graph, 5 seed nodes, users click to add more
- **Interactions**:
  - "Insert Vector" → new node slides in, greedy traversal highlights path
  - "Search Nearest" → gold query dot, layer-by-layer descent with glowing trail
- **Physics**: Spring layout — repulsion between all nodes, attraction along edges
  - Repulsion: if dist < 80px, force = (80 - dist) * 0.02
  - Attraction: if dist > 100px, force = (dist - 100) * 0.005
  - Damping: velocity *= 0.95 per frame
  - Clamp positions to canvas bounds
- **Layers**: Each node gets layer = floor(-ln(random()) * mL), mL = 1/ln(3)
  - Layer 0: cyan, r=4px. Layer 1+: purple, r=6-8px
  - M=3 max connections per layer
- **Animation**: Node insert = lerp from edge to position (500ms), search trail = sequential node highlights (200ms each)

#### Stage 2 — "Embedding Explorer"
- **Visual**: 2D scatter plot, ~50 dots color-coded by category
- **Categories**: agents=blue, vectors=cyan, security=red, teaching=gold, neural=purple, swarms=green
- **Interaction**: Type query → gold arrow shoots from bottom-left to matching cluster
- **Animation**: Arrow follows cubic-bezier path (800ms), particle trail (3-5 fading dots)
- **On arrival**: 5 nearest neighbors highlight with glowing lines + distance scores
- **Query matching**: keyword→cluster mapping (contains "agent"→agents cluster, etc.)

#### Stage 3 — "Min-Cut Revealer"
- **Visual**: Network of ~30 nodes, two natural clusters + 4-5 bridge nodes
- **Interaction**: Click "Find Boundaries"
- **Animation (3 phases)**:
  1. Scanning (1.5s): edges flash cyan sequentially, 50ms stagger
  2. Cutting (2s): cut edges pulse red 3x, then contract to zero length (600ms)
  3. Done: clusters slide apart 30px each, bottleneck nodes glow gold
- **Result**: Stats appear: "2 clusters | 3 cut edges | 4 bottleneck nodes"

#### Stage 4 — "The Comparison"
- **Visual**: 5 rows, each with old (red-tinted) vs new (cyan-tinted) + "vs" divider
- **Animation**: Rows animate in with 300ms stagger (translateY + opacity)
- **Stats**: Count-up animation for live Pi-Brain numbers (965, 59, 947, 20)
- **Data**: Fetch from `brain_status` API, fallback to hardcoded

#### Stage 5 — "Try It Live"
- **Visual**: Search box → results with vote buttons
- **API calls**:
  - Search: `GET https://pi.ruv.io/v1/memories/search?q={query}&limit=5`
  - Vote: `POST https://pi.ruv.io/v1/memories/{id}/vote` body: `{"direction":"up"}`
- **Fallback**: 10-entry simulated dataset if API unavailable
- **After vote**: Participation badge appears: "You just participated in collective intelligence"
- **CORS fallback**: Try direct fetch → if blocked, try `/api/pi/search` proxy

---

## Demo 2: Living Knowledge Graph (5 Stages)

**File**: `pi-living-graph.html` + `assets/pi-living-graph.js`

### Stage-by-Stage Spec

#### Stage 0 — "Dead Knowledge"
- **Visual**: 8x12 grid of gray boxes (static database rows)
- **Animation**: Boxes fade in with stagger (30ms each), cyan barcode beam scans left-to-right
- **Message**: "Traditional databases: flat, isolated, frozen"

#### Stage 1 — "Knowledge Awakens"
- **Visual**: Force-directed graph with real Pi-Brain data (~200 nodes)
- **Data source**: `brain_list` API (limit=200) + `brain_status`
- **Transition from Stage 0**: Grid boxes morph to circles (cornerRadius increases, gray→color)
- **Layout engine**: Barnes-Hut O(n log n) force-directed with QuadTree
  - Repulsion: -300 (Coulomb's constant)
  - Spring length: 80px, strength: 0.02
  - Damping: 0.92/frame
  - Center gravity: 0.01
  - Barnes-Hut theta: 0.8
- **Interactions**: Hover = tooltip (title, category, quality), drag = reposition, scroll = zoom
- **Node sizing**: radius = 4 + quality * 12 (quality from alpha/(alpha+beta))
- **Colors**: architecture=cyan, pattern=purple, solution=gold, security=red, performance=green, tooling=blue, debug=orange, convention=pink

#### Stage 2 — "Clusters Emerge"
- **Data source**: `brain_partition` API (compact=true)
- **Animation**: Click "Reveal Structure" → nodes pull toward cluster centroids (2s lerp)
- **Visual**: Convex hull outlines draw around clusters, coherence scores appear as labels
- **Edge behavior**: intra-cluster edges brighten, inter-cluster edges dim

#### Stage 3 — "Knowledge Drift"
- **Data source**: `brain_drift` API
- **Visual**: Color temperature overlay on graph nodes
  - Fresh (< 2 weeks): cyan (hue=180°)
  - Aging (2-6 weeks): amber (hue=40°)
  - Stale (> 6 weeks): red (hue=0°)
- **Control**: Timeline slider at bottom, scrub through time
- **Animation**: Drift coefficient counter updates, radar pulse on detection

#### Stage 4 — "The Collective Grows"
- **Visual**: Accelerated growth simulation from 5 nodes to full graph
- **Animations**:
  - Node pop-in: scale 0→1.2→1 with ease-out-back (400ms)
  - Edge draw: stroke-dasharray from full to zero (300ms)
  - Vote sparkles: 8-point star, scale up + fade (600ms)
- **Counters**: memories, contributors, votes, clusters — tick up in sync with growth
- **Speed**: 50ms between additions initially, accelerating to 10ms

### Performance (for Demo 2)
- Max 200 nodes rendered (sample from each cluster proportionally on mobile)
- Max ~2000 edges drawn (skip edge rendering at zoom < 0.5)
- Only run physics simulation for active stage
- API data fetched once on load, cached in memory

---

## Demo 3: Bidirectional Learning Loop (6 Stages)

**File**: `pi-learning-loop.html` + `assets/pi-learning-loop.js`

### Stage-by-Stage Spec

#### Stage 0 — "The Dead End"
- **Visual**: 3 user icons (left) → AI model (right), arrows flow and dissolve
- **Animation**: Question arrow (cubic-bezier, 0.8s) → answer arrow back → both dissolve into 25 particles each (random velocity + slight upward drift, fade over 1.5s)
- **Counter**: "Wasted knowledge" ticks up after each exchange
- **Message**: "Standard AI: Every conversation dies. Nothing learned."

#### Stage 1 — "The Loop Awakens"
- **Visual**: Same pipeline but with feedback path back to knowledge base
- **Key moment**: Answer arrives with quality badge (0.72), user votes up → score rises to 0.74
- **Animation**: Vote triggers ripple (expanding circle, 0.8s fade), wave flows backward, new edge appears in mini-graph SVG

#### Stage 2 — "Transfer Learning"
- **Visual**: Two domain bubbles ("Vector Databases" ↔ "Search Algorithms") with bridge
- **Animation**: Bridge draws via SVG stroke-dashoffset (1.5s), knowledge particles flow along path
- **Data**: `brain_transfer` API for confidence/dampening values, or simulated
- **Metrics**: "Transfer confidence: 0.82 | Dampening: 0.15"

#### Stage 3 — "Drift Detection"
- **Visual**: Timeline bar (Jan→Jun) + knowledge cluster (20 SVG nodes)
- **Animation**: As timeline advances, nodes shift blue→orange (HSL interpolation)
- **Detection**: Radar pulse fires (3 concentric expanding circles), warning badges appear
- **Swap**: Old nodes slide down+fade, new nodes slide up+appear
- **Data**: `brain_drift` API for coefficient of variation, or simulated

#### Stage 4 — "The Flywheel"
- **Visual**: Circular SVG path with 5 stations (Question, Search, Answer, Vote, Improve)
- **Animation**: Dot travels circle accelerating each revolution (4s→3s→2s→1.5s)
- **Stations**: Light up as dot passes (glow pulse, 0.3s)
- **Metrics sidebar**: questions/day, avg quality, contributors, drift alerts — odometer-style digit rolling
- **Center**: Mini-graph grows 1 node + 1-2 edges per revolution

#### Stage 5 — "Join the Collective"
- **Visual**: Search box + results + vote buttons + share form
- **API calls**: Same as Demo 1 Stage 5, plus:
  - Share: `POST https://pi.ruv.io/v1/memories` body: `{title, content, category, tags}`
- **After share**: Celebration particles (30, 1.5s), counter: "Your contribution #966"
- **Real-time stats**: Fetched from `brain_status`

---

## App.jsx Integration (All 3 Demos)

### Capability Tiles (add to HeroSection)
```jsx
// After existing RVF Engine tile:
<button className="capability-tile" onClick={() => onCapability('pi-executable')}>
  <span className="tile-icon-wrapper tile-pi-exec"><span className="tile-icon">&#9889;</span></span>
  <span className="tile-label">Executable KB</span>
  <span className="tile-count">6 Stages</span>
</button>
<button className="capability-tile" onClick={() => onCapability('pi-living-graph')}>
  <span className="tile-icon-wrapper tile-pi-graph"><span className="tile-icon">&#127760;</span></span>
  <span className="tile-label">Living Graph</span>
  <span className="tile-count">5 Stages</span>
</button>
<button className="capability-tile" onClick={() => onCapability('pi-learning-loop')}>
  <span className="tile-icon-wrapper tile-pi-loop"><span className="tile-icon">&#128260;</span></span>
  <span className="tile-label">Learning Loop</span>
  <span className="tile-count">6 Stages</span>
</button>
```

### handleCapability Cases
```javascript
case 'pi-executable':
  setCanvasContent({ type: 'iframe', content: '/pi-executable-knowledge.html',
    title: 'Executable Knowledge', action: 'pi-executable' });
  break;
case 'pi-living-graph':
  setCanvasContent({ type: 'iframe', content: '/pi-living-graph.html',
    title: 'Living Knowledge Graph', action: 'pi-living-graph' });
  break;
case 'pi-learning-loop':
  setCanvasContent({ type: 'iframe', content: '/pi-learning-loop.html',
    title: 'Learning Loop', action: 'pi-learning-loop' });
  break;
```

### CSS Tile Styles (App.css)
```css
/* Update grid to accommodate 7 tiles */
.capability-tiles {
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
}

.tile-icon-wrapper.tile-pi-exec {
  background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.15));
}
.tile-icon-wrapper.tile-pi-graph {
  background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(0,212,255,0.15));
}
.tile-icon-wrapper.tile-pi-loop {
  background: linear-gradient(135deg, rgba(240,192,32,0.2), rgba(168,85,247,0.15));
}
```

---

## Build Sequence (Checklist)

### Phase 1: Demo 1 — Executable Knowledge
- [ ] Create `pi-executable-knowledge.js` with particle system + stage management
- [ ] Implement Stage 0: typewriter + engagement meter
- [ ] Implement Stage 1: HNSW Canvas 2D with spring physics
- [ ] Implement Stage 2: Embedding scatter plot + query arrow
- [ ] Implement Stage 3: Min-cut network + scan/sever/separate
- [ ] Implement Stage 4: Comparison rows + count-up stats
- [ ] Implement Stage 5: Live Pi-Brain search + vote
- [ ] Test CORS: `fetch('https://pi.ruv.io/v1/status')` from browser
- [ ] Test all 6 stages, keyboard nav, auto-play
- [ ] Build: `cd src/ui && npm run build` — zero errors

### Phase 2: Demo 2 — Living Knowledge Graph
- [ ] Create `pi-living-graph.html` with 5 stage panels
- [ ] Create `pi-living-graph.js` with Barnes-Hut force layout
- [ ] Implement data fetching (brain_list, brain_partition, brain_drift, brain_status)
- [ ] Implement Stage 0: dead grid + barcode beam
- [ ] Implement Stage 0→1 transition: grid morphs to graph
- [ ] Implement Stage 1: force graph + hover tooltips + pan/zoom
- [ ] Implement Stage 2: cluster pull + convex hulls + coherence
- [ ] Implement Stage 3: drift overlay + timeline slider
- [ ] Implement Stage 4: growth simulation
- [ ] Test all stages, build

### Phase 3: Demo 3 — Learning Loop
- [ ] Create `pi-learning-loop.html` with 6 stage panels
- [ ] Create `pi-learning-loop.js` with pipeline animations
- [ ] Implement Stage 0: dead-end arrows + particle dissolution
- [ ] Implement Stage 1: vote loop + ripple + mini-graph
- [ ] Implement Stage 2: transfer bridge + particle flow
- [ ] Implement Stage 3: drift timeline + color shift + radar
- [ ] Implement Stage 4: flywheel SVG + acceleration
- [ ] Implement Stage 5: live search + vote + share
- [ ] Test all stages, build

### Phase 4: Integration
- [ ] Add 3 capability tiles to App.jsx HeroSection
- [ ] Add 3 handleCapability cases
- [ ] Add 3 resource drawer tiles
- [ ] Update App.css grid + tile styles
- [ ] Build: `cd src/ui && npm run build` — zero errors
- [ ] Test all 3 demos in canvas split-view
- [ ] Test responsive at 375x667 (mobile)
- [ ] Deploy: `bash scripts/deployment/deploy.sh minor`
- [ ] Verify on production

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Pi-Brain CORS blocks browser fetch | Add `/api/pi/*` proxy routes to app.js (server already calls pi.ruv.io) |
| Canvas performance on mobile | Reduce particle count to 600, node count to 50 on viewport < 768px |
| HNSW spring physics instability | Damping 0.95x, clamp to bounds, max velocity cap |
| Partition API response 82KB | Use `compact=true`, discard unneeded fields |
| CSP blocking Google Fonts | Use `<link>` instead of `@import` (matches rvf-engine pattern) |
| 7 capability tiles crowd hero | auto-fill grid with minmax wraps gracefully |
| Context compaction during build | This plan document persists across sessions |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/ui/public/rvf-engine.html` | Reference: HTML structure, CSS tokens, stage nav |
| `src/ui/public/assets/rvf-engine.js` | Reference: particle system, stage management, animation |
| `src/ui/src/App.jsx` | Integration: capability tiles (~line 229), handleCapability (~line 1338) |
| `src/ui/src/App.css` | Integration: tile styles (~line 2461), grid (~line 2298) |
| `src/server/app.js` | Optional: Pi-Brain proxy routes if CORS fails |

---

## Pi-Brain Features to Highlight

From KB research, these Pi-Brain features are unique and should be emphasized:

1. **WASM Executable Nodes (ADR-063)** — Knowledge that runs as code. V1 ABI: `memory, malloc, feature_extract_dim, feature_extract`. Currently 0 published nodes = blank canvas opportunity.
2. **Bayesian Quality Voting** — Not simple up/down; uses alpha/beta Bayesian priors that evolve over time.
3. **Witness Chains** — Ed25519 cryptographic signatures prove knowledge provenance.
4. **SONA Learning** — Self-Optimizing Neural Architecture does force_learn every 5 minutes.
5. **MinCut Partitioning** — 20 clusters emerge automatically from 125K+ edges.
6. **Meta Thompson Sampling** — Transfer learning uses dampened priors between domains.
7. **Differential Privacy** — Optional noise injection, PII stripping (15 regex patterns).
8. **MicroLoRA Federated Learning** — Reputation-weighted Byzantine-tolerant aggregation.
