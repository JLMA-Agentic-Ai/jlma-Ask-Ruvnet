---
name: ruvnet-kb-visual
version: 2.1.0
description: Build interactive 3D Knowledge Universe visualizations with quality scoring. Auto-enhances KB to 98+ score, watches for changes, and provides real-time rebuilds. Works with any ruvector-postgres knowledge base.
triggers:
  - kb visual
  - kb visualization
  - knowledge base visualization
  - kb universe
  - visualize kb
  - kb quality score
  - kb score
  - build kb visual
  - show kb
  - knowledge universe
category: ruvnet
created: 2025-12-30
updated: 2025-12-30
---

# RuvNet KB Visual

Build interactive 3D Knowledge Universe visualizations with automatic quality scoring, enhancement, and file watching.

## What This Does

1. **Generates Quality Score** - 5-dimension scoring (Coverage, Depth, Balance, Quality, Sources)
2. **Builds 3D Visualization** - Interactive tree with expand/collapse navigation
3. **Auto-Enhances KB** - Recursively improves until 98+ score reached
4. **File Watching** - Auto-rebuilds when documentation changes
5. **Takes Screenshots** - Playwright-powered documentation screenshots

---

## CRITICAL INSTRUCTION FOR CLAUDE

After running the bash commands below, you MUST:

### Step 1: Copy Global Templates (if not present)

Check if the project has KB visualization scripts. If not, copy from global templates:

```bash
# Check for scripts
ls scripts/kb-universe-data.js 2>/dev/null || echo "Scripts not found"

# If not found, copy them
mkdir -p scripts
cp ~/.claude/templates/kb-universe/*.js scripts/
```

### Step 2: Run KB Visualization Generator

```bash
node scripts/kb-universe-data.js
```

### Step 3: Analyze the Score Output

Parse the output for:
- **Overall Score**: Target 98+
- **Coverage**: Number of entries (target 500+)
- **Depth**: Category count (target 8-15)
- **Balance**: Distribution evenness
- **Quality**: Content richness
- **Sources**: Source diversity

### Step 4: Auto-Enhance if Score < 98

If score is below 98, run the auto-enhancer:

```bash
node scripts/kb-auto-enhance.js --target=98 --max-iterations=5
```

### Step 5: Report Results to User

Provide a summary showing:
- Current KB score with breakdown
- Number of items and categories
- Any recommendations for improvement
- Location of generated files

---

## Bash Commands

Run these commands to build KB visualization:

```bash
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RUVNET KB VISUAL v2.1                               ║"
echo "║           (Knowledge Universe Visualization)                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# STEP 1: Check for ruvector-postgres
echo "🗄️  Checking ruvector-postgres connection..."
if command -v docker &> /dev/null; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
    echo "   ✅ ruvector-kb container running"
    PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p 5435 -U postgres -d postgres -c "SELECT 1" > /dev/null 2>&1 && \
      echo "   ✅ Database connection successful" || \
      echo "   ❌ Database connection failed"
  else
    echo "   ❌ ruvector-kb container not running"
    echo "   Run: docker start ruvector-kb"
    echo "   Or create: docker run -d --name ruvector-kb -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} -p 5435:5432 ruvnet/ruvector-postgres:latest"
  fi
else
  echo "   ⚠️  Docker not found - checking direct connection..."
  PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p 5435 -U postgres -d postgres -c "SELECT 1" > /dev/null 2>&1 && \
    echo "   ✅ Database connection successful" || \
    echo "   ❌ Database connection failed"
fi
echo ""

# STEP 2: Check for KB visualization scripts
echo "📁 Checking KB visualization scripts..."
SCRIPTS_DIR="./scripts"
TEMPLATES_DIR="$HOME/.claude/templates/kb-universe"

REQUIRED_SCRIPTS=("kb-universe-data.js" "kb-auto-enhance.js" "kb-file-watcher.js" "ingest-docs-to-kb.js")
MISSING=0

for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ -f "$SCRIPTS_DIR/$script" ]; then
    echo "   ✅ $script"
  elif [ -f "$TEMPLATES_DIR/$script" ]; then
    echo "   ⬇️  $script - copying from global templates..."
    mkdir -p "$SCRIPTS_DIR"
    cp "$TEMPLATES_DIR/$script" "$SCRIPTS_DIR/"
    chmod +x "$SCRIPTS_DIR/$script"
    echo "   ✅ $script (copied)"
  else
    echo "   ❌ $script - NOT FOUND"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo "   ⚠️  Some scripts missing. Ensure ~/.claude/templates/kb-universe/ exists."
fi
echo ""

# STEP 3: Check KB entry count
echo "📊 Checking KB status..."
SCHEMA="${KB_SCHEMA:-ask_ruvnet}"
TABLE="${KB_TABLE:-architecture_docs}"

COUNT=$(PGPASSWORD=${POSTGRES_PASSWORD} psql -h localhost -p 5435 -U postgres -d postgres -t -c \
  "SELECT COUNT(*) FROM ${SCHEMA}.${TABLE};" 2>/dev/null | tr -d ' ')

if [ -n "$COUNT" ] && [ "$COUNT" != "" ]; then
  echo "   📦 KB Entries: $COUNT"
  echo "   📂 Schema: ${SCHEMA}.${TABLE}"
else
  echo "   ⚠️  Could not query KB. Check schema/table configuration."
  echo "   Set KB_SCHEMA and KB_TABLE environment variables if needed."
fi
echo ""

# STEP 4: Generate visualization
echo "🎨 Generating KB visualization..."
if [ -f "$SCRIPTS_DIR/kb-universe-data.js" ]; then
  node "$SCRIPTS_DIR/kb-universe-data.js" 2>&1
else
  echo "   ❌ kb-universe-data.js not found"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔍 CLAUDE: Check the score above. If < 98, run auto-enhance:"
echo "   node scripts/kb-auto-enhance.js --target=98"
echo ""
```

---

## After Bash: Claude's Required Actions

1. **CHECK** the generated score in the output above
2. **IF score < 98**: Run `node scripts/kb-auto-enhance.js --target=98`
3. **VERIFY** files generated:
   - `public/kb-universe-data.json` (visualization data)
   - Check file size (should be 500KB+ for good KB)
4. **REPORT** to user:
   - Overall score with grade (A+, A, B+, etc.)
   - Score breakdown by dimension
   - Total items and categories
   - Any recommendations

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KB_SCHEMA` | `ask_ruvnet` | PostgreSQL schema name |
| `KB_TABLE` | `architecture_docs` | Table name |
| `KB_HOST` | `localhost` | Database host |
| `KB_PORT` | `5435` | Database port |
| `KB_PASSWORD` | `${POSTGRES_PASSWORD}` | Database password |

---

## Scoring System

| Dimension | Weight | Optimal |
|-----------|--------|---------|
| Coverage | 25% | 500-2000 entries |
| Depth | 15% | 8-15 categories |
| Balance | 15% | Even distribution |
| Quality | 30% | Rich content (>200 chars avg) |
| Sources | 15% | Diverse file sources |

### Score Grades
- **A+ (98-100)**: Production ready, exceptional KB
- **A (95-97)**: Excellent with minor improvements
- **A- (90-94)**: Very good KB
- **B+ (85-89)**: Good KB, some gaps
- **B (80-84)**: Adequate KB
- **C (70-79)**: Needs improvement

---

## Additional Commands

### Auto-Enhancement Loop
```bash
# Run until score reaches target (default 98)
node scripts/kb-auto-enhance.js --target=98 --max-iterations=10
```

### File Watcher (Development)
```bash
# Watch docs/ and data/ for changes, auto-rebuild
node scripts/kb-file-watcher.js --watch-dirs=docs,data --debounce=5000
```

### Ingest Documentation
```bash
# Ingest all .md files from docs/ and data/
node scripts/ingest-docs-to-kb.js
```

### Score Only (Fast Check)
```bash
# Quick score check without regenerating visualization
node scripts/kb-universe-data.js --score-only
```

---

## Global Templates Location

```
~/.claude/templates/kb-universe/
├── kb-universe-data.js      # Core visualization generator
├── kb-auto-enhance.js       # Auto-enhancement loop
├── kb-file-watcher.js       # File change watcher
└── ingest-docs-to-kb.js     # Documentation ingester
```

---

## Related Skills

- `/ruvnet-stack` - Install full RuvNet ecosystem from scratch
- `/ruvnet-update` - Update packages and validate KB compliance
- `/ruvnet-kb` - Link the RuvNet tool knowledge base to current project
- `/ruvnet-kb-visual` - Build KB visualization (this skill)

---

## Memory Key

`tools/ruvnet-kb-visual` in claude-flow namespace `tools`
