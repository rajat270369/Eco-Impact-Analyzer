// VERSION: 1.1.3 - Selector Fallback & Debug Mode
console.log("Three.js Morph Logic v1.1.3 Loaded");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- 2. Geometry Setup ---
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
const target_TechStack = new Float32Array(vertexCount * 3);
const target_RealTime = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // EIA CORE (Octahedron)
    let octaFactor = 10.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // TECH STACK (Hexagram)
    let angle = Math.atan2(y, x);
    let starFold = (Math.cos(angle * 6) * 3.5) + 7.5; 
    target_TechStack[i * 3] = Math.cos(angle) * starFold;
    target_TechStack[i * 3 + 1] = Math.sin(angle) * starFold;
    target_TechStack[i * 3 + 2] = z * 0.15;

    // REAL TIME (Flattened Disk)
    target_RealTime[i * 3] = Math.cos(angle) * 12;
    target_RealTime[i * 3 + 1] = Math.sin(angle) * 12;
    target_RealTime[i * 3 + 2] = z * 0.05;
}

const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

// --- 3. Robust Scroll Logic ---
function handleScroll() {
    const positions = geometry.attributes.position.array;
    const cards = document.querySelectorAll('.reveal');
    
    let scrollPercent;

    if (cards.length >= 3) {
        // Method A: Card-based detection (Precise)
        const getPoint = (el) => 1 - (el.getBoundingClientRect().top / window.innerHeight);
        const p1 = getPoint(cards[0]);
        const p2 = getPoint(cards[1]);
        const p3 = getPoint(cards[2]);

        if (p1 < 0.5) scrollPercent = 0;
        else if (p1 >= 0.5 && p2 < 0.5) scrollPercent = 0.33 + ((p1 - 0.5) * 0.66);
        else if (p2 >= 0.5 && p3 < 0.5) scrollPercent = 0.66 + ((p2 - 0.5) * 0.66);
        else scrollPercent = 1.0;
    } else {
        // Method B: Fallback to Page-height (If cards aren't found)
        scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    }

    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    // Final Morphing Calculation
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

function animate() {
    requestAnimationFrame(animate);
    mainMesh.rotation.y += 0.003;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});