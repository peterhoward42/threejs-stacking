# native

Bare Three.js with a Svelte UI. Numbered curriculum steps live in `src/steps/` — each is an isolated demo with its own launch path.

## Launch a step

```sh
make install          # once
make dev STEP=1       # scene graph and transforms
make dev STEP=2       # cameras and projection
```

Or open the dev server with a query param: `http://localhost:5173/?step=2`

Only one step mounts at a time; switching steps reloads the page with a different `?step=` or `VITE_STEP`.

## Step 1 — Scene graph and transforms

Nested groups (`root` → `arm` → `wrist` → `cube`) rotate at different rates. Coloured joint markers and axis helpers show where each `Object3D` sits in the hierarchy. The side panel compares local vs world position, rotation, scale, and quaternion, and demonstrates when `matrixWorldAutoUpdate` / `updateMatrixWorld` matter.

## Step 2 — Cameras and projection

The canvas splits into two viewports: `PerspectiveCamera` on the left, `OrthographicCamera` on the right, both aimed at the same scene. Sliders adjust fov, near/far, and orthographic frustum height; toggle `CameraHelper` wireframes to see each frustum in world space.

## Commands

```sh
make install
make dev STEP=1
make build
make preview
```

## Layout

The shell is locked to the browser viewport (`100dvh`, no page scroll). The canvas fills the remaining space beside the HUD; call `renderer.setSize(w, h, false)` and let CSS size the canvas element (see `app.css`).

```
native/
├── Makefile
├── package.json
├── index.html
├── vite.config.js
├── svelte.config.js
└── src/
    ├── main.js
    ├── app.css
    ├── step.js           # step resolution and lazy loading
    ├── App.svelte        # shell + HUD
    └── steps/
        ├── 01-scene-graph.js
        └── 02-cameras.js
```
