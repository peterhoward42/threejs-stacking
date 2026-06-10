import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 12,
  title: 'InstancedMesh at scale',
  description:
    'Thousands of identical meshes via `InstancedMesh` with per-instance `setMatrixAt` / `setColorAt`. Toggle naive cloning to contrast draw calls and frame time.',
};

const PLACEMENT_MODES = [
  { id: 'grid', label: 'Grid on plane' },
  { id: 'scatter', label: 'Scatter on surface' },
];

const RENDER_MODES = [
  { id: 'instanced', label: 'InstancedMesh (1 draw call)' },
  { id: 'cloned', label: 'Naive clones (N draw calls)' },
];

const CLONED_COUNT_CAP = 2500;
const INSTANCED_COUNT_MAX = 10000;

function surfaceHeight(x, z) {
  return (
    Math.sin(x * 0.35) * 0.22 +
    Math.cos(z * 0.28) * 0.18 +
    Math.sin((x + z) * 0.18) * 0.12
  );
}

function gridSide(count) {
  return Math.ceil(Math.sqrt(count));
}

function placeInstance(dummy, index, count, placement) {
  if (placement === 'grid') {
    const side = gridSide(count);
    const col = index % side;
    const row = Math.floor(index / side);
    const spacing = 0.42;
    const offset = (side - 1) * spacing * 0.5;
    dummy.position.set(col * spacing - offset, 0.22, row * spacing - offset);
    dummy.rotation.set(0, (index * 0.31) % (Math.PI * 2), 0);
    dummy.scale.setScalar(0.85 + (index % 5) * 0.04);
    return;
  }

  const span = 11;
  const seed = index * 12.9898 + 78.233;
  const randX = (Math.sin(seed) * 43758.5453) % 1;
  const randZ = (Math.sin(seed * 1.73) * 43758.5453) % 1;
  const x = (randX - 0.5) * span;
  const z = (randZ - 0.5) * span;
  const y = surfaceHeight(x, z) + 0.22;

  dummy.position.set(x, y, z);
  dummy.rotation.set(
    (index * 0.17) % (Math.PI * 2),
    (index * 0.41) % (Math.PI * 2),
    (index * 0.09) % (Math.PI * 2),
  );
  const scale = 0.72 + ((index * 7) % 10) * 0.03;
  dummy.scale.setScalar(scale);
}

function instanceHue(index, count) {
  return (index / Math.max(count, 1)) * 0.82 + 0.06;
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18, 48, 48),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  const terrainPositions = floor.geometry.attributes.position;
  for (let i = 0; i < terrainPositions.count; i++) {
    const x = terrainPositions.getX(i);
    const z = terrainPositions.getZ(i);
    terrainPositions.setY(i, surfaceHeight(x, z));
  }
  terrainPositions.needsUpdate = true;
  floor.geometry.computeVertexNormals();

  scene.add(new THREE.GridHelper(16, 32, 0x3a3a4a, 0x252530));

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(5, 9, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
  fill.position.set(-6, 4, -3);
  scene.add(fill);

  const contentRoot = new THREE.Group();
  contentRoot.name = 'instances-root';
  scene.add(contentRoot);

  const sharedGeometry = new THREE.ConeGeometry(0.14, 0.38, 6);
  const sharedMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.48,
    metalness: 0.12,
  });

  return { scene, contentRoot, sharedGeometry, sharedMaterial };
}

function countMeshes(root) {
  let n = 0;
  root.traverse((obj) => {
    if (obj.isMesh) n += 1;
  });
  return n;
}

function disposeContent(root) {
  const materials = new Set();

  root.traverse((obj) => {
    if (obj.isMesh && !obj.isInstancedMesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => materials.add(m));
    }
  });

  materials.forEach((m) => m.dispose());
  root.clear();
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, contentRoot, sharedGeometry, sharedMaterial } = buildScene();

  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 120);
  camera.position.set(7, 6.5, 9);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.5, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.update();

  const clock = new THREE.Clock();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  let renderMode = 'instanced';
  let placement = 'grid';
  let instanceCount = 5000;
  let animateInstances = true;
  let activeContent = null;

  const frameSamples = [];
  let frameMs = 0;
  let fps = 0;

  function effectiveCount() {
    if (renderMode === 'cloned') return Math.min(instanceCount, CLONED_COUNT_CAP);
    return Math.min(instanceCount, INSTANCED_COUNT_MAX);
  }

  function buildContent() {
    disposeContent(contentRoot);

    const count = effectiveCount();
    if (renderMode === 'instanced') {
      const instanced = new THREE.InstancedMesh(sharedGeometry, sharedMaterial, count);
      instanced.name = 'instanced-cones';
      instanced.castShadow = true;
      instanced.receiveShadow = true;

      for (let i = 0; i < count; i++) {
        placeInstance(dummy, i, count, placement);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
        color.setHSL(instanceHue(i, count), 0.58, 0.52);
        instanced.setColorAt(i, color);
      }
      instanced.instanceMatrix.needsUpdate = true;
      if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
      contentRoot.add(instanced);
      activeContent = instanced;
      return;
    }

    const group = new THREE.Group();
    group.name = 'cloned-cones';
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        sharedGeometry,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(instanceHue(i, count), 0.58, 0.52),
          roughness: 0.48,
          metalness: 0.12,
        }),
      );
      placeInstance(dummy, i, count, placement);
      mesh.position.copy(dummy.position);
      mesh.rotation.copy(dummy.rotation);
      mesh.scale.copy(dummy.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    contentRoot.add(group);
    activeContent = group;
  }

  buildContent();

  function pushHud() {
    const count = effectiveCount();
    const info = renderer.info.render;

    onHudUpdate?.({
      renderMode,
      renderModes: RENDER_MODES,
      placement,
      placementModes: PLACEMENT_MODES,
      instanceCount,
      effectiveCount: count,
      clonedCountCap: CLONED_COUNT_CAP,
      instancedCountMax: INSTANCED_COUNT_MAX,
      countCapped: renderMode === 'cloned' && instanceCount > CLONED_COUNT_CAP,
      animateInstances,
      meshCount: countMeshes(contentRoot),
      drawCalls: info.calls,
      triangles: info.triangles,
      points: info.points,
      lines: info.lines,
      frameMs,
      fps,
      activeKind: renderMode === 'instanced' ? 'InstancedMesh' : 'Group of Mesh',
      instanceColorEnabled: activeContent?.isInstancedMesh && Boolean(activeContent.instanceColor),
    });
  }

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

  let frameId;
  function tick() {
    frameId = requestAnimationFrame(tick);
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (animateInstances && activeContent?.isInstancedMesh) {
      const count = effectiveCount();
      for (let i = 0; i < count; i++) {
        activeContent.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        dummy.rotation.y += delta * (0.25 + (i % 7) * 0.04);
        dummy.position.y += Math.sin(elapsed * 1.4 + i * 0.15) * 0.0008;
        dummy.updateMatrix();
        activeContent.setMatrixAt(i, dummy.matrix);
      }
      activeContent.instanceMatrix.needsUpdate = true;
    } else if (animateInstances && activeContent?.isGroup) {
      for (const child of activeContent.children) {
        child.rotation.y += delta * 0.35;
        child.position.y += Math.sin(elapsed * 1.4 + child.id) * 0.0008;
      }
    }

    const frameStart = performance.now();
    controls.update();
    renderer.render(scene, camera);
    const sample = performance.now() - frameStart;
    frameSamples.push(sample);
    if (frameSamples.length > 30) frameSamples.shift();
    frameMs = frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length;
    fps = frameMs > 0 ? 1000 / frameMs : 0;

    pushHud();
  }
  tick();

  function rebuildIfNeeded() {
    buildContent();
    pushHud();
  }

  return {
    setRenderMode(mode) {
      if (mode === renderMode) return;
      if (!RENDER_MODES.some((m) => m.id === mode)) return;
      renderMode = mode;
      rebuildIfNeeded();
    },
    setPlacement(mode) {
      if (mode === placement) return;
      if (!PLACEMENT_MODES.some((m) => m.id === mode)) return;
      placement = mode;
      rebuildIfNeeded();
    },
    setInstanceCount(count) {
      const next = Math.max(100, Math.min(INSTANCED_COUNT_MAX, Math.round(count)));
      if (next === instanceCount) return;
      instanceCount = next;
      rebuildIfNeeded();
    },
    setAnimateInstances(value) {
      if (value === animateInstances) return;
      animateInstances = value;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      disposeContent(contentRoot);
      sharedGeometry.dispose();
      sharedMaterial.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
