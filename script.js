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
function handleScroll() {
    // Get the total scrollable height
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Safety check: avoid division by zero
    if (scrollHeight <= 0) return;
    
    const scrollPercent = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
    const positions = geometry.attributes.position.array;
    
    // TIGHTER RANGES: 
    // 0.0 - 0.2: Stay Icosahedron
    // 0.2 - 0.5: Morph to Octahedron (EIA Core)
    // 0.5 - 0.9: Morph to Hexagram (Tech Stack)
    // 0.9 - 1.0: Final Shape Lock

    if (scrollPercent <= 0.2) {
        // First part: Stay as the default Icosahedron
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = originalPositions[i];
        }
    } 
    else if (scrollPercent <= 0.5) {
        // Second part: Transition to EIA Core
        let factor = (scrollPercent - 0.2) / 0.3; // Normalize to 0-1
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], factor);
        }
    } 
    else {
        // Third part: Transition to Tech Stack
        let factor = Math.min((scrollPercent - 0.5) / 0.4, 1); // Normalize to 0-1
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TechStack[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    mainMesh.rotation.y = scrollPercent * 10;
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