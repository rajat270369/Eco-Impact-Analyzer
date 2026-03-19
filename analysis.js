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
async function runAnalysis() {
    // 1. Get values from your input fields
    const payload = {
        diesel: document.getElementById('diesel-input').value,
        electricity: document.getElementById('elec-input').value,
        concrete: document.getElementById('concrete-input').value,
        plastic: document.getElementById('plastic-input').value
    };

    // 2. Post to Python
    const response = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const results = await response.json();

    // 3. Show the Results section and update numbers
    document.getElementById('results-display').style.display = 'grid';
    document.getElementById('res-air').innerText = results.air_pollution;
    document.getElementById('res-waste').innerText = results.solid_waste;
    document.getElementById('res-co2').innerText = results.co2_emissions;
    document.getElementById('res-score').innerText = results.impact_score;
}