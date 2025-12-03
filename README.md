# Ask rUVnet - AI Knowledge Base Assistant 🚀

**Production URL:** https://ask-ruvnet-production.up.railway.app  
**Version:** 1.7.3  
**Deployment Platform:** Railway

An advanced AI-powered knowledge base assistant that provides accurate, contextual answers from Ruv's coaching materials, code repositories, and technical documentation.

---

## 🏗️ Architecture Overview

### **Railway Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Docker Container (Node.js 18)                       │   │
│  │                                                       │   │
│  │  ├─ Express Server (Port 3000)                       │   │
│  │  │  └─ API Routes (/api/chat, /api/knowledge)       │   │
│  │  │                                                    │   │
│  │  ├─ Vite React UI (served as static files)          │   │
│  │  │  └─ /src/ui/dist/                                 │   │
│  │  │                                                    │   │
│  │  ├─ Knowledge Base (SQLite)                          │   │
│  │  │  └─ .swarm/memory.db (403MB, persistent volume)  │   │
│  │  │                                                    │   │
│  │  └─ Groq LLM Integration                             │   │
│  │     └─ llama-3.3-70b-versatile                       │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Persistent Volume: /app/.swarm/                             │
│  Environment: GROQ_API_KEY, PORT=3000                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **Key Components**

1. **Backend (Express.js)**
   - Location: `/src/server/app.js`
   - Handles chat requests, knowledge base queries
   - Serves static React UI from `/src/ui/dist`
   - Integrates with Groq API for LLM responses

2. **Frontend (React + Vite)**
   - Location: `/src/ui/src/`
   - Built to `/src/ui/dist/` during deployment
   - Features: Chat interface, PDF viewer, knowledge base dashboard
   - Styling: Custom CSS with cyber-industrial theme

3. **Knowledge Base**
   - Engine: SQLite (better-sqlite3)
   - Location: `.swarm/memory.db` (persistent volume)
   - Size: 403MB
   - Documents: 114,450+ embedded entries
   - Embeddings: Xenova/all-MiniLM-L6-v2 (384-dim)

4. **LLM Integration**
   - Provider: Groq
   - Model: llama-3.3-70b-versatile
   - API: Direct fetch to `https://api.groq.com/openai/v1/chat/completions`

---

## 🚀 Deployment

### **Railway Deployment (Production)**

The application is deployed on Railway with automatic builds from the `main` branch.

#### **Build Process**
```bash
# Defined in package.json
npm run build
  └─ cd src/ui && npm install && npm run build
     └─ vite build (outputs to src/ui/dist/)
```

#### **Start Process**
```bash
# Defined in package.json
npm start
  └─ bash scripts/deployment/start-railway.sh
     └─ Self-healing startup script
        ├─ Checks for knowledge base
        ├─ Runs ingestion if needed
        └─ Starts Express server
```

#### **Environment Variables (Railway)**
```bash
# Required
GROQ_API_KEY=<your-groq-api-key>
PORT=3000

# Optional
GOOGLE_GEMINI_API_KEY=<for-video-processing>
NODE_ENV=production
```

#### **Persistent Storage**
- Railway automatically provisions a persistent volume
- Mounted at: `/app/.swarm/`
- Contains: `memory.db` (knowledge base)
- Survives deployments and restarts

### **Deployment Steps**

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Railway Auto-Deploys**
   - Detects push to `main` branch
   - Runs `npm install`
   - Runs `npm run build`
   - Runs `npm start`
   - Health check on `/health` endpoint

3. **Verify Deployment**
   - Check version badge in UI (top-left)
   - Test chat functionality
   - Verify knowledge base dashboard

---

## 💻 Local Development

### **Prerequisites**
- Node.js 18+
- Groq API Key ([get one free](https://console.groq.com))

### **Setup**

```bash
# Clone repository
git clone https://github.com/stuinfla/Ask-Ruvnet.git
cd Ask-Ruvnet

# Install dependencies
npm install
cd src/ui && npm install && cd ../..

# Extract knowledge base (if not present)
tar -xzf swarm-db.tar.gz

# Create .env file
cp .env.example .env
# Add your GROQ_API_KEY to .env

# Start development server
PORT=3005 node src/server/app.js
```

### **Development URLs**
- Backend: http://localhost:3005
- Frontend: Served by Express from `/src/ui/dist`

### **Building UI Changes**
```bash
cd src/ui
npm run build
cd ../..
# Restart server to see changes
```

---

## 📁 Project Structure

```
Ask-Ruvnet/
├── src/
│   ├── server/
│   │   ├── app.js                 # Express server
│   │   └── RuvPersona.js          # Ruv's voice/persona
│   ├── ui/
│   │   ├── src/
│   │   │   ├── App.jsx            # Main React component
│   │   │   ├── PDFPresentation.jsx
│   │   │   └── version.json       # App version
│   │   ├── public/
│   │   │   ├── assets/docs/       # PDFs, videos
│   │   │   └── knowledge_assets/  # Image frames
│   │   └── dist/                  # Built UI (generated)
│   └── core/
│       └── RuvectorStore.js       # Knowledge base interface
├── scripts/
│   ├── deployment/
│   │   └── start-railway.sh       # Railway startup script
│   └── ingestion/
│       ├── processed_knowledge.json
│       └── repo_knowledge.json    # GitHub repo metadata
├── .swarm/
│   └── memory.db                  # SQLite knowledge base
├── package.json                   # Root dependencies
└── README.md                      # This file
```

---

## 🔧 Configuration

### **Knowledge Base Updates**

Since automatic ingestion is disabled in production, update knowledge manually:

1. **Run ingestion locally:**
   ```bash
   node scripts/ingestion/ingest_correct.js
   ```

2. **Update repo metadata:**
   Edit `scripts/ingestion/repo_knowledge.json`

3. **Commit and push:**
   ```bash
   git add scripts/ingestion/*.json
   git commit -m "Update knowledge base"
   git push origin main
   ```

### **Version Updates**

Update version in `src/ui/src/version.json`:
```json
{
    "version": "1.7.3",
    "build": "stable",
    "lastUpdated": "2025-12-03"
}
```

---

## 🧪 Testing

### **Health Check**
```bash
curl https://ask-ruvnet-production.up.railway.app/health
```

### **Knowledge Base Stats**
```bash
curl https://ask-ruvnet-production.up.railway.app/api/knowledge
```

### **Chat Test**
```bash
curl -X POST https://ask-ruvnet-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ruvector?"}'
```

---

## 📊 Current Status (v1.7.3)

### **Production Metrics**
- ✅ Server: Running
- ✅ Knowledge Base: 114,450 documents
- ✅ Active Repos: 5 (Ask-Ruvnet, agentic-flow, ruvector, claude-flow, neural-trader)
- ✅ Uptime: 24/7
- ✅ Response Time: <2s average

### **Known Limitations**
- Agentic Flow initialization disabled (import errors in production)
- Automatic ingestion disabled (runs manually)
- ReasoningBank context retrieval unavailable (fallback to direct Groq)

### **What Works**
- ✅ Chat with Groq LLM
- ✅ Knowledge base dashboard
- ✅ PDF presentation mode
- ✅ Repository version display
- ✅ Health monitoring

---

## 🛠️ Troubleshooting

### **Deployment Fails**
- Check Railway logs: `npx @railway/cli logs`
- Verify `GROQ_API_KEY` is set
- Ensure `npm run build` completes locally

### **Knowledge Base Empty**
- Check persistent volume is mounted
- Verify `.swarm/memory.db` exists
- Re-run ingestion if needed

### **UI Not Loading**
- Verify `src/ui/dist/` was built
- Check Express static file serving in `app.js`
- Clear browser cache

---

## 📝 License

MIT

---

## 👤 Author

**rUVnet**  
- GitHub: [@ruvnet](https://github.com/ruvnet)
- Production: https://ask-ruvnet-production.up.railway.app
