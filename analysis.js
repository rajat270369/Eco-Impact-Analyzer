if (document.body.classList.contains('analysis-page')) {
    // Wait for the window to finish loading assets
    window.addEventListener('load', () => {
        const loader = document.getElementById('loading-screen');
        
        // Brief delay for the "Cool Factor" so the animation is seen
        setTimeout(() => {
            loader.classList.add('fade-out');
        }, 1500); 
    });
}