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
// We use detail level 2 (Icosahedron) to give enough vertices for the transformation
const geometry = new THREE.IcosahedronGeometry(10, 2); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

// Store the original positions (The perfect Globe)
const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

// Create the "Watering Woman" target positions
const morphTargetPositions = new Float32Array(vertexCount * 3);
for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // Mathematical transformation to simulate a human-like silhouette
    // We stretch the Y axis and taper the X/Z to create a "waist" and "head" shape
    morphTargetPositions[i * 3] = x * (0.4 + Math.abs(y) * 0.08); // Tapering
    morphTargetPositions[i * 3 + 1] = y * 1.6; // Stretching height
    morphTargetPositions[i * 3 + 2] = z * 0.6; // Flattening slightly
}

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

camera.position.z = 30;

// --- 3. Scroll & Morph Logic ---
function handleScroll() {
    // Calculate total scroll progress (0 to 1)
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    // Constant rotation tied to scroll
    globe.rotation.y = scrollPercent * 8; 
    globe.rotation.x = scrollPercent * 2; // Slight tilt for depth

    // Calculate Morph Factor for Stop 1 (Transition begins after 10% scroll)
    let morphFactor = 0;
    if (scrollPercent > 0.1) {
        // This makes the transition reach 100% by roughly the 35% scroll mark
        morphFactor = Math.min((scrollPercent - 0.1) * 4, 1); 
    }

    // Update vertex positions using Linear Interpolation (lerp)
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < vertexCount * 3; i++) {
        // Smoothly slide each point between the Globe and the Woman positions
        positions[i] = THREE.MathUtils.lerp(
            originalPositions[i], 
            morphTargetPositions[i], 
            morphFactor
        );
    }
    
    // Alert Three.js that the vertices have moved
    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener('scroll', handleScroll);

// --- 4. Constant Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Persistent slow drift for a "living" feel
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