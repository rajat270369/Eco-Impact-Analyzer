// VERSION: 1.1.5 - High-Energy Spike Core
console.log("Three.js Morph Logic v1.1.5 Loaded");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Increased detail (6) to make the spikes look sharper and more "pixel-perfect"
const geometry = new THREE.IcosahedronGeometry(8, 6); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.4 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

const target_EIACore = new Float32Array(vertexCount * 3);
const target_TechStack = new Float32Array(vertexCount * 3);
const target_SpikeData = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- 1. EIA CORE (The Diamond) ---
    let octaFactor = 11 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // --- 2. TECH STACK (The Hexagram) ---
    let angle = Math.atan2(y, x);
    let starFold = (Math.cos(angle * 6) * 5) + 8; 
    target_TechStack[i * 3] = Math.cos(angle) * starFold;
    target_TechStack[i * 3 + 1] = Math.sin(angle) * starFold;
    target_TechStack[i * 3 + 2] = z * 0.1;

    // --- 3. REAL-TIME DATA (The "Chaotic Spike" Shape) ---
    // We use high-frequency trigonometric noise to create those long, thin needles
    let mag = Math.sqrt(x*x + y*y + z*z);
    let spikeNoise = Math.sin(x * 4) * Math.sin(y * 4) * Math.sin(z * 4);
    let dist = 8 + (spikeNoise * 6); // The '6' controls how long the spikes are
    
    target_SpikeData[i * 3] = (x / mag) * dist;
    target_SpikeData[i * 3 + 1] = (y / mag) * dist;
    target_SpikeData[i * 3 + 2] = (z / mag) * dist;
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

function handleScroll() {
    const positions = geometry.attributes.position.array;
    const cards = document.querySelectorAll('.reveal');
    
    // Default fallback
    let scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

    if (cards.length >= 3) {
        const getPoint = (el) => 1 - (el.getBoundingClientRect().top / window.innerHeight);
        const p1 = getPoint(cards[0]); // EIA
        const p2 = getPoint(cards[1]); // Tech
        const p3 = getPoint(cards[2]); // Real-time

        if (p1 < 0.5) scrollPercent = 0;
        else if (p1 >= 0.5 && p2 < 0.5) scrollPercent = 0.33 * ((p1 - 0.5) * 2);
        else if (p2 >= 0.5 && p3 < 0.5) scrollPercent = 0.33 + (0.33 * ((p2 - 0.5) * 2));
        else if (p3 >= 0.5) scrollPercent = 0.66 + (0.33 * ((p3 - 0.5) * 2));
    }

    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    if (scrollPercent <= 0.33) {
        let f = clamp(scrollPercent * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
        }
    } else if (scrollPercent <= 0.66) {
        let f = clamp((scrollPercent - 0.33) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TechStack[i], f);
        }
    } else {
        let f = clamp((scrollPercent - 0.66) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_TechStack[i], target_SpikeData[i], f);
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener('scroll', handleScroll);

let time = 0;
function animate() {
    time += 0.02;
    requestAnimationFrame(animate);
    
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = window.scrollY / scrollHeight;

    // Base Rotation
    mainMesh.rotation.y += 0.003;

    // Only apply the "vibration" jitters when we are at the Real-time Data stage
    if (scrollPercent > 0.7) {
        mainMesh.rotation.x = Math.sin(time * 2) * 0.05;
        mainMesh.rotation.z = Math.cos(time * 2) * 0.05;
        mainMesh.scale.setScalar(1 + Math.sin(time * 4) * 0.02);
    } else {
        mainMesh.rotation.x = 0;
        mainMesh.rotation.z = 0;
        mainMesh.scale.setScalar(1);
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});