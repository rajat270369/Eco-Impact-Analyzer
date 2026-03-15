//* ================================================================
    ECO IMPACT ANALYZER - CORE ENGINE
    VERSION: 1.4.9 - PRODUCTION DEPLOYMENT
    COMPONENTS: Morph Engine, Vertex Pipeline, UI Uplink, State Manager
    ================================================================
*/

/**
 * @namespace EIACore
 * @description Central logic for the 3D interface and data transmission protocol.
 */
const EIACore = (function() {
    'use strict';

    // --- 1. SYSTEM CONFIGURATION & STATE ---
    const CONFIG = {
        COLOR_PRIMARY: 0x00e676,
        COLOR_GLOW: 0x00ff88,
        CAMERA_Z_START: 50,
        CAMERA_Z_END: 65,
        MORPH_PRECISION: 6,
        ANIMATION_SPEED: 0.005,
        FRAME_WIDTH: 35,
        FRAME_HEIGHT: 45,
        SUBMIT_TIMEOUT: 5000,
        PARTICLE_SIZE: 1.5,
        LERP_FACTOR_FAST: 0.4,
        LERP_FACTOR_SMOOTH: 0.12
    };

    const STATE = {
        isInitialized: false,
        lastScrollPercent: 0,
        isTransmitting: false,
        vertexCount: 0,
        activeMorph: 'CORE' // CORE, TORUS, PRISM, FRAME
    };

    // --- 2. THREE.JS SCENE INITIALIZATION ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        3000
    );
    camera.position.z = CONFIG.CAMERA_Z_START;

    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true, 
        powerPreference: "high-performance" 
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const container = document.getElementById('canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // Lighting Pipeline
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const pointLight = new THREE.PointLight(CONFIG.COLOR_PRIMARY, 2);
    pointLight.position.set(0, 100, 50);
    scene.add(ambientLight, pointLight);

    // --- 3. GEOMETRY MEMORY ALLOCATION ---
    const geometry = new THREE.IcosahedronGeometry(10, CONFIG.MORPH_PRECISION); 
    const material = new THREE.MeshBasicMaterial({ 
        color: CONFIG.COLOR_PRIMARY, 
        wireframe: true,
        transparent: true,
        opacity: 0.6,
        depthTest: true,
        blending: THREE.AdditiveBlending 
    });

    const originalPositions = geometry.attributes.position.array.slice(); 
    STATE.vertexCount = geometry.attributes.position.count;

    // Buffer Attributes for Morph Targets
    const targets = {
        core: new Float32Array(STATE.vertexCount * 3),
        torus: new Float32Array(STATE.vertexCount * 3),
        prism: new Float32Array(STATE.vertexCount * 3),
        frame: new Float32Array(STATE.vertexCount * 3)
    };

    // --- 4. THE BAKE PIPELINE (VERTEX MATH) ---
    /**
     * @function bakeTargets
     * @description Pre-calculates vertex positions for all interface states to avoid runtime CPU spikes.
     */
    function bakeTargets() {
        const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
        const knotPos = knotBake.attributes.position.array;
        const knotVertCount = knotBake.attributes.position.count;

        for (let i = 0; i < STATE.vertexCount; i++) {
            let x = originalPositions[i * 3];
            let y = originalPositions[i * 3 + 1];
            let z = originalPositions[i * 3 + 2];
            const epsilon = 0.0001;

            // Target 1: EIA CORE (Optimized Octahedron)
            let octaFactor = 14.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + epsilon);
            targets.core[i * 3] = x * octaFactor;
            targets.core[i * 3 + 1] = y * octaFactor;
            targets.core[i * 3 + 2] = z * octaFactor;

            // Target 2: TECH STACK (Torus Knot Mapping)
            let kIdx = (i % knotVertCount) * 3;
            targets.torus[i * 3] = knotPos[kIdx] * 1.8;
            targets.torus[i * 3 + 1] = knotPos[kIdx + 1] * 1.8;
            targets.torus[i * 3 + 2] = knotPos[kIdx + 2] * 1.8;

            // Target 3: DATA PRISM (Anisotropic Stretch)
            let mag = Math.sqrt(x*x + y*y + z*z) + epsilon;
            targets.prism[i * 3] = (x / mag) * 8;   
            targets.prism[i * 3 + 1] = (y / mag) * 22.4; 
            targets.prism[i * 3 + 2] = (z / mag) * 8;

            // Target 4: STABILIZED FEEDBACK FRAME
            // Moves vertices to form a 1px-thin bounding box
            if (i < STATE.vertexCount * 0.4) {
                const side = i % 4;
                const progress = ((i / 4) / (STATE.vertexCount * 0.1)) * 2 - 1; 
                
                if (side === 0) { // Right Vertical
                    targets.frame[i*3] = CONFIG.FRAME_WIDTH;  
                    targets.frame[i*3+1] = progress * CONFIG.FRAME_HEIGHT; 
                } else if (side === 1) { // Left Vertical
                    targets.frame[i*3] = -CONFIG.FRAME_WIDTH; 
                    targets.frame[i*3+1] = progress * CONFIG.FRAME_HEIGHT; 
                } else if (side === 2) { // Top Horizontal
                    targets.frame[i*3] = progress * CONFIG.FRAME_WIDTH; 
                    targets.frame[i*3+1] = CONFIG.FRAME_HEIGHT;  
                } else if (side === 3) { // Bottom Horizontal
                    targets.frame[i*3] = progress * CONFIG.FRAME_WIDTH; 
                    targets.frame[i*3+1] = -CONFIG.FRAME_HEIGHT; 
                }
                targets.frame[i*3+2] = -5; // Recessed depth
            } else {
                // Garbage Collection: Move extra vertices out of frustum
                targets.frame[i*3] = 0;
                targets.frame[i*3+1] = 0; 
                targets.frame[i*3+2] = 5000; 
            }
        }
        knotBake.dispose();
    }

    // --- 5. MESH INSTANTIATION ---
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.frustumCulled = false; 
    scene.add(mainMesh);

    const particleMaterial = new THREE.PointsMaterial({ 
        color: CONFIG.COLOR_PRIMARY, 
        size: CONFIG.PARTICLE_SIZE, 
        sizeAttenuation: false,
        transparent: true, 
        opacity: 0,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // --- 6. INTERFACE ENGINE (SCROLL LOGIC) ---
    /**
     * @function updateInterface
     * @description Calculates lerp percentages based on scroll depth.
     */
    function updateInterface() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const rawPercent = window.scrollY / (scrollHeight || 1); // Logic fix: prevent division by 0
        const scrollPercent = Math.min(Math.max(rawPercent, 0), 1);
        
        STATE.lastScrollPercent = scrollPercent;

        // Camera Dolly
        camera.position.z = CONFIG.CAMERA_Z_START + (scrollPercent * (CONFIG.CAMERA_Z_END - CONFIG.CAMERA_Z_START)); 

        // Lerp Logic Controller
        if (scrollPercent <= 0.25) {
            STATE.activeMorph = 'CORE';
            lerpVertices(originalPositions, targets.core, (scrollPercent * 4));
        } else if (scrollPercent <= 0.50) {
            STATE.activeMorph = 'TORUS';
            lerpVertices(targets.core, targets.torus, ((scrollPercent - 0.25) * 4));
        } else if (scrollPercent <= 0.75) {
            STATE.activeMorph = 'PRISM';
            lerpVertices(targets.torus, targets.prism, ((scrollPercent - 0.50) * 4));
        } else {
            STATE.activeMorph = 'FRAME';
            lerpVertices(targets.prism, targets.frame, ((scrollPercent - 0.75) * 4));
        }
        
        geometry.attributes.position.needsUpdate = true;
    }

    function lerpVertices(startArr, endArr, factor) {
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < STATE.vertexCount * 3; i++) {
            // Optimized manual interpolation
            positions[i] = startArr[i] + (endArr[i] - startArr[i]) * factor;
        }
    }

    // --- 7. RENDERING PIPELINE ---
    function render() {
        requestAnimationFrame(render);

        const scroll = STATE.lastScrollPercent;

        if (mainMesh && particleMaterial) {
            // High-Scroll Phase (Frame Lock)
            if (scroll > 0.88) {
                mainMesh.rotation.set(0, 0, 0);
                particles.rotation.set(0, 0, 0);
                
                mainMesh.material.opacity = THREE.MathUtils.lerp(
                    mainMesh.material.opacity, 0.1, CONFIG.LERP_FACTOR_FAST
                );
                particleMaterial.opacity = THREE.MathUtils.lerp(
                    particleMaterial.opacity, 0.8, CONFIG.LERP_FACTOR_FAST
                );
            } 
            // Exploration Phase (Rotation)
            else {
                mainMesh.material.opacity = THREE.MathUtils.lerp(
                    mainMesh.material.opacity, 0.6, CONFIG.LERP_FACTOR_SMOOTH
                );
                particleMaterial.opacity = THREE.MathUtils.lerp(
                    particleMaterial.opacity, 0, CONFIG.LERP_FACTOR_SMOOTH
                );
                
                mainMesh.rotation.y += CONFIG.ANIMATION_SPEED;
                mainMesh.rotation.x += CONFIG.ANIMATION_SPEED * 0.4;
                particles.rotation.copy(mainMesh.rotation);
            }
        }
        renderer.render(scene, camera);
    }

    // --- 8. UPLINK PROTOCOL (FORM HANDLING) ---
    /**
     * @function initUplink
     * @description Handles the secure transmission of feedback data to the backend.
     */
    function initUplink() {
        const form = document.getElementById('eia-feedback-form');
        const submitBtn = document.getElementById('submit-btn');
        const successMsg = document.getElementById('success-message');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email-input');
            const emailValue = emailInput ? emailInput.value.toLowerCase().trim() : 'anonymous';
            
            // Security Check
            if (localStorage.getItem('eia_lock_' + emailValue)) {
                triggerError("UPLINK DENIED: ADDRESS PREVIOUSLY LOGGED.");
                return;
            }

            // Transmission UI State
            STATE.isTransmitting = true;
            if (submitBtn) {
                submitBtn.innerText = "TRANSMITTING...";
                submitBtn.disabled = true;
            }

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    handleSuccess(form, successMsg, emailValue);
                } else {
                    throw new Error("Link Failed");
                }
            } catch (err) {
                triggerError("SYSTEM ERROR: UPLINK INTERRUPTED.");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "RETRY TRANSMISSION";
                }
            }
        });
    }

    function handleSuccess(form, msg, email) {
        form.reset();
        form.style.display = 'none';
        if (msg) {
            msg.innerText = "UPLINK SUCCESSFUL: DATA STORED";
            msg.style.display = 'block';
        }
        
        localStorage.setItem('eia_lock_' + email, 'true');

        setTimeout(() => {
            if (msg) msg.style.display = 'none';
            form.style.display = 'block';
            const btn = document.getElementById('submit-btn');
            if (btn) {
                btn.innerText = "TRANSMIT DATA";
                btn.disabled = false;
            }
            STATE.isTransmitting = false;
        }, CONFIG.SUBMIT_TIMEOUT);
    }

    function triggerError(text) {
        console.error(`[EIA ERROR]: ${text}`);
        alert(text);
    }

    // --- 9. EVENT REGISTRATION ---
    function registerEvents() {
        window.addEventListener('scroll', () => {
            requestAnimationFrame(updateInterface);
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateInterface();
        });

        // Diagnostic Init Log
        console.log("Interface Uplink Active. Diagnostic sequence complete.");
    }

    // --- 10. PUBLIC BOOT SEQUENCE ---
    return {
        init: function() {
            if (STATE.isInitialized) return;
            
            bakeTargets();
            registerEvents();
            initUplink();
            updateInterface();
            render();
            
            STATE.isInitialized = true;
        }
    };

})();

// START ENGINE
document.addEventListener('DOMContentLoaded', EIACore.init);