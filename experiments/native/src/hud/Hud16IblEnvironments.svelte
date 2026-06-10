<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let presetId = 'studio';
  let iblEnabled = true;
  let showBackground = true;
  let backgroundMode = 'pmrem';
  let environmentIntensity = 1;
  let envRotation = 0;
  let didSync = false;

  $: if (stepApi && !didSync && hud.activePresetId) {
    presetId = hud.activePresetId ?? presetId;
    iblEnabled = hud.iblEnabled ?? iblEnabled;
    showBackground = hud.showBackground ?? showBackground;
    backgroundMode = hud.backgroundMode ?? backgroundMode;
    environmentIntensity = hud.environmentIntensity ?? environmentIntensity;
    envRotation = hud.envRotation ?? envRotation;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setPreset(presetId);
    stepApi.setIblEnabled(iblEnabled);
    stepApi.setShowBackground(showBackground);
    stepApi.setBackgroundMode(backgroundMode);
    stepApi.setEnvironmentIntensity(environmentIntensity);
    stepApi.setEnvRotation(envRotation);
  }
</script>

<h2>Image-based lighting</h2>
<p class="hint">
  <code>PMREMGenerator</code> builds a pre-filtered mip chain for
  <code>scene.environment</code>. Load paths: procedural <code>CubeTexture</code>,
  <code>RGBELoader</code> (HDRI below), or the same PMREM flow with
  <code>EXRLoader</code>. Toggle IBL to compare metal/rough spheres with and without
  environment reflections.
</p>

{#if hud.envStatus === 'loading'}
  <p class="warn">Generating PMREM environment map…</p>
{:else if hud.envStatus === 'error'}
  <p class="warn">Failed to load environment — check the console.</p>
{/if}

<label class="field">
  <span>Environment source</span>
  <select bind:value={presetId} disabled={hud.envStatus === 'loading'}>
    {#each hud.presets ?? [] as preset}
      <option value={preset.id}>{preset.label}</option>
    {/each}
  </select>
</label>

{#if hud.presetHint}
  <p class="hint">{hud.presetHint}</p>
{/if}

<label class="toggle">
  <input type="checkbox" bind:checked={iblEnabled} />
  <span>IBL — assign <code>scene.environment</code></span>
</label>

<label class="field">
  <span>Environment intensity — {fmt(environmentIntensity)}</span>
  <input type="range" min="0" max="3" step="0.05" bind:value={environmentIntensity} />
</label>

<label class="field">
  <span>Environment rotation (Y) — {fmt(envRotation)}</span>
  <input type="range" min="0" max={Math.PI * 2} step="0.02" bind:value={envRotation} />
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={showBackground} />
  <span>Show <code>scene.background</code></span>
</label>

<label class="field">
  <span>Background mode</span>
  <select bind:value={backgroundMode} disabled={!showBackground}>
    {#each hud.backgroundModes ?? [] as mode}
      <option value={mode.id} disabled={mode.id === 'equirect' && hud.hasEquirectBackground === false}>
        {mode.label}{mode.id === 'equirect' && hud.hasEquirectBackground === false ? ' (HDRI only)' : ''}
      </option>
    {/each}
  </select>
</label>

<section class="node">
  <h3>Lighting balance</h3>
  <p class="hint">
    With IBL on, direct lights are dimmed so specular/diffuse from the environment map
    dominates. With IBL off, key + fill lights take over — notice how metals lose
    convincing reflections.
  </p>
  <dl>
    <dt>key light</dt>
    <dd>{fmt(hud.keyLightIntensity ?? 0)}</dd>
    <dt>fill light</dt>
    <dd>{fmt(hud.fillLightIntensity ?? 0)}</dd>
    <dt>scene.environment</dt>
    <dd>{hud.sceneEnvironment ?? '—'}</dd>
    <dt>scene.background</dt>
    <dd>{hud.sceneBackground ?? '—'}</dd>
    <dt>source type</dt>
    <dd>{hud.envSourceType ?? '—'}</dd>
    <dt>PMREM ready</dt>
    <dd>{hud.pmremReady ? 'yes' : 'no'}</dd>
  </dl>
</section>

{#if hud.sphereRows}
  <section class="node">
    <h3>Metal / rough grid</h3>
    <p class="hint">
      Eight roughness steps per row. Top row: dielectric (<code>metalness = 0</code>).
      Bottom row: metal (<code>metalness = 1</code>). Orbit to see environment
      reflections move on glossy surfaces.
    </p>
    <ul class="row-list">
      {#each hud.sphereRows as row}
        <li>
          <span class="row-name">{row.label}</span>
          <span class="row-meta">metalness {fmt(row.metalness)}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .row-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .row-list li {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.3rem 0;
    border-bottom: 1px solid #2a2a36;
  }

  .row-list li:last-child {
    border-bottom: none;
  }

  .row-name {
    font-weight: 600;
  }

  .row-meta {
    color: #9a9aad;
    font-variant-numeric: tabular-nums;
  }
</style>
