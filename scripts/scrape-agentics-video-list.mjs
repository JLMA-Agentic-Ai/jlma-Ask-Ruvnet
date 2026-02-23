import { chromium } from '/Users/stuartkerr/.npm-global/lib/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Navigating...');
await page.goto('https://video.agentics.org/search?sortBy=recent&duration[0]=1500-6300', {
  waitUntil: 'domcontentloaded',
  timeout: 35000
});
await page.waitForTimeout(5000);

// Scroll to load more videos
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
}

// Extract ALL video data from DOM more aggressively
const videos = await page.evaluate(() => {
  const results = [];
  const seen = new Set();

  // Get all anchors with /media/t/
  document.querySelectorAll('a[href*="/media/t/"]').forEach(a => {
    const m = a.href.match(/\/media\/t\/([A-Za-z0-9_]+)/);
    if (!m || seen.has(m[1])) return;
    seen.add(m[1]);

    // Walk up to find card container
    let container = a;
    for (let i = 0; i < 6; i++) {
      if (!container.parentElement) break;
      container = container.parentElement;
      const h = container.querySelector('h1,h2,h3,h4,[class*="title"],[class*="name"],[class*="heading"]');
      if (h && h.textContent.trim().length > 5) {
        const dateEl = container.querySelector('time,[class*="date"],[class*="time"],[class*="created"]');
        results.push({
          id: m[1],
          title: h.textContent.trim().substring(0, 100),
          date: dateEl ? dateEl.textContent.trim() : '',
          duration: (() => {
            const dur = container.querySelector('[class*="duration"],[class*="time"]');
            return dur ? dur.textContent.trim() : '';
          })()
        });
        return;
      }
    }
    // fallback: just the ID
    results.push({ id: m[1], title: '', date: '', duration: '' });
  });

  return results;
});

// Also get full page text to capture any titles
const pageText = await page.evaluate(() => document.body.innerText);

console.log(`Found ${videos.length} videos:`);
videos.forEach(v => {
  console.log(`${v.id} | ${(v.date||'').substring(0,15).padEnd(15)} | ${(v.duration||'').padEnd(10)} | ${v.title}`);
});

// Save to file for the ingestion script
const fs = await import('fs');
fs.writeFileSync('/tmp/agentics-video-list.json', JSON.stringify(videos, null, 2));
console.log('\nSaved to /tmp/agentics-video-list.json');

// Try to get title via video page for each ID with no title
const noTitle = videos.filter(v => !v.title);
if (noTitle.length > 0) {
  console.log(`\nFetching titles for ${noTitle.length} untitled videos...`);
  for (const v of noTitle.slice(0, 5)) {
    try {
      await page.goto(`https://video.agentics.org/media/t/${v.id}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const title = await page.evaluate(() => {
        return document.querySelector('h1, .entry-name, [class*="title"]')?.textContent?.trim() || document.title;
      });
      console.log(`${v.id}: ${title.substring(0, 80)}`);
      v.title = title.substring(0, 100);
    } catch (e) {
      console.log(`${v.id}: error - ${e.message}`);
    }
  }
  fs.writeFileSync('/tmp/agentics-video-list.json', JSON.stringify(videos, null, 2));
}

await browser.close();
