import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(24);


const LAYOUTS = [
  {
    id: 'quad',
    label: 'Quad editor',
    hint: 'Four scissored regions — perspective plus top, front, and side orthographic cameras.',
  },
  {
    id: 'pip',
    label: 'Picture-in-picture',
    hint: 'Full perspective pass with a scissored ortho mini-map in the corner.',
  },
  {
    id: 'single',
    label: 'Single viewport',
    hint: 'One region fills the canvas; baseline before splitting the framebuffer.',
  },
];

const PIP_PRESETS = [
  { id: 'tr', label: 'Top-right', corner: 'tr' },
  { id: 'bl', label: 'Bottom-left', corner: 'bl' },
];

const ORTHO_FRUSTUM = 6;

function vec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function setOrthoFrustum(camera, aspect, size = ORTHO_FRUSTUM) {
  const halfH = size / 2;
  const halfW = halfH * aspect;
  camera.left = -halfW;
  camera.right = halfW;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.updateProjectionMatrix();
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.9, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  scene.add(floor);
  scene.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x252530));

  const props = new THREE.Group();
  props.name = 'props';

  const centerpiece = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.55, 0.18, 120, 16),
    new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.35, metalness: 0.15 }),
  );
  centerpiece.position.set(0, 1.05, 0);
  centerpiece.castShadow = true;
  centerpiece.name = 'torus-knot';
  props.add(centerpiece);

  const boxSpecs = [
    { color: 0x42c9f5, pos: [-2.1, 0.35, 1.6], rot: 0.35 },
    { color: 0xf542c9, pos: [2.2, 0.45, -1.1], rot: -0.45 },
    { color: 0x7af542, pos: [-1.2, 0.28, -2.2], rot: 0.75 },
    { color: 0xc97af5, pos: [1.8, 0.32, 2.0], rot: 1.1 },
  ];
  boxSpecs.forEach((spec, i) => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.65, 0.65),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.42, metalness: 0.1 }),
    );
    box.position.set(...spec.pos);
    box.rotation.y = spec.rot;
    box.castShadow = true;
    box.name = `box-${i}`;
    props.add(box);
  });

  const axisRoot = new THREE.Group();
  axisRoot.name = 'axis-gizmo';
  const axisLen = 1.4;
  const axisSpecs = [
    { color: 0xff5555, axis: 'x' },
    { color: 0x55ff55, axis: 'y' },
    { color: 0x5599ff, axis: 'z' },
  ];
  axisSpecs.forEach(({ color, axis }) => {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, axisLen, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 }),
    );
    if (axis === 'x') {
      shaft.rotation.z = -Math.PI / 2;
      shaft.position.x = axisLen / 2;
    } else if (axis === 'y') {
      shaft.position.y = axisLen / 2;
    } else {
      shaft.rotation.x = Math.PI / 2;
      shaft.position.z = axisLen / 2;
    }
    axisRoot.add(shaft);
  });
  axisRoot.position.set(-2.8, 0.02, -2.8);
  props.add(axisRoot);

  scene.add(props);

  scene.add(new THREE.AmbientLight(0x404060, 0.45));
  const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
  key.position.set(5, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  const rim = new THREE.PointLight(0x6688ff, 0.5, 14);
  rim.position.set(-3, 3.5, 2);
  scene.add(rim);

  return { scene, props, centerpiece, rim, axisRoot };
}

function buildCameras() {
  const main = new THREE.PerspectiveCamera(48, 1, 0.1, 50);
  main.position.set(5.5, 3.4, 6.5);
  main.name = 'perspective-main';

  const top = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  top.position.set(0, 11, 0);
  top.lookAt(0, 0, 0);
  top.up.set(0, 0, -1);
  top.name = 'ortho-top';

  const front = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  front.position.set(0, 2.5, 11);
  front.lookAt(0, 1, 0);
  front.name = 'ortho-front';

  const side = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  side.position.set(11, 2.5, 0);
  side.lookAt(0, 1, 0);
  side.name = 'ortho-side';

  return { main, top, front, side };
}

function pipRect(width, height, corner, scale = 0.28) {
  const w = Math.max(120, Math.floor(width * scale));
  const h = Math.max(90, Math.floor(height * scale));
  const margin = Math.floor(Math.min(width, height) * 0.02);
  if (corner === 'bl') {
    return { x: margin, y: margin, width: w, height: h };
  }
  return { x: width - w - margin, y: height - h - margin, width: w, height: h };
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, props, centerpiece, rim } = buildScene();
  const cameras = buildCameras();

  const helpers = {
    main: new THREE.CameraHelper(cameras.main),
    top: new THREE.CameraHelper(cameras.top),
    front: new THREE.CameraHelper(cameras.front),
    side: new THREE.CameraHelper(cameras.side),
  };
  Object.values(helpers).forEach((helper) => scene.add(helper));

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(cameras.main, renderer.domElement);
  controls.target.set(0, 0.9, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3;
  controls.maxDistance = 18;
  controls.update();

  let layoutId = 'quad';
  let pipCorner = 'tr';
  let scissorTest = true;
  let showHelpers = true;
  let animateScene = true;
  let clearBetweenRegions = true;
  let lastViewports = [];

  function applyHelperVisibility() {
    helpers.main.visible = showHelpers;
    helpers.top.visible = showHelpers;
    helpers.front.visible = showHelpers;
    helpers.side.visible = showHelpers;
  }
  applyHelperVisibility();

  function renderRegion({ x, y, width, height, camera, label, cameraType }) {
    if (width <= 0 || height <= 0) return;

    renderer.setViewport(x, y, width, height);
    renderer.setScissor(x, y, width, height);

    if (camera.isPerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      helpers.main.update();
    } else {
      setOrthoFrustum(camera, width / height);
      if (camera === cameras.top) helpers.top.update();
      if (camera === cameras.front) helpers.front.update();
      if (camera === cameras.side) helpers.side.update();
    }

    if (clearBetweenRegions) {
      renderer.clear();
    }
    renderer.render(scene, camera);

    lastViewports.push({
      label,
      cameraType,
      x,
      y,
      width,
      height,
      aspect: width / height,
    });
  }

  function renderFrame() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    lastViewports = [];

    renderer.setScissorTest(scissorTest);

    if (layoutId === 'single') {
      renderRegion({
        x: 0,
        y: 0,
        width,
        height,
        camera: cameras.main,
        label: 'Perspective (full)',
        cameraType: 'PerspectiveCamera',
      });
      renderer.setScissorTest(false);
      return;
    }

    if (layoutId === 'pip') {
      renderRegion({
        x: 0,
        y: 0,
        width,
        height,
        camera: cameras.main,
        label: 'Perspective (main)',
        cameraType: 'PerspectiveCamera',
      });

      const inset = pipRect(width, height, pipCorner);
      renderRegion({
        ...inset,
        camera: cameras.top,
        label: 'Top ortho (PiP)',
        cameraType: 'OrthographicCamera',
      });
      renderer.setScissorTest(false);
      return;
    }

    const halfW = Math.floor(width / 2);
    const halfH = Math.floor(height / 2);
    const remW = width - halfW;
    const remH = height - halfH;

    renderRegion({
      x: 0,
      y: halfH,
      width: halfW,
      height: remH,
      camera: cameras.main,
      label: 'Perspective',
      cameraType: 'PerspectiveCamera',
    });
    renderRegion({
      x: halfW,
      y: halfH,
      width: remW,
      height: remH,
      camera: cameras.top,
      label: 'Top',
      cameraType: 'OrthographicCamera',
    });
    renderRegion({
      x: 0,
      y: 0,
      width: halfW,
      height: halfH,
      camera: cameras.front,
      label: 'Front',
      cameraType: 'OrthographicCamera',
    });
    renderRegion({
      x: halfW,
      y: 0,
      width: remW,
      height: halfH,
      camera: cameras.side,
      label: 'Side',
      cameraType: 'OrthographicCamera',
    });

    renderer.setScissorTest(false);
  }

  function pushHud() {
    onHudUpdate?.({
      layouts: LAYOUTS,
      layoutId,
      pipPresets: PIP_PRESETS,
      pipCorner,
      scissorTest,
      showHelpers,
      animateScene,
      clearBetweenRegions,
      viewports: lastViewports,
      mainCamera: {
        position: vec3(cameras.main.position),
        fov: cameras.main.fov,
        aspect: cameras.main.aspect,
      },
      notes: [
        {
          id: 'viewport',
          label: 'setViewport(x, y, w, h)',
          when: 'Maps normalized device coords to a canvas sub-rectangle; origin is bottom-left.',
        },
        {
          id: 'scissor',
          label: 'setScissor(x, y, w, h)',
          when: 'Clips fragment output to the same rectangle — pair with setScissorTest(true).',
        },
        {
          id: 'scissor-off',
          label: 'setScissorTest(false)',
          when: 'Disables clipping — quad regions bleed into each other (toggle to compare).',
        },
        {
          id: 'clear',
          label: 'renderer.clear() per region',
          when: 'Clears color/depth inside the active viewport before each camera pass.',
        },
        {
          id: 'aspect',
          label: 'Per-region aspect',
          when: 'Update each camera projection from the region width / height before rendering.',
        },
      ],
    });
  }

  function resize() {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const clock = new THREE.Clock();
  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    if (animateScene) {
      centerpiece.rotation.x = t * 0.42;
      centerpiece.rotation.y = t * 0.58;
      props.children.forEach((child, i) => {
        if (child === centerpiece) return;
        child.rotation.y = t * (0.18 + i * 0.07);
      });
      rim.position.x = Math.sin(t * 0.65) * 3.2;
      rim.position.z = Math.cos(t * 0.48) * 2.4;
    }

    controls.update();
    renderFrame();
    pushHud();
  }

  tick();
  pushHud();

  return {
    setLayout(id) {
      if (layoutId === id) return;
      if (!LAYOUTS.some((layout) => layout.id === id)) return;
      layoutId = id;
      pushHud();
    },
    setPipCorner(corner) {
      if (pipCorner === corner) return;
      if (!PIP_PRESETS.some((preset) => preset.corner === corner)) return;
      pipCorner = corner;
      pushHud();
    },
    setScissorTest(value) {
      if (scissorTest === value) return;
      scissorTest = value;
      pushHud();
    },
    setShowHelpers(value) {
      if (showHelpers === value) return;
      showHelpers = value;
      applyHelperVisibility();
      pushHud();
    },
    setAnimateScene(value) {
      if (animateScene === value) return;
      animateScene = value;
      pushHud();
    },
    setClearBetweenRegions(value) {
      if (clearBetweenRegions === value) return;
      clearBetweenRegions = value;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      Object.values(helpers).forEach((helper) => helper.dispose());
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => mat.dispose());
        }
      });

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
