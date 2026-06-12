<script>
  import { EXPERIMENTS } from '../common/experiments.js';
</script>

<div class="portal">
  <header class="portal-header">
    <h1>threejs-stacking</h1>
    <p class="lede">
      Experiments with Three.js and third-party orchestration layers. Pick a stack to explore.
    </p>
    <p class="source">
      Source code:
      <a
        href="https://github.com/peterhoward42/threejs-stacking"
        target="_blank"
        rel="noopener noreferrer"
      >github.com/peterhoward42/threejs-stacking</a>
    </p>
  </header>

  <div class="portal-list">
    {#each EXPERIMENTS as experiment (experiment.id)}
      <article class="card">
        <div class="card-body">
          <h2>{experiment.title}</h2>
          <p class="card-lede">{experiment.description}</p>
          <div class="card-actions">
            <a class="cta" href={experiment.path}>Open experiment →</a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .portal {
    min-height: 100dvh;
    background: #111118;
    color: #e8e8ef;
  }

  .portal-header {
    padding: 1rem 1.25rem 0.85rem;
    border-bottom: 1px solid #2a2a36;
  }

  .portal-header h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .lede {
    margin: 0.35rem 0 0;
    font-size: 0.82rem;
    color: #9a9aad;
    line-height: 1.45;
    max-width: 42rem;
  }

  .source {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: #7a7a8d;
    line-height: 1.45;
  }

  .source a {
    color: #7a9ac8;
    text-decoration: none;
  }

  .source a:hover {
    text-decoration: underline;
  }

  .portal-list {
    padding: 1rem 1.25rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    max-width: 44rem;
  }

  .card {
    padding: 0.85rem 1rem;
    border: 1px solid #2a2a36;
    border-radius: 0.35rem;
    background: #15151c;
  }

  .card-body h2 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.35;
  }

  .card-lede {
    margin: 0.35rem 0 0.55rem;
    font-size: 0.78rem;
    color: #9a9aad;
    line-height: 1.45;
  }

  .card-actions {
    margin-top: 0.75rem;
  }

  .cta {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border: 1px solid #4a6a9a;
    border-radius: 0.25rem;
    background: #2a3a58;
    color: #e8eef8;
    font-size: 0.78rem;
    font-weight: 500;
    text-decoration: none;
  }

  .cta:hover {
    background: #334870;
  }
</style>
