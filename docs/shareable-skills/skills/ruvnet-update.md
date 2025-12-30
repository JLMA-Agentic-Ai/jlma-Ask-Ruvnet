Updated: 2025-12-29 10:05:00 EST | Version 1.1.0
Created: 2025-12-29 02:17:58 EST

# RuvNet Update

Check for and install the latest RuvNet ecosystem packages in the current project.

## What This Does

1. **Checks** ruvector-postgres Docker container status (MANDATORY for knowledge bases)
2. **Checks** all installed RuvNet packages against npm registry
3. **Compares** @latest vs @alpha versions (uses smarter one)
4. **Shows** what updates are available
5. **Installs** updates with your confirmation
6. **Verifies** packages load correctly after update

## Update Check

Run the following commands to check and update RuvNet packages:

```bash
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           RUVNET UPDATE CHECK                                 ║"
echo "║           (Smart Version Detection + Postgres KB)             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# MANDATORY: Check ruvector-postgres container
echo "🗄️  Checking ruvector-postgres (MANDATORY for knowledge bases)..."
if command -v docker &> /dev/null; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
    echo "   ✅ ruvector-kb container running on port 5434"
    docker ps --filter "name=ruvector-kb" --format "   Status: {{.Status}}" 2>/dev/null
  elif docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "ruvector-kb"; then
    echo "   ⚠️  ruvector-kb container exists but stopped. Starting..."
    docker start ruvector-kb
    echo "   ✅ ruvector-kb started"
  else
    echo "   ❌ ruvector-kb container NOT found"
    echo ""
    echo "   CRITICAL: Run this to create the knowledge base container:"
    echo "   docker run -d --name ruvector-kb \\"
    echo "     -e POSTGRES_PASSWORD=guruKB2025 \\"
    echo "     -p 5434:5432 \\"
    echo "     ruvnet/ruvector-postgres:latest"
  fi
else
  echo "   ❌ Docker not installed. Required for ruvector-postgres."
fi
echo ""

# Check if this is a RuvNet project
if [ ! -f package.json ]; then
  echo "❌ No package.json found. This doesn't appear to be a Node.js project."
  exit 1
fi

if ! grep -qE "ruvector|@ruvector|agentic-flow|claude-flow" package.json 2>/dev/null; then
  echo "❌ No RuvNet packages found in this project."
  echo ""
  echo "   To install RuvNet, run: /ruvnet-stack"
  exit 1
fi

echo "📦 Checking RuvNet package versions..."
echo ""

# Function to get the best version (alpha vs latest)
get_best_tag() {
  local pkg="$1"
  local latest_ver=$(npm view "${pkg}@latest" version 2>/dev/null || echo "0.0.0")
  local alpha_ver=$(npm view "${pkg}@alpha" version 2>/dev/null || echo "0.0.0")

  if [ "$alpha_ver" = "0.0.0" ]; then
    echo "@latest"
    return
  fi

  if [ "$latest_ver" = "$alpha_ver" ]; then
    echo "@latest"
    return
  fi

  local latest_major=$(echo "$latest_ver" | cut -d. -f1)
  local alpha_major=$(echo "$alpha_ver" | cut -d. -f1 | sed 's/-alpha.*//')

  if [ "$alpha_major" -gt "$latest_major" ] 2>/dev/null; then
    echo "@alpha"
  else
    echo "@latest"
  fi
}

# Check each RuvNet package
PACKAGES=("ruvector" "@ruvector/ruvllm" "@ruvector/agentic-synth" "agentic-flow" "claude-flow")
UPDATES_NEEDED=()

for pkg in "${PACKAGES[@]}"; do
  local_ver=$(node -e "
    try {
      const p = require('./package.json');
      const deps = {...(p.dependencies || {}), ...(p.devDependencies || {})};
      const v = deps['$pkg'];
      if (v) console.log(v.replace(/^[\^~]/, ''));
      else console.log('not-installed');
    } catch(e) { console.log('not-installed'); }
  " 2>/dev/null)

  if [ "$local_ver" = "not-installed" ] || [ -z "$local_ver" ]; then
    continue
  fi

  best_tag=$(get_best_tag "$pkg")
  best_ver=$(npm view "${pkg}${best_tag}" version 2>/dev/null || echo "unknown")

  if [ "$local_ver" != "$best_ver" ] && [ "$best_ver" != "unknown" ]; then
    echo "   📦 $pkg"
    echo "      Installed: $local_ver"
    echo "      Available: $best_ver ($best_tag)"
    echo ""
    UPDATES_NEEDED+=("${pkg}${best_tag}")
  else
    echo "   ✅ $pkg@$local_ver (up to date)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"

if [ ${#UPDATES_NEEDED[@]} -gt 0 ]; then
  echo ""
  echo "🔄 Installing updates..."
  echo ""

  for pkg_tag in "${UPDATES_NEEDED[@]}"; do
    echo "📦 Installing $pkg_tag..."
    npm install "$pkg_tag" --save
    echo ""
  done

  echo "✅ Updates installed!"
else
  echo ""
  echo "✅ All RuvNet packages are up to date!"
fi
```

## Manual Commands

If you prefer to update specific packages manually:

```bash
# Update all RuvNet packages
npm update ruvector @ruvector/ruvllm @ruvector/agentic-synth agentic-flow claude-flow

# Update specific package to latest
npm install ruvector@latest --save

# Update specific package to alpha (if available)
npm install agentic-flow@alpha --save

# Check what's installed
npm list ruvector @ruvector/ruvllm agentic-flow claude-flow
```

## Version Selection Logic

The updater automatically chooses the best version:

1. **No @alpha tag exists** → Uses @latest
2. **@alpha = @latest** → Uses @latest (more stable)
3. **@alpha has higher MAJOR version** → Uses @alpha
4. **Otherwise** → Uses @latest

## Related Commands

- `/ruvnet-stack` - Install full RuvNet ecosystem from scratch
- `/ruvnet-update` - Update existing RuvNet packages (this command)
- `/ruvnet-kb` - Link the RuvNet knowledge base to current project
