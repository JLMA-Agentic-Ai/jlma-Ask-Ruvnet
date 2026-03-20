#!/usr/bin/env node
/**
 * Ask-RuvNet MCP Server v7.0.0
 * Updated: 2026-03-14 10:00:00 EST
 *
 * EMBEDDED-ONLY ARCHITECTURE (no PostgreSQL at runtime)
 * - 377 expert-curated gold entries loaded from static files at startup
 * - Binary-quantized vectors (48 bytes each, 18KB total)
 * - ONNX embeddings via @xenova/transformers (all-MiniLM-L6-v2, 384d)
 * - Hamming distance search (<1ms per query over 377 entries)
 * - Auto-update: checks npm registry, self-updates in background
 * - Zero runtime dependencies on external services
 * - 85x smaller than v6 (0.5MB vs 45MB) — powered by RuVector RVF compression
 *
 * Data files (shipped in kb-data/):
 *   kb-entries.json.gz   - Compressed entries (0.5MB, 1.7MB raw)
 *   kb-embeddings.bin    - Binary-quantized vectors (18KB)
 *   kb-metadata.json     - Export metadata, categories, content hash
 *
 * 10 Tools:
 *   1. kb_search      - Semantic search (hamming on binary vectors)
 *   2. kb_search_all  - Cross-category search
 *   3. kb_teach       - Teaching entries (plain-English explanations)
 *   4. kb_wasm        - WASM/browser development guidance
 *   5. kb_add         - (Stub) Directs to local PG authoring workflow
 *   6. kb_feedback    - (Stub) Logs feedback to stderr
 *   7. kb_related     - Find similar entries by semantic distance
 *   8. kb_domains     - List categories with counts
 *   9. kb_stats       - Detailed KB statistics
 *  10. kb_status      - Health, version, update availability
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gunzipSync } from 'zlib';
import { execFile } from 'child_process';

// ============================================================================
// Paths and Constants
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.join(__dirname, '..', 'kb-data');
const PKG_PATH = path.join(__dirname, '..', 'package.json');
const DIMS = 384;
const BYTES_PER_VEC = DIMS / 8; // 48

// ============================================================================
// State
// ============================================================================

let entries = null;
let embeddings = null;
let metadata = null;
let pkgVersion = 'unknown';
let latestNpmVersion = null;
let updateMessage = null;
let embedPipeline = null;
let isLoaded = false;
let loadTimeMs = 0;
let searchCount = 0;

// ============================================================================
// Helpers
// ============================================================================

function log(msg) {
  process.stderr.write('[ruvector-kb v5.0.0] ' + msg + '\n');
}

function txt(msg) {
  return { content: [{ type: 'text', text: msg }] };
}

// ============================================================================
// Binary Vector Search
// ============================================================================

function popcount32(x) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
}

function binaryQuantize(floatVec) {
  const bytes = new Uint8Array(BYTES_PER_VEC);
  for (let i = 0; i < DIMS; i++) {
    if (floatVec[i] > 0) {
      bytes[i >>> 3] |= (128 >>> (i & 7));
    }
  }
  return bytes;
}

function hammingDist(stored, offset, query) {
  let dist = 0;
  for (let i = 0; i < BYTES_PER_VEC; i += 4) {
    const xor = (
      ((stored[offset + i] ^ query[i]) << 24) |
      ((stored[offset + i + 1] ^ query[i + 1]) << 16) |
      ((stored[offset + i + 2] ^ query[i + 2]) << 8) |
      (stored[offset + i + 3] ^ query[i + 3])
    ) >>> 0;
    dist += popcount32(xor);
  }
  return dist;
}

function searchVectors(queryBin, limit, filterFn) {
  const scored = [];
  for (let i = 0; i < entries.length; i++) {
    if (filterFn && !filterFn(entries[i])) continue;
    scored.push({ idx: i, dist: hammingDist(embeddings, i * BYTES_PER_VEC, queryBin) });
  }
  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, limit).map(s => {
    const e = entries[s.idx];
    return {
      id: e.id,
      title: e.title,
      content: e.content,
      summary: e.summary || null,
      category: e.category,
      quality_score: e.quality_score,
      knowledge_type: e.knowledge_type,
      expertise_level: e.expertise_level,
      source_authority: e.source_authority,
      concepts: e.concepts,
      similarity: Math.round((1 - s.dist / DIMS) * 100),
      distance: s.dist,
    };
  });
}

// ============================================================================
// Embedding (ONNX)
// ============================================================================

async function initEmbedding() {
  if (embedPipeline) return;
  try {
    const mod = await import('@xenova/transformers');
    embedPipeline = await mod.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
    log('ONNX ready (Xenova/all-MiniLM-L6-v2, 384d)');
    return;
  } catch (err) {
    log('Xenova unavailable: ' + err.message);
  }
  try {
    const os = await import('os');
    const embPath = process.env.CLAUDE_FLOW_EMBEDDINGS_PATH ||
      path.join(os.default.homedir(), '.npm-global/lib/node_modules/@claude-flow/cli/node_modules/@claude-flow/embeddings/dist/index.js');
    const m = await import(embPath);
    const fn = m.createEmbeddingServiceAsync || m.default?.createEmbeddingServiceAsync;
    if (!fn) throw new Error('No embedding function');
    const svc = await fn({ provider: 'transformers', model: 'Xenova/all-MiniLM-L6-v2', dimensions: 384 });
    await svc.embed('warmup');
    embedPipeline = { _svc: svc };
    log('ONNX ready (claude-flow fallback)');
  } catch (err2) {
    log('WARNING: No embedding available - ' + err2.message);
  }
}

async function embedQuery(text) {
  if (!embedPipeline) throw new Error('Embedding not initialized');
  const clean = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  if (embedPipeline._svc) {
    const r = await embedPipeline._svc.embed(clean);
    return Array.from(r.embedding || r);
  }
  const out = await embedPipeline(clean, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadKB() {
  if (isLoaded) return;
  const t0 = Date.now();

  try { pkgVersion = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8')).version; } catch {}

  metadata = JSON.parse(fs.readFileSync(path.join(KB_DIR, 'kb-metadata.json'), 'utf-8'));

  const gzPath = path.join(KB_DIR, 'kb-entries.json.gz');
  const jsonPath = path.join(KB_DIR, 'kb-entries.json');
  if (fs.existsSync(gzPath)) {
    entries = JSON.parse(gunzipSync(fs.readFileSync(gzPath)).toString('utf-8'));
    log('Entries: ' + entries.length.toLocaleString() + ' (gzip)');
  } else if (fs.existsSync(jsonPath)) {
    entries = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    log('Entries: ' + entries.length.toLocaleString() + ' (json)');
  } else {
    throw new Error('No KB data in ' + KB_DIR);
  }

  embeddings = new Uint8Array(fs.readFileSync(path.join(KB_DIR, 'kb-embeddings.bin')));
  const expected = entries.length * BYTES_PER_VEC;
  if (embeddings.length !== expected) {
    log('WARNING: embedding size ' + embeddings.length + ' != expected ' + expected);
  }

  isLoaded = true;
  loadTimeMs = Date.now() - t0;
  log('KB loaded in ' + loadTimeMs + 'ms');
}

// ============================================================================
// Auto-Update
// ============================================================================

async function checkForUpdates() {
  try {
    const resp = await fetch('https://registry.npmjs.org/ruvnet-kb-first/latest', {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    latestNpmVersion = data.version;
    if (latestNpmVersion && latestNpmVersion !== pkgVersion) {
      updateMessage = 'v' + pkgVersion + ' -> v' + latestNpmVersion;
      log('UPDATE AVAILABLE: ' + updateMessage);
      autoUpdate();
    }
  } catch {}
}

function autoUpdate() {
  // Self-update in background via npm. Next MCP restart picks up new version.
  // Only works for global installs. npx users already get latest.
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    const child = execFile(npmBin, ['install', '-g', 'ruvnet-kb-first@latest'], {
      timeout: 120000,
      stdio: 'ignore',
    }, (err) => {
      if (err) {
        log('Auto-update failed (non-fatal): ' + err.message);
      } else {
        log('Auto-update complete. Restart MCP to use v' + latestNpmVersion);
      }
    });
    child.unref();
  } catch (err) {
    log('Auto-update skipped: ' + err.message);
  }
}

// ============================================================================
// Intent Detection
// ============================================================================

function detectIntent(query) {
  const q = query.toLowerCase();
  if (/how (do|to|can|should) i|steps to|guide for|tutorial/.test(q)) return 'how-to';
  if (/what is|what are|define|explain|describe/.test(q)) return 'what-is';
  if (/why does|why is|why do|reason for/.test(q)) return 'why';
  if (/example|show me|demo|sample|snippet/.test(q)) return 'example';
  if (/error|fix|bug|issue|broken|fail|crash|troubleshoot/.test(q)) return 'troubleshoot';
  if (/compare|vs|versus|difference|better/.test(q)) return 'compare';
  return 'general';
}

// ============================================================================
// Formatting
// ============================================================================

function formatResults(results) {
  return results.map((r, i) => {
    const tag = r.source_authority === 'expert-curated' ? 'curated' : (r.knowledge_type || 'reference');
    let out = (i + 1) + '. **' + r.title + '** [' + tag + ']\n';
    out += '   Similarity: ' + r.similarity + '% | Quality: ' + r.quality_score + '/100 | Category: ' + r.category + '\n';
    if (r.concepts && r.concepts.length > 0) out += '   Concepts: ' + r.concepts.join(', ') + '\n';
    out += '   ' + (r.summary || r.content || '').replace(/\n/g, ' ').slice(0, 300);
    return out;
  }).join('\n\n');
}

function formatTeaching(results) {
  return results.map((r, i) => {
    return '---\n## ' + (i + 1) + '. ' + r.title + '\n' +
      'Quality: ' + r.quality_score + '/100 | Match: ' + r.similarity + '% | Category: ' + r.category + '\n\n' +
      r.content;
  }).join('\n\n');
}

// ============================================================================
// MCP Server
// ============================================================================

const server = new Server(
  { name: 'ruvector-kb', version: '5.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'kb_search',
      description: 'Search ' + (metadata?.totalEntries?.toLocaleString() || '102,857') + ' knowledge entries covering RuVector, agents, swarms, HNSW, embeddings, ONNX, MCP, RVF, AIMDS, Ruflo, RuView, DensePose, and 155+ repos. Semantic ranked results with quality scores.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (natural language)' },
          limit: { type: 'number', description: 'Max results (default: 5, max: 20)' },
          category: { type: 'string', description: 'Filter by category (e.g., agents, vector-db, teaching, swarms)' },
          min_quality: { type: 'number', description: 'Minimum quality score 0-100 (default: 0)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'kb_search_all',
      description: 'Search across all knowledge categories. Returns results grouped by category for broad discovery.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Total results (default: 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'kb_teach',
      description: 'Search curated teaching entries for beginner-friendly explanations. Plain-English analogies about agents, swarms, vectors, HNSW, ONNX, MCP, RVF, AIMDS, Ruflo. Use when someone needs to UNDERSTAND a concept.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Concept to explain (e.g., "what is HNSW")' },
          limit: { type: 'number', description: 'Max teaching entries (default: 3)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'kb_wasm',
      description: 'WASM-specific knowledge: RuVector-WASM browser DB, Micro-HNSW, RVF cognitive containers, WASM SIMD. Code examples for zero-backend browser apps.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'WASM topic' },
          limit: { type: 'number', description: 'Max results (default: 5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'kb_add',
      description: 'Add a knowledge entry. NOTE: Embedded mode is read-only. Use local PostgreSQL authoring workflow.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          knowledge_type: { type: 'string' },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'kb_feedback',
      description: 'Record search quality feedback (logged but not persisted in embedded mode).',
      inputSchema: {
        type: 'object',
        properties: {
          entry_id: { type: 'number' },
          useful: { type: 'boolean' },
        },
        required: ['entry_id'],
      },
    },
    {
      name: 'kb_related',
      description: 'Find entries semantically related to a specific entry ID.',
      inputSchema: {
        type: 'object',
        properties: {
          entry_id: { type: 'number' },
          limit: { type: 'number' },
        },
        required: ['entry_id'],
      },
    },
    {
      name: 'kb_domains',
      description: 'List all knowledge categories with entry counts.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'kb_stats',
      description: 'Detailed KB statistics: entries, quality distribution, knowledge types, embedding info.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'kb_status',
      description: 'Health check: KB loaded, embedding status, version, update availability.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

// ============================================================================
// Tool Handler
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      case 'kb_search': {
        const limit = Math.min(args.limit || 5, 20);
        const category = args.category || null;
        const minQ = args.min_quality || 0;
        const intent = detectIntent(args.query);

        const vec = await embedQuery(args.query);
        const qBin = binaryQuantize(vec);

        const filter = (category || minQ)
          ? (e) => (!category || e.category === category) && ((e.quality_score || 0) >= minQ)
          : null;

        const results = searchVectors(qBin, limit, filter);
        searchCount++;

        if (results.length === 0) return txt('No results for "' + args.query + '". Try broader query or remove category filter.');

        const curated = results.filter(r => r.source_authority === 'expert-curated').length;
        const strategy = curated >= 2 ? 'curated-primary' : curated > 0 ? 'curated-augmented' : 'reference';

        return txt(
          '**RuvNet KB** | Intent: ' + intent + ' | Strategy: ' + strategy + ' | ' + results.length + ' results\n\n' +
          formatResults(results)
        );
      }

      case 'kb_search_all': {
        const limit = Math.min(args.limit || 10, 30);
        const vec = await embedQuery(args.query);
        const qBin = binaryQuantize(vec);
        const results = searchVectors(qBin, limit, null);
        searchCount++;

        if (results.length === 0) return txt('No results.');

        const byCat = {};
        for (const r of results) {
          (byCat[r.category] = byCat[r.category] || []).push(r);
        }

        const sections = Object.entries(byCat).map(([cat, items]) => {
          const lines = items.map((r, i) =>
            '   ' + (i + 1) + '. [' + (r.knowledge_type || '?') + '] ' + r.title + ' (' + r.similarity + '% match, q:' + r.quality_score + ')'
          ).join('\n');
          return '**' + cat + '** (' + items.length + '):\n' + lines;
        });

        return txt('Cross-Category: "' + args.query + '"\n\n' + sections.join('\n\n'));
      }

      case 'kb_teach': {
        const limit = Math.min(args.limit || 3, 10);
        const vec = await embedQuery(args.query);
        const qBin = binaryQuantize(vec);

        let results = searchVectors(qBin, limit, e => e.category === 'teaching');
        if (results.length === 0) {
          results = searchVectors(qBin, limit, e => e.category === 'coaching');
        }
        if (results.length === 0) {
          results = searchVectors(qBin, limit, e => (e.quality_score || 0) >= 80);
          if (results.length === 0) return txt('No teaching entries found.');
          return txt('No direct teaching entries. Related high-quality entries:\n\n' + formatTeaching(results));
        }

        searchCount++;
        return txt('**Teaching Knowledge** | ' + results.length + ' entries\n\n' + formatTeaching(results));
      }

      case 'kb_wasm': {
        const limit = Math.min(args.limit || 5, 10);
        const vec = await embedQuery(args.query);
        const qBin = binaryQuantize(vec);

        const wasmCats = new Set(['wasm-local-llm', 'ruvector-wasm', 'wasm-deployment']);
        let results = searchVectors(qBin, limit, e => wasmCats.has(e.category));

        if (results.length < limit) {
          const have = new Set(results.map(r => r.id));
          const extra = searchVectors(qBin, limit * 2, e => {
            if (have.has(e.id)) return false;
            const t = (e.title || '').toLowerCase();
            return t.includes('wasm') || t.includes('webassembly') || t.includes('browser') ||
                   t.includes('rvf') || t.includes('micro-hnsw') || t.includes('edge-full');
          });
          results = [...results, ...extra].slice(0, limit);
        }

        searchCount++;
        if (results.length === 0) return txt('No WASM entries found.');

        const fmt = results.map((r, i) => {
          const tag = wasmCats.has(r.category) ? '[WASM]' : '[related]';
          return '---\n## ' + (i + 1) + '. ' + r.title + ' ' + tag + '\n' +
            'Category: ' + r.category + ' | Quality: ' + r.quality_score + '/100 | Match: ' + r.similarity + '%\n\n' +
            r.content;
        }).join('\n\n');

        return txt('**WASM Knowledge** | ' + results.length + ' entries\n\n' + fmt);
      }

      case 'kb_add': {
        return txt(
          '**Read-Only Mode** - This MCP uses an embedded static KB.\n\n' +
          'To add entries, use the local authoring workflow:\n' +
          '1. Start ruvector-postgres Docker (port 5435)\n' +
          '2. INSERT into ask_ruvnet.architecture_docs\n' +
          '3. Run: node scripts/export-mcp-kb.mjs\n' +
          '4. npm publish (ships new kb-data/)\n\n' +
          'Entry "' + args.title + '" was NOT added.'
        );
      }

      case 'kb_feedback': {
        const useful = args.useful !== false;
        log('Feedback: entry ' + args.entry_id + ' ' + (useful ? 'useful' : 'not useful'));
        return txt('Feedback logged (entry ' + args.entry_id + ': ' + (useful ? 'useful' : 'not useful') + '). Note: not persisted in embedded mode.');
      }

      case 'kb_related': {
        const limit = Math.min(args.limit || 5, 20);
        const srcIdx = entries.findIndex(e => e.id === args.entry_id);
        if (srcIdx === -1) return txt('Entry ' + args.entry_id + ' not found.');

        const srcVec = embeddings.slice(srcIdx * BYTES_PER_VEC, (srcIdx + 1) * BYTES_PER_VEC);
        const results = searchVectors(srcVec, limit + 1, e => e.id !== args.entry_id);
        searchCount++;

        if (results.length === 0) return txt('No related entries found.');

        const items = results.map((r, i) =>
          (i + 1) + '. [' + (r.knowledge_type || '?') + '] **' + r.title + '** (' + r.similarity + '% similar, ' + r.category + ')'
        ).join('\n');

        return txt('Related to "' + entries[srcIdx].title + '" (id: ' + args.entry_id + '):\n\n' + items);
      }

      case 'kb_domains': {
        const cats = metadata.categories || [];
        const lines = cats.map(c => '- **' + c.name + '**: ' + c.count.toLocaleString() + ' entries');
        return txt(
          '**RuvNet Knowledge Base** (v' + pkgVersion + ')\n' +
          metadata.totalEntries.toLocaleString() + ' entries across ' + cats.length + ' categories\n' +
          'Exported: ' + metadata.exportedAt + '\n\n' +
          'Categories:\n' + lines.join('\n')
        );
      }

      case 'kb_stats': {
        const cats = metadata.categories || [];
        const topCats = cats.slice(0, 10).map(c => c.name + '(' + c.count + ')').join(', ');

        const qd = { gold: 0, silver: 0, bronze: 0, below: 0 };
        const types = {};
        for (const e of entries) {
          const q = e.quality_score || 0;
          if (q >= 80) qd.gold++; else if (q >= 60) qd.silver++; else if (q >= 40) qd.bronze++; else qd.below++;
          const t = e.knowledge_type || 'unknown';
          types[t] = (types[t] || 0) + 1;
        }
        const typeStr = Object.entries(types).sort(([, a], [, b]) => b - a).map(([t, c]) => t + ': ' + c.toLocaleString()).join(', ');
        const n = entries.length;

        return txt(
          '**KB Statistics** (v' + pkgVersion + ')\n\n' +
          'Total: ' + n.toLocaleString() + ' entries\n' +
          'Embeddings: binary-quantized (' + DIMS + 'd, ' + BYTES_PER_VEC + ' bytes each)\n' +
          'Vector Data: ' + (embeddings.length / 1048576).toFixed(1) + ' MB\n' +
          'Categories: ' + cats.length + ' - ' + topCats + '\n\n' +
          '**Quality Distribution:**\n' +
          '  Gold (>=80): ' + qd.gold.toLocaleString() + ' (' + (qd.gold / n * 100).toFixed(1) + '%)\n' +
          '  Silver (>=60): ' + qd.silver.toLocaleString() + ' (' + (qd.silver / n * 100).toFixed(1) + '%)\n' +
          '  Bronze (>=40): ' + qd.bronze.toLocaleString() + ' (' + (qd.bronze / n * 100).toFixed(1) + '%)\n' +
          '  Below (<40): ' + qd.below.toLocaleString() + ' (' + (qd.below / n * 100).toFixed(1) + '%)\n\n' +
          '**Knowledge Types:** ' + typeStr + '\n\n' +
          'Hash: ' + metadata.contentHash + '\n' +
          'Exported: ' + metadata.exportedAt + '\n' +
          'Searches: ' + searchCount + ' (this session)'
        );
      }

      case 'kb_status': {
        const lines = [];
        lines.push(isLoaded
          ? 'KB: Loaded (' + entries.length.toLocaleString() + ' entries, ' + loadTimeMs + 'ms startup)'
          : 'KB: NOT LOADED');
        lines.push(embedPipeline ? 'ONNX: Ready (all-MiniLM-L6-v2, 384d)' : 'ONNX: NOT INITIALIZED');
        if (isLoaded) {
          const ok = embeddings.length === entries.length * BYTES_PER_VEC;
          lines.push('Vectors: ' + (embeddings.length / 1048576).toFixed(1) + 'MB binary, ' + (ok ? 'HEALTHY' : 'MISMATCH'));
        }
        lines.push('Package: v' + pkgVersion);
        lines.push('KB Data: ' + (metadata?.exportedAt || 'unknown') + ' (hash: ' + (metadata?.contentHash || '?') + ')');
        if (updateMessage) {
          lines.push('UPDATE: ' + updateMessage + ' - auto-updating in background');
        } else if (latestNpmVersion) {
          lines.push('npm: v' + latestNpmVersion + ' (up to date)');
        } else {
          lines.push('npm: update check pending');
        }
        lines.push('Searches: ' + searchCount + ' (this session)');
        lines.push('Mode: Embedded-only (no PostgreSQL)');
        lines.push('Search: Binary hamming distance (<10ms/query)');
        return txt('**KB Health** (v5.0.0)\n\n' + lines.join('\n'));
      }

      default:
        return { content: [{ type: 'text', text: 'Unknown tool: ' + name }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: 'text', text: 'Error in ' + name + ': ' + error.message }], isError: true };
  }
});

// ============================================================================
// Startup
// ============================================================================

async function main() {
  try {
    await loadKB();
  } catch (err) {
    log('FATAL: ' + err.message);
    process.exit(1);
  }

  try {
    await initEmbedding();
  } catch (err) {
    log('WARNING: Embedding failed - ' + err.message);
  }

  checkForUpdates().catch(() => {});

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('Ready - ' + entries.length.toLocaleString() + ' entries, v' + pkgVersion);
}

main().catch(err => {
  log('FATAL: ' + err.message);
  process.exit(1);
});
