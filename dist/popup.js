/**
 * Dopamine Gate - Popup Script
 * Handles settings UI interactions
 */
import { getBlocklist, addDomain, removeDomain, getApiKey, setApiKey, getLogs, clearLogs, } from "./storage.js";
// ============================================
// DOM Elements
// ============================================
// Tabs
const tabs = document.querySelectorAll(".popup-tab");
const panels = document.querySelectorAll(".popup-panel");
// Blocklist
const newDomainInput = document.getElementById("new-domain");
const addDomainBtn = document.getElementById("btn-add-domain");
const domainList = document.getElementById("domain-list");
// Settings
const apiKeyInput = document.getElementById("api-key");
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
async function loadBlocklist() {
    const blocklist = await getBlocklist();
    if (!domainList)
        return;
    domainList.innerHTML = blocklist
        .map((domain) => `
      <li class="domain-item">
        <span class="domain-name">${escapeHtml(domain)}</span>
        <button class="domain-remove" data-domain="${escapeHtml(domain)}" title="Remove">
          ✕
        </button>
      </li>
    `)
        .join("");
    // Add remove handlers
    domainList.querySelectorAll(".domain-remove").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const domain = e.target.getAttribute("data-domain");
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
async function handleAddDomain() {
    const domain = newDomainInput?.value.trim();
    if (!domain)
        return;
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
async function loadApiKey() {
    const apiKey = await getApiKey();
    if (apiKeyInput && apiKey) {
        apiKeyInput.value = apiKey;
        showStatus("API key đã được cấu hình", "success");
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
            toggleKeyBtn.textContent = isPassword ? "🙈" : "👁️";
        }
    }
});
/**
 * Save API key
 */
saveKeyBtn?.addEventListener("click", async () => {
    const key = apiKeyInput?.value.trim();
    if (!key) {
        showStatus("Vui lòng nhập API key", "error");
        return;
    }
    // Basic validation
    if (!key.startsWith("AIza")) {
        showStatus("API key không hợp lệ (phải bắt đầu bằng AIza...)", "error");
        return;
    }
    await setApiKey(key);
    showStatus("API key đã được lưu thành công!", "success");
});
/**
 * Show status message
 */
function showStatus(message, type) {
    if (!apiKeyStatus)
        return;
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
async function loadLogs() {
    const logs = await getLogs();
    if (!logsList || !logsEmpty)
        return;
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
        const statusText = log.aiDecision.decision === "allow" ? "Cho phép" : "Chặn";
        return `
        <li class="log-item ${statusClass}">
          <div class="log-domain">${escapeHtml(log.domain)}</div>
          <div class="log-time">${timeStr}</div>
          <div class="log-decision ${statusClass}">${statusText}: ${escapeHtml(log.aiDecision.message.slice(0, 50))}...</div>
        </li>
      `;
    })
        .join("");
}
/**
 * Clear all logs
 */
clearLogsBtn?.addEventListener("click", async () => {
    if (confirm("Bạn có chắc muốn xóa tất cả lịch sử?")) {
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
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Format date for display
 */
function formatDate(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)
        return "Vừa xong";
    if (diffMins < 60)
        return `${diffMins} phút trước`;
    if (diffHours < 24)
        return `${diffHours} giờ trước`;
    if (diffDays < 7)
        return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
}
// ============================================
// Initialization
// ============================================
async function init() {
    await loadBlocklist();
    await loadApiKey();
}
init();
