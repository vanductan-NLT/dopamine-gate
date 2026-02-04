"use strict";(()=>{var p={BLOCKLIST:"blocklist",API_KEY:"apiKey",LOGS:"logs"};async function f(e){return new Promise(n=>{chrome.storage.sync.get(e,t=>{n(t)})})}async function I(e){return new Promise(n=>{chrome.storage.sync.set(e,n)})}async function l(){return(await f([p.API_KEY])).apiKey??""}var A=100;async function v(e){let n=await k();n.unshift(e);let t=n.slice(0,A);await I({logs:t})}async function k(){return(await f([p.LOGS])).logs??[]}var T="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",D=`You are a productivity coach AI. 
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
  "message": "Brief explanation in Vietnamese",
  "classification": "productive" or "neutral" or "procrastination" or "emotional_escape"
}`;async function y(e){var i,o,a,d,m;let n=await l();if(!n)return{decision:"block",confidence:1,message:"API key ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\xECnh. Vui l\xF2ng th\xEAm API key trong Settings."};let t={reason:e.reason,goal_target:e.goalTarget,alternative_action:e.alternativeAction,outcome:e.outcome,need_type:e.needType,future_feeling:e.futureFeeling};try{let s=await fetch(`${T}?key=${n}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${D}

User answers:
${JSON.stringify(t,null,2)}`}]}],generationConfig:{temperature:.1,topP:.8,maxOutputTokens:256}})});if(!s.ok){let E=await s.json().catch(()=>({}));return console.error("Gemini API error:",E),s.status===400?{decision:"block",confidence:1,message:"API key kh\xF4ng h\u1EE3p l\u1EC7. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i trong Settings."}:{decision:"block",confidence:1,message:"L\u1ED7i k\u1EBFt n\u1ED1i v\u1EDBi AI. M\u1EB7c \u0111\u1ECBnh ch\u1EB7n \u0111\u1EC3 b\u1EA3o v\u1EC7 b\u1EA1n."}}let g=(m=(d=(a=(o=(i=(await s.json()).candidates)==null?void 0:i[0])==null?void 0:o.content)==null?void 0:a.parts)==null?void 0:d[0])==null?void 0:m.text;if(!g)throw new Error("Empty response from Gemini");let u=g.match(/\{[\s\S]*\}/);if(!u)throw new Error("No JSON found in response");let r=JSON.parse(u[0]);if(!r.decision||!["allow","block"].includes(r.decision))throw new Error("Invalid decision format");return{decision:r.decision,confidence:r.confidence??.5,message:r.message??"Quy\u1EBFt \u0111\u1ECBnh d\u1EF1a tr\xEAn AI",classification:r.classification}}catch(s){return console.error("Gemini evaluation error:",s),{decision:"block",confidence:.5,message:"Kh\xF4ng th\u1EC3 x\u1EED l\xFD ph\u1EA3n h\u1ED3i AI. M\u1EB7c \u0111\u1ECBnh ch\u1EB7n \u0111\u1EC3 b\u1EA3o v\u1EC7 b\u1EA1n."}}}function b(e){return e.futureFeeling==="Waste"?{decision:"block",confidence:1,message:"Ch\xEDnh b\u1EA1n c\u0169ng th\u1EA5y l\u01B0\u1EDBt ti\u1EBFp l\xE0 ph\xED th\u1EDDi gian. H\xE3y d\u1EEBng l\u1EA1i th\xF4i! \u{1F6D1}"}:e.outcome==="Emptiness"?{decision:"block",confidence:.9,message:"\u0110\u1EEBng \u0111\u1EC3 b\u1EA3n th\xE2n r\u01A1i v\xE0o c\u1EA3m gi\xE1c tr\u1ED1ng r\u1ED7ng sau khi l\u01B0\u1EDBt. \u0110i l\xE0m g\xEC \u0111\xF3 c\xF3 \xEDch h\u01A1n \u0111i! \u2728"}:null}var c=20;function S(){return document.getElementById("dopamine-gate-overlay")!==null}function L(){return window.location.hostname}async function x(){if(S()){console.log("[Dopamine Gate] Overlay already injected, skipping");return}if(!await l()){C();return}P()}function P(){let e=document.createElement("div");e.id="dopamine-gate-overlay",e.className="dopamine-gate-overlay",e.innerHTML=`
    <div class="dopamine-gate-form" id="dopamine-gate-form">
      <div class="dopamine-gate-header">
        <div class="dopamine-gate-logo">
          <img src="${chrome.runtime.getURL("icons/icon128.png")}" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 16px;">
        </div>
        <h1 class="dopamine-gate-title">Dopamine Gate</h1>
        <p class="dopamine-gate-subtitle">Take a deep breath. Reflect before you act.</p>
        <span class="dopamine-gate-domain">${L()}</span>
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
            <option value="Knowledge">\u{1F4DA} Learning / Insight</option>
            <option value="Real Entertainment">\u{1F3AE} Meaningful Recreation</option>
            <option value="Emptiness">\u{1F573}\uFE0F Empty Dopamine / Fatigue</option>
          </select>
        </div>

        <!-- Question 5: Need level -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            5) Am I seeking utility or stimulation?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-need-info" name="needType" value="Information" required>
            <label class="dopamine-gate-radio-label" for="dg-need-info">\u2139\uFE0F Utility / Information</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-need-dopamine" name="needType" value="Dopamine">
            <label class="dopamine-gate-radio-label" for="dg-need-dopamine">\u26A1 Stimulation / Dopamine</label>
          </div>
        </div>

        <!-- Question 6: Future feeling -->
        <div class="dopamine-gate-group">
          <label class="dopamine-gate-label">
            6) If I spend 30 minutes here, how will I feel afterwards?
          </label>
          <div class="dopamine-gate-radios">
            <input type="radio" class="dopamine-gate-radio" id="dg-future-good" name="futureFeeling" value="Good" required>
            <label class="dopamine-gate-radio-label" for="dg-future-good">\u2705 Aligned & Satisfied</label>
            
            <input type="radio" class="dopamine-gate-radio" id="dg-future-bad" name="futureFeeling" value="Waste">
            <label class="dopamine-gate-radio-label" for="dg-future-bad">\u26A0\uFE0F Regretful & Wasted</label>
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
  `,document.body.appendChild(e),document.body.style.overflow="hidden",O()}function C(){var n;let e=document.createElement("div");e.id="dopamine-gate-overlay",e.className="dopamine-gate-overlay",e.innerHTML=`
    <div class="dopamine-gate-form">
      <div class="dopamine-gate-result blocked">
        <div class="dopamine-gate-result-icon">\u26A0\uFE0F</div>
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
  `,document.body.appendChild(e),document.body.style.overflow="hidden",(n=document.getElementById("dg-btn-close-warning"))==null||n.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"CLOSE_TAB"})})}function O(){let e=document.getElementById("dopamine-gate-reflection-form"),n=document.getElementById("dg-reason"),t=document.getElementById("dg-alternative"),i=document.getElementById("dg-btn-leave");h(n,"dg-reason-counter"),h(t,"dg-alternative-counter"),i==null||i.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"CLOSE_TAB"})}),e==null||e.addEventListener("submit",R)}function h(e,n){let t=document.getElementById(n);if(!e||!t)return;let i=()=>{let o=e.value.length;t.textContent=`${o}/${c}`,t.classList.remove("warning","valid"),o>=c?t.classList.add("valid"):o>0&&t.classList.add("warning")};e.addEventListener("input",i),i()}async function R(e){e.preventDefault();let n=e.target,t=new FormData(n),i={reason:t.get("reason")||"",goalTarget:t.get("goalTarget")||"",alternativeAction:t.get("alternativeAction")||"",outcome:t.get("outcome")||"Emptiness",needType:t.get("needType")||"Dopamine",futureFeeling:t.get("futureFeeling")||"Waste"};if(B(i)){M();try{let o=b(i);o||(o=await y(i));let a={timestamp:Date.now(),domain:L(),answers:i,aiDecision:o};await v(a),w(o)}catch(o){console.error("[Dopamine Gate] Error evaluating:",o),w({decision:"block",confidence:1,message:"\u0110\xE3 x\u1EA3y ra l\u1ED7i. M\u1EB7c \u0111\u1ECBnh ch\u1EB7n \u0111\u1EC3 b\u1EA3o v\u1EC7 b\u1EA1n."})}}}function B(e){let n=!0,t=document.getElementById("dg-reason-error"),i=document.getElementById("dg-reason");e.reason.length<c?(t==null||t.classList.add("visible"),i==null||i.classList.add("invalid"),n=!1):(t==null||t.classList.remove("visible"),i==null||i.classList.remove("invalid"));let o=document.getElementById("dg-alternative-error"),a=document.getElementById("dg-alternative");return e.alternativeAction.length<c?(o==null||o.classList.add("visible"),a==null||a.classList.add("invalid"),n=!1):(o==null||o.classList.remove("visible"),a==null||a.classList.remove("invalid")),n}function M(){let e=document.getElementById("dopamine-gate-form");e&&(e.innerHTML=`
    <div class="dopamine-gate-loading">
      <div class="dopamine-gate-spinner"></div>
      <p class="dopamine-gate-loading-text">Analyzing your response...</p>
    </div>
  `)}function w(e){var a;let n=document.getElementById("dopamine-gate-form");if(!n)return;let t=e.decision==="block",i=t?"Access Blocked":"Access Allowed",o=t?"blocked":"allowed";n.innerHTML=`
    <div class="dopamine-gate-result ${o}">
      <div class="dopamine-gate-result-icon">${t?"\u2715":"\u2713"}</div>
      <h2 class="dopamine-gate-result-title">${i}</h2>
      <p class="dopamine-gate-result-message">${e.message}</p>
      ${t?`
        <p class="dopamine-gate-countdown">Tab will close in <span id="dg-countdown">5</span> seconds...</p>
      `:`
        <div class="dopamine-gate-actions" style="justify-content: center;">
          <button class="dopamine-gate-btn dopamine-gate-btn-primary" id="dg-btn-proceed">
            Proceed to Site \u2192
          </button>
        </div>
      `}
    </div>
  `,t?K():(a=document.getElementById("dg-btn-proceed"))==null||a.addEventListener("click",()=>{_()})}function K(){let e=5,n=document.getElementById("dg-countdown"),t=setInterval(()=>{e--,n&&(n.textContent=e.toString()),e<=0&&(clearInterval(t),chrome.runtime.sendMessage({type:"CLOSE_TAB"}))},1e3)}function _(){let e=document.getElementById("dopamine-gate-overlay");e==null||e.remove(),document.body.style.overflow=""}x();})();
//# sourceMappingURL=contentScript.js.map
