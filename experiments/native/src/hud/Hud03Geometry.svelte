<script>
  import { fmt, fmtVec } from './format.js';

  export let hud = {};
  export let stepApi;

  let selectedId = 'box';
  let displayMode = 'material';
  let didSync = false;

  $: if (stepApi && !didSync && hud.primitives) {
    selectedId = hud.selectedId ?? selectedId;
    displayMode = hud.displayMode ?? displayMode;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setSelectedId(selectedId);
    stepApi.setDisplayMode(displayMode);
  }
</script>

<h2>BufferGeometry inspector</h2>
<p class="hint">
  Click a mesh in the canvas or pick from the list. Vertex colours map local position; normal
  colours map each vertex normal to RGB.
</p>

<fieldset class="primitive-list">
  <legend>Primitives</legend>
  {#each hud.primitives ?? [] as primitive}
    <label class="primitive-option">
      <input type="radio" name="primitive" value={primitive.id} bind:group={selectedId} />
      <span>{primitive.label}</span>
    </label>
  {/each}
</fieldset>

<fieldset class="display-modes">
  <legend>Colour mode</legend>
  <label class="primitive-option">
    <input type="radio" name="displayMode" value="material" bind:group={displayMode} />
    <span>Material colour</span>
  </label>
  <label class="primitive-option">
    <input type="radio" name="displayMode" value="vertices" bind:group={displayMode} />
    <span>Vertex position → RGB</span>
  </label>
  <label class="primitive-option">
    <input type="radio" name="displayMode" value="normals" bind:group={displayMode} />
    <span>Normal → RGB</span>
  </label>
</fieldset>

{#if hud.selected?.geometry}
  {@const geo = hud.selected.geometry}
  <section class="node">
    <h3>{hud.selected.label}</h3>
    <dl>
      <dt>type</dt>
      <dd>{geo.type}</dd>
      <dt>drawRange</dt>
      <dd>{geo.drawRange.start} + {geo.drawRange.count || 'all'}</dd>
    </dl>
  </section>

  <section class="node">
    <h3>attributes</h3>
    {#each Object.entries(geo.attributes) as [name, attr]}
      <dl class="attr-row">
        <dt>{name}</dt>
        <dd>itemSize {attr.itemSize}, count {attr.count}{attr.normalized ? ', normalized' : ''}</dd>
      </dl>
    {/each}
  </section>

  <section class="node">
    <h3>index</h3>
    {#if geo.index}
      <dl>
        <dt>count</dt>
        <dd>{geo.index.count}</dd>
        {#if geo.indexSamples}
          <dt>first values</dt>
          <dd class="mono">[{geo.indexSamples.join(', ')}]</dd>
        {/if}
      </dl>
    {:else}
      <p class="hint inline">Non-indexed — vertices drawn in attribute order.</p>
    {/if}
  </section>

  {#if geo.samples.position}
    <section class="node">
      <h3>Sample position</h3>
      {#each geo.samples.position as v, i}
        <dl class="attr-row">
          <dt>[{i}]</dt>
          <dd>{fmtVec(v)}</dd>
        </dl>
      {/each}
    </section>
  {/if}

  {#if geo.samples.normal}
    <section class="node">
      <h3>Sample normal</h3>
      {#each geo.samples.normal as v, i}
        <dl class="attr-row">
          <dt>[{i}]</dt>
          <dd>{fmtVec(v)}</dd>
        </dl>
      {/each}
    </section>
  {/if}

  {#if geo.samples.uv}
    <section class="node">
      <h3>Sample uv</h3>
      {#each geo.samples.uv as v, i}
        <dl class="attr-row">
          <dt>[{i}]</dt>
          <dd>({fmt(v.x)}, {fmt(v.y)})</dd>
        </dl>
      {/each}
    </section>
  {/if}
{/if}
