# ADR-002: Prescriptive Intelligence — GitNexus Integration & Golden Path Prioritization

> Created: 2026-04-02 | Status: IMPLEMENTING

## Context

Ask-RuvNet has 507 knowledge base entries (was 502) covering the RuVector ecosystem. The entries are high quality (avg 97/100) but the system delivers them **encyclopedically** — it treats a conceptual "what is HNSW?" entry the same as a prescriptive "use RVF, here's the 3-line code" entry. Users who ask "how do I store vectors?" get a balanced mix of options instead of a clear recommendation.

On 2026-04-02, GitNexus (v1.5.3) was used to index 13 RuvNet repos, producing 652K symbols and 1.2M dependency edges. This structural analysis revealed:

1. **Module cohesion scores** prove which entry points are self-contained (RVF WASM: 0.97) vs scattered (Postgres attention: 0.21, Security: 0.18)
2. **Cross-crate call chains** show SONA touches 7 external crates — users shouldn't use it directly
3. **The KB had zero entries** on dependencies, blast radius, execution flows, or module boundaries
4. **5 "implementation-path" entries** were created with prescriptive golden paths backed by this structural evidence

But adding 5 entries to a pile of 507 doesn't make the system smarter. The RAG pipeline has no awareness that implementation-path entries should be prioritized when users are asking HOW to do something.

## Decision

Make the RAG pipeline **intent-aware and prescriptive**. When a user's query signals implementation intent ("how do I", "getting started", "build", "create", "implement"), the system must:

1. **Boost implementation-path entries by 5x** in the reranking stage (same mechanism as gold boost)
2. **Detect implementation intent** and inject a system prompt directive to lead with prescriptive content
3. **Surface anti-patterns proactively** when conceptual entries about deprecated/complex paths appear alongside golden paths

This is not about hiding information — it's about **leading with the best answer** the way a good mentor would.

## Architecture Change

### Before (encyclopedic)
```
User: "how do I store vectors?"
  → Vector search returns: RVF entry, postgres entry, WASM entry, teaching entry
  → All scored equally by cosine similarity
  → System prompt: generic "follow response structure"
  → LLM: presents all options neutrally
  → User: confused, picks wrong one
```

### After (prescriptive)
```
User: "how do I store vectors?"
  → Vector search returns same entries
  → STAGE 4d: Implementation intent detected ("how do I")
  → STAGE 4d: implementation-path entries boosted 5x
  → STAGE 4d: System prompt injected: "Lead with the golden path"
  → LLM: "Use RVF. Here's the code. Don't use postgres unless..."
  → User: working in 30 seconds, hooked, builds more
```

## Implementation

### Change 1: Intent Detection + Golden Path Boost (app.js, Stage 4d)

After Stage 4c (gold/curated boost), add Stage 4d:

```javascript
// STAGE 4d: Implementation intent detection + Golden Path boost
const IMPLEMENTATION_INTENT = [
    /^how\s+(do|can|should|to|would)/i,
    /^(get|getting)\s+started/i,
    /^(build|create|implement|set\s*up|install|configure|deploy|add|use|integrate)/i,
    /^I\s+(want|need)\s+to/i,
    /^(quick|fast|best|right)\s+(start|way|path|approach)/i,
    /^what('s| is)\s+the\s+(best|right|recommended)/i,
    /^(step|steps|guide|tutorial|walkthrough|example)/i,
];
const hasImplementationIntent = IMPLEMENTATION_INTENT.some(p => p.test(message.trim()));

if (hasImplementationIntent) {
    boostedResults.forEach(r => {
        const category = r.metadata?.category || '';
        if (category === 'implementation-path') {
            const base = r.rerankedScore || r.score || 0;
            r.rerankedScore = base * 5.0;  // Golden paths dominate
            r.isGoldenPath = true;
        }
    });
    // Re-sort
    boostedResults.sort((a, b) =>
        (b.rerankedScore || b.score || 0) - (a.rerankedScore || a.score || 0)
    );
}
```

### Change 2: System Prompt Injection (app.js, system prompt build)

When implementation-path entries are in the context, inject a prescriptive directive:

```javascript
const hasGoldenPaths = sources.some(s => s.metadata?.category === 'implementation-path');

// In system prompt:
${hasGoldenPaths ? `
===== PRESCRIPTIVE MODE =====
Your context includes Golden Path entries (category: implementation-path). These are
VERIFIED, OPINIONATED best practices backed by structural analysis of 652K code symbols.
RULES:
- Lead with the Golden Path. Put the recommended code FIRST, before any explanation.
- State the anti-pattern explicitly: "Do NOT use X for this because..."
- Only mention alternatives AFTER the golden path is established.
- Include the "Graduate When" threshold so users know when to level up.
The goal: the user should have working code in 30 seconds.` : ''}
```

### Change 3: Anti-Pattern Injection (app.js, Stage 6)

When a teaching entry about a deprecated/complex path appears in results AND a golden path for the same topic exists, annotate the teaching entry:

```javascript
// In Stage 6 (source mapping), annotate entries that have golden path alternatives
const goldenPathTopics = sources
    .filter(s => s.metadata?.category === 'implementation-path')
    .map(s => s.title?.toLowerCase() || '');

sources.forEach(s => {
    if (s.metadata?.category !== 'implementation-path') {
        const isAlternativeToGolden = goldenPathTopics.some(gp =>
            gp.includes('vector') && s.content?.toLowerCase().includes('postgres') ||
            gp.includes('swarm') && s.content?.toLowerCase().includes('mesh') ||
            gp.includes('sona') && s.content?.toLowerCase().includes('sona') && !s.content?.toLowerCase().includes('intelligenceengine')
        );
        if (isAlternativeToGolden) {
            s.content = `⚠️ NOTE: A simpler recommended approach exists (see Golden Path entry above). This entry describes the advanced/alternative path.\n\n${s.content}`;
        }
    }
});
```

## What This Does NOT Change

- The 502 existing entries remain untouched
- Non-implementation queries ("what is HNSW?", "explain attention mechanisms") work exactly as before
- The vector search, query expansion, hybrid search, and multi-hop retrieval are unchanged
- Only the reranking and system prompt stages are modified

## Risks

- **Over-prescription**: Some users may want the encyclopedic view. Mitigation: only triggers on implementation-intent queries.
- **Stale golden paths**: If the RVF API changes, the code examples become wrong. Mitigation: golden paths are in kb-master.json and can be updated by auto-curation.
- **5x boost too aggressive**: May push golden paths above more relevant entries. Mitigation: only applies when intent is detected, and only to implementation-path category.

## Success Metrics

- Users asking "how do I store vectors?" get RVF code as the first thing they see
- Users asking "what is HNSW?" get the existing teaching entry (unchanged)
- Time from question to working code: <60 seconds for the 5 golden path topics
- No user should accidentally start with postgres for a new application

## GitNexus Integration Reference

13 repos indexed (2026-04-02): 652K nodes, 1.2M edges, 23.5K clusters.
Cohesion data used to validate golden path recommendations:
| Module | Cohesion | Recommendation |
|--------|----------|----------------|
| RVF WASM | 0.97 | Default for new apps |
| Ruflo SDK | 0.97 | Default for agent coordination |
| Agentic-flow Services | 0.98 | Default for self-learning |
| RuVector Security | 0.18 | Wrap with AIMDS, don't use directly |
| Postgres Attention | 0.21 | Don't use for new apps |
| Ruflo MCP-tools | 0.59 | Use SDK instead |
