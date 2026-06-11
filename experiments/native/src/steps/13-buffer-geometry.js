import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(13);


const PRESETS = [
  {
    id: 'parametric',
    label: 'Parametric surface',
    color: 0x42c9f5,
    hint: 'Grid of (u, v) samples through a sine/cos height function — positions and UVs allocated manually.',
  },
  {
    id: 'terrain',
    label: 'Terrain heightfield',
    color: 0x7af542,
    hint: 'XZ grid with per-vertex height from layered noise — classic indexed heightmap mesh.',
  },
  {
    id: 'icosahedron',
    label: 'Icosahedron',
    color: 0xf5c542,
    hint: 'Twelve golden-ratio vertices and twenty triangle faces written by hand, then normalized to radius.',
  },
];

function expandNonIndexed(positions, uvs, indices) {
  const triCount = indices.length / 3;
  const expandedPositions = new Float32Array(triCount * 9);
  const expandedUvs = new Float32Array(triCount * 6);

  for (let t = 0; t < triCount; t++) {
    for (let corner = 0; corner < 3; corner++) {
      const src = indices[t * 3 + corner];
      const dst = t * 3 + corner;

      expandedPositions[dst * 3] = positions[src * 3];
      expandedPositions[dst * 3 + 1] = positions[src * 3 + 1];
      expandedPositions[dst * 3 + 2] = positions[src * 3 + 2];

      expandedUvs[dst * 2] = uvs[src * 2];
      expandedUvs[dst * 2 + 1] = uvs[src * 2 + 1];
    }
  }

  return { positions: expandedPositions, uvs: expandedUvs, indices: null };
}

function buildGridIndices(segmentsX, segmentsZ) {
  const quadCount = segmentsX * segmentsZ;
  const indices = new Uint32Array(quadCount * 6);
  let ii = 0;

  for (let ix = 0; ix < segmentsX; ix++) {
    for (let iz = 0; iz < segmentsZ; iz++) {
      const a = ix * (segmentsZ + 1) + iz;
      const b = a + 1;
      const c = a + (segmentsZ + 1);
      const d = c + 1;
      indices[ii++] = a;
      indices[ii++] = c;
      indices[ii++] = b;
      indices[ii++] = b;
      indices[ii++] = c;
      indices[ii++] = d;
    }
  }

  return indices;
}

function buildParametricSurface(segmentsU, segmentsV, indexed) {
  const vertexCount = (segmentsU + 1) * (segmentsV + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  let vi = 0;
  for (let iu = 0; iu <= segmentsU; iu++) {
    for (let iv = 0; iv <= segmentsV; iv++) {
      const u = iu / segmentsU;
      const v = iv / segmentsV;
      const x = (u - 0.5) * 5.2;
      const z = (v - 0.5) * 5.2;
      const y =
        Math.sin(x * 0.95) * Math.cos(z * 0.95) * 0.72 +
        Math.sin((x + z) * 0.55) * 0.18;

      positions[vi * 3] = x;
      positions[vi * 3 + 1] = y;
      positions[vi * 3 + 2] = z;
      uvs[vi * 2] = u;
      uvs[vi * 2 + 1] = v;
      vi++;
    }
  }

  const indices = buildGridIndices(segmentsU, segmentsV);
  if (!indexed) return expandNonIndexed(positions, uvs, indices);
  return { positions, uvs, indices };
}

function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.42) * 0.35 +
    Math.cos(z * 0.36) * 0.28 +
    Math.sin((x + z) * 0.22) * 0.16 +
    Math.cos(x * 0.12 - z * 0.18) * 0.1
  );
}

function buildTerrainHeightfield(segments, indexed) {
  const span = 6;
  const vertexCount = (segments + 1) * (segments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  let vi = 0;
  for (let ix = 0; ix <= segments; ix++) {
    for (let iz = 0; iz <= segments; iz++) {
      const u = ix / segments;
      const v = iz / segments;
      const x = (u - 0.5) * span;
      const z = (v - 0.5) * span;
      const y = terrainHeight(x, z);

      positions[vi * 3] = x;
      positions[vi * 3 + 1] = y;
      positions[vi * 3 + 2] = z;
      uvs[vi * 2] = u;
      uvs[vi * 2 + 1] = v;
      vi++;
    }
  }

  const indices = buildGridIndices(segments, segments);
  if (!indexed) return expandNonIndexed(positions, uvs, indices);
  return { positions, uvs, indices };
}

function buildIcosahedron(radius, indexed) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1],
  ];

  const faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  const vertexCount = raw.length;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  for (let i = 0; i < vertexCount; i++) {
    const [x, y, z] = raw[i];
    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = (x / len) * radius;
    const ny = (y / len) * radius;
    const nz = (z / len) * radius;
    positions[i * 3] = nx;
    positions[i * 3 + 1] = ny;
    positions[i * 3 + 2] = nz;
    uvs[i * 2] = Math.atan2(nz, nx) / (Math.PI * 2) + 0.5;
    uvs[i * 2 + 1] = Math.asin(ny / radius) / Math.PI + 0.5;
  }

  const indices = new Uint16Array(faces.length * 3);
  let ii = 0;
  for (const face of faces) {
    indices[ii++] = face[0];
    indices[ii++] = face[1];
    indices[ii++] = face[2];
  }

  if (!indexed) return expandNonIndexed(positions, uvs, indices);
  return { positions, uvs, indices };
}

function assembleGeometry(data, computeNormals) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));

  if (data.indices) {
    geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  }

  if (computeNormals) {
    geometry.computeVertexNormals();
  }

  geometry.computeBoundingSphere();
  return geometry;
}

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

  const triangleCount = index ? index.count / 3 : position.count / 3;

  return {
    type: geometry.type,
    attributes,
    index: index ? { count: index.count, itemSize: index.itemSize } : null,
    indexSamples,
    triangleCount,
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

  if (displayMode === 'material') return;

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

function buildGeometryData(presetId, segments, indexed) {
  if (presetId === 'parametric') {
    const segU = segments;
    const segV = Math.max(8, Math.round(segments * 0.85));
    return {
      data: buildParametricSurface(segU, segV, indexed),
      segmentsLabel: `${segU} × ${segV}`,
    };
  }

  if (presetId === 'terrain') {
    return {
      data: buildTerrainHeightfield(segments, indexed),
      segmentsLabel: `${segments} × ${segments}`,
    };
  }

  return {
    data: buildIcosahedron(1.35, indexed),
    segmentsLabel: '12 verts / 20 faces',
  };
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 80);
  camera.position.set(4.5, 3.8, 5.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.update();

  scene.add(new THREE.GridHelper(10, 20, 0x3a3a4a, 0x252530));
  scene.add(new THREE.AmbientLight(0xffffff, 0.38));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 7, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaccff, 0.28);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  let presetId = 'parametric';
  let segments = 32;
  let indexed = true;
  let computeNormals = true;
  let wireframe = false;
  let displayMode = 'material';
  let animateSurface = true;

  const material = new THREE.MeshStandardMaterial({
    color: PRESETS[0].color,
    roughness: 0.42,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  let mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  scene.add(mesh);

  const clock = new THREE.Clock();
  let frameId;

  function getPreset() {
    return PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  }

  function rebuildMesh() {
    const preset = getPreset();
    mesh.geometry.dispose();

    const { data, segmentsLabel } = buildGeometryData(presetId, segments, indexed);
    mesh.geometry = assembleGeometry(data, computeNormals);
    mesh.userData.baseColor = preset.color;
    mesh.userData.segmentsLabel = segmentsLabel;
    mesh.userData.buildNotes = {
      indexed,
      computeNormals,
      positionBytes: data.positions.byteLength,
      uvBytes: data.uvs.byteLength,
      indexBytes: data.indices ? data.indices.byteLength : 0,
    };

    material.color.setHex(preset.color);
    material.wireframe = wireframe;
    material.flatShading = !indexed && computeNormals;
    applyDisplayMode(mesh, displayMode);
  }

  rebuildMesh();

  function pushHud() {
    const preset = getPreset();
    const geo = inspectGeometry(mesh.geometry);
    const build = mesh.userData.buildNotes ?? {};

    onHudUpdate?.({
      presetId,
      presets: PRESETS.map((p) => ({ id: p.id, label: p.label, hint: p.hint })),
      segments,
      segmentsLabel: mesh.userData.segmentsLabel,
      segmentsEnabled: presetId !== 'icosahedron',
      indexed,
      computeNormals,
      wireframe,
      displayMode,
      animateSurface,
      selected: {
        id: preset.id,
        label: preset.label,
        hint: preset.hint,
        geometry: geo,
        build,
      },
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

  function tick() {
    frameId = requestAnimationFrame(tick);
    const elapsed = clock.getElapsedTime();

    if (animateSurface && presetId === 'parametric') {
      const segU = segments;
      const segV = Math.max(8, Math.round(segments * 0.85));
      const positions = mesh.geometry.attributes.position;
      let vi = 0;
      for (let iu = 0; iu <= segU; iu++) {
        for (let iv = 0; iv <= segV; iv++) {
          const u = iu / segU;
          const v = iv / segV;
          const x = (u - 0.5) * 5.2;
          const z = (v - 0.5) * 5.2;
          const y =
            Math.sin(x * 0.95 + elapsed * 0.8) * Math.cos(z * 0.95 + elapsed * 0.6) * 0.72 +
            Math.sin((x + z) * 0.55 + elapsed) * 0.18;
          positions.setXYZ(vi, x, y, z);
          vi++;
        }
      }
      positions.needsUpdate = true;
      if (computeNormals) mesh.geometry.computeVertexNormals();
      applyDisplayMode(mesh, displayMode);
    }

    controls.update();
    renderer.render(scene, camera);
    pushHud();
  }
  tick();

  return {
    setPresetId(id) {
      if (id === presetId) return;
      if (!PRESETS.some((p) => p.id === id)) return;
      presetId = id;
      rebuildMesh();
    },
    setSegments(value) {
      const next = Math.max(8, Math.min(80, Math.round(value)));
      if (next === segments) return;
      segments = next;
      if (presetId !== 'icosahedron') rebuildMesh();
    },
    setIndexed(value) {
      if (value === indexed) return;
      indexed = value;
      rebuildMesh();
    },
    setComputeNormals(value) {
      if (value === computeNormals) return;
      computeNormals = value;
      rebuildMesh();
    },
    setWireframe(value) {
      if (value === wireframe) return;
      wireframe = value;
      material.wireframe = wireframe;
      pushHud();
    },
    setDisplayMode(mode) {
      if (mode === displayMode) return;
      displayMode = mode;
      applyDisplayMode(mesh, displayMode);
      pushHud();
    },
    setAnimateSurface(value) {
      if (value === animateSurface) return;
      animateSurface = value;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
