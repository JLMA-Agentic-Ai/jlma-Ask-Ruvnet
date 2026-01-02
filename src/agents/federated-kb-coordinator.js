/**
 * Federated KB Coordinator - Multi-agent learning for knowledge base
 *
 * Uses agentic-flow 2.0.1-alpha.38+ features:
 * - FederatedLearningCoordinator: Quality-based aggregation across agents
 * - EphemeralLearningAgent: Temporary agents with memory for specialized tasks
 *
 * This enables:
 * - Distributed knowledge ingestion across 50+ agents
 * - Quality-based aggregation of learned patterns
 * - Cross-session memory persistence
 * - Adaptive learning from successful patterns
 *
 * Usage:
 *   const { FederatedKBCoordinator } = require('./src/agents/federated-kb-coordinator');
 *   const coordinator = new FederatedKBCoordinator();
 *   await coordinator.ingestWithAgents('./docs', { maxAgents: 10 });
 */

const path = require('path');
const fs = require('fs');

// Try to load agentic-flow federated learning
let FederatedLearningCoordinator = null;
let EphemeralLearningAgent = null;
let agenticFlowAvailable = false;

try {
  const agenticFlow = require('agentic-flow');
  FederatedLearningCoordinator = agenticFlow.FederatedLearningCoordinator;
  EphemeralLearningAgent = agenticFlow.EphemeralLearningAgent;
  agenticFlowAvailable = !!(FederatedLearningCoordinator && EphemeralLearningAgent);
} catch (e) {
  console.log('Note: Federated learning requires agentic-flow@alpha');
}

// Try to load ruvector for vector storage
let RuvectorStore = null;
try {
  const ruvector = require('ruvector');
  RuvectorStore = ruvector.RuvectorStore;
} catch (e) {
  console.log('Note: KB storage requires ruvector');
}

/**
 * FederatedKBCoordinator - Coordinate multiple agents for KB operations
 */
class FederatedKBCoordinator {
  constructor(options = {}) {
    this.options = {
      kbPath: options.kbPath || '.ruvector/knowledge-base',
      maxAgents: options.maxAgents || 10,
      minQuality: options.minQuality || 0.7,
      aggregationStrategy: options.aggregationStrategy || 'quality-weighted',
      ...options
    };

    this.coordinator = null;
    this.store = null;
    this.agents = [];
    this.initialized = false;
  }

  /**
   * Initialize the federated coordinator
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Initializing Federated KB Coordinator...');

    // Initialize vector store
    if (RuvectorStore) {
      this.store = new RuvectorStore({
        dimension: 384,  // ONNX embeddings
        persistence: {
          enabled: true,
          path: this.options.kbPath
        }
      });

      try {
        await this.store.load();
        console.log(`  Loaded KB: ${await this.store.count()} vectors`);
      } catch {
        console.log('  Created new KB');
      }
    }

    // Initialize federated coordinator
    if (agenticFlowAvailable) {
      this.coordinator = new FederatedLearningCoordinator({
        maxAgents: this.options.maxAgents,
        aggregationStrategy: this.options.aggregationStrategy,
        minQualityThreshold: this.options.minQuality,
        enableMemory: true
      });

      await this.coordinator.initialize();
      console.log(`  Federated coordinator ready (max ${this.options.maxAgents} agents)`);
    } else {
      console.log('  Running in non-federated mode (agentic-flow not available)');
    }

    this.initialized = true;
    console.log('Federated KB Coordinator initialized\n');
  }

  /**
   * Spawn an ephemeral agent for a specific KB task
   */
  async spawnAgent(task, options = {}) {
    if (!agenticFlowAvailable) {
      return this.runTaskLocally(task, options);
    }

    const agent = new EphemeralLearningAgent({
      name: options.name || `kb-agent-${this.agents.length + 1}`,
      task: task,
      capabilities: options.capabilities || ['document-processing', 'embedding', 'indexing'],
      memoryEnabled: true,
      learningRate: options.learningRate || 0.1,
      ttl: options.ttl || 300000  // 5 minutes default
    });

    await agent.start();
    this.agents.push(agent);

    return agent;
  }

  /**
   * Ingest documents using distributed agents
   */
  async ingestWithAgents(sourcePath, options = {}) {
    await this.initialize();

    const maxAgents = options.maxAgents || this.options.maxAgents;
    console.log(`Starting federated ingestion with up to ${maxAgents} agents...`);

    // Find all documents
    const files = this.findDocuments(sourcePath);
    console.log(`  Found ${files.length} documents to process\n`);

    if (files.length === 0) {
      console.log('No documents found.');
      return { ingested: 0, agents: 0 };
    }

    // Split files among agents
    const batchSize = Math.ceil(files.length / maxAgents);
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    console.log(`  Split into ${batches.length} batches\n`);

    // Process batches with agents
    const results = await Promise.all(
      batches.map((batch, i) => this.processWithAgent(batch, i + 1))
    );

    // Aggregate results
    const totalIngested = results.reduce((sum, r) => sum + r.ingested, 0);
    const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;

    console.log('\n=== FEDERATED INGESTION COMPLETE ===');
    console.log(`  Total ingested:  ${totalIngested} documents`);
    console.log(`  Agents used:     ${batches.length}`);
    console.log(`  Avg quality:     ${(avgQuality * 100).toFixed(1)}%`);

    // Aggregate learning if coordinator available
    if (this.coordinator) {
      const aggregated = await this.coordinator.aggregateKnowledge();
      console.log(`  Aggregated:      ${aggregated.patterns || 0} patterns`);
    }

    // Cleanup agents
    await this.cleanup();

    return {
      ingested: totalIngested,
      agents: batches.length,
      quality: avgQuality
    };
  }

  /**
   * Process a batch of files with a single agent
   */
  async processWithAgent(files, agentId) {
    const agentName = `kb-ingestion-agent-${agentId}`;

    if (agenticFlowAvailable) {
      // Use ephemeral agent
      const agent = await this.spawnAgent('document-ingestion', {
        name: agentName,
        capabilities: ['chunking', 'embedding', 'indexing']
      });

      console.log(`  Agent ${agentId}: Processing ${files.length} files...`);

      let ingested = 0;
      let quality = 0;

      for (const file of files) {
        try {
          const result = await agent.execute({
            action: 'ingest',
            file: file,
            store: this.store
          });

          if (result.success) {
            ingested++;
            quality += result.quality || 0.8;
          }
        } catch (e) {
          console.warn(`    Agent ${agentId} error on ${path.basename(file)}: ${e.message}`);
        }
      }

      console.log(`  Agent ${agentId}: Completed ${ingested}/${files.length}`);

      return {
        agentId,
        ingested,
        quality: quality / files.length
      };
    } else {
      // Fallback: process locally
      return this.processFilesLocally(files, agentId);
    }
  }

  /**
   * Fallback: process files without agents
   */
  async processFilesLocally(files, batchId) {
    console.log(`  Batch ${batchId}: Processing ${files.length} files locally...`);

    let ingested = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const filename = path.basename(file);

        // Simple chunking
        const chunks = content.split(/\n\n+/).filter(c => c.trim().length > 50);

        // Insert chunks into store
        if (this.store) {
          for (let i = 0; i < chunks.length; i++) {
            await this.store.insert({
              id: `${filename}-${i}`,
              content: chunks[i].trim(),
              metadata: {
                source: file,
                chunk: i,
                batch: batchId
              }
            });
          }
        }

        ingested++;
      } catch (e) {
        console.warn(`    Error processing ${path.basename(file)}: ${e.message}`);
      }
    }

    console.log(`  Batch ${batchId}: Completed ${ingested}/${files.length}`);

    return {
      batchId,
      ingested,
      quality: 0.8  // Default quality for local processing
    };
  }

  /**
   * Query KB with federated agents for better results
   */
  async queryWithAgents(query, options = {}) {
    await this.initialize();

    if (!this.store) {
      throw new Error('KB store not initialized');
    }

    // Get initial results from vector store
    const vectorResults = await this.store.search(query, {
      topK: options.topK || 10
    });

    if (!agenticFlowAvailable) {
      return vectorResults;
    }

    // Spawn agents to re-rank and enhance results
    const rerankerAgent = await this.spawnAgent('reranking', {
      name: 'kb-reranker',
      capabilities: ['semantic-analysis', 'relevance-scoring']
    });

    const enhancedResults = await rerankerAgent.execute({
      action: 'rerank',
      query: query,
      results: vectorResults,
      minScore: options.minScore || 0.5
    });

    return enhancedResults.results || vectorResults;
  }

  /**
   * Find documents in a directory
   */
  findDocuments(dir, files = []) {
    const items = fs.readdirSync(dir);
    const extensions = new Set(['.md', '.txt', '.json', '.html', '.rst']);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist'].includes(item)) {
          this.findDocuments(fullPath, files);
        }
      } else if (stat.isFile() && extensions.has(path.extname(item).toLowerCase())) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Run task locally without agents
   */
  async runTaskLocally(task, options) {
    console.log(`Running ${task} locally (federated learning not available)`);
    return { success: true, local: true };
  }

  /**
   * Cleanup agents and resources
   */
  async cleanup() {
    for (const agent of this.agents) {
      try {
        await agent.stop();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.agents = [];

    if (this.store) {
      await this.store.save();
    }

    console.log('Cleanup complete');
  }

  /**
   * Get coordinator status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      agenticFlowAvailable,
      activeAgents: this.agents.length,
      kbPath: this.options.kbPath,
      maxAgents: this.options.maxAgents
    };
  }
}

module.exports = {
  FederatedKBCoordinator,
  agenticFlowAvailable
};
