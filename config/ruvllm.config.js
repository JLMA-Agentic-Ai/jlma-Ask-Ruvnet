/**
 * RuvLLM Configuration - Persistent LLM Integration
 *
 * This configuration enables RuvLLM to use Ollama for local LLM inference
 * while maintaining full persistence and integration with RuVector.
 *
 * @author RuVector Team
 * @version 1.0.0
 */

require('dotenv').config();

const ruvllmConfig = {
  // Primary Provider: Ollama (Local)
  provider: process.env.RUVLLM_PROVIDER || 'ollama',

  // Ollama Configuration
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'qwen3:8b',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text:latest',

    // Model options
    options: {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_ctx: 8192,        // Context window
      num_predict: 2048,    // Max tokens to generate
      repeat_penalty: 1.1,
    },

    // Streaming configuration
    stream: true,

    // Timeout settings (ms)
    timeout: 120000,
    keepAlive: '5m',
  },

  // Fallback Provider: Cloud APIs
  fallback: {
    provider: process.env.RUVLLM_FALLBACK_PROVIDER || 'groq',
    enabled: !!process.env.GROQ_API_KEY,

    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.1-70b-versatile',
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o-mini',
    },
  },

  // RuVector Integration
  ruvector: {
    knowledgeBasePath: process.env.RUVECTOR_KB_PATH || '.ruvector/knowledge-base',
    dimensions: parseInt(process.env.RUVECTOR_DIMENSIONS) || 128,
    distanceMetric: process.env.RUVECTOR_DISTANCE_METRIC || 'Cosine',
    persistence: process.env.RUVECTOR_PERSISTENCE !== 'false',
    walEnabled: process.env.RUVECTOR_WAL_ENABLED !== 'false',

    // HNSW Index Settings
    hnsw: {
      M: 16,
      efConstruction: 200,
      efSearch: 100,
    },
  },

  // Memory & Persistence
  memory: {
    enabled: process.env.ENABLE_PERSISTENT_MEMORY !== 'false',
    namespace: process.env.MEMORY_NAMESPACE || 'ruvnet-integration',
    dbPath: process.env.CLAUDE_FLOW_DB_PATH || '.swarm/memory.db',

    // Tiered storage for long-term persistence
    tiered: {
      hot: { maxAge: 3600000, compression: 'none' },
      warm: { maxAge: 86400000, compression: 'lz4' },
      cold: { maxAge: Infinity, compression: 'zstd' },
    },
  },

  // RAG (Retrieval-Augmented Generation) Settings
  rag: {
    enabled: true,
    topK: 10,                    // Number of context chunks to retrieve
    minSimilarity: 0.5,          // Minimum similarity threshold
    reranking: true,             // Enable semantic reranking
    contextWindow: 8000,         // Max context tokens

    // Prompt template for RAG
    promptTemplate: `You are an expert on Ruv Cohen's agentic computing ecosystem.
Use the following context to answer the question accurately.

Context:
{context}

Question: {question}

Answer based on the context provided. If the information isn't in the context, say so.`,
  },
};

// Export configuration
module.exports = ruvllmConfig;

// Also export individual sections for convenience
module.exports.ollama = ruvllmConfig.ollama;
module.exports.ruvector = ruvllmConfig.ruvector;
module.exports.memory = ruvllmConfig.memory;
module.exports.rag = ruvllmConfig.rag;
