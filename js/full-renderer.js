// js/full-renderer.js
import { getSitemap } from './sitemap.js';
import { getConfig } from './config.js';
import { parseMarkdown } from './md-parser.js';
import './components/experience-entry.js';
import './components/project-entry.js';

export async function renderFull(mainEl) {
    const sitemap = await getSitemap();
    const config = await getConfig();
    document.body.dataset.name = config.name;
    
    mainEl.innerHTML = '';
    for (const section of sitemap) {
        const sectionEl = document.createElement('section');
        const titleEl = document.createElement('h2');
        titleEl.textContent = section.title;
        sectionEl.appendChild(titleEl);
        
        if (section.path) {
            const res = await fetch(section.path);
            const md = await res.text();
            const { html } = parseMarkdown(md);
            sectionEl.innerHTML += html;
        } else if (section.children) {
            for (const childPath of section.children) {
                const res = await fetch(childPath);
                const md = await res.text();
                const parsed = parseMarkdown(md);
                const entry = document.createElement(section.title.includes('Project') ? 'project-entry' : 'experience-entry');
                entry.dataset.content = JSON.stringify(parsed);
                sectionEl.appendChild(entry);
            }
        }
        mainEl.appendChild(sectionEl);
    }
}