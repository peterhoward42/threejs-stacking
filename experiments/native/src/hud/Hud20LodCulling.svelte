<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let showBoundingBoxes = true;
  let frustumCulled = true;
  let animateLodRow = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.showBoundingBoxes != null) {
    showBoundingBoxes = hud.showBoundingBoxes ?? showBoundingBoxes;
    frustumCulled = hud.frustumCulled ?? frustumCulled;
    animateLodRow = hud.animateLodRow ?? animateLodRow;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setShowBoundingBoxes(showBoundingBoxes);
    stepApi.setFrustumCulled(frustumCulled);
    stepApi.setAnimateLodRow(animateLodRow);
  }

  $: lane = hud.cullLane ?? {};
  $: culledEstimate = lane.meshCount - (lane.inFrustum ?? 0);
</script>

<h2>LOD and culling</h2>
<p class="hint">
  Six <code>LOD</code> objects along the row swap icosahedron / box proxies as the camera moves.
  The lane behind them stress-tests default <code>frustumCulled</code> behaviour.
</p>

<label class="toggle">
  <input type="checkbox" bind:checked={showBoundingBoxes} />
  <span>Show <code>Box3Helper</code> bounds per LOD</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={animateLodRow} />
  <span>Animate LOD row (rotation)</span>
</label>

<section class="node">
  <h3>LOD distance thresholds</h3>
  <dl>
    {#each hud.lodThresholds ?? [] as threshold}
      <dt>{threshold.label}</dt>
      <dd>≥ {fmt(threshold.distance)} m</dd>
    {/each}
  </dl>
</section>

<section class="node">
  <h3>Live LOD readout</h3>
  <table class="lod-table">
    <thead>
      <tr>
        <th>object</th>
        <th>distance</th>
        <th>level</th>
        <th>tris</th>
      </tr>
    </thead>
    <tbody>
      {#each hud.lodSummaries ?? [] as row}
        <tr class:dim={!row.visible}>
          <td>{row.label}</td>
          <td>{fmt(row.distance)} m</td>
          <td>{row.levelLabel}</td>
          <td>{row.triangles}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<fieldset class="primitive-list">
  <legend>Frustum culling lane</legend>
  <p class="hint nested">
    {lane.meshCount ?? 0} tetrahedrons span {fmt(lane.span ?? 0)} m behind the LOD row. Orbit so
    only part of the lane is in view — default culling skips off-screen meshes.
  </p>

  <label class="toggle">
    <input type="checkbox" bind:checked={frustumCulled} />
    <span><code>frustumCulled</code> on lane meshes (default on)</span>
  </label>

  <dl>
    <dt>in camera frustum</dt>
    <dd>{lane.inFrustum ?? 0} / {lane.meshCount ?? 0}</dd>
    <dt>likely culled (estimate)</dt>
    <dd>{culledEstimate}</dd>
  </dl>
</fieldset>

{#if hud.renderInfo}
  <section class="node">
    <h3>renderer.info (last frame)</h3>
    <dl>
      <dt>draw calls</dt>
      <dd>{hud.renderInfo.calls}</dd>
      <dt>triangles</dt>
      <dd>{hud.renderInfo.triangles}</dd>
      <dt>lines</dt>
      <dd>{hud.renderInfo.lines}</dd>
      <dt>points</dt>
      <dd>{hud.renderInfo.points}</dd>
    </dl>
    <p class="hint nested">
      Toggle <code>frustumCulled</code> off and orbit — draw calls stay high even when meshes are
      off-screen.
    </p>
  </section>
{/if}

{#if hud.notes}
  <section class="node">
    <h3>API map</h3>
    <ul class="notes-list">
      {#each hud.notes as note}
        <li>
          <span class="note-label">{note.label}</span>
          <span class="note-when">{note.when}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .nested {
    margin: 0.15rem 0 0.5rem 0;
    font-size: 0.72rem;
  }

  .lod-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.74rem;
  }

  .lod-table th,
  .lod-table td {
    padding: 0.25rem 0.35rem;
    border-bottom: 1px solid #2a2a36;
    text-align: left;
  }

  .lod-table th {
    color: #9a9aad;
    font-weight: 500;
  }

  .lod-table tr.dim td {
    color: #7a7a8d;
  }

  .notes-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .notes-list li {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid #2a2a36;
  }

  .notes-list li:last-child {
    border-bottom: none;
  }

  .note-label {
    font-weight: 600;
    font-size: 0.78rem;
  }

  .note-when {
    color: #9a9aad;
    font-size: 0.72rem;
    line-height: 1.35;
  }
</style>
