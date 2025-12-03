const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = [
    'src/ui/README.md',
    'RAILWAY_DEPLOY_NOW.md',
    'RAILWAY_DEPLOYMENT.md',
    'data/ruvnet_ecosystem.md',
    'data/README_AgenticFlow.md',
    'data/README_ClaudeFlow.md',
    'data/README_Sparc.md',
    'data/README_Ruvector.md',
    'data/README_NeuralTrader.md',
    'KNOWLEDGE_BASE_TECH_STACK.md',
    'FEATURES.md',
    'DEPLOY_RAILWAY.md',
    'README.md',
    'TECHNOLOGY_DECISIONS.md',
    'CLEANUP_SUMMARY.md',
    'RUVECTOR_EMBEDDING_ISSUE_REPORT.md',
    'Additional todos.md'
];

function getGitDates(filePath) {
    try {
        const created = execSync(`git log --diff-filter=A --format=%aI -- "${filePath}" | tail -n 1`).toString().trim();
        const modified = execSync(`git log -1 --format=%aI -- "${filePath}"`).toString().trim();
        return { created: created || new Date().toISOString(), modified: modified || new Date().toISOString() };
    } catch (e) {
        console.error(`Error getting git dates for ${filePath}:`, e.message);
        return { created: new Date().toISOString(), modified: new Date().toISOString() };
    }
}

function updateFile(filePath) {
    const fullPath = path.resolve(__dirname, '../', filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping missing file: ${filePath}`);
        return;
    }

    const { created, modified } = getGitDates(filePath);
    const createdDate = created.split('T')[0];
    const modifiedDate = modified.split('T')[0];

    let content = fs.readFileSync(fullPath, 'utf8');

    // Check for existing frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    let newFrontmatter = `created: ${createdDate}\nlast_modified: ${modifiedDate}`;

    if (match) {
        // Update existing frontmatter
        let fm = match[1];
        if (fm.includes('created:')) {
            fm = fm.replace(/created: .*/, `created: ${createdDate}`);
        } else {
            fm += `\ncreated: ${createdDate}`;
        }
        if (fm.includes('last_modified:')) {
            fm = fm.replace(/last_modified: .*/, `last_modified: ${modifiedDate}`);
        } else {
            fm += `\nlast_modified: ${modifiedDate}`;
        }
        content = content.replace(frontmatterRegex, `---\n${fm}\n---\n`);
    } else {
        // Add new frontmatter
        content = `---\n${newFrontmatter}\n---\n\n${content}`;
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath} with dates: Created ${createdDate}, Modified ${modifiedDate}`);
}

files.forEach(updateFile);
