#!/bin/bash
# Railway Startup Script for Ask-Ruvnet v2.0+
# Backend: PostgreSQL RuVector (connected via DATABASE_URL or PG_HOST env vars)

echo "🚀 Starting Ask-Ruvnet on Railway..."

# Show frontend build status
ls -F src/ui/dist 2>/dev/null || echo "⚠️ No frontend build found"
echo "📄 Checking for PDFs in dist/assets/docs:"
ls -la src/ui/dist/assets/docs/ 2>&1 || echo "⚠️ docs folder not found"

# Check for latest package versions on deploy
echo "🔄 Checking for latest package versions..."
node scripts/ingestion/check_repo_versions.js 2>/dev/null || echo "⚠️ Version check skipped"

# Verify PostgreSQL connectivity (the primary backend)
if [ -n "$DATABASE_URL" ] || [ -n "$PG_HOST" ]; then
  echo "✅ PostgreSQL connection configured"
else
  echo "⚠️ No DATABASE_URL or PG_HOST set — will use local RuvectorStore fallback"
fi

# Start the server
echo "🔌 Starting Node.js server..."
cd /app
node src/server/app.js || { echo "❌ App crashed! Sleeping for debug..."; sleep 3600; }
