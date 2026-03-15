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
      var angle, dist, clusterIdx, baseX, baseY, spread, t;

      switch (stage) {
        case 0: // Stage 0: Particles drift downward slowly (knowledge decaying)
          p.tx = p.x + (Math.random() - 0.5) * 60;
          p.ty = p.y + Math.random() * 20 + 5;
          if (p.ty > H + 20) p.ty = -10;
          break;

        case 1: // Stage 1: Particles pulse outward from center (detection firing)
          angle = (i / particles.length) * Math.PI * 2 + Math.random() * 0.3;
          dist = 40 + Math.random() * Math.min(W, H) * 0.25;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 2: // Stage 2: Three clusters with bridge particles flowing between
          clusterIdx = i % 5;
          if (clusterIdx < 2) {
            // Security cluster (top)
            baseX = cx;
            baseY = cy - Math.min(W, H) * 0.16;
            spread = Math.min(W, H) * 0.06;
          } else if (clusterIdx < 4) {
            // API Design cluster (bottom-left)
            baseX = cx - Math.min(W, H) * 0.15;
            baseY = cy + Math.min(W, H) * 0.12;
            spread = Math.min(W, H) * 0.06;
          } else {
            // Sessions cluster (bottom-right)
            baseX = cx + Math.min(W, H) * 0.15;
            baseY = cy + Math.min(W, H) * 0.12;
            spread = Math.min(W, H) * 0.06;
          }
          p.tx = baseX + (Math.random() - 0.5) * spread;
          p.ty = baseY + (Math.random() - 0.5) * spread;
          break;

        case 3: // Stage 3: Orbital ring accelerating (flywheel)
          angle = (i / particles.length) * Math.PI * 2 + p.phase;
          dist = Math.min(W, H) * 0.16 + (Math.random() - 0.5) * 20;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 4: // Stage 4: Gentle ambient scatter
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
          break;
      }
    }
  }

  var flywheelSpeedMult = 1;

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
      var ease = 0.015 + (currentStage === 0 || currentStage === 4 ? 0 : 0.008);
      p.x += (p.tx - p.x) * ease + p.vx + Math.sin(p.phase) * 0.15;
      p.y += (p.ty - p.y) * ease + p.vy + Math.cos(p.phase) * 0.15;
      p.phase += p.speed;

      // Stage 0: continuously drift particles downward
      if (currentStage === 0) {
        p.ty += 0.3;
        if (p.y > H + 20) {
          p.y = -10;
          p.ty = Math.random() * H;
          p.x = Math.random() * W;
          p.tx = p.x + (Math.random() - 0.5) * 60;
        }
      }

      // Stage 3: slowly rotate targets for flywheel effect
      if (currentStage === 3) {
        var fwCx = W / 2, fwCy = H / 2;
        var fwAngle = Math.atan2(p.ty - fwCy, p.tx - fwCx);
        var fwDist = Math.sqrt((p.tx - fwCx) * (p.tx - fwCx) + (p.ty - fwCy) * (p.ty - fwCy));
        fwAngle += 0.003 + flywheelSpeedMult * 0.002;
        p.tx = fwCx + Math.cos(fwAngle) * fwDist;
        p.ty = fwCy + Math.sin(fwAngle) * fwDist;
      }

      if (currentStage === 4) {
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


  // =====================================================================
  // 3. STAGE 0 — THE DECAY PROBLEM
  // =====================================================================

  var decayTimer = null;
  var decayState = { month: 0, accuracy: 100 };

  var monthData = [
    { month: 'Mar', accuracy: 100, docText: 'POST /api/auth\nAPI key in header', realText: 'POST /api/auth\nAPI key in header' },
    { month: 'Apr', accuracy: 95, docText: 'POST /api/auth\nAPI key in header', realText: 'POST /api/auth\nAPI key in header\nDELETE /api/v1/users \u2014 DEPRECATED' },
    { month: 'May', accuracy: 82, docText: 'POST /api/auth\nAPI key in header', realText: 'POST /api/v2/auth\nOAuth2 bearer token' },
    { month: 'Jun', accuracy: 68, docText: 'POST /api/auth\nAPI key in header', realText: 'POST /api/v2/auth \u2014 OAuth2\nGET /api/v2/tokens \u2014 new\nPOST /api/v2/refresh \u2014 new' },
    { month: 'Jul', accuracy: 45, docText: 'POST /api/auth\nAPI key in header', realText: 'POST /api/v3/auth \u2014 OAuth2 + PKCE\nAll v1 endpoints removed' },
    { month: 'Aug', accuracy: 30, docText: 'POST /api/auth\nAPI key in header', realText: 'POST /api/v3/auth \u2014 OAuth2 + PKCE\nNew SDK required' }
  ];

  function initDecay() {
    clearInterval(decayTimer);
    decayState.month = 0;
    decayState.accuracy = 100;

    // Reset UI
    document.getElementById('docsText').textContent = monthData[0].docText;
    document.getElementById('realityText').textContent = monthData[0].realText;
    document.getElementById('accuracyFill').style.width = '100%';
    document.getElementById('accuracyFill').style.background = 'var(--green)';
    document.getElementById('accuracyLabel').textContent = '100% accurate';
    document.getElementById('divergenceValue').textContent = '0% diverged';
    document.getElementById('decayProgress').style.width = '0';
    document.getElementById('decayScrubber').style.left = '0';
    document.getElementById('decayAlert').classList.remove('visible');

    // Reset month highlights
    var monthEls = document.querySelectorAll('#decayTimeline .timeline-months span');
    for (var m = 0; m < monthEls.length; m++) {
      monthEls[m].classList.toggle('active-month', m === 0);
    }

    // Auto-advance every 1.5 seconds
    decayTimer = setInterval(function() {
      if (currentStage !== 0) { clearInterval(decayTimer); return; }
      decayState.month++;
      if (decayState.month >= monthData.length) {
        clearInterval(decayTimer);
        return;
      }
      updateDecayDisplay(decayState.month);
    }, 1500);
  }

  function updateDecayDisplay(monthIdx) {
    var data = monthData[monthIdx];
    var progress = monthIdx / (monthData.length - 1);

    // Timeline
    document.getElementById('decayProgress').style.width = (progress * 100) + '%';
    document.getElementById('decayScrubber').style.left = 'calc(' + (progress * 100) + '% - 8px)';

    // Highlight active month
    var monthEls = document.querySelectorAll('#decayTimeline .timeline-months span');
    for (var m = 0; m < monthEls.length; m++) {
      monthEls[m].classList.toggle('active-month', m === monthIdx);
    }

    // Docs panel: NEVER changes — that's the whole point
    document.getElementById('docsText').textContent = data.docText;

    // Reality panel: changes every month
    document.getElementById('realityText').textContent = data.realText;

    // Accuracy bar
    var acc = data.accuracy;
    var fill = document.getElementById('accuracyFill');
    fill.style.width = acc + '%';
    if (acc > 80) fill.style.background = 'var(--green)';
    else if (acc > 50) fill.style.background = 'var(--gold)';
    else fill.style.background = 'var(--red)';
    document.getElementById('accuracyLabel').textContent = acc + '% accurate';

    // Divergence
    var divergence = 100 - acc;
    document.getElementById('divergenceValue').textContent = divergence + '% diverged';

    // At Aug: show the user complaint alert
    if (monthIdx === 5) {
      setTimeout(function() {
        document.getElementById('decayAlert').classList.add('visible');
      }, 400);
    }
  }


  // =====================================================================
  // 4. STAGE 1 — DRIFT DETECTION
  // =====================================================================

  var driftDetectTimer = null;
  var driftDetectState = { month: 0 };

  function initDriftDetection() {
    clearInterval(driftDetectTimer);
    driftDetectState.month = 0;

    // Reset UI
    document.getElementById('driftProgress').style.width = '0';
    document.getElementById('driftScrubber').style.left = '0';
    document.getElementById('cvMetric').textContent = '0.05';
    document.getElementById('driftAlert1').classList.remove('visible');
    document.getElementById('driftAlert2').classList.remove('visible');
    document.getElementById('staleEntry').classList.remove('visible');
    document.getElementById('freshEntry').classList.remove('visible');
    document.getElementById('detectionComparison').classList.remove('visible');

    // Reset month highlights
    var monthEls = document.querySelectorAll('#driftTimeline .timeline-months span');
    for (var m = 0; m < monthEls.length; m++) {
      monthEls[m].classList.toggle('active-month', m === 0);
    }

    // Clear radar SVG (keep defs)
    var radarSvg = document.getElementById('radarSvg');
    var defs = radarSvg.querySelector('defs');
    radarSvg.textContent = '';
    if (defs) radarSvg.appendChild(defs);

    // Draw the monitoring indicator (center eye/radar)
    var centerDot = createSvgEl('circle', {
      cx: 250, cy: 90, r: 8,
      fill: 'var(--cyan)',
      opacity: '0.6'
    });
    radarSvg.appendChild(centerDot);
    var monitorLabel = createSvgEl('text', {
      x: 250, y: 130,
      'text-anchor': 'middle',
      fill: 'rgba(0,212,255,0.6)',
      'font-size': '10',
      'font-family': 'JetBrains Mono, monospace'
    });
    monitorLabel.textContent = 'Pi-Brain Monitoring';
    radarSvg.appendChild(monitorLabel);

    // Auto-advance every 2 seconds
    driftDetectTimer = setInterval(function() {
      if (currentStage !== 1) { clearInterval(driftDetectTimer); return; }
      driftDetectState.month++;
      if (driftDetectState.month >= 6) {
        clearInterval(driftDetectTimer);
        return;
      }
      updateDriftDetectionDisplay(driftDetectState.month);
    }, 2000);
  }

  function updateDriftDetectionDisplay(monthIdx) {
    var progress = monthIdx / 5;

    // Timeline
    document.getElementById('driftProgress').style.width = (progress * 100) + '%';
    document.getElementById('driftScrubber').style.left = 'calc(' + (progress * 100) + '% - 8px)';

    // Month highlight
    var monthEls = document.querySelectorAll('#driftTimeline .timeline-months span');
    for (var m = 0; m < monthEls.length; m++) {
      monthEls[m].classList.toggle('active-month', m === monthIdx);
    }

    // At Apr (monthIdx 1): first detection
    if (monthIdx === 1) {
      fireRadarPulse();
      document.getElementById('cvMetric').textContent = '0.22';
      setTimeout(function() {
        document.getElementById('driftAlert1').classList.add('visible');
      }, 800);
    }

    // At May (monthIdx 2): critical detection
    if (monthIdx === 2) {
      fireRadarPulse();
      document.getElementById('cvMetric').textContent = '0.41';
      setTimeout(function() {
        document.getElementById('driftAlert2').classList.add('visible');
      }, 800);
      setTimeout(function() {
        document.getElementById('staleEntry').classList.add('visible');
      }, 1200);
      setTimeout(function() {
        document.getElementById('freshEntry').classList.add('visible');
      }, 1600);
    }

    // At Jun+: show comparison
    if (monthIdx >= 3) {
      document.getElementById('detectionComparison').classList.add('visible');
    }
  }

  function fireRadarPulse() {
    var radarSvg = document.getElementById('radarSvg');
    if (!radarSvg) return;

    for (var rp = 0; rp < 3; rp++) {
      (function(delay) {
        setTimeout(function() {
          if (currentStage !== 1) return;
          var pulse = createSvgEl('circle', {
            cx: 250, cy: 90, r: 10,
            fill: 'none',
            stroke: 'rgba(0,212,255,0.6)',
            'stroke-width': '2',
            filter: 'url(#radarGlow)'
          });
          radarSvg.appendChild(pulse);
          var pulseR = 10;
          var pulseAlpha = 0.6;
          var pulseTimer = setInterval(function() {
            pulseR += 3;
            pulseAlpha -= 0.012;
            if (pulseAlpha <= 0) {
              clearInterval(pulseTimer);
              if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
              return;
            }
            pulse.setAttribute('r', pulseR);
            pulse.setAttribute('stroke', 'rgba(0,212,255,' + pulseAlpha + ')');
          }, 30);
        }, delay * 300);
      })(rp);
    }
  }


  // =====================================================================
  // 5. STAGE 2 — TRANSFER LEARNING
  // =====================================================================

  var transferAnimTimer = null;

  function initTransfer() {
    var transferSvg = document.getElementById('transferSvg');
    if (!transferSvg) return;
    clearInterval(transferAnimTimer);

    // Clear previous content (keep defs)
    var defs = transferSvg.querySelector('defs');
    transferSvg.textContent = '';
    if (defs) transferSvg.appendChild(defs);

    // Reset metrics
    document.getElementById('transferConf').textContent = '0.00';
    document.getElementById('transferDomains').textContent = '0';
    document.getElementById('transferInsights').textContent = '0';
    document.getElementById('transferCaption').classList.remove('visible');

    // Three domain circles in triangle layout
    var domains = [
      { label: 'Security', cx: 300, cy: 70, color: '#00d4ff', dotColor: 'rgba(0,212,255,' },
      { label: 'API Design', cx: 130, cy: 270, color: '#f0c020', dotColor: 'rgba(240,192,32,' },
      { label: 'Sessions', cx: 470, cy: 270, color: '#a855f7', dotColor: 'rgba(168,85,247,' }
    ];

    // Draw domain circles and inner dots
    for (var d = 0; d < domains.length; d++) {
      var dm = domains[d];
      var domGroup = createSvgEl('g');

      // Outer circle
      var outerCircle = createSvgEl('circle', {
        cx: dm.cx, cy: dm.cy, r: 60,
        fill: 'rgba(255,255,255,0.02)',
        stroke: dm.color,
        'stroke-width': '2',
        opacity: '0.5',
        id: 'domain' + d
      });
      domGroup.appendChild(outerCircle);

      // Label
      var label = createSvgEl('text', {
        x: dm.cx, y: dm.cy + 4,
        'text-anchor': 'middle',
        fill: dm.color,
        'font-size': '11',
        'font-family': 'JetBrains Mono, monospace',
        opacity: '0.8'
      });
      label.textContent = dm.label;
      domGroup.appendChild(label);

      // Inner dots (5 per domain)
      for (var dd = 0; dd < 5; dd++) {
        var dAngle = (dd / 5) * Math.PI * 2;
        var dR = 20 + Math.random() * 20;
        var dot = createSvgEl('circle', {
          cx: dm.cx + Math.cos(dAngle) * dR,
          cy: dm.cy + Math.sin(dAngle) * dR,
          r: 3,
          fill: dm.color,
          opacity: '0.3',
          class: 'domain-dot domain-dot-' + d
        });
        domGroup.appendChild(dot);
      }

      transferSvg.appendChild(domGroup);
    }

    // Animate the transfer
    animateTransferSequence(transferSvg, domains);
  }

  function animateTransferSequence(svg, domains) {
    // Phase 1 (after 1s): New insight appears in Security
    setTimeout(function() {
      if (currentStage !== 2) return;

      var insightDot = createSvgEl('circle', {
        cx: 300, cy: 70, r: 6,
        fill: '#00d4ff',
        opacity: '0',
        filter: 'url(#glowTransfer)',
        id: 'insightDot'
      });
      svg.appendChild(insightDot);

      // Pop in
      var popAlpha = 0;
      var popTimer = setInterval(function() {
        popAlpha += 0.05;
        if (popAlpha >= 1) { popAlpha = 1; clearInterval(popTimer); }
        insightDot.setAttribute('opacity', String(popAlpha));
      }, 30);

      var insightLabel = createSvgEl('text', {
        x: 300, y: 25,
        'text-anchor': 'middle',
        fill: 'rgba(0,212,255,0.8)',
        'font-size': '9',
        'font-family': 'JetBrains Mono, monospace',
        id: 'insightLabel'
      });
      insightLabel.textContent = 'Short-lived JWT + refresh tokens';
      svg.appendChild(insightLabel);
    }, 1000);

    // Phase 2 (after 2.5s): Draw bridge paths
    setTimeout(function() {
      if (currentStage !== 2) return;

      // Bridge: Security -> API Design
      var bridge1 = createSvgEl('path', {
        d: 'M 260 110 C 220 170, 160 210, 150 220',
        fill: 'none',
        stroke: 'rgba(240,192,32,0.5)',
        'stroke-width': '2',
        'stroke-dasharray': '300',
        'stroke-dashoffset': '300',
        id: 'bridge1'
      });
      svg.appendChild(bridge1);

      // Bridge: Security -> Sessions
      var bridge2 = createSvgEl('path', {
        d: 'M 340 110 C 380 170, 440 210, 450 220',
        fill: 'none',
        stroke: 'rgba(168,85,247,0.5)',
        'stroke-width': '2',
        'stroke-dasharray': '300',
        'stroke-dashoffset': '300',
        id: 'bridge2'
      });
      svg.appendChild(bridge2);

      // Animate both bridges drawing simultaneously
      var offset = 300;
      var bridgeDrawTimer = setInterval(function() {
        if (currentStage !== 2) { clearInterval(bridgeDrawTimer); return; }
        offset -= 6;
        if (offset < 0) offset = 0;
        bridge1.setAttribute('stroke-dashoffset', String(offset));
        bridge2.setAttribute('stroke-dashoffset', String(offset));
        if (offset <= 0) {
          clearInterval(bridgeDrawTimer);
          // Phase 3: spawn flowing particles
          spawnBridgeParticles(svg);
        }
      }, 30);

      document.getElementById('transferDomains').textContent = '3';
    }, 2500);
  }

  function spawnBridgeParticles(svg) {
    var bridges = [
      { id: 'bridge1', p0: [260, 110], cp: [220, 170], p1: [150, 220] },
      { id: 'bridge2', p0: [340, 110], cp: [380, 170], p1: [450, 220] }
    ];

    var totalSpawned = 0;
    var maxPerBridge = 8;

    for (var b = 0; b < bridges.length; b++) {
      (function(bridge, bridgeIdx) {
        var spawned = 0;
        var spawnTimer = setInterval(function() {
          if (currentStage !== 2 || spawned >= maxPerBridge) { clearInterval(spawnTimer); return; }

          var dot = createSvgEl('circle', {
            r: '3',
            fill: bridgeIdx === 0 ? '#f0c020' : '#a855f7',
            opacity: '0.9',
            filter: 'url(#glowTransfer)'
          });
          svg.appendChild(dot);

          var dist = 0;
          var speed = 3 + Math.random() * 2;
          var pathLen = 300;
          var moveTimer = setInterval(function() {
            if (currentStage !== 2) { clearInterval(moveTimer); return; }
            dist += speed;
            var t = Math.min(dist / pathLen, 1);
            var mt = 1 - t;
            // Quadratic bezier
            var px = mt * mt * bridge.p0[0] + 2 * mt * t * bridge.cp[0] + t * t * bridge.p1[0];
            var py = mt * mt * bridge.p0[1] + 2 * mt * t * bridge.cp[1] + t * t * bridge.p1[1];
            dot.setAttribute('cx', px);
            dot.setAttribute('cy', py);

            if (t >= 1) {
              clearInterval(moveTimer);
              dot.setAttribute('opacity', '0');
              setTimeout(function() {
                if (dot.parentNode) dot.parentNode.removeChild(dot);
              }, 200);

              // Brighten target domain dots
              var targetDots = svg.querySelectorAll('.domain-dot-' + (bridgeIdx + 1));
              for (var td = 0; td < targetDots.length; td++) {
                var curOp = parseFloat(targetDots[td].getAttribute('opacity') || '0.3');
                targetDots[td].setAttribute('opacity', String(Math.min(1, curOp + 0.15)));
              }

              totalSpawned++;
              if (totalSpawned >= maxPerBridge * 2) {
                // Show metrics and caption
                animateValue(document.getElementById('transferConf'), 0, 0.82, 800, 2);
                document.getElementById('transferInsights').textContent = '2';
                document.getElementById('transferCaption').classList.add('visible');
              }
            }
          }, 30);

          spawned++;
        }, 200);
      })(bridges[b], b);
    }
  }


  // =====================================================================
  // 6. STAGE 3 — THE IMPROVEMENT FLYWHEEL
  // =====================================================================

  var flywheelSvg = document.getElementById('flywheelSvg');
  var flywheelTimer = null;
  var flywheelAngle = 0;
  var flywheelCycle = 0;
  var flywheelSpeed = 0.015;
  var flywheelCenterNodes = [];
  var flywheelSuccessShown = false;

  var STATIONS = [
    { label: 'Question', angle: -Math.PI / 2, color: '#00d4ff' },
    { label: 'Answer', angle: -Math.PI / 2 + Math.PI * 2 / 5, color: '#f0c020' },
    { label: 'Vote', angle: -Math.PI / 2 + Math.PI * 4 / 5, color: '#10b981' },
    { label: 'Monitor', angle: -Math.PI / 2 + Math.PI * 6 / 5, color: '#a855f7' },
    { label: 'Transfer', angle: -Math.PI / 2 + Math.PI * 8 / 5, color: '#3b82f6' }
  ];

  function initFlywheel() {
    if (!flywheelSvg) return;
    clearInterval(flywheelTimer);
    flywheelAngle = -Math.PI / 2;
    flywheelCycle = 0;
    flywheelSpeed = 0.015;
    flywheelSpeedMult = 1;
    flywheelCenterNodes = [];
    flywheelSuccessShown = false;

    // Clear SVG
    flywheelSvg.textContent = '';

    var fwCx = 250, fwCy = 200, fwR = 140;

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

    // Traveler glow
    var travGlow = createSvgEl('circle', {
      cx: fwCx + Math.cos(-Math.PI / 2) * fwR,
      cy: fwCy + Math.sin(-Math.PI / 2) * fwR,
      r: 14,
      fill: 'rgba(240,192,32,0.2)',
      id: 'fwTravGlow'
    });
    flywheelSvg.appendChild(travGlow);

    // Traveling dot
    var traveler = createSvgEl('circle', {
      cx: fwCx + Math.cos(-Math.PI / 2) * fwR,
      cy: fwCy + Math.sin(-Math.PI / 2) * fwR,
      r: 7,
      fill: '#f0c020',
      id: 'fwTraveler'
    });
    flywheelSvg.appendChild(traveler);

    // Reset metrics
    document.getElementById('fwQuestions').textContent = '12';
    document.getElementById('fwQuality').textContent = '0.71';
    document.getElementById('fwContrib').textContent = '58';
    document.getElementById('fwDrift').textContent = '3';
    document.getElementById('flywheelCaption').classList.remove('visible');

    // Start animation
    var lastStationIdx = -1;
    var fwCx2 = fwCx, fwCy2 = fwCy, fwR2 = fwR;

    flywheelTimer = setInterval(function() {
      if (currentStage !== 3) { clearInterval(flywheelTimer); return; }

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
            pulseStation(si);
          }
        }
      }

      // Check for cycle completion
      if (normAngle < 0.3 && flywheelAngle > Math.PI) {
        flywheelCycle++;

        // Accelerate: 4s -> 3s -> 2s -> 1.5s
        if (flywheelCycle === 1) flywheelSpeedMult = 1.33;
        else if (flywheelCycle === 2) flywheelSpeedMult = 2;
        else if (flywheelCycle >= 3) flywheelSpeedMult = 2.67;

        // Update metrics
        var qPerDay = 12 + flywheelCycle * (5 + Math.floor(Math.random() * 8));
        var qual = Math.min(0.95, 0.71 + flywheelCycle * 0.02);
        var contrib = 58 + flywheelCycle;
        var driftAlerts = Math.max(0, 3 - flywheelCycle);
        document.getElementById('fwQuestions').textContent = String(qPerDay);
        document.getElementById('fwQuality').textContent = qual.toFixed(2);
        document.getElementById('fwContrib').textContent = String(contrib);
        document.getElementById('fwDrift').textContent = String(driftAlerts);

        // Add center graph node
        addFlywheelCenterNode(fwCx2, fwCy2);

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
          document.getElementById('flywheelCaption').classList.add('visible');
        }
      }

      // Update traveler position
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

  function addFlywheelCenterNode(cx, cy) {
    var maxR = 45;
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

    var dot = createSvgEl('circle', {
      cx: newX, cy: newY, r: 3,
      fill: newNode.color,
      opacity: '0.7'
    });
    centerGroup.appendChild(dot);
  }


  // =====================================================================
  // 7. STAGE 4 — LIVE API + SHARE (JOIN THE COLLECTIVE)
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
          if (data && data.contributors) {
            document.getElementById('liveBadge').textContent =
              'Pi Brain \u00B7 ' + data.contributors + ' contributors \u00B7 Collective Intelligence \u00B7 Live';
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
    badge.textContent = 'You just improved the collective. Quality score updated.';
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

    document.getElementById('shareTitle').value = '';
    document.getElementById('shareContent').value = '';

    var counterEl = document.getElementById('contributionCounter');
    counterEl.textContent = 'Your contribution makes the collective smarter \u2014 #' + shareContribCount;
    counterEl.classList.add('visible');

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
        p.vy += 0.08;
        p.alpha -= 0.012;
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
    // Cancel ongoing animations from other stages
    clearInterval(decayTimer);
    clearInterval(driftDetectTimer);
    clearInterval(transferAnimTimer);
    clearInterval(flywheelTimer);

    if (n === 0) {
      initDecay();
    }
    if (n === 1) {
      initDriftDetection();
    }
    if (n === 2) {
      initTransfer();
    }
    if (n === 3) {
      initFlywheel();
    }
    if (n === 4) {
      initPiBrainLive();
      // Expand particles after a moment
      setTimeout(function() {
        if (currentStage !== 4) return;
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
