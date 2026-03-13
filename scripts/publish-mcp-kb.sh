#!/usr/bin/env bash
# ============================================================================
# Daily MCP Knowledge Base Publish Pipeline
# Updated: 2026-03-13 | Version 1.0.0
#
# Runs the full pipeline:
#   1. kb-evergreen (update PG from all monitored repos)
#   2. export-mcp-kb (PG → binary MCP format)
#   3. Compress entries (json → json.gz)
#   4. Copy data to Ruvnet-KB-first package
#   5. Bump version + npm publish
#
# Prerequisites:
#   - ruvector-postgres Docker running on port 5435
#   - npm logged in (npm whoami)
#   - Both repos cloned adjacent to each other
#
# Usage:
#   bash scripts/publish-mcp-kb.sh           # Full pipeline
#   bash scripts/publish-mcp-kb.sh --dry-run # Preview without publishing
# ============================================================================

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASK_RUVNET_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="${MCP_KB_DIR:-/Users/stuartkerr/Code/Ruvnet-Koweldgebase-and-Application-Builder}"
KB_DATA_DIR="$MCP_DIR/kb-data"
LOG_FILE="/tmp/publish-mcp-kb-$(date +%Y%m%d).log"

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "DRY RUN MODE — no version bump or publish"
fi

log() { echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"; }

# --- Pre-flight checks ---
log "=== MCP KB Publish Pipeline ==="

# Check Docker PG
if ! pg_isready -h localhost -p 5435 -U postgres -q 2>/dev/null; then
  log "ERROR: ruvector-postgres not running on port 5435. Start it with:"
  log "  docker start ruvector-postgres"
  exit 1
fi

# Check npm login
if ! npm whoami >/dev/null 2>&1; then
  log "ERROR: Not logged into npm. Run: npm login"
  exit 1
fi

# Check directories
if [[ ! -d "$ASK_RUVNET_DIR/scripts" ]]; then
  log "ERROR: Ask-Ruvnet directory not found at $ASK_RUVNET_DIR"
  exit 1
fi
if [[ ! -d "$MCP_DIR/bin" ]]; then
  log "ERROR: Ruvnet-KB-first directory not found at $MCP_DIR"
  exit 1
fi

log "Ask-Ruvnet: $ASK_RUVNET_DIR"
log "MCP Package: $MCP_DIR"

# --- Step 1: Run kb-evergreen (update PG from all repos) ---
log "Step 1/5: Running kb-evergreen (all repos)..."
cd "$ASK_RUVNET_DIR"
node scripts/kb-evergreen.mjs 2>&1 | tail -20 | tee -a "$LOG_FILE"
log "Step 1 complete."

# --- Step 2: Export MCP KB data ---
log "Step 2/5: Exporting MCP KB format..."
node scripts/export-mcp-kb.mjs --output "$KB_DATA_DIR" 2>&1 | tail -10 | tee -a "$LOG_FILE"
log "Step 2 complete."

# --- Step 3: Compress entries ---
log "Step 3/5: Compressing kb-entries.json..."
if [[ -f "$KB_DATA_DIR/kb-entries.json" ]]; then
  gzip -9 -f -k "$KB_DATA_DIR/kb-entries.json"
  RAW_SIZE=$(du -h "$KB_DATA_DIR/kb-entries.json" | cut -f1)
  GZ_SIZE=$(du -h "$KB_DATA_DIR/kb-entries.json.gz" | cut -f1)
  log "Compressed: $RAW_SIZE -> $GZ_SIZE"
else
  log "WARNING: kb-entries.json not found in $KB_DATA_DIR"
fi
log "Step 3 complete."

# --- Step 4: Verify data ---
log "Step 4/5: Verifying KB data..."
ENTRY_COUNT=$(node -e "
  const fs = require('fs');
  const zlib = require('zlib');
  const gz = fs.readFileSync('$KB_DATA_DIR/kb-entries.json.gz');
  const entries = JSON.parse(zlib.gunzipSync(gz).toString());
  console.log(entries.length);
")
BIN_SIZE=$(stat -f%z "$KB_DATA_DIR/kb-embeddings.bin" 2>/dev/null || stat --printf="%s" "$KB_DATA_DIR/kb-embeddings.bin")
EXPECTED_BIN=$((ENTRY_COUNT * 48))

log "Entries: $ENTRY_COUNT"
log "Embeddings: $BIN_SIZE bytes (expected: $EXPECTED_BIN)"

if [[ "$BIN_SIZE" -ne "$EXPECTED_BIN" ]]; then
  log "ERROR: Embedding size mismatch! Aborting."
  exit 1
fi
log "Step 4 complete — verification PASSED."

# --- Step 5: Version bump + publish ---
if [[ "$DRY_RUN" == "true" ]]; then
  log "Step 5/5: DRY RUN — would bump version and publish"
  cd "$MCP_DIR"
  CURRENT_VERSION=$(node -p "require('./package.json').version")
  log "Current version: $CURRENT_VERSION (would bump patch)"
  log "=== DRY RUN COMPLETE ==="
  exit 0
fi

log "Step 5/5: Bumping version and publishing..."
cd "$MCP_DIR"

CURRENT_VERSION=$(node -p "require('./package.json').version")
npm version patch --no-git-tag-version 2>/dev/null
NEW_VERSION=$(node -p "require('./package.json').version")
log "Version: $CURRENT_VERSION -> $NEW_VERSION"

# Commit version bump
git add package.json kb-data/kb-metadata.json kb-data/kb-embeddings.bin kb-data/kb-entries.json.gz .npmignore
git commit -m "chore: daily KB update v$NEW_VERSION ($ENTRY_COUNT entries)" 2>/dev/null || true

# Publish
npm publish --access public 2>&1 | tee -a "$LOG_FILE"
log "Published ruvnet-kb-first@$NEW_VERSION to npm"

log "=== PIPELINE COMPLETE ==="
log "Published: ruvnet-kb-first@$NEW_VERSION ($ENTRY_COUNT entries)"
log "Users will auto-update on next MCP restart."
log "Log: $LOG_FILE"
