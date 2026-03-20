# Hard Gates Reference

Updated: 2026-01-01 19:45:00 EST | Version 1.0.0
Created: 2026-01-01 19:45:00 EST

## Purpose

This document defines the **non-negotiable gates** between phases. These are not suggestions — they are hard stops that require explicit verification before proceeding.

---

## Gate Philosophy

```
⛔ A HARD GATE means:
   - You CANNOT proceed until ALL conditions are met
   - You MUST show verification output to the user
   - You MUST get explicit confirmation for brownfield apps
   - Assumptions are NOT acceptable
   - "Good enough" is NOT acceptable
```

---

## Gate Definitions

### ⛔ GATE 0 → 1: Assessment Complete

**Applies to:** Brownfield applications only

**Required:**
```
[ ] Application type detected
[ ] KB Quality Score calculated: ___/100
[ ] App Compliance Score calculated: ___/100
[ ] Gap report generated and shown to user
[ ] Transformation scope estimated
[ ] User typed "PROCEED" explicitly
```

**Verification command:**
```bash
./scripts/verify-gate-0.sh
```

**If ANY box is unchecked → DO NOT PROCEED**

---

### ⛔ GATE 1 → 2: Storage Ready

**Required:**
```
[ ] Docker container running (or equivalent)
[ ] Database connection verified
[ ] Schema created successfully
[ ] Test query returns results
```

**Verification command:**
```bash
psql "$DATABASE_URL" -c "SELECT 1" && echo "GATE 1 PASSED"
```

**If connection fails → DO NOT PROCEED**

---

### ⛔ GATE 2 → 3: KB Quality Achieved

**Required:**
```
[ ] KB Score ≥ 98/100
[ ] All 8 sub-phases completed:
    [ ] 2.1 Domain Scoping
    [ ] 2.2 Perspective Expansion
    [ ] 2.3 Expert Discovery (≥100 experts)
    [ ] 2.4 Completeness Audit
    [ ] 2.5 Gap Filling
    [ ] 2.6 Structure (≤9 primary nodes)
    [ ] 2.7 Recursive Depth
    [ ] 2.8 Quality Loop (score ≥98)
```

**Verification command:**
```bash
./scripts/score-kb.sh | grep "TOTAL" | awk '{print $NF}'
# Must return ≥98
```

**If score < 98 → LOOP BACK to 2.8**

---

### ⛔ GATE 3 → 4: Persistence Verified

**Required:**
```
[ ] All nodes persisted to database
[ ] Embeddings generated for all content
[ ] HNSW index created
[ ] Semantic search returns relevant results
[ ] Source attribution present on all nodes
```

**Verification command:**
```sql
SELECT
  COUNT(*) as total_nodes,
  SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embeddings,
  SUM(CASE WHEN source_expert IS NOT NULL THEN 1 ELSE 0 END) as with_sources
FROM kb_nodes WHERE namespace = $namespace;

-- All three counts must match
```

**If counts don't match → FIX before proceeding**

---

### ⛔ GATE 4 → 5: Visualization Works

**Required:**
```
[ ] Visualization HTML generated
[ ] All nodes render in tree
[ ] Click on node shows content + sources
[ ] Search functionality works
[ ] Statistics display correctly
```

**Verification:** Manual check or Playwright verification

**If visualization broken → FIX before proceeding**

---

### ⛔ GATE 5 → 6: SDK Compiles

**Required:**
```
[ ] All TypeScript files compile without errors
[ ] All exports work (import test passes)
[ ] verifyConnection() function exists
[ ] search() returns results with sources
[ ] gap logging function exists
```

**Verification command:**
```bash
cd src/kb && tsc --noEmit && echo "GATE 5 PASSED"
```

**If compilation fails → FIX before proceeding**

---

### ⛔ GATE 6 → 7: Scaffold Complete

**Required:**
```
[ ] Directory structure created
[ ] KB_ENFORCEMENT.md in project root
[ ] Entry point template exists
[ ] Domain directory ready
[ ] src/kb/ linked (read-only)
```

**Verification command:**
```bash
[ -f "KB_ENFORCEMENT.md" ] && \
[ -d "src/domain" ] && \
[ -d "src/kb" ] && \
echo "GATE 6 PASSED"
```

**If structure incomplete → CREATE before proceeding**

---

### ⛔ GATE 7 → 8: All Rules Enforced

**This is the STRICTEST gate. Every sub-phase must pass.**

**Required:**
```
[ ] 7.1 KB_ENFORCEMENT.md exists and in context
[ ] 7.2 Domain functions planned (list shown)
[ ] 7.3 Each domain function verified:
    [ ] Imports from kb/
    [ ] Returns kbSources
    [ ] No hardcoded values
[ ] 7.4 API routes pass through sources
[ ] 7.5 Entry point verifies KB first
[ ] 7.6 UI displays sources
[ ] 7.7 Integration tests pass
```

**Verification command:**
```bash
./scripts/verify-phase-7.sh
# Must return 0 errors
```

**If ANY verification fails → FIX before proceeding**

---

### ⛔ GATE 8 → COMPLETE: Final Verification

**Required:**
```
[ ] 8.1 Code scan passes (no hardcoded values)
[ ] 8.2 Import check passes (all domain files use kb/)
[ ] 8.3 Source check passes (all returns have kbSources)
[ ] 8.4 Startup check passes (verifyConnection first)
[ ] 8.5 Fallback check passes (no || DEFAULT patterns)
[ ] 8.6 Attribution check passes (all nodes have experts)
[ ] 8.7 Confidence check passes (all nodes have scores)
[ ] 8.8 Gap logging active
```

**Verification command:**
```bash
./scripts/verify-all.sh
# Must return "All checks passed!"
```

**If ANY check fails → FIX before marking complete**

---

## Gate Enforcement in Claude

When using this skill, Claude MUST:

1. **Show gate status** before claiming to proceed
2. **Run verification scripts** not just assume
3. **Present scores** to user for brownfield apps
4. **Wait for "PROCEED"** at Gate 0
5. **Loop back** if scores don't meet threshold
6. **Never skip** a gate under any circumstances

### Example Gate Output

```
╔═══════════════════════════════════════════════════════════╗
║                 ⛔ GATE 2 → 3 CHECK                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  KB Quality Score: 94/100                                 ║
║  Required: ≥98/100                                        ║
║                                                           ║
║  Status: ❌ GATE FAILED                                   ║
║                                                           ║
║  Action: Return to Phase 2.8 (Quality Loop)               ║
║          Improve score by 4 points                        ║
║          DO NOT PROCEED TO PHASE 3                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Swarm Gate Enforcement

When running in swarm mode, gates are enforced by the coordinator:

```yaml
gate_enforcement:
  mode: strict
  on_failure: halt_all_agents
  notification: immediate

  gate_checks:
    - gate: "0→1"
      condition: "user_typed_proceed == true"
      on_fail: "abort_with_message"

    - gate: "2→3"
      condition: "kb_score >= 98"
      on_fail: "loop_to_phase_2_8"

    - gate: "7→8"
      condition: "verify_phase_7_exit_code == 0"
      on_fail: "halt_and_fix"
```

---

## Gate Skip Prevention

Claude is PROHIBITED from:

```
❌ "I'll assume the KB is good enough"
❌ "Since we're short on time, let's skip verification"
❌ "The gate probably passes, continuing..."
❌ "I'll verify this later"
❌ "This looks fine, moving on"
```

Claude MUST:

```
✅ Run the verification script
✅ Show the output to the user
✅ Wait for explicit confirmation at Gate 0
✅ Loop back if threshold not met
✅ Fix issues before proceeding
```
