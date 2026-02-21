---
name: ruvnet-update
version: 2.1.0
description: Check for and install the latest RuvNet ecosystem packages, sync KB architecture patterns, and ensure compliance. Use when user asks about updating RuvNet, checking package versions, or KB pattern compliance.
triggers:
  - update ruvnet
  - ruvnet update
  - check ruvnet packages
  - ruvnet versions
  - kb patterns
  - knowledge base compliance
  - check packages
  - update packages
category: ruvnet
created: 2025-12-29
updated: 2025-12-30
---

# RuvNet Update

Check for and install the latest RuvNet ecosystem packages, sync KB architecture patterns, and ensure compliance.

## What This Does

1. **Syncs** RuvNet Knowledgebase Patterns documentation
2. **READS AND INTERNALIZES** all KB pattern documents (MANDATORY)
3. **Checks** ruvector-postgres Docker container status
4. **Checks** all installed RuvNet packages against npm registry
5. **Installs** updates with your confirmation
6. **Validates** that KB architecture follows the patterns

---

## CRITICAL INSTRUCTION FOR CLAUDE

After running the bash commands below, you MUST:

### Step 1: Read ALL KB Pattern Documents (IN ORDER)

```
docs/ruvnet-knowledgebase-patterns/README.md
docs/ruvnet-knowledgebase-patterns/knowledge-base-patterns.md
docs/ruvnet-knowledgebase-patterns/kb-construction.md
docs/ruvnet-knowledgebase-patterns/kb-agent-integration.md
docs/ruvnet-knowledgebase-patterns/kb-production.md
```

Use the Read tool to read each file. These are INTERCONNECTED - reading only one is INSUFFICIENT.

### Step 2: Internalize The Golden Rule

```
Agents MUST query the KB for EVERY question.
Agents MUST NOT simplify KB into rules.
Agents MUST cite sources in EVERY response.
```

### Step 3: Validate Project Compliance

After reading, check if this project:
- Has a knowledge base configured (check for `knowledge-base/` or `.ruvector/` or postgres KB)
- Implements `EnforcedKBAccess` wrapper (if it has agents)
- Follows anti-simplification patterns
- Has the Knowledge Universe visualization (`public/knowledge-universe.html`)

### Step 4: Report Findings

Provide a compliance report showing:
- What's properly configured
- What needs attention
- What's missing or wrong

---

## Bash Commands

Run these commands to sync patterns and check packages:

```bash
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RUVNET UPDATE CHECK v2.1                            ║"
echo "║           (KB Patterns + Packages + Compliance)               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# STEP 1: Sync ruvnet-knowledgebase-patterns documentation (MANDATORY)
echo "📚 Syncing RuvNet Knowledgebase Patterns..."
KB_PATTERNS_SRC="$HOME/.claude/docs/ruvnet-knowledgebase-patterns"
KB_PATTERNS_DEST="./docs/ruvnet-knowledgebase-patterns"

if [ -d "$KB_PATTERNS_SRC" ]; then
  mkdir -p "$KB_PATTERNS_DEST"
  cp -r "$KB_PATTERNS_SRC"/* "$KB_PATTERNS_DEST/"
  FILE_COUNT=$(ls -1 "$KB_PATTERNS_DEST"/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "   ✅ Synced $FILE_COUNT documents to docs/ruvnet-knowledgebase-patterns/"
  echo ""
  echo "   ╔════════════════════════════════════════════════════════════╗"
  echo "   ║  CLAUDE: You MUST now READ all files in this folder!       ║"
  echo "   ║  Use the Read tool on each .md file before continuing.     ║"
  echo "   ╚════════════════════════════════════════════════════════════╝"
else
  echo "   ⚠️  Global patterns not found at ~/.claude/docs/ruvnet-knowledgebase-patterns"
  echo "   Run /ruvnet-update from Ask-Ruvnet project first to populate global patterns"
fi
echo ""

# STEP 2: Check ruvector-postgres container
echo "🗄️  Checking ruvector-postgres (MANDATORY for knowledge bases)..."
if command -v docker &> /dev/null; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
    echo "   ✅ ruvector-kb container running on port 5435"
    docker ps --filter "name=ruvector-kb" --format "   Status: {{.Status}}" 2>/dev/null
  elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
    echo "   ⚠️  ruvector-kb container exists but stopped. Starting..."
    docker start ruvector-kb
    echo "   ✅ ruvector-kb started"
  else
    echo "   ❌ ruvector-kb container NOT found"
    echo ""
    echo "   CRITICAL: Run this to create the knowledge base container:"
    echo "   docker run -d --name ruvector-kb \\"
    echo "     -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \\"
    echo "     -p 5435:5432 \\"
    echo "     ruvnet/ruvector-postgres:latest"
  fi
else
  echo "   ❌ Docker not installed. Required for ruvector-postgres."
fi
echo ""

# STEP 3: Check RuvNet packages
echo "📦 Checking RuvNet package versions..."
if [ -f package.json ]; then
  PACKAGES=("ruvector" "@ruvector/ruvllm" "@ruvector/agentic-synth" "agentic-flow" "claude-flow")

  for pkg in "${PACKAGES[@]}"; do
    local_ver=$(node -e "
      try {
        const p = require('./package.json');
        const deps = {...(p.dependencies || {}), ...(p.devDependencies || {})};
        const v = deps['$pkg'];
        if (v) console.log(v.replace(/^[\^~]/, ''));
        else console.log('not-installed');
      } catch(e) { console.log('not-installed'); }
    " 2>/dev/null)

    if [ "$local_ver" != "not-installed" ] && [ -n "$local_ver" ]; then
      latest_ver=$(npm view "${pkg}@latest" version 2>/dev/null || echo "unknown")
      if [ "$local_ver" = "$latest_ver" ]; then
        echo "   ✅ $pkg@$local_ver (up to date)"
      else
        echo "   ⬆️  $pkg: $local_ver → $latest_ver available"
      fi
    fi
  done
else
  echo "   ⚠️  No package.json found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔍 CLAUDE: Now READ the KB pattern documents and validate compliance!"
echo ""
```

---

## After Bash: Claude's Required Actions

1. **READ** each file in `docs/ruvnet-knowledgebase-patterns/` using the Read tool
2. **UNDERSTAND** the anti-simplification patterns and Golden Rule
3. **CHECK** if this project has a KB and if it follows the patterns
4. **REPORT** compliance status to the user

## Related Skills

- `/ruvnet-stack` - Install full RuvNet ecosystem from scratch
- `/ruvnet-update` - Update packages and validate KB compliance (this skill)
- `/ruvnet-kb` - Link the RuvNet knowledge base to current project
- `/ruvnet-kb-visual` - Build KB visualization with quality scoring
