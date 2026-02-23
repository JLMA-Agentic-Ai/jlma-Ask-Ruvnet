/**
 * enrich-coaching-sessions.mjs
 *
 * LLM-powered knowledge distillation for rUv coaching session transcripts.
 *
 * Rather than leaving raw transcript chunks as the only representation,
 * this script processes each session through Groq (llama-3.3-70b-versatile)
 * to extract:
 *   - Architectural decisions and recommendations
 *   - Code patterns with context
 *   - Version-specific guidance (what changed vs older approach)
 *   - Key concepts explained in rUv's own synthesized voice
 *   - Troubleshooting patterns
 *
 * Output: High-quality (quality_score: 92-98) structured entries in
 * ask_ruvnet.architecture_docs alongside the raw transcript chunks.
 * These are what the RAG system should primarily surface.
 *
 * Usage:
 *   node scripts/enrich-coaching-sessions.mjs
 *   node scripts/enrich-coaching-sessions.mjs --session 2026-01-08
 *   node scripts/enrich-coaching-sessions.mjs --limit 3   (process only 3 sessions)
 */

import pg from '../node_modules/pg/lib/index.js';
import { createHash } from 'crypto';
import https from 'https';

const { Pool } = pg;

// ── Config ──────────────────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_MAX_TOKENS = 3000;
const MAX_TRANSCRIPT_CHARS = 12000; // Stay well within LLM context limits
const QUALITY_SCORE_ENRICHED = 95;
const QUALITY_SCORE_SUMMARY = 92;

// CLI args
const args = process.argv.slice(2);
const SESSION_FILTER = args.includes('--session') ? args[args.indexOf('--session') + 1] : null;
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 999;
const DRY_RUN = args.includes('--dry-run');

const pool = new Pool({
  host: 'localhost', port: 5435, user: 'postgres', database: 'postgres', max: 3
});

// ── Proactive token budget tracker ──────────────────────────────────────────
// Groq free tier: 12,000 TPM for llama-3.3-70b-versatile.
// We track tokens used in a rolling 60-second window and pre-emptively wait
// before each call so we never exceed the limit. No surprises, no hammering.
const TOKEN_BUDGET_TPM = 11000; // Stay 8% under the 12K limit as a safety buffer
const TOKEN_WINDOW_MS  = 62000; // Slightly over 60s to ensure the window fully resets

class TokenBudget {
  constructor() {
    this._calls = []; // [{ ts, tokens }]
    // Conservative startup pre-fill: assume we used most of the budget just now.
    // This prevents the first call from firing before Groq's server-side window has
    // had time to clear after a restart. waitForCapacity will hold ~32s on first call,
    // but skips the wait entirely if the window has already been clear for a while.
    this.record(Math.floor(TOKEN_BUDGET_TPM * 0.7));
  }

  // Remove calls older than the rolling window
  _prune() {
    const cutoff = Date.now() - TOKEN_WINDOW_MS;
    this._calls = this._calls.filter(c => c.ts > cutoff);
  }

  // Tokens used in the current rolling window
  used() { this._prune(); return this._calls.reduce((s, c) => s + c.tokens, 0); }

  // Wait however long is needed so that adding `tokens` stays under TPM budget.
  // Logs clearly so it's obvious we're planning ahead, not reacting to an error.
  async waitForCapacity(tokens) {
    while (true) {
      this._prune();
      const currentUsed = this.used();
      if (currentUsed + tokens <= TOKEN_BUDGET_TPM) break;

      // Find the oldest call in the window — once it expires, we'll have room
      const oldest = this._calls[0];
      const waitMs = oldest ? (oldest.ts + TOKEN_WINDOW_MS - Date.now() + 500) : 5000;
      const waitSec = Math.ceil(waitMs / 1000);
      console.log(`    ⏱  Pacing: used ${currentUsed}/${TOKEN_BUDGET_TPM} tokens in window, waiting ${waitSec}s to stay within limits...`);
      await new Promise(r => setTimeout(r, Math.max(waitMs, 1000)));
      this._prune();
    }
  }

  // Record a completed call
  record(tokens) { this._calls.push({ ts: Date.now(), tokens }); }
}

const budget = new TokenBudget();

// Estimate tokens from text length (Groq uses cl100k-style tokeniser ~3.7 chars/token)
function estimateTokens(systemPrompt, userContent, maxTokens) {
  const inputTokens = Math.ceil((systemPrompt.length + userContent.length) / 3.7);
  return inputTokens + maxTokens; // Worst-case total (actual output is usually less)
}

// ── Groq API call with proactive budget management + safety-net retry ────────
async function callGroq(systemPrompt, userContent, maxTokens = GROQ_MAX_TOKENS, retries = 5) {
  const estimatedTokens = estimateTokens(systemPrompt, userContent, maxTokens);

  for (let attempt = 0; attempt < retries; attempt++) {
    // Pre-emptively wait BEFORE every attempt (including retries) so the budget
    // is always checked fresh. First attempt benefits from this too.
    await budget.waitForCapacity(estimatedTokens);

    try {
      const result = await new Promise((resolve, reject) => {
        const body = JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: maxTokens,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ]
        });

        const req = https.request({
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        }, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try {
              const j = JSON.parse(d);
              if (j.error) {
                if (j.error.code === 'rate_limit_exceeded' || j.error.type === 'tokens') {
                  reject(new Error('RATE_LIMIT:' + JSON.stringify(j.error)));
                } else {
                  reject(new Error('GROQ_ERROR:' + JSON.stringify(j.error)));
                }
              } else {
                // Use actual token count from Groq's response for precise future pacing
                const actualTokens = j.usage?.total_tokens || estimatedTokens;
                budget.record(actualTokens);
                resolve(j.choices[0].message.content);
              }
            } catch (e) { reject(new Error('Parse error: ' + d.substring(0, 200))); }
          });
        });
        req.on('error', reject);
        req.setTimeout(90000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.write(body);
        req.end();
      });
      return result;

    } catch (e) {
      const msg = e.message || '';
      if (msg.startsWith('RATE_LIMIT:') || msg.includes('rate_limit') || msg.includes('429')) {
        // Parse Groq's suggested wait time, or fall back to full window reset
        const suggested = msg.match(/try again in (\d+\.?\d*)s/);
        const waitMs = suggested
          ? parseFloat(suggested[1]) * 1000 + 3000  // Groq's suggestion + 3s buffer
          : TOKEN_WINDOW_MS;                         // Full 62s window reset as fallback
        // Log full Groq error for diagnosis
        const rawDetail = msg.replace('RATE_LIMIT:', '').substring(0, 300);
        console.log(`    ⚠  Rate limit hit (attempt ${attempt+1}/${retries}) — filling budget, waiting ${Math.round(waitMs/1000)}s...`);
        console.log(`       Groq says: ${rawDetail}`);
        // Fill the budget so waitForCapacity on the next iteration will pace correctly
        const fill = Math.max(0, TOKEN_BUDGET_TPM - budget.used());
        if (fill > 0) budget.record(fill + 500);
        await new Promise(r => setTimeout(r, waitMs));
      } else if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 4000 * (attempt + 1)));
      } else {
        throw e;
      }
    }
  }
  throw new Error('callGroq: all retries exhausted');
}

// ── Hash-based embedding (same pattern as rest of codebase) ──────────────────
function makeEmbedding(text) {
  const embedding = new Array(384).fill(0);
  const hash = createHash('sha256').update(text).digest();
  for (let i = 0; i < 384; i++) {
    embedding[i] = ((hash[i % 32] / 255) * 2 - 1) * 0.1;
  }
  const techTerms = ['ruv', 'ruvnet', 'claude', 'agentic', 'swarm', 'mcp', 'hnsw', 'vector', 'sparc', 'neural', 'coaching', 'decision', 'architecture', 'pattern'];
  techTerms.forEach((t, i) => {
    if (text.toLowerCase().includes(t)) embedding[i * 10] += 0.3;
  });
  return '[' + embedding.join(',') + ']';
}

// ── Insert enriched entry ────────────────────────────────────────────────────
async function insertEntry(client, { docId, title, content, filePath, sectionHeader, sectionIndex, packageVersion, topics, category, qualityScore, knowledgeType }) {
  const fileHash = createHash('md5').update(content).digest('hex');
  const embedding = makeEmbedding(content);

  try {
    const result = await client.query(`
      INSERT INTO ask_ruvnet.architecture_docs (
        doc_id, title, content, file_path, section_header, section_index,
        file_hash, package_name, package_version, doc_type, topics, category,
        quality_score, is_duplicate, embedding, knowledge_type, expertise_level,
        source_authority, triage_tier
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15::ruvector(384), $16, $17, $18, $19
      )
      ON CONFLICT (doc_id) DO UPDATE SET
        content = EXCLUDED.content,
        title = EXCLUDED.title,
        quality_score = EXCLUDED.quality_score,
        updated_at = NOW()
    `, [
      docId, title, content, filePath, sectionHeader, sectionIndex,
      fileHash, 'ruv-coaching-enriched', packageVersion, 'documentation', topics, category,
      qualityScore, false, embedding, knowledgeType, 'advanced',
      'expert-curated', 'gold'
    ]);
    return result.rowCount;
  } catch (e) {
    console.error(`    ✗ Insert failed for ${docId}: ${e.message}`);
    return 0;
  }
}

// ── Main extraction prompt ───────────────────────────────────────────────────
const EXTRACTION_SYSTEM_PROMPT = `You are an expert technical knowledge extractor analyzing transcripts from rUv (Ruven Cohen), the creator of the RuvNet agentic AI ecosystem.

RuvNet ecosystem includes: claude-flow v3, agentic-flow, ruv-swarm, ruvector (PostgreSQL vector extension), ONNX embeddings, HNSW indexing, SPARC methodology, Flow-Nexus, OpenClaw.

Your task: Extract STRUCTURED KNOWLEDGE from the transcript. Focus exclusively on:
1. Architectural decisions and WHY rUv made them
2. Specific recommended patterns with exact CLI commands, config values, code examples
3. What changed from previous versions and WHY (version evolution rationale)
4. Troubleshooting approaches and root causes rUv diagnosed
5. Performance numbers and benchmarks rUv cited
6. Anti-patterns rUv warned against

CRITICAL RULES:
- Write in third person ("rUv recommends...", "As of [date], the pattern is...")
- Include version numbers when mentioned (e.g., claude-flow v3.0.0-alpha.118)
- DO NOT include conversational filler, greetings, off-topic discussion
- Each extracted item must be independently useful without the full transcript context
- Mark recency: prefix with "[DATE] " if you know the session date
- If rUv says something that updates or contradicts older guidance, note it explicitly

Output a JSON array of knowledge entries. Each entry:
{
  "type": "decision|procedure|pattern|concept|troubleshooting|benchmark",
  "title": "Concise title (max 100 chars)",
  "content": "Full useful content (200-800 chars). Self-contained, professional, no filler.",
  "topics": ["tag1", "tag2"],  // 3-8 relevant lowercase tags
  "confidence": 0.8  // how confident you are this is accurate rUv guidance (0.5-1.0)
}

Return ONLY the JSON array. No markdown, no explanation.`;

// ── Per-session enrichment ───────────────────────────────────────────────────
async function enrichSession(client, sessionDate, chunks) {
  // Reconstruct transcript in order
  const sortedChunks = [...chunks].sort((a, b) => a.section_index - b.section_index);
  const fullTranscript = sortedChunks.map(c => c.content).join(' ');
  const totalChars = fullTranscript.length;

  // Split into windows covering the FULL transcript (beginning, middle, end)
  // For short transcripts: 1 window. For long: up to 3 windows sampling across the session.
  const windows = [];
  if (totalChars <= MAX_TRANSCRIPT_CHARS) {
    windows.push({ text: fullTranscript, label: 'full' });
  } else {
    // Window 1: beginning (first 12K)
    windows.push({ text: fullTranscript.substring(0, MAX_TRANSCRIPT_CHARS), label: 'start' });
    // Window 2: middle
    const midStart = Math.floor(totalChars / 2) - MAX_TRANSCRIPT_CHARS / 2;
    windows.push({ text: fullTranscript.substring(midStart, midStart + MAX_TRANSCRIPT_CHARS), label: 'middle' });
    // Window 3: end (last 12K)
    windows.push({ text: fullTranscript.substring(totalChars - MAX_TRANSCRIPT_CHARS), label: 'end' });
  }

  const wordCount = Math.round(fullTranscript.split(/\s+/).length);
  console.log(`  📝 Transcript: ${wordCount} words, ${Math.round(totalChars/1000)}K chars → ${windows.length} window(s) (from ${chunks.length} chunks)`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would process ${windows.length} windows`);
    return 0;
  }

  // Step 1: Extract structured knowledge items from each window
  const allExtracted = [];
  for (const [wi, win] of windows.entries()) {
    try {
      const userMsg = `SESSION DATE: ${sessionDate}\nSECTION: ${win.label}\n\nTRANSCRIPT EXCERPT:\n${win.text}`;
      const raw = await callGroq(EXTRACTION_SYSTEM_PROMPT, userMsg, 3000);
      // Robust JSON extraction: find first '[' to last ']'
      let cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
      const arrStart = cleaned.indexOf('[');
      const arrEnd = cleaned.lastIndexOf(']');
      if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
        cleaned = cleaned.substring(arrStart, arrEnd + 1);
      }
      const items = JSON.parse(cleaned);
      if (Array.isArray(items)) {
        allExtracted.push(...items);
        console.log(`  ✓ Window ${wi+1}/${windows.length} (${win.label}): ${items.length} items`);
      }
    } catch (e) {
      console.error(`  ✗ Window ${wi+1} extraction failed: ${e.message.substring(0,80)}`);
    }
    // No fixed sleep needed — TokenBudget handles pacing proactively before each call
  }

  // Deduplicate by title similarity
  const seenTitles = new Set();
  const extracted = allExtracted.filter(item => {
    if (!item.title) return false;
    const key = item.title.toLowerCase().replace(/\s+/g, '-').substring(0, 40);
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });
  console.log(`  ✓ Total: ${extracted.length} unique items (${allExtracted.length} before dedup)`);

  // Step 2: Generate session summary from beginning window
  let summary = '';
  try {
    const summaryPrompt = `Summarize this rUv coaching session (${sessionDate}) in 3-4 paragraphs.
Focus on: main topics covered, key architectural decisions, specific tools/versions mentioned, and what was new or changed vs previous sessions.
Be precise and technical. Reference actual version numbers, command names, and patterns.
Write as technical documentation, not a review.`;

    summary = await callGroq(summaryPrompt, `TRANSCRIPT EXCERPTS:\n${windows[0].text}`, 800);
    console.log(`  ✓ Generated session summary (${summary.length} chars)`);
  } catch (e) {
    console.warn(`  ⚠ Summary generation failed: ${e.message}`);
  }

  let insertCount = 0;

  // Step 3: Insert summary entry
  if (summary) {
    const summaryDocId = `enriched-summary-${sessionDate}`;
    const inserted = await insertEntry(client, {
      docId: summaryDocId,
      title: `rUv Session Summary — ${sessionDate}`,
      content: summary,
      filePath: `enriched/${sessionDate}/summary`,
      sectionHeader: 'Session Summary',
      sectionIndex: 0,
      packageVersion: sessionDate,
      topics: ['ruv', 'coaching', 'session-summary', 'ruvnet', 'agentic'],
      category: 'coaching',
      qualityScore: QUALITY_SCORE_SUMMARY,
      knowledgeType: 'overview'
    });
    insertCount += inserted;
  }

  // Step 4: Insert each extracted knowledge item
  for (let i = 0; i < extracted.length; i++) {
    const item = extracted[i];
    if (!item.title || !item.content || item.content.length < 50) continue;
    if (item.confidence < 0.6) continue; // Skip low-confidence extractions

    const knowledgeTypeMap = {
      decision: 'decision', procedure: 'procedure', pattern: 'pattern',
      concept: 'concept', troubleshooting: 'troubleshooting', benchmark: 'reference'
    };
    const knowledgeType = knowledgeTypeMap[item.type] || 'concept';
    const qualityScore = Math.round(QUALITY_SCORE_ENRICHED * item.confidence);

    const docId = `enriched-${sessionDate}-${item.type}-${i}`;
    const topics = Array.isArray(item.topics) ? item.topics.slice(0, 8) : ['ruv', 'coaching'];

    // Prefix content with date for recency awareness
    const content = `[${sessionDate}] ${item.content}`;

    const inserted = await insertEntry(client, {
      docId,
      title: item.title,
      content,
      filePath: `enriched/${sessionDate}/${item.type}/${i}`,
      sectionHeader: `${item.type}: ${item.title.substring(0, 50)}`,
      sectionIndex: i + 1,
      packageVersion: sessionDate,
      topics,
      category: 'coaching',
      qualityScore,
      knowledgeType
    });
    insertCount += inserted;
  }

  return insertCount;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🧠 RuvNet Coaching Session Enrichment Pipeline');
  console.log(`   Model: ${GROQ_MODEL}`);
  console.log(`   Filter: ${SESSION_FILTER || 'all sessions'}`);
  console.log(`   Limit: ${LIMIT} sessions`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  const client = await pool.connect();

  // Get all coaching sessions with their chunk counts, ordered newest first
  let sessionsQuery = `
    SELECT package_version, COUNT(*) as chunks, SUM(LENGTH(content)) as total_chars
    FROM ask_ruvnet.architecture_docs
    WHERE category = 'coaching'
    AND triage_tier != 'gold'  -- Skip already-enriched entries
    AND file_path NOT LIKE 'enriched/%'
  `;
  if (SESSION_FILTER) sessionsQuery += ` AND package_version = '${SESSION_FILTER}'`;
  sessionsQuery += ` GROUP BY package_version ORDER BY package_version DESC LIMIT ${LIMIT}`;

  const sessionsResult = await client.query(sessionsQuery);
  const sessions = sessionsResult.rows;

  console.log(`Found ${sessions.length} sessions to enrich:\n`);
  sessions.forEach(s => console.log(`  ${s.package_version}: ${s.chunks} chunks, ${Math.round(s.total_chars/1000)}K chars`));
  console.log('');

  let totalInserted = 0;
  let processed = 0;

  for (const session of sessions) {
    const sessionDate = session.package_version;
    console.log(`\n📅 Enriching session: ${sessionDate} (${session.chunks} chunks)`);

    // Check if already enriched (has gold entries for this date)
    const enrichedCheck = await client.query(
      `SELECT COUNT(*) as cnt FROM ask_ruvnet.architecture_docs
       WHERE package_version = $1 AND triage_tier = 'gold' AND file_path LIKE 'enriched/%'`,
      [sessionDate]
    );

    if (parseInt(enrichedCheck.rows[0].cnt) > 0) {
      console.log(`  ⏭  Already has ${enrichedCheck.rows[0].cnt} enriched entries, skipping`);
      continue;
    }

    // Fetch all chunks for this session
    const chunksResult = await client.query(
      `SELECT content, section_index, file_path FROM ask_ruvnet.architecture_docs
       WHERE category = 'coaching' AND package_version = $1
       AND file_path NOT LIKE 'enriched/%'
       ORDER BY section_index ASC`,
      [sessionDate]
    );

    const chunks = chunksResult.rows;
    if (chunks.length === 0) {
      console.log('  ⚠ No chunks found, skipping');
      continue;
    }

    try {
      const count = await enrichSession(client, sessionDate, chunks);
      totalInserted += count;
      processed++;
      console.log(`  ✅ Session done: ${count} enriched entries inserted`);
      // No fixed inter-session sleep — TokenBudget paces all calls automatically
    } catch (e) {
      console.error(`  ✗ Session failed: ${e.message}`);
    }
  }

  client.release();
  await pool.end();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ ENRICHMENT COMPLETE`);
  console.log(`   Sessions processed: ${processed}`);
  console.log(`   Total entries inserted: ${totalInserted}`);

  // Final stats
  const statsPool = new Pool({ host: 'localhost', port: 5435, user: 'postgres', database: 'postgres', max: 1 });
  const statsClient = await statsPool.connect();
  const stats = await statsClient.query(`
    SELECT
      COUNT(*) FILTER (WHERE triage_tier = 'gold') as gold_entries,
      COUNT(*) FILTER (WHERE knowledge_type = 'decision') as decisions,
      COUNT(*) FILTER (WHERE knowledge_type = 'procedure') as procedures,
      COUNT(*) FILTER (WHERE knowledge_type = 'pattern') as patterns,
      COUNT(*) FILTER (WHERE knowledge_type = 'overview') as summaries
    FROM ask_ruvnet.architecture_docs
    WHERE category = 'coaching' AND file_path LIKE 'enriched/%'
  `);
  const row = stats.rows[0];
  console.log(`\n   KB enriched entries by type:`);
  console.log(`   🥇 Gold quality: ${row.gold_entries}`);
  console.log(`   🏛  Decisions:    ${row.decisions}`);
  console.log(`   📋 Procedures:   ${row.procedures}`);
  console.log(`   🔁 Patterns:     ${row.patterns}`);
  console.log(`   📄 Summaries:    ${row.summaries}`);
  statsClient.release();
  await statsPool.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
