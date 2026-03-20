/**
 * KB-First v3.0 - GNN Engine Template
 *
 * Graph Neural Network for modeling decision webs and relationship propagation.
 * Use this for applications where changing one thing affects many others.
 *
 * NEW IN v3.0:
 * - Graph clustering with Louvain community detection
 * - MinCut boundary finding
 * - Spectral clustering integration
 * - RuVector graph algorithm integration
 */

import { Pool } from 'pg';

// =============================================================================
// TYPES
// =============================================================================

export interface GraphNode {
  id: string;
  type: 'decision' | 'outcome' | 'constraint' | 'entity';
  label: string;
  currentValue?: any;
  possibleValues?: any[];
  embedding?: number[];
  metadata?: Record<string, any>;
  clusterId?: number;  // NEW: Cluster membership
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relationship: 'affects' | 'requires' | 'conflicts' | 'enables' | 'depends_on';
  weight: number;  // 0-1, strength of influence
  direction: 'unidirectional' | 'bidirectional';
  transform?: string;  // Name of transform function
  metadata?: Record<string, any>;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: Record<string, any>;
}

export interface PropagationResult {
  changedNode: string;
  originalValue: any;
  newValue: any;
  depth: number;
  path: string[];
  confidence: number;
}

export interface SimulationResult {
  initialChange: { node: string; from: any; to: any };
  directEffects: PropagationResult[];
  cascadingEffects: PropagationResult[];
  equilibrium: Record<string, any>;
  confidence: number;
}

// NEW: Clustering types
export interface Cluster {
  id: number;
  nodes: string[];
  centroid?: number[];
  size: number;
  density: number;
  label?: string;
}

export interface ClusteringResult {
  clusters: Cluster[];
  modularity: number;
  numClusters: number;
  algorithm: string;
  isolatedNodes: string[];
}

export interface BoundaryResult {
  boundaries: Array<{
    from: string;
    to: string;
    cutWeight: number;
    crossCluster: boolean;
  }>;
  totalCutWeight: number;
  numClusters: number;
}

export interface GNNConfig {
  hiddenDim: number;
  numLayers: number;
  aggregation: 'sum' | 'mean' | 'max' | 'attention';
  dropout?: number;
  learningRate?: number;
  // NEW: Clustering config
  defaultClusterAlgorithm?: 'louvain' | 'spectral' | 'mincut' | 'label_propagation';
  clusterResolution?: number;  // For Louvain (higher = more clusters)
}

// =============================================================================
// GNN ENGINE
// =============================================================================

export class GNNEngine {
  private pool: Pool;
  private config: GNNConfig;
  private transforms: Map<string, (value: any, weight: number) => any>;

  // RuVector graph integration (lazy loaded)
  private ruvectorGraphs: any = null;

  constructor(config: GNNConfig, databaseUrl?: string) {
    this.config = {
      hiddenDim: config.hiddenDim || 128,
      numLayers: config.numLayers || 3,
      aggregation: config.aggregation || 'attention',
      dropout: config.dropout || 0.1,
      learningRate: config.learningRate || 0.001,
      defaultClusterAlgorithm: config.defaultClusterAlgorithm || 'louvain',
      clusterResolution: config.clusterResolution || 1.0
    };

    if (databaseUrl) {
      this.pool = new Pool({ connectionString: databaseUrl });
    }

    this.transforms = new Map();
    this.registerDefaultTransforms();

    // Initialize ruvector graphs
    this.initRuvectorGraphs();
  }

  /**
   * Initialize RuVector graph algorithms
   */
  private async initRuvectorGraphs(): Promise<boolean> {
    if (this.ruvectorGraphs !== null) return true;

    try {
      const ruvector = await import('ruvector');
      if (ruvector.graphs || ruvector.graphClusters) {
        this.ruvectorGraphs = ruvector;
        console.log('[GNN-ENGINE] RuVector graph algorithms initialized');
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[GNN-ENGINE] RuVector graphs not available, using fallback algorithms');
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // GRAPH MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Build a graph from node and edge definitions
   */
  buildGraph(nodes: GraphNode[], edges: GraphEdge[]): Graph {
    // Validate edges reference existing nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.from)) {
        throw new Error(`Edge references unknown node: ${edge.from}`);
      }
      if (!nodeIds.has(edge.to)) {
        throw new Error(`Edge references unknown node: ${edge.to}`);
      }
    }

    return { nodes, edges };
  }

  /**
   * Load graph from database
   */
  async loadGraph(namespace: string): Promise<Graph> {
    const client = await this.pool.connect();
    try {
      const nodesResult = await client.query(`
        SELECT id, type, label, current_value, possible_values, embedding, metadata, cluster_id
        FROM gnn_nodes WHERE namespace = $1
      `, [namespace]);

      const edgesResult = await client.query(`
        SELECT id, from_node, to_node, relationship, weight, direction, transform, metadata
        FROM gnn_edges WHERE namespace = $1
      `, [namespace]);

      return {
        nodes: nodesResult.rows.map(r => ({
          id: r.id,
          type: r.type,
          label: r.label,
          currentValue: r.current_value,
          possibleValues: r.possible_values,
          embedding: r.embedding,
          metadata: r.metadata,
          clusterId: r.cluster_id
        })),
        edges: edgesResult.rows.map(r => ({
          id: r.id,
          from: r.from_node,
          to: r.to_node,
          relationship: r.relationship,
          weight: r.weight,
          direction: r.direction,
          transform: r.transform,
          metadata: r.metadata
        }))
      };
    } finally {
      client.release();
    }
  }

  /**
   * Save graph to database
   */
  async saveGraph(graph: Graph, namespace: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing
      await client.query('DELETE FROM gnn_edges WHERE namespace = $1', [namespace]);
      await client.query('DELETE FROM gnn_nodes WHERE namespace = $1', [namespace]);

      // Insert nodes
      for (const node of graph.nodes) {
        await client.query(`
          INSERT INTO gnn_nodes (id, namespace, type, label, current_value, possible_values, embedding, metadata, cluster_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [node.id, namespace, node.type, node.label, node.currentValue,
            node.possibleValues, node.embedding, node.metadata || {}, node.clusterId]);
      }

      // Insert edges
      for (const edge of graph.edges) {
        await client.query(`
          INSERT INTO gnn_edges (id, namespace, from_node, to_node, relationship, weight, direction, transform, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [edge.id, namespace, edge.from, edge.to, edge.relationship,
            edge.weight, edge.direction, edge.transform, edge.metadata || {}]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ===========================================================================
  // GRAPH CLUSTERING (NEW in v3.0)
  // ===========================================================================

  /**
   * Detect communities in the graph using Louvain algorithm
   * Uses RuVector's graph algorithms when available
   */
  async detectCommunities(
    graph: Graph,
    options: {
      algorithm?: 'louvain' | 'spectral' | 'label_propagation';
      resolution?: number;
      minClusterSize?: number;
    } = {}
  ): Promise<ClusteringResult> {
    const {
      algorithm = this.config.defaultClusterAlgorithm || 'louvain',
      resolution = this.config.clusterResolution || 1.0,
      minClusterSize = 2
    } = options;

    await this.initRuvectorGraphs();

    // Try RuVector's graph clustering first
    if (this.ruvectorGraphs?.graphClusters) {
      try {
        const vectors = this.graphToVectors(graph);
        const result = await this.ruvectorGraphs.graphClusters(vectors, {
          algorithm,
          resolution
        });

        return this.convertRuvectorResult(result, graph);
      } catch (e) {
        console.warn('[GNN-ENGINE] RuVector clustering failed, using fallback');
      }
    }

    // Fallback to built-in Louvain
    return this.louvainClustering(graph, resolution, minClusterSize);
  }

  /**
   * Built-in Louvain community detection
   */
  private louvainClustering(
    graph: Graph,
    resolution: number,
    minClusterSize: number
  ): ClusteringResult {
    // Initialize each node in its own cluster
    const nodeToCluster = new Map<string, number>();
    graph.nodes.forEach((node, i) => nodeToCluster.set(node.id, i));

    // Build adjacency list with weights
    const adjacency = new Map<string, Map<string, number>>();
    graph.nodes.forEach(n => adjacency.set(n.id, new Map()));

    graph.edges.forEach(edge => {
      adjacency.get(edge.from)!.set(edge.to, edge.weight);
      if (edge.direction === 'bidirectional') {
        adjacency.get(edge.to)!.set(edge.from, edge.weight);
      }
    });

    // Calculate total edge weight
    let totalWeight = 0;
    graph.edges.forEach(e => {
      totalWeight += e.weight;
      if (e.direction === 'bidirectional') totalWeight += e.weight;
    });

    // Iterative optimization
    let improved = true;
    let iterations = 0;
    const maxIterations = 100;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (const node of graph.nodes) {
        const currentCluster = nodeToCluster.get(node.id)!;

        // Find neighboring clusters
        const neighborClusters = new Set<number>();
        adjacency.get(node.id)!.forEach((_, neighbor) => {
          neighborClusters.add(nodeToCluster.get(neighbor)!);
        });

        let bestCluster = currentCluster;
        let bestGain = 0;

        // Try moving to each neighbor cluster
        for (const targetCluster of neighborClusters) {
          if (targetCluster === currentCluster) continue;

          const gain = this.modularityGain(
            node.id, currentCluster, targetCluster,
            nodeToCluster, adjacency, totalWeight, resolution
          );

          if (gain > bestGain) {
            bestGain = gain;
            bestCluster = targetCluster;
          }
        }

        // Move to best cluster if improvement found
        if (bestCluster !== currentCluster && bestGain > 0) {
          nodeToCluster.set(node.id, bestCluster);
          improved = true;
        }
      }
    }

    // Build cluster result
    const clusterNodes = new Map<number, string[]>();
    nodeToCluster.forEach((cluster, node) => {
      if (!clusterNodes.has(cluster)) {
        clusterNodes.set(cluster, []);
      }
      clusterNodes.get(cluster)!.push(node);
    });

    // Renumber clusters and filter by size
    const clusters: Cluster[] = [];
    const isolatedNodes: string[] = [];
    let clusterIndex = 0;

    clusterNodes.forEach((nodes, _) => {
      if (nodes.length >= minClusterSize) {
        clusters.push({
          id: clusterIndex,
          nodes,
          size: nodes.length,
          density: this.calculateClusterDensity(nodes, adjacency)
        });

        // Update node cluster IDs
        nodes.forEach(nodeId => {
          const gNode = graph.nodes.find(n => n.id === nodeId);
          if (gNode) gNode.clusterId = clusterIndex;
        });

        clusterIndex++;
      } else {
        isolatedNodes.push(...nodes);
      }
    });

    const modularity = this.calculateModularity(
      nodeToCluster, adjacency, totalWeight, resolution
    );

    console.log(`[GNN-ENGINE] Louvain clustering: ${clusters.length} clusters, modularity: ${modularity.toFixed(3)}`);

    return {
      clusters,
      modularity,
      numClusters: clusters.length,
      algorithm: 'louvain',
      isolatedNodes
    };
  }

  /**
   * Calculate modularity gain from moving a node
   */
  private modularityGain(
    nodeId: string,
    fromCluster: number,
    toCluster: number,
    nodeToCluster: Map<string, number>,
    adjacency: Map<string, Map<string, number>>,
    totalWeight: number,
    resolution: number
  ): number {
    const neighbors = adjacency.get(nodeId)!;
    let sumIn = 0, sumOut = 0;
    let ki = 0;

    neighbors.forEach((weight, neighbor) => {
      ki += weight;
      const neighborCluster = nodeToCluster.get(neighbor)!;
      if (neighborCluster === toCluster) sumIn += weight;
      if (neighborCluster === fromCluster) sumOut += weight;
    });

    // Simplified modularity gain formula
    const m = totalWeight;
    const gain = (sumIn - sumOut) / m - resolution * ki * ki / (m * m);

    return gain;
  }

  /**
   * Calculate overall modularity
   */
  private calculateModularity(
    nodeToCluster: Map<string, number>,
    adjacency: Map<string, Map<string, number>>,
    totalWeight: number,
    resolution: number
  ): number {
    if (totalWeight === 0) return 0;

    let Q = 0;
    const m = totalWeight;

    nodeToCluster.forEach((ci, i) => {
      const ki = [...(adjacency.get(i)?.values() || [])].reduce((a, b) => a + b, 0);

      adjacency.get(i)?.forEach((Aij, j) => {
        const cj = nodeToCluster.get(j)!;
        if (ci === cj) {
          const kj = [...(adjacency.get(j)?.values() || [])].reduce((a, b) => a + b, 0);
          Q += Aij - resolution * ki * kj / (2 * m);
        }
      });
    });

    return Q / (2 * m);
  }

  /**
   * Calculate cluster density
   */
  private calculateClusterDensity(
    nodes: string[],
    adjacency: Map<string, Map<string, number>>
  ): number {
    if (nodes.length < 2) return 0;

    const nodeSet = new Set(nodes);
    let internalEdges = 0;

    nodes.forEach(node => {
      adjacency.get(node)?.forEach((_, neighbor) => {
        if (nodeSet.has(neighbor)) internalEdges++;
      });
    });

    const maxEdges = nodes.length * (nodes.length - 1);
    return maxEdges > 0 ? internalEdges / maxEdges : 0;
  }

  /**
   * Find natural boundaries between clusters using MinCut
   */
  async findBoundaries(
    graph: Graph,
    options: {
      useExistingClusters?: boolean;
      minCutWeight?: number;
    } = {}
  ): Promise<BoundaryResult> {
    const { useExistingClusters = true, minCutWeight = 0.1 } = options;

    // First cluster if needed
    if (!useExistingClusters || !graph.nodes.some(n => n.clusterId !== undefined)) {
      await this.detectCommunities(graph);
    }

    // Try RuVector's mincut
    await this.initRuvectorGraphs();
    if (this.ruvectorGraphs?.minCutBoundaries) {
      try {
        const vectors = this.graphToVectors(graph);
        const result = await this.ruvectorGraphs.minCutBoundaries(vectors);
        return this.convertBoundaryResult(result, graph);
      } catch (e) {
        console.warn('[GNN-ENGINE] RuVector mincut failed, using fallback');
      }
    }

    // Fallback: find cross-cluster edges
    const boundaries: BoundaryResult['boundaries'] = [];
    let totalCutWeight = 0;
    const clusterIds = new Set<number>();

    graph.edges.forEach(edge => {
      const fromNode = graph.nodes.find(n => n.id === edge.from);
      const toNode = graph.nodes.find(n => n.id === edge.to);

      if (fromNode?.clusterId !== undefined) clusterIds.add(fromNode.clusterId);
      if (toNode?.clusterId !== undefined) clusterIds.add(toNode.clusterId);

      const crossCluster = fromNode?.clusterId !== toNode?.clusterId &&
                          fromNode?.clusterId !== undefined &&
                          toNode?.clusterId !== undefined;

      if (crossCluster && edge.weight >= minCutWeight) {
        boundaries.push({
          from: edge.from,
          to: edge.to,
          cutWeight: edge.weight,
          crossCluster: true
        });
        totalCutWeight += edge.weight;
      }
    });

    boundaries.sort((a, b) => b.cutWeight - a.cutWeight);

    return {
      boundaries,
      totalCutWeight,
      numClusters: clusterIds.size
    };
  }

  /**
   * Get nodes in a specific cluster
   */
  getClusterNodes(graph: Graph, clusterId: number): GraphNode[] {
    return graph.nodes.filter(n => n.clusterId === clusterId);
  }

  /**
   * Get edges within a cluster (internal edges)
   */
  getClusterEdges(graph: Graph, clusterId: number): GraphEdge[] {
    const clusterNodeIds = new Set(
      graph.nodes.filter(n => n.clusterId === clusterId).map(n => n.id)
    );

    return graph.edges.filter(e =>
      clusterNodeIds.has(e.from) && clusterNodeIds.has(e.to)
    );
  }

  /**
   * Get edges between clusters (boundary edges)
   */
  getBoundaryEdges(
    graph: Graph,
    clusterA: number,
    clusterB: number
  ): GraphEdge[] {
    const nodesA = new Set(
      graph.nodes.filter(n => n.clusterId === clusterA).map(n => n.id)
    );
    const nodesB = new Set(
      graph.nodes.filter(n => n.clusterId === clusterB).map(n => n.id)
    );

    return graph.edges.filter(e =>
      (nodesA.has(e.from) && nodesB.has(e.to)) ||
      (nodesB.has(e.from) && nodesA.has(e.to))
    );
  }

  /**
   * Auto-label clusters based on node types/labels
   */
  labelClusters(graph: Graph, clusterResult: ClusteringResult): ClusteringResult {
    clusterResult.clusters.forEach(cluster => {
      const nodes = cluster.nodes.map(id => graph.nodes.find(n => n.id === id)!);

      // Count node types
      const typeCounts = new Map<string, number>();
      nodes.forEach(n => {
        typeCounts.set(n.type, (typeCounts.get(n.type) || 0) + 1);
      });

      // Get dominant type
      let dominantType = '';
      let maxCount = 0;
      typeCounts.forEach((count, type) => {
        if (count > maxCount) {
          maxCount = count;
          dominantType = type;
        }
      });

      // Use most common words from labels
      const words = nodes.flatMap(n => n.label.toLowerCase().split(/\s+/));
      const wordCounts = new Map<string, number>();
      words.filter(w => w.length > 3).forEach(w => {
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      });

      const topWords = [...wordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);

      cluster.label = `${dominantType}: ${topWords.join(', ')}`;
    });

    return clusterResult;
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS FOR RUVECTOR INTEGRATION
  // ---------------------------------------------------------------------------

  private graphToVectors(graph: Graph): number[][] {
    // Convert graph to vector representation for RuVector
    return graph.nodes.map(node => {
      if (node.embedding) return node.embedding;

      // Create simple structural embedding if no embedding exists
      const nodeIndex = graph.nodes.findIndex(n => n.id === node.id);
      const inDegree = graph.edges.filter(e => e.to === node.id).length;
      const outDegree = graph.edges.filter(e => e.from === node.id).length;
      const avgWeight = graph.edges
        .filter(e => e.from === node.id || e.to === node.id)
        .reduce((sum, e) => sum + e.weight, 0) / (inDegree + outDegree || 1);

      // Simple 8-dimensional structural embedding
      return [
        nodeIndex / graph.nodes.length,
        inDegree / graph.nodes.length,
        outDegree / graph.nodes.length,
        avgWeight,
        node.type === 'decision' ? 1 : 0,
        node.type === 'outcome' ? 1 : 0,
        node.type === 'constraint' ? 1 : 0,
        node.type === 'entity' ? 1 : 0
      ];
    });
  }

  private convertRuvectorResult(result: any, graph: Graph): ClusteringResult {
    const clusters: Cluster[] = result.clusters.map((c: any, i: number) => ({
      id: i,
      nodes: c.nodeIndices.map((idx: number) => graph.nodes[idx].id),
      size: c.nodeIndices.length,
      density: c.density || 0,
      centroid: c.centroid
    }));

    // Update node cluster IDs
    clusters.forEach(cluster => {
      cluster.nodes.forEach(nodeId => {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node) node.clusterId = cluster.id;
      });
    });

    return {
      clusters,
      modularity: result.modularity || 0,
      numClusters: clusters.length,
      algorithm: 'ruvector',
      isolatedNodes: result.isolated || []
    };
  }

  private convertBoundaryResult(result: any, graph: Graph): BoundaryResult {
    return {
      boundaries: result.boundaries.map((b: any) => ({
        from: graph.nodes[b.fromIndex]?.id || b.from,
        to: graph.nodes[b.toIndex]?.id || b.to,
        cutWeight: b.weight,
        crossCluster: true
      })),
      totalCutWeight: result.totalWeight || 0,
      numClusters: result.numClusters || 0
    };
  }

  // ---------------------------------------------------------------------------
  // PROPAGATION SIMULATION
  // ---------------------------------------------------------------------------

  /**
   * Simulate what happens when a node value changes
   */
  async simulate(
    graph: Graph,
    change: { node: string; newValue: any },
    options: { maxDepth?: number; minWeight?: number; respectClusterBoundaries?: boolean } = {}
  ): Promise<SimulationResult> {
    const { maxDepth = 4, minWeight = 0.1, respectClusterBoundaries = false } = options;

    const node = graph.nodes.find(n => n.id === change.node);
    if (!node) throw new Error(`Node not found: ${change.node}`);

    const originalValue = node.currentValue;
    const directEffects: PropagationResult[] = [];
    const cascadingEffects: PropagationResult[] = [];
    const visited = new Set<string>();
    const newValues: Record<string, any> = { [change.node]: change.newValue };

    // BFS propagation
    const queue: { nodeId: string; depth: number; path: string[]; confidence: number }[] = [];

    // Find direct edges from changed node
    const directEdges = graph.edges.filter(e => e.from === change.node);
    for (const edge of directEdges) {
      if (edge.weight >= minWeight) {
        // NEW: Check cluster boundary if respecting boundaries
        if (respectClusterBoundaries) {
          const targetNode = graph.nodes.find(n => n.id === edge.to);
          if (node.clusterId !== undefined && targetNode?.clusterId !== undefined &&
              node.clusterId !== targetNode.clusterId) {
            // Reduce confidence for cross-cluster propagation
            queue.push({
              nodeId: edge.to,
              depth: 1,
              path: [change.node, edge.to],
              confidence: edge.weight * 0.5  // 50% penalty for crossing boundaries
            });
            continue;
          }
        }

        queue.push({
          nodeId: edge.to,
          depth: 1,
          path: [change.node, edge.to],
          confidence: edge.weight
        });
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current.nodeId) || current.depth > maxDepth) {
        continue;
      }
      visited.add(current.nodeId);

      const targetNode = graph.nodes.find(n => n.id === current.nodeId);
      if (!targetNode) continue;

      // Calculate new value based on incoming edges
      const incomingEdges = graph.edges.filter(e => e.to === current.nodeId);
      let newValue = targetNode.currentValue;

      for (const edge of incomingEdges) {
        if (newValues[edge.from] !== undefined) {
          const transform = this.transforms.get(edge.transform || 'linear');
          if (transform) {
            newValue = transform(newValues[edge.from], edge.weight);
          }
        }
      }

      newValues[current.nodeId] = newValue;

      const effect: PropagationResult = {
        changedNode: current.nodeId,
        originalValue: targetNode.currentValue,
        newValue: newValue,
        depth: current.depth,
        path: current.path,
        confidence: current.confidence
      };

      if (current.depth === 1) {
        directEffects.push(effect);
      } else {
        cascadingEffects.push(effect);
      }

      // Queue downstream nodes
      const outgoingEdges = graph.edges.filter(e => e.from === current.nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to) && edge.weight >= minWeight) {
          let confidenceMultiplier = 1;

          // Apply cluster boundary penalty
          if (respectClusterBoundaries) {
            const nextNode = graph.nodes.find(n => n.id === edge.to);
            if (targetNode.clusterId !== undefined && nextNode?.clusterId !== undefined &&
                targetNode.clusterId !== nextNode.clusterId) {
              confidenceMultiplier = 0.5;
            }
          }

          queue.push({
            nodeId: edge.to,
            depth: current.depth + 1,
            path: [...current.path, edge.to],
            confidence: current.confidence * edge.weight * confidenceMultiplier
          });
        }
      }
    }

    return {
      initialChange: { node: change.node, from: originalValue, to: change.newValue },
      directEffects,
      cascadingEffects,
      equilibrium: newValues,
      confidence: this.calculateOverallConfidence(directEffects, cascadingEffects)
    };
  }

  /**
   * Compare two scenarios
   */
  async compareScenarios(
    graph: Graph,
    scenarioA: { node: string; newValue: any },
    scenarioB: { node: string; newValue: any }
  ): Promise<{
    scenarioA: SimulationResult;
    scenarioB: SimulationResult;
    differences: { node: string; valueA: any; valueB: any; impact: number }[];
    recommendation: 'A' | 'B' | 'equivalent';
  }> {
    const resultA = await this.simulate(graph, scenarioA);
    const resultB = await this.simulate(graph, scenarioB);

    const allNodes = new Set([
      ...Object.keys(resultA.equilibrium),
      ...Object.keys(resultB.equilibrium)
    ]);

    const differences: { node: string; valueA: any; valueB: any; impact: number }[] = [];

    for (const nodeId of allNodes) {
      const valueA = resultA.equilibrium[nodeId];
      const valueB = resultB.equilibrium[nodeId];

      if (valueA !== valueB) {
        differences.push({
          node: nodeId,
          valueA,
          valueB,
          impact: Math.abs(this.numericValue(valueA) - this.numericValue(valueB))
        });
      }
    }

    differences.sort((a, b) => b.impact - a.impact);

    return {
      scenarioA: resultA,
      scenarioB: resultB,
      differences,
      recommendation: resultA.confidence > resultB.confidence ? 'A' :
                      resultB.confidence > resultA.confidence ? 'B' : 'equivalent'
    };
  }

  // ---------------------------------------------------------------------------
  // GNN LAYER OPERATIONS (SQL)
  // ---------------------------------------------------------------------------

  /**
   * Apply GCN layer via SQL
   */
  async applyGCNLayer(
    nodeFeatures: number[][],
    adjacencyMatrix: number[][],
    weights: number[][]
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_gnn_gcn_layer($1, $2, $3) as features
      `, [nodeFeatures, adjacencyMatrix, weights]);
      return result.rows[0].features;
    } finally {
      client.release();
    }
  }

  /**
   * Apply Graph Attention layer via SQL
   */
  async applyGATLayer(
    nodeFeatures: number[][],
    adjacencyMatrix: number[][],
    attentionWeights: number[][],
    numHeads: number
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_gnn_gat_layer($1, $2, $3, $4) as features
      `, [nodeFeatures, adjacencyMatrix, attentionWeights, numHeads]);
      return result.rows[0].features;
    } finally {
      client.release();
    }
  }

  /**
   * Message passing via SQL
   */
  async messagePassing(
    nodeFeatures: number[][],
    edgeIndex: number[][],
    edgeFeatures: number[][],
    aggregation: 'sum' | 'mean' | 'max'
  ): Promise<number[][]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ruvector_gnn_message_pass($1, $2, $3, $4) as features
      `, [nodeFeatures, edgeIndex, edgeFeatures, aggregation]);
      return result.rows[0].features;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // TRANSFORMS
  // ---------------------------------------------------------------------------

  registerTransform(name: string, fn: (value: any, weight: number) => any): void {
    this.transforms.set(name, fn);
  }

  private registerDefaultTransforms(): void {
    // Linear: New value scales proportionally
    this.transforms.set('linear', (value, weight) => {
      if (typeof value === 'number') return value * weight;
      return value;
    });

    // Inverse: Opposite relationship
    this.transforms.set('inverse', (value, weight) => {
      if (typeof value === 'number') return value * (1 - weight);
      return value;
    });

    // Threshold: Binary effect above threshold
    this.transforms.set('threshold', (value, weight) => {
      if (typeof value === 'number') return value > 0.5 ? weight : 0;
      return value;
    });

    // Delay: Effect with delay factor
    this.transforms.set('delay', (value, weight) => {
      if (typeof value === 'number') return value * weight * 0.8;
      return value;
    });

    // Sigmoid: S-curve transformation
    this.transforms.set('sigmoid', (value, weight) => {
      if (typeof value === 'number') {
        const x = value * weight;
        return 1 / (1 + Math.exp(-x));
      }
      return value;
    });
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private calculateOverallConfidence(
    direct: PropagationResult[],
    cascading: PropagationResult[]
  ): number {
    const allEffects = [...direct, ...cascading];
    if (allEffects.length === 0) return 1.0;

    const avgConfidence = allEffects.reduce((sum, e) => sum + e.confidence, 0) / allEffects.length;
    return avgConfidence;
  }

  private numericValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return 0;
  }
}

// =============================================================================
// SCHEMA FOR GNN TABLES (Updated for v3.0)
// =============================================================================

export const GNN_SCHEMA = `
-- GNN Nodes (updated with cluster_id)
CREATE TABLE IF NOT EXISTS gnn_nodes (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('decision', 'outcome', 'constraint', 'entity')),
  label TEXT NOT NULL,
  current_value JSONB,
  possible_values JSONB,
  embedding vector(384),
  cluster_id INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GNN Edges
CREATE TABLE IF NOT EXISTS gnn_edges (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  from_node TEXT NOT NULL REFERENCES gnn_nodes(id),
  to_node TEXT NOT NULL REFERENCES gnn_nodes(id),
  relationship TEXT NOT NULL CHECK (relationship IN ('affects', 'requires', 'conflicts', 'enables', 'depends_on')),
  weight REAL NOT NULL CHECK (weight >= 0 AND weight <= 1),
  direction TEXT DEFAULT 'unidirectional' CHECK (direction IN ('unidirectional', 'bidirectional')),
  transform TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cluster metadata table (NEW in v3.0)
CREATE TABLE IF NOT EXISTS gnn_clusters (
  id SERIAL PRIMARY KEY,
  namespace TEXT NOT NULL,
  cluster_id INTEGER NOT NULL,
  label TEXT,
  centroid vector(384),
  size INTEGER DEFAULT 0,
  density REAL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(namespace, cluster_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS gnn_nodes_namespace_idx ON gnn_nodes(namespace);
CREATE INDEX IF NOT EXISTS gnn_nodes_cluster_idx ON gnn_nodes(cluster_id);
CREATE INDEX IF NOT EXISTS gnn_edges_namespace_idx ON gnn_edges(namespace);
CREATE INDEX IF NOT EXISTS gnn_edges_from_idx ON gnn_edges(from_node);
CREATE INDEX IF NOT EXISTS gnn_edges_to_idx ON gnn_edges(to_node);
CREATE INDEX IF NOT EXISTS gnn_clusters_namespace_idx ON gnn_clusters(namespace);
`;

export default GNNEngine;
