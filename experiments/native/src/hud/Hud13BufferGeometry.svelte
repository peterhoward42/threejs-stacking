<script>
  import { fmt, fmtVec } from './format.js';

  export let hud = {};
  export let stepApi;

  let presetId = 'parametric';
  let segments = 32;
  let indexed = true;
  let computeNormals = true;
  let wireframe = false;
  let displayMode = 'material';
  let animateSurface = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.presetId != null) {
    presetId = hud.presetId ?? presetId;
    segments = hud.segments ?? segments;
    indexed = hud.indexed ?? indexed;
    computeNormals = hud.computeNormals ?? computeNormals;
    wireframe = hud.wireframe ?? wireframe;
    displayMode = hud.displayMode ?? displayMode;
    animateSurface = hud.animateSurface ?? animateSurface;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setPresetId(presetId);
    stepApi.setSegments(segments);
    stepApi.setIndexed(indexed);
    stepApi.setComputeNormals(computeNormals);
    stepApi.setWireframe(wireframe);
    stepApi.setDisplayMode(displayMode);
    stepApi.setAnimateSurface(animateSurface);
  }
</script>

<h2>Custom BufferGeometry</h2>
<p class="hint">
  Each preset allocates <code>Float32Array</code> position and UV buffers, optionally an index
  buffer, then calls <code>computeVertexNormals</code>. Toggle indexed vs expanded triangles to
  see vertex sharing and flat shading.
</p>

<fieldset class="primitive-list">
  <legend>Builders</legend>
  {#each hud.presets ?? [] as preset}
    <label class="primitive-option">
      <input type="radio" name="preset" value={preset.id} bind:group={presetId} />
      <span>{preset.label}</span>
    </label>
  {/each}
</fieldset>

{#if hud.selected?.hint}
  <p class="hint">{hud.selected.hint}</p>
{/if}

{#if hud.segmentsEnabled}
  <label class="field">
    <span>grid segments — {hud.segmentsLabel ?? segments}</span>
    <input type="range" min="8" max="80" step="2" bind:value={segments} />
  </label>
{/if}

<label class="toggle">
  <input type="checkbox" bind:checked={indexed} />
  <span>indexed drawing (<code>setIndex</code>)</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={computeNormals} />
  <span><code>computeVertexNormals()</code></span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={wireframe} />
  <span>wireframe</span>
</label>

{#if presetId === 'parametric'}
  <label class="toggle">
    <input type="checkbox" bind:checked={animateSurface} />
    <span>animate parametric surface (live position updates)</span>
  </label>
{/if}

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
  {@const build = hud.selected.build ?? {}}
  <section class="node">
    <h3>{hud.selected.label}</h3>
    <dl>
      <dt>vertices</dt>
      <dd>{geo.attributes.position?.count ?? 0}</dd>
      <dt>triangles</dt>
      <dd>{fmt(geo.triangleCount ?? 0)}</dd>
      <dt>indexed</dt>
      <dd>{build.indexed ? 'yes' : 'no (expanded)'}</dd>
      <dt>normals</dt>
      <dd>{build.computeNormals ? 'computed' : 'none'}</dd>
      <dt>position bytes</dt>
      <dd>{build.positionBytes ?? 0}</dd>
      <dt>index bytes</dt>
      <dd>{build.indexBytes ?? 0}</dd>
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
      <p class="hint inline">Non-indexed — one unique vertex per triangle corner.</p>
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
{/if}
