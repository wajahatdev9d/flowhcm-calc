function formatHourMin(totalMinutes) {  
    const hours = Math.floor(totalMinutes / 60);  
    const minutes = Math.round(totalMinutes % 60);  
    return `${hours}:${minutes.toString().padStart(2, "0")}`;  
}  
  
document.addEventListener("DOMContentLoaded", () => {  
    const MONTHLY_LIMIT_MIN = 8 * 60; // 8 hours  
  
    chrome.storage.local.get(["lateCalcResult"], data => {   
        const lateMinutes = Number(data.lateCalcResult?.penaltyMinutes || 0);  
        
        if (!lateMinutes) {  
            document.getElementById("status").textContent = "No data yet";  
            return;  
        }  
  
        const remainingMinutes = Math.max(MONTHLY_LIMIT_MIN - lateMinutes, 0);  
  
        document.getElementById("status").textContent = "Late Summary";  
        document.getElementById("late-min").textContent =  
            lateMinutes.toFixed(2) + " min";  
        document.getElementById("late-hr").textContent =  
            formatHourMin(lateMinutes) + " hr";  
        document.getElementById("rem-min").textContent =  
            remainingMinutes.toFixed(2) + " min";  
        document.getElementById("rem-hr").textContent =  
            formatHourMin(remainingMinutes) + " hr";  
    });  
});  