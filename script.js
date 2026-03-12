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

// --- 2. Create the Morphable Globe & Target Shapes ---
const geometry = new THREE.IcosahedronGeometry(8, 3); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.4 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

// Define our three target shapes
const target1_Woman = new Float32Array(vertexCount * 3);
const target2_Tech = new Float32Array(vertexCount * 3);
const target3_Pulse = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- PART 1: THE WOMAN (Stop 1) ---
    let wX = x * 0.5;
    let wY = y * 1.2;
    let wZ = z * 0.2;
    if (y > 4) wX *= 0.4; // Head
    if (x > 0 && y > 0 && y < 5) wX += 3; // Arm
    target1_Woman[i * 3] = wX;
    target1_Woman[i * 3 + 1] = wY;
    target1_Woman[i * 3 + 2] = wZ;

    // --- PART 2: THE TECH STACK (Stop 2 - Geometric Cube) ---
    // We "boxify" the globe by snapping points toward the nearest cube face
    target2_Tech[i * 3] = Math.sign(x) * 7;
    target2_Tech[i * 3 + 1] = Math.sign(y) * 7;
    target2_Tech[i * 3 + 2] = Math.sign(z) * 7;

    // --- PART 3: THE PULSE (Stop 3 - Waveform) ---
    // Flatten everything into a wide wave
    target3_Pulse[i * 3] = x * 2.5; // Stretch wide
    target3_Pulse[i * 3 + 1] = Math.sin(x * 0.5) * 4; // Add a wave curve
    target3_Pulse[i * 3 + 2] = z * 0.1; // Total flatness
}

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
camera.position.z = 35;

// --- 3. The Multi-Stage Scroll Logic ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;
    let currentTarget;

    if (scrollPercent <= 0.33) {
        // TRANSITION 0 TO 1 (Globe to Woman)
        const factor = Math.min(scrollPercent * 3, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target1_Woman[i], factor);
        }
    } 
    else if (scrollPercent <= 0.66) {
        // TRANSITION 1 TO 2 (Woman to Tech Cube)
        const factor = Math.min((scrollPercent - 0.33) * 3, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target1_Woman[i], target2_Tech[i], factor);
        }
    } 
    else {
        // TRANSITION 2 TO 3 (Tech Cube to Pulse Wave)
        const factor = Math.min((scrollPercent - 0.66) * 3, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target2_Tech[i], target3_Pulse[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    globe.rotation.y = scrollPercent * 4;
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