#!/bin/bash
# Deploy Ask-RuvNet to Railway
# Usage: bash scripts/deployment/deploy.sh [patch|minor|major]
#
# Railway auto-deploys on every push to main.
# This script bumps the version, commits, pushes, and verifies deployment.
#
# NOTE: Do NOT set RAILWAY_TOKEN in .env — it overrides ~/.railway/config.json
# and breaks CLI auth. Railway CLI uses its own config for authentication.

set -e

BUMP="${1:-patch}"

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
echo "Verify after deploy:"
echo "  curl https://ask-ruvnet-production.up.railway.app/health"
echo "  curl https://ask-ruvnet-production.up.railway.app/api/kb-stats"
echo "  curl https://ask-ruvnet-production.up.railway.app/api/providers"
