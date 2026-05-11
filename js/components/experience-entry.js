// js/components/experience-entry.js
export class ExperienceEntry extends HTMLElement {
    connectedCallback() {
        const { frontmatter, html } = JSON.parse(this.dataset.content);
        const metaParts = [];
        const slug = (frontmatter.company || frontmatter.title || '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        if (frontmatter.company && !frontmatter.title?.includes(frontmatter.company.split(' (')[0])) {
            metaParts.push(frontmatter.company);
        }
        
        if (frontmatter.role && !frontmatter.title?.includes(frontmatter.role)) {
            metaParts.push(frontmatter.role);
        } else if (!frontmatter.role && frontmatter.title) {
            const roleMatch = frontmatter.title.match(/ - (.+)$/);
            if (roleMatch) metaParts.push(roleMatch[1]);
        }
        
        metaParts.push(`${frontmatter.start_date} - ${frontmatter.end_date || 'Present'}`);
        
        this.id = slug;
        this.innerHTML = `
            <h3>${frontmatter.title || frontmatter.company}</h3>
            <div class="meta">${metaParts.join(' | ')}</div>
            ${html}
        `;
    }
}
customElements.define('experience-entry', ExperienceEntry);