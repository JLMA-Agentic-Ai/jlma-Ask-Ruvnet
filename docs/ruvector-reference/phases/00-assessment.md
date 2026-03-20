Updated: 2026-01-01 20:30:00 EST | Version 2.0.0
Created: 2026-01-01 19:00:00 EST

# Phase 0: Assessment (Mandatory for All Projects)

## Purpose

**MANDATORY for ALL projects.** This phase ensures Claude understands exactly what you want to build before writing any code or making any changes.

- **Greenfield:** Read intentions, confirm understanding, align on vision
- **Brownfield:** Read entire application, analyze, present transformation plan

---

## ⛔ THIS PHASE IS NOT OPTIONAL

```
⛔ DO NOT PROCEED TO PHASE 1 WITHOUT COMPLETING PHASE 0
⛔ DO NOT ASSUME YOU UNDERSTAND THE PROJECT
⛔ DO NOT SKIP USER CONFIRMATION
```

---

## Sub-Phases

| Sub-Phase | Name | Output | Gate |
|-----------|------|--------|------|
| 0.1 | Detect Application Type | greenfield/brownfield | Required |
| 0.2 | **Greenfield:** Read Intentions | Project understanding | Required if greenfield |
| 0.3 | **Brownfield:** Full Application Analysis | Complete assessment | Required if brownfield |
| 0.4 | Present Vision (IS/SHOULD/COULD) | Analysis document | Required |
| 0.5 | Get User Feedback | Alignment confirmed | Required |
| 0.6 | Get User Confirmation | Explicit "PROCEED" | ⛔ HARD GATE |

---

## 0.1 Detect Application Type

```bash
#!/bin/bash
# scripts/detect-app-type.sh

echo "=== Application Type Detection ==="

SCORE=0

# Check for existing source code
if [ -d "src" ] || [ -d "lib" ] || [ -d "app" ]; then
  echo "✓ Source directory exists"
  SCORE=$((SCORE + 1))
fi

# Check for existing KB schema
if psql "$DATABASE_URL" -c "SELECT 1 FROM kb_nodes LIMIT 1" 2>/dev/null; then
  echo "✓ KB tables exist with data"
  SCORE=$((SCORE + 1))
fi

# Check for existing package.json
if [ -f "package.json" ]; then
  echo "✓ package.json exists"
  SCORE=$((SCORE + 1))
fi

# Check for domain logic
if [ -d "src/domain" ] || [ -d "lib/domain" ]; then
  echo "✓ Domain logic directory exists"
  SCORE=$((SCORE + 1))
fi

echo ""
if [ $SCORE -ge 2 ]; then
  echo "🟠 BROWNFIELD APPLICATION DETECTED"
  echo "   Phase 0 sub-phases 0.2-0.6 are MANDATORY"
  echo "   DO NOT SKIP TO PHASE 1"
else
  echo "🟢 GREENFIELD APPLICATION"
  echo "   Proceed directly to Phase 1"
fi
```

**Gate:** Application type determined.
- If **greenfield** → Continue to 0.2 (Read Intentions)
- If **brownfield** → Continue to 0.3 (Full Application Analysis)

---

## 0.2 Greenfield: Read Intentions

For greenfield projects, Claude must understand what you want to build before proceeding.

### Option A: PROJECT_INTENTIONS.md Exists

If the file `PROJECT_INTENTIONS.md` exists in the project root:

```bash
#!/bin/bash
# Check for intentions file
if [ -f "PROJECT_INTENTIONS.md" ]; then
  echo "✓ PROJECT_INTENTIONS.md found"
  echo "Reading intentions..."
  cat PROJECT_INTENTIONS.md
fi
```

Claude will:
1. Read the entire intentions file
2. Parse all sections (project overview, intelligence pattern, requirements, etc.)
3. Generate a summary for user confirmation
4. **Present back to user** what was understood

### Option B: No Intentions File - Interactive Discovery

If no intentions file exists, Claude will ask structured questions:

```
╔═══════════════════════════════════════════════════════════╗
║           GREENFIELD PROJECT DISCOVERY                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  I need to understand what you want to build.             ║
║                                                           ║
║  Please answer these questions:                           ║
║                                                           ║
║  1. PROJECT NAME: What is this project called?            ║
║                                                           ║
║  2. ONE-LINER: In one sentence, what does it do?          ║
║                                                           ║
║  3. PROBLEM: What problem does this solve?                ║
║                                                           ║
║  4. USERS: Who will use this application?                 ║
║                                                           ║
║  5. INTELLIGENCE PATTERN: Which fits best?                ║
║     [ ] Decision Web (GNN) - interconnected variables     ║
║     [ ] Combinatorial Routing - query routing to experts  ║
║     [ ] Scenario Learning (SONA) - "what worked for X?"   ║
║     [ ] Continuous Optimization - ongoing adaptation      ║
║     [ ] Unsure - let me analyze and recommend             ║
║                                                           ║
║  6. CORE FEATURES: What MUST it do? (list 3-5)            ║
║                                                           ║
║  7. DEPLOYMENT: Where will it run?                        ║
║     [ ] Local  [ ] Docker  [ ] Vercel  [ ] Railway        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Creating Intentions File

After interactive discovery, Claude will generate `PROJECT_INTENTIONS.md`:

```bash
# Generate from user responses
cat > PROJECT_INTENTIONS.md << 'EOF'
# Project Intentions

Updated: $(date) | Version 1.0.0
Created: $(date)

## 1. Project Overview
...
EOF
```

**Gate:** Intentions understood. Continue to 0.4 (Present Vision).

---

## 0.3 Brownfield: Full Application Analysis

For existing applications, Claude MUST read and understand the entire codebase before proposing changes.

### Step 1: Comprehensive Codebase Read

```bash
#!/bin/bash
# scripts/analyze-application.sh

echo "=== FULL APPLICATION ANALYSIS ==="
echo "Reading entire codebase..."

# Structure overview
echo ""
echo "## Directory Structure"
find . -type d -not -path './node_modules/*' -not -path './.git/*' | head -50

# Source files
echo ""
echo "## Source Files"
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l
echo "TypeScript/JavaScript files found"

# Package dependencies
echo ""
echo "## Dependencies"
if [ -f "package.json" ]; then
  jq '.dependencies, .devDependencies' package.json 2>/dev/null || cat package.json
fi

# Database schema
echo ""
echo "## Database Schema"
if [ -n "$DATABASE_URL" ]; then
  psql "$DATABASE_URL" -c "\dt" 2>/dev/null
fi

# Entry points
echo ""
echo "## Entry Points"
find . -name "index.ts" -o -name "index.js" -o -name "main.ts" -o -name "app.ts" 2>/dev/null

# Domain logic
echo ""
echo "## Domain Logic"
if [ -d "src/domain" ]; then
  ls -la src/domain/
fi

# API routes
echo ""
echo "## API Routes"
find . -name "*.ts" -exec grep -l "router\|app.get\|app.post" {} \; 2>/dev/null | head -20
```

### Step 2: Read Every Domain File

Claude MUST read every file in domain logic directories:

```
Files to read completely:
- src/domain/*.ts (ALL files)
- src/services/*.ts (ALL files)
- src/api/*.ts (ALL files)
- src/components/*.tsx (ALL files)
- src/lib/*.ts (ALL files)
- Configuration files (tsconfig, package.json, etc.)
```

### Step 3: Analyze Current Architecture

```
For each domain function, identify:
1. What it does (purpose)
2. What data it uses (sources)
3. Whether it queries KB or uses hardcoded values
4. What it returns (structure)
5. How it handles errors
6. Dependencies on other functions
```

### Step 4: Score Existing KB

#### KB Quality Score Formula (0-100)

```
KB_SCORE = EXPERT_COVERAGE + DEPTH + COMPLETENESS + ATTRIBUTION + CONFIDENCE

Where:
- EXPERT_COVERAGE (25 pts): (unique_experts_cited / 100) * 25
- DEPTH (25 pts): Based on average node depth (4+ = 25pts)
- COMPLETENESS (25 pts): (1 - (gaps_unfilled / total_topics)) * 25
- ATTRIBUTION (15 pts): (nodes_with_sources / total_nodes) * 15
- CONFIDENCE (10 pts): avg_confidence_score * 10
```

### Step 5: Score App Compliance

#### App Compliance Score Formula (0-100)

```
APP_SCORE = KB_IMPORTS + SOURCE_RETURNS + NO_HARDCODE + STARTUP_VERIFY + NO_FALLBACKS

Where:
- KB_IMPORTS (20 pts): Domain files importing KB
- SOURCE_RETURNS (20 pts): Functions returning kbSources
- NO_HARDCODE (20 pts): No hardcoded magic values
- STARTUP_VERIFY (20 pts): KB verification at startup
- NO_FALLBACKS (20 pts): No fallback defaults
```

**Gate:** Full analysis complete. Continue to 0.4.

---

## 0.4 Present Vision (IS / SHOULD / COULD)

After understanding the project (greenfield or brownfield), Claude presents a structured analysis.

### For Greenfield Projects

```
╔═══════════════════════════════════════════════════════════╗
║              PROJECT UNDERSTANDING                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📋 WHAT YOU WANT TO BUILD:                               ║
║  [Summary of intentions/discovery]                        ║
║                                                           ║
║  🎯 WHAT IT SHOULD BE:                                    ║
║  - Architecture: [recommended pattern]                    ║
║  - KB Structure: [domain taxonomy]                        ║
║  - Intelligence: [recommended pattern]                    ║
║  - Scale: [expected load handling]                        ║
║                                                           ║
║  🚀 WHAT IT COULD BE (with KB-First):                     ║
║  - Expert-sourced responses with citations                ║
║  - Gap detection for knowledge expansion                  ║
║  - Confidence scoring on all outputs                      ║
║  - [domain-specific capabilities]                         ║
║                                                           ║
║  📊 RECOMMENDED PHASES:                                   ║
║  [List of phases this project needs]                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### For Brownfield Projects

```
╔═══════════════════════════════════════════════════════════╗
║              BROWNFIELD ANALYSIS                          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📋 WHAT IT IS NOW:                                       ║
║  - Purpose: [detected purpose from code analysis]         ║
║  - Architecture: [current architecture]                   ║
║  - KB State: [current KB score] / 100                     ║
║  - App Compliance: [current app score] / 100              ║
║  - Key Functions: [list of domain functions found]        ║
║  - Dependencies: [external services/APIs]                 ║
║  - Issues Found:                                          ║
║    • [hardcoded values]                                   ║
║    • [missing KB integration]                             ║
║    • [no source attribution]                              ║
║                                                           ║
║  🎯 WHAT IT SHOULD BE:                                    ║
║  - KB Score: ≥98/100                                      ║
║  - App Compliance: ≥98/100                                ║
║  - All values from KB, not hardcoded                      ║
║  - Source attribution on every response                   ║
║  - KB verification at startup                             ║
║  - Gap logging for missing knowledge                      ║
║                                                           ║
║  🚀 WHAT IT COULD BE (with transformation):               ║
║  - [enhanced capability 1 based on domain]                ║
║  - [enhanced capability 2]                                ║
║  - [enhanced capability 3]                                ║
║  - Expert knowledge with confidence scores                ║
║  - Self-improving through gap detection                   ║
║                                                           ║
║  📊 TRANSFORMATION SCOPE:                                 ║
║  - KB Gap: [X] points to close                            ║
║  - App Gap: [X] points to close                           ║
║  - Phases Required: [list]                                ║
║  - Estimated Effort: [XS/S/M/L/XL]                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Gate:** Vision presented. Continue to 0.5.

---

## 0.5 Get User Feedback

⛔ **DO NOT PROCEED WITHOUT USER RESPONSE**

```
╔═══════════════════════════════════════════════════════════╗
║              ⚠️ FEEDBACK REQUIRED ⚠️                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Based on my analysis above:                              ║
║                                                           ║
║  1. Does my understanding match your expectations?        ║
║                                                           ║
║  2. Is the "WHAT IT SHOULD BE" vision correct?            ║
║                                                           ║
║  3. Are there capabilities I missed in "WHAT IT COULD BE"?║
║                                                           ║
║  4. Any concerns about the transformation scope?          ║
║                                                           ║
║  Please provide your feedback before I proceed.           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

Claude MUST:
1. Wait for user feedback
2. Address any corrections
3. Update the vision if needed
4. Re-present if significant changes

**Gate:** User feedback incorporated. Continue to 0.6.

---

## 0.6 Get User Confirmation

### ⛔ HARD GATE - DO NOT PROCEED WITHOUT EXPLICIT CONFIRMATION

```
╔═══════════════════════════════════════════════════════════╗
║                ⛔ CONFIRMATION REQUIRED ⛔                  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  I will now execute the KB-First transformation:          ║
║                                                           ║
║  [For Brownfield]                                         ║
║  Before Score:                                            ║
║    KB Quality:     [X]/100                                ║
║    App Compliance: [X]/100                                ║
║                                                           ║
║  After Score (Target):                                    ║
║    KB Quality:     98/100                                 ║
║    App Compliance: 98/100                                 ║
║                                                           ║
║  [For Greenfield]                                         ║
║  Target:                                                  ║
║    KB Quality:     ≥98/100                                ║
║    App Compliance: ≥98/100                                ║
║    Full source attribution                                ║
║    Expert-backed responses                                ║
║                                                           ║
║  Phases to Execute: [list]                                ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Type "PROCEED" to begin transformation                   ║
║  Type "ABORT" to stop                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Gate:** User types "PROCEED" → Continue to Phase 1

---

## Swarm Configuration for Phase 0

```yaml
phase_0_swarm:
  topology: star  # Coordinator orchestrates assessors
  strategy: parallel
  maxAgents: 4

  agents:
    - type: coordinator
      name: assessment-coordinator
      capabilities:
        - orchestrate_assessment
        - aggregate_scores
        - generate_report

    - type: analyst
      name: kb-scorer
      capabilities:
        - query_database
        - calculate_kb_score
        - identify_kb_gaps

    - type: analyst
      name: app-scorer
      capabilities:
        - analyze_source_code
        - calculate_app_score
        - identify_violations

    - type: specialist
      name: gap-reporter
      capabilities:
        - aggregate_gaps
        - prioritize_issues
        - estimate_effort

  parallel_execution:
    - [kb-scorer, app-scorer]  # Run in parallel
    - [gap-reporter]           # After both complete
    - [coordinator]            # Final aggregation
```

---

## Exit Criteria

### For Greenfield Projects

```
[ ] PROJECT_INTENTIONS.md exists OR interactive discovery completed
[ ] Claude has presented project understanding back to user
[ ] User has provided feedback on the vision
[ ] Vision updated based on feedback (if needed)
[ ] User explicitly typed "PROCEED"
```

### For Brownfield Projects

```
[ ] Full codebase read (every domain file)
[ ] KB quality score calculated (0-100)
[ ] App compliance score calculated (0-100)
[ ] IS/SHOULD/COULD analysis presented to user
[ ] User has provided feedback on the analysis
[ ] Vision updated based on feedback (if needed)
[ ] User explicitly typed "PROCEED"
```

**Only proceed to Phase 1 when ALL applicable boxes are checked.**

---

## Delta Tracking

After Phase 8 completion, return to Phase 0 scores for comparison:

```
╔═══════════════════════════════════════════════════════════╗
║              TRANSFORMATION COMPLETE                      ║
╠═══════════════════════════════════════════════════════════╣
║                    BEFORE    AFTER     DELTA              ║
║  KB Quality:        47/100   98/100    +51 ✓             ║
║  App Compliance:    32/100   99/100    +67 ✓             ║
║                                                           ║
║  Phases Completed: 8/8                                    ║
║  Total Duration: 6 days                                   ║
║  Effort Estimate Accuracy: 85% (estimated L, actual L)    ║
╚═══════════════════════════════════════════════════════════╝
```
