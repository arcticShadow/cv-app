// js/components/experience-entry.js
export class ExperienceEntry extends HTMLElement {
    connectedCallback() {
        const { frontmatter, html } = JSON.parse(this.dataset.content);
        const metaParts = [];
        
        // Show company if title doesn't already include it
        if (frontmatter.company && !frontmatter.title?.includes(frontmatter.company.split(' (')[0])) {
            metaParts.push(frontmatter.company);
        }
        
        // Show role if title doesn't already include it
        if (frontmatter.role && !frontmatter.title?.includes(frontmatter.role)) {
            metaParts.push(frontmatter.role);
        } else if (!frontmatter.role && frontmatter.title) {
            // If no role but has title, extract role from title
            const roleMatch = frontmatter.title.match(/ - (.+)$/);
            if (roleMatch) metaParts.push(roleMatch[1]);
        }
        
        metaParts.push(`${frontmatter.start_date} - ${frontmatter.end_date || 'Present'}`);
        
        this.innerHTML = `
            <h3>${frontmatter.title || frontmatter.company}</h3>
            <div class="meta">${metaParts.join(' | ')}</div>
            ${html}
        `;
    }
}
customElements.define('experience-entry', ExperienceEntry);