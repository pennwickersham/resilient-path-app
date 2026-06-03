// capture_screenshots.mjs
// Uses Edge CDP to set localStorage before capturing screenshots
// Run: node capture_screenshots.mjs

import http from 'http';
import https from 'https';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';
const WIDTH = 428;
const HEIGHT = 926;
const DPR = 3;
const OUTPUT_W = WIDTH * DPR; // 1284
const OUTPUT_H = HEIGHT * DPR; // 2778

const pages = [
  { name: '01_home', path: '/#/' },
  { name: '02_workbook', path: '/#/workbook' },
  { name: '03_chat', path: '/#/chatbot' },
  { name: '04_health', path: '/#/health-tools' },
  { name: '05_emergency', path: '/#/emergency' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function connectWS(url) {
  return new Promise((resolve, reject) => {
    // Use bare WebSocket via ws module — but let's use net/http approach
    // Actually use dynamic import
    import('ws').then(({ default: WebSocket }) => {
      const ws = new WebSocket(url);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    }).catch(reject);
  });
}

let msgId = 1;
function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    ws.send(JSON.stringify({ id, method, params }));
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.removeListener('message', handler);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
  });
}

async function main() {
  console.log('Launching Edge with remote debugging...');
  
  const userDataDir = path.join(__dirname, '.edge-screenshot-profile');
  
  const edge = spawn(EDGE, [
    `--remote-debugging-port=9222`,
    `--headless=new`,
    `--disable-gpu`,
    `--hide-scrollbars`,
    `--disable-extensions`,
    `--no-first-run`,
    `--no-default-browser-check`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    `about:blank`
  ], { stdio: 'ignore' });

  await sleep(3000);

  try {
    const targets = await httpGet('http://localhost:9222/json');
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = await connectWS(pageTarget.webSocketDebuggerUrl);
    console.log('Connected to Edge CDP');

    // Set device metrics for iPhone resolution
    await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: DPR,
      mobile: true
    });

    // Navigate to home first to set localStorage
    await sendCommand(ws, 'Page.navigate', { url: BASE_URL });
    await sleep(3000);

    // Set localStorage to skip disclaimers/consent and simulate subscription
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: `
        localStorage.setItem('disclaimerAccepted', 'true');
        localStorage.setItem('aiConsentAccepted', 'true');
        localStorage.setItem('subscriptionStatus', 'active');
      `
    });

    // Reload to apply localStorage changes
    await sendCommand(ws, 'Page.reload', {});
    await sleep(3000);

    // Click through the disclaimer popup (it always shows on launch)
    // Step 1: Click "I Understand and Accept" (medical disclaimer)
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('disclaimer-accept-btn')?.click()`
    });
    await sleep(500);

    // Step 2: Click "I Consent — Enable AI Chat" (AI data sharing) if shown
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('ai-consent-accept-btn')?.click()`
    });
    await sleep(1000);

    // Now capture each page
    for (const page of pages) {
      const url = `${BASE_URL}${page.path}`;
      console.log(`Capturing ${page.name} from ${url}...`);

      await sendCommand(ws, 'Page.navigate', { url });
      await sleep(2000);

      // Click through the disclaimer popup (it mounts on every navigation)
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `document.getElementById('disclaimer-accept-btn')?.click()`
      });
      await sleep(300);
      // AI consent step (only if no prior consent in localStorage)
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `document.getElementById('ai-consent-accept-btn')?.click()`
      });
      await sleep(1500); // Wait for page to settle after dismissal

      const { data } = await sendCommand(ws, 'Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0, y: 0,
          width: WIDTH, height: HEIGHT,
          scale: 1
        },
        captureBeyondViewport: false
      });

      const outPath = path.join(__dirname, `${page.name}.png`);
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      console.log(`  -> ${outPath}`);
    }

    ws.close();
  } finally {
    edge.kill();
    // Clean up profile
    try { fs.rmSync(path.join(__dirname, '.edge-screenshot-profile'), { recursive: true, force: true }); } catch {}
  }

  console.log('\\nDone. Now run resize_65inch.ps1 to generate 6.5-inch variants.');
}

main().catch(err => { console.error(err); process.exit(1); });
