<script>
  import { fmtVec, fmtQuat } from './format.js';

  export let hud = {};
  export let stepApi;

  let rendererMode = 'webgpu';
  let autoUpdateMatrices = true;
  let didSync = false;

  $: if (stepApi && !didSync && hud.rendererMode != null) {
    rendererMode = hud.rendererMode ?? rendererMode;
    autoUpdateMatrices = hud.autoUpdateMatrices ?? autoUpdateMatrices;
    didSync = true;
  }

  $: if (stepApi) {
    stepApi.setRendererMode(rendererMode);
    stepApi.setAutoUpdateMatrices(autoUpdateMatrices);
  }

  $: activeMode = hud.rendererModes?.find((mode) => mode.id === rendererMode);
  $: initPhase = hud.initPhase ?? 'initializing';
</script>

<h2>WebGPU renderer path</h2>
<p class="hint">
  Step 1's nested arm, rendered through the modern renderer stack. Compare async
  <code>WebGPURenderer</code> startup with the classic synchronous
  <code>WebGLRenderer</code>.
</p>

<section class="node status">
  <h3>Feature detection</h3>
  <dl>
    <dt><code>navigator.gpu</code></dt>
    <dd class:ok={hud.webgpuAvailable} class:warn={!hud.webgpuAvailable}>
      {hud.webgpuAvailable ? 'available' : 'not available — expect WebGL2 fallback'}
    </dd>
    <dt>init phase</dt>
    <dd class:ok={initPhase === 'ready'} class:warn={initPhase === 'initializing'} class:error={initPhase === 'error'}>
      {initPhase}
      {#if hud.initMs != null && initPhase === 'ready'}
        <span class="muted"> ({hud.initMs} ms)</span>
      {/if}
    </dd>
    {#if hud.backend}
      <dt>active backend</dt>
      <dd>{hud.backend.label}</dd>
      <dt>detail</dt>
      <dd class="detail">{hud.backend.detail}</dd>
    {/if}
    {#if hud.usedBuiltInFallback}
      <dt class="warn">fallback</dt>
      <dd class="warn">WebGPURenderer used its built-in WebGL2 backend</dd>
    {/if}
  </dl>

  {#if initPhase === 'error'}
    <p class="warn">
      {hud.initError ?? 'Renderer init failed.'}
      <button type="button" onclick={() => stepApi?.retryInit()}>Retry init</button>
    </p>
  {/if}
</section>

<fieldset class="primitive-list">
  <legend>Renderer entry</legend>

  {#each hud.rendererModes ?? [] as mode}
    <label class="radio">
      <input type="radio" bind:group={rendererMode} value={mode.id} disabled={initPhase === 'initializing'} />
      <span>
        <strong>{mode.label}</strong>
        <span class="radio-hint">{mode.hint}</span>
      </span>
    </label>
  {/each}

  {#if activeMode}
    <p class="hint nested">{activeMode.hint}</p>
  {/if}
</fieldset>

{#if hud.rendererInfo}
  <section class="node">
    <h3>Active renderer</h3>
    <dl>
      <dt>class</dt>
      <dd><code>{hud.rendererInfo.className}</code></dd>
      <dt>coordinate system</dt>
      <dd><code>{hud.rendererInfo.coordinateSystem}</code></dd>
      <dt>pixel ratio</dt>
      <dd>{hud.rendererInfo.pixelRatio}</dd>
    </dl>
  </section>
{/if}

<label class="toggle">
  <input type="checkbox" bind:checked={autoUpdateMatrices} />
  <span><code>scene.matrixWorldAutoUpdate</code> (same toggle as step 1)</span>
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

{#if hud.apiDeltas?.length}
  <section class="node">
    <h3>API deltas</h3>
    <table class="delta-table">
      <thead>
        <tr>
          <th>topic</th>
          <th>WebGPURenderer</th>
          <th>WebGLRenderer</th>
        </tr>
      </thead>
      <tbody>
        {#each hud.apiDeltas as row}
          <tr>
            <td>{row.label}</td>
            <td>{row.webgpu}</td>
            <td>{row.webgl}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}

<style>
  .nested {
    margin: 0.35rem 0 0.25rem;
    font-size: 0.72rem;
    color: #9a9aad;
  }

  .radio {
    display: flex;
    align-items: flex-start;
    gap: 0.45rem;
    margin-bottom: 0.45rem;
    cursor: pointer;
  }

  .radio input {
    margin-top: 0.15rem;
  }

  .radio span {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .radio-hint {
    color: #9a9aad;
    font-size: 0.72rem;
    line-height: 1.35;
    font-weight: normal;
  }

  .status dd.ok {
    color: #8fd98f;
  }

  .status dd.warn,
  .status dt.warn,
  .status dd.error {
    color: #f0c878;
  }

  .status dd.error {
    color: #ff8a8a;
  }

  .detail {
    color: #9a9aad;
    line-height: 1.35;
  }

  .muted {
    color: #9a9aad;
  }

  .delta-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.68rem;
  }

  .delta-table th,
  .delta-table td {
    padding: 0.3rem 0.35rem;
    border-bottom: 1px solid #2a2a36;
    text-align: left;
    vertical-align: top;
  }

  .delta-table th {
    color: #9a9aad;
    font-weight: 600;
  }

  .delta-table td:first-child {
    font-weight: 600;
    white-space: nowrap;
  }
</style>
