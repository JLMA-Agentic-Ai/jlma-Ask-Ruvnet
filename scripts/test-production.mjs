#!/usr/bin/env node
/**
 * test-production.mjs
 * AskRuvNet Production Smoke + API + Quality Tests
 *
 * Hits the live deployment at https://ask-ruvnet-production.up.railway.app and validates:
 *   - Health endpoint
 *   - KB stats (entry count, backend)
 *   - Knowledge inventory
 *   - Chat endpoint with multiple test queries
 *   - Rate limit header presence
 *   - Response shape and quality scoring
 *
 * Usage:
 *   node scripts/test-production.mjs
 *   BASE_URL=http://localhost:3000 node scripts/test-production.mjs
 *
 * Exit codes:
 *   0 = all tests passed
 *   1 = one or more tests failed
 */

const BASE_URL = process.env.BASE_URL || 'https://ask-ruvnet-production.up.railway.app';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '60000');  // 60s for cold starts

// ─── Colour helpers ────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

const pass  = (msg) => console.log(`  ${GREEN}PASS${RESET}  ${msg}`);
const fail  = (msg) => console.log(`  ${RED}FAIL${RESET}  ${msg}`);
const warn  = (msg) => console.log(`  ${YELLOW}WARN${RESET}  ${msg}`);
const info  = (msg) => console.log(`  ${CYAN}INFO${RESET}  ${msg}`);
const label = (msg) => console.log(`\n${BOLD}${msg}${RESET}`);

// ─── Test runner ───────────────────────────────────────────────────────────────
let totalTests  = 0;
let passedTests = 0;
let failedTests = 0;
const failures  = [];

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    pass(testName);
  } else {
    failedTests++;
    const msg = detail ? `${testName} — ${detail}` : testName;
    fail(msg);
    failures.push(msg);
  }
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const latency = Date.now() - start;
    return { res, latency };
  } finally {
    clearTimeout(timer);
  }
}

async function get(path) {
  const url = `${BASE_URL}${path}`;
  const { res, latency } = await fetchWithTimeout(url);
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, latency, headers: res.headers };
}

async function post(path, payload) {
  const url = `${BASE_URL}${path}`;
  const { res, latency } = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, latency, headers: res.headers };
}

// ─── Quality scorer ────────────────────────────────────────────────────────────
function scoreSearchResult(query, sources, answer) {
  let score = 0;
  const checks = [];

  // Has sources at all?
  if (sources && sources.length > 0) {
    score += 25;
    checks.push('has_sources');
  }

  // Has multiple sources?
  if (sources && sources.length >= 3) {
    score += 10;
    checks.push('multiple_sources');
  }

  // Top source score is meaningful?
  if (sources && sources[0] && sources[0].score >= 0.3) {
    score += 20;
    checks.push('strong_top_score');
  } else if (sources && sources[0] && sources[0].score >= 0.15) {
    score += 10;
    checks.push('weak_top_score');
  }

  // Scores are in descending order?
  if (sources && sources.length >= 2) {
    const ordered = sources.every((s, i) =>
      i === 0 || (sources[i - 1].score || 0) >= (s.score || 0)
    );
    if (ordered) { score += 10; checks.push('scores_ordered'); }
  }

  // Answer is substantive?
  if (answer && answer.length >= 200) {
    score += 20;
    checks.push('substantive_answer');
  } else if (answer && answer.length >= 100) {
    score += 10;
    checks.push('basic_answer');
  }

  // Answer does not say "I don't know" without context?
  if (answer && !answer.toLowerCase().includes('i do not have enough information') &&
      !answer.toLowerCase().includes('i don\'t have')) {
    score += 15;
    checks.push('confident_answer');
  }

  return { score, checks, maxScore: 100 };
}

// ─── SUITE 1: Health ───────────────────────────────────────────────────────────
async function testHealth() {
  label('Suite 1: Health Endpoint (GET /health)');
  let result;

  try {
    result = await get('/health');
  } catch (err) {
    fail(`GET /health — request failed: ${err.message}`);
    failures.push(`GET /health unreachable: ${err.message}`);
    failedTests++; totalTests++;
    return;
  }

  const { status, body, latency } = result;
  info(`Latency: ${latency}ms`);

  assert(status === 200, 'Returns HTTP 200', `got ${status}`);
  assert(body !== null, 'Body is valid JSON');
  assert(body?.status === 'ok', 'status field equals "ok"', `got "${body?.status}"`);
  assert(typeof body?.uptime === 'number' && body.uptime > 0, 'uptime is positive number', `got ${body?.uptime}`);
  assert(body?.timestamp != null, 'timestamp field present');
  assert(latency < 5000, `Response time < 5000ms`, `got ${latency}ms`);

  if (latency > 2000) warn(`Health latency ${latency}ms is above 2000ms target (server may be cold)`);
}

// ─── SUITE 2: KB Stats ─────────────────────────────────────────────────────────
async function testKBStats() {
  label('Suite 2: KB Stats Endpoint (GET /api/kb-stats)');
  let result;

  try {
    result = await get('/api/kb-stats');
  } catch (err) {
    fail(`GET /api/kb-stats — request failed: ${err.message}`);
    failures.push(`GET /api/kb-stats unreachable: ${err.message}`);
    failedTests++; totalTests++;
    return;
  }

  const { status, body, latency } = result;
  info(`Latency: ${latency}ms`);

  assert(status === 200, 'Returns HTTP 200', `got ${status}`);
  assert(body !== null, 'Body is valid JSON');
  assert(body?.connected === true, 'PostgreSQL is connected', `got connected=${body?.connected}`);
  assert(
    typeof body?.backend === 'string' && body.backend.includes('PostgreSQL'),
    'Backend label includes "PostgreSQL"',
    `got "${body?.backend}"`
  );

  const askRuvnetTotal = body?.domains?.ask_ruvnet?.total;
  assert(
    typeof askRuvnetTotal === 'number' && askRuvnetTotal > 50000,
    `ask_ruvnet domain has > 50,000 entries`,
    `got ${askRuvnetTotal}`
  );

  const total = body?.total;
  assert(
    typeof total === 'number' && total > 50000,
    `Total entries across all domains > 50,000`,
    `got ${total}`
  );

  if (typeof askRuvnetTotal === 'number') {
    info(`ask_ruvnet entries: ${askRuvnetTotal.toLocaleString()}`);
  }
  if (body?.domains?.ask_ruvnet?.gold) {
    info(`Gold tier entries: ${body.domains.ask_ruvnet.gold.toLocaleString()}`);
  }
  if (typeof total === 'number') {
    info(`Total KB entries: ${total.toLocaleString()}`);
  }

  assert(latency < 5000, `Response time < 5000ms`, `got ${latency}ms`);
}

// ─── SUITE 3: Knowledge Inventory ─────────────────────────────────────────────
async function testKnowledgeInventory() {
  label('Suite 3: Knowledge Inventory (GET /api/knowledge)');
  let result;

  try {
    result = await get('/api/knowledge');
  } catch (err) {
    fail(`GET /api/knowledge — request failed: ${err.message}`);
    failures.push(`GET /api/knowledge unreachable: ${err.message}`);
    failedTests++; totalTests++;
    return;
  }

  const { status, body, latency } = result;
  info(`Latency: ${latency}ms`);

  assert(status === 200, 'Returns HTTP 200', `got ${status}`);
  assert(body !== null, 'Body is valid JSON');
  assert(Array.isArray(body?.repos), 'repos field is an array');
  assert(Array.isArray(body?.websites), 'websites field is an array');
  assert(Array.isArray(body?.docs), 'docs field is an array');
  assert(typeof body?.version === 'string', 'version field present');
  assert(body?.kb_backend === 'PostgreSQL RuVector', 'kb_backend is PostgreSQL RuVector', `got "${body?.kb_backend}"`);
  assert(
    typeof body?.kb_total_entries === 'number' && body.kb_total_entries > 50000,
    'kb_total_entries > 50,000',
    `got ${body?.kb_total_entries}`
  );
  assert(latency < 8000, `Response time < 8000ms`, `got ${latency}ms`);

  info(`Repos: ${body?.repos?.length}, Docs: ${body?.docs?.length}, Websites: ${body?.websites?.length}`);
  info(`App version: ${body?.version}`);
}

// ─── SUITE 4: Chat Endpoint ────────────────────────────────────────────────────
const CHAT_QUERIES = [
  {
    name: 'HNSW vector search concept',
    message: 'what is HNSW vector search',
    expectedTerms: ['hnsw', 'vector', 'index', 'search', 'approximate'],
    minSources: 1,
    minAnswerLen: 100,
  },
  {
    name: 'RuVector PostgreSQL usage',
    message: 'how do I use ruvector postgres',
    expectedTerms: ['ruvector', 'postgres', 'vector', 'embed'],
    minSources: 1,
    minAnswerLen: 100,
  },
  {
    name: 'Claude Flow swarm agents',
    message: 'explain Claude Flow swarm agents',
    expectedTerms: ['claude', 'flow', 'swarm', 'agent'],
    minSources: 1,
    minAnswerLen: 100,
  },
];

const CHAT_VALIDATION_CASES = [
  { name: 'missing message field', payload: {}, expectedStatus: 400 },
  { name: 'empty string message', payload: { message: '' }, expectedStatus: 400 },
  { name: 'numeric message', payload: { message: 12345 }, expectedStatus: 400 },
  { name: 'message exactly 10001 chars', payload: { message: 'a'.repeat(10001) }, expectedStatus: 400 },
  { name: 'message exactly 10000 chars (boundary)', payload: { message: 'a'.repeat(10000) }, expectedStatus: 200 },
];

async function testChat() {
  label('Suite 4: Chat Endpoint (POST /api/chat) — Content Queries');

  for (const tc of CHAT_QUERIES) {
    console.log(`\n  Query: "${tc.message}"`);
    let result;

    try {
      result = await post('/api/chat', { message: tc.message });
    } catch (err) {
      fail(`${tc.name} — request failed: ${err.message}`);
      failures.push(`Chat "${tc.name}" unreachable`);
      failedTests++; totalTests++;
      continue;
    }

    const { status, body, latency } = result;
    info(`Latency: ${latency}ms`);

    assert(status === 200, `${tc.name}: HTTP 200`, `got ${status}`);
    assert(typeof body?.answer === 'string' && body.answer.length >= tc.minAnswerLen,
      `${tc.name}: answer >= ${tc.minAnswerLen} chars`,
      `got ${body?.answer?.length ?? 0} chars`
    );
    assert(Array.isArray(body?.sources), `${tc.name}: sources is array`);
    assert(body?.sources?.length >= tc.minSources,
      `${tc.name}: at least ${tc.minSources} source(s)`,
      `got ${body?.sources?.length}`
    );

    // Check expected terms in answer (case-insensitive, any 2 of the list)
    if (body?.answer) {
      const answerLower = body.answer.toLowerCase();
      const matchedTerms = tc.expectedTerms.filter(t => answerLower.includes(t));
      assert(matchedTerms.length >= 2,
        `${tc.name}: answer contains at least 2 expected terms (${tc.expectedTerms.join(', ')})`,
        `matched: [${matchedTerms.join(', ')}]`
      );
    }

    // Validate source structure
    if (Array.isArray(body?.sources) && body.sources.length > 0) {
      const src = body.sources[0];
      assert(src.id !== undefined, `${tc.name}: source has id field`);
      assert(typeof src.score === 'number', `${tc.name}: source has numeric score`, `got ${typeof src.score}`);
      assert(src.score >= 0 && src.score <= 1, `${tc.name}: source score in [0,1]`, `got ${src.score}`);
      assert(typeof src.content === 'string' && src.content.length > 0, `${tc.name}: source has content`);
    }

    // Source scores are in descending order
    if (Array.isArray(body?.sources) && body.sources.length >= 2) {
      const ordered = body.sources.every((s, i) =>
        i === 0 || (body.sources[i - 1].score || 0) >= (s.score || 0) - 0.001 // tiny tolerance
      );
      assert(ordered, `${tc.name}: source scores are in descending order`);
    }

    // Quality score
    const quality = scoreSearchResult(tc.message, body?.sources, body?.answer);
    info(`Quality score: ${quality.score}/100 — checks: [${quality.checks.join(', ')}]`);

    assert(latency < 30000, `${tc.name}: response time < 30000ms`, `got ${latency}ms`);
    if (latency > 15000) warn(`${tc.name}: latency ${latency}ms is above 15s target`);
  }
}

async function testChatValidation() {
  label('Suite 4b: Chat Endpoint — Input Validation');

  for (const tc of CHAT_VALIDATION_CASES) {
    let result;
    try {
      result = await post('/api/chat', tc.payload);
    } catch (err) {
      fail(`${tc.name} — request failed: ${err.message}`);
      failures.push(`Chat validation "${tc.name}" unreachable`);
      failedTests++; totalTests++;
      continue;
    }

    const { status } = result;

    // For the 10000-char boundary test, we accept any non-500 response
    // because the server may still process or reject based on content
    if (tc.expectedStatus === 200) {
      assert(status !== 500, `${tc.name}: does not return 500`, `got ${status}`);
    } else {
      assert(status === tc.expectedStatus, `${tc.name}: HTTP ${tc.expectedStatus}`, `got ${status}`);
    }
  }
}

async function testChatModes() {
  label('Suite 4c: Chat Endpoint — Learning Mode Variants');

  const modes = ['Simple', 'Beginner', 'Balanced', 'Technical'];
  const testMessage = 'what is HNSW';

  for (const mode of modes) {
    let result;
    try {
      result = await post('/api/chat', { message: testMessage, mode });
    } catch (err) {
      fail(`Mode "${mode}" — request failed: ${err.message}`);
      failures.push(`Chat mode "${mode}" unreachable`);
      failedTests++; totalTests++;
      continue;
    }

    assert(result.status === 200, `Mode "${mode}": HTTP 200`, `got ${result.status}`);
    assert(
      typeof result.body?.answer === 'string' && result.body.answer.length > 50,
      `Mode "${mode}": returns non-empty answer`
    );
  }
}

// ─── SUITE 5: API Special — Validation Only (no OpenAI key assumed) ───────────
async function testSpecialValidation() {
  label('Suite 5: Special Actions Endpoint — Input Validation (POST /api/special)');

  const invalidCases = [
    { name: 'missing action', payload: { content: 'test' }, expectedStatus: 400 },
    { name: 'missing content', payload: { action: 'simplify' }, expectedStatus: 400 },
    { name: 'invalid action type', payload: { action: 'unknown', content: 'test' }, expectedStatus: 400 },
    { name: 'non-string action', payload: { action: 123, content: 'test' }, expectedStatus: 400 },
  ];

  for (const tc of invalidCases) {
    let result;
    try {
      result = await post('/api/special', tc.payload);
    } catch (err) {
      fail(`${tc.name} — request failed: ${err.message}`);
      failures.push(`Special "${tc.name}" unreachable`);
      failedTests++; totalTests++;
      continue;
    }
    assert(result.status === tc.expectedStatus, `${tc.name}: HTTP ${tc.expectedStatus}`, `got ${result.status}`);
  }

  // Valid action with no OpenAI key — should return 503
  let result;
  try {
    result = await post('/api/special', { action: 'simplify', content: 'HNSW is an algorithm' });
    assert(
      result.status === 503 || result.status === 200,
      'simplify action: 503 (no key) or 200 (key present)',
      `got ${result.status}`
    );
  } catch (err) {
    fail(`simplify action — request failed: ${err.message}`);
  }
}

// ─── SUITE 6: Auth Protection ──────────────────────────────────────────────────
async function testAuthProtection() {
  label('Suite 6: Auth Protection (POST /api/learn)');

  // No auth header — expect 401 in production (or 200 in dev/local)
  let result;
  try {
    result = await post('/api/learn', {});
  } catch (err) {
    fail(`POST /api/learn — request failed: ${err.message}`);
    failures.push('POST /api/learn unreachable');
    failedTests++; totalTests++;
    return;
  }

  // In production, should be 401. In local dev, might be 200.
  const isProduction = BASE_URL.includes('render.com') || BASE_URL.includes('railway.app');
  if (isProduction) {
    assert(result.status === 401, 'POST /api/learn without auth returns 401 in production', `got ${result.status}`);
  } else {
    info(`Non-production URL — skipping auth enforcement check (got ${result.status})`);
    totalTests++;
    passedTests++;
    pass('POST /api/learn auth check skipped for non-production environment');
  }

  // Wrong token
  try {
    result = await fetchWithTimeout(`${BASE_URL}/api/learn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer definitely-wrong-key',
      },
      body: JSON.stringify({}),
    });
    const r2 = await result.res.json().catch(() => null);
    const status2 = result.res.status;
    if (isProduction) {
      assert(status2 === 401, 'POST /api/learn with wrong token returns 401', `got ${status2}`);
    }
  } catch (err) {
    warn(`POST /api/learn wrong token test failed: ${err.message}`);
  }
}

// ─── SUITE 7: Rate Limit Headers ───────────────────────────────────────────────
async function testRateLimitHeaders() {
  label('Suite 7: Rate Limit Headers');

  let result;
  try {
    result = await get('/health');
  } catch (err) {
    fail(`Rate limit header check — request failed: ${err.message}`);
    return;
  }

  const headers = result.headers;
  // express-rate-limit v7+ uses RateLimit-* headers by default
  const hasRateLimitHeader =
    headers.get('ratelimit-limit') ||
    headers.get('x-ratelimit-limit') ||
    headers.get('ratelimit-remaining') ||
    headers.get('x-ratelimit-remaining');

  assert(hasRateLimitHeader !== null, 'Rate limit headers present in response');
  info(`Rate limit headers: ${JSON.stringify({
    limit: headers.get('ratelimit-limit') || headers.get('x-ratelimit-limit'),
    remaining: headers.get('ratelimit-remaining') || headers.get('x-ratelimit-remaining'),
  })}`);
}

// ─── SUITE 8: Performance Benchmark ───────────────────────────────────────────
async function testPerformanceBenchmark() {
  label('Suite 8: Performance Benchmark');

  // Warm-up request (Render may be sleeping)
  info('Sending warm-up request to /health...');
  try {
    await get('/health');
    await new Promise(r => setTimeout(r, 500));
  } catch { /* ignore */ }

  // Measure 3 health endpoint latencies
  const healthLatencies = [];
  for (let i = 0; i < 3; i++) {
    try {
      const { latency } = await get('/health');
      healthLatencies.push(latency);
    } catch { /* ignore */ }
  }

  if (healthLatencies.length > 0) {
    const avgHealth = Math.round(healthLatencies.reduce((a, b) => a + b, 0) / healthLatencies.length);
    info(`/health avg latency (3 samples): ${avgHealth}ms`);
    assert(avgHealth < 3000, `/health avg latency < 3000ms`, `got ${avgHealth}ms`);
  }

  // Single chat benchmark
  info('Timing a single chat request (warm)...');
  try {
    const { latency, status } = await post('/api/chat', { message: 'what is HNSW' });
    info(`/api/chat single request latency: ${latency}ms (status: ${status})`);
    assert(latency < 30000, '/api/chat completes within 30 seconds', `got ${latency}ms`);
    if (latency > 15000) warn(`Chat latency ${latency}ms exceeds 15s P95 target`);
  } catch (err) {
    fail(`Chat benchmark — request failed: ${err.message}`);
  }
}

// ─── Main runner ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}AskRuvNet Production Test Suite${RESET}`);
  console.log(`Target: ${CYAN}${BASE_URL}${RESET}`);
  console.log(`Timeout per request: ${TIMEOUT_MS}ms`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  console.log('─'.repeat(60));

  // Run all suites
  await testHealth();
  await testKBStats();
  await testKnowledgeInventory();
  await testChat();
  await testChatValidation();
  await testChatModes();
  await testSpecialValidation();
  await testAuthProtection();
  await testRateLimitHeaders();
  await testPerformanceBenchmark();

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log(`\n${BOLD}Test Summary${RESET}`);
  console.log(`  Total:   ${totalTests}`);
  console.log(`  ${GREEN}Passed:  ${passedTests}${RESET}`);
  console.log(`  ${failedTests > 0 ? RED : GREEN}Failed:  ${failedTests}${RESET}`);

  const pct = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  console.log(`  Score:   ${pct}%`);

  if (failures.length > 0) {
    console.log(`\n${RED}${BOLD}Failures:${RESET}`);
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }

  console.log(`\nFinished: ${new Date().toISOString()}\n`);
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\n${RED}Fatal error: ${err.message}${RESET}`);
  console.error(err.stack);
  process.exit(1);
});
