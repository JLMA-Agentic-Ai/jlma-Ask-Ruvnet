/**
 * embedding-worker.js — Web Worker for browser-side text embeddings
 *
 * Loads all-MiniLM-L6-v2 (22MB quantized ONNX) via Transformers.js
 * and generates 384-dimensional Float32Array embeddings from text.
 *
 * Messages:
 *   { type: 'init' }                    → loads model
 *   { type: 'embed', text: '...', id }  → returns { type: 'embedding', embedding: Float32Array, id }
 *   { type: 'status' }                  → returns current state
 *
 * Updated: 2026-03-02 23:50:00 EST | Version 1.0.0
 */

let pipeline = null;
let state = 'idle'; // idle → loading → ready → error

self.onmessage = async (event) => {
  const { type, text, id } = event.data;

  switch (type) {
    case 'init':
      await initialize();
      break;
    case 'embed':
      await embed(text, id);
      break;
    case 'status':
      self.postMessage({ type: 'status', state });
      break;
    default:
      self.postMessage({ type: 'error', message: `Unknown message type: ${type}` });
  }
};

async function initialize() {
  if (state === 'loading' || state === 'ready') return;
  state = 'loading';
  self.postMessage({ type: 'progress', message: 'Loading embedding model (22MB)...' });

  try {
    // Import Transformers.js from CDN
    const { pipeline: createPipeline, env } = await import(
      'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
    );

    // Disable local model check — always use CDN/cache
    env.allowLocalModels = false;

    self.postMessage({ type: 'progress', message: 'Initializing all-MiniLM-L6-v2...' });

    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
      progress_callback: (progress) => {
        if (progress.status === 'downloading') {
          const pct = progress.progress ? Math.round(progress.progress) : 0;
          self.postMessage({ type: 'progress', message: `Downloading model... ${pct}%` });
        }
        if (progress.status === 'ready') {
          self.postMessage({ type: 'progress', message: 'Model loaded, warming up...' });
        }
      }
    });

    // Warm up with a test embedding
    await pipeline('warmup', { pooling: 'mean', normalize: true });

    state = 'ready';
    self.postMessage({ type: 'ready' });
  } catch (err) {
    state = 'error';
    self.postMessage({ type: 'error', message: err.message });
  }
}

async function embed(text, id) {
  if (state !== 'ready' || !pipeline) {
    self.postMessage({ type: 'error', message: 'Model not ready', id });
    return;
  }

  try {
    const output = await pipeline(text, { pooling: 'mean', normalize: true });
    // output.data is Float32Array of shape [1, 384]
    const embedding = new Float32Array(output.data);
    self.postMessage({ type: 'embedding', embedding, id }, [embedding.buffer]);
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message, id });
  }
}
