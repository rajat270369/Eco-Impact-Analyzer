// VERSION: 1.2.1 - 5-Section Journey (Sphere -> Core -> Spike -> Star -> Star)
console.log("Three.js Morph Logic v1.2.1 Loaded");

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- 2. Geometry & Targets ---
const geometry = new THREE.IcosahedronGeometry(8, 4); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

const originalPositions = geometry.attributes.position.array.slice(); // Section 1: Sphere
const vertexCount = geometry.attributes.position.count;

const target_EIACore = new Float32Array(vertexCount * 3);    // Section 2: Diamond
const target_SpikeTech = new Float32Array(vertexCount * 3);  // Section 3: Spike
const target_HexStar = new Float32Array(vertexCount * 3);    // Section 4 & 5: Clean Star

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- EIA CORE (The Diamond) ---
    let octaFactor = 10.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // --- TECH STACK (The Spike) ---
    let mag = Math.sqrt(x*x + y*y + z*z);
    let spike = Math.sin(x * 3) * Math.cos(y * 3) * 4.5; 
    let d = 8 + spike;
    target_SpikeTech[i * 3] = (x / mag) * d;
    target_SpikeTech[i * 3 + 1] = (y / mag) * d;
    target_SpikeTech[i * 3 + 2] = (z / mag) * d;

    // --- REAL-TIME DATA / STAR (The Hexagram) ---
    let angle = Math.atan2(y, x);
    let points = 6;
    let starCycle = (angle * points) / (Math.PI * 2);
    let starFactor = Math.abs((starCycle % 1) - 0.5) * 2;
    let radius = THREE.MathUtils.lerp(12.5, 5.5, starFactor);

    target_HexStar[i * 3] = Math.cos(angle) * radius;
    target_HexStar[i * 3 + 1] = Math.sin(angle) * radius;
    target_HexStar[i * 3 + 2] = (z > 0 ? 1.2 : -1.2); // Controls 3D thickness
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

// --- 3. Scroll Logic (5 Zones) ---
function handleScroll() {
    const positions = geometry.attributes.position.array;
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    // Each section is 20% (0.2) of the total scroll
    if (scrollPercent <= 0.2) {
        // Section 1 to 2: Sphere -> Diamond
        let f = clamp(scrollPercent * 5);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
        }
    } else if (scrollPercent <= 0.4) {
        // Section 2 to 3: Diamond -> Spike
        let f = clamp((scrollPercent - 0.2) * 5);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_SpikeTech[i], f);
        }
    } else if (scrollPercent <= 0.6) {
        // Section 3 to 4: Spike -> Hexagram Star
        let f = clamp((scrollPercent - 0.4) * 5);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_SpikeTech[i], target_HexStar[i], f);
        }
    } else if (scrollPercent <= 0.8) {
        // Section 4: Lock to Star
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = target_HexStar[i];
        }
    } else {
        // Section 5: Final Star (Stay as Star)
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = target_HexStar[i];
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener('scroll', handleScroll);

// --- 4. Animation & Resize ---
function animate() {
    requestAnimationFrame(animate);
    mainMesh.rotation.y += 0.004; // Gentle constant spin
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});