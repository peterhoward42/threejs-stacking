import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const meta = {
  step: 8,
  title: 'Asset loading with GLTFLoader',
  description:
    'Load a `.glb` from `common/assets/`, traverse meshes and materials, swap a material live, and drive embedded clips with `AnimationMixer`. Shows loading progress and error handling.',
};

const MODEL_URL = new URL('../../../../common/assets/brain-stem.glb', import.meta.url).href;
const BAD_MODEL_URL = new URL('../../../../common/assets/missing-model.glb', import.meta.url).href;

const MATERIAL_PRESETS = [
  { id: 'original', label: 'Original (from glTF)' },
  { id: 'wireframe', label: 'Wireframe PBR' },
  { id: 'normal', label: 'MeshNormalMaterial' },
  { id: 'emissive', label: 'Emissive accent' },
];

function meshLabel(mesh, index) {
  const name = mesh.name?.trim();
  return name ? name : `Mesh ${index + 1}`;
}

function collectSceneGraph(root) {
  const meshes = [];
  const materialsByUuid = new Map();

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      if (mat && !materialsByUuid.has(mat.uuid)) {
        materialsByUuid.set(mat.uuid, mat);
      }
    });

    meshes.push({
      mesh: obj,
      uuid: obj.uuid,
      name: meshLabel(obj, meshes.length),
      materialTypes: mats.map((m) => m?.type ?? '—'),
      materialNames: mats.map((m) => m?.name || '—'),
      materialUuids: mats.map((m) => m?.uuid ?? '—'),
      vertexCount: obj.geometry?.attributes?.position?.count ?? 0,
    });
  });

  return {
    meshes,
    materials: [...materialsByUuid.values()].map((mat) => ({
      uuid: mat.uuid,
      type: mat.type,
      name: mat.name || '—',
      color: mat.color?.getHexString?.() ?? null,
      metalness: mat.metalness ?? null,
      roughness: mat.roughness ?? null,
    })),
  };
}

function createReplacementMaterial(presetId, sourceMaterial) {
  switch (presetId) {
    case 'wireframe':
      return new THREE.MeshStandardMaterial({
        color: sourceMaterial?.color?.getHex?.() ?? 0x88aacc,
        metalness: 0.35,
        roughness: 0.45,
        wireframe: true,
      });
    case 'normal':
      return new THREE.MeshNormalMaterial();
    case 'emissive':
      return new THREE.MeshStandardMaterial({
        color: 0x1a2233,
        emissive: 0x44bbff,
        emissiveIntensity: 0.85,
        metalness: 0.6,
        roughness: 0.25,
      });
    default:
      return null;
  }
}

function disposeMaterial(material) {
  if (!material) return;
  const mats = Array.isArray(material) ? material : [material];
  mats.forEach((mat) => {
    if (!mat) return;
    for (const value of Object.values(mat)) {
      if (value?.isTexture) value.dispose();
    }
    mat.dispose();
  });
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const modelRoot = new THREE.Group();
  modelRoot.name = 'gltf-root';
  scene.add(modelRoot);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 64),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(8, 16, 0x3a3a4a, 0x252530));

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaccff, 0.35);
  fill.position.set(-4, 2, -2);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
  camera.position.set(1.8, 1.35, 2.4);
  camera.lookAt(0, 0.55, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const clock = new THREE.Clock();
  const loader = new GLTFLoader();

  let frameId;
  let loadToken = 0;
  let loadState = 'loading';
  let loadProgress = 0;
  let loadError = '';
  let loadedUrl = MODEL_URL;

  let gltfRoot = null;
  let graph = { meshes: [], materials: [] };
  let originalMaterials = new Map();
  let replacementMaterials = [];
  let selectedMeshUuid = '';
  let materialPresetId = 'original';

  let mixer = null;
  let animationActions = [];
  let activeClipName = '';
  let animationPlaying = true;
  let animationTime = 0;

  function clearModel() {
    if (mixer) {
      mixer.stopAllAction();
      mixer = null;
    }
    animationActions = [];
    activeClipName = '';
    animationTime = 0;

    replacementMaterials.forEach((mat) => disposeMaterial(mat));
    replacementMaterials = [];
    originalMaterials.clear();

    if (gltfRoot) {
      modelRoot.remove(gltfRoot);
      gltfRoot.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          disposeMaterial(obj.material);
        }
      });
      gltfRoot = null;
    }

    graph = { meshes: [], materials: [] };
    selectedMeshUuid = '';
    materialPresetId = 'original';
  }

  function frameModel(object) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      object.scale.setScalar(1.35 / maxDim);
    }

    const grounded = new THREE.Box3().setFromObject(object);
    object.position.y -= grounded.min.y;
  }

  function setupAnimations(gltf) {
    if (!gltf.animations?.length) return;

    mixer = new THREE.AnimationMixer(gltf.scene);
    animationActions = gltf.animations.map((clip) => {
      const action = mixer.clipAction(clip);
      action.loop = THREE.LoopRepeat;
      return { name: clip.name || 'Clip', duration: clip.duration, action };
    });

    activeClipName = animationActions[0].name;
    animationActions[0].action.play();
    animationPlaying = true;
  }

  function applyMaterialPreset() {
    if (!selectedMeshUuid) return;

    const entry = graph.meshes.find((m) => m.uuid === selectedMeshUuid);
    if (!entry) return;

    const mesh = entry.mesh;
    const original = originalMaterials.get(mesh.uuid);
    if (!original) return;

    if (materialPresetId === 'original') {
      mesh.material = original;
      pushHud();
      return;
    }

    let replacement = replacementMaterials.find(
      (item) => item.meshUuid === mesh.uuid && item.presetId === materialPresetId,
    );

    if (!replacement) {
      const source = Array.isArray(original) ? original[0] : original;
      const mat = createReplacementMaterial(materialPresetId, source);
      replacement = { meshUuid: mesh.uuid, presetId: materialPresetId, material: mat };
      replacementMaterials.push(replacement);
    }

    mesh.material = replacement.material;
    pushHud();
  }

  function pushHud() {
    const selected = graph.meshes.find((m) => m.uuid === selectedMeshUuid);
    const activeClip = animationActions.find((a) => a.name === activeClipName);

    onHudUpdate?.({
      loadState,
      loadProgress,
      loadError,
      loadedUrl,
      assetPath: 'common/assets/brain-stem.glb',
      meshes: graph.meshes.map(({ uuid, name, materialTypes, materialNames, vertexCount }) => ({
        uuid,
        name,
        materialTypes,
        materialNames,
        vertexCount,
      })),
      materials: graph.materials,
      selectedMeshUuid,
      selectedMesh: selected
        ? {
            name: selected.name,
            materialLabel: selected.materialTypes.join(', '),
          }
        : null,
      materialPresets: MATERIAL_PRESETS,
      materialPresetId,
      animations: animationActions.map(({ name, duration }) => ({ name, duration })),
      activeClipName,
      animationPlaying,
      animationTime,
      hasAnimations: animationActions.length > 0,
    });
  }

  function loadModel(url) {
    const token = ++loadToken;
    clearModel();
    loadState = 'loading';
    loadProgress = 0;
    loadError = '';
    loadedUrl = url;
    pushHud();

    loader.load(
      url,
      (gltf) => {
        if (token !== loadToken) return;

        gltfRoot = gltf.scene;
        gltfRoot.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.castShadow = true;
          obj.receiveShadow = true;
          originalMaterials.set(obj.uuid, obj.material);
        });

        frameModel(gltfRoot);
        modelRoot.add(gltfRoot);
        graph = collectSceneGraph(gltfRoot);
        selectedMeshUuid = graph.meshes[0]?.uuid ?? '';
        setupAnimations(gltf);

        loadState = 'loaded';
        loadProgress = 1;
        pushHud();
      },
      (event) => {
        if (token !== loadToken) return;
        if (event.total) {
          loadProgress = event.loaded / event.total;
        } else {
          loadProgress = 0;
        }
        pushHud();
      },
      (err) => {
        if (token !== loadToken) return;
        loadState = 'error';
        loadError = err instanceof Error ? err.message : String(err);
        loadProgress = 0;
        pushHud();
      },
    );
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

  loadModel(MODEL_URL);

  function animate() {
    frameId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer && animationPlaying) {
      mixer.update(delta);
      animationTime = mixer.time;
    }

    if (gltfRoot) {
      modelRoot.rotation.y += delta * 0.18;
    }

    pushHud();
    renderer.render(scene, camera);
  }
  animate();

  return {
    reload() {
      loadModel(MODEL_URL);
    },
    simulateError() {
      loadModel(BAD_MODEL_URL);
    },
    setSelectedMeshUuid(uuid) {
      if (uuid === selectedMeshUuid) return;
      if (!graph.meshes.some((m) => m.uuid === uuid)) return;
      selectedMeshUuid = uuid;
      applyMaterialPreset();
    },
    setMaterialPresetId(id) {
      if (id === materialPresetId) return;
      if (!MATERIAL_PRESETS.some((p) => p.id === id)) return;
      materialPresetId = id;
      applyMaterialPreset();
    },
    setActiveClipName(name) {
      if (name === activeClipName) return;
      if (!animationActions.some((a) => a.name === name)) return;
      if (mixer) mixer.stopAllAction();
      activeClipName = name;
      const clip = animationActions.find((a) => a.name === name);
      clip.action.reset().play();
      animationPlaying = true;
      pushHud();
    },
    setAnimationPlaying(playing) {
      if (playing === animationPlaying) return;
      animationPlaying = playing;
      const clip = animationActions.find((a) => a.name === activeClipName);
      if (!clip) return;
      clip.action.paused = !playing;
      if (playing) clip.action.play();
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      loadToken += 1;
      clearModel();
      floor.geometry.dispose();
      floor.material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
