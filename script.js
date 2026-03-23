console.log("Three.js Morph Logic v1.3.4 - Restoration Active");

// --- 1. SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.z = 50; 

const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true,
    powerPreference: "high-performance" 
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Global Ambient Light for consistent visibility
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

// Prepare Morph Targets
const target_EIACore = new Float32Array(vertexCount * 3);     
const target_TorusStack = new Float32Array(vertexCount * 3); 
const target_DataPrism = new Float32Array(vertexCount * 3);     
const target_FeedbackPlane = new Float32Array(vertexCount * 3);

// --- 3. BAKE MORPH TARGETS ---
const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
const knotPos = knotBake.attributes.position.array;
const knotVertCount = knotBake.attributes.position.count;

for (let i = 0; i < vertexCount; i++) {
    let x = originalPositions[i * 3];
    let y = originalPositions[i * 3 + 1];
    let z = originalPositions[i * 3 + 2];

    const epsilon = 0.0001;

    // 1. EIA CORE (Modified Octahedron)
    let octaFactor = 14.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + epsilon);
    target_EIACore[i * 3] = x * octaFactor;
    target_EIACore[i * 3 + 1] = y * octaFactor;
    target_EIACore[i * 3 + 2] = z * octaFactor;

    // 2. TECH STACK (Knot Mapping)
    let kIdx = (i % knotVertCount) * 3;
    const knotScale = 1.8; 
    target_TorusStack[i * 3] = knotPos[kIdx] * knotScale;
    target_TorusStack[i * 3 + 1] = knotPos[kIdx + 1] * knotScale;
    target_TorusStack[i * 3 + 2] = knotPos[kIdx + 2] * knotScale;

    // 3. DATA PRISM (Vertical Expansion)
    let mag = Math.sqrt(x*x + y*y + z*z) + epsilon;
    let prismRadius = 16; 
    target_DataPrism[i * 3] = (x / mag) * (prismRadius * 0.5);   
    target_DataPrism[i * 3 + 1] = (y / mag) * (prismRadius * 1.4); 
    target_DataPrism[i * 3 + 2] = (z / mag) * (prismRadius * 0.5);

    // 4. THE GHOST FORM "BLUEPRINT" logic
    const fW = 35; 
    const fH = 39; 
    
    if (i < vertexCount * 0.4) {
        const side = i % 4;
        const progress = ((i % 500) / 500) * 2 - 1; 
        
        if (side === 0) { // Right Rail
            target_FeedbackPlane[i*3] = fW;  
            target_FeedbackPlane[i*3+1] = progress * fH; 
        } else if (side === 1) { // Left Rail
            target_FeedbackPlane[i*3] = -fW; 
            target_FeedbackPlane[i*3+1] = progress * fH; 
        } else if (side === 2) { // Top Rail
            target_FeedbackPlane[i*3] = progress * fW; 
            target_FeedbackPlane[i*3+1] = fH;  
        } else if (side === 3) { // Bottom Rail
            target_FeedbackPlane[i*3] = progress * fW; 
            target_FeedbackPlane[i*3+1] = -fH; 
        }
        target_FeedbackPlane[i*3+2] = -5; 
    } 
    else {
        target_FeedbackPlane[i*3] = 0;
        target_FeedbackPlane[i*3+1] = -1500; 
        target_FeedbackPlane[i*3+2] = -100;
    }
    if (i < vertexCount * 0.4) {
        target_FeedbackPlane[i*3+2] = -5;
    }
}
knotBake.dispose();

// --- 4. MESH & PARTICLE INSTANTIATION ---
const mainMesh = new THREE.Mesh(geometry, material);
mainMesh.frustumCulled = false; 
scene.add(mainMesh);

const particleMaterial = new THREE.PointsMaterial({ 
    color: 0x00e676, 
    size: 2.5, 
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

    // Multi-Stage Morphing
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

    // Phase Swap (Fading and Rotation)
    if (mainMesh && particleMaterial) {
        if (scroll > 0.82) {
            mainMesh.material.opacity = THREE.MathUtils.lerp(mainMesh.material.opacity, 0, 0.12);
            particleMaterial.opacity = THREE.MathUtils.lerp(particleMaterial.opacity, 0.8, 0.12);
            
            mainMesh.rotation.y = THREE.MathUtils.lerp(mainMesh.rotation.y, 0, 0.05);
            mainMesh.rotation.x = THREE.MathUtils.lerp(mainMesh.rotation.x, 0, 0.05);
        } else {
            mainMesh.material.opacity = THREE.MathUtils.lerp(mainMesh.material.opacity, 0.6, 0.12);
            particleMaterial.opacity = THREE.MathUtils.lerp(particleMaterial.opacity, 0, 0.12);
            
            mainMesh.rotation.y += 0.005;
            mainMesh.rotation.x += 0.002;
        }
    }

    renderer.render(scene, camera);
}

// --- 7. EVENT LISTENERS ---
window.addEventListener('scroll', () => {
    requestAnimationFrame(handleScroll);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    handleScroll(); 
});

// INITIALIZE
handleScroll(); 
animate();

const feedbackForm = document.getElementById('eia-feedback-form');
const successMsg = document.getElementById('success-message');
const submitBtn = document.getElementById('submit-btn');

feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailValue = document.getElementById('email-input').value;

   
    if (localStorage.getItem('form_submitted_' + emailValue)) {
        alert("PROTOCOL ERROR: Multiple submissions detected from this address.");
        return;
    }

    
    submitBtn.innerText = "TRANSMITTING...";

   
    const formData = new FormData(feedbackForm);
    
    try {
        const response = await fetch(feedbackForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            
            feedbackForm.style.display = 'none';
            successMsg.style.display = 'block';

           
            feedbackForm.reset();
            
            
            localStorage.setItem('form_submitted_' + emailValue, 'true');
        } else {
            alert("TRANSMISSION FAILED: Please check connection.");
            submitBtn.innerText = "RETRY TRANSMISSION";
        }
    } catch (error) {
        alert("SYSTEM ERROR: Uplink interrupted.");
    }
})
const observerOptions = { threshold: 0.2 };
        
        const generalObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal, .story-card').forEach(el => {
            generalObserver.observe(el);
        });

        // Initialize 3D loop safely
        window.onload = () => {
            if (typeof init === "function") init();
            // Start the scroll handler once to set initial positions
            if (typeof handleScroll === "function") handleScroll();
        };