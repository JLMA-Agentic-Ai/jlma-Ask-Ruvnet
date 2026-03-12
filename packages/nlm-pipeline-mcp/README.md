# ask-ruvnet-mcp

An MCP server that manages NotebookLM source refresh and studio generation for the Ask-RuvNet ecosystem. It monitors GitHub repositories for changes, syncs sources into NotebookLM, and orchestrates studio artifact creation.

## Quick Start

Add the server to Claude Code:

```bash
claude mcp add ask-ruvnet -- npx ask-ruvnet-mcp
```

Or run directly:

```bash
npx ask-ruvnet-mcp
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NLM_NOTEBOOK_ID` | Yes | — | NotebookLM notebook ID to manage |
| `NLM_BIN_PATH` | No | `nlm` | Path to the `nlm` CLI binary |
| `NLM_ASSETS_DIR` | No | `./assets` | Directory for downloaded studio artifacts |
| `NLM_REGISTRY_PATH` | No | `./nlm-url-registry.json` | Path to the source URL registry JSON |
| `NLM_STATE_PATH` | No | `./.nlm-refresh-state.json` | Path to the auto-managed state file |
| `GITHUB_TOKEN` | No | — | GitHub token for accessing private repositories |

## Tools

| Tool | Description |
|---|---|
| `nlm_refresh_sources` | Check GitHub repos for new commits and refresh stale NotebookLM sources. Supports `--dry-run`, `--force`, and single-source refresh. |
| `nlm_studio_create` | Create a studio artifact: `audio`, `video`, `infographic`, or `slides`. Accepts an optional focus prompt. |
| `nlm_studio_status` | Check generation status for a specific studio or all studios. |
| `nlm_studio_download` | Download a completed studio artifact to the assets directory. |
| `nlm_pipeline_status` | Get pipeline health: last refresh time, pending changes, auth status, and studio counts. |
| `nlm_registry_list` | List all tracked source URLs with sync status, last SHA, and enabled/disabled state. |

## Usage Examples

**Refresh sources (dry run):**

```json
{
  "name": "nlm_refresh_sources",
  "arguments": { "dry_run": true }
}
```

**Create an audio overview with a focus prompt:**

```json
{
  "name": "nlm_studio_create",
  "arguments": { "type": "audio", "focus": "Summarize the latest architecture changes" }
}
```

**Download a completed studio artifact:**

```json
{
  "name": "nlm_studio_download",
  "arguments": { "studio_id": "abc123", "type": "audio" }
}
```

## Prerequisites

1. **Node.js 20+** is required.
2. **notebooklm-cli** must be installed and authenticated:

   ```bash
   npm install -g notebooklm-cli
   nlm login
   ```

3. Set `NLM_NOTEBOOK_ID` to the target notebook before starting the server.

## Protocol

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) over stdio using JSON-RPC 2.0 (protocol version `2024-11-05`).

## License

MIT
