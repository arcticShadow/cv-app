import { parseMarkdown } from './md-parser.js';

let cache = new Map();

export async function getContent(path) {
    const key = path.replace(/^\//, '');
    if (cache.has(key)) return cache.get(key);
    const res = await fetch('/' + key);
    const md = await res.text();
    const parsed = parseMarkdown(md);
    cache.set(key, parsed);
    return parsed;
}

export function clearCache() {
    cache = new Map();
}
