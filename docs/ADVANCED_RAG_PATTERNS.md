Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 01:11:14 EST

# Advanced RAG Patterns and Hybrid Search

## Overview

This guide covers advanced Retrieval-Augmented Generation (RAG) patterns for building intelligent, context-aware applications with RuvLLM and RuVector.

## RAG Architecture Evolution

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RAG ARCHITECTURE LEVELS                           │
│                                                                      │
│  Level 1: Naive RAG                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Query   │───►│  Embed   │───►│  Search  │───►│ Generate │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                      │
│  Level 2: Advanced RAG                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Query   │───►│ Rewrite  │───►│ Hybrid   │───►│ Rerank   │──┐   │
│  └──────────┘    └──────────┘    │ Search   │    └──────────┘  │   │
│                                  └──────────┘                   │   │
│                                                                 ▼   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ Response │◄───│ Generate │◄───│ Compress │◄───│ Filter   │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                      │
│  Level 3: Agentic RAG                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Query   │───►│ Route    │───►│ Multi-   │───►│ Reason   │──┐   │
│  └──────────┘    └──────────┘    │ Source   │    └──────────┘  │   │
│                                  └──────────┘                   │   │
│                                       │                         │   │
│                              ┌────────▼────────┐                │   │
│                              │  Tool Calling   │◄───────────────┘   │
│                              │  Self-Correct   │                    │
│                              └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Hybrid Search

### Dense + Sparse Retrieval

```javascript
const { HybridSearch } = require('@ruvector/ruvllm/search');

const hybrid = new HybridSearch({
  dense: {
    vectorStore: ruVectorStore,
    embeddingModel: 'nomic-embed-text:latest',
    weight: 0.7  // 70% weight to dense retrieval
  },
  sparse: {
    index: 'bm25',
    analyzer: 'english',
    weight: 0.3  // 30% weight to BM25
  },
  fusion: {
    method: 'rrf',  // Reciprocal Rank Fusion
    k: 60  // RRF constant
  }
});

// Hybrid search combines semantic and keyword matching
const results = await hybrid.search({
  query: 'How does HNSW indexing work in RuVector?',
  topK: 10,
  minScore: 0.5
});
```

### Reciprocal Rank Fusion (RRF)

```javascript
const { RRFusion } = require('@ruvector/ruvllm/fusion');

// RRF: score(d) = Σ 1/(k + rank(d))
const fusion = new RRFusion({
  k: 60,  // Ranking constant (typically 60)
  normalize: true
});

// Fuse multiple result sets
const fused = fusion.fuse([
  denseResults,    // From vector search
  sparseResults,   // From BM25
  graphResults     // From knowledge graph
]);
```

### Query Expansion

```javascript
const { QueryExpander } = require('@ruvector/ruvllm/query');

const expander = new QueryExpander({
  llm: ollamaClient,
  techniques: [
    'synonym_expansion',    // Add synonyms
    'acronym_expansion',    // Expand acronyms
    'semantic_variants',    // LLM-generated variants
    'entity_linking'        // Link to known entities
  ]
});

// Expand query for better recall
const expanded = await expander.expand('HNSW search performance');
// Returns: ['HNSW search performance',
//           'Hierarchical Navigable Small World graph search speed',
//           'approximate nearest neighbor search efficiency',
//           'vector database indexing performance']
```

## Advanced RAG Patterns

### Corrective RAG (CRAG)

```javascript
const { CorrectiveRAG } = require('@ruvector/ruvllm/rag');

const crag = new CorrectiveRAG({
  vectorStore: ruVectorStore,
  llm: ollamaClient,
  evaluator: {
    model: 'qwen3:8b',
    relevanceThreshold: 0.7
  },
  correction: {
    webSearch: true,  // Fall back to web search
    requery: true,    // Reformulate query
    maxIterations: 3
  }
});

const result = await crag.query({
  question: 'What is the latest RuVector version?',
  selfCorrect: true
});

// CRAG workflow:
// 1. Retrieve documents
// 2. Evaluate relevance (Correct/Incorrect/Ambiguous)
// 3. If Correct: use retrieved docs
// 4. If Incorrect: perform web search
// 5. If Ambiguous: refine query and retry
```

### Self-RAG

```javascript
const { SelfRAG } = require('@ruvector/ruvllm/rag');

const selfRag = new SelfRAG({
  vectorStore: ruVectorStore,
  llm: ollamaClient,
  tokens: {
    retrieve: '[Retrieve]',
    isRel: '[IsRel]',
    isSup: '[IsSup]',
    isUse: '[IsUse]'
  }
});

const result = await selfRag.query({
  question: 'Explain experience replay in AgentDB',
  adaptiveRetrieval: true,  // Decide when to retrieve
  critique: true            // Self-critique responses
});

// Self-RAG adds reflection tokens:
// [Retrieve]: yes/no - should I retrieve?
// [IsRel]: relevant/irrelevant - is retrieved doc relevant?
// [IsSup]: fully/partially/not - does doc support response?
// [IsUse]: 1-5 - how useful is this response?
```

### Graph RAG

```javascript
const { GraphRAG } = require('@ruvector/ruvllm/rag');

const graphRag = new GraphRAG({
  vectorStore: ruVectorStore,
  knowledgeGraph: {
    type: 'neo4j',
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: process.env.NEO4J_PASSWORD
  },
  integration: {
    entityExtraction: true,
    relationMapping: true,
    communityDetection: true
  }
});

// Build knowledge graph from documents
await graphRag.buildGraph(documents);

// Query with graph traversal
const result = await graphRag.query({
  question: 'How do RuVector and RuvLLM integrate?',
  traversalDepth: 2,     // Hop distance
  includeRelations: true  // Include relationship context
});
```

### Modular RAG

```javascript
const { ModularRAG, modules } = require('@ruvector/ruvllm/rag');

const modularRag = new ModularRAG({
  modules: [
    // Pre-retrieval
    new modules.QueryRewriter({ llm: ollamaClient }),
    new modules.QueryRouter({
      routes: [
        { pattern: /code|implementation/, retriever: 'code_search' },
        { pattern: /concept|explain/, retriever: 'semantic_search' },
        { pattern: /latest|recent/, retriever: 'web_search' }
      ]
    }),

    // Retrieval
    new modules.HybridRetriever({ dense: 0.7, sparse: 0.3 }),
    new modules.MultiSourceRetriever({
      sources: ['ruvector', 'docs', 'github']
    }),

    // Post-retrieval
    new modules.Reranker({ model: 'cross-encoder' }),
    new modules.ContextCompressor({ maxTokens: 4000 }),
    new modules.Deduplicator({ threshold: 0.95 }),

    // Generation
    new modules.PromptBuilder({ template: ragTemplate }),
    new modules.Generator({ llm: ollamaClient }),
    new modules.CitationAdder({ style: 'inline' })
  ]
});

const result = await modularRag.process(query);
```

### Agentic RAG

```javascript
const { AgenticRAG } = require('@ruvector/ruvllm/rag');

const agenticRag = new AgenticRAG({
  vectorStore: ruVectorStore,
  llm: ollamaClient,
  tools: [
    {
      name: 'search_codebase',
      description: 'Search code files for implementation details',
      handler: async (query) => await codeSearch(query)
    },
    {
      name: 'search_docs',
      description: 'Search documentation for concepts',
      handler: async (query) => await docSearch(query)
    },
    {
      name: 'run_code',
      description: 'Execute code to verify behavior',
      handler: async (code) => await executeCode(code)
    },
    {
      name: 'ask_clarification',
      description: 'Ask user for clarification',
      handler: async (question) => await askUser(question)
    }
  ],
  reasoning: {
    strategy: 'react',  // ReAct pattern
    maxSteps: 10,
    reflection: true
  }
});

const result = await agenticRag.query({
  question: 'Show me how to implement a custom distance metric in RuVector',
  requireVerification: true  // Agent will test the code
});
```

## Chunking Strategies

### Semantic Chunking

```javascript
const { SemanticChunker } = require('@ruvector/ruvllm/chunking');

const chunker = new SemanticChunker({
  embeddingModel: 'nomic-embed-text:latest',
  breakpoint: {
    type: 'percentile',    // or 'threshold', 'gradient'
    percentile: 95,        // Break at 95th percentile dissimilarity
    minChunkSize: 100,     // Minimum tokens per chunk
    maxChunkSize: 1000     // Maximum tokens per chunk
  }
});

// Creates chunks at natural semantic boundaries
const chunks = await chunker.chunk(document);
```

### Hierarchical Chunking

```javascript
const { HierarchicalChunker } = require('@ruvector/ruvllm/chunking');

const chunker = new HierarchicalChunker({
  levels: [
    { name: 'document', embedSummary: true },
    { name: 'section', embedSummary: true, maxSize: 2000 },
    { name: 'paragraph', embedFull: true, maxSize: 500 }
  ],
  parentChildLinks: true
});

const hierarchy = await chunker.chunk(document);

// Query with parent context
const results = await ruVectorStore.search({
  vector: queryVector,
  k: 5,
  includeParent: true  // Include parent chunks for context
});
```

### Agentic Chunking

```javascript
const { AgenticChunker } = require('@ruvector/ruvllm/chunking');

const chunker = new AgenticChunker({
  llm: ollamaClient,
  strategy: 'proposition',  // Extract propositions
  metadata: {
    extractEntities: true,
    extractRelations: true,
    generateQuestions: true  // Hypothetical questions this chunk answers
  }
});

const chunks = await chunker.chunk(document);
// Each chunk includes:
// - Propositions (atomic facts)
// - Entities and relations
// - Hypothetical questions for better retrieval
```

## Reranking

### Cross-Encoder Reranking

```javascript
const { CrossEncoderReranker } = require('@ruvector/ruvllm/rerank');

const reranker = new CrossEncoderReranker({
  model: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
  batchSize: 32,
  normalize: true
});

// Rerank initial retrieval results
const reranked = await reranker.rerank({
  query: 'How to implement HNSW in RuVector?',
  documents: initialResults,
  topK: 5
});
```

### LLM-Based Reranking

```javascript
const { LLMReranker } = require('@ruvector/ruvllm/rerank');

const reranker = new LLMReranker({
  llm: ollamaClient,
  prompt: `Given the query: "{query}"

Rate how relevant this document is (0-10):
{document}

Score:`,
  batchSize: 5,  // Process 5 at a time
  temperature: 0  // Deterministic scoring
});

const reranked = await reranker.rerank({
  query: query,
  documents: results,
  topK: 5
});
```

### Cohere-Style Reranking

```javascript
const { CohereReranker } = require('@ruvector/ruvllm/rerank');

const reranker = new CohereReranker({
  model: 'rerank-english-v3.0',
  returnDocuments: true,
  maxChunksPerDoc: 10
});

const reranked = await reranker.rerank({
  query: query,
  documents: documents
});
```

## Context Optimization

### Context Compression

```javascript
const { ContextCompressor } = require('@ruvector/ruvllm/context');

const compressor = new ContextCompressor({
  llm: ollamaClient,
  strategy: 'extractive',  // or 'abstractive', 'hybrid'
  targetLength: 2000,      // Target tokens
  preserveOrder: true
});

// Compress retrieved documents to fit context window
const compressed = await compressor.compress({
  documents: retrievedDocs,
  query: query,
  maxTokens: 4000
});
```

### Lost in the Middle Mitigation

```javascript
const { ContextOrderer } = require('@ruvector/ruvllm/context');

const orderer = new ContextOrderer({
  strategy: 'interleaved',  // Put important docs at start/end
  // Mitigates "lost in the middle" problem
});

const ordered = orderer.order(documents, {
  importanceScores: rerankerScores,
  putBestAt: ['start', 'end']  // Most relevant at edges
});
```

## RAG Evaluation

### Retrieval Metrics

```javascript
const { RAGEvaluator } = require('@ruvector/ruvllm/eval');

const evaluator = new RAGEvaluator({
  metrics: [
    'precision@k',
    'recall@k',
    'mrr',           // Mean Reciprocal Rank
    'ndcg',          // Normalized Discounted Cumulative Gain
    'hit_rate',
    'context_relevance',
    'answer_faithfulness',
    'answer_relevance'
  ]
});

const scores = await evaluator.evaluate({
  queries: testQueries,
  groundTruth: expectedDocuments,
  retrievedDocs: actualResults,
  generatedAnswers: responses
});
```

### RAGAS Metrics

```javascript
const { RAGASEvaluator } = require('@ruvector/ruvllm/eval');

const ragas = new RAGASEvaluator({
  llm: ollamaClient,
  metrics: [
    'faithfulness',     // Is answer grounded in context?
    'answer_relevancy', // Does answer address the question?
    'context_precision',// Are retrieved docs relevant?
    'context_recall'    // Were all needed docs retrieved?
  ]
});

const scores = await ragas.evaluate({
  question: 'How does RuVector persistence work?',
  context: retrievedDocs,
  answer: generatedAnswer,
  groundTruth: referenceAnswer
});
```

## Production Configuration

### RuvLLM RAG Config

```javascript
// config/rag.config.js
module.exports = {
  retrieval: {
    hybrid: {
      enabled: true,
      denseWeight: 0.7,
      sparseWeight: 0.3
    },
    topK: 20,           // Initial retrieval
    reranking: {
      enabled: true,
      model: 'cross-encoder',
      topK: 5           // After reranking
    },
    minSimilarity: 0.5
  },

  chunking: {
    strategy: 'semantic',
    maxChunkSize: 512,
    overlap: 50,
    metadata: {
      includeSource: true,
      includePosition: true
    }
  },

  generation: {
    model: 'qwen3:8b',
    temperature: 0.7,
    maxTokens: 2048,
    contextWindow: 8000,
    streaming: true
  },

  evaluation: {
    enabled: process.env.NODE_ENV !== 'production',
    logQueries: true,
    sampleRate: 0.1
  }
};
```

## Best Practices

1. **Start simple** with naive RAG, add complexity as needed
2. **Measure everything** - retrieval quality, generation quality
3. **Use hybrid search** for better recall
4. **Always rerank** top-k results before generation
5. **Chunk semantically** not by fixed size
6. **Compress context** to stay within token limits
7. **Include metadata** for filtering and debugging
8. **Cache embeddings** for repeated queries
9. **Version your prompts** like code
10. **A/B test** retrieval strategies

## Related Documentation

- [API Reference](./API_INTEGRATION_REFERENCE.md)
- [Knowledge Base Patterns](./KNOWLEDGE_BASE_CONSTRUCTION.md)
- [Monitoring Guide](./MONITORING_OBSERVABILITY.md)
