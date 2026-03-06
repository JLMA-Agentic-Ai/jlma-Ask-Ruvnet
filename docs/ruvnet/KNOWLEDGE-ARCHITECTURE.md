Updated: 2025-12-29 02:26:43 EST | Version 1.0.1
Created: 2025-12-29 02:17:58 EST

# RuvNet Knowledge Architecture

Complete reference for how RuvNet tool knowledge and domain knowledge are organized.

---

## Two-Layer Architecture

```
YOUR_PROJECT/.ruvector/
│
├── ruvnet-tools/     → ~/.claude/knowledge/ruvnet-kb/  (READ-ONLY)
│                        2,152 vectors of tool documentation
│                        HOW to use agentic tools
│                        SHARED across ALL your projects
│
└── domain/           → YOUR project's content (READ-WRITE)
                         Your business/domain-specific docs
                         100% ISOLATED per project
```

**Key Principle:**
- **Tool Knowledge** = HOW to build (universal, shared)
- **Domain Knowledge** = WHAT you're building (isolated per project)
- **NO cross-pollination** between layers

---

## File Locations

### Global Storage (Shared Across All Projects)

| Location | Purpose | Size |
|----------|---------|------|
| `~/.claude/knowledge/ruvnet-kb/` | Tool knowledge vectors | 3.2 MB |
| `~/.claude/commands/ruvnet-kb.md` | `/ruvnet-kb` command | 137 lines |
| `~/.claude/commands/ruvnet-stack.md` | `/ruvnet-stack` command | 419 lines |
| `~/.claude/commands/ruvnet-update.md` | `/ruvnet-update` command | 243 lines |
| `~/.claude/skills/ruvnet-knowledge-base.md` | Skill definition | 154 lines |
| `~/.claude/skills/ruvnet-ecosystem.md` | Ecosystem skill | 194 lines |
| `~/.claude/scripts/query-ruvnet-kb.js` | CLI query tool | 167 lines |
| `~/.claude/CLAUDE.md` | Global config (RuvNet section) | Section 5 |

### Project Storage (Per Project)

| Location | Purpose | Access |
|----------|---------|--------|
| `.ruvector/ruvnet-tools/` | Symlink to global tool KB | READ-ONLY |
| `.ruvector/domain/` | Your project's content | READ-WRITE |
| `docs/ruvnet/` | RuvNet documentation | Reference |

---

## Knowledge Base Contents

### Tool Knowledge (2,152 vectors)

| Topic | Vectors | Description |
|-------|---------|-------------|
| Agent System | 400+ | 150+ agent types, spawning patterns |
| Swarm Coordination | 300+ | Topologies, consensus protocols |
| Deployment | 250+ | Docker, Railway, K8s, air-gapped |
| Memory Systems | 200+ | Episodic, semantic, working memory |
| RL Algorithms | 200+ | Decision Transformer, Actor-Critic |
| Neural Features | 150+ | WASM SIMD, federated learning |
| Optimization | 150+ | Tiered compression, quantization |
| Core Packages | 500+ | ruvector, ruvllm, agentic-flow |

**Source Documentation:**
- 47 markdown files
- 36,949 total lines
- 38 tracked features at 100% coverage

---

## Commands Reference

### `/ruvnet-stack` — Full Ecosystem Install

**When to use:** New project or adding RuvNet to existing project

**What it does:**
1. Installs 5 npm packages (ruvector, ruvllm, agentic-synth, agentic-flow, ruflo)
2. Initializes ruflo
3. Creates two-layer knowledge architecture
4. Links tool knowledge (READ-ONLY)
5. Creates domain folder (READ-WRITE)
6. Copies documentation to `docs/ruvnet/`

### `/ruvnet-update` — Update Packages

**When to use:** Keep RuvNet packages current

**What it does:**
1. Checks installed versions against npm registry
2. Compares @latest vs @alpha versions
3. Installs updates automatically
4. Verifies knowledge architecture
5. Re-links tool knowledge if needed

### `/ruvnet-kb` — Link Knowledge Only

**When to use:** Need tool knowledge without installing packages

**What it does:**
1. Creates `.ruvector/domain/` folder
2. Creates symlink to global tool KB
3. Reports status

---

## Query Examples

```bash
# Search tool knowledge
node ~/.claude/scripts/query-ruvnet-kb.js "How do I spawn 150 agents?"

# Check status
node ~/.claude/scripts/query-ruvnet-kb.js --status

# Semantic search (requires Ollama)
node scripts/build-persistent-kb.js --query "Byzantine consensus configuration"
```

---

## Creating Domain Knowledge

Your project's content goes in `.ruvector/domain/`:

```javascript
const { RuvectorStore } = require('ruvector');

// Domain knowledge - isolated to THIS project
const domainKB = new RuvectorStore({
  dimension: 768,
  persistence: {
    enabled: true,
    path: '.ruvector/domain'
  }
});

// Add your domain docs
await domainKB.addDocument({
  id: 'my-doc-001',
  content: 'Your domain-specific content...',
  metadata: { category: 'your-category', source: 'your-source' }
});

// Query domain knowledge only
const results = await domainKB.search('your query', { limit: 5 });
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GLOBAL (Your Machine)                             │
│                                                                             │
│  ~/.claude/                                                                 │
│  ├── knowledge/ruvnet-kb/          ← Tool KB (2,152 vectors, 3.2 MB)       │
│  │   ├── vectors.bin                                                        │
│  │   ├── metadata.json                                                      │
│  │   └── manifest.json                                                      │
│  ├── commands/ruvnet-*.md          ← Slash commands                         │
│  ├── skills/ruvnet-*.md            ← Skill definitions                      │
│  ├── scripts/query-ruvnet-kb.js    ← CLI query tool                        │
│  └── CLAUDE.md                     ← Global config                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ symlinks
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT A (Retirement)                              │
│                                                                             │
│  retirement-planning/                                                       │
│  └── .ruvector/                                                             │
│      ├── ruvnet-tools/ ──────────► ~/.claude/knowledge/ruvnet-kb/          │
│      │                             (READ-ONLY, shared)                      │
│      └── domain/                   (READ-WRITE, isolated)                   │
│          ├── vectors.bin           ← Retirement docs only                   │
│          └── metadata.json                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT B (Bricksmith)                              │
│                                                                             │
│  bricksmith/                                                                │
│  └── .ruvector/                                                             │
│      ├── ruvnet-tools/ ──────────► ~/.claude/knowledge/ruvnet-kb/          │
│      │                             (READ-ONLY, shared)                      │
│      └── domain/                   (READ-WRITE, isolated)                   │
│          ├── vectors.bin           ← Bricksmith docs only                   │
│          └── metadata.json                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT C (Appeal Armor)                            │
│                                                                             │
│  appeal-armor/                                                              │
│  └── .ruvector/                                                             │
│      ├── ruvnet-tools/ ──────────► ~/.claude/knowledge/ruvnet-kb/          │
│      │                             (READ-ONLY, shared)                      │
│      └── domain/                   (READ-WRITE, isolated)                   │
│          ├── vectors.bin           ← Appeals docs only                      │
│          └── metadata.json                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sharing The Tool Knowledge Base

To share the RuvNet tool knowledge with someone else:

```bash
# 1. Zip the global knowledge base
cd ~/.claude/knowledge
zip -r ruvnet-kb.zip ruvnet-kb/

# 2. Send the zip file (3.2 MB)

# 3. Recipient extracts to same location
mkdir -p ~/.claude/knowledge
unzip ruvnet-kb.zip -d ~/.claude/knowledge/

# 4. Recipient runs /ruvnet-kb in their project
```

---

## Version Information

- **Tool Knowledge:** v1.0 (December 2025)
- **Vectors:** 2,152
- **Documentation:** 47 files, 36,949 lines
- **Coverage:** 38 features @ 100%

---

*This file is automatically copied to your project by `/ruvnet-stack` and `/ruvnet-update`.*
