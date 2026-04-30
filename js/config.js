// js/config.js
export async function loadConfig() {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error('Failed to load config.json');
    return res.json();
}

let configCache = null;
export async function getConfig() {
    if (!configCache) configCache = await loadConfig();
    return configCache;
}