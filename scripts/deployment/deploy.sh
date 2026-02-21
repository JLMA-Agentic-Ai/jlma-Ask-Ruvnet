#!/bin/bash
# deploy.sh — Version bump, build, commit, push to production
# Usage: bash scripts/deployment/deploy.sh [patch|minor|major] "commit message"
#
# Version source of truth: package.json (read by both backend and frontend)
# Railway auto-deploys on push to main.

set -euo pipefail

BUMP_TYPE="${1:-patch}"  # patch (2.1.0→2.1.1), minor (2.1.0→2.2.0), major (2.1.0→3.0.0)
COMMIT_MSG="${2:-}"
PROD_URL="${PROD_URL:-https://ask-ruvnet-production.up.railway.app}"

# Validate bump type
if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "Usage: deploy.sh [patch|minor|major] \"commit message\""
  exit 1
fi

# Ensure we're on main and clean
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" ]]; then
  echo "Error: Must be on main branch (currently on: $BRANCH)"
  exit 1
fi

# Check for uncommitted changes that aren't staged
if [[ -n "$(git diff --name-only)" ]]; then
  echo "Warning: You have unstaged changes. Stage them first or they won't be included."
  git diff --name-only
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi
fi

# Get current version
OLD_VERSION=$(node -p "require('./package.json').version")
echo "Current version: v${OLD_VERSION}"

# Bump version (no git tag — we'll commit manually)
npm version "$BUMP_TYPE" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: v${NEW_VERSION}"

# Build frontend (includes new version in the UI header)
echo "Building frontend..."
cd src/ui && npm run build 2>&1 | tail -3
cd ../..

# Stage version files + any already-staged changes
git add package.json package-lock.json

# Commit
if [[ -z "$COMMIT_MSG" ]]; then
  COMMIT_MSG="release: v${NEW_VERSION}"
fi

echo "Committing: ${COMMIT_MSG}"
git commit -m "${COMMIT_MSG}

Version: ${OLD_VERSION} → ${NEW_VERSION}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# Push
echo "Pushing to origin/main..."
git push origin main

echo ""
echo "=== Deployed v${NEW_VERSION} ==="
echo "GitHub: pushed"
echo "Railway: auto-deploying from main (wait ~2-3 min)"
echo ""
echo "Verify with:"
echo "  curl -s ${PROD_URL}/health"
echo "  curl -s ${PROD_URL}/api/knowledge | python3 -c \"import sys,json; print('Version:', json.load(sys.stdin).get('version'))\""
