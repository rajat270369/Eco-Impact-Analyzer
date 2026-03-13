// VERSION: 1.2.2 - 5-Section Journey with Torus Knot Integration
console.log("Three.js Morph Logic v1.2.2 Loaded");

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

const originalPositions = geometry.attributes.position.array.slice(); // Section 1: Sphere
const vertexCount = geometry.attributes.position.count;

// --- Target Definitions ---
const target_EIACore = new Float32Array(vertexCount * 3);    // Section 2: Diamond
const target_TorusStack = new Float32Array(vertexCount * 3); // Section 3: Torus Knot
const target_HexStar = new Float32Array(vertexCount * 3);    // Section 4 & 5: Star

// Pre-bake the Torus Knot for Section 3
const knotBake = new THREE.TorusKnotGeometry(7, 2.5, 100, 16); 
const knotPos = knotBake.attributes.position.array;
const knotVertCount = knotBake.attributes.position.count;

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    // 1. EIA CORE (Diamond/Octahedron)
    let octaFactor = 10.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK (Torus Knot Mapping)
    let knotIdx = (i % knotVertCount) * 3;
    target_TorusStack[i * 3] = knotPos[knotIdx];
    target_TorusStack[i * 3 + 1] = knotPos[knotIdx + 1];
    target_TorusStack[i * 3 + 2] = knotPos[knotIdx + 2];

   // --- Option B: Data Prism (Replace Section 3 in the loop) ---
  let mag = Math.sqrt(x*x + y*y + z*z);
   let prismRadius = 12;

   // We squash the shape into a vertical diamond/prism
   target_HexStar[i * 3] = (x / mag) * (prismRadius * 0.5);   // Narrow X
   target_HexStar[i * 3 + 1] = (y / mag) * (prismRadius * 1.2); // Tall Y
   target_HexStar[i * 3 + 2] = (z / mag) * (prismRadius * 0.5); // Narrow Z
 }
 knotBake.dispose(); // Free up memory


const mainMesh = new THREE.Mesh(geometry, material);
scene.add(mainMesh);
camera.position.z = 35;

function handleScroll() {
    const positions = geometry.attributes.position.array;
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    if (scrollPercent <= 0.2) {
        // Zone 1: Sphere -> Diamond
        let f = clamp(scrollPercent * 5);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(originalPositions[i], target_EIACore[i], f);
        }
    } else if (scrollPercent <= 0.4) {
        // Zone 2: Diamond -> Torus Knot
        let f = clamp((scrollPercent - 0.2) * 5);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_EIACore[i], target_TorusStack[i], f);
        }
    } else if (scrollPercent <= 0.6) {
        // Zone 3: Torus Knot -> Hexagram Star
        let f = clamp((scrollPercent - 0.4) * 5);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_TorusStack[i], target_HexStar[i], f);
        }
    } else {
        // Zone 4 & 5: Lock into Star
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = target_HexStar[i];
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