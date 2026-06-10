import * as THREE from 'three';

export const meta = {
  step: 1,
  title: 'Scene graph and transforms',
  description:
    'Nested groups rotate at different rates. Local transforms are relative to the parent; world values compound down the chain.',
};

const JOINT_COLORS = {
  root: 0xf5c542,
  arm: 0x42c9f5,
  wrist: 0xf542c9,
};

function makeJointMarker(color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 }),
  );
}

function makeLinkLine(color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0),
  ]);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }),
  );
}

function vec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function eulerDeg(e) {
  return {
    x: THREE.MathUtils.radToDeg(e.x),
    y: THREE.MathUtils.radToDeg(e.y),
    z: THREE.MathUtils.radToDeg(e.z),
  };
}

function quat(q) {
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

function readNode(node, autoUpdateMatrices) {
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  if (autoUpdateMatrices) {
    node.getWorldPosition(worldPos);
    node.getWorldQuaternion(worldQuat);
    node.getWorldScale(worldScale);
  } else {
    // Decompose the cached matrixWorld — stays stale when auto-update is off.
    node.matrixWorld.decompose(worldPos, worldQuat, worldScale);
  }

  return {
    name: node.name,
    local: {
      position: vec3(node.position),
      rotation: eulerDeg(node.rotation),
      scale: vec3(node.scale),
      quaternion: quat(node.quaternion),
    },
    world: {
      position: vec3(worldPos),
      quaternion: quat(worldQuat),
      scale: vec3(worldScale),
    },
    matrixWorldStale: node.matrixWorldNeedsUpdate,
  };
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2.2, 5.5);
  camera.lookAt(0, 0.4, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);

  const root = new THREE.Group();
  root.name = 'root';

  const arm = new THREE.Group();
  arm.name = 'arm';
  arm.position.set(1.1, 0, 0);

  const wrist = new THREE.Group();
  wrist.name = 'wrist';
  wrist.position.set(0.9, 0, 0);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.45, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f8, roughness: 0.35, metalness: 0.1 }),
  );
  cube.name = 'cube';
  cube.position.set(0.55, 0, 0);

  const rootMarker = makeJointMarker(JOINT_COLORS.root);
  const armMarker = makeJointMarker(JOINT_COLORS.arm);
  const wristMarker = makeJointMarker(JOINT_COLORS.wrist);

  const armLink = makeLinkLine(JOINT_COLORS.arm);
  armLink.scale.x = arm.position.length();
  const wristLink = makeLinkLine(JOINT_COLORS.wrist);
  wristLink.scale.x = wrist.position.length();
  const cubeLink = makeLinkLine(0xf0f0f8);
  cubeLink.scale.x = cube.position.length();

  root.add(rootMarker, new THREE.AxesHelper(0.55));
  arm.add(armMarker, armLink, new THREE.AxesHelper(0.45));
  wrist.add(wristMarker, wristLink, new THREE.AxesHelper(0.35));
  cube.add(cubeLink);

  wrist.add(cube);
  arm.add(wrist);
  root.add(arm);
  scene.add(root);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.6;
  scene.add(ground);

  scene.add(new THREE.GridHelper(12, 24, 0x3a3a4a, 0x252530));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  let autoUpdateMatrices = true;
  let frameId;

  function resize() {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function animate() {
    frameId = requestAnimationFrame(animate);

    root.rotation.y += 0.006;
    arm.rotation.z += 0.014;
    wrist.rotation.y += 0.028;
    cube.rotation.x += 0.02;

    scene.matrixWorldAutoUpdate = autoUpdateMatrices;
    if (!autoUpdateMatrices) {
      // Parent rotations keep changing local matrices, but world matrices stay
      // stale until you walk the graph and call updateMatrixWorld manually.
    } else {
      scene.updateMatrixWorld(true);
    }

    onHudUpdate?.({
      autoUpdateMatrices,
      nodes: [root, arm, wrist, cube].map((node) => readNode(node, autoUpdateMatrices)),
    });

    renderer.render(scene, camera);
  }
  animate();

  return {
    setAutoUpdateMatrices(value) {
      autoUpdateMatrices = value;
      if (value) {
        scene.updateMatrixWorld(true);
      }
    },
    forceMatrixWorldUpdate() {
      scene.updateMatrixWorld(true);
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

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
