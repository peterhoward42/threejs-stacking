import * as THREE from 'three';

export const meta = {
  step: 2,
  title: 'Cameras and projection',
  description:
    'The same scene through PerspectiveCamera (left) and OrthographicCamera (right). Adjust fov, near/far, and ortho frustum size to see how projection changes depth cues.',
};

const BOX_COLORS = [0xf5c542, 0x42c9f5, 0xf542c9, 0x7af542, 0xc97af5];

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111118);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);
  scene.add(new THREE.GridHelper(14, 28, 0x3a3a4a, 0x252530));

  // Receding row — perspective convergence is obvious on the left viewport.
  for (let i = 0; i < 5; i++) {
    const h = 0.6 + i * 0.35;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, h, 0.7),
      new THREE.MeshStandardMaterial({
        color: BOX_COLORS[i % BOX_COLORS.length],
        roughness: 0.4,
        metalness: 0.08,
      }),
    );
    mesh.position.set(-2 + i * 1.1, h / 2, -i * 1.4);
    scene.add(mesh);
  }

  // Side towers at equal world height — ortho keeps parallel edges; perspective does not.
  [-3.2, 3.2].forEach((x, i) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 2.4, 16),
      new THREE.MeshStandardMaterial({
        color: i === 0 ? 0xf0f0f8 : 0x8a8a9a,
        roughness: 0.35,
        metalness: 0.12,
      }),
    );
    mesh.position.set(x, 1.2, 1.5);
    scene.add(mesh);
  });

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  return scene;
}

export function mount(container, { onHudUpdate } = {}) {
  const scene = buildScene();

  const perspectiveCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

  const lookTarget = new THREE.Vector3(0, 0.6, -1.5);
  const cameraOffset = new THREE.Vector3(5.5, 3.8, 7.5);

  perspectiveCamera.position.copy(cameraOffset);
  perspectiveCamera.lookAt(lookTarget);
  orthographicCamera.position.copy(cameraOffset);
  orthographicCamera.lookAt(lookTarget);

  const perspHelper = new THREE.CameraHelper(perspectiveCamera);
  const orthoHelper = new THREE.CameraHelper(orthographicCamera);
  scene.add(perspHelper, orthoHelper);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);

  let fov = 50;
  let near = 0.1;
  let far = 100;
  let orthoSize = 8;
  let showHelpers = true;
  let perspAspect = 1;
  let orthoAspect = 1;
  let frameId;

  perspHelper.visible = showHelpers;
  orthoHelper.visible = showHelpers;

  function updatePerspectiveProjection() {
    perspectiveCamera.fov = fov;
    perspectiveCamera.aspect = perspAspect;
    perspectiveCamera.near = near;
    perspectiveCamera.far = far;
    perspectiveCamera.updateProjectionMatrix();
    perspHelper.update();
  }

  function updateOrthographicProjection() {
    const halfH = orthoSize / 2;
    const halfW = halfH * orthoAspect;
    orthographicCamera.left = -halfW;
    orthographicCamera.right = halfW;
    orthographicCamera.top = halfH;
    orthographicCamera.bottom = -halfH;
    orthographicCamera.near = near;
    orthographicCamera.far = far;
    orthographicCamera.updateProjectionMatrix();
    orthoHelper.update();
  }

  function updateHelpersVisibility() {
    perspHelper.visible = showHelpers;
    orthoHelper.visible = showHelpers;
  }

  function pushHud() {
    onHudUpdate?.({
      fov,
      near,
      far,
      orthoSize,
      showHelpers,
      perspective: {
        fov: perspectiveCamera.fov,
        near: perspectiveCamera.near,
        far: perspectiveCamera.far,
        aspect: perspectiveCamera.aspect,
      },
      orthographic: {
        left: orthographicCamera.left,
        right: orthographicCamera.right,
        top: orthographicCamera.top,
        bottom: orthographicCamera.bottom,
        near: orthographicCamera.near,
        far: orthographicCamera.far,
      },
    });
  }

  function resize() {
    const { clientWidth, clientHeight } = container;
    const halfWidth = Math.floor(clientWidth / 2);

    perspAspect = halfWidth / clientHeight;
    orthoAspect = (clientWidth - halfWidth) / clientHeight;

    updatePerspectiveProjection();
    updateOrthographicProjection();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function renderSplit() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const halfWidth = Math.floor(width / 2);
    const rightWidth = width - halfWidth;

    renderer.setScissorTest(true);

    renderer.setViewport(0, 0, halfWidth, height);
    renderer.setScissor(0, 0, halfWidth, height);
    renderer.render(scene, perspectiveCamera);

    renderer.setViewport(halfWidth, 0, rightWidth, height);
    renderer.setScissor(halfWidth, 0, rightWidth, height);
    renderer.render(scene, orthographicCamera);

    renderer.setScissorTest(false);
  }

  function animate() {
    frameId = requestAnimationFrame(animate);
    pushHud();
    renderSplit();
  }
  animate();

  return {
    setFov(value) {
      fov = value;
      updatePerspectiveProjection();
    },
    setNear(value) {
      near = value;
      updatePerspectiveProjection();
      updateOrthographicProjection();
    },
    setFar(value) {
      far = value;
      updatePerspectiveProjection();
      updateOrthographicProjection();
    },
    setOrthoSize(value) {
      orthoSize = value;
      updateOrthographicProjection();
    },
    setShowHelpers(value) {
      showHelpers = value;
      updateHelpersVisibility();
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
      perspHelper.dispose();
      orthoHelper.dispose();

      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
