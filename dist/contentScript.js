"use strict";(()=>{var y={BLOCKLIST:"blocklist",API_KEY:"apiKey",LOGS:"logs"};async function b(e){return new Promise(i=>{chrome.storage.sync.get(e,t=>{i(t)})})}async function x(e){return new Promise(i=>{chrome.storage.sync.set(e,i)})}async function c(){return(await b([y.API_KEY])).apiKey??""}var D=100;async function h(e){let i=await C();i.unshift(e);let t=i.slice(0,D);await x({logs:t})}async function C(){return(await b([y.LOGS])).logs??[]}var B="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",P=`You are a productivity coach AI. 
Classify whether visiting this site is aligned with long-term goals.
Return strict JSON only, no markdown, no explanation.

Classification categories:
- productive: Genuinely helps with work/learning goals
- neutral: Neither helpful nor harmful
- procrastination: Avoiding important tasks
- emotional_escape: Using internet to avoid feelings/stress

Decision rules:
- If future_feeling is "Waste" \u2192 block
- If outcome is "Emptiness" \u2192 block
- If answers indicate procrastination or emotional escape \u2192 block
- Otherwise allow cautiously

Return ONLY this JSON format:
{
  "decision": "allow" or "block",
  "confidence": 0.0 to 1.0,
  "message": "Brief explanation in English",
  "classification": "productive" or "neutral" or "procrastination" or "emotional_escape"
}`;async function w(e){var n,o,a,u,p;let i=await c();if(!i)return{decision:"block",confidence:1,message:"API Key not configured. Please add it in the extension settings."};let t={reason:e.reason,goal_target:e.goalTarget,alternative_action:e.alternativeAction,outcome:e.outcome,need_type:e.needType,future_feeling:e.futureFeeling};try{let s=await fetch(`${B}?key=${i}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${P}

User answers:
${JSON.stringify(t,null,2)}`}]}],generationConfig:{temperature:.1,topP:.8,maxOutputTokens:256}})});if(!s.ok){let S=await s.json().catch(()=>({}));return console.error("Gemini API error:",S),s.status===400||s.status===403?{decision:"block",confidence:1,message:`Invalid API Key or restricted region (Status ${s.status}). Check Settings.`}:s.status===429?{decision:"block",confidence:1,message:"Rate limit exceeded. Please wait a moment before trying again."}:{decision:"block",confidence:1,message:`AI Connection Error (Status ${s.status}). Defaulting to block for safety.`}}let f=(p=(u=(a=(o=(n=(await s.json()).candidates)==null?void 0:n[0])==null?void 0:o.content)==null?void 0:a.parts)==null?void 0:u[0])==null?void 0:p.text;if(!f)throw new Error("Empty response from Gemini");let v=f.match(/\{[\s\S]*\}/);if(!v)throw new Error("No JSON found in response");let r=JSON.parse(v[0]);if(!r.decision||!["allow","block"].includes(r.decision))throw new Error("Invalid decision format");return{decision:r.decision,confidence:r.confidence??.5,message:r.message??"Decision based on AI evaluation",classification:r.classification}}catch(s){return console.error("Gemini evaluation error:",s),{decision:"block",confidence:.5,message:"Failed to process AI response. Defaulting to block for safety."}}}function E(e){return e.futureFeeling==="Waste"?{decision:"block",confidence:1,message:"You already identified this as a waste of time. Let's stop here! \u{1F6D1}"}:e.outcome==="Emptiness"?{decision:"block",confidence:.9,message:"Don't let yourself feel empty after scrolling. Go do something meaningful! \u2728"}:null}var d=20;var l=1,m=6;function O(){let e=document.createElement("link");e.rel="stylesheet",e.href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",document.head.appendChild(e)}function A(){return document.getElementById("dopamine-gate-overlay")!==null}function I(){return window.location.hostname}async function T(){if(!window.dg_initializing){window.dg_initializing=!0;try{if(A()){console.log("[Dopamine Gate] Overlay already exists, skipping");return}O(),await c()?R():M(),window.dg_observer_active||(_(),window.dg_observer_active=!0)}finally{window.dg_initializing=!1}}}function _(){new MutationObserver(i=>{if(!A()){console.log("[Dopamine Gate] Blocker was removed by site. Re-injecting..."),T();return}document.body.style.overflow!=="hidden"&&(document.body.style.overflow="hidden")}).observe(document.documentElement,{childList:!0,subtree:!0})}function R(){let e=document.createElement("div");e.id="dopamine-gate-overlay",e.className="dopamine-gate-overlay",e.innerHTML=`
    <div class="dopamine-gate-form" id="dopamine-gate-form">
      <div class="dopamine-gate-progress-container">
        <div class="dopamine-gate-progress-bar" id="dg-progress-bar" style="width: ${1/m*100}%"></div>
      </div>
      
      <div class="dopamine-gate-header">
        <div class="dopamine-gate-logo">
          <img src="${chrome.runtime.getURL("icons/icon128.png")}" alt="Logo" style="width: 48px; height: 48px; margin-bottom: 12px;">
        </div>
        <h1 class="dopamine-gate-title">System Check</h1>
        <p class="dopamine-gate-subtitle">Complete this brief reflection to unlock <strong>${I()}</strong></p>
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
  `,document.body.appendChild(e),document.body.style.overflow="hidden",K()}function M(){var i;let e=document.createElement("div");e.id="dopamine-gate-overlay",e.className="dopamine-gate-overlay",e.innerHTML=`
    <div class="dopamine-gate-form">
      <div class="dopamine-gate-result blocked">
        <div class="dopamine-gate-result-icon">
          <span class="material-symbols-outlined" style="font-size: 64px;">settings_heart</span>
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
  `,document.body.appendChild(e),document.body.style.overflow="hidden",(i=document.getElementById("dg-btn-close-warning"))==null||i.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"CLOSE_TAB"})})}function K(){let e=document.getElementById("dopamine-gate-reflection-form"),i=document.getElementById("dg-btn-leave"),t=document.getElementById("dg-btn-next"),n=document.getElementById("dg-btn-back");g(document.getElementById("dg-reason"),"dg-reason-counter"),g(document.getElementById("dg-goal-target"),"dg-goal-counter"),g(document.getElementById("dg-alternative"),"dg-alternative-counter"),i==null||i.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"CLOSE_TAB"})}),t==null||t.addEventListener("click",()=>{$()&&L(l+1)}),n==null||n.addEventListener("click",()=>{L(l-1)}),e==null||e.addEventListener("submit",F)}function L(e){if(e<1||e>m)return;document.querySelectorAll(".dopamine-gate-step").forEach(n=>n.classList.remove("active"));let t=document.querySelector(`.dopamine-gate-step[data-step="${e}"]`);t==null||t.classList.add("active"),l=e,G()}function G(){let e=document.getElementById("dg-btn-next"),i=document.getElementById("dg-btn-submit"),t=document.getElementById("dg-btn-back"),n=document.getElementById("dg-progress-bar");!e||!i||!t||!n||(l===m?(e.style.display="none",i.style.display="inline-flex"):(e.style.display="inline-flex",i.style.display="none"),t.style.display=l>1?"inline-flex":"none",n.style.width=`${l/m*100}%`)}function $(){let e=document.querySelector(`.dopamine-gate-step[data-step="${l}"]`),i=e==null?void 0:e.querySelectorAll("textarea, select, input[required]"),t=!0;return i.forEach(n=>{if(n.tagName==="TEXTAREA")n.value.length<d?(n.classList.add("invalid"),t=!1):n.classList.remove("invalid");else if(n.tagName==="SELECT")n.value?n.classList.remove("invalid"):(n.classList.add("invalid"),t=!1);else if(n.type==="radio"){let o=n.getAttribute("name");document.querySelector(`input[name="${o}"]:checked`)||(t=!1)}}),t}function g(e,i){let t=document.getElementById(i);if(!e||!t)return;let n=()=>{let o=(e.value||"").length;t&&(t.textContent=`${o}/${d}`,t.classList.remove("warning","valid"),o>=d?t.classList.add("valid"):o>0&&t.classList.add("warning"))};["input","keyup","change","paste"].forEach(o=>{e.addEventListener(o,n)}),n()}async function F(e){e.preventDefault();let i=e.target,t=new FormData(i),n={reason:t.get("reason")||"",goalTarget:t.get("goalTarget")||"",alternativeAction:t.get("alternativeAction")||"",outcome:t.get("outcome")||"Emptiness",needType:t.get("needType")||"Dopamine",futureFeeling:t.get("futureFeeling")||"Waste"};if(N(n)){j();try{let o=E(n);o||(o=await w(n));let a={timestamp:Date.now(),domain:I(),answers:n,aiDecision:o};await h(a),k(o)}catch(o){console.error("[Dopamine Gate] Error evaluating:",o),k({decision:"block",confidence:1,message:"An unexpected error occurred. Defaulting to block for safety."})}}}function N(e){let i=!0,t=document.getElementById("dg-reason-error"),n=document.getElementById("dg-reason");e.reason.length<d?(t==null||t.classList.add("visible"),n==null||n.classList.add("invalid"),i=!1):(t==null||t.classList.remove("visible"),n==null||n.classList.remove("invalid"));let o=document.getElementById("dg-alternative-error"),a=document.getElementById("dg-alternative");return e.alternativeAction.length<d?(o==null||o.classList.add("visible"),a==null||a.classList.add("invalid"),i=!1):(o==null||o.classList.remove("visible"),a==null||a.classList.remove("invalid")),i}function j(){let e=document.getElementById("dopamine-gate-form");e&&(e.innerHTML=`
    <div class="dopamine-gate-loading">
      <div class="dopamine-gate-spinner"></div>
      <p class="dopamine-gate-loading-text">Analyzing your deep reflection...</p>
    </div>
  `)}function k(e){var a;let i=document.getElementById("dopamine-gate-form");if(!i)return;let t=e.decision==="block",n=t?"Access Blocked":"Access Allowed",o=t?"blocked":"allowed";i.innerHTML=`
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
  `,t?q():(a=document.getElementById("dg-btn-proceed"))==null||a.addEventListener("click",()=>{H()})}function q(){let e=5,i=document.getElementById("dg-countdown"),t=setInterval(()=>{e--,i&&(i.textContent=e.toString()),e<=0&&(clearInterval(t),chrome.runtime.sendMessage({type:"CLOSE_TAB"}))},1e3)}function H(){let e=document.getElementById("dopamine-gate-overlay");e==null||e.remove(),document.body.style.overflow=""}T();})();
//# sourceMappingURL=contentScript.js.map
