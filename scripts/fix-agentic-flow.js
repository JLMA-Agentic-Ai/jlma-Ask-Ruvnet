#!/usr/bin/env node
/**
 * Fix agentic-flow@2.0.1-alpha.5 bugs
 * Run after npm install to patch known issues
 */

const fs = require('fs');
const path = require('path');

const fixes = [];

// Fix 1: Remove nested agentdb (uses incompatible alpha structure)
const nestedAgentdb = path.join(__dirname, '../node_modules/agentic-flow/node_modules/agentdb');
if (fs.existsSync(nestedAgentdb)) {
  fs.rmSync(nestedAgentdb, { recursive: true, force: true });
  fixes.push('Removed nested agentdb (will use root 1.6.1)');
}

// Fix 2: Create missing router/index.js
const routerIndex = path.join(__dirname, '../node_modules/agentic-flow/dist/router/index.js');
if (!fs.existsSync(routerIndex)) {
  fs.writeFileSync(routerIndex, "export * from './router.js';\n");
  fixes.push('Created router/index.js');
}

// Fix 3: Add missing Database import to SharedMemoryPool.js
const sharedMemoryPool = path.join(__dirname, '../node_modules/agentic-flow/dist/memory/SharedMemoryPool.js');
if (fs.existsSync(sharedMemoryPool)) {
  let content = fs.readFileSync(sharedMemoryPool, 'utf8');
  if (!content.includes("import Database from 'better-sqlite3'")) {
    content = content.replace(
      "import { EmbeddingService } from 'agentdb/controllers';",
      "import Database from 'better-sqlite3';\nimport { EmbeddingService } from 'agentdb/controllers';"
    );
    fs.writeFileSync(sharedMemoryPool, content);
    fixes.push('Added Database import to SharedMemoryPool.js');
  }
}

if (fixes.length > 0) {
  console.log('🔧 agentic-flow patches applied:');
  fixes.forEach(f => console.log(`   ✅ ${f}`));
} else {
  console.log('✅ agentic-flow already patched');
}
