/* ============================================
   THREE.JS 3D PARTICLE BACKGROUND
   ============================================ */

(function() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    camera.position.z = 30;

    // Mouse tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // --- Create Particles ---
    const particleCount = 80;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 1] = (Math.random() - 0.5) * 80;
        positions[i3 + 2] = (Math.random() - 0.5) * 50;
        sizes[i] = Math.random() * 3 + 1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom particle material with glow
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.8,
        sizeAttenuation: true,
        color: 0x00f5ff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Create secondary particles ---
    const particleCount2 = 40;
    const particleGeometry2 = new THREE.BufferGeometry();
    const positions2 = new Float32Array(particleCount2 * 3);

    for (let i = 0; i < particleCount2; i++) {
        const i3 = i * 3;
        positions2[i3] = (Math.random() - 0.5) * 100;
        positions2[i3 + 1] = (Math.random() - 0.5) * 100;
        positions2[i3 + 2] = (Math.random() - 0.5) * 60;
    }

    particleGeometry2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));

    const particleMaterial2 = new THREE.PointsMaterial({
        size: 0.6,
        sizeAttenuation: true,
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const particles2 = new THREE.Points(particleGeometry2, particleMaterial2);
    scene.add(particles2);

    // --- Create floating geometric shapes ---
    const shapes = [];
    const shapeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00f5ff,
        transparent: true,
        opacity: 0.04,
        wireframe: true,
    });

    const shapeMaterial2 = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.03,
        wireframe: true,
    });

    // Icosahedrons
    for (let i = 0; i < 4; i++) {
        const geo = new THREE.IcosahedronGeometry(Math.random() * 3 + 1.5, 1);
        const mat = i % 2 === 0 ? shapeMaterial : shapeMaterial2;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 30 - 10
        );
        mesh.userData = {
            rotSpeed: { x: Math.random() * 0.003, y: Math.random() * 0.003 },
            floatSpeed: Math.random() * 0.5 + 0.3,
            floatAmplitude: Math.random() * 2 + 1,
            initialY: mesh.position.y
        };
        shapes.push(mesh);
        scene.add(mesh);
    }

    // Octahedrons
    for (let i = 0; i < 3; i++) {
        const geo = new THREE.OctahedronGeometry(Math.random() * 2 + 1, 0);
        const mat = i % 2 === 0 ? shapeMaterial2 : shapeMaterial;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 70,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30 - 10
        );
        mesh.userData = {
            rotSpeed: { x: Math.random() * 0.004, y: Math.random() * 0.004 },
            floatSpeed: Math.random() * 0.4 + 0.2,
            floatAmplitude: Math.random() * 3 + 1,
            initialY: mesh.position.y
        };
        shapes.push(mesh);
        scene.add(mesh);
    }

    // Torus
    for (let i = 0; i < 2; i++) {
        const geo = new THREE.TorusGeometry(Math.random() * 2 + 1.5, 0.3, 8, 16);
        const mat = i === 0 ? shapeMaterial : shapeMaterial2;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 20 - 10
        );
        mesh.userData = {
            rotSpeed: { x: Math.random() * 0.005, y: Math.random() * 0.003 },
            floatSpeed: Math.random() * 0.3 + 0.2,
            floatAmplitude: Math.random() * 2 + 0.5,
            initialY: mesh.position.y
        };
        shapes.push(mesh);
        scene.add(mesh);
    }

    // --- Connection Lines ---
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00f5ff,
        transparent: true,
        opacity: 0.025,
        blending: THREE.AdditiveBlending,
    });

    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    function updateConnections() {
        // Remove all old lines
        while (lineGroup.children.length > 0) {
            const child = lineGroup.children[0];
            child.geometry.dispose();
            lineGroup.remove(child);
        }

        const posArray = particles.geometry.attributes.position.array;
        const maxDist = 18;
        const maxLines = 40;
        let lineCount = 0;

        for (let i = 0; i < particleCount && lineCount < maxLines; i++) {
            for (let j = i + 1; j < particleCount && lineCount < maxLines; j++) {
                const dx = posArray[i * 3] - posArray[j * 3];
                const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < maxDist) {
                    const lineGeo = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]),
                        new THREE.Vector3(posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2])
                    ]);
                    const line = new THREE.Line(lineGeo, lineMaterial);
                    lineGroup.add(line);
                    lineCount++;
                }
            }
        }
    }

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let connectionTimer = 0;

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Smooth mouse follow
        mouse.targetX += (mouse.x - mouse.targetX) * 0.05;
        mouse.targetY += (mouse.y - mouse.targetY) * 0.05;

        // Rotate particles
        particles.rotation.y = elapsed * 0.03 + mouse.targetX * 0.1;
        particles.rotation.x = elapsed * 0.02 + mouse.targetY * 0.05;

        particles2.rotation.y = elapsed * 0.02 - mouse.targetX * 0.05;
        particles2.rotation.x = elapsed * 0.015 + mouse.targetY * 0.03;

        // Animate geometric shapes
        shapes.forEach(shape => {
            shape.rotation.x += shape.userData.rotSpeed.x;
            shape.rotation.y += shape.userData.rotSpeed.y;
            shape.position.y = shape.userData.initialY +
                Math.sin(elapsed * shape.userData.floatSpeed) * shape.userData.floatAmplitude;
        });

        // Update connections periodically
        connectionTimer += 0.016;
        if (connectionTimer > 0.5) {
            updateConnections();
            connectionTimer = 0;
        }

        // Camera subtle movement
        camera.position.x += (mouse.targetX * 2 - camera.position.x) * 0.02;
        camera.position.y += (mouse.targetY * 2 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate();

    // --- Events ---
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
