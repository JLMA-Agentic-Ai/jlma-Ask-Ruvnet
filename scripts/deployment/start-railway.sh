#!/bin/bash
# Railway/Docker Startup Script for Ask-Ruvnet
# Backend: RuvectorStore binary (HNSW-indexed, no external database required)

echo "🚀 Starting Ask-Ruvnet..."

# Extract RuvectorStore data if not already present
if [ ! -d ".ruvector/knowledge-base" ] && ls ruvector-kb.tar.gz.part-* 1>/dev/null 2>&1; then
  echo "📦 Reassembling and extracting RuvectorStore knowledge base..."
  cat ruvector-kb.tar.gz.part-* | tar xzf -
  echo "✅ RuvectorStore extracted"
elif [ -d ".ruvector/knowledge-base" ]; then
  echo "✅ RuvectorStore knowledge base already present"
else
  echo "⚠️ No RuvectorStore data found — app will start with empty KB"
fi

# Start the server
echo "🔌 Starting Node.js server..."
node src/server/app.js || { echo "❌ App crashed! Sleeping for debug..."; sleep 3600; }
