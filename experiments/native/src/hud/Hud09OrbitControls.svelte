<script>
  import { fmt, fmtVec } from './format.js';

  export let hud = {};
  export let stepApi;

  let enableDamping = true;
  let dampingFactor = 0.06;
  let minDistance = 2;
  let maxDistance = 18;
  let enablePan = true;
  let enableZoom = true;
  let enableRotate = true;
  let targetY = 0.55;
  let simulationPaused = false;
  let didSync = false;

  $: if (stepApi && !didSync && hud.delta != null) {
    enableDamping = hud.enableDamping ?? enableDamping;
    dampingFactor = hud.dampingFactor ?? dampingFactor;
    minDistance = hud.minDistance ?? minDistance;
    maxDistance = hud.maxDistance ?? maxDistance;
    enablePan = hud.enablePan ?? enablePan;
    enableZoom = hud.enableZoom ?? enableZoom;
    enableRotate = hud.enableRotate ?? enableRotate;
    targetY = hud.targetY ?? targetY;
    simulationPaused = hud.simulationPaused ?? simulationPaused;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setEnableDamping(enableDamping);
    stepApi.setDampingFactor(dampingFactor);
    stepApi.setMinDistance(minDistance);
    stepApi.setMaxDistance(maxDistance);
    stepApi.setEnablePan(enablePan);
    stepApi.setEnableZoom(enableZoom);
    stepApi.setEnableRotate(enableRotate);
    stepApi.setTargetY(targetY);
    stepApi.setSimulationPaused(simulationPaused);
  }

  $: deltaMs = (hud.delta ?? 0) * 1000;
  $: fps = hud.fps ?? 0;
</script>

<h2>Render loop</h2>
<p class="hint">
  Drag to orbit, scroll to zoom, right-drag to pan. Simulation uses <code>Clock.getDelta()</code>;
  controls run <code>update()</code> each frame for damping; <code>render()</code> is separate.
</p>

<section class="node">
  <h3>Frame timing</h3>
  <dl>
    <dt>delta</dt>
    <dd>{fmt(deltaMs)} ms</dd>
    <dt>fps (smoothed)</dt>
    <dd>{fmt(fps)}</dd>
    <dt>elapsed</dt>
    <dd>{fmt(hud.elapsed ?? 0)} s</dd>
  </dl>
  <label class="toggle">
    <input type="checkbox" bind:checked={simulationPaused} />
    <span>pause simulation (controls still run)</span>
  </label>
</section>

<h2>OrbitControls</h2>

<label class="toggle">
  <input type="checkbox" bind:checked={enableDamping} />
  <span>enableDamping</span>
</label>

<label class="field">
  <span>dampingFactor — {fmt(dampingFactor)}</span>
  <input type="range" min="0.01" max="0.2" step="0.005" bind:value={dampingFactor} />
</label>

<label class="field">
  <span>minDistance — {fmt(minDistance)}</span>
  <input type="range" min="1" max="8" step="0.25" bind:value={minDistance} />
</label>

<label class="field">
  <span>maxDistance — {fmt(maxDistance)}</span>
  <input type="range" min="6" max="30" step="0.5" bind:value={maxDistance} />
</label>

<label class="field">
  <span>target.y — {fmt(targetY)}</span>
  <input type="range" min="0" max="1.5" step="0.05" bind:value={targetY} />
</label>

<div class="toggle-row">
  <label class="toggle">
    <input type="checkbox" bind:checked={enableRotate} />
    <span>rotate</span>
  </label>
  <label class="toggle">
    <input type="checkbox" bind:checked={enableZoom} />
    <span>zoom</span>
  </label>
  <label class="toggle">
    <input type="checkbox" bind:checked={enablePan} />
    <span>pan</span>
  </label>
</div>

<button type="button" onclick={() => stepApi?.resetView()}>Reset camera &amp; target</button>

<section class="node">
  <h3>Camera readout</h3>
  <dl>
    <dt>position</dt>
    <dd>{fmtVec(hud.camera?.position ?? { x: 0, y: 0, z: 0 })}</dd>
    <dt>distance to target</dt>
    <dd>{fmt(hud.camera?.distance ?? 0)}</dd>
    <dt>target</dt>
    <dd>{fmtVec(hud.target ?? { x: 0, y: 0, z: 0 })}</dd>
  </dl>
</section>
