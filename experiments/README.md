# experiments

One directory per stack. Each experiment is self-contained:

- Svelte UI (not SvelteKit)
- Its own `Makefile` and package tooling
- Its own dev server workflow

| Directory | Purpose |
|-----------|---------|
| `native/` | Learn Three.js directly, without an orchestration layer |

Add further folders here as you try other composition libraries. Copy the layout of `native/` as a starting point.

On the deployed site, each experiment is served under its own path (`/native/` today). Register new stacks in `common/experiments.js` and add a `build:site` script to the root build.
