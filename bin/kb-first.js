#!/usr/bin/env node

/**
 * RuvNet KB-First Application Builder CLI
 *
 * Build intelligent applications on expert knowledge bases.
 *
 * Commands:
 *   init     - Initialize KB-First structure in current project
 *   score    - Calculate KB-First compliance score
 *   verify   - Run verification checks
 *   hooks    - Manage KB-First hooks
 *   status   - Show KB-First project status
 *   phase    - Run a specific build phase
 *
 * Usage:
 *   npx ruvnet-kb-first init
 *   npx kb-first score
 *   kb-first verify --phase=8
 */

import { program } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

// Import commands
import { initCommand } from '../src/commands/init.js';
import { scoreCommand } from '../src/commands/score.js';
import { verifyCommand } from '../src/commands/verify.js';
import { hooksCommand } from '../src/commands/hooks.js';
import { statusCommand } from '../src/commands/status.js';
import { phaseCommand } from '../src/commands/phase.js';

// ASCII Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('RuvNet KB-First Application Builder')}                        ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Build intelligent applications on expert knowledge')}           ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════════╝')}
`;

program
  .name('kb-first')
  .description('KB-First Application Builder - Build on expert knowledge')
  .version(packageJson.version)
  .addHelpText('beforeAll', banner);

// Init command
program
  .command('init')
  .description('Initialize KB-First structure in current project')
  .option('-f, --force', 'Overwrite existing configuration')
  .option('-t, --template <type>', 'Template type (basic, api, fullstack)', 'basic')
  .option('--no-hooks', 'Skip hook installation')
  .option('--kb <schema>', 'Connect to existing KB schema (e.g., ask_ruvnet)')
  .option('--kb-host <host>', 'KB database host', 'localhost')
  .option('--kb-port <port>', 'KB database port', '5435')
  .action(initCommand);

// Score command
program
  .command('score')
  .description('Calculate KB-First compliance score')
  .option('-d, --detailed', 'Show detailed breakdown')
  .option('-j, --json', 'Output as JSON')
  .option('--phase <number>', 'Score specific phase only')
  .action(scoreCommand);

// Verify command
program
  .command('verify')
  .description('Run KB-First verification checks')
  .option('-p, --phase <number>', 'Verify specific phase')
  .option('-a, --all', 'Run all verification scripts')
  .option('-v, --verbose', 'Verbose output')
  .action(verifyCommand);

// Hooks command
program
  .command('hooks')
  .description('Manage KB-First hooks')
  .option('--install', 'Install hooks to project')
  .option('--verify', 'Verify hook installation')
  .option('--train', 'Pre-train hooks with KB patterns')
  .option('--status', 'Show hook status')
  .action(hooksCommand);

// Status command
program
  .command('status')
  .description('Show KB-First project status')
  .option('-d, --detailed', 'Show detailed status')
  .action(statusCommand);

// Phase command
program
  .command('phase <number>')
  .description('Run a specific build phase (0-11)')
  .option('-s, --sub <number>', 'Run specific sub-phase')
  .option('--skip-gate', 'Skip quality gate (not recommended)')
  .action(phaseCommand);

// MCP server command
program
  .command('mcp')
  .alias('mcp-server')
  .description('Start MCP server for Claude Code integration')
  .action(async () => {
    // Fork to the dedicated MCP server
    const { spawn } = await import('child_process');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const mcpServer = join(__dirname, 'mcp-server.js');

    const child = spawn('node', [mcpServer], {
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      console.error('Failed to start MCP server:', err);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  });

// Show dashboard if no command provided (before parsing)
if (!process.argv.slice(2).length) {
  const { dashboardCommand } = await import('../src/commands/dashboard.js');
  await dashboardCommand();
} else {
  // Parse arguments
  program.parse();
}
