import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 18,
  title: 'Lines, edges, and points',
  description:
    'Compare `Line`, `LineSegments`, and `LineLoop` draw modes; `EdgesGeometry` crease overlays on filled meshes; `Points` with `PointsMaterial` size attenuation.',
};

const LINE_MODES = [
  {
    id: 'line',
    label: 'Line',
    hint: 'Continuous polyline through every vertex in order (`gl.LINE_STRIP` semantics).',
    createObject: (geometry, material) => new THREE.Line(geometry, material),
    drawMode: 'LINE_STRIP',
  },
  {
    id: 'lineSegments',
    label: 'LineSegments',
    hint: 'Independent segment pairs: vertex 0–1, 2–3, … (`gl.LINES`). Odd vertex counts leave one unused.',
    createObject: (geometry, material) => new THREE.LineSegments(geometry, material),
    drawMode: 'LINES',
  },
  {
    id: 'lineLoop',
    label: 'LineLoop',
    hint: 'Like `Line`, then connects the last vertex back to the first (`gl.LINE_LOOP`).',
    createObject: (geometry, material) => new THREE.LineLoop(geometry, material),
    drawMode: 'LINE_LOOP',
  },
];

const EDGES_SHAPES = [
  { id: 'box', label: 'BoxGeometry', geometry: () => new THREE.BoxGeometry(1.2, 1.2, 1.2, 2, 2, 2) },
  {
    id: 'torusKnot',
    label: 'TorusKnotGeometry',
    geometry: () => new THREE.TorusKnotGeometry(0.55, 0.18, 120, 16),
  },
  {
    id: 'icosahedron',
    label: 'IcosahedronGeometry',
    geometry: () => new THREE.IcosahedronGeometry(0.75, 2),
  },
];

function createStarPositions() {
  const points = [];
  const radius = 0.75;
  const inner = 0.32;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? radius : inner;
    points.push(Math.cos(angle) * r, Math.sin(angle) * r, 0);
  }
  return new Float32Array(points);
}

function createStarGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(createStarPositions(), 3));
  return geometry;
}

function fibonacciSphere(count, radius) {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }

  return positions;
}

function summarizeLineGeometry(geometry) {
  const position = geometry.getAttribute('position');
  const samples = [];
  const count = Math.min(position.count, 6);
  for (let i = 0; i < count; i++) {
    samples.push({
      x: position.getX(i),
      y: position.getY(i),
      z: position.getZ(i),
    });
  }
  return {
    vertexCount: position.count,
    segmentPairs: Math.floor(position.count / 2),
    samples,
  };
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 8),
    new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.92, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(16, 32, 0x3a3a4a, 0x252530));

  const ambient = new THREE.AmbientLight(0x404060, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
  key.position.set(4, 6, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.PointLight(0x6688ff, 0.45, 16);
  rim.position.set(-4, 3, 2);
  scene.add(rim);

  return scene;
}

function buildLineModesStation() {
  const group = new THREE.Group();
  group.position.set(-4.8, 1.1, 0);
  group.name = 'line-modes';

  const starGeometry = createStarGeometry();
  const spacing = 1.35;
  const objects = {};

  LINE_MODES.forEach((mode, i) => {
    const sub = new THREE.Group();
    sub.position.y = (1 - i) * spacing;

    const geometry = starGeometry.clone();
    const material = new THREE.LineBasicMaterial({
      color: [0xf5c542, 0x42c9f5, 0xf542c9][i],
      linewidth: 1,
    });
    const line = mode.createObject(geometry, material);
    line.name = mode.id;
    sub.add(line);

    const vertexDots = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.06,
        sizeAttenuation: true,
      }),
    );
    vertexDots.name = `${mode.id}-vertices`;
    sub.add(vertexDots);

    objects[mode.id] = { sub, line, geometry, material, vertexDots };
    group.add(sub);
  });

  return { group, starGeometry, objects };
}

function buildEdgesStation() {
  const group = new THREE.Group();
  group.position.set(0, 0.85, 0);
  group.name = 'edges-overlay';

  const shape = EDGES_SHAPES[1];
  const baseGeometry = shape.geometry();
  const mesh = new THREE.Mesh(
    baseGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.55,
      metalness: 0.12,
      transparent: true,
      opacity: 0.72,
    }),
  );
  mesh.castShadow = true;
  mesh.name = 'filled-mesh';
  group.add(mesh);

  const edgesGeometry = new THREE.EdgesGeometry(baseGeometry, 15);
  const edges = new THREE.LineSegments(
    edgesGeometry,
    new THREE.LineBasicMaterial({ color: 0xf5c542 }),
  );
  edges.name = 'edges-overlay';
  group.add(edges);

  const wireframe = new THREE.LineSegments(
    new THREE.WireframeGeometry(baseGeometry),
    new THREE.LineBasicMaterial({ color: 0x42c9f5, transparent: true, opacity: 0.35 }),
  );
  wireframe.name = 'wireframe-overlay';
  wireframe.visible = false;
  group.add(wireframe);

  return { group, mesh, edges, edgesGeometry, wireframe, shapeId: shape.id };
}

function buildPointsStation() {
  const group = new THREE.Group();
  group.position.set(4.8, 0.9, 0);
  group.name = 'points-cloud';

  const count = 2400;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(fibonacciSphere(count, 0.95), 3));

  const material = new THREE.PointsMaterial({
    color: 0x7af542,
    size: 0.045,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.92,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'fibonacci-points';
  group.add(points);

  const reference = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 24, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  reference.name = 'reference-shell';
  group.add(reference);

  return { group, points, geometry, material, reference, count };
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = buildScene();
  const lineStation = buildLineModesStation();
  const edgesStation = buildEdgesStation();
  const pointsStation = buildPointsStation();

  scene.add(lineStation.group, edgesStation.group, pointsStation.group);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 50);
  camera.position.set(0, 3.2, 9.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.9, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 4;
  controls.maxDistance = 20;
  controls.update();

  const lineVisibility = Object.fromEntries(LINE_MODES.map((m) => [m.id, true]));
  let showVertexDots = true;
  let edgesShapeId = edgesStation.shapeId;
  let edgesThreshold = 15;
  let showFilledMesh = true;
  let showEdgesOverlay = true;
  let showWireframeOverlay = false;
  let pointsSize = 0.045;
  let pointsSizeAttenuation = true;
  let showReferenceShell = true;
  let animatePoints = true;

  function rebuildEdgesGeometry() {
    const shape = EDGES_SHAPES.find((s) => s.id === edgesShapeId) ?? EDGES_SHAPES[0];
    const nextGeometry = shape.geometry();

    edgesStation.mesh.geometry.dispose();
    edgesStation.edgesGeometry.dispose();
    edgesStation.wireframe.geometry.dispose();

    edgesStation.mesh.geometry = nextGeometry;
    edgesStation.edgesGeometry = new THREE.EdgesGeometry(nextGeometry, edgesThreshold);
    edgesStation.edges.geometry = edgesStation.edgesGeometry;
    edgesStation.wireframe.geometry = new THREE.WireframeGeometry(nextGeometry);
  }

  function applyEdgesVisibility() {
    edgesStation.mesh.visible = showFilledMesh;
    edgesStation.edges.visible = showEdgesOverlay;
    edgesStation.wireframe.visible = showWireframeOverlay;
  }

  function applyLineVisibility() {
    LINE_MODES.forEach((mode) => {
      const entry = lineStation.objects[mode.id];
      const visible = lineVisibility[mode.id];
      entry.sub.visible = visible;
    });
    LINE_MODES.forEach((mode) => {
      const entry = lineStation.objects[mode.id];
      entry.vertexDots.visible = showVertexDots && lineVisibility[mode.id];
    });
  }

  function applyPointsMaterial() {
    pointsStation.material.size = pointsSize;
    pointsStation.material.sizeAttenuation = pointsSizeAttenuation;
    pointsStation.material.needsUpdate = true;
    pointsStation.reference.visible = showReferenceShell;
  }

  function pushHud() {
    const activeLineMode = LINE_MODES.find((m) => lineVisibility[m.id]) ?? LINE_MODES[0];
    const activeGeometry = lineStation.objects[activeLineMode.id].geometry;

    onHudUpdate?.({
      lineModes: LINE_MODES,
      lineVisibility: { ...lineVisibility },
      showVertexDots,
      lineGeometry: summarizeLineGeometry(activeGeometry),
      activeLineModeId: activeLineMode.id,
      edgesShapes: EDGES_SHAPES,
      edgesShapeId,
      edgesThreshold,
      showFilledMesh,
      showEdgesOverlay,
      showWireframeOverlay,
      edgesStats: {
        edgeSegments: edgesStation.edgesGeometry.attributes.position.count / 2,
        thresholdAngle: edgesThreshold,
      },
      pointsCount: pointsStation.count,
      pointsSize,
      pointsSizeAttenuation,
      showReferenceShell,
      animatePoints,
      drawModeNotes: [
        {
          id: 'mesh',
          label: 'Mesh (triangles)',
          when: 'Filled surfaces, lighting, shadows, raycasting.',
        },
        {
          id: 'lines',
          label: 'Line / LineSegments / LineLoop',
          when: 'Sparse paths and debug overlays — no fill, limited width in WebGL.',
        },
        {
          id: 'edges',
          label: 'EdgesGeometry',
          when: 'Hard creases from mesh topology; lighter than full wireframe.',
        },
        {
          id: 'points',
          label: 'Points + PointsMaterial',
          when: 'Particles and point clouds; `sizeAttenuation` scales with camera distance.',
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
    const t = clock.getElapsedTime();

    edgesStation.group.rotation.y = t * 0.35;
    pointsStation.group.rotation.y = t * 0.28;

    if (animatePoints) {
      pointsStation.points.rotation.y = t * 0.55;
      pointsStation.points.rotation.x = Math.sin(t * 0.4) * 0.15;
    }

    controls.update();
    renderer.render(scene, camera);
    pushHud();
  }

  applyLineVisibility();
  applyEdgesVisibility();
  applyPointsMaterial();
  tick();
  pushHud();

  return {
    setLineVisible(id, value) {
      if (!(id in lineVisibility) || lineVisibility[id] === value) return;
      lineVisibility[id] = value;
      applyLineVisibility();
      pushHud();
    },
    setShowVertexDots(value) {
      if (showVertexDots === value) return;
      showVertexDots = value;
      applyLineVisibility();
      pushHud();
    },
    setEdgesShapeId(id) {
      if (id === edgesShapeId) return;
      if (!EDGES_SHAPES.some((s) => s.id === id)) return;
      edgesShapeId = id;
      rebuildEdgesGeometry();
      pushHud();
    },
    setEdgesThreshold(value) {
      const next = Math.max(1, Math.min(180, value));
      if (next === edgesThreshold) return;
      edgesThreshold = next;
      rebuildEdgesGeometry();
      pushHud();
    },
    setShowFilledMesh(value) {
      if (showFilledMesh === value) return;
      showFilledMesh = value;
      applyEdgesVisibility();
      pushHud();
    },
    setShowEdgesOverlay(value) {
      if (showEdgesOverlay === value) return;
      showEdgesOverlay = value;
      applyEdgesVisibility();
      pushHud();
    },
    setShowWireframeOverlay(value) {
      if (showWireframeOverlay === value) return;
      showWireframeOverlay = value;
      applyEdgesVisibility();
      pushHud();
    },
    setPointsSize(value) {
      const next = Math.max(0.005, Math.min(0.2, value));
      if (next === pointsSize) return;
      pointsSize = next;
      applyPointsMaterial();
      pushHud();
    },
    setPointsSizeAttenuation(value) {
      if (pointsSizeAttenuation === value) return;
      pointsSizeAttenuation = value;
      applyPointsMaterial();
      pushHud();
    },
    setShowReferenceShell(value) {
      if (showReferenceShell === value) return;
      showReferenceShell = value;
      applyPointsMaterial();
      pushHud();
    },
    setAnimatePoints(value) {
      if (animatePoints === value) return;
      animatePoints = value;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      lineStation.starGeometry.dispose();
      scene.traverse((obj) => {
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
