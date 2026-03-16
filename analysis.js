// --- analysis.js ---
console.log("EIA System: Analysis Script Loaded.");

const loader = document.getElementById('loading-screen');
const canvas = document.getElementById('rainCanvas');

if (loader) {
    // 1. Force the loader to disappear after 2 seconds
    setTimeout(() => {
        console.log("EIA System: Fading Loader...");
        loader.classList.add('fade-out');
    }, 2000);
}

if (canvas) {
    console.log("EIA System: Rain Canvas Found. Initializing...");
    const ctx = canvas.getContext('2d');

    // Set Canvas Size
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const char = "0123456789ABCDEF";
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#00e676"; // EIA Green
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = char[Math.floor(Math.random() * char.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(draw, 35);
} else {
    console.error("EIA System Error: #rainCanvas not found in HTML!");
}