#!/usr/bin/env node
const { embed } = require('../src/storage/kb-embed');

async function test() {
  const v1 = await embed('Ruflo V3 architecture overview');
  const v2 = await embed('Root Vector database system');
  const v3 = await embed('What is a banana?');

  console.log('v1 first 5:', v1.slice(0, 5));
  console.log('v2 first 5:', v2.slice(0, 5));
  console.log('v3 first 5:', v3.slice(0, 5));
  console.log('v1 === v2?', JSON.stringify(v1.slice(0,5)) === JSON.stringify(v2.slice(0,5)));
  console.log('v1 === v3?', JSON.stringify(v1.slice(0,5)) === JSON.stringify(v3.slice(0,5)));
  console.log('v1 length:', v1.length);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
