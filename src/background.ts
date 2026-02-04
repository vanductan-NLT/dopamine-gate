import { getBlocklist, isBlocked, getIsEnabled } from "./storage.js";
import { evaluateWithGemini } from "./gemini.js";

// Track tabs where overlay is already active to prevent flooding
const activeOverlays = new Set<number>();

// Clear tracking when tab is closed or navigated away
chrome.tabs.onRemoved.addListener((tabId) => activeOverlays.delete(tabId));
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0) activeOverlays.delete(details.tabId);
});

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

    // Skip if already injected in this session
    if (activeOverlays.has(tabId)) {
        return;
    }

    try {
        // Check if extension is globally enabled first
        const isEnabled = await getIsEnabled();
        if (!isEnabled) return;

        const blocklist = await getBlocklist();

        // Check if URL matches blocked domain
        if (isBlocked(url, blocklist)) {
            console.log(`[Dopamine Gate] Blocking domain: ${url}`);

            activeOverlays.add(tabId);

            // 1. Inject CSS first (fastest visual block)
            await chrome.scripting.insertCSS({
                target: { tabId },
                files: ["overlay.css"],
            }).catch(() => { });

            // 2. Inject Content Script (logic)
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ["contentScript.js"],
            }).catch(err => {
                console.error("[Dopamine Gate] Injection failed:", err);
                activeOverlays.delete(tabId);
            });
        }
    } catch (error: any) {
        console.debug("[Dopamine Gate] Navigation noise:", error);
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
    // Immediate response for simple types
    if (message.type === "PING") {
        sendResponse({ success: true, data: "PONG" });
        return false;
    }

    if (message.type === "CLOSE_TAB") {
        if (sender.tab?.id) {
            chrome.tabs.remove(sender.tab.id);
        }
        sendResponse({ success: true });
        return false;
    }

    if (message.type === "EVALUATE_REFLECTION") {
        // Use an IIFE to handle async logic safely
        (async () => {
            try {
                console.log("[Dopamine Gate] Proxying evaluation for:", sender.url);
                const decision = await evaluateWithGemini(message.answers);
                console.log("[Dopamine Gate] AI Decision:", decision.decision);
                sendResponse({ success: true, decision });
            } catch (error: any) {
                console.error("[Dopamine Gate] Background error:", error);
                sendResponse({
                    success: false,
                    error: error.message || "Background evaluation failed"
                });
            }
        })();
        return true; // MUST return true to keep channel open for async sendResponse
    }

    return false;
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
