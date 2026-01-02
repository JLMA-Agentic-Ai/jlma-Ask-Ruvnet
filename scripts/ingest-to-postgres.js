#!/usr/bin/env node
/**
 * PostgreSQL Knowledge Base Ingestion Script
 * Updated: 2025-12-29 10:20:00 EST | Version 1.0.0
 *
 * Ingests markdown files into ruvector-postgres knowledge base.
 * Uses semantic embeddings via ruvector_embed() function.
 *
 * USAGE:
 *   node scripts/ingest-to-postgres.js [directory] [--schema=name]
 *
 * EXAMPLES:
 *   node scripts/ingest-to-postgres.js /tmp/ruvnet-kb-extraction --schema=askruvnet
 *   node scripts/ingest-to-postgres.js ./docs --schema=myproject
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOST = process.env.RUVECTOR_PG_HOST || 'localhost';
const PORT = process.env.RUVECTOR_PG_PORT || '5435';
const PASS = process.env.RUVECTOR_PG_PASSWORD || 'guruKB2025';
const DEFAULT_SCHEMA = process.env.RUVECTOR_PG_SCHEMA || 'askruvnet';

const args = process.argv.slice(2);
const directory = args.find(a => !a.startsWith('--')) || '/tmp/ruvnet-kb-extraction';
const schemaArg = args.find(a => a.startsWith('--schema='));
const schema = schemaArg ? schemaArg.split('=')[1] : DEFAULT_SCHEMA;

function psql(sql) {
  try {
    const result = execFileSync('psql', [
      '-h', HOST,
      '-p', PORT,
      '-U', 'postgres',
      '-t', '-A',
      '-c', sql
    ], {
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: PASS },
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large inserts
    });
    return result.trim();
  } catch (e) {
    if (e.stderr) {
      console.error('SQL Error:', e.stderr.substring(0, 200));
    }
    return null;
  }
}

function chunkContent(content, maxChunkSize = 2000) {
  const chunks = [];
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function escapeSQL(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\x00/g, '');
}

function ingestFile(filePath, schema) {
  const fileName = path.basename(filePath, '.md');
  const content = fs.readFileSync(filePath, 'utf8');
  const chunks = chunkContent(content);

  process.stdout.write(`  📄 ${fileName}: `);

  let inserted = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const title = `${fileName} (${i + 1}/${chunks.length})`;
    const safeTitle = escapeSQL(title);
    const safeContent = escapeSQL(chunk);
    const safeSource = escapeSQL(filePath);

    // Use shorter text for embedding (ruvector_embed has limits)
    const embeddingText = escapeSQL((chunk.substring(0, 500)).replace(/\n/g, ' '));

    const sql = `INSERT INTO ${schema}.guru_knowledge (title, content, source, embedding)
      VALUES ('${safeTitle}', '${safeContent}', '${safeSource}', ruvector_embed('${embeddingText}'))`;

    const result = psql(sql);
    if (result !== null) {
      inserted++;
      process.stdout.write('.');
    } else {
      process.stdout.write('x');
    }
  }

  console.log(` ${inserted}/${chunks.length} chunks`);
  return inserted;
}

function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           POSTGRES KNOWLEDGE BASE INGESTION                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📁 Source: ${directory}`);
  console.log(`🗄️  Schema: ${schema}`);
  console.log(`📡 Host: ${HOST}:${PORT}`);
  console.log('');

  // Check connection
  const connTest = psql("SELECT 'connected' AS status");
  if (connTest !== 'connected') {
    console.error('❌ Cannot connect to ruvector-postgres. Is it running?');
    console.error('   docker start ruvector-kb');
    process.exit(1);
  }
  console.log('✅ Connected to ruvector-postgres');
  console.log('');

  // Ensure schema and table exist
  psql(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  psql(`CREATE TABLE IF NOT EXISTS ${schema}.guru_knowledge (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    source TEXT,
    embedding real[],
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  // Find all markdown files
  if (!fs.existsSync(directory)) {
    console.error(`❌ Directory not found: ${directory}`);
    process.exit(1);
  }

  const files = fs.readdirSync(directory).filter(f => f.endsWith('.md'));
  console.log(`📚 Found ${files.length} markdown files`);
  console.log('');

  let totalChunks = 0;
  for (const file of files) {
    const filePath = path.join(directory, file);
    const inserted = ingestFile(filePath, schema);
    totalChunks += inserted;
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Ingested ${totalChunks} chunks into ${schema}.guru_knowledge`);
  console.log('');
  console.log('📊 To query:');
  console.log(`   kb-query "your search query" --schema=${schema}`);
  console.log('');

  // Show count
  const count = psql(`SELECT COUNT(*) FROM ${schema}.guru_knowledge`);
  console.log(`📈 Total vectors in ${schema}: ${count}`);
}

main();
