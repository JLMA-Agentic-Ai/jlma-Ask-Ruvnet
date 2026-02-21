#!/usr/bin/env python3
"""
Code Wiki Ingestion Script for ask_ruvnet.architecture_docs table
Processes markdown files and generates SQL INSERT statements with chunking.
"""

import re
import hashlib
from pathlib import Path
from typing import List, Tuple, Dict

# Configuration
CHUNK_SIZE = 2000  # characters
CHUNK_OVERLAP = 200  # characters
CODE_WIKI_DIR = Path(__file__).parent.parent / "Code-Wiki"

# File mapping
FILES = {
    "OpenClaw-code-wikki.md": "openclaw",
    "claude-flow-code-wikki.md": "claude-flow",
    "ruvector-code-wikki.md": "ruvector"
}


def extract_heading_hierarchy(content: str) -> List[Tuple[int, str, int]]:
    """
    Extract all headings with their level and line position.
    Returns: [(level, heading_text, line_number), ...]
    """
    headings = []
    lines = content.split('\n')

    for i, line in enumerate(lines):
        match = re.match(r'^(#{1,6})\s+(.+)$', line.strip())
        if match:
            level = len(match.group(1))
            heading = match.group(2).strip()
            headings.append((level, heading, i))

    return headings


def get_category_for_line(headings: List[Tuple[int, str, int]], line_num: int) -> str:
    """
    Determine the category (heading hierarchy) for a given line number.
    Returns a breadcrumb like: "Core Components > Vector Database > HNSW Index"
    """
    current_hierarchy = []

    for level, heading, h_line in headings:
        if h_line > line_num:
            break

        # Maintain hierarchy depth
        while len(current_hierarchy) >= level:
            current_hierarchy.pop()

        current_hierarchy.append(heading)

    return " > ".join(current_hierarchy) if current_hierarchy else "Introduction"


def chunk_content(content: str, headings: List[Tuple[int, str, int]],
                   chunk_size: int = CHUNK_SIZE,
                   overlap: int = CHUNK_OVERLAP) -> List[Dict[str, str]]:
    """
    Split content into overlapping chunks with metadata.
    Returns: [{"title": str, "content": str, "category": str}, ...]
    """
    chunks = []
    lines = content.split('\n')
    start_line = 0

    while start_line < len(lines):
        # Calculate chunk boundaries
        chunk_lines = []
        current_chars = 0
        end_line = start_line

        while end_line < len(lines) and current_chars < chunk_size:
            line = lines[end_line]
            chunk_lines.append(line)
            current_chars += len(line) + 1  # +1 for newline
            end_line += 1

        # Get category for this chunk (based on first line)
        category = get_category_for_line(headings, start_line)

        # Determine title (last heading before chunk or category)
        title = category.split(" > ")[-1] if category else "Content"

        # Create chunk content
        chunk_content = '\n'.join(chunk_lines).strip()

        if chunk_content:  # Only add non-empty chunks
            chunks.append({
                "title": title,
                "content": chunk_content,
                "category": category
            })

        # Move to next chunk with overlap
        overlap_lines = 0
        overlap_chars = 0
        while overlap_lines < len(chunk_lines) and overlap_chars < overlap:
            overlap_chars += len(chunk_lines[-(overlap_lines + 1)]) + 1
            overlap_lines += 1

        start_line = end_line - overlap_lines

    return chunks


def escape_sql_string(s: str) -> str:
    """Escape single quotes and backslashes for SQL."""
    return s.replace("'", "''").replace("\\", "\\\\")


def generate_sql_inserts(file_path: Path, source_name: str) -> List[str]:
    """
    Generate SQL INSERT statements for a single file.
    """
    print(f"\n📄 Processing {file_path.name}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract headings for category determination
    headings = extract_heading_hierarchy(content)
    print(f"   Found {len(headings)} headings")

    # Chunk the content
    chunks = chunk_content(content, headings)
    print(f"   Created {len(chunks)} chunks")

    # Generate INSERT statements
    inserts = []
    for i, chunk in enumerate(chunks, 1):
        title = escape_sql_string(chunk['title'])
        content_sql = escape_sql_string(chunk['content'])
        category = escape_sql_string(chunk['category'])

        # Create INSERT statement (embedding will be NULL, to be populated separately)
        insert = f"""INSERT INTO ask_ruvnet.architecture_docs
    (title, content, source, category, embedding)
VALUES
    ('{title}', '{content_sql}', '{source_name}', '{category}', NULL);"""

        inserts.append(insert)

    return inserts


def main():
    """Main execution function."""
    print("=" * 70)
    print("Code Wiki Ingestion SQL Generator")
    print("=" * 70)
    print(f"Working directory: {Path.cwd()}")
    print(f"Code Wiki directory: {CODE_WIKI_DIR}")

    all_inserts = []
    stats = {}

    # Process each file
    for filename, source_name in FILES.items():
        file_path = CODE_WIKI_DIR / filename

        if not file_path.exists():
            print(f"\n❌ File not found: {file_path}")
            continue

        try:
            inserts = generate_sql_inserts(file_path, source_name)
            all_inserts.extend(inserts)
            stats[source_name] = len(inserts)
        except Exception as e:
            print(f"\n❌ Error processing {filename}: {e}")
            import traceback
            traceback.print_exc()
            continue

    # Write SQL file
    output_path = Path(__file__).parent.parent / "scripts" / "code-wiki-ingest.sql"

    with open(output_path, 'w', encoding='utf-8') as f:
        # Write header
        f.write("-- Code Wiki Ingestion SQL\n")
        f.write("-- Generated automatically - DO NOT EDIT MANUALLY\n")
        f.write("-- \n")
        f.write(f"-- Total INSERT statements: {len(all_inserts)}\n")
        for source, count in stats.items():
            f.write(f"--   {source}: {count} chunks\n")
        f.write("-- \n\n")

        # Write database connection
        f.write("-- Connect to the database\n")
        f.write("\\c ask_ruvnet\n\n")

        # Write all inserts
        f.write("-- Begin transaction\n")
        f.write("BEGIN;\n\n")

        for insert in all_inserts:
            f.write(insert)
            f.write("\n\n")

        f.write("-- Commit transaction\n")
        f.write("COMMIT;\n\n")

        # Write verification query
        f.write("-- Verify ingestion\n")
        f.write("SELECT source, COUNT(*) as chunk_count \n")
        f.write("FROM ask_ruvnet.architecture_docs \n")
        f.write("GROUP BY source \n")
        f.write("ORDER BY source;\n")

    print("\n" + "=" * 70)
    print("✅ SQL Generation Complete!")
    print("=" * 70)
    print(f"\n📊 Statistics:")
    for source, count in stats.items():
        print(f"   {source:20s}: {count:4d} chunks")
    print(f"   {'TOTAL':20s}: {len(all_inserts):4d} chunks")

    print(f"\n📝 Output file: {output_path}")
    print(f"   File size: {output_path.stat().st_size / 1024:.1f} KB")

    print("\n🚀 Next steps:")
    print(f"   1. Copy SQL file to Docker container:")
    print(f"      docker cp {output_path} ruvector-kb:/tmp/code-wiki-ingest.sql")
    print(f"\n   2. Execute SQL in container:")
    print(f"      docker exec -it ruvector-kb psql -U postgres -f /tmp/code-wiki-ingest.sql")
    print(f"\n   3. Generate embeddings (separate step):")
    print(f"      docker exec -it ruvector-kb psql -U postgres -c \"UPDATE ask_ruvnet.architecture_docs SET embedding = ruvector_embed(content) WHERE embedding IS NULL;\"")
    print()


if __name__ == "__main__":
    main()
