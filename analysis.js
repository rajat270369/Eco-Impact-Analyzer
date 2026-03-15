document.addEventListener('DOMContentLoaded', () => {
    console.log("Analysis Engine Initialized...");

    const cards = document.querySelectorAll('.option-card');
    
    // Add a hover effect that glows brighter
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#00e676';
            card.style.boxShadow = '0 0 20px rgba(0, 230, 118, 0.4)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'rgba(0, 230, 118, 0.2)';
            card.style.boxShadow = 'none';
        });
    });

    // Mock function to simulate receiving data from your friends' Python backend
    function simulateDataStream() {
        const statusText = document.querySelector('.card p');
        statusText.innerText = "Receiving encrypted data stream...";
        statusText.style.color = "#00e676";
    }

    setTimeout(simulateDataStream, 2000);
});