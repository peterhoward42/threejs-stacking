<script>
  import { onMount } from 'svelte';
  import { resolveStep, loadStep } from './step.js';

  let container;
  let step = resolveStep();
  let meta = { title: '…', description: '' };
  let hud = {};
  let loadError = '';
  let stepApi;

  // Step 1
  let autoUpdateMatrices = true;

  // Step 2
  let fov = 50;
  let near = 0.1;
  let far = 100;
  let orthoSize = 8;
  let showHelpers = true;

  // Step 3
  let selectedId = 'box';
  let displayMode = 'material';

  $: if (step === 1) stepApi?.setAutoUpdateMatrices(autoUpdateMatrices);
  $: if (step === 2) {
    stepApi?.setFov(fov);
    stepApi?.setNear(near);
    stepApi?.setFar(far);
    stepApi?.setOrthoSize(orthoSize);
    stepApi?.setShowHelpers(showHelpers);
  }
  $: if (step === 3) {
    stepApi?.setSelectedId(selectedId);
    stepApi?.setDisplayMode(displayMode);
  }

  function fmt(n) {
    return n.toFixed(2);
  }

  function fmtVec(v) {
    return `(${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})`;
  }

  function fmtQuat(q) {
    return `(${fmt(q.x)}, ${fmt(q.y)}, ${fmt(q.z)}, ${fmt(q.w)})`;
  }

  onMount(() => {
    let active;

    (async () => {
      try {
        const mod = await loadStep(step);
        meta = mod.meta;
        active = mod.mount(container, {
          onHudUpdate: (data) => {
            hud = data;
          },
        });
        stepApi = active;

        if (step === 1 && hud.autoUpdateMatrices != null) {
          autoUpdateMatrices = hud.autoUpdateMatrices;
        }
        if (step === 2) {
          fov = hud.fov ?? fov;
          near = hud.near ?? near;
          far = hud.far ?? far;
          orthoSize = hud.orthoSize ?? orthoSize;
          showHelpers = hud.showHelpers ?? showHelpers;
        }
        if (step === 3) {
          selectedId = hud.selectedId ?? selectedId;
          displayMode = hud.displayMode ?? displayMode;
        }
      } catch (err) {
        loadError = err instanceof Error ? err.message : String(err);
      }
    })();

    return () => {
      active?.dispose();
      stepApi = undefined;
    };
  });
</script>

<main>
  <header>
    <h1>native — step {step}: {meta.title}</h1>
    {#if meta.description}
      <p class="lede">{meta.description}</p>
    {/if}
  </header>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else}
    <div class="workspace">
      <div class="canvas-wrap">
        <div bind:this={container} class="canvas-host" aria-label="Three.js canvas"></div>
        {#if step === 2}
          <div class="viewport-labels" aria-hidden="true">
            <span>PerspectiveCamera</span>
            <span>OrthographicCamera</span>
          </div>
        {/if}
      </div>

      <aside class="hud">
        {#if step === 1}
          <h2>Transform readout</h2>
          <p class="hint">
            Each child inherits motion from its ancestors. Compare <strong>local</strong> (parent space) with
            <strong>world</strong> (scene space).
          </p>

          <label class="toggle">
            <input type="checkbox" bind:checked={autoUpdateMatrices} />
            <span>scene.matrixWorldAutoUpdate</span>
          </label>
          {#if !autoUpdateMatrices}
            <p class="warn">
              World values freeze until you call <code>updateMatrixWorld</code>.
              <button type="button" onclick={() => stepApi?.forceMatrixWorldUpdate()}>Update now</button>
            </p>
          {/if}

          {#each hud.nodes ?? [] as node}
            <section class="node">
              <h3>{node.name}</h3>
              <dl>
                <dt>local position</dt>
                <dd>{fmtVec(node.local.position)}</dd>
                <dt>local rotation (deg)</dt>
                <dd>{fmtVec(node.local.rotation)}</dd>
                <dt>local scale</dt>
                <dd>{fmtVec(node.local.scale)}</dd>
                <dt>local quaternion</dt>
                <dd class="mono">{fmtQuat(node.local.quaternion)}</dd>
                <dt>world position</dt>
                <dd>{fmtVec(node.world.position)}</dd>
                <dt>world quaternion</dt>
                <dd class="mono">{fmtQuat(node.world.quaternion)}</dd>
                {#if node.matrixWorldStale}
                  <dt class="stale">matrixWorld</dt>
                  <dd class="stale">needs update</dd>
                {/if}
              </dl>
            </section>
          {/each}
        {:else if step === 2}
          <h2>Projection controls</h2>
          <p class="hint">
            Left and right halves render the <strong>same scene</strong> with different cameras. Perspective
            exaggerates depth; orthographic keeps parallel lines parallel.
          </p>

          <label class="field">
            <span>fov <em class="unit">(perspective)</em></span>
            <input type="range" min="20" max="100" step="1" bind:value={fov} />
            <output>{fov}°</output>
          </label>

          <label class="field">
            <span>ortho frustum height</span>
            <input type="range" min="3" max="16" step="0.1" bind:value={orthoSize} />
            <output>{fmt(orthoSize)}</output>
          </label>

          <label class="field">
            <span>near</span>
            <input type="range" min="0.05" max="2" step="0.05" bind:value={near} />
            <output>{fmt(near)}</output>
          </label>

          <label class="field">
            <span>far</span>
            <input type="range" min="20" max="200" step="1" bind:value={far} />
            <output>{fmt(far)}</output>
          </label>

          <label class="toggle">
            <input type="checkbox" bind:checked={showHelpers} />
            <span>CameraHelper wireframes</span>
          </label>

          {#if hud.perspective}
            <section class="node">
              <h3>PerspectiveCamera</h3>
              <dl>
                <dt>fov</dt>
                <dd>{fmt(hud.perspective.fov)}°</dd>
                <dt>aspect</dt>
                <dd>{fmt(hud.perspective.aspect)}</dd>
                <dt>near / far</dt>
                <dd>{fmt(hud.perspective.near)} / {fmt(hud.perspective.far)}</dd>
              </dl>
            </section>
          {/if}

          {#if hud.orthographic}
            <section class="node">
              <h3>OrthographicCamera</h3>
              <dl>
                <dt>left / right</dt>
                <dd>{fmt(hud.orthographic.left)} / {fmt(hud.orthographic.right)}</dd>
                <dt>top / bottom</dt>
                <dd>{fmt(hud.orthographic.top)} / {fmt(hud.orthographic.bottom)}</dd>
                <dt>near / far</dt>
                <dd>{fmt(hud.orthographic.near)} / {fmt(hud.orthographic.far)}</dd>
              </dl>
            </section>
          {/if}
        {:else if step === 3}
          <h2>BufferGeometry inspector</h2>
          <p class="hint">
            Click a mesh in the canvas or pick from the list. Vertex colours map local position; normal
            colours map each vertex normal to RGB.
          </p>

          <fieldset class="primitive-list">
            <legend>Primitives</legend>
            {#each hud.primitives ?? [] as primitive}
              <label class="primitive-option">
                <input
                  type="radio"
                  name="primitive"
                  value={primitive.id}
                  bind:group={selectedId}
                />
                <span>{primitive.label}</span>
              </label>
            {/each}
          </fieldset>

          <fieldset class="display-modes">
            <legend>Colour mode</legend>
            <label class="primitive-option">
              <input type="radio" name="displayMode" value="material" bind:group={displayMode} />
              <span>Material colour</span>
            </label>
            <label class="primitive-option">
              <input type="radio" name="displayMode" value="vertices" bind:group={displayMode} />
              <span>Vertex position → RGB</span>
            </label>
            <label class="primitive-option">
              <input type="radio" name="displayMode" value="normals" bind:group={displayMode} />
              <span>Normal → RGB</span>
            </label>
          </fieldset>

          {#if hud.selected?.geometry}
            {@const geo = hud.selected.geometry}
            <section class="node">
              <h3>{hud.selected.label}</h3>
              <dl>
                <dt>type</dt>
                <dd>{geo.type}</dd>
                <dt>drawRange</dt>
                <dd>{geo.drawRange.start} + {geo.drawRange.count || 'all'}</dd>
              </dl>
            </section>

            <section class="node">
              <h3>attributes</h3>
              {#each Object.entries(geo.attributes) as [name, attr]}
                <dl class="attr-row">
                  <dt>{name}</dt>
                  <dd>itemSize {attr.itemSize}, count {attr.count}{attr.normalized ? ', normalized' : ''}</dd>
                </dl>
              {/each}
            </section>

            <section class="node">
              <h3>index</h3>
              {#if geo.index}
                <dl>
                  <dt>count</dt>
                  <dd>{geo.index.count}</dd>
                  {#if geo.indexSamples}
                    <dt>first values</dt>
                    <dd class="mono">[{geo.indexSamples.join(', ')}]</dd>
                  {/if}
                </dl>
              {:else}
                <p class="hint inline">Non-indexed — vertices drawn in attribute order.</p>
              {/if}
            </section>

            {#if geo.samples.position}
              <section class="node">
                <h3>Sample position</h3>
                {#each geo.samples.position as v, i}
                  <dl class="attr-row">
                    <dt>[{i}]</dt>
                    <dd>{fmtVec(v)}</dd>
                  </dl>
                {/each}
              </section>
            {/if}

            {#if geo.samples.normal}
              <section class="node">
                <h3>Sample normal</h3>
                {#each geo.samples.normal as v, i}
                  <dl class="attr-row">
                    <dt>[{i}]</dt>
                    <dd>{fmtVec(v)}</dd>
                  </dl>
                {/each}
              </section>
            {/if}

            {#if geo.samples.uv}
              <section class="node">
                <h3>Sample uv</h3>
                {#each geo.samples.uv as v, i}
                  <dl class="attr-row">
                    <dt>[{i}]</dt>
                    <dd>({fmt(v.x)}, {fmt(v.y)})</dd>
                  </dl>
                {/each}
              </section>
            {/if}
          {/if}
        {/if}
      </aside>
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  header {
    flex-shrink: 0;
    padding: 0.45rem 1rem;
    border-bottom: 1px solid #2a2a36;
  }

  h1 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lede {
    margin: 0.15rem 0 0;
    font-size: 0.78rem;
    color: #9a9aad;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .error {
    margin: 1rem;
    color: #ff8a8a;
  }

  .workspace {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .canvas-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .canvas-host {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .viewport-labels {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    pointer-events: none;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .viewport-labels span {
    padding: 0.2rem 0.45rem;
    border-radius: 0.25rem;
    background: rgb(17 17 24 / 0.72);
    font-size: 0.72rem;
    font-weight: 600;
    color: #c8c8d8;
    width: fit-content;
    height: fit-content;
  }

  .viewport-labels span:last-child {
    justify-self: end;
  }

  .hud {
    flex-shrink: 0;
    width: min(22rem, 38vw);
    min-height: 0;
    overflow: auto;
    padding: 0.75rem 1rem;
    border-left: 1px solid #2a2a36;
    font-size: 0.78rem;
    background: #15151c;
  }

  .hud h2 {
    margin: 0 0 0.35rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .hint {
    margin: 0 0 0.75rem;
    color: #9a9aad;
    line-height: 1.4;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    cursor: pointer;
  }

  .field {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.15rem 0.5rem;
    margin-bottom: 0.65rem;
    align-items: center;
  }

  .field span {
    grid-column: 1 / -1;
    color: #b8b8c8;
  }

  .field input[type='range'] {
    grid-column: 1;
    width: 100%;
  }

  .field output {
    font-variant-numeric: tabular-nums;
    color: #9a9aad;
    min-width: 3.5rem;
    text-align: right;
  }

  .unit {
    font-style: normal;
    color: #7a7a8d;
    font-weight: 400;
  }

  .warn {
    margin: 0 0 0.75rem;
    padding: 0.5rem 0.6rem;
    border-radius: 0.35rem;
    background: #2a2218;
    color: #f0c878;
    line-height: 1.4;
  }

  .warn button {
    margin-top: 0.35rem;
    padding: 0.2rem 0.5rem;
    border: 1px solid #5a4a30;
    border-radius: 0.25rem;
    background: #1a1814;
    color: inherit;
    cursor: pointer;
  }

  .node {
    margin-bottom: 0.85rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid #252530;
  }

  .node h3 {
    margin: 0 0 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #c8c8d8;
  }

  dl {
    margin: 0;
    display: grid;
    grid-template-columns: 7.5rem 1fr;
    gap: 0.15rem 0.5rem;
  }

  dt {
    margin: 0;
    color: #7a7a8d;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .mono {
    font-size: 0.72rem;
    word-break: break-all;
  }

  .stale {
    color: #f0a060;
  }

  code {
    font-size: 0.85em;
  }

  fieldset {
    margin: 0 0 0.75rem;
    padding: 0.5rem 0.6rem 0.55rem;
    border: 1px solid #252530;
    border-radius: 0.35rem;
  }

  legend {
    padding: 0 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #9a9aad;
  }

  .primitive-option {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0.2rem 0;
    cursor: pointer;
    color: #c8c8d8;
  }

  .attr-row {
    margin-bottom: 0.15rem;
  }

  .hint.inline {
    margin: 0;
  }
</style>
