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
const geometry = new THREE.IcosahedronGeometry(10, 6); // Slightly larger base
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

    // 4. THE GHOST FORM "BLUEPRINT" (Low-Density Technique)
    const fW = 35; // Width of your square
    const fH = 39; // Height of your square
    
    if (i < vertexCount * 0.4) {
        const side = i % 4;
        // This ensures points are distributed evenly from -1 to 1
        const progress = ((i % 500) / 500) * 2 - 1; 
        
        if (side === 0) { // Right Rail
            target_FeedbackPlane[i*3] = fW;  
            target_FeedbackPlane[i*3+1] = progress * fH; 
        } else if (side === 1) { // Left Rail
            target_FeedbackPlane[i*3] = -fW; 
            target_FeedbackPlane[i*3+1] = progress * fH; 
        } else if (side === 2) { // Top Rail
            target_FeedbackPlane[i*3] = progress * fW; 
            target_FeedbackPlane[i*3+1] = fH;  
        } else if (side === 3) { // Bottom Rail
            target_FeedbackPlane[i*3] = progress * fW; 
            target_FeedbackPlane[i*3+1] = -fH; 
        }
        target_FeedbackPlane[i*3+2] = -5; // Keep it slightly behind the text
    } 
    else if (i < vertexCount * 0.6) {
        // THE INPUT FIELD RAILS (Perfectly centered lines)
        const lineY = (i % 2 === 0) ? 8 : -14; 
        const lineProgress = ((i % 500) / 500) * 2 - 1;
        target_FeedbackPlane[i*3] = lineProgress * (fW * 0.8); // Slightly shorter than box width
        target_FeedbackPlane[i*3+1] = lineY;
        target_FeedbackPlane[i*3+2] = -5;
    }
    else {
        // CRUSH ALL OTHER PARTICLES
        // We move them way off-screen so they don't create those "stray" lines
        target_FeedbackPlane[i*3] = 0;
        target_FeedbackPlane[i*3+1] = -500; 
        target_FeedbackPlane[i*3+2] = -100;
    }
    
target_FeedbackPlane[i*3+2] = -5;
}
knotBake.dispose(); // Clean up memory

// --- 4. MESH INSTANTIATION ---
const mainMesh = new THREE.Mesh(geometry, material);

// CRITICAL FIX: Forces the figure to stay visible even when vertices stretch
mainMesh.frustumCulled = false; 
geometry.computeBoundingSphere(); 

scene.add(mainMesh);

// --- ADD THIS AFTER mainMesh CREATION ---
const particleMaterial = new THREE.PointsMaterial({ 
    color: 0x00e676, 
    size: 2.5,                // Increased from 0.15 to 2.0 for visibility
    sizeAttenuation: false,
    transparent: true, 
    opacity: 0, // Hidden at start
    blending: THREE.AdditiveBlending
});
const particleSystem = new THREE.Points(geometry, particleMaterial);
scene.add(particleSystem);

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

    // 1. Dynamic Snap Speed
    const snapSpeed = scroll > 0.95 ? 0.25 : 0.05;

    // 2. PARTICLE UPDATE (Ensuring we use the right attribute names)
    // Check if your object is named 'particles' or 'particleSystem'
    if (particles && particles.geometry) {
        const posAttr = particles.geometry.attributes.position;
        for (let i = 0; i < vertexCount; i++) {
            const i3 = i * 3;

            // Using the current position from the attribute array
            posAttr.array[i3]     += (targetPositions[i3] - posAttr.array[i3]) * snapSpeed;
            posAttr.array[i3 + 1] += (targetPositions[i3 + 1] - posAttr.array[i3 + 1]) * snapSpeed;
            posAttr.array[i3 + 2] += (targetPositions[i3 + 2] - posAttr.array[i3 + 2]) * snapSpeed;
        }
        posAttr.needsUpdate = true;
    }

    // 3. PHASE SWAP LOGIC
    if (scroll > 0.82) {
        mainMesh.material.opacity = THREE.MathUtils.lerp(mainMesh.material.opacity, 0, 0.12);
        particleMaterial.opacity = THREE.MathUtils.lerp(particleMaterial.opacity, 0.8, 0.12);
        
        mainMesh.rotation.y = THREE.MathUtils.lerp(mainMesh.rotation.y, 0, 0.05);
        mainMesh.rotation.x = THREE.MathUtils.lerp(mainMesh.rotation.x, 0, 0.05);
    } else {
        mainMesh.material.opacity = THREE.MathUtils.lerp(mainMesh.material.opacity, 0.6, 0.12);
        particleMaterial.opacity = THREE.MathUtils.lerp(particleMaterial.opacity, 0, 0.12);
        
        mainMesh.rotation.y += 0.005;
        mainMesh.rotation.x += 0.002;
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