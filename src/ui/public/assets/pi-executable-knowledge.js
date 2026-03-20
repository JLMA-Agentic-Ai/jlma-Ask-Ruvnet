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

  // ============================================================
  // PARTICLE FORMATIONS PER STAGE
  // ============================================================
  function setStageTargets(stage) {
    var cx = W / 2, cy = H / 2;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var cols, row, col, cellW, cellH, angle, dist;

      switch (stage) {
        case 0:
          // Organized grid (false order)
          cols = Math.ceil(Math.sqrt(PARTICLE_COUNT * (W / H)));
          var rows = Math.ceil(PARTICLE_COUNT / cols);
          row = Math.floor(i / cols);
          col = i % cols;
          cellW = W / cols;
          cellH = H / rows;
          p.tx = col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.3;
          p.ty = row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.3;
          break;

        case 1:
          // Particles drift downward slowly (decay)
          p.tx = p.x + (Math.random() - 0.5) * 40;
          p.ty = p.y + Math.random() * H * 0.3 + 20;
          if (p.ty > H + 20) p.ty = Math.random() * H * 0.3;
          break;

        case 2:
          // Particles pulse outward from center (detection)
          angle = (i / particles.length) * Math.PI * 2 + Math.random() * 0.2;
          dist = 30 + Math.random() * Math.min(W, H) * 0.28;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 3:
          // Particles sort vertically (quality ranking)
          var band = Math.floor((i / particles.length) * 6);
          var bandY = (band / 6) * H * 0.7 + H * 0.15;
          p.tx = Math.random() * W;
          p.ty = bandY + (Math.random() - 0.5) * (H * 0.08);
          break;

        case 4:
          // Gentle ambient scatter
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
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

      if (currentStage === 1) {
        // Slow downward drift
        p.ty += 0.1;
        if (p.ty > H + 20) { p.ty = -10; p.y = -10; }
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

  // ============================================================
  // 2. STAGE MANAGEMENT
  // ============================================================
  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');
  var stageTimers = [];

  function clearStageTimers() {
    for (var i = 0; i < stageTimers.length; i++) {
      clearTimeout(stageTimers[i]);
    }
    stageTimers = [];
  }

  function stageTimeout(fn, delay) {
    var id = setTimeout(fn, delay);
    stageTimers.push(id);
    return id;
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

    setStageTargets(n);
    triggerStageEffects(n);
  }

  function triggerStageEffects(n) {
    if (n === 0) showHealthDashboard();
    if (n === 1) showSilentDecay();
    if (n === 2) showDriftDetection();
    if (n === 3) showQualityEvolution();
    if (n === 4) initLiveSearch();
  }

  // ============================================================
  // 3. STAGE 0 — "Everything Looks Fine"
  // ============================================================
  function showHealthDashboard() {
    var panel = document.getElementById('dashboardPanel');
    var items = [
      document.getElementById('dashItem0'),
      document.getElementById('dashItem1'),
      document.getElementById('dashItem2'),
      document.getElementById('dashItem3')
    ];
    var rotStats = [
      document.getElementById('rotStat0'),
      document.getElementById('rotStat1'),
      document.getElementById('rotStat2')
    ];
    var caption = document.getElementById('dashCaption');
    var source = document.getElementById('dashSource');

    // Reset
    panel.classList.remove('warning');
    for (var i = 0; i < items.length; i++) items[i].classList.remove('visible');
    for (var j = 0; j < rotStats.length; j++) rotStats[j].classList.remove('visible');
    caption.classList.remove('visible');
    source.classList.remove('visible');

    // 1. Animate dashboard items appearing one by one (300ms stagger)
    for (var k = 0; k < items.length; k++) {
      (function(item, delay) {
        stageTimeout(function() { item.classList.add('visible'); }, delay);
      })(items[k], 300 + k * 300);
    }

    // 2. After 3.5s: flicker dashboard border from green to amber
    stageTimeout(function() {
      panel.classList.add('warning');
    }, 3500);

    // 3. Red stats fade in with stagger
    for (var m = 0; m < rotStats.length; m++) {
      (function(stat, delay) {
        stageTimeout(function() { stat.classList.add('visible'); }, delay);
      })(rotStats[m], 3800 + m * 400);
    }

    // 4. Caption + source
    stageTimeout(function() { caption.classList.add('visible'); }, 5200);
    stageTimeout(function() { source.classList.add('visible'); }, 5600);
  }

  // ============================================================
  // 4. STAGE 1 — "Silent Decay"
  // ============================================================
  var monthData = [
    { month: 'Mar', accuracy: 100, divergence: 0, doc: 'POST /api/auth \u2014 API key in header', real: 'POST /api/auth \u2014 API key in header' },
    { month: 'Apr', accuracy: 95, divergence: 1, doc: 'POST /api/auth \u2014 API key in header', real: 'POST /api/auth \u2014 API key in header\nDELETE /api/v1/users \u2014 DEPRECATED' },
    { month: 'May', accuracy: 82, divergence: 2, doc: 'POST /api/auth \u2014 API key in header', real: 'POST /api/v2/auth \u2014 OAuth2 bearer token' },
    { month: 'Jun', accuracy: 68, divergence: 4, doc: 'POST /api/auth \u2014 API key in header', real: 'POST /api/v2/auth \u2014 OAuth2\nGET /api/v2/tokens \u2014 new\nPOST /api/v2/refresh \u2014 new' },
    { month: 'Jul', accuracy: 45, divergence: 6, doc: 'POST /api/auth \u2014 API key in header', real: 'POST /api/v3/auth \u2014 OAuth2 + PKCE\nAll v1 endpoints removed' },
    { month: 'Aug', accuracy: 30, divergence: 8, doc: 'POST /api/auth \u2014 API key in header', real: 'POST /api/v3/auth \u2014 OAuth2 + PKCE\nNew SDK required\nAPI key auth removed' }
  ];

  var decayInterval = null;

  function showSilentDecay() {
    var months = document.querySelectorAll('.timeline-month');
    var accuracyFill = document.getElementById('accuracyFill');
    var accuracyLabel = document.getElementById('accuracyLabel');
    var docPanel = document.getElementById('docPanel');
    var realityPanel = document.getElementById('realityPanel');
    var divergenceCounter = document.getElementById('divergenceCounter');
    var complaintAlert = document.getElementById('complaintAlert');
    var decayCaption = document.getElementById('decayCaption');

    // Reset
    if (decayInterval) clearInterval(decayInterval);
    for (var i = 0; i < months.length; i++) {
      months[i].classList.remove('active', 'past');
    }
    accuracyFill.style.width = '100%';
    accuracyFill.style.background = 'var(--green)';
    accuracyLabel.textContent = '100%';
    accuracyLabel.style.color = 'var(--green)';
    docPanel.innerHTML = 'POST /api/auth &mdash; API key in header';
    realityPanel.innerHTML = 'POST /api/auth &mdash; API key in header';
    divergenceCounter.classList.remove('visible');
    complaintAlert.classList.remove('visible');
    decayCaption.classList.remove('visible');

    var step = 0;

    function advanceMonth() {
      if (step >= monthData.length) {
        clearInterval(decayInterval);
        // Show complaint alert at the end
        stageTimeout(function() {
          complaintAlert.classList.add('visible');
        }, 400);
        stageTimeout(function() {
          decayCaption.classList.add('visible');
        }, 1200);
        return;
      }

      var data = monthData[step];

      // Update timeline
      for (var m = 0; m < months.length; m++) {
        months[m].classList.remove('active');
        if (m < step) months[m].classList.add('past');
      }
      months[step].classList.add('active');

      // Update accuracy meter
      accuracyFill.style.width = data.accuracy + '%';
      if (data.accuracy >= 80) {
        accuracyFill.style.background = 'var(--green)';
        accuracyLabel.style.color = 'var(--green)';
      } else if (data.accuracy >= 50) {
        accuracyFill.style.background = 'var(--amber)';
        accuracyLabel.style.color = 'var(--amber)';
      } else {
        accuracyFill.style.background = 'var(--red)';
        accuracyLabel.style.color = 'var(--red)';
      }
      accuracyLabel.textContent = data.accuracy + '%';

      // Update panels — doc stays frozen, reality evolves
      docPanel.innerHTML = escapeHtml(data.doc);
      var realLines = data.real.split('\n');
      var realHtml = '';
      for (var r = 0; r < realLines.length; r++) {
        var line = realLines[r];
        // Highlight new/changed lines
        if (data.doc.indexOf(line) === -1 && step > 0) {
          realHtml += '<span class="new-line">' + escapeHtml(line) + '</span>\n';
        } else {
          realHtml += escapeHtml(line) + '\n';
        }
      }
      realityPanel.innerHTML = realHtml.trim();

      // Update divergence
      if (data.divergence > 0) {
        divergenceCounter.classList.add('visible');
        divergenceCounter.innerHTML = '&#9888; Divergence: ' + data.divergence + ' breaking change' + (data.divergence > 1 ? 's' : '');
      }

      step++;
    }

    // Start auto-advancing
    stageTimeout(function() {
      advanceMonth();
      decayInterval = setInterval(advanceMonth, 1500);
    }, 600);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================
  // 5. STAGE 2 — "Knowledge That Watches Itself"
  // ============================================================
  var driftInterval = null;

  function showDriftDetection() {
    var radarContainer = document.getElementById('radarContainer');
    var cvMetric = document.getElementById('cvMetric');
    var alertsDiv = document.getElementById('driftAlerts');
    var gapWithout = document.getElementById('gapWithout');
    var gapWith = document.getElementById('gapWith');
    var driftCaption = document.getElementById('driftCaption');

    // Reset
    if (driftInterval) clearInterval(driftInterval);
    radarContainer.style.display = 'none';
    cvMetric.classList.remove('visible');
    cvMetric.textContent = 'Coefficient of Variation: 0.05';
    alertsDiv.innerHTML = '';
    gapWithout.classList.remove('visible');
    gapWith.classList.remove('visible');
    driftCaption.classList.remove('visible');

    var driftSteps = [
      {
        delay: 800,
        action: function() {
          // Show radar pulse
          radarContainer.style.display = '';
          cvMetric.classList.add('visible');
        }
      },
      {
        delay: 2500,
        action: function() {
          // April: drift detected
          cvMetric.textContent = 'Coefficient of Variation: 0.05 \u2192 0.22';
          var alert1 = document.createElement('div');
          alert1.className = 'drift-alert warning';
          alert1.innerHTML = '<span aria-hidden="true">&#9888;&#65039;</span> <span>API docs drift detected \u2014 1 endpoint may be deprecated</span>';
          alertsDiv.appendChild(alert1);
          stageTimeout(function() { alert1.classList.add('visible'); }, 50);
        }
      },
      {
        delay: 4500,
        action: function() {
          // May: critical drift
          cvMetric.textContent = 'Coefficient of Variation: 0.22 \u2192 0.41';
          var alert2 = document.createElement('div');
          alert2.className = 'drift-alert critical';
          alert2.innerHTML = '<span aria-hidden="true">&#128308;</span> <span>Auth docs critically outdated \u2014 OAuth2 migration detected</span>';
          alertsDiv.appendChild(alert2);
          stageTimeout(function() { alert2.classList.add('visible'); }, 50);
        }
      },
      {
        delay: 6500,
        action: function() {
          // Auto-fix applied
          var alert3 = document.createElement('div');
          alert3.className = 'drift-alert fixed';
          alert3.innerHTML = '<span aria-hidden="true">&#10003;</span> <span>Stale entry flagged \u2014 fresh replacement queued for review</span>';
          alertsDiv.appendChild(alert3);
          stageTimeout(function() { alert3.classList.add('visible'); }, 50);
        }
      },
      {
        delay: 8000,
        action: function() {
          // Detection gap comparison
          gapWithout.classList.add('visible');
          stageTimeout(function() { gapWith.classList.add('visible'); }, 400);
          stageTimeout(function() { driftCaption.classList.add('visible'); }, 1000);
        }
      }
    ];

    for (var s = 0; s < driftSteps.length; s++) {
      (function(step) {
        stageTimeout(step.action, step.delay);
      })(driftSteps[s]);
    }
  }

  // ============================================================
  // 6. STAGE 3 — "Quality That Evolves"
  // ============================================================
  var memories = [
    { title: 'Token bucket + Redis (tested, production)', score: 0.50 },
    { title: 'Sliding window counter', score: 0.50 },
    { title: 'Fixed window (simple but bursty)', score: 0.50 },
    { title: 'API Gateway built-in throttle', score: 0.50 },
    { title: 'nginx rate_limit module', score: 0.50 },
    { title: 'setTimeout retry loop (DON\'T)', score: 0.50 }
  ];

  var voteRounds = [
    // Round 1: best gets 3 up
    { index: 0, delta: 0.25 },
    // Round 2: worst gets 2 down, runner-up gets 2 up
    { index: 5, delta: -0.17 },
    { index: 1, delta: 0.17 },
    // Round 3: best gets 2 more
    { index: 0, delta: 0.14 },
    // Round 4: best confirmed, worst confirmed
    { index: 0, delta: 0.03 },
    { index: 5, delta: -0.10 }
  ];

  function showQualityEvolution() {
    var container = document.getElementById('votingDemo');
    var explainer = document.getElementById('bayesianExplainer');
    var caption = document.getElementById('votingCaption');

    // Reset
    explainer.classList.remove('visible');
    caption.classList.remove('visible');
    container.innerHTML = '';

    // Reset scores
    var scores = [];
    for (var i = 0; i < memories.length; i++) {
      scores.push({ title: memories[i].title, score: 0.50, index: i });
    }

    // Build initial bars
    renderMemoryBars(container, scores);

    // Animate vote rounds
    var roundIndex = 0;

    function nextRound() {
      if (roundIndex >= voteRounds.length) {
        // Show explainer and caption
        stageTimeout(function() { explainer.classList.add('visible'); }, 400);
        stageTimeout(function() { caption.classList.add('visible'); }, 1000);
        return;
      }

      var round = voteRounds[roundIndex];
      scores[round.index].score = Math.max(0.05, Math.min(0.99, scores[round.index].score + round.delta));
      roundIndex++;

      // Sort by score descending
      scores.sort(function(a, b) { return b.score - a.score; });

      // Re-render with transition
      renderMemoryBars(container, scores);

      stageTimeout(nextRound, 1200);
    }

    stageTimeout(nextRound, 1200);
  }

  function renderMemoryBars(container, scores) {
    // Preserve or create bar elements
    var existing = container.querySelectorAll('.memory-bar');
    var needsBuild = existing.length !== scores.length;

    if (needsBuild) {
      container.innerHTML = '';
      for (var i = 0; i < scores.length; i++) {
        var bar = document.createElement('div');
        bar.className = 'memory-bar';
        bar.dataset.memIdx = scores[i].index;

        var label = document.createElement('span');
        label.className = 'memory-label';
        label.textContent = scores[i].title;

        var scoreBar = document.createElement('div');
        scoreBar.className = 'memory-score-bar';
        var fill = document.createElement('div');
        fill.className = 'memory-score-fill';
        fill.style.width = (scores[i].score * 100) + '%';
        fill.style.background = scoreColor(scores[i].score);
        scoreBar.appendChild(fill);

        var val = document.createElement('span');
        val.className = 'memory-score-value';
        val.textContent = scores[i].score.toFixed(2);
        val.style.color = scoreColor(scores[i].score);

        bar.appendChild(label);
        bar.appendChild(scoreBar);
        bar.appendChild(val);
        container.appendChild(bar);
      }
    } else {
      // Update existing bars in new order
      for (var j = 0; j < scores.length; j++) {
        var existBar = existing[j];
        existBar.querySelector('.memory-label').textContent = scores[j].title;
        existBar.querySelector('.memory-score-fill').style.width = (scores[j].score * 100) + '%';
        existBar.querySelector('.memory-score-fill').style.background = scoreColor(scores[j].score);
        existBar.querySelector('.memory-score-value').textContent = scores[j].score.toFixed(2);
        existBar.querySelector('.memory-score-value').style.color = scoreColor(scores[j].score);
        existBar.dataset.memIdx = scores[j].index;
      }
    }
  }

  function scoreColor(score) {
    if (score >= 0.75) return '#00d4ff';
    if (score >= 0.50) return '#f0c020';
    if (score >= 0.35) return '#f59e0b';
    return '#ef4444';
  }

  // ============================================================
  // 7. STAGE 4 — "Try It Live"
  // ============================================================
  var searchWorker = null;
  var workerReady = false;
  var embeddingWorker = null;
  var embeddingReady = false;
  var searchStartTime = 0;
  var fallbackMode = false;
  var realMetadata = null;
  var piSearch = document.getElementById('piSearch');
  var piResults = document.getElementById('piResults');
  var piLatency = document.getElementById('piLatency');

  function initLiveSearch() {
    piSearch.value = '';
    piResults.innerHTML = '';
    piLatency.classList.remove('visible');
    loadRealMetadata();
    initSearchWorker();
    initEmbeddingWorker();
    stageTimeout(function() { piSearch.focus(); }, 500);
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
          piLatency.textContent = msg.message;
          piLatency.classList.add('visible');
        } else if (msg.type === 'ready') {
          workerReady = true;
          piLatency.textContent = msg.vectorCount.toLocaleString() + ' vectors loaded \u2022 ' + (msg.hasWasm ? 'WASM HNSW' : 'brute-force') + ' search ready';
          piLatency.classList.add('visible');
          piSearch.placeholder = 'Search ' + msg.vectorCount.toLocaleString() + ' entries...';
        } else if (msg.type === 'results') {
          var totalElapsed = (performance.now() - searchStartTime).toFixed(1);
          renderSearchResults(msg.results, totalElapsed, msg.method);
        } else if (msg.type === 'error') {
          piLatency.textContent = 'Error: ' + msg.message + ' \u2014 falling back to keyword search';
          piLatency.classList.add('visible');
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
          piLatency.textContent = msg.message;
          piLatency.classList.add('visible');
        } else if (msg.type === 'ready') {
          embeddingReady = true;
          piLatency.textContent = 'Semantic search ready \u2014 AI embeddings active';
          piLatency.classList.add('visible');
          piSearch.placeholder = 'Semantic search across memories...';
        } else if (msg.type === 'embedding') {
          if (workerReady && searchWorker) {
            searchWorker.postMessage({ type: 'search', query: msg.embedding, k: 8 });
          } else {
            var results = fallbackSearch(piSearch.value);
            var elapsed = (performance.now() - searchStartTime).toFixed(1);
            renderSearchResults(results, elapsed, 'keyword (vectors loading)');
          }
        } else if (msg.type === 'error') {
          // silently handle
        }
      };
      embeddingWorker.postMessage({ type: 'init' });
    } catch (err) {
      // embedding worker unavailable
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
          quality_score: entry.q || 0,
          package_name: entry.p || ''
        });
      }
    }
    scored.sort(function(a, b) { return a.distance - b.distance; });
    return scored.slice(0, 5);
  }

  var searchDebounce = null;
  piSearch.addEventListener('input', function() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function() { performSearch(piSearch.value); }, 150);
  });

  function performSearch(query) {
    if (!query.trim()) {
      piResults.innerHTML = '';
      piLatency.classList.remove('visible');
      return;
    }

    searchStartTime = performance.now();

    if (embeddingReady && embeddingWorker) {
      piLatency.textContent = 'Embedding query...';
      piLatency.classList.add('visible');
      embeddingWorker.postMessage({ type: 'embed', text: query });
    } else if (realMetadata) {
      var results = fallbackSearch(query);
      var elapsed = (performance.now() - searchStartTime).toFixed(1);
      var methodLabel = embeddingReady ? 'keyword' : 'keyword (loading AI model...)';
      renderSearchResults(results, elapsed, methodLabel);
    } else {
      loadRealMetadata().then(function() { performSearch(query); });
      piLatency.textContent = 'Loading knowledge base...';
      piLatency.classList.add('visible');
    }
  }

  function renderSearchResults(results, elapsed, method) {
    var methodLabel = method || 'keyword';
    piLatency.textContent = elapsed + 'ms \u2022 ' + results.length + ' results \u2022 ' + methodLabel + ' \u2022 client-side';
    piLatency.classList.add('visible');

    piResults.innerHTML = '';
    for (var j = 0; j < results.length; j++) {
      (function(entry, index) {
        var div = document.createElement('div');
        div.className = 'result-item';
        div.setAttribute('role', 'listitem');

        var scoreSpan = document.createElement('span');
        scoreSpan.className = 'result-score';
        scoreSpan.textContent = entry.distance != null ? (1 - entry.distance).toFixed(2) : (entry.quality_score / 100).toFixed(2);

        var textSpan = document.createElement('span');
        textSpan.className = 'result-text';
        textSpan.textContent = entry.title || entry.text || '';

        var catSpan = document.createElement('span');
        catSpan.className = 'result-category';
        catSpan.textContent = entry.category || entry.cat || '';

        var voteDiv = document.createElement('div');
        voteDiv.className = 'result-vote';

        var upBtn = document.createElement('button');
        upBtn.className = 'vote-btn';
        upBtn.setAttribute('aria-label', 'Upvote');
        upBtn.innerHTML = '&#9650;';
        upBtn.addEventListener('click', function() {
          upBtn.classList.toggle('voted');
          showParticipation();
        });

        var downBtn = document.createElement('button');
        downBtn.className = 'vote-btn';
        downBtn.setAttribute('aria-label', 'Downvote');
        downBtn.innerHTML = '&#9660;';
        downBtn.addEventListener('click', function() {
          downBtn.classList.toggle('voted');
          showParticipation();
        });

        voteDiv.appendChild(upBtn);
        voteDiv.appendChild(downBtn);

        div.appendChild(scoreSpan);
        div.appendChild(textSpan);
        div.appendChild(catSpan);
        div.appendChild(voteDiv);
        piResults.appendChild(div);

        stageTimeout(function() { div.classList.add('visible'); }, index * 80);
      })(results[j], j);
    }
  }

  function showParticipation() {
    var badge = document.getElementById('participationBadge');
    badge.textContent = 'Your vote matters \u2014 you just helped improve collective knowledge quality';
    badge.classList.add('visible');
    stageTimeout(function() { badge.classList.remove('visible'); }, 4000);
  }

  // ============================================================
  // 8. CONTROLS
  // ============================================================
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
      }, 10000);
    } else {
      clearInterval(autoTimer);
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (document.activeElement === piSearch) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goToStage(Math.min(currentStage + 1, TOTAL_STAGES - 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToStage(Math.max(currentStage - 1, 0)); }
  });

  // ============================================================
  // 9. INIT
  // ============================================================
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
