import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { waitForServer, launchBrowser,BASE_URL } from '../helpers.mjs';


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

describe('sidebar navigation', () => {
  it('loads section and scrolls to item from URL', async () => {
    await page.goto(`${BASE_URL}/work-experience/easycrypto`, {
      waitUntil: 'networkidle2', timeout: 15000
    });
    await new Promise(r => setTimeout(r, 1000));

    const scrollY = await page.evaluate(() => window.scrollY);
    assert.ok(scrollY > 1000, `Should be scrolled down to EasyCrypto, got scrollY=${scrollY}`);

    const active = await page.evaluate(() => {
      const a = document.querySelector('.section-nav nav a.active');
      return a ? a.textContent : null;
    });
    assert.strictEqual(active, 'EasyCrypto');
  });

  it('scrolls to sidebar item without re-rendering', async () => {
    await page.evaluate(() => {
      const links = document.querySelectorAll('.section-nav nav a');
      for (const a of links) {
        if (a.textContent === 'Veve') { a.click(); break; }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const scrollY = await page.evaluate(() => window.scrollY);
    assert.ok(scrollY < 2000, `Should scroll up to VeVe, got scrollY=${scrollY}`);

    const active = await page.evaluate(() => {
      const a = document.querySelector('.section-nav nav a.active');
      return a ? a.textContent : null;
    });
    assert.strictEqual(active, 'Veve');

    const url = await page.url();
    assert.ok(url.endsWith('/veve'), `URL should end with /veve, got ${url}`);
  });

  it('scrolls to a different sidebar item correctly', async () => {
    await page.evaluate(() => {
      const links = document.querySelectorAll('.section-nav nav a');
      for (const a of links) {
        if (a.textContent === 'Hectre') { a.click(); break; }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const scrollY = await page.evaluate(() => window.scrollY);
    assert.ok(scrollY > 500, `Should be scrolled to Hectre, got scrollY=${scrollY}`);

    const active = await page.evaluate(() => {
      const a = document.querySelector('.section-nav nav a.active');
      return a ? a.textContent : null;
    });
    assert.strictEqual(active, 'Hectre');
  });

  it('cross-section nav re-renders instead of scrolling', async () => {
    await page.evaluate(() => {
      const links = document.querySelectorAll('header nav a');
      for (const a of links) {
        if (a.textContent === 'Overview') { a.click(); break; }
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const scrollY = await page.evaluate(() => window.scrollY);
    assert.strictEqual(scrollY, 0, 'Overview should be at top of page');

    const url = await page.url();
    assert.ok(url.endsWith('/overview'), `URL should end with /overview, got ${url}`);
  });

  it('back button returns to previous section', async () => {
    await page.goBack();
    await new Promise(r => setTimeout(r, 1000));

    const url = await page.url();
    assert.ok(url.includes('/work-experience'), `Back should go to /work-experience, got ${url}`);
  });
});
