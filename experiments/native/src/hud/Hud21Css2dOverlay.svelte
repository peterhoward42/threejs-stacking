<script>
  import { fmt, fmtVec } from './format.js';

  export let hud = {};
  export let stepApi;

  let labelMode = 'both';
  let spriteDepthTest = true;
  let showOccluder = true;
  let css2dPointerEvents = true;
  let animateMarkers = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.labelMode != null) {
    labelMode = hud.labelMode ?? labelMode;
    spriteDepthTest = hud.spriteDepthTest ?? spriteDepthTest;
    showOccluder = hud.showOccluder ?? showOccluder;
    css2dPointerEvents = hud.css2dPointerEvents ?? css2dPointerEvents;
    animateMarkers = hud.animateMarkers ?? animateMarkers;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setLabelMode(labelMode);
    stepApi.setSpriteDepthTest(spriteDepthTest);
    stepApi.setShowOccluder(showOccluder);
    stepApi.setCss2dPointerEvents(css2dPointerEvents);
    stepApi.setAnimateMarkers(animateMarkers);
  }

  $: overlay = hud.overlay ?? {};
</script>

<h2>CSS2D overlay</h2>
<p class="hint">
  Five markers carry paired labels: <code>CSS2DObject</code> HTML (left when both) and canvas
  <code>Sprite</code> billboards (right). Orbit behind the wall to compare depth behaviour.
</p>

<fieldset class="display-modes">
  <legend>Label system</legend>
  {#each hud.labelModes ?? [] as mode}
    <label class="primitive-option">
      <input type="radio" name="labelMode" value={mode.id} bind:group={labelMode} />
      <span>{mode.label}</span>
    </label>
  {/each}
</fieldset>

<label class="toggle">
  <input type="checkbox" bind:checked={spriteDepthTest} />
  <span>Sprite <code>depthTest</code> (off = always on top, like CSS2D)</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={showOccluder} />
  <span>Show occluder wall (blocks sprites with depth test)</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={css2dPointerEvents} />
  <span>CSS2D pointer events on Alpha (clickable HTML label)</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={animateMarkers} />
  <span>Animate marker bob + spin</span>
</label>

{#if hud.lastPing}
  <p class="ping">Alpha label clicked ({fmt(hud.lastPing.ageMs)} ms ago)</p>
{/if}

<section class="node">
  <h3>Overlay state</h3>
  <dl>
    <dt>CSS2D labels visible</dt>
    <dd>{overlay.css2dVisible ? 'yes' : 'no'}</dd>
    <dt>Sprite labels visible</dt>
    <dd>{overlay.spriteVisible ? 'yes' : 'no'}</dd>
    <dt>DOM label nodes</dt>
    <dd>{overlay.domLabelCount ?? 0}</dd>
    <dt>renderer stack</dt>
    <dd class="mono">{overlay.css2dRendererElement ?? '—'}</dd>
  </dl>
</section>

<section class="node">
  <h3>Markers</h3>
  <table class="marker-table">
    <thead>
      <tr>
        <th>id</th>
        <th>label</th>
        <th>position</th>
      </tr>
    </thead>
    <tbody>
      {#each hud.markers ?? [] as marker}
        <tr>
          <td>{marker.id}{marker.interactive ? ' ★' : ''}</td>
          <td>{marker.label}</td>
          <td class="mono">{fmtVec(marker.position)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="hint nested">★ Alpha has an interactive CSS2D label when pointer events are enabled.</p>
</section>

{#if hud.renderInfo}
  <section class="node">
    <h3>renderer.info (WebGL pass)</h3>
    <dl>
      <dt>draw calls</dt>
      <dd>{hud.renderInfo.calls}</dd>
      <dt>triangles</dt>
      <dd>{hud.renderInfo.triangles}</dd>
    </dl>
    <p class="hint nested">
      Sprites add draw calls; CSS2D labels are separate DOM nodes updated after
      <code>CSS2DRenderer.render</code>.
    </p>
  </section>
{/if}

{#if hud.notes}
  <section class="node">
    <h3>Trade-offs</h3>
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

  .mono {
    font-family: ui-monospace, monospace;
    font-size: 0.68rem;
    word-break: break-all;
  }

  .ping {
    margin: 0 0 0.75rem;
    padding: 0.35rem 0.5rem;
    border-radius: 0.3rem;
    background: rgba(245, 197, 66, 0.12);
    border: 1px solid rgba(245, 197, 66, 0.35);
    color: #f5d87a;
    font-size: 0.74rem;
  }

  .marker-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.74rem;
  }

  .marker-table th,
  .marker-table td {
    padding: 0.25rem 0.35rem;
    border-bottom: 1px solid #2a2a36;
    text-align: left;
  }

  .marker-table th {
    color: #9a9aad;
    font-weight: 500;
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
