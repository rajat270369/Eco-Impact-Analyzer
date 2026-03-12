// --- Section Reveal Logic ---
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
const loader = new THREE.TextureLoader();
const texture = loader.load('your-image.jpg'); // Put a local image path here
// Change MeshBasicMaterial to MeshLambertMaterial if you want it to react to light
const materialWithTexture = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
const material = new THREE.MeshBasicMaterial({ 

    color: 0x00e676, 
    wireframe: true,
    transparent: true,
    opacity: 0.5 
});
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

camera.position.z = 30;

// --- 3. Scroll Logic (Revolving Center) ---
function handleScroll() {
    // Calculate scroll progress (0 to 1)
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    globe.rotation.y = scrollPercent * 10;
    
    // 2. Opacity / Visibility Change
    // As we reach the end (Contact section), we can make the globe fade 
    // or change color to signal the transition.
    if (scrollPercent > 0.8) {
        material.color.setHex(0xffffff); // Changes to white for the contact section
        material.opacity = 0.8;
    } else {
        material.color.setHex(0x00e676); // Back to green
        material.opacity = 0.5;
    }
  }

    // REVOLVE: Rotation tied to scroll position
    // Adding to the rotation instead of setting it allows the 'animate' loop to stay smooth
    globe.rotation.y = scrollPercent * 8; 
    globe.rotation.x = scrollPercent * 4;

    // Ensure it stays locked in the center
    globe.position.set(0, 0, 0);
    globe.scale.set(1, 1, 1);
   

window.addEventListener('scroll', handleScroll);

// --- 4. Constant Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Constant slow drift (adds "life" to the site)
    globe.rotation.y += 0.002;
    
    renderer.render(scene, camera);
}

animate();

// --- 5. Handle Resizing ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});