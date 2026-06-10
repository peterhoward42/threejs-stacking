<script>
  import { fmt, fmtVec } from './format.js';

  export let hud = {};
  export let stepApi;

  let lineVisibility = { line: true, lineSegments: true, lineLoop: true };
  let showVertexDots = true;
  let edgesShapeId = 'torusKnot';
  let edgesThreshold = 15;
  let showFilledMesh = true;
  let showEdgesOverlay = true;
  let showWireframeOverlay = false;
  let pointsSize = 0.045;
  let pointsSizeAttenuation = true;
  let showReferenceShell = true;
  let animatePoints = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.lineVisibility) {
    lineVisibility = { ...hud.lineVisibility };
    showVertexDots = hud.showVertexDots ?? showVertexDots;
    edgesShapeId = hud.edgesShapeId ?? edgesShapeId;
    edgesThreshold = hud.edgesThreshold ?? edgesThreshold;
    showFilledMesh = hud.showFilledMesh ?? showFilledMesh;
    showEdgesOverlay = hud.showEdgesOverlay ?? showEdgesOverlay;
    showWireframeOverlay = hud.showWireframeOverlay ?? showWireframeOverlay;
    pointsSize = hud.pointsSize ?? pointsSize;
    pointsSizeAttenuation = hud.pointsSizeAttenuation ?? pointsSizeAttenuation;
    showReferenceShell = hud.showReferenceShell ?? showReferenceShell;
    animatePoints = hud.animatePoints ?? animatePoints;
    didSync = true;
  }

  $: if (stepApi) {
    for (const [id, visible] of Object.entries(lineVisibility)) {
      stepApi.setLineVisible(id, visible);
    }
    stepApi.setShowVertexDots(showVertexDots);
    stepApi.setEdgesShapeId(edgesShapeId);
    stepApi.setEdgesThreshold(edgesThreshold);
    stepApi.setShowFilledMesh(showFilledMesh);
    stepApi.setShowEdgesOverlay(showEdgesOverlay);
    stepApi.setShowWireframeOverlay(showWireframeOverlay);
    stepApi.setPointsSize(pointsSize);
    stepApi.setPointsSizeAttenuation(pointsSizeAttenuation);
    stepApi.setShowReferenceShell(showReferenceShell);
    stepApi.setAnimatePoints(animatePoints);
  }
</script>

<h2>Lines, edges, and points</h2>
<p class="hint">
  Left: the same star vertices drawn as <code>Line</code>, <code>LineSegments</code>, and
  <code>LineLoop</code>. Centre: filled mesh plus <code>EdgesGeometry</code> creases. Right:
  <code>Points</code> with <code>PointsMaterial</code> size attenuation.
</p>

<fieldset class="primitive-list">
  <legend>Line draw modes</legend>
  {#each hud.lineModes ?? [] as mode}
    <label class="toggle">
      <input
        type="checkbox"
        checked={lineVisibility[mode.id]}
        on:change={(e) => {
          lineVisibility = { ...lineVisibility, [mode.id]: e.currentTarget.checked };
        }}
      />
      <span>{mode.label}</span>
    </label>
    {#if mode.hint}
      <p class="hint nested">{mode.hint}</p>
    {/if}
  {/each}
</fieldset>

<label class="toggle">
  <input type="checkbox" bind:checked={showVertexDots} />
  <span>Show vertex dots on star paths</span>
</label>

{#if hud.lineGeometry}
  <section class="node">
    <h3>Shared star geometry</h3>
    <dl>
      <dt>vertices</dt>
      <dd>{hud.lineGeometry.vertexCount}</dd>
      <dt>LineSegments pairs</dt>
      <dd>{hud.lineGeometry.segmentPairs} (floor(count / 2))</dd>
      {#if hud.activeLineModeId}
        <dt>active mode</dt>
        <dd>{hud.activeLineModeId}</dd>
      {/if}
    </dl>
    {#if hud.lineGeometry.samples?.length}
      <dl class="sample-list">
        <dt>first vertices</dt>
        {#each hud.lineGeometry.samples as v, i}
          <dd class="mono">[{i}] {fmtVec(v)}</dd>
        {/each}
      </dl>
    {/if}
  </section>
{/if}

<fieldset class="primitive-list">
  <legend>EdgesGeometry overlay</legend>
  <label class="field">
    <span>Source mesh</span>
    <select bind:value={edgesShapeId}>
      {#each hud.edgesShapes ?? [] as shape}
        <option value={shape.id}>{shape.label}</option>
      {/each}
    </select>
  </label>

  <label class="field">
    <span>Threshold angle — {fmt(edgesThreshold)}°</span>
    <input type="range" min="1" max="90" step="1" bind:value={edgesThreshold} />
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={showFilledMesh} />
    <span>Show filled mesh (triangles)</span>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={showEdgesOverlay} />
    <span>Show <code>EdgesGeometry</code> creases</span>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={showWireframeOverlay} />
    <span>Show <code>WireframeGeometry</code> (all triangle edges)</span>
  </label>
</fieldset>

{#if hud.edgesStats}
  <section class="node">
    <h3>Edge extraction</h3>
    <dl>
      <dt>edge segments</dt>
      <dd>{hud.edgesStats.edgeSegments}</dd>
      <dt>threshold</dt>
      <dd>{fmt(hud.edgesStats.thresholdAngle)}° between face normals</dd>
    </dl>
  </section>
{/if}

<fieldset class="primitive-list">
  <legend>Points cloud</legend>
  <label class="field">
    <span>Point size — {fmt(pointsSize)}</span>
    <input type="range" min="0.005" max="0.15" step="0.002" bind:value={pointsSize} />
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={pointsSizeAttenuation} />
    <span><code>sizeAttenuation</code> (screen size scales with distance)</span>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={showReferenceShell} />
    <span>Show faint reference sphere</span>
  </label>

  <label class="toggle">
    <input type="checkbox" bind:checked={animatePoints} />
    <span>Animate point cloud rotation</span>
  </label>
</fieldset>

{#if hud.pointsCount}
  <section class="node">
    <h3>Points</h3>
    <dl>
      <dt>count</dt>
      <dd>{hud.pointsCount}</dd>
      <dt>draw mode</dt>
      <dd>POINTS</dd>
    </dl>
  </section>
{/if}

{#if hud.drawModeNotes}
  <section class="node">
    <h3>When to use each</h3>
    <ul class="notes-list">
      {#each hud.drawModeNotes as note}
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

  .sample-list dd {
    font-size: 0.72rem;
    color: #9a9aad;
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
