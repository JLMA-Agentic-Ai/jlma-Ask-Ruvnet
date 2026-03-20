Updated: 2026-01-01 20:10:00 EST | Version 1.0.0
Created: 2026-01-01 20:10:00 EST

# Testing Strategy for KB-First Applications

## Purpose

Comprehensive testing ensures your KB-First application:
- Returns accurate, source-backed responses
- Handles edge cases gracefully
- Maintains KB integrity over time
- Meets performance requirements

---

## Testing Pyramid for KB-First

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Few, slow, high confidence
                    │   (10-20)       │
                    ├─────────────────┤
                    │  Integration    │  ← Medium count
                    │  Tests (50-100) │
                    ├─────────────────┤
                    │   KB Quality    │  ← KB-specific layer
                    │   Tests (100+)  │
                    ├─────────────────┤
                    │   Unit Tests    │  ← Many, fast, isolated
                    │   (200-500)     │
                    └─────────────────┘
```

---

## Test Categories

| Category | Purpose | When to Run | Target |
|----------|---------|-------------|--------|
| Unit | Individual functions | Every commit | 200+ tests |
| KB Quality | Search accuracy, coverage | Daily | 100+ queries |
| Integration | API + KB + Domain | Every PR | 50+ scenarios |
| E2E | Full user flows | Before deploy | 10-20 journeys |
| Performance | Response times | Weekly | <500ms p95 |
| Regression | Prevent regressions | Every release | All critical paths |

---

## 1. Unit Testing

### What to Test

```typescript
// src/domain/__tests__/retirement.test.ts

import { calculateWithdrawal } from '../retirement';
import { kb } from '../../kb';

// Mock KB for unit tests
jest.mock('../../kb');

describe('calculateWithdrawal', () => {
  beforeEach(() => {
    (kb.search as jest.Mock).mockResolvedValue({
      value: 0.04,
      sources: [{
        nodeId: 'wr-001',
        expert: 'William Bengen',
        confidence: 0.95,
        url: 'https://example.com/bengen-1994'
      }]
    });
  });

  test('returns withdrawal amount with sources', async () => {
    const result = await calculateWithdrawal(1000000);

    expect(result.data.amount).toBe(40000);
    expect(result.kbSources).toHaveLength(1);
    expect(result.kbSources[0].expert).toBe('William Bengen');
  });

  test('throws when KB unavailable', async () => {
    (kb.search as jest.Mock).mockRejectedValue(new Error('KB unavailable'));

    await expect(calculateWithdrawal(1000000)).rejects.toThrow('KB unavailable');
  });

  test('never returns hardcoded values', async () => {
    // Even if KB returns unexpected format, don't fall back to hardcoded
    (kb.search as jest.Mock).mockResolvedValue({ value: null, sources: [] });

    await expect(calculateWithdrawal(1000000)).rejects.toThrow();
  });
});
```

### Unit Test Requirements

```
[ ] Every domain function has tests
[ ] KB is mocked in unit tests
[ ] Tests verify kbSources are returned
[ ] Tests verify no hardcoded fallbacks
[ ] Tests cover error paths
[ ] Coverage target: ≥90%
```

---

## 2. KB Quality Testing

### 2.1 Search Accuracy Tests

```typescript
// tests/kb-quality/search-accuracy.test.ts

describe('KB Search Accuracy', () => {
  const testQueries = [
    {
      query: 'safe withdrawal rate retirement',
      expectedTopics: ['4% rule', 'Bengen', 'withdrawal'],
      minConfidence: 0.7
    },
    {
      query: 'social security claiming age',
      expectedTopics: ['62', '67', 'FRA', 'delayed credits'],
      minConfidence: 0.7
    },
    {
      query: 'Roth conversion strategy',
      expectedTopics: ['tax bracket', 'IRMAA', 'conversion ladder'],
      minConfidence: 0.6
    }
  ];

  testQueries.forEach(({ query, expectedTopics, minConfidence }) => {
    test(`"${query}" returns relevant results`, async () => {
      const results = await kb.search(query);

      // Must return results
      expect(results.length).toBeGreaterThan(0);

      // Top result must have minimum confidence
      expect(results[0].confidence).toBeGreaterThanOrEqual(minConfidence);

      // Results must contain expected topics
      const content = results.map(r => r.content.toLowerCase()).join(' ');
      const foundTopics = expectedTopics.filter(t =>
        content.includes(t.toLowerCase())
      );
      expect(foundTopics.length).toBeGreaterThanOrEqual(1);

      // All results must have sources
      results.forEach(r => {
        expect(r.sourceExpert).toBeDefined();
        expect(r.sourceExpert).not.toBe('');
      });
    });
  });
});
```

### 2.2 Coverage Tests

```typescript
// tests/kb-quality/coverage.test.ts

describe('KB Coverage', () => {
  const requiredTopics = [
    'withdrawal strategies',
    'social security optimization',
    'Medicare planning',
    'tax-efficient withdrawal',
    'Roth conversions',
    'required minimum distributions',
    'estate planning basics',
    'inflation protection',
    'sequence of returns risk',
    'bucket strategy'
  ];

  requiredTopics.forEach(topic => {
    test(`KB covers "${topic}"`, async () => {
      const results = await kb.search(topic);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });
  });

  test('KB has minimum node count', async () => {
    const stats = await kb.getStats();
    expect(stats.totalNodes).toBeGreaterThanOrEqual(500);
  });

  test('KB has minimum expert count', async () => {
    const stats = await kb.getStats();
    expect(stats.uniqueExperts).toBeGreaterThanOrEqual(50);
  });

  test('average confidence is acceptable', async () => {
    const stats = await kb.getStats();
    expect(stats.avgConfidence).toBeGreaterThanOrEqual(0.7);
  });
});
```

### 2.3 Gap Detection Tests

```typescript
// tests/kb-quality/gaps.test.ts

describe('KB Gap Detection', () => {
  const edgeCaseQueries = [
    'retirement planning for freelancers',
    'pension vs lump sum decision',
    'international retirement tax treaties',
    'cryptocurrency in retirement portfolio'
  ];

  edgeCaseQueries.forEach(query => {
    test(`handles "${query}" gracefully`, async () => {
      const results = await kb.search(query);

      if (results.length === 0 || results[0].confidence < 0.5) {
        // Should log gap
        const gaps = await kb.getRecentGaps();
        const gapLogged = gaps.some(g => g.query.includes(query));
        expect(gapLogged).toBe(true);
      }
    });
  });
});
```

---

## 3. Integration Testing

### 3.1 API + KB Integration

```typescript
// tests/integration/api-kb.test.ts

describe('API-KB Integration', () => {
  let app: Express;

  beforeAll(async () => {
    // Start app with real KB connection
    app = await startApp();
  });

  afterAll(async () => {
    await stopApp();
  });

  test('POST /api/calculate-withdrawal returns sources', async () => {
    const response = await request(app)
      .post('/api/calculate-withdrawal')
      .send({ portfolio: 1000000, age: 65 });

    expect(response.status).toBe(200);
    expect(response.body.withdrawal).toBeDefined();
    expect(response.body.sources).toBeInstanceOf(Array);
    expect(response.body.sources.length).toBeGreaterThan(0);
    expect(response.body.sources[0].expert).toBeDefined();
  });

  test('API fails gracefully when KB unavailable', async () => {
    // Temporarily disconnect KB
    await kb.disconnect();

    const response = await request(app)
      .post('/api/calculate-withdrawal')
      .send({ portfolio: 1000000 });

    expect(response.status).toBe(503);
    expect(response.body.error).toContain('KB');

    // Reconnect
    await kb.connect();
  });

  test('all endpoints return sources array', async () => {
    const endpoints = [
      { method: 'post', path: '/api/calculate-withdrawal', body: { portfolio: 1000000 } },
      { method: 'post', path: '/api/recommend-strategy', body: { age: 65, risk: 'moderate' } },
      { method: 'get', path: '/api/ss-claiming-age?birthYear=1960' }
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)[endpoint.method](endpoint.path)
        .send(endpoint.body);

      expect(response.body.sources).toBeDefined();
      expect(Array.isArray(response.body.sources)).toBe(true);
    }
  });
});
```

### 3.2 Intelligence Layer Integration

```typescript
// tests/integration/gnn-integration.test.ts

describe('GNN Integration', () => {
  test('decision simulation returns cascade effects', async () => {
    const result = await api.post('/api/simulate-decision', {
      variable: 'ss_claiming_age',
      newValue: 70
    });

    expect(result.body.effects).toBeInstanceOf(Array);
    expect(result.body.effects.length).toBeGreaterThan(0);

    // Should affect related variables
    const affectedVars = result.body.effects.map(e => e.variable);
    expect(affectedVars).toContain('tax_bracket');
    expect(affectedVars).toContain('roth_conversion_space');
  });
});
```

---

## 4. End-to-End Testing

### 4.1 User Journey Tests

```typescript
// tests/e2e/user-journeys.test.ts

describe('User Journeys', () => {
  test('complete retirement planning flow', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 1. Load app
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('Retirement Advisor');

    // 2. Enter profile
    await page.fill('[name="age"]', '60');
    await page.fill('[name="portfolio"]', '1000000');
    await page.selectOption('[name="risk"]', 'moderate');
    await page.click('button[type="submit"]');

    // 3. Verify recommendations appear with sources
    await expect(page.locator('.recommendation')).toBeVisible();
    await expect(page.locator('.sources')).toBeVisible();
    await expect(page.locator('.source-expert')).toHaveCount({ min: 1 });

    // 4. Run simulation
    await page.click('[data-test="simulate-ss-70"]');
    await expect(page.locator('.cascade-effects')).toBeVisible();

    // 5. Verify all displayed values have sources
    const values = await page.locator('.domain-value').all();
    for (const value of values) {
      const sources = await value.locator('..').locator('.sources');
      await expect(sources).toBeVisible();
    }

    await browser.close();
  });

  test('handles errors gracefully', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Simulate KB failure
    await page.route('**/api/**', route => {
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'KB unavailable' }) });
    });

    await page.goto('http://localhost:3000');
    await page.fill('[name="age"]', '60');
    await page.click('button[type="submit"]');

    // Should show error, not crash
    await expect(page.locator('.error-message')).toContainText('unavailable');

    await browser.close();
  });
});
```

---

## 5. Performance Testing

### 5.1 Response Time Tests

```typescript
// tests/performance/response-times.test.ts

describe('Performance', () => {
  const TIMEOUT_MS = 500;  // p95 target

  test('KB search completes within SLA', async () => {
    const times: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await kb.search('withdrawal rate');
      times.push(Date.now() - start);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];

    expect(p95).toBeLessThan(TIMEOUT_MS);
  });

  test('API endpoints meet SLA', async () => {
    const endpoints = [
      '/api/calculate-withdrawal',
      '/api/recommend-strategy',
      '/api/simulate-decision'
    ];

    for (const endpoint of endpoints) {
      const times: number[] = [];

      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await request(app).post(endpoint).send({ portfolio: 1000000 });
        times.push(Date.now() - start);
      }

      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];

      expect(p95).toBeLessThan(1000);  // 1s for API
    }
  });
});
```

### 5.2 Load Testing

```bash
#!/bin/bash
# scripts/load-test.sh

echo "=== KB-First Load Test ==="

# Use k6 or artillery
k6 run - <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '5m',    // 5 minutes
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% under 1s
    http_req_failed: ['rate<0.01'],     // <1% errors
  },
};

export default function () {
  const res = http.post('http://localhost:3000/api/calculate-withdrawal',
    JSON.stringify({ portfolio: 1000000 }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has sources': (r) => JSON.parse(r.body).sources?.length > 0,
  });

  sleep(1);
}
EOF
```

---

## 6. Regression Testing

### 6.1 Golden File Tests

```typescript
// tests/regression/golden-files.test.ts

describe('Regression - Golden Files', () => {
  const goldenCases = [
    {
      name: 'standard-withdrawal',
      input: { portfolio: 1000000, age: 65, risk: 'moderate' },
      goldenFile: 'tests/golden/standard-withdrawal.json'
    },
    {
      name: 'early-retirement',
      input: { portfolio: 2000000, age: 55, risk: 'aggressive' },
      goldenFile: 'tests/golden/early-retirement.json'
    }
  ];

  goldenCases.forEach(({ name, input, goldenFile }) => {
    test(`regression: ${name}`, async () => {
      const result = await api.post('/api/calculate-withdrawal', input);
      const golden = JSON.parse(fs.readFileSync(goldenFile, 'utf-8'));

      // Values should be within 5% of golden
      expect(result.body.withdrawal).toBeCloseTo(golden.withdrawal, -2);

      // Sources should include same experts
      const resultExperts = result.body.sources.map(s => s.expert);
      const goldenExperts = golden.sources.map(s => s.expert);
      expect(resultExperts).toEqual(expect.arrayContaining(goldenExperts));
    });
  });
});
```

### 6.2 Update Golden Files Script

```bash
#!/bin/bash
# scripts/update-golden-files.sh

echo "Updating golden files..."
echo "⚠️  Only run this after verifying new behavior is correct!"

read -p "Are you sure? (type 'yes'): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 1
fi

# Generate new golden files
node tests/generate-golden.js
echo "✅ Golden files updated"
```

---

## 7. Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/unit.ts'],
    },
    {
      displayName: 'kb-quality',
      testMatch: ['<rootDir>/tests/kb-quality/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/kb.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/e2e.ts'],
    },
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### Run Commands

```bash
# All tests
npm test

# Specific suites
npm run test:unit
npm run test:kb-quality
npm run test:integration
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# CI mode (no watch, fail fast)
npm run test:ci
```

---

## 8. Test Requirements Checklist

Before marking Phase 7.7 complete:

```
UNIT TESTS:
[ ] All domain functions tested
[ ] KB mocked in unit tests
[ ] Coverage ≥90%
[ ] No hardcoded value tests pass

KB QUALITY TESTS:
[ ] Search accuracy tests (100+ queries)
[ ] Coverage tests (all required topics)
[ ] Gap detection verified

INTEGRATION TESTS:
[ ] All API endpoints tested
[ ] KB integration verified
[ ] Intelligence layer integration tested
[ ] Error handling verified

E2E TESTS:
[ ] Core user journeys pass
[ ] Sources displayed in UI
[ ] Error states handled gracefully

PERFORMANCE TESTS:
[ ] p95 response time <500ms (KB search)
[ ] p95 response time <1000ms (API)
[ ] Load test passes (50 VUs, 5 min)

REGRESSION TESTS:
[ ] Golden file tests pass
[ ] No regressions from previous version
```

---

## 9. Continuous Testing

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

npm run test:unit -- --bail
npm run lint
```

### PR Checks

```yaml
# .github/workflows/test.yml
name: Tests
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:kb-quality
      - run: npm run test:integration
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Nightly Full Suite

```yaml
# .github/workflows/nightly.yml
name: Nightly Tests
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  full-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:e2e
      - run: npm run test:performance
```

---

## Exit Criteria

Phase 7.7 (Testing) is complete when:

```
[ ] Unit test coverage ≥90%
[ ] All KB quality tests pass
[ ] All integration tests pass
[ ] E2E tests cover core journeys
[ ] Performance tests meet SLA
[ ] CI/CD pipeline configured
[ ] Pre-commit hooks installed
```
