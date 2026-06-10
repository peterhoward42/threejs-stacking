<script>
  import { fmtVec, fmtQuat } from './format.js';

  export let hud = {};
  export let stepApi;

  let autoUpdateMatrices = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.autoUpdateMatrices != null) {
    autoUpdateMatrices = hud.autoUpdateMatrices;
    didSync = true;
  }

  $: stepApi?.setAutoUpdateMatrices(autoUpdateMatrices);
</script>

<h2>Transform readout</h2>
<p class="hint">
  Each child inherits motion from its ancestors. Compare <strong>local</strong> (parent space) with
  <strong>world</strong> (scene space).
</p>

<label class="toggle">
  <input type="checkbox" bind:checked={autoUpdateMatrices} />
  <span>scene.matrixWorldAutoUpdate</span>
</label>
{#if !autoUpdateMatrices}
  <p class="warn">
    World values freeze until you call <code>updateMatrixWorld</code>.
    <button type="button" onclick={() => stepApi?.forceMatrixWorldUpdate()}>Update now</button>
  </p>
{/if}

{#each hud.nodes ?? [] as node}
  <section class="node">
    <h3>{node.name}</h3>
    <dl>
      <dt>local position</dt>
      <dd>{fmtVec(node.local.position)}</dd>
      <dt>local rotation (deg)</dt>
      <dd>{fmtVec(node.local.rotation)}</dd>
      <dt>local scale</dt>
      <dd>{fmtVec(node.local.scale)}</dd>
      <dt>local quaternion</dt>
      <dd class="mono">{fmtQuat(node.local.quaternion)}</dd>
      <dt>world position</dt>
      <dd>{fmtVec(node.world.position)}</dd>
      <dt>world quaternion</dt>
      <dd class="mono">{fmtQuat(node.world.quaternion)}</dd>
      {#if node.matrixWorldStale}
        <dt class="stale">matrixWorld</dt>
        <dd class="stale">needs update</dd>
      {/if}
    </dl>
  </section>
{/each}
