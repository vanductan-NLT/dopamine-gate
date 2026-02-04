"use strict";(()=>{var g={BLOCKLIST:"blocklist",API_KEY:"apiKey",LOGS:"logs"},v=["facebook.com","tiktok.com","twitter.com","instagram.com","youtube.com","reddit.com"];async function f(e){return new Promise(t=>{chrome.storage.sync.get(e,o=>{t(o)})})}async function d(){return(await f([g.BLOCKLIST])).blocklist??v}function p(e,t){try{let n=new URL(e).hostname.toLowerCase();return t.some(i=>{let a=i.toLowerCase();return n===a||n.endsWith("."+a)})}catch{return!1}}async function y(){return(await f([g.API_KEY])).apiKey??""}var S="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",D=`You are a productivity coach AI. 
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
}`;async function h(e){var n,i,a,c,l;let t=await y();if(!t)return{decision:"block",confidence:1,message:"API Key not configured. Please add it in the extension settings."};let o={reason:e.reason,goal_target:e.goalTarget,alternative_action:e.alternativeAction,outcome:e.outcome,need_type:e.needType,future_feeling:e.futureFeeling};try{console.log("[Dopamine Gate] Calling Gemini API...");let s=await fetch(`${S}?key=${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${D}

User answers:
${JSON.stringify(o,null,2)}`}]}],generationConfig:{temperature:.1,topP:.8,maxOutputTokens:256}})});if(!s.ok){let b=await s.json().catch(()=>({}));return console.error("Gemini API error:",b),s.status===400||s.status===403?{decision:"block",confidence:1,message:`Invalid API Key or restricted region (Status ${s.status}). Check Settings.`}:s.status===429?{decision:"block",confidence:1,message:"Rate limit exceeded. Please wait a moment before trying again."}:{decision:"block",confidence:1,message:`AI Connection Error (Status ${s.status}). Defaulting to block for safety.`}}let k=await s.json();console.log("[Dopamine Gate] Gemini response received successfully.");let m=(l=(c=(a=(i=(n=k.candidates)==null?void 0:n[0])==null?void 0:i.content)==null?void 0:a.parts)==null?void 0:c[0])==null?void 0:l.text;if(!m)throw new Error("Empty response from Gemini");let u=m.match(/\{[\s\S]*\}/);if(!u)throw new Error("No JSON found in response");let r=JSON.parse(u[0]);if(!r.decision||!["allow","block"].includes(r.decision))throw new Error("Invalid decision format");return{decision:r.decision,confidence:r.confidence??.5,message:r.message??"Decision based on AI evaluation",classification:r.classification}}catch(s){return console.error("Gemini evaluation error:",s),{decision:"block",confidence:.5,message:"Failed to process AI response. Defaulting to block for safety."}}}async function w(e,t){if(t&&!(t.startsWith("chrome://")||t.startsWith("chrome-extension://")))try{let o=await d();p(t,o)&&(console.log(`[Dopamine Gate] Blocked domain detected: ${t}`),await chrome.scripting.insertCSS({target:{tabId:e},files:["overlay.css"]}),await chrome.scripting.executeScript({target:{tabId:e},files:["contentScript.js"]}))}catch(o){let n=o instanceof Error?o.message:String(o);console.debug("[Dopamine Gate] Navigation noise:",n)}}chrome.webNavigation.onCommitted.addListener(e=>{e.frameId===0&&w(e.tabId,e.url)});chrome.tabs.onUpdated.addListener((e,t,o)=>{t.url&&w(e,t.url)});chrome.runtime.onMessage.addListener((e,t,o)=>{var n;return console.log(`[Dopamine Gate] Action received: ${e.type}`),e.type==="CLOSE_TAB"?((n=t.tab)!=null&&n.id&&chrome.tabs.remove(t.tab.id),o({success:!0}),!1):e.type==="EVALUATE_REFLECTION"?(console.log("[Dopamine Gate] Starting proxy evaluation for:",t.url),h(e.answers).then(i=>{console.log("[Dopamine Gate] Evaluation success:",i.decision),o({success:!0,decision:i})}).catch(i=>{console.error("[Dopamine Gate] Proxy Evaluation Error:",i),o({success:!1,error:i instanceof Error?i.message:String(i)})}),!0):!1});chrome.runtime.onInstalled.addListener(e=>{e.reason==="install"?console.log("[Dopamine Gate] Extension installed successfully!"):e.reason==="update"&&console.log(`[Dopamine Gate] Updated to version ${chrome.runtime.getManifest().version}`)});console.log("[Dopamine Gate] Background service worker started");})();
//# sourceMappingURL=background.js.map
