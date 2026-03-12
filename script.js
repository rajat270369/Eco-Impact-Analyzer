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

// --- 2. Geometry & Mathematical Targets ---
// Starting with the high-detail Icosahedron you like
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

    // --- STOP 2: EIA CORE (Sharp Octahedron) ---
    // Forcing the vertices into the 8-plane diamond shape
    let octaFactor = 10.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // --- STOP 3: TECH STACK (Mathematical Hexagram) ---
    // Creating the 6-pointed star shard
    let angle = Math.atan2(y, x);
    let radius = Math.sqrt(x * x + y * y);
    // Oscillation math for the star points
    let starFold = (Math.cos(angle * 6) * 3.5) + 7.5; 
    
    target_TechStack[i * 3] = Math.cos(angle) * starFold;
    target_TechStack[i * 3 + 1] = Math.sin(angle) * starFold;
    target_TechStack[i * 3 + 2] = z * 0.15; // Sharpened depth
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

// --- 3. Geometric Scroll Transitions ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;
    
    // Linear step for mechanical precision
    const step = (t) => Math.max(0, Math.min(1, t));

    if (scrollPercent <= 0.33) {
        // Stay in/Pulse the Icosahedron (Your favorite starting shape)
        let factor = step(scrollPercent * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], originalPositions[i], factor);
        }
    } else if (scrollPercent <= 0.66) {
        // Morph to the EIA Core (Octahedron)
        let factor = step((scrollPercent - 0.33) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], factor);
        }
    } else {
        // Morph to the Tech Stack (Hexagram Star)
        let factor = step((scrollPercent - 0.66) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TechStack[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    mainMesh.rotation.y = scrollPercent * 7;
}

window.addEventListener('scroll', handleScroll);

// --- 4. Animation ---
function animate() {
    requestAnimationFrame(animate);
    mainMesh.rotation.y += 0.004;
    renderer.render(scene, camera);
}
animate();

// --- 5. Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});