if (document.body.classList.contains('analysis-page')) {
    
    // We create a function to handle the exit
    const systemBootComplete = () => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            console.log("EIA System: Analysis Ready. Fading out...");
            loader.classList.add('fade-out');
        }
    };

    // FORCE the exit after 2 seconds no matter what
    setTimeout(systemBootComplete, 2000);
}