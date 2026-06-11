<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let layoutId = 'quad';
  let pipCorner = 'tr';
  let scissorTest = true;
  let showHelpers = true;
  let animateScene = true;
  let clearBetweenRegions = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.layoutId != null) {
    layoutId = hud.layoutId ?? layoutId;
    pipCorner = hud.pipCorner ?? pipCorner;
    scissorTest = hud.scissorTest ?? scissorTest;
    showHelpers = hud.showHelpers ?? showHelpers;
    animateScene = hud.animateScene ?? animateScene;
    clearBetweenRegions = hud.clearBetweenRegions ?? clearBetweenRegions;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setLayout(layoutId);
    stepApi.setPipCorner(pipCorner);
    stepApi.setScissorTest(scissorTest);
    stepApi.setShowHelpers(showHelpers);
    stepApi.setAnimateScene(animateScene);
    stepApi.setClearBetweenRegions(clearBetweenRegions);
  }

  $: activeLayout = hud.layouts?.find((layout) => layout.id === layoutId);
</script>

<h2>Viewport and scissor</h2>
<p class="hint">
  One renderer draws multiple canvas regions each frame. <code>setViewport</code> chooses where;
  <code>setScissor</code> + <code>setScissorTest</code> clip fragments so passes do not bleed.
</p>

<fieldset class="primitive-list">
  <legend>Layout</legend>

  {#each hud.layouts ?? [] as layout}
    <label class="radio">
      <input type="radio" bind:group={layoutId} value={layout.id} />
      <span>
        <strong>{layout.label}</strong>
        <span class="radio-hint">{layout.hint}</span>
      </span>
    </label>
  {/each}

  {#if layoutId === 'pip'}
    <p class="nested">PiP corner</p>
    {#each hud.pipPresets ?? [] as preset}
      <label class="radio compact">
        <input type="radio" bind:group={pipCorner} value={preset.corner} />
        <span>{preset.label}</span>
      </label>
    {/each}
  {/if}
</fieldset>

<label class="toggle">
  <input type="checkbox" bind:checked={scissorTest} />
  <span><code>setScissorTest</code> — clip each region (off = bleed in quad / PiP)</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={clearBetweenRegions} />
  <span><code>renderer.clear()</code> before each region</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={showHelpers} />
  <span><code>CameraHelper</code> wireframes</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={animateScene} />
  <span>Animate scene props</span>
</label>

{#if activeLayout}
  <p class="hint nested">{activeLayout.hint}</p>
{/if}

{#if hud.viewports?.length}
  <section class="node">
    <h3>Active regions (last frame)</h3>
    <table class="viewport-table">
      <thead>
        <tr>
          <th>view</th>
          <th>camera</th>
          <th>x, y</th>
          <th>size</th>
          <th>aspect</th>
        </tr>
      </thead>
      <tbody>
        {#each hud.viewports as region}
          <tr>
            <td>{region.label}</td>
            <td>{region.cameraType}</td>
            <td>{region.x}, {region.y}</td>
            <td>{region.width}×{region.height}</td>
            <td>{fmt(region.aspect)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}

{#if hud.mainCamera}
  <section class="node">
    <h3>Main perspective camera</h3>
    <dl>
      <dt>position</dt>
      <dd>({fmt(hud.mainCamera.position.x)}, {fmt(hud.mainCamera.position.y)}, {fmt(hud.mainCamera.position.z)})</dd>
      <dt>fov</dt>
      <dd>{fmt(hud.mainCamera.fov)}°</dd>
      <dt>aspect</dt>
      <dd>{fmt(hud.mainCamera.aspect)}</dd>
    </dl>
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
    margin: 0.35rem 0 0.25rem;
    font-size: 0.72rem;
    color: #9a9aad;
  }

  .radio {
    display: flex;
    align-items: flex-start;
    gap: 0.45rem;
    margin-bottom: 0.45rem;
    cursor: pointer;
  }

  .radio.compact {
    margin-bottom: 0.3rem;
    font-size: 0.78rem;
  }

  .radio input {
    margin-top: 0.15rem;
  }

  .radio span {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .radio-hint {
    color: #9a9aad;
    font-size: 0.72rem;
    line-height: 1.35;
    font-weight: normal;
  }

  .viewport-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.72rem;
  }

  .viewport-table th,
  .viewport-table td {
    padding: 0.25rem 0.35rem;
    border-bottom: 1px solid #2a2a36;
    text-align: left;
    vertical-align: top;
  }

  .viewport-table th {
    color: #9a9aad;
    font-weight: 600;
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
