# native

Bare Three.js with a Svelte UI. Numbered curriculum steps live in `src/steps/` — each is an isolated demo with its own scene and HUD.

## Start the lab

```sh
make install          # once
make dev              # opens demo chooser at /
```

The menu lists all 25 topics with lede text and concept notes. Click **Open demo** on a card to mount that step.

Deep links still work: `http://localhost:5173/?step=10` opens demo 10 directly. Use **← All demos** in the header to return to the menu.

Only one step mounts at a time; switching demos reloads the page with a different `?step=` query.

## Copy and navigation

All UI copy (titles, ledes, concept notes) lives in `src/curriculum.js`. Step modules re-export `meta` from there so headers stay in sync with the chooser.

```
/
  → menu (no WebGL)
/?step=N
  → demo N (canvas + HUD)
```

## Step 1 — Scene graph and transforms

Nested groups (`root` → `arm` → `wrist` → `cube`) rotate at different rates. Coloured joint markers and axis helpers show where each `Object3D` sits in the hierarchy. The side panel compares local vs world position, rotation, scale, and quaternion, and demonstrates when `matrixWorldAutoUpdate` / `updateMatrixWorld` matter.

## Step 2 — Cameras and projection

The canvas splits into two viewports: `PerspectiveCamera` on the left, `OrthographicCamera` on the right, both aimed at the same scene. Sliders adjust fov, near/far, and orthographic frustum height; toggle `CameraHelper` wireframes to see each frustum in world space.

## Step 3 — Built-in geometry and BufferGeometry anatomy

A gallery of primitives (`Box`, `Sphere`, `Cylinder`, `Torus`, `Plane`, `Cone`, `TorusKnot`, `Icosahedron`), each with its own material. Click a mesh or use the HUD list to inspect `geometry.attributes` (position, normal, uv), index buffer, and sample values. Switch colour mode to paint vertices by local position or normals by direction.

## Step 4 — Material comparison lab

The same `TorusKnotGeometry` repeated in a grid with `MeshBasicMaterial`, `MeshLambertMaterial`, `MeshPhongMaterial`, `MeshStandardMaterial`, `MeshPhysicalMaterial`, `MeshNormalMaterial`, and `MeshMatcapMaterial`. Directional, ambient, and point lights reveal shading differences; toggle wireframe to inspect tessellation. Floor labels name each material type.

## Step 5 — Light types and real-time shadows

One scene with a hero torus knot and primitive props on a shadow-receiving ground plane. Switch between `AmbientLight`, `HemisphereLight`, `DirectionalLight`, `PointLight`, `SpotLight`, and `RectAreaLight` (with `RectAreaLightUniformsLib`). Directional, point, and spot lights cast real-time shadows; tune `shadow.mapSize`, bias, normal bias, and the directional shadow camera frustum. Optional helpers show light position and aim.

## Step 6 — PBR maps on MeshStandardMaterial

A subdivided box with procedural canvas textures in every `MeshStandardMaterial` map slot: `map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, and `displacementMap`. Toggle each map in the HUD; switch between separate data textures and one packed ORM image (R=AO, G=roughness, B=metalness). Adjust UV repeat to see map alignment depend on `uv` / `uv2`, and tune displacement strength on the dense geometry.

## Step 7 — Textures and sampling behaviour

Image and canvas texture sources on labelled planes: the hero plane exposes `wrapS` / `wrapT`, `repeat`, `offset`, `rotation`, `minFilter` / `magFilter`, `anisotropy`, and `colorSpace`. Static rows compare wrap modes, magnification filters, and sRGB vs linear sampling on the same gradient. A third plane runs an animated `CanvasTexture` redrawn each frame.

## Step 8 — Asset loading with GLTFLoader

Loads `common/assets/brain-stem.glb` with progress and error callbacks. After load, `scene.traverse` lists every mesh and unique material; pick a mesh and swap its material (original, wireframe, normal view, or emissive accent). Embedded clips play through `AnimationMixer`; reload or trigger a missing-file error from the HUD.

## Step 9 — OrbitControls and the render loop

Three orbiting rings of boxes around a central hub. `Clock.getDelta()` drives simulation; `OrbitControls` handles drag-orbit, scroll-zoom, and right-drag pan with optional damping. The HUD exposes damping, zoom limits, pan/rotate/zoom toggles, and target height; pause simulation to see controls and render stay live. Pink marker shows `controls.target`.

## Step 10 — Raycasting and mesh picking

Four named meshes on the left and a 10×10 `InstancedMesh` grid on the right. Pointer NDC feeds `Raycaster`; hover uses emissive tint on meshes and `setColorAt` on instances. Click to select and log `faceIndex` (meshes) or `instanceId` (instanced). HUD toggles pick targets — individual, instanced, or both (nearest hit) — and shows hover/selection readouts plus a click log.

## Step 11 — Keyframe animation with AnimationMixer

Three pedestals: procedural `AnimationClip` built from `VectorKeyframeTrack` (bounce + spin on a box), morph `NumberKeyframeTrack` on `morphTargetInfluences` (bulge/twist targets), and `brain-stem.glb` clips driven by a third mixer. HUD controls loop mode (`LoopRepeat`, `LoopOnce` + clamp, `LoopPingPong`), global time scale and play/pause, clip restart, and glTF crossfade duration with per-action weight readout.

## Step 12 — InstancedMesh at scale

Thousands of cones via a single `InstancedMesh` using `setMatrixAt` and `setColorAt` (HSL gradient per instance). Toggle grid vs scatter placement on an undulating ground plane. Switch to naive per-mesh clones to contrast `renderer.info.render.calls`, triangle count, and frame time; clone mode caps count to keep the tab responsive. Optional per-instance matrix animation shows live `instanceMatrix` updates.

## Step 13 — Procedural custom BufferGeometry

Three geometry builders from scratch: a parametric sine surface, a terrain heightfield on an XZ grid, and an icosahedron with hand-written vertices and face indices. Each allocates `Float32Array` position and UV buffers, optionally expands to non-indexed triangles, and calls `computeVertexNormals`. HUD toggles indexed drawing, normal computation, wireframe, grid resolution, and vertex/normal false-colour modes. The parametric preset can animate live position updates with recomputed normals.

## Commands

```sh
make install
make dev
make build
make preview
```

## Layout

The shell is locked to the browser viewport (`100dvh`, no page scroll) in demo mode. The menu view scrolls normally. The canvas fills the remaining space beside the HUD; call `renderer.setSize(w, h, false)` and let CSS size the canvas element (see `app.css`).

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
    ├── curriculum.js     # titles, ledes, concept notes
    ├── step.js           # step resolution and lazy loading
    ├── App.svelte        # menu vs demo router
    ├── Menu.svelte       # scrollable demo chooser
    ├── Demo.svelte       # canvas + HUD shell
    └── steps/
        ├── 01-scene-graph.js
        …
        └── 25-webgpu-renderer.js
```
