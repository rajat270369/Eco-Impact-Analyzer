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

const geometry = new THREE.IcosahedronGeometry(8, 3); 
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

    // --- STOP 1: THE ECO-LEAF ---
    // We create a "Pointy Oval" shape with a central vein
    let leafWidth = (1 - Math.abs(y / 10)); // Taper at top and bottom
    target1_Plant[i * 3] = x * leafWidth * 1.2; 
    target1_Plant[i * 3 + 1] = y * 1.3; // Make it taller
    target1_Plant[i * 3 + 2] = z * 0.1; // Flatten into a leaf blade

    // --- STOP 2: THE TECH PROCESSOR (Cube) ---
    // A more precise cube than before
    target2_Tech[i * 3] = Math.max(-6, Math.min(6, x * 1.5));
    target2_Tech[i * 3 + 1] = Math.max(-6, Math.min(6, y * 1.5));
    target2_Tech[i * 3 + 2] = Math.max(-6, Math.min(6, z * 1.5));

    // --- STOP 3: THE DATA WAVE ---
    target3_Pulse[i * 3] = x * 2.5; 
    target3_Pulse[i * 3 + 1] = Math.sin(x * 0.8) * 3; // Flowing wave
    target3_Pulse[i * 3 + 2] = z * 0.05;
}

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
camera.position.z = 35;

// --- 3. Scroll & Morph Logic ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;

    if (scrollPercent <= 0.33) {
        // Globe to Plant
        const factor = Math.min(scrollPercent * 3.5, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target1_Plant[i], factor);
        }
    } 
    else if (scrollPercent <= 0.66) {
        // Plant to Cube
        const factor = Math.min((scrollPercent - 0.33) * 3.5, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target1_Plant[i], target2_Tech[i], factor);
        }
    } 
    else {
        // Cube to Wave
        const factor = Math.min((scrollPercent - 0.66) * 3.5, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target2_Tech[i], target3_Pulse[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    globe.rotation.y = scrollPercent * 6; // Keep the rotation smooth
}

window.addEventListener('scroll', handleScroll);
// --- 4. Constant Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Persistent slow drift
    globe.rotation.y += 0.001;
    
    renderer.render(scene, camera);
}

animate();

// --- 5. Handle Window Resizing ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});