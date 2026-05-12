
// Rely on the html base tag to have correct value
export const BASE_PATH = document.getElementsByTagName('base')[0].href.replace(/\/$/, "" );

export async function loadConfig() {
    const res = await fetch(`${BASE_PATH}/config.json`);
    if (!res.ok) throw new Error('Failed to load config.json');
    return res.json();
}

let configCache = null;
export async function getConfig() {
    if (!configCache) configCache = await loadConfig();
    return configCache;
}