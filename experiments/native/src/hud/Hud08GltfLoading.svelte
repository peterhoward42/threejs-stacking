<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let selectedMeshUuid = '';
  let materialPresetId = 'original';
  let activeClipName = '';
  let animationPlaying = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.meshes?.length) {
    selectedMeshUuid = hud.selectedMeshUuid ?? selectedMeshUuid;
    materialPresetId = hud.materialPresetId ?? materialPresetId;
    activeClipName = hud.activeClipName ?? activeClipName;
    animationPlaying = hud.animationPlaying ?? animationPlaying;
    didSync = true;
  }

  $: if (stepApi && hud.selectedMeshUuid && hud.selectedMeshUuid !== selectedMeshUuid) {
    selectedMeshUuid = hud.selectedMeshUuid;
  }

  $: if (stepApi) {
    stepApi.setSelectedMeshUuid(selectedMeshUuid);
    stepApi.setMaterialPresetId(materialPresetId);
    if (hud.hasAnimations) {
      stepApi.setActiveClipName(activeClipName);
      stepApi.setAnimationPlaying(animationPlaying);
    }
  }

  $: progressPct = Math.round((hud.loadProgress ?? 0) * 100);
</script>

<h2>GLTFLoader</h2>
<p class="hint">
  Loads <code>{hud.assetPath ?? 'common/assets/…'}</code> via <code>GLTFLoader</code>.
  After load, <code>scene.traverse</code> collects meshes and materials. Pick a mesh
  and swap its material; embedded clips run through <code>AnimationMixer</code>.
</p>

<section class="node">
  <h3>Load status</h3>
  <dl>
    <dt>state</dt>
    <dd>{hud.loadState ?? '…'}</dd>
    <dt>progress</dt>
    <dd>{progressPct}%</dd>
    {#if hud.loadState === 'loading'}
      <dt>bar</dt>
      <dd>
        <progress max="100" value={progressPct}></progress>
      </dd>
    {/if}
    {#if hud.loadError}
      <dt>error</dt>
      <dd class="mono error-text">{hud.loadError}</dd>
    {/if}
  </dl>
  <div class="row-actions">
    <button type="button" onclick={() => stepApi?.reload()}>Reload model</button>
    <button type="button" class="danger" onclick={() => stepApi?.simulateError()}>
      Simulate error
    </button>
  </div>
</section>

{#if hud.meshes?.length}
  <h2>Scene graph</h2>
  <p class="hint inline">
    {hud.meshes.length} mesh{hud.meshes.length === 1 ? '' : 'es'},
    {hud.materials?.length ?? 0} unique material{hud.materials?.length === 1 ? '' : 's'}.
  </p>

  <label class="field">
    <span>selected mesh</span>
    <select bind:value={selectedMeshUuid}>
      {#each hud.meshes as mesh}
        <option value={mesh.uuid}>{mesh.name}</option>
      {/each}
    </select>
  </label>

  {#if hud.selectedMesh}
    <section class="node">
      <h3>{hud.selectedMesh.name}</h3>
      <dl>
        <dt>material</dt>
        <dd>{hud.selectedMesh.materialLabel}</dd>
      </dl>
    </section>
  {/if}

  <label class="field">
    <span>material preset</span>
    <select bind:value={materialPresetId}>
      {#each hud.materialPresets ?? [] as preset}
        <option value={preset.id}>{preset.label}</option>
      {/each}
    </select>
  </label>

  <h2>Meshes</h2>
  {#each hud.meshes as mesh}
    <section class="node">
      <h3>{mesh.name}</h3>
      <dl>
        <dt>vertices</dt>
        <dd>{mesh.vertexCount.toLocaleString()}</dd>
        <dt>material type</dt>
        <dd class="mono">{mesh.materialTypes.join(', ')}</dd>
        <dt>material name</dt>
        <dd>{mesh.materialNames.join(', ')}</dd>
      </dl>
    </section>
  {/each}

  <h2>Materials</h2>
  {#each hud.materials ?? [] as material}
    <section class="node">
      <h3>{material.type}</h3>
      <dl>
        <dt>name</dt>
        <dd>{material.name}</dd>
        {#if material.color}
          <dt>color</dt>
          <dd class="mono">#{material.color}</dd>
        {/if}
        {#if material.metalness != null}
          <dt>metalness</dt>
          <dd>{fmt(material.metalness)}</dd>
        {/if}
        {#if material.roughness != null}
          <dt>roughness</dt>
          <dd>{fmt(material.roughness)}</dd>
        {/if}
      </dl>
    </section>
  {/each}
{/if}

{#if hud.hasAnimations}
  <h2>Animations</h2>
  <label class="field">
    <span>clip</span>
    <select bind:value={activeClipName}>
      {#each hud.animations ?? [] as clip}
        <option value={clip.name}>{clip.name} ({fmt(clip.duration)}s)</option>
      {/each}
    </select>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={animationPlaying} />
    <span>playing</span>
  </label>

  <p class="hint inline">mixer time: {fmt(hud.animationTime ?? 0)}s</p>
{:else if hud.loadState === 'loaded'}
  <p class="hint inline">No embedded animation clips in this asset.</p>
{/if}

<style>
  progress {
    width: 100%;
    height: 0.45rem;
  }

  .row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.45rem;
  }

  button {
    font: inherit;
    font-size: 0.72rem;
    padding: 0.25rem 0.55rem;
    border-radius: 4px;
    border: 1px solid #3a3a48;
    background: #1e1e28;
    color: #d8d8e4;
    cursor: pointer;
  }

  button:hover {
    background: #262632;
  }

  button.danger {
    border-color: #6a3030;
    color: #ffb0b0;
  }

  .error-text {
    color: #ff9a9a;
    word-break: break-word;
  }
</style>
