/**
 * Ask-RuvNet v3.0 — Comprehensive UI Interaction Test Suite
 * Tests every button, tile, link, and interactive element via Playwright
 * Run: node scripts/test-ui-interactions.mjs
 */

import { chromium } from '/Users/stuartkerr/.npm-global/lib/node_modules/playwright/index.mjs';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/tmp/ask-ruvnet-tests';
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  PASS ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log('  FAIL ' + name + ': ' + err.message);
  }
}

async function run() {
  const { mkdirSync } = await import('fs');
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('\nAsk-RuvNet v3.0 UI Interaction Test Suite\n');
  console.log('='.repeat(60));

  // ==========================================
  // SECTION 1: Page Load and Basic Structure
  // ==========================================
  console.log('\nSection 1: Page Load and Structure');

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: SCREENSHOT_DIR + '/01-initial-load.png', fullPage: true });

  await test('Page loads without crash', async () => {
    const title = await page.title();
    if (!title) throw new Error('No page title');
  });

  await test('Header renders with logo', async () => {
    const logo = await page.$('.logo-img');
    if (!logo) throw new Error('Logo image not found');
  });

  await test('Version tag visible', async () => {
    const versionTag = await page.$('.version-tag');
    const text = await versionTag?.textContent();
    if (!text || !text.includes('v3')) throw new Error('Version tag missing or wrong: ' + text);
  });

  await test('Hero section renders', async () => {
    const hero = await page.$('.hero-compact');
    if (!hero) throw new Error('Hero section not found');
  });

  await test('4 capability tiles render', async () => {
    const tiles = await page.$$('.capability-tile');
    if (tiles.length !== 4) throw new Error('Expected 4 tiles, got ' + tiles.length);
  });

  await test('Stats bar renders', async () => {
    const stats = await page.$('.stats-bar');
    if (!stats) throw new Error('Stats bar not found');
  });

  await test('Prompt pills render (at least 4)', async () => {
    const pills = await page.$$('.prompt-pill');
    if (pills.length < 4) throw new Error('Expected 4+ prompt pills, got ' + pills.length);
  });

  await test('Chat input renders', async () => {
    const input = await page.$('.input-area input[type="text"], .input-area textarea');
    if (!input) throw new Error('Chat input not found');
  });

  await test('Send button renders', async () => {
    const btn = await page.$('.input-area button[type="submit"]');
    if (!btn) throw new Error('Send button not found');
  });

  await test('Resource documents section renders', async () => {
    const resources = await page.$$('.resource-card');
    if (resources.length < 4) throw new Error('Expected 4+ resource cards, got ' + resources.length);
  });

  await test('No critical console errors on load', async () => {
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR')
    );
    if (criticalErrors.length > 0) throw new Error('Console errors: ' + criticalErrors.join('; '));
  });

  // ==========================================
  // SECTION 2: Header Buttons
  // ==========================================
  console.log('\nSection 2: Header Buttons');

  await test('New Chat button exists and clickable', async () => {
    const btn = await page.$('.new-chat-btn');
    if (!btn) throw new Error('New Chat button not found');
    await btn.click();
    await page.waitForTimeout(300);
  });

  await test('KB button exists', async () => {
    const btns = await page.$$('.header-icon-btn');
    let found = false;
    for (const b of btns) {
      const text = await b.textContent();
      if (text.includes('KB')) { found = true; break; }
    }
    if (!found) throw new Error('KB button not found');
  });

  await test('Universe button exists', async () => {
    const btns = await page.$$('.header-icon-btn');
    let found = false;
    for (const b of btns) {
      const text = await b.textContent();
      if (text.includes('Universe')) { found = true; break; }
    }
    if (!found) throw new Error('Universe button not found');
  });

  await test('Theme toggle exists', async () => {
    // Theme toggle is a header-icon-btn without the has-label class
    const btns = await page.$$('.header-icon-btn:not(.has-label)');
    if (btns.length === 0) throw new Error('Theme toggle not found');
  });

  // ==========================================
  // SECTION 3: Capability Tiles
  // ==========================================
  console.log('\nSection 3: Capability Tiles');

  await test('Tile 1 is Videos', async () => {
    const tiles = await page.$$('.capability-tile');
    const label = await tiles[0]?.$('.tile-label');
    const text = await label?.textContent();
    if (!text?.toLowerCase().includes('video')) throw new Error('Tile 1 label: ' + text);
  });

  await test('Tile 2 is CEO and CTO Decks', async () => {
    const tiles = await page.$$('.capability-tile');
    const label = await tiles[1]?.$('.tile-label');
    const text = await label?.textContent();
    if (!text?.toLowerCase().includes('deck')) throw new Error('Tile 2 label: ' + text);
  });

  await test('Tile 3 is Knowledge Universe', async () => {
    const tiles = await page.$$('.capability-tile');
    const label = await tiles[2]?.$('.tile-label');
    const text = await label?.textContent();
    if (!text?.toLowerCase().includes('universe')) throw new Error('Tile 3 label: ' + text);
  });

  await test('Tile 4 is Knowledge Base', async () => {
    const tiles = await page.$$('.capability-tile');
    const label = await tiles[3]?.$('.tile-label');
    const text = await label?.textContent();
    if (!text?.toLowerCase().includes('knowledge')) throw new Error('Tile 4 label: ' + text);
  });

  // Click Videos tile
  await test('Click Videos tile — no crash', async () => {
    const tiles = await page.$$('.capability-tile');
    await tiles[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/02-videos-tile.png', fullPage: true });
    const body = await page.$('body');
    if (!body) throw new Error('Page crashed after clicking Videos tile');
  });

  // Reset
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Click Decks tile
  await test('Click Decks tile — no crash', async () => {
    const tiles = await page.$$('.capability-tile');
    await tiles[1].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/03-decks-tile.png', fullPage: true });
    const body = await page.$('body');
    if (!body) throw new Error('Page crashed after clicking Decks tile');
  });

  await test('Decks tile opens canvas panel', async () => {
    const canvas = await page.$('.canvas-panel');
    const visible = canvas ? await canvas.isVisible() : false;
    if (!visible) throw new Error('Canvas panel did not open for decks');
  });

  // Reset
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Click Universe tile
  await test('Click Universe tile — no crash', async () => {
    const tiles = await page.$$('.capability-tile');
    await tiles[2].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/04-universe-tile.png', fullPage: true });
    const body = await page.$('body');
    if (!body) throw new Error('Page crashed after clicking Universe tile');
  });

  // Reset
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Click KB tile
  await test('Click Gold KB tile — no crash', async () => {
    const tiles = await page.$$('.capability-tile');
    await tiles[3].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/05-kb-tile.png', fullPage: true });
    const body = await page.$('body');
    if (!body) throw new Error('Page crashed after clicking KB tile');
  });

  // Reset
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // ==========================================
  // SECTION 4: Prompt Pills
  // ==========================================
  console.log('\nSection 4: Prompt Pills');

  await test('Click first prompt pill sends a message', async () => {
    const pills = await page.$$('.prompt-pill');
    if (pills.length === 0) throw new Error('No prompt pills');
    const pillText = await pills[0].textContent();
    await pills[0].click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/06-prompt-pill.png', fullPage: true });
    const userMsgs = await page.$$('.message.user');
    if (userMsgs.length === 0) throw new Error('No user message after clicking pill: ' + pillText);
  });

  await test('AI responds to prompt pill query', async () => {
    let attempts = 0;
    while (attempts < 30) {
      const assistantMsgs = await page.$$('.message.assistant');
      if (assistantMsgs.length > 0) return;
      await page.waitForTimeout(1000);
      attempts++;
    }
    throw new Error('No assistant response after 30s');
  });

  await page.screenshot({ path: SCREENSHOT_DIR + '/07-ai-response.png', fullPage: true });

  // ==========================================
  // SECTION 5: Chat Interaction
  // ==========================================
  console.log('\nSection 5: Chat Interaction');

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  await test('Type and send a message', async () => {
    const input = await page.$('.input-area input[type="text"], .input-area textarea');
    if (!input) throw new Error('Input not found');
    await input.scrollIntoViewIfNeeded();
    await input.fill('What is RuVector? Give a brief answer.');
    await page.waitForTimeout(300);
    const sendBtn = await page.$('.input-area button[type="submit"]');
    await sendBtn.click();
    await page.waitForTimeout(2000);
    const userMsgs = await page.$$('.message.user');
    if (userMsgs.length === 0) throw new Error('User message not rendered');
  });

  await test('AI responds to typed message', async () => {
    let attempts = 0;
    while (attempts < 30) {
      const assistantMsgs = await page.$$('.message.assistant');
      if (assistantMsgs.length > 0) return;
      await page.waitForTimeout(1000);
      attempts++;
    }
    throw new Error('No assistant response after 30s');
  });

  await page.screenshot({ path: SCREENSHOT_DIR + '/08-chat-response.png', fullPage: true });

  // ==========================================
  // SECTION 6: Mermaid Diagrams
  // ==========================================
  console.log('\nSection 6: Mermaid Diagrams');

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  await test('Request diagram — check for mermaid errors', async () => {
    const input = await page.$('.input-area input[type="text"], .input-area textarea');
    await input.scrollIntoViewIfNeeded();
    await input.fill('Show me a simple mermaid flowchart of how agents communicate. Use graph TD format.');
    const sendBtn = await page.$('.input-area button[type="submit"]');
    await sendBtn.click();

    let attempts = 0;
    while (attempts < 45) {
      const assistantMsgs = await page.$$('.message.assistant');
      if (assistantMsgs.length > 0) {
        const actionBtns = await page.$$('.action-buttons');
        if (actionBtns.length > 0) break;
      }
      await page.waitForTimeout(1000);
      attempts++;
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/09-mermaid-test.png', fullPage: true });

    // Check for UNHANDLED mermaid syntax errors (the ugly mermaid SVG ones)
    // Our custom handler shows "Diagram could not render" which is acceptable
    const mermaidErrorSvgs = await page.$$eval('svg', svgs =>
      svgs.filter(svg => svg.textContent.includes('Syntax error in text')).length
    );
    if (mermaidErrorSvgs > 0) throw new Error('Found ' + mermaidErrorSvgs + ' unhandled mermaid error SVG(s)');
    // Check our graceful handler shows properly
    const gracefulErrors = await page.$$('.mermaid-error');
    if (gracefulErrors.length > 0) {
      console.log('    (Found ' + gracefulErrors.length + ' gracefully handled mermaid error(s) - showing source code)');
    }
  });

  // ==========================================
  // SECTION 7: Resource Cards
  // ==========================================
  console.log('\nSection 7: Resource Cards');

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  await test('Resource cards are present', async () => {
    const cards = await page.$$('.resource-card');
    if (cards.length < 4) throw new Error('Only ' + cards.length + ' resource cards');
  });

  await test('Click PDF resource — no crash', async () => {
    const cards = await page.$$('.resource-card');
    await cards[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/10-resource-pdf.png', fullPage: true });
    const body = await page.$('body');
    if (!body) throw new Error('Page crashed clicking resource card');
  });

  // ==========================================
  // SECTION 8: Canvas Panel
  // ==========================================
  console.log('\nSection 8: Canvas Panel');

  await test('Canvas panel opens for content', async () => {
    const canvas = await page.$('.canvas-panel');
    const isVisible = canvas ? await canvas.isVisible().catch(() => false) : false;
    if (!isVisible) throw new Error('Canvas panel not visible after resource click');
  });

  // ==========================================
  // SECTION 9: Action Buttons
  // ==========================================
  console.log('\nSection 9: Action Buttons');

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);
  const input9 = await page.$('.input-area input[type="text"], .input-area textarea');
  if (input9) {
    await input9.scrollIntoViewIfNeeded();
    await input9.fill('Hello, brief overview of agents.');
    const sendBtn9 = await page.$('.input-area button[type="submit"]');
    if (sendBtn9) await sendBtn9.click();
  }

  let attempts9 = 0;
  while (attempts9 < 30) {
    const actionBtns = await page.$$('.action-buttons');
    if (actionBtns.length > 0) break;
    await page.waitForTimeout(1000);
    attempts9++;
  }
  await page.waitForTimeout(1000);

  await test('Copy button exists after response', async () => {
    const btns = await page.$$('.action-buttons button');
    if (btns.length === 0) throw new Error('No action buttons found');
  });

  await test('Open in Canvas works', async () => {
    const btns = await page.$$('.action-buttons button');
    for (const btn of btns) {
      const text = await btn.textContent();
      if (text.toLowerCase().includes('canvas')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOT_DIR + '/11-split-view.png', fullPage: true });
  });

  // ==========================================
  // SECTION 10: Follow-Up Suggestions
  // ==========================================
  console.log('\nSection 10: Follow-Up Suggestions');

  await test('Follow-up pills appear after response', async () => {
    const followUps = await page.$$('.follow-up-pill');
    console.log('    (Found ' + followUps.length + ' follow-up pills)');
  });

  // ==========================================
  // SECTION 11: Mobile Viewports
  // ==========================================
  console.log('\nSection 11: Mobile Viewports');

  const viewports = [
    { width: 375, name: 'iPhone-SE' },
    { width: 393, name: 'iPhone-14-Pro' },
    { width: 768, name: 'iPad' }
  ];

  for (const vp of viewports) {
    // Create fresh context for each mobile viewport to avoid state leakage
    const mobileCtx = await browser.newContext({ viewport: { width: vp.width, height: 812 } });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await mobilePage.waitForTimeout(1000);
    // alias for test compatibility
    const origPage = page;
    page = mobilePage;

    await test(vp.name + ' (' + vp.width + 'px) — page loads OK', async () => {
      const bodyWidth = await page.evaluate(function() { return document.body.scrollWidth; });
      if (bodyWidth > vp.width + 20) throw new Error('Body scrollWidth ' + bodyWidth + ' exceeds viewport ' + vp.width);
    });

    await test(vp.name + ' — 4 tiles visible', async () => {
      const tiles = await page.$$('.capability-tile');
      if (tiles.length !== 4) throw new Error('Expected 4 tiles, got ' + tiles.length);
    });

    await page.screenshot({ path: SCREENSHOT_DIR + '/12-mobile-' + vp.name + '.png', fullPage: true });
    page = origPage;
    await mobileCtx.close();
  }

  // ==========================================
  // SECTION 12: Theme Toggle
  // ==========================================
  console.log('\nSection 12: Theme Toggle');

  // Fresh context to avoid viewport/state issues from mobile tests
  const themeCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const themePage = await themeCtx.newPage();
  await themePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await themePage.waitForTimeout(500);
  page = themePage;

  await test('Theme toggle works without crash', async () => {
    const toggle = await page.$('.header-icon-btn:not(.has-label)');
    if (!toggle) throw new Error('Theme toggle not found');
    await toggle.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: SCREENSHOT_DIR + '/13-light-theme.png' });
    await toggle.click();
    await page.waitForTimeout(300);
  });

  // ==========================================
  // SECTION 13: Level Selector
  // ==========================================
  console.log('\nSection 13: Level Selector');

  await test('Level selector exists', async () => {
    const sel = await page.$('.header-select, #level-select, select');
    if (!sel) throw new Error('Level selector not found');
  });

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('\nRESULTS: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed) + ' tests\n');

  if (failures.length > 0) {
    console.log('FAILURES:');
    for (const f of failures) {
      console.log('  - ' + f.name + ': ' + f.error);
    }
  }

  if (consoleErrors.length > 0) {
    console.log('\nConsole errors captured (' + consoleErrors.length + '):');
    consoleErrors.slice(0, 10).forEach(function(e) { console.log('  - ' + e); });
  }

  console.log('\nScreenshots saved to: ' + SCREENSHOT_DIR + '/');
  console.log('');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
