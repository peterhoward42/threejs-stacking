<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let clippingEnabled = true;
  let useSecondPlane = false;
  let clipIntersection = false;
  let showClipHelpers = true;
  let clipPlaneAOffset = 1.8;
  let clipPlaneBOffset = 0.5;
  let fogMode = 'linear';
  let fogNear = 8;
  let fogFar = 38;
  let fogDensity = 0.028;
  let didSync = false;

  $: if (stepApi && !didSync && hud.fogMode != null) {
    clippingEnabled = hud.clippingEnabled ?? clippingEnabled;
    useSecondPlane = hud.useSecondPlane ?? useSecondPlane;
    clipIntersection = hud.clipIntersection ?? clipIntersection;
    showClipHelpers = hud.showClipHelpers ?? showClipHelpers;
    clipPlaneAOffset = hud.clipPlaneAOffset ?? clipPlaneAOffset;
    clipPlaneBOffset = hud.clipPlaneBOffset ?? clipPlaneBOffset;
    fogMode = hud.fogMode ?? fogMode;
    fogNear = hud.fogNear ?? fogNear;
    fogFar = hud.fogFar ?? fogFar;
    fogDensity = hud.fogDensity ?? fogDensity;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setClippingEnabled(clippingEnabled);
    stepApi.setUseSecondPlane(useSecondPlane);
    stepApi.setClipIntersection(clipIntersection);
    stepApi.setShowClipHelpers(showClipHelpers);
    stepApi.setClipPlaneAOffset(clipPlaneAOffset);
    stepApi.setClipPlaneBOffset(clipPlaneBOffset);
    stepApi.setFogMode(fogMode);
    stepApi.setFogNear(fogNear);
    stepApi.setFogFar(fogFar);
    stepApi.setFogDensity(fogDensity);
  }
</script>

<h2>Clipping and fog</h2>
<p class="hint">
  A stacked building supports horizontal sectional cuts; pillars recede into fog along −Z.
  Combine clipping planes with <code>Fog</code> or <code>FogExp2</code> for depth cueing without
  post-processing.
</p>

<fieldset class="primitive-list">
  <legend>Clipping planes</legend>

  <label class="toggle">
    <input type="checkbox" bind:checked={clippingEnabled} />
    <span>Enable clipping (<code>localClippingEnabled</code>)</span>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={showClipHelpers} />
    <span>Show <code>PlaneHelper</code> wireframes</span>
  </label>

  <label class="field">
    <span>Plane A — horizontal cut (constant)</span>
    <input type="range" min="0" max="4.5" step="0.05" bind:value={clipPlaneAOffset} />
    <span class="value">{fmt(clipPlaneAOffset)}</span>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={useSecondPlane} />
    <span>Plane B — vertical cut (second plane)</span>
  </label>

  {#if useSecondPlane}
    <label class="field">
      <span>Plane B constant</span>
      <input type="range" min="-4" max="4" step="0.05" bind:value={clipPlaneBOffset} />
      <span class="value">{fmt(clipPlaneBOffset)}</span>
    </label>

    <label class="toggle">
      <input type="checkbox" bind:checked={clipIntersection} />
      <span><code>clipIntersection</code> — keep wedge only (not union)</span>
    </label>
  {/if}

  <dl>
    <dt>renderer.clippingPlanes</dt>
    <dd>{hud.rendererClipPlaneCount ?? 0} active</dd>
    <dt>localClippingEnabled</dt>
    <dd>{hud.localClippingEnabled ? 'true' : 'false'}</dd>
  </dl>

  {#if hud.clipPlanes?.length}
    <ul class="plane-list">
      {#each hud.clipPlanes as plane}
        <li>
          <span class="plane-label">{plane.label}</span>
          <span class="plane-meta">constant {fmt(plane.constant)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</fieldset>

<fieldset class="primitive-list">
  <legend>Scene fog</legend>

  <label class="field">
    <span>Fog type</span>
    <select bind:value={fogMode}>
      {#each hud.fogModes ?? [] as mode}
        <option value={mode.id}>{mode.label}</option>
      {/each}
    </select>
  </label>

  {#if fogMode === 'linear'}
    <label class="field">
      <span>near</span>
      <input type="range" min="2" max="24" step="0.5" bind:value={fogNear} />
      <span class="value">{fmt(fogNear)}</span>
    </label>
    <label class="field">
      <span>far</span>
      <input type="range" min="12" max="60" step="0.5" bind:value={fogFar} />
      <span class="value">{fmt(fogFar)}</span>
    </label>
  {:else if fogMode === 'exp2'}
    <label class="field">
      <span>density</span>
      <input type="range" min="0.005" max="0.08" step="0.001" bind:value={fogDensity} />
      <span class="value">{fogDensity.toFixed(3)}</span>
    </label>
  {/if}

  {#if hud.fogReadout?.active}
    <dl>
      <dt>scene.fog</dt>
      <dd>
        {#if hud.fogReadout.type === 'linear'}
          Fog — near {fmt(hud.fogReadout.near)}, far {fmt(hud.fogReadout.far)}
        {:else}
          FogExp2 — density {hud.fogReadout.density.toFixed(3)}
        {/if}
      </dd>
      <dt>color</dt>
      <dd>{hud.fogReadout.color}</dd>
    </dl>
  {:else}
    <p class="hint nested">scene.fog is null — no atmospheric depth cueing.</p>
  {/if}
</fieldset>

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

  .value {
    font-size: 0.72rem;
    color: #9a9aad;
    min-width: 2.5rem;
    text-align: right;
  }

  .plane-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .plane-list li {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.3rem 0;
    border-bottom: 1px solid #2a2a36;
  }

  .plane-list li:last-child {
    border-bottom: none;
  }

  .plane-label {
    font-size: 0.76rem;
    font-weight: 600;
  }

  .plane-meta {
    color: #9a9aad;
    font-size: 0.72rem;
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
