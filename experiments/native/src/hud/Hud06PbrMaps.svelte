<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let mapEnabled = {
    map: true,
    normalMap: true,
    roughnessMap: true,
    metalnessMap: true,
    aoMap: true,
    displacementMap: true,
  };
  let usePackedOrm = false;
  let uvRepeat = 2;
  let displacementScale = 0.06;
  let didSync = false;

  $: if (stepApi && !didSync && hud.enabled) {
    mapEnabled = { ...mapEnabled, ...hud.enabled };
    usePackedOrm = hud.usePackedOrm ?? usePackedOrm;
    uvRepeat = hud.uvRepeat ?? uvRepeat;
    displacementScale = hud.displacementScale ?? displacementScale;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setUsePackedOrm(usePackedOrm);
    stepApi.setUvRepeat(uvRepeat);
    stepApi.setDisplacementScale(displacementScale);
  }

  function onMapToggle(id, checked) {
    mapEnabled = { ...mapEnabled, [id]: checked };
    stepApi?.setMapEnabled(id, checked);
  }
</script>

<h2>PBR map slots</h2>
<p class="hint">
  Procedural textures on one <strong>MeshStandardMaterial</strong>. Toggle each slot;
  packed ORM reuses one RGB texture (R=AO, G=roughness, B=metalness). UV repeat
  shows how every map follows the mesh UV layout — <code>aoMap</code> reads
  <code>uv2</code>.
</p>

<label class="toggle">
  <input type="checkbox" bind:checked={usePackedOrm} />
  <span>packed ORM texture</span>
</label>

{#each hud.maps ?? [] as mapSlot}
  <label class="toggle">
    <input
      type="checkbox"
      checked={mapEnabled[mapSlot.id]}
      onchange={(e) => onMapToggle(mapSlot.id, e.currentTarget.checked)}
    />
    <span>{mapSlot.label}</span>
  </label>
  <section class="node map-detail">
    <p class="hint inline">{mapSlot.note}</p>
    <dl>
      <dt>assigned</dt>
      <dd>{mapSlot.assigned ? 'yes' : 'no'}</dd>
      <dt>UV set</dt>
      <dd>{mapSlot.uvChannel}</dd>
      {#if mapSlot.colorSpace}
        <dt>colorSpace</dt>
        <dd class="mono">{mapSlot.colorSpace}</dd>
      {/if}
      {#if mapSlot.ormChannel}
        <dt>ORM channel</dt>
        <dd>{mapSlot.ormChannel}</dd>
      {/if}
    </dl>
  </section>
{/each}

<h2>UV &amp; displacement</h2>

<label class="field">
  <span>texture repeat (UV scale)</span>
  <input type="range" min="0.5" max="6" step="0.25" bind:value={uvRepeat} />
  <output>{fmt(uvRepeat)}</output>
</label>

<label class="field">
  <span>displacementScale</span>
  <input type="range" min="0" max="0.2" step="0.005" bind:value={displacementScale} />
  <output>{displacementScale.toFixed(3)}</output>
</label>

{#if hud.uv2Present}
  <p class="hint inline">
    <code>uv2</code> is copied from <code>uv</code> for <code>aoMap</code> sampling.
  </p>
{/if}
