<script>
  import { CURRICULUM, NOTES_EXCERPT_COUNT, notesExcerptForStep, hasMoreNotes, notesForStep } from './curriculum.js';
  import { demoUrl } from './nav.js';

  /** @type {Record<number, boolean>} */
  let expanded = {};

  function openDemo(step) {
    location.assign(demoUrl(step));
  }

  function toggleNotes(step) {
    expanded = { ...expanded, [step]: !expanded[step] };
  }
</script>

<div class="menu">
  <header class="menu-header">
    <h1>native — Three.js capability experiments</h1>
    <p class="lede">Pick a topic: name the concept → see it → play → read code</p>
  </header>

  <div class="menu-list">
    {#each CURRICULUM as entry (entry.step)}
      {@const excerpt = notesExcerptForStep(entry.step)}
      {@const showMore = hasMoreNotes(entry.step)}
      {@const isExpanded = expanded[entry.step]}
      <article class="card">
        <div class="card-badge">{String(entry.step).padStart(2, '0')}</div>
        <div class="card-body">
          <h2>{entry.title}</h2>
          <p class="card-lede">{entry.description}</p>
          <ul class="card-notes">
            {#each isExpanded ? notesForStep(entry.step) : excerpt as note}
              <li>{note}</li>
            {/each}
          </ul>
          {#if showMore}
            <button type="button" class="read-more" on:click={() => toggleNotes(entry.step)}>
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          {/if}
          <div class="card-actions">
            <button type="button" class="cta" on:click={() => openDemo(entry.step)}>
              Open demo →
            </button>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .menu {
    min-height: 100dvh;
    background: #111118;
    color: #e8e8ef;
  }

  .menu-header {
    padding: 1rem 1.25rem 0.85rem;
    border-bottom: 1px solid #2a2a36;
  }

  .menu-header h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .lede {
    margin: 0.35rem 0 0;
    font-size: 0.82rem;
    color: #9a9aad;
    line-height: 1.45;
  }

  .menu-list {
    padding: 1rem 1.25rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .card {
    display: flex;
    gap: 0.85rem;
    padding: 0.85rem 1rem;
    border: 1px solid #2a2a36;
    border-radius: 0.35rem;
    background: #15151c;
  }

  .card-badge {
    flex-shrink: 0;
    font-size: 0.78rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #9a9aad;
    padding-top: 0.1rem;
    min-width: 1.75rem;
  }

  .card-body {
    flex: 1;
    min-width: 0;
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

  .card-notes {
    margin: 0;
    padding-left: 1.1rem;
    font-size: 0.76rem;
    color: #b8b8c8;
    line-height: 1.45;
  }

  .card-notes li + li {
    margin-top: 0.25rem;
  }

  .read-more {
    margin-top: 0.45rem;
    padding: 0;
    border: none;
    background: none;
    color: #7eb8ff;
    font-size: 0.74rem;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .read-more:hover {
    color: #a8d0ff;
  }

  .card-actions {
    margin-top: 0.75rem;
  }

  .cta {
    padding: 0.35rem 0.75rem;
    border: 1px solid #4a6a9a;
    border-radius: 0.25rem;
    background: #2a3a58;
    color: #e8eef8;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
  }

  .cta:hover {
    background: #334870;
  }
</style>
