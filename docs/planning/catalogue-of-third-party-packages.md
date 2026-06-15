# Catalogue of third party packages

Each entry below describes a package that may sit alongside or above Three.js. The
survey block defines what to capture per package — descriptive characterisation,
not recommendations. Filled sections replace the `<todo>…</todo>` placeholder under
each heading.

## Per-package survey template



### When it applies

This package is intended when a Three.js app can be characterised as having these properties, required features, or constraints: .

### What it owns vs what Three.js still owns

<Which concerns move up a layer — scene construction, lifecycle, loaders, domain workflows — and what remains raw Three.js or outside scope entirely.>

### Problems it solves as a Three.js partner

Without it you would need to implement: . That work tends to be challenging or undesirable because: <complexity, maintenance, domain expertise, performance, etc.>.

### What you lose by adopting it

<Capabilities, direct access, or freedoms relinquished once this package is in the path — e.g. unilateral scene-graph ownership that makes the package the required intermediary for reading or mutating the graph; reduced visibility into underlying Three.js objects; constraints on interleaving raw Three.js patterns alongside package-managed code.>

### When it does not apply

Situations where this package is a poor fit or largely irrelevant: <simpler native Three.js patterns suffice, wrong UI stack, wrong data scale, concern belongs elsewhere>.

### Overlap with other catalogue entries

<How this relates to sibling packages in this document — companion to, alternative to, orthogonal to — with named entries where relevant.>

### Stack lock-in

<Frameworks, runtimes, services, data formats, or architectural commitments this package assumes or pulls in.>

### Portability constraints

<What transfers to or from native Three.js and sibling packages — assets, scene logic, patterns, tooling — and what does not; where shared repo code (`common/`) remains viable vs where concerns become package-specific.>

### Mental model shift from native Three.js

<How scene construction, updates, and debugging differ from the patterns in `experiments/native` compared to writing Three.js directly.>

### Touchpoints with the "native" three.js experiments in this repo.

<Which native curriculum steps (`docs/planning/native.md`, `experiments/native/src/steps/`) illustrate concerns this package wraps, extends, or would sit alongside — and in what way.>



---

# Potential Three.js Ecosystem Components

## React Three Fiber

A React renderer for three.js. It allows 3D scenes to be expressed as React components and provides tight integration with React state management, lifecycle handling, and UI composition. Suitable for teams already committed to React.

### When it applies

This package is intended when a Three.js app can be characterised as having these properties, required features, or constraints: the surrounding product UI is already React (or the team is willing to adopt React for the whole page); scene content, layout, and HUD controls should co-evolve as a single component tree; props and React state should drive mesh transforms, materials, visibility, and loaders; and the render loop, resize handling, and renderer lifecycle should be managed by the framework rather than hand-wired in an imperative bootstrap script.

### What it owns vs what Three.js still owns

R3F owns the bridge between React’s reconciliation cycle and a Three.js scene: mounting and unmounting `Object3D` instances from JSX, attaching props to Three.js objects, scheduling `requestAnimationFrame` via `useFrame`, and exposing hooks (`useThree`, `useLoader`, `useGraph`) for reading the active renderer, camera, and scene. Three.js still owns the actual scene graph types, materials, geometries, loaders, shaders, post-processing passes, and rendering APIs — R3F does not replace those concepts, it instantiates and updates them. Concerns outside the canvas (routing, forms, data fetching, non-3D DOM) remain ordinary React unless a companion library (e.g. drei’s `Html`) deliberately bridges into the 3D layer.

### Problems it solves as a Three.js partner

Without it you would need to implement: a custom reconciliation layer that keeps a React (or similar) UI in sync with a manually maintained scene graph; explicit create/add/remove/dispose calls tied to component mount and unmount; a shared render-loop hook that every animated object registers with; resize and pixel-ratio handling wired to the canvas; and patterns for loading assets without blocking the UI thread or leaking GPU resources on teardown. That work tends to be challenging or undesirable because: it duplicates problems React already solves for DOM trees; subtle lifecycle bugs (orphaned meshes, undisposed textures, stale animation callbacks) accumulate quickly; and every feature (picking, controls, loaders) becomes bespoke glue code unless standardised.

### What you lose by adopting it

The scene graph becomes mediated by React’s render rules: you cannot freely mutate Three.js objects outside the R3F tree without fighting the reconciler or using escape hatches (`useFrame`, refs, imperative `three` objects passed as refs). Debugging shifts from “inspect `scene.children` in the console” to “trace which component last set this prop.” Mixing large imperative Three.js subsystems (custom editors, legacy class-based loaders, hand-rolled `EffectComposer` setup) alongside declarative JSX requires deliberate boundaries. You also inherit React’s runtime, bundler assumptions, and rules of hooks — the canvas is not an isolated imperative island anymore. Performance tuning sometimes means understanding both Three.js draw-call behaviour and React re-render frequency.

### When it does not apply

Situations where this package is a poor fit or largely irrelevant: the UI stack is Svelte, Vue, or plain HTML/JS (this repo’s stated UI constraint favours Svelte — Threlte is the closer analogue here); the 3D work is a single self-contained canvas with minimal surrounding UI and no need for component-tree composition; the team wants maximum direct control over every `Object3D` without a reconciliation layer; or the workload is dominated by domain-specific viewers (BIM, geospatial) where a specialised platform owns scene orchestration end-to-end.

### Overlap with other catalogue entries

**Companion to:** drei (controls, helpers, loaders, and abstractions built for R3F); react-three-rapier (physics expressed as R3F components). **Alternative to:** Threlte for the same “declarative scene as components” role in a different UI framework; native imperative Three.js when no UI-framework bridge is wanted. **Largely orthogonal to:** That Open Engine, xeokit, CesiumJS, and deck.gl — those address engineering-model, geospatial, or large-scale analytical-visualisation domains rather than general React scene composition, though an R3F canvas could theoretically host a texture or overlay fed by one of them.

### Stack lock-in

Commits to React (and typically a React bundler toolchain: Vite, Next.js, etc.) for anything that touches the canvas. Ecosystem gravity pulls toward `@react-three/drei`, `@react-three/postprocessing`, and other R3F-native packages rather than raw Three.js examples copy-pasted from the official docs. Patterns like `useFrame`, declarative `<mesh>`, and loader hooks become the idiomatic surface — porting later means rewriting scene construction, not just swapping imports. React 18+ concurrent features and strict-mode double-mounting affect how scenes initialise and dispose.

### Portability constraints

Three.js knowledge transfers directly: material types, geometry, loaders, lighting models, and shader concepts are the same objects underneath. Shared repo assets in `common/assets/` (`.glb`, `.hdr`, textures) remain usable via `useLoader` or imperative loaders inside R3F components. Curriculum logic that is pure math, colour utilities, or data structures could live in `common/lib/`. What does not port cleanly: native step modules written as `buildScene()` + `update(dt)` + manual `renderer.render()` loops — those want rewriting as components and hooks; Svelte HUD panels from `experiments/native/src/hud/` do not drop into an R3F experiment without a React rewrite or a separate React HUD layer; step launch/isolation patterns may mirror the native Makefile/query-param approach but the implementation is package-specific.

### Mental model shift from native Three.js

In `experiments/native`, a step exports `meta`, constructs a `THREE.Scene` imperatively, registers an animation callback, and tears everything down on step change. With R3F, the scene *is* the component tree: `<mesh>`, `<group>`, `<ambientLight>` replace `new THREE.Mesh()` and `scene.add()`. Transforms become props (`position`, `rotation`, `scale`) that R3F diffs each frame rather than fields you mutate on a cached reference — though `useFrame` recovers imperative mutation when needed. The render loop is implicit (R3F’s internal loop calls `gl.render`) instead of explicit `requestAnimationFrame` in step 9. Loaders suspend via React rather than promise chains in step 8. Resource disposal is tied to unmount rather than manual `dispose()` calls in step 23, though explicit disposal is still required for objects created outside the declarative tree.

### Touchpoints with the "native" three.js experiments in this repo.

| Native step | Concern R3F wraps or parallels |
|-------------|-------------------------------|
| 1 — Scene graph | `<group>` nesting and transform props mirror parent/child attachment and local transforms. |
| 2 — Cameras | `<PerspectiveCamera makeDefault>` replaces manual camera setup; multi-camera patterns need R3F-specific wiring. |
| 3–4 — Geometry & materials | `<boxGeometry>`, `<meshStandardMaterial>` are declarative equivalents of `new THREE.BoxGeometry()` / `MeshStandardMaterial`. |
| 5–7 — Lights, PBR maps, textures | Light and material components with props; texture loading via `useLoader` or drei helpers. |
| 8 — GLTF loading | `useGLTF` / `<useLoader(GLTFLoader, url)>` with Suspense instead of manual loader callbacks. |
| 9 — OrbitControls & render loop | `useFrame` for simulation; drei `OrbitControls` or `@react-three/drei` controls replace manual setup. |
| 10 — Raycasting | R3F pointer events (`onPointerOver`, `onClick`) abstract `Raycaster` for mesh picking. |
| 11 — Keyframe animation | `useAnimations` + drei helpers, or manual mixer in `useFrame`, parallel step 11’s `AnimationMixer` work. |
| 12 — InstancedMesh | `<instancedMesh>` with instance matrix updates, often driven from `useFrame` or instancing helpers. |
| 13–14 — Custom geometry & shaders | `<bufferGeometry>` / `<shaderMaterial>` remain declarative but attribute/uniform setup still uses Three.js APIs. |
| 15 — Post-processing | `@react-three/postprocessing` or manual composer in `useFrame` — not part of core R3F. |
| 16–17 — IBL, render targets | Environment maps and FBO patterns work via drei (`Environment`, `useFBO`) or imperative hooks. |
| 18–22 — Lines, morph, LOD, CSS2D, clipping | Supported through Three.js types in JSX; CSS2D/HTML overlays map to drei `Html` / `Billboard` rather than `CSS2DRenderer` alone. |
| 23 — Resource lifecycle | Automatic dispose on unmount for R3F-created objects; custom resources still need explicit cleanup. |
| 24–25 — Multi-viewport, WebGPU | Require escape hatches or experimental R3F patterns; not first-class declarative features. |

---

## drei

A companion utility library for React Three Fiber. It provides a large collection of ready-made controls, labels, camera tools, loaders, gizmos, helpers, and other common functionality that would otherwise need to be implemented manually.



---

## react-three-rapier

Physics integration for React Three Fiber based on the Rapier physics engine. Useful if the application later requires collision detection, physical simulation, constrained movement, or other physics-driven interactions.



---

## Threlte

A Svelte-oriented integration layer for three.js. Similar in spirit to React Three Fiber, but designed for teams using Svelte. It provides a component-based approach to scene construction while remaining within the Svelte ecosystem.



---

## That Open Engine

A BIM and digital-twin-oriented platform (formerly associated with IFC.js). It focuses on engineering models, metadata, hierarchy management, clipping, selection, property inspection, and related workflows commonly required in facilities and infrastructure applications.



---

## xeokit

A web-based engineering and BIM viewer aimed at large models. It provides capabilities around metadata-driven interaction, selection, sectioning, visibility management, and handling of complex engineering datasets.



---

## CesiumJS

A 3D geospatial and large-scale scene engine. While often associated with globe visualisation, its more relevant capabilities for industrial applications are hierarchical streaming, large-scene management, and level-of-detail control through technologies such as 3D Tiles.



---

## deck.gl

A high-performance WebGL/WebGPU visualisation framework for large datasets. Particularly relevant for analytical overlays such as methane plumes, sensor fields, heatmaps, flow visualisations, event layers, and other spatial-temporal data representations.

