// VERSION: 1.1.1 - Precise Scroll Mapping
console.log("Three.js Morph Logic v1.1.1 Loaded");

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- 2. Geometry & Mathematical Targets ---
const geometry = new THREE.IcosahedronGeometry(8, 4); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

const target_EIACore = new Float32Array(vertexCount * 3);
const target_TechStack = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // STOP 2: EIA CORE (Octahedron)
    let octaFactor = 10.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // STOP 3: TECH STACK (Hexagram Star)
    let angle = Math.atan2(y, x);
    let radius = Math.sqrt(x * x + y * y);
    let starFold = (Math.cos(angle * 6) * 3.5) + 7.5; 
    
    target_TechStack[i * 3] = Math.cos(angle) * starFold;
    target_TechStack[i * 3 + 1] = Math.sin(angle) * starFold;
    target_TechStack[i * 3 + 2] = z * 0.15; 
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

// --- 3. Fixed Scroll Transitions ---
// --- Precise Card-Based Scroll Transitions ---
// --- Precise Card-Based Scroll Transitions ---
function handleScroll() {
    const cards = document.querySelectorAll('.reveal'); // Assuming your cards have the 'reveal' class
    const positions = geometry.attributes.position.array;

    // 1. Get positions of your key sections
    const eiaCoreCard = cards[0];   // The card for EIA Core
    const techStackCard = cards[1]; // The card for Tech Stack
    const realTimeCard = cards[2];  // The card for Real-time Data

    const windowCenter = window.innerHeight / 2;

    // Helper to get card center relative to viewport
    const getCardProgress = (el) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        // Returns 0 when below screen, 0.5 at center, 1.0 when above
        return 1 - (rect.top / window.innerHeight);
    };

    const p1 = getCardProgress(eiaCoreCard);
    const p2 = getCardProgress(techStackCard);
    const p3 = getCardProgress(realTimeCard);

    // --- MORPH LOGIC ---

    if (p1 < 0.5) {
        // STAGE 0: Start (Icosahedron)
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = originalPositions[i];
        }
    } 
    else if (p1 >= 0.5 && p2 < 0.5) {
        // STAGE 1: Transition to EIA Core (Octahedron)
        // Normalizes the gap between card 1 and card 2
        let factor = THREE.MathUtils.smoothstep(p1, 0.5, 1.0); 
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], factor);
        }
    } 
    else if (p2 >= 0.5) {
        // STAGE 2: Transition to Tech Stack (Hexagram)
        let factor = THREE.MathUtils.smoothstep(p2, 0.5, 1.0);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TechStack[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    
    // Rotation speed based on overall scroll
    const totalScroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    mainMesh.rotation.y = totalScroll * 12;
}
window.addEventListener('scroll', handleScroll);

// --- 4. Animation & Resize ---
function animate() {
    requestAnimationFrame(animate);
    mainMesh.rotation.y += 0.004;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});