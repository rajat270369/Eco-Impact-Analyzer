// --- Section Reveal Logic (Keep as is) ---
window.addEventListener('scroll', () => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 50) {
            el.classList.add('active');
        }
    });
});

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const geometry = new THREE.IcosahedronGeometry(8, 3); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.4 
});

const originalPositions = geometry.attributes.position.array.slice();
const vertexCount = geometry.attributes.position.count;

const target1_Plant = new Float32Array(vertexCount * 3);
const target2_Tech = new Float32Array(vertexCount * 3);
const target3_Pulse = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // --- STOP 1: THE ECO-LEAF (Organic Taper) ---
    // We use a "Diamond" taper: Wide at y=0, Sharp at y=max/min
    let heightFactor = 1.0 - Math.abs(y / 11); 
    let leafCurve = Math.pow(heightFactor, 0.5); // Makes the middle bulge more

    // We shift x slightly based on y to give it a "natural tilt"
    target1_Plant[i * 3] = (x * leafCurve * 2.2) + (y * 0.1); 
    target1_Plant[i * 3 + 1] = y * 1.5; 
    target1_Plant[i * 3 + 2] = z * 0.02; // Make it extremely flat

    // --- STOP 2: THE TECH PROCESSOR (Cube) ---
    target2_Tech[i * 3] = Math.max(-7, Math.min(7, x * 1.8));
    target2_Tech[i * 3 + 1] = Math.max(-7, Math.min(7, y * 1.8));
    target2_Tech[i * 3 + 2] = Math.max(-7, Math.min(7, z * 1.8));

    // --- STOP 3: THE DATA WAVE ---
    target3_Pulse[i * 3] = x * 2.8; 
    target3_Pulse[i * 3 + 1] = Math.sin(x * 0.7) * 4; 
    target3_Pulse[i * 3 + 2] = z * 0.05;
}

const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
camera.position.z = 35;

// --- 3. Scroll & Morph Logic ---
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const positions = geometry.attributes.position.array;

    if (scrollPercent <= 0.33) {
        const factor = Math.min(scrollPercent * 4.0, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target1_Plant[i], factor);
        }
    } 
    else if (scrollPercent <= 0.66) {
        const factor = Math.min((scrollPercent - 0.33) * 3.5, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target1_Plant[i], target2_Tech[i], factor);
        }
    } 
    else {
        const factor = Math.min((scrollPercent - 0.66) * 3.5, 1);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target2_Tech[i], target3_Pulse[i], factor);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    
    // Slow down rotation when showing the leaf to let the shape stand out
    let rotationBase = 6;
    if (scrollPercent > 0.1 && scrollPercent < 0.3) rotationBase = 2;
    globe.rotation.y = scrollPercent * rotationBase;
}

window.addEventListener('scroll', handleScroll);

// --- 4. Constant Animation Loop ---
let time = 0;
function animate() {
    time += 0.01;
    requestAnimationFrame(animate);
    
    // If we are at the first stop, add a gentle "leaf in the wind" sway
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if (scrollPercent > 0.1 && scrollPercent < 0.4) {
        globe.rotation.z = Math.sin(time) * 0.05;
    }

    globe.rotation.y += 0.001;
    renderer.render(scene, camera);
}

animate();

// --- 5. Resize Handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});