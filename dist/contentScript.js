/**
 * Dopamine Gate - Content Script
 * Injects reflection overlay on blocked domains
 * Handles form submission and AI decision logic
 */
import { evaluateWithGemini, applyClientRules } from "./gemini.js";
import { logDecision, getApiKey } from "./storage.js";
// ============================================
// Constants
// ============================================
const MIN_TEXT_LENGTH = 20;
const CLOSE_DELAY_MS = 5000; // 5 seconds before closing blocked tab
// ============================================
// Main Initialization
// ============================================
/**
 * Check if overlay already exists to prevent duplicate injection
 */
function isOverlayInjected() {
    return document.getElementById("dopamine-gate-overlay") !== null;
}
/**
 * Get current domain from URL
 */
function getCurrentDomain() {
    return window.location.hostname;
}
/**
 * Main entry point - inject overlay if not already present
 */
async function init() {
    if (isOverlayInjected()) {
        console.log("[Dopamine Gate] Overlay already injected, skipping");
        return;
    }
    // Check if API key is configured
    const apiKey = await getApiKey();
    if (!apiKey) {
        injectApiKeyWarning();
        return;
    }
    injectOverlay();
}
// ============================================
// Overlay Injection
// ============================================
/**
 * Inject the reflection form overlay
 */
function injectOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "dopamine-gate-overlay";
    overlay.className = "dopamine-gate-overlay";
    overlay.innerHTML = `
    <div class="dopamine-gate-form" id="dopamine-gate-form">
      <div class="dopamine-gate-header">
        <div class="dopamine-gate-logo">
          <img src="${chrome.runtime.getURL('icons/icon128.png')}" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 16px;">
        </div>
        <h1 class="dopamine-gate-title">Dopamine Gate</h1>
        <p class="dopamine-gate-subtitle">Hít thở sâu. Suy nghĩ trước khi hành động.</p>
        <span class="dopamine-gate-domain">${getCurrentDomain()}</span>
      </div>

      <form id="dopamine-gate-reflection-form">
        <!-- Question 1: Purpose -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            1) Tao vào đây để làm gì?
            <span class="dopamine-gate-hint">(Tìm thông tin? Trả lời ai? Hay chỉ muốn trốn việc?)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-reason" 
            name="reason"
            placeholder="Nếu không trả lời rõ -> đang nghiện dopamine..."
            required
          ></textarea>
          <div class="dopamine-gate-counter" id="dg-reason-counter">0/20</div>
        </div>

        <!-- Question 2: Specific Goal -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            2) Mục tiêu cụ thể của lần lướt này là gì?
            <span class="dopamine-gate-hint">(Xem 3 bài rồi thoát? Tìm 1 idea? Check tin nhắn?)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-goal-target" 
            name="goalTarget"
            placeholder="Không có mục tiêu = bị thuật toán điều khiển..."
            required
          ></textarea>
        </div>

        <!-- Question 3: Alternative -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            3) Nếu không vào MXH, tao sẽ làm gì thay thế?
            <span class="dopamine-gate-hint">(Code? Đọc tài liệu? Nghỉ ngơi thật sự?)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-alternative" 
            name="alternativeAction"
            placeholder="Nếu cái thay thế tốt hơn -> vào MXH là tự phá mình..."
            required
          ></textarea>
          <div class="dopamine-gate-counter" id="dg-alternative-counter">0/20</div>
        </div>

        <!-- Question 4: Outcome -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            4) 10 phút nữa tao muốn nhận được gì?
            <span class="dopamine-gate-hint">(Kiến thức? Giải trí thật sự? Hay chỉ trống rỗng?)</span>
          </label>
          <select class="dopamine-gate-select" id="dg-outcome" name="outcome" required>
            <option value="">Chọn một...</option>
            <option value="Knowledge">📚 Kiến thức</option>
            <option value="Real Entertainment">🎮 Giải trí thật sự</option>
            <option value="Emptiness">🕳️ Trống rỗng (Dopamine giả)</option>
          </select>
        </div>

        <!-- Question 5: Need level -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            5) Tao đang cần dopamine hay cần thông tin?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-need-info" name="needType" value="Information" required>
            <label class="dopamine-gate-radio-label" for="dg-need-info">ℹ️ Cần thông tin</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-need-dopamine" name="needType" value="Dopamine">
            <label class="dopamine-gate-radio-label" for="dg-need-dopamine">⚡ Cần Dopamine (Mệt/Chán)</label>
          </div>
        </div>

        <!-- Question 6: Future feeling -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            6) Nếu lướt 30 phút, tương lai tao sẽ cảm thấy sao?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-future-good" name="futureFeeling" value="Good" required>
            <label class="dopamine-gate-radio-label" for="dg-future-good">✅ Ổn, đáng</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-future-bad" name="futureFeeling" value="Waste">
            <label class="dopamine-gate-radio-label" for="dg-future-bad">費 Vãi, phí thời gian</label>
          </div>
        </div>

        <!-- Actions -->
        <div class="dopamine-gate-actions">
          <button type="button" class="dopamine-gate-btn dopamine-gate-btn-secondary" id="dg-btn-leave">
            ← Rời đi
          </button>
          <button type="submit" class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-submit">
            Đánh giá →
          </button>
        </div>
      </form>
    </div>
  `;
    document.body.appendChild(overlay);
    // Prevent scrolling on body
    document.body.style.overflow = "hidden";
    // Setup event listeners
    setupFormListeners();
}
/**
 * Inject warning when API key is not configured
 */
function injectApiKeyWarning() {
    const overlay = document.createElement("div");
    overlay.id = "dopamine-gate-overlay";
    overlay.className = "dopamine-gate-overlay";
    overlay.innerHTML = `
    <div class="dopamine-gate-form">
      <div class="dopamine-gate-result blocked">
        <div class="dopamine-gate-result-icon">⚠️</div>
        <h2 class="dopamine-gate-result-title">API Key Chưa Được Cấu Hình</h2>
        <p class="dopamine-gate-result-message">
          Vui lòng click vào icon extension và thêm Gemini API Key trong tab Settings.
        </p>
        <div class="dopamine-gate-actions" style="justify-content: center;">
          <button class="dopamine-gate-btn dopamine-gate-btn-secondary" id="dg-btn-close-warning">
            Đóng tab này
          </button>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    document.getElementById("dg-btn-close-warning")?.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
    });
}
// ============================================
// Form Event Handlers
// ============================================
/**
 * Setup all form event listeners
 */
function setupFormListeners() {
    const form = document.getElementById("dopamine-gate-reflection-form");
    const reasonTextarea = document.getElementById("dg-reason");
    const alternativeTextarea = document.getElementById("dg-alternative");
    const leaveBtn = document.getElementById("dg-btn-leave");
    // Character counters
    setupCharacterCounter(reasonTextarea, "dg-reason-counter");
    setupCharacterCounter(alternativeTextarea, "dg-alternative-counter");
    // Leave button - close tab
    leaveBtn?.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
    });
    // Form submission
    form?.addEventListener("submit", handleFormSubmit);
}
/**
 * Setup character counter for textarea
 */
function setupCharacterCounter(textarea, counterId) {
    const counter = document.getElementById(counterId);
    if (!textarea || !counter)
        return;
    const updateCounter = () => {
        const length = textarea.value.length;
        counter.textContent = `${length}/${MIN_TEXT_LENGTH}`;
        counter.classList.remove("warning", "valid");
        if (length >= MIN_TEXT_LENGTH) {
            counter.classList.add("valid");
        }
        else if (length > 0) {
            counter.classList.add("warning");
        }
    };
    textarea.addEventListener("input", updateCounter);
    updateCounter();
}
/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    // Extract form values
    const answers = {
        reason: formData.get("reason") || "",
        goalTarget: formData.get("goalTarget") || "",
        alternativeAction: formData.get("alternativeAction") || "",
        outcome: formData.get("outcome") || "Emptiness",
        needType: formData.get("needType") || "Dopamine",
        futureFeeling: formData.get("futureFeeling") || "Waste",
    };
    // Client-side validation
    if (!validateForm(answers)) {
        return;
    }
    // Show loading state
    showLoading();
    try {
        // First, check client-side rules
        let decision = applyClientRules(answers);
        // If no client rule applies, ask AI
        if (!decision) {
            decision = await evaluateWithGemini(answers);
        }
        // Log the decision
        const logEntry = {
            timestamp: Date.now(),
            domain: getCurrentDomain(),
            answers,
            aiDecision: decision,
        };
        await logDecision(logEntry);
        // Show result
        showResult(decision);
    }
    catch (error) {
        console.error("[Dopamine Gate] Error evaluating:", error);
        showResult({
            decision: "block",
            confidence: 1,
            message: "Đã xảy ra lỗi. Mặc định chặn để bảo vệ bạn.",
        });
    }
}
/**
 * Validate form inputs
 */
function validateForm(answers) {
    let isValid = true;
    // Validate reason length
    const reasonError = document.getElementById("dg-reason-error");
    const reasonTextarea = document.getElementById("dg-reason");
    if (answers.reason.length < MIN_TEXT_LENGTH) {
        reasonError?.classList.add("visible");
        reasonTextarea?.classList.add("invalid");
        isValid = false;
    }
    else {
        reasonError?.classList.remove("visible");
        reasonTextarea?.classList.remove("invalid");
    }
    // Validate alternative action length
    const altError = document.getElementById("dg-alternative-error");
    const altTextarea = document.getElementById("dg-alternative");
    if (answers.alternativeAction.length < MIN_TEXT_LENGTH) {
        altError?.classList.add("visible");
        altTextarea?.classList.add("invalid");
        isValid = false;
    }
    else {
        altError?.classList.remove("visible");
        altTextarea?.classList.remove("invalid");
    }
    return isValid;
}
// ============================================
// Result Display
// ============================================
/**
 * Show loading state while waiting for AI
 */
function showLoading() {
    const formContainer = document.getElementById("dopamine-gate-form");
    if (!formContainer)
        return;
    formContainer.innerHTML = `
    <div class="dopamine-gate-loading">
      <div class="dopamine-gate-spinner"></div>
      <p class="dopamine-gate-loading-text">Đang phân tích quyết định của bạn...</p>
    </div>
  `;
}
/**
 * Show decision result
 */
function showResult(decision) {
    const formContainer = document.getElementById("dopamine-gate-form");
    if (!formContainer)
        return;
    const isBlocked = decision.decision === "block";
    const icon = isBlocked ? "🚫" : "✅";
    const title = isBlocked ? "Truy Cập Bị Chặn" : "Truy Cập Được Phép";
    const statusClass = isBlocked ? "blocked" : "allowed";
    formContainer.innerHTML = `
    <div class="dopamine-gate-result ${statusClass}">
      <div class="dopamine-gate-result-icon">${icon}</div>
      <h2 class="dopamine-gate-result-title">${title}</h2>
      <p class="dopamine-gate-result-message">${decision.message}</p>
      ${isBlocked ? `
        <p class="dopamine-gate-countdown">Tab sẽ đóng sau <span id="dg-countdown">5</span> giây...</p>
      ` : `
        <div class="dopamine-gate-actions" style="justify-content: center;">
          <button class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-proceed">
            Tiếp tục →
          </button>
        </div>
      `}
    </div>
  `;
    if (isBlocked) {
        // Start countdown and close tab
        startCloseCountdown();
    }
    else {
        // Allow user to proceed
        document.getElementById("dg-btn-proceed")?.addEventListener("click", () => {
            removeOverlay();
        });
    }
}
/**
 * Start countdown before closing tab
 */
function startCloseCountdown() {
    let seconds = 5;
    const countdownEl = document.getElementById("dg-countdown");
    const interval = setInterval(() => {
        seconds--;
        if (countdownEl) {
            countdownEl.textContent = seconds.toString();
        }
        if (seconds <= 0) {
            clearInterval(interval);
            chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
        }
    }, 1000);
}
/**
 * Remove overlay and allow page access
 */
function removeOverlay() {
    const overlay = document.getElementById("dopamine-gate-overlay");
    overlay?.remove();
    document.body.style.overflow = "";
}
// ============================================
// Start
// ============================================
init();
