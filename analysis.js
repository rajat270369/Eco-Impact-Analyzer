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
/* --- analysis.js --- */

async function runAnalysis() {
    // 1. Grab values from your HTML inputs
    const diesel = document.getElementById('diesel-input').value || 0;
    const electricity = document.getElementById('elec-input').value || 0;
    const concrete = document.getElementById('concrete-input').value || 0;
    const plastic = document.getElementById('plastic-input').value || 0;

    try {
        // FIXED: Explicitly defining the fetch request
        const response = await fetch('http://127.0.0.1:5000/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                diesel: diesel,
                electricity: electricity,
                concrete: concrete,
                plastic: plastic
            })
        });

        const result = await response.json();

        // 1. Update the numbers
        document.getElementById('res-air').innerText = result.air_pollution;
        document.getElementById('res-waste').innerText = result.solid_waste;
        document.getElementById('res-co2').innerText = result.co2_emissions;
        document.getElementById('res-score').innerText = result.impact_score;

        // 2. THE TRIGGER: Auto-scroll to the Monitor section
        const monitorSection = document.getElementById('monitor-results-section');
        if (monitorSection) {
            monitorSection.scrollIntoView({ 
                behavior: 'smooth' 
            });
        }

        // 3. Update the log
        const log = document.getElementById('system-log');
        if (log) {
            log.innerHTML += `<br> > [${new Date().toLocaleTimeString()}] Analysis Complete. Impact Score: ${result.impact_score}`;
        }

    } catch (error) {
        console.error("Connection failed", error);
        alert("Check your Ubuntu terminal! The backend might not be running.");
    }
}