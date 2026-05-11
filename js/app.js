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

function getItemFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/^\/cv-app\/([^\/]+)\/(.+)$/);
    if (match) return { page: match[1], item: match[2] };
    const noBaseMatch = path.match(/^\/([^\/]+)\/(.+)$/);
    if (noBaseMatch && !noBaseMatch[1].includes('.')) return { page: noBaseMatch[1], item: noBaseMatch[2] };
    return null;
}

function updateNavActive(page) {
    const nav = document.querySelector('nav');
    nav.querySelectorAll('a').forEach(a => {
        const hrefPage = a.getAttribute('href').replace(BASE_PATH + '/', '').replace('/', '');
        a.classList.toggle('active', hrefPage === page || (page && hrefPage.startsWith(page)));
    });
}

function buildSidebar(section, main) {
    if (!section.children) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'content-with-sidebar';
    
    const sidebar = document.createElement('aside');
    sidebar.className = 'section-nav';
    sidebar.innerHTML = '<nav></nav>';
    const nav = sidebar.querySelector('nav');
    
    section.children.forEach(childPath => {
        const fileName = childPath.split('/').pop().replace('.md', '');
        const res = fetch(childPath).then(r => r.text()).then(md => {
            const { frontmatter } = parseMarkdown(md);
            const label = frontmatter.company || frontmatter.name || fileName;
            const slug = (frontmatter.company || frontmatter.name || fileName)
                .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const a = document.createElement('a');
            a.href = `${BASE_PATH}/${section.title.toLowerCase().replace(/\s+/g, '-')}/${slug}`;
            a.textContent = label;
            nav.appendChild(a);
        });
    });
    
    wrapper.appendChild(sidebar);
    wrapper.appendChild(main);
    main.parentNode.replaceChild(wrapper, main);
}

let observer = null;
let currentItem = null;

function setupScrollTracking() {
    if (observer) observer.disconnect();
    
    const entries = document.querySelectorAll('experience-entry, project-entry');
    if (entries.length === 0) return;
    
    currentItem = null;
    observer = new IntersectionObserver((obsEntries) => {
        const visible = obsEntries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
            const id = visible.target.id;
            const page = getPageFromPath(window.location.pathname);
            if (id && page && id !== currentItem) {
                currentItem = id;
                const newUrl = `${BASE_PATH}/${page}/${id}`;
                window.history.replaceState(null, '', newUrl);
                
                document.querySelectorAll('.section-nav nav a').forEach(a => {
                    const href = a.getAttribute('href');
                    a.classList.toggle('active', href.endsWith('/' + id));
                });
            }
        }
    }, { rootMargin: '-20% 0px -60% 0px' });
    
    entries.forEach(e => observer.observe(e));
}

async function scrollToItem(item) {
    await new Promise(r => setTimeout(r, 100));
    const el = document.getElementById(item);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function renderSection(page, itemToScroll = null) {
    const sitemap = await getSitemap();
    const config = await getConfig();
    document.body.dataset.name = config.name;
    
    const existingWrapper = document.querySelector('.content-with-sidebar');
    if (existingWrapper) {
        const main = existingWrapper.querySelector('main');
        existingWrapper.parentNode.replaceChild(main, existingWrapper);
    }
    
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
        const contentSection = document.createElement('section');
        contentSection.innerHTML = html;
        main.appendChild(contentSection);
    } else if (section.children) {
        buildSidebar(section, main);
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
    
    updateNavActive(page);
    
    requestAnimationFrame(() => {
        setupScrollTracking();
        if (itemToScroll) scrollToItem(itemToScroll);
    });
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
        const decoded = decodeURIComponent(pageParam);
        const parts = decoded.split('/');
        const page = parts[0];
        const item = parts[1] || null;
        const prettyPath = item ? `${BASE_PATH}/${page}/${item}` : `${BASE_PATH}/${page}`;
        window.history.replaceState(null, '', prettyPath);
        return { page, item };
    }
    const itemData = getItemFromUrl();
    if (itemData) return itemData;
    return { page: getPageFromPath(window.location.pathname), item: null };
}

async function init() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('js/sw.js');
    }
    await buildNav();
    const { page, item } = handleInitialLoad();
    await renderSection(page, item);
    
    navigation.addEventListener('navigate', event => {
        if (!event.canIntercept) return;
        const url = new URL(event.destination.url);
        const itemData = getItemFromPath(url.pathname);
        const page = itemData ? itemData.page : getPageFromPath(url.pathname);
        const item = itemData ? itemData.item : null;
        event.intercept({ handler: () => renderSection(page, item) });
    });
}

function getItemFromPath(pathname) {
    const match = pathname.match(/^\/cv-app\/([^\/]+)\/(.+)$/);
    if (match) return { page: match[1], item: match[2] };
    const noBaseMatch = pathname.match(/^\/([^\/]+)\/(.+)$/);
    if (noBaseMatch && !noBaseMatch[1].includes('.')) return { page: noBaseMatch[1], item: noBaseMatch[2] };
    return null;
}

init();