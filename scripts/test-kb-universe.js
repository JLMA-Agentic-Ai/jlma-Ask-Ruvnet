#!/usr/bin/env node
/**
 * KB Universe Visualization Test
 * Uses Playwright to verify the visualization actually works.
 */

const fs = require('fs');
const path = require('path');

async function testVisualization() {
    console.log('');
    console.log('🧪 KB Universe Visualization Test');
    console.log('═══════════════════════════════════════════════════════════');

    const htmlPath = path.join(process.cwd(), 'public', 'knowledge-universe.html');
    const dataPath = path.join(process.cwd(), 'public', 'kb-universe-data.json');

    // Check files exist
    console.log('');
    console.log('📁 Checking files...');

    if (!fs.existsSync(htmlPath)) {
        console.error('❌ FAIL: knowledge-universe.html does not exist');
        process.exit(1);
    }
    console.log('   ✅ knowledge-universe.html exists');

    if (!fs.existsSync(dataPath)) {
        console.error('❌ FAIL: kb-universe-data.json does not exist');
        process.exit(1);
    }
    console.log('   ✅ kb-universe-data.json exists');

    // Validate JSON
    console.log('');
    console.log('📊 Validating data...');
    try {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`   ✅ Valid JSON`);
        console.log(`   • Name: ${data.name}`);
        console.log(`   • Categories: ${data.children?.length || 0}`);
        console.log(`   • Total items: ${data.metadata?.totalItems || 0}`);
    } catch (err) {
        console.error(`❌ FAIL: Invalid JSON - ${err.message}`);
        process.exit(1);
    }

    // Try to load Playwright
    let chromium;
    try {
        const playwright = require('playwright');
        chromium = playwright.chromium;
        console.log('   ✅ Playwright available');
    } catch (err) {
        console.error('❌ Playwright not installed.');
        console.log('   Run: npm install playwright && npx playwright install chromium');
        process.exit(1);
    }

    // Launch browser and test
    console.log('');
    console.log('🌐 Launching browser test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Capture console errors
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    page.on('pageerror', err => {
        errors.push(err.message);
    });

    try {
        // Load the page
        const fileUrl = `file://${path.resolve(htmlPath)}`;
        console.log(`   Loading: ${fileUrl}`);

        await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
        console.log('   ✅ Page loaded');

        // Wait for loading to complete
        await page.waitForTimeout(2000);

        // Check for loading indicator gone
        const loadingHidden = await page.evaluate(() => {
            const loading = document.getElementById('loading');
            return loading && loading.classList.contains('hidden');
        });

        if (!loadingHidden) {
            console.log('   ⚠️  Loading indicator still visible');
            const loadingText = await page.evaluate(() => {
                const loading = document.getElementById('loading');
                return loading ? loading.textContent : 'No loading element';
            });
            console.log(`   Loading text: ${loadingText}`);
        } else {
            console.log('   ✅ Loading completed');
        }

        // Check if canvas exists and has content
        const canvasInfo = await page.evaluate(() => {
            const canvas = document.getElementById('canvas');
            if (!canvas) return { exists: false };
            return {
                exists: true,
                width: canvas.width,
                height: canvas.height
            };
        });

        if (!canvasInfo.exists) {
            errors.push('Canvas element not found');
        } else {
            console.log(`   ✅ Canvas: ${canvasInfo.width}x${canvasInfo.height}`);
        }

        // Check if title is set
        const title = await page.evaluate(() => {
            const titleEl = document.getElementById('title');
            return titleEl ? titleEl.textContent : null;
        });

        if (title) {
            console.log(`   ✅ Title: "${title}"`);
        } else {
            errors.push('Title not set');
        }

        // Check for title bar visibility
        const titleBarVisible = await page.evaluate(() => {
            const titleBar = document.getElementById('title-bar');
            return titleBar && !titleBar.classList.contains('hidden');
        });

        if (titleBarVisible) {
            console.log('   ✅ Title bar visible');
        } else {
            errors.push('Title bar not visible - initialization may have failed');
        }

        // Check for score dashboard
        const scoreDashboard = await page.evaluate(() => {
            const dashboard = document.getElementById('score-dashboard');
            const overall = document.getElementById('score-overall');
            const grade = document.getElementById('grade-letter');
            return {
                visible: dashboard && !dashboard.classList.contains('hidden'),
                score: overall ? overall.textContent : null,
                grade: grade ? grade.textContent : null
            };
        });

        if (scoreDashboard.visible) {
            console.log(`   ✅ Score Dashboard: ${scoreDashboard.score}/100 (${scoreDashboard.grade})`);
        } else {
            console.log('   ⚠️  Score dashboard not visible (may not have score data)');
        }

        // Take screenshot
        const screenshotPath = path.join(process.cwd(), 'public', 'kb-universe-test.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`   ✅ Screenshot saved: ${screenshotPath}`);

        // Report errors
        console.log('');
        if (errors.length > 0) {
            console.log('❌ ERRORS FOUND:');
            errors.forEach(err => console.log(`   • ${err}`));
            await browser.close();
            process.exit(1);
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED');
        console.log('');

        await browser.close();

    } catch (err) {
        console.error(`❌ FAIL: ${err.message}`);
        errors.forEach(e => console.log(`   • ${e}`));
        await browser.close();
        process.exit(1);
    }
}

testVisualization();
