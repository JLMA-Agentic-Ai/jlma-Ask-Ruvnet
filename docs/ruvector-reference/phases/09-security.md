# Phase 9: Security Audit & Hardening

Updated: 2026-01-02 00:15:00 EST | Version 1.0.0
Created: 2026-01-02 00:15:00 EST

## Purpose

Ensure the application has no security vulnerabilities before production deployment. This phase performs comprehensive security scanning, fixes identified issues, and verifies hardening measures.

---

## Prerequisites

- Phase 8 complete (all verification checks pass)
- Application compiles and runs
- All tests passing

---

## Why Security Is Critical for KB-First Apps

KB-First applications handle sensitive data:
- **Expert knowledge** may be proprietary
- **User queries** may contain PII or business-sensitive information
- **Gap logs** capture what users are asking
- **SONA patterns** learn from user behavior

A security breach doesn't just expose data—it undermines trust in the expert knowledge system.

---

## Sub-Phases

| Sub-Phase | Name | Purpose |
|-----------|------|---------|
| 9.1 | Dependency Audit | Check for vulnerable packages |
| 9.2 | OWASP Top 10 Scan | Check for common vulnerabilities |
| 9.3 | SQL Injection Prevention | Verify parameterized queries |
| 9.4 | Authentication & Authorization | Verify access controls |
| 9.5 | Secrets Management | No hardcoded secrets |
| 9.6 | API Security | Rate limiting, CORS, input validation |

---

## 9.1 Dependency Audit

### Check for Known Vulnerabilities

```bash
# Node.js projects
npm audit
npm audit --audit-level=high

# Python projects
pip-audit
safety check

# Go projects
govulncheck ./...

# Rust projects
cargo audit
```

### Fix Vulnerabilities

```bash
# Auto-fix where possible
npm audit fix

# For breaking changes
npm audit fix --force  # Review changes carefully!

# Update specific packages
npm update <package-name>
```

### Quality Gate

| Severity | Threshold |
|----------|-----------|
| Critical | 0 allowed |
| High | 0 allowed |
| Medium | Must have remediation plan |
| Low | Document and monitor |

---

## 9.2 OWASP Top 10 Scan

Check for the [OWASP Top 10](https://owasp.org/Top10/) vulnerabilities:

### Automated Scanning

```bash
# Install OWASP ZAP (Zed Attack Proxy)
brew install zaproxy  # macOS
# or
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# Run baseline scan
zap-baseline.py -t http://localhost:3000 -r security-report.html
```

### Manual Checklist

| # | Vulnerability | Check | Status |
|---|---------------|-------|--------|
| A01 | Broken Access Control | Auth on all protected routes | [ ] |
| A02 | Cryptographic Failures | HTTPS, encrypted secrets | [ ] |
| A03 | Injection | Parameterized queries, input validation | [ ] |
| A04 | Insecure Design | Threat modeling completed | [ ] |
| A05 | Security Misconfiguration | Production configs reviewed | [ ] |
| A06 | Vulnerable Components | Dependency audit passed | [ ] |
| A07 | Auth Failures | Strong password policy, rate limiting | [ ] |
| A08 | Software/Data Integrity | Signed packages, CI/CD security | [ ] |
| A09 | Logging Failures | Security events logged | [ ] |
| A10 | SSRF | URL validation, allowlists | [ ] |

---

## 9.3 SQL Injection Prevention

KB-First apps use PostgreSQL extensively. Every query MUST be parameterized.

### Scan for Raw SQL

```bash
# Find potential SQL injection points
grep -rn "SELECT.*\+" src/
grep -rn "INSERT.*\+" src/
grep -rn "UPDATE.*\+" src/
grep -rn "DELETE.*\+" src/
grep -rn "\$\{.*\}.*FROM" src/
grep -rn "query\s*(" src/ | grep -v "parameterized"
```

### Correct Patterns

```typescript
// ❌ VULNERABLE - String concatenation
const query = `SELECT * FROM kb_nodes WHERE title = '${userInput}'`;

// ❌ VULNERABLE - Template literal in query
const query = `SELECT * FROM kb_nodes WHERE id = ${id}`;

// ✅ SAFE - Parameterized query
const query = `SELECT * FROM kb_nodes WHERE title = $1`;
await pool.query(query, [userInput]);

// ✅ SAFE - Using query builder
const result = await knex('kb_nodes').where({ title: userInput });
```

### Verification Script

```bash
#!/bin/bash
# scripts/9.3-sql-injection.sh

echo "=== 9.3 SQL Injection Prevention ==="

VIOLATIONS=0

# Check for string concatenation in SQL
while IFS= read -r file; do
  if grep -qE "(SELECT|INSERT|UPDATE|DELETE).*\\\$\{" "$file" 2>/dev/null; then
    echo "VIOLATION: Template literal in SQL in $file"
    grep -n "(SELECT|INSERT|UPDATE|DELETE).*\\\$\{" "$file"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi

  if grep -qE "query\s*\(\s*\`" "$file" 2>/dev/null; then
    echo "WARNING: Query with template literal in $file"
    grep -n "query\s*\(\s*\`" "$file"
  fi
done < <(find src -name "*.ts" -o -name "*.js")

if [ $VIOLATIONS -eq 0 ]; then
  echo "PASS: No SQL injection vulnerabilities found"
  exit 0
else
  echo "FAIL: $VIOLATIONS SQL injection vulnerability(s) found"
  exit 1
fi
```

---

## 9.4 Authentication & Authorization

### Authentication Checklist

| Check | Implementation | Status |
|-------|----------------|--------|
| Password hashing | bcrypt/argon2, cost factor ≥10 | [ ] |
| Session management | Secure cookies, httpOnly, sameSite | [ ] |
| Token expiration | Short-lived access tokens (≤1 hour) | [ ] |
| Refresh tokens | Rotation on use, secure storage | [ ] |
| MFA support | TOTP/WebAuthn available | [ ] |
| Account lockout | After 5 failed attempts | [ ] |

### Authorization Checklist

| Check | Implementation | Status |
|-------|----------------|--------|
| Role-based access | Defined roles with permissions | [ ] |
| Resource-level auth | Users can only access their data | [ ] |
| Admin functions protected | Separate admin auth required | [ ] |
| KB namespace isolation | Users can only query their namespace | [ ] |
| API key scoping | Keys limited to specific operations | [ ] |

### Verification Script

```bash
#!/bin/bash
# scripts/9.4-auth-check.sh

echo "=== 9.4 Authentication & Authorization ==="

PASS=0
FAIL=0

# Check for password hashing library
if grep -rq "bcrypt\|argon2\|scrypt" package.json 2>/dev/null; then
  echo "✅ Password hashing library found"
  PASS=$((PASS + 1))
else
  echo "❌ No password hashing library found"
  FAIL=$((FAIL + 1))
fi

# Check for session security
if grep -rq "httpOnly.*true\|secure.*true" src/ 2>/dev/null; then
  echo "✅ Secure cookie flags found"
  PASS=$((PASS + 1))
else
  echo "❌ Secure cookie flags not found"
  FAIL=$((FAIL + 1))
fi

# Check for auth middleware
if grep -rq "requireAuth\|isAuthenticated\|authMiddleware" src/ 2>/dev/null; then
  echo "✅ Authentication middleware found"
  PASS=$((PASS + 1))
else
  echo "❌ No authentication middleware found"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && exit 0 || exit 1
```

---

## 9.5 Secrets Management

### Scan for Hardcoded Secrets

```bash
# Install secret scanner
brew install gitleaks  # or
pip install detect-secrets

# Scan codebase
gitleaks detect --source . --verbose

# Or with detect-secrets
detect-secrets scan > .secrets.baseline
```

### Common Secret Patterns to Check

```bash
#!/bin/bash
# scripts/9.5-secrets-scan.sh

echo "=== 9.5 Secrets Management ==="

VIOLATIONS=0

# Patterns that suggest hardcoded secrets
PATTERNS=(
  "password\s*=\s*['\"][^'\"]+['\"]"
  "api_key\s*=\s*['\"][^'\"]+['\"]"
  "secret\s*=\s*['\"][^'\"]+['\"]"
  "token\s*=\s*['\"][^'\"]+['\"]"
  "AWS_SECRET"
  "ANTHROPIC_API_KEY\s*=\s*['\"]sk-"
  "postgres://[^:]+:[^@]+@"
)

for pattern in "${PATTERNS[@]}"; do
  matches=$(grep -rn "$pattern" src/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "process.env\|\.env\|example\|template" || true)
  if [ -n "$matches" ]; then
    echo "VIOLATION: Potential hardcoded secret"
    echo "$matches"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

# Check that .env is in .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo "✅ .env is in .gitignore"
else
  echo "❌ .env is NOT in .gitignore"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check for .env files in git
if git ls-files | grep -q "\.env$"; then
  echo "❌ .env file is tracked in git!"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

echo ""
if [ $VIOLATIONS -eq 0 ]; then
  echo "PASS: No hardcoded secrets found"
  exit 0
else
  echo "FAIL: $VIOLATIONS secret management issue(s) found"
  exit 1
fi
```

### Required Secrets Management

| Secret Type | Storage Method |
|-------------|----------------|
| Database credentials | Environment variables |
| API keys | Environment variables or secrets manager |
| JWT secrets | Environment variables, rotated regularly |
| Encryption keys | HSM or secrets manager |

---

## 9.6 API Security

### Rate Limiting

```typescript
// Required for all public endpoints
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
// Restrict to known origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Input Validation

```typescript
import { z } from 'zod';

// Define schemas for all API inputs
const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  namespace: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10)
});

// Validate before processing
app.post('/api/search', async (req, res) => {
  const result = SearchQuerySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }
  // Process validated input
  const { query, namespace, limit } = result.data;
  // ...
});
```

### Verification Script

```bash
#!/bin/bash
# scripts/9.6-api-security.sh

echo "=== 9.6 API Security ==="

PASS=0
FAIL=0

# Check for rate limiting
if grep -rq "rateLimit\|rate-limit\|throttle" src/ package.json 2>/dev/null; then
  echo "✅ Rate limiting found"
  PASS=$((PASS + 1))
else
  echo "❌ No rate limiting found"
  FAIL=$((FAIL + 1))
fi

# Check for CORS
if grep -rq "cors\|Access-Control" src/ 2>/dev/null; then
  echo "✅ CORS configuration found"
  PASS=$((PASS + 1))
else
  echo "❌ No CORS configuration found"
  FAIL=$((FAIL + 1))
fi

# Check for input validation
if grep -rq "zod\|joi\|yup\|class-validator" package.json 2>/dev/null; then
  echo "✅ Input validation library found"
  PASS=$((PASS + 1))
else
  echo "❌ No input validation library found"
  FAIL=$((FAIL + 1))
fi

# Check for helmet (security headers)
if grep -rq "helmet" package.json src/ 2>/dev/null; then
  echo "✅ Helmet (security headers) found"
  PASS=$((PASS + 1))
else
  echo "⚠️ Helmet not found - consider adding security headers"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && exit 0 || exit 1
```

---

## Security Report Template

After completing all sub-phases, generate a security report:

```markdown
# Security Audit Report

**Application:** [App Name]
**Version:** [Version]
**Audit Date:** [Date]
**Auditor:** [Name/Tool]

## Summary

| Category | Status | Issues |
|----------|--------|--------|
| Dependencies | ✅ PASS | 0 critical, 0 high |
| OWASP Top 10 | ✅ PASS | All checks passed |
| SQL Injection | ✅ PASS | 0 vulnerabilities |
| Authentication | ✅ PASS | All controls in place |
| Secrets | ✅ PASS | No hardcoded secrets |
| API Security | ✅ PASS | Rate limiting, CORS, validation |

## Detailed Findings

### [Finding 1]
- **Severity:** [Critical/High/Medium/Low]
- **Location:** [File:Line]
- **Description:** [What was found]
- **Remediation:** [How it was fixed]
- **Status:** [Fixed/Accepted/Mitigated]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Sign-off

- [ ] Security audit complete
- [ ] All critical/high issues resolved
- [ ] Report reviewed by security lead
```

---

## Quality Gate Checklist

Before proceeding to Phase 10, verify:

- [ ] `npm audit` shows 0 critical/high vulnerabilities
- [ ] OWASP ZAP baseline scan passes
- [ ] No SQL injection vulnerabilities (9.3 script passes)
- [ ] Authentication & authorization verified (9.4 script passes)
- [ ] No hardcoded secrets (9.5 script passes)
- [ ] API security controls in place (9.6 script passes)
- [ ] Security report generated and reviewed

---

## Exit Criteria

All security checks pass. Security report generated and signed off.

**Proceed to Phase 10: Documentation & Versioning**
