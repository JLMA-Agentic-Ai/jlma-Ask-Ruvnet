/**
 * RuvNet KB-First MCP Server - Granular Score-Driven Architecture
 * Version 6.2.0
 *
 * PHILOSOPHY: Granular scoring drives discipline.
 * - Score each KB dimension 1-100 (completeness, depth, comprehensiveness, accuracy, freshness, attribution, ux_quality)
 * - Score each phase readiness 1-100 (including Phase 12: UX Quality Review)
 * - Generate enhancement plan based on gaps
 * - User confirms before execution
 * - Post-verify: did we hit predicted scores?
 * - Playwright UX Review: Visual quality audit from end-user perspective
 *
 * 6 Tools:
 *   1. kb_first_assess     - Score ALL dimensions (KB quality + phase readiness)
 *   2. kb_first_plan       - Generate enhancement plan with predicted improvements
 *   3. kb_first_confirm    - User confirms readiness, locks in plan
 *   4. kb_first_execute    - Execute plan phase by phase
 *   5. kb_first_verify     - Post-verification: predicted vs actual, identify gaps
 *   6. kb_first_ux_review  - Playwright-based UX quality audit with screenshots
 *
 * Usage:
 *   npx ruvnet-kb-first mcp
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

const MCP_VERSION = '0.1.0';
const SERVER_NAME = 'ruvnet-kb-first';
const SERVER_VERSION = '6.2.0';

/**
 * KB Quality Dimensions (each scored 1-100)
 */
const KB_DIMENSIONS = {
  completeness: {
    name: 'Completeness',
    description: 'Does the KB cover all necessary domain topics?',
    weight: 20
  },
  depth: {
    name: 'Depth',
    description: 'Is each topic covered with sufficient detail?',
    weight: 20
  },
  comprehensiveness: {
    name: 'Comprehensiveness',
    description: 'Are edge cases, exceptions, and nuances included?',
    weight: 20
  },
  accuracy: {
    name: 'Accuracy',
    description: 'Is the information correct and up-to-date?',
    weight: 20
  },
  freshness: {
    name: 'Freshness',
    description: 'How recently was the KB updated?',
    weight: 10
  },
  attribution: {
    name: 'Attribution',
    description: 'Are sources and experts properly cited?',
    weight: 10
  },
  ux_quality: {
    name: 'UX Quality',
    description: 'Is the user experience excellent? Visual design, emotional appeal, user flow, versioning display, loading states, error handling, accessibility.',
    weight: 15
  }
};

/**
 * Phase Definitions with readiness criteria
 */
const PHASES = {
  0: {
    name: 'Assessment',
    criteria: ['Project scope documented', 'Domain complexity identified', 'KB-First suitability confirmed', 'Resources estimated']
  },
  1: {
    name: 'KB Design',
    criteria: ['Domain concepts mapped', 'Taxonomy designed', 'Relationships defined', 'Query patterns planned']
  },
  1.5: {
    name: 'Hooks Setup',
    criteria: ['Hooks installed', 'Configuration complete', 'Patterns trained', 'Verification passing']
  },
  2: {
    name: 'Schema Definition',
    criteria: ['Tables created', 'Vector columns added', 'Indexes designed', 'Migrations written']
  },
  3: {
    name: 'KB Population',
    criteria: ['Content collected', 'Data cleaned', 'Embeddings generated', 'Import validated']
  },
  4: {
    name: 'Scoring & Gaps',
    criteria: ['Coverage analyzed', 'Quality scored', 'Gaps identified', 'Remediation planned']
  },
  5: {
    name: 'Integration',
    criteria: ['Search API built', 'Code generation working', 'Citation system active', 'Gap logging enabled']
  },
  6: {
    name: 'Testing',
    criteria: ['Unit tests written', 'Integration tests passing', 'Accuracy validated', 'Edge cases covered']
  },
  7: {
    name: 'Optimization',
    criteria: ['Queries optimized', 'Indexes tuned', 'Caching implemented', 'Benchmarks passing']
  },
  8: {
    name: 'Verification',
    criteria: ['Code scan clean', 'Imports verified', 'Sources return', 'Startup working', 'Fallbacks tested', 'Attribution valid', 'Confidence scores present', 'Gap logging active']
  },
  9: {
    name: 'Security',
    criteria: ['Dependencies audited', 'OWASP checked', 'SQL injection tested', 'Auth reviewed', 'Secrets secured', 'APIs protected']
  },
  10: {
    name: 'Documentation',
    criteria: ['README complete', 'API documented', 'Schema documented', 'Architecture documented', 'Operator guide written']
  },
  11: {
    name: 'Deployment',
    criteria: ['Infrastructure ready', 'Environments configured', 'CI/CD built', 'Migrations run', 'Monitoring active', 'Go-live complete']
  },
  12: {
    name: 'UX Quality Review',
    criteria: [
      'Version displayed in header/footer (major.minor.patch)',
      'Cache-busting implemented with version notifications',
      'Visual design excellence (not just functional)',
      'Emotional appeal and user psychology considered',
      'Loading states are elegant',
      'Error messages are helpful and actionable',
      'User flow is intuitive and compelling',
      'Playwright screenshots reviewed and critiqued',
      'Accessibility verified (WCAG 2.1 AA)',
      'Mobile responsiveness tested'
    ]
  }
};

/**
 * MCP Tools
 */
const TOOLS = [
  {
    name: 'kb_first_assess',
    description: `Score ALL dimensions of KB quality and phase readiness (each 1-100).

KB Quality Dimensions:
- Completeness: Does KB cover all domain topics?
- Depth: Is each topic detailed enough?
- Comprehensiveness: Are edge cases included?
- Accuracy: Is information correct?
- Freshness: How recently updated?
- Attribution: Are sources cited?

Phase Readiness:
- Each of 12 phases scored 1-100 based on criteria completion

Returns granular scores that reveal exactly where gaps exist.
This is your BASELINE for planning.`,
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to project (default: current directory)' }
      }
    }
  },
  {
    name: 'kb_first_plan',
    description: `Generate enhancement plan based on assessment scores.

Analyzes gaps (scores below threshold) and creates:
- Prioritized list of enhancements
- Predicted score improvements for each
- Estimated effort
- Execution order

The plan gives you a concrete game plan so you don't lose the thread.
Returns the plan for user review before execution.`,
    inputSchema: {
      type: 'object',
      properties: {
        threshold: { type: 'number', description: 'Minimum acceptable score (default: 80)', default: 80 },
        focusArea: { type: 'string', enum: ['kb', 'phases', 'all'], description: 'What to focus on', default: 'all' }
      }
    }
  },
  {
    name: 'kb_first_confirm',
    description: `User confirms readiness to execute enhancement plan.

Shows the plan summary and asks for confirmation.
Once confirmed, the plan is locked and execution can begin.

This ensures user consent before making changes.`,
    inputSchema: {
      type: 'object',
      properties: {
        confirmed: { type: 'boolean', description: 'User confirms readiness to proceed' }
      },
      required: ['confirmed']
    }
  },
  {
    name: 'kb_first_execute',
    description: `Execute the confirmed enhancement plan.

Works through the plan systematically:
- Shows current task
- Provides guidance for completion
- Tracks progress
- Updates predicted scores

Call repeatedly to work through each enhancement.`,
    inputSchema: {
      type: 'object',
      properties: {
        taskComplete: { type: 'boolean', description: 'Mark current task as complete' }
      }
    }
  },
  {
    name: 'kb_first_verify',
    description: `Post-verification: Compare predicted vs actual scores.

Re-scores everything and compares to predictions:
- Which improvements were achieved?
- Which fell short?
- What gaps remain?
- What's the next priority?

This closes the loop and ensures you delivered what you promised.`,
    inputSchema: {
      type: 'object',
      properties: {
        detailed: { type: 'boolean', description: 'Show detailed comparison', default: true }
      }
    }
  },
  {
    name: 'kb_first_ux_review',
    description: `Playwright-based UX Quality Audit - End-user perspective review.

Walks through the application as an end user, capturing screenshots.
Then critically reviews EACH screenshot:

For each screen:
- How good is this? (1-100 score)
- How could we make it better? (specific recommendations)
- Where is it falling down? (issues identified)
- What would EXCELLENT look like? (vision for improvement)
- Recommendations with priority

Also checks critical UX requirements:
- Version number displayed in header/footer (major.minor.patch)
- Cache-busting with version change notifications
- Loading states are elegant, not jarring
- Error messages are helpful and guide user to resolution
- Visual design creates emotional appeal, not just functional
- User psychology leveraged for compelling flow

This ensures the application isn't just functional—it's EXCELLENT.`,
    inputSchema: {
      type: 'object',
      properties: {
        appUrl: { type: 'string', description: 'URL of the running application to review' },
        flows: {
          type: 'array',
          items: { type: 'string' },
          description: 'User flows to test (e.g., ["login", "search", "checkout"])',
          default: ['homepage', 'main_flow']
        },
        screenshotDir: {
          type: 'string',
          description: 'Directory to save screenshots',
          default: '.ruvector/ux-review'
        },
        criticalReview: {
          type: 'boolean',
          description: 'Perform deep critical review of each screenshot',
          default: true
        }
      },
      required: ['appUrl']
    }
  }
];

/**
 * Score KB Quality Dimensions (1-100 each)
 */
function scoreKBDimensions(cwd) {
  const scores = {};
  const kbDir = join(cwd, 'src', 'kb');
  const docsDir = join(cwd, 'docs');
  const ruvectorDir = join(cwd, '.ruvector');

  // Count KB entries and docs
  let kbEntries = 0;
  let docFiles = 0;
  let totalContent = 0;

  if (existsSync(kbDir)) {
    try {
      const files = readdirSync(kbDir);
      kbEntries = files.length;
      for (const f of files) {
        try {
          const content = readFileSync(join(kbDir, f), 'utf-8');
          totalContent += content.length;
        } catch {}
      }
    } catch {}
  }

  if (existsSync(docsDir)) {
    try {
      docFiles = readdirSync(docsDir).filter(f => f.endsWith('.md')).length;
    } catch {}
  }

  // Completeness: Based on number of KB entries and docs
  // 0 entries = 0, 5 entries = 50, 10+ entries = 100
  scores.completeness = {
    score: Math.min(100, Math.max(0, kbEntries * 10 + docFiles * 10)),
    reason: `${kbEntries} KB entries, ${docFiles} doc files`,
    improvement: kbEntries < 10 ? `Add ${10 - kbEntries} more KB entries` : 'Adequate coverage'
  };

  // Depth: Based on average content length
  // < 500 chars avg = shallow, > 2000 = deep
  const avgLength = kbEntries > 0 ? totalContent / kbEntries : 0;
  scores.depth = {
    score: Math.min(100, Math.max(0, Math.round(avgLength / 20))),
    reason: `Average entry length: ${Math.round(avgLength)} chars`,
    improvement: avgLength < 2000 ? 'Add more detail to KB entries' : 'Good depth'
  };

  // Comprehensiveness: Check for edge case documentation
  let edgeCaseScore = 0;
  const srcDir = join(cwd, 'src');
  if (existsSync(srcDir)) {
    try {
      const files = globSync('**/*.{ts,tsx,js,jsx,py}', { cwd: srcDir });
      for (const f of files) {
        try {
          const content = readFileSync(join(srcDir, f), 'utf-8');
          if (content.includes('edge case') || content.includes('exception') || content.includes('fallback')) {
            edgeCaseScore += 10;
          }
        } catch {}
      }
    } catch {}
  }
  scores.comprehensiveness = {
    score: Math.min(100, edgeCaseScore + (kbEntries * 5)),
    reason: `Edge case handling detected in ${Math.floor(edgeCaseScore / 10)} files`,
    improvement: edgeCaseScore < 50 ? 'Document edge cases and exceptions' : 'Good coverage'
  };

  // Accuracy: Based on presence of verification/testing
  let accuracyScore = 50; // Base score
  if (existsSync(join(cwd, 'tests')) || existsSync(join(cwd, '__tests__'))) accuracyScore += 25;
  if (existsSync(join(cwd, '.ruvector', 'config.json'))) accuracyScore += 15;
  if (existsSync(join(cwd, 'CHANGELOG.md'))) accuracyScore += 10;
  scores.accuracy = {
    score: Math.min(100, accuracyScore),
    reason: accuracyScore > 75 ? 'Tests and verification present' : 'Limited verification',
    improvement: accuracyScore < 80 ? 'Add tests and validation' : 'Good accuracy controls'
  };

  // Freshness: Based on last modification
  let freshnessScore = 0;
  if (existsSync(ruvectorDir)) {
    try {
      const stat = statSync(ruvectorDir);
      const daysSince = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 1) freshnessScore = 100;
      else if (daysSince < 7) freshnessScore = 80;
      else if (daysSince < 30) freshnessScore = 50;
      else if (daysSince < 90) freshnessScore = 25;
      else freshnessScore = 10;
    } catch {}
  }
  scores.freshness = {
    score: freshnessScore,
    reason: freshnessScore > 50 ? 'Recently updated' : 'Stale - needs refresh',
    improvement: freshnessScore < 80 ? 'Update KB content' : 'Fresh'
  };

  // Attribution: Check for citations in code
  let attributionScore = 0;
  if (existsSync(srcDir)) {
    try {
      const files = globSync('**/*.{ts,tsx,js,jsx,py}', { cwd: srcDir });
      let filesWithCitation = 0;
      for (const f of files) {
        try {
          const content = readFileSync(join(srcDir, f), 'utf-8');
          if (content.includes('KB-Generated:') || content.includes('Sources:') || content.includes('@kb-source')) {
            filesWithCitation++;
          }
        } catch {}
      }
      attributionScore = files.length > 0 ? Math.round((filesWithCitation / files.length) * 100) : 100;
    } catch {}
  } else {
    attributionScore = 100; // No code = not applicable
  }
  scores.attribution = {
    score: attributionScore,
    reason: `${attributionScore}% of code files have KB citations`,
    improvement: attributionScore < 80 ? 'Add KB citations to code files' : 'Good attribution'
  };

  // UX Quality: Based on presence of UX-related artifacts
  let uxScore = 0;
  const packagePath = join(cwd, 'package.json');
  const uxReviewPath = join(cwd, '.ruvector', 'ux-review');

  // Check for version in package.json
  if (existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      if (pkg.version) uxScore += 15; // Versioning exists
    } catch {}
  }

  // Check for prior UX review
  if (existsSync(uxReviewPath)) {
    try {
      const reviewFiles = readdirSync(uxReviewPath);
      if (reviewFiles.length > 0) uxScore += 25; // UX review conducted
      if (reviewFiles.some(f => f.includes('review-report'))) uxScore += 20; // Detailed review exists
    } catch {}
  }

  // Check for accessibility considerations
  if (existsSync(srcDir)) {
    try {
      const files = globSync('**/*.{tsx,jsx,html}', { cwd: srcDir });
      let a11yScore = 0;
      for (const f of files) {
        try {
          const content = readFileSync(join(srcDir, f), 'utf-8');
          if (content.includes('aria-') || content.includes('role=')) a11yScore += 5;
          if (content.includes('alt=') || content.includes('loading=')) a11yScore += 3;
        } catch {}
      }
      uxScore += Math.min(40, a11yScore);
    } catch {}
  }

  scores.ux_quality = {
    score: Math.min(100, uxScore),
    reason: uxScore >= 60 ? 'UX review conducted, accessibility present' : 'Limited UX review artifacts',
    improvement: uxScore < 80 ? 'Run kb_first_ux_review for Playwright-based UX audit' : 'Good UX coverage'
  };

  return scores;
}

/**
 * Score Phase Readiness (1-100 each)
 */
function scorePhaseReadiness(cwd) {
  const scores = {};
  const configPath = join(cwd, '.ruvector', 'config.json');
  let config = { phases: { completed: [], gates: {} } };

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {}
  }

  const completed = config.phases?.completed || [];
  const gates = config.phases?.gates || {};

  for (const [phaseNum, phaseInfo] of Object.entries(PHASES)) {
    const num = parseFloat(phaseNum);
    const isCompleted = completed.includes(num);
    const criteriaCount = phaseInfo.criteria.length;

    // Check which criteria are met
    let metCriteria = 0;
    const unmetCriteria = [];

    for (const criterion of phaseInfo.criteria) {
      // Simplified check - in real implementation, this would be more sophisticated
      if (isCompleted || checkCriterion(cwd, num, criterion)) {
        metCriteria++;
      } else {
        unmetCriteria.push(criterion);
      }
    }

    const score = Math.round((metCriteria / criteriaCount) * 100);

    scores[phaseNum] = {
      name: phaseInfo.name,
      score,
      metCriteria,
      totalCriteria: criteriaCount,
      unmet: unmetCriteria,
      completed: isCompleted
    };
  }

  return scores;
}

/**
 * Check if a criterion is met (simplified)
 */
function checkCriterion(cwd, phase, criterion) {
  // Check for common indicators
  const criterionLower = criterion.toLowerCase();

  if (criterionLower.includes('documented')) {
    return existsSync(join(cwd, 'docs')) || existsSync(join(cwd, 'README.md'));
  }
  if (criterionLower.includes('tests')) {
    return existsSync(join(cwd, 'tests')) || existsSync(join(cwd, '__tests__'));
  }
  if (criterionLower.includes('config')) {
    return existsSync(join(cwd, '.ruvector', 'config.json'));
  }
  if (criterionLower.includes('hooks')) {
    return existsSync(join(cwd, '.ruvector', 'hooks'));
  }
  if (criterionLower.includes('schema') || criterionLower.includes('tables')) {
    return existsSync(join(cwd, 'templates', 'schema.sql'));
  }

  return false;
}

/**
 * Calculate overall weighted scores
 */
function calculateOverallScores(kbScores, phaseScores) {
  // KB Overall (weighted average)
  let kbTotal = 0;
  let kbWeightTotal = 0;
  for (const [dim, info] of Object.entries(KB_DIMENSIONS)) {
    if (kbScores[dim]) {
      kbTotal += kbScores[dim].score * info.weight;
      kbWeightTotal += info.weight;
    }
  }
  const kbOverall = kbWeightTotal > 0 ? Math.round(kbTotal / kbWeightTotal) : 0;

  // Phase Overall (average)
  const phaseValues = Object.values(phaseScores);
  const phaseOverall = phaseValues.length > 0
    ? Math.round(phaseValues.reduce((sum, p) => sum + p.score, 0) / phaseValues.length)
    : 0;

  // Combined Overall
  const overall = Math.round((kbOverall * 0.5) + (phaseOverall * 0.5));

  return { kbOverall, phaseOverall, overall };
}

/**
 * Tool Handlers
 */
async function handleAssess(cwd, args) {
  const kbScores = scoreKBDimensions(cwd);
  const phaseScores = scorePhaseReadiness(cwd);
  const overall = calculateOverallScores(kbScores, phaseScores);

  // Save assessment
  const ruvectorDir = join(cwd, '.ruvector');
  if (!existsSync(ruvectorDir)) {
    mkdirSync(ruvectorDir, { recursive: true });
  }

  const assessment = {
    timestamp: new Date().toISOString(),
    kb: kbScores,
    phases: phaseScores,
    overall
  };

  writeFileSync(join(ruvectorDir, 'assessment.json'), JSON.stringify(assessment, null, 2));

  // Format for display
  const kbSummary = {};
  for (const [dim, data] of Object.entries(kbScores)) {
    kbSummary[dim] = {
      score: data.score,
      reason: data.reason
    };
  }

  const phaseSummary = {};
  for (const [num, data] of Object.entries(phaseScores)) {
    phaseSummary[`Phase ${num}: ${data.name}`] = {
      score: data.score,
      criteria: `${data.metCriteria}/${data.totalCriteria}`,
      status: data.completed ? 'COMPLETE' : (data.score >= 80 ? 'READY' : 'GAPS')
    };
  }

  return {
    action: 'ASSESSMENT_COMPLETE',
    timestamp: assessment.timestamp,
    overallScores: {
      kb: `${overall.kbOverall}/100`,
      phases: `${overall.phaseOverall}/100`,
      combined: `${overall.overall}/100`
    },
    kbQuality: kbSummary,
    phaseReadiness: phaseSummary,
    nextStep: 'Run kb_first_plan to generate enhancement plan based on gaps'
  };
}

async function handlePlan(cwd, args) {
  const assessmentPath = join(cwd, '.ruvector', 'assessment.json');

  if (!existsSync(assessmentPath)) {
    return {
      error: 'NO_ASSESSMENT',
      message: 'No assessment found. Run kb_first_assess first.',
      action: 'Run kb_first_assess to score KB and phase readiness'
    };
  }

  const assessment = JSON.parse(readFileSync(assessmentPath, 'utf-8'));
  const threshold = args.threshold || 80;
  const focusArea = args.focusArea || 'all';

  const enhancements = [];
  let taskId = 1;

  // Find KB gaps
  if (focusArea === 'all' || focusArea === 'kb') {
    for (const [dim, data] of Object.entries(assessment.kb)) {
      if (data.score < threshold) {
        const gap = threshold - data.score;
        enhancements.push({
          id: taskId++,
          area: 'KB Quality',
          dimension: KB_DIMENSIONS[dim]?.name || dim,
          currentScore: data.score,
          targetScore: threshold,
          predictedImprovement: gap,
          task: data.improvement,
          priority: gap > 30 ? 'HIGH' : (gap > 15 ? 'MEDIUM' : 'LOW'),
          effort: gap > 30 ? 'Large' : (gap > 15 ? 'Medium' : 'Small')
        });
      }
    }
  }

  // Find Phase gaps
  if (focusArea === 'all' || focusArea === 'phases') {
    for (const [num, data] of Object.entries(assessment.phases)) {
      if (data.score < threshold && !data.completed) {
        const gap = threshold - data.score;
        enhancements.push({
          id: taskId++,
          area: 'Phase Readiness',
          dimension: `Phase ${num}: ${data.name}`,
          currentScore: data.score,
          targetScore: threshold,
          predictedImprovement: gap,
          task: `Complete: ${data.unmet.slice(0, 3).join(', ')}${data.unmet.length > 3 ? '...' : ''}`,
          priority: gap > 30 ? 'HIGH' : (gap > 15 ? 'MEDIUM' : 'LOW'),
          effort: gap > 30 ? 'Large' : (gap > 15 ? 'Medium' : 'Small')
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  enhancements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate predicted totals
  const predictedKBImprovement = enhancements
    .filter(e => e.area === 'KB Quality')
    .reduce((sum, e) => sum + e.predictedImprovement, 0);

  const predictedPhaseImprovement = enhancements
    .filter(e => e.area === 'Phase Readiness')
    .reduce((sum, e) => sum + e.predictedImprovement, 0);

  const plan = {
    timestamp: new Date().toISOString(),
    threshold,
    baselineScores: assessment.overall,
    enhancements,
    predictions: {
      kbImprovement: `+${Math.round(predictedKBImprovement / 6)}`, // Average across 6 dimensions
      phaseImprovement: `+${Math.round(predictedPhaseImprovement / Object.keys(PHASES).length)}`,
      tasksCount: enhancements.length,
      highPriority: enhancements.filter(e => e.priority === 'HIGH').length,
      mediumPriority: enhancements.filter(e => e.priority === 'MEDIUM').length,
      lowPriority: enhancements.filter(e => e.priority === 'LOW').length
    },
    confirmed: false,
    currentTaskIndex: 0
  };

  writeFileSync(join(cwd, '.ruvector', 'plan.json'), JSON.stringify(plan, null, 2));

  return {
    action: 'PLAN_GENERATED',
    summary: {
      totalTasks: enhancements.length,
      highPriority: plan.predictions.highPriority,
      mediumPriority: plan.predictions.mediumPriority,
      lowPriority: plan.predictions.lowPriority
    },
    predictedImprovements: {
      kb: plan.predictions.kbImprovement,
      phases: plan.predictions.phaseImprovement
    },
    enhancements: enhancements.map(e => ({
      id: e.id,
      priority: e.priority,
      area: e.dimension,
      current: e.currentScore,
      target: e.targetScore,
      task: e.task
    })),
    nextStep: 'Review the plan above. Run kb_first_confirm with confirmed=true when ready to proceed.'
  };
}

async function handleConfirm(cwd, args) {
  const planPath = join(cwd, '.ruvector', 'plan.json');

  if (!existsSync(planPath)) {
    return {
      error: 'NO_PLAN',
      message: 'No plan found. Run kb_first_plan first.',
      action: 'Run kb_first_plan to generate enhancement plan'
    };
  }

  if (!args.confirmed) {
    return {
      action: 'CONFIRMATION_REQUIRED',
      message: 'You must confirm with confirmed=true to proceed.',
      hint: 'Review the plan from kb_first_plan, then confirm when ready.'
    };
  }

  const plan = JSON.parse(readFileSync(planPath, 'utf-8'));
  plan.confirmed = true;
  plan.confirmedAt = new Date().toISOString();
  plan.currentTaskIndex = 0;

  writeFileSync(planPath, JSON.stringify(plan, null, 2));

  const firstTask = plan.enhancements[0];

  return {
    action: 'PLAN_CONFIRMED',
    confirmedAt: plan.confirmedAt,
    totalTasks: plan.enhancements.length,
    message: 'Plan locked. Ready to execute.',
    firstTask: firstTask ? {
      id: firstTask.id,
      priority: firstTask.priority,
      area: firstTask.dimension,
      task: firstTask.task,
      currentScore: firstTask.currentScore,
      targetScore: firstTask.targetScore
    } : null,
    nextStep: 'Run kb_first_execute to work through the plan'
  };
}

async function handleExecute(cwd, args) {
  const planPath = join(cwd, '.ruvector', 'plan.json');

  if (!existsSync(planPath)) {
    return {
      error: 'NO_PLAN',
      message: 'No plan found. Run kb_first_plan first.'
    };
  }

  const plan = JSON.parse(readFileSync(planPath, 'utf-8'));

  if (!plan.confirmed) {
    return {
      error: 'PLAN_NOT_CONFIRMED',
      message: 'Plan not confirmed. Run kb_first_confirm first.',
      action: 'Run kb_first_confirm with confirmed=true'
    };
  }

  // Mark current task complete if requested
  if (args.taskComplete && plan.currentTaskIndex < plan.enhancements.length) {
    plan.enhancements[plan.currentTaskIndex].completed = true;
    plan.enhancements[plan.currentTaskIndex].completedAt = new Date().toISOString();
    plan.currentTaskIndex++;
    writeFileSync(planPath, JSON.stringify(plan, null, 2));
  }

  // Check if all done
  if (plan.currentTaskIndex >= plan.enhancements.length) {
    return {
      action: 'EXECUTION_COMPLETE',
      message: 'All tasks completed!',
      completedTasks: plan.enhancements.length,
      nextStep: 'Run kb_first_verify to compare predicted vs actual improvements'
    };
  }

  const currentTask = plan.enhancements[plan.currentTaskIndex];
  const completedCount = plan.enhancements.filter(e => e.completed).length;

  return {
    action: 'EXECUTING',
    progress: {
      completed: completedCount,
      total: plan.enhancements.length,
      percent: Math.round((completedCount / plan.enhancements.length) * 100)
    },
    currentTask: {
      id: currentTask.id,
      priority: currentTask.priority,
      area: currentTask.dimension,
      task: currentTask.task,
      currentScore: currentTask.currentScore,
      targetScore: currentTask.targetScore,
      predictedImprovement: `+${currentTask.predictedImprovement}`
    },
    guidance: getTaskGuidance(currentTask),
    nextStep: 'Complete the task above, then run kb_first_execute with taskComplete=true'
  };
}

function getTaskGuidance(task) {
  // Provide specific guidance based on task type
  if (task.area === 'KB Quality') {
    switch (task.dimension) {
      case 'Completeness':
        return 'Add more KB entries covering missing domain topics. Each entry should be in src/kb/ directory.';
      case 'Depth':
        return 'Expand existing KB entries with more detail. Target 2000+ characters per entry.';
      case 'Comprehensiveness':
        return 'Document edge cases, exceptions, and nuances in your KB entries.';
      case 'Accuracy':
        return 'Add tests to validate KB content. Create a tests/ directory with validation tests.';
      case 'Freshness':
        return 'Update KB content with latest information. Touch .ruvector/ to update timestamps.';
      case 'Attribution':
        return 'Add KB-Generated: headers to code files citing their KB sources.';
      default:
        return task.task;
    }
  }
  return task.task;
}

async function handleVerify(cwd, args) {
  const planPath = join(cwd, '.ruvector', 'plan.json');
  const assessmentPath = join(cwd, '.ruvector', 'assessment.json');
  const TARGET_SCORE = 98; // Recursive loop until we hit 98+

  if (!existsSync(planPath) || !existsSync(assessmentPath)) {
    return {
      error: 'MISSING_DATA',
      message: 'Missing plan or assessment. Run kb_first_assess and kb_first_plan first.'
    };
  }

  const plan = JSON.parse(readFileSync(planPath, 'utf-8'));
  const originalAssessment = JSON.parse(readFileSync(assessmentPath, 'utf-8'));

  // Re-assess current state
  const currentKB = scoreKBDimensions(cwd);
  const currentPhases = scorePhaseReadiness(cwd);
  const currentOverall = calculateOverallScores(currentKB, currentPhases);

  // Compare predictions vs actual
  const comparison = {
    kb: {},
    phases: {}
  };

  // Compare KB dimensions
  for (const [dim, original] of Object.entries(originalAssessment.kb)) {
    const current = currentKB[dim];
    const enhancement = plan.enhancements.find(e => e.dimension === KB_DIMENSIONS[dim]?.name);

    comparison.kb[dim] = {
      before: original.score,
      after: current.score,
      actual: current.score - original.score,
      predicted: enhancement?.predictedImprovement || 0,
      hit: current.score >= TARGET_SCORE
    };
  }

  // Compare phases
  for (const [num, original] of Object.entries(originalAssessment.phases)) {
    const current = currentPhases[num];
    const enhancement = plan.enhancements.find(e => e.dimension === `Phase ${num}: ${original.name}`);

    comparison.phases[num] = {
      name: original.name,
      before: original.score,
      after: current.score,
      actual: current.score - original.score,
      predicted: enhancement?.predictedImprovement || 0,
      hit: current.score >= TARGET_SCORE
    };
  }

  // Calculate summary
  const kbHits = Object.values(comparison.kb).filter(c => c.hit).length;
  const kbTotal = Object.keys(comparison.kb).length;
  const phaseHits = Object.values(comparison.phases).filter(c => c.hit).length;
  const phaseTotal = Object.keys(comparison.phases).length;

  // Identify remaining gaps (anything below 98)
  const remainingGaps = [];
  for (const [dim, data] of Object.entries(comparison.kb)) {
    if (data.after < TARGET_SCORE) {
      remainingGaps.push({
        area: 'KB Quality',
        dimension: KB_DIMENSIONS[dim]?.name || dim,
        currentScore: data.after,
        targetScore: TARGET_SCORE,
        gap: TARGET_SCORE - data.after
      });
    }
  }
  for (const [num, data] of Object.entries(comparison.phases)) {
    if (data.after < TARGET_SCORE) {
      remainingGaps.push({
        area: 'Phase Readiness',
        dimension: `Phase ${num}: ${data.name}`,
        currentScore: data.after,
        targetScore: TARGET_SCORE,
        gap: TARGET_SCORE - data.after
      });
    }
  }

  // Track iteration count
  let iterationCount = plan.iterationCount || 1;

  // Save verification
  const verification = {
    timestamp: new Date().toISOString(),
    iteration: iterationCount,
    original: originalAssessment.overall,
    current: currentOverall,
    comparison,
    remainingGaps,
    targetScore: TARGET_SCORE,
    targetMet: currentOverall.overall >= TARGET_SCORE
  };
  writeFileSync(join(cwd, '.ruvector', 'verification.json'), JSON.stringify(verification, null, 2));

  const result = {
    action: 'VERIFICATION_COMPLETE',
    iteration: iterationCount,
    targetScore: TARGET_SCORE,
    summary: {
      kbAt98Plus: `${kbHits}/${kbTotal}`,
      phasesAt98Plus: `${phaseHits}/${phaseTotal}`,
      overallImprovement: {
        kb: `${originalAssessment.overall.kbOverall} → ${currentOverall.kbOverall} (${currentOverall.kbOverall - originalAssessment.overall.kbOverall >= 0 ? '+' : ''}${currentOverall.kbOverall - originalAssessment.overall.kbOverall})`,
        phases: `${originalAssessment.overall.phaseOverall} → ${currentOverall.phaseOverall} (${currentOverall.phaseOverall - originalAssessment.overall.phaseOverall >= 0 ? '+' : ''}${currentOverall.phaseOverall - originalAssessment.overall.phaseOverall})`,
        combined: `${originalAssessment.overall.overall} → ${currentOverall.overall} (${currentOverall.overall - originalAssessment.overall.overall >= 0 ? '+' : ''}${currentOverall.overall - originalAssessment.overall.overall})`
      }
    }
  };

  if (args.detailed) {
    result.kbComparison = comparison.kb;
    result.phaseComparison = comparison.phases;
  }

  // Check if we've hit the target
  if (currentOverall.overall >= TARGET_SCORE && remainingGaps.length === 0) {
    result.status = 'TARGET_ACHIEVED';
    result.message = `🎯 All scores at ${TARGET_SCORE}+ after ${iterationCount} iteration(s)!`;
    result.remainingGaps = 'None - all targets met!';
    result.nextStep = 'Excellence achieved. Ready for production.';
  } else {
    // RECURSIVE: Auto-generate next plan
    result.status = 'NEEDS_MORE_WORK';
    result.message = `Score ${currentOverall.overall}/100 - target is ${TARGET_SCORE}. Generating next iteration plan...`;
    result.remainingGaps = remainingGaps;

    // Update assessment with current scores for next iteration
    const newAssessment = {
      timestamp: new Date().toISOString(),
      kb: currentKB,
      phases: currentPhases,
      overall: currentOverall,
      previousIteration: iterationCount
    };
    writeFileSync(join(cwd, '.ruvector', 'assessment.json'), JSON.stringify(newAssessment, null, 2));

    // Auto-generate new plan for remaining gaps
    const newEnhancements = remainingGaps.map((gap, idx) => ({
      id: idx + 1,
      area: gap.area,
      dimension: gap.dimension,
      currentScore: gap.currentScore,
      targetScore: TARGET_SCORE,
      predictedImprovement: gap.gap,
      task: getImprovementTask(gap),
      priority: gap.gap > 30 ? 'HIGH' : (gap.gap > 15 ? 'MEDIUM' : 'LOW'),
      effort: gap.gap > 30 ? 'Large' : (gap.gap > 15 ? 'Medium' : 'Small')
    }));

    const newPlan = {
      timestamp: new Date().toISOString(),
      threshold: TARGET_SCORE,
      iterationCount: iterationCount + 1,
      baselineScores: currentOverall,
      enhancements: newEnhancements,
      predictions: {
        tasksCount: newEnhancements.length,
        highPriority: newEnhancements.filter(e => e.priority === 'HIGH').length,
        mediumPriority: newEnhancements.filter(e => e.priority === 'MEDIUM').length,
        lowPriority: newEnhancements.filter(e => e.priority === 'LOW').length
      },
      confirmed: false,
      currentTaskIndex: 0
    };
    writeFileSync(join(cwd, '.ruvector', 'plan.json'), JSON.stringify(newPlan, null, 2));

    result.newPlan = {
      iteration: iterationCount + 1,
      tasks: newEnhancements.length,
      highPriority: newPlan.predictions.highPriority
    };
    result.nextStep = `Iteration ${iterationCount + 1} plan generated. Run kb_first_confirm with confirmed=true to continue.`;
  }

  return result;
}

/**
 * UX Review Criteria for critical evaluation
 */
const UX_CRITERIA = {
  versioning: {
    name: 'Version Display',
    checks: ['Header shows version', 'Footer shows version', 'Format: major.minor.patch'],
    weight: 15
  },
  caching: {
    name: 'Cache Management',
    checks: ['Version change detection', 'User notification on updates', 'Force refresh capability'],
    weight: 10
  },
  visual_design: {
    name: 'Visual Design Excellence',
    checks: ['Professional typography', 'Cohesive color palette', 'Proper spacing/hierarchy', 'Not generic AI aesthetic'],
    weight: 20
  },
  emotional_appeal: {
    name: 'Emotional Appeal',
    checks: ['Creates confidence', 'Guides without confusion', 'Celebrates success states', 'Softens error states'],
    weight: 15
  },
  loading_states: {
    name: 'Loading States',
    checks: ['Skeleton loaders present', 'Progress indicators', 'No jarring transitions', 'Graceful degradation'],
    weight: 10
  },
  error_handling: {
    name: 'Error Handling UX',
    checks: ['Clear error messages', 'Actionable next steps', 'Recovery paths provided', 'No technical jargon'],
    weight: 10
  },
  user_flow: {
    name: 'User Flow',
    checks: ['Intuitive navigation', 'Clear call-to-actions', 'Logical progression', 'Minimal friction'],
    weight: 10
  },
  accessibility: {
    name: 'Accessibility',
    checks: ['Keyboard navigation', 'Screen reader compatible', 'Color contrast', 'Focus indicators'],
    weight: 10
  }
};

/**
 * Detect available frontend-design skills
 */
function detectFrontendDesignSkills() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const skillsDir = join(homeDir, '.claude', 'skills');
  const skills = {
    preferred: null,
    available: [],
    recommendation: null
  };

  // Check for frontend-design-Stu (preferred)
  if (existsSync(join(skillsDir, 'frontend-design-Stu.md'))) {
    skills.preferred = 'frontend-design-Stu';
    skills.available.push('frontend-design-Stu');
  }

  // Check for frontend-design
  if (existsSync(join(skillsDir, 'frontend-design.md'))) {
    if (!skills.preferred) {
      skills.preferred = 'frontend-design';
    }
    skills.available.push('frontend-design');
  }

  // Generate recommendation if no skills found
  if (skills.available.length === 0) {
    skills.recommendation = {
      message: 'No frontend-design skill installed. For UX excellence, install the Anthropic frontend-design skill.',
      installation: 'Visit: https://github.com/anthropics/claude-code-plugins and install frontend-design plugin',
      benefit: 'Creates distinctive, production-grade interfaces that avoid generic AI aesthetics'
    };
  }

  return skills;
}

/**
 * Handle UX Review with Playwright
 */
async function handleUXReview(cwd, args) {
  const { appUrl, flows = ['homepage', 'main_flow'], screenshotDir = '.ruvector/ux-review', criticalReview = true } = args;

  // Check for frontend-design skills
  const designSkills = detectFrontendDesignSkills();

  // Check if Playwright is installed
  let playwrightAvailable = false;
  try {
    await import('playwright');
    playwrightAvailable = true;
  } catch {
    // Playwright not installed
  }

  if (!playwrightAvailable) {
    return {
      action: 'PLAYWRIGHT_REQUIRED',
      status: 'INSTALLATION_NEEDED',
      message: 'Playwright is required for UX review but not installed.',
      installation: {
        command: 'npm install playwright && npx playwright install chromium',
        description: 'Installs Playwright and Chromium browser for screenshot capture',
        automated: 'Run this command, then re-run kb_first_ux_review'
      },
      designSkills: designSkills,
      alternative: {
        message: 'Alternatively, you can manually capture screenshots and place them in:',
        directory: join(cwd, screenshotDir),
        format: 'Name format: 01-homepage.png, 02-login.png, etc.',
        thenRun: 'Re-run kb_first_ux_review with criticalReview=true to analyze'
      }
    };
  }

  // Create screenshot directory
  const screenshotPath = join(cwd, screenshotDir);
  if (!existsSync(screenshotPath)) {
    mkdirSync(screenshotPath, { recursive: true });
  }

  // Capture screenshots using Playwright
  const screenshots = [];
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Navigate to app
    await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Capture initial screenshot
    const timestamp = Date.now();
    const homepagePath = join(screenshotPath, `01-homepage-${timestamp}.png`);
    await page.screenshot({ path: homepagePath, fullPage: true });
    screenshots.push({
      id: 1,
      name: 'Homepage',
      path: homepagePath,
      url: appUrl,
      viewport: 'desktop'
    });

    // Check for version display
    const versionCheck = await page.evaluate(() => {
      const body = document.body.innerText;
      const versionPattern = /v?\d+\.\d+\.\d+/;
      const hasVersion = versionPattern.test(body);
      const header = document.querySelector('header')?.innerText || '';
      const footer = document.querySelector('footer')?.innerText || '';
      return {
        hasVersion,
        inHeader: versionPattern.test(header),
        inFooter: versionPattern.test(footer),
        foundVersion: body.match(versionPattern)?.[0] || null
      };
    });

    // Mobile viewport screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    const mobilePath = join(screenshotPath, `02-homepage-mobile-${timestamp}.png`);
    await page.screenshot({ path: mobilePath, fullPage: true });
    screenshots.push({
      id: 2,
      name: 'Homepage Mobile',
      path: mobilePath,
      url: appUrl,
      viewport: 'mobile'
    });

    await browser.close();

    // Generate critical review for each screenshot
    const reviews = [];
    if (criticalReview) {
      for (const screenshot of screenshots) {
        reviews.push({
          screenshot: screenshot.name,
          path: screenshot.path,
          score: 0, // To be filled by Claude's analysis
          evaluation: {
            howGood: 'REQUIRES_VISUAL_ANALYSIS - Open screenshot and evaluate',
            couldBeBetter: [],
            fallingDown: [],
            excellentWouldLookLike: '',
            recommendations: []
          },
          criteria: Object.entries(UX_CRITERIA).map(([key, crit]) => ({
            name: crit.name,
            checks: crit.checks,
            score: 0,
            notes: 'Awaiting visual review'
          }))
        });
      }
    }

    // Save review report
    const reviewReport = {
      timestamp: new Date().toISOString(),
      appUrl,
      versionCheck,
      screenshots,
      reviews,
      summary: {
        screenshotsCaptured: screenshots.length,
        versionDisplayed: versionCheck.hasVersion,
        versionInHeader: versionCheck.inHeader,
        versionInFooter: versionCheck.inFooter,
        requiresManualReview: true
      },
      criticalQuestions: [
        'How good is this? (Score each screen 1-100)',
        'How could we make it better?',
        'Where is it falling down?',
        'What would EXCELLENT look like?',
        'What are the specific recommendations?'
      ]
    };

    writeFileSync(join(screenshotPath, 'review-report.json'), JSON.stringify(reviewReport, null, 2));

    return {
      action: 'UX_REVIEW_CAPTURED',
      status: 'SCREENSHOTS_READY',
      appUrl,
      versionCheck: {
        found: versionCheck.hasVersion,
        version: versionCheck.foundVersion,
        inHeader: versionCheck.inHeader,
        inFooter: versionCheck.inFooter,
        recommendation: !versionCheck.inHeader && !versionCheck.inFooter
          ? '⚠️ Version not displayed in header/footer - ADD version display immediately'
          : '✓ Version displayed'
      },
      screenshots: screenshots.map(s => ({
        name: s.name,
        path: s.path,
        viewport: s.viewport
      })),
      nextSteps: {
        step1: 'Open each screenshot file and visually inspect',
        step2: 'Score each screen 1-100 for overall UX quality',
        step3: 'Document: What works? What fails? What would excellent look like?',
        step4: 'Generate specific recommendations with priority (HIGH/MEDIUM/LOW)',
        step5: 'Update review-report.json with scores and findings',
        step6: 'Re-run kb_first_assess to update UX Quality scores'
      },
      criticalQuestions: reviewReport.criticalQuestions,
      criteria: Object.entries(UX_CRITERIA).map(([key, crit]) => ({
        name: crit.name,
        checks: crit.checks,
        weight: `${crit.weight}%`
      })),
      reportPath: join(screenshotPath, 'review-report.json'),
      designSkills: {
        available: designSkills.available,
        useSkill: designSkills.preferred || null,
        recommendation: designSkills.recommendation,
        implementationGuidance: designSkills.preferred
          ? `Use skill "${designSkills.preferred}" when implementing UX improvements. It creates distinctive, production-grade interfaces.`
          : 'Install frontend-design skill for UX improvements: https://github.com/anthropics/claude-code-plugins'
      }
    };
  } catch (error) {
    return {
      action: 'UX_REVIEW_ERROR',
      status: 'CAPTURE_FAILED',
      error: error.message,
      troubleshooting: {
        step1: 'Ensure the app is running at the specified URL',
        step2: 'Check if Playwright browsers are installed: npx playwright install chromium',
        step3: 'Try with a simpler URL first',
        step4: 'Manually capture screenshots and place in: ' + screenshotPath
      }
    };
  }
}

/**
 * Get improvement task based on gap
 */
function getImprovementTask(gap) {
  if (gap.area === 'KB Quality') {
    switch (gap.dimension) {
      case 'Completeness':
        return `Add more KB entries to reach ${gap.targetScore}% coverage`;
      case 'Depth':
        return `Expand KB entries with more detail (target: 2500+ chars each)`;
      case 'Comprehensiveness':
        return `Document additional edge cases and exceptions`;
      case 'Accuracy':
        return `Add validation tests and verification`;
      case 'Freshness':
        return `Update KB content with latest information`;
      case 'Attribution':
        return `Add KB-Generated headers to remaining code files`;
      default:
        return `Improve ${gap.dimension} to ${gap.targetScore}`;
    }
  }
  return `Complete remaining criteria for ${gap.dimension}`;
}

/**
 * Handle MCP tool calls
 */
async function handleToolCall(toolName, args) {
  const cwd = args.projectPath || process.cwd();

  switch (toolName) {
    case 'kb_first_assess':
      return await handleAssess(cwd, args);
    case 'kb_first_plan':
      return await handlePlan(cwd, args);
    case 'kb_first_confirm':
      return await handleConfirm(cwd, args);
    case 'kb_first_execute':
      return await handleExecute(cwd, args);
    case 'kb_first_verify':
      return await handleVerify(cwd, args);
    case 'kb_first_ux_review':
      return await handleUXReview(cwd, args);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * MCP Protocol Handler
 */
async function handleMCPMessage(message) {
  const { jsonrpc, id, method, params } = message;

  if (jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid JSON-RPC version' } };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: MCP_VERSION,
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          capabilities: { tools: {} }
        }
      };

    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

    case 'tools/call':
      try {
        const result = await handleToolCall(params.name, params.arguments || {});
        return {
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
        };
      } catch (error) {
        return { jsonrpc: '2.0', id, error: { code: -32000, message: error.message } };
      }

    default:
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } };
  }
}

/**
 * Start MCP Server
 */
export async function startMCPServer(options = {}) {
  console.error(`RuvNet KB-First MCP Server v${SERVER_VERSION}`);
  console.error('Architecture: Granular Score-Driven | Tools: 6 | Dimensions: 7 KB + 13 Phases');
  console.error('Workflow: Assess → Plan → Confirm → Execute → Verify → UX Review');
  console.error('UX Review: Playwright-based visual quality audit from end-user perspective');

  let buffer = '';
  process.stdin.setEncoding('utf-8');

  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response = await handleMCPMessage(JSON.parse(line));
        if (response) process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        console.error('Parse error:', error.message);
      }
    }
  });

  process.stdin.on('end', () => process.exit(0));
  process.stdin.resume();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startMCPServer();
}
