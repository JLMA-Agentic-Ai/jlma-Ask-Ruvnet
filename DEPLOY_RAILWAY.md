# Railway Deployment Guide

**Application:** Ask rUVnet  
**Platform:** Railway  
**Production URL:** https://ask-ruvnet-production.up.railway.app

---

## 🚂 Railway Architecture

### **Overview**

Railway provides a fully managed platform-as-a-service (PaaS) that automatically:
- Builds Docker containers from your code
- Manages environment variables
- Provisions persistent storage
- Handles SSL/HTTPS
- Provides automatic deployments from Git

### **Deployment Flow**

```
GitHub Push (main branch)
    ↓
Railway Detects Change
    ↓
Build Phase
  ├─ npm install (root)
  ├─ npm install (src/ui)
  └─ npm run build
      └─ vite build → src/ui/dist/
    ↓
Deploy Phase
  ├─ Start container
  ├─ Mount persistent volume (/app/.swarm/)
  ├─ Run start-railway.sh
  │   ├─ Check for knowledge base
  │   ├─ Run ingestion if needed
  │   └─ Start Express server
  └─ Health check (/health)
    ↓
Live on Production URL
```

---

## 📋 Prerequisites

1. **Railway Account**
   - Sign up at https://railway.app
   - Connect your GitHub account

2. **Groq API Key**
   - Get free key at https://console.groq.com
   - No credit card required for free tier

3. **GitHub Repository**
   - Fork or clone: https://github.com/stuinfla/Ask-Ruvnet

---

## 🚀 Initial Deployment

### **Step 1: Create New Project**

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `stuinfla/Ask-Ruvnet` (or your fork)
5. Railway will auto-detect Node.js and create a service

### **Step 2: Configure Environment Variables**

In Railway dashboard → Your Project → Variables tab:

```bash
# Required
GROQ_API_KEY=gsk_your_groq_api_key_here
PORT=3000
NODE_ENV=production

# Optional
GOOGLE_GEMINI_API_KEY=your_gemini_key_here
```

**Important:** Click **"Add Variable"** for each one, then **"Deploy"**

### **Step 3: Configure Build Settings**

Railway auto-detects these from `package.json`:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Root Directory:** `/` (default)

No changes needed unless you modify `package.json`.

### **Step 4: Add Persistent Volume**

1. In Railway dashboard → Your Service → Settings
2. Scroll to **"Volumes"**
3. Click **"Add Volume"**
4. Mount Path: `/app/.swarm`
5. Click **"Add"**

This ensures your knowledge base persists across deployments.

### **Step 5: Deploy**

1. Railway will automatically deploy after adding variables
2. Monitor build logs in **"Deployments"** tab
3. Wait for status: **SUCCESS** (takes 3-5 minutes)
4. Click **"View Logs"** to see startup process

### **Step 6: Get Your URL**

1. In Railway dashboard → Your Service → Settings
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Railway provides: `your-app-name.up.railway.app`
5. (Optional) Add custom domain

---

## 🔄 Continuous Deployment

### **Automatic Deployments**

Railway automatically deploys when you push to `main`:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Railway detects push and deploys automatically
# Check deployment status in Railway dashboard
```

### **Manual Deployments**

Using Railway CLI:

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy current code
railway up

# View logs
railway logs
```

---

## 📊 Monitoring

### **Health Check**

Railway automatically monitors `/health` endpoint:

```bash
curl https://ask-ruvnet-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2025-12-03T21:00:00.000Z",
  "checks": {
    "server": "ok",
    "vectorStore": "unknown"
  }
}
```

### **View Logs**

**In Dashboard:**
1. Go to your service
2. Click **"Deployments"**
3. Click on latest deployment
4. View real-time logs

**Via CLI:**
```bash
railway logs --lines 100
```

### **Metrics**

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Request count

Access in: Dashboard → Service → Metrics

---

## 🔧 Configuration

### **Environment Variables**

Update in Railway dashboard → Variables:

```bash
# Core
GROQ_API_KEY=<your-key>      # Required for LLM
PORT=3000                     # Railway default
NODE_ENV=production           # Enables optimizations

# Optional
GOOGLE_GEMINI_API_KEY=<key>  # For video processing
```

**Note:** Changes to variables trigger automatic redeployment.

### **Build Configuration**

Defined in `package.json`:

```json
{
  "scripts": {
    "build": "cd src/ui && npm install && npm run build",
    "start": "bash scripts/deployment/start-railway.sh"
  }
}
```

### **Startup Script**

Location: `scripts/deployment/start-railway.sh`

```bash
#!/bin/bash
# Self-healing startup for Railway

# Check for knowledge base
if [ ! -f "/app/.swarm/memory.db" ]; then
  echo "🧠 Rebuilding knowledge base..."
  node scripts/ingestion/ingest_correct.js
fi

# Start server
node src/server/app.js
```

---

## 🔄 Updating Knowledge Base

Since automatic ingestion is disabled in production:

### **Manual Update Process**

1. **Run ingestion locally:**
   ```bash
   node scripts/ingestion/ingest_correct.js
   ```

2. **Update repo metadata:**
   ```bash
   # Edit scripts/ingestion/repo_knowledge.json
   # Add new repos or update versions
   ```

3. **Commit and push:**
   ```bash
   git add scripts/ingestion/*.json
   git commit -m "Update knowledge base"
   git push origin main
   ```

4. **Railway auto-deploys** with updated data

### **Force Rebuild**

To trigger a full knowledge base rebuild:

1. Create `FORCE_REBUILD` file:
   ```bash
   touch FORCE_REBUILD
   git add FORCE_REBUILD
   git commit -m "Force knowledge base rebuild"
   git push origin main
   ```

2. Railway detects file and runs ingestion

3. Remove file after deployment:
   ```bash
   git rm FORCE_REBUILD
   git commit -m "Cleanup"
   git push origin main
   ```

---

## 🐛 Troubleshooting

### **Build Fails**

**Symptom:** Deployment status shows **FAILED**

**Solutions:**
1. Check build logs in Railway dashboard
2. Verify `npm run build` works locally:
   ```bash
   cd src/ui
   npm install
   npm run build
   ```
3. Check for missing dependencies in `package.json`

### **Server Won't Start**

**Symptom:** Deployment succeeds but app crashes

**Solutions:**
1. Check runtime logs: `railway logs`
2. Verify `GROQ_API_KEY` is set correctly
3. Check `start-railway.sh` permissions:
   ```bash
   chmod +x scripts/deployment/start-railway.sh
   ```

### **Knowledge Base Empty**

**Symptom:** Dashboard shows 0 repos

**Solutions:**
1. Verify persistent volume is mounted at `/app/.swarm`
2. Check if `memory.db` exists in volume
3. Run manual ingestion:
   ```bash
   railway run node scripts/ingestion/ingest_correct.js
   ```

### **UI Not Loading**

**Symptom:** Blank page or 404 errors

**Solutions:**
1. Verify `src/ui/dist/` was created during build
2. Check Express static file serving in `src/server/app.js`:
   ```javascript
   app.use(express.static(path.join(__dirname, '../ui/dist')));
   ```
3. Clear browser cache and hard refresh

### **Slow Response Times**

**Symptom:** Chat takes >5 seconds

**Solutions:**
1. Check Groq API status
2. Verify Railway instance isn't sleeping (upgrade plan if needed)
3. Monitor Railway metrics for CPU/memory issues

---

## 💰 Costs

### **Railway Pricing**

- **Hobby Plan:** $5/month
  - 500 hours of usage
  - $0.000231/GB-hour for RAM
  - $0.000463/vCPU-hour
  - Persistent storage included

- **Pro Plan:** $20/month
  - Unlimited usage
  - Better performance
  - Priority support

### **Estimated Monthly Cost**

For Ask rUVnet (24/7 operation):
- **Compute:** ~$10-15/month (Hobby plan)
- **Storage:** Included (persistent volume)
- **Bandwidth:** Included (reasonable usage)

**Total:** $5-20/month depending on traffic

---

## 🔒 Security

### **Best Practices**

1. **API Keys**
   - Never commit to Git
   - Use Railway environment variables
   - Rotate keys periodically

2. **HTTPS**
   - Automatic with Railway domains
   - Free SSL certificates

3. **Environment Isolation**
   - Use separate Railway projects for staging/production
   - Different API keys per environment

---

## 📈 Scaling

### **Horizontal Scaling**

Railway supports multiple instances:

1. Dashboard → Service → Settings
2. Scroll to **"Replicas"**
3. Increase instance count
4. Railway handles load balancing

**Note:** Requires Pro plan

### **Vertical Scaling**

Upgrade instance resources:

1. Dashboard → Service → Settings
2. Adjust **"Memory"** and **"CPU"**
3. Redeploy

---

## 🎯 Production Checklist

Before going live:

- [ ] `GROQ_API_KEY` set in Railway
- [ ] Persistent volume mounted at `/app/.swarm`
- [ ] Health check endpoint responding
- [ ] Knowledge base populated (check `/api/knowledge`)
- [ ] UI loads correctly
- [ ] Chat functionality works
- [ ] PDF viewer works
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up
- [ ] Backup strategy for knowledge base

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **GitHub Issues:** https://github.com/stuinfla/Ask-Ruvnet/issues

---

## 🔄 Version History

- **v1.7.3** (2025-12-03)
  - Full-screen PDF presentation mode
  - Updated ruvector to 0.1.29
  - Re-enabled Agentic Flow initialization
  - Improved dashboard with repo versions

- **v1.7.0** (2025-12-03)
  - Fixed dashboard repo display
  - Switched to iframe PDF viewer
  - Manual repo_knowledge.json loading

- **v1.6.0** (2025-12-01)
  - Initial Railway deployment
  - SQLite knowledge base
  - Groq LLM integration
