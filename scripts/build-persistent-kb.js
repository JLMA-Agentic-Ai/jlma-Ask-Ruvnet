#!/usr/bin/env node
/**
 * Production-Ready Persistent Knowledge Base Builder
 *
 * The BEST and EASIEST way to build a persistent knowledge base
 * using RuVector + RuvLLM + Ollama
 *
 * Usage:
 *   node scripts/build-persistent-kb.js --help
 *   node scripts/build-persistent-kb.js --init           # Initialize new KB
 *   node scripts/build-persistent-kb.js --ingest ./docs  # Ingest documents
 *   node scripts/build-persistent-kb.js --query "..."    # Query the KB
 *   node scripts/build-persistent-kb.js --status         # Show KB status
 */

const fs = require('fs');
const path = require('path');
const { RuvectorStore } = require('ruvector');

// Try to load ONNX embedder (new in ruvector 0.1.77)
let ONNXEmbedder = null;
try {
  const ruvector = require('ruvector');
  ONNXEmbedder = ruvector.ONNXEmbedder || ruvector.embedder?.ONNX;
} catch (e) {
  console.log('ONNX embedder not available, will use Ollama fallback');
}

// Configuration
const CONFIG = {
  // Persistence paths
  kbPath: process.env.RUVECTOR_KB_PATH || '.ruvector/knowledge-base',

  // Embedding mode: 'onnx-local' (fast, free, offline) or 'ollama' (requires server)
  embeddingMode: process.env.EMBEDDING_MODE || 'onnx-local',

  // Ollama settings (fallback if ONNX not available)
  ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaEmbeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text:latest',
  llmModel: process.env.OLLAMA_MODEL || 'qwen3:8b',

  // Vector settings
  // ONNX all-MiniLM-L6-v2 = 384 dimensions
  // Ollama nomic-embed-text = 768 dimensions
  dimension: process.env.EMBEDDING_MODE === 'ollama' ? 768 : 384,
  metric: 'cosine',

  // Chunking settings
  chunkSize: 500,
  chunkOverlap: 50,

  // Search settings
  topK: 5,
  minScore: 0.5
};

// ============================================================================
// CORE CLASSES
// ============================================================================

/**
 * ONNXLocalEmbedder - Uses ruvector's all-MiniLM-L6-v2 via WASM
 * 384 dimensions, runs locally, no API calls, 10x faster, $0 cost
 */
class ONNXLocalEmbedder {
  constructor() {
    this.embedder = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const ruvector = require('ruvector');
      // Try different export paths for ONNX embedder
      if (ruvector.ONNXEmbedder) {
        this.embedder = new ruvector.ONNXEmbedder();
      } else if (ruvector.embedder?.ONNX) {
        this.embedder = new ruvector.embedder.ONNX();
      } else if (ruvector.createEmbedder) {
        this.embedder = await ruvector.createEmbedder({ model: 'all-MiniLM-L6-v2' });
      } else if (ruvector.embeddingService) {
        // Use the embedding service directly
        this.embedder = ruvector.embeddingService;
      } else {
        throw new Error('ONNX embedder not found in ruvector');
      }

      // Initialize if needed
      if (this.embedder.initialize) {
        await this.embedder.initialize();
      }

      this.initialized = true;
      console.log('🧠 ONNX Local Embedder initialized (all-MiniLM-L6-v2, 384d)');
    } catch (e) {
      throw new Error(`Failed to initialize ONNX embedder: ${e.message}`);
    }
  }

  async embed(text) {
    if (!this.initialized) await this.initialize();

    // Handle different embedder interfaces
    if (this.embedder.embed) {
      return await this.embedder.embed(text);
    } else if (this.embedder.encode) {
      return await this.embedder.encode(text);
    } else if (typeof this.embedder === 'function') {
      return await this.embedder(text);
    }

    throw new Error('ONNX embedder has no compatible embed method');
  }

  async embedBatch(texts) {
    if (!this.initialized) await this.initialize();

    // Check for native batch support
    if (this.embedder.embedBatch) {
      return await this.embedder.embedBatch(texts);
    } else if (this.embedder.encodeBatch) {
      return await this.embedder.encodeBatch(texts);
    }

    // Fall back to parallel individual embeds
    return Promise.all(texts.map(t => this.embed(t)));
  }
}

class OllamaEmbedder {
  constructor(baseUrl, model) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async embed(text) {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  async embedBatch(texts) {
    // Ollama doesn't have native batch, so we parallelize
    return Promise.all(texts.map(t => this.embed(t)));
  }
}

class OllamaGenerator {
  constructor(baseUrl, model) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }
}

class TextChunker {
  constructor(chunkSize = 500, overlap = 50) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  chunk(text, metadata = {}) {
    const paragraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      // Skip empty paragraphs
      if (!para.trim()) continue;

      // Check if adding this paragraph exceeds chunk size
      if ((currentChunk + para).length > this.chunkSize && currentChunk) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex++,
          ...metadata
        });

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-this.overlap);
        currentChunk = overlapText + '\n\n' + para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        ...metadata
      });
    }

    return chunks;
  }

  chunkMarkdown(text, metadata = {}) {
    // Split by headers for semantic chunking
    const sections = text.split(/(?=^#{1,3} )/m);
    const chunks = [];
    let chunkIndex = 0;

    for (const section of sections) {
      if (!section.trim()) continue;

      // Extract header if present
      const headerMatch = section.match(/^(#{1,3})\s+(.+)/);
      const header = headerMatch ? headerMatch[2] : null;
      const level = headerMatch ? headerMatch[1].length : 0;

      // If section is too long, sub-chunk it
      if (section.length > this.chunkSize * 2) {
        const subChunks = this.chunk(section, { ...metadata, header, level });
        for (const sub of subChunks) {
          sub.index = chunkIndex++;
          chunks.push(sub);
        }
      } else {
        chunks.push({
          text: section.trim(),
          index: chunkIndex++,
          header,
          level,
          ...metadata
        });
      }
    }

    return chunks;
  }
}

class PersistentKnowledgeBase {
  constructor(config = CONFIG) {
    this.config = config;
    this.store = null;
    this.embedder = null;
    this.generator = null;
    this.chunker = new TextChunker(config.chunkSize, config.chunkOverlap);
  }

  async initialize() {
    console.log('🚀 Initializing Persistent Knowledge Base...\n');

    // Ensure directory exists
    const kbDir = path.dirname(this.config.kbPath);
    if (!fs.existsSync(kbDir)) {
      fs.mkdirSync(kbDir, { recursive: true });
    }

    // Initialize RuVector with persistence
    this.store = new RuvectorStore({
      dimension: this.config.dimension,
      metric: this.config.metric,
      persistence: {
        enabled: true,
        path: this.config.kbPath,
        wal: true,           // Write-ahead log for crash safety
        autoSave: true,      // Auto-persist changes
        saveInterval: 30000  // Checkpoint every 30 seconds
      }
    });

    // Load existing data if present
    if (fs.existsSync(path.join(this.config.kbPath, 'vectors.bin'))) {
      await this.store.load();
      console.log(`📂 Loaded existing KB: ${await this.store.count()} vectors`);
    } else {
      console.log('📝 Created new knowledge base');
    }

    // Initialize embedder based on config
    if (this.config.embeddingMode === 'onnx-local') {
      try {
        this.embedder = new ONNXLocalEmbedder();
        await this.embedder.initialize();
        console.log('⚡ Using ONNX local embeddings (10x faster, $0 API cost)');
      } catch (e) {
        console.warn(`⚠️  ONNX init failed: ${e.message}`);
        console.log('📡 Falling back to Ollama embeddings...');
        this.embedder = new OllamaEmbedder(
          this.config.ollamaUrl,
          this.config.ollamaEmbeddingModel
        );
        await this.verifyOllama();
      }
    } else {
      // Use Ollama embeddings
      this.embedder = new OllamaEmbedder(
        this.config.ollamaUrl,
        this.config.ollamaEmbeddingModel
      );
      await this.verifyOllama();
    }

    // Initialize LLM generator (always Ollama for now)
    this.generator = new OllamaGenerator(
      this.config.ollamaUrl,
      this.config.llmModel
    );

    console.log('✅ Knowledge Base initialized\n');
    return this;
  }

  async verifyOllama() {
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/tags`);
      const data = await response.json();
      const models = data.models.map(m => m.name);

      console.log(`🔗 Connected to Ollama at ${this.config.ollamaUrl}`);
      console.log(`📦 Available models: ${models.slice(0, 5).join(', ')}${models.length > 5 ? '...' : ''}`);
    } catch (error) {
      throw new Error(`Cannot connect to Ollama at ${this.config.ollamaUrl}. Is it running?`);
    }
  }

  async ingestFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);

    // Choose chunking strategy based on file type
    const chunks = ext === '.md'
      ? this.chunker.chunkMarkdown(content, { source: filename })
      : this.chunker.chunk(content, { source: filename });

    console.log(`📄 ${filename}: ${chunks.length} chunks`);

    // Process chunks in batches
    const batchSize = 10;
    let ingested = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Generate embeddings
      const embeddings = await this.embedder.embedBatch(batch.map(c => c.text));

      // Insert into vector store
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        await this.store.insert({
          id: `${filename}-${chunk.index}`,
          vector: embeddings[j],
          metadata: {
            text: chunk.text,
            source: chunk.source,
            header: chunk.header,
            index: chunk.index,
            timestamp: Date.now()
          }
        });
        ingested++;
      }
    }

    return ingested;
  }

  async ingestDirectory(dirPath, pattern = '**/*.md') {
    const glob = require('glob');
    const files = glob.sync(pattern, { cwd: dirPath, absolute: true });

    console.log(`\n📁 Ingesting ${files.length} files from ${dirPath}\n`);

    let total = 0;
    for (const file of files) {
      const count = await this.ingestFile(file);
      total += count;
    }

    // Save to disk
    await this.store.save();

    console.log(`\n✅ Ingested ${total} chunks from ${files.length} files`);
    console.log(`📊 Total vectors: ${await this.store.count()}\n`);

    return total;
  }

  async query(question, options = {}) {
    const k = options.k || this.config.topK;
    const minScore = options.minScore || this.config.minScore;

    // Embed the question
    const queryVector = await this.embedder.embed(question);

    // Search for relevant chunks
    const results = await this.store.search({
      vector: queryVector,
      k: k * 2,  // Get more for filtering
      threshold: minScore
    });

    // Filter and format context
    const relevantChunks = results
      .filter(r => r.score >= minScore)
      .slice(0, k);

    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find relevant information to answer your question.",
        sources: [],
        context: []
      };
    }

    // Build context
    const context = relevantChunks
      .map(r => `[Source: ${r.metadata.source}]\n${r.metadata.text}`)
      .join('\n\n---\n\n');

    // Generate answer
    const prompt = `You are a helpful assistant with access to a knowledge base.
Based on the following context, answer the question accurately and concisely.
If the context doesn't contain enough information, say so.

Context:
${context}

Question: ${question}

Answer:`;

    const answer = await this.generator.generate(prompt);

    return {
      answer,
      sources: relevantChunks.map(r => ({
        source: r.metadata.source,
        score: r.score,
        text: r.metadata.text.slice(0, 200) + '...'
      })),
      context: relevantChunks.map(r => r.metadata.text)
    };
  }

  async getStatus() {
    const count = await this.store.count();
    const kbPath = this.config.kbPath;

    // Get file sizes
    const vectorsPath = path.join(kbPath, 'vectors.bin');
    const metadataPath = path.join(kbPath, 'metadata.json');

    const vectorsSize = fs.existsSync(vectorsPath)
      ? fs.statSync(vectorsPath).size
      : 0;
    const metadataSize = fs.existsSync(metadataPath)
      ? fs.statSync(metadataPath).size
      : 0;

    return {
      vectorCount: count,
      kbPath,
      vectorsSize: (vectorsSize / 1024).toFixed(1) + ' KB',
      metadataSize: (metadataSize / 1024).toFixed(1) + ' KB',
      totalSize: ((vectorsSize + metadataSize) / 1024 / 1024).toFixed(2) + ' MB',
      persistence: {
        wal: true,
        autoSave: true
      }
    };
  }

  async close() {
    if (this.store) {
      await this.store.save();
      await this.store.close();
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║         PERSISTENT KNOWLEDGE BASE BUILDER                            ║
║         RuVector + RuvLLM + Ollama                                   ║
╚══════════════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/build-persistent-kb.js <command> [options]

COMMANDS:
  --init              Initialize a new knowledge base
  --ingest <path>     Ingest documents from path (file or directory)
  --query "<text>"    Query the knowledge base
  --status            Show knowledge base status
  --help              Show this help message

EXAMPLES:
  # Initialize new KB
  node scripts/build-persistent-kb.js --init

  # Ingest all markdown files from docs/
  node scripts/build-persistent-kb.js --ingest ./docs

  # Ingest a single file
  node scripts/build-persistent-kb.js --ingest ./README.md

  # Query the knowledge base
  node scripts/build-persistent-kb.js --query "How does RuVector persist data?"

  # Check status
  node scripts/build-persistent-kb.js --status

ENVIRONMENT VARIABLES:
  RUVECTOR_KB_PATH          Knowledge base path (default: .ruvector/knowledge-base)
  OLLAMA_BASE_URL           Ollama URL (default: http://localhost:11434)
  OLLAMA_MODEL              LLM model (default: qwen3:8b)
  OLLAMA_EMBEDDING_MODEL    Embedding model (default: nomic-embed-text:latest)

PREREQUISITES:
  1. Ollama running: ollama serve
  2. Models pulled: ollama pull qwen3:8b && ollama pull nomic-embed-text:latest
  3. npm packages: npm install ruvector @ruvector/ruvllm

THE PERSISTENCE GUARANTEE:
  ✓ All vectors saved to disk immediately
  ✓ Write-ahead log for crash recovery
  ✓ Data survives restarts
  ✓ No cloud dependencies
`);
    return;
  }

  const kb = new PersistentKnowledgeBase();

  try {
    if (args.includes('--init')) {
      await kb.initialize();
      const status = await kb.getStatus();
      console.log('📊 Status:', JSON.stringify(status, null, 2));
    }

    else if (args.includes('--ingest')) {
      await kb.initialize();
      const pathIndex = args.indexOf('--ingest') + 1;
      const targetPath = args[pathIndex];

      if (!targetPath) {
        console.error('❌ Please provide a path to ingest');
        process.exit(1);
      }

      if (fs.statSync(targetPath).isDirectory()) {
        await kb.ingestDirectory(targetPath);
      } else {
        await kb.ingestFile(targetPath);
        await kb.store.save();
      }
    }

    else if (args.includes('--query')) {
      await kb.initialize();
      const queryIndex = args.indexOf('--query') + 1;
      const question = args[queryIndex];

      if (!question) {
        console.error('❌ Please provide a query');
        process.exit(1);
      }

      console.log(`\n🔍 Query: "${question}"\n`);
      const result = await kb.query(question);

      console.log('📝 Answer:');
      console.log(result.answer);
      console.log('\n📚 Sources:');
      for (const source of result.sources) {
        console.log(`  • ${source.source} (score: ${source.score.toFixed(3)})`);
      }
    }

    else if (args.includes('--status')) {
      await kb.initialize();
      const status = await kb.getStatus();

      console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    KNOWLEDGE BASE STATUS                             ║
╠══════════════════════════════════════════════════════════════════════╣
║  Vectors:        ${String(status.vectorCount).padEnd(50)}║
║  Path:           ${status.kbPath.padEnd(50)}║
║  Vectors Size:   ${status.vectorsSize.padEnd(50)}║
║  Metadata Size:  ${status.metadataSize.padEnd(50)}║
║  Total Size:     ${status.totalSize.padEnd(50)}║
║  WAL Enabled:    ${String(status.persistence.wal).padEnd(50)}║
║  Auto-Save:      ${String(status.persistence.autoSave).padEnd(50)}║
╚══════════════════════════════════════════════════════════════════════╝
`);
    }

    await kb.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { PersistentKnowledgeBase, OllamaEmbedder, OllamaGenerator, TextChunker, CONFIG };

// Run CLI
if (require.main === module) {
  main();
}
