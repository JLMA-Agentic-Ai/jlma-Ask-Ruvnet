# Phase 6: Application Scaffold

## Purpose

Create the project structure with KB enforcement built in from the start.

---

## Output Structure

```
[PROJECT]/
├── src/
│   ├── kb/              # FROM PHASE 5 (treat as read-only)
│   │   ├── client.ts
│   │   ├── types.ts
│   │   ├── tree.ts
│   │   ├── validator.ts
│   │   └── index.ts
│   │
│   ├── intelligence/    # GNN/Attention/SONA (based on pattern)
│   │   ├── gnn.ts       # If Decision Web
│   │   ├── attention.ts # If Routing
│   │   └── sona.ts      # If Learning
│   │
│   ├── domain/          # Domain logic (MUST use kb/)
│   │   └── [domain-specific files]
│   │
│   ├── api/             # Routes
│   │   └── routes/
│   │
│   ├── components/      # UI components
│   │
│   ├── pages/           # Page compositions
│   │
│   └── index.ts         # Entry point (KB verification FIRST)
│
├── visualization/       # From Phase 4
│
├── scripts/             # Verification scripts
│   ├── verify-domain.sh
│   ├── verify-api.sh
│   └── verify-entry.sh
│
├── KB_ENFORCEMENT.md    # Rules document
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## KB_ENFORCEMENT.md

Create this file in the project root and keep it in context throughout development:

```markdown
# KB ENFORCEMENT RULES

This document defines the rules for KB-First development.
ALL code must comply with these rules.

## Rule 1: No Hardcoded Domain Logic
Every domain value comes from the KB.

## Rule 2: Every Domain Function Queries KB  
Every file in src/domain/ imports from ../kb

## Rule 3: All Responses Include kbSources
Traceability is mandatory.

## Rule 4: Startup Verification Required
App exits if KB unavailable.

## Rule 5: No Fallback Logic
KB is the source of truth.

See phases/07-build.md for full details and examples.
```

---

## Entry Point Template

```typescript
// src/index.ts
import { kb } from './kb';
import { initializeApp } from './app';

async function main() {
  console.log('Starting application...');
  
  // FIRST: Verify KB connection
  console.log('Verifying knowledge base...');
  const health = await kb.verifyConnection();
  
  if (!health.healthy) {
    console.error('KB unavailable:', health.error);
    console.error('Cannot start application without knowledge base.');
    process.exit(1);
  }
  
  console.log(`KB ready: ${health.nodeCount} nodes, ${health.gapCount} logged gaps`);
  
  // THEN: Initialize application
  await initializeApp();
  
  console.log('Application started successfully');
}

main().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
```

---

## Quality Gate

- [ ] Directory structure created
- [ ] KB_ENFORCEMENT.md in project root
- [ ] Entry point verifies KB first
- [ ] Entry point exits on KB failure
- [ ] Domain directory empty (ready for Phase 7)

---

**Proceed to Phase 7: Application Build**
