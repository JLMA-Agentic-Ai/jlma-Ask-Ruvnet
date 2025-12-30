Updated: 2025-12-30 14:50:00 EST | Version 1.0.0
Created: 2025-12-30 14:50:00 EST

# Knowledge Base Patterns - MANDATORY READING

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

This folder contains the **DEFINITIVE** architecture for building knowledge-based
agentic applications using the RuvNet stack. When `/ruvnet-stack` or `/ruvnet-update`
is run, this entire folder should be copied to the new project.

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
