# AI Guidance for CV App (Engineered Slate)

This repo contains a Standards-First CV web application built with zero dependencies, native browser APIs, and a "proper but frugal" philosophy.

## Project Overview

The CV App is a static site that renders markdown content client-side, with PDF generation via headless Chromium. It uses a "Technical Ledger" aesthetic inspired by GitHub dark mode and professional IDEs.

**Core Philosophy**: Standards-First — Zero JS frameworks, browser-native APIs, proper & frugal engineering.

## Architecture & Layer System

### CSS Layer Order (Explicit)
```css
@layer reset, brand, base, components, layout, print;
```

1. **reset** (lowest specificity): Box-sizing, margin/padding zero, base font inheritance
2. **brand**: ALL color tokens for "Engineered Slate" theme (see Brand Layer section)
3. **base**: Spacing tokens, typography tokens, element defaults (references brand layer)
4. **components**: Custom element styles (`experience-entry`, `project-entry`)
5. **layout**: Header, nav, main container, responsive breakpoints
6. **print** (highest specificity): Paper output overrides, A4 sizing, page breaks

### Key Architectural Decisions
- **Navigation API** (NOT History API): Uses `navigation` interface for SPA routing
- **Pretty URLs via 404.html hack**: GitHub Pages SPA support without query params in address bar
- **Custom Elements WITHOUT Shadow DOM**: Uses global CSS custom properties, no style isolation
- **Modular md-parser.js**: Swappable `parseMarkdown()` function for easy replacement
- **Service Worker**: Cache-first strategy for offline capability
- **PDF Generation**: mise-managed Caddy + Chromium headless, self-bootstrapping script

## Brand Layer (Theme: "Engineered Slate")

### Identity
- Professional, precise, unpretentious
- Conveys content built the "proper" way — like a high-density dashboard or technical manual
- Frugal on OLED screens (dark palette saves battery)
- "Competence Porn" aesthetic inspired by GitHub dark mode

### Color Tokens (Defined in `@layer brand`)
```css
:root {
    /* Background & Text */
    --bg-primary: #0D1117;      /* Deep "Obsidian" slate */
    --text-primary: #E6EDF3;     /* Off-white "Cloud" grey, reduces eye strain */

    /* Brand Colors */
    --brand-green: #2EA043;       /* "Success Green" — buttons, active states ONLY */
    --link-cyan: #58A6FF;         /* "Blueprint Blue" — links */
    --text-muted: #8B949E;         /* Metadata, secondary info */

    /* Print Override Colors (consumed by print layer) */
    --print-bg: #FFFFFF;            /* White for paper */
    --print-text: #1A1A1A;        /* Black for paper */
    --print-brand: #1B662C;        /* Darker green for paper legibility */
}
```

### Color Usage Rules
- **--text-primary**: Headings (h1-h3), body text, nav text, custom element headings
- **--brand-green**: Buttons, active states ONLY (NOT headings — established practice)
- **--link-cyan**: All anchor tags
- **--text-muted**: Metadata (`.meta` class), secondary info, nav inactive state
- **Print layer**: Overrides `--bg-primary`, `--text-primary`, `--brand-green` using `--print-*` tokens

### Print Overrides
The `print` layer (highest specificity) flips colors for paper:
```css
@media print, body[data-view="print"] {
    :root {
        --bg-primary: var(--print-bg);
        --text-primary: var(--print-text);
        --brand-green: var(--print-brand);
    }
}
```

## Layout: "Technical Ledger" Aesthetic

### Structure
- **Sticky Header**: Glassmorphism effect (blur 10px, saturate 180%, 5% white noise), border-bottom `#30363d`
- **Nav**: 4-item horizontal layout, monospace tokens, active state with `--text-primary` underline
- **Main Container**:
  - 720px max-width, centered
  - 1px solid `#30363d` border
  - 8px border-radius
  - 2rem padding ("air" for engineering spec sheet feel)
  - Flex column with `gap: var(--space-md)` for vertical rhythm

### Responsive
- Mobile breakpoint: 768px
- Header stacks vertically, nav wraps, main goes full-width with reduced padding

## Typography & Spacing

### Font Settings
- **Global**: `--font-mono: 'SF Mono', Monaco, 'Courier New', monospace`
- **Headings**: `--text-primary`, monospace family
- **Compact sizes** (dense ledger feel):
  - `--text-base: clamp(0.875rem, 1vw, 1rem)`
  - `--text-h1: clamp(1.25rem, 2.5vw, 2rem)`
  - `--text-h2: clamp(1.1rem, 2vw, 1.6rem)`
  - `--text-h3: clamp(1rem, 1.5vw, 1.25rem)`

### Spacing Tokens (in `@layer base`)
```css
--space-xs: clamp(0.25rem, 0.5vw, 0.5rem);
--space-sm: clamp(0.5rem, 1vw, 1rem);
--space-md: clamp(1rem, 2vw, 1.5rem);
--space-lg: clamp(1.5rem, 3vw, 2rem);
```

### Content Flow (in `@layer base`)
- Headings: margin-top using `--space-md`/`--space-sm`
- Paragraphs: `margin: 0 0 var(--space-sm) 0`
- Lists: `padding-left: var(--space-md)`
- Main container: `display: flex; flex-direction: column; gap: var(--space-md);`

### Code Blocks
- Background: `#1a1a2e` (darker inset shade)
- Padding: `0.2em 0.5em`
- Border-radius: `0.5rem` (established practice)

## Content & Routing

### sitemap.json Structure
Top-level array defining section order. Supports two entry types:
1. **Single-file**: `{ "title": "Overview", "path": "content/overview.md" }`
2. **Rollup section**: `{ "title": "Work Experience", "children": ["content/experience/lead-dev.md"] }`

### Markdown Content
- Location: `content/` directory
- Format: YAML frontmatter (delimited by `---`) + markdown body
- Frontmatter: `title` (required), plus section-specific fields (`company`, `role`, `url`, etc.)
- No nested rollups (avoids recursion)

### config.json
User-specific values (replaces placeholders):
```json
{ "name": "Your Full Name", "github_repo_url": "https://github.com/yourusername/your-cv-repo" }
```

### SPA Routing (Navigation API)
- Uses `navigation` interface (NOT `history.pushState`)
- 404.html captures pretty paths, redirects to `/?page=<path>`
- App reads `?page=`, uses `navigation.navigate('/path')` to set pretty URL
- Back/forward buttons work natively
- Full CV view: `/full` path, renders all sections to `<main>`

## PDF Generation

### Mise Configuration
```toml
[tools]
caddy = "2"          # Resolves to latest 2.x
chromium = "latest"

[tasks.pdf]
run = """
caddy file-server --listen :8080 &
# ... chromium --headless --print-to-pdf=cv.pdf
"""
```

### Build Scripts
- `bin/mise-bootstrap.sh`: Generated via `mise generate bootstrap`, auto-installs mise
- `bin/build_cv`: Runs bootstrap, then `mise run pdf`
- Developer shortcut: Direct `mise run pdf` if mise already installed

### PDF-Specific
- Internal-only param `?view=print` activates `body[data-view="print"]` styles
- Never visible to end users in address bar
- Triggers print layer overrides (A4, margins, page breaks, link expansion)

## Component Architecture

### Custom Elements (No Shadow DOM)
- `<experience-entry>`: Renders job entries with frontmatter + parsed HTML
- `<project-entry>`: Renders project entries with frontmatter + parsed HTML
- Both use `dataset.content` to receive JSON `{ frontmatter, html }`
- Styled via global CSS (`@layer components`), not Shadow DOM

### MD Parser (`js/md-parser.js`)
- Exports single `parseMarkdown(mdString)` function
- Returns `{ frontmatter: {}, html: '' }`
- Capabilities: YAML frontmatter extraction, 6 heading levels, bold/italic/code/links, paragraph wrapping
- **Swappable**: Replace only this function to change parsers

## File Structure
```
/
├── index.html              # App shell, semantic HTML, meta/social tags
├── 404.html               # SPA hack for GitHub Pages
├── config.json             # User name, repo URL (replace placeholders!)
├── sitemap.json           # Section order + file paths
├── mise.toml              # Tool versions + pdf task
├── manifest.json          # PWA manifest
├── favicon.svg            # Single SVG favicon
├── index.md               # LLM/crawler discovery
├── cv.pdf                 # Generated PDF (gitignored)
├── css/
│   └── style.css         # Single CSS file, all @layers
├── js/
│   ├── app.js            # Navigation API router, content renderer
│   ├── md-parser.js     # Swappable markdown parser
│   ├── config.js         # Loads config.json
│   ├── sitemap.js        # Loads sitemap.json
│   ├── sw.js             # Service Worker
│   ├── full-renderer.js  # Dynamic import for /full page
│   └── components/
│       ├── experience-entry.js
│       └── project-entry.js
├── content/
│   ├── overview.md
│   ├── experience/
│   └── projects/
├── bin/
│   ├── mise-bootstrap.sh # Generated via mise generate bootstrap
│   └── build_cv         # Self-bootstrapping PDF build
├── .github/
│   └── workflows/
│       ├── deploy.yml    # GH Pages deployment
│       └── pdf-release.yml  # PDF on git tag
└── TESTING.md            # Manual testing checklist
```

## Development Workflow

### Parallel Workstreams
This project was built using parallel subagent workstreams:
1. Foundation (mise, config, build scripts)
2. Content (sitemap + markdown)
3. CSS Design System
4. JS Core Logic (parser, config, router, components)
5. HTML/Meta (index.html, 404.html)
6. PWA Assets (manifest, favicon, index.md)
7. Service Worker
8. CI/CD (GitHub Actions)
9. Testing Checklist

### Commit Convention
- `feat:` for new features
- `fix:` for corrections to established practices
- `docs:` for documentation
- Detailed commit messages explaining WHY (not what)

## Important Notes

- **Replace placeholders** in `config.json`, `index.html`, `manifest.json` before first deploy
- **Zero frameworks**: No React, Vue, Tailwind, Vite — native browser APIs only
- **Brand-green is NOT for headings**: Established practice reserves it for buttons/active states
- **Print overrides in print layer**: Don't modify brand layer for paper output
- **Test locally**: Use `caddy file-server` for local development
- **Lighthouse target**: 100/100 for accessibility and performance

## Session Handoff (2026-04-30)

**Moved from mdm-experiment**: All `docs/superpowers/` files moved to this repo (`docs/superpowers/specs/`, `docs/superpowers/plans/`).

**Current State**:
- 19 commits in `/Users/cole/repos/cv-app`
- All workstreams complete (Foundation, Content, CSS, JS, HTML, PWA, SW, CI/CD)
- Theme: "Engineered Slate" with brand layer implemented
- Layout: "Technical Ledger" (720px centered, glassmorphism header, vertical rhythm)
- Compact typography and consistent spacing applied

**Next Steps for New Agent**:
1. Review `AGENTS.md` (this file) for all established practices
2. Replace placeholders in `config.json`, `index.html`, `manifest.json`
3. Create GitHub repo, push code, enable GitHub Pages
4. Run through `TESTING.md` for validation
5. Populate real CV content in `content/` markdown files

**Key Constraint**: This session used parallel subagent workstreams. Future work should follow the same Standards-First, zero-dependency philosophy.

## Current Focus

With the "Engineered Slate" theme and "Technical Ledger" layout now complete, future work may involve:
1. Content population (replace example markdown with real CV data)
2. Additional sections or entry types
3. Theme variants (new brand layer swapping)
4. Enhanced print layout (running headers, advanced page breaks)
5. Analytics integration (cookieless only, per Standards-First)
