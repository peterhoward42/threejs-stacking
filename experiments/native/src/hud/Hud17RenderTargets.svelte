<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let monitor = true;
  let mirror = true;
  let minimap = true;
  let rtPresetId = '512';
  let showSecurityHelper = true;
  let showMonitorMesh = true;
  let showMirrorMesh = true;
  let minimapOpacity = 1;
  let didSync = false;

  $: if (stepApi && !didSync && hud.displayEnabled) {
    monitor = hud.displayEnabled.monitor ?? monitor;
    mirror = hud.displayEnabled.mirror ?? mirror;
    minimap = hud.displayEnabled.minimap ?? minimap;
    rtPresetId = hud.rtPresetId ?? rtPresetId;
    showSecurityHelper = hud.showSecurityHelper ?? showSecurityHelper;
    showMonitorMesh = hud.showMonitorMesh ?? showMonitorMesh;
    showMirrorMesh = hud.showMirrorMesh ?? showMirrorMesh;
    minimapOpacity = hud.minimapOpacity ?? minimapOpacity;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setDisplayEnabled('monitor', monitor);
    stepApi.setDisplayEnabled('mirror', mirror);
    stepApi.setDisplayEnabled('minimap', minimap);
    stepApi.setRtPreset(rtPresetId);
    stepApi.setShowSecurityHelper(showSecurityHelper);
    stepApi.setShowMonitorMesh(showMonitorMesh);
    stepApi.setShowMirrorMesh(showMirrorMesh);
    stepApi.setMinimapOpacity(minimapOpacity);
  }
</script>

<h2>WebGLRenderTarget</h2>
<p class="hint">
  Secondary cameras render the same world into offscreen
  <code>WebGLRenderTarget</code> textures. Results appear on in-scene quads (monitor,
  mirror) or a corner overlay composed with an orthographic fullscreen pass after the
  main render.
</p>

<fieldset class="primitive-list">
  <legend>Offscreen feeds</legend>
  {#each hud.displayModes ?? [] as mode}
    <label class="toggle">
      <input
        type="checkbox"
        checked={mode.id === 'monitor' ? monitor : mode.id === 'mirror' ? mirror : minimap}
        on:change={(e) => {
          const on = e.currentTarget.checked;
          if (mode.id === 'monitor') monitor = on;
          else if (mode.id === 'mirror') mirror = on;
          else minimap = on;
        }}
      />
      <span>{mode.label}</span>
    </label>
    {#if mode.hint}
      <p class="hint nested">{mode.hint}</p>
    {/if}
  {/each}
</fieldset>

<label class="field">
  <span>Render target resolution</span>
  <select bind:value={rtPresetId}>
    {#each hud.rtPresets ?? [] as preset}
      <option value={preset.id}>{preset.width}×{preset.height}px (base edge)</option>
    {/each}
  </select>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={showSecurityHelper} />
  <span>Show security <code>CameraHelper</code></span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={showMonitorMesh} />
  <span>Show monitor bezel mesh</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={showMirrorMesh} />
  <span>Show mirror frame mesh</span>
</label>

{#if minimap}
  <label class="field">
    <span>Mini-map overlay opacity — {fmt(minimapOpacity)}</span>
    <input type="range" min="0.2" max="1" step="0.02" bind:value={minimapOpacity} />
  </label>
{/if}

{#if hud.renderPasses}
  <section class="node">
    <h3>Frame order</h3>
    <ol class="pass-list">
      {#each hud.renderPasses as pass}
        <li>{pass}</li>
      {/each}
    </ol>
  </section>
{/if}

{#if hud.renderTargets}
  <section class="node">
    <h3>Render targets</h3>
    <ul class="rt-list">
      {#each hud.renderTargets as rt}
        <li>
          <span class="rt-name">{rt.label}</span>
          <span class="rt-meta">{rt.width}×{rt.height} — {rt.name}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

{#if hud.securityCamera}
  <section class="node">
    <h3>Cameras</h3>
    <dl>
      <dt>security position</dt>
      <dd>({fmt(hud.securityCamera.position.x)}, {fmt(hud.securityCamera.position.y)}, {fmt(hud.securityCamera.position.z)})</dd>
      <dt>security fov</dt>
      <dd>{fmt(hud.securityCamera.fov)}°</dd>
      <dt>main position</dt>
      <dd>({fmt(hud.mainCamera.position.x)}, {fmt(hud.mainCamera.position.y)}, {fmt(hud.mainCamera.position.z)})</dd>
      <dt>mirror position</dt>
      <dd>({fmt(hud.mirrorCamera.position.x)}, {fmt(hud.mirrorCamera.position.y)}, {fmt(hud.mirrorCamera.position.z)})</dd>
    </dl>
  </section>
{/if}

<style>
  .nested {
    margin: -0.15rem 0 0.5rem 1.6rem;
    font-size: 0.72rem;
  }

  .pass-list {
    margin: 0.35rem 0 0;
    padding-left: 1.1rem;
    font-size: 0.78rem;
    color: #c8c8d8;
  }

  .pass-list li {
    padding: 0.15rem 0;
  }

  .rt-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .rt-list li {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid #2a2a36;
  }

  .rt-list li:last-child {
    border-bottom: none;
  }

  .rt-name {
    font-weight: 600;
    font-size: 0.78rem;
  }

  .rt-meta {
    color: #9a9aad;
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
  }
</style>
