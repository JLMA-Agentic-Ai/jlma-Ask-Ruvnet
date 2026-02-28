-- =============================================================================
-- Ingest ruvi (rUv CLI) knowledge entries into Ask-RuvNet KB
-- Package: ruvi v1.1.0 — "rUv CLI - Agentic Engineering Console with MCP integration"
-- Author: rUv (Reuven Cohen) <ruv@ruv.net>
-- NPM: https://www.npmjs.com/package/ruvi
-- GitHub: https://github.com/ruvnet/hacker-console-coach (cli subdirectory)
-- Created: 2026-02-27
-- =============================================================================
--
-- Usage:
--   psql -h <host> -p <port> -U postgres -d postgres -f scripts/ingest-ruvi-kb.sql
--
-- Target table: ask_ruvnet.architecture_docs
-- Columns used: doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Overview — What ruvi is, how to install, core value proposition
-- ---------------------------------------------------------------------------
INSERT INTO ask_ruvnet.architecture_docs
  (doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier, file_hash)
VALUES (
  'ruvi-overview-001',
  'ruvi CLI — Overview and Installation',
  E'ruvi is a command-line interface published on npm that provides access to rUv''s AI coaching platform. '
  'The full name is "rUv CLI - Agentic Engineering Console with MCP integration." '
  'It is maintained by rUv (Reuven Cohen), an independent AI consultant with over 30 years of technology expertise '
  'who coined "Infrastructure as a Service" in 2005 and played a pivotal role in the EY.ai deployment ($1.4B budget, 400k+ employees).\n\n'
  'Installation:\n'
  '  npx ruvi              — run without installing (recommended)\n'
  '  npm install -g ruvi   — global installation\n'
  '  ruvi                  — launch interactive menu after global install\n\n'
  'The interactive menu offers: Overview (about rUv), Console (AI chat), Resume (projects portfolio), '
  'Booking (coaching sessions), Tribe (Agentic Tribe community), and Login/Logout (Supabase auth).\n\n'
  'Direct commands include: register, login, logout, status, packages, search, console, resume, overview, '
  'booking, tribe, and mcp.\n\n'
  'Technology stack: Node.js 18+ runtime, TypeScript source, Supabase backend (PostgreSQL + Edge Functions), '
  'Google Gemini 2.5 Flash AI via Lovable AI Gateway, OpenAI text-embedding-3-small for embeddings, '
  'pgvector for vector search.\n\n'
  'Key dependencies: @supabase/supabase-js ^2.39.3, fastmcp ^3.20.2, commander ^12.0.0, '
  'enquirer ^2.4.1, chalk ^5.3.0, zod ^3.22.4, node-fetch ^3.3.2, ora ^8.0.1, dotenv ^16.4.5.\n\n'
  'License: MIT. Published as an ES module with a bin entry at dist/index.js.',
  'ruvi',
  'documentation',
  'github://ruvnet/ruvi/README.md',
  ARRAY['ruvi', 'cli', 'mcp', 'installation', 'overview', 'ruvnet', 'agentic'],
  'gold',
  'sha256:0001'
);

-- ---------------------------------------------------------------------------
-- 2. MCP Integration — FastMCP server, tools, resources, client configuration
-- ---------------------------------------------------------------------------
INSERT INTO ask_ruvnet.architecture_docs
  (doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier, file_hash)
VALUES (
  'ruvi-mcp-integration-002',
  'ruvi CLI — MCP Server Integration and Tools',
  E'ruvi includes a full Model Context Protocol (MCP) server built with FastMCP v3.20.2. '
  'The server runs on stdio transport and is compatible with any MCP client.\n\n'
  'Start the MCP server: npx ruvi mcp\n\n'
  'Available MCP Tools:\n'
  '  ai_chat — Chat with the rUv AI assistant powered by RAG knowledge base. '
  'Parameters: message (string, required), conversation_history (array, optional). '
  'Returns streaming AI responses with knowledge base context.\n'
  '  semantic_search — Search the knowledge base using vector similarity. '
  'Parameters: query (string, required), limit (number, default 5). '
  'Returns relevant documents with similarity scores.\n\n'
  'Available MCP Resources (URI-based):\n'
  '  ruv://profile — Professional profile, 30+ years of technology leadership, career highlights.\n'
  '  ruv://projects — Complete project portfolio (AgentDB, Claude-Flow, Neural Trader, FACT, QuDAG, etc.).\n'
  '  ruv://services — Coaching session types, pricing, Agentic Tribe details, booking links.\n\n'
  'Claude Desktop configuration (add to claude_desktop_config.json):\n'
  '  { "mcpServers": { "ruvi": { "command": "npx", "args": ["-y", "ruvi@latest", "mcp"] } } }\n\n'
  'Config file locations:\n'
  '  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json\n'
  '  Windows: %APPDATA%\\Claude\\claude_desktop_config.json\n'
  '  Linux: ~/.config/Claude/claude_desktop_config.json\n\n'
  'Also compatible with Cline (VS Code), Continue.dev, and any custom MCP client using stdio transport. '
  'The -y flag auto-confirms npx installation and @latest ensures the newest version.',
  'ruvi',
  'documentation',
  'github://ruvnet/ruvi/docs/mcp-integration.md',
  ARRAY['ruvi', 'mcp', 'fastmcp', 'tools', 'resources', 'claude-desktop', 'stdio'],
  'gold',
  'sha256:0002'
);

-- ---------------------------------------------------------------------------
-- 3. AI Console and Coaching Features
-- ---------------------------------------------------------------------------
INSERT INTO ask_ruvnet.architecture_docs
  (doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier, file_hash)
VALUES (
  'ruvi-coaching-console-003',
  'ruvi CLI — AI Console, Coaching, and Agentic Tribe',
  E'The ruvi console command launches an interactive AI chat powered by Google Gemini 2.5 Flash '
  'via Supabase edge functions with RAG (Retrieval-Augmented Generation) knowledge base integration.\n\n'
  'Console features:\n'
  '  - Streaming responses with real-time display\n'
  '  - RAG knowledge base search for accurate, context-aware information\n'
  '  - Conversation history maintained during session\n'
  '  - Parallel tool execution for multi-topic queries\n'
  '  - Secure authentication with Supabase\n\n'
  'Console commands: /help (show help), /clear (clear history), /history (show history), /exit (quit).\n\n'
  'Coaching Sessions (via Calendly):\n'
  '  15-Minute Quick Guidance — $149\n'
  '  30-Minute Strategic Planning — $299 (most popular)\n'
  '  60-Minute Comprehensive Coaching — $499\n\n'
  'Neural Trader Training: Group sessions, private 1-on-1 coaching, enterprise team training.\n\n'
  'Agentic Tribe Community ($250/month):\n'
  '  - Bi-weekly 2-hour live sessions with small cohorts (~5 people)\n'
  '  - Hands-on projects and collaboration with direct access to rUv\n'
  '  - Topics: multi-agent orchestration, neural network optimization, autonomous trading, '
  'quantum-resistant architectures, distributed ML, enterprise AI deployment, MCP integration, '
  'agent security and privacy.',
  'ruvi',
  'documentation',
  'github://ruvnet/ruvi/docs/coaching-and-console.md',
  ARRAY['ruvi', 'coaching', 'ai-chat', 'console', 'gemini', 'rag', 'tribe'],
  'gold',
  'sha256:0003'
);

-- ---------------------------------------------------------------------------
-- 4. Relationship to RuVector Ecosystem
-- ---------------------------------------------------------------------------
INSERT INTO ask_ruvnet.architecture_docs
  (doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier, file_hash)
VALUES (
  'ruvi-ecosystem-004',
  'ruvi CLI — Relationship to RuVector and rUv Ecosystem',
  E'ruvi is the personal CLI gateway into the broader rUv/RuVector ecosystem of npm packages and tools. '
  'It serves as a discovery layer and entry point for the following major projects:\n\n'
  'claude-flow — Enterprise AI orchestration with swarm intelligence, multi-agent coordination, '
  'distributed processing, HNSW vector search, and native Claude Code integration. '
  'The leading agent orchestration platform for Claude.\n\n'
  'ruvector — High-performance vector graph neural network and database built in Rust. '
  'Includes vector search, graph queries, GNN learning, proof-gated graph transformers, '
  'distributed clustering, local LLMs, 46 attention mechanisms, cognitive containers (RVF), '
  'and WASM support.\n\n'
  'agentic-flow — Alternative low-cost AI model switching in Claude Code/Agent SDK. '
  'Lets users build agents with Claude, then deploy them as fully hosted agents in any cloud.\n\n'
  'flow-nexus — The first competitive agentic platform built entirely on MCP. '
  'Deploy autonomous AI swarms, train neural networks, compete in challenges, earn rUv credits.\n\n'
  'agentdb — Vector database optimized for AI agent workflows.\n\n'
  'aidefence (AIMDS) — AI security middleware with 3-layer pipeline, meta-learning, '
  'and Lyapunov chaos detection.\n\n'
  'The ruvi packages command (npx ruvi packages) fetches and displays all ecosystem packages '
  'organized by category: AI Orchestration, Agent Frameworks, MCP Servers, Databases/Storage, '
  'Security/Defense, Research Tools, and Development Tools. '
  'Users can browse, search, install globally or locally, run with npx, or copy commands. '
  'MCP server packages include ready-to-use Claude Desktop configuration snippets.',
  'ruvi',
  'architecture',
  'github://ruvnet/ruvi/docs/ecosystem-relationships.md',
  ARRAY['ruvi', 'ruvector', 'claude-flow', 'agentic-flow', 'flow-nexus', 'agentdb', 'ecosystem'],
  'gold',
  'sha256:0004'
);

-- ---------------------------------------------------------------------------
-- 5. Version History and Evolution
-- ---------------------------------------------------------------------------
INSERT INTO ask_ruvnet.architecture_docs
  (doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier, file_hash)
VALUES (
  'ruvi-versions-005',
  'ruvi CLI — Version History and Release Timeline',
  E'ruvi has 8 published versions on npm, from 1.0.0 to 1.1.0.\n\n'
  'Release timeline:\n'
  '  1.0.0 — 2025-10-21T16:01:32Z — Initial release. Core CLI with interactive menu, '
  'AI console, authentication, booking, and MCP server.\n'
  '  1.0.1 — 2025-10-21T17:52:13Z — Patch release (same day as 1.0.0).\n'
  '  1.0.2 — 2025-10-21T17:55:26Z — Patch release.\n'
  '  1.0.3 — 2025-10-21T18:03:08Z — Patch release.\n'
  '  1.0.4 — 2025-10-21T18:03:58Z — Patch release.\n'
  '  1.0.5 — 2025-10-21T18:07:36Z — Patch release.\n'
  '  1.0.6 — 2025-10-21T18:13:04Z — Stabilized 1.0.x release. All six 1.0.x patches shipped '
  'on the same day (October 21, 2025), indicating rapid iteration during initial launch.\n'
  '  1.1.0 — 2025-11-15T20:14:18Z — Minor version bump. Added package discovery and installation '
  'features (npx ruvi packages, npx ruvi search). Enhanced MCP server configuration snippets. '
  'Current latest release.\n\n'
  'Package metadata: 82 files, 285,791 bytes unpacked. Published by ruvnet <ruv@ruv.net>. '
  'Built with Node.js 22.21.1 and npm 10.9.4. '
  'Source repository: github.com/ruvnet/hacker-console-coach (cli subdirectory).\n\n'
  'The package was created on 2025-10-21 and last modified on 2025-11-15.',
  'ruvi',
  'changelog',
  'github://ruvnet/ruvi/CHANGELOG.md',
  ARRAY['ruvi', 'versions', 'changelog', 'releases', 'npm'],
  'silver',
  'sha256:0005'
);

-- ---------------------------------------------------------------------------
-- 6. Authentication and Supabase Integration
-- ---------------------------------------------------------------------------
INSERT INTO ask_ruvnet.architecture_docs
  (doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier, file_hash)
VALUES (
  'ruvi-auth-supabase-006',
  'ruvi CLI — Authentication and Supabase Integration',
  E'ruvi uses Supabase for authentication, sharing the same auth system as the rUv web dashboard.\n\n'
  'Authentication commands:\n'
  '  npx ruvi register  — Create a new account\n'
  '  npx ruvi login     — Login to existing account\n'
  '  npx ruvi logout    — Logout and clear session\n'
  '  npx ruvi status    — Check current authentication status\n\n'
  'Session tokens are stored locally in ~/.ruv/session.json with automatic expiration handling.\n\n'
  'The dependency @supabase/supabase-js ^2.39.3 provides the client library for communicating '
  'with the Supabase backend. The backend uses Supabase PostgreSQL for data storage and '
  'Supabase Edge Functions to proxy AI requests to Google Gemini 2.5 Flash.\n\n'
  'Authentication flow:\n'
  '  1. User runs npx ruvi register or npx ruvi login\n'
  '  2. Credentials are sent to Supabase Auth via @supabase/supabase-js\n'
  '  3. On success, session token is saved to ~/.ruv/session.json\n'
  '  4. Subsequent commands read the session token for authenticated API calls\n'
  '  5. Token expiration is handled automatically\n\n'
  'The MCP server works without authentication for public resources (profile, projects, services). '
  'Authenticated features are reserved for personalized experiences in future releases.\n\n'
  'Input validation uses zod ^3.22.4 for schema validation of user inputs and API responses.',
  'ruvi',
  'documentation',
  'github://ruvnet/ruvi/docs/authentication.md',
  ARRAY['ruvi', 'authentication', 'supabase', 'session', 'security'],
  'gold',
  'sha256:0006'
);

-- ---------------------------------------------------------------------------
-- 7. Package Discovery System
-- ---------------------------------------------------------------------------
INSERT INTO ask_ruvnet.architecture_docs
  (doc_id, title, content, package_name, doc_type, file_path, topics, triage_tier, file_hash)
VALUES (
  'ruvi-packages-discovery-007',
  'ruvi CLI — Package Discovery and Installation System',
  E'ruvi v1.1.0 introduced a built-in package discovery and installation system for browsing '
  'the entire rUv/ruvnet npm ecosystem.\n\n'
  'Commands:\n'
  '  npx ruvi packages  — Browse all rUv packages (aliases: pkgs, list)\n'
  '  npx ruvi search    — Search packages by keyword (alias: find)\n\n'
  'Package categories displayed:\n'
  '  AI Orchestration — claude-flow, agentic-flow, ruv-swarm\n'
  '  Agent Frameworks — Research tools and autonomous systems\n'
  '  MCP Servers — Model Context Protocol integrations\n'
  '  Databases and Storage — agentdb, vector databases\n'
  '  Security and Defense — aidefence and security tools\n'
  '  Research Tools — goalie, research-swarm\n'
  '  Development Tools — Solvers, frameworks, utilities\n\n'
  'Interactive installation options:\n'
  '  1. Browse by category to see all packages organized by purpose\n'
  '  2. Search functionality to find specific packages quickly\n'
  '  3. Installation choices per package:\n'
  '     - Global installation (npm install -g)\n'
  '     - Local project installation (npm install)\n'
  '     - Run with npx (no install required)\n'
  '     - Copy command to clipboard\n\n'
  'MCP Server Discovery:\n'
  '  When browsing packages, users can select "View MCP servers" to get instant '
  'configuration snippets for Claude Desktop. This generates ready-to-paste JSON '
  'for claude_desktop_config.json, making it trivial to add any rUv MCP server '
  'to Claude Desktop, Cline, or Continue.dev.\n\n'
  'The package list is fetched dynamically from the npm registry, so newly published '
  'ruvnet packages appear automatically without a ruvi update.',
  'ruvi',
  'documentation',
  'github://ruvnet/ruvi/docs/package-discovery.md',
  ARRAY['ruvi', 'packages', 'discovery', 'npm', 'installation', 'ecosystem'],
  'silver',
  'sha256:0007'
);

COMMIT;

-- =============================================================================
-- Verification query (run after ingestion to confirm entries were inserted):
--
--   SELECT id, title, triage_tier, topics
--   FROM ask_ruvnet.architecture_docs
--   WHERE package_name = 'ruvi'
--   ORDER BY id DESC;
--
-- Expected: 7 rows (5 gold, 2 silver)
--   gold:   overview, mcp, coaching, ecosystem, authentication = 5
--   silver: versions, package-discovery = 2
-- Total: 7 entries inserted
-- =============================================================================
