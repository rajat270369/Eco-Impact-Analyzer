// VERSION: 1.1.2 - Stability & Transition Fix
console.log("Three.js Morph Logic v1.1.2 Loaded");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const geometry = new THREE.IcosahedronGeometry(8, 4); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

// --- Define All 3 Targets ---
const target_EIACore = new Float32Array(vertexCount * 3);
const target_TechStack = new Float32Array(vertexCount * 3);
const target_RealTime = new Float32Array(vertexCount * 3); // Added this to prevent the crash

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
    let starFold = (Math.cos(angle * 6) * 3.5) + 7.5; 
    target_TechStack[i * 3] = Math.cos(angle) * starFold;
    target_TechStack[i * 3 + 1] = Math.sin(angle) * starFold;
    target_TechStack[i * 3 + 2] = z * 0.15;

    // STOP 4: REAL TIME (A Flattened, wide Ring)
    let ringRadius = 12 + (z * 0.5);
    target_RealTime[i * 3] = Math.cos(angle) * ringRadius;
    target_RealTime[i * 3 + 1] = Math.sin(angle) * ringRadius;
    target_RealTime[i * 3 + 2] = z * 0.05;
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

function handleScroll() {
    const positions = geometry.attributes.position.array;
    const cards = document.querySelectorAll('.reveal');
    if (cards.length < 3) return;

    // We look at the scroll progress of each specific card
    const getPoint = (el) => {
        const rect = el.getBoundingClientRect();
        // 0.5 means the card is in the center of the screen
        return 1 - (rect.top / window.innerHeight);
    };

    const p1 = getPoint(cards[0]); // EIA Core
    const p2 = getPoint(cards[1]); // Tech Stack
    const p3 = getPoint(cards[2]); // Real-time Data

    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    // LOGIC: Transition to the shape of the card as it approaches center
    if (p1 < 0.5) {
        // Stay Icosahedron
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = originalPositions[i];
        }
    } else if (p1 >= 0.5 && p2 < 0.5) {
        // Morph Icosahedron -> Octahedron
        let factor = clamp((p1 - 0.5) * 2);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], factor);
        }
    } else if (p2 >= 0.5 && p3 < 0.5) {
        // Morph Octahedron -> Hexagram
        let factor = clamp((p2 - 0.5) * 2);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TechStack[i], factor);
        }
    } else if (p3 >= 0.5) {
        // Morph Hexagram -> RealTime
        let factor = clamp((p3 - 0.5) * 2);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_TechStack[i], target_RealTime[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener('scroll', handleScroll);

function animate() {
    requestAnimationFrame(animate);
    mainMesh.rotation.y += 0.004; // Gentle base rotation
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});