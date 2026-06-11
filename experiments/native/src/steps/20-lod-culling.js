import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 20,
  title: 'Level of detail and culling',
  description:
    '`LOD` switches child meshes by camera distance; `Box3Helper` shows bounds. Compare default `frustumCulled` with forced off-screen draws.',
};

const LOD_THRESHOLDS = [
  { id: 'high', label: 'High (icosahedron ×3)', distance: 0, color: 0x42c9f5 },
  { id: 'medium', label: 'Medium (icosahedron ×1)', distance: 4.5, color: 0xf5c542 },
  { id: 'low', label: 'Low (box proxy)', distance: 9, color: 0xf5427a },
  { id: 'hidden', label: 'Hidden (empty level)', distance: 15, color: 0x666680 },
];

const LOD_POSITIONS = [-9, -5.5, -2, 2, 5.5, 9];

const CULL_LANE_COUNT = 24;
const CULL_LANE_SPAN = 22;

function createLodMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.1,
    flatShading: true,
  });
}

function buildLodObject(radius = 0.55) {
  const lod = new THREE.LOD();
  lod.name = 'lod-demo';

  const high = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 3),
    createLodMaterial(LOD_THRESHOLDS[0].color),
  );
  high.castShadow = true;

  const medium = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    createLodMaterial(LOD_THRESHOLDS[1].color),
  );
  medium.castShadow = true;

  const low = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 1.35, radius * 1.35, radius * 1.35),
    createLodMaterial(LOD_THRESHOLDS[2].color),
  );
  low.castShadow = true;

  const hidden = new THREE.Object3D();
  hidden.name = 'lod-hidden-level';

  lod.addLevel(high, LOD_THRESHOLDS[0].distance);
  lod.addLevel(medium, LOD_THRESHOLDS[1].distance);
  lod.addLevel(low, LOD_THRESHOLDS[2].distance);
  lod.addLevel(hidden, LOD_THRESHOLDS[3].distance);

  lod.userData.levelMeshes = [high, medium, low, hidden];
  return lod;
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 14),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(26, 52, 0x3a3a4a, 0x252530));

  scene.add(new THREE.AmbientLight(0x404060, 0.45));

  const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
  key.position.set(6, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -14;
  key.shadow.camera.right = 14;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  scene.add(key);

  const rim = new THREE.PointLight(0x6688ff, 0.45, 18);
  rim.position.set(-5, 3, -2);
  scene.add(rim);

  const lodRoot = new THREE.Group();
  lodRoot.name = 'lod-row';
  scene.add(lodRoot);

  const lodObjects = LOD_POSITIONS.map((x, i) => {
    const lod = buildLodObject();
    lod.position.set(x, 0.55, 0);
    lod.name = `lod-${i}`;
    lod.userData.label = `LOD ${i + 1}`;
    lodRoot.add(lod);
    return lod;
  });

  const cullLane = new THREE.Group();
  cullLane.name = 'frustum-cull-lane';
  cullLane.position.set(0, 0.35, 4.5);
  scene.add(cullLane);

  const cullMeshes = [];
  const cullGeometry = new THREE.TetrahedronGeometry(0.28, 0);
  for (let i = 0; i < CULL_LANE_COUNT; i++) {
    const t = i / (CULL_LANE_COUNT - 1);
    const mesh = new THREE.Mesh(
      cullGeometry,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.55 + t * 0.25, 0.65, 0.55),
        roughness: 0.5,
        metalness: 0.08,
      }),
    );
    mesh.position.set((t - 0.5) * CULL_LANE_SPAN, 0, 0);
    mesh.castShadow = true;
    mesh.name = `cull-mesh-${i}`;
    cullLane.add(mesh);
    cullMeshes.push(mesh);
  }

  return { scene, lodRoot, lodObjects, cullLane, cullMeshes, cullGeometry };
}

function summarizeLod(lod, camera) {
  const distance = lod.getWorldPosition(new THREE.Vector3()).distanceTo(camera.position);
  const levelIndex = lod.getCurrentLevel();
  const spec = LOD_THRESHOLDS[levelIndex] ?? LOD_THRESHOLDS[0];
  const activeMesh = lod.userData.levelMeshes?.[levelIndex];
  const triangles =
    activeMesh?.isMesh && activeMesh.geometry?.index
      ? activeMesh.geometry.index.count / 3
      : activeMesh?.isMesh && activeMesh.geometry?.attributes?.position
        ? activeMesh.geometry.attributes.position.count / 3
        : 0;

  return {
    label: lod.userData.label ?? lod.name,
    distance,
    levelIndex,
    levelLabel: spec.label,
    levelId: spec.id,
    triangles: Math.round(triangles),
    visible: lod.visible && levelIndex < LOD_THRESHOLDS.length - 1,
  };
}

function countLaneInFrustum(camera, meshes) {
  const frustum = new THREE.Frustum();
  const matrix = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  frustum.setFromProjectionMatrix(matrix);

  const box = new THREE.Box3();
  let inFrustum = 0;
  for (const mesh of meshes) {
    box.setFromObject(mesh);
    if (frustum.intersectsBox(box)) inFrustum += 1;
  }
  return inFrustum;
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, lodObjects, cullLane, cullMeshes, cullGeometry } = buildScene();

  const boundingBoxes = LOD_POSITIONS.map(() => new THREE.Box3());
  const boxHelpers = boundingBoxes.map((box, i) => {
    const helper = new THREE.Box3Helper(box, LOD_THRESHOLDS[i % LOD_THRESHOLDS.length].color);
    helper.visible = false;
    scene.add(helper);
    return helper;
  });

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
  camera.position.set(0, 3.2, 11);

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
  controls.maxDistance = 28;
  controls.update();

  let showBoundingBoxes = true;
  let frustumCulled = true;
  let animateLodRow = true;

  function applyCullLaneFlags() {
    cullLane.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = frustumCulled;
    });
  }

  function updateBoundingBoxes() {
    lodObjects.forEach((lod, i) => {
      boundingBoxes[i].setFromObject(lod);
      boxHelpers[i].visible = showBoundingBoxes;
    });
  }

  function pushHud() {
    const lodSummaries = lodObjects.map((lod) => summarizeLod(lod, camera));
    const laneInFrustum = countLaneInFrustum(camera, cullMeshes);

    onHudUpdate?.({
      lodThresholds: LOD_THRESHOLDS.map(({ id, label, distance }) => ({
        id,
        label,
        distance,
      })),
      lodSummaries,
      showBoundingBoxes,
      frustumCulled,
      animateLodRow,
      cullLane: {
        meshCount: cullMeshes.length,
        inFrustum: laneInFrustum,
        span: CULL_LANE_SPAN,
        frustumCulled,
      },
      renderInfo: {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        points: renderer.info.render.points,
        lines: renderer.info.render.lines,
      },
      notes: [
        {
          id: 'lod',
          label: 'LOD.addLevel(object, distance)',
          when: 'Child shown when camera distance ≥ threshold; furthest level can be an empty Object3D.',
        },
        {
          id: 'update',
          label: 'LOD.update(camera)',
          when: 'Called automatically before render when `lod.autoUpdate` is true (default).',
        },
        {
          id: 'box3',
          label: 'Box3Helper',
          when: 'Wireframe of a `Box3` — here updated each frame from each LOD object bounds.',
        },
        {
          id: 'frustum',
          label: 'frustumCulled (default true)',
          when: 'Meshes outside the camera frustum skip draw calls; set false to force off-screen rendering.',
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

  applyCullLaneFlags();
  updateBoundingBoxes();

  const clock = new THREE.Clock();
  let frameId;

  function tick() {
    frameId = requestAnimationFrame(tick);
    clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (animateLodRow) {
      lodObjects.forEach((lod, i) => {
        lod.rotation.y = elapsed * 0.35 + i * 0.4;
        lod.rotation.x = Math.sin(elapsed * 0.25 + i) * 0.12;
      });
    }

    controls.update();
    lodObjects.forEach((lod) => lod.update(camera));
    updateBoundingBoxes();

    renderer.info.reset();
    renderer.render(scene, camera);
    pushHud();
  }

  tick();
  pushHud();

  return {
    setShowBoundingBoxes(value) {
      if (showBoundingBoxes === value) return;
      showBoundingBoxes = value;
      updateBoundingBoxes();
      pushHud();
    },
    setFrustumCulled(value) {
      if (frustumCulled === value) return;
      frustumCulled = value;
      applyCullLaneFlags();
      pushHud();
    },
    setAnimateLodRow(value) {
      if (animateLodRow === value) return;
      animateLodRow = value;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      boxHelpers.forEach((helper) => {
        helper.geometry.dispose();
        helper.material.dispose();
        scene.remove(helper);
      });

      lodObjects.forEach((lod) => {
        lod.userData.levelMeshes?.forEach((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
            child.material.dispose();
          }
        });
      });

      cullMeshes.forEach((mesh) => mesh.material.dispose());
      cullGeometry.dispose();

      const lodMeshes = new Set(
        lodObjects.flatMap((lod) => lod.userData.levelMeshes?.filter((c) => c.isMesh) ?? []),
      );

      scene.traverse((obj) => {
        if (!obj.isMesh || lodMeshes.has(obj) || cullMeshes.includes(obj)) return;
        obj.geometry?.dispose?.();
        obj.material?.dispose?.();
      });

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
