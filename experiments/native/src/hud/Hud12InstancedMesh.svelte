<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let renderMode = 'instanced';
  let placement = 'grid';
  let instanceCount = 5000;
  let animateInstances = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.renderMode != null) {
    renderMode = hud.renderMode ?? renderMode;
    placement = hud.placement ?? placement;
    instanceCount = hud.instanceCount ?? instanceCount;
    animateInstances = hud.animateInstances ?? animateInstances;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setRenderMode(renderMode);
    stepApi.setPlacement(placement);
    stepApi.setInstanceCount(instanceCount);
    stepApi.setAnimateInstances(animateInstances);
  }

  $: countLabel =
    renderMode === 'cloned' && hud.countCapped
      ? `${hud.effectiveCount ?? instanceCount} (capped from ${instanceCount})`
      : String(hud.effectiveCount ?? instanceCount);
</script>

<h2>InstancedMesh</h2>
<p class="hint">
  One <code>InstancedMesh</code> batches thousands of cones with <code>setMatrixAt</code> and
  <code>setColorAt</code>. Switch to naive clones to watch draw calls and frame time climb.
</p>

<fieldset class="display-modes">
  <legend>Render strategy</legend>
  {#each hud.renderModes ?? [] as mode}
    <label class="primitive-option">
      <input type="radio" name="renderMode" value={mode.id} bind:group={renderMode} />
      <span>{mode.label}</span>
    </label>
  {/each}
</fieldset>

<fieldset class="display-modes">
  <legend>Placement</legend>
  {#each hud.placementModes ?? [] as mode}
    <label class="primitive-option">
      <input type="radio" name="placement" value={mode.id} bind:group={placement} />
      <span>{mode.label}</span>
    </label>
  {/each}
</fieldset>

<label class="field">
  <span>instance count — {countLabel}</span>
  <input type="range" min="100" max="10000" step="100" bind:value={instanceCount} />
</label>

{#if renderMode === 'cloned' && instanceCount > (hud.clonedCountCap ?? 2500)}
  <p class="warn">
    Clone mode caps at {hud.clonedCountCap ?? 2500} meshes to keep the tab responsive. Instanced
    mode can use the full slider.
  </p>
{/if}

<label class="toggle">
  <input type="checkbox" bind:checked={animateInstances} />
  <span>animate instance transforms (matrix updates)</span>
</label>

<section class="node">
  <h3>Performance</h3>
  <dl>
    <dt>frame time</dt>
    <dd>{fmt(hud.frameMs ?? 0)} ms (~{fmt(hud.fps ?? 0)} fps)</dd>
    <dt>draw calls</dt>
    <dd>{hud.drawCalls ?? 0}</dd>
    <dt>triangles</dt>
    <dd>{hud.triangles ?? 0}</dd>
    <dt>mesh objects</dt>
    <dd>{hud.meshCount ?? 0}</dd>
    <dt>active kind</dt>
    <dd>{hud.activeKind ?? '—'}</dd>
    <dt>instanceColor</dt>
    <dd>{hud.instanceColorEnabled ? 'yes' : 'no'}</dd>
  </dl>
</section>

<section class="node">
  <h3>Contrast</h3>
  <p class="hint">
    Instanced: ~1 draw call for all cones (+ floor &amp; helpers). Cloned: one draw call per mesh
    — compare <strong>draw calls</strong> and <strong>frame time</strong> at the same count.
  </p>
</section>
