console.log("🟢 [LateCalc] content.js injecting page script");  
  
// inject page-context script  
const script = document.createElement("script");  
script.src = chrome.runtime.getURL("injected.js");  
script.onload = () => script.remove();  
(document.head || document.documentElement).appendChild(script);  
  
// receive result  
window.addEventListener("message", (event) => {  
  if (event.source !== window) return;  
  if (event.data?.type === "LATECALC_RESULT") {  
    console.log("🟢 [LateCalc] Result received:", event.data.result);  
    chrome.storage.local.set({ lateCalcResult: event.data.result });   
  }  
});  