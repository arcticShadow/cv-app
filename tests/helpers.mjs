import puppeteer from 'puppeteer';
import { get } from 'node:https';

export const BASE_URL = process.env.TEST_BASE_URL || 'https://localtest.me';

export async function waitForServer(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = get(BASE_URL, { rejectUnauthorized: false }, res => { res.resume(); resolve(); });
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error(`Server not ready at ${BASE_URL} after ${timeout}ms`);
}

export async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  return { browser, page };
}
