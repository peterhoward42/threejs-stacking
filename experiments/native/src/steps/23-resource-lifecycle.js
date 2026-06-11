import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(23);


const SCENE_VARIANTS = [
  {
    id: 'grid',
    label: 'Textured grid',
    hint: '24 boxes — unique `CanvasTexture` per mesh plus shared floor shadow.',
  },
  {
    id: 'rings',
    label: 'Torus ring',
    hint: '12 torus knots — unique geometry and `MeshStandardMaterial` each.',
  },
];

function disposeMaterial(material) {
  if (!material) return;
  const materials = Array.isArray(material) ? material : [material];
  for (const mat of materials) {
    for (const value of Object.values(mat)) {
      if (value?.isTexture) value.dispose();
    }
    mat.dispose();
  }
}

function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.isMesh || obj.isLine || obj.isPoints || obj.isSprite) {
      disposeMaterial(obj.material);
    }
  });
}

function countResources(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((obj) => {
    if (obj.geometry) geometries.add(obj.geometry.uuid);
    const mats = obj.material
      ? Array.isArray(obj.material)
        ? obj.material
        : [obj.material]
      : [];
    for (const mat of mats) {
      materials.add(mat.uuid);
      for (const value of Object.values(mat)) {
        if (value?.isTexture) textures.add(value.uuid);
      }
    }
  });

  return {
    geometries: geometries.size,
    materials: materials.size,
    textures: textures.size,
  };
}

function canvasTexture(hue, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const base = `hsl(${hue * 360}, 68%, 52%)`;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(size * (0.25 + i * 0.18), size * 0.5, size * 0.12, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = `canvas-${hue.toFixed(2)}`;
  return texture;
}

function buildGridContent() {
  const group = new THREE.Group();
  group.name = 'content-grid';
  const side = 6;
  const spacing = 0.72;
  const offset = ((side - 1) * spacing) / 2;

  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      const index = row * side + col;
      const hue = index / (side * side);
      const texture = canvasTexture(hue);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.42,
        metalness: 0.08,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), material);
      mesh.position.set(col * spacing - offset, 0.26, row * spacing - offset);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `box-${index}`;
      group.add(mesh);
    }
  }

  return { group, variant: SCENE_VARIANTS[0], resources: countResources(group) };
}

function buildRingsContent() {
  const group = new THREE.Group();
  group.name = 'content-rings';
  const count = 12;
  const radius = 2.4;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const hue = i / count;
    const geometry = new THREE.TorusKnotGeometry(0.28, 0.09, 64, 10, 2, 3);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.62, 0.52),
      roughness: 0.38,
      metalness: 0.18,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(Math.cos(angle) * radius, 0.55, Math.sin(angle) * radius);
    mesh.rotation.set(0.4, angle, 0.15);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `knot-${i}`;
    group.add(mesh);
  }

  return { group, variant: SCENE_VARIANTS[1], resources: countResources(group) };
}

function buildShell() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  scene.add(floor);
  scene.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x252530));

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

  const contentRoot = new THREE.Group();
  contentRoot.name = 'swappable-content';
  scene.add(contentRoot);

  return { scene, floor, contentRoot };
}

function readMemoryInfo(renderer) {
  return {
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    programs: renderer.info.programs?.length ?? 0,
  };
}

function readRenderInfo(renderer) {
  return {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    points: renderer.info.render.points,
    lines: renderer.info.render.lines,
  };
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, contentRoot } = buildShell();
  const builders = [buildGridContent, buildRingsContent];
  let builderIndex = 0;

  let disposeOnSwap = true;
  let animateContent = true;
  let swapCount = 0;
  let cleanSwapCount = 0;
  let leakSwapCount = 0;
  let leakedGroups = [];
  let lifetimeCreated = { geometries: 0, materials: 0, textures: 0 };
  let lifetimeDisposed = { geometries: 0, materials: 0, textures: 0 };

  let currentContent = null;
  let currentVariant = null;
  let currentResources = { geometries: 0, materials: 0, textures: 0 };

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
  camera.position.set(5.5, 4.2, 7.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.6, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3;
  controls.maxDistance = 22;
  controls.update();

  function mountContent({ group, variant, resources }) {
    contentRoot.clear();
    contentRoot.add(group);
    currentContent = group;
    currentVariant = variant;
    currentResources = resources;

    lifetimeCreated.geometries += resources.geometries;
    lifetimeCreated.materials += resources.materials;
    lifetimeCreated.textures += resources.textures;
  }

  function teardownContent(group, resources, mode) {
    contentRoot.remove(group);
    if (mode === 'clean') {
      disposeObject3D(group);
      lifetimeDisposed.geometries += resources.geometries;
      lifetimeDisposed.materials += resources.materials;
      lifetimeDisposed.textures += resources.textures;
      return;
    }
    leakedGroups.push({ group, resources });
  }

  function swapContent() {
    if (currentContent) {
      teardownContent(
        currentContent,
        currentResources,
        disposeOnSwap ? 'clean' : 'leak',
      );
      if (disposeOnSwap) cleanSwapCount += 1;
      else leakSwapCount += 1;
    }

    builderIndex = (builderIndex + 1) % builders.length;
    mountContent(builders[builderIndex]());
    swapCount += 1;
    pushHud();
  }

  function disposeAllLeaked() {
    for (const entry of leakedGroups) {
      disposeObject3D(entry.group);
      lifetimeDisposed.geometries += entry.resources.geometries;
      lifetimeDisposed.materials += entry.resources.materials;
      lifetimeDisposed.textures += entry.resources.textures;
    }
    leakedGroups = [];
    pushHud();
  }

  function pushHud() {
    const leakedTotals = leakedGroups.reduce(
      (acc, entry) => ({
        geometries: acc.geometries + entry.resources.geometries,
        materials: acc.materials + entry.resources.materials,
        textures: acc.textures + entry.resources.textures,
      }),
      { geometries: 0, materials: 0, textures: 0 },
    );

    onHudUpdate?.({
      sceneVariants: SCENE_VARIANTS,
      currentVariant,
      disposeOnSwap,
      animateContent,
      swapCount,
      cleanSwapCount,
      leakSwapCount,
      leakedGroupCount: leakedGroups.length,
      leakedTotals,
      currentResources,
      lifetimeCreated,
      lifetimeDisposed,
      memoryInfo: readMemoryInfo(renderer),
      renderInfo: readRenderInfo(renderer),
      notes: [
        {
          id: 'geometry',
          label: 'geometry.dispose()',
          when: 'Frees GPU buffer for that geometry; remove from scene first if still attached.',
        },
        {
          id: 'material',
          label: 'material.dispose()',
          when: 'Releases shader program bindings; dispose attached textures separately when needed.',
        },
        {
          id: 'texture',
          label: 'texture.dispose()',
          when: 'Canvas and image textures stay in `renderer.info.memory.textures` until disposed.',
        },
        {
          id: 'info-memory',
          label: 'renderer.info.memory',
          when: 'Live WebGL resource counts — compare after leak vs clean swaps.',
        },
        {
          id: 'info-render',
          label: 'renderer.info.render',
          when: 'Per-frame draw stats; call `renderer.info.reset()` before render for isolated counts.',
        },
        {
          id: 'hot-reload',
          label: 'App.svelte onMount cleanup',
          when: 'Returning `active?.dispose()` from onMount mirrors leaving a step — always tear down the previous mount.',
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

  mountContent(builders[0]());

  const clock = new THREE.Clock();
  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    const elapsed = clock.getElapsedTime();

    if (animateContent && currentContent) {
      currentContent.rotation.y = elapsed * 0.35;
    }

    controls.update();
    renderer.info.reset();
    renderer.render(scene, camera);
    pushHud();
  }

  tick();
  pushHud();

  return {
    swapContent() {
      swapContent();
    },
    setDisposeOnSwap(value) {
      if (disposeOnSwap === value) return;
      disposeOnSwap = value;
      pushHud();
    },
    setAnimateContent(value) {
      if (animateContent === value) return;
      animateContent = value;
      pushHud();
    },
    disposeAllLeaked() {
      disposeAllLeaked();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      if (currentContent) {
        disposeObject3D(currentContent);
      }
      for (const entry of leakedGroups) {
        disposeObject3D(entry.group);
      }
      leakedGroups = [];

      scene.traverse((obj) => {
        if (!obj.isMesh || obj.parent?.name === 'swappable-content') return;
        obj.geometry?.dispose?.();
        disposeMaterial(obj.material);
      });

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
