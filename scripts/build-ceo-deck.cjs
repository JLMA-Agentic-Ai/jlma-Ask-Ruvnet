const pptxgen = require("pptxgenjs");
const path = require("path");

// ─── Color Palette: Midnight Executive ─────────────────────
const C = {
  bg:        "0B0F1A",
  bgCard:    "141929",
  bgAlt:     "1A2035",
  accent:    "00D4AA",
  accentAlt: "6C63FF",
  warn:      "FF6B6B",
  gold:      "FFD93D",
  white:     "FFFFFF",
  muted:     "8899AA",
  mutedLight:"B0BEC5",
};

const IMG = {
  arch: path.resolve(__dirname, "../docs/presentations/images/01-architecture-overview.png"),
  sovereignty: path.resolve(__dirname, "../docs/presentations/images/02-data-sovereignty.png"),
  compound: path.resolve(__dirname, "../docs/presentations/images/03-compounding-advantage.png"),
  banner: path.resolve(__dirname, "../docs/presentations/images/ruflo-banner.jpeg"),
  agenticStack: path.resolve(__dirname, "../docs/presentations/images/video-thumb-The_Agentic_Stack-mid.jpg"),
  impossibleApps: path.resolve(__dirname, "../docs/presentations/images/video-thumb-Impossible_Apps_RuvNet-mid.jpg"),
};

// Shadow factory — NEVER reuse an object, always call fresh
const cardShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.2 });

// Accent strip at top of every slide
function accentStrip(slide, pres) {
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });
}

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "RuvNet";
  pres.title = "RuvNet CEO Deck 2026 — The Complete Agentic Intelligence Platform";

  let s;

  // ═══════════════════════════════════════════════════════════
  // SLIDE 1: TITLE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  // Background image
  s.addImage({ path: IMG.arch, x: 5.5, y: 0.8, w: 4.2, h: 3.2, transparency: 55 });

  s.addText("R  U  V  N  E  T", {
    x: 0.8, y: 0.8, w: 5, h: 0.5,
    fontSize: 20, fontFace: "Consolas", color: C.accent, bold: true,
    margin: 0
  });

  s.addText("Your AI Projects\nAre Failing.", {
    x: 0.8, y: 1.5, w: 5.5, h: 1.6,
    fontSize: 48, fontFace: "Georgia", color: C.white, bold: true,
    margin: 0
  });

  s.addText("87% of enterprise AI pilots never reach production.\nRuvNet is the infrastructure that fixes that.", {
    x: 0.8, y: 3.3, w: 7, h: 0.9,
    fontSize: 18, fontFace: "Calibri", color: C.muted,
    margin: 0
  });

  // Stats bar
  const titleStats = [
    { num: "500K+", label: "Downloads" },
    { num: "12K+", label: "GitHub Stars" },
    { num: "100K+", label: "Community" },
    { num: "80+", label: "Rust Crates" },
  ];
  titleStats.forEach((st, i) => {
    const sx = 0.8 + i * 2.2;
    s.addText(st.num, { x: sx, y: 4.4, w: 2, h: 0.4, fontSize: 22, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: sx, y: 4.78, w: 2, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("Open Source  |  MIT License  |  ruvnet.com", {
    x: 0.8, y: 5.15, w: 8, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 2: THE PROBLEM
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("The $2.4 Trillion Problem", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 32, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("AI spending is massive. But 87% of enterprise pilots never reach production.", {
    x: 0.8, y: 0.9, w: 8, h: 0.35, fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // 6 cards in 2x3 grid: what's missing
  const problems = [
    { title: "Orchestration", desc: "Who coordinates 50+ AI agents?", color: C.accent },
    { title: "Memory", desc: "How do agents remember yesterday?", color: "0EA5E9" },
    { title: "Vector Search", desc: "How find context in <100\u00B5s?", color: C.accentAlt },
    { title: "Security", desc: "Who stops prompt injection?", color: C.warn },
    { title: "Offline", desc: "How run AI without internet?", color: C.gold },
    { title: "Learning", desc: "How do agents improve over time?", color: "E879F9" },
  ];

  problems.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const px = 0.8 + col * 2.9;
    const py = 1.55 + row * 1.55;

    s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 2.7, h: 1.3, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 2.7, h: 0.05, fill: { color: p.color } });
    s.addText(p.title, { x: px + 0.15, y: py + 0.15, w: 2.4, h: 0.3, fontSize: 14, fontFace: "Calibri", color: p.color, bold: true, margin: 0 });
    s.addText(p.desc, { x: px + 0.15, y: py + 0.5, w: 2.4, h: 0.55, fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.75, w: 8.4, h: 0.55, fill: { color: C.bgAlt } });
  s.addText("No major provider ships all six. Most ship zero.", {
    x: 1.0, y: 4.75, w: 8, h: 0.55, fontSize: 14, fontFace: "Georgia", color: C.warn, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 3: COMPETITIVE LANDSCAPE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Competitive Landscape", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Every provider excels at the model layer. None provide the other 8.", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const tblHeaders = [
    { text: "Capability", options: { bold: true, color: C.accent, fontSize: 11, fontFace: "Calibri", fill: { color: C.bgAlt } } },
    { text: "OpenAI", options: { bold: true, color: C.mutedLight, fontSize: 11, fontFace: "Calibri", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Anthropic", options: { bold: true, color: C.mutedLight, fontSize: 11, fontFace: "Calibri", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Google", options: { bold: true, color: C.mutedLight, fontSize: 11, fontFace: "Calibri", fill: { color: C.bgAlt }, align: "center" } },
    { text: "RuvNet", options: { bold: true, color: C.accent, fontSize: 11, fontFace: "Calibri", fill: { color: "0D2920" }, align: "center" } },
  ];

  const compRow = (cap, o, a, g, r) => [
    { text: cap, options: { fontSize: 10.5, fontFace: "Calibri", color: C.mutedLight, fill: { color: C.bgCard } } },
    { text: o, options: { fontSize: 10.5, fontFace: "Calibri", color: o === "\u2713" ? "4ADE80" : C.warn, fill: { color: C.bgCard }, align: "center" } },
    { text: a, options: { fontSize: 10.5, fontFace: "Calibri", color: a === "\u2713" ? "4ADE80" : C.warn, fill: { color: C.bgCard }, align: "center" } },
    { text: g, options: { fontSize: 10.5, fontFace: "Calibri", color: g === "\u2713" ? "4ADE80" : C.warn, fill: { color: C.bgCard }, align: "center" } },
    { text: r, options: { fontSize: 10.5, fontFace: "Calibri", color: C.accent, fill: { color: "0D2920" }, align: "center", bold: true } },
  ];

  const compTable = [
    tblHeaders,
    compRow("LLM API",               "\u2713", "\u2713", "\u2713", "\u2713"),
    compRow("Multi-Agent Orchestration", "\u2717", "\u2717", "\u2717", "\u2713"),
    compRow("Persistent Memory",      "\u2717", "\u2717", "\u2717", "\u2713"),
    compRow("Vector Search (<100\u00B5s)", "\u2717", "\u2717", "\u2717", "\u2713"),
    compRow("Security Middleware",     "\u2717", "\u2717", "\u2717", "\u2713"),
    compRow("Offline / Air-Gapped",   "\u2717", "\u2717", "\u2717", "\u2713"),
    compRow("Self-Learning",          "\u2717", "\u2717", "\u2717", "\u2713"),
    compRow("Anti-Hallucination",     "\u2717", "\u2717", "\u2717", "\u2713"),
    compRow("WASM Runtime",           "\u2717", "\u2717", "\u2717", "\u2713"),
  ];

  s.addTable(compTable, {
    x: 0.8, y: 1.4, w: 8.4,
    colW: [2.8, 1.3, 1.3, 1.3, 1.7],
    border: { pt: 0.5, color: "2A3045" },
    rowH: [0.35, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32],
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 4: THE SOLUTION — 6 Modules
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("RuvNet: The Complete Agentic Stack", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Six integrated modules that turn AI models into production-grade autonomous systems.", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Background architecture image
  s.addImage({ path: IMG.arch, x: 1.5, y: 1.2, w: 7.0, h: 4.0, transparency: 75 });

  const modules = [
    { name: "Ruflo", role: "The Brain", desc: "150+ agent types, 5 topologies.\nOrchestrates autonomous fleets.", stat: "500K downloads", color: C.accent },
    { name: "RuVector", role: "The Search Engine", desc: "61\u00B5s HNSW search.\nNative PostgreSQL integration.", stat: "8,000x faster", color: "0EA5E9" },
    { name: "AgentDB", role: "The Memory", desc: "4 memory types across sessions.\nAgents remember everything.", stat: "12,500x retrieval", color: C.accentAlt },
    { name: "AIMDS", role: "The Immune System", desc: "0.06ms threat detection.\nChaos theory-based security.", stat: "12K+ req/sec", color: C.warn },
    { name: "RVF", role: "The Container", desc: "5.5KB WASM runtime.\nSingle file deployment.", stat: "9,000x smaller", color: C.gold },
    { name: "SONA", role: "The Teacher", desc: "<1ms learning at $0.\nZero forgetting.", stat: "$0 per cycle", color: "E879F9" },
  ];

  modules.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const mx = 0.8 + col * 2.9;
    const my = 1.45 + row * 1.85;

    s.addShape(pres.shapes.RECTANGLE, { x: mx, y: my, w: 2.7, h: 1.65, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: mx, y: my, w: 2.7, h: 0.05, fill: { color: m.color } });
    s.addText(m.name, { x: mx + 0.15, y: my + 0.12, w: 2.4, h: 0.28, fontSize: 14, fontFace: "Calibri", color: m.color, bold: true, margin: 0 });
    s.addText(m.role, { x: mx + 0.15, y: my + 0.38, w: 2.4, h: 0.22, fontSize: 11, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
    s.addText(m.desc, { x: mx + 0.15, y: my + 0.62, w: 2.4, h: 0.5, fontSize: 9.5, fontFace: "Calibri", color: C.muted, margin: 0 });
    s.addText(m.stat, { x: mx + 0.15, y: my + 1.25, w: 2.4, h: 0.25, fontSize: 10, fontFace: "Consolas", color: m.color, bold: true, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5: PI COLLECTIVE INTELLIGENCE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  // "NEW" label
  s.addShape(pres.shapes.RECTANGLE, { x: 8.0, y: 0.35, w: 1.2, h: 0.35, fill: { color: C.warn } });
  s.addText("NEW", { x: 8.0, y: 0.35, w: 1.2, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });

  s.addText("Pi: The Shared AI Brain", {
    x: 0.8, y: 0.35, w: 7, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Decentralized collective intelligence network at \u03C0.ruv.io", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Large feature card with purple/pink gradient feel
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.5, w: 8.4, h: 3.0, fill: { color: "1A1535" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.5, w: 8.4, h: 0.06, fill: { color: C.accentAlt } });

  const piPoints = [
    { title: "Like Wikipedia, but for AI memory", desc: "Vector embeddings instead of articles. Machines AND humans contribute." },
    { title: "AI agents contribute and access knowledge", desc: "Every agent interaction enriches the collective. Knowledge compounds across the network." },
    { title: "Cryptographic verification ensures quality", desc: "Witness chains prove provenance. Bad data cannot corrupt the knowledge graph." },
    { title: "Decentralized \u2014 no single point of failure", desc: "Distributed across nodes. No central server to attack, censor, or shut down." },
  ];

  piPoints.forEach((pp, i) => {
    const py = 1.7 + i * 0.65;
    s.addShape(pres.shapes.RECTANGLE, { x: 1.0, y: py, w: 0.06, h: 0.5, fill: { color: C.accentAlt } });
    s.addText(pp.title, { x: 1.3, y: py, w: 3.5, h: 0.25, fontSize: 13, fontFace: "Calibri", color: C.accentAlt, bold: true, margin: 0 });
    s.addText(pp.desc, { x: 1.3, y: py + 0.25, w: 7.5, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.mutedLight, margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.75, w: 8.4, h: 0.55, fill: { color: "0D2920" } });
  s.addText("The first collective intelligence network purpose-built for AI agents.", {
    x: 1.0, y: 4.75, w: 8, h: 0.55, fontSize: 14, fontFace: "Georgia", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 6: DATA SOVEREIGNTY
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Your Data Never Leaves Your Building", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.55, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  // Background image
  s.addImage({ path: IMG.sovereignty, x: 0, y: 0, w: 10, h: 5.625, transparency: 92 });

  // Standard AI card (left)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.15, w: 4.1, h: 2.6, fill: { color: "1A1520" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.15, w: 4.1, h: 0.05, fill: { color: C.warn } });
  s.addText("Standard AI", { x: 1.0, y: 1.3, w: 3.5, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.warn, bold: true, margin: 0 });

  s.addText([
    { text: "Your data \u2192 Internet \u2192 OpenAI servers \u2192 Response", options: { breakLine: true, fontSize: 11, color: C.muted } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "Trade secrets transmitted externally", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "Can't audit what happens to your data", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "Compliance teams block AI adoption", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "Result: project dies in legal review", options: { bullet: true, fontSize: 10.5, color: C.warn } },
  ], { x: 1.0, y: 1.7, w: 3.7, h: 1.8, fontFace: "Calibri", paraSpaceAfter: 4 });

  // RuvNet card (right)
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.15, w: 4.1, h: 2.6, fill: { color: "0D2920" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.15, w: 4.1, h: 0.05, fill: { color: C.accent } });
  s.addText("RuvNet", { x: 5.3, y: 1.3, w: 3.5, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.accent, bold: true, margin: 0 });

  s.addText([
    { text: "Your data \u2192 Your PostgreSQL \u2192 RuVector \u2192 Response", options: { breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "RuVector runs inside your infrastructure", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "AIMDS scans every input AND output", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "RVF containers run air-gapped", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Compliance approves day one", options: { bullet: true, fontSize: 10.5, color: C.accent } },
  ], { x: 5.3, y: 1.7, w: 3.7, h: 1.8, fontFace: "Calibri", paraSpaceAfter: 4 });

  // Bank example
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.0, w: 8.4, h: 1.2, fill: { color: C.bgAlt } });
  s.addText("EXAMPLE: Bank Loan Analysis", {
    x: 1.0, y: 4.05, w: 8, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.accent, bold: true, margin: 0
  });
  s.addText("With OpenAI: Upload millions of loan records to their servers. Compliance says no. Project dies.\nWith RuvNet: Deploy RuVector on your existing PostgreSQL. Add AIMDS middleware. AI analyzes everything locally. Zero data leaves the building. Compliance approves day one.", {
    x: 1.0, y: 4.4, w: 8, h: 0.7, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 7: WASM — Intelligence Everywhere
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Full AI on Your Phone.\nNo Cloud. No Backend.", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.75, fontSize: 26, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  // Size comparison bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.2, w: 8.4, h: 0.55, fill: { color: C.bgAlt } });
  const sizeComps = [
    { label: "Docker image", value: "50-500 MB", color: C.warn },
    { label: "Minimal container", value: "5-50 MB", color: C.gold },
    { label: "RVF WASM", value: "5.5 KB", color: C.accent },
  ];
  sizeComps.forEach((sc, i) => {
    const sx = 1.0 + i * 2.9;
    s.addText(sc.label + ": ", { x: sx, y: 1.2, w: 1.5, h: 0.55, fontSize: 11, fontFace: "Calibri", color: C.muted, valign: "middle", margin: 0 });
    s.addText(sc.value, { x: sx + 1.4, y: 1.2, w: 1.3, h: 0.55, fontSize: 13, fontFace: "Consolas", color: sc.color, bold: true, valign: "middle", margin: 0 });
  });

  // 6 use case cards
  const wasmCases = [
    { sector: "Healthcare", impact: "HIPAA trivially solved", detail: "Diagnostics on the device. Patient data never leaves the hospital.", color: C.accent },
    { sector: "Defense", impact: "Classified AI, zero network", detail: "Full AI capability in air-gapped environments. No internet required.", color: "0EA5E9" },
    { sector: "Field Workers", impact: "Full AI without internet", detail: "Complete AI on a laptop. Works in a mine shaft with zero signal.", color: C.accentAlt },
    { sector: "Retail", impact: "Real-time recommendations", detail: "POS systems run AI locally. No cloud round-trip. Instant response.", color: C.gold },
    { sector: "IoT / Edge", impact: "AI on every device", detail: "Sensors, cameras, devices \u2014 each one becomes an intelligent endpoint.", color: "E879F9" },
    { sector: "Developing World", impact: "Democratized AI", detail: "A clinic in rural Africa gets the same AI as Johns Hopkins.", color: C.warn },
  ];

  wasmCases.forEach((wc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const wx = 0.8 + col * 2.9;
    const wy = 2.0 + row * 1.55;

    s.addShape(pres.shapes.RECTANGLE, { x: wx, y: wy, w: 2.7, h: 1.35, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: wx, y: wy, w: 2.7, h: 0.05, fill: { color: wc.color } });
    s.addText(wc.sector, { x: wx + 0.12, y: wy + 0.12, w: 2.4, h: 0.25, fontSize: 13, fontFace: "Calibri", color: wc.color, bold: true, margin: 0 });
    s.addText(wc.impact, { x: wx + 0.12, y: wy + 0.38, w: 2.4, h: 0.22, fontSize: 10, fontFace: "Calibri", color: C.gold, bold: true, margin: 0 });
    s.addText(wc.detail, { x: wx + 0.12, y: wy + 0.65, w: 2.4, h: 0.55, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("This is not a feature. This is a paradigm shift.", {
    x: 0.8, y: 5.15, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Georgia", color: C.accent, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 8: PROOF — Community
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("PROOF", { x: 0.8, y: 0.3, w: 2, h: 0.25, fontSize: 12, fontFace: "Calibri", color: C.accent, charSpacing: 4, bold: true, margin: 0 });
  s.addText("Real Teams. Real Results.", {
    x: 0.8, y: 0.55, w: 8, h: 0.55, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  const cases = [
    { name: "Fox Flow", org: "Community Builder", result: "12.8M QPS", context: "4,000x faster than Redis", detail: "Built a database on RuVector that processes 12.8 million queries per second.", color: C.accent },
    { name: "QE Fleet", org: "Quality Engineering", result: "51 agents", context: "Across 12 domains", detail: "Deployed 51 AI agents across 12 business domains. Zero manual coordination.", color: "0EA5E9" },
    { name: "Bill Sentry", org: "Healthcare", result: "30 years expertise", context: "Medical billing automation", detail: "Automated medical billing fraud detection. Real clinical use, real savings.", color: C.accentAlt },
    { name: "Finland Gov", org: "Government", result: "National scale", context: "AI-native transformation", detail: "First country-scale agentic deployment for AI-native public services.", color: C.gold },
  ];

  cases.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.8 + col * 4.4;
    const cy = 1.3 + row * 1.85;

    s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: 4.1, h: 1.6, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: 0.06, h: 1.6, fill: { color: c.color } });
    s.addText(c.name, { x: cx + 0.2, y: cy + 0.08, w: 2, h: 0.28, fontSize: 14, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
    s.addText(c.org, { x: cx + 2.2, y: cy + 0.08, w: 1.7, h: 0.28, fontSize: 10, fontFace: "Calibri", color: C.muted, align: "right", margin: 0 });
    s.addText(c.result, { x: cx + 0.2, y: cy + 0.4, w: 3.5, h: 0.35, fontSize: 20, fontFace: "Consolas", color: c.color, bold: true, margin: 0 });
    s.addText(c.context, { x: cx + 0.2, y: cy + 0.78, w: 3.5, h: 0.22, fontSize: 11, fontFace: "Calibri", color: C.gold, margin: 0 });
    s.addText(c.detail, { x: cx + 0.2, y: cy + 1.05, w: 3.7, h: 0.4, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Stats bar
  const communityStats = [
    { num: "500K+", label: "Downloads" },
    { num: "12K+", label: "Stars" },
    { num: "100K+", label: "Community" },
  ];
  communityStats.forEach((cs, i) => {
    const csx = 0.8 + i * 3.0;
    s.addShape(pres.shapes.RECTANGLE, { x: csx, y: 5.05, w: 2.7, h: 0.45, fill: { color: C.bgAlt } });
    s.addText(cs.num, { x: csx + 0.1, y: 5.05, w: 1.2, h: 0.45, fontSize: 16, fontFace: "Consolas", color: C.accent, bold: true, valign: "middle", margin: 0 });
    s.addText(cs.label, { x: csx + 1.3, y: 5.05, w: 1.3, h: 0.45, fontSize: 11, fontFace: "Calibri", color: C.muted, valign: "middle", margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 9: PERFORMANCE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Performance That Speaks For Itself", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Measured results. Not theoretical. Not marketing projections.", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const benchHeaders = [
    { text: "Capability", options: { bold: true, color: C.accent, fontSize: 10.5, fontFace: "Calibri", fill: { color: C.bgAlt } } },
    { text: "RuvNet", options: { bold: true, color: C.accent, fontSize: 10.5, fontFace: "Calibri", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Industry Baseline", options: { bold: true, color: C.muted, fontSize: 10.5, fontFace: "Calibri", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Advantage", options: { bold: true, color: C.gold, fontSize: 10.5, fontFace: "Calibri", fill: { color: C.bgAlt }, align: "center" } },
  ];

  const benchRow = (cap, ruv, baseline, adv) => [
    { text: cap, options: { fontSize: 10.5, fontFace: "Calibri", color: C.mutedLight, fill: { color: C.bgCard } } },
    { text: ruv, options: { fontSize: 10.5, fontFace: "Consolas", color: C.accent, fill: { color: C.bgCard }, align: "center", bold: true } },
    { text: baseline, options: { fontSize: 10.5, fontFace: "Calibri", color: C.muted, fill: { color: C.bgCard }, align: "center" } },
    { text: adv, options: { fontSize: 10.5, fontFace: "Consolas", color: C.gold, fill: { color: C.bgCard }, align: "center", bold: true } },
  ];

  s.addTable([
    benchHeaders,
    benchRow("SWE-Bench Score",      "84.8%",         "GPT-4o: 33.2%",      "2.5x"),
    benchRow("HNSW Vector Search",   "61\u00B5s",     "500ms+ (Pinecone)",   "8,000x"),
    benchRow("Flash Attention",      "2.49-7.47x",    "Standard attention",  "Up to 7.47x"),
    benchRow("Stream Processing",    "12.8M QPS",     "Redis: 3K QPS",       "4,000x"),
    benchRow("Threat Detection",     "0.06ms",        "Rule-based: 10-50ms", "166-833x"),
    benchRow("Real-Time Learning",   "<1ms, $0",      "Days, $100K",         "Instant"),
    benchRow("WASM Runtime",         "5.5KB",         "100MB+ containers",   "9,000x smaller"),
  ], {
    x: 0.8, y: 1.4, w: 8.4,
    colW: [2.4, 2, 2.2, 1.8],
    border: { pt: 0.5, color: "2A3045" },
    rowH: [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.35, w: 8.4, h: 0.45, fill: { color: "0D2920" } });
  s.addText("Every number above is from actual benchmarks.", {
    x: 1.0, y: 4.35, w: 8, h: 0.45, fontSize: 13, fontFace: "Georgia", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 10: BUILT THE FUTURE EARLY
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("We Built the Future\n8 Months Early", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.85, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("In March 2026, Anthropic launched sub-agents for Claude Code. Ruflo shipped multi-agent orchestration in August 2025.", {
    x: 0.8, y: 1.2, w: 8.4, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Timeline visual
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.8, w: 8.4, h: 1.2, fill: { color: C.bgCard }, shadow: cardShadow() });

  // Timeline line
  s.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 2.35, w: 7.0, h: 0.04, fill: { color: C.muted } });

  // Aug 2025 marker
  s.addShape(pres.shapes.RECTANGLE, { x: 2.0, y: 2.0, w: 0.12, h: 0.7, fill: { color: C.accent } });
  s.addText("AUG 2025", { x: 2.3, y: 1.95, w: 2, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText("Ruflo ships multi-agent\norchestration", { x: 2.3, y: 2.2, w: 2.5, h: 0.4, fontSize: 10.5, fontFace: "Calibri", color: C.mutedLight, margin: 0 });

  // Arrow label
  s.addText("8 months ahead", { x: 4.5, y: 2.0, w: 1.8, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.gold, bold: true, align: "center", margin: 0 });

  // Mar 2026 marker
  s.addShape(pres.shapes.RECTANGLE, { x: 6.5, y: 2.0, w: 0.12, h: 0.7, fill: { color: C.muted } });
  s.addText("MAR 2026", { x: 6.8, y: 1.95, w: 2, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.muted, bold: true, margin: 0 });
  s.addText("Claude Code ships\nsub-agents", { x: 6.8, y: 2.2, w: 2.5, h: 0.4, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0 });

  // Quote
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.2, w: 8.4, h: 0.55, fill: { color: "0D2920" } });
  s.addText("RuvNet doesn't follow the industry. The industry follows RuvNet.", {
    x: 1.0, y: 3.2, w: 8, h: 0.55, fontSize: 14, fontFace: "Georgia", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0
  });

  // Proof points
  const futureProof = [
    { name: "RuVector", desc: "In-process vector search", industry: "Industry still uses external vector DBs", color: C.accent },
    { name: "AIMDS", desc: "Chaos theory security", industry: "Industry still uses rule-based WAFs", color: "0EA5E9" },
    { name: "RVF", desc: "5.5KB cognitive containers", industry: "Industry still uses Docker (50-500MB)", color: C.accentAlt },
    { name: "SONA", desc: "Self-optimizing neural arch", industry: "Industry uses static models", color: C.gold },
  ];

  futureProof.forEach((fp, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fpx = 0.8 + col * 4.4;
    const fpy = 3.95 + row * 0.75;

    s.addShape(pres.shapes.RECTANGLE, { x: fpx, y: fpy, w: 4.1, h: 0.6, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: fpx, y: fpy, w: 0.06, h: 0.6, fill: { color: fp.color } });
    s.addText(fp.name, { x: fpx + 0.2, y: fpy + 0.03, w: 1.2, h: 0.25, fontSize: 11, fontFace: "Calibri", color: fp.color, bold: true, margin: 0 });
    s.addText(fp.desc, { x: fpx + 1.4, y: fpy + 0.03, w: 2.5, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.mutedLight, margin: 0 });
    s.addText(fp.industry, { x: fpx + 0.2, y: fpy + 0.3, w: 3.7, h: 0.25, fontSize: 9.5, fontFace: "Calibri", color: C.muted, italic: true, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 11: ROI
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("The ROI Isn't Incremental.\nIt's Transformational.", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.85, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  const roiCards = [
    { title: "Global Learning", before: "$30M/mo", after: "$1.7M/mo", reduction: "95% reduction", color: C.accent },
    { title: "Episodic Memory", before: "Full storage", after: "4% storage", reduction: "96% reduction", color: "0EA5E9" },
    { title: "Token Cost", before: "Full tokens", after: "25-50% tokens", reduction: "50-75% reduction", color: C.accentAlt },
    { title: "KV Cache", before: "Full memory", after: "6-12% memory", reduction: "8-16x reduction", color: C.gold },
  ];

  roiCards.forEach((roi, i) => {
    const rx = 0.8 + i * 2.25;

    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.4, w: 2.05, h: 3.2, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.4, w: 2.05, h: 0.05, fill: { color: roi.color } });

    s.addText(roi.title, { x: rx + 0.1, y: 1.55, w: 1.85, h: 0.3, fontSize: 12, fontFace: "Calibri", color: roi.color, bold: true, align: "center", margin: 0 });

    // Before
    s.addText("BEFORE", { x: rx + 0.1, y: 2.0, w: 1.85, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.muted, align: "center", margin: 0 });
    s.addText(roi.before, { x: rx + 0.1, y: 2.2, w: 1.85, h: 0.35, fontSize: 16, fontFace: "Consolas", color: C.warn, bold: true, align: "center", margin: 0 });

    // Arrow
    s.addText("\u2193", { x: rx + 0.1, y: 2.65, w: 1.85, h: 0.3, fontSize: 20, fontFace: "Calibri", color: C.muted, align: "center", margin: 0 });

    // After
    s.addText("AFTER", { x: rx + 0.1, y: 3.0, w: 1.85, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.muted, align: "center", margin: 0 });
    s.addText(roi.after, { x: rx + 0.1, y: 3.2, w: 1.85, h: 0.35, fontSize: 16, fontFace: "Consolas", color: C.accent, bold: true, align: "center", margin: 0 });

    // Reduction
    s.addShape(pres.shapes.RECTANGLE, { x: rx + 0.1, y: 3.75, w: 1.85, h: 0.35, fill: { color: "0D2920" } });
    s.addText(roi.reduction, { x: rx + 0.1, y: 3.75, w: 1.85, h: 0.35, fontSize: 11, fontFace: "Consolas", color: roi.color, bold: true, align: "center", valign: "middle", margin: 0 });
  });

  s.addText("Cost savings from real deployments, not projections.", {
    x: 0.8, y: 4.85, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.muted, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 12: BEFORE & AFTER
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Support Ticket Resolution", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.55, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  // Before column
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.15, w: 4.1, h: 3.4, fill: { color: "1A1520" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.15, w: 4.1, h: 0.45, fill: { color: "2A1520" } });
  s.addText("BEFORE \u2014 45 min average", { x: 1.0, y: 1.15, w: 3.7, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.warn, bold: true, valign: "middle", margin: 0 });

  const beforeItems = [
    "Manual ticket routing (5-10 min)",
    "Agent manually searches KB (10 min)",
    "No memory of similar past tickets",
    "No learning from resolutions",
    "Escalation requires re-explaining",
    "No security scanning of inputs",
    "Cloud-dependent \u2014 outage = no support",
  ];
  s.addText(
    beforeItems.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < beforeItems.length - 1, fontSize: 10.5, color: C.muted } })),
    { x: 1.0, y: 1.75, w: 3.7, h: 2.6, fontFace: "Calibri", paraSpaceAfter: 5 }
  );

  // After column
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.15, w: 4.1, h: 3.4, fill: { color: "0D2920" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.15, w: 4.1, h: 0.45, fill: { color: "0D3930" } });
  s.addText("AFTER \u2014 3 min average", { x: 5.3, y: 1.15, w: 3.7, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.accent, bold: true, valign: "middle", margin: 0 });

  const afterItems = [
    "AIMDS scans input for threats (0.06ms)",
    "Ruflo routes to specialist agent (instant)",
    "RuVector finds relevant context (61\u00B5s)",
    "AgentDB recalls all prior interactions",
    "SONA learns from this resolution ($0)",
    "Full audit trail via witness chain",
    "Works offline via RVF container",
  ];
  s.addText(
    afterItems.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < afterItems.length - 1, fontSize: 10.5, color: C.mutedLight } })),
    { x: 5.3, y: 1.75, w: 3.7, h: 2.6, fontFace: "Calibri", paraSpaceAfter: 5 }
  );

  // Result bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.75, w: 8.4, h: 0.5, fill: { color: C.bgAlt } });
  s.addText("15x faster  |  Self-improving  |  Air-gapped capable  |  Full audit trail", {
    x: 1.0, y: 4.75, w: 8, h: 0.5, fontSize: 13, fontFace: "Calibri", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 13: COMPOUND ADVANTAGE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("The Compound Advantage", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Organizations deploying now accumulate advantages that cannot be replicated.", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Background image
  s.addImage({ path: IMG.compound, x: 0, y: 0, w: 10, h: 5.625, transparency: 93 });

  const advantages = [
    { title: "Proprietary Training Data", desc: "Every interaction generates training data unique to your organization. SONA converts this into LoRA adapters automatically. Your AI gets smarter from your data.", color: C.accent },
    { title: "Institutional AI Memory", desc: "Episodic + semantic + procedural memory builds organizational knowledge that no competitor can copy or purchase. Your AI knows your company.", color: "0EA5E9" },
    { title: "Domain-Specific Adapters", desc: "LoRA adapters fine-tuned on your data. Each adaptation makes the system more valuable and more differentiated from off-the-shelf AI.", color: C.accentAlt },
    { title: "Security Threat Intelligence", desc: "AIMDS learns from every attack attempt. Your security posture improves continuously \u2014 attackers train your defense against themselves.", color: C.gold },
  ];

  advantages.forEach((a, i) => {
    const ay = 1.45 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ay, w: 8.4, h: 0.72, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ay, w: 0.06, h: 0.72, fill: { color: a.color } });
    s.addText(a.title, { x: 1.1, y: ay + 0.04, w: 3, h: 0.26, fontSize: 13, fontFace: "Calibri", color: a.color, bold: true, margin: 0 });
    s.addText(a.desc, { x: 1.1, y: ay + 0.3, w: 7.8, h: 0.38, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.95, w: 8.4, h: 0.45, fill: { color: "2A1520" } });
  s.addText("This advantage compounds at the speed of AI.", {
    x: 1.0, y: 4.95, w: 8, h: 0.45, fontSize: 13, fontFace: "Georgia", color: C.warn, bold: true, valign: "middle", align: "center", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 14: INDUSTRY APPLICATIONS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Industry Applications", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  const industries = [
    {
      name: "Financial Services", items: [
        "Algorithmic trading (53.8% accuracy, 87% walk-forward)",
        "Real-time compliance monitoring",
        "Fraud detection via chaos theory (AIMDS)",
      ], color: C.accent
    },
    {
      name: "Healthcare", items: [
        "rvDNA genomic diagnostics on any device",
        "Medical billing automation (Bill Sentry)",
        "HIPAA compliance trivial via WASM air-gap",
      ], color: "0EA5E9"
    },
    {
      name: "Defense & Government", items: [
        "Classified AI that never touches a network",
        "Cryptographic witness chains for audit",
        "National-scale AI transformation (Finland)",
      ], color: C.accentAlt
    },
    {
      name: "Enterprise", items: [
        "COBOL-to-Rust migration in one afternoon",
        "Multi-tenant RVCOW: 200x cost savings",
        "Self-improving support and operations",
      ], color: C.gold
    },
  ];

  industries.forEach((ind, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ix = 0.8 + col * 4.4;
    const iy = 1.1 + row * 2.1;

    s.addShape(pres.shapes.RECTANGLE, { x: ix, y: iy, w: 4.1, h: 1.85, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: ix, y: iy, w: 4.1, h: 0.05, fill: { color: ind.color } });
    s.addText(ind.name, { x: ix + 0.15, y: iy + 0.12, w: 3.8, h: 0.3, fontSize: 15, fontFace: "Calibri", color: ind.color, bold: true, margin: 0 });
    s.addText(
      ind.items.map((item, j) => ({ text: item, options: { bullet: true, breakLine: j < ind.items.length - 1, fontSize: 10.5, color: C.muted } })),
      { x: ix + 0.15, y: iy + 0.5, w: 3.8, h: 1.2, fontFace: "Calibri", paraSpaceAfter: 4 }
    );
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 15: THIS IS FREE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("This Is Free \u2014 And That Should\nTerrify Your Competitors", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.85, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("RuvNet is open source. MIT license. Zero licensing cost. The entire 148-capability stack.", {
    x: 0.8, y: 1.2, w: 8.4, h: 0.35, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Big stats
  const freeStats = [
    { num: "MIT", label: "License", color: C.accent },
    { num: "$0", label: "Licensing Cost", color: C.accent },
    { num: "148", label: "Capabilities", color: C.accent },
    { num: "80+", label: "Rust Crates", color: C.accent },
  ];

  freeStats.forEach((fs, i) => {
    const fx = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 1.75, w: 2.05, h: 1.5, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 1.75, w: 2.05, h: 0.05, fill: { color: fs.color } });
    s.addText(fs.num, {
      x: fx + 0.1, y: 1.95, w: 1.85, h: 0.7,
      fontSize: 36, fontFace: "Consolas", color: fs.color, bold: true, align: "center", valign: "middle", margin: 0
    });
    s.addText(fs.label, {
      x: fx + 0.1, y: 2.7, w: 1.85, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.mutedLight, align: "center", margin: 0
    });
  });

  // Why free matters
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.5, w: 8.4, h: 0.7, fill: { color: "0D2920" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.5, w: 0.06, h: 0.7, fill: { color: C.accent } });
  s.addText("Every dollar your competitor spends on licensing, you invest in capability. The gap compounds daily.", {
    x: 1.1, y: 3.5, w: 7.8, h: 0.7, fontSize: 14, fontFace: "Georgia", color: C.mutedLight, valign: "middle", margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.45, w: 8.4, h: 0.6, fill: { color: C.bgAlt } });
  s.addText("This isn't a trial or freemium trap. This is the full production stack. Open source forever.", {
    x: 1.0, y: 4.45, w: 8, h: 0.6, fontSize: 14, fontFace: "Georgia", color: C.accent, italic: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 16: TIMELINE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("The Window Is Open", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 32, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("RuvNet has a 12-18 month head start. The gap is closing \u2014 but not yet.", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const timeline = [
    { when: "NOW", who: "RuvNet", what: "Full 148-capability stack shipping today", color: C.accent, barW: 8.4 },
    { when: "Q3 2026", who: "Anthropic", what: "Basic orchestration (sub-agents \u2014 8 months after Ruflo)", color: C.muted, barW: 5.5 },
    { when: "Q4 2026", who: "OpenAI", what: "Agent framework (limited capabilities)", color: C.muted, barW: 4.0 },
    { when: "2027+", who: "Google / AWS", what: "Partial stack (no WASM, no air-gap, no self-learning)", color: C.muted, barW: 2.5 },
  ];

  timeline.forEach((t, i) => {
    const ty = 1.5 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ty, w: t.barW, h: 0.65, fill: { color: i === 0 ? "0D2920" : C.bgCard } });
    if (i === 0) s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ty, w: 0.06, h: 0.65, fill: { color: C.accent } });
    s.addText(t.when, { x: 1.0, y: ty, w: 1.2, h: 0.65, fontSize: 12, fontFace: "Consolas", color: t.color, bold: true, valign: "middle", margin: 0 });
    s.addText(t.who, { x: 2.3, y: ty, w: 1.8, h: 0.65, fontSize: 12, fontFace: "Calibri", color: C.white, valign: "middle", margin: 0 });
    s.addText(t.what, { x: 4.2, y: ty, w: 4.8, h: 0.65, fontSize: 11, fontFace: "Calibri", color: C.muted, valign: "middle", margin: 0 });
  });

  // Bottom note
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.95, w: 8.4, h: 0.5, fill: { color: "2A1520" } });
  s.addText("12-18 month head start. The gap is closing \u2014 but not yet.", {
    x: 1.0, y: 4.95, w: 8, h: 0.5, fontSize: 14, fontFace: "Georgia", color: C.warn, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 17: DEPLOYMENT OPTIONS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Deploy Anywhere", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Every deployment model. SOC 2, HIPAA, GDPR, ITAR compliant.", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const deployOpts = [
    { name: "Cloud", label: "K8s", desc: "Kubernetes-native with\nauto-scaling. Managed\ninfrastructure.", color: C.accent },
    { name: "On-Premise", label: "HW", desc: "Bare metal deployment.\nFull data sovereignty.\nYour control.", color: "0EA5E9" },
    { name: "Hybrid", label: "Mix", desc: "Cloud orchestration\nwith on-premise data.\nBest of both.", color: C.accentAlt },
    { name: "Air-Gapped", label: "RVF", desc: "Self-booting cognitive\ncontainers. Zero network.\nWorks in a bunker.", color: C.gold },
  ];

  deployOpts.forEach((d, i) => {
    const dx = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: dx, y: 1.45, w: 2.05, h: 2.3, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: dx, y: 1.45, w: 2.05, h: 0.05, fill: { color: d.color } });
    s.addText(d.label, { x: dx + 0.12, y: 1.6, w: 1.8, h: 0.5, fontSize: 26, fontFace: "Consolas", color: d.color, bold: true, margin: 0 });
    s.addText(d.name, { x: dx + 0.12, y: 2.1, w: 1.8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
    s.addText(d.desc, { x: dx + 0.12, y: 2.5, w: 1.8, h: 0.9, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Browser bonus
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.0, w: 8.4, h: 0.7, fill: { color: "0D2920" } });
  s.addText("BONUS: Browser-Only via WASM", { x: 1.0, y: 4.05, w: 3.5, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.accent, bold: true, margin: 0 });
  s.addText("No server. No installation. Just open a web page. The 5.5KB WASM runtime runs the full vector search engine in a browser tab.", {
    x: 1.0, y: 4.35, w: 7.8, h: 0.3, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Compliance
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.9, w: 8.4, h: 0.45, fill: { color: C.bgAlt } });
  s.addText("SOC 2  |  HIPAA  |  GDPR  |  ITAR compliant", {
    x: 1.0, y: 4.9, w: 8, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 18: PARTNERSHIP TIERS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("Partnership Tiers", {
    x: 0.8, y: 0.35, w: 8, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  const tiers = [
    {
      name: "Pilot",
      duration: "30 Days",
      scope: "Single Department",
      features: [
        "Full stack deployment",
        "Architecture review",
        "Dedicated engineer",
        "Success metrics defined",
        "No commitment required",
      ],
      color: C.accent,
    },
    {
      name: "Enterprise",
      duration: "Annual",
      scope: "Organization-Wide",
      features: [
        "Multi-department rollout",
        "Custom agent development",
        "Priority support SLA",
        "Quarterly architecture reviews",
        "Training and enablement",
      ],
      color: C.accentAlt,
    },
    {
      name: "Strategic",
      duration: "Multi-Year",
      scope: "Custom Partnership",
      features: [
        "Joint roadmap development",
        "Custom module development",
        "Embedded engineering team",
        "White-label options",
        "Revenue share models",
      ],
      color: C.gold,
    },
  ];

  tiers.forEach((tier, i) => {
    const tx = 0.8 + i * 3.0;
    const tw = 2.8;

    s.addShape(pres.shapes.RECTANGLE, { x: tx, y: 1.1, w: tw, h: 4.1, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: tx, y: 1.1, w: tw, h: 0.05, fill: { color: tier.color } });

    s.addText(tier.name, { x: tx + 0.15, y: 1.25, w: tw - 0.3, h: 0.35, fontSize: 18, fontFace: "Georgia", color: tier.color, bold: true, margin: 0 });
    s.addText(tier.duration, { x: tx + 0.15, y: 1.65, w: tw - 0.3, h: 0.25, fontSize: 13, fontFace: "Consolas", color: C.white, bold: true, margin: 0 });
    s.addText(tier.scope, { x: tx + 0.15, y: 1.9, w: tw - 0.3, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0 });

    // Divider
    s.addShape(pres.shapes.RECTANGLE, { x: tx + 0.15, y: 2.25, w: tw - 0.3, h: 0.02, fill: { color: "2A3045" } });

    s.addText(
      tier.features.map((f, j) => ({ text: f, options: { bullet: true, breakLine: j < tier.features.length - 1, fontSize: 10.5, color: C.mutedLight } })),
      { x: tx + 0.15, y: 2.4, w: tw - 0.3, h: 2.5, fontFace: "Calibri", paraSpaceAfter: 6 }
    );
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 19: THE ASK
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  accentStrip(s, pres);

  s.addText("R  U  V  N  E  T", {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5, fontSize: 18, fontFace: "Consolas", color: C.accent, bold: true, margin: 0
  });

  s.addText("Schedule a 30-Minute\nArchitecture Review", {
    x: 0.8, y: 1.5, w: 8.4, h: 1.3, fontSize: 42, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("See how the 148-capability agentic stack maps to your specific use case.", {
    x: 0.8, y: 3.0, w: 7, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Stats
  const askStats = [
    { num: "148+", label: "Capabilities" },
    { num: "80+", label: "Rust Crates" },
    { num: "500K+", label: "Downloads" },
    { num: "MIT", label: "License" },
  ];
  askStats.forEach((as, i) => {
    const asx = 0.8 + i * 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x: asx, y: 3.65, w: 2.0, h: 0.85, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addText(as.num, { x: asx + 0.1, y: 3.7, w: 1.8, h: 0.45, fontSize: 22, fontFace: "Consolas", color: C.accent, bold: true, align: "center", margin: 0 });
    s.addText(as.label, { x: asx + 0.1, y: 4.15, w: 1.8, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.muted, align: "center", margin: 0 });
  });

  s.addText("Two standard deviations beyond state of the art. Open source. Free.", {
    x: 0.8, y: 4.75, w: 8.4, h: 0.35, fontSize: 14, fontFace: "Georgia", color: C.accent, italic: true, margin: 0
  });

  s.addText("ruvnet.com", {
    x: 0.8, y: 5.15, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════
  const outPath = path.resolve(__dirname, "../docs/presentations/CEO-Deck-RuvNet-2026.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("CEO deck written to:", outPath);
  console.log("Total slides:", pres.slides.length);
}

build().catch(err => { console.error("Build failed:", err); process.exit(1); });
