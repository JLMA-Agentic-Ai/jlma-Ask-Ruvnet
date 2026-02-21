Updated: 2025-12-30 14:00:00 EST | Version 2.0.0
Created: 2025-12-30 13:35:00 EST

# KB-Build: Complete KB-Driven Development Workflow

## Overview

**Name:** `/kb-build`
**Purpose:** Build knowledge bases AND applications that REQUIRE KB patterns at every step.

This command orchestrates:
1. **KB Creation** - Build a knowledge base on any topic
2. **Quality Loop** - Score and iterate until 98+
3. **Visualization** - Generate interactive KB visualization
4. **MCP Access** - Provide tools for KB-driven development
5. **App Building** - Generate code that REQUIRES KB patterns

---

## Commands

### Create KB
```
/kb-build create "Multi-agent coordination patterns"
```

### Score KB
```
/kb-build score
```

### Improve KB (iterate until 98+)
```
/kb-build improve
```

### Visualize KB
```
/kb-build visualize
```

### Build Application
```
/kb-build app "Create a swarm management dashboard"
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 KB-BUILD COMPLETE WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: KB CREATION                                           │
│  ════════════════════                                           │
│  1. User: "Build me a knowledge base on X"                      │
│  2. Researcher Agent → gathers comprehensive info               │
│  3. Writer Agent → structures into KB entries                   │
│  4. Ingest → ruvector-postgres with embeddings                  │
│                                                                  │
│  PHASE 2: QUALITY LOOP (until scores ≥ 98)                      │
│  ═════════════════════════════════════════                      │
│  1. Quality Agent → scores 1-100 on 5 dimensions                │
│  2. Gap Analysis Agent → identifies missing topics              │
│  3. Research Agent → fills gaps                                 │
│  4. REPEAT until all dimensions ≥ 98                            │
│                                                                  │
│  PHASE 3: STORAGE & ACCESS                                      │
│  ═════════════════════════                                      │
│  1. Store in ruvector-postgres schema                           │
│  2. Generate embeddings via ruvector_embed()                    │
│  3. kb-gateway MCP provides access tools                        │
│                                                                  │
│  PHASE 4: VISUALIZATION                                         │
│  ══════════════════════                                         │
│  1. Run /ruvnet-kb-visual                                       │
│  2. Generate {Project}-kb-visualization.html                    │
│  3. Interactive 3D universe view                                │
│                                                                  │
│  PHASE 5: APP BUILDING (KB REQUIRED)                            │
│  ════════════════════════════════════                           │
│  1. EVERY code file goes through kb_code_gen                    │
│  2. EVERY file gets KB citation header                          │
│  3. EVERY function cites its KB source                          │
│  4. README documents KB schema and access                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quality Scoring Rubric

| Dimension | 90-100 | 70-89 | 50-69 | <50 |
|-----------|--------|-------|-------|-----|
| **Completeness** | All topics covered | Most covered | Major gaps | Incomplete |
| **Accuracy** | Verified, current | Mostly accurate | Some errors | Outdated |
| **Depth** | Expert-level detail | Good detail | Surface level | Shallow |
| **Coverage** | Edge cases included | Common cases | Happy path only | Minimal |
| **Structure** | Well-organized | Organized | Some structure | Disorganized |

**Target: ALL dimensions must score ≥ 98 before proceeding to app building.**

---

## MCP Tools (kb-gateway)

| Tool | Purpose |
|------|---------|
| `mcp__kb-gateway__kb_code_gen` | **PRIMARY** - Generate code from KB patterns |
| `mcp__kb-gateway__kb_search` | Query KB for patterns |
| `mcp__kb-gateway__kb_status` | Check KB connection/stats |
| `mcp__kb-gateway__kb_validate` | Validate code against KB |

### kb_code_gen Workflow

```
1. Call kb_code_gen with file_path, description, code_type
   ↓
2. Tool queries KB for matching patterns
   ↓
3. Returns:
   - citation_header (put at TOP of file)
   - kb_sources (patterns found)
   - kb_coverage (full/partial/gap)
   - generation_prompt (context for implementation)
   ↓
4. Generate code following KB patterns
   ↓
5. Write file with citation header
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
```

---

## Schema Structure

```sql
-- Create isolated schema
CREATE SCHEMA project_name;

-- Main KB table
CREATE TABLE project_name.architecture_docs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT,
  category TEXT,
  embedding real[],
  quality_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_fts ON project_name.architecture_docs
  USING gin(to_tsvector('english', title || ' ' || content));

-- Vector similarity index (if using embeddings)
CREATE INDEX idx_embed ON project_name.architecture_docs
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Connection Details

| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 5435 |
| User | postgres |
| Password | ${POSTGRES_PASSWORD} |
| Database | postgres |
| Schema | `{directory_name}` (lowercase, underscores) |

---

## Example: Complete Session

```
User: Build me a knowledge base on "React patterns for AI agent UIs"

Claude:
═══════════════════════════════════════════════════════════
PHASE 1: KB CREATION
═══════════════════════════════════════════════════════════

Spawning agents in parallel:
- Researcher: Gathering React pattern documentation
- Researcher: Finding AI agent UI best practices
- Writer: Preparing KB entry templates

[Research complete - 47 sources analyzed]

Ingesting to ruvector-postgres schema: react_agent_ui
- 156 entries created
- Embeddings generated

═══════════════════════════════════════════════════════════
PHASE 2: QUALITY SCORING (Iteration 1)
═══════════════════════════════════════════════════════════

Dimension       | Score | Notes
----------------|-------|----------------------------------
Completeness    | 72    | Missing: streaming patterns
Accuracy        | 85    | Need: 2025 React 19 updates
Depth           | 68    | Need: more code examples
Coverage        | 75    | Missing: error handling patterns
Structure       | 88    | Good organization

OVERALL: 77.6 - BELOW 98 THRESHOLD

Gap Analysis:
- Missing streaming UI patterns
- Missing React 19 features
- Need more practical examples
- Missing error boundary patterns

═══════════════════════════════════════════════════════════
PHASE 2: QUALITY IMPROVEMENT (Iteration 2)
═══════════════════════════════════════════════════════════

Adding 34 new entries covering gaps...

Dimension       | Score | Notes
----------------|-------|----------------------------------
Completeness    | 94    | Most gaps filled
Accuracy        | 97    | Updated for React 19
Depth           | 91    | Added code examples
Coverage        | 93    | Added error patterns
Structure       | 95    | Improved categorization

OVERALL: 94.0 - BELOW 98 THRESHOLD

═══════════════════════════════════════════════════════════
PHASE 2: QUALITY IMPROVEMENT (Iteration 3)
═══════════════════════════════════════════════════════════

Adding 12 new entries for final polish...

Dimension       | Score | Notes
----------------|-------|----------------------------------
Completeness    | 99    | ✓ All topics covered
Accuracy        | 99    | ✓ Current best practices
Depth           | 98    | ✓ Expert-level detail
Coverage        | 98    | ✓ Edge cases included
Structure       | 99    | ✓ Well-organized

OVERALL: 98.6 - ✅ MEETS THRESHOLD

═══════════════════════════════════════════════════════════
PHASE 3: VISUALIZATION
═══════════════════════════════════════════════════════════

Running /ruvnet-kb-visual...
Generated: public/react_agent_ui-kb-visualization.html
- 202 entries across 18 categories
- Interactive 3D universe view

═══════════════════════════════════════════════════════════
PHASE 4: APP BUILDING (KB REQUIRED)
═══════════════════════════════════════════════════════════

User: Now build me an agent monitoring dashboard

Using kb_code_gen for all code files...

File: src/components/AgentCard.tsx
  KB Sources: 3 patterns matched (92% coverage)
  Citation header added

File: src/components/SwarmView.tsx
  KB Sources: 4 patterns matched (96% coverage)
  Citation header added

File: src/hooks/useAgentStatus.ts
  KB Sources: 2 patterns matched (88% coverage)
  Citation header added

FINAL KB USAGE SCORE: 94%
✅ Application built with full KB enforcement
```

---

## Enforcement Rules

### NEVER
- ❌ Use `Write` for code without calling `kb_code_gen` first
- ❌ Generate code without KB citation headers
- ❌ Build app until KB scores ≥ 98
- ❌ Produce "slop" that ignores KB patterns

### ALWAYS
- ✅ Query KB before any code generation
- ✅ Include citation header from kb_code_gen
- ✅ Show user which KB patterns are being used
- ✅ Warn if kb_coverage is "gap" or "partial"

---

## Related Commands

| Command | Purpose |
|---------|---------|
| `/ruvnet-kb` | Link tool knowledge to project |
| `/ruvnet-kb-visual` | Visualize KB contents |
| `/ruvnet-stack` | Install full RuvNet ecosystem |
