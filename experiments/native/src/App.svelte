<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  let container;

  onMount(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111118);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(renderer.domElement);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x4f8cff }),
    );
    scene.add(cube);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 2, 3);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

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

    let frameId;
    function animate() {
      frameId = requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.015;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      cube.geometry.dispose();
      cube.material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  });
</script>

<main>
  <header>
    <h1>native</h1>
    <p>Bare Three.js + Svelte — rotating cube</p>
  </header>
  <div bind:this={container} class="canvas-host" aria-label="Three.js canvas"></div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #2a2a36;
  }

  h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: #9a9aad;
  }

  .canvas-host {
    flex: 1;
    min-height: 0;
  }
</style>
