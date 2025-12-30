#!/usr/bin/env node
/**
 * KB Universe Screenshot Generator
 * Updated: 2025-12-30 09:55:00 EST | Version 1.0.0
 * Created: 2025-12-30 09:55:00 EST
 *
 * Uses Playwright to take screenshots of the KB Universe visualization.
 * Captures multiple views: overview, expanded, and detail.
 *
 * Prerequisites: npx playwright install chromium
 *
 * Usage:
 *   node scripts/kb-universe-screenshot.js [--html path] [--output dir]
 */

const fs = require('fs');
const path = require('path');

async function main() {
    const args = process.argv.slice(2);
    const htmlIndex = args.indexOf('--html');
    const outputIndex = args.indexOf('--output');

    const htmlPath = htmlIndex !== -1
        ? args[htmlIndex + 1]
        : path.join(process.cwd(), 'public', 'knowledge-universe.html');

    const outputDir = outputIndex !== -1
        ? args[outputIndex + 1]
        : path.join(process.cwd(), 'public');

    console.log('📸 KB Universe Screenshot Generator');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Output: ${outputDir}`);
    console.log('');

    if (!fs.existsSync(htmlPath)) {
        console.error('❌ HTML file not found. Run: node scripts/build-kb-universe.js');
        process.exit(1);
    }

    // Try to load Playwright
    let chromium;
    try {
        const playwright = require('playwright');
        chromium = playwright.chromium;
    } catch (err) {
        console.log('⚠️ Playwright not installed.');
        console.log('   Install with: npm install playwright');
        console.log('   Then: npx playwright install chromium');
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2
    });
    const page = await context.newPage();

    try {
        // Load the HTML file
        const fileUrl = `file://${path.resolve(htmlPath)}`;
        console.log('🌐 Loading visualization...');
        await page.goto(fileUrl, { waitUntil: 'networkidle' });

        // Wait for animation to settle
        await page.waitForTimeout(2000);

        // Screenshot 1: Overview
        console.log('📷 Capturing overview...');
        await page.screenshot({
            path: path.join(outputDir, 'kb-universe-overview.png'),
            fullPage: false
        });

        // Click center node to expand (if exists)
        const centerNode = await page.evaluate(() => {
            const canvas = document.getElementById('universe-canvas');
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: rect.width / 2,
                    y: rect.height / 2
                };
            }
            return null;
        });

        if (centerNode) {
            console.log('🖱️ Expanding center node...');
            await page.mouse.click(centerNode.x, centerNode.y);
            await page.waitForTimeout(1500);

            // Screenshot 2: Expanded view
            console.log('📷 Capturing expanded view...');
            await page.screenshot({
                path: path.join(outputDir, 'kb-universe-expanded.png'),
                fullPage: false
            });

            // Click first child node
            const firstChild = await page.evaluate(() => {
                const canvas = document.getElementById('universe-canvas');
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    // Approximate position of first child (top)
                    return {
                        x: rect.width / 2,
                        y: rect.height / 2 - rect.height * 0.3
                    };
                }
                return null;
            });

            if (firstChild) {
                console.log('🖱️ Drilling into category...');
                await page.mouse.click(firstChild.x, firstChild.y);
                await page.waitForTimeout(1500);

                // Screenshot 3: Detail view
                console.log('📷 Capturing detail view...');
                await page.screenshot({
                    path: path.join(outputDir, 'kb-universe-detail.png'),
                    fullPage: false
                });
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ Screenshots captured!');
        console.log('');
        console.log('📁 Files:');
        console.log(`   • ${path.join(outputDir, 'kb-universe-overview.png')}`);
        console.log(`   • ${path.join(outputDir, 'kb-universe-expanded.png')}`);
        console.log(`   • ${path.join(outputDir, 'kb-universe-detail.png')}`);

    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
