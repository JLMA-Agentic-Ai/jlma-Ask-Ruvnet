# Pattern: Decision Web

## When to Use

Your application is a **Decision Web** if:

- Changing one variable affects many others
- You need to answer "what happens if I do X?"
- Decisions are interdependent
- Users compare scenarios

**Examples:** Retirement planning, medical treatment selection, investment portfolio construction, supply chain optimization

---

## Primary Technology: GNN

Graph Neural Networks model the decision web and predict cascade effects.

---

## Architecture

```
User Query: "What if I take Social Security at 70?"
                │
                ▼
┌───────────────────────────────────────────────┐
│              GNN DECISION GRAPH               │
│                                               │
│   SS Age ──affects──► Tax Bracket            │
│     │                    │                    │
│     │                    ▼                    │
│     └──affects──► Roth Conversion Space      │
│                          │                    │
│                          ▼                    │
│                   Medicare Premium           │
└───────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────┐
│           SONA: SIMILAR PATTERNS              │
│  "Users like you who delayed SS saw..."      │
└───────────────────────────────────────────────┘
                │
                ▼
        Response with cascades + patterns
```

---

## Implementation

### 1. Define Decision Graph

```typescript
const retirementGraph = {
  nodes: [
    { id: 'ss_age', type: 'decision', possibleValues: [62, 63, ..., 70] },
    { id: 'roth_conversion', type: 'decision' },
    { id: 'withdrawal_rate', type: 'decision' },
    { id: 'tax_bracket', type: 'outcome' },
    { id: 'portfolio_longevity', type: 'outcome' },
  ],
  edges: [
    { from: 'ss_age', to: 'tax_bracket', weight: 0.8 },
    { from: 'tax_bracket', to: 'roth_conversion', weight: 0.9 },
    // ... all relationships
  ]
};
```

### 2. Simulate Changes

```typescript
const simulation = await gnn.simulate(graph, {
  node: 'ss_age',
  newValue: 70
});
// Returns: directEffects, cascadingEffects, equilibrium
```

### 3. Add SONA for Pattern Learning

```typescript
// Store successful patterns
await sona.storePattern({
  profile: userProfile,
  decision: decision,
  outcome: outcome
});

// Recall similar patterns
const similar = await sona.recallPatterns(userProfile);
```

---

## SONA Configuration

For stable financial domains:
```typescript
{
  ewc_lambda: 0.6,      // High anti-forgetting
  base_lora_rank: 16,   // Deep pattern learning
  pattern_threshold: 0.8 // High quality bar
}
```

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| Cascade prediction accuracy | >85% |
| Pattern recall precision | >75% |
| Scenario comparison agreement | >70% |

---

See `templates/gnn-engine.ts` for full implementation.
