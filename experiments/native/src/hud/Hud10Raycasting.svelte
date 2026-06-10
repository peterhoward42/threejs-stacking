<script>
  import { fmt, fmtVec } from './format.js';

  export let hud = {};
  export let stepApi;

  let pickMode = 'both';
  let logFaceOnClick = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.pickMode != null) {
    pickMode = hud.pickMode ?? pickMode;
    logFaceOnClick = hud.logFaceOnClick ?? logFaceOnClick;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setPickMode(pickMode);
    stepApi.setLogFaceOnClick(logFaceOnClick);
  }
</script>

<h2>Raycasting</h2>
<p class="hint">
  Move the pointer to hover; click to select. NDC comes from canvas bounds →
  <code>raycaster.setFromCamera(pointer, camera)</code>. Instanced hits expose
  <code>instanceId</code> instead of a unique object per cube.
</p>

<fieldset class="display-modes">
  <legend>Pick targets</legend>
  <label class="primitive-option">
    <input type="radio" name="pickMode" value="meshes" bind:group={pickMode} />
    <span>Individual meshes (left)</span>
  </label>
  <label class="primitive-option">
    <input type="radio" name="pickMode" value="instanced" bind:group={pickMode} />
    <span>Instanced grid (right)</span>
  </label>
  <label class="primitive-option">
    <input type="radio" name="pickMode" value="both" bind:group={pickMode} />
    <span>Both — nearest hit wins</span>
  </label>
</fieldset>

<label class="toggle">
  <input type="checkbox" bind:checked={logFaceOnClick} />
  <span>log face / instance on click (console + HUD)</span>
</label>

<button type="button" onclick={() => stepApi?.clearSelection()}>Clear selection</button>

<section class="node">
  <h3>Pointer NDC</h3>
  <dl>
    <dt>x</dt>
    <dd>{fmt(hud.pointerNdc?.x ?? 0)}</dd>
    <dt>y</dt>
    <dd>{fmt(hud.pointerNdc?.y ?? 0)}</dd>
  </dl>
</section>

<section class="node">
  <h3>Hover</h3>
  {#if hud.hover}
    <dl>
      <dt>kind</dt>
      <dd>{hud.hover.kind}</dd>
      <dt>label</dt>
      <dd>{hud.hover.label}</dd>
      <dt>faceIndex</dt>
      <dd>{hud.hover.faceIndex ?? '—'}</dd>
      <dt>instanceId</dt>
      <dd>{hud.hover.instanceId ?? '—'}</dd>
      <dt>distance</dt>
      <dd>{fmt(hud.hover.distance ?? 0)}</dd>
      <dt>point</dt>
      <dd>{fmtVec(hud.hover.point ?? { x: 0, y: 0, z: 0 })}</dd>
    </dl>
  {:else}
    <p class="hint">No hit under pointer.</p>
  {/if}
</section>

<section class="node">
  <h3>Selected (click)</h3>
  {#if hud.selected}
    <dl>
      <dt>kind</dt>
      <dd>{hud.selected.kind}</dd>
      <dt>label</dt>
      <dd>{hud.selected.label}</dd>
      <dt>faceIndex</dt>
      <dd>{hud.selected.faceIndex ?? '—'}</dd>
      <dt>instanceId</dt>
      <dd>{hud.selected.instanceId ?? '—'}</dd>
      <dt>uv</dt>
      <dd>
        {#if hud.selected.uv}
          ({fmt(hud.selected.uv.x)}, {fmt(hud.selected.uv.y)})
        {:else}
          —
        {/if}
      </dd>
    </dl>
  {:else}
    <p class="hint">Click a mesh or instance to select.</p>
  {/if}
</section>

{#if hud.meshOptions?.length}
  <section class="node">
    <h3>Select mesh by name</h3>
    <div class="toggle-row">
      {#each hud.meshOptions as mesh}
        <button type="button" class="chip" onclick={() => stepApi?.selectMeshById(mesh.id)}>
          {mesh.label}
        </button>
      {/each}
    </div>
  </section>
{/if}

{#if hud.clickLog?.length}
  <section class="node">
    <h3>Recent clicks</h3>
    {#each hud.clickLog as entry, i}
      <dl class="attr-row">
        <dt>{i + 1}</dt>
        <dd>
          {entry.label} · face {entry.faceIndex ?? '—'}
          {#if entry.instanceId != null}
            · instance {entry.instanceId}
          {/if}
        </dd>
      </dl>
    {/each}
  </section>
{/if}

<style>
  .chip {
    padding: 0.2rem 0.45rem;
    border-radius: 0.25rem;
    border: 1px solid #353545;
    background: #1a1a24;
    color: #c8c8d8;
    font-size: inherit;
    cursor: pointer;
  }

  .chip:hover {
    border-color: #5a5a72;
    background: #222230;
  }
</style>
