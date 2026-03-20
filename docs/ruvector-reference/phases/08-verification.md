# Phase 8: Final Verification

Updated: 2026-01-01 19:45:00 EST | Version 2.0.0
Created: 2026-01-01 15:00:00 EST

## Purpose

Comprehensive check that all KB-First rules are followed. This is the final gate before the application is considered complete.

---

## ⛔ CRITICAL: This Phase Has 8 Sub-Phases

Each sub-phase is a hard gate. ALL must pass before completion.

| Sub-Phase | Name | Automated? | Hard Gate? |
|-----------|------|------------|------------|
| 8.1 | Code Scan (No Hardcoded Values) | ✅ Yes | ⛔ Yes |
| 8.2 | Import Verification | ✅ Yes | ⛔ Yes |
| 8.3 | Source Return Check | ✅ Yes | ⛔ Yes |
| 8.4 | Startup Verification Check | ✅ Yes | ⛔ Yes |
| 8.5 | Fallback Pattern Check | ✅ Yes | ⛔ Yes |
| 8.6 | Expert Attribution Check | ✅ Yes | ⛔ Yes |
| 8.7 | Confidence Score Check | ✅ Yes | ⛔ Yes |
| 8.8 | Gap Logging Verification | ✅ Yes | ⛔ Yes |

---

## 8.1 Code Scan (No Hardcoded Values)

**Purpose:** Verify no domain logic is hardcoded.

**Script:**
```bash
#!/bin/bash
# 8.1-code-scan.sh

echo "=== 8.1 Code Scan ==="
ERRORS=0

# Check for hardcoded decimals
DECIMALS=$(grep -rn "= [0-9]\+\.[0-9]\+" src/domain/ 2>/dev/null | grep -v "confidence" | wc -l)
if [ $DECIMALS -gt 0 ]; then
  echo "❌ Found $DECIMALS hardcoded decimal values:"
  grep -rn "= [0-9]\+\.[0-9]\+" src/domain/ | grep -v "confidence"
  ERRORS=$((ERRORS + DECIMALS))
else
  echo "✅ No hardcoded decimals"
fi

# Check for rate/age/limit constants
CONSTANTS=$(grep -rn "const.*\(Rate\|Age\|Limit\|Amount\)" src/domain/ 2>/dev/null | wc -l)
if [ $CONSTANTS -gt 0 ]; then
  echo "❌ Found $CONSTANTS suspicious constants:"
  grep -rn "const.*\(Rate\|Age\|Limit\|Amount\)" src/domain/
  ERRORS=$((ERRORS + CONSTANTS))
else
  echo "✅ No suspicious constants"
fi

# Check for DEFAULT_ patterns
DEFAULTS=$(grep -rn "DEFAULT_" src/domain/ 2>/dev/null | wc -l)
if [ $DEFAULTS -gt 0 ]; then
  echo "❌ Found $DEFAULTS DEFAULT_ patterns:"
  grep -rn "DEFAULT_" src/domain/
  ERRORS=$((ERRORS + DEFAULTS))
else
  echo "✅ No DEFAULT_ patterns"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 8.1 PASSED"
  exit 0
else
  echo "❌ 8.1 FAILED ($ERRORS errors)"
  exit 1
fi
```

**Gate:** Exit code must be 0

---

## 8.2 Import Verification

**Purpose:** All domain files must import from kb/.

**Script:**
```bash
#!/bin/bash
# 8.2-import-check.sh

echo "=== 8.2 Import Verification ==="
ERRORS=0

for file in src/domain/*.ts src/domain/*.js 2>/dev/null; do
  if [ -f "$file" ]; then
    if ! grep -q "from.*['\"].*kb" "$file"; then
      echo "❌ $file does not import from kb/"
      ERRORS=$((ERRORS + 1))
    else
      echo "✅ $file imports from kb/"
    fi
  fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 8.2 PASSED"
  exit 0
else
  echo "❌ 8.2 FAILED ($ERRORS files missing kb import)"
  exit 1
fi
```

**Gate:** Exit code must be 0

---

## 8.3 Source Return Check

**Purpose:** All domain functions must return kbSources.

**Script:**
```bash
#!/bin/bash
# 8.3-source-check.sh

echo "=== 8.3 Source Return Check ==="
ERRORS=0

for file in src/domain/*.ts src/domain/*.js 2>/dev/null; do
  if [ -f "$file" ]; then
    # Count return statements
    RETURNS=$(grep -c "return {" "$file" 2>/dev/null || echo 0)
    # Count kbSources in returns
    SOURCES=$(grep -A5 "return {" "$file" 2>/dev/null | grep -c "kbSources" || echo 0)

    if [ $RETURNS -gt 0 ] && [ $SOURCES -lt $RETURNS ]; then
      echo "❌ $file: $SOURCES/$RETURNS returns have kbSources"
      ERRORS=$((ERRORS + 1))
    elif [ $RETURNS -gt 0 ]; then
      echo "✅ $file: All returns have kbSources"
    fi
  fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 8.3 PASSED"
  exit 0
else
  echo "❌ 8.3 FAILED ($ERRORS files missing kbSources)"
  exit 1
fi
```

**Gate:** Exit code must be 0

---

## 8.4 Startup Verification Check

**Purpose:** Entry point must verify KB before anything else.

**Script:**
```bash
#!/bin/bash
# 8.4-startup-check.sh

echo "=== 8.4 Startup Verification Check ==="
ERRORS=0

ENTRY_FILE=""
for f in src/index.ts src/index.js src/main.ts src/main.js; do
  [ -f "$f" ] && ENTRY_FILE="$f" && break
done

if [ -z "$ENTRY_FILE" ]; then
  echo "❌ No entry point found (src/index.ts or src/main.ts)"
  exit 1
fi

echo "Checking $ENTRY_FILE..."

# Check verifyConnection is called
if ! grep -q "verifyConnection" "$ENTRY_FILE"; then
  echo "❌ verifyConnection not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ verifyConnection present"
fi

# Check it's called early (in first 30 lines)
if ! head -30 "$ENTRY_FILE" | grep -q "verifyConnection"; then
  echo "⚠️  verifyConnection may not be called first"
fi

# Check process.exit on failure
if ! grep -q "process.exit(1)" "$ENTRY_FILE"; then
  echo "❌ No process.exit(1) on KB failure"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ process.exit(1) present"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 8.4 PASSED"
  exit 0
else
  echo "❌ 8.4 FAILED ($ERRORS issues)"
  exit 1
fi
```

**Gate:** Exit code must be 0

---

## 8.5 Fallback Pattern Check

**Purpose:** No fallback logic allowed in domain code.

**Script:**
```bash
#!/bin/bash
# 8.5-fallback-check.sh

echo "=== 8.5 Fallback Pattern Check ==="
ERRORS=0

# Check for || DEFAULT patterns
DEFAULTS=$(grep -rn "|| DEFAULT" src/domain/ 2>/dev/null | wc -l)
if [ $DEFAULTS -gt 0 ]; then
  echo "❌ Found $DEFAULTS || DEFAULT patterns:"
  grep -rn "|| DEFAULT" src/domain/
  ERRORS=$((ERRORS + DEFAULTS))
fi

# Check for || [] patterns
ARRAYS=$(grep -rn "|| \[\]" src/domain/ 2>/dev/null | wc -l)
if [ $ARRAYS -gt 0 ]; then
  echo "❌ Found $ARRAYS || [] patterns:"
  grep -rn "|| \[\]" src/domain/
  ERRORS=$((ERRORS + ARRAYS))
fi

# Check for || {} patterns
OBJECTS=$(grep -rn "|| {}" src/domain/ 2>/dev/null | wc -l)
if [ $OBJECTS -gt 0 ]; then
  echo "❌ Found $OBJECTS || {} patterns:"
  grep -rn "|| {}" src/domain/
  ERRORS=$((ERRORS + OBJECTS))
fi

# Check for ?? with literal fallbacks
NULLISH=$(grep -rn "?? [0-9\"\']" src/domain/ 2>/dev/null | wc -l)
if [ $NULLISH -gt 0 ]; then
  echo "⚠️  Found $NULLISH ?? with literal fallbacks (review manually):"
  grep -rn "?? [0-9\"\']" src/domain/
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 8.5 PASSED"
  exit 0
else
  echo "❌ 8.5 FAILED ($ERRORS fallback patterns)"
  exit 1
fi
```

**Gate:** Exit code must be 0

---

## 8.6 Expert Attribution Check

**Purpose:** All KB nodes must have source expert.

**Script:**
```bash
#!/bin/bash
# 8.6-attribution-check.sh

echo "=== 8.6 Expert Attribution Check ==="

MISSING=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*)
  FROM kb_nodes
  WHERE namespace = '$NAMESPACE'
    AND (source_expert IS NULL OR source_expert = '');
")

MISSING=$(echo $MISSING | tr -d ' ')

if [ "$MISSING" -gt 0 ]; then
  echo "❌ $MISSING nodes missing expert attribution"
  echo ""
  echo "Nodes without attribution:"
  psql "$DATABASE_URL" -c "
    SELECT id, title
    FROM kb_nodes
    WHERE namespace = '$NAMESPACE'
      AND (source_expert IS NULL OR source_expert = '')
    LIMIT 10;
  "
  exit 1
else
  echo "✅ All nodes have expert attribution"
  echo "✅ 8.6 PASSED"
  exit 0
fi
```

**Gate:** Exit code must be 0

---

## 8.7 Confidence Score Check

**Purpose:** All KB nodes must have confidence scores.

**Script:**
```bash
#!/bin/bash
# 8.7-confidence-check.sh

echo "=== 8.7 Confidence Score Check ==="

MISSING=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*)
  FROM kb_nodes
  WHERE namespace = '$NAMESPACE'
    AND confidence IS NULL;
")

MISSING=$(echo $MISSING | tr -d ' ')

if [ "$MISSING" -gt 0 ]; then
  echo "❌ $MISSING nodes missing confidence scores"
  exit 1
fi

AVG=$(psql "$DATABASE_URL" -t -c "
  SELECT ROUND(AVG(confidence)::numeric, 2)
  FROM kb_nodes
  WHERE namespace = '$NAMESPACE';
")

AVG=$(echo $AVG | tr -d ' ')

echo "✅ All nodes have confidence scores"
echo "   Average confidence: $AVG"

if (( $(echo "$AVG < 0.5" | bc -l) )); then
  echo "⚠️  Average confidence is low (<0.5)"
fi

echo "✅ 8.7 PASSED"
exit 0
```

**Gate:** Exit code must be 0

---

## 8.8 Gap Logging Verification

**Purpose:** Gap detection must be active and working.

**Script:**
```bash
#!/bin/bash
# 8.8-gap-logging-check.sh

echo "=== 8.8 Gap Logging Verification ==="
ERRORS=0

# Check gap logging function exists in code
if ! grep -rq "logGap\|log_gap\|recordGap" src/kb/ 2>/dev/null; then
  echo "❌ No gap logging function found in src/kb/"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Gap logging function exists"
fi

# Check kb_gaps table exists
if ! psql "$DATABASE_URL" -c "SELECT 1 FROM kb_gaps LIMIT 1" 2>/dev/null; then
  echo "❌ kb_gaps table does not exist or is inaccessible"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ kb_gaps table exists"
fi

# Check if gaps are being logged (should have some from testing)
GAP_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM kb_gaps WHERE namespace = '$NAMESPACE';" 2>/dev/null | tr -d ' ')

if [ -z "$GAP_COUNT" ] || [ "$GAP_COUNT" == "0" ]; then
  echo "⚠️  No gaps logged yet (normal if no queries have failed)"
else
  echo "✅ $GAP_COUNT gaps logged"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 8.8 PASSED"
  exit 0
else
  echo "❌ 8.8 FAILED ($ERRORS issues)"
  exit 1
fi
```

**Gate:** Exit code must be 0

---

## Master Verification Script

Run all 8 sub-phases in sequence:

```bash
#!/bin/bash
# scripts/verify-all.sh

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           KB-FIRST PHASE 8: FINAL VERIFICATION            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

TOTAL_ERRORS=0
PASSED=0
FAILED=0

run_check() {
  local name=$1
  local script=$2

  echo "Running $name..."
  if bash "$script"; then
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
  fi
  echo ""
}

run_check "8.1 Code Scan" "scripts/8.1-code-scan.sh"
run_check "8.2 Import Verification" "scripts/8.2-import-check.sh"
run_check "8.3 Source Return Check" "scripts/8.3-source-check.sh"
run_check "8.4 Startup Verification" "scripts/8.4-startup-check.sh"
run_check "8.5 Fallback Pattern Check" "scripts/8.5-fallback-check.sh"
run_check "8.6 Expert Attribution" "scripts/8.6-attribution-check.sh"
run_check "8.7 Confidence Scores" "scripts/8.7-confidence-check.sh"
run_check "8.8 Gap Logging" "scripts/8.8-gap-logging-check.sh"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                      RESULTS                              ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Passed: $PASSED/8                                            ║"
echo "║  Failed: $FAILED/8                                            ║"
echo "╠═══════════════════════════════════════════════════════════╣"

if [ $TOTAL_ERRORS -eq 0 ]; then
  echo "║  ✅ ALL CHECKS PASSED - APPLICATION COMPLETE              ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "║  ❌ $TOTAL_ERRORS CHECK(S) FAILED - FIX BEFORE COMPLETION       ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  exit 1
fi
```

---

## Swarm Configuration for Phase 8

```yaml
phase_8_swarm:
  topology: mesh
  strategy: parallel
  maxAgents: 8

  agents:
    - type: specialist
      name: code-scanner
      task: "8.1"
      script: "scripts/8.1-code-scan.sh"

    - type: specialist
      name: import-checker
      task: "8.2"
      script: "scripts/8.2-import-check.sh"

    - type: specialist
      name: source-checker
      task: "8.3"
      script: "scripts/8.3-source-check.sh"

    - type: specialist
      name: startup-checker
      task: "8.4"
      script: "scripts/8.4-startup-check.sh"

    - type: specialist
      name: fallback-checker
      task: "8.5"
      script: "scripts/8.5-fallback-check.sh"

    - type: specialist
      name: attribution-checker
      task: "8.6"
      script: "scripts/8.6-attribution-check.sh"

    - type: specialist
      name: confidence-checker
      task: "8.7"
      script: "scripts/8.7-confidence-check.sh"

    - type: specialist
      name: gap-checker
      task: "8.8"
      script: "scripts/8.8-gap-logging-check.sh"

  parallel_groups:
    - [code-scanner, import-checker, source-checker, startup-checker]
    - [fallback-checker, attribution-checker, confidence-checker, gap-checker]

  aggregation:
    type: all_must_pass
    on_failure: report_and_halt
```

---

## Exit Criteria

All 8 sub-phases must pass:

```
[ ] 8.1 Code Scan: No hardcoded values
[ ] 8.2 Import Check: All domain files import kb/
[ ] 8.3 Source Check: All returns have kbSources
[ ] 8.4 Startup Check: verifyConnection called first
[ ] 8.5 Fallback Check: No fallback patterns
[ ] 8.6 Attribution Check: All nodes have experts
[ ] 8.7 Confidence Check: All nodes have scores
[ ] 8.8 Gap Logging: Gap detection active
```

**Only mark complete when ALL boxes are checked.**

---

## Completion & Delta Report

When all checks pass, generate the final delta report:

```
╔═══════════════════════════════════════════════════════════╗
║              🎉 KB-FIRST TRANSFORMATION COMPLETE          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  BEFORE (Phase 0)          AFTER (Phase 8)                ║
║  ──────────────────        ────────────────               ║
║  KB Quality:     47        KB Quality:     99             ║
║  App Compliance: 32        App Compliance: 100            ║
║                                                           ║
║  DELTA: +52 KB | +68 App                                  ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  Phase Completion:                                        ║
║    ✅ Phase 0: Assessment                                 ║
║    ✅ Phase 1: Storage                                    ║
║    ✅ Phase 2: KB Creation (8/8 sub-phases)               ║
║    ✅ Phase 3: Persistence                                ║
║    ✅ Phase 4: Visualization                              ║
║    ✅ Phase 5: Integration                                ║
║    ✅ Phase 6: Scaffold                                   ║
║    ✅ Phase 7: Build (7/7 sub-phases)                     ║
║    ✅ Phase 8: Verification (8/8 sub-phases)              ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  The application now:                                     ║
║    • Grounds all responses in expert knowledge            ║
║    • Provides full traceability for every answer          ║
║    • Detects and logs knowledge gaps                      ║
║    • Cannot function without its knowledge base           ║
║    • Uses appropriate intelligence layer                  ║
╚═══════════════════════════════════════════════════════════╝
```
