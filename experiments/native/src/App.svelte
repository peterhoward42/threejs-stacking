<script>
  import { onMount } from 'svelte';
  import { resolveStep } from './step.js';
  import Menu from './Menu.svelte';
  import Demo from './Demo.svelte';

  const step = resolveStep();

  onMount(() => {
    document.documentElement.classList.toggle('menu-mode', step === null);
    return () => {
      document.documentElement.classList.remove('menu-mode');
    };
  });
</script>

{#if step === null}
  <Menu />
{:else}
  <Demo {step} />
{/if}
