import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const meta = {
  step: 14,
  title: 'ShaderMaterial essentials',
  description:
    'Custom GLSL via `ShaderMaterial`: `time` and `color` uniforms, UV/normal varyings from attributes, procedural colouring and wave displacement — using Three.js `#include` shader chunks, not `onBeforeCompile`.',
};

const PRESETS = [
  {
    id: 'procedural-uv',
    label: 'Procedural UV colour',
    geometry: 'torusKnot',
    color: 0x42c9f5,
    hint: 'Fragment shader mixes ripples and a checker from `vUv`; vertex shader passes UVs through `<uv_vertex>`.',
    chunks: [
      'common',
      'uv_pars_vertex',
      'normal_pars_vertex',
      'uv_vertex',
      'beginnormal_vertex',
      'defaultnormal_vertex',
      'normal_vertex',
      'begin_vertex',
      'project_vertex',
    ],
    uniforms: ['time', 'uColor', 'uStripeScale'],
  },
  {
    id: 'normal-rgb',
    label: 'Normal → RGB',
    geometry: 'sphere',
    color: 0xffffff,
    hint: '`<normal_vertex>` writes `vNormal`; fragment maps world-space normal to RGB for a quick normal debug view.',
    chunks: [
      'common',
      'uv_pars_vertex',
      'normal_pars_vertex',
      'uv_vertex',
      'beginnormal_vertex',
      'defaultnormal_vertex',
      'normal_vertex',
      'begin_vertex',
      'project_vertex',
    ],
    uniforms: ['time', 'uColor', 'uBlend'],
  },
  {
    id: 'wave-displace',
    label: 'Wave displacement',
    geometry: 'plane',
    color: 0xf5a742,
    hint: 'Vertex shader displaces along `normal` after `<begin_vertex>`; `time` and `uAmplitude` drive the ripple.',
    chunks: [
      'common',
      'uv_pars_vertex',
      'normal_pars_vertex',
      'uv_vertex',
      'beginnormal_vertex',
      'defaultnormal_vertex',
      'normal_vertex',
      'begin_vertex',
      'project_vertex',
    ],
    uniforms: ['time', 'uColor', 'uAmplitude', 'uFrequency'],
  },
];

const VERTEX_PARS = /* glsl */ `
#include <common>
#include <uv_pars_vertex>
#include <normal_pars_vertex>
`;

const VERTEX_BODY = /* glsl */ `
  #include <uv_vertex>
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>
  #include <begin_vertex>
  #include <project_vertex>
`;

const VERTEX_PROCEDURAL = /* glsl */ `
${VERTEX_PARS}

void main() {
${VERTEX_BODY}
}
`;

const FRAGMENT_PROCEDURAL = /* glsl */ `
uniform float time;
uniform vec3 uColor;
uniform float uStripeScale;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  float checker =
    mod(floor(vUv.x * uStripeScale) + floor(vUv.y * uStripeScale), 2.0);
  float ripple = sin(length(vUv - 0.5) * 28.0 - time * 2.4) * 0.5 + 0.5;
  vec3 col = mix(uColor * 0.3, uColor, ripple);
  col = mix(col * 0.75, col, checker);
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERTEX_NORMAL = VERTEX_PROCEDURAL;

const FRAGMENT_NORMAL = /* glsl */ `
uniform float time;
uniform vec3 uColor;
uniform float uBlend;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vec3 n = normalize(vNormal) * 0.5 + 0.5;
  float pulse = sin(time + vUv.y * 6.283) * 0.5 + 0.5;
  vec3 procedural = uColor * pulse;
  vec3 col = mix(n, procedural, uBlend);
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERTEX_WAVE = /* glsl */ `
${VERTEX_PARS}

uniform float time;
uniform float uAmplitude;
uniform float uFrequency;

void main() {
  #include <uv_vertex>
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>
  #include <begin_vertex>

  float wave =
    sin(position.x * uFrequency + time) *
    cos(position.z * uFrequency * 0.85 + time * 0.7);
  transformed += normal * wave * uAmplitude;

  #include <project_vertex>
}
`;

const FRAGMENT_WAVE = /* glsl */ `
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vec3 n = normalize(vNormal);
  float fresnel = pow(1.0 - abs(n.y), 2.2);
  float shade = 0.55 + fresnel * 0.45;
  gl_FragColor = vec4(uColor * shade, 1.0);
}
`;

const SHADER_SOURCES = {
  'procedural-uv': { vertex: VERTEX_PROCEDURAL, fragment: FRAGMENT_PROCEDURAL },
  'normal-rgb': { vertex: VERTEX_NORMAL, fragment: FRAGMENT_NORMAL },
  'wave-displace': { vertex: VERTEX_WAVE, fragment: FRAGMENT_WAVE },
};

function buildGeometry(kind) {
  if (kind === 'torusKnot') {
    return new THREE.TorusKnotGeometry(1, 0.32, 160, 32);
  }
  if (kind === 'sphere') {
    return new THREE.SphereGeometry(1.45, 72, 48);
  }
  const plane = new THREE.PlaneGeometry(5.5, 5.5, 96, 96);
  plane.rotateX(-Math.PI / 2);
  return plane;
}

function createUniforms(presetId, colorHex) {
  const color = new THREE.Color(colorHex);
  const base = {
    time: { value: 0 },
    uColor: { value: color },
  };

  if (presetId === 'procedural-uv') {
    return { ...base, uStripeScale: { value: 10 } };
  }
  if (presetId === 'normal-rgb') {
    return { ...base, uBlend: { value: 0 } };
  }
  return { ...base, uAmplitude: { value: 0.22 }, uFrequency: { value: 2.4 } };
}

function summarizeUniforms(uniforms) {
  const summary = {};
  for (const [key, entry] of Object.entries(uniforms)) {
    const value = entry.value;
    if (value instanceof THREE.Color) {
      summary[key] = `#${value.getHexString()}`;
    } else if (typeof value === 'number') {
      summary[key] = value;
    } else {
      summary[key] = String(value);
    }
  }
  return summary;
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12121a);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 80);
  camera.position.set(4.2, 3.4, 5.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.15, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.update();

  scene.add(new THREE.GridHelper(10, 20, 0x3a3a4a, 0x252530));
  scene.add(new THREE.AxesHelper(1.2));

  let presetId = 'procedural-uv';
  let colorHex = PRESETS[0].color;
  let timeSpeed = 1;
  let wireframe = false;
  let stripeScale = 10;
  let normalBlend = 0;
  let waveAmplitude = 0.22;
  let waveFrequency = 2.4;

  let mesh = new THREE.Mesh();
  scene.add(mesh);

  const clock = new THREE.Clock();
  let frameId;

  function getPreset() {
    return PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  }

  function rebuildMaterial() {
    const preset = getPreset();
    const sources = SHADER_SOURCES[presetId];
    const uniforms = createUniforms(presetId, colorHex);

    if (presetId === 'procedural-uv') uniforms.uStripeScale.value = stripeScale;
    if (presetId === 'normal-rgb') uniforms.uBlend.value = normalBlend;
    if (presetId === 'wave-displace') {
      uniforms.uAmplitude.value = waveAmplitude;
      uniforms.uFrequency.value = waveFrequency;
    }

    mesh.material?.dispose();
    mesh.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: sources.vertex,
      fragmentShader: sources.fragment,
      wireframe,
      side: THREE.DoubleSide,
      defines: { USE_UV: '' },
    });

    mesh.userData.shaderLabel = `${preset.label} shaders`;
    mesh.userData.chunks = preset.chunks;
    mesh.userData.uniformKeys = preset.uniforms;
  }

  function rebuildMesh() {
    const preset = getPreset();
    mesh.geometry?.dispose();
    mesh.geometry = buildGeometry(preset.geometry);
    rebuildMaterial();
  }

  rebuildMesh();

  function pushHud() {
    const preset = getPreset();
    const material = mesh.material;
    const elapsed = clock.getElapsedTime();

    onHudUpdate?.({
      presetId,
      presets: PRESETS.map((p) => ({ id: p.id, label: p.label, hint: p.hint })),
      colorHex: `#${material.uniforms.uColor.value.getHexString()}`,
      timeSpeed,
      wireframe,
      stripeScale,
      stripeScaleEnabled: presetId === 'procedural-uv',
      normalBlend,
      normalBlendEnabled: presetId === 'normal-rgb',
      waveAmplitude,
      waveFrequency,
      waveControlsEnabled: presetId === 'wave-displace',
      selected: {
        id: preset.id,
        label: preset.label,
        hint: preset.hint,
        geometry: mesh.geometry.type,
        vertexCount: mesh.geometry.attributes.position?.count ?? 0,
        chunks: mesh.userData.chunks ?? [],
        uniformKeys: mesh.userData.uniformKeys ?? [],
        uniforms: summarizeUniforms(material.uniforms),
        elapsed,
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
    mesh.material.uniforms.time.value = elapsed * timeSpeed;

    if (presetId === 'wave-displace') {
      mesh.material.uniforms.uAmplitude.value = waveAmplitude;
      mesh.material.uniforms.uFrequency.value = waveFrequency;
    } else if (presetId === 'procedural-uv') {
      mesh.material.uniforms.uStripeScale.value = stripeScale;
    } else if (presetId === 'normal-rgb') {
      mesh.material.uniforms.uBlend.value = normalBlend;
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
      const preset = getPreset();
      colorHex = preset.color;
      rebuildMesh();
    },
    setColor(hex) {
      const normalized = hex.startsWith('#') ? hex : `#${hex}`;
      colorHex = Number.parseInt(normalized.slice(1), 16);
      mesh.material.uniforms.uColor.value.setHex(colorHex);
      pushHud();
    },
    setTimeSpeed(value) {
      const next = Math.max(0, Math.min(3, value));
      if (next === timeSpeed) return;
      timeSpeed = next;
      pushHud();
    },
    setWireframe(value) {
      if (value === wireframe) return;
      wireframe = value;
      mesh.material.wireframe = wireframe;
      pushHud();
    },
    setStripeScale(value) {
      const next = Math.max(2, Math.min(24, Math.round(value)));
      if (next === stripeScale) return;
      stripeScale = next;
      if (presetId === 'procedural-uv') {
        mesh.material.uniforms.uStripeScale.value = stripeScale;
      }
      pushHud();
    },
    setNormalBlend(value) {
      const next = Math.max(0, Math.min(1, value));
      if (next === normalBlend) return;
      normalBlend = next;
      if (presetId === 'normal-rgb') {
        mesh.material.uniforms.uBlend.value = normalBlend;
      }
      pushHud();
    },
    setWaveAmplitude(value) {
      const next = Math.max(0, Math.min(0.6, value));
      if (next === waveAmplitude) return;
      waveAmplitude = next;
      pushHud();
    },
    setWaveFrequency(value) {
      const next = Math.max(0.5, Math.min(6, value));
      if (next === waveFrequency) return;
      waveFrequency = next;
      pushHud();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      mesh.geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
