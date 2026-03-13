// VERSION: 1.1.4 - High-Definition Geometry
console.log("Three.js Morph Logic v1.1.4 Loaded");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Use high subdivision for "defined" edges
const geometry = new THREE.IcosahedronGeometry(8, 5); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.4 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

const target_EIACore = new Float32Array(vertexCount * 3);
const target_TechStack = new Float32Array(vertexCount * 3);
const target_RealTime = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- 1. EIA CORE (The Solid Diamond) ---
    let octaFactor = 11 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // --- 2. TECH STACK (The Sharpened Hexagram) ---
    let angle = Math.atan2(y, x);
    // Increased frequency and depth for a "stabbing" star look
    let starFold = (Math.cos(angle * 6) * 6) + 8; 
    target_TechStack[i * 3] = Math.cos(angle) * starFold;
    target_TechStack[i * 3 + 1] = Math.sin(angle) * starFold;
    target_TechStack[i * 3 + 2] = z * 0.1; // Very thin/sharp

    // --- 3. REAL-TIME DATA (The Spike Sphere) ---
    // This creates a sphere with intentional "data noise" spikes
    let noise = Math.sin(x * 2) * Math.cos(y * 2) * 2.5;
    let dist = 9 + noise;
    let mag = Math.sqrt(x*x + y*y + z*z);
    target_RealTime[i * 3] = (x / mag) * dist;
    target_RealTime[i * 3 + 1] = (y / mag) * dist;
    target_RealTime[i * 3 + 2] = (z / mag) * dist;
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

function handleScroll() {
    const positions = geometry.attributes.position.array;
    const cards = document.querySelectorAll('.reveal');
    
    // Fallback if cards aren't found
    let scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

    if (cards.length >= 3) {
        const getPoint = (el) => 1 - (el.getBoundingClientRect().top / window.innerHeight);
        const p1 = getPoint(cards[0]);
        const p2 = getPoint(cards[1]);
        const p3 = getPoint(cards[2]);

        // Mapping sections to specific scrollPercent values for the morpher
        if (p1 < 0.5) scrollPercent = 0;
        else if (p1 >= 0.5 && p2 < 0.5) scrollPercent = 0.33 * ((p1 - 0.5) * 2);
        else if (p2 >= 0.5 && p3 < 0.5) scrollPercent = 0.33 + (0.33 * ((p2 - 0.5) * 2));
        else if (p3 >= 0.5) scrollPercent = 0.66 + (0.33 * ((p3 - 0.5) * 2));
    }

    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    if (scrollPercent <= 0.33) {
        let f = clamp(scrollPercent * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
        }
    } else if (scrollPercent <= 0.66) {
        let f = clamp((scrollPercent - 0.33) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TechStack[i], f);
        }
    } else {
        let f = clamp((scrollPercent - 0.66) * 3);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_TechStack[i], target_RealTime[i], f);
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener('scroll', handleScroll);

let time = 0;
function animate() {
    time += 0.05;
    requestAnimationFrame(animate);
    
    // Automatic rotation
    mainMesh.rotation.y += 0.003;

    // Subtle "Pulse" effect for Real-time Data
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    if (scrollPercent > 0.8) {
        mainMesh.scale.setScalar(1 + Math.sin(time) * 0.03);
    } else {
        mainMesh.scale.setScalar(1);
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});