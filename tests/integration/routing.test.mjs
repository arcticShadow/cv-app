import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { waitForServer, launchBrowser, BASE_URL } from '../helpers.mjs';

let browser;
let page;

before(async () => {
  await waitForServer();
  const launched = await launchBrowser();
  browser = launched.browser;
  page = launched.page;
});

after(async () => {
  if (browser) await browser.close();
});

describe('routing', () => {
  it('loads default section at root URL', async () => {
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2', timeout: 15000
    });
    await new Promise(r => setTimeout(r, 500));

    const title = await page.evaluate(() => document.querySelector('main h1')?.textContent);
    assert.ok(title, 'Should render a section heading');
  });

  it('navigates to Full CV via top nav', async () => {
    await page.evaluate(() => {
      const links = document.querySelectorAll('header nav a');
      for (const a of links) {
        if (a.textContent === 'Full CV') { a.click(); break; }
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const url = await page.url();
    assert.ok(url.endsWith('/full'), `URL should end with /full, got ${url}`);
  });

  it('renders correct section via direct URL', async () => {
    await page.goto(`${BASE_URL}/projects`, {
      waitUntil: 'networkidle2', timeout: 15000
    });
    await new Promise(r => setTimeout(r, 500));

    const title = await page.evaluate(() => document.querySelector('main h1')?.textContent);
    assert.strictEqual(title, 'Projects');

    const url = await page.url();
    assert.ok(url.includes('/projects'), `URL should include /projects, got ${url}`);
  });
});
