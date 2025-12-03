---
created: 2025-12-02
last_modified: 2025-12-02
---

# 🚂 RAILWAY DEPLOYMENT - COMPLETE GUIDE

## ✅ Prerequisites Completed

1. ✅ Database compressed: 403MB → 189MB (`swarm-db.tar.gz`)
2. ✅ Startup script created: `start-railway.sh` 
3. ✅ Railway config added: `railway.json`
4. ✅ Environment variables documented: `.env.example`
5. ✅ Code pushed to GitHub: `stuinfla/Ask-Ruvnet`

---

## 🎯 Deploy to Railway (5 Minutes)

### Step 1: Go to Railway Dashboard
Open: https://railway.com/dashboard

### Step 2: Create New Project
1. Click **"New Project"** button (top right)
2. Select **"Deploy from GitHub repo"**
3. Choose repository: **`stuinfla/Ask-Ruvnet`**
4. Railway will detect `railway.json` and configure automatically

### Step 3: Add Environment Variables
In Railway Dashboard → **Settings** → **Variables**, add these:

#### REQUIRED:
```bash
GROQ_API_KEY=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
PORT=3000
NODE_ENV=production
```

#### RECOMMENDED (for video processing):
```bash
GOOGLE_GEMINI_API_KEY=AIzaSyBQojV0SFAy_xoTpp3eRj5WPrrlaeI-ZbA
```

#### OPTIONAL (additional AI providers):
```bash
OPENAI_API_KEY=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
CLAUDE_API_KEY=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
```

### Step 4: Deploy
Click **"Deploy"** - Railway will:
- Clone your GitHub repo
- Install dependencies (`npm install`)
- Extract knowledge base (189MB → 403MB)
- Start server with `bash start-railway.sh`

### Step 5: Get Your URL
After 2-3 minutes:
- Go to **Settings** → **Domains**
- Railway provides: `https://your-project-name.up.railway.app`
- Or add custom domain

---

## ✅ Verification

### Test Your Deployed App

```bash
curl https://your-railway-url.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is HybridReasoningBank?"}'
```

**Expected:** Detailed answer from the knowledge base with sources.

### Check Logs
In Railway Dashboard → **View Logs**

Look for:
```
✅ Database loaded: 403M
🚀 Starting Node.js server...
Server running on port 3000
✅ Knowledge base ready (114,450 episodes)
```

---

## 📊 What Gets Deployed

- ✅ **Node.js app** (Express server)
- ✅ **React UI** (pre-built in `src/ui/dist`)
- ✅ **Knowledge base** (114,450 episodes, 403MB SQLite)
- ✅ **Agentic Flow** (HybridReasoningBank with learning)
- ✅ **Groq LLM** (llama-3.3-70b-versatile)
- ✅ **Local embeddings** (@xenova/transformers)

---

## 🔧 Railway CLI (Optional)

If you prefer CLI deployment:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project (after creating via dashboard)
railway link

# Set environment variables
railway variables set GROQ_API_KEY="your-key-here"
railway variables set GOOGLE_GEMINI_API_KEY="your-key-here"
railway variables set PORT="3000"
railway variables set NODE_ENV="production"

# Deploy
railway up

# View logs
railway logs
```

---

## 💰 Pricing

### Free Tier (Starter Plan)
- ✅ $5/month free credits
- ✅ Good for testing
- ⚠️ Sleeps after 1 hour inactivity
- ⚠️ 512MB RAM limit

### Hobby Plan ($5/month)
- ✅ Always-on (no sleep)
- ✅ 512MB RAM
- ✅ Good for light production use
- **Recommended for this app**

### Pro Plan ($20/month)
- ✅ 8GB RAM
- ✅ High availability
- ✅ Custom domains
- ✅ Best for production

**Your app needs:** ~200-300MB RAM active, ~500MB with cache
**Recommendation:** Start with Hobby ($5/mo), upgrade if needed

---

## 🔄 Updating Your Deployment

### After Adding New Knowledge
1. **Commit your new data** (e.g., new transcripts in `data_ingestion_ruv_coaching/`).
2. **Trigger a Rebuild**:
   Create a file named `FORCE_REBUILD` in the root:
   ```bash
   touch FORCE_REBUILD
   git add FORCE_REBUILD
   git commit -m "Trigger DB rebuild"
   git push
   ```
3. **Railway will redeploy**:
   - Detects `FORCE_REBUILD` file.
   - Deletes old database.
   - Runs `ingest_correct.js` to rebuild from scratch (ensures 100% freshness).
   - Starts server.
4. **Cleanup**:
   After deployment succeeds, remove the file:
   ```bash
   git rm FORCE_REBUILD
   git commit -m "Cleanup trigger"
   git push
   ```

### Code Changes

```bash
# Just push to GitHub
git add .
git commit -m "Your changes"
git push

# Railway auto-deploys
```

---

## 🚨 Troubleshooting

### Build Failed
**Check:** `railway logs --build`
**Common fix:** Ensure `package.json` has all dependencies

### App Not Starting
**Check:** `railway logs`
**Common fixes:**
1. Verify environment variables set
2. Check DATABASE_PATH is correct
3. Ensure `start-railway.sh` is executable

### 404 Errors
**Check:** UI build completed
**Fix:** 
```bash
cd src/ui && npm run build && cd ../..
git add src/ui/dist
git commit -m "Rebuild UI"
git push
```

### Out of Memory
**Symptom:** App crashes after running
**Fix:** Upgrade from Hobby ($5) to Pro ($20) for 8GB RAM

---

## 📝 Summary

**You're ready to deploy! Just:**

1. Go to https://railway.com/dashboard
2. Click "New Project" → "Deploy from GitHub"
3. Select `stuinfla/Ask-Ruvnet`
4. Add environment variables (GROQ_API_KEY, PORT, NODE_ENV)
5. Click "Deploy"

**Your AI knowledge base will be live in 3 minutes!** 🚀
