# Railway Dockerfile for Ask-Ruvnet
# Uses npm install instead of npm ci for alpha package compatibility

FROM node:22-bookworm-slim

# Install system dependencies for puppeteer, sharp, and native module compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
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

# Expose port
EXPOSE 3000

# Start the application
CMD ["bash", "scripts/deployment/start-railway.sh"]
