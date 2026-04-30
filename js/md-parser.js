// js/md-parser.js
export function parseMarkdown(mdString) {
    const result = { frontmatter: {}, html: '' };
    
    // Extract frontmatter between --- delimiters
    const fmMatch = mdString.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
        const fmString = fmMatch[1];
        fmString.split('\n').forEach(line => {
            const [key, ...vals] = line.split(':');
            if (key && vals.length) {
                result.frontmatter[key.trim()] = vals.join(':').trim();
            }
        });
        result.html = mdString.slice(fmMatch[0].length).trim();
    } else {
        result.html = mdString;
    }
    
    // Convert headings # through ######
    result.html = result.html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    result.html = result.html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    result.html = result.html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    result.html = result.html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    result.html = result.html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    result.html = result.html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Convert bold, italic, code, links
    result.html = result.html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result.html = result.html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    result.html = result.html.replace(/`(.+?)`/g, '<code>$1</code>');
    result.html = result.html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    
    // Wrap consecutive non-heading lines in <p> tags
    const lines = result.html.split('\n');
    const wrapped = [];
    let para = [];
    lines.forEach(line => {
        if (line.match(/^<h[1-6]>.*<\/h[1-6]>$/)) {
            if (para.length) { wrapped.push(`<p>${para.join(' ')}</p>`); para = []; }
            wrapped.push(line);
        } else if (line.trim()) {
            para.push(line);
        } else {
            if (para.length) { wrapped.push(`<p>${para.join(' ')}</p>`); para = []; }
        }
    });
    if (para.length) wrapped.push(`<p>${para.join(' ')}</p>`);
    result.html = wrapped.join('\n');
    
    return result;
}