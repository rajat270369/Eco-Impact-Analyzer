/// --- 1. CORE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- 2. GEOMETRY GENERATION ---
const particleCount = 5000;
const posArray = new Float32Array(particleCount * 3);

// Targets for morphing
const target_EIACore = new Float32Array(particleCount * 3);
const target_TorusStack = new Float32Array(particleCount * 3);
const target_DataPrism = new Float32Array(particleCount * 3);
const target_FeedbackForm = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;

    // Starting positions (Random cloud)
    posArray[i * 3] = x;
    posArray[i * 3 + 1] = y;
    posArray[i * 3 + 2] = z;

    // 1. EIA CORE (The Octahedron/Diamond)
    let factor = 12 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + 0.01);
    target_EIACore[i * 3] = x * factor;
    target_EIACore[i * 3 + 1] = y * factor;
    target_EIACore[i * 3 + 2] = z * factor;

    // 2. TECH STACK (The Organic Torus Knot)
    const t = i * 0.15;
    target_TorusStack[i * 3] = (12 + 4 * Math.cos(2 * t)) * Math.cos(3 * t);
    target_TorusStack[i * 3 + 1] = (12 + 4 * Math.cos(2 * t)) * Math.sin(3 * t);
    target_TorusStack[i * 3 + 2] = 4 * Math.sin(2 * t);

    // 3. DATA PRISM (The Floating Cylinder)
    let angle = Math.random() * Math.PI * 2;
    let radius = 16;
    target_DataPrism[i * 3] = Math.cos(angle) * radius;
    target_DataPrism[i * 3 + 1] = (Math.random() - 0.5) * 45;
    target_DataPrism[i * 3 + 2] = Math.sin(angle) * radius;

    // 4. GHOST BLUEPRINT (The Flat UI Grid)
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

// --- 3. SCROLL LOGIC ---
let scrollPercent = 0;
document.addEventListener('scroll', () => {
    const h = document.documentElement;
    const b = document.body;
    const st = 'scrollTop';
    const sh = 'scrollHeight';
    scrollPercent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight);
});

// --- 4. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
        let tx, ty, tz;
        
        // Split scroll into 3 transition zones
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

        // The "Secret Sauce": Elastic motion toward the target
        positions[i * 3] += (tx - positions[i * 3]) * 0.08;
        positions[i * 3 + 1] += (ty - positions[i * 3 + 1]) * 0.08;
        positions[i * 3 + 2] += (tz - positions[i * 3 + 2]) * 0.08;
    }

    geometry.attributes.position.needsUpdate = true;
    
    // Slow rotation for life
    points.rotation.y += 0.0015;
    points.rotation.x += 0.0005;

    renderer.render(scene, camera);
}

animate();

// Handle Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});