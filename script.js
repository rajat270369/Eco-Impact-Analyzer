/* ================================================================
    ECO IMPACT ANALYZER - CORE ENGINE
    VERSION: 1.4.8 - STABILIZED PRODUCTION
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

    const targets = {
        core: new Float32Array(STATE.vertexCount * 3),
        torus: new Float32Array(STATE.vertexCount * 3),
        prism: new Float32Array(STATE.vertexCount * 3),
        frame: new Float32Array(STATE.vertexCount * 3)
    };

    // --- 4. THE BAKE PIPELINE (VERTEX MATH) ---
    function bakeTargets() {
        const knotBake = new THREE.TorusKnotGeometry(7, 2.2, 100, 16); 
        const knotPos = knotBake.attributes.position.array;
        const knotVertCount = knotBake.attributes.position.count;

        for (let i = 0; i < STATE.vertexCount; i++) {
            let x = originalPositions[i * 3];
            let y = originalPositions[i * 3 + 1];
            let z = originalPositions[i * 3 + 2];
            const epsilon = 0.0001;

            // Target 1: EIA CORE
            let octaFactor = 14.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + epsilon);
            targets.core[i * 3] = x * octaFactor;
            targets.core[i * 3 + 1] = y * octaFactor;
            targets.core[i * 3 + 2] = z * octaFactor;

            // Target 2: TECH STACK
            let kIdx = (i % knotVertCount) * 3;
            targets.torus[i * 3] = knotPos[kIdx] * 1.8;
            targets.torus[i * 3 + 1] = knotPos[kIdx + 1] * 1.8;
            targets.torus[i * 3 + 2] = knotPos[kIdx + 2] * 1.8;

            // Target 3: DATA PRISM
            let mag = Math.sqrt(x*x + y*y + z*z) + epsilon;
            targets.prism[i * 3] = (x / mag) * 8;   
            targets.prism[i * 3 + 1] = (y / mag) * 22.4; 
            targets.prism[i * 3 + 2] = (z / mag) * 8;

            // Target 4: STABILIZED FEEDBACK FRAME
            if (i < STATE.vertexCount * 0.4) {
                const side = i % 4;
                const progress = ((i / 4) / (STATE.vertexCount * 0.1)) * 2 - 1; 
                
                if (side === 0) { // Right
                    targets.frame[i*3] = CONFIG.FRAME_WIDTH;  
                    targets.frame[i*3+1] = progress * CONFIG.FRAME_HEIGHT; 
                } else if (side === 1) { // Left
                    targets.frame[i*3] = -CONFIG.FRAME_WIDTH; 
                    targets.frame[i*3+1] = progress * CONFIG.FRAME_HEIGHT; 
                } else if (side === 2) { // Top
                    targets.frame[i*3] = progress * CONFIG.FRAME_WIDTH; 
                    targets.frame[i*3+1] = CONFIG.FRAME_HEIGHT;  
                } else if (side === 3) { // Bottom
                    targets.frame[i*3] = progress * CONFIG.FRAME_WIDTH; 
                    targets.frame[i*3+1] = -CONFIG.FRAME_HEIGHT; 
                }
                targets.frame[i*3+2] = -5;
            } else {
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

    // --- 6. INTERFACE ENGINE (RECALIBRATED SCROLL) ---
    function updateInterface() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const rawPercent = window.scrollY / scrollHeight;
        const scrollPercent = Math.min(Math.max(rawPercent, 0), 1);
        
        STATE.lastScrollPercent = scrollPercent;
        camera.position.z = CONFIG.CAMERA_Z_START + (scrollPercent * 15); 

        // UPDATED: Stabilized Morph Windows
        if (scrollPercent <= 0.20) {
            let f = (scrollPercent / 0.20);
            lerpVertices(originalPositions, targets.core, f);
        } else if (scrollPercent <= 0.45) {
            let f = ((scrollPercent - 0.20) / 0.25);
            lerpVertices(targets.core, targets.torus, f);
        } else if (scrollPercent <= 0.70) {
            let f = ((scrollPercent - 0.45) / 0.25);
            lerpVertices(targets.torus, targets.prism, f);
        } else {
            let f = ((scrollPercent - 0.70) / 0.30);
            lerpVertices(targets.prism, targets.frame, f);
        }
        
        geometry.attributes.position.needsUpdate = true;
    }

    function lerpVertices(startArr, endArr, factor) {
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < STATE.vertexCount * 3; i++) {
            positions[i] = startArr[i] + (endArr[i] - startArr[i]) * factor;
        }
    }

    // --- 7. RENDERING PIPELINE ---
    function render() {
        requestAnimationFrame(render);
        const scroll = STATE.lastScrollPercent;

        if (mainMesh && particleMaterial) {
            // UPDATED: Robust Rotation Lock for Feedback Section
            if (scroll > 0.85) {
                mainMesh.rotation.set(0, 0, 0);
                particles.rotation.set(0, 0, 0);
                
                mainMesh.material.opacity = THREE.MathUtils.lerp(mainMesh.material.opacity, 0.4, CONFIG.LERP_FACTOR_FAST);
                particleMaterial.opacity = THREE.MathUtils.lerp(particleMaterial.opacity, 0.8, CONFIG.LERP_FACTOR_FAST);
            } 
            else {
                mainMesh.material.opacity = THREE.MathUtils.lerp(mainMesh.material.opacity, 0.6, CONFIG.LERP_FACTOR_SMOOTH);
                particleMaterial.opacity = THREE.MathUtils.lerp(particleMaterial.opacity, 0, CONFIG.LERP_FACTOR_SMOOTH);
                
                mainMesh.rotation.y += CONFIG.ANIMATION_SPEED;
                mainMesh.rotation.x += CONFIG.ANIMATION_SPEED * 0.4;
                particles.rotation.y = mainMesh.rotation.y;
                particles.rotation.x = mainMesh.rotation.x;
            }
        }
        renderer.render(scene, camera);
    }

    // --- 8. UPLINK PROTOCOL ---
    function initUplink() {
        const form = document.getElementById('eia-feedback-form');
        const submitBtn = document.getElementById('submit-btn');
        const successMsg = document.getElementById('success-message');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-input');
            const emailValue = emailInput.value.toLowerCase().trim();
            
            if (localStorage.getItem('eia_lock_' + emailValue)) {
                triggerError("UPLINK DENIED: ADDRESS PREVIOUSLY LOGGED.");
                return;
            }

            STATE.isTransmitting = true;
            submitBtn.innerText = "TRANSMITTING...";
            submitBtn.disabled = true;

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
                submitBtn.disabled = false;
                submitBtn.innerText = "RETRY TRANSMISSION";
            }
        });
    }

    function handleSuccess(form, msg, email) {
        form.reset();
        form.style.display = 'none';
        msg.innerText = "UPLINK SUCCESSFUL: DATA STORED";
        msg.style.display = 'block';
        localStorage.setItem('eia_lock_' + email, 'true');

        setTimeout(() => {
            msg.style.display = 'none';
            form.style.display = 'block';
            const btn = document.getElementById('submit-btn');
            btn.innerText = "TRANSMIT DATA";
            btn.disabled = false;
            STATE.isTransmitting = false;
        }, CONFIG.SUBMIT_TIMEOUT);
    }

    function triggerError(text) {
        console.error(`[EIA ERROR]: ${text}`);
        alert(text);
    }

    // --- 9. EVENT REGISTRATION ---
    function registerEvents() {
        window.addEventListener('scroll', () => { requestAnimationFrame(updateInterface); });
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateInterface();
        });
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
            console.log("Interface Uplink Active. Diagnostic sequence complete.");
        }
    };
})();

document.addEventListener('DOMContentLoaded', EIACore.init);