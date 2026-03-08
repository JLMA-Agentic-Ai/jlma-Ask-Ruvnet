Updated: 2025-12-30 14:00:00 EST | Version 3.3.0
Created: 2025-12-30 11:40:00 EST

# RuvNet KB Visual Skill

## Skill Overview

**Name:** `/ruvnet-kb-visual` (Knowledge Base Visualization)
**Purpose:** Build interactive 3D Knowledge Universe visualization from ruvector-postgres data with embedded HTML output.

---

## What This Does

1. **Auto-discovers schema tables** - Scans `information_schema` to find ALL tables
2. **Queries all content tables** - Pulls data from any table with title/content columns
3. **Content-based categorization** - Detects RuvNet ecosystem components
4. **Generates quality score** - 5-dimension scoring (Coverage, Depth, Balance, Quality, Sources)
5. **Builds HTML with embedded data** - Named `{ProjectName}-kb-visualization.html`
6. **AUTO-OPENS in browser** - Immediate visual feedback (use `--no-open` to disable)

---

## How Knowledge is Stored

### Schema Structure (Auto-Discovered)

The skill does **NOT** require a specific table structure. It:

1. **Queries `information_schema.tables`** to find all tables in your schema
2. **Queries `information_schema.columns`** to understand each table's structure
3. **Maps columns intelligently:**

| Expected Column | Recognized Alternatives |
|-----------------|------------------------|
| `id` | Any column ending in `_id` |
| `title` | `name`, `hook_name`, `template_name`, `post_type`, `cta_type` |
| `content` | `description`, `template`, `hook_template`, `cta_template`, `body`, `text` |
| `source` | `file_path`, `category`, `platform`, `hook_category` |
| `type` | `category`, `platform`, `status` |

### Example: Project with Specialized Tables

```
viral_social schema:
├── hooks_templates (hook_name, template, category)  → ✓ queried
├── post_types (post_type, description, platform)    → ✓ queried
├── cta_templates (cta_type, cta_template, category) → ✓ queried
└── file_tracking (path, hash, size)                 → ⏭️ skipped (no content)
```

### Example: Project with Standard Table

```
ask_ruvnet schema:
├── architecture_docs (title, content, file_path)    → ✓ queried
└── file_tracking (path, hash, size)                 → ⏭️ skipped (no content)
```

---

## Bash Commands

```bash
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RUVNET KB VISUAL v3.3                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check for ruvector-postgres
echo "🗄️  Checking ruvector-postgres connection..."
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
  echo "   ✅ ruvector-kb container running on port 5435"
else
  echo "   ❌ ruvector-kb not running"
  echo "   Run: docker start ruvector-kb"
  exit 1
fi

# Build visualization - auto-discovers tables, generates HTML, opens browser
echo ""
echo "🎨 Building KB visualization..."
if [ -f "scripts/build-kb-universe.js" ]; then
  node scripts/build-kb-universe.js
  # Script auto-opens browser (use --no-open to disable)
else
  echo "   ❌ scripts/build-kb-universe.js not found"
  echo "   This skill requires the KB Universe builder scripts."
  echo ""
  echo "   Required files:"
  echo "   - scripts/build-kb-universe.js (HTML builder v3.0+)"
  echo "   - scripts/kb-universe-data.js (data generator v3.0+)"
  echo "   - public/kb-universe-template.html (HTML template)"
fi
```

---

## RuvNet Ecosystem Categories

The visualization automatically detects and creates top-level categories for:

| Category | Description |
|----------|-------------|
| **Agentic Flow** | Multi-agent orchestration system |
| **Ruflo** | Enterprise AI coordination |
| **RuVector** | Vector database & embeddings |
| **Flow Nexus** | Cloud orchestration platform |
| **AgentDB** | Agent memory & persistence |
| **Claude Code** | CLI development tool |
| **Ruv Swarm** | Distributed agent swarms |
| **RuvLLM** | LLM orchestration layer |

Plus 30+ additional topic-based categories from content analysis.

---

## Scoring System

| Dimension | Weight | Optimal |
|-----------|--------|---------|
| Coverage | 25% | 500-2000 entries |
| Depth | 15% | 15-40 categories |
| Balance | 15% | Even distribution |
| Quality | 30% | Rich content (500+ chars avg) |
| Sources | 15% | 20+ unique sources |

---

## Output Files

| File | Purpose |
|------|---------|
| `public/kb-universe-data.json` | Raw hierarchy data |
| `public/{ProjectName}-kb-visualization.html` | Self-contained visualization with embedded data |

---

## Troubleshooting

### "No tables found"
- Check schema name matches directory: `project-name` → `project_name`
- Verify tables exist: `\dt project_name.*` in psql

### "Skipping table X"
- Normal - tables without title/content columns are skipped
- Add a `title` or `name` column to include a table

### "No content/title columns"
- Table needs at least one recognized column (see mapping table above)
- Customize column detection in `kb-universe-data.js` lines 556-561

---

## Related Commands

| Command | Purpose |
|---------|---------|
| `/ruvnet-stack` | Full ecosystem install |
| `/ruvnet-update` | Update packages |
| `/ruvnet-kb` | Link tool knowledge |
