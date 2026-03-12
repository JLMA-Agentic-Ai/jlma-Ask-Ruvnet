#!/usr/bin/env node

/**
 * ask-ruvnet-mcp — MCP server for Ask-RuvNet NotebookLM pipeline management
 *
 * Tools:
 *   nlm_refresh_sources  — Check GitHub repos for changes, refresh stale NotebookLM sources
 *   nlm_studio_create    — Create a NotebookLM studio (audio/video/infographic/slides)
 *   nlm_studio_status    — Check studio generation status
 *   nlm_studio_download  — Download completed studio artifacts
 *   nlm_pipeline_status  — Get pipeline health: last refresh, pending changes, auth status
 *   nlm_registry_list    — List all tracked source URLs and their sync status
 *
 * Config via env:
 *   NLM_NOTEBOOK_ID       — NotebookLM notebook ID
 *   NLM_BIN_PATH          — Path to nlm CLI binary (default: nlm)
 *   NLM_ASSETS_DIR        — Where to save downloaded artifacts
 *   NLM_REGISTRY_PATH     — Path to URL registry JSON
 *   NLM_STATE_PATH        — Path to state file (auto-managed)
 *   GITHUB_TOKEN          — Optional: for private repos
 *
 * Usage:
 *   npx ask-ruvnet-mcp
 *   claude mcp add ask-ruvnet -- npx ask-ruvnet-mcp
 */

import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_REQUEST_DELAY_MS = 500;

const TOOLS = [
  {
    name: 'nlm_refresh_sources',
    description: 'Check GitHub repos for new commits and refresh stale NotebookLM sources. Use --dry-run to preview without changes, --force to refresh all, or --source <id> for a single source.',
    inputSchema: {
      type: 'object',
      properties: {
        dry_run: { type: 'boolean', description: 'Preview changes without applying', default: false },
        force: { type: 'boolean', description: 'Refresh all sources regardless of changes', default: false },
        source_id: { type: 'string', description: 'Refresh a single source by ID' }
      }
    }
  },
  {
    name: 'nlm_studio_create',
    description: 'Create a NotebookLM studio artifact (audio overview, video explainer, infographic, or slide deck)',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['audio', 'video', 'infographic', 'slides'], description: 'Studio type to create' },
        focus: { type: 'string', description: 'Optional focus prompt for the studio content' }
      },
      required: ['type']
    }
  },
  {
    name: 'nlm_studio_status',
    description: 'Check the generation status of NotebookLM studios',
    inputSchema: {
      type: 'object',
      properties: {
        studio_id: { type: 'string', description: 'Specific studio ID to check (omit for all)' }
      }
    }
  },
  {
    name: 'nlm_studio_download',
    description: 'Download completed studio artifacts to the assets directory',
    inputSchema: {
      type: 'object',
      properties: {
        studio_id: { type: 'string', description: 'Studio ID to download' },
        type: { type: 'string', enum: ['audio', 'video', 'infographic', 'slides'], description: 'Artifact type' }
      },
      required: ['studio_id', 'type']
    }
  },
  {
    name: 'nlm_pipeline_status',
    description: 'Get overall pipeline health: last refresh time, pending changes, auth status, studio counts',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nlm_registry_list',
    description: 'List all tracked source URLs with their sync status (last SHA, last refresh, enabled/disabled)',
    inputSchema: { type: 'object', properties: {} }
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Resolve a GitHub token from env or gh CLI.
 * Cached after first call.
 */
let _cachedGhToken = undefined;
async function getGitHubToken() {
  if (_cachedGhToken !== undefined) return _cachedGhToken;
  _cachedGhToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  if (!_cachedGhToken) {
    try {
      const { stdout } = await execFileAsync('/opt/homebrew/bin/gh', ['auth', 'token'], {
        timeout: 5000,
      });
      _cachedGhToken = stdout.trim();
    } catch {
      _cachedGhToken = '';
    }
  }
  return _cachedGhToken;
}

/**
 * HTTP GET with GitHub headers. Uses global fetch (Node 18+).
 */
async function githubGet(url) {
  const token = await getGitHubToken();
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ask-ruvnet-mcp/1.0',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

/**
 * Execute nlm CLI, returning stdout. Throws on AUTH_EXPIRED.
 */
async function nlmExec(nlmBin, argsArray, timeout = 60000) {
  try {
    const { stdout } = await execFileAsync(nlmBin, argsArray, {
      encoding: 'utf8',
      timeout,
    });
    return stdout.trim();
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    if (stderr.includes('401') || stderr.includes('auth') || stderr.includes('login')) {
      throw new Error('AUTH_EXPIRED');
    }
    throw err;
  }
}

/**
 * Execute nlm CLI and parse JSON output. Falls back to raw string.
 */
async function nlmExecJson(nlmBin, argsArray, timeout = 60000) {
  const raw = await nlmExec(nlmBin, argsArray, timeout);
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Extract a UUID from a string (nlm CLI output).
 */
function extractUuid(str) {
  if (!str) return null;
  const match = str.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// MCP protocol handler
// ---------------------------------------------------------------------------

class NlmPipelineMcpServer {
  constructor() {
    this.notebookId = process.env.NLM_NOTEBOOK_ID || '';
    this.nlmBin = process.env.NLM_BIN_PATH || 'nlm';
    this.assetsDir = process.env.NLM_ASSETS_DIR || './assets';
    this.registryPath = process.env.NLM_REGISTRY_PATH || './nlm-url-registry.json';
    this.statePath = process.env.NLM_STATE_PATH || './.nlm-refresh-state.json';
  }

  // -------------------------------------------------------------------------
  // File I/O helpers
  // -------------------------------------------------------------------------

  loadRegistry() {
    if (!fs.existsSync(this.registryPath)) {
      throw new Error(`Registry not found: ${this.registryPath}`);
    }
    const registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
    // Use registry nlmBin/notebookId as defaults when env vars are not set
    if (!this.notebookId && registry.notebookId) this.notebookId = registry.notebookId;
    if (this.nlmBin === 'nlm' && registry.nlmBin) this.nlmBin = registry.nlmBin;
    return registry;
  }

  loadState() {
    try {
      if (fs.existsSync(this.statePath)) {
        return JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
      }
    } catch (err) {
      process.stderr.write(`[nlm-mcp] Warning: could not read state: ${err.message}\n`);
    }
    return { sources: {}, lastRun: null, runCount: 0 };
  }

  saveState(state) {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.statePath, JSON.stringify(state, null, 2), 'utf8');
  }

  // -------------------------------------------------------------------------
  // GitHub change detection
  // -------------------------------------------------------------------------

  async checkGitHubRepo(owner, repo, lastSha) {
    try {
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=1`;
      const commits = await githubGet(url);
      if (!Array.isArray(commits) || commits.length === 0) {
        return { changed: false, currentSha: lastSha };
      }
      const currentSha = commits[0].sha;
      return { changed: !lastSha || lastSha !== currentSha, currentSha };
    } catch (err) {
      return { changed: false, currentSha: lastSha, error: err.message };
    }
  }

  async checkGitHubGist(gistId, lastUpdatedAt) {
    try {
      const url = `${GITHUB_API_BASE}/gists/${gistId}`;
      const gist = await githubGet(url);
      const currentUpdatedAt = gist.updated_at || null;
      return { changed: !lastUpdatedAt || lastUpdatedAt !== currentUpdatedAt, currentUpdatedAt };
    } catch (err) {
      return { changed: false, currentUpdatedAt: lastUpdatedAt, error: err.message };
    }
  }

  // -------------------------------------------------------------------------
  // NLM source operations
  // -------------------------------------------------------------------------

  async deleteNlmSource(sourceId) {
    try {
      await nlmExec(this.nlmBin, ['source', 'delete', sourceId, '--confirm'], 30000);
      return true;
    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') throw err;
      // 404 = already gone, treat as success
      return true;
    }
  }

  async addNlmSource(url) {
    try {
      const result = await nlmExecJson(
        this.nlmBin,
        ['source', 'add', this.notebookId, '--type', 'url', '--url', url],
        120000
      );
      if (typeof result === 'object' && result.id) return result.id;
      if (typeof result === 'string') return extractUuid(result);
      return null;
    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') throw err;
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Tool: refreshSources
  // -------------------------------------------------------------------------

  async refreshSources(args) {
    const dryRun = args.dry_run || false;
    const force = args.force || false;
    const sourceFilter = args.source_id || null;

    const registry = this.loadRegistry();
    const state = this.loadState();
    const stats = { checked: 0, changed: 0, refreshed: 0, errors: 0, skipped: 0 };
    const details = [];

    // Filter sources
    let sources = registry.sources.filter(s => s.enabled !== false);
    if (sourceFilter) {
      sources = sources.filter(s =>
        s.nlmSourceId.includes(sourceFilter) ||
        (s.repo && s.repo.includes(sourceFilter)) ||
        (s.title && s.title.toLowerCase().includes(sourceFilter.toLowerCase()))
      );
    }

    for (const source of sources) {
      const sourceState = state.sources[source.nlmSourceId] || {};
      let changed = false;
      const newStateData = { ...sourceState };
      const detail = { id: source.nlmSourceId, title: source.title || source.url, action: 'skipped' };

      // Change detection by category
      if (source.category === 'github-repo' && source.owner && source.repo) {
        stats.checked++;
        const result = await this.checkGitHubRepo(source.owner, source.repo, sourceState.lastSha);
        changed = result.changed;
        newStateData.lastSha = result.currentSha;
        detail.currentSha = result.currentSha;
        if (result.error) detail.checkError = result.error;
        await delay(GITHUB_REQUEST_DELAY_MS);

      } else if (source.category === 'github-gist' && source.gistId) {
        stats.checked++;
        const result = await this.checkGitHubGist(source.gistId, sourceState.lastUpdatedAt);
        changed = result.changed;
        newStateData.lastUpdatedAt = result.currentUpdatedAt;
        detail.lastUpdatedAt = result.currentUpdatedAt;
        if (result.error) detail.checkError = result.error;
        await delay(GITHUB_REQUEST_DELAY_MS);

      } else if (source.refreshPolicy === 'weekly') {
        stats.checked++;
        const lastRefresh = sourceState.lastRefreshedAt ? new Date(sourceState.lastRefreshedAt) : null;
        const daysSince = lastRefresh
          ? (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24)
          : Infinity;
        changed = daysSince >= 7;
        detail.daysSinceRefresh = daysSince === Infinity ? null : Math.round(daysSince);

      } else if (source.refreshPolicy === 'manual') {
        stats.skipped++;
        detail.action = 'manual_skip';
        details.push(detail);
        continue;
      }

      // Force overrides change detection
      if (force && source.url) changed = true;

      if (!changed) {
        detail.action = 'up_to_date';
        details.push(detail);
        continue;
      }

      stats.changed++;

      // Dry run: report only
      if (dryRun) {
        detail.action = 'would_refresh';
        details.push(detail);
        continue;
      }

      if (!source.url) {
        stats.skipped++;
        detail.action = 'no_url';
        details.push(detail);
        continue;
      }

      // Perform refresh: delete then add
      try {
        const existingNlmId = sourceState.managedNlmId || source.nlmSourceId;
        if (existingNlmId) {
          await this.deleteNlmSource(existingNlmId);
          await delay(1000);
        }

        const newNlmId = await this.addNlmSource(source.url);

        if (newNlmId) {
          newStateData.managedNlmId = newNlmId;
          newStateData.lastRefreshedAt = new Date().toISOString();
          newStateData.consecutiveErrors = 0;
          stats.refreshed++;
          detail.action = 'refreshed';
          detail.newNlmId = newNlmId;
        } else {
          newStateData.managedNlmId = null;
          stats.errors++;
          detail.action = 'add_failed';
        }

        await delay(2000);
      } catch (err) {
        if (err.message === 'AUTH_EXPIRED') {
          // Save partial state before reporting auth failure
          state.sources[source.nlmSourceId] = newStateData;
          state.lastRun = new Date().toISOString();
          this.saveState(state);
          throw new Error('NLM authentication expired mid-refresh. Partial state saved. Run: nlm login');
        }

        stats.errors++;
        const consecutiveErrors = (sourceState.consecutiveErrors || 0) + 1;
        newStateData.consecutiveErrors = consecutiveErrors;
        detail.action = consecutiveErrors >= 3 ? 'skipped_errors' : 'error';
        detail.error = err.message?.slice(0, 200);
      }

      state.sources[source.nlmSourceId] = newStateData;
      details.push(detail);
    }

    // Save final state
    state.lastRun = new Date().toISOString();
    state.runCount = (state.runCount || 0) + 1;
    if (!dryRun) this.saveState(state);

    return {
      status: 'ok',
      mode: force ? 'force' : dryRun ? 'dry_run' : 'incremental',
      notebookId: this.notebookId,
      stats,
      sources: details,
    };
  }

  // -------------------------------------------------------------------------
  // Tool: studioCreate
  // -------------------------------------------------------------------------

  async studioCreate(args) {
    const registry = this.loadRegistry();
    const studioType = args.type;

    // Map tool-facing type names to nlm CLI types
    const typeMap = { audio: 'audio', video: 'video', infographic: 'infographic', slides: 'slide_deck' };
    const nlmType = typeMap[studioType] || studioType;

    const createArgs = ['studio', 'create', this.notebookId, '--type', nlmType, '--confirm'];

    if (args.focus) {
      createArgs.push('--instructions', args.focus);
    }

    const raw = await nlmExec(this.nlmBin, createArgs, 120000);

    // Extract studio/artifact ID from response
    let studioId = null;
    try {
      const parsed = JSON.parse(raw);
      studioId = parsed.id || parsed.artifact_id || parsed.studioId;
    } catch {
      studioId = extractUuid(raw);
    }

    return {
      status: 'ok',
      studioId,
      type: studioType,
      focus: args.focus || null,
      notebookId: this.notebookId,
      rawOutput: studioId ? undefined : raw.slice(0, 500),
    };
  }

  // -------------------------------------------------------------------------
  // Tool: studioStatus
  // -------------------------------------------------------------------------

  async studioStatus(args) {
    const studioId = args.studio_id || null;

    // If a specific studio ID is given, check that one directly
    if (studioId) {
      const raw = await nlmExec(this.nlmBin, ['studio', 'status', studioId], 30000);
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Parse status from plain text
        const status = raw.toLowerCase().includes('complete') ? 'completed'
          : raw.toLowerCase().includes('fail') ? 'failed'
          : raw.toLowerCase().includes('pending') ? 'pending'
          : 'unknown';
        parsed = { id: studioId, status, rawOutput: raw.slice(0, 500) };
      }
      return { status: 'ok', studios: [parsed] };
    }

    // No studio ID: get status for the notebook
    const raw = await nlmExec(this.nlmBin, ['studio', 'status', this.notebookId], 30000);
    let studios;
    try {
      const parsed = JSON.parse(raw);
      studios = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      studios = [{ rawOutput: raw.slice(0, 1000) }];
    }

    return { status: 'ok', studios };
  }

  // -------------------------------------------------------------------------
  // Tool: studioDownload
  // -------------------------------------------------------------------------

  async studioDownload(args) {
    const { studio_id: studioId, type: artifactType } = args;

    // Map type names for nlm download command
    const typeMap = { audio: 'audio', video: 'video', infographic: 'infographic', slides: 'slide-deck' };
    const dlType = typeMap[artifactType] || artifactType;

    // Ensure assets directory exists
    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
    }

    const outputPath = path.join(this.assetsDir, `${dlType}-${studioId.slice(0, 8)}`);

    const dlArgs = [
      'download', dlType, this.notebookId,
      '--id', studioId,
      '-o', outputPath,
      '--no-progress',
    ];

    await nlmExec(this.nlmBin, dlArgs, 300000);

    // Check if file was actually written
    // nlm may append an extension, so look for files starting with our prefix
    let finalPath = outputPath;
    if (!fs.existsSync(outputPath)) {
      // Check for file with extension
      const dir = path.dirname(outputPath);
      const base = path.basename(outputPath);
      const files = fs.readdirSync(dir).filter(f => f.startsWith(base));
      if (files.length > 0) {
        finalPath = path.join(dir, files[0]);
      } else {
        return { status: 'error', message: 'Download command succeeded but no output file found', outputPath };
      }
    }

    const stat = fs.statSync(finalPath);

    // Validate: reject HTML error pages
    if (stat.size < 100000) {
      const head = fs.readFileSync(finalPath, 'utf8').slice(0, 200);
      if (head.includes('<!DOCTYPE') || head.includes('<html')) {
        fs.unlinkSync(finalPath);
        return { status: 'error', message: 'Downloaded file was an HTML error page, not a valid artifact' };
      }
    }

    return {
      status: 'ok',
      studioId,
      type: artifactType,
      filePath: finalPath,
      sizeBytes: stat.size,
      sizeMB: (stat.size / (1024 * 1024)).toFixed(1),
    };
  }

  // -------------------------------------------------------------------------
  // Tool: pipelineStatus
  // -------------------------------------------------------------------------

  async pipelineStatus() {
    const registry = this.loadRegistry();
    const state = this.loadState();

    // Check auth by trying nlm notebook list
    let authOk = false;
    let notebookInfo = null;
    try {
      const raw = await nlmExecJson(this.nlmBin, ['notebook', 'list', '--json'], 15000);
      authOk = true;
      if (Array.isArray(raw)) {
        const target = raw.find(n => n.id === this.notebookId);
        if (target) {
          notebookInfo = { title: target.title, sourceCount: target.source_count };
        }
      }
    } catch (err) {
      authOk = err.message !== 'AUTH_EXPIRED' ? null : false;
    }

    // Count pending changes by checking source states
    let pendingChanges = 0;
    const sourceStates = state.sources || {};
    for (const source of registry.sources) {
      if (source.enabled === false) continue;
      const ss = sourceStates[source.nlmSourceId];
      if (!ss || !ss.lastRefreshedAt) {
        pendingChanges++;
      }
    }

    // Count sources by status
    const sourceCounts = { total: registry.sources.length, enabled: 0, refreshed: 0, errored: 0 };
    for (const source of registry.sources) {
      if (source.enabled !== false) sourceCounts.enabled++;
      const ss = sourceStates[source.nlmSourceId];
      if (ss?.lastRefreshedAt) sourceCounts.refreshed++;
      if (ss?.consecutiveErrors > 0) sourceCounts.errored++;
    }

    return {
      status: 'ok',
      notebookId: this.notebookId,
      lastRefresh: state.lastRun || null,
      runCount: state.runCount || 0,
      authOk,
      notebookInfo,
      pendingChanges,
      sourceCounts,
    };
  }

  // -------------------------------------------------------------------------
  // Tool: registryList
  // -------------------------------------------------------------------------

  async registryList() {
    const registry = this.loadRegistry();
    const state = this.loadState();
    const sourceStates = state.sources || {};

    const sources = registry.sources.map(source => {
      const ss = sourceStates[source.nlmSourceId] || {};
      return {
        id: source.nlmSourceId,
        title: source.title || null,
        url: source.url || null,
        category: source.category,
        enabled: source.enabled !== false,
        refreshPolicy: source.refreshPolicy || 'on-change',
        owner: source.owner || null,
        repo: source.repo || null,
        gistId: source.gistId || null,
        lastSha: ss.lastSha || null,
        lastUpdatedAt: ss.lastUpdatedAt || null,
        lastRefreshedAt: ss.lastRefreshedAt || null,
        managedNlmId: ss.managedNlmId || null,
        consecutiveErrors: ss.consecutiveErrors || 0,
      };
    });

    return {
      status: 'ok',
      notebookId: this.notebookId,
      totalSources: sources.length,
      enabledSources: sources.filter(s => s.enabled).length,
      lastRefresh: state.lastRun || null,
      sources,
    };
  }

  // -------------------------------------------------------------------------
  // MCP protocol
  // -------------------------------------------------------------------------

  async handleRequest(request) {
    const { method, id, params } = request;

    switch (method) {
      case 'initialize':
        return this.respond(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'ask-ruvnet-mcp', version: '0.1.0' }
        });

      case 'tools/list':
        return this.respond(id, { tools: TOOLS });

      case 'tools/call':
        return this.handleToolCall(id, params);

      default:
        return this.respond(id, null);
    }
  }

  async handleToolCall(id, params) {
    const { name, arguments: args = {} } = params;
    try {
      let result;
      switch (name) {
        case 'nlm_refresh_sources':
          result = await this.refreshSources(args);
          break;
        case 'nlm_studio_create':
          result = await this.studioCreate(args);
          break;
        case 'nlm_studio_status':
          result = await this.studioStatus(args);
          break;
        case 'nlm_studio_download':
          result = await this.studioDownload(args);
          break;
        case 'nlm_pipeline_status':
          result = await this.pipelineStatus();
          break;
        case 'nlm_registry_list':
          result = await this.registryList();
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }
      return this.respond(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
    } catch (err) {
      return this.respond(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
    }
  }

  respond(id, result) {
    return JSON.stringify({ jsonrpc: '2.0', id, result });
  }
}

// Stdio transport
async function main() {
  const server = new NlmPipelineMcpServer();
  const rl = createInterface({ input: process.stdin, terminal: false });

  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);
      const response = await server.handleRequest(request);
      if (response) {
        process.stdout.write(response + '\n');
      }
    } catch (err) {
      process.stderr.write(`Parse error: ${err.message}\n`);
    }
  });

  process.stderr.write('ask-ruvnet-mcp server started (stdio)\n');
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
