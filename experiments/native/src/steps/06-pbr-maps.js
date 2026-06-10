import * as THREE from 'three';

export const meta = {
  step: 6,
  title: 'PBR maps on MeshStandardMaterial',
  description:
    'MeshStandardMaterial map slots on a subdivided box: albedo, normal, roughness, metalness, AO, and subtle displacement. Toggle each map and switch between separate textures vs one packed ORM image (R=AO, G=roughness, B=metalness).',
};

const MAP_SLOTS = [
  {
    id: 'map',
    label: 'map',
    note: 'Albedo / base colour — sRGB (`SRGBColorSpace`).',
    packedOrm: false,
  },
  {
    id: 'normalMap',
    label: 'normalMap',
    note: 'Tangent-space normals — linear data, not colour.',
    packedOrm: false,
  },
  {
    id: 'roughnessMap',
    label: 'roughnessMap',
    note: 'Per-texel roughness. Packed ORM uses the green channel.',
    packedOrm: true,
  },
  {
    id: 'metalnessMap',
    label: 'metalnessMap',
    note: 'Per-texel metalness. Packed ORM uses the blue channel.',
    packedOrm: true,
  },
  {
    id: 'aoMap',
    label: 'aoMap',
    note: 'Baked ambient occlusion — needs `uv2`. Packed ORM uses red.',
    packedOrm: true,
  },
  {
    id: 'displacementMap',
    label: 'displacementMap',
    note: 'Vertex offset along normals — needs dense geometry + UVs.',
    packedOrm: false,
  },
];

const DEFAULT_ENABLED = {
  map: true,
  normalMap: true,
  roughnessMap: true,
  metalnessMap: true,
  aoMap: true,
  displacementMap: true,
};

function paintPanelPattern(ctx, size) {
  const tile = size / 4;

  ctx.fillStyle = '#2a3548';
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = col * tile;
      const y = row * tile;
      const inset = tile * 0.08;
      const hue = (row * 4 + col) * 11;

      ctx.fillStyle = `hsl(${hue} 38% ${row % 2 === col % 2 ? 46 : 34}%)`;
      ctx.fillRect(x + inset, y + inset, tile - inset * 2, tile - inset * 2);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + inset, y + inset, tile - inset * 2, tile - inset * 2);

      if ((row + col) % 3 === 0) {
        ctx.fillStyle = 'rgba(255, 220, 140, 0.55)';
        ctx.beginPath();
        ctx.arc(x + tile * 0.72, y + tile * 0.28, tile * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    const p = (i / 4) * size;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
}

function createCanvasTexture(draw, { colorSpace = THREE.NoColorSpace, repeat = 2 } = {}) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = colorSpace;
  return texture;
}

function createAlbedoMap(repeat) {
  return createCanvasTexture(paintPanelPattern, {
    colorSpace: THREE.SRGBColorSpace,
    repeat,
  });
}

function createRoughnessMap(repeat) {
  return createCanvasTexture((ctx, size) => {
    paintPanelPattern(ctx, size);
    const image = ctx.getImageData(0, 0, size, size);
    const { data } = image;
    const tile = size / 4;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const col = Math.floor(x / tile);
        const row = Math.floor(y / tile);
        const checker = (row + col) % 2;
        const edge =
          Math.min(x % tile, y % tile, tile - (x % tile), tile - (y % tile)) < size * 0.012;
        const glossy = checker === 0 && !edge;
        const value = glossy ? 48 : edge ? 210 : 155;
        const i = (y * size + x) * 4;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(image, 0, 0);
  }, { repeat });
}

function createMetalnessMap(repeat) {
  return createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#101010';
    ctx.fillRect(0, 0, size, size);

    const tile = size / 4;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if ((row + col) % 2 !== 0) continue;
        const x = col * tile + tile * 0.22;
        const y = row * tile + tile * 0.22;
        const w = tile * 0.56;
        const h = tile * 0.56;
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
      }
    }

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if ((row + col) % 3 !== 0) continue;
        const cx = col * tile + tile * 0.72;
        const cy = row * tile + tile * 0.28;
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(cx, cy, tile * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, { repeat });
}

function createAoMap(repeat) {
  return createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const tile = size / 4;
    ctx.fillStyle = '#202020';
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * size;
      ctx.fillRect(p - 4, 0, 8, size);
      ctx.fillRect(0, p - 4, size, 8);
    }

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * tile + tile * 0.08;
        const y = row * tile + tile * 0.08;
        const w = tile - tile * 0.16;
        const h = tile - tile * 0.16;
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#c8c8c8');
        grad.addColorStop(1, '#686868');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
      }
    }
  }, { repeat });
}

function createPackedOrmMap(repeat) {
  return createCanvasTexture((ctx, size) => {
    const ao = document.createElement('canvas');
    ao.width = size;
    ao.height = size;
    const aoCtx = ao.getContext('2d');

    const rough = document.createElement('canvas');
    rough.width = size;
    rough.height = size;
    const roughCtx = rough.getContext('2d');
    const metal = document.createElement('canvas');
    metal.width = size;
    metal.height = size;
    const metalCtx = metal.getContext('2d');

    const drawAo = (c, s) => {
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, s, s);
      const tile = s / 4;
      c.fillStyle = '#202020';
      for (let i = 0; i <= 4; i++) {
        const p = (i / 4) * s;
        c.fillRect(p - 4, 0, 8, s);
        c.fillRect(0, p - 4, s, 8);
      }
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * tile + tile * 0.08;
          const y = row * tile + tile * 0.08;
          const w = tile - tile * 0.16;
          const h = tile - tile * 0.16;
          const grad = c.createLinearGradient(x, y, x + w, y + h);
          grad.addColorStop(0, '#c8c8c8');
          grad.addColorStop(1, '#686868');
          c.fillStyle = grad;
          c.fillRect(x, y, w, h);
        }
      }
    };

    const drawRough = (c, s) => {
      paintPanelPattern(c, s);
      const image = c.getImageData(0, 0, s, s);
      const { data } = image;
      const tile = s / 4;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const col = Math.floor(x / tile);
          const row = Math.floor(y / tile);
          const checker = (row + col) % 2;
          const edge =
            Math.min(x % tile, y % tile, tile - (x % tile), tile - (y % tile)) < s * 0.012;
          const glossy = checker === 0 && !edge;
          const value = glossy ? 48 : edge ? 210 : 155;
          const i = (y * s + x) * 4;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          data[i + 3] = 255;
        }
      }
      c.putImageData(image, 0, 0);
    };

    const drawMetal = (c, s) => {
      c.fillStyle = '#101010';
      c.fillRect(0, 0, s, s);
      const tile = s / 4;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if ((row + col) % 2 !== 0) continue;
          const x = col * tile + tile * 0.22;
          const y = row * tile + tile * 0.22;
          const w = tile * 0.56;
          const h = tile * 0.56;
          c.fillStyle = '#e8e8e8';
          c.fillRect(x, y, w, h);
        }
      }
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if ((row + col) % 3 !== 0) continue;
          const cx = col * tile + tile * 0.72;
          const cy = row * tile + tile * 0.28;
          c.fillStyle = '#f0f0f0';
          c.beginPath();
          c.arc(cx, cy, tile * 0.1, 0, Math.PI * 2);
          c.fill();
        }
      }
    };

    drawAo(aoCtx, size);
    drawRough(roughCtx, size);
    drawMetal(metalCtx, size);

    const aoData = aoCtx.getImageData(0, 0, size, size).data;
    const roughData = roughCtx.getImageData(0, 0, size, size).data;
    const metalData = metalCtx.getImageData(0, 0, size, size).data;
    const packed = ctx.createImageData(size, size);

    for (let i = 0; i < aoData.length; i += 4) {
      packed.data[i] = aoData[i];
      packed.data[i + 1] = roughData[i];
      packed.data[i + 2] = metalData[i];
      packed.data[i + 3] = 255;
    }

    ctx.putImageData(packed, 0, 0);
  }, { repeat });
}

function sampleHeight(ctx, size, x, y) {
  const px = Math.min(size - 1, Math.max(0, Math.floor(x)));
  const py = Math.min(size - 1, Math.max(0, Math.floor(y)));
  const { data } = ctx.getImageData(px, py, 1, 1);
  return data[0] / 255;
}

function createNormalMap(repeat) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  paintPanelPattern(ctx, size);

  const heightCtx = document.createElement('canvas').getContext('2d');
  heightCtx.canvas.width = size;
  heightCtx.canvas.height = size;
  const image = ctx.getImageData(0, 0, size, size);
  const { data } = image;
  const tile = size / 4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = Math.floor(x / tile);
      const row = Math.floor(y / tile);
      const edge =
        Math.min(x % tile, y % tile, tile - (x % tile), tile - (y % tile)) < size * 0.018;
      const stud = (row + col) % 3 === 0;
      const cx = col * tile + tile * 0.72;
      const cy = row * tile + tile * 0.28;
      const dist = Math.hypot(x - cx, y - cy);
      const studBump = stud && dist < tile * 0.11 ? 1 - dist / (tile * 0.11) : 0;
      const value = Math.min(255, (edge ? 70 : 150) + studBump * 90);
      const i = (y * size + x) * 4;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }

  heightCtx.putImageData(image, 0, 0);

  const normal = ctx.createImageData(size, size);
  const strength = 3.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const left = sampleHeight(heightCtx, size, x - 1, y);
      const right = sampleHeight(heightCtx, size, x + 1, y);
      const down = sampleHeight(heightCtx, size, x, y - 1);
      const up = sampleHeight(heightCtx, size, x, y + 1);
      let nx = (left - right) * strength;
      let ny = (down - up) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      normal.data[i] = (nx * 0.5 + 0.5) * 255;
      normal.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      normal.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      normal.data[i + 3] = 255;
    }
  }

  ctx.putImageData(normal, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function createDisplacementMap(repeat) {
  return createCanvasTexture((ctx, size) => {
    paintPanelPattern(ctx, size);
    const image = ctx.getImageData(0, 0, size, size);
    const { data } = image;
    const tile = size / 4;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const col = Math.floor(x / tile);
        const row = Math.floor(y / tile);
        const edge =
          Math.min(x % tile, y % tile, tile - (x % tile), tile - (y % tile)) < size * 0.018;
        const stud = (row + col) % 3 === 0;
        const cx = col * tile + tile * 0.72;
        const cy = row * tile + tile * 0.28;
        const dist = Math.hypot(x - cx, y - cy);
        const studBump = stud && dist < tile * 0.11 ? 1 - dist / (tile * 0.11) : 0;
        const value = Math.min(255, (edge ? 70 : 150) + studBump * 90);
        const i = (y * size + x) * 4;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(image, 0, 0);
  }, { repeat });
}

function setTextureRepeat(textures, repeat) {
  for (const texture of Object.values(textures)) {
    texture.repeat.set(repeat, repeat);
    texture.needsUpdate = true;
  }
}

function ensureUv2(geometry) {
  if (!geometry.attributes.uv2) {
    geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
  }
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  const geometry = new THREE.BoxGeometry(2.4, 2.4, 2.4, 64, 64, 64);
  ensureUv2(geometry);

  let uvRepeat = 2;
  let usePackedOrm = false;
  let displacementScale = 0.06;
  const enabled = { ...DEFAULT_ENABLED };

  const textures = {
    map: createAlbedoMap(uvRepeat),
    normalMap: createNormalMap(uvRepeat),
    roughnessMap: createRoughnessMap(uvRepeat),
    metalnessMap: createMetalnessMap(uvRepeat),
    aoMap: createAoMap(uvRepeat),
    displacementMap: createDisplacementMap(uvRepeat),
    packedOrm: createPackedOrmMap(uvRepeat),
  };

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    metalness: 0.2,
    displacementScale,
    displacementBias: -0.02,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.55;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(new THREE.GridHelper(14, 28, 0x3a3a4a, 0x252530));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5.5, 7.5, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 24;
  const frustum = 6;
  keyLight.shadow.camera.left = -frustum;
  keyLight.shadow.camera.right = frustum;
  keyLight.shadow.camera.top = frustum;
  keyLight.shadow.camera.bottom = -frustum;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xa8c8ff, 0.35);
  fillLight.position.set(-5, 3, -4);
  scene.add(fillLight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(5.2, 3.4, 6.2);
  camera.lookAt(0, 0.1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  let frameId;

  function applyMaps() {
    material.map = enabled.map ? textures.map : null;

    material.normalMap = enabled.normalMap ? textures.normalMap : null;
    if (material.normalMap) {
      material.normalScale.set(1, 1);
    }

    if (usePackedOrm) {
      const orm = textures.packedOrm;
      material.aoMap = enabled.aoMap ? orm : null;
      material.roughnessMap = enabled.roughnessMap ? orm : null;
      material.metalnessMap = enabled.metalnessMap ? orm : null;
    } else {
      material.aoMap = enabled.aoMap ? textures.aoMap : null;
      material.roughnessMap = enabled.roughnessMap ? textures.roughnessMap : null;
      material.metalnessMap = enabled.metalnessMap ? textures.metalnessMap : null;
    }

    material.displacementMap = enabled.displacementMap ? textures.displacementMap : null;
    material.displacementScale = displacementScale;

    material.needsUpdate = true;
  }

  function pushHud() {
    onHudUpdate?.({
      enabled: { ...enabled },
      usePackedOrm,
      uvRepeat,
      displacementScale,
      maps: MAP_SLOTS.map((slot) => ({
        id: slot.id,
        label: slot.label,
        note: slot.note,
        packedOrm: slot.packedOrm,
        active: enabled[slot.id],
        assigned: Boolean(material[slot.id]),
        colorSpace:
          slot.id === 'map'
            ? 'SRGBColorSpace'
            : slot.id === 'normalMap' ||
                slot.id === 'roughnessMap' ||
                slot.id === 'metalnessMap' ||
                slot.id === 'aoMap' ||
                slot.id === 'displacementMap'
              ? 'NoColorSpace'
              : null,
        uvChannel: slot.id === 'aoMap' ? 'uv2' : 'uv',
        ormChannel:
          usePackedOrm && slot.packedOrm
            ? slot.id === 'aoMap'
              ? 'R'
              : slot.id === 'roughnessMap'
                ? 'G'
                : 'B'
            : null,
      })),
      uv2Present: Boolean(geometry.attributes.uv2),
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
  applyMaps();
  pushHud();

  function animate() {
    frameId = requestAnimationFrame(animate);

    const t = performance.now() * 0.001;
    mesh.rotation.x = Math.sin(t * 0.18) * 0.22;
    mesh.rotation.y = t * 0.28;

    pushHud();
    renderer.render(scene, camera);
  }
  animate();

  return {
    setMapEnabled(id, on) {
      if (!(id in enabled)) return;
      enabled[id] = on;
      applyMaps();
    },
    setUsePackedOrm(packed) {
      usePackedOrm = packed;
      applyMaps();
    },
    setUvRepeat(repeat) {
      uvRepeat = repeat;
      setTextureRepeat(textures, repeat);
      applyMaps();
    },
    setDisplacementScale(scale) {
      displacementScale = scale;
      applyMaps();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      Object.values(textures).forEach((t) => t.dispose());
      geometry.dispose();
      material.dispose();

      ground.geometry.dispose();
      ground.material.dispose();

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
