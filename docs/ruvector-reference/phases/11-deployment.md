# Phase 11: Deployment Planning

Updated: 2026-01-02 00:25:00 EST | Version 1.0.0
Created: 2026-01-02 00:25:00 EST

## Purpose

Plan and execute production deployment with public access. This phase covers infrastructure setup, deployment automation, monitoring, and go-live procedures.

---

## Prerequisites

- Phase 10 complete (documentation and versioning ready)
- Security audit passed (Phase 9)
- All tests passing
- Domain name acquired (if applicable)

---

## Why Deployment Planning Matters

A great application with poor deployment:
- Is unreliable and frustrating for users
- Costs more to operate than necessary
- Is difficult to update and maintain
- Creates security vulnerabilities

**Deploy right the first time. It's cheaper than fixing production issues.**

---

## Sub-Phases

| Sub-Phase | Name | Purpose |
|-----------|------|---------|
| 11.1 | Infrastructure Selection | Choose hosting platform |
| 11.2 | Environment Configuration | Production environment setup |
| 11.3 | CI/CD Pipeline | Automated deployment |
| 11.4 | Database Migration | Production DB setup |
| 11.5 | Monitoring & Alerting | Observability setup |
| 11.6 | Go-Live Checklist | Final verification |

---

## 11.1 Infrastructure Selection

### Platform Options

| Platform | Best For | KB-First Considerations |
|----------|----------|-------------------------|
| **Railway** | Quick deployment, good DX | PostgreSQL add-on, auto-scaling |
| **Vercel** | Frontend + serverless | Need separate DB hosting |
| **Fly.io** | Global edge deployment | PostgreSQL included |
| **AWS/GCP/Azure** | Enterprise, full control | More setup, more flexibility |
| **Docker + VPS** | Cost control, simplicity | Manual scaling |

### Recommended: Railway

For KB-First applications, Railway is recommended because:
- Native PostgreSQL with pgvector support
- Simple deployment from git
- Automatic HTTPS
- Easy environment variable management
- Reasonable pricing

### Infrastructure Checklist

| Component | Requirement | Notes |
|-----------|-------------|-------|
| Compute | 1+ vCPU, 1GB+ RAM | Scale based on load |
| Database | PostgreSQL 15+ with pgvector | Persistent storage |
| CDN | Optional | For static assets |
| Domain | Custom domain | Required for production |
| SSL | HTTPS required | Usually automatic |

---

## 11.2 Environment Configuration

### Production Environment Variables

```bash
# Required
DATABASE_URL=postgres://user:pass@host:5432/dbname?sslmode=require
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET=<random-256-bit-hex>
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Security
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# KB Configuration
KB_DEFAULT_NAMESPACE=production
KB_GAP_LOGGING=true
KB_MIN_CONFIDENCE=0.5

# Monitoring (optional but recommended)
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# External Services (if applicable)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Environment File Template

```bash
# Create .env.production.template (commit this)
DATABASE_URL=
NODE_ENV=production
PORT=3000
JWT_SECRET=
ALLOWED_ORIGINS=
KB_DEFAULT_NAMESPACE=production
```

### Secrets Management

| Secret | Storage Method |
|--------|----------------|
| DATABASE_URL | Platform secrets (Railway, Vercel, etc.) |
| JWT_SECRET | Platform secrets |
| API Keys | Platform secrets |

**Never commit secrets to git. Use platform-provided secrets management.**

---

## 11.3 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run security audit
        run: npm audit --audit-level=high

  security:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Run security checks
        run: |
          chmod +x scripts/9.*.sh
          ./scripts/9.3-sql-injection.sh
          ./scripts/9.5-secrets-scan.sh

  kb-verify:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Run KB verification
        run: |
          chmod +x scripts/8.*.sh
          ./scripts/8.1-code-scan.sh
          ./scripts/8.2-import-check.sh

  deploy:
    runs-on: ubuntu-latest
    needs: [test, security, kb-verify]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      # Railway deployment
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ secrets.RAILWAY_SERVICE }}

      # Or Vercel deployment
      # - name: Deploy to Vercel
      #   uses: amondnet/vercel-action@v25
      #   with:
      #     vercel-token: ${{ secrets.VERCEL_TOKEN }}
      #     vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
      #     vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      #     vercel-args: '--prod'

      - name: Verify deployment
        run: |
          sleep 30
          curl -f https://yourdomain.com/health || exit 1
```

### Deployment Verification

After each deployment, verify:

```bash
#!/bin/bash
# scripts/verify-deployment.sh

DOMAIN=${1:-"https://yourdomain.com"}

echo "Verifying deployment at $DOMAIN"

# Health check
echo -n "Health check: "
if curl -sf "$DOMAIN/health" > /dev/null; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# DB connectivity
echo -n "Database: "
HEALTH=$(curl -sf "$DOMAIN/health/db")
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# KB accessible
echo -n "KB: "
KB_HEALTH=$(curl -sf "$DOMAIN/health/kb")
if echo "$KB_HEALTH" | grep -q "ok"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

echo ""
echo "Deployment verified successfully!"
```

---

## 11.4 Database Migration

### Production Database Setup

```bash
# 1. Create production database
# (Usually done through platform UI)

# 2. Run migrations
npm run migrate:production

# 3. Verify schema
psql $DATABASE_URL -c "\dt kb_*"
```

### Migration Script

```typescript
// src/db/migrate.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Create migrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const { rows: applied } = await pool.query('SELECT name FROM migrations');
    const appliedSet = new Set(applied.map(r => r.name));

    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await pool.query('COMMIT');
        console.log(`  ✅ Applied: ${file}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    }

    console.log('All migrations applied successfully');
  } finally {
    await pool.end();
  }
}

migrate().catch(console.error);
```

### KB Data Migration

If migrating KB data from development to production:

```bash
# Export from development
pg_dump $DEV_DATABASE_URL -t kb_nodes -t kb_gaps --data-only > kb_data.sql

# Import to production
psql $PROD_DATABASE_URL < kb_data.sql
```

---

## 11.5 Monitoring & Alerting

### Health Endpoints

```typescript
// src/api/health.ts
import { Router } from 'express';
import { pool } from '../db';
import { kb } from '../kb';

const router = Router();

// Basic health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health
router.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// KB health
router.get('/health/kb', async (req, res) => {
  try {
    const result = await kb.verifyConnection();
    if (result) {
      const { rows } = await pool.query('SELECT COUNT(*) FROM kb_nodes');
      res.json({
        status: 'ok',
        kb: 'connected',
        nodeCount: parseInt(rows[0].count)
      });
    } else {
      res.status(503).json({ status: 'error', kb: 'unavailable' });
    }
  } catch (err) {
    res.status(503).json({ status: 'error', kb: 'error' });
  }
});

export default router;
```

### Logging

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  redact: ['password', 'token', 'authorization', 'cookie']
});

// Usage
logger.info({ query, results: results.length }, 'KB search completed');
logger.error({ err, query }, 'KB search failed');
```

### Metrics (Prometheus)

```typescript
// src/lib/metrics.ts
import promClient from 'prom-client';

// Enable default metrics
promClient.collectDefaultMetrics();

// Custom metrics
export const kbSearchDuration = new promClient.Histogram({
  name: 'kb_search_duration_seconds',
  help: 'Duration of KB searches',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const kbGapTotal = new promClient.Counter({
  name: 'kb_gap_total',
  help: 'Total number of KB gaps detected'
});

export const kbNodeCount = new promClient.Gauge({
  name: 'kb_node_count',
  help: 'Current number of KB nodes'
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

### Alerting Rules

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Health check fails | 3 consecutive | Critical | Page on-call |
| Response time > 2s | 5 min avg | Warning | Investigate |
| Error rate > 1% | 5 min avg | Warning | Investigate |
| KB gaps > 100/day | Daily | Info | Review gaps |
| DB connections > 80% | Current | Warning | Scale DB |

---

## 11.6 Go-Live Checklist

### Pre-Launch (24 hours before)

- [ ] All tests passing in production environment
- [ ] Database migrations applied
- [ ] KB data verified (node count, search working)
- [ ] SSL certificate valid
- [ ] DNS configured correctly
- [ ] Monitoring dashboards set up
- [ ] Alerting configured and tested
- [ ] Rollback plan documented
- [ ] Team notified of launch time

### Launch Day

```bash
#!/bin/bash
# scripts/go-live.sh

echo "=== Go-Live Checklist ==="
echo ""

# 1. Verify production environment
echo "1. Checking production environment..."
./scripts/verify-deployment.sh https://yourdomain.com
if [ $? -ne 0 ]; then
  echo "❌ Deployment verification failed"
  exit 1
fi

# 2. Run smoke tests
echo ""
echo "2. Running smoke tests..."
npm run test:smoke
if [ $? -ne 0 ]; then
  echo "❌ Smoke tests failed"
  exit 1
fi

# 3. Verify KB
echo ""
echo "3. Verifying KB..."
curl -s https://yourdomain.com/api/search -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "limit": 1}' | jq .

# 4. Check monitoring
echo ""
echo "4. Verify monitoring is receiving data..."
echo "   - Check Prometheus/Grafana dashboards"
echo "   - Verify alerts are configured"

# 5. Final confirmation
echo ""
echo "================================================"
echo "Pre-launch checks complete!"
echo ""
echo "To go live:"
echo "  1. Update DNS to point to production"
echo "  2. Remove any maintenance page"
echo "  3. Announce launch"
echo ""
echo "Post-launch:"
echo "  - Monitor dashboards for 30 minutes"
echo "  - Check error rates"
echo "  - Verify user access"
```

### Post-Launch (First 24 hours)

- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Check KB search quality
- [ ] Review first user feedback
- [ ] Document any issues encountered
- [ ] Celebrate! 🎉

---

## Rollback Procedure

If issues are discovered after launch:

### Quick Rollback (< 5 minutes)

```bash
# 1. Revert to previous deployment
railway rollback  # or equivalent for your platform

# 2. Verify rollback
./scripts/verify-deployment.sh https://yourdomain.com

# 3. Notify team
echo "Rollback completed at $(date)"
```

### Database Rollback

```bash
# If DB changes need reverting
# (Requires pre-migration backup)

# 1. Stop application
railway stop

# 2. Restore database
psql $DATABASE_URL < backup_before_migration.sql

# 3. Deploy previous version
git revert HEAD
git push

# 4. Restart and verify
railway restart
./scripts/verify-deployment.sh
```

---

## Public Access Configuration

### Custom Domain Setup

1. **DNS Configuration**
   ```
   Type: CNAME
   Name: app (or @)
   Value: [platform-provided-domain]
   TTL: 300
   ```

2. **SSL Certificate**
   - Most platforms auto-provision Let's Encrypt
   - Verify HTTPS works before going live

3. **Security Headers**
   ```typescript
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         scriptSrc: ["'self'"],
         imgSrc: ["'self'", "data:", "https:"],
       }
     },
     hsts: {
       maxAge: 31536000,
       includeSubDomains: true,
       preload: true
     }
   }));
   ```

---

## Quality Gate Checklist

Before going live, verify:

- [ ] Infrastructure provisioned and configured
- [ ] All environment variables set
- [ ] CI/CD pipeline working
- [ ] Database migrated with production data
- [ ] Monitoring and alerting configured
- [ ] Health endpoints responding
- [ ] SSL/HTTPS working
- [ ] Custom domain configured
- [ ] Go-live checklist completed
- [ ] Rollback procedure documented and tested

---

## Exit Criteria

Application is deployed to production with:
- Public access via custom domain
- Monitoring and alerting active
- Rollback procedure ready
- Team trained on operations

**The application is now live! 🚀**

---

## Post-Launch Operations

After launch, establish ongoing processes:

1. **Daily**: Check dashboards, review errors
2. **Weekly**: Review KB gaps, update knowledge
3. **Monthly**: Security updates, dependency updates
4. **Quarterly**: Performance review, capacity planning

See the Operator Guide (Phase 10.5) for detailed procedures.
