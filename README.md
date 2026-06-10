# threejs-stacking

Experiments with Three.js and third-party orchestration or composition layers. Each experiment is isolated so code, dev tooling, and Cursor collaboration can stay scoped to one stack at a time.

See [docs/init.md](docs/init.md) for goals and constraints.

## Layout

```
common/                 Shared assets and utilities (optional per experiment)
experiments/
  native/               Bare Three.js + Svelte
  <name>/               One folder per future orchestration layer
```

Each experiment owns its own `Makefile`, dependencies, and dev server. UI is Svelte (not SvelteKit). There is no shared test suite—feedback comes from running the local site in a browser.

## Getting started

Pick an experiment and work from its directory:

```sh
cd experiments/native
make help
```

Add new experiments as sibling folders under `experiments/`, following the same shape as `native/`.

## Shared code

Put cross-experiment assets in `common/assets/` and small shared modules in `common/lib/`. Import only what an experiment needs; keep experiments independently runnable.
