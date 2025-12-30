Updated: 2025-12-30 10:45:00 EST | Version 3.0.0
Created: 2025-12-30 10:05:00 EST

# RuvNet Skills & Commands - Installation Guide

This folder contains everything needed to add RuvNet AI capabilities to your private Claude Code environment.

## What Changed in v3.0.0

**Skills are now directory-based with YAML frontmatter for maximum power:**

- **Triggers**: Skills auto-activate when you mention related topics
- **YAML frontmatter**: Name, version, description, triggers defined at top
- **Directory structure**: `skill-name/SKILL.md` instead of flat `skill-name.md`
- **Registered in skills-index.json**: Proper indexing with metadata

## Folder Contents

```
shareable-skills/
├── README.md                    ← YOU ARE HERE
├── skills/                      ← Claude Code skills (directory-based)
│   ├── ruvnet-stack/            # /ruvnet-stack - Full ecosystem install
│   │   └── SKILL.md             # Main skill file with YAML frontmatter
│   ├── ruvnet-update/           # /ruvnet-update - Update packages
│   │   └── SKILL.md             # Main skill file with YAML frontmatter
│   └── ruvnet-kb-visual.md      # /ruvnet-kb-visual - KB visualization
├── commands/                    ← Claude Code commands (if any)
└── scripts/                     ← Supporting scripts (copy to project)
    ├── kb-universe-data.js      # Generates KB JSON with scoring
    ├── build-kb-universe.js     # Build orchestrator
    ├── kb-universe-screenshot.js # Playwright screenshots
    ├── test-kb-universe.js      # Verification test (MANDATORY)
    ├── test-kb-navigation.js    # Navigation test
    └── kb-universe-template.html # Visualization template (v3.0.0)
```

## Quick Installation (5 minutes)

### Step 1: Install Skills (Directory-Based)

```bash
# Create Claude skills directory (if it doesn't exist)
mkdir -p ~/.claude/skills

# Copy directory-based skills (preserves structure)
cp -r skills/ruvnet-stack ~/.claude/skills/
cp -r skills/ruvnet-update ~/.claude/skills/

# Copy flat skills (older format, still works)
cp skills/*.md ~/.claude/skills/ 2>/dev/null || true

# Verify
ls ~/.claude/skills/
# Should show directories: ruvnet-stack, ruvnet-update
# And files: ruvnet-kb-visual.md
```

### Step 2: Restart Claude Code

```bash
# Either close and reopen Claude Code, or start a new conversation
claude --version
```

### Step 3: Test Installation

In Claude Code, type `/` and you should see:
- `/ruvnet-stack` - Install RuvNet ecosystem
- `/ruvnet-update` - Update packages
- `/ruvnet-kb-visual` - Build KB visualization

**Trigger test:** Just mention "update ruvnet packages" and Claude should auto-suggest `/ruvnet-update`.

## Understanding the New Skill Format

### Directory Structure (Recommended)

```
~/.claude/skills/
├── ruvnet-update/
│   └── SKILL.md              # Main skill with YAML frontmatter
├── ruvnet-stack/
│   └── SKILL.md              # Main skill with YAML frontmatter
└── older-skill.md            # Flat file (still works)
```

### YAML Frontmatter (in SKILL.md)

```yaml
---
name: ruvnet-update
version: 2.1.0
description: Check for and install the latest RuvNet packages...
triggers:
  - update ruvnet
  - ruvnet update
  - check packages
category: ruvnet
created: 2025-12-29
updated: 2025-12-30
---

# Skill Content Below...
```

### Why Directory-Based?

| Feature | Flat `.md` | Directory-Based |
|---------|------------|-----------------|
| Auto-triggers | No | Yes (via YAML) |
| Supporting files | No | Yes (scripts, templates) |
| Version tracking | Manual | In frontmatter |
| Index registration | Optional | Automatic |

## Detailed Installation

### Understanding Claude Code Locations

| Item | Location | Purpose |
|------|----------|---------|
| Skills | `~/.claude/skills/` | Triggered with `/skillname` or auto-triggered |
| Commands | `~/.claude/commands/` | Custom slash commands |
| Knowledge | `~/.claude/knowledge/` | Reference documentation |
| Skills Index | `~/.claude/skills-index.json` | Skill metadata and triggers |
| Global config | `~/.claude/CLAUDE.md` | Global instructions |

### Install All Skills

```bash
# Navigate to this directory
cd docs/shareable-skills

# Copy directory-based skills
cp -r skills/ruvnet-stack ~/.claude/skills/
cp -r skills/ruvnet-update ~/.claude/skills/

# Copy flat skills
cp skills/*.md ~/.claude/skills/ 2>/dev/null || true

# Copy KB pattern documentation (recommended)
mkdir -p ~/.claude/docs/ruvnet-knowledgebase-patterns
cp -r ../ruvnet-knowledgebase-patterns/* ~/.claude/docs/ruvnet-knowledgebase-patterns/
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

## What Each Skill Does

### `/ruvnet-stack` (v2.1.0)

**Installs the complete RuvNet AI ecosystem:**

- Syncs RuvNet Knowledgebase Patterns (MANDATORY)
- Instructs Claude to READ and INTERNALIZE all KB patterns
- Starts ruvector-postgres Docker container
- Creates isolated database schema for your project
- Installs claude-flow (enterprise orchestration)
- Installs agentic-flow (150+ agents)
- Installs ruvector (vector database)
- Installs @ruvector/ruvllm (LLM orchestration)
- Installs @ruvector/agentic-synth (synthetic data)
- Initializes claude-flow with agents and skills
- Validates KB architecture compliance

**Triggers:** "install ruvnet", "setup agents", "agent orchestration", "ruvnet ecosystem"

**When to use:** Starting any new AI/agent project.

### `/ruvnet-update` (v2.1.0)

**Checks and updates RuvNet packages:**

- Syncs RuvNet Knowledgebase Patterns
- Instructs Claude to READ and INTERNALIZE all KB patterns
- Verifies Docker containers are running
- Compares @latest vs @alpha versions
- Shows what's outdated
- Validates KB architecture compliance

**Triggers:** "update ruvnet", "check packages", "kb patterns", "knowledge base compliance"

**When to use:** Periodically, or when you need latest features.

### `/ruvnet-kb-visual`

**Builds interactive Knowledge Universe visualization with quality scoring:**

- Reads data from ruvector-postgres or local storage
- Generates JSON hierarchy with KB scoring (v2.1.0)
- Creates interactive 3D visualization with Bricksmith-inspired navigation
- **KB Score Dashboard** (1-100 scale across 5 dimensions)
- **Standard Academic Grading** (67 = D+, not B-)
- **Enhancement Recommendations** with priority levels
- **Playwright Verification** - ALWAYS test before reporting success

**When to use:** After populating your KB, to visualize and assess quality.

## Prerequisites

Before using these skills, ensure you have:

```bash
# Node.js 18+
node --version  # Should be v18.x or higher

# Docker Desktop (for ruvector-postgres)
docker --version

# npm
npm --version
```

## Troubleshooting

### Skills Not Appearing

1. **Check directory structure:**
   ```bash
   ls -la ~/.claude/skills/ruvnet-update/
   # Should show: SKILL.md
   ```

2. **Check file permissions:**
   ```bash
   chmod -R 644 ~/.claude/skills/
   ```

3. **Verify YAML frontmatter:**
   ```bash
   head -20 ~/.claude/skills/ruvnet-update/SKILL.md
   # Should show: ---\nname: ruvnet-update...
   ```

4. **Start a new conversation** (skills load at session start)

### Triggers Not Working

1. **Check skills-index.json:**
   ```bash
   cat ~/.claude/skills-index.json | grep ruvnet
   ```

2. **Ensure triggers are defined in frontmatter**

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

## Integration with Global CLAUDE.md

Add to your `~/.claude/CLAUDE.md`:

```markdown
## RuvNet Skills Available

### /ruvnet-stack
Install complete RuvNet AI ecosystem including:
- ruvector-postgres (vector DB)
- claude-flow (orchestration)
- agentic-flow (150+ agents)
- KB visualization tools

**Triggers:** "install ruvnet", "setup agents", "ruvnet ecosystem"

### /ruvnet-update
Check and update RuvNet packages, sync KB patterns.

**Triggers:** "update ruvnet", "check packages", "kb patterns"

### /ruvnet-kb-visual
Build interactive Knowledge Universe visualization.
```

## Related Documentation

After installation, the KB patterns documentation should be at:

```bash
~/.claude/docs/ruvnet-knowledgebase-patterns/
```

This gives Claude Code reference material on:
- How to build knowledge bases
- Anti-simplification patterns (Golden Rule)
- Agent integration
- Production deployment

## Support

- Repository: https://github.com/ruvnet/ask-ruvnet
- Claude Flow: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/ask-ruvnet/issues

---

**Version 3.0.0** - Directory-based skills with YAML frontmatter, auto-triggers, proper skills-index.json registration. Removed command duplicates.
