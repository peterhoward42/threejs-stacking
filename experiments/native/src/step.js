const STEP_MODULES = {
  1: () => import('./steps/01-scene-graph.js'),
  2: () => import('./steps/02-cameras.js'),
  3: () => import('./steps/03-geometry.js'),
  4: () => import('./steps/04-materials.js'),
  5: () => import('./steps/05-lights.js'),
  6: () => import('./steps/06-pbr-maps.js'),
  7: () => import('./steps/07-textures.js'),
  8: () => import('./steps/08-gltf-loading.js'),
  9: () => import('./steps/09-orbit-controls.js'),
  10: () => import('./steps/10-raycasting.js'),
  11: () => import('./steps/11-keyframes.js'),
  12: () => import('./steps/12-instanced-mesh.js'),
  13: () => import('./steps/13-buffer-geometry.js'),
  14: () => import('./steps/14-shader-material.js'),
  15: () => import('./steps/15-post-processing.js'),
  16: () => import('./steps/16-ibl-environments.js'),
  17: () => import('./steps/17-render-targets.js'),
  18: () => import('./steps/18-lines-edges-points.js'),
  19: () => import('./steps/19-morph-targets.js'),
  20: () => import('./steps/20-lod-culling.js'),
  21: () => import('./steps/21-css2d-overlay.js'),
  22: () => import('./steps/22-clipping-fog.js'),
  23: () => import('./steps/23-resource-lifecycle.js'),
  24: () => import('./steps/24-multi-viewports.js'),
  25: () => import('./steps/25-webgpu-renderer.js'),
};

export function resolveStep() {
  const fromQuery = new URLSearchParams(window.location.search).get('step');
  if (fromQuery != null && fromQuery !== '') {
    const n = Number(fromQuery);
    if (!Number.isNaN(n)) return n;
  }

  const fromEnv = import.meta.env.VITE_STEP;
  if (fromEnv != null && fromEnv !== '') {
    const n = Number(fromEnv);
    if (!Number.isNaN(n)) return n;
  }

  return 1;
}

export async function loadStep(step) {
  const loader = STEP_MODULES[step];
  if (!loader) {
    throw new Error(`Unknown curriculum step: ${step}`);
  }
  return loader();
}
