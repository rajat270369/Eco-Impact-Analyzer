window.addEventListener('scroll', () => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 50) {
            el.classList.add('active');
        }
    });
});

function scrollToProject() {
    document.getElementById('project-info').scrollIntoView({ behavior: 'smooth' });
}
// 1. Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 2. Create the "Eco-Globe"
const geometry = new THREE.IcosahedronGeometry(10, 1); // A cool geometric sphere
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

camera.position.z = 30;

// 3. Scroll Logic (The "Igloo" effect)
function handleScroll() {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    // As you scroll, the globe rotates and zooms in
    globe.rotation.y = scrollPercent * 5;
    globe.rotation.x = scrollPercent * 2;
    globe.position.z = scrollPercent * 20; // Moves closer as you scroll
    
    // Optional: Make it shift slightly to the side
    globe.position.x = scrollPercent * 5;
}

window.addEventListener('scroll', handleScroll);

// 4. Constant Animation Loop
function animate() {
    requestAnimationFrame(animate);
    // Constant slow drift even when still
    globe.rotation.y += 0.002;
    renderer.render(scene, camera);
}

animate();

// Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});