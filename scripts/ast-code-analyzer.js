#!/usr/bin/env node
/**
 * AST Code Analyzer - Extract symbols and complexity for KB indexing
 *
 * Uses ruvector 0.1.77+ AST analysis features:
 * - Symbol extraction (functions, classes, variables)
 * - Complexity metrics (cyclomatic, cognitive)
 * - Dependency analysis
 * - JSDoc/TSDoc extraction
 *
 * Usage:
 *   node scripts/ast-code-analyzer.js ./src
 *   node scripts/ast-code-analyzer.js --file ./src/core/RvfStore.js
 *   node scripts/ast-code-analyzer.js --ingest ./src  # Add to KB
 */

const fs = require('fs');
const path = require('path');

// Try to load ruvector AST analysis
let astAnalyze = null;
let RuvectorStore = null;
try {
  const ruvector = require('ruvector');
  astAnalyze = ruvector.astAnalyze || ruvector.ast?.analyze;
  RuvectorStore = ruvector.RuvectorStore;
} catch (e) {
  console.error('Error: ruvector not installed. Run: npm install ruvector@latest');
  process.exit(1);
}

// Supported file extensions
const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']);

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  file: null,
  ingest: false,
  verbose: false,
  output: null
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    flags.file = args[++i];
  } else if (args[i] === '--ingest') {
    flags.ingest = true;
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    flags.verbose = true;
  } else if (args[i] === '--output' && args[i + 1]) {
    flags.output = args[++i];
  } else if (!args[i].startsWith('-')) {
    flags.file = args[i];
  }
}

if (!flags.file) {
  console.log(`
AST Code Analyzer - Extract symbols and complexity for KB indexing

Usage:
  node scripts/ast-code-analyzer.js <path>           Analyze file or directory
  node scripts/ast-code-analyzer.js --ingest <path>  Analyze and add to KB
  node scripts/ast-code-analyzer.js --verbose <path> Show detailed output

Examples:
  node scripts/ast-code-analyzer.js ./src
  node scripts/ast-code-analyzer.js --file ./src/core/RvfStore.js
  node scripts/ast-code-analyzer.js --ingest ./src --output analysis.json
`);
  process.exit(0);
}

/**
 * Analyze a single code file
 */
async function analyzeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!CODE_EXTENSIONS.has(ext)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);

  // Use ruvector AST analysis if available
  if (astAnalyze) {
    try {
      const analysis = await astAnalyze(content, {
        language: ext.includes('ts') ? 'typescript' : 'javascript',
        extractSymbols: true,
        extractComplexity: true,
        extractDocs: true,
        extractDependencies: true
      });

      return {
        file: filePath,
        filename,
        ...analysis
      };
    } catch (e) {
      if (flags.verbose) {
        console.warn(`  Warning: AST analysis failed for ${filename}: ${e.message}`);
      }
    }
  }

  // Fallback: basic regex-based extraction
  return extractBasicSymbols(content, filePath, filename);
}

/**
 * Basic regex-based symbol extraction (fallback)
 */
function extractBasicSymbols(content, filePath, filename) {
  const symbols = {
    functions: [],
    classes: [],
    exports: [],
    imports: []
  };

  // Extract function declarations
  const funcRegex = /(?:async\s+)?function\s+(\w+)\s*\(/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    symbols.functions.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length,
      type: 'function'
    });
  }

  // Extract arrow functions assigned to variables
  const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
  while ((match = arrowRegex.exec(content)) !== null) {
    symbols.functions.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length,
      type: 'arrow'
    });
  }

  // Extract class declarations
  const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g;
  while ((match = classRegex.exec(content)) !== null) {
    symbols.classes.push({
      name: match[1],
      extends: match[2] || null,
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Extract exports
  const exportRegex = /(?:module\.)?exports(?:\.(\w+))?\s*=/g;
  while ((match = exportRegex.exec(content)) !== null) {
    symbols.exports.push(match[1] || 'default');
  }

  // Extract ES6 exports
  const es6ExportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)/g;
  while ((match = es6ExportRegex.exec(content)) !== null) {
    symbols.exports.push(match[1]);
  }

  // Extract imports
  const importRegex = /(?:require\(['"]([^'"]+)['"]\)|from\s+['"]([^'"]+)['"])/g;
  while ((match = importRegex.exec(content)) !== null) {
    symbols.imports.push(match[1] || match[2]);
  }

  // Calculate basic complexity (lines, control flow)
  const lines = content.split('\n').length;
  const ifCount = (content.match(/\bif\s*\(/g) || []).length;
  const forCount = (content.match(/\bfor\s*\(/g) || []).length;
  const whileCount = (content.match(/\bwhile\s*\(/g) || []).length;
  const switchCount = (content.match(/\bswitch\s*\(/g) || []).length;
  const catchCount = (content.match(/\bcatch\s*\(/g) || []).length;

  const complexity = {
    lines,
    cyclomaticEstimate: 1 + ifCount + forCount + whileCount + switchCount + catchCount,
    controlFlow: { if: ifCount, for: forCount, while: whileCount, switch: switchCount, catch: catchCount }
  };

  // Extract JSDoc comments
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  const docs = [];
  while ((match = jsdocRegex.exec(content)) !== null) {
    docs.push({
      line: content.substring(0, match.index).split('\n').length,
      content: match[0].substring(0, 200)  // First 200 chars
    });
  }

  return {
    file: filePath,
    filename,
    symbols,
    complexity,
    docs,
    method: 'regex-fallback'
  };
}

/**
 * Recursively find all code files in a directory
 */
function findCodeFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item)) {
        findCodeFiles(fullPath, files);
      }
    } else if (stat.isFile() && CODE_EXTENSIONS.has(path.extname(item).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate KB-ready documentation from analysis
 */
function generateKBEntry(analysis) {
  const { filename, symbols, complexity, docs } = analysis;

  // Create a structured content for the KB
  let content = `# ${filename}\n\n`;

  // Functions section
  if (symbols.functions.length > 0) {
    content += `## Functions (${symbols.functions.length})\n`;
    for (const fn of symbols.functions) {
      content += `- \`${fn.name}\` (line ${fn.line})\n`;
    }
    content += '\n';
  }

  // Classes section
  if (symbols.classes.length > 0) {
    content += `## Classes (${symbols.classes.length})\n`;
    for (const cls of symbols.classes) {
      content += `- \`${cls.name}\`${cls.extends ? ` extends ${cls.extends}` : ''} (line ${cls.line})\n`;
    }
    content += '\n';
  }

  // Complexity section
  content += `## Metrics\n`;
  content += `- Lines: ${complexity.lines}\n`;
  content += `- Cyclomatic Complexity: ${complexity.cyclomaticEstimate}\n`;
  content += '\n';

  // Dependencies section
  if (symbols.imports && symbols.imports.length > 0) {
    content += `## Dependencies\n`;
    for (const imp of symbols.imports.slice(0, 10)) {
      content += `- ${imp}\n`;
    }
    content += '\n';
  }

  return {
    id: `code-${filename.replace(/[^a-z0-9]/gi, '-')}`,
    content,
    metadata: {
      type: 'code-analysis',
      source: analysis.file,
      functions: symbols.functions.map(f => f.name),
      classes: symbols.classes.map(c => c.name),
      complexity: complexity.cyclomaticEstimate,
      lines: complexity.lines
    }
  };
}

/**
 * Ingest analysis results into KB
 */
async function ingestToKB(analyses) {
  console.log('\n Ingesting to Knowledge Base...');

  const store = new RuvectorStore({
    dimension: 384,  // ONNX embeddings
    persistence: {
      enabled: true,
      path: path.join(process.cwd(), '.ruvector/knowledge-base')
    }
  });

  try {
    await store.load();
  } catch {
    // New KB
  }

  let ingested = 0;
  for (const analysis of analyses) {
    if (!analysis) continue;

    const entry = generateKBEntry(analysis);

    // Generate embedding (uses ONNX if available)
    try {
      await store.insert({
        id: entry.id,
        content: entry.content,
        metadata: entry.metadata
      });
      ingested++;
    } catch (e) {
      console.warn(`  Warning: Failed to ingest ${entry.id}: ${e.message}`);
    }
  }

  await store.save();
  console.log(`  Ingested ${ingested} code analysis entries to KB`);
}

/**
 * Main runner
 */
async function main() {
  console.log('===================================================================');
  console.log('  AST CODE ANALYZER - Symbol extraction + complexity metrics');
  console.log('===================================================================\n');

  const targetPath = flags.file;
  const stat = fs.statSync(targetPath);

  let files = [];
  if (stat.isDirectory()) {
    files = findCodeFiles(targetPath);
    console.log(`Found ${files.length} code files in ${targetPath}\n`);
  } else {
    files = [targetPath];
  }

  if (files.length === 0) {
    console.log('No code files found.');
    return;
  }

  // Analyze all files
  const analyses = [];
  let totalSymbols = 0;
  let totalComplexity = 0;

  console.log('Analyzing code files...\n');

  for (const file of files) {
    const analysis = await analyzeFile(file);
    if (analysis) {
      analyses.push(analysis);
      totalSymbols += (analysis.symbols.functions.length + analysis.symbols.classes.length);
      totalComplexity += analysis.complexity.cyclomaticEstimate;

      if (flags.verbose) {
        console.log(`  ${analysis.filename}`);
        console.log(`    Functions: ${analysis.symbols.functions.length}`);
        console.log(`    Classes: ${analysis.symbols.classes.length}`);
        console.log(`    Complexity: ${analysis.complexity.cyclomaticEstimate}`);
        console.log('');
      }
    }
  }

  // Summary
  console.log('===================================================================');
  console.log('  ANALYSIS SUMMARY');
  console.log('===================================================================\n');
  console.log(`  Files analyzed:     ${analyses.length}`);
  console.log(`  Total symbols:      ${totalSymbols}`);
  console.log(`  Avg complexity:     ${(totalComplexity / analyses.length).toFixed(1)}`);
  console.log(`  AST method:         ${analyses[0]?.method === 'regex-fallback' ? 'regex (fallback)' : 'ruvector AST'}`);
  console.log('');

  // Output to file if requested
  if (flags.output) {
    fs.writeFileSync(flags.output, JSON.stringify(analyses, null, 2));
    console.log(`  Results saved to: ${flags.output}\n`);
  }

  // Ingest to KB if requested
  if (flags.ingest) {
    await ingestToKB(analyses);
  }

  console.log('===================================================================');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
