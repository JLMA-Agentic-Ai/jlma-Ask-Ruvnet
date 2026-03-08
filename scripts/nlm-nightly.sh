#!/bin/bash
# nlm-nightly.sh — Complete nightly NLM pipeline
# Runs: auth check → log rotation → source refresh → studio refresh → download → sync App.jsx
# Sends macOS notifications on auth expiry, phase failures, and completion summary.
#
# Updated: 2026-03-07 15:15:00 EST | Version 1.3.0
# Created: 2026-03-07

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NODE="$(command -v node || echo /usr/local/bin/node)"
LOG_DIR="$PROJECT_ROOT/logs"
WARNINGS=0
ERRORS=0

mkdir -p "$LOG_DIR"

# ---------------------------------------------------------------------------
# Alerting — macOS notifications (works even headless via launchd)
# ---------------------------------------------------------------------------
notify() {
  local title="$1" msg="$2"
  osascript -e "display notification \"$msg\" with title \"$title\"" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Log rotation — rotate files > 10MB, keep last 3 rotations
# ---------------------------------------------------------------------------
rotate_log() {
  local logfile="$1"
  local max_bytes=10485760  # 10MB
  if [ -f "$logfile" ] && [ "$(stat -f%z "$logfile" 2>/dev/null || echo 0)" -gt "$max_bytes" ]; then
    # Shift existing rotations
    [ -f "${logfile}.2" ] && rm -f "${logfile}.2"
    [ -f "${logfile}.1" ] && mv "${logfile}.1" "${logfile}.2"
    mv "$logfile" "${logfile}.1"
    echo "[rotate] Rotated $(basename "$logfile") (was >10MB)"
  fi
}

# Rotate all pipeline logs at start
rotate_log "$LOG_DIR/nlm-refresh-launchd.log"
rotate_log "$LOG_DIR/nlm-refresh-launchd.err"
rotate_log "$LOG_DIR/nlm-refresh-audit.jsonl"

echo "=== NLM Nightly Pipeline — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "Node: $NODE ($(${NODE} --version 2>/dev/null || echo 'unknown'))"

# ---------------------------------------------------------------------------
# Phase 0: Auth pre-check + auto-renewal via agent-browser
# ---------------------------------------------------------------------------
echo ""
echo "--- Phase 0: Auth Check + Auto-Renew ---"
AUTH_OK=false
"$NODE" "$SCRIPT_DIR/nlm-studio-pipeline.mjs" --check-auth 2>&1 && AUTH_OK=true || true

if [ "$AUTH_OK" = false ]; then
  echo "[auth] Expired — attempting auto-renewal via agent-browser..."
  if bash "$SCRIPT_DIR/nlm-auto-auth.sh" 2>&1; then
    echo "[auth] Auto-renewal succeeded!"
    AUTH_OK=true
  else
    echo "[FATAL] Auto-renewal failed. Manual intervention required: nlm login"
    notify "NLM Pipeline FAILED" "Auth expired and auto-renewal failed. Run 'nlm login' manually."
    exit 2
  fi
fi
echo "[auth] OK"

# ---------------------------------------------------------------------------
# Phase 1: Refresh NLM sources (detect GitHub changes, update stale sources)
# ---------------------------------------------------------------------------
echo ""
echo "--- Phase 1: Source Refresh ---"
"$NODE" "$SCRIPT_DIR/nlm-refresh-sources.mjs" 2>&1 || {
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 2 ]; then
    echo "[FATAL] NLM auth expired during source refresh. Run: nlm login"
    notify "NLM Pipeline FAILED" "Auth expired during Phase 1. Run 'nlm login'."
    exit 2
  fi
  echo "[WARN] Source refresh exited with code $EXIT_CODE (continuing)"
  WARNINGS=$((WARNINGS + 1))
}

# ---------------------------------------------------------------------------
# Phase 2: Regenerate studios whose sources changed
# ---------------------------------------------------------------------------
echo ""
echo "--- Phase 2: Studio Refresh (changed sources only) ---"
"$NODE" "$SCRIPT_DIR/nlm-studio-pipeline.mjs" --refresh-changed 2>&1 || {
  echo "[WARN] Studio refresh failed (continuing to download phase)"
  WARNINGS=$((WARNINGS + 1))
}

# ---------------------------------------------------------------------------
# Phase 3: Retry downloading any missing assets
# ---------------------------------------------------------------------------
echo ""
echo "--- Phase 3: Download Missing Assets ---"
"$NODE" "$SCRIPT_DIR/nlm-studio-pipeline.mjs" --download-missing 2>&1 || {
  echo "[WARN] Download missing failed"
  WARNINGS=$((WARNINGS + 1))
}

# ---------------------------------------------------------------------------
# Phase 4: Sync App.jsx RESOURCE_DOCS
# ---------------------------------------------------------------------------
echo ""
echo "--- Phase 4: Sync App.jsx ---"
"$NODE" "$SCRIPT_DIR/nlm-studio-pipeline.mjs" --sync-app 2>&1 || {
  echo "[WARN] App.jsx sync failed"
  WARNINGS=$((WARNINGS + 1))
}

# ---------------------------------------------------------------------------
# Summary + notification
# ---------------------------------------------------------------------------
echo ""
echo "=== NLM Nightly Pipeline Complete — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "Warnings: $WARNINGS"

if [ "$WARNINGS" -gt 0 ]; then
  notify "NLM Pipeline Done (${WARNINGS} warnings)" "${WARNINGS} phase(s) had issues. Check logs/nlm-refresh-launchd.log"
else
  notify "NLM Pipeline OK" "All 4 phases completed successfully."
fi
