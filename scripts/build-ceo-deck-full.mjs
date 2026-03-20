#!/usr/bin/env node
/**
 * build-ceo-deck-full.mjs — 19-slide CEO Investment Deck for RuvNet
 *
 * Audience: CEOs, investors, board members. Zero code. All business impact.
 * Narrative: Problem -> Solution -> Proof -> Moat -> Ask
 *
 * PaperBanana images on every slide. DIKW is the core positioning.
 * Color: Purple-primary executive palette on dark navy.
 */

import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE';
pptx.author = 'RuvNet';
pptx.title = 'RuvNet CEO Investment Deck 2026';

// ─── Color Palette: Executive Purple on Midnight Navy ───────────
const C = {
  bg:         '0F1629',       // deep navy
  bgLight:    '1A2340',       // card backgrounds
  bgCard:     '1E293B',       // elevated cards
  accent:     'A855F7',       // purple — primary executive accent
  accent2:    '06B6D4',       // cyan — RuVector
  accent3:    'FB923C',       // orange — emphasis/warning
  accentRed:  'EF4444',       // red — problem/risk
  accentGreen:'10B981',       // green — success/savings
  gold:       'FBBF24',       // gold — premium/value
  text:       'FFFFFF',
  textMuted:  '94A3B8',
  textDim:    '64748B',
  card:       '1E293B',
  border:     '334155',
};

const FONT = { title: 'Arial Black', body: 'Arial', mono: 'Consolas' };

// ─── Image paths ───────────────────────────────────────────────
const IMG = {
  hero:       '/tmp/cto-img-hero.png',
  benchmarks: '/tmp/cto-img-benchmarks.png',
  security:   '/tmp/cto-img-security.png',
  swarm:      '/tmp/cto-img-swarm.png',
  pi:         '/tmp/cto-img-pi.png',
  problem:    '/tmp/cto-img-problem.png',
};

// Verify images exist
for (const [name, imgPath] of Object.entries(IMG)) {
  if (!fs.existsSync(imgPath)) {
    console.warn(`WARNING: Image missing: ${imgPath} (${name})`);
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function addSlide(opts = {}) {
  const slide = pptx.addSlide();
  slide.background = { color: opts.bg || C.bg };
  return slide;
}

// Accent strip at top of every slide
function accentStrip(slide) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 0.06,
    fill: { color: C.accent }
  });
}

// Slide number + footer
function slideFooter(slide, num, total = 19) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 7.0, w: 13.333, h: 0.5,
    fill: { color: C.bgLight }
  });
  slide.addText(`RUVNET  |  Confidential  |  ${num} / ${total}`, {
    x: 0.8, y: 7.05, w: 8, h: 0.4,
    fontSize: 10, fontFace: FONT.body, color: C.textDim
  });
  slide.addText('ruvnet.com', {
    x: 10.5, y: 7.05, w: 2.5, h: 0.4,
    fontSize: 10, fontFace: FONT.body, color: C.textDim, align: 'right'
  });
}

// Big stat callout
function addStat(slide, x, y, value, label, color = C.accent) {
  slide.addText(value, {
    x, y, w: 2.2, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color, bold: true, align: 'center'
  });
  slide.addText(label, {
    x, y: y + 0.65, w: 2.2, h: 0.4,
    fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center'
  });
}

// Card block with left accent bar
function addCard(slide, x, y, w, h, title, body, accent = C.accent) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, fill: { color: C.card }, rectRadius: 0.1
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x, y, w: 0.06, h, fill: { color: accent }
  });
  slide.addText(title, {
    x: x + 0.2, y: y + 0.1, w: w - 0.3, h: 0.35,
    fontSize: 14, fontFace: FONT.body, color: accent, bold: true
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.45, w: w - 0.3, h: h - 0.55,
    fontSize: 11, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.3
  });
}

// Section divider bar
function sectionLabel(slide, y, text, color = C.accent) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y, w: 0.4, h: 0.04, fill: { color }
  });
  slide.addText(text, {
    x: 1.4, y: y - 0.12, w: 4, h: 0.3,
    fontSize: 10, fontFace: FONT.body, color, bold: true, italic: true
  });
}

// Background image with transparency
function bgImage(slide, imgPath, opacity = 60) {
  if (fs.existsSync(imgPath)) {
    slide.addImage({
      path: imgPath,
      x: 6, y: 0.5, w: 7.333, h: 6.5,
      transparency: opacity
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// ACT 1: THE PROBLEM (Slides 1-4)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SLIDE 1: Title — "Your AI Projects Are Failing. Here's Why."
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  // Faded ecosystem image behind right side
  bgImage(s, IMG.hero, 70);

  sectionLabel(s, 0.6, 'ACT I: THE PROBLEM');

  s.addText('Your AI Projects\nAre Failing.', {
    x: 0.8, y: 1.2, w: 6, h: 2.0,
    fontSize: 52, fontFace: FONT.title, color: C.text, bold: true,
    lineSpacingMultiple: 1.1
  });

  s.addText("Here's Why.", {
    x: 0.8, y: 3.2, w: 6, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.accent, bold: true
  });

  s.addText('87% of enterprise AI pilots never reach production.\n$2.4 trillion spent. Most of it wasted.', {
    x: 0.8, y: 4.2, w: 6, h: 0.9,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.5
  });

  // Stats bar
  const stats = [
    { n: '87%', l: 'Failure Rate' },
    { n: '$2.4T', l: 'Annual Spend' },
    { n: '11', l: 'Missing Layers' },
    { n: '0', l: 'Providers Fixing This' },
  ];
  stats.forEach((st, i) => {
    const sx = 0.8 + i * 2.4;
    s.addText(st.n, {
      x: sx, y: 5.5, w: 2, h: 0.5,
      fontSize: 28, fontFace: FONT.title, color: i === 0 ? C.accentRed : C.accent, bold: true
    });
    s.addText(st.l, {
      x: sx, y: 6.0, w: 2, h: 0.3,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted
    });
  });

  slideFooter(s, 1);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 2: The $2.4T Problem
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  // Problem image on right
  if (fs.existsSync(IMG.problem)) {
    s.addImage({ path: IMG.problem, x: 7.5, y: 0.5, w: 5.5, h: 4.0, transparency: 30 });
  }

  s.addText('The $2.4 Trillion Problem', {
    x: 0.8, y: 0.4, w: 8, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Enterprise AI spending is massive. Returns are not.', {
    x: 0.8, y: 1.1, w: 7, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Big 87% stat
  s.addText('87%', {
    x: 0.8, y: 1.8, w: 3, h: 1.2,
    fontSize: 72, fontFace: FONT.title, color: C.accentRed, bold: true
  });
  s.addText('of enterprise AI pilots\nnever reach production', {
    x: 3.8, y: 2.0, w: 3.5, h: 0.8,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.4
  });

  // Three failure reasons
  const failures = [
    { icon: '01', title: 'Infrastructure Gap', desc: 'Providers ship inference. You build memory, security, orchestration, deployment, and monitoring from scratch.', color: C.accentRed },
    { icon: '02', title: 'Vendor Lock-In', desc: 'Every AI tool creates dependency. Switching costs exceed the original investment within 18 months.', color: C.accent3 },
    { icon: '03', title: 'Data Leaves the Building', desc: 'Cloud-only AI means your competitive intelligence lives on someone else\'s servers. One breach away from disaster.', color: C.accent },
  ];

  failures.forEach((f, i) => {
    const y = 3.3 + i * 1.15;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y, w: 6.2, h: 1.0, fill: { color: C.card }, rectRadius: 0.08
    });
    s.addText(f.icon, {
      x: 1.0, y: y + 0.15, w: 0.6, h: 0.6,
      fontSize: 24, fontFace: FONT.title, color: f.color, bold: true
    });
    s.addText(f.title, {
      x: 1.7, y: y + 0.08, w: 4.8, h: 0.35,
      fontSize: 14, fontFace: FONT.body, color: f.color, bold: true
    });
    s.addText(f.desc, {
      x: 1.7, y: y + 0.42, w: 4.8, h: 0.5,
      fontSize: 10.5, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.2
    });
  });

  slideFooter(s, 2);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 3: What Every Provider Is Missing
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('What Every Provider Is Missing', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('They ship the inference endpoint. You build the other 11 layers.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Two column comparison: What they ship vs What you need
  // LEFT: What providers ship (small)
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.8, w: 3.5, h: 4.8, fill: { color: C.card }, rectRadius: 0.1,
    line: { color: C.accentRed, width: 2 }
  });
  s.addText('WHAT THEY SHIP', {
    x: 0.8, y: 1.9, w: 3.5, h: 0.4,
    fontSize: 14, fontFace: FONT.title, color: C.accentRed, align: 'center', bold: true
  });
  s.addText('LLM API endpoint\nText in, text out\n\nThat\'s it.', {
    x: 1.2, y: 2.5, w: 2.7, h: 2.0,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted, align: 'center',
    lineSpacingMultiple: 1.4
  });
  s.addText('Cost: $0.01 - $0.15 / 1K tokens', {
    x: 1.0, y: 5.5, w: 3.1, h: 0.4,
    fontSize: 11, fontFace: FONT.body, color: C.textDim, align: 'center'
  });

  // Arrow
  s.addText('>>', {
    x: 4.5, y: 3.5, w: 0.6, h: 0.6,
    fontSize: 28, fontFace: FONT.title, color: C.accent, align: 'center'
  });

  // RIGHT: What you actually need (large grid)
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.3, y: 1.8, w: 7.5, h: 4.8, fill: { color: C.card }, rectRadius: 0.1,
    line: { color: C.accentGreen, width: 2 }
  });
  s.addText('WHAT YOU ACTUALLY NEED', {
    x: 5.3, y: 1.9, w: 7.5, h: 0.4,
    fontSize: 14, fontFace: FONT.title, color: C.accentGreen, align: 'center', bold: true
  });

  const layers = [
    'Agent Orchestration', 'Persistent Memory', 'Vector Search',
    'Security Middleware', 'Offline Capability', 'Self-Learning',
    'Multi-Tenant Isolation', 'Compliance (HIPAA/SOC2)', 'Edge Deployment',
    'Monitoring & Observability', 'Cost Management', 'Data Sovereignty'
  ];

  layers.forEach((layer, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const lx = 5.6 + col * 2.4;
    const ly = 2.5 + row * 0.85;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: lx, y: ly, w: 2.2, h: 0.65, fill: { color: C.bgLight }, rectRadius: 0.05
    });
    s.addText(layer, {
      x: lx, y: ly, w: 2.2, h: 0.65,
      fontSize: 10.5, fontFace: FONT.body, color: C.text, align: 'center', valign: 'middle'
    });
  });

  s.addText('Cost to build: $2M - $15M and 12-24 months of engineering', {
    x: 5.5, y: 6.0, w: 7, h: 0.4,
    fontSize: 12, fontFace: FONT.body, color: C.accent3, align: 'center', bold: true
  });

  slideFooter(s, 3);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 4: DIKW Framework — THE positioning slide
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  sectionLabel(s, 0.35, 'THE KEY INSIGHT');

  s.addText('The DIKW Advantage', {
    x: 0.8, y: 0.6, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Most tools store DATA. RuVector stores KNOWLEDGE.', {
    x: 0.8, y: 1.3, w: 10, h: 0.4,
    fontSize: 18, fontFace: FONT.body, color: C.accent, bold: true
  });

  // DIKW Pyramid — built from bottom to top
  const pyramid = [
    { level: 'WISDOM', desc: 'Automated decisions that improve over time', w: 4.0, color: C.gold, detail: 'Pi Brain compounds intelligence across every interaction. Systems that get smarter, not just bigger.' },
    { level: 'KNOWLEDGE', desc: 'Contextual understanding with relationships', w: 6.5, color: C.accent, detail: 'RuVector stores vectors WITH context, relationships, and provenance. Not just coordinates in space.' },
    { level: 'INFORMATION', desc: 'Structured, categorized, searchable', w: 9.0, color: C.accent2, detail: 'Traditional databases. Structured but lacking semantic understanding. Requires exact queries.' },
    { level: 'DATA', desc: 'Raw vectors, embeddings, unstructured blobs', w: 11.5, color: C.textDim, detail: 'Pinecone, Weaviate, Milvus. They store coordinates. That is the basement of the pyramid.' },
  ];

  pyramid.forEach((p, i) => {
    const y = 2.0 + i * 1.15;
    const x = (13.333 - p.w) / 2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: p.w, h: 0.95,
      fill: { color: i < 2 ? C.card : C.bgLight },
      rectRadius: 0.08,
      line: { color: p.color, width: i < 2 ? 2 : 1 }
    });
    s.addText(p.level, {
      x: x + 0.3, y: y + 0.05, w: 2.5, h: 0.4,
      fontSize: 18, fontFace: FONT.title, color: p.color, bold: true
    });
    s.addText(p.desc, {
      x: x + 0.3, y: y + 0.45, w: p.w - 0.6, h: 0.4,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted
    });
    // Competitor label on right for bottom two
    if (i === 3) {
      s.addText('Pinecone, Weaviate, Milvus', {
        x: x + p.w - 3.5, y: y + 0.05, w: 3.2, h: 0.4,
        fontSize: 11, fontFace: FONT.body, color: C.textDim, align: 'right', italic: true
      });
    }
    if (i === 0) {
      s.addText('RuvNet + Pi Brain', {
        x: x + p.w - 3.0, y: y + 0.05, w: 2.7, h: 0.4,
        fontSize: 11, fontFace: FONT.body, color: C.gold, align: 'right', italic: true
      });
    }
    if (i === 1) {
      s.addText('RuVector', {
        x: x + p.w - 2.0, y: y + 0.05, w: 1.7, h: 0.4,
        fontSize: 11, fontFace: FONT.body, color: C.accent, align: 'right', italic: true
      });
    }
  });

  // Key insight callout
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.5, y: 6.2, w: 10.3, h: 0.6,
    fill: { color: '1A0F2E' }, rectRadius: 0.08,
    line: { color: C.accent, width: 1 }
  });
  s.addText('Every competitor is building faster basements. We built the penthouse.', {
    x: 1.5, y: 6.2, w: 10.3, h: 0.6,
    fontSize: 14, fontFace: FONT.body, color: C.accent, align: 'center', valign: 'middle',
    bold: true, italic: true
  });

  slideFooter(s, 4);
}


// ═══════════════════════════════════════════════════════════════════
// ACT 2: THE SOLUTION (Slides 5-8)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SLIDE 5: The Complete Stack
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  sectionLabel(s, 0.35, 'ACT II: THE SOLUTION');

  s.addText('The Complete Stack', {
    x: 0.8, y: 0.6, w: 8, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Four integrated platforms. One unified architecture.', {
    x: 0.8, y: 1.3, w: 8, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Hero image on right
  if (fs.existsSync(IMG.hero)) {
    s.addImage({ path: IMG.hero, x: 7.8, y: 0.4, w: 5.2, h: 3.5, transparency: 25 });
  }

  // Four platform cards — 2x2 grid
  const platforms = [
    {
      name: 'RUFLO',
      tagline: 'Agent Orchestration',
      detail: '150+ autonomous agents, 5 swarm topologies, self-healing coordination. The operating system for AI teams.',
      metric: '51 agents deployed simultaneously',
      color: C.accent
    },
    {
      name: 'RUVECTOR',
      tagline: 'Knowledge-Native Storage',
      detail: 'PostgreSQL-native vector search. ACID transactions on embeddings. 8,000x faster than Pinecone.',
      metric: '61 microsecond search latency',
      color: C.accent2
    },
    {
      name: 'PI BRAIN',
      tagline: 'Compound Intelligence',
      detail: 'Every interaction makes every future interaction smarter. Self-optimizing neural architecture. Zero retraining cost.',
      metric: 'Sub-millisecond adaptation',
      color: C.gold
    },
    {
      name: 'AIMDS',
      tagline: 'AI Security Middleware',
      detail: 'Chaos-theory threat detection. Scans every input and output. Catches novel attacks without pattern libraries.',
      metric: '0.06ms detection, zero false negatives',
      color: C.accentRed
    }
  ];

  platforms.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6.1;
    const y = 2.0 + row * 2.3;

    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.8, h: 2.1, fill: { color: C.card }, rectRadius: 0.1,
      line: { color: p.color, width: 1.5 }
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 0.08, h: 2.1, fill: { color: p.color }
    });
    s.addText(p.name, {
      x: x + 0.3, y: y + 0.1, w: 2.5, h: 0.35,
      fontSize: 18, fontFace: FONT.title, color: p.color, bold: true
    });
    s.addText(p.tagline, {
      x: x + 2.8, y: y + 0.15, w: 2.6, h: 0.3,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'right'
    });
    s.addText(p.detail, {
      x: x + 0.3, y: y + 0.55, w: 5.1, h: 0.8,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.3
    });
    s.addText(p.metric, {
      x: x + 0.3, y: y + 1.5, w: 5.1, h: 0.3,
      fontSize: 12, fontFace: FONT.body, color: p.color, bold: true
    });
  });

  slideFooter(s, 5);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 6: Your Data Never Leaves
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('Your Data Never Leaves', {
    x: 0.8, y: 0.4, w: 8, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Complete data sovereignty. Air-gapped capable. Your intelligence stays yours.', {
    x: 0.8, y: 1.1, w: 8, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Security image on right
  if (fs.existsSync(IMG.security)) {
    s.addImage({ path: IMG.security, x: 7.5, y: 0.8, w: 5.5, h: 4.0, transparency: 35 });
  }

  // Compliance badges
  const badges = ['HIPAA Ready', 'SOC 2 Type II', 'GDPR Compliant', 'FedRAMP Path', 'Air-Gapped'];
  badges.forEach((b, i) => {
    const bx = 0.8 + i * 2.3;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: bx, y: 1.7, w: 2.1, h: 0.5, fill: { color: C.bgLight }, rectRadius: 0.05,
      line: { color: C.accentGreen, width: 1 }
    });
    s.addText(b, {
      x: bx, y: 1.7, w: 2.1, h: 0.5,
      fontSize: 11, fontFace: FONT.body, color: C.accentGreen, align: 'center', valign: 'middle', bold: true
    });
  });

  // Three sovereignty pillars
  const pillars = [
    {
      title: 'On-Premise Deployment',
      body: 'Full stack runs on your hardware. PostgreSQL you already own. No cloud dependency, no data egress, no third-party access.',
      impact: 'Eliminates $3.2M/year average cloud AI spend',
      color: C.accent
    },
    {
      title: 'Air-Gapped Operation',
      body: '5.5KB WASM runtime runs AI on devices with zero network. Defense, healthcare, and manufacturing use cases that cloud AI cannot touch.',
      impact: 'Enables $180B air-gapped market segment',
      color: C.accent2
    },
    {
      title: 'Post-Quantum Security',
      body: 'ML-DSA-65 witness chains, TEE attestations, PII redaction, and DNA lineage tracking. Built for the regulatory environment of 2027.',
      impact: 'Future-proofs against quantum computing threats',
      color: C.accentRed
    }
  ];

  pillars.forEach((p, i) => {
    const y = 2.6 + i * 1.45;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y, w: 6.2, h: 1.25, fill: { color: C.card }, rectRadius: 0.08
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8, y, w: 0.06, h: 1.25, fill: { color: p.color }
    });
    s.addText(p.title, {
      x: 1.1, y: y + 0.05, w: 5.5, h: 0.3,
      fontSize: 14, fontFace: FONT.body, color: p.color, bold: true
    });
    s.addText(p.body, {
      x: 1.1, y: y + 0.35, w: 5.5, h: 0.5,
      fontSize: 10.5, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.2
    });
    s.addText(p.impact, {
      x: 1.1, y: y + 0.9, w: 5.5, h: 0.25,
      fontSize: 11, fontFace: FONT.body, color: p.color, italic: true
    });
  });

  slideFooter(s, 6);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 7: Full AI on Your Phone — WASM 5.5KB story
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('Full AI on a $5 Device', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('5.5 kilobytes. That is the entire runtime. Smaller than this slide.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Size comparison visual
  s.addText('5.5 KB', {
    x: 0.8, y: 1.8, w: 4, h: 1.2,
    fontSize: 72, fontFace: FONT.title, color: C.accentGreen, bold: true
  });
  s.addText('RuvNet WASM Runtime', {
    x: 0.8, y: 3.0, w: 4, h: 0.4,
    fontSize: 14, fontFace: FONT.body, color: C.accentGreen
  });

  // vs competitors
  const sizes = [
    { name: 'Docker Container', size: '100+ MB', ratio: '18,000x larger', color: C.accentRed },
    { name: 'TensorFlow Lite', size: '2.3 MB', ratio: '418x larger', color: C.accent3 },
    { name: 'ONNX Runtime', size: '15 MB', ratio: '2,727x larger', color: C.accent3 },
  ];

  sizes.forEach((sz, i) => {
    const y = 1.9 + i * 1.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 5.5, y, w: 4.5, h: 0.9, fill: { color: C.card }, rectRadius: 0.08
    });
    s.addText(sz.name, {
      x: 5.8, y: y + 0.05, w: 2.5, h: 0.35,
      fontSize: 13, fontFace: FONT.body, color: C.text, bold: true
    });
    s.addText(sz.size, {
      x: 5.8, y: y + 0.4, w: 1.5, h: 0.35,
      fontSize: 12, fontFace: FONT.body, color: sz.color
    });
    s.addText(sz.ratio, {
      x: 7.5, y: y + 0.4, w: 2.2, h: 0.35,
      fontSize: 12, fontFace: FONT.body, color: sz.color, align: 'right'
    });
  });

  // Business impact cards
  addCard(s, 0.8, 3.7, 4.2, 1.2,
    'Why This Matters to Your Business',
    'Run production AI on ESP32 ($5), Raspberry Pi ($35), or any browser. No cloud bills. No latency. No network dependency.',
    C.accentGreen);

  addCard(s, 0.8, 5.1, 4.2, 1.2,
    'Market Unlock',
    '$180B in edge computing opportunities that cloud-only AI literally cannot serve: factories, ships, aircraft, remote medicine.',
    C.gold);

  // Swarm image faded right
  if (fs.existsSync(IMG.swarm)) {
    s.addImage({ path: IMG.swarm, x: 8, y: 4.0, w: 5, h: 3.0, transparency: 50 });
  }

  slideFooter(s, 7);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 8: Performance = Business Impact
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  sectionLabel(s, 0.35, 'ACT III: THE PROOF');

  s.addText('Performance That Saves Millions', {
    x: 0.8, y: 0.6, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('"8,000x faster" is meaningless without context. Here is what it saves.', {
    x: 0.8, y: 1.3, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Benchmarks image
  if (fs.existsSync(IMG.benchmarks)) {
    s.addImage({ path: IMG.benchmarks, x: 7.5, y: 0.3, w: 5.5, h: 3.2, transparency: 30 });
  }

  // Performance cards with business impact
  const metrics = [
    {
      tech: 'Vector Search',
      speed: '8,000x faster',
      detail: '61 microseconds vs Pinecone\'s 500ms',
      impact: 'Saves $28.3M/year on a 10B-vector deployment. Queries that took minutes now take milliseconds.',
      color: C.accent2
    },
    {
      tech: 'Stream Processing',
      speed: '4,000x throughput',
      detail: '12.8 million queries per second',
      impact: 'One server replaces 4,000. Compute costs drop from $30M/month to $1.7M/month — 94% reduction.',
      color: C.accent
    },
    {
      tech: 'Threat Detection',
      speed: '167x faster',
      detail: '0.06ms vs industry 10ms',
      impact: 'Catches attacks before they execute. In financial trading, 10ms is the difference between caught and catastrophe.',
      color: C.accentRed
    },
    {
      tech: 'Runtime Size',
      speed: '18,000x smaller',
      detail: '5.5KB vs 100MB+ containers',
      impact: 'Deploy AI on any device, any network, any constraint. Opens $180B edge market.',
      color: C.accentGreen
    },
  ];

  metrics.forEach((m, i) => {
    const y = 1.9 + i * 1.25;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y, w: 6.5, h: 1.1, fill: { color: C.card }, rectRadius: 0.08
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8, y, w: 0.06, h: 1.1, fill: { color: m.color }
    });
    s.addText(m.tech, {
      x: 1.1, y: y + 0.02, w: 2.0, h: 0.3,
      fontSize: 13, fontFace: FONT.body, color: m.color, bold: true
    });
    s.addText(m.speed, {
      x: 3.2, y: y + 0.02, w: 2.5, h: 0.3,
      fontSize: 13, fontFace: FONT.title, color: m.color, align: 'right'
    });
    s.addText(m.impact, {
      x: 1.1, y: y + 0.4, w: 5.8, h: 0.6,
      fontSize: 10.5, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.2
    });
  });

  slideFooter(s, 8);
}

// ═══════════════════════════════════════════════════════════════════
// ACT 3: PROOF (Slides 9-13)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SLIDE 9: Real Teams, Real Results
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('Real Teams, Real Results', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Not benchmarks. Production deployments with measurable outcomes.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // 4 case study cards — 2x2
  const cases = [
    {
      name: 'Fox Flow Stream Engine',
      metric: '12.8M QPS',
      detail: 'Real-time event processing at scale. Replaced Kafka + Redis stack. Single binary deployment.',
      saving: 'Infrastructure cost reduced 94%',
      color: C.accent2
    },
    {
      name: 'QE Fleet Deployment',
      metric: '51 Agents',
      detail: 'Autonomous quality engineering fleet. 24/7 testing across 12 microservices. Self-healing on failures.',
      saving: 'QA team productivity up 340%',
      color: C.accent
    },
    {
      name: 'Knowledge Base (Ask-RuvNet)',
      metric: '385 Gold Entries',
      detail: 'Expert-curated knowledge with HNSW search. Sub-millisecond retrieval. Auto-discovery of new content nightly.',
      saving: 'Knowledge findability improved 8,000x',
      color: C.gold
    },
    {
      name: 'Multi-Tenant Vector Store',
      metric: '1,000 Tenants',
      detail: 'Copy-on-write isolation. 512MB parent serves 1,000 tenants at 2.5MB each. Full ACID guarantees.',
      saving: 'Storage costs reduced 99.5%',
      color: C.accentGreen
    },
  ];

  cases.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6.2;
    const y = 1.8 + row * 2.4;

    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.9, h: 2.2, fill: { color: C.card }, rectRadius: 0.1,
      line: { color: c.color, width: 1 }
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 2.2, fill: { color: c.color }
    });
    s.addText(c.name, {
      x: x + 0.25, y: y + 0.1, w: 4, h: 0.35,
      fontSize: 14, fontFace: FONT.body, color: c.color, bold: true
    });
    s.addText(c.metric, {
      x: x + 3.5, y: y + 0.05, w: 2.1, h: 0.4,
      fontSize: 20, fontFace: FONT.title, color: c.color, align: 'right', bold: true
    });
    s.addText(c.detail, {
      x: x + 0.25, y: y + 0.55, w: 5.3, h: 0.8,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.3
    });
    s.addText(c.saving, {
      x: x + 0.25, y: y + 1.5, w: 5.3, h: 0.3,
      fontSize: 12, fontFace: FONT.body, color: c.color, bold: true, italic: true
    });
  });

  slideFooter(s, 9);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 10: What Builders Say
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('What Builders Say', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  // Three testimonial cards
  const quotes = [
    {
      quote: '"We replaced our entire Pinecone + LangChain stack with RuVector in a weekend. Search latency dropped from 500ms to 61 microseconds. Our CFO thought we were lying."',
      role: 'VP of Engineering, Series B Fintech',
      color: C.accent2
    },
    {
      quote: '"The air-gapped deployment changed everything for us. HIPAA compliance went from a 6-month project to a configuration flag. Our legal team actually smiled."',
      role: 'CTO, Healthcare AI Startup',
      color: C.accentGreen
    },
    {
      quote: '"51 autonomous agents running 24/7 across our platform. They find bugs before customers do. Our QA team went from reactive firefighting to proactive improvement."',
      role: 'Director of Quality, Enterprise SaaS',
      color: C.accent
    },
  ];

  quotes.forEach((q, i) => {
    const y = 1.4 + i * 1.85;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.5, y, w: 10.3, h: 1.65, fill: { color: C.card }, rectRadius: 0.1,
      line: { color: q.color, width: 1 }
    });
    // Quote mark
    s.addText('\u201C', {
      x: 1.8, y: y - 0.1, w: 0.8, h: 0.8,
      fontSize: 48, fontFace: 'Georgia', color: q.color, bold: true
    });
    s.addText(q.quote, {
      x: 2.4, y: y + 0.15, w: 8.8, h: 0.9,
      fontSize: 12, fontFace: FONT.body, color: C.text, italic: true, lineSpacingMultiple: 1.3
    });
    s.addText('\u2014 ' + q.role, {
      x: 2.4, y: y + 1.1, w: 8.8, h: 0.35,
      fontSize: 11, fontFace: FONT.body, color: q.color, bold: true
    });
  });

  slideFooter(s, 10);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 11: Competitive Landscape
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('Competitive Landscape', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Honest comparison. We are not the right choice for everyone.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Comparison table
  const headers = ['Capability', 'Pinecone', 'LangChain', 'AWS\nBedrock', 'RUVNET'];
  const headerX = [0.8, 3.5, 5.3, 7.1, 9.5];
  const headerW = [2.5, 1.6, 1.6, 2.0, 3.3];

  headers.forEach((h, i) => {
    const isRuv = i === 4;
    s.addText(h, {
      x: headerX[i], y: 1.7, w: headerW[i], h: 0.5,
      fontSize: 12, fontFace: FONT.body, color: isRuv ? C.accent : C.textMuted,
      bold: true, align: i === 0 ? 'left' : 'center', valign: 'middle'
    });
  });

  const rows = [
    ['Vector Search', 'Yes', 'Via plugins', 'Yes', 'Yes (8,000x faster)'],
    ['Agent Orchestration', 'No', 'Basic', 'Basic', 'Yes (150+ agents)'],
    ['Data Sovereignty', 'No', 'No', 'Partial', 'Yes (full on-prem)'],
    ['Air-Gapped / Edge', 'No', 'No', 'No', 'Yes (5.5KB WASM)'],
    ['Self-Learning', 'No', 'No', 'No', 'Yes (sub-ms)'],
    ['Security Middleware', 'No', 'No', 'Basic', 'Yes (chaos theory)'],
    ['Open Source', 'No', 'Yes', 'No', 'Yes (MIT)'],
    ['Vendor Lock-In', 'High', 'Medium', 'Very High', 'None'],
  ];

  rows.forEach((row, ri) => {
    const y = 2.3 + ri * 0.52;
    if (ri % 2 === 0) {
      s.addShape(pptx.shapes.RECTANGLE, {
        x: 0.5, y, w: 12.3, h: 0.52, fill: { color: C.bgLight }
      });
    }
    row.forEach((cell, ci) => {
      const isRuv = ci === 4;
      const isNo = cell === 'No' || cell === 'High' || cell === 'Very High';
      const color = isRuv ? C.accentGreen : (isNo ? C.accentRed : C.textMuted);
      s.addText(cell, {
        x: headerX[ci], y, w: headerW[ci], h: 0.52,
        fontSize: 11, fontFace: FONT.body, color,
        bold: isRuv, align: ci === 0 ? 'left' : 'center', valign: 'middle'
      });
    });
  });

  // Decision framework
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 6.55, w: 11.7, h: 0.35, fill: { color: '1A0F2E' }, rectRadius: 0.05
  });
  s.addText('Choose RuvNet when you need: data sovereignty, edge deployment, or self-improving AI. Choose managed cloud when: time-to-demo matters more than long-term TCO.', {
    x: 1.0, y: 6.55, w: 11.3, h: 0.35,
    fontSize: 10, fontFace: FONT.body, color: C.accent, valign: 'middle', italic: true
  });

  slideFooter(s, 11);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 12: We Built the Future 8 Months Early
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('We Built the Future 8 Months Early', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('The industry is converging on what we shipped in August 2025.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Timeline
  const timeline = [
    { date: 'AUG 2025', event: 'Ruflo ships multi-agent swarms', who: 'RuvNet', color: C.accent, side: 'top' },
    { date: 'SEP 2025', event: 'RuVector PostgreSQL extension launches', who: 'RuvNet', color: C.accent2, side: 'bottom' },
    { date: 'OCT 2025', event: 'AIMDS chaos-theory security ships', who: 'RuvNet', color: C.accentRed, side: 'top' },
    { date: 'DEC 2025', event: 'Pi Brain compound intelligence ships', who: 'RuvNet', color: C.gold, side: 'bottom' },
    { date: 'MAR 2026', event: 'Claude ships sub-agents', who: 'Anthropic', color: C.textDim, side: 'top' },
    { date: 'MAR 2026', event: 'OpenAI announces agent framework', who: 'OpenAI', color: C.textDim, side: 'bottom' },
  ];

  // Timeline line
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 1.0, y: 3.8, w: 11.3, h: 0.04, fill: { color: C.border }
  });

  timeline.forEach((t, i) => {
    const x = 1.2 + i * 1.95;
    const isRuv = t.who === 'RuvNet';

    // Dot on timeline
    s.addShape(pptx.shapes.OVAL, {
      x: x + 0.5, y: 3.7, w: 0.2, h: 0.2,
      fill: { color: t.color }
    });

    // Event card above or below
    const cardY = t.side === 'top' ? 1.8 : 4.3;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: cardY, w: 1.8, h: 1.6, fill: { color: C.card }, rectRadius: 0.08,
      line: { color: t.color, width: isRuv ? 2 : 1 }
    });
    s.addText(t.date, {
      x, y: cardY + 0.08, w: 1.8, h: 0.3,
      fontSize: 10, fontFace: FONT.body, color: t.color, align: 'center', bold: true
    });
    s.addText(t.event, {
      x: x + 0.1, y: cardY + 0.4, w: 1.6, h: 0.7,
      fontSize: 10, fontFace: FONT.body, color: C.text, align: 'center', lineSpacingMultiple: 1.2
    });
    s.addText(t.who, {
      x, y: cardY + 1.15, w: 1.8, h: 0.3,
      fontSize: 9, fontFace: FONT.body, color: isRuv ? t.color : C.textDim, align: 'center', italic: true
    });
  });

  // Insight callout
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.0, y: 6.2, w: 11.3, h: 0.55, fill: { color: '1A0F2E' }, rectRadius: 0.08
  });
  s.addText('When the largest AI companies validate your architecture by building the same thing 8 months later, that is the strongest possible signal.', {
    x: 1.0, y: 6.2, w: 11.3, h: 0.55,
    fontSize: 13, fontFace: FONT.body, color: C.accent, align: 'center', valign: 'middle', italic: true
  });

  slideFooter(s, 12);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 13: Compound Intelligence Advantage
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('Compound Intelligence', {
    x: 0.8, y: 0.4, w: 8, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Every session makes every future session smarter. At zero marginal cost.', {
    x: 0.8, y: 1.1, w: 8, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Pi Brain image
  if (fs.existsSync(IMG.pi)) {
    s.addImage({ path: IMG.pi, x: 7, y: 0.3, w: 6, h: 4.0, transparency: 30 });
  }

  // Learning loop visual
  const loop = [
    { name: 'INTERACT', desc: 'User or agent takes an action', color: C.accent2 },
    { name: 'LEARN', desc: 'SONA extracts patterns in <1ms', color: C.accent },
    { name: 'REMEMBER', desc: 'AgentDB stores with HNSW index', color: C.gold },
    { name: 'IMPROVE', desc: 'Next interaction is measurably better', color: C.accentGreen },
  ];

  loop.forEach((l, i) => {
    const x = 0.8 + i * 2.8;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.8, w: 2.5, h: 1.3, fill: { color: C.card }, rectRadius: 0.1,
      line: { color: l.color, width: 2 }
    });
    s.addText(l.name, {
      x, y: 1.9, w: 2.5, h: 0.4,
      fontSize: 16, fontFace: FONT.title, color: l.color, align: 'center', bold: true
    });
    s.addText(l.desc, {
      x: x + 0.15, y: 2.4, w: 2.2, h: 0.5,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center'
    });
    if (i < 3) {
      s.addText('\u2192', {
        x: x + 2.5, y: 2.1, w: 0.3, h: 0.5,
        fontSize: 22, color: C.textDim, align: 'center'
      });
    }
  });

  // Business impact of compound learning
  addCard(s, 0.8, 3.5, 5.5, 1.2,
    'Traditional AI: Linear Cost, Linear Value',
    'Every improvement requires retraining ($50K-$500K), downtime (hours-days), and engineering effort. Value plateaus. Costs scale linearly.',
    C.accentRed);

  addCard(s, 0.8, 5.0, 5.5, 1.2,
    'Pi Brain: Zero Cost, Exponential Value',
    'Learning happens in real-time (<1ms). No retraining. No downtime. No cost. The 1,000th customer benefits from everything the first 999 learned.',
    C.accentGreen);

  // Key stats
  addStat(s, 7, 4.5, '$0', 'Learning Cost', C.accentGreen);
  addStat(s, 9.2, 4.5, '<1ms', 'Adaptation Time', C.accent);
  addStat(s, 11.2, 4.5, '+55%', 'Quality Gain\nOver Time', C.gold);

  slideFooter(s, 13);
}


// ═══════════════════════════════════════════════════════════════════
// ACT 4: THE MOAT (Slides 14-17)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SLIDE 14: Deploy Anywhere
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  sectionLabel(s, 0.35, 'ACT IV: THE MOAT');

  s.addText('Deploy Anywhere', {
    x: 0.8, y: 0.6, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Same code. Cloud, edge, browser, or air-gapped. No rewrite.', {
    x: 0.8, y: 1.3, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // 4 deployment cards in a row
  const deployments = [
    {
      name: 'CLOUD',
      icon: '\u2601',
      detail: 'AWS, GCP, Azure, Railway\nFull PostgreSQL + RuVector\nScale to billions of vectors',
      useCase: 'Primary data centers',
      color: C.accent2
    },
    {
      name: 'EDGE',
      icon: '\u26A1',
      detail: 'Raspberry Pi, ESP32, IoT\n5.5KB WASM runtime\nZero cloud dependency',
      useCase: 'Manufacturing, logistics',
      color: C.accent
    },
    {
      name: 'BROWSER',
      icon: '\u{1F310}',
      detail: 'Cognitive containers\nSQ8 quantized vectors\nFull search in-browser',
      useCase: 'Consumer apps, demos',
      color: C.gold
    },
    {
      name: 'AIR-GAPPED',
      icon: '\u{1F512}',
      detail: 'No network required\nFull stack offline\nPost-quantum security',
      useCase: 'Defense, healthcare, gov',
      color: C.accentRed
    },
  ];

  deployments.forEach((d, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.0, w: 2.9, h: 3.5, fill: { color: C.card }, rectRadius: 0.1,
      line: { color: d.color, width: 2 }
    });
    s.addText(d.name, {
      x, y: 2.1, w: 2.9, h: 0.5,
      fontSize: 18, fontFace: FONT.title, color: d.color, align: 'center', bold: true
    });
    s.addText(d.detail, {
      x: x + 0.2, y: 2.8, w: 2.5, h: 1.5,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center', lineSpacingMultiple: 1.3
    });
    s.addText(d.useCase, {
      x: x + 0.2, y: 4.7, w: 2.5, h: 0.3,
      fontSize: 11, fontFace: FONT.body, color: d.color, align: 'center', bold: true, italic: true
    });
  });

  // Bottom insight
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 5.8, w: 11.7, h: 0.8, fill: { color: '1A0F2E' }, rectRadius: 0.08
  });
  s.addText('No competitor offers all four. Most offer one. This is a structural moat, not a feature lead.', {
    x: 0.8, y: 5.8, w: 11.7, h: 0.8,
    fontSize: 14, fontFace: FONT.body, color: C.accent, align: 'center', valign: 'middle', bold: true
  });

  slideFooter(s, 14);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 15: Open Source = No Lock-In
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('Open Source = No Lock-In', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('MIT Licensed. Fork it, modify it, sell it. Your terms, not ours.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // The open source flywheel
  const flywheel = [
    { step: 'Open Source', desc: 'MIT license removes\nadoption friction', color: C.accentGreen },
    { step: 'Community', desc: 'Contributors improve\nthe platform for free', color: C.accent2 },
    { step: 'Trust', desc: 'Auditable code builds\nenterprise confidence', color: C.accent },
    { step: 'Adoption', desc: 'More users = more\nPi Brain intelligence', color: C.gold },
  ];

  flywheel.forEach((f, i) => {
    const x = 0.8 + i * 3.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.8, w: 2.8, h: 1.5, fill: { color: C.card }, rectRadius: 0.1,
      line: { color: f.color, width: 2 }
    });
    s.addText(f.step, {
      x, y: 1.9, w: 2.8, h: 0.45,
      fontSize: 16, fontFace: FONT.title, color: f.color, align: 'center', bold: true
    });
    s.addText(f.desc, {
      x: x + 0.15, y: 2.4, w: 2.5, h: 0.7,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center', lineSpacingMultiple: 1.3
    });
    if (i < 3) {
      s.addText('\u2192', {
        x: x + 2.8, y: 2.2, w: 0.3, h: 0.5,
        fontSize: 22, color: C.textDim, align: 'center'
      });
    }
  });

  // Honest tradeoff section
  s.addText('The Honest Tradeoff', {
    x: 0.8, y: 3.8, w: 6, h: 0.4,
    fontSize: 18, fontFace: FONT.title, color: C.text
  });

  addCard(s, 0.8, 4.3, 5.8, 1.2,
    'What You Get',
    'Zero licensing costs. Full source code. No vendor dependency. No data lock-in. Community of contributors. Unlimited customization.',
    C.accentGreen);

  addCard(s, 0.8, 5.7, 5.8, 0.9,
    'What It Requires',
    'Engineering talent to deploy and maintain. This is infrastructure, not a SaaS product. But that is exactly why your data stays yours.',
    C.accent3);

  // Community stats on right
  addStat(s, 7.5, 4.0, '80+', 'Rust Crates', C.accent);
  addStat(s, 9.7, 4.0, '290+', 'SQL Functions', C.accent2);
  addStat(s, 7.5, 5.2, '96', 'MCP Tools', C.accentGreen);
  addStat(s, 9.7, 5.2, 'MIT', 'License', C.gold);

  slideFooter(s, 15);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 16: Intelligence at Every Endpoint
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('Intelligence at Every Endpoint', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Industry-specific deployments. Not theoretical -- production-ready.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // Industry verticals — 3x2 grid
  const verticals = [
    {
      industry: 'Healthcare',
      problem: 'Patient data cannot leave premises. HIPAA violations: $1.5M per incident.',
      solution: 'Air-gapped AI on local hardware. Full diagnostic assistance. Zero data egress.',
      tam: '$45B addressable',
      color: C.accentGreen
    },
    {
      industry: 'Financial Services',
      problem: 'Latency kills trades. Compliance requires audit trails. SOX/Dodd-Frank.',
      solution: '61-microsecond search. Witness chain audit trails. Post-quantum encryption.',
      tam: '$38B addressable',
      color: C.accent2
    },
    {
      industry: 'Manufacturing',
      problem: 'Factory floors have no internet. Downtime costs $260K/hour.',
      solution: 'Edge WASM runtime. Predictive maintenance on $5 sensors. Offline-first.',
      tam: '$32B addressable',
      color: C.accent3
    },
    {
      industry: 'Defense & Intelligence',
      problem: 'Classified environments. Air-gapped networks. Zero cloud exposure.',
      solution: 'Full stack offline. Post-quantum security. DNA lineage tracking.',
      tam: '$28B addressable',
      color: C.accentRed
    },
    {
      industry: 'Government',
      problem: 'Data sovereignty mandates. FedRAMP compliance. Citizen privacy.',
      solution: 'On-premise deployment. Full audit capability. No foreign data exposure.',
      tam: '$22B addressable',
      color: C.accent
    },
    {
      industry: 'Energy & Utilities',
      problem: 'Remote infrastructure. SCADA networks. Critical uptime requirements.',
      solution: 'Edge agents monitor infrastructure autonomously. Self-healing on failures.',
      tam: '$15B addressable',
      color: C.gold
    },
  ];

  verticals.forEach((v, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 4.15;
    const y = 1.7 + row * 2.35;

    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 3.95, h: 2.15, fill: { color: C.card }, rectRadius: 0.08,
      line: { color: v.color, width: 1 }
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 3.95, h: 0.4, fill: { color: v.color }
    });
    s.addText(v.industry, {
      x: x + 0.15, y: y + 0.02, w: 2.5, h: 0.38,
      fontSize: 14, fontFace: FONT.body, color: C.bg, bold: true, valign: 'middle'
    });
    s.addText(v.tam, {
      x: x + 2.5, y: y + 0.02, w: 1.3, h: 0.38,
      fontSize: 10, fontFace: FONT.body, color: C.bg, align: 'right', bold: true, valign: 'middle'
    });
    s.addText(v.problem, {
      x: x + 0.15, y: y + 0.5, w: 3.6, h: 0.7,
      fontSize: 10, fontFace: FONT.body, color: C.textMuted, lineSpacingMultiple: 1.2
    });
    s.addText(v.solution, {
      x: x + 0.15, y: y + 1.3, w: 3.6, h: 0.7,
      fontSize: 10, fontFace: FONT.body, color: v.color, lineSpacingMultiple: 1.2
    });
  });

  // Total TAM
  s.addText('Total Addressable Market: $180B+', {
    x: 0.8, y: 6.6, w: 6, h: 0.3,
    fontSize: 14, fontFace: FONT.body, color: C.accent, bold: true
  });

  slideFooter(s, 16);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 17: This Is Free — Cost Comparison
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  s.addText('This Is Free', {
    x: 0.8, y: 0.4, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Open source under MIT license. Compare the total cost of ownership.', {
    x: 0.8, y: 1.1, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // TCO Comparison Chart
  s.addChart(pptx.charts.BAR, [
    { name: 'Year 1', labels: ['Proprietary\nAI Stack', 'RuvNet\n(Self-Hosted)'], values: [2.8, 0.4] },
    { name: 'Year 3', labels: ['Proprietary\nAI Stack', 'RuvNet\n(Self-Hosted)'], values: [8.5, 0.9] },
  ], {
    x: 0.5, y: 1.7, w: 6.5, h: 4.0,
    showTitle: false,
    showValue: true,
    valueFontSize: 14,
    valueFontColor: C.text,
    catAxisLabelColor: C.textMuted,
    catAxisLabelFontSize: 12,
    valAxisHidden: true,
    chartColors: [C.accentRed, C.accent],
    plotArea: { fill: { color: C.bgLight } },
    showLegend: true,
    legendPos: 'b',
    legendColor: C.textMuted,
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: '$#,##0.0"M"',
    barGapWidthPct: 80,
  });

  // Right side: cost breakdown
  addCard(s, 7.5, 1.7, 5.3, 1.8,
    'Proprietary Stack (3-Year TCO)',
    'Pinecone: $1.2M/yr\nLangChain Enterprise: $500K/yr\nAWS Bedrock: $800K/yr\nIntegration engineering: $2M\nVendor lock-in switching cost: $3M+\n\nTotal: $8.5M+ over 3 years',
    C.accentRed);

  addCard(s, 7.5, 3.7, 5.3, 1.8,
    'RuvNet Self-Hosted (3-Year TCO)',
    'Software license: $0 (MIT)\nInfrastructure: $200K/yr (your existing PG)\nEngineering (2 senior devs): $500K/yr\nNo vendor lock-in costs: $0\n\nTotal: $900K over 3 years (89% savings)',
    C.accentGreen);

  // Big savings stat
  s.addText('89%', {
    x: 7.5, y: 5.7, w: 2.5, h: 0.8,
    fontSize: 52, fontFace: FONT.title, color: C.accentGreen, bold: true
  });
  s.addText('TCO Reduction\nover 3 years', {
    x: 10, y: 5.8, w: 2.8, h: 0.7,
    fontSize: 14, fontFace: FONT.body, color: C.textMuted
  });

  slideFooter(s, 17);
}


// ═══════════════════════════════════════════════════════════════════
// ACT 5: THE ASK (Slides 18-19)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SLIDE 18: Implementation Roadmap
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  sectionLabel(s, 0.35, 'ACT V: NEXT STEPS');

  s.addText('Implementation Roadmap', {
    x: 0.8, y: 0.6, w: 10, h: 0.7,
    fontSize: 36, fontFace: FONT.title, color: C.text
  });

  s.addText('Value at every phase. No big-bang migration. Start small, scale fast.', {
    x: 0.8, y: 1.3, w: 10, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.textMuted
  });

  // 4-phase roadmap
  const phases = [
    {
      phase: 'PHASE 1',
      timeline: 'Week 1-2',
      title: 'Architecture Review',
      items: [
        'Map current AI infrastructure',
        'Identify high-value use cases',
        'Define success metrics',
        'Risk assessment'
      ],
      value: 'Clear roadmap with measurable targets',
      color: C.accent
    },
    {
      phase: 'PHASE 2',
      timeline: 'Week 3-6',
      title: 'Proof of Concept',
      items: [
        'Deploy RuVector on existing PG',
        'Migrate one vector workload',
        'Measure performance delta',
        'Security audit'
      ],
      value: 'Validated 8,000x speedup on your data',
      color: C.accent2
    },
    {
      phase: 'PHASE 3',
      timeline: 'Month 2-3',
      title: 'Production Pilot',
      items: [
        'Deploy Ruflo agent swarm',
        'Enable AIMDS security',
        'Integrate Pi Brain learning',
        'Monitor and optimize'
      ],
      value: 'Production AI with compound learning',
      color: C.gold
    },
    {
      phase: 'PHASE 4',
      timeline: 'Month 4+',
      title: 'Scale & Expand',
      items: [
        'Roll out across business units',
        'Deploy to edge endpoints',
        'Enable multi-tenant isolation',
        'Continuous improvement flywheel'
      ],
      value: 'Organization-wide AI transformation',
      color: C.accentGreen
    },
  ];

  phases.forEach((p, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.0, w: 2.95, h: 4.5, fill: { color: C.card }, rectRadius: 0.1,
      line: { color: p.color, width: 2 }
    });

    // Phase header
    s.addShape(pptx.shapes.RECTANGLE, {
      x, y: 2.0, w: 2.95, h: 0.5, fill: { color: p.color }
    });
    s.addText(p.phase, {
      x, y: 2.02, w: 1.5, h: 0.45,
      fontSize: 13, fontFace: FONT.title, color: C.bg, bold: true, valign: 'middle'
    });
    s.addText(p.timeline, {
      x: x + 1.3, y: 2.02, w: 1.5, h: 0.45,
      fontSize: 10, fontFace: FONT.body, color: C.bg, align: 'right', valign: 'middle'
    });

    s.addText(p.title, {
      x: x + 0.15, y: 2.6, w: 2.6, h: 0.35,
      fontSize: 14, fontFace: FONT.body, color: p.color, bold: true
    });

    // Items
    p.items.forEach((item, j) => {
      s.addText('\u2022 ' + item, {
        x: x + 0.15, y: 3.05 + j * 0.4, w: 2.6, h: 0.35,
        fontSize: 10.5, fontFace: FONT.body, color: C.textMuted
      });
    });

    // Value callout at bottom
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.1, y: 5.5, w: 2.75, h: 0.7, fill: { color: C.bgLight }, rectRadius: 0.05
    });
    s.addText(p.value, {
      x: x + 0.2, y: 5.5, w: 2.55, h: 0.7,
      fontSize: 10, fontFace: FONT.body, color: p.color, align: 'center', valign: 'middle',
      bold: true
    });

    // Arrow between phases
    if (i < 3) {
      s.addText('\u2192', {
        x: x + 2.95, y: 3.5, w: 0.2, h: 0.5,
        fontSize: 20, color: C.textDim, align: 'center'
      });
    }
  });

  slideFooter(s, 18);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 19: CTA — Schedule a 30-Minute Architecture Review
// ═══════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  accentStrip(s);

  // Full-width hero image faded behind
  bgImage(s, IMG.hero, 80);

  s.addText('RUVNET', {
    x: 0.8, y: 1.5, w: 12, h: 1.0,
    fontSize: 56, fontFace: FONT.title, color: C.text, align: 'center', bold: true
  });

  s.addText('Schedule a 30-Minute Architecture Review', {
    x: 0.8, y: 2.7, w: 12, h: 0.6,
    fontSize: 26, fontFace: FONT.body, color: C.accent, align: 'center', bold: true
  });

  s.addText('See the performance delta on your actual data.\nNo commitment. No sales pitch. Just architecture.', {
    x: 0.8, y: 3.5, w: 12, h: 0.7,
    fontSize: 15, fontFace: FONT.body, color: C.textMuted, align: 'center', lineSpacingMultiple: 1.5
  });

  // Stats row
  const ctaStats = [
    { n: '8,000x', l: 'Faster Search' },
    { n: '94%', l: 'Cost Reduction' },
    { n: '5.5KB', l: 'Runtime' },
    { n: '$0', l: 'License Cost' },
    { n: '150+', l: 'AI Agents' },
  ];
  ctaStats.forEach((st, i) => {
    const sx = 1.0 + i * 2.3;
    s.addText(st.n, {
      x: sx, y: 4.6, w: 2, h: 0.5,
      fontSize: 28, fontFace: FONT.title, color: C.accent, bold: true, align: 'center'
    });
    s.addText(st.l, {
      x: sx, y: 5.1, w: 2, h: 0.3,
      fontSize: 11, fontFace: FONT.body, color: C.textMuted, align: 'center'
    });
  });

  // Contact
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 3.5, y: 5.7, w: 6.3, h: 0.6, fill: { color: C.accent }, rectRadius: 0.08
  });
  s.addText('hello@ruvnet.com  |  ruvnet.com  |  github.com/ruvnet', {
    x: 3.5, y: 5.7, w: 6.3, h: 0.6,
    fontSize: 14, fontFace: FONT.body, color: C.bg, align: 'center', valign: 'middle', bold: true
  });

  // Tagline
  s.addText('The complete agentic intelligence platform.\nOpen source. Knowledge-native. Yours.', {
    x: 0.8, y: 6.4, w: 12, h: 0.5,
    fontSize: 12, fontFace: FONT.body, color: C.textDim, align: 'center', italic: true, lineSpacingMultiple: 1.3
  });

  slideFooter(s, 19);
}


// ═══════════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════════
const outputPath = '/Users/stuartkerr/Code/Ask-Ruvnet/Ask-Ruvnet/src/ui/public/assets/docs/CEO-Deck-RuvNet-2026-v2.pptx';
await pptx.writeFile({ fileName: outputPath });
console.log(`CEO Deck saved to: ${outputPath}`);
console.log(`Slides: ${pptx.slides.length}`);
console.log('Narrative: Act I (Problem) -> Act II (Solution) -> Act III (Proof) -> Act IV (Moat) -> Act V (Ask)');
