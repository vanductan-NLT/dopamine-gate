"use strict";(()=>{var l={BLOCKLIST:"blocklist",API_KEY:"apiKey",LOGS:"logs",IS_ENABLED:"isEnabled"},v=["facebook.com","tiktok.com","twitter.com","instagram.com","youtube.com","reddit.com"];async function m(e){return new Promise(t=>{chrome.storage.sync.get(e,o=>{t(o)})})}async function p(){return(await m([l.BLOCKLIST])).blocklist??v}function y(e,t){try{let n=new URL(e).hostname.toLowerCase();return t.some(i=>{let c=i.toLowerCase();return n===c||n.endsWith("."+c)})}catch{return!1}}async function h(){return(await m([l.API_KEY])).apiKey??""}async function b(){return(await m([l.IS_ENABLED])).isEnabled!==!1}var A="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",P=`You are a productivity coach AI. 
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
}`;async function w(e){var n,i,c,u,g;let t=await h();if(!t)return{decision:"block",confidence:1,message:"API Key not configured. Please add it in the extension settings."};let o={reason:e.reason,goal_target:e.goalTarget,alternative_action:e.alternativeAction,outcome:e.outcome,need_type:e.needType,future_feeling:e.futureFeeling};try{console.log("[Dopamine Gate] Calling Gemini API...");let a=new AbortController,E=setTimeout(()=>a.abort(),25e3),s=await fetch(`${A}?key=${t}`,{method:"POST",headers:{"Content-Type":"application/json"},signal:a.signal,body:JSON.stringify({contents:[{parts:[{text:`${P}

User answers:
${JSON.stringify(o,null,2)}`}]}],generationConfig:{temperature:.1,topP:.8,maxOutputTokens:256}})});if(clearTimeout(E),!s.ok){let S=await s.json().catch(()=>({}));return console.error("Gemini API error:",S),s.status===400||s.status===403?{decision:"block",confidence:1,message:`Invalid API Key or restricted region (Status ${s.status}). Check Settings.`}:s.status===429?{decision:"block",confidence:1,message:"Rate limit exceeded. Please wait a moment before trying again."}:{decision:"block",confidence:1,message:`AI Connection Error (Status ${s.status}). Defaulting to block for safety.`}}let D=await s.json();console.log("[Dopamine Gate] Gemini response received successfully.");let f=(g=(u=(c=(i=(n=D.candidates)==null?void 0:n[0])==null?void 0:i.content)==null?void 0:c.parts)==null?void 0:u[0])==null?void 0:g.text;if(!f)throw new Error("Empty response from Gemini");let d=f.match(/\{[\s\S]*\}/);if(!d)throw new Error("No JSON found in response");let r=JSON.parse(d[0]);if(!r.decision||!["allow","block"].includes(r.decision))throw new Error("Invalid decision format");return{decision:r.decision,confidence:r.confidence??.5,message:r.message??"Decision based on AI evaluation",classification:r.classification}}catch(a){return a.name==="AbortError"?(console.error("[Dopamine Gate] Gemini API timeout"),{decision:"block",confidence:1,message:"\u23F1\uFE0F Gemini API level timeout. Check your connection or try again."}):(console.error("[Dopamine Gate] Gemini evaluation error:",a),{decision:"block",confidence:1,message:`AI Error: ${a.message||"Connection failed"}. Access blocked for safety.`})}}async function k(e,t){if(t&&!(t.startsWith("chrome://")||t.startsWith("chrome-extension://")))try{if(!await b()){console.debug("[Dopamine Gate] Extension is disabled, skipping check");return}let n=await p();y(t,n)&&(console.log(`[Dopamine Gate] Blocked domain detected: ${t}`),await chrome.scripting.insertCSS({target:{tabId:e},files:["overlay.css"]}),await chrome.scripting.executeScript({target:{tabId:e},files:["contentScript.js"]}))}catch(o){let n=o instanceof Error?o.message:String(o);console.debug("[Dopamine Gate] Navigation noise:",n)}}chrome.webNavigation.onCommitted.addListener(e=>{e.frameId===0&&k(e.tabId,e.url)});chrome.tabs.onUpdated.addListener((e,t,o)=>{t.url&&k(e,t.url)});chrome.runtime.onMessage.addListener((e,t,o)=>{var n;return console.log(`[Dopamine Gate] Action received: ${e.type}`),e.type==="CLOSE_TAB"?((n=t.tab)!=null&&n.id&&chrome.tabs.remove(t.tab.id),o({success:!0}),!1):e.type==="EVALUATE_REFLECTION"?(console.log("[Dopamine Gate] Starting proxy evaluation for:",t.url),w(e.answers).then(i=>{console.log("[Dopamine Gate] Evaluation success:",i.decision),o({success:!0,decision:i})}).catch(i=>{console.error("[Dopamine Gate] Proxy Evaluation Error:",i),o({success:!1,error:i instanceof Error?i.message:String(i)})}),!0):!1});chrome.runtime.onInstalled.addListener(e=>{e.reason==="install"?console.log("[Dopamine Gate] Extension installed successfully!"):e.reason==="update"&&console.log(`[Dopamine Gate] Updated to version ${chrome.runtime.getManifest().version}`)});console.log("[Dopamine Gate] Background service worker started");})();
//# sourceMappingURL=background.js.map
