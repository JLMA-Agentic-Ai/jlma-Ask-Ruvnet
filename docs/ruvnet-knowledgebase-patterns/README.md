Updated: 2025-12-30 10:15:00 EST | Version 1.3.0
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

## The Golden Rule

```
Agents MUST query the KB for EVERY question.
Agents MUST NOT simplify KB into rules.
Agents MUST cite sources in EVERY response.
```

## Purpose of This Folder

This folder (`docs/ruvnet-knowledgebase-patterns/`) contains the **DEFINITIVE** architecture
for building knowledge-based agentic applications using the RuvNet stack. When `/ruvnet-update`
is run, this folder is automatically synced from `~/.claude/docs/ruvnet-knowledgebase-patterns/`.

## Integration Points

- **Agentic Flow**: 150+ agents with KB binding via `EnforcedKBAccess`
- **Claude Flow**: Hive Mind orchestration with KB grounding
- **ruvector-postgres**: 77+ SQL functions, <1.2ms search

## For New Projects

When starting a new KB-powered application:

1. Run `/ruvnet-stack` to install packages and copy this folder
2. Read ALL documents in this folder
3. Implement `EnforcedKBAccess` wrapper (see kb-agent-integration.md)
4. Follow anti-simplification patterns
5. Use `npm run kb:ingest` to populate your KB

## Never Do These Things

- ❌ Read only one document
- ❌ Summarize KB into "5 key rules"
- ❌ Skip the anti-simplification patterns
- ❌ Cache KB results
- ❌ Respond without citing KB sources
- ❌ Ship a KB without the Knowledge Universe visualization

## 🌌 Knowledge Universe Visualization

**A knowledge base isn't complete until users can SEE it.**

Every KB-powered application MUST include the Knowledge Universe visualization:

```bash
# Build the visualization
npm run kb:visual

# View result
open public/knowledge-universe.html
```

This provides:
- Interactive 3D navigation of the entire KB
- Click-to-expand category hierarchy
- Search functionality
- Visual validation that ingestion worked

See `/ruvnet-kb-visual` skill for full documentation.
