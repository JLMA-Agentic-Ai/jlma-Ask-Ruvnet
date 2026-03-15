#!/bin/bash
# Railway/Docker Startup Script for Ask-Ruvnet
# Architecture: RVF-First (knowledge.rvf + content-sidecar.json.gz)

echo "Starting Ask-Ruvnet..."

# Run integrity check BEFORE starting the server
echo ""
node scripts/integrity-check.mjs 2>/dev/null || echo "Integrity check script not available"
echo ""

# Start the server
echo "Starting Node.js server..."
node src/server/app.js || { echo "App crashed! Sleeping for debug..."; sleep 3600; }
