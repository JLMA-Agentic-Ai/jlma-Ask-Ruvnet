# Use official Node.js image
FROM node:18-bullseye

# Install system dependencies for node-gyp and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm to use python3
RUN npm config set python python3

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start command (using our self-healing script)
CMD ["bash", "scripts/deployment/start-railway.sh"]
