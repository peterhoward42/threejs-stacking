import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 9,
  title: 'OrbitControls and the render loop',
  description:
    '`requestAnimationFrame` with `Clock` delta drives simulation; `OrbitControls` handles orbit, zoom, and pan with damping. Resize updates camera and renderer — the pattern reused in later steps.',
};

const RING_COLORS = [0xf5c542, 0x42c9f5, 0xf542c9, 0x7af542, 0xc97af5, 0xff8844];

function vec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x252530));

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 1.2, 24),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f8, roughness: 0.3, metalness: 0.15 }),
  );
  hub.position.y = 0.6;
  hub.castShadow = true;
  scene.add(hub);

  const simulation = new THREE.Group();
  simulation.name = 'simulation';

  for (let ring = 0; ring < 3; ring++) {
    const ringGroup = new THREE.Group();
    ringGroup.name = `ring-${ring + 1}`;
    const radius = 1.4 + ring * 0.85;
    const count = 4 + ring * 2;
    const speed = 0.35 + ring * 0.22;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.28, 0.28),
        new THREE.MeshStandardMaterial({
          color: RING_COLORS[(ring * 2 + i) % RING_COLORS.length],
          roughness: 0.4,
          metalness: 0.1,
        }),
      );
      mesh.position.set(Math.cos(angle) * radius, 0.55 + ring * 0.18, Math.sin(angle) * radius);
      mesh.castShadow = true;
      mesh.userData.spin = 0.8 + i * 0.15;
      ringGroup.add(mesh);
    }

    ringGroup.userData.orbitSpeed = speed;
    simulation.add(ringGroup);
  }

  scene.add(simulation);

  scene.add(new THREE.AmbientLight(0xffffff, 0.42));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaccff, 0.35);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  return { scene, simulation };
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, simulation } = buildScene();

  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  camera.position.set(5.5, 3.8, 6.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 2;
  controls.maxDistance = 18;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.update();

  const targetMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff6688, transparent: true, opacity: 0.85 }),
  );
  targetMarker.name = 'orbit-target';
  scene.add(targetMarker);

  const clock = new THREE.Clock();
  let frameId;
  let elapsed = 0;
  let smoothedFps = 60;

  let enableDamping = controls.enableDamping;
  let dampingFactor = controls.dampingFactor;
  let minDistance = controls.minDistance;
  let maxDistance = controls.maxDistance;
  let enablePan = controls.enablePan;
  let enableZoom = controls.enableZoom;
  let enableRotate = controls.enableRotate;
  let targetY = controls.target.y;
  let simulationPaused = false;

  function applyControlSettings() {
    controls.enableDamping = enableDamping;
    controls.dampingFactor = dampingFactor;
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.enablePan = enablePan;
    controls.enableZoom = enableZoom;
    controls.enableRotate = enableRotate;
    controls.target.y = targetY;
    targetMarker.position.copy(controls.target);
  }

  function pushHud(delta) {
    const distance = camera.position.distanceTo(controls.target);
    smoothedFps = smoothedFps * 0.9 + (delta > 0 ? 1 / delta : 60) * 0.1;

    onHudUpdate?.({
      delta,
      elapsed,
      fps: smoothedFps,
      simulationPaused,
      enableDamping,
      dampingFactor,
      minDistance,
      maxDistance,
      enablePan,
      enableZoom,
      enableRotate,
      targetY,
      camera: {
        position: vec3(camera.position),
        distance,
      },
      target: vec3(controls.target),
    });
  }

  // Reusable resize pattern: read container size, update camera projection, sync renderer.
  function resize() {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function updateSimulation(delta) {
    if (simulationPaused) return;

    simulation.children.forEach((ring) => {
      ring.rotation.y += delta * ring.userData.orbitSpeed;
      ring.children.forEach((mesh) => {
        mesh.rotation.x += delta * mesh.userData.spin;
        mesh.rotation.z += delta * mesh.userData.spin * 0.6;
      });
    });
  }

  function render() {
    renderer.render(scene, camera);
  }

  function tick() {
    frameId = requestAnimationFrame(tick);

    const delta = clock.getDelta();
    elapsed += delta;

    controls.update();
    updateSimulation(delta);
    targetMarker.position.copy(controls.target);
    pushHud(delta);
    render();
  }
  tick();

  return {
    setEnableDamping(value) {
      if (value === enableDamping) return;
      enableDamping = value;
      applyControlSettings();
    },
    setDampingFactor(value) {
      if (value === dampingFactor) return;
      dampingFactor = value;
      applyControlSettings();
    },
    setMinDistance(value) {
      if (value === minDistance) return;
      minDistance = value;
      applyControlSettings();
    },
    setMaxDistance(value) {
      if (value === maxDistance) return;
      maxDistance = value;
      applyControlSettings();
    },
    setEnablePan(value) {
      if (value === enablePan) return;
      enablePan = value;
      applyControlSettings();
    },
    setEnableZoom(value) {
      if (value === enableZoom) return;
      enableZoom = value;
      applyControlSettings();
    },
    setEnableRotate(value) {
      if (value === enableRotate) return;
      enableRotate = value;
      applyControlSettings();
    },
    setTargetY(value) {
      if (value === targetY) return;
      targetY = value;
      applyControlSettings();
    },
    setSimulationPaused(value) {
      simulationPaused = value;
    },
    resetView() {
      camera.position.set(5.5, 3.8, 6.5);
      controls.target.set(0, 0.55, 0);
      targetY = controls.target.y;
      controls.update();
      applyControlSettings();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      const geometries = new Set();
      const materials = new Set();
      scene.traverse((obj) => {
        if (obj.geometry) geometries.add(obj.geometry);
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => materials.add(m));
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
