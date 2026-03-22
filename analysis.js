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
    // 1. Immediately scroll so the user sees the "System Log" starting
    const monitorSection = document.getElementById('monitor-results-section');
    if (monitorSection) monitorSection.scrollIntoView({ behavior: 'smooth' });

    const log = document.getElementById('system-log');
    if (log) log.innerHTML += `<br> > [${new Date().toLocaleTimeString()}] Fetching Environmental Data...`;

    // 2. Now do the heavy lifting
    const diesel = document.getElementById('diesel-input').value || 0;
    const electricity = document.getElementById('elec-input').value || 0;
    const concrete = document.getElementById('concrete-input').value || 0;
    const plastic = document.getElementById('plastic-input').value || 0;

    try {
        const response = await fetch('http://127.0.0.1:5000/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diesel, electricity, concrete, plastic })
        });

        const result = await response.json();

        // 3. Update the numbers with a slight delay for "hacker" effect
        setTimeout(() => {
            document.getElementById('res-air').innerText = result.air_pollution;
            document.getElementById('res-waste').innerText = result.solid_waste;
            document.getElementById('res-co2').innerText = result.co2_emissions;
            document.getElementById('res-score').innerText = result.impact_score;
            if (log) log.innerHTML += `<br> > [SYSTEM] Analysis Complete. Score: ${result.impact_score}`;
        }, 500);

    } catch (error) {
        console.error("Connection failed", error);
        if (log) log.innerHTML += `<br> <span style="color: #ff5252;">> [ERROR] Backend Offline.</span>`;
    }
}
function activateModule(moduleName) {
    console.log(`EIA System: Activating ${moduleName.toUpperCase()}...`);
    
    if (moduleName === 'monitor') {
        // Just scroll down to the monitor
        const monitorSection = document.getElementById('monitor-results-section');
        if (monitorSection) monitorSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        // For Analyze, Strategize, and Develop, show a quick system alert
        alert(`ACCESS GRANTED: ${moduleName.toUpperCase()} module is initializing. Ensure parameters are set.`);
    }
}