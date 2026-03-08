#!/bin/bash
# nlm-auto-auth.sh — Automated NLM re-authentication via agent-browser
#
# Uses agent-browser to launch Chrome with CDP, then nlm login connects
# to that browser session. Google session cookies from the existing Chrome
# profile handle authentication without manual interaction.
#
# Usage:
#   bash scripts/nlm-auto-auth.sh           # full auto-auth
#   bash scripts/nlm-auto-auth.sh --check   # just check if auth is valid
#
# Updated: 2026-03-07 15:00:00 EST | Version 1.0.0
# Created: 2026-03-07

set -euo pipefail

NLM_BIN="/Users/stuartkerr/.openclaw/gmail/nlm-venv/bin/nlm"
AGENT_BROWSER="$(command -v agent-browser || echo "$HOME/.npm-global/bin/agent-browser")"
CDP_PORT=18800
CDP_URL="http://127.0.0.1:${CDP_PORT}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
notify() {
  osascript -e "display notification \"$2\" with title \"$1\"" 2>/dev/null || true
}

cleanup() {
  # Kill agent-browser if we started it
  if [ -n "${AB_PID:-}" ]; then
    kill "$AB_PID" 2>/dev/null || true
    wait "$AB_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Check-only mode
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--check" ]]; then
  if "$NLM_BIN" login --check 2>&1 | grep -q "valid"; then
    echo "Auth: OK"
    exit 0
  else
    echo "Auth: EXPIRED"
    exit 2
  fi
fi

# ---------------------------------------------------------------------------
# Step 1: Check if auth is already valid
# ---------------------------------------------------------------------------
echo "=== NLM Auto-Auth ==="
echo "Checking current auth status..."

if "$NLM_BIN" login --check 2>&1 | grep -q "valid"; then
  echo "Auth is already valid. Nothing to do."
  exit 0
fi

echo "Auth expired. Starting re-authentication..."

# ---------------------------------------------------------------------------
# Step 2: Launch agent-browser with CDP endpoint
# ---------------------------------------------------------------------------
echo "Launching agent-browser on CDP port ${CDP_PORT}..."

# agent-browser opens Chrome with the user's profile (has Google cookies)
"$AGENT_BROWSER" open "about:blank" --cdp-port "$CDP_PORT" &
AB_PID=$!

# Wait for CDP to be ready
for i in $(seq 1 15); do
  if curl -s "$CDP_URL/json/version" >/dev/null 2>&1; then
    echo "CDP endpoint ready."
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "[FATAL] CDP endpoint did not start within 15s."
    notify "NLM Auto-Auth FAILED" "Could not start agent-browser CDP endpoint."
    exit 1
  fi
  sleep 1
done

# ---------------------------------------------------------------------------
# Step 3: Run nlm login with CDP endpoint
# ---------------------------------------------------------------------------
echo "Running nlm login with CDP endpoint..."

if "$NLM_BIN" login --provider builtin --cdp-url "$CDP_URL" 2>&1; then
  echo "Login completed."
else
  LOGIN_EXIT=$?
  echo "[WARN] nlm login exited with code $LOGIN_EXIT"
fi

# Give it a moment to finalize
sleep 2

# ---------------------------------------------------------------------------
# Step 4: Verify auth
# ---------------------------------------------------------------------------
echo "Verifying auth..."

if "$NLM_BIN" login --check 2>&1 | grep -q "valid"; then
  echo "Auth: OK — re-authentication successful!"
  notify "NLM Auth Renewed" "Auto-auth succeeded. Pipeline will run normally."
  exit 0
else
  echo "[FAIL] Auth still expired after login attempt."
  echo "This may require manual intervention: nlm login"
  notify "NLM Auto-Auth FAILED" "Could not re-authenticate. Run 'nlm login' manually."
  exit 2
fi
