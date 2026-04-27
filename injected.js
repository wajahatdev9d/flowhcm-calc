(function () {  
  console.log("🟢 [LateCalc] injected.js loaded (Specific Policy Update)");  
  
  function calculateLate(days) {
    let totalPenaltyMinutes = 0;

    const NINE_AM = 9 * 3600;
    const TEN_FIFTY_NINE_AM = 10 * 3600 + 59 * 60 + 59; // 10:59:59
    const ONE_THIRTY_PM = 13.5 * 3600;                 // 13:30:00
    const THREE_PM = 15 * 3600;                        // 15:00:00
    const DAY_SECONDS = 86400;

    days.forEach(d => {
      let dayPenaltyMinutes = 0;

      const scheduledIn = d?.StartingTime?.TotalSeconds;
      const scheduledOut = d?.EndTime?.TotalSeconds;
      const actualIn = Number(d.ActualInTime);
      const actualOut = Number(d.ActualOutTime);

      if (!scheduledIn || !scheduledOut) return;

      // Skip non-working / invalid days based on FlagName (more reliable than category IDs)
      const flagName = d.FlagName?.toLowerCase() || "";
      const skipNames = ["off", "half day", "full day leave", "short day", "absent", "leave", "missing", "sch days", "upcoming"];
      if (skipNames.some(name => flagName.includes(name))) return;

      /** ---------------- LATE ARRIVAL POLICY ---------------- */
      // If arrives between 09:01:00 AM to 10:59:59 AM
      if (actualIn > NINE_AM && actualIn <= TEN_FIFTY_NINE_AM) {
        const lateInMinutes = Math.floor((actualIn - NINE_AM) / 60);
        dayPenaltyMinutes += lateInMinutes;
      }

      /** ---------------- EARLY DEPARTURE POLICY ---------------- */
      // If leaves between 01:30:00 PM and 03:00 PM
      const validActualOut = actualOut > 0 && actualOut < DAY_SECONDS;
      
      if (validActualOut && actualOut >= ONE_THIRTY_PM && actualOut <= THREE_PM) {
        if (actualOut < scheduledOut) {
          const earlyOutMinutes = Math.floor((scheduledOut - actualOut) / 60);
          dayPenaltyMinutes += earlyOutMinutes;
        }
      }
      console.log(`✅ [LateCalc] day penalty minutes : ${dayPenaltyMinutes}`);
      totalPenaltyMinutes += dayPenaltyMinutes;
    });

    console.log(`✅ [LateCalc] Total penalty minutes (8hr adjustment): ${totalPenaltyMinutes}`);

    return {
      penaltyMinutes: totalPenaltyMinutes
    };
  }

  // --- XHR Hook (Original Structure) ---
  const originalOpen = XMLHttpRequest.prototype.open;  
  const originalSend = XMLHttpRequest.prototype.send;  
  
  XMLHttpRequest.prototype.open = function (method, url) {  
    this._lateCalcUrl = url;  
    return originalOpen.apply(this, arguments);  
  };  
  
  XMLHttpRequest.prototype.send = function () {  
    this.addEventListener("load", () => {  
      try {  
        if (this.responseText && this.responseText.includes("attendanceFlagSummaryData")) {  
          const json = JSON.parse(this.responseText);  
          const days = json?.attendanceFlagSummaryData?.[0];  
          if (!Array.isArray(days)) return;  
  
          const result = calculateLate(days);   
          window.postMessage({ type: "LATECALC_RESULT", result }, "*");  
        }  
      } catch (e) {  
        console.error("❌ [LateCalc] XHR parse error", e);  
      }  
    });  
    return originalSend.apply(this, arguments);  
  };  
})();