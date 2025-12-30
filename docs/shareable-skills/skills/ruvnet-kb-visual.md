Updated: 2025-12-30 15:30:00 EST | Version 2.0.0
Created: 2025-12-30 10:00:00 EST

# RuvNet KB Visual

Build interactive Knowledge Universe visualization with quality scoring for any knowledge base.

## Architecture Decision: Hybrid Skill + npm Scripts

**This skill uses a hybrid approach for maximum effectiveness:**

1. **npm scripts** = Deterministic execution engine
   - `kb:visual` - Build visualization
   - `kb:visual:screenshot` - Build with Playwright screenshots
   - Works in any repo with copied scripts
   - Portable, testable, reliable

2. **Skill file** = AI guidance layer
   - Tells Claude WHEN to use the scripts
   - Provides VERIFICATION steps
   - Documents PARAMETERS and options
   - Enables INTELLIGENT workflow decisions

**Why not just a command?** Commands execute but don't adapt. Skills guide Claude to make smart decisions based on context.

## What This Does

1. **Reads KB data** from ruvector-postgres or local .ruvector storage
2. **Generates interactive 3D visualization** with Bricksmith-inspired navigation
3. **Calculates KB Quality Score** (1-100) across 5 dimensions
4. **Provides enhancement recommendations** with actionable button
5. **Takes Playwright screenshots** for documentation/sharing
6. **Auto-updates** when KB changes (via kb:ingest hook)

## KB Scoring System (NEW in v2.0)

The visualization includes a comprehensive quality score:

| Dimension | Weight | Measures | Optimal |
|-----------|--------|----------|---------|
| **Coverage** | 25% | Total knowledge items | 500+ items |
| **Depth** | 15% | Category organization | 8-15 categories |
| **Balance** | 15% | Distribution evenness | Low variance |
| **Quality** | 30% | Content richness | 500+ chars avg |
| **Sources** | 15% | Source diversity | 20+ sources |

### Grading Scale (Standard Academic)

| Score | Grade | Assessment |
|-------|-------|------------|
| 97-100 | A+ | Exceptional |
| 93-96 | A | Excellent |
| 90-92 | A- | Very Good |
| 87-89 | B+ | Good |
| 83-86 | B | Above Average |
| 80-82 | B- | Satisfactory |
| 77-79 | C+ | Fair |
| 73-76 | C | Adequate |
| 70-72 | C- | Below Average |
| 67-69 | D+ | Poor |
| 63-66 | D | Very Poor |
| 60-62 | D- | Minimal |
| <60 | F | Failing |

**Target: 95+ for production KBs**

## Usage

### Build and Verify (MANDATORY WORKFLOW)

```bash
# Step 1: Build the visualization
npm run kb:visual

# Step 2: VERIFY with Playwright (CRITICAL!)
node scripts/test-kb-universe.js

# Step 3: View the result
open public/knowledge-universe.html

# Optional: Build with screenshots
npm run kb:visual:screenshot
```

**NEVER skip verification.** Always run the test script before reporting success.

### Quick Commands

```bash
# Build only
npm run kb:visual

# Build + screenshots
npm run kb:visual:screenshot

# Test visualization
node scripts/test-kb-universe.js

# Test navigation
node scripts/test-kb-navigation.js

# Serve locally
npx serve public
```

## Output Files

```
public/
├── kb-universe-data.json      # KB hierarchy with scores (JSON)
├── knowledge-universe.html    # Interactive visualization (HTML)
├── kb-universe-test.png       # Verification screenshot
├── kb-universe-overview.png   # Screenshot (if --screenshot)
└── kb-nav-*.png               # Navigation screenshots
```

## Visualization Features

### Core Features
- **Central node**: Repo name (always from folder name, not package.json)
- **Bricksmith navigation**: All categories stay visible when drilling down
- **Categories sidebar**: Left panel listing all categories with counts
- **Info panel**: Right panel with details and clickable sub-items

### Score Dashboard
- **Overall score**: 1-100 with letter grade
- **Dimension bars**: Visual indicators for each dimension
- **Enhancement recommendations**: Priority-ranked action items
- **"Enhance KB" button**: Copies improvement plan to clipboard

### Visual Design
- **Star field background**: Animated twinkling stars
- **Glow effects**: Radial glow matching category colors
- **Smooth animations**: Easing for all transitions
- **Responsive**: Works on all screen sizes

## Integration with KB Workflow

### Automatic Build on Ingest (Already Configured)

```json
{
  "scripts": {
    "kb:ingest": "node scripts/kb-architecture-sync.js --ingest && npm run kb:visual",
    "kb:visual": "node scripts/build-kb-universe.js",
    "kb:visual:screenshot": "node scripts/build-kb-universe.js --screenshot"
  }
}
```

### Prerequisites for Screenshots

```bash
npm install playwright --save-dev
npx playwright install chromium
```

## Name Source (CRITICAL)

**The KB name ALWAYS comes from the repository folder name, NOT package.json.**

This is enforced in `kb-universe-data.js`:

```javascript
function getProjectInfo() {
    // Get the repo/folder name - this is the authoritative name
    const repoName = path.basename(process.cwd());
    // ...
    return {
        name: repoName,  // ALWAYS use repo/folder name
        version: version,
        description: description
    };
}
```

## Improving Your KB Score

### Coverage (48/100 → 90+)
- Add more documentation, FAQs, reference materials
- Include API documentation, guides, tutorials
- Target: 500+ knowledge items

### Balance (29/100 → 80+)
- Split large categories into smaller ones
- Expand underpopulated categories
- Target: Even distribution across categories

### Sources (50/100 → 80+)
- Add content from diverse sources
- Include APIs, guides, FAQs, tutorials
- Target: 20+ unique sources

## Files to Copy for New Projects

Copy these to add KB visualization to any project:

```
scripts/
├── kb-universe-data.js          # Data generator with scoring
├── build-kb-universe.js         # Build orchestrator
├── kb-universe-screenshot.js    # Playwright screenshots
├── test-kb-universe.js          # Verification test
└── test-kb-navigation.js        # Navigation test

public/
└── kb-universe-template.html    # Visualization template
```

Then add npm scripts:

```bash
npm pkg set scripts.kb:visual="node scripts/build-kb-universe.js"
npm pkg set scripts.kb:visual:screenshot="node scripts/build-kb-universe.js --screenshot"
```

## Troubleshooting

### "Canvas element not found"
- Check that template IDs match test expectations
- Rebuild: `npm run kb:visual`

### "Score shows wrong grade"
- Updated grading scale in v2.0 uses standard academic scale
- 67 = D+ (not B-)

### "Name shows wrong"
- Verify folder name is correct
- `kb-universe-data.js` uses `path.basename(process.cwd())`

### "Categories disappear when drilling"
- Use v3.0.0 template with Bricksmith navigation
- Rebuild: `npm run kb:visual`

### "Screenshots fail"
```bash
npm install playwright --save-dev
npx playwright install chromium
```

## Why This Matters

**Nobody understands how to see or visualize a vector knowledge base.**

This visualization:
- Shows users exactly what's in their KB
- Demonstrates the hierarchical structure
- Quantifies KB quality with actionable metrics
- Makes semantic relationships visible
- Provides a "wow factor" for stakeholders
- Validates that KB ingestion worked correctly
- Guides improvements with specific recommendations

## Version History

- **v2.0.0** (2025-12-30): Added KB scoring, standard grading, Bricksmith navigation
- **v1.0.0** (2025-12-30): Initial release with basic visualization
