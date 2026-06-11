/** Single source of UI copy for the curriculum chooser and step headers. */

export const NOTES_EXCERPT_COUNT = 3;

export const CURRICULUM = [
  {
    step: 1,
    title: 'Scene graph and transforms',
    description:
      'Nested groups rotate at different rates. Local transforms are relative to the parent; world values compound down the chain.',
    notes: [
      'The object scene supports parent/child relationships; each node has a transform.',
      'Transforms are inherited down the tree — the demo’s kinematic chain compounds rotations.',
      'Each node adopts a transform to position and orient it in its parent’s space.',
      'World matrices compound down the chain; local vs world readouts show when updateMatrixWorld matters.',
    ],
  },
  {
    step: 2,
    title: 'Cameras and projection',
    description:
      'The same scene through PerspectiveCamera (left) and OrthographicCamera (right). Adjust fov, near/far, and ortho frustum size to see how projection changes depth cues.',
    notes: [
      'Position the camera, define frustum, choose perspective vs orthographic.',
      'Near/far planes clip along the view axis (distinct from frustum culling).',
      'Field of view and orthographic frustum height change depth cues on the same scene.',
      'CameraHelper wireframes make each frustum visible in world space.',
    ],
  },
  {
    step: 3,
    title: 'Built-in geometry and BufferGeometry anatomy',
    description:
      'Gallery of primitive geometries with one material each. Select a mesh to inspect attributes (position, normal, uv, index) and colour vertices or normals to reveal structure.',
    notes: [
      'Built-in meshes: box, sphere, cylinder, cone, torus, plane, and more.',
      'Programmatic access to geometric properties per object — position, normal, uv, index.',
      'Lines and text labels appear in later experiments; here the focus is mesh primitives.',
      'Colour modes paint vertices or normals to reveal buffer layout.',
    ],
  },
  {
    step: 4,
    title: 'Material comparison lab',
    description:
      'The same TorusKnot mesh with seven material types in a grid. Toggle wireframe and compare how each responds to scene lighting.',
    notes: [
      'Materials describe appearance; optical properties control how lighting affects each surface.',
      'Smooth reflective surfaces get specular highlights; diffuse surfaces look matt.',
      'MeshBasicMaterial ignores lights; standard/physical materials respond to the scene lighting model.',
      'Wireframe mode exposes tessellation differences across material types.',
    ],
  },
  {
    step: 5,
    title: 'Light types and real-time shadows',
    description:
      'Switch between Ambient, Hemisphere, Directional, Point, Spot, and RectArea lights on the same scene. Shadow maps on the ground plane; tune map size, bias, and directional shadow frustum.',
    notes: [
      'Light the scene programmatically — theatre-style key/fill plus ambient mix.',
      'Directional, point, and spot lights cast real-time shadow maps.',
      'Any mesh with receiveShadow can receive shadows — not only ground planes.',
      'RectAreaLight does not cast shadow maps in WebGL.',
    ],
  },
  {
    step: 6,
    title: 'PBR maps on MeshStandardMaterial',
    description:
      'MeshStandardMaterial map slots on a subdivided box: albedo, normal, roughness, metalness, AO, and subtle displacement. Toggle each map and switch between separate textures vs one packed ORM image (R=AO, G=roughness, B=metalness).',
    notes: [
      'Maps can make a planar surface look like brick — roughness, displacement, detail — without changing geometry.',
      'Rendering-stage detail: the mesh stays a subdivided box; maps drive appearance.',
      'Packed ORM textures (R=AO, G=roughness, B=metalness) reduce texture binds.',
      'Displacement strength needs dense geometry to read clearly.',
    ],
  },
  {
    step: 7,
    title: 'Textures and sampling behaviour',
    description:
      'Image vs canvas `Texture` sources, wrap/repeat/offset/rotation, min/mag filters, anisotropy, and colorSpace (sRGB albedo vs linear data). Includes a live animated canvas texture.',
    notes: [
      'Two pattern sources: programmatic tiling (chessboard) and image-derived tiles.',
      'Wrap, repeat, offset, rotation, and filters change sampling without new geometry.',
      'sRGB vs linear colorSpace matters for albedo vs data textures.',
      'Textures need not be static — animate canvas redraws frame-wise.',
    ],
  },
  {
    step: 8,
    title: 'Asset loading with GLTFLoader',
    description:
      'Load a `.glb` from `common/assets/`, traverse meshes and materials, swap a material live, and drive embedded clips with `AnimationMixer`. Shows loading progress and error handling.',
    notes: [
      'glTF is the format spec; GLB is its binary container — roughly “JPEG for 3D assets”.',
      'Encapsulates geometry, materials, textures, scene graph, and animations in one compact file.',
      'Becoming the de facto standard for web 3D delivery.',
      'Demo loads brain-stem.glb — traverse meshes/materials, swap materials, play embedded clips.',
    ],
  },
  {
    step: 9,
    title: 'OrbitControls and the render loop',
    description:
      '`requestAnimationFrame` with `Clock` delta drives simulation; `OrbitControls` handles orbit, zoom, and pan with damping. Resize updates camera and renderer — the pattern reused in later steps.',
    notes: [
      'requestAnimationFrame is the browser per-frame hook; delta time comes from THREE.Clock.',
      'OrbitControls (addon) handles orbit, zoom, pan, and damping — not core three.js.',
      'Separate simulation animation and controls.update() from renderer.render() in one loop.',
      'The demo runs orbiting rings alongside camera controls on the same rAF tick.',
    ],
  },
  {
    step: 10,
    title: 'Raycasting and mesh picking',
    description:
      '`Raycaster` from pointer NDC: hover highlight, click selection, and face index readout. Compare hits on individual meshes vs `InstancedMesh` (`instanceId`).',
    notes: [
      'Conceptual ray from the camera into the scene; Raycaster is built in.',
      'Hover highlight and click selection are app logic — emissive tint or per-instance colour.',
      'Compare picking regular Mesh (faceIndex) vs InstancedMesh (instanceId).',
      'Pick-target toggles show nearest-hit behaviour when both are enabled.',
    ],
  },
  {
    step: 11,
    title: 'Keyframe animation with AnimationMixer',
    description:
      'Procedural `AnimationClip` + `KeyframeTrack` on transforms and morph influences; loaded glTF clips via `AnimationMixer` and `AnimationAction` with loop modes and crossfade.',
    notes: [
      'Orchestration system for timed transforms, morphing, and cross-fades.',
      'Procedural clips from VectorKeyframeTrack and NumberKeyframeTrack on morph influences.',
      'AnimationMixer drives glTF clips with loop modes and time scale.',
      'Crossfade duration blends weights between concurrent actions.',
    ],
  },
  {
    step: 12,
    title: 'InstancedMesh at scale',
    description:
      'Thousands of identical meshes via `InstancedMesh` with per-instance `setMatrixAt` / `setColorAt`. Toggle naive cloning to contrast draw calls and frame time.',
    notes: [
      'Reuse performance architecture for thousands of identical instances.',
      'InstancedMesh moves per-instance work outside the naive per-mesh draw loop.',
      'setMatrixAt / setColorAt update GPU buffers; instanceMatrix.needsUpdate flags changes.',
      'Naive clone mode contrasts render.calls and frame time at the same visual density.',
    ],
  },
  {
    step: 13,
    title: 'Procedural custom BufferGeometry',
    description:
      'Build geometry from scratch with `Float32Array` attributes, `BufferAttribute`, optional indexed drawing, and `computeVertexNormals`. Parametric surface, terrain heightfield, and icosahedron from first principles.',
    notes: [
      'Drop to a lower level: pump vertex coordinates into buffer attributes.',
      'Good for algorithmic shapes — parametric surfaces, heightfields, hand-built polyhedra.',
      'Indexed vs non-indexed drawing and computeVertexNormals change topology and shading.',
      'Live position updates can recompute normals each frame on the parametric preset.',
    ],
  },
  {
    step: 14,
    title: 'ShaderMaterial essentials',
    description:
      'Custom GLSL via `ShaderMaterial`: `time` and `color` uniforms, UV/normal varyings from attributes, procedural colouring and wave displacement — using Three.js `#include` shader chunks, not `onBeforeCompile`.',
    notes: [
      'Custom GLSL vertex and fragment shaders via ShaderMaterial.',
      'Pass values through uniforms — time, colour, stripe scale, wave amplitude.',
      'Fragment shader procedural colouring from UV; vertex shader can displace vertices.',
      'CPU geometry unchanged under vertex displacement — deformation is GPU-side.',
    ],
  },
  {
    step: 15,
    title: 'Post-processing with EffectComposer',
    description:
      'Multi-pass pipeline: `RenderPass` → optional `OutlinePass` / `UnrealBloomPass` / color grading → `OutputPass` → `FXAAPass`. Toggle passes live and compare against a direct `renderer.render`.',
    notes: [
      'Intervene after the scene renders with programmatic post passes.',
      'EffectComposer chains RenderPass, bloom, outline, grading, and FXAA.',
      'Toggle passes live; compare against direct renderer.render for baseline.',
      'Useful for colour tuning, bloom, and screen-space effects without shader rewrites.',
    ],
  },
  {
    step: 16,
    title: 'Image-based lighting and environments',
    description:
      '`PMREMGenerator` pre-filters HDRIs and cube maps into `scene.environment`. Toggle IBL, swap `CubeTexture` vs `RGBELoader` sources, and compare metal/rough spheres with and without environment reflections.',
    notes: [
      'Shiny surfaces show distant light reflections — environment maps simulate that phenomenon.',
      'Provide an HDRI or cube map, pre-filter with PMREM, assign to scene.environment.',
      'Omnidirectional reflected lighting, not a single directional key.',
      'Quite realistic on metal/rough PBR materials when IBL is enabled.',
    ],
  },
  {
    step: 17,
    title: 'Render targets and offscreen rendering',
    description:
      '`WebGLRenderTarget` feeds from secondary cameras: a security monitor in-scene, a floor mirror, and a corner mini-map composited with an orthographic fullscreen quad.',
    notes: [
      'Multiple cameras on one scene — security-monitor pattern.',
      'WebGLRenderTarget captures offscreen passes for in-scene displays and mirrors.',
      'Secondary camera renders into a texture sampled on meshes or fullscreen quads.',
      'Same scene graph, different viewpoints — composited back into the main view.',
    ],
  },
  {
    step: 18,
    title: 'Lines, edges, and points',
    description:
      'Compare `Line`, `LineSegments`, and `LineLoop` draw modes; `EdgesGeometry` crease overlays on filled meshes; `Points` with `PointsMaterial` size attenuation.',
    notes: [
      'Fine 3D lines via Line, LineSegments, and LineLoop draw modes.',
      'EdgesGeometry overlays crease lines on otherwise solid meshes.',
      'PointsMaterial with size attenuation renders point clouds from vertex data.',
      'Lines complement filled primitives from experiment 3.',
    ],
  },
  {
    step: 19,
    title: 'Morph targets',
    description:
      '`BufferGeometry.morphAttributes.position` (and optional normals) on one mesh; blend shapes via `morphTargetInfluences` or `NumberKeyframeTrack` clips.',
    notes: [
      'Alternate vertex positions stored on the same mesh (morphAttributes.position).',
      'Blend with morphTargetInfluences — squash, stretch, bulge, wave presets.',
      'Base geometry buffer unchanged; GPU interpolates toward target shapes.',
      'AnimationClip keyframes can drive the influence array over time.',
    ],
  },
  {
    step: 20,
    title: 'Level of detail and culling',
    description:
      '`LOD` switches child meshes by camera distance; `Box3Helper` shows bounds. Compare default `frustumCulled` with forced off-screen draws.',
    notes: [
      'LOD reduces cost for detail too fine to see at distance.',
      'Each node can hold finer/coarser child meshes with distance thresholds.',
      'Empty mesh variants often represent very far distances.',
      'frustumCulled skips draw calls outside the view frustum — contrast with forced draws.',
    ],
  },
  {
    step: 21,
    title: 'CSS2DRenderer overlay',
    description:
      'HTML labels anchored to objects via `CSS2DObject`, compared with canvas `Sprite` text. Toggle depth testing and an occluder to see DOM vs WebGL trade-offs.',
    notes: [
      'Two label paths: CSS2D (HTML DOM) vs Sprites (WebGL billboards).',
      'CSS2D keeps elements screen-parallel; three.js updates CSS transforms after render.',
      'CSS2D does not participate in GPU depth testing — labels stay visible behind geometry.',
      'Sprites are scene nodes with depthTest — they hide behind occluders like meshes.',
    ],
  },
  {
    step: 22,
    title: 'Clipping, fog, and scene atmosphere',
    description:
      '`renderer.clippingPlanes` and per-material `clipIntersection` for sectional views. Linear `Fog` and exponential `FogExp2` for depth cueing without post-processing.',
    notes: [
      'Global clipping planes hide geometry behind a plane — useful for cross-sections.',
      'Per-material clipIntersection limits clipping to selected materials.',
      'Linear Fog and FogExp2 increase density with depth — spatial cue without post-processing.',
      'Fog implies distance; clipping hard-cuts — complementary atmosphere tools.',
    ],
  },
  {
    step: 23,
    title: 'Resource lifecycle and disposal',
    description:
      'Swap disposable demo scenes with or without `dispose()` on geometries, materials, and textures. Read `renderer.info.memory` and render lists; mirrors the hot-reload teardown in `App.svelte`.',
    notes: [
      'GPU retains orphaned shaders, textures, and buffers unless explicitly disposed.',
      'Accumulated resources degrade performance, reliability, and bug surface area.',
      'dispose() on geometry, material, and texture when tearing down a scene.',
      'renderer.info.memory helps verify leaks during hot swaps and reloads.',
    ],
  },
  {
    step: 24,
    title: 'Multiple viewports and scissor rendering',
    description:
      'One WebGLRenderer, many regions: `setViewport`, `setScissor`, and `setScissorTest` drive quad editor views, picture-in-picture, or a single full-screen pass with different cameras.',
    notes: [
      'One canvas, many regions via setViewport / setScissor on a single renderer.',
      'Single DOM node participates in page layout like any other element.',
      'Alternative: multiple renderer instances — independent DOM nodes and GPU contexts.',
      'Multi-renderer path costs more memory and CPU; caution on mobile devices.',
    ],
  },
  {
    step: 25,
    title: 'WebGPU renderer path',
    description:
      'Same scene-graph arm as step 1, rendered through `WebGPURenderer`: async `init()`, `navigator.gpu` probing, and automatic fallback to a WebGL2 backend when WebGPU is unavailable.',
    notes: [
      'WebGL2 is the dominant platform standard today; WebGPU is the likely successor.',
      'GPU hardware compatibility adds device lag on top of software/API lag.',
      'WebGPU knowledge and third-party package support are still catching up.',
      'Architect for WebGPU with automatic WebGL2 fallback — this demo shows that path.',
    ],
  },
];

const byStep = new Map(CURRICULUM.map((entry) => [entry.step, entry]));

export function metaForStep(step) {
  const entry = byStep.get(step);
  if (!entry) {
    throw new Error(`Unknown curriculum step: ${step}`);
  }
  return {
    step: entry.step,
    title: entry.title,
    description: entry.description,
  };
}

export function notesForStep(step) {
  const entry = byStep.get(step);
  if (!entry) {
    throw new Error(`Unknown curriculum step: ${step}`);
  }
  return entry.notes;
}

export function notesExcerptForStep(step, count = NOTES_EXCERPT_COUNT) {
  const notes = notesForStep(step);
  return notes.slice(0, Math.min(count, notes.length));
}

export function hasMoreNotes(step, count = NOTES_EXCERPT_COUNT) {
  return notesForStep(step).length > count;
}
