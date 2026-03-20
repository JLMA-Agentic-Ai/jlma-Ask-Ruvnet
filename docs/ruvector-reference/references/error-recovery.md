Updated: 2026-01-01 20:10:00 EST | Version 1.0.0
Created: 2026-01-01 20:10:00 EST

# Error Recovery & Rollback Procedures

## Purpose

When things go wrong during KB-First transformation, you need clear recovery procedures. This document covers:
- Error detection
- Recovery strategies
- Rollback procedures
- State preservation

---

## Error Categories

| Category | Severity | Recovery | Example |
|----------|----------|----------|---------|
| Gate Failure | 🟡 Low | Fix and retry | Score < 98 |
| Script Error | 🟠 Medium | Debug and retry | Verification script fails |
| Data Corruption | 🔴 High | Rollback required | KB entries malformed |
| Infrastructure | 🔴 Critical | Full stop | Database unreachable |

---

## Phase-Specific Recovery

### Phase 0: Assessment Errors

**Error:** Can't connect to database for scoring
```
Recovery:
1. Check DATABASE_URL is set
2. Verify Docker container is running
3. Test connection: psql "$DATABASE_URL" -c "SELECT 1"
4. If still failing, start fresh Phase 1
```

**Error:** Scoring script returns unexpected results
```
Recovery:
1. Review score-kb.sh output
2. Check for NULL values in kb_nodes
3. Re-run with verbose mode: bash -x scripts/score-kb.sh
4. If schema issue, may need to migrate
```

---

### Phase 1: Storage Errors

**Error:** Docker container won't start
```bash
# Recovery steps
docker logs ruvector-db  # Check logs
docker rm -f ruvector-db  # Remove broken container
docker volume rm ruvector-data  # Remove corrupted volume (CAUTION: data loss)

# Fresh start
docker run -d --name ruvector-db \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  -v ruvector-data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest
```

**Error:** Schema creation fails
```bash
# Check existing schema
psql "$DATABASE_URL" -c "\dt"

# Drop and recreate (CAUTION: data loss)
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" -f templates/schema.sql
```

---

### Phase 2: KB Creation Errors

**Error:** Score stuck below 98 after multiple iterations
```
Recovery:
1. Review which component is low:
   - Expert Coverage: Add more expert sources
   - Depth: Add more child nodes
   - Completeness: Fill identified gaps
   - Attribution: Add source_expert to nodes
   - Confidence: Review and adjust scores

2. If fundamentally flawed:
   - Export current KB: pg_dump > kb_backup.sql
   - Identify structural issues
   - May need to restart Phase 2 from 2.1
```

**Error:** Expert discovery returns duplicates
```
Recovery:
1. Deduplicate experts:
   DELETE FROM kb_nodes a USING kb_nodes b
   WHERE a.id < b.id
   AND a.source_expert = b.source_expert
   AND a.content = b.content;

2. Re-run scoring
```

---

### Phase 3: Persistence Errors

**Error:** Embedding generation fails
```
Recovery:
1. Check embedding service is available
2. Retry failed nodes:
   UPDATE kb_nodes SET embedding = NULL WHERE embedding IS NULL;
   -- Then re-run embedding generation

3. If systematic failure, check for content issues:
   SELECT id, LENGTH(content) FROM kb_nodes
   WHERE embedding IS NULL ORDER BY LENGTH(content) DESC;
   -- May have content too long for embedding model
```

**Error:** HNSW index creation fails
```
Recovery:
1. Check for NULL embeddings:
   SELECT COUNT(*) FROM kb_nodes WHERE embedding IS NULL;

2. Ensure all embeddings same dimension:
   SELECT DISTINCT array_length(embedding, 1) FROM kb_nodes;

3. Recreate index:
   DROP INDEX IF EXISTS kb_nodes_embedding_idx;
   CREATE INDEX kb_nodes_embedding_idx ON kb_nodes
   USING hnsw (embedding vector_cosine_ops);
```

---

### Phase 7: Build Errors

**Error:** Domain function verification fails
```
Recovery:
1. Identify failing function from verify-domain.sh output
2. Check specific violations:
   - Missing kb import: Add import statement
   - Missing kbSources: Add to return type
   - Hardcoded value: Replace with KB query

3. Re-run verification for that file only
4. Continue to next function
```

**Error:** Entry point verification fails
```
Recovery:
1. Ensure verifyConnection() is first operation in main()
2. Ensure process.exit(1) on failure
3. Template:

async function main() {
  const kbOk = await kb.verifyConnection();
  if (!kbOk) {
    console.error('KB unavailable');
    process.exit(1);
  }
  // ... rest of app
}
```

---

### Phase 8: Verification Errors

**Error:** One or more sub-phases fail
```
Recovery:
1. Run failing script individually with verbose:
   bash -x scripts/8.X-check.sh

2. Address specific failure:
   - 8.1 Code Scan: Remove hardcoded values
   - 8.2 Import: Add kb imports
   - 8.3 Sources: Add kbSources to returns
   - 8.4 Startup: Fix entry point
   - 8.5 Fallbacks: Remove || DEFAULT patterns
   - 8.6 Attribution: Add expert to KB nodes
   - 8.7 Confidence: Add confidence to KB nodes
   - 8.8 Gap Logging: Implement logGap function

3. Re-run verify-all.sh
```

---

## Rollback Procedures

### State Checkpoints

Create checkpoints before major operations:

```bash
#!/bin/bash
# scripts/checkpoint.sh

CHECKPOINT_DIR=".kb-checkpoints"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$CHECKPOINT_DIR"

# Database backup
pg_dump "$DATABASE_URL" > "$CHECKPOINT_DIR/db_$TIMESTAMP.sql"

# Code backup
git stash push -m "checkpoint_$TIMESTAMP"

# Record phase
echo "Phase: $1" > "$CHECKPOINT_DIR/phase_$TIMESTAMP.txt"
echo "KB Score: $(./scripts/score-kb.sh | tail -1)" >> "$CHECKPOINT_DIR/phase_$TIMESTAMP.txt"
echo "App Score: $(./scripts/score-app.sh | tail -1)" >> "$CHECKPOINT_DIR/phase_$TIMESTAMP.txt"

echo "✅ Checkpoint created: $TIMESTAMP"
```

### Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

CHECKPOINT_DIR=".kb-checkpoints"

# List checkpoints
echo "Available checkpoints:"
ls -la "$CHECKPOINT_DIR"/*.sql 2>/dev/null | awk '{print NR". "$9}'

read -p "Enter checkpoint number to restore: " num

CHECKPOINT=$(ls "$CHECKPOINT_DIR"/*.sql | sed -n "${num}p")

if [ -z "$CHECKPOINT" ]; then
  echo "Invalid checkpoint"
  exit 1
fi

echo "⚠️  This will:"
echo "   - Drop current database"
echo "   - Restore from: $CHECKPOINT"
echo ""
read -p "Type 'ROLLBACK' to confirm: " confirm

if [ "$confirm" != "ROLLBACK" ]; then
  echo "Aborted"
  exit 1
fi

# Restore database
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" < "$CHECKPOINT"

# Restore code (if git stash exists)
STASH_NAME=$(basename "$CHECKPOINT" .sql | sed 's/db_/checkpoint_/')
git stash list | grep "$STASH_NAME" && git stash pop

echo "✅ Rollback complete"
```

---

## Partial Rollback

### Rollback Single Phase

```bash
#!/bin/bash
# scripts/rollback-phase.sh

PHASE=$1

case $PHASE in
  7)
    # Rollback Phase 7: Remove generated domain files
    rm -rf src/domain/*.ts
    rm -f KB_ENFORCEMENT.md
    echo "Rolled back Phase 7. Re-run from Phase 6."
    ;;
  8)
    # Phase 8 is verification only, nothing to rollback
    echo "Phase 8 has no side effects. Just re-run verification."
    ;;
  *)
    echo "Rollback for Phase $PHASE requires database restore."
    echo "Use ./scripts/rollback.sh for full rollback."
    ;;
esac
```

---

## Recovery Decision Tree

```
Error Occurred
     │
     ▼
Is database accessible?
     │
     ├── NO → Check Docker, restart container
     │         If still failing → Infrastructure issue
     │
     ▼ YES
     │
Is it a gate failure (score too low)?
     │
     ├── YES → Loop back to fix, not an error
     │
     ▼ NO
     │
Is it a verification script error?
     │
     ├── YES → Debug script, fix specific issue
     │         Re-run single check
     │
     ▼ NO
     │
Is data corrupted?
     │
     ├── YES → Rollback to checkpoint
     │         Re-run from that phase
     │
     ▼ NO
     │
Unknown error → Create checkpoint → Debug → Report
```

---

## Automatic Recovery (Swarm Mode)

When running in swarm mode, automatic recovery is possible:

```yaml
# swarm-config.yaml (excerpt)

error_handling:
  strategy: retry_then_escalate
  max_retries: 3

  on_gate_failure:
    action: loop_to_previous_subphase
    max_loops: 5

  on_script_error:
    action: retry_with_backoff
    backoff: [1s, 5s, 30s]

  on_data_error:
    action: restore_checkpoint_and_retry

  on_infrastructure_error:
    action: halt_and_notify
    notification: slack  # or email, pagerduty
```

---

## Preserving Work

### Before Risky Operations

```bash
# Always checkpoint before:
./scripts/checkpoint.sh "before_phase_7"

# Risky operations:
# - Schema migrations
# - Bulk KB updates
# - Phase 7 build (generates many files)
# - Rollback attempts
```

### After Successful Phases

```bash
# Checkpoint after each major phase
./scripts/checkpoint.sh "after_phase_2_score_98"
./scripts/checkpoint.sh "after_phase_7_build"
```

---

## Emergency Contacts

For critical failures during production transformation:

```
1. Check this document first
2. Search existing checkpoints
3. Review git history for code changes
4. If data loss occurred:
   - Stop all operations
   - Document current state
   - Restore from most recent checkpoint
   - Re-run from that phase
```

---

## Prevention Best Practices

1. **Always run dry-run first** for new transformations
2. **Create checkpoints** before and after each phase
3. **Don't skip gates** - they exist for a reason
4. **Test on copy** before production KB transformation
5. **Monitor resources** - disk space, memory during embedding generation
