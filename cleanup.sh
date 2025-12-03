#!/bin/bash
# Project Cleanup and Organization Script

echo "🧹 Starting Project Cleanup..."

# Create archive directory
mkdir -p archive/old_scripts
mkdir -p archive/test_files
mkdir -p archive/logs

echo "📦 Archiving old/unused files..."

# Archive old test scripts (keeping only the working ones)
mv test1.json test2.json test3.json test4.json test4_followup.json archive/test_files/ 2>/dev/null || true
mv test_new_ruvector.js archive/old_scripts/ 2>/dev/null || true
mv test_accuracy_10_queries.js archive/old_scripts/ 2>/dev/null || true

# Archive old ingestion scripts (keeping only ingest_correct.js)
mv embed_existing_knowledge.js archive/old_scripts/ 2>/dev/null || true
mv embed_ruvector.js archive/old_scripts/ 2>/dev/null || true
mv fast_ingest.js archive/old_scripts/ 2>/dev/null || true
mv optimize_knowledge_base.js archive/old_scripts/ 2>/dev/null || true
mv rebuild_knowledge_base.js archive/old_scripts/ 2>/dev/null || true
mv vectorize.js archive/old_scripts/ 2>/dev/null || true
mv vectorize_ruvector.js archive/old_scripts/ 2>/dev/null || true

# Archive inspection scripts (no longer needed)
mv inspect_llamaindex.js archive/old_scripts/ 2>/dev/null || true
mv inspect_pdf.js archive/old_scripts/ 2>/dev/null || true
mv inspect_ruvector.js archive/old_scripts/ 2>/dev/null || true
mv read_pdf.js archive/old_scripts/ 2>/dev/null || true

# Archive old verification scripts (keeping only test_full_answers.js)
mv verify_recall.js archive/old_scripts/ 2>/dev/null || true
mv verify_ruvector_recall.js archive/old_scripts/ 2>/dev/null || true
mv test_bot_efficacy.js archive/old_scripts/ 2>/dev/null || true

# Archive Google Drive related scripts (not used)
mv auth_drive.js archive/old_scripts/ 2>/dev/null || true
mv auth_service_account_instructions.js archive/old_scripts/ 2>/dev/null || true
mv browser_console_download_script.js archive/old_scripts/ 2>/dev/null || true
mv check_folder_name.js archive/old_scripts/ 2>/dev/null || true
mv find_read_ai_folder.js archive/old_scripts/ 2>/dev/null || true
mv scrape_read_ai_local.js archive/old_scripts/ 2>/dev/null || true
mv verify_service_account.js archive/old_scripts/ 2>/dev/null || true

# Archive redundant deployment scripts
mv railway-init.sh archive/old_scripts/ 2>/dev/null || true
mv prepare-railway.sh archive/old_scripts/ 2>/dev/null || true

# Archive logs
mv ngrok.log archive/logs/ 2>/dev/null || true

# Archive old database directories (not used)
mv ruvector_db archive/ 2>/dev/null || true
mv ruvector_index archive/ 2>/dev/null || true
mv test_ruvector_db archive/ 2>/dev/null || true

echo "🗑️  Removing duplicate/obsolete files..."

# Remove duplicate RuVector issue reports (keeping RUVECTOR_EMBEDDING_ISSUE_REPORT.md)
rm -f RUVECTOR_ISSUE_REPORT.md GITHUB_ISSUE_RUVECTOR.md 2>/dev/null || true

# Remove obsolete config (router.config.json not used anymore)
rm -f router.config.json 2>/dev/null || true

# Remove completed post script
rm -f post_github_issue.js 2>/dev/null || true

echo "📁 Organizing remaining files..."

# Create scripts directory for active scripts
mkdir -p scripts/{ingestion,testing,deployment}

# Move active ingestion scripts
mv ingest_correct.js scripts/ingestion/ 2>/dev/null || true
mv ingest_recursive.js scripts/ingestion/ 2>/dev/null || true
mv ingest_ruv_coaching.js scripts/ingestion/ 2>/dev/null || true
mv process_videos_visual.js scripts/ingestion/ 2>/dev/null || true
mv find_ruv_coaching.js scripts/ingestion/ 2>/dev/null || true
mv retry_failed_videos.js scripts/ingestion/ 2>/dev/null || true

# Move active test scripts
mv test_full_answers.js scripts/testing/ 2>/dev/null || true
mv test_10_questions.js scripts/testing/ 2>/dev/null || true

# Move deployment scripts
mv start-railway.sh scripts/deployment/ 2>/dev/null || true

# Keep in root (essential)
# - main.js (main entry point)
# - webhook_listener.js (active webhook)
# - auto_updater.js (active updater)

echo "📄 Updating .gitignore..."

# Add archive to .gitignore
echo "" >> .gitignore
echo "# Archived files" >> .gitignore
echo "archive/" >> .gitignore

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Archived old/unused scripts to archive/"
echo "  - Organized active scripts into scripts/"
echo "  - Removed duplicate documentation"
echo "  - Updated .gitignore"
echo ""
echo "📁 New structure:"
echo "  scripts/ingestion/  - Data ingestion scripts"
echo "  scripts/testing/    - Test scripts"
echo "  scripts/deployment/ - Deployment scripts"
echo "  archive/           - Old/unused files (not in Git)"
