-- =============================================================================
-- WORLD-CLASS KNOWLEDGE BASE SCHEMA FOR RUVNET ECOSYSTEM
-- =============================================================================
-- Version: 1.0.0
-- Created: 2026-01-02
-- Purpose: Definitive PostgreSQL schema for categorized, deduplicated,
--          quality-scored knowledge base with topic hierarchy
-- =============================================================================

-- Drop existing schema if migrating (CAREFUL - backup first!)
-- DROP SCHEMA IF EXISTS ruvnet_kb CASCADE;

-- =============================================================================
-- SCHEMA CREATION
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS ruvnet_kb;

-- =============================================================================
-- EXTENSION DEPENDENCIES
-- =============================================================================

-- Enable required extensions (ruvector-postgres has these)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- ENUMERATION TYPES
-- =============================================================================

-- Document types
CREATE TYPE ruvnet_kb.doc_type AS ENUM (
    'api_reference',           -- API documentation, function signatures
    'tutorial',                -- Step-by-step guides
    'conceptual',              -- Explanatory content
    'code_example',            -- Working code samples
    'configuration',           -- Config files, settings
    'architecture',            -- System design documents
    'changelog',               -- Version history
    'troubleshooting',         -- Problem/solution pairs
    'benchmark',               -- Performance data
    'research_note'            -- Research findings, experiments
);

-- Quality tiers
CREATE TYPE ruvnet_kb.quality_tier AS ENUM (
    'canonical',      -- Authoritative, verified, primary source (100)
    'high',           -- Well-documented, tested (80-99)
    'medium',         -- Useful but may need updates (60-79)
    'low',            -- Incomplete or outdated (40-59)
    'draft',          -- Work in progress (<40)
    'deprecated'      -- Superseded, kept for history
);

-- Content status
CREATE TYPE ruvnet_kb.content_status AS ENUM (
    'active',         -- Current and maintained
    'review_needed',  -- Flagged for review
    'updating',       -- Being updated
    'archived',       -- Historical only
    'deprecated'      -- Superseded
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CATEGORIES: Top-level knowledge domains
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.categories (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,           -- e.g., 'agents', 'swarms', 'memory'
    name TEXT NOT NULL,                   -- Human-readable name
    description TEXT,
    icon TEXT,                            -- Emoji or icon code
    parent_id INTEGER REFERENCES ruvnet_kb.categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create category index for hierarchy queries
CREATE INDEX idx_categories_parent ON ruvnet_kb.categories(parent_id);
CREATE INDEX idx_categories_slug ON ruvnet_kb.categories(slug);

-- -----------------------------------------------------------------------------
-- TOPICS: Specific subjects within categories
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.topics (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,           -- e.g., 'decision-transformer', 'byzantine-consensus'
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES ruvnet_kb.categories(id),
    parent_topic_id INTEGER REFERENCES ruvnet_kb.topics(id),
    aliases TEXT[],                       -- Alternative names for search
    related_topics INTEGER[],             -- Cross-references
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_category ON ruvnet_kb.topics(category_id);
CREATE INDEX idx_topics_parent ON ruvnet_kb.topics(parent_topic_id);
CREATE INDEX idx_topics_slug ON ruvnet_kb.topics(slug);

-- -----------------------------------------------------------------------------
-- REPOSITORIES: GitHub repos that are indexed
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.repositories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,            -- e.g., 'claude-flow', 'ruvector'
    full_name TEXT NOT NULL,              -- e.g., 'ruvnet/claude-flow'
    description TEXT,
    url TEXT NOT NULL,
    stars INTEGER DEFAULT 0,
    primary_category_id INTEGER REFERENCES ruvnet_kb.categories(id),
    is_core BOOLEAN DEFAULT FALSE,        -- Core RuvNet package
    is_indexed BOOLEAN DEFAULT FALSE,     -- Has been fully indexed
    last_indexed_at TIMESTAMPTZ,
    last_commit_sha TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repos_name ON ruvnet_kb.repositories(name);
CREATE INDEX idx_repos_category ON ruvnet_kb.repositories(primary_category_id);

-- -----------------------------------------------------------------------------
-- DOCUMENTS: Main knowledge entries (REPLACES architecture_docs)
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.documents (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,

    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,                         -- AI-generated summary

    -- Classification
    doc_type ruvnet_kb.doc_type NOT NULL DEFAULT 'conceptual',
    category_id INTEGER NOT NULL REFERENCES ruvnet_kb.categories(id),
    topic_ids INTEGER[],                  -- Can belong to multiple topics

    -- Source tracking
    repository_id INTEGER REFERENCES ruvnet_kb.repositories(id),
    file_path TEXT,
    section_header TEXT,
    section_index INTEGER DEFAULT 0,
    source_url TEXT,

    -- Deduplication
    content_hash TEXT NOT NULL,           -- SHA-256 of normalized content
    canonical_id INTEGER REFERENCES ruvnet_kb.documents(id),  -- Points to canonical version

    -- Quality
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    quality_tier ruvnet_kb.quality_tier DEFAULT 'medium',
    content_status ruvnet_kb.content_status DEFAULT 'active',

    -- Embeddings (384-dim for all-MiniLM-L6-v2)
    embedding REAL[],

    -- Versioning
    version TEXT,
    package_version TEXT,

    -- Metadata
    word_count INTEGER,
    code_blocks INTEGER DEFAULT 0,        -- Number of code examples
    has_diagrams BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'en',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,              -- When human/AI verified

    -- Search optimization
    search_vector tsvector
);

-- Primary indexes
CREATE INDEX idx_docs_uuid ON ruvnet_kb.documents(uuid);
CREATE INDEX idx_docs_category ON ruvnet_kb.documents(category_id);
CREATE INDEX idx_docs_repo ON ruvnet_kb.documents(repository_id);
CREATE INDEX idx_docs_hash ON ruvnet_kb.documents(content_hash);
CREATE INDEX idx_docs_canonical ON ruvnet_kb.documents(canonical_id);
CREATE INDEX idx_docs_quality ON ruvnet_kb.documents(quality_tier, quality_score DESC);
CREATE INDEX idx_docs_type ON ruvnet_kb.documents(doc_type);
CREATE INDEX idx_docs_status ON ruvnet_kb.documents(content_status);

-- Full-text search index
CREATE INDEX idx_docs_search ON ruvnet_kb.documents USING GIN(search_vector);

-- Topic array index
CREATE INDEX idx_docs_topics ON ruvnet_kb.documents USING GIN(topic_ids);

-- -----------------------------------------------------------------------------
-- DOCUMENT_RELATIONS: Cross-references between documents
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.document_relations (
    id SERIAL PRIMARY KEY,
    source_doc_id INTEGER NOT NULL REFERENCES ruvnet_kb.documents(id) ON DELETE CASCADE,
    target_doc_id INTEGER NOT NULL REFERENCES ruvnet_kb.documents(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,          -- 'references', 'supersedes', 'extends', 'conflicts'
    confidence REAL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(source_doc_id, target_doc_id, relation_type)
);

CREATE INDEX idx_relations_source ON ruvnet_kb.document_relations(source_doc_id);
CREATE INDEX idx_relations_target ON ruvnet_kb.document_relations(target_doc_id);

-- -----------------------------------------------------------------------------
-- QUALITY_ASSESSMENTS: Detailed quality scoring
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.quality_assessments (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES ruvnet_kb.documents(id) ON DELETE CASCADE,

    -- Individual scores (0-100)
    accuracy_score INTEGER,               -- Factual correctness
    completeness_score INTEGER,           -- Coverage of topic
    clarity_score INTEGER,                -- Readability
    code_quality_score INTEGER,           -- If has code examples
    currency_score INTEGER,               -- How up-to-date

    -- Assessment metadata
    assessed_by TEXT,                     -- 'ai', 'human', 'automated'
    assessment_model TEXT,                -- Which AI model assessed
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quality_doc ON ruvnet_kb.quality_assessments(document_id);

-- -----------------------------------------------------------------------------
-- COVERAGE_TRACKING: What's covered vs what should be covered
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.coverage_gaps (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES ruvnet_kb.topics(id),
    category_id INTEGER REFERENCES ruvnet_kb.categories(id),
    repository_id INTEGER REFERENCES ruvnet_kb.repositories(id),

    gap_description TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    suggested_source TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_doc_id INTEGER REFERENCES ruvnet_kb.documents(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_gaps_topic ON ruvnet_kb.coverage_gaps(topic_id);
CREATE INDEX idx_gaps_priority ON ruvnet_kb.coverage_gaps(priority) WHERE NOT is_resolved;

-- -----------------------------------------------------------------------------
-- SEARCH_ANALYTICS: Track what users search for
-- -----------------------------------------------------------------------------
CREATE TABLE ruvnet_kb.search_analytics (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    query_embedding REAL[],
    result_count INTEGER,
    top_doc_ids INTEGER[],
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_time ON ruvnet_kb.search_analytics(created_at DESC);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to compute content hash
CREATE OR REPLACE FUNCTION ruvnet_kb.compute_content_hash(content TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Normalize: lowercase, remove extra whitespace, trim
    RETURN encode(
        sha256(
            convert_to(
                regexp_replace(lower(trim(content)), '\s+', ' ', 'g'),
                'UTF8'
            )
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update search vector
CREATE OR REPLACE FUNCTION ruvnet_kb.update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate quality tier from score
CREATE OR REPLACE FUNCTION ruvnet_kb.calculate_quality_tier(score INTEGER)
RETURNS ruvnet_kb.quality_tier AS $$
BEGIN
    RETURN CASE
        WHEN score >= 100 THEN 'canonical'::ruvnet_kb.quality_tier
        WHEN score >= 80 THEN 'high'::ruvnet_kb.quality_tier
        WHEN score >= 60 THEN 'medium'::ruvnet_kb.quality_tier
        WHEN score >= 40 THEN 'low'::ruvnet_kb.quality_tier
        ELSE 'draft'::ruvnet_kb.quality_tier
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find duplicates
CREATE OR REPLACE FUNCTION ruvnet_kb.find_duplicates(doc_id INTEGER)
RETURNS TABLE(
    duplicate_id INTEGER,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d2.id,
        1.0::REAL as similarity
    FROM ruvnet_kb.documents d1
    JOIN ruvnet_kb.documents d2 ON d1.content_hash = d2.content_hash
    WHERE d1.id = doc_id
      AND d2.id != doc_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update search vector on insert/update
CREATE TRIGGER trg_update_search_vector
    BEFORE INSERT OR UPDATE OF title, summary, content
    ON ruvnet_kb.documents
    FOR EACH ROW
    EXECUTE FUNCTION ruvnet_kb.update_search_vector();

-- Auto-compute content hash
CREATE TRIGGER trg_compute_hash
    BEFORE INSERT OR UPDATE OF content
    ON ruvnet_kb.documents
    FOR EACH ROW
    EXECUTE FUNCTION (
        CREATE OR REPLACE FUNCTION ruvnet_kb.auto_hash()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.content_hash := ruvnet_kb.compute_content_hash(NEW.content);
            NEW.word_count := array_length(regexp_split_to_array(NEW.content, '\s+'), 1);
            NEW.updated_at := NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    )();

-- Auto-update quality tier
CREATE TRIGGER trg_update_quality_tier
    BEFORE INSERT OR UPDATE OF quality_score
    ON ruvnet_kb.documents
    FOR EACH ROW
    WHEN (NEW.quality_score IS NOT NULL)
    EXECUTE FUNCTION (
        CREATE OR REPLACE FUNCTION ruvnet_kb.auto_quality_tier()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.quality_tier := ruvnet_kb.calculate_quality_tier(NEW.quality_score);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    )();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Canonical documents only (no duplicates)
CREATE VIEW ruvnet_kb.canonical_documents AS
SELECT *
FROM ruvnet_kb.documents
WHERE canonical_id IS NULL
  AND content_status = 'active';

-- Category statistics
CREATE VIEW ruvnet_kb.category_stats AS
SELECT
    c.id,
    c.slug,
    c.name,
    COUNT(DISTINCT d.id) as doc_count,
    COUNT(DISTINCT d.id) FILTER (WHERE d.quality_tier IN ('canonical', 'high')) as high_quality_count,
    AVG(d.quality_score)::INTEGER as avg_quality,
    MAX(d.updated_at) as last_updated
FROM ruvnet_kb.categories c
LEFT JOIN ruvnet_kb.documents d ON d.category_id = c.id AND d.canonical_id IS NULL
GROUP BY c.id, c.slug, c.name;

-- Topic coverage
CREATE VIEW ruvnet_kb.topic_coverage AS
SELECT
    t.id,
    t.slug,
    t.name,
    c.slug as category_slug,
    COUNT(d.id) as doc_count,
    COUNT(DISTINCT d.doc_type) as doc_type_count,
    SUM(CASE WHEN d.doc_type = 'code_example' THEN 1 ELSE 0 END) as code_examples,
    SUM(CASE WHEN d.doc_type = 'tutorial' THEN 1 ELSE 0 END) as tutorials,
    AVG(d.quality_score)::INTEGER as avg_quality
FROM ruvnet_kb.topics t
JOIN ruvnet_kb.categories c ON t.category_id = c.id
LEFT JOIN ruvnet_kb.documents d ON t.id = ANY(d.topic_ids) AND d.canonical_id IS NULL
GROUP BY t.id, t.slug, t.name, c.slug;

-- Repository coverage
CREATE VIEW ruvnet_kb.repository_coverage AS
SELECT
    r.name,
    r.full_name,
    r.stars,
    r.is_core,
    r.is_indexed,
    COUNT(d.id) as doc_count,
    COUNT(d.id) FILTER (WHERE d.quality_tier IN ('canonical', 'high')) as high_quality_count,
    COUNT(DISTINCT d.doc_type) as doc_types_covered,
    r.last_indexed_at
FROM ruvnet_kb.repositories r
LEFT JOIN ruvnet_kb.documents d ON d.repository_id = r.id AND d.canonical_id IS NULL
GROUP BY r.id, r.name, r.full_name, r.stars, r.is_core, r.is_indexed, r.last_indexed_at;

-- Quality distribution
CREATE VIEW ruvnet_kb.quality_distribution AS
SELECT
    quality_tier,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM ruvnet_kb.documents
WHERE canonical_id IS NULL
GROUP BY quality_tier
ORDER BY quality_score DESC NULLS LAST;

-- =============================================================================
-- INITIAL DATA: CATEGORIES
-- =============================================================================

INSERT INTO ruvnet_kb.categories (slug, name, description, icon, sort_order) VALUES
-- Level 1: Core Domains
('agents', 'AI Agents', 'Agent types, spawning patterns, and agent lifecycle management', '🤖', 1),
('swarms', 'Swarm Intelligence', 'Multi-agent swarm coordination, topologies, and collective behavior', '🐝', 2),
('memory', 'Memory Systems', 'Episodic, semantic, and working memory architectures', '🧠', 3),
('consensus', 'Distributed Consensus', 'Byzantine, Raft, Gossip, and other consensus protocols', '🤝', 4),
('reinforcement-learning', 'Reinforcement Learning', 'RL algorithms: Decision Transformer, Actor-Critic, PPO, SAC, etc.', '🎯', 5),
('vector-database', 'Vector Database', 'RuVector, embeddings, HNSW indexing, semantic search', '📊', 6),
('llm-orchestration', 'LLM Orchestration', 'RuvLLM, model routing, self-learning systems', '🔮', 7),
('deployment', 'Deployment', 'Docker, Railway, K8s, air-gapped, edge deployment', '🚀', 8),
('mcp-protocol', 'MCP Protocol', 'Model Context Protocol, tools, servers, integration', '🔌', 9),
('sparc', 'SPARC Methodology', 'Specification, Pseudocode, Architecture, Refinement, Completion', '⚡', 10),
('security', 'Security', 'Authentication, authorization, encryption, zero-knowledge proofs', '🔒', 11),
('performance', 'Performance', 'Benchmarks, optimization, WASM SIMD, profiling', '📈', 12),
('github-integration', 'GitHub Integration', 'PR management, code review, workflow automation', '🐙', 13),
('neural-networks', 'Neural Networks', 'ruv-FANN, training, inference, architectures', '🧬', 14),
('data-synthesis', 'Data Synthesis', 'Agentic-synth, synthetic data generation, RAG data', '🔄', 15);

-- Level 2: Subcategories (selected examples)
INSERT INTO ruvnet_kb.categories (slug, name, description, parent_id, sort_order)
SELECT 'core-agents', 'Core Development Agents', 'coder, reviewer, tester, planner, researcher', id, 1
FROM ruvnet_kb.categories WHERE slug = 'agents';

INSERT INTO ruvnet_kb.categories (slug, name, description, parent_id, sort_order)
SELECT 'specialized-agents', 'Specialized Agents', 'ml-developer, security-engineer, devops-architect', id, 2
FROM ruvnet_kb.categories WHERE slug = 'agents';

INSERT INTO ruvnet_kb.categories (slug, name, description, parent_id, sort_order)
SELECT 'swarm-topologies', 'Swarm Topologies', 'hierarchical, mesh, ring, star, adaptive topologies', id, 1
FROM ruvnet_kb.categories WHERE slug = 'swarms';

INSERT INTO ruvnet_kb.categories (slug, name, description, parent_id, sort_order)
SELECT 'hive-mind', 'Hive Mind', 'Queen-worker architecture, collective intelligence', id, 2
FROM ruvnet_kb.categories WHERE slug = 'swarms';

INSERT INTO ruvnet_kb.categories (slug, name, description, parent_id, sort_order)
SELECT 'episodic-memory', 'Episodic Memory', 'Experience storage, replay buffers, temporal indexing', id, 1
FROM ruvnet_kb.categories WHERE slug = 'memory';

INSERT INTO ruvnet_kb.categories (slug, name, description, parent_id, sort_order)
SELECT 'semantic-memory', 'Semantic Memory', 'Knowledge graphs, concept networks, fact storage', id, 2
FROM ruvnet_kb.categories WHERE slug = 'memory';

-- =============================================================================
-- INITIAL DATA: REPOSITORIES
-- =============================================================================

INSERT INTO ruvnet_kb.repositories (name, full_name, description, url, stars, is_core) VALUES
-- Core RuvNet Packages (>100 stars or essential)
('claude-flow', 'ruvnet/claude-flow', 'The leading agent orchestration platform for Claude', 'https://github.com/ruvnet/claude-flow', 11037, TRUE),
('wifi-densepose', 'ruvnet/wifi-densepose', 'WiFi-based dense human pose estimation', 'https://github.com/ruvnet/wifi-densepose', 4872, FALSE),
('rUv-dev', 'ruvnet/rUv-dev', 'AI power Dev using the rUv approach', 'https://github.com/ruvnet/rUv-dev', 420, TRUE),
('sparc', 'ruvnet/sparc', 'SPARC methodology', 'https://github.com/ruvnet/sparc', 412, TRUE),
('agentic-flow', 'ruvnet/agentic-flow', 'Switch between AI models in Claude Code/Agent SDK', 'https://github.com/ruvnet/agentic-flow', 304, TRUE),
('ruv-FANN', 'ruvnet/ruv-FANN', 'Fast neural network library for Rust', 'https://github.com/ruvnet/ruv-FANN', 291, TRUE),
('gpts', 'ruvnet/gpts', 'Collection of GPTs created by rUv', 'https://github.com/ruvnet/gpts', 285, FALSE),
('SynthLang', 'ruvnet/SynthLang', 'Hyper-efficient prompt language for LLMs', 'https://github.com/ruvnet/SynthLang', 231, TRUE),
('daa', 'ruvnet/daa', 'Decentralized Autonomous Applications', 'https://github.com/ruvnet/daa', 209, TRUE),
('dspy.ts', 'ruvnet/dspy.ts', 'Declarative Self-learning JavaScript', 'https://github.com/ruvnet/dspy.ts', 192, TRUE),
('ruvector', 'ruvnet/ruvector', 'Distributed vector database that learns', 'https://github.com/ruvnet/ruvector', 178, TRUE),
('guardrail', 'ruvnet/guardrail', 'Data analysis and AI content generation', 'https://github.com/ruvnet/guardrail', 136, FALSE),
('SAFLA', 'ruvnet/SAFLA', 'Self-Aware Feedback Loop Algorithm', 'https://github.com/ruvnet/SAFLA', 130, TRUE),
('FACT', 'ruvnet/FACT', 'Fast Augmented Context Tools', 'https://github.com/ruvnet/FACT', 130, TRUE),
('QuDAG', 'ruvnet/QuDAG', 'Quantum-Resistant DAG-Based Anonymous Communication', 'https://github.com/ruvnet/QuDAG', 128, TRUE),
('promptlang', 'ruvnet/promptlang', 'Prompt-based programming language', 'https://github.com/ruvnet/promptlang', 125, FALSE),
('agentic-voice', 'ruvnet/agentic-voice', 'AI-powered chat with real-time communication', 'https://github.com/ruvnet/agentic-voice', 104, FALSE),
('hello_world_agent', 'ruvnet/hello_world_agent', 'Simple ReACT methodology demonstration', 'https://github.com/ruvnet/hello_world_agent', 99, FALSE),
('ruvnet', 'ruvnet/ruvnet', 'ruvnet main repository', 'https://github.com/ruvnet/ruvnet', 98, TRUE),
('q-star', 'ruvnet/q-star', 'Q-Star Agent Code with AutoGen', 'https://github.com/ruvnet/q-star', 87, FALSE),
('voicebot', 'ruvnet/voicebot', 'Voicebot implementation', 'https://github.com/ruvnet/voicebot', 88, FALSE),
('Surfer', 'ruvnet/Surfer', 'ChatGPT Web Surfer Plugin', 'https://github.com/ruvnet/Surfer', 84, FALSE),
('symbolic-scribe', 'ruvnet/symbolic-scribe', 'Symbolic scribe', 'https://github.com/ruvnet/symbolic-scribe', 80, FALSE),
('auto-browser', 'ruvnet/auto-browser', 'Web automation with AI-assisted templates', 'https://github.com/ruvnet/auto-browser', 72, FALSE),
('flow-nexus', 'ruvnet/flow-nexus', 'Competitive agentic platform on MCP', 'https://github.com/ruvnet/flow-nexus', 65, TRUE),
('openai_devops', 'ruvnet/openai_devops', 'GPT-3.5 Turbo shell command generator', 'https://github.com/ruvnet/openai_devops', 65, FALSE),
('AiToml', 'ruvnet/AiToml', 'AI-TOML Workflow Specification', 'https://github.com/ruvnet/AiToml', 62, FALSE),
('Synaptic-Mesh', 'ruvnet/Synaptic-Mesh', 'Self-evolving peer-to-peer neural fabric', 'https://github.com/ruvnet/Synaptic-Mesh', 55, TRUE),
('sublinear-time-solver', 'ruvnet/sublinear-time-solver', 'Rust + WASM sublinear-time solver', 'https://github.com/ruvnet/sublinear-time-solver', 55, TRUE),
('federated-mcp', 'ruvnet/federated-mcp', 'Federated MCP systems', 'https://github.com/ruvnet/federated-mcp', 55, TRUE),
('strawberry-phi', 'ruvnet/strawberry-phi', 'Strawberry Phi', 'https://github.com/ruvnet/strawberry-phi', 55, FALSE),
('midstream', 'ruvnet/midstream', 'Real-time AI conversation analysis', 'https://github.com/ruvnet/midstream', 53, TRUE),
('reflective-engineer', 'ruvnet/reflective-engineer', 'Reflective engineering', 'https://github.com/ruvnet/reflective-engineer', 51, FALSE),
('GenAI-Superstream', 'ruvnet/GenAI-Superstream', 'Agentic Engineering for Data Analysis', 'https://github.com/ruvnet/GenAI-Superstream', 50, FALSE),
-- Supporting packages (25-49 stars)
('Agent-Name-Service', 'ruvnet/Agent-Name-Service', 'Agent Name Service (ANS) Protocol', 'https://github.com/ruvnet/Agent-Name-Service', 45, FALSE),
('ultrasonic', 'ruvnet/ultrasonic', 'Steganography for agentic commands in audio/video', 'https://github.com/ruvnet/ultrasonic', 39, FALSE),
('dynamo-mcp', 'ruvnet/dynamo-mcp', 'Dynamic MCP Registry with Cookiecutter', 'https://github.com/ruvnet/dynamo-mcp', 38, FALSE),
('inflight', 'ruvnet/inflight', 'Inflight', 'https://github.com/ruvnet/inflight', 37, FALSE),
('ARCADIA', 'ruvnet/ARCADIA', 'AI-powered game engine', 'https://github.com/ruvnet/ARCADIA', 37, FALSE),
('llamastack', 'ruvnet/llamastack', 'UI for Meta LLama Stack Apps', 'https://github.com/ruvnet/llamastack', 36, FALSE),
('agentic-search', 'ruvnet/agentic-search', 'Agentic GitHub Copilot Extension', 'https://github.com/ruvnet/agentic-search', 34, FALSE),
('vibecast', 'ruvnet/vibecast', 'Weekly Vibecast Live coding sessions', 'https://github.com/ruvnet/vibecast', 32, FALSE),
('code-mesh', 'ruvnet/code-mesh', 'Code Mesh', 'https://github.com/ruvnet/code-mesh', 32, FALSE),
('hacker-league', 'ruvnet/hacker-league', 'Hacker League', 'https://github.com/ruvnet/hacker-league', 32, FALSE),
('agileagents', 'ruvnet/agileagents', 'Serverless intelligent agents framework', 'https://github.com/ruvnet/agileagents', 30, FALSE),
('sparc-ide', 'ruvnet/sparc-ide', 'AI-driven IDE', 'https://github.com/ruvnet/sparc-ide', 26, FALSE),
('yyz-agentics-june', 'ruvnet/yyz-agentics-june', 'Neural Network Libraries with Claude-Flow', 'https://github.com/ruvnet/yyz-agentics-june', 26, FALSE),
('quantum-magnetic-navigation', 'ruvnet/quantum-magnetic-navigation', 'Quantum magnetometer navigation', 'https://github.com/ruvnet/quantum-magnetic-navigation', 26, FALSE),
('agentic-difusion', 'ruvnet/agentic-difusion', 'Diffusion-based code refinement', 'https://github.com/ruvnet/agentic-difusion', 25, FALSE);

-- =============================================================================
-- INITIAL DATA: TOPICS
-- =============================================================================

-- Agent Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'coder-agent', 'Coder Agent', 'Implementation specialist for writing clean code', id, ARRAY['coder', 'code-agent', 'implementation-agent']
FROM ruvnet_kb.categories WHERE slug = 'agents';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'reviewer-agent', 'Reviewer Agent', 'Code review and quality assurance', id, ARRAY['reviewer', 'review-agent', 'qa-agent']
FROM ruvnet_kb.categories WHERE slug = 'agents';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'tester-agent', 'Tester Agent', 'Comprehensive testing specialist', id, ARRAY['tester', 'test-agent', 'testing-agent']
FROM ruvnet_kb.categories WHERE slug = 'agents';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'researcher-agent', 'Researcher Agent', 'Deep research and information gathering', id, ARRAY['researcher', 'research-agent']
FROM ruvnet_kb.categories WHERE slug = 'agents';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'system-architect-agent', 'System Architect Agent', 'High-level system design', id, ARRAY['architect', 'system-architect']
FROM ruvnet_kb.categories WHERE slug = 'agents';

-- Swarm Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'hierarchical-topology', 'Hierarchical Topology', 'Tree-structured swarm with coordinator at root', id, ARRAY['hierarchical', 'tree-topology']
FROM ruvnet_kb.categories WHERE slug = 'swarms';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'mesh-topology', 'Mesh Topology', 'Peer-to-peer fully connected swarm', id, ARRAY['mesh', 'p2p-topology']
FROM ruvnet_kb.categories WHERE slug = 'swarms';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'ring-topology', 'Ring Topology', 'Circular communication pattern', id, ARRAY['ring', 'circular-topology']
FROM ruvnet_kb.categories WHERE slug = 'swarms';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'star-topology', 'Star Topology', 'Centralized hub-and-spoke pattern', id, ARRAY['star', 'hub-spoke']
FROM ruvnet_kb.categories WHERE slug = 'swarms';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'adaptive-topology', 'Adaptive Topology', 'Self-optimizing dynamic topology', id, ARRAY['adaptive', 'dynamic-topology']
FROM ruvnet_kb.categories WHERE slug = 'swarms';

-- Consensus Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'byzantine-consensus', 'Byzantine Fault Tolerance', 'BFT consensus for adversarial environments', id, ARRAY['byzantine', 'bft', 'pbft']
FROM ruvnet_kb.categories WHERE slug = 'consensus';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'raft-consensus', 'Raft Consensus', 'Leader-based consensus protocol', id, ARRAY['raft', 'leader-election']
FROM ruvnet_kb.categories WHERE slug = 'consensus';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'gossip-protocol', 'Gossip Protocol', 'Epidemic-style information dissemination', id, ARRAY['gossip', 'epidemic-protocol']
FROM ruvnet_kb.categories WHERE slug = 'consensus';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'crdt-sync', 'CRDT Synchronization', 'Conflict-free Replicated Data Types', id, ARRAY['crdt', 'eventual-consistency']
FROM ruvnet_kb.categories WHERE slug = 'consensus';

-- RL Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'decision-transformer', 'Decision Transformer', 'Sequence modeling for decision making', id, ARRAY['dt', 'transformer-rl']
FROM ruvnet_kb.categories WHERE slug = 'reinforcement-learning';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'actor-critic', 'Actor-Critic', 'A2C/A3C policy gradient methods', id, ARRAY['a2c', 'a3c', 'advantage-actor-critic']
FROM ruvnet_kb.categories WHERE slug = 'reinforcement-learning';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'ppo', 'Proximal Policy Optimization', 'Stable policy gradient algorithm', id, ARRAY['ppo', 'proximal-policy']
FROM ruvnet_kb.categories WHERE slug = 'reinforcement-learning';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'sac', 'Soft Actor-Critic', 'Maximum entropy RL', id, ARRAY['sac', 'soft-actor-critic', 'max-entropy-rl']
FROM ruvnet_kb.categories WHERE slug = 'reinforcement-learning';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'q-learning', 'Q-Learning', 'Value-based reinforcement learning', id, ARRAY['q-learning', 'dqn', 'deep-q']
FROM ruvnet_kb.categories WHERE slug = 'reinforcement-learning';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'experience-replay', 'Experience Replay', 'Replay buffer for sample efficiency', id, ARRAY['replay-buffer', 'per', 'prioritized-experience-replay']
FROM ruvnet_kb.categories WHERE slug = 'reinforcement-learning';

-- Memory Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'episodic-memory-system', 'Episodic Memory', 'Event-based temporal memory storage', id, ARRAY['episodic', 'event-memory']
FROM ruvnet_kb.categories WHERE slug = 'memory';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'semantic-memory-system', 'Semantic Memory', 'Knowledge graph and concept storage', id, ARRAY['semantic', 'knowledge-memory']
FROM ruvnet_kb.categories WHERE slug = 'memory';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'working-memory', 'Working Memory', 'Short-term context and attention', id, ARRAY['working', 'short-term-memory', 'stm']
FROM ruvnet_kb.categories WHERE slug = 'memory';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'reasoningbank', 'ReasoningBank', 'Adaptive learning with pattern recognition', id, ARRAY['reasoning-bank', 'trajectory-memory']
FROM ruvnet_kb.categories WHERE slug = 'memory';

-- Vector DB Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'hnsw-indexing', 'HNSW Indexing', 'Hierarchical Navigable Small World graphs', id, ARRAY['hnsw', 'approximate-nn']
FROM ruvnet_kb.categories WHERE slug = 'vector-database';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'embedding-generation', 'Embedding Generation', 'Vector embeddings for semantic search', id, ARRAY['embeddings', 'sentence-transformers']
FROM ruvnet_kb.categories WHERE slug = 'vector-database';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'ruvector-postgres', 'RuVector PostgreSQL', 'PostgreSQL extension for vector operations', id, ARRAY['ruvector-pg', 'pgvector-alternative']
FROM ruvnet_kb.categories WHERE slug = 'vector-database';

-- Deployment Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'docker-deployment', 'Docker Deployment', 'Container-based deployment patterns', id, ARRAY['docker', 'containerization']
FROM ruvnet_kb.categories WHERE slug = 'deployment';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'railway-deployment', 'Railway Deployment', 'Railway.app deployment patterns', id, ARRAY['railway', 'railway-app']
FROM ruvnet_kb.categories WHERE slug = 'deployment';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'air-gapped-deployment', 'Air-Gapped Deployment', 'Offline and isolated environments', id, ARRAY['airgapped', 'offline', 'isolated']
FROM ruvnet_kb.categories WHERE slug = 'deployment';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'edge-deployment', 'Edge Deployment', 'Edge computing and browser-based AI', id, ARRAY['edge', 'browser-ai', 'wasm-deployment']
FROM ruvnet_kb.categories WHERE slug = 'deployment';

-- Performance Topics
INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'wasm-simd', 'WASM SIMD', 'WebAssembly SIMD optimization', id, ARRAY['wasm', 'simd', 'avx512', 'avx2']
FROM ruvnet_kb.categories WHERE slug = 'performance';

INSERT INTO ruvnet_kb.topics (slug, name, description, category_id, aliases)
SELECT 'benchmarking', 'Benchmarking', 'Performance testing and metrics', id, ARRAY['benchmark', 'perf-test']
FROM ruvnet_kb.categories WHERE slug = 'performance';

-- =============================================================================
-- MIGRATION FUNCTION: Import from ask_ruvnet.architecture_docs
-- =============================================================================

CREATE OR REPLACE FUNCTION ruvnet_kb.migrate_from_architecture_docs()
RETURNS TABLE(
    imported INTEGER,
    duplicates_removed INTEGER,
    categories_assigned INTEGER
) AS $$
DECLARE
    v_imported INTEGER := 0;
    v_duplicates INTEGER := 0;
    v_categorized INTEGER := 0;
BEGIN
    -- This would be the migration logic
    -- For now, return placeholder values
    RETURN QUERY SELECT 0, 0, 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA ruvnet_kb TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ruvnet_kb TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ruvnet_kb TO postgres;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON SCHEMA ruvnet_kb IS 'World-class knowledge base for RuvNet ecosystem documentation';
COMMENT ON TABLE ruvnet_kb.documents IS 'Main knowledge entries with categorization, deduplication, and quality scoring';
COMMENT ON TABLE ruvnet_kb.categories IS 'Hierarchical category taxonomy for organizing knowledge';
COMMENT ON TABLE ruvnet_kb.topics IS 'Specific topics within categories';
COMMENT ON TABLE ruvnet_kb.repositories IS 'GitHub repositories that are indexed';
COMMENT ON VIEW ruvnet_kb.canonical_documents IS 'Non-duplicate, active documents only';
