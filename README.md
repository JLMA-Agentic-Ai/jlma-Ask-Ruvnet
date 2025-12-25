# Ask rUVnet - AI Knowledge Base Assistant

**Production URL:** https://ask-ruvnet-production.up.railway.app
**Version:** 1.7.15
**Deployment Platform:** Railway (Dockerfile Builder)

An advanced AI-powered knowledge base assistant that provides accurate, contextual answers from Ruv's coaching materials, code repositories, and technical documentation.

---

## Architecture Overview

### **Railway Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Docker Container (Node.js 22)                       │   │
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
   - Professional technical persona: `/src/server/RuvPersona.js`

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

5. **Core Dependencies**
   - `agentic-flow@2.0.1-alpha.5` - Multi-agent orchestration with HybridReasoningBank
   - `ruvector@0.1.35` - Vector database backend for semantic search
   - `puppeteer@24.31.0` - Headless browser for web scraping
   - `sharp@0.34.5` - Image processing

### **Railway-Specific Architectural Decisions**

This application is optimized for Railway deployment with the following architectural choices:

| Decision | Rationale |
|----------|-----------|
| **Custom Dockerfile** | Railway's Railpack builder uses `npm ci` which requires exact package-lock.json matches. Using a custom Dockerfile allows `npm install --legacy-peer-deps` for alpha package compatibility. |
| **Node.js 22 Bookworm** | Uses `node:22-bookworm-slim` base image with Debian packages for native module compilation (hnswlib-node requires `build-essential`). |
| **SQLite over PostgreSQL** | Simplifies deployment with file-based database mounted on Railway's persistent volume. No separate database service required. |
| **Static UI Serving** | Frontend built at deploy time and served as static files by Express, eliminating need for separate CDN or frontend service. |
| **Self-Healing Startup** | `start-railway.sh` script handles knowledge base initialization and graceful restarts. |
| **Groq LLM Integration** | External API for LLM inference avoids GPU requirements on Railway. |
| **No package-lock.json** | Removed from repository to prevent npm ci failures with alpha package versions. |

---

## Deployment

### **Railway Deployment (Production)**

The application is deployed on Railway with automatic builds from the `main` branch using a custom Dockerfile.

#### **Build Configuration**

Railway uses a custom Dockerfile builder (configured via `railway.json`) which:
- Uses `npm install` instead of `npm ci` for alpha package compatibility
- Installs `build-essential` for native module compilation (hnswlib-node)
- Includes all Puppeteer and Sharp dependencies

```json
// railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

#### **Build Process**
```bash
# Defined in Dockerfile
npm install --legacy-peer-deps  # Allows alpha versions
cd src/ui && npm install && npm run build
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
   - Builds using Dockerfile
   - Runs `npm start`
   - Health check on `/health` endpoint

3. **Verify Deployment**
   - Check version badge in UI (top-left)
   - Test chat functionality
   - Verify knowledge base dashboard

---

## Local Development

### **Prerequisites**
- Node.js 22+
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

## Project Structure

```
Ask-Ruvnet/
├── src/
│   ├── server/
│   │   ├── app.js                 # Express server (main entry)
│   │   └── RuvPersona.js          # Professional technical persona
│   ├── ui/
│   │   ├── src/
│   │   │   ├── App.jsx            # Main React component
│   │   │   └── PDFPresentation.jsx
│   │   ├── public/assets/         # Static assets
│   │   └── dist/                  # Built UI (generated)
│   ├── core/                      # RAG enhancement modules
│   │   ├── RuvectorStore.js       # Knowledge base interface
│   │   ├── HybridSearch.js        # BM25 + semantic fusion
│   │   ├── QueryExpander.js       # Query expansion
│   │   ├── ReRanker.js            # Cross-encoder style reranking
│   │   ├── ContextCompressor.js   # Context optimization
│   │   └── MultiHopRetriever.js   # Complex query handling
│   └── connectors/                # Data source connectors
│       ├── GoogleDriveConnector.js
│       └── LocalDirectoryConnector.js
├── scripts/
│   ├── deployment/
│   │   └── start-railway.sh       # Railway startup script
│   └── ingestion/
│       ├── ingest_correct.js      # Main ingestion script
│       ├── check_repo_versions.js # Version checker utility
│       └── repo_knowledge.json    # Tracked repositories
├── .swarm/
│   └── memory.db                  # SQLite knowledge base
├── Dockerfile                     # Railway build configuration
├── railway.json                   # Railway builder settings
├── package.json                   # Dependencies + version
└── README.md                      # This file
```

---

## Configuration

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

### **Version Management**

**Single Source of Truth:** `/package.json`

The application version is stored in ONE place only - the root `package.json` file. The UI imports this version directly.

#### **Semantic Versioning (SemVer)**
```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Bug fixes, patches, small changes (e.g., 1.7.3 → 1.7.4)
  │     └──────── New features, backward compatible (e.g., 1.7.x → 1.8.0)
  └────────────── Breaking changes, major rewrites (e.g., 1.x.x → 2.0.0)
```

#### **How to Update Version**
```bash
# Edit package.json
{
  "name": "answerbot-builder",
  "version": "1.7.15",  # ← Update this
  ...
}

# Commit with version tag
git add package.json
git commit -m "VERSION: Bump to X.Y.Z - description"
git push origin main
```

#### **Where Version is Used**
- **package.json** (line 3) - Source of truth
- **UI Header** - Displays `v{version}` via import from package.json
- **README.md** - Documentation reference (update manually)

---

## Testing

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

## Current Status (v1.7.15)

### **Production Metrics**
- Server: Running
- Knowledge Base: 114,450 documents
- Active Repos: 7 (Ask-Ruvnet, agentic-flow, ruvector, ruvllm, claude-flow, neural-trader, agentic-synth)
- Uptime: 24/7
- Response Time: <2s average

### **Features**
- Chat with Groq LLM (llama-3.3-70b-versatile)
- Agentic Flow integration (v2.0.1-alpha.5) with HybridReasoningBank
- Knowledge base dashboard with repo tracking
- PDF presentation mode
- Repository version display with alpha/latest tracking
- Health monitoring
- Professional technical assistant persona (formal documentation style)

---

## Troubleshooting

### **Deployment Fails**
- Check Railway logs: `npx @railway/cli logs`
- Verify `GROQ_API_KEY` is set
- Ensure `npm run build` completes locally
- Verify Dockerfile is building correctly (uses `npm install` not `npm ci`)
- Check `railway.json` specifies `DOCKERFILE` builder

### **Knowledge Base Empty**
- Check persistent volume is mounted
- Verify `.swarm/memory.db` exists
- Re-run ingestion if needed

### **UI Not Loading**
- Verify `src/ui/dist/` was built
- Check Express static file serving in `app.js`
- Clear browser cache

---

## License

MIT

---

## Author

**rUVnet**
- GitHub: [@ruvnet](https://github.com/ruvnet)
- Production: https://ask-ruvnet-production.up.railway.app
