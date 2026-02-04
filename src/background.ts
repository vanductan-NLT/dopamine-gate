/**
 * Dopamine Gate - Background Service Worker
 * Monitors tab navigation and injects content script for blocked domains
 */

import { getBlocklist, isBlocked, getIsEnabled } from "./storage.js";
import { evaluateWithGemini } from "./gemini.js";

// ============================================
// Tab Navigation Listener
// ============================================

/**
 * Core navigation handler to check blocklist and inject UI
 */
async function handleNavigation(tabId: number, url: string | undefined) {
    if (!url) return;

    // Skip chrome:// and extension pages
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
        return;
    }

    try {
        // Check if extension is globally enabled first
        const isEnabled = await getIsEnabled();
        if (!isEnabled) {
            console.debug("[Dopamine Gate] Extension is disabled, skipping check");
            return;
        }

        const blocklist = await getBlocklist();

        // Check if URL matches blocked domain
        if (isBlocked(url, blocklist)) {
            console.log(`[Dopamine Gate] Blocked domain detected: ${url}`);

            // 1. Inject CSS first (fastest visual block)
            await chrome.scripting.insertCSS({
                target: { tabId },
                files: ["overlay.css"],
            });

            // 2. Inject Content Script (logic)
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ["contentScript.js"],
            });
        }
    } catch (error: any) {
        // Tab might be closed or navigated away before injection, which is fine
        const msg = error instanceof Error ? error.message : String(error);
        console.debug("[Dopamine Gate] Navigation noise:", msg);
    }
}

/**
 * Listen for navigation commits (fires for hard/initial loads and history changes)
 */
chrome.webNavigation.onCommitted.addListener((details) => {
    // frameId 0 is the main window
    if (details.frameId === 0) {
        handleNavigation(details.tabId, details.url);
    }
});

/**
 * Fallback/Support for dynamic updates (like tab switching or fast URL updates)
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only handle if the URL changed in the update info
    if (changeInfo.url) {
        handleNavigation(tabId, changeInfo.url);
    }
});

// ============================================
// Message Handler
// ============================================

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`[Dopamine Gate] Action received: ${message.type}`);

    if (message.type === "CLOSE_TAB") {
        if (sender.tab?.id) {
            chrome.tabs.remove(sender.tab.id);
        }
        sendResponse({ success: true });
        return false; // Sync response
    }

    if (message.type === "EVALUATE_REFLECTION") {
        console.log("[Dopamine Gate] Starting proxy evaluation for:", sender.url);
        evaluateWithGemini(message.answers)
            .then(decision => {
                console.log("[Dopamine Gate] Evaluation success:", decision.decision);
                sendResponse({ success: true, decision });
            })
            .catch(error => {
                console.error("[Dopamine Gate] Proxy Evaluation Error:", error);
                sendResponse({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            });
        return true; // Keep channel open for async response
    }

    return false; // Default: closed
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
