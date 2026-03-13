#!/bin/bash
# Railway/Docker Startup Script for Ask-Ruvnet
# Backend: RVF Native (knowledge.rvf)

echo "🚀 Starting Ask-Ruvnet..."

# === RVF Format (preferred) ===
if [ -f "knowledge.rvf" ]; then
  echo "✅ RVF knowledge base present ($(du -sh knowledge.rvf | cut -f1))"
elif ls knowledge.rvf.gz.part-* 1>/dev/null 2>&1; then
  echo "📦 Reassembling RVF knowledge base..."
  cat knowledge.rvf.gz.part-* > knowledge.rvf.gz
  gunzip knowledge.rvf.gz
  rm -f knowledge.rvf.gz.part-*
  echo "✅ RVF extracted ($(du -sh knowledge.rvf | cut -f1))"
else
  echo "⚠️ No knowledge base found — app will start with empty KB"
fi

# Decompress content sidecar if compressed version exists
if [ ! -f "content-sidecar.json.gz" ] && [ -f "content-sidecar.json.gz.bak" ]; then
  cp content-sidecar.json.gz.bak content-sidecar.json.gz
fi

# Start the server
echo "🔌 Starting Node.js server..."
node src/server/app.js || { echo "❌ App crashed! Sleeping for debug..."; sleep 3600; }
