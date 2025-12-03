#!/bin/bash

# Monitor video processing progress

LOG_FILE="video_processing_full.log"
OUTPUT_FILE="scripts/ingestion/video_transcripts_detailed.json"

echo "==================================================================="
echo "Video Processing Monitor"
echo "==================================================================="
echo ""

# Check if process is running
if ps aux | grep -v grep | grep "process_all_videos_detailed.js" > /dev/null; then
    echo "✅ Process Status: RUNNING"
else
    echo "⏹️  Process Status: STOPPED or COMPLETE"
fi

echo ""

# Show current progress from log
if [ -f "$LOG_FILE" ]; then
    echo "📊 Current Progress (from log):"
    echo "-------------------------------------------------------------------"
    tail -20 "$LOG_FILE"
    echo "-------------------------------------------------------------------"
fi

echo ""

# Count processed videos
if [ -f "$OUTPUT_FILE" ]; then
    PROCESSED=$(wc -l < "$OUTPUT_FILE")
    echo "✅ Videos Processed: $PROCESSED / 21"
    
    # Show summary stats
    echo ""
    echo "📈 Processing Statistics:"
    cat "$OUTPUT_FILE" | jq -r '.metadata | "  - \(.source): \(.commands_detected) commands, \(.text_length) chars"' 2>/dev/null | tail -5
else
    echo "⏳ No output file yet - processing first video..."
fi

echo ""
echo "To watch live progress: tail -f $LOG_FILE"
echo "==================================================================="
