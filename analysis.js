// Scope logic strictly to the Analysis Page
if (document.body.classList.contains('analysis-page')) {
    
    const forceSystemStart = () => {
        const loader = document.getElementById('loading-screen');
        
        if (loader) {
            console.log("EIA System: Loader found. Starting 2s countdown...");
            setTimeout(() => {
                loader.classList.add('fade-out');
                console.log("EIA System: Transitioning to Analysis...");
            }, 2000);
        } else {
            // If the script runs before the HTML is ready, try again in 100ms
            setTimeout(forceSystemStart, 100);
        }
    };

    forceSystemStart();
}