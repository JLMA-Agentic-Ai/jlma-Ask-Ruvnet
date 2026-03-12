const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// ─── Icon rendering ────────────────────────────────────────
function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ─── Color Palette ─────────────────────────────────────────
const C = {
  bg:        "0B0F1A",   // near-black
  bgCard:    "141929",   // dark card
  bgAlt:     "1A2035",   // slightly lighter
  accent:    "00D4AA",   // tech teal/green
  accentAlt: "6C63FF",   // purple
  warn:      "FF6B6B",   // coral red
  gold:      "FFD93D",   // gold
  white:     "FFFFFF",
  muted:     "8899AA",
  mutedLight:"B0BEC5",
  light:     "F0F4F8",
};

// Helpers
const shadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.3 });
const cardShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.2 });

async function build() {
  const { FaRocket, FaBrain, FaShieldAlt, FaChartLine, FaCubes, FaGlobe, FaUsers, FaLock, FaBolt, FaCheckCircle, FaExclamationTriangle, FaServer, FaCloud, FaLaptop, FaMicrochip } = require("react-icons/fa");

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "RuvNet";
  pres.title = "RuvNet — The Complete Agentic Intelligence Platform";

  // ═══════════════════════════════════════════════════════════
  // SLIDE 1: TITLE
  // ═══════════════════════════════════════════════════════════
  let s = pres.addSlide();
  s.background = { color: C.bg };

  // Accent gradient strip at top
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("RUVNET", {
    x: 0.8, y: 0.8, w: 8.4, h: 0.7,
    fontSize: 18, fontFace: "Arial", color: C.accent, charSpacing: 8, bold: true,
    margin: 0
  });

  s.addText("Your AI Projects\nAre Failing.", {
    x: 0.8, y: 1.6, w: 8.4, h: 1.6,
    fontSize: 48, fontFace: "Georgia", color: C.white, bold: true,
    margin: 0
  });

  s.addText("87% of enterprise AI pilots never reach production.\nRuvNet is the infrastructure that fixes that.", {
    x: 0.8, y: 3.4, w: 7, h: 0.9,
    fontSize: 18, fontFace: "Calibri", color: C.muted,
    margin: 0
  });

  // Stats bar at bottom
  const stats = [
    { num: "500K+", label: "Downloads" },
    { num: "12K+", label: "GitHub Stars" },
    { num: "100K+", label: "Community" },
    { num: "80+", label: "Rust Crates" },
  ];
  stats.forEach((st, i) => {
    const sx = 0.8 + i * 2.2;
    s.addText(st.num, { x: sx, y: 4.5, w: 2, h: 0.4, fontSize: 22, fontFace: "Arial", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: sx, y: 4.85, w: 2, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("Open Source  |  MIT License  |  ruvnet.com", {
    x: 0.8, y: 5.15, w: 8, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 2: THE PROBLEM
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("The $2.4 Trillion Problem", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("Enterprise AI spending is massive. But most of it is wasted.", {
    x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Big number callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 3.5, h: 2.2, fill: { color: C.bgCard }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 0.06, h: 2.2, fill: { color: C.warn } });
  s.addText("87%", { x: 1.1, y: 1.75, w: 3, h: 0.8, fontSize: 54, fontFace: "Arial", color: C.warn, bold: true, margin: 0 });
  s.addText("of enterprise AI pilots\nnever reach production", { x: 1.1, y: 2.5, w: 3, h: 0.6, fontSize: 15, fontFace: "Calibri", color: C.mutedLight, margin: 0 });
  s.addText("\u2014 Gartner", { x: 1.1, y: 3.1, w: 3, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.muted, italic: true, margin: 0 });

  // Why they fail - right side
  s.addText("Why They Fail", { x: 5.2, y: 1.6, w: 4, h: 0.4, fontSize: 18, fontFace: "Georgia", color: C.white, bold: true, margin: 0 });

  const failures = [
    { title: "No orchestration", desc: "Who coordinates 50+ AI agents?" },
    { title: "No memory", desc: "Agents forget everything between sessions" },
    { title: "No security", desc: "Prompt injection goes undetected" },
    { title: "No offline", desc: "No internet = no intelligence" },
    { title: "No learning", desc: "Systems never get smarter" },
  ];
  failures.forEach((f, i) => {
    const fy = 2.15 + i * 0.4;
    s.addText(f.title, { x: 5.2, y: fy, w: 1.8, h: 0.35, fontSize: 13, fontFace: "Arial", color: C.warn, bold: true, margin: 0 });
    s.addText(f.desc, { x: 7.0, y: fy, w: 2.5, h: 0.35, fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.2, w: 8.4, h: 0.5, fill: { color: C.bgAlt } });
  s.addText("AI vendors give you an engine. You still have to build the car, the road, and the traffic system.", {
    x: 1.1, y: 4.2, w: 8, h: 0.5, fontSize: 13, fontFace: "Calibri", color: C.accent, italic: true, margin: 0, valign: "middle"
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 3: WHAT'S MISSING
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("What Every AI Provider Is Missing", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("They ship the model. You build the other 11 layers.", {
    x: 0.8, y: 0.95, w: 8, h: 0.35, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Comparison table
  const headers = [
    { text: "Capability", options: { bold: true, color: C.accent, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt } } },
    { text: "OpenAI", options: { bold: true, color: C.mutedLight, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Anthropic", options: { bold: true, color: C.mutedLight, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Google", options: { bold: true, color: C.mutedLight, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt }, align: "center" } },
    { text: "RuvNet", options: { bold: true, color: C.accent, fontSize: 11, fontFace: "Arial", fill: { color: "0D2920" }, align: "center" } },
  ];

  const makeRow = (cap, o, a, g, r) => [
    { text: cap, options: { fontSize: 10, fontFace: "Calibri", color: C.mutedLight, fill: { color: C.bgCard } } },
    { text: o, options: { fontSize: 10, fontFace: "Calibri", color: o === "Yes" ? C.accent : C.warn, fill: { color: C.bgCard }, align: "center" } },
    { text: a, options: { fontSize: 10, fontFace: "Calibri", color: a === "Yes" ? C.accent : C.warn, fill: { color: C.bgCard }, align: "center" } },
    { text: g, options: { fontSize: 10, fontFace: "Calibri", color: g === "Yes" ? C.accent : C.warn, fill: { color: C.bgCard }, align: "center" } },
    { text: r, options: { fontSize: 10, fontFace: "Calibri", color: C.accent, fill: { color: "0D2920" }, align: "center", bold: true } },
  ];

  const tableData = [
    headers,
    makeRow("LLM API", "Yes", "Yes", "Yes", "Yes"),
    makeRow("Multi-Agent Orchestration", "No", "No", "No", "Yes"),
    makeRow("Persistent Memory", "No", "No", "No", "Yes"),
    makeRow("Vector Search (<100\u00B5s)", "No", "No", "No", "Yes"),
    makeRow("Security Middleware", "No", "No", "No", "Yes"),
    makeRow("Offline / Air-Gapped", "No", "No", "No", "Yes"),
    makeRow("Self-Learning", "No", "No", "No", "Yes"),
    makeRow("Anti-Hallucination", "No", "No", "No", "Yes"),
    makeRow("WASM Runtime (7.2KB)", "No", "No", "No", "Yes"),
  ];

  s.addTable(tableData, {
    x: 0.8, y: 1.5, w: 8.4,
    colW: [2.8, 1.3, 1.3, 1.3, 1.7],
    border: { pt: 0.5, color: "2A3045" },
    rowH: [0.35, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  });

  s.addText("Every provider excels at the model layer. None provide the other 8 layers needed for production.", {
    x: 0.8, y: 4.7, w: 8.4, h: 0.4, fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 4: THE SOLUTION
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("RuvNet: The Complete Agentic Stack", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.6, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Six integrated modules that turn AI models into production-grade autonomous systems.", {
    x: 0.8, y: 0.95, w: 8, h: 0.35, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // 6 module cards - 3x2 grid
  const modules = [
    { name: "Ruflo", role: "The Brain", desc: "Coordinates 150+ agent types\nacross 5 network topologies", stat: "500K downloads", color: C.accent },
    { name: "RuVector", role: "The Search Engine", desc: "Finds anything in 61\u00B5s.\nNative PostgreSQL, not bolted-on RAG", stat: "8,000x faster", color: "0EA5E9" },
    { name: "AgentDB", role: "The Memory", desc: "4 memory types. Agents remember\neverything across sessions", stat: "12,500x retrieval", color: C.accentAlt },
    { name: "AIMDS", role: "The Immune System", desc: "Detects 6 attack types in 0.06ms.\nChaos theory-based security", stat: "12K+ req/sec", color: C.warn },
    { name: "RVF", role: "The Container", desc: "Pack AI into a single file.\nBrowser, kernel, or bare metal", stat: "5.5KB runtime", color: C.gold },
    { name: "SONA", role: "The Teacher", desc: "System gets smarter with every\ndecision. Zero cost learning", stat: "$0 per cycle", color: "E879F9" },
  ];

  modules.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const mx = 0.8 + col * 2.9;
    const my = 1.55 + row * 1.85;

    s.addShape(pres.shapes.RECTANGLE, { x: mx, y: my, w: 2.7, h: 1.65, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: mx, y: my, w: 2.7, h: 0.05, fill: { color: m.color } });
    s.addText(m.name, { x: mx + 0.15, y: my + 0.15, w: 2.4, h: 0.3, fontSize: 14, fontFace: "Arial", color: m.color, bold: true, margin: 0 });
    s.addText(m.role, { x: mx + 0.15, y: my + 0.4, w: 2.4, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
    s.addText(m.desc, { x: mx + 0.15, y: my + 0.65, w: 2.4, h: 0.5, fontSize: 9.5, fontFace: "Calibri", color: C.muted, margin: 0 });
    s.addText(m.stat, { x: mx + 0.15, y: my + 1.25, w: 2.4, h: 0.25, fontSize: 10, fontFace: "Arial", color: m.color, bold: true, margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5: CASE STUDY — FOX FLOW
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("PROOF", { x: 0.8, y: 0.35, w: 2, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.accent, charSpacing: 4, margin: 0 });
  s.addText("Real Teams. Real Results.", {
    x: 0.8, y: 0.6, w: 8, h: 0.55, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  // Case study cards
  const cases = [
    {
      name: "Fox Flow", org: "Community Builder",
      result: "12.8M queries/sec", context: "4,000x faster than Redis",
      detail: "Built a database on RuVector that processes 12.8 million queries per second \u2014 four thousand times faster than Redis."
    },
    {
      name: "QE Fleet", org: "Quality Engineering",
      result: "51 autonomous agents", context: "Across 12 domains",
      detail: "Deployed 51 AI agents across 12 business domains for fully autonomous quality engineering. Zero manual coordination."
    },
    {
      name: "Bill Sentry", org: "Healthcare",
      result: "30 years expertise", context: "Automated medical billing",
      detail: "A doctor with 30 years of AI experience built automated medical billing fraud detection \u2014 real clinical use, real savings."
    },
    {
      name: "Finland Gov", org: "Government",
      result: "National scale", context: "AI-native transformation",
      detail: "National government deploying RuvNet for AI-native public services \u2014 the first country-scale agentic deployment."
    },
  ];

  cases.forEach((c, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const cx = 0.8 + col * 4.4;
    const cy = 1.35 + row * 1.95;

    s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: 4.1, h: 1.7, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: 0.06, h: 1.7, fill: { color: C.accent } });
    s.addText(c.name, { x: cx + 0.2, y: cy + 0.1, w: 2, h: 0.3, fontSize: 15, fontFace: "Arial", color: C.white, bold: true, margin: 0 });
    s.addText(c.org, { x: cx + 2.2, y: cy + 0.1, w: 1.7, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.muted, align: "right", margin: 0 });
    s.addText(c.result, { x: cx + 0.2, y: cy + 0.45, w: 3.5, h: 0.35, fontSize: 20, fontFace: "Arial", color: C.accent, bold: true, margin: 0 });
    s.addText(c.context, { x: cx + 0.2, y: cy + 0.8, w: 3.5, h: 0.2, fontSize: 11, fontFace: "Calibri", color: C.gold, margin: 0 });
    s.addText(c.detail, { x: cx + 0.2, y: cy + 1.05, w: 3.7, h: 0.5, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("These aren't our demos. These are our community's production deployments.", {
    x: 0.8, y: 5.0, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.muted, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5A: WHAT BUILDERS SAY (Community Voices)
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("COMMUNITY", { x: 0.8, y: 0.3, w: 3, h: 0.25, fontSize: 11, fontFace: "Arial", color: C.accent, charSpacing: 3, bold: true, margin: 0 });
  s.addText("What Builders Say", {
    x: 0.8, y: 0.55, w: 8.4, h: 0.55, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  const quotes = [
    {
      quote: "We built a database on RuVector that processes 12.8 million queries per second \u2014 4,000x faster than Redis.",
      author: "Fox Flow",
      role: "Community Builder",
      color: C.accent,
    },
    {
      quote: "51 autonomous agents across 12 domains. Zero manual coordination.",
      author: "QE Fleet",
      role: "Quality Engineering",
      color: "0EA5E9",
    },
    {
      quote: "30 years of medical AI experience. RuvNet is the first stack that actually works in production.",
      author: "Bill Sentry",
      role: "Healthcare AI",
      color: C.accentAlt,
    },
    {
      quote: "National-scale AI-native transformation \u2014 the first country doing this.",
      author: "Finland Gov",
      role: "Government",
      color: C.gold,
    },
  ];

  quotes.forEach((q, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const qx = 0.8 + col * 4.4;
    const qy = 1.3 + row * 1.8;

    // Card background
    s.addShape(pres.shapes.RECTANGLE, { x: qx, y: qy, w: 4.1, h: 1.55, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: qx, y: qy, w: 0.06, h: 1.55, fill: { color: q.color } });

    // Opening quotation mark
    s.addText("\u201C", {
      x: qx + 0.15, y: qy + 0.0, w: 0.5, h: 0.5,
      fontSize: 36, fontFace: "Georgia", color: q.color, margin: 0
    });

    // Quote text
    s.addText(q.quote, {
      x: qx + 0.2, y: qy + 0.35, w: 3.7, h: 0.75,
      fontSize: 11, fontFace: "Georgia", color: C.mutedLight, italic: true, margin: 0
    });

    // Attribution
    s.addText(q.author, {
      x: qx + 0.2, y: qy + 1.2, w: 2.5, h: 0.25,
      fontSize: 12, fontFace: "Arial", color: q.color, bold: true, margin: 0
    });
    s.addText(q.role, {
      x: qx + 0.2, y: qy + 1.42, w: 2.5, h: 0.2,
      fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0
    });
  });

  s.addText("These are unsolicited testimonials from production users.", {
    x: 0.8, y: 5.0, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.muted, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5B: ONLY WITH RUVNET — DATA SOVEREIGNTY
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("ONLY WITH RUVNET", { x: 0.8, y: 0.3, w: 3, h: 0.25, fontSize: 11, fontFace: "Arial", color: C.warn, charSpacing: 3, bold: true, margin: 0 });
  s.addText("Your Data Never Leaves Your Building", {
    x: 0.8, y: 0.55, w: 8.4, h: 0.55, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  // The problem
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4.1, h: 2.8, fill: { color: "1A1520" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4.1, h: 0.05, fill: { color: C.warn } });
  s.addText("How AI Works Today", { x: 1.0, y: 1.4, w: 3.5, h: 0.3, fontSize: 14, fontFace: "Arial", color: C.warn, bold: true, margin: 0 });
  s.addText([
    { text: "Every query sends your data to OpenAI/Google/Anthropic servers", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Your trade secrets, customer data, IP \u2014 all transmitted externally", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "You can't audit what happens to your data on their infrastructure", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Compliance teams block AI adoption because of data leakage risk", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Result: 87% of AI pilots die in legal review", options: { bullet: true, fontSize: 11, color: C.warn } },
  ], { x: 1.0, y: 1.8, w: 3.7, h: 2.0, fontFace: "Calibri", paraSpaceAfter: 6 });

  // The RuvNet way
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.25, w: 4.1, h: 2.8, fill: { color: "0D2920" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.25, w: 4.1, h: 0.05, fill: { color: C.accent } });
  s.addText("How RuvNet Works", { x: 5.3, y: 1.4, w: 3.5, h: 0.3, fontSize: 14, fontFace: "Arial", color: C.accent, bold: true, margin: 0 });
  s.addText([
    { text: "RuVector runs inside your PostgreSQL \u2014 your servers, your network", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "AIMDS scans every input AND output for data leakage", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "RVF containers run air-gapped \u2014 zero internet required", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Cryptographic witness chains prove exactly what happened", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Result: HIPAA, GDPR, ITAR, SOC 2 compliance by architecture", options: { bullet: true, fontSize: 11, color: C.accent } },
  ], { x: 5.3, y: 1.8, w: 3.7, h: 2.0, fontFace: "Calibri", paraSpaceAfter: 6 });

  // Example
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.25, w: 8.4, h: 1.1, fill: { color: C.bgAlt } });
  s.addText("EXAMPLE: A bank wants AI to analyze 10 years of loan performance data", {
    x: 1.0, y: 4.3, w: 8, h: 0.25, fontSize: 12, fontFace: "Arial", color: C.accent, bold: true, margin: 0
  });
  s.addText("With OpenAI: Upload millions of records to their servers. Compliance says no. Project dies.\nWith RuvNet: Deploy RuVector on your existing PostgreSQL. Add AIMDS middleware. AI analyzes everything locally. Zero data leaves the building. Compliance approves day one.", {
    x: 1.0, y: 4.6, w: 8, h: 0.7, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5C: ONLY WITH RUVNET — WASM SHRINKING
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("ONLY WITH RUVNET", { x: 0.8, y: 0.2, w: 3, h: 0.2, fontSize: 10, fontFace: "Arial", color: C.warn, charSpacing: 3, bold: true, margin: 0 });
  s.addText("Full AI on Your Phone.\nNo Cloud. No Backend.", {
    x: 0.8, y: 0.45, w: 8.4, h: 0.7, fontSize: 24, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("RVF cognitive containers shrink an entire AI application \u2014 model, logic, vector search, memory, security \u2014 into a single file that runs in a browser tab or on a phone.", {
    x: 0.8, y: 1.3, w: 8.4, h: 0.4, fontSize: 12, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // What fits in 5.5KB
  const wasmExamples = [
    {
      name: "Genomic Diagnostics",
      desc: "Process 3 BILLION DNA base pairs in <100ms. On a $50 phone. In a browser. A rural clinic in Africa gets Johns Hopkins-level diagnostics.",
      stat: "155 ns/SNP", color: C.accent
    },
    {
      name: "Field Service AI",
      desc: "A technician's phone carries the complete equipment manual, troubleshooting history, and diagnostic AI. Works in a mine shaft with zero signal.",
      stat: "Zero connectivity", color: "0EA5E9"
    },
    {
      name: "Military Intelligence",
      desc: "Classified AI that never touches a network. Entire knowledge base + reasoning engine in one file on a ruggedized device.",
      stat: "Air-gapped by design", color: C.accentAlt
    },
    {
      name: "Patient Bedside AI",
      desc: "Hospital tablet runs drug interaction checks, vitals analysis, and treatment protocols. Patient data stays on the device. HIPAA is trivially solved.",
      stat: "Zero data transmission", color: C.gold
    },
  ];

  wasmExamples.forEach((we, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const wx = 0.8 + col * 4.4;
    const wy = 1.75 + row * 1.4;

    s.addShape(pres.shapes.RECTANGLE, { x: wx, y: wy, w: 4.1, h: 1.15, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: wx, y: wy, w: 0.06, h: 1.15, fill: { color: we.color } });
    s.addText(we.name, { x: wx + 0.2, y: wy + 0.05, w: 2.5, h: 0.25, fontSize: 13, fontFace: "Arial", color: we.color, bold: true, margin: 0 });
    s.addText(we.stat, { x: wx + 2.8, y: wy + 0.05, w: 1.2, h: 0.25, fontSize: 10, fontFace: "Arial", color: we.color, align: "right", margin: 0 });
    s.addText(we.desc, { x: wx + 0.2, y: wy + 0.38, w: 3.7, h: 0.6, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Size comparison bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.7, w: 8.4, h: 0.55, fill: { color: C.bgAlt } });
  s.addText("Docker image: 50-500 MB    |    Minimal container: 5-50 MB    |    RVF WASM: 5.5 KB (9,000x smaller)", {
    x: 1.0, y: 4.7, w: 8, h: 0.55, fontSize: 12, fontFace: "Arial", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 5D: ONLY WITH RUVNET — KNOWLEDGE INTEGRATION
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("ONLY WITH RUVNET", { x: 0.8, y: 0.3, w: 3, h: 0.25, fontSize: 11, fontFace: "Arial", color: C.warn, charSpacing: 3, bold: true, margin: 0 });
  s.addText("Connect Systems at the Knowledge Level", {
    x: 0.8, y: 0.55, w: 8.4, h: 0.55, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  // Old way vs New way
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4.1, h: 2.3, fill: { color: "1A1520" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.25, w: 4.1, h: 0.05, fill: { color: C.warn } });
  s.addText("Traditional Integration", { x: 1.0, y: 1.4, w: 3.5, h: 0.3, fontSize: 14, fontFace: "Arial", color: C.warn, bold: true, margin: 0 });
  s.addText([
    { text: "Months of ETL pipeline development", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "SQL-level joins \u2014 only works if schemas match", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Break when source systems change", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "Can't connect unstructured data (PDFs, emails, Slack)", options: { bullet: true, breakLine: true, fontSize: 11, color: C.muted } },
    { text: "$500K-$2M projects that take 6-12 months", options: { bullet: true, fontSize: 11, color: C.warn } },
  ], { x: 1.0, y: 1.8, w: 3.7, h: 1.5, fontFace: "Calibri", paraSpaceAfter: 5 });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.25, w: 4.1, h: 2.3, fill: { color: "0D2920" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.25, w: 4.1, h: 0.05, fill: { color: C.accent } });
  s.addText("Knowledge-Level Integration", { x: 5.3, y: 1.4, w: 3.5, h: 0.3, fontSize: 14, fontFace: "Arial", color: C.accent, bold: true, margin: 0 });
  s.addText([
    { text: "RuVector embeds everything into semantic vectors", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Meaning-level joins \u2014 works across any data format", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Self-healing: adapts when schemas change", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Connects PDFs, Slack, email, SQL, APIs seamlessly", options: { bullet: true, breakLine: true, fontSize: 11, color: C.mutedLight } },
    { text: "Weeks, not months. Knowledge graphs, not pipelines.", options: { bullet: true, fontSize: 11, color: C.accent } },
  ], { x: 5.3, y: 1.8, w: 3.7, h: 1.5, fontFace: "Calibri", paraSpaceAfter: 5 });

  // Concrete examples
  s.addText("What This Looks Like in Practice", { x: 0.8, y: 3.75, w: 4, h: 0.3, fontSize: 13, fontFace: "Arial", color: C.white, bold: true, margin: 0 });

  const kiExamples = [
    { name: "Insurance Claims", desc: "250M agents analyzed 40GB of medical data across 8,000 samples and DISCOVERED disease correlations humans missed. No ETL. No schema mapping." },
    { name: "Enterprise Search", desc: "One query searches across Salesforce, Jira, Confluence, Slack, and email \u2014 by meaning, not keywords. \"Show me everything about the Acme deal\" returns results from every system." },
    { name: "Legacy Modernization", desc: "COBOL systems from the 1990s connected to modern APIs in one afternoon via knowledge embeddings. No rewrite. No translation layer. The AI understands both." },
  ];

  kiExamples.forEach((ki, i) => {
    const ky = 4.1 + i * 0.5;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ky, w: 8.4, h: 0.42, fill: { color: C.bgCard } });
    s.addText(ki.name, { x: 0.9, y: ky + 0.03, w: 1.6, h: 0.36, fontSize: 10, fontFace: "Arial", color: C.accent, bold: true, valign: "middle", margin: 0 });
    s.addText(ki.desc, { x: 2.6, y: ky + 0.03, w: 6.4, h: 0.36, fontSize: 9.5, fontFace: "Calibri", color: C.muted, valign: "middle", margin: 0 });
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 6: THIS IS FREE (replaces "Algorithms Beat GPUs")
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("This Is Free \u2014 And That Should\nTerrify Your Competitors", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.85, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("RuvNet is open source. MIT license. Zero licensing cost. The entire 148-capability stack.", {
    x: 0.8, y: 1.25, w: 8.4, h: 0.4, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Big stats - 4 across
  const freeStats = [
    { num: "MIT", label: "License", color: C.accent },
    { num: "$0", label: "Licensing Cost", color: C.accent },
    { num: "148", label: "Capabilities", color: C.accent },
    { num: "80+", label: "Rust Crates", color: C.accent },
  ];

  freeStats.forEach((fs, i) => {
    const fx = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 1.85, w: 2.05, h: 1.5, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 1.85, w: 2.05, h: 0.05, fill: { color: fs.color } });
    s.addText(fs.num, {
      x: fx + 0.1, y: 2.05, w: 1.85, h: 0.7,
      fontSize: 36, fontFace: "Arial", color: fs.color, bold: true, align: "center", valign: "middle", margin: 0
    });
    s.addText(fs.label, {
      x: fx + 0.1, y: 2.8, w: 1.85, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.mutedLight, align: "center", margin: 0
    });
  });

  // Why free matters
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.6, w: 8.4, h: 0.7, fill: { color: "0D2920" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.6, w: 0.06, h: 0.7, fill: { color: C.accent } });
  s.addText("WHY FREE MATTERS", {
    x: 1.1, y: 3.65, w: 3, h: 0.25, fontSize: 10, fontFace: "Arial", color: C.accent, charSpacing: 2, bold: true, margin: 0
  });
  s.addText("Every dollar your competitor spends on licensing, you invest in capability. The gap compounds daily.", {
    x: 1.1, y: 3.9, w: 7.8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.mutedLight, margin: 0
  });

  // Bottom callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.55, w: 8.4, h: 0.65, fill: { color: C.bgAlt } });
  s.addText("This isn't a trial or freemium trap. This is the full production stack. Open source forever.", {
    x: 1.0, y: 4.55, w: 8, h: 0.65, fontSize: 14, fontFace: "Georgia", color: C.accent, italic: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 7: WASM REVOLUTION
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Intelligence at Every Endpoint", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("The entire vector search engine fits in 7.2 kilobytes. It runs in a browser tab.", {
    x: 0.8, y: 0.95, w: 8.5, h: 0.35, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Use cases grid
  const useCases = [
    { sector: "Healthcare", impact: "HIPAA trivially solved", detail: "Diagnostics run on the device. Patient data never leaves the hospital." },
    { sector: "Defense", impact: "Classified AI, zero network", detail: "Full AI capability in air-gapped environments. No internet required." },
    { sector: "Field Workers", impact: "Full AI without internet", detail: "Remote workers get complete AI on their laptop \u2014 offline, anywhere." },
    { sector: "Retail", impact: "Real-time recommendations", detail: "POS systems run AI locally. No cloud round-trip. Instant response." },
    { sector: "IoT / Edge", impact: "AI on every device", detail: "Sensors, cameras, devices \u2014 each one becomes an intelligent endpoint." },
    { sector: "Developing World", impact: "Same capability as anyone", detail: "A clinic in rural Africa gets the same AI as Johns Hopkins." },
  ];

  useCases.forEach((uc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const ux = 0.8 + col * 2.9;
    const uy = 1.55 + row * 1.7;

    s.addShape(pres.shapes.RECTANGLE, { x: ux, y: uy, w: 2.7, h: 1.45, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addText(uc.sector, { x: ux + 0.15, y: uy + 0.1, w: 2.4, h: 0.25, fontSize: 13, fontFace: "Arial", color: C.accent, bold: true, margin: 0 });
    s.addText(uc.impact, { x: ux + 0.15, y: uy + 0.38, w: 2.4, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.gold, bold: true, margin: 0 });
    s.addText(uc.detail, { x: ux + 0.15, y: uy + 0.7, w: 2.4, h: 0.55, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("This is not a feature. This is a paradigm shift. No one else can do this.", {
    x: 0.8, y: 5.0, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Georgia", color: C.accent, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 8: BEFORE & AFTER
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("What Changes When You Deploy RuvNet", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.5, fontSize: 24, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Concrete example: Support ticket resolution", {
    x: 0.8, y: 0.9, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Before column
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.5, w: 4.1, h: 3.3, fill: { color: "1A1520" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.5, w: 4.1, h: 0.45, fill: { color: "2A1520" } });
  s.addText("BEFORE  \u2014  45 minutes average", { x: 1.0, y: 1.5, w: 3.7, h: 0.45, fontSize: 13, fontFace: "Arial", color: C.warn, bold: true, valign: "middle", margin: 0 });

  const beforeItems = [
    "Manual ticket routing (5-10 min)",
    "Agent manually searches knowledge base (10 min)",
    "No memory of similar past tickets",
    "No learning from resolutions",
    "Escalation requires re-explaining context",
    "No security scanning of inputs",
    "Cloud-dependent \u2014 outage = no support",
  ];
  s.addText(
    beforeItems.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < beforeItems.length - 1, fontSize: 10.5, color: C.muted } })),
    { x: 1.0, y: 2.1, w: 3.7, h: 2.5, fontFace: "Calibri", paraSpaceAfter: 5 }
  );

  // After column
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.5, w: 4.1, h: 3.3, fill: { color: "0D2920" }, shadow: cardShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.5, w: 4.1, h: 0.45, fill: { color: "0D3930" } });
  s.addText("AFTER  \u2014  3 minutes average", { x: 5.3, y: 1.5, w: 3.7, h: 0.45, fontSize: 13, fontFace: "Arial", color: C.accent, bold: true, valign: "middle", margin: 0 });

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
    { x: 5.3, y: 2.1, w: 3.7, h: 2.5, fontFace: "Calibri", paraSpaceAfter: 5 }
  );

  // Result bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5.0, w: 8.4, h: 0.45, fill: { color: C.bgAlt } });
  s.addText("15x faster  |  Self-improving  |  Air-gapped capable  |  Full audit trail", {
    x: 1.0, y: 5.0, w: 8, h: 0.45, fontSize: 13, fontFace: "Arial", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 9: BENCHMARKS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Performance That Speaks For Itself", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Measured results. Not theoretical. Not marketing projections.", {
    x: 0.8, y: 0.95, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const benchHeaders = [
    { text: "Capability", options: { bold: true, color: C.accent, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt } } },
    { text: "RuvNet", options: { bold: true, color: C.accent, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Industry Baseline", options: { bold: true, color: C.muted, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt }, align: "center" } },
    { text: "Advantage", options: { bold: true, color: C.gold, fontSize: 11, fontFace: "Arial", fill: { color: C.bgAlt }, align: "center" } },
  ];

  const benchRow = (cap, ruv, baseline, adv) => [
    { text: cap, options: { fontSize: 11, fontFace: "Calibri", color: C.mutedLight, fill: { color: C.bgCard } } },
    { text: ruv, options: { fontSize: 11, fontFace: "Calibri", color: C.accent, fill: { color: C.bgCard }, align: "center", bold: true } },
    { text: baseline, options: { fontSize: 11, fontFace: "Calibri", color: C.muted, fill: { color: C.bgCard }, align: "center" } },
    { text: adv, options: { fontSize: 11, fontFace: "Arial", color: C.gold, fill: { color: C.bgCard }, align: "center", bold: true } },
  ];

  s.addTable([
    benchHeaders,
    benchRow("SWE-Bench Score", "84.8%", "GPT-4o: 33.2%", "2.5x"),
    benchRow("HNSW Vector Search", "61\u00B5s", "500ms+ (Pinecone)", "8,000x"),
    benchRow("Flash Attention", "2.49-7.47x", "Standard attention", "Up to 7.47x"),
    benchRow("Stream Processing", "12.8M QPS", "Redis: 3K QPS", "4,000x"),
    benchRow("Threat Detection", "0.06ms", "Rule-based: 10-50ms", "166-833x"),
    benchRow("Real-Time Learning", "<1ms, $0", "Days, $1K-$100K", "Instant"),
    benchRow("WASM Runtime", "5.5KB", "50MB+ containers", "9,000x smaller"),
    benchRow("Agent Scale", "100K agents", "10-50 agents", "2,000x+"),
  ], {
    x: 0.8, y: 1.5, w: 8.4,
    colW: [2.4, 2, 2.2, 1.8],
    border: { pt: 0.5, color: "2A3045" },
    rowH: [0.35, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32],
  });

  s.addText("Every number above is from actual benchmarks, not projections.", {
    x: 0.8, y: 4.7, w: 8.4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.muted, italic: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 10: WE BUILT THE FUTURE EARLY (replaces ROI)
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("We Built the Future 8 Months Early", {
    x: 0.8, y: 0.35, w: 8.4, h: 0.6, fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("In March 2026, Anthropic launched \"sub-agents\" for Claude Code. Ruflo shipped multi-agent orchestration in August 2025.", {
    x: 0.8, y: 0.95, w: 8.4, h: 0.45, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Timeline visual
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 8.4, h: 1.1, fill: { color: C.bgCard }, shadow: cardShadow() });

  // Aug 2025 marker
  s.addShape(pres.shapes.RECTANGLE, { x: 1.2, y: 1.75, w: 0.12, h: 0.8, fill: { color: C.accent } });
  s.addText("AUG 2025", { x: 1.5, y: 1.75, w: 1.5, h: 0.25, fontSize: 10, fontFace: "Arial", color: C.accent, bold: true, charSpacing: 1, margin: 0 });
  s.addText("Ruflo ships multi-agent\norchestration (sub-agents)", { x: 1.5, y: 2.0, w: 2.5, h: 0.4, fontSize: 11, fontFace: "Calibri", color: C.mutedLight, margin: 0 });

  // Arrow between
  s.addShape(pres.shapes.RECTANGLE, { x: 4.2, y: 2.05, w: 1.5, h: 0.04, fill: { color: C.muted } });
  s.addText("8 months", { x: 4.2, y: 1.8, w: 1.5, h: 0.25, fontSize: 10, fontFace: "Arial", color: C.gold, bold: true, align: "center", margin: 0 });

  // Mar 2026 marker
  s.addShape(pres.shapes.RECTANGLE, { x: 5.9, y: 1.75, w: 0.12, h: 0.8, fill: { color: C.muted } });
  s.addText("MAR 2026", { x: 6.2, y: 1.75, w: 1.5, h: 0.25, fontSize: 10, fontFace: "Arial", color: C.muted, bold: true, charSpacing: 1, margin: 0 });
  s.addText("Claude Code ships\nsub-agents (8 months later)", { x: 6.2, y: 2.0, w: 2.5, h: 0.4, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0 });

  // Subtitle
  s.addText("This pattern repeats across the stack. RuvNet doesn't follow the industry \u2014 the industry follows RuvNet.", {
    x: 0.8, y: 2.85, w: 8.4, h: 0.35, fontSize: 13, fontFace: "Georgia", color: C.accent, italic: true, margin: 0
  });

  // Proof points - 4 cards in a 2x2 grid
  const proofPoints = [
    {
      name: "RuVector",
      desc: "In-process vector search.",
      industry: "Industry still uses external vector databases.",
      color: C.accent,
    },
    {
      name: "AIMDS",
      desc: "Chaos theory security.",
      industry: "Industry still uses rule-based WAFs.",
      color: "0EA5E9",
    },
    {
      name: "RVF",
      desc: "5.5KB cognitive containers.",
      industry: "Industry still uses Docker (50-500MB).",
      color: C.accentAlt,
    },
    {
      name: "SONA",
      desc: "Self-optimizing neural architecture.",
      industry: "Industry uses static models.",
      color: C.gold,
    },
  ];

  proofPoints.forEach((pp, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = 0.8 + col * 4.4;
    const py = 3.35 + row * 0.85;

    s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 4.1, h: 0.7, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 0.06, h: 0.7, fill: { color: pp.color } });
    s.addText(pp.name, { x: px + 0.2, y: py + 0.05, w: 1.2, h: 0.25, fontSize: 12, fontFace: "Arial", color: pp.color, bold: true, margin: 0 });
    s.addText(pp.desc, { x: px + 1.4, y: py + 0.05, w: 2.5, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.mutedLight, margin: 0 });
    s.addText(pp.industry, { x: px + 0.2, y: py + 0.35, w: 3.7, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.muted, italic: true, margin: 0 });
  });

  // Bottom bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5.15, w: 8.4, h: 0.4, fill: { color: "0D2920" } });
  s.addText("Two standard deviations beyond state of the art. And it's free.", {
    x: 1.0, y: 5.15, w: 8, h: 0.4, fontSize: 13, fontFace: "Georgia", color: C.accent, bold: true, valign: "middle", align: "center", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 11: COMPOUND ADVANTAGE
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("The Compound Advantage", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Organizations deploying now accumulate advantages that cannot be replicated.", {
    x: 0.8, y: 0.95, w: 8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const advantages = [
    { title: "Proprietary Training Data", desc: "Every interaction generates training data unique to your organization. SONA converts this into LoRA adapters automatically. Your AI gets smarter from your data.", color: C.accent },
    { title: "Institutional AI Memory", desc: "Episodic + semantic + procedural memory builds organizational knowledge that no competitor can copy or purchase. Your AI knows your company.", color: "0EA5E9" },
    { title: "Domain-Specific Adapters", desc: "LoRA adapters fine-tuned on your data. Each adaptation makes the system more valuable and more differentiated from off-the-shelf AI.", color: C.accentAlt },
    { title: "Security Threat Intelligence", desc: "AIMDS learns from every attack attempt. Your security posture improves continuously \u2014 attackers train your defense against themselves.", color: C.gold },
  ];

  advantages.forEach((a, i) => {
    const ay = 1.45 + i * 0.82;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ay, w: 8.4, h: 0.72, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ay, w: 0.06, h: 0.72, fill: { color: a.color } });
    s.addText(a.title, { x: 1.1, y: ay + 0.04, w: 3, h: 0.26, fontSize: 13, fontFace: "Arial", color: a.color, bold: true, margin: 0 });
    s.addText(a.desc, { x: 1.1, y: ay + 0.3, w: 7.8, h: 0.38, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.85, w: 8.4, h: 0.4, fill: { color: "2A1520" } });
  s.addText("This advantage compounds at the speed of AI. Every week you wait, you fall further behind.", {
    x: 1.0, y: 4.85, w: 8, h: 0.4, fontSize: 12, fontFace: "Calibri", color: C.warn, bold: true, valign: "middle", margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 12: INDUSTRY APPLICATIONS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Industry Applications", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
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
        "Legacy COBOL-to-Rust migration in one afternoon",
        "Multi-tenant RVCOW: 200x cost savings",
        "Self-improving support and operations",
      ], color: C.gold
    },
  ];

  industries.forEach((ind, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ix = 0.8 + col * 4.4;
    const iy = 1.2 + row * 2.0;

    s.addShape(pres.shapes.RECTANGLE, { x: ix, y: iy, w: 4.1, h: 1.75, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: ix, y: iy, w: 4.1, h: 0.05, fill: { color: ind.color } });
    s.addText(ind.name, { x: ix + 0.15, y: iy + 0.12, w: 3.8, h: 0.3, fontSize: 15, fontFace: "Arial", color: ind.color, bold: true, margin: 0 });
    s.addText(
      ind.items.map((item, j) => ({ text: item, options: { bullet: true, breakLine: j < ind.items.length - 1, fontSize: 10.5, color: C.muted } })),
      { x: ix + 0.15, y: iy + 0.5, w: 3.8, h: 1.1, fontFace: "Calibri", paraSpaceAfter: 4 }
    );
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 13: THE WINDOW
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("The Window Is Open", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 32, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("RuvNet has a 12-18 month head start. The gap is closing \u2014 but not yet.", {
    x: 0.8, y: 0.95, w: 8, h: 0.35, fontSize: 15, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Timeline
  const timeline = [
    { when: "NOW", who: "RuvNet", what: "Full 148-capability stack shipping today", color: C.accent, barW: 8.4 },
    { when: "Q3 2026", who: "Anthropic", what: "Basic orchestration (sub-agents \u2014 8 months after Ruflo)", color: C.muted, barW: 5.5 },
    { when: "Q4 2026", who: "OpenAI", what: "Agent framework (limited capabilities)", color: C.muted, barW: 4.0 },
    { when: "2027+", who: "Google / AWS", what: "Partial stack (no WASM, no Prime Radiant)", color: C.muted, barW: 2.5 },
  ];

  timeline.forEach((t, i) => {
    const ty = 1.6 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ty, w: t.barW, h: 0.6, fill: { color: i === 0 ? "0D2920" : C.bgCard } });
    if (i === 0) s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: ty, w: 0.06, h: 0.6, fill: { color: C.accent } });
    s.addText(t.when, { x: 1.0, y: ty, w: 1.2, h: 0.6, fontSize: 12, fontFace: "Arial", color: t.color, bold: true, valign: "middle", margin: 0 });
    s.addText(t.who, { x: 2.3, y: ty, w: 1.8, h: 0.6, fontSize: 12, fontFace: "Arial", color: C.white, valign: "middle", margin: 0 });
    s.addText(t.what, { x: 4.2, y: ty, w: 4.8, h: 0.6, fontSize: 11, fontFace: "Calibri", color: C.muted, valign: "middle", margin: 0 });
  });

  // What none will have
  s.addText("What none of them will have:", {
    x: 0.8, y: 5.0, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.warn, bold: true, margin: 0
  });
  s.addText("WASM 7.2KB  |  Prime Radiant  |  Nervous System  |  RVF Containers  |  39 Attention Mechanisms", {
    x: 0.8, y: 5.25, w: 8.4, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 14: DEPLOYMENT OPTIONS
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("Deploy Anywhere", {
    x: 0.8, y: 0.4, w: 8, h: 0.6, fontSize: 30, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });
  s.addText("Every deployment model. SOC 2, HIPAA, GDPR, ITAR compliant.", {
    x: 0.8, y: 0.95, w: 8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.muted, margin: 0
  });

  const deployOpts = [
    { name: "Cloud", label: "K8s", desc: "Kubernetes-native with auto-scaling.\nManaged infrastructure, rapid onboarding.", color: C.accent },
    { name: "On-Premise", label: "HW", desc: "Bare metal deployment. Full data sovereignty.\nYour hardware, your control.", color: "0EA5E9" },
    { name: "Hybrid", label: "Mix", desc: "Cloud orchestration with on-premise data.\nBest of both worlds.", color: C.accentAlt },
    { name: "Air-Gapped", label: "RVF", desc: "Self-booting cognitive containers.\nZero network dependency. Works in a bunker.", color: C.gold },
  ];

  deployOpts.forEach((d, i) => {
    const dx = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: dx, y: 1.5, w: 2.05, h: 2.2, fill: { color: C.bgCard }, shadow: cardShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: dx, y: 1.5, w: 2.05, h: 0.05, fill: { color: d.color } });

    s.addText(d.label, { x: dx + 0.12, y: 1.65, w: 1.8, h: 0.45, fontSize: 24, fontFace: "Arial", color: d.color, bold: true, margin: 0 });
    s.addText(d.name, { x: dx + 0.12, y: 2.1, w: 1.8, h: 0.3, fontSize: 13, fontFace: "Arial", color: C.white, bold: true, margin: 0 });
    s.addText(d.desc, { x: dx + 0.12, y: 2.5, w: 1.8, h: 0.8, fontSize: 10, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  // Browser bonus
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.0, w: 8.4, h: 0.7, fill: { color: "0D2920" } });
  s.addText("BONUS: Browser-Only via WASM", { x: 1.0, y: 4.05, w: 3, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.accent, bold: true, margin: 0 });
  s.addText("No server. No installation. Just open a web page. The 5.5KB WASM runtime runs the full vector search engine in a browser tab.", {
    x: 1.0, y: 4.35, w: 7.5, h: 0.3, fontSize: 10.5, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // SLIDE 15: CTA
  // ═══════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s.addText("RUVNET", {
    x: 0.8, y: 1.0, w: 8.4, h: 0.5, fontSize: 18, fontFace: "Arial", color: C.accent, charSpacing: 8, bold: true, margin: 0
  });

  s.addText("Schedule a 30-Minute\nArchitecture Review", {
    x: 0.8, y: 1.6, w: 8.4, h: 1.3, fontSize: 40, fontFace: "Georgia", color: C.white, bold: true, margin: 0
  });

  s.addText("See how the 148-capability agentic stack maps to your specific use case.", {
    x: 0.8, y: 3.0, w: 7, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0
  });

  // Stats row
  const ctaStats = [
    { num: "148+", label: "Capabilities" },
    { num: "80+", label: "Rust Crates" },
    { num: "500K+", label: "Downloads" },
    { num: "MIT", label: "License" },
  ];
  ctaStats.forEach((st, i) => {
    const sx = 0.8 + i * 2.2;
    s.addText(st.num, { x: sx, y: 3.8, w: 2, h: 0.5, fontSize: 28, fontFace: "Arial", color: C.accent, bold: true, margin: 0 });
    s.addText(st.label, { x: sx, y: 4.25, w: 2, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.muted, margin: 0 });
  });

  s.addText("Two standard deviations beyond state of the art.  Open source.  Free.  Use it.", {
    x: 0.8, y: 4.8, w: 8.4, h: 0.3, fontSize: 13, fontFace: "Georgia", color: C.muted, italic: true, margin: 0
  });
  s.addText("ruvnet.com", {
    x: 0.8, y: 5.15, w: 8, h: 0.3, fontSize: 14, fontFace: "Arial", color: C.accent, bold: true, margin: 0
  });

  // ═══════════════════════════════════════════════════════════
  // WRITE
  // ═══════════════════════════════════════════════════════════
  await pres.writeFile({ fileName: "/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/docs/presentations/CEO-Deck-RuvNet-2026.pptx" });
  console.log("CEO deck written successfully");
}

build().catch(console.error);
