# Project Intentions Template

Updated: 2026-01-01 20:15:00 EST | Version 1.0.0
Created: 2026-01-01 20:15:00 EST

## Instructions

Fill out this template before starting a KB-First project. This ensures Claude understands your goals and can execute phases correctly.

**Save as:** `PROJECT_INTENTIONS.md` in your project root.

---

## 1. Project Overview

### Project Name
<!-- What is this project called? -->

```
Name:
```

### One-Liner
<!-- Describe in one sentence what this application does -->

```
Description:
```

### Problem Statement
<!-- What problem does this solve? Who has this problem? -->

```
Problem:
```

### Target Users
<!-- Who will use this application? -->

```
Users:
```

---

## 2. Intelligence Pattern

### Which pattern fits best?

Check ONE:

- [ ] **Decision Web (GNN)** — Changing one variable affects many others
  - Examples: Retirement planning, medical diagnosis, investment portfolios

- [ ] **Combinatorial Routing (Attention)** — Route queries to different expert domains
  - Examples: Travel optimizer, customer support, resource allocation

- [ ] **Scenario Learning (SONA)** — "What worked for people like me?" is core value
  - Examples: Business simulator, strategy advisor, personalized coaching

- [ ] **Continuous Optimization** — Ongoing monitoring and adaptation loop
  - Examples: SEO optimizer, trading system, adaptive marketing

- [ ] **Unsure** — Let Claude analyze and recommend

---

## 3. Knowledge Domain

### Primary Domain
<!-- What expertise area does this KB cover? -->

```
Domain:
```

### Key Topics (list 5-10)
<!-- What specific topics must the KB include? -->

```
1.
2.
3.
4.
5.
```

### Known Experts (list 3-5)
<!-- Who are recognized experts in this domain? -->

```
1.
2.
3.
```

### Existing Resources
<!-- Do you have existing content to seed the KB? -->

- [ ] No existing content (start from scratch)
- [ ] Some documents/articles
- [ ] Substantial existing KB
- [ ] Access to APIs/databases with content

If yes, describe:
```
Resources:
```

---

## 4. Application Requirements

### Core Features (must have)
<!-- What MUST this application do? -->

```
1.
2.
3.
```

### Nice-to-Have Features
<!-- What would be good but not essential? -->

```
1.
2.
```

### User Interface
<!-- What kind of UI do you need? -->

- [ ] Web application (React/Next.js)
- [ ] API only (headless)
- [ ] CLI tool
- [ ] Chatbot interface
- [ ] Mobile app
- [ ] Other: _______________

### Performance Requirements
<!-- Any specific speed/scale requirements? -->

```
Response time target:
Expected users:
Data volume:
```

---

## 5. Technical Constraints

### Deployment Target

- [ ] Local development only
- [ ] Docker
- [ ] Railway
- [ ] Vercel
- [ ] AWS/GCP/Azure
- [ ] Other: _______________

### Database

- [ ] Use ruvector-postgres (recommended)
- [ ] Existing PostgreSQL
- [ ] Other: _______________

### Existing Tech Stack
<!-- What technologies are already in use? -->

```
Languages:
Frameworks:
Database:
Other:
```

---

## 6. Quality Requirements

### KB Quality Target

- [ ] Standard (≥98 score) — Recommended
- [ ] Higher (≥99 score) — Critical applications
- [ ] Lower (≥95 score) — MVP/prototype only

### Testing Requirements

- [ ] Full test suite (unit, integration, e2e)
- [ ] Basic tests (unit + integration)
- [ ] Minimal tests (critical paths only)

### Compliance Needs

- [ ] None
- [ ] HIPAA
- [ ] GDPR
- [ ] SOC2
- [ ] Other: _______________

---

## 7. Timeline & Effort

### Target Completion
<!-- When do you need this done? -->

```
Deadline:
```

### Effort Allocation

- [ ] Full build (9 phases, 29 sub-phases)
- [ ] MVP first, then iterate
- [ ] Phase 2 only (KB creation)
- [ ] Specific phases: _______________

---

## 8. Success Criteria

### How do you know it's done?
<!-- What must be true for this project to be successful? -->

```
1.
2.
3.
```

### How will you measure success?
<!-- Metrics, KPIs, user feedback? -->

```
Metrics:
```

---

## 9. Additional Context

### Any other information Claude should know?

```
Notes:
```

---

## Validation

Before proceeding, confirm:

- [ ] I have filled out all required sections
- [ ] I have chosen an intelligence pattern (or marked "Unsure")
- [ ] I have listed at least 5 key topics
- [ ] I have defined core features
- [ ] I understand this will take significant effort

**Signature:** __________________ **Date:** __________

---

## For Claude

When this file is present in the project root, Claude will:

1. Read and parse all sections
2. Confirm understanding with user
3. Recommend intelligence pattern if "Unsure" was selected
4. Proceed to Phase 1 with clear direction
5. Reference this document throughout all phases

**This file replaces the interactive questioning in Phase 0.1 for greenfield projects.**
