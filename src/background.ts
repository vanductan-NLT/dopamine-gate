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
    // We check whenever the URL changes or the page is loading
    const url = changeInfo.url || tab.url;
    if (!url) return;

    // Skip chrome:// and extension pages
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
        return;
    }

    try {
        const blocklist = await getBlocklist();

        // Check if URL matches blocked domain
        if (isBlocked(url, blocklist)) {
            console.log(`[Dopamine Gate] Blocked domain detected: ${url}`);

            // Always try to inject CSS first
            await chrome.scripting.insertCSS({
                target: { tabId },
                files: ["overlay.css"],
            });

            // Inject content script. 
            // The content script itself has a check (isOverlayInjected) 
            // so it won't show the form twice even if injected multiple times.
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ["contentScript.js"],
            });
        }
    } catch (error: any) {
        // This error often happens if the tab is closed during injection, which is fine
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.debug("[Dopamine Gate] Injection noise:", errorMessage);
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
