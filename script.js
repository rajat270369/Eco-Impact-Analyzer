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

// --- 2. High-Density Base Geometry ---
// We use a high-detail Icosahedron as the base for all three sharp morphs
const geometry = new THREE.IcosahedronGeometry(8, 4); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

const target1_Icosa = new Float32Array(vertexCount * 3);
const target2_Octa = new Float32Array(vertexCount * 3);
const target3_Hexa = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- STOP 1: THE ICOSAHEDRON (Original Structure) ---
    target1_Icosa[i * 3] = x;
    target1_Icosa[i * 3 + 1] = y;
    target1_Icosa[i * 3 + 2] = z;

    // --- STOP 2: THE OCTAHEDRON (Diamond Sharp) ---
    // Mathematically flattening the icosahedron into 8 primary planes
    let octaFactor = 1.0 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target2_Octa[i * 3] = x * octaFactor * 10;
    target2_Octa[i * 3 + 1] = y * octaFactor * 10;
    target2_Octa[i * 3 + 2] = z * octaFactor * 10;

    // --- STOP 3: THE HEXAGRAM (Star Shard) ---
    // Using polar coordinate folding to create the 6-pointed star look
    let angle = Math.atan2(y, x);
    let radius = Math.sqrt(x * x + y * y);
    // The "Star" math: oscillating the radius based on the angle
    let starFold = (Math.cos(angle * 6) * 3) + 7; 
    
    target3_Hexa[i * 3] = Math.cos(angle) * starFold;
    target3_Hexa[i * 3 + 1] = Math.sin(angle) * starFold;
    target3_Hexa[i * 3 + 2] = z * 0.2; // Flattened Z for a 2.5D shard effect
}

const morphObject = new THREE.Mesh(geometry, material);
scene.add(morphObject);
camera.position.z = 32;

// --- 3. Scroll-Based Sharp Morphing ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;
    
    // Using a sharp linear step for a mechanical feel
    const step = (t) => Math.max(0, Math.min(1, t));

    if (scrollPercent <= 0.33) {
        // Subtle Pulse to Icosahedron
        let f = step(scrollPercent * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target1_Icosa[i], f);
        }
    } else if (scrollPercent <= 0.66) {
        // Icosahedron to Octahedron
        let f = step((scrollPercent - 0.33) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target1_Icosa[i], target2_Octa[i], f);
        }
    } else {
        // Octahedron to Hexagram
        let f = step((scrollPercent - 0.66) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target2_Octa[i], target3_Hexa[i], f);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    morphObject.rotation.y = scrollPercent * 6;
}

window.addEventListener('scroll', handleScroll);

// --- 4. Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    morphObject.rotation.y += 0.003;
    renderer.render(scene, camera);
}
animate();

// --- 5. Resize Handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});