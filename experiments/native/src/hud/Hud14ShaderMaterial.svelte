<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let presetId = 'procedural-uv';
  let colorHex = '#42c9f5';
  let timeSpeed = 1;
  let wireframe = false;
  let stripeScale = 10;
  let normalBlend = 0;
  let waveAmplitude = 0.22;
  let waveFrequency = 2.4;
  let didSync = false;

  $: if (stepApi && !didSync && hud.presetId != null) {
    presetId = hud.presetId ?? presetId;
    colorHex = hud.colorHex ?? colorHex;
    timeSpeed = hud.timeSpeed ?? timeSpeed;
    wireframe = hud.wireframe ?? wireframe;
    stripeScale = hud.stripeScale ?? stripeScale;
    normalBlend = hud.normalBlend ?? normalBlend;
    waveAmplitude = hud.waveAmplitude ?? waveAmplitude;
    waveFrequency = hud.waveFrequency ?? waveFrequency;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setPresetId(presetId);
    stepApi.setColor(colorHex);
    stepApi.setTimeSpeed(timeSpeed);
    stepApi.setWireframe(wireframe);
    stepApi.setStripeScale(stripeScale);
    stepApi.setNormalBlend(normalBlend);
    stepApi.setWaveAmplitude(waveAmplitude);
    stepApi.setWaveFrequency(waveFrequency);
  }
</script>

<h2>ShaderMaterial</h2>
<p class="hint">
  Custom vertex and fragment shaders with Three.js <code>#include</code> chunks. Uniforms
  (<code>time</code>, <code>uColor</code>, …) update from JS; attributes flow through
  <code>&lt;uv_vertex&gt;</code> and <code>&lt;normal_vertex&gt;</code> into varyings.
</p>

<fieldset class="primitive-list">
  <legend>Shader presets</legend>
  {#each hud.presets ?? [] as preset}
    <label class="primitive-option">
      <input type="radio" name="shaderPreset" value={preset.id} bind:group={presetId} />
      <span>{preset.label}</span>
    </label>
  {/each}
</fieldset>

{#if hud.selected?.hint}
  <p class="hint">{hud.selected.hint}</p>
{/if}

<label class="field color-field">
  <span>uColor uniform</span>
  <input type="color" bind:value={colorHex} />
</label>

<label class="field">
  <span>time speed — {fmt(timeSpeed)}×</span>
  <input type="range" min="0" max="3" step="0.05" bind:value={timeSpeed} />
</label>

{#if hud.stripeScaleEnabled}
  <label class="field">
    <span>uStripeScale — {stripeScale}</span>
    <input type="range" min="2" max="24" step="1" bind:value={stripeScale} />
  </label>
{/if}

{#if hud.normalBlendEnabled}
  <label class="field">
    <span>uBlend (normal ↔ procedural) — {fmt(normalBlend)}</span>
    <input type="range" min="0" max="1" step="0.01" bind:value={normalBlend} />
  </label>
{/if}

{#if hud.waveControlsEnabled}
  <label class="field">
    <span>uAmplitude — {fmt(waveAmplitude)}</span>
    <input type="range" min="0" max="0.6" step="0.01" bind:value={waveAmplitude} />
  </label>
  <label class="field">
    <span>uFrequency — {fmt(waveFrequency)}</span>
    <input type="range" min="0.5" max="6" step="0.1" bind:value={waveFrequency} />
  </label>
{/if}

<label class="toggle">
  <input type="checkbox" bind:checked={wireframe} />
  <span>wireframe</span>
</label>

{#if hud.selected}
  <section class="node">
    <h3>{hud.selected.label}</h3>
    <dl>
      <dt>geometry</dt>
      <dd>{hud.selected.geometry}</dd>
      <dt>vertices</dt>
      <dd>{hud.selected.vertexCount}</dd>
      <dt>elapsed</dt>
      <dd>{fmt(hud.selected.elapsed ?? 0)} s</dd>
    </dl>
  </section>

  <section class="node">
    <h3>Shader chunks</h3>
    <p class="hint inline mono">
      {#each hud.selected.chunks ?? [] as chunk, i}
        {i > 0 ? ' · ' : ''}&lt;{chunk}&gt;
      {/each}
    </p>
  </section>

  <section class="node">
    <h3>Uniforms</h3>
    {#each Object.entries(hud.selected.uniforms ?? {}) as [name, value]}
      <dl class="attr-row">
        <dt>{name}</dt>
        <dd class="mono">{value}</dd>
      </dl>
    {/each}
  </section>
{/if}

<style>
  .color-field input[type='color'] {
    width: 100%;
    height: 1.75rem;
    padding: 0;
    border: 1px solid #353545;
    border-radius: 0.25rem;
    background: transparent;
    cursor: pointer;
  }
</style>
