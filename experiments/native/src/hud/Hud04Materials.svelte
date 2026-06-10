<script>
  export let hud = {};
  export let stepApi;

  let wireframe = false;
  let didSync = false;

  $: if (stepApi && !didSync && hud.materials) {
    wireframe = hud.wireframe ?? wireframe;
    didSync = true;
  }

  $: stepApi?.setWireframe(wireframe);
</script>

<h2>Material lab</h2>
<p class="hint">
  Every mesh uses the same geometry and base colour. Compare how each material type responds to
  the directional, ambient, and point lights in the scene.
</p>

<label class="toggle">
  <input type="checkbox" bind:checked={wireframe} />
  <span>wireframe</span>
</label>

{#each hud.materials ?? [] as material}
  <section class="node">
    <h3>{material.label}</h3>
    <p class="hint inline">{material.note}</p>
  </section>
{/each}
