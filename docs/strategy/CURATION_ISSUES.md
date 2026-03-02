# Ask-RuvNet KB Curation Issues & Actionable Fixes

**Baseline Date**: 2026-02-28  
**Status**: Pre-Curation Issues Documented  
**Overall Baseline Score**: 91/100

---

## Issue #1: Reinforcement Learning Fragmentation (CRITICAL)

**Severity**: CRITICAL  
**Impact**: Test 10 Score: 5/10  
**Query**: "reinforcement", "policy gradient", "DQN"  
**Problem**: One comprehensive document (ID: 376579) followed by 4 fragments (IDs: 1294, 1297, 1301, 1303)

**Database Details**:
```sql
-- Master document (KEEP)
SELECT id, title, quality_score, LENGTH(content) as content_length
FROM ask_ruvnet.architecture_docs
WHERE id = 376579;
-- Result: "RuvNet Stack Reinforcement Learning Algorithms" | 100 | full length

-- Fragment duplicates (DELETE/MERGE)
SELECT id, title, quality_score, LENGTH(content), triage_tier
FROM ask_ruvnet.architecture_docs
WHERE id IN (1294, 1297, 1301, 1303);
-- Results: All have [6]/[7]/[10]/[11] suffixes | 90 | silver tier
```

**Action Items**:
1. [ ] Verify content of IDs 1294, 1297, 1301, 1303 are true duplicates (compare title + content hash)
2. [ ] If duplicates: DELETE rows 1294, 1297, 1301, 1303 from architecture_docs
3. [ ] If fragments: Merge content into ID 376579, then DELETE originals
4. [ ] Re-test query to verify only master doc appears in top-5
5. [ ] Update triage_tier on master doc if needed

**Expected Result**: Test 10 score improves 5/10 → 9/10

---

## Issue #2: HNSW vs IVF Comparison Gap (HIGH)

**Severity**: HIGH  
**Impact**: Test 3 Score: 9/10 (could be 10/10)  
**Query**: "HNSW", "IVF"  
**Problem**: Individual docs exist for each, but no direct comparison document

**Current Results**:
- ID 217300: "IVF for coarse partitioning" (100/100) - narrow
- ID 779926: "How Does RuVector Work? HNSW Indexing..." (99/100) - HNSW focused
- ID 376709: "What Is HNSW? The Highway System..." (99/100) - HNSW only
- ID 376882: "HNSW Vector Search: Why RuVector is 150x-12,500x Faster..." (99/100) - performance focus

**Missing**: Side-by-side comparison document

**Action Items**:
1. [ ] Create new document: "HNSW vs IVF: Choosing the Right Vector Index"
   - Include: What each does, tradeoffs, when to use each, performance comparisons
   - Quality target: 99/100
   - Triage tier: gold
2. [ ] Reference existing docs within new comparison doc
3. [ ] Verify new doc retrieves in top-3 for query "HNSW vs IVF"

**Expected Result**: Test 3 score improves 9/10 → 10/10

---

## Issue #3: MinCut Algorithm Depth Gap (MEDIUM)

**Severity**: MEDIUM  
**Impact**: Test 9 Score: 8/10 (could be 9/10)  
**Query**: "MinCut", "graph partitioning"  
**Problem**: Good application docs, but algorithm theory/walkthrough sparse

**Current Results**:
- ID 376804: "MinCut: How AI Systems Self-Heal..." (99/100) - concept
- ID 376649: "RuVector MinCut: Dynamic Graph Partitioning..." (98/100) - concept
- ID 376652: "MinCut-Gated Transformer..." (98/100) - application
- ID 234232: "Temporal Attractor Networks..." (90/100) - tangential
- ID 216543: "ruvector-mincut-wasm" (90/100) - code reference

**Missing**: Algorithm explanation + step-by-step walkthrough

**Action Items**:
1. [ ] Create new document: "How MinCut Algorithm Works: Step-by-Step Walkthrough"
   - Include: Mathematical foundation, algorithm pseudocode, worked example, complexity analysis
   - Quality target: 99/100
   - Triage tier: gold
2. [ ] Review IDs 234232, 216543 - consider reclassifying from gold to silver/bronze if minimal content
3. [ ] Verify new doc retrieves in top-3 for query "MinCut algorithm"

**Expected Result**: Test 9 score improves 8/10 → 9/10

---

## Issue #4: Garbage Tier Documents (HIGH)

**Severity**: HIGH  
**Impact**: KB bloat (13.6% of KB = 23,838 docs)  
**Quality**: Avg 30.68/100 (fragments, noise, duplicates)  
**Problem**: Poor documents degrading retrieval quality

**Database Details**:
```sql
SELECT COUNT(*) as garbage_count, AVG(quality_score) as avg_quality
FROM ask_ruvnet.architecture_docs
WHERE triage_tier = 'garbage' AND is_duplicate = false;
-- Result: 23,838 | 30.68
```

**Action Items**:
1. [ ] Analyze garbage tier sample (100-200 docs) to categorize issues:
   - True duplicates (merge/delete)
   - Fragments (merge into parent docs)
   - Corrupted data (delete)
   - Mis-classified silver/bronze (reclassify)
2. [ ] Generate action list: Which docs to delete vs. reclassify
3. [ ] Execute deletion/reclassification
4. [ ] Target: Remove ~80% of garbage tier (reduce from 23,838 → ~5,000)

**Expected Impact**: 
- Overall KB quality improves (fewer low-quality results in retrieval)
- Query relevance increases
- Baseline score improves 91/100 → 93/100

---

## Issue #5: Flagged Duplicates (HIGH)

**Severity**: HIGH  
**Impact**: KB noise (566 flagged duplicates)  
**Quality**: All quality_score duplicated  
**Problem**: Redundant content taking up space + potentially confusing search

**Database Details**:
```sql
SELECT COUNT(*) FROM ask_ruvnet.architecture_docs WHERE is_duplicate = true;
-- Result: 566
```

**Action Items**:
1. [ ] Query all flagged duplicates with their parent documents:
```sql
SELECT id, title, quality_score, is_duplicate
FROM ask_ruvnet.architecture_docs
WHERE is_duplicate = true
ORDER BY quality_score DESC;
```
2. [ ] For each duplicate, verify:
   - Is there a master document with higher quality?
   - Is content identical or just similar?
   - Should duplicate be deleted or merged?
3. [ ] Execute deletion/consolidation
4. [ ] Target: Reduce from 566 → 0 flagged duplicates

**Expected Impact**: 
- Cleaner KB without redundant entries
- Baseline score improves 91/100 → 92/100

---

## Issue #6: Silver Tier Quality Variability (MEDIUM)

**Severity**: MEDIUM  
**Impact**: Large gray middle (60.7% of KB = 106,120 docs)  
**Quality**: Avg 82.33/100 (HIGH variance)  
**Problem**: Unpredictable quality in majority of KB

**Database Details**:
```sql
SELECT quality_score, COUNT(*) as count
FROM ask_ruvnet.architecture_docs
WHERE is_duplicate = false AND triage_tier = 'silver'
GROUP BY quality_score
ORDER BY quality_score DESC;
-- Shows distribution of silver tier scores (likely 70-95 range)
```

**Action Items**:
1. [ ] Analyze silver tier quality distribution - find clustering
2. [ ] Identify high-quality silver docs (85+) - consider promoting to gold
3. [ ] Identify low-quality silver docs (<75) - consider demoting to bronze
4. [ ] Update triage_tier for misclassified documents
5. [ ] Target: Consolidate silver tier quality to 80-88 range (reduce variance)

**Expected Impact**:
- More consistent retrieval quality
- Better relevance ranking
- Baseline score improves 91/100 → 92-93/100

---

## Issue #7: Test 8 Tangential Result (LOW)

**Severity**: LOW  
**Impact**: Test 8 Score: 9/10 (cosmetic, not functional)  
**Query**: "SONA", "self-optim", "neural arch"  
**Problem**: Rank 2 result is tangentially related ("What Is a Knowledge Base?")

**Current Result**:
- ID 376713: "What Is a Knowledge Base? Your AI Personal Library" (99/100, gold)
  - This is about knowledge bases, not SONA specifically
  - But the search logic includes it (broad query matching)

**Action Items**:
1. [ ] This is low priority - the query IS very broad
2. [ ] Consider if this is a feature (broad teaching) or bug (narrow search)
3. [ ] If tightening desired: Add document with title including BOTH "SONA" and "knowledge base"
4. [ ] Otherwise: Leave as-is (current behavior is acceptable)

**Expected Result**: Test 8 score stays 9/10 (cosmetic improvement only)

---

## Summary of Curation Actions

| Priority | Issue | Current | Target | Impact |
|----------|-------|---------|--------|--------|
| 🔴 CRITICAL | Test 10 Fragmentation | 5/10 | 9/10 | +4 points |
| 🟠 HIGH | Test 3 Comparison Gap | 9/10 | 10/10 | +1 point |
| 🟠 HIGH | Garbage Tier Cleanup | 23,838 docs | ~5,000 docs | Major quality improvement |
| 🟠 HIGH | Flagged Duplicates | 566 docs | 0 docs | Clean up noise |
| 🟡 MEDIUM | Test 9 Algorithm Depth | 8/10 | 9/10 | +1 point |
| 🟡 MEDIUM | Silver Tier Consistency | High variance | 80-88 range | Better ranking |
| 🟢 LOW | Test 8 Tangential | 9/10 | 9-10/10 | Cosmetic |

**Overall Impact**: 91/100 → 94-96/100 (estimated)

---

## Implementation Checklist

- [ ] Issue #1: Consolidate RL algorithm fragments
- [ ] Issue #2: Create HNSW vs IVF comparison doc
- [ ] Issue #3: Create MinCut algorithm walkthrough doc
- [ ] Issue #4: Analyze and clean garbage tier
- [ ] Issue #5: Merge/delete flagged duplicates
- [ ] Issue #6: Reclassify mislabeled silver tier docs
- [ ] Issue #7: Consider SONA tangential result (optional)
- [ ] Re-run baseline test after all changes
- [ ] Verify improvement from 91/100 to target 94-96/100

---

**Recommendation**: Start with Issues #1, #4, #5 (highest impact, clearest actionable steps).

