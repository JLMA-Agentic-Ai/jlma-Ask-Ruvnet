#!/usr/bin/env node
/**
 * Take screenshot after orbiting nodes have rendered
 */
const path = require('path');

async function takeScreenshot() {
    const playwright = require('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    const htmlPath = path.join(process.cwd(), 'public', 'knowledge-universe.html');
    await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'networkidle' });

    // Wait for animation to settle
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
        path: path.join(process.cwd(), 'public', 'kb-universe-orbiting.png'),
        fullPage: false
    });

    console.log('Screenshot saved: public/kb-universe-orbiting.png');
    await browser.close();
}

takeScreenshot().catch(console.error);
