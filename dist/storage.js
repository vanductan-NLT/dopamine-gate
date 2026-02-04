/**
 * Dopamine Gate - Chrome Storage Utilities
 * Handles all chrome.storage.sync operations
 */
// ============================================
// Storage Keys
// ============================================
const STORAGE_KEYS = {
    BLOCKLIST: "blocklist",
    API_KEY: "apiKey",
    LOGS: "logs",
};
// ============================================
// Default Values
// ============================================
const DEFAULT_BLOCKLIST = [
    "facebook.com",
    "tiktok.com",
    "twitter.com",
    "instagram.com",
    "youtube.com",
    "reddit.com",
];
// ============================================
// Generic Storage Helpers
// ============================================
/**
 * Get data from chrome.storage.sync
 * @param keys - Array of storage keys to retrieve
 */
async function getStorage(keys) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(keys, (result) => {
            resolve(result);
        });
    });
}
/**
 * Set data in chrome.storage.sync
 * @param data - Object with key-value pairs to store
 */
async function setStorage(data) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(data, resolve);
    });
}
// ============================================
// Blocklist Management
// ============================================
/**
 * Get the list of blocked domains
 */
export async function getBlocklist() {
    const result = await getStorage([
        STORAGE_KEYS.BLOCKLIST,
    ]);
    return result.blocklist ?? DEFAULT_BLOCKLIST;
}
/**
 * Add a domain to the blocklist
 * @param domain - Domain to block (e.g., "example.com")
 */
export async function addDomain(domain) {
    const blocklist = await getBlocklist();
    const normalizedDomain = normalizeDomain(domain);
    if (!blocklist.includes(normalizedDomain)) {
        blocklist.push(normalizedDomain);
        await setStorage({ blocklist });
    }
}
/**
 * Remove a domain from the blocklist
 * @param domain - Domain to unblock
 */
export async function removeDomain(domain) {
    const blocklist = await getBlocklist();
    const normalizedDomain = normalizeDomain(domain);
    const filtered = blocklist.filter((d) => d !== normalizedDomain);
    await setStorage({ blocklist: filtered });
}
/**
 * Check if a URL matches any blocked domain
 * @param url - Full URL to check
 * @param blocklist - List of blocked domains
 */
export function isBlocked(url, blocklist) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        return blocklist.some((domain) => {
            const normalizedDomain = domain.toLowerCase();
            // Match exact domain or subdomain
            return (hostname === normalizedDomain ||
                hostname.endsWith("." + normalizedDomain));
        });
    }
    catch {
        return false;
    }
}
/**
 * Normalize domain by removing protocol, www, and trailing slashes
 */
function normalizeDomain(domain) {
    return domain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim();
}
// ============================================
// API Key Management
// ============================================
/**
 * Get the stored Gemini API key
 * @returns API key or empty string if not set
 */
export async function getApiKey() {
    const result = await getStorage([
        STORAGE_KEYS.API_KEY,
    ]);
    return result.apiKey ?? "";
}
/**
 * Store the Gemini API key
 * @param key - The API key to store
 */
export async function setApiKey(key) {
    await setStorage({ apiKey: key.trim() });
}
// ============================================
// Logging
// ============================================
const MAX_LOGS = 100; // Keep last 100 entries
/**
 * Log a decision event
 * @param entry - Log entry to store
 */
export async function logDecision(entry) {
    const logs = await getLogs();
    logs.unshift(entry); // Add to beginning
    // Keep only last MAX_LOGS entries
    const trimmedLogs = logs.slice(0, MAX_LOGS);
    await setStorage({ logs: trimmedLogs });
}
/**
 * Get all logged decisions
 */
export async function getLogs() {
    const result = await getStorage([
        STORAGE_KEYS.LOGS,
    ]);
    return result.logs ?? [];
}
/**
 * Clear all logs
 */
export async function clearLogs() {
    await setStorage({ logs: [] });
}
