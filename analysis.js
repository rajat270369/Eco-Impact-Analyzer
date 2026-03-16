if (document.body.classList.contains('analysis-page')) {
    console.log("Analysis Phase: Initialized");

    // This triggers when the WHOLE page (images, rain, scripts) is ready
    window.onload = function() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            // Forced 1.5s delay for the "loading" experience
            setTimeout(() => {
                loader.classList.add('fade-out');
                console.log("Analysis Phase: Access Granted");
            }, 1500);
        }
    };
}