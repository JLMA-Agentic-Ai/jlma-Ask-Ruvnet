#!/bin/bash
# Railway startup script
set -e

echo "🚂 Starting Ask rUVnet on Railway..."

# Extract database if compressed file exists and .swarm doesn't
if [ -f "swarm-db.tar.gz" ] && [ ! -d ".swarm" ]; then
    echo "📦 Extracting knowledge base (first deploy)..."
    tar -xzf swarm-db.tar.gz
    echo "✅ Knowledge base ready (114,450 episodes)"
fi

# Verify database exists
if [ -f ".swarm/memory.db" ]; then
    DB_SIZE=$(ls -lh .swarm/memory.db | awk '{print $5}')
    echo "✅ Database loaded: $DB_SIZE"
else
    echo "⚠️  Warning: Database not found, starting with empty knowledge base"
fi

# Start the server
echo "🚀 Starting Node.js server..."
cd src/server && node app.js
