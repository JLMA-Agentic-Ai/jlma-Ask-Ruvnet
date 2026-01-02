#!/bin/bash
# Sync Utilities to All Businesses
# Updated: 2025-12-29 17:00:00 EST | Version 1.0.0
#
# Usage: ./sync-utilities.sh [business-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_BUSINESS=$1

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              SYNC UTILITIES TO BUSINESSES                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}Exporting utilities from kb-utilities...${NC}"

TEMP_FILE=$(mktemp)
PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -t -A -c "
SELECT json_agg(row_to_json(t))
FROM (SELECT id, title, content, source, created_at FROM askruvnet.guru_knowledge ORDER BY id) t
" > "$TEMP_FILE" 2>/dev/null || { echo "Failed to connect"; exit 1; }

UTIL_COUNT=$(cat "$TEMP_FILE" | jq 'length' 2>/dev/null || echo "0")
echo -e "${GREEN}  Found $UTIL_COUNT utility vectors${NC}"

if [ -n "$TARGET_BUSINESS" ]; then
    BUSINESSES=("$TARGET_BUSINESS")
else
    BUSINESSES=($(ls -1 "$BASE_DIR/businesses/" 2>/dev/null))
fi

for biz in "${BUSINESSES[@]}"; do
    BIZ_DIR="$BASE_DIR/businesses/$biz"
    if [ -d "$BIZ_DIR" ]; then
        echo -e "${YELLOW}Syncing to $biz...${NC}"
        mkdir -p "$BIZ_DIR/utilities-snapshot"
        cp "$TEMP_FILE" "$BIZ_DIR/utilities-snapshot/utilities.json"
        echo -e "${GREEN}  ✅ $biz updated${NC}"
    fi
done

rm "$TEMP_FILE"
echo -e "\n${GREEN}✅ Utilities synced to ${#BUSINESSES[@]} business(es)${NC}"
