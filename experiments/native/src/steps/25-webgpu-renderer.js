import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(25);


const RENDERER_MODES = [
  {
    id: 'webgpu',
    label: 'WebGPURenderer (auto)',
    hint: 'Targets WebGPU when `navigator.gpu` is present; otherwise falls back to WebGL2 via `getFallback`.',
  },
  {
    id: 'webgpu-force-webgl',
    label: 'WebGPURenderer (force WebGL2)',
    hint: 'Passes `{ forceWebGL: true }` — same renderer class, WebGL2 backend only.',
  },
  {
    id: 'webgl-classic',
    label: 'WebGLRenderer (step 1 baseline)',
    hint: 'Classic synchronous renderer from the default `three` import for side-by-side API comparison.',
  },
];

const API_DELTAS = [
  {
    id: 'import',
    label: 'Import path',
    webgpu: '`import { WebGPURenderer } from "three/webgpu"`',
    webgl: '`import { WebGLRenderer } from "three"`',
  },
  {
    id: 'init',
    label: 'Startup',
    webgpu: '`await renderer.init()` — async backend setup before the first frame',
    webgl: 'Constructor attaches the GL context immediately — no `init()`',
  },
  {
    id: 'render',
    label: 'First draw',
    webgpu: 'Calling `render()` before init warns and delegates to `renderAsync()`',
    webgl: '`render(scene, camera)` is synchronous from frame one',
  },
  {
    id: 'fallback',
    label: 'Feature detection',
    webgpu: '`navigator.gpu` probe + built-in `getFallback` → WebGL2 backend',
    webgl: 'Always WebGL — no GPU backend selection',
  },
  {
    id: 'coords',
    label: 'Coordinate system',
    webgpu: '`renderer.coordinateSystem` → `WebGPUCoordinateSystem` or `WebGLCoordinateSystem` on fallback',
    webgl: 'Always `WebGLCoordinateSystem`',
  },
  {
    id: 'type',
    label: 'Type flag',
    webgpu: '`renderer.isWebGPURenderer === true` even when running the WebGL2 backend',
    webgl: '`renderer.isWebGLRenderer === true`',
  },
];

const JOINT_COLORS = {
  root: 0xf5c542,
  arm: 0x42c9f5,
  wrist: 0xf542c9,
};

function detectWebGPU() {
  return typeof navigator !== 'undefined' && navigator.gpu != null;
}

function makeJointMarker(color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 }),
  );
}

function makeLinkLine(color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0),
  ]);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }),
  );
}

function vec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function eulerDeg(e) {
  return {
    x: THREE.MathUtils.radToDeg(e.x),
    y: THREE.MathUtils.radToDeg(e.y),
    z: THREE.MathUtils.radToDeg(e.z),
  };
}

function quat(q) {
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

function readNode(node, autoUpdateMatrices) {
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  if (autoUpdateMatrices) {
    node.getWorldPosition(worldPos);
    node.getWorldQuaternion(worldQuat);
    node.getWorldScale(worldScale);
  } else {
    node.matrixWorld.decompose(worldPos, worldQuat, worldScale);
  }

  return {
    name: node.name,
    local: {
      position: vec3(node.position),
      rotation: eulerDeg(node.rotation),
      scale: vec3(node.scale),
      quaternion: quat(node.quaternion),
    },
    world: {
      position: vec3(worldPos),
      quaternion: quat(worldQuat),
      scale: vec3(worldScale),
    },
    matrixWorldStale: node.matrixWorldNeedsUpdate,
  };
}

function buildSceneGraph() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  const root = new THREE.Group();
  root.name = 'root';

  const arm = new THREE.Group();
  arm.name = 'arm';
  arm.position.set(1.1, 0, 0);

  const wrist = new THREE.Group();
  wrist.name = 'wrist';
  wrist.position.set(0.9, 0, 0);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.45, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f8, roughness: 0.35, metalness: 0.1 }),
  );
  cube.name = 'cube';
  cube.position.set(0.55, 0, 0);

  const rootMarker = makeJointMarker(JOINT_COLORS.root);
  const armMarker = makeJointMarker(JOINT_COLORS.arm);
  const wristMarker = makeJointMarker(JOINT_COLORS.wrist);

  const armLink = makeLinkLine(JOINT_COLORS.arm);
  armLink.scale.x = arm.position.length();
  const wristLink = makeLinkLine(JOINT_COLORS.wrist);
  wristLink.scale.x = wrist.position.length();
  const cubeLink = makeLinkLine(0xf0f0f8);
  cubeLink.scale.x = cube.position.length();

  root.add(rootMarker, new THREE.AxesHelper(0.55));
  arm.add(armMarker, armLink, new THREE.AxesHelper(0.45));
  wrist.add(wristMarker, wristLink, new THREE.AxesHelper(0.35));
  cube.add(cubeLink);

  wrist.add(cube);
  arm.add(wrist);
  root.add(arm);
  scene.add(root);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.6;
  scene.add(ground);

  scene.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x252530));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  return { scene, root, arm, wrist, cube };
}

function coordinateSystemLabel(system) {
  if (system === THREE.WebGPUCoordinateSystem) return 'WebGPUCoordinateSystem';
  if (system === THREE.WebGLCoordinateSystem) return 'WebGLCoordinateSystem';
  return String(system);
}

function describeBackend(renderer, modeId) {
  if (modeId === 'webgl-classic') {
    return {
      id: 'webgl-classic',
      label: 'WebGLRenderer',
      detail: 'Classic renderer from the default three bundle.',
      usedFallback: false,
    };
  }

  if (renderer.backend?.isWebGPUBackend) {
    return {
      id: 'webgpu-native',
      label: 'WebGPU backend',
      detail: 'WebGPURenderer initialized against `navigator.gpu`.',
      usedFallback: false,
    };
  }

  if (renderer.backend?.isWebGLBackend) {
    const forced = modeId === 'webgpu-force-webgl';
    return {
      id: forced ? 'webgl2-forced' : 'webgl2-fallback',
      label: forced ? 'WebGL2 backend (forced)' : 'WebGL2 backend (fallback)',
      detail: forced
        ? 'WebGPURenderer with `{ forceWebGL: true }`.'
        : 'WebGPU unavailable — WebGPURenderer switched to its WebGL2 backend.',
      usedFallback: !forced,
    };
  }

  return {
    id: 'unknown',
    label: 'Unknown backend',
    detail: 'Could not classify the active renderer backend.',
    usedFallback: false,
  };
}

function createRenderer(modeId) {
  if (modeId === 'webgl-classic') {
    return new THREE.WebGLRenderer({ antialias: true });
  }

  const options = { antialias: true };
  if (modeId === 'webgpu-force-webgl') {
    options.forceWebGL = true;
  }
  return new WebGPURenderer(options);
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, root, arm, wrist, cube } = buildSceneGraph();

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2.2, 5.5);
  camera.lookAt(0, 0.4, 0);

  let renderer = null;
  let rendererMode = 'webgpu';
  let initPhase = 'initializing';
  let initError = '';
  let initMs = null;
  let usedBuiltInFallback = false;
  let autoUpdateMatrices = true;
  let frameId;
  let initToken = 0;
  let disposed = false;

  function resize() {
    if (!renderer) return;
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  function pushHud(extra = {}) {
    onHudUpdate?.({
      rendererModes: RENDERER_MODES,
      rendererMode,
      initPhase,
      initError,
      initMs,
      webgpuAvailable: detectWebGPU(),
      usedBuiltInFallback,
      autoUpdateMatrices,
      apiDeltas: API_DELTAS,
      backend: renderer ? describeBackend(renderer, rendererMode) : null,
      rendererInfo: renderer
        ? {
            className: renderer.isWebGPURenderer ? 'WebGPURenderer' : 'WebGLRenderer',
            coordinateSystem: coordinateSystemLabel(renderer.coordinateSystem),
            pixelRatio: renderer.getPixelRatio(),
          }
        : null,
      nodes:
        initPhase === 'ready'
          ? [root, arm, wrist, cube].map((node) => readNode(node, autoUpdateMatrices))
          : [],
      ...extra,
    });
  }

  function disposeRendererResources() {
    if (!renderer) return;

    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
    renderer = null;
  }

  async function setupRenderer(modeId) {
    const token = ++initToken;
    initPhase = 'initializing';
    initError = '';
    initMs = null;
    usedBuiltInFallback = false;
    pushHud();

    disposeRendererResources();

    const nextRenderer = createRenderer(modeId);
    container.appendChild(nextRenderer.domElement);
    renderer = nextRenderer;
    resize();

    const started = performance.now();

    try {
      if (nextRenderer.isWebGPURenderer) {
        await nextRenderer.init();
      }

      if (disposed || token !== initToken) {
        nextRenderer.dispose();
        if (nextRenderer.domElement.parentElement === container) {
          container.removeChild(nextRenderer.domElement);
        }
        return;
      }

      initMs = Math.round(performance.now() - started);
      initPhase = 'ready';

      if (modeId !== 'webgl-classic' && modeId !== 'webgpu-force-webgl' && !detectWebGPU()) {
        usedBuiltInFallback = nextRenderer.backend?.isWebGLBackend === true;
      }

      if (frameId == null) {
        animate();
      }
    } catch (err) {
      if (disposed || token !== initToken) return;
      initPhase = 'error';
      initError = err instanceof Error ? err.message : String(err);
    }

    pushHud();
  }

  function animate() {
    frameId = requestAnimationFrame(animate);

    if (initPhase !== 'ready' || !renderer) {
      pushHud();
      return;
    }

    root.rotation.y += 0.006;
    arm.rotation.z += 0.014;
    wrist.rotation.y += 0.028;
    cube.rotation.x += 0.02;

    scene.matrixWorldAutoUpdate = autoUpdateMatrices;
    if (autoUpdateMatrices) {
      scene.updateMatrixWorld(true);
    }

    renderer.render(scene, camera);
    pushHud();
  }

  pushHud();
  setupRenderer(rendererMode);

  return {
    setRendererMode(modeId) {
      if (rendererMode === modeId) return;
      if (!RENDERER_MODES.some((mode) => mode.id === modeId)) return;
      rendererMode = modeId;
      setupRenderer(modeId);
    },
    setAutoUpdateMatrices(value) {
      autoUpdateMatrices = value;
      if (value) {
        scene.updateMatrixWorld(true);
      }
      pushHud();
    },
    forceMatrixWorldUpdate() {
      scene.updateMatrixWorld(true);
      pushHud();
    },
    retryInit() {
      setupRenderer(rendererMode);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      disposeRendererResources();

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
    },
  };
}
