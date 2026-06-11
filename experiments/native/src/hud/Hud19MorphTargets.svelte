<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let driveModeId = 'manual';
  let activeClipId = 'squashStretch';
  let playing = true;
  let timeScale = 1;
  let morphNormals = true;
  let showBaseWireframe = true;
  let manualInfluences = [0, 0, 0, 0];
  let didSync = false;
  let lastDriveMode = 'manual';

  $: if (stepApi && !didSync && hud.driveModeId != null) {
    driveModeId = hud.driveModeId ?? driveModeId;
    activeClipId = hud.activeClipId ?? activeClipId;
    playing = hud.playing ?? playing;
    timeScale = hud.timeScale ?? timeScale;
    morphNormals = hud.morphNormals ?? morphNormals;
    showBaseWireframe = hud.showBaseWireframe ?? showBaseWireframe;
    manualInfluences = [...(hud.manualInfluences ?? manualInfluences)];
    didSync = true;
  }

  $: if (driveModeId !== lastDriveMode) {
    if (driveModeId === 'manual' && hud.influences?.length) {
      manualInfluences = [...hud.influences];
    }
    lastDriveMode = driveModeId;
  }

  $: if (stepApi) {
    stepApi.setDriveModeId(driveModeId);
    stepApi.setActiveClipId(activeClipId);
    stepApi.setPlaying(playing);
    stepApi.setTimeScale(timeScale);
    stepApi.setMorphNormals(morphNormals);
    stepApi.setShowBaseWireframe(showBaseWireframe);
  }

  $: manualMode = driveModeId === 'manual';
  $: morphTargets = hud.morphTargets ?? [];
  $: liveInfluences = hud.influences ?? manualInfluences;

  function setInfluence(index, value) {
    manualInfluences = manualInfluences.map((v, i) => (i === index ? value : v));
    stepApi?.setInfluence(index, value);
  }
</script>

<h2>Morph targets</h2>
<p class="hint">
  One subdivided sphere shares vertex topology across the base mesh and every morph shape.
  Blend targets with sliders or drive the same <code>morphTargetInfluences</code> array from
  keyframe clips.
</p>

<fieldset class="display-modes">
  <legend>Drive mode</legend>
  {#each hud.driveModes ?? [] as mode}
    <label class="primitive-option">
      <input type="radio" name="driveMode" value={mode.id} bind:group={driveModeId} />
      <span>{mode.label}</span>
    </label>
    {#if mode.hint}
      <p class="hint nested">{mode.hint}</p>
    {/if}
  {/each}
</fieldset>

{#if manualMode}
  <fieldset class="primitive-list">
    <legend>Manual influences</legend>
    {#each morphTargets as target, i}
      <label class="field">
        <span>
          {target.label} — {fmt(manualInfluences[i] ?? 0)}
          {#if liveInfluences[i] != null && !manualMode}
            (live {fmt(liveInfluences[i])})
          {/if}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={manualInfluences[i] ?? 0}
          on:input={(e) => setInfluence(i, Number(e.currentTarget.value))}
        />
      </label>
      {#if target.hint}
        <p class="hint nested">{target.hint}</p>
      {/if}
    {/each}
    <button type="button" class="btn" on:click={() => stepApi?.resetInfluences()}>
      Reset all to 0
    </button>
  </fieldset>
{:else}
  <fieldset class="primitive-list">
    <legend>AnimationClip</legend>
    <label class="field">
      <span>Clip</span>
      <select bind:value={activeClipId}>
        {#each hud.clips ?? [] as clip}
          <option value={clip.id}>{clip.label} ({fmt(clip.duration)} s)</option>
        {/each}
      </select>
    </label>

    <label class="toggle">
      <input type="checkbox" bind:checked={playing} />
      <span>Playing</span>
    </label>

    <label class="field">
      <span>timeScale — {fmt(timeScale)}</span>
      <input type="range" min="0.1" max="2.5" step="0.05" bind:value={timeScale} />
    </label>
  </fieldset>

  <section class="node">
    <h3>Live influences (from mixer)</h3>
    <dl>
      {#each morphTargets as target, i}
        <dt>{target.label}</dt>
        <dd>{fmt(liveInfluences[i] ?? 0)}</dd>
      {/each}
      {#if hud.clipState}
        <dt>clip time</dt>
        <dd>{fmt(hud.clipState.time)} / {fmt(hud.clipState.duration)} s</dd>
      {/if}
    </dl>
  </section>
{/if}

<label class="toggle">
  <input type="checkbox" bind:checked={morphNormals} />
  <span><code>material.morphNormals</code> (use normal morph targets)</span>
</label>

<label class="toggle">
  <input type="checkbox" bind:checked={showBaseWireframe} />
  <span>Show base wireframe overlay</span>
</label>

{#if hud.morphStats}
  <section class="node">
    <h3>Geometry anatomy</h3>
    <dl>
      <dt>vertices</dt>
      <dd>{hud.morphStats.vertexCount}</dd>
      <dt>morph targets</dt>
      <dd>{hud.morphStats.morphTargetCount}</dd>
      <dt>normal morphs</dt>
      <dd>{hud.morphStats.hasNormalMorphs ? 'yes' : 'no'}</dd>
      <dt>names</dt>
      <dd>{(hud.morphStats.morphNames ?? []).join(', ')}</dd>
    </dl>
  </section>
{/if}

{#if hud.morphDictionary}
  <section class="node">
    <h3>morphTargetDictionary</h3>
    <dl>
      {#each Object.entries(hud.morphDictionary) as [name, index]}
        <dt>{name}</dt>
        <dd>index {index}</dd>
      {/each}
    </dl>
  </section>
{/if}

{#if hud.notes}
  <section class="node">
    <h3>API map</h3>
    <ul class="notes-list">
      {#each hud.notes as note}
        <li>
          <span class="note-label">{note.label}</span>
          <span class="note-when">{note.when}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .nested {
    margin: -0.15rem 0 0.5rem 1.6rem;
    font-size: 0.72rem;
  }

  .btn {
    margin-top: 0.35rem;
    padding: 0.35rem 0.65rem;
    border: 1px solid #353545;
    border-radius: 0.25rem;
    background: #1a1a24;
    color: #c8c8d8;
    font-size: inherit;
    cursor: pointer;
  }

  .btn:hover {
    background: #22222e;
  }

  .notes-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .notes-list li {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid #2a2a36;
  }

  .notes-list li:last-child {
    border-bottom: none;
  }

  .note-label {
    font-weight: 600;
    font-size: 0.78rem;
  }

  .note-when {
    color: #9a9aad;
    font-size: 0.72rem;
    line-height: 1.35;
  }
</style>
