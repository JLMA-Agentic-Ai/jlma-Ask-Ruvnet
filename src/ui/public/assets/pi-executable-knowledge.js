(function() {
  'use strict';

  // ============================================================
  // 1. PARTICLE SYSTEM
  // ============================================================
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
      var angle, dist, clusterIdx, clusterAngle, spread, baseX, baseY, band, ratio;

      switch (stage) {
        case 0: // Random scatter — chaotic unstructured search
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
          break;

        case 1: // 5 clusters — semantic neighborhoods
          clusterIdx = i % 5;
          clusterAngle = (clusterIdx / 5) * Math.PI * 2 - Math.PI / 2;
          spread = Math.min(W, H) * 0.07;
          baseX = cx + Math.cos(clusterAngle) * Math.min(W, H) * 0.2;
          baseY = cy + Math.sin(clusterAngle) * Math.min(W, H) * 0.2;
          p.tx = baseX + (Math.random() - 0.5) * spread;
          p.ty = baseY + (Math.random() - 0.5) * spread;
          break;

        case 2: // Three horizontal bands racing left to right
          band = i % 3;
          p.tx = Math.random() * W * 0.1;
          p.ty = cy - H * 0.15 + band * H * 0.15 + (Math.random() - 0.5) * H * 0.08;
          break;

        case 3: // Three-layer structure (top sparse, middle medium, bottom dense)
          ratio = i / particles.length;
          if (ratio < 0.08) {
            // Layer 2: sparse top
            p.tx = cx + (Math.random() - 0.5) * W * 0.6;
            p.ty = H * 0.15 + (Math.random() - 0.5) * H * 0.08;
          } else if (ratio < 0.3) {
            // Layer 1: medium middle
            p.tx = cx + (Math.random() - 0.5) * W * 0.5;
            p.ty = H * 0.42 + (Math.random() - 0.5) * H * 0.1;
          } else {
            // Layer 0: dense bottom
            p.tx = cx + (Math.random() - 0.5) * W * 0.7;
            p.ty = H * 0.72 + (Math.random() - 0.5) * H * 0.14;
          }
          break;

        case 4: // Three separate card-sized clusters
          clusterIdx = i % 3;
          baseX = W * 0.2 + clusterIdx * W * 0.3;
          baseY = cy;
          spread = Math.min(W, H) * 0.08;
          p.tx = baseX + (Math.random() - 0.5) * spread;
          p.ty = baseY + (Math.random() - 0.5) * spread * 1.2;
          break;

        case 5: // Gentle ambient scatter
          angle = Math.random() * Math.PI * 2;
          dist = Math.random() * Math.min(W, H) * 0.4;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;
      }
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);

    // Subtle radial glow for stages 1-3
    if (currentStage >= 1 && currentStage <= 3) {
      var pcx = W / 2, pcy = H / 2;
      var grd = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, Math.min(W, H) * 0.4);
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

      if (currentStage === 0 || currentStage === 5) {
        if (p.x < -10 || p.x > W + 10) p.tx = Math.random() * W;
        if (p.y < -10 || p.y > H + 10) p.ty = Math.random() * H;
      }

      var rgb = p.color;
      var glowSize = p.r * (currentStage >= 1 && currentStage <= 3 ? 3 : 2);

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


  // ============================================================
  // 2. STAGE MANAGEMENT
  // ============================================================
  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');

  // Active canvas animation frame IDs
  var hnswAnimFrame = 0;
  var embedAnimFrame = 0;

  function stopStageCanvases() {
    if (hnswAnimFrame) { cancelAnimationFrame(hnswAnimFrame); hnswAnimFrame = 0; }
    if (embedAnimFrame) { cancelAnimationFrame(embedAnimFrame); embedAnimFrame = 0; }
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
    if (n === 0) startKeywordDemo();
    if (n === 1) initSemanticDemo();
    if (n === 2) startSpeedRace();
    if (n === 3) initHnswExplainer();
    if (n === 4) showUseCases();
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


  // ============================================================
  // 3. STAGE 0 — KEYWORD SEARCH ANIMATION
  // ============================================================
  var kwTimer = null;
  var kwStreamTimers = [];

  function clearKwTimers() {
    if (kwTimer) { clearInterval(kwTimer); kwTimer = null; }
    for (var i = 0; i < kwStreamTimers.length; i++) {
      clearTimeout(kwStreamTimers[i]);
    }
    kwStreamTimers = [];
  }

  function startKeywordDemo() {
    clearKwTimers();
    var queryEl = document.getElementById('kwQueryText');
    var cursorEl = document.getElementById('kwCursor');
    var resultsEl = document.getElementById('kwResults');
    var missedEl = document.getElementById('kwMissed');
    var captionEl = document.getElementById('kwCaption');

    // Reset
    queryEl.textContent = '';
    resultsEl.innerHTML = '';
    missedEl.classList.remove('visible');
    captionEl.classList.remove('visible');
    cursorEl.style.display = 'inline-block';

    var query = 'app crashes uploading';
    var charIdx = 0;

    // Wrong results
    var wrongResults = [
      { text: 'App crashes on startup — blank screen after splash', highlights: ['App crashes'] },
      { text: 'Uploading photos to gallery freezes for 2 seconds', highlights: ['Uploading'] },
      { text: 'Crash report handler updated to v3.2', highlights: ['Crash'] }
    ];

    // 1. Typewriter the search query
    kwTimer = setInterval(function() {
      if (charIdx < query.length) {
        queryEl.textContent += query[charIdx];
        charIdx++;
      } else {
        clearInterval(kwTimer);
        kwTimer = null;
        cursorEl.style.display = 'none';

        // 2. After 800ms pause, slide in wrong results
        kwStreamTimers.push(setTimeout(function() {
          for (var r = 0; r < wrongResults.length; r++) {
            (function(result, idx) {
              kwStreamTimers.push(setTimeout(function() {
                var item = document.createElement('div');
                item.className = 'keyword-result-item';

                var textSpan = document.createElement('span');
                textSpan.className = 'result-text-kw';
                // Build text with highlighted keywords
                var txt = result.text;
                for (var h = 0; h < result.highlights.length; h++) {
                  var hw = result.highlights[h];
                  var pos = txt.toLowerCase().indexOf(hw.toLowerCase());
                  if (pos !== -1) {
                    var before = txt.substring(0, pos);
                    var match = txt.substring(pos, pos + hw.length);
                    var after = txt.substring(pos + hw.length);
                    txt = before + '<span class="kw-highlight">' + match + '</span>' + after;
                  }
                }
                textSpan.innerHTML = txt;

                var badge = document.createElement('span');
                badge.className = 'keyword-match-badge';
                badge.textContent = 'keyword match';

                item.appendChild(textSpan);
                item.appendChild(badge);
                resultsEl.appendChild(item);

                // Trigger visibility after append
                requestAnimationFrame(function() {
                  item.classList.add('visible');
                });
              }, idx * 200));
            })(wrongResults[r], r);
          }

          // 3. After all wrong results, show the missed result
          kwStreamTimers.push(setTimeout(function() {
            missedEl.classList.add('visible');

            // 4. Show caption
            kwStreamTimers.push(setTimeout(function() {
              captionEl.classList.add('visible');
            }, 600));
          }, wrongResults.length * 200 + 500));
        }, 800));
      }
    }, 40);
  }


  // ============================================================
  // 4. STAGE 1 — SEMANTIC VECTORS
  // ============================================================
  var embedCanvas2, embedCtx2, embedW2, embedH2;
  var embedPoints2 = [];
  var embedInitialized2 = false;
  var embedArrowAnim = null;
  var embedHighlighted = [];

  // Concrete ticket data grouped by topic
  var TICKET_CLUSTERS = [
    { name: 'Upload/Transfer', color: [0, 212, 255], cx: 0.25, cy: 0.35, tickets: [
      'File transfer fails with memory error on large image import',
      'Photo upload timeout on slow connection',
      'Batch image upload corrupts EXIF data',
      'Video upload stalls at 95% progress',
      'Cloud sync fails for files over 50MB',
      'Drag-and-drop upload broken in Firefox',
      'File picker crashes on network drives',
      'Import wizard skips duplicate detection'
    ]},
    { name: 'Crash/Stability', color: [239, 68, 68], cx: 0.72, cy: 0.3, tickets: [
      'App crashes on startup with blank screen',
      'Random crash during background sync',
      'Out-of-memory crash with 100+ tabs',
      'Crash report handler updated to v3.2',
      'Startup hang after OS update',
      'App freezes when switching accounts',
      'Fatal error on corrupted preferences',
      'Crash on minimize while processing'
    ]},
    { name: 'Authentication', color: [168, 85, 247], cx: 0.5, cy: 0.72, tickets: [
      'SSO login fails with SAML timeout',
      'OAuth token refresh loop on mobile',
      'Password reset email never arrives',
      'MFA code rejected after timezone change',
      '2FA backup codes not generating',
      'Session expires during long uploads',
      'API key rotation breaks integrations',
      'LDAP sync misses nested groups'
    ]},
    { name: 'Performance', color: [240, 192, 32], cx: 0.18, cy: 0.7, tickets: [
      'Dashboard takes 12s to load',
      'Search results paginate slowly',
      'Report generation hangs at 80%',
      'Memory leak after 8 hours uptime',
      'CPU spike during index rebuild',
      'Slow query on user analytics page',
      'Cache miss rate spiked after deploy',
      'WebSocket reconnect storm on flaky wifi'
    ]},
    { name: 'UI/Display', color: [16, 185, 129], cx: 0.78, cy: 0.7, tickets: [
      'Dark mode colors unreadable on charts',
      'Modal dialog clips on small screens',
      'Table columns overlap at 1024px width',
      'Tooltip flickers on hover',
      'Font rendering blurry on Windows',
      'Sidebar scroll position resets',
      'Icon alignment broken after update',
      'RTL layout missing for Arabic users'
    ]}
  ];

  // Keyword results from Stage 0 that we show dimmed
  var KEYWORD_WRONG = [
    { text: 'App crashes on startup', cluster: 1, localIdx: 0, sim: 0.31 },
    { text: 'Uploading photos to gallery', cluster: 0, localIdx: 5, sim: 0.28 },
    { text: 'Crash report handler', cluster: 1, localIdx: 3, sim: 0.19 }
  ];

  function boxMuller() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function initSemanticDemo() {
    embedCanvas2 = document.getElementById('embedCanvas');
    var wrap = embedCanvas2.parentElement;
    embedW2 = wrap.clientWidth;
    embedH2 = wrap.clientHeight;
    embedCanvas2.width = embedW2;
    embedCanvas2.height = embedH2;
    embedCtx2 = embedCanvas2.getContext('2d');

    var resultsDiv = document.getElementById('embedResults');
    resultsDiv.innerHTML = '';

    if (!embedInitialized2) {
      embedPoints2 = [];
      var margin = 50;
      var sigma = 28;

      for (var c = 0; c < TICKET_CLUSTERS.length; c++) {
        var cluster = TICKET_CLUSTERS[c];
        var baseCx = margin + cluster.cx * (embedW2 - margin * 2);
        var baseCy = margin + cluster.cy * (embedH2 - margin * 2);

        for (var t = 0; t < cluster.tickets.length; t++) {
          embedPoints2.push({
            x: baseCx + boxMuller() * sigma,
            y: baseCy + boxMuller() * sigma,
            color: cluster.color,
            label: cluster.tickets[t],
            cluster: c,
            localIdx: t,
            highlighted: false,
            dimmed: false,
            sim: 0
          });
        }
      }

      embedInitialized2 = true;
    }

    // Reset highlight states
    for (var i = 0; i < embedPoints2.length; i++) {
      embedPoints2[i].highlighted = false;
      embedPoints2[i].dimmed = false;
      embedPoints2[i].sim = 0;
    }
    embedHighlighted = [];
    embedArrowAnim = null;

    drawEmbedPlot();

    // Auto-fire query after 800ms
    setTimeout(function() {
      fireSemanticQuery();
    }, 800);
  }

  function fireSemanticQuery() {
    // The query "app crashes uploading" lands between upload cluster (0) and crash cluster (1)
    var margin = 50;
    var uploadCluster = TICKET_CLUSTERS[0];
    var crashCluster = TICKET_CLUSTERS[1];
    var qx = margin + ((uploadCluster.cx + crashCluster.cx) / 2) * (embedW2 - margin * 2);
    var qy = margin + ((uploadCluster.cy + crashCluster.cy) / 2) * (embedH2 - margin * 2) - 10;

    // Find the TRUE answer: "File transfer fails with memory error on large image import" — cluster 0, ticket 0
    var trueAnswerIdx = -1;
    for (var i = 0; i < embedPoints2.length; i++) {
      if (embedPoints2[i].cluster === 0 && embedPoints2[i].localIdx === 0) {
        trueAnswerIdx = i;
        break;
      }
    }

    // Calculate distances and find nearest 4
    var dists = [];
    for (var j = 0; j < embedPoints2.length; j++) {
      var dx = qx - embedPoints2[j].x;
      var dy = qy - embedPoints2[j].y;
      var d = Math.sqrt(dx * dx + dy * dy);
      dists.push({ idx: j, d: d });
    }
    dists.sort(function(a, b) { return a.d - b.d; });

    // Top 4 semantic results
    var topResults = dists.slice(0, 4);
    var maxDist = dists[dists.length - 1].d;

    // Assign similarity scores
    for (var k = 0; k < topResults.length; k++) {
      var sim = Math.max(0.1, 1 - (topResults[k].d / maxDist));
      // Scale to realistic range 0.85-0.95
      sim = 0.85 + sim * 0.1;
      embedPoints2[topResults[k].idx].sim = sim;
      embedPoints2[topResults[k].idx].highlighted = true;
    }

    // Dim the keyword wrong results
    for (var w = 0; w < KEYWORD_WRONG.length; w++) {
      var kw = KEYWORD_WRONG[w];
      for (var p = 0; p < embedPoints2.length; p++) {
        if (embedPoints2[p].cluster === kw.cluster && embedPoints2[p].localIdx === kw.localIdx) {
          embedPoints2[p].dimmed = true;
          embedPoints2[p].sim = kw.sim;
          break;
        }
      }
    }

    // Arrow animation from bottom-left to query position
    embedArrowAnim = {
      sx: 40, sy: embedH2 - 40,
      tx: qx, ty: qy,
      progress: 0,
      done: false
    };

    embedHighlighted = topResults;

    // Show result tags below canvas after animation
    setTimeout(function() {
      showEmbedResults(topResults);
    }, 1200);
  }

  function showEmbedResults(topResults) {
    var resultsDiv = document.getElementById('embedResults');
    resultsDiv.innerHTML = '';

    // Show correct results
    for (var i = 0; i < topResults.length; i++) {
      var pt = embedPoints2[topResults[i].idx];
      var tag = document.createElement('span');
      tag.className = 'embed-result-tag correct';
      tag.textContent = pt.sim.toFixed(2) + ' ' + pt.label.substring(0, 40) + (pt.label.length > 40 ? '...' : '');
      resultsDiv.appendChild(tag);
      (function(t) {
        setTimeout(function() { t.classList.add('visible'); }, i * 120);
      })(tag);
    }

    // Show dimmed wrong results
    for (var w = 0; w < KEYWORD_WRONG.length; w++) {
      var wtag = document.createElement('span');
      wtag.className = 'embed-result-tag wrong';
      wtag.textContent = KEYWORD_WRONG[w].sim.toFixed(2) + ' ' + KEYWORD_WRONG[w].text;
      resultsDiv.appendChild(wtag);
      (function(t, delay) {
        setTimeout(function() { t.classList.add('visible'); }, delay);
      })(wtag, (topResults.length + w) * 120);
    }
  }

  function drawEmbedPlot() {
    if (currentStage !== 1) return;
    embedCtx2.clearRect(0, 0, embedW2, embedH2);

    // Arrow animation
    if (embedArrowAnim && !embedArrowAnim.done) {
      embedArrowAnim.progress += 0.025;
      if (embedArrowAnim.progress >= 1) {
        embedArrowAnim.progress = 1;
        embedArrowAnim.done = true;
      }
      var t = embedArrowAnim.progress;
      var et = t * t * (3 - 2 * t); // smoothstep
      var ax = embedArrowAnim.sx + (embedArrowAnim.tx - embedArrowAnim.sx) * et;
      var ay = embedArrowAnim.sy + (embedArrowAnim.ty - embedArrowAnim.sy) * et;

      // Trail particles
      for (var tp = 0; tp < 5; tp++) {
        var tt = Math.max(0, t - tp * 0.05);
        var tet = tt * tt * (3 - 2 * tt);
        var trx = embedArrowAnim.sx + (embedArrowAnim.tx - embedArrowAnim.sx) * tet;
        var trY = embedArrowAnim.sy + (embedArrowAnim.ty - embedArrowAnim.sy) * tet;
        embedCtx2.beginPath();
        embedCtx2.arc(trx, trY, 3 - tp * 0.5, 0, Math.PI * 2);
        embedCtx2.fillStyle = 'rgba(240, 192, 32, ' + (0.6 - tp * 0.1) + ')';
        embedCtx2.fill();
      }

      // Arrow head
      embedCtx2.save();
      embedCtx2.shadowBlur = 12;
      embedCtx2.shadowColor = 'rgba(240, 192, 32, 0.8)';
      embedCtx2.beginPath();
      embedCtx2.arc(ax, ay, 6, 0, Math.PI * 2);
      embedCtx2.fillStyle = 'rgba(240, 192, 32, 0.9)';
      embedCtx2.fill();
      embedCtx2.restore();
    }

    // Draw connection lines for highlighted results
    if (embedArrowAnim && embedArrowAnim.done) {
      for (var h = 0; h < embedHighlighted.length; h++) {
        var hp = embedPoints2[embedHighlighted[h].idx];
        embedCtx2.beginPath();
        embedCtx2.moveTo(embedArrowAnim.tx, embedArrowAnim.ty);
        embedCtx2.lineTo(hp.x, hp.y);
        embedCtx2.strokeStyle = 'rgba(0, 212, 255, 0.35)';
        embedCtx2.lineWidth = 1.5;
        embedCtx2.stroke();
      }

      // Query dot
      embedCtx2.save();
      embedCtx2.shadowBlur = 16;
      embedCtx2.shadowColor = 'rgba(240, 192, 32, 0.8)';
      embedCtx2.beginPath();
      embedCtx2.arc(embedArrowAnim.tx, embedArrowAnim.ty, 6, 0, Math.PI * 2);
      embedCtx2.fillStyle = 'rgba(240, 192, 32, 0.9)';
      embedCtx2.fill();
      embedCtx2.restore();

      // Label "query"
      embedCtx2.font = '10px "JetBrains Mono", monospace';
      embedCtx2.fillStyle = 'rgba(240, 192, 32, 0.7)';
      embedCtx2.fillText('query', embedArrowAnim.tx + 10, embedArrowAnim.ty - 8);
    }

    // Draw all points
    for (var i = 0; i < embedPoints2.length; i++) {
      var pt = embedPoints2[i];
      var rgb = pt.color;
      var alpha = 0.65;
      var radius = 4;

      if (pt.highlighted) {
        alpha = 1;
        radius = 7;
        // Glow
        embedCtx2.save();
        embedCtx2.shadowBlur = 14;
        embedCtx2.shadowColor = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.7)';
        embedCtx2.beginPath();
        embedCtx2.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        embedCtx2.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.95)';
        embedCtx2.fill();
        embedCtx2.restore();

        // Similarity score label
        embedCtx2.font = '9px "JetBrains Mono", monospace';
        embedCtx2.fillStyle = 'rgba(0, 212, 255, 0.9)';
        embedCtx2.fillText(pt.sim.toFixed(2), pt.x + 10, pt.y - 6);

        // Ticket name (truncated)
        embedCtx2.font = '8px "Inter", sans-serif';
        embedCtx2.fillStyle = 'rgba(232, 234, 237, 0.7)';
        var label = pt.label.length > 30 ? pt.label.substring(0, 30) + '...' : pt.label;
        embedCtx2.fillText(label, pt.x + 10, pt.y + 6);
      } else if (pt.dimmed) {
        alpha = 0.25;
        radius = 4;
        // Show as dim with low score
        embedCtx2.beginPath();
        embedCtx2.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        embedCtx2.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
        embedCtx2.fill();

        embedCtx2.font = '8px "JetBrains Mono", monospace';
        embedCtx2.fillStyle = 'rgba(239, 68, 68, 0.5)';
        embedCtx2.fillText(pt.sim.toFixed(2), pt.x + 8, pt.y - 4);
      } else {
        // Normal dot
        embedCtx2.beginPath();
        embedCtx2.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        embedCtx2.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
        embedCtx2.fill();
      }
    }

    // Draw cluster labels
    var margin = 50;
    for (var c = 0; c < TICKET_CLUSTERS.length; c++) {
      var cl = TICKET_CLUSTERS[c];
      var lx = margin + cl.cx * (embedW2 - margin * 2);
      var ly = margin + cl.cy * (embedH2 - margin * 2) - 35;
      embedCtx2.font = '10px "JetBrains Mono", monospace';
      embedCtx2.fillStyle = 'rgba(' + cl.color[0] + ',' + cl.color[1] + ',' + cl.color[2] + ', 0.5)';
      embedCtx2.textAlign = 'center';
      embedCtx2.fillText(cl.name, lx, ly);
    }
    embedCtx2.textAlign = 'start';

    embedAnimFrame = requestAnimationFrame(drawEmbedPlot);
  }


  // ============================================================
  // 5. STAGE 2 — THE SPEED PROBLEM (RACE)
  // ============================================================
  var raceTimer = null;
  var raceScaleTimers = [];
  var raceInitialized = false;

  var RACE_SCALES = [
    { vectors: 100000, bruteMs: 200, treeMs: 15, hnswMs: 0.5, bruteRecall: 100, treeRecall: 92, hnswRecall: 99.5 },
    { vectors: 1000000, bruteMs: 2000, treeMs: 150, hnswMs: 0.8, bruteRecall: 100, treeRecall: 89, hnswRecall: 99.3 },
    { vectors: 10000000, bruteMs: 20000, treeMs: 1500, hnswMs: 1.2, bruteRecall: 100, treeRecall: 85, hnswRecall: 99.1 }
  ];
  var currentRaceScale = 0;

  function clearRaceTimers() {
    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }
    for (var i = 0; i < raceScaleTimers.length; i++) {
      clearTimeout(raceScaleTimers[i]);
    }
    raceScaleTimers = [];
  }

  function startSpeedRace() {
    clearRaceTimers();
    currentRaceScale = 0;

    // Wire scale buttons
    if (!raceInitialized) {
      var scaleBtns = document.querySelectorAll('.scale-btn');
      for (var s = 0; s < scaleBtns.length; s++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            var scaleIdx = parseInt(btn.dataset.scale);
            currentRaceScale = scaleIdx;
            for (var sb = 0; sb < scaleBtns.length; sb++) {
              scaleBtns[sb].classList.toggle('active', sb === scaleIdx);
            }
            runRace(scaleIdx);
          });
        })(scaleBtns[s]);
      }
      raceInitialized = true;
    }

    // Reset all scale buttons
    var allScaleBtns = document.querySelectorAll('.scale-btn');
    for (var r = 0; r < allScaleBtns.length; r++) {
      allScaleBtns[r].classList.toggle('active', r === 0);
    }

    runRace(0);
  }

  function runRace(scaleIdx) {
    clearRaceTimers();
    var scale = RACE_SCALES[scaleIdx];

    // Reset bars
    var bruteFill = document.getElementById('raceBrute');
    var treeFill = document.getElementById('raceTree');
    var hnswFill = document.getElementById('raceHnsw');
    var timeBrute = document.getElementById('timeBrute');
    var timeTree = document.getElementById('timeTree');
    var timeHnsw = document.getElementById('timeHnsw');
    var recallBrute = document.getElementById('recallBrute');
    var recallTree = document.getElementById('recallTree');
    var recallHnsw = document.getElementById('recallHnsw');
    var checkBrute = document.getElementById('checkBrute');
    var checkTree = document.getElementById('checkTree');
    var checkHnsw = document.getElementById('checkHnsw');
    var caption = document.getElementById('raceCaption');

    bruteFill.style.transition = 'none';
    treeFill.style.transition = 'none';
    hnswFill.style.transition = 'none';
    bruteFill.style.width = '0%';
    treeFill.style.width = '0%';
    hnswFill.style.width = '0%';
    timeBrute.textContent = '--';
    timeTree.textContent = '--';
    timeHnsw.textContent = '--';
    recallBrute.textContent = '--';
    recallTree.textContent = '--';
    recallHnsw.textContent = '--';
    checkBrute.classList.remove('visible');
    checkTree.classList.remove('visible');
    checkHnsw.classList.remove('visible');
    checkBrute.style.color = '';
    checkTree.style.color = '';
    checkHnsw.style.color = '';
    caption.classList.remove('visible');

    // Use log scale for visual duration
    // Max visual time = 4 seconds for the slowest algorithm
    var maxVisualMs = 4000;
    var logMax = Math.log10(scale.bruteMs + 1);
    var bruteVisual = maxVisualMs;
    var treeVisual = (Math.log10(scale.treeMs + 1) / logMax) * maxVisualMs;
    var hnswVisual = Math.max(80, (Math.log10(scale.hnswMs + 1) / logMax) * maxVisualMs);

    // Start all races simultaneously
    raceScaleTimers.push(setTimeout(function() {
      // HNSW — finishes almost instantly
      hnswFill.style.transition = 'width ' + hnswVisual + 'ms ease-out';
      hnswFill.style.width = '100%';
      raceScaleTimers.push(setTimeout(function() {
        timeHnsw.textContent = scale.hnswMs + 'ms';
        recallHnsw.textContent = scale.hnswRecall + '% recall';
        recallHnsw.style.color = 'var(--cyan)';
        checkHnsw.style.color = 'var(--cyan)';
        checkHnsw.classList.add('visible');
      }, hnswVisual + 50));

      // Tree — medium speed
      treeFill.style.transition = 'width ' + treeVisual + 'ms ease-out';
      treeFill.style.width = '100%';
      raceScaleTimers.push(setTimeout(function() {
        timeTree.textContent = scale.treeMs + 'ms';
        recallTree.textContent = scale.treeRecall + '% recall';
        recallTree.style.color = 'var(--gold)';
        checkTree.style.color = 'var(--gold)';
        checkTree.classList.add('visible');
      }, treeVisual + 50));

      // Brute — crawls
      bruteFill.style.transition = 'width ' + bruteVisual + 'ms linear';
      bruteFill.style.width = '100%';
      raceScaleTimers.push(setTimeout(function() {
        timeBrute.textContent = (scale.bruteMs >= 1000 ? (scale.bruteMs / 1000) + 's' : scale.bruteMs + 'ms');
        recallBrute.textContent = scale.bruteRecall + '% recall';
        recallBrute.style.color = 'var(--red)';
        checkBrute.style.color = 'var(--red)';
        checkBrute.classList.add('visible');

        // Show caption after brute finishes
        var vectorLabel = scale.vectors >= 1000000 ? (scale.vectors / 1000000) + 'M' : (scale.vectors / 1000) + 'K';
        var bruteLabel = scale.bruteMs >= 1000 ? (scale.bruteMs / 1000) + ' seconds' : scale.bruteMs + 'ms';
        caption.textContent = 'At ' + vectorLabel + ' vectors: brute force takes ' + bruteLabel + '. HNSW: ' + scale.hnswMs + 'ms.';
        caption.classList.add('visible');

        // Auto-advance to next scale after 2s
        if (scaleIdx < 2) {
          raceScaleTimers.push(setTimeout(function() {
            var nextIdx = scaleIdx + 1;
            currentRaceScale = nextIdx;
            var scaleBtns2 = document.querySelectorAll('.scale-btn');
            for (var sb = 0; sb < scaleBtns2.length; sb++) {
              scaleBtns2[sb].classList.toggle('active', sb === nextIdx);
            }
            runRace(nextIdx);
          }, 2500));
        }
      }, bruteVisual + 50));
    }, 300));
  }


  // ============================================================
  // 6. STAGE 3 — HOW HNSW WORKS (EXPLAINER)
  // ============================================================
  var hnswExpCanvas, hnswExpCtx, hnswExpW, hnswExpH;
  var hnswExpInitialized = false;
  var hnswLayers = [];
  var hnswVerticalEdges = [];
  var hnswSearchState = null;
  var hnswSearchStepTimer = null;

  function initHnswExplainer() {
    hnswExpCanvas = document.getElementById('hnswCanvas');
    var wrap = hnswExpCanvas.parentElement;
    hnswExpW = wrap.clientWidth;
    hnswExpH = wrap.clientHeight;
    hnswExpCanvas.width = hnswExpW;
    hnswExpCanvas.height = hnswExpH;
    hnswExpCtx = hnswExpCanvas.getContext('2d');

    var captionEl = document.getElementById('hnswCaption');
    captionEl.textContent = '';
    captionEl.classList.remove('visible');

    // Show layer labels
    var labels = document.querySelectorAll('.hnsw-layer-label');
    for (var l = 0; l < labels.length; l++) {
      (function(label, delay) {
        setTimeout(function() { label.classList.add('visible'); }, delay);
      })(labels[l], l * 200);
    }

    if (!hnswExpInitialized) {
      buildHnswLayers();
      hnswExpInitialized = true;
    }

    hnswSearchState = null;
    if (hnswSearchStepTimer) { clearTimeout(hnswSearchStepTimer); hnswSearchStepTimer = null; }

    drawHnswExplainer();

    // Auto-start search after 1.2s
    setTimeout(function() {
      startHnswSearchAnimation();
    }, 1200);
  }

  function buildHnswLayers() {
    hnswLayers = [[], [], []];
    hnswVerticalEdges = [];
    var margin = 40;

    // Layer 2 (top): 3 nodes spread widely
    var layer2Y = hnswExpH * 0.15;
    var layer2Nodes = [
      { id: 'L2-0', x: hnswExpW * 0.2, y: layer2Y, layer: 2, connections: [], glow: 0, searchVisited: false },
      { id: 'L2-1', x: hnswExpW * 0.5, y: layer2Y, layer: 2, connections: [], glow: 0, searchVisited: false },
      { id: 'L2-2', x: hnswExpW * 0.8, y: layer2Y, layer: 2, connections: [], glow: 0, searchVisited: false }
    ];
    // Connect all L2 nodes (long-range)
    layer2Nodes[0].connections.push(1);
    layer2Nodes[1].connections.push(0, 2);
    layer2Nodes[2].connections.push(1);
    hnswLayers[2] = layer2Nodes;

    // Layer 1 (middle): 8 nodes
    var layer1Y = hnswExpH * 0.48;
    var layer1Nodes = [];
    for (var i = 0; i < 8; i++) {
      layer1Nodes.push({
        id: 'L1-' + i,
        x: margin + (i + 0.5) * ((hnswExpW - margin * 2) / 8),
        y: layer1Y + (Math.random() - 0.5) * 20,
        layer: 1,
        connections: [],
        glow: 0,
        searchVisited: false
      });
    }
    // Connect adjacent + some skips
    for (var j = 0; j < layer1Nodes.length - 1; j++) {
      layer1Nodes[j].connections.push(j + 1);
      layer1Nodes[j + 1].connections.push(j);
    }
    layer1Nodes[0].connections.push(2);
    layer1Nodes[2].connections.push(0);
    layer1Nodes[3].connections.push(6);
    layer1Nodes[6].connections.push(3);
    hnswLayers[1] = layer1Nodes;

    // Layer 0 (bottom): 20 nodes
    var layer0Y = hnswExpH * 0.82;
    var layer0Nodes = [];
    for (var k = 0; k < 20; k++) {
      layer0Nodes.push({
        id: 'L0-' + k,
        x: margin + (k + 0.5) * ((hnswExpW - margin * 2) / 20),
        y: layer0Y + (Math.random() - 0.5) * 16,
        layer: 0,
        connections: [],
        glow: 0,
        searchVisited: false
      });
    }
    // Connect adjacent
    for (var m = 0; m < layer0Nodes.length - 1; m++) {
      layer0Nodes[m].connections.push(m + 1);
      layer0Nodes[m + 1].connections.push(m);
    }
    // Some skip connections
    for (var sk = 0; sk < layer0Nodes.length - 2; sk += 3) {
      if (sk + 2 < layer0Nodes.length) {
        layer0Nodes[sk].connections.push(sk + 2);
        layer0Nodes[sk + 2].connections.push(sk);
      }
    }
    hnswLayers[0] = layer0Nodes;

    // Vertical edges: which nodes exist across layers
    // L2-0 -> L1-1, L2-1 -> L1-4, L2-2 -> L1-6
    hnswVerticalEdges.push({ fromLayer: 2, fromIdx: 0, toLayer: 1, toIdx: 1 });
    hnswVerticalEdges.push({ fromLayer: 2, fromIdx: 1, toLayer: 1, toIdx: 4 });
    hnswVerticalEdges.push({ fromLayer: 2, fromIdx: 2, toLayer: 1, toIdx: 6 });
    // L1 -> L0 mappings
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 0, toLayer: 0, toIdx: 0 });
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 1, toLayer: 0, toIdx: 2 });
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 2, toLayer: 0, toIdx: 4 });
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 3, toLayer: 0, toIdx: 6 });
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 4, toLayer: 0, toIdx: 9 });
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 5, toLayer: 0, toIdx: 12 });
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 6, toLayer: 0, toIdx: 15 });
    hnswVerticalEdges.push({ fromLayer: 1, fromIdx: 7, toLayer: 0, toIdx: 18 });
  }

  function startHnswSearchAnimation() {
    // Reset all nodes
    for (var layer = 0; layer < hnswLayers.length; layer++) {
      for (var n = 0; n < hnswLayers[layer].length; n++) {
        hnswLayers[layer][n].searchVisited = false;
        hnswLayers[layer][n].glow = 0;
      }
    }

    // Target: find node L0-14 (near right side)
    // Entry point: L2-0 (left side — farthest from target)
    var captionEl = document.getElementById('hnswCaption');

    // Search path:
    // L2: start at L2-0, hop to L2-1 (1 hop)
    // Drop to L1: L1-4, follow to L1-5, then L1-6 (3 hops on L1)
    // Drop to L0: L0-15, follow to L0-14 (2 hops on L0)
    // Total: 6 hops

    var searchSteps = [
      { layer: 2, nodeIdx: 0, caption: '' },
      { layer: 2, nodeIdx: 1, caption: 'Layer 2: One hop. Skipped 90% of the graph.' },
      { layer: 1, nodeIdx: 4, caption: 'Dropped to Layer 1.' },
      { layer: 1, nodeIdx: 5, caption: 'Layer 1: Following local connections...' },
      { layer: 1, nodeIdx: 6, caption: 'Layer 1: Three hops. Found the right neighborhood.' },
      { layer: 0, nodeIdx: 15, caption: 'Dropped to Layer 0.' },
      { layer: 0, nodeIdx: 14, caption: 'Layer 0: Two hops. Found the exact answer.' }
    ];

    var stepIdx = 0;

    function doStep() {
      if (stepIdx >= searchSteps.length || currentStage !== 3) return;
      var step = searchSteps[stepIdx];
      hnswLayers[step.layer][step.nodeIdx].searchVisited = true;
      hnswLayers[step.layer][step.nodeIdx].glow = 1.5;

      if (step.caption) {
        captionEl.textContent = step.caption;
        captionEl.classList.add('visible');
      }

      stepIdx++;

      if (stepIdx < searchSteps.length) {
        hnswSearchStepTimer = setTimeout(doStep, 800);
      } else {
        // Final step: show total
        hnswSearchStepTimer = setTimeout(function() {
          captionEl.textContent = '6 hops instead of 20 comparisons. At scale: 30 hops instead of 10 million.';
          // Restart animation after 5s
          hnswSearchStepTimer = setTimeout(function() {
            if (currentStage === 3) startHnswSearchAnimation();
          }, 5000);
        }, 1500);
      }
    }

    // Start query dot
    hnswSearchState = { active: true };
    hnswSearchStepTimer = setTimeout(doStep, 400);
  }

  function drawHnswExplainer() {
    if (currentStage !== 3) return;
    hnswExpCtx.clearRect(0, 0, hnswExpW, hnswExpH);

    var layerColors = [
      [0, 212, 255],   // Layer 0: cyan
      [168, 85, 247],  // Layer 1: purple
      [240, 192, 32]   // Layer 2: gold
    ];
    var layerRadii = [4, 6, 8];

    // Draw layer background bands
    var bandAlpha = 0.03;
    var bands = [
      { y: hnswExpH * 0.7, h: hnswExpH * 0.25, color: layerColors[0] },
      { y: hnswExpH * 0.36, h: hnswExpH * 0.25, color: layerColors[1] },
      { y: hnswExpH * 0.04, h: hnswExpH * 0.22, color: layerColors[2] }
    ];
    for (var b = 0; b < bands.length; b++) {
      hnswExpCtx.fillStyle = 'rgba(' + bands[b].color[0] + ',' + bands[b].color[1] + ',' + bands[b].color[2] + ',' + bandAlpha + ')';
      hnswExpCtx.fillRect(0, bands[b].y, hnswExpW, bands[b].h);
    }

    // Draw vertical edges (dashed)
    hnswExpCtx.setLineDash([4, 4]);
    for (var ve = 0; ve < hnswVerticalEdges.length; ve++) {
      var edge = hnswVerticalEdges[ve];
      var fromNode = hnswLayers[edge.fromLayer][edge.fromIdx];
      var toNode = hnswLayers[edge.toLayer][edge.toIdx];
      hnswExpCtx.beginPath();
      hnswExpCtx.moveTo(fromNode.x, fromNode.y);
      hnswExpCtx.lineTo(toNode.x, toNode.y);
      hnswExpCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      hnswExpCtx.lineWidth = 1;
      hnswExpCtx.stroke();
    }
    hnswExpCtx.setLineDash([]);

    // Draw edges within each layer
    for (var layer = 0; layer < hnswLayers.length; layer++) {
      var nodes = hnswLayers[layer];
      var col = layerColors[layer];

      for (var n = 0; n < nodes.length; n++) {
        var node = nodes[n];
        for (var c = 0; c < node.connections.length; c++) {
          var connIdx = node.connections[c];
          if (connIdx <= n) continue; // avoid drawing twice
          var conn = nodes[connIdx];

          // Check if this edge is part of search trail
          var isSearchEdge = node.searchVisited && conn.searchVisited;

          hnswExpCtx.beginPath();
          hnswExpCtx.moveTo(node.x, node.y);
          hnswExpCtx.lineTo(conn.x, conn.y);

          if (isSearchEdge) {
            hnswExpCtx.save();
            hnswExpCtx.shadowBlur = 10;
            hnswExpCtx.shadowColor = 'rgba(0, 212, 255, 0.6)';
            hnswExpCtx.strokeStyle = 'rgba(0, 212, 255, 0.7)';
            hnswExpCtx.lineWidth = 2.5;
            hnswExpCtx.stroke();
            hnswExpCtx.restore();
          } else {
            hnswExpCtx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ', 0.2)';
            hnswExpCtx.lineWidth = 1;
            hnswExpCtx.stroke();
          }
        }
      }
    }

    // Draw nodes
    for (var layer2 = 0; layer2 < hnswLayers.length; layer2++) {
      var nodes2 = hnswLayers[layer2];
      var col2 = layerColors[layer2];
      var rad = layerRadii[layer2];

      for (var n2 = 0; n2 < nodes2.length; n2++) {
        var nd = nodes2[n2];

        hnswExpCtx.save();
        var glowAmt = 4 + (nd.glow || 0) * 10;
        if (nd.searchVisited) {
          hnswExpCtx.shadowBlur = glowAmt;
          hnswExpCtx.shadowColor = 'rgba(0, 212, 255, 0.8)';
        }

        hnswExpCtx.beginPath();
        hnswExpCtx.arc(nd.x, nd.y, rad + (nd.glow || 0) * 2, 0, Math.PI * 2);

        if (nd.searchVisited) {
          hnswExpCtx.fillStyle = 'rgba(0, 212, 255, 0.95)';
        } else {
          hnswExpCtx.fillStyle = 'rgba(' + col2[0] + ',' + col2[1] + ',' + col2[2] + ', 0.7)';
        }
        hnswExpCtx.fill();
        hnswExpCtx.restore();

        // Decay glow
        if (nd.glow > 0.1) nd.glow *= 0.97;
      }
    }

    // Draw layer labels on canvas
    hnswExpCtx.font = '10px "JetBrains Mono", monospace';
    hnswExpCtx.fillStyle = 'rgba(240, 192, 32, 0.4)';
    hnswExpCtx.fillText('Layer 2', 8, hnswExpH * 0.13);
    hnswExpCtx.fillStyle = 'rgba(168, 85, 247, 0.4)';
    hnswExpCtx.fillText('Layer 1', 8, hnswExpH * 0.46);
    hnswExpCtx.fillStyle = 'rgba(0, 212, 255, 0.4)';
    hnswExpCtx.fillText('Layer 0', 8, hnswExpH * 0.8);

    hnswAnimFrame = requestAnimationFrame(drawHnswExplainer);
  }


  // ============================================================
  // 7. STAGE 4 — WHAT THIS ENABLES
  // ============================================================
  var usecasesBuilt = false;

  function showUseCases() {
    var grid = document.getElementById('usecaseGrid');
    if (usecasesBuilt) {
      // Just re-animate visibility
      var cards = grid.querySelectorAll('.usecase-card');
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('visible');
      }
      setTimeout(function() {
        for (var j = 0; j < cards.length; j++) {
          (function(card, delay) {
            setTimeout(function() { card.classList.add('visible'); }, delay);
          })(cards[j], j * 400);
        }
        animateUsecaseContents();
      }, 100);
      return;
    }

    var cases = [
      {
        icon: '\uD83D\uDD0D', title: 'Codebase Search',
        query: '"Find all code that handles authentication"',
        results: ['login_handler.py (oauth2)', 'auth_middleware.go (jwt)', 'session.ts (cookies)', 'SecurityConfig.java (spring-security)'],
        note: 'Different languages, different terms \u2014 same concept. Keyword search would need 50+ synonyms.'
      },
      {
        icon: '\uD83C\uDFA7', title: 'Support Agent',
        query: '"My dashboard loads slowly after the update"',
        results: ['Ticket #8847: Dashboard render optimization (resolved)', 'Ticket #9102: CSS bundle size regression v2.3', 'Ticket #7654: Lazy loading fix for widget grid'],
        note: 'Customer describes symptoms. HNSW finds solutions \u2014 in under 1ms across 100K tickets.'
      },
      {
        icon: '\uD83D\uDCDA', title: 'Knowledge Discovery',
        query: '"What do we know about caching?"',
        results: ['Architecture Decision: Redis vs Memcached (2024)', 'Bug: Cache invalidation race condition (#445)', 'Slack: @sarah\'s caching strategy proposal', 'Design doc: CDN cache headers v2'],
        note: 'Architecture docs, bug reports, Slack threads, design docs \u2014 all semantically related, never tagged.'
      }
    ];

    grid.innerHTML = '';
    for (var c = 0; c < cases.length; c++) {
      var uc = cases[c];
      var card = document.createElement('div');
      card.className = 'usecase-card';
      card.dataset.caseIdx = c;

      var header = document.createElement('div');
      header.className = 'usecase-header';
      var iconSpan = document.createElement('span');
      iconSpan.className = 'usecase-icon';
      iconSpan.textContent = uc.icon;
      var titleSpan = document.createElement('span');
      titleSpan.className = 'usecase-title';
      titleSpan.textContent = uc.title;
      header.appendChild(iconSpan);
      header.appendChild(titleSpan);

      var queryDiv = document.createElement('div');
      queryDiv.className = 'usecase-query';
      queryDiv.dataset.queryText = uc.query;

      var resultsDiv = document.createElement('div');
      resultsDiv.className = 'usecase-results';
      for (var r = 0; r < uc.results.length; r++) {
        var rItem = document.createElement('div');
        rItem.className = 'usecase-result-item';
        rItem.textContent = uc.results[r];
        resultsDiv.appendChild(rItem);
      }

      var noteDiv = document.createElement('div');
      noteDiv.className = 'usecase-note';
      noteDiv.textContent = uc.note;

      card.appendChild(header);
      card.appendChild(queryDiv);
      card.appendChild(resultsDiv);
      card.appendChild(noteDiv);
      grid.appendChild(card);
    }

    usecasesBuilt = true;

    // Stagger card visibility
    setTimeout(function() {
      var allCards = grid.querySelectorAll('.usecase-card');
      for (var j = 0; j < allCards.length; j++) {
        (function(card, delay) {
          setTimeout(function() { card.classList.add('visible'); }, delay);
        })(allCards[j], j * 400);
      }
      animateUsecaseContents();
    }, 100);
  }

  function animateUsecaseContents() {
    var cards = document.querySelectorAll('.usecase-card');
    for (var c = 0; c < cards.length; c++) {
      (function(card, cardDelay) {
        var queryDiv = card.querySelector('.usecase-query');
        var queryText = queryDiv.dataset.queryText || '';
        var resultItems = card.querySelectorAll('.usecase-result-item');
        var noteDiv = card.querySelector('.usecase-note');

        // Typewriter for query
        queryDiv.textContent = '';
        var charIdx = 0;
        setTimeout(function() {
          var typeTimer = setInterval(function() {
            if (charIdx < queryText.length) {
              queryDiv.textContent += queryText[charIdx];
              charIdx++;
            } else {
              clearInterval(typeTimer);

              // Slide in results
              for (var r = 0; r < resultItems.length; r++) {
                (function(item, delay) {
                  setTimeout(function() { item.classList.add('visible'); }, delay);
                })(resultItems[r], r * 150);
              }

              // Fade in note
              setTimeout(function() {
                noteDiv.classList.add('visible');
              }, resultItems.length * 150 + 200);
            }
          }, 25);
        }, cardDelay);
      })(cards[c], c * 400 + 600);
    }
  }


  // ============================================================
  // 8. STAGE 5 — LIVE SEARCH (Pi-Brain)
  // ============================================================
  var piSearchEl = document.getElementById('piSearch');
  var piResultsEl = document.getElementById('piResults');
  var piLatencyEl = document.getElementById('piLatency');
  var participationBadge = document.getElementById('participationBadge');
  var piSearchDebounce = null;
  var piSearchStartTime = 0;
  var piInitialized = false;

  // Simulated fallback data
  var SIMULATED_MEMORIES = [
    { title: 'HNSW Graph Construction Algorithm', category: 'vectors', quality: 92 },
    { title: 'Bayesian Quality Voting with Beta Distribution', category: 'algorithms', quality: 88 },
    { title: 'Self-Optimizing Neural Architecture (SONA)', category: 'neural', quality: 95 },
    { title: 'MinCut Graph Partitioning for Knowledge Clusters', category: 'architecture', quality: 90 },
    { title: 'Transfer Learning Between Knowledge Domains', category: 'neural', quality: 85 },
    { title: 'Differential Privacy in Collective Intelligence', category: 'security', quality: 87 },
    { title: 'MicroLoRA Federated Learning Protocol', category: 'neural', quality: 91 },
    { title: 'Witness Chain Cryptographic Provenance', category: 'security', quality: 89 },
    { title: 'Cosine Similarity vs HNSW Performance Comparison', category: 'performance', quality: 93 },
    { title: 'Embedding Dimensions and Quality Tradeoffs', category: 'vectors', quality: 86 }
  ];

  function initPiBrainLive() {
    if (piInitialized) return;
    piInitialized = true;

    piSearchEl.addEventListener('input', function() {
      clearTimeout(piSearchDebounce);
      piSearchDebounce = setTimeout(function() {
        performPiSearch(piSearchEl.value);
      }, 150);
    });

    piLatencyEl.textContent = 'This is searching 965 expert memories in under 5ms. The same HNSW algorithm, running live.';
    piLatencyEl.classList.add('visible');
    setTimeout(function() { piSearchEl.focus(); }, 500);
  }

  function performPiSearch(query) {
    if (!query.trim()) {
      piResultsEl.innerHTML = '';
      piLatencyEl.textContent = 'This is searching 965 expert memories in under 5ms. The same HNSW algorithm, running live.';
      piLatencyEl.classList.add('visible');
      return;
    }

    piSearchStartTime = performance.now();

    // Try live API first, fall back to simulated
    fetch('https://pi.ruv.io/v1/memories/search?q=' + encodeURIComponent(query) + '&limit=5')
      .then(function(r) {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then(function(data) {
        var elapsed = (performance.now() - piSearchStartTime).toFixed(1);
        var results = (data.memories || data.results || data || []).slice(0, 5);
        renderPiResults(results.map(function(m) {
          return {
            title: m.title || m.content || '',
            category: m.category || m.knowledge_type || '',
            quality: m.quality_score || Math.floor((m.quality || 0.8) * 100),
            id: m.id || ''
          };
        }), elapsed, 'HNSW semantic');
      })
      .catch(function() {
        // Fallback to simulated search
        var q = query.toLowerCase();
        var scored = [];
        for (var i = 0; i < SIMULATED_MEMORIES.length; i++) {
          var entry = SIMULATED_MEMORIES[i];
          var titleLower = entry.title.toLowerCase();
          var catLower = entry.category.toLowerCase();
          var score = 0;
          var words = q.split(/\s+/);
          for (var w = 0; w < words.length; w++) {
            if (titleLower.indexOf(words[w]) !== -1) score += 0.3;
            if (catLower.indexOf(words[w]) !== -1) score += 0.15;
          }
          if (titleLower.indexOf(q) !== -1) score += 0.5;
          if (score > 0) {
            scored.push({ title: entry.title, category: entry.category, quality: entry.quality, score: score });
          }
        }
        scored.sort(function(a, b) { return b.score - a.score; });
        if (scored.length === 0) {
          // Return top 3 by quality as fallback
          scored = SIMULATED_MEMORIES.slice(0, 3).map(function(m) {
            return { title: m.title, category: m.category, quality: m.quality, score: 0.5 };
          });
        }
        var elapsed = (performance.now() - piSearchStartTime).toFixed(1);
        renderPiResults(scored.slice(0, 5), elapsed, 'simulated HNSW');
      });
  }

  function renderPiResults(results, elapsed, method) {
    piLatencyEl.textContent = elapsed + 'ms \u2022 ' + results.length + ' results \u2022 ' + method;
    piLatencyEl.classList.add('visible');

    piResultsEl.innerHTML = '';
    for (var j = 0; j < results.length; j++) {
      (function(entry, index) {
        var div = document.createElement('div');
        div.className = 'result-item';
        div.setAttribute('role', 'listitem');

        var scoreSpan = document.createElement('span');
        scoreSpan.className = 'result-score';
        scoreSpan.textContent = (entry.quality / 100).toFixed(2);

        var textSpan = document.createElement('span');
        textSpan.className = 'result-text';
        textSpan.textContent = entry.title;

        var catSpan = document.createElement('span');
        catSpan.className = 'result-category';
        catSpan.textContent = entry.category;

        var voteDiv = document.createElement('div');
        voteDiv.className = 'result-vote';
        var upBtn = document.createElement('button');
        upBtn.className = 'vote-btn';
        upBtn.textContent = '\u25B2';
        upBtn.setAttribute('aria-label', 'Vote up');
        var downBtn = document.createElement('button');
        downBtn.className = 'vote-btn';
        downBtn.textContent = '\u25BC';
        downBtn.setAttribute('aria-label', 'Vote down');

        upBtn.addEventListener('click', function() {
          upBtn.classList.add('voted');
          showParticipation();
          // Try live vote
          if (entry.id) {
            fetch('https://pi.ruv.io/v1/memories/' + entry.id + '/vote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ direction: 'up' })
            }).catch(function() {});
          }
        });
        downBtn.addEventListener('click', function() {
          downBtn.classList.add('voted');
          showParticipation();
        });

        voteDiv.appendChild(upBtn);
        voteDiv.appendChild(downBtn);

        div.appendChild(scoreSpan);
        div.appendChild(textSpan);
        div.appendChild(catSpan);
        div.appendChild(voteDiv);
        piResultsEl.appendChild(div);

        setTimeout(function() { div.classList.add('visible'); }, index * 80);
      })(results[j], j);
    }
  }

  function showParticipation() {
    participationBadge.textContent = 'You just participated in collective intelligence';
    participationBadge.classList.add('visible');
  }


  // ============================================================
  // 9. CONTROLS & INIT
  // ============================================================
  prevBtn.addEventListener('click', function() { goToStage(currentStage - 1); });
  nextBtn.addEventListener('click', function() {
    if (currentStage === (TOTAL_STAGES - 1)) goToStage(0);
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
    if (document.activeElement === piSearchEl) return;
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
    // Re-init canvases on resize
    if (currentStage === 1) { embedInitialized2 = false; initSemanticDemo(); }
    if (currentStage === 3) { hnswExpInitialized = false; initHnswExplainer(); }
  });
  initParticles();
  setStageTargets(0);
  drawParticles();
  triggerStageEffects(0);
})();
