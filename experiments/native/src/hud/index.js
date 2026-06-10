// Per-step HUD panels. New curriculum steps: add HudNN….svelte here and register below.
// Keep App.svelte as a thin shell — step-specific UI lives in this folder.

const HUD_LOADERS = {
  1: () => import('./Hud01SceneGraph.svelte'),
  2: () => import('./Hud02Cameras.svelte'),
  3: () => import('./Hud03Geometry.svelte'),
  4: () => import('./Hud04Materials.svelte'),
  5: () => import('./Hud05Lights.svelte'),
  6: () => import('./Hud06PbrMaps.svelte'),
  7: () => import('./Hud07Textures.svelte'),
  8: () => import('./Hud08GltfLoading.svelte'),
  9: () => import('./Hud09OrbitControls.svelte'),
  10: () => import('./Hud10Raycasting.svelte'),
  11: () => import('./Hud11Keyframes.svelte'),
  12: () => import('./Hud12InstancedMesh.svelte'),
  13: () => import('./Hud13BufferGeometry.svelte'),
  14: () => import('./Hud14ShaderMaterial.svelte'),
  15: () => import('./Hud15PostProcessing.svelte'),
  16: () => import('./Hud16IblEnvironments.svelte'),
  17: () => import('./Hud17RenderTargets.svelte'),
};

const OVERLAY_LOADERS = {
  2: () => import('./Overlay02Cameras.svelte'),
};

export async function loadHud(step) {
  const load = HUD_LOADERS[step];
  if (!load) return null;
  const mod = await load();
  return mod.default;
}

export async function loadOverlay(step) {
  const load = OVERLAY_LOADERS[step];
  if (!load) return null;
  const mod = await load();
  return mod.default;
}
