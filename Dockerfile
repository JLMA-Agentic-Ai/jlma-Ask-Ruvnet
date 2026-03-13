# Railway Dockerfile for Ask-Ruvnet
# Single-stage build — proven reliable on Railway

FROM node:22-bookworm-slim

# System deps for native module compilation
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

# Extract RVF knowledge base at build time (non-fatal — LFS pointers won't decompress)
RUN if ls knowledge.rvf.gz.part-* 1>/dev/null 2>&1; then \
      echo "Reassembling knowledge.rvf from split parts..." && \
      cat knowledge.rvf.gz.part-* > knowledge.rvf.gz && \
      gunzip knowledge.rvf.gz && \
      rm -f knowledge.rvf.gz.part-* && \
      echo "RVF ready ($(du -sh knowledge.rvf | cut -f1))"; \
    elif [ -f knowledge.rvf.gz ] && file knowledge.rvf.gz | grep -q gzip; then \
      gunzip knowledge.rvf.gz && \
      echo "RVF ready ($(du -sh knowledge.rvf | cut -f1))"; \
    else \
      echo "⚠️ No valid knowledge.rvf found (LFS pointer or missing) — app starts with empty KB"; \
    fi

# Build the UI
RUN cd src/ui && npm install && npm run build

# Clean up build-time artifacts to reduce image size
RUN rm -rf src/ui/node_modules src/ui/src .git .claude docs *.md \
    scripts/test-* scripts/ingest-* scripts/kb-curate scripts/ingestion

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the application
CMD ["bash", "scripts/deployment/start-railway.sh"]
