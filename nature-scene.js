const home = document.body.classList.contains('cinematic-home');
if (!home) {
  // This module is loaded only by the homepage, but keep it harmless if reused.
} else {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const saveData = navigator.connection?.saveData === true;

  // Intro text enters as one cinematic beat.
  requestAnimationFrame(() => {
    document.querySelectorAll('.cinematic-reveal').forEach((el, index) => {
      window.setTimeout(() => el.classList.add('visible'), 120 + index * 115);
    });
  });

  const chapters = [...document.querySelectorAll('.story-chapter')];
  const progressBar = document.getElementById('story-progress');
  const progressIndex = document.getElementById('story-index');

  let scrollProgress = 0;
  const updateStoryProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));
    if (progressBar) progressBar.style.height = `${scrollProgress * 100}%`;
    if (progressIndex) {
      const idx = Math.min(chapters.length, Math.floor(scrollProgress * chapters.length) + 1);
      progressIndex.textContent = String(idx).padStart(2, '0');
    }
  };
  updateStoryProgress();
  window.addEventListener('scroll', updateStoryProgress, { passive: true });

  // Cursor follower: informative rather than decorative.
  if (!coarsePointer && !reduceMotion) {
    const cursor = document.querySelector('.cursor-orbit');
    const cursorText = cursor?.querySelector('.cursor-text');
    let targetX = innerWidth / 2;
    let targetY = innerHeight / 2;
    let cursorX = targetX;
    let cursorY = targetY;

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });

    document.querySelectorAll('[data-cursor], a, button').forEach((element) => {
      element.addEventListener('pointerenter', () => {
        cursor?.classList.add('active');
        if (cursorText) cursorText.textContent = element.dataset.cursor || 'OPEN';
      });
      element.addEventListener('pointerleave', () => cursor?.classList.remove('active'));
    });

    const animateCursor = () => {
      cursorX += (targetX - cursorX) * 0.16;
      cursorY += (targetY - cursorY) * 0.16;
      if (cursor) cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();
  }

  // Small physical response on important controls.
  if (!coarsePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        button.style.transform = `translate3d(${dx * 0.10}px,${dy * 0.12}px,0)`;
      });
      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });

    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const rx = ((event.clientY - rect.top) / rect.height - 0.5) * -4;
        const ry = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  if (!reduceMotion && !saveData) {
    startNatureScene();
  }

  async function startNatureScene() {
    const canvas = document.getElementById('nature-canvas');
    if (!canvas) return;

    let THREE;
    try {
      THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
    } catch (error) {
      console.warn('3D scene unavailable; using CSS nature fallback.', error);
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !coarsePointer,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (error) {
      console.warn('WebGL unavailable; using CSS nature fallback.', error);
      return;
    }

    const mobile = window.innerWidth < 760;
    const quality = mobile ? 0.58 : 1;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.65));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b2118, mobile ? 0.028 : 0.021);

    const camera = new THREE.PerspectiveCamera(51, innerWidth / innerHeight, 0.1, 160);
    camera.position.set(0, 5.2, 15);

    const hemi = new THREE.HemisphereLight(0xbfded1, 0x14230f, 1.6);
    scene.add(hemi);

    const sunLight = new THREE.DirectionalLight(0xffd79a, 2.2);
    sunLight.position.set(10, 16, -18);
    scene.add(sunLight);

    const fill = new THREE.DirectionalLight(0x72b799, 0.75);
    fill.position.set(-12, 7, 8);
    scene.add(fill);

    const seededRandom = (() => {
      let seed = 17491;
      return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    })();

    const terrainHeight = (x, z) => {
      const valley = Math.pow(Math.abs(x) / 28, 1.45) * 6.1;
      const wave = Math.sin(x * 0.26 + z * 0.08) * 0.46 + Math.cos(z * 0.18) * 0.34;
      const farRise = Math.max(0, (-z - 8) * 0.032);
      return valley + wave + farRise - 1.2;
    };

    const segmentsX = mobile ? 30 : 48;
    const segmentsZ = mobile ? 36 : 58;
    const terrainGeo = new THREE.PlaneGeometry(64, 84, segmentsX, segmentsZ);
    terrainGeo.rotateX(-Math.PI / 2);

    const positions = terrainGeo.attributes.position;
    const colors = [];
    const low = new THREE.Color(0x173824);
    const mid = new THREE.Color(0x315f35);
    const high = new THREE.Color(0x657344);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = terrainHeight(x, z);
      positions.setY(i, y);
      const t = Math.min(1, Math.max(0, (y + 1.2) / 7));
      const color = t < 0.55
        ? low.clone().lerp(mid, t / 0.55)
        : mid.clone().lerp(high, (t - 0.55) / 0.45);
      colors.push(color.r, color.g, color.b);
    }
    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrain = new THREE.Mesh(
      terrainGeo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        metalness: 0,
        flatShading: true
      })
    );
    terrain.position.z = -9;
    scene.add(terrain);

    // River / reflective path through the valley.
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(5.3, 74, 1, 1),
      new THREE.MeshPhysicalMaterial({
        color: 0x4c9b91,
        transparent: true,
        opacity: 0.34,
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.65,
        clearcoatRoughness: 0.22,
        side: THREE.DoubleSide
      })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -0.85, -10);
    scene.add(river);

    // Low-poly sun.
    const sun = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 2),
      new THREE.MeshBasicMaterial({ color: 0xffd990 })
    );
    sun.position.set(12.5, 11.5, -34);
    scene.add(sun);

    // Tree instances keep draw calls low.
    const treeCount = mobile ? 20 : 46;
    const coneGeo = new THREE.ConeGeometry(0.55, 2.7, 6);
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.13, 1, 5);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x244d2b, roughness: 1, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x65462e, roughness: 1, flatShading: true });
    const crowns = new THREE.InstancedMesh(coneGeo, coneMat, treeCount);
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      let x = (seededRandom() - 0.5) * 50;
      if (Math.abs(x) < 4.5) x += x < 0 ? -5.5 : 5.5;
      const z = (seededRandom() - 0.5) * 66 - 8;
      const scale = 0.65 + seededRandom() * 1.35;
      const y = terrainHeight(x, z + 9);

      dummy.position.set(x, y + 1.35 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = seededRandom() * Math.PI;
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 0.45 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
    }
    crowns.instanceMatrix.needsUpdate = true;
    trunks.instanceMatrix.needsUpdate = true;
    scene.add(crowns, trunks);

    // Fireflies / pollen.
    const particleCount = Math.floor((mobile ? 110 : 260) * quality);
    const particlePositions = new Float32Array(particleCount * 3);
    const particlePhase = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (seededRandom() - 0.5) * 34;
      particlePositions[i * 3 + 1] = 0.4 + seededRandom() * 8;
      particlePositions[i * 3 + 2] = (seededRandom() - 0.5) * 54 - 4;
      particlePhase[i] = seededRandom() * Math.PI * 2;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particlesGeo,
      new THREE.PointsMaterial({
        color: 0xe6f6a8,
        size: mobile ? 0.08 : 0.10,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
        depthWrite: false
      })
    );
    scene.add(particles);

    // Slightly brighter floating spores close to camera.
    const sporeCount = mobile ? 30 : 70;
    const sporesArray = new Float32Array(sporeCount * 3);
    for (let i = 0; i < sporeCount; i++) {
      sporesArray[i * 3] = (seededRandom() - 0.5) * 18;
      sporesArray[i * 3 + 1] = 1 + seededRandom() * 10;
      sporesArray[i * 3 + 2] = (seededRandom() - 0.5) * 34 + 6;
    }
    const sporesGeo = new THREE.BufferGeometry();
    sporesGeo.setAttribute('position', new THREE.BufferAttribute(sporesArray, 3));
    const spores = new THREE.Points(
      sporesGeo,
      new THREE.PointsMaterial({
        color: 0xffe5aa,
        size: mobile ? 0.045 : 0.06,
        transparent: true,
        opacity: 0.48,
        depthWrite: false
      })
    );
    scene.add(spores);

    const mouse = { x: 0, y: 0 };
    if (!coarsePointer) {
      window.addEventListener('pointermove', (event) => {
        mouse.x = event.clientX / innerWidth - 0.5;
        mouse.y = event.clientY / innerHeight - 0.5;
      }, { passive: true });
    }

    const cameraAnchors = [
      { x: 0, y: 5.2, z: 15 },
      { x: -1.6, y: 4.6, z: 7 },
      { x: 3.6, y: 3.8, z: -2 },
      { x: -3.8, y: 3.5, z: -12 },
      { x: 3.2, y: 4.0, z: -22 },
      { x: -2.6, y: 4.6, z: -31 },
      { x: 1.2, y: 5.0, z: -39 },
      { x: 0, y: 6.0, z: -47 }
    ];

    const lerp = (a, b, t) => a + (b - a) * t;
    let smoothProgress = scrollProgress;
    let last = performance.now();

    const render = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      smoothProgress += (scrollProgress - smoothProgress) * Math.min(1, dt * 4.8);

      const scaled = smoothProgress * (cameraAnchors.length - 1);
      const index = Math.min(cameraAnchors.length - 2, Math.floor(scaled));
      const local = scaled - index;
      const eased = local * local * (3 - 2 * local);
      const a = cameraAnchors[index];
      const b = cameraAnchors[index + 1];

      const baseX = lerp(a.x, b.x, eased);
      const baseY = lerp(a.y, b.y, eased);
      const baseZ = lerp(a.z, b.z, eased);

      camera.position.x += (baseX + mouse.x * 1.25 - camera.position.x) * 0.055;
      camera.position.y += (baseY - mouse.y * 0.55 - camera.position.y) * 0.055;
      camera.position.z += (baseZ - camera.position.z) * 0.055;

      const lookX = mouse.x * 0.9;
      const lookY = 1.1 - mouse.y * 0.28;
      camera.lookAt(lookX, lookY, camera.position.z - 13);

      const p = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        p[i * 3 + 1] += Math.sin(now * 0.0014 + particlePhase[i]) * 0.0009;
        p[i * 3] += Math.cos(now * 0.0008 + particlePhase[i]) * 0.00035;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = now * 0.000025;
      spores.rotation.y = -now * 0.00004;
      spores.position.y = Math.sin(now * 0.0002) * 0.28;

      // The valley changes from dawn green to deeper forest as the story progresses.
      const daylight = 1 - smoothProgress * 0.38;
      sunLight.intensity = 1.25 + daylight * 0.95;
      hemi.intensity = 0.95 + daylight * 0.7;
      scene.fog.density = (mobile ? 0.028 : 0.021) + smoothProgress * 0.006;

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const resize = () => {
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.65));
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize, { passive: true });
  }
}
