# Phase 4: Visualization

## Purpose

Generate an interactive visualization of the knowledge base for human verification and exploration.

---

## Requirements

- Interactive tree (expandable/collapsible nodes)
- Click node to see full content + expert sources
- Search functionality
- Breadcrumb navigation
- Statistics display
- Responsive design

---

## Implementation Options

### Option 1: React + D3 Tree

```tsx
import { Tree } from 'react-d3-tree';

function KBVisualization({ data }) {
  return (
    <Tree
      data={data}
      orientation="vertical"
      pathFunc="step"
      onNodeClick={(node) => showNodeDetails(node)}
    />
  );
}
```

### Option 2: Three.js 3D Tree

For larger knowledge bases, a 3D visualization provides better navigation:

```typescript
import * as THREE from 'three';

// Create 3D tree with force-directed layout
const nodes = createNodes(kbData);
const edges = createEdges(kbData);

// Add interactivity
scene.on('click', (object) => {
  if (object.type === 'node') {
    showNodePanel(object.data);
  }
});
```

### Option 3: Simple HTML Tree

For quick visualization:

```html
<div class="kb-tree">
  <ul>
    {{#each nodes}}
    <li class="node {{type}}">
      <span class="title" onclick="showDetails('{{id}}')">
        {{title}}
      </span>
      {{#if children}}
      <ul>
        {{#each children}}
        <!-- recursive -->
        {{/each}}
      </ul>
      {{/if}}
    </li>
    {{/each}}
  </ul>
</div>
```

---

## Node Details Panel

When clicking a node, show:

```html
<div class="node-details">
  <h2>{{title}}</h2>
  <div class="path">{{path}}</div>
  
  <div class="content">
    {{content}}
  </div>
  
  <div class="attribution">
    <h4>Source</h4>
    <div class="expert">{{sourceExpert}}</div>
    <a href="{{sourceUrl}}">{{sourceUrl}}</a>
    <div class="confidence">
      Confidence: {{confidence}}%
    </div>
  </div>
  
  <div class="related">
    <h4>Related Nodes</h4>
    {{#each relatedNodes}}
    <a href="#" onclick="navigateTo('{{id}}')">{{title}}</a>
    {{/each}}
  </div>
</div>
```

---

## Search Functionality

```typescript
async function searchKB(query: string) {
  const results = await fetch(`/api/kb/search?q=${encodeURIComponent(query)}`);
  
  // Highlight matching nodes in tree
  highlightNodes(results.map(r => r.id));
  
  // Show results panel
  showSearchResults(results);
}
```

---

## Statistics Display

```html
<div class="kb-stats">
  <div class="stat">
    <span class="value">{{nodeCount}}</span>
    <span class="label">Total Nodes</span>
  </div>
  <div class="stat">
    <span class="value">{{expertCount}}</span>
    <span class="label">Expert Sources</span>
  </div>
  <div class="stat">
    <span class="value">{{avgConfidence}}%</span>
    <span class="label">Avg Confidence</span>
  </div>
  <div class="stat">
    <span class="value">{{depth}}</span>
    <span class="label">Max Depth</span>
  </div>
</div>
```

---

## Quality Gate

- [ ] Full tree renders without errors
- [ ] All nodes expandable/collapsible
- [ ] Click node shows details with sources
- [ ] Search returns relevant results
- [ ] Statistics display correctly
- [ ] Navigation breadcrumbs work

---

**Proceed to Phase 5: Integration Layer**
