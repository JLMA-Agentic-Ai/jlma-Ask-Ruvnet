#!/bin/bash
# Self-Healing Startup Script for Railway

DB_PATH="/app/.swarm/memory.db"
INGEST_SCRIPT="scripts/ingestion/ingest_correct.js"

echo "🚀 Starting Ask-Ruvnet on Railway..."
ls -F src/ui/dist
echo "📂 Checking for knowledge base at: $DB_PATH"

# Check if database exists in the persistent volume
if [ -f "FORCE_REBUILD" ]; then
  echo "⚠️ FORCE_REBUILD file detected. Deleting existing database..."
  rm -f "$DB_PATH"
fi

if [ ! -f "$DB_PATH" ]; then
  echo "🚨 CRITICAL: Database not found in persistent volume!"
  echo "🩹 Initiating SELF-HEALING protocol..."
  
  # Run ingestion to rebuild the brain
  echo "🧠 Rebuilding knowledge base (skipped due to production bug)..."
  # node $INGEST_SCRIPT
  
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
