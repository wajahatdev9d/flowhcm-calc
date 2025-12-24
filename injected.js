(function () {  
  console.log("🟢 [LateCalc] injected.js loaded (XHR page hook)");  
  
  const NINE_AM = 32400;  
  
function calculateLate(days) {
  let totalPenaltyMinutes = 0;

  const NINE_AM = 9 * 3600;
  const TWELVE_PM = 12 * 3600;
  const TWO_PM = 14 * 3600;
  const DAY_SECONDS = 86400;

  days.forEach(d => {
    let dayPenaltyMinutes = 0;

    const scheduledIn = d?.StartingTime?.TotalSeconds;
    const scheduledOut = d?.EndTime?.TotalSeconds;

    const actualIn = Number(d.ActualInTime);
    const actualOut = Number(d.ActualOutTime);

    if (!scheduledIn || !scheduledOut) return;

    // Skip non-working / invalid days
    if ([99, 8, 9, 4, 6, 7, 10].includes(d.fkFlagCategoryId)) return;

    /** ---------------- HALF DAY ---------------- */
    if (d.fkFlagCategoryId === 3) {
      if (!actualIn) return;

      // First half
      if (actualIn < TWELVE_PM) {
        if (actualIn > NINE_AM) {
          const lateInMinutes = Math.floor((actualIn - NINE_AM) / 60);
          dayPenaltyMinutes += lateInMinutes;
        }
      }
      // Second half
      else {
        if (actualIn > TWO_PM) {
          const lateInMinutes = Math.floor((actualIn - TWO_PM) / 60);
          dayPenaltyMinutes += lateInMinutes;
        }
      }
    }

    /** ---------------- FULL DAY ---------------- */
    else {
      // Late check-in
      if (actualIn && actualIn > scheduledIn) {
        const lateInMinutes = Math.floor((actualIn - scheduledIn) / 60);
        dayPenaltyMinutes += lateInMinutes;
      }

      // Early check-out
      const validActualOut =
        actualOut > 0 && actualOut < DAY_SECONDS;

      if (validActualOut && actualOut < scheduledOut) {
        const earlyOutMinutes = Math.floor(
          (scheduledOut - actualOut) / 60
        );
        dayPenaltyMinutes += earlyOutMinutes;
      }
    }
    // ✅ Add per-day total
    totalPenaltyMinutes += dayPenaltyMinutes;
  });

  console.log(
    `✅ [LateCalc] total penalty minutes (floor-based): ${totalPenaltyMinutes}`
  );

  return {
    penaltyMinutes: totalPenaltyMinutes
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