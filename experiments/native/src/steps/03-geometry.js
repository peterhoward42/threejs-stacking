import * as THREE from 'three';

export const meta = {
  step: 3,
  title: 'Built-in geometry and BufferGeometry anatomy',
  description:
    'Gallery of primitive geometries with one material each. Select a mesh to inspect attributes (position, normal, uv, index) and colour vertices or normals to reveal structure.',
};

const PRIMITIVES = [
  {
    id: 'box',
    label: 'BoxGeometry',
    color: 0xf5c542,
    position: [-3.3, 0.55, 0],
    createGeometry: () => new THREE.BoxGeometry(1, 1, 1, 2, 2, 2),
  },
  {
    id: 'sphere',
    label: 'SphereGeometry',
    color: 0x42c9f5,
    position: [-1.1, 0.55, 0],
    createGeometry: () => new THREE.SphereGeometry(0.55, 24, 16),
  },
  {
    id: 'cylinder',
    label: 'CylinderGeometry',
    color: 0xf542c9,
    position: [1.1, 0.55, 0],
    createGeometry: () => new THREE.CylinderGeometry(0.4, 0.4, 1.1, 24, 2),
  },
  {
    id: 'torus',
    label: 'TorusGeometry',
    color: 0x7af542,
    position: [3.3, 0.55, 0],
    createGeometry: () => new THREE.TorusGeometry(0.42, 0.16, 16, 36),
  },
  {
    id: 'plane',
    label: 'PlaneGeometry',
    color: 0xc97af5,
    position: [-2.2, 0.55, -2.4],
    createGeometry: () => new THREE.PlaneGeometry(1.2, 1.2, 4, 4),
  },
  {
    id: 'cone',
    label: 'ConeGeometry',
    color: 0xf58a42,
    position: [0, 0.55, -2.4],
    createGeometry: () => new THREE.ConeGeometry(0.48, 1.1, 24, 2),
  },
  {
    id: 'torusKnot',
    label: 'TorusKnotGeometry',
    color: 0x42f5e8,
    position: [2.2, 0.55, -2.4],
    createGeometry: () => new THREE.TorusKnotGeometry(0.38, 0.12, 96, 12),
  },
  {
    id: 'icosahedron',
    label: 'IcosahedronGeometry',
    color: 0xf0f0f8,
    position: [0, 0.55, 2.4],
    createGeometry: () => new THREE.IcosahedronGeometry(0.58, 1),
  },
];

function vec3FromBuffer(attr, i) {
  return { x: attr.getX(i), y: attr.getY(i), z: attr.getZ(i) };
}

function vec2FromBuffer(attr, i) {
  return { x: attr.getX(i), y: attr.getY(i) };
}

function inspectGeometry(geometry) {
  const attributes = {};
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    attributes[name] = {
      itemSize: attr.itemSize,
      count: attr.count,
      normalized: attr.normalized,
    };
  }

  const samples = {};
  const position = geometry.attributes.position;
  if (position) {
    samples.position = [];
    for (let i = 0; i < Math.min(3, position.count); i++) {
      samples.position.push(vec3FromBuffer(position, i));
    }
  }

  const normal = geometry.attributes.normal;
  if (normal) {
    samples.normal = [];
    for (let i = 0; i < Math.min(3, normal.count); i++) {
      samples.normal.push(vec3FromBuffer(normal, i));
    }
  }

  const uv = geometry.attributes.uv;
  if (uv) {
    samples.uv = [];
    for (let i = 0; i < Math.min(3, uv.count); i++) {
      samples.uv.push(vec2FromBuffer(uv, i));
    }
  }

  const index = geometry.index;
  const indexSamples = index
    ? Array.from({ length: Math.min(9, index.count) }, (_, i) => index.getX(i))
    : null;

  return {
    type: geometry.type,
    attributes,
    index: index ? { count: index.count, itemSize: index.itemSize } : null,
    indexSamples,
    drawRange: {
      start: geometry.drawRange.start,
      count: geometry.drawRange.count,
    },
    samples,
  };
}

function applyDisplayMode(mesh, displayMode) {
  const geometry = mesh.geometry;
  const material = mesh.material;

  geometry.deleteAttribute('color');
  material.vertexColors = false;
  material.color.setHex(mesh.userData.baseColor);
  material.emissive.setHex(0x000000);
  material.emissiveIntensity = 0;

  if (displayMode === 'material') {
    return;
  }

  const position = geometry.attributes.position;
  if (!position) return;

  const count = position.count;
  const colors = new Float32Array(count * 3);

  if (displayMode === 'vertices') {
    geometry.computeBoundingBox();
    const { min } = geometry.boundingBox;
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = (position.getX(i) - min.x) / (size.x || 1);
      colors[i * 3 + 1] = (position.getY(i) - min.y) / (size.y || 1);
      colors[i * 3 + 2] = (position.getZ(i) - min.z) / (size.z || 1);
    }
  } else if (displayMode === 'normals') {
    const normal = geometry.attributes.normal;
    if (!normal) return;
    for (let i = 0; i < count; i++) {
      colors[i * 3] = normal.getX(i) * 0.5 + 0.5;
      colors[i * 3 + 1] = normal.getY(i) * 0.5 + 0.5;
      colors[i * 3 + 2] = normal.getZ(i) * 0.5 + 0.5;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  material.vertexColors = true;
}

function updateSelectionHighlight(mesh, selected) {
  const material = mesh.material;
  if (selected) {
    material.emissive.setHex(mesh.userData.baseColor);
    material.emissiveIntensity = 0.22;
  } else {
    material.emissive.setHex(0x000000);
    material.emissiveIntensity = 0;
  }
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 4.2, 9.5);
  camera.lookAt(0, 0.35, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);

  const meshes = new Map();
  const meshList = [];

  for (const spec of PRIMITIVES) {
    const geometry = spec.createGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.45,
      metalness: 0.08,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = spec.id;
    mesh.position.set(...spec.position);
    mesh.userData.baseColor = spec.color;
    mesh.userData.spec = spec;
    scene.add(mesh);
    meshes.set(spec.id, mesh);
    meshList.push(mesh);
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  scene.add(new THREE.GridHelper(16, 32, 0x3a3a4a, 0x252530));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
  keyLight.position.set(4, 8, 6);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  let selectedId = PRIMITIVES[0].id;
  let displayMode = 'material';
  let frameId;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function getSelectedMesh() {
    return meshes.get(selectedId) ?? meshList[0];
  }

  function applyDisplayToAll() {
    for (const mesh of meshList) {
      applyDisplayMode(mesh, mesh === getSelectedMesh() ? displayMode : 'material');
      updateSelectionHighlight(mesh, mesh === getSelectedMesh());
    }
  }

  function pushHud() {
    const selected = getSelectedMesh();
    const spec = selected.userData.spec;
    onHudUpdate?.({
      selectedId,
      displayMode,
      primitives: PRIMITIVES.map((p) => ({ id: p.id, label: p.label })),
      selected: {
        id: spec.id,
        label: spec.label,
        geometry: inspectGeometry(selected.geometry),
      },
    });
  }

  function pick(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshList, false);
    if (hits.length > 0) {
      selectedId = hits[0].object.name;
      applyDisplayToAll();
    }
  }

  function onPointerDown(event) {
    pick(event.clientX, event.clientY);
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);

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
  applyDisplayToAll();

  function animate() {
    frameId = requestAnimationFrame(animate);

    const t = performance.now() * 0.001;
    for (const mesh of meshList) {
      mesh.rotation.y = t * 0.35 + mesh.position.x * 0.08;
      if (mesh.userData.spec.id === 'plane') {
        mesh.rotation.x = -Math.PI / 2 + 0.35;
      }
    }

    pushHud();
    renderer.render(scene, camera);
  }
  animate();

  return {
    setSelectedId(id) {
      if (!meshes.has(id)) return;
      selectedId = id;
      applyDisplayToAll();
    },
    setDisplayMode(mode) {
      displayMode = mode;
      applyDisplayToAll();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);

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
