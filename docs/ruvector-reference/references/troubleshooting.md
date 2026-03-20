Updated: 2026-01-01 20:10:00 EST | Version 1.0.0
Created: 2026-01-01 20:10:00 EST

# Troubleshooting Guide

## Quick Diagnosis

```bash
# Run this first for any issue
./scripts/diagnose.sh
```

---

## Common Issues by Phase

### Phase 0: Assessment

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Schema not found" | KB not initialized | Run Phase 1 first |
| Score returns NULL | Empty KB | Check if kb_nodes has data |
| App score = 0 | No src/domain/ | Create domain directory |

### Phase 1: Storage

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Connection refused" | Docker not running | `docker start ruvector-db` |
| "Role does not exist" | Wrong credentials | Check POSTGRES_PASSWORD |
| "Database does not exist" | Fresh container | Run schema.sql |

### Phase 2: KB Creation

| Symptom | Cause | Fix |
|---------|-------|-----|
| Score stuck at ~50 | Missing experts | Add 50+ more expert sources |
| Depth score low | Flat structure | Add 3+ levels of child nodes |
| Completeness low | Many gaps | Run completeness audit |

### Phase 7: Build

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Cannot find module kb" | Wrong import path | Use `../kb` not `./kb` |
| "kbSources undefined" | Missing in return | Add kbSources to all returns |
| Hardcoded value found | Legacy code | Replace with kb.search() |

### Phase 8: Verification

| Symptom | Cause | Fix |
|---------|-------|-----|
| 8.1 fails | Decimals in domain/ | Remove hardcoded numbers |
| 8.4 fails | No verifyConnection | Add to entry point |
| 8.6 fails | NULL source_expert | Update KB nodes |

---

## Database Issues

### Can't Connect

```bash
# Check if container running
docker ps | grep ruvector

# Check logs
docker logs ruvector-db

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# Restart container
docker restart ruvector-db
```

### Slow Queries

```sql
-- Check if index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'kb_nodes';

-- Create if missing
CREATE INDEX IF NOT EXISTS kb_nodes_embedding_idx
ON kb_nodes USING hnsw (embedding vector_cosine_ops);

-- Analyze table
ANALYZE kb_nodes;
```

### Corrupted Data

```sql
-- Find NULL embeddings
SELECT COUNT(*) FROM kb_nodes WHERE embedding IS NULL;

-- Find missing sources
SELECT COUNT(*) FROM kb_nodes WHERE source_expert IS NULL;

-- Find orphaned nodes
SELECT COUNT(*) FROM kb_nodes n
WHERE parent_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM kb_nodes p WHERE p.id = n.parent_id);
```

---

## Scoring Issues

### KB Score Breakdown

```sql
-- Get detailed score breakdown
SELECT
  (SELECT COUNT(DISTINCT source_expert) FROM kb_nodes) as experts,
  (SELECT AVG(confidence) FROM kb_nodes) as avg_confidence,
  (SELECT COUNT(*) FROM kb_nodes WHERE source_expert IS NOT NULL) as attributed,
  (SELECT COUNT(*) FROM kb_nodes) as total,
  (SELECT COUNT(*) FROM kb_gaps) as gaps;
```

### Why Score < 98?

1. **Expert Coverage < 25?**
   - Need 100+ unique experts
   - Run: `SELECT COUNT(DISTINCT source_expert) FROM kb_nodes;`

2. **Depth < 25?**
   - Need avg 4+ levels
   - Check tree structure

3. **Completeness < 25?**
   - Too many gaps
   - Run: `SELECT COUNT(*) FROM kb_gaps;`

4. **Attribution < 15?**
   - Nodes missing source_expert
   - Run: `UPDATE kb_nodes SET source_expert = 'Unknown' WHERE source_expert IS NULL;`

5. **Confidence < 10?**
   - Low average confidence
   - Review and increase where appropriate

---

## Build Issues

### TypeScript Errors

```bash
# Get detailed error
npx tsc --noEmit 2>&1 | head -50

# Common fixes:
# - Missing type: Add interface to types.ts
# - Import error: Check path (../kb vs ./kb)
# - Async issue: Add async/await
```

### Domain Function Fails Verification

```bash
# Check specific file
grep "from.*kb" src/domain/FILE.ts
grep "kbSources" src/domain/FILE.ts
grep -E "= [0-9]+\.[0-9]+" src/domain/FILE.ts
```

### Entry Point Issues

```typescript
// CORRECT pattern
async function main() {
  // FIRST: Verify KB
  const ok = await kb.verifyConnection();
  if (!ok) {
    console.error('KB unavailable');
    process.exit(1);
  }

  // THEN: Start app
  await startApp();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

---

## Swarm Issues

### Agents Not Spawning

```bash
# Check claude-flow version
npx claude-flow --version

# Verify swarm config
npx claude-flow swarm:validate swarm-config.yaml

# Run with debug
DEBUG=claude-flow:* npx claude-flow swarm:run
```

### Parallel Execution Failing

```yaml
# Reduce parallelism
phase_8:
  maxAgents: 4  # Down from 8

  parallel_groups:
    - [code-scanner, import-checker]  # 2 at a time
    - [source-checker, startup-checker]
    - [fallback-checker, attribution-checker]
    - [confidence-checker, gap-checker]
```

---

## Performance Issues

### Search Too Slow (>500ms)

```sql
-- Check index
EXPLAIN ANALYZE
SELECT * FROM kb_nodes
ORDER BY embedding <=> '[...]'::vector
LIMIT 10;

-- Should show "Index Scan using kb_nodes_embedding_idx"
-- If "Seq Scan", recreate index
```

### Embedding Generation Slow

```bash
# Use batch processing
node scripts/generate-embeddings.js --batch-size 100

# Or parallel workers
node scripts/generate-embeddings.js --workers 4
```

### Memory Issues

```bash
# Check Node memory limit
node --max-old-space-size=4096 scripts/heavy-operation.js

# For Docker
docker run -m 4g ...
```

---

## Quick Fixes

### Reset Everything

```bash
# ⚠️ DESTRUCTIVE - loses all data
docker rm -f ruvector-db
docker volume rm ruvector-data
rm -rf src/domain/*.ts
rm -rf node_modules
npm install
# Then restart from Phase 1
```

### Fix Common Violations

```bash
# Remove all hardcoded values
find src/domain -name "*.ts" -exec sed -i '' 's/= 0\.\([0-9]*\)/= await kb.search("rate")/g' {} \;

# Add kbSources to all returns (manual review needed)
grep -rn "return {" src/domain/

# Add KB import to all domain files
for f in src/domain/*.ts; do
  grep -q "from.*kb" "$f" || sed -i '' '1i\
import { kb } from "../kb";
' "$f"
done
```

### Regenerate Verification Scripts

```bash
# Extract scripts from phase-8-verification.md
./scripts/extract-verification-scripts.sh

# Make executable
chmod +x scripts/8.*.sh
```

---

## Getting Help

### Debug Mode

```bash
# Verbose scoring
DEBUG=1 ./scripts/score-kb.sh

# Verbose verification
DEBUG=1 ./scripts/verify-all.sh

# Verbose swarm
DEBUG=claude-flow:* npx claude-flow swarm:run
```

### Collect Diagnostics

```bash
#!/bin/bash
# scripts/collect-diagnostics.sh

echo "=== System Info ===" > diagnostics.txt
uname -a >> diagnostics.txt
node --version >> diagnostics.txt
docker --version >> diagnostics.txt

echo "=== Database ===" >> diagnostics.txt
psql "$DATABASE_URL" -c "SELECT version();" >> diagnostics.txt 2>&1
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM kb_nodes;" >> diagnostics.txt 2>&1

echo "=== Scores ===" >> diagnostics.txt
./scripts/score-kb.sh >> diagnostics.txt 2>&1
./scripts/score-app.sh >> diagnostics.txt 2>&1

echo "=== Verification ===" >> diagnostics.txt
./scripts/verify-all.sh >> diagnostics.txt 2>&1

echo "Diagnostics saved to diagnostics.txt"
```

---

## FAQ

**Q: Can I skip Phase 0 for existing apps?**
A: No. Phase 0 is mandatory for brownfield. It prevents assumptions.

**Q: Score is 97, can I proceed?**
A: No. Gate requires ≥98. Fix the remaining 1-3 points.

**Q: Verification takes too long**
A: Run in parallel with swarm, or run only failing checks.

**Q: How do I add a new domain function?**
A: 1) Add to domain plan, 2) Implement with KB query, 3) Return kbSources, 4) Verify

**Q: KB search returns wrong results**
A: Check embeddings are correct, rebuild index, review content quality.
