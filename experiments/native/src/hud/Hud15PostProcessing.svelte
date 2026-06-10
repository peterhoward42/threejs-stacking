<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let useComposer = true;
  let outline = true;
  let bloom = true;
  let grade = true;
  let fxaa = false;
  let bloomStrength = 0.75;
  let bloomRadius = 0.42;
  let bloomThreshold = 0.62;
  let outlineStrength = 2.8;
  let brightness = 0.04;
  let contrast = 0.18;
  let hue = 0.06;
  let saturation = 0.22;
  let didSync = false;

  $: if (stepApi && !didSync && hud.passState) {
    useComposer = hud.useComposer ?? useComposer;
    outline = hud.passState.outline ?? outline;
    bloom = hud.passState.bloom ?? bloom;
    grade = hud.passState.grade ?? grade;
    fxaa = hud.passState.fxaa ?? fxaa;
    bloomStrength = hud.bloomStrength ?? bloomStrength;
    bloomRadius = hud.bloomRadius ?? bloomRadius;
    bloomThreshold = hud.bloomThreshold ?? bloomThreshold;
    outlineStrength = hud.outlineStrength ?? outlineStrength;
    brightness = hud.brightness ?? brightness;
    contrast = hud.contrast ?? contrast;
    hue = hud.hue ?? hue;
    saturation = hud.saturation ?? saturation;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setUseComposer(useComposer);
    stepApi.setPassEnabled('outline', outline);
    stepApi.setPassEnabled('bloom', bloom);
    stepApi.setPassEnabled('grade', grade);
    stepApi.setPassEnabled('fxaa', fxaa);
    stepApi.setBloomStrength(bloomStrength);
    stepApi.setBloomRadius(bloomRadius);
    stepApi.setBloomThreshold(bloomThreshold);
    stepApi.setOutlineStrength(outlineStrength);
    stepApi.setBrightness(brightness);
    stepApi.setContrast(contrast);
    stepApi.setHue(hue);
    stepApi.setSaturation(saturation);
  }
</script>

<h2>EffectComposer</h2>
<p class="hint">
  Each pass reads the previous result from a <code>WebGLRenderTarget</code> and writes the next.
  Toggle optional passes to see bloom, outlines, grading, and FXAA stack on the base
  <code>RenderPass</code>.
</p>

<label class="toggle">
  <input type="checkbox" bind:checked={useComposer} />
  <span>use EffectComposer (off = direct <code>renderer.render</code>)</span>
</label>

<fieldset class="primitive-list">
  <legend>Optional passes</legend>
  <label class="toggle">
    <input type="checkbox" bind:checked={outline} disabled={!useComposer} />
    <span>OutlinePass</span>
  </label>
  <label class="toggle">
    <input type="checkbox" bind:checked={bloom} disabled={!useComposer} />
    <span>UnrealBloomPass</span>
  </label>
  <label class="toggle">
    <input type="checkbox" bind:checked={grade} disabled={!useComposer} />
    <span>Color grading (brightness/contrast + hue/saturation)</span>
  </label>
  <label class="toggle">
    <input type="checkbox" bind:checked={fxaa} disabled={!useComposer} />
    <span>FXAAPass</span>
  </label>
</fieldset>

{#if bloom && useComposer}
  <label class="field">
    <span>Bloom strength — {fmt(bloomStrength)}</span>
    <input type="range" min="0" max="2.5" step="0.05" bind:value={bloomStrength} />
  </label>
  <label class="field">
    <span>Bloom radius — {fmt(bloomRadius)}</span>
    <input type="range" min="0" max="1.2" step="0.02" bind:value={bloomRadius} />
  </label>
  <label class="field">
    <span>Bloom threshold — {fmt(bloomThreshold)}</span>
    <input type="range" min="0" max="1.5" step="0.02" bind:value={bloomThreshold} />
  </label>
{/if}

{#if outline && useComposer}
  <label class="field">
    <span>Outline edge strength — {fmt(outlineStrength)}</span>
    <input type="range" min="0" max="6" step="0.1" bind:value={outlineStrength} />
  </label>
{/if}

{#if grade && useComposer}
  <label class="field">
    <span>Brightness — {fmt(brightness)}</span>
    <input type="range" min="-0.5" max="0.5" step="0.01" bind:value={brightness} />
  </label>
  <label class="field">
    <span>Contrast — {fmt(contrast)}</span>
    <input type="range" min="-0.5" max="0.5" step="0.01" bind:value={contrast} />
  </label>
  <label class="field">
    <span>Hue — {fmt(hue)}</span>
    <input type="range" min="-1" max="1" step="0.01" bind:value={hue} />
  </label>
  <label class="field">
    <span>Saturation — {fmt(saturation)}</span>
    <input type="range" min="-1" max="1" step="0.01" bind:value={saturation} />
  </label>
{/if}

{#if hud.passes}
  <section class="node">
    <h3>Pass chain</h3>
    <p class="hint inline">{hud.renderMode}</p>
    <ul class="pass-list">
      {#each hud.passes as pass}
        <li class:inactive={!pass.active}>
          <span class="pass-name">{pass.label}</span>
          {#if pass.locked}
            <span class="pass-state">always on</span>
          {:else if pass.active}
            <span class="pass-state on">enabled</span>
          {:else}
            <span class="pass-state off">skipped</span>
          {/if}
          {#if pass.hint}
            <p class="hint">{pass.hint}</p>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}

{#if hud.bufferSize}
  <section class="node">
    <h3>Render targets</h3>
    <dl>
      <dt>logical size</dt>
      <dd>{hud.bufferSize.logical}</dd>
      <dt>physical size</dt>
      <dd>{hud.bufferSize.physical}</dd>
      <dt>outline targets</dt>
      <dd>{(hud.outlineTargets ?? []).join(', ')}</dd>
    </dl>
  </section>
{/if}

<style>
  .pass-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .pass-list li {
    padding: 0.35rem 0;
    border-bottom: 1px solid #2a2a36;
  }

  .pass-list li:last-child {
    border-bottom: none;
  }

  .pass-list li.inactive .pass-name {
    color: #6a6a7a;
  }

  .pass-name {
    font-weight: 600;
    font-size: 0.78rem;
  }

  .pass-state {
    margin-left: 0.35rem;
    font-size: 0.7rem;
    color: #9a9aad;
  }

  .pass-state.on {
    color: #7af5a8;
  }

  .pass-state.off {
    color: #c97a7a;
  }

  .pass-list .hint {
    margin: 0.2rem 0 0;
    font-size: 0.72rem;
  }
</style>
