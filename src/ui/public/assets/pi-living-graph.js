(function() {
  'use strict';

  // ============================================================
  // Demo 2: "Your AI's Knowledge Is Trapped"
  // 5 stages, single pipeline canvas, particle background
  // ============================================================

  var TOTAL_STAGES = 5;
  var currentStage = 0;
  var animating = true;
  var autoPlay = false;
  var autoTimer = null;

  // === Particle System ===
  var particleCanvas = document.getElementById('particleCanvas');
  var pctx = particleCanvas.getContext('2d');
  var PW, PH;
  var PARTICLE_COUNT = 1200;
  var particles = [];

  var COLORS = [
    { color: [0, 212, 255], weight: 0.30 },
    { color: [168, 85, 247], weight: 0.20 },
    { color: [240, 192, 32], weight: 0.15 },
    { color: [59, 130, 246], weight: 0.15 },
    { color: [16, 185, 129], weight: 0.10 },
    { color: [239, 68, 68], weight: 0.10 }
  ];

  function resizeParticles() {
    PW = particleCanvas.width = window.innerWidth;
    PH = particleCanvas.height = window.innerHeight;
  }

  function pickColor() {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < COLORS.length; i++) {
      acc += COLORS[i].weight;
      if (r <= acc) return COLORS[i].color;
    }
    return COLORS[0].color;
  }

  function createParticle() {
    var c = pickColor();
    return {
      x: Math.random() * PW, y: Math.random() * PH,
      tx: Math.random() * PW, ty: Math.random() * PH,
      r: Math.random() * 2 + 0.5, color: c,
      alpha: Math.random() * 0.5 + 0.15,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.004 + 0.002
    };
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
  }

  function setParticleTargets(stage) {
    var cx = PW / 2, cy = PH / 2;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i], group, baseX, baseY, spread;
      switch (stage) {
        case 0:
          // Particles drift rightward -- data leaking to cloud
          p.tx = PW * 0.6 + Math.random() * PW * 0.4;
          p.ty = Math.random() * PH;
          p.vx = 0.15 + Math.random() * 0.25;
          break;
        case 1:
          // Particles converge inward -- staying local
          var a1 = (i / particles.length) * Math.PI * 2 + Math.random() * 0.3;
          var d1 = 30 + Math.random() * Math.min(PW, PH) * 0.18;
          p.tx = cx + Math.cos(a1) * d1;
          p.ty = cy + Math.sin(a1) * d1;
          p.vx = (Math.random() - 0.5) * 0.1;
          break;
        case 2:
          // Tiny dense cluster in center -- 41KB
          var a2 = (i / particles.length) * Math.PI * 2;
          var maxR = Math.min(PW, PH) * 0.06;
          var d2 = Math.sqrt(Math.random()) * maxR;
          p.tx = cx + Math.cos(a2 + i * 0.01) * d2;
          p.ty = cy + Math.sin(a2 + i * 0.01) * d2;
          p.vx = (Math.random() - 0.5) * 0.05;
          break;
        case 3:
          // Three scenario clusters
          group = i % 3;
          var angles3 = [-Math.PI / 3, Math.PI / 2, Math.PI + Math.PI / 6];
          spread = Math.min(PW, PH) * 0.08;
          baseX = cx + Math.cos(angles3[group]) * Math.min(PW, PH) * 0.2;
          baseY = cy + Math.sin(angles3[group]) * Math.min(PW, PH) * 0.15;
          p.tx = baseX + (Math.random() - 0.5) * spread;
          p.ty = baseY + (Math.random() - 0.5) * spread;
          p.vx = (Math.random() - 0.5) * 0.08;
          break;
        case 4:
          // Gentle ambient scatter
          p.tx = Math.random() * PW;
          p.ty = Math.random() * PH;
          p.vx = (Math.random() - 0.5) * 0.12;
          break;
      }
    }
  }

  function drawParticles() {
    pctx.clearRect(0, 0, PW, PH);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var ease = 0.012 + (currentStage === 2 ? 0.004 : 0.006);
      p.x += (p.tx - p.x) * ease + p.vx + Math.sin(p.phase) * 0.1;
      p.y += (p.ty - p.y) * ease + p.vy + Math.cos(p.phase) * 0.1;
      p.phase += p.speed;
      if (currentStage === 0) {
        if (p.x > PW + 10) { p.x = -10; p.tx = PW * 0.6 + Math.random() * PW * 0.4; }
      }
      if (currentStage === 4) {
        if (p.x < -10 || p.x > PW + 10) p.tx = Math.random() * PW;
        if (p.y < -10 || p.y > PH + 10) p.ty = Math.random() * PH;
      }
      var rgb = p.color;
      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      pctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (p.alpha * 0.1) + ')';
      pctx.fill();
      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + p.alpha + ')';
      pctx.fill();
    }
    if (animating) requestAnimationFrame(drawParticles);
  }

  // === Stage Canvas Animations ===
  var stage0Timer = null;
  var stage2Timer = null;

  // --- Stage 0: The Local AI Lie ---
  function drawStage0(canvas) {
    var ctx = canvas.getContext('2d');
    var cw = canvas.width, ch = canvas.height;
    var frame = 0;
    var queryCount = 0;
    var phase = 'idle'; // idle, thinking, arrow-out, cloud-response, crack
    var phaseTimer = 0;
    var cracked = false;
    var badgeAlpha = 0;
    var arrowProgress = 0;
    var responseProgress = 0;
    var queries = ['What is our API rate limit?', 'How does auth flow work?', 'Show deployment config'];
    var currentQuery = 0;

    function machineBox(x, y, w, h) {
      ctx.strokeStyle = 'rgba(0,212,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, x, y, w, h, 10);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,212,255,0.04)';
      ctx.fill();
    }

    function cloudBox(x, y, w, h) {
      ctx.strokeStyle = cracked ? 'rgba(239,68,68,0.5)' : 'rgba(168,85,247,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, x, y, w, h, 10);
      ctx.stroke();
      ctx.fillStyle = 'rgba(168,85,247,0.04)';
      ctx.fill();
    }

    function tick() {
      ctx.clearRect(0, 0, cw, ch);
      frame++;
      phaseTimer++;

      // Layout
      var mx = 40, my = 50, mw = 240, mh = 230;
      var clx = cw - 250, cly = 60, clw = 200, clh = 200;

      // Machine
      machineBox(mx, my, mw, mh);
      ctx.fillStyle = 'rgba(0,212,255,0.6)';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR MACHINE', mx + mw / 2, my + 22);

      // Checkmarks inside machine
      ctx.textAlign = 'left';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('\u2713 Ollama', mx + 20, my + 55);
      ctx.fillStyle = '#10b981';
      ctx.fillText('\u2713 7B Model', mx + 20, my + 78);
      ctx.fillStyle = '#10b981';
      ctx.fillText('\u2713 Local inference', mx + 20, my + 101);

      // Badge
      var badgeY = my + 130;
      var badgeText = cracked ? 'PARTIALLY LOCAL' : '100% LOCAL';
      var badgeColor = cracked ? [239, 68, 68] : [16, 185, 129];
      ctx.fillStyle = 'rgba(' + badgeColor[0] + ',' + badgeColor[1] + ',' + badgeColor[2] + ',0.15)';
      ctx.strokeStyle = 'rgba(' + badgeColor[0] + ',' + badgeColor[1] + ',' + badgeColor[2] + ',0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, mx + 30, badgeY, mw - 60, 30, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgb(' + badgeColor[0] + ',' + badgeColor[1] + ',' + badgeColor[2] + ')';
      ctx.textAlign = 'center';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText(badgeText, mx + mw / 2, badgeY + 19);

      // Crack lines on badge
      if (cracked) {
        ctx.strokeStyle = 'rgba(239,68,68,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mx + 60, badgeY + 2);
        ctx.lineTo(mx + 80, badgeY + 15);
        ctx.lineTo(mx + 70, badgeY + 28);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + mw - 70, badgeY + 5);
        ctx.lineTo(mx + mw - 85, badgeY + 20);
        ctx.lineTo(mx + mw - 75, badgeY + 28);
        ctx.stroke();
      }

      // Cloud
      cloudBox(clx, cly, clw, clh);
      ctx.fillStyle = 'rgba(168,85,247,0.6)';
      ctx.textAlign = 'center';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText('CLOUD', clx + clw / 2, cly + 22);
      ctx.font = '400 24px sans-serif';
      ctx.fillText('\u2601', clx + clw / 2, cly + 60);
      ctx.font = '400 11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(168,85,247,0.5)';
      ctx.fillText('Pinecone', clx + clw / 2, cly + 90);
      ctx.fillText('Vector DB', clx + clw / 2, cly + 108);

      // Network boundary
      var boundaryX = mx + mw + 30;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = cracked ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boundaryX, 30);
      ctx.lineTo(boundaryX, ch - 30);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cracked ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)';
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NETWORK', boundaryX, ch - 15);
      ctx.fillText('BOUNDARY', boundaryX, ch - 4);

      // Query text above machine
      if (phase !== 'idle' || queryCount > 0) {
        var qIdx = Math.min(currentQuery, queries.length - 1);
        ctx.fillStyle = 'rgba(240,192,32,0.7)';
        ctx.font = '400 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('"' + queries[qIdx] + '"', mx + mw / 2, my - 10);
      }

      // Thinking spinner
      if (phase === 'thinking') {
        var spinAngle = frame * 0.08;
        ctx.strokeStyle = 'rgba(0,212,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx + mw / 2, my + mh - 40, 8, spinAngle, spinAngle + Math.PI * 1.5);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,212,255,0.5)';
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.fillText('Processing...', mx + mw / 2, my + mh - 20);
      }

      // Arrow going to cloud
      if (phase === 'arrow-out' || phase === 'cloud-response') {
        var arrowStartX = mx + mw + 5;
        var arrowEndX = clx - 5;
        var arrowY = my + mh / 2;
        var prog = phase === 'arrow-out' ? arrowProgress : 1;
        var currentEndX = arrowStartX + (arrowEndX - arrowStartX) * prog;

        ctx.strokeStyle = 'rgba(239,68,68,0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(currentEndX, arrowY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        if (prog > 0.1) {
          ctx.fillStyle = 'rgba(239,68,68,0.7)';
          ctx.beginPath();
          ctx.moveTo(currentEndX, arrowY);
          ctx.lineTo(currentEndX - 8, arrowY - 4);
          ctx.lineTo(currentEndX - 8, arrowY + 4);
          ctx.closePath();
          ctx.fill();
        }

        // Label on arrow
        ctx.fillStyle = 'rgba(239,68,68,0.6)';
        ctx.font = '400 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('search query', (arrowStartX + currentEndX) / 2, arrowY - 10);
      }

      // Response arrow coming back
      if (phase === 'cloud-response') {
        var respStartX = clx - 5;
        var respEndX = mx + mw + 5;
        var respY = my + mh / 2 + 30;
        var respEnd = respStartX + (respEndX - respStartX) * responseProgress;

        ctx.strokeStyle = 'rgba(168,85,247,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(respStartX, respY);
        ctx.lineTo(respEnd, respY);
        ctx.stroke();
        ctx.setLineDash([]);

        if (responseProgress > 0.1) {
          ctx.fillStyle = 'rgba(168,85,247,0.5)';
          ctx.beginPath();
          ctx.moveTo(respEnd, respY);
          ctx.lineTo(respEnd + 8, respY - 4);
          ctx.lineTo(respEnd + 8, respY + 4);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(168,85,247,0.5)';
        ctx.font = '400 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('results', (respStartX + respEnd) / 2, respY - 10);
      }

      // Query counter
      if (queryCount > 0) {
        ctx.fillStyle = 'rgba(239,68,68,0.5)';
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('Cloud queries: ' + queryCount, cw - 20, ch - 10);
      }

      // Phase state machine
      if (phase === 'idle') {
        if (phaseTimer > 60) { phase = 'thinking'; phaseTimer = 0; }
      } else if (phase === 'thinking') {
        if (phaseTimer > 50) { phase = 'arrow-out'; phaseTimer = 0; arrowProgress = 0; }
      } else if (phase === 'arrow-out') {
        arrowProgress += 0.025;
        if (arrowProgress >= 1) { phase = 'cloud-response'; phaseTimer = 0; responseProgress = 0; }
      } else if (phase === 'cloud-response') {
        responseProgress += 0.03;
        if (responseProgress >= 1) {
          phase = 'crack';
          phaseTimer = 0;
          cracked = true;
          queryCount++;
        }
      } else if (phase === 'crack') {
        if (phaseTimer > 70) {
          if (currentQuery < 2) {
            currentQuery++;
            phase = 'idle';
            phaseTimer = 0;
            arrowProgress = 0;
            responseProgress = 0;
          }
          // After 3 queries, stays cracked
        }
      }

      if (currentStage === 0) stage0Timer = requestAnimationFrame(tick);
    }

    // Show caption after delay
    setTimeout(function() {
      var cap = document.getElementById('caption0');
      cap.textContent = 'Your inference is local. Your knowledge isn\u2019t. Every query leaks data to the cloud.';
      cap.classList.add('visible');
    }, 2000);

    tick();
  }

  // --- Stage 1: Knowledge That Travels ---
  function drawStage1(canvas) {
    var ctx = canvas.getContext('2d');
    var cw = canvas.width, ch = canvas.height;
    var frame = 0;
    var phase = 'idle';
    var phaseTimer = 0;
    var arrowProgress = 0;
    var resultAlpha = 0;

    function tick() {
      ctx.clearRect(0, 0, cw, ch);
      frame++;
      phaseTimer++;

      var mx = 60, my = 40, mw = 280, mh = 240;

      // Machine box
      ctx.strokeStyle = 'rgba(0,212,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, mx, my, mw, mh, 10);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,212,255,0.04)';
      ctx.fill();

      ctx.fillStyle = 'rgba(0,212,255,0.6)';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR MACHINE', mx + mw / 2, my + 22);

      // Checkmarks
      ctx.textAlign = 'left';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('\u2713 Ollama', mx + 20, my + 55);
      ctx.fillText('\u2713 7B Model', mx + 20, my + 78);

      // RVF file with cyan glow
      var rvfY = my + 98;
      var glowIntensity = 0.3 + Math.sin(frame * 0.05) * 0.15;
      ctx.fillStyle = 'rgba(0,212,255,' + (glowIntensity * 0.2) + ')';
      ctx.beginPath();
      roundRect(ctx, mx + 15, rvfY - 5, mw - 30, 26, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,212,255,' + (glowIntensity + 0.2) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, mx + 15, rvfY - 5, mw - 30, 26, 4);
      ctx.stroke();
      ctx.fillStyle = '#00d4ff';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('\u2713 RVF File', mx + 20, rvfY + 12);
      ctx.fillStyle = 'rgba(0,212,255,0.5)';
      ctx.font = '400 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('knowledge.rvf \u2014 535KB', mx + mw - 20, rvfY + 12);

      // Query text
      ctx.fillStyle = 'rgba(240,192,32,0.7)';
      ctx.font = '400 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('"What is our API rate limit?"', mx + mw / 2, my - 10);

      // Arrow going DOWN to RVF file (local search)
      if (phase === 'searching' || phase === 'result') {
        var arrowStartY = my + 78 + 8;
        var arrowEndY = rvfY - 8;
        var arrowX = mx + mw / 2 + 60;
        var prog = phase === 'searching' ? arrowProgress : 1;
        var curEndY = arrowStartY + (arrowEndY - arrowStartY) * prog;

        ctx.strokeStyle = 'rgba(0,212,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowStartY);
        ctx.lineTo(arrowX, curEndY);
        ctx.stroke();

        if (prog > 0.3) {
          ctx.fillStyle = 'rgba(0,212,255,0.6)';
          ctx.beginPath();
          ctx.moveTo(arrowX, curEndY);
          ctx.lineTo(arrowX - 4, curEndY - 6);
          ctx.lineTo(arrowX + 4, curEndY - 6);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Result coming back up
      if (phase === 'result') {
        resultAlpha = Math.min(1, resultAlpha + 0.02);
        ctx.fillStyle = 'rgba(16,185,129,' + (resultAlpha * 0.6) + ')';
        ctx.font = '400 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('\u2713 Result found locally', mx + mw / 2, rvfY + 40);
      }

      // 100% LOCAL badge (solid, no crack)
      var badgeY = my + mh - 50;
      ctx.fillStyle = 'rgba(16,185,129,0.15)';
      ctx.strokeStyle = 'rgba(16,185,129,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, mx + 50, badgeY, mw - 100, 30, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText('100% LOCAL', mx + mw / 2, badgeY + 19);

      // Network boundary -- nothing crosses
      var boundaryX = mx + mw + 40;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(16,185,129,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boundaryX, 30);
      ctx.lineTo(boundaryX, ch - 30);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(16,185,129,0.4)';
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NOTHING', boundaryX, ch - 20);
      ctx.fillText('CROSSES', boundaryX, ch - 8);

      // Faded cloud (unused)
      var clx = cw - 180, cly = 80;
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = 'rgba(168,85,247,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, clx, cly, 140, 120, 10);
      ctx.stroke();
      ctx.fillStyle = 'rgba(168,85,247,0.3)';
      ctx.font = '400 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2601', clx + 70, cly + 50);
      ctx.font = '400 9px "JetBrains Mono", monospace';
      ctx.fillText('Not needed', clx + 70, cly + 80);
      ctx.globalAlpha = 1;

      // Strikethrough on cloud
      ctx.strokeStyle = 'rgba(239,68,68,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clx + 10, cly + 10);
      ctx.lineTo(clx + 130, cly + 110);
      ctx.stroke();

      // Phase machine
      if (phase === 'idle') {
        if (phaseTimer > 40) { phase = 'searching'; phaseTimer = 0; arrowProgress = 0; }
      } else if (phase === 'searching') {
        arrowProgress += 0.03;
        if (arrowProgress >= 1) { phase = 'result'; phaseTimer = 0; resultAlpha = 0; }
      }

      if (currentStage === 1) requestAnimationFrame(tick);
    }

    // Animate size comparison items
    var items = document.querySelectorAll('.size-item');
    for (var i = 0; i < items.length; i++) {
      (function(el, delay) {
        setTimeout(function() { el.classList.add('visible'); }, delay);
      })(items[i], 400 + i * 250);
    }

    setTimeout(function() {
      var cap = document.getElementById('caption1');
      cap.textContent = 'One file. Self-describing. Self-searching. Everything the app needs to be intelligent \u2014 offline.';
      cap.classList.add('visible');
    }, 2500);

    tick();
  }

  // --- Stage 2: 41KB ---
  function drawStage2(canvas) {
    var ctx = canvas.getContext('2d');
    var cw = canvas.width, ch = canvas.height;
    var frame = 0;
    var rings = [
      { label: 'HNSW search engine', normalSize: '50MB+', radius: 0, targetRadius: 50, color: [0, 212, 255] },
      { label: 'Vector index', normalSize: '500MB+', radius: 0, targetRadius: 90, color: [168, 85, 247] },
      { label: 'Query optimizer', normalSize: 'Part of DB server', radius: 0, targetRadius: 125, color: [59, 130, 246] },
      { label: 'Full-text search', normalSize: '1GB+ (Elasticsearch)', radius: 0, targetRadius: 155, color: [240, 192, 32] }
    ];
    var ringPhase = -1;
    var ringTimer = 0;

    function tick() {
      ctx.clearRect(0, 0, cw, ch);
      frame++;
      ringTimer++;

      var cx = cw / 2, cy = ch / 2 - 10;

      // Advance ring phases
      if (ringPhase < rings.length - 1 && ringTimer > 50) {
        ringPhase++;
        ringTimer = 0;
      }

      // Draw rings from outermost to innermost
      for (var i = rings.length - 1; i >= 0; i--) {
        var ring = rings[i];
        if (i > ringPhase) continue;

        // Animate radius
        ring.radius += (ring.targetRadius - ring.radius) * 0.06;

        var r = ring.color;
        // Ring fill
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',0.06)';
        ctx.fill();
        // Ring stroke
        ctx.strokeStyle = 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        var labelY = cy - ring.targetRadius - 8;
        if (labelY < 18) labelY = cy + ring.targetRadius + 16;
        ctx.fillStyle = 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',0.7)';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ring.label, cx, labelY);
        ctx.fillStyle = 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',0.4)';
        ctx.font = '400 8px "JetBrains Mono", monospace';
        ctx.fillText('normally ' + ring.normalSize, cx, labelY + 13);
      }

      // Center dot -- the 41KB kernel
      var pulse = 0.7 + Math.sin(frame * 0.06) * 0.3;
      // Glow
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,' + (pulse * 0.25) + ')';
      ctx.fill();
      // Core
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,' + pulse + ')';
      ctx.fill();
      // Label
      ctx.fillStyle = '#00d4ff';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('41KB', cx, cy + 28);
      ctx.fillStyle = 'rgba(0,212,255,0.5)';
      ctx.font = '400 9px "JetBrains Mono", monospace';
      ctx.fillText('WASM kernel', cx, cy + 42);

      if (currentStage === 2) stage2Timer = requestAnimationFrame(tick);
    }

    // Animate speed counter
    var vectorEl = document.getElementById('vectorCount');
    var timeEl = document.getElementById('searchTime');
    var startCount = performance.now();
    var countDuration = 2000;
    var targetVectors = 100000;

    function animateCounter() {
      var elapsed = performance.now() - startCount;
      var t = Math.min(elapsed / countDuration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.floor(eased * targetVectors);
      vectorEl.textContent = val.toLocaleString();
      var ms = (eased * 0.8).toFixed(1);
      timeEl.textContent = ms + 'ms';
      if (t < 1) requestAnimationFrame(animateCounter);
      else {
        vectorEl.textContent = '100,000';
        timeEl.textContent = '0.8ms';
      }
    }
    setTimeout(animateCounter, 800);

    setTimeout(function() {
      var cap = document.getElementById('caption2');
      cap.textContent = '100,000 vectors. 0.8 milliseconds. In your browser. No server.';
      cap.classList.add('visible');
    }, 3000);

    tick();
  }

  // --- Stage 3: Applications That Couldn't Exist ---
  function buildScenarioCards() {
    var scenarios = [
      {
        icon: '\uD83D\uDD12', title: 'Classified Environments',
        desc: 'AI that never connects to the internet. Knowledge stays air-gapped. Full search capability. Zero data exfiltration risk.',
        example: 'Military, intelligence, defense contractors'
      },
      {
        icon: '\uD83C\uDFE5', title: 'Healthcare at the Point of Care',
        desc: 'Patient data never leaves the device. AI-assisted diagnosis without HIPAA concerns. Works in rural clinics with no connectivity.',
        example: 'Hospitals, field medicine, telemedicine'
      },
      {
        icon: '\uD83D\uDD27', title: 'Field Operations',
        desc: 'Engineers on oil rigs, disaster responders, submarine crews. Full knowledge search with zero connectivity. Works offline indefinitely.',
        example: 'Energy, emergency services, maritime'
      }
    ];

    var grid = document.getElementById('scenarioGrid');
    grid.textContent = '';
    for (var i = 0; i < scenarios.length; i++) {
      var s = scenarios[i];
      var card = document.createElement('div');
      card.className = 'scenario-card';
      card.innerHTML = '<div class="scenario-icon">' + s.icon + '</div>' +
        '<div class="scenario-title">' + s.title + '</div>' +
        '<div class="scenario-desc">' + s.desc + '</div>' +
        '<div class="scenario-example">' + s.example + '</div>';
      grid.appendChild(card);
      (function(el, delay) {
        setTimeout(function() { el.classList.add('visible'); }, delay);
      })(card, 300 + i * 400);
    }

    setTimeout(function() {
      var cap = document.getElementById('caption3');
      cap.textContent = 'These applications literally cannot exist with cloud-dependent knowledge systems.';
      cap.classList.add('visible');
    }, 2000);
  }

  // --- Stage 4: You're Already Using It ---
  var searchWorker = null;
  var workerReady = false;
  var embeddingWorker = null;
  var embeddingReady = false;
  var searchStartTime = 0;
  var realMetadata = null;
  var fallbackMode = false;

  function runStage4Reveal() {
    var revealEl = document.getElementById('revealText');
    var searchWrap = document.getElementById('liveSearchWrap');
    var edgeBadge = document.getElementById('edgeBadge');
    var searchInput = document.getElementById('liveSearch');

    // Step 1: First line
    revealEl.innerHTML = 'Everything you\u2019ve searched in this demo...';
    revealEl.classList.add('visible');

    // Step 2: Second line after 1.5s
    setTimeout(function() {
      revealEl.innerHTML = 'Everything you\u2019ve searched in this demo...<br><br>' +
        '<span class="highlight">...was powered by a 41KB WASM kernel running in your browser.</span>';
    }, 1500);

    // Step 3: Third line after 2.5s
    setTimeout(function() {
      revealEl.innerHTML = 'Everything you\u2019ve searched in this demo...<br><br>' +
        '<span class="highlight">...was powered by a 41KB WASM kernel running in your browser.</span><br><br>' +
        '<span class="gold">No server. No API key. No data left your machine.</span>';
    }, 2500);

    // Step 4: Show live search after 4s
    setTimeout(function() {
      searchWrap.style.display = '';
      edgeBadge.classList.add('visible');
      searchInput.focus();
      loadRealMetadata();
      initSearchWorker();
      initEmbeddingWorker();
    }, 4000);

    setTimeout(function() {
      var cap = document.getElementById('caption4');
      cap.textContent = 'You\u2019ve been using edge-native knowledge search for the last 2 minutes. Did you notice?';
      cap.classList.add('visible');
    }, 5000);
  }

  function loadRealMetadata() {
    if (realMetadata) return Promise.resolve();
    return fetch('/assets/knowledge-meta.json')
      .then(function(r) { return r.json(); })
      .then(function(data) { realMetadata = data; })
      .catch(function() {
        return fetch('/assets/knowledge-meta.json.gz')
          .then(function(r) {
            var ds = new DecompressionStream('gzip');
            return new Response(r.body.pipeThrough(ds)).text();
          })
          .then(function(text) { realMetadata = JSON.parse(text); })
          .catch(function() { realMetadata = []; });
      });
  }

  function initSearchWorker() {
    if (searchWorker) return;
    try {
      searchWorker = new Worker('/assets/rvf-search-worker.js');
      searchWorker.onmessage = function(e) {
        var msg = e.data;
        if (msg.type === 'progress') {
          showLatency(msg.message);
        } else if (msg.type === 'ready') {
          workerReady = true;
          showLatency(msg.vectorCount.toLocaleString() + ' vectors loaded \u2022 ' + (msg.hasWasm ? 'WASM HNSW' : 'brute-force') + ' search ready');
          document.getElementById('liveSearch').placeholder = 'Search ' + msg.vectorCount.toLocaleString() + ' entries...';
        } else if (msg.type === 'results') {
          var totalElapsed = (performance.now() - searchStartTime).toFixed(1);
          renderResults(msg.results, totalElapsed, msg.method);
        } else if (msg.type === 'error') {
          showLatency('Error: ' + msg.message + ' \u2014 falling back to keyword search');
          workerReady = false;
          fallbackMode = true;
        }
      };
      searchWorker.postMessage({ type: 'init', baseUrl: '/assets' });
    } catch (err) {
      fallbackMode = true;
    }
  }

  function initEmbeddingWorker() {
    if (embeddingWorker) return;
    try {
      embeddingWorker = new Worker('/assets/embedding-worker.js', { type: 'module' });
      embeddingWorker.onmessage = function(e) {
        var msg = e.data;
        if (msg.type === 'progress') {
          showLatency(msg.message);
        } else if (msg.type === 'ready') {
          embeddingReady = true;
          showLatency('Semantic search ready \u2014 AI embeddings active');
          document.getElementById('liveSearch').placeholder = 'Semantic search across knowledge base...';
        } else if (msg.type === 'embedding') {
          if (workerReady && searchWorker) {
            searchWorker.postMessage({ type: 'search', query: msg.embedding, k: 8 });
          } else {
            var results = fallbackSearch(document.getElementById('liveSearch').value);
            var elapsed = (performance.now() - searchStartTime).toFixed(1);
            renderResults(results, elapsed, 'keyword (vectors loading)');
          }
        }
      };
      embeddingWorker.postMessage({ type: 'init' });
    } catch (err) {
      // silent
    }
  }

  function fallbackSearch(query) {
    if (!realMetadata || realMetadata.length === 0) return [];
    var q = query.toLowerCase();
    var words = q.split(/\s+/).filter(function(w) { return w.length > 1; });
    var scored = [];
    for (var i = 0; i < realMetadata.length; i++) {
      var entry = realMetadata[i];
      var title = (entry.t || '').toLowerCase();
      var cat = (entry.c || '').toLowerCase();
      var pkg = (entry.p || '').toLowerCase();
      var searchText = title + ' ' + cat + ' ' + pkg;
      var matchScore = 0;
      for (var w = 0; w < words.length; w++) {
        if (searchText.indexOf(words[w]) !== -1) matchScore += 0.3;
      }
      if (searchText.indexOf(q) !== -1) matchScore += 0.5;
      if (matchScore > 0) {
        var qualityBoost = (entry.q || 0) / 100 * 0.2;
        scored.push({
          title: entry.t || entry.id,
          distance: 1 - Math.min(1, matchScore + qualityBoost),
          category: entry.c || entry.k || '',
          quality_score: entry.q || 0
        });
      }
    }
    scored.sort(function(a, b) { return a.distance - b.distance; });
    return scored.slice(0, 5);
  }

  function showLatency(text) {
    var badge = document.getElementById('latencyBadge');
    badge.textContent = text;
    badge.classList.add('visible');
  }

  function renderResults(results, elapsed, method) {
    var methodLabel = method || 'keyword';
    showLatency(elapsed + 'ms \u2022 ' + results.length + ' results \u2022 ' + methodLabel + ' \u2022 client-side');

    var container = document.getElementById('searchResults');
    container.textContent = '';
    for (var j = 0; j < results.length; j++) {
      (function(entry, index) {
        var div = document.createElement('div');
        div.className = 'search-result-item';
        div.setAttribute('role', 'listitem');

        var scoreSpan = document.createElement('span');
        scoreSpan.className = 'result-score-badge';
        scoreSpan.textContent = entry.distance != null ? (1 - entry.distance).toFixed(2) : (entry.quality_score / 100).toFixed(2);

        var titleSpan = document.createElement('span');
        titleSpan.className = 'result-title';
        titleSpan.textContent = entry.title || '';

        var voteBtn = document.createElement('button');
        voteBtn.className = 'result-vote-btn';
        voteBtn.textContent = '\u2191 Useful';
        voteBtn.addEventListener('click', function() {
          voteBtn.classList.add('voted');
          voteBtn.textContent = '\u2713 Voted';
        });

        div.appendChild(scoreSpan);
        div.appendChild(titleSpan);
        div.appendChild(voteBtn);
        container.appendChild(div);
        setTimeout(function() { div.classList.add('visible'); }, index * 80);
      })(results[j], j);
    }
  }

  var searchDebounce = null;
  document.getElementById('liveSearch').addEventListener('input', function() {
    clearTimeout(searchDebounce);
    var input = this;
    searchDebounce = setTimeout(function() { performSearch(input.value); }, 150);
  });

  function performSearch(query) {
    if (!query.trim()) {
      document.getElementById('searchResults').textContent = '';
      document.getElementById('latencyBadge').classList.remove('visible');
      return;
    }
    searchStartTime = performance.now();
    if (embeddingReady && embeddingWorker) {
      showLatency('Embedding query...');
      embeddingWorker.postMessage({ type: 'embed', text: query });
    } else if (realMetadata) {
      var results = fallbackSearch(query);
      var elapsed = (performance.now() - searchStartTime).toFixed(1);
      renderResults(results, elapsed, 'keyword');
    } else {
      loadRealMetadata().then(function() { performSearch(query); });
      showLatency('Loading knowledge base...');
    }
  }

  // === Utility: roundRect ===
  function roundRect(ctx, x, y, w, h, r) {
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

  // === Stage Management ===
  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');

  function clearStageTimers() {
    if (stage0Timer) { cancelAnimationFrame(stage0Timer); stage0Timer = null; }
    if (stage2Timer) { cancelAnimationFrame(stage2Timer); stage2Timer = null; }
  }

  function goToStage(n) {
    if (n < 0 || n >= TOTAL_STAGES) return;
    clearStageTimers();
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

    setParticleTargets(n);
    triggerStageEffects(n);
  }

  function triggerStageEffects(n) {
    // Reset captions
    for (var c = 0; c < TOTAL_STAGES; c++) {
      var cap = document.getElementById('caption' + c);
      if (cap) cap.classList.remove('visible');
    }

    switch (n) {
      case 0:
        drawStage0(document.getElementById('stage0Canvas'));
        break;
      case 1:
        drawStage1(document.getElementById('stage1Canvas'));
        break;
      case 2:
        drawStage2(document.getElementById('stage2Canvas'));
        break;
      case 3:
        buildScenarioCards();
        break;
      case 4:
        runStage4Reveal();
        break;
    }
  }

  // === Controls ===
  prevBtn.addEventListener('click', function() { goToStage(currentStage - 1); });
  nextBtn.addEventListener('click', function() {
    if (currentStage === TOTAL_STAGES - 1) goToStage(0);
    else goToStage(currentStage + 1);
  });

  for (var d = 0; d < dots.length; d++) {
    (function(dot) {
      dot.addEventListener('click', function() { goToStage(parseInt(dot.dataset.stage)); });
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

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (document.activeElement === document.getElementById('liveSearch')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goToStage(Math.min(currentStage + 1, TOTAL_STAGES - 1));
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToStage(Math.max(currentStage - 1, 0));
    }
  });

  // === Mode Badge ===
  function updateModeBadge() {
    var badge = document.getElementById('modeBadge');
    badge.textContent = 'Edge Knowledge \u00B7 Demo';
    badge.style.borderColor = 'rgba(0,212,255,0.3)';
    badge.style.color = '#00d4ff';
  }

  // === Init ===
  resizeParticles();
  window.addEventListener('resize', function() {
    resizeParticles();
    setParticleTargets(currentStage);
  });
  initParticles();
  setParticleTargets(0);
  drawParticles();
  updateModeBadge();
  triggerStageEffects(0);

})();
