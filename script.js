// --- 1. CORE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- 2. GEOMETRY GENERATION ---
const particleCount = 5000;
const posArray = new Float32Array(particleCount * 3);

const target_EIACore = new Float32Array(particleCount * 3);
const target_TorusStack = new Float32Array(particleCount * 3);
const target_DataPrism = new Float32Array(particleCount * 3);
const target_FeedbackForm = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    // Initial random spread
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    posArray[i * 3] = x;
    posArray[i * 3 + 1] = y;
    posArray[i * 3 + 2] = z;

    // --- RESTORING YOUR ORIGINAL SHAPE MATH ---

    // 1. EIA CORE (Octahedron / Diamond) - RESTORED
    let factor = 12 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * factor;
    target_EIACore[i * 3 + 1] = y * factor;
    target_EIACore[i * 3 + 2] = z * factor;

    // 2. TECH STACK (Torus Knot) - RESTORED
    const t = i * 0.1;
    target_TorusStack[i * 3] = (10 + 3 * Math.cos(2 * t)) * Math.cos(3 * t);
    target_TorusStack[i * 3 + 1] = (10 + 3 * Math.cos(2 * t)) * Math.sin(3 * t);
    target_TorusStack[i * 3 + 2] = 3 * Math.sin(2 * t);

    // 3. DATA PRISM (Cylinder) - RESTORED
    let angle = Math.random() * Math.PI * 2;
    let radius = 15;
    target_DataPrism[i * 3] = Math.cos(angle) * radius;
    target_DataPrism[i * 3 + 1] = (Math.random() - 0.5) * 40;
    target_DataPrism[i * 3 + 2] = Math.sin(angle) * radius;

    // 4. GHOST FORM (The Blueprint Phase) - UPDATED 
    // This creates the flat, wide "schematic" look for the final scroll
    target_FeedbackForm[i * 3] = (Math.random() - 0.5) * 70;
    target_FeedbackForm[i * 3 + 1] = (Math.random() - 0.5) * 90;
    target_FeedbackForm[i * 3 + 2] = (Math.random() - 0.5) * 2; 
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const material = new THREE.PointsMaterial({
    size: 0.1,
    color: 0x00e676,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const points = new THREE.Points(geometry, material);
scene.add(points);
camera.position.z = 50;

// --- 3. SCROLL & MORPH LOGIC ---
let scrollPercent = 0;
document.addEventListener('scroll', () => {
    const h = document.documentElement;
    const b = document.body;
    scrollPercent = (h.scrollTop || b.scrollTop) / (h.scrollHeight - h.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
        let tx, ty, tz;
        
        if (scrollPercent < 0.33) {
            let p = scrollPercent / 0.33;
            tx = THREE.MathUtils.lerp(target_EIACore[i * 3], target_TorusStack[i * 3], p);
            ty = THREE.MathUtils.lerp(target_EIACore[i * 3 + 1], target_TorusStack[i * 3 + 1], p);
            tz = THREE.MathUtils.lerp(target_EIACore[i * 3 + 2], target_TorusStack[i * 3 + 2], p);
        } else if (scrollPercent < 0.66) {
            let p = (scrollPercent - 0.33) / 0.33;
            tx = THREE.MathUtils.lerp(target_TorusStack[i * 3], target_DataPrism[i * 3], p);
            ty = THREE.MathUtils.lerp(target_TorusStack[i * 3 + 1], target_DataPrism[i * 3 + 1], p);
            tz = THREE.MathUtils.lerp(target_TorusStack[i * 3 + 2], target_DataPrism[i * 3 + 2], p);
        } else {
            let p = (scrollPercent - 0.66) / 0.34;
            tx = THREE.MathUtils.lerp(target_DataPrism[i * 3], target_FeedbackForm[i * 3], p);
            ty = THREE.MathUtils.lerp(target_DataPrism[i * 3 + 1], target_FeedbackForm[i * 3 + 1], p);
            tz = THREE.MathUtils.lerp(target_DataPrism[i * 3 + 2], target_FeedbackForm[i * 3 + 2], p);
        }

        positions[i * 3] += (tx - positions[i * 3]) * 0.1;
        positions[i * 3 + 1] += (ty - positions[i * 3 + 1]) * 0.1;
        positions[i * 3 + 2] += (tz - positions[i * 3 + 2]) * 0.1;
    }

    geometry.attributes.position.needsUpdate = true;
    points.rotation.y += 0.002;
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});