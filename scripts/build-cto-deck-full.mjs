#!/usr/bin/env node
/**
 * build-cto-deck-full.mjs — 24-slide CTO deck for RuvNet (v4)
 *
 * TARGET AUDIENCE: CTO evaluating whether to implement RuvNet architecture
 * to create competitive advantages and technical moats for their company.
 *
 * Narrative arc:
 *   Act 1 (1-4):   INTRIGUE — hook with the problem, show the gap
 *   Act 2 (5-7):   CREDIBILITY — benchmarks, architecture, code
 *   Act 3 (8-16):  DEPTH — each major module + competitive advantage
 *   Act 4 (17-25): CLOSE — attention framework, integration, roadmap, moat, tradeoffs, CTA, appendix
 *
 * Design rules:
 *   - 60%+ visual, 40% text per slide
 *   - Dark navy background (#0F1629)
 *   - Fonts: Arial Black / Arial / Consolas
 *   - PaperBanana images as dominant visuals where available
 *   - Every module slide ends with competitive advantage callout
 *   - Footer: enterprise positioning, not investor language
 *
 * Changes from v3 (target 98/100):
 *   1. Reframed narrative: "moat for YOUR company" not "look how cool"
 *   2. Title subtitle: competitive moat framing
 *   3. Footer: enterprise architecture positioning with slide numbers
 *   4. Module slides (8-14): competitive advantage callouts added
 *   5. NEW: "What This Means For Your Business" slide (after benchmarks)
 *   6. Attention mechanisms: decision framework for CTOs, not catalog
 *   7. CTA: enterprise implementation language, integration paths
 *   8. Title/CTA: solid navy overlay (80%+) for text legibility
 *   9. Tradeoffs: reframed as sovereign architecture decisions
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

const TOTAL_SLIDES = 24;

function addFooter(slide, num) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 7.15, w: 13.333, h: 0.35, fill: { color: C.bgLight },
  });
  slide.addText(`RUVNET  |  Enterprise Architecture  |  ${num}/${TOTAL_SLIDES}`, {
    x: 0.5, y: 7.15, w: 12, h: 0.35,
    fontSize: 9, fontFace: FONT.body, color: C.textDim,
  });
}

// Track slide number for correct numbering with new slides
let slideNum = 0;
function nextSlideNum() { return ++slideNum; }

// Helper: add competitive advantage callout at bottom of module slides
function addCompetitiveAdvantage(slide, text, y = 6.6) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.4, y, w: 12.5, h: 0.45,
    fill: { color: C.bgLight }, rectRadius: 0.05,
    line: { color: C.accentGreen, width: 2 },
  });
  slide.addText('COMPETITIVE MOAT:', {
    x: 0.7, y, w: 2.5, h: 0.45,
    fontSize: 10, fontFace: FONT.title, color: C.accentGreen, valign: 'middle', bold: true,
  });
  slide.addText(text, {
    x: 3.2, y, w: 9.5, h: 0.45,
    fontSize: 10, fontFace: FONT.body, color: C.text, valign: 'middle',
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1: Title — hero image background + 6 stat callouts
// FIX: Increased overlay opacity for text legibility
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();

  // Hero image as background overlay (full slide, heavily dimmed)
  s.addImage({
    path: IMG.hero, x: 0, y: 0, w: 13.333, h: 7.5,
    transparency: 85,
  });

  // Dark overlay for text legibility — 15% transparency = 85% opaque
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 7, h: 7.5,
    fill: { color: C.bg, transparency: 15 },
  });

  // Title block
  s.addText('RUVNET', {
    x: 0.8, y: 1.0, w: 6, h: 1.0,
    fontSize: 56, fontFace: FONT.title, color: C.text, bold: true,
  });
  s.addText('Enterprise AI Infrastructure', {
    x: 0.8, y: 2.1, w: 6, h: 0.5,
    fontSize: 22, fontFace: FONT.body, color: C.accent,
  });
  s.addText('The infrastructure your competitors don\'t have.\nAnd can\'t easily replicate.', {
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
  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2: The Problem — 87% failure rate
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 3: What Providers Ship — comparison table
// FIX: RuvNet column has green background highlight
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  // RuvNet column green background highlight — full height behind column
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: startX + 4 * colW - 0.1, y: 1.45, w: colW + 0.2, h: 5.6,
    fill: { color: C.accentGreen, transparency: 85 },
    rectRadius: 0.1,
    line: { color: C.accentGreen, width: 2 },
  });

  // Column headers
  providers.forEach((p, i) => {
    const isRuv = i === 4;
    s.addText(p, {
      x: startX + i * colW, y: 1.55, w: colW, h: 0.45,
      fontSize: 12, fontFace: FONT.body, color: isRuv ? C.accentGreen : C.textMuted,
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
      const symbol = val ? '\u2713' : '\u2014';
      const color = val ? (isRuv ? C.accentGreen : C.textDim) : C.textDim;
      const fsize = val ? 18 : 14;
      s.addText(symbol, {
        x: startX + i * colW, y, w: colW, h: 0.48,
        fontSize: fsize, fontFace: FONT.body, color, align: 'center', valign: 'middle',
        bold: isRuv && val,
      });
    });
  });

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 4: Algorithms Beat GPUs — cost comparison
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 5: Performance Benchmarks — full-width image
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 6: NEW — "What This Means For Your Business" (moat slide)
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();
  s.addText('What This Means For Your Business', {
    x: 0.8, y: 0.3, w: 12, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });
  s.addText('Capabilities your competitors literally cannot match without 18+ months of engineering.', {
    x: 0.8, y: 0.9, w: 12, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted,
  });

  const moatCards = [
    {
      title: 'Air-Gapped AI',
      body: 'Run full AI stack on classified networks, hospital\nfloors, trading systems. No cloud. No data leakage.\n\nYour competitors are cloud-dependent \u2014 you\'re not.',
      color: C.accent,
    },
    {
      title: 'Self-Learning Agents',
      body: 'Your AI gets smarter from every deployment.\nCompetitors retrain monthly for $50K-$500K.\n\nYou learn in <1ms for $0.',
      color: C.accent2,
    },
    {
      title: 'Knowledge That Compounds',
      body: 'Pi Brain means your Austin office benefits from\nwhat your London office learned yesterday.\n\nNo competitor has cross-session collective intelligence.',
      color: C.accentGreen,
    },
    {
      title: '5.5KB Edge Deployment',
      body: 'Put AI on $5 sensors in every factory, vehicle,\nretail location. Competitors need $50K GPU servers.\n\nYou deploy for the price of a coffee.',
      color: C.accent3,
    },
  ];

  moatCards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 6.5;
    const y = 1.6 + row * 2.7;
    const w = 6.2;
    const h = 2.5;

    // Card background
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      fill: { color: C.card }, rectRadius: 0.1,
      line: { color: card.color, width: 2 },
    });

    // Left accent bar
    s.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 0.08, h,
      fill: { color: card.color },
    });

    // Title
    s.addText(card.title, {
      x: x + 0.3, y: y + 0.15, w: w - 0.5, h: 0.45,
      fontSize: 18, fontFace: FONT.title, color: card.color, bold: true,
    });

    // Divider
    s.addShape(pptx.shapes.RECTANGLE, {
      x: x + 0.3, y: y + 0.65, w: w - 0.6, h: 0.02,
      fill: { color: card.color },
    });

    // Body
    s.addText(card.body, {
      x: x + 0.3, y: y + 0.8, w: w - 0.5, h: h - 1.0,
      fontSize: 12, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.35, valign: 'top',
    });
  });

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7: System Architecture — hero image full-width
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7: Ship It In 5 Lines
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 8: Ruflo Swarm — swarm image + callouts
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addCard(s, 9, 2.6, 4, 1.1,
    'Hierarchical Coordinator',
    'Queen-led swarms with worker agents.\nAnti-drift control. Raft consensus.',
    C.accent2);
  addCard(s, 9, 3.9, 4, 1.1,
    'Self-Healing Mesh',
    'Peer-to-peer failover. No single\npoint of failure. Gossip protocol.',
    C.accentGreen);
  addCard(s, 9, 5.2, 4, 1.1,
    'Byzantine Fault Tolerance',
    'Tolerates f < n/3 faulty agents.\nCRDT synchronization. Quorum-based.',
    C.accent3);

  addCompetitiveAdvantage(s, 'Deploy 150 autonomous agents while competitors manually orchestrate 3. Your ops team sleeps; theirs doesn\'t.');

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 9: RuVector — HNSW image + stats
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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
  addCard(s, 8.5, 5.3, 4.5, 1.1,
    'RVCOW Multi-Tenant',
    '512MB parent + 1,000 tenants = 2.5MB each.\nCOW branch creation: 2.6ms. 200x savings.',
    C.accent3);

  addCompetitiveAdvantage(s, 'Your vectors live in PostgreSQL with ACID. Competitors need 3 separate databases. You query with SQL; they write glue code.');

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 10: RVF Format — image + 24 segments
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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
  addCard(s, 8.5, 5.0, 4.5, 1.0,
    'Unikernel Tier',
    '125ms cold start. Single-purpose OS.\n18,000x smaller than containers.',
    C.accent3);

  addCompetitiveAdvantage(s, 'Ship AI to edge devices, browsers, and air-gapped systems. Competitors require cloud. You deploy anywhere.');

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 11: NEW — WASM Proof (file size comparison bar chart)
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();
  s.addText('The Proof Is Running Right Now', {
    x: 0.8, y: 0.2, w: 10, h: 0.5,
    fontSize: 28, fontFace: FONT.title, color: C.text,
  });
  s.addText('Runtime size comparison: containers vs. RVF WASM', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  // Bar chart: file size comparison
  s.addChart(pptx.charts.BAR, [
    {
      name: 'Runtime Size (MB)',
      labels: ['Docker Container', 'Minimal Container', 'RVF WASM Runtime'],
      values: [250, 25, 0.0055],
    },
  ], {
    x: 0.5, y: 1.2, w: 7.5, h: 4.5,
    showTitle: false,
    showValue: true,
    valueFontSize: 14,
    valueFontColor: C.text,
    catAxisLabelColor: C.textMuted,
    catAxisLabelFontSize: 12,
    valAxisHidden: true,
    chartColors: [C.accent],
    plotArea: { fill: { color: C.bgLight } },
    dataLabelPosition: 'outEnd',
    barDir: 'bar',
    barGapWidthPct: 150,
  });

  // Size labels (right side annotations)
  addCard(s, 8.5, 1.2, 4.5, 1.3,
    'Docker Container',
    '50-500 MB typical. Includes OS layer,\npackage manager, runtime dependencies.\nMassive attack surface.',
    C.accentRed);
  addCard(s, 8.5, 2.7, 4.5, 1.3,
    'Minimal Container (Alpine)',
    '5-50 MB stripped down. Still needs\nbase OS. Still needs orchestration.\nStill needs networking stack.',
    C.accent3);
  addCard(s, 8.5, 4.2, 4.5, 1.3,
    'RVF WASM Runtime',
    '5.5 KB. That is not a typo.\nSelf-contained. Self-booting.\n18,000x smaller than Docker.',
    C.accentGreen);

  // Proof callout
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 5.8, w: 12.3, h: 1.0,
    fill: { color: C.bgLight }, rectRadius: 0.08,
    line: { color: C.accentGreen, width: 2 },
  });
  s.addText('LIVE PROOF:', {
    x: 0.8, y: 5.85, w: 2, h: 0.9,
    fontSize: 14, fontFace: FONT.title, color: C.accentGreen, valign: 'middle', bold: true,
  });
  s.addText('This app (Ask-RuvNet) runs 434 expert articles in 0.6MB in your browser right now.\nThat is the proof. No server. No container. No GPU. Just mathematics.', {
    x: 2.8, y: 5.85, w: 9.8, h: 0.9,
    fontSize: 13, fontFace: FONT.body, color: C.text, valign: 'middle', lineSpacingMultiple: 1.4,
  });

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 12: AIMDS Security — security image + pipeline
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  // Right stats and cards (wider boxes for long values)
  s.addText('0.06ms', {
    x: 8.3, y: 1.2, w: 2.4, h: 0.7,
    fontSize: 32, fontFace: FONT.title, color: C.accentRed, bold: true, align: 'center',
  });
  s.addText('Detection', {
    x: 8.3, y: 1.85, w: 2.4, h: 0.4,
    fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center',
  });
  s.addText('>12K/s', {
    x: 10.7, y: 1.2, w: 2.4, h: 0.7,
    fontSize: 32, fontFace: FONT.title, color: C.accentGreen, bold: true, align: 'center',
  });
  s.addText('Throughput', {
    x: 10.7, y: 1.85, w: 2.4, h: 0.4,
    fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center',
  });

  addCard(s, 8.5, 2.6, 4.5, 1.1,
    'Layer 1: Detect (0.06ms)',
    '50+ patterns. Aho-Corasick matching.\nReal-time stream processing.',
    C.accent);
  addCard(s, 8.5, 3.9, 4.5, 1.1,
    'Layer 2: Analyze (80ms)',
    'Lyapunov chaos detection. LTL policy\nverification. Behavioral divergence.',
    C.accent2);
  addCard(s, 8.5, 5.0, 4.5, 1.0,
    'Layer 3: Respond (<50ms)',
    '7 adaptive strategies. 25-level\nstrange-loop. Real-time mitigation.',
    C.accentRed);

  addCompetitiveAdvantage(s, 'Chaos-theory detection catches attacks that rule-based systems miss. Your security learns; competitors\' stays static.');

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 13: SONA Learning — sona image + two-tier LoRA
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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
  addCard(s, 8.5, 5.0, 4.5, 1.0,
    'ReasoningBank',
    'HNSW-indexed decision history.\n300x faster retrieval. +55% quality.',
    C.accentGreen);

  addCompetitiveAdvantage(s, 'Every deployment makes your AI smarter for $0. Competitors retrain for $50K-$500K monthly. Your advantage compounds.');

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 14: Pi Brain — decentralized collective intelligence
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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
  addCard(s, 8.5, 5.0, 4.5, 1.0,
    'Cross-Agent Sharing',
    'Brain sync across agent swarms.\nPartitioned knowledge domains.',
    C.accentGreen);

  addCompetitiveAdvantage(s, 'Your Austin office benefits from what London learned yesterday. Competitors silo knowledge; yours compounds globally.');

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 15: NEW — "2 Generations Ahead" Timeline
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();
  s.addText('We Built the Future 8 Months Early', {
    x: 0.8, y: 0.3, w: 12, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });
  s.addText('While providers shipped inference endpoints, we shipped the complete intelligence stack.', {
    x: 0.8, y: 0.9, w: 12, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted,
  });

  // Timeline horizontal line
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: 3.5, w: 11.7, h: 0.06,
    fill: { color: C.border },
  });

  const milestones = [
    { date: 'Aug 2025',  label: 'Ruflo ships\n150+ agent swarms',        color: C.accent2,     competitor: false },
    { date: 'Oct 2025',  label: 'AgentDB:\n9 RL algorithms',             color: C.accentGreen, competitor: false },
    { date: 'Dec 2025',  label: 'RuVector\nWASM 5.5KB',                  color: C.accent,      competitor: false },
    { date: 'Feb 2026',  label: 'SONA\n<1ms learning',                   color: C.accent3,     competitor: false },
    { date: 'Mar 2026',  label: 'Claude Code ships\nsub-agents (1 type)', color: C.accentRed,   competitor: true },
  ];

  milestones.forEach((m, i) => {
    const x = 1.0 + i * 2.5;
    const dotSize = m.competitor ? 0.5 : 0.45;

    // Milestone dot
    s.addShape(pptx.shapes.OVAL, {
      x: x + 0.5 - dotSize / 2, y: 3.5 - dotSize / 2 + 0.03,
      w: dotSize, h: dotSize,
      fill: { color: m.color },
      line: m.competitor ? { color: C.text, width: 2 } : undefined,
    });

    // Date above
    s.addText(m.date, {
      x: x - 0.3, y: 2.3, w: 1.8, h: 0.4,
      fontSize: 13, fontFace: FONT.title, color: m.color, align: 'center', bold: true,
    });

    // Label below
    s.addText(m.label, {
      x: x - 0.5, y: 4.0, w: 2.2, h: 0.8,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center', lineSpacingMultiple: 1.3,
    });

    // Competitor tag
    if (m.competitor) {
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x - 0.2, y: 4.85, w: 1.6, h: 0.35,
        fill: { color: C.accentRed }, rectRadius: 0.05,
      });
      s.addText('COMPETITOR', {
        x: x - 0.2, y: 4.85, w: 1.6, h: 0.35,
        fontSize: 9, fontFace: FONT.title, color: C.text, align: 'center', valign: 'middle', bold: true,
      });
    }
  });

  // Bottom insight
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 5.8, w: 12.3, h: 1.0,
    fill: { color: C.bgLight }, rectRadius: 0.08,
    line: { color: C.accent2, width: 2 },
  });
  s.addText('8 MONTHS AHEAD', {
    x: 0.8, y: 5.85, w: 3, h: 0.9,
    fontSize: 16, fontFace: FONT.title, color: C.accent2, valign: 'middle', bold: true,
  });
  s.addText('When Claude Code shipped its first sub-agent type in March 2026, Ruflo had already deployed 150+ specialized agents, 9 RL algorithms, WASM runtimes, and real-time learning. We are not catching up. They are.', {
    x: 3.5, y: 5.85, w: 9.2, h: 0.9,
    fontSize: 12, fontFace: FONT.body, color: C.textMuted, valign: 'middle', lineSpacingMultiple: 1.3,
  });

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 16: Nervous System — 5-layer bio-inspired (shapes)
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();
  s.addText('Nervous System: 5-Layer Bio-Inspired Architecture', {
    x: 0.8, y: 0.1, w: 12, h: 0.7,
    fontSize: 24, fontFace: FONT.title, color: C.text,
  });
  s.addText('From <100ns sensing to system-wide coherence. Inspired by biological neural pathways.', {
    x: 0.8, y: 0.75, w: 10, h: 0.3,
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 17: Choose the Right Attention Pattern — CTO decision framework
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();
  s.addText('Choose the Right Attention Pattern', {
    x: 0.8, y: 0.2, w: 10, h: 0.5,
    fontSize: 26, fontFace: FONT.title, color: C.text,
  });
  s.addText('39 mechanisms, organized by what your business needs. Pick the pattern; we handle the implementation.', {
    x: 0.8, y: 0.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: FONT.body, color: C.textMuted,
  });

  const decisionCards = [
    {
      category: 'SPEED-CRITICAL',
      useCases: 'Trading systems, real-time bidding,\nfraud detection, live recommendations',
      patterns: 'Flash v2 (2.49-7.47x), Sparse,\nLinear, Multi-Query, Grouped Query',
      metric: '<100\u00B5s latency',
      color: C.accent,
    },
    {
      category: 'GRAPH-STRUCTURED',
      useCases: 'Supply chain, social networks,\nknowledge graphs, dependency analysis',
      patterns: 'GraphRoPE*, MinCut-Gated*,\nGraph, Hyperbolic, Axial',
      metric: 'Topology-aware',
      color: C.accent2,
    },
    {
      category: 'LONG-CONTEXT',
      useCases: 'Legal document analysis, medical\nrecords, code repositories, compliance',
      patterns: 'Longformer, BigBird, Sliding\nWindow, PagedKV, Ring',
      metric: '100K+ tokens',
      color: C.accent3,
    },
    {
      category: 'NOVEL / PROPRIETARY',
      useCases: 'These are RuvNet originals \u2014\nyour competitors don\'t have them',
      patterns: 'MinCut-Gated*, GraphRoPE*,\nDifferential*, NSA*, Fractal,\nSpiking Neural, Neuromorphic',
      metric: 'Exclusive moat',
      color: C.accentGreen,
    },
  ];

  decisionCards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 6.5;
    const y = 1.2 + row * 2.7;
    const w = 6.2;
    const h = 2.5;
    const isNovel = i === 3;

    // Card background
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      fill: { color: isNovel ? C.bgLight : C.card },
      rectRadius: 0.1,
      line: { color: card.color, width: isNovel ? 3 : 2 },
    });

    // Category header bar
    s.addShape(pptx.shapes.RECTANGLE, {
      x, y, w, h: 0.5,
      fill: { color: card.color },
    });
    s.addText(card.category, {
      x, y, w: w - 1.8, h: 0.5,
      fontSize: 12, fontFace: FONT.title, color: C.bg, valign: 'middle', bold: true,
    });

    // Metric badge
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + w - 1.8, y: y + 0.07, w: 1.7, h: 0.36,
      fill: { color: C.bg }, rectRadius: 0.05,
    });
    s.addText(card.metric, {
      x: x + w - 1.8, y: y + 0.07, w: 1.7, h: 0.36,
      fontSize: 9, fontFace: FONT.title, color: card.color, align: 'center', valign: 'middle', bold: true,
    });

    // Use cases label
    s.addText('USE CASES:', {
      x: x + 0.2, y: y + 0.6, w: 1.5, h: 0.3,
      fontSize: 9, fontFace: FONT.title, color: card.color, bold: true,
    });
    s.addText(card.useCases, {
      x: x + 1.7, y: y + 0.55, w: w - 2.0, h: 0.7,
      fontSize: 10, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.25,
    });

    // Patterns label
    s.addText('PATTERNS:', {
      x: x + 0.2, y: y + 1.35, w: 1.5, h: 0.3,
      fontSize: 9, fontFace: FONT.title, color: card.color, bold: true,
    });
    s.addText(card.patterns, {
      x: x + 1.7, y: y + 1.3, w: w - 2.0, h: 0.9,
      fontSize: 10, fontFace: FONT.body, color: isNovel ? C.accentGreen : C.textMuted,
      bold: isNovel, lineSpacingMultiple: 1.25,
    });
  });

  // Bottom legend
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.4, y: 6.55, w: 12.5, h: 0.5,
    fill: { color: C.bgLight }, rectRadius: 0.05,
    line: { color: C.accentGreen, width: 2 },
  });
  s.addText('* = RuvNet originals. Not available in any competing framework. These become your technical moat.', {
    x: 0.7, y: 6.55, w: 12, h: 0.5,
    fontSize: 11, fontFace: FONT.body, color: C.accentGreen, valign: 'middle', bold: true,
  });

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 18: Prime Radiant — Formal Verification (shapes)
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 19: Integration Architecture (shapes — MCP, PostgreSQL, APIs)
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  nodes.forEach((nd) => {
    // Node box
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: nd.x, y: nd.y, w: 2.5, h: 1.2,
      fill: { color: C.card }, rectRadius: 0.08,
      line: { color: nd.color, width: 2 },
    });
    s.addText(nd.name, {
      x: nd.x, y: nd.y + 0.05, w: 2.5, h: 0.45,
      fontSize: 13, fontFace: FONT.title, color: nd.color, align: 'center', bold: true,
    });
    s.addText(nd.detail, {
      x: nd.x, y: nd.y + 0.5, w: 2.5, h: 0.6,
      fontSize: 10, fontFace: FONT.body, color: C.textMuted, align: 'center',
    });
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 20: Implementation Roadmap — 4-phase timeline
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
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

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 21: NEW — "What We Don't Do (Yet)" — Tradeoffs
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();
  s.addText('What We Don\'t Do (Yet)', {
    x: 0.8, y: 0.3, w: 10, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });
  s.addText('These aren\'t weaknesses. They\'re architectural decisions that keep your data sovereign.', {
    x: 0.8, y: 0.9, w: 10, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted,
  });

  const tradeoffs = [
    {
      title: 'We Don\'t Host Your Data',
      body: 'You run it on your infrastructure.\nNo vendor lock-in. No data residency concerns.\nAir-gapped deployments fully supported.\nThat\'s the point.',
      framing: 'SOVEREIGN',
      color: C.accentGreen,
    },
    {
      title: 'We Don\'t Replace Your LLM',
      body: 'We make any provider 8,000x more useful.\nSwap providers without changing code.\nMCP abstracts the model layer.\nYour choice. Your budget. Your compliance.',
      framing: 'FLEXIBLE',
      color: C.accent,
    },
    {
      title: 'Python SDK: Community',
      body: 'TypeScript and Rust are first-class.\nPython exists but gets community updates.\nPython parity: 2026 H2 roadmap.\nIf Python-first, expect contribution.',
      framing: 'HONEST GAP',
      color: C.accent3,
    },
    {
      title: 'No Managed Service',
      body: 'We don\'t offer a hosted SaaS version.\nYou deploy on your infra, your terms.\nWe provide support + architecture.\nYour data never leaves your network.',
      framing: 'BY DESIGN',
      color: C.accent2,
    },
  ];

  tradeoffs.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 6.5;
    const y = 1.5 + row * 2.7;
    const w = 6.2;
    const cardH = 2.5;

    // Card
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: cardH,
      fill: { color: C.card }, rectRadius: 0.1,
      line: { color: t.color, width: 2 },
    });

    // Framing badge at top
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.2, y: y + 0.15, w: 1.8, h: 0.32,
      fill: { color: t.color }, rectRadius: 0.05,
    });
    s.addText(t.framing, {
      x: x + 0.2, y: y + 0.15, w: 1.8, h: 0.32,
      fontSize: 9, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle', bold: true,
    });

    // Title
    s.addText(t.title, {
      x: x + 2.2, y: y + 0.1, w: w - 2.5, h: 0.45,
      fontSize: 15, fontFace: FONT.title, color: t.color, bold: true,
    });

    // Divider
    s.addShape(pptx.shapes.RECTANGLE, {
      x: x + 0.3, y: y + 0.6, w: w - 0.6, h: 0.02,
      fill: { color: t.color },
    });

    // Body
    s.addText(t.body, {
      x: x + 0.3, y: y + 0.75, w: w - 0.6, h: cardH - 0.95,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.35, valign: 'top',
    });
  });

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 22: CTA — Enterprise Implementation
// Solid navy background for guaranteed text legibility
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();

  // Solid navy background — no image overlay, guaranteed legibility
  // (deliberately NOT using hero image here to avoid text-on-image overlap)

  // Main CTA
  s.addText('RUVNET', {
    x: 0.8, y: 0.8, w: 12, h: 1.0,
    fontSize: 56, fontFace: FONT.title, color: C.text, align: 'center', bold: true,
  });
  s.addText('Let\'s Benchmark on YOUR Data', {
    x: 0.8, y: 1.9, w: 12, h: 0.6,
    fontSize: 28, fontFace: FONT.body, color: C.accent, align: 'center',
  });

  // Timeline cards
  const timeline = [
    { time: '2 Weeks', desc: 'Proof of concept on\nyour infrastructure', color: C.accent },
    { time: '90 Days', desc: 'Production deployment\nfull stack', color: C.accentGreen },
    { time: 'Day 1', desc: 'We benchmark on\nYOUR data', color: C.accent2 },
  ];
  timeline.forEach((t, i) => {
    const x = 0.8 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.8, w: 3.8, h: 1.3,
      fill: { color: C.card }, rectRadius: 0.1,
      line: { color: t.color, width: 2 },
    });
    s.addText(t.time, {
      x, y: 2.85, w: 3.8, h: 0.5,
      fontSize: 22, fontFace: FONT.title, color: t.color, align: 'center', bold: true,
    });
    s.addText(t.desc, {
      x, y: 3.35, w: 3.8, h: 0.7,
      fontSize: 12, fontFace: FONT.body, color: C.textMuted, align: 'center', lineSpacingMultiple: 1.3,
    });
  });

  // Integration paths
  s.addText('Integration Paths', {
    x: 0.8, y: 4.4, w: 12, h: 0.4,
    fontSize: 16, fontFace: FONT.title, color: C.text, align: 'center',
  });

  const paths = [
    { name: 'PostgreSQL Extension', detail: 'Drop-in', color: C.accent },
    { name: 'Node.js SDK', detail: 'npm install', color: C.accent2 },
    { name: 'WASM Browser Runtime', detail: '5.5KB', color: C.accent3 },
    { name: 'MCP Protocol', detail: '96 tools', color: C.accentGreen },
  ];
  paths.forEach((p, i) => {
    const x = 0.4 + i * 3.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 4.9, w: 3.0, h: 0.9,
      fill: { color: C.card }, rectRadius: 0.08,
      line: { color: p.color, width: 1 },
    });
    s.addText(p.name, {
      x, y: 4.9, w: 3.0, h: 0.5,
      fontSize: 11, fontFace: FONT.title, color: p.color, align: 'center', bold: true,
    });
    s.addText(p.detail, {
      x, y: 5.35, w: 3.0, h: 0.4,
      fontSize: 10, fontFace: FONT.body, color: C.textMuted, align: 'center',
    });
  });

  // Contact bar
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 2.5, y: 6.2, w: 8.3, h: 0.6,
    fill: { color: C.accent }, rectRadius: 0.1,
  });
  s.addText('hello@ruvnet.com  |  ruvnet.com/enterprise  |  Schedule Architecture Review', {
    x: 2.5, y: 6.2, w: 8.3, h: 0.6,
    fontSize: 14, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle',
  });

  addFooter(s, n);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 23: NEW — Appendix Index
// ═══════════════════════════════════════════════════════════════
{
  const n = nextSlideNum();
  const s = addSlide();
  s.addText('Appendix', {
    x: 0.8, y: 0.4, w: 8, h: 0.6,
    fontSize: 32, fontFace: FONT.title, color: C.text,
  });
  s.addText('Supporting materials available on request', {
    x: 0.8, y: 1.0, w: 8, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted,
  });

  const appendixItems = [
    { title: 'Technical Architecture Deep Dive',       detail: 'This deck — full system walkthrough', color: C.accent },
    { title: 'Implementation Playbook',                detail: 'Step-by-step deployment guide (available on request)', color: C.accent2 },
    { title: 'Security & Compliance Whitepaper',       detail: 'AIMDS deep dive, SOC2 mapping, threat model', color: C.accentRed },
    { title: 'Benchmark Methodology & Raw Data',       detail: 'Reproducible benchmarks with hardware specs', color: C.accent3 },
    { title: 'API Reference',                          detail: 'ruvnet.com/docs', color: C.accentGreen },
  ];

  appendixItems.forEach((item, i) => {
    const y = 1.8 + i * 1.0;

    // Item card
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.0, y, w: 11.3, h: 0.85,
      fill: { color: C.card }, rectRadius: 0.08,
    });

    // Left accent bar
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 1.0, y, w: 0.06, h: 0.85,
      fill: { color: item.color },
    });

    // Number circle
    s.addShape(pptx.shapes.OVAL, {
      x: 1.3, y: y + 0.17, w: 0.5, h: 0.5,
      fill: { color: item.color },
    });
    s.addText(String(i + 1), {
      x: 1.3, y: y + 0.17, w: 0.5, h: 0.5,
      fontSize: 16, fontFace: FONT.title, color: C.bg, align: 'center', valign: 'middle',
    });

    // Title
    s.addText(item.title, {
      x: 2.1, y, w: 5, h: 0.85,
      fontSize: 16, fontFace: FONT.body, color: item.color, bold: true, valign: 'middle',
    });

    // Detail
    s.addText(item.detail, {
      x: 7.2, y, w: 4.8, h: 0.85,
      fontSize: 12, fontFace: FONT.body, color: C.textMuted, valign: 'middle',
    });
  });

  // Bottom contact
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 3.0, y: 6.5, w: 7.3, h: 0.5,
    fill: { color: C.bgLight }, rectRadius: 0.1,
    line: { color: C.accent, width: 1 },
  });
  s.addText('Request materials: hello@ruvnet.com  |  ruvnet.com/docs', {
    x: 3.0, y: 6.5, w: 7.3, h: 0.5,
    fontSize: 13, fontFace: FONT.body, color: C.accent, align: 'center', valign: 'middle',
  });

  addFooter(s, n);
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
  '1.  Title — Enterprise AI Infrastructure (solid overlay)',
  '2.  The Problem (87% Failure Rate)',
  '3.  What Providers Ship (RuvNet column highlighted)',
  '4.  Algorithms Beat GPUs (Cost Chart)',
  '5.  Performance Benchmarks (Image)',
  '6.  What This Means For Your Business (4 moat cards) [NEW]',
  '7.  System Architecture (Image)',
  '8.  Ship It In 5 Lines (Code + Cards)',
  '9.  Ruflo Swarm + Competitive Moat',
  '10. RuVector HNSW + Competitive Moat',
  '11. RVF Format + Competitive Moat',
  '12. WASM Proof (Bar Chart + Live Proof)',
  '13. AIMDS Security + Competitive Moat',
  '14. SONA Learning + Competitive Moat',
  '15. Pi Brain + Competitive Moat',
  '16. 2 Generations Ahead (Timeline)',
  '17. Nervous System (5-Layer Shapes)',
  '18. Choose the Right Attention Pattern (CTO Decision Framework) [REWRITTEN]',
  '19. Prime Radiant (3 Engine Columns)',
  '20. Integration Architecture (Hub+Spokes)',
  '21. Implementation Roadmap (4-Phase Timeline)',
  '22. What We Don\'t Do Yet (4 Sovereign Tradeoffs) [EXPANDED]',
  '23. CTA — Enterprise Implementation (solid navy) [REWRITTEN]',
  '24. Appendix Index',
];
slideNames.forEach(n => console.log(`  ${n}`));
if (pptx.slides.length !== TOTAL_SLIDES) {
  console.warn(`\nWARNING: Expected ${TOTAL_SLIDES} slides but got ${pptx.slides.length}. Update TOTAL_SLIDES constant!`);
}
