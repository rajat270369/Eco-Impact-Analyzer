// VERSION: 1.3.7 - Full Architectural Restoration
console.log("Three.js Morph Logic v1.3.7 - Stable Restoration");

// --- 1. SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.z = 50; 

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// --- 2. GEOMETRY & MATERIALS ---
const geometry = new THREE.IcosahedronGeometry(10, 6); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.6,
    depthTest: true,
    blending: THREE.AdditiveBlending 
});

const originalPositions = geometry.attributes.position.array.slice(); 
const vertexCount = geometry.attributes.position.count;

const target_EIACore = new Float32Array(vertexCount * 3);     
const target_TorusStack = new Float32Array(vertexCount * 3); 
const target_DataPrism = new Float32Array(vertexCount * 3);     
const target_FeedbackPlane = new Float32Array(vertexCount * 3);

// --- 3. BAKE MORPH TARGETS ---
const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
const knotPos = knotBake.attributes.position.array;
const knotVertCount = knotBake.attributes.position.count;

const fW = 28; 
const fH = 40; 

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];
    const epsilon = 0.0001;

    // 1. EIA CORE
    let octaFactor = 14.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + epsilon);
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK
    let kIdx = (i % knotVertCount) * 3;
    target_TorusStack[i * 3] = knotPos[kIdx] * 1.8;
    target_TorusStack[i * 3 + 1] = knotPos[kIdx + 1] * 1.8;
    target_TorusStack[i * 3 + 2] = knotPos[kIdx + 2] * 1.8;

    // 3. DATA PRISM
    let mag = Math.sqrt(x*x + y*y + z*z) + epsilon;
    target_DataPrism[i * 3] = (x / mag) * 8;   
    target_DataPrism[i * 3 + 1] = (y / mag) * 22.4; 
    target_DataPrism[i * 3 + 2] = (z / mag) * 8;

    // 4. CLEAN FEEDBACK FRAME logic
    if (i < vertexCount * 0.4) {
        const side = i % 4;
        const segmentProgress = ((i / 4) / (vertexCount * 0.1)) * 2 - 1; 
        
        if (side === 0) { // Right
            target_FeedbackPlane[i*3] = fW;  
            target_FeedbackPlane[i*3+1] = segmentProgress * fH; 
        } else if (side === 1) { // Left
            target_FeedbackPlane[i*3] = -fW; 
            target_FeedbackPlane[i*3+1] = segmentProgress * fH; 
        } else if (side === 2) { // Top
            target_FeedbackPlane[i*3] = segmentProgress * fW; 
            target_FeedbackPlane[i*3+1] = fH;  
        } else if (side === 3) { // Bottom
            target_FeedbackPlane[i*3] = segmentProgress * fW; 
            target_FeedbackPlane[i*3+1] = -fH; 
        }
        target_FeedbackPlane[i*3+2] = -2;
    } else {
        // KILL BLUE SYMBOL: Move unused 60% of points to Z=5000
        target_FeedbackPlane[i*3] = 0;
        target_FeedbackPlane[i*3+1] = 0; 
        target_FeedbackPlane[i*3+2] = 5000; 
    }
}
knotBake.dispose();

// --- 4. MESH & PARTICLE INSTANTIATION ---
const mainMesh = new THREE.Mesh(geometry, material);
mainMesh.frustumCulled = false; 
scene.add(mainMesh);

const particleMaterial = new THREE.PointsMaterial({ 
    color: 0x00e676, 
    size: 1.5, 
    sizeAttenuation: false,
    transparent: true, 
    opacity: 0,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, particleMaterial);
scene.add(particles);

// --- 5. INTERACTION LOGIC ---
function handleScroll() {
    const positions = geometry.attributes.position.array;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    const clamp = (v) => Math.min(Math.max(v, 0), 1);

    camera.position.z = 40 + (scrollPercent * 15); 

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
            positions[i] = THREE.MathUtils.lerp(target_TorusStack[i], target_DataPrism[i], f);
        }
    } else {
        let f = clamp((scrollPercent - 0.75) * 4);
        for (let i = 0; i < vertexCount * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(target_DataPrism[i], target_FeedbackPlane[i], f);
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

// --- 6. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scroll = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;

    if (mainMesh && particleMaterial) {
        if (scroll > 0.85) {
            // HARD SNAP: No rotation, no movement. Pure alignment with the UI.
            mainMesh.rotation.set(0, 0, 0);
            particles.rotation.set(0, 0, 0);
            
            // OPACITY LOCK: Wireframe vanishes, particles remain sharp.
            mainMesh.material.opacity = THREE.MathUtils.lerp(mainMesh.material.opacity, 0, 0.15);
            particleMaterial.opacity = THREE.MathUtils.lerp(particleMaterial.opacity, 1.0, 0.15);
            
            mainMesh.visible = mainMesh.material.opacity > 0.01;
        } else {
            // ACTIVE STATE: Standard rotation and wireframe visibility.
            mainMesh.visible = true;
            mainMesh.rotation.y += 0.005;
            mainMesh.rotation.x += 0.002;
            
            particles.rotation.y = mainMesh.rotation.y;
            particles.rotation.x = mainMesh.rotation.x;
            
            mainMesh.material.opacity = 0.6;
            particleMaterial.opacity = 0;
        }
    }

    renderer.render(scene, camera);
}

// --- 7. EVENT LISTENERS ---
window.addEventListener('scroll', () => { requestAnimationFrame(handleScroll); });
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    handleScroll(); 
});

handleScroll(); 
animate();

// --- 8. FULL FORM & UPLINK LOGIC ---
const feedbackForm = document.getElementById('eia-feedback-form');
const successMsg = document.getElementById('success-message');
const submitBtn = document.getElementById('submit-btn');

feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('email-input');
    const emailValue = emailInput.value.toLowerCase().trim();
    const handle = emailValue.split('@')[0];

    if (localStorage.getItem('form_submitted_' + emailValue)) {
        alert("PROTOCOL ERROR: Data already logged for this address.");
        return;
    }
    if (handle.length < 6) {
        alert("SYSTEM ERROR: Gmail handle must be at least 6 characters.");
        return;
    }

    submitBtn.innerText = "TRANSMITTING...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(feedbackForm.action, {
            method: 'POST',
            body: new FormData(feedbackForm),
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            feedbackForm.reset();
            feedbackForm.style.display = 'none';
            successMsg.innerText = "UPLINK SUCCESSFUL: DATA TRANSMITTED";
            successMsg.style.display = 'block';
            localStorage.setItem('form_submitted_' + emailValue, 'true');
            setTimeout(() => {
                successMsg.style.display = 'none';
                feedbackForm.style.display = 'block';
                submitBtn.innerText = "TRANSMIT DATA";
                submitBtn.disabled = false;
            }, 5000);
        }
    } catch (error) {
        alert("SYSTEM ERROR: Network Uplink Interrupted.");
        submitBtn.disabled = false;
        submitBtn.innerText = "RETRY TRANSMISSION";
    }
});