Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:03:54 EST

# Security and Access Control Guide

## Overview

Comprehensive security guide for the RuvLLM + RuVector + Agentic-Flow stack covering authentication, authorization, encryption, privacy controls, and security best practices.

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     PERIMETER SECURITY                        │  │
│  │  • API Gateway • Rate Limiting • DDoS Protection • WAF       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   AUTHENTICATION                              │  │
│  │  • API Keys • JWT Tokens • OAuth2 • mTLS                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   AUTHORIZATION                               │  │
│  │  • RBAC • ABAC • Resource Policies • Scope Validation        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   DATA PROTECTION                             │  │
│  │  • Encryption at Rest • Encryption in Transit • Key Mgmt     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   AUDIT & COMPLIANCE                          │  │
│  │  • Access Logs • Activity Monitoring • Compliance Reports    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Authentication

### API Key Authentication

```javascript
const { SecurityMiddleware } = require('agentic-flow/security');

const security = new SecurityMiddleware({
  authentication: {
    type: 'apiKey',
    headerName: 'X-API-Key',
    queryParam: 'api_key',
    validator: async (key) => {
      const record = await keyStore.findKey(key);
      if (!record) return { valid: false };
      if (record.expiresAt < Date.now()) return { valid: false, reason: 'expired' };
      return { valid: true, metadata: record };
    }
  }
});

// Generate API keys
const keyManager = new ApiKeyManager({
  storage: '.security/keys.db',
  encryption: true
});

const newKey = await keyManager.create({
  name: 'production-service',
  scopes: ['vectors:read', 'vectors:write', 'rag:query'],
  rateLimit: { requests: 1000, window: '1h' },
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000  // 1 year
});
// Returns: { key: 'ruvnet_sk_live_xxxxx', id: 'key_123' }
```

### JWT Token Authentication

```javascript
const { JWTAuth } = require('agentic-flow/security');

const jwtAuth = new JWTAuth({
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256',
  issuer: 'ruvnet-integration',
  audience: 'api',
  expiresIn: '24h',
  refreshTokenExpiry: '7d'
});

// Issue token
const token = await jwtAuth.sign({
  userId: 'user_123',
  roles: ['admin'],
  permissions: ['vectors:*', 'rag:*']
});

// Verify token
const payload = await jwtAuth.verify(token);

// Refresh token
const newTokens = await jwtAuth.refresh(refreshToken);
```

### OAuth2 Integration

```javascript
const { OAuth2Provider } = require('agentic-flow/security');

const oauth = new OAuth2Provider({
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: '/auth/google/callback',
      scopes: ['email', 'profile']
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: '/auth/github/callback',
      scopes: ['user:email']
    }
  },
  onAuthenticated: async (user, provider) => {
    // Map external user to internal permissions
    return await userService.findOrCreate(user, provider);
  }
});
```

## Authorization

### Role-Based Access Control (RBAC)

```javascript
const { RBAC } = require('agentic-flow/security');

const rbac = new RBAC({
  roles: {
    admin: {
      permissions: ['*'],
      description: 'Full system access'
    },
    developer: {
      permissions: [
        'vectors:read',
        'vectors:write',
        'rag:query',
        'agents:spawn',
        'memory:read',
        'memory:write'
      ],
      description: 'Development access'
    },
    viewer: {
      permissions: [
        'vectors:read',
        'rag:query',
        'memory:read'
      ],
      description: 'Read-only access'
    },
    service: {
      permissions: [
        'vectors:read',
        'rag:query'
      ],
      description: 'Service account access'
    }
  }
});

// Check permission
const canWrite = rbac.can('developer', 'vectors:write');  // true

// Middleware
app.use('/api/vectors', rbac.middleware(['vectors:read']));
app.post('/api/vectors', rbac.middleware(['vectors:write']));
```

### Attribute-Based Access Control (ABAC)

```javascript
const { ABAC } = require('agentic-flow/security');

const abac = new ABAC({
  policies: [
    {
      name: 'own_resources',
      condition: (user, resource, action) => {
        return resource.ownerId === user.id;
      },
      effect: 'allow'
    },
    {
      name: 'team_read',
      condition: (user, resource, action) => {
        return action === 'read' && user.teamId === resource.teamId;
      },
      effect: 'allow'
    },
    {
      name: 'rate_limited',
      condition: (user, resource, action) => {
        return user.requestCount > user.rateLimit;
      },
      effect: 'deny'
    }
  ]
});

// Evaluate access
const allowed = await abac.evaluate({
  user: { id: 'user_123', teamId: 'team_456', role: 'developer' },
  resource: { type: 'vector', id: 'vec_789', ownerId: 'user_123' },
  action: 'write'
});
```

### Resource-Level Permissions

```javascript
const { ResourcePolicy } = require('agentic-flow/security');

const vectorPolicy = new ResourcePolicy({
  resource: 'vectors',
  policies: {
    'vectors:*': {
      conditions: ['authenticated', 'notRateLimited']
    },
    'vectors:delete': {
      conditions: ['isOwner', 'hasRole:admin']
    },
    'vectors:bulk_delete': {
      conditions: ['hasRole:admin', 'confirmed']
    }
  }
});
```

## Data Encryption

### Encryption at Rest

```javascript
const { EncryptedStore } = require('ruvector/security');

const encryptedStore = new EncryptedStore({
  baseStore: store,
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    key: process.env.ENCRYPTION_KEY,
    rotationPolicy: {
      enabled: true,
      intervalDays: 90
    }
  },
  encryptFields: ['metadata.pii', 'metadata.sensitive'],
  excludeFromEncryption: ['id', 'vector']
});

// Data is automatically encrypted on write
await encryptedStore.insert({
  id: 'doc-001',
  vector: [...],
  metadata: {
    pii: { email: 'user@example.com' },  // Encrypted
    category: 'public'                     // Not encrypted
  }
});
```

### Encryption in Transit

```javascript
const https = require('https');
const fs = require('fs');

const server = https.createServer({
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt'),
  ca: fs.readFileSync('./certs/ca.crt'),
  requestCert: true,     // mTLS
  rejectUnauthorized: true,
  minVersion: 'TLSv1.3'
}, app);

// Configure Ollama with TLS
const ollama = new OllamaClient({
  baseUrl: 'https://localhost:11434',
  tls: {
    cert: fs.readFileSync('./certs/client.crt'),
    key: fs.readFileSync('./certs/client.key'),
    ca: fs.readFileSync('./certs/ca.crt')
  }
});
```

### Key Management

```javascript
const { KeyManager } = require('agentic-flow/security');

const keyManager = new KeyManager({
  backend: 'vault',  // or 'aws-kms', 'gcp-kms', 'local'
  config: {
    vaultUrl: process.env.VAULT_URL,
    vaultToken: process.env.VAULT_TOKEN,
    keyPath: 'secret/ruvnet/encryption-keys'
  },
  rotation: {
    enabled: true,
    schedule: '0 0 1 */3 *',  // Every 3 months
    keepVersions: 3
  }
});

// Get current key
const key = await keyManager.getCurrentKey('data-encryption');

// Rotate key
await keyManager.rotate('data-encryption');

// Decrypt with old version
const decrypted = await keyManager.decrypt(ciphertext, { keyVersion: 2 });
```

## Privacy Controls

### Data Anonymization

```javascript
const { Anonymizer } = require('agentic-flow/privacy');

const anonymizer = new Anonymizer({
  rules: [
    { field: 'email', method: 'hash', salt: process.env.ANONYMIZE_SALT },
    { field: 'name', method: 'pseudonymize' },
    { field: 'ip', method: 'mask', keepPrefix: 2 },
    { field: 'ssn', method: 'redact' }
  ]
});

// Anonymize before storing
const anonymized = anonymizer.process(userData);
await store.insert({ id: 'user-vec', vector: [...], metadata: anonymized });
```

### Data Retention Policies

```javascript
const { RetentionPolicy } = require('agentic-flow/privacy');

const retention = new RetentionPolicy({
  policies: [
    {
      name: 'session_data',
      filter: { 'metadata.type': 'session' },
      retention: '24h',
      action: 'delete'
    },
    {
      name: 'user_vectors',
      filter: { 'metadata.type': 'user' },
      retention: '90d',
      action: 'anonymize'
    },
    {
      name: 'audit_logs',
      filter: { 'metadata.type': 'audit' },
      retention: '7y',
      action: 'archive'
    }
  ],
  schedule: '0 0 * * *'  // Run daily
});

retention.start();
```

### GDPR Compliance

```javascript
const { GDPRCompliance } = require('agentic-flow/privacy');

const gdpr = new GDPRCompliance({
  dataStore: store,
  memoryStore: flow.memory
});

// Right to access
const userData = await gdpr.exportUserData('user_123');

// Right to erasure
await gdpr.deleteUserData('user_123', {
  reason: 'user_request',
  verifiedAt: Date.now()
});

// Right to portability
const portableData = await gdpr.export('user_123', { format: 'json' });

// Consent management
await gdpr.recordConsent('user_123', {
  purposes: ['analytics', 'personalization'],
  timestamp: Date.now(),
  source: 'web_form'
});
```

## API Security

### Rate Limiting

```javascript
const { RateLimiter } = require('agentic-flow/security');

const rateLimiter = new RateLimiter({
  store: 'redis',  // or 'memory'
  rules: [
    {
      name: 'global',
      match: '*',
      limit: 10000,
      window: '1h'
    },
    {
      name: 'vectors_write',
      match: 'POST /api/vectors',
      limit: 1000,
      window: '1m'
    },
    {
      name: 'rag_query',
      match: 'POST /api/rag/query',
      limit: 100,
      window: '1m',
      costFunction: (req) => req.body.topK || 10
    }
  ],
  onLimitReached: (req, rule) => {
    logger.warn('Rate limit reached', { ip: req.ip, rule: rule.name });
  }
});

app.use(rateLimiter.middleware());
```

### Input Validation

```javascript
const { InputValidator } = require('agentic-flow/security');

const validator = new InputValidator({
  schemas: {
    vectorInsert: {
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 255, pattern: '^[a-zA-Z0-9_-]+$' },
        vector: { type: 'array', items: { type: 'number' }, maxItems: 2048 },
        metadata: { type: 'object', maxProperties: 50 }
      },
      required: ['id', 'vector']
    },
    ragQuery: {
      type: 'object',
      properties: {
        question: { type: 'string', maxLength: 10000, minLength: 1 },
        topK: { type: 'integer', minimum: 1, maximum: 100 },
        filter: { type: 'object' }
      },
      required: ['question']
    }
  }
});

app.post('/api/vectors', validator.validate('vectorInsert'), handler);
app.post('/api/rag/query', validator.validate('ragQuery'), handler);
```

### Injection Prevention

```javascript
const { InjectionGuard } = require('agentic-flow/security');

const guard = new InjectionGuard({
  patterns: [
    { type: 'sql', enabled: true },
    { type: 'nosql', enabled: true },
    { type: 'command', enabled: true },
    { type: 'prompt', enabled: true }  // Prompt injection detection
  ]
});

// Check for prompt injection
const isSafe = guard.checkPrompt(userInput);
if (!isSafe.safe) {
  throw new SecurityError('Potential prompt injection detected', {
    pattern: isSafe.matchedPattern
  });
}
```

## Audit Logging

### Security Audit Trail

```javascript
const { AuditLogger } = require('agentic-flow/security');

const audit = new AuditLogger({
  storage: {
    type: 'append_only',
    path: './audit/security.log',
    rotation: { maxSize: '100m', maxFiles: 365 }
  },
  integrity: {
    enabled: true,
    hashAlgorithm: 'sha256',
    chainPrevious: true  // Blockchain-style chaining
  }
});

// Log security events
audit.log({
  event: 'authentication',
  action: 'login_success',
  userId: 'user_123',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: Date.now()
});

audit.log({
  event: 'authorization',
  action: 'access_denied',
  userId: 'user_456',
  resource: 'vectors:delete',
  reason: 'insufficient_permissions'
});

// Query audit logs
const suspiciousActivity = await audit.query({
  event: 'authentication',
  action: 'login_failed',
  timeRange: { from: '-24h' },
  groupBy: 'ip'
});
```

## Security Hardening

### Environment Security

```bash
# .env.example - Never commit actual values
# API Keys - Use strong random values
ENCRYPTION_KEY=           # 32+ chars, use: openssl rand -hex 32
JWT_SECRET=               # 64+ chars, use: openssl rand -hex 64
ANONYMIZE_SALT=           # 32+ chars, use: openssl rand -hex 32

# Database - Restrict network access
DB_HOST=localhost         # Don't expose externally
DB_SSL=true               # Always use SSL in production

# Ollama - Bind to localhost only
OLLAMA_HOST=127.0.0.1
OLLAMA_ORIGINS=http://localhost:3000
```

### Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Security Checklist

- [ ] API keys rotated every 90 days
- [ ] JWT secrets are 256+ bits
- [ ] TLS 1.3 enforced for all connections
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation on all user input
- [ ] Prompt injection detection enabled
- [ ] Audit logging for security events
- [ ] Data encryption at rest enabled
- [ ] GDPR compliance features implemented
- [ ] Security headers configured
- [ ] Dependencies regularly updated
- [ ] Penetration testing performed

## Related Documentation

- [API Reference](./API_INTEGRATION_REFERENCE.md)
- [Error Handling](./ERROR_HANDLING_RECOVERY.md)
- [Monitoring Guide](./MONITORING_OBSERVABILITY.md)
- [Scalability Guide](./SCALABILITY_LOAD_BALANCING.md)
