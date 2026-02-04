"use strict";(()=>{var c={BLOCKLIST:"blocklist",API_KEY:"apiKey",LOGS:"logs",IS_ENABLED:"isEnabled"},D=["facebook.com","tiktok.com","twitter.com","instagram.com","youtube.com","reddit.com"];async function l(e){return new Promise(t=>{chrome.storage.sync.get(e,o=>{t(o)})})}async function d(){return(await l([c.BLOCKLIST])).blocklist??D}function p(e,t){try{let i=new URL(e).hostname.toLowerCase();return t.some(n=>{let r=n.toLowerCase();return i===r||i.endsWith("."+r)})}catch{return!1}}async function y(){return(await l([c.API_KEY])).apiKey??""}async function h(){return(await l([c.IS_ENABLED])).isEnabled!==!1}var S="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",v=`You are a productivity coach AI. 
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
}`;async function b(e){var i,n,r,u,m;let t=await y();if(!t)return{decision:"block",confidence:1,message:"API Key not configured. Please add it in the extension settings."};let o={reason:e.reason,goal_target:e.goalTarget,alternative_action:e.alternativeAction,outcome:e.outcome,need_type:e.needType,future_feeling:e.futureFeeling};try{console.log("[Dopamine Gate] Calling Gemini API...");let s=await fetch(`${S}?key=${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${v}

User answers:
${JSON.stringify(o,null,2)}`}]}],generationConfig:{temperature:.1,topP:.8,maxOutputTokens:256}})});if(!s.ok){let E=await s.json().catch(()=>({}));return console.error("Gemini API error:",E),s.status===400||s.status===403?{decision:"block",confidence:1,message:`Invalid API Key or restricted region (Status ${s.status}). Check Settings.`}:s.status===429?{decision:"block",confidence:1,message:"Rate limit exceeded. Please wait a moment before trying again."}:{decision:"block",confidence:1,message:`AI Connection Error (Status ${s.status}). Defaulting to block for safety.`}}let k=await s.json();console.log("[Dopamine Gate] Gemini response received successfully.");let g=(m=(u=(r=(n=(i=k.candidates)==null?void 0:i[0])==null?void 0:n.content)==null?void 0:r.parts)==null?void 0:u[0])==null?void 0:m.text;if(!g)throw new Error("Empty response from Gemini");let f=g.match(/\{[\s\S]*\}/);if(!f)throw new Error("No JSON found in response");let a=JSON.parse(f[0]);if(!a.decision||!["allow","block"].includes(a.decision))throw new Error("Invalid decision format");return{decision:a.decision,confidence:a.confidence??.5,message:a.message??"Decision based on AI evaluation",classification:a.classification}}catch(s){return console.error("Gemini evaluation error:",s),{decision:"block",confidence:.5,message:"Failed to process AI response. Defaulting to block for safety."}}}async function w(e,t){if(t&&!(t.startsWith("chrome://")||t.startsWith("chrome-extension://")))try{if(!await h()){console.debug("[Dopamine Gate] Extension is disabled, skipping check");return}let i=await d();p(t,i)&&(console.log(`[Dopamine Gate] Blocked domain detected: ${t}`),await chrome.scripting.insertCSS({target:{tabId:e},files:["overlay.css"]}),await chrome.scripting.executeScript({target:{tabId:e},files:["contentScript.js"]}))}catch(o){let i=o instanceof Error?o.message:String(o);console.debug("[Dopamine Gate] Navigation noise:",i)}}chrome.webNavigation.onCommitted.addListener(e=>{e.frameId===0&&w(e.tabId,e.url)});chrome.tabs.onUpdated.addListener((e,t,o)=>{t.url&&w(e,t.url)});chrome.runtime.onMessage.addListener((e,t,o)=>{var i;return console.log(`[Dopamine Gate] Action received: ${e.type}`),e.type==="CLOSE_TAB"?((i=t.tab)!=null&&i.id&&chrome.tabs.remove(t.tab.id),o({success:!0}),!1):e.type==="EVALUATE_REFLECTION"?(console.log("[Dopamine Gate] Starting proxy evaluation for:",t.url),b(e.answers).then(n=>{console.log("[Dopamine Gate] Evaluation success:",n.decision),o({success:!0,decision:n})}).catch(n=>{console.error("[Dopamine Gate] Proxy Evaluation Error:",n),o({success:!1,error:n instanceof Error?n.message:String(n)})}),!0):!1});chrome.runtime.onInstalled.addListener(e=>{e.reason==="install"?console.log("[Dopamine Gate] Extension installed successfully!"):e.reason==="update"&&console.log(`[Dopamine Gate] Updated to version ${chrome.runtime.getManifest().version}`)});console.log("[Dopamine Gate] Background service worker started");})();
//# sourceMappingURL=background.js.map
