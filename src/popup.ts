/**
 * Dopamine Gate - Popup Script
 * Handles settings UI interactions
 */

import {
    getBlocklist,
    addDomain,
    removeDomain,
    getApiKey,
    setApiKey,
    getLogs,
    clearLogs,
} from "./storage.js";
import type { LogEntry } from "./types.js";

// ============================================
// DOM Elements
// ============================================

// Tabs
const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-content");

// Blocklist
const newDomainInput = document.getElementById("new-domain") as HTMLInputElement;
const addDomainBtn = document.getElementById("btn-add-domain");
const domainList = document.getElementById("domain-list");

// Settings
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const toggleKeyBtn = document.getElementById("btn-toggle-key");
const saveKeyBtn = document.getElementById("btn-save-key");
const apiKeyStatus = document.getElementById("api-key-status");

// Logs
const clearLogsBtn = document.getElementById("btn-clear-logs");
const logsList = document.getElementById("logs-list");
const logsEmpty = document.getElementById("logs-empty");

// ============================================
// Tab Navigation
// ============================================

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const tabId = tab.getAttribute("data-tab");

        // Update active tab
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Update active panel
        panels.forEach((p) => p.classList.remove("active"));
        document.getElementById(`panel-${tabId}`)?.classList.add("active");

        // Load content for activated tab
        if (tabId === "logs") {
            loadLogs();
        }
    });
});

// ============================================
// Blocklist Management
// ============================================

/**
 * Load and render blocklist
 */
async function loadBlocklist(): Promise<void> {
    const blocklist = await getBlocklist();

    if (!domainList) return;

    domainList.innerHTML = blocklist
        .map(
            (domain) => `
      <li class="domain-item">
        <span class="domain-name">${escapeHtml(domain)}</span>
        <button class="btn-remove" data-domain="${escapeHtml(domain)}" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </li>
    `
        )
        .join("");

    // Add remove handlers
    domainList.querySelectorAll(".btn-remove").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const domain = btn.getAttribute("data-domain");
            if (domain) {
                await removeDomain(domain);
                await loadBlocklist();
            }
        });
    });
}

/**
 * Add new domain to blocklist
 */
async function handleAddDomain(): Promise<void> {
    const domain = newDomainInput?.value.trim();

    if (!domain) return;

    await addDomain(domain);
    newDomainInput.value = "";
    await loadBlocklist();
}

// Add domain button click
addDomainBtn?.addEventListener("click", handleAddDomain);

// Enter key in input
newDomainInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleAddDomain();
    }
});

// ============================================
// API Key Management
// ============================================

/**
 * Load and display API key (masked)
 */
async function loadApiKey(): Promise<void> {
    const apiKey = await getApiKey();

    if (apiKeyInput && apiKey) {
        apiKeyInput.value = apiKey;
        showStatus("API configuration active", "success");
    }
}

/**
 * Toggle API key visibility
 */
toggleKeyBtn?.addEventListener("click", () => {
    if (apiKeyInput) {
        const isPassword = apiKeyInput.type === "password";
        apiKeyInput.type = isPassword ? "text" : "password";
        if (toggleKeyBtn) {
            toggleKeyBtn.innerHTML = isPassword
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
        }
    }
});

/**
 * Save API key
 */
saveKeyBtn?.addEventListener("click", async () => {
    const key = apiKeyInput?.value.trim();

    if (!key) {
        showStatus("Please enter an API key", "error");
        return;
    }

    if (!key.startsWith("AIza")) {
        showStatus("Invalid key format (should start with AIza...)", "error");
        return;
    }

    await setApiKey(key);
    showStatus("API configuration saved successfully", "success");
});

/**
 * Show status message
 */
function showStatus(message: string, type: "success" | "error"): void {
    if (!apiKeyStatus) return;

    apiKeyStatus.textContent = message;
    apiKeyStatus.className = `status-message ${type}`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        apiKeyStatus.className = "status-message";
    }, 3000);
}

// ============================================
// Logs Management
// ============================================

/**
 * Load and render logs
 */
async function loadLogs(): Promise<void> {
    const logs = await getLogs();

    if (!logsList || !logsEmpty) return;

    if (logs.length === 0) {
        logsList.innerHTML = "";
        logsEmpty.style.display = "block";
        return;
    }

    logsEmpty.style.display = "none";

    logsList.innerHTML = logs
        .map((log) => {
            const date = new Date(log.timestamp);
            const timeStr = formatDate(date);
            const statusClass = log.aiDecision.decision;
            const statusText = log.aiDecision.decision === "allow" ? "ALLOWED" : "BLOCKED";

            return `
        <div class="log-item">
          <div class="log-meta">
            <span class="log-domain">${escapeHtml(log.domain)}</span>
            <span>${timeStr}</span>
          </div>
          <p class="log-message">
            <span class="log-status ${statusClass}">${statusText}</span>: 
            ${escapeHtml(log.aiDecision.message)}
          </p>
        </div>
      `;
        })
        .join("");
}

/**
 * Clear all logs
 */
clearLogsBtn?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear your reflection history?")) {
        await clearLogs();
        await loadLogs();
    }
});

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US");
}

// ============================================
// Initialization
// ============================================

async function init(): Promise<void> {
    await loadBlocklist();
    await loadApiKey();
}

init();
