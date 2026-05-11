---
title: CV App
name: Standards-First CV App
url: https://github.com/arcticShadow/cv-app
tech_stack: JavaScript (ESM), CSS (@layer), HTML5, Caddy, Chromium, mise
start_date: 2026-04
end_date: null
---

A zero-dependency CV web app built entirely through AI-human collaboration — 100% coded by AI with human oversight directing how and what was built, and final say on what ships. If im being perfectly honest - this project has been my first attempt at 'not looking at the code' but rather focusing on the outputs. If its works, and it passed my validations then its fit for purpose. This project represents a new era of engineering: the engineer as orchestrator. Deep technical knowledge remains essential, but the skill now lies in conveying requirements and architectural decisions to AI to build.

## Philosophy

**Standards-First** — Zero frameworks, zero dependencies, pure browser-native APIs. If the browser doesn't support it natively, we don't use it.

## Technical Implementation

- **Navigation API** (not History API) for SPA routing — modern, purpose-built for this use case
- **CSS @layer** with explicit cascade order: reset → brand → base → components → layout → print
- **CSS custom properties** for theming — "Engineered Slate" dark theme with print layer overrides
- **Custom Elements** (without Shadow DOM) — reusable components with global CSS inheritance
- **Client-side markdown parsing** — swappable `parseMarkdown()` function, no external dependencies
- **Fluid typography** via `clamp()` — responsive sizing without media query bloat
- **GitHub Pages SPA** via 404.html hack — pretty URLs without address bar query params
- **Service Worker** with cache-first strategy for offline capability
- **PDF generation** via headless Chromium + Caddy — self-bootstrapping `mise` task
- **PWA manifest** for installability
- **`rel="me"` identity links** for cross-platform identity verification
- **Print layer overrides** — A4 sizing, page breaks, link expansion for paper output

## Development Approach

Built using parallel subagent workstreams (Foundation, Content, CSS, JS, HTML, PWA, SW, CI/CD) with systematic AGENTS.md documentation for session handoff and AI collaboration.
