// --- 1. CORE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- 2. GEOMETRY GENERATION ---
const particleCount = 4500;
const posArray = new Float32Array(particleCount * 3);

// Targets for morphing
const target_EIACore = new Float32Array(particleCount * 3);
const target_TorusStack = new Float32Array(particleCount * 3);
const target_DataPrism = new Float32Array(particleCount * 3);
const target_FeedbackForm = new Float32Array(particleCount * 3);

// Pre-calculating Knot for Tech Stack
const knotGeometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
const knotPos = knotGeometry.attributes.position.array;
const knotVertCount = knotPos.length / 3;

for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;

    posArray[i * 3] = x;
    posArray[i * 3 + 1] = y;
    posArray[i * 3 + 2] = z;

    const epsilon = 0.0001;

    // 1. EIA CORE (Modified Octahedron) - CALIBRATED
    let octaFactor = 14.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + epsilon);
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK (Knot) - CALIBRATED
    let kIdx = (i % knotVertCount) * 3;
    const knotScale = 2.4; 
    target_TorusStack[i * 3] = knotPos[kIdx] * knotScale;
    target_TorusStack[i * 3 + 1] = knotPos[kIdx + 1] * knotScale;
    target_TorusStack[i * 3 + 2] = knotPos[kIdx + 2] * knotScale;

    // 3. DATA PRISM (Pillar) - CALIBRATED
    let mag = Math.sqrt(x*x + y*y + z*z) + epsilon;
    let prismRadius = 16; 
    target_DataPrism[i * 3] = (x / mag) * (prismRadius * 0.5);   
    target_DataPrism[i * 3 + 1] = (y / mag) * (prismRadius * 1.4); 
    target_DataPrism[i * 3 + 2] = (z / mag) * (prismRadius * 0.5); 

    // 4. GHOST FORM BLUEPRINT - CALIBRATED
    const fW = 55; const fH = 85;
    if (i % 4 === 0) { // Top
        target_FeedbackForm[i * 3] = (x / 8) * fW;
        target_FeedbackForm[i * 3 + 1] = 25 + Math.round(y/15)*5;
        target_FeedbackForm[i * 3 + 2] = -8;
    } else if (i % 4 === 1) { // Inputs
        target_FeedbackForm[i * 3] = (x / 10) * (fW * 0.8);
        target_FeedbackForm[i * 3 + 1] = (i % 8 < 4) ? 8 : -8;
        target_FeedbackForm[i * 3 + 2] = -12;
    } else if (i % 4 === 2) { // Pillars
        target_FeedbackForm[i * 3] = x > 0 ? fW : -fW;
        target_FeedbackForm[i * 3 + 1] = (y / 10) * (fH * 0.5);
        target_FeedbackForm[i * 3 + 2] = -5;
    } else { // Bottom
        target_FeedbackForm[i * 3] = x > 0 ? fW * 0.5 : -fW * 0.5;
        target_FeedbackForm[i * 3 + 1] = -30;
        target_FeedbackForm[i * 3 + 2] = -10;
    }
}

// Geometry and Material Setup
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const material = new THREE.PointsMaterial({
    size: 0.12,
    color: 0x00e676,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const points = new THREE.Points(geometry, material);
scene.add(points);
camera.position.z = 50;

// --- 3. MORPH LOGIC ---
let scrollPercent = 0;
document.addEventListener('scroll', () => {
    const h = document.documentElement;
    const b = document.body;
    const st = 'scrollTop';
    const sh = 'scrollHeight';
    scrollPercent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
        let tx, ty, tz;
        
        // Linear Interpolation through the 4 states
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