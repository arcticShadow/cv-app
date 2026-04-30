// js/components/experience-entry.js
export class ExperienceEntry extends HTMLElement {
    connectedCallback() {
        const { frontmatter, html } = JSON.parse(this.dataset.content);
        this.innerHTML = `
            <h3>${frontmatter.title}</h3>
            <div class="meta">${frontmatter.company} | ${frontmatter.role} | ${frontmatter.start_date} - ${frontmatter.end_date || 'Present'}</div>
            ${html}
        `;
    }
}
customElements.define('experience-entry', ExperienceEntry);