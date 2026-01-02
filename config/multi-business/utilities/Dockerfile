# Utilities API - Shared RuvNet Tools Knowledge Base
# Updated: 2025-12-29 17:55:00 EST | Version 1.0.0

FROM node:20-slim

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY api/ ./api/

# Create data directories
RUN mkdir -p /app/data /app/ruvnet-tools

# Set environment
ENV NODE_ENV=production
ENV PORT=5100
ENV DATA_PATH=/app/data
ENV RUVNET_TOOLS_PATH=/app/ruvnet-tools

# Expose port
EXPOSE 5100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:5100/health || exit 1

# Start application
CMD ["node", "api/index.js"]
