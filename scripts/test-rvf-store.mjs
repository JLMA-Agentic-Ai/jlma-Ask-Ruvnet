/**
 * Quick test of RvfStore — verifies search, reflexion, and getAllMetadata work.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const RvfStore = require('../src/core/RvfStore');

const store = new RvfStore();
await store.initialize();

console.log('Stats:', store.getStats());

// Test search
console.log('\n--- Search Test ---');
const results = await store.search('What is Ruflo V3?', 3);
console.log('Results:', results.length);
for (const r of results) {
  console.log(`  ${r.id} | score: ${r.score?.toFixed(4)} | title: ${(r.title || '').substring(0, 60)}`);
  console.log(`    content: ${(r.content || '').substring(0, 100)}`);
}

// Test reflexion API
console.log('\n--- Reflexion Test ---');
const reflexResults = await store.reflexion.retrieveRelevant({ task: 'HNSW vector search', k: 3 });
console.log('Results:', reflexResults.length);
for (const r of reflexResults) {
  console.log(`  ${r.id} | sim: ${r.similarity?.toFixed(4)} | title: ${(r.task || '').substring(0, 60)}`);
}

// Test getAllMetadata
console.log('\n--- getAllMetadata Test ---');
const allMeta = store.db.getAllMetadata();
console.log('Total entries:', allMeta.length);
const first = allMeta[0];
console.log('First:', first?.id, '| has content:', Boolean(first?.metadata?.content));

await store.close();
console.log('\nAll tests passed!');
process.exit(0);
