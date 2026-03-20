# Phase 5: KB Integration Layer

## Purpose

Generate a TypeScript SDK that the application uses to access the knowledge base. This becomes the **only** way the app interacts with the KB.

---

## Output Structure

```
src/kb/
├── client.ts       # Core query functions
├── types.ts        # TypeScript interfaces  
├── tree.ts         # Tree navigation functions
├── validator.ts    # Startup verification
└── index.ts        # Single export point
```

---

## Template: types.ts

See `templates/kb-client.ts` for the full implementation.

Key interfaces:
- `KBNode` — A knowledge base node
- `KBSource` — Attribution for a response
- `KBResponse<T>` — Wrapper with sources and confidence
- `KBHealth` — Connection health status

---

## Template: client.ts

Core functions:
- `search(query, namespace)` — Semantic search
- `getByPath(namespace, path)` — Get specific node
- `getChildren(namespace, path)` — Get child nodes
- `logGap(query, namespace)` — Log unanswered query

Every function returns `KBResponse<T>` with:
- `data` — The actual result
- `kbSources` — Expert attribution
- `confidence` — 0.0-1.0 score
- `gap` — Whether this was unanswerable

---

## Template: validator.ts

```typescript
export async function verifyConnection(): Promise<KBHealth> {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as node_count,
        (SELECT COUNT(*) FROM kb_gaps) as gap_count
      FROM kb_nodes
    `);
    
    return {
      healthy: true,
      nodeCount: parseInt(result.rows[0].node_count),
      gapCount: parseInt(result.rows[0].gap_count),
      features: await detectFeatures()
    };
  } catch (error) {
    return {
      healthy: false,
      nodeCount: 0,
      gapCount: 0,
      features: {},
      error: error.message
    };
  }
}
```

---

## Template: index.ts

```typescript
export * from './types';
export * from './client';
export * from './tree';
export { verifyConnection } from './validator';

// Re-export as named 'kb'
import * as client from './client';
import * as tree from './tree';
import { verifyConnection } from './validator';

export const kb = {
  ...client,
  ...tree,
  verifyConnection
};
```

---

## Quality Gate

- [ ] All files compile without errors
- [ ] Exports work correctly
- [ ] `verifyConnection()` returns health status
- [ ] `search()` returns results with sources
- [ ] `logGap()` logs unanswered queries

---

**Proceed to Phase 6: Application Scaffold**
