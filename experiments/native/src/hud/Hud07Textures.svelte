<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let wrapSId = 'repeat';
  let wrapTId = 'repeat';
  let repeatX = 2.5;
  let repeatY = 2.5;
  let offsetX = 0.15;
  let offsetY = 0.1;
  let textureRotationDeg = 20;
  let minFilterId = 'linearMipLinear';
  let magFilterId = 'linear';
  let anisotropy = 4;
  let colorSpaceId = 'srgb';
  let didSync = false;

  $: if (stepApi && !didSync && hud.sources) {
    wrapSId = hud.wrapSId ?? wrapSId;
    wrapTId = hud.wrapTId ?? wrapTId;
    repeatX = hud.repeatX ?? repeatX;
    repeatY = hud.repeatY ?? repeatY;
    offsetX = hud.offsetX ?? offsetX;
    offsetY = hud.offsetY ?? offsetY;
    textureRotationDeg = hud.rotationDeg ?? textureRotationDeg;
    minFilterId = hud.minFilterId ?? minFilterId;
    magFilterId = hud.magFilterId ?? magFilterId;
    anisotropy = hud.anisotropy ?? anisotropy;
    colorSpaceId = hud.colorSpaceId ?? colorSpaceId;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setWrapS(wrapSId);
    stepApi.setWrapT(wrapTId);
    stepApi.setRepeatX(repeatX);
    stepApi.setRepeatY(repeatY);
    stepApi.setOffsetX(offsetX);
    stepApi.setOffsetY(offsetY);
    stepApi.setRotationDeg(textureRotationDeg);
    stepApi.setMinFilterId(minFilterId);
    stepApi.setMagFilterId(magFilterId);
    stepApi.setAnisotropy(anisotropy);
    stepApi.setColorSpaceId(colorSpaceId);
  }
</script>

<h2>Texture sampling</h2>
<p class="hint">
  The centre plane uses an image-backed texture; left is a static <code>CanvasTexture</code>,
  right is animated. Rows below compare wrap modes, filters, and color space. Controls
  apply to the hero plane only.
</p>

{#each hud.sources ?? [] as source}
  <section class="node">
    <h3>{source.label}</h3>
    <p class="hint inline">{source.note}</p>
  </section>
{/each}

<h2>Wrap &amp; UV transform</h2>

<label class="field">
  <span>wrapS</span>
  <select bind:value={wrapSId}>
    {#each hud.wrapModes ?? [] as mode}
      <option value={mode.id}>{mode.label}</option>
    {/each}
  </select>
</label>

<label class="field">
  <span>wrapT</span>
  <select bind:value={wrapTId}>
    {#each hud.wrapModes ?? [] as mode}
      <option value={mode.id}>{mode.label}</option>
    {/each}
  </select>
</label>

<label class="field">
  <span>repeat.x</span>
  <input type="range" min="0.5" max="6" step="0.25" bind:value={repeatX} />
  <output>{fmt(repeatX)}</output>
</label>

<label class="field">
  <span>repeat.y</span>
  <input type="range" min="0.5" max="6" step="0.25" bind:value={repeatY} />
  <output>{fmt(repeatY)}</output>
</label>

<label class="field">
  <span>offset.x</span>
  <input type="range" min="-0.5" max="0.5" step="0.01" bind:value={offsetX} />
  <output>{fmt(offsetX)}</output>
</label>

<label class="field">
  <span>offset.y</span>
  <input type="range" min="-0.5" max="0.5" step="0.01" bind:value={offsetY} />
  <output>{fmt(offsetY)}</output>
</label>

<label class="field">
  <span>rotation</span>
  <input type="range" min="-180" max="180" step="1" bind:value={textureRotationDeg} />
  <output>{textureRotationDeg}°</output>
</label>

<h2>Filters &amp; color space</h2>

<label class="field">
  <span>minFilter</span>
  <select bind:value={minFilterId}>
    {#each hud.minFilters ?? [] as filter}
      <option value={filter.id}>{filter.label}</option>
    {/each}
  </select>
</label>

<label class="field">
  <span>magFilter</span>
  <select bind:value={magFilterId}>
    {#each hud.magFilters ?? [] as filter}
      <option value={filter.id}>{filter.label}</option>
    {/each}
  </select>
</label>

<label class="field">
  <span>anisotropy</span>
  <input type="range" min="1" max={hud.maxAnisotropy ?? 16} step="1" bind:value={anisotropy} />
  <output>{anisotropy} / {hud.maxAnisotropy ?? '?'}</output>
</label>

<label class="field">
  <span>colorSpace</span>
  <select bind:value={colorSpaceId}>
    {#each hud.colorSpaces ?? [] as space}
      <option value={space.id}>{space.label}</option>
    {/each}
  </select>
</label>

{#if hud.hero}
  <section class="node">
    <h3>Hero texture</h3>
    <dl>
      <dt>wrapS / wrapT</dt>
      <dd>{hud.hero.wrapS} / {hud.hero.wrapT}</dd>
      <dt>repeat</dt>
      <dd>({fmt(hud.hero.repeat.x)}, {fmt(hud.hero.repeat.y)})</dd>
      <dt>offset</dt>
      <dd>({fmt(hud.hero.offset.x)}, {fmt(hud.hero.offset.y)})</dd>
      <dt>rotation</dt>
      <dd>{fmt(hud.hero.rotationDeg)}°</dd>
      <dt>min / mag</dt>
      <dd>{hud.hero.minFilter} / {hud.hero.magFilter}</dd>
      <dt>anisotropy</dt>
      <dd>{hud.hero.anisotropy}</dd>
      <dt>colorSpace</dt>
      <dd class="mono">{hud.hero.colorSpace}</dd>
      <dt>generateMipmaps</dt>
      <dd>{hud.hero.generateMipmaps ? 'yes' : 'no'}</dd>
    </dl>
  </section>
{/if}

{#if hud.animFrame != null}
  <p class="hint inline">Animated canvas frame: {hud.animFrame}</p>
{/if}
