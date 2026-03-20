# Claude Code Hooks Integration

## Automatic KB Enforcement via RuVector Hooks

This guide covers integrating RuVector with Claude Code's hook system for automatic KB-first enforcement.

---

## What Are Hooks?

Claude Code hooks are user-defined commands that execute at specific points:

| Event | When | Use For |
|-------|------|---------|
| `PreToolUse` | Before any tool call | KB check, guidance injection |
| `PostToolUse` | After tool response | Learning, analytics |
| `PermissionRequest` | Permission dialog | Auto-allow/deny |
| `SessionStart` | Session begins | Context restoration |
| `SessionEnd` | Session ends | State persistence |

---

## Quick Setup

### Option 1: RuVector CLI (Recommended)

```bash
# Initialize hooks
npx @ruvector/cli hooks init

# Install to Claude Code
npx @ruvector/cli hooks install

# Verify
cat ~/.claude/settings.json | jq '.hooks'
```

### Option 2: Manual Configuration

Create `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "npx @ruvector/cli hooks pre-query"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "npx @ruvector/cli hooks post-query"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "npx @ruvector/cli hooks session-end"
          }
        ]
      }
    ]
  }
}
```

---

## Hook Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude Code    │────►│  RuVector Hooks  │────►│  Intelligence   │
│  (PreToolUse)   │     │   (pre-query)    │     │     Layer       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
        ┌────────────────────────────────────────────────┘
        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   KB Search     │     │  SONA Learning   │     │  ReasoningBank  │
│   (RuVector)    │     │   (Adaptation)   │     │   (Patterns)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## PreToolUse Hook

### Purpose
- Check KB before any action
- Inject relevant context
- Block if KB consultation required

### Implementation

```python
#!/usr/bin/env python3
"""
RuVector PreToolUse Hook
Runs before every Claude Code tool invocation
"""

import json
import sys
import os

def pre_tool_use():
    # Read hook input from stdin
    input_data = json.load(sys.stdin)
    
    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    
    # Extract query context
    query = extract_query_context(tool_name, tool_input)
    
    if query:
        # Check KB first
        kb_results = search_kb(query)
        
        if kb_results:
            # Inject KB context as guidance
            guidance = format_kb_guidance(kb_results)
            output = {
                "decision": "continue",
                "message": guidance
            }
        else:
            # Log gap
            log_gap(query)
            output = {
                "decision": "continue",
                "message": f"⚠️ No KB content found for: {query[:100]}"
            }
    else:
        output = {"decision": "continue"}
    
    print(json.dumps(output))

def extract_query_context(tool_name, tool_input):
    """Extract searchable query from tool context"""
    if tool_name == 'Bash':
        return tool_input.get('command', '')
    elif tool_name in ('Edit', 'Write'):
        return tool_input.get('file_path', '')
    elif tool_name == 'Search':
        return tool_input.get('query', '')
    return None

def search_kb(query):
    """Search KB via RuVector"""
    import subprocess
    result = subprocess.run(
        ['npx', '@ruvector/cli', 'search', '--query', query, '--limit', '3'],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        return json.loads(result.stdout)
    return []

def format_kb_guidance(results):
    """Format KB results as guidance"""
    lines = ["📚 KB Context:"]
    for r in results[:3]:
        lines.append(f"  • {r['title']} (confidence: {r['confidence']:.2f})")
    return "\n".join(lines)

def log_gap(query):
    """Log query that found no KB results"""
    import subprocess
    subprocess.run([
        'npx', '@ruvector/cli', 'log-gap',
        '--query', query[:500]
    ], capture_output=True)

if __name__ == '__main__':
    pre_tool_use()
```

---

## PostToolUse Hook

### Purpose
- Record tool outcomes
- Trigger SONA learning
- Update analytics

### Implementation

```python
#!/usr/bin/env python3
"""
RuVector PostToolUse Hook
Runs after every Claude Code tool invocation
"""

import json
import sys

def post_tool_use():
    # Read hook input from stdin
    input_data = json.load(sys.stdin)
    
    tool_name = input_data.get('tool_name', '')
    tool_result = input_data.get('tool_result', {})
    success = input_data.get('success', True)
    
    # Record outcome
    record_outcome(tool_name, tool_result, success)
    
    # Trigger SONA learning if successful
    if success:
        trigger_learning(tool_name, tool_result)
    
    # Always continue (PostToolUse doesn't block)
    print(json.dumps({"decision": "continue"}))

def record_outcome(tool_name, tool_result, success):
    """Record tool outcome for analytics"""
    import subprocess
    subprocess.run([
        'npx', '@ruvector/cli', 'record-outcome',
        '--tool', tool_name,
        '--success', str(success).lower()
    ], capture_output=True)

def trigger_learning(tool_name, tool_result):
    """Trigger SONA learning loop"""
    import subprocess
    subprocess.run([
        'npx', '@ruvector/cli', 'sona', 'learn',
        '--tool', tool_name,
        '--outcome', 'positive'
    ], capture_output=True)

if __name__ == '__main__':
    post_tool_use()
```

---

## SessionEnd Hook

### Purpose
- Persist learned patterns
- Save session state
- Export metrics

### Implementation

```python
#!/usr/bin/env python3
"""
RuVector SessionEnd Hook
Runs when Claude Code session ends
"""

import json
import sys
import subprocess

def session_end():
    input_data = json.load(sys.stdin)
    session_id = input_data.get('session_id', 'unknown')
    
    # Checkpoint SONA state
    subprocess.run([
        'npx', '@ruvector/cli', 'sona', 'checkpoint',
        '--session', session_id
    ], capture_output=True)
    
    # Export session metrics
    subprocess.run([
        'npx', '@ruvector/cli', 'metrics', 'export',
        '--session', session_id
    ], capture_output=True)
    
    # Trigger background consolidation
    subprocess.run([
        'npx', '@ruvector/cli', 'sona', 'consolidate'
    ], capture_output=True)
    
    print(json.dumps({"decision": "continue"}))

if __name__ == '__main__':
    session_end()
```

---

## Advanced Configuration

### Matcher Patterns

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "..."}]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{"type": "command", "command": "..."}]
      },
      {
        "matcher": "*",
        "hooks": [{"type": "command", "command": "..."}]
      }
    ]
  }
}
```

### Conditional Hooks

```python
# Only check KB for certain file types
def should_check_kb(file_path):
    kb_extensions = ['.md', '.txt', '.json', '.yaml']
    return any(file_path.endswith(ext) for ext in kb_extensions)
```

### Blocking Hook

```python
# Block tool use if KB requires it
def pre_tool_use_blocking():
    input_data = json.load(sys.stdin)
    
    # Check for critical KB requirements
    if requires_kb_verification(input_data):
        kb_results = search_kb(...)
        if not kb_results or kb_results[0]['confidence'] < 0.8:
            output = {
                "decision": "block",
                "message": "⛔ KB verification required but not satisfied"
            }
            print(json.dumps(output))
            return
    
    print(json.dumps({"decision": "continue"}))
```

---

## PostgreSQL Integration

### With RUVECTOR_POSTGRES_URL

```bash
# Set environment variable
export RUVECTOR_POSTGRES_URL="postgres://user:pass@localhost/ruvector"

# Initialize schema
npx @ruvector/cli hooks init --postgres

# Or manually
psql $RUVECTOR_POSTGRES_URL -f hooks_schema.sql
```

### Hooks Schema

```sql
-- Session tracking
CREATE TABLE hook_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  tool_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  gap_count INTEGER DEFAULT 0
);

-- Tool invocations
CREATE TABLE hook_tool_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  kb_consulted BOOLEAN DEFAULT false,
  kb_results_count INTEGER DEFAULT 0,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX hook_sessions_session_id_idx ON hook_sessions(session_id);
CREATE INDEX hook_tool_invocations_session_idx ON hook_tool_invocations(session_id);
```

---

## Metrics & Analytics

### Built-in Metrics

```bash
# View session metrics
npx @ruvector/cli hooks metrics --session SESSION_ID

# Export to JSON
npx @ruvector/cli hooks metrics --export metrics.json

# View gap report
npx @ruvector/cli hooks gaps --limit 50
```

### Custom Dashboard

```python
# Query hook analytics
import psycopg2

def get_hook_metrics(conn, session_id):
    cursor = conn.cursor()
    
    # Success rate
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
            AVG(latency_ms) as avg_latency
        FROM hook_tool_invocations
        WHERE session_id = %s
    """, (session_id,))
    
    return cursor.fetchone()
```

---

## Troubleshooting

### Hooks Not Firing

```bash
# Check settings file
cat ~/.claude/settings.json | jq '.hooks'

# Verify hook scripts exist
ls -la ~/.claude/hooks/

# Test hook manually
echo '{"tool_name": "Bash", "tool_input": {"command": "ls"}}' | \
  python ~/.claude/hooks/pre_query.py
```

### Permission Issues

```bash
# Make hooks executable
chmod +x ~/.claude/hooks/*.py

# Check npm permissions
npm config get prefix
```

### PostgreSQL Connection

```bash
# Test connection
psql $RUVECTOR_POSTGRES_URL -c "SELECT 1"

# Check schema
psql $RUVECTOR_POSTGRES_URL -c "\dt hook_*"
```

### Slow Hooks

```python
# Add timeout to KB search
import subprocess
result = subprocess.run(
    ['npx', '@ruvector/cli', 'search', '--query', query],
    capture_output=True, text=True,
    timeout=2.0  # 2 second timeout
)
```

---

## Security Considerations

### Input Validation

```python
def sanitize_query(query):
    """Sanitize query before KB search"""
    # Remove potential injection
    query = query.replace(';', '')
    query = query.replace('--', '')
    # Limit length
    return query[:500]
```

### Credential Management

```bash
# Use environment variables, not hardcoded
export RUVECTOR_POSTGRES_URL="postgres://..."

# Or use .env file (not committed)
echo "RUVECTOR_POSTGRES_URL=..." >> ~/.ruvector/.env
```

### Hook Script Validation

- Always review hook scripts before installation
- Use `--dry-run` flag to preview changes
- Validate JSON output format

---

## Best Practices

### 1. Fail Open
```python
# If KB search fails, continue (don't block user)
try:
    results = search_kb(query)
except Exception as e:
    log_error(e)
    results = []  # Continue without KB
```

### 2. Async Where Possible
```python
# Don't block on non-critical operations
import asyncio

async def post_tool_use():
    # Fire and forget for analytics
    asyncio.create_task(record_outcome(...))
    print(json.dumps({"decision": "continue"}))
```

### 3. Cache KB Results
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def search_kb_cached(query):
    return search_kb(query)
```

### 4. Limit Hook Overhead
```python
# Quick check before expensive operations
if len(query) < 3:
    return {"decision": "continue"}  # Skip trivial queries
```

---

*Claude Code Hooks Integration - KB-First v2.9*
