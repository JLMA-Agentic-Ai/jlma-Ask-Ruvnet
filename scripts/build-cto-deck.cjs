const pptxgen = require("pptxgenjs");
const path = require("path");

// ─── Color Palette (Ocean/Tech) ────────────────────────────
const C = {
  bg:        "0F172A",   // slate-900
  bgCard:    "1E293B",   // slate-800
  bgAlt:     "1A2744",   // slightly blue
  accent:    "06B6D4",   // cyan-500
  accentAlt: "8B5CF6",   // violet
  sky:       "0EA5E9",   // sky-500
  warn:      "F59E0B",   // amber
  red:       "EF4444",   // red
  green:     "10B981",   // emerald
  white:     "F8FAFC",   // slate-50
  muted:     "94A3B8",   // slate-400
  mutedLight:"CBD5E1",   // slate-300
};

const IMG = {
  arch: path.resolve(__dirname, "../docs/presentations/images/01-architecture-overview.png"),
  sovereignty: path.resolve(__dirname, "../docs/presentations/images/02-data-sovereignty.png"),
  compound: path.resolve(__dirname, "../docs/presentations/images/03-compounding-advantage.png"),
  codeTerminal: path.resolve(__dirname, "../docs/presentations/images/04-code-terminal.png"),
  banner: path.resolve(__dirname, "../docs/presentations/images/ruflo-banner.jpeg"),
  howItWorks: path.resolve(__dirname, "../docs/presentations/images/video-thumb-How_Ruflo_Actually_Works-mid.jpg"),
  impossibleApps: path.resolve(__dirname, "../docs/presentations/images/video-thumb-Impossible_Apps_RuvNet-mid.jpg"),
};

const shadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.25 });

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "RuvNet";
  pres.title = "RuvNet CTO Architecture Deep Dive";

  // ═══════════════════════════════════════════════════════════
  // SLIDE 1: TITLE
  // ═══════════════════════════════════════════════════════════
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addImage({ path: IMG.arch, x: 6.5, y: 0.8, w: 3.3, h: 2.5, transparency: 55 });

  s.addText("RUVNET", {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5, fontSize: 16, fontFace: "Consolas", color: C.accent, charSpacing: 6, margin: 0
  });
  s.addText("Technical Architecture\nDeep Dive", {
    x: 0.8, y: 1.5, w: 5.5, h: 1.4, fontSize: 44, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("148 capabilities across 14 modules. Production-grade agentic infrastructure.", {
    x: 0.8, y: 3.0, w: 5.5, h: 0.5, fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const titleStats = [
    { num: "80+", label: "Rust Crates" },
    { num: "290+", label: "SQL Functions" },
    { num: "39", label: "Attention Mechanisms" },
    { num: "265K", label: "Lines of Code" },
  ];
  titleStats.forEach((st, i) => {
    const sx = 0.8 + i * 2.2;
    s.addText(st.num, { x: sx, y: 4.2, w: 2, h: 0.45, fontSize: 24, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: sx, y: 4.6, w: 2, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("MIT License  |  ruvnet.com", {
    x: 0.8, y: 5.15, w: 8, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 2: THE ARCHITECTURE GAP
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("What Providers Actually Ship", {
    x: 0.8, y: 0.35, w: 8, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("They ship the inference endpoint. You build the other 11 layers.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const gapHeaders = [
    { text: "Capability", options: { bold: true, color: C.accent, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt } } },
    { text: "OpenAI", options: { bold: true, color: C.muted, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Anthropic", options: { bold: true, color: C.muted, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Google", options: { bold: true, color: C.muted, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
    { text: "AWS", options: { bold: true, color: C.muted, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
    { text: "RuvNet", options: { bold: true, color: C.accent, fontSize: 10, fontFace: "Consolas", fill: { color: "0D2A2E" }, align: "center" } },
  ];

  const gapRow = (cap, o, a, g, aws, r) => {
    const makeCell = (val) => ({
      text: val,
      options: { fontSize: 10, fontFace: "Calibri", color: val === "\u2713" ? C.green : (val === "\u2717" ? C.red : C.muted), fill: { color: C.bgCard }, align: "center" }
    });
    return [
      { text: cap, options: { fontSize: 10, fontFace: "Calibri", color: C.mutedLight, fill: { color: C.bgCard } } },
      makeCell(o), makeCell(a), makeCell(g), makeCell(aws),
      { text: r, options: { fontSize: 10, fontFace: "Calibri", color: C.green, fill: { color: "0D2A2E" }, align: "center", bold: true } },
    ];
  };

  s.addTable([
    gapHeaders,
    gapRow("LLM API", "\u2713", "\u2713", "\u2713", "\u2713", "\u2713"),
    gapRow("Multi-Agent (150+ types)", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("Persistent Memory (4 types)", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("Vector Search (<100\u00B5s)", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("Security Middleware", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("Offline / Air-Gapped", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("Self-Learning (<1ms)", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("WASM Runtime (7.2KB)", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("Anti-Hallucination (formal)", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("Graph Analytics (GNN)", "\u2717", "\u2717", "\u2717", "\u2717", "\u2713"),
    gapRow("MCP Protocol (96 tools)", "\u2717", "\u25CB", "\u2717", "\u2717", "\u2713"),
    gapRow("Data Sovereignty", "\u2717", "\u2717", "\u2717", "\u25CB", "\u2713"),
  ], {
    x: 0.8, y: 1.3, w: 8.4,
    colW: [2.5, 1.1, 1.1, 1.1, 1.0, 1.6],
    border: { pt: 0.5, color: "2A3550" },
    rowH: [0.3, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27],
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 3: SYSTEM ARCHITECTURE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("System Architecture", {
    x: 0.8, y: 0.3, w: 8, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("14 modules. Unified data plane. Security envelope.", {
    x: 0.8, y: 0.75, w: 8, h: 0.25, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  s.addImage({ path: IMG.arch, x: 1.0, y: 1.0, w: 8.0, h: 4.0, transparency: 90 });

  // Pipeline flow
  const pipeline = [
    { name: "Input", sub: "", color: C.muted, w: 0.8 },
    { name: "AIMDS", sub: "0.06ms scan", color: C.red, w: 1.2 },
    { name: "Ruflo", sub: "150+ agents\n5 topologies", color: C.accent, w: 1.3 },
    { name: "RuVector", sub: "61\u00B5s search", color: C.sky, w: 1.2 },
    { name: "AgentDB", sub: "4 memory types", color: C.accentAlt, w: 1.2 },
    { name: "SONA", sub: "9 RL algorithms", color: C.warn, w: 1.1 },
    { name: "Output", sub: "", color: C.muted, w: 0.8 },
  ];
  let px = 0.5;
  pipeline.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.2, w: p.w, h: 0.85, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.2, w: p.w, h: 0.04, fill: { color: p.color } });
    s.addText(p.name, { x: px + 0.05, y: 1.3, w: p.w - 0.1, h: 0.25, fontSize: 10, fontFace: "Consolas", color: p.color, bold: true, margin: 0, align: "center" });
    if (p.sub) s.addText(p.sub, { x: px + 0.05, y: 1.55, w: p.w - 0.1, h: 0.4, fontSize: 8, fontFace: "Calibri", color: C.muted, margin: 0, align: "center" });
    if (i < pipeline.length - 1) {
      s.addText("\u25B6", { x: px + p.w, y: 1.2, w: 0.3, h: 0.85, fontSize: 12, fontFace: "Arial", color: C.muted, valign: "middle", align: "center", margin: 0 });
    }
    px += p.w + 0.3;
  });

  // RVF layer
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.3, w: 9.0, h: 0.8, fill: { color: "1A2230" } });
  s.addText("RVF: 3-Tier Compute", { x: 0.65, y: 2.35, w: 2.5, h: 0.25, fontSize: 10, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
  s.addText("WASM (5.5KB)  |  eBPF (kernel bypass)  |  Unikernel (125ms Linux boot)", { x: 0.65, y: 2.6, w: 4.5, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.muted, margin: 0 });
  s.addText("Nervous System: 5 Bio-Inspired Layers", { x: 5.2, y: 2.35, w: 4, h: 0.25, fontSize: 10, fontFace: "Consolas", color: C.green, bold: true, margin: 0 });
  s.addText("Sensing (<100ns)  |  Reflex (<1\u00B5s)  |  Memory (10\u00B3\u2070 cap)  |  Learning  |  Coherence", { x: 5.2, y: 2.6, w: 4.2, h: 0.2, fontSize: 8.5, fontFace: "Calibri", color: C.muted, margin: 0 });

  // Data plane
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.3, w: 9.0, h: 0.5, fill: { color: "0D2A2E" } });
  s.addText("PostgreSQL Unified Data Plane \u2014 290+ SQL Functions  |  HNSW Indexing  |  RuVector Extension  |  Drop-in pgvector replacement", {
    x: 0.65, y: 3.3, w: 8.7, h: 0.5, fontSize: 10, fontFace: "Calibri", color: C.accent, valign: "middle", margin: 0
  });

  // Security envelope
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.0, w: 9.0, h: 0.5, fill: { color: "1A1520" } });
  s.addText("Security Envelope \u2014 Witness Chains (ML-DSA-65 Post-Quantum)  |  TEE Attestations  |  PII Redaction  |  DNA Lineage Tracking", {
    x: 0.65, y: 4.0, w: 8.7, h: 0.5, fontSize: 10, fontFace: "Calibri", color: C.red, valign: "middle", margin: 0
  });

  // Bottom stats
  const archStats = ["96 MCP Tools", "80+ Rust Crates", "49+ npm Packages", "25+ ADRs", "14 Modules"];
  archStats.forEach((st, i) => {
    s.addText(st, { x: 0.5 + i * 1.8, y: 4.7, w: 1.7, h: 0.3, fontSize: 10, fontFace: "Consolas", color: C.accent, margin: 0, align: "center" });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 4: ALGORITHMS VS GPUS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("The Philosophy: Algorithms Beat GPUs", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("The industry throws hardware at problems. We throw mathematics.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Left: Brute Force
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.4, w: 4.1, h: 2.8, fill: { color: "1A1520" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.4, w: 4.1, h: 0.04, fill: { color: C.red } });
  s.addText("Brute Force Approach", { x: 1.0, y: 1.5, w: 3.7, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText("$100M+/year", { x: 1.0, y: 1.85, w: 3.7, h: 0.4, fontSize: 26, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText([
    { text: "Massive GPU clusters required", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "$30M/month operational costs", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Linear scaling with data volume", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Vendor lock-in to cloud providers", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Environmental impact: enormous", options: { bullet: true, fontSize: 11, color: C.muted } },
  ], { x: 1.0, y: 2.35, w: 3.7, h: 1.6, fontFace: "Calibri", paraSpaceAfter: 5 });

  // Right: Algorithmic Efficiency
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.4, w: 4.1, h: 2.8, fill: { color: "0D2A2E" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.4, w: 4.1, h: 0.04, fill: { color: C.accent } });
  s.addText("Algorithmic Efficiency", { x: 5.3, y: 1.5, w: 3.7, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText("$1.7M/month", { x: 5.3, y: 1.85, w: 3.7, h: 0.4, fontSize: 26, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText([
    { text: "MinCut-Gated: 50-90% compute skip", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Coherence Transformer optimization", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Runs on commodity hardware", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Sub-linear scaling with HNSW", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "5.5KB WASM runtime, zero GPUs", options: { bullet: true, fontSize: 11, color: C.mutedLight } },
  ], { x: 5.3, y: 2.35, w: 3.7, h: 1.6, fontFace: "Calibri", paraSpaceAfter: 5 });

  // Bottom cost comparison
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.5, w: 8.4, h: 0.7, fill: { color: C.bgAlt } });
  s.addText("$30M/month", { x: 1.2, y: 4.55, w: 2, h: 0.3, fontSize: 18, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText("\u2192", { x: 3.5, y: 4.5, w: 0.5, h: 0.7, fontSize: 24, fontFace: "Arial", color: C.muted, valign: "middle", align: "center", margin: 0 });
  s.addText("$1.7M/month", { x: 4.2, y: 4.55, w: 2.5, h: 0.3, fontSize: 18, fontFace: "Consolas", color: C.green, bold: true, margin: 0 });
  s.addText("|", { x: 6.7, y: 4.5, w: 0.3, h: 0.7, fontSize: 18, fontFace: "Arial", color: C.muted, valign: "middle", align: "center", margin: 0 });
  s.addText("94% cost reduction", { x: 7.1, y: 4.55, w: 2, h: 0.3, fontSize: 16, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
  s.addText("Same capabilities. Better results. A fraction of the cost.", {
    x: 1.2, y: 4.88, w: 7.5, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5: PI COLLECTIVE INTELLIGENCE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accentAlt } });

  s.addText("Pi: Decentralized Collective Intelligence", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("The first collective intelligence network where AI agents contribute knowledge alongside humans.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Architecture flow
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 8.4, h: 0.65, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 8.4, h: 0.04, fill: { color: C.accentAlt } });
  const piFlow = [
    { name: "Decentralized\nNodes", color: C.accentAlt },
    { name: "Vector\nEmbeddings", color: C.accent },
    { name: "Cryptographic\nVerification", color: C.warn },
    { name: "Consensus\nProtocol", color: C.green },
  ];
  piFlow.forEach((pf, i) => {
    const pfx = 1.0 + i * 2.1;
    s.addText(pf.name, { x: pfx, y: 1.4, w: 1.7, h: 0.55, fontSize: 10, fontFace: "Consolas", color: pf.color, bold: true, margin: 0, align: "center", valign: "middle" });
    if (i < piFlow.length - 1) {
      s.addText("\u25B6", { x: pfx + 1.7, y: 1.4, w: 0.4, h: 0.55, fontSize: 14, fontFace: "Arial", color: C.muted, valign: "middle", align: "center", margin: 0 });
    }
  });

  // Live deployment badge
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 2.0, h: 0.35, fill: { color: "1A1032" } });
  s.addText("\u03C0.ruv.io \u2014 LIVE", { x: 0.8, y: 2.2, w: 2.0, h: 0.35, fontSize: 11, fontFace: "Consolas", color: C.accentAlt, bold: true, margin: 0, align: "center", valign: "middle" });

  // Key specs - two columns
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.75, w: 4.1, h: 2.2, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.75, w: 0.06, h: 2.2, fill: { color: C.accentAlt } });
  s.addText("Technical Specifications", { x: 1.1, y: 2.82, w: 3.5, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.accentAlt, bold: true, margin: 0 });
  s.addText([
    { text: "384-dimension vectors (all-MiniLM-L6-v2)", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Cryptographic verification of all contributions", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Decentralized contribution from AI + humans", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "MCP server integration (pi-brain tools)", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Knowledge persistence across sessions", options: { bullet: true, fontSize: 10.5, color: C.mutedLight } },
  ], { x: 1.1, y: 3.15, w: 3.6, h: 1.7, fontFace: "Calibri", paraSpaceAfter: 4 });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.75, w: 4.1, h: 2.2, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.75, w: 0.06, h: 2.2, fill: { color: C.accent } });
  s.addText("What Makes It Different", { x: 5.4, y: 2.82, w: 3.5, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText([
    { text: "Not RAG \u2014 true collective intelligence", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Knowledge compounds across all participants", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Vector embeddings for semantic storage", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "No central authority \u2014 fully decentralized", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Built on RuVector + RVF infrastructure", options: { bullet: true, fontSize: 10.5, color: C.mutedLight } },
  ], { x: 5.4, y: 3.15, w: 3.6, h: 1.7, fontFace: "Calibri", paraSpaceAfter: 4 });

  // Bottom
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5.1, w: 8.4, h: 0.4, fill: { color: "1A1032" } });
  s.addText("Intelligence that grows with every participant. AI agents and humans contributing to the same knowledge graph.", {
    x: 1.0, y: 5.1, w: 8, h: 0.4, fontSize: 11, fontFace: "Calibri", color: C.accentAlt, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 6: RVF DEEP DIVE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("RVF: The Executable Knowledge Unit", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("24-segment binary format. Not a database file \u2014 an executable that contains intelligence.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Segment grid
  const segments = [
    { cat: "Core Data", items: "Vectors, Metadata, Indexes", color: C.accent, segs: "3" },
    { cat: "AI / Model", items: "LoRA deltas, GGUF weights, Inference config", color: C.sky, segs: "3" },
    { cat: "COW Branching", items: "Git-like versioning (200x savings)", color: C.warn, segs: "4" },
    { cat: "Security", items: "Witness chains (ML-DSA-65), TEE attestations", color: C.red, segs: "2" },
    { cat: "Compute", items: "WASM (5.5KB) | eBPF | Unikernel (125ms)", color: C.green, segs: "3+" },
    { cat: "AGI Container", items: "Identity + tools + authority + evaluation", color: C.accentAlt, segs: "9" },
  ];

  segments.forEach((seg, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const sx = 0.8 + col * 2.9;
    const sy = 1.35 + row * 1.35;

    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: sy, w: 2.7, h: 1.1, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: sy, w: 2.7, h: 0.04, fill: { color: seg.color } });
    s.addText(seg.cat + " (" + seg.segs + ")", { x: sx + 0.12, y: sy + 0.1, w: 2.5, h: 0.25, fontSize: 11, fontFace: "Consolas", color: seg.color, bold: true, margin: 0 });
    s.addText(seg.items, { x: sx + 0.12, y: sy + 0.4, w: 2.5, h: 0.55, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Size comparison
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.25, w: 8.4, h: 0.7, fill: { color: C.bgAlt } });
  s.addText("Docker image: 50-500 MB", { x: 1.0, y: 4.3, w: 2.5, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0 });
  s.addText("Minimal container: 5-50 MB", { x: 3.8, y: 4.3, w: 2.5, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0 });
  s.addText("RVF WASM runtime: 5.5 KB", { x: 6.6, y: 4.3, w: 2.5, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText("Docker images are megabytes. An RVF WASM runtime is 5.5 kilobytes.", {
    x: 1.0, y: 4.6, w: 8, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.accent, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 7: THREE-TIER COMPUTE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Three-Tier Compute Architecture", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("One binary format. Three execution environments. Deploy anywhere.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const tiers = [
    {
      name: "Tier 1: WASM",
      size: "5.5-46KB",
      boot: "<1ms boot",
      targets: "Browser, IoT, phone, edge",
      desc: "Full vector search + agent runtime in a file smaller than a favicon. Zero installation. Runs in any browser tab.",
      color: C.accent,
    },
    {
      name: "Tier 2: eBPF",
      size: "10-50KB",
      boot: "<20ms",
      targets: "Kernel bypass, XDP, 10Gbps+ wire speed",
      desc: "Network-level intelligence. Packet inspection at wire speed. No context switches. No user-space overhead.",
      color: C.sky,
    },
    {
      name: "Tier 3: Unikernel",
      size: "Full Linux",
      boot: "125ms boot",
      targets: "Bare metal, production, VM isolation",
      desc: "Complete Linux environment. Production-grade isolation. From cold start to serving in 125 milliseconds.",
      color: C.warn,
    },
  ];

  tiers.forEach((t, i) => {
    const ty = 1.35 + i * 1.05;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ty, w: 8.4, h: 0.85, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ty, w: 0.06, h: 0.85, fill: { color: t.color } });
    s.addText(t.name, { x: 1.1, y: ty + 0.05, w: 2.2, h: 0.25, fontSize: 13, fontFace: "Consolas", color: t.color, bold: true, margin: 0 });
    s.addText(t.size + "  |  " + t.boot, { x: 3.5, y: ty + 0.05, w: 3, h: 0.25, fontSize: 11, fontFace: "Consolas", color: t.color, margin: 0 });
    s.addText(t.targets, { x: 6.8, y: ty + 0.05, w: 2.2, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.muted, align: "right", margin: 0 });
    s.addText(t.desc, { x: 1.1, y: ty + 0.38, w: 7.8, h: 0.4, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Progressive Indexing
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.55, w: 4.1, h: 0.85, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.55, w: 4.1, h: 0.04, fill: { color: C.green } });
  s.addText("Progressive Indexing", { x: 1.0, y: 4.63, w: 3.7, h: 0.2, fontSize: 11, fontFace: "Consolas", color: C.green, bold: true, margin: 0 });
  s.addText("L0 Brute Force \u2192 L1 HNSW \u2192 L2 LSH", { x: 1.0, y: 4.85, w: 3.7, h: 0.2, fontSize: 10, fontFace: "Consolas", color: C.muted, margin: 0 });
  s.addText("Auto-promotes as data grows", { x: 1.0, y: 5.08, w: 3.7, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });

  // Temperature-Tiered Quantization
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 4.55, w: 4.1, h: 0.85, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 4.55, w: 4.1, h: 0.04, fill: { color: C.warn } });
  s.addText("Temperature-Tiered Quantization", { x: 5.3, y: 4.63, w: 3.7, h: 0.2, fontSize: 11, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
  s.addText("Hot fp32 \u2192 Warm fp16 \u2192 Cold int8/binary", { x: 5.3, y: 4.85, w: 3.7, h: 0.2, fontSize: 10, fontFace: "Consolas", color: C.muted, margin: 0 });
  s.addText("Automatic data lifecycle management", { x: 5.3, y: 5.08, w: 3.7, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 8: NERVOUS SYSTEM
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Bio-Inspired Nervous System", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Not a metaphor \u2014 implemented computational neuroscience. 22.9K lines, 359 tests.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const layers = [
    { name: "SENSING", time: "<100ns", desc: "Lock-free ring buffers, 10K+ events/ms", color: C.accent },
    { name: "REFLEX", time: "<1\u00B5s", desc: "K-Winner-Take-All, dendritic coincidence detection", color: C.sky },
    { name: "MEMORY", time: "10\u00B3\u2070 cap", desc: "Hyperdimensional Computing, XOR binding <50ns", color: C.accentAlt },
    { name: "LEARNING", time: "O(1)/synapse", desc: "BTSP one-shot, E-prop online, EWC++ anti-forgetting", color: C.warn },
    { name: "COHERENCE", time: "40Hz gamma", desc: "Kuramoto oscillators, global workspace, predictive coding", color: C.green },
  ];

  layers.forEach((l, i) => {
    const ly = 1.35 + i * 0.72;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ly, w: 8.4, h: 0.58, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ly, w: 0.06, h: 0.58, fill: { color: l.color } });
    s.addText("Layer " + (i + 1) + ": " + l.name, { x: 1.1, y: ly + 0.05, w: 2.2, h: 0.25, fontSize: 12, fontFace: "Consolas", color: l.color, bold: true, margin: 0 });
    s.addText(l.time, { x: 3.4, y: ly + 0.05, w: 1.4, h: 0.25, fontSize: 12, fontFace: "Consolas", color: l.color, margin: 0 });
    s.addText(l.desc, { x: 1.1, y: ly + 0.3, w: 7.8, h: 0.25, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Circadian controller
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.95, w: 8.4, h: 0.4, fill: { color: C.bgAlt } });
  s.addText("Circadian Controller: 5-50x compute savings during quiet periods \u2014 the system sleeps when you do", {
    x: 1.0, y: 4.95, w: 8, h: 0.4, fontSize: 11, fontFace: "Calibri", color: C.accent, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 9: 39 ATTENTION MECHANISMS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("39 Composable Attention Mechanisms", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Mix, compose, and stack. Every mechanism is a building block.", {
    x: 0.8, y: 0.85, w: 8, h: 0.25, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const attnMechs = [
    // Column 1
    ["Flash (2.49-7.47x)", "Multi-Head", "Multi-Query", "Grouped-Query",
     "Cross-Attention", "Self-Attention", "Causal / Masked", "Sliding Window",
     "Dilated", "Axial", "Linear", "Sparse", "Local"],
    // Column 2
    ["MinCut-Gated (50-90%)", "Hyperbolic (Poincar\u00E9)", "MoE Attention",
     "NSA (Nvidia)", "Longformer", "BigBird", "Performer", "Reformer",
     "Linformer", "FNet (FFT)", "Nystr\u00F6m", "Random Feature", "Routing"],
    // Column 3
    ["GraphRoPE", "Relative Position", "ALiBi", "RoPE",
     "Perceiver", "Set Transformer", "Block-Sparse",
     "Low-Rank", "Factored", "Memory-Augmented",
     "Temporal Fusion", "Retentive", "Differential"],
  ];

  attnMechs.forEach((col, ci) => {
    const colX = 0.8 + ci * 3.0;
    s.addShape(pres.shapes.RECTANGLE, { x: colX, y: 1.2, w: 2.8, h: 3.9, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: colX, y: 1.2, w: 2.8, h: 0.04, fill: { color: ci === 0 ? C.accent : ci === 1 ? C.sky : C.accentAlt } });
    col.forEach((mech, mi) => {
      const my = 1.32 + mi * 0.285;
      const isHighlight = mech.includes("Flash") || mech.includes("MinCut") || mech.includes("Hyperbolic") || mech.includes("MoE") || mech.includes("NSA") || mech.includes("GraphRoPE");
      s.addText(mech, {
        x: colX + 0.12, y: my, w: 2.56, h: 0.26,
        fontSize: isHighlight ? 9.5 : 9, fontFace: "Consolas",
        color: isHighlight ? (ci === 0 ? C.accent : ci === 1 ? C.sky : C.accentAlt) : C.muted,
        bold: isHighlight, margin: 0,
      });
    });
  });

  // Bottom callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5.15, w: 8.4, h: 0.35, fill: { color: C.bgAlt } });
  s.addText("GraphRoPE: hop-distance-aware position embeddings for graph-structured data \u2014 a RuvNet original.", {
    x: 1.0, y: 5.15, w: 8, h: 0.35, fontSize: 10.5, fontFace: "Calibri", color: C.accent, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 10: PRIME RADIANT
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Prime Radiant: Formal Verification for AI", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Confidence scores can be wrong. Mathematical proofs cannot.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.warn, italic: true, margin: 0
  });

  // Three engines
  const prEngines = [
    {
      name: "Cohomology Engine",
      method: "Sheaf Laplacian",
      desc: "Maps statement consistency across knowledge domains. Detects contradictions invisible to statistical methods.",
      color: C.accent,
    },
    {
      name: "Spectral Engine",
      method: "Eigenvalue Analysis",
      desc: "Decomposes reasoning chains into frequency components. Anomalous eigenvalues flag unsupported logical jumps.",
      color: C.sky,
    },
    {
      name: "Causal Engine",
      method: "Pearl's do-calculus",
      desc: "Distinguishes correlation from causation. Validates counterfactual reasoning using formal causal graphs.",
      color: C.warn,
    },
  ];

  prEngines.forEach((eng, i) => {
    const ex = 0.8 + i * 2.9;
    s.addShape(pres.shapes.RECTANGLE, { x: ex, y: 1.4, w: 2.7, h: 2.0, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: ex, y: 1.4, w: 2.7, h: 0.04, fill: { color: eng.color } });
    s.addText(eng.name, { x: ex + 0.12, y: 1.5, w: 2.5, h: 0.25, fontSize: 12, fontFace: "Consolas", color: eng.color, bold: true, margin: 0 });
    s.addText(eng.method, { x: ex + 0.12, y: 1.8, w: 2.5, h: 0.25, fontSize: 11, fontFace: "Consolas", color: eng.color, margin: 0 });
    s.addText(eng.desc, { x: ex + 0.12, y: 2.15, w: 2.5, h: 1.1, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // How it works callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.65, w: 8.4, h: 0.9, fill: { color: "1A1520" } });
  s.addText("If any engine disagrees \u2192 output flagged", { x: 1.0, y: 3.7, w: 4, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText("Three independent mathematical frameworks must reach consensus before any output is marked as verified. This is formal verification, not confidence scoring. A 99.9% confidence score still hallucinates 1 in 1,000 times. Mathematical proof does not.", {
    x: 1.0, y: 4.05, w: 8, h: 0.45, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Stats
  s.addText("12-agent swarm", { x: 0.8, y: 4.75, w: 2.5, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText("~35K LOC", { x: 3.5, y: 4.75, w: 2, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText("3 verification engines", { x: 5.7, y: 4.75, w: 3, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });

  s.addText("Deployed: production-grade anti-hallucination infrastructure.", {
    x: 0.8, y: 5.15, w: 8, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.accent, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 11: AIMDS SECURITY
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("AIMDS: Security via Chaos Theory", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("3-layer pipeline. Lyapunov chaos detection. Mathematical certainty, not heuristics.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // 3 stages
  const stages = [
    { name: "DETECTION", time: "0.06ms", items: ["50+ detection patterns", "Aho-Corasick matching", "Real-time stream processing"], color: C.warn },
    { name: "ANALYSIS", time: "80ms", items: ["Lyapunov chaos detection", "LTL policy verification", "Behavioral divergence"], color: C.red },
    { name: "RESPONSE", time: "<50ms", items: ["7 adaptive strategies", "25-level strange-loop", "Real-time mitigation"], color: C.green },
  ];

  stages.forEach((st, i) => {
    const sx = 0.8 + i * 2.9;
    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: 1.35, w: 2.7, h: 2.2, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: 1.35, w: 2.7, h: 0.04, fill: { color: st.color } });
    s.addText("LAYER " + (i + 1) + ": " + st.name, { x: sx + 0.12, y: 1.45, w: 2.5, h: 0.25, fontSize: 10, fontFace: "Consolas", color: st.color, bold: true, margin: 0 });
    s.addText(st.time, { x: sx + 0.12, y: 1.75, w: 2.5, h: 0.35, fontSize: 22, fontFace: "Consolas", color: st.color, bold: true, margin: 0 });
    s.addText(
      st.items.map((item, j) => ({ text: item, options: { bullet: true, breakLine: j < st.items.length - 1, fontSize: 10, color: C.muted } })),
      { x: sx + 0.12, y: 2.2, w: 2.5, h: 1.1, fontFace: "Calibri", paraSpaceAfter: 4 }
    );
  });

  // Lyapunov explainer
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.8, w: 8.4, h: 0.9, fill: { color: "1A1520" } });
  s.addText("Lyapunov Chaos Detection", { x: 1.0, y: 3.85, w: 3, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText("Positive Lyapunov exponent = system diverging from expected behavior = adversarial. Same mathematics that predicts weather chaos. Detects novel attacks without pattern libraries.", {
    x: 1.0, y: 4.15, w: 8, h: 0.45, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const secStats = [
    { num: "782KB", label: "Binary Size" },
    { num: ">12K/s", label: "Requests/Sec" },
    { num: "<5%", label: "False Positive" },
    { num: "0.06ms", label: "Detection Time" },
  ];
  secStats.forEach((st, i) => {
    s.addText(st.num, { x: 0.8 + i * 2.3, y: 4.85, w: 2, h: 0.35, fontSize: 20, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: 0.8 + i * 2.3, y: 5.15, w: 2, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 12: SONA + REASONINGBANK
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("SONA + ReasoningBank: Real-Time Learning", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Every decision makes the system smarter. Automatically. <1ms. $0.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // SONA vs Traditional
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 4.1, h: 1.6, fill: { color: "0D2A2E" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 4.1, h: 0.04, fill: { color: C.accent } });
  s.addText("SONA: Two-Tier LoRA", { x: 1.0, y: 1.45, w: 3.7, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText([
    { text: "MicroLoRA (rank-2, ~45\u00B5s): instant reactions", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "BaseLoRA (rank-16, ~500\u00B5s): deep learning", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "$0 cost, <1ms latency, zero downtime", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "EWC++ prevents catastrophic forgetting (45% less)", options: { bullet: true, fontSize: 10.5, color: C.mutedLight } },
  ], { x: 1.0, y: 1.75, w: 3.7, h: 1.1, fontFace: "Calibri", paraSpaceAfter: 4 });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.1, h: 1.6, fill: { color: "1A1520" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.1, h: 0.04, fill: { color: C.red } });
  s.addText("Traditional Fine-Tuning", { x: 5.3, y: 1.45, w: 3.7, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText([
    { text: "Days to weeks of training time", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "$1K-$100K per fine-tune cycle", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "Requires scheduled downtime", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "Catastrophic forgetting on new domains", options: { bullet: true, fontSize: 10.5, color: C.muted } },
  ], { x: 5.3, y: 1.75, w: 3.7, h: 1.1, fontFace: "Calibri", paraSpaceAfter: 4 });

  // ReasoningBank pipeline
  s.addText("ReasoningBank 4-Step Pipeline", { x: 0.8, y: 3.2, w: 4, h: 0.3, fontSize: 13, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });

  const rbSteps = [
    { step: "1. RETRIEVE", desc: "HNSW search for similar past decisions" },
    { step: "2. JUDGE", desc: "Assign verdicts based on outcomes" },
    { step: "3. DISTILL", desc: "Micro-LoRA pattern extraction" },
    { step: "4. CONSOLIDATE", desc: "EWC++ prevents forgetting" },
  ];
  rbSteps.forEach((rb, i) => {
    const rx = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 3.6, w: 2.05, h: 0.7, fill: { color: C.bgCard } });
    s.addText(rb.step, { x: rx + 0.1, y: 3.63, w: 1.85, h: 0.25, fontSize: 10, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(rb.desc, { x: rx + 0.1, y: 3.9, w: 1.85, h: 0.35, fontSize: 9.5, fontFace: "Calibri", color: C.muted, margin: 0 });
    if (i < rbSteps.length - 1) {
      s.addText("\u25B6", { x: rx + 2.05, y: 3.6, w: 0.2, h: 0.7, fontSize: 10, color: C.muted, valign: "middle", align: "center", margin: 0 });
    }
  });

  const sonaStats = [
    { num: "300x", label: "Faster Retrieval" },
    { num: "2,211/s", label: "SIMD Ops/Sec" },
    { num: "+55%", label: "Quality Improvement" },
    { num: "$0", label: "Learning Cost" },
  ];
  sonaStats.forEach((st, i) => {
    s.addText(st.num, { x: 0.8 + i * 2.3, y: 4.55, w: 2, h: 0.4, fontSize: 22, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: 0.8 + i * 2.3, y: 4.9, w: 2, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 13: RUVECTOR POSTGRESQL
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("RuVector: PostgreSQL-Native Vector Search", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Not a separate vector database. A PostgreSQL extension. ACID transactions on vector operations.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Left: Capabilities
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 4.1, h: 2.5, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 4.1, h: 0.04, fill: { color: C.sky } });
  s.addText("Core Capabilities", { x: 1.0, y: 1.45, w: 3.7, h: 0.3, fontSize: 13, fontFace: "Consolas", color: C.sky, bold: true, margin: 0 });

  const rvCaps = [
    "290+ SQL functions in-process",
    "HNSW indexing (61\u00B5s search latency)",
    "Drop-in pgvector replacement",
    "ACID transactions on vector ops",
    "Joins vectors with relational data",
    "80+ Rust crates for extensions",
    "Progressive indexing (L0/L1/L2)",
  ];
  s.addText(
    rvCaps.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < rvCaps.length - 1, fontSize: 10.5, color: C.mutedLight } })),
    { x: 1.0, y: 1.85, w: 3.7, h: 1.8, fontFace: "Calibri", paraSpaceAfter: 5 }
  );

  // Right: RVCOW
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.1, h: 2.5, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.1, h: 0.04, fill: { color: C.warn } });
  s.addText("RVCOW: Multi-Tenant Economics", { x: 5.3, y: 1.45, w: 3.7, h: 0.3, fontSize: 13, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });

  s.addText("512MB parent + 1,000 tenants = ~2.5MB/tenant", { x: 5.3, y: 1.85, w: 3.7, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.mutedLight, margin: 0 });

  const cowRows = [
    ["Approach", "Storage", "Cost"],
    ["Full Copy", "512GB", "$51,200/mo"],
    ["RVCOW", "~2.5GB", "$250/mo"],
    ["Savings", "200x", "99.5%"],
  ];
  s.addTable(cowRows.map((row, ri) => row.map(cell => ({
    text: cell,
    options: {
      fontSize: 10, fontFace: ri === 0 ? "Consolas" : "Calibri",
      color: ri === 0 ? C.accent : (ri === 3 ? C.green : C.mutedLight),
      fill: { color: ri === 0 ? C.bgAlt : C.bgCard },
      bold: ri === 0 || ri === 3, align: ri === 0 ? "left" : "center"
    }
  }))), {
    x: 5.3, y: 2.3, w: 3.7, colW: [1.2, 1.2, 1.3],
    border: { pt: 0.5, color: "2A3550" },
    rowH: [0.28, 0.28, 0.28, 0.28],
  });

  s.addText([
    { text: "COW branch creation: ", options: { fontSize: 10, color: C.muted } },
    { text: "2.6ms", options: { fontSize: 10, color: C.accent, bold: true, breakLine: true } },
    { text: "CowMap cluster lookup: ", options: { fontSize: 10, color: C.muted } },
    { text: "28ns", options: { fontSize: 10, color: C.accent, bold: true } },
  ], { x: 5.3, y: 3.5, w: 3.7, h: 0.45, fontFace: "Calibri", margin: 0 });

  // Bottom stats
  const rvStats = [
    { num: "61\u00B5s", label: "HNSW Search" },
    { num: "8,000x", label: "vs Pinecone" },
    { num: "290+", label: "SQL Functions" },
    { num: "200x", label: "COW Savings" },
  ];
  rvStats.forEach((st, i) => {
    const sx = 0.8 + i * 2.3;
    s.addText(st.num, { x: sx, y: 4.15, w: 2, h: 0.35, fontSize: 20, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: sx, y: 4.45, w: 2, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 14: GRAPH ANALYTICS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Graph Analytics: MinCut + GNN + HNSW", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Stoer-Wagner algorithm. 448+ tests. Production graph intelligence.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Left: MinCut
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 4.1, h: 2.3, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 4.1, h: 0.04, fill: { color: C.accent } });
  s.addText("MinCut Applications", { x: 1.0, y: 1.45, w: 3.7, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  const mcApps = [
    "Finding architectural bottlenecks",
    "Identifying weak points in distributed systems",
    "Detecting natural module boundaries",
    "Measuring attack surface",
    "Swarm topology optimization",
    "Anti-pattern detection via absence analysis",
  ];
  s.addText(
    mcApps.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < mcApps.length - 1, fontSize: 10.5, color: C.mutedLight } })),
    { x: 1.0, y: 1.8, w: 3.7, h: 1.7, fontFace: "Calibri", paraSpaceAfter: 4 }
  );

  // Right: GNN
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.1, h: 2.3, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.1, h: 0.04, fill: { color: C.sky } });
  s.addText("GNN on HNSW Topology", { x: 5.3, y: 1.45, w: 3.7, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.sky, bold: true, margin: 0 });
  const gnnItems = [
    "GCN, GAT, GraphSAGE implementations",
    "GraphRoPE: hop-distance-aware embeddings",
    "Louvain community detection",
    "Spectral clustering (K-way)",
    "Bridge/articulation point detection",
    "Dynamic MinCut for real-time health",
  ];
  s.addText(
    gnnItems.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < gnnItems.length - 1, fontSize: 10.5, color: C.mutedLight } })),
    { x: 5.3, y: 1.8, w: 3.7, h: 1.7, fontFace: "Calibri", paraSpaceAfter: 4 }
  );

  // Industry proof
  s.addText("Industry Proof Points", { x: 0.8, y: 3.9, w: 4, h: 0.3, fontSize: 12, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
  const proofs = [
    { who: "Pinterest", result: "150% hit-rate improvement", how: "Graph-based recommendation" },
    { who: "Google Maps", result: "50% better ETA", how: "Graph routing optimization" },
    { who: "Uber Eats", result: "20%+ engagement", how: "Graph-ranked discovery" },
  ];
  proofs.forEach((p, i) => {
    const ppx = 0.8 + i * 2.9;
    s.addShape(pres.shapes.RECTANGLE, { x: ppx, y: 4.25, w: 2.7, h: 0.7, fill: { color: C.bgAlt } });
    s.addText(p.who, { x: ppx + 0.1, y: 4.28, w: 2.5, h: 0.2, fontSize: 10, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
    s.addText(p.result, { x: ppx + 0.1, y: 4.48, w: 2.5, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.mutedLight, margin: 0 });
    s.addText(p.how, { x: ppx + 0.1, y: 4.68, w: 2.5, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("448+ tests", { x: 0.8, y: 5.1, w: 2, h: 0.3, fontSize: 12, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 15: SHIP IT IN 5 LINES
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });
  s.addImage({ path: IMG.codeTerminal, x: 0, y: 0, w: 10, h: 5.625, transparency: 92 });

  s.addText("Ship It In 5 Lines", {
    x: 0.8, y: 0.3, w: 8, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Production multi-agent swarms. Self-learning. Self-healing. One require statement.", {
    x: 0.8, y: 0.75, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Dark code block background
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.15, w: 8.8, h: 3.65, fill: { color: "151E2E" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.15, w: 8.8, h: 0.04, fill: { color: C.accent } });

  // Line 1: const ruflo = require('ruflo');
  s.addText([
    { text: "const", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: " ruflo = ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "require", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: "(", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'ruflo'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: ");", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 1.25, w: 8.2, h: 0.22, margin: 0 });

  // Blank + comment
  s.addText("// Initialize a self-healing agent swarm", {
    x: 0.9, y: 1.55, w: 8.2, h: 0.22, fontSize: 10, fontFace: "Consolas", color: C.muted, margin: 0
  });

  // const swarm = await ruflo.swarm.init({
  s.addText([
    { text: "const", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: " swarm", options: { color: C.accentAlt, fontFace: "Consolas", fontSize: 10 } },
    { text: " = ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "await", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: " ruflo.swarm.", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "init", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: "({", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 1.75, w: 8.2, h: 0.22, margin: 0 });

  s.addText([
    { text: "  topology: ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'hierarchical'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: ", agents: ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "8", options: { color: C.warn, fontFace: "Consolas", fontSize: 10 } },
    { text: ", strategy: ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'specialized'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 1.95, w: 8.2, h: 0.22, margin: 0 });

  s.addText("});", { x: 0.9, y: 2.15, w: 8.2, h: 0.22, fontSize: 10, fontFace: "Consolas", color: C.white, margin: 0 });

  // Blank + comment
  s.addText("// Deploy 51 autonomous agents in one command", {
    x: 0.9, y: 2.42, w: 8.2, h: 0.22, fontSize: 10, fontFace: "Consolas", color: C.muted, margin: 0
  });

  // const fleet = await swarm.deploy({
  s.addText([
    { text: "const", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: " fleet", options: { color: C.accentAlt, fontFace: "Consolas", fontSize: 10 } },
    { text: " = ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "await", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: " swarm.", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "deploy", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: "({", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 2.62, w: 8.2, h: 0.22, margin: 0 });

  s.addText([
    { text: "  domains: [", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'billing'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: ", ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'compliance'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: ", ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'support'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: "],", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 2.82, w: 8.2, h: 0.22, margin: 0 });

  s.addText([
    { text: "  memory: ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'persistent'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: ",       ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "// AgentDB - agents remember everything", options: { color: C.muted, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 3.02, w: 8.2, h: 0.22, margin: 0 });

  s.addText([
    { text: "  security: ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'aimds'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: ",          ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "// Chaos theory threat detection", options: { color: C.muted, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 3.22, w: 8.2, h: 0.22, margin: 0 });

  s.addText([
    { text: "  runtime: ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'rvf-wasm'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: "        ", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "// 5.5KB - runs anywhere", options: { color: C.muted, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 3.42, w: 8.2, h: 0.22, margin: 0 });

  s.addText("});", { x: 0.9, y: 3.62, w: 8.2, h: 0.22, fontSize: 10, fontFace: "Consolas", color: C.white, margin: 0 });

  // fleet.on callback
  s.addText([
    { text: "fleet", options: { color: C.accentAlt, fontFace: "Consolas", fontSize: 10 } },
    { text: ".", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "on", options: { color: C.accent, fontFace: "Consolas", fontSize: 10 } },
    { text: "(", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "'resolution'", options: { color: C.green, fontFace: "Consolas", fontSize: 10 } },
    { text: ", (", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
    { text: "data", options: { color: C.accentAlt, fontFace: "Consolas", fontSize: 10 } },
    { text: ") => {", options: { color: C.white, fontFace: "Consolas", fontSize: 10 } },
  ], { x: 0.9, y: 3.87, w: 8.2, h: 0.22, margin: 0 });

  s.addText("  // SONA generates LoRA adapters automatically", {
    x: 0.9, y: 4.07, w: 8.2, h: 0.22, fontSize: 10, fontFace: "Consolas", color: C.muted, margin: 0
  });
  s.addText("  // Your AI gets smarter. Zero cost. Zero effort.", {
    x: 0.9, y: 4.22, w: 8.2, h: 0.22, fontSize: 10, fontFace: "Consolas", color: C.muted, margin: 0
  });
  s.addText("});", { x: 0.9, y: 4.42, w: 8.2, h: 0.22, fontSize: 10, fontFace: "Consolas", color: C.white, margin: 0 });

  // Bottom callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 4.7, w: 8.8, h: 0.5, fill: { color: C.bgAlt } });
  s.addText("Claude Code shipped sub-agents in March 2026. Ruflo shipped this in August 2025. 8 months earlier.", {
    x: 0.8, y: 4.7, w: 8.4, h: 0.5, fontSize: 13, fontFace: "Calibri", color: C.warn, bold: true, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 16: BENCHMARKS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Performance Benchmarks", {
    x: 0.8, y: 0.35, w: 8, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Measured results against best-in-class competitors.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const bHeaders = [
    { text: "Metric", options: { bold: true, color: C.accent, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt } } },
    { text: "RuvNet", options: { bold: true, color: C.accent, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Best Competitor", options: { bold: true, color: C.muted, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Advantage", options: { bold: true, color: C.warn, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
  ];

  const bRow = (m, r, c, a) => [
    { text: m, options: { fontSize: 10.5, fontFace: "Calibri", color: C.mutedLight, fill: { color: C.bgCard } } },
    { text: r, options: { fontSize: 10.5, fontFace: "Consolas", color: C.accent, fill: { color: C.bgCard }, align: "center", bold: true } },
    { text: c, options: { fontSize: 10.5, fontFace: "Calibri", color: C.muted, fill: { color: C.bgCard }, align: "center" } },
    { text: a, options: { fontSize: 10.5, fontFace: "Consolas", color: C.warn, fill: { color: C.bgCard }, align: "center", bold: true } },
  ];

  s.addTable([
    bHeaders,
    bRow("HNSW Search", "61\u00B5s", "500ms+ (Pinecone)", "8,000x"),
    bRow("Fox Flow QPS", "12.8M", "3K (Redis)", "4,000x"),
    bRow("Detection Time", "0.06ms", "~10ms (rule-based)", "167x"),
    bRow("WASM Runtime", "5.5KB", "100MB+ (containers)", "18,000x"),
    bRow("Learning Latency", "<1ms", "Days-weeks", ">86Mx"),
    bRow("Agent Scale", "100K", "~10-50", "2,000x+"),
    bRow("SWE-Bench", "84.8%", "33.2% (GPT-4o)", "2.5x"),
  ], {
    x: 0.8, y: 1.35, w: 8.4,
    colW: [2.2, 1.8, 2.4, 2.0],
    border: { pt: 0.5, color: "2A3550" },
    rowH: [0.32, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  });

  // Big callout stats
  const bigStats = [
    { num: "8,000x", label: "Vector Search" },
    { num: "4,000x", label: "Stream Processing" },
    { num: "167x", label: "Threat Detection" },
    { num: "18,000x", label: "Smaller Runtime" },
  ];
  bigStats.forEach((st, i) => {
    s.addText(st.num, { x: 0.8 + i * 2.3, y: 4.2, w: 2, h: 0.4, fontSize: 22, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: 0.8 + i * 2.3, y: 4.55, w: 2, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 17: INTEGRATION
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Integration Architecture", {
    x: 0.8, y: 0.35, w: 8, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("MCP protocol. PostgreSQL-native. Drop-in pgvector replacement.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // MCP
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.3, w: 4.1, h: 1.8, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.3, w: 4.1, h: 0.04, fill: { color: C.accent } });
  s.addText("MCP Protocol: 96 Tools", { x: 1.0, y: 1.4, w: 3.7, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText([
    { text: "Deferred loading for performance", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Agent orchestration + memory + search", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Task management + workflow engine", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Security scanning + graph analytics", options: { bullet: true, fontSize: 10.5, color: C.mutedLight } },
  ], { x: 1.0, y: 1.75, w: 3.7, h: 1.2, fontFace: "Calibri", paraSpaceAfter: 5 });

  // PostgreSQL
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.3, w: 4.1, h: 1.8, fill: { color: C.bgCard }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.3, w: 4.1, h: 0.04, fill: { color: C.sky } });
  s.addText("PostgreSQL-Native", { x: 5.3, y: 1.4, w: 3.7, h: 0.25, fontSize: 12, fontFace: "Consolas", color: C.sky, bold: true, margin: 0 });
  s.addText([
    { text: "No separate vector database deployment", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "290+ SQL functions in-process", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "ACID transactions on vector ops", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Drop-in pgvector migration", options: { bullet: true, fontSize: 10.5, color: C.mutedLight } },
  ], { x: 5.3, y: 1.75, w: 3.7, h: 1.2, fontFace: "Calibri", paraSpaceAfter: 5 });

  // SDKs
  s.addText("APIs, SDKs & Integration Points", { x: 0.8, y: 3.4, w: 4, h: 0.3, fontSize: 12, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
  const sdks = [
    { name: "REST API", desc: "Standard HTTP" },
    { name: "gRPC", desc: "High-perf binary" },
    { name: "TypeScript SDK", desc: "Full type safety" },
    { name: "Python SDK", desc: "ML pipelines" },
    { name: "WASM SDK", desc: "Client-side search" },
    { name: "Webhooks", desc: "Event-driven" },
  ];
  sdks.forEach((sdk, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const sx = 0.8 + col * 2.9;
    const sy = 3.8 + row * 0.6;
    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: sy, w: 2.7, h: 0.45, fill: { color: C.bgAlt } });
    s.addText(sdk.name, { x: sx + 0.1, y: sy + 0.05, w: 1.3, h: 0.35, fontSize: 10, fontFace: "Consolas", color: C.accent, bold: true, valign: "middle", margin: 0 });
    s.addText(sdk.desc, { x: sx + 1.4, y: sy + 0.05, w: 1.2, h: 0.35, fontSize: 10, fontFace: "Calibri", color: C.muted, valign: "middle", margin: 0 });
  });

  // Bottom stats
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5.05, w: 8.4, h: 0.4, fill: { color: "0D2A2E" } });
  s.addText("96 MCP Tools  |  290+ SQL Functions  |  Drop-in pgvector  |  49+ npm Packages", {
    x: 1.0, y: 5.05, w: 8, h: 0.4, fontSize: 11, fontFace: "Consolas", color: C.accent, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 18: IMPLEMENTATION ROADMAP
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Implementation Roadmap", {
    x: 0.8, y: 0.35, w: 8, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("From zero to production in 3 months. Incremental value at every phase.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const phases = [
    {
      name: "1: Foundation", when: "Week 1-2",
      items: ["Core RuVector PostgreSQL extension", "AIMDS security middleware", "Basic agent deployment", "HNSW index configuration"],
      color: C.accent
    },
    {
      name: "2: Intelligence", when: "Week 3-4",
      items: ["AgentDB memory (4 types)", "ReasoningBank + SONA", "Ruflo orchestration", "MCP tool integration"],
      color: C.sky
    },
    {
      name: "3: Customize", when: "Month 2",
      items: ["Custom agent development", "Domain-specific LoRA training", "Graph analytics deployment", "Performance tuning"],
      color: C.accentAlt
    },
    {
      name: "4: Scale", when: "Month 3+",
      items: ["Production scaling + monitoring", "WASM edge deployment", "Multi-tenant RVCOW", "Advanced swarm topologies"],
      color: C.warn
    },
  ];

  phases.forEach((ph, i) => {
    const phx = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: phx, y: 1.35, w: 2.05, h: 3.2, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: phx, y: 1.35, w: 2.05, h: 0.04, fill: { color: ph.color } });
    s.addText(ph.name, { x: phx + 0.1, y: 1.45, w: 1.85, h: 0.3, fontSize: 11, fontFace: "Consolas", color: ph.color, bold: true, margin: 0 });
    s.addText(ph.when, { x: phx + 0.1, y: 1.75, w: 1.85, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
    s.addText(
      ph.items.map((item, j) => ({ text: item, options: { bullet: true, breakLine: j < ph.items.length - 1, fontSize: 9.5, color: C.mutedLight } })),
      { x: phx + 0.1, y: 2.1, w: 1.85, h: 2.2, fontFace: "Calibri", paraSpaceAfter: 5 }
    );
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.75, w: 8.4, h: 0.45, fill: { color: C.bgAlt } });
  s.addText("Each phase delivers standalone value. No big-bang migration required.", {
    x: 1.0, y: 4.75, w: 8, h: 0.45, fontSize: 12, fontFace: "Calibri", color: C.accent, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 19: THE ASK / CTA
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("RUVNET", {
    x: 0.8, y: 1.0, w: 8.4, h: 0.5, fontSize: 16, fontFace: "Consolas", color: C.accent, charSpacing: 6, margin: 0
  });
  s.addText("Schedule a 30-Minute\nArchitecture Review", {
    x: 0.8, y: 1.6, w: 8.4, h: 1.3, fontSize: 40, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });

  const ctaRow1 = [
    { num: "148+", label: "Capabilities" },
    { num: "14", label: "Modules" },
    { num: "80+", label: "Rust Crates" },
    { num: "290+", label: "SQL Functions" },
  ];
  const ctaRow2 = [
    { num: "39", label: "Attention Mechanisms" },
    { num: "9", label: "RL Algorithms" },
    { num: "5", label: "Bio-Inspired Layers" },
    { num: "24", label: "RVF Segment Types" },
  ];

  ctaRow1.forEach((st, i) => {
    s.addText(st.num, { x: 0.8 + i * 2.2, y: 3.3, w: 2, h: 0.4, fontSize: 22, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: 0.8 + i * 2.2, y: 3.65, w: 2, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });
  ctaRow2.forEach((st, i) => {
    s.addText(st.num, { x: 0.8 + i * 2.2, y: 4.05, w: 2, h: 0.35, fontSize: 20, fontFace: "Consolas", color: C.sky, bold: true, margin: 0 });
    s.addText(st.label, { x: 0.8 + i * 2.2, y: 4.35, w: 2, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("Two standard deviations beyond state of the art. Open source. Free.", {
    x: 0.8, y: 4.7, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.accent, italic: true, margin: 0
  });
  s.addText("ruvnet.com  |  hello@ruvnet.com", {
    x: 0.8, y: 5.15, w: 8, h: 0.3, fontSize: 13, fontFace: "Consolas", color: C.accent, bold: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // WRITE FILE
  // ═══════════════════════════════════════════════════════════
  const outPath = path.resolve(__dirname, "../docs/presentations/CTO-Deck-RuvNet-2026.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("CTO deck written successfully to: " + outPath);
  console.log("Total slides: 19");
}

build().catch(console.error);
