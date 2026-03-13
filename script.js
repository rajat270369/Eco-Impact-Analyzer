// --- Updated Targets for 5 Sections ---
const target_EIACore = new Float32Array(vertexCount * 3);    // Section 2
const target_TechStack = new Float32Array(vertexCount * 3);  // Section 3 (Improved)
const target_RealTime = new Float32Array(vertexCount * 3);   // Section 4 (The Star)
const target_FinalStar = new Float32Array(vertexCount * 3);  // Section 5 (The 2nd Star)

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // 1. EIA CORE (Diamond)
    let octaFactor = 10.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK (Refined Spike)
    let mag = Math.sqrt(x*x + y*y + z*z);
    let spike = Math.sin(x * 4) * Math.cos(y * 4) * 3.5; 
    let d = 8.5 + spike;
    target_TechStack[i * 3] = (x / mag) * d;
    target_TechStack[i * 3 + 1] = (y / mag) * d;
    target_TechStack[i * 3 + 2] = (z / mag) * d;

    // 3. THE HEXAGRAM STAR (Used for Sections 4 & 5)
    let angle = Math.atan2(y, x);
    let points = 6;
    let starCycle = (angle * points) / (Math.PI * 2);
    let starFactor = Math.abs((starCycle % 1) - 0.5) * 2;
    let radius = THREE.MathUtils.lerp(12.5, 5.5, starFactor);

    target_RealTime[i * 3] = Math.cos(angle) * radius;
    target_RealTime[i * 3 + 1] = Math.sin(angle) * radius;
    target_RealTime[i * 3 + 2] = (z > 0 ? 1.2 : -1.2); // Clean 3D depth

    // Final Star can be a slightly "thicker" or "pulsing" version
    target_FinalStar.set(target_RealTime); 
}

function handleScroll() {
    const positions = geometry.attributes.position.array;
    let scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    // 5-Section Map (0.2 increments)
    if (scrollPercent <= 0.2) {
        // Start: Sphere -> Core
        let f = clamp(scrollPercent * 5);
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
    } else if (scrollPercent <= 0.4) {
        // Core -> Tech Stack
        let f = clamp((scrollPercent - 0.2) * 5);
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TechStack[i], f);
    } else if (scrollPercent <= 0.6) {
        // Tech Stack -> Star (Fixing the distorted gap)
        let f = clamp((scrollPercent - 0.4) * 5);
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = THREE.MathUtils.lerp(target_TechStack[i], target_RealTime[i], f);
    } else if (scrollPercent <= 0.8) {
        // Star -> Star (Keeping it stable for section 4)
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = target_RealTime[i];
    } else {
        // Final Star (Section 5)
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = target_FinalStar[i];
    }
    geometry.attributes.position.needsUpdate = true;
}