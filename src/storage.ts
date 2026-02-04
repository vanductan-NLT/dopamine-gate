/**
 * Dopamine Gate - Chrome Storage Utilities
 * Handles all chrome.storage.sync operations
 */

import type { StorageData, LogEntry } from "./types.js";

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
    BLOCKLIST: "blocklist",
    API_KEY: "apiKey",
    LOGS: "logs",
    IS_ENABLED: "isEnabled",
} as const;

// ============================================
// Default Values
// ============================================

const DEFAULT_BLOCKLIST: string[] = [
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
async function getStorage<T>(keys: string[]): Promise<T> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(keys, (result) => {
            resolve(result as T);
        });
    });
}

/**
 * Set data in chrome.storage.sync
 * @param data - Object with key-value pairs to store
 */
async function setStorage(data: Partial<StorageData>): Promise<void> {
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
export async function getBlocklist(): Promise<string[]> {
    const result = await getStorage<Pick<StorageData, "blocklist">>([
        STORAGE_KEYS.BLOCKLIST,
    ]);
    return result.blocklist ?? DEFAULT_BLOCKLIST;
}

/**
 * Add a domain to the blocklist
 * @param domain - Domain to block (e.g., "example.com")
 */
export async function addDomain(domain: string): Promise<void> {
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
export async function removeDomain(domain: string): Promise<void> {
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
export function isBlocked(url: string, blocklist: string[]): boolean {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        return blocklist.some((domain) => {
            const normalizedDomain = domain.toLowerCase();
            // Match exact domain or subdomain
            return (
                hostname === normalizedDomain ||
                hostname.endsWith("." + normalizedDomain)
            );
        });
    } catch {
        return false;
    }
}

/**
 * Normalize domain by removing protocol, www, and trailing slashes
 */
function normalizeDomain(domain: string): string {
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
export async function getApiKey(): Promise<string> {
    const result = await getStorage<Pick<StorageData, "apiKey">>([
        STORAGE_KEYS.API_KEY,
    ]);
    return result.apiKey ?? "";
}

/**
 * Store the Gemini API key
 * @param key - The API key to store
 */
export async function setApiKey(key: string): Promise<void> {
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
export async function logDecision(entry: LogEntry): Promise<void> {
    const logs = await getLogs();
    logs.unshift(entry); // Add to beginning

    // Keep only last MAX_LOGS entries
    const trimmedLogs = logs.slice(0, MAX_LOGS);
    await setStorage({ logs: trimmedLogs });
}

/**
 * Get all logged decisions
 */
export async function getLogs(): Promise<LogEntry[]> {
    const result = await getStorage<Pick<StorageData, "logs">>([
        STORAGE_KEYS.LOGS,
    ]);
    return result.logs ?? [];
}

/**
 * Clear all logs
 */
export async function clearLogs(): Promise<void> {
    await setStorage({ logs: [] });
}

// ============================================
// Global State Management
// ============================================

/**
 * Check if the extension is globally enabled
 */
export async function getIsEnabled(): Promise<boolean> {
    const result = await getStorage<Pick<StorageData, "isEnabled">>([
        STORAGE_KEYS.IS_ENABLED,
    ]);
    // Default to true if not set
    return result.isEnabled !== false;
}

/**
 * Set the global enabled state
 * @param enabled - Whether the extension should be active
 */
export async function setIsEnabled(enabled: boolean): Promise<void> {
    await setStorage({ isEnabled: enabled });
}
