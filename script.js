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
    const positions = geometry.attributes.position.array;

    const cards = document.querySelectorAll('.reveal');
    if (cards.length < 3) return;

    const eiaCard = cards[0];
    const techCard = cards[1];
    const realTimeCard = cards[2];

    const getPoint = (el) => {
        const rect = el.getBoundingClientRect();
        return 1 - (rect.top / window.innerHeight);
    };

    const p1 = getPoint(eiaCard);
    const p2 = getPoint(techCard);
    const p3 = getPoint(realTimeCard);

    // Clamp helper
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    // SCROLL 0 → DEFAULT SHAPE
    if (p1 < 0.5) {
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = originalPositions[i];
        }
    }

    // SCROLL 1 → MORPH TO EIA SHAPE
    else if (p1 >= 0.5 && p2 < 0.5) {
        let factor = clamp((p1 - 0.5) * 2);

        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(
                originalPositions[i],
                target_EIACore[i],
                factor
            );
        }
    }

    // SCROLL 2 → MORPH TO TECH STACK
    else if (p2 >= 0.5 && p3 < 0.5) {
        let factor = clamp((p2 - 0.5) * 2);

        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(
                target_EIACore[i],
                target_TechStack[i],
                factor
            );
        }
    }

    // SCROLL 3 → MORPH TO REAL TIME SHAPE
    else if (p3 >= 0.5) {
        let factor = clamp((p3 - 0.5) * 2);

        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(
                target_TechStack[i],
                target_RealTime[i],   // <-- new shape
                factor
            );
        }
    }

    geometry.attributes.position.needsUpdate = true;

    const overallScroll = window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);

    mainMesh.rotation.y += 0.01 + (overallScroll * 0.05);
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