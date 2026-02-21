#!/usr/bin/env node
/**
 * Agentics Video Digest -> PostgreSQL KB Ingestion
 * Created: 2026-02-20 09:00:00 EST | Version 1.0.0
 *
 * Ingests video metadata and extracted knowledge from the Agentics Foundation
 * video portal into openclaw_memory.operational_knowledge.
 * Auto-embed trigger generates HNSW-indexed vectors automatically.
 *
 * USAGE: node scripts/ingest-agentics-videos.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOST = 'localhost';
const PORT = '5435';

function psql(sql) {
  try {
    const result = execFileSync('psql', [
      '-h', HOST, '-p', PORT, '-U', 'postgres', '-t', '-A', '-c', sql
    ], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 50 * 1024 * 1024 });
    return result.trim();
  } catch (e) {
    if (e.stderr) console.error('SQL Error:', e.stderr.substring(0, 300));
    return null;
  }
}

function esc(s) {
  return (s || '').replace(/'/g, "''");
}

// Load the digest
const digestPath = path.join(__dirname, '..', 'docs', 'agentics-video-digest.json');
const digest = JSON.parse(fs.readFileSync(digestPath, 'utf8'));

let inserted = 0;
let skipped = 0;

// 1) Insert each video with substantial content as a KB entry
for (const v of digest.videos) {
  // Build rich content from available fields
  const parts = [];
  parts.push(`Title: ${v.title}`);
  if (v.date) parts.push(`Date: ${v.date}`);
  if (v.duration) parts.push(`Duration: ${v.duration}`);
  if (v.url) parts.push(`URL: ${v.url}`);
  if (v.description) parts.push(`\nDescription: ${v.description}`);
  if (v.transcript_preview) parts.push(`\nTranscript Preview: ${v.transcript_preview}`);
  if (v.chapters && v.chapters.length > 0) {
    parts.push(`\nChapters (${v.chapters.length}):`);
    v.chapters.forEach((ch, i) => parts.push(`  ${i + 1}. ${ch}`));
  }

  const content = parts.join('\n');
  const tags = ['agentics-video', 'agentics-foundation'];
  if (v.tags) tags.push(...v.tags);
  if (v.relevance) tags.push(`relevance-${v.relevance}`);

  const tagsStr = tags.map(t => `'${esc(t)}'`).join(',');
  const confidence = v.relevance === 'critical' ? 0.95 : v.relevance === 'high' ? 0.85 : v.relevance === 'medium' ? 0.7 : 0.5;

  // Check for existing entry
  const exists = psql(`SELECT id FROM openclaw_memory.operational_knowledge WHERE title = '${esc(v.title)}' AND tags @> ARRAY['agentics-video'] LIMIT 1;`);
  if (exists) {
    skipped++;
    continue;
  }

  const sql = `INSERT INTO openclaw_memory.operational_knowledge (category, title, content, tags, learned_from, confidence) VALUES (
    'agentics-video',
    '${esc(v.title)}',
    '${esc(content)}',
    ARRAY[${tagsStr}],
    'video.agentics.org - ${v.id || "unknown"}',
    ${confidence}
  );`;

  const result = psql(sql);
  if (result !== null) {
    inserted++;
    process.stdout.write(`\r  Videos: ${inserted} inserted, ${skipped} skipped`);
  } else {
    console.error(`\n  FAILED: ${v.title}`);
  }
}
console.log(`\n  Videos done: ${inserted} inserted, ${skipped} skipped`);

// 2) Insert key topics as rich knowledge entries
const topics = digest.key_topics_extracted || {};
let topicInserted = 0;

for (const [key, data] of Object.entries(topics)) {
  const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Check for existing
  const exists = psql(`SELECT id FROM openclaw_memory.operational_knowledge WHERE title = '${esc(`Agentics Knowledge: ${title}`)}' LIMIT 1;`);
  if (exists) { skipped++; continue; }

  // Build content from the data object
  const parts = [`# ${title}\n`];

  if (typeof data === 'string') {
    parts.push(data);
  } else if (typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) {
        parts.push(`${k.replace(/_/g, ' ')}:`);
        v.forEach(item => {
          if (typeof item === 'string') parts.push(`  - ${item}`);
          else parts.push(`  - ${JSON.stringify(item)}`);
        });
      } else if (typeof v === 'object' && v !== null) {
        parts.push(`${k.replace(/_/g, ' ')}:`);
        for (const [sk, sv] of Object.entries(v)) {
          parts.push(`  ${sk}: ${sv}`);
        }
      } else {
        parts.push(`${k.replace(/_/g, ' ')}: ${v}`);
      }
    }
  }

  const content = parts.join('\n');
  const tags = ['agentics-video', 'agentics-knowledge', key.replace(/_/g, '-')];

  const tagsStr = tags.map(t => `'${esc(t)}'`).join(',');

  const sql = `INSERT INTO openclaw_memory.operational_knowledge (category, title, content, tags, learned_from, confidence) VALUES (
    'agentics-knowledge',
    '${esc(`Agentics Knowledge: ${title}`)}',
    '${esc(content)}',
    ARRAY[${tagsStr}],
    'video.agentics.org digest - extracted 2026-02-20',
    0.9
  );`;

  const result = psql(sql);
  if (result !== null) {
    topicInserted++;
    process.stdout.write(`\r  Topics: ${topicInserted} inserted`);
  }
}

console.log(`\n  Topics done: ${topicInserted} inserted`);
console.log(`\nTotal: ${inserted + topicInserted} entries ingested into openclaw_memory.operational_knowledge`);
console.log('Embeddings auto-generated by trg_auto_embed_opknowledge trigger.');
