#!/usr/bin/env node
/**
 * Ingest upstream RuVector research entries (2026-03-20)
 *
 * Reads entries from kb-data/ruvector-upstream-kb-entries.json
 * These are source-verified entries from crawling ruvnet/RuVector on GitHub.
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const pool = new pg.Pool({
  host: 'localhost', port: 5435, user: 'postgres', password: '', database: 'postgres', max: 2
});

let embedder;
async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function embed(text) {
  const e = await getEmbedder();
  const out = await e(text, { pooling: 'mean', normalize: true });
  return '[' + Array.from(out.data).join(',') + ']';
}

async function main() {
  const entries = JSON.parse(readFileSync(join(ROOT, 'kb-data', 'ruvector-upstream-kb-entries.json'), 'utf-8'));
  console.log(`\n=== Upstream Research Ingestion: ${entries.length} entries ===\n`);

  let inserted = 0, skipped = 0, updated = 0;

  for (const entry of entries) {
    const title = entry.title;
    const content = entry.content;
    const category = entry.category;
    const quality = Math.round((entry.quality_score || 0.9) * 100);

    // Check for existing entry with similar title
    const existing = await pool.query(
      "SELECT id, title FROM ask_ruvnet.kb_complete WHERE title ILIKE $1",
      [`%${title.split('--')[0].trim()}%`]
    );

    if (existing.rows.length > 0) {
      // Update existing entry with fresh upstream data
      const embText = `${title}\n\n${content.slice(0, 1000)}`;
      console.log(`  Updating: ${title.slice(0, 60)}...`);
      const vec = await embed(embText);

      await pool.query(
        `UPDATE ask_ruvnet.kb_complete
         SET content = $1, quality_score = $2, updated_at = now(), embedding = $3
         WHERE id = $4`,
        [content, quality, vec, existing.rows[0].id]
      );
      updated++;
      console.log(`  UPDATED (id=${existing.rows[0].id}): ${existing.rows[0].title.slice(0, 60)}`);
      continue;
    }

    // Insert new entry
    const embText = `${title}\n\n${content.slice(0, 1000)}`;
    console.log(`  Embedding: ${title.slice(0, 60)}...`);
    const vec = await embed(embText);

    await pool.query(
      `INSERT INTO ask_ruvnet.kb_complete
       (file_path, title, content, category, quality_score, chunk_count, original_chars, embedding)
       VALUES ($1, $2, $3, $4, $5, 1, $6, $7)`,
      [
        `upstream-research/2026-03-20/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
        title,
        content,
        category,
        quality,
        content.length,
        vec
      ]
    );
    inserted++;
    console.log(`  INSERTED: ${title.slice(0, 60)} (${category})`);
  }

  console.log(`\n=== Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped ===`);
  const { rows } = await pool.query('SELECT count(*) as total FROM ask_ruvnet.kb_complete');
  console.log(`Total KB entries: ${rows[0].total}\n`);

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
