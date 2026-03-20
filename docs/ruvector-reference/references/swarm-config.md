# Swarm Configuration for KB-First

Updated: 2026-01-01 19:50:00 EST | Version 1.0.0
Created: 2026-01-01 19:50:00 EST

## Purpose

This document defines swarm configurations for parallel execution of KB-First phases. Use these configurations to maximize throughput while respecting phase dependencies.

---

## Phase Dependency Graph

```
Phase 0 (Assessment)
    │
    ▼
Phase 1 (Storage) ─────────────────────────────────────┐
    │                                                   │
    ▼                                                   │
Phase 2 (KB Creation)                                   │
    │                                                   │
    │  ┌─────────────────────────────────────────┐     │
    │  │ PARALLEL: 2.2, 2.3, 2.4                 │     │
    │  │ (Perspective, Experts, Audit)           │     │
    │  └─────────────────────────────────────────┘     │
    │                                                   │
    ▼                                                   │
Phase 3 (Persistence)                                   │
    │                                                   │
    ├───────────────────┐                               │
    ▼                   ▼                               │
Phase 4            Phase 5                              │
(Visualization)    (Integration)                        │
    │                   │                               │
    └───────────────────┘                               │
                │                                       │
                ▼                                       │
          Phase 6 (Scaffold) ◄──────────────────────────┘
                │
                ▼
          Phase 7 (Build)
                │
    ┌───────────┴───────────────────────────────────┐
    │ PARALLEL: 7.3 domain functions                │
    │ (Each function can be implemented in parallel)│
    └───────────────────────────────────────────────┘
                │
                ▼
          Phase 8 (Verification)
                │
    ┌───────────┴───────────────────────────────────┐
    │ PARALLEL: 8.1-8.8 verification checks         │
    │ (All checks run simultaneously)               │
    └───────────────────────────────────────────────┘
                │
                ▼
            COMPLETE
```

---

## Master Swarm Configuration

```yaml
# swarm-config.yaml
# KB-First Application Builder - Swarm Orchestration

version: "1.0.0"
name: kb-first-orchestrator

global:
  topology: hierarchical
  maxAgents: 16
  strategy: adaptive
  gate_enforcement: strict

coordinator:
  type: coordinator
  name: kb-first-master
  capabilities:
    - orchestrate_phases
    - enforce_gates
    - track_scores
    - report_delta

phases:
  # ═══════════════════════════════════════════════════════════════
  # PHASE 0: Assessment (Brownfield Only)
  # ═══════════════════════════════════════════════════════════════
  phase_0:
    name: "Assessment"
    condition: "app_type == 'brownfield'"
    topology: star
    maxAgents: 4

    agents:
      - type: analyst
        name: kb-scorer
        task: "0.2 Score KB"
        parallel_group: 1

      - type: analyst
        name: app-scorer
        task: "0.3 Score App"
        parallel_group: 1

      - type: specialist
        name: gap-reporter
        task: "0.4 Generate Gaps"
        depends_on: [kb-scorer, app-scorer]

      - type: coordinator
        name: scope-calculator
        task: "0.5 Calculate Scope"
        depends_on: [gap-reporter]

    gate:
      type: user_confirmation
      prompt: "Type PROCEED to continue"
      timeout: 300  # 5 minutes

  # ═══════════════════════════════════════════════════════════════
  # PHASE 1: Storage Setup
  # ═══════════════════════════════════════════════════════════════
  phase_1:
    name: "Storage"
    topology: single
    maxAgents: 1

    agents:
      - type: specialist
        name: storage-setup
        task: "Start DB, verify connection, init schema"

    gate:
      type: script
      command: "psql $DATABASE_URL -c 'SELECT 1'"
      expected_exit_code: 0

  # ═══════════════════════════════════════════════════════════════
  # PHASE 2: KB Creation (8 sub-phases)
  # ═══════════════════════════════════════════════════════════════
  phase_2:
    name: "KB Creation"
    topology: mesh
    maxAgents: 6

    sub_phases:
      # Sequential: 2.1 first
      - id: "2.1"
        name: "Domain Scoping"
        agents: 1
        sequential: true

      # Parallel block: 2.2, 2.3, 2.4
      - id: "2.2"
        name: "Perspective Expansion"
        agents: 1
        parallel_group: 1

      - id: "2.3"
        name: "Expert Discovery"
        agents: 2  # More agents for research
        parallel_group: 1

      - id: "2.4"
        name: "Completeness Audit"
        agents: 1
        parallel_group: 1

      # Sequential: 2.5 after parallel block
      - id: "2.5"
        name: "Gap Filling"
        agents: 2
        depends_on: ["2.2", "2.3", "2.4"]

      # Sequential: 2.6, 2.7, 2.8
      - id: "2.6"
        name: "Structure Organization"
        agents: 1
        depends_on: ["2.5"]

      - id: "2.7"
        name: "Recursive Depth"
        agents: 2
        depends_on: ["2.6"]

      - id: "2.8"
        name: "Quality Loop"
        agents: 1
        depends_on: ["2.7"]
        loop_until: "kb_score >= 98"

    gate:
      type: score_threshold
      metric: kb_score
      threshold: 98
      on_fail: loop_to_2_8

  # ═══════════════════════════════════════════════════════════════
  # PHASE 3: Persistence
  # ═══════════════════════════════════════════════════════════════
  phase_3:
    name: "Persistence"
    topology: single
    maxAgents: 2

    agents:
      - type: specialist
        name: embedding-generator
        task: "Generate embeddings for all nodes"

      - type: specialist
        name: persistence-writer
        task: "Insert to DB, create index"
        depends_on: [embedding-generator]

    gate:
      type: sql_check
      query: "SELECT COUNT(*) FROM kb_nodes WHERE embedding IS NOT NULL"
      condition: "result == total_nodes"

  # ═══════════════════════════════════════════════════════════════
  # PHASES 4 & 5: Parallel (Visualization + Integration)
  # ═══════════════════════════════════════════════════════════════
  phase_4_5_parallel:
    name: "Visualization & Integration"
    topology: mesh
    maxAgents: 3

    agents:
      - type: specialist
        name: visualizer
        task: "Phase 4: Generate visualization"
        parallel_group: 1

      - type: specialist
        name: sdk-generator
        task: "Phase 5: Generate TypeScript SDK"
        parallel_group: 1

    gate:
      type: multi_check
      checks:
        - name: visualization
          type: file_exists
          path: "visualization/index.html"
        - name: sdk
          type: compile_check
          command: "cd src/kb && tsc --noEmit"

  # ═══════════════════════════════════════════════════════════════
  # PHASE 6: Scaffold
  # ═══════════════════════════════════════════════════════════════
  phase_6:
    name: "Scaffold"
    topology: single
    maxAgents: 1

    agents:
      - type: specialist
        name: scaffolder
        task: "Create directory structure, KB_ENFORCEMENT.md"

    gate:
      type: multi_check
      checks:
        - file_exists: "KB_ENFORCEMENT.md"
        - dir_exists: "src/domain"
        - dir_exists: "src/kb"

  # ═══════════════════════════════════════════════════════════════
  # PHASE 7: Build (7 sub-phases)
  # ═══════════════════════════════════════════════════════════════
  phase_7:
    name: "Build"
    topology: mesh
    maxAgents: 8

    sub_phases:
      - id: "7.1"
        name: "Generate KB_ENFORCEMENT.md"
        agents: 1
        sequential: true

      - id: "7.2"
        name: "Plan Domain Functions"
        agents: 1
        depends_on: ["7.1"]

      - id: "7.3"
        name: "Implement Domain Functions"
        agents: 4  # Parallel implementation
        parallel_mode: per_function
        depends_on: ["7.2"]
        verify_each: true

      - id: "7.4"
        name: "Implement API Layer"
        agents: 2
        depends_on: ["7.3"]

      - id: "7.5"
        name: "Implement Entry Point"
        agents: 1
        depends_on: ["7.3"]

      - id: "7.6"
        name: "Implement UI"
        agents: 2
        depends_on: ["7.4"]

      - id: "7.7"
        name: "Integration Testing"
        agents: 1
        depends_on: ["7.4", "7.5", "7.6"]

    gate:
      type: script
      command: "./scripts/verify-phase-7.sh"
      expected_exit_code: 0

  # ═══════════════════════════════════════════════════════════════
  # PHASE 8: Verification (8 sub-phases - ALL PARALLEL)
  # ═══════════════════════════════════════════════════════════════
  phase_8:
    name: "Verification"
    topology: mesh
    maxAgents: 8

    sub_phases:
      - id: "8.1"
        name: "Code Scan"
        parallel_group: 1
        script: "scripts/8.1-code-scan.sh"

      - id: "8.2"
        name: "Import Verification"
        parallel_group: 1
        script: "scripts/8.2-import-check.sh"

      - id: "8.3"
        name: "Source Return Check"
        parallel_group: 1
        script: "scripts/8.3-source-check.sh"

      - id: "8.4"
        name: "Startup Verification"
        parallel_group: 1
        script: "scripts/8.4-startup-check.sh"

      - id: "8.5"
        name: "Fallback Pattern Check"
        parallel_group: 2
        script: "scripts/8.5-fallback-check.sh"

      - id: "8.6"
        name: "Expert Attribution"
        parallel_group: 2
        script: "scripts/8.6-attribution-check.sh"

      - id: "8.7"
        name: "Confidence Scores"
        parallel_group: 2
        script: "scripts/8.7-confidence-check.sh"

      - id: "8.8"
        name: "Gap Logging"
        parallel_group: 2
        script: "scripts/8.8-gap-logging-check.sh"

    gate:
      type: all_must_pass
      on_fail: report_and_halt

# ═══════════════════════════════════════════════════════════════
# SCORING CONFIGURATION
# ═══════════════════════════════════════════════════════════════
scoring:
  kb_quality:
    expert_coverage:
      max_points: 25
      formula: "(unique_experts / 100) * 25"
    depth:
      max_points: 25
      levels:
        4: 25
        3: 18
        2: 12
        1: 6
        0: 0
    completeness:
      max_points: 25
      formula: "(1 - (gaps / total_topics)) * 25"
    attribution:
      max_points: 15
      formula: "(nodes_with_sources / total_nodes) * 15"
    confidence:
      max_points: 10
      formula: "avg_confidence * 10"

  app_compliance:
    kb_imports:
      max_points: 20
      formula: "(importing_files / domain_files) * 20"
    source_returns:
      max_points: 20
      formula: "(with_sources / total_returns) * 20"
    no_hardcode:
      max_points: 20
      formula: "max(0, 20 - (violations * 2))"
    startup_verify:
      max_points: 20
      condition: "verifyConnection in entry point"
    no_fallbacks:
      max_points: 20
      formula: "max(0, 20 - (fallbacks * 4))"

# ═══════════════════════════════════════════════════════════════
# DELTA TRACKING
# ═══════════════════════════════════════════════════════════════
delta_tracking:
  enabled: true
  capture_points:
    - phase: 0
      metrics: [kb_score, app_score]
      label: "BEFORE"
    - phase: 8
      metrics: [kb_score, app_score]
      label: "AFTER"

  report_format: |
    ╔═══════════════════════════════════════════════════════════╗
    ║              TRANSFORMATION DELTA REPORT                  ║
    ╠═══════════════════════════════════════════════════════════╣
    ║  Metric          Before    After     Delta                ║
    ║  ─────────────   ──────    ─────     ─────                ║
    ║  KB Quality:     {before_kb}      {after_kb}       {delta_kb}     ║
    ║  App Compliance: {before_app}      {after_app}       {delta_app}     ║
    ╚═══════════════════════════════════════════════════════════╝
```

---

## Agent Type Definitions

| Agent Type | Purpose | Capabilities |
|------------|---------|--------------|
| coordinator | Orchestrate phases, enforce gates | orchestrate, gate_check, report |
| analyst | Research and scoring | query_db, web_search, calculate |
| specialist | Execute specific tasks | read_file, write_file, run_script |
| researcher | Deep content gathering | web_search, extract, synthesize |
| optimizer | Improve quality | analyze, refactor, enhance |

---

## Execution Commands

### Full Run (Greenfield)
```bash
npx claude-flow swarm:run --config swarm-config.yaml --skip-phase-0
```

### Full Run (Brownfield)
```bash
npx claude-flow swarm:run --config swarm-config.yaml
```

### Single Phase
```bash
npx claude-flow swarm:run --config swarm-config.yaml --phase 2
```

### Resume from Phase
```bash
npx claude-flow swarm:run --config swarm-config.yaml --resume-from 5
```

### Dry Run (Score Only)
```bash
npx claude-flow swarm:run --config swarm-config.yaml --phases 0 --dry-run
```

---

## Performance Optimization

### Parallel Execution Windows

| Phase | Parallel Agents | Expected Time Reduction |
|-------|-----------------|------------------------|
| Phase 2 (2.2-2.4) | 4 | 60% faster |
| Phase 4+5 | 2 | 50% faster |
| Phase 7.3 | 4+ | Scales with function count |
| Phase 8 | 8 | 80% faster |

### Resource Allocation

```yaml
resource_hints:
  phase_2:
    memory: high     # Research-heavy
    network: high    # Web searches
    cpu: medium

  phase_3:
    memory: high     # Embedding generation
    network: low
    cpu: high        # Computation

  phase_7:
    memory: medium
    network: low
    cpu: medium

  phase_8:
    memory: low
    network: low     # Local checks
    cpu: medium
```
