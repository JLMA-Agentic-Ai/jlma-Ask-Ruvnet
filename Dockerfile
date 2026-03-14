# Railway Dockerfile for Ask-Ruvnet
# Single-stage build — RVF-First architecture (353 gold entries, ~535KB)

FROM node:22-bookworm-slim

# System deps for native module compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json ./

# Install dependencies (--legacy-peer-deps for alpha @ruvector packages)
RUN npm install --legacy-peer-deps --omit=dev

# Copy application code
COPY . .

# Build the UI
RUN cd src/ui && npm install && npm run build

# Clean up build-time artifacts to reduce image size
RUN rm -rf src/ui/node_modules src/ui/src .git .claude docs *.md \
    scripts/test-* scripts/ingest-* scripts/kb-curate scripts/ingestion \
    .ruvector archive generated_imgs strange-loop-research workspace logs \
    data_ingestion_ruv_coaching data_ingestion_github

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the application
CMD ["bash", "scripts/deployment/start-railway.sh"]
