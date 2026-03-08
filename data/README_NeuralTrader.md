---
created: 2025-12-03
last_modified: 2026-02-27
---

# Neural Trader MCP v2.5.0

**URL:** https://neural-trader.ruv.io/
**Creator:** rUv (ruv.io)

## Overview
Neural Trader MCP is the world's first **MCP-compatible AI trading platform**. It integrates advanced neural forecasting with the Model Context Protocol (MCP) to provide a comprehensive suite of tools for trading, sports betting, and collective intelligence. It is designed for seamless integration with AI models like Claude Code, Cursor, GitHub Copilot, and OpenAI Codex.

## Key Features

### 1. Neural Forecasting Engine
-   **State-of-the-Art Models:** Uses **NHITS** & **NBEATSx**, showing up to a 25% improvement in accuracy.
-   **Ultra-Low Latency:** Achieves sub-10ms inference times for high-frequency trading.
-   **GPU Acceleration:** Up to 6,250x speedup for CUDA-optimized neural networks.
-   **Multi-Symbol Forecasting:** Simultaneous predictions across hundreds of assets.

### 2. Advanced Trading Strategies
-   **Momentum Trading:** Trend-following enhanced with neural signals.
-   **Mean Reversion:** Statistical arbitrage with machine learning-driven entry and exit points.
-   **Swing Trading:** Multi-timeframe analysis integrated with sentiment.
-   **Mirror Trading:** Copying sophisticated institutional strategies.
-   **Supported Architectures:** LSTM, GRU, Transformer, N-BEATS, DeepAR, TCN.

### 3. MCP (Model Context Protocol) Integration
-   **Industry First:** Integrates **58+ specialized MCP tools** (up to 102 in some configs).
-   **Real-time Analytics:** Market analysis with neural enhancement via AI.
-   **Portfolio Management:** Automated rebalancing and risk management.
-   **News Sentiment:** Multi-source sentiment analysis.
-   **Backtesting Engine:** Monte Carlo simulation validation.
-   **Claude Code Native:** Designed for Claude Code workflows.
-   **Polymarket Integration:** Real-time prediction market data and trading.

### 4. Ruflo Orchestration
-   **Agent Coordination:** Facilitates AI agent coordination for complex trading workflows.
-   **SPARC Development:** 17 specialized development modes for strategy creation.
-   **Memory Management:** Persistent knowledge across trading sessions.

### 5. Sports Betting & Fantasy Collective
-   **Syndicates:** Tools for managing and analyzing sports betting syndicates.
-   **Fantasy Collective:** SQLite-powered system for aggregating crowd wisdom.

## Performance Metrics (v2.5.0)
-   **Uptime:** 99.97%
-   **Win Rate:** 95.0% (reported)
-   **Latency:** AI latency as low as 0.14ms.
-   **Throughput:** Handles over 19,000 signals per second.

## Quick Start (Example)
```bash
# Clone the repository (Example URL)
git clone https://github.com/ruvnet/ai-news-trader.git

# Navigate to directory
cd ai-news-trader

# Install dependencies
pip install -r requirements.txt

# Set up environment
./setup-env.sh

# Run demo
cd demo/
./run_demo.sh
```

## Technical Stack
-   **Core:** Python, PyTorch (Neural Nets)
-   **Protocol:** Model Context Protocol (MCP)
-   **Database:** SQLite (Local storage)
-   **Frontend:** React
-   **Integration:** FastMCP v1.9.4
