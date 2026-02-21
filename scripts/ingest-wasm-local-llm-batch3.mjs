#!/usr/bin/env node
/**
 * WASM + Local LLM KB Batch 3 of 3
 * Entries 41-60: Architecture patterns, hardware specs, vector DBs, air-gap, model selection
 */
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres', max: 3
});

let embedder;
async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function embed(text) {
  const e = await getEmbedder();
  const out = await e(text, { pooling: 'mean', normalize: true });
  return '[' + Array.from(out.data).join(',') + ']';
}

function strip(s) { return s.replace(/[^\x00-\x7F]/g, ''); }
function hash(s) { return crypto.createHash('sha256').update(s.toLowerCase().replace(/\s+/g,' ').trim()).digest('hex'); }

const entries = [

{
  title: 'Enterprise Air-Gapped LLM Architecture: Zero Egress Private AI Stack',
  category: 'wasm-local-llm',
  knowledge_type: 'concept',
  expertise_level: 'expert',
  quality_score: 95,
  concepts: ['air-gap', 'enterprise', 'zero-egress', 'private-ai', 'architecture', 'gdpr', 'hipaa', 'data-residency', 'local-stack'],
  content: `## The Air-Gap Imperative for Enterprise

Enterprises in healthcare, legal, finance, government, and defense cannot send data to OpenAI, Anthropic, Google, or Mistral APIs. Reasons include:

- **HIPAA**: Protected Health Information (PHI) cannot transit external systems
- **GDPR**: Data residency requirements prohibit sending EU personal data outside approved jurisdictions
- **Attorney-Client Privilege**: Legal communications cannot be processed by third-party AI
- **Trade Secrets**: Financial models, IP, product roadmaps must not leave the network
- **Government Clearance**: Classified or sensitive data requires air-gapped processing

An air-gapped AI stack means: all inference, all embedding, all vector search, all model storage runs within your network perimeter. Not one byte of payload leaves.

## Complete Air-Gapped Stack Architecture

\`\`\`
+------------------------------------------------------------------+
|                    ENTERPRISE NETWORK PERIMETER                   |
|                                                                  |
|  +-----------+    +-----------+    +-----------+    +----------+ |
|  | Document  |    | Ingestion |    | Vector DB |    | LLM      | |
|  | Sources   |--->| Pipeline  |--->| (Qdrant/  |    | Server   | |
|  | PDF, DOCX |    | (chunking |    | pgvector) |    | (Ollama/ | |
|  | emails    |    | embedding)|    |           |    | llama.cpp)| |
|  +-----------+    +-----------+    +-----------+    +----------+ |
|                         |                |               |      |
|                         v                v               v      |
|                   +----------------------------------------+    |
|                   |        RAG Orchestration Layer          |    |
|                   |   (PrivateGPT / AnythingLLM / Custom)   |    |
|                   +----------------------------------------+    |
|                                   |                             |
|                                   v                             |
|                   +----------------------------------------+    |
|                   |           User Interfaces               |    |
|                   |  Web UI / API / Slack Bot / Copilot     |    |
|                   +----------------------------------------+    |
|                                                                  |
|  NO OUTBOUND CONNECTIONS TO PUBLIC INTERNET                      |
+------------------------------------------------------------------+
\`\`\`

## Component Selection for Air-Gap

| Layer | Recommended | Alternative | Avoid |
|-------|-------------|-------------|-------|
| LLM Server | Ollama | llama.cpp server | OpenAI API |
| LLM Models | Llama 3.1, Phi 4, Mistral | Qwen 2.5 | GPT-4o, Claude |
| Embedding | nomic-embed-text via Ollama | all-MiniLM via Transformers.js | OpenAI embeddings |
| Vector DB | Qdrant (self-hosted) | pgvector | Pinecone, Weaviate Cloud |
| RAG Layer | AnythingLLM (Docker) | PrivateGPT | ChatGPT Enterprise |
| Model Storage | Internal NFS/S3-compatible | Local disk | HuggingFace Hub (at runtime) |
| Model Downloads | Pre-downloaded at setup | Internal registry | Pull at runtime |

## Docker Compose Full Stack

\`\`\`yaml
version: '3.8'
services:
  # LLM Inference
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./models:/root/.ollama  # Pre-staged models
    networks: [ai-internal]
    restart: unless-stopped

  # Vector Database
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - ./qdrant-data:/qdrant/storage
    networks: [ai-internal]
    restart: unless-stopped

  # RAG Knowledge Base
  anythingllm:
    image: mintplexlabs/anythingllm:latest
    ports:
      - "3001:3001"
    environment:
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_PATH=http://ollama:11434
      - OLLAMA_MODEL_PREF=llama3.1:8b
      - EMBEDDING_ENGINE=ollama
      - OLLAMA_EMBED_MODEL_PREF=nomic-embed-text
      - VECTOR_DB=qdrant
      - QDRANT_ENDPOINT=http://qdrant:6333
      - DISABLE_TELEMETRY=true
      - AUTH_TOKEN=\${SECRET_TOKEN}
    volumes:
      - ./anythingllm-storage:/app/server/storage
    depends_on: [ollama, qdrant]
    networks: [ai-internal]
    restart: unless-stopped

networks:
  ai-internal:
    driver: bridge
    internal: true  # NO external network access
\`\`\`

## Model Pre-staging for Air-Gap

\`\`\`bash
# ONLINE MACHINE: Download models before deploying
ollama pull llama3.1:8b
ollama pull nomic-embed-text
ollama pull phi4

# Export models to transferable archive
tar -czf ollama-models.tar.gz ~/.ollama/models

# OFFLINE MACHINE: Restore models
mkdir -p ~/.ollama
tar -xzf ollama-models.tar.gz -C ~/

# Verify models available without internet
OLLAMA_HOST=0.0.0.0 ollama serve &
curl http://localhost:11434/api/tags  # Should list models
\`\`\`

## Network Security Controls

\`\`\`bash
# UFW rules for AI server (Linux)
# Allow only internal network access to Ollama
ufw allow from 10.0.0.0/8 to any port 11434
ufw deny out to any  # Block ALL outbound
ufw allow out to 10.0.0.0/8  # Allow internal only
ufw enable

# Verify no outbound connections
ss -tunap | grep ESTABLISHED  # Should show only internal

# DNS: Configure to internal-only
echo "nameserver 10.0.0.1" > /etc/resolv.conf  # Internal DNS only
\`\`\`

## Data Flow Audit Checklist

- [ ] LLM server has no outbound internet access
- [ ] Models downloaded before network isolation
- [ ] Vector DB runs on internal network only
- [ ] Document ingestion pipeline has no external calls
- [ ] Embedding model runs locally (not via external API)
- [ ] User authentication uses internal directory (LDAP/AD)
- [ ] TLS certificates from internal CA
- [ ] Logs stored internally (no external SIEM initially)
- [ ] Model updates require approval process (not auto-pull)

## Compliance Mapping

| Control | Implementation |
|---------|---------------|
| HIPAA 164.312(a)(1) - Access Control | AnythingLLM RBAC |
| HIPAA 164.312(b) - Audit Controls | AnythingLLM audit logs |
| HIPAA 164.312(e)(1) - Transmission Security | Internal TLS only |
| GDPR Art. 25 - Data Protection by Design | Local-only processing |
| GDPR Art. 32 - Security of Processing | Encryption at rest |
| SOC 2 CC6.1 - Logical Access | Role-based permissions |`
},

{
  title: 'Local Vector Database Guide: Qdrant, Chroma, pgvector for Private AI',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality_score: 91,
  concepts: ['vector-database', 'qdrant', 'chroma', 'pgvector', 'local-rag', 'semantic-search', 'embeddings', 'hnsw', 'self-hosted'],
  content: `## Why Local Vector Databases Matter for Privacy

A vector database stores embedding vectors for semantic similarity search. In a private AI stack, it must run locally - sending document embeddings to Pinecone or Weaviate Cloud means your document content (represented as vectors) leaves your network.

## Local Vector DB Options

### Qdrant (Recommended for Production)

\`\`\`bash
# Docker
docker run -d -p 6333:6333 -p 6334:6334 \\
  -v ./qdrant-storage:/qdrant/storage \\
  qdrant/qdrant:latest

# Docker Compose
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    volumes: ["./data:/qdrant/storage"]
    restart: unless-stopped
\`\`\`

\`\`\`python
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

client = QdrantClient(url="http://localhost:6333")

# Create collection
client.create_collection(
    collection_name="enterprise_docs",
    vectors_config=VectorParams(
        size=768,           # Dimension of your embedding model
        distance=Distance.COSINE,
        on_disk=True,       # For large collections
    ),
)

# Insert vectors
client.upsert(
    collection_name="enterprise_docs",
    points=[
        PointStruct(
            id=1,
            vector=[0.1, 0.2, ...],  # 768-dim embedding
            payload={
                "text": "Document chunk text",
                "source": "policy-v2.3.pdf",
                "page": 4,
                "department": "HR",
            }
        )
    ]
)

# Search
results = client.search(
    collection_name="enterprise_docs",
    query_vector=query_embedding,
    limit=5,
    query_filter={
        "must": [{"key": "department", "match": {"value": "HR"}}]
    }
)
\`\`\`

### ChromaDB (Simplest Local Option)

\`\`\`python
import chromadb

# Persistent local storage
client = chromadb.PersistentClient(path="/var/lib/chroma")

collection = client.create_collection(
    name="enterprise_docs",
    metadata={"hnsw:space": "cosine"}  # Distance metric
)

# Add documents (Chroma handles embedding if you provide a function)
collection.add(
    documents=["Document text here", "Another document"],
    metadatas=[{"source": "policy.pdf"}, {"source": "contract.pdf"}],
    ids=["doc1", "doc2"],
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]]  # Pre-computed
)

# Query
results = collection.query(
    query_embeddings=[query_vector],
    n_results=5,
    where={"source": {"$contains": "policy"}}
)
\`\`\`

### pgvector (Best if Already Using Postgres)

\`\`\`sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vector column
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    source TEXT,
    department TEXT,
    embedding vector(768),  -- Dimension matches embedding model
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index (fast approximate search)
CREATE INDEX ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Insert document with embedding
INSERT INTO documents (content, source, embedding)
VALUES (
    'Our vacation policy allows 15 days per year...',
    'hr-policy-2025.pdf',
    '[0.1, 0.2, 0.3, ...]'::vector
);

-- Semantic search query
SELECT content, source, 1 - (embedding <=> '[...]'::vector) AS similarity
FROM documents
WHERE department = 'HR'
ORDER BY embedding <=> '[...]'::vector
LIMIT 5;
\`\`\`

\`\`\`python
import psycopg2
import numpy as np

conn = psycopg2.connect("postgresql://postgres@localhost:5435/postgres")
cur = conn.cursor()

# Insert with embedding
embedding = get_local_embedding("document text")
cur.execute(
    "INSERT INTO documents (content, source, embedding) VALUES (%s, %s, %s)",
    ("Document text", "source.pdf", embedding.tolist())
)

# Search
query_vec = get_local_embedding("vacation policy")
cur.execute("""
    SELECT content, source, 1 - (embedding <=> %s::vector) as score
    FROM documents
    ORDER BY embedding <=> %s::vector
    LIMIT 5
""", (query_vec.tolist(), query_vec.tolist()))

results = cur.fetchall()
\`\`\`

## Comparison Matrix

| Feature | Qdrant | Chroma | pgvector |
|---------|--------|--------|----------|
| Setup complexity | Medium (Docker) | Low (pip) | Low (extension) |
| Performance | Excellent | Good | Good |
| Filtering | Advanced | Basic | Full SQL |
| Scale | Millions | Thousands | Millions |
| Persistence | Yes | Yes | Yes (Postgres) |
| Backups | Snapshots | File copy | pg_dump |
| Multi-tenancy | Collections | Collections | Schemas/tables |
| Existing infra | New service | New service | Reuses Postgres |
| License | Apache 2.0 | Apache 2.0 | PostgreSQL |

## HNSW Index Tuning

All three support HNSW (Hierarchical Navigable Small World) for fast approximate nearest neighbor search:

\`\`\`python
# Qdrant HNSW config
client.create_collection(
    "docs",
    vectors_config=VectorParams(
        size=768,
        distance=Distance.COSINE,
    ),
    hnsw_config=HnswConfigDiff(
        m=16,               # Connections per node (higher = more memory, better recall)
        ef_construct=100,   # Build-time accuracy (higher = slower build, better quality)
        full_scan_threshold=10000  # Use exact search below this count
    )
)
\`\`\`

## Embedding Dimensions by Model

| Embedding Model | Dimensions | Quality |
|----------------|------------|---------|
| nomic-embed-text | 768 | Excellent |
| all-MiniLM-L6-v2 | 384 | Good |
| all-mpnet-base-v2 | 768 | Excellent |
| mxbai-embed-large | 1024 | Best |
| text-embedding-ada-002 | 1536 | Excellent (OpenAI - cloud) |

For air-gapped: use nomic-embed-text (via Ollama) or all-MiniLM (via Transformers.js).`
},

{
  title: 'Hardware Selection Guide for Private LLM Deployment: CPU vs GPU',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality_score: 90,
  concepts: ['hardware', 'cpu', 'gpu', 'vram', 'ram', 'apple-silicon', 'nvidia', 'local-llm', 'enterprise-hardware', 'performance'],
  content: `## Hardware Decision Framework

The central question: do you need GPU, or can CPU suffice?

CPU-only: Lower cost, simpler setup, adequate for batch processing and moderate traffic
GPU: Required for real-time interactive use with 7B+ models at acceptable latency

## Memory Math: How Much RAM/VRAM Do You Need?

\`\`\`
Required memory = Model size (parameters * bytes per weight) + KV cache + OS overhead

Example: Llama 3.1 8B at Q4_K_M (4-bit):
- Model weights: 8B params * 0.5 bytes = 4.0 GB
- KV cache (8192 ctx): ~0.8 GB
- OS/framework overhead: ~0.5 GB
- Total: ~5.3 GB VRAM or RAM
\`\`\`

## GPU Tiers for Enterprise

### Tier 1: Entry Production (7B models, 10-30 concurrent users)

| GPU | VRAM | Tokens/sec (7B Q4) | Cost (2025) |
|-----|------|--------------------|-------------|
| RTX 4060 Ti 16GB | 16 GB | 60-70 tok/s | ~$500 |
| RTX 4070 Ti Super | 16 GB | 70-85 tok/s | ~$800 |
| RTX 4080 | 16 GB | 80-100 tok/s | ~$1000 |

### Tier 2: Standard Production (13B-34B models)

| GPU | VRAM | Tokens/sec (13B Q4) | Cost (2025) |
|-----|------|--------------------|-------------|
| RTX 4090 | 24 GB | 50-70 tok/s | ~$2000 |
| RTX 3090 | 24 GB | 40-55 tok/s | ~$800 used |
| A10G | 24 GB | 40-60 tok/s | Cloud: $1.5/hr |
| L4 | 24 GB | 45-65 tok/s | Cloud: $0.8/hr |

### Tier 3: High-End (70B models, high throughput)

| GPU | VRAM | Tokens/sec (70B Q4) | Notes |
|-----|------|---------------------|-------|
| A100 40GB | 40 GB | 30-45 tok/s | Data center |
| A100 80GB | 80 GB | 40-60 tok/s | Full 70B + context |
| H100 80GB | 80 GB | 60-90 tok/s | Fastest option |
| 2x RTX 4090 | 48 GB | 35-50 tok/s | Consumer dual GPU |

### Apple Silicon (Best Price/Performance for CPU+GPU unified)

| Chip | Unified Memory | Tokens/sec (7B Q4) | Notes |
|------|---------------|---------------------|-------|
| M2 Pro 32GB | 32 GB | 40-55 tok/s | 13B fits |
| M3 Max 96GB | 96 GB | 70-90 tok/s | 70B fits |
| M3 Max 128GB | 128 GB | 75-95 tok/s | 70B + context |
| M4 Max 128GB | 128 GB | 90-120 tok/s | Best per watt |

Apple Silicon advantage: unified memory means GPU and CPU share RAM, so 96GB M3 Max can run 70B models that would need 2x A100 on traditional hardware.

## CPU-Only Deployment

Viable for: batch processing, low-concurrency use, small models (1B-7B), embeddings

\`\`\`
Minimum production CPU server:
- CPU: AMD EPYC or Intel Xeon, 16+ cores
- RAM: 64 GB (for 7B Q4_K_M with headroom)
- Storage: NVMe SSD (model loading speed matters)
- Network: 1 Gbps internal

Performance expectation:
- 1B Q4: ~30-50 tok/s
- 3B Q4: ~15-25 tok/s
- 7B Q4: ~5-10 tok/s
- 13B Q4: ~3-6 tok/s
\`\`\`

## Model Fit by Hardware

| Hardware | RAM/VRAM | Max Model (Q4_K_M) | Practical Model |
|----------|----------|-------------------|-----------------|
| Laptop (8GB RAM) | 8 GB | 3B | 1B-3B |
| Workstation (32GB RAM) | 32 GB | 13B | 7B |
| Server (64GB RAM, CPU) | 64 GB | 34B | 13B-34B |
| RTX 4090 (24GB VRAM) | 24 GB | 13B | 7B-13B |
| 2x A100 (80GB VRAM) | 160 GB | 70B+ | 70B |
| M3 Max 128GB | 128 GB | 70B | 70B |

## Recommended Enterprise Configurations

### Configuration A: Small Team (5-20 users, 7B model)

\`\`\`
- CPU: AMD Ryzen 9 7950X or Intel Core i9-14900K
- RAM: 64 GB DDR5
- GPU: NVIDIA RTX 4090 (24 GB) - runs 7B at 80 tok/s
- Storage: 2 TB NVMe (models + vector DB)
- OS: Ubuntu 22.04 LTS
- Stack: Ollama + AnythingLLM
- Cost: ~$4000-6000 one-time
\`\`\`

### Configuration B: Medium Team (50-200 users, 13B-34B model)

\`\`\`
- Server: Dell PowerEdge R750 or similar
- CPU: 2x AMD EPYC 7763 (128 cores)
- RAM: 256 GB DDR4 ECC
- GPU: 2x NVIDIA A100 40GB
- Storage: 10 TB NVMe RAID
- Network: 10 Gbps
- Stack: Ollama + AnythingLLM + Qdrant
- Cost: ~$30,000-50,000
\`\`\`

### Configuration C: Enterprise (500+ users, 70B model, high availability)

\`\`\`
- Multiple inference servers (load balanced)
- Each node: 8x H100 80GB
- Total VRAM: 640 GB per node
- Orchestration: Kubernetes
- Model: Llama 3.3 70B or Qwen 2.5 72B
- Stack: vLLM + custom gateway + Qdrant cluster
- Cost: $100,000+ per node
\`\`\`

## Power and Cooling Considerations

| GPU | TDP | Server PSU needed | Annual power cost |
|-----|-----|-------------------|-------------------|
| RTX 4090 | 450W | 1000W+ | ~$450/yr |
| A100 40GB | 300W | 750W+ | ~$300/yr |
| H100 | 700W | 1500W+ | ~$700/yr |

Apple Silicon M3 Max (entire machine): ~50W under load - exceptional efficiency.`
},

{
  title: 'Model Selection Guide for Private Enterprise AI: Which LLM for Which Task',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality_score: 92,
  concepts: ['model-selection', 'llama', 'mistral', 'phi', 'qwen', 'gemma', 'deepseek', 'enterprise', 'task-routing', 'benchmarks'],
  content: `## Model Selection Principles

Enterprise model selection involves: task requirements, hardware constraints, language needs, licensing, and update cadence. There is no single best model - the right choice depends on your specific use case.

## Top Open Models for Enterprise (2025)

### Llama 3.1 / 3.2 / 3.3 (Meta, Llama Community License)

\`\`\`
Sizes: 1B, 3B, 8B, 70B, 405B
Strengths: General purpose, strong reasoning, excellent instruction following
Context: Up to 128K tokens (3.1/3.3), 8K (3.2 lightweight)
Languages: English primary, multilingual support
License: Llama Community License (commercial use allowed, restrictions apply)
GGUF names: Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf

Best for:
- General enterprise assistant (8B)
- Document Q&A (8B, 70B)
- Code generation (8B+)
- Long document processing (128K context, 70B)
\`\`\`

### Mistral Small 3.1 (Mistral AI, Apache 2.0)

\`\`\`
Size: 24B
Strengths: Excellent reasoning, strong multilingual, function calling
Context: 128K tokens
Languages: 11 languages including English, French, German, Spanish, Italian
License: Apache 2.0 (fully commercial friendly)
GGUF: Mistral-Small-3.1-24B-Instruct.Q4_K_M.gguf

Best for:
- Multilingual enterprise deployments
- Complex reasoning tasks
- When Apache 2.0 license is required
- Customer-facing applications (multiple languages)
\`\`\`

### Phi 4 (Microsoft, MIT License)

\`\`\`
Size: 14B
Strengths: Exceptional coding and reasoning for its size, very efficient
Context: 16K tokens
Languages: English primary
License: MIT (fully open, commercial friendly)
GGUF: Phi-4-Q4_K_M.gguf

Best for:
- Code review and generation
- Mathematical reasoning
- Resource-constrained hardware (14B punches above 70B in coding)
- Embedding in developer tools
\`\`\`

### Qwen 2.5 (Alibaba, Apache 2.0)

\`\`\`
Sizes: 0.5B, 1.5B, 3B, 7B, 14B, 32B, 72B
Strengths: Best multilingual, strong coding (Coder variants), long context
Context: 128K tokens
Languages: 29 languages (best non-English support)
License: Apache 2.0 (Qwen 2.5 and below)
GGUF: Qwen2.5-7B-Instruct.Q4_K_M.gguf

Best for:
- Asian language enterprises (Chinese, Japanese, Korean)
- Multilingual document processing
- When Apache 2.0 is required
- Cost-sensitive deployments (0.5B-3B for simple tasks)
\`\`\`

### DeepSeek R1 (DeepSeek, MIT License)

\`\`\`
Sizes: 1.5B, 7B, 8B, 14B, 32B, 70B, 671B
Strengths: Chain-of-thought reasoning, math, complex analysis
Context: 64K tokens
Languages: English, Chinese
License: MIT
GGUF: DeepSeek-R1-Distill-Qwen-7B.Q4_K_M.gguf

Best for:
- Complex multi-step reasoning
- Financial analysis
- Legal document analysis
- Scientific/technical tasks
Note: R1 shows its reasoning chain explicitly - useful for auditability
\`\`\`

### Gemma 2 (Google, Gemma Terms of Use)

\`\`\`
Sizes: 2B, 9B, 27B
Strengths: Balanced quality, Google's training quality
Context: 8K tokens
Languages: English primary
License: Gemma Terms of Use (commercial use allowed with conditions)
GGUF: gemma-2-9b-it.Q4_K_M.gguf

Best for:
- Consumer-grade hardware
- General assistant tasks
- When model size is the constraint
\`\`\`

## Task -> Model Recommendation Matrix

| Task | Recommended Model | Notes |
|------|-----------------|-------|
| General enterprise Q&A | Llama 3.1 8B Q4_K_M | Best balance |
| Document summarization | Llama 3.1 8B / Mistral 7B | 128K context helpful |
| Legal contract analysis | DeepSeek R1 7B / Llama 3.1 70B | Reasoning chain |
| Code review | Phi 4 14B | Best coding per parameter |
| Customer support | Qwen 2.5 7B | Multilingual |
| Financial analysis | DeepSeek R1 14B | Step-by-step reasoning |
| Multilingual docs | Mistral Small / Qwen 2.5 | 29+ languages |
| Embeddings | nomic-embed-text | Purpose-built |
| Fast classification | Llama 3.2 1B / Qwen 0.5B | Latency-first |
| Long docs (100K+) | Llama 3.1 70B (128K) | Full context |
| Air-gap constrained hardware | Phi 3.5 mini / Llama 3.2 3B | Small footprint |

## License Compatibility Guide

| Model Family | License | Commercial Use | Restrictions |
|-------------|---------|---------------|-------------|
| Llama 3.x | Llama Community | Yes | >700M MAU requires Meta license |
| Mistral | Apache 2.0 | Yes | None |
| Phi | MIT | Yes | None |
| Qwen 2.5 | Apache 2.0 | Yes | None |
| DeepSeek R1 | MIT | Yes | None |
| Gemma 2 | Gemma ToU | Yes | Attribution required |

For most enterprise use cases, Apache 2.0 and MIT are cleanest.
Llama license is acceptable for internal enterprise tools (not resale).

## Context Window Practical Limits

\`\`\`
Rule of thumb: 1 page of text = ~500-800 tokens

Model context -> document processing capacity:
- 8K context = ~10-16 pages
- 16K context = ~20-32 pages
- 32K context = ~40-64 pages
- 128K context = ~160-256 pages (entire short book)

For large document RAG, chunk documents regardless of context size.
Use large context models only when full-document reasoning is needed.
\`\`\``
},

{
  title: 'ruvector + Local LLM: Complete Private AI Stack with Zero Egress',
  category: 'wasm-local-llm',
  knowledge_type: 'procedure',
  expertise_level: 'expert',
  quality_score: 93,
  concepts: ['ruvector', 'local-llm', 'private-stack', 'postgres', 'pgvector', 'ollama', 'zero-egress', 'enterprise', 'rag', 'hnsw'],
  content: `## ruvector + Ollama: The Complete Private Stack

ruvector is a PostgreSQL-based vector database with HNSW indexing. Combined with Ollama for local LLM inference, it creates a complete private AI stack with zero external dependencies at runtime.

Architecture:
- **Embeddings**: Local model via Ollama (nomic-embed-text) or Transformers.js
- **Vector Search**: ruvector (Postgres + pgvector + HNSW)
- **LLM Inference**: Ollama (llama.cpp backend)
- **Orchestration**: Custom Node.js/Python app or AnythingLLM

Everything runs in your infrastructure. Nothing leaves.

## Setting Up the Stack

\`\`\`bash
# 1. Start ruvector Postgres (assuming existing setup on port 5435)
# ruvector uses openclaw_memory schema or project-specific schema

# 2. Start Ollama
ollama pull llama3.1:8b
ollama pull nomic-embed-text
ollama serve  # Runs on :11434

# 3. Verify local stack
curl http://localhost:11434/api/tags  # Should list models
psql -h localhost -p 5435 -U postgres -c "SELECT version();"
\`\`\`

## Local Embedding with Ollama

\`\`\`javascript
// embed-local.js - embed text using local Ollama
async function embedLocal(text) {
  const response = await fetch('http://localhost:11434/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      input: text
    })
  });
  const data = await response.json();
  return data.embeddings[0];  // Float array, 768 dimensions
}

// Batch embedding
async function embedBatch(texts) {
  const response = await fetch('http://localhost:11434/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      input: texts  // Array of strings
    })
  });
  const data = await response.json();
  return data.embeddings;  // Array of vectors
}
\`\`\`

## Storing Documents in ruvector

\`\`\`javascript
import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', database: 'postgres'
});

async function ingestDocument(title, content, metadata = {}) {
  const client = await pool.connect();
  try {
    // 1. Generate local embedding
    const embedding = await embedLocal(content.slice(0, 8000));
    const vecStr = '[' + embedding.join(',') + ']';

    // 2. Store in ruvector schema
    await client.query(\`
      INSERT INTO ask_ruvnet.architecture_docs
        (doc_id, title, content, file_path, file_hash, category,
         knowledge_type, concepts, expertise_level, quality_score, embedding)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector)
      ON CONFLICT (doc_id) DO UPDATE
        SET content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
    \`, [
      generateDocId(content),
      title,
      content,
      metadata.filePath || 'ingested/' + title,
      hashContent(content),
      metadata.category || 'general',
      metadata.knowledgeType || 'concept',
      metadata.concepts || [],
      metadata.expertiseLevel || 'intermediate',
      metadata.qualityScore || 80,
      vecStr,
    ]);

    console.log('Ingested:', title);
  } finally {
    client.release();
  }
}
\`\`\`

## Semantic Search with HNSW

\`\`\`javascript
async function semanticSearch(query, options = {}) {
  const { limit = 5, minScore = 0.3, category = null } = options;

  // 1. Embed query locally
  const queryVec = await embedLocal(query);
  const vecStr = '[' + queryVec.join(',') + ']';

  // 2. HNSW similarity search in Postgres
  const client = await pool.connect();
  try {
    const categoryFilter = category
      ? \`AND category = '\${category}'\`
      : '';

    const result = await client.query(\`
      SELECT
        title,
        content,
        category,
        1 - (embedding <=> $1::vector) AS similarity_score
      FROM ask_ruvnet.architecture_docs
      WHERE 1 - (embedding <=> $1::vector) > $2
      \${categoryFilter}
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    \`, [vecStr, minScore, limit]);

    return result.rows;
  } finally {
    client.release();
  }
}
\`\`\`

## RAG Pipeline: Local LLM + ruvector

\`\`\`javascript
async function ragQuery(userQuestion, options = {}) {
  // 1. Retrieve relevant context from ruvector
  const contextDocs = await semanticSearch(userQuestion, {
    limit: 5,
    minScore: 0.4,
    category: options.category,
  });

  if (contextDocs.length === 0) {
    return { answer: "I don't have relevant information on that topic.", sources: [] };
  }

  // 2. Build prompt with retrieved context
  const contextText = contextDocs
    .map((doc, i) => \`[Source \${i+1}: \${doc.title}]\\n\${doc.content}\`)
    .join('\\n\\n');

  const prompt = \`You are an enterprise AI assistant. Answer based ONLY on the provided context.

CONTEXT:
\${contextText}

QUESTION: \${userQuestion}

INSTRUCTIONS:
- Answer based only on the provided context
- If context doesn't contain the answer, say so clearly
- Cite source numbers when referencing specific information
- Be concise and accurate\`;

  // 3. Generate with local LLM (zero egress)
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1:8b',
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 1024 }
    })
  });

  const data = await response.json();

  return {
    answer: data.response,
    sources: contextDocs.map(d => ({ title: d.title, score: d.similarity_score })),
  };
}

// Usage
const result = await ragQuery('What is our data retention policy?');
console.log('Answer:', result.answer);
console.log('Sources:', result.sources);
// ALL processing was local - zero network egress
\`\`\`

## Document Chunking Strategy

\`\`\`javascript
function chunkDocument(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      text: text.slice(start, end),
      startChar: start,
      endChar: end,
    });
    start += chunkSize - overlap;
  }

  return chunks;
}

// Ingest a large document as multiple chunks
async function ingestLargeDocument(title, fullText, metadata) {
  const chunks = chunkDocument(fullText, 1000, 200);

  for (let i = 0; i < chunks.length; i++) {
    await ingestDocument(
      \`\${title} [chunk \${i+1}/\${chunks.length}]\`,
      chunks[i].text,
      { ...metadata, chunkIndex: i, totalChunks: chunks.length }
    );
  }
}
\`\`\`

## Stack Health Check

\`\`\`bash
# Verify all components are local and working
echo "=== Ollama ===" && curl -s http://localhost:11434/api/tags | node -e "
  const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log('Models:', d.models.map(m=>m.name).join(', '));
"

echo "=== ruvector ===" && psql -h localhost -p 5435 -U postgres -c "
  SELECT COUNT(*) as doc_count FROM ask_ruvnet.architecture_docs;
"

echo "=== Embedding test ===" && curl -s http://localhost:11434/api/embed \\
  -d '{"model":"nomic-embed-text","input":"test"}' | \\
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Embedding dims:', d.embeddings[0].length);"

echo "Zero egress stack verified - all components local"
\`\`\``
},

{
  title: 'WASM vs Native Binary: Choosing the Right Deployment Target for Local LLMs',
  category: 'wasm-local-llm',
  knowledge_type: 'concept',
  expertise_level: 'intermediate',
  quality_score: 86,
  concepts: ['wasm', 'native', 'deployment', 'performance', 'browser', 'node.js', 'server', 'trade-offs', 'wllama', 'ollama'],
  content: `## When WASM vs When Native Binary

WASM and native binary deployment serve fundamentally different use cases. Choosing wrong leads to poor performance, unnecessary complexity, or missed privacy opportunities.

## Decision Tree

\`\`\`
Is the LLM running in a web browser?
  YES -> Must use WASM (WebLLM, wllama, Transformers.js)
  NO -> Continue...

Is this a desktop app (Electron, Tauri, macOS/Win/Linux)?
  YES -> Native binary preferred (Ollama, llama.cpp, LM Studio)
  NO -> Continue...

Is this a server/container deployment?
  YES -> Native binary preferred (Ollama, llama.cpp server, LocalAI)
  NO -> Continue...

Is this Node.js with no native binary allowed (edge, restricted env)?
  YES -> WASM via wllama or Transformers.js
  NO -> Use native binary for best performance
\`\`\`

## Performance Comparison: WASM vs Native

| Runtime | 7B Q4_K_M | 1B Q4 | Notes |
|---------|-----------|-------|-------|
| Native (llama.cpp) | 80-120 tok/s | 200+ tok/s | Baseline |
| CUDA GPU (Ollama) | 80-100 tok/s | - | Near-native |
| Metal (Apple) | 70-90 tok/s | 150+ tok/s | Excellent |
| WASM native browser (WebGPU) | 30-60 tok/s | 80+ tok/s | 50-70% native |
| WASM CPU (wllama) | 5-15 tok/s | 30-50 tok/s | 20-30% native |
| Transformers.js WASM | 3-10 tok/s | 20-40 tok/s | Varies by model |

## WASM Advantages

- **Universal deployment**: Runs in any modern browser, no install needed
- **Sandboxed security**: WASM sandbox prevents filesystem/network access
- **Zero installation friction**: Users don't install anything
- **Client-side privacy**: Data stays in browser tab, even separate from server
- **Edge deployment**: Works in Cloudflare Workers, Deno Deploy
- **Cross-platform**: Same code runs on Windows, Mac, Linux, iOS, Android

## Native Binary Advantages

- **2-5x better performance**: Full CPU/GPU instruction sets
- **Larger models**: Not bound by browser memory limits
- **Multi-GPU**: Distribute model across multiple GPUs
- **Background processing**: Not limited by browser tab lifecycle
- **Production reliability**: Battle-tested server infrastructure
- **OS-level resource control**: Fine-tune threads, memory, NUMA

## WASM-Specific Constraints

\`\`\`
Browser WASM:
- Memory: ~4GB per tab (practical limit for model loading)
- Threads: Requires Cross-Origin Isolation headers for SharedArrayBuffer
- Storage: 50MB+ models via IndexedDB (slow on first load)
- Context: Tab lifecycle (model lost when tab closes, unless cached)
- GPU: WebGPU (Chrome/Edge stable, others in progress)

Node.js WASM:
- Memory: Limited by Node.js heap (use --max-old-space-size=8192)
- Performance: No WebGPU, CPU only
- Thread: Worker threads for background processing
- Benefit: Same code as browser, no native compilation
\`\`\`

## Hybrid Architecture: WASM for Edge, Native for Heavy

\`\`\`javascript
// client-router.js
// Routes requests based on model size and available runtime

async function classify(text) {
  if (typeof window !== 'undefined' && navigator.gpu) {
    // Browser with GPU: use WebLLM for small models
    return await webLLMClassify(text, 'SmolLM2-1.7B');
  } else if (typeof window !== 'undefined') {
    // Browser CPU: use Transformers.js for classification
    return await transformersClassify(text);
  } else {
    // Server/Node.js: use Ollama for best performance
    return await ollamaClassify(text, 'llama3.2:1b');
  }
}

async function generateLong(prompt) {
  // Always use server-side for heavy generation
  return await ollamaGenerate(prompt, 'llama3.1:8b');
}
\`\`\`

## Practical Deployment Scenarios

### Scenario A: Enterprise Internal Web App
- **Recommendation**: Ollama server (backend) + fetch API calls (frontend)
- **Why**: Best performance, simple architecture, works in all browsers
- **Privacy**: All data stays on corporate network

### Scenario B: Client-Facing SaaS with Privacy Guarantee
- **Recommendation**: WebLLM (browser) for sensitive queries + server for heavy tasks
- **Why**: Sensitive data never leaves client device
- **Privacy**: Medical, legal, personal data stays in browser

### Scenario C: Offline Desktop Tool (Electron)
- **Recommendation**: llama.cpp native bundled + Electron
- **Why**: Full native performance, bundled model
- **Privacy**: Completely air-gapped

### Scenario D: Edge/Serverless Function
- **Recommendation**: Transformers.js WASM or wllama
- **Why**: No native binary in Cloudflare Workers/Vercel Edge
- **Privacy**: Inference at edge, data never reaches origin

### Scenario E: Mobile Web (iOS/Android Browser)
- **Recommendation**: Transformers.js with small models (< 500MB)
- **Why**: WebGPU on mobile is limited, WASM is universal
- **Privacy**: On-device processing`
},

{
  title: 'Building a Browser-Based Private AI Assistant: End-to-End Implementation',
  category: 'wasm-local-llm',
  knowledge_type: 'example',
  expertise_level: 'intermediate',
  quality_score: 90,
  concepts: ['browser-ai', 'wasm', 'webllm', 'transformers.js', 'wllama', 'private', 'no-server', 'react', 'end-to-end'],
  content: `## Complete Browser-Native AI Assistant

This example shows a complete, privacy-first AI assistant that runs entirely in the browser with no server calls.

## Technology Stack

- **LLM**: WebLLM (WebGPU) with wllama fallback (WASM CPU)
- **Embeddings**: Transformers.js (for local semantic search)
- **Storage**: IndexedDB (model cache) + localStorage (conversation history)
- **Framework**: Vanilla JS (works with React/Vue/Svelte)

## Full Implementation

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Private AI Assistant - All Processing Local</title>
  <script type="importmap">
  {
    "imports": {
      "@mlc-ai/web-llm": "https://esm.run/@mlc-ai/web-llm",
      "@huggingface/transformers": "https://esm.run/@huggingface/transformers"
    }
  }
  </script>
</head>
<body>
  <div id="app">
    <div id="status">Initializing local AI...</div>
    <div id="privacy-badge">ALL PROCESSING LOCAL - ZERO DATA EGRESS</div>
    <div id="chat-container" style="display:none">
      <div id="messages"></div>
      <textarea id="input" placeholder="Ask something privately..."></textarea>
      <button id="send">Send</button>
    </div>
  </div>

  <script type="module">
    import { CreateMLCEngine, hasModelInCache } from '@mlc-ai/web-llm';
    import { pipeline, env } from '@huggingface/transformers';

    // Disable remote model loading
    env.allowRemoteModels = true; // Allow first download only
    env.useBrowserCache = true;   // Cache locally after download

    const STATUS = document.getElementById('status');
    const MESSAGES = document.getElementById('messages');

    let engine = null;
    let embedder = null;
    const history = [];

    // Feature detection - pick best runtime
    const hasWebGPU = !!navigator.gpu;
    const MODEL_ID = hasWebGPU
      ? 'Phi-3.5-mini-instruct-q4f16_1-MLC'  // Fast GPU model
      : null;  // Will use wllama fallback

    async function initAI() {
      if (hasWebGPU && MODEL_ID) {
        STATUS.textContent = 'Loading model via WebGPU...';
        engine = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (r) => {
            STATUS.textContent = r.text;
          }
        });
      } else {
        // WASM fallback via Transformers.js
        STATUS.textContent = 'Loading model via WASM (no GPU detected)...';
        engine = { type: 'wasm' };
        const gen = await pipeline(
          'text-generation',
          'onnx-community/Qwen2.5-0.5B-Instruct',
          { dtype: 'q4', device: 'wasm' }
        );
        engine.generate = gen;
      }

      // Load embedder for local semantic search
      embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'wasm' }
      );

      STATUS.textContent = 'Ready. All AI processing is local to your device.';
      document.getElementById('chat-container').style.display = 'block';
    }

    async function generateResponse(userMessage) {
      history.push({ role: 'user', content: userMessage });

      const systemMsg = {
        role: 'system',
        content: 'You are a private AI assistant. Be helpful and concise.'
      };

      let assistantResponse = '';

      if (engine.type !== 'wasm') {
        // WebLLM path
        const stream = await engine.chat.completions.create({
          messages: [systemMsg, ...history],
          stream: true,
          max_tokens: 512,
          temperature: 0.7,
        });

        const msgEl = addMessage('assistant', '');
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          assistantResponse += delta;
          msgEl.textContent = assistantResponse;
        }
      } else {
        // Transformers.js WASM path
        const output = await engine.generate(
          history.map(m => \`\${m.role}: \${m.content}\`).join('\\n') + '\\nassistant:',
          { max_new_tokens: 256 }
        );
        assistantResponse = output[0].generated_text.split('assistant:').pop().trim();
        addMessage('assistant', assistantResponse);
      }

      history.push({ role: 'assistant', content: assistantResponse });

      // Persist to localStorage (stays local)
      localStorage.setItem('chat_history', JSON.stringify(history));
    }

    function addMessage(role, content) {
      const div = document.createElement('div');
      div.className = \`message \${role}\`;
      div.textContent = content;
      MESSAGES.appendChild(div);
      MESSAGES.scrollTop = MESSAGES.scrollHeight;
      return div;
    }

    document.getElementById('send').addEventListener('click', async () => {
      const input = document.getElementById('input');
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      addMessage('user', text);
      await generateResponse(text);
    });

    document.getElementById('input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send').click();
      }
    });

    // Restore conversation history
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      JSON.parse(saved).forEach(m => {
        history.push(m);
        addMessage(m.role, m.content);
      });
    }

    initAI().catch(console.error);
  </script>
</body>
</html>
\`\`\`

## React Component Version

\`\`\`jsx
// PrivateAI.jsx
import { useState, useEffect, useRef } from 'react';
import { CreateMLCEngine } from '@mlc-ai/web-llm';

export function PrivateAIChat() {
  const [status, setStatus] = useState('Loading...');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const engineRef = useRef(null);

  useEffect(() => {
    async function init() {
      engineRef.current = await CreateMLCEngine(
        'Phi-3.5-mini-instruct-q4f16_1-MLC',
        { initProgressCallback: (r) => setStatus(r.text) }
      );
      setStatus('Ready - all processing is local');
    }
    init();
  }, []);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    const allMessages = [
      { role: 'system', content: 'You are a private enterprise assistant.' },
      ...messages,
      { role: 'user', content: userMsg }
    ];

    let response = '';
    const stream = await engineRef.current.chat.completions.create({
      messages: allMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      response += chunk.choices[0]?.delta?.content || '';
      setMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === 'assistant') {
          updated[updated.length - 1] = { role: 'assistant', content: response };
        } else {
          updated.push({ role: 'assistant', content: response });
        }
        return updated;
      });
    }

    setLoading(false);
  }

  return (
    <div className="private-ai-chat">
      <div className="status">{status}</div>
      <div className="privacy-notice">Zero data egress - all AI runs locally</div>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={\`message \${m.role}\`}>{m.content}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        disabled={loading}
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Generating...' : 'Send'}
      </button>
    </div>
  );
}
\`\`\``
},

{
  title: 'Local AI for Enterprise: Compliance, Security Controls, and Audit Architecture',
  category: 'wasm-local-llm',
  knowledge_type: 'concept',
  expertise_level: 'expert',
  quality_score: 91,
  concepts: ['compliance', 'hipaa', 'gdpr', 'soc2', 'audit', 'security', 'data-governance', 'enterprise', 'access-control', 'pii'],
  content: `## Why Local AI Satisfies Compliance Requirements

Enterprise compliance frameworks (HIPAA, GDPR, SOC 2, FedRAMP, FINRA) share a common concern: data must be processed in controlled, auditable environments. Local LLM deployment satisfies these requirements because:

1. **Data residency**: No data crosses network boundaries to third-party services
2. **Data minimization**: GDPR Art. 5(1)(c) - data processed locally, not retained by vendor
3. **Access controls**: You control who can query the model and what data it sees
4. **Auditability**: Complete logs of queries and responses under your control
5. **Vendor independence**: No dependency on OpenAI/Anthropic service agreements

## HIPAA Technical Safeguards Mapping

| HIPAA Safeguard | Requirement | Local AI Implementation |
|----------------|-------------|------------------------|
| 164.312(a)(1) | Access Control | AnythingLLM RBAC, JWT auth |
| 164.312(a)(2)(i) | Unique User IDs | User accounts per person |
| 164.312(a)(2)(iii) | Auto Logoff | Session timeout configuration |
| 164.312(b) | Audit Controls | Query/response logging to Postgres |
| 164.312(c)(1) | Integrity | HTTPS for internal traffic |
| 164.312(e)(1) | Transmission Security | TLS 1.3 internal network |

## GDPR Article 32 Security Controls

\`\`\`
Pseudonymization: Replace PII before sending to LLM
Encryption: At-rest encryption for model storage and vector DB
Availability: Local deployment eliminates vendor outage risk
Resilience: Model files are your assets, not cloud dependencies
Testing: Regular penetration testing of local AI endpoints
\`\`\`

## PII Detection Before LLM Processing

\`\`\`javascript
import { pipeline } from '@huggingface/transformers';

// Local NER model for PII detection - zero egress
const nerModel = await pipeline(
  'token-classification',
  'Xenova/bert-base-NER',
  { device: 'wasm' }
);

async function sanitizeForLLM(text) {
  const entities = await nerModel(text);

  let sanitized = text;
  const replacements = [];

  // Identify PII entities
  for (const entity of entities) {
    if (['PER', 'ORG'].includes(entity.entity.replace('B-','').replace('I-',''))) {
      const original = entity.word;
      const placeholder = \`[\${entity.entity.replace('B-','').replace('I-','')}]\`;
      sanitized = sanitized.replace(original, placeholder);
      replacements.push({ original, placeholder });
    }
  }

  return { sanitized, replacements };
}

// Usage in RAG pipeline
async function privacyAwareQuery(userQuestion, documents) {
  const { sanitized: safeQuestion, replacements } = await sanitizeForLLM(userQuestion);

  // Send sanitized text to local LLM
  const answer = await localLLMGenerate(safeQuestion, documents);

  // Optionally restore original terms in response
  return { answer, piiReplaced: replacements.length > 0 };
}
\`\`\`

## Audit Logging Architecture

\`\`\`sql
-- Create audit table in Postgres (ruvector schema)
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  session_id TEXT,
  query_hash TEXT NOT NULL,       -- SHA256 of query (no raw PII in log)
  response_hash TEXT NOT NULL,    -- SHA256 of response
  model_used TEXT NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  workspace TEXT,
  pii_detected BOOLEAN DEFAULT FALSE,
  duration_ms INTEGER,
  ip_address INET
);

-- Index for compliance reports
CREATE INDEX ai_audit_user_time ON ai_audit_log(user_id, timestamp);
CREATE INDEX ai_audit_workspace ON ai_audit_log(workspace, timestamp);
\`\`\`

\`\`\`javascript
// Audit middleware for local AI API
async function auditedLLMCall(request) {
  const start = Date.now();
  const queryHash = sha256(request.query);

  const response = await localLLMGenerate(request.query);
  const duration = Date.now() - start;

  // Log to Postgres - no raw query text (privacy-preserving audit)
  await pool.query(\`
    INSERT INTO ai_audit_log
      (user_id, session_id, query_hash, response_hash,
       model_used, tokens_input, tokens_output, duration_ms, ip_address)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
  \`, [
    request.userId, request.sessionId,
    queryHash, sha256(response.text),
    'llama3.1:8b', response.tokenCount.input, response.tokenCount.output,
    duration, request.ip
  ]);

  return response;
}
\`\`\`

## Data Classification and Model Routing

\`\`\`javascript
// Route queries to appropriate model based on data sensitivity
const SENSITIVITY_LEVELS = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
};

const MODEL_ROUTING = {
  [SENSITIVITY_LEVELS.PUBLIC]: {
    model: 'llama3.2:1b',      // Fast, small
    endpoint: 'http://localhost:11434',
    logging: 'minimal',
  },
  [SENSITIVITY_LEVELS.INTERNAL]: {
    model: 'llama3.1:8b',
    endpoint: 'http://localhost:11434',
    logging: 'standard',
  },
  [SENSITIVITY_LEVELS.CONFIDENTIAL]: {
    model: 'llama3.1:8b',
    endpoint: 'http://isolated-ai.internal:11434',  // Separate isolated instance
    logging: 'full',
    requiresMFA: true,
  },
  [SENSITIVITY_LEVELS.RESTRICTED]: {
    model: 'phi4',
    endpoint: 'http://scif-ai.classified.internal:11434',  // Air-gapped SCIF
    logging: 'classified',
    requiresClearance: true,
  },
};

function routeByClassification(classification, userId) {
  const route = MODEL_ROUTING[classification];
  if (route.requiresMFA && !userHasMFA(userId)) {
    throw new Error('MFA required for confidential queries');
  }
  return route;
}
\`\`\`

## Incident Response Plan for Local AI

\`\`\`
IF model generates inappropriate content:
1. Log incident with query hash (not raw query)
2. Alert security team
3. Block user session temporarily
4. Review audit logs for pattern
5. Optionally re-configure system prompt (Modelfile)
6. Document in incident management system

IF unauthorized access attempt detected:
1. Revoke API token immediately
2. Block IP at nginx/firewall level
3. Audit queries made before detection
4. Review access patterns

IF model file integrity compromised:
1. Take inference server offline
2. Verify file hash against known-good baseline
3. Restore from secure backup
4. Audit all queries since last known-good state
\`\`\``
},

{
  title: 'Performance Optimization for Local LLM Inference: Throughput and Latency',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'expert',
  quality_score: 88,
  concepts: ['performance', 'throughput', 'latency', 'optimization', 'batching', 'context', 'gpu-layers', 'flash-attention', 'continuous-batching'],
  content: `## Performance Levers for Local LLM

Local LLM performance has two axes: throughput (tokens per second) and latency (time to first token). Different enterprise use cases prioritize differently:

- **Interactive chat**: Low latency matters most (< 1s TTFT)
- **Document batch processing**: Throughput matters (max tok/s)
- **API with many users**: Both matter (continuous batching)

## GPU Layer Offloading (Most Impactful)

\`\`\`bash
# Every layer offloaded to GPU = significantly faster
# Calculate: model has N layers, each needs X MB VRAM

# Llama 3.1 8B Q4_K_M: 32 transformer layers, ~125 MB each
# RTX 4090 (24GB): offload all 32 layers
llama-server --model llama3.1-8b.Q4_K_M.gguf --n-gpu-layers 99  # 99 = all

# 8GB VRAM: offload ~20 layers (rest on CPU)
llama-server --model llama3.1-8b.Q4_K_M.gguf --n-gpu-layers 20
# Result: ~3x slower than full GPU, but 3x faster than pure CPU

# Monitor GPU usage
nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv -l 1
\`\`\`

## Flash Attention

\`\`\`bash
# Flash attention reduces VRAM by ~50% and speeds up long-context inference
llama-server --model model.gguf --flash-attn

# With flash attention: 8B model can fit in 6GB VRAM at 8K context
# Without: needs 8GB VRAM for same

# Ollama enables flash attention automatically when supported
# llama.cpp: pass --flash-attn flag
\`\`\`

## Continuous Batching for Multi-User

\`\`\`bash
# Without continuous batching: requests queue, one at a time
# With continuous batching: new requests fill empty decode slots

llama-server \\
  --model model.gguf \\
  --parallel 4 \\          # 4 simultaneous decode slots
  --cont-batching \\         # Enable continuous batching
  --ctx-size 32768          # Total context for all slots (32768/4 = 8192 per slot)

# Result: 4x throughput under concurrent load
# Check slots: curl http://localhost:8080/slots
\`\`\`

## Context Size vs Performance

\`\`\`
Context size affects BOTH memory and speed:

8B model, RTX 4090 (24GB):
- ctx 2048:  ~90 tok/s, needs 5.5 GB
- ctx 8192:  ~75 tok/s, needs 7.0 GB
- ctx 32768: ~55 tok/s, needs 12 GB
- ctx 131072: ~25 tok/s, needs ~22 GB

Use the minimum context your use case requires.
\`\`\`

## KV Cache Quantization

\`\`\`bash
# Quantize the KV cache to reduce VRAM at minimal quality cost
llama-server \\
  --model model.gguf \\
  --cache-type-k q8_0 \\    # 8-bit KV cache (was 16-bit)
  --cache-type-v q8_0       # Reduces KV cache VRAM by ~50%
\`\`\`

## CPU Thread Tuning

\`\`\`bash
# For CPU layers (partial GPU offload or CPU-only)
# Optimal threads = physical cores (not hyperthreaded)

# Check physical cores
lscpu | grep "Core(s) per socket"

# Set threads explicitly
llama-server --model model.gguf --threads 8 --threads-batch 8

# Ollama environment variable
OLLAMA_NUM_CPU_THREADS=8 ollama serve
\`\`\`

## mmap vs RAM Loading

\`\`\`bash
# Memory-mapped (default): model file stays on disk, OS pages in as needed
# Pros: fast startup, lower RAM peak, OS handles caching
# Cons: disk I/O on first load, inconsistent latency

# RAM loading: entire model loaded into RAM
llama-server --model model.gguf --no-mmap
# Pros: consistent latency, no disk I/O after startup
# Cons: higher peak RAM, slower startup

# Enterprise recommendation: use --no-mmap for predictable latency on NVMe SSD servers
\`\`\`

## Benchmarking Your Setup

\`\`\`bash
# llama.cpp built-in benchmark
llama-bench \\
  --model model.Q4_K_M.gguf \\
  --prompt 512 \\           # Prompt tokens (prefill)
  --n-gen 256 \\            # Generation tokens
  --n-gpu-layers 99 \\
  --threads 8

# Output shows:
# pp (prompt processing) = tokens/sec for prompt evaluation
# tg (text generation) = tokens/sec for generation
# Both on GPU and CPU layers

# Ollama benchmark
ollama run llama3.1:8b --verbose "Write a 500 word essay" 2>&1 | tail -20
# Shows: eval rate (generation speed)
\`\`\`

## Throughput vs Latency Trade-offs

| Setting | Throughput | Latency | Use Case |
|---------|-----------|---------|----------|
| High ctx (128K) | Lower | Higher | Document analysis |
| Low ctx (2K) | Higher | Lower | Simple Q&A |
| Many parallel slots | Higher | Higher (per user) | Batch API |
| Single slot | Lower | Lowest | Interactive chat |
| Full GPU offload | Highest | Lowest | Best hardware |
| CPU only | Lowest | Highest | No GPU available |

## Prompt Caching

\`\`\`python
# Ollama supports KV cache reuse for repeated prefixes
# If system prompt is reused across requests, it is cached
# Subsequent requests with same prefix skip re-evaluation

response = client.chat.completions.create(
    model='llama3.1:8b',
    messages=[
        {'role': 'system', 'content': LONG_SYSTEM_PROMPT},  # Cached after 1st use
        {'role': 'user', 'content': user_question}
    ]
)
# First request: processes full system prompt
# Subsequent requests: system prompt from cache (instant)
\`\`\``
},

{
  title: 'Deploying Local LLMs with Docker and Kubernetes for Enterprise Scale',
  category: 'wasm-local-llm',
  knowledge_type: 'procedure',
  expertise_level: 'expert',
  quality_score: 89,
  concepts: ['docker', 'kubernetes', 'k8s', 'deployment', 'scaling', 'load-balancing', 'ollama', 'llama.cpp', 'enterprise', 'production'],
  content: `## Docker Production Deployment

### Ollama Production Docker

\`\`\`yaml
# docker-compose.production.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - /data/ollama-models:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_NUM_PARALLEL=8
      - OLLAMA_MAX_LOADED_MODELS=3
      - OLLAMA_KEEP_ALIVE=30m
      - OLLAMA_FLASH_ATTENTION=1
    deploy:
      resources:
        limits:
          memory: 80G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/version"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
\`\`\`

### nginx Load Balancer for Multiple Ollama Instances

\`\`\`nginx
# nginx.conf for Ollama cluster
upstream ollama_cluster {
  least_conn;  # Route to least-loaded server
  server ollama-1:11434;
  server ollama-2:11434;
  server ollama-3:11434;
  keepalive 32;
}

server {
  listen 11434;

  location / {
    proxy_pass http://ollama_cluster;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;           # Critical for streaming
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    # Authentication
    auth_basic "Private AI";
    auth_basic_user_file /etc/nginx/.htpasswd;
  }
}
\`\`\`

## Kubernetes Deployment

\`\`\`yaml
# ollama-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
  namespace: ai-private
spec:
  replicas: 2  # Multiple replicas for HA
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
        - name: ollama
          image: ollama/ollama:latest
          ports:
            - containerPort: 11434
          env:
            - name: OLLAMA_NUM_PARALLEL
              value: "4"
            - name: OLLAMA_KEEP_ALIVE
              value: "30m"
          resources:
            requests:
              memory: "16Gi"
              nvidia.com/gpu: "1"
            limits:
              memory: "32Gi"
              nvidia.com/gpu: "1"
          volumeMounts:
            - name: models
              mountPath: /root/.ollama
          livenessProbe:
            httpGet:
              path: /api/version
              port: 11434
            initialDelaySeconds: 30
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/tags
              port: 11434
            initialDelaySeconds: 60
            periodSeconds: 10
      volumes:
        - name: models
          persistentVolumeClaim:
            claimName: ollama-models-pvc  # Pre-populated with models
      nodeSelector:
        gpu: "true"
      tolerations:
        - key: "nvidia.com/gpu"
          operator: "Exists"
          effect: "NoSchedule"
---
apiVersion: v1
kind: Service
metadata:
  name: ollama
  namespace: ai-private
spec:
  selector:
    app: ollama
  ports:
    - port: 11434
      targetPort: 11434
  type: ClusterIP  # Internal only - no external exposure
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ollama-models-pvc
  namespace: ai-private
spec:
  accessModes: [ReadWriteMany]  # Shared across replicas
  resources:
    requests:
      storage: 200Gi
  storageClassName: nfs-fast  # NFS for shared model storage
\`\`\`

## Model Pre-Population Init Container

\`\`\`yaml
# Init container to pre-pull models before serving traffic
initContainers:
  - name: model-loader
    image: ollama/ollama:latest
    command: ["/bin/sh", "-c"]
    args:
      - |
        ollama serve &
        sleep 5
        ollama pull llama3.1:8b
        ollama pull nomic-embed-text
        ollama pull phi4
        kill %1
    volumeMounts:
      - name: models
        mountPath: /root/.ollama
\`\`\`

## Horizontal Pod Autoscaler

\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ollama-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ollama
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
\`\`\`

## API Gateway with Rate Limiting

\`\`\`yaml
# Kong or Traefik ingress with rate limiting
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ai-rate-limit
spec:
  rateLimit:
    average: 60      # 60 requests per minute
    burst: 10        # Allow burst of 10
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-ingress
  annotations:
    traefik.ingress.kubernetes.io/router.middlewares: ai-rate-limit@kubernetescrd
spec:
  rules:
    - host: ai.internal.corp.net
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: ollama
                port:
                  number: 11434
\`\`\`

## Monitoring with Prometheus

\`\`\`yaml
# Prometheus scrape config for Ollama metrics
scrape_configs:
  - job_name: 'ollama'
    static_configs:
      - targets: ['ollama:11434']
    metrics_path: '/metrics'
    scrape_interval: 15s
\`\`\`

\`\`\`promql
# Key metrics to monitor
# Request rate
rate(ollama_request_total[5m])

# Token generation rate
rate(ollama_tokens_total[5m])

# Model load time
ollama_model_load_duration_seconds

# Queue depth (waiting requests)
ollama_pending_requests_total

# GPU utilization (via nvidia-smi exporter)
DCGM_FI_DEV_GPU_UTIL
\`\`\``
},

];

async function ingest() {
  console.log('=== WASM LOCAL LLM BATCH 3: ' + entries.length + ' ENTRIES ===\n');
  console.log('Loading ONNX embedding model...');
  await getEmbedder();
  console.log('Model loaded.\n');

  const results = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const num = i + 1;
    const cleanTitle = strip(entry.title);
    const cleanContent = strip(entry.content);
    const filePath = 'knowledge/wasm-local-llm/' + cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
    const embedText = (cleanTitle + ' ' + cleanContent).substring(0, 1500);

    console.log('[' + num + '/' + entries.length + '] ' + cleanTitle.substring(0, 60) + '...');

    let kbId = null;
    let status = 'FAIL';

    try {
      const vec = await embed(embedText);

      const existing = await pool.query(
        'SELECT id FROM ask_ruvnet.kb_complete WHERE file_path = $1', [filePath]
      );

      if (existing.rows.length > 0) {
        kbId = existing.rows[0].id;
        await pool.query(
          `UPDATE ask_ruvnet.kb_complete
           SET title=$1, content=$2, category=$3, quality_score=$4,
               chunk_count=1, original_chars=$5, embedding=$6::ruvector
           WHERE id=$7`,
          [cleanTitle, cleanContent, entry.category, entry.quality_score, cleanContent.length, vec, kbId]
        );
      } else {
        const { rows } = await pool.query(
          `INSERT INTO ask_ruvnet.kb_complete
           (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
           VALUES ($1,$2,$3,$4,$5,1,$6,$7::ruvector) RETURNING id`,
          [filePath, cleanTitle, cleanContent, entry.category, entry.quality_score, cleanContent.length, vec]
        );
        kbId = rows[0].id;
      }

      const docId = 'kb-complete-' + kbId;
      const fileHash = crypto.createHash('sha256').update(cleanContent).digest('hex').substring(0, 16);
      const summary = cleanContent.split('\n').filter(l => l.trim() && !l.startsWith('#'))
        .slice(0, 3).join(' ').replace(/\s+/g, ' ').trim().substring(0, 300);

      await pool.query('DELETE FROM ask_ruvnet.architecture_docs WHERE doc_id=$1', [docId]);

      await pool.query(
        `INSERT INTO ask_ruvnet.architecture_docs
         (doc_id, title, content, file_path, file_hash, category, quality_score,
          knowledge_type, concepts, summary, expertise_level, source_authority,
          triage_tier, is_duplicate, embedding)
         SELECT $1,$2,kc.content,$3,$4,$5,kc.quality_score,
                $6,$7::text[],$8,$9,'expert-curated','gold',false,kc.embedding
         FROM ask_ruvnet.kb_complete kc WHERE kc.id=$10`,
        [docId, cleanTitle, filePath, fileHash, entry.category,
         entry.knowledge_type, entry.concepts, summary, entry.expertise_level, kbId]
      );

      const { rows: [v1] } = await pool.query(
        'SELECT embedding IS NOT NULL as has_emb FROM ask_ruvnet.kb_complete WHERE id=$1', [kbId]
      );
      const { rows: [v2] } = await pool.query(
        'SELECT embedding IS NOT NULL as has_emb FROM ask_ruvnet.architecture_docs WHERE doc_id=$1', [docId]
      );

      status = (v1?.has_emb && v2?.has_emb) ? 'PASS' : 'FAIL (missing embedding)';
    } catch (err) {
      status = 'FAIL: ' + err.message.substring(0, 100);
    }

    console.log('  -> ' + status + '  (kb_id: ' + kbId + ')\n');
    results.push({ num, title: cleanTitle, status, kbId });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  console.log('=== SUMMARY ===');
  console.log('Passed: ' + passed + '/' + entries.length);

  await pool.end();
}

ingest().catch(err => { console.error(err); process.exit(1); });
