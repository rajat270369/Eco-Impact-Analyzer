// This block only runs on the Analysis Page
if (document.body.classList.contains('analysis-page')) {
    console.log("Analysis System: Booting...");

    // Execute when the browser has finished loading the document
    window.addEventListener('DOMContentLoaded', () => {
        const loader = document.getElementById('loading-screen');
        
        if (loader) {
            // Wait exactly 2 seconds then fade out
            setTimeout(() => {
                loader.classList.add('fade-out');
                console.log("Analysis System: Online.");
            }, 2000);
        } else {
            console.error("Critical Error: Loading screen element not found.");
        }
    });
}