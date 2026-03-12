// --- Section Reveal Logic ---
window.addEventListener('scroll', () => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 50) {
            el.classList.add('active');
        }
    });
});

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- 2. High-Density Geometry & Targets ---
const geometry = new THREE.IcosahedronGeometry(8, 4); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 // Slightly lower opacity looks "thinner" and more elegant
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

const target1_Plant = new Float32Array(vertexCount * 3);
const target2_Tech = new Float32Array(vertexCount * 3);
const target3_Pulse = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- STOP 1: THE SLEEK LEAF + STEM ---
    let normalizedY = y / 12; // -1 to 1 range
    let heightFactor = 1.0 - Math.abs(normalizedY); 
    
    // We use a higher power (1.2) to "pinch" the sides, making it thinner
    let leafCurve = Math.pow(heightFactor, 1.2); 

    // Branch logic: pull bottom points down into a thin needle
    let branchEffect = (y < -7) ? (Math.abs(y + 7) * 0.8) : 0;
    let branchNarrow = (y < -7) ? 0.1 : 1.0; // Make the stem very thin

    target1_Plant[i * 3] = (x * leafCurve * 1.5 * branchNarrow) + (y * 0.05); // Width reduced from 2.5 to 1.5
    target1_Plant[i * 3 + 1] = (y * 1.7) - branchEffect; 
    target1_Plant[i * 3 + 2] = z * 0.01; // Keep it flat

    // --- STOP 2: THE TECH PROCESSOR (Cube) ---
    target2_Tech[i * 3] = Math.max(-7.5, Math.min(7.5, x * 2.0));
    target2_Tech[i * 3 + 1] = Math.max(-7.5, Math.min(7.5, y * 2.0));
    target2_Tech[i * 3 + 2] = Math.max(-7.5, Math.min(7.5, z * 2.0));

    // --- STOP 3: THE DATA WAVE ---
    target3_Pulse[i * 3] = x * 3.2; 
    target3_Pulse[i * 3 + 1] = Math.sin(x * 0.8) * 4.5; 
    target3_Pulse[i * 3 + 2] = z * 0.05;
}

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
camera.position.z = 38;

// --- 3. Scroll & Morph Logic ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (scrollPercent <= 0.33) {
        const factor = easeInOutCubic(Math.min(scrollPercent * 3.1, 1));
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target1_Plant[i], factor);
        }
    } 
    else if (scrollPercent <= 0.66) {
        const factor = easeInOutCubic(Math.min((scrollPercent - 0.33) * 3.1, 1));
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target1_Plant[i], target2_Tech[i], factor);
        }
    } 
    else {
        const factor = easeInOutCubic(Math.min((scrollPercent - 0.66) * 3.1, 1));
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target2_Tech[i], target3_Pulse[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    
    let rotationBase = 6;
    if (scrollPercent > 0.1 && scrollPercent < 0.3) rotationBase = 1.5; // Slowed down even more for clarity
    globe.rotation.y = scrollPercent * rotationBase;
}

window.addEventListener('scroll', handleScroll);

// --- 4. Constant Animation Loop ---
let time = 0;
function animate() {
    time += 0.01;
    requestAnimationFrame(animate);
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    if (scrollPercent > 0.1 && scrollPercent < 0.4) {
        globe.rotation.z = Math.sin(time) * 0.05;
    }

    globe.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();

// --- 5. Resize Handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});