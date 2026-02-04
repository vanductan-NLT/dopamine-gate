/**
 * Dopamine Gate - Background Service Worker
 * Monitors tab navigation and injects content script for blocked domains
 */

import { getBlocklist, isBlocked } from "./storage.js";

// ============================================
// Tab Navigation Listener
// ============================================

/**
 * Listen for tab updates to detect navigation to blocked sites
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only act when page has completed loading
    if (changeInfo.status !== "complete") return;

    // Ensure we have a valid URL
    if (!tab.url) return;

    // Skip chrome:// and extension pages
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
        return;
    }

    try {
        // Get current blocklist
        const blocklist = await getBlocklist();

        // Check if URL matches blocked domain
        if (isBlocked(tab.url, blocklist)) {
            console.log(`[Dopamine Gate] Blocked domain detected: ${tab.url}`);

            // Inject content script to show overlay
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ["contentScript.js"],
            });

            // Inject CSS for overlay
            await chrome.scripting.insertCSS({
                target: { tabId },
                files: ["overlay.css"],
            });
        }
    } catch (error) {
        console.error("[Dopamine Gate] Error checking blocked status:", error);
    }
});

// ============================================
// Message Handler
// ============================================

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLOSE_TAB") {
        // Close the tab that sent this message
        if (sender.tab?.id) {
            chrome.tabs.remove(sender.tab.id);
        }
        sendResponse({ success: true });
    }

    return true; // Keep channel open for async response
});

// ============================================
// Extension Install/Update Handler
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        console.log("[Dopamine Gate] Extension installed successfully!");
        // Could show welcome page or set default settings here
    } else if (details.reason === "update") {
        console.log(`[Dopamine Gate] Updated to version ${chrome.runtime.getManifest().version}`);
    }
});

console.log("[Dopamine Gate] Background service worker started");
