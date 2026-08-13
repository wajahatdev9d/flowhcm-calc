(function () {  
  console.log("🟢 [LateCalc] injected.js loaded (Specific Policy Update)");  
  
  function calculateLate(days) {
    let totalPenaltyMinutes = 0;

    const NINE_AM = 9 * 3600;
    const ELEVEN_FIFTY_NINE_PM = 11 * 3600 + 59 * 60 + 59; // 11:59:59 AM
    const TWELVE_PM = 12 * 3600; // 12:00 PM
    const FOUR_PM = 16 * 3600; // 04:00 PM
    const SIX_PM = 18 * 3600; // 06:00 PM
    const DAY_SECONDS = 86400;
    const FLEX_TIME_MINUTES = 8 * 60; // 8 hours = 480 minutes

    days.forEach(d => {
      let dayPenaltyMinutes = 0;

      const scheduledIn = d?.StartingTime?.TotalSeconds;
      const scheduledOut = d?.EndTime?.TotalSeconds;
      const actualIn = Number(d.ActualInTime);
      const actualOut = Number(d.ActualOutTime);
      const flagName = d.FlagName || "";
      const scheduleDate = d.ScheduleInDate || "unknown";

      console.log(`📅 [LateCalc] Processing: ${scheduleDate} | Flag: ${flagName} | In: ${actualIn} | Out: ${actualOut} | Scheduled: ${scheduledIn}-${scheduledOut}`);

      if (!scheduledIn || !scheduledOut) {
        console.log(`⏭️ [LateCalc] SKIP: No scheduled time for ${scheduleDate}`);
        return;
      }

      const flagNameLower = flagName.toLowerCase();

      // Half-day leave: HR confirmed late minutes are STILL counted for the worked half.
      // Early departure is skipped because the other half of the day is off.
      // Detect before the skip check so "H/D Leave", "Half Day Leave", etc. aren't skipped.
      const isHalfDay =
        flagNameLower.includes("half day") ||
        flagNameLower.includes("h/d") ||
        flagNameLower.includes("hd leave") ||
        flagNameLower.includes("hdleave");

      // Skip non-working / invalid days based on FlagName (more reliable than category IDs)
      const skipNames = ["off", "full day leave", "short day", "absent", "leave", "missing", "sch days", "upcoming"];
      // "leave" in skipNames also matches half-day leave flags, so exclude half-day days.
      const isSkippable = skipNames.some(name => flagNameLower.includes(name)) && !isHalfDay;
      if (isSkippable) {
        console.log(`⏭️ [LateCalc] SKIP: ${flagName} for ${scheduleDate}`);
        return;
      }

      if (isHalfDay) {
        console.log(`⏳ [LateCalc] HALF DAY: ${flagName} for ${scheduleDate} - late minutes still counted, early departure skipped`);
      }

      /** ---------------- LATE ARRIVAL POLICY ---------------- */
      // Policy: If arrives between 09:01:00 AM to 11:59:59 AM
      if (actualIn > NINE_AM && actualIn <= ELEVEN_FIFTY_NINE_PM) {
        const lateInMinutes = Math.floor((actualIn - NINE_AM) / 60);
        dayPenaltyMinutes += lateInMinutes;
        console.log(`⏰ [LateCalc] LATE ARRIVAL: ${scheduleDate} - ${lateInMinutes} min (in: ${actualIn})`);
      }

      /** ---------------- EARLY DEPARTURE POLICY ---------------- */
      // Policy: If leaves between 12:00:00 PM to 05:59:59 PM
      // Skipped on half-day days (the early departure half is off, so no penalty)
      if (!isHalfDay) {
        const validActualOut = actualOut > 0 && actualOut < DAY_SECONDS;
        
        if (validActualOut && actualOut >= TWELVE_PM && actualOut < SIX_PM) {
          if (actualOut < scheduledOut) {
            const earlyOutMinutes = Math.floor((scheduledOut - actualOut) / 60);
            dayPenaltyMinutes += earlyOutMinutes;
            console.log(`🏃 [LateCalc] EARLY DEPARTURE: ${scheduleDate} - ${earlyOutMinutes} min (out: ${actualOut})`);
          }
        }
      }
      
      console.log(`✅ [LateCalc] day penalty minutes for ${scheduleDate}: ${dayPenaltyMinutes}`);
      totalPenaltyMinutes += dayPenaltyMinutes;
    });

    console.log(`✅ [LateCalc] Total penalty minutes: ${totalPenaltyMinutes}`);
    
    const remainingMinutes = Math.max(FLEX_TIME_MINUTES - totalPenaltyMinutes, 0);
    const overMinutes = Math.max(totalPenaltyMinutes - FLEX_TIME_MINUTES, 0);

    return {
      penaltyMinutes: overMinutes,
      totalMinutes: totalPenaltyMinutes,
      remainingFlex: remainingMinutes
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
          console.log("🎯 [LateCalc] XHR response captured!");
          const json = JSON.parse(this.responseText);  
          const days = json?.attendanceFlagSummaryData?.[0];  
          if (!Array.isArray(days)) {
            console.log("❌ [LateCalc] days is not an array:", days);
            return;
          }
          console.log(`📊 [LateCalc] Total days received: ${days.length}`);  
  
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