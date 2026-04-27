function formatHourMin(totalMinutes) {  
    const hours = Math.floor(totalMinutes / 60);  
    const minutes = Math.round(totalMinutes % 60);  
    return `${hours}:${minutes.toString().padStart(2, "0")}`;  
}  
  
document.addEventListener("DOMContentLoaded", () => {  
    const MONTHLY_LIMIT_MIN = 8 * 60; // 8 hours  
  
chrome.storage.local.get(["lateCalcResult"], data => {   
        const lateMinutes = Number(data.lateCalcResult?.penaltyMinutes || 0);  
        const totalMinutes = Number(data.lateCalcResult?.totalMinutes || 0);
        const remainingFlex = Number(data.lateCalcResult?.remainingFlex || 0);
        
        if (!totalMinutes) {  
            document.getElementById("status").textContent = "No data yet";  
            return;  
        }  
   
        document.getElementById("status").textContent = "Late Summary";  
        document.getElementById("late-min").textContent =  
            totalMinutes.toFixed(2) + " min";  
        document.getElementById("late-hr").textContent =  
            formatHourMin(totalMinutes) + " hr";  
        document.getElementById("rem-min").textContent =  
            remainingFlex.toFixed(2) + " min";  
        document.getElementById("rem-hr").textContent =  
            formatHourMin(remainingFlex) + " hr";  
    });
});  