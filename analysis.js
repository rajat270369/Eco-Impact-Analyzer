// --- analysis.js ---
console.log("EIA Analysis System: Initializing...");

window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loading-screen');
    
    if (loader) {
        // This forces the screen to fade away after 2 seconds
        setTimeout(() => {
            loader.classList.add('fade-out');
            console.log("EIA Analysis System: Online.");
        }, 2000);
    }
});