# Railway Dockerfile for Ask-Ruvnet
# Multi-stage build: build UI + extract KB in builder, slim production image

# ============================================================================
# STAGE 1: Builder — install deps, build UI, extract KB
# ============================================================================
FROM node:22-bookworm-slim AS builder

# Only build-essential needed for native modules during npm install
RUN apt-get update && apt-get install -y \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install dependencies using npm install (NOT npm ci)
# This allows alpha versions that don't match lock file
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Extract knowledge base at build time
# Supports both RVF format (preferred) and legacy RuvectorStore tarballs
RUN if ls knowledge.rvf.gz.part-* 1>/dev/null 2>&1; then \
      echo "📦 Reassembling RVF knowledge base..." && \
      cat knowledge.rvf.gz.part-* > knowledge.rvf.gz && \
      gunzip knowledge.rvf.gz && \
      rm -f knowledge.rvf.gz.part-* && \
      echo "✅ RVF extracted ($(du -sh knowledge.rvf | cut -f1))"; \
    elif ls ruvector-kb.tar.gz.part-* 1>/dev/null 2>&1; then \
      echo "📦 Reassembling legacy RuvectorStore KB..." && \
      cat ruvector-kb.tar.gz.part-* | tar xzf - && \
      rm -f ruvector-kb.tar.gz.part-* && \
      echo "✅ RuvectorStore extracted ($(du -sh .ruvector/knowledge-base/ | cut -f1))"; \
    fi

# Build the UI
RUN cd src/ui && npm install && npm run build

# Remove dev artifacts not needed at runtime
RUN rm -rf src/ui/node_modules src/ui/src docs scripts/test-* scripts/ingest-* \
    scripts/kb-curate scripts/ingestion .git .claude *.md

# ============================================================================
# STAGE 2: Production — minimal runtime image
# ============================================================================
FROM node:22-bookworm-slim AS production

# Only runtime deps: sharp needs libvips, ONNX needs libc
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/core ./src/core
COPY --from=builder /app/src/ui/dist ./src/ui/dist
COPY --from=builder /app/src/ui/public ./src/ui/public
COPY --from=builder /app/scripts/deployment ./scripts/deployment
COPY --from=builder /app/.ruvector ./.ruvector
COPY --from=builder /app/knowledge.rvf* ./
COPY --from=builder /app/content-sidecar.json.gz* ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the application
CMD ["bash", "scripts/deployment/start-railway.sh"]
