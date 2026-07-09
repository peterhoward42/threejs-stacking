# ThatOpen topics we need to drill into

This is derived and expanded from the overview that AI produced for Pete during the survey of many three.js potential parent orchestrators.

But this time:
- Making sure we understand the prior overview more deeply
- As a list of things we probably need to explore / validate and try
- The downstream aim is gain confidence on how ThatOpen will produce the UX we want and consolidate the way we define the architecture.

## ThatOpen's main Focus areas

- Engineering models
- metadata
- hierarchy modelling
- scene clipping (topic or them filters)
- user making selections
- property inspection
- relevant workflows
- capable of overcoming GLTF data (low level) that is too large to cope with
  normally 
- handling IFC inputs (high level, building semantic level incl geometry and
  metadata)

## Where the boundary with three.js happens

Or more specifically what coding concepts does ThatOpen have in it, which are not
in three.js itself?

- Thinking in BIM terms 
- Modelling some of the code as globally accessible "services" - regrettably they
  call them Components - the exact opposite of the web front end frameworks' use
  of the term. doh!
- Modelling Worlds - which bundle scene + camera + renderer
- An opinionated data conversion pipeline that starts with BIM oriented file
  formats like IFC. And then over multiple steps, mashes and munges it
  into lower level machine readable data models that are designed to be as
  closely matched as possible to what three.js will need. What comes out the
  other end is the "runtime" format.
- A multi-threading web-worker architecture so that the step above can be 
  run across multiple threads and CPU cores to speed things up and keep the UI
  responsive while grinding is going on elsewhere.
- Ray casting based user object selection but crucially in the BIM model space.
- A large set of UX necessities but with which you interact in BIM model terms.
  Such as: measurements, dimensions, property panels, markers, outline.

# What three.js is left to do

The section above is all about doing stuff we need to do, closer conceptually to
our product domain - which obviously three.js doesn't know about.

But three.js is the last leg - moving ever closer to the GPU and copes with the
following:

WebGL renderer, Object3D scene graph, materials, lights, cameras, and shader 
concepts.

But the puppet master telling it to do those things and with what is ThatOpen




