import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 19,
  title: 'Morph targets',
  description:
    '`BufferGeometry.morphAttributes.position` (and optional normals) on one mesh; blend shapes via `morphTargetInfluences` or `NumberKeyframeTrack` clips.',
};

const MORPH_TARGETS = [
  {
    id: 'squash',
    label: 'squash',
    hint: 'Compress along Y — same vertex count as the base sphere.',
    deform: (x, y, z) => [x * 1.08, y * 0.38, z * 1.08],
  },
  {
    id: 'stretch',
    label: 'stretch',
    hint: 'Elongate Y while narrowing X/Z.',
    deform: (x, y, z) => [x * 0.62, y * 1.75, z * 0.62],
  },
  {
    id: 'bulge',
    label: 'bulge',
    hint: 'Uniform inflation along each vertex direction.',
    deform: (x, y, z) => {
      const scale = 1.5;
      return [x * scale, y * scale, z * scale];
    },
  },
  {
    id: 'wave',
    label: 'wave',
    hint: 'Radial ripple from a sinusoid on X — shows non-uniform morphing.',
    deform: (x, y, z) => {
      const ripple = Math.sin(x * 9) * 0.14;
      const len = Math.hypot(x, y, z) || 1;
      return [x + (x / len) * ripple, y + (y / len) * ripple, z + (z / len) * ripple];
    },
  },
];

const CLIPS = [
  {
    id: 'squashStretch',
    label: 'squash ↔ stretch',
    duration: 2.4,
    buildTracks: () => [
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[0]', [0, 1.2, 2.4], [0, 1, 0]),
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[1]', [0, 1.2, 2.4], [0, 0, 1]),
    ],
  },
  {
    id: 'bulgeWave',
    label: 'bulge + wave',
    duration: 3,
    buildTracks: () => [
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[2]', [0, 1.5, 3], [0, 1, 0]),
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[3]', [0, 1.5, 3], [0, 0, 1]),
    ],
  },
  {
    id: 'blendAll',
    label: 'four-way blend',
    duration: 4,
    buildTracks: () => [
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[0]', [0, 1, 2, 3, 4], [1, 0, 0, 0, 0.35]),
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[1]', [0, 1, 2, 3, 4], [0, 1, 0, 0, 0.35]),
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[2]', [0, 1, 2, 3, 4], [0, 0, 1, 0, 0.35]),
      new THREE.NumberKeyframeTrack('.morphTargetInfluences[3]', [0, 1, 2, 3, 4], [0, 0, 0, 1, 0.35]),
    ],
  },
];

const DRIVE_MODES = [
  { id: 'manual', label: 'Manual sliders', hint: 'Set `mesh.morphTargetInfluences` directly.' },
  {
    id: 'clip',
    label: 'AnimationClip',
    hint: '`NumberKeyframeTrack` on `.morphTargetInfluences[i]` via `AnimationMixer`.',
  },
];

function buildMorphGeometry(widthSegments = 32, heightSegments = 24) {
  const geometry = new THREE.SphereGeometry(0.85, widthSegments, heightSegments);
  const base = geometry.attributes.position;
  const count = base.count;

  const morphPositions = MORPH_TARGETS.map(({ id, deform }) => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const [nx, ny, nz] = deform(base.getX(i), base.getY(i), base.getZ(i));
      arr[i * 3] = nx;
      arr[i * 3 + 1] = ny;
      arr[i * 3 + 2] = nz;
    }
    const attr = new THREE.Float32BufferAttribute(arr, 3);
    attr.name = id;
    return attr;
  });

  geometry.morphAttributes.position = morphPositions;

  const morphNormals = MORPH_TARGETS.map((_, targetIndex) => {
    const temp = geometry.clone();
    temp.attributes.position = morphPositions[targetIndex].clone();
    temp.computeVertexNormals();
    const normals = temp.attributes.normal.array.slice();
    temp.dispose();
    const attr = new THREE.Float32BufferAttribute(normals, 3);
    attr.name = MORPH_TARGETS[targetIndex].id;
    return attr;
  });
  geometry.morphAttributes.normal = morphNormals;

  return geometry;
}

function summarizeMorphGeometry(geometry) {
  const position = geometry.getAttribute('position');
  const morphPos = geometry.morphAttributes.position ?? [];
  const morphNorm = geometry.morphAttributes.normal ?? [];
  return {
    vertexCount: position.count,
    morphTargetCount: morphPos.length,
    hasNormalMorphs: morphNorm.length > 0,
    morphNames: morphPos.map((attr, i) => attr.name || `target-${i}`),
  };
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 8),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x252530));

  const ambient = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff4e8, 1.1);
  key.position.set(4, 6, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.PointLight(0x6688ff, 0.5, 14);
  rim.position.set(-3.5, 2.5, 2);
  scene.add(rim);

  return scene;
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = buildScene();
  const geometry = buildMorphGeometry();

  const material = new THREE.MeshStandardMaterial({
    color: 0x42c9f5,
    roughness: 0.38,
    metalness: 0.12,
    morphNormals: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'morph-sphere';
  mesh.castShadow = true;
  mesh.position.y = 0.9;
  scene.add(mesh);

  const baseWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xf5c542, transparent: true, opacity: 0.45 }),
  );
  baseWire.name = 'base-wireframe';
  baseWire.position.copy(mesh.position);
  scene.add(baseWire);

  const clips = CLIPS.map((spec) => {
    const clip = new THREE.AnimationClip(spec.id, spec.duration, spec.buildTracks());
    clip.name = spec.label;
    return clip;
  });

  const mixer = new THREE.AnimationMixer(mesh);
  const actions = Object.fromEntries(
    clips.map((clip) => {
      const action = mixer.clipAction(clip);
      action.loop = THREE.LoopRepeat;
      action.clampWhenFinished = false;
      return [clip.name, action];
    }),
  );

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40);
  camera.position.set(0, 2.4, 4.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  controls.update();

  const manualInfluences = MORPH_TARGETS.map(() => 0);
  let driveModeId = 'manual';
  let activeClipId = CLIPS[0].id;
  let morphNormals = true;
  let showBaseWireframe = true;
  let playing = true;
  let timeScale = 1;

  function applyMaterialFlags() {
    material.morphNormals = morphNormals;
    material.needsUpdate = true;
    baseWire.visible = showBaseWireframe;
  }

  function applyManualInfluences() {
    if (!mesh.morphTargetInfluences) return;
    manualInfluences.forEach((value, i) => {
      mesh.morphTargetInfluences[i] = value;
    });
  }

  function stopClipActions() {
    Object.values(actions).forEach((action) => {
      action.stop();
      action.reset();
    });
  }

  function syncClipPlayback() {
    stopClipActions();
    if (driveModeId !== 'clip') return;

    const spec = CLIPS.find((c) => c.id === activeClipId) ?? CLIPS[0];
    const action = actions[spec.label];
    if (!action) return;

    action.reset();
    action.play();
    action.paused = !playing;
    action.timeScale = timeScale;
  }

  function applyDriveMode() {
    if (driveModeId === 'manual') {
      stopClipActions();
      applyManualInfluences();
    } else {
      syncClipPlayback();
    }
  }

  function resetInfluences() {
    manualInfluences.fill(0);
    if (driveModeId === 'manual') applyManualInfluences();
    else syncClipPlayback();
  }

  function pushHud() {
    const influences = [...(mesh.morphTargetInfluences ?? [])];
    const activeClip = CLIPS.find((c) => c.id === activeClipId) ?? CLIPS[0];
    const activeAction = actions[activeClip.label];

    onHudUpdate?.({
      morphTargets: MORPH_TARGETS,
      morphStats: summarizeMorphGeometry(geometry),
      morphDictionary: mesh.morphTargetDictionary
        ? { ...mesh.morphTargetDictionary }
        : null,
      influences,
      manualInfluences: [...manualInfluences],
      driveModes: DRIVE_MODES,
      driveModeId,
      clips: CLIPS.map((spec) => ({
        id: spec.id,
        label: spec.label,
        duration: spec.duration,
      })),
      activeClipId,
      playing,
      timeScale,
      morphNormals,
      showBaseWireframe,
      clipState: activeAction
        ? {
            time: activeAction.time,
            duration: activeClip.duration,
            weight: activeAction.getEffectiveWeight(),
          }
        : null,
      notes: [
        {
          id: 'position',
          label: 'morphAttributes.position',
          when: 'Each entry is a full vertex buffer matching `attributes.position.count`.',
        },
        {
          id: 'normal',
          label: 'morphAttributes.normal',
          when: 'Optional; enable `material.morphNormals` so lighting follows the deformation.',
        },
        {
          id: 'influences',
          label: 'morphTargetInfluences',
          when: 'Per-target weights on the mesh; multiple targets can blend simultaneously.',
        },
        {
          id: 'clips',
          label: 'NumberKeyframeTrack',
          when: 'Animate `.morphTargetInfluences[i]` — same array manual sliders write to.',
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

  const clock = new THREE.Clock();
  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    const delta = clock.getDelta();

    if (driveModeId === 'clip' && playing) {
      mixer.update(delta * timeScale);
    }

    mesh.rotation.y += delta * 0.18;
    baseWire.rotation.copy(mesh.rotation);
    baseWire.position.copy(mesh.position);

    controls.update();
    renderer.render(scene, camera);
    pushHud();
  }

  applyMaterialFlags();
  applyDriveMode();
  tick();
  pushHud();

  return {
    setInfluence(index, value) {
      if (driveModeId !== 'manual') return;
      if (index < 0 || index >= manualInfluences.length) return;
      const next = Math.max(0, Math.min(1, value));
      if (manualInfluences[index] === next) return;
      manualInfluences[index] = next;
      applyManualInfluences();
      pushHud();
    },
    setDriveModeId(id) {
      if (driveModeId === id) return;
      if (!DRIVE_MODES.some((m) => m.id === id)) return;

      if (id === 'manual') {
        const current = [...(mesh.morphTargetInfluences ?? manualInfluences)];
        current.forEach((v, i) => {
          manualInfluences[i] = v;
        });
      }

      driveModeId = id;
      applyDriveMode();
      pushHud();
    },
    setActiveClipId(id) {
      if (activeClipId === id) return;
      if (!CLIPS.some((c) => c.id === id)) return;
      activeClipId = id;
      if (driveModeId === 'clip') syncClipPlayback();
      pushHud();
    },
    setPlaying(value) {
      if (playing === value) return;
      playing = value;
      if (driveModeId === 'clip') syncClipPlayback();
      pushHud();
    },
    setTimeScale(value) {
      const next = Math.max(0.1, Math.min(3, value));
      if (timeScale === next) return;
      timeScale = next;
      if (driveModeId === 'clip') {
        const spec = CLIPS.find((c) => c.id === activeClipId) ?? CLIPS[0];
        const action = actions[spec.label];
        if (action) action.timeScale = next;
      }
      pushHud();
    },
    setMorphNormals(value) {
      if (morphNormals === value) return;
      morphNormals = value;
      applyMaterialFlags();
      pushHud();
    },
    setShowBaseWireframe(value) {
      if (showBaseWireframe === value) return;
      showBaseWireframe = value;
      applyMaterialFlags();
      pushHud();
    },
    resetInfluences() {
      resetInfluences();
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      mixer.stopAllAction();
      geometry.dispose();
      baseWire.geometry.dispose();
      baseWire.material.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
