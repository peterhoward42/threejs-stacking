# Capturing - the results of the native experiments

## Role

- I started by capturing the main capabilities of three.js (native) in high level conceptual terms
- Then I created a set of experiments to help me understand those capabilities and bring them to life

- Each experiment in ./experiments/native deals with one of those capabilities and renders something that shows it,
  along with some summary text - and UI controls to play with it
- The idea is for the learning process to be:
    - Name the concept
    - See it visually being demonstrated
    - Play with the controls available in the UI
    - Scan the corresponding code to see that view of it
- My aim is to build a mental model of what three.js can do so that when I design a stack for an app built around three.js, I know what it is capable of and thus what we could aspire to use, but also to get a clearer view about what the stack into which I integrate three.js must bring to the party itself, and using what coupling and interfacing.

##  The scene as graph (experiment 1)

- The object scene supports the notion of parent child relationships
- Each node adopts a transform to position and orient it
- These transforms are implicitly inherited down the parent child tree
- The demo shows a nested kinematic chain (root → arm → wrist → cube) each rotating at a different rate — inherited transforms compound down the tree

##  The Camera / Frustum / Projection model (experiment 2)

- These follow well-trodden paths
- You position and point your camera in the scene
- You define its field of view and similar using a frustum
- And choose a projection model from perspective vs orthographic
- Near and far planes clip what the camera can see along its view axis — only geometry
  between those distances is drawn. (Separate from frustum culling of objects behind you.)

##  Built in objects (experiment 3)

- Cubes, spheres, cylinders, cones, torus, plane (and others). Lines crop up in
  experiment 18; text/labels in experiment 21.
- Programmatic access to geometric properties of each object — position, normal, uv, index

##  Material and lighting interaction model (experiment 4)

- You describe the appearance of object facets using the "material" abstraction.
- The material includes optical phenomena properties that affect how lighting
  influences its appearance.
- The most obvious is that smooth reflective surfaces get spotlit high points,
  whereas diffuse surfaces don't and look matt.

## Light types and shadows (experiment 5)

- You light the scene programmatically like you would a theatre plus ambient non
  directional lighting mixed in
- The visual consequences are very clear
- It can also cast shadows (in real time if animated). Any mesh with receiveShadow
  can receive them — not just a ground plane. The demo only enables that on the floor,
  but objects could shadow each other. RectAreaLight does not cast shadow maps in WebGL.

## Physically based material maps (PBR) (experiment 6)

- You can define maps that, for example, make a planar surface look like a brick wall —
  complete with roughness and even subtle displacement depressions for mortar lines.
  But all this on a surface that is planar as far as the geometric modelling is
  concerned. I.e. it is purely a rendering-stage phenomenon.

## Textures (experiment 7)

- You can apply two different types of distributed surface pattern
- One is a programmatically defined tiling - like a chess board
- The other is derived from an image - which is then applied as tiles
- Textures need not be static - you animate them frame-wise (conceptually 
  like CSS animations)

## GLB files (experiment 8)

- glTF is the format spec; GLB is its binary container — roughly "JPEG for 3D assets"
- It encapsulates geometry, materials, textures, scene graph, and animations
- Very compact
- Becoming de facto standard for the web
- Demo loads brain-stem.glb — traverse meshes/materials, swap materials, play embedded clips

## OrbitControls and the render loop (experiment 9)

- requestAnimationFrame() is the browser's per-frame hook — you schedule your next tick there
- Delta time comes from THREE.Clock, not from rAF itself
- Camera orbit, zoom, pan, and damping come from OrbitControls (an addon) — not core three.js
- The demo also runs separate simulation animation (orbiting rings of boxes) in the same loop —
  pattern for separating controls.update(), simulation, and renderer.render()

## Ray casting, picking and selection (experiment 10)

- It starts with a conceptual ray from the camera (your eye) into the scene hitting a mesh
- Raycaster is built in; hover highlight and click selection are not — the demo implements those
  (emissive colour on meshes, per-instance colour on InstancedMesh)
- Compares picking regular Mesh vs InstancedMesh (instanceId) — see questions at the end

## Keyframe animation composer (experiment 11)

- A bit like composing part of an animated movie
- It's an orchestration system where you specify timed relationships between
  transformations, morphing, etc.
- It will compose them together with cross fades

## InstancedMesh clones (experiment 12)

- This is a re-use performance architecture
- It's for when you have thousands of identical instances of a thing in the 
  scene
- The idea is that, if it knows that to be so, it can move some stuff outside of
  the loop.

## Procedural (algebraic) meshes / buffers  (experiment 13)

- This is a way of dropping down to a lower level to define geometry. 
- Good for shapes defined with an algorithm - like a wave rippling out.
- It's called a Buffer because it's just a container you pump full of vertex
  coordinates.

## ShaderMaterial essentials (experiment 14)

- Custom GLSL vertex and fragment shaders via ShaderMaterial
- You pass values in through "uniforms" — time, colour, stripe scale, wave amplitude, etc.
- Fragment shader can do procedural colouring (stripes, ripples from UV)
- Vertex shader can displace vertices (wave preset) — looks deformed but CPU geometry is unchanged

## Render post processor pass (experiment 15)

- Not sure what the point of this one is
- You can intervene after it has rendered with programmatic effects
- Like colour tuning and bloom effect

## Lighting using precomputed image reflections (experiment 16)

- Consider that a shiny sphere often shows reflections of distant light sources
  like windows...
- This is a hack simulation of that full optical phenomenon
- You provide an environment image (cube map or HDRI), pre-filter it (PMREM), and assign
  it to scene.environment — omnidirectional reflected lighting, not a single direction
- Quite realistic on metal/rough PBR materials

## Auxiliary / additional cameras (experiment 17)

- Like the security guard keeping an eye of multiple CCTV cameras
- Except that they are all looking at the same scene
- But from different view points
- For example a pseudo live reflection in the floor or a mirror-monitor on the
  wall

## Lines, points and edges (experiment 18)

- You can put fine 3d lines into the scene
- You can also switch on the rendering for otherwise hidden artefacts on
  meshes. Like the lines that form the facet edges. Or the point cloud extracted
  from all of those edges.

## Morph targets (experiment 19)

- Alternate vertex positions stored on the same mesh (morphAttributes.position)
- Blend between them with morphTargetInfluences — squash, stretch, bulge, wave presets
- The base geometry buffer does not change; the GPU interpolates toward target shapes
- Can also be driven by AnimationClip keyframes on the influence array


## Level of detail (LOD) and Culling (experiment 20)

- LOD is a way to optimise computational cost for needless rendering, and to
  avoid showing details that too fine to engage with.
- You can provide each node in the scene graph hierarchy with finer or coarser
  meshes and assign distance-to-camera bindings for which to use
- Nb. You often have an empty mesh variant for very large distances

## Labels, DOM elements and sprites (experiment 21)

- This is how you put text and labels into the scene
- There are two types: CSS2D (HTML DOM elements) vs. Sprites (Three.js native)
- CSS2D is way to put a perfectly ordinary HTML DOM element of any kind in. 
  	- This is standard RFC WEB standards stuff - nothing to do with three.js
	- But, three.js offers to maintain references to these DOM elements that
	  couple them into nodes in the 3D node hierarchy.
	- It promises to keep the position of the element with that of the 3d node,
	  BUT - the contract is that it will remain in a plane parallel to the
	  screen, regardless of the associated 3D node's rotational orientation.
	- three.js takes responsibility post 3D scene render to adapt the CSS
	  transform on the DOM object to make this happen
	- CSS2D does NOT participate in GPU depth testing — labels stay visible even
	  behind geometry (the occluder wall demo makes this obvious)
- Sprites are first class 3D nodes. They are a rectangle (actually two triangles)
  that you render an image on to. (Which could be an image of some text) - with
  depthTest they hide behind objects like any mesh. Think billboard text or a
  monitor face texture in the scene.

## Clipping planes and "fog"  (experiment 22)

- Clipping planes
	-  A global 3D plane that hides everything "behind" it. Not really hides - it
	   doesn't exist for the purposes of the view
	-  A great way to implement a cross section - like cutting through a building
	-  However they are either of global applicability - and clip every object in
	   the scene at that plane. Or they can be bound to a particular "material"
	   and then only affect things that use that material.

- Fog
	-  You can define some fog that gets visually denser as the depth into the
	   scene increases. It creates the illusion of detail at greater depths
	   "disappearing into the fog". Can be useful as an alternative to clipping to
	   imply what is of interest and what is not - without losing the spatial
	   clues from the now-blurred fogged stuff.

## Resource lifecycle and disposal (experiment 23)

- This is ostensibly only about memory and performance housekeeping.
- But it is necessary in real life
- Because the GPU retains orphaned shaders, textures etc. And these accumulate.
- And these degrade several things:
	- Performance
	- Reliability
	- Bug probability

## Multiple viewports (experiment 24)

- This is about having more than one 3D view on the page
- three.js provides built in support — setViewport / setScissor on one canvas to
  arrange multiple regions (quad editor, picture-in-picture). The demo uses this path.
- The key thing with that is that there is one container and it occupies one 
  DOM node space in the web page - and thus takes part in the pages layout just
  like any other DOM node
- But you can also do it yourself for more flexibility
- You just instantiate more than one three.js containers.
- Each of those is an independent DOM node as far as the web page is concerned
- And they are unrelated when it comes to how they use the GPU
- The implication is that you have to manage the shared data/ config etc.
  yourself in your layer outside.
- And it consumes much more GPU and system memory, and computational load.
- The latter something to be cautious about on phones.

## Old or new web standards conundrum / compatibility (experiment 25)

- 3D in the web has been and remains a rapidly changing and advancing thing.
- Alongside what GPUs and web standards bring to the party
- The fact that GPUs are part of the compatibility story is key, it means we get hardware (i.e. device) 
  compatibility lag as well as software compatibility lag. 
- There is one dominant platform standard right now WebGL2
- But also a newer one that will likely take over WebGPU
- The amount of "knowledge out there" for WebGPU is scarcer than for WebGL2 -
  which affects speed of development (stack overflow / LLMs), and would make
  hiring engineers that know it deeply difficult (arguably we don't need that knowledge ourselves)
- But WebGPU has features we may miss
- Also crucially - the third party packages we end up integrating with may not
  have caught up yet.
- So we are stuck with only one viable path - which is to architect for the 
  new one from day one, but with automatic, built in fallback for the old one.
- This experiment number 25 demonstrates that.

## Questions arising

- Nothing covered these:
  -  Built in UI affordances for the user — gesture hints, on-screen cues for zoom/pan/rotate,
     reset-view buttons, etc. OrbitControls (experiment 9) wires up the interaction; the chrome
     around it is presumably our stack's job outside three.js
  -  Composing the scene graph (authoring workflow — experiment 1 builds one in code only)
  -  Importing the scene graph (apart from GLB files)
- Need to know more about raycasting chain in the context of a hierarchical scene
  model?
  -  You'd likely want your highlighted object to be a few nodes up the parent child hierarchy?
- Who or what makes the level-of-detail LOD mesh variants?
- Are there 3rd party packages for generating BufferGeometries?

