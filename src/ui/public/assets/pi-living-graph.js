(function() {
  'use strict';

  // ========================================================================
  // Section 1: Particle System
  // ========================================================================

  var particleCanvas = document.getElementById('particleCanvas');
  var pctx = particleCanvas.getContext('2d');
  var PW, PH;
  var PARTICLE_COUNT = 1200;
  var particles = [];
  var currentStage = 0;
  var animating = true;
  var autoPlay = false;
  var autoTimer = null;

  var CATEGORIES = [
    { color: [0, 212, 255], weight: 0.25 },
    { color: [168, 85, 247], weight: 0.20 },
    { color: [240, 192, 32], weight: 0.15 },
    { color: [59, 130, 246], weight: 0.15 },
    { color: [16, 185, 129], weight: 0.10 },
    { color: [239, 68, 68], weight: 0.08 },
    { color: [249, 115, 22], weight: 0.07 }
  ];

  function resizeParticles() {
    PW = particleCanvas.width = window.innerWidth;
    PH = particleCanvas.height = window.innerHeight;
  }

  function pickCategory() {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < CATEGORIES.length; i++) {
      acc += CATEGORIES[i].weight;
      if (r <= acc) return CATEGORIES[i].color;
    }
    return CATEGORIES[0].color;
  }

  function createParticle() {
    var color = pickCategory();
    return {
      x: Math.random() * PW,
      y: Math.random() * PH,
      tx: Math.random() * PW,
      ty: Math.random() * PH,
      r: Math.random() * 2 + 0.5,
      color: color,
      alpha: Math.random() * 0.5 + 0.2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.004 + 0.002
    };
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function setParticleTargets(stage) {
    var cx = PW / 2, cy = PH / 2;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var angle, dist, cols, rows, col, row;

      switch (stage) {
        case 0: // Grid pattern
          cols = 40;
          rows = Math.ceil(particles.length / cols);
          col = i % cols;
          row = Math.floor(i / cols);
          p.tx = (col / cols) * PW * 0.8 + PW * 0.1;
          p.ty = (row / rows) * PH * 0.8 + PH * 0.1;
          break;

        case 1: // Random scatter
          p.tx = Math.random() * PW;
          p.ty = Math.random() * PH;
          break;

        case 2: // Cluster into 5 groups
          var group = i % 5;
          angle = (group / 5) * Math.PI * 2;
          dist = Math.min(PW, PH) * 0.18;
          var bx = cx + Math.cos(angle) * dist;
          var by = cy + Math.sin(angle) * dist;
          p.tx = bx + (Math.random() - 0.5) * dist * 0.6;
          p.ty = by + (Math.random() - 0.5) * dist * 0.6;
          break;

        case 3: // Drift - slow hue shift positions
          p.tx = p.x + (Math.random() - 0.5) * 40;
          p.ty = p.y + (Math.random() - 0.5) * 40;
          break;

        case 4: // Orbital ring expanding
          angle = (i / particles.length) * Math.PI * 2;
          var ringR = 60 + (i / particles.length) * Math.min(PW, PH) * 0.35;
          p.tx = cx + Math.cos(angle) * ringR;
          p.ty = cy + Math.sin(angle) * ringR;
          break;
      }
    }
  }

  function drawParticles() {
    pctx.clearRect(0, 0, PW, PH);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var ease = 0.012 + (currentStage === 0 ? 0 : 0.006);
      p.x += (p.tx - p.x) * ease + p.vx + Math.sin(p.phase) * 0.12;
      p.y += (p.ty - p.y) * ease + p.vy + Math.cos(p.phase) * 0.12;
      p.phase += p.speed;

      if (currentStage === 1 || currentStage === 4) {
        if (p.x < -10 || p.x > PW + 10) p.tx = Math.random() * PW;
        if (p.y < -10 || p.y > PH + 10) p.ty = Math.random() * PH;
      }

      var rgb = p.color;
      var glowSize = p.r * 2.5;

      pctx.beginPath();
      pctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      pctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (p.alpha * 0.12) + ')';
      pctx.fill();

      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + p.alpha + ')';
      pctx.fill();
    }

    if (animating) requestAnimationFrame(drawParticles);
  }

  // ========================================================================
  // Section 2: Data Layer
  // ========================================================================

  var PI_API = 'https://pi.ruv.io/v1';
  var graphData = null;
  var isLiveData = false;

  var CATEGORY_COLORS = {
    architecture: { r: 0, g: 212, b: 255 },
    pattern:      { r: 168, g: 85, b: 247 },
    solution:     { r: 240, g: 192, b: 32 },
    security:     { r: 239, g: 68, b: 68 },
    performance:  { r: 16, g: 185, b: 129 },
    tooling:      { r: 59, g: 130, b: 246 },
    debug:        { r: 249, g: 115, b: 22 },
    convention:   { r: 236, g: 72, b: 153 }
  };

  var CAT_NAMES = ['architecture', 'pattern', 'solution', 'security', 'performance', 'tooling', 'debug', 'convention'];

  var SAMPLE_TITLES = {
    architecture: ['Auth Flow Design', 'Service Mesh Layout', 'Event Sourcing Schema', 'Microservice Boundary', 'CQRS Pipeline', 'Gateway Config', 'Load Balancer Topology', 'API Versioning'],
    pattern: ['Saga Orchestration', 'Circuit Breaker', 'Retry with Backoff', 'Bulkhead Isolation', 'Observer Chain', 'Strategy Selector', 'Factory Registry', 'Adapter Bridge'],
    solution: ['Cache Strategy', 'Rate Limiter', 'Token Refresh', 'Queue Processor', 'Batch Uploader', 'Stream Aggregator', 'Search Indexer', 'Data Pipeline'],
    security: ['JWT Validation', 'RBAC Matrix', 'Input Sanitizer', 'CORS Policy', 'CSP Headers', 'Secret Rotation', 'Audit Logger'],
    performance: ['Connection Pool', 'Query Optimizer', 'Lazy Loader', 'Bundle Splitter', 'Memory Profiler', 'Hotpath Cache'],
    tooling: ['CLI Scaffold', 'Dev Server', 'Lint Config', 'CI Pipeline', 'Docker Compose', 'Test Harness', 'Debug Probe'],
    debug: ['Stack Trace Parser', 'Memory Leak Finder', 'Deadlock Detector', 'Race Condition Fix', 'Log Correlator', 'Crash Reporter'],
    convention: ['Naming Standards', 'Code Review Rules', 'Branch Strategy', 'Commit Format', 'PR Template', 'Doc Structure']
  };

  function buildFallbackNodes() {
    var nodes = [];
    var id = 0;
    for (var c = 0; c < CAT_NAMES.length; c++) {
      var cat = CAT_NAMES[c];
      var titles = SAMPLE_TITLES[cat];
      var count = cat === 'architecture' || cat === 'pattern' || cat === 'solution' ? 10 : 6;
      for (var t = 0; t < count && t < titles.length; t++) {
        var quality = 0.4 + Math.random() * 0.5;
        var col = CATEGORY_COLORS[cat];
        nodes.push({
          id: 'fb-' + id,
          title: titles[t],
          category: cat,
          quality: quality,
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100,
          vx: 0, vy: 0,
          radius: 4 + quality * 10,
          color: col,
          phase: Math.random() * Math.PI * 2,
          cluster: -1,
          visible: true,
          scale: 1
        });
        id++;
      }
    }
    return nodes;
  }

  function buildEdgesFromNodes(nodes) {
    var edges = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        if (nodes[i].category === nodes[j].category && Math.random() < 0.15) {
          edges.push({ source: nodes[i], target: nodes[j], alpha: 0.15 });
        } else if (Math.random() < 0.02) {
          edges.push({ source: nodes[i], target: nodes[j], alpha: 0.06 });
        }
      }
    }
    return edges;
  }

  function assignClusters(nodes) {
    var catMap = {};
    var clusterIdx = 0;
    var clusters = [];
    for (var i = 0; i < nodes.length; i++) {
      var cat = nodes[i].category;
      if (catMap[cat] === undefined) {
        catMap[cat] = clusterIdx;
        var col = CATEGORY_COLORS[cat] || { r: 128, g: 128, b: 128 };
        clusters.push({
          id: clusterIdx,
          category: cat,
          color: col,
          coherence: (0.6 + Math.random() * 0.35).toFixed(2),
          cx: 0, cy: 0, count: 0
        });
        clusterIdx++;
      }
      nodes[i].cluster = catMap[cat];
      clusters[catMap[cat]].count++;
    }
    return clusters;
  }

  var FALLBACK_STATUS = {
    total_memories: 965,
    total_contributors: 59,
    total_votes: 947,
    graph_edges: 125429,
    cluster_count: 20
  };

  function fetchPiData() {
    var statusUrl = PI_API + '/status';
    var listUrl = PI_API + '/memories/list?limit=100';

    var statusP = fetch(statusUrl).then(function(r) { return r.json(); }).catch(function() { return null; });
    var listP = fetch(listUrl).then(function(r) { return r.json(); }).catch(function() { return null; });

    return Promise.all([statusP, listP]).then(function(results) {
      var status = results[0];
      var list = results[1];

      var nodes, edges, clusters;

      if (list && Array.isArray(list) && list.length > 0) {
        isLiveData = true;
        nodes = [];
        for (var i = 0; i < list.length; i++) {
          var m = list[i];
          var cat = (m.category || 'pattern').toLowerCase();
          if (!CATEGORY_COLORS[cat]) cat = 'pattern';
          var alpha = m.alpha || 1;
          var beta = m.beta || 1;
          var quality = alpha / (alpha + beta);
          var col = CATEGORY_COLORS[cat];
          nodes.push({
            id: m.id || ('n-' + i),
            title: m.title || ('Memory ' + i),
            category: cat,
            quality: quality,
            x: Math.random() * 600 + 100,
            y: Math.random() * 400 + 100,
            vx: 0, vy: 0,
            radius: 4 + quality * 10,
            color: col,
            phase: Math.random() * Math.PI * 2,
            cluster: -1,
            visible: true,
            scale: 1
          });
        }
      } else {
        isLiveData = false;
        nodes = buildFallbackNodes();
      }

      edges = buildEdgesFromNodes(nodes);
      clusters = assignClusters(nodes);

      graphData = {
        nodes: nodes,
        edges: edges,
        clusters: clusters,
        status: status || FALLBACK_STATUS
      };

      updateModeBadge();
      updateStatsFromData();
    });
  }

  function updateModeBadge() {
    var badge = document.getElementById('modeBadge');
    if (isLiveData) {
      badge.textContent = 'LIVE DATA';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      badge.style.color = '#10b981';
    } else {
      badge.textContent = 'DEMO MODE';
      badge.style.borderColor = 'var(--border)';
      badge.style.color = 'var(--text-dim)';
    }
  }

  function updateStatsFromData() {
    if (!graphData) return;
    var s = graphData.status;
    var countEls = document.querySelectorAll('#stage1 [data-count]');
    if (countEls[0] && s.total_memories) countEls[0].setAttribute('data-count', s.total_memories);
    if (countEls[1] && s.total_contributors) countEls[1].setAttribute('data-count', s.total_contributors);
    if (countEls[2] && s.graph_edges) countEls[2].setAttribute('data-count', s.graph_edges);
    if (countEls[3] && s.cluster_count) countEls[3].setAttribute('data-count', s.cluster_count);
  }

  // ========================================================================
  // Section 3: Force-Directed Layout
  // ========================================================================

  var SIM = {
    repulsion: -200,
    springLen: 60,
    springK: 0.015,
    damping: 0.90,
    gravity: 0.008,
    maxVel: 4
  };

  function simulationStep() {
    if (!graphData) return;
    var nodes = graphData.nodes;
    var edges = graphData.edges;
    var cx = GW / 2, cy = GH / 2;
    var visibleNodes = [];
    for (var v = 0; v < nodes.length; v++) {
      if (nodes[v].visible) visibleNodes.push(nodes[v]);
    }

    // Repulsion (all visible pairs)
    for (var i = 0; i < visibleNodes.length; i++) {
      for (var j = i + 1; j < visibleNodes.length; j++) {
        var dx = visibleNodes[j].x - visibleNodes[i].x;
        var dy = visibleNodes[j].y - visibleNodes[i].y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var force = SIM.repulsion / (dist * dist);
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        visibleNodes[i].vx -= fx;
        visibleNodes[i].vy -= fy;
        visibleNodes[j].vx += fx;
        visibleNodes[j].vy += fy;
      }
    }

    // Spring forces along edges
    for (var e = 0; e < edges.length; e++) {
      var src = edges[e].source;
      var tgt = edges[e].target;
      if (!src.visible || !tgt.visible) continue;
      var edx = tgt.x - src.x;
      var edy = tgt.y - src.y;
      var eDist = Math.sqrt(edx * edx + edy * edy) || 1;
      var eForce = (eDist - SIM.springLen) * SIM.springK;
      var efx = (edx / eDist) * eForce;
      var efy = (edy / eDist) * eForce;
      src.vx += efx;
      src.vy += efy;
      tgt.vx -= efx;
      tgt.vy -= efy;
    }

    // Center gravity + damping + position update
    for (var k = 0; k < visibleNodes.length; k++) {
      var n = visibleNodes[k];
      if (n.pinned) continue;
      n.vx += (cx - n.x) * SIM.gravity;
      n.vy += (cy - n.y) * SIM.gravity;
      n.vx *= SIM.damping;
      n.vy *= SIM.damping;
      n.vx = Math.max(-SIM.maxVel, Math.min(SIM.maxVel, n.vx));
      n.vy = Math.max(-SIM.maxVel, Math.min(SIM.maxVel, n.vy));
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(20, Math.min(GW - 20, n.x));
      n.y = Math.max(20, Math.min(GH - 20, n.y));
    }
  }

  // ========================================================================
  // Section 4: Graph Renderer
  // ========================================================================

  var graphCanvas = document.getElementById('graphCanvas');
  var gctx = graphCanvas.getContext('2d');
  var GW, GH;
  var camera = { x: 0, y: 0, zoom: 1 };
  var hoveredNode = null;
  var draggedNode = null;
  var isDragging = false;
  var graphAnimating = false;
  var stageTime = 0;
  var clusterRevealed = false;
  var growthIndex = 0;
  var growthSpeed = 50;
  var growthTimer = null;

  function resizeGraph() {
    GW = graphCanvas.width = window.innerWidth;
    GH = graphCanvas.height = window.innerHeight;
  }

  function worldToScreen(wx, wy) {
    return {
      x: (wx - camera.x) * camera.zoom + GW / 2,
      y: (wy - camera.y) * camera.zoom + GH / 2
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - GW / 2) / camera.zoom + camera.x,
      y: (sy - GH / 2) / camera.zoom + camera.y
    };
  }

  // --- Stage 0: Dead Grid ---
  function renderDeadGrid() {
    var cols = 12, rows = 8;
    var cellW = Math.min(60, (GW * 0.6) / cols);
    var cellH = Math.min(24, (GH * 0.5) / rows);
    var gap = 4;
    var totalW = cols * (cellW + gap);
    var totalH = rows * (cellH + gap);
    var startX = (GW - totalW) / 2;
    var startY = (GH - totalH) / 2;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var idx = r * cols + c;
        var delay = idx * 30;
        var elapsed = stageTime - delay;
        if (elapsed < 0) continue;

        var fadeIn = Math.min(1, elapsed / 400);
        var x = startX + c * (cellW + gap);
        var y = startY + r * (cellH + gap);

        gctx.fillStyle = 'rgba(42, 42, 58, ' + (fadeIn * 0.6) + ')';
        gctx.fillRect(x, y, cellW, cellH);
        gctx.strokeStyle = 'rgba(42, 42, 58, ' + (fadeIn * 0.3) + ')';
        gctx.strokeRect(x, y, cellW, cellH);
      }
    }

    // Scanning beam
    var beamCycle = 4000;
    var beamProgress = (stageTime % beamCycle) / beamCycle;
    var beamX = startX + beamProgress * totalW;

    gctx.save();
    var beamGrad = gctx.createLinearGradient(beamX - 30, 0, beamX + 30, 0);
    beamGrad.addColorStop(0, 'rgba(0, 212, 255, 0)');
    beamGrad.addColorStop(0.5, 'rgba(0, 212, 255, 0.25)');
    beamGrad.addColorStop(1, 'rgba(0, 212, 255, 0)');
    gctx.fillStyle = beamGrad;
    gctx.fillRect(beamX - 30, startY - 10, 60, totalH + 20);
    gctx.restore();
  }

  // --- Stage 1: Force Graph ---
  function renderForceGraph() {
    if (!graphData) return;
    simulationStep();

    var nodes = graphData.nodes;
    var edges = graphData.edges;
    var t = stageTime * 0.001;

    gctx.save();
    gctx.translate(GW / 2, GH / 2);
    gctx.scale(camera.zoom, camera.zoom);
    gctx.translate(-camera.x, -camera.y);

    // Center the graph
    var avgX = 0, avgY = 0, vis = 0;
    for (var a = 0; a < nodes.length; a++) {
      if (nodes[a].visible) { avgX += nodes[a].x; avgY += nodes[a].y; vis++; }
    }
    if (vis > 0 && !isDragging) {
      camera.x += ((avgX / vis) - camera.x) * 0.02;
      camera.y += ((avgY / vis) - camera.y) * 0.02;
    }

    // Edges
    for (var e = 0; e < edges.length; e++) {
      var src = edges[e].source;
      var tgt = edges[e].target;
      if (!src.visible || !tgt.visible) continue;
      gctx.beginPath();
      gctx.moveTo(src.x, src.y);
      gctx.lineTo(tgt.x, tgt.y);
      gctx.strokeStyle = 'rgba(255, 255, 255, ' + (edges[e].alpha || 0.08) + ')';
      gctx.lineWidth = 0.5;
      gctx.stroke();
    }

    // Nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.visible) continue;
      var breath = 1 + Math.sin(t * 2 + n.phase) * 0.08;
      var drawR = n.radius * breath * (n.scale || 1);
      var col = n.color;

      // Glow
      gctx.beginPath();
      gctx.arc(n.x, n.y, drawR * 2.5, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ', 0.06)';
      gctx.fill();

      // Body
      gctx.beginPath();
      gctx.arc(n.x, n.y, drawR, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ', 0.85)';
      gctx.fill();

      // Highlight hovered
      if (n === hoveredNode) {
        gctx.strokeStyle = 'rgba(255,255,255,0.6)';
        gctx.lineWidth = 2;
        gctx.stroke();
      }
    }

    gctx.restore();
  }

  // --- Stage 2: Clusters ---
  var clusterLerpProgress = 0;
  var clusterTargets = null;

  function computeClusterCenters() {
    if (!graphData) return;
    var clusters = graphData.clusters;
    var nodes = graphData.nodes;

    // Reset
    for (var c = 0; c < clusters.length; c++) {
      clusters[c].cx = 0;
      clusters[c].cy = 0;
      clusters[c].count = 0;
    }
    for (var i = 0; i < nodes.length; i++) {
      var cl = clusters[nodes[i].cluster];
      if (cl) {
        cl.cx += nodes[i].x;
        cl.cy += nodes[i].y;
        cl.count++;
      }
    }
    for (var j = 0; j < clusters.length; j++) {
      if (clusters[j].count > 0) {
        clusters[j].cx /= clusters[j].count;
        clusters[j].cy /= clusters[j].count;
      }
    }

    // Spread cluster centers for better visual separation
    var anglePer = (Math.PI * 2) / clusters.length;
    var spreadR = Math.min(GW, GH) * 0.25;
    var gcx = GW / 2, gcy = GH / 2;
    clusterTargets = {};
    for (var k = 0; k < clusters.length; k++) {
      var ang = anglePer * k - Math.PI / 2;
      clusterTargets[clusters[k].id] = {
        x: gcx + Math.cos(ang) * spreadR,
        y: gcy + Math.sin(ang) * spreadR
      };
    }
  }

  function renderClusters() {
    if (!graphData) return;
    var nodes = graphData.nodes;
    var edges = graphData.edges;
    var clusters = graphData.clusters;

    // If revealed, lerp nodes toward cluster targets
    if (clusterRevealed && clusterTargets) {
      clusterLerpProgress = Math.min(1, clusterLerpProgress + 0.015);
      var t = clusterLerpProgress;
      var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var ct = clusterTargets[n.cluster];
        if (ct && n.origX !== undefined) {
          // Offset from cluster center with some scatter
          var offsetX = (n.origX - n.origCX) * 0.6;
          var offsetY = (n.origY - n.origCY) * 0.6;
          n.x = n.origX + (ct.x + offsetX - n.origX) * eased;
          n.y = n.origY + (ct.y + offsetY - n.origY) * eased;
        }
      }
    }

    // Run sim gently even in cluster mode for breathing
    if (!clusterRevealed) simulationStep();

    var time = stageTime * 0.001;

    gctx.save();
    gctx.translate(GW / 2, GH / 2);
    gctx.scale(camera.zoom, camera.zoom);
    gctx.translate(-camera.x, -camera.y);

    // Draw convex hulls if revealed
    if (clusterRevealed && clusterLerpProgress > 0.3) {
      for (var c = 0; c < clusters.length; c++) {
        var cl = clusters[c];
        var clNodes = [];
        for (var ni = 0; ni < nodes.length; ni++) {
          if (nodes[ni].cluster === cl.id) clNodes.push(nodes[ni]);
        }
        if (clNodes.length < 3) continue;
        var hull = convexHull(clNodes);
        if (hull.length < 3) continue;

        var hcol = cl.color;
        gctx.beginPath();
        gctx.moveTo(hull[0].x, hull[0].y);
        for (var h = 1; h < hull.length; h++) {
          gctx.lineTo(hull[h].x, hull[h].y);
        }
        gctx.closePath();
        gctx.strokeStyle = 'rgba(' + hcol.r + ',' + hcol.g + ',' + hcol.b + ', 0.3)';
        gctx.setLineDash([6, 4]);
        gctx.lineWidth = 1.5;
        gctx.stroke();
        gctx.setLineDash([]);

        // Coherence label at center
        var ct2 = clusterTargets ? clusterTargets[cl.id] : null;
        if (ct2) {
          gctx.font = '10px "JetBrains Mono", monospace';
          gctx.fillStyle = 'rgba(' + hcol.r + ',' + hcol.g + ',' + hcol.b + ', 0.7)';
          gctx.textAlign = 'center';
          gctx.fillText(cl.category + ' (' + cl.coherence + ')', ct2.x, ct2.y - clNodes[0].radius * 2 - 10);
        }
      }
    }

    // Edges
    for (var e = 0; e < edges.length; e++) {
      var src = edges[e].source;
      var tgt = edges[e].target;
      if (!src.visible || !tgt.visible) continue;
      var sameCluster = src.cluster === tgt.cluster;
      var ea = sameCluster ? 0.15 : 0.04;
      gctx.beginPath();
      gctx.moveTo(src.x, src.y);
      gctx.lineTo(tgt.x, tgt.y);
      gctx.strokeStyle = 'rgba(255,255,255,' + ea + ')';
      gctx.lineWidth = 0.5;
      gctx.stroke();
    }

    // Nodes
    for (var nn = 0; nn < nodes.length; nn++) {
      var nd = nodes[nn];
      if (!nd.visible) continue;
      var breath2 = 1 + Math.sin(time * 2 + nd.phase) * 0.08;
      var dr = nd.radius * breath2;
      var nc = nd.color;

      gctx.beginPath();
      gctx.arc(nd.x, nd.y, dr * 2.5, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(' + nc.r + ',' + nc.g + ',' + nc.b + ', 0.06)';
      gctx.fill();

      gctx.beginPath();
      gctx.arc(nd.x, nd.y, dr, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(' + nc.r + ',' + nc.g + ',' + nc.b + ', 0.85)';
      gctx.fill();

      if (nd === hoveredNode) {
        gctx.strokeStyle = 'rgba(255,255,255,0.6)';
        gctx.lineWidth = 2;
        gctx.stroke();
      }
    }

    gctx.restore();
  }

  function convexHull(points) {
    if (points.length < 3) return points.slice();
    var sorted = points.slice().sort(function(a, b) { return a.x - b.x || a.y - b.y; });
    var lower = [];
    for (var i = 0; i < sorted.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
        lower.pop();
      }
      lower.push(sorted[i]);
    }
    var upper = [];
    for (var j = sorted.length - 1; j >= 0; j--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[j]) <= 0) {
        upper.pop();
      }
      upper.push(sorted[j]);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  function populateClusterLegend() {
    if (!graphData) return;
    var legend = document.getElementById('clusterLegend');
    // Clear existing children safely
    while (legend.firstChild) {
      legend.removeChild(legend.firstChild);
    }
    var clusters = graphData.clusters;
    for (var i = 0; i < clusters.length; i++) {
      var cl = clusters[i];
      var badge = document.createElement('div');
      badge.className = 'cluster-badge';
      var dot = document.createElement('span');
      dot.className = 'cluster-dot';
      dot.style.background = 'rgb(' + cl.color.r + ',' + cl.color.g + ',' + cl.color.b + ')';
      dot.style.boxShadow = '0 0 6px rgba(' + cl.color.r + ',' + cl.color.g + ',' + cl.color.b + ',0.5)';
      var label = document.createElement('span');
      label.textContent = cl.category + ' (' + cl.count + ')';
      badge.appendChild(dot);
      badge.appendChild(label);
      legend.appendChild(badge);
    }
  }

  // --- Stage 3: Drift ---
  function renderDrift() {
    if (!graphData) return;
    var nodes = graphData.nodes;
    var edges = graphData.edges;
    var slider = document.getElementById('timelineSlider');
    var driftVal = parseInt(slider.value, 10) / 100; // 0 = fresh, 1 = stale

    // Update drift stats display
    var cv = (driftVal * 0.45 + 0.05).toFixed(2);
    var trend = driftVal < 0.3 ? 'stable' : (driftVal < 0.7 ? 'warming' : 'critical');
    document.getElementById('driftCV').textContent = cv;
    document.getElementById('driftTrend').textContent = trend;

    // Gentle sim
    simulationStep();

    var time = stageTime * 0.001;

    gctx.save();
    gctx.translate(GW / 2, GH / 2);
    gctx.scale(camera.zoom, camera.zoom);
    gctx.translate(-camera.x, -camera.y);

    // Edges
    for (var e = 0; e < edges.length; e++) {
      var src = edges[e].source;
      var tgt = edges[e].target;
      if (!src.visible || !tgt.visible) continue;
      gctx.beginPath();
      gctx.moveTo(src.x, src.y);
      gctx.lineTo(tgt.x, tgt.y);
      gctx.strokeStyle = 'rgba(255,255,255,0.06)';
      gctx.lineWidth = 0.5;
      gctx.stroke();
    }

    // Nodes with drift color
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.visible) continue;
      var breath = 1 + Math.sin(time * 2 + n.phase) * 0.08;
      var dr = n.radius * breath;

      // Each node ages at a different rate based on its quality and index
      var nodeAge = driftVal * (0.5 + (n.quality || 0.5) * 0.5 + ((i % 7) / 7) * 0.3);
      nodeAge = Math.min(1, nodeAge);

      // HSL interpolation: 180 (cyan) -> 40 (amber) -> 0 (red)
      var hue = 180 - nodeAge * 180;
      var sat = 80 + nodeAge * 15;
      var lum = 55 - nodeAge * 10;

      // Glow
      gctx.beginPath();
      gctx.arc(n.x, n.y, dr * 2.5, 0, Math.PI * 2);
      gctx.fillStyle = 'hsla(' + hue + ',' + sat + '%,' + lum + '%, 0.08)';
      gctx.fill();

      // Body
      gctx.beginPath();
      gctx.arc(n.x, n.y, dr, 0, Math.PI * 2);
      gctx.fillStyle = 'hsla(' + hue + ',' + sat + '%,' + lum + '%, 0.85)';
      gctx.fill();

      if (n === hoveredNode) {
        gctx.strokeStyle = 'rgba(255,255,255,0.6)';
        gctx.lineWidth = 2;
        gctx.stroke();
      }
    }

    gctx.restore();
  }

  // --- Stage 4: Growth ---
  var growthSparkles = [];

  function renderGrowth() {
    if (!graphData) return;
    var nodes = graphData.nodes;
    var edges = graphData.edges;
    var time = stageTime * 0.001;

    // Only show nodes up to growthIndex
    for (var v = 0; v < nodes.length; v++) {
      nodes[v].visible = v < growthIndex;
      // Scale animation for recently revealed nodes
      if (v === growthIndex - 1 && nodes[v].scale < 1) {
        nodes[v].scale = Math.min(1, (nodes[v].scale || 0) + 0.05);
      }
      if (v >= growthIndex) {
        nodes[v].scale = 0;
      }
    }

    simulationStep();

    gctx.save();
    gctx.translate(GW / 2, GH / 2);
    gctx.scale(camera.zoom, camera.zoom);
    gctx.translate(-camera.x, -camera.y);

    // Edges (only between visible nodes)
    for (var e = 0; e < edges.length; e++) {
      var src = edges[e].source;
      var tgt = edges[e].target;
      if (!src.visible || !tgt.visible) continue;
      gctx.beginPath();
      gctx.moveTo(src.x, src.y);
      gctx.lineTo(tgt.x, tgt.y);
      gctx.strokeStyle = 'rgba(255,255,255,0.1)';
      gctx.lineWidth = 0.5;
      gctx.stroke();
    }

    // Nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.visible) continue;
      var sc = n.scale || 1;
      // Ease-out-back for pop-in
      if (sc < 1) {
        var t2 = sc;
        sc = 1 + 2.7 * Math.pow(t2 - 1, 3) + 1.7 * Math.pow(t2 - 1, 2);
        sc = Math.max(0, Math.min(1.2, sc));
      }
      var breath = 1 + Math.sin(time * 2 + n.phase) * 0.08;
      var dr = n.radius * breath * sc;
      var col = n.color;

      gctx.beginPath();
      gctx.arc(n.x, n.y, dr * 2.5, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ', 0.06)';
      gctx.fill();

      gctx.beginPath();
      gctx.arc(n.x, n.y, dr, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ', 0.85)';
      gctx.fill();
    }

    // Vote sparkles
    for (var s = growthSparkles.length - 1; s >= 0; s--) {
      var sp = growthSparkles[s];
      sp.life -= 0.02;
      if (sp.life <= 0) {
        growthSparkles.splice(s, 1);
        continue;
      }
      var sparkR = (1 - sp.life) * 12;
      gctx.beginPath();
      gctx.arc(sp.x, sp.y, sparkR, 0, Math.PI * 2);
      gctx.strokeStyle = 'rgba(240, 192, 32, ' + (sp.life * 0.6) + ')';
      gctx.lineWidth = 1.5;
      gctx.stroke();
    }

    gctx.restore();

    // Update counters
    var visCount = growthIndex;
    var status = graphData.status;
    var ratio = Math.min(1, visCount / graphData.nodes.length);
    document.getElementById('growthMemories').textContent = Math.floor(ratio * (status.total_memories || 965));
    document.getElementById('growthContributors').textContent = Math.floor(ratio * (status.total_contributors || 59));
    document.getElementById('growthVotes').textContent = Math.floor(ratio * (status.total_votes || 947));
    document.getElementById('growthClusters').textContent = Math.floor(ratio * (status.cluster_count || 20));
  }

  function startGrowth() {
    growthIndex = 5;
    growthSpeed = 50;

    // Reset visibility
    if (graphData) {
      for (var i = 0; i < graphData.nodes.length; i++) {
        graphData.nodes[i].visible = i < growthIndex;
        graphData.nodes[i].scale = i < growthIndex ? 1 : 0;
      }
    }

    clearInterval(growthTimer);
    growthTimer = setInterval(function() {
      if (!graphData) return;
      if (growthIndex < graphData.nodes.length) {
        graphData.nodes[growthIndex].scale = 0.01;
        growthIndex++;

        // Random vote sparkle
        if (Math.random() < 0.3 && growthIndex > 2) {
          var sparkNode = graphData.nodes[Math.floor(Math.random() * growthIndex)];
          growthSparkles.push({
            x: sparkNode.x,
            y: sparkNode.y,
            life: 1
          });
        }
      } else {
        clearInterval(growthTimer);
      }
    }, growthSpeed);
  }

  function stopGrowth() {
    clearInterval(growthTimer);
  }

  // --- Main Render Loop ---
  function renderGraph() {
    gctx.clearRect(0, 0, GW, GH);

    switch (currentStage) {
      case 0:
        renderDeadGrid();
        break;
      case 1:
        renderForceGraph();
        break;
      case 2:
        renderClusters();
        break;
      case 3:
        renderDrift();
        break;
      case 4:
        renderGrowth();
        break;
    }

    // Tooltip
    if (hoveredNode && currentStage >= 1) {
      renderTooltip(hoveredNode);
    }

    stageTime += 16;
    if (graphAnimating) requestAnimationFrame(renderGraph);
  }

  function renderTooltip(node) {
    var screenPos = worldToScreen(node.x, node.y);
    var tx = screenPos.x + 16;
    var ty = screenPos.y - 20;

    // Keep on screen
    if (tx + 180 > GW) tx = screenPos.x - 196;
    if (ty < 10) ty = 10;

    var padding = 10;
    var w = 180;
    var h = 56;

    // Glass morphism background
    gctx.save();
    gctx.fillStyle = 'rgba(18, 18, 26, 0.85)';
    gctx.strokeStyle = 'rgba(42, 42, 58, 0.6)';
    gctx.lineWidth = 1;
    roundRect(gctx, tx, ty, w, h, 8);
    gctx.fill();
    gctx.stroke();

    gctx.font = '600 11px "JetBrains Mono", monospace';
    gctx.fillStyle = '#e8eaed';
    gctx.textAlign = 'left';
    var titleText = node.title.length > 22 ? node.title.substring(0, 20) + '..' : node.title;
    gctx.fillText(titleText, tx + padding, ty + 20);

    gctx.font = '10px "JetBrains Mono", monospace';
    gctx.fillStyle = '#8892a4';
    gctx.fillText(node.category, tx + padding, ty + 35);

    var qualPct = Math.round(node.quality * 100) + '%';
    gctx.fillStyle = '#00d4ff';
    gctx.textAlign = 'right';
    gctx.fillText(qualPct, tx + w - padding, ty + 35);

    gctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ========================================================================
  // Section 5: Interactions
  // ========================================================================

  var mouseX = 0, mouseY = 0;
  var lastMouseX = 0, lastMouseY = 0;
  var isPanning = false;
  var pinchDist = 0;

  function findNodeAt(sx, sy) {
    if (!graphData || currentStage < 1) return null;
    var world = screenToWorld(sx, sy);
    var nodes = graphData.nodes;
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (!nodes[i].visible) continue;
      var dx = world.x - nodes[i].x;
      var dy = world.y - nodes[i].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nodes[i].radius + 4) return nodes[i];
    }
    return null;
  }

  graphCanvas.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (draggedNode) {
      var w = screenToWorld(mouseX, mouseY);
      draggedNode.x = w.x;
      draggedNode.y = w.y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
      return;
    }

    if (isPanning) {
      var dx = (mouseX - lastMouseX) / camera.zoom;
      var dy = (mouseY - lastMouseY) / camera.zoom;
      camera.x -= dx;
      camera.y -= dy;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      return;
    }

    hoveredNode = findNodeAt(mouseX, mouseY);
    graphCanvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  });

  graphCanvas.addEventListener('mousedown', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    var node = findNodeAt(mouseX, mouseY);
    if (node) {
      draggedNode = node;
      draggedNode.pinned = true;
      isDragging = true;
    } else {
      isPanning = true;
    }
  });

  graphCanvas.addEventListener('mouseup', function() {
    if (draggedNode) {
      draggedNode.pinned = false;
      draggedNode = null;
      isDragging = false;
    }
    isPanning = false;
  });

  graphCanvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    var factor = e.deltaY > 0 ? 0.92 : 1.08;
    camera.zoom = Math.max(0.3, Math.min(3, camera.zoom * factor));
  }, { passive: false });

  // Touch support
  graphCanvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      var t = e.touches[0];
      mouseX = t.clientX;
      mouseY = t.clientY;
      lastMouseX = mouseX;
      lastMouseY = mouseY;

      var node = findNodeAt(mouseX, mouseY);
      if (node) {
        draggedNode = node;
        draggedNode.pinned = true;
        isDragging = true;
      } else {
        isPanning = true;
      }
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });

  graphCanvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      var t = e.touches[0];
      mouseX = t.clientX;
      mouseY = t.clientY;

      if (draggedNode) {
        var w = screenToWorld(mouseX, mouseY);
        draggedNode.x = w.x;
        draggedNode.y = w.y;
        draggedNode.vx = 0;
        draggedNode.vy = 0;
      } else if (isPanning) {
        var ddx = (mouseX - lastMouseX) / camera.zoom;
        var ddy = (mouseY - lastMouseY) / camera.zoom;
        camera.x -= ddx;
        camera.y -= ddy;
      }
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    } else if (e.touches.length === 2) {
      var dx2 = e.touches[0].clientX - e.touches[1].clientX;
      var dy2 = e.touches[0].clientY - e.touches[1].clientY;
      var newDist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (pinchDist > 0) {
        var factor = newDist / pinchDist;
        camera.zoom = Math.max(0.3, Math.min(3, camera.zoom * factor));
      }
      pinchDist = newDist;
    }
  }, { passive: false });

  graphCanvas.addEventListener('touchend', function() {
    if (draggedNode) {
      draggedNode.pinned = false;
      draggedNode = null;
      isDragging = false;
    }
    isPanning = false;
    pinchDist = 0;
  }, { passive: true });

  // ========================================================================
  // Section 6: Stage Management + Controls
  // ========================================================================

  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');
  var TOTAL_STAGES = 5;

  function goToStage(n) {
    if (n < 0 || n >= TOTAL_STAGES) return;

    // Cleanup previous stage
    if (currentStage === 4) stopGrowth();

    currentStage = n;
    stageTime = 0;

    for (var i = 0; i < stages.length; i++) {
      if (i === n) stages[i].classList.add('visible');
      else stages[i].classList.remove('visible');
    }
    for (var j = 0; j < dots.length; j++) {
      dots[j].classList.toggle('active', j === n);
      dots[j].classList.toggle('completed', j < n);
      dots[j].setAttribute('aria-selected', j === n ? 'true' : 'false');
      dots[j].setAttribute('tabindex', j === n ? '0' : '-1');
    }

    prevBtn.disabled = n === 0;
    nextBtn.textContent = n === TOTAL_STAGES - 1 ? 'Restart' : 'Next \u2192';
    counter.textContent = (n + 1) + ' / ' + TOTAL_STAGES;

    setParticleTargets(n);

    // Reset graph state
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1;
    clusterRevealed = false;
    clusterLerpProgress = 0;
    hoveredNode = null;

    // Re-initialize node positions for stages that need it
    if (graphData && n >= 1) {
      for (var k = 0; k < graphData.nodes.length; k++) {
        graphData.nodes[k].visible = true;
        graphData.nodes[k].scale = 1;
      }
    }

    // Start graph animation
    if (!graphAnimating) {
      graphAnimating = true;
      renderGraph();
    }

    triggerStageEffects(n);
  }

  function triggerStageEffects(n) {
    if (n === 1) {
      // Animate stat counts
      var countEls = document.querySelectorAll('#stage1 [data-count]');
      for (var i = 0; i < countEls.length; i++) {
        animateCount(countEls[i], parseInt(countEls[i].getAttribute('data-count'), 10));
      }
      // Scatter node positions
      if (graphData) {
        for (var ni = 0; ni < graphData.nodes.length; ni++) {
          graphData.nodes[ni].x = Math.random() * GW * 0.6 + GW * 0.2;
          graphData.nodes[ni].y = Math.random() * GH * 0.6 + GH * 0.2;
        }
      }
    }

    if (n === 2) {
      populateClusterLegend();
    }

    if (n === 3) {
      document.getElementById('timelineSlider').value = 0;
    }

    if (n === 4) {
      startGrowth();
    }
  }

  function animateCount(el, target) {
    var duration = 1500;
    var start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  // --- Controls ---
  prevBtn.addEventListener('click', function() { goToStage(currentStage - 1); });
  nextBtn.addEventListener('click', function() {
    if (currentStage === TOTAL_STAGES - 1) goToStage(0);
    else goToStage(currentStage + 1);
  });

  for (var d = 0; d < dots.length; d++) {
    (function(dot) {
      dot.addEventListener('click', function() { goToStage(parseInt(dot.dataset.stage, 10)); });
    })(dots[d]);
  }

  autoBtn.addEventListener('click', function() {
    autoPlay = !autoPlay;
    autoBtn.textContent = autoPlay ? '\u23F8 Pause' : '\u25B6 Auto';
    if (autoPlay) {
      autoTimer = setInterval(function() {
        if (currentStage < TOTAL_STAGES - 1) goToStage(currentStage + 1);
        else { autoPlay = false; autoBtn.textContent = '\u25B6 Auto'; clearInterval(autoTimer); }
      }, 8000);
    } else {
      clearInterval(autoTimer);
    }
  });

  // Reveal button for clusters
  document.getElementById('revealBtn').addEventListener('click', function() {
    if (!graphData || clusterRevealed) return;
    clusterRevealed = true;
    clusterLerpProgress = 0;

    computeClusterCenters();

    // Store original positions for lerp
    var nodes = graphData.nodes;
    var clusters = graphData.clusters;
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].origX = nodes[i].x;
      nodes[i].origY = nodes[i].y;
      var cl = clusters[nodes[i].cluster];
      nodes[i].origCX = cl ? cl.cx : nodes[i].x;
      nodes[i].origCY = cl ? cl.cy : nodes[i].y;
    }
  });

  // Speed button for growth
  document.getElementById('speedBtn').addEventListener('click', function() {
    if (growthSpeed > 10) {
      growthSpeed = Math.max(10, growthSpeed - 15);
      stopGrowth();
      startGrowth();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goToStage(Math.min(currentStage + 1, TOTAL_STAGES - 1));
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToStage(Math.max(currentStage - 1, 0));
    }
  });

  // ========================================================================
  // Section 7: Init
  // ========================================================================

  function init() {
    resizeParticles();
    resizeGraph();

    window.addEventListener('resize', function() {
      resizeParticles();
      resizeGraph();
      setParticleTargets(currentStage);
    });

    initParticles();
    setParticleTargets(0);
    drawParticles();

    // Start graph animation
    graphAnimating = true;
    renderGraph();

    // Fetch data then refresh
    fetchPiData().then(function() {
      // Re-init stage if already on stage 1+
      if (currentStage >= 1) {
        triggerStageEffects(currentStage);
      }
    });
  }

  init();

})();
