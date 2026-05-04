// js/app.js
import { getSitemap } from './sitemap.js';
import { getConfig } from './config.js';
import { parseMarkdown } from './md-parser.js';
import './components/experience-entry.js';
import './components/project-entry.js';

const BASE_PATH = window.location.pathname.startsWith('/cv-app/') ? '/cv-app' : '';

function getPageFromPath(path) {
    const stripped = path.replace(new RegExp('^' + BASE_PATH + '/?'), '');
    return stripped === '' ? null : stripped.replace(/\.html$/, '');
}

async function renderSection(page) {
    const sitemap = await getSitemap();
    const config = await getConfig();
    document.body.dataset.name = config.name;
    
    let mdPath = '';
    const main = document.querySelector('main');
    main.innerHTML = '';
    
    if (page === 'full') {
        const { renderFull } = await import('./full-renderer.js');
        return renderFull(main);
    }
    
    const section = sitemap.find(s => {
        if (s.path && s.path.includes(page)) return true;
        if (s.children && s.children.some(c => c.includes(page))) return true;
        return s.title.toLowerCase().replace(/\s+/g, '-') === page;
    }) || sitemap[0];
    
    const titleEl = document.createElement('h1');
    titleEl.textContent = section.title;
    main.appendChild(titleEl);
    
    if (section.path) {
        mdPath = section.path;
        const res = await fetch(section.path);
        const md = await res.text();
        const { html } = parseMarkdown(md);
        main.innerHTML += html;
    } else if (section.children) {
        for (const childPath of section.children) {
            mdPath = childPath;
            const res = await fetch(childPath);
            const md = await res.text();
            const parsed = parseMarkdown(md);
            const entry = document.createElement(section.title.includes('Project') ? 'project-entry' : 'experience-entry');
            entry.dataset.content = JSON.stringify(parsed);
            main.appendChild(entry);
        }
    }
    
    let altLink = document.querySelector('link[rel="alternate"]');
    if (!altLink) { altLink = document.createElement('link'); altLink.rel = 'alternate'; altLink.type = 'text/markdown'; document.head.appendChild(altLink); }
    altLink.href = mdPath || 'index.md';
}

async function buildNav() {
    const sitemap = await getSitemap();
    const nav = document.querySelector('nav');
    sitemap.forEach(section => {
        const a = document.createElement('a');
        const slug = section.title.toLowerCase().replace(/\s+/g, '-');
        a.href = `${BASE_PATH}/${slug}`;
        a.textContent = section.title;
        nav.appendChild(a);
    });
    const fullLink = document.createElement('a');
    fullLink.href = `${BASE_PATH}/full`;
    fullLink.textContent = 'Full CV';
    nav.appendChild(fullLink);
}

function handleInitialLoad() {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam) {
        const prettyPath = `${BASE_PATH}/${pageParam}`;
        window.history.replaceState(null, '', prettyPath);
        return pageParam;
    }
    return getPageFromPath(window.location.pathname);
}

async function init() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('js/sw.js');
    }
    await buildNav();
    const page = handleInitialLoad();
    await renderSection(page);
    
    navigation.addEventListener('navigate', event => {
        if (!event.canIntercept) return;
        const url = new URL(event.destination.url);
        const page = getPageFromPath(url.pathname);
        event.intercept({ handler: () => renderSection(page) });
    });
}

init();