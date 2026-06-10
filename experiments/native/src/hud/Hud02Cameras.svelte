<script>
  import { fmt } from './format.js';

  export let hud = {};
  export let stepApi;

  let fov = 50;
  let near = 0.1;
  let far = 100;
  let orthoSize = 8;
  let showHelpers = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.perspective) {
    fov = hud.fov ?? fov;
    near = hud.near ?? near;
    far = hud.far ?? far;
    orthoSize = hud.orthoSize ?? orthoSize;
    showHelpers = hud.showHelpers ?? showHelpers;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setFov(fov);
    stepApi.setNear(near);
    stepApi.setFar(far);
    stepApi.setOrthoSize(orthoSize);
    stepApi.setShowHelpers(showHelpers);
  }
</script>

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
