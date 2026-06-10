<script>
  import { onMount } from 'svelte';
  import { resolveStep, loadStep } from './step.js';

  let container;
  let step = resolveStep();
  let meta = { title: '…', description: '' };
  let hud = { autoUpdateMatrices: true, nodes: [] };
  let loadError = '';
  let stepApi;

  let autoUpdateMatrices = true;

  $: stepApi?.setAutoUpdateMatrices(autoUpdateMatrices);

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
        autoUpdateMatrices = hud.autoUpdateMatrices;
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
    <h1>native — step {step}</h1>
    <p>{meta.title}</p>
    <p class="lede">{meta.description}</p>
  </header>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else}
    <div class="workspace">
      <div bind:this={container} class="canvas-host" aria-label="Three.js canvas"></div>

      <aside class="hud">
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

        {#each hud.nodes as node}
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
  }

  header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #2a2a36;
  }

  h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  header p {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: #9a9aad;
  }

  .lede {
    max-width: 52rem;
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

  .canvas-host {
    flex: 1;
    min-width: 0;
  }

  .hud {
    width: min(22rem, 38vw);
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
</style>
