<script>
  import { onMount } from 'svelte';
  import { loadStep } from './step.js';
  import { metaForStep, notesForStep } from './curriculum.js';
  import { loadHud, loadOverlay } from './hud/index.js';
  import './hud/hud.css';

  /** @type {{ step: number }} */
  export let step;

  let container;
  let meta = metaForStep(step);
  let hud = {};
  let loadError = '';
  let stepApi;
  let HudComponent = null;
  let OverlayComponent = null;

  loadHud(step).then((component) => {
    HudComponent = component;
  });
  loadOverlay(step).then((component) => {
    OverlayComponent = component;
  });

  function goToMenu() {
    location.assign('/');
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
    <div class="header-row">
      <button type="button" class="back" on:click={goToMenu}>← All demos</button>
      <h1>step {step} · {meta.title}</h1>
    </div>
    {#if meta.description}
      <p class="lede">{meta.description}</p>
    {/if}
    <details class="concept-notes">
      <summary>Concept notes</summary>
      <ul>
        {#each notesForStep(step) as note}
          <li>{note}</li>
        {/each}
      </ul>
    </details>
  </header>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else}
    <div class="workspace">
      <div class="canvas-wrap">
        <div bind:this={container} class="canvas-host" aria-label="Three.js canvas"></div>
        {#if OverlayComponent}
          <svelte:component this={OverlayComponent} />
        {/if}
      </div>

      <aside class="hud">
        {#if HudComponent}
          <svelte:component this={HudComponent} {hud} {stepApi} />
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

  .header-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .back {
    flex-shrink: 0;
    padding: 0.15rem 0.35rem;
    margin: 0;
    border: none;
    border-radius: 0.2rem;
    background: transparent;
    color: #7eb8ff;
    font-size: 0.78rem;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .back:hover {
    color: #a8d0ff;
  }

  h1 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .lede {
    margin: 0.15rem 0 0;
    font-size: 0.78rem;
    color: #9a9aad;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .concept-notes {
    margin-top: 0.35rem;
    font-size: 0.74rem;
    color: #b8b8c8;
  }

  .concept-notes summary {
    cursor: pointer;
    color: #9a9aad;
    user-select: none;
  }

  .concept-notes summary:hover {
    color: #c8c8d8;
  }

  .concept-notes ul {
    margin: 0.35rem 0 0;
    padding-left: 1.1rem;
    line-height: 1.45;
  }

  .concept-notes li + li {
    margin-top: 0.2rem;
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
</style>
