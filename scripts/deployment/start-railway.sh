#!/bin/bash
# Railway/Docker Startup Script for Ask-Ruvnet
# Backend: PostgreSQL RuVector (connected via DATABASE_URL or PG_HOST env vars)

echo "🚀 Starting Ask-Ruvnet..."

# Verify PostgreSQL connectivity
if [ -n "$DATABASE_URL" ] || [ -n "$PG_HOST" ]; then
  echo "✅ PostgreSQL connection configured"
else
  echo "⚠️ No DATABASE_URL or PG_HOST set — will use local RuvectorStore fallback"
fi

# Start the server
echo "🔌 Starting Node.js server..."
cd /app
node src/server/app.js || { echo "❌ App crashed! Sleeping for debug..."; sleep 3600; }
