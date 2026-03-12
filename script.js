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

// --- 2. Sharp Geometry & Targets ---
// Octahedron is the king of "sharp" mathematical shapes.
const geometry = new THREE.OctahedronGeometry(8, 5); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

const target1_Sharp = new Float32Array(vertexCount * 3);
const target2_Sharp = new Float32Array(vertexCount * 3);
const target3_Sharp = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- STOP 1: THE PRISM (Tall & Narrow) ---
    // Mathematically stretching the Y axis and pinching X/Z
    target1_Sharp[i * 3] = x * 0.8; 
    target1_Sharp[i * 3 + 1] = y * 2.2; 
    target1_Sharp[i * 3 + 2] = z * 0.8;

    // --- STOP 2: THE MONOLITH (Hard Edge Cube) ---
    // Using a high-power clamp to force vertices into a cube shape
    const limit = 7;
    target2_Sharp[i * 3] = Math.max(-limit, Math.min(limit, x * 2.5));
    target2_Sharp[i * 3 + 1] = Math.max(-limit, Math.min(limit, y * 2.5));
    target2_Sharp[i * 3 + 2] = Math.max(-limit, Math.min(limit, z * 2.5));

    // --- STOP 3: THE SHARD (Fragmented Spike) ---
    // Stretching X aggressively and creating a "jagged" Y offset
    target3_Sharp[i * 3] = x * 4.0; 
    target3_Sharp[i * 3 + 1] = (y * 0.2) + (Math.cos(x * 0.5) * 2); 
    target3_Sharp[i * 3 + 2] = z * 0.1;
}

const mainObject = new THREE.Mesh(geometry, material);
scene.add(mainObject);
camera.position.z = 35;

// --- 3. Morph Logic ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;
    
    // Using a sharp Linear Step for "Mechanical" feel
    const step = (t) => Math.max(0, Math.min(1, t));

    if (scrollPercent <= 0.33) {
        let factor = step(scrollPercent * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target1_Sharp[i], factor);
        }
    } else if (scrollPercent <= 0.66) {
        let factor = step((scrollPercent - 0.33) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target1_Sharp[i], target2_Sharp[i], factor);
        }
    } else {
        let factor = step((scrollPercent - 0.66) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target2_Sharp[i], target3_Sharp[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    mainObject.rotation.y = scrollPercent * 8; // Faster rotation for sharp edges
}

window.addEventListener('scroll', handleScroll);

// --- 4. Animation ---
function animate() {
    requestAnimationFrame(animate);
    mainObject.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

// --- 5. Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});