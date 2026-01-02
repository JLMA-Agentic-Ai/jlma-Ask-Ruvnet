Updated: 2025-12-29 03:02:00 EST | Version 1.0.0
Created: 2025-12-29 00:25:50 EST

# Neural Trader v2.7.1 - Complete Knowledge Base

**Author:** Ruv Cohen / Neural Trader Team
**NPM:** `neural-trader@2.7.1`
**Repository:** https://github.com/ruvnet/neural-trader
**License:** MIT OR Apache-2.0
**Last Updated:** 2025-12-29

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [NAPI Functions Reference (178+ Functions)](#3-napi-functions-reference)
4. [Neural Network Architecture](#4-neural-network-architecture)
5. [Trading Algorithms](#5-trading-algorithms)
6. [Rust/NAPI Bindings](#6-rustnapi-bindings)
7. [Configuration Options](#7-configuration-options)
8. [Usage Examples](#8-usage-examples)
9. [RuVector Ecosystem Integration](#9-ruvector-ecosystem-integration)
10. [MCP Server Integration](#10-mcp-server-integration)
11. [Performance Benchmarks](#11-performance-benchmarks)
12. [API Reference](#12-api-reference)

---

## 1. Executive Summary

Neural Trader is a **high-performance neural trading system** built with Rust and NAPI-RS, designed for AI-first algorithmic trading. It represents the first self-learning AI trading platform built natively for Claude Code, Cursor, GitHub Copilot, and OpenAI Codex.

### Key Highlights

| Metric | Value |
|--------|-------|
| **Version** | 2.7.1 |
| **Total NAPI Functions** | 178+ |
| **Modular Packages** | 26 |
| **MCP Tools** | 112+ |
| **Performance vs Python** | 8-19x faster |
| **Order Execution** | Sub-200ms |
| **Neural Models** | 6 (LSTM, Transformer, N-BEATS, GRU, DeepAR, TCN) |
| **Platforms Supported** | Linux, macOS, Windows (x64/arm64) |
| **Node.js Requirement** | >= 18.0.0 |

### Core Value Propositions

1. **Self-Learning**: Auto-improves with every trade execution
2. **Zero-Overhead NAPI**: Rust speed with JavaScript ease
3. **AI-Native**: Built for AI coding assistants (112+ MCP tools)
4. **Production-Ready**: Serving real capital with sub-200ms latency
5. **Multi-Platform**: Pre-built binaries for 5 platform targets

---

## 2. Architecture Overview

### Package Structure

```
neural-trader/
├── bin/
│   └── cli.js                    # CLI entry point
├── neural-trader-rust/
│   ├── index.js                  # NAPI loader
│   ├── index.d.ts                # TypeScript definitions (614 lines)
│   └── neural-trader.*.node      # Platform-specific binaries
├── packages/
│   ├── core/                     # Core trading types & AgentDB compat
│   └── predictor/                # Neural prediction modules
├── src/
│   ├── cli/lib/                  # CLI wrapper modules (28 files)
│   └── ruvector/                 # RuVector integration modules
├── scripts/                      # Build & deployment scripts
└── tests/                        # Test suites
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Core Engine** | Rust | High-performance trading logic |
| **Bindings** | NAPI-RS | Zero-overhead Node.js bridge |
| **API** | TypeScript/JavaScript | Developer interface |
| **Vector DB** | RuVector | 150x faster vector search |
| **AI Integration** | MCP Protocol | Claude Desktop integration |

### Platform Support Matrix

| Platform | Triple | Binary Name |
|----------|--------|-------------|
| Linux x64 (GNU) | x86_64-unknown-linux-gnu | `neural-trader.linux-x64-gnu.node` |
| Linux x64 (musl) | x86_64-unknown-linux-musl | `neural-trader.linux-x64-musl.node` |
| macOS Intel | x86_64-apple-darwin | `neural-trader.darwin-x64.node` |
| macOS ARM | aarch64-apple-darwin | `neural-trader.darwin-arm64.node` |
| Windows x64 | x86_64-pc-windows-msvc | `neural-trader.win32-x64-msvc.node` |

---

## 3. NAPI Functions Reference

The neural-trader package exports **178+ NAPI functions** across multiple categories. Below is the complete reference.

### 3.1 Core Exports (27 Primary Exports)

```typescript
// Classes
export class BrokerClient
export class NeuralModel
export class BatchPredictor
export class RiskManager
export class BacktestEngine
export class MarketDataProvider
export class SubscriptionHandle
export class StrategyRunner
export class PortfolioOptimizer
export class PortfolioManager
export class NeuralTrader

// Functions
export function listBrokerTypes(): Array<string>
export function validateBrokerConfig(config: BrokerConfig): boolean
export function listModelTypes(): Array<string>
export function calculateSharpeRatio(returns: Array<number>, riskFreeRate: number, annualizationFactor: number): number
export function calculateSortinoRatio(returns: Array<number>, targetReturn: number, annualizationFactor: number): number
export function calculateMaxLeverage(portfolioValue: number, volatility: number, maxVolatilityTarget: number): number
export function compareBacktests(results: Array<BacktestResult>): string
export function calculateSma(prices: Array<number>, period: number): Array<number>
export function calculateRsi(prices: Array<number>, period: number): Array<number>
export function listDataProviders(): Array<string>
export function fetchMarketData(symbol: string, start: string, end: string, timeframe: string): Promise<NapiResult>
export function calculateIndicator(bars: Array<JsBar>, indicator: string, params: string): Promise<NapiResult>
export function encodeBarsToBuffer(bars: Array<JsBar>): NapiResult
export function decodeBarsFromBuffer(buffer: Buffer): NapiResult
export function initRuntime(numThreads?: number | undefined | null): NapiResult
export function getVersionInfo(): NapiResult

// Enums
export const enum ModelType {
  NHITS = 'NHITS',
  LSTMAttention = 'LSTMAttention',
  Transformer = 'Transformer'
}
```

### 3.2 BrokerClient Class Methods

```typescript
class BrokerClient {
  constructor(config: BrokerConfig)
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  placeOrder(order: OrderRequest): Promise<OrderResponse>
  cancelOrder(orderId: string): Promise<boolean>
  getOrderStatus(orderId: string): Promise<OrderResponse>
  getAccountBalance(): Promise<AccountBalance>
  listOrders(): Promise<Array<OrderResponse>>
  getPositions(): Promise<Array<JsPosition>>
}
```

### 3.3 NeuralModel Class Methods

```typescript
class NeuralModel {
  constructor(config: ModelConfig)
  train(data: Array<number>, targets: Array<number>, trainingConfig: TrainingConfig): Promise<Array<TrainingMetrics>>
  predict(inputData: Array<number>): Promise<PredictionResult>
  save(path: string): Promise<string>
  load(path: string): Promise<void>
  getInfo(): Promise<string>
}
```

### 3.4 RiskManager Class Methods

```typescript
class RiskManager {
  constructor(config: RiskConfig)
  calculateVar(returns: Array<number>, portfolioValue: number): VaRResult
  calculateCvar(returns: Array<number>, portfolioValue: number): CVaRResult
  calculateKelly(winRate: number, avgWin: number, avgLoss: number): KellyResult
  calculateDrawdown(equityCurve: Array<number>): DrawdownMetrics
  calculatePositionSize(portfolioValue: number, pricePerShare: number, riskPerTrade: number, stopLossDistance: number): PositionSize
  validatePosition(positionSize: number, portfolioValue: number, maxPositionPercentage: number): boolean
}
```

### 3.5 BacktestEngine Class Methods

```typescript
class BacktestEngine {
  constructor(config: BacktestConfig)
  run(signals: Array<Signal>, marketData: string): Promise<BacktestResult>
  calculateMetrics(equityCurve: Array<number>): BacktestMetrics
  exportTradesCsv(trades: Array<Trade>): string
}
```

### 3.6 MarketDataProvider Class Methods

```typescript
class MarketDataProvider {
  constructor(config: MarketDataConfig)
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  fetchBars(symbol: string, start: string, end: string, timeframe: string): Promise<Array<Bar>>
  getQuote(symbol: string): Promise<Quote>
  subscribeQuotes(symbols: Array<string>, callback: (...args: any[]) => any): SubscriptionHandle
  getQuotesBatch(symbols: Array<string>): Promise<Array<Quote>>
  isConnected(): Promise<boolean>
}
```

### 3.7 StrategyRunner Class Methods

```typescript
class StrategyRunner {
  constructor()
  addMomentumStrategy(config: StrategyConfig): Promise<string>
  addMeanReversionStrategy(config: StrategyConfig): Promise<string>
  addArbitrageStrategy(config: StrategyConfig): Promise<string>
  generateSignals(): Promise<Array<Signal>>
  subscribeSignals(callback: (...args: any[]) => any): SubscriptionHandle
  listStrategies(): Promise<Array<string>>
  removeStrategy(strategyId: string): Promise<boolean>
}
```

### 3.8 PortfolioOptimizer Class Methods

```typescript
class PortfolioOptimizer {
  constructor(config: OptimizerConfig)
  optimize(symbols: Array<string>, returns: Array<number>, covariance: Array<number>): Promise<PortfolioOptimization>
  calculateRisk(positions: Record<string, number>): RiskMetrics
}
```

### 3.9 PortfolioManager Class Methods

```typescript
class PortfolioManager {
  constructor(initialCash: number)
  getPositions(): Promise<Array<Position>>
  getPosition(symbol: string): Promise<Position | null>
  updatePosition(symbol: string, quantity: number, price: number): Promise<Position>
  getCash(): Promise<number>
  getTotalValue(): Promise<number>
  getTotalPnl(): Promise<number>
}
```

### 3.10 NeuralTrader Main Class Methods

```typescript
class NeuralTrader {
  constructor(config: JsConfig)
  start(): Promise<NapiResult>
  stop(): Promise<NapiResult>
  getPositions(): Promise<NapiResult>
  placeOrder(order: JsOrder): Promise<NapiResult>
  getBalance(): Promise<NapiResult>
  getEquity(): Promise<NapiResult>
}
```

### 3.11 CLI Wrapper Functions

```typescript
// CLI Operations (cli-wrapper.js)
function initProject(projectType: string, projectName: string, path?: string): Promise<Object>
function listStrategies(): Promise<Array>
function listBrokers(): Promise<Array>
function runBacktest(strategy: string, startDate: string, endDate: string, initialCapital: number, config?: string): Promise<string>
function startPaperTrading(command: TradeCommand): Promise<Object>
function startLiveTrading(command: TradeCommand): Promise<Object>
function getAgentStatus(strategyId?: string): Promise<Array>
function trainNeuralModel(modelType: string, dataPath: string, config?: string): Promise<string>
function manageSecrets(action: string, key?: string, value?: string): Promise<string>
```

### 3.12 MCP Server Functions

```typescript
// MCP Operations (mcp-wrapper.js)
function startServer(config: ServerConfig): Promise<string>
function stopServer(): Promise<boolean>
function getServerStatus(): Promise<Object>
function listTools(): Promise<Array>
function callTool(toolName: string, params: Object | string): Promise<Object>
function restartServer(config: ServerConfig): Promise<string>
function configureClaudeDesktop(): Promise<string>
function testConnection(): Promise<boolean>
function startStdioServer(): Promise<string>
function startHttpServer(port: number, host?: string): Promise<string>
function startWebSocketServer(port: number, host?: string): Promise<string>
```

### 3.13 Swarm Coordination Functions

```typescript
// Swarm Operations (swarm-wrapper.js)
function init(config: SwarmConfig): Promise<string>
function spawnAgent(agentConfig: AgentConfig): Promise<string>
function getStatus(): Promise<Object>
function listAgents(): Promise<Array>
function orchestrateTask(task: TaskRequest): Promise<Object>
function stopAgent(agentId: string): Promise<boolean>
function destroy(): Promise<boolean>
function scale(targetAgents: number): Promise<number>
function healthCheck(): Promise<string>
function createMeshSwarm(maxAgents?: number): Promise<string>
function createHierarchicalSwarm(maxAgents?: number): Promise<string>
function createStarSwarm(maxAgents?: number): Promise<string>
```

---

## 4. Neural Network Architecture

### 4.1 Supported Model Types

| Model | Inference Time | Accuracy (R^2) | Best For |
|-------|---------------|----------------|----------|
| **N-BEATS** | 45ms | 0.90 | Speed-critical applications |
| **Transformer** | 115ms | 0.91 | Maximum accuracy |
| **LSTM** | 82ms | 0.87 | Sequential patterns |
| **GRU** | 68ms | 0.86 | Memory efficiency |
| **DeepAR** | 156ms | 0.88 | Probabilistic forecasting |
| **TCN** | 94ms | 0.85 | Long sequences |

### 4.2 Model Configuration Interface

```typescript
interface ModelConfig {
  modelType: string        // 'NHITS' | 'LSTMAttention' | 'Transformer'
  inputSize: number        // Input feature dimension
  horizon: number          // Prediction horizon
  hiddenSize: number       // Hidden layer size
  numLayers: number        // Number of layers
  dropout: number          // Dropout rate (0-1)
  learningRate: number     // Learning rate
}

interface TrainingConfig {
  epochs: number                  // Training epochs
  batchSize: number              // Batch size
  validationSplit: number        // Validation split ratio
  earlyStoppingPatience: number  // Early stopping patience
  useGpu: boolean                // GPU acceleration
}
```

### 4.3 Prediction Output

```typescript
interface PredictionResult {
  predictions: Array<number>     // Point predictions
  lowerBound: Array<number>      // Lower confidence bound
  upperBound: Array<number>      // Upper confidence bound
  timestamp: string              // Prediction timestamp
}
```

### 4.4 Self-Learning Capabilities

- **Improvement Rate**: +26.9% accuracy over 1000 trades
- **Transfer Learning**: 70% time savings vs training from scratch
- **Pattern Recognition**: Discovers profitable patterns automatically
- **Regime Detection**: Auto-switches strategies (bull/bear/sideways)

---

## 5. Trading Algorithms

### 5.1 Built-in Strategies

#### Momentum Strategy
```typescript
const config: StrategyConfig = {
  name: 'MomentumStrategy',
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  parameters: JSON.stringify({
    lookbackPeriod: 20,
    threshold: 0.02
  })
};
await runner.addMomentumStrategy(config);
```

#### Mean Reversion Strategy
```typescript
const config: StrategyConfig = {
  name: 'MeanReversionStrategy',
  symbols: ['SPY', 'QQQ'],
  parameters: JSON.stringify({
    bollingerPeriod: 20,
    stdDev: 2.0
  })
};
await runner.addMeanReversionStrategy(config);
```

#### Arbitrage Strategy
```typescript
const config: StrategyConfig = {
  name: 'ArbitrageStrategy',
  symbols: ['AAPL', 'MSFT'],
  parameters: JSON.stringify({
    spreadThreshold: 0.01,
    hedgeRatio: 1.0
  })
};
await runner.addArbitrageStrategy(config);
```

### 5.2 SONA (Self-Optimizing Neural Architecture)

```javascript
const { StrategySONA } = require('neural-trader/src/ruvector/strategies-sona');

const strategy = new StrategySONA({
  lookbackPeriod: 20,
  optimizationInterval: 100,
  minTradeSize: 0.01,
  maxPositionSize: 1.0,
  riskLimit: 0.02
});

// Generate trading signal
const signal = await strategy.generateSignal(marketData);
// { action: 'buy'|'sell'|'hold', confidence: 0.85, score: 0.35, features: {...} }

// Execute trade
const result = await strategy.executeTrade(signal, currentPrice);
```

### 5.3 GNN-Enhanced Prediction

```javascript
const { PredictorGNN } = require('neural-trader/src/ruvector/predictor-gnn');

const predictor = new PredictorGNN({
  inputDim: 10,
  hiddenDim: 64,
  outputDim: 1,
  numLayers: 3,
  dropout: 0.1
});

// Train the model
const metrics = await predictor.train(data, labels, {
  epochs: 100,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2
});

// Make predictions
const prediction = predictor.predict(inputFeatures);
```

### 5.4 Portfolio Attention Mechanism

```javascript
const { PortfolioAttention } = require('neural-trader/src/ruvector/portfolio-attention');

const portfolio = new PortfolioAttention({
  numAssets: 10,
  numHeads: 8,
  headDim: 64,
  dropout: 0.1,
  maxPositionSize: 0.2
});

// Optimize portfolio allocation
const allocation = await portfolio.optimize(marketData, 'moderate');
// { weights: [...], assets: [...], timestamp: ..., riskProfile: 'moderate' }

// Rebalance portfolio
const rebalance = await portfolio.rebalance(newMarketData);
// { portfolio: {...}, trades: [...] }
```

---

## 6. Rust/NAPI Bindings

### 6.1 Binary Loading Strategy

The package uses a sophisticated multi-platform binary loading system:

```javascript
// Platform detection and loading (neural-trader-rust/index.js)
const { platform, arch } = process;

switch (platform) {
  case 'linux':
    // Detects musl vs glibc
    if (isMusl()) {
      require('./neural-trader.linux-x64-musl.node');
    } else {
      require('./neural-trader.linux-x64-gnu.node');
    }
    break;
  case 'darwin':
    // Universal binary or arch-specific
    require('./neural-trader.darwin-arm64.node');
    break;
  case 'win32':
    require('./neural-trader.win32-x64-msvc.node');
    break;
}
```

### 6.2 NAPI Loader Shared Module

```javascript
// Unified NAPI loading with context-aware error handling
function loadNativeBinding(basePath, context = 'Unknown') {
  const attempts = [];

  // Attempt 1: Development path
  try {
    return require(path.join(basePath, 'neural-trader-rust'));
  } catch (e) { attempts.push(e); }

  // Attempt 2: node_modules
  try {
    return require('neural-trader-rust');
  } catch (e) { attempts.push(e); }

  // Attempt 3: Relative path
  try {
    return require(path.join(__dirname, '../../../neural-trader-rust'));
  } catch (e) { attempts.push(e); }

  throw new Error(`Failed to load NAPI bindings`);
}
```

### 6.3 Version Information

```typescript
interface VersionInfo {
  rustCore: string      // Rust core library version
  napiBindings: string  // NAPI bindings version
  rustCompiler: string  // Rust compiler version
}

const version = getVersionInfo();
```

---

## 7. Configuration Options

### 7.1 Broker Configuration

```typescript
interface BrokerConfig {
  brokerType: string         // 'alpaca' | 'interactive_brokers' | etc.
  apiKey: string             // API key
  apiSecret: string          // API secret
  baseUrl?: string           // Optional custom base URL
  paperTrading: boolean      // Paper vs live trading
  exchange?: string          // Exchange (for crypto)
}
```

### 7.2 Risk Configuration

```typescript
interface RiskConfig {
  confidenceLevel: number    // VaR confidence (e.g., 0.95)
  lookbackPeriods: number    // Historical periods for calculation
  method: string             // 'historical' | 'parametric' | 'monte_carlo'
}
```

### 7.3 Backtest Configuration

```typescript
interface BacktestConfig {
  initialCapital: number     // Starting capital
  startDate: string          // ISO date string
  endDate: string            // ISO date string
  commission: number         // Commission per trade
  slippage: number           // Slippage factor
  useMarkToMarket: boolean   // Mark-to-market accounting
}
```

### 7.4 Market Data Configuration

```typescript
interface MarketDataConfig {
  provider: string           // 'alpaca' | 'polygon' | 'yahoo'
  apiKey?: string            // Optional API key
  apiSecret?: string         // Optional API secret
  websocketEnabled: boolean  // Real-time streaming
}
```

### 7.5 Environment Variables

```bash
# Required for live trading
ALPACA_API_KEY=your_api_key
ALPACA_API_SECRET=your_api_secret
ALPACA_PAPER=true

# Optional configurations
E2B_API_KEY=your_e2b_key           # For cloud sandboxes
FLOW_NEXUS_API_KEY=your_key        # For Flow Nexus integration
OPENROUTER_API_KEY=your_key        # For AI model routing
```

---

## 8. Usage Examples

### 8.1 Quick Start

```javascript
const { NeuralTrader } = require('neural-trader');

const trader = new NeuralTrader({
  apiKey: process.env.ALPACA_API_KEY,
  apiSecret: process.env.ALPACA_API_SECRET,
  paperTrading: true
});

// Start the trading system
await trader.start();

// Get current positions
const positions = await trader.getPositions();
console.log('Current positions:', positions);

// Place an order
const order = await trader.placeOrder({
  symbol: 'AAPL',
  side: 'buy',
  orderType: 'market',
  quantity: '10',
  timeInForce: 'day'
});

// Stop gracefully
await trader.stop();
```

### 8.2 Neural Network Training

```javascript
const { NeuralModel, listModelTypes } = require('neural-trader');

// List available models
console.log('Available models:', listModelTypes());

// Create and train a model
const model = new NeuralModel({
  modelType: 'LSTMAttention',
  inputSize: 20,
  horizon: 5,
  hiddenSize: 64,
  numLayers: 2,
  dropout: 0.1,
  learningRate: 0.001
});

const metrics = await model.train(priceData, targets, {
  epochs: 100,
  batchSize: 32,
  validationSplit: 0.2,
  earlyStoppingPatience: 10,
  useGpu: false
});

// Make predictions
const prediction = await model.predict(recentData);
console.log('Prediction:', prediction.predictions);
console.log('Confidence:', prediction.lowerBound, '-', prediction.upperBound);
```

### 8.3 Risk Management

```javascript
const { RiskManager, calculateSharpeRatio } = require('neural-trader');

const riskManager = new RiskManager({
  confidenceLevel: 0.95,
  lookbackPeriods: 252,
  method: 'historical'
});

// Calculate VaR
const var95 = riskManager.calculateVar(returns, portfolioValue);
console.log(`VaR (95%): $${var95.varAmount.toFixed(2)}`);

// Calculate CVaR
const cvar95 = riskManager.calculateCvar(returns, portfolioValue);
console.log(`CVaR (95%): $${cvar95.cvarAmount.toFixed(2)}`);

// Kelly Criterion
const kelly = riskManager.calculateKelly(0.55, 0.02, 0.01);
console.log(`Kelly fraction: ${(kelly.kellyFraction * 100).toFixed(1)}%`);

// Position sizing
const position = riskManager.calculatePositionSize(
  100000,  // Portfolio value
  150,     // Price per share
  0.02,    // Risk per trade (2%)
  5        // Stop loss distance
);
console.log(`Recommended position: ${position.shares} shares`);

// Sharpe ratio
const sharpe = calculateSharpeRatio(returns, 0.02, 252);
console.log(`Sharpe ratio: ${sharpe.toFixed(2)}`);
```

### 8.4 Backtesting

```javascript
const { BacktestEngine, StrategyRunner } = require('neural-trader');

const engine = new BacktestEngine({
  initialCapital: 100000,
  startDate: '2020-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
  commission: 0.001,
  slippage: 0.0005,
  useMarkToMarket: true
});

const runner = new StrategyRunner();
await runner.addMomentumStrategy({
  name: 'Momentum',
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  parameters: JSON.stringify({ lookbackPeriod: 20 })
});

const signals = await runner.generateSignals();
const result = await engine.run(signals, marketDataJson);

console.log('Backtest Results:');
console.log(`  Total Return: ${(result.metrics.totalReturn * 100).toFixed(2)}%`);
console.log(`  Sharpe Ratio: ${result.metrics.sharpeRatio.toFixed(2)}`);
console.log(`  Max Drawdown: ${(result.metrics.maxDrawdown * 100).toFixed(2)}%`);
console.log(`  Win Rate: ${(result.metrics.winRate * 100).toFixed(1)}%`);
console.log(`  Total Trades: ${result.metrics.totalTrades}`);
```

### 8.5 Swarm Coordination

```javascript
const swarm = require('neural-trader/src/cli/lib/swarm-wrapper');

// Initialize mesh swarm
const swarmId = await swarm.createMeshSwarm(8);

// Spawn agents
const traderId = await swarm.spawnAgent({
  agent_type: 'trader',
  name: 'TraderBot-1',
  capabilities: ['execute', 'monitor']
});

const analyzerId = await swarm.spawnAgent({
  agent_type: 'analyzer',
  name: 'Analyzer-1',
  capabilities: ['technical', 'fundamental']
});

// Orchestrate task
const result = await swarm.orchestrateTask({
  task_type: 'trading',
  description: 'Execute momentum strategy on AAPL',
  priority: 'high',
  strategy: 'parallel'
});

// Monitor health
const health = await swarm.healthCheck();
console.log('Swarm health:', health);

// Scale swarm
await swarm.scale(12);

// Cleanup
await swarm.destroy();
```

### 8.6 MCP Server for Claude Desktop

```javascript
const mcp = require('neural-trader/src/cli/lib/mcp-wrapper');

// Start stdio server for Claude Desktop
const serverId = await mcp.startStdioServer();

// Or start HTTP server
const httpServerId = await mcp.startHttpServer(3000, 'localhost');

// List available tools
const tools = await mcp.listTools();
console.log('Available MCP tools:', tools.length);

// Call a tool
const result = await mcp.callTool('backtest', {
  strategy: 'momentum',
  symbols: ['AAPL', 'MSFT'],
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Configure for Claude Desktop
await mcp.configureClaudeDesktop();
```

---

## 9. RuVector Ecosystem Integration

### 9.1 AgentDB Compatibility Layer

Neural Trader includes a **backward compatible AgentDB implementation** using RuVector internally, providing 8.2x faster performance:

```javascript
const { RuVectorDB } = require('neural-trader/src/ruvector/agentdb-compat');

const db = new RuVectorDB({
  dimension: 384,
  metric: 'cosine',
  indexType: 'hnsw',
  quantization: { type: 'none' }
});

// Insert vectors
await db.insert([0.1, 0.2, 0.3, ...], { symbol: 'AAPL', type: 'pattern' });

// Batch insert
await db.insertBatch(
  vectors,
  vectors.map((_, i) => ({ id: i, type: 'embedding' }))
);

// Search
const results = await db.search(queryVector, 10);
results.forEach(r => {
  console.log(`${r.id}: ${r.similarity.toFixed(4)}`);
});

// Statistics
const stats = await db.getStats();
console.log(`Vectors: ${stats.count}, Dimension: ${stats.dimension}`);
```

### 9.2 Performance Comparison

| Operation | AgentDB | RuVector Compat | Speedup |
|-----------|---------|-----------------|---------|
| Search (k=10, 10K vectors) | 82ms | 10ms | **8.2x** |
| Bulk Insert (1K vectors) | 450ms | 120ms | **3.8x** |
| Index Build (100K vectors) | 12s | 2.3s | **5.2x** |

### 9.3 Feature Flags

```bash
# Environment variables to control RuVector features
RUVECTOR_READ_ENABLED=true      # Enable RuVector search (default: true)
RUVECTOR_GNN_ENABLED=false      # Enable GNN enhancement
RUVECTOR_SONA_ENABLED=false     # Enable SONA learning
RUVECTOR_COMPRESSION_ENABLED=false  # Enable compression
```

### 9.4 Related RuVector Packages

```json
{
  "@ruvector/attention": "^0.1.3",    // Attention mechanisms
  "@ruvector/gnn": "*",               // Graph Neural Networks
  "@ruvector/sona": "*",              // Self-Optimizing Neural Arch
  "ruvector": "^0.1.0"                // Core vector database
}
```

---

## 10. MCP Server Integration

### 10.1 Claude Desktop Configuration

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "neural-trader": {
      "command": "npx",
      "args": ["neural-trader", "mcp"]
    }
  }
}
```

### 10.2 Available MCP Tools (112+)

| Category | Count | Examples |
|----------|-------|----------|
| **Trading** | 25 | placeOrder, getPositions, getBalance |
| **Backtest** | 15 | runBacktest, compareStrategies |
| **Neural** | 20 | trainModel, predict, evaluateModel |
| **Risk** | 15 | calculateVaR, positionSize, kelly |
| **Portfolio** | 12 | optimize, rebalance, analyze |
| **Data** | 15 | fetchBars, getQuote, indicators |
| **Swarm** | 10 | initSwarm, spawnAgent, orchestrate |

### 10.3 Natural Language Examples

```
"Use npx neural-trader to backtest a momentum strategy on SPY from 2020-2024"

"Create a 10-agent swarm for risk management on AAPL, GOOGL, MSFT"

"Train a Transformer neural network on Tesla stock and predict next week"

"Calculate the Sharpe ratio and max drawdown for my current portfolio"
```

---

## 11. Performance Benchmarks

### 11.1 System Performance

| Operation | Neural Trader | Python Alternative | Speedup |
|-----------|--------------|-------------------|---------|
| **Backtesting (1M bars)** | 2.3s | 24.3s (Zipline) | **10.6x** |
| **Risk Calc (VaR, GPU)** | 47ms | 2,400ms (NumPy) | **51x** |
| **Neural Inference** | 45ms | 412ms (PyTorch CPU) | **9.2x** |
| **Order Execution** | <600ms | N/A | Sub-second |

### 11.2 Trading Strategy Results

Backtesting 2020-2024 ($100K capital):

| Strategy | Return | Sharpe | Max DD | Win Rate |
|----------|--------|--------|--------|----------|
| **Multi-Strategy Portfolio** | 19.8% | 2.12 | -9.1% | 69.2% |
| Neural Prediction | 22.3% | 1.85 | -12.4% | 68.5% |
| Pairs Trading | 14.7% | 2.12 | -6.3% | 72.1% |
| Arbitrage | 18.9% | 3.45 | -3.2% | 92.3% |

### 11.3 Backtesting Engine

- **Throughput**: 434,782 candles/second
- **1M candles**: 2.3 seconds
- **Memory**: <500MB for 1M candles

---

## 12. API Reference

### 12.1 Type Definitions

```typescript
// Core Trading Types
interface Signal {
  id: string
  strategyId: string
  symbol: string
  direction: string        // 'long' | 'short' | 'close'
  confidence: number       // 0-1
  entryPrice?: number
  stopLoss?: number
  takeProfit?: number
  reasoning: string
  timestampNs: number
}

interface Position {
  symbol: string
  quantity: number
  avgCost: number
  marketValue: number
  unrealizedPnl: number
  realizedPnl: number
}

interface OrderRequest {
  symbol: string
  side: string             // 'buy' | 'sell'
  orderType: string        // 'market' | 'limit' | 'stop'
  quantity: number
  limitPrice?: number
  stopPrice?: number
  timeInForce: string      // 'day' | 'gtc' | 'ioc'
}

interface OrderResponse {
  orderId: string
  brokerOrderId: string
  status: string
  filledQuantity: number
  filledPrice?: number
  timestamp: string
}

// Market Data Types
interface Bar {
  symbol: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface Quote {
  symbol: string
  bid: number
  ask: number
  bidSize: number
  askSize: number
  last: number
  lastSize: number
  timestamp: string
}

// Risk Types
interface VaRResult {
  varAmount: number
  varPercentage: number
  confidenceLevel: number
  method: string
  portfolioValue: number
}

interface DrawdownMetrics {
  maxDrawdown: number
  maxDrawdownDuration: number
  currentDrawdown: number
  recoveryFactor: number
}

interface KellyResult {
  kellyFraction: number
  halfKelly: number
  quarterKelly: number
  winRate: number
  avgWin: number
  avgLoss: number
}

// Backtest Types
interface BacktestMetrics {
  totalReturn: number
  annualReturn: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  finalEquity: number
}

interface Trade {
  symbol: string
  entryDate: string
  exitDate: string
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  pnlPercentage: number
  commissionPaid: number
}
```

### 12.2 Error Handling

```javascript
try {
  await trader.placeOrder(order);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Not enough buying power');
  } else if (error.code === 'MARKET_CLOSED') {
    console.error('Market is closed');
  } else {
    throw error;
  }
}
```

### 12.3 Validation Utilities

```javascript
const {
  validateRequiredString,
  validateRequiredNumber,
  validateRequiredArray,
  validateRequiredObject,
  validateDateString,
  validateEnum
} = require('neural-trader/src/cli/lib/validation-utils');

// Validate inputs before NAPI calls
validateRequiredString(symbol, 'symbol');
validatePositiveNumber(quantity, 'quantity');
validateEnum(side, 'side', ['buy', 'sell']);
validateDateString(startDate, 'startDate');
```

---

## Summary

Neural Trader v2.7.1 represents a comprehensive, production-grade algorithmic trading platform with:

- **178+ NAPI functions** for high-performance trading operations
- **6 neural network models** with self-learning capabilities
- **5 platform targets** with pre-built binaries
- **112+ MCP tools** for AI assistant integration
- **8.2x faster** vector search via RuVector compatibility
- **Sub-200ms** order execution latency

The package integrates seamlessly with the RuVector ecosystem and provides a complete solution for automated trading, risk management, backtesting, and AI-powered decision making.

---

## 13. Syndicate Management & Sports Betting

### 13.1 Syndicate Management Tools (15 Tools)

Neural Trader includes comprehensive syndicate management for collaborative trading and sports betting:

```typescript
// Initialize a trading syndicate
const syndicate = await mcp.call('neural-trader', 'syndicate_create', {
  name: 'Alpha Trading Syndicate',
  members: ['user1', 'user2', 'user3'],
  initialCapital: 100000,
  profitSharingModel: 'proportional'
});

// Kelly Criterion optimization for syndicate bets
const kellyBet = await mcp.call('neural-trader', 'syndicate_kelly', {
  syndicateId: syndicate.id,
  probability: 0.55,
  odds: 2.1,
  bankroll: 50000
});

// Syndicate governance voting
const vote = await mcp.call('neural-trader', 'syndicate_vote', {
  syndicateId: syndicate.id,
  proposal: 'Increase max bet size to $5000',
  votingPeriod: '7d'
});
```

### 13.2 Sports Betting Integration

**Supported Sports:**
- NFL (National Football League)
- NBA (National Basketball Association)
- MLB (Major League Baseball)

**Betting Strategies:**
| Strategy | Description |
|----------|-------------|
| `kelly_criterion` | Optimal bet sizing based on edge |
| `fractional_kelly` | Reduced Kelly for lower volatility |
| `fixed_percentage` | Fixed % of bankroll per bet |
| `unit_betting` | Fixed unit size betting |

### 13.3 Portfolio Simulation

```javascript
// Monte Carlo portfolio simulation
const simulation = await mcp.call('neural-trader', 'syndicate_simulate', {
  bets: [
    { sport: 'NFL', game: 'KC vs BUF', side: 'KC', odds: -110 },
    { sport: 'NBA', game: 'LAL vs BOS', side: 'BOS', odds: +150 },
    { sport: 'MLB', game: 'NYY vs LAD', side: 'NYY', odds: -130 }
  ],
  strategy: 'kelly_criterion',
  simulations: 10000,
  bankroll: 100000
});

console.log('Expected Value:', simulation.expectedValue);
console.log('Win Probability:', simulation.winProbability);
console.log('95% VaR:', simulation.valueAtRisk);
```

---

## 14. Rust Crates on crates.io

### 14.1 Core Crates

| Crate | Version | Downloads | Description |
|-------|---------|-----------|-------------|
| `neural-trader-predictor` | 0.1.0 | 26+ | Neural prediction engine |
| `nt-execution` | 0.1.0 | 221+ | Broker integration (Alpaca, IBKR) |

### 14.2 Installation

```bash
# Add to Cargo.toml
cargo add neural-trader-predictor
cargo add nt-execution

# Or install CLI globally
cargo install neural-trader-predictor
```

### 14.3 Rust Usage Example

```rust
use neural_trader_predictor::Predictor;
use nt_execution::{BrokerClient, AlpacaConfig};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize predictor with NHITS model
    let predictor = Predictor::new()
        .model("nhits")
        .horizon(5)
        .build()?;

    // Generate forecast
    let forecast = predictor.predict(&historical_data)?;
    println!("Forecast: {:?}", forecast.values);
    println!("Confidence: {:?}", forecast.confidence_intervals);

    // Execute trade via Alpaca
    let broker = BrokerClient::new(AlpacaConfig {
        api_key: std::env::var("ALPACA_API_KEY")?,
        api_secret: std::env::var("ALPACA_SECRET")?,
        paper: true,
    })?;

    broker.connect().await?;
    let order = broker.place_order(OrderRequest {
        symbol: "AAPL".to_string(),
        side: Side::Buy,
        qty: 10,
        order_type: OrderType::Market,
    }).await?;

    Ok(())
}
```

### 14.4 Related ruv-swarm Crates

| Crate | Downloads | Description |
|-------|-----------|-------------|
| `ruv-swarm-ml` | 1,375+ | 27+ forecasting models for swarm intelligence |
| `ruv-swarm-core` | 1,792+ | Core orchestration and agent traits |
| `ruv-swarm-agents` | 1,528+ | Specialized AI agents |
| `neuro-divergent` | N/A | NeuralForecast-compatible Rust library |

---

## 15. E2B Cloud Execution

### 15.1 Sandbox Deployment

Neural Trader supports E2B cloud sandboxes for isolated execution:

```javascript
const { FlowNexus } = require('flow-nexus');

// Create neural trading sandbox
const sandbox = await FlowNexus.sandbox.create({
  template: 'neural-trader',
  timeout: 3600,
  env: {
    ALPACA_API_KEY: process.env.ALPACA_API_KEY,
    ALPACA_SECRET: process.env.ALPACA_SECRET
  }
});

// Execute trading strategy in cloud
const result = await sandbox.execute({
  strategy: 'momentum',
  symbols: ['AAPL', 'GOOGL', 'MSFT'],
  riskLimit: 0.05,
  capital: 100000
});

console.log('Execution Result:', result);

// Cleanup
await sandbox.destroy();
```

### 15.2 Distributed Training

```javascript
// Train neural models across distributed sandboxes
const cluster = await FlowNexus.neural.clusterInit({
  name: 'trading-cluster',
  architecture: 'transformer',
  topology: 'mesh',
  nodes: 5
});

// Deploy training nodes
await cluster.deployNode({
  role: 'worker',
  model: 'large',
  capabilities: ['training', 'inference']
});

// Start distributed training
const training = await cluster.trainDistributed({
  dataset: 'market-data-2024',
  epochs: 100,
  batchSize: 32,
  optimizer: 'adam'
});

console.log('Training complete:', training.metrics);
```

---

## 16. Prediction Markets Integration

### 16.1 Supported Platforms

| Platform | Type | Features |
|----------|------|----------|
| **Polymarket** | Decentralized | Real-time odds, order book |
| **Augur** | Blockchain | P2P betting, dispute resolution |

### 16.2 Expected Value Calculations

```javascript
const { PredictionMarkets } = require('@neural-trader/prediction-markets');

const pm = new PredictionMarkets({
  polymarket: { apiKey: process.env.POLYMARKET_KEY }
});

// Get market data
const market = await pm.getMarket('PRESIDENTIAL_ELECTION_2024');

// Calculate expected value
const ev = pm.calculateExpectedValue({
  probability: 0.58,  // Your estimated probability
  odds: market.currentOdds,
  stake: 1000
});

console.log('Expected Value:', ev.value);
console.log('Kelly Fraction:', ev.kellyFraction);
console.log('Recommended Bet:', ev.recommendedStake);
```

---

## 17. External Resources

### 17.1 Official Links

| Resource | URL |
|----------|-----|
| **NPM Package** | [npmjs.com/package/neural-trader](https://www.npmjs.com/package/neural-trader) |
| **MCP Package** | [npmjs.com/package/@neural-trader/mcp](https://www.npmjs.com/package/@neural-trader/mcp) |
| **Platform** | [neural-trader.ruv.io](https://neural-trader.ruv.io/) |
| **GitHub Gist** | [Claude Code Neural Trader](https://gist.github.com/ruvnet/eb28152cb122c9e0336cb8b1b25c01b3) |

### 17.2 Crates.io

| Crate | URL |
|-------|-----|
| **neural-trader-predictor** | [crates.io/crates/neural-trader-predictor](https://crates.io/crates/neural-trader-predictor) |
| **nt-execution** | [crates.io/crates/nt-execution](https://crates.io/crates/nt-execution) |
| **ruv-swarm-ml** | [crates.io/crates/ruv-swarm-ml](https://crates.io/crates/ruv-swarm-ml) |

### 17.3 Related Projects by ruvnet

| Project | Description |
|---------|-------------|
| [claude-flow](https://github.com/ruvnet/claude-flow) | Multi-agent orchestration platform |
| [ruvector](https://github.com/ruvnet/ruvector) | Distributed vector database with GNN |
| [ruv-FANN](https://github.com/ruvnet/ruv-FANN) | Fast neural network library for Rust |
| [agentic-flow](https://github.com/ruvnet/agentic-flow) | AI agent deployment platform |

---

## Summary

Neural Trader v2.7.1 represents a comprehensive, production-grade algorithmic trading platform with:

- **178+ NAPI functions** for high-performance trading operations
- **6 neural network models** with self-learning capabilities
- **5 platform targets** with pre-built binaries
- **112+ MCP tools** for AI assistant integration
- **8.2x faster** vector search via RuVector compatibility
- **Sub-200ms** order execution latency
- **15 syndicate management tools** with Kelly Criterion optimization
- **Sports betting integration** for NFL, NBA, MLB
- **Prediction markets** support for Polymarket and Augur
- **E2B cloud execution** for distributed training and sandboxed trading
- **Rust crates** on crates.io for native performance

The package integrates seamlessly with the RuVector ecosystem and provides a complete solution for automated trading, risk management, backtesting, and AI-powered decision making.

---

*Documentation generated from neural-trader@2.7.1 package analysis*
*Knowledge Base Version: 1.1.0*
*Last Updated: 2025-12-29*
