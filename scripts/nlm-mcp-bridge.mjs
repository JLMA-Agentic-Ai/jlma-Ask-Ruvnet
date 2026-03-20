#!/usr/bin/env node
/**
 * nlm-mcp-bridge.mjs — Bridge to call NLM MCP server tools from scripts
 *
 * Since NLM CLI v0.4.9 removed `studio create`, this bridge spawns the
 * MCP server process and sends JSON-RPC tool calls directly.
 *
 * Usage:
 *   node scripts/nlm-mcp-bridge.mjs studio_create \
 *     --notebook_id "abc" --artifact_type "audio" --confirm true \
 *     --focus_prompt "Your focus text"
 *
 *   node scripts/nlm-mcp-bridge.mjs studio_status \
 *     --notebook_id "abc"
 *
 * Updated: 2026-03-19 | Version 1.0.0
 */

import { spawn } from 'child_process';

const NLM_CMD = process.env.NLM_MCP_CMD || 'notebooklm-mcp';

// Parse CLI args
const toolName = process.argv[2];
if (!toolName) {
  console.error('Usage: nlm-mcp-bridge.mjs <tool_name> --param value ...');
  process.exit(1);
}

const params = {};
for (let i = 3; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, '');
  let val = process.argv[i + 1];
  if (val === 'true') val = true;
  else if (val === 'false') val = false;
  else if (/^\d+$/.test(val)) val = parseInt(val);
  params[key] = val;
}

// Spawn MCP server as stdio process
const server = spawn(NLM_CMD, [], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env },
});

let stdout = '';
let stderr = '';
server.stdout.on('data', d => { stdout += d.toString(); });
server.stderr.on('data', d => { stderr += d.toString(); });

// Send initialize
const initMsg = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'nlm-mcp-bridge', version: '1.0.0' }
  }
}) + '\n';

server.stdin.write(initMsg);

// Wait for init response, then send tool call
setTimeout(() => {
  const toolMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: params
    }
  }) + '\n';

  server.stdin.write(toolMsg);

  // Wait for response
  setTimeout(() => {
    // Parse the last JSON-RPC response
    const lines = stdout.split('\n').filter(l => l.trim());
    for (const line of lines.reverse()) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 2) {
          if (parsed.result) {
            // Extract text content from MCP response
            const content = parsed.result.content;
            if (Array.isArray(content)) {
              const text = content.find(c => c.type === 'text');
              if (text) {
                console.log(text.text);
              } else {
                console.log(JSON.stringify(parsed.result));
              }
            } else {
              console.log(JSON.stringify(parsed.result));
            }
          } else if (parsed.error) {
            console.error('MCP Error:', JSON.stringify(parsed.error));
            process.exit(1);
          }
          break;
        }
      } catch {}
    }
    server.kill();
    process.exit(0);
  }, 15000);
}, 3000);

// Timeout
setTimeout(() => {
  console.error('Timeout waiting for MCP response');
  server.kill();
  process.exit(2);
}, 30000);
