Updated: 2025-12-30 10:15:00 EST | Version 2.0.0
Created: 2025-12-30 10:05:00 EST

# RuvNet Skills & Commands - Installation Guide

This folder contains everything needed to add RuvNet AI capabilities to your private Claude Code environment.

## 📁 Folder Contents

```
shareable-skills/
├── README.md              ← YOU ARE HERE
├── skills/                ← Claude Code skills (triggers)
│   ├── ruvnet-stack.md    # /ruvnet-stack - Full ecosystem install
│   ├── ruvnet-update.md   # /ruvnet-update - Update packages
│   └── ruvnet-kb-visual.md # /ruvnet-kb-visual - KB visualization
├── commands/              ← Claude Code commands (if any)
└── scripts/               ← Supporting scripts (copy to project)
    ├── kb-universe-data.js      # Generates KB JSON
    ├── build-kb-universe.js     # Build orchestrator
    ├── kb-universe-screenshot.js # Playwright screenshots
    └── kb-universe-template.html # Visualization template
```

## 🚀 Quick Installation (5 minutes)

### Step 1: Install Skills

```bash
# Create Claude skills directory (if it doesn't exist)
mkdir -p ~/.claude/skills

# Copy all skill files
cp skills/*.md ~/.claude/skills/

# Verify
ls ~/.claude/skills/
# Should show: ruvnet-stack.md, ruvnet-update.md, ruvnet-kb-visual.md
```

### Step 2: Restart Claude Code

```bash
# Either close and reopen Claude Code, or run:
claude --version
```

### Step 3: Test Installation

In Claude Code, type `/` and you should see:
- `/ruvnet-stack` - Install RuvNet ecosystem
- `/ruvnet-update` - Update packages
- `/ruvnet-kb-visual` - Build KB visualization

## 📋 Detailed Installation

### Understanding Claude Code Locations

| Item | Location | Purpose |
|------|----------|---------|
| Skills | `~/.claude/skills/` | Triggered with `/skillname` |
| Commands | `~/.claude/commands/` | Custom slash commands |
| Knowledge | `~/.claude/knowledge/` | Reference documentation |
| Global config | `~/.claude/CLAUDE.md` | Global instructions |

### Install All Skills

```bash
# Navigate to this directory
cd docs/shareable-skills

# Copy all skills
cp skills/*.md ~/.claude/skills/

# Copy KB pattern documentation (recommended)
mkdir -p ~/.claude/knowledge/kb-patterns
cp -r ../kb-patterns/* ~/.claude/knowledge/kb-patterns/
```

### Install Scripts to a New Project

When starting a new project that needs KB visualization:

```bash
# From your new project root
mkdir -p scripts public

# Copy visualization scripts
cp /path/to/shareable-skills/scripts/kb-universe-data.js scripts/
cp /path/to/shareable-skills/scripts/build-kb-universe.js scripts/
cp /path/to/shareable-skills/scripts/kb-universe-screenshot.js scripts/
cp /path/to/shareable-skills/scripts/kb-universe-template.html public/

# Add npm scripts to package.json
npm pkg set scripts.kb:visual="node scripts/build-kb-universe.js"
npm pkg set scripts.kb:visual:screenshot="node scripts/build-kb-universe.js --screenshot"
```

## 🔧 What Each Skill Does

### `/ruvnet-stack`

**Installs the complete RuvNet AI ecosystem:**

- ✅ Starts ruvector-postgres Docker container
- ✅ Creates isolated database schema for your project
- ✅ Installs claude-flow (enterprise orchestration)
- ✅ Installs agentic-flow (150+ agents)
- ✅ Installs ruvector (vector database)
- ✅ Installs @ruvector/ruvllm (LLM orchestration)
- ✅ Installs @ruvector/agentic-synth (synthetic data)
- ✅ Copies KB visualization scripts
- ✅ Initializes claude-flow

**When to use:** Starting any new AI/agent project.

### `/ruvnet-update`

**Checks and updates RuvNet packages:**

- ✅ Verifies Docker containers are running
- ✅ Compares @latest vs @alpha versions
- ✅ Shows what's outdated
- ✅ Installs updates automatically

**When to use:** Periodically, or when you need latest features.

### `/ruvnet-kb-visual`

**Builds interactive Knowledge Universe visualization:**

- ✅ Reads data from ruvector-postgres or local storage
- ✅ Generates JSON hierarchy
- ✅ Creates interactive 3D visualization
- ✅ Optional Playwright screenshots

**When to use:** After populating your KB, to visualize it.

## 📦 Prerequisites

Before using these skills, ensure you have:

```bash
# Node.js 18+
node --version  # Should be v18.x or higher

# Docker Desktop (for ruvector-postgres)
docker --version

# npm
npm --version
```

## 🔍 Troubleshooting

### Skills Not Appearing

1. **Check file location:**
   ```bash
   ls ~/.claude/skills/*.md
   ```

2. **Check file permissions:**
   ```bash
   chmod 644 ~/.claude/skills/*.md
   ```

3. **Verify file format:**
   ```bash
   head -1 ~/.claude/skills/ruvnet-stack.md
   # Should show: Updated: YYYY-MM-DD...
   ```

4. **Restart Claude Code**

### Docker Not Running

```bash
# Start Docker Desktop, then:
docker ps
# Should show running containers

# If ruvector-postgres isn't running:
docker start ruvector-kb
# Or create it:
docker run -d --name ruvector-kb \
  --restart=always \
  -e POSTGRES_PASSWORD=guruKB2025 \
  -p 5435:5432 \
  ruvnet/ruvector-postgres:latest
```

### KB Visualization Empty

1. **Check if KB has data:**
   ```bash
   npm run kb:status
   ```

2. **Ingest content first:**
   ```bash
   npm run kb:ingest
   ```

3. **Manually build visualization:**
   ```bash
   node scripts/build-kb-universe.js
   ```

### Screenshots Failing

```bash
# Install Playwright
npm install playwright --save-dev
npx playwright install chromium

# Then retry
npm run kb:visual:screenshot
```

## 🔗 Integration with Global CLAUDE.md

Add to your `~/.claude/CLAUDE.md`:

```markdown
## RuvNet Skills Available

### /ruvnet-stack
Install complete RuvNet AI ecosystem including:
- ruvector-postgres (vector DB)
- claude-flow (orchestration)
- agentic-flow (150+ agents)
- KB visualization tools

### /ruvnet-update
Check and update RuvNet packages.

### /ruvnet-kb-visual
Build interactive Knowledge Universe visualization.
```

## 📚 Related Documentation

After installation, also copy the KB patterns documentation:

```bash
mkdir -p ~/.claude/knowledge/kb-patterns
cp -r ../kb-patterns/* ~/.claude/knowledge/kb-patterns/
```

This gives Claude Code reference material on:
- How to build knowledge bases
- Anti-simplification patterns
- Agent integration
- Production deployment

## 🤝 Support

- Repository: https://github.com/ruvnet/ask-ruvnet
- Claude Flow: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/ask-ruvnet/issues

---

**Version 2.0.0** - Added KB visualization, comprehensive installation guide, and troubleshooting.
