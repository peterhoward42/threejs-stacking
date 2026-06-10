const STEP_MODULES = {
  1: () => import('./steps/01-scene-graph.js'),
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
