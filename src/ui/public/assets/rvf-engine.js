(function() {
  'use strict';

  // --- Particle System ---
  var canvas = document.getElementById('particleCanvas');
  var ctx = canvas.getContext('2d');
  var W, H;
  var PARTICLE_COUNT = 1800;
  var currentStage = 0;
  var particles = [];
  var animating = true;
  var autoPlay = false;
  var autoTimer = null;

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
      var angle, dist, maxR, d, section, groupAngle, spread, baseX, baseY;

      switch (stage) {
        case 0:
          p.tx = Math.random() * W;
          p.ty = Math.random() * H;
          break;

        case 1:
          angle = (i / particles.length) * Math.PI * 2 + Math.random() * 0.3;
          dist = 40 + Math.random() * Math.min(W, H) * 0.25;
          p.tx = cx + Math.cos(angle) * dist;
          p.ty = cy + Math.sin(angle) * dist;
          break;

        case 2:
          angle = (i / particles.length) * Math.PI * 2;
          maxR = Math.min(W, H) * 0.14;
          d = Math.sqrt(Math.random()) * maxR;
          p.tx = cx + Math.cos(angle + i * 0.01) * d;
          p.ty = cy + Math.sin(angle + i * 0.01) * d;
          break;

        case 3:
          section = i % 4;
          groupAngle = (section / 4) * Math.PI * 2;
          spread = Math.min(W, H) * 0.08;
          baseX = cx + Math.cos(groupAngle) * Math.min(W, H) * 0.12;
          baseY = cy + Math.sin(groupAngle) * Math.min(W, H) * 0.12;
          p.tx = baseX + (Math.random() - 0.5) * spread;
          p.ty = baseY + (Math.random() - 0.5) * spread;
          break;

        case 4:
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

  // --- Stage Management ---
  var stages = document.querySelectorAll('.stage-content');
  var dots = document.querySelectorAll('.stage-dot');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var autoBtn = document.getElementById('autoBtn');
  var counter = document.getElementById('stageCounter');

  function goToStage(n) {
    if (n < 0 || n > 4) return;
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
    nextBtn.textContent = n === 4 ? 'Restart' : 'Next \u2192';
    counter.textContent = (n + 1) + ' / 5';

    setStageTargets(n);
    triggerStageEffects(n);
  }

  function triggerStageEffects(n) {
    if (n === 0) {
      var countEls = document.querySelectorAll('#stage0 [data-count]');
      for (var i = 0; i < countEls.length; i++) {
        animateCount(countEls[i], parseInt(countEls[i].dataset.count));
      }
    }

    if (n === 1) {
      setTimeout(function() {
        document.getElementById('barRaw').classList.add('animate');
        setTimeout(function() { document.getElementById('barRvf').classList.add('animate'); }, 400);
      }, 300);
    } else {
      document.getElementById('barRaw').classList.remove('animate');
      document.getElementById('barRvf').classList.remove('animate');
    }

    if (n === 2) {
      buildSegments();
      lightUpSegments();
      showKeySegments();
    }

    if (n === 3) {
      animateWasmFlow();
    }

    if (n === 4) {
      document.getElementById('demoSearch').value = '';
      document.getElementById('searchResults').textContent = '';
      document.getElementById('latencyBadge').classList.remove('visible');
      loadRealMetadata();
      initSearchWorker();
      initEmbeddingWorker();
      setTimeout(function() { document.getElementById('demoSearch').focus(); }, 500);
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

  function buildSegments() {
    var ring = document.getElementById('segmentRing');
    if (ring.children.length > 0) return;
    var ringR = 130;
    for (var i = 0; i < 24; i++) {
      var angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
      var x = Math.cos(angle) * ringR + ringR + 10;
      var y = Math.sin(angle) * ringR + ringR + 10;
      var seg = document.createElement('div');
      seg.className = 'segment';
      var isKey = i <= 6;
      seg.style.cssText = 'left:' + x + 'px; top:' + y + 'px; color: ' + (isKey ? 'var(--cyan)' : 'var(--purple)') + '; background: ' + (isKey ? 'var(--cyan)' : 'var(--purple)') + ';';
      seg.dataset.index = i;
      ring.appendChild(seg);
    }
  }

  function lightUpSegments() {
    var segs = document.querySelectorAll('#segmentRing .segment');
    for (var i = 0; i < segs.length; i++) {
      (function(seg, delay) {
        setTimeout(function() { seg.classList.add('lit'); }, delay);
      })(segs[i], i * 120);
    }
  }

  function showKeySegments() {
    var badges = document.querySelectorAll('#keySegments .key-seg');
    for (var i = 0; i < badges.length; i++) {
      (function(badge, delay) {
        setTimeout(function() { badge.classList.add('visible'); }, delay);
      })(badges[i], 600 + i * 150);
    }
  }

  function animateWasmFlow() {
    var flow = document.getElementById('wasmFlow');
    var steps = flow.querySelectorAll('.flow-step');
    var arrows = flow.querySelectorAll('.flow-arrow');

    for (var i = 0; i < steps.length; i++) steps[i].classList.remove('visible');
    for (var j = 0; j < arrows.length; j++) arrows[j].classList.remove('visible');

    for (var k = 0; k < steps.length; k++) {
      (function(step, arrow, idx) {
        setTimeout(function() {
          step.classList.add('visible');
          if (idx > 0 && arrow) arrow.classList.add('visible');
        }, idx * 500);
      })(steps[k], arrows[k - 1], k);
    }
  }

  // --- Live demo search (WASM-powered) ---
  var searchWorker = null;
  var workerReady = false;
  var embeddingWorker = null;
  var embeddingReady = false;
  var searchStartTime = 0;
  var demoSearch = document.getElementById('demoSearch');
  var searchResults = document.getElementById('searchResults');
  var latencyBadge = document.getElementById('latencyBadge');

  function initSearchWorker() {
    if (searchWorker) return;
    try {
      searchWorker = new Worker('/assets/rvf-search-worker.js');
      searchWorker.onmessage = function(e) {
        var msg = e.data;
        if (msg.type === 'progress') {
          latencyBadge.textContent = msg.message;
          latencyBadge.classList.add('visible');
        } else if (msg.type === 'ready') {
          workerReady = true;
          latencyBadge.textContent = msg.vectorCount.toLocaleString() + ' vectors loaded \u2022 ' + (msg.hasWasm ? 'WASM HNSW' : 'brute-force') + ' search ready';
          latencyBadge.classList.add('visible');
          demoSearch.placeholder = 'Search ' + msg.vectorCount.toLocaleString() + ' entries...';
        } else if (msg.type === 'results') {
          var totalElapsed = (performance.now() - searchStartTime).toFixed(1);
          renderResults(msg.results, totalElapsed, msg.method);
          if (containerSearchPending) {
            containerSearchPending = false;
            renderContainerResults(msg.results, totalElapsed, msg.method);
          }
        } else if (msg.type === 'error') {
          latencyBadge.textContent = 'Error: ' + msg.message + ' \u2014 falling back to keyword search';
          latencyBadge.classList.add('visible');
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
          latencyBadge.textContent = msg.message;
          latencyBadge.classList.add('visible');
        } else if (msg.type === 'ready') {
          embeddingReady = true;
          latencyBadge.textContent = 'Semantic search ready \u2014 AI embeddings active';
          latencyBadge.classList.add('visible');
          demoSearch.placeholder = 'Semantic search across 103,755 entries...';
          initWebLLM();
        } else if (msg.type === 'embedding') {
          if (workerReady && searchWorker) {
            searchWorker.postMessage({ type: 'search', query: msg.embedding, k: 8 });
          } else {
            var results = fallbackSearch(demoSearch.value);
            var elapsed = (performance.now() - searchStartTime).toFixed(1);
            renderResults(results, elapsed, 'keyword (vectors loading)');
          }
        } else if (msg.type === 'error') {
          console.warn('Embedding error:', msg.message);
        }
      };
      embeddingWorker.postMessage({ type: 'init' });
    } catch (err) {
      console.warn('Embedding worker failed:', err);
    }
  }

  var fallbackMode = false;
  var realMetadata = null;

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
  demoSearch.addEventListener('input', function() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function() { performSearch(demoSearch.value); }, 150);
  });

  function performSearch(query) {
    if (!query.trim()) {
      searchResults.textContent = '';
      latencyBadge.classList.remove('visible');
      return;
    }

    searchStartTime = performance.now();

    if (embeddingReady && embeddingWorker) {
      latencyBadge.textContent = 'Embedding query...';
      latencyBadge.classList.add('visible');
      embeddingWorker.postMessage({ type: 'embed', text: query });
    } else if (realMetadata) {
      var results = fallbackSearch(query);
      var elapsed = (performance.now() - searchStartTime).toFixed(1);
      var methodLabel = embeddingReady ? 'keyword' : 'keyword (loading AI model...)';
      renderResults(results, elapsed, methodLabel);
    } else {
      loadRealMetadata().then(function() { performSearch(query); });
      latencyBadge.textContent = 'Loading knowledge base...';
      latencyBadge.classList.add('visible');
    }
  }

  function renderResults(results, elapsed, method) {
    var methodLabel = method || 'keyword';
    latencyBadge.textContent = elapsed + 'ms \u2022 ' + results.length + ' results \u2022 ' + methodLabel + ' \u2022 client-side';
    latencyBadge.classList.add('visible');

    searchResults.textContent = '';
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

        div.appendChild(scoreSpan);
        div.appendChild(textSpan);
        div.appendChild(catSpan);
        searchResults.appendChild(div);

        setTimeout(function() { div.classList.add('visible'); }, index * 80);
      })(results[j], j);
    }
  }

  // --- Controls ---
  prevBtn.addEventListener('click', function() { goToStage(currentStage - 1); });
  nextBtn.addEventListener('click', function() {
    if (currentStage === 4) goToStage(0);
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
        if (currentStage < 4) goToStage(currentStage + 1);
        else { autoPlay = false; autoBtn.textContent = '\u25B6 Auto'; clearInterval(autoTimer); }
      }, 6000);
    } else {
      clearInterval(autoTimer);
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (document.activeElement === demoSearch) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goToStage(Math.min(currentStage + 1, 4)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToStage(Math.max(currentStage - 1, 0)); }
  });

  // --- Container Mode ---
  var containerActive = false;
  var goldContent = null;
  var containerSearchPending = false;

  function enterContainerMode() {
    containerActive = true;
    document.getElementById('containerMode').classList.add('active');
    var cSearch = document.getElementById('containerSearch');
    var cDebounce = null;
    cSearch.addEventListener('input', function() {
      clearTimeout(cDebounce);
      cDebounce = setTimeout(function() { containerPerformSearch(cSearch.value); }, 150);
    });
    if (realMetadata) buildCategories();
    else loadRealMetadata().then(buildCategories);
    buildDocsGrid();
  }

  function exitContainerMode() {
    containerActive = false;
    document.getElementById('containerMode').classList.remove('active');
  }

  function switchContainerTab(tab) {
    document.querySelectorAll('.container-tabs .tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelector('.container-tabs .tab[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById('tabSearch').style.display = tab === 'search' ? '' : 'none';
    document.getElementById('tabBrowse').style.display = tab === 'browse' ? '' : 'none';
    document.getElementById('tabDocs').style.display = tab === 'docs' ? '' : 'none';
  }

  function containerPerformSearch(query) {
    if (!query.trim()) {
      document.getElementById('containerResults').textContent = '';
      document.getElementById('containerLatency').textContent = '';
      document.getElementById('answerPanel').classList.remove('active');
      return;
    }
    var mode = document.querySelector('input[name="cSearchMode"]:checked').value;
    searchStartTime = performance.now();

    if (mode === 'semantic' && embeddingReady) {
      document.getElementById('containerLatency').textContent = 'Embedding query...';
      containerSearchPending = true;
      embeddingWorker.postMessage({ type: 'embed', text: query });
    } else if (mode === 'ask' && llmReady) {
      askBrain(query);
    } else {
      var results = fallbackSearch(query);
      var elapsed = (performance.now() - searchStartTime).toFixed(1);
      renderContainerResults(results, elapsed, 'keyword');
    }
  }

  function renderContainerResults(results, elapsed, method) {
    var container = document.getElementById('containerResults');
    var badge = document.getElementById('containerLatency');
    badge.textContent = elapsed + 'ms \u2022 ' + results.length + ' results \u2022 ' + method;
    container.textContent = '';
    for (var j = 0; j < results.length; j++) {
      (function(entry, index) {
        var div = document.createElement('div');
        div.className = 'entry-item';
        div.dataset.entryData = JSON.stringify({
          title: entry.title,
          category: entry.category,
          quality_score: entry.quality_score,
          id: entry.id,
          knowledge_type: entry.knowledge_type,
          package_name: entry.package_name
        });
        var score = document.createElement('span');
        score.className = 'entry-score';
        score.textContent = entry.quality_score || (entry.distance != null ? ((1 - entry.distance) * 100).toFixed(0) : '\u2014');
        var title = document.createElement('span');
        title.className = 'entry-title';
        title.textContent = entry.title || '';
        var cat = document.createElement('span');
        cat.className = 'entry-cat';
        cat.textContent = entry.category || '';
        div.appendChild(score);
        div.appendChild(title);
        div.appendChild(cat);
        container.appendChild(div);
        setTimeout(function() { div.style.opacity = '1'; }, index * 40);
      })(results[j], j);
    }
  }

  // --- Browse Tab ---
  function buildCategories() {
    if (!realMetadata) return;
    var cats = {};
    for (var i = 0; i < realMetadata.length; i++) {
      var c = realMetadata[i].c || 'uncategorized';
      if (!cats[c]) cats[c] = 0;
      cats[c]++;
    }
    var browseContent = document.getElementById('browseContent');
    var sorted = Object.entries(cats).sort(function(a, b) { return b[1] - a[1]; });
    var grid = document.createElement('div');
    grid.className = 'category-grid';
    for (var s = 0; s < sorted.length; s++) {
      var card = document.createElement('div');
      card.className = 'category-card';
      card.dataset.category = sorted[s][0];
      var nameDiv = document.createElement('div');
      nameDiv.className = 'cat-name';
      nameDiv.textContent = sorted[s][0];
      var countDiv = document.createElement('div');
      countDiv.className = 'cat-count';
      countDiv.textContent = sorted[s][1].toLocaleString() + ' entries';
      card.appendChild(nameDiv);
      card.appendChild(countDiv);
      grid.appendChild(card);
    }
    browseContent.textContent = '';
    browseContent.appendChild(grid);
    document.getElementById('browseback').style.display = 'none';
  }

  function showCategories() {
    buildCategories();
  }

  function showCategoryEntries(cat) {
    if (!realMetadata) return;
    var entries = [];
    for (var i = 0; i < realMetadata.length; i++) {
      if ((realMetadata[i].c || 'uncategorized') === cat) {
        entries.push(realMetadata[i]);
      }
    }
    entries.sort(function(a, b) { return (b.q || 0) - (a.q || 0); });

    var browseContent = document.getElementById('browseContent');
    browseContent.textContent = '';

    var heading = document.createElement('h3');
    heading.style.cssText = 'color: var(--cyan); margin-bottom: 12px;';
    heading.textContent = cat + ' (' + entries.length + ' entries)';
    browseContent.appendChild(heading);

    var list = document.createElement('div');
    list.className = 'entry-list';
    var limit = Math.min(entries.length, 100);
    for (var e = 0; e < limit; e++) {
      var entry = entries[e];
      var item = document.createElement('div');
      item.className = 'entry-item';
      item.dataset.id = entry.id || '';
      var scoreSpan = document.createElement('span');
      scoreSpan.className = 'entry-score';
      scoreSpan.textContent = entry.q || 0;
      var titleSpan = document.createElement('span');
      titleSpan.className = 'entry-title';
      titleSpan.textContent = entry.t || entry.id || '';
      var catSpan = document.createElement('span');
      catSpan.className = 'entry-cat';
      catSpan.textContent = entry.k || '';
      item.appendChild(scoreSpan);
      item.appendChild(titleSpan);
      item.appendChild(catSpan);
      list.appendChild(item);
    }
    if (entries.length > 100) {
      var overflow = document.createElement('div');
      overflow.style.cssText = 'text-align:center; color: var(--text-dim); padding: 12px;';
      overflow.textContent = 'Showing 100 of ' + entries.length;
      list.appendChild(overflow);
    }
    browseContent.appendChild(list);
    document.getElementById('browseback').style.display = '';
  }

  function viewEntryById(id) {
    if (!realMetadata) return;
    var entry = null;
    for (var i = 0; i < realMetadata.length; i++) {
      if (realMetadata[i].id === id) { entry = realMetadata[i]; break; }
    }
    if (entry) viewEntry({ title: entry.t, category: entry.c, quality_score: entry.q, id: entry.id, knowledge_type: entry.k, package_name: entry.p });
  }

  function viewEntry(entry) {
    var contentDiv = document.createElement('div');

    var backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.dataset.action = 'back';
    backBtn.innerHTML = '&larr; Back';
    backBtn.addEventListener('click', function() {
      contentDiv.textContent = '';
    });
    contentDiv.appendChild(backBtn);

    var titleDiv = document.createElement('div');
    titleDiv.className = 'content-viewer-title';
    titleDiv.textContent = entry.title || '';
    contentDiv.appendChild(titleDiv);

    var metaDiv = document.createElement('div');
    metaDiv.style.cssText = 'font-family: var(--mono); font-size: 0.75rem; color: var(--text-dim); margin-bottom: 12px;';
    metaDiv.textContent = (entry.category || '') + ' | Quality: ' + (entry.quality_score || '\u2014') + ' | ' + (entry.knowledge_type || '') + ' | ' + (entry.package_name || '');
    contentDiv.appendChild(metaDiv);

    var viewer = document.createElement('div');
    viewer.className = 'content-viewer';
    viewer.textContent = 'Loading content...';
    contentDiv.appendChild(viewer);

    if (document.getElementById('tabBrowse').style.display !== 'none') {
      document.getElementById('browseContent').textContent = '';
      document.getElementById('browseContent').appendChild(contentDiv);
      document.getElementById('browseback').style.display = 'none';
    } else {
      document.getElementById('containerResults').textContent = '';
      document.getElementById('containerResults').appendChild(contentDiv);
    }

    loadGoldContent().then(function() {
      if (goldContent && entry.id && goldContent[entry.id]) {
        viewer.textContent = goldContent[entry.id];
      } else {
        viewer.textContent = 'Full content available for 339 gold-curated entries. This entry: ' + (entry.title || entry.id || 'unknown');
      }
    });
  }

  function loadGoldContent() {
    if (goldContent) return Promise.resolve();
    return fetch('/assets/gold-content.json')
      .then(function(r) { return r.json(); })
      .then(function(data) { goldContent = data; })
      .catch(function() {
        return fetch('/assets/gold-content.json.gz')
          .then(function(r) {
            var ds = new DecompressionStream('gzip');
            return new Response(r.body.pipeThrough(ds)).text();
          })
          .then(function(text) { goldContent = JSON.parse(text); })
          .catch(function() { goldContent = {}; });
      });
  }

  // --- Documents Tab ---
  function buildDocsGrid() {
    var docs = [
      { name: 'Agentic Engineering Stack', file: 'The Agentic Engineering Stack \u2014 Technical Overview.pdf', icon: '\uD83D\uDCCA', desc: 'Complete technical overview of the agentic ecosystem' },
      { name: 'Agentic Intelligence Frameworks', file: 'Agentic Intelligence Frameworks.pdf', icon: '\uD83E\uDDE0', desc: 'Framework designs for autonomous AI systems' },
      { name: 'Ruflo v3.5 Swarm Platform', file: 'Claude-Flow v3 Swarm Platform \u2014 CEO Briefing.pdf', icon: '\u26A1', desc: 'CEO briefing on multi-agent orchestration' },
      { name: 'The Agentic Toolkit', file: 'The Agentic Toolkit Redefining Creation.pdf', icon: '\uD83D\uDE80', desc: 'How agentic tools are redefining creation' },
      { name: 'CEO Strategy Deck', file: 'ceo-deck-rev4.pdf', icon: '\uD83D\uDCC8', desc: 'Executive strategy presentation' },
      { name: 'CTO Architecture Deck', file: 'cto-deck-rev4.pdf', icon: '\uD83D\uDD27', desc: 'Technical architecture deep-dive' },
      { name: 'The Agentic Stack (Video)', file: 'The Agentic Stack.mp4', icon: '\uD83C\uDFAC', desc: 'Video walkthrough of the full stack' },
    ];
    var docsGrid = document.getElementById('docsGrid');
    docsGrid.textContent = '';
    for (var d = 0; d < docs.length; d++) {
      var card = document.createElement('div');
      card.className = 'doc-card';
      card.dataset.file = docs[d].file;
      var iconDiv = document.createElement('div');
      iconDiv.className = 'doc-icon';
      iconDiv.textContent = docs[d].icon;
      var nameDiv = document.createElement('div');
      nameDiv.className = 'doc-name';
      nameDiv.textContent = docs[d].name;
      var descDiv = document.createElement('div');
      descDiv.className = 'doc-desc';
      descDiv.textContent = docs[d].desc;
      card.appendChild(iconDiv);
      card.appendChild(nameDiv);
      card.appendChild(descDiv);
      docsGrid.appendChild(card);
    }
  }

  function openDoc(file) {
    document.getElementById('docFrame').src = '/assets/docs/' + file;
    document.getElementById('docViewer').classList.add('active');
  }

  function closeDocViewer() {
    document.getElementById('docViewer').classList.remove('active');
    document.getElementById('docFrame').src = '';
  }

  // --- WebLLM (Optional Browser LLM) ---
  var llmEngine = null;
  var llmReady = false;

  function initWebLLM() {
    if (!navigator.gpu) {
      document.getElementById('llmProgress').textContent = 'WebGPU not available \u2014 full AI chat at ask-ruvnet-production.up.railway.app';
      document.getElementById('llmProgress').classList.add('active');
      return;
    }

    document.getElementById('llmProgress').textContent = 'Loading browser AI model...';
    document.getElementById('llmProgress').classList.add('active');

    import('https://esm.run/@mlc-ai/web-llm').then(function(webllm) {
      return webllm.CreateMLCEngine('TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', {
        initProgressCallback: function(progress) {
          document.getElementById('llmProgress').textContent = progress.text || 'Loading model...';
        }
      });
    }).then(function(engine) {
      llmEngine = engine;
      llmReady = true;
      document.getElementById('askModeLabel').style.display = '';
      document.getElementById('llmProgress').textContent = 'Brain ready \u2014 TinyLlama 1.1B running locally';
      setTimeout(function() { document.getElementById('llmProgress').classList.remove('active'); }, 3000);
    }).catch(function(err) {
      document.getElementById('llmProgress').textContent = 'Browser AI unavailable: ' + err.message;
    });
  }

  async function askBrain(question) {
    if (!llmReady || !llmEngine) return;

    document.getElementById('answerPanel').classList.add('active');
    document.getElementById('answerText').textContent = 'Searching knowledge base...';

    var results = fallbackSearch(question);
    var context = results.slice(0, 5).map(function(r) { return r.title + ': ' + (r.category || ''); }).join('\n');

    await loadGoldContent();
    var fullContext = results.slice(0, 3).map(function(r) {
      var content = goldContent && r.id && goldContent[r.id] ? goldContent[r.id].substring(0, 500) : r.title;
      return content;
    }).join('\n\n');

    document.getElementById('answerText').textContent = 'Generating response...';

    try {
      var response = await llmEngine.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant specializing in agentic AI, vector databases, and the RuVector ecosystem. Answer based on the provided context.\n\nContext:\n' + fullContext },
          { role: 'user', content: question }
        ],
        stream: true,
        max_tokens: 512,
      });

      document.getElementById('answerText').textContent = '';
      for await (var chunk of response) {
        var delta = chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content || '';
        document.getElementById('answerText').textContent += delta;
      }
    } catch (err) {
      document.getElementById('answerText').textContent = 'Error: ' + err.message;
    }
  }

  // --- Event Delegation (replaces inline onclick handlers) ---

  // Enter Container button
  document.querySelector('.enter-container-btn').addEventListener('click', function() {
    enterContainerMode();
  });

  // Container tab switching (event delegation on .container-tabs)
  document.querySelector('.container-tabs').addEventListener('click', function(e) {
    var tab = e.target.closest('.tab');
    if (tab && tab.dataset.tab) {
      switchContainerTab(tab.dataset.tab);
    }
  });

  // Container close button
  document.querySelector('.container-close').addEventListener('click', function() {
    exitContainerMode();
  });

  // Browse back button
  document.getElementById('browseback').addEventListener('click', function() {
    showCategories();
  });

  // Doc viewer close button
  document.querySelector('.doc-viewer-close').addEventListener('click', function() {
    closeDocViewer();
  });

  // Event delegation on #browseContent for category cards and entry items
  document.getElementById('browseContent').addEventListener('click', function(e) {
    var categoryCard = e.target.closest('.category-card');
    if (categoryCard) {
      var catName = categoryCard.querySelector('.cat-name');
      if (catName) {
        showCategoryEntries(catName.textContent);
      }
      return;
    }

    var entryItem = e.target.closest('.entry-item');
    if (entryItem && entryItem.dataset.id) {
      viewEntryById(entryItem.dataset.id);
      return;
    }
  });

  // Event delegation on #docsGrid for doc cards
  document.getElementById('docsGrid').addEventListener('click', function(e) {
    var docCard = e.target.closest('.doc-card');
    if (docCard && docCard.dataset.file) {
      openDoc(docCard.dataset.file);
    }
  });

  // Event delegation on #containerResults for entry items
  document.getElementById('containerResults').addEventListener('click', function(e) {
    var entryItem = e.target.closest('.entry-item');
    if (entryItem && entryItem.dataset.entryData) {
      try {
        var entry = JSON.parse(entryItem.dataset.entryData);
        viewEntry(entry);
      } catch (err) {
        // ignore parse errors
      }
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
