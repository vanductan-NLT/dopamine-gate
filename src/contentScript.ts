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
        <div class="dopamine-gate-logo">
          <img src="${chrome.runtime.getURL('icons/icon128.png')}" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 16px;">
        </div>
        <h1 class="dopamine-gate-title">Dopamine Gate</h1>
        <p class="dopamine-gate-subtitle">Take a deep breath. Reflect before you act.</p>
        <span class="dopamine-gate-domain">${getCurrentDomain()}</span>
      </div>

      <form id="dopamine-gate-reflection-form">
        <!-- Question 1: Purpose -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            1) What is my primary objective for this session?
            <span class="dopamine-gate-hint">(Information gathering? Responding to someone? Or avoiding work?)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-reason" 
            name="reason"
            placeholder="Focus is key. Be specific..."
            required
          ></textarea>
          <div class="dopamine-gate-counter" id="dg-reason-counter">0/20</div>
        </div>

        <!-- Question 2: Specific Goal -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            2) Define a measurable endpoint for this visit.
            <span class="dopamine-gate-hint">(Ex: Check 3 notifications and leave? Find 1 specific insight?)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-goal-target" 
            name="goalTarget"
            placeholder="No target = mindless scrolling..."
            required
          ></textarea>
        </div>

        <!-- Question 3: Alternative -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            3) What high-value activity am I currently displacing?
            <span class="dopamine-gate-hint">(Deep work? Reading? True rest?)</span>
          </label>
          <textarea 
            class="dopamine-gate-textarea" 
            id="dg-alternative" 
            name="alternativeAction"
            placeholder="Identify the opportunity cost..."
            required
          ></textarea>
          <div class="dopamine-gate-counter" id="dg-alternative-counter">0/20</div>
        </div>

        <!-- Question 4: Outcome -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            4) Expected sentiment in 10 minutes?
            <span class="dopamine-gate-hint">(Knowledge gained? True relaxation? Or cognitive fatigue?)</span>
          </label>
          <select class="dopamine-gate-select" id="dg-outcome" name="outcome" required>
            <option value="">Select an outcome...</option>
            <option value="Knowledge">📚 Learning / Insight</option>
            <option value="Real Entertainment">🎮 Meaningful Recreation</option>
            <option value="Emptiness">🕳️ Empty Dopamine / Fatigue</option>
          </select>
        </div>

        <!-- Question 5: Need level -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            5) Am I seeking utility or stimulation?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-need-info" name="needType" value="Information" required>
            <label class="dopamine-gate-radio-label" for="dg-need-info">ℹ️ Utility / Information</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-need-dopamine" name="needType" value="Dopamine">
            <label class="dopamine-gate-radio-label" for="dg-need-dopamine">⚡ Stimulation / Dopamine</label>
          </div>
        </div>

        <!-- Question 6: Future feeling -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            6) If I spend 30 minutes here, how will I feel afterwards?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-future-good" name="futureFeeling" value="Good" required>
            <label class="dopamine-gate-radio-label" for="dg-future-good">✅ Aligned & Satisfied</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-future-bad" name="futureFeeling" value="Waste">
            <label class="dopamine-gate-radio-label" for="dg-future-bad">⚠️ Regretful & Wasted</label>
          </div>
        </div>

        <!-- Actions -->
        <div class="dopamine-gate-actions">
          <button type="button" class="dopamine-gate-btn dopamine-gate-btn-secondary" id="dg-btn-leave">
            Leave Page
          </button>
          <button type="submit" class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-submit">
            Evaluate Intent
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
        <h2 class="dopamine-gate-result-title">Configuration Required</h2>
        <p class="dopamine-gate-result-message">
          Please provide your Gemini API Key in the extension settings to enable intelligent reflection evaluation.
        </p>
        <div class="dopamine-gate-actions" style="justify-content: center;">
          <button class="dopamine-gate-btn dopamine-gate-btn-secondary" id="dg-btn-close-warning">
            Close Tab
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
    goalTarget: (formData.get("goalTarget") as string) || "",
    alternativeAction: (formData.get("alternativeAction") as string) || "",
    outcome: (formData.get("outcome") as "Knowledge" | "Real Entertainment" | "Emptiness") || "Emptiness",
    needType: (formData.get("needType") as "Information" | "Dopamine") || "Dopamine",
    futureFeeling: (formData.get("futureFeeling") as "Good" | "Waste") || "Waste",
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
      <p class="dopamine-gate-loading-text">Analyzing your response...</p>
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
  const title = isBlocked ? "Access Blocked" : "Access Allowed";
  const statusClass = isBlocked ? "blocked" : "allowed";

  formContainer.innerHTML = `
    <div class="dopamine-gate-result ${statusClass}">
      <div class="dopamine-gate-result-icon">${isBlocked ? '✕' : '✓'}</div>
      <h2 class="dopamine-gate-result-title">${title}</h2>
      <p class="dopamine-gate-result-message">${decision.message}</p>
      ${isBlocked ? `
        <p class="dopamine-gate-countdown">Tab will close in <span id="dg-countdown">5</span> seconds...</p>
      ` : `
        <div class="dopamine-gate-actions" style="justify-content: center;">
          <button class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-proceed">
            Proceed to Site →
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
