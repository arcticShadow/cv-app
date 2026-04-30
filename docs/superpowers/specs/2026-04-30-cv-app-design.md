# CV App Design Specification
**Date**: 2026-04-30
**Target Repo**: Standalone public GitHub repository (name TBD)
**Core Philosophy**: Standards-First (Zero Dependencies, Browser-Native, Proper & Frugal)

---

## Design Section 1: Repository & SPA Routing Architecture
1. **Repo Structure**:
   - `index.html`: Entry point, loads ESM `app.js`, semantic HTML shell (`<header>`, `<nav>`, `<main>`)
   - `404.html`: GitHub Pages SPA hack (no sessionStorage)
   - `sitemap.json`: Top-level array with single-file (`path`) and rollup (`children`) sections
   - `content/`: Markdown files for all CV sections/entries
   - `css/style.css`: Single CSS file with `@layer` (reset, base, print), custom properties
   - `js/`: ESM modules: `app.js` (Navigation API router), `md-parser.js` (swappable minimal parser), `components/` (custom elements)
   - `bin/build_cv`: Mise-bootstrapped script for local PDF generation via headless Chromium
   - `bin/mise-bootstrap.sh`: Standalone mise installer generated via `mise generate bootstrap`
   - `mise.toml`: Configures Caddy@2 and Chromium for PDF builds
   - `manifest.json`: PWA manifest
   - `favicon.svg`: Single SVG favicon
   - `index.md`: Root markdown file for LLM/crawler discovery

2. **Navigation API Router (No History API, Pretty URLs Only)**:
   - Uses only the modern Browser Navigation API (no `pushState`/`replaceState`).
   - **GitHub Pages 404.html Hack**:
     - Visiting pretty path `/work-experience` triggers 404.html (no static file exists).
     - 404.html script extracts `window.location.pathname`, strips leading `/`, redirects to `/?page=work-experience` (temporary query param).
   - **Index.html Load Handling**:
     - App reads `?page=` param from URL on load.
     - Uses `navigation.navigate(`/${pageParam}`)` to immediately set the pretty URL (e.g., `/work-experience`) in the address bar, removing the query param entirely.
     - Renders the matching section to `<main>`.
   - **Client-side Navigation**:
     - Intercepts `navigate` events for in-app links, uses `navigation.navigate('/section-path')` to update URL to pretty path with no reload.
     - Back/forward buttons work natively via Navigation API.
   - **Full/PDF View**:
     - Pretty path `/full` works identically: 404.html redirects to `/?page=full`, app navigates to `/full`, renders all sitemap sections to `<main>`.
     - Headless Chromium for PDF uses internal-only `?view=print` param (never visible to end users) for optional print CSS tweaks.

---

## Design Section 2: Content Layer (Markdown, Sitemap, Parser)
1. **Markdown File Convention**:
   - All content lives in `content/` directory, paths match `sitemap.json` exactly.
   - Single-file sections (e.g., `content/overview.md`): Standalone pages with no children.
   - Rollup section entries (e.g., `content/experience/lead-dev.md`): One file per job/project, grouped under their parent section heading.
   - Mandatory YAML frontmatter (delimited by `---`) per file:
     - Shared: `title` (required, used for headings/nav labels)
     - Experiences: `company`, `role`, `start_date`, `end_date`, `website`, `location`
     - Projects: `name`, `url`, `tech_stack`, `start_date`, `end_date`
   - No nested directories beyond `content/<section>/` to keep sitemap parsing simple.

2. **sitemap.json Specification**:
   - Top-level array, order = section order in nav/PDF/full view.
   - Single-file entry format: `{ "title": "Overview", "path": "content/overview.md" }`
   - Rollup entry format: `{ "title": "Work Experience", "children": ["content/experience/lead-dev.md", "content/experience/senior-dev.md"] }`
   - No nested rollups (avoids recursion, keeps parsing lightweight).

3. **Root `config.json`**:
    - Stores user-specific values (replaces all [Your Name]/<github-repo-url> placeholders):
      ```json
      { "name": "Your Full Name", "github_repo_url": "https://github.com/yourusername/your-cv-repo" }
      ```
    - Loaded by `js/config.js` on init, used for print header name, page titles, footer repo link.

4. **Modular Minimal MD Parser (`js/md-parser.js`)**:
   - ESM module exporting a single `parseMarkdown(mdString)` function (swappable: replace only this function to change parsers).
   - Exact requested capabilities:
     - Extract YAML frontmatter (parse `---` delimiters, return `frontmatter` object + raw markdown body)
     - Convert 6 heading levels (`#`–`######` → `<h1>`–`<h6>`)
     - Parse bold (`**text**` → `<strong>text</strong>`), italic (`*text*` → `<em>text</em>`)
     - Parse inline code (`` `code` `` → `<code>code</code>`)
     - Parse anchor tags (`[text](url)` → `<a href="url">text</a>`)
     - Wrap consecutive non-heading lines in `<p>` tags
   - Zero dependencies, uses only native JS string/regex operations.
   - Output: `{ frontmatter: {}, html: '' }` for direct DOM injection.

4. **Crawler-Friendly Metadata**:
   - Dynamically update `<link rel="alternate" type="text/markdown" href="<current-md-path>">` in `<head>` when rendering a section.
   - Root `index.md` provides LLM-ready content for the app shell.

---

## Design Section 3: Design System (CSS)
1. **Single CSS File & Layer Structure**:
   - All styles in `css/style.css` (single file, no build tools).
   - Ordered `@layer` stack (lowest to highest specificity):
     1. `reset`: Modern CSS reset (box-sizing, margin/padding zero, base font inheritance)
     2. `base`: Typography, color, spacing tokens via CSS custom properties in `:root`
     3. `components`: Styles for semantic HTML elements and custom elements (no utility classes, no Shadow DOM)
     4. `layout`: CSS Grid/Flexbox for nav + main structure, semantic selectors only
     5. `print`: `@media print` and `body[data-view="print"]` rules for PDF output
   - No `!important`; layer order manages all specificity.

2. **CSS Custom Properties (Tokens in `:root`)**:
   - Colors: `--color-text`, `--color-bg`, `--color-accent`, `--color-link` (WCAG 2.1 AA contrast compliant)
   - Spacing: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg` (fluid via `clamp()`)
   - Typography: `--font-sans`, `--font-mono`, `--text-base` (clamp(1rem, 1.2vw, 1.25rem)), `--text-h1` to `--text-h6` (fluid scaling)
   - Print-specific: `--print-font-size: 12pt` (physical unit for PDF legibility)

3. **Fluid Typography & Layout**:
   - All font sizes use `clamp()` for viewport-responsive scaling (no breakpoint media queries for type).
   - Layout uses CSS Grid for main structure (2-column nav + main on desktop, single column on mobile via grid template adjustments).
   - Flexbox for inline alignment (nav items, experience entry headers).
   - No utility classes; all styling via semantic selectors (`nav a`, `main section`, `article h2`, custom element tag names like `experience-entry`).

4. **Print-Specific Styles (`@layer print`)**:
   - Activated via `@media print` or `body[data-view="print"]` (for headless Chromium PDF builds).
   - Override base layer: Switch font sizes to `pt` units, remove background colors, force black text on white.
   - Layout: Force single-column, hide non-essential elements (nav, footer, interactive buttons).
   - Pagination rules:
     - `break-before: page` on each top-level section (experience, projects, etc.)
     - `orphans: 3; widows: 3` on all `p` and `li` elements
     - `a::after { content: " (" attr(href) ")"; }` to expand links for static PDF
      - `@page { size: A4; margin: 2cm; @top-center { content: "CV - " attr(data-name); } }` (running header, reads name from body data attribute set by config.json)

5. **Accessibility & Performance**:
   - Focus states defined for all interactive elements with visible outlines.
   - `@media (prefers-reduced-motion)` support for any transitions.
   - All color contrasts meet WCAG 2.1 AA standards (verified via Lighthouse in CI).
   - No unused CSS; all selectors map to existing HTML/Custom Elements.

---

## Design Section 4: Logic Layer (ESM & Web Components)
1. **ESM Module Structure**:
   - All JS in `js/` directory, loaded via `<script type="module" src="js/app.js">` in index.html (no bundlers, native browser modules).
    - Static imports for core lightweight logic: `js/md-parser.js` (swappable `parseMarkdown` function), `js/sitemap.js` (fetches/caches `sitemap.json` once on load), `js/config.js` (loads `config.json` for user-specific values).
   - Dynamic imports for heavy logic: `js/full-renderer.js` (only loaded when `/full` page is accessed, handles rendering all sitemap sections to `<main>` to keep initial payload light).

2. **Navigation API Router**:
   - Uses only the browser `navigation` interface (no History API `pushState`/`replaceState`), compatible with evergreen browsers.
   - Intercepts `navigate` events to handle in-app link clicks, prevents full page reload, uses `navigation.navigate('/section-path')` to update the address bar to pretty URLs.
   - Initial load handling: Reads `?page=` query param (from 404.html redirect), immediately calls `navigation.navigate(`/${pageParam}`) to set the pretty URL (removes query param from visible address bar), then triggers section rendering.
   - Native back/forward button support via Navigation API event listeners.

3. **Custom Elements (No Shadow DOM)**:
   - `<experience-entry>`: Renders job experience entries using passed `frontmatter` (company, role, dates) and parsed HTML content. Uses global CSS custom properties from `style.css`, no Shadow DOM.
   - `<project-entry>`: Renders project entries with frontmatter (name, url, tech stack) and content, same styling approach as experience entries.
   - No `<section-heading>` custom element; uses semantic `<h2>`/`<h3>` tags directly for section headings per feedback.

4. **Content Rendering Flow**:
   - Single-file section: Fetch markdown → parse with `md-parser.js` → inject HTML into `<main>` → no custom elements needed (static content).
   - Rollup section: Iterate `children` array → fetch each child markdown file → parse each → render via `<experience-entry>`/`<project-entry>` → wrap all entries in a `<section>` with semantic heading → append to `<main>`.
   - Full page (`/full`): Dynamic import of `full-renderer.js` → iterate all sitemap sections → render every section sequentially to `<main>` (matches normal page rendering, no separate print buffer).

---

## Design Section 5: PDF Generation & Mise Bootstrap
1. **Mise Bootstrap Script**:
   - Generated via `mise generate bootstrap > bin/mise-bootstrap.sh` (committed to repo, no runtime curl dependency).
   - This script validates if `mise` is installed, installs it automatically if missing, and configures the shell PATH for immediate use.

2. **`mise.toml` Configuration**:
   - Tools (no Python, uses Caddy instead):
     ```toml
     [tools]
     caddy = "2"  # Resolves to latest 2.x (2.11.2 current latest)
     chromium = "latest"  # Headless Chromium for PDF rendering
     ```
   - Task definition for PDF generation (run via `mise run pdf`):
     ```toml
     [tasks.pdf]
     run = """
     # Start Caddy static file server (serves repo root on :8080)
     caddy file-server --listen :8080 &
     CADDY_PID=$!

     # Wait for server to start, then run headless Chromium
     sleep 2
     chromium --headless --disable-gpu --print-to-pdf=cv.pdf --no-sandbox "http://localhost:8080/full?view=print"

     # Kill Caddy after PDF generation
     kill $CADDY_PID
     """
     ```

3. **`bin/build_cv` Flow (Noob-Friendly, Self-Bootstrapping)**:
   - Runs `bash bin/mise-bootstrap.sh` first (validates/installs mise if needed, no manual setup).
   - After bootstrap completes, runs `mise run pdf` (which uses mise-managed Caddy + Chromium).
   - Outputs `cv.pdf` to repo root, prints success message.

4. **Normal Developer Flow**:
   - No bootstrap needed if `mise` is already installed: directly run `mise run pdf` to generate `cv.pdf`.

5. **Internal `?view=print` Param**:
   - Only passed to Chromium during PDF generation, never exposed to end users.
   - Activates `body[data-view="print"]` print layer rules (A4 sizing, link expansion, page breaks, no nav/UI).

---

## Design Section 6: Meta & Social (Searchability Rule)
1. **SEO Meta Tags**: Standard `<meta name="description">` and `<meta name="keywords">` in index.html head.
2. **Open Graph**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type=website` in head.
3. **Twitter Cards**: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image` in head.
4. **Identity**: `rel="me"` on all social/profile links (including GitHub repo link) to establish cross-platform identity.
5. **Manifest & Favicon**:
   - `manifest.json` for PWA capabilities (name, short_name, start_url, display=standalone, icons with SVG source).
   - Single `favicon.svg` in repo root for high-density displays, referenced via `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`.

---

## Design Section 7: Non-Negotiable Compliance
Mapping user-provided checklist to design:
- [x] **Zero JS Frameworks**: All logic uses native ESM, Custom Elements, Navigation API, no React/Vue/etc.
- [x] **Semantic HTML**: Uses `<header>`, `<nav>`, `<main>`, `<article>`, `<section>` correctly.
- [x] **No Tracking Bloat**: No analytics by default; optional cookieless analytics via server logs only.
- [x] **Accessibility (A11y)**: WCAG 2.1 AA contrast, focus states, `prefers-reduced-motion` support, Lighthouse 100/100 target.
- [x] **Offline Ready**: Basic Service Worker caching all static assets (CSS, JS, Markdown, sitemap.json, favicon, manifest).
- [x] **Public Repo Link**: Visible, semantic link in footer: `<a href="<github-repo-url>">View Source on GitHub</a>`.

---

## Design Section 8: Service Worker (Offline Caching)
- Registered in `app.js` on initial load.
- Caches all static assets: `css/style.css`, `js/**/*.js`, `content/**/*.md`, `sitemap.json`, `favicon.svg`, `manifest.json`.
- Uses Cache-first strategy for assets, network fallback for dynamic content.
- Minimal implementation using native Service Worker API, no dependencies.

---

## Next Steps
1. Spec self-review (check for placeholders, contradictions, ambiguity, scope).
2. User reviews written spec.
3. Invoke `writing-plans` skill to create implementation plan.
