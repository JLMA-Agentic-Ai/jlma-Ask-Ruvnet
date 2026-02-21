#!/usr/bin/env python3
"""
Code Wiki Ingestion SQL Generator v2 - Streaming version
Processes large markdown files and generates SQL INSERT statements
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

# Configuration
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 200
CODE_WIKI_DIR = Path("Code-Wiki")

FILES = {
    "OpenClaw-code-wikki.md": "openclaw",
    "claude-flow-code-wikki.md": "claude-flow",
    "ruvector-code-wikki.md": "ruvector"
}


def escape_sql(s: str) -> str:
    """Escape SQL string."""
    return s.replace("'", "''").replace("\\", "\\\\")


def extract_headings(content: str) -> List[Tuple[int, str, int]]:
    """Extract headings with level and line number."""
    headings = []
    for i, line in enumerate(content.split('\n')):
        m = re.match(r'^(#{1,6})\s+(.+)$', line.strip())
        if m:
            headings.append((len(m.group(1)), m.group(2).strip(), i))
    return headings


def get_category(headings: List[Tuple[int, str, int]], line_num: int) -> str:
    """Get category breadcrumb for line number."""
    hierarchy = []
    for level, heading, h_line in headings:
        if h_line > line_num:
            break
        while len(hierarchy) >= level:
            hierarchy.pop()
        hierarchy.append(heading)
    return " > ".join(hierarchy) if hierarchy else "Introduction"


def process_file(filepath: Path, source: str, output_file) -> int:
    """Process file and write SQL INSERT statements."""
    print(f"\n📄 Processing {filepath.name}...", file=sys.stderr)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract headings
    headings = extract_headings(content)
    print(f"   Found {len(headings)} headings", file=sys.stderr)

    # Process in chunks
    lines = content.split('\n')
    total_chunks = 0
    start_line = 0

    while start_line < len(lines):
        # Build chunk
        chunk_lines = []
        chars = 0
        end_line = start_line

        while end_line < len(lines) and chars < CHUNK_SIZE:
            line = lines[end_line]
            chunk_lines.append(line)
            chars += len(line) + 1
            end_line += 1

        # Get metadata
        category = get_category(headings, start_line)
        title = category.split(" > ")[-1] if category else "Content"
        chunk_content = '\n'.join(chunk_lines).strip()

        # Write INSERT if not empty
        if chunk_content:
            title_sql = escape_sql(title)
            content_sql = escape_sql(chunk_content)
            category_sql = escape_sql(category)

            output_file.write(f"""INSERT INTO ask_ruvnet.architecture_docs (title, content, source, category, embedding)
VALUES ('{title_sql}', '{content_sql}', '{source}', '{category_sql}', NULL);

""")
            total_chunks += 1

        # Calculate overlap
        overlap_lines = 0
        overlap_chars = 0
        while overlap_lines < len(chunk_lines) and overlap_chars < CHUNK_OVERLAP:
            overlap_chars += len(chunk_lines[-(overlap_lines + 1)]) + 1
            overlap_lines += 1

        start_line = end_line - overlap_lines

    print(f"   Created {total_chunks} chunks", file=sys.stderr)
    return total_chunks


def main():
    """Main function."""
    print("=" * 70, file=sys.stderr)
    print("Code Wiki Ingestion SQL Generator v2", file=sys.stderr)
    print("=" * 70, file=sys.stderr)

    output_path = Path("scripts/code-wiki-ingest.sql")
    stats = {}

    with open(output_path, 'w', encoding='utf-8') as f:
        # Write header
        f.write("-- Code Wiki Ingestion SQL\n")
        f.write("-- Generated automatically\n\n")
        f.write("\\c ask_ruvnet\n\n")
        f.write("BEGIN;\n\n")

        # Process each file
        for filename, source in FILES.items():
            filepath = CODE_WIKI_DIR / filename

            if not filepath.exists():
                print(f"❌ Not found: {filepath}", file=sys.stderr)
                continue

            try:
                count = process_file(filepath, source, f)
                stats[source] = count
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}", file=sys.stderr)
                continue

        # Write footer
        f.write("COMMIT;\n\n")
        f.write("-- Verify ingestion\n")
        f.write("SELECT source, COUNT(*) as chunks FROM ask_ruvnet.architecture_docs ")
        f.write("GROUP BY source ORDER BY source;\n")

    # Print summary
    print("\n" + "=" * 70, file=sys.stderr)
    print("✅ SQL Generation Complete!", file=sys.stderr)
    print("=" * 70, file=sys.stderr)
    print(f"\n📊 Statistics:", file=sys.stderr)
    total = 0
    for source, count in stats.items():
        print(f"   {source:20s}: {count:4d} chunks", file=sys.stderr)
        total += count
    print(f"   {'TOTAL':20s}: {total:4d} chunks", file=sys.stderr)

    size_kb = output_path.stat().st_size / 1024
    print(f"\n📝 Output: {output_path} ({size_kb:.1f} KB)", file=sys.stderr)

    print("\n🚀 Next steps:", file=sys.stderr)
    print(f"   docker cp {output_path} ruvector-kb:/tmp/code-wiki-ingest.sql", file=sys.stderr)
    print(f"   docker exec -it ruvector-kb psql -U postgres -f /tmp/code-wiki-ingest.sql", file=sys.stderr)


if __name__ == "__main__":
    main()
