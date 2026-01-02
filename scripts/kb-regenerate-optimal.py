#!/usr/bin/env python3
"""
KB Optimal Embedding Regeneration v1.0.0

Uses sentence-transformers to regenerate ALL 230K embeddings.
Model stays loaded in memory = 1000+ embeddings/sec.

Requirements (install first):
    pip3 install psycopg2-binary sentence-transformers numpy

Target: 0.98+ similarity on all entries
Expected time: 15-20 minutes for 230K entries

Usage:
    python3 scripts/kb-regenerate-optimal.py
"""

import sys
import time

# Check dependencies
try:
    import psycopg2
    from sentence_transformers import SentenceTransformer
    import numpy as np
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Please run: pip3 install psycopg2-binary sentence-transformers numpy")
    sys.exit(1)

# Configuration
CONFIG = {
    "host": "localhost",
    "port": 5435,
    "database": "postgres",
    "user": "postgres",
    "password": "guruKB2025",
    "schema": "ask_ruvnet",
    "batch_size": 500,
    "max_text_length": 1500,
    "model_name": "all-MiniLM-L6-v2"
}

def format_time(seconds):
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        return f"{seconds // 60:.0f}m {seconds % 60:.0f}s"
    else:
        return f"{seconds // 3600:.0f}h {(seconds % 3600) // 60:.0f}m"

def main():
    print("=" * 60)
    print("KB OPTIMAL EMBEDDING REGENERATION")
    print(f"   Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Schema: {CONFIG['schema']}")
    print(f"   Model: {CONFIG['model_name']}")
    print("=" * 60)
    print()

    # Load model
    print("Loading sentence-transformer model...")
    start_model = time.time()
    model = SentenceTransformer(CONFIG['model_name'])
    print(f"   Model loaded in {time.time() - start_model:.1f}s")
    print(f"   Embedding dimension: {model.get_sentence_embedding_dimension()}")
    print()

    # Connect to database
    print("Connecting to database...")
    conn = psycopg2.connect(
        host=CONFIG['host'],
        port=CONFIG['port'],
        database=CONFIG['database'],
        user=CONFIG['user'],
        password=CONFIG['password']
    )
    conn.autocommit = False
    cur = conn.cursor()

    # Get total count
    cur.execute(f"SELECT COUNT(*) FROM {CONFIG['schema']}.architecture_docs WHERE content IS NOT NULL")
    total = cur.fetchone()[0]
    print(f"   Total entries: {total:,}")
    print()

    # Process in batches
    print("Regenerating embeddings...")
    start_time = time.time()
    processed = 0
    offset = 0

    while offset < total:
        cur.execute(f"""
            SELECT id, title, content
            FROM {CONFIG['schema']}.architecture_docs
            WHERE content IS NOT NULL
            ORDER BY id
            OFFSET %s LIMIT %s
        """, (offset, CONFIG['batch_size']))

        rows = cur.fetchall()
        if not rows:
            break

        ids = []
        texts = []
        for row in rows:
            ids.append(row[0])
            text = f"{row[1]} {row[2]}"[:CONFIG['max_text_length']]
            texts.append(text)

        embeddings = model.encode(texts, show_progress_bar=False)

        for id_val, emb in zip(ids, embeddings):
            emb_list = emb.tolist()
            cur.execute(f"""
                UPDATE {CONFIG['schema']}.architecture_docs
                SET embedding = %s::real[]
                WHERE id = %s
            """, (emb_list, id_val))

        conn.commit()
        processed += len(rows)
        offset += CONFIG['batch_size']

        elapsed = time.time() - start_time
        rate = processed / elapsed
        remaining = (total - processed) / rate if rate > 0 else 0
        pct = (processed / total) * 100

        sys.stdout.write(f"\r   Progress: {pct:5.1f}% | {processed:,}/{total:,} | {rate:.0f}/sec | ETA: {format_time(remaining)}   ")
        sys.stdout.flush()

    total_time = time.time() - start_time
    print()
    print()
    print("=" * 60)
    print("COMPLETE!")
    print(f"   Processed: {processed:,} entries")
    print(f"   Time: {format_time(total_time)}")
    print(f"   Rate: {processed / total_time:.0f} entries/sec")
    print("=" * 60)

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
