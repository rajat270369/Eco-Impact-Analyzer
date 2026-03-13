// VERSION: 1.3.0 - Industrial Stability & Morph Safety
console.log("Three.js Morph Logic v1.3.0 Optimized");

// --- 1. SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.z = 50; 

const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true,
    powerPreference: "high-performance" 
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Add Global Ambient Light (Backup for visibility)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// --- 2. GEOMETRY & MATERIALS ---
const geometry = new THREE.IcosahedronGeometry(10, 4); // Slightly larger base
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.6,
    depthTest: true,
    blending: THREE.AdditiveBlending 
});

const originalPositions = geometry.attributes.position.array.slice(); 
const vertexCount = geometry.attributes.position.count;

// Prepare Morph Targets
const target_EIACore = new Float32Array(vertexCount * 3);     
const target_TorusStack = new Float32Array(vertexCount * 3); 
const target_DataPrism = new Float32Array(vertexCount * 3);     
const target_FeedbackPlane = new Float32Array(vertexCount * 3);

// --- 3. BAKE MORPH TARGETS ---
const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
const knotPos = knotBake.attributes.position.array;
const knotVertCount = knotBake.attributes.position.count;

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];


    // 1. EIA CORE (Modified Octahedron) - SLIGHTLY ENLARGED
    const epsilon = 0.0001;
    // Increased from 12 to 14.5 for a subtle but noticeable "size up"
    let octaFactor = 14.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + epsilon);
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK (Knot Mapping) - ENLARGED
    let kIdx = (i % knotVertCount) * 3;
    const knotScale = 1.8; // Increase this number to make the 2nd figure even larger
    target_TorusStack[i * 3] = knotPos[kIdx] * knotScale;
    target_TorusStack[i * 3 + 1] = knotPos[kIdx + 1] * knotScale;
    target_TorusStack[i * 3 + 2] = knotPos[kIdx + 2] * knotScale;

    // 3. DATA PRISM (Vertical Expansion) - SCALED DOWN
    let mag = Math.sqrt(x*x + y*y + z*z) + epsilon;
    let prismRadius = 16; // Dropped from 22 to 16 for better fit
    
    // We keep it sleek but slightly wider than the original 1.2.8 version
    target_DataPrism[i * 3] = (x / mag) * (prismRadius * 0.5);   
    target_DataPrism[i * 3 + 1] = (y / mag) * (prismRadius * 1.4); 
    target_DataPrism[i * 3 + 2] = (z / mag) * (prismRadius * 0.5);

   // 4. THE GHOST FORM "BLUEPRINT" MORPH
    const formWidth = 55;   // The general width of our ghost form structure
    const formHeight = 85;  // The total vertical span
    const yTop = 25;        // Top border position
    const yBottom = -30;    // Bottom border position
    
    // Divide vertices into four structural groups
    if (i % 4 === 0) {
        // Group 1: The TOP BORDER
        target_FeedbackPlane[i * 3] = (x / 8) * formWidth; // Wide span
        target_FeedbackPlane[i * 3 + 1] = yTop + Math.round(y / 15) * 5; // A solid top line with some texture
        target_FeedbackPlane[i * 3 + 2] = -8; // Deeper Z for separation
    } else if (i % 4 === 1) {
        // Group 2: The INPUT BOX placeholders (Two clean horizontal fields)
        const inputY1 = 8; // Position of the first box
        const inputY2 = -8; // Position of the second box
        
        target_FeedbackPlane[i * 3] = (x / 10) * (formWidth * 0.8); // Slightly narrower span
        
        // Randomly assign points to the first or second box to avoid clumping
        const choice = i % 8 < 4 ? inputY1 : inputY2;
        target_FeedbackPlane[i * 3 + 1] = choice; 
        
        target_FeedbackPlane[i * 3 + 2] = -12; // Deeper for emphasis
    } else if (i % 4 === 2) {
        // Group 3: The VERTICAL FORM SUPPORT PILLARS (Pushed to the far edges)
        target_FeedbackPlane[i * 3] = x > 0 ? formWidth : -formWidth; // Perfect left/right alignment
        target_FeedbackPlane[i * 3 + 1] = (y / 10) * (formHeight * 0.5); // Very tall span
        target_FeedbackPlane[i * 3 + 2] = -5; // Closest Z layer
    } else {
        // Group 4: The BOTTOM BUTTON blueprint and BORDER support
        target_FeedbackPlane[i * 3] = x > 0 ? formWidth * 0.5 : -formWidth * 0.5; // Narrower like a button
        target_FeedbackPlane[i * 3 + 1] = yBottom; // Solid bottom line
        target_FeedbackPlane[i * 3 + 2] = -10; // Mid-range Z layer
    }
}
knotBake.dispose(); // Clean up memory

// --- 4. MESH INSTANTIATION ---
const mainMesh = new THREE.Mesh(geometry, material);

// CRITICAL FIX: Forces the figure to stay visible even when vertices stretch
mainMesh.frustumCulled = false; 
geometry.computeBoundingSphere(); 

scene.add(mainMesh);

// --- 5. INTERACTION LOGIC ---
function handleScroll() {
    const positions = geometry.attributes.position.array;
    
    // Calculate scroll percentage
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    // Adjust camera depth based on scroll
    camera.position.z = 40 + (scrollPercent * 15); 

    // Multi-Stage Morphing
    if (scrollPercent <= 0.25) {
        let f = clamp(scrollPercent * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
        }
    } else if (scrollPercent <= 0.50) {
        let f = clamp((scrollPercent - 0.25) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TorusStack[i], f);
        }
    } else if (scrollPercent <= 0.75) {
        let f = clamp((scrollPercent - 0.50) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_TorusStack[i], target_DataPrism[i], f);
        }
    } else {
        let f = clamp((scrollPercent - 0.75) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_DataPrism[i], target_FeedbackPlane[i], f);
        }
    }
    
    geometry.attributes.position.needsUpdate = true;
}

// --- 6. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scroll = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;

    // Soft Rotation logic
    if (scroll < 0.88) {
        mainMesh.rotation.y += 0.005; 
        mainMesh.rotation.x += 0.002;
    } else {
        // Smoothly stop rotation as we hit the form phase
        mainMesh.rotation.y = THREE.MathUtils.lerp(mainMesh.rotation.y, 0, 0.08);
        mainMesh.rotation.x = THREE.MathUtils.lerp(mainMesh.rotation.x, 0, 0.08);
        mainMesh.rotation.z = THREE.MathUtils.lerp(mainMesh.rotation.z, 0, 0.08);
        
        // Scanline opacity effect
        material.opacity = 0.45 + Math.sin(Date.now() * 0.0015) * 0.15;
    }

    renderer.render(scene, camera);
}

// --- 7. EVENT LISTENERS ---
window.addEventListener('scroll', () => {
    requestAnimationFrame(handleScroll);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    handleScroll(); 
});

// INITIALIZE
handleScroll(); 
animate();