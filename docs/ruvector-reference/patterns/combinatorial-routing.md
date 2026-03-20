# Pattern: Combinatorial Routing

## When to Use

Your application is **Combinatorial Routing** if:

- Multiple expert domains exist
- Queries need to go to different specialists
- Need to compare many options efficiently
- Real-time or frequently changing data

**Examples:** Travel fare optimization, resource allocation, customer support routing, recommendation with constraints

---

## Primary Technology: Attention (MoE)

Mixture of Experts routes queries to the right specialist domain.

---

## Architecture

```
User Query: "Find me cheap business class to Tokyo using points"
                │
                ▼
┌───────────────────────────────────────────────┐
│              MoE EXPERT ROUTING               │
│                                               │
│   Query ──► Award Travel Expert (0.85)       │
│         ──► Cash Fares Expert (0.45)         │
│         ──► Positioning Expert (0.72)        │
│                                               │
│   Route to: Award + Positioning              │
└───────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────┐
│           CROSS-ATTENTION: COMPARE            │
│   Option A vs B vs C → Ranked by criteria    │
└───────────────────────────────────────────────┘
                │
                ▼
        Best option with reasoning
```

---

## Implementation

### 1. Define Expert Domains

```typescript
const experts = {
  award_travel: {
    embedding: await embed("points miles redemption transfer"),
    handler: searchAwardKB
  },
  cash_fares: {
    embedding: await embed("cash tickets pricing sales"),
    handler: searchCashKB
  },
  positioning: {
    embedding: await embed("positioning flights connections routing"),
    handler: searchPositioningKB
  }
};
```

### 2. Route to Experts

```typescript
const router = new AttentionRouter({ mechanism: 'moe', topK: 2 });
const routedExperts = await router.route(query, experts);
```

### 3. Compare Options

```typescript
const comparison = await attention.rankOptions(options, {
  criteria: ['price', 'convenience', 'value'],
  weights: userPreferences
});
```

---

## Secondary: GNN for Partner Networks

```typescript
// Model airline partner/transfer network
const partnerGraph = await buildPartnerGraph();
const transferPath = await gnn.shortestPath(
  partnerGraph, 
  'amex_points', 
  'ana_miles'
);
```

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| Routing accuracy | >90% |
| Option comparison relevance | >85% |
| User satisfaction | >80% |

---

See `templates/attention-router.ts` for full implementation.
