# Pattern: Scenario Learning

## When to Use

Your application is **Scenario Learning** if:

- "What worked for people like me?" is the core value
- You have feedback to learn from
- Parameter sensitivity matters
- Building institutional knowledge over time

**Examples:** Business model simulation, strategy recommendation, personalized coaching, A/B test learning

---

## Primary Technology: SONA

Self-Optimizing Neural Architecture remembers what worked.

---

## Architecture

```
User Profile: "B2B SaaS, $2M ARR, 15 employees"
                │
                ▼
┌───────────────────────────────────────────────┐
│              SONA PATTERN RECALL              │
│                                               │
│   Profile ──► Find Similar Businesses        │
│                     │                         │
│                     ▼                         │
│   "Companies like yours that used freemium   │
│    saw 23% better conversion (n=47)"         │
└───────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────┐
│           GNN: SIMULATE DYNAMICS              │
│   Model business feedback loops               │
└───────────────────────────────────────────────┘
                │
                ▼
        Recommendation with evidence
```

---

## Implementation

### 1. Configure SONA for Domain

```typescript
const sona = new SonaEngine({
  hidden_dim: 256,
  pattern_clusters: 64,
  ewc_lambda: 0.4,      // Balanced for business domain
  base_lora_rank: 12,
  pattern_quality_threshold: 0.7
});
```

### 2. Store Successful Patterns

```typescript
await sona.storePattern({
  embedding: await embedProfile(businessProfile),
  pattern: {
    profile: businessProfile,
    strategy: chosenStrategy,
    outcome: measuredOutcome
  },
  quality: calculateQuality(outcome)
});
```

### 3. Recall for New Users

```typescript
const similar = await sona.recallPatterns(
  newUserProfile,
  { limit: 10, minQuality: 0.7 }
);

const recommendation = synthesize(similar);
```

---

## SONA Configuration by Domain

| Domain | ewc_lambda | base_lora_rank |
|--------|------------|----------------|
| Finance | 0.6 | 16 |
| Business | 0.4 | 12 |
| Marketing | 0.3 | 8 |

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| Pattern relevance | >80% |
| Recommendation adoption | >60% |
| Outcome improvement | >20% |

---

See `references/sona-config.md` for full configuration guide.
