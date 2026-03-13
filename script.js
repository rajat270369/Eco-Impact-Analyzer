// VERSION: 1.1.8 - Restored Initial Shape & Fixed 3-Target Morph
console.log("Three.js Morph Logic v1.1.8 Loaded");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// This is the "Main Figure" behind Explore Analysis
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
const target_SpikeTech = new Float32Array(vertexCount * 3); 
const target_StarData = new Float32Array(vertexCount * 3);  

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- 1. EIA CORE (The Diamond) ---
    let octaFactor = 10.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // --- 2. TECH STACK (Spike Shape) ---
    let mag = Math.sqrt(x*x + y*y + z*z);
    let spike = Math.sin(x * 3) * Math.cos(y * 3) * 4.5; 
    let dist = 8 + spike;
    target_SpikeTech[i * 3] = (x / mag) * dist;
    target_SpikeTech[i * 3 + 1] = (y / mag) * dist;
    target_SpikeTech[i * 3 + 2] = (z / mag) * dist;

   // --- 3. REAL-TIME DATA (Fixed Hexagram Star) ---
    let angle = Math.atan2(y, x);
    let starFold = 7 + Math.abs(Math.cos(angle * 3)) * 5; 
    
    target_StarData[i * 3] = Math.cos(angle) * starFold;
    target_StarData[i * 3 + 1] = Math.sin(angle) * starFold;
    target_StarData[i * 3 + 2] = (z > 0 ? 0.5 : -0.5);
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

function handleScroll() {
    const positions = geometry.attributes.position.array;
    const cards = document.querySelectorAll('.reveal');
    let scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    // This logic ensures: 
    // 0.0 - 0.33: Sphere -> Core
    // 0.33 - 0.66: Core -> Spike
    // 0.66 - 1.0: Spike -> Star
    if (scrollPercent <= 0.33) {
        let f = clamp(scrollPercent * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
        }
    } else if (scrollPercent <= 0.66) {
        let f = clamp((scrollPercent - 0.33) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_SpikeTech[i], f);
        }
    } else {
        let f = clamp((scrollPercent - 0.66) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_SpikeTech[i], target_StarData[i], f);
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener('scroll', handleScroll);

function animate() {
    requestAnimationFrame(animate);
    mainMesh.rotation.y += 0.004;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});