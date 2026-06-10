import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export const meta = {
  step: 5,
  title: 'Light types and real-time shadows',
  description:
    'Switch between Ambient, Hemisphere, Directional, Point, Spot, and RectArea lights on the same scene. Shadow maps on the ground plane; tune map size, bias, and directional shadow frustum.',
};

const LIGHT_SPECS = [
  {
    id: 'ambient',
    label: 'AmbientLight',
    note: 'Uniform fill — no direction, no shadows.',
    intensity: 1.1,
    shadows: false,
  },
  {
    id: 'hemisphere',
    label: 'HemisphereLight',
    note: 'Sky vs ground gradient — simulates outdoor bounce, no shadows.',
    intensity: 1.35,
    shadows: false,
  },
  {
    id: 'directional',
    label: 'DirectionalLight',
    note: 'Parallel sun rays — tune shadow camera frustum and map quality.',
    intensity: 1.65,
    shadows: true,
  },
  {
    id: 'point',
    label: 'PointLight',
    note: 'Omnidirectional bulb — casts shadows in every direction.',
    intensity: 42,
    shadows: true,
  },
  {
    id: 'spot',
    label: 'SpotLight',
    note: 'Cone-shaped beam with penumbra falloff.',
    intensity: 55,
    shadows: true,
  },
  {
    id: 'rectarea',
    label: 'RectAreaLight',
    note: 'Soft rectangular emitter — area shading, no shadow maps in WebGL.',
    intensity: 6.5,
    shadows: false,
  },
];

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.92, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(new THREE.GridHelper(16, 32, 0x3a3a4a, 0x252530));

  const hero = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.55, 0.18, 128, 24),
    new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.38, metalness: 0.12 }),
  );
  hero.position.set(0, 1.05, 0);
  hero.castShadow = true;
  scene.add(hero);

  const props = [
    { geo: new THREE.BoxGeometry(0.9, 1.4, 0.9), color: 0x42c9f5, pos: [-2.4, 0.7, 1.2] },
    { geo: new THREE.SphereGeometry(0.55, 32, 16), color: 0xf542c9, pos: [2.2, 0.55, 0.8] },
    { geo: new THREE.CylinderGeometry(0.35, 0.5, 1.2, 20), color: 0x7af542, pos: [-1.4, 0.6, -2.1] },
    { geo: new THREE.ConeGeometry(0.45, 1.1, 24), color: 0xc97af5, pos: [1.8, 0.55, -1.6] },
  ];

  for (const prop of props) {
    const mesh = new THREE.Mesh(
      prop.geo,
      new THREE.MeshStandardMaterial({ color: prop.color, roughness: 0.42, metalness: 0.08 }),
    );
    mesh.position.set(...prop.pos);
    mesh.castShadow = true;
    scene.add(mesh);
  }

  return { scene, hero, ground };
}

function createLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0);
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0xb8d4ff, 0x3a2818, 0);
  hemisphere.position.set(0, 12, 0);
  scene.add(hemisphere);

  const directional = new THREE.DirectionalLight(0xffffff, 0);
  directional.position.set(5.5, 9, 3.5);
  directional.target.position.set(0, 0.4, 0);
  scene.add(directional);
  scene.add(directional.target);

  const point = new THREE.PointLight(0xffeedd, 0, 18);
  point.position.set(-2.5, 3.2, 2.5);
  scene.add(point);

  const spot = new THREE.SpotLight(0xffffff, 0, 24, Math.PI / 5.5, 0.28, 1.2);
  spot.position.set(3.5, 7, 4);
  spot.target.position.set(0, 0.5, 0);
  scene.add(spot);
  scene.add(spot.target);

  const rectArea = new THREE.RectAreaLight(0xfff0dd, 0, 3.2, 1.6);
  rectArea.position.set(-3.8, 3.2, 1.2);
  rectArea.lookAt(0, 0.6, 0);
  scene.add(rectArea);

  return { ambient, hemisphere, directional, point, spot, rectArea };
}

function createHelpers(lights) {
  const directionalHelper = new THREE.DirectionalLightHelper(lights.directional, 1.2, 0xf0c060);
  const pointHelper = new THREE.PointLightHelper(lights.point, 0.35, 0xf0c060);
  const spotHelper = new THREE.SpotLightHelper(lights.spot, 0xf0c060);

  directionalHelper.visible = false;
  pointHelper.visible = false;
  spotHelper.visible = false;

  return { directionalHelper, pointHelper, spotHelper };
}

function configureShadowLight(light, mapSize, bias, normalBias) {
  light.castShadow = true;
  light.shadow.mapSize.set(mapSize, mapSize);
  light.shadow.bias = bias;
  light.shadow.normalBias = normalBias;

  if (light.isDirectionalLight) {
    const cam = light.shadow.camera;
    cam.near = 0.4;
    cam.far = 28;
  }

  if (light.isPointLight) {
    light.shadow.camera.near = 0.4;
    light.shadow.camera.far = 18;
  }

  if (light.isSpotLight) {
    const cam = light.shadow.camera;
    cam.near = 0.4;
    cam.far = 24;
    cam.fov = THREE.MathUtils.radToDeg(light.angle) * 1.15;
  }
}

function applyDirectionalFrustum(light, size) {
  const cam = light.shadow.camera;
  cam.left = -size;
  cam.right = size;
  cam.top = size;
  cam.bottom = -size;
  cam.updateProjectionMatrix();
}

function lightById(lights, id) {
  return lights[id === 'rectarea' ? 'rectArea' : id];
}

function specById(id) {
  return LIGHT_SPECS.find((spec) => spec.id === id) ?? LIGHT_SPECS[2];
}

export function mount(container, { onHudUpdate } = {}) {
  const { scene, hero } = buildScene();
  const lights = createLights(scene);
  const helpers = createHelpers(lights);

  scene.add(helpers.directionalHelper, helpers.pointHelper, helpers.spotHelper);

  RectAreaLightUniformsLib.init();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(7.5, 5.2, 8.5);
  camera.lookAt(0, 0.6, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  let activeLightId = 'directional';
  let shadowMapSize = 2048;
  let shadowBias = -0.0002;
  let shadowNormalBias = 0.02;
  let shadowFrustum = 7;
  let showHelpers = true;
  let frameId;

  function applyActiveLight() {
    for (const spec of LIGHT_SPECS) {
      const light = lightById(lights, spec.id);
      const active = spec.id === activeLightId;
      light.intensity = active ? spec.intensity : 0;

      if (light.castShadow != null) {
        light.castShadow = active && spec.shadows;
      }
    }

    if (activeLightId === 'directional') {
      configureShadowLight(lights.directional, shadowMapSize, shadowBias, shadowNormalBias);
      applyDirectionalFrustum(lights.directional, shadowFrustum);
    } else if (activeLightId === 'point') {
      configureShadowLight(lights.point, shadowMapSize, shadowBias, shadowNormalBias);
    } else if (activeLightId === 'spot') {
      configureShadowLight(lights.spot, shadowMapSize, shadowBias, shadowNormalBias);
    }

    helpers.directionalHelper.visible = showHelpers && activeLightId === 'directional';
    helpers.pointHelper.visible = showHelpers && activeLightId === 'point';
    helpers.spotHelper.visible = showHelpers && activeLightId === 'spot';

    if (activeLightId === 'directional') helpers.directionalHelper.update();
    if (activeLightId === 'point') helpers.pointHelper.update();
    if (activeLightId === 'spot') helpers.spotHelper.update();
  }

  function pushHud() {
    const spec = specById(activeLightId);
    const activeLight = lightById(lights, activeLightId);
    const shadowCam =
      activeLight.shadow?.camera && activeLight.castShadow ? activeLight.shadow.camera : null;

    onHudUpdate?.({
      activeLightId,
      shadowMapSize,
      shadowBias,
      shadowNormalBias,
      shadowFrustum,
      showHelpers,
      lights: LIGHT_SPECS.map((entry) => ({
        id: entry.id,
        label: entry.label,
        note: entry.note,
        shadows: entry.shadows,
      })),
      active: {
        label: spec.label,
        note: spec.note,
        shadows: spec.shadows,
        intensity: activeLight.intensity,
        shadowMap:
          activeLight.castShadow && activeLight.shadow
            ? {
                width: activeLight.shadow.mapSize.x,
                height: activeLight.shadow.mapSize.y,
                bias: activeLight.shadow.bias,
                normalBias: activeLight.shadow.normalBias,
              }
            : null,
        shadowCamera: shadowCam
          ? {
              near: shadowCam.near,
              far: shadowCam.far,
              left: shadowCam.left,
              right: shadowCam.right,
              top: shadowCam.top,
              bottom: shadowCam.bottom,
            }
          : null,
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
  applyActiveLight();
  pushHud();

  function animate() {
    frameId = requestAnimationFrame(animate);

    const t = performance.now() * 0.001;
    hero.rotation.x = t * 0.22;
    hero.rotation.y = t * 0.34;

    if (activeLightId === 'point') {
      lights.point.position.x = Math.sin(t * 0.55) * 2.8;
      lights.point.position.z = 2.2 + Math.cos(t * 0.4) * 0.8;
      if (showHelpers) helpers.pointHelper.update();
    }

    if (activeLightId === 'directional' && showHelpers) helpers.directionalHelper.update();
    if (activeLightId === 'spot' && showHelpers) helpers.spotHelper.update();

    pushHud();
    renderer.render(scene, camera);
  }
  animate();

  return {
    setActiveLightId(id) {
      if (!LIGHT_SPECS.some((spec) => spec.id === id)) return;
      activeLightId = id;
      applyActiveLight();
    },
    setShadowMapSize(size) {
      shadowMapSize = size;
      applyActiveLight();
    },
    setShadowBias(bias) {
      shadowBias = bias;
      applyActiveLight();
    },
    setShadowNormalBias(normalBias) {
      shadowNormalBias = normalBias;
      applyActiveLight();
    },
    setShadowFrustum(size) {
      shadowFrustum = size;
      applyActiveLight();
    },
    setShowHelpers(visible) {
      showHelpers = visible;
      applyActiveLight();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

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

      helpers.directionalHelper.dispose();
      helpers.pointHelper.dispose();
      helpers.spotHelper.dispose();

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
