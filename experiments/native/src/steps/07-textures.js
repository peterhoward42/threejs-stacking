import * as THREE from 'three';

export const meta = {
  step: 7,
  title: 'Textures and sampling behaviour',
  description:
    'Image vs canvas `Texture` sources, wrap/repeat/offset/rotation, min/mag filters, anisotropy, and colorSpace (sRGB albedo vs linear data). Includes a live animated canvas texture.',
};

const WRAP_MODES = [
  { id: 'clamp', label: 'ClampToEdge', value: THREE.ClampToEdgeWrapping },
  { id: 'repeat', label: 'RepeatWrapping', value: THREE.RepeatWrapping },
  { id: 'mirror', label: 'MirroredRepeatWrapping', value: THREE.MirroredRepeatWrapping },
];

const MIN_FILTERS = [
  { id: 'nearest', label: 'NearestFilter', value: THREE.NearestFilter, mipmaps: false },
  { id: 'linear', label: 'LinearFilter', value: THREE.LinearFilter, mipmaps: false },
  {
    id: 'nearestMipNearest',
    label: 'NearestMipmapNearestFilter',
    value: THREE.NearestMipmapNearestFilter,
    mipmaps: true,
  },
  {
    id: 'linearMipLinear',
    label: 'LinearMipmapLinearFilter',
    value: THREE.LinearMipmapLinearFilter,
    mipmaps: true,
  },
];

const MAG_FILTERS = [
  { id: 'nearest', label: 'NearestFilter', value: THREE.NearestFilter },
  { id: 'linear', label: 'LinearFilter', value: THREE.LinearFilter },
];

const COLOR_SPACES = [
  { id: 'srgb', label: 'SRGBColorSpace (albedo)', value: THREE.SRGBColorSpace },
  { id: 'linear', label: 'NoColorSpace (data maps)', value: THREE.NoColorSpace },
];

function paintChecker(ctx, size, { tile = 8, light = '#e8e8f0', dark = '#3a3a52' } = {}) {
  const cell = size / tile;
  for (let row = 0; row < tile; row++) {
    for (let col = 0; col < tile; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? light : dark;
      ctx.fillRect(col * cell, row * cell, cell, cell);
    }
  }
}

function paintGradientPanel(ctx, size) {
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#ff6b6b');
  grad.addColorStop(0.35, '#ffd166');
  grad.addColorStop(0.65, '#06d6a0');
  grad.addColorStop(1, '#118ab2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 4;
  for (let i = 1; i < 4; i++) {
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

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `bold ${size * 0.08}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IMAGE', size * 0.5, size * 0.5);
}

function createCanvasTexture(draw, { colorSpace = THREE.SRGBColorSpace } = {}) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  return { texture, canvas, ctx, size };
}

function createImageTexture(onLoad) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  paintGradientPanel(canvas.getContext('2d'), size);

  const image = new Image();
  image.src = canvas.toDataURL('image/png');
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  image.onload = () => {
    texture.needsUpdate = true;
    onLoad?.();
  };
  return { texture, image };
}

function applySampling(texture, {
  wrapS,
  wrapT,
  repeatX,
  repeatY,
  offsetX,
  offsetY,
  rotation,
  minFilter,
  magFilter,
  anisotropy,
  colorSpace,
  generateMipmaps,
}) {
  texture.wrapS = wrapS;
  texture.wrapT = wrapT;
  texture.repeat.set(repeatX, repeatY);
  texture.offset.set(offsetX, offsetY);
  texture.rotation = rotation;
  texture.minFilter = minFilter;
  texture.magFilter = magFilter;
  texture.anisotropy = anisotropy;
  texture.colorSpace = colorSpace;
  texture.generateMipmaps = generateMipmaps;
  texture.needsUpdate = true;
}

function wrapLabel(mode) {
  return WRAP_MODES.find((w) => w.value === mode)?.label ?? String(mode);
}

function addPlane(scene, { width, height, x, y, z, rx = -Math.PI / 2, ry = 0, material }) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.rotation.set(rx, ry, 0);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  let wrapS = THREE.RepeatWrapping;
  let wrapT = THREE.RepeatWrapping;
  let repeatX = 2.5;
  let repeatY = 2.5;
  let offsetX = 0.15;
  let offsetY = 0.1;
  let rotation = 0.35;
  let minFilterId = 'linearMipLinear';
  let magFilterId = 'linear';
  let anisotropy = 1;
  let colorSpaceId = 'srgb';

  const { texture: heroTexture } = createImageTexture();
  const { texture: canvasTexture } = createCanvasTexture((ctx, size) => {
    paintChecker(ctx, size, { tile: 6, light: '#f0d878', dark: '#284060' });
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84);
  });
  const animated = createCanvasTexture((ctx, size) => {
    paintChecker(ctx, size, { tile: 4, light: '#1a1a24', dark: '#1a1a24' });
  });

  const comparisonSource = createCanvasTexture((ctx, size) => {
    paintChecker(ctx, size, { tile: 8, light: '#d0d0e0', dark: '#505068' });
  }).texture;

  const labelTextures = [];

  function makeLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(17, 17, 24, 0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#c8c8d8';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    labelTextures.push(texture);
    return texture;
  }

  function resolveMinFilter() {
    return MIN_FILTERS.find((f) => f.id === minFilterId) ?? MIN_FILTERS[3];
  }

  function resolveMagFilter() {
    return MAG_FILTERS.find((f) => f.id === magFilterId) ?? MAG_FILTERS[1];
  }

  function resolveColorSpace() {
    return COLOR_SPACES.find((c) => c.id === colorSpaceId)?.value ?? THREE.SRGBColorSpace;
  }

  function syncHeroTexture() {
    const min = resolveMinFilter();
    const mag = resolveMagFilter();
    applySampling(heroTexture, {
      wrapS,
      wrapT,
      repeatX,
      repeatY,
      offsetX,
      offsetY,
      rotation,
      minFilter: min.value,
      magFilter: mag.value,
      anisotropy,
      colorSpace: resolveColorSpace(),
      generateMipmaps: min.mipmaps,
    });
  }

  syncHeroTexture();

  const heroMaterial = new THREE.MeshBasicMaterial({ map: heroTexture });
  const hero = addPlane(scene, {
    width: 4.2,
    height: 4.2,
    x: 0,
    y: 0.02,
    z: 0,
    material: heroMaterial,
  });

  const canvasMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture });
  addPlane(scene, {
    width: 2.2,
    height: 2.2,
    x: -3.6,
    y: 0.02,
    z: 1.2,
    material: canvasMaterial,
  });

  canvasTexture.wrapS = THREE.RepeatWrapping;
  canvasTexture.wrapT = THREE.RepeatWrapping;
  canvasTexture.repeat.set(1.5, 1.5);

  const animatedMaterial = new THREE.MeshBasicMaterial({ map: animated.texture });
  addPlane(scene, {
    width: 2.2,
    height: 2.2,
    x: 3.6,
    y: 0.02,
    z: 1.2,
    material: animatedMaterial,
  });

  const wrapModes = [
    { mode: THREE.ClampToEdgeWrapping, x: -2.8, label: 'Clamp' },
    { mode: THREE.RepeatWrapping, x: 0, label: 'Repeat' },
    { mode: THREE.MirroredRepeatWrapping, x: 2.8, label: 'Mirror' },
  ];

  const wrapMeshes = wrapModes.map(({ mode, x, label }) => {
    const tex = comparisonSource.clone();
    tex.wrapS = mode;
    tex.wrapT = mode;
    tex.repeat.set(2, 2);
    tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const mesh = addPlane(scene, {
      width: 1.6,
      height: 1.6,
      x,
      y: 0.02,
      z: -2.6,
      material: mat,
    });
    const labelMat = new THREE.MeshBasicMaterial({ map: makeLabel(label), transparent: true });
    addPlane(scene, {
      width: 1.5,
      height: 0.38,
      x,
      y: 0.03,
      z: -3.45,
      material: labelMat,
    });
    return { mesh, tex, label };
  });

  const filterModes = [
    { id: 'nearest', x: -1.5, label: 'Nearest' },
    { id: 'linear', x: 1.5, label: 'Linear mag' },
  ];

  const filterMeshes = filterModes.map(({ id, x, label }) => {
    const tex = comparisonSource.clone();
    const min = MIN_FILTERS.find((f) => f.id === id) ?? MIN_FILTERS[0];
    const mag = MAG_FILTERS.find((f) => f.id === id) ?? MAG_FILTERS[1];
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.minFilter = min.value;
    tex.magFilter = mag.value;
    tex.generateMipmaps = min.mipmaps;
    tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const mesh = addPlane(scene, {
      width: 1.5,
      height: 1.5,
      x,
      y: 0.02,
      z: -4.8,
      material: mat,
    });
    const labelMat = new THREE.MeshBasicMaterial({ map: makeLabel(label), transparent: true });
    addPlane(scene, {
      width: 1.4,
      height: 0.38,
      x,
      y: 0.03,
      z: -5.55,
      material: labelMat,
    });
    return { mesh, tex, id, label };
  });

  const colorSpaceSource = createCanvasTexture((ctx, size) => {
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0, '#ff4444');
    grad.addColorStop(0.5, '#44ff44');
    grad.addColorStop(1, '#4444ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }).texture;

  const colorSpaceMeshes = COLOR_SPACES.map((space, i) => {
    const tex = colorSpaceSource.clone();
    tex.colorSpace = space.value;
    tex.needsUpdate = true;
    const x = i === 0 ? -1.05 : 1.05;
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    addPlane(scene, {
      width: 1.8,
      height: 0.55,
      x,
      y: 0.02,
      z: 2.8,
      material: mat,
    });
    const labelMat = new THREE.MeshBasicMaterial({
      map: makeLabel(space.id === 'srgb' ? 'sRGB' : 'NoColorSpace'),
      transparent: true,
    });
    addPlane(scene, {
      width: 1.7,
      height: 0.32,
      x,
      y: 0.03,
      z: 3.35,
      material: labelMat,
    });
    return { tex, space };
  });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 14),
    new THREE.MeshStandardMaterial({ color: 0x16161e, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);
  scene.add(new THREE.GridHelper(16, 32, 0x3a3a4a, 0x252530));

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.45);
  key.position.set(4, 8, 6);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 7.5, 8.5);
  camera.lookAt(0, 0, -0.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  anisotropy = Math.min(4, maxAnisotropy);
  syncHeroTexture();

  let frameId;
  let animPhase = 0;

  function pushHud() {
    const min = resolveMinFilter();
    const mag = resolveMagFilter();
    onHudUpdate?.({
      wrapSId: WRAP_MODES.find((w) => w.value === wrapS)?.id,
      wrapTId: WRAP_MODES.find((w) => w.value === wrapT)?.id,
      wrapS,
      wrapT,
      repeatX,
      repeatY,
      offsetX,
      offsetY,
      rotation,
      rotationDeg: THREE.MathUtils.radToDeg(rotation),
      minFilterId,
      magFilterId,
      anisotropy,
      maxAnisotropy,
      colorSpaceId,
      sources: [
        { id: 'image', label: 'Image / canvas → Texture', note: 'Hero plane — gradient panel loaded as a texture image.' },
        { id: 'canvas', label: 'CanvasTexture', note: 'Static checker drawn once to a 2D canvas.' },
        { id: 'animated', label: 'Animated CanvasTexture', note: 'Redrawn each frame; set `needsUpdate` after painting.' },
      ],
      hero: {
        wrapS: wrapLabel(wrapS),
        wrapT: wrapLabel(wrapT),
        repeat: { x: repeatX, y: repeatY },
        offset: { x: offsetX, y: offsetY },
        rotation,
        rotationDeg: THREE.MathUtils.radToDeg(rotation),
        minFilter: min.label,
        magFilter: mag.label,
        anisotropy,
        colorSpace: COLOR_SPACES.find((c) => c.id === colorSpaceId)?.label,
        generateMipmaps: min.mipmaps,
      },
      wrapModes: WRAP_MODES.map((w) => ({ id: w.id, label: w.label })),
      minFilters: MIN_FILTERS.map((f) => ({ id: f.id, label: f.label })),
      magFilters: MAG_FILTERS.map((f) => ({ id: f.id, label: f.label })),
      colorSpaces: COLOR_SPACES.map((c) => ({ id: c.id, label: c.label })),
      animFrame: Math.floor(animPhase * 10),
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

  function paintAnimatedFrame(ctx, size, t) {
    const tile = 4;
    const cell = size / tile;
    for (let row = 0; row < tile; row++) {
      for (let col = 0; col < tile; col++) {
        const phase = (row + col + t * 2) % tile;
        const hue = (phase / tile) * 360;
        ctx.fillStyle = `hsl(${hue} 72% ${45 + (row % 2) * 12}%)`;
        ctx.fillRect(col * cell, row * cell, cell, cell);
      }
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = `bold ${size * 0.11}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${(t % 60).toFixed(1)}s`, size * 0.5, size * 0.5);
  }

  function animate() {
    frameId = requestAnimationFrame(animate);

    animPhase = performance.now() * 0.001;
    paintAnimatedFrame(animated.ctx, animated.size, animPhase);
    animated.texture.needsUpdate = true;

    hero.rotation.z = Math.sin(animPhase * 0.35) * 0.04;

    pushHud();
    renderer.render(scene, camera);
  }
  animate();

  function syncAndHud() {
    syncHeroTexture();
    pushHud();
  }

  return {
    setWrapS(id) {
      const mode = WRAP_MODES.find((w) => w.id === id);
      if (!mode) return;
      wrapS = mode.value;
      syncAndHud();
    },
    setWrapT(id) {
      const mode = WRAP_MODES.find((w) => w.id === id);
      if (!mode) return;
      wrapT = mode.value;
      syncAndHud();
    },
    setRepeatX(v) {
      repeatX = v;
      syncAndHud();
    },
    setRepeatY(v) {
      repeatY = v;
      syncAndHud();
    },
    setOffsetX(v) {
      offsetX = v;
      syncAndHud();
    },
    setOffsetY(v) {
      offsetY = v;
      syncAndHud();
    },
    setRotationDeg(deg) {
      rotation = THREE.MathUtils.degToRad(deg);
      syncAndHud();
    },
    setMinFilterId(id) {
      if (!MIN_FILTERS.some((f) => f.id === id)) return;
      minFilterId = id;
      syncAndHud();
    },
    setMagFilterId(id) {
      if (!MAG_FILTERS.some((f) => f.id === id)) return;
      magFilterId = id;
      syncAndHud();
    },
    setAnisotropy(v) {
      anisotropy = Math.min(maxAnisotropy, Math.max(1, v));
      syncAndHud();
    },
    setColorSpaceId(id) {
      if (!COLOR_SPACES.some((c) => c.id === id)) return;
      colorSpaceId = id;
      syncAndHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      [
        heroTexture,
        canvasTexture,
        animated.texture,
        comparisonSource,
        colorSpaceSource,
        ...wrapMeshes.map(({ tex }) => tex),
        ...filterMeshes.map(({ tex }) => tex),
        ...colorSpaceMeshes.map(({ tex }) => tex),
        ...labelTextures,
      ].forEach((t) => t.dispose());

      hero.geometry.dispose();
      heroMaterial.dispose();
      canvasMaterial.dispose();
      animatedMaterial.dispose();
      floor.geometry.dispose();
      floor.material.dispose();

      scene.traverse((obj) => {
        if (obj === hero || obj === floor) return;
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m?.dispose());
      });

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
