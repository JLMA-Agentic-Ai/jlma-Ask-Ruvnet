---
created: 2025-12-02
last_modified: 2025-12-02
---

# Ask rUVnet - Railway Deployment Guide

## 🚂 Deploying to Railway

### Prerequisites
- Railway account: https://railway.com/dashboard
- GitHub repo connected

### Step 1: Create New Project

1. Go to https://railway.com/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `stuinfla/Ask-Ruvnet`
5. Railway will automatically detect `railway.json` and configure

### Step 2: Add Environment Variables

In Railway Dashboard → Variables, add these:

```bash
# AI API Keys
GROQ_API_KEY=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
GOOGLE_GEMINI_API_KEY=AIzaSyBQojV0SFAy_xoTpp3eRj5WPrrlaeI-ZbA
OPENAI_API_KEY=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
CLAUDE_API_KEY=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

# Additional APIs (optional)
TOGETHER_API_KEY=5f5238312dfc456b9be0854c9a041d67bd5907ca30350968d8db78b04d35db24
OPENROUTER_API_KEY=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
DEEPSEEK_API_KEY=sk-1cdf05f3b06f4d0d9dcc4b95e357a61e
PERPLEXITY_API_KEY=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

# Server Config
PORT=3000
NODE_ENV=production
```

### Step 3: Deploy

Click **"Deploy"** - Railway will:
1. Clone your GitHub repo
2. Extract the 189MB compressed database (→ 403MB)
3. Install dependencies
4. Start the server with `start-railway.sh`

### Step 4: Get Your URL

After deployment (2-3 minutes):
- Railway gives you a URL like: `https://ask-ruvnet-production.up.railway.app`
- This URL is **permanent** and works 24/7

### Step 5: Custom Domain (Optional)

1. In Railway → Settings → Domains
2. Add your custom domain
3. Update DNS with Railway's CNAME

---

## 📊 What Gets Deployed

- ✅ **114,450 knowledge base episodes** (403MB SQLite)
- ✅ **Agentic Flow HybridReasoningBank**
- ✅ **Better-SQLite3 database**
- ✅ **Groq LLM integration**
- ✅ **Full UI** (React app)

---

## 🔧 Using Railway CLI (Advanced)

### Install CLI
```bash
npm install -g @railway/cli
```

### Login & Link
```bash
railway login
railway link
```

### Push Environment Variables
```bash
railway variables set GROQ_API_KEY="your-key"
railway variables set GOOGLE_GEMINI_API_KEY="your-key"
# ... etc
```

### Deploy Manually
```bash
railway up
```

### View Logs
```bash
railway logs
```

---

## 🚀 Database Updates

After adding new videos or content locally:

1. Re-run ingestion: `node ingest_correct.js`
2. Compress updated database: `tar -czf swarm-db.tar.gz .swarm/`
3. Commit and push: `git add swarm-db.tar.gz && git commit -m "Updated KB" && git push`
4. Railway auto-redeploys with new data

---

## 💰 Cost

**Free Tier:**
- 500 hours/month
- 512MB RAM
- Sleeps after 1 hour inactivity

**Hobby Plan ($5/month):**
- Always-on
- 8GB RAM
- **Recommended for production**

---

## ✅ Verification

After deployment, test:
```bash
curl https://your-railway-url.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is HybridReasoningBank?"}'
```

Should return a detailed answer from the knowledge base!

---


## 🔧 CLI Authentication: The Definitive Guide

If you need to use the Railway CLI for management (linking, deleting services, uploading volumes), follow these strict rules to avoid "Unauthorized" errors.

### 1. The Token Type Matters
- **Project Tokens (Service Tokens):** Scoped to a specific environment. Good for *deployment* (`railway up`), but **CANNOT** perform account-level actions like `link` or `delete`.
- **User Tokens (Personal Access Tokens):** The "Skeleton Key". Can do everything. **Use this for local CLI management.**
  - Generate at: [Account Settings > Tokens](https://railway.com/account/tokens)

### 2. The `CI=true` Trick
The Railway CLI tries to be interactive (browser login) by default. To force it to accept a token without opening a browser, you **MUST** set `CI=true`.

**Correct Command Pattern:**
```bash
export CI=true
export RAILWAY_TOKEN=your_user_token_here
npx -y @railway/cli <command>
```

### 3. Common Commands (Non-Interactive)
- **Check Status:** `npx -y @railway/cli status`
- **List Services:** `npx -y @railway/cli list` (Might require API usage if CLI is stubborn)
- **Deploy:** `npx -y @railway/cli up --service <service_name>`

### 4. API Fallback
If the CLI fails to list/delete services even with the User Token, use the GraphQL API directly:
- **Endpoint:** `https://backboard.railway.app/graphql/v2`
- **Header:** `Authorization: Bearer <User_Token>`

---

## 🔄 Tech Stack (Railway Deployment)

- **Backend:** Node.js + Express
- **Database:** SQLite (Better-SQLite3)
- **Knowledge Base:** Agentic Flow HybridReasoningBank
- **LLM:** Groq (llama-3.3-70b-versatile)
- **Embeddings:** @xenova/transformers (local)
- **Frontend:** React (Vite build)
- **Hosting:** Railway (Node.js buildpack)

---

## 📞 Support

Issues? Check:
1. Railway logs: `railway logs`
2. Database extracted: Look for "✅ Knowledge base ready"
3. Environment variables set correctly
4. GitHub repo has latest `swarm-db.tar.gz`
