Updated: 2025-12-29 02:26:43 EST | Version 1.0.1
Created: 2025-12-29 02:17:58 EST

# RuvNet Knowledge Base (`/ruvnet-kb`)

## What This Command Does

Links the **RuvNet Tool Knowledge** to your project as a READ-ONLY reference layer. This gives you expert knowledge about HOW to use the agentic tools, completely separate from your project's domain-specific content.

## Two-Layer Architecture

```
YOUR_PROJECT/.ruvector/
│
├── ruvnet-tools/     → ~/.claude/knowledge/ruvnet-kb/  (READ-ONLY)
│                        Expert docs on HOW to use the tools
│                        Shared across ALL your projects
│
└── domain/           → Your project's content (READ-WRITE)
                         Retirement planning, business docs, etc.
                         100% isolated to THIS project only
```

**Why This Matters:**
- ✅ Retirement project queries "401k limits" → searches domain/ only
- ✅ Retirement project queries "spawn agents" → searches ruvnet-tools/ only
- ✅ No cross-pollination between projects
- ✅ Tool knowledge stays clean and universal

## What's In The Tool Knowledge Base

| Content | Size |
|---------|------|
| **2,152 vectors** | 768-dimensional embeddings (nomic-embed-text) |
| **47 documentation files** | 36,949 lines of expert-level docs |
| **38 tracked features** | 100% coverage score |
| **Total size** | 3.2 MB (vectors.bin + metadata.json) |

### Topics Covered (Tool Knowledge Only)

| Category | What You Can Ask |
|----------|------------------|
| **Core Packages** | How to use ruvector, ruvllm, agentic-flow, ruflo |
| **Agent System** | How to spawn 150+ agent types, parallel execution |
| **Orchestration** | How to configure hive-mind, consensus protocols |
| **AI/ML** | How to implement Decision Transformer, Actor-Critic |
| **Deployment** | How to deploy to Docker, Railway, Kubernetes |
| **Optimization** | How to use WASM SIMD, tiered compression |

## When To Use This Command

Run `/ruvnet-kb` when you need:
- Access to RuvNet tool documentation in your project
- To query "how do I use X?" for any agentic tool
- Expert guidance on agent spawning, swarm patterns, etc.

**This does NOT touch your domain knowledge.** Your retirement planning, business docs, etc. stay completely isolated.

## What Happens When You Run It

```bash
# 1. Creates .ruvector directory structure
mkdir -p .ruvector/domain

# 2. Links tool knowledge (READ-ONLY)
ln -s ~/.claude/knowledge/ruvnet-kb .ruvector/ruvnet-tools

# 3. Reports status
echo "✅ Tool knowledge: 2,152 vectors (ruvnet-tools/)"
echo "📁 Domain knowledge: .ruvector/domain/ (your content)"
```

## Storage Architecture

| Location | Purpose | Access |
|----------|---------|--------|
| `~/.claude/knowledge/ruvnet-kb/` | Global tool knowledge (source) | READ-ONLY |
| `.ruvector/ruvnet-tools/` | Symlink to global tool knowledge | READ-ONLY |
| `.ruvector/domain/` | YOUR project's content | READ-WRITE |

## Creating Your Domain Knowledge Base

Your project's domain-specific content goes in `.ruvector/domain/`:

```javascript
const { RuvectorStore } = require('ruvector');

// Domain knowledge - isolated to this project
const domainKB = new RuvectorStore({
  dimension: 768,
  persistence: {
    enabled: true,
    path: '.ruvector/domain'  // YOUR content goes here
  }
});

// Add retirement planning docs (example)
await domainKB.addDocument({
  id: 'retirement-401k-2025',
  content: '2025 401k contribution limit is $23,500...',
  metadata: { category: 'retirement', year: 2025 }
});
```

## Querying Both Layers

```javascript
// Query tool knowledge: "How do I spawn agents?"
const toolResults = await queryRuvnetTools('parallel agent spawning');

// Query domain knowledge: "What's the 401k limit?"
const domainResults = await domainKB.search('401k contribution limit');

// They NEVER mix - completely isolated
```

## Related Commands

| Command | What It Does |
|---------|--------------|
| `/ruvnet-stack` | Full install + links tool knowledge |
| `/ruvnet-update` | Update packages + verify tool link |
| `/ruvnet-kb` | Link tool knowledge only (this command) |

## Key Principle

**Tool Knowledge = HOW to build** (universal, shared)
**Domain Knowledge = WHAT you're building** (project-specific, isolated)

Your Retirement project, Bricksmith project, and Appeal Armor project all share the same tool knowledge but have completely separate domain knowledge bases.

---

*RuvNet Tool Knowledge v1.0 - December 2025*
*2,152 vectors | 47 docs | 38 features @ 100%*
