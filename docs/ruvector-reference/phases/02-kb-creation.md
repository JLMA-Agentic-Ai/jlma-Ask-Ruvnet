# Phase 2: World-Class Knowledge Base Creation

## Purpose

Create a knowledge base that represents the collective expertise of the **top 100 world experts** on the topic. This is not a simple FAQ — it's a comprehensive, structured repository of domain knowledge.

---

## Overview

This phase has 8 sub-phases:

| Sub-Phase | Purpose | Quality Criteria |
|-----------|---------|------------------|
| 2.1 | Domain Scoping | Formal definition established |
| 2.2 | Perspective Expansion | All user types and questions identified |
| 2.3 | Expert Discovery | 100 experts, 500+ content, 1000+ insights |
| 2.4 | Completeness Audit | 30+ gaps identified |
| 2.5 | Gap Filling | All gaps addressed with sources |
| 2.6 | Structure Organization | ≤9 primary nodes |
| 2.7 | Recursive Depth | Actual data at all leaves |
| 2.8 | Quality Loop | Score ≥98/100 |

**Do not skip sub-phases.** Each builds on the previous.

---

## Phase 2.1: Domain Scoping

### Purpose
Formally define the domain to ensure complete coverage.

### Process

Use this prompt:
```
You are defining the complete scope of the domain: [TOPIC]

Before identifying specific topics, establish formal boundaries:

1. FORMAL DEFINITION
   - What is the academic/professional definition of this field?
   - What discipline(s) does it belong to?
   - How is it distinguished from adjacent fields?

2. ADJACENT FIELDS
   - What related fields overlap with this domain?
   - What topics are OUT of scope?
   - What topics are shared between fields?

3. SUB-DISCIPLINES
   - What are the major recognized sub-areas?
   - What professional certifications exist?
   - What academic programs cover this field?

4. HISTORICAL CONTEXT
   - How has this field evolved?
   - What are the major schools of thought?
   - What paradigm shifts have occurred?

5. CURRENT STATE
   - What are the active debates?
   - What's cutting edge?
   - What's considered settled knowledge?

Output a structured domain scope document.
```

### Output
A formal domain scope document with clear boundaries.

### Quality Gate
- [ ] Formal definition documented
- [ ] Adjacent fields identified with boundaries
- [ ] Sub-disciplines listed
- [ ] Historical context captured
- [ ] Current debates noted

---

## Phase 2.2: Perspective Expansion

### Purpose
Ensure the KB serves all potential users and questions.

### Process

Use this prompt:
```
For the domain: [TOPIC]

Identify all perspectives that the KB must serve:

1. USER TYPES
   - Who are the primary users? (e.g., beginners, professionals)
   - Who are secondary users?
   - What are their expertise levels?
   - What are their goals?

2. QUESTION TYPES
   - What factual questions do people ask?
   - What "how do I..." questions?
   - What "should I..." questions?
   - What comparison questions?
   - What "what if..." questions?

3. USE CASES
   - Educational use cases
   - Professional use cases
   - Personal decision-making use cases
   - Research use cases

4. EDGE CASES
   - What unusual situations arise?
   - What exceptions to general rules exist?
   - What misconceptions need addressing?

5. INTERACTION PATTERNS
   - One-time queries vs. ongoing guidance
   - Simple lookups vs. complex analysis
   - General advice vs. personalized recommendations

Output a comprehensive perspective map.
```

### Output
A perspective map covering all users, questions, and use cases.

### Quality Gate
- [ ] At least 5 user types identified
- [ ] At least 50 question types documented
- [ ] Edge cases explicitly listed
- [ ] Interaction patterns defined

---

## Phase 2.3: Expert Discovery & Knowledge Extraction

### Purpose
Identify and extract knowledge from the top 100 world experts.

### Process

**Step 1: Identify Experts**

Use prompt from `./prompts/expert-discovery.md`:
```
For the domain: [TOPIC]

Identify the top 100 world experts. For each expert provide:
- Full name with credentials
- Primary affiliation
- Key contributions (3-5 bullet points)
- Most cited work
- Where to find their content (books, papers, websites, podcasts)

Categories to cover:
- Academic researchers (30+)
- Practitioners/professionals (30+)
- Authors/educators (20+)
- Industry leaders (10+)
- Emerging voices (10+)

Output as structured list with categories.
```

**Step 2: Extract Content**

For each expert, extract:
- Core concepts they've contributed
- Unique frameworks or models
- Key insights and findings
- Practical recommendations
- Contrarian or nuanced views

Target: **500+ distinct content items**

**Step 3: Synthesize Insights**

Cross-reference experts to identify:
- Points of consensus
- Points of disagreement
- Complementary perspectives
- Evolution of thinking over time

Target: **1000+ insights** (including relationships between concepts)

### Output
- List of 100 experts with metadata
- 500+ content items with attribution
- 1000+ insights with sources

### Quality Gate
- [ ] 100 experts identified across all categories
- [ ] Each expert has verifiable credentials and sources
- [ ] 500+ content items extracted
- [ ] All content has expert attribution
- [ ] 1000+ insights documented

---

## Phase 2.4: Completeness Audit

### Purpose
Identify gaps in the knowledge base.

### Process

Use prompt from `./prompts/completeness-audit.md`:
```
Review the knowledge base for [TOPIC] and identify gaps:

1. COVERAGE GAPS
   - What sub-topics have <3 expert sources?
   - What user questions can't be answered?
   - What use cases aren't supported?

2. DEPTH GAPS  
   - Where is coverage superficial?
   - What topics lack practical examples?
   - What lacks quantitative data?

3. PERSPECTIVE GAPS
   - What viewpoints are missing?
   - What user types are underserved?
   - What expertise levels lack content?

4. TEMPORAL GAPS
   - What historical context is missing?
   - What recent developments aren't covered?
   - What emerging topics need addition?

5. STRUCTURAL GAPS
   - What relationships between concepts are unclear?
   - What prerequisites aren't explained?
   - What comparisons are missing?

For each gap:
- Describe specifically what's missing
- Rate importance (critical/high/medium/low)
- Suggest sources to fill it

Target: Identify 30+ gaps.
```

### Output
Gap analysis document with 30+ identified gaps.

### Quality Gate
- [ ] 30+ gaps identified
- [ ] Each gap has importance rating
- [ ] Each gap has suggested sources
- [ ] Critical gaps flagged for priority

---

## Phase 2.5: Gap Filling

### Purpose
Address all identified gaps with quality content.

### Process

For each gap (starting with critical/high importance):

1. **Research** — Find authoritative sources
2. **Extract** — Pull relevant content with attribution
3. **Integrate** — Add to appropriate place in KB
4. **Verify** — Ensure gap is adequately addressed

### Output
All gaps addressed with sourced content.

### Quality Gate
- [ ] All critical gaps filled
- [ ] All high-importance gaps filled
- [ ] Each fill has expert attribution
- [ ] Re-audit shows no critical gaps remaining

---

## Phase 2.6: Structure Organization

### Purpose
Organize all content into a navigable structure.

### Constraint
**Maximum 9 primary nodes** (cognitive limit for comprehension)

### Process

```
Organize all [TOPIC] knowledge into a hierarchical structure:

CONSTRAINTS:
- Maximum 9 top-level nodes
- Each node can have unlimited children
- Leaf nodes contain actual content
- No orphan content

PRINCIPLES:
- MECE (Mutually Exclusive, Collectively Exhaustive)
- User mental models (how do people think about this?)
- Progressive disclosure (simple → complex)
- Multiple access paths (can reach content different ways)

Output:
1. The 9 (or fewer) primary nodes with descriptions
2. Second-level breakdown for each
3. Rationale for organization
```

### Output
- Primary node structure (≤9 nodes)
- Second-level breakdown
- Organization rationale

### Quality Gate
- [ ] ≤9 primary nodes
- [ ] All content has a home
- [ ] Structure follows MECE principle
- [ ] Rationale documented

---

## Phase 2.7: Recursive Depth Expansion

### Purpose
Ensure actual data exists at all leaf nodes.

### Process

For each branch:
1. **Expand** until you reach atomic content
2. **Verify** leaf nodes have actual data (not just labels)
3. **Add examples** where appropriate
4. **Cross-reference** related content

### Leaf Node Requirements

Every leaf node must have:
- **Title** — Clear, descriptive name
- **Content** — Actual information (not a placeholder)
- **Expert Source** — Who said this?
- **Source URL** — Where can it be verified?
- **Confidence** — How reliable is this? (0.0-1.0)
- **Metadata** — Tags, related nodes, etc.

### Output
Complete tree with data at all leaves.

### Quality Gate
- [ ] No empty leaf nodes
- [ ] All leaves have expert attribution
- [ ] All leaves have confidence scores
- [ ] Cross-references in place

---

## Phase 2.8: Quality Enhancement Loop

### Purpose
Iterate until KB quality reaches ≥98/100.

### Process

Use prompt from `./prompts/quality-critique.md`:
```
Critically evaluate this knowledge base on a scale of 0-100:

SCORING CRITERIA (weight):
1. Completeness (25%) — Does it cover the full domain?
2. Accuracy (25%) — Is the information correct?
3. Attribution (15%) — Are sources properly cited?
4. Structure (15%) — Is it well-organized?
5. Depth (10%) — Is there sufficient detail?
6. Currency (10%) — Is it up to date?

For each criterion:
- Score 0-100
- Specific weaknesses found
- Specific improvements needed

Overall score = weighted average

If score < 98:
- List top 10 improvements needed
- Prioritize by impact
```

### Loop
1. Score current KB
2. If score ≥98, exit loop
3. Implement top improvements
4. Re-score
5. Repeat until ≥98

### Output
KB scoring ≥98/100 with documented improvements.

### Quality Gate
- [ ] Final score ≥98/100
- [ ] All criterion scores documented
- [ ] Improvement history logged
- [ ] No critical weaknesses remaining

---

## Phase 2 Complete

When all sub-phases pass their quality gates:

**Proceed to Phase 3: Persistence & Verification**
