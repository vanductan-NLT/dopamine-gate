"use strict";(()=>{var m={BLOCKLIST:"blocklist",API_KEY:"apiKey",LOGS:"logs"};async function g(e){return new Promise(i=>{chrome.storage.sync.get(e,t=>{i(t)})})}async function w(e){return new Promise(i=>{chrome.storage.sync.set(e,i)})}async function d(){return(await g([m.API_KEY])).apiKey??""}var L=100;async function u(e){let i=await E();i.unshift(e);let t=i.slice(0,L);await w({logs:t})}async function E(){return(await g([m.LOGS])).logs??[]}function p(e){return e.futureFeeling==="Waste"?{decision:"block",confidence:1,message:"You already identified this as a waste of time. Let's stop here! \u{1F6D1}"}:e.outcome==="Emptiness"?{decision:"block",confidence:.9,message:"Don't let yourself feel empty after scrolling. Go do something meaningful! \u2728"}:null}var l=20;var s=1,r=6;function k(){let e=document.createElement("link");e.rel="stylesheet",e.href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",document.head.appendChild(e)}function y(){return document.getElementById("dopamine-gate-overlay")!==null}function b(){return window.location.hostname}async function h(){if(console.log("[Dopamine Gate] Content Script v2.1 - Initializing..."),!window.dg_initializing){window.dg_initializing=!0;try{if(y()){console.log("[Dopamine Gate] Overlay already exists, skipping");return}k(),await d()?I():T(),window.dg_observer_active||(A(),window.dg_observer_active=!0)}finally{window.dg_initializing=!1}}}function A(){new MutationObserver(i=>{if(!y()){console.log("[Dopamine Gate] Blocker was removed by site. Re-injecting..."),h();return}document.body.style.overflow!=="hidden"&&(document.body.style.overflow="hidden")}).observe(document.documentElement,{childList:!0,subtree:!0})}function I(){let e=document.createElement("div");e.id="dopamine-gate-overlay",e.className="dopamine-gate-overlay",e.innerHTML=`
    <div class="dopamine-gate-form" id="dopamine-gate-form">
      <div class="dopamine-gate-progress-container">
        <div class="dopamine-gate-progress-bar" id="dg-progress-bar" style="width: ${1/r*100}%"></div>
      </div>
      
      <div class="dopamine-gate-header">
        <div class="dopamine-gate-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--dg-accent)"/>
          </svg>
        </div>
        <h1 class="dopamine-gate-title">System Check</h1>
        <p class="dopamine-gate-subtitle">Complete this brief reflection to unlock <strong>${b()}</strong></p>
      </div>

      <form id="dopamine-gate-reflection-form">
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
              <option value="Knowledge">\u{1F4DA} Learning / Insight</option>
              <option value="Real Entertainment">\u{1F3AE} Meaningful Recreation</option>
              <option value="Emptiness">\u{1F573}\uFE0F Empty Dopamine / Fatigue</option>
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
              <label class="dopamine-gate-radio-label" for="dg-need-info">\u2139\uFE0F Utility / Info</label>
              
              <input type="radio" class="dopamine-gate-radio" id="dg-need-dopamine" name="needType" value="Dopamine">
              <label class="dopamine-gate-radio-label" for="dg-need-dopamine">\u26A1 Stimulation</label>
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
              <label class="dopamine-gate-radio-label" for="dg-future-good">\u2705 Aligned</label>
              
              <input type="radio" class="dopamine-gate-radio" id="dg-future-bad" name="futureFeeling" value="Waste">
              <label class="dopamine-gate-radio-label" for="dg-future-bad">\u26A0\uFE0F Regretful</label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="dopamine-gate-actions">
          <button type="button" class="dopamine-gate-btn dopamine-gate-btn-secondary" id="dg-btn-back" style="display: none;">
            <span class="material-symbols-outlined">arrow_back</span>
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
  `,document.body.appendChild(e),document.body.style.overflow="hidden",S()}function T(){var i;let e=document.createElement("div");e.id="dopamine-gate-overlay",e.className="dopamine-gate-overlay",e.innerHTML=`
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
  `,document.body.appendChild(e),document.body.style.overflow="hidden",(i=document.getElementById("dg-btn-close-warning"))==null||i.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"CLOSE_TAB"})})}function S(){let e=document.getElementById("dopamine-gate-reflection-form"),i=document.getElementById("dg-btn-leave"),t=document.getElementById("dg-btn-next"),n=document.getElementById("dg-btn-back");c(document.getElementById("dg-reason"),"dg-reason-counter"),c(document.getElementById("dg-goal-target"),"dg-goal-counter"),c(document.getElementById("dg-alternative"),"dg-alternative-counter"),i==null||i.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"CLOSE_TAB"})}),t==null||t.addEventListener("click",()=>{D()&&f(s+1)}),n==null||n.addEventListener("click",()=>{f(s-1)}),e==null||e.addEventListener("submit",C)}function f(e){if(e<1||e>r)return;document.querySelectorAll(".dopamine-gate-step").forEach(n=>n.classList.remove("active"));let t=document.querySelector(`.dopamine-gate-step[data-step="${e}"]`);t==null||t.classList.add("active"),s=e,x()}function x(){let e=document.getElementById("dg-btn-next"),i=document.getElementById("dg-btn-submit"),t=document.getElementById("dg-btn-back"),n=document.getElementById("dg-progress-bar");!e||!i||!t||!n||(s===r?(e.style.display="none",i.style.display="inline-flex"):(e.style.display="inline-flex",i.style.display="none"),t.style.display=s>1?"inline-flex":"none",n.style.width=`${s/r*100}%`)}function D(){let e=document.querySelector(`.dopamine-gate-step[data-step="${s}"]`),i=e==null?void 0:e.querySelectorAll("textarea, select, input[required]"),t=!0;return i.forEach(n=>{if(n.tagName==="TEXTAREA")n.value.length<l?(n.classList.add("invalid"),t=!1):n.classList.remove("invalid");else if(n.tagName==="SELECT")n.value?n.classList.remove("invalid"):(n.classList.add("invalid"),t=!1);else if(n.type==="radio"){let o=n.getAttribute("name");document.querySelector(`input[name="${o}"]:checked`)||(t=!1)}}),t}function c(e,i){let t=document.getElementById(i);if(!e||!t)return;let n=()=>{let o=(e.value||"").length;t&&(t.textContent=`${o}/${l}`,t.classList.remove("warning","valid"),o>=l?t.classList.add("valid"):o>0&&t.classList.add("warning"))};["input","keyup","change","paste"].forEach(o=>{e.addEventListener(o,n)}),n()}async function C(e){e.preventDefault();let i=e.target,t=new FormData(i),n={reason:t.get("reason")||"",goalTarget:t.get("goalTarget")||"",alternativeAction:t.get("alternativeAction")||"",outcome:t.get("outcome")||"Emptiness",needType:t.get("needType")||"Dopamine",futureFeeling:t.get("futureFeeling")||"Waste"};if(B(n)){O();try{let o=p(n);if(!o){let a=await chrome.runtime.sendMessage({type:"EVALUATE_REFLECTION",answers:n});if(a&&a.success)o=a.decision;else throw new Error((a==null?void 0:a.error)||"Background evaluation failed")}if(o){let a={timestamp:Date.now(),domain:b(),answers:n,aiDecision:o};await u(a),v(o)}}catch(o){console.error("[Dopamine Gate] Evaluation error:",o),v({decision:"block",confidence:1,message:"AI Connection failure. Defaulting to block for safety."})}}}function B(e){let i=!0,t=document.getElementById("dg-reason-error"),n=document.getElementById("dg-reason");e.reason.length<l?(t==null||t.classList.add("visible"),n==null||n.classList.add("invalid"),i=!1):(t==null||t.classList.remove("visible"),n==null||n.classList.remove("invalid"));let o=document.getElementById("dg-alternative-error"),a=document.getElementById("dg-alternative");return e.alternativeAction.length<l?(o==null||o.classList.add("visible"),a==null||a.classList.add("invalid"),i=!1):(o==null||o.classList.remove("visible"),a==null||a.classList.remove("invalid")),i}function O(){let e=document.getElementById("dopamine-gate-form");e&&(e.innerHTML=`
    <div class="dopamine-gate-loading">
      <div class="dopamine-gate-spinner"></div>
      <p class="dopamine-gate-loading-text">Analyzing your deep reflection...</p>
    </div>
  `)}function v(e){var a;let i=document.getElementById("dopamine-gate-form");if(!i)return;let t=e.decision==="block",n=t?"Access Blocked":"Access Allowed",o=t?"blocked":"allowed";i.innerHTML=`
    <div class="dopamine-gate-result ${o}">
      <div class="dopamine-gate-result-icon">
        <span class="material-symbols-outlined" style="font-size: 64px;">${t?"block":"check_circle"}</span>
      </div>
      <h2 class="dopamine-gate-result-title">${n}</h2>
      <p class="dopamine-gate-result-message">${e.message}</p>
      ${t?`
        <p class="dopamine-gate-countdown">This tab will self-destruct in <span id="dg-countdown">5</span>s</p>
      `:`
        <div class="dopamine-gate-actions" style="justify-content: center;">
          <button class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-proceed">
            Proceed to Site
            <span class="material-symbols-outlined" style="margin-left: 8px;">arrow_forward</span>
          </button>
        </div>
      `}
    </div>
  `,t?P():(a=document.getElementById("dg-btn-proceed"))==null||a.addEventListener("click",()=>{_()})}function P(){let e=5,i=document.getElementById("dg-countdown"),t=setInterval(()=>{e--,i&&(i.textContent=e.toString()),e<=0&&(clearInterval(t),chrome.runtime.sendMessage({type:"CLOSE_TAB"}))},1e3)}function _(){let e=document.getElementById("dopamine-gate-overlay");e==null||e.remove(),document.body.style.overflow=""}h();})();
//# sourceMappingURL=contentScript.js.map
