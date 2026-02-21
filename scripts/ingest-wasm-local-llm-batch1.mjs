#!/usr/bin/env node
/**
 * WASM + Local LLM KB Batch 1 of 3
 * Entries 1-11: Transformers.js, WebLLM, wllama, llama.cpp, ONNX Runtime Web
 * Uses correct kb_complete -> architecture_docs pattern (ruvector type)
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

const entries = [

{
  path: 'knowledge/wasm-local-llm/transformers-js-overview',
  title: 'Transformers.js: Running ONNX Models in the Browser via WASM',
  category: 'wasm-local-llm',
  knowledge_type: 'concept',
  expertise_level: 'intermediate',
  quality: 92,
  concepts: ['transformers.js', 'onnx', 'wasm', 'browser-ai', 'huggingface', 'local-llm', 'privacy', 'no-egress'],
  content: `## What It Is and Why It Matters for Privacy

Transformers.js is the official HuggingFace JavaScript library for running transformer models entirely in the browser or Node.js, with zero server calls. It uses ONNX Runtime under the hood to execute pre-converted ONNX models, meaning user data never leaves the device. For enterprise clients with strict data-privacy requirements, this is the gold standard for client-side AI: no OpenAI API key, no Anthropic calls, no data egress whatsoever.

The library mirrors the Python transformers API almost exactly, making it familiar to ML engineers while being deployable on any web frontend or Node.js backend.

## Installation

npm install @huggingface/transformers
# or legacy package
npm install @xenova/transformers

## Supported Task Types

- Text generation (chat, completion)
- Feature extraction (embeddings)
- Text classification / sentiment analysis
- Token classification (NER)
- Question answering
- Summarization
- Translation
- Zero-shot classification
- Image classification, object detection, segmentation
- Audio classification, ASR (speech-to-text)
- Depth estimation, image-to-text

## Quantization Options (dtype parameter in v3)

| dtype value | Bits | Use case |
|-------------|------|----------|
| fp32 | 32 | Full precision, largest |
| fp16 | 16 | Half precision, GPU/WebGPU |
| q8 / int8 | 8 | Near-lossless, balanced |
| q4 | 4 | Smallest, fastest, slight quality loss |
| q4f16 | 4/16 mixed | 4-bit weights, 16-bit activations |

## Code Example: Chat (Text Generation) Fully Offline

\`\`\`javascript
import { pipeline } from '@huggingface/transformers';

// Load model once - subsequent loads use browser cache
const generator = await pipeline(
  'text-generation',
  'onnx-community/Qwen2.5-0.5B-Instruct',
  {
    dtype: 'q4',        // 4-bit quantized for minimal memory
    device: 'wasm',     // Force WASM for max compatibility
    // device: 'webgpu' // Optional: GPU acceleration if available
  }
);

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Summarize our data retention policy.' }
];

const output = await generator(messages, { max_new_tokens: 256 });
console.log(output[0].generated_text.at(-1).content);
\`\`\`

## Code Example: Embeddings (Semantic Search)

\`\`\`javascript
import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2',
  { device: 'wasm' }
);

const texts = ['Enterprise data policy', 'GDPR compliance requirements'];
const embeddings = await extractor(texts, { pooling: 'mean', normalize: true });
// Returns Float32Array vectors - store in local vector DB
console.log(embeddings.tolist());
\`\`\`

## Running Completely Offline

\`\`\`javascript
import { env, pipeline } from '@huggingface/transformers';

// Disable ALL remote fetching
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = '/path/to/local/onnx/models/';

// Now all model loads are purely local
const classifier = await pipeline('text-classification', 'my-local-model');
\`\`\`

## Performance Characteristics

- WASM (CPU): 5-50 tokens/sec depending on model size and CPU
- WebGPU (GPU): 50-200 tokens/sec for quantized models
- Model loading: first load downloads and caches; subsequent loads are instant
- Memory: q4 models use 500MB-2GB depending on parameter count

## Limitations

- Pure WASM is CPU-bound; large models (7B+) are impractical without WebGPU
- WebGPU is Chrome/Edge stable; Firefox behind flag; Safari macOS Sequoia+
- Models must be pre-converted to ONNX format (HuggingFace hosts many)
- 2GB ArrayBuffer limit for single WASM file (use split models for larger)

## When to Use vs Alternatives

Use Transformers.js when: you need browser-native inference, small-to-medium models (up to 1B params on CPU, 7B with WebGPU), classification/embedding tasks, or Node.js server inference. Use WebLLM instead for full chat LLMs (7B-70B) in the browser. Use wllama for pure WASM llama.cpp inference without WebGPU dependency.`
},

{
  path: 'knowledge/wasm-local-llm/webllm-overview',
  title: 'WebLLM / MLC LLM: Full LLMs in the Browser via WebGPU and WASM',
  category: 'wasm-local-llm',
  knowledge_type: 'concept',
  expertise_level: 'intermediate',
  quality: 91,
  concepts: ['webllm', 'mlc-llm', 'webgpu', 'wasm', 'browser-llm', 'llama', 'mistral', 'phi', 'qwen', 'local-inference'],
  content: `## What It Is and Why It Matters for Privacy

WebLLM is a high-performance in-browser LLM inference engine from the MLC-AI team. It runs full-scale language models (Llama, Mistral, Phi, Qwen, DeepSeek) directly in the browser using WebGPU for GPU acceleration, with a WASM CPU fallback. Everything runs on the client device - no server, no API keys, no data egress. This makes it the strongest option for truly private browser-based AI chat applications.

WebLLM retains up to 80% of native GPU performance through its MLC (Machine Learning Compilation) approach, which compiles models to optimized GPU shaders. It exposes an OpenAI-compatible API, so existing code works with minimal changes.

## Supported Models (2025)

- Llama 3 / 3.1 / 3.2 / 3.3 (1B, 3B, 8B, 70B)
- Mistral 7B, Mistral Small
- Phi 3 / 3.5 / 4 (mini, small)
- Qwen 2.5 (0.5B, 1.5B, 3B, 7B, 14B, 32B, 72B)
- DeepSeek R1 Distill variants
- Gemma 2 (2B, 9B, 27B)
- SmolLM (135M, 360M, 1.7B)

## Installation

npm install @mlc-ai/web-llm

## Code Example: OpenAI-Compatible Chat

\`\`\`javascript
import { CreateMLCEngine } from '@mlc-ai/web-llm';

const engine = await CreateMLCEngine('Phi-3.5-mini-instruct-q4f16_1-MLC');

// Identical to OpenAI SDK usage
const reply = await engine.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a private enterprise assistant.' },
    { role: 'user', content: 'What is our refund policy?' }
  ],
  temperature: 0.7,
  max_tokens: 512,
  stream: true
});

for await (const chunk of reply) {
  const delta = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(delta);
}
\`\`\`

## Memory Requirements by Model

| Model | Quantization | VRAM Needed | Browser Practical? |
|-------|-------------|-------------|-------------------|
| SmolLM 1.7B | q4f16 | ~1 GB | Yes (all devices) |
| Phi 3.5 mini | q4f16 | ~2.5 GB | Yes (most devices) |
| Llama 3.2 3B | q4f16 | ~2 GB | Yes |
| Llama 3.1 8B | q4f16 | ~5 GB | Yes (gaming GPU) |
| Qwen 2.5 7B | q4f16 | ~4.5 GB | Yes (gaming GPU) |
| Llama 3.3 70B | q4f16 | ~40 GB | No (server GPU only) |

## Browser Support for WebGPU

| Browser | WebGPU Status |
|---------|--------------|
| Chrome 113+ | Stable |
| Edge 113+ | Stable |
| Firefox | Nightly/Beta flag |
| Safari macOS Sequoia | Stable |
| Mobile browsers | Limited |

## Self-Hosted Model Registry for Air-Gap

\`\`\`javascript
import { CreateMLCEngine } from '@mlc-ai/web-llm';

// Point to your internal CDN instead of HuggingFace
const engine = await CreateMLCEngine(
  'Phi-3.5-mini-instruct-q4f16_1-MLC',
  {
    appConfig: {
      model_list: [{
        model_id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
        model: 'https://ai-models.internal.corp.net/mlc/phi-3.5-mini/',
        model_lib: 'https://ai-models.internal.corp.net/mlc/libs/phi-3.5.wasm',
      }]
    }
  }
);
\`\`\`

## WebGPU vs WASM Fallback

\`\`\`javascript
import { CreateMLCEngine } from '@mlc-ai/web-llm';

// Feature detect and pick best runtime
const MODEL = navigator.gpu
  ? 'Llama-3.2-3B-Instruct-q4f16_1-MLC'  // GPU: larger, faster model
  : 'SmolLM2-1.7B-Instruct-q4f32_1-MLC'; // CPU fallback: smaller model

const engine = await CreateMLCEngine(MODEL, {
  initProgressCallback: (report) => {
    console.log(report.text); // Download progress
  }
});
\`\`\`

## Performance Characteristics

- WebGPU: up to 80% of native GPU performance
- Typical throughput: 30-80 tokens/sec for 7B models on RTX 3080
- Model pre-download: 2-6 GB cached in browser IndexedDB
- Subsequent loads: instant from cache

## Limitations

- Requires HTTPS or localhost (WebGPU security constraint)
- Mobile GPU VRAM severely limits usable model sizes
- Model files must be downloaded on first use (CDN or self-hosted)
- Firefox WebGPU still experimental as of early 2026

## When to Use vs Alternatives

Use WebLLM when you need full conversational LLM capability in the browser with GPU acceleration. Use wllama when you need pure CPU WASM without WebGPU. Use Transformers.js for classification, embedding, and smaller specialized models. Use Ollama/LocalAI for server-side private deployment.`
},

{
  path: 'knowledge/wasm-local-llm/wllama-overview',
  title: 'wllama: llama.cpp Compiled to Pure WASM for Browser and Node.js',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality: 90,
  concepts: ['wllama', 'llama.cpp', 'wasm', 'browser-llm', 'gguf', 'cpu-inference', 'no-webgpu', 'node.js'],
  content: `## What It Is and Why It Matters for Privacy

wllama is a WebAssembly binding for llama.cpp that enables on-browser LLM inference using pure CPU power - no WebGPU, no server, no backend required. It compiles the entire llama.cpp inference stack to WASM and exposes a JavaScript API for loading GGUF models and running inference inside a Web Worker (keeping the UI responsive).

Firefox officially uses wllama as an inference engine in their Link Preview feature (Beta/Nightly 2025). This is a strong signal of production-readiness.

Key privacy benefit: models run 100% on the client. No tokens are transmitted over the network. No API keys. Air-gap compatible.

## Installation

npm install @wllama/wllama

## Core API - Browser Usage

\`\`\`javascript
import { Wllama } from '@wllama/wllama';

const CONFIG_PATHS = {
  'single-thread/wllama.wasm': '/wasm/wllama-st.wasm',
  'multi-thread/wllama.wasm': '/wasm/wllama-mt.wasm',
};

const wllama = new Wllama(CONFIG_PATHS);

// Load a GGUF model
await wllama.loadModelFromUrl(
  'https://your-server.internal/models/llama-3.2-1B-instruct.Q4_K_M.gguf',
  { n_ctx: 4096, n_threads: 4, n_gpu_layers: 0 }
);

// Chat completion
const response = await wllama.createChatCompletion([
  { role: 'system', content: 'You are a private enterprise assistant.' },
  { role: 'user', content: 'Summarize this contract clause...' }
], { nPredict: 512, temperature: 0.3 });

console.log(response.content);
\`\`\`

## Embeddings

\`\`\`javascript
await wllama.loadModelFromUrl('/models/nomic-embed-text-v1.5.Q4_K_M.gguf', {
  embeddings: true, n_ctx: 512
});

const embedding = await wllama.createEmbedding('document text here');
// Returns Float32Array - use for local vector search
\`\`\`

## Handling Large Models (>2GB Split Files)

\`\`\`javascript
// Load split GGUF files (each file must be <2GB due to ArrayBuffer limit)
await wllama.loadModelFromUrl([
  '/models/llama-7B.Q4_K_M-00001-of-00002.gguf',
  '/models/llama-7B.Q4_K_M-00002-of-00002.gguf',
]);
\`\`\`

## Multi-Thread Setup (Required Headers)

\`\`\`
# nginx.conf - required for SharedArrayBuffer (enables multi-thread WASM)
add_header Cross-Origin-Opener-Policy same-origin;
add_header Cross-Origin-Embedder-Policy require-corp;
\`\`\`

## Performance vs WebLLM

| Aspect | wllama | WebLLM |
|--------|--------|--------|
| GPU required | No | Yes (WebGPU) |
| CPU speed | 5-15 tok/s | 5-15 tok/s |
| GPU speed | N/A | 30-80 tok/s |
| Browser compat | Universal | Chrome/Edge |
| Model format | GGUF | MLC-compiled |

## Performance Characteristics

- Speed: 3-15 tokens/sec for 7B Q4_K_M on modern CPU
- 1B-3B models: 20-50 tokens/sec on modern CPU
- Multi-thread build: significant speedup on multi-core CPUs
- v2 update: 2x speed improvement for Qx_K and Qx_0 quantization

## Limitations

- CPU-only means slower than GPU-accelerated WebLLM
- 2GB per file limit (mitigated by split files)
- Large model downloads on first use
- Memory constrained by available RAM

## When to Use

Use wllama when: universal browser compatibility is required (including Firefox/Safari without WebGPU), you want GGUF model flexibility, Node.js server-side inference without a native binary, or as fallback when WebGPU is unavailable.`
},

{
  path: 'knowledge/wasm-local-llm/llama-cpp-overview',
  title: 'llama.cpp: Foundation of Local LLM Deployment - GGUF, Quantization, Server Mode',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality: 93,
  concepts: ['llama.cpp', 'gguf', 'quantization', 'local-llm', 'openai-compatible', 'server-mode', 'cpu-inference', 'q4', 'q5', 'q8'],
  content: `## What It Is and Why It Matters for Privacy

llama.cpp is a C/C++ inference engine for Large Language Models. It is the foundational technology beneath most local LLM tools: Ollama, LM Studio, Jan.ai, wllama, and LocalAI all use llama.cpp internally. It introduced the GGUF model format and pioneered CPU-only LLM inference, enabling air-gapped enterprise deployments on commodity hardware with zero data egress.

## Building llama.cpp

\`\`\`bash
# Homebrew (macOS/Linux - easiest)
brew install llama.cpp

# From source
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp

# CPU-only build
cmake -B build && cmake --build build --config Release -j $(nproc)

# CUDA (NVIDIA GPU) build
cmake -B build -DGGML_CUDA=ON && cmake --build build --config Release -j $(nproc)

# Metal (Apple Silicon) - enabled automatically on macOS
cmake -B build -DGGML_METAL=ON && cmake --build build --config Release -j $(nproc)
\`\`\`

## GGUF Quantization Reference Table

| Format | Bits | Quality Loss | File Size (7B) | RAM Needed | Recommended For |
|--------|------|-------------|----------------|------------|----------------|
| Q2_K | 2 | High | ~2.7 GB | ~3.3 GB | Very constrained RAM |
| Q3_K_M | 3 | Moderate | ~3.3 GB | ~3.9 GB | Minimum viable |
| Q4_K_M | 4 | Low | ~4.1 GB | ~4.7 GB | RECOMMENDED default |
| Q5_K_M | 5 | Very Low | ~4.8 GB | ~5.4 GB | High quality |
| Q6_K | 6 | Near-lossless | ~5.5 GB | ~6.2 GB | Near-native |
| Q8_0 | 8 | Negligible | ~7.2 GB | ~7.8 GB | Near-lossless |
| F16 | 16 | None | ~14 GB | ~14.5 GB | Full precision |

## Running llama-server (OpenAI-Compatible API)

\`\`\`bash
# Start OpenAI-compatible server
./build/bin/llama-server \\
  --model /models/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf \\
  --host 0.0.0.0 \\
  --port 8080 \\
  --ctx-size 8192 \\
  --n-gpu-layers 35 \\
  --threads 8 \\
  --parallel 4 \\
  --cont-batching \\
  --flash-attn

# OpenAI-compatible endpoint at: http://localhost:8080/v1/
\`\`\`

## API Usage (OpenAI-Compatible)

\`\`\`python
from openai import OpenAI

# Point to local server - zero data egress
client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="llama",
    messages=[{"role": "user", "content": "Analyze this contract..."}]
)
print(response.choices[0].message.content)

# Embeddings
embed_response = client.embeddings.create(
    model="llama",
    input=["Your text here"]
)
vector = embed_response.data[0].embedding
\`\`\`

## Docker Deployment

\`\`\`yaml
services:
  llama-server:
    image: ghcr.io/ggml-org/llama.cpp:server
    ports:
      - "8080:8080"
    volumes:
      - /host/models:/models:ro
    command: >
      --model /models/Llama-3.1-8B.Q4_K_M.gguf
      --host 0.0.0.0
      --port 8080
      --ctx-size 8192
      --n-gpu-layers 0
    restart: unless-stopped
\`\`\`

## Converting Models to GGUF

\`\`\`bash
pip install huggingface_hub

# Convert HuggingFace model to GGUF
python llama.cpp/convert_hf_to_gguf.py \\
  --model /path/to/hf-model \\
  --outfile model.f16.gguf \\
  --outtype f16

# Quantize to Q4_K_M
./build/bin/llama-quantize model.f16.gguf model.Q4_K_M.gguf Q4_K_M
\`\`\`

## Performance Characteristics

- CPU-only (Q4_K_M 7B): 5-15 tokens/sec on 8-core modern CPU
- Apple M3 Max (Metal): 50-80 tokens/sec for 7B Q4_K_M
- NVIDIA RTX 4090 (CUDA): 80-120 tokens/sec for 7B Q4_K_M
- First token latency: 1-5 seconds depending on context size

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| POST /v1/chat/completions | OpenAI chat API |
| POST /v1/completions | Text completion |
| POST /v1/embeddings | Embedding generation |
| GET /v1/models | List models |
| GET /health | Health check |
| GET /metrics | Prometheus metrics |

## Limitations

- WASM build is experimental and significantly slower than native
- Context window limited by RAM
- No multi-GPU support out of the box

## When to Use

Use llama.cpp directly when you need maximum control, custom integrations, or are building tooling on top. For easier management, use Ollama (wraps llama.cpp). For browser deployment, use wllama (WASM build of llama.cpp).`
},

{
  path: 'knowledge/wasm-local-llm/onnx-runtime-web',
  title: 'ONNX Runtime Web: Cross-Platform Model Inference with WASM SIMD',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality: 88,
  concepts: ['onnx-runtime', 'onnx', 'wasm', 'simd', 'browser-inference', 'model-conversion', 'webgpu', 'cross-platform'],
  content: `## What It Is and Why It Matters for Privacy

ONNX Runtime Web (ort-web) is Microsoft's cross-platform inference runtime for ONNX models, running in browser (WASM + WebGPU), Node.js, and React Native. ONNX (Open Neural Network Exchange) is an open model format supported by PyTorch, TensorFlow, and JAX, making it the universal interchange format for ML models.

For privacy, ONNX Runtime Web enables any ONNX-format model to run entirely client-side. It is the engine that powers Transformers.js internally.

## Installation

npm install onnxruntime-web

## WASM SIMD + WebGPU Configuration

\`\`\`javascript
import * as ort from 'onnxruntime-web';

// Configure WASM backend with SIMD and threads
ort.env.wasm.simd = true;
ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
ort.env.wasm.proxy = true; // Run in worker thread

// WebGPU + WASM fallback pattern
async function createSession(modelPath) {
  const providers = [];
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) providers.push('webgpu');
    } catch (_) {}
  }
  providers.push('wasm');

  return ort.InferenceSession.create(modelPath, {
    executionProviders: providers,
    graphOptimizationLevel: 'all',
  });
}

const session = await createSession('/models/bert-base.onnx');
\`\`\`

## Running Inference

\`\`\`javascript
const inputIds = new BigInt64Array([101n, 7592n, 1010n, 2088n, 102n]);
const attentionMask = new BigInt64Array([1n, 1n, 1n, 1n, 1n]);

const feeds = {
  input_ids: new ort.Tensor('int64', inputIds, [1, 5]),
  attention_mask: new ort.Tensor('int64', attentionMask, [1, 5]),
};

const results = await session.run(feeds);
const embeddings = results.last_hidden_state.data;
console.log('Embedding dim:', embeddings.length);
\`\`\`

## Model Conversion Workflow

\`\`\`bash
# Install conversion tools
pip install optimum[exporters] transformers onnxruntime

# Convert HuggingFace model to ONNX with quantization
optimum-cli export onnx \\
  --model sentence-transformers/all-MiniLM-L6-v2 \\
  --task feature-extraction \\
  --dtype int8 \\
  ./output/model/

# Convert ONNX to ORT format (smaller, faster init)
python -m onnxruntime.tools.convert_onnx_models_to_ort \\
  ./output/model/ \\
  --output_dir ./output/model-ort/
\`\`\`

## Performance (Mozilla Firefox 2025)

ONNX Runtime native SIMD integration showed dramatic improvements:
- Smart Tab Grouping: 3.5s to 350ms (10x speedup)
- Image-to-text models: 2-10x faster than pure WASM
- SIMD vectorization eliminates WASM warm-up overhead

## Supported Execution Providers

\`\`\`javascript
// Optimal priority for enterprise browser deployment
const providers = [
  'webgpu',    // GPU acceleration (Chrome/Edge stable)
  'wasm',      // CPU fallback (universal)
];
// Note: 'webgl' is legacy and slower than wasm for most models
\`\`\`

## Supported Model Types

- BERT, RoBERTa, DistilBERT (classification, NER, QA)
- GPT-2, GPT-Neo (text generation)
- T5, BART (seq2seq, summarization)
- Whisper (speech recognition)
- CLIP (image-text)
- Sentence Transformers (embeddings)
- MobileNet, ViT, ResNet (vision)

## When to Use

Use ONNX Runtime Web directly when: you have custom model architectures, you need fine-grained control over inference, you are building production pipelines with custom preprocessing, or you need the widest model format compatibility. Use Transformers.js for higher-level API with pre-built pipelines.`
},

{
  path: 'knowledge/wasm-local-llm/transformers-js-v3-features',
  title: 'Transformers.js v3: WebGPU Support, Offline Config, and Streaming',
  category: 'wasm-local-llm',
  knowledge_type: 'procedure',
  expertise_level: 'intermediate',
  quality: 90,
  concepts: ['transformers.js', 'v3', 'webgpu', 'offline', 'local-models', 'env-config', 'streaming', 'ner', 'zero-shot'],
  content: `## What Changed in v3

Transformers.js v3 (package: @huggingface/transformers) adds: WebGPU backend support, new dtype/quantization options (fp32, fp16, q8, q4, q4f16), 1500+ supported models, better streaming, vision-language models (SmolVLM, PaliGemma 2).

## Package Migration

npm install @huggingface/transformers  # v3 (current)
# Legacy: npm install @xenova/transformers

## Complete Offline Configuration

\`\`\`javascript
import { env, pipeline } from '@huggingface/transformers';

// Disable ALL remote calls for air-gap deployment
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = '/opt/ai-models/onnx/';

const classifier = await pipeline('text-classification', 'sentiment-model');
// Resolves to /opt/ai-models/onnx/sentiment-model/
\`\`\`

## Device Selection Strategy

\`\`\`javascript
async function getBestDevice() {
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return 'webgpu';
    } catch (_) {}
  }
  return 'wasm';
}

const device = await getBestDevice();
const generator = await pipeline(
  'text-generation',
  'onnx-community/Qwen2.5-0.5B-Instruct',
  {
    device,
    dtype: device === 'webgpu' ? 'q4f16' : 'q4',
  }
);
\`\`\`

## Streaming Text Generation

\`\`\`javascript
import { pipeline, TextStreamer } from '@huggingface/transformers';

const generator = await pipeline(
  'text-generation',
  'onnx-community/Qwen2.5-1.5B-Instruct',
  { dtype: 'q4', device: 'wasm' }
);

const streamer = new TextStreamer(generator.tokenizer, {
  skip_prompt: true,
  callback_function: (token) => process.stdout.write(token)
});

await generator(
  [{ role: 'user', content: 'Explain data privacy in simple terms.' }],
  { max_new_tokens: 512, streamer }
);
\`\`\`

## Zero-Shot Classification (No Training Required)

\`\`\`javascript
const classifier = await pipeline(
  'zero-shot-classification',
  'Xenova/mobilebert-uncased-mnli',
  { device: 'wasm' }
);

const result = await classifier(
  'This document contains patient medical records.',
  ['HIPAA sensitive', 'public information', 'financial data', 'PII data']
);

console.log(result.labels[0]); // Most likely category
console.log(result.scores[0]); // Confidence score
\`\`\`

## Named Entity Recognition (Local PII Detection)

\`\`\`javascript
// Detect PII in documents without sending data to any API
const ner = await pipeline(
  'token-classification',
  'Xenova/bert-base-NER',
  { device: 'wasm' }
);

const result = await ner('John Smith called from Acme Corp at +1-555-0123');
// Returns: [{entity: 'B-PER', word: 'John'}, {entity: 'I-PER', word: 'Smith'}, ...]
\`\`\`

## Production Singleton Pattern

\`\`\`javascript
class LocalAIService {
  constructor() { this.models = new Map(); }

  async getModel(task, modelId, opts = {}) {
    const key = task + ':' + modelId;
    if (!this.models.has(key)) {
      const model = await pipeline(task, modelId, {
        device: 'wasm', dtype: 'q8', ...opts
      });
      this.models.set(key, model);
    }
    return this.models.get(key);
  }
}

const ai = new LocalAIService();
const embedder = await ai.getModel('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
\`\`\`

## Supported Task Catalog

| Task | Best Model | Privacy Use |
|------|-----------|------------|
| Text generation | onnx-community/Qwen2.5-0.5B-Instruct | Local chat |
| Embeddings | Xenova/all-MiniLM-L6-v2 | Semantic search |
| Sentiment | Xenova/distilbert-base-uncased-finetuned-sst-2 | Doc classification |
| NER/PII | Xenova/bert-base-NER | PII detection |
| Summarization | Xenova/distilbart-cnn-6-6 | Doc summaries |
| Zero-shot | Xenova/mobilebert-uncased-mnli | Custom categories |
| ASR | Xenova/whisper-base | Local transcription |
| Translation | Xenova/opus-mt-en-fr | No-egress translation |`
},

{
  path: 'knowledge/wasm-local-llm/gguf-quantization-guide',
  title: 'GGUF Quantization Deep Dive: Q4_K_M vs Q5_K_M vs Q8_0 for Enterprise',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality: 89,
  concepts: ['gguf', 'quantization', 'q4-k-m', 'q5-k-m', 'q8-0', 'model-compression', 'perplexity', 'quality-tradeoff', 'enterprise'],
  content: `## Understanding GGUF Quantization

Quantization reduces model file size and memory requirements by representing model weights with fewer bits. The quality loss is measured by "perplexity" - lower is better.

## Naming Convention

Format: Q[bits]_[type]_[size]
- Q = Quantization
- bits = number of bits per weight
- K = K-quant family (better quality than legacy at same bits)
- M/S/L = Medium/Small/Large variant

Examples: Q4_K_M, Q5_K_S, Q6_K, Q8_0

K-quants (Q2_K through Q6_K) use non-uniform quantization that handles outlier weights better, producing significantly better quality than legacy formats (Q4_0, Q4_1) at the same bit depth.

## Quality and Size Comparison (Llama 3.1 8B)

| Format | File Size | RAM Needed | Perplexity Delta | Quality |
|--------|-----------|------------|-----------------|---------|
| F16 | 14.5 GB | 16 GB | 0 (baseline) | Perfect |
| Q8_0 | 7.7 GB | 8.5 GB | +0.01 | Near-lossless |
| Q6_K | 6.0 GB | 6.8 GB | +0.02 | Excellent |
| Q5_K_M | 5.3 GB | 6.0 GB | +0.04 | Very good |
| Q4_K_M | 4.6 GB | 5.3 GB | +0.07 | Good (recommended) |
| Q3_K_M | 3.5 GB | 4.2 GB | +0.15 | Acceptable |
| Q2_K | 2.7 GB | 3.4 GB | +0.30 | Marginal |

## Recommended Enterprise Tiers

Tier 1 - Production Quality (Q5_K_M): Use when accuracy is critical (legal, medical, financial analysis). 15% larger than Q4_K_M, near-imperceptible quality difference. Needs 6+ GB VRAM for 7B model.

Tier 2 - Standard (Q4_K_M) - RECOMMENDED DEFAULT: Use for general enterprise assistant, summarization, classification. Excellent balance, barely perceptible quality reduction. Fits in 8GB VRAM for 7B model.

Tier 3 - Resource Constrained (Q3_K_M): Use for CPU-only deployment with limited RAM. Noticeable but acceptable for many tasks. Fits 3.5GB VRAM for 7B model.

## Selecting Quantization in Different Tools

\`\`\`bash
# llama.cpp - specify in filename
llama-server --model model.Q4_K_M.gguf

# Ollama - model pull includes quantization tag
ollama pull llama3.1:8b-instruct-q4_K_M

# Transformers.js - dtype parameter
pipeline('text-generation', 'model', { dtype: 'q4' })  # 4-bit
pipeline('text-generation', 'model', { dtype: 'q8' })  # 8-bit
\`\`\`

## I-Quant (Importance-Matrix Quantization)

Newer format (2024) using importance scores from a calibration dataset:
- IQ1_S, IQ2_M, IQ3_M, IQ4_NL
- Better quality than K-quants at same bit depth
- Slower to generate (requires calibration data)
- Available from bartowski on HuggingFace

## Practical Selection Workflow

1. Start with Q4_K_M for initial testing
2. If quality insufficient for use case, step up to Q5_K_M
3. If hardware is very constrained, try Q3_K_M
4. Only use Q8_0 if you have ample GPU VRAM and need near-perfect quality
5. Never use Q2_K for production - significant quality degradation

## Where to Download GGUF Models

- HuggingFace Hub: search "[model-name] GGUF"
- bartowski: high-quality GGUF conversions of latest models
- TheBloke: large catalog of older models
- Ollama Library: managed GGUF downloads via CLI`
},

{
  path: 'knowledge/wasm-local-llm/webllm-code-examples',
  title: 'WebLLM Code Examples: Chat, Streaming, JSON Mode, and Self-Hosted Models',
  category: 'wasm-local-llm',
  knowledge_type: 'example',
  expertise_level: 'intermediate',
  quality: 88,
  concepts: ['webllm', 'openai-compatible', 'streaming', 'browser-chat', 'json-mode', 'model-cache', 'javascript'],
  content: `## Available Model IDs (2025)

\`\`\`javascript
import { prebuiltAppConfig } from '@mlc-ai/web-llm';

// List all pre-built models with VRAM requirements
const models = prebuiltAppConfig.model_list;
models.forEach(m => console.log(m.model_id, m.vram_required_MB, 'MB'));

// Key model IDs (q4f16_1 = 4-bit weights, fp16 activations)
const MODELS = [
  'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
  'Phi-3.5-mini-instruct-q4f16_1-MLC',
  'Llama-3.2-3B-Instruct-q4f16_1-MLC',
  'Qwen2.5-7B-Instruct-q4f16_1-MLC',
  'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
  'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC',
];
\`\`\`

## Model Caching and Pre-fetching

\`\`\`javascript
import { hasModelInCache, prebuiltAppConfig, CreateMLCEngine } from '@mlc-ai/web-llm';

const MODEL_ID = 'Phi-3.5-mini-instruct-q4f16_1-MLC';

// Check if already cached (browser IndexedDB)
const cached = await hasModelInCache(MODEL_ID, prebuiltAppConfig);
if (!cached) console.log('Downloading model (~2.3GB)...');

const engine = await CreateMLCEngine(MODEL_ID, {
  initProgressCallback: (r) => {
    if (r.progress < 1) console.log('Download:', Math.round(r.progress * 100) + '%');
  }
});
// Model is now cached for future sessions
\`\`\`

## Streaming Chat with Progress

\`\`\`javascript
import { CreateMLCEngine } from '@mlc-ai/web-llm';

const engine = await CreateMLCEngine('Llama-3.2-3B-Instruct-q4f16_1-MLC');
const outputEl = document.getElementById('output');

const stream = await engine.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a private enterprise assistant.' },
    { role: 'user', content: 'Summarize our Q3 financial report...' }
  ],
  stream: true,
  max_tokens: 1024,
  temperature: 0.3,
});

let fullResponse = '';
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content || '';
  fullResponse += delta;
  outputEl.textContent = fullResponse;
}
\`\`\`

## JSON Mode (Structured Output)

\`\`\`javascript
const response = await engine.chat.completions.create({
  messages: [{
    role: 'user',
    content: 'Extract name and email from: John Smith john@corp.com'
  }],
  response_format: {
    type: 'json_object',
    schema: JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      }
    })
  }
});

const data = JSON.parse(response.choices[0].message.content);
// { name: 'John Smith', email: 'john@corp.com' }
\`\`\`

## Complete HTML Application

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';

    let engine;
    const history = [];

    async function init() {
      const statusEl = document.getElementById('status');
      engine = await CreateMLCEngine(
        'Phi-3.5-mini-instruct-q4f16_1-MLC',
        { initProgressCallback: (r) => { statusEl.textContent = r.text; } }
      );
      statusEl.textContent = 'Ready - all AI processing is local to your device';
      document.getElementById('ui').style.display = 'block';
    }

    async function send() {
      const input = document.getElementById('input');
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      history.push({ role: 'user', content: msg });

      const out = document.getElementById('output');
      let response = '';
      const stream = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a private enterprise assistant.' },
          ...history
        ],
        stream: true
      });

      for await (const chunk of stream) {
        response += chunk.choices[0]?.delta?.content || '';
        out.textContent = response;
      }
      history.push({ role: 'assistant', content: response });
    }

    init();
    window.send = send;
  </script>
</head>
<body>
  <div id="status">Loading...</div>
  <div id="ui" style="display:none">
    <input id="input" type="text" onkeydown="if(event.key==='Enter') send()">
    <button onclick="send()">Send</button>
    <pre id="output"></pre>
  </div>
</body>
</html>
\`\`\``
},

{
  path: 'knowledge/wasm-local-llm/transformers-js-model-catalog',
  title: 'Transformers.js: Model Catalog and Task Reference for Enterprise Use Cases',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'intermediate',
  quality: 86,
  concepts: ['transformers.js', 'model-catalog', 'onnx-models', 'huggingface', 'embeddings', 'ner', 'classification', 'whisper', 'enterprise'],
  content: `## Finding ONNX-Ready Models

HuggingFace hosts thousands of pre-converted ONNX models ready for Transformers.js:
- Xenova (legacy v2): thousands of ONNX conversions
- onnx-community (v3): new conversions with WebGPU optimization
- HuggingFaceTB: HuggingFace team models (SmolLM, SmolVLM)
- microsoft: Phi models in ONNX format

Search at: huggingface.co/models?library=transformers.js

## Text Generation Models

| Model | Size | Best For |
|-------|------|----------|
| onnx-community/Qwen2.5-0.5B-Instruct | ~400MB q4 | Ultra-fast, simple tasks |
| onnx-community/Llama-3.2-1B-Instruct | ~700MB q4 | Good quality, small |
| onnx-community/Phi-3.5-mini-instruct | ~2.3GB q4 | High quality, reasoning |
| HuggingFaceTB/SmolLM2-1.7B-Instruct | ~900MB q4 | Efficient, capable |

## Embedding Models (for Local Semantic Search)

| Model | Dimensions | Best For |
|-------|-----------|----------|
| Xenova/all-MiniLM-L6-v2 | 384 | General semantic search |
| Xenova/all-mpnet-base-v2 | 768 | High quality sentence embeddings |
| Xenova/nomic-embed-text-v1 | 768 | Long documents |
| Xenova/multilingual-e5-small | 384 | Multi-language |

## Classification Models

| Model | Use Case |
|-------|----------|
| Xenova/distilbert-base-uncased-finetuned-sst-2 | Sentiment (pos/neg) |
| Xenova/toxic-bert | Content moderation |
| Xenova/mobilebert-uncased-mnli | Zero-shot classification |
| Xenova/bart-large-mnli | High accuracy zero-shot |

## NER Models (Local PII Detection)

| Model | Entities |
|-------|---------|
| Xenova/bert-base-NER | PER, ORG, LOC, MISC |
| Xenova/bert-base-NER-uncased | Same, case-insensitive |

## Speech Recognition (Local ASR)

| Model | Best For |
|-------|----------|
| Xenova/whisper-tiny | Fast, small (~150MB) |
| Xenova/whisper-base | Balance (~300MB) |
| Xenova/whisper-small | High accuracy (~600MB) |
| Xenova/whisper-large-v3 | Best accuracy (~3GB) |

## Loading Models by Task

\`\`\`javascript
import { pipeline } from '@huggingface/transformers';

// All these run locally - zero data egress
const tasks = {
  embedding:    pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'),
  sentiment:    pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2'),
  ner:          pipeline('token-classification', 'Xenova/bert-base-NER'),
  summarize:    pipeline('summarization', 'Xenova/distilbart-cnn-6-6'),
  transcribe:   pipeline('automatic-speech-recognition', 'Xenova/whisper-base'),
  zeroShot:     pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli'),
  generate:     pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct'),
};
\`\`\`

## Downloading Models for Air-Gap Deployment

\`\`\`bash
# Install HuggingFace Hub CLI
pip install huggingface_hub

# Download model files for offline use
huggingface-cli download Xenova/all-MiniLM-L6-v2 \\
  --local-dir /opt/ai-models/all-MiniLM-L6-v2

# Download specific ONNX files only
huggingface-cli download Xenova/all-MiniLM-L6-v2 \\
  --local-dir /opt/ai-models/all-MiniLM-L6-v2 \\
  --include "*.onnx" "*.json" "*.txt"
\`\`\``
},

{
  path: 'knowledge/wasm-local-llm/wllama-v2-architecture',
  title: 'wllama v2: Binary Protocol, Multi-Thread WASM, and Production Patterns',
  category: 'wasm-local-llm',
  knowledge_type: 'reference',
  expertise_level: 'expert',
  quality: 87,
  concepts: ['wllama', 'wasm-threads', 'web-worker', 'binary-protocol', 'production', 'sampling', 'embeddings', 'cleanup'],
  content: `## wllama v2 Architecture Improvements

wllama v2 introduced:
1. Binary protocol between JavaScript and WASM (replacing JSON - major speed improvement)
2. Removed json.hpp dependency (smaller WASM bundle)
3. 2x speed improvement for Qx_K and Qx_0 quantization families
4. Cleaner TypeScript API
5. Parallel model chunk loading for split files

## WASM Build Variants

| Build | File | Use case |
|-------|------|----------|
| Single-thread | wllama.wasm | Safari, no SharedArrayBuffer |
| Multi-thread | wllama-mt.wasm | Chrome/Firefox with COOP/COEP headers |

## Multi-Thread Setup

\`\`\`
# nginx.conf - required for multi-thread WASM
add_header Cross-Origin-Opener-Policy same-origin;
add_header Cross-Origin-Embedder-Policy require-corp;
\`\`\`

\`\`\`javascript
import { Wllama } from '@wllama/wllama';

const config = {
  'single-thread/wllama.wasm': '/wasm/wllama-st.wasm',
  'multi-thread/wllama.wasm': '/wasm/wllama-mt.wasm',
};

// wllama auto-detects and uses best available build
const wllama = new Wllama(config, {
  n_threads: navigator.hardwareConcurrency ?? 4,
});
\`\`\`

## Sampling Configuration

\`\`\`javascript
const result = await wllama.createCompletion(prompt, {
  nPredict: 512,
  temperature: 0.7,
  top_p: 0.95,
  top_k: 40,
  repeat_penalty: 1.1,
  repeat_last_n: 64,
  stop: ['</s>', '<|end|>', 'User:'],
  onNewToken: (token, piece, fullText) => {
    updateUI(piece);
  }
});
\`\`\`

## Embedding Pipeline

\`\`\`javascript
const embeddingWllama = new Wllama(CONFIG_PATHS);
await embeddingWllama.loadModelFromUrl(
  '/models/nomic-embed-text-v1.5.Q4_K_M.gguf',
  { embeddings: true, n_ctx: 512, pooling_type: 1 } // MEAN pooling
);

async function embedDocuments(texts) {
  const vectors = [];
  for (const text of texts) {
    const vec = await embeddingWllama.createEmbedding(text);
    vectors.push(Array.from(vec));
  }
  return vectors;
}
\`\`\`

## Resource Cleanup

\`\`\`javascript
// Always cleanup to free WASM memory
try {
  const result = await wllama.createCompletion(prompt, opts);
  return result;
} finally {
  await wllama.exit(); // Frees WASM heap, terminates worker
}
\`\`\`

## Firefox Production Validation

Firefox uses wllama for the Link Preview feature in Beta/Nightly (2025):
- Runs entirely on-device
- No user data transmitted
- Works offline
- Uses Q4 quantized small models (<1GB)

This validates wllama as production-ready for browser AI without any server dependency.

## Performance Optimization Tips

1. Use multi-thread build whenever COOP/COEP headers are possible
2. Pre-warm the model with a dummy prompt after loading
3. Reuse wllama instance across requests (do not recreate for each call)
4. Use smaller models (1B-3B) for interactive use cases
5. Use Q4_K_M for best speed/quality balance
6. Set n_ctx conservatively (larger context = slower, more RAM)

## Self-Hosted Internal Model Serving

\`\`\`javascript
const MODELS = {
  'phi3-mini': {
    url: 'https://internal-ai.corp.net/models/Phi-3-mini.Q4_K_M.gguf',
    size: 2_300_000_000,
  },
  'llama3-1b': {
    url: 'https://internal-ai.corp.net/models/Llama-3.2-1B.Q4_K_M.gguf',
    size: 800_000_000,
  },
};

async function loadModel(modelKey, onProgress) {
  const model = MODELS[modelKey];
  const wllama = new Wllama(CONFIG_PATHS);
  await wllama.loadModelFromUrl(model.url, {
    n_ctx: 4096,
    progressCallback: ({ loaded, total }) => onProgress(loaded / total)
  });
  return wllama;
}
\`\`\``
},

];

async function ingest() {
  console.log('=== WASM LOCAL LLM BATCH 1: ' + entries.length + ' ENTRIES ===\n');
  console.log('Loading ONNX embedding model...');
  await getEmbedder();
  console.log('Model loaded.\n');

  const results = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const num = i + 1;
    const cleanTitle = strip(entry.title);
    const cleanContent = strip(entry.content);
    const embedText = (cleanTitle + ' ' + cleanContent).substring(0, 1500);

    console.log('[' + num + '/' + entries.length + '] ' + cleanTitle.substring(0, 60) + '...');

    let kbId = null;
    let status = 'FAIL';

    try {
      const vec = await embed(embedText);

      // Upsert into kb_complete
      const existing = await pool.query(
        'SELECT id FROM ask_ruvnet.kb_complete WHERE file_path = $1', [entry.path]
      );

      if (existing.rows.length > 0) {
        kbId = existing.rows[0].id;
        await pool.query(
          `UPDATE ask_ruvnet.kb_complete
           SET title=$1, content=$2, category=$3, quality_score=$4,
               chunk_count=1, original_chars=$5, embedding=$6::ruvector
           WHERE id=$7`,
          [cleanTitle, cleanContent, entry.category, entry.quality, cleanContent.length, vec, kbId]
        );
      } else {
        const { rows } = await pool.query(
          `INSERT INTO ask_ruvnet.kb_complete
           (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
           VALUES ($1,$2,$3,$4,$5,1,$6,$7::ruvector) RETURNING id`,
          [entry.path, cleanTitle, cleanContent, entry.category, entry.quality, cleanContent.length, vec]
        );
        kbId = rows[0].id;
      }

      // Upsert into architecture_docs (copy embedding from kb_complete)
      const docId = 'kb-complete-' + kbId;
      const filePath = 'kb-complete/' + entry.path;
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
      status = 'FAIL: ' + err.message.substring(0, 80);
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
