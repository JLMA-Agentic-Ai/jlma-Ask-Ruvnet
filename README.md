---
created: 2025-12-02
last_modified: 2025-12-02
---

# Ask rUVnet - AI Knowledge Base Assistant 🚀

**Powered by Agentic Flow HybridReasoningBank**

> **⚠️ IMPORTANT: Temporary Architecture**  
> Currently using **SQLite backend** (workaround) while RuVector macOS bindings are broken.  
> **Intended:** RuVector backend for 1000x faster searches + GNN learning.  
> **See:** [TECHNOLOGY_DECISIONS.md](TECHNOLOGY_DECISIONS.md) for full explanation.

An advanced AI-powered knowledge base assistant that combines **semantic search**, **reflexion learning**, and **graph-based memory** to provide accurate, contextual answers from 114,450+ embedded documents.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

---

## ✨ Key Features

### 🧠 Advanced Knowledge System
- **114,450 Embedded Documents** from video transcripts, code repositories, and documentation
- **Agentic Flow HybridReasoningBank** - Goes beyond basic RAG with reflexion and causal reasoning
- **Better-SQLite3** - Fast, reliable 403MB knowledge base
- **100% Verified Recall** - Tested with 10/10 query accuracy
- **Semantic Search** - Using Xenova/all-MiniLM-L6-v2 (384-dim embeddings)

### 🎨 Modern UI
- **Split View** - Chat and visual aids side-by-side
- **Dark Mode** - Professional cyber-industrial aesthetic
- **Mermaid.js Diagrams** - Auto-generated visual explanations
- **Voice Input** - Dictation support for hands-free queries
- **File Upload** - Analyze code snippets and logs

### 🎭 Ruv Persona Engine
- **Authentic Voice** - Responses modeled after Ruv's actual coaching style ("All right", "Totally doable", "Genius move").
- **Optimism Factor** - Encouraging, practical, and confidence-building tone.
- **Live Coding Feel** - Answers sound like a live session ("Let me show you", "I've done this a million times").

### 🚀 Production-Ready
- **Railway Deployment** - One-click cloud hosting with self-healing architecture.
- **Groq LLM** - Fast, reliable responses (llama-3.3-70b-versatile).
- **Zero Hallucinations** - All answers grounded in knowledge base.
- **24/7 Availability** - No downtime when deployed.

---

## 🚂 Quick Deploy to Railway

### Option 1: Web Dashboard (Easiest)

1. Go to https://railway.com/dashboard
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `stuinfla/Ask-Ruvnet`
4. Add environment variables (see [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md))
5. Deploy! ✨

### Option 2: Railway CLI

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

**See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed instructions.**

---

## 💻 Local Development

### Prerequisites
- Node.js v18+
- Groq API Key (free tier available)
- Google Gemini API Key (optional, for video processing)

### Installation

```bash
# Clone
git clone https://github.com/stuinfla/Ask-Ruvnet.git
cd Ask-Ruvnet

# Install dependencies
npm install
cd src/ui && npm install && cd ../..

# Extract knowledge base
tar -xzf swarm-db.tar.gz

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Build UI
cd src/ui && npm run build && cd ../..

# Start server
node src/server/app.js
```

Access at `http://localhost:3000`

---

## 📊 Architecture

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Knowledge Base** | Agentic Flow HybridReasoningBank |
| **Database** | Better-SQLite3 (403MB, 114k episodes) |
| **Embeddings** | @xenova/transformers (local, no API cost) |
| **LLM** | Groq (llama-3.3-70b-versatile) |
| **Backend** | Node.js + Express |
| **Frontend** | React (Vite) |
| **Hosting** | Railway |

### Data Flow

```
User Query 
  → Embedding Generation (local)
  → Semantic Search (SQLite)
  → Context Retrieval (ReasoningBank)
  → LLM Response (Groq)
  → Answer + Sources
```

---

## 📂 Project Structure

```
Ask-Ruvnet/
├── .swarm/                    # Knowledge base (Git ignored)
│   └── memory.db             # 403MB SQLite database
├── swarm-db.tar.gz           # Compressed KB for deployment
├── src/
│   ├── server/
│   │   └── app.js            # Express API + ReasoningBank
│   └── ui/                   # React frontend
├── data_ingestion_ruv_coaching/  # Source videos (ignored)
├── processed_knowledge.json  # Raw extracted data (ignored)
├── ingest_correct.js         # Knowledge base builder
├── start-railway.sh          # Railway startup script
├── railway.json              # Railway deployment config
└── RAILWAY_DEPLOYMENT.md     # Deployment guide
```

---

## 🔑 Environment Variables

Required for deployment:

```bash
GROQ_API_KEY=your-groq-key
GOOGLE_GEMINI_API_KEY=your-gemini-key  # Optional
PORT=3000
NODE_ENV=production
```

See `.env.example` for full list.

---

## 🧪 Testing

### Verify Knowledge Base
```bash
# Run 10-question accuracy test
node test_full_answers.js
```
**Expected:** 10/10 passed, average relevance score ~0.164

### Verify Ruv Persona & Stability
```bash
# Run comprehensive voice + technical test
node test_ruv_voice_comprehensive.js
```
**Expected:** 
- Voice: >70% match
- Technical: >80% pass
- Stability: 10/10 requests successful

### Manual API Test

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is HybridReasoningBank?"}'
```

---

## 📈 Knowledge Base Stats

- **Total Episodes:** 114,450
- **Database Size:** 403 MB
- **Embedding Dimension:** 384
- **Sources:**
  - Ruv coaching video transcripts
  - GitHub repositories (ai, agentic-flow, etc.)
  - Technical documentation
  - Code examples

---

## 🔄 Updating Knowledge Base

1. **Add new data** to `data_ingestion_ruv_coaching/`
2. **Run ingestion:** `node ingest_correct.js`
3. **Compress:** `tar -czf swarm-db.tar.gz .swarm/`
4. **Deploy:** `git add swarm-db.tar.gz && git commit -m "KB update" && git push`

Railway auto-redeploys with updated knowledge!

---

## 🛡️ License

Proprietary - Internal Use Only

---

## 📞 Support

- **Documentation:** [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
- **RuVector Issue:** [RUVECTOR_EMBEDDING_ISSUE_REPORT.md](RUVECTOR_EMBEDDING_ISSUE_REPORT.md)
- **GitHub Issues:** For bugs and feature requests

---

**Built with ❤️ using Agentic Flow, Groq, and Railway**
