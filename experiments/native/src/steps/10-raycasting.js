import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(10);


const MESH_SPECS = [
  { id: 'box', label: 'Box', color: 0xf5c542, geometry: () => new THREE.BoxGeometry(0.9, 0.9, 0.9) },
  {
    id: 'sphere',
    label: 'Sphere',
    color: 0x42c9f5,
    geometry: () => new THREE.SphereGeometry(0.48, 24, 16),
  },
  {
    id: 'torus',
    label: 'Torus',
    color: 0xf542c9,
    geometry: () => new THREE.TorusGeometry(0.42, 0.16, 16, 36),
  },
  {
    id: 'cone',
    label: 'Cone',
    color: 0x7af542,
    geometry: () => new THREE.ConeGeometry(0.42, 0.95, 24),
  },
];

const HOVER_EMISSIVE = 0x444444;
const SELECT_EMISSIVE = 0x886622;
const INSTANCE_HOVER = new THREE.Color(0xffcc66);
const INSTANCE_SELECT = new THREE.Color(0xff8844);

function vec2(v) {
  return { x: v.x, y: v.y };
}

function vec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function hitSummary(hit) {
  if (!hit) return null;
  const isInstanced = hit.object.isInstancedMesh;
  return {
    objectName: hit.object.name || hit.object.type,
    distance: hit.distance,
    point: vec3(hit.point),
    faceIndex: hit.faceIndex ?? null,
    instanceId: isInstanced ? hit.instanceId : null,
    uv: hit.uv ? vec2(hit.uv) : null,
    kind: isInstanced ? 'instanced' : 'mesh',
    label: isInstanced
      ? `instance ${hit.instanceId}`
      : (hit.object.userData.label ?? hit.object.name),
  };
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 64),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  floor.name = 'floor';
  scene.add(floor);
  scene.add(new THREE.GridHelper(14, 28, 0x3a3a4a, 0x252530));

  const meshGroup = new THREE.Group();
  meshGroup.name = 'individual-meshes';

  const pickMeshes = [];
  MESH_SPECS.forEach((spec, i) => {
    const mesh = new THREE.Mesh(
      spec.geometry(),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        roughness: 0.42,
        metalness: 0.08,
        emissive: 0x000000,
      }),
    );
    mesh.name = spec.id;
    mesh.userData.label = spec.label;
    mesh.userData.baseColor = spec.color;
    mesh.position.set(-3.8, 0.5 + (i % 2) * 0.15, -1.2 + i * 1.1);
    mesh.castShadow = true;
    meshGroup.add(mesh);
    pickMeshes.push(mesh);
  });
  scene.add(meshGroup);

  const gridSize = 10;
  const spacing = 0.55;
  const instanceCount = gridSize * gridSize;
  const instanced = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.38, 0.38, 0.38),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.1 }),
    instanceCount,
  );
  instanced.name = 'instance-grid';
  instanced.castShadow = true;

  const dummy = new THREE.Object3D();
  const baseColors = [];
  const color = new THREE.Color();

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const index = row * gridSize + col;
      dummy.position.set(2.2 + (col - gridSize / 2 + 0.5) * spacing, 0.22, (row - gridSize / 2 + 0.5) * spacing);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);

      const hue = (index / instanceCount) * 0.85 + 0.05;
      color.setHSL(hue, 0.55, 0.52);
      instanced.setColorAt(index, color);
      baseColors.push(color.clone());
    }
  }
  instanced.instanceMatrix.needsUpdate = true;
  if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;

  scene.add(instanced);

  scene.add(new THREE.AmbientLight(0xffffff, 0.42));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaccff, 0.32);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  return { scene, pickMeshes, instanced, baseColors };
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, pickMeshes, instanced, baseColors } = buildScene();

  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  camera.position.set(4.5, 4.2, 7.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.2, 0.45, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.update();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let pickMode = 'both';
  let logFaceOnClick = true;
  let hoverHit = null;
  let selectedHit = null;
  let hoverMeshId = null;
  let hoverInstanceId = null;
  let selectedMeshId = null;
  let selectedInstanceId = null;
  let clickLog = [];

  function pickTargets() {
    if (pickMode === 'meshes') return pickMeshes;
    if (pickMode === 'instanced') return [instanced];
    return [...pickMeshes, instanced];
  }

  function pointerToNdc(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    return { x: pointer.x, y: pointer.y };
  }

  function castAt(clientX, clientY) {
    const ndc = pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickTargets(), false);
    return { ndc, hit: hits[0] ?? null };
  }

  function clearMeshHighlight(mesh, emissive = 0x000000) {
    mesh.material.emissive.setHex(emissive);
  }

  function applyMeshHighlights() {
    for (const mesh of pickMeshes) {
      if (mesh.name === selectedMeshId) {
        clearMeshHighlight(mesh, SELECT_EMISSIVE);
      } else if (mesh.name === hoverMeshId && mesh.name !== selectedMeshId) {
        clearMeshHighlight(mesh, HOVER_EMISSIVE);
      } else {
        clearMeshHighlight(mesh, 0x000000);
      }
    }
  }

  function restoreInstanceColor(index) {
    if (index == null || index < 0) return;
    instanced.setColorAt(index, baseColors[index]);
  }

  function applyInstanceHighlights() {
    for (let i = 0; i < baseColors.length; i++) {
      if (i === selectedInstanceId) {
        instanced.setColorAt(i, INSTANCE_SELECT);
      } else if (i === hoverInstanceId && i !== selectedInstanceId) {
        instanced.setColorAt(i, INSTANCE_HOVER);
      } else {
        instanced.setColorAt(i, baseColors[i]);
      }
    }
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  }

  function applyHighlights() {
    applyMeshHighlights();
    applyInstanceHighlights();
  }

  function setHoverFromHit(hit) {
    hoverHit = hit;
    hoverMeshId = hit && !hit.object.isInstancedMesh ? hit.object.name : null;
    hoverInstanceId = hit?.object.isInstancedMesh ? hit.instanceId : null;
    applyHighlights();
  }

  function setSelectionFromHit(hit) {
    selectedHit = hit;
    selectedMeshId = hit && !hit.object.isInstancedMesh ? hit.object.name : null;
    selectedInstanceId = hit?.object.isInstancedMesh ? hit.instanceId : null;
    applyHighlights();
  }

  function pushHud(ndc) {
    onHudUpdate?.({
      pickMode,
      logFaceOnClick,
      pointerNdc: ndc ?? vec2(pointer),
      hover: hitSummary(hoverHit),
      selected: hitSummary(selectedHit),
      clickLog,
      meshOptions: MESH_SPECS.map((s) => ({ id: s.id, label: s.label })),
    });
  }

  function onPointerMove(event) {
    const { ndc, hit } = castAt(event.clientX, event.clientY);
    setHoverFromHit(hit);
    pushHud(ndc);
  }

  function onPointerDown(event) {
    const { ndc, hit } = castAt(event.clientX, event.clientY);
    setHoverFromHit(hit);
    setSelectionFromHit(hit);

    if (hit && logFaceOnClick) {
      const entry = {
        time: performance.now(),
        ...hitSummary(hit),
      };
      clickLog = [entry, ...clickLog].slice(0, 8);
      console.info('[step 10] pick', entry);
    } else if (!hit) {
      selectedHit = null;
      selectedMeshId = null;
      selectedInstanceId = null;
      applyHighlights();
    }

    pushHud(ndc);
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
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

  let frameId;
  function tick() {
    frameId = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  }
  tick();
  pushHud(vec2(pointer));

  return {
    setPickMode(mode) {
      if (mode === pickMode) return;
      pickMode = mode;
      hoverHit = null;
      hoverMeshId = null;
      hoverInstanceId = null;
      applyHighlights();
    },
    setLogFaceOnClick(value) {
      logFaceOnClick = value;
    },
    clearSelection() {
      selectedHit = null;
      selectedMeshId = null;
      selectedInstanceId = null;
      clickLog = [];
      applyHighlights();
    },
    selectMeshById(id) {
      const mesh = pickMeshes.find((m) => m.name === id);
      if (!mesh) return;
      const ndc = vec2(pointer);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(mesh, false);
      setSelectionFromHit(hits[0] ?? null);
      pushHud(ndc);
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
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
