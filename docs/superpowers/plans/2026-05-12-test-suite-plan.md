# Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight automated test suite with unit tests for md-parser and browser integration tests for routing/navigation.

**Architecture:** Tests live in `tests/` dir with their own `package.json` (only dep: puppeteer). Unit tests use Node built-in `--test` runner. Integration tests use Puppeteer + Python dev server. Mise manages task execution with `dir`, `depends`, `sources`, `outputs = { auto }`.

**Tech Stack:** Node `--test` runner, Puppeteer, Python `server.py`, mise tasks

---

### Task 1: Create tests/ directory structure and package.json

**Files:**
- Create: `tests/package.json`
- Create: `tests/unit/.gitkeep`
- Create: `tests/integration/.gitkeep`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p tests/unit tests/integration
```

- [ ] **Step 2: Write tests/package.json**

```json
{
  "private": true,
  "type": "module",
  "devDependencies": {
    "puppeteer": "^24"
  }
}
```

- [ ] **Step 3: Create .gitkeep files and install deps**

```bash
touch tests/unit/.gitkeep tests/integration/.gitkeep
cd tests && npm install
```

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "feat: add tests directory with puppeteer dependency"
```

---

### Task 2: Write `tests/helpers.mjs`

**Files:**
- Create: `tests/helpers.mjs`

- [ ] **Step 1: Write helpers.mjs with shared test utilities**

```javascript
import puppeteer from 'puppeteer';
import { get } from 'node:http';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localtest.me:8080';

export async function waitForServer(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = get(BASE_URL, res => { res.resume(); resolve(); });
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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  return { browser, page };
}
```

- [ ] **Step 2: Commit**

```bash
git add tests/helpers.mjs
git commit -m "feat: add test helpers for server/browser lifecycle"
```

---

### Task 3: Write `tests/unit/md-parser.test.mjs`

**Files:**
- Create: `tests/unit/md-parser.test.mjs`

- [ ] **Step 1: Write md-parser unit tests**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseMarkdown } from '../../js/md-parser.js';

describe('md-parser', () => {
  describe('frontmatter', () => {
    it('extracts YAML frontmatter', () => {
      const input = `---
title: Test
company: Acme
---
# Hello`;
      const result = parseMarkdown(input);
      assert.deepStrictEqual(result.frontmatter, { title: 'Test', company: 'Acme' });
    });

    it('returns empty object when no frontmatter', () => {
      const result = parseMarkdown('# Hello');
      assert.deepStrictEqual(result.frontmatter, {});
    });

    it('handles empty frontmatter delimiters', () => {
      const input = `---\n---\n# Hello`;
      const result = parseMarkdown(input);
      assert.deepStrictEqual(result.frontmatter, {});
    });
  });

  describe('headings', () => {
    it('renders h1', () => {
      const result = parseMarkdown('# Title');
      assert.match(result.html, /<h1[^>]*>Title<\/h1>/);
    });

    it('renders h2', () => {
      const result = parseMarkdown('## Subtitle');
      assert.match(result.html, /<h2[^>]*>Subtitle<\/h2>/);
    });

    it('renders h3', () => {
      const result = parseMarkdown('### Section');
      assert.match(result.html, /<h3[^>]*>Section<\/h3>/);
    });

    it('renders h4-h6', () => {
      const result = parseMarkdown('#### A\n##### B\n###### C');
      assert.match(result.html, /<h4[^>]*>A<\/h4>/);
      assert.match(result.html, /<h5[^>]*>B<\/h5>/);
      assert.match(result.html, /<h6[^>]*>C<\/h6>/);
    });
  });

  describe('inline formatting', () => {
    it('renders bold with **', () => {
      const result = parseMarkdown('**bold**');
      assert.match(result.html, /<strong>bold<\/strong>/);
    });

    it('renders italic with *', () => {
      const result = parseMarkdown('*italic*');
      assert.match(result.html, /<em>italic<\/em>/);
    });

    it('renders inline code with backticks', () => {
      const result = parseMarkdown('`code`');
      assert.match(result.html, /<code>code<\/code>/);
    });

    it('renders links', () => {
      const result = parseMarkdown('[text](https://example.com)');
      assert.match(result.html, /<a href="https:\/\/example\.com"[^>]*>text<\/a>/);
    });
  });

  describe('paragraphs', () => {
    it('wraps bare text in paragraphs', () => {
      const result = parseMarkdown('Hello world');
      assert.match(result.html, /<p>Hello world<\/p>/);
    });

    it('separates paragraphs with blank lines', () => {
      const result = parseMarkdown('Para one.\n\nPara two.');
      assert.match(result.html, /<p>Para one\.<\/p>/);
      assert.match(result.html, /<p>Para two\.<\/p>/);
    });
  });
});
```

- [ ] **Step 2: Run unit tests to verify they pass**

```bash
cd tests && node --test unit/md-parser.test.mjs
```
Expected: All tests pass (no failures)

- [ ] **Step 3: Commit**

```bash
git add tests/unit/md-parser.test.mjs
git commit -m "feat: add md-parser unit tests"
```

---

### Task 4: Write `tests/integration/sidebar-nav.test.mjs`

**Files:**
- Create: `tests/integration/sidebar-nav.test.mjs`

- [ ] **Step 1: Write sidebar navigation integration tests**

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { waitForServer, launchBrowser } from '../helpers.mjs';

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
    await page.goto('http://localtest.me:8080/work-experience/easycrypto', { waitUntil: 'networkidle2', timeout: 15000 });
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
        if (a.textContent === 'Veve') {
          a.click();
          break;
        }
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
        if (a.textContent === 'Hectre') {
          a.click();
          break;
        }
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
        if (a.textContent === 'Overview') {
          a.click();
          break;
        }
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
```

- [ ] **Step 2: Run integration tests to verify**

```bash
cd tests && node --test integration/sidebar-nav.test.mjs
```
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration/sidebar-nav.test.mjs
git commit -m "feat: add sidebar navigation integration tests"
```

---

### Task 5: Write `tests/integration/routing.test.mjs`

**Files:**
- Create: `tests/integration/routing.test.mjs`

- [ ] **Step 1: Write routing integration tests**

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { waitForServer, launchBrowser } from '../helpers.mjs';

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
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 500));

    const title = await page.evaluate(() => document.querySelector('h1')?.textContent);
    assert.ok(title, 'Should render a section heading');
  });

  it('navigates to Full CV via top nav', async () => {
    await page.evaluate(() => {
      const links = document.querySelectorAll('header nav a');
      for (const a of links) {
        if (a.textContent === 'Full CV') {
          a.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const url = await page.url();
    assert.ok(url.endsWith('/full'), `URL should end with /full, got ${url}`);
  });

  it('renders correct section via direct URL', async () => {
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 500));

    const title = await page.evaluate(() => document.querySelector('h1')?.textContent);
    assert.strictEqual(title, 'Projects');

    const url = await page.url();
    assert.ok(url.endsWith('/projects'), `URL should end with /projects, got ${url}`);
  });
});
```

- [ ] **Step 2: Run routing tests**

```bash
cd tests && node --test integration/routing.test.mjs
```
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration/routing.test.mjs
git commit -m "feat: add routing integration tests"
```

---

### Task 6: Update `mise.toml` with test tasks

**Files:**
- Modify: `mise.toml`

- [ ] **Step 1: Add test tasks to mise.toml**

Read the current mise.toml first, then append:

```toml
[tasks.install-test-deps]
dir = "tests"
sources = ["package.json"]
outputs = { auto = true }
run = "npm install --silent"

[tasks.test-unit]
dir = "tests"
depends = ["install-test-deps"]
run = "node --test unit/*.test.mjs"

[tasks.test-integration]
dir = "tests"
depends = ["install-test-deps"]
run = """
python3 ../server.py &
SERVER_PID=$!
sleep 2
node --test --test-concurrency=1 integration/*.test.mjs
EXIT_CODE=$?
kill $SERVER_PID 2>/dev/null
exit $EXIT_CODE
"""

[tasks.test]
depends = ["test-unit", "test-integration"]
```

- [ ] **Step 2: Verify tasks work**

```bash
mise run test-unit
```
Expected: md-parser tests pass

```bash
mise run test-integration
```
Expected: sidebar-nav and routing tests pass

```bash
mise run test
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add mise.toml
git commit -m "feat: add test tasks to mise.toml"
```

---

### Task 7: Update TESTING.md

**Files:**
- Modify: `TESTING.md`

- [ ] **Step 1: Add automated test section to TESTING.md**

Read current TESTING.md, then add or update to include:

```markdown
## 6. Automated Test Suite

The project has an automated test suite in `tests/`. Run with mise:

```bash
mise run test         # Run all tests
mise run test-unit    # Run unit tests only (fast, no browser)
mise run test-integration  # Run browser integration tests
```

### Test Structure
- `tests/unit/` — md-parser unit tests (Node built-in test runner)
- `tests/integration/` — Browser integration tests (Puppeteer)
- `tests/helpers.mjs` — Shared test utilities
```

- [ ] **Step 2: Commit**

```bash
git add TESTING.md
git commit -m "docs: add automated test suite instructions to TESTING.md"
```

---

### Task 8: Run full test suite and verify

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
mise run test
```
Expected: All unit and integration tests pass. Fix any issues found.

- [ ] **Step 2: Verify tests don't require any root-level install**

```bash
ls package.json 2>/dev/null && echo "FAIL: root package.json exists" || echo "PASS: no root package.json"
```
Expected: "PASS: no root package.json"

- [ ] **Step 3: Final verification — run unit tests with no prior install**

```bash
rm -rf tests/node_modules
cd tests && node --test unit/*.test.mjs
```
Expected: Tests pass (unit tests have zero deps, don't need npm install)
