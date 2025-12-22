(function () {  
  console.log("🟢 [LateCalc] injected.js loaded (XHR page hook)");  
  
  const NINE_AM = 32400;  
  
  function calculateLate(days) {  
  let totalPenaltySeconds = 0;  
  days.forEach(d => {  
    const scheduledIn = d?.StartingTime?.TotalSeconds;  
    const scheduledOut = d?.EndTime?.TotalSeconds;  
  
    const actualIn = Number(d.ActualInTime);  
    const actualOut = Number(d.ActualOutTime);  
  
    // Skip invalid data  
    if (!scheduledIn || !scheduledOut) return;  
    if (!actualIn || !actualOut) return;  

    // Skip non-working days (weekend, holiday, leave)  
    if ([99, 8, 9, 10].includes(d.fkFlagCategoryId)) return;  
  
    // Skip half-day  
    if (d.fkFlagCategoryId === 3) return;  
  
    // ✅ Late arrival  
    if (actualIn > scheduledIn) {  
      totalPenaltySeconds += (actualIn - scheduledIn);  
    }   
    // ✅ Early departure  
    if (actualOut < scheduledOut) {  
      totalPenaltySeconds += (scheduledOut - actualOut);  
    }  
  });  
  console.log(`✅ [LateCalc] total mminutes: ${totalPenaltySeconds / 60}`);
  return {  
    penaltySeconds: totalPenaltySeconds,  
    penaltyMinutes: Math.round(totalPenaltySeconds / 60)  
  };   
}     
  
  const originalOpen = XMLHttpRequest.prototype.open;  
  const originalSend = XMLHttpRequest.prototype.send;  
  
  XMLHttpRequest.prototype.open = function (method, url) {  
    this._lateCalcUrl = url;  
    return originalOpen.apply(this, arguments);  
  };  
  
  XMLHttpRequest.prototype.send = function () {  
    this.addEventListener("load", () => {  
      try {  
        if (  
          this.responseText &&  
          typeof this.responseText === "string" &&  
          this.responseText.includes("attendanceFlagSummaryData")  
        ) {  
          console.log("✅ [LateCalc] Attendance XHR captured (page context)");  
          const json = JSON.parse(this.responseText);  
          const days = json?.attendanceFlagSummaryData?.[0];  
  
          if (!Array.isArray(days)) return;  
  
          const result = calculateLate(days);   
          window.postMessage(  
            { type: "LATECALC_RESULT", result },  
            "*"  
          );  
        }  
      } catch (e) {  
        console.error("❌ [LateCalc] XHR parse error", e);  
      }  
    });  
  
    return originalSend.apply(this, arguments);  
  };  
  
  console.log("✅ [LateCalc] Page‑context XHR hook installed");  
})();  