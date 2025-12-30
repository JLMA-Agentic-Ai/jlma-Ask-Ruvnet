Updated: 2025-12-30 10:00:00 EST | Version 1.0.0
Created: 2025-12-30 10:00:00 EST

# RuvNet KB Visual

Build interactive Knowledge Universe visualization for your knowledge base.

## What This Does

1. **Reads KB data** from ruvector-postgres or local .ruvector storage
2. **Generates interactive 3D visualization** showing knowledge hierarchy
3. **Creates navigable tree structure** - click to expand/collapse
4. **Takes Playwright screenshots** for documentation/sharing
5. **Auto-updates** when KB changes (via kb:ingest hook)

## Usage

```bash
# Build the visualization
node scripts/build-kb-universe.js

# Build with screenshots
node scripts/build-kb-universe.js --screenshot

# View the result
open public/knowledge-universe.html

# Or serve locally
npx serve public
```

## Output Files

After running, you'll have:

```
public/
├── kb-universe-data.json      # KB hierarchy in JSON
├── knowledge-universe.html    # Interactive visualization
├── kb-universe-overview.png   # Screenshot (if --screenshot)
├── kb-universe-expanded.png   # Screenshot (if --screenshot)
└── kb-universe-detail.png     # Screenshot (if --screenshot)
```

## Visualization Features

- **Central node**: Project name with "Knowledge Universe"
- **Click to expand**: Navigate into categories and subcategories
- **Breadcrumb navigation**: Go back to any level
- **Search**: Find specific knowledge items
- **Info panel**: View details of any item
- **Star field background**: Beautiful 3D space theme
- **Glow effects**: Nodes have radial glow matching their category color

## Integration with KB Workflow

### Automatic Build on Ingest

Add to your `package.json` scripts:

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

## Data Structure

The generated `kb-universe-data.json` follows this structure:

```json
{
  "id": "root",
  "name": "Project Name",
  "color": "#64b5f6",
  "description": "Project description",
  "children": [
    {
      "id": "cat_category_name",
      "name": "Category Name",
      "color": "#ef4444",
      "count": 42,
      "children": [
        {
          "id": "item_123",
          "name": "Item Title",
          "description": "Item content preview...",
          "source": "source-file.md"
        }
      ]
    }
  ],
  "metadata": {
    "totalItems": 150,
    "categories": 8,
    "generatedAt": "2025-12-30T15:00:00.000Z"
  }
}
```

## Customization

### Colors

Edit `scripts/kb-universe-data.js` to change category colors:

```javascript
const CATEGORY_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#22c55e', // green
    // ... add more
];
```

### Template Styling

Edit `public/kb-universe-template.html` CSS to customize:
- Background gradients
- Font families
- Node sizes
- Animation speeds

## Why This Matters

**Nobody understands how to see or visualize a vector knowledge base.**

This visualization:
- Shows users exactly what's in their KB
- Demonstrates the hierarchical structure
- Makes semantic relationships visible
- Provides a "wow factor" for stakeholders
- Validates that KB ingestion worked correctly

## Files to Copy

To add this capability to a new project:

1. Copy `scripts/kb-universe-data.js`
2. Copy `scripts/build-kb-universe.js`
3. Copy `scripts/kb-universe-screenshot.js`
4. Copy `public/kb-universe-template.html`
5. Add npm scripts to `package.json`

Or run `/ruvnet-stack` which includes all KB visualization tools.
