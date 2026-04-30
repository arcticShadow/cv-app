// js/components/project-entry.js
export class ProjectEntry extends HTMLElement {
    connectedCallback() {
        const { frontmatter, html } = JSON.parse(this.dataset.content);
        this.innerHTML = `
            <h3><a href="${frontmatter.url}">${frontmatter.title || frontmatter.name}</a></h3>
            <div class="meta">${frontmatter.tech_stack || ''} | ${frontmatter.start_date} - ${frontmatter.end_date || 'Present'}</div>
            ${html}
        `;
    }
}
customElements.define('project-entry', ProjectEntry);