Updated: 2025-12-30 17:25:00 EST | Version 1.1.0
Created: 2025-12-30 14:15:00 EST

# KB-Gateway Architecture: Code Generation Through Knowledge Base

## Overview

KB-Gateway is an MCP server that makes the knowledge base the **ONLY path to code generation**. Instead of generating generic code, Claude MUST query the KB first and use documented patterns.

**Core Principle:** Don't enforce KB usage after the fact. Make KB the only way to generate code.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KB-GATEWAY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Request: "Build me a swarm coordinator"                   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  kb_code_gen (MCP Tool)                                   │   │
│  │  ══════════════════════                                   │   │
│  │  1. Query KB: "swarm coordinator patterns"                │   │
│  │  2. Find matching entries in architecture_docs            │   │
│  │  3. Build citation header                                 │   │
│  │  4. Return:                                               │   │
│  │     - kb_sources (patterns found)                         │   │
│  │     - citation_header (put at TOP of file)                │   │
│  │     - kb_coverage (full/partial/gap)                      │   │
│  │     - generation_prompt (context)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  Claude generates code FOLLOWING KB patterns                    │
│                          ↓                                       │
│  File written with KB citation header                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP Server Location

```
~/.claude/mcp-servers/kb-gateway/
├── package.json
├── bin/
│   └── cli.js
└── src/
    └── server.js
```

---

## MCP Tools

### 1. kb_code_gen (PRIMARY)

**Purpose:** Generate code using KB patterns. This is the REQUIRED tool for all code generation.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file_path | string | Yes | Path where file will be written |
| description | string | Yes | What the code should do |
| code_type | enum | No | component, api, utility, test, config, model, service |
| framework | string | No | React, Express, Next.js, etc. |
| language | string | No | TypeScript, JavaScript, Python |
| additional_context | string | No | Extra requirements |

**Returns:**
```json
{
  "success": true,
  "file_path": "src/components/SwarmManager.tsx",
  "citation_header": "/**\n * KB-Generated: 2025-12-30T14:30:00.000Z\n * Schema: project_name\n * Sources:\n * - \"Swarm Patterns\" (94% match)\n */",
  "kb_sources": [
    {"title": "Swarm Patterns", "content": "...", "source": "docs/swarm.md", "similarity": 0.94}
  ],
  "kb_coverage": "full",
  "generation_prompt": "Generate code using these KB patterns...",
  "session_id": "kb-1735577400000",
  "instruction": "Use the KB patterns above to generate the code. Start the file with the citation header provided."
}
```

### 2. kb_search

**Purpose:** Query KB for patterns before implementation.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| limit | number | No | Max results (default: 10) |

**Returns:**
```json
{
  "success": true,
  "schema": "project_name",
  "query": "swarm patterns",
  "count": 5,
  "results": [
    {"id": 123, "title": "...", "content_preview": "...", "source": "...", "similarity": 0.94}
  ]
}
```

### 3. kb_status

**Purpose:** Check KB connection and stats.

**Returns:**
```json
{
  "success": true,
  "connected": true,
  "schema": "project_name",
  "schema_exists": true,
  "stats": {
    "total_entries": 1809,
    "unique_sources": 45,
    "approx_topics": 200
  }
}
```

### 4. kb_validate

**Purpose:** Validate existing code against KB patterns.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file_path | string | Yes | Path to file |
| code_content | string | Yes | Code to validate |

**Returns:**
```json
{
  "success": true,
  "file_path": "src/swarm.ts",
  "has_kb_citation": true,
  "matching_patterns": 3,
  "kb_sources": [...],
  "recommendation": "Code has KB citation - compliant"
}
```

---

## MCP Registration

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "kb-gateway": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/.claude/mcp-servers/kb-gateway/src/server.js"
      ],
      "type": "stdio",
      "env": {
        "RUVECTOR_PG_HOST": "localhost",
        "RUVECTOR_PG_PORT": "5435",
        "RUVECTOR_PG_PASSWORD": "guruKB2025"
      },
      "description": "KB-Gateway: Makes KB the ONLY path to code generation",
      "enabled": true
    }
  }
}
```

---

## File Citation Format

**Every generated code file MUST start with:**

```javascript
/**
 * KB-Generated: 2025-12-30T14:30:00.000Z
 * Schema: project_name
 * Sources:
 * - "Swarm Initialization Patterns" (94% match)
 * - "Agent Coordination Protocol" (87% match)
 * - "Mesh Topology Selection" (82% match)
 *
 * Coverage: FULL
 * Session: kb-1735577400000
 */

// Implementation follows KB patterns above
import { SwarmConfig } from './types';

// KB:123 - Implements swarm initialization pattern
export function initializeSwarm(config: SwarmConfig) {
  // KB:456 - Uses mesh topology for <10 agents
  const topology = config.agents < 10 ? 'mesh' : 'hierarchical';
  // ...
}
```

---

## Workflow: Building with KB-Gateway

### Step 1: Check KB Status
```
mcp__kb-gateway__kb_status {}
```

### Step 2: Generate Code (REQUIRED for all code files)
```
mcp__kb-gateway__kb_code_gen {
  file_path: "src/components/SwarmManager.tsx",
  description: "React component for managing agent swarms",
  code_type: "component",
  framework: "React",
  language: "TypeScript"
}
```

### Step 3: Write File with Citation
```
Write "src/components/SwarmManager.tsx" with:
1. citation_header (from kb_code_gen response)
2. Code that implements the KB patterns
```

---

## File Types and Tools

| File Type | Tool to Use |
|-----------|-------------|
| `.ts`, `.tsx`, `.js`, `.jsx` | `kb_code_gen` → then `Write` |
| `.py`, `.go`, `.rs` | `kb_code_gen` → then `Write` |
| `.json`, `.yaml`, `.toml` (config) | `Write` directly |
| `.md`, `.txt` (docs) | `Write` directly |
| `.html`, `.css` (static) | `Write` directly |

---

## Database Schema

### Connection Details

| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 5435 |
| User | postgres |
| Password | guruKB2025 |
| Database | postgres |
| Schema | `{directory_name}` (lowercase, underscores) |

### Table Structure

```sql
CREATE TABLE {schema}.architecture_docs (
  id SERIAL PRIMARY KEY,
  doc_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT NOT NULL,
  section_header TEXT,
  section_index INTEGER DEFAULT 0,
  file_hash TEXT NOT NULL,
  embedding real[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_fts ON {schema}.architecture_docs
  USING gin(to_tsvector('english', title || ' ' || content));
```

---

## Enforcement Rules

### NEVER
- ❌ Use `Write` for code files without calling `kb_code_gen` first
- ❌ Generate code without KB citation headers
- ❌ Produce "slop" - generic code that ignores KB patterns
- ❌ Claim "KB is great" then bypass it

### ALWAYS
- ✅ Call `kb_code_gen` before writing any code file
- ✅ Include citation header from `kb_code_gen` response
- ✅ Show user which KB patterns are being used
- ✅ Warn if `kb_coverage` is "gap" or "partial"

---

## KB Quality Loop

When building a new KB, iterate until quality scores ≥ 98:

```
1. Research Agent → gather comprehensive info
2. Writer Agent → structure into KB entries
3. Ingest → ruvector-postgres with embeddings
4. Quality Agent → score 1-100 on 5 dimensions:
   - Completeness
   - Accuracy
   - Depth
   - Coverage
   - Structure
5. Gap Analysis Agent → identify missing topics
6. LOOP until all dimensions ≥ 98
```

---

## KB Visualization Rules (Max 9 Constraint)

**RULE: Maximum 9 major nodes at any level.**

This constraint is based on cognitive science (Miller's Law: 7±2 items for working memory) and forces smarter taxonomy design.

### Hierarchy Levels

```
Level 0: Project (center) ─── 1 node
Level 1: Major Themes ─────── MAX 9 nodes
Level 2: Sub-themes ──────── MAX 9 per theme
Level 3: Individual Items ── Unlimited (but grouped)
```

### Why This Matters

- **For Humans**: 9 nodes is digestible; 40 categories creates cognitive overload
- **For Application**: Search is flat SQL, but navigation needs structure
- **For Quality**: Forces careful categorization instead of lazy flat lists

### Enforcement

The `kb-universe-data.js` script automatically:
1. Counts Level 1 themes
2. If > 9, merges smallest themes into "General"
3. Limits Level 2 sub-themes to 9 per parent
4. Logs warnings when consolidation occurs

### Example Taxonomy (7 themes)

```
Ask-Ruvnet KB (1809 items)
├── 🔧 RuvNet Ecosystem (874 items, 8 sub-themes)
├── 🧠 AI & Intelligence (266 items, 5 sub-themes)
├── 📐 Development (207 items, 8 sub-themes)
├── 🚀 Operations (160 items, 6 sub-themes)
├── 💾 Infrastructure (158 items, 5 sub-themes)
├── 📚 Knowledge Base (144 items, 7 sub-themes)
└── 📦 General (71 items, 1 sub-theme)
```

### Never

- ❌ Create visualizations with >9 primary categories
- ❌ Let taxonomy grow organically without constraint
- ❌ Ship a KB visualization without hierarchy

---

## Commands

### /kb-build

Complete workflow orchestrator:

```bash
/kb-build create "topic"     # Build KB on topic
/kb-build score              # Quality score
/kb-build improve            # Iterate until 98+
/kb-build visualize          # Generate HTML visualization
/kb-build app "description"  # Build app using KB
```

---

## Integration with RuvNet Ecosystem

KB-Gateway works with:

| Component | Purpose |
|-----------|---------|
| ruvector-postgres | Vector database with embeddings |
| /ruvnet-kb-visual | KB visualization skill |
| /ruvnet-stack | Full ecosystem installation |
| claude-flow | Agent orchestration and memory |

---

## Verification

```bash
# Check KB is running
docker ps | grep ruvector-kb

# Test connection
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -c "SELECT 1"

# Count entries
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -c \
  "SELECT COUNT(*) FROM {schema}.architecture_docs"

# Test MCP server
node ~/.claude/mcp-servers/kb-gateway/bin/cli.js status
```

---

## Why This Architecture?

**Problem:** Claude would acknowledge the KB exists but generate generic "slop" code that ignores it.

**Solution:** Make KB query a REQUIRED step in code generation:
1. No code without KB query first
2. Citation header proves KB was used
3. Coverage metric shows quality of match
4. Validation tool audits existing code

**Result:** Every code file demonstrates which KB patterns it implements.
