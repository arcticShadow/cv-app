# Manual Testing Checklist

Run these tests after all implementation is complete.

## 0. Automated Test Suite

Run automated tests first:

```bash
mise run test         # Run all tests
mise run test-unit    # Run unit tests only (fast, no browser)
mise run test-integration  # Run browser integration tests
```

### Test Structure
- `tests/unit/` — md-parser unit tests (Node built-in, zero deps)
- `tests/integration/` — Browser integration tests (Puppeteer)
- `tests/helpers.mjs` — Shared test utilities (server wait, browser launch)

## 1. Local Server Test

```bash
caddy run
# Visit http://localhost:8080/
# Click nav links, verify pretty URLs (/work-experience, /projects, /full)
# Verify back/forward buttons work
# Visit http://localhost:8080/nonexistent - should redirect to /?page=nonexistent then /nonexistent
```

## 2. PDF Generation Test

```bash
./bin/build_cv
# Verify cv.pdf is created
# Open cv.pdf, check proper A4 sizing, page breaks, link expansion
```

## 3. Lighthouse Test

```bash
# Install if needed: npm i -g lighthouse
lighthouse http://localhost:8080/ --preset=desktop --output=html
# Check Accessibility, Performance, SEO scores are 100 (or close)
```

## 4. Offline Mode Test

```
1. In Chrome DevTools > Application > Service Workers, verify SW is registered
2. Check "Offline" in DevTools > Network
3. Reload page - should still work from cache
```

## 5. Placeholder Replacement

Before first deploy, replace these placeholders in:
- `config.json`: name, github_repo_url
- `index.html`: Your Full Name, yourusername, your-cv-repo
- `manifest.json`: Your Full Name
- `favicon.svg`: Optional - customize the design
