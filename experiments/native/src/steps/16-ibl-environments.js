import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(16);


const HDR_URL = new URL('../../../../common/assets/venice_sunset_1k.hdr', import.meta.url).href;

const ENV_PRESETS = [
  {
    id: 'studio',
    label: 'CubeTexture — neutral studio',
    type: 'cube',
    hint: 'Six procedural canvas faces → `PMREMGenerator.fromCubemap`.',
  },
  {
    id: 'neon',
    label: 'CubeTexture — neon panels',
    type: 'cube',
    hint: 'Contrasting coloured faces make specular highlights obvious.',
  },
  {
    id: 'venice',
    label: 'RGBE HDRI — Venice sunset',
    type: 'hdr',
    url: HDR_URL,
    hint: '`RGBELoader` → equirectangular map → `fromEquirectangular`.',
  },
];

const BACKGROUND_MODES = [
  { id: 'solid', label: 'Solid colour' },
  { id: 'equirect', label: 'Source equirectangular' },
  { id: 'pmrem', label: 'PMREM env map' },
];

const ROUGHNESS_SAMPLES = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
const SPHERE_RADIUS = 0.42;
const SPHERE_GAP = 1.05;

function paintCubeFace(ctx, size, draw) {
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 0, size, size);
  draw(ctx, size);
}

function createStudioCubeTexture() {
  const size = 256;
  const faces = [];

  const faceDefs = [
    (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, '#f0f2f8');
      g.addColorStop(1, '#8a90a8');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    },
    (ctx, s) => {
      ctx.fillStyle = '#c8ccd8';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s * 0.1, s * 0.15, s * 0.35, s * 0.22);
    },
    (ctx, s) => {
      const g = ctx.createRadialGradient(s * 0.72, s * 0.28, s * 0.05, s * 0.72, s * 0.28, s * 0.55);
      g.addColorStop(0, '#fff8e8');
      g.addColorStop(1, '#4a5068');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    },
    (ctx, s) => {
      ctx.fillStyle = '#3a4050';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#6a7088';
      ctx.fillRect(0, s * 0.72, s, s * 0.28);
    },
    (ctx, s) => {
      ctx.fillStyle = '#8890a8';
      ctx.fillRect(0, 0, s, s);
    },
    (ctx, s) => {
      ctx.fillStyle = '#707888';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#e8eaf0';
      ctx.fillRect(s * 0.55, s * 0.08, s * 0.32, s * 0.18);
    },
  ];

  for (const draw of faceDefs) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    paintCubeFace(canvas.getContext('2d'), size, draw);
    faces.push(canvas);
  }

  const cube = new THREE.CubeTexture(faces);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.needsUpdate = true;
  return cube;
}

function createNeonCubeTexture() {
  const size = 256;
  const palette = ['#ff4466', '#44ffcc', '#ffcc33', '#8844ff', '#33aaff', '#ff8844'];
  const faces = palette.map((color) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = color;
    ctx.fillRect(size * 0.12, size * 0.18, size * 0.76, size * 0.64);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(size * 0.12, size * 0.18, size * 0.76, size * 0.64);
    return canvas;
  });

  const cube = new THREE.CubeTexture(faces);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.needsUpdate = true;
  return cube;
}

function createRoughnessLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c8c8d8';
  ctx.font = '600 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addRoughnessLabel(scene, text, x, y, z) {
  const map = createRoughnessLabelTexture(text);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    }),
  );
  const aspect = map.image.width / map.image.height;
  sprite.scale.set(0.34 * aspect, 0.34, 1);
  sprite.position.set(x, y, z);
  scene.add(sprite);
  return { sprite, map };
}

function buildComparisonGrid(scene, sphereRows) {
  const count = ROUGHNESS_SAMPLES.length;
  const span = (count - 1) * SPHERE_GAP;
  const startX = -span / 2;

  ROUGHNESS_SAMPLES.forEach((roughness, col) => {
    const x = startX + col * SPHERE_GAP;
    addRoughnessLabel(scene, roughness === 0 ? '0' : roughness.toFixed(2), x, 1.95, 0);
  });

  const rowDefs = [
    { metalness: 0, label: 'Dielectric', sub: 'metalness = 0', y: 1.35, tint: 0xc8c8d8 },
    { metalness: 1, label: 'Metal', sub: 'metalness = 1', y: 0.15, tint: 0xffffff },
  ];

  rowDefs.forEach((row, rowIndex) => {
    const meshes = [];
    ROUGHNESS_SAMPLES.forEach((roughness, col) => {
      const x = startX + col * SPHERE_GAP;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(SPHERE_RADIUS, 48, 32),
        new THREE.MeshStandardMaterial({
          color: row.tint,
          roughness,
          metalness: row.metalness,
        }),
      );
      mesh.position.set(x, row.y, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.row = rowIndex === 0 ? 'dielectric' : 'metal';
      mesh.userData.roughness = roughness;
      scene.add(mesh);
      meshes.push(mesh);
    });
    sphereRows.push({ ...row, meshes });
  });
}

function disposeTexture(texture) {
  texture?.dispose?.();
}

function disposeEnvBundle(bundle) {
  if (!bundle) return;
  disposeTexture(bundle.source);
  disposeTexture(bundle.pmrem);
  bundle.pmremRT?.dispose?.();
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);

  const sphereRows = [];
  buildComparisonGrid(scene, sphereRows);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 64),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.85, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.55;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x222230));

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
  camera.position.set(0, 1.75, 10.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  pmremGenerator.compileCubemapShader();

  const rgbeLoader = new RGBELoader();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.75, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 5;
  controls.maxDistance = 18;
  controls.update();

  const keyLight = new THREE.DirectionalLight(0xffffff, 0);
  keyLight.position.set(4, 6, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.camera.left = -7;
  keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top = 7;
  keyLight.shadow.camera.bottom = -7;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xaaccff, 0);
  fillLight.position.set(-5, 2, -2);
  scene.add(fillLight);

  let envBundle = null;
  let activePresetId = 'studio';
  let iblEnabled = true;
  let showBackground = true;
  let backgroundMode = 'pmrem';
  let environmentIntensity = 1;
  let envRotation = 0;
  let loadGeneration = 0;
  let envStatus = 'loading';

  const cubeFactories = {
    studio: createStudioCubeTexture,
    neon: createNeonCubeTexture,
  };

  function applyLightingBalance() {
    if (iblEnabled && envBundle?.pmrem) {
      keyLight.intensity = 0.18;
      fillLight.intensity = 0.08;
    } else if (iblEnabled) {
      keyLight.intensity = 0.9;
      fillLight.intensity = 0.3;
    } else {
      keyLight.intensity = 1.15;
      fillLight.intensity = 0.35;
    }
  }

  function applyBackground() {
    if (!showBackground) {
      scene.background = new THREE.Color(0x0a0a12);
      return;
    }

    if (!envBundle) {
      scene.background = new THREE.Color(0x0a0a12);
      return;
    }

    if (backgroundMode === 'equirect' && envBundle.equirect) {
      scene.background = envBundle.equirect;
      scene.backgroundBlurriness = 0;
    } else if (backgroundMode === 'pmrem' && envBundle.pmrem) {
      scene.background = envBundle.pmrem;
      scene.backgroundBlurriness = 0;
    } else if (backgroundMode === 'equirect' && envBundle.pmrem) {
      // CubeTexture sources have no equirectangular image — show PMREM instead.
      scene.background = envBundle.pmrem;
      scene.backgroundBlurriness = 0;
    } else {
      scene.background = new THREE.Color(0x0a0a12);
    }
  }

  function applyEnvironment() {
    scene.environmentIntensity = environmentIntensity;
    scene.environmentRotation.y = envRotation;
    scene.backgroundRotation.y = envRotation;

    if (iblEnabled && envBundle?.pmrem) {
      scene.environment = envBundle.pmrem;
    } else {
      scene.environment = null;
    }

    applyLightingBalance();
    applyBackground();
  }

  async function buildEnvBundle(presetId) {
    const preset = ENV_PRESETS.find((p) => p.id === presetId);
    if (!preset) throw new Error(`Unknown environment preset: ${presetId}`);

    if (preset.type === 'cube') {
      const source = cubeFactories[presetId]();
      const pmremRT = pmremGenerator.fromCubemap(source);
      return {
        presetId,
        type: 'cube',
        source,
        pmrem: pmremRT.texture,
        pmremRT,
        equirect: null,
      };
    }

    const equirect = await rgbeLoader.loadAsync(preset.url);
    equirect.mapping = THREE.EquirectangularReflectionMapping;
    const pmremRT = pmremGenerator.fromEquirectangular(equirect);
    return {
      presetId,
      type: 'hdr',
      source: equirect,
      equirect,
      pmrem: pmremRT.texture,
      pmremRT,
    };
  }

  async function loadEnvironment(presetId) {
    const generation = ++loadGeneration;
    envStatus = 'loading';
    pushHud();

    try {
      const next = await buildEnvBundle(presetId);
      if (generation !== loadGeneration) {
        disposeEnvBundle(next);
        return;
      }
      disposeEnvBundle(envBundle);
      envBundle = next;
      activePresetId = presetId;
      envStatus = 'ready';
      applyEnvironment();
      pushHud();
    } catch (err) {
      if (generation !== loadGeneration) return;
      envStatus = 'error';
      envBundle = null;
      scene.environment = null;
      applyBackground();
      pushHud();
      console.error(err);
    }
  }

  function summarizeSpheres() {
    return sphereRows.map((row) => ({
      label: row.label,
      metalness: row.metalness,
      samples: row.meshes.map((mesh) => ({
        roughness: mesh.userData.roughness,
        envMapIntensity: mesh.material.envMapIntensity,
      })),
    }));
  }

  function pushHud() {
    const preset = ENV_PRESETS.find((p) => p.id === activePresetId);
    onHudUpdate?.({
      presets: ENV_PRESETS,
      backgroundModes: BACKGROUND_MODES,
      activePresetId,
      presetHint: preset?.hint ?? '',
      envSourceType: envBundle?.type ?? '—',
      iblEnabled,
      showBackground,
      backgroundMode,
      environmentIntensity,
      envRotation,
      envStatus,
      pmremReady: Boolean(envBundle?.pmrem),
      keyLightIntensity: keyLight.intensity,
      fillLightIntensity: fillLight.intensity,
      sphereRows: summarizeSpheres(),
      sceneEnvironment: scene.environment ? 'PMREM cube map' : 'null',
      hasEquirectBackground: Boolean(envBundle?.equirect),
      sceneBackground:
        scene.background?.isColor
          ? `Color #${scene.background.getHexString()}`
          : scene.background?.name || scene.background?.type || 'texture',
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

  const clock = new THREE.Clock();
  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
    pushHud();
  }

  loadEnvironment(activePresetId).then(() => {
    if (!frameId) tick();
  });

  return {
    setPreset(id) {
      if (id === activePresetId && envStatus === 'ready') return;
      if (!ENV_PRESETS.some((p) => p.id === id)) return;
      loadEnvironment(id);
    },
    setIblEnabled(value) {
      if (value === iblEnabled) return;
      iblEnabled = value;
      applyEnvironment();
      pushHud();
    },
    setShowBackground(value) {
      if (value === showBackground) return;
      showBackground = value;
      applyBackground();
      pushHud();
    },
    setBackgroundMode(mode) {
      if (mode === backgroundMode) return;
      backgroundMode = mode;
      applyBackground();
      pushHud();
    },
    setEnvironmentIntensity(value) {
      const next = Math.max(0, Math.min(3, value));
      if (next === environmentIntensity) return;
      environmentIntensity = next;
      applyEnvironment();
      pushHud();
    },
    setEnvRotation(value) {
      if (value === envRotation) return;
      envRotation = value;
      applyEnvironment();
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      loadGeneration += 1;
      controls.dispose();
      disposeEnvBundle(envBundle);
      envBundle = null;
      pmremGenerator.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
