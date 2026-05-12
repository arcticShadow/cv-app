// js/sitemap.js
export async function loadSitemap() {
    const res = await fetch('/sitemap.json');
    if (!res.ok) throw new Error('Failed to load sitemap.json');
    return res.json();
}

let sitemapCache = null;
export async function getSitemap() {
    if (!sitemapCache) sitemapCache = await loadSitemap();
    return sitemapCache;
}