// VERSION: 1.2.7 - Synchronized Targets & Continuous Prism Rotation
console.log("Three.js Morph Logic v1.2.7 Loaded");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// The Base Mesh
const geometry = new THREE.IcosahedronGeometry(8, 4); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

const originalPositions = geometry.attributes.position.array.slice(); 
const vertexCount = geometry.attributes.position.count;

// --- Targets (Naming must match the loop and scroll logic) ---
const target_EIACore = new Float32Array(vertexCount * 3);    
const target_TorusStack = new Float32Array(vertexCount * 3); 
const target_DataPrism = new Float32Array(vertexCount * 3);    
const target_FeedbackPlane = new Float32Array(vertexCount * 3);

// Helper for Torus target
const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
const knotPos = knotBake.attributes.position.array;
const knotVertCount = knotBake.attributes.position.count;

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // 1. EIA CORE (Diamond)
    let octaFactor = 11 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK (Torus Knot)
    let kIdx = (i % knotVertCount) * 3;
    target_TorusStack[i * 3] = knotPos[kIdx];
    target_TorusStack[i * 3 + 1] = knotPos[kIdx + 1];
    target_TorusStack[i * 3 + 2] = knotPos[kIdx + 2];

    // 3. REAL-TIME DATA (Data Prism)
    let mag = Math.sqrt(x*x + y*y + z*z);
    let prismRadius = 12;
    target_DataPrism[i * 3] = (x / mag) * (prismRadius * 0.5);   
    target_DataPrism[i * 3 + 1] = (y / mag) * (prismRadius * 1.2); 
    target_DataPrism[i * 3 + 2] = (z / mag) * (prismRadius * 0.5); 

    // 4. FEEDBACK PLANE (Flattened Grid)
    target_FeedbackPlane[i * 3] = (x / 8) * 18;     
    target_FeedbackPlane[i * 3 + 1] = (y / 8) * 14; 
    target_FeedbackPlane[i * 3 + 2] = 0; 
}
knotBake.dispose();

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

// --- Updated handleScroll (v1.2.8) ---
function handleScroll() {
    const positions = geometry.attributes.position.array;
    let scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

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
        // Transition to Prism: It will spin because the 'animate' loop is active
        let f = clamp((scrollPercent - 0.50) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_TorusStack[i], target_DataPrism[i], f);
        }
    } else {
        // Transition to Flat Plane
        let f = clamp((scrollPercent - 0.75) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_DataPrism[i], target_FeedbackPlane[i], f);
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

// --- Updated animate (v1.2.8) ---
function animate() {
    requestAnimationFrame(animate);
    let scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

    // Keep spinning at ALL times unless we are deep in the final section
    if (scroll < 0.85) {
        mainMesh.rotation.y += 0.006; // Slightly faster for a "real-time" feel
        mainMesh.rotation.x += 0.002;
    } else {
        // Smoothly settle the rotation into a flat view for the form
        // This ensures it faces the user perfectly when the form is visible
        mainMesh.rotation.y *= 0.8; 
        mainMesh.rotation.x *= 0.8;
        mainMesh.rotation.z *= 0.8;
    }
    
    renderer.render(scene, camera);
}

window.addEventListener('scroll', handleScroll);


// Helper clamp for animation
function clamp(v) { return Math.min(Math.max(v, 0), 1); }

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});