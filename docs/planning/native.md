# Native Three.js curriculum

Numbered topics for sequential experiments in `experiments/native`. Each step should be runnable in the browser, visually legible, and small enough to read in one sitting.

Assumes solid general 3D literacy (transforms, projections, meshes, UVs, rigging concepts). Focus is on **what Three.js provides and how its APIs hang together**.

---

## 1. Scene graph and transforms

`Object3D` hierarchy: parent/child attachment, local vs world space, `position` / `rotation` / `scale` / `quaternion`, `matrix` / `matrixWorld`, and when `updateMatrixWorld` matters. Visualise nested groups rotating at different rates to make the hierarchy obvious.

## 2. Cameras and projection

Side-by-side or toggle between `PerspectiveCamera` and `OrthographicCamera`. Expose fov, near/far, ortho frustum size. Show how the same scene reads differently. Optional: helper wireframes (`CameraHelper`).

## 3. Built-in geometry and `BufferGeometry` anatomy

Gallery of primitives (`Box`, `Sphere`, `Cylinder`, `Torus`, `Plane`, etc.) with one material each. Inspect `geometry.attributes` (position, normal, uv) and `index`. Colour vertices or normals to reveal structure.

## 4. Material comparison lab

Same mesh, multiple materials in a grid: `MeshBasicMaterial`, `MeshLambertMaterial`, `MeshPhongMaterial`, `MeshStandardMaterial`, `MeshPhysicalMaterial`, `MeshNormalMaterial`, `MeshMatcapMaterial`. Toggle wireframe. Observe lighting response differences.

## 5. Light types and real-time shadows

One scene, switchable lights: `AmbientLight`, `HemisphereLight`, `DirectionalLight`, `PointLight`, `SpotLight`, `RectAreaLight`. Enable shadow maps on a ground plane; tune `shadow.mapSize`, bias, camera frustum for directional shadows.

## 6. PBR maps on `MeshStandardMaterial`

Single model or box with map slots wired up: `map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `displacementMap` (subtle). UI toggles per map. Demonstrates channel packing and UV dependence.

## 7. Textures and sampling behaviour

`Texture` creation from image and canvas. Explore `wrapS` / `wrapT`, `repeat`, `offset`, `rotation`, `minFilter` / `magFilter`, `anisotropy`, `colorSpace` (diffuse vs data maps). Animated canvas texture.

## 8. Asset loading with `GLTFLoader`

Load a `.glb` / `.gltf` from `common/assets/`. Traverse the result with `scene.traverse`, list meshes/materials, replace a material, play embedded animations if present. Loading progress and error paths.

## 9. `OrbitControls` and the render loop

`requestAnimationFrame` + `Clock` / `delta`. `OrbitControls` with damping, zoom limits, pan, target. Separate simulation update from render. Pattern for resize handling you will reuse everywhere.

## 10. Raycasting and mesh picking

`Raycaster` from mouse / pointer normalized device coordinates. Hover highlight, click selection, optional `face` index logging. Compare mesh vs instanced mesh picking.

## 11. Keyframe animation with `AnimationMixer`

Procedural or loaded clips: `AnimationClip`, `KeyframeTrack`, `AnimationMixer`, `AnimationAction` (loop, clamp, crossfade). Drive transforms or morph influences over time.

## 12. `InstancedMesh` at scale

Thousands of identical meshes via `InstancedMesh` and per-instance `setMatrixAt` / `setColorAt`. Contrast draw calls and frame time with naive cloning. Optional: simple grid placement or scatter on a surface.

## 13. Procedural custom `BufferGeometry`

Build geometry from scratch: allocate `Float32Array` attributes, set `BufferAttribute`, `computeVertexNormals`, optional indexed drawing. Example: parametric surface, terrain heightfield, or polyhedron from first principles.

## 14. `ShaderMaterial` essentials

Custom GLSL vertex/fragment shaders via `ShaderMaterial`: uniforms (`time`, `color`), passing UVs/normals from attributes, simple procedural colouring or wave displacement. Shows Three.js shader chunk conventions without going full `onBeforeCompile`.

## 15. Post-processing with `EffectComposer`

Multi-pass pipeline: `RenderPass`, then one or two of `UnrealBloomPass`, `FXAA`, `OutlinePass`, or color grading. Toggle passes live. Understand render-to-texture between passes.

## 16. Image-based lighting and environments

`PMREMGenerator`, `CubeTexture` or HDRI via `RGBELoader` / `EXRLoader`. `scene.environment` and `scene.background`. Compare metal/rough materials with and without IBL.

## 17. Render targets and offscreen rendering

`WebGLRenderTarget`: render a secondary scene or camera to texture, display on a quad (`Scene` + `OrthographicCamera` fullscreen plane). Mirror, security monitor, or mini-map pattern.

## 18. Lines, edges, and points

`LineSegments`, `Line`, `LineLoop` from `BufferGeometry`; `EdgesGeometry` overlay; `Points` with `PointsMaterial` and size attenuation. When to use each draw mode vs filled meshes.

## 19. Morph targets

`BufferGeometry.morphAttributes.position` (and optional normals). Animate influences with `mesh.morphTargetInfluences` or clips. Blend between shapes on a single mesh.

## 20. Level of detail and culling

`LOD` object switching meshes by distance. Visualise with `Box3Helper` or distance readout. Mention frustum culling default behaviour; optional `frustumCulled = false` demo.

## 21. `CSS2DRenderer` overlay

3D scene plus HTML labels anchored to objects. Compare with canvas-only text (`TextGeometry` / troika or sprite). Trade-offs: DOM integration vs performance and depth testing.

## 22. Clipping, fog, and scene atmosphere

`renderer.clippingPlanes` and per-material `clipIntersection`. Linear and exponential `Fog` / `FogExp2`. Combine for sectional views or depth cueing without post-processing.

## 23. Resource lifecycle and disposal

Explicit `dispose()` on geometries, materials, textures. `renderer.info` (memory, render lists). Demonstrate leak vs clean teardown on scene swap. Patterns for hot-reloading experiment scenes in this repo.

## 24. Multiple viewports and scissor rendering

Single renderer, multiple regions: `setViewport`, `setScissor`, `setScissorTest`, render same or different cameras. Picture-in-picture or editor-style quad views.

## 25. WebGPU renderer path (optional capstone)

Parallel entry using `WebGPURenderer` (where supported): same minimal scene as step 1, note API deltas, async init, and feature detection fallback to WebGL.

---

## How to use this list

Prompt with the step number, e.g. *"Implement native step 10"* or *"Replace the current demo with curriculum step 5"*. Each implementation should remain a self-contained observable demo unless you ask to accumulate features across steps.
