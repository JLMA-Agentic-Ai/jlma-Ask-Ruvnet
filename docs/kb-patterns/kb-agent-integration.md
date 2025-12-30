Updated: 2025-12-30 14:30:00 EST | Version 1.0.0
Created: 2025-12-30 14:30:00 EST

# KB Agent Integration Patterns

**How to Use Knowledge Bases with Agents** - Binding, anti-simplification, enforcement

---

## The Golden Rule: No Simplification

```
╔═══════════════════════════════════════════════════════════════════════════╗
║   Agents MUST query the KB for EVERY question.                            ║
║   Agents MUST NOT simplify, summarize, or distill KB into rules.          ║
║   Agents MUST cite sources explicitly in EVERY response.                  ║
║   Agents MUST acknowledge knowledge gaps.                                 ║
║   VIOLATION OF THIS RULE DESTROYS THE VALUE OF THE KB.                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### The Problem: Rule Distillation

```
❌ WRONG: Agent reads KB → Extracts "5 key rules" → Ignores KB → Uses rules only
   Result: Lost nuance, missed edge cases, outdated info, wrong answers

✅ CORRECT: Agent receives query → Queries KB real-time → Uses full context → Cites sources
   Result: Complete info, current data, proper nuance, correct answers
```

### Forbidden Patterns

```yaml
FORBIDDEN PHRASES:
  - "Based on my understanding of the KB..."
  - "The key principles are..."
  - "From what I recall from the knowledge base..."
  - "Generally speaking..."

REQUIRED PHRASES:
  - "Let me query the knowledge base for [query]..."
  - "The KB returns [X results] for this question..."
  - "According to [KB source]: [exact content]..."
```

---

## Agent-KB Binding Protocol

### Five Levels of Binding

```
LEVEL 1: QUERY BINDING
├── Every question triggers KB query
├── KB query is logged
└── Zero tolerance for skipped queries

LEVEL 2: CONTEXT BINDING
├── KB results become part of prompt
├── Agent sees raw KB content (not summaries)
└── Similarity scores visible

LEVEL 3: RESPONSE BINDING
├── Response MUST cite KB sources
├── Direct quotes required
└── Gaps acknowledged explicitly

LEVEL 4: VERIFICATION BINDING
├── Post-response validation
├── Citation checker runs automatically
└── Violations logged

LEVEL 5: LEARNING BINDING
├── Successful patterns stored
├── Gap patterns trigger KB enhancement
└── Continuous feedback loop
```

### EnforcedKBAccess Class (REQUIRED)

```javascript
class EnforcedKBAccess {
    constructor(kbClient, sessionId) {
        this.kb = kbClient;
        this.sessionId = sessionId;
        this.queryLog = [];
        this.NO_CACHE = true;  // Cache is FORBIDDEN
    }

    async query(queryText, options = {}) {
        const queryRecord = {
            timestamp: Date.now(),
            sessionId: this.sessionId,
            query: queryText
        };

        // Execute KB search (NO CACHE)
        const results = await this.kb.search({
            query: queryText,
            ...options,
            nocache: true,
            timestamp: Date.now()
        });

        queryRecord.resultCount = results.length;
        queryRecord.topSimilarity = results[0]?.similarity || 0;
        this.queryLog.push(queryRecord);

        return {
            results,
            metadata: {
                queryId: queryRecord.timestamp,
                mustCite: true,
                sources: results.map(r => ({
                    title: r.title,
                    source: r.source,
                    similarity: r.similarity,
                    content: r.content
                }))
            }
        };
    }

    verifyCitation(response, queryMetadata) {
        const errors = [];
        if (!response.kb_queries_made?.length) {
            errors.push("VIOLATION: No KB queries recorded");
        }
        if (!response.kb_results_used?.length) {
            errors.push("VIOLATION: No KB results cited");
        }
        if (!response.raw_kb_content) {
            errors.push("VIOLATION: No raw KB content included");
        }
        if (errors.length > 0) {
            throw new Error(`Anti-Simplification Violation:\n${errors.join('\n')}`);
        }
        return true;
    }
}
```

### Required Response Structure

```javascript
// EVERY agent response MUST include:
{
    answer: "...",
    kb_queries_made: ["query1", "query2"],     // REQUIRED
    kb_results_used: [                          // REQUIRED
        { title: "...", source: "...", similarity: 0.92 }
    ],
    kb_coverage: "full|partial|gap",            // REQUIRED
    raw_kb_content: "..."                       // REQUIRED
}
```

---

## Agentic Flow Integration

```javascript
import { ModelRouter } from 'agentic-flow/router';
import * as reasoningbank from 'agentic-flow/reasoningbank';

class KBBoundAgentFlow {
    constructor(kbClient) {
        this.router = new ModelRouter();
        this.kb = new EnforcedKBAccess(kbClient, 'agentic-flow-session');
    }

    async processQuery(query, agentType = 'consultant') {
        // Step 1: MANDATORY KB Query
        const kbResult = await this.kb.query(query, { limit: 5, minSimilarity: 0.65 });

        // Step 2: Build KB-grounded context
        const context = this.buildKBContext(kbResult);

        // Step 3: Route to agent WITH KB context
        const response = await this.router.chat({
            model: 'auto',
            messages: [
                { role: 'system', content: `Use this KB info. Cite sources:\n${context}` },
                { role: 'user', content: query }
            ]
        });

        // Step 4: Store in ReasoningBank
        await reasoningbank.storeMemory(`query:${Date.now()}`, JSON.stringify({
            query, kbSources: kbResult.metadata.sources, response: response.text
        }), { namespace: 'kb-interactions' });

        return {
            answer: response.text,
            kb_queries_made: [query],
            kb_results_used: kbResult.metadata.sources,
            raw_kb_content: kbResult.results.map(r => r.content).join('\n\n')
        };
    }

    buildKBContext(kbResult) {
        if (kbResult.results.length === 0) {
            return 'NO KB RESULTS. Acknowledge this gap.';
        }
        return kbResult.results.map((r, i) =>
            `### Source ${i+1}: ${r.title}\n**Similarity**: ${(r.similarity*100).toFixed(1)}%\n${r.content}`
        ).join('\n---\n');
    }
}
```

---

## Claude Flow Integration

```javascript
async function hiveMindKBSwarm(objective, kbClient) {
    const kb = new EnforcedKBAccess(kbClient, 'hive-mind-session');

    const swarm = await initializeHiveMind({
        topology: 'hierarchical',
        maxAgents: 8,
        kbBinding: kb  // ALL agents inherit KB binding
    });

    const plan = await swarm.queen.plan(objective, {
        requireKBValidation: true
    });

    const results = await swarm.execute(plan, {
        workerConfig: {
            preTask: async (task) => {
                task.kbContext = await kb.query(task.description);
            },
            postTask: async (task, result) => {
                kb.verifyCitation(result, task.kbContext.metadata);
            }
        }
    });

    return results;
}
```

---

## Enforcement Hooks

```javascript
// .claude/hooks/kb-enforcement.js
module.exports = {
    'pre-task': async ({ task }) => {
        if (!task.kbQuery) {
            task.kbQuery = task.description;
        }
    },

    'post-task': async ({ task, result }) => {
        if (!result.kb_results_used?.length) {
            throw new Error(`KB VIOLATION: Task completed without citations`);
        }
    },

    'session-end': async ({ session }) => {
        const kbQueries = session.queryLog.filter(q => q.type === 'kb');
        console.log(`Total KB Queries: ${kbQueries.length}`);
    }
};
```

---

## Verification Checklist

Before any agent response is finalized:

- [ ] Response contains `kb_queries_made` array
- [ ] Response contains `kb_results_used` with titles/sources
- [ ] Response contains `raw_kb_content`
- [ ] Response does NOT contain "based on my understanding"
- [ ] Response does NOT summarize rules without citations
- [ ] Knowledge gaps are acknowledged

---

## Confidence Scoring

```javascript
function calculateConfidence(kbResults) {
    if (kbResults.length === 0) return 0;
    const avgSimilarity = kbResults.reduce((s,k) => s + k.similarity, 0) / kbResults.length;
    const coverage = Math.min(kbResults.length / 3, 1);
    return (avgSimilarity * 0.6) + (coverage * 0.4);
}

// Tiers:
// > 85%: Direct, confident answer
// 60-85%: Answer with caveats
// 40-60%: Partial answer
// < 40%: Acknowledge gap
```
