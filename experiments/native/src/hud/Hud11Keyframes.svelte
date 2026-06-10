<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let loopModeId = 'repeat';
  let timeScale = 1;
  let playing = true;
  let crossfadeDuration = 0.6;
  let activeGltfClip = '';
  let didSync = false;

  $: if (stepApi && !didSync && hud.loopModeId != null) {
    loopModeId = hud.loopModeId ?? loopModeId;
    timeScale = hud.timeScale ?? timeScale;
    playing = hud.playing ?? playing;
    crossfadeDuration = hud.crossfadeDuration ?? crossfadeDuration;
    activeGltfClip = hud.gltf?.activeClipName ?? activeGltfClip;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setLoopModeId(loopModeId);
    stepApi.setTimeScale(timeScale);
    stepApi.setPlaying(playing);
    stepApi.setCrossfadeDuration(crossfadeDuration);
  }

  $: gltfClips = hud.gltf?.clips ?? [];
  $: if (gltfClips.length && !gltfClips.some((c) => c.name === activeGltfClip)) {
    activeGltfClip = hud.gltf?.activeClipName ?? gltfClips[0].name;
  }
  $: if (stepApi && activeGltfClip && activeGltfClip !== hud.gltf?.activeClipName) {
    stepApi.setActiveGltfClip(activeGltfClip);
  }
</script>

<h2>AnimationMixer</h2>
<p class="hint">
  Left: procedural <code>VectorKeyframeTrack</code> on position/rotation. Centre:
  <code>NumberKeyframeTrack</code> on <code>morphTargetInfluences</code>. Right:
  loaded glTF clips with <code>crossFadeTo</code>.
</p>

<label class="toggle">
  <input type="checkbox" bind:checked={playing} />
  <span>playing (all mixers)</span>
</label>

<label class="field">
  <span>timeScale — {fmt(timeScale)}</span>
  <input type="range" min="0.1" max="2.5" step="0.05" bind:value={timeScale} />
</label>

<fieldset class="display-modes">
  <legend>Loop mode (procedural + morph)</legend>
  {#each hud.loopModes ?? [] as mode}
    <label class="primitive-option">
      <input type="radio" name="loopMode" value={mode.id} bind:group={loopModeId} />
      <span>{mode.label}</span>
    </label>
  {/each}
</fieldset>

<section class="node">
  <h3>Procedural transform</h3>
  <dl>
    <dt>clip</dt>
    <dd>{hud.procedural?.clipName ?? '—'}</dd>
    <dt>duration</dt>
    <dd>{fmt(hud.procedural?.duration ?? 0)} s</dd>
    <dt>tracks</dt>
    <dd>{(hud.procedural?.tracks ?? []).join(', ') || '—'}</dd>
    <dt>mixer time</dt>
    <dd>{fmt(hud.procedural?.mixerTime ?? 0)} s</dd>
    <dt>position</dt>
    <dd>
      ({fmt(hud.procedural?.position?.x ?? 0)}, {fmt(hud.procedural?.position?.y ?? 0)},
      {fmt(hud.procedural?.position?.z ?? 0)})
    </dd>
  </dl>
  <button type="button" onclick={() => stepApi?.restartProcedural()}>Restart clip</button>
</section>

<section class="node">
  <h3>Morph influences</h3>
  <dl>
    <dt>clip</dt>
    <dd>{hud.morph?.clipName ?? '—'}</dd>
    <dt>targets</dt>
    <dd>{(hud.morph?.morphNames ?? []).join(', ') || '—'}</dd>
    <dt>influences</dt>
    <dd>
      {#if hud.morph?.influences?.length}
        {(hud.morph.influences.map((v) => fmt(v))).join(', ')}
      {:else}
        —
      {/if}
    </dd>
    <dt>tracks</dt>
    <dd>{(hud.morph?.tracks ?? []).join(', ') || '—'}</dd>
    <dt>mixer time</dt>
    <dd>{fmt(hud.morph?.mixerTime ?? 0)} s</dd>
  </dl>
  <button type="button" onclick={() => stepApi?.restartMorph()}>Restart clip</button>
</section>

<section class="node">
  <h3>Loaded glTF</h3>
  {#if hud.gltf?.loadState === 'loading'}
    <p class="hint">Loading brain-stem.glb…</p>
  {:else if hud.gltf?.loadState === 'error'}
    <p class="warn">{hud.gltf.loadError}</p>
  {:else if gltfClips.length}
    <label class="field">
      <span>active clip</span>
      <select bind:value={activeGltfClip}>
        {#each gltfClips as clip}
          <option value={clip.name}>{clip.name} ({fmt(clip.duration)} s)</option>
        {/each}
      </select>
    </label>

    <label class="field">
      <span>crossfade duration — {fmt(crossfadeDuration)} s</span>
      <input type="range" min="0" max="2" step="0.05" bind:value={crossfadeDuration} />
    </label>

    <dl>
      <dt>mixer time</dt>
      <dd>{fmt(hud.gltf?.mixerTime ?? 0)} s</dd>
      <dt>action weight</dt>
      <dd>{fmt(hud.gltf?.action?.weight ?? 0)}</dd>
    </dl>

    {#if hud.gltf?.allActions?.length > 1}
      <h4>Action weights</h4>
      {#each hud.gltf.allActions as entry}
        <dl class="attr-row">
          <dt>{entry.name}</dt>
          <dd>{fmt(entry.weight)}</dd>
        </dl>
      {/each}
    {/if}
  {:else}
    <p class="hint">Model loaded with no embedded clips.</p>
  {/if}
</section>
