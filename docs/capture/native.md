# Capturing - the results of the native experiments

## Role

- I started by capturing the main capabilities of three.js (native) in high level conceptual terms
- Then I created a set of experiments to help me understand those capabilities and bring them to life

- Each experiment in ./experiments/native deals with one of those capabilities and renders something that shows it,
  along with some summary text - and UI controls to play with it
- The idea is for the learning phenomenon to be:
    - Name the concept
    - See is visually being demonstrated
    - Play with the controls available in the UI
    - Scan the corresponding code to see that view of it
- My aim is to build a mental model of what three.js can do so that when I design a stack for an app built around three.js, I know what it is capable of and thus what we could aspire to use, but also to get a clearer view about what the stack into which I integrate three.js must bring to the party itself, and using what coupling and interfacing.

##  The scene as graph (experiment 1)

- The object scene supports the notion of parent child relationships
- Each node adopts a transform to position and orient it
- These transforms are implicitly inherited down the parent child tree
- The demo shows a set of ancestors orbiting their parent and differing animation rates

##  The Camera / Frustum / Projection model (experiment 2)

- These follow well-trodden paths
- You position and point your camera in the scene
- You define its field of view and similar using a frustum
- And choose a projection model from perspective vs orthographic
- Rather than relying on the assumption that you can't see what is behind you,
  and that some things are too distant to be useful - you decide those things two
  using a near and far plane. They filter what is visible to the space between
  those planes.

##  Built in objects (experiment 3)

- Cubes, spheres, cylinders, cones (and others). We see lines crop up in a 
  later experiment. (Not seen any text yet)
- Programmatic access to geometric properties of each object

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
- It can also cast shadows (in real time if animated) - but I think this is
  limited to being only onto the "ground plane" - i.e. not on to other objects.

## Physically based material maps (PBR) (experiment 6)

- You can define a map that, for example, makes a planar surface look like a
  brick wall - complete with roughness and even depressions for the mortar lines.
  But all this on a surface that is planar as far as the geometric modelling is
  concerned.

## Textures (experiment 7)

- You can apply two different types of distributed surface pattern
- One is a programmatically defined tiling - like a chess board
- The other is derived from an image - which is then applied as tiles
- Textures need not be static - you animate them frame-wise (conceptually 
  like CSS animations)

## GLB files (experiment 8)

- GLB is to 3D what JPEG is to images
- It encapsulates all of geometry, materials, textures, and animations
- Very compact
- Becoming defacto standard for for web
- Amazingly impressive demo


## Phase-locked movement (experiment 9)

- The entry point for sync is requestAnimationFrame()
- I.e. your callback entry point for specifiying the next iteration's delta
- It gives you more than config. It includes a time-advancing orchestration 
  for things like orbiting and panning. And this includes damping.
  panning

## Ray casting, picking and selection (experiment 10)

- It starts with a conceptual ray into the scene hitting a mesh
- There is built in realtime / ephemeral highlighting as you do so
- Plus built in selection and steady-state highlighting of what is selected
- BUT the demo uses only built in object types - which raises questions - see
  questions at the end

## Keyframe animation composer (experiment 11)

- A bit like composing part of an animated movie
- It's an orchestration system where you specify timed relationships between
  transformations, morphing, etc.
- It will compose them together with cross fades


## InstancedMesh clones (experiment 12)

- This is a re-use performance architecture
- It's for when you have thousands of idential instances of a thing in the 
  scene
- The idea is that, if it knows that to be so, it can move some stuff outside of
  the loop.


## Procedural (algebraic) meshes / buffers  (experiment 13)

- This is a way of dropping down to a lower level to define geometry. 
- Good for shapes defined with an algorithm - like a wave rippling out.
- It's called a Buffer because it's just a container you pump full of vertex
  coordinates.

## Dynamic Shading (experiment 14)

- You can give a material a "uniform" to wear.
- Like repeated striped sections
- Then give it timed transitions for colour, UV normal, and wave translations in
  the parametric space of the surface.


## Render post processor pass (experiment 15)

- Not sure what the point of this one is
- You can intervene after it has rendered with programmatic effects
- Like colour tuning and bloom effect

## Lighting using precomputed image reflections (experiment 16)

- Consider that a shiny sphere often shows reflections of distant light sources
  like windows...
- This is a hack simulation of that full optical phenomenenom
- You provide an image to represent the reflection and specify in which direction
  it "shines" from.
- Quite realistic


## Auxilliary / additional cameras (experiment 17)

- Like the security guard keeping an eye of multiple CCTV cameras
- Except that they are all looking at the same scene
- But from different view points
- For example a psuedo live reflection in the floor or a mirror-monitor on the
  wall


## Lines, points and edges (experiment 18)

- You can put fine 3d lines into the scene
- You can also switch on the rendering for otherwise hidden artefacts on
  meshes. Like the lines that form the facet edges. Or the point cloud extracted
  from all of those edges.



## Questions arising

- Haven't seen any text in the scene yet?
- Need to know more about raycasting chain in the context of a hierarchical scene
  model?
- Not yet seen how you get meshes in from outside?
- Are there 3rd party packages for generating BufferGeometries?
