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

**Site portal** (lists experiments — same layout as production):

```sh
make install
make dev          # portal at /, native proxied at /native/
```

**Single experiment** (native curriculum, local dev at `/`):

```sh
cd experiments/native
make dev          # http://localhost:5173/
```

Production build from the repo root:

```sh
make build        # dist/ — portal at /, native at /native/
```

## Deploy (Vercel)

Import the GitHub repo as a Vite project. `vercel.json` sets the build command and SPA rewrites. No environment variables or custom domain required.

| URL | Content |
|-----|---------|
| `/` | Experiment index |
| `/native/` | Native curriculum menu |
| `/native/?step=N` | Native demo N |

Add new experiments as sibling folders under `experiments/`, register them in `common/experiments.js`, and wire a `build:site` script into the root `npm run build`.

## Shared code

Put cross-experiment assets in `common/assets/` and small shared modules in `common/lib/`. Import only what an experiment needs; keep experiments independently runnable.
