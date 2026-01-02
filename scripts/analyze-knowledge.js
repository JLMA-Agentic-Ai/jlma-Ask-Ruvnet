#!/usr/bin/env node
/**
 * Knowledge Base Analysis Script
 * Analyzes coverage, generates scorecard, and performs graph clustering
 *
 * NEW in ruvector 0.1.77+:
 * - Louvain community detection for auto-discovering topic clusters
 * - Spectral clustering for boundary detection
 * - Graph-based relationship analysis
 */

const fs = require('fs');
const path = require('path');

// Try to load ruvector graph algorithms
let graphClusters = null;
let RuvectorStore = null;
try {
  const ruvector = require('ruvector');
  graphClusters = ruvector.graphClusters || ruvector.clustering?.louvain;
  RuvectorStore = ruvector.RuvectorStore;
} catch (e) {
  console.log('Note: Graph clustering requires ruvector 0.1.77+');
}

// Read metadata file
const metadataPath = path.join(process.cwd(), '.ruvector/knowledge-base/metadata.json');
const data = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

// Count topics
const topicCounts = {};
const packageCounts = {};
const sourceFiles = {};
let totalRecords = data.idIndex ? data.idIndex.length : 0;

// Iterate over metadata entries
const metadataEntries = data.metadata || {};
for (const [id, metadata] of Object.entries(metadataEntries)) {
  if (metadata === null || metadata === undefined) continue;

  // Count topics
  const topics = metadata.topics || [];
  for (const topic of topics) {
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }

  // Count source files
  const source = metadata.source || 'unknown';
  const baseName = path.basename(source);
  sourceFiles[baseName] = (sourceFiles[baseName] || 0) + 1;

  // Count package mentions
  const content = (metadata.content || '').toLowerCase();
  const packages = ['ruvector', 'ruvllm', 'rvlite', 'agentdb', 'agentic-flow', 'claude-flow', 'flow-nexus', 'postgres-cli', 'agentic-synth', 'neural-trader', 'strange-loop', 'gnn', 'sona', 'attention'];
  for (const pkg of packages) {
    if (content.includes(pkg.toLowerCase().replace('-', ''))) {
      packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
    }
  }
}

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  KNOWLEDGE BASE SCORECARD - UPDATED');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('');

console.log('=== TOPIC COVERAGE ===');
console.log('Topic                     Records   Score');
console.log('─────────────────────────────────────────');
const topicScores = {};
Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).forEach(([topic, count]) => {
  // Calculate score based on record count
  let score;
  if (count >= 50) score = 95;
  else if (count >= 40) score = 85;
  else if (count >= 30) score = 75;
  else if (count >= 20) score = 65;
  else if (count >= 10) score = 50;
  else score = 35;
  topicScores[topic] = score;
  console.log(`${topic.padEnd(25)} ${String(count).padStart(3)}       ${score}/100`);
});

console.log('');
console.log('=== PACKAGE COVERAGE ===');
console.log('Package                   Records   Status');
console.log('─────────────────────────────────────────');
let coveredPackages = 0;
const targetPackages = 14;
Object.entries(packageCounts).sort((a, b) => b[1] - a[1]).forEach(([pkg, count]) => {
  coveredPackages++;
  const status = count >= 10 ? '✅ Good' : count >= 5 ? '⚠️  Fair' : '❌ Low';
  console.log(`${pkg.padEnd(25)} ${String(count).padStart(3)}       ${status}`);
});

console.log('');
console.log('=== SOURCE FILES ===');
Object.entries(sourceFiles).sort((a, b) => b[1] - a[1]).forEach(([file, count]) => {
  console.log(`${file.padEnd(45)} ${count} sections`);
});

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log(`  Total Records:        ${totalRecords} (was 181)`);
console.log(`  Improvement:          +${totalRecords - 181} records (+${Math.round((totalRecords - 181) / 181 * 100)}%)`);
console.log(`  Topics Covered:       ${Object.keys(topicCounts).length}`);
console.log(`  Packages Documented:  ${coveredPackages}/${targetPackages}`);
console.log('');

// Calculate overall score
const avgTopicScore = Object.values(topicScores).reduce((a, b) => a + b, 0) / Object.keys(topicScores).length;
const packageScore = (coveredPackages / targetPackages) * 100;
const recordScore = Math.min(100, (totalRecords / 500) * 100);
const overallScore = Math.round((avgTopicScore * 0.4) + (packageScore * 0.3) + (recordScore * 0.3));

console.log('  OVERALL SCORE:');
console.log(`    Topic Coverage:     ${Math.round(avgTopicScore)}/100 (40% weight)`);
console.log(`    Package Coverage:   ${Math.round(packageScore)}/100 (30% weight)`);
console.log(`    Record Volume:      ${Math.round(recordScore)}/100 (30% weight)`);
console.log('');
console.log(`  ═══ FINAL SCORE: ${overallScore}/100 ═══`);
console.log(`      (Previous: 42/100, Improvement: +${overallScore - 42} points)`);
console.log('');
console.log('═══════════════════════════════════════════════════════════════════════');

// ============================================================================
// GRAPH CLUSTERING (Louvain Community Detection)
// Requires ruvector 0.1.77+ with graph algorithms
// ============================================================================

async function runGraphClustering() {
  if (!graphClusters || !RuvectorStore) {
    console.log('\n⚠️  Graph clustering skipped: ruvector graph algorithms not available');
    console.log('   Install ruvector 0.1.77+ for Louvain community detection');
    return;
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  GRAPH CLUSTERING (Louvain Community Detection)');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Load vectors from the KB
    const vectorsPath = path.join(process.cwd(), '.ruvector/knowledge-base/vectors.bin');
    if (!fs.existsSync(vectorsPath)) {
      console.log('  ⚠️  vectors.bin not found. Run ingestion first.');
      return;
    }

    // Load the RuvectorStore
    const store = new RuvectorStore({
      dimension: 384,  // ONNX embeddings
      persistence: {
        enabled: true,
        path: path.join(process.cwd(), '.ruvector/knowledge-base')
      }
    });
    await store.load();

    const vectorCount = await store.count();
    console.log(`  📊 Analyzing ${vectorCount} vectors for community structure...\n`);

    // Get all vectors for clustering
    const allVectors = await store.getAll();

    if (!allVectors || allVectors.length < 10) {
      console.log('  ⚠️  Not enough vectors for meaningful clustering (need 10+)');
      return;
    }

    // Run Louvain clustering
    console.log('  🔍 Running Louvain community detection...');
    const clusterResult = await graphClusters(allVectors, {
      algorithm: 'louvain',
      resolution: 1.0,  // Standard resolution
      minCommunitySize: 3
    });

    if (!clusterResult || !clusterResult.clusters) {
      console.log('  ⚠️  Clustering returned no results');
      return;
    }

    console.log(`\n  ✅ Found ${clusterResult.clusters.length} topic communities\n`);
    console.log('  Community          Size   Top Keywords');
    console.log('  ─────────────────────────────────────────────────────');

    // Display each cluster with representative keywords
    for (let i = 0; i < Math.min(clusterResult.clusters.length, 10); i++) {
      const cluster = clusterResult.clusters[i];
      const size = cluster.docs ? cluster.docs.length : cluster.size || 0;

      // Extract keywords from cluster members
      const keywords = extractClusterKeywords(cluster.docs || [], data.metadata || {});
      const keywordStr = keywords.slice(0, 3).join(', ');

      console.log(`  Community ${String(i + 1).padStart(2)}       ${String(size).padStart(4)}   ${keywordStr}`);
    }

    // Report modularity score
    if (clusterResult.modularity !== undefined) {
      console.log(`\n  📈 Modularity Score: ${clusterResult.modularity.toFixed(3)}`);
      console.log(`     (Higher = better community structure, >0.3 is good)`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════');

  } catch (e) {
    console.log(`  ❌ Clustering error: ${e.message}`);
  }
}

/**
 * Extract representative keywords from cluster documents
 */
function extractClusterKeywords(docIds, metadata) {
  const wordCounts = {};

  for (const docId of docIds.slice(0, 20)) {  // Sample first 20 docs
    const meta = metadata[docId];
    if (!meta) continue;

    // Extract words from content and topics
    const text = (meta.content || '') + ' ' + (meta.topics || []).join(' ');
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !STOPWORDS.has(w));

    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  // Return top words by frequency
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// Common stopwords to filter
const STOPWORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'being', 'below', 'between',
  'could', 'during', 'every', 'further', 'having', 'itself', 'other', 'should',
  'their', 'there', 'these', 'those', 'through', 'under', 'until', 'where',
  'which', 'while', 'would', 'before', 'because', 'cannot', 'either', 'neither'
]);

// Run async clustering if vectors exist
runGraphClustering().catch(e => {
  console.error('Graph clustering failed:', e.message);
});
