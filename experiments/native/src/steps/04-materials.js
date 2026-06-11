import * as THREE from 'three';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(4);


const BASE_COLOR = 0xf5c542;
const GRID_COLS = 4;
const GRID_SPACING = 2.85;

const MATERIAL_SPECS = [
  {
    id: 'basic',
    label: 'MeshBasicMaterial',
    note: 'Unlit — flat colour, ignores lights.',
    create: () => new THREE.MeshBasicMaterial({ color: BASE_COLOR }),
  },
  {
    id: 'lambert',
    label: 'MeshLambertMaterial',
    note: 'Diffuse only — no specular highlights.',
    create: () => new THREE.MeshLambertMaterial({ color: BASE_COLOR }),
  },
  {
    id: 'phong',
    label: 'MeshPhongMaterial',
    note: 'Classic Blinn-Phong specular highlights.',
    create: () =>
      new THREE.MeshPhongMaterial({
        color: BASE_COLOR,
        shininess: 80,
        specular: 0x444444,
      }),
  },
  {
    id: 'standard',
    label: 'MeshStandardMaterial',
    note: 'Metallic-roughness PBR — default for most assets.',
    create: () =>
      new THREE.MeshStandardMaterial({
        color: BASE_COLOR,
        roughness: 0.35,
        metalness: 0.15,
      }),
  },
  {
    id: 'physical',
    label: 'MeshPhysicalMaterial',
    note: 'Extends Standard with clearcoat and other PBR extras.',
    create: () =>
      new THREE.MeshPhysicalMaterial({
        color: BASE_COLOR,
        roughness: 0.35,
        metalness: 0.15,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
      }),
  },
  {
    id: 'normal',
    label: 'MeshNormalMaterial',
    note: 'Encodes surface normal as RGB — ignores albedo and lights.',
    create: () => new THREE.MeshNormalMaterial(),
  },
  {
    id: 'matcap',
    label: 'MeshMatcapMaterial',
    note: 'Shaded from a matcap texture — no real-time lights needed.',
    create: (matcap) => new THREE.MeshMatcapMaterial({ color: BASE_COLOR, matcap }),
  },
];

function createMatcapTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size * 0.34,
    size * 0.32,
    size * 0.04,
    size * 0.5,
    size * 0.52,
    size * 0.52,
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.35, '#f5c542');
  gradient.addColorStop(0.72, '#8a5a18');
  gradient.addColorStop(1, '#1a1208');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(17, 17, 24, 0.82)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#c8c8d8';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function gridPosition(index, total, cols, spacing) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const rowCount = Math.ceil(total / cols);
  const itemsInRow = row === rowCount - 1 ? total - row * cols : cols;

  return {
    x: (col - (itemsInRow - 1) * 0.5) * spacing,
    y: 0.72,
    z: (row - (rowCount - 1) * 0.5) * spacing,
  };
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 5.8, 10.5);
  camera.lookAt(0, 0.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);

  const sharedGeometry = new THREE.TorusKnotGeometry(0.42, 0.14, 128, 24);
  const matcapTexture = createMatcapTexture();
  const meshes = [];
  const labelTextures = [];

  for (let i = 0; i < MATERIAL_SPECS.length; i++) {
    const spec = MATERIAL_SPECS[i];
    const material =
      spec.id === 'matcap' ? spec.create(matcapTexture) : spec.create();
    const mesh = new THREE.Mesh(sharedGeometry, material);
    const pos = gridPosition(i, MATERIAL_SPECS.length, GRID_COLS, GRID_SPACING);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.userData.spec = spec;
    scene.add(mesh);
    meshes.push(mesh);

    const labelTexture = createLabelTexture(spec.label.replace('Material', ''));
    labelTextures.push(labelTexture);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(2.15, 0.48),
      new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    label.position.set(pos.x, 0.08, pos.z + 0.95);
    label.rotation.x = -Math.PI / 2;
    scene.add(label);
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 14),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  scene.add(new THREE.GridHelper(18, 36, 0x3a3a4a, 0x252530));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
  keyLight.position.set(5, 9, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.35);
  fillLight.position.set(-6, 4, -3);
  scene.add(fillLight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  const rimLight = new THREE.PointLight(0xff8844, 2.2, 18);
  rimLight.position.set(-2, 2.5, -4);
  scene.add(rimLight);

  let wireframe = false;
  let frameId;

  function applyWireframe(enabled) {
    for (const mesh of meshes) {
      mesh.material.wireframe = enabled;
    }
  }

  function pushHud() {
    onHudUpdate?.({
      wireframe,
      materials: MATERIAL_SPECS.map((spec) => ({
        id: spec.id,
        label: spec.label,
        note: spec.note,
      })),
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
  pushHud();

  function animate() {
    frameId = requestAnimationFrame(animate);

    const t = performance.now() * 0.001;
    for (const mesh of meshes) {
      mesh.rotation.x = t * 0.28;
      mesh.rotation.y = t * 0.42;
    }

    pushHud();
    renderer.render(scene, camera);
  }
  animate();

  return {
    setWireframe(enabled) {
      wireframe = enabled;
      applyWireframe(enabled);
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      sharedGeometry.dispose();
      matcapTexture.dispose();
      labelTextures.forEach((t) => t.dispose());

      const materials = new Set();
      scene.traverse((obj) => {
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => materials.add(m));
        }
        if (obj.geometry && obj.geometry !== sharedGeometry) {
          obj.geometry.dispose();
        }
      });
      materials.forEach((m) => m.dispose());

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
