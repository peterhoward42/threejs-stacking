import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 22,
  title: 'Clipping, fog, and scene atmosphere',
  description:
    '`renderer.clippingPlanes` and per-material `clipIntersection` for sectional views. Linear `Fog` and exponential `FogExp2` for depth cueing without post-processing.',
};

const FOG_MODES = [
  { id: 'none', label: 'None' },
  { id: 'linear', label: 'Fog (linear)' },
  { id: 'exp2', label: 'FogExp2 (exponential)' },
];

const FOG_COLOR = 0x1a1a28;

const BUILDING_FLOORS = [
  { y: 0.45, w: 3.2, d: 2.4, h: 0.9, color: 0x5a6a88 },
  { y: 1.35, w: 2.8, d: 2.1, h: 0.9, color: 0x6a7a98 },
  { y: 2.25, w: 2.4, d: 1.8, h: 0.9, color: 0x7a8aa8 },
  { y: 3.15, w: 2.0, d: 1.5, h: 0.85, color: 0x8a9ab8 },
];

const PILLAR_COUNT = 14;
const PILLAR_SPAN = 28;

function createClipMaterial(color, roughness = 0.48) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.12,
    flatShading: false,
  });
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_COLOR);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 22),
    createClipMaterial(0x181820, 0.92),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(32, 64, 0x3a3a4a, 0x252530));

  scene.add(new THREE.AmbientLight(0x404060, 0.42));

  const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
  key.position.set(7, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -16;
  key.shadow.camera.right = 16;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  scene.add(key);

  const fill = new THREE.PointLight(0x6688ff, 0.38, 22);
  fill.position.set(-6, 4, 2);
  scene.add(fill);

  const building = new THREE.Group();
  building.name = 'building';
  building.position.set(-4, 0, 1);
  scene.add(building);

  const clipMeshes = [];
  for (const spec of BUILDING_FLOORS) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(spec.w, spec.h, spec.d),
      createClipMaterial(spec.color),
    );
    mesh.position.y = spec.y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `floor-${spec.y}`;
    building.add(mesh);
    clipMeshes.push(mesh);
  }

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 3.6, 16),
    createClipMaterial(0xf5c542, 0.35),
  );
  core.position.set(0, 1.8, 0);
  core.castShadow = true;
  building.add(core);
  clipMeshes.push(core);

  const pillarGeometry = new THREE.CylinderGeometry(0.22, 0.28, 2.4, 10);
  const pillars = [];
  for (let i = 0; i < PILLAR_COUNT; i++) {
    const t = i / (PILLAR_COUNT - 1);
    const mesh = new THREE.Mesh(
      pillarGeometry,
      createClipMaterial(new THREE.Color().setHSL(0.58 - t * 0.12, 0.55, 0.52)),
    );
    mesh.position.set(4 + (t - 0.5) * 2.5, 1.2, -4 - t * PILLAR_SPAN);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `pillar-${i}`;
    scene.add(mesh);
    pillars.push(mesh);
    clipMeshes.push(mesh);
  }

  const markers = [
    { position: [2, 0.4, -6], color: 0x42c9f5 },
    { position: [5, 0.4, -12], color: 0xf5427a },
    { position: [3, 0.4, -20], color: 0x9b6bff },
  ];
  for (const spec of markers) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 20, 14),
      createClipMaterial(spec.color, 0.32),
    );
    mesh.position.set(...spec.position);
    mesh.castShadow = true;
    scene.add(mesh);
    clipMeshes.push(mesh);
  }

  return { scene, building, clipMeshes, pillarGeometry };
}

function applyFog(scene, mode, { near, far, density }) {
  if (mode === 'linear') {
    scene.fog = new THREE.Fog(FOG_COLOR, near, far);
    return;
  }
  if (mode === 'exp2') {
    scene.fog = new THREE.FogExp2(FOG_COLOR, density);
    return;
  }
  scene.fog = null;
}

function fogReadout(scene) {
  const fog = scene.fog;
  if (!fog) {
    return { active: false, type: 'none' };
  }
  if (fog.isFogExp2) {
    return {
      active: true,
      type: 'exp2',
      density: fog.density,
      color: `#${fog.color.getHexString()}`,
    };
  }
  return {
    active: true,
    type: 'linear',
    near: fog.near,
    far: fog.far,
    color: `#${fog.color.getHexString()}`,
  };
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, clipMeshes, pillarGeometry } = buildScene();

  const clipPlaneA = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.8);
  const clipPlaneB = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0.5);

  const helperA = new THREE.PlaneHelper(clipPlaneA, 9, 0x42c9f5);
  const helperB = new THREE.PlaneHelper(clipPlaneB, 9, 0xf5427a);
  helperA.visible = true;
  helperB.visible = false;
  scene.add(helperA, helperB);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  camera.position.set(6, 4.5, 14);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-1, 1.4, -6);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 4;
  controls.maxDistance = 42;
  controls.update();

  let clippingEnabled = true;
  let useSecondPlane = false;
  let clipIntersection = false;
  let showClipHelpers = true;
  let clipPlaneAOffset = 1.8;
  let clipPlaneBOffset = 0.5;

  let fogMode = 'linear';
  let fogNear = 8;
  let fogFar = 38;
  let fogDensity = 0.028;

  function syncClipPlanes() {
    clipPlaneA.constant = clipPlaneAOffset;
    clipPlaneB.constant = clipPlaneBOffset;
    helperA.visible = showClipHelpers && clippingEnabled;
    helperB.visible = showClipHelpers && clippingEnabled && useSecondPlane;
  }

  function applyClipping() {
    syncClipPlanes();

    const planes = [];
    if (clippingEnabled) {
      planes.push(clipPlaneA);
      if (useSecondPlane) planes.push(clipPlaneB);
    }

    renderer.localClippingEnabled = planes.length > 0;
    renderer.clippingPlanes = planes;

    for (const mesh of clipMeshes) {
      const mat = mesh.material;
      mat.clippingPlanes = planes;
      mat.clipIntersection = clipIntersection && planes.length > 1;
      mat.clipShadows = clippingEnabled;
      mat.needsUpdate = true;
    }
  }

  function applyFogSettings() {
    applyFog(scene, fogMode, { near: fogNear, far: fogFar, density: fogDensity });
  }

  function pushHud() {
    const planes = [];
    if (clippingEnabled) {
      planes.push({
        id: 'a',
        label: 'Horizontal (normal 0, −1, 0)',
        constant: clipPlaneA.constant,
        helperVisible: helperA.visible,
      });
      if (useSecondPlane) {
        planes.push({
          id: 'b',
          label: 'Vertical (normal 1, 0, 0)',
          constant: clipPlaneB.constant,
          helperVisible: helperB.visible,
        });
      }
    }

    onHudUpdate?.({
      fogModes: FOG_MODES,
      fogMode,
      fogNear,
      fogFar,
      fogDensity,
      fogReadout: fogReadout(scene),
      clippingEnabled,
      useSecondPlane,
      clipIntersection,
      showClipHelpers,
      clipPlaneAOffset,
      clipPlaneBOffset,
      clipPlanes: planes,
      localClippingEnabled: renderer.localClippingEnabled,
      rendererClipPlaneCount: renderer.clippingPlanes.length,
      notes: [
        {
          id: 'local',
          label: 'renderer.localClippingEnabled',
          when: 'Must be true for material `clippingPlanes` (and global `renderer.clippingPlanes`) to take effect.',
        },
        {
          id: 'material',
          label: 'material.clippingPlanes',
          when: 'Per-mesh planes; here synced from the same array as `renderer.clippingPlanes`.',
        },
        {
          id: 'intersect',
          label: 'material.clipIntersection',
          when: 'With two planes: false keeps the union (either side), true keeps only the intersection wedge.',
        },
        {
          id: 'fog-linear',
          label: 'THREE.Fog(color, near, far)',
          when: 'Opacity ramps linearly between near and far distances from the camera.',
        },
        {
          id: 'fog-exp',
          label: 'THREE.FogExp2(color, density)',
          when: 'Exponential squared falloff — denser scenes use smaller density values.',
        },
      ],
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

  applyFogSettings();
  applyClipping();

  const clock = new THREE.Clock();
  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    clock.getDelta();
    controls.update();
    renderer.render(scene, camera);
    pushHud();
  }

  tick();
  pushHud();

  return {
    setClippingEnabled(value) {
      if (clippingEnabled === value) return;
      clippingEnabled = value;
      applyClipping();
      pushHud();
    },
    setUseSecondPlane(value) {
      if (useSecondPlane === value) return;
      useSecondPlane = value;
      applyClipping();
      pushHud();
    },
    setClipIntersection(value) {
      if (clipIntersection === value) return;
      clipIntersection = value;
      applyClipping();
      pushHud();
    },
    setShowClipHelpers(value) {
      if (showClipHelpers === value) return;
      showClipHelpers = value;
      syncClipPlanes();
      pushHud();
    },
    setClipPlaneAOffset(value) {
      if (clipPlaneAOffset === value) return;
      clipPlaneAOffset = value;
      applyClipping();
      pushHud();
    },
    setClipPlaneBOffset(value) {
      if (clipPlaneBOffset === value) return;
      clipPlaneBOffset = value;
      applyClipping();
      pushHud();
    },
    setFogMode(value) {
      if (fogMode === value) return;
      fogMode = value;
      applyFogSettings();
      pushHud();
    },
    setFogNear(value) {
      if (fogNear === value) return;
      fogNear = value;
      if (fogMode === 'linear') applyFogSettings();
      pushHud();
    },
    setFogFar(value) {
      if (fogFar === value) return;
      fogFar = value;
      if (fogMode === 'linear') applyFogSettings();
      pushHud();
    },
    setFogDensity(value) {
      if (fogDensity === value) return;
      fogDensity = value;
      if (fogMode === 'exp2') applyFogSettings();
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      helperA.geometry.dispose();
      helperA.material.dispose();
      helperB.geometry.dispose();
      helperB.material.dispose();

      clipMeshes.forEach((mesh) => {
        if (mesh.geometry !== pillarGeometry) mesh.geometry.dispose();
        mesh.material.dispose();
      });
      pillarGeometry.dispose();

      scene.traverse((obj) => {
        if (!obj.isMesh || clipMeshes.includes(obj)) return;
        obj.geometry?.dispose?.();
        obj.material?.dispose?.();
      });

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
