#!/usr/bin/env node
/**
 * test-quality-audit.mjs — Comprehensive quality audit for Ask-RuvNet
 *
 * Tests 5 dimensions from agentic-qe patterns:
 * 1. KB completeness — does it know everything about RuvNet?
 * 2. Retrieval quality — does it find the right content?
 * 3. Response quality — does it answer compellingly?
 * 4. On-ramp effectiveness — does it make the technology approachable?
 * 5. Competitive positioning — does it differentiate clearly?
 *
 * Usage: node scripts/test-quality-audit.mjs [--production]
 */

const BASE = process.argv.includes('--production')
  ? 'https://ask-ruvnet.up.railway.app'
  : 'http://localhost:3000';

const TESTS = [
  // Dimension 1: KB Completeness
  {
    dim: 'KB Completeness',
    q: 'What is RuVector and what are its core components?',
    expect: ['HNSW', 'PostgreSQL', 'RVF', 'WASM', '290'],
    weight: 'critical'
  },
  {
    dim: 'KB Completeness',
    q: 'What is Ruflo and how does agent orchestration work?',
    expect: ['swarm', 'agent', 'topology', 'hooks', 'npx'],
    weight: 'critical'
  },
  {
    dim: 'KB Completeness',
    q: 'What is AIMDS and how does it protect AI systems?',
    expect: ['Lyapunov', 'chaos', 'layer', 'detection', 'security'],
    weight: 'critical'
  },
  {
    dim: 'KB Completeness',
    q: 'What is Pi Brain and collective intelligence?',
    expect: ['collective', 'shared', 'memory', 'session', 'pi.ruv.io'],
    weight: 'critical'
  },

  // Dimension 2: Retrieval Quality
  {
    dim: 'Retrieval Quality',
    q: 'How does HNSW indexing work in RuVector?',
    expect: ['graph', 'neighbor', 'layer', 'search', '61'],
    weight: 'high'
  },
  {
    dim: 'Retrieval Quality',
    q: 'What is the RVF cognitive container format?',
    expect: ['segment', 'binary', 'WASM', '5.5', 'container'],
    weight: 'high'
  },

  // Dimension 3: Response Quality (the 5 hard rules)
  {
    dim: 'Response Quality',
    q: 'What is RuvNet?',
    checks: ['analogy', 'tradeoff', 'whyMatters', 'competitive', 'nextStep'],
    weight: 'critical'
  },
  {
    dim: 'Response Quality',
    q: 'How do I build a multi-agent system?',
    checks: ['analogy', 'tradeoff', 'whyMatters', 'competitive', 'nextStep'],
    weight: 'critical'
  },

  // Dimension 4: On-ramp Effectiveness
  {
    dim: 'On-ramp',
    q: 'I have never heard of RuvNet. Why should I care?',
    expect: ['problem', 'fail', 'cost', 'better', 'try'],
    checks: ['approachable', 'noJargon', 'actionable'],
    weight: 'critical'
  },
  {
    dim: 'On-ramp',
    q: 'How do I get started with RuvNet in 5 minutes?',
    expect: ['npx', 'init', 'install', 'command'],
    checks: ['stepByStep', 'actionable'],
    weight: 'high'
  },

  // Dimension 5: Competitive Positioning
  {
    dim: 'Competitive',
    q: 'Why should I use RuVector instead of Pinecone?',
    expect: ['local', 'faster', 'PostgreSQL', 'WASM', 'data sovereignty'],
    checks: ['decisionFramework', 'honest'],
    weight: 'critical'
  },
  {
    dim: 'Competitive',
    q: 'What makes Ruflo different from LangChain and CrewAI?',
    expect: ['persistent', 'learning', 'swarm', 'memory', 'self'],
    checks: ['decisionFramework', 'honest'],
    weight: 'critical'
  },
];

function checkResponse(answer, test) {
  const results = {};
  const lower = answer.toLowerCase();

  // Check expected terms
  if (test.expect) {
    const found = test.expect.filter(t => lower.includes(t.toLowerCase()));
    results.termsFound = `${found.length}/${test.expect.length}`;
    results.termsMissing = test.expect.filter(t => !lower.includes(t.toLowerCase()));
    results.termsPass = found.length >= Math.ceil(test.expect.length * 0.6);
  }

  // Check structural quality
  if (test.checks) {
    if (test.checks.includes('analogy'))
      results.analogy = /like a|imagine|think of|similar to|conductor|orchestra|library|airport/i.test(answer);
    if (test.checks.includes('tradeoff'))
      results.tradeoff = /however|trade.?off|limitation|caveat|maxes out|cannot|won't|requires|downside/i.test(answer);
    if (test.checks.includes('whyMatters'))
      results.whyMatters = /this means|for you|your (team|company|engineers|data)|saves you/i.test(answer);
    if (test.checks.includes('competitive'))
      results.competitive = /unlike|compared to|traditional|Pinecone|LangChain|alternative|instead of|competitor/i.test(answer);
    if (test.checks.includes('nextStep'))
      results.nextStep = /npx|npm|try|get started|explore|ask me|learn more|visit/i.test(answer);
    if (test.checks.includes('approachable'))
      results.approachable = !/\b(eigenvalue|Laplacian|cohomology|spectral|hyperbolic)\b/.test(answer.substring(0, 500));
    if (test.checks.includes('noJargon'))
      results.noJargon = answer.substring(0, 300).split(' ').filter(w => w.length > 15).length < 3;
    if (test.checks.includes('actionable'))
      results.actionable = /`[^`]+`|npx|npm|curl|claude mcp/i.test(answer);
    if (test.checks.includes('stepByStep'))
      results.stepByStep = /step|1\.|first|then|next/i.test(answer);
    if (test.checks.includes('decisionFramework'))
      results.decisionFramework = /choose|when you need|if you|use .* when/i.test(answer);
    if (test.checks.includes('honest'))
      results.honest = /however|but|trade.?off|limitation|not|caveat/i.test(answer);
  }

  // Universal checks
  results.hasTLDR = /TL;DR|## TL/i.test(answer);
  results.hasImage = /!\[.*\]\(\/assets\//.test(answer);
  results.hasCitation = /\[Source/.test(answer);
  results.hasContent = answer.length > 500;

  return results;
}

async function runTests() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ASK-RUVNET QUALITY AUDIT`);
  console.log(`  Target: ${BASE}`);
  console.log(`  Tests: ${TESTS.length}`);
  console.log(`${'═'.repeat(60)}\n`);

  let passed = 0, failed = 0, warnings = 0;
  const dimScores = {};

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    console.log(`[${i+1}/${TESTS.length}] ${test.dim}: "${test.q.substring(0, 50)}..."`);

    try {
      const start = Date.now();
      const res = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: test.q }),
        signal: AbortSignal.timeout(120000),
      });
      const d = await res.json();
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const answer = d.answer || '';
      const sources = d.sources || [];

      if (!answer || answer.length < 100) {
        console.log(`  ❌ EMPTY RESPONSE (${elapsed}s)`);
        failed++;
        continue;
      }

      const results = checkResponse(answer, test);
      const checks = Object.entries(results);
      const failedChecks = checks.filter(([k, v]) => v === false);
      const passedChecks = checks.filter(([k, v]) => v === true);

      if (failedChecks.length === 0) {
        console.log(`  ✅ ${passedChecks.length} checks passed (${elapsed}s, ${sources.length} sources, ${answer.length} chars)`);
        passed++;
      } else if (failedChecks.length <= 2 && test.weight !== 'critical') {
        console.log(`  ⚠️  ${passedChecks.length} passed, ${failedChecks.length} failed: ${failedChecks.map(([k]) => k).join(', ')} (${elapsed}s)`);
        warnings++;
      } else {
        console.log(`  ❌ ${failedChecks.length} checks failed: ${failedChecks.map(([k]) => k).join(', ')} (${elapsed}s)`);
        failed++;
      }

      if (results.termsMissing?.length > 0) {
        console.log(`     Missing terms: ${results.termsMissing.join(', ')}`);
      }

      // Track dimension scores
      if (!dimScores[test.dim]) dimScores[test.dim] = { pass: 0, total: 0 };
      dimScores[test.dim].total++;
      if (failedChecks.length === 0) dimScores[test.dim].pass++;

    } catch (e) {
      console.log(`  ❌ ERROR: ${e.message}`);
      failed++;
    }

    // Small delay between queries to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Passed:   ${passed}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Warnings: ${warnings}`);
  console.log(`\n  Dimension Scores:`);
  for (const [dim, score] of Object.entries(dimScores)) {
    const pct = Math.round((score.pass / score.total) * 100);
    console.log(`    ${dim}: ${score.pass}/${score.total} (${pct}%)`);
  }
  console.log(`\n  Overall: ${Math.round((passed / TESTS.length) * 100)}%`);

  if (failed > 0) {
    console.log(`\n  ⛔ QUALITY AUDIT FAILED — ${failed} tests need attention`);
    process.exit(1);
  } else {
    console.log(`\n  🟢 QUALITY AUDIT PASSED`);
  }
}

runTests().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(2);
});
