#!/usr/bin/env node
/**
 * Ingest all documentation into KB
 * Reads docs/*.md and data/*.md files, chunks them, and inserts into ruvector-postgres
 * v1.0.0 - 2025-12-30
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA = 'ask_ruvnet';
const TABLE = 'architecture_docs';
const CHUNK_SIZE = 1500; // Characters per chunk
const CHUNK_OVERLAP = 200;

function generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32);
}

function psql(sql) {
    try {
        execFileSync('psql', [
            '-h', 'localhost',
            '-p', '5435',
            '-U', 'postgres',
            '-d', 'postgres',
            '-c', sql
        ], {
            stdio: 'pipe',
            env: { ...process.env, PGPASSWORD: 'guruKB2025' },
            maxBuffer: 10 * 1024 * 1024
        });
        return true;
    } catch (e) {
        return false;
    }
}

function chunkDocument(content, title) {
    const chunks = [];
    const sections = content.split(/\n(?=##\s)/); // Split on H2 headers

    for (const section of sections) {
        const headerMatch = section.match(/^##\s+(.+)/);
        const sectionHeader = headerMatch ? headerMatch[1] : title;

        // If section is small enough, use as-is
        if (section.length <= CHUNK_SIZE) {
            if (section.trim().length > 50) {
                chunks.push({
                    content: section.trim(),
                    header: sectionHeader
                });
            }
        } else {
            // Split large sections into chunks with overlap
            let start = 0;
            while (start < section.length) {
                let end = start + CHUNK_SIZE;

                // Try to break at a sentence or paragraph
                if (end < section.length) {
                    const lastPeriod = section.lastIndexOf('.', end);
                    const lastNewline = section.lastIndexOf('\n', end);
                    const breakPoint = Math.max(lastPeriod, lastNewline);
                    if (breakPoint > start + CHUNK_SIZE / 2) {
                        end = breakPoint + 1;
                    }
                }

                const chunk = section.slice(start, end).trim();
                if (chunk.length > 50) {
                    chunks.push({
                        content: chunk,
                        header: sectionHeader
                    });
                }

                start = end - CHUNK_OVERLAP;
                if (start < 0) start = end;
            }
        }
    }

    return chunks;
}

function insertChunk(title, content, source, sectionHeader, sectionIndex) {
    const docId = generateHash(title + content + sectionIndex);
    const fileHash = generateHash(content);
    const safeTitle = title.replace(/'/g, "''").substring(0, 500);
    const safeContent = content.replace(/'/g, "''").substring(0, 10000);
    const safeSource = source.replace(/'/g, "''");
    const safeHeader = (sectionHeader || '').replace(/'/g, "''").substring(0, 200);
    const embeddingText = (title + ' ' + safeHeader + ' ' + content.substring(0, 400)).replace(/'/g, "''");

    const sql = `INSERT INTO ${SCHEMA}.${TABLE} (doc_id, title, content, file_path, section_header, section_index, file_hash, embedding)
        VALUES ('${docId}', '${safeTitle}', '${safeContent}', '${safeSource}', '${safeHeader}', ${sectionIndex}, '${fileHash}', ruvector_embed('${embeddingText}'))
        ON CONFLICT (doc_id) DO NOTHING;`;
    return psql(sql);
}

function categorizeFile(filename) {
    const name = filename.toLowerCase();
    if (name.includes('agent')) return 'agent-integration';
    if (name.includes('api')) return 'api-reference';
    if (name.includes('deploy')) return 'deployment';
    if (name.includes('memory') || name.includes('episodic')) return 'concepts';
    if (name.includes('rag') || name.includes('pattern')) return 'best-practices';
    if (name.includes('tutorial') || name.includes('guide')) return 'tutorials';
    if (name.includes('config')) return 'best-practices';
    if (name.includes('error') || name.includes('troubleshoot')) return 'troubleshooting';
    if (name.includes('security')) return 'deployment';
    if (name.includes('wasm') || name.includes('simd')) return 'concepts';
    return 'general';
}

async function ingestDocs() {
    console.log('📚 Documentation Ingestion to KB');
    console.log('═══════════════════════════════════════════════════════════\n');

    const dirs = ['docs', 'data'];
    let totalFiles = 0;
    let totalChunks = 0;
    let successChunks = 0;

    for (const dir of dirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) continue;

        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
        console.log(`📂 Processing ${dir}/ (${files.length} files)\n`);

        for (const file of files) {
            // Skip conversation logs and cleanup reports
            if (file.includes('convo') || file.includes('cleanup')) continue;

            const filePath = path.join(dirPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Extract title from first heading or filename
            const titleMatch = content.match(/^#\s+(.+)/m);
            const title = titleMatch ? titleMatch[1] : file.replace('.md', '').replace(/_/g, ' ');

            const category = categorizeFile(file);
            const source = `${category}/${file}`;

            const chunks = chunkDocument(content, title);
            totalFiles++;

            process.stdout.write(`   ${file.substring(0, 40).padEnd(40)} `);

            let fileSuccess = 0;
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (insertChunk(title, chunk.content, source, chunk.header, i)) {
                    fileSuccess++;
                    successChunks++;
                }
                totalChunks++;
            }

            console.log(`${fileSuccess}/${chunks.length} chunks`);
        }
        console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Ingestion Complete`);
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Chunks created: ${successChunks}/${totalChunks}`);

    // Show new total
    try {
        const result = execFileSync('psql', [
            '-h', 'localhost', '-p', '5435', '-U', 'postgres', '-d', 'postgres',
            '-t', '-c', `SELECT COUNT(*) FROM ${SCHEMA}.${TABLE};`
        ], {
            env: { ...process.env, PGPASSWORD: 'guruKB2025' },
            encoding: 'utf-8'
        });
        console.log(`   Total KB entries: ${result.trim()}`);
    } catch (e) {}
}

ingestDocs().catch(console.error);
