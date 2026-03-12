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

// --- 2. Using SphereGeometry for Natural Roundness ---
// This replaces the icosahedron to ensure there are NO sharp triangular corners.
const geometry = new THREE.SphereGeometry(8, 32, 32); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.4 
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

    // --- STOP 1: THE ROUNDED LEAF (Gaussian Math) ---
    let nY = y / 8; // Normalized height
    // Gaussian curve creates a soft "raindrop" or "leaf" belly
    let bellCurve = Math.exp(-Math.pow(nY, 2) / 0.5); 

    target1_Plant[i * 3] = x * bellCurve * 1.3; 
    target1_Plant[i * 3 + 1] = y * 1.4; 
    target1_Plant[i * 3 + 2] = z * 0.1; // Flat but slightly rounded

    // --- STOP 2: THE TECH PROCESSOR (Cube) ---
    target2_Tech[i * 3] = Math.max(-6, Math.min(6, x * 1.5));
    target2_Tech[i * 3 + 1] = Math.max(-6, Math.min(6, y * 1.5));
    target2_Tech[i * 3 + 2] = Math.max(-6, Math.min(6, z * 1.5));

    // --- STOP 3: THE WAVE ---
    target3_Pulse[i * 3] = x * 2.5; 
    target3_Pulse[i * 3 + 1] = Math.sin(x * 0.8) * 3; 
    target3_Pulse[i * 3 + 2] = z * 0.1;
}

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
camera.position.z = 30;

// --- 3. Smooth Scroll Logic ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Smooth easing

    if (scrollPercent <= 0.33) {
        let f = ease(Math.min(scrollPercent * 3.5, 1));
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target1_Plant[i], f);
        }
    } else if (scrollPercent <= 0.66) {
        let f = ease(Math.min((scrollPercent - 0.33) * 3.5, 1));
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target1_Plant[i], target2_Tech[i], f);
        }
    } else {
        let f = ease(Math.min((scrollPercent - 0.66) * 3.5, 1));
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target2_Tech[i], target3_Pulse[i], f);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    globe.rotation.y = scrollPercent * 4;
}

window.addEventListener('scroll', handleScroll);

// --- 4. Animation ---
function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.002;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});