console.log("EIA System: Analysis Module Booting...");

// 1. Loader Logic
const hideLoader = () => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.classList.add('fade-out');
        console.log("EIA System: Loader Cleared.");
    }
};
setTimeout(hideLoader, 2000);

// 2. Matrix Rain Logic
const canvas = document.getElementById('rainCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00e676";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 33);
}
// --- analysis.js ---

function activateModule(moduleType) {
    console.log(`EIA System: Activating ${moduleType} module...`);
    
    // Example logic to update the numbers
    // In the future, this will 'fetch' from your Render Python backend
    const values = {
        'monitor': { id: 'neutral-val', text: '12% Offset' },
        'analyze': { id: 'pollution-val', text: '0.45 CO2e' },
        'strategize': { id: 'social-val', text: 'High Impact' },
        'develop': { id: 'waste-val', text: '1.24kg' }
    };

    const target = values[moduleType];
    if (target) {
        document.getElementById(target.id).innerText = target.text;
        document.getElementById(target.id).style.color = "#00e676"; // Highlight on update
    }
}