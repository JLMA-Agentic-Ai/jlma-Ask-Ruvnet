const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ruv's key repositories with command examples
const REPOS = [
    {
        url: 'https://github.com/ruvnet/claude-flow',
        name: 'claude-flow',
        focus: 'Claude API workflows and agent coordination'
    },
    {
        url: 'https://github.com/ruvnet/ruvector',
        name: 'ruvector',
        focus: 'Vector/graph hybrid database for semantic search'
    },
    {
        url: 'https://github.com/ruvnet/agentic-flow',
        name: 'agentic-flow',
        focus: 'Agentic reasoning and multi-agent systems'
    }
];

const CLONE_DIR = path.resolve(__dirname, '../../data_ingestion_github');
const OUTPUT_FILE = path.resolve(__dirname, 'github_commands.json');

async function cloneAndExtractCommands() {
    console.log('📦 GitHub Repo Command Extractor');
    console.log('='.repeat(80));
    console.log('');

    if (!fs.existsSync(CLONE_DIR)) {
        fs.mkdirSync(CLONE_DIR, { recursive: true });
    }

    const commandEntries = [];

    for (const repo of REPOS) {
        console.log(`\n🔄 Processing: ${repo.name}`);
        console.log(`   URL: ${repo.url}`);

        const repoPath = path.join(CLONE_DIR, repo.name);

        try {
            // Clone or pull
            if (fs.existsSync(repoPath)) {
                console.log(`   📥 Pulling latest changes...`);
                execSync(`cd "${repoPath}" && git pull`, { stdio: 'pipe' });
            } else {
                console.log(`   📥 Cloning repository...`);
                execSync(`git clone ${repo.url} "${repoPath}"`, { stdio: 'pipe' });
            }

            // Extract commands from README
            const readmePath = path.join(repoPath, 'README.md');
            if (fs.existsSync(readmePath)) {
                const readme = fs.readFileSync(readmePath, 'utf8');

                // Extract code blocks
                const codeBlocks = readme.match(/```[\s\S]*?```/g) || [];
                const commands = [];

                for (const block of codeBlocks) {
                    const code = block.replace(/```[a-z]*\n?/g, '').trim();

                    // Look for installation, setup, usage commands
                    const lines = code.split('\n');
                    for (const line of lines) {
                        if (line.match(/^(npm|node|git|docker|curl|python|pip|cd|export)/i) ||
                            line.includes('install') ||
                            line.includes('import') ||
                            line.includes('new ')) {
                            commands.push(line.trim());
                        }
                    }
                }

                // Extract package.json scripts
                const packagePath = path.join(repoPath, 'package.json');
                if (fs.existsSync(packagePath)) {
                    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    if (pkg.scripts) {
                        Object.entries(pkg.scripts).forEach(([name, cmd]) => {
                            commands.push(`npm run ${name}  # ${cmd}`);
                        });
                    }
                }

                // Create knowledge entry
                const entry = {
                    content: `GitHub Repository: ${repo.name}

${repo.focus}

Installation & Setup Commands:
${commands.slice(0, 20).map((cmd, i) => `${i + 1}. ${cmd}`).join('\n')}

Repository: ${repo.url}
README: ${repo.url}/blob/main/README.md`,
                    metadata: {
                        source: `github_${repo.name}`,
                        type: 'github_commands',
                        repo_url: repo.url,
                        commands_count: commands.length,
                        focus: repo.focus
                    }
                };

                commandEntries.push(entry);
                console.log(`   ✅ Extracted ${commands.length} commands`);

            } else {
                console.log(`   ⚠️  No README found`);
            }

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    // Save
    fs.writeFileSync(OUTPUT_FILE,
        commandEntries.map(e => JSON.stringify(e)).join('\n')
    );

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Extracted commands from ${commandEntries.length} repositories`);
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log('='.repeat(80));
}

cloneAndExtractCommands().catch(console.error);
