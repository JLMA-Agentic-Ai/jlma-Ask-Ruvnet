#!/usr/bin/env node
/**
 * KB Universe Navigation Test
 * Verifies that drilling down keeps all categories visible
 * (Bricksmith-inspired behavior)
 */

const fs = require('fs');
const path = require('path');

async function testNavigation() {
    console.log('');
    console.log('🧭 KB Universe Navigation Test');
    console.log('═══════════════════════════════════════════════════════════');

    let chromium;
    try {
        const playwright = require('playwright');
        chromium = playwright.chromium;
    } catch (err) {
        console.error('❌ Playwright not installed');
        process.exit(1);
    }

    const htmlPath = path.join(process.cwd(), 'public', 'knowledge-universe.html');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    try {
        await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Get initial category count
        const initialState = await page.evaluate(() => {
            return {
                categoryCount: window.categories ? window.categories.length : 0,
                selectedCategory: window.selectedCategory ? window.selectedCategory.name : null
            };
        });
        console.log(`📊 Initial state: ${initialState.categoryCount} categories, no selection`);

        // Find and click a category node on the canvas
        const canvas = await page.$('#canvas');
        if (!canvas) {
            throw new Error('Canvas not found');
        }

        // Click near the center-right where categories should be
        const box = await canvas.boundingBox();
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        // Click to the right of center (where a category node should be)
        console.log('');
        console.log('🖱️  Clicking on a category node...');
        await page.mouse.click(centerX + 200, centerY);
        await page.waitForTimeout(1500);

        // Check state after click
        const afterClick = await page.evaluate(() => {
            return {
                categoryCount: window.categories ? window.categories.length : 0,
                selectedCategory: window.selectedCategory ? window.selectedCategory.name : null,
                allCategoriesVisible: window.categories ? window.categories.every(c => {
                    const pos = c.position || c.targetPos;
                    // Check if position is within visible canvas bounds
                    return pos && pos.x >= -1000 && pos.x <= 1000;
                }) : false
            };
        });

        console.log(`📊 After click: ${afterClick.categoryCount} categories`);
        console.log(`   Selected: ${afterClick.selectedCategory || 'none'}`);
        console.log(`   All visible: ${afterClick.allCategoriesVisible ? '✅ YES' : '❌ NO'}`);

        // Take screenshots
        const screenshotDir = path.join(process.cwd(), 'public');
        await page.screenshot({
            path: path.join(screenshotDir, 'kb-nav-after-click.png'),
            fullPage: false
        });
        console.log('   Screenshot: kb-nav-after-click.png');

        // Verify categories remain visible (CRITICAL TEST)
        if (afterClick.selectedCategory && afterClick.categoryCount > 0) {
            // Count how many categories are still rendered
            const visibleCategories = await page.evaluate(() => {
                const cats = window.categories || [];
                return cats.filter(c => {
                    const pos = c.position || { x: 0, y: 0 };
                    // Check if visible on screen (reasonable bounds)
                    return Math.abs(pos.x) < 800 && Math.abs(pos.y) < 500;
                }).length;
            });

            console.log('');
            if (visibleCategories === afterClick.categoryCount) {
                console.log('✅ PASS: All categories remain visible after selection');
            } else if (visibleCategories > 0) {
                console.log(`⚠️  PARTIAL: ${visibleCategories}/${afterClick.categoryCount} categories visible`);
            } else {
                console.log('❌ FAIL: Categories disappeared after selection');
            }
        }

        // Click elsewhere to deselect
        console.log('');
        console.log('🖱️  Clicking to deselect...');
        await page.mouse.click(centerX - 300, centerY - 200);
        await page.waitForTimeout(1000);

        const afterDeselect = await page.evaluate(() => {
            return {
                categoryCount: window.categories ? window.categories.length : 0,
                selectedCategory: window.selectedCategory ? window.selectedCategory.name : null
            };
        });

        console.log(`📊 After deselect: ${afterDeselect.categoryCount} categories`);
        console.log(`   Selected: ${afterDeselect.selectedCategory || 'none'}`);

        await page.screenshot({
            path: path.join(screenshotDir, 'kb-nav-after-deselect.png'),
            fullPage: false
        });
        console.log('   Screenshot: kb-nav-after-deselect.png');

        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ Navigation test complete');

        await browser.close();

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        await browser.close();
        process.exit(1);
    }
}

testNavigation();
