Updated: 2025-12-30 17:25:00 EST | Version 2.1.0
Created: 2025-12-30 14:50:00 EST

# RuvNet Knowledgebase Patterns - MANDATORY READING

## ⚠️ CRITICAL: All Documents Must Be Read Together

```
╔═══════════════════════════════════════════════════════════════════════════╗
║   These documents are INTERCONNECTED and INSEPARABLE.                     ║
║   Reading only one document is INSUFFICIENT.                              ║
║   You MUST read ALL documents to understand KB architecture.              ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## Document Order (Read in Sequence)

| Order | File | Purpose |
|-------|------|---------|
| 1 | `knowledge-base-patterns.md` | Quick reference, Golden Rule, module index |
| 2 | `kb-construction.md` | HOW to build: chunking, embeddings, WAL, HNSW |
| 3 | `kb-agent-integration.md` | HOW to use: anti-simplification, binding protocol |
| 4 | `kb-production.md` | Deployment: Docker, troubleshooting |
| 5 | **`kb-gateway-architecture.md`** | **CODE GENERATION: MCP server that REQUIRES KB** |

---

## 🚀 AUTOMATED KB WORKFLOW

When you say **"Build me a knowledge base on X"**, the system runs this complete automation:

```
┌─────────────────────────────────────────────────────────────────┐
│              AUTOMATED KB CREATION WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: KB CREATION                                           │
│  ─────────────────────                                          │
│  1. Spawn researcher agents (parallel web + docs search)        │
│  2. Structure findings into KB entries                          │
│  3. Ingest to ruvector-postgres with embeddings                 │
│                                                                  │
│  PHASE 2: QUALITY LOOP (until ALL scores ≥ 98)                  │
│  ─────────────────────────────────────────────                  │
│  1. Quality agent scores 5 dimensions (1-100):                  │
│     - Completeness, Accuracy, Depth, Coverage, Structure        │
│  2. Gap analysis identifies missing topics                      │
│  3. Research agent fills gaps                                   │
│  4. REPEAT until ALL dimensions score ≥ 98                      │
│                                                                  │
│  PHASE 3: KB-GATEWAY MCP SETUP                                  │
│  ─────────────────────────────                                  │
│  1. Verify kb-gateway MCP server is registered                  │
│  2. Test kb_status, kb_search, kb_code_gen tools                │
│  3. Validate KB accessibility                                   │
│                                                                  │
│  PHASE 4: VISUALIZATION                                         │
│  ─────────────────────                                          │
│  1. Run /ruvnet-kb-visual                                       │
│  2. Generate {Project}-kb-visualization.html                    │
│  3. Verify all categories appear                                │
│                                                                  │
│  PHASE 5: DOCUMENTATION                                         │
│  ─────────────────────                                          │
│  1. Update README with:                                         │
│     - KB schema and connection details                          │
│     - How to query the KB                                       │
│     - KB-Gateway tool usage                                     │
│     - How to build apps using KB                                │
│                                                                  │
│  PHASE 6: READY FOR APP BUILDING                                │
│  ───────────────────────────────                                │
│  All code generation MUST go through kb_code_gen               │
│  Every file has KB citation header                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Trigger the Automation

```bash
/kb-build create "Your topic here"
```

Or simply say:
> "Build me a knowledge base on [topic]"

---

## The Golden Rule

```
Agents MUST query the KB for EVERY question.
Agents MUST NOT simplify KB into rules.
Agents MUST cite sources in EVERY response.
Code MUST go through kb_code_gen, NOT raw Write.
```

---

## KB-Gateway: Code Generation Through KB

**The KB-Gateway MCP server makes KB the ONLY path to code generation.**

See `kb-gateway-architecture.md` for full details.

### Quick Reference

| Tool | Purpose |
|------|---------|
| `mcp__kb-gateway__kb_code_gen` | **PRIMARY** - Generate code from KB |
| `mcp__kb-gateway__kb_search` | Query KB for patterns |
| `mcp__kb-gateway__kb_status` | Check connection/stats |
| `mcp__kb-gateway__kb_validate` | Validate code compliance |

### Every Generated File MUST Have

```javascript
/**
 * KB-Generated: 2025-12-30T14:30:00.000Z
 * Schema: project_name
 * Sources:
 * - "Pattern A" (94% match)
 * - "Pattern B" (87% match)
 *
 * Coverage: FULL
 * Session: kb-1735577400000
 */
```

---

## Purpose of This Folder

This folder (`docs/ruvnet-knowledgebase-patterns/`) contains the **DEFINITIVE** architecture
for building knowledge-based agentic applications using the RuvNet stack. When `/ruvnet-stack`
or `/ruvnet-update` is run, this folder is automatically synced.

---

## Integration Points

- **KB-Gateway MCP**: Code generation requires KB query first
- **Agentic Flow**: 150+ agents with KB binding via `EnforcedKBAccess`
- **Ruflo**: Hive Mind orchestration with KB grounding
- **ruvector-postgres**: 77+ SQL functions, <1.2ms search

---

## For New Projects

When starting a new KB-powered application:

1. Run `/ruvnet-stack` to install packages
2. Read ALL documents in this folder (especially `kb-gateway-architecture.md`)
3. Run `/kb-build create "your topic"` to build the KB
4. Wait for quality loop to complete (scores ≥ 98)
5. Verify visualization works
6. Build app using `kb_code_gen` for all code

---

## Never Do These Things

- ❌ Read only one document
- ❌ Use `Write` for code files without `kb_code_gen`
- ❌ Generate code without KB citation headers
- ❌ Summarize KB into "5 key rules"
- ❌ Skip the anti-simplification patterns
- ❌ Respond without citing KB sources
- ❌ Ship a KB without the Knowledge Universe visualization
- ❌ Ship a KB with quality scores below 98
- ❌ Create visualizations with more than 9 primary categories (see Max 9 Rule)

---

## 🌌 Knowledge Universe Visualization

**A knowledge base isn't complete until users can SEE it.**

Every KB-powered application MUST include the Knowledge Universe visualization:

```bash
# Build the visualization
/ruvnet-kb-visual

# Or via script
node scripts/build-kb-universe.js

# View result
open public/{ProjectName}-kb-visualization.html
```

### Max 9 Rule (Cognitive Science Constraint)

**RULE: Maximum 9 major nodes at any level.**

Based on Miller's Law (7±2 items for working memory), this forces smarter taxonomy:

```
Level 0: Project (center) ─── 1 node
Level 1: Major Themes ─────── MAX 9 nodes
Level 2: Sub-themes ──────── MAX 9 per theme
Level 3: Individual Items ── Unlimited (grouped)
```

The `kb-universe-data.js` script automatically enforces this by merging excess themes into "General".

---

## Connection Details

| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 5435 |
| User | postgres |
| Password | guruKB2025 |
| Schema | `{directory_name}` (lowercase, underscores) |
| Table | `{schema}.architecture_docs` |
