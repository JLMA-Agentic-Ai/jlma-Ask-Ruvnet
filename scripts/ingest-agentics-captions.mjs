/**
 * Ingest Agentics Foundation video transcripts into PostgreSQL ask_ruvnet.architecture_docs
 * These are full Kaltura WebVTT captions for 10 videos from video.agentics.org
 */
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import pg from '/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/node_modules/pg/lib/index.js';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  database: 'postgres',
  max: 3,
});

const TRANSCRIPT_DIR = '/tmp/agentics-transcripts';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

const VIDEOS = [
  { id: '1_392oe5oa', title: 'Ruflo V3: Building Intelligent Agents with Self-Learning Vector Systems', date: '2026-01-08', category: 'coaching' },
  { id: '1_wx6gnb5d', title: 'Building AI Agents: From Development Tools to Industry Standards', date: '2025-12-xx', category: 'coaching' },
  { id: '1_htfe35tu', title: 'Agentic Quality Engineering Fleet: Revolutionizing Software Testing', date: '2025-12-xx', category: 'coaching' },
  { id: '1_hui4b06k', title: 'From Cloud to Edge: Revolutionary AI Chip Technology and Distributed Systems', date: '2025-12-11', category: 'coaching' },
  { id: '1_prlsngek', title: "Root Vector: Building the World's Fastest AI Graph Neural Network System", date: '2025-11-xx', category: 'coaching' },
  { id: '1_dpwbbr66', title: 'Agentic AI Revolution: Building Autonomous Intelligent Systems for Real-World Impact', date: '2025-xx-xx', category: 'coaching' },
  { id: '1_33xvl0xn', title: 'Agentix Foundation: Building a Global Community for Agentic AI Development', date: '2026-01-29', category: 'coaching' },
  { id: '1_rozlzilu', title: 'London Meetup - AI Powered Content Creation: From Sheet Music to Semantic Search', date: '2025-xx-xx', category: 'coaching' },
  { id: '1_dxehuvpf', title: 'Building the Prime Radiant: A Coherence Engine for AI Anti-Hallucination', date: '2025-xx-xx', category: 'coaching' },
  { id: '1_rtjw6iv4', title: 'Building Agentic AI Solutions: Ruflo, Anti-Gravity, and Real-World Deployment', date: '2025-xx-xx', category: 'coaching' },
];

// Detect date from transcript content
function detectDate(text) {
  // Look for date mentions in transcript
  const patterns = [
    /\b(january|jan)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i,
    /\b(february|feb)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i,
    /\b(december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i,
    /\b(november|nov)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i,
    /\b(october|oct)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i,
    /\b(\d{1,2})th\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    // "8th of January" → without year, assume 2026 if jan/feb, 2025 otherwise
    /it'?s\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(january|february|march|december|november|october)/i,
  ];

  const months = { january:1, jan:1, february:2, feb:2, march:3, april:4, may:5, june:6,
    july:7, august:8, september:9, october:10, oct:10, november:11, nov:11, december:12, dec:12 };

  for (const pat of patterns) {
    const m = text.substring(0, 2000).match(pat);
    if (m) {
      let year, month, day;
      if (m[3]) { // Full date with year
        month = months[m[1].toLowerCase()];
        day = parseInt(m[2]);
        year = parseInt(m[3]);
      } else if (m[2] && months[m[2].toLowerCase()]) {
        // "8th of January" format
        day = parseInt(m[1]);
        month = months[m[2].toLowerCase()];
        // Estimate year
        year = month <= 2 ? 2026 : 2025;
      }
      if (year && month && day) {
        return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      }
    }
  }
  return null;
}

// Extract key topics from transcript
function extractTopics(text) {
  const techTerms = [
    'ruflo', 'claude flow', 'ruvector', 'ruv-swarm', 'agentic', 'swarm',
    'mcp', 'model context protocol', 'hnsw', 'embedding', 'vector', 'rag',
    'sparc', 'neural', 'typescript', 'postgresql', 'wasm', 'onnx',
    'anti-gravity', 'flow-nexus', 'openclaw', 'kaltura', 'coaching',
    'llm', 'claude', 'anthropic', 'ai agent', 'multi-agent', 'orchestration',
    'ruvnet', 'ruv', 'memory', 'postgres', 'webhook', 'api', 'typescript'
  ];

  const found = new Set();
  const lower = text.toLowerCase();
  for (const term of techTerms) {
    if (lower.includes(term)) found.add(term.replace(/\s+/g, '-'));
  }
  return Array.from(found).slice(0, 10);
}

// Chunk transcript into overlapping pieces
function chunkText(text, title, videoId) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + CHUNK_SIZE);
    const chunkText = chunkWords.join(' ');

    if (chunkText.length > 100) { // Skip tiny chunks
      chunks.push({
        text: chunkText,
        index: chunks.length,
        title: `${title} — Part ${chunks.length + 1}`,
      });
    }

    i += CHUNK_SIZE - CHUNK_OVERLAP;
    if (i >= words.length) break;
  }

  return chunks;
}

// Simple hash-based embedding (same pattern as existing ingest scripts)
function makeEmbedding(text) {
  const embedding = new Array(384).fill(0);
  const hash = createHash('sha256').update(text).digest();
  for (let i = 0; i < 384; i++) {
    embedding[i] = ((hash[i % 32] / 255) * 2 - 1) * 0.1;
  }
  // Add some text features
  const lower = text.toLowerCase();
  const features = ['ruvnet', 'claude', 'agent', 'vector', 'swarm', 'mcp', 'coaching', 'agentic', 'sparc', 'neural'];
  features.forEach((f, fi) => {
    if (lower.includes(f)) embedding[fi * 10] += 0.3;
  });
  return embedding;
}

async function ingestVideo(client, video) {
  const txtFile = `${TRANSCRIPT_DIR}/${video.id}.txt`;
  if (!existsSync(txtFile)) {
    console.log(`  ✗ No transcript file: ${txtFile}`);
    return 0;
  }

  const rawText = readFileSync(txtFile, 'utf8');

  // Check if already ingested
  const existing = await client.query(
    `SELECT COUNT(*) as cnt FROM ask_ruvnet.architecture_docs
     WHERE file_path LIKE $1 AND category = 'coaching'`,
    [`%agentics-kaltura/${video.id}%`]
  );

  if (parseInt(existing.rows[0].cnt) > 0) {
    console.log(`  ⏭  ${video.id}: already has ${existing.rows[0].cnt} entries in DB`);
    return 0;
  }

  // Detect actual date from transcript
  const detectedDate = detectDate(rawText);
  const sessionDate = detectedDate || video.date;

  const topics = extractTopics(rawText);
  const chunks = chunkText(rawText, video.title, video.id);

  console.log(`  📄 ${video.id}: ${chunks.length} chunks, date: ${sessionDate}, topics: ${topics.slice(0,5).join(', ')}`);

  let count = 0;
  for (const chunk of chunks) {
    const docId = `agentics-kaltura-${video.id}-${chunk.index}`;
    const fileHash = createHash('md5').update(chunk.text).digest('hex');
    const embedding = makeEmbedding(chunk.text);
    const embStr = '[' + embedding.join(',') + ']';

    try {
      await client.query(`
        INSERT INTO ask_ruvnet.architecture_docs (
          doc_id, title, content, file_path, section_header, section_index,
          file_hash, package_name, package_version, doc_type, topics, category,
          quality_score, is_duplicate, embedding, knowledge_type, expertise_level,
          source_authority
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15::ruvector(384), $16, $17, $18
        )
        ON CONFLICT (doc_id) DO NOTHING
      `, [
        docId, chunk.title, chunk.text,
        `agentics-kaltura/${video.id}`,
        video.title, chunk.index,
        fileHash, 'agentics-foundation', sessionDate,
        'transcript', topics, video.category,
        85, false, embStr,
        'concept', 'intermediate',
        'expert-curated'
      ]);
      count++;
    } catch (e) {
      console.error(`    Error inserting chunk ${chunk.index}: ${e.message}`);
    }
  }

  return count;
}

async function main() {
  const client = await pool.connect();
  console.log('Connected to PostgreSQL\n');

  let totalInserted = 0;

  for (const video of VIDEOS) {
    console.log(`\n📹 Processing: ${video.title.substring(0, 60)}...`);
    const count = await ingestVideo(client, video);
    totalInserted += count;
    if (count > 0) console.log(`  ✓ Inserted ${count} chunks`);
  }

  client.release();
  await pool.end();

  console.log(`\n=== INGESTION COMPLETE: ${totalInserted} total entries inserted ===`);

  // Verify
  const verify = await (async () => {
    const p2 = new Pool({ host: 'localhost', port: 5435, user: 'postgres', database: 'postgres', max: 1 });
    const c2 = await p2.connect();
    const r = await c2.query(`SELECT COUNT(*) as cnt FROM ask_ruvnet.architecture_docs WHERE file_path LIKE 'agentics-kaltura/%'`);
    c2.release();
    await p2.end();
    return r.rows[0].cnt;
  })();

  console.log(`DB total agentics-kaltura entries: ${verify}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
