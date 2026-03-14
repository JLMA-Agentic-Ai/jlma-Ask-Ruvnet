#!/bin/bash
# Railway/Docker Startup Script for Ask-Ruvnet
# Architecture: RVF-First (knowledge.rvf + content-sidecar.json.gz)

echo "Starting Ask-Ruvnet..."

# Verify RVF knowledge base is present
if [ -f "knowledge.rvf" ]; then
  echo "RVF knowledge base present ($(du -sh knowledge.rvf | cut -f1))"
else
  echo "WARNING: No knowledge.rvf found — app will start with empty KB"
fi

# Verify content sidecar
if [ -f "content-sidecar.json.gz" ]; then
  echo "Content sidecar present ($(du -sh content-sidecar.json.gz | cut -f1))"
else
  echo "WARNING: No content-sidecar.json.gz — text content unavailable"
fi

# Start the server
echo "Starting Node.js server..."
node src/server/app.js || { echo "App crashed! Sleeping for debug..."; sleep 3600; }
