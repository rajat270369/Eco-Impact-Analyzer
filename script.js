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

// --- 2. Create the Morphable Globe ---
const geometry = new THREE.IcosahedronGeometry(10, 3); // More points for detail
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.4 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;
const morphTargetPositions = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // THE SILHOUETTE FORMULA
    // We project the globe onto a 2D plane and "carve" the woman shape
    let tx = x;
    let ty = y;
    let tz = z * 0.1; // Flatten into a 2D "card" shape to avoid jumble

    // Define the "Woman" silhouette using Y-axis height
    if (y > 5) { 
        // The Head: Narrow the top
        tx *= 0.3; 
    } else if (y > -5 && y <= 5) {
        // The Torso: Slight curve
        tx *= (0.6 - Math.abs(y) * 0.05);
    } else {
        // The Base/Legs: Widens out
        tx *= 0.8;
    }

    // Add the "Watering Arm" - only to vertices on the right side
    if (x > 0 && y > 0 && y < 4) {
        tx += 8 * (1 - Math.abs(y - 2) * 0.5); // Extend arm outwards
    }

    morphTargetPositions[i * 3] = tx;
    morphTargetPositions[i * 3 + 1] = ty;
    morphTargetPositions[i * 3 + 2] = tz;
}

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
// --- 3. Scroll & Morph Logic ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    // Calculate Morph Factor (Transition starts at 5% scroll)
    let morphFactor = 0;
    if (scrollPercent > 0.05) {
        morphFactor = Math.min((scrollPercent - 0.05) * 5, 1); 
    }

    // SLOW DOWN rotation as morph completes for focus
    const rotationSpeed = 1.0 - (morphFactor * 0.8); 
    globe.rotation.y = scrollPercent * 8 * rotationSpeed;
    globe.rotation.x = scrollPercent * 2 * rotationSpeed;

    // Update vertex positions via Lerp
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < vertexCount * 3; i++) {
        positions[i] = THREE.MathUtils.lerp(
            originalPositions[i], 
            morphTargetPositions[i], 
            morphFactor
        );
    }
    
    geometry.attributes.position.needsUpdate = true;
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