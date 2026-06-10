import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const meta = {
  step: 11,
  title: 'Keyframe animation with AnimationMixer',
  description:
    'Procedural `AnimationClip` + `KeyframeTrack` on transforms and morph influences; loaded glTF clips via `AnimationMixer` and `AnimationAction` with loop modes and crossfade.',
};

const MODEL_URL = new URL('../../../../common/assets/brain-stem.glb', import.meta.url).href;

const LOOP_MODES = [
  { id: 'repeat', label: 'LoopRepeat', loop: THREE.LoopRepeat, clamp: false },
  { id: 'once', label: 'LoopOnce (clamp)', loop: THREE.LoopOnce, clamp: true },
  { id: 'pingpong', label: 'LoopPingPong', loop: THREE.LoopPingPong, clamp: false },
];

function vec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function createPedestal(color) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.65, 0.12, 32),
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.12 }),
  );
  mesh.position.y = 0.06;
  mesh.receiveShadow = true;
  return mesh;
}

function createProceduralBox() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.38, metalness: 0.12 }),
  );
  mesh.name = 'procedural-box';
  mesh.position.set(-3.5, 0.5, 0);
  mesh.castShadow = true;

  const times = [0, 0.55, 1.1, 1.65, 2.2];
  const positionTrack = new THREE.VectorKeyframeTrack(
    '.position',
    times,
    [
      -3.5, 0.5, 0,
      -3.5, 1.35, 0,
      -3.5, 0.5, 0,
      -3.5, 0.95, 0,
      -3.5, 0.5, 0,
    ],
  );
  const rotationTrack = new THREE.VectorKeyframeTrack(
    '.rotation',
    [0, 2.2],
    [0, 0, 0, 0, Math.PI * 2, 0],
  );

  const clip = new THREE.AnimationClip('bounce-spin', 2.2, [positionTrack, rotationTrack]);
  return { mesh, clip };
}

function createMorphMesh() {
  const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9, 10, 10, 10);
  const position = geometry.attributes.position;
  const bulge = new Float32Array(position.count * 3);
  const twist = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    bulge[i * 3] = x * 1.45;
    bulge[i * 3 + 1] = y * 1.45;
    bulge[i * 3 + 2] = z * 1.45;

    const angle = y * 1.35;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    twist[i * 3] = x * cos - z * sin;
    twist[i * 3 + 1] = y;
    twist[i * 3 + 2] = x * sin + z * cos;
  }

  geometry.morphAttributes.position = [
    new THREE.Float32BufferAttribute(bulge, 3),
    new THREE.Float32BufferAttribute(twist, 3),
  ];
  geometry.morphAttributes.position[0].name = 'bulge';
  geometry.morphAttributes.position[1].name = 'twist';

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x42c9f5, roughness: 0.42, metalness: 0.1 }),
  );
  mesh.name = 'morph-box';
  mesh.position.set(0, 0.55, 0);
  mesh.castShadow = true;

  const clip = new THREE.AnimationClip('morph-pulse', 3, [
    new THREE.NumberKeyframeTrack('.morphTargetInfluences[0]', [0, 1.5, 3], [0, 1, 0]),
    new THREE.NumberKeyframeTrack('.morphTargetInfluences[1]', [0, 1.5, 3], [0, 0, 1]),
  ]);

  return { mesh, clip, morphNames: ['bulge', 'twist'] };
}

function frameModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  object.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) object.scale.setScalar(1.1 / maxDim);
  const grounded = new THREE.Box3().setFromObject(object);
  object.position.y -= grounded.min.y;
}

function applyLoopMode(action, modeId) {
  const mode = LOOP_MODES.find((m) => m.id === modeId) ?? LOOP_MODES[0];
  action.setLoop(mode.loop, mode.id === 'once' ? 1 : Infinity);
  action.clampWhenFinished = mode.clamp;
}

function actionSummary(action) {
  if (!action) return null;
  return {
    name: action.getClip().name,
    weight: action.getEffectiveWeight(),
    time: action.time,
    duration: action.getClip().duration,
    paused: action.paused,
    enabled: action.enabled,
  };
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(16, 32, 0x3a3a4a, 0x252530));

  const procedural = createProceduralBox();
  scene.add(createPedestal(0x3a3020));
  scene.add(procedural.mesh);

  const morph = createMorphMesh();
  scene.add(createPedestal(0x203038));
  scene.add(morph.mesh);

  const gltfRoot = new THREE.Group();
  gltfRoot.name = 'gltf-root';
  gltfRoot.position.set(3.5, 0, 0);
  scene.add(createPedestal(0x302028));
  scene.add(gltfRoot);

  scene.add(new THREE.AmbientLight(0xffffff, 0.42));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaccff, 0.32);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  return { scene, procedural, morph, gltfRoot };
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, procedural, morph, gltfRoot } = buildScene();

  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  camera.position.set(0.5, 3.8, 9.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.65, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.update();

  const clock = new THREE.Clock();
  const loader = new GLTFLoader();

  const procMixer = new THREE.AnimationMixer(procedural.mesh);
  const procAction = procMixer.clipAction(procedural.clip);
  procAction.play();

  const morphMixer = new THREE.AnimationMixer(morph.mesh);
  const morphAction = morphMixer.clipAction(morph.clip);
  morphAction.play();

  let gltfMixer = null;
  let gltfActions = [];
  let activeGltfClip = '';
  let gltfLoadState = 'loading';
  let gltfLoadError = '';
  let gltfClips = [];

  let loopModeId = 'repeat';
  let timeScale = 1;
  let playing = true;
  let crossfadeDuration = 0.6;

  procAction.timeScale = timeScale;
  morphAction.timeScale = timeScale;

  function setupGltfAnimations(gltf) {
    if (!gltf.animations?.length) {
      gltfClips = [];
      return;
    }

    gltfMixer = new THREE.AnimationMixer(gltf.scene);
    gltfActions = gltf.animations.map((clip) => ({
      name: clip.name || 'Clip',
      duration: clip.duration,
      action: gltfMixer.clipAction(clip),
    }));
    gltfClips = gltfActions.map(({ name, duration }) => ({ name, duration }));

    activeGltfClip = gltfActions[0].name;
    const first = gltfActions[0].action;
    first.setLoop(THREE.LoopRepeat, Infinity);
    first.play();
    first.timeScale = timeScale;
  }

  loader.load(
    MODEL_URL,
    (gltf) => {
      gltf.scene.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.castShadow = true;
        obj.receiveShadow = true;
      });
      frameModel(gltf.scene);
      gltfRoot.add(gltf.scene);
      setupGltfAnimations(gltf);
      gltfLoadState = 'loaded';
      pushHud();
    },
    undefined,
    (err) => {
      gltfLoadState = 'error';
      gltfLoadError = err instanceof Error ? err.message : String(err);
      pushHud();
    },
  );

  function syncPlayback() {
    procAction.paused = !playing;
    morphAction.paused = !playing;
    for (const { action } of gltfActions) {
      action.paused = !playing;
    }
    if (playing) {
      procAction.play();
      morphAction.play();
      for (const { action } of gltfActions) {
        if (action.getEffectiveWeight() > 0) action.play();
      }
    }
  }

  function syncTimeScale() {
    procAction.timeScale = timeScale;
    morphAction.timeScale = timeScale;
    for (const { action } of gltfActions) {
      action.timeScale = timeScale;
    }
  }

  function pushHud() {
    const activeGltf = gltfActions.find((a) => a.name === activeGltfClip);

    onHudUpdate?.({
      loopModeId,
      loopModes: LOOP_MODES.map(({ id, label }) => ({ id, label })),
      timeScale,
      playing,
      crossfadeDuration,
      procedural: {
        clipName: procedural.clip.name,
        duration: procedural.clip.duration,
        tracks: procedural.clip.tracks.map((t) => t.name),
        action: actionSummary(procAction),
        mixerTime: procMixer.time,
        position: vec3(procedural.mesh.position),
      },
      morph: {
        clipName: morph.clip.name,
        duration: morph.clip.duration,
        morphNames: morph.morphNames,
        influences: [...(morph.mesh.morphTargetInfluences ?? [])],
        tracks: morph.clip.tracks.map((t) => t.name),
        action: actionSummary(morphAction),
        mixerTime: morphMixer.time,
      },
      gltf: {
        loadState: gltfLoadState,
        loadError: gltfLoadError,
        clips: gltfClips,
        activeClipName: activeGltfClip,
        crossfadeDuration,
        action: actionSummary(activeGltf?.action ?? null),
        mixerTime: gltfMixer?.time ?? 0,
        allActions: gltfActions.map(({ name, action }) => ({
          name,
          weight: action.getEffectiveWeight(),
        })),
      },
    });
  }

  function crossfadeToClip(name) {
    if (name === activeGltfClip) return;
    const next = gltfActions.find((a) => a.name === name);
    const prev = gltfActions.find((a) => a.name === activeGltfClip);
    if (!next) return;

    next.action.reset();
    next.action.setLoop(THREE.LoopRepeat, Infinity);
    next.action.timeScale = timeScale;
    next.action.paused = !playing;
    next.action.enabled = true;
    next.action.setEffectiveWeight(1);

    if (prev?.action && crossfadeDuration > 0) {
      prev.action.crossFadeTo(next.action, crossfadeDuration, true);
    } else {
      if (prev) prev.action.fadeOut(0);
      next.action.play();
    }

    activeGltfClip = name;
    pushHud();
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

    if (playing) {
      procMixer.update(delta);
      morphMixer.update(delta);
      gltfMixer?.update(delta);
    }

    controls.update();
    pushHud();
    renderer.render(scene, camera);
  }
  tick();

  return {
    setLoopModeId(id) {
      if (id === loopModeId) return;
      if (!LOOP_MODES.some((m) => m.id === id)) return;
      loopModeId = id;
      applyLoopMode(procAction, id);
      applyLoopMode(morphAction, id);
      pushHud();
    },
    setTimeScale(scale) {
      timeScale = Math.max(0.05, scale);
      syncTimeScale();
      pushHud();
    },
    setPlaying(value) {
      if (value === playing) return;
      playing = value;
      syncPlayback();
      pushHud();
    },
    setCrossfadeDuration(value) {
      crossfadeDuration = Math.max(0, value);
      pushHud();
    },
    setActiveGltfClip(name) {
      crossfadeToClip(name);
    },
    restartProcedural() {
      procAction.reset().play();
      procAction.paused = !playing;
      pushHud();
    },
    restartMorph() {
      morphAction.reset().play();
      morphAction.paused = !playing;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      procMixer.stopAllAction();
      morphMixer.stopAllAction();
      gltfMixer?.stopAllAction();

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
