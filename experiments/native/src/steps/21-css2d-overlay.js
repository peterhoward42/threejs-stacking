import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const meta = {
  step: 21,
  title: 'CSS2DRenderer overlay',
  description:
    'HTML labels anchored to objects via `CSS2DObject`, compared with canvas `Sprite` text. Toggle depth testing and an occluder to see DOM vs WebGL trade-offs.',
};

const MARKERS = [
  { id: 'alpha', label: 'Alpha node', detail: 'front row', color: 0x42c9f5, position: [-4.5, 0.55, 2.2] },
  { id: 'beta', label: 'Beta node', detail: 'front row', color: 0xf5c542, position: [-1.5, 0.55, 2.2] },
  { id: 'gamma', label: 'Gamma node', detail: 'front row', color: 0xf5427a, position: [1.5, 0.55, 2.2] },
  { id: 'delta', label: 'Delta node', detail: 'behind wall', color: 0x9b6bff, position: [-3, 0.55, -2.8] },
  { id: 'epsilon', label: 'Epsilon node', detail: 'behind wall', color: 0x5ce0a8, position: [3, 0.55, -2.8] },
];

const LABEL_MODES = [
  { id: 'css2d', label: 'CSS2D (DOM HTML)' },
  { id: 'sprite', label: 'Sprite (canvas texture)' },
  { id: 'both', label: 'Both — side by side' },
  { id: 'none', label: 'None — meshes only' },
];

function ensureLabelStyles() {
  const id = 'native-css2d-label-styles';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .css2d-label {
      padding: 0.28rem 0.55rem;
      border-radius: 0.35rem;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(18, 18, 28, 0.88);
      color: #e8e8f4;
      font: 600 0.72rem/1.2 system-ui, sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
      transform: translate(-50%, -100%);
      user-select: none;
    }
    .css2d-label .detail {
      display: block;
      margin-top: 0.12rem;
      font-weight: 400;
      font-size: 0.62rem;
      color: #a8a8bc;
    }
    .css2d-label.interactive {
      pointer-events: auto;
      cursor: pointer;
      border-color: rgba(90, 200, 255, 0.55);
    }
    .css2d-label.interactive:hover {
      background: rgba(30, 42, 58, 0.95);
    }
    .css2d-label.pinged {
      border-color: rgba(245, 197, 66, 0.9);
      box-shadow: 0 0 0 2px rgba(245, 197, 66, 0.25);
    }
  `;
  document.head.appendChild(style);
}

function createSpriteLabelTexture(text, subtext, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = subtext ? 96 : 72;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(18, 18, 28, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  const r = 12;
  const w = canvas.width;
  const h = canvas.height;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent ?? '#e8e8f4';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, subtext ? h * 0.38 : h / 2);

  if (subtext) {
    ctx.fillStyle = '#a8a8bc';
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillText(subtext, w / 2, h * 0.72);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCss2dLabel(marker, { interactive, onPing }) {
  const el = document.createElement('div');
  el.className = interactive ? 'css2d-label interactive' : 'css2d-label';
  el.innerHTML = `${marker.label}<span class="detail">${marker.detail}</span>`;

  if (interactive) {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      el.classList.add('pinged');
      onPing?.(marker.id);
      window.setTimeout(() => el.classList.remove('pinged'), 700);
    });
  }

  const object = new CSS2DObject(el);
  object.position.set(0, 1.05, 0);
  object.name = `${marker.id}-css2d`;
  return { object, element: el };
}

function createSpriteLabel(marker, depthTest) {
  const accent = `#${new THREE.Color(marker.color).getHexString()}`;
  const map = createSpriteLabelTexture(marker.label, marker.detail, accent);
  const material = new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthTest,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = map.image.width / map.image.height;
  sprite.scale.set(1.55 * aspect, 1.55, 1);
  sprite.position.set(0, 1.05, 0);
  sprite.name = `${marker.id}-sprite`;
  sprite.renderOrder = depthTest ? 0 : 12;
  return { sprite, map, material };
}

function buildScene() {
  ensureLabelStyles();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 16),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(20, 40, 0x3a3a4a, 0x252530));

  scene.add(new THREE.AmbientLight(0x404060, 0.45));

  const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
  key.position.set(5, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  const rim = new THREE.PointLight(0x6688ff, 0.4, 18);
  rim.position.set(-4, 3, 2);
  scene.add(rim);

  const occluder = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 2.4, 7.5),
    new THREE.MeshStandardMaterial({
      color: 0x2a3040,
      roughness: 0.55,
      metalness: 0.12,
      transparent: true,
      opacity: 0.82,
    }),
  );
  occluder.position.set(0, 1.2, 0);
  occluder.castShadow = true;
  occluder.receiveShadow = true;
  occluder.name = 'occluder-wall';
  scene.add(occluder);

  const markerRoot = new THREE.Group();
  markerRoot.name = 'markers';
  scene.add(markerRoot);

  const markers = MARKERS.map((spec) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        roughness: 0.42,
        metalness: 0.1,
        flatShading: true,
      }),
    );
    mesh.position.set(...spec.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = spec.id;
    markerRoot.add(mesh);
    return { ...spec, mesh };
  });

  return { scene, occluder, markerRoot, markers };
}

function applyLabelVisibility(markers, labelMode, css2dVisible, spriteVisible) {
  markers.forEach((entry) => {
    if (entry.css2d) entry.css2d.visible = css2dVisible;
    if (entry.sprite) entry.sprite.visible = spriteVisible;
  });
}

function labelModeFlags(labelMode) {
  return {
    css2d: labelMode === 'css2d' || labelMode === 'both',
    sprite: labelMode === 'sprite' || labelMode === 'both',
  };
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, occluder, markers } = buildScene();

  let labelMode = 'both';
  let spriteDepthTest = true;
  let showOccluder = true;
  let css2dPointerEvents = true;
  let animateMarkers = true;
  let lastPing = null;

  markers.forEach((entry, index) => {
    const interactive = index === 0;
    const { object: css2d, element } = createCss2dLabel(entry, {
      interactive,
      onPing: (id) => {
        lastPing = { id, at: performance.now() };
        pushHud();
      },
    });
    entry.mesh.add(css2d);
    entry.css2d = css2d;
    entry.css2dElement = element;
    entry.css2dInteractive = interactive;

    const { sprite, map, material } = createSpriteLabel(entry, spriteDepthTest);
    sprite.position.x = labelMode === 'both' ? 0.95 : 0;
    entry.mesh.add(sprite);
    entry.sprite = sprite;
    entry.spriteMap = map;
    entry.spriteMaterial = material;
  });

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
  camera.position.set(0, 3.4, 9.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'css2d-overlay';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.7, 0.5);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 4;
  controls.maxDistance = 22;
  controls.update();

  function syncLabels() {
    const { css2d, sprite } = labelModeFlags(labelMode);
    applyLabelVisibility(markers, labelMode, css2d, sprite);

    markers.forEach((entry) => {
      if (entry.sprite) {
        entry.sprite.position.x = labelMode === 'both' ? 0.95 : 0;
        entry.spriteMaterial.depthTest = spriteDepthTest;
        entry.spriteMaterial.depthWrite = false;
        entry.sprite.renderOrder = spriteDepthTest ? 0 : 12;
        entry.spriteMaterial.needsUpdate = true;
      }
      if (entry.css2dElement) {
        entry.css2dElement.style.pointerEvents =
          css2dPointerEvents && entry.css2dInteractive ? 'auto' : 'none';
      }
    });

    occluder.visible = showOccluder;
    labelRenderer.domElement.style.display = css2d ? 'block' : 'none';
  }

  function countDomLabels() {
    return labelRenderer.domElement.querySelectorAll('.css2d-label').length;
  }

  function pushHud() {
    const { css2d, sprite } = labelModeFlags(labelMode);
    const pingAgeMs = lastPing ? performance.now() - lastPing.at : null;

    onHudUpdate?.({
      labelModes: LABEL_MODES,
      labelMode,
      spriteDepthTest,
      showOccluder,
      css2dPointerEvents,
      animateMarkers,
      markers: markers.map((entry) => ({
        id: entry.id,
        label: entry.label,
        detail: entry.detail,
        position: {
          x: entry.mesh.position.x,
          y: entry.mesh.position.y,
          z: entry.mesh.position.z,
        },
        interactive: entry.css2dInteractive,
      })),
      overlay: {
        css2dVisible: css2d,
        spriteVisible: sprite,
        domLabelCount: css2d ? countDomLabels() : 0,
        css2dRendererElement: 'CSS2DRenderer.domElement (sibling of WebGL canvas)',
      },
      lastPing: lastPing && pingAgeMs < 3000 ? { ...lastPing, ageMs: pingAgeMs } : null,
      renderInfo: {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        points: renderer.info.render.points,
        lines: renderer.info.render.lines,
      },
      notes: [
        {
          id: 'css2d',
          label: 'CSS2DObject + CSS2DRenderer',
          when: 'Projects HTML into screen space after the WebGL pass — rich DOM/CSS, clicks, and accessibility; no GPU depth test.',
        },
        {
          id: 'sprite',
          label: 'Sprite + CanvasTexture',
          when: 'Canvas-only billboard text in the WebGL layer — respects depthTest when enabled; fewer DOM nodes, limited styling.',
        },
        {
          id: 'textgeom',
          label: 'TextGeometry / troika (not shown)',
          when: 'Meshes real 3D glyphs in the scene — highest GPU cost, best world-space integration; needs font assets or troika-three-text.',
        },
        {
          id: 'occluder',
          label: 'Occluder wall',
          when: 'Orbit behind the wall: sprites with depthTest hide; CSS2D and depthTest:false sprites stay on top.',
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
    labelRenderer.setSize(clientWidth, clientHeight);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  syncLabels();

  const clock = new THREE.Clock();
  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (animateMarkers) {
      markers.forEach((entry, i) => {
        entry.mesh.rotation.y = elapsed * 0.45 + i * 0.55;
        entry.mesh.position.y = 0.55 + Math.sin(elapsed * 1.1 + i) * 0.06;
      });
    }

    controls.update();

    renderer.info.reset();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    pushHud();
  }

  tick();
  pushHud();

  return {
    setLabelMode(value) {
      if (labelMode === value) return;
      labelMode = value;
      syncLabels();
      pushHud();
    },
    setSpriteDepthTest(value) {
      if (spriteDepthTest === value) return;
      spriteDepthTest = value;
      syncLabels();
      pushHud();
    },
    setShowOccluder(value) {
      if (showOccluder === value) return;
      showOccluder = value;
      syncLabels();
      pushHud();
    },
    setCss2dPointerEvents(value) {
      if (css2dPointerEvents === value) return;
      css2dPointerEvents = value;
      syncLabels();
      pushHud();
    },
    setAnimateMarkers(value) {
      if (animateMarkers === value) return;
      animateMarkers = value;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      markers.forEach((entry) => {
        entry.mesh.remove(entry.css2d);
        entry.mesh.remove(entry.sprite);
        entry.spriteMap?.dispose();
        entry.spriteMaterial?.dispose();
        entry.mesh.geometry.dispose();
        entry.mesh.material.dispose();
      });

      scene.traverse((obj) => {
        if (!obj.isMesh || obj === occluder) return;
        if (markers.some((m) => m.mesh === obj)) return;
        obj.geometry?.dispose?.();
        obj.material?.dispose?.();
      });

      occluder.geometry.dispose();
      occluder.material.dispose();

      renderer.dispose();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
    },
  };
}
