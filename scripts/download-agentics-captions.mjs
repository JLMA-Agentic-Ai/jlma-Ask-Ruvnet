/**
 * Download Kaltura WebVTT captions for all 10 Agentics Foundation videos
 * Strategy: Load each video page, intercept the HLS caption playlist URL,
 * then download all VTT segments and merge into a single transcript.
 */
import { chromium } from '/Users/stuartkerr/.npm-global/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import https from 'https';

const VIDEO_IDS = [
  { id: '1_392oe5oa', title: 'Ruflo V3: Building Intelligent Agents with Self-Learning Vector Systems' },
  { id: '1_wx6gnb5d', title: 'Building AI Agents: From Development Tools to Industry Standards' },
  { id: '1_htfe35tu', title: 'Agentic Quality Engineering Fleet: Revolutionizing Software Testing' },
  { id: '1_hui4b06k', title: 'From Cloud to Edge: Revolutionary AI Chip Technology and Distributed Systems' },
  { id: '1_prlsngek', title: 'Root Vector: Building the World\'s Fastest AI Graph Neural Network System' },
  { id: '1_dpwbbr66', title: 'Agentic AI Revolution: Building Autonomous Intelligent Systems' },
  { id: '1_33xvl0xn', title: 'Agentix Foundation: Building a Global Community for Agentic AI Development' },
  { id: '1_rozlzilu', title: 'London Meetup - AI Powered Content Creation: From Sheet Music to Semantic Search' },
  { id: '1_dxehuvpf', title: 'Building the Prime Radiant: A Coherence Engine for AI Anti-Hallucination' },
  { id: '1_rtjw6iv4', title: 'Building Agentic AI Solutions: Ruflo, Anti-Gravity, and Real-World Deployment' },
];

const OUTPUT_DIR = '/tmp/agentics-transcripts';
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.request({ hostname: opts.hostname, path: opts.pathname + opts.search, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

async function downloadVttSegments(baseUrl, segmentCount) {
  // baseUrl is the HLS playlist URL, segments are relative: segmentIndex/1.vtt, 2.vtt, etc.
  // Strip the playlist filename to get base dir
  const base = baseUrl.replace(/[^/]+$/, '');
  const allText = [];

  for (let i = 1; i <= segmentCount; i++) {
    try {
      const segUrl = base + `segmentIndex/${i}.vtt`;
      const vtt = await fetchUrl(segUrl);
      if (vtt.startsWith('WEBVTT') || vtt.includes('-->')) {
        // Strip WEBVTT header and clean up
        const lines = vtt.split('\n').filter(l => !l.startsWith('WEBVTT') && !l.startsWith('NOTE'));
        allText.push(...lines);
      }
    } catch (e) {
      // Segment not found, might be end of file
      break;
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }
  return allText.join('\n');
}

function vttToPlainText(vttContent) {
  // Convert WebVTT to plain text transcript
  const lines = vttContent.split('\n');
  const textLines = [];
  let prev = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip timestamps, empty lines, numeric cues, WEBVTT header
    if (!trimmed || trimmed.match(/^\d+$/) || trimmed.includes('-->') || trimmed.startsWith('WEBVTT')) continue;
    // Deduplicate consecutive identical lines
    if (trimmed !== prev) {
      textLines.push(trimmed);
      prev = trimmed;
    }
  }

  // Join into sentences - merge short lines
  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

const browser = await chromium.launch({ headless: true });

for (const video of VIDEO_IDS) {
  const outFile = `${OUTPUT_DIR}/${video.id}.vtt`;
  const txtFile = `${OUTPUT_DIR}/${video.id}.txt`;

  if (existsSync(txtFile)) {
    console.log(`⏭  ${video.id}: already downloaded`);
    continue;
  }

  console.log(`\n⬇  Loading ${video.id}: ${video.title.substring(0, 60)}...`);

  const page = await browser.newPage();
  let captionPlaylistUrl = null;
  let captionBaseUrl = null;
  let segmentCount = 0;

  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('serveWebVTT') || url.includes('captionasset') || url.includes('caption_captionasset')) {
      if (!captionPlaylistUrl) {
        captionPlaylistUrl = url;
        try {
          const text = await resp.text();
          if (text.includes('#EXTM3U')) {
            // Count segments
            const matches = text.match(/segmentIndex\/\d+\.vtt/g) || [];
            segmentCount = matches.length;
            captionBaseUrl = url;
            console.log(`  ✓ Caption playlist: ${segmentCount} segments, url length: ${url.length}`);
            // Save the full URL
            writeFileSync(`${OUTPUT_DIR}/${video.id}.m3u8url`, url);
          } else if (text.startsWith('WEBVTT')) {
            // Direct VTT file
            writeFileSync(outFile, text);
            const plain = vttToPlainText(text);
            writeFileSync(txtFile, plain);
            console.log(`  ✓ Direct VTT: ${text.length} chars, ${plain.length} plain text chars`);
          }
        } catch (e) {}
      }
    }
  });

  try {
    await page.goto(`https://video.agentics.org/media/t/${video.id}`, {
      waitUntil: 'networkidle',
      timeout: 25000
    });
    await page.waitForTimeout(4000);
  } catch (e) {
    console.log(`  ⚠ Page load issue: ${e.message}`);
  }

  await page.close();

  if (captionBaseUrl && segmentCount > 0) {
    console.log(`  Downloading ${segmentCount} VTT segments...`);
    try {
      const fullVtt = await downloadVttSegments(captionBaseUrl, segmentCount + 5); // +5 to catch any extra
      writeFileSync(outFile, fullVtt);
      const plain = vttToPlainText(fullVtt);
      writeFileSync(txtFile, plain);
      console.log(`  ✓ Downloaded: ${fullVtt.length} VTT chars → ${plain.length} plain text chars`);
    } catch (e) {
      console.log(`  ✗ Download failed: ${e.message}`);
    }
  } else if (!existsSync(txtFile)) {
    console.log(`  ✗ No caption URL captured`);
  }

  // Delay between videos
  await new Promise(r => setTimeout(r, 1000));
}

await browser.close();

// Summary
console.log('\n=== DOWNLOAD SUMMARY ===');
for (const video of VIDEO_IDS) {
  const txtFile = `${OUTPUT_DIR}/${video.id}.txt`;
  if (existsSync(txtFile)) {
    const { statSync, readFileSync } = await import('fs');
    const size = statSync(txtFile).size;
    const preview = readFileSync(txtFile, 'utf8').substring(0, 100);
    console.log(`✓ ${video.id} (${size} bytes): ${preview}...`);
  } else {
    console.log(`✗ ${video.id}: MISSING`);
  }
}
