#!/bin/bash
# Local Development Environment Manager
# Updated: 2025-12-29 17:00:00 EST | Version 1.0.0
#
# Usage:
#   ./local-dev.sh start       Start all containers
#   ./local-dev.sh stop        Stop all containers
#   ./local-dev.sh status      Show status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CMD=$1

case $CMD in
    start)
        echo -e "${YELLOW}Starting multi-business KB environment...${NC}"
        docker compose -f "$COMPOSE_FILE" up -d
        echo ""
        echo -e "${GREEN}✅ Environment started${NC}"
        echo ""
        echo "Services:"
        echo "  📚 Utilities (RuvNet):  localhost:5435  pw: guruKB2025"
        echo "  💰 RetireWell:          localhost:5436  pw: retirewell2025"
        echo "  🎤 PresenterMode:       localhost:5437  pw: presenter2025"
        ;;

    stop)
        echo -e "${YELLOW}Stopping environment...${NC}"
        docker compose -f "$COMPOSE_FILE" down
        echo -e "${GREEN}✅ Stopped${NC}"
        ;;

    status)
        echo ""
        echo "╔═══════════════════════════════════════════════════════════════╗"
        echo "║              MULTI-BUSINESS KB STATUS                          ║"
        echo "╚═══════════════════════════════════════════════════════════════╝"
        echo ""
        docker compose -f "$COMPOSE_FILE" ps 2>/dev/null || echo "Not running"
        ;;

    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac
