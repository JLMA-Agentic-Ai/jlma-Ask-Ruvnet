#!/usr/bin/env node
/**
 * WASM + Local LLM KB Batch 2 of 3
 * Entries 21-40: Ollama, LocalAI, PrivateGPT, LM Studio, Jan.ai, AnythingLLM
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
  title: 'Ollama: Local LLM Server with Full API Reference and Docker Deployment',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality_score: 93,
  concepts: ['ollama', 'local-llm', 'docker', 'api', 'openai-compatible', 'modelfile', 'embeddings', 'streaming', 'private'],
  content: `## What It Is and Why It Matters for Privacy

Ollama is the most popular local LLM management tool. It wraps llama.cpp with a clean CLI and REST API, handles model downloads and updates, and provides an OpenAI-compatible API endpoint. Zero data egress: all inference is local. Models run entirely on your hardware.

Key enterprise advantages: simple deployment, Docker-native, OpenAI API drop-in, built-in model versioning, and active model library (Llama, Mistral, Phi, Qwen, Gemma, DeepSeek, and more).

## Installation

\`\`\`bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: download installer from ollama.com
# Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Docker with NVIDIA GPU
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
\`\`\`

## Core CLI Commands

\`\`\`bash
# Pull (download) a model
ollama pull llama3.1:8b
ollama pull llama3.1:8b-instruct-q4_K_M   # Specific quantization
ollama pull phi4
ollama pull qwen2.5:7b
ollama pull mistral:7b
ollama pull nomic-embed-text               # Embedding model
ollama pull deepseek-r1:7b                 # Reasoning model

# Run interactive chat
ollama run llama3.1:8b

# List downloaded models
ollama list

# Remove a model
ollama rm llama3.1:8b

# Show model info
ollama show llama3.1:8b

# Copy model
ollama cp llama3.1:8b my-custom-model

# Check running models
ollama ps
\`\`\`

## Full REST API Reference

Base URL: http://localhost:11434

\`\`\`bash
# Generate (single-turn completion)
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Summarize this document: ...",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 512,
    "num_ctx": 8192
  }
}'

# Chat (multi-turn conversation)
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "messages": [
    {"role": "system", "content": "You are a private enterprise assistant."},
    {"role": "user", "content": "What is our refund policy?"}
  ],
  "stream": true
}'

# Embeddings
curl http://localhost:11434/api/embed -d '{
  "model": "nomic-embed-text",
  "input": ["Document text to embed", "Another document"]
}'

# List models
curl http://localhost:11434/api/tags

# Show model details
curl http://localhost:11434/api/show -d '{"model": "llama3.1:8b"}'

# Pull model via API
curl http://localhost:11434/api/pull -d '{"model": "phi4"}'

# Delete model
curl -X DELETE http://localhost:11434/api/delete -d '{"model": "llama3.1:8b"}'

# Running models
curl http://localhost:11434/api/ps

# Health check
curl http://localhost:11434/api/version
\`\`\`

## OpenAI-Compatible API

Ollama also exposes /v1/ endpoints for drop-in OpenAI replacement:

\`\`\`python
from openai import OpenAI

client = OpenAI(base_url='http://localhost:11434/v1', api_key='ollama')

response = client.chat.completions.create(
    model='llama3.1:8b',
    messages=[{'role': 'user', 'content': 'Hello'}]
)
\`\`\`

## Custom Models with Modelfile

\`\`\`dockerfile
# Modelfile for custom enterprise assistant
FROM llama3.1:8b

# Set system prompt
SYSTEM """
You are Aria, an enterprise AI assistant for Acme Corporation.
You have access to internal policies and procedures.
Never reveal confidential information to unauthorized users.
Always respond formally and professionally.
"""

# Tune parameters
PARAMETER temperature 0.3
PARAMETER num_ctx 16384
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1

# Custom stop tokens
PARAMETER stop "<|end_of_text|>"
PARAMETER stop "[INST]"
\`\`\`

\`\`\`bash
# Build and run custom model
ollama create aria-assistant -f ./Modelfile
ollama run aria-assistant
\`\`\`

## Docker Compose Production Setup

\`\`\`yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_NUM_PARALLEL=4        # Concurrent requests
      - OLLAMA_MAX_LOADED_MODELS=2   # Models in memory
      - OLLAMA_KEEP_ALIVE=5m         # Model unload timeout
    restart: unless-stopped
    # For CPU-only: no GPU config needed
    # For NVIDIA GPU: add deploy.resources below
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  ollama_data:
\`\`\`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| OLLAMA_HOST | 127.0.0.1:11434 | Bind address |
| OLLAMA_NUM_PARALLEL | 1 | Concurrent slots |
| OLLAMA_MAX_LOADED_MODELS | 1 | Simultaneous models |
| OLLAMA_KEEP_ALIVE | 5m | Time before unload |
| OLLAMA_MODELS | ~/.ollama/models | Model storage path |
| OLLAMA_NUM_GPU | auto | GPU layers to use |

## Node.js Client

\`\`\`javascript
import ollama from 'ollama';

// Chat with streaming
const stream = await ollama.chat({
  model: 'llama3.1:8b',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
});

for await (const part of stream) {
  process.stdout.write(part.message.content);
}

// Embeddings for local vector search
const response = await ollama.embed({
  model: 'nomic-embed-text',
  input: 'Document to embed',
});
const vector = response.embeddings[0];
\`\`\`

## Model Library Highlights (2025)

| Model | Pull Command | Best For |
|-------|-------------|----------|
| Phi 4 (14B) | ollama pull phi4 | Reasoning, code |
| Llama 3.3 70B | ollama pull llama3.3:70b | Max quality |
| Qwen 2.5 7B | ollama pull qwen2.5:7b | General use |
| Mistral Small | ollama pull mistral-small3.1 | Enterprise |
| DeepSeek R1 | ollama pull deepseek-r1:7b | Reasoning |
| Nomic Embed | ollama pull nomic-embed-text | Embeddings |
| mxbai-embed | ollama pull mxbai-embed-large | Best embeddings |`
},

{
  title: 'LocalAI: OpenAI-Compatible Local Server Supporting Multiple Backends',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality_score: 88,
  concepts: ['localai', 'openai-compatible', 'llama.cpp', 'whisper', 'docker', 'multi-backend', 'local-server', 'privacy'],
  content: `## What It Is and Why It Matters for Privacy

LocalAI is the most versatile local AI server, acting as a drop-in replacement for the OpenAI API across text, vision, audio, image generation, and embeddings. Unlike Ollama (primarily LLM-focused), LocalAI supports a broad range of backends: llama.cpp, vLLM, Whisper, Stable Diffusion, Bark, and more. Zero data egress - everything runs on your hardware.

Key differentiator: model format flexibility. LocalAI supports GGUF, GGML, Safetensors, PyTorch, GPTQ, and AWQ formats with automatic backend selection.

## Installation

\`\`\`bash
# Docker (recommended)
docker run -p 8080:8080 --name local-ai -ti localai/localai:latest

# Docker with GPU
docker run --gpus all -p 8080:8080 -ti localai/localai:latest-cublas-cuda12

# Docker Compose
curl -o docker-compose.yml https://raw.githubusercontent.com/mudler/LocalAI/master/docker-compose.yaml
docker compose up

# Binary download
curl -Lo local-ai "https://github.com/mudler/LocalAI/releases/latest/download/local-ai-$(uname -s)-$(uname -m)"
chmod +x local-ai && ./local-ai
\`\`\`

## Model Configuration (YAML)

LocalAI uses YAML model configs in the models directory:

\`\`\`yaml
# /models/llama3.yaml
name: llama3
backend: llama-cpp
parameters:
  model: llama-3.1-8B-instruct.Q4_K_M.gguf
  context_size: 8192
  threads: 8
  f16: true
  gpu_layers: 35  # 0 for CPU-only

template:
  chat: |
    <|begin_of_text|><|start_header_id|>system<|end_header_id|>
    {{.SystemPrompt}}<|eot_id|>
    {{range .Messages}}<|start_header_id|>{{.Role}}<|end_header_id|>
    {{.Content}}<|eot_id|>{{end}}
    <|start_header_id|>assistant<|end_header_id|>
\`\`\`

\`\`\`yaml
# /models/embedding.yaml
name: text-embedding-ada-002
backend: llama-cpp
embeddings: true
parameters:
  model: nomic-embed-text-v1.5.Q8_0.gguf
  context_size: 512
\`\`\`

\`\`\`yaml
# /models/whisper.yaml
name: whisper-1
backend: whisper
parameters:
  model: whisper-base.en.bin
\`\`\`

## Supported Backends

| Backend | Formats | Capabilities |
|---------|---------|-------------|
| llama-cpp | GGUF | Chat, completion, embeddings |
| vllm | Safetensors, GPTQ | High-throughput GPU inference |
| transformers | Safetensors, PyTorch | HuggingFace models |
| exllama2 | GPTQ, EXL2 | Fast GPU quantized inference |
| whisper | .bin | Speech-to-text |
| bark | - | Text-to-speech |
| stable-diffusion | .safetensors | Image generation |
| clip | - | Image embeddings |

## API Usage

\`\`\`bash
# Chat completion (identical to OpenAI)
curl http://localhost:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama3",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'

# Embeddings
curl http://localhost:8080/v1/embeddings \\
  -H "Content-Type: application/json" \\
  -d '{"model": "text-embedding-ada-002", "input": "Your text"}'

# Speech to text
curl http://localhost:8080/v1/audio/transcriptions \\
  -F file="@audio.mp3" \\
  -F model="whisper-1"

# List models
curl http://localhost:8080/v1/models
\`\`\`

## Docker Compose for Enterprise

\`\`\`yaml
version: '3.8'
services:
  local-ai:
    image: localai/localai:latest-cublas-cuda12  # CPU: use :latest
    ports:
      - "8080:8080"
    volumes:
      - ./models:/build/models        # Model configs and files
      - ./localai-data:/tmp/localai   # Runtime data
    environment:
      - THREADS=8
      - CONTEXT_SIZE=8192
      - MODELS_PATH=/build/models
      - DEBUG=false
      - GALLERIES=true               # Enable model gallery
    restart: unless-stopped
\`\`\`

## Model Gallery (Auto-Download)

\`\`\`bash
# List available models in gallery
curl http://localhost:8080/models/available

# Install from gallery
curl http://localhost:8080/models/apply -d '{"id": "huggingface@thebloke__llama-2-7b-chat-gguf__llama-2-7b-chat.Q4_K_M.gguf"}'
\`\`\`

## Python Client

\`\`\`python
from openai import OpenAI

client = OpenAI(base_url='http://localhost:8080/v1', api_key='not-needed')

# Works identically to OpenAI
response = client.chat.completions.create(
    model='llama3',
    messages=[{'role': 'user', 'content': 'Analyze this contract...'}]
)
\`\`\`

## vs Ollama Comparison

| Feature | LocalAI | Ollama |
|---------|---------|--------|
| Backends | 10+ (llama.cpp, vLLM, Whisper...) | Primarily llama.cpp |
| Model formats | GGUF, GPTQ, Safetensors, AWQ | Primarily GGUF |
| Audio transcription | Yes (Whisper) | No |
| Image generation | Yes (SD) | No |
| Ease of use | Moderate (YAML config) | Simple (one command) |
| OpenAI compatibility | Full | Full |
| GPU support | CUDA, ROCm, Metal, Vulkan | CUDA, ROCm, Metal |

Use LocalAI when you need multi-modal capabilities. Use Ollama when you need simplicity and LLM-only workloads.`
},

{
  title: 'PrivateGPT: Fully Local RAG System with Zero Data Egress',
  category: 'wasm-local-llm',
  knowledge_type: 'procedure',
  expertise_level: 'intermediate',
  quality_score: 90,
  concepts: ['privategpt', 'rag', 'local-rag', 'document-ingestion', 'vector-store', 'ollama', 'llamaindex', 'fastapi', 'privacy', 'gdpr', 'hipaa'],
  content: `## What It Is and Why It Matters for Privacy

PrivateGPT is a production-ready RAG (Retrieval-Augmented Generation) framework built on FastAPI and LlamaIndex. It enables question-answering over private documents with 100% local processing: LLM inference, embedding generation, and vector storage all run on your hardware. No data egress to any external service.

Compliance relevance: PrivateGPT's local architecture can satisfy GDPR, HIPAA, SOC 2, and FINRA data residency requirements because documents never leave your infrastructure.

## Architecture

\`\`\`
Documents (PDF, DOCX, TXT, MD)
    |
    v
[Ingestion Pipeline]
  - Parse with unstructured.io / pypdf
  - Chunk with configurable overlap
  - Embed with local embedding model
    |
    v
[Local Vector Store]
  - Qdrant / Chroma / Postgres+pgvector
    |
    v
[Query Pipeline]
  User Question -> Embed -> Similarity Search -> Retrieved Chunks
    |                                                    |
    v                                                    v
[Local LLM] <---- prompt with retrieved context --------+
    |
    v
  Answer (never left your machine)
\`\`\`

## Installation

\`\`\`bash
# Prerequisites
git clone https://github.com/zylon-ai/private-gpt
cd private-gpt
pip install poetry
poetry install --extras "ui"

# For Ollama backend (recommended)
poetry install --extras "ui ollama"

# Start with Ollama backend
PGPT_PROFILES=ollama make run
\`\`\`

## Configuration (settings-ollama.yaml)

\`\`\`yaml
# settings-ollama.yaml
server:
  env_name: \${APP_ENV:local}
  port: \${PORT:8001}
  cors:
    enabled: true

llm:
  mode: ollama
  ollama:
    api_base: http://localhost:11434
    model: llama3.1:8b
    keep_alive: 5m
    tfs_z: 1.0

embedding:
  mode: ollama
  ollama:
    api_base: http://localhost:11434
    model: nomic-embed-text
    embed_dim: 768

vectorstore:
  database: qdrant   # qdrant, chroma, postgres

qdrant:
  path: local_data/private_gpt/qdrant
  # For remote Qdrant: url: http://qdrant:6333

nodestore:
  database: simple   # local document store

ui:
  enabled: true
  path: /
\`\`\`

## Document Ingestion API

\`\`\`bash
# Ingest files via API
curl -X POST http://localhost:8001/v1/ingest/files \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@/path/to/document.pdf"

# Ingest text directly
curl -X POST http://localhost:8001/v1/ingest/texts \\
  -H "Content-Type: application/json" \\
  -d '{
    "texts": [
      {
        "text": "Your policy document text here...",
        "metadata": {"source": "policy-v2.3", "department": "HR"}
      }
    ]
  }'

# List ingested documents
curl http://localhost:8001/v1/ingest/list

# Delete a document
curl -X DELETE http://localhost:8001/v1/ingest/{doc_id}
\`\`\`

## RAG Query API

\`\`\`bash
# Query with RAG (retrieves relevant docs, answers based on them)
curl http://localhost:8001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "What is our vacation policy?"}],
    "use_context": true,
    "context_filter": {
      "docs_ids": ["doc-id-1", "doc-id-2"]  # Optional: filter by doc
    },
    "include_sources": true,  # Return source documents used
    "stream": true
  }'

# Response includes sources
# {
#   "choices": [{"message": {"content": "According to the HR policy..."}}],
#   "sources": [{"document": {...}, "score": 0.85}]
# }
\`\`\`

## Python Client

\`\`\`python
from openai import OpenAI

client = OpenAI(base_url='http://localhost:8001/v1', api_key='private')

# RAG query
response = client.chat.completions.create(
    model='private-gpt',
    messages=[{'role': 'user', 'content': 'What does section 4.2 of our SLA say?'}],
    extra_body={
        'use_context': True,
        'include_sources': True
    }
)
print(response.choices[0].message.content)
\`\`\`

## Supported Document Types

- PDF (via pypdf + unstructured)
- DOCX, DOC (Microsoft Word)
- PPTX, PPT (PowerPoint)
- XLSX (Excel)
- TXT, MD
- HTML
- EML (email)
- Images (with vision models)

## Supported Vector Stores

| Store | Type | Best For |
|-------|------|----------|
| Qdrant (local) | File-based | Single-node, no extra service |
| Qdrant (remote) | Client-server | Distributed, production |
| Chroma | File-based | Simple local development |
| Postgres + pgvector | SQL + Vector | Existing Postgres infrastructure |
| Milvus | Distributed | Large-scale enterprise |

## Production Hardening

\`\`\`yaml
# Add authentication
auth:
  enabled: true
  secret: \${AUTH_SECRET}

# Rate limiting
server:
  max_requests_per_minute: 60

# Chunking configuration
ingestion:
  chunk_size: 1024      # Characters per chunk
  chunk_overlap: 200    # Overlap between chunks
\`\`\``
},

{
  title: 'LM Studio: Desktop Local LLM with API Server and Model Management',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality_score: 87,
  concepts: ['lm-studio', 'local-llm', 'api-server', 'model-browser', 'apple-silicon', 'openai-compatible', 'desktop', 'headless'],
  content: `## What It Is and Why It Matters for Privacy

LM Studio is a desktop application (macOS, Windows, Linux) for discovering, downloading, and running LLMs locally. It provides a polished GUI with an integrated chat interface, model browser, and a local API server. All inference is 100% local with zero data egress.

Key enterprise advantages: exceptional Apple Silicon (M1/M2/M3/M4) optimization via Metal acceleration, GPU+RAM memory splitting for running models larger than available VRAM, visual performance indicators, and headless server mode via the llmster daemon.

## Platform Support

| Platform | Architecture | GPU Acceleration |
|----------|-------------|-----------------|
| macOS | Apple Silicon (M1-M4) | Metal (built-in) |
| macOS | Intel | CPU only |
| Windows | x64, ARM64 | CUDA (NVIDIA), Vulkan (AMD/Intel) |
| Linux | x64 | CUDA (NVIDIA), Vulkan |

## API Server

LM Studio's local server is OpenAI-compatible:

\`\`\`bash
# Start server via GUI: Developer tab -> Start Server
# Default: http://localhost:1234

# Or via CLI (headless/daemon)
lms server start --port 1234

# Load a model programmatically
lms load "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF"
\`\`\`

## API Endpoints

| Endpoint | Compat | Description |
|----------|--------|-------------|
| GET /v1/models | OpenAI | List loaded models |
| POST /v1/chat/completions | OpenAI | Chat completion |
| POST /v1/completions | OpenAI | Text completion |
| POST /v1/embeddings | OpenAI | Embeddings |
| POST /v1/responses | OpenAI Responses API | Stateful interactions |

## Python Client

\`\`\`python
from openai import OpenAI

client = OpenAI(base_url='http://localhost:1234/v1', api_key='lm-studio')

# Chat
response = client.chat.completions.create(
    model='lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF',
    messages=[
        {'role': 'system', 'content': 'You are a private enterprise assistant.'},
        {'role': 'user', 'content': 'Summarize our Q3 report.'}
    ],
    temperature=0.3,
    max_tokens=1024
)
print(response.choices[0].message.content)

# Embeddings
embed = client.embeddings.create(
    model='nomic-ai/nomic-embed-text-v1.5-GGUF',
    input=['Text to embed for semantic search']
)
vector = embed.data[0].embedding
\`\`\`

## JavaScript Client

\`\`\`javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:1234/v1',
  apiKey: 'lm-studio'
});

const stream = await client.chat.completions.create({
  model: 'phi-4',
  messages: [{ role: 'user', content: 'Analyze this document...' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
\`\`\`

## lms CLI (Headless Server)

\`\`\`bash
# Install CLI
npm install -g @lmstudio/lms

# Bootstrap
lms bootstrap

# List local models
lms ls

# Load model into server
lms load "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF" \\
  --gpu max          # Use all available GPU
  --context-length 8192

# Unload model
lms unload --all

# Server management
lms server start --port 1234
lms server stop
lms server status

# Get model info
lms model info "meta-llama-3.1-8b-instruct"
\`\`\`

## Memory Splitting (Models Larger than VRAM)

LM Studio's killer feature for enterprise hardware with limited VRAM:

\`\`\`
Example: 70B model (40GB) on Mac with 16GB unified memory
- LM Studio automatically splits model across GPU and system RAM
- GPU layers: as many as fit in VRAM (faster)
- Remaining layers: CPU/RAM (slower but functional)
- Result: 70B models on 16GB machines at reduced speed
\`\`\`

## Model Discovery

LM Studio integrates a model browser (HuggingFace-backed) with:
- Quality vs. speed comparison indicators
- VRAM requirement estimates
- Compatibility warnings
- One-click download with progress

## Performance Characteristics

| Hardware | 7B Q4_K_M | 13B Q4_K_M | Notes |
|----------|-----------|------------|-------|
| M3 Max 128GB | 80+ tok/s | 50+ tok/s | Exceptional |
| M2 Pro 32GB | 40-60 tok/s | 25-35 tok/s | Very good |
| RTX 4090 | 80-120 tok/s | 50-70 tok/s | Top GPU |
| RTX 3080 (10GB) | 60-80 tok/s | Split needed | Good |
| CPU only (i9) | 5-10 tok/s | 3-5 tok/s | Usable |

## Limitations

- GUI-first (CLI is secondary, newer)
- No multi-GPU support
- Model download requires internet (then fully offline)
- Windows ARM64 support is newer, some issues`
},

{
  title: 'Jan.ai: Open-Source Offline-First AI Platform with llama.cpp Backend',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality_score: 85,
  concepts: ['jan-ai', 'offline', 'open-source', 'llama.cpp', 'local-llm', 'cross-platform', 'api-server', 'multimodal'],
  content: `## What It Is and Why It Matters for Privacy

Jan.ai is a fully open-source, cross-platform desktop AI application that runs entirely offline. Unlike LM Studio (partially proprietary), Jan is 100% open source (Apache 2.0) and built for privacy-first deployments. It uses llama.cpp as its inference engine and supports local models from HuggingFace.

Key differentiators: complete open-source transparency (no hidden telemetry), built-in local API server, extension system, and support for both local and optional remote model providers.

## Installation

\`\`\`bash
# Download from jan.ai or GitHub
# Available for: macOS, Windows, Linux

# macOS
brew install --cask jan

# Linux AppImage
chmod +x jan-linux-x86_64-*.AppImage && ./jan-linux-x86_64-*.AppImage

# Check local API server is running
curl http://localhost:1337/v1/models
\`\`\`

## Supported Hardware

| Platform | Acceleration |
|----------|-------------|
| macOS Apple Silicon | Metal |
| macOS Intel | CPU |
| Windows NVIDIA | CUDA |
| Windows AMD | Vulkan |
| Windows Intel Arc | Vulkan |
| Linux NVIDIA | CUDA |
| Linux AMD | ROCm, Vulkan |

## Local API Server

Jan runs a built-in OpenAI-compatible server on port 1337:

\`\`\`bash
# List available models
curl http://localhost:1337/v1/models

# Chat completion
curl http://localhost:1337/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama3.2-3b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'

# Check server status
curl http://localhost:1337/v1/system
\`\`\`

## Python Client

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url='http://localhost:1337/v1',
    api_key='jan'
)

response = client.chat.completions.create(
    model='llama3.2-3b-instruct',
    messages=[{'role': 'user', 'content': 'Analyze this contract...'}]
)
print(response.choices[0].message.content)
\`\`\`

## Model Configuration (JSON)

Jan models are configured via JSON files in the Jan data directory:

\`\`\`json
{
  "id": "llama3.1-8b-instruct",
  "name": "Llama 3.1 8B Instruct",
  "model": "llama3.1-8b-instruct",
  "version": "1.0",
  "description": "Meta Llama 3.1 8B instruction-tuned model",
  "format": "gguf",
  "settings": {
    "ctx_len": 8192,
    "prompt_template": "<|start_header_id|>system<|end_header_id|>\\n{system_prompt}<|eot_id|>"
  },
  "parameters": {
    "temperature": 0.7,
    "top_p": 0.95,
    "stream": true,
    "max_tokens": 2048,
    "frequency_penalty": 0,
    "presence_penalty": 0
  },
  "metadata": {
    "author": "Meta",
    "tags": ["llama", "instruct"],
    "size": 4661000000
  },
  "engine": "nitro"
}
\`\`\`

## Nitro Engine (Jan's llama.cpp wrapper)

Jan uses "Nitro" - its own C++ wrapper around llama.cpp that exposes the Jan API:

\`\`\`bash
# Nitro is bundled - no separate installation
# It handles:
# - Model loading and unloading
# - Context management
# - Multi-threaded inference
# - GPU layer offloading
\`\`\`

## Multimodal Support (v0.6.9+, August 2025)

\`\`\`python
import base64
from openai import OpenAI

client = OpenAI(base_url='http://localhost:1337/v1', api_key='jan')

with open('document_scan.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

response = client.chat.completions.create(
    model='llava-v1.6-mistral-7b',  # Vision model
    messages=[{
        'role': 'user',
        'content': [
            {'type': 'text', 'text': 'Extract all text from this document.'},
            {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{image_data}'}}
        ]
    }]
)
\`\`\`

## vs LM Studio Comparison

| Feature | Jan.ai | LM Studio |
|---------|--------|-----------|
| License | Apache 2.0 (fully open) | Proprietary GUI |
| Telemetry | None | Minimal opt-in |
| API port | 1337 | 1234 |
| Extension system | Yes | No |
| Remote providers | Optional | Optional |
| CLI daemon | No | Yes (lms) |
| Apple Silicon | Good | Excellent |
| Open source | 100% | Partial |

Use Jan when open-source compliance and transparency matter. Use LM Studio when Apple Silicon performance is the top priority.`
},

{
  title: 'AnythingLLM: Enterprise Local RAG Knowledge Base with Docker Deployment',
  category: 'wasm-local-llm',
  knowledge_type: 'procedure',
  expertise_level: 'intermediate',
  quality_score: 91,
  concepts: ['anythingllm', 'local-rag', 'knowledge-base', 'docker', 'enterprise', 'multi-user', 'ollama', 'vector-db', 'mcp', 'privacy'],
  content: `## What It Is and Why It Matters for Privacy

AnythingLLM is an all-in-one enterprise AI application that combines document RAG, AI agents, and multi-user management in a single deployable package. It supports completely local operation with no data leaving your infrastructure, connecting to local LLMs (via Ollama, LM Studio, Jan, llama.cpp) and local vector databases (LanceDB, Chroma, Qdrant, Weaviate, Milvus).

Key enterprise features: role-based access control, audit logs, workspace isolation, MCP tool support (Docker), and a no-code agent builder.

## Installation Options

\`\`\`bash
# Desktop (single user) - macOS, Windows, Linux
# Download from anythingllm.com

# Docker (multi-user, recommended for enterprise)
docker pull mintplexlabs/anythingllm

docker run -d \\
  -p 3001:3001 \\
  -v ~/.anythingllm:/app/server/storage \\
  --name anythingllm \\
  mintplexlabs/anythingllm

# Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  anythingllm:
    image: mintplexlabs/anythingllm:latest
    ports:
      - "3001:3001"
    volumes:
      - ./anythingllm-storage:/app/server/storage
    environment:
      - STORAGE_DIR=/app/server/storage
      # LLM: point to local Ollama
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_PATH=http://ollama:11434
      - OLLAMA_MODEL_PREF=llama3.1:8b
      # Embeddings: local
      - EMBEDDING_ENGINE=ollama
      - OLLAMA_EMBED_MODEL_PREF=nomic-embed-text
      # Vector DB: built-in LanceDB (no external service)
      - VECTOR_DB=lancedb
      # Auth
      - AUTH_TOKEN=\${AUTH_TOKEN}
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:
EOF

docker compose up -d
\`\`\`

## LLM Provider Configuration

AnythingLLM supports many local providers:

| Provider | Config Key | URL |
|----------|-----------|-----|
| Ollama | LLM_PROVIDER=ollama | OLLAMA_BASE_PATH |
| LM Studio | LLM_PROVIDER=lmstudio | LM_STUDIO_BASE_PATH |
| LocalAI | LLM_PROVIDER=localai | LOCAL_AI_BASE_PATH |
| Jan.ai | LLM_PROVIDER=jan | JAN_API_BASE |
| llama.cpp server | LLM_PROVIDER=llamacpp | - |

## Vector Database Options

| DB | Type | Best For |
|----|------|----------|
| LanceDB | Embedded (default) | Zero extra services |
| Chroma | Local server | Simple self-hosted |
| Qdrant | Local or remote | Production scale |
| Weaviate | Local or cloud | Multi-modal |
| Milvus | Distributed | Large enterprise |
| PgVector | Postgres extension | Existing Postgres |

## Document Ingestion

\`\`\`bash
# Via web UI: Workspace -> Upload Documents
# Supported: PDF, DOCX, TXT, MD, HTML, CSV, JSON, YouTube URLs, web pages

# Via API
curl -X POST http://localhost:3001/api/v1/document/raw-text \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "textContent": "Policy document content here...",
    "metadata": {"title": "HR Policy v2.3", "docAuthor": "HR Team"}
  }'

# Upload file
curl -X POST http://localhost:3001/api/v1/document/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@contract.pdf"
\`\`\`

## REST API

\`\`\`bash
# List workspaces
curl http://localhost:3001/api/v1/workspaces \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Chat in workspace (RAG query)
curl http://localhost:3001/api/v1/workspace/{slug}/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What does our refund policy say?",
    "mode": "chat"  # "chat" (with RAG) or "query" (RAG only)
  }'

# Streaming chat
curl http://localhost:3001/api/v1/workspace/{slug}/stream-chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Summarize the Q3 report", "mode": "chat"}'
\`\`\`

## Multi-User and Permissions

\`\`\`bash
# Create user via admin panel or API
curl -X POST http://localhost:3001/api/v1/admin/users/new \\
  -H "Authorization: Bearer ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "jane.smith",
    "password": "secure-password",
    "role": "default"   # "admin" | "manager" | "default"
  }'

# Assign workspace to user
curl -X POST http://localhost:3001/api/v1/admin/workspaces/{id}/update-users \\
  -H "Authorization: Bearer ADMIN_KEY" \\
  -d '{"userIds": [1, 2, 3]}'
\`\`\`

## MCP Tool Integration (Docker)

\`\`\`bash
# Add MCP tools to agents (Docker deployment only)
# Via admin UI: Settings -> Agent Skills -> MCP Servers
# Supports any MCP-compatible tool server
\`\`\`

## Enterprise Environment Variables

\`\`\`bash
# Security
AUTH_TOKEN=your-instance-api-key
JWT_SECRET=your-jwt-secret
DISABLE_TELEMETRY=true

# Performance
MAX_IMPORT_CHUNK_SIZE=1000  # Characters per chunk
EMBEDDING_MODEL_MAX_CHUNK_LENGTH=512

# Limits
DOCUMENT_SIMILARITY_THRESHOLD=0.25
WORKSPACE_MAX_DOCUMENT_RETENTION_PERIOD_DAYS=90
\`\`\``
},

{
  title: 'Ollama Modelfile: Custom Enterprise Models and System Prompts',
  category: 'wasm-local-llm',
  knowledge_type: 'procedure',
  expertise_level: 'intermediate',
  quality_score: 86,
  concepts: ['ollama', 'modelfile', 'custom-model', 'system-prompt', 'parameters', 'fine-tuning', 'enterprise', 'persona'],
  content: `## What Is a Modelfile

A Modelfile is Ollama's configuration DSL for creating custom model variants. It lets you bundle a base model with a custom system prompt, parameter defaults, and a specific chat template - creating a reusable model tailored for your enterprise use case without any training.

## Modelfile Syntax

\`\`\`dockerfile
# Modelfile reference

# Required: Base model
FROM llama3.1:8b               # Use Ollama model
# FROM /path/to/model.gguf    # Or local GGUF file

# Optional: System prompt (sets default context)
SYSTEM """
You are an AI assistant for Acme Corporation's legal department.
- You have expertise in contract law and corporate governance.
- When uncertain, clearly state limitations.
- Never provide binding legal advice.
- Cite specific sections when referencing documents.
- Always maintain attorney-client privilege principles.
"""

# Optional: Model parameters
PARAMETER temperature 0.1        # Low = deterministic, 0.0-2.0
PARAMETER top_p 0.9              # Nucleus sampling
PARAMETER top_k 40               # Top-k sampling
PARAMETER num_predict 2048       # Max output tokens
PARAMETER num_ctx 32768          # Context window size
PARAMETER repeat_penalty 1.1     # Reduce repetition
PARAMETER seed 42                # Reproducible outputs (0 = random)
PARAMETER stop "<|eot_id|>"     # Stop tokens

# Optional: Chat template (usually auto-detected from model)
TEMPLATE """{{ if .System }}<|start_header_id|>system<|end_header_id|>
{{ .System }}<|eot_id|>{{ end }}{{ range .Messages }}<|start_header_id|>{{ .Role }}<|end_header_id|>
{{ .Content }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>
"""
\`\`\`

## Enterprise Model Examples

\`\`\`dockerfile
# Legal Assistant
FROM llama3.1:8b-instruct-q5_K_M

SYSTEM """
You are LexAI, Acme Corporation's internal legal assistant.
You analyze contracts, identify risks, and summarize legal documents.
Jurisdiction: United States Federal and California state law.
Confidentiality: All interactions are attorney-client privileged.
Limitations: You provide legal information, not legal advice.
When answering: Be precise, cite specific clauses, flag ambiguities.
"""

PARAMETER temperature 0.05  # Very deterministic for legal use
PARAMETER num_ctx 32768     # Large context for long contracts
PARAMETER num_predict 4096
\`\`\`

\`\`\`dockerfile
# Customer Support Agent
FROM qwen2.5:7b

SYSTEM """
You are HelpBot, Acme Corporation customer support assistant.
Products: CloudSuite Enterprise, CloudSuite Pro, CloudSuite Starter.
Tone: Friendly, professional, empathetic.
Escalation: For billing issues or legal complaints, reply with [ESCALATE].
Language: Match the customer's language.
SLA: Acknowledge within 1 sentence, then answer.
"""

PARAMETER temperature 0.7
PARAMETER num_ctx 8192
\`\`\`

\`\`\`dockerfile
# Code Review Assistant
FROM codellama:13b-instruct-q4_K_M

SYSTEM """
You are CodeGuard, Acme's senior code reviewer.
Focus areas: Security vulnerabilities, performance issues, code style (PEP8/ESLint).
Output format: Markdown with severity levels [CRITICAL/HIGH/MEDIUM/LOW/INFO].
Languages: Python, TypeScript, Go, SQL.
Always explain WHY something is an issue, not just what.
"""

PARAMETER temperature 0.2
PARAMETER num_ctx 16384
\`\`\`

## Building and Testing

\`\`\`bash
# Create model from Modelfile
ollama create legal-assistant -f ./Modelfiles/legal.Modelfile

# Verify model was created
ollama list | grep legal-assistant

# Test interactively
ollama run legal-assistant "Review this indemnification clause: ..."

# Test via API
curl http://localhost:11434/api/generate -d '{
  "model": "legal-assistant",
  "prompt": "Summarize key risks in this contract clause: ...",
  "stream": false
}'

# Test chat endpoint
curl http://localhost:11434/api/chat -d '{
  "model": "legal-assistant",
  "messages": [{"role": "user", "content": "What are the penalties in section 7?"}]
}'
\`\`\`

## Multi-Model Pipeline

\`\`\`bash
# Create specialized models for a pipeline
ollama create extractor -f extract.Modelfile     # Extract data
ollama create classifier -f classify.Modelfile   # Classify documents
ollama create summarizer -f summarize.Modelfile  # Generate summaries
ollama create qa-checker -f qa.Modelfile         # Quality check

# Pipeline in Python
import httpx

async def process_document(doc_text):
    base = "http://localhost:11434/api/generate"

    # Step 1: Extract key data
    extracted = await post(base, model="extractor", prompt=doc_text)

    # Step 2: Classify
    category = await post(base, model="classifier", prompt=extracted)

    # Step 3: Summarize
    summary = await post(base, model="summarizer", prompt=extracted)

    return {"category": category, "summary": summary}
\`\`\`

## Saving and Distributing Models

\`\`\`bash
# Export to GGUF (for distribution without Ollama)
ollama show --modelfile my-model > exported.Modelfile

# Copy between Ollama instances (same network)
# On source: ollama push mymodel (needs registry)
# Better: copy ~/.ollama/models directory

# List all custom models
ollama list | grep -v "^NAME"
\`\`\``
},

{
  title: 'LocalAI vs Ollama vs LM Studio: Choosing the Right Local LLM Server',
  category: 'wasm-local-llm',
  knowledge_type: 'concept',
  expertise_level: 'intermediate',
  quality_score: 88,
  concepts: ['local-llm-comparison', 'ollama', 'localai', 'lm-studio', 'jan-ai', 'selection-guide', 'enterprise', 'trade-offs'],
  content: `## Decision Framework for Enterprise Local LLM Server

Choosing the wrong tool means rework. This guide maps use cases to the right tool.

## Feature Matrix

| Feature | Ollama | LocalAI | LM Studio | Jan.ai |
|---------|--------|---------|-----------|--------|
| Ease of setup | Excellent | Moderate | Excellent | Good |
| OpenAI compatible | Full | Full | Full | Full |
| Model formats | GGUF | GGUF, GPTQ, Safetensors, AWQ | GGUF | GGUF |
| Audio (Whisper) | No | Yes | No | No |
| Image generation | No | Yes (SD) | No | No |
| Embeddings | Yes | Yes | Yes | Yes |
| Multi-modal LLM | Partial | Yes | Partial | Yes (v0.6.9+) |
| GUI | CLI + minimal | None | Full GUI | Full GUI |
| Headless | Yes | Yes | Yes (lms daemon) | No |
| Docker | Official | Recommended | No | No |
| Multi-GPU | No | No | No | No |
| License | MIT | MIT | Proprietary GUI | Apache 2.0 |
| Apple Silicon | Good | Moderate | Excellent | Good |
| API port | 11434 | 8080 | 1234 | 1337 |

## Use Case -> Tool Mapping

### "I need the simplest possible local chat endpoint"
-> **Ollama**. One command install, one command to pull a model, immediate API.

### "I need OpenAI API replacement with maximum model format support"
-> **LocalAI**. Supports every quantization format and multiple backends. More config, more power.

### "I need a developer GUI with Apple Silicon optimization"
-> **LM Studio**. Best M-series performance, visual model browser, memory splitting.

### "I need full open-source transparency, no proprietary components"
-> **Jan.ai**. 100% Apache 2.0, no telemetry, community-auditable.

### "I need audio transcription AND LLM in one service"
-> **LocalAI**. Only option with Whisper backend.

### "I need a quick self-hosted RAG knowledge base"
-> **AnythingLLM** (uses Ollama as backend) or **PrivateGPT**.

### "I need maximum GPU performance for production throughput"
-> **vLLM** (not covered here) or **LocalAI with vLLM backend**.

## Performance Comparison (7B Q4_K_M on RTX 3090)

| Tool | Throughput (tok/s) | Latency (TTFT) | Notes |
|------|-------------------|--------------------|-------|
| llama.cpp native | 80-100 | ~0.5s | Baseline |
| Ollama | 75-90 | ~0.8s | Slight overhead |
| LocalAI | 70-85 | ~1.0s | Backend overhead |
| LM Studio | 75-95 | ~0.7s | Optimized |
| Jan.ai | 70-85 | ~0.9s | Nitro engine |

## Docker-Readiness Comparison

| Tool | Official Docker Image | Compose Support | Air-Gap Ready |
|------|----------------------|-----------------|---------------|
| Ollama | Yes | Yes | Yes (with volume mounts) |
| LocalAI | Yes (multiple tags) | Yes | Yes |
| LM Studio | No | No | Partially (desktop app) |
| Jan.ai | No | No | Yes (portable) |

## Resource Usage (7B Q4_K_M loaded)

| Tool | RAM overhead | Startup time | Model reload |
|------|-------------|--------------|--------------|
| Ollama | ~100MB | ~2s | ~5s |
| LocalAI | ~150MB | ~3s | ~8s |
| LM Studio | ~200MB | ~5s | ~3s |
| Jan.ai | ~200MB | ~5s | ~4s |

## Recommendation for Most Enterprise Deployments

**Primary**: Ollama (server/Docker) + AnythingLLM (RAG interface)

This combination gives:
- Simple model management (Ollama)
- Full RAG capabilities (AnythingLLM)
- Multi-user access with permissions (AnythingLLM)
- Zero configuration vector storage (LanceDB)
- Docker-compose single deployment

**Alternative for multi-modal needs**: LocalAI + PrivateGPT`
},

{
  title: 'PrivateGPT vs AnythingLLM: Choosing the Right Local RAG Platform',
  category: 'wasm-local-llm',
  knowledge_type: 'concept',
  expertise_level: 'intermediate',
  quality_score: 85,
  concepts: ['privategpt', 'anythingllm', 'local-rag', 'comparison', 'enterprise', 'document-qa', 'selection-guide'],
  content: `## When You Need Local RAG

Local RAG (Retrieval-Augmented Generation) lets you query your private documents with an LLM. Both PrivateGPT and AnythingLLM solve this with zero data egress, but they target different needs.

## Feature Comparison

| Feature | PrivateGPT | AnythingLLM |
|---------|-----------|-------------|
| Primary use | API-first RAG service | End-user knowledge base |
| UI | Gradio (basic) | Full React SPA |
| Multi-user | No (single user) | Yes (roles + permissions) |
| API | FastAPI REST | REST API |
| Document types | PDF, DOCX, TXT, HTML, PPTX | PDF, DOCX, TXT, HTML, CSV, YT, web |
| Vector DBs | Qdrant, Chroma, Postgres, Milvus | LanceDB, Chroma, Qdrant, Weaviate, PgVector |
| LLM backends | Ollama, llama.cpp, OpenAI-compat | Ollama, LM Studio, LocalAI, Jan, +cloud |
| Agents | No | Yes (no-code builder) |
| MCP support | No | Yes (Docker) |
| Audit logs | No | Yes |
| Workspace isolation | No | Yes |
| Installation | Python/Poetry | Docker or Desktop app |
| License | Apache 2.0 | MIT |
| Best for | Developers building custom RAG | End users and enterprise teams |

## PrivateGPT Strengths

1. **Developer-friendly API**: Clean FastAPI endpoints, well-documented, easy to integrate into existing apps
2. **LlamaIndex integration**: Full access to LlamaIndex primitives for custom pipelines
3. **Source attribution**: Every answer includes which document chunks were used
4. **Granular control**: Fine-tune chunking, embedding, retrieval parameters
5. **Lightweight**: No heavy frontend, minimal overhead

\`\`\`python
# PrivateGPT - clean programmatic API
from openai import OpenAI

client = OpenAI(base_url='http://localhost:8001/v1', api_key='private')
response = client.chat.completions.create(
    model='private-gpt',
    messages=[{'role': 'user', 'content': 'What are the termination conditions?'}],
    extra_body={'use_context': True, 'include_sources': True}
)
# Access sources
sources = response.model_extra.get('sources', [])
\`\`\`

## AnythingLLM Strengths

1. **Multi-user with RBAC**: Roles (admin/manager/default), workspace isolation
2. **Production UI**: Full-featured chat interface out of the box
3. **Agent workflows**: No-code agent builder with tool use
4. **MCP compatibility**: Integrate any MCP tool server (Docker)
5. **Flexible LLM routing**: Switch providers without document re-ingestion
6. **Audit logs**: Track who queried what (compliance)

\`\`\`bash
# AnythingLLM - team deployment in 2 commands
docker compose up -d  # Starts AnythingLLM + Ollama
# Access: http://localhost:3001
# Create workspaces per team, assign documents, set permissions
\`\`\`

## Decision Guide

**Choose PrivateGPT when:**
- You are a developer building a custom RAG application
- You need programmatic API access with fine-grained control
- You want to integrate RAG into an existing system
- Single-user or API-only access is sufficient
- You need the cleanest embedding/retrieval pipeline

**Choose AnythingLLM when:**
- Non-technical users need to query documents directly
- You need multi-user access with permissions
- You want a complete, ready-to-deploy solution
- Teams need workspace isolation
- You want agent capabilities without coding

## Hybrid Approach

For complex enterprise deployments, use both:
- AnythingLLM for the internal team knowledge base (UI + RBAC)
- PrivateGPT API for application-level RAG in internal tools

Both connect to the same Ollama instance and local vector stores.`
},

];

async function ingest() {
  console.log('=== WASM LOCAL LLM BATCH 2: ' + entries.length + ' ENTRIES ===\n');
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
