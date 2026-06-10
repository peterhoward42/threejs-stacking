import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 17,
  title: 'Render targets and offscreen rendering',
  description:
    '`WebGLRenderTarget` feeds from secondary cameras: a security monitor in-scene, a floor mirror, and a corner mini-map composited with an orthographic fullscreen quad.',
};

const DISPLAY_MODES = [
  {
    id: 'monitor',
    label: 'Security monitor',
    hint: 'Secondary `PerspectiveCamera` → RT → `map` on a wall-mounted screen mesh.',
  },
  {
    id: 'mirror',
    label: 'Floor mirror',
    hint: 'Mirrored camera across the floor plane → RT on a horizontal quad.',
  },
  {
    id: 'minimap',
    label: 'Corner mini-map',
    hint: 'Top-down `OrthographicCamera` → RT → ortho overlay quad after the main pass.',
  },
];

const RT_PRESETS = [
  { id: '256', width: 256, height: 256 },
  { id: '512', width: 512, height: 512 },
  { id: '1024', width: 1024, height: 1024 },
];

const MONITOR_ASPECT = 16 / 9;
const MIRROR_ASPECT = 1.6;

function vec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function createRenderTarget(width, height, label) {
  const target = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
  target.texture.name = label;
  target.texture.colorSpace = THREE.SRGBColorSpace;
  return target;
}

function buildWorld() {
  const world = new THREE.Scene();
  world.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.88, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  world.add(floor);
  world.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x252530));

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4),
    new THREE.MeshStandardMaterial({ color: 0x22222e, roughness: 0.95 }),
  );
  backWall.position.set(0, 2, -6);
  backWall.receiveShadow = true;
  world.add(backWall);

  const sideWall = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4),
    new THREE.MeshStandardMaterial({ color: 0x1e1e28, roughness: 0.95 }),
  );
  sideWall.position.set(-6, 2, 0);
  sideWall.rotation.y = Math.PI / 2;
  sideWall.receiveShadow = true;
  world.add(sideWall);

  const props = new THREE.Group();
  props.name = 'props';

  const centerpiece = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.55, 0.18, 120, 16),
    new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.35, metalness: 0.15 }),
  );
  centerpiece.position.set(0, 1.1, 0);
  centerpiece.castShadow = true;
  centerpiece.name = 'torus-knot';
  props.add(centerpiece);

  const boxSpecs = [
    { color: 0x42c9f5, pos: [-2.2, 0.35, 1.8], rot: 0.3 },
    { color: 0xf542c9, pos: [2.4, 0.45, -1.2], rot: -0.5 },
    { color: 0x7af542, pos: [-1.4, 0.28, -2.4], rot: 0.8 },
  ];
  boxSpecs.forEach((spec, i) => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.42, metalness: 0.1 }),
    );
    box.position.set(...spec.pos);
    box.rotation.y = spec.rot;
    box.castShadow = true;
    box.name = `box-${i}`;
    props.add(box);
  });

  world.add(props);

  const ambient = new THREE.AmbientLight(0x404060, 0.45);
  world.add(ambient);

  const key = new THREE.DirectionalLight(0xfff4e8, 1.1);
  key.position.set(4, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  world.add(key);

  const rim = new THREE.PointLight(0x6688ff, 0.55, 14);
  rim.position.set(-3, 3.5, 2);
  world.add(rim);

  return { world, props, centerpiece, rim };
}

function buildMonitorAssembly(securityTarget) {
  const group = new THREE.Group();
  group.position.set(2.8, 2.1, -5.92);

  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.42, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.6, metalness: 0.2 }),
  );
  bezel.castShadow = true;
  group.add(bezel);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 2.1 / MONITOR_ASPECT),
    new THREE.MeshBasicMaterial({ map: securityTarget.texture }),
  );
  screen.position.z = 0.045;
  screen.name = 'monitor-screen';
  group.add(screen);

  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x33ff88 }),
  );
  led.position.set(-1.02, -0.58, 0.05);
  group.add(led);

  return { group, screen };
}

function buildMirrorAssembly(mirrorTarget) {
  const group = new THREE.Group();
  group.position.set(0, 0.002, 2.8);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.04, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x2a2a36, roughness: 0.5, metalness: 0.35 }),
  );
  group.add(frame);

  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4 / MIRROR_ASPECT),
    new THREE.MeshBasicMaterial({
      map: mirrorTarget.texture,
      transparent: true,
      opacity: 0.92,
    }),
  );
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = 0.03;
  mirror.name = 'mirror-surface';
  group.add(mirror);

  return { group, mirror };
}

function buildMinimapOverlay(minimapTarget) {
  const overlayScene = new THREE.Scene();
  const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshBasicMaterial({
      map: minimapTarget.texture,
      transparent: true,
      depthTest: false,
      toneMapped: false,
    }),
  );
  panel.position.set(0.72, -0.72, 0);
  panel.renderOrder = 1;
  panel.name = 'minimap-quad';

  const border = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.36),
    new THREE.MeshBasicMaterial({ color: 0x0a0a12, depthTest: false, toneMapped: false }),
  );
  border.position.set(0.72, -0.72, -0.001);
  border.renderOrder = 0;

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x1a1a24, depthTest: false, toneMapped: false }),
  );
  label.position.set(0.72, -0.54, 0.001);
  label.renderOrder = 2;

  overlayScene.add(border, panel, label);

  return { overlayScene, overlayCamera, panel };
}

function updateMirrorCamera(mainCamera, mirrorCamera, mirrorY = 0) {
  const distance = mainCamera.position.y - mirrorY;
  mirrorCamera.position.set(
    mainCamera.position.x,
    mirrorY - distance,
    mainCamera.position.z,
  );

  const lookAt = new THREE.Vector3();
  mainCamera.getWorldDirection(lookAt);
  lookAt.add(mainCamera.position);

  const mirroredLook = new THREE.Vector3(
    lookAt.x,
    mirrorY - (lookAt.y - mirrorY),
    lookAt.z,
  );
  mirrorCamera.lookAt(mirroredLook);
  mirrorCamera.up.set(0, mainCamera.up.y > 0 ? -1 : 1, 0);
  mirrorCamera.updateMatrixWorld();
}

export function mount(container, { onHudUpdate } = {}) {
  const { world, props, centerpiece, rim } = buildWorld();

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 50);
  camera.position.set(5.5, 3.2, 6.5);

  const securityCamera = new THREE.PerspectiveCamera(52, MONITOR_ASPECT, 0.1, 40);
  securityCamera.position.set(-4.2, 3.4, 4.8);
  securityCamera.lookAt(0, 0.8, 0);

  const mirrorCamera = new THREE.PerspectiveCamera(48, MIRROR_ASPECT, 0.1, 50);

  const minimapCamera = new THREE.OrthographicCamera(-5.5, 5.5, 5.5, -5.5, 0.1, 30);
  minimapCamera.position.set(0, 12, 0);
  minimapCamera.lookAt(0, 0, 0);
  minimapCamera.up.set(0, 0, -1);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);

  let rtPresetId = '512';
  let securityTarget = createRenderTarget(512, Math.round(512 / MONITOR_ASPECT), 'securityRT');
  let mirrorTarget = createRenderTarget(512, Math.round(512 / MIRROR_ASPECT), 'mirrorRT');
  let minimapTarget = createRenderTarget(512, 512, 'minimapRT');

  const { group: monitorGroup, screen: monitorScreen } = buildMonitorAssembly(securityTarget);
  world.add(monitorGroup);

  const { group: mirrorGroup, mirror: mirrorSurface } = buildMirrorAssembly(mirrorTarget);
  world.add(mirrorGroup);

  const { overlayScene, overlayCamera, panel: minimapPanel } = buildMinimapOverlay(minimapTarget);

  const securityHelper = new THREE.CameraHelper(securityCamera);
  securityHelper.visible = true;
  world.add(securityHelper);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.9, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3;
  controls.maxDistance = 18;
  controls.update();

  const displayEnabled = {
    monitor: true,
    mirror: true,
    minimap: true,
  };
  let showSecurityHelper = true;
  let showMonitorMesh = true;
  let showMirrorMesh = true;
  let minimapOpacity = 1;

  function applyRtPreset(presetId) {
    const preset = RT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    securityTarget.dispose();
    mirrorTarget.dispose();
    minimapTarget.dispose();

    securityTarget = createRenderTarget(
      preset.width,
      Math.round(preset.width / MONITOR_ASPECT),
      'securityRT',
    );
    mirrorTarget = createRenderTarget(
      preset.width,
      Math.round(preset.width / MIRROR_ASPECT),
      'mirrorRT',
    );
    minimapTarget = createRenderTarget(preset.width, preset.width, 'minimapRT');

    monitorScreen.material.map = securityTarget.texture;
    monitorScreen.material.needsUpdate = true;
    mirrorSurface.material.map = mirrorTarget.texture;
    mirrorSurface.material.needsUpdate = true;
    minimapPanel.material.map = minimapTarget.texture;
    minimapPanel.material.needsUpdate = true;
  }

  function summarizeTarget(target, label) {
    return {
      label,
      name: target.texture.name,
      width: target.width,
      height: target.height,
      type: target.texture.type,
    };
  }

  function pushHud() {
    onHudUpdate?.({
      displayModes: DISPLAY_MODES,
      displayEnabled: { ...displayEnabled },
      rtPresets: RT_PRESETS,
      rtPresetId,
      showSecurityHelper,
      showMonitorMesh,
      showMirrorMesh,
      minimapOpacity,
      renderTargets: [
        summarizeTarget(securityTarget, 'Security monitor'),
        summarizeTarget(mirrorTarget, 'Floor mirror'),
        summarizeTarget(minimapTarget, 'Mini-map'),
      ],
      securityCamera: {
        position: vec3(securityCamera.position),
        fov: securityCamera.fov,
        aspect: securityCamera.aspect,
      },
      mainCamera: {
        position: vec3(camera.position),
      },
      mirrorCamera: {
        position: vec3(mirrorCamera.position),
      },
      minimapCamera: {
        zoom: minimapCamera.zoom,
        top: minimapCamera.top,
      },
      renderPasses: [
        displayEnabled.monitor ? 'security → securityRT' : null,
        displayEnabled.mirror ? 'mirror → mirrorRT' : null,
        displayEnabled.minimap ? 'minimap → minimapRT' : null,
        'main scene → screen',
        displayEnabled.minimap ? 'overlay ortho quad → screen' : null,
      ].filter(Boolean),
    });
  }

  function resize() {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    mirrorCamera.aspect = MIRROR_ASPECT;
    mirrorCamera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const clock = new THREE.Clock();
  let frameId;

  function renderOffscreenPasses() {
    const prevBackground = world.background;
    const prevMonitorVisible = monitorGroup.visible;
    const prevMirrorVisible = mirrorGroup.visible;

    monitorGroup.visible = false;
    mirrorGroup.visible = false;
    securityHelper.visible = false;

    if (displayEnabled.monitor) {
      world.background = new THREE.Color(0x0c0c14);
      renderer.setRenderTarget(securityTarget);
      renderer.clear();
      renderer.render(world, securityCamera);
    }

    if (displayEnabled.mirror) {
      updateMirrorCamera(camera, mirrorCamera);
      world.background = new THREE.Color(0x101018);
      renderer.setRenderTarget(mirrorTarget);
      renderer.clear();
      renderer.render(world, mirrorCamera);
    }

    if (displayEnabled.minimap) {
      world.background = new THREE.Color(0x181820);
      renderer.setRenderTarget(minimapTarget);
      renderer.clear();
      renderer.render(world, minimapCamera);
    }

    renderer.setRenderTarget(null);
    world.background = prevBackground;
    monitorGroup.visible = prevMonitorVisible && showMonitorMesh && displayEnabled.monitor;
    mirrorGroup.visible = prevMirrorVisible && showMirrorMesh && displayEnabled.mirror;
    securityHelper.visible = showSecurityHelper;
  }

  function tick() {
    frameId = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    centerpiece.rotation.x = t * 0.45;
    centerpiece.rotation.y = t * 0.62;
    props.children.forEach((child, i) => {
      if (child !== centerpiece) child.rotation.y = t * (0.25 + i * 0.08);
    });
    rim.position.x = Math.sin(t * 0.7) * 3.5;
    rim.position.z = Math.cos(t * 0.5) * 2.5;

    controls.update();

    renderOffscreenPasses();

    renderer.clear();
    renderer.render(world, camera);

    if (displayEnabled.minimap) {
      minimapPanel.material.opacity = minimapOpacity;
      renderer.clearDepth();
      renderer.render(overlayScene, overlayCamera);
    }

    pushHud();
  }
  tick();
  pushHud();

  return {
    setDisplayEnabled(id, value) {
      if (!(id in displayEnabled) || displayEnabled[id] === value) return;
      displayEnabled[id] = value;
      pushHud();
    },
    setRtPreset(id) {
      if (id === rtPresetId) return;
      if (!RT_PRESETS.some((p) => p.id === id)) return;
      rtPresetId = id;
      applyRtPreset(id);
      pushHud();
    },
    setShowSecurityHelper(value) {
      if (value === showSecurityHelper) return;
      showSecurityHelper = value;
      securityHelper.visible = value;
      pushHud();
    },
    setShowMonitorMesh(value) {
      if (value === showMonitorMesh) return;
      showMonitorMesh = value;
      monitorGroup.visible = value;
      pushHud();
    },
    setShowMirrorMesh(value) {
      if (value === showMirrorMesh) return;
      showMirrorMesh = value;
      mirrorGroup.visible = value;
      pushHud();
    },
    setMinimapOpacity(value) {
      const next = Math.max(0.2, Math.min(1, value));
      if (next === minimapOpacity) return;
      minimapOpacity = next;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      securityTarget.dispose();
      mirrorTarget.dispose();
      minimapTarget.dispose();
      world.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
