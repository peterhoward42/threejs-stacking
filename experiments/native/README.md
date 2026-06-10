# native

Bare Three.js with a Svelte UI. Numbered curriculum steps live in `src/steps/` — each is an isolated demo with its own launch path.

## Launch a step

```sh
make install          # once
make dev STEP=1       # scene graph and transforms
make dev STEP=2       # cameras and projection
make dev STEP=3       # built-in geometry and BufferGeometry anatomy
make dev STEP=4       # material comparison lab
make dev STEP=5       # light types and real-time shadows
make dev STEP=6       # PBR maps on MeshStandardMaterial
make dev STEP=7       # textures and sampling behaviour
make dev STEP=8       # asset loading with GLTFLoader
make dev STEP=9       # OrbitControls and the render loop
make dev STEP=10      # raycasting and mesh picking
make dev STEP=11      # keyframe animation with AnimationMixer
make dev STEP=12      # InstancedMesh at scale
```

Or open the dev server with a query param: `http://localhost:5173/?step=2`

Only one step mounts at a time; switching steps reloads the page with a different `?step=` or `VITE_STEP`.

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
        ├── 02-cameras.js
        ├── 03-geometry.js
        ├── 04-materials.js
        ├── 05-lights.js
        ├── 06-pbr-maps.js
        ├── 07-textures.js
        ├── 08-gltf-loading.js
        ├── 09-orbit-controls.js
        ├── 10-raycasting.js
        ├── 11-keyframes.js
        └── 12-instanced-mesh.js
```
