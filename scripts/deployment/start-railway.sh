#!/bin/bash
# Self-Healing Startup Script for Railway

DB_PATH="/app/.swarm/memory.db"
INGEST_SCRIPT="scripts/ingestion/ingest_correct.js"

echo "🚀 Starting Ask-Ruvnet on Railway..."
ls -F src/ui/dist
echo "📄 Checking for PDFs in dist/assets/docs:"
ls -la src/ui/dist/assets/docs/ 2>&1 || echo "⚠️ docs folder not found"

# ALWAYS check for latest package versions on every deploy
echo "🔄 Checking for latest package versions..."
node scripts/ingestion/check_repo_versions.js 2>/dev/null || echo "⚠️ Version check failed (will use cached versions)"

echo "📂 Checking for knowledge base at: $DB_PATH"

# Check if database exists in the persistent volume
if [ -f "FORCE_REBUILD" ]; then
  echo "⚠️ FORCE_REBUILD file detected. Deleting existing database..."
  rm -f "$DB_PATH"
fi

if [ ! -f "$DB_PATH" ]; then
  echo "🚨 CRITICAL: Database not found in persistent volume!"
  echo "🩹 Initiating SELF-HEALING protocol..."

  # First fetch latest repo content (if gh is available)
  if command -v gh &> /dev/null; then
    echo "📡 Fetching latest repo content via GitHub API..."
    node scripts/ingestion/fetch_repos_gh.js || echo "⚠️ Repo fetch failed, using cached knowledge"
  fi

  # Run ingestion to rebuild the brain
  echo "🧠 Rebuilding knowledge base (this may take a few minutes)..."
  node $INGEST_SCRIPT
  
  if [ $? -eq 0 ]; then
    echo "✅ Self-healing complete! Knowledge base restored."
  else
    echo "❌ Self-healing FAILED. Starting server anyway (might be lobotomized)."
  fi
else
  echo "✅ Knowledge base found. Size: $(du -h $DB_PATH | cut -f1)"
fi

# Start the server
echo "🔌 Starting Node.js server..."
cd /app
node src/server/app.js || { echo "❌ App crashed! Sleeping for debug..."; sleep 3600; }
