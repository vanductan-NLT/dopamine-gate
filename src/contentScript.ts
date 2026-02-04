/**
 * Dopamine Gate - Content Script
 * Injects reflection overlay on blocked domains
 * Handles form submission and AI decision logic
 */

import type { ReflectionAnswers, AIDecision, LogEntry } from "./types.js";
import { applyClientRules } from "./gemini.js";
import { logDecision, getApiKey } from "./storage.js";

// ============================================
// Constants
// ============================================

const MIN_TEXT_LENGTH = 20;
const CLOSE_DELAY_MS = 5000;
let currentStep = 1;
const TOTAL_STEPS = 6;

// ============================================
// Asset Injection
// ============================================

// External assets removed to satisfy strict CSP rules (e.g. Instagram)

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
  console.log("[Dopamine Gate] Content Script v2.1 - Initializing...");
  // Prevent multiple active initializations
  if ((window as any).dg_initializing) return;
  (window as any).dg_initializing = true;

  try {
    if (isOverlayInjected()) {
      console.log("[Dopamine Gate] Overlay already exists, skipping");
      return;
    }

    // Inject symbols and fonts
    // Assets are now inline SVGs, no injection needed

    // Check if API key is configured
    const apiKey = await getApiKey();
    if (!apiKey) {
      injectApiKeyWarning();
    } else {
      injectOverlay();
    }

    // Start observing the DOM to prevent removal (only once)
    if (!(window as any).dg_observer_active) {
      setupPersistenceObserver();
      (window as any).dg_observer_active = true;
    }
  } finally {
    (window as any).dg_initializing = false;
  }
}

/**
 * Ensures the overlay remains in the DOM even if the site (like Facebook/YouTube) 
 * wipes the body or rerenders.
 */
function setupPersistenceObserver(): void {
  const observer = new MutationObserver((mutations) => {
    // If the overlay is missing, re-inject it
    if (!isOverlayInjected()) {
      console.log("[Dopamine Gate] Blocker was removed by site. Re-injecting...");
      init();
      return;
    }

    // Also ensure body overflow is still hidden
    if (document.body.style.overflow !== "hidden") {
      document.body.style.overflow = "hidden";
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
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
      <div class="dopamine-gate-progress-container">
        <div class="dopamine-gate-progress-bar" id="dg-progress-bar" style="width: ${(1 / TOTAL_STEPS) * 100}%"></div>
      </div>
      
      <div class="dopamine-gate-header">
        <div class="dopamine-gate-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--dg-accent)"/>
          </svg>
        </div>
        <h1 class="dopamine-gate-title">System Check</h1>
        <p class="dopamine-gate-subtitle">Complete this brief reflection to unlock <strong>${getCurrentDomain()}</strong></p>
      </div>

      <form id="dopamine-gate-reflection-form" novalidate>
        <!-- Question 1: Purpose -->
        <div class="dopamine-gate-step active" data-step="1">
          <div class="dopamine-gate-group">
            <label class="dopamine-gate-label">
              1) What is your primary objective for this session?
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
        </div>

        <div class="dopamine-gate-step" data-step="2">
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
            <div class="dopamine-gate-counter" id="dg-goal-counter">0/20</div>
          </div>
        </div>

        <!-- Question 3: Alternative -->
        <div class="dopamine-gate-step" data-step="3">
          <div class="dopamine-gate-group">
            <label class="dopamine-gate-label">
              3) What high-value activity are you currently displacing?
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
        </div>

        <!-- Question 4: Outcome -->
        <div class="dopamine-gate-step" data-step="4">
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
        </div>

        <!-- Question 5: Need level -->
        <div class="dopamine-gate-step" data-step="5">
          <div class="dopamine-gate-group">
            <label class="dopamine-gate-label">
              5) Are you seeking utility or stimulation?
            </label>
            <div class="dopamine-gate-radios">
              <input type="radio" class="dopamine-gate-radio" id="dg-need-info" name="needType" value="Information" required>
              <label class="dopamine-gate-radio-label" for="dg-need-info">ℹ️ Utility / Info</label>
              
              <input type="radio" class="dopamine-gate-radio" id="dg-need-dopamine" name="needType" value="Dopamine">
              <label class="dopamine-gate-radio-label" for="dg-need-dopamine">⚡ Stimulation</label>
            </div>
          </div>
        </div>

        <!-- Question 6: Future feeling -->
        <div class="dopamine-gate-step" data-step="6">
          <div class="dopamine-gate-group">
            <label class="dopamine-gate-label">
              6) If you spend 30 minutes here, how will you feel?
            </label>
            <div class="dopamine-gate-radios">
              <input type="radio" class="dopamine-gate-radio" id="dg-future-good" name="futureFeeling" value="Good" required>
              <label class="dopamine-gate-radio-label" for="dg-future-good">✅ Aligned</label>
              
              <input type="radio" class="dopamine-gate-radio" id="dg-future-bad" name="futureFeeling" value="Waste">
              <label class="dopamine-gate-radio-label" for="dg-future-bad">⚠️ Regretful</label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="dopamine-gate-actions">
          <button type="button" class="dopamine-gate-btn dopamine-gate-btn-secondary" id="dg-btn-back" style="display: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <button type="button" class="dopamine-gate-btn dopamine-gate-btn-secondary" id="dg-btn-leave">
            Leave site
          </button>
          <button type="button" class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-next">
            Next step
          </button>
          <button type="submit" class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-submit" style="display: none;">
            Evaluate
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
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
        <div class="dopamine-gate-result-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--dg-error)"/>
          </svg>
        </div>
        <h2 class="dopamine-gate-result-title">Setup Required</h2>
        <p class="dopamine-gate-result-message">
          Please provide your Gemini API Key in the extension settings to enable intelligent reflection tracking.
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
  const leaveBtn = document.getElementById("dg-btn-leave");
  const nextBtn = document.getElementById("dg-btn-next");
  const backBtn = document.getElementById("dg-btn-back");

  // Character counters
  setupCharacterCounter(document.getElementById("dg-reason") as HTMLTextAreaElement, "dg-reason-counter");
  setupCharacterCounter(document.getElementById("dg-goal-target") as HTMLTextAreaElement, "dg-goal-counter");
  setupCharacterCounter(document.getElementById("dg-alternative") as HTMLTextAreaElement, "dg-alternative-counter");

  leaveBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
  });

  nextBtn?.addEventListener("click", () => {
    if (validateCurrentStep()) {
      goToStep(currentStep + 1);
    }
  });

  backBtn?.addEventListener("click", () => {
    goToStep(currentStep - 1);
  });

  form?.addEventListener("submit", handleFormSubmit);
}

/**
 * Navigate to a specific step
 */
function goToStep(step: number): void {
  if (step < 1 || step > TOTAL_STEPS) return;

  const steps = document.querySelectorAll(".dopamine-gate-step");
  steps.forEach(s => s.classList.remove("active"));

  const targetStep = document.querySelector(`.dopamine-gate-step[data-step="${step}"]`);
  targetStep?.classList.add("active");

  currentStep = step;
  updateUIForStep();
}

/**
 * Update buttons and progress bar based on current step
 */
function updateUIForStep(): void {
  const nextBtn = document.getElementById("dg-btn-next");
  const submitBtn = document.getElementById("dg-btn-submit");
  const backBtn = document.getElementById("dg-btn-back");
  const progressBar = document.getElementById("dg-progress-bar");

  if (!nextBtn || !submitBtn || !backBtn || !progressBar) return;

  // Toggle buttons
  if (currentStep === TOTAL_STEPS) {
    nextBtn.style.display = "none";
    submitBtn.style.display = "inline-flex";
  } else {
    nextBtn.style.display = "inline-flex";
    submitBtn.style.display = "none";
  }

  backBtn.style.display = currentStep > 1 ? "inline-flex" : "none";

  // Update progress
  progressBar.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
}

/**
 * Validate only the current visible step
 */
function validateCurrentStep(): boolean {
  const currentStepEl = document.querySelector(`.dopamine-gate-step[data-step="${currentStep}"]`);
  const inputs = currentStepEl?.querySelectorAll("textarea, select, input[required]") as NodeListOf<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>;

  let isValid = true;

  inputs.forEach(input => {
    if (input.tagName === "TEXTAREA") {
      if (input.value.length < MIN_TEXT_LENGTH) {
        input.classList.add("invalid");
        isValid = false;
      } else {
        input.classList.remove("invalid");
      }
    } else if (input.tagName === "SELECT") {
      if (!input.value) {
        input.classList.add("invalid");
        isValid = false;
      } else {
        input.classList.remove("invalid");
      }
    } else if (input.type === "radio") {
      const name = input.getAttribute("name");
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        isValid = false;
      }
    }
  });

  return isValid;
}

/**
 * Setup character counter for textarea
 */
function setupCharacterCounter(textarea: HTMLTextAreaElement, counterId: string): void {
  const counter = document.getElementById(counterId);
  if (!textarea || !counter) return;

  const updateCounter = (): void => {
    const length = (textarea.value || "").length;
    if (counter) {
      counter.textContent = `${length}/${MIN_TEXT_LENGTH}`;
      counter.classList.remove("warning", "valid");
      if (length >= MIN_TEXT_LENGTH) {
        counter.classList.add("valid");
      } else if (length > 0) {
        counter.classList.add("warning");
      }
    }
  };

  ["input", "keyup", "change", "paste"].forEach(event => {
    textarea.addEventListener(event, updateCounter);
  });

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
    // First, check client-side rules (fast, offline)
    let decision = applyClientRules(answers);

    // If no client rule applies, ask background (to bypass CSP and protect API Key context)
    if (!decision) {
      console.log("[Dopamine Gate] Verifying background script...");

      // 1. PING background script to ensure it's alive
      try {
        const pingResponse = await chrome.runtime.sendMessage({ type: "PING" });
        if (!pingResponse || pingResponse.data !== "PONG") {
          throw new Error("Background script not responding properly.");
        }
        console.log("[Dopamine Gate] Background script active. Requesting evaluation...");
      } catch (e) {
        throw new Error("Could not connect to background script. Please reload the extension.");
      }

      // 2. Request AI Evaluation
      const evaluationPromise = chrome.runtime.sendMessage({
        type: "EVALUATE_REFLECTION",
        answers
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI Analysis timeout (60s)")), 60000)
      );

      const response = await Promise.race([evaluationPromise, timeoutPromise]) as any;

      if (response && response.success) {
        decision = response.decision;
      } else {
        throw new Error(response?.error || "Background evaluation failed");
      }
    }

    // decision is guaranteed to exist here if no error thrown
    if (decision) {
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
    }
  } catch (error: any) {
    console.error("[Dopamine Gate] Evaluation error:", error);

    // Check if it's a timeout vs other error
    if (error.message && error.message.includes("timeout")) {
      showResult({
        decision: "block",
        confidence: 1,
        message: "⏱️ AI took too long to respond. Refresh and try again, or check your internet connection.",
      });
    } else {
      showResult({
        decision: "block",
        confidence: 1,
        message: `AI Connection failure: ${error.message || "Unknown error"}. Access blocked for safety.`,
      });
    }
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
      <p class="dopamine-gate-loading-text">Analyzing your deep reflection...</p>
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
      <div class="dopamine-gate-result-icon">
        ${isBlocked ?
      `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--dg-error)"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>` :
      `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--dg-accent)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    }
      </div>
      <h2 class="dopamine-gate-result-title">${title}</h2>
      <p class="dopamine-gate-result-message">${decision.message}</p>
      ${isBlocked ? `
        <p class="dopamine-gate-countdown">This tab will self-destruct in <span id="dg-countdown">5</span>s</p>
      ` : `
        <div class="dopamine-gate-actions" style="justify-content: center;">
          <button class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-proceed">
            Proceed to Site
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
