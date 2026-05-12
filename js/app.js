import { getSitemap } from './sitemap.js';
import { getConfig, BASE_PATH } from './config.js';
import { getContent } from './content-cache.js';
import './components/experience-entry.js';
import './components/project-entry.js';



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

async function buildSidebar(section, main) {
    if (!section.children) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'content-with-sidebar';
    
    const sidebar = document.createElement('aside');
    sidebar.className = 'section-nav';
    sidebar.innerHTML = '<nav></nav>';
    const nav = sidebar.querySelector('nav');
    
    const entries = await Promise.all(section.children.map(async (childPath) => {
        const fileName = childPath.split('/').pop().replace('.md', '');
        const { frontmatter } = await getContent(childPath);
        const label = frontmatter.company || frontmatter.name || fileName;
        const slug = (frontmatter.company || frontmatter.name || fileName)
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const a = document.createElement('a');
        a.href = `${BASE_PATH}/${section.title.toLowerCase().replace(/\s+/g, '-')}/${slug}`;
        a.textContent = label;
        return a;
    }));
    entries.forEach(a => nav.appendChild(a));
    
    const newMain = document.createElement('main');
    while (main.firstChild) {
        newMain.appendChild(main.firstChild);
    }
    
    wrapper.appendChild(sidebar);
    wrapper.appendChild(newMain);
    main.parentNode.replaceChild(wrapper, main);
}

let observer = null;
let currentItem = null;
let currentPage = null;

function setupScrollTracking() {
    if (observer) observer.disconnect();
    
    const entries = document.querySelectorAll('experience-entry, project-entry');
    if (entries.length === 0) return;
    
    observer = new IntersectionObserver((obsEntries) => {
        const visible = obsEntries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
            const id = visible.target.id;
            const path = window.location.pathname;
            const base = path.startsWith('/cv-app/') ? '/cv-app' : '';
            const stripped = path.replace(new RegExp('^' + base + '/?'), '');
            const page = stripped.split('/')[0];
            if (id && page && id !== currentItem) {
                currentItem = id;
                const newUrl = `${BASE_PATH}/${page}/${id}`;
                if (newUrl !== window.location.pathname) {
                    history.pushState(null, '', newUrl);
                }
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
        const oldMain = existingWrapper.querySelector('main');
        existingWrapper.parentNode.replaceChild(oldMain, existingWrapper);
    }
    
    let mdPath = '';
    let main = document.querySelector('main');
    main.innerHTML = '';
    
    if (page === 'full') {
        const { renderFull } = await import('./full-renderer.js');
        return renderFull(main);
    }
    
    const section = sitemap.find(s => {
        const slug = s.title.toLowerCase().replace(/\s+/g, '-');
        if (page === slug) return true;
        if (s.children && s.children.some(c => c.includes(page))) return true;
        return false;
    }) || sitemap[0];
    
    const titleEl = document.createElement('h1');
    titleEl.textContent = section.title;
    main.appendChild(titleEl);
    
    if (section.path) {
        mdPath = section.path;
        const { html } = await getContent(section.path);
        const contentSection = document.createElement('section');
        contentSection.innerHTML = html;
        main.appendChild(contentSection);
    } else if (section.children) {
        await buildSidebar(section, main);
        main = document.querySelector('main');
        for (const childPath of section.children) {
            mdPath = childPath;
            const parsed = await getContent(childPath);
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
        if (itemToScroll) currentItem = itemToScroll;
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
    currentPage = page;
    await renderSection(page, item);
    
    if (window.navigation) {
        navigation.addEventListener('navigate', event => {
            const url = new URL(event.destination.url);
            if (url.origin !== location.origin || !event.canIntercept || !event.userInitiated) return;
            
            const path = url.pathname.replace(new RegExp('^' + BASE_PATH), '') || '/';
            if (path === '/' || path === '/404.html') return;
            
            const clean = path.replace(/^\//, '');
            const parts = clean.split('/');
            const page = parts[0] || null;
            const item = parts[1] || null;
            
            if (page === currentPage && item) {
                event.preventDefault();
                currentItem = item;
                history.pushState(null, '', url.pathname);
                scrollToItem(item);
                document.querySelectorAll('.section-nav nav a').forEach(a => {
                    const href = a.getAttribute('href');
                    a.classList.toggle('active', href.endsWith('/' + item));
                });
                return;
            }
            
            event.intercept({
                handler: async () => {
                    currentItem = null;
                    currentPage = page;
                    await renderSection(page, item);
                }
            });
        });
    } else {
        window.addEventListener('popstate', () => {
            const { page, item } = handleInitialLoad();
            renderSection(page, item);
        });
    }
}

init();
