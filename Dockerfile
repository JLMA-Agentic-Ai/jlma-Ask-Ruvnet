# Railway Dockerfile for Ask-Ruvnet
# Uses npm install instead of npm ci for alpha package compatibility

FROM node:22-bookworm-slim

# Install system dependencies for puppeteer and sharp
RUN apt-get update && apt-get install -y \
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

# Build the UI
RUN cd src/ui && npm install && npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bash", "scripts/deployment/start-railway.sh"]
