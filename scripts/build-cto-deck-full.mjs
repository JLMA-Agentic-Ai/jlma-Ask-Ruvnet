#!/usr/bin/env node
/**
 * build-cto-deck-full.mjs — 19-slide CTO deck for RuvNet
 *
 * Narrative arc:
 *   Act 1 (1-4):   INTRIGUE — hook with the problem, show the gap
 *   Act 2 (5-9):   CREDIBILITY — benchmarks, code, architecture
 *   Act 3 (10-16): DEPTH — each major module gets its own slide
 *   Act 4 (17-19): CLOSE — roadmap, integration, CTA
 *
 * Design rules:
 *   - 60%+ visual, 40% text per slide
 *   - Dark navy background (#0F1629)
 *   - Fonts: Arial Black / Arial / Consolas
 *   - PaperBanana images as dominant visuals where available
 */

import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE';
pptx.author = 'RuvNet';
pptx.company = 'RuvNet';
pptx.subject = 'CTO Technical Architecture Deep Dive';
pptx.title = 'RuvNet CTO Deck 2026';

// ── Color palette ──────────────────────────────────────────────
const C = {
  bg:         '0F1629',
  bgLight:    '1A2340',
  accent:     '06B6D4',   // cyan
  accent2:    'A855F7',   // purple
  accent3:    'FB923C',   // orange
  accentRed:  'EF4444',
  accentGreen:'10B981',
  text:       'FFFFFF',
  textMuted:  '94A3B8',
  textDim:    '64748B',
  card:       '1E293B',
  border:     '334155',
  codeBg:     '0D1117',
  codeHeader: '161B22',
};

const FONT = { title: 'Arial Black', body: 'Arial', mono: 'Consolas' };

// ── Image paths ────────────────────────────────────────────────
const IMG = {
  hero:       '/tmp/cto-img-hero.png',
  benchmarks: '/tmp/cto-img-benchmarks.png',
  security:   '/tmp/cto-img-security.png',
  swarm:      '/tmp/cto-img-swarm.png',
  hnsw:       '/tmp/cto-img-hnsw.png',
  rvf:        '/tmp/cto-img-rvf.png',
  sona:       '/tmp/cto-img-sona.png',
  pi:         '/tmp/cto-img-pi.png',
  problem:    '/tmp/cto-img-problem.png',
};

// Verify images exist
for (const [key, imgPath] of Object.entries(IMG)) {
  if (!fs.existsSync(imgPath)) {
    console.warn(`WARNING: Missing image ${key} at ${imgPath}`);
  }
}

// ── Helpers ────────────────────────────────────────────────────
function addSlide(opts = {}) {
  const slide = pptx.addSlide();
  slide.background = { color: opts.bg || C.bg };
  return slide;
}

function addStat(slide, x, y, value, label, color = C.accent) {
  slide.addText(value, {
    x, y, w: 2, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color, bold: true, align: 'center',
  });
  slide.addText(label, {
    x, y: y + 0.6, w: 2, h: 0.4,
    fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center',
  });
}

function addCard(slide, x, y, w, h, title, body, accent = C.accent) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, fill: { color: C.card }, rectRadius: 0.1,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x, y, w: 0.06, h, fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.2, y: y + 0.1, w: w - 0.3, h: 0.35,
    fontSize: 14, fontFace: FONT.body, color: accent, bold: true,
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.45, w: w - 0.3, h: h - 0.55,
    fontSize: 11, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.3,
  });
}

function addFooter(slide) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 7.15, w: 13.333, h: 0.35, fill: { color: C.bgLight },
  });
  slide.addText('ruvnet.com  |  github.com/ruvnet  |  MIT License', {
    x: 0.5, y: 7.15, w: 12, h: 0.35,
    fontSize: 9, fontFace: FONT.body, color: C.textDim,
  });
}

function addSlideNumber(slide, num) {
  slide.addText(String(num), {
    x: 12.6, y: 7.15, w: 0.5, h: 0.35,
    fontSize: 9, fontFace: FONT.body, color: C.textDim, align: 'right',
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1: Title — hero image background + 6 stat callouts
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();

  // Hero image as background overlay (full slide, dimmed)
  s.addImage({
    path: IMG.hero, x: 0, y: 0, w: 13.333, h: 7.5,
    transparency: 60,
  });

  // Dark overlay for text legibility
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 7, h: 7.5,
    fill: { color: C.bg, transparency: 20 },
  });

  // Title block
  s.addText('RUVNET', {
    x: 0.8, y: 1.0, w: 6, h: 1.0,
    fontSize: 56, fontFace: FONT.title, color: C.text, bold: true,
  });
  s.addText('Technical Architecture Deep Dive', {
    x: 0.8, y: 2.1, w: 6, h: 0.5,
    fontSize: 22, fontFace: FONT.body, color: C.accent,
  });
  s.addText('14 production modules. 265,000 lines of code.\nThe complete agentic intelligence platform.', {
    x: 0.8, y: 2.8, w: 5.5, h: 0.8,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.5,
  });

  // 6 stat callouts (right column, 2x3 grid)
  addStat(s, 7.5,  1.2, '80+',  'Rust Crates',          C.accent);
  addStat(s, 9.7,  1.2, '290+', 'SQL Functions',         C.accent2);
  addStat(s, 11.5, 1.2, '39',   'Attention\nMechanisms', C.accent3);
  addStat(s, 7.5,  3.0, '265K', 'Lines of Code',         C.accentGreen);
  addStat(s, 9.7,  3.0, '14',   'Modules',               C.accent);
  addStat(s, 11.5, 3.0, '96',   'MCP Tools',             C.accent2);

  // Bottom tagline
  s.addText('March 2026  |  v3.5', {
    x: 0.8, y: 6.5, w: 5, h: 0.3,
    fontSize: 12, fontFace: FONT.body, color: C.textDim,
  });
  addFooter(s);
  addSlideNumber(s, 1);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2: The Problem — 87% failure rate
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();

  // Problem image (right 60%)
  s.addImage({
    path: IMG.problem, x: 5.5, y: 0.3, w: 7.5, h: 6.8,
  });

  // Left text column (40%)
  s.addText('The Problem', {
    x: 0.6, y: 0.4, w: 5, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });

  s.addText('87%', {
    x: 0.6, y: 1.3, w: 3, h: 1.0,
    fontSize: 72, fontFace: FONT.title, color: C.accentRed, bold: true,
  });
  s.addText('of enterprise AI projects\nnever reach production', {
    x: 0.6, y: 2.3, w: 5, h: 0.6,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.4,
  });

  // Pain points
  const pains = [
    { icon: '1', text: 'No persistent memory across sessions', color: C.accentRed },
    { icon: '2', text: 'Security bolted on, not built in', color: C.accentRed },
    { icon: '3', text: 'Agents that can\'t learn from mistakes', color: C.accentRed },
    { icon: '4', text: 'Vector DBs that don\'t scale with SQL', color: C.accentRed },
    { icon: '5', text: '$30M/month GPU costs for brute force', color: C.accentRed },
  ];

  pains.forEach((p, i) => {
    const y = 3.3 + i * 0.6;
    s.addShape(pptx.shapes.OVAL, {
      x: 0.6, y: y + 0.05, w: 0.35, h: 0.35,
      fill: { color: C.accentRed },
    });
    s.addText(p.icon, {
      x: 0.6, y: y + 0.05, w: 0.35, h: 0.35,
      fontSize: 11, fontFace: FONT.title, color: C.text, align: 'center', valign: 'middle',
    });
    s.addText(p.text, {
      x: 1.1, y, w: 4.2, h: 0.45,
      fontSize: 13, fontFace: FONT.body, color: C.textMuted, valign: 'middle',
    });
  });

  s.addText('Source: Gartner, 2025 — "Through 2025, 87% of AI projects will not progress beyond the pilot stage."', {
    x: 0.6, y: 6.5, w: 5, h: 0.4,
    fontSize: 9, fontFace: FONT.body, color: C.textDim, italic: true,
  });

  addFooter(s);
  addSlideNumber(s, 2);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 3: What Providers Ship — comparison table
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('What Providers Actually Ship', {
    x: 0.8, y: 0.4, w: 8, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });
  s.addText('They ship the inference endpoint. You build the other 11 layers.', {
    x: 0.8, y: 1.0, w: 8, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted,
  });

  const capabilities = [
    ['LLM API Endpoint',          true,  true,  true,  true,  true],
    ['Multi-Agent Swarms (150+)', false, false, false, false, true],
    ['Persistent Memory (ACID)',  false, false, false, false, true],
    ['Vector Search (<100us)',    false, false, false, false, true],
    ['Security Middleware',       false, false, false, false, true],
    ['Offline / Air-Gapped',     false, false, false, false, true],
    ['Self-Learning (<1ms)',      false, false, false, false, true],
    ['WASM Runtime (5.5KB)',      false, false, false, false, true],
    ['Graph Analytics (GNN)',     false, false, false, false, true],
    ['MCP Protocol (96 tools)',   false, false, false, false, true],
  ];
  const providers = ['OpenAI', 'Anthropic', 'Google', 'AWS', 'RuvNet'];

  const startX = 4.8;
  const colW = 1.6;

  // Column headers
  providers.forEach((p, i) => {
    const isRuv = i === 4;
    s.addText(p, {
      x: startX + i * colW, y: 1.55, w: colW, h: 0.45,
      fontSize: 12, fontFace: FONT.body, color: isRuv ? C.accent : C.textMuted,
      bold: true, align: 'center', valign: 'middle',
    });
  });

  // Header underline
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 2.0, w: 12.3, h: 0.02, fill: { color: C.border },
  });

  // Table rows
  capabilities.forEach(([cap, ...vals], row) => {
    const y = 2.1 + row * 0.48;
    if (row % 2 === 0) {
      s.addShape(pptx.shapes.RECTANGLE, {
        x: 0.5, y, w: 12.3, h: 0.48, fill: { color: C.bgLight },
      });
    }
    s.addText(cap, {
      x: 0.8, y, w: 3.8, h: 0.48,
      fontSize: 12, fontFace: FONT.body, color: C.text, valign: 'middle',
    });
    vals.forEach((val, i) => {
      const isRuv = i === 4;
      const symbol = val ? (isRuv ? '\u2713' : '\u2713') : '\u2014';
      const color = val ? (isRuv ? C.accentGreen : C.textDim) : C.textDim;
      const fsize = val ? 18 : 14;
      s.addText(symbol, {
        x: startX + i * colW, y, w: colW, h: 0.48,
        fontSize: fsize, fontFace: FONT.body, color, align: 'center', valign: 'middle',
        bold: isRuv && val,
      });
    });
  });

  addFooter(s);
  addSlideNumber(s, 3);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 4: Algorithms Beat GPUs — cost comparison
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Algorithms Beat GPUs', {
    x: 0.8, y: 0.4, w: 8, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });
  s.addText('The industry throws hardware at problems. We throw mathematics.', {
    x: 0.8, y: 1.0, w: 8, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted,
  });

  // Cost comparison bar chart
  s.addChart(pptx.charts.BAR, [
    { name: 'GPU Brute Force', labels: ['Monthly Cost'], values: [30] },
    { name: 'RuvNet Algorithmic', labels: ['Monthly Cost'], values: [1.7] },
  ], {
    x: 0.5, y: 1.6, w: 6, h: 4.5,
    showTitle: false,
    showValue: true,
    valueFontSize: 14,
    valueFontColor: C.text,
    catAxisHidden: true,
    valAxisLabelColor: C.textMuted,
    valAxisTitle: '$ Millions / Month',
    valAxisTitleColor: C.textMuted,
    chartColors: [C.accentRed, C.accentGreen],
    plotArea: { fill: { color: C.bgLight } },
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: '$#,##0.0"M"',
    barGapWidthPct: 100,
  });

  // Right side cards
  addCard(s, 7, 1.6, 5.8, 2.0,
    'GPU Brute Force',
    '\u2022 $100M+/year GPU clusters\n\u2022 $30M/month operational\n\u2022 Linear scaling with data\n\u2022 Vendor lock-in to NVIDIA',
    C.accentRed);
  addCard(s, 7, 3.8, 5.8, 2.0,
    'Algorithmic Efficiency',
    '\u2022 MinCut-Gated: 50-90% compute skip\n\u2022 Coherence Transformer optimization\n\u2022 Runs on commodity hardware\n\u2022 Sub-linear scaling with HNSW',
    C.accentGreen);

  // Big callout
  s.addText('94%', {
    x: 7, y: 6.0, w: 2.5, h: 0.8,
    fontSize: 52, fontFace: FONT.title, color: C.accentGreen, bold: true,
  });
  s.addText('cost reduction\n$30M -> $1.7M/month', {
    x: 9.5, y: 6.0, w: 3.5, h: 0.8,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.3,
  });

  addFooter(s);
  addSlideNumber(s, 4);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 5: Performance Benchmarks — full-width image
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Performance Benchmarks', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 28, fontFace: FONT.title, color: C.text,
  });
  s.addText('Measured results against best-in-class competitors', {
    x: 0.8, y: 0.7, w: 8, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Benchmarks image — dominant visual (full width)
  s.addImage({
    path: IMG.benchmarks, x: 0.3, y: 1.1, w: 12.7, h: 5.3,
  });

  // Bottom stat bar
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 6.5, w: 13.333, h: 0.6, fill: { color: C.bgLight },
  });
  const bStats = [
    { val: '8,000x', lbl: 'Vector Search', clr: C.accent },
    { val: '4,000x', lbl: 'Stream Processing', clr: C.accent2 },
    { val: '167x', lbl: 'Threat Detection', clr: C.accent3 },
    { val: '18,000x', lbl: 'Smaller Runtime', clr: C.accentGreen },
  ];
  bStats.forEach((st, i) => {
    const x = 0.5 + i * 3.2;
    s.addText(st.val, {
      x, y: 6.5, w: 1.5, h: 0.6,
      fontSize: 18, fontFace: FONT.title, color: st.clr, bold: true, valign: 'middle',
    });
    s.addText(st.lbl, {
      x: x + 1.5, y: 6.5, w: 1.5, h: 0.6,
      fontSize: 10, fontFace: FONT.body, color: C.textMuted, valign: 'middle',
    });
  });

  addFooter(s);
  addSlideNumber(s, 5);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 6: System Architecture — hero image full-width
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('System Architecture', {
    x: 0.8, y: 0.2, w: 6, h: 0.5,
    fontSize: 28, fontFace: FONT.title, color: C.text,
  });
  s.addText('14 modules. Unified data plane. Security envelope.', {
    x: 0.8, y: 0.7, w: 8, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Hero architecture image
  s.addImage({
    path: IMG.hero, x: 0.3, y: 1.1, w: 12.7, h: 6.0,
  });

  addFooter(s);
  addSlideNumber(s, 6);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7: Ship It In 5 Lines
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Ship It In 5 Lines', {
    x: 0.8, y: 0.3, w: 8, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });
  s.addText('Production multi-agent swarms. Self-learning. Self-healing.', {
    x: 0.8, y: 0.9, w: 8, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted,
  });

  const code = `const ruflo = require('ruflo');

// Initialize a self-healing agent swarm
const swarm = await ruflo.swarm.init({
  topology: 'hierarchical',
  agents: 8,
  strategy: 'specialized'
});

// Deploy 51 autonomous agents
const fleet = await swarm.deploy({
  domains: ['billing', 'compliance', 'support'],
  memory: 'persistent',   // Agents remember everything
  security: 'aimds',      // Chaos theory protection
  runtime: 'rvf-wasm'     // 5.5KB - runs anywhere
});`;

  // Terminal window
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.4, y: 1.5, w: 7.8, h: 5.5,
    fill: { color: C.codeBg }, rectRadius: 0.15, line: { color: C.border, width: 1 },
  });
  // Terminal title bar
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.4, y: 1.5, w: 7.8, h: 0.4, fill: { color: C.codeHeader },
  });
  // Traffic light dots
  s.addShape(pptx.shapes.OVAL, { x: 0.7, y: 1.62, w: 0.15, h: 0.15, fill: { color: 'FF5F57' } });
  s.addShape(pptx.shapes.OVAL, { x: 0.95, y: 1.62, w: 0.15, h: 0.15, fill: { color: 'FEBC2E' } });
  s.addShape(pptx.shapes.OVAL, { x: 1.2, y: 1.62, w: 0.15, h: 0.15, fill: { color: '28C840' } });

  s.addText(code, {
    x: 0.7, y: 2.0, w: 7.2, h: 4.8,
    fontSize: 11, fontFace: FONT.mono, color: C.accent, lineSpacingMultiple: 1.35, valign: 'top',
  });

  // Right side: 3 explanation cards
  addCard(s, 8.6, 1.5, 4.3, 1.5,
    'One Command, Full Team',
    '8 specialized agents spawn instantly:\ncoordinator, coder, tester, reviewer,\ndeployer, researcher, security, architect',
    C.accent2);
  addCard(s, 8.6, 3.2, 4.3, 1.5,
    'Persistent Memory',
    'AgentDB stores every decision.\n9 RL algorithms learn from outcomes.\nAgents get smarter every session.',
    C.accentGreen);
  addCard(s, 8.6, 4.9, 4.3, 1.5,
    'Self-Healing Security',
    'AIMDS scans every input/output.\nLyapunov chaos detection for zero-days.\n782KB, >12K requests/sec.',
    C.accentRed);

  s.addText('Claude Code shipped sub-agents March 2026. Ruflo shipped this August 2025 \u2014 8 months earlier.', {
    x: 0.5, y: 6.8, w: 12, h: 0.3,
    fontSize: 10, fontFace: FONT.body, color: C.textDim, italic: true,
  });

  addFooter(s);
  addSlideNumber(s, 7);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 8: Ruflo Swarm — swarm image + callouts
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Ruflo: Multi-Agent Swarm Intelligence', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('150+ agents. 5 topologies. Byzantine fault tolerance.', {
    x: 0.8, y: 0.7, w: 8, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Swarm image (left 70%)
  s.addImage({
    path: IMG.swarm, x: 0.3, y: 1.1, w: 8.5, h: 5.8,
  });

  // Right callouts
  addStat(s, 9.2, 1.2, '150+', 'Agents', C.accent);
  addStat(s, 11.2, 1.2, '5', 'Topologies', C.accent2);

  addCard(s, 9, 2.6, 4, 1.2,
    'Hierarchical Coordinator',
    'Queen-led swarms with worker agents.\nAnti-drift control. Raft consensus.',
    C.accent2);
  addCard(s, 9, 4.0, 4, 1.2,
    'Self-Healing Mesh',
    'Peer-to-peer failover. No single\npoint of failure. Gossip protocol.',
    C.accentGreen);
  addCard(s, 9, 5.4, 4, 1.2,
    'Byzantine Fault Tolerance',
    'Tolerates f < n/3 faulty agents.\nCRDT synchronization. Quorum-based.',
    C.accent3);

  addFooter(s);
  addSlideNumber(s, 8);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 9: RuVector — HNSW image + stats
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('RuVector: PostgreSQL-Native Vector Search', {
    x: 0.8, y: 0.2, w: 10, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('Not a separate database. A PostgreSQL extension with ACID transactions on vectors.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // HNSW image (left 65%)
  s.addImage({
    path: IMG.hnsw, x: 0.3, y: 1.1, w: 8, h: 5.8,
  });

  // Right stats and cards
  addStat(s, 8.5, 1.2, '61\u00B5s', 'Search Latency', C.accent);
  addStat(s, 10.5, 1.2, '290+', 'SQL Functions', C.accent2);

  addCard(s, 8.5, 2.6, 4.5, 1.3,
    'HNSW Progressive Indexing',
    'L0/L1/L2 tier-based. 8,000x faster than\nPinecone. Drop-in pgvector replacement.',
    C.accent);
  addCard(s, 8.5, 4.1, 4.5, 1.3,
    'ACID Transactions',
    'Vectors + relational data in one query.\nJoins, constraints, triggers \u2014 native SQL.',
    C.accentGreen);
  addCard(s, 8.5, 5.6, 4.5, 1.3,
    'RVCOW Multi-Tenant',
    '512MB parent + 1,000 tenants = 2.5MB each.\nCOW branch creation: 2.6ms. 200x savings.',
    C.accent3);

  addFooter(s);
  addSlideNumber(s, 9);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 10: RVF Format — image + 24 segments
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('RVF: Cognitive Container Format', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('24 segments. 3-tier compute. Self-booting AI-native binary.', {
    x: 0.8, y: 0.7, w: 8, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // RVF image (left 65%)
  s.addImage({
    path: IMG.rvf, x: 0.3, y: 1.1, w: 8, h: 5.8,
  });

  // Right side
  addStat(s, 8.5, 1.2, '24', 'Segments', C.accent);
  addStat(s, 10.7, 1.2, '5.5KB', 'WASM Size', C.accentGreen);

  addCard(s, 8.5, 2.6, 4.5, 1.1,
    'WASM Tier',
    '5.5KB runtime. Runs in any browser.\nZero backend required. Air-gapped capable.',
    C.accent);
  addCard(s, 8.5, 3.9, 4.5, 1.1,
    'eBPF Tier',
    'Kernel bypass for sub-microsecond\nlatency. Tracing. Network filtering.',
    C.accent2);
  addCard(s, 8.5, 5.2, 4.5, 1.1,
    'Unikernel Tier',
    '125ms cold start. Single-purpose OS.\n18,000x smaller than containers.',
    C.accent3);

  addFooter(s);
  addSlideNumber(s, 10);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 11: AIMDS Security — security image + pipeline
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('AIMDS: Security via Chaos Theory', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('3-layer pipeline. Lyapunov chaos detection. Mathematical certainty.', {
    x: 0.8, y: 0.7, w: 8, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Security image (left 65%)
  s.addImage({
    path: IMG.security, x: 0.3, y: 1.1, w: 8, h: 5.8,
  });

  // Right stats and cards
  addStat(s, 8.5, 1.2, '0.06ms', 'Detection', C.accentRed);
  addStat(s, 10.8, 1.2, '>12K/s', 'Throughput', C.accentGreen);

  addCard(s, 8.5, 2.6, 4.5, 1.1,
    'Layer 1: Detect (0.06ms)',
    '50+ patterns. Aho-Corasick matching.\nReal-time stream processing.',
    C.accent);
  addCard(s, 8.5, 3.9, 4.5, 1.1,
    'Layer 2: Analyze (80ms)',
    'Lyapunov chaos detection. LTL policy\nverification. Behavioral divergence.',
    C.accent2);
  addCard(s, 8.5, 5.2, 4.5, 1.1,
    'Layer 3: Respond (<50ms)',
    '7 adaptive strategies. 25-level\nstrange-loop. Real-time mitigation.',
    C.accentRed);

  addFooter(s);
  addSlideNumber(s, 11);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 12: SONA Learning — sona image + two-tier LoRA
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('SONA: Self-Optimizing Neural Architecture', {
    x: 0.8, y: 0.2, w: 10, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('Every decision makes the system smarter. Automatically. <1ms. $0.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // SONA image (left 65%)
  s.addImage({
    path: IMG.sona, x: 0.3, y: 1.1, w: 8, h: 5.8,
  });

  // Right stats and cards
  addStat(s, 8.5, 1.2, '<1ms', 'Learning', C.accent2);
  addStat(s, 10.8, 1.2, '$0', 'Cost', C.accentGreen);

  addCard(s, 8.5, 2.6, 4.5, 1.1,
    'MicroLoRA (rank-2, ~45\u00B5s)',
    'Instant reactions. Real-time adaptation.\nBehavioral micro-adjustments.',
    C.accent);
  addCard(s, 8.5, 3.9, 4.5, 1.1,
    'BaseLoRA (rank-16, ~500\u00B5s)',
    'Deep learning consolidation. EWC++\nprevents catastrophic forgetting.',
    C.accent2);
  addCard(s, 8.5, 5.2, 4.5, 1.1,
    'ReasoningBank',
    'HNSW-indexed decision history.\n300x faster retrieval. +55% quality.',
    C.accentGreen);

  addFooter(s);
  addSlideNumber(s, 12);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 13: Pi Brain — decentralized collective intelligence
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Pi Brain: Collective Intelligence', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('Decentralized knowledge network. 1,400+ memories. Verifiable consensus.', {
    x: 0.8, y: 0.7, w: 8, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Pi Brain image (left 65%)
  s.addImage({
    path: IMG.pi, x: 0.3, y: 1.1, w: 8, h: 5.8,
  });

  // Right stats and cards
  addStat(s, 8.5, 1.2, '1,400+', 'Memories', C.accent2);
  addStat(s, 10.8, 1.2, 'P2P', 'Network', C.accent);

  addCard(s, 8.5, 2.6, 4.5, 1.1,
    'Verifiable Knowledge',
    'Evidence-based pages. Community voting.\nConfidence scoring. Drift detection.',
    C.accent);
  addCard(s, 8.5, 3.9, 4.5, 1.1,
    'WASM Execution',
    'Run computation at the edge.\nBrain nodes execute verified code.',
    C.accent2);
  addCard(s, 8.5, 5.2, 4.5, 1.1,
    'Cross-Agent Sharing',
    'Brain sync across agent swarms.\nPartitioned knowledge domains.',
    C.accentGreen);

  addFooter(s);
  addSlideNumber(s, 13);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 14: Nervous System — 5-layer bio-inspired (shapes)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Nervous System: 5-Layer Bio-Inspired Architecture', {
    x: 0.8, y: 0.2, w: 10, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('From <100ns sensing to system-wide coherence. Inspired by biological neural pathways.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  const layers = [
    { name: 'SENSING',    time: '<100ns', desc: 'Input capture. Event detection.\nPattern recognition at wire speed.', color: C.accent,      icon: '\u26A1' },
    { name: 'REFLEX',     time: '<1\u00B5s',  desc: 'Automatic reactions. Circuit breakers.\nRate limiting. No deliberation.', color: C.accent3,     icon: '\u21AF' },
    { name: 'MEMORY',     time: '<10\u00B5s', desc: 'HNSW retrieval. Context assembly.\n4 memory types: working/episodic/\nsemantic/procedural.', color: C.accent2,     icon: '\u25CB' },
    { name: 'LEARNING',   time: '<1ms',  desc: 'SONA adaptation. MicroLoRA updates.\nReasoningBank query + store.', color: C.accentGreen, icon: '\u25B2' },
    { name: 'COHERENCE',  time: '<10ms', desc: 'System-wide consistency. Consensus.\nState reconciliation across agents.', color: C.accentRed,  icon: '\u221E' },
  ];

  // Draw each layer as a horizontal band with increasing width (pyramid)
  layers.forEach((l, i) => {
    const y = 1.2 + i * 1.15;
    const indent = (4 - i) * 0.4;
    const w = 12.3 - indent * 2;
    const x = 0.5 + indent;

    // Layer band
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: 1.0,
      fill: { color: C.card }, rectRadius: 0.08,
      line: { color: l.color, width: 2 },
    });

    // Layer number/icon
    s.addText(l.icon, {
      x: x + 0.1, y, w: 0.5, h: 1.0,
      fontSize: 22, fontFace: FONT.body, color: l.color, align: 'center', valign: 'middle',
    });

    // Layer name
    s.addText(l.name, {
      x: x + 0.6, y, w: 2.0, h: 1.0,
      fontSize: 18, fontFace: FONT.title, color: l.color, valign: 'middle', bold: true,
    });

    // Timing badge
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 2.6, y: y + 0.25, w: 1.2, h: 0.5,
      fill: { color: l.color }, rectRadius: 0.05,
    });
    s.addText(l.time, {
      x: x + 2.6, y: y + 0.25, w: 1.2, h: 0.5,
      fontSize: 12, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle', bold: true,
    });

    // Description
    s.addText(l.desc, {
      x: x + 4.0, y, w: w - 4.3, h: 1.0,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, valign: 'middle', lineSpacingMultiple: 1.2,
    });
  });

  // Connecting arrows between layers
  for (let i = 0; i < 4; i++) {
    const y = 1.2 + i * 1.15 + 1.0;
    s.addText('\u25BC', {
      x: 6.2, y: y - 0.08, w: 0.8, h: 0.2,
      fontSize: 12, color: C.textDim, align: 'center',
    });
  }

  addFooter(s);
  addSlideNumber(s, 14);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 15: 39 Attention Mechanisms — grid layout (shapes)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('39 Attention Mechanisms', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('The most comprehensive attention library in open source. Every variant, optimized for production.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  const mechanisms = [
    // Row 1: Core
    'Multi-Head',      'Flash v2',        'Sliding Window',  'Cross',           'Sparse',          'Linear',
    // Row 2: Efficient
    'Grouped Query',   'Multi-Query',     'Ring',            'PagedKV',         'Local',           'Global',
    // Row 3: Advanced
    'Differential',    'Mixture-of-Depths','Flex Attention',  'Rotary',          'ALiBi',           'Polynomial',
    // Row 4: Specialized
    'Graph',           'Hyperbolic',      'State-Space',     'Mamba',           'Hyena',           'RWKV',
    // Row 5: Experimental
    'Softmax-Free',    'Cosine',          'Sigmoid',         'Gated',           'Additive',        'Multiplicative',
    // Row 6: Novel
    'Quantum-Inspired','Fractal',         'Spiking Neural',  'Neuromorphic',    'Topological',     'Geometric',
    // Row 7: Remaining
    'Hopfield',        'Performer',       'Longformer',
  ];

  const cols = 6;
  const cellW = 2.0;
  const cellH = 0.65;
  const startX = 0.5;
  const startY = 1.15;
  const colors = [C.accent, C.accent2, C.accent3, C.accentGreen, C.accentRed, C.accent];

  mechanisms.forEach((mech, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x = startX + col * (cellW + 0.12);
    const y = startY + row * (cellH + 0.1);
    const colorIdx = row % colors.length;

    // Cell background
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: cellW, h: cellH,
      fill: { color: C.card }, rectRadius: 0.06,
      line: { color: colors[colorIdx], width: 1 },
    });

    // Number badge
    s.addShape(pptx.shapes.OVAL, {
      x: x + 0.08, y: y + 0.15, w: 0.3, h: 0.3,
      fill: { color: colors[colorIdx] },
    });
    s.addText(String(idx + 1), {
      x: x + 0.08, y: y + 0.15, w: 0.3, h: 0.3,
      fontSize: 8, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle',
    });

    // Mechanism name
    s.addText(mech, {
      x: x + 0.42, y, w: cellW - 0.5, h: cellH,
      fontSize: 9, fontFace: FONT.body, color: C.text, valign: 'middle',
    });
  });

  // Bottom callout
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 6.6, w: 12.3, h: 0.45,
    fill: { color: C.bgLight }, rectRadius: 0.05,
  });
  s.addText('Flash Attention alone delivers 2.49x-7.47x speedup. Combined with HNSW, this powers 8,000x vector search advantage.', {
    x: 0.8, y: 6.6, w: 12, h: 0.45,
    fontSize: 11, fontFace: FONT.body, color: C.accent, valign: 'middle',
  });

  addFooter(s);
  addSlideNumber(s, 15);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 16: Prime Radiant — Formal Verification (shapes)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Prime Radiant: Formal Verification Engine', {
    x: 0.8, y: 0.2, w: 10, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('Three verification engines. Mathematical proof that your AI behaves correctly.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Three engine columns
  const engines = [
    {
      name: 'LTL Model Checker',
      subtitle: 'Linear Temporal Logic',
      features: [
        'Globally / Finally / Until operators',
        'Safety: "bad things never happen"',
        'Liveness: "good things eventually happen"',
        'State-space exploration',
      ],
      color: C.accent,
    },
    {
      name: 'CTL* Verifier',
      subtitle: 'Computation Tree Logic',
      features: [
        'Branching time analysis',
        'Path quantifiers (A/E)',
        'State quantifiers (X/F/G/U)',
        'Nested formula verification',
      ],
      color: C.accent2,
    },
    {
      name: 'Witness Chains',
      subtitle: 'Post-Quantum Cryptographic Proofs',
      features: [
        'ML-DSA-65 signatures',
        'Tamper-evident audit trail',
        'TEE attestation integration',
        'DNA lineage tracking',
      ],
      color: C.accent3,
    },
  ];

  engines.forEach((eng, i) => {
    const x = 0.4 + i * 4.3;
    const w = 4.0;

    // Engine card
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.2, w, h: 4.5,
      fill: { color: C.card }, rectRadius: 0.1,
      line: { color: eng.color, width: 2 },
    });

    // Icon circle at top
    s.addShape(pptx.shapes.OVAL, {
      x: x + w / 2 - 0.4, y: 1.4, w: 0.8, h: 0.8,
      fill: { color: eng.color },
    });
    s.addText(String(i + 1), {
      x: x + w / 2 - 0.4, y: 1.4, w: 0.8, h: 0.8,
      fontSize: 24, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle',
    });

    // Engine name
    s.addText(eng.name, {
      x: x + 0.2, y: 2.3, w: w - 0.4, h: 0.4,
      fontSize: 16, fontFace: FONT.title, color: eng.color, align: 'center', bold: true,
    });

    // Subtitle
    s.addText(eng.subtitle, {
      x: x + 0.2, y: 2.7, w: w - 0.4, h: 0.3,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center',
    });

    // Divider line
    s.addShape(pptx.shapes.RECTANGLE, {
      x: x + 0.5, y: 3.1, w: w - 1.0, h: 0.02,
      fill: { color: eng.color },
    });

    // Feature list
    eng.features.forEach((feat, j) => {
      s.addText('\u2022 ' + feat, {
        x: x + 0.4, y: 3.3 + j * 0.5, w: w - 0.6, h: 0.45,
        fontSize: 11, fontFace: FONT.body, color: C.textMuted, valign: 'middle',
      });
    });
  });

  // Bottom insight bar
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.4, y: 5.9, w: 12.5, h: 0.8,
    fill: { color: C.bgLight }, rectRadius: 0.05,
    line: { color: C.accent, width: 1 },
  });
  s.addText('Why it matters:', {
    x: 0.7, y: 5.95, w: 2, h: 0.7,
    fontSize: 13, fontFace: FONT.title, color: C.accent, valign: 'middle', bold: true,
  });
  s.addText('Traditional AI: "It probably works." Prime Radiant: "We can mathematically prove it works." Required for healthcare, finance, defense.', {
    x: 2.7, y: 5.95, w: 10, h: 0.7,
    fontSize: 12, fontFace: FONT.body, color: C.textMuted, valign: 'middle',
  });

  addFooter(s);
  addSlideNumber(s, 16);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 17: Integration Architecture (shapes — MCP, PostgreSQL, APIs)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Integration Architecture', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('MCP protocol. PostgreSQL backbone. REST/GraphQL APIs. Drop-in to any stack.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Central hub
  s.addShape(pptx.shapes.OVAL, {
    x: 5.3, y: 2.8, w: 2.7, h: 2.7,
    fill: { color: C.card },
    line: { color: C.accent, width: 3 },
  });
  s.addText('RuvNet\nCore', {
    x: 5.3, y: 3.3, w: 2.7, h: 1.5,
    fontSize: 18, fontFace: FONT.title, color: C.accent, align: 'center', valign: 'middle', bold: true,
  });

  // Surrounding integration nodes
  const nodes = [
    { name: 'MCP Protocol',  detail: '96 tools\nstdio/SSE',     x: 1.0,  y: 1.2,  color: C.accent },
    { name: 'PostgreSQL',    detail: '290+ functions\nACID',      x: 10.0, y: 1.2,  color: C.accent2 },
    { name: 'REST API',      detail: 'OpenAPI 3.1\nJSON/SSE',    x: 0.5,  y: 4.5,  color: C.accent3 },
    { name: 'GraphQL',       detail: 'Subscriptions\nBatching',  x: 10.5, y: 4.5,  color: C.accentGreen },
    { name: 'WASM',          detail: '5.5KB runtime\nBrowser/Edge', x: 3.5,  y: 5.8,  color: C.accentRed },
    { name: 'Claude Code',   detail: 'Sub-agents\nSkills',       x: 8.0,  y: 5.8,  color: C.accent2 },
  ];

  nodes.forEach((n) => {
    // Node box
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: n.x, y: n.y, w: 2.5, h: 1.2,
      fill: { color: C.card }, rectRadius: 0.08,
      line: { color: n.color, width: 2 },
    });
    s.addText(n.name, {
      x: n.x, y: n.y + 0.05, w: 2.5, h: 0.45,
      fontSize: 13, fontFace: FONT.title, color: n.color, align: 'center', bold: true,
    });
    s.addText(n.detail, {
      x: n.x, y: n.y + 0.5, w: 2.5, h: 0.6,
      fontSize: 10, fontFace: FONT.body, color: C.textMuted, align: 'center',
    });

    // Connection lines (approximated with thin rectangles pointing to center)
    // Using arrow text as a simple connector
  });

  // Connection arrows (simplified with text arrows)
  const arrowPairs = [
    { x: 3.3, y: 1.7, rot: 25 },
    { x: 8.8, y: 1.7, rot: -25 },
    { x: 2.8, y: 4.2, rot: -15 },
    { x: 9.5, y: 4.2, rot: 15 },
    { x: 5.0, y: 5.5, rot: -30 },
    { x: 8.5, y: 5.5, rot: 30 },
  ];
  arrowPairs.forEach((a) => {
    s.addText('\u2500\u2500\u2500\u25B6', {
      x: a.x, y: a.y, w: 2, h: 0.3,
      fontSize: 10, color: C.textDim, align: 'center', rotate: a.rot,
    });
  });

  addFooter(s);
  addSlideNumber(s, 17);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 18: Implementation Roadmap — 4-phase timeline
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Implementation Roadmap', {
    x: 0.8, y: 0.2, w: 8, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('From zero to autonomous operations in 12 weeks. Each phase delivers standalone value.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Timeline line
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: 2.1, w: 11.7, h: 0.06,
    fill: { color: C.border },
  });

  const phases = [
    {
      name: 'FOUNDATION',
      weeks: 'Weeks 1-3',
      items: [
        'PostgreSQL + RuVector setup',
        'MCP server deployment',
        'AIMDS security middleware',
        'Basic agent spawning',
      ],
      color: C.accent,
    },
    {
      name: 'INTELLIGENCE',
      weeks: 'Weeks 4-6',
      items: [
        'SONA learning activation',
        'HNSW index optimization',
        'ReasoningBank initialization',
        'Nervous system tuning',
      ],
      color: C.accent2,
    },
    {
      name: 'CUSTOMIZE',
      weeks: 'Weeks 7-9',
      items: [
        'Domain-specific agents',
        'Custom attention selection',
        'RVF cognitive containers',
        'Pi Brain knowledge network',
      ],
      color: C.accent3,
    },
    {
      name: 'SCALE',
      weeks: 'Weeks 10-12',
      items: [
        'Multi-tenant RVCOW',
        'Swarm scaling to 150+',
        'Prime Radiant verification',
        'Production monitoring',
      ],
      color: C.accentGreen,
    },
  ];

  phases.forEach((ph, i) => {
    const x = 0.5 + i * 3.15;
    const w = 3.0;

    // Timeline dot
    s.addShape(pptx.shapes.OVAL, {
      x: x + w / 2 - 0.2, y: 1.95, w: 0.4, h: 0.4,
      fill: { color: ph.color },
    });
    s.addText(String(i + 1), {
      x: x + w / 2 - 0.2, y: 1.95, w: 0.4, h: 0.4,
      fontSize: 14, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle',
    });

    // Phase card below timeline
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.6, w, h: 4.0,
      fill: { color: C.card }, rectRadius: 0.1,
      line: { color: ph.color, width: 2 },
    });

    // Phase name
    s.addText(ph.name, {
      x, y: 2.7, w, h: 0.5,
      fontSize: 16, fontFace: FONT.title, color: ph.color, align: 'center', bold: true,
    });

    // Weeks badge
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + w / 2 - 0.8, y: 3.25, w: 1.6, h: 0.35,
      fill: { color: ph.color }, rectRadius: 0.05,
    });
    s.addText(ph.weeks, {
      x: x + w / 2 - 0.8, y: 3.25, w: 1.6, h: 0.35,
      fontSize: 10, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle',
    });

    // Feature list
    ph.items.forEach((item, j) => {
      s.addText('\u2713 ' + item, {
        x: x + 0.2, y: 3.8 + j * 0.55, w: w - 0.4, h: 0.5,
        fontSize: 11, fontFace: FONT.body, color: C.textMuted, valign: 'middle',
      });
    });
  });

  // Bottom note
  s.addText('Each phase delivers standalone production value. No big-bang deployment.', {
    x: 0.8, y: 6.8, w: 11, h: 0.3,
    fontSize: 11, fontFace: FONT.body, color: C.textDim, italic: true,
  });

  addFooter(s);
  addSlideNumber(s, 18);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 19: CTA — Schedule Architecture Review
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();

  // Hero image as background (dimmed)
  s.addImage({
    path: IMG.hero, x: 0, y: 0, w: 13.333, h: 7.5,
    transparency: 75,
  });

  // Dark overlay
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: C.bg, transparency: 30 },
  });

  // Main CTA
  s.addText('RUVNET', {
    x: 0.8, y: 1.5, w: 12, h: 1.0,
    fontSize: 56, fontFace: FONT.title, color: C.text, align: 'center', bold: true,
  });
  s.addText('Schedule a 30-Minute Architecture Review', {
    x: 0.8, y: 2.7, w: 12, h: 0.6,
    fontSize: 26, fontFace: FONT.body, color: C.accent, align: 'center',
  });
  s.addText('See how RuvNet fits your stack. Bring your toughest scaling challenge.', {
    x: 0.8, y: 3.4, w: 12, h: 0.4,
    fontSize: 15, fontFace: FONT.body, color: C.textMuted, align: 'center',
  });

  // Stats row
  addStat(s, 0.7,  4.5, '148+', 'Capabilities', C.accent);
  addStat(s, 2.9,  4.5, '14',   'Modules',      C.accent2);
  addStat(s, 5.1,  4.5, '80+',  'Rust Crates',  C.accent3);
  addStat(s, 7.3,  4.5, '290+', 'SQL Functions', C.accentGreen);
  addStat(s, 9.5,  4.5, '39',   'Attention\nMechanisms', C.accentRed);
  addStat(s, 11.5, 4.5, '96',   'MCP Tools',    C.accent);

  // Contact info
  s.addText('Open Source  |  MIT License  |  Production Ready', {
    x: 0.8, y: 6.0, w: 12, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted, align: 'center', italic: true,
  });

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 3.5, y: 6.5, w: 6.3, h: 0.5,
    fill: { color: C.accent }, rectRadius: 0.1,
  });
  s.addText('ruvnet.com  |  hello@ruvnet.com  |  github.com/ruvnet', {
    x: 3.5, y: 6.5, w: 6.3, h: 0.5,
    fontSize: 13, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle',
  });

  addSlideNumber(s, 19);
}

// ═══════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════
const outputPath = '/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/src/ui/public/assets/docs/CTO-Deck-RuvNet-2026-v2.pptx';
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

await pptx.writeFile({ fileName: outputPath });
console.log(`\nCTO Deck saved to: ${outputPath}`);
console.log(`Total slides: ${pptx.slides.length}`);
console.log(`\nSlide manifest:`);
const slideNames = [
  '1. Title + Hero Image + 6 Stats',
  '2. The Problem (87% Failure Rate)',
  '3. What Providers Ship (Comparison Table)',
  '4. Algorithms Beat GPUs (Cost Chart)',
  '5. Performance Benchmarks (Image)',
  '6. System Architecture (Image)',
  '7. Ship It In 5 Lines (Code + Cards)',
  '8. Ruflo Swarm (Image + Cards)',
  '9. RuVector HNSW (Image + Cards)',
  '10. RVF Format (Image + Cards)',
  '11. AIMDS Security (Image + Cards)',
  '12. SONA Learning (Image + Cards)',
  '13. Pi Brain (Image + Cards)',
  '14. Nervous System (5-Layer Shapes)',
  '15. 39 Attention Mechanisms (Grid)',
  '16. Prime Radiant (3 Engine Columns)',
  '17. Integration Architecture (Hub+Spokes)',
  '18. Implementation Roadmap (4-Phase Timeline)',
  '19. CTA + Stats + Contact',
];
slideNames.forEach(n => console.log(`  ${n}`));
