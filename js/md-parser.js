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
    
    // Wrap consecutive non-heading lines in <p> tags, handle lists
    const lines = result.html.split('\n');
    const wrapped = [];
    let para = [];
    let currentListType = null; // 'ul' or 'ol'
    let listItems = [];

    const flushList = () => {
        if (currentListType) {
            const items = listItems.map(item => `<li>${item}</li>`).join('');
            wrapped.push(`<${currentListType}>${items}</${currentListType}>`);
            currentListType = null;
            listItems = [];
        }
    };
    const flushPara = () => {
        if (para.length) {
            wrapped.push(`<p>${para.join(' ')}</p>`);
            para = [];
        }
    };

    lines.forEach(line => {
        if (line.match(/^<h[1-6]>.*<\/h[1-6]>$/)) {
            flushList();
            flushPara();
            wrapped.push(line);
        } else if (line.trim()) {
            // Check for unordered list item (- or *)
            const ulMatch = line.match(/^[-*] (.+)$/);
            // Check for ordered list item (1. 2. etc)
            const olMatch = line.match(/^\d+\. (.+)$/);

            if (ulMatch) {
                const content = ulMatch[1];
                if (currentListType === 'ul') {
                    listItems.push(content);
                } else {
                    flushList();
                    flushPara();
                    currentListType = 'ul';
                    listItems.push(content);
                }
            } else if (olMatch) {
                const content = olMatch[1];
                if (currentListType === 'ol') {
                    listItems.push(content);
                } else {
                    flushList();
                    flushPara();
                    currentListType = 'ol';
                    listItems.push(content);
                }
            } else {
                flushList();
                para.push(line);
            }
        } else {
            flushList();
            flushPara();
        }
    });

    flushList();
    flushPara();
    result.html = wrapped.join('\n');
    
    return result;
}