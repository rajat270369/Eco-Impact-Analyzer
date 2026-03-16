// Check if we are on the Analysis Page
if (document.body.classList.contains('analysis-page')) {
    
    // We start the timer as soon as the script runs
    window.addEventListener('load', () => {
        const loadingScreen = document.getElementById('loading-screen');
        
        // Force the user to wait exactly 1.8 seconds for the "System Load" feel
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            
            // Optional: Remove from DOM after fade to save memory
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 800); // Matches the CSS transition time
            
        }, 1800); 
    });
}