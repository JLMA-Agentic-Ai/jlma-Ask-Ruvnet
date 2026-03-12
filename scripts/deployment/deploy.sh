#!/bin/bash
# Deploy Ask-RuvNet to Railway
# Usage: bash scripts/deployment/deploy.sh [patch|minor|major]
#
# Railway auto-deploys on every push to main.
# This script bumps the version, commits, pushes, and verifies deployment.

set -e

BUMP="${1:-patch}"

# ── Load Railway token from .env ──────────────────────────────
if [ -f .env ]; then
  RAILWAY_TOKEN=$(grep '^RAILWAY_TOKEN=' .env | cut -d= -f2)
  export RAILWAY_TOKEN
fi

echo "Deploying Ask-RuvNet ($BUMP bump)..."

# Bump version in package.json
npm version "$BUMP" --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
echo "Version: $VERSION"

# Build frontend (validates it compiles — Railway rebuilds in Docker)
echo "Building frontend..."
cd src/ui && npm run build && cd ../..
echo "Frontend build OK"

# Commit and push (dist/ is gitignored — Railway builds it in Docker)
git add package.json package-lock.json
git commit -m "v${VERSION}: deploy $BUMP"
git push origin main

echo ""
echo "Pushed v${VERSION} to main. Railway will auto-deploy."
echo ""

# ── Verify deployment ─────────────────────────────────────────
if [ -n "$RAILWAY_TOKEN" ]; then
  echo "Checking Railway deployment status..."
  sleep 5
  railway status 2>/dev/null && echo "Railway: connected" || echo "Railway: status check failed (deploy will still proceed via GitHub)"
  echo ""
  echo "Railway deployment triggered. Monitor at:"
  echo "  railway logs (requires RAILWAY_TOKEN)"
else
  echo "No RAILWAY_TOKEN found. Deploy will proceed via GitHub auto-deploy."
  echo "To enable verification, add RAILWAY_TOKEN to .env"
fi

echo ""
echo "Verify after deploy:"
echo "  curl https://ask-ruvnet-production.up.railway.app/health"
echo "  curl https://ask-ruvnet-production.up.railway.app/api/kb-stats"
echo "  curl https://ask-ruvnet-production.up.railway.app/api/providers"
