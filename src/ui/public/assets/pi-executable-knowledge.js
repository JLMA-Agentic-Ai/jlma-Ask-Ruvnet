(function() {
  'use strict';

  // --- 1. PARTICLE SYSTEM ---
  var canvas = document.getElementById('particleCanvas');
  var ctx = canvas.getContext('2d');
  var W, H;
  var PARTICLE_COUNT = 1800;
  var currentStage = 0;
  var particles = [];
  var animating = true;
  var autoPlay = false;
  var autoTimer = null;
  var TOTAL_STAGES = 6;
  // Active canvas animation frame IDs (so we can cancel them per-stage)
  var hnswAnimFrame = 0;
  var embedAnimFrame = 0;
  var mincutAnimFrame = 0;
  var CATEGORIES = [
    { color: [240, 192, 32], weight: 0.15 },
    { color: [59, 130, 246], weight: 0.45 },
    { color: [168, 85, 247], weight: 0.25 },
    { color: [0, 212, 255], weight: 0.1 },
    { color: [16, 185, 129], weight: 0.05 }
  ];
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
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
      x: Math.random() * W,
      y: Math.random() * H,
      tx: Math.random() * W,
      ty: Math.random() * H,
      r: Math.random() * 2 + 0.5,
      color: color,
      alpha: Math.random() * 0.6 + 0.2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.005 + 0.002
    };
  }
  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }
  function setStageTargets(stage) {
    var cx = W / 2, cy = H / 2;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var angle, dist, maxR, d, hubIdx, hubX, hubY, spread, ratio;
      switch (stage) {
        case 0: // Random scatter (unstructured text)
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
          break;
        case 1: // Cluster around 4 hub points (graph network)
          hubIdx = i % 4;
          angle = (hubIdx / 4) * Math.PI * 2;
          hubX = cx + Math.cos(angle) * Math.min(W, H) * 0.18;
          hubY = cy + Math.sin(angle) * Math.min(W, H) * 0.18;
          spread = Math.min(W, H) * 0.09;
          p.tx = hubX + (Math.random() - 0.5) * spread;
          p.ty = hubY + (Math.random() - 0.5) * spread;
          break;
        case 2: // Circular scatter cloud (embedding space)
          angle = (i / particles.length) * Math.PI * 2;
          maxR = Math.min(W, H) * 0.28;
          d = Math.sqrt(Math.random()) * maxR;
          p.tx = cx + Math.cos(angle + i * 0.01) * d;
          p.ty = cy + Math.sin(angle + i * 0.01) * d;
          break;
        case 3: // Two separated clusters with thin bridge (min-cut)
          ratio = i / particles.length;
          if (ratio < 0.42) {
            p.tx = cx - Math.min(W, H) * 0.18 + (Math.random() - 0.5) * Math.min(W, H) * 0.14;
            p.ty = cy + (Math.random() - 0.5) * Math.min(W, H) * 0.16;
          } else if (ratio < 0.84) {
            p.tx = cx + Math.min(W, H) * 0.18 + (Math.random() - 0.5) * Math.min(W, H) * 0.14;
            p.ty = cy + (Math.random() - 0.5) * Math.min(W, H) * 0.16;
          } else {
            p.tx = cx + (Math.random() - 0.5) * Math.min(W, H) * 0.12;
            p.ty = cy + (Math.random() - 0.5) * Math.min(W, H) * 0.03;
          }
          break;
        case 4: // Left half chaotic, right half organized spiral (comparison)
          if (i < particles.length / 2) {
            p.tx = Math.random() * W * 0.45;
            p.ty = Math.random() * H;
          } else {
            angle = ((i - particles.length / 2) / (particles.length / 2)) * Math.PI * 6;
            dist = 30 + ((i - particles.length / 2) / (particles.length / 2)) * Math.min(W, H) * 0.18;
            p.tx = W * 0.72 + Math.cos(angle) * dist;
            p.ty = cy + Math.sin(angle) * dist;
          }
          break;
        case 5: // Converge to center then expand (participation)
          angle = Math.random() * Math.PI * 2;
          dist = 10 + Math.random() * 30;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;
      }
    }
  }
  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    if (currentStage >= 1 && currentStage <= 3) {
      var cx = W / 2, cy = H / 2;
      var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.4);
      grd.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
      grd.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var ease = 0.015 + (currentStage === 0 ? 0 : 0.008);
      p.x += (p.tx - p.x) * ease + p.vx + Math.sin(p.phase) * 0.15;
      p.y += (p.ty - p.y) * ease + p.vy + Math.cos(p.phase) * 0.15;
      p.phase += p.speed;
      if (currentStage === 0 || currentStage === 4) {
        if (p.x < -10 || p.x > W + 10) p.tx = Math.random() * W;
        if (p.y < -10 || p.y > H + 10) p.ty = Math.random() * H;
      }
      var rgb = p.color;
      var glowSize = p.r * (currentStage >= 2 ? 3 : 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + (p.alpha * 0.15) + ')';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + p.alpha + ')';
      ctx.fill();
    }
    if (animating) requestAnimationFrame(drawParticles);
  }

  // --- 2. STAGE MANAGEMENT ---
  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');
  function stopStageCanvases() {
    if (hnswAnimFrame) { cancelAnimationFrame(hnswAnimFrame); hnswAnimFrame = 0; }
    if (embedAnimFrame) { cancelAnimationFrame(embedAnimFrame); embedAnimFrame = 0; }
    if (mincutAnimFrame) { cancelAnimationFrame(mincutAnimFrame); mincutAnimFrame = 0; }
  }
  function goToStage(n) {
    if (n < 0 || n >= TOTAL_STAGES) return;
    stopStageCanvases();
    currentStage = n;
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
    nextBtn.textContent = n === (TOTAL_STAGES - 1) ? 'Restart' : 'Next \u2192';
    counter.textContent = (n + 1) + ' / ' + TOTAL_STAGES;
    setStageTargets(n);
    triggerStageEffects(n);
  }
  function triggerStageEffects(n) {
    if (n === 0) startOldWayDemo();
    if (n === 1) initHnswDemo();
    if (n === 2) initEmbeddingExplorer();
    if (n === 3) initMinCutDemo();
    if (n === 4) animateComparison();
    if (n === 5) initPiBrainLive();
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

  // --- 3. STAGE 0 - "THE OLD WAY" ---
  var oldWayTimer = null;
  var oldWayStreamTimer = null;
  function startOldWayDemo() {
    var userMsg = document.getElementById('userMsg');
    var aiMsg = document.getElementById('aiMsg');
    var meterFill = document.getElementById('meterFill');
    var meterValue = document.getElementById('meterValue');
    // Reset
    userMsg.textContent = '';
    aiMsg.textContent = '';
    aiMsg.classList.remove('faded');
    meterFill.style.transition = 'none';
    meterFill.style.width = '100%';
    meterValue.textContent = '100%';
    meterValue.classList.remove('low');
    var question = 'How does HNSW work?';
    var academicText = 'HNSW (Hierarchical Navigable Small World) is a graph-based approximate nearest neighbor search algorithm that constructs a multi-layer graph structure where each layer forms a navigable small-world network. The construction algorithm iteratively inserts elements by finding the closest neighbors through a greedy search procedure, starting from the top layer and progressing downward. At each layer l, the algorithm maintains a dynamic list of M closest neighbors, where M is a construction parameter that controls the graph connectivity. The search procedure employs a priority queue-based beam search with width efConstruction during construction and efSearch during query time, achieving logarithmic time complexity O(log n) with tunable recall-precision tradeoffs determined by...';
    // Typewriter for question
    var charIdx = 0;
    clearInterval(oldWayTimer);
    clearInterval(oldWayStreamTimer);
    oldWayTimer = setInterval(function() {
      if (charIdx < question.length) {
        userMsg.textContent += question[charIdx];
        charIdx++;
      } else {
        clearInterval(oldWayTimer);
        // Pause then stream AI response
        setTimeout(function() {
          var aiIdx = 0;
          var meterStart = performance.now();
          var METER_DURATION = 6000;
          oldWayStreamTimer = setInterval(function() {
            if (aiIdx < academicText.length) {
              aiMsg.textContent += academicText[aiIdx];
              aiIdx++;
              // Synchronize engagement meter drain
              var elapsed = performance.now() - meterStart;
              var progress = Math.min(elapsed / METER_DURATION, 1);
              var meterPct = Math.max(12, Math.floor(100 - progress * 88));
              meterFill.style.transition = 'none';
              meterFill.style.width = meterPct + '%';
              meterValue.textContent = meterPct + '%';
              if (meterPct < 40) {
                meterValue.classList.add('low');
              }
            } else {
              clearInterval(oldWayStreamTimer);
              aiMsg.classList.add('faded');
            }
          }, 15);
        }, 600);
      }
    }, 50);
  }

  // --- 4. STAGE 1 - HNSW VISUALIZER ---
  var hnswNodes = [];
  var hnswEdges = [];
  var hnswCanvas, hnswCtx, hnswW, hnswH;
  var hnswSearchTrail = [];
  var hnswInsertAnim = null;
  var hnswSearchAnim = null;
  var hnswInitialized = false;
  function initHnswDemo() {
    hnswCanvas = document.getElementById('hnswCanvas');
    var wrap = hnswCanvas.parentElement;
    hnswW = wrap.clientWidth;
    hnswH = wrap.clientHeight;
    hnswCanvas.width = hnswW;
    hnswCanvas.height = hnswH;
    hnswCtx = hnswCanvas.getContext('2d');
    if (!hnswInitialized) {
      hnswNodes = [];
      hnswEdges = [];
      hnswSearchTrail = [];
      // Seed 5 initial nodes
      var margin = 60;
      for (var i = 0; i < 5; i++) {
        hnswNodes.push({
          id: i,
          x: margin + Math.random() * (hnswW - margin * 2),
          y: margin + Math.random() * (hnswH - margin * 2),
          vx: 0, vy: 0,
          layer: 0,
          connections: [],
          glow: 0,
          color: null
        });
      }
      // Connect each node to nearest 2 neighbors
      for (var n = 0; n < hnswNodes.length; n++) {
        var dists = [];
        for (var m = 0; m < hnswNodes.length; m++) {
          if (m === n) continue;
          var dx = hnswNodes[n].x - hnswNodes[m].x;
          var dy = hnswNodes[n].y - hnswNodes[m].y;
          dists.push({ idx: m, d: Math.sqrt(dx * dx + dy * dy) });
        }
        dists.sort(function(a, b) { return a.d - b.d; });
        for (var k = 0; k < Math.min(2, dists.length); k++) {
          addHnswEdge(n, dists[k].idx);
        }
      }
      updateHnswLabel();
      // Wire buttons
      document.getElementById('insertBtn').onclick = insertHnswNode;
      document.getElementById('searchBtn').onclick = searchHnswNode;
      hnswInitialized = true;
    }
    drawHnswGraph();
  }
  function addHnswEdge(a, b) {
    // Prevent duplicates
    for (var i = 0; i < hnswEdges.length; i++) {
      if ((hnswEdges[i][0] === a && hnswEdges[i][1] === b) ||
          (hnswEdges[i][0] === b && hnswEdges[i][1] === a)) return;
    }
    hnswEdges.push([a, b]);
    if (hnswNodes[a].connections.indexOf(b) === -1) hnswNodes[a].connections.push(b);
    if (hnswNodes[b].connections.indexOf(a) === -1) hnswNodes[b].connections.push(a);
  }
  function updateHnswLabel() {
    var maxLayer = 0;
    for (var i = 0; i < hnswNodes.length; i++) {
      if (hnswNodes[i].layer > maxLayer) maxLayer = hnswNodes[i].layer;
    }
    var label = document.getElementById('hnswLabel');
    label.textContent = 'Layer ' + maxLayer + ' \u2014 ' + hnswNodes.length + ' nodes';
  }
  function insertHnswNode() {
    if (hnswInsertAnim) return;
    var margin = 20;
    // Start from edge
    var side = Math.floor(Math.random() * 4);
    var sx, sy;
    if (side === 0) { sx = margin; sy = margin + Math.random() * (hnswH - margin * 2); }
    else if (side === 1) { sx = hnswW - margin; sy = margin + Math.random() * (hnswH - margin * 2); }
    else if (side === 2) { sx = margin + Math.random() * (hnswW - margin * 2); sy = margin; }
    else { sx = margin + Math.random() * (hnswW - margin * 2); sy = hnswH - margin; }
    // Target position
    var tx = margin + Math.random() * (hnswW - margin * 2);
    var ty = margin + Math.random() * (hnswH - margin * 2);
    var layer = Math.min(2, Math.floor(-Math.log(Math.random()) / Math.log(3)));
    var newId = hnswNodes.length;
    var node = {
      id: newId,
      x: sx, y: sy,
      vx: 0, vy: 0,
      layer: layer,
      connections: [],
      glow: 1,
      color: null
    };
    hnswNodes.push(node);
    // Animate lerp to target
    hnswInsertAnim = { node: node, sx: sx, sy: sy, tx: tx, ty: ty, frame: 0, totalFrames: 30 };
    function animateInsert() {
      if (!hnswInsertAnim) return;
      hnswInsertAnim.frame++;
      var t = hnswInsertAnim.frame / hnswInsertAnim.totalFrames;
      t = t * t * (3 - 2 * t); // smoothstep
      node.x = hnswInsertAnim.sx + (hnswInsertAnim.tx - hnswInsertAnim.sx) * t;
      node.y = hnswInsertAnim.sy + (hnswInsertAnim.ty - hnswInsertAnim.sy) * t;
      if (hnswInsertAnim.frame >= hnswInsertAnim.totalFrames) {
        node.x = hnswInsertAnim.tx;
        node.y = hnswInsertAnim.ty;
        // Find 3 nearest, add edges with traversal trail
        var dists = [];
        for (var m = 0; m < hnswNodes.length; m++) {
          if (m === newId) continue;
          var dx = node.x - hnswNodes[m].x;
          var dy = node.y - hnswNodes[m].y;
          dists.push({ idx: m, d: Math.sqrt(dx * dx + dy * dy) });
        }
        dists.sort(function(a, b) { return a.d - b.d; });
        var connectCount = Math.min(3, dists.length);
        for (var k = 0; k < connectCount; k++) {
          addHnswEdge(newId, dists[k].idx);
          hnswSearchTrail.push({
            from: newId, to: dists[k].idx,
            alpha: 1.0, color: [0, 212, 255], decay: true
          });
        }
        node.glow = 0;
        hnswInsertAnim = null;
        updateHnswLabel();
        return;
      }
      requestAnimationFrame(animateInsert);
    }
    requestAnimationFrame(animateInsert);
  }
  function searchHnswNode() {
    if (hnswSearchAnim || hnswNodes.length < 3) return;
    // Create gold query dot at random position
    var qx = 30 + Math.random() * (hnswW - 60);
    var qy = 30 + Math.random() * (hnswH - 60);
    // Find the node nearest to query
    var target = 0;
    var minDist = Infinity;
    for (var i = 0; i < hnswNodes.length; i++) {
      var dx = qx - hnswNodes[i].x;
      var dy = qy - hnswNodes[i].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; target = i; }
    }
    // Greedy search path: start from a random node, follow edges
    var start = Math.floor(Math.random() * hnswNodes.length);
    if (start === target && hnswNodes.length > 1) start = (start + 1) % hnswNodes.length;
    var path = [start];
    var visited = {};
    visited[start] = true;
    var current = start;
    var maxSteps = 15;
    for (var step = 0; step < maxSteps; step++) {
      if (current === target) break;
      var bestNext = -1;
      var bestDist = Infinity;
      var conns = hnswNodes[current].connections;
      for (var c = 0; c < conns.length; c++) {
        if (visited[conns[c]]) continue;
        var dx2 = qx - hnswNodes[conns[c]].x;
        var dy2 = qy - hnswNodes[conns[c]].y;
        var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d2 < bestDist) { bestDist = d2; bestNext = conns[c]; }
      }
      if (bestNext === -1) break;
      visited[bestNext] = true;
      current = bestNext;
      path.push(current);
    }
    // Animate search step by step
    hnswSearchAnim = { query: { x: qx, y: qy }, path: path, step: 0, found: false };
    function animateSearchStep() {
      if (!hnswSearchAnim) return;
      hnswSearchAnim.step++;
      var s = Math.min(hnswSearchAnim.step, path.length);
      // Highlight path edges
      for (var i = 0; i < s - 1; i++) {
        hnswSearchTrail.push({
          from: path[i], to: path[i + 1],
          alpha: 1.0, color: [240, 192, 32], decay: true
        });
      }
      // Highlight current node
      if (s > 0 && s <= path.length) {
        hnswNodes[path[s - 1]].glow = 1.0;
        hnswNodes[path[s - 1]].color = [240, 192, 32];
      }
      if (s >= path.length) {
        // Found: pulse green
        hnswSearchAnim.found = true;
        hnswNodes[path[path.length - 1]].color = [16, 185, 129];
        hnswNodes[path[path.length - 1]].glow = 1.5;
        setTimeout(function() {
          hnswSearchAnim = null;
          for (var j = 0; j < hnswNodes.length; j++) {
            hnswNodes[j].color = null;
            hnswNodes[j].glow = 0;
          }
        }, 1200);
        return;
      }
      setTimeout(animateSearchStep, 250);
    }
    setTimeout(animateSearchStep, 100);
  }
  function drawHnswGraph() {
    if (currentStage !== 1) return;
    hnswCtx.clearRect(0, 0, hnswW, hnswH);
    // Spring-force layout step
    for (var i = 0; i < hnswNodes.length; i++) {
      for (var j = i + 1; j < hnswNodes.length; j++) {
        var dx = hnswNodes[i].x - hnswNodes[j].x;
        var dy = hnswNodes[i].y - hnswNodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          var force = (100 - dist) * 0.015;
          var fx = (dx / dist) * force;
          var fy = (dy / dist) * force;
          hnswNodes[i].vx += fx;
          hnswNodes[i].vy += fy;
          hnswNodes[j].vx -= fx;
          hnswNodes[j].vy -= fy;
        }
      }
    }
    for (var e = 0; e < hnswEdges.length; e++) {
      var eA = hnswNodes[hnswEdges[e][0]];
      var eB = hnswNodes[hnswEdges[e][1]];
      var edx = eA.x - eB.x;
      var edy = eA.y - eB.y;
      var edist = Math.sqrt(edx * edx + edy * edy);
      if (edist > 80) {
        var attract = (edist - 80) * 0.004;
        var afx = (edx / edist) * attract;
        var afy = (edy / edist) * attract;
        eA.vx -= afx;
        eA.vy -= afy;
        eB.vx += afx;
        eB.vy += afy;
      }
    }
    var margin = 20;
    for (var n = 0; n < hnswNodes.length; n++) {
      var nd = hnswNodes[n];
      nd.vx *= 0.92;
      nd.vy *= 0.92;
      nd.x += nd.vx;
      nd.y += nd.vy;
      if (nd.x < margin) { nd.x = margin; nd.vx = 0; }
      if (nd.x > hnswW - margin) { nd.x = hnswW - margin; nd.vx = 0; }
      if (nd.y < margin) { nd.y = margin; nd.vy = 0; }
      if (nd.y > hnswH - margin) { nd.y = hnswH - margin; nd.vy = 0; }
    }
    // Draw edges
    for (var e2 = 0; e2 < hnswEdges.length; e2++) {
      var na = hnswNodes[hnswEdges[e2][0]];
      var nb = hnswNodes[hnswEdges[e2][1]];
      var isHighLayer = na.layer >= 1 || nb.layer >= 1;
      hnswCtx.beginPath();
      hnswCtx.moveTo(na.x, na.y);
      hnswCtx.lineTo(nb.x, nb.y);
      if (isHighLayer) {
        hnswCtx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        hnswCtx.lineWidth = 1.5;
      } else {
        hnswCtx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        hnswCtx.lineWidth = 1;
      }
      hnswCtx.stroke();
    }
    // Draw search trail (glowing edges)
    for (var t = hnswSearchTrail.length - 1; t >= 0; t--) {
      var trail = hnswSearchTrail[t];
      var trA = hnswNodes[trail.from];
      var trB = hnswNodes[trail.to];
      if (trA && trB) {
        hnswCtx.save();
        hnswCtx.shadowBlur = 12;
        hnswCtx.shadowColor = 'rgba(' + trail.color[0] + ',' + trail.color[1] + ',' + trail.color[2] + ',' + trail.alpha + ')';
        hnswCtx.beginPath();
        hnswCtx.moveTo(trA.x, trA.y);
        hnswCtx.lineTo(trB.x, trB.y);
        hnswCtx.strokeStyle = 'rgba(' + trail.color[0] + ',' + trail.color[1] + ',' + trail.color[2] + ',' + trail.alpha + ')';
        hnswCtx.lineWidth = 2.5;
        hnswCtx.stroke();
        hnswCtx.restore();
      }
      if (trail.decay) {
        trail.alpha -= 0.012;
        if (trail.alpha <= 0) hnswSearchTrail.splice(t, 1);
      }
    }
    // Draw query dot if searching
    if (hnswSearchAnim) {
      var q = hnswSearchAnim.query;
      hnswCtx.save();
      hnswCtx.shadowBlur = 16;
      hnswCtx.shadowColor = 'rgba(240, 192, 32, 0.8)';
      hnswCtx.beginPath();
      hnswCtx.arc(q.x, q.y, 7, 0, Math.PI * 2);
      hnswCtx.fillStyle = 'rgba(240, 192, 32, 0.9)';
      hnswCtx.fill();
      hnswCtx.restore();
    }
    // Draw nodes
    for (var nd2 = 0; nd2 < hnswNodes.length; nd2++) {
      var node = hnswNodes[nd2];
      var r, col;
      if (node.layer === 0) { r = 5; col = [0, 212, 255]; }
      else if (node.layer === 1) { r = 7; col = [168, 85, 247]; }
      else { r = 9; col = [240, 192, 32]; }
      if (node.color) col = node.color;
      hnswCtx.save();
      var glowAmount = 8 + (node.glow || 0) * 12;
      hnswCtx.shadowBlur = glowAmount;
      hnswCtx.shadowColor = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ', 0.7)';
      hnswCtx.beginPath();
      hnswCtx.arc(node.x, node.y, r + (node.glow || 0) * 3, 0, Math.PI * 2);
      hnswCtx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ', 0.9)';
      hnswCtx.fill();
      hnswCtx.restore();
      if (node.glow > 0) node.glow *= 0.97;
    }
    hnswAnimFrame = requestAnimationFrame(drawHnswGraph);
  }

  // --- 5. STAGE 2 - EMBEDDING EXPLORER ---
  var embedCanvas, embedCtx, embedW, embedH;
  var embedPoints = [];
  var embedClusters = [];
  var embedArrow = null;
  var embedConnections = [];
  var embedInitialized = false;
  var EMBED_CATEGORIES = [
    { name: 'agents', color: [59, 130, 246] },
    { name: 'vectors', color: [0, 212, 255] },
    { name: 'security', color: [239, 68, 68] },
    { name: 'teaching', color: [240, 192, 32] },
    { name: 'neural', color: [168, 85, 247] },
    { name: 'swarms', color: [16, 185, 129] }
  ];
  function boxMuller() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
  function initEmbeddingExplorer() {
    embedCanvas = document.getElementById('embedCanvas');
    var wrap = embedCanvas.parentElement;
    embedW = wrap.clientWidth;
    embedH = wrap.clientHeight;
    embedCanvas.width = embedW;
    embedCanvas.height = embedH;
    embedCtx = embedCanvas.getContext('2d');
    if (!embedInitialized) {
      embedPoints = [];
      embedClusters = [];
      embedConnections = [];
      embedArrow = null;
      var margin = 60;
      var sigma = 35;
      // Generate 6 cluster centers spread across canvas
      for (var c = 0; c < EMBED_CATEGORIES.length; c++) {
        var col = Math.floor(c % 3);
        var row = Math.floor(c / 3);
        var cx = margin + (col + 0.5) * ((embedW - margin * 2) / 3) + (Math.random() - 0.5) * 40;
        var cy = margin + (row + 0.5) * ((embedH - margin * 2) / 2) + (Math.random() - 0.5) * 30;
        embedClusters.push({ x: cx, y: cy, cat: EMBED_CATEGORIES[c] });
        // Generate ~8 points per cluster
        var count = 7 + Math.floor(Math.random() * 4);
        for (var p = 0; p < count; p++) {
          var px = cx + boxMuller() * sigma;
          var py = cy + boxMuller() * sigma;
          px = Math.max(10, Math.min(embedW - 10, px));
          py = Math.max(10, Math.min(embedH - 10, py));
          embedPoints.push({
            x: px, y: py,
            cat: EMBED_CATEGORIES[c],
            catIndex: c
          });
        }
      }
      // Wire button and input
      document.getElementById('embedFireBtn').onclick = function() {
        fireQueryVector(document.getElementById('embedQuery').value || '');
      };
      document.getElementById('embedQuery').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          fireQueryVector(document.getElementById('embedQuery').value || '');
        }
      });
      embedInitialized = true;
    }
    drawEmbedCanvas();
  }
  function fireQueryVector(query) {
    var q = query.toLowerCase().trim();
    if (!q) q = 'random';
    // Map query to target cluster
    var targetIdx = Math.floor(Math.random() * EMBED_CATEGORIES.length);
    if (q.indexOf('agent') !== -1) targetIdx = 0;
    else if (q.indexOf('vector') !== -1) targetIdx = 1;
    else if (q.indexOf('secur') !== -1) targetIdx = 2;
    else if (q.indexOf('teach') !== -1 || q.indexOf('learn') !== -1) targetIdx = 3;
    else if (q.indexOf('neural') !== -1 || q.indexOf('brain') !== -1) targetIdx = 4;
    else if (q.indexOf('swarm') !== -1) targetIdx = 5;
    var cluster = embedClusters[targetIdx];
    // Create animated arrow from bottom-center to target cluster
    embedConnections = [];
    embedArrow = {
      sx: embedW / 2,
      sy: embedH - 15,
      tx: cluster.x,
      ty: cluster.y,
      progress: 0,
      color: [240, 192, 32],
      trails: [],
      done: false,
      targetIdx: targetIdx
    };
    // Clear previous results
    document.getElementById('embedResults').textContent = '';
  }
  function drawEmbedCanvas() {
    if (currentStage !== 2) return;
    // Slight trail effect for motion blur
    embedCtx.fillStyle = 'rgba(10, 10, 15, 0.08)';
    embedCtx.fillRect(0, 0, embedW, embedH);
    // Draw all points
    for (var i = 0; i < embedPoints.length; i++) {
      var pt = embedPoints[i];
      var col = pt.cat.color;
      embedCtx.beginPath();
      embedCtx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      embedCtx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ', 0.7)';
      embedCtx.fill();
    }
    // Draw category labels
    embedCtx.font = '10px "JetBrains Mono", monospace';
    for (var c = 0; c < embedClusters.length; c++) {
      var cl = embedClusters[c];
      var catCol = cl.cat.color;
      embedCtx.fillStyle = 'rgba(' + catCol[0] + ',' + catCol[1] + ',' + catCol[2] + ', 0.45)';
      embedCtx.fillText(cl.cat.name, cl.x - 18, cl.y - 45);
    }
    // Animate arrow
    if (embedArrow && !embedArrow.done) {
      embedArrow.progress += 0.018;
      if (embedArrow.progress > 1) embedArrow.progress = 1;
      var p = embedArrow.progress;
      var ep = p * p * (3 - 2 * p); // smoothstep
      var arrowCx = embedArrow.sx + (embedArrow.tx - embedArrow.sx) * ep;
      var arrowCy = embedArrow.sy + (embedArrow.ty - embedArrow.sy) * ep;
      // Trailing particles
      if (Math.random() < 0.5) {
        embedArrow.trails.push({
          x: arrowCx + (Math.random() - 0.5) * 6,
          y: arrowCy + (Math.random() - 0.5) * 6,
          alpha: 0.8
        });
      }
      // Draw trails
      for (var t = embedArrow.trails.length - 1; t >= 0; t--) {
        var tr = embedArrow.trails[t];
        embedCtx.beginPath();
        embedCtx.arc(tr.x, tr.y, 2, 0, Math.PI * 2);
        embedCtx.fillStyle = 'rgba(240, 192, 32, ' + tr.alpha + ')';
        embedCtx.fill();
        tr.alpha -= 0.025;
        if (tr.alpha <= 0) embedArrow.trails.splice(t, 1);
      }
      // Draw arrow line
      embedCtx.save();
      embedCtx.shadowBlur = 10;
      embedCtx.shadowColor = 'rgba(240, 192, 32, 0.7)';
      embedCtx.beginPath();
      embedCtx.moveTo(embedArrow.sx, embedArrow.sy);
      embedCtx.lineTo(arrowCx, arrowCy);
      embedCtx.strokeStyle = 'rgba(240, 192, 32, 0.8)';
      embedCtx.lineWidth = 2;
      embedCtx.stroke();
      // Arrow head
      embedCtx.beginPath();
      embedCtx.arc(arrowCx, arrowCy, 5, 0, Math.PI * 2);
      embedCtx.fillStyle = 'rgba(240, 192, 32, 0.9)';
      embedCtx.fill();
      embedCtx.restore();
      if (embedArrow.progress >= 1) {
        embedArrow.done = true;
        onEmbedArrowArrival(embedArrow.targetIdx);
      }
    }
    // Draw connections to nearest results
    for (var cn = 0; cn < embedConnections.length; cn++) {
      var conn = embedConnections[cn];
      embedCtx.save();
      embedCtx.shadowBlur = 8;
      embedCtx.shadowColor = 'rgba(240, 192, 32, 0.4)';
      embedCtx.beginPath();
      embedCtx.moveTo(conn.fx, conn.fy);
      embedCtx.lineTo(conn.tx, conn.ty);
      embedCtx.strokeStyle = 'rgba(240, 192, 32, ' + (conn.alpha || 0.5) + ')';
      embedCtx.lineWidth = 1.5;
      embedCtx.stroke();
      // Distance label
      embedCtx.font = '9px "JetBrains Mono", monospace';
      embedCtx.fillStyle = 'rgba(240, 192, 32, 0.8)';
      embedCtx.fillText(conn.score, (conn.fx + conn.tx) / 2 + 4, (conn.fy + conn.ty) / 2 - 4);
      embedCtx.restore();
    }
    embedAnimFrame = requestAnimationFrame(drawEmbedCanvas);
  }
  function onEmbedArrowArrival(targetIdx) {
    var cluster = embedClusters[targetIdx];
    // Find 5 nearest points to cluster center
    var scored = [];
    for (var i = 0; i < embedPoints.length; i++) {
      var dx = embedPoints[i].x - cluster.x;
      var dy = embedPoints[i].y - cluster.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      scored.push({ point: embedPoints[i], dist: dist, index: i });
    }
    scored.sort(function(a, b) { return a.dist - b.dist; });
    var results = scored.slice(0, 5);
    // Draw connection lines
    embedConnections = [];
    for (var r = 0; r < results.length; r++) {
      var similarity = Math.max(0.1, 1 - results[r].dist / 200);
      embedConnections.push({
        fx: cluster.x, fy: cluster.y,
        tx: results[r].point.x, ty: results[r].point.y,
        alpha: 0.5,
        score: similarity.toFixed(2)
      });
    }
    // Populate result tags
    var resultsEl = document.getElementById('embedResults');
    resultsEl.textContent = '';
    for (var r2 = 0; r2 < results.length; r2++) {
      (function(result, idx) {
        var tag = document.createElement('span');
        tag.className = 'embed-result-tag';
        var catName = result.point.cat.name;
        var score = Math.max(0.1, 1 - result.dist / 200).toFixed(2);
        tag.textContent = catName + ' ' + score;
        tag.style.borderColor = 'rgba(' + result.point.cat.color[0] + ',' + result.point.cat.color[1] + ',' + result.point.cat.color[2] + ', 0.4)';
        resultsEl.appendChild(tag);
        setTimeout(function() { tag.classList.add('visible'); }, idx * 120);
      })(results[r2], r2);
    }
  }

  // --- 6. STAGE 3 - MIN-CUT REVEALER ---
  var mincutCanvas, mincutCtx, mcW, mcH;
  var mcNodes = [];
  var mcEdges = [];
  var mcCutEdges = [];
  var mcBridgeNodes = [];
  var mcClusterAssignment = [];
  var mcPhase = 'idle';
  var mcScanIdx = 0;
  var mcCutProgress = 0;
  var mcSlideOffset = 0;
  var mcInitialized = false;
  var mcScanTimer = null;
  function initMinCutDemo() {
    mincutCanvas = document.getElementById('mincutCanvas');
    var wrap = mincutCanvas.parentElement;
    mcW = wrap.clientWidth;
    mcH = wrap.clientHeight;
    mincutCanvas.width = mcW;
    mincutCanvas.height = mcH;
    mincutCtx = mincutCanvas.getContext('2d');
    if (!mcInitialized) {
      mcNodes = [];
      mcEdges = [];
      mcCutEdges = [];
      mcBridgeNodes = [];
      mcClusterAssignment = [];
      var leftCx = mcW * 0.30;
      var rightCx = mcW * 0.70;
      var cy = mcH * 0.50;
      var spread = Math.min(mcW, mcH) * 0.12;
      // Left cluster: 12 nodes
      for (var i = 0; i < 12; i++) {
        mcNodes.push({
          x: leftCx + (Math.random() - 0.5) * spread * 2,
          y: cy + (Math.random() - 0.5) * spread * 2,
          vx: 0, vy: 0,
          cluster: 0,
          color: null, glow: 0
        });
        mcClusterAssignment.push(0);
      }
      // Right cluster: 12 nodes
      for (var j = 0; j < 12; j++) {
        mcNodes.push({
          x: rightCx + (Math.random() - 0.5) * spread * 2,
          y: cy + (Math.random() - 0.5) * spread * 2,
          vx: 0, vy: 0,
          cluster: 1,
          color: null, glow: 0
        });
        mcClusterAssignment.push(1);
      }
      // Bridge: 6 nodes
      var bridgeCx = mcW * 0.50;
      for (var k = 0; k < 6; k++) {
        var bIdx = mcNodes.length;
        mcNodes.push({
          x: bridgeCx + (Math.random() - 0.5) * spread * 0.8,
          y: cy + (Math.random() - 0.5) * spread * 1.2,
          vx: 0, vy: 0,
          cluster: 2,
          color: null, glow: 0
        });
        mcClusterAssignment.push(2);
        mcBridgeNodes.push(bIdx);
      }
      // Intra-cluster edges
      addClusterEdges(0, 12);
      addClusterEdges(12, 24);
      addClusterEdges(24, 30);
      // Cross-cluster edges through bridge nodes
      mcCutEdges.push(mcEdges.length);
      mcEdges.push([findNearestInRange(0, 12, mcW * 0.5, mcH * 0.5), mcBridgeNodes[0]]);
      mcCutEdges.push(mcEdges.length);
      mcEdges.push([findNearestInRange(0, 12, mcW * 0.5, mcH * 0.5), mcBridgeNodes[1]]);
      mcCutEdges.push(mcEdges.length);
      mcEdges.push([mcBridgeNodes[mcBridgeNodes.length - 1], findNearestInRange(12, 24, mcW * 0.5, mcH * 0.5)]);
      mcCutEdges.push(mcEdges.length);
      mcEdges.push([mcBridgeNodes[mcBridgeNodes.length - 2], findNearestInRange(12, 24, mcW * 0.5, mcH * 0.5)]);
      // Pre-compute 60 iterations of force layout
      for (var iter = 0; iter < 60; iter++) {
        forceLayoutStep();
      }
      // Wire button
      document.getElementById('mincutBtn').onclick = runMinCut;
      document.getElementById('mincutStats').textContent = '';
      mcPhase = 'idle';
      mcInitialized = true;
    }
    drawMincutCanvas();
  }
  function addClusterEdges(start, end) {
    for (var i = start; i < end; i++) {
      var dists = [];
      for (var j = start; j < end; j++) {
        if (i === j) continue;
        var dx = mcNodes[i].x - mcNodes[j].x;
        var dy = mcNodes[i].y - mcNodes[j].y;
        dists.push({ idx: j, d: Math.sqrt(dx * dx + dy * dy) });
      }
      dists.sort(function(a, b) { return a.d - b.d; });
      var connectCount = 2 + Math.floor(Math.random() * 2);
      for (var c = 0; c < Math.min(connectCount, dists.length); c++) {
        var exists = false;
        for (var e = 0; e < mcEdges.length; e++) {
          if ((mcEdges[e][0] === i && mcEdges[e][1] === dists[c].idx) ||
              (mcEdges[e][0] === dists[c].idx && mcEdges[e][1] === i)) {
            exists = true; break;
          }
        }
        if (!exists) mcEdges.push([i, dists[c].idx]);
      }
    }
  }
  function findNearestInRange(start, end, refX, refY) {
    var best = start;
    var minD = Infinity;
    for (var i = start; i < end; i++) {
      var dx = mcNodes[i].x - refX;
      var dy = mcNodes[i].y - refY;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < minD) { minD = d; best = i; }
    }
    return best;
  }
  function forceLayoutStep() {
    for (var i = 0; i < mcNodes.length; i++) {
      for (var j = i + 1; j < mcNodes.length; j++) {
        var dx = mcNodes[i].x - mcNodes[j].x;
        var dy = mcNodes[i].y - mcNodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) {
          var f = (80 - dist) * 0.02;
          mcNodes[i].vx += (dx / dist) * f;
          mcNodes[i].vy += (dy / dist) * f;
          mcNodes[j].vx -= (dx / dist) * f;
          mcNodes[j].vy -= (dy / dist) * f;
        }
      }
    }
    for (var e = 0; e < mcEdges.length; e++) {
      var a = mcNodes[mcEdges[e][0]];
      var b = mcNodes[mcEdges[e][1]];
      var edx = a.x - b.x;
      var edy = a.y - b.y;
      var edist = Math.sqrt(edx * edx + edy * edy);
      if (edist > 60) {
        var af = (edist - 60) * 0.005;
        a.vx -= (edx / edist) * af;
        a.vy -= (edy / edist) * af;
        b.vx += (edx / edist) * af;
        b.vy += (edy / edist) * af;
      }
    }
    var margin = 25;
    for (var n = 0; n < mcNodes.length; n++) {
      mcNodes[n].vx *= 0.9;
      mcNodes[n].vy *= 0.9;
      mcNodes[n].x += mcNodes[n].vx;
      mcNodes[n].y += mcNodes[n].vy;
      mcNodes[n].x = Math.max(margin, Math.min(mcW - margin, mcNodes[n].x));
      mcNodes[n].y = Math.max(margin, Math.min(mcH - margin, mcNodes[n].y));
    }
  }
  function runMinCut() {
    if (mcPhase !== 'idle' && mcPhase !== 'done') return;
    document.getElementById('mincutBtn').disabled = true;
    document.getElementById('mincutStats').textContent = '';
    for (var i = 0; i < mcNodes.length; i++) {
      mcNodes[i].color = null;
      mcNodes[i].glow = 0;
    }
    mcSlideOffset = 0;
    // Phase 1: Scanning
    mcPhase = 'scanning';
    mcScanIdx = 0;
    var scanDelay = 50;
    function scanNext() {
      if (mcScanIdx < mcEdges.length) {
        mcScanIdx++;
        mcScanTimer = setTimeout(scanNext, scanDelay);
      } else {
        mcPhase = 'cutting';
        mcCutProgress = 0;
        doCutPhase();
      }
    }
    mcScanTimer = setTimeout(scanNext, scanDelay);
  }
  function doCutPhase() {
    var pulseCount = 0;
    function pulseStep() {
      if (pulseCount >= 6) {
        mcPhase = 'severing';
        mcCutProgress = 0;
        animateSever();
        return;
      }
      pulseCount++;
      setTimeout(pulseStep, 200);
    }
    pulseStep();
  }
  function animateSever() {
    mcCutProgress += 0.02;
    if (mcCutProgress >= 1) {
      mcCutProgress = 1;
      mcPhase = 'done';
      for (var i = 0; i < mcNodes.length; i++) {
        if (mcNodes[i].cluster === 0) mcNodes[i].color = [0, 212, 255];
        else if (mcNodes[i].cluster === 1) mcNodes[i].color = [168, 85, 247];
        else mcNodes[i].color = [240, 192, 32];
      }
      animateSlide();
      return;
    }
    setTimeout(animateSever, 16);
  }
  function animateSlide() {
    var slideFrames = 0;
    var slideDist = 30;
    function slideStep() {
      slideFrames++;
      var t = Math.min(slideFrames / 30, 1);
      t = t * t * (3 - 2 * t);
      mcSlideOffset = t * slideDist;
      if (t >= 1) {
        showMincutStats();
        document.getElementById('mincutBtn').disabled = false;
        return;
      }
      requestAnimationFrame(slideStep);
    }
    requestAnimationFrame(slideStep);
  }
  function showMincutStats() {
    var statsEl = document.getElementById('mincutStats');
    statsEl.textContent = '';
    var stats = [
      { label: 'clusters', val: '2' },
      { label: 'cut edges', val: String(mcCutEdges.length) },
      { label: 'bottleneck nodes', val: String(mcBridgeNodes.length) }
    ];
    for (var s = 0; s < stats.length; s++) {
      (function(stat, idx) {
        var el = document.createElement('div');
        el.className = 'mincut-stat';
        var valSpan = document.createElement('span');
        valSpan.className = 'val';
        valSpan.textContent = stat.val;
        el.appendChild(valSpan);
        el.appendChild(document.createTextNode(' ' + stat.label));
        statsEl.appendChild(el);
        setTimeout(function() { el.classList.add('visible'); }, idx * 300);
      })(stats[s], s);
    }
  }
  function drawMincutCanvas() {
    if (currentStage !== 3) return;
    mincutCtx.clearRect(0, 0, mcW, mcH);
    // Draw edges
    for (var e = 0; e < mcEdges.length; e++) {
      var isCut = mcCutEdges.indexOf(e) !== -1;
      var aIdx = mcEdges[e][0];
      var bIdx = mcEdges[e][1];
      var na = mcNodes[aIdx];
      var nb = mcNodes[bIdx];
      var ax = na.x + (na.cluster === 0 ? -mcSlideOffset : (na.cluster === 1 ? mcSlideOffset : 0));
      var ay = na.y;
      var bx = nb.x + (nb.cluster === 0 ? -mcSlideOffset : (nb.cluster === 1 ? mcSlideOffset : 0));
      var by = nb.y;
      if (mcPhase === 'scanning' && e < mcScanIdx) {
        mincutCtx.beginPath();
        mincutCtx.moveTo(ax, ay);
        mincutCtx.lineTo(bx, by);
        mincutCtx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        mincutCtx.lineWidth = 1.5;
        mincutCtx.stroke();
        continue;
      }
      if (isCut) {
        if (mcPhase === 'cutting') {
          mincutCtx.beginPath();
          mincutCtx.moveTo(ax, ay);
          mincutCtx.lineTo(bx, by);
          mincutCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          mincutCtx.lineWidth = 2;
          mincutCtx.stroke();
        } else if (mcPhase === 'severing') {
          var remain = 1 - mcCutProgress;
          if (remain > 0) {
            var mx = (ax + bx) / 2;
            var my = (ay + by) / 2;
            var sx = mx + (ax - mx) * remain;
            var sy = my + (ay - my) * remain;
            var ex = mx + (bx - mx) * remain;
            var ey = my + (by - my) * remain;
            mincutCtx.beginPath();
            mincutCtx.moveTo(sx, sy);
            mincutCtx.lineTo(ex, ey);
            mincutCtx.strokeStyle = 'rgba(239, 68, 68, ' + remain + ')';
            mincutCtx.lineWidth = 2;
            mincutCtx.stroke();
          }
        } else if (mcPhase === 'done') {
          // Cut edges are severed - do not draw
        } else {
          mincutCtx.beginPath();
          mincutCtx.moveTo(ax, ay);
          mincutCtx.lineTo(bx, by);
          mincutCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          mincutCtx.lineWidth = 1;
          mincutCtx.stroke();
        }
      } else {
        mincutCtx.beginPath();
        mincutCtx.moveTo(ax, ay);
        mincutCtx.lineTo(bx, by);
        mincutCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        mincutCtx.lineWidth = 1;
        mincutCtx.stroke();
      }
    }
    // Draw nodes
    for (var n = 0; n < mcNodes.length; n++) {
      var node = mcNodes[n];
      var nx = node.x + (node.cluster === 0 ? -mcSlideOffset : (node.cluster === 1 ? mcSlideOffset : 0));
      var ny = node.y;
      var col = node.color || [200, 200, 210];
      var r = node.cluster === 2 ? 6 : 5;
      var glowAmt = 6 + (node.glow || 0) * 10;
      mincutCtx.save();
      mincutCtx.shadowBlur = glowAmt;
      mincutCtx.shadowColor = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ', 0.6)';
      mincutCtx.beginPath();
      mincutCtx.arc(nx, ny, r, 0, Math.PI * 2);
      mincutCtx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ', 0.85)';
      mincutCtx.fill();
      mincutCtx.restore();
    }
    mincutAnimFrame = requestAnimationFrame(drawMincutCanvas);
  }

  // --- 7. STAGE 4 - COMPARISON ---
  function animateComparison() {
    var rows = document.querySelectorAll('.compare-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.remove('visible');
    }
    // Stagger entrance
    for (var j = 0; j < rows.length; j++) {
      (function(row, delay) {
        setTimeout(function() { row.classList.add('visible'); }, delay);
      })(rows[j], j * 300);
    }
    // After all rows visible, animate stat cards
    var totalDelay = rows.length * 300 + 200;
    setTimeout(function() {
      var statEls = document.querySelectorAll('#comparisonStats [data-count]');
      for (var k = 0; k < statEls.length; k++) {
        animateCount(statEls[k], parseInt(statEls[k].dataset.count));
      }
      // Try fetching real stats from Pi-Brain
      try {
        fetch('https://pi.ruv.io/v1/status')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data) {
              var vals = statEls;
              if (data.memories && vals[0]) { vals[0].dataset.count = String(data.memories); animateCount(vals[0], data.memories); }
              if (data.contributors && vals[1]) { vals[1].dataset.count = String(data.contributors); animateCount(vals[1], data.contributors); }
              if (data.votes && vals[2]) { vals[2].dataset.count = String(data.votes); animateCount(vals[2], data.votes); }
              if (data.clusters && vals[3]) { vals[3].dataset.count = String(data.clusters); animateCount(vals[3], data.clusters); }
            }
          })
          .catch(function() { /* fallback values already set in HTML */ });
      } catch (ignore) {
        // Fallback to hardcoded values
      }
    }, totalDelay);
  }

  // --- 8. STAGE 5 - LIVE PI BRAIN SEARCH ---
  var SIMULATED_RESULTS = [
    { id: 's1', title: 'HNSW Index Construction Patterns', category: 'architecture', quality: 0.89 },
    { id: 's2', title: 'Agent Authentication & Security', category: 'security', quality: 0.85 },
    { id: 's3', title: 'RVF Cognitive Container Format', category: 'architecture', quality: 0.92 },
    { id: 's4', title: 'Swarm Topology Optimization', category: 'pattern', quality: 0.78 },
    { id: 's5', title: 'Transfer Learning Between Domains', category: 'solution', quality: 0.81 },
    { id: 's6', title: 'WASM Executable Knowledge Nodes', category: 'tooling', quality: 0.88 },
    { id: 's7', title: 'Embedding Quantization (SQ8)', category: 'performance', quality: 0.84 },
    { id: 's8', title: 'MinCut Graph Partitioning', category: 'architecture', quality: 0.76 }
  ];
  var piSearchDebounce = null;
  function initPiBrainLive() {
    var piSearch = document.getElementById('piSearch');
    document.getElementById('piResults').textContent = '';
    document.getElementById('piLatency').classList.remove('visible');
    document.getElementById('piLatency').textContent = '';
    document.getElementById('participationBadge').classList.remove('visible');
    piSearch.oninput = function() {
      clearTimeout(piSearchDebounce);
      piSearchDebounce = setTimeout(function() {
        searchPiBrain(piSearch.value);
      }, 200);
    };
    setTimeout(function() { piSearch.focus(); }, 500);
  }
  function searchPiBrain(query) {
    if (!query || !query.trim()) {
      document.getElementById('piResults').textContent = '';
      document.getElementById('piLatency').classList.remove('visible');
      return;
    }
    var latency = document.getElementById('piLatency');
    latency.textContent = 'Searching collective brain...';
    latency.classList.add('visible');
    var startTime = performance.now();
    fetch('https://pi.ruv.io/v1/memories/search?q=' + encodeURIComponent(query) + '&limit=6')
      .then(function(r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function(data) {
        var elapsed = (performance.now() - startTime).toFixed(1);
        var results = (data.results || data || []).slice(0, 6);
        renderPiResults(results, elapsed);
      })
      .catch(function() {
        // Try proxy
        fetch('/api/pi/search?q=' + encodeURIComponent(query) + '&limit=6')
          .then(function(r) {
            if (!r.ok) throw new Error('not ok');
            return r.json();
          })
          .then(function(data) {
            var elapsed = (performance.now() - startTime).toFixed(1);
            var results = (data.results || data || []).slice(0, 6);
            renderPiResults(results, elapsed);
          })
          .catch(function() {
            // Use simulated results
            var elapsed = (performance.now() - startTime).toFixed(1);
            var q = query.toLowerCase();
            var filtered = SIMULATED_RESULTS.filter(function(r) {
              return r.title.toLowerCase().indexOf(q) !== -1 ||
                     r.category.toLowerCase().indexOf(q) !== -1 ||
                     q.length <= 3;
            });
            if (filtered.length === 0) filtered = SIMULATED_RESULTS.slice(0, 4);
            renderPiResults(filtered, elapsed);
          });
      });
  }
  function renderPiResults(results, elapsed) {
    var latency = document.getElementById('piLatency');
    latency.textContent = elapsed + 'ms \u2022 ' + results.length + ' results \u2022 collective brain';
    latency.classList.add('visible');
    var container = document.getElementById('piResults');
    container.textContent = '';
    for (var i = 0; i < results.length; i++) {
      (function(entry, idx) {
        var div = document.createElement('div');
        div.className = 'result-item';
        div.setAttribute('role', 'listitem');
        var score = document.createElement('span');
        score.className = 'result-score';
        var scoreVal = entry.quality || entry.quality_score || 0;
        if (entry.alpha && entry.beta) scoreVal = entry.alpha / (entry.alpha + entry.beta);
        if (typeof scoreVal === 'number') scoreVal = scoreVal.toFixed(2);
        score.textContent = scoreVal;
        var text = document.createElement('span');
        text.className = 'result-text';
        text.textContent = entry.title || entry.text || '';
        var cat = document.createElement('span');
        cat.className = 'result-category';
        cat.textContent = entry.category || entry.cat || '';
        var voteWrap = document.createElement('div');
        voteWrap.className = 'result-vote';
        var upBtn = document.createElement('button');
        upBtn.className = 'vote-btn';
        upBtn.textContent = '\u25B2';
        upBtn.setAttribute('aria-label', 'Vote up');
        upBtn.addEventListener('click', function() { votePiBrain(entry.id, 'up', upBtn); });
        var downBtn = document.createElement('button');
        downBtn.className = 'vote-btn';
        downBtn.textContent = '\u25BC';
        downBtn.setAttribute('aria-label', 'Vote down');
        downBtn.addEventListener('click', function() { votePiBrain(entry.id, 'down', downBtn); });
        voteWrap.appendChild(upBtn);
        voteWrap.appendChild(downBtn);
        div.appendChild(score);
        div.appendChild(text);
        div.appendChild(cat);
        div.appendChild(voteWrap);
        container.appendChild(div);
        setTimeout(function() { div.classList.add('visible'); }, idx * 80);
      })(results[i], i);
    }
  }
  function votePiBrain(id, direction, btn) {
    if (!id) return;
    btn.classList.add('voted');
    var badge = document.getElementById('participationBadge');
    badge.textContent = 'You just participated in collective intelligence';
    badge.classList.add('visible');
    try {
      fetch('https://pi.ruv.io/v1/memories/' + encodeURIComponent(id) + '/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: direction })
      }).catch(function() { /* optimistic UI already shown */ });
    } catch (ignore) {
      // Badge already shown
    }
  }

  // --- 9. CONTROLS & INIT ---
  prevBtn.addEventListener('click', function() {
    goToStage(currentStage - 1);
  });
  nextBtn.addEventListener('click', function() {
    if (currentStage === TOTAL_STAGES - 1) goToStage(0);
    else goToStage(currentStage + 1);
  });
  // Dot click handlers (event delegation)
  var stageNav = document.querySelector('.stage-nav');
  stageNav.addEventListener('click', function(e) {
    var dot = e.target.closest('.stage-dot');
    if (dot && dot.dataset.stage != null) {
      goToStage(parseInt(dot.dataset.stage));
    }
  });
  // Auto-play toggle
  autoBtn.addEventListener('click', function() {
    autoPlay = !autoPlay;
    autoBtn.textContent = autoPlay ? '\u23F8 Pause' : '\u25B6 Auto';
    if (autoPlay) {
      autoTimer = setInterval(function() {
        if (currentStage < TOTAL_STAGES - 1) {
          goToStage(currentStage + 1);
        } else {
          autoPlay = false;
          autoBtn.textContent = '\u25B6 Auto';
          clearInterval(autoTimer);
        }
      }, 8000);
    } else {
      clearInterval(autoTimer);
    }
  });
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      if (currentStage < TOTAL_STAGES - 1) goToStage(currentStage + 1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentStage > 0) goToStage(currentStage - 1);
    }
  });
  // Window resize
  window.addEventListener('resize', function() {
    resize();
    setStageTargets(currentStage);
    if (hnswCanvas && currentStage === 1) {
      var wrap1 = hnswCanvas.parentElement;
      hnswW = wrap1.clientWidth;
      hnswH = wrap1.clientHeight;
      hnswCanvas.width = hnswW;
      hnswCanvas.height = hnswH;
    }
    if (embedCanvas && currentStage === 2) {
      var wrap2 = embedCanvas.parentElement;
      embedW = wrap2.clientWidth;
      embedH = wrap2.clientHeight;
      embedCanvas.width = embedW;
      embedCanvas.height = embedH;
    }
    if (mincutCanvas && currentStage === 3) {
      var wrap3 = mincutCanvas.parentElement;
      mcW = wrap3.clientWidth;
      mcH = wrap3.clientHeight;
      mincutCanvas.width = mcW;
      mincutCanvas.height = mcH;
    }
  });
  // Stage 5: expand particles after convergence delay
  function expandParticlesForStage5() {
    if (currentStage !== 5) return;
    setTimeout(function() {
      if (currentStage !== 5) return;
      var cx = W / 2, cy = H / 2;
      for (var i = 0; i < particles.length; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist = 50 + Math.random() * Math.min(W, H) * 0.3;
        particles[i].tx = cx + Math.cos(angle) * dist;
        particles[i].ty = cy + Math.sin(angle) * dist;
      }
    }, 2000);
  }
  // Wrap triggerStageEffects to include stage 5 expansion
  var baseTrigger = triggerStageEffects;
  triggerStageEffects = function(n) {
    baseTrigger(n);
    if (n === 5) expandParticlesForStage5();
  };

  // --- INIT ---
  resize();
  initParticles();
  setStageTargets(0);
  drawParticles();
  triggerStageEffects(0);
})();
