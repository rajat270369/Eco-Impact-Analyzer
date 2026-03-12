// --- Section Reveal Logic (for future content) ---
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

// --- 2. Create the "Eco-Globe" ---
const geometry = new THREE.IcosahedronGeometry(10, 1); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

camera.position.z = 30;

// --- 3. Scroll Logic (Locked Center Revolve) ---
function handleScroll() {
    // Calculate scroll progress (0 to 1)
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    // Rotation is tied to scroll, but position remains centered (0,0,0)
    globe.rotation.y = scrollPercent * 8; 
    globe.rotation.x = scrollPercent * 4;

    // Ensure it doesn't move or grow
    globe.position.set(0, 0, 0);
    globe.scale.set(1, 1, 1);
}

window.addEventListener('scroll', handleScroll);

// --- 4. Constant Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Constant slow drift even when not scrolling
    globe.rotation.y += 0.002;
    
    renderer.render(scene, camera);
}

animate();

// --- 5. Handle Window Resizing ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});