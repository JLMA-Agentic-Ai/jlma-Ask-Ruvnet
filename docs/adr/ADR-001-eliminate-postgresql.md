# ADR-001: Complete PostgreSQL Elimination

> Updated: 2026-03-30 | Status: IMPLEMENTING

## Context

Ask-RuvNet started with PostgreSQL (ruvector-postgres on Docker port 5435) as the only storage option. Over time, we built RVF cognitive containers and kb-master.json as alternatives. In v4.12.0, the build pipeline and production runtime were migrated to kb-master.json + RVF. However, the nightly auto-curation pipeline (3 LaunchAgents) still used PostgreSQL internally, creating a hidden dependency that contradicted the "PostgreSQL eliminated" claim.

## Decision

Eliminate PostgreSQL from ALL paths — including the nightly pipeline. Store raw repo chunks as flat NDJSON files instead of PostgreSQL tables.

## Architecture Change

### Before (mixed)
```
4 AM  kb-evergreen.mjs    → PG architecture_docs (264K chunks)
5 AM  kb-auto-curate.mjs  → reads PG architecture_docs → writes PG kb_complete
6 AM  kb-export-pipeline   → reads PG kb_complete → kb-master.json → RVF
```

### After (PG-free)
```
4 AM  kb-evergreen.mjs    → .ruvector/raw/<repo>.ndjson.gz (flat files)
5 AM  kb-auto-curate.mjs  → reads .ruvector/raw/ → writes kb-master.json
6 AM  kb-rebuild.mjs       → reads kb-master.json → RVF + browser + MCP
```

## Storage Format for Raw Chunks

```
.ruvector/raw/
  manifest.json                    # { repos: { name: { chunkCount, lastCommitSha, lastUpdated } } }
  ruflo.ndjson.gz                  # one JSON line per chunk: { path, content, type }
  RuVector.ndjson.gz
  ... (one file per repo)
```

Each repo file is a gzipped NDJSON (newline-delimited JSON). Each line:
```json
{"path": "src/lib.rs", "content": "...", "type": "rust", "sha": "abc123"}
```

## What Gets Removed

1. `pg` npm package (move to devDependencies only for migration tools)
2. `architecture_docs` PG table dependency
3. `kb_complete` PG table dependency
4. Docker requirement for ANY pipeline operation
5. All `import pg from 'pg'` in active nightly scripts

## What Gets Kept (as archive)

1. `migrate-pg-to-master.mjs` — one-time migration tool
2. Old versions of nightly scripts (renamed with `.pg-backup` suffix)
3. PG Docker container can remain running for other projects — Ask-RuvNet just stops using it

## Risks

1. **264K chunks in flat files vs PG**: Total ~500MB compressed. Manageable on local SSD.
2. **No SQL queries for gap detection**: Replace with JS file scanning. Actually simpler.
3. **Incremental updates**: Overwrite per-repo file on change (same as PG UPSERT behavior).
4. **Rollback**: Keep old scripts as backups. Switch LaunchAgents back if needed.

## Verification Criteria

- [ ] kb-evergreen.mjs writes to .ruvector/raw/ (no PG)
- [ ] kb-auto-curate.mjs reads .ruvector/raw/ + kb-master.json (no PG)
- [ ] kb-export-pipeline.mjs reads kb-master.json (no PG)
- [ ] Full nightly cycle completes without Docker running
- [ ] New entries appear in kb-master.json after curation
- [ ] RVF rebuilds correctly from kb-master.json
- [ ] Production deploy works with new entries
