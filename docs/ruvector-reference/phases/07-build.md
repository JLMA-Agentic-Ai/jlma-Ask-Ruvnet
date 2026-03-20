# Phase 7: Application Build (KB Enforced)

## Purpose

Build the application with **strict KB enforcement**. No hardcoded domain logic. No shortcuts. Every piece of domain knowledge comes from the KB.

---

## ⚠️ Critical Warning

**This is where shortcuts happen.**

Common failures:
- "I'll just hardcode this one value..."
- "The KB doesn't have this, so I'll use a default..."
- "This is faster than querying the KB..."

**Every one of these breaks the KB-First principle.**

---

## KB Enforcement Rules

These rules are **non-negotiable**. Generate `KB_ENFORCEMENT.md` and keep it in context throughout development.

```markdown
# KB ENFORCEMENT RULES

## Rule 1: No Hardcoded Domain Logic

❌ WRONG:
```typescript
const withdrawalRate = 0.04;
const retirementAge = 65;
const inflationRate = 0.03;
```

✅ CORRECT:
```typescript
const withdrawalRate = await kb.search("safe withdrawal rate");
const retirementAge = await kb.search("standard retirement age");
const inflationRate = await kb.search("expected inflation rate");
```

## Rule 2: Every Domain Function Queries KB

Every file in `src/domain/` MUST:
- Import from `../kb`
- Query KB for domain knowledge
- Include kbSources in return

❌ WRONG:
```typescript
// src/domain/retirement.ts
export function calculateWithdrawal(portfolio: number) {
  return portfolio * 0.04;  // Where did 0.04 come from?
}
```

✅ CORRECT:
```typescript
// src/domain/retirement.ts
import { kb } from '../kb';

export async function calculateWithdrawal(portfolio: number) {
  const rateResult = await kb.search("safe withdrawal rate");
  return {
    amount: portfolio * rateResult.value,
    kbSources: rateResult.sources
  };
}
```

## Rule 3: All Responses Include kbSources

Every function that returns domain knowledge MUST include the sources.

```typescript
interface DomainResponse<T> {
  data: T;
  kbSources: {
    nodeId: string;
    expert: string;
    confidence: number;
    url: string;
  }[];
}
```

## Rule 4: Startup Verification Required

The application MUST verify KB connection before doing anything else.

```typescript
// src/index.ts - FIRST LINE OF main()
async function main() {
  const kbReady = await kb.verifyConnection();
  if (!kbReady) {
    console.error("KB unavailable. Exiting.");
    process.exit(1);
  }
  
  // Now initialize app
  initializeApp();
}
```

## Rule 5: No Fallback Logic

The KB is the source of truth. If it's unavailable, the app should fail, not use defaults.

❌ WRONG:
```typescript
const rules = await kb.getRules() || DEFAULT_RULES;
```

✅ CORRECT:
```typescript
const rules = await kb.getRules();
if (!rules) {
  throw new Error("KB rules unavailable");
}
```
```

---

## Build Sequence

### 7.1 Generate KB_ENFORCEMENT.md

Create the enforcement rules document above and save it to the project root.

```bash
# This file MUST be in context for all subsequent steps
cat > KB_ENFORCEMENT.md << 'EOF'
[contents above]
EOF
```

### 7.2 Plan Domain Functions

Before writing any code, list ALL domain functions needed:

```markdown
## Domain Functions Plan

### Calculations
- [ ] calculateWithdrawalRate(portfolio, age, riskTolerance)
- [ ] calculateSocialSecurityBenefit(birthYear, claimingAge)
- [ ] calculateRothConversionAmount(income, bracket)
- [ ] calculateMedicarePremium(income)

### Recommendations
- [ ] recommendClaimingAge(profile)
- [ ] recommendAssetAllocation(age, risk)
- [ ] recommendWithdrawalStrategy(situation)

### Comparisons
- [ ] compareScenarios(scenarioA, scenarioB)
- [ ] compareStrategies(strategies[])

### Validations
- [ ] validateProfile(profile)
- [ ] validateScenario(scenario)
```

### 7.3 Implement Domain Functions (One at a Time)

**Implement ONE function at a time. Verify before moving to the next.**

For each function:

1. **Write the function** importing from kb/
2. **Verify immediately:**
   ```bash
   # Check: Does it import from kb?
   grep "from.*kb" src/domain/[file].ts
   
   # Check: Does it return kbSources?
   grep "kbSources" src/domain/[file].ts
   
   # Check: Any hardcoded values?
   grep -E "[0-9]+\.[0-9]+" src/domain/[file].ts  # Decimals
   grep -E "= [0-9]+" src/domain/[file].ts        # Integers
   ```
3. **If verification fails** → Fix before continuing
4. **If verification passes** → Move to next function

### 7.4 Implement API Layer

API routes should:
- Call domain functions (not KB directly)
- Pass through kbSources
- Handle errors appropriately

```typescript
// src/api/routes/retirement.ts
import { calculateWithdrawal } from '../../domain/retirement';

router.post('/calculate-withdrawal', async (req, res) => {
  try {
    const result = await calculateWithdrawal(req.body.portfolio);
    res.json({
      withdrawal: result.data,
      sources: result.kbSources  // Always include sources
    });
  } catch (error) {
    res.status(500).json({ error: 'Calculation failed', kbSources: [] });
  }
});
```

### 7.5 Implement Entry Point

The entry point MUST verify KB first:

```typescript
// src/index.ts
import { kb } from './kb';
import { initializeApp } from './app';

async function main() {
  console.log('Verifying KB connection...');
  
  // FIRST: Verify KB
  const kbHealth = await kb.verifyConnection();
  if (!kbHealth.healthy) {
    console.error('KB unavailable:', kbHealth.error);
    process.exit(1);
  }
  
  console.log(`KB ready: ${kbHealth.nodeCount} nodes`);
  
  // THEN: Initialize app
  await initializeApp();
}

main().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
```

### 7.6 Implement UI

UI components should:
- Display kbSources for transparency
- Show confidence levels
- Handle loading states for KB queries

```tsx
function WithdrawalResult({ result }) {
  return (
    <div>
      <h2>Recommended Withdrawal: ${result.withdrawal}</h2>
      
      {/* Always show sources */}
      <div className="sources">
        <h4>Based on:</h4>
        {result.sources.map(source => (
          <div key={source.nodeId}>
            <span className="expert">{source.expert}</span>
            <span className="confidence">
              {(source.confidence * 100).toFixed(0)}% confidence
            </span>
            <a href={source.url}>Source</a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 7.7 Integration Testing

Test the complete flow:

```typescript
describe('KB Enforcement', () => {
  test('all responses include kbSources', async () => {
    const result = await api.post('/calculate-withdrawal', { portfolio: 1000000 });
    expect(result.sources).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
  });
  
  test('app fails without KB', async () => {
    // Disconnect KB
    await kb.disconnect();
    
    // App should fail to start
    await expect(startApp()).rejects.toThrow();
  });
  
  test('no hardcoded values in domain/', async () => {
    const domainFiles = await glob('src/domain/**/*.ts');
    for (const file of domainFiles) {
      const content = await fs.readFile(file, 'utf-8');
      // Check for suspicious patterns
      expect(content).not.toMatch(/= 0\.\d+/);  // Hardcoded decimals
      expect(content).not.toMatch(/DEFAULT_/);   // Default constants
    }
  });
});
```

---

## Incremental Verification Scripts

Run these after each step:

### verify-domain.sh
```bash
#!/bin/bash
echo "Verifying domain functions..."

errors=0

# Check all domain files import from kb
for file in src/domain/*.ts; do
  if ! grep -q "from.*kb" "$file"; then
    echo "❌ $file does not import from kb/"
    errors=$((errors + 1))
  fi
done

# Check all domain files return kbSources
for file in src/domain/*.ts; do
  if ! grep -q "kbSources" "$file"; then
    echo "❌ $file does not include kbSources"
    errors=$((errors + 1))
  fi
done

# Check for hardcoded values
for file in src/domain/*.ts; do
  if grep -E "= 0\.[0-9]+" "$file" | grep -v "confidence"; then
    echo "⚠️  $file may have hardcoded decimal values"
  fi
done

if [ $errors -eq 0 ]; then
  echo "✅ Domain verification passed"
else
  echo "❌ $errors errors found"
  exit 1
fi
```

### verify-entry.sh
```bash
#!/bin/bash
echo "Verifying entry point..."

# Check verifyConnection is called first
if ! head -20 src/index.ts | grep -q "verifyConnection"; then
  echo "❌ Entry point does not verify KB connection first"
  exit 1
fi

# Check process.exit on failure
if ! grep -q "process.exit(1)" src/index.ts; then
  echo "❌ Entry point does not exit on KB failure"
  exit 1
fi

echo "✅ Entry point verification passed"
```

---

## Intelligence Layer Integration

### For Decision Web (GNN) Applications

```typescript
// src/domain/simulation.ts
import { kb } from '../kb';
import { gnn } from '../intelligence/gnn';

export async function simulateDecision(change: DecisionChange) {
  // Get the decision graph from KB
  const graph = await kb.getDecisionGraph();
  
  // Use GNN to simulate cascade
  const simulation = await gnn.simulate(graph, change);
  
  return {
    data: simulation,
    kbSources: graph.sources
  };
}
```

### For Routing (Attention) Applications

```typescript
// src/domain/query.ts
import { kb } from '../kb';
import { attention } from '../intelligence/attention';

export async function processQuery(query: string) {
  // Route to appropriate expert domain
  const expert = await attention.routeToExpert(query);
  
  // Search within that domain
  const results = await kb.search(query, { namespace: expert.domain });
  
  return {
    data: results,
    kbSources: results.sources,
    routedTo: expert.name
  };
}
```

### For Learning (SONA) Applications

```typescript
// src/domain/recommendation.ts
import { kb } from '../kb';
import { sona } from '../intelligence/sona';

export async function getRecommendation(profile: UserProfile) {
  // Find similar successful patterns
  const patterns = await sona.recallPatterns(profile);
  
  // Get supporting KB content
  const kbContent = await kb.search(patterns[0].query);
  
  return {
    data: {
      recommendation: patterns[0].recommendation,
      basedOn: patterns.map(p => p.summary),
      confidence: patterns[0].confidence
    },
    kbSources: kbContent.sources
  };
}
```

---

## Quality Gate Checklist

Before proceeding to Phase 8:

```
[ ] KB_ENFORCEMENT.md in project root
[ ] All domain functions listed and implemented
[ ] Each function verified (imports kb, returns kbSources)
[ ] No hardcoded domain values
[ ] Entry point verifies KB first
[ ] Entry point exits if KB unavailable
[ ] API routes pass through kbSources
[ ] UI displays sources and confidence
[ ] Integration tests pass
[ ] Intelligence layer properly integrated (if applicable)
```

---

## Common Mistakes to Avoid

### 1. "Just this one constant"
❌ `const MAX_AGE = 100;`
✅ Query KB for age limits

### 2. "Default fallback"
❌ `const rate = kb.get() || 0.04;`
✅ Fail if KB unavailable

### 3. "Caching without source tracking"
❌ Cache value, lose source
✅ Cache entire response including sources

### 4. "Lazy loading gone wrong"
❌ Initialize app, then check KB
✅ Check KB first, then initialize

### 5. "UI showing results without sources"
❌ "Your withdrawal: $40,000"
✅ "Your withdrawal: $40,000 (based on Bengen 1994, 95% confidence)"

---

## Exit Criteria

All domain logic comes from KB. All responses have sources. No shortcuts.

**Proceed to Phase 8: Final Verification**
