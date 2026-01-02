# RetireWell Business API - Production Dockerfile
# Updated: 2025-12-29 17:50:00 EST | Version 1.0.0

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
COPY storage/ ./storage/

# Copy utilities snapshot for production (embedded)
COPY utilities-snapshot/ ./utilities-snapshot/

# Create data directory
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV PORT=5101

# Expose port
EXPOSE 5101

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:5101/health || exit 1

# Start application
CMD ["node", "api/index.js"]
