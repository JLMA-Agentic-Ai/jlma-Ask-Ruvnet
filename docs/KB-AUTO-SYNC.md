# KB Auto-Sync — RuvNet Repository Monitor

**Updated: 2026-02-21 00:00:00 UTC | Version 1.0.0**
**Created: 2026-02-21**

This document explains the automated monitoring and ingestion system that keeps the AskRuvNet knowledge base current with the latest releases, changelogs, and documentation from the RuvNet GitHub ecosystem.

---

## What It Monitors

The system watches the following repositories and npm packages for new content:

| ID | GitHub Repo | npm Package |
|----|-------------|-------------|
| `claude-flow` | github.com/ruvnet/claude-flow | `@claude-flow/cli` |
| `agentic-flow` | github.com/ruvnet/agentic-flow | `agentic-flow` |
| `ruvector` | github.com/ruvnet/ruvector | `ruvector` |
| `ruv-swarm` | github.com/ruvnet/ruv-swarm | `ruv-swarm` |

### What Gets Detected

| Event Type | What Triggers It | KB Entry Produced |
|------------|-----------------|-------------------|
| `github-release` | New GitHub release tag | Full release notes as a KB entry |
| `changelog-update` | New commits on main branch | Recent commit messages + current CHANGELOG.md |
| `npm-version` | New version on npm registry | Version metadata (date, description, install command) |
| `doc-added` | New file appears in watched doc directories | File content ingested as a concept entry |

### Detection Mechanism

- **GitHub releases**: Compares newest release tag against `lastReleaseTag` in state file
- **Commits**: Compares newest commit SHA against `lastCommitSha` in state file
- **npm versions**: Compares sorted version list against `lastNpmVersion` in state file
- **Doc files**: Compares file SHA against `lastDocShas` map in state file

State is stored in `.ruvnet-monitor-state.json` in the project root. The monitor updates this file after every successful check so subsequent runs only detect genuinely new content.

---

## How to Run It Manually

### Prerequisites

The script uses the GitHub public API (no auth token needed) and the npm registry. Both are unauthenticated. The GitHub API rate limit is 60 requests per hour for unauthenticated access.

You need either:
- `DATABASE_URL` env var set (points to Neon or any PostgreSQL with the `ask_ruvnet` schema), or
- Local ruvector-postgres running on port 5435

### Basic run (incremental — only new content since last check)

```bash
node scripts/kb-sync-ruvnet.mjs
```

### Force re-check (detects new content but only inserts rows not already in DB)

The `--force` flag ignores the last-seen timestamps. It will re-fetch everything from GitHub and npm, then attempt to insert. Because inserts use `ON CONFLICT (doc_id) DO NOTHING`, existing entries are never duplicated.

```bash
node scripts/kb-sync-ruvnet.mjs --force
```

### Dry run (detect changes without writing to DB or updating state)

Useful for testing or auditing what would be ingested:

```bash
node scripts/kb-sync-ruvnet.mjs --dry-run
```

### Single-repo only

```bash
node scripts/kb-sync-ruvnet.mjs --target claude-flow
node scripts/kb-sync-ruvnet.mjs --target ruv-swarm
```

Valid target IDs: `claude-flow`, `agentic-flow`, `ruvector`, `ruv-swarm`

### Verbose output

```bash
node scripts/kb-sync-ruvnet.mjs --verbose
```

### Run the monitor alone (no DB ingestion)

The monitor script can be run on its own to inspect what's new:

```bash
# See what would be ingested (no state updates)
node scripts/monitor-ruvnet-repos.mjs --dry-run

# Force re-fetch and print all events
node scripts/monitor-ruvnet-repos.mjs --force --dry-run
```

---

## How to Set Up as a Scheduled Task

### Option 1: OpenClaw Cron Job (recommended — follows project conventions)

Add this to `~/.openclaw/cron/jobs.json`:

```json
{
  "id": "ruvnet-kb-sync",
  "name": "RuvNet KB Auto-Sync",
  "description": "Check RuvNet repos for new releases and ingest to KB",
  "kind": "agentTurn",
  "sessionTarget": "isolated",
  "schedule": "0 */6 * * *",
  "command": "node /Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/scripts/kb-sync-ruvnet.mjs",
  "cwd": "/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet",
  "env": {
    "DATABASE_URL": "${DATABASE_URL}"
  },
  "enabled": true
}
```

This runs every 6 hours (well within the 60 req/hour GitHub rate limit — a single run uses approximately 15-20 API calls across all four repos).

### Option 2: macOS LaunchAgent

Create `~/Library/LaunchAgents/com.askreuvnet.kb-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.askreuvnet.kb-sync</string>

  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/scripts/kb-sync-ruvnet.mjs</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>DATABASE_URL</key>
    <string>postgresql://...</string>
  </dict>

  <!-- Run every 6 hours -->
  <key>StartInterval</key>
  <integer>21600</integer>

  <key>StandardOutPath</key>
  <string>/tmp/kb-sync-ruvnet.log</string>

  <key>StandardErrorPath</key>
  <string>/tmp/kb-sync-ruvnet.err</string>

  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.askreuvnet.kb-sync.plist
```

### Option 3: Standard crontab

```bash
crontab -e
```

Add:

```cron
# RuvNet KB sync — every 6 hours
0 */6 * * * cd /Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet && DATABASE_URL="postgresql://..." node scripts/kb-sync-ruvnet.mjs >> /tmp/kb-sync-ruvnet.log 2>&1
```

---

## Architecture

```
GitHub API                npm Registry
     |                        |
     v                        v
monitor-ruvnet-repos.mjs   (same file)
     |
     | ChangeEvent[]
     v
kb-sync-ruvnet.mjs
     |
     |-- chunkText()         split long content into 900-char chunks
     |-- embed()             Xenova all-MiniLM-L6-v2 (384d)
     |                       fallback: PG ruvector_embed()
     |-- upsertChunk()       INSERT ... ON CONFLICT DO NOTHING
     v
ask_ruvnet.architecture_docs
(Neon pgvector / local ruvector-postgres)
     |
     v
.ruvnet-monitor-state.json  (updated after each successful run)
```

### KB Entry Fields Set by the Monitor

| Field | Value |
|-------|-------|
| `doc_type` | `developer-changelog` or `architecture-doc` |
| `category` | `releases` or `documentation` |
| `quality_score` | 88 |
| `source_authority` | `official-docs` |
| `triage_tier` | `gold` |
| `expertise_level` | `expert` |
| `knowledge_type` | `changelog`, `reference`, or `concept` |
| `is_duplicate` | `false` |

---

## Adding New Repos to Watch

Edit `scripts/monitor-ruvnet-repos.mjs` and add an entry to the `WATCH_TARGETS` array:

```javascript
{
  id: 'my-new-repo',          // unique identifier (used in state file + doc_ids)
  owner: 'ruvnet',            // GitHub org or username
  repo: 'my-new-repo',        // GitHub repo name
  npm: 'my-npm-package',      // npm package name, or null if no npm package
  watchDocs: ['CHANGELOG.md', 'README.md', 'docs/'],  // files/dirs to watch
  label: 'My New Repo',       // human-readable name used in KB entry titles
},
```

On the next run, the monitor will:
1. Detect all current releases, the latest commit SHA, and the latest npm version
2. Ingest up to 10 recent npm versions (to avoid flooding the KB on first run)
3. Record the current state so future runs only detect genuinely new content

No other changes are needed — the sync script imports `WATCH_TARGETS` automatically.

---

## Troubleshooting

### "No new content detected" but releases exist

The state file may already record the latest tag. Run with `--force` to re-check:

```bash
node scripts/kb-sync-ruvnet.mjs --force --dry-run
```

### GitHub rate limit errors

The unauthenticated GitHub API allows 60 requests per hour. Each repo check uses approximately 4-5 requests. If you are hitting limits, wait until the reset time shown in the warning message. For higher limits, set a `GITHUB_TOKEN` env var and add it to the `Authorization` header in `monitor-ruvnet-repos.mjs` line with `httpGet`.

### Database connection errors

Check which database the script is connecting to:

```bash
# Use Neon
DATABASE_URL="postgresql://..." node scripts/kb-sync-ruvnet.mjs --dry-run

# Use local ruvector-postgres
RUVECTOR_HOST=localhost RUVECTOR_PORT=5435 node scripts/kb-sync-ruvnet.mjs --dry-run
```

### Embedding errors

The script has three embedding paths in priority order:
1. `@claude-flow/embeddings` (fastest)
2. `@xenova/transformers` (project dependency, always available)
3. PostgreSQL `ruvector_embed()` (slowest, always available if connected)

Run with `--verbose` to see which path is being used and any errors.

### Reset the state file

To start fresh (re-detect everything as if first run):

```bash
echo '{}' > .ruvnet-monitor-state.json
```

Then run with `--force` — existing entries will be skipped via `ON CONFLICT DO NOTHING`.
