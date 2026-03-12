const pptxgen = require("pptxgenjs");

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

  s.addText("RUVNET", {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5, fontSize: 16, fontFace: "Consolas", color: C.accent, charSpacing: 6, margin: 0
  });
  s.addText("Technical Architecture\nDeep Dive", {
    x: 0.8, y: 1.5, w: 8.4, h: 1.4, fontSize: 44, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("148 capabilities across 14 modules. Production-grade agentic infrastructure.", {
    x: 0.8, y: 3.0, w: 7, h: 0.5, fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0
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
  // SLIDE 3: FULL SYSTEM ARCHITECTURE
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
    s.addText(st, { x: 0.5 + i * 1.8, y: 4.75, w: 1.7, h: 0.3, fontSize: 10, fontFace: "Consolas", color: C.accent, margin: 0, align: "center" });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 3B: IMPOSSIBLE APP — DATA SOVEREIGNTY
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("ONLY POSSIBLE WITH RUVNET", { x: 0.8, y: 0.3, w: 4, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.warn, charSpacing: 3, bold: true, margin: 0 });
  s.addText("Enterprise AI Without Data Leakage", {
    x: 0.8, y: 0.55, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });

  s.addText("Every AI API sends your data to someone else's servers. RuVector runs inside your PostgreSQL.", {
    x: 0.8, y: 1.05, w: 8.4, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Architecture comparison
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.55, w: 4.1, h: 1.8, fill: { color: "1A1520" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.55, w: 4.1, h: 0.04, fill: { color: C.red } });
  s.addText("Standard AI Architecture", { x: 1.0, y: 1.65, w: 3.7, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText("Your Data \u2192 Internet \u2192 OpenAI/Google Servers \u2192 Response", { x: 1.0, y: 1.95, w: 3.7, h: 0.25, fontSize: 10, fontFace: "Consolas", color: C.muted, margin: 0 });
  s.addText([
    { text: "Data transmitted to third-party infrastructure", options: { bullet: true, breakLine: true, fontSize: 10, color: C.muted } },
    { text: "No audit trail of what happens to your data", options: { bullet: true, breakLine: true, fontSize: 10, color: C.muted } },
    { text: "Compliance teams block adoption", options: { bullet: true, breakLine: true, fontSize: 10, color: C.muted } },
    { text: "Network dependency = single point of failure", options: { bullet: true, fontSize: 10, color: C.muted } },
  ], { x: 1.0, y: 2.25, w: 3.7, h: 1.0, fontFace: "Calibri", paraSpaceAfter: 3 });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.55, w: 4.1, h: 1.8, fill: { color: "0D2A2E" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.55, w: 4.1, h: 0.04, fill: { color: C.accent } });
  s.addText("RuvNet Architecture", { x: 5.3, y: 1.65, w: 3.7, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText("Your Data \u2192 Your PostgreSQL \u2192 RuVector (in-process) \u2192 Response", { x: 5.3, y: 1.95, w: 3.7, h: 0.25, fontSize: 10, fontFace: "Consolas", color: C.accent, margin: 0 });
  s.addText([
    { text: "290+ SQL functions run in your DB process", options: { bullet: true, breakLine: true, fontSize: 10, color: C.mutedLight } },
    { text: "AIMDS scans inbound AND outbound for leaks", options: { bullet: true, breakLine: true, fontSize: 10, color: C.mutedLight } },
    { text: "Witness chains: cryptographic audit of every op", options: { bullet: true, breakLine: true, fontSize: 10, color: C.mutedLight } },
    { text: "Air-gap with RVF containers \u2014 zero network code", options: { bullet: true, fontSize: 10, color: C.mutedLight } },
  ], { x: 5.3, y: 2.25, w: 3.7, h: 1.0, fontFace: "Calibri", paraSpaceAfter: 3 });

  // Real example
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.6, w: 8.4, h: 1.0, fill: { color: C.bgAlt } });
  s.addText("EXAMPLE: Bank Loan Portfolio Analysis", { x: 1.0, y: 3.65, w: 4, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
  s.addText("10 years of loan performance data. Millions of records. With standard AI: compliance blocks the project because data would leave the network. With RuVector: deploy as a PostgreSQL extension on your existing DB. AIMDS enforces PII redaction. AI analyzes everything in-place. HNSW finds similar historical patterns in 61\u00B5s. Compliance signs off day one because zero data leaves the building.", {
    x: 1.0, y: 3.95, w: 8, h: 0.6, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 3C: IMPOSSIBLE APP — WASM SHRINKING
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("ONLY POSSIBLE WITH RUVNET", { x: 0.8, y: 0.3, w: 4, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.warn, charSpacing: 3, bold: true, margin: 0 });
  s.addText("Ship AI in 5.5 Kilobytes", {
    x: 0.8, y: 0.55, w: 8.4, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("RVF containers pack model + logic + vector search + memory + security into one file.\nThe WASM runtime is 5.5KB. That's smaller than this sentence in most fonts.", {
    x: 0.8, y: 1.05, w: 8.4, h: 0.5, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const wasmApps = [
    {
      name: "rvDNA: Genomics on a Phone",
      desc: "3 BILLION DNA base pairs processed in <100ms. Variant calling at 155 ns/SNP. Horvath Clock biological age analysis. Pharmacogenomics drug dosing. All in a browser tab. A $50 phone becomes a genomics lab.",
      stats: "3B base pairs | <100ms | 7.2KB WASM", color: C.accent
    },
    {
      name: "Offline Field Intelligence",
      desc: "Entire equipment manual + troubleshooting history + diagnostic AI in one .rvf file. The file IS the server. Works underground, underwater, in a mine shaft. Agent carries full organizational knowledge without connectivity.",
      stats: "Zero backend | Zero latency | Full AI", color: C.sky
    },
    {
      name: "Browser-Native Enterprise Search",
      desc: "Micro-HNSW runs the complete vector search engine client-side. User opens a web page \u2014 no installation, no server, no API keys. Search 100K+ documents semantically in the browser. IT deploys nothing.",
      stats: "7.2KB engine | Client-side | Zero infra", color: C.accentAlt
    },
  ];

  wasmApps.forEach((wa, i) => {
    const wy = 1.75 + i * 1.1;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: wy, w: 8.4, h: 0.9, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: wy, w: 0.06, h: 0.9, fill: { color: wa.color } });
    s.addText(wa.name, { x: 1.1, y: wy + 0.05, w: 4, h: 0.25, fontSize: 13, fontFace: "Consolas", color: wa.color, bold: true, margin: 0 });
    s.addText(wa.stats, { x: 5.5, y: wy + 0.05, w: 3.5, h: 0.25, fontSize: 10, fontFace: "Consolas", color: wa.color, align: "right", margin: 0 });
    s.addText(wa.desc, { x: 1.1, y: wy + 0.35, w: 7.8, h: 0.5, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Three-tier callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5.1, w: 8.4, h: 0.4, fill: { color: C.bgAlt } });
  s.addText("Three compute tiers: WASM (5.5KB, browser) \u2192 eBPF (kernel bypass, 10Gbps+) \u2192 Unikernel (125ms Linux boot, bare metal)", {
    x: 1.0, y: 5.1, w: 8, h: 0.4, fontSize: 10.5, fontFace: "Calibri", color: C.accent, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 3D: IMPOSSIBLE APP — KNOWLEDGE INTEGRATION
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("ONLY POSSIBLE WITH RUVNET", { x: 0.8, y: 0.3, w: 4, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.warn, charSpacing: 3, bold: true, margin: 0 });
  s.addText("Integrate at the Knowledge Level, Not SQL", {
    x: 0.8, y: 0.55, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });

  // Old way vs New way
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4.1, h: 1.5, fill: { color: "1A1520" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4.1, h: 0.04, fill: { color: C.red } });
  s.addText("SQL-Level Integration (Traditional)", { x: 1.0, y: 1.35, w: 3.7, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.red, bold: true, margin: 0 });
  s.addText([
    { text: "Months of ETL pipeline development", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "Breaks when source schemas change", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "Can't join unstructured data (PDFs, Slack, email)", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.muted } },
    { text: "$500K-$2M projects, 6-12 months delivery", options: { bullet: true, fontSize: 10.5, color: C.red } },
  ], { x: 1.0, y: 1.65, w: 3.7, h: 1.0, fontFace: "Calibri", paraSpaceAfter: 3 });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.25, w: 4.1, h: 1.5, fill: { color: "0D2A2E" }, shadow: shadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.25, w: 4.1, h: 0.04, fill: { color: C.accent } });
  s.addText("Knowledge-Level Integration (RuvNet)", { x: 5.3, y: 1.35, w: 3.7, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  s.addText([
    { text: "RuVector embeds everything into semantic space", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Self-healing: adapts automatically to changes", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Joins by meaning: PDFs + SQL + Slack + email", options: { bullet: true, breakLine: true, fontSize: 10.5, color: C.mutedLight } },
    { text: "Weeks, not months. Knowledge graphs, not ETL.", options: { bullet: true, fontSize: 10.5, color: C.accent } },
  ], { x: 5.3, y: 1.65, w: 3.7, h: 1.0, fontFace: "Calibri", paraSpaceAfter: 3 });

  // Three real examples
  s.addText("What This Enables", { x: 0.8, y: 3.0, w: 4, h: 0.3, fontSize: 13, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });

  const kiExamples = [
    {
      name: "Microbiome Discovery",
      desc: "250M agents analyzed 40GB across 8,000 biological samples. GNN + HNSW discovered Huntington's disease \u2194 gut microbiome correlations that human researchers hadn't identified. 187M interactions/sec. The AI was the researcher.",
      color: C.accent
    },
    {
      name: "Enterprise-Wide Search",
      desc: "\"Show me everything about the Acme deal\" searches Salesforce, Jira, Confluence, Slack, email, and PDFs \u2014 by meaning, not keywords. One HNSW query, 61\u00B5s, every system. No connectors, no schema mapping.",
      color: C.sky
    },
    {
      name: "Legacy COBOL Bridge",
      desc: "COBOL systems from the 1990s connected to modern REST APIs via knowledge embeddings in one afternoon. No rewrite. No translation layer. The vector embeddings understand both COBOL copybooks and JSON schemas.",
      color: C.accentAlt
    },
  ];

  kiExamples.forEach((ki, i) => {
    const ky = 3.4 + i * 0.7;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ky, w: 8.4, h: 0.55, fill: { color: C.bgCard } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ky, w: 0.06, h: 0.55, fill: { color: ki.color } });
    s.addText(ki.name, { x: 1.1, y: ky + 0.03, w: 2, h: 0.2, fontSize: 10.5, fontFace: "Consolas", color: ki.color, bold: true, margin: 0 });
    s.addText(ki.desc, { x: 1.1, y: ky + 0.23, w: 7.8, h: 0.3, fontSize: 9.5, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 4: RUFLO (ORCHESTRATION)
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Ruflo: Multi-Agent Orchestration", {
    x: 0.8, y: 0.35, w: 8, h: 0.5, fontSize: 28, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("The brain that coordinates 150+ agent types across 5 network topologies.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Topologies
  s.addText("Swarm Topologies", { x: 0.8, y: 1.35, w: 4, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
  const topos = [
    { name: "Hierarchical", desc: "Queen-led with anti-drift detection" },
    { name: "Mesh", desc: "Peer-to-peer, Byzantine fault tolerant" },
    { name: "Ring", desc: "Token-passing coordination" },
    { name: "Star", desc: "Central hub routing" },
    { name: "Adaptive", desc: "Topology shifts under load" },
  ];
  topos.forEach((t, i) => {
    const ty = 1.75 + i * 0.38;
    s.addText(t.name, { x: 0.8, y: ty, w: 1.5, h: 0.32, fontSize: 11, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(t.desc, { x: 2.4, y: ty, w: 2.6, h: 0.32, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Hive Mind + Scale
  s.addText("Scale & Coordination", { x: 5.5, y: 1.35, w: 4, h: 0.3, fontSize: 14, fontFace: "Consolas", color: C.sky, bold: true, margin: 0 });
  const scaleItems = [
    { title: "Hive Mind", desc: "1,000+ agents with sub-ms shared memory via PostgreSQL advisory locks" },
    { title: "Emily OS", desc: "2 to 100,000 agents, LLM-agnostic, horizontal scaling" },
    { title: "Raft Consensus", desc: "Leader election, multi-master replication with CRDT support" },
    { title: "Gossip Protocol", desc: "Drift detection, behavioral monitoring across agents" },
  ];
  scaleItems.forEach((sc, i) => {
    const sy = 1.75 + i * 0.55;
    s.addText(sc.title, { x: 5.5, y: sy, w: 2, h: 0.25, fontSize: 11, fontFace: "Consolas", color: C.sky, bold: true, margin: 0 });
    s.addText(sc.desc, { x: 5.5, y: sy + 0.22, w: 4, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Bottom stats
  const rufloStats = [
    { num: "150+", label: "Agent Types" },
    { num: "5", label: "Topologies" },
    { num: "100K", label: "Agent Scale" },
    { num: "<1ms", label: "Shared Memory" },
  ];
  rufloStats.forEach((st, i) => {
    const sx = 0.8 + i * 2.3;
    s.addText(st.num, { x: sx, y: 4.3, w: 2, h: 0.45, fontSize: 26, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: sx, y: 4.7, w: 2, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5: RUVECTOR
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
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.35, w: 4.1, h: 3.2, fill: { color: C.bgCard }, shadow: shadow() });
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
    "Temperature-tiered quantization",
  ];
  s.addText(
    rvCaps.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < rvCaps.length - 1, fontSize: 10.5, color: C.mutedLight } })),
    { x: 1.0, y: 1.85, w: 3.7, h: 2.5, fontFace: "Calibri", paraSpaceAfter: 5 }
  );

  // Right: RVCOW
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.35, w: 4.1, h: 3.2, fill: { color: C.bgCard }, shadow: shadow() });
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
    { text: "28ns", options: { fontSize: 10, color: C.accent, bold: true, breakLine: true } },
    { text: "Row-level security per tenant", options: { fontSize: 10, color: C.muted } },
  ], { x: 5.3, y: 3.65, w: 3.7, h: 0.7, fontFace: "Calibri", margin: 0 });

  // Bottom stat
  const rvStats = [
    { num: "61\u00B5s", label: "HNSW Search" },
    { num: "8,000x", label: "vs Pinecone" },
    { num: "290+", label: "SQL Functions" },
    { num: "200x", label: "COW Savings" },
  ];
  rvStats.forEach((st, i) => {
    const sx = 0.8 + i * 2.3;
    s.addText(st.num, { x: sx, y: 4.7, w: 2, h: 0.4, fontSize: 22, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: sx, y: 5.05, w: 2, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 6: RVF CONTAINER
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
    x: 1.0, y: 4.6, w: 8, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.accent, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 7: AIMDS SECURITY
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
    s.addText("STAGE " + (i + 1) + ": " + st.name, { x: sx + 0.12, y: 1.45, w: 2.5, h: 0.25, fontSize: 10, fontFace: "Consolas", color: st.color, bold: true, margin: 0 });
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
  // SLIDE 8: SONA + REASONINGBANK
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
  // SLIDE 9: NERVOUS SYSTEM
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
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5.0, w: 8.4, h: 0.45, fill: { color: C.bgAlt } });
  s.addText("Circadian Controller: 5-50x compute savings during quiet periods \u2014 the system sleeps when you do", {
    x: 1.0, y: 5.0, w: 8, h: 0.45, fontSize: 11, fontFace: "Calibri", color: C.accent, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 10: PRIME RADIANT
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Prime Radiant: Formal Anti-Hallucination", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.5, fontSize: 26, fontFace: "Cambria", color: C.white, bold: true, margin: 0
  });
  s.addText("Mathematical proofs, not confidence scores. If any engine disagrees, output is flagged.", {
    x: 0.8, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const engines = [
    { name: "Cohomology Engine", items: ["Sheaf Laplacian mathematics", "Cross-section consistency", "Structural coherence verification"], color: C.accent },
    { name: "Spectral Engine", items: ["Eigenvalue analysis", "Spectral gap measurement", "Frequency-domain coherence"], color: C.sky },
    { name: "Causal Engine", items: ["Pearl's do-calculus", "Confounder detection", "Causal graph inference"], color: C.accentAlt },
  ];

  engines.forEach((e, i) => {
    const ex = 0.8 + i * 2.9;
    s.addShape(pres.shapes.RECTANGLE, { x: ex, y: 1.35, w: 2.7, h: 1.8, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: ex, y: 1.35, w: 2.7, h: 0.04, fill: { color: e.color } });
    s.addText(e.name, { x: ex + 0.12, y: 1.45, w: 2.5, h: 0.3, fontSize: 12, fontFace: "Consolas", color: e.color, bold: true, margin: 0 });
    s.addText(
      e.items.map((item, j) => ({ text: item, options: { bullet: true, breakLine: j < e.items.length - 1, fontSize: 10.5, color: C.muted } })),
      { x: ex + 0.12, y: 1.85, w: 2.5, h: 1.1, fontFace: "Calibri", paraSpaceAfter: 5 }
    );
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.4, w: 8.4, h: 0.6, fill: { color: "1A1520" } });
  s.addText("Deployed: 12-agent swarm, ~35K lines of code, hierarchical mesh coordination", {
    x: 1.0, y: 3.4, w: 4, h: 0.3, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0
  });
  s.addText("Confidence scores can be wrong. Mathematical proofs cannot.", {
    x: 1.0, y: 3.7, w: 6, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.accent, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 11: GRAPH ANALYTICS
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
    const px = 0.8 + i * 2.9;
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 4.25, w: 2.7, h: 0.7, fill: { color: C.bgAlt } });
    s.addText(p.who, { x: px + 0.1, y: 4.28, w: 2.5, h: 0.2, fontSize: 10, fontFace: "Consolas", color: C.warn, bold: true, margin: 0 });
    s.addText(p.result, { x: px + 0.1, y: 4.48, w: 2.5, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.mutedLight, margin: 0 });
    s.addText(p.how, { x: px + 0.1, y: 4.68, w: 2.5, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 12: BENCHMARKS
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
    { text: "RuVector", options: { bold: true, color: C.accent, fontSize: 10, fontFace: "Consolas", fill: { color: C.bgAlt }, align: "center" } },
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
    bRow("Reflex Response", "<1\u00B5s", "N/A", "Unique"),
    bRow("Agent Scale", "100K", "~10-50", "2,000x+"),
    bRow("SWE-Bench", "84.8%", "33.2% (GPT-4o)", "2.5x"),
  ], {
    x: 0.8, y: 1.35, w: 8.4,
    colW: [2.2, 1.8, 2.4, 2.0],
    border: { pt: 0.5, color: "2A3550" },
    rowH: [0.32, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  });

  // Big callout stats
  const bigStats = [
    { num: "8,000x", label: "Vector Search" },
    { num: "4,000x", label: "Stream Processing" },
    { num: "167x", label: "Threat Detection" },
    { num: "18,000x", label: "Smaller Runtime" },
  ];
  bigStats.forEach((st, i) => {
    s.addText(st.num, { x: 0.8 + i * 2.3, y: 4.35, w: 2, h: 0.4, fontSize: 22, fontFace: "Consolas", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: 0.8 + i * 2.3, y: 4.7, w: 2, h: 0.2, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 13: INTEGRATION
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

  // ═══════════════════════════════════════════════════════════
  // SLIDE 14: IMPLEMENTATION ROADMAP
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
      name: "Phase 1: Foundation", when: "Week 1-2",
      items: ["Core RuVector PostgreSQL extension", "AIMDS security middleware", "Basic agent deployment", "HNSW index configuration"],
      color: C.accent
    },
    {
      name: "Phase 2: Intelligence", when: "Week 3-4",
      items: ["AgentDB memory (4 types)", "ReasoningBank + SONA", "Ruflo orchestration", "MCP tool integration"],
      color: C.sky
    },
    {
      name: "Phase 3: Customization", when: "Month 2",
      items: ["Custom agent development", "Domain-specific LoRA training", "Graph analytics deployment", "Performance tuning"],
      color: C.accentAlt
    },
    {
      name: "Phase 4: Scale", when: "Month 3+",
      items: ["Production scaling + monitoring", "WASM edge deployment", "Multi-tenant RVCOW", "Advanced swarm topologies"],
      color: C.warn
    },
  ];

  phases.forEach((ph, i) => {
    const px = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.35, w: 2.05, h: 3.2, fill: { color: C.bgCard }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.35, w: 2.05, h: 0.04, fill: { color: ph.color } });
    s.addText(ph.name, { x: px + 0.1, y: 1.45, w: 1.85, h: 0.3, fontSize: 11, fontFace: "Consolas", color: ph.color, bold: true, margin: 0 });
    s.addText(ph.when, { x: px + 0.1, y: 1.75, w: 1.85, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
    s.addText(
      ph.items.map((item, j) => ({ text: item, options: { bullet: true, breakLine: j < ph.items.length - 1, fontSize: 9.5, color: C.mutedLight } })),
      { x: px + 0.1, y: 2.1, w: 1.85, h: 2.2, fontFace: "Calibri", paraSpaceAfter: 5 }
    );
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.75, w: 8.4, h: 0.45, fill: { color: C.bgAlt } });
  s.addText("Each phase delivers standalone value. No big-bang migration required.", {
    x: 1.0, y: 4.75, w: 8, h: 0.45, fontSize: 12, fontFace: "Calibri", color: C.accent, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 15: CTA
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

  s.addText("MIT License  |  Production Ready  |  Enterprise Support Available", {
    x: 0.8, y: 4.8, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0
  });
  s.addText("ruvnet.com  |  hello@ruvnet.com", {
    x: 0.8, y: 5.15, w: 8, h: 0.3, fontSize: 13, fontFace: "Consolas", color: C.accent, bold: true, margin: 0
  });

  await pres.writeFile({ fileName: "/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/docs/presentations/CTO-Deck-RuvNet-2026.pptx" });
  console.log("CTO deck written successfully");
}

build().catch(console.error);
