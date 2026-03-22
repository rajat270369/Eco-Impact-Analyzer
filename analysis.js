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

function activateModule(moduleName) {
    console.log(`EIA System: Activating ${moduleName.toUpperCase()}...`);
    
    // Use 'analyze' or 'monitor' to trigger the scroll
    if (moduleName === 'monitor' || moduleName === 'analyze') {
        const target = document.getElementById('monitor-results-section');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

async function runAnalysis() {
    const log = document.getElementById('system-log');
    if (log) {
        log.innerHTML += `<br> > [${new Date().toLocaleTimeString()}] Telemetry Syncing...`;
        log.scrollTop = log.scrollHeight;
    }

    // Capture inputs
    const data = {
        diesel: document.getElementById('diesel-input').value || 0,
        electricity: document.getElementById('elec-input').value || 0,
        concrete: document.getElementById('concrete-input').value || 0,
        plastic: document.getElementById('plastic-input').value || 0
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // Update Numbers
        document.getElementById('res-air').innerText = result.air_pollution || 0;
        document.getElementById('res-waste').innerText = result.solid_waste || 0;
        document.getElementById('res-co2').innerText = result.co2_emissions || 0;
        document.getElementById('res-score').innerText = result.impact_score || 0;

        if (log) log.innerHTML += `<br> > [SUCCESS] Processing Complete.`;
    } catch (e) {
        if (log) log.innerHTML += `<br> > [ERROR] Backend Offline.`;
    }
}

// 3. Calculation Logic
async function runAnalysis() {
    const log = document.getElementById('system-log');
    
    // Add entry to log
    if (log) {
        log.innerHTML += `<br> > [${new Date().toLocaleTimeString()}] Initializing environmental scan...`;
        log.scrollTop = log.scrollHeight; // Keep log focused on latest entry
    }

    const payload = {
        diesel: document.getElementById('diesel-input').value || 0,
        electricity: document.getElementById('elec-input').value || 0,
        concrete: document.getElementById('concrete-input').value || 0,
        plastic: document.getElementById('plastic-input').value || 0
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();

        // Update the UI
        document.getElementById('res-air').innerText = result.air_pollution;
        document.getElementById('res-waste').innerText = result.solid_waste;
        document.getElementById('res-co2').innerText = result.co2_emissions;
        document.getElementById('res-score').innerText = result.impact_score;

        if (log) {
            log.innerHTML += `<br> > [SUCCESS] Impact Score: ${result.impact_score} calculated.`;
            log.scrollTop = log.scrollHeight;
        }

    } catch (error) {
        console.error("Fetch error:", error);
        if (log) {
            log.innerHTML += `<br> <span style="color: #ff5252;">> [FAILURE] Backend connection failed.</span>`;
            log.scrollTop = log.scrollHeight;
        }
    }
}