# Test Suite Design

## Overview

Add a lightweight automated test suite to the CV app. Zero new root dependencies — tests live in `tests/` with their own `package.json`. Mise manages task execution.

## Test Categories

### Unit Tests (`tests/unit/`)
- Test `js/md-parser.js` using Node's built-in `node:test` and `node:assert` modules
- No browser, no puppeteer, no extra deps
- Covers: YAML frontmatter extraction, heading rendering, bold/italic/code/links, paragraph wrapping
- Each `.test.mjs` file imports the parser directly (ESM)

### Integration Tests (`tests/integration/`)
- Browser-based tests using Puppeteer
- Start the Python dev server, launch headless Chrome, run scenarios
- Covers: sidebar nav scroll behavior, top-level nav section changes, URL sync, back/forward, initial load scroll-to-item
- `helpers.mjs` provides `launchServer()`, `launchBrowser()`, cleanup

## Directory Structure

```
tests/
  package.json         # devDependency: puppeteer, type: module
  helpers.mjs          # shared test utilities
  unit/
    md-parser.test.mjs
  integration/
    sidebar-nav.test.mjs
    routing.test.mjs
```

### `tests/package.json`
```json
{
  "private": true,
  "type": "module",
  "devDependencies": {
    "puppeteer": "^24"
  }
}
```

### `tests/helpers.mjs`
Exports:
- `startServer()` — spawns `python3 ../server.py`, waits for ready, returns child process
- `stopServer(proc)` — kills the server process
- `launchBrowser()` — launches Puppeteer with `--no-sandbox`, returns `{ browser, page }`
- `withPage(url, callback)` — convenience: start server, launch browser, navigate, run callback, cleanup

## Mise Tasks

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
node --test integration/*.test.mjs
EXIT_CODE=$?
kill $SERVER_PID 2>/dev/null
exit $EXIT_CODE
"""

[tasks.test]
depends = ["test-unit", "test-integration"]
```

## Test Scenarios

### Sidebar Nav (`sidebar-nav.test.mjs`)
1. Load `/work-experience/easycrypto` — verify scroll position and active sidebar
2. Click VeVe in sidebar — verify smooth scroll (no re-render), active state, URL update
3. Click Hectre in sidebar — verify scroll down, active state changes
4. Click Overview in top nav — verify cross-section re-render, scroll to top
5. Click back — verify previous section restored with scroll position
6. Click Work Experience in top nav — verify section root renders at top

### Routing (`routing.test.mjs`)
1. Load `/` — verify default section renders
2. Click Full CV — verify `/full` renders all sections
3. Direct URL `/work-experience` — verify correct section
4. Direct URL `/projects` — verify correct section

### Md Parser (`md-parser.test.mjs`)
1. Frontmatter extraction with valid YAML
2. Frontmatter absent — returns empty object
3. Heading levels h1-h6 rendered as `<h1>`-`<h6>`
4. Bold `**text**` → `<strong>text</strong>`
5. Italic `*text*` → `<em>text</em>`
6. Inline code `` `code` `` → `<code>code</code>`
7. Links `[text](url)` → `<a href="url">text</a>`
8. Paragraph wrapping of bare text

## Implementation Order

1. Create `tests/` directory with `package.json` and `helpers.mjs`
2. Write `tests/unit/md-parser.test.mjs`
3. Write `tests/integration/sidebar-nav.test.mjs`
4. Write `tests/integration/routing.test.mjs`
5. Update `mise.toml` with test tasks
6. Run full suite and fix any issues
7. Remove old manual `TESTING.md` or cross-reference

## Key Decisions

- **No root `package.json`** — root stays zero-dependency, `tests/package.json` keeps deps contained
- **Puppeteer over Playwright** — already available via chrome-devtools skill, simpler setup
- **Node `--test` runner** — zero deps for unit tests, modern API (`test`, `describe`, `it`, `assert`)
- **`outputs = { auto = true }` on install task** — mise auto-detects output changes for caching
- **`dir` on mise tasks** — keeps commands clean (no `cd tests && ...` needed)
- **Server managed by test task** — no external server dependency, integration tests are self-contained
