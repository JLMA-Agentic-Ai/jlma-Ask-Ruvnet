# Use official Node.js image
FROM node:18-bullseye

# Install system dependencies for node-gyp (minimal)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Create symlink for python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set PYTHON env var for node-gyp
ENV PYTHON=/usr/bin/python3

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start command (using our self-healing script)
CMD ["bash", "scripts/deployment/start-railway.sh"]
