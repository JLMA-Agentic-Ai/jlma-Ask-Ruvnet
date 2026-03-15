(function() {
  'use strict';

  // === Particle System ===
  var particleCanvas = document.getElementById('particleCanvas');
  var pctx = particleCanvas.getContext('2d');
  var PW, PH, PARTICLE_COUNT = 1200, particles = [];
  var currentStage = 0, animating = true, autoPlay = false, autoTimer = null;
  var CATEGORIES = [
    { color: [0, 212, 255], weight: 0.25 }, { color: [168, 85, 247], weight: 0.20 },
    { color: [240, 192, 32], weight: 0.15 }, { color: [59, 130, 246], weight: 0.15 },
    { color: [16, 185, 129], weight: 0.10 }, { color: [239, 68, 68], weight: 0.08 },
    { color: [249, 115, 22], weight: 0.07 }
  ];

  function resizeParticles() { PW = particleCanvas.width = window.innerWidth; PH = particleCanvas.height = window.innerHeight; }

  function pickCategory() {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < CATEGORIES.length; i++) { acc += CATEGORIES[i].weight; if (r <= acc) return CATEGORIES[i].color; }
    return CATEGORIES[0].color;
  }

  function createParticle() {
    var color = pickCategory();
    return { x: Math.random() * PW, y: Math.random() * PH, tx: Math.random() * PW, ty: Math.random() * PH,
      r: Math.random() * 2 + 0.5, color: color, alpha: Math.random() * 0.5 + 0.2,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.004 + 0.002 };
  }

  function initParticles() { particles = []; for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle()); }

  function setParticleTargets(stage) {
    var cx = PW / 2, cy = PH / 2;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i], group, groupAngle, spread, baseX, baseY;
      switch (stage) {
        case 0: p.tx = Math.random() * PW; p.ty = PH * (0.25 + (i % 3) * 0.25) + (Math.random() - 0.5) * PH * 0.06; p.vx = 0.2 + Math.random() * 0.3; break;
        case 1: var a1 = (i / particles.length) * Math.PI * 2 + Math.random() * 0.3; var d1 = 40 + Math.random() * Math.min(PW, PH) * 0.2;
          p.tx = cx + Math.cos(a1) * d1; p.ty = cy + Math.sin(a1) * d1; p.vx = (Math.random() - 0.5) * 0.15; break;
        case 2: p.tx = cx + (Math.random() - 0.5) * PW * 0.3; p.ty = PH * 0.1 + (i / particles.length) * PH * 0.8; p.vx = (Math.random() - 0.5) * 0.1; break;
        case 3: group = i % 5; groupAngle = (group / 5) * Math.PI * 2; spread = Math.min(PW, PH) * 0.08;
          baseX = cx + Math.cos(groupAngle) * Math.min(PW, PH) * 0.18; baseY = cy + Math.sin(groupAngle) * Math.min(PW, PH) * 0.18;
          p.tx = baseX + (Math.random() - 0.5) * spread; p.ty = baseY + (Math.random() - 0.5) * spread; p.vx = (Math.random() - 0.5) * 0.1; break;
        case 4: p.tx = Math.random() * PW; p.ty = Math.random() * PH; p.vx = (Math.random() - 0.5) * 0.15; break;
      }
    }
  }

  function drawParticles() {
    pctx.clearRect(0, 0, PW, PH);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i], ease = 0.012 + (currentStage === 0 ? 0 : 0.006);
      p.x += (p.tx - p.x) * ease + p.vx + Math.sin(p.phase) * 0.12;
      p.y += (p.ty - p.y) * ease + p.vy + Math.cos(p.phase) * 0.12;
      p.phase += p.speed;
      if (currentStage === 0 || currentStage === 4) {
        if (p.x < -10 || p.x > PW + 10) p.tx = Math.random() * PW;
        if (p.y < -10 || p.y > PH + 10) p.ty = Math.random() * PH;
      }
      var rgb = p.color;
      pctx.beginPath(); pctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      pctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (p.alpha * 0.12) + ')'; pctx.fill();
      pctx.beginPath(); pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + p.alpha + ')'; pctx.fill();
    }
    if (animating) requestAnimationFrame(drawParticles);
  }

  // === Data Layer ===
  var PI_API = 'https://pi.ruv.io/v1';
  var graphData = null, isLiveData = false;
  var CATEGORY_COLORS = {
    architecture: { r: 0, g: 212, b: 255 }, pattern: { r: 168, g: 85, b: 247 },
    solution: { r: 240, g: 192, b: 32 }, security: { r: 239, g: 68, b: 68 },
    performance: { r: 16, g: 185, b: 129 }, tooling: { r: 59, g: 130, b: 246 },
    debug: { r: 249, g: 115, b: 22 }, convention: { r: 236, g: 72, b: 153 }
  };
  var CAT_NAMES = ['architecture', 'pattern', 'solution', 'security', 'performance', 'tooling', 'debug', 'convention'];
  var SAMPLE_TITLES = {
    architecture: ['Auth Flow Design', 'Service Mesh Layout', 'Event Sourcing Schema', 'Microservice Boundary', 'CQRS Pipeline', 'Gateway Config', 'Load Balancer Topology', 'API Versioning'],
    pattern: ['Saga Orchestration', 'Circuit Breaker', 'Retry with Backoff', 'Bulkhead Isolation', 'Observer Chain', 'Strategy Selector', 'Factory Registry', 'Adapter Bridge'],
    solution: ['Cache Strategy', 'Rate Limiter', 'Token Refresh', 'Queue Processor', 'Batch Uploader', 'Stream Aggregator', 'Search Indexer', 'Data Pipeline'],
    security: ['JWT Validation', 'RBAC Matrix', 'Input Sanitizer', 'CORS Policy', 'CSP Headers', 'Secret Rotation', 'Audit Logger'],
    performance: ['Connection Pool', 'Query Optimizer', 'Lazy Loader', 'Bundle Splitter', 'Memory Profiler', 'Hotpath Cache'],
    tooling: ['CLI Scaffold', 'Dev Server', 'Lint Config', 'CI Pipeline', 'Docker Compose', 'Test Harness'],
    debug: ['Stack Trace Parser', 'Memory Leak Finder', 'Deadlock Detector', 'Race Condition Fix', 'Log Correlator'],
    convention: ['Naming Standards', 'Code Review Rules', 'Branch Strategy', 'Commit Format', 'PR Template']
  };
  var FALLBACK_STATUS = { total_memories: 965, total_contributors: 59, total_votes: 947, graph_edges: 125429, cluster_count: 20 };

  function buildFallbackNodes() {
    var nodes = [], id = 0;
    for (var c = 0; c < CAT_NAMES.length; c++) {
      var cat = CAT_NAMES[c], titles = SAMPLE_TITLES[cat];
      var count = (cat === 'architecture' || cat === 'pattern' || cat === 'solution') ? 10 : 6;
      for (var t = 0; t < count && t < titles.length; t++) {
        var q = 0.4 + Math.random() * 0.5, col = CATEGORY_COLORS[cat];
        nodes.push({ id: 'fb-' + id, title: titles[t], category: cat, quality: q,
          x: Math.random() * 600 + 100, y: Math.random() * 400 + 100, vx: 0, vy: 0,
          radius: 4 + q * 10, color: col, phase: Math.random() * Math.PI * 2, cluster: -1, visible: true, scale: 1 });
        id++;
      }
    }
    return nodes;
  }

  function buildEdgesFromNodes(nodes) {
    var edges = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        if (nodes[i].category === nodes[j].category && Math.random() < 0.15) edges.push({ source: nodes[i], target: nodes[j], alpha: 0.15 });
        else if (Math.random() < 0.02) edges.push({ source: nodes[i], target: nodes[j], alpha: 0.06 });
      }
    }
    return edges;
  }

  function assignClusters(nodes) {
    var catMap = {}, clusterIdx = 0, clusters = [];
    for (var i = 0; i < nodes.length; i++) {
      var cat = nodes[i].category;
      if (catMap[cat] === undefined) {
        catMap[cat] = clusterIdx;
        var col = CATEGORY_COLORS[cat] || { r: 128, g: 128, b: 128 };
        clusters.push({ id: clusterIdx, category: cat, color: col, coherence: (0.6 + Math.random() * 0.35).toFixed(2), cx: 0, cy: 0, count: 0 });
        clusterIdx++;
      }
      nodes[i].cluster = catMap[cat];
      clusters[catMap[cat]].count++;
    }
    return clusters;
  }

  function fetchPiData() {
    var statusP = fetch(PI_API + '/status').then(function(r) { return r.json(); }).catch(function() { return null; });
    var listP = fetch(PI_API + '/memories/list?limit=100').then(function(r) { return r.json(); }).catch(function() { return null; });
    return Promise.all([statusP, listP]).then(function(res) {
      var status = res[0], list = res[1], nodes;
      if (list && Array.isArray(list) && list.length > 0) {
        isLiveData = true; nodes = [];
        for (var i = 0; i < list.length; i++) {
          var m = list[i], cat = (m.category || 'pattern').toLowerCase();
          if (!CATEGORY_COLORS[cat]) cat = 'pattern';
          var al = m.alpha || 1, be = m.beta || 1, q = al / (al + be), col = CATEGORY_COLORS[cat];
          nodes.push({ id: m.id || ('n-' + i), title: m.title || ('Memory ' + i), category: cat, quality: q,
            x: Math.random() * 600 + 100, y: Math.random() * 400 + 100, vx: 0, vy: 0,
            radius: 4 + q * 10, color: col, phase: Math.random() * Math.PI * 2, cluster: -1, visible: true, scale: 1 });
        }
      } else { isLiveData = false; nodes = buildFallbackNodes(); }
      graphData = { nodes: nodes, edges: buildEdgesFromNodes(nodes), clusters: assignClusters(nodes), status: status || FALLBACK_STATUS };
      updateModeBadge(); updateLiveStats();
    });
  }

  function updateModeBadge() {
    var badge = document.getElementById('modeBadge');
    badge.textContent = isLiveData ? 'Pi Brain \u00B7 Live' : 'Pi Brain \u00B7 Demo';
    badge.style.borderColor = isLiveData ? 'rgba(16,185,129,0.4)' : 'var(--border)';
    badge.style.color = isLiveData ? '#10b981' : 'var(--text-dim)';
  }

  function updateLiveStats() {
    if (!graphData) return;
    var s = graphData.status;
    var map = { statMemories: s.total_memories, statContributors: s.total_contributors, statVotes: s.total_votes, statClusters: s.cluster_count };
    for (var key in map) { var el = document.getElementById(key); if (el && map[key]) el.textContent = map[key].toLocaleString(); }
  }

  // === Force-Directed Layout ===
  var SIM = { repulsion: -200, springLen: 60, springK: 0.015, damping: 0.90, gravity: 0.008, maxVel: 4 };

  function simulationStep() {
    if (!graphData) return;
    var nodes = graphData.nodes, edges = graphData.edges, cx = GW / 2, cy = GH / 2;
    var vis = [];
    for (var v = 0; v < nodes.length; v++) { if (nodes[v].visible) vis.push(nodes[v]); }
    for (var i = 0; i < vis.length; i++) {
      for (var j = i + 1; j < vis.length; j++) {
        var dx = vis[j].x - vis[i].x, dy = vis[j].y - vis[i].y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = SIM.repulsion / (dist * dist), fx = (dx / dist) * f, fy = (dy / dist) * f;
        vis[i].vx -= fx; vis[i].vy -= fy; vis[j].vx += fx; vis[j].vy += fy;
      }
    }
    for (var e = 0; e < edges.length; e++) {
      var s = edges[e].source, t = edges[e].target;
      if (!s.visible || !t.visible) continue;
      var edx = t.x - s.x, edy = t.y - s.y, ed = Math.sqrt(edx * edx + edy * edy) || 1;
      var ef = (ed - SIM.springLen) * SIM.springK, efx = (edx / ed) * ef, efy = (edy / ed) * ef;
      s.vx += efx; s.vy += efy; t.vx -= efx; t.vy -= efy;
    }
    for (var k = 0; k < vis.length; k++) {
      var n = vis[k]; if (n.pinned) continue;
      n.vx += (cx - n.x) * SIM.gravity; n.vy += (cy - n.y) * SIM.gravity;
      n.vx *= SIM.damping; n.vy *= SIM.damping;
      n.vx = Math.max(-SIM.maxVel, Math.min(SIM.maxVel, n.vx));
      n.vy = Math.max(-SIM.maxVel, Math.min(SIM.maxVel, n.vy));
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(20, Math.min(GW - 20, n.x)); n.y = Math.max(20, Math.min(GH - 20, n.y));
    }
  }

  // === Graph Canvas Setup ===
  var graphCanvas = document.getElementById('graphCanvas');
  var gctx = graphCanvas.getContext('2d');
  var GW, GH, camera = { x: 0, y: 0, zoom: 1 };
  var hoveredNode = null, draggedNode = null, isDragging = false;
  var graphAnimating = false, stageTime = 0, clusterRevealed = false;

  function resizeGraph() { GW = graphCanvas.width = window.innerWidth; GH = graphCanvas.height = window.innerHeight; }
  function worldToScreen(wx, wy) { return { x: (wx - camera.x) * camera.zoom + GW / 2, y: (wy - camera.y) * camera.zoom + GH / 2 }; }
  function screenToWorld(sx, sy) { return { x: (sx - GW / 2) / camera.zoom + camera.x, y: (sy - GH / 2) / camera.zoom + camera.y }; }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function rgba(col, a) { return 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + ')'; }
  function rgbaObj(col, a) { return 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + a + ')'; }

  // === Shared Lane Drawing (Stages 0 & 1) ===
  var DEV_NAMES = ['Dev A', 'Dev B', 'Dev C'];
  var DAY_LABELS = ['Mon', 'Wed', 'Fri'];
  var QUESTION = 'How do I handle rate limiting?';
  var ANSWERS = ['Use token bucket with Redis...', 'Implement sliding window...', 'Try fixed window counter...'];

  function drawLanes(activeIdx, doneBelow) {
    var leftX = GW * 0.12, rightX = GW * 0.82;
    for (var lane = 0; lane < 3; lane++) {
      var ly = GH * (0.25 + lane * 0.25);
      var isAct = lane === activeIdx, isDone = doneBelow ? lane < activeIdx : false;
      var la = isAct ? 1.0 : (isDone ? (doneBelow === 'dim' ? 0.2 : 0.4) : (doneBelow ? 0.35 : 0.25));
      // Lane line
      gctx.beginPath(); gctx.moveTo(leftX, ly); gctx.lineTo(rightX, ly);
      gctx.strokeStyle = 'rgba(42,42,58,' + la * 0.5 + ')'; gctx.lineWidth = 1; gctx.stroke();
      // User icon
      gctx.beginPath(); gctx.arc(leftX, ly, 18, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(0,212,255,' + la * 0.15 + ')'; gctx.fill();
      gctx.strokeStyle = 'rgba(0,212,255,' + la * 0.5 + ')'; gctx.lineWidth = 1.5; gctx.stroke();
      gctx.font = '600 12px "JetBrains Mono",monospace'; gctx.fillStyle = 'rgba(0,212,255,' + la + ')';
      gctx.textAlign = 'center'; gctx.textBaseline = 'middle'; gctx.fillText(DEV_NAMES[lane], leftX, ly);
      // AI box
      gctx.fillStyle = 'rgba(168,85,247,' + la * 0.1 + ')';
      roundRect(gctx, rightX - 25, ly - 14, 50, 28, 6); gctx.fill();
      gctx.strokeStyle = 'rgba(168,85,247,' + la * 0.4 + ')'; gctx.lineWidth = 1; gctx.stroke();
      gctx.font = '500 9px "JetBrains Mono",monospace'; gctx.fillStyle = 'rgba(168,85,247,' + la + ')'; gctx.fillText('AI', rightX, ly);
      // Day label
      if (isAct || isDone) {
        gctx.font = '600 11px "JetBrains Mono",monospace'; gctx.fillStyle = 'rgba(240,192,32,' + la + ')';
        gctx.textAlign = 'left'; gctx.fillText(DAY_LABELS[lane], leftX - 18, ly - 28);
      }
    }
  }

  function drawBezierArrow(ctx, x1, y1, x2, y2, curve, color, alpha) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + curve;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = 2; ctx.stroke();
    var angle = Math.atan2(y2 - my, x2 - mx), hl = 8;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4));
    ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = 2; ctx.stroke();
  }

  // === Stage 0: Groundhog Day ===
  var ghPhase = 0, ghTimer = 0, ghStarted = false;

  function startGroundhog() { ghPhase = 0; ghTimer = 0; ghStarted = true; var c = document.getElementById('caption0'); c.textContent = ''; c.classList.remove('visible'); }

  function renderGroundhogDay() {
    var leftX = GW * 0.12, rightX = GW * 0.82, midX = (leftX + rightX) / 2;
    var dur = 3500;
    ghTimer += 16;
    if (ghTimer > dur && ghPhase < 3) { ghPhase++; ghTimer = 0; }
    drawLanes(ghPhase < 3 ? ghPhase : -1, 'dim');

    if (ghPhase < 3 && ghStarted) {
      var ly = GH * (0.25 + ghPhase * 0.25), p = Math.min(1, ghTimer / dur);
      // Question (0-35%)
      if (p < 0.35) {
        var qp = p / 0.35, eq = 1 - Math.pow(1 - qp, 3);
        drawBezierArrow(gctx, leftX + 30, ly, leftX + 30 + (rightX - leftX - 80) * eq, ly, -12, [240, 192, 32], 0.8 * eq);
        if (qp > 0.3) { gctx.font = '400 10px "JetBrains Mono",monospace'; gctx.fillStyle = rgba([240, 192, 32], Math.min(1, (qp - 0.3) * 3));
          gctx.textAlign = 'center'; gctx.fillText(QUESTION, midX, ly - 18); }
      }
      // Answer (35-65%)
      if (p >= 0.35 && p < 0.65) {
        var ap = (p - 0.35) / 0.3, ea = 1 - Math.pow(1 - ap, 3);
        drawBezierArrow(gctx, rightX - 30, ly, rightX - 30 - (rightX - leftX - 80) * ea, ly, 12, [0, 212, 255], 0.8 * ea);
        if (ap > 0.3) { gctx.font = '400 9px "JetBrains Mono",monospace'; gctx.fillStyle = rgba([0, 212, 255], Math.min(1, (ap - 0.3) * 3));
          gctx.textAlign = 'center'; gctx.fillText(ANSWERS[ghPhase], midX, ly + 16); }
      }
      // Dissolve (65-100%)
      if (p >= 0.65) {
        var dp = (p - 0.65) / 0.35, fa = 1 - dp;
        drawBezierArrow(gctx, leftX + 30, ly, rightX - 30, ly, -12, [240, 192, 32], fa * 0.3);
        drawBezierArrow(gctx, rightX - 30, ly, leftX + 30, ly, 12, [0, 212, 255], fa * 0.3);
        for (var pp = 0; pp < Math.floor(dp * 20); pp++) {
          var px = leftX + 30 + Math.random() * (rightX - leftX - 60), py = ly + (Math.random() - 0.5) * 30 - dp * 20;
          gctx.beginPath(); gctx.arc(px, py, 1.5, 0, Math.PI * 2);
          gctx.fillStyle = rgba(pp % 2 === 0 ? [240, 192, 32] : [0, 212, 255], (1 - dp) * 0.4); gctx.fill();
        }
      }
    }
    document.getElementById('meter0Value').textContent = '0%';
    if (ghPhase >= 3) { var c = document.getElementById('caption0'); c.textContent = '3 conversations. Same problem. 3 different answers. Nothing learned.'; c.classList.add('visible'); }
  }

  // === Stage 1: Collective Memory ===
  var cmPhase = 0, cmTimer = 0, cmStarted = false, cmQuality = 0, brainGlow = 0;

  function startCollective() {
    cmPhase = 0; cmTimer = 0; cmStarted = true; cmQuality = 0; brainGlow = 0;
    document.getElementById('qualityDisplay').classList.remove('visible');
    document.getElementById('meter1Fill').style.width = '0%';
    document.getElementById('meter1Value').textContent = '0%';
    var c = document.getElementById('caption1'); c.textContent = ''; c.classList.remove('visible');
  }

  function renderCollective() {
    var leftX = GW * 0.12, rightX = GW * 0.82, midX = (leftX + rightX) / 2;
    var cX = GW * 0.5, cY = GH * 0.5, dur = 4000;
    cmTimer += 16;
    if (cmTimer > dur && cmPhase < 3) { cmPhase++; cmTimer = 0; }
    drawLanes(cmPhase < 3 ? cmPhase : -1, true);

    // Pi-Brain node
    var pulse = 1 + Math.sin(stageTime * 0.003) * 0.08, bR = 30 * pulse;
    if (brainGlow > 0) {
      gctx.beginPath(); gctx.arc(cX, cY, bR * 3, 0, Math.PI * 2); gctx.fillStyle = 'rgba(0,212,255,' + brainGlow * 0.05 + ')'; gctx.fill();
      gctx.beginPath(); gctx.arc(cX, cY, bR * 2, 0, Math.PI * 2); gctx.fillStyle = 'rgba(0,212,255,' + brainGlow * 0.08 + ')'; gctx.fill();
    }
    gctx.beginPath(); gctx.arc(cX, cY, bR, 0, Math.PI * 2);
    gctx.fillStyle = 'rgba(0,212,255,0.12)'; gctx.fill();
    gctx.strokeStyle = 'rgba(0,212,255,0.6)'; gctx.lineWidth = 2; gctx.stroke();
    gctx.font = '700 10px "JetBrains Mono",monospace'; gctx.fillStyle = 'rgba(0,212,255,0.9)';
    gctx.textAlign = 'center'; gctx.textBaseline = 'middle'; gctx.fillText('Pi', cX, cY - 5);
    gctx.font = '500 8px "JetBrains Mono",monospace'; gctx.fillText('Brain', cX, cY + 7);

    // Memory node orbiting brain
    if (cmQuality > 0) {
      var mA = stageTime * 0.001, mD = bR + 20;
      gctx.beginPath(); gctx.arc(cX + Math.cos(mA) * mD, cY + Math.sin(mA) * mD, 4, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(240,192,32,0.7)'; gctx.fill();
    }

    if (cmPhase < 3 && cmStarted) {
      var ly = GH * (0.25 + cmPhase * 0.25), p = Math.min(1, cmTimer / dur);
      var quals = [0.72, 0.85, 0.91];
      var qualLabels = ['Quality: 0.72', '0.85 \u2014 verified by 2 others', '0.91 \u2014 verified by 4, corrected once'];

      // Question (0-25%)
      if (p < 0.25) {
        var qp = p / 0.25, eq = 1 - Math.pow(1 - qp, 3);
        drawBezierArrow(gctx, leftX + 30, ly, leftX + 30 + (rightX - leftX - 80) * eq, ly, -12, [240, 192, 32], 0.8 * eq);
        if (qp > 0.3) { gctx.font = '400 10px "JetBrains Mono",monospace'; gctx.fillStyle = rgba([240, 192, 32], Math.min(1, (qp - 0.3) * 3));
          gctx.textAlign = 'center'; gctx.fillText(QUESTION, midX, ly - 18); }
      }
      // Brain pulse (25-35%) for subsequent devs
      if (p >= 0.25 && p < 0.35 && cmPhase > 0) brainGlow = Math.sin(((p - 0.25) / 0.1) * Math.PI) * 1.5;
      // Answer (35-55%)
      if (p >= 0.35 && p < 0.55) {
        var ap = (p - 0.35) / 0.2, ea = 1 - Math.pow(1 - ap, 3);
        if (cmPhase === 0) {
          drawBezierArrow(gctx, rightX - 30, ly, rightX - 30 - (rightX - leftX - 80) * ea, ly, 12, [0, 212, 255], 0.8 * ea);
        } else {
          var ap2 = Math.min(1, ap * 1.3), ea2 = 1 - Math.pow(1 - ap2, 3);
          drawBezierArrow(gctx, cX, cY, cX + (leftX + 30 - cX) * ea2, cY + (ly - cY) * ea2, 0, [0, 212, 255], 0.8 * ea2);
        }
        if (ap > 0.5) { gctx.font = '400 9px "JetBrains Mono",monospace'; gctx.fillStyle = rgba([0, 212, 255], Math.min(1, (ap - 0.5) * 4));
          gctx.textAlign = 'center'; gctx.fillText(qualLabels[cmPhase], midX, ly + 16); }
      }
      // Flow into brain (55-75%)
      if (p >= 0.55 && p < 0.75) {
        var fp = (p - 0.55) / 0.2, ef = 1 - Math.pow(1 - fp, 3);
        var sx = cmPhase === 0 ? rightX - 30 : midX, sy = ly;
        for (var tp = 0; tp < 8; tp++) {
          var tpP = Math.max(0, Math.min(1, ef - tp * 0.08));
          gctx.beginPath(); gctx.arc(sx + (cX - sx) * tpP, sy + (cY - sy) * tpP, 3 - tp * 0.3, 0, Math.PI * 2);
          gctx.fillStyle = rgba([240, 192, 32], (1 - tp * 0.1) * tpP); gctx.fill();
        }
        brainGlow = Math.max(brainGlow, ef);
      }
      // Update (75-100%)
      if (p >= 0.75) {
        cmQuality = quals[cmPhase]; brainGlow = Math.max(0, brainGlow - 0.01);
        var qd = document.getElementById('qualityDisplay');
        qd.textContent = 'Memories: 1 \u00B7 Quality: ' + cmQuality.toFixed(2); qd.classList.add('visible');
        var pct = Math.round(cmQuality * 100);
        document.getElementById('meter1Fill').style.width = pct + '%';
        document.getElementById('meter1Value').textContent = pct + '%';
      }
    }
    if (cmPhase >= 3) {
      var c = document.getElementById('caption1');
      c.textContent = 'What one learns, all know. The answer improved 3 times without anyone rewriting it.';
      c.classList.add('visible');
      document.getElementById('meter1Fill').style.width = '91%'; document.getElementById('meter1Value').textContent = '91%';
    }
  }

  // === Stage 2: Bayesian Voting ===
  var vMems = [
    { title: 'Token bucket + Redis (tested)', score: 0.50, ups: 0, downs: 0 },
    { title: 'Sliding window counter', score: 0.50, ups: 0, downs: 0 },
    { title: 'Fixed window (simple)', score: 0.50, ups: 0, downs: 0 },
    { title: 'Use API Gateway throttle', score: 0.50, ups: 0, downs: 0 },
    { title: 'Rate limit with nginx', score: 0.50, ups: 0, downs: 0 },
    { title: 'setTimeout retry loop', score: 0.50, ups: 0, downs: 0 }
  ];
  var vRound = 0, vTimer = 0, vBuilt = false;
  var VROUNDS = [
    [{ idx: 0, up: 3, down: 0 }],
    [{ idx: 5, up: 0, down: 2 }, { idx: 1, up: 2, down: 0 }],
    [{ idx: 0, up: 2, down: 0 }, { idx: 3, up: 1, down: 0 }],
    [{ idx: 5, up: 0, down: 1 }, { idx: 0, up: 1, down: 0 }]
  ];

  function bayesScore(u, d) { return (1 + u) / (2 + u + d); }

  function buildVotingUI() {
    if (vBuilt) return; vBuilt = true;
    var c = document.getElementById('votingDemo');
    while (c.firstChild) c.removeChild(c.firstChild);
    for (var i = 0; i < vMems.length; i++) {
      var row = document.createElement('div'); row.className = 'vote-bar-row'; row.id = 'vr' + i;
      var t = document.createElement('span'); t.className = 'vote-bar-title'; t.textContent = vMems[i].title;
      var tr = document.createElement('div'); tr.className = 'vote-bar-track';
      var f = document.createElement('div'); f.className = 'vote-bar-fill'; f.id = 'vf' + i; f.style.width = '50%';
      tr.appendChild(f);
      var s = document.createElement('span'); s.className = 'vote-bar-score'; s.id = 'vs' + i; s.textContent = '0.50';
      var vc = document.createElement('span'); vc.className = 'vote-bar-count'; vc.id = 'vc' + i; vc.textContent = '0 votes';
      row.appendChild(t); row.appendChild(tr); row.appendChild(s); row.appendChild(vc); c.appendChild(row);
    }
  }

  function startVoting() {
    vRound = 0; vTimer = 0;
    for (var i = 0; i < vMems.length; i++) { vMems[i].score = 0.50; vMems[i].ups = 0; vMems[i].downs = 0; }
    buildVotingUI(); updateVotingUI();
  }

  function updateVotingUI() {
    for (var i = 0; i < vMems.length; i++) {
      var m = vMems[i], f = document.getElementById('vf' + i), s = document.getElementById('vs' + i), vc = document.getElementById('vc' + i);
      if (f) {
        f.style.width = Math.round(m.score * 100) + '%';
        f.style.background = m.score >= 0.7 ? 'linear-gradient(90deg,rgba(0,212,255,0.6),rgba(0,212,255,0.9))' :
          m.score >= 0.45 ? 'linear-gradient(90deg,rgba(240,192,32,0.6),rgba(240,192,32,0.9))' :
          'linear-gradient(90deg,rgba(239,68,68,0.6),rgba(239,68,68,0.9))';
      }
      if (s) s.textContent = m.score.toFixed(2);
      if (vc) vc.textContent = m.ups + ' up' + (m.downs > 0 ? ', ' + m.downs + ' down' : '');
    }
  }

  function tickVoting() {
    vTimer += 16;
    var ri = Math.floor(vTimer / 1500);
    if (ri > vRound && vRound < VROUNDS.length) {
      var rd = VROUNDS[vRound];
      for (var v = 0; v < rd.length; v++) {
        var vote = rd[v], m = vMems[vote.idx];
        m.ups += vote.up; m.downs += vote.down; m.score = bayesScore(m.ups, m.downs);
      }
      vRound++; updateVotingUI();
    }
    if (vRound >= VROUNDS.length) document.getElementById('bayesianExplainer').classList.add('visible');
  }

  // === Stage 3: Emergent Structure ===
  var clusterLerpProgress = 0, clusterTargets = null;

  function computeClusterCenters() {
    if (!graphData) return;
    var cls = graphData.clusters, nodes = graphData.nodes;
    for (var c = 0; c < cls.length; c++) { cls[c].cx = 0; cls[c].cy = 0; cls[c].count = 0; }
    for (var i = 0; i < nodes.length; i++) { var cl = cls[nodes[i].cluster]; if (cl) { cl.cx += nodes[i].x; cl.cy += nodes[i].y; cl.count++; } }
    for (var j = 0; j < cls.length; j++) { if (cls[j].count > 0) { cls[j].cx /= cls[j].count; cls[j].cy /= cls[j].count; } }
    var aPer = (Math.PI * 2) / cls.length, sR = Math.min(GW, GH) * 0.25, gcx = GW / 2, gcy = GH / 2;
    clusterTargets = {};
    for (var k = 0; k < cls.length; k++) { var a = aPer * k - Math.PI / 2; clusterTargets[cls[k].id] = { x: gcx + Math.cos(a) * sR, y: gcy + Math.sin(a) * sR }; }
  }

  function renderEmergent() {
    if (!graphData) return;
    var nodes = graphData.nodes, edges = graphData.edges, clusters = graphData.clusters;
    if (clusterRevealed && clusterTargets) {
      clusterLerpProgress = Math.min(1, clusterLerpProgress + 0.015);
      var t = clusterLerpProgress, e2 = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i], ct = clusterTargets[n.cluster];
        if (ct && n.origX !== undefined) {
          n.x = n.origX + (ct.x + (n.origX - n.origCX) * 0.6 - n.origX) * e2;
          n.y = n.origY + (ct.y + (n.origY - n.origCY) * 0.6 - n.origY) * e2;
        }
      }
      if (clusterLerpProgress > 0.8) document.getElementById('crossClusterInsight').classList.add('visible');
    }
    if (!clusterRevealed) simulationStep();
    var time = stageTime * 0.001;
    gctx.save(); gctx.translate(GW / 2, GH / 2); gctx.scale(camera.zoom, camera.zoom); gctx.translate(-camera.x, -camera.y);

    // Convex hulls
    if (clusterRevealed && clusterLerpProgress > 0.3) {
      for (var c = 0; c < clusters.length; c++) {
        var cl = clusters[c], cN = [];
        for (var ni = 0; ni < nodes.length; ni++) { if (nodes[ni].cluster === cl.id) cN.push(nodes[ni]); }
        if (cN.length < 3) continue;
        var hull = convexHull(cN); if (hull.length < 3) continue;
        gctx.beginPath(); gctx.moveTo(hull[0].x, hull[0].y);
        for (var h = 1; h < hull.length; h++) gctx.lineTo(hull[h].x, hull[h].y);
        gctx.closePath(); gctx.strokeStyle = rgbaObj(cl.color, 0.3); gctx.setLineDash([6, 4]); gctx.lineWidth = 1.5; gctx.stroke(); gctx.setLineDash([]);
        var ct2 = clusterTargets ? clusterTargets[cl.id] : null;
        if (ct2) { gctx.font = '10px "JetBrains Mono",monospace'; gctx.fillStyle = rgbaObj(cl.color, 0.7); gctx.textAlign = 'center';
          gctx.fillText(cl.category + ' (' + cl.coherence + ')', ct2.x, ct2.y - cN[0].radius * 2 - 10); }
      }
      // Cross-cluster edge highlight
      if (clusterLerpProgress > 0.7) {
        for (var ce = 0; ce < edges.length; ce++) {
          if (edges[ce].source.cluster !== edges[ce].target.cluster && edges[ce].source.visible && edges[ce].target.visible) {
            gctx.beginPath(); gctx.moveTo(edges[ce].source.x, edges[ce].source.y); gctx.lineTo(edges[ce].target.x, edges[ce].target.y);
            gctx.strokeStyle = 'rgba(240,192,32,' + (0.4 + Math.sin(time * 3) * 0.2) + ')'; gctx.lineWidth = 2; gctx.setLineDash([4, 4]); gctx.stroke(); gctx.setLineDash([]);
            break;
          }
        }
      }
    }
    // Edges
    for (var e = 0; e < edges.length; e++) {
      var s = edges[e].source, tg = edges[e].target;
      if (!s.visible || !tg.visible) continue;
      var sc = s.cluster === tg.cluster, ea = clusterRevealed ? (sc ? 0.2 : 0.02) : (sc ? 0.15 : 0.04);
      gctx.beginPath(); gctx.moveTo(s.x, s.y); gctx.lineTo(tg.x, tg.y);
      gctx.strokeStyle = 'rgba(255,255,255,' + ea + ')'; gctx.lineWidth = 0.5; gctx.stroke();
    }
    // Nodes
    for (var nn = 0; nn < nodes.length; nn++) {
      var nd = nodes[nn]; if (!nd.visible) continue;
      var br = 1 + Math.sin(time * 2 + nd.phase) * 0.08, dr = nd.radius * br, nc = nd.color;
      gctx.beginPath(); gctx.arc(nd.x, nd.y, dr * 2.5, 0, Math.PI * 2); gctx.fillStyle = rgbaObj(nc, 0.06); gctx.fill();
      gctx.beginPath(); gctx.arc(nd.x, nd.y, dr, 0, Math.PI * 2); gctx.fillStyle = rgbaObj(nc, 0.85); gctx.fill();
      if (nd === hoveredNode) { gctx.strokeStyle = 'rgba(255,255,255,0.6)'; gctx.lineWidth = 2; gctx.stroke(); }
    }
    gctx.restore();
  }

  function convexHull(pts) {
    if (pts.length < 3) return pts.slice();
    var s = pts.slice().sort(function(a, b) { return a.x - b.x || a.y - b.y; });
    var lo = [], hi = [];
    for (var i = 0; i < s.length; i++) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], s[i]) <= 0) lo.pop(); lo.push(s[i]); }
    for (var j = s.length - 1; j >= 0; j--) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], s[j]) <= 0) hi.pop(); hi.push(s[j]); }
    lo.pop(); hi.pop(); return lo.concat(hi);
  }
  function cross(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }

  function populateClusterLegend() {
    if (!graphData) return;
    var leg = document.getElementById('clusterLegend'); while (leg.firstChild) leg.removeChild(leg.firstChild);
    for (var i = 0; i < graphData.clusters.length; i++) {
      var cl = graphData.clusters[i], bd = document.createElement('div'); bd.className = 'cluster-badge';
      var dt = document.createElement('span'); dt.className = 'cluster-dot';
      dt.style.background = 'rgb(' + cl.color.r + ',' + cl.color.g + ',' + cl.color.b + ')';
      dt.style.boxShadow = '0 0 6px rgba(' + cl.color.r + ',' + cl.color.g + ',' + cl.color.b + ',0.5)';
      var lb = document.createElement('span'); lb.textContent = cl.category + ' (' + cl.count + ')';
      bd.appendChild(dt); bd.appendChild(lb); leg.appendChild(bd);
    }
  }

  // === Stage 4: Live Search ===
  var searchDebounce = null;

  function performLiveSearch(query) {
    if (!query || !query.trim()) { var r = document.getElementById('searchResults'); while (r.firstChild) r.removeChild(r.firstChild); return; }
    fetch(PI_API + '/memories/search?q=' + encodeURIComponent(query) + '&limit=5')
      .then(function(r) { return r.json(); })
      .then(function(data) { if (Array.isArray(data) && data.length > 0) renderLiveResults(data); else renderFallbackResults(query); })
      .catch(function() { renderFallbackResults(query); });
  }

  function renderLiveResults(data) {
    var c = document.getElementById('searchResults'); while (c.firstChild) c.removeChild(c.firstChild);
    for (var i = 0; i < data.length; i++) {
      (function(entry, idx) {
        var div = document.createElement('div'); div.className = 'search-result-item';
        var t = document.createElement('span'); t.className = 'result-title'; t.textContent = entry.title || ('Memory ' + idx);
        var s = document.createElement('span'); s.className = 'result-score-badge';
        s.textContent = entry.alpha && entry.beta ? (entry.alpha / (entry.alpha + entry.beta)).toFixed(2) : '0.50';
        var vb = document.createElement('button'); vb.className = 'result-vote-btn'; vb.textContent = 'Upvote';
        vb.addEventListener('click', function() {
          if (vb.classList.contains('voted')) return; vb.classList.add('voted'); vb.textContent = 'Voted';
          fetch(PI_API + '/memories/' + (entry.id || '') + '/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction: 'up' }) }).catch(function() {});
        });
        div.appendChild(t); div.appendChild(s); div.appendChild(vb); c.appendChild(div);
        setTimeout(function() { div.classList.add('visible'); }, idx * 80);
      })(data[i], i);
    }
  }

  function renderFallbackResults(query) {
    var fb = [
      { title: 'Token Bucket Rate Limiter', score: '0.92' }, { title: 'Redis-based Sliding Window', score: '0.85' },
      { title: 'API Gateway Throttle Pattern', score: '0.78' }, { title: 'Circuit Breaker Implementation', score: '0.71' },
      { title: 'Exponential Backoff Strategy', score: '0.68' }
    ];
    var q = query.toLowerCase(), fl = fb.filter(function(e) { return e.title.toLowerCase().indexOf(q) !== -1 || q.length < 3; });
    if (fl.length === 0) fl = fb.slice(0, 3);
    var c = document.getElementById('searchResults'); while (c.firstChild) c.removeChild(c.firstChild);
    for (var i = 0; i < fl.length; i++) {
      (function(entry, idx) {
        var div = document.createElement('div'); div.className = 'search-result-item';
        var t = document.createElement('span'); t.className = 'result-title'; t.textContent = entry.title;
        var s = document.createElement('span'); s.className = 'result-score-badge'; s.textContent = entry.score;
        var vb = document.createElement('button'); vb.className = 'result-vote-btn'; vb.textContent = 'Upvote';
        vb.addEventListener('click', function() { vb.classList.add('voted'); vb.textContent = 'Voted'; });
        div.appendChild(t); div.appendChild(s); div.appendChild(vb); c.appendChild(div);
        setTimeout(function() { div.classList.add('visible'); }, idx * 80);
      })(fl[i], i);
    }
  }

  // === Tooltip ===
  function renderTooltip(node) {
    var sp = worldToScreen(node.x, node.y), tx = sp.x + 16, ty = sp.y - 20;
    if (tx + 180 > GW) tx = sp.x - 196; if (ty < 10) ty = 10;
    gctx.save(); gctx.fillStyle = 'rgba(18,18,26,0.85)'; gctx.strokeStyle = 'rgba(42,42,58,0.6)'; gctx.lineWidth = 1;
    roundRect(gctx, tx, ty, 180, 56, 8); gctx.fill(); gctx.stroke();
    gctx.font = '600 11px "JetBrains Mono",monospace'; gctx.fillStyle = '#e8eaed'; gctx.textAlign = 'left';
    gctx.fillText(node.title.length > 22 ? node.title.substring(0, 20) + '..' : node.title, tx + 10, ty + 20);
    gctx.font = '10px "JetBrains Mono",monospace'; gctx.fillStyle = '#8892a4'; gctx.fillText(node.category, tx + 10, ty + 35);
    gctx.fillStyle = '#00d4ff'; gctx.textAlign = 'right'; gctx.fillText(Math.round(node.quality * 100) + '%', tx + 170, ty + 35);
    gctx.restore();
  }

  // === Main Render Loop ===
  function renderGraph() {
    gctx.clearRect(0, 0, GW, GH);
    switch (currentStage) {
      case 0: renderGroundhogDay(); break;
      case 1: renderCollective(); break;
      case 2: tickVoting();
        var cx2 = GW / 2, cy2 = GH / 2, g2 = gctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, Math.min(GW, GH) * 0.35);
        g2.addColorStop(0, 'rgba(0,212,255,0.03)'); g2.addColorStop(0.5, 'rgba(168,85,247,0.015)'); g2.addColorStop(1, 'transparent');
        gctx.fillStyle = g2; gctx.fillRect(0, 0, GW, GH); break;
      case 3: renderEmergent(); break;
      case 4:
        var cx4 = GW / 2, cy4 = GH / 2, g4 = gctx.createRadialGradient(cx4, cy4, 0, cx4, cy4, Math.min(GW, GH) * 0.4);
        g4.addColorStop(0, 'rgba(16,185,129,0.02)'); g4.addColorStop(0.5, 'rgba(0,212,255,0.015)'); g4.addColorStop(1, 'transparent');
        gctx.fillStyle = g4; gctx.fillRect(0, 0, GW, GH); break;
    }
    if (hoveredNode && currentStage === 3) renderTooltip(hoveredNode);
    stageTime += 16;
    if (graphAnimating) requestAnimationFrame(renderGraph);
  }

  // === Interactions ===
  var mouseX = 0, mouseY = 0, lastMouseX = 0, lastMouseY = 0, isPanning = false, pinchDist = 0;

  function findNodeAt(sx, sy) {
    if (!graphData || currentStage !== 3) return null;
    var w = screenToWorld(sx, sy), nodes = graphData.nodes;
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (!nodes[i].visible) continue;
      var dx = w.x - nodes[i].x, dy = w.y - nodes[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < nodes[i].radius + 4) return nodes[i];
    }
    return null;
  }

  graphCanvas.addEventListener('mousemove', function(e) {
    mouseX = e.clientX; mouseY = e.clientY;
    if (draggedNode) { var w = screenToWorld(mouseX, mouseY); draggedNode.x = w.x; draggedNode.y = w.y; draggedNode.vx = 0; draggedNode.vy = 0; return; }
    if (isPanning) { camera.x -= (mouseX - lastMouseX) / camera.zoom; camera.y -= (mouseY - lastMouseY) / camera.zoom; lastMouseX = mouseX; lastMouseY = mouseY; return; }
    hoveredNode = findNodeAt(mouseX, mouseY); graphCanvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  });
  graphCanvas.addEventListener('mousedown', function(e) {
    mouseX = e.clientX; mouseY = e.clientY; lastMouseX = mouseX; lastMouseY = mouseY;
    var n = findNodeAt(mouseX, mouseY);
    if (n) { draggedNode = n; draggedNode.pinned = true; isDragging = true; } else if (currentStage === 3) isPanning = true;
  });
  graphCanvas.addEventListener('mouseup', function() {
    if (draggedNode) { draggedNode.pinned = false; draggedNode = null; isDragging = false; } isPanning = false;
  });
  graphCanvas.addEventListener('wheel', function(e) {
    if (currentStage !== 3) return; e.preventDefault();
    camera.zoom = Math.max(0.3, Math.min(3, camera.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
  }, { passive: false });

  graphCanvas.addEventListener('touchstart', function(e) {
    if (currentStage !== 3) return;
    if (e.touches.length === 1) {
      mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; lastMouseX = mouseX; lastMouseY = mouseY;
      var n = findNodeAt(mouseX, mouseY);
      if (n) { draggedNode = n; draggedNode.pinned = true; isDragging = true; } else isPanning = true;
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });
  graphCanvas.addEventListener('touchmove', function(e) {
    if (currentStage !== 3) return; e.preventDefault();
    if (e.touches.length === 1) {
      mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY;
      if (draggedNode) { var w = screenToWorld(mouseX, mouseY); draggedNode.x = w.x; draggedNode.y = w.y; draggedNode.vx = 0; draggedNode.vy = 0; }
      else if (isPanning) { camera.x -= (mouseX - lastMouseX) / camera.zoom; camera.y -= (mouseY - lastMouseY) / camera.zoom; }
      lastMouseX = mouseX; lastMouseY = mouseY;
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      var nd = Math.sqrt(dx * dx + dy * dy);
      if (pinchDist > 0) camera.zoom = Math.max(0.3, Math.min(3, camera.zoom * (nd / pinchDist)));
      pinchDist = nd;
    }
  }, { passive: false });
  graphCanvas.addEventListener('touchend', function() {
    if (draggedNode) { draggedNode.pinned = false; draggedNode = null; isDragging = false; } isPanning = false; pinchDist = 0;
  }, { passive: true });

  // === Stage Management ===
  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');
  var TOTAL = 5;

  function goToStage(n) {
    if (n < 0 || n >= TOTAL) return;
    currentStage = n; stageTime = 0;
    for (var i = 0; i < stages.length; i++) { if (i === n) stages[i].classList.add('visible'); else stages[i].classList.remove('visible'); }
    for (var j = 0; j < dots.length; j++) {
      dots[j].classList.toggle('active', j === n); dots[j].classList.toggle('completed', j < n);
      dots[j].setAttribute('aria-selected', j === n ? 'true' : 'false'); dots[j].setAttribute('tabindex', j === n ? '0' : '-1');
    }
    prevBtn.disabled = n === 0;
    nextBtn.textContent = n === TOTAL - 1 ? 'Restart' : 'Next \u2192';
    counter.textContent = (n + 1) + ' / ' + TOTAL;
    setParticleTargets(n);
    camera.x = 0; camera.y = 0; camera.zoom = 1;
    clusterRevealed = false; clusterLerpProgress = 0; hoveredNode = null;
    document.getElementById('crossClusterInsight').classList.remove('visible');
    if (graphData && n === 3) {
      for (var k = 0; k < graphData.nodes.length; k++) {
        graphData.nodes[k].visible = true; graphData.nodes[k].scale = 1;
        graphData.nodes[k].x = Math.random() * GW * 0.6 + GW * 0.2;
        graphData.nodes[k].y = Math.random() * GH * 0.6 + GH * 0.2;
      }
    }
    if (!graphAnimating) { graphAnimating = true; renderGraph(); }
    triggerStageEffects(n);
  }

  function triggerStageEffects(n) {
    if (n === 0) startGroundhog();
    if (n === 1) startCollective();
    if (n === 2) { startVoting(); document.getElementById('bayesianExplainer').classList.remove('visible'); }
    if (n === 3) populateClusterLegend();
    if (n === 4) {
      updateLiveStats(); var si = document.getElementById('liveSearch'); si.value = '';
      var r = document.getElementById('searchResults'); while (r.firstChild) r.removeChild(r.firstChild);
      setTimeout(function() { si.focus(); }, 500);
    }
  }

  prevBtn.addEventListener('click', function() { goToStage(currentStage - 1); });
  nextBtn.addEventListener('click', function() { if (currentStage === TOTAL - 1) goToStage(0); else goToStage(currentStage + 1); });
  for (var d = 0; d < dots.length; d++) { (function(dot) { dot.addEventListener('click', function() { goToStage(parseInt(dot.dataset.stage, 10)); }); })(dots[d]); }

  autoBtn.addEventListener('click', function() {
    autoPlay = !autoPlay; autoBtn.textContent = autoPlay ? '\u23F8 Pause' : '\u25B6 Auto';
    if (autoPlay) { autoTimer = setInterval(function() {
      if (currentStage < TOTAL - 1) goToStage(currentStage + 1);
      else { autoPlay = false; autoBtn.textContent = '\u25B6 Auto'; clearInterval(autoTimer); }
    }, 12000); } else clearInterval(autoTimer);
  });

  document.getElementById('revealBtn').addEventListener('click', function() {
    if (!graphData || clusterRevealed) return;
    clusterRevealed = true; clusterLerpProgress = 0; computeClusterCenters();
    var nodes = graphData.nodes, cls = graphData.clusters;
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].origX = nodes[i].x; nodes[i].origY = nodes[i].y;
      var cl = cls[nodes[i].cluster]; nodes[i].origCX = cl ? cl.cx : nodes[i].x; nodes[i].origCY = cl ? cl.cy : nodes[i].y;
    }
  });

  document.getElementById('liveSearch').addEventListener('input', function() {
    var q = this.value; clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function() { performLiveSearch(q); }, 200);
  });

  document.addEventListener('keydown', function(e) {
    if (document.activeElement === document.getElementById('liveSearch')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goToStage(Math.min(currentStage + 1, TOTAL - 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToStage(Math.max(currentStage - 1, 0)); }
  });

  // === Init ===
  function init() {
    resizeParticles(); resizeGraph();
    window.addEventListener('resize', function() { resizeParticles(); resizeGraph(); setParticleTargets(currentStage); });
    initParticles(); setParticleTargets(0); drawParticles();
    graphAnimating = true; renderGraph();
    fetchPiData().then(function() { if (currentStage >= 3) triggerStageEffects(currentStage); });
    startGroundhog();
  }

  init();
})();
