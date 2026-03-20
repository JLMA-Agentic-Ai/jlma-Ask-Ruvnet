# Phase 1: Storage Setup

## Purpose

Ensure persistent storage is available before any KB work begins. The KB must survive restarts, be queryable, and support vector embeddings.

---

## Prerequisites

- Docker installed
- Port 5432 available (or choose different port)
- ~1GB disk space for initial setup

---

## Steps

### 1.1 Check for Running Storage

```bash
docker ps | grep ruvector-db
```

**If found:** Skip to Step 1.3  
**If not found:** Continue to Step 1.2

---

### 1.2 Start Persistent Storage

```bash
# Create data directory for persistence
mkdir -p ~/ruvector-data

# Start RuVector PostgreSQL
docker run -d \
  --name ruvector-db \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=${RUVECTOR_PASSWORD:-ruvector_secure_2024} \
  -p 5432:5432 \
  -v ~/ruvector-data:/var/lib/postgresql/data \
  ruvnet/ruvector-postgres:latest
```

Wait for container to be healthy:
```bash
echo "Waiting for PostgreSQL to be ready..."
until docker exec ruvector-db pg_isready -U postgres 2>/dev/null; do
  sleep 2
  echo "Still waiting..."
done
echo "PostgreSQL is ready!"
```

**Alternative: Standard pgvector**

If ruvector-postgres is unavailable:
```bash
docker run -d \
  --name ruvector-db \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=${RUVECTOR_PASSWORD:-ruvector_secure_2024} \
  -p 5432:5432 \
  -v ~/ruvector-data:/var/lib/postgresql/data \
  pgvector/pgvector:pg16
```

---

### 1.3 Verify Connection

```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres:${RUVECTOR_PASSWORD:-ruvector_secure_2024}@localhost:5432/postgres"

# Test connection
psql "$DATABASE_URL" -c "SELECT 1" || {
  echo "ERROR: Could not connect to database"
  exit 1
}

echo "Connection successful!"
```

---

### 1.4 Initialize Schema

```bash
# Run the schema initialization
psql "$DATABASE_URL" -f templates/schema.sql
```

**What the schema creates:**
- `kb_nodes` — Knowledge content with embeddings
- `kb_gaps` — Unanswered queries for KB improvement
- `kb_analytics` — Usage tracking
- `reasoning_bank` — SONA pattern storage
- `gnn_nodes` and `gnn_edges` — Graph structure (if using GNN)
- `attention_experts` — Expert routing (if using MoE)

---

### 1.5 Set Environment Variables

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export DATABASE_URL="postgresql://postgres:${RUVECTOR_PASSWORD:-ruvector_secure_2024}@localhost:5432/postgres"
export RUVECTOR_STORAGE="postgres"
export RUVECTOR_EMBEDDING_MODEL="all-MiniLM-L6-v2"
```

Reload:
```bash
source ~/.bashrc  # or ~/.zshrc
```

---

### 1.6 Verify Extensions

```bash
psql "$DATABASE_URL" -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'ruvector', 'pg_trgm');"
```

Expected output:
```
 extname  | extversion 
----------+------------
 vector   | 0.7.0
 pg_trgm  | 1.6
```

If `ruvector` is available (using ruvector-postgres):
```
 extname  | extversion 
----------+------------
 ruvector | 0.2.0
 pg_trgm  | 1.6
```

---

## Quality Gate Checklist

Before proceeding to Phase 2, verify:

- [ ] `docker ps | grep ruvector-db` shows running container
- [ ] `psql "$DATABASE_URL" -c "SELECT 1"` succeeds
- [ ] Schema tables exist: `psql "$DATABASE_URL" -c "\dt kb_*"`
- [ ] Vector extension active: `SELECT extname FROM pg_extension WHERE extname = 'vector';`
- [ ] Environment variables set

---

## Troubleshooting

### "Connection refused"
```bash
# Check if container is running
docker ps -a | grep ruvector-db

# Check logs
docker logs ruvector-db

# Restart if needed
docker restart ruvector-db
```

### "Permission denied"
```bash
# Fix data directory permissions
sudo chown -R $(id -u):$(id -g) ~/ruvector-data
```

### "Port already in use"
```bash
# Find what's using the port
lsof -i :5432

# Or use a different port
docker run -d --name ruvector-db ... -p 5433:5432 ...
export DATABASE_URL="postgresql://postgres:...@localhost:5433/postgres"
```

---

## Exit Criteria

Storage is running, accessible, and schema is initialized.

**Proceed to Phase 2: KB Creation**
