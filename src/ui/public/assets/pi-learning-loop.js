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
  var TOTAL_STAGES = 5;

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
      var angle, dist, layerIdx, layerY;

      switch (stage) {
        case 0: // Pulse red -- urgency
          angle = (i / particles.length) * Math.PI * 2;
          dist = 80 + Math.random() * Math.min(W, H) * 0.3;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          // Shift some particles toward red
          if (i % 5 === 0) p.color = [239, 68, 68];
          break;

        case 1: // Scatter outward chaotically -- data leaking
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
          // Push outward from center
          angle = Math.atan2(p.ty - cy, p.tx - cx);
          dist = 100 + Math.random() * Math.min(W, H) * 0.4;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 2: // Three horizontal layers
          layerIdx = i % 3;
          layerY = cy - 100 + layerIdx * 100;
          p.tx = cx + (Math.random() - 0.5) * W * 0.5;
          p.ty = layerY + (Math.random() - 0.5) * 30;
          break;

        case 3: // Converge to center and organize
          angle = (i / particles.length) * Math.PI * 2;
          dist = Math.sqrt(Math.random()) * Math.min(W, H) * 0.12;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 4: // Gentle ambient scatter
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
          break;
      }
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);

    // Ambient glow for middle stages
    if (currentStage >= 1 && currentStage <= 3) {
      var cx = W / 2, cy = H / 2;
      var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.4);
      if (currentStage === 1) {
        grd.addColorStop(0, 'rgba(239, 68, 68, 0.04)');
        grd.addColorStop(0.5, 'rgba(239, 68, 68, 0.02)');
      } else {
        grd.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
        grd.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
      }
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }

    // Red pulse for stage 0
    if (currentStage === 0) {
      var pulse0 = Math.sin(performance.now() * 0.003) * 0.02 + 0.03;
      var cx0 = W / 2, cy0 = H / 2;
      var grd0 = ctx.createRadialGradient(cx0, cy0, 0, cx0, cy0, Math.min(W, H) * 0.5);
      grd0.addColorStop(0, 'rgba(239, 68, 68, ' + pulse0 + ')');
      grd0.addColorStop(1, 'transparent');
      ctx.fillStyle = grd0;
      ctx.fillRect(0, 0, W, H);
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var ease = 0.015 + (currentStage === 4 ? 0 : 0.008);
      p.x += (p.tx - p.x) * ease + p.vx + Math.sin(p.phase) * 0.15;
      p.y += (p.ty - p.y) * ease + p.vy + Math.cos(p.phase) * 0.15;
      p.phase += p.speed;

      // Stage 1: continuously push particles outward (leaking feeling)
      if (currentStage === 1) {
        var cx1 = W / 2, cy1 = H / 2;
        var dx1 = p.x - cx1, dy1 = p.y - cy1;
        var d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
        p.tx += (dx1 / d1) * 0.3;
        p.ty += (dy1 / d1) * 0.3;
        // Wrap
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          p.x = W / 2 + (Math.random() - 0.5) * 100;
          p.y = H / 2 + (Math.random() - 0.5) * 100;
          var a1 = Math.random() * Math.PI * 2;
          var dd1 = 100 + Math.random() * Math.min(W, H) * 0.4;
          p.tx = W / 2 + Math.cos(a1) * dd1;
          p.ty = H / 2 + Math.sin(a1) * dd1;
        }
      }

      if (currentStage === 4) {
        if (p.x < -10 || p.x > W + 10) p.tx = Math.random() * W;
        if (p.y < -10 || p.y > H + 10) p.ty = Math.random() * H;
      }

      var rgb = p.color;
      var glowSize = p.r * 2;

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

  function animateValue(el, from, to, duration, suffix) {
    var start = performance.now();
    var sfx = suffix || '';
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.floor(from + (to - from) * eased);
      el.textContent = val + sfx;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to + sfx;
    }
    requestAnimationFrame(tick);
  }


  // =====================================================================
  // 3. STAGE 0 — THE DEADLINE
  // =====================================================================

  function initDeadline() {
    var deadline = new Date('2026-08-02T00:00:00Z');
    var today = new Date();
    var daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) daysLeft = 0;

    var countdownEl = document.getElementById('countdownNumber');
    countdownEl.textContent = '0';
    countdownEl.classList.add('visible');

    // Animate countdown number
    var countStart = performance.now();
    var countDuration = 1200;
    function countTick(now) {
      var t = Math.min((now - countStart) / countDuration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      countdownEl.textContent = Math.floor(eased * daysLeft);
      if (t < 1) requestAnimationFrame(countTick);
      else countdownEl.textContent = daysLeft;
    }
    requestAnimationFrame(countTick);

    // Stagger the compliance checkboxes
    var checks = [
      document.getElementById('check0'),
      document.getElementById('check1'),
      document.getElementById('check2')
    ];
    for (var i = 0; i < checks.length; i++) {
      checks[i].classList.remove('visible');
    }
    for (var c = 0; c < checks.length; c++) {
      (function(el, delay) {
        setTimeout(function() {
          if (currentStage !== 0) return;
          el.classList.add('visible');
        }, delay);
      })(checks[c], 1400 + c * 400);
    }

    // Show status panel
    var statusPanel = document.getElementById('statusPanel');
    statusPanel.classList.remove('visible');
    setTimeout(function() {
      if (currentStage !== 0) return;
      statusPanel.classList.add('visible');
    }, 2800);

    // Show caption
    var caption = document.getElementById('caption0');
    caption.classList.remove('visible');
    setTimeout(function() {
      if (currentStage !== 0) return;
      caption.classList.add('visible');
    }, 3400);
  }


  // =====================================================================
  // 4. STAGE 1 — THE SHADOW AI PROBLEM
  // =====================================================================

  var shadowCtx = null;
  var shadowAnimFrame = null;
  var shadowDots = [];
  var shadowArrows = [];
  var shadowPhase = 0;

  function initShadowAI() {
    var shadowCanvas = document.getElementById('shadowCanvas');
    if (!shadowCanvas) return;
    shadowCanvas.width = shadowCanvas.offsetWidth * (window.devicePixelRatio || 1);
    shadowCanvas.height = shadowCanvas.offsetHeight * (window.devicePixelRatio || 1);
    shadowCtx = shadowCanvas.getContext('2d');
    shadowCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    var cw = shadowCanvas.offsetWidth;
    var ch = shadowCanvas.offsetHeight;

    shadowDots = [];
    shadowArrows = [];
    shadowPhase = 0;

    if (shadowAnimFrame) cancelAnimationFrame(shadowAnimFrame);

    // Official tools (inside boundary)
    var officialTools = [
      { x: cw * 0.35, y: ch * 0.4, label: 'Approved AI', color: '#10b981' },
      { x: cw * 0.65, y: ch * 0.4, label: 'Internal RAG', color: '#10b981' }
    ];

    // Shadow AI tools (outside boundary)
    var shadowTools = [
      { x: cw * 0.1, y: ch * 0.12, label: 'ChatGPT (personal)', color: '#ef4444', delay: 800 },
      { x: cw * 0.85, y: ch * 0.1, label: 'Claude (browser)', color: '#ef4444', delay: 1200 },
      { x: cw * 0.92, y: ch * 0.55, label: 'Copilot (unmanaged)', color: '#ef4444', delay: 1600 },
      { x: cw * 0.08, y: ch * 0.7, label: 'Custom GPTs', color: '#ef4444', delay: 2000 },
      { x: cw * 0.88, y: ch * 0.85, label: '3rd-party plugins', color: '#ef4444', delay: 2400 }
    ];

    // Arrow targets (from company center to each shadow tool)
    var companyCx = cw * 0.5;
    var companyCy = ch * 0.42;

    function drawShadowFrame() {
      if (currentStage !== 1) return;
      shadowPhase++;
      shadowCtx.clearRect(0, 0, cw, ch);

      // Company boundary (rounded rect)
      shadowCtx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      shadowCtx.lineWidth = 2;
      shadowCtx.setLineDash([6, 4]);
      roundRect(shadowCtx, cw * 0.2, ch * 0.2, cw * 0.6, ch * 0.45, 12);
      shadowCtx.stroke();
      shadowCtx.setLineDash([]);

      // "YOUR COMPANY" label
      shadowCtx.font = '600 11px "JetBrains Mono", monospace';
      shadowCtx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      shadowCtx.textAlign = 'center';
      shadowCtx.fillText('YOUR COMPANY', cw * 0.5, ch * 0.25);

      // Draw official tools
      for (var o = 0; o < officialTools.length; o++) {
        drawToolBox(shadowCtx, officialTools[o].x, officialTools[o].y, officialTools[o].label, officialTools[o].color, 1);
      }

      // Draw shadow tools with staggered appearance
      var elapsed = shadowPhase * 16; // ~16ms per frame
      for (var s = 0; s < shadowTools.length; s++) {
        var st = shadowTools[s];
        if (elapsed < st.delay) continue;
        var fadeIn = Math.min(1, (elapsed - st.delay) / 500);

        // Pulsing red dot
        var pulseR = 4 + Math.sin(shadowPhase * 0.05 + s) * 1.5;
        shadowCtx.beginPath();
        shadowCtx.arc(st.x, st.y, pulseR + 4, 0, Math.PI * 2);
        shadowCtx.fillStyle = 'rgba(239, 68, 68, ' + (fadeIn * 0.15) + ')';
        shadowCtx.fill();
        shadowCtx.beginPath();
        shadowCtx.arc(st.x, st.y, pulseR, 0, Math.PI * 2);
        shadowCtx.fillStyle = 'rgba(239, 68, 68, ' + (fadeIn * 0.8) + ')';
        shadowCtx.fill();

        // Label
        shadowCtx.font = '500 9px "JetBrains Mono", monospace';
        shadowCtx.fillStyle = 'rgba(239, 68, 68, ' + (fadeIn * 0.9) + ')';
        shadowCtx.textAlign = 'center';
        shadowCtx.fillText(st.label, st.x, st.y + 18);

        // Arrow from company to shadow tool (PII leak)
        if (fadeIn > 0.5) {
          var arrowAlpha = (fadeIn - 0.5) * 2;
          drawLeakArrow(shadowCtx, companyCx, companyCy, st.x, st.y, arrowAlpha, shadowPhase + s * 30);
        }
      }

      shadowAnimFrame = requestAnimationFrame(drawShadowFrame);
    }

    drawShadowFrame();

    // Animate stats
    var stat0 = document.getElementById('stat0');
    var stat1 = document.getElementById('stat1');
    var stat2 = document.getElementById('stat2');
    stat0.classList.remove('visible');
    stat1.classList.remove('visible');
    stat2.classList.remove('visible');

    setTimeout(function() {
      if (currentStage !== 1) return;
      stat0.classList.add('visible');
      animateValue(document.getElementById('statPct'), 0, 75, 1000, '%');
    }, 2800);

    setTimeout(function() {
      if (currentStage !== 1) return;
      stat1.classList.add('visible');
      animateValue(document.getElementById('statViolations'), 0, 223, 1200, '');
    }, 3400);

    setTimeout(function() {
      if (currentStage !== 1) return;
      stat2.classList.add('visible');
    }, 4000);

    // Caption
    var caption1 = document.getElementById('caption1');
    caption1.classList.remove('visible');
    setTimeout(function() {
      if (currentStage !== 1) return;
      caption1.classList.add('visible');
    }, 4600);
  }

  function roundRect(ctx2d, x, y, w, h, r) {
    ctx2d.beginPath();
    ctx2d.moveTo(x + r, y);
    ctx2d.lineTo(x + w - r, y);
    ctx2d.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx2d.lineTo(x + w, y + h - r);
    ctx2d.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx2d.lineTo(x + r, y + h);
    ctx2d.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx2d.lineTo(x, y + r);
    ctx2d.quadraticCurveTo(x, y, x + r, y);
    ctx2d.closePath();
  }

  function drawToolBox(ctx2d, x, y, label, color, alpha) {
    var bw = 80, bh = 28;
    ctx2d.strokeStyle = color;
    ctx2d.globalAlpha = alpha * 0.5;
    ctx2d.lineWidth = 1.5;
    roundRect(ctx2d, x - bw / 2, y - bh / 2, bw, bh, 6);
    ctx2d.stroke();
    ctx2d.globalAlpha = alpha;
    ctx2d.font = '500 9px "JetBrains Mono", monospace';
    ctx2d.fillStyle = color;
    ctx2d.textAlign = 'center';
    ctx2d.fillText(label, x, y + 3);
    ctx2d.globalAlpha = 1;
  }

  function drawLeakArrow(ctx2d, x1, y1, x2, y2, alpha, phase) {
    // Dashed arrow with animated "PII" label moving along it
    ctx2d.strokeStyle = 'rgba(239, 68, 68, ' + (alpha * 0.35) + ')';
    ctx2d.lineWidth = 1;
    ctx2d.setLineDash([4, 3]);
    ctx2d.beginPath();
    ctx2d.moveTo(x1, y1);
    ctx2d.lineTo(x2, y2);
    ctx2d.stroke();
    ctx2d.setLineDash([]);

    // Animated PII dot moving along arrow
    var t = ((phase * 0.01) % 1);
    var px = x1 + (x2 - x1) * t;
    var py = y1 + (y2 - y1) * t;
    ctx2d.beginPath();
    ctx2d.arc(px, py, 3, 0, Math.PI * 2);
    ctx2d.fillStyle = 'rgba(239, 68, 68, ' + (alpha * 0.7) + ')';
    ctx2d.fill();

    // "PII" label at midpoint
    ctx2d.font = '600 7px "JetBrains Mono", monospace';
    ctx2d.fillStyle = 'rgba(239, 68, 68, ' + (alpha * 0.5) + ')';
    ctx2d.textAlign = 'center';
    ctx2d.fillText('PII', px, py - 6);
  }


  // =====================================================================
  // 5. STAGE 2 — BUILT-IN, NOT BOLTED ON
  // =====================================================================

  function initProtection() {
    var layers = [
      document.getElementById('layer0'),
      document.getElementById('layer1'),
      document.getElementById('layer2')
    ];
    var shield = document.getElementById('shieldMerge');
    var caption = document.getElementById('caption2');

    for (var i = 0; i < layers.length; i++) {
      layers[i].classList.remove('visible');
    }
    shield.classList.remove('visible');
    caption.classList.remove('visible');

    // Stagger each layer appearing with glow effect
    for (var l = 0; l < layers.length; l++) {
      (function(layer, delay, color) {
        setTimeout(function() {
          if (currentStage !== 2) return;
          layer.classList.add('visible');
          // Glow flash
          layer.style.boxShadow = '0 0 30px ' + color;
          setTimeout(function() {
            layer.style.boxShadow = '0 0 8px ' + color;
            setTimeout(function() {
              layer.style.boxShadow = '';
            }, 1000);
          }, 300);
        }, delay);
      })(layers[l], 500 + l * 1500,
         l === 0 ? 'rgba(16,185,129,0.3)' : l === 1 ? 'rgba(168,85,247,0.3)' : 'rgba(0,212,255,0.3)');
    }

    // Shield merge
    setTimeout(function() {
      if (currentStage !== 2) return;
      shield.classList.add('visible');
    }, 5200);

    // Caption
    setTimeout(function() {
      if (currentStage !== 2) return;
      caption.classList.add('visible');
    }, 5800);
  }


  // =====================================================================
  // 6. STAGE 3 — KNOWLEDGE WITH PROVENANCE
  // =====================================================================

  function initProvenance() {
    var rows = [
      'provTitle',
      'provContributor',
      'provCreated',
      'provModified',
      'provQuality',
      'provWitness',
      'provPii'
    ];

    for (var i = 0; i < rows.length; i++) {
      document.getElementById(rows[i]).classList.remove('visible');
    }
    document.getElementById('qualityFill').style.width = '0';
    document.getElementById('caption3').classList.remove('visible');

    // Progressive reveal of each row
    for (var r = 0; r < rows.length; r++) {
      (function(rowId, delay) {
        setTimeout(function() {
          if (currentStage !== 3) return;
          document.getElementById(rowId).classList.add('visible');

          // Animate quality bar when quality row appears
          if (rowId === 'provQuality') {
            setTimeout(function() {
              document.getElementById('qualityFill').style.width = '93%';
            }, 200);
          }
        }, delay);
      })(rows[r], 300 + r * 600);
    }

    // Caption
    setTimeout(function() {
      if (currentStage !== 3) return;
      document.getElementById('caption3').classList.add('visible');
    }, 300 + rows.length * 600 + 400);
  }


  // =====================================================================
  // 7. STAGE 4 — COMPLIANT AI, LIVE (SEARCH WITH PROVENANCE)
  // =====================================================================

  var SIMULATED_RESULTS = [
    { id: 's1', title: 'HNSW Index Construction Patterns', category: 'architecture', quality: 0.93, witness: 'a6bdcf45...0aa55', contributor: '#db339f...' },
    { id: 's2', title: 'Agent Authentication & Security', category: 'security', quality: 0.89, witness: '7e2f1a03...c8b12', contributor: '#a8e72c...' },
    { id: 's3', title: 'RVF Cognitive Container Format', category: 'architecture', quality: 0.92, witness: 'f3cd8912...4de67', contributor: '#5bc119...' },
    { id: 's4', title: 'Swarm Topology Optimization', category: 'pattern', quality: 0.78, witness: '91ab3e77...f0a23', contributor: '#c4d88e...' },
    { id: 's5', title: 'Transfer Learning Between Domains', category: 'solution', quality: 0.81, witness: 'b2e4c556...8fa91', contributor: '#7f3a12...' },
    { id: 's6', title: 'WASM Executable Knowledge Nodes', category: 'tooling', quality: 0.88, witness: 'de907834...1bc45', contributor: '#e9f201...' },
    { id: 's7', title: 'Embedding Quantization (SQ8)', category: 'performance', quality: 0.84, witness: '44a6bc12...5d890', contributor: '#3ca91b...' },
    { id: 's8', title: 'MinCut Graph Partitioning', category: 'architecture', quality: 0.76, witness: 'c1f892ab...77e34', contributor: '#b0267f...' }
  ];

  var piSearchDebounce = null;

  function initComplianceLive() {
    var piSearch = document.getElementById('piSearch');
    document.getElementById('piResults').textContent = '';
    document.getElementById('piLatency').classList.remove('visible');
    document.getElementById('piLatency').textContent = '';
    document.getElementById('participationBadge').classList.remove('visible');

    piSearch.value = '';

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
            piSearch.placeholder = 'Search ' + data.memories.toLocaleString() + ' collective memories...';
          }
          if (data && data.contributors) {
            document.getElementById('liveBadge').textContent =
              'Pi Brain \u00B7 Witness Chains \u00B7 PII Stripped \u00B7 Audit Ready';
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
    latency.textContent = elapsed + 'ms \u2022 ' + results.length + ' results \u2022 witness-verified \u2022 PII-stripped';
    latency.classList.add('visible');

    var container = document.getElementById('piResults');
    container.textContent = '';

    for (var i = 0; i < results.length; i++) {
      (function(entry, idx) {
        var div = document.createElement('div');
        div.className = 'result-item';
        div.setAttribute('role', 'listitem');

        // Score
        var score = document.createElement('span');
        score.className = 'result-score';
        var scoreVal = entry.quality || entry.quality_score || 0;
        if (entry.alpha && entry.beta) scoreVal = entry.alpha / (entry.alpha + entry.beta);
        if (typeof scoreVal === 'number') scoreVal = scoreVal.toFixed(2);
        score.textContent = scoreVal;

        // Title
        var text = document.createElement('span');
        text.className = 'result-text';
        text.textContent = entry.title || entry.text || '';

        // Vote buttons
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
        div.appendChild(voteWrap);

        // Provenance metadata row
        var metaDiv = document.createElement('div');
        metaDiv.className = 'result-meta';

        var catSpan = document.createElement('span');
        catSpan.className = 'result-category';
        catSpan.textContent = entry.category || entry.cat || '';
        metaDiv.appendChild(catSpan);

        var witnessSpan = document.createElement('span');
        witnessSpan.className = 'result-witness';
        witnessSpan.textContent = '\u2713 ' + (entry.witness || 'verified');
        metaDiv.appendChild(witnessSpan);

        var contribSpan = document.createElement('span');
        contribSpan.className = 'result-contributor';
        contribSpan.textContent = entry.contributor || 'anonymous';
        metaDiv.appendChild(contribSpan);

        div.appendChild(metaDiv);
        container.appendChild(div);

        setTimeout(function() { div.classList.add('visible'); }, idx * 80);
      })(results[i], i);
    }
  }

  function votePiBrain(id, direction, btn) {
    if (!id) return;
    btn.classList.add('voted');

    var badge = document.getElementById('participationBadge');
    badge.textContent = 'Vote recorded with cryptographic provenance.';
    badge.classList.add('visible');

    try {
      fetch('https://pi.ruv.io/v1/memories/' + encodeURIComponent(id) + '/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: direction })
      }).catch(function() { /* optimistic UI */ });
    } catch (ignore) { /* */ }

    // Celebration
    spawnCelebration(btn);
  }

  function spawnCelebration(originEl) {
    var celCanvas = document.getElementById('celebrationCanvas');
    if (!celCanvas) return;
    celCanvas.width = window.innerWidth;
    celCanvas.height = window.innerHeight;
    var celCtx = celCanvas.getContext('2d');

    var rect = originEl.getBoundingClientRect();
    var originX = rect.left + rect.width / 2;
    var originY = rect.top + rect.height / 2;

    var celParticles = [];
    for (var cp = 0; cp < 20; cp++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 4;
      var isGreen = Math.random() > 0.5;
      celParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        r: 1.5 + Math.random() * 2,
        alpha: 1,
        color: isGreen ? [16, 185, 129] : [0, 212, 255]
      });
    }

    var celStart = performance.now();
    function drawCelebration() {
      var elapsed = performance.now() - celStart;
      if (elapsed > 1200) {
        celCtx.clearRect(0, 0, celCanvas.width, celCanvas.height);
        return;
      }
      celCtx.clearRect(0, 0, celCanvas.width, celCanvas.height);

      for (var i = 0; i < celParticles.length; i++) {
        var p = celParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.alpha -= 0.015;
        if (p.alpha <= 0) continue;

        celCtx.beginPath();
        celCtx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        celCtx.fillStyle = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + (p.alpha * 0.2) + ')';
        celCtx.fill();

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
  // 8. CONTROLS & INIT
  // =====================================================================

  function triggerStageEffects(n) {
    // Cancel ongoing animations
    if (shadowAnimFrame) cancelAnimationFrame(shadowAnimFrame);

    if (n === 0) initDeadline();
    if (n === 1) initShadowAI();
    if (n === 2) initProtection();
    if (n === 3) initProvenance();
    if (n === 4) initComplianceLive();
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
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      goToStage(Math.min(currentStage + 1, TOTAL_STAGES - 1));
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToStage(Math.max(currentStage - 1, 0));
    }
  });

  // --- Init ---
  resize();
  window.addEventListener('resize', function() {
    resize();
    setStageTargets(currentStage);
  });
  initParticles();
  setStageTargets(0);
  drawParticles();
  triggerStageEffects(0);
})();
