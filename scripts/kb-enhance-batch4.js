#!/usr/bin/env node
/**
 * KB Enhancement - Batch 4: Balance Smaller Categories
 * Focus: Performance, Integrations, KB Production, KB Construction
 * v1.0.0 - 2025-12-30
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');

const SCHEMA = 'ask_ruvnet';
const TABLE = 'architecture_docs';

function generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32);
}

function psql(sql) {
    try {
        execFileSync('psql', [
            '-h', 'localhost', '-p', '5435', '-U', 'postgres', '-d', 'postgres', '-c', sql
        ], { stdio: 'pipe', env: { ...process.env, PGPASSWORD: 'guruKB2025' } });
        return true;
    } catch (e) { return false; }
}

function insert(title, content, source) {
    const docId = generateHash(title + content);
    const safe = (s) => (s || '').replace(/'/g, "''");
    const sql = `INSERT INTO ${SCHEMA}.${TABLE} (doc_id, title, content, file_path, section_index, file_hash, embedding)
        VALUES ('${docId}', '${safe(title)}', '${safe(content)}', '${safe(source)}', 0, '${generateHash(content)}',
        ruvector_embed('${safe(title + ' ' + content.substring(0, 400))}')) ON CONFLICT (doc_id) DO NOTHING;`;
    return psql(sql);
}

const entries = [
    // PERFORMANCE (Target: 30+, currently 10)
    { title: 'Query Performance Optimization', content: 'Optimize KB queries by analyzing execution plans with EXPLAIN ANALYZE. Key strategies include proper indexing, query restructuring, and connection pooling. Target query times under 10ms for most operations.', source: 'performance/query-optimization.md' },
    { title: 'Vector Search Performance Tuning', content: 'HNSW index parameters directly impact search quality and speed. m controls connections per node (16 default), ef_construction affects index build quality, ef_search controls search accuracy. Higher values improve recall but increase latency.', source: 'performance/vector-tuning.md' },
    { title: 'Connection Pool Sizing', content: 'Pool size = (core_count * 2) + effective_spindle_count is a good starting point. For SSD systems, this simplifies to cores * 2. Monitor active connections and wait times to fine-tune.', source: 'performance/connection-pooling.md' },
    { title: 'Memory Configuration for KB', content: 'shared_buffers should be 25% of RAM, effective_cache_size 75% of RAM, work_mem depends on concurrent queries but start with 64MB. HNSW indexes benefit from higher maintenance_work_mem during build.', source: 'performance/memory-config.md' },
    { title: 'Batch Processing Performance', content: 'Batch insert operations should use prepared statements and transactions. Optimal batch size is typically 100-1000 rows depending on content size. Use COPY command for bulk imports.', source: 'performance/batch-processing.md' },
    { title: 'Caching Strategies for KB', content: 'Implement multi-tier caching: application-level query cache, embedding cache for repeated texts, and result cache with TTL. Redis or Memcached for distributed caching across application instances.', source: 'performance/caching.md' },
    { title: 'Index Maintenance for Performance', content: 'Regular VACUUM ANALYZE keeps statistics current. REINDEX CONCURRENTLY rebuilds bloated indexes online. Schedule maintenance during low-traffic periods. Monitor index bloat with pg_stat_user_indexes.', source: 'performance/index-maintenance.md' },
    { title: 'Parallel Query Execution', content: 'PostgreSQL can parallelize sequential scans and certain aggregate operations. Set max_parallel_workers_per_gather based on core count. Vector operations benefit from parallel execution on large datasets.', source: 'performance/parallel-queries.md' },
    { title: 'Profiling KB Operations', content: 'Use pg_stat_statements to identify slow queries. Enable track_io_timing for I/O metrics. Application-level profiling with OpenTelemetry or similar for end-to-end latency tracking.', source: 'performance/profiling.md' },
    { title: 'Network Latency Reduction', content: 'Co-locate application and database servers in same region. Use connection keepalives to avoid reconnection overhead. Consider read replicas for query distribution.', source: 'performance/network-latency.md' },
    { title: 'Embedding Generation Performance', content: 'Batch embedding generation reduces API overhead. Use ONNX runtime with SIMD optimizations for local models. Cache embeddings for static content to avoid regeneration.', source: 'performance/embedding-perf.md' },
    { title: 'Query Result Pagination', content: 'Use keyset pagination (WHERE id > last_id) instead of OFFSET for large result sets. OFFSET performance degrades linearly with page number. Implement cursor-based pagination for APIs.', source: 'performance/pagination-perf.md' },
    { title: 'Horizontal Scaling Patterns', content: 'Read replicas for query distribution. Logical replication for geographically distributed reads. Citus extension for distributed PostgreSQL when single-node limits reached.', source: 'performance/horizontal-scaling.md' },
    { title: 'JIT Compilation Benefits', content: 'PostgreSQL JIT can improve complex query performance by 30-50% for CPU-bound operations. Enable with jit = on. Most beneficial for aggregation-heavy analytical queries.', source: 'performance/jit-compilation.md' },
    { title: 'Compression for Performance', content: 'TOAST automatically compresses large values. Consider columnar storage (Citus columnar, TimescaleDB) for append-heavy workloads. Reduces I/O for scanning operations.', source: 'performance/compression-perf.md' },

    // INTEGRATIONS (Target: 30+, currently 10)
    { title: 'LangChain Integration Guide', content: 'Connect ruvector KB to LangChain for RAG applications. Use PGVector retriever with custom embedding functions. Configure retrieval with similarity threshold and MMR diversity.', source: 'integrations/langchain.md' },
    { title: 'LlamaIndex Integration', content: 'LlamaIndex provides vector store abstraction for ruvector. Configure with PGVectorStore, set connection parameters, and use QueryEngine for RAG. Supports hybrid search modes.', source: 'integrations/llamaindex.md' },
    { title: 'OpenAI Integration', content: 'Use OpenAI embeddings with ruvector storage. text-embedding-3-large produces 3072-dimension vectors. Batch embedding requests for efficiency. Handle rate limits with exponential backoff.', source: 'integrations/openai.md' },
    { title: 'Anthropic Claude Integration', content: 'Integrate Claude for RAG workflows. Retrieve relevant KB chunks, format as context in prompts. Use Claude tool_use for structured KB interactions. Handle long contexts efficiently.', source: 'integrations/anthropic-claude.md' },
    { title: 'Hugging Face Integration', content: 'Self-host embedding models from Hugging Face. Use sentence-transformers for local embedding generation. ONNX export for faster inference. Deploy with Inference Endpoints for scale.', source: 'integrations/huggingface.md' },
    { title: 'Slack Bot Integration', content: 'Build KB-powered Slack bot. Use Slack Events API for message triggers. Query KB for relevant answers. Format responses with Slack Block Kit for rich presentation.', source: 'integrations/slack-bot.md' },
    { title: 'Discord Bot Integration', content: 'Discord.js bot with KB backend. Implement slash commands for search. Use thread responses for detailed answers. Handle rate limits and message length constraints.', source: 'integrations/discord-bot.md' },
    { title: 'REST API Gateway Integration', content: 'Expose KB through REST API. Use Express.js or FastAPI. Implement authentication with JWT. Add rate limiting and request validation. OpenAPI documentation.', source: 'integrations/rest-api.md' },
    { title: 'GraphQL Integration', content: 'PostGraphile auto-generates GraphQL API from PostgreSQL schema. Custom resolvers for vector search queries. Subscriptions for real-time KB updates.', source: 'integrations/graphql.md' },
    { title: 'Webhook Integration', content: 'Trigger external systems on KB changes. Use PostgreSQL NOTIFY/LISTEN with pg_notify. Forward events to webhook endpoints. Implement retry logic for reliability.', source: 'integrations/webhooks.md' },
    { title: 'Elasticsearch Integration', content: 'Hybrid search combining ruvector semantic with Elasticsearch keyword search. Sync data between systems. Use for advanced text analysis and aggregations.', source: 'integrations/elasticsearch.md' },
    { title: 'Pinecone Migration', content: 'Migrate from Pinecone to self-hosted ruvector. Export vectors from Pinecone, import to PostgreSQL. Map metadata fields. Compare query performance.', source: 'integrations/pinecone-migration.md' },
    { title: 'Weaviate Migration', content: 'Migrate from Weaviate to ruvector-postgres. Export GraphQL schema and data. Recreate class structure as PostgreSQL tables. Handle object references.', source: 'integrations/weaviate-migration.md' },
    { title: 'Notion Integration', content: 'Sync Notion workspace to KB. Use Notion API to extract pages and databases. Chunk content appropriately. Schedule incremental updates.', source: 'integrations/notion.md' },
    { title: 'Confluence Integration', content: 'Import Confluence spaces to KB. Handle page hierarchies and attachments. Extract structured data from tables. Maintain update sync with webhooks.', source: 'integrations/confluence.md' },

    // KB PRODUCTION (Target: 30+, currently 16)
    { title: 'Production Deployment Checklist', content: 'Pre-production checklist: Enable SSL, configure backups, set up monitoring, test failover, document runbooks, establish on-call rotation, load test with realistic data.', source: 'kb-production/checklist.md' },
    { title: 'High Availability Configuration', content: 'HA setup with streaming replication. Primary + standby architecture. Automatic failover with Patroni or repmgr. Test failover regularly in staging.', source: 'kb-production/high-availability.md' },
    { title: 'Disaster Recovery Planning', content: 'DR strategy with RTO/RPO definitions. Cross-region backup replication. Documented recovery procedures. Regular DR drills to validate procedures.', source: 'kb-production/disaster-recovery.md' },
    { title: 'Capacity Planning', content: 'Estimate storage: vectors + metadata + indexes. Growth projection based on content velocity. Plan for 2x current capacity minimum. Monitor utilization trends.', source: 'kb-production/capacity-planning.md' },
    { title: 'SLA Definition', content: 'Define SLAs for KB service: availability (99.9%), latency (p99 < 100ms), throughput (1000 QPS). Document escalation procedures for SLA breaches.', source: 'kb-production/sla-definition.md' },
    { title: 'Incident Response', content: 'Incident management process: detection, triage, mitigation, resolution, postmortem. PagerDuty or Opsgenie integration. Runbooks for common issues.', source: 'kb-production/incident-response.md' },
    { title: 'Change Management', content: 'Change control process for KB modifications. Review board for schema changes. Staged rollout with canary deployments. Rollback procedures.', source: 'kb-production/change-management.md' },
    { title: 'Security Hardening', content: 'Production security: SSL/TLS for connections, network isolation, row-level security, audit logging, regular security scans, penetration testing.', source: 'kb-production/security-hardening.md' },
    { title: 'Compliance Requirements', content: 'Compliance considerations: GDPR data handling, HIPAA for health data, SOC 2 controls, data retention policies, audit trail requirements.', source: 'kb-production/compliance.md' },
    { title: 'Cost Management', content: 'Cost optimization: right-size instances, use reserved capacity, archive cold data, optimize query patterns. Monitor spending with cloud cost tools.', source: 'kb-production/cost-management.md' },
    { title: 'Performance SLOs', content: 'Service Level Objectives: search latency p50/p95/p99, availability percentage, error rate threshold. Implement SLO dashboards and alerting.', source: 'kb-production/performance-slos.md' },
    { title: 'Operational Runbooks', content: 'Document standard procedures: restart services, scale up, handle full disk, recover from backup, rotate credentials. Keep runbooks updated and tested.', source: 'kb-production/runbooks.md' },
    { title: 'On-Call Procedures', content: 'On-call rotation setup: primary and secondary, handoff procedures, escalation paths, compensatory time. Document common alerts and responses.', source: 'kb-production/on-call.md' },
    { title: 'Maintenance Windows', content: 'Schedule regular maintenance: weekly VACUUM, monthly REINDEX, quarterly upgrades. Communicate windows to stakeholders. Minimize disruption.', source: 'kb-production/maintenance-windows.md' },

    // KB CONSTRUCTION (Target: 30+, currently 14)
    { title: 'KB Schema Design', content: 'Design schema for knowledge entries: unique identifiers, title, content, source, timestamps, embedding column. Add indexes for common query patterns.', source: 'kb-construction/schema-design.md' },
    { title: 'Content Ingestion Pipeline', content: 'Build ingestion pipeline: source connectors, content extraction, text cleaning, chunking, embedding generation, storage. Monitor pipeline health.', source: 'kb-construction/ingestion-pipeline.md' },
    { title: 'Embedding Model Selection', content: 'Choose embedding model based on: domain specificity, dimension size, inference speed, hosting requirements. Benchmark models on your data.', source: 'kb-construction/embedding-selection.md' },
    { title: 'Chunking Strategy Design', content: 'Design chunking for your content: fixed-size, semantic, document-structure based. Test retrieval quality with different chunk sizes. Include overlap.', source: 'kb-construction/chunking-strategy.md' },
    { title: 'Metadata Schema Design', content: 'Design metadata fields: source, author, date, category, version, tags. Balance richness with query complexity. Index frequently filtered fields.', source: 'kb-construction/metadata-schema.md' },
    { title: 'Quality Assurance Process', content: 'QA process for KB content: automated validation, duplicate detection, freshness checks, relevance testing. Sample-based human review.', source: 'kb-construction/quality-assurance.md' },
    { title: 'Taxonomy Development', content: 'Develop category taxonomy: hierarchical structure, consistent naming, mapping rules. Balance granularity with usability. Document taxonomy decisions.', source: 'kb-construction/taxonomy.md' },
    { title: 'Source Prioritization', content: 'Prioritize content sources: authoritative sources first, freshness requirements, coverage gaps. Maintain source quality scores.', source: 'kb-construction/source-priority.md' },
    { title: 'Incremental Updates', content: 'Implement incremental update strategy: change detection, differential updates, version tracking. Avoid full re-ingestion when possible.', source: 'kb-construction/incremental-updates.md' },
    { title: 'Multi-Language Support', content: 'Support multiple languages: language detection, language-specific embeddings, cross-lingual search. Consider multilingual models.', source: 'kb-construction/multi-language.md' },
    { title: 'Content Deduplication', content: 'Detect and handle duplicates: hash-based exact match, embedding similarity for near-duplicates. Define dedup thresholds.', source: 'kb-construction/deduplication.md' },
    { title: 'Version Control for KB', content: 'Version KB content: track changes over time, maintain history, support rollback. Consider content versioning vs schema versioning.', source: 'kb-construction/version-control.md' },
    { title: 'Testing KB Quality', content: 'Test KB quality: relevance testing with golden queries, coverage analysis, precision/recall metrics. Automated regression testing.', source: 'kb-construction/testing.md' },
    { title: 'KB Documentation', content: 'Document KB: schema documentation, ingestion procedures, query patterns, maintenance tasks. Keep documentation alongside code.', source: 'kb-construction/documentation.md' },
    { title: 'Content Enrichment', content: 'Enrich content with: entity extraction, keyword tagging, summarization, related content linking. Improve searchability and navigation.', source: 'kb-construction/enrichment.md' },
    { title: 'Access Control Design', content: 'Design access control: role-based permissions, row-level security, audit logging. Plan for multi-tenant scenarios if needed.', source: 'kb-construction/access-control.md' },
];

async function enhance() {
    console.log('📚 KB Enhancement Batch 4 - Balance Categories');
    console.log(`   Adding ${entries.length} entries to smaller categories\n`);
    let success = 0;
    for (const e of entries) {
        if (insert(e.title, e.content, e.source)) success++;
        process.stdout.write(`\r   Progress: ${success}/${entries.length}`);
    }
    console.log(`\n✅ Complete: ${success} inserted`);
}

enhance().catch(console.error);
