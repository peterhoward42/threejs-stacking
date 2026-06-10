<script>
  import { onMount } from 'svelte';
  import { resolveStep, loadStep } from './step.js';
  import { loadHud, loadOverlay } from './hud/index.js';
  import './hud/hud.css';

  let container;
  let step = resolveStep();
  let meta = { title: '…', description: '' };
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
</style>
