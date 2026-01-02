#!/bin/bash
# Fork Business to Railway
# Updated: 2025-12-29 17:00:00 EST | Version 1.0.0
#
# Usage: ./fork-to-railway.sh <business-name>
# Example: ./fork-to-railway.sh retirewell

set -e

BUSINESS=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
BUSINESS_DIR="$BASE_DIR/businesses/$BUSINESS"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$BUSINESS" ]; then
    echo -e "${RED}Usage: $0 <business-name>${NC}"
    echo "Available businesses:"
    ls -1 "$BASE_DIR/businesses/" 2>/dev/null || echo "  (none)"
    exit 1
fi

if [ ! -d "$BUSINESS_DIR" ]; then
    echo -e "${RED}Business not found: $BUSINESS${NC}"
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              FORK TO RAILWAY: $BUSINESS"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Snapshot utilities
echo -e "${YELLOW}Step 1: Snapshotting utilities KB...${NC}"
SNAPSHOT_DIR="$BUSINESS_DIR/utilities-snapshot"
mkdir -p "$SNAPSHOT_DIR"

PGPASSWORD=guruKB2025 psql -h localhost -p 5435 -U postgres -t -A -c "
SELECT json_agg(row_to_json(t))
FROM (SELECT id, title, content, source, created_at FROM askruvnet.guru_knowledge ORDER BY id) t
" > "$SNAPSHOT_DIR/utilities.json" 2>/dev/null || {
    echo -e "${RED}Failed to export utilities. Is kb-utilities running?${NC}"
    exit 1
}

UTIL_COUNT=$(cat "$SNAPSHOT_DIR/utilities.json" | jq 'length' 2>/dev/null || echo "0")
echo -e "${GREEN}  Exported $UTIL_COUNT utility vectors${NC}"

# Step 2: Export business data
echo -e "${YELLOW}Step 2: Exporting $BUSINESS data...${NC}"
case $BUSINESS in
    retirewell) PORT=5436; PASS="retirewell2025" ;;
    presentermode) PORT=5437; PASS="presenter2025" ;;
    *) PORT=5438; PASS="business2025" ;;
esac

PGPASSWORD=$PASS psql -h localhost -p $PORT -U postgres -t -A -c "
SELECT json_agg(row_to_json(t))
FROM (SELECT id, title, content, source, created_at FROM guru_knowledge ORDER BY id) t
" > "$SNAPSHOT_DIR/business-data.json" 2>/dev/null || echo "[]" > "$SNAPSHOT_DIR/business-data.json"

BIZ_COUNT=$(cat "$SNAPSHOT_DIR/business-data.json" | jq 'length' 2>/dev/null || echo "0")
echo -e "${GREEN}  Exported $BIZ_COUNT business vectors${NC}"

# Step 3: Create Railway config
echo -e "${YELLOW}Step 3: Creating Railway configuration...${NC}"

cat > "$BUSINESS_DIR/railway.json" << EOF
{"\$schema": "https://railway.app/railway.schema.json", "build": {"builder": "DOCKERFILE"}}
EOF

cat > "$BUSINESS_DIR/Dockerfile" << 'DOCKERFILE'
FROM ruvnet/ruvector-postgres:latest
COPY utilities-snapshot /utilities-snapshot
ENV UTILITIES_MODE=embedded
DOCKERFILE

echo -e "${GREEN}  Railway configuration created${NC}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Fork package ready: $BUSINESS_DIR${NC}"
echo ""
echo "To deploy to Railway:"
echo "  cd $BUSINESS_DIR"
echo "  railway link"
echo "  railway up"
echo "═══════════════════════════════════════════════════════════════"
