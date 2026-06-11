import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js';
import { HueSaturationShader } from 'three/addons/shaders/HueSaturationShader.js';

import { metaForStep } from '../curriculum.js';

export const meta = metaForStep(15);


const PASS_CATALOG = [
  {
    id: 'render',
    label: 'RenderPass',
    hint: 'Renders `scene` + `camera` into the composer read buffer — the first RTT step.',
    locked: true,
  },
  {
    id: 'outline',
    label: 'OutlinePass',
    hint: 'Draws edge outlines around `selectedObjects` after the base scene pass.',
  },
  {
    id: 'bloom',
    label: 'UnrealBloomPass',
    hint: 'Extracts bright pixels, blurs mips, and additively composites bloom.',
  },
  {
    id: 'grade',
    label: 'Color grading',
    hint: 'Two `ShaderPass`es: `BrightnessContrastShader` then `HueSaturationShader`.',
  },
  {
    id: 'output',
    label: 'OutputPass',
    hint: 'Applies renderer tone mapping and color-space conversion before screen/FXAA.',
    locked: true,
  },
  {
    id: 'fxaa',
    label: 'FXAAPass',
    hint: 'Fast approximate anti-aliasing on the final sRGB image (after `OutputPass`).',
  },
];

const RING_COLORS = [0xf5c542, 0x42c9f5, 0xf542c9, 0x7af542, 0xc97af5];

function buildScene(outlineTargets) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 64),
    new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.92, metalness: 0.08 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.GridHelper(14, 28, 0x3a3a4a, 0x222230));

  const hero = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.95, 0.28, 180, 32),
    new THREE.MeshStandardMaterial({
      color: 0x2244aa,
      emissive: 0x66ccff,
      emissiveIntensity: 1.35,
      roughness: 0.22,
      metalness: 0.55,
    }),
  );
  hero.position.y = 1.35;
  hero.castShadow = true;
  hero.name = 'heroTorus';
  scene.add(hero);
  outlineTargets.push(hero);

  const accent = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshStandardMaterial({
      color: 0xff8844,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x331100,
      emissiveIntensity: 0.4,
    }),
  );
  accent.position.set(-2.1, 1.1, 0.8);
  accent.castShadow = true;
  accent.name = 'accentIcosahedron';
  scene.add(accent);
  outlineTargets.push(accent);

  const orbitGroup = new THREE.Group();
  orbitGroup.name = 'orbitProps';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.38, 0.38),
      new THREE.MeshStandardMaterial({
        color: RING_COLORS[i % RING_COLORS.length],
        roughness: 0.45,
        metalness: 0.12,
      }),
    );
    mesh.position.set(Math.cos(angle) * 3.2, 0.55, Math.sin(angle) * 3.2);
    mesh.castShadow = true;
    orbitGroup.add(mesh);
  }
  scene.add(orbitGroup);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.85, 0.35, 32),
    new THREE.MeshStandardMaterial({ color: 0xd8d8e8, roughness: 0.28, metalness: 0.18 }),
  );
  plinth.position.y = 0.175;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  scene.add(plinth);

  scene.add(new THREE.AmbientLight(0xffffff, 0.28));
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(5, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 24;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  const rim = new THREE.PointLight(0xaaccff, 12, 18);
  rim.position.set(-4, 3, -3);
  scene.add(rim);

  return { scene, hero, orbitGroup };
}

function summarizePasses(passState, composer) {
  return PASS_CATALOG.map((def) => {
    const enabled = def.locked ? true : Boolean(passState[def.id]);
    return {
      ...def,
      enabled,
      active: enabled,
    };
  }).concat([
    {
      id: 'ping-pong',
      label: 'read ↔ write buffers',
      hint: `Composer ping-pongs between two \`WebGLRenderTarget\`s (${composer.renderTarget1.texture.name} / ${composer.renderTarget2.texture.name}). Each pass with \`needsSwap\` writes one buffer and reads the other.`,
      enabled: true,
      active: true,
      locked: true,
    },
  ]);
}

export function mount(container, { onHudUpdate } = {}) {
  const outlineTargets = [];
  const { scene, hero, orbitGroup } = buildScene(outlineTargets);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.08, 60);
  camera.position.set(5.5, 4.2, 6.2);

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.update();

  const resolution = new THREE.Vector2();
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);

  const outlinePass = new OutlinePass(resolution, scene, camera, outlineTargets);
  outlinePass.visibleEdgeColor.set(0x44eeff);
  outlinePass.hiddenEdgeColor.set(0x1a4466);
  outlinePass.edgeStrength = 2.8;
  outlinePass.edgeThickness = 1.2;
  outlinePass.pulsePeriod = 2;

  const bloomPass = new UnrealBloomPass(resolution, 0.75, 0.42, 0.62);

  const contrastPass = new ShaderPass(BrightnessContrastShader);
  const huePass = new ShaderPass(HueSaturationShader);
  const outputPass = new OutputPass();
  const fxaaPass = new FXAAPass();

  contrastPass.uniforms.brightness.value = 0.04;
  contrastPass.uniforms.contrast.value = 0.18;
  huePass.uniforms.hue.value = 0.06;
  huePass.uniforms.saturation.value = 0.22;

  composer.addPass(renderPass);
  composer.addPass(outlinePass);
  composer.addPass(bloomPass);
  composer.addPass(contrastPass);
  composer.addPass(huePass);
  composer.addPass(outputPass);
  composer.addPass(fxaaPass);

  let useComposer = true;
  const passState = {
    outline: true,
    bloom: true,
    grade: true,
    fxaa: false,
  };

  function applyPassState() {
    outlinePass.enabled = passState.outline;
    bloomPass.enabled = passState.bloom;
    contrastPass.enabled = passState.grade;
    huePass.enabled = passState.grade;
    fxaaPass.enabled = passState.fxaa;
  }
  applyPassState();

  const clock = new THREE.Clock();
  let frameId;

  function pushHud() {
    const { clientWidth, clientHeight } = container;
    const pr = renderer.getPixelRatio();
    onHudUpdate?.({
      useComposer,
      passState: { ...passState },
      passes: summarizePasses(passState, composer),
      bloomStrength: bloomPass.strength,
      bloomRadius: bloomPass.radius,
      bloomThreshold: bloomPass.threshold,
      outlineStrength: outlinePass.edgeStrength,
      brightness: contrastPass.uniforms.brightness.value,
      contrast: contrastPass.uniforms.contrast.value,
      hue: huePass.uniforms.hue.value,
      saturation: huePass.uniforms.saturation.value,
      renderMode: useComposer ? 'EffectComposer (RTT chain)' : 'renderer.render (direct)',
      bufferSize: {
        logical: `${clientWidth}×${clientHeight}`,
        physical: `${Math.round(clientWidth * pr)}×${Math.round(clientHeight * pr)}`,
      },
      outlineTargets: outlineTargets.map((obj) => obj.name),
      elapsed: clock.getElapsedTime(),
    });
  }

  function resize() {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(clientWidth, clientHeight);
    resolution.set(clientWidth, clientHeight);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function tick() {
    frameId = requestAnimationFrame(tick);
    const elapsed = clock.getElapsedTime();

    hero.rotation.y = elapsed * 0.42;
    hero.rotation.x = Math.sin(elapsed * 0.35) * 0.18;
    orbitGroup.rotation.y = elapsed * 0.22;

    controls.update();

    if (useComposer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    pushHud();
  }
  tick();

  return {
    setUseComposer(value) {
      if (value === useComposer) return;
      useComposer = value;
      pushHud();
    },
    setPassEnabled(id, value) {
      if (!(id in passState)) return;
      if (passState[id] === value) return;
      passState[id] = value;
      applyPassState();
      pushHud();
    },
    setBloomStrength(value) {
      bloomPass.strength = Math.max(0, Math.min(2.5, value));
      pushHud();
    },
    setBloomRadius(value) {
      bloomPass.radius = Math.max(0, Math.min(1.2, value));
      pushHud();
    },
    setBloomThreshold(value) {
      bloomPass.threshold = Math.max(0, Math.min(1.5, value));
      pushHud();
    },
    setOutlineStrength(value) {
      outlinePass.edgeStrength = Math.max(0, Math.min(6, value));
      pushHud();
    },
    setBrightness(value) {
      contrastPass.uniforms.brightness.value = Math.max(-0.5, Math.min(0.5, value));
      pushHud();
    },
    setContrast(value) {
      contrastPass.uniforms.contrast.value = Math.max(-0.5, Math.min(0.5, value));
      pushHud();
    },
    setHue(value) {
      huePass.uniforms.hue.value = Math.max(-1, Math.min(1, value));
      pushHud();
    },
    setSaturation(value) {
      huePass.uniforms.saturation.value = Math.max(-1, Math.min(1, value));
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      composer.dispose();
      outlinePass.dispose();
      bloomPass.dispose();
      contrastPass.dispose();
      huePass.dispose();
      outputPass.dispose();
      fxaaPass.dispose();
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
