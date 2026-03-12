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
    opacity: 0.5 
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

    // --- STOP 1: THE SMOOTH ORGANIC LEAF ---
    let normalizedY = y / 12; 
    
    // Smooth tapering using Sine instead of Power for rounded edges
    let rad = (1 - Math.abs(normalizedY)) * Math.PI * 0.5;
    let smoothCurve = Math.sin(rad); 

    // Create a "fold" in the center (Z-axis depth) so it isn't a flat weapon
    let fold = Math.abs(x) * 0.1; 

    // Stem logic (Thinner and shorter)
    let branchEffect = (y < -8) ? (Math.abs(y + 8) * 0.5) : 0;
    let branchNarrow = (y < -8) ? 0.05 : 1.0;

    target1_Plant[i * 3] = (x * smoothCurve * 1.4 * branchNarrow); 
    target1_Plant[i * 3 + 1] = (y * 1.6) - branchEffect; 
    target1_Plant[i * 3 + 2] = (z * 0.02) + fold; // Adds organic depth

    // --- STOP 2: THE TECH PROCESSOR ---
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
    globe.rotation.y = scrollPercent * 4; 
}

window.addEventListener('scroll', handleScroll);

// --- 4. Animation Loop ---
let time = 0;
function animate() {
    time += 0.01;
    requestAnimationFrame(animate);
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    if (scrollPercent > 0.05 && scrollPercent < 0.4) {
        globe.rotation.z = Math.sin(time * 0.5) * 0.03; // Gentle slow sway
    }

    globe.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();

// --- 5. Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});