(function() {
  'use strict';

  // =====================================================================
  // 1. PARTICLE SYSTEM
  // =====================================================================

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
      var angle, dist, t, groupAngle, spread, baseX, baseY, clusterIdx;

      switch (stage) {
        case 0: // Stream left-to-right
          p.tx = (i / particles.length) * W + (Math.random() - 0.5) * 40;
          p.ty = cy + (Math.random() - 0.5) * H * 0.6;
          break;

        case 1: // Circular loop
          angle = (i / particles.length) * Math.PI * 2;
          dist = Math.min(W, H) * 0.18 + Math.random() * 30;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 2: // Two clusters with bridge
          clusterIdx = i % 3;
          if (clusterIdx < 2) {
            baseX = clusterIdx === 0 ? cx - W * 0.18 : cx + W * 0.18;
            baseY = cy;
            spread = Math.min(W, H) * 0.08;
            p.tx = baseX + (Math.random() - 0.5) * spread;
            p.ty = baseY + (Math.random() - 0.5) * spread;
          } else {
            // Bridge particles
            t = Math.random();
            p.tx = cx + (Math.random() - 0.5) * W * 0.1;
            p.ty = cy + (Math.random() - 0.5) * 20;
          }
          break;

        case 3: // Drift: particles shift color via phase-based hue
          angle = Math.random() * Math.PI * 2;
          dist = Math.random() * Math.min(W, H) * 0.2;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          // Color shift is handled in draw loop via phase
          break;

        case 4: // Orbital flywheel ring, accelerating
          angle = (i / particles.length) * Math.PI * 2 + p.phase;
          dist = Math.min(W, H) * 0.16 + (Math.random() - 0.5) * 20;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 5: // Random ambient scatter
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
          break;
      }
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);

    if (currentStage >= 1 && currentStage <= 4) {
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
      var ease = 0.015 + (currentStage === 0 || currentStage === 5 ? 0 : 0.008);
      p.x += (p.tx - p.x) * ease + p.vx + Math.sin(p.phase) * 0.15;
      p.y += (p.ty - p.y) * ease + p.vy + Math.cos(p.phase) * 0.15;
      p.phase += p.speed;

      // Stage 4: slowly rotate targets for flywheel effect
      if (currentStage === 4) {
        var fwCx = W / 2, fwCy = H / 2;
        var fwAngle = Math.atan2(p.ty - fwCy, p.tx - fwCx);
        var fwDist = Math.sqrt((p.tx - fwCx) * (p.tx - fwCx) + (p.ty - fwCy) * (p.ty - fwCy));
        fwAngle += 0.003 + flywheelSpeedMult * 0.002;
        p.tx = fwCx + Math.cos(fwAngle) * fwDist;
        p.ty = fwCy + Math.sin(fwAngle) * fwDist;
      }

      if (currentStage === 0 || currentStage === 5) {
        if (p.x < -10 || p.x > W + 10) p.tx = Math.random() * W;
        if (p.y < -10 || p.y > H + 10) p.ty = Math.random() * H;
      }

      var rgb = p.color;

      // Stage 3: shift some particles from blue to orange based on phase
      if (currentStage === 3 && driftProgress > 0.3) {
        var driftFactor = Math.sin(p.phase * 3) * 0.5 + 0.5;
        if (driftFactor > 0.7 && driftProgress > 0.4) {
          var hueShift = Math.min(1, (driftProgress - 0.4) * 3);
          rgb = [
            Math.floor(rgb[0] + (240 - rgb[0]) * hueShift * driftFactor),
            Math.floor(rgb[1] + (140 - rgb[1]) * hueShift * driftFactor),
            Math.floor(rgb[2] * (1 - hueShift * driftFactor * 0.7))
          ];
        }
      }

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


  // =====================================================================
  // 2. STAGE MANAGEMENT
  // =====================================================================

  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');

  function goToStage(n) {
    if (n < 0 || n >= TOTAL_STAGES) return;
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
    nextBtn.textContent = n === TOTAL_STAGES - 1 ? 'Restart' : 'Next \u2192';
    counter.textContent = (n + 1) + ' / ' + TOTAL_STAGES;

    setStageTargets(n);
    triggerStageEffects(n);
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

  function animateValue(el, from, to, duration, decimals) {
    var start = performance.now();
    var dec = decimals || 0;
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = from + (to - from) * eased;
      el.textContent = val.toFixed(dec);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toFixed(dec);
    }
    requestAnimationFrame(tick);
  }


  // =====================================================================
  // 3. STAGE 0 — DEAD END PIPELINE
  // =====================================================================

  var pipelineCanvas = document.getElementById('pipelineCanvas');
  var pctx = pipelineCanvas ? pipelineCanvas.getContext('2d') : null;
  var PW = 0, PH = 0;
  var deadEndAnimFrame = 0;

  var deadEndState = {
    phase: 0,         // 0=idle, 1=question, 2=answer, 3=dissolve
    currentUser: 0,
    arrowProgress: 0,
    wastedCount: 0,
    dissolveParticles: [],
    ghostArrows: [],
    timer: 0
  };

  var USERS = [
    { label: 'User 1', y: 0.25 },
    { label: 'User 2', y: 0.50 },
    { label: 'User 3', y: 0.75 }
  ];

  function initPipeline() {
    if (!pipelineCanvas) return;
    var wrap = pipelineCanvas.parentElement;
    PW = wrap.clientWidth;
    PH = wrap.clientHeight;
    pipelineCanvas.width = PW;
    pipelineCanvas.height = PH;
    deadEndState.phase = 0;
    deadEndState.currentUser = 0;
    deadEndState.arrowProgress = 0;
    deadEndState.wastedCount = 0;
    deadEndState.dissolveParticles = [];
    deadEndState.ghostArrows = [];
    deadEndState.timer = 0;
    document.getElementById('wastedCounter').textContent = '0';
    cancelAnimationFrame(deadEndAnimFrame);
    drawPipeline();
  }

  function quadBezier(t, p0x, p0y, cpx, cpy, p1x, p1y) {
    var mt = 1 - t;
    return {
      x: mt * mt * p0x + 2 * mt * t * cpx + t * t * p1x,
      y: mt * mt * p0y + 2 * mt * t * cpy + t * t * p1y
    };
  }

  function drawRoundedBox(c, cx, cy, w, h, label, fill, stroke, textColor) {
    var rr = 8;
    c.save();
    c.fillStyle = fill;
    c.strokeStyle = stroke;
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(cx - w / 2, cy - h / 2, w, h, rr);
    c.fill();
    c.stroke();
    c.restore();
    c.font = '11px JetBrains Mono, monospace';
    c.fillStyle = textColor;
    c.textAlign = 'center';
    c.fillText(label, cx, cy + 4);
  }

  function drawBezierArrow(c, prog, sx, sy, cpx, cpy, ex, ey, color) {
    c.beginPath();
    for (var i = 0; i <= 20; i++) {
      var t = (i / 20) * prog;
      var p = quadBezier(t, sx, sy, cpx, cpy, ex, ey);
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.stroke();
    if (prog > 0.1) {
      var tip = quadBezier(prog, sx, sy, cpx, cpy, ex, ey);
      var pre = quadBezier(Math.max(0, prog - 0.05), sx, sy, cpx, cpy, ex, ey);
      var ang = Math.atan2(tip.y - pre.y, tip.x - pre.x);
      c.save();
      c.translate(tip.x, tip.y);
      c.rotate(ang);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-8, -4);
      c.lineTo(-8, 4);
      c.closePath();
      c.fillStyle = color;
      c.fill();
      c.restore();
    }
  }

  function drawUserIcon(c, x, y, active) {
    var col = active ? 'rgba(0, 212, 255, 0.7)' : 'rgba(136, 146, 164, 0.5)';
    c.beginPath();
    c.arc(x, y - 8, 7, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
    c.beginPath();
    c.moveTo(x, y + 1);
    c.lineTo(x, y + 14);
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.stroke();
  }

  function drawPipeline() {
    if (currentStage !== 0) return;
    pctx.clearRect(0, 0, PW, PH);

    var userX = PW * 0.12;
    var aiX = PW * 0.82;
    var aiY = PH * 0.5;
    var aiW = PW * 0.13;
    var aiH = PH * 0.18;

    // Draw ghost arrows (accumulated waste)
    for (var g = 0; g < deadEndState.ghostArrows.length; g++) {
      var ghost = deadEndState.ghostArrows[g];
      pctx.save();
      pctx.globalAlpha = 0.06;
      pctx.beginPath();
      var gCpx = (ghost.sx + ghost.ex) / 2;
      var gCpy = ghost.sy + (Math.random() - 0.5) * 20;
      pctx.moveTo(ghost.sx, ghost.sy);
      pctx.quadraticCurveTo(gCpx, gCpy, ghost.ex, ghost.ey);
      pctx.strokeStyle = ghost.color;
      pctx.lineWidth = 1.5;
      pctx.stroke();
      pctx.restore();
    }

    // Draw user icons
    for (var u = 0; u < USERS.length; u++) {
      var uy = PH * USERS[u].y;
      drawUserIcon(pctx, userX, uy, u === deadEndState.currentUser);
      pctx.font = '10px JetBrains Mono, monospace';
      pctx.fillStyle = 'rgba(136, 146, 164, 0.6)';
      pctx.textAlign = 'center';
      pctx.fillText(USERS[u].label, userX, uy + 32);
    }

    // Draw AI box
    drawRoundedBox(pctx, aiX, aiY, aiW, aiH, 'AI Model', 'rgba(168, 85, 247, 0.12)', 'rgba(168, 85, 247, 0.4)', 'rgba(168, 85, 247, 0.8)');

    // Animate arrow exchange
    var cu = USERS[deadEndState.currentUser];
    var uY = PH * cu.y;
    var cpxQ = (userX + aiX) / 2;
    var cpyQ = uY - 30;
    var cpxA = (userX + aiX) / 2;
    var cpyA = uY + 30;

    deadEndState.timer++;

    if (deadEndState.phase === 0) {
      // Start question after brief pause
      if (deadEndState.timer > 30) {
        deadEndState.phase = 1;
        deadEndState.arrowProgress = 0;
        deadEndState.timer = 0;
      }
    }

    if (deadEndState.phase === 1) {
      // Question arrow: user to AI
      deadEndState.arrowProgress = Math.min(1, deadEndState.arrowProgress + 0.025);
      var prog = deadEndState.arrowProgress;
      drawBezierArrow(pctx, prog, userX + 14, uY, cpxQ, cpyQ, aiX - aiW / 2 - 6, aiY, 'rgba(240, 192, 32, 0.8)');
      if (prog >= 1) {
        deadEndState.phase = 2;
        deadEndState.arrowProgress = 0;
        deadEndState.timer = 0;
      }
    }

    if (deadEndState.phase === 2) {
      // Keep question arrow faded
      drawBezierArrow(pctx, 1, userX + 14, uY, cpxQ, cpyQ, aiX - aiW / 2 - 6, aiY, 'rgba(240, 192, 32, 0.3)');
      // Answer arrow
      deadEndState.arrowProgress = Math.min(1, deadEndState.arrowProgress + 0.025);
      var aProg = deadEndState.arrowProgress;
      drawBezierArrow(pctx, aProg, aiX - aiW / 2 - 6, aiY, cpxA, cpyA, userX + 14, uY, 'rgba(0, 212, 255, 0.8)');
      if (aProg >= 1) {
        deadEndState.phase = 3;
        deadEndState.timer = 0;
        // Spawn dissolve particles along both paths
        deadEndState.dissolveParticles = [];
        for (var dp = 0; dp < 25; dp++) {
          var dpt = Math.random();
          var dpPos = quadBezier(dpt, userX + 14, uY, cpxQ, cpyQ, aiX - aiW / 2 - 6, aiY);
          deadEndState.dissolveParticles.push({
            x: dpPos.x, y: dpPos.y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2 - 0.5,
            alpha: 0.9,
            color: 'gold',
            r: Math.random() * 2.5 + 1
          });
        }
        for (var dp2 = 0; dp2 < 25; dp2++) {
          var dp2t = Math.random();
          var dp2Pos = quadBezier(dp2t, aiX - aiW / 2 - 6, aiY, cpxA, cpyA, userX + 14, uY);
          deadEndState.dissolveParticles.push({
            x: dp2Pos.x, y: dp2Pos.y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2 - 0.5,
            alpha: 0.9,
            color: 'cyan',
            r: Math.random() * 2.5 + 1
          });
        }
        // Store ghost arrow
        deadEndState.ghostArrows.push({
          sx: userX + 14, sy: uY,
          ex: aiX - aiW / 2 - 6, ey: aiY,
          color: 'rgba(240, 192, 32, 0.5)'
        });
        deadEndState.ghostArrows.push({
          sx: aiX - aiW / 2 - 6, sy: aiY,
          ex: userX + 14, ey: uY,
          color: 'rgba(0, 212, 255, 0.5)'
        });
        // Keep only recent ghosts
        if (deadEndState.ghostArrows.length > 24) {
          deadEndState.ghostArrows = deadEndState.ghostArrows.slice(-24);
        }
      }
    }

    if (deadEndState.phase === 3) {
      // Dissolve particles
      var allFaded = true;
      for (var dp3 = 0; dp3 < deadEndState.dissolveParticles.length; dp3++) {
        var pp = deadEndState.dissolveParticles[dp3];
        pp.x += pp.vx;
        pp.y += pp.vy;
        pp.vy -= 0.02; // Slight upward drift
        pp.alpha -= 0.012;
        if (pp.alpha > 0) {
          allFaded = false;
          var cStr = pp.color === 'gold'
            ? 'rgba(240, 192, 32, ' + pp.alpha + ')'
            : 'rgba(0, 212, 255, ' + pp.alpha + ')';
          // Glow
          pctx.beginPath();
          pctx.arc(pp.x, pp.y, pp.r * 3, 0, Math.PI * 2);
          pctx.fillStyle = pp.color === 'gold'
            ? 'rgba(240, 192, 32, ' + (pp.alpha * 0.15) + ')'
            : 'rgba(0, 212, 255, ' + (pp.alpha * 0.15) + ')';
          pctx.fill();
          // Core
          pctx.beginPath();
          pctx.arc(pp.x, pp.y, pp.r, 0, Math.PI * 2);
          pctx.fillStyle = cStr;
          pctx.fill();
        }
      }

      if (allFaded || deadEndState.timer > 90) {
        deadEndState.wastedCount++;
        document.getElementById('wastedCounter').textContent = String(deadEndState.wastedCount);
        deadEndState.currentUser = (deadEndState.currentUser + 1) % 3;
        deadEndState.phase = 0;
        deadEndState.timer = 0;
        deadEndState.dissolveParticles = [];
      }
    }

    deadEndAnimFrame = requestAnimationFrame(drawPipeline);
  }


  // =====================================================================
  // 4. STAGE 1 — VOTE LOOP
  // =====================================================================

  var pipelineCanvas1 = document.getElementById('pipelineCanvas1');
  var pctx1 = pipelineCanvas1 ? pipelineCanvas1.getContext('2d') : null;
  var PW1 = 0, PH1 = 0;
  var loopAnimFrame = 0;

  var loopState = {
    phase: 0,
    currentUser: 0,
    arrowProgress: 0,
    quality: 0.72,
    voteCount: 0,
    timer: 0,
    ripples: [],
    feedbackProgress: 0
  };

  var miniGraphNodes = [];
  var miniGraphEdges = [];

  function initLoopPipeline() {
    if (!pipelineCanvas1) return;
    var wrap = pipelineCanvas1.parentElement;
    PW1 = wrap.clientWidth;
    PH1 = wrap.clientHeight;
    pipelineCanvas1.width = PW1;
    pipelineCanvas1.height = PH1;
    loopState.phase = 0;
    loopState.currentUser = 0;
    loopState.arrowProgress = 0;
    loopState.quality = 0.72;
    loopState.voteCount = 0;
    loopState.timer = 0;
    loopState.ripples = [];
    loopState.feedbackProgress = 0;
    document.getElementById('qualityBadge').textContent = '0.72';
    miniGraphNodes = [
      { x: 40, y: 75, r: 4, color: '#00d4ff' },
      { x: 100, y: 40, r: 3, color: '#a855f7' },
      { x: 160, y: 75, r: 4, color: '#f0c020' }
    ];
    miniGraphEdges = [[0, 1], [1, 2]];
    renderMiniGraph();
    cancelAnimationFrame(loopAnimFrame);
    drawLoopPipeline();
  }

  function renderMiniGraph() {
    var svg = document.getElementById('miniGraph');
    // Clear existing lines/circles except the background rect
    while (svg.childNodes.length > 1) {
      svg.removeChild(svg.lastChild);
    }
    for (var e = 0; e < miniGraphEdges.length; e++) {
      var n1 = miniGraphNodes[miniGraphEdges[e][0]];
      var n2 = miniGraphNodes[miniGraphEdges[e][1]];
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', n1.x);
      line.setAttribute('y1', n1.y);
      line.setAttribute('x2', n2.x);
      line.setAttribute('y2', n2.y);
      line.setAttribute('stroke', 'rgba(0,212,255,0.25)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    for (var n = 0; n < miniGraphNodes.length; n++) {
      var node = miniGraphNodes[n];
      var circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circ.setAttribute('cx', node.x);
      circ.setAttribute('cy', node.y);
      circ.setAttribute('r', node.r);
      circ.setAttribute('fill', node.color);
      svg.appendChild(circ);
    }
  }

  function addMiniGraphNode() {
    var newX = 30 + Math.random() * 140;
    var newY = 20 + Math.random() * 110;
    var colors = ['#00d4ff', '#a855f7', '#f0c020', '#10b981', '#3b82f6'];
    var newNode = { x: newX, y: newY, r: 3 + Math.random() * 2, color: colors[Math.floor(Math.random() * colors.length)] };
    miniGraphNodes.push(newNode);
    var newIdx = miniGraphNodes.length - 1;
    // Connect to 1-2 random existing nodes
    var connectTo = Math.min(2, miniGraphNodes.length - 1);
    for (var c = 0; c < connectTo; c++) {
      var target = Math.floor(Math.random() * (miniGraphNodes.length - 1));
      miniGraphEdges.push([newIdx, target]);
    }
    renderMiniGraph();
  }

  function drawLoopPipeline() {
    if (currentStage !== 1) return;
    pctx1.clearRect(0, 0, PW1, PH1);

    var userX = PW1 * 0.12;
    var aiX = PW1 * 0.65;
    var aiY = PH1 * 0.45;
    var aiW = PW1 * 0.13;
    var aiH = PH1 * 0.18;
    var kbX = PW1 * 0.12;
    var kbY = PH1 * 0.82;
    var kbW = PW1 * 0.12;
    var kbH = PH1 * 0.12;

    var cu = USERS[loopState.currentUser];
    var uY = PH1 * cu.y;

    // Draw KB box
    pctx1.save();
    pctx1.fillStyle = 'rgba(16, 185, 129, 0.1)';
    pctx1.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    pctx1.lineWidth = 1.5;
    pctx1.beginPath();
    pctx1.roundRect(kbX - kbW / 2, kbY - kbH / 2, kbW, kbH, 6);
    pctx1.fill();
    pctx1.stroke();
    pctx1.restore();
    pctx1.font = '9px JetBrains Mono, monospace';
    pctx1.fillStyle = 'rgba(16, 185, 129, 0.7)';
    pctx1.textAlign = 'center';
    pctx1.fillText('KB', kbX, kbY + 3);

    // Draw user icons
    for (var u = 0; u < USERS.length; u++) {
      drawUserIcon(pctx1, userX, PH1 * USERS[u].y, u === loopState.currentUser);
    }

    // Draw AI box
    drawRoundedBox(pctx1, aiX, aiY, aiW, aiH, 'AI Model', 'rgba(168, 85, 247, 0.12)', 'rgba(168, 85, 247, 0.4)', 'rgba(168, 85, 247, 0.8)');

    loopState.timer++;

    var cpxQ = (userX + aiX) / 2;
    var cpyQ = uY - 25;
    var cpxA = (userX + aiX) / 2;
    var cpyA = uY + 25;

    if (loopState.phase === 0) {
      if (loopState.timer > 30) {
        loopState.phase = 1;
        loopState.arrowProgress = 0;
        loopState.timer = 0;
      }
    }

    if (loopState.phase === 1) {
      loopState.arrowProgress = Math.min(1, loopState.arrowProgress + 0.03);
      drawBezierArrow(pctx1, loopState.arrowProgress, userX + 12, uY, cpxQ, cpyQ, aiX - aiW / 2 - 4, aiY, 'rgba(240, 192, 32, 0.7)');
      if (loopState.arrowProgress >= 1) {
        loopState.phase = 2;
        loopState.arrowProgress = 0;
        loopState.timer = 0;
      }
    }

    if (loopState.phase === 2) {
      // Keep question arrow faded
      drawBezierArrow(pctx1, 1, userX + 12, uY, cpxQ, cpyQ, aiX - aiW / 2 - 4, aiY, 'rgba(240, 192, 32, 0.2)');
      // Answer arrow
      loopState.arrowProgress = Math.min(1, loopState.arrowProgress + 0.03);
      drawBezierArrow(pctx1, loopState.arrowProgress, aiX - aiW / 2 - 4, aiY, cpxA, cpyA, userX + 12, uY, 'rgba(0, 212, 255, 0.7)');
      if (loopState.arrowProgress >= 1) {
        loopState.phase = 3; // Vote phase
        loopState.timer = 0;
        loopState.feedbackProgress = 0;
      }
    }

    if (loopState.phase === 3) {
      // Wait briefly, then auto-vote
      if (loopState.timer > 60) {
        loopState.phase = 4; // Feedback arrow phase
        loopState.feedbackProgress = 0;
        loopState.timer = 0;
        // Trigger ripple
        loopState.ripples.push({ x: userX, y: uY, r: 0, alpha: 0.8 });
        loopState.ripples.push({ x: userX, y: uY, r: 0, alpha: 0.6 });
        loopState.ripples.push({ x: userX, y: uY, r: 0, alpha: 0.4 });
        // Update quality
        loopState.voteCount++;
        loopState.quality = Math.min(0.95, loopState.quality + 0.02);
        animateValue(document.getElementById('qualityBadge'), loopState.quality - 0.02, loopState.quality, 500, 2);
        addMiniGraphNode();
      }
    }

    if (loopState.phase === 4) {
      // Feedback arrow: user to KB
      loopState.feedbackProgress = Math.min(1, loopState.feedbackProgress + 0.02);
      var fbProg = loopState.feedbackProgress;

      // Draw thin gold arrow from user to KB
      var fbCpx = userX - 20;
      var fbCpy = (uY + kbY) / 2;
      pctx1.beginPath();
      for (var fi = 0; fi <= 20; fi++) {
        var ft = (fi / 20) * fbProg;
        var fp = quadBezier(ft, userX, uY + 16, fbCpx, fbCpy, kbX, kbY - kbH / 2 - 4);
        if (fi === 0) pctx1.moveTo(fp.x, fp.y);
        else pctx1.lineTo(fp.x, fp.y);
      }
      pctx1.strokeStyle = 'rgba(240, 192, 32, 0.5)';
      pctx1.lineWidth = 1.5;
      pctx1.setLineDash([4, 4]);
      pctx1.stroke();
      pctx1.setLineDash([]);

      if (fbProg >= 1) {
        loopState.phase = 0;
        loopState.timer = 0;
        loopState.currentUser = (loopState.currentUser + 1) % 3;
      }
    }

    // Draw ripples
    for (var rp = loopState.ripples.length - 1; rp >= 0; rp--) {
      var ripple = loopState.ripples[rp];
      ripple.r += 1.5;
      ripple.alpha -= 0.015;
      if (ripple.alpha <= 0) {
        loopState.ripples.splice(rp, 1);
        continue;
      }
      pctx1.beginPath();
      pctx1.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
      pctx1.strokeStyle = 'rgba(0, 212, 255, ' + ripple.alpha + ')';
      pctx1.lineWidth = 1.5;
      pctx1.stroke();
    }

    loopAnimFrame = requestAnimationFrame(drawLoopPipeline);
  }

  // Vote buttons for Stage 1
  var voteUpBtn = document.getElementById('voteUpBtn');
  var voteDownBtn = document.getElementById('voteDownBtn');
  if (voteUpBtn) {
    voteUpBtn.addEventListener('click', function() {
      if (currentStage !== 1) return;
      loopState.voteCount++;
      loopState.quality = Math.min(0.95, loopState.quality + 0.02);
      animateValue(document.getElementById('qualityBadge'), loopState.quality - 0.02, loopState.quality, 500, 2);
      loopState.ripples.push({ x: PW1 * 0.12, y: PH1 * 0.5, r: 0, alpha: 0.8 });
      addMiniGraphNode();
      voteUpBtn.classList.add('voted');
      setTimeout(function() { voteUpBtn.classList.remove('voted'); }, 800);
    });
  }
  if (voteDownBtn) {
    voteDownBtn.addEventListener('click', function() {
      if (currentStage !== 1) return;
      loopState.quality = Math.max(0.50, loopState.quality - 0.01);
      animateValue(document.getElementById('qualityBadge'), loopState.quality + 0.01, loopState.quality, 500, 2);
      voteDownBtn.classList.add('voted');
      setTimeout(function() { voteDownBtn.classList.remove('voted'); }, 800);
    });
  }


  // =====================================================================
  // 5. STAGE 2 — TRANSFER LEARNING
  // =====================================================================

  var transferSvg = document.getElementById('transferSvg');
  var transferAnimTimer = null;

  function initTransfer() {
    if (!transferSvg) return;
    clearInterval(transferAnimTimer);
    // Clear previous content (keep defs)
    var defs = transferSvg.querySelector('defs');
    transferSvg.textContent = '';
    if (defs) transferSvg.appendChild(defs);

    // Source domain
    var srcGroup = createSvgEl('g');
    var srcCircle = createSvgEl('circle', { cx: 120, cy: 150, r: 70, fill: 'rgba(0,212,255,0.08)', stroke: 'rgba(0,212,255,0.4)', 'stroke-width': 2 });
    srcGroup.appendChild(srcCircle);
    var srcLabel = createSvgEl('text', { x: 120, y: 155, 'text-anchor': 'middle', fill: '#00d4ff', 'font-size': '12', 'font-family': 'JetBrains Mono, monospace' });
    srcLabel.textContent = 'Vector Databases';
    srcGroup.appendChild(srcLabel);
    // Inner dots
    for (var sd = 0; sd < 8; sd++) {
      var sAngle = (sd / 8) * Math.PI * 2;
      var sR = 25 + Math.random() * 25;
      var sDot = createSvgEl('circle', {
        cx: 120 + Math.cos(sAngle) * sR,
        cy: 150 + Math.sin(sAngle) * sR,
        r: 3,
        fill: '#00d4ff',
        opacity: '0.5'
      });
      srcGroup.appendChild(sDot);
    }
    transferSvg.appendChild(srcGroup);

    // Target domain
    var tgtGroup = createSvgEl('g');
    var tgtCircle = createSvgEl('circle', { cx: 480, cy: 150, r: 70, fill: 'rgba(168,85,247,0.08)', stroke: 'rgba(168,85,247,0.4)', 'stroke-width': 2 });
    tgtGroup.appendChild(tgtCircle);
    var tgtLabel = createSvgEl('text', { x: 480, y: 155, 'text-anchor': 'middle', fill: '#a855f7', 'font-size': '12', 'font-family': 'JetBrains Mono, monospace' });
    tgtLabel.textContent = 'Search Algorithms';
    tgtGroup.appendChild(tgtLabel);
    // Inner dots (start dim)
    for (var td = 0; td < 8; td++) {
      var tAngle = (td / 8) * Math.PI * 2;
      var tR = 25 + Math.random() * 25;
      var tDot = createSvgEl('circle', {
        cx: 480 + Math.cos(tAngle) * tR,
        cy: 150 + Math.sin(tAngle) * tR,
        r: 3,
        fill: '#a855f7',
        opacity: '0.2',
        class: 'target-dot'
      });
      tgtGroup.appendChild(tDot);
    }
    transferSvg.appendChild(tgtGroup);

    // Bridge path
    var bridgePath = createSvgEl('path', {
      d: 'M 190 150 C 270 100, 370 100, 410 150',
      fill: 'none',
      stroke: 'rgba(240,192,32,0.5)',
      'stroke-width': '2',
      'stroke-dasharray': '400',
      'stroke-dashoffset': '400',
      id: 'bridgePath'
    });
    transferSvg.appendChild(bridgePath);

    // Query text
    var queryText = createSvgEl('text', {
      x: 300, y: 260,
      'text-anchor': 'middle',
      fill: 'rgba(136,146,164,0.7)',
      'font-size': '11',
      'font-family': 'JetBrains Mono, monospace',
      id: 'transferQuery'
    });
    queryText.textContent = '';
    transferSvg.appendChild(queryText);

    // Update metrics to zero
    document.getElementById('transferConf').textContent = '0.00';
    document.getElementById('transferDamp').textContent = '0.00';

    // Animate
    animateTransfer();
  }

  function createSvgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs.hasOwnProperty(k)) {
          el.setAttribute(k, attrs[k]);
        }
      }
    }
    return el;
  }

  function animateTransfer() {
    var queryStr = '"How does approximate nearest neighbor search compare to KD-trees?"';
    var queryEl = document.getElementById('transferQuery');
    var bridgeEl = document.getElementById('bridgePath');
    if (!queryEl || !bridgeEl) return;

    // Phase 1: Typewriter query
    var charIdx = 0;
    var typeTimer = setInterval(function() {
      if (currentStage !== 2) { clearInterval(typeTimer); return; }
      charIdx++;
      queryEl.textContent = queryStr.substring(0, charIdx);
      if (charIdx >= queryStr.length) {
        clearInterval(typeTimer);
        // Phase 2: Source domain highlights
        setTimeout(function() {
          var src = transferSvg.querySelector('circle[cx="120"]');
          if (src) {
            src.setAttribute('stroke-width', '3');
            src.setAttribute('filter', 'url(#glowTransfer)');
          }
          // Phase 3: Bridge draws
          setTimeout(function() { animateBridge(bridgeEl); }, 600);
        }, 400);
      }
    }, 30);
  }

  function animateBridge(bridgeEl) {
    if (!bridgeEl) return;
    var totalLen = 400;
    var offset = totalLen;
    var bridgeTimer = setInterval(function() {
      if (currentStage !== 2) { clearInterval(bridgeTimer); return; }
      offset -= 8;
      if (offset < 0) offset = 0;
      bridgeEl.setAttribute('stroke-dashoffset', String(offset));
      if (offset <= 0) {
        clearInterval(bridgeTimer);
        // Phase 4: Knowledge particles flow along path
        spawnTransferParticles();
      }
    }, 30);
  }

  function spawnTransferParticles() {
    var bridgeEl = document.getElementById('bridgePath');
    if (!bridgeEl) return;
    var pathLen = 400; // approximate
    var pCount = 8;
    var spawned = 0;

    var spawnTimer = setInterval(function() {
      if (currentStage !== 2 || spawned >= pCount) { clearInterval(spawnTimer); return; }
      var dot = createSvgEl('circle', {
        r: '4',
        fill: '#f0c020',
        opacity: '0.9',
        filter: 'url(#glowTransfer)'
      });
      transferSvg.appendChild(dot);

      var dist = 0;
      var speed = 3 + Math.random() * 2;
      var moveTimer = setInterval(function() {
        if (currentStage !== 2) { clearInterval(moveTimer); return; }
        dist += speed;
        var t = Math.min(dist / pathLen, 1);
        // Cubic bezier: M 190 150 C 270 100, 370 100, 410 150
        var mt = 1 - t;
        var px = mt * mt * mt * 190 + 3 * mt * mt * t * 270 + 3 * mt * t * t * 370 + t * t * t * 410;
        var py = mt * mt * mt * 150 + 3 * mt * mt * t * 100 + 3 * mt * t * t * 100 + t * t * t * 150;
        dot.setAttribute('cx', px);
        dot.setAttribute('cy', py);

        if (t >= 1) {
          clearInterval(moveTimer);
          dot.setAttribute('opacity', '0');
          setTimeout(function() {
            if (dot.parentNode) dot.parentNode.removeChild(dot);
          }, 300);
          // Brighten target dots
          var tDots = transferSvg.querySelectorAll('.target-dot');
          for (var d = 0; d < tDots.length; d++) {
            var curOp = parseFloat(tDots[d].getAttribute('opacity') || '0.2');
            tDots[d].setAttribute('opacity', String(Math.min(1, curOp + 0.1)));
          }
        }
      }, 30);

      spawned++;
    }, 250);

    // Update metrics after particles finish
    setTimeout(function() {
      animateValue(document.getElementById('transferConf'), 0, 0.82, 1000, 2);
      animateValue(document.getElementById('transferDamp'), 0, 0.15, 1000, 2);
    }, pCount * 250 + 500);
  }


  // =====================================================================
  // 6. STAGE 3 — DRIFT DETECTION
  // =====================================================================

  var driftProgress = 0;
  var driftTimer = null;
  var driftNodes = [];

  function initDrift() {
    clearInterval(driftTimer);
    driftProgress = 0;
    driftNodes = [];

    var driftSvg = document.getElementById('driftCluster');
    if (!driftSvg) return;

    // Clear (keep defs)
    var defs = driftSvg.querySelector('defs');
    driftSvg.textContent = '';
    if (defs) driftSvg.appendChild(defs);

    // Create 20 nodes in a cluster
    var cx = 200, cy = 150;
    for (var i = 0; i < 20; i++) {
      var angle = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var dist = 40 + Math.random() * 70;
      var nx = cx + Math.cos(angle) * dist;
      var ny = cy + Math.sin(angle) * dist;
      var nodeData = { x: nx, y: ny, originalHue: 180, currentHue: 180, drifts: i < 5 };
      driftNodes.push(nodeData);

      var circle = createSvgEl('circle', {
        cx: nx, cy: ny, r: 6,
        fill: 'hsl(180, 80%, 55%)',
        opacity: '0.8',
        id: 'driftNode' + i
      });
      driftSvg.appendChild(circle);
    }

    // Connections
    for (var e = 0; e < 30; e++) {
      var a = Math.floor(Math.random() * 20);
      var b = Math.floor(Math.random() * 20);
      if (a !== b) {
        var line = createSvgEl('line', {
          x1: driftNodes[a].x, y1: driftNodes[a].y,
          x2: driftNodes[b].x, y2: driftNodes[b].y,
          stroke: 'rgba(0,212,255,0.15)',
          'stroke-width': '1'
        });
        driftSvg.appendChild(line);
      }
    }

    // Reset timeline
    document.getElementById('timelineProgress').style.width = '0';
    document.getElementById('timelineScrubber').style.left = '0';
    document.getElementById('cvMetric').textContent = '0.05';

    // Start animation
    driftTimer = setInterval(function() {
      if (currentStage !== 3) { clearInterval(driftTimer); return; }
      driftProgress = Math.min(1, driftProgress + 0.004);

      // Update timeline
      document.getElementById('timelineProgress').style.width = (driftProgress * 100) + '%';
      document.getElementById('timelineScrubber').style.left = 'calc(' + (driftProgress * 100) + '% - 8px)';

      // At 40%: drift nodes start shifting hue
      if (driftProgress > 0.4) {
        var hueShift = Math.min(1, (driftProgress - 0.4) * 3);
        for (var d = 0; d < 5; d++) {
          var newHue = 180 - hueShift * 150; // 180 (cyan) -> 30 (orange)
          driftNodes[d].currentHue = newHue;
          var nodeEl = document.getElementById('driftNode' + d);
          if (nodeEl) {
            nodeEl.setAttribute('fill', 'hsl(' + Math.round(newHue) + ', 80%, 55%)');
          }
        }
      }

      // At 60%: radar pulse
      if (driftProgress > 0.59 && driftProgress < 0.62) {
        var driftSvg2 = document.getElementById('driftCluster');
        for (var rp = 0; rp < 3; rp++) {
          (function(delay) {
            setTimeout(function() {
              if (currentStage !== 3) return;
              var pulse = createSvgEl('circle', {
                cx: 200, cy: 150, r: 10,
                fill: 'none',
                stroke: 'rgba(239,68,68,0.6)',
                'stroke-width': '2',
                filter: 'url(#radarGlow)'
              });
              driftSvg2.appendChild(pulse);
              var pulseR = 10;
              var pulseAlpha = 0.6;
              var pulseTimer = setInterval(function() {
                pulseR += 3;
                pulseAlpha -= 0.015;
                if (pulseAlpha <= 0) {
                  clearInterval(pulseTimer);
                  if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
                  return;
                }
                pulse.setAttribute('r', pulseR);
                pulse.setAttribute('stroke', 'rgba(239,68,68,' + pulseAlpha + ')');
              }, 30);
            }, delay * 400);
          })(rp);
        }
      }

      // At 70%: warning badges on drifted nodes
      if (driftProgress > 0.69 && driftProgress < 0.72) {
        for (var w = 0; w < 5; w++) {
          var wNode = driftNodes[w];
          var existing = document.getElementById('warning' + w);
          if (!existing) {
            var driftSvg3 = document.getElementById('driftCluster');
            var warn = createSvgEl('text', {
              x: wNode.x + 10, y: wNode.y - 10,
              fill: '#ef4444',
              'font-size': '14',
              'font-weight': 'bold',
              id: 'warning' + w
            });
            warn.textContent = '!';
            driftSvg3.appendChild(warn);
          }
        }
      }

      // At 85%: swap drifted nodes
      if (driftProgress > 0.84 && driftProgress < 0.87) {
        for (var sw = 0; sw < 5; sw++) {
          var swEl = document.getElementById('driftNode' + sw);
          var warnEl = document.getElementById('warning' + sw);
          if (swEl) {
            swEl.setAttribute('opacity', '0.2');
            swEl.setAttribute('fill', 'hsl(180, 80%, 55%)');
            // After a moment, revive as fresh
            (function(el, idx) {
              setTimeout(function() {
                if (currentStage !== 3) return;
                el.setAttribute('opacity', '0.9');
                el.setAttribute('fill', 'hsl(180, 80%, 60%)');
                driftNodes[idx].currentHue = 180;
              }, 600);
            })(swEl, sw);
          }
          if (warnEl && warnEl.parentNode) {
            warnEl.parentNode.removeChild(warnEl);
          }
        }
      }

      // CV metric
      var cvVal = 0.05;
      if (driftProgress > 0.4 && driftProgress <= 0.7) {
        cvVal = 0.05 + (driftProgress - 0.4) * 1.1;
      } else if (driftProgress > 0.7 && driftProgress <= 0.85) {
        cvVal = 0.38;
      } else if (driftProgress > 0.85) {
        cvVal = 0.38 - (driftProgress - 0.85) * 1.7;
        if (cvVal < 0.12) cvVal = 0.12;
      }
      document.getElementById('cvMetric').textContent = cvVal.toFixed(2);

      if (driftProgress >= 1) {
        clearInterval(driftTimer);
      }
    }, 30);
  }


  // =====================================================================
  // 7. STAGE 4 — FLYWHEEL
  // =====================================================================

  var flywheelSvg = document.getElementById('flywheelSvg');
  var flywheelTimer = null;
  var flywheelAngle = 0;
  var flywheelCycle = 0;
  var flywheelSpeed = 0.015; // radians per tick
  var flywheelSpeedMult = 1;
  var flywheelCenterNodes = [];
  var flywheelCenterEdges = [];
  var flywheelSuccessShown = false;

  var STATIONS = [
    { label: 'Question', angle: -Math.PI / 2, color: '#00d4ff' },
    { label: 'Search',   angle: -Math.PI / 2 + Math.PI * 2 / 5, color: '#f0c020' },
    { label: 'Answer',   angle: -Math.PI / 2 + Math.PI * 4 / 5, color: '#10b981' },
    { label: 'Vote',     angle: -Math.PI / 2 + Math.PI * 6 / 5, color: '#a855f7' },
    { label: 'Improve',  angle: -Math.PI / 2 + Math.PI * 8 / 5, color: '#3b82f6' }
  ];

  function initFlywheel() {
    if (!flywheelSvg) return;
    clearInterval(flywheelTimer);
    flywheelAngle = -Math.PI / 2;
    flywheelCycle = 0;
    flywheelSpeed = 0.015;
    flywheelSpeedMult = 1;
    flywheelCenterNodes = [];
    flywheelCenterEdges = [];
    flywheelSuccessShown = false;

    // Clear SVG
    flywheelSvg.textContent = '';

    var fwCx = 250, fwCy = 250, fwR = 160;

    // Draw circular track
    var track = createSvgEl('circle', {
      cx: fwCx, cy: fwCy, r: fwR,
      fill: 'none',
      stroke: 'rgba(42,42,58,0.6)',
      'stroke-width': '2',
      'stroke-dasharray': '8 4'
    });
    flywheelSvg.appendChild(track);

    // Station dots + labels
    for (var s = 0; s < STATIONS.length; s++) {
      var st = STATIONS[s];
      var sx = fwCx + Math.cos(st.angle) * fwR;
      var sy = fwCy + Math.sin(st.angle) * fwR;

      var stationCircle = createSvgEl('circle', {
        cx: sx, cy: sy, r: 10,
        fill: st.color,
        opacity: '0.3',
        id: 'station' + s
      });
      flywheelSvg.appendChild(stationCircle);

      // Label
      var labelX = fwCx + Math.cos(st.angle) * (fwR + 28);
      var labelY = fwCy + Math.sin(st.angle) * (fwR + 28);
      var stLabel = createSvgEl('text', {
        x: labelX, y: labelY + 4,
        'text-anchor': 'middle',
        fill: st.color,
        'font-size': '10',
        'font-family': 'JetBrains Mono, monospace',
        opacity: '0.7'
      });
      stLabel.textContent = st.label;
      flywheelSvg.appendChild(stLabel);
    }

    // Center mini-graph group
    var centerGroup = createSvgEl('g', { id: 'fwCenter' });
    flywheelSvg.appendChild(centerGroup);

    // Traveling dot
    var traveler = createSvgEl('circle', {
      cx: fwCx + Math.cos(-Math.PI / 2) * fwR,
      cy: fwCy + Math.sin(-Math.PI / 2) * fwR,
      r: 7,
      fill: '#f0c020',
      id: 'fwTraveler'
    });
    flywheelSvg.appendChild(traveler);

    // Glow behind traveler
    var travGlow = createSvgEl('circle', {
      cx: fwCx + Math.cos(-Math.PI / 2) * fwR,
      cy: fwCy + Math.sin(-Math.PI / 2) * fwR,
      r: 14,
      fill: 'rgba(240,192,32,0.2)',
      id: 'fwTravGlow'
    });
    flywheelSvg.insertBefore(travGlow, traveler);

    // Reset metric displays
    document.getElementById('fwQuestions').textContent = '12';
    document.getElementById('fwQuality').textContent = '0.71';
    document.getElementById('fwContrib').textContent = '58';
    document.getElementById('fwDrift').textContent = '3';

    // Start animation
    var lastStationIdx = -1;

    flywheelTimer = setInterval(function() {
      if (currentStage !== 4) { clearInterval(flywheelTimer); return; }

      flywheelAngle += flywheelSpeed * flywheelSpeedMult;

      // Normalize to [0, 2*PI)
      var normAngle = ((flywheelAngle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

      // Check which station we're near
      for (var si = 0; si < STATIONS.length; si++) {
        var stAngle = ((STATIONS[si].angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        var diff = Math.abs(normAngle - stAngle);
        if (diff < 0.15 || diff > Math.PI * 2 - 0.15) {
          if (lastStationIdx !== si) {
            lastStationIdx = si;
            // Light up station
            pulseStation(si);
          }
        }
      }

      // Check for cycle completion
      if (normAngle < 0.3 && flywheelAngle > Math.PI) {
        flywheelCycle++;
        // Accelerate
        if (flywheelCycle === 1) flywheelSpeedMult = 1.33;
        else if (flywheelCycle === 2) flywheelSpeedMult = 2;
        else if (flywheelCycle >= 3) flywheelSpeedMult = 2.67;

        // Update metrics
        var qPerDay = 12 + flywheelCycle * 12;
        var qual = 0.71 + flywheelCycle * 0.02;
        var contrib = 58 + flywheelCycle;
        var driftAlerts = Math.max(0, 3 - flywheelCycle);
        document.getElementById('fwQuestions').textContent = String(qPerDay);
        document.getElementById('fwQuality').textContent = qual.toFixed(2);
        document.getElementById('fwContrib').textContent = String(contrib);
        document.getElementById('fwDrift').textContent = String(driftAlerts);

        // Add center graph node
        addFlywheelCenterNode();

        // Success state after 5 cycles
        if (flywheelCycle >= 5 && !flywheelSuccessShown) {
          flywheelSuccessShown = true;
          for (var ss = 0; ss < STATIONS.length; ss++) {
            var stEl = document.getElementById('station' + ss);
            if (stEl) {
              stEl.setAttribute('opacity', '0.9');
              stEl.setAttribute('r', '14');
            }
          }
        }
      }

      // Update traveler position
      var fwCx2 = 250, fwCy2 = 250, fwR2 = 160;
      var tx = fwCx2 + Math.cos(flywheelAngle) * fwR2;
      var ty = fwCy2 + Math.sin(flywheelAngle) * fwR2;
      var travelerEl = document.getElementById('fwTraveler');
      var travGlowEl = document.getElementById('fwTravGlow');
      if (travelerEl) {
        travelerEl.setAttribute('cx', tx);
        travelerEl.setAttribute('cy', ty);
      }
      if (travGlowEl) {
        travGlowEl.setAttribute('cx', tx);
        travGlowEl.setAttribute('cy', ty);
      }
    }, 30);
  }

  function pulseStation(idx) {
    var stEl = document.getElementById('station' + idx);
    if (!stEl) return;
    stEl.setAttribute('opacity', '0.9');
    stEl.setAttribute('r', '14');
    setTimeout(function() {
      if (flywheelSuccessShown) return;
      stEl.setAttribute('opacity', '0.3');
      stEl.setAttribute('r', '10');
    }, 400);
  }

  function addFlywheelCenterNode() {
    var cx = 250, cy = 250;
    var maxR = 50;
    var newX = cx + (Math.random() - 0.5) * maxR * 2;
    var newY = cy + (Math.random() - 0.5) * maxR * 2;
    var colors = ['#00d4ff', '#a855f7', '#f0c020', '#10b981', '#3b82f6'];
    var newNode = { x: newX, y: newY, color: colors[Math.floor(Math.random() * colors.length)] };
    flywheelCenterNodes.push(newNode);

    var centerGroup = document.getElementById('fwCenter');
    if (!centerGroup) return;

    // Connect to 1-2 existing nodes
    if (flywheelCenterNodes.length > 1) {
      var connectCount = Math.min(2, flywheelCenterNodes.length - 1);
      for (var c = 0; c < connectCount; c++) {
        var targetIdx = Math.floor(Math.random() * (flywheelCenterNodes.length - 1));
        var target = flywheelCenterNodes[targetIdx];
        var edge = createSvgEl('line', {
          x1: newX, y1: newY,
          x2: target.x, y2: target.y,
          stroke: 'rgba(0,212,255,0.2)',
          'stroke-width': '1'
        });
        centerGroup.appendChild(edge);
      }
    }

    // Add node dot
    var dot = createSvgEl('circle', {
      cx: newX, cy: newY, r: 3,
      fill: newNode.color,
      opacity: '0.7'
    });
    centerGroup.appendChild(dot);
  }


  // =====================================================================
  // 8. STAGE 5 — LIVE API + SHARE
  // =====================================================================

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
  var shareContribCount = 965;

  function initPiBrainLive() {
    var piSearch = document.getElementById('piSearch');
    document.getElementById('piResults').textContent = '';
    document.getElementById('piLatency').classList.remove('visible');
    document.getElementById('piLatency').textContent = '';
    document.getElementById('participationBadge').classList.remove('visible');
    document.getElementById('contributionCounter').classList.remove('visible');

    piSearch.oninput = function() {
      clearTimeout(piSearchDebounce);
      piSearchDebounce = setTimeout(function() {
        searchPiBrain(piSearch.value);
      }, 200);
    };

    // Fetch live stats
    try {
      fetch('https://pi.ruv.io/v1/status')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.memories) {
            shareContribCount = data.memories;
            piSearch.placeholder = 'Search ' + data.memories.toLocaleString() + ' collective memories...';
          }
        })
        .catch(function() { /* use default */ });
    } catch (ignore) { /* */ }

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
      }).catch(function() { /* optimistic UI */ });
    } catch (ignore) { /* */ }
  }

  // Share form
  var shareSubmitBtn = document.getElementById('shareSubmitBtn');
  if (shareSubmitBtn) {
    shareSubmitBtn.addEventListener('click', function() {
      shareToBrain();
    });
  }

  function shareToBrain() {
    var title = document.getElementById('shareTitle').value.trim();
    var content = document.getElementById('shareContent').value.trim();
    var category = document.getElementById('shareCategory').value;

    if (!title || !content) {
      document.getElementById('shareTitle').style.borderColor = title ? 'var(--border)' : 'var(--red)';
      document.getElementById('shareContent').style.borderColor = content ? 'var(--border)' : 'var(--red)';
      return;
    }

    document.getElementById('shareTitle').style.borderColor = 'var(--border)';
    document.getElementById('shareContent').style.borderColor = 'var(--border)';

    shareSubmitBtn.textContent = 'Sharing...';
    shareSubmitBtn.style.opacity = '0.6';

    var body = JSON.stringify({
      title: title,
      content: content,
      category: category,
      tags: [category]
    });

    fetch('https://pi.ruv.io/v1/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    })
      .then(function(r) {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(function() {
        onShareSuccess();
      })
      .catch(function() {
        // Try proxy
        fetch('/api/pi/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body
        })
          .then(function(r) {
            if (!r.ok) throw new Error('proxy fail');
            return r.json();
          })
          .then(function() { onShareSuccess(); })
          .catch(function() {
            // Simulated success for demo
            onShareSuccess();
          });
      });
  }

  function onShareSuccess() {
    shareContribCount++;
    shareSubmitBtn.textContent = 'Share with the Brain';
    shareSubmitBtn.style.opacity = '1';

    // Clear form
    document.getElementById('shareTitle').value = '';
    document.getElementById('shareContent').value = '';

    // Show counter
    var counterEl = document.getElementById('contributionCounter');
    counterEl.textContent = 'Your contribution #' + shareContribCount;
    counterEl.classList.add('visible');

    // Show badge
    var badge = document.getElementById('participationBadge');
    badge.textContent = 'Knowledge shared with the collective brain';
    badge.classList.add('visible');

    // Celebration particles
    spawnCelebration();
  }

  function spawnCelebration() {
    var celCanvas = document.getElementById('celebrationCanvas');
    if (!celCanvas) return;
    celCanvas.width = window.innerWidth;
    celCanvas.height = window.innerHeight;
    var celCtx = celCanvas.getContext('2d');

    // Get button position
    var btnRect = shareSubmitBtn.getBoundingClientRect();
    var originX = btnRect.left + btnRect.width / 2;
    var originY = btnRect.top + btnRect.height / 2;

    var celParticles = [];
    for (var cp = 0; cp < 30; cp++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 3 + Math.random() * 5;
      var isGold = Math.random() > 0.5;
      celParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        r: 2 + Math.random() * 3,
        alpha: 1,
        color: isGold ? [240, 192, 32] : [0, 212, 255]
      });
    }

    var celStart = performance.now();
    function drawCelebration() {
      var elapsed = performance.now() - celStart;
      if (elapsed > 1500) {
        celCtx.clearRect(0, 0, celCanvas.width, celCanvas.height);
        return;
      }
      celCtx.clearRect(0, 0, celCanvas.width, celCanvas.height);

      for (var i = 0; i < celParticles.length; i++) {
        var p = celParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.alpha -= 0.012;
        if (p.alpha <= 0) continue;

        // Glow
        celCtx.beginPath();
        celCtx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        celCtx.fillStyle = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + (p.alpha * 0.2) + ')';
        celCtx.fill();

        // Core
        celCtx.beginPath();
        celCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        celCtx.fillStyle = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + p.alpha + ')';
        celCtx.fill();
      }

      requestAnimationFrame(drawCelebration);
    }
    requestAnimationFrame(drawCelebration);
  }


  // =====================================================================
  // 9. CONTROLS & INIT
  // =====================================================================

  function triggerStageEffects(n) {
    // Cancel ongoing animations from other stages
    cancelAnimationFrame(deadEndAnimFrame);
    cancelAnimationFrame(loopAnimFrame);
    clearInterval(driftTimer);
    clearInterval(flywheelTimer);

    if (n === 0) {
      initPipeline();
    }
    if (n === 1) {
      initLoopPipeline();
    }
    if (n === 2) {
      initTransfer();
    }
    if (n === 3) {
      initDrift();
    }
    if (n === 4) {
      initFlywheel();
    }
    if (n === 5) {
      initPiBrainLive();
      // Expand particles after a moment
      setTimeout(function() {
        if (currentStage !== 5) return;
        for (var i = 0; i < particles.length; i++) {
          var angle = Math.random() * Math.PI * 2;
          var dist = 50 + Math.random() * Math.min(W, H) * 0.3;
          particles[i].tx = W / 2 + Math.cos(angle) * dist;
          particles[i].ty = H / 2 + Math.sin(angle) * dist;
        }
      }, 2000);
    }
  }

  prevBtn.addEventListener('click', function() {
    goToStage(currentStage - 1);
  });

  nextBtn.addEventListener('click', function() {
    if (currentStage === TOTAL_STAGES - 1) goToStage(0);
    else goToStage(currentStage + 1);
  });

  // Dot click handlers
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
    if (pipelineCanvas && currentStage === 0) {
      var wrap0 = pipelineCanvas.parentElement;
      PW = wrap0.clientWidth;
      PH = wrap0.clientHeight;
      pipelineCanvas.width = PW;
      pipelineCanvas.height = PH;
    }
    if (pipelineCanvas1 && currentStage === 1) {
      var wrap1 = pipelineCanvas1.parentElement;
      PW1 = wrap1.clientWidth;
      PH1 = wrap1.clientHeight;
      pipelineCanvas1.width = PW1;
      pipelineCanvas1.height = PH1;
    }
  });

  // --- INIT ---
  resize();
  initParticles();
  setStageTargets(0);
  drawParticles();
  triggerStageEffects(0);

})();
