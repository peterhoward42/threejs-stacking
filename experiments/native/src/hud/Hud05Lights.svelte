<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let activeLightId = 'directional';
  let shadowMapSize = 2048;
  let shadowBias = -0.0002;
  let shadowNormalBias = 0.02;
  let shadowFrustum = 7;
  let showLightHelpers = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.lights) {
    activeLightId = hud.activeLightId ?? activeLightId;
    shadowMapSize = hud.shadowMapSize ?? shadowMapSize;
    shadowBias = hud.shadowBias ?? shadowBias;
    shadowNormalBias = hud.shadowNormalBias ?? shadowNormalBias;
    shadowFrustum = hud.shadowFrustum ?? shadowFrustum;
    showLightHelpers = hud.showHelpers ?? showLightHelpers;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setActiveLightId(activeLightId);
    stepApi.setShadowMapSize(shadowMapSize);
    stepApi.setShadowBias(shadowBias);
    stepApi.setShadowNormalBias(shadowNormalBias);
    stepApi.setShadowFrustum(shadowFrustum);
    stepApi.setShowHelpers(showLightHelpers);
  }
</script>

<h2>Light switcher</h2>
<p class="hint">
  Only one light type is active at a time. Shadow-casting lights project onto the
  ground plane — tune map resolution, bias, and the directional shadow frustum.
</p>

<fieldset class="primitive-list">
  <legend>Active light</legend>
  {#each hud.lights ?? [] as light}
    <label class="primitive-option">
      <input type="radio" name="lightType" value={light.id} bind:group={activeLightId} />
      <span>{light.label}</span>
    </label>
  {/each}
</fieldset>

{#if hud.active}
  <section class="node">
    <h3>{hud.active.label}</h3>
    <p class="hint inline">{hud.active.note}</p>
    <dl>
      <dt>intensity</dt>
      <dd>{fmt(hud.active.intensity)}</dd>
      <dt>casts shadows</dt>
      <dd>{hud.active.shadows ? 'yes' : 'no'}</dd>
    </dl>
  </section>
{/if}

{#if hud.active?.shadows}
  <h2>Shadow tuning</h2>

  <label class="field">
    <span>shadow.mapSize</span>
    <input type="range" min="512" max="4096" step="512" bind:value={shadowMapSize} />
    <output>{shadowMapSize}</output>
  </label>

  <label class="field">
    <span>shadow.bias</span>
    <input type="range" min="-0.002" max="0.002" step="0.00005" bind:value={shadowBias} />
    <output>{shadowBias.toFixed(5)}</output>
  </label>

  <label class="field">
    <span>shadow.normalBias</span>
    <input type="range" min="0" max="0.08" step="0.002" bind:value={shadowNormalBias} />
    <output>{fmt(shadowNormalBias)}</output>
  </label>

  {#if activeLightId === 'directional'}
    <label class="field">
      <span>directional shadow frustum</span>
      <input type="range" min="3" max="12" step="0.25" bind:value={shadowFrustum} />
      <output>{fmt(shadowFrustum)}</output>
    </label>
  {/if}

  {#if hud.active.shadowMap}
    <section class="node">
      <h3>Shadow map</h3>
      <dl>
        <dt>mapSize</dt>
        <dd>{hud.active.shadowMap.width} × {hud.active.shadowMap.height}</dd>
        <dt>bias</dt>
        <dd>{hud.active.shadowMap.bias.toFixed(5)}</dd>
        <dt>normalBias</dt>
        <dd>{fmt(hud.active.shadowMap.normalBias)}</dd>
      </dl>
    </section>
  {/if}

  {#if hud.active.shadowCamera && activeLightId === 'directional'}
    <section class="node">
      <h3>Shadow camera</h3>
      <dl>
        <dt>near / far</dt>
        <dd>{fmt(hud.active.shadowCamera.near)} / {fmt(hud.active.shadowCamera.far)}</dd>
        <dt>left / right</dt>
        <dd>{fmt(hud.active.shadowCamera.left)} / {fmt(hud.active.shadowCamera.right)}</dd>
        <dt>top / bottom</dt>
        <dd>{fmt(hud.active.shadowCamera.top)} / {fmt(hud.active.shadowCamera.bottom)}</dd>
      </dl>
    </section>
  {/if}
{/if}

<label class="toggle">
  <input type="checkbox" bind:checked={showLightHelpers} />
  <span>light helpers</span>
</label>
