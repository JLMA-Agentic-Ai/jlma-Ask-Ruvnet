#!/usr/bin/env node
/**
 * Knowledge Base Gap Analysis
 * Identifies missing coverage areas
 */

const fs = require('fs');
const path = require('path');

const metadataPath = path.join(process.cwd(), '.ruvector/knowledge-base/metadata.json');
const data = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

// Analyze content coverage
const content = {};
const metadataEntries = data.metadata || {};

for (const [id, meta] of Object.entries(metadataEntries)) {
  if (meta === null || meta === undefined) continue;
  if (meta.content === null || meta.content === undefined) continue;

  const text = meta.content.toLowerCase();

  // Check for specific feature/package mentions
  const features = {
    "claude-flow": /claude[-\s]?flow/i,
    "agentic-flow": /agentic[-\s]?flow/i,
    "flow-nexus": /flow[-\s]?nexus/i,
    "postgres-cli": /postgres[-\s]?cli|ruvector[-\s]?postgres/i,
    "neural-trader": /neural[-\s]?trader/i,
    "strange-loop": /strange[-\s]?loop|sublinear/i,
    "reasoningbank": /reasoningbank|reasoning[-\s]?bank/i,
    "hive-mind": /hive[-\s]?mind/i,
    "agent-booster": /agent[-\s]?booster/i,
    "multi-model-router": /multi[-\s]?model|model[-\s]?router/i,
    "mcp-tools": /mcp.*tool|tool.*mcp/i,
    "150-agents": /150.*agent|agent.*150/i,
    "docker-deployment": /docker.*deploy|deploy.*docker|docker[-\s]?compose/i,
    "railway-deployment": /railway/i,
    "tiered-compression": /tiered.*compress|compress.*tier|hot.*warm.*cold/i,
    "ewc-consolidation": /ewc|elastic.*weight|catastrophic.*forget/i,
    "safetensors": /safetensor|safe[-\s]?tensor/i,
    "quic-sync": /quic.*sync|sync.*quic/i,
    "reflexion": /reflexion/i,
    "voyager-skills": /voyager|skill.*library/i,
    "causal-reasoning": /causal.*reason|pearl.*calculus|do[-\s]?calculus/i,
    "merkle-proofs": /merkle/i,
    "hnsw-index": /hnsw/i,
    "wasm-simd": /wasm.*simd|simd.*wasm/i,
    "decision-transformer": /decision.*transform/i,
    "ppo-algorithm": /ppo|proximal.*policy/i,
    "actor-critic": /actor[-\s]?critic/i,
    "federated-learning": /federat.*learn/i,
    "lora-adapters": /lora|microlora|baselora/i,
    "ollama-integration": /ollama/i,
    "air-gapped": /air[-\s]?gap/i,
    "agentic-synth": /agentic[-\s]?synth/i,
    "semantic-memory": /semantic.*memory/i,
    "episodic-memory": /episodic.*memory/i,
    "swarm-topology": /swarm.*topology|mesh|hierarchical|star|ring/i,
    "consensus-protocols": /consensus|byzantine|raft|gossip/i,
    "knowledge-distillation": /distill/i,
    "experience-replay": /experience.*replay|replay.*buffer/i
  };

  for (const [feature, regex] of Object.entries(features)) {
    if (regex.test(text)) {
      content[feature] = (content[feature] || 0) + 1;
    }
  }
}

console.log("═══════════════════════════════════════════════════════════════════════");
console.log("  WORLD-CLASS KNOWLEDGE BASE - GAP ANALYSIS");
console.log("  Target: 100% coverage of Ruv Cohen's Agentic Computing Stack");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log("");

const targetRecords = 20; // Minimum for good coverage
const criticalGaps = [];
const highGaps = [];
const mediumGaps = [];

console.log("Feature/Concept               Records   Status          Priority");
console.log("───────────────────────────────────────────────────────────────────────");

const features = Object.keys(content).length > 0 ? content : {};
const allFeatures = [
  "claude-flow", "agentic-flow", "flow-nexus", "postgres-cli", "neural-trader",
  "strange-loop", "reasoningbank", "hive-mind", "agent-booster", "multi-model-router",
  "mcp-tools", "150-agents", "docker-deployment", "railway-deployment", "tiered-compression",
  "ewc-consolidation", "safetensors", "quic-sync", "reflexion", "voyager-skills",
  "causal-reasoning", "merkle-proofs", "hnsw-index", "wasm-simd", "decision-transformer",
  "ppo-algorithm", "actor-critic", "federated-learning", "lora-adapters", "ollama-integration",
  "air-gapped", "agentic-synth", "semantic-memory", "episodic-memory", "swarm-topology",
  "consensus-protocols", "knowledge-distillation", "experience-replay"
];

allFeatures.forEach(feature => {
  const count = features[feature] || 0;
  let status, priority;
  if (count >= targetRecords) {
    status = "✅ Good";
    priority = "LOW";
  } else if (count >= 10) {
    status = "⚠️  Fair";
    priority = "MEDIUM";
    mediumGaps.push(feature);
  } else if (count >= 1) {
    status = "❌ Weak";
    priority = "HIGH";
    highGaps.push(feature);
  } else {
    status = "🚫 MISSING";
    priority = "CRITICAL";
    criticalGaps.push(feature);
  }
  console.log(`${feature.padEnd(30)} ${String(count).padStart(3)}       ${status.padEnd(12)}  ${priority}`);
});

console.log("");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log("  GAP SUMMARY");
console.log("═══════════════════════════════════════════════════════════════════════");
console.log(`  CRITICAL (Missing):     ${criticalGaps.length} features`);
console.log(`  HIGH (Weak <10):        ${highGaps.length} features`);
console.log(`  MEDIUM (Fair 10-20):    ${mediumGaps.length} features`);
console.log("");

if (criticalGaps.length > 0) {
  console.log("  CRITICAL GAPS TO FILL:");
  criticalGaps.forEach(g => console.log(`    - ${g}`));
}

if (highGaps.length > 0) {
  console.log("\n  HIGH PRIORITY GAPS:");
  highGaps.forEach(g => console.log(`    - ${g}`));
}

console.log("");
console.log("═══════════════════════════════════════════════════════════════════════");

// Output as JSON for programmatic use
const report = {
  totalFeatures: allFeatures.length,
  criticalGaps,
  highGaps,
  mediumGaps,
  coverage: features,
  completionScore: Math.round(((allFeatures.length - criticalGaps.length - highGaps.length) / allFeatures.length) * 100)
};

console.log(`\n  COMPLETION SCORE: ${report.completionScore}%`);
console.log("═══════════════════════════════════════════════════════════════════════");
