/**
 * Dopamine Gate - Content Script
 * Injects reflection overlay on blocked domains
 * Handles form submission and AI decision logic
 */

import type { ReflectionAnswers, AIDecision, LogEntry } from "./types.js";
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
function isOverlayInjected(): boolean {
    return document.getElementById("dopamine-gate-overlay") !== null;
}

/**
 * Get current domain from URL
 */
function getCurrentDomain(): string {
    return window.location.hostname;
}

/**
 * Main entry point - inject overlay if not already present
 */
async function init(): Promise<void> {
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
function injectOverlay(): void {
    const overlay = document.createElement("div");
    overlay.id = "dopamine-gate-overlay";
    overlay.className = "dopamine-gate-overlay";

    overlay.innerHTML = `
    <div class="dopamine-gate-form" id="dopamine-gate-form">
      <div class="dopamine-gate-header">
        <div class="dopamine-gate-logo">🧠</div>
        <h1 class="dopamine-gate-title">Dopamine Gate</h1>
        <p class="dopamine-gate-subtitle">Hít thở sâu. Suy nghĩ trước khi hành động.</p>
        <span class="dopamine-gate-domain">${getCurrentDomain()}</span>
      </div>

      <form id="dopamine-gate-reflection-form">
        <!-- Question 1: Purpose -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            Mục đích vào trang này là gì?
            <span class="dopamine-gate-hint">(tối thiểu 20 ký tự)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-reason" 
            name="reason"
            placeholder="Mô tả rõ ràng lý do bạn cần truy cập trang này..."
            required
          ></textarea>
          <div class="dopamine-gate-counter" id="dg-reason-counter">0/20</div>
          <div class="dopamine-gate-error" id="dg-reason-error">Vui lòng nhập ít nhất 20 ký tự</div>
        </div>

        <!-- Question 2: Goal Alignment -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            Việc này có giúp goal hiện tại của bạn không?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-goal-yes" name="goalAlignment" value="Yes" required>
            <label class="dopamine-gate-radio-label" for="dg-goal-yes">✅ Có</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-goal-no" name="goalAlignment" value="No">
            <label class="dopamine-gate-radio-label" for="dg-goal-no">❌ Không</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-goal-unsure" name="goalAlignment" value="Unsure">
            <label class="dopamine-gate-radio-label" for="dg-goal-unsure">🤔 Không chắc</label>
          </div>
        </div>

        <!-- Question 3: Time Budget -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            Bạn định ở đây bao lâu?
          </label>
          <select class="dopamine-gate-select" id="dg-time" name="timeBudget" required>
            <option value="">Chọn thời gian...</option>
            <option value="2 min">⏱️ 2 phút</option>
            <option value="5 min">⏱️ 5 phút</option>
            <option value="10 min">⏱️ 10 phút</option>
            <option value="Unlimited">♾️ Không giới hạn</option>
          </select>
        </div>

        <!-- Question 4: Alternative Action -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            Nếu bạn không vào trang này, bạn sẽ làm gì trong 10 phút tới?
            <span class="dopamine-gate-hint">(tối thiểu 20 ký tự)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-alternative" 
            name="alternativeAction"
            placeholder="Ví dụ: Đọc sách, tập thể dục, hoàn thành task công việc..."
            required
          ></textarea>
          <div class="dopamine-gate-counter" id="dg-alternative-counter">0/20</div>
          <div class="dopamine-gate-error" id="dg-alternative-error">Vui lòng nhập ít nhất 20 ký tự</div>
        </div>

        <!-- Question 5: Mentor Approval -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            Nếu mentor / future you nhìn thấy, bạn có đồng ý với hành động này không?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-mentor-yes" name="mentorApproval" value="Yes" required>
            <label class="dopamine-gate-radio-label" for="dg-mentor-yes">👍 Có, họ sẽ đồng ý</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-mentor-no" name="mentorApproval" value="No">
            <label class="dopamine-gate-radio-label" for="dg-mentor-no">👎 Không, họ sẽ thất vọng</label>
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
function injectApiKeyWarning(): void {
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
function setupFormListeners(): void {
    const form = document.getElementById("dopamine-gate-reflection-form") as HTMLFormElement;
    const reasonTextarea = document.getElementById("dg-reason") as HTMLTextAreaElement;
    const alternativeTextarea = document.getElementById("dg-alternative") as HTMLTextAreaElement;
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
function setupCharacterCounter(textarea: HTMLTextAreaElement, counterId: string): void {
    const counter = document.getElementById(counterId);
    if (!textarea || !counter) return;

    const updateCounter = (): void => {
        const length = textarea.value.length;
        counter.textContent = `${length}/${MIN_TEXT_LENGTH}`;

        counter.classList.remove("warning", "valid");
        if (length >= MIN_TEXT_LENGTH) {
            counter.classList.add("valid");
        } else if (length > 0) {
            counter.classList.add("warning");
        }
    };

    textarea.addEventListener("input", updateCounter);
    updateCounter();
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Extract form values
    const answers: ReflectionAnswers = {
        reason: (formData.get("reason") as string) || "",
        goalAlignment: (formData.get("goalAlignment") as "Yes" | "No" | "Unsure") || "Unsure",
        timeBudget: (formData.get("timeBudget") as string) || "5 min",
        alternativeAction: (formData.get("alternativeAction") as string) || "",
        mentorApproval: (formData.get("mentorApproval") as "Yes" | "No") || "No",
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
        const logEntry: LogEntry = {
            timestamp: Date.now(),
            domain: getCurrentDomain(),
            answers,
            aiDecision: decision,
        };
        await logDecision(logEntry);

        // Show result
        showResult(decision);
    } catch (error) {
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
function validateForm(answers: ReflectionAnswers): boolean {
    let isValid = true;

    // Validate reason length
    const reasonError = document.getElementById("dg-reason-error");
    const reasonTextarea = document.getElementById("dg-reason") as HTMLTextAreaElement;
    if (answers.reason.length < MIN_TEXT_LENGTH) {
        reasonError?.classList.add("visible");
        reasonTextarea?.classList.add("invalid");
        isValid = false;
    } else {
        reasonError?.classList.remove("visible");
        reasonTextarea?.classList.remove("invalid");
    }

    // Validate alternative action length
    const altError = document.getElementById("dg-alternative-error");
    const altTextarea = document.getElementById("dg-alternative") as HTMLTextAreaElement;
    if (answers.alternativeAction.length < MIN_TEXT_LENGTH) {
        altError?.classList.add("visible");
        altTextarea?.classList.add("invalid");
        isValid = false;
    } else {
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
function showLoading(): void {
    const formContainer = document.getElementById("dopamine-gate-form");
    if (!formContainer) return;

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
function showResult(decision: AIDecision): void {
    const formContainer = document.getElementById("dopamine-gate-form");
    if (!formContainer) return;

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
    } else {
        // Allow user to proceed
        document.getElementById("dg-btn-proceed")?.addEventListener("click", () => {
            removeOverlay();
        });
    }
}

/**
 * Start countdown before closing tab
 */
function startCloseCountdown(): void {
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
function removeOverlay(): void {
    const overlay = document.getElementById("dopamine-gate-overlay");
    overlay?.remove();
    document.body.style.overflow = "";
}

// ============================================
// Start
// ============================================

init();
