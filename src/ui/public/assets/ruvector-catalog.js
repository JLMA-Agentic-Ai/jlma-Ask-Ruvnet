// RuVector Catalog — Interactive technology browser
// Data sourced from catalog.json v3.1.0 (114 crates, 200+ technologies)
(function() {
  'use strict';

  var CAPS = {
    "vector-search": [
      { n: "HNSW", c: "ruvector-core", s: "production", d: "61\u03BCs p50 query, O(log n). The default search algorithm.", t: "Hierarchical Navigable Small World graph. Configurable M, ef_construction, ef_search. AVX2/SSE4/NEON SIMD acceleration." },
      { n: "DiskANN / Vamana", c: "ruvector-core", s: "experimental", d: "Billion-scale SSD-backed search.", t: "When your dataset doesn't fit in RAM. Streams from disk with minimal latency overhead." },
      { n: "ColBERT", c: "ruvector-core", s: "production", d: "Late interaction retrieval using per-token embeddings.", t: "Matches at the token level, not just document level. Better accuracy for complex queries." },
      { n: "Neural Hashing", c: "ruvector-core", s: "production", d: "32x compression via learned binary hash codes.", t: "Massive scale with minimal memory. Learned codes outperform random projection hashing." },
      { n: "Hyperbolic HNSW", c: "ruvector-hyperbolic-hnsw", s: "production", d: "Poincar\u00E9 ball for hierarchical data. 20x memory reduction.", t: "M\u00F6bius operations, tangent space mapping. Perfect for org charts, knowledge graphs, category trees." },
      { n: "Micro HNSW", c: "micro-hnsw-wasm", s: "experimental", d: "11.8KB WASM binary with spiking neural networks.", t: "For IoT, edge, and ASIC targets where every byte counts." },
      { n: "Hybrid Search", c: "ruvector-core", s: "production", d: "Keyword + semantic with RRF fusion. 20-49% better.", t: "Reciprocal Rank Fusion combines BM25 keyword and HNSW semantic results." },
      { n: "Payload Filtering", c: "ruvector-filter", s: "production", d: "Equality, range, geo, text, boolean, AND/OR/NOT.", t: "Filters applied at HNSW search level, not post-search. Efficient filtered ANN." }
    ],
    "graph-intelligence": [
      { n: "Hypergraph DB", c: "ruvector-graph", s: "production", d: "Neo4j-compatible. Cypher + SPARQL. 230+ SQL functions.", t: "Two parsers (Pest + LALRPOP). PageRank, Louvain, EigenTrust, BFS, DFS, Dijkstra, Kruskal." },
      { n: "GNN", c: "ruvector-gnn", s: "production", d: "GCN, GAT, GraphSAGE on HNSW topology.", t: "Graph Neural Networks on vector index topology. WASM + Node.js bindings." },
      { n: "Graph Transformer", c: "ruvector-graph-transformer", s: "production", d: "8-module proof-gated transformer.", t: "Physics, biological, manifold, Boltzmann. Changes must pass formal verification." },
      { n: "Causal DAG", c: "ruvector-dag", s: "production", d: "DAG optimization with SONA + QuDAG (post-quantum).", t: "ML-DSA-65 (Dilithium3), ML-KEM-768 (Kyber768). Quantum-resistant agent infrastructure." },
      { n: "rvlite", c: "rvlite", s: "production", d: "Embedded WASM: SQL + SPARQL + Cypher + IndexedDB.", t: "Complete database in the browser. Three query languages. Zero backend." },
      { n: "Sparsifier", c: "ruvector-sparsifier", s: "production", d: "Spectral graph sparsification preserving Laplacian properties.", t: "Reduces edge count while maintaining graph structure for faster algorithms." }
    ],
    "attention": [
      { n: "FlashAttention-3", c: "ruvector-attention", s: "production", d: "O(n) memory. 2.49x-7.47x speedup.", t: "Tiled attention for long sequences. Core module." },
      { n: "Mamba S5", c: "ruvector-attention", s: "production", d: "O(n) linear for >100K token sequences.", t: "State Space Model. Linear complexity in sequence length." },
      { n: "Sheaf Attention", c: "ruvector-attention", s: "production", d: "Algebraic topology coherence gating (ADR-015).", t: "Restriction maps verify head agreement. Anti-hallucination at the attention level." },
      { n: "MoE Attention", c: "ruvector-attention", s: "production", d: "Memory-aware expert routing, EMA affinity (ADR-092).", t: "Cache residency bonus. <10\u03BCs routing target." },
      { n: "PDE Attention", c: "ruvector-attention", s: "production", d: "Heat equation on graph Laplacian. Continuous-time.", t: "Information diffuses across graph over continuous time." },
      { n: "Optimal Transport", c: "ruvector-attention", s: "production", d: "Sliced Wasserstein, Centroid OT.", t: "Measures cost to transform one distribution into another." },
      { n: "Info Geometry", c: "ruvector-attention", s: "production", d: "Fisher metric + natural gradient. 3-5x faster training.", t: "K-FAC approximation. Optimization on probability manifolds." },
      { n: "Hyperbolic", c: "ruvector-attention", s: "production", d: "Poincar\u00E9 ball with M\u00F6bius operations.", t: "For hierarchy-aware attention." },
      { n: "Spiking Graph", c: "ruvector-attention", s: "experimental", d: "Event-driven, energy-efficient.", t: "Only processes active spikes." },
      { n: "Min-Cut Gated", c: "ruvector-attn-mincut", s: "production", d: "Dinic's max-flow replaces softmax.", t: "Graph-based attention gating using flow algorithms." },
      { n: "FPGA Transformer", c: "ruvector-fpga-transformer", s: "production", d: "Deterministic latency. INT4/INT8. Zero-alloc.", t: "Coherence gating + witness logging. Safety-critical systems." },
      { n: "KV Cache Transformer", c: "ruvector-mincut-gated-transformer", s: "production", d: "SQUAT compression, PCA eviction. 6-8x savings.", t: "Min-cut identifies least-important KV cache entries." }
    ],
    "self-learning": [
      { n: "SONA (3 Loops)", c: "sona", s: "production", d: "Instant (<1ms), Background (hourly), Deep (weekly EWC++).", t: "ReasoningBank with HNSW patterns (150x faster). HuggingFace export." },
      { n: "MicroLoRA", c: "ruvector-learning-wasm", s: "production", d: "Rank-2, <100\u03BCs adaptation for edge/browser.", t: "<1MB per adaptation. Per-request model customization." },
      { n: "Domain Expansion", c: "ruvector-domain-expansion", s: "production", d: "Cross-domain transfer. Meta Thompson Sampling.", t: "Dampened priors prevent negative transfer." },
      { n: "BTSP", c: "ruvector-nervous-system", s: "experimental", d: "One-shot learning from single exposure.", t: "Hippocampal CA1-inspired." },
      { n: "EWC++", c: "ruvector-nervous-system", s: "production", d: "Continual learning. 45% less forgetting.", t: "Fisher Information Matrix protects important parameters." },
      { n: "E-prop", c: "ruvector-nervous-system", s: "experimental", d: "Online spiking network learning. O(1) memory/synapse.", t: "No backpropagation needed." }
    ],
    "coherence": [
      { n: "Prime Radiant", c: "prime-radiant", s: "production", d: "Universal coherence engine. 9 modules.", t: "Sheaf cohomology H^0/H^1, GNN-learned restriction maps, Blake3 witness chains." },
      { n: "Cognitum Gate", c: "cognitum-gate-*", s: "production", d: "256-tile WASM fabric. Crypto-signed permits.", t: "64KB per tile. E-value testing. Three-filter arbiter." },
      { n: "Formal Verification", c: "ruvector-verified", s: "production", d: "SAT/SMT, K-induction proofs. Sub-\u03BCs overhead.", t: "10 verified apps: weapons filters to election systems." },
      { n: "Post-Quantum Crypto", c: "ruvector-core + rvf-crypto", s: "production", d: "SHA3-512, HQC-128, ML-DSA-65, ML-KEM-768.", t: "NIST-approved. Future-proof against quantum computers." }
    ],
    "nervous-system": [
      { n: "Hopfield Networks", c: "ruvector-nervous-system", s: "production", d: "Modern (2020). 2^(d/2) storage capacity.", t: "Equivalent to transformer attention heads." },
      { n: "HDC (10,000-bit)", c: "ruvector-nervous-system", s: "production", d: "Binary hypervectors. <100ns Hamming.", t: "SIMD-optimized. Bind/bundle/permute operations." },
      { n: "Dendritic Computation", c: "ruvector-nervous-system", s: "production", d: "NMDA coincidence detection. <10\u03BCs.", t: "Compartmental models, plateau potentials, Ca\u00B2\u207A dynamics." },
      { n: "WTA / K-WTA", c: "ruvector-nervous-system", s: "production", d: "<1\u03BCs winner selection per 1000 neurons.", t: "Fast routing, attention head selection." },
      { n: "DVS Event Bus", c: "ruvector-nervous-system", s: "production", d: "10,000+ events/ms. Lock-free ring buffers.", t: "Region sharding, backpressure control." },
      { n: "Kuramoto + Global Workspace", c: "ruvector-nervous-system", s: "production", d: "40Hz gamma sync. 4-7 item conscious access.", t: "Feature binding. Baars 1988 workspace theory." },
      { n: "Predictive Coding", c: "ruvector-nervous-system", s: "production", d: "90-99% bandwidth reduction.", t: "Only process prediction errors. 5-50x compute savings with circadian control." }
    ],
    "mathematics": [
      { n: "Optimal Transport", c: "ruvector-math", s: "production", d: "Wasserstein, Sinkhorn, Gromov-Wasserstein.", t: "Earth Mover's Distance. Cross-space transport." },
      { n: "Tropical Geometry", c: "ruvector-math", s: "production", d: "Max-plus semiring. Linear region counting.", t: "Floyd-Warshall via tropical matrix multiplication." },
      { n: "TDA", c: "ruvector-math", s: "production", d: "Persistent homology, Betti numbers.", t: "Find topological features that persist across scales." },
      { n: "Info Geometry", c: "ruvector-math", s: "production", d: "Fisher matrix, natural gradient. 3-5x faster.", t: "Optimization on probability manifolds." },
      { n: "Tensor Networks", c: "ruvector-math", s: "production", d: "TT, Tucker, CP decomposition.", t: "High-dimensional compression." },
      { n: "Product Manifolds", c: "ruvector-math", s: "production", d: "H^h \u00D7 E^e \u00D7 S^s spaces. 20x memory savings.", t: "Mixed-curvature for taxonomy data." }
    ],
    "solvers": [
      { n: "8-Algorithm Suite", c: "ruvector-solver", s: "production", d: "Neumann, CG, Push, Random Walk, Multigrid, TRUE, Auto-Router.", t: "Auto-Router analyzes matrix properties and picks the best." },
      { n: "Dynamic Min-Cut", c: "ruvector-mincut", s: "production", d: "O(n^0.12). 45,911 LOC. 256-core parallel.", t: "Gomory-Hu, expander decomposition, j-tree, Link-Cut, Karger, Stoer-Wagner." }
    ],
    "llm-runtime": [
      { n: "BitNet b1.58", c: "ruvllm", s: "production", d: "Ternary {-1,0,+1}. No multiplications. 10x energy savings.", t: "1.58 bits/weight. Addition-only inference." },
      { n: "Apple Metal GPU", c: "ruvllm", s: "production", d: "M4 Pro kernels: Flash Attention, GEMM, RMSNorm, RoPE.", t: "simdgroup_half8x8 matrix operations." },
      { n: "Continuous Batching", c: "ruvllm", s: "production", d: "Production serving. Prefill/decode scheduling.", t: "Preemption, request queuing." },
      { n: "SONA Learning", c: "ruvllm", s: "production", d: "Models improve with use. ReasoningBank.", t: "Learn from Claude/LLM trajectories. HNSW-indexed." },
      { n: "WebGPU Browser", c: "ruvllm-wasm", s: "experimental", d: "LLM inference in the browser.", t: "Full pipeline compiled to WASM with GPU acceleration." }
    ],
    "quantum": [
      { n: "State-Vector Sim", c: "ruqu-core", s: "research", d: "25 qubits in browser. Gates, noise channels.", t: "Full quantum circuit simulation with SIMD." },
      { n: "VQE / QAOA / Grover", c: "ruqu-algorithms", s: "research", d: "Chemistry, MaxCut, quadratic search speedup.", t: "Variational eigensolver, combinatorial optimization." },
      { n: "8 Exotic Hybrids", c: "ruqu-exotic", s: "research", d: "Quantum Decay, Interference, Collapse, QEC, Reversible.", t: "Embeddings decohere, concepts interfere, agents use quantum consensus." }
    ],
    "distributed": [
      { n: "Raft Consensus", c: "ruvector-raft", s: "production", d: "Leader election, log replication, snapshots.", t: "Full Raft with AppendEntries, RequestVote, InstallSnapshot." },
      { n: "Auto-Sharding", c: "ruvector-cluster", s: "production", d: "Consistent hashing, 150 virtual nodes, gossip.", t: "DAG consensus, shard routing." },
      { n: "Delta System (5 crates)", c: "ruvector-delta-*", s: "production", d: "Behavioral change tracking with CRDT merging.", t: "Hybrid logical clocks, causal ordering." },
      { n: "Credit Economy", c: "ruvector-economy-wasm", s: "production", d: "CRDT counters, stake/slash, reputation.", t: "10x early-adopter multiplier. Merkle verification." }
    ],
    "storage": [
      { n: "PostgreSQL Extension", c: "ruvector-postgres", s: "production", d: "230+ SQL functions. pgvector drop-in.", t: "24 modules: attention, graph, GNN, TDA, solver, SONA, multi-tenant, healing." },
      { n: "RVF (19 sub-crates)", c: "rvf-*", s: "production", d: "Cognitive containers: vectors + models + crypto + runtime.", t: "Progressive HNSW, temperature-tiered quantization, eBPF, microVM, federation." },
      { n: "rvlite", c: "rvlite", s: "production", d: "Embedded WASM: SQL + SPARQL + Cypher + IndexedDB.", t: "Complete database in the browser." }
    ],
    "specialized": [
      { n: "OSpipe", c: "examples/OSpipe", s: "production", d: "ScreenPipe + RuVector: semantic AI memory.", t: "9 components: SafetyGate, QueryRouter (5 modes), AttentionReranker, QuantumSearch." },
      { n: "rvAgent (9 sub-crates)", c: "rvagent-*", s: "production", d: "Rust-native agents: MCP, ACP, WASM.", t: "Graph state machine, 19 middleware types, CRDT subagents, copy-on-write." },
      { n: "Robotics (7 crates)", c: "agentic-robotics-*", s: "experimental", d: "ROS3, Zenoh, embedded (no_std), cognitive.", t: "Bare-metal to full cognitive robotics platform." },
      { n: "Neural Trader", c: "neural-trader-*", s: "experimental", d: "Coherence-gated trading. CUSUM drift. Audit trails.", t: "Every decision must pass MinCut coherence gate." },
      { n: "Thermodynamic Computing", c: "thermorust", s: "research", d: "Ising, Langevin, Metropolis-Hastings.", t: "Energy-driven state transitions. Novel paradigm." },
      { n: "ruvix Kernel (22 crates)", c: "ruvix-*", s: "experimental", d: "Cognitive OS for Raspberry Pi. seL4-inspired.", t: "Bare-metal kernel with vector+graph in kernel space." }
    ]
  };

  function createCard(cap) {
    var card = document.createElement('div');
    card.className = 'cap-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', function() { card.classList.toggle('expanded'); });
    card.addEventListener('keydown', function(e) { if (e.key === 'Enter') card.classList.toggle('expanded'); });

    var badgeClass = cap.s === 'production' ? 'badge-prod' : cap.s === 'experimental' ? 'badge-exp' : 'badge-research';

    var nameEl = document.createElement('div');
    nameEl.className = 'cap-name';
    var nameText = document.createTextNode(cap.n + ' ');
    var badge = document.createElement('span');
    badge.className = 'cap-badge ' + badgeClass;
    badge.textContent = cap.s;
    nameEl.appendChild(nameText);
    nameEl.appendChild(badge);

    var descEl = document.createElement('div');
    descEl.className = 'cap-desc';
    descEl.textContent = cap.d;

    var crateEl = document.createElement('div');
    crateEl.className = 'cap-crate';
    crateEl.textContent = cap.c;

    var detailEl = document.createElement('div');
    detailEl.className = 'cap-detail';
    detailEl.textContent = cap.t;

    card.appendChild(nameEl);
    card.appendChild(descEl);
    card.appendChild(crateEl);
    card.appendChild(detailEl);
    return card;
  }

  Object.keys(CAPS).forEach(function(section) {
    var el = document.getElementById('s-' + section);
    if (!el) return;
    var frag = document.createDocumentFragment();
    CAPS[section].forEach(function(cap) { frag.appendChild(createCard(cap)); });
    el.appendChild(frag);
  });
})();
