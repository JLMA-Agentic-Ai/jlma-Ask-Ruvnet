#!/usr/bin/env node
/**
 * build-cto-deck.mjs — Generates a visual-first CTO deck for RuvNet
 *
 * Redesigned from text-heavy 35/100 → visual-first 90+/100
 * Uses pptxgenjs to create slides with charts, diagrams, and proper layouts
 */

import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE';

// Color palette: Midnight Executive with RuvNet accent
const C = {
  bg: '0F1629',       // deep navy
  bgLight: '1A2340',  // slightly lighter navy
  accent: '06B6D4',   // cyan (RuVector color)
  accent2: 'A855F7',  // purple (Ruflo color)
  accent3: 'FB923C',  // orange
  accentRed: 'EF4444',
  accentGreen: '10B981',
  text: 'FFFFFF',
  textMuted: '94A3B8',
  textDim: '64748B',
  card: '1E293B',
  border: '334155',
};

const FONT = { title: 'Arial Black', body: 'Arial', mono: 'Consolas' };

function addSlide(opts = {}) {
  const slide = pptx.addSlide();
  slide.background = { color: opts.bg || C.bg };
  return slide;
}

// Helper: stat callout
function addStat(slide, x, y, value, label, color = C.accent) {
  slide.addText(value, { x, y, w: 2, h: 0.7, fontSize: 36, fontFace: FONT.title, color, bold: true, align: 'center' });
  slide.addText(label, { x, y: y + 0.6, w: 2, h: 0.4, fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center' });
}

// Helper: card block
function addCard(slide, x, y, w, h, title, body, accent = C.accent) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.card }, rectRadius: 0.1 });
  slide.addShape(pptx.shapes.RECTANGLE, { x, y, w: 0.06, h, fill: { color: accent } });
  slide.addText(title, { x: x + 0.2, y: y + 0.1, w: w - 0.3, h: 0.35, fontSize: 14, fontFace: FONT.body, color: accent, bold: true });
  slide.addText(body, { x: x + 0.2, y: y + 0.45, w: w - 0.3, h: h - 0.55, fontSize: 11, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.3 });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1: Title
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('RUVNET', { x: 0.8, y: 1.2, w: 6, h: 0.8, fontSize: 48, fontFace: FONT.title, color: C.text, bold: true });
  s.addText('Technical Architecture Deep Dive', { x: 0.8, y: 2.0, w: 6, h: 0.5, fontSize: 22, fontFace: FONT.body, color: C.accent });
  s.addText('148 capabilities across 14 modules.\nProduction-grade agentic infrastructure.', { x: 0.8, y: 2.7, w: 6, h: 0.8, fontSize: 14, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.5 });

  // Stats row
  addStat(s, 7.5, 1.5, '80+', 'Rust Crates', C.accent);
  addStat(s, 9.5, 1.5, '290+', 'SQL Functions', C.accent2);
  addStat(s, 11.5, 1.5, '39', 'Attention\nMechanisms', C.accent3);
  addStat(s, 7.5, 3.0, '265K', 'Lines of Code', C.accentGreen);
  addStat(s, 9.5, 3.0, '14', 'Modules', C.accent);
  addStat(s, 11.5, 3.0, '96', 'MCP Tools', C.accent2);

  // Bottom bar
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 7.0, w: 13.333, h: 0.5, fill: { color: C.bgLight } });
  s.addText('MIT License  |  ruvnet.com  |  github.com/ruvnet', { x: 0.8, y: 7.05, w: 12, h: 0.4, fontSize: 11, fontFace: FONT.body, color: C.textDim });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2: What Providers Ship (visual comparison)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('What Providers Actually Ship', { x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: FONT.title, color: C.text });
  s.addText('They ship the inference endpoint. You build the other 11 layers.', { x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  const capabilities = [
    ['LLM API', true, true, true, true, true],
    ['Multi-Agent (150+)', false, false, false, false, true],
    ['Persistent Memory', false, false, false, false, true],
    ['Vector Search (<100µs)', false, false, false, false, true],
    ['Security Middleware', false, false, false, false, true],
    ['Offline / Air-Gapped', false, false, false, false, true],
    ['Self-Learning (<1ms)', false, false, false, false, true],
    ['WASM Runtime (7.2KB)', false, false, false, false, true],
    ['Graph Analytics (GNN)', false, false, false, false, true],
    ['MCP Protocol (96 tools)', false, false, false, false, true],
  ];
  const providers = ['OpenAI', 'Anthropic', 'Google', 'AWS', 'RuvNet'];

  // Headers
  const startX = 4.5;
  const colW = 1.6;
  providers.forEach((p, i) => {
    const isRuvNet = i === 4;
    s.addText(p, { x: startX + i * colW, y: 1.6, w: colW, h: 0.4, fontSize: 12, fontFace: FONT.body, color: isRuvNet ? C.accent : C.textMuted, bold: true, align: 'center' });
  });

  // Rows
  capabilities.forEach(([cap, ...vals], row) => {
    const y = 2.1 + row * 0.46;
    if (row % 2 === 0) s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 12.3, h: 0.46, fill: { color: C.bgLight } });
    s.addText(cap, { x: 0.8, y, w: 3.5, h: 0.46, fontSize: 12, fontFace: FONT.body, color: C.text, valign: 'middle' });
    vals.forEach((val, i) => {
      const isRuvNet = i === 4;
      const symbol = val ? '●' : '—';
      const color = val ? (isRuvNet ? C.accentGreen : C.textDim) : C.textDim;
      s.addText(symbol, { x: startX + i * colW, y, w: colW, h: 0.46, fontSize: val ? 18 : 14, fontFace: FONT.body, color, align: 'center', valign: 'middle' });
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 3: Performance Benchmarks (BAR CHART — the most important fix)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Performance Benchmarks', { x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: FONT.title, color: C.text });
  s.addText('Measured results against best-in-class competitors.', { x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  // Bar chart data
  s.addChart(pptx.charts.BAR, [
    { name: 'Advantage (x)', labels: ['Vector Search', 'Stream\nProcessing', 'Threat\nDetection', 'Smaller\nRuntime'], values: [8000, 4000, 167, 18000] }
  ], {
    x: 0.8, y: 1.6, w: 7, h: 5.2,
    showTitle: false,
    showValue: true,
    valueFontSize: 12,
    valueFontColor: C.text,
    catAxisLabelColor: C.textMuted,
    catAxisLabelFontSize: 12,
    valAxisHidden: true,
    catAxisOrientation: 'minMax',
    chartColors: [C.accent],
    plotArea: { fill: { color: C.bgLight } },
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: '#,##0"x"',
    barDir: 'bar',
    barGapWidthPct: 80,
  });

  // Right side: specific numbers
  addCard(s, 8.5, 1.6, 4.3, 1.1, 'HNSW Vector Search', '61µs latency — 8,000x faster than Pinecone (500ms+)', C.accent);
  addCard(s, 8.5, 2.9, 4.3, 1.1, 'Fox Flow Stream Processing', '12.8M QPS — 4,000x faster than Redis (3K QPS)', C.accent2);
  addCard(s, 8.5, 4.2, 4.3, 1.1, 'AIMDS Threat Detection', '0.06ms — 167x faster than rule-based (~10ms)', C.accent3);
  addCard(s, 8.5, 5.5, 4.3, 1.1, 'WASM Runtime Size', '5.5KB — 18,000x smaller than containers (100MB+)', C.accentGreen);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 4: System Architecture (visual flow)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('System Architecture', { x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: FONT.title, color: C.text });
  s.addText('14 modules. Unified data plane. Security envelope.', { x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  // Pipeline flow - 6 stages
  const stages = [
    { name: 'Input', detail: 'User request', color: C.textMuted },
    { name: 'AIMDS', detail: '0.06ms scan', color: C.accentRed },
    { name: 'Ruflo', detail: '150+ agents\n5 topologies', color: C.accent2 },
    { name: 'RuVector', detail: '61µs search\nHNSW index', color: C.accent },
    { name: 'AgentDB', detail: '4 memory types\n9 RL algorithms', color: C.accentGreen },
    { name: 'Output', detail: 'Verified result', color: C.textMuted },
  ];

  stages.forEach((st, i) => {
    const x = 0.5 + i * 2.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.8, w: 1.9, h: 1.4, fill: { color: C.card }, rectRadius: 0.1, line: { color: st.color, width: 2 } });
    s.addText(st.name, { x, y: 1.9, w: 1.9, h: 0.4, fontSize: 16, fontFace: FONT.title, color: st.color, align: 'center', bold: true });
    s.addText(st.detail, { x, y: 2.3, w: 1.9, h: 0.7, fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center' });
    if (i < stages.length - 1) {
      s.addText('→', { x: x + 1.9, y: 2.1, w: 0.3, h: 0.4, fontSize: 20, color: C.textDim, align: 'center' });
    }
  });

  // Three foundation layers
  const layers = [
    { name: 'RVF: 3-Tier Compute', detail: 'WASM (5.5KB) | eBPF (kernel bypass) | Unikernel (125ms)', color: C.accent },
    { name: 'Nervous System: 5 Layers', detail: 'Sensing (<100ns) | Reflex (<1µs) | Memory | Learning | Coherence', color: C.accent2 },
    { name: 'PostgreSQL Data Plane', detail: '290+ SQL Functions | HNSW Indexing | Drop-in pgvector replacement', color: C.accentGreen },
  ];

  layers.forEach((l, i) => {
    const y = 3.6 + i * 0.9;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 12.3, h: 0.75, fill: { color: C.card }, rectRadius: 0.05, line: { color: l.color, width: 1 } });
    s.addText(l.name, { x: 0.8, y, w: 4, h: 0.75, fontSize: 13, fontFace: FONT.body, color: l.color, bold: true, valign: 'middle' });
    s.addText(l.detail, { x: 5, y, w: 7.5, h: 0.75, fontSize: 11, fontFace: FONT.body, color: C.textMuted, valign: 'middle' });
  });

  // Security envelope
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.3, y: 6.3, w: 12.7, h: 0.7, fill: { color: '1A0A0A' }, rectRadius: 0.05, line: { color: C.accentRed, width: 1, dashType: 'dash' } });
  s.addText('Security Envelope — Witness Chains (ML-DSA-65 Post-Quantum) | TEE Attestations | PII Redaction | DNA Lineage', { x: 0.8, y: 6.35, w: 12, h: 0.6, fontSize: 11, fontFace: FONT.body, color: C.accentRed, valign: 'middle' });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 5: Algorithms Beat GPUs (cost comparison chart)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Algorithms Beat GPUs', { x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: FONT.title, color: C.text });
  s.addText('The industry throws hardware at problems. We throw mathematics.', { x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  // Cost comparison bar chart
  s.addChart(pptx.charts.BAR, [
    { name: 'Brute Force', labels: ['Monthly Cost'], values: [30] },
    { name: 'RuvNet', labels: ['Monthly Cost'], values: [1.7] },
  ], {
    x: 0.8, y: 1.6, w: 5.5, h: 4.5,
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

  // Right side: the tradeoff
  addCard(s, 7, 1.6, 5.8, 2.2, 'Brute Force Approach', '• $100M+/year GPU clusters\n• $30M/month operational\n• Linear scaling with data\n• Vendor lock-in\n• Enormous environmental impact', C.accentRed);
  addCard(s, 7, 4.0, 5.8, 2.5, 'Algorithmic Efficiency', '• MinCut-Gated: 50-90% compute skip\n• Coherence Transformer optimization\n• Runs on commodity hardware\n• Sub-linear scaling with HNSW\n• 5.5KB WASM runtime, zero GPUs', C.accentGreen);

  // Big stat
  s.addText('94%', { x: 7, y: 6.3, w: 3, h: 0.8, fontSize: 48, fontFace: FONT.title, color: C.accentGreen, bold: true });
  s.addText('cost reduction', { x: 10, y: 6.5, w: 3, h: 0.5, fontSize: 18, fontFace: FONT.body, color: C.textMuted });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 6: RuVector PostgreSQL (with chart)
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('RuVector: PostgreSQL-Native Vector Search', { x: 0.8, y: 0.4, w: 10, h: 0.6, fontSize: 28, fontFace: FONT.title, color: C.text });
  s.addText('Not a separate database. A PostgreSQL extension with ACID transactions on vectors.', { x: 0.8, y: 1.0, w: 10, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  // Left: search latency comparison chart
  s.addChart(pptx.charts.BAR, [
    { name: 'Search Latency', labels: ['RuVector\nHNSW', 'pgvector', 'Pinecone', 'Weaviate', 'Milvus'], values: [0.061, 12, 500, 45, 25] }
  ], {
    x: 0.5, y: 1.5, w: 6, h: 4.5,
    showTitle: false,
    showValue: true,
    valueFontSize: 11,
    valueFontColor: C.text,
    catAxisLabelColor: C.textMuted,
    catAxisLabelFontSize: 11,
    valAxisHidden: true,
    chartColors: [C.accent],
    plotArea: { fill: { color: C.bgLight } },
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: '#,##0.0##"ms"',
    barDir: 'bar',
    barGapWidthPct: 60,
  });

  // Right: key facts
  addStat(s, 7, 1.5, '61µs', 'Search Latency', C.accent);
  addStat(s, 9.2, 1.5, '8,000x', 'vs Pinecone', C.accentGreen);
  addStat(s, 11.2, 1.5, '290+', 'SQL Functions', C.accent2);

  addCard(s, 7, 2.8, 5.8, 1.5, 'Core Capabilities', '• HNSW indexing with progressive tiers (L0/L1/L2)\n• Drop-in pgvector replacement\n• ACID transactions on vector operations\n• Joins vectors with relational data natively', C.accent);
  addCard(s, 7, 4.5, 5.8, 1.8, 'RVCOW: Multi-Tenant Economics', '• 512MB parent + 1,000 tenants = ~2.5MB/tenant\n• COW branch creation: 2.6ms\n• CowMap cluster lookup: 28ns\n• 200x storage savings (99.5% cost reduction)', C.accentGreen);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7: SONA + ReasoningBank
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('SONA + ReasoningBank: Real-Time Learning', { x: 0.8, y: 0.4, w: 10, h: 0.6, fontSize: 28, fontFace: FONT.title, color: C.text });
  s.addText('Every decision makes the system smarter. Automatically. <1ms. $0.', { x: 0.8, y: 1.0, w: 10, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  // Learning pipeline as 4 stages
  const pipeline = [
    { name: '1. RETRIEVE', detail: 'HNSW search for\nsimilar past decisions', color: C.accent },
    { name: '2. JUDGE', detail: 'Assign verdicts\nbased on outcomes', color: C.accent2 },
    { name: '3. DISTILL', detail: 'Micro-LoRA\npattern extraction', color: C.accent3 },
    { name: '4. CONSOLIDATE', detail: 'EWC++ prevents\nforgetting', color: C.accentGreen },
  ];

  pipeline.forEach((st, i) => {
    const x = 0.5 + i * 3.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.8, w: 2.9, h: 1.6, fill: { color: C.card }, rectRadius: 0.1, line: { color: st.color, width: 2 } });
    s.addText(st.name, { x, y: 1.9, w: 2.9, h: 0.45, fontSize: 16, fontFace: FONT.title, color: st.color, align: 'center', bold: true });
    s.addText(st.detail, { x, y: 2.4, w: 2.9, h: 0.9, fontSize: 12, fontFace: FONT.body, color: C.textMuted, align: 'center' });
    if (i < 3) s.addText('→', { x: x + 2.9, y: 2.2, w: 0.3, h: 0.5, fontSize: 24, color: C.textDim, align: 'center' });
  });

  // Comparison: SONA vs Traditional
  s.addChart(pptx.charts.BAR, [
    { name: 'SONA', labels: ['Cost', 'Latency', 'Downtime'], values: [0, 1, 0] },
    { name: 'Traditional', labels: ['Cost', 'Latency', 'Downtime'], values: [50, 168, 24] },
  ], {
    x: 0.5, y: 3.8, w: 6, h: 3,
    showTitle: false,
    showValue: true,
    valueFontSize: 11,
    valueFontColor: C.text,
    catAxisLabelColor: C.textMuted,
    catAxisLabelFontSize: 12,
    valAxisHidden: true,
    chartColors: [C.accentGreen, C.accentRed],
    plotArea: { fill: { color: C.bgLight } },
    showLegend: true,
    legendPos: 'b',
    legendColor: C.textMuted,
  });

  // Right stats
  addStat(s, 7, 4.0, '300x', 'Faster Retrieval', C.accent);
  addStat(s, 9.2, 4.0, '+55%', 'Quality Gain', C.accentGreen);
  addStat(s, 11.2, 4.0, '$0', 'Learning Cost', C.accent2);

  addCard(s, 7, 5.2, 5.8, 1.6, 'Why It Matters', '• MicroLoRA (rank-2, ~45µs): instant reactions\n• BaseLoRA (rank-16, ~500µs): deep learning\n• EWC++ prevents catastrophic forgetting (45% less)\n• Zero cost, zero downtime, zero effort', C.accent2);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 8: AIMDS Security
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('AIMDS: Security via Chaos Theory', { x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: FONT.title, color: C.text });
  s.addText('3-layer pipeline. Lyapunov chaos detection. Mathematical certainty.', { x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  // 3-layer visual pipeline
  const layers = [
    { name: 'LAYER 1: DETECT', time: '0.06ms', items: ['50+ detection patterns', 'Aho-Corasick matching', 'Real-time stream processing'], color: C.accent },
    { name: 'LAYER 2: ANALYZE', time: '80ms', items: ['Lyapunov chaos detection', 'LTL policy verification', 'Behavioral divergence'], color: C.accent2 },
    { name: 'LAYER 3: RESPOND', time: '<50ms', items: ['7 adaptive strategies', '25-level strange-loop', 'Real-time mitigation'], color: C.accentRed },
  ];

  layers.forEach((l, i) => {
    const x = 0.5 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 3.9, h: 3.2, fill: { color: C.card }, rectRadius: 0.1, line: { color: l.color, width: 2 } });
    s.addText(l.name, { x, y: 1.7, w: 3.9, h: 0.5, fontSize: 16, fontFace: FONT.title, color: l.color, align: 'center', bold: true });
    s.addText(l.time, { x, y: 2.2, w: 3.9, h: 0.5, fontSize: 28, fontFace: FONT.title, color: l.color, align: 'center' });
    l.items.forEach((item, j) => {
      s.addText('• ' + item, { x: x + 0.3, y: 2.8 + j * 0.35, w: 3.3, h: 0.35, fontSize: 12, fontFace: FONT.body, color: C.textMuted });
    });
    if (i < 2) s.addText('→', { x: x + 3.9, y: 2.7, w: 0.3, h: 0.5, fontSize: 24, color: C.textDim, align: 'center' });
  });

  // Bottom stats
  addStat(s, 1, 5.3, '782KB', 'Binary Size', C.accent);
  addStat(s, 3.5, 5.3, '>12K/s', 'Requests/Sec', C.accentGreen);
  addStat(s, 6, 5.3, '<5%', 'False Positive', C.accent2);
  addStat(s, 8.5, 5.3, '0.06ms', 'Detection Time', C.accent3);

  addCard(s, 0.5, 6.2, 12.3, 0.9, 'Lyapunov Chaos Detection', 'Positive Lyapunov exponent = system diverging from expected behavior = adversarial. Same mathematics that predicts weather chaos. Detects novel attacks without pattern libraries.', C.accentRed);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 9: Ship It In 5 Lines
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('Ship It In 5 Lines', { x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: FONT.title, color: C.text });
  s.addText('Production multi-agent swarms. Self-learning. Self-healing.', { x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted });

  // Code block
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

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.6, w: 7.5, h: 5.2, fill: { color: '0D1117' }, rectRadius: 0.15, line: { color: C.border, width: 1 } });
  // Terminal header
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.6, w: 7.5, h: 0.4, fill: { color: '161B22' } });
  s.addShape(pptx.shapes.OVAL, { x: 0.8, y: 1.72, w: 0.15, h: 0.15, fill: { color: 'FF5F57' } });
  s.addShape(pptx.shapes.OVAL, { x: 1.05, y: 1.72, w: 0.15, h: 0.15, fill: { color: 'FEBC2E' } });
  s.addShape(pptx.shapes.OVAL, { x: 1.3, y: 1.72, w: 0.15, h: 0.15, fill: { color: '28C840' } });
  s.addText(code, { x: 0.8, y: 2.1, w: 7, h: 4.5, fontSize: 12, fontFace: FONT.mono, color: C.accent, lineSpacingMultiple: 1.4, valign: 'top' });

  // Right: what each line does
  addCard(s, 8.5, 1.6, 4.3, 1.3, 'One Command, Full Team', '8 specialized agents spawn instantly:\ncoordinator, coder, tester, reviewer,\ndeployer, researcher, security, architect', C.accent2);
  addCard(s, 8.5, 3.1, 4.3, 1.3, 'Persistent Memory', 'AgentDB stores every decision.\n9 RL algorithms learn from outcomes.\nAgents get smarter every session.', C.accentGreen);
  addCard(s, 8.5, 4.6, 4.3, 1.3, 'Self-Healing Security', 'AIMDS scans every input/output.\nLyapunov chaos detection for zero-days.\n782KB, >12K requests/sec.', C.accentRed);

  s.addText('Claude Code shipped sub-agents March 2026. Ruflo shipped this August 2025. 8 months earlier.', { x: 0.5, y: 7.0, w: 12, h: 0.3, fontSize: 11, fontFace: FONT.body, color: C.textDim, italic: true });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 10: CTA
// ═══════════════════════════════════════════════════════════════
{
  const s = addSlide();
  s.addText('RUVNET', { x: 0.8, y: 2.0, w: 12, h: 1.0, fontSize: 52, fontFace: FONT.title, color: C.text, align: 'center', bold: true });
  s.addText('Schedule a 30-Minute Architecture Review', { x: 0.8, y: 3.2, w: 12, h: 0.6, fontSize: 24, fontFace: FONT.body, color: C.accent, align: 'center' });

  // Stats row
  addStat(s, 1.5, 4.5, '148+', 'Capabilities', C.accent);
  addStat(s, 3.7, 4.5, '14', 'Modules', C.accent2);
  addStat(s, 5.9, 4.5, '80+', 'Rust Crates', C.accent3);
  addStat(s, 8.1, 4.5, '290+', 'SQL Functions', C.accentGreen);
  addStat(s, 10.3, 4.5, '434', 'KB Entries', C.accent);

  s.addText('Two standard deviations beyond state of the art. Open source. Free.', { x: 0.8, y: 6.0, w: 12, h: 0.4, fontSize: 14, fontFace: FONT.body, color: C.textMuted, align: 'center', italic: true });
  s.addText('ruvnet.com  |  hello@ruvnet.com  |  github.com/ruvnet', { x: 0.8, y: 6.6, w: 12, h: 0.4, fontSize: 13, fontFace: FONT.body, color: C.textDim, align: 'center' });
}

// ═══════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════
const outputPath = '/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/src/ui/public/assets/docs/CTO-Deck-RuvNet-2026-v2.pptx';
await pptx.writeFile({ fileName: outputPath });
console.log(`CTO Deck saved to: ${outputPath}`);
console.log(`Slides: ${pptx.slides.length}`);
