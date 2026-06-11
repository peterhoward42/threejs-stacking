<script>
  export let hud = {};
  export let stepApi;

  let disposeOnSwap = true;
  let animateContent = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.disposeOnSwap != null) {
    disposeOnSwap = hud.disposeOnSwap ?? disposeOnSwap;
    animateContent = hud.animateContent ?? animateContent;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setDisposeOnSwap(disposeOnSwap);
    stepApi.setAnimateContent(animateContent);
  }

  $: memory = hud.memoryInfo ?? {};
  $: render = hud.renderInfo ?? {};
  $: leaked = hud.leakedTotals ?? { geometries: 0, materials: 0, textures: 0 };
  $: created = hud.lifetimeCreated ?? { geometries: 0, materials: 0, textures: 0 };
  $: disposed = hud.lifetimeDisposed ?? { geometries: 0, materials: 0, textures: 0 };
  $: pendingGeometries = created.geometries - disposed.geometries;
  $: pendingTextures = created.textures - disposed.textures;
</script>

<h2>Resource lifecycle</h2>
<p class="hint">
  Swap demo content in and out of the scene. With disposal off, geometries and textures accumulate in
  GPU memory — watch <code>renderer.info.memory</code> climb. This step's own
  <code>dispose()</code> matches the hot-reload cleanup in <code>App.svelte</code>.
</p>

<fieldset class="primitive-list">
  <legend>Scene swap</legend>

  <p class="hint nested">
    {#if hud.currentVariant}
      Active: <strong>{hud.currentVariant.label}</strong> — {hud.currentVariant.hint}
    {:else}
      Loading…
    {/if}
  </p>

  <button type="button" class="action" on:click={() => stepApi?.swapContent()}>
    Swap to next variant
  </button>

  <label class="toggle">
    <input type="checkbox" bind:checked={disposeOnSwap} />
    <span>Dispose on swap (<code>geometry</code> / <code>material</code> / <code>texture</code>)</span>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={animateContent} />
    <span>Rotate swappable content</span>
  </label>

  <dl>
    <dt>swap count</dt>
    <dd>{hud.swapCount ?? 0}</dd>
    <dt>clean swaps</dt>
    <dd>{hud.cleanSwapCount ?? 0}</dd>
    <dt>leak swaps</dt>
    <dd>{hud.leakSwapCount ?? 0}</dd>
    <dt>leaked groups held</dt>
    <dd>{hud.leakedGroupCount ?? 0}</dd>
  </dl>

  {#if (hud.leakedGroupCount ?? 0) > 0}
    <p class="warn">
      {hud.leakedGroupCount} detached group(s) still own GPU resources — {leaked.geometries} geometries,
      {leaked.textures} textures.
    </p>
    <button type="button" class="action secondary" on:click={() => stepApi?.disposeAllLeaked()}>
      Dispose all leaked groups
    </button>
  {/if}
</fieldset>

<section class="node">
  <h3>Current content resources</h3>
  <dl>
    <dt>geometries</dt>
    <dd>{hud.currentResources?.geometries ?? 0}</dd>
    <dt>materials</dt>
    <dd>{hud.currentResources?.materials ?? 0}</dd>
    <dt>textures</dt>
    <dd>{hud.currentResources?.textures ?? 0}</dd>
  </dl>
</section>

<section class="node">
  <h3>renderer.info.memory</h3>
  <dl>
    <dt>geometries</dt>
    <dd>{memory.geometries ?? 0}</dd>
    <dt>textures</dt>
    <dd>{memory.textures ?? 0}</dd>
    <dt>programs</dt>
    <dd>{memory.programs ?? 0}</dd>
  </dl>
  <p class="hint nested">
    Lifetime created {created.geometries} geometries / {created.textures} textures; disposed{' '}
    {disposed.geometries} / {disposed.textures}. Pending (not disposed): {pendingGeometries} geometries,
    {pendingTextures} textures.
  </p>
</section>

{#if hud.renderInfo}
  <section class="node">
    <h3>renderer.info.render (last frame)</h3>
    <dl>
      <dt>draw calls</dt>
      <dd>{render.calls}</dd>
      <dt>triangles</dt>
      <dd>{render.triangles}</dd>
      <dt>lines</dt>
      <dd>{render.lines}</dd>
      <dt>points</dt>
      <dd>{render.points}</dd>
    </dl>
  </section>
{/if}

{#if hud.sceneVariants?.length}
  <section class="node">
    <h3>Variants</h3>
    <ul class="variant-list">
      {#each hud.sceneVariants as variant}
        <li class:active={hud.currentVariant?.id === variant.id}>
          <span class="variant-label">{variant.label}</span>
          <span class="variant-hint">{variant.hint}</span>
        </li>
      {/each}
    </ul>
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

  .action {
    display: block;
    width: 100%;
    margin-bottom: 0.65rem;
    padding: 0.45rem 0.6rem;
    border: 1px solid #4a6a9a;
    border-radius: 0.35rem;
    background: #1e2a3a;
    color: #d8e8ff;
    font-size: inherit;
    cursor: pointer;
  }

  .action:hover {
    background: #253448;
  }

  .action.secondary {
    border-color: #6a5a3a;
    background: #2a2218;
    color: #f0c878;
  }

  .action.secondary:hover {
    background: #352c1e;
  }

  .variant-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .variant-list li {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid #2a2a36;
  }

  .variant-list li:last-child {
    border-bottom: none;
  }

  .variant-list li.active .variant-label {
    color: #7af5a8;
  }

  .variant-label {
    font-weight: 600;
    font-size: 0.78rem;
  }

  .variant-hint {
    color: #9a9aad;
    font-size: 0.72rem;
    line-height: 1.35;
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
