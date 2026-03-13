// VERSION: 1.2.5 - Fixed Vertex Mapping for 4 Sections
console.log("Three.js Morph Logic v1.2.5 Loaded");

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

// --- Targets ---
const target_EIACore = new Float32Array(vertexCount * 3);    
const target_TorusStack = new Float32Array(vertexCount * 3); 
const target_HexStar = new Float32Array(vertexCount * 3);    
const target_FeedbackPlane = new Float32Array(vertexCount * 3);

// Helper to get Torus positions
const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
const knotPos = knotBake.attributes.position.array;
const knotVertCount = knotBake.attributes.position.count;

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // 1. EIA CORE (Diamond - Fixed Math)
    let octaFactor = 11 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK (Torus Knot - Fixed Indexing)
    let kIdx = (i % knotVertCount) * 3;
    target_TorusStack[i * 3] = knotPos[kIdx];
    target_TorusStack[i * 3 + 1] = knotPos[kIdx + 1];
    target_TorusStack[i * 3 + 2] = knotPos[kIdx + 2];

    // 3. REAL-TIME DATA (Star)
    let angle = Math.atan2(y, x);
    let starFactor = Math.abs(((angle * 6 / (Math.PI * 2)) % 1) - 0.5) * 2;
    let radius = 8 + (starFactor * 5); 
    target_HexStar[i * 3] = Math.cos(angle) * radius;
    target_HexStar[i * 3 + 1] = Math.sin(angle) * radius;
    target_HexStar[i * 3 + 2] = (z > 0 ? 1 : -1);

    // 4. FEEDBACK PLANE (Flattened Grid)
    target_FeedbackPlane[i * 3] = (x / 8) * 18;     
    target_FeedbackPlane[i * 3 + 1] = (y / 8) * 14; 
    target_FeedbackPlane[i * 3 + 2] = 0;            
}
knotBake.dispose();

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

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
        let f = clamp((scrollPercent - 0.50) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_TorusStack[i], target_HexStar[i], f);
        }
    } else {
        let f = clamp((scrollPercent - 0.75) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_HexStar[i], target_FeedbackPlane[i], f);
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener('scroll', handleScroll);

function animate() {
    requestAnimationFrame(animate);
    // Slow down rotation as we flatten into the form
    let scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    if (scroll < 0.75) {
        mainMesh.rotation.y += 0.004;
        mainMesh.rotation.x += 0.001;
    } else {
        mainMesh.rotation.y *= 0.9; // Smooth stop
        mainMesh.rotation.x *= 0.9;
    }
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});