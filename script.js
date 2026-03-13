// VERSION: 1.2.8 - Optimized Performance & Initial Load Fix
console.log("Three.js Morph Logic v1.2.8 Loaded");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const geometry = new THREE.IcosahedronGeometry(8, 4); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});

const originalPositions = geometry.attributes.position.array.slice(); 
const vertexCount = geometry.attributes.position.count;

const target_EIACore = new Float32Array(vertexCount * 3);    
const target_TorusStack = new Float32Array(vertexCount * 3); 
const target_DataPrism = new Float32Array(vertexCount * 3);    
const target_FeedbackPlane = new Float32Array(vertexCount * 3);

const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
const knotPos = knotBake.attributes.position.array;
const knotVertCount = knotBake.attributes.position.count;

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // 1. EIA CORE
    let octaFactor = 11 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK
    let kIdx = (i % knotVertCount) * 3;
    target_TorusStack[i * 3] = knotPos[kIdx];
    target_TorusStack[i * 3 + 1] = knotPos[kIdx + 1];
    target_TorusStack[i * 3 + 2] = knotPos[kIdx + 2];

    // 3. DATA PRISM
    let mag = Math.sqrt(x*x + y*y + z*z);
    let prismRadius = 12;
    target_DataPrism[i * 3] = (x / mag) * (prismRadius * 0.5);   
    target_DataPrism[i * 3 + 1] = (y / mag) * (prismRadius * 1.2); 
    target_DataPrism[i * 3 + 2] = (z / mag) * (prismRadius * 0.5); 

    // 4. FEEDBACK FORM MORPH (Targeting the UI structure)
    if (i % 2 === 0) {
        // Horizontal Lines (Underlining the inputs)
        target_FeedbackPlane[i * 3] = (x / 8) * 22; 
        target_FeedbackPlane[i * 3 + 1] = Math.round(y / 6) * 12; 
        target_FeedbackPlane[i * 3 + 2] = 0;
    } else {
        // Vertical Frame "Brackets"
        target_FeedbackPlane[i * 3] = x > 0 ? 25 : -25; 
        target_FeedbackPlane[i * 3 + 1] = (y / 8) * 20; 
        target_FeedbackPlane[i * 3 + 2] = -2; 
    }
}
knotBake.dispose();

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

function handleScroll() {
    const positions = geometry.attributes.position.array;
    // Calculation of scroll height is now inside the function for accuracy
    let scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    if (scrollPercent <= 0.25) {
        let f = clamp(scrollPercent * 4);
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
    } else if (scrollPercent <= 0.50) {
        let f = clamp((scrollPercent - 0.25) * 4);
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TorusStack[i], f);
    } else if (scrollPercent <= 0.75) {
        let f = clamp((scrollPercent - 0.50) * 4);
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = THREE.MathUtils.lerp(target_TorusStack[i], target_DataPrism[i], f);
    } else {
        let f = clamp((scrollPercent - 0.75) * 4);
        for (let i = 0; i < vertexCount * 3; i++) positions[i] = THREE.MathUtils.lerp(target_DataPrism[i], target_FeedbackPlane[i], f);
    }
    geometry.attributes.position.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);
    let scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

    if (scroll < 0.85) {
        mainMesh.rotation.y += 0.006; 
        mainMesh.rotation.x += 0.002;
    } else {
        mainMesh.rotation.y *= 0.8; 
        mainMesh.rotation.x *= 0.8;
        mainMesh.rotation.z *= 0.8;
    }
    renderer.render(scene, camera);
}

window.addEventListener('scroll', handleScroll);
function clamp(v) { return Math.min(Math.max(v, 0), 1); }

// FIX: Run handleScroll once on load so the figure matches the scroll position immediately
handleScroll(); 
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    handleScroll(); // FIX: Recalculate positions on resize
});