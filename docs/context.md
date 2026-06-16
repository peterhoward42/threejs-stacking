# Preliminary survey working outwards from the seed of 3js

## Context

A potential client currently uses AutoCAD-based tooling as a demonstration platform for visualising an industrial facility. The longer-term goal is a scalable web-based architecture capable of supporting a production system and future scope expansion.

The envisioned application is more than a static 3D model. It combines:

- A representation of a real-world industrial plant.
- Hierarchical navigation across multiple physical scales.
- Selection and interaction with engineering assets in situ.
- Overlay of temporal and transient phenomena, such as methane leak plumes.
- Integration with operational and analytical data sources.

The central question is therefore not simply how to render a 3D scene, but how to build a digital-twin-style application that happens to use 3D graphics as its primary interface.

---

## Key Architectural Observation

The primary challenge is unlikely to be graphics rendering.

Most effort is expected to lie in:

- Asset hierarchy and metadata management.
- Geometry conversion and asset pipelines.
- Selection and interaction models.
- Drill-down navigation.
- Streaming and level-of-detail management.
- Representation of transient events and analytical overlays.

Rendering is only one layer of a larger system.

---

## three.js Assessment

three.js emerged as an early candidate because it is the dominant general-purpose browser 3D library.

### Strengths

- Mature and widely used.
- Framework-agnostic.
- GPU-accelerated through WebGL and emerging WebGPU support.
- Well suited to custom interaction models.
- Capable of rendering large and complex scenes when properly engineered.
- Strong ecosystem and industry adoption.

### Limitations

- Primarily a rendering engine and scene graph.
- Does not provide a complete digital-twin architecture.
- Does not inherently solve asset hierarchy, metadata, streaming, or interaction problems.
- Large CAD-derived models typically require substantial preprocessing.

The most important conclusion is that three.js should be viewed as a rendering foundation rather than a complete application platform.

---

## Geometry Model

three.js operates in the rendering domain rather than the CAD domain.

CAD systems typically work with:

- B-Rep solids.
- NURBS surfaces.
- Extrusions and revolutions.
- Parametric features.

three.js ultimately works with:

- Meshes.
- Vertices.
- Triangles.
- Materials.
- Transforms.

Most industrial geometry would therefore be expected to follow a pipeline resembling:

CAD/BIM → Conversion → glTF → three.js

The browser generally receives tessellated geometry rather than the original engineering representation.

---

## Scene Graph and Asset Model

three.js includes a scene graph for organising rendered objects.

However, industrial systems normally require a second parallel model:

### Render Graph

Represents geometry and rendering structure.

### Asset Graph

Represents engineering meaning:

- Sites
- Areas
- Systems
- Equipment
- Valves
- Sensors

These hierarchies often differ.

The application is responsible for maintaining mappings between rendered objects and engineering assets.

---

## Selection and Interaction

Selection is typically performed through ray-based picking.

However, industrial systems rarely rely on raw triangle selection alone.

Common techniques include:

- Semantic asset selection.
- Selection priorities.
- Invisible selection proxies.
- Layer filtering.
- Candidate lists for ambiguous picks.
- Drill-down workflows.

The practical goal is to select meaningful assets rather than geometry.

A user expects to select:

"Valve V-204"

rather than:

"Mesh #431"

---

## Performance Considerations

Browser-based 3D is not inherently low performance.

Rendering workloads are largely delegated to the GPU through WebGL or WebGPU.

Additional performance techniques include:

- Geometry instancing.
- Level-of-detail systems.
- Asset streaming.
- Worker threads.
- WASM components.
- GPU shaders.

Performance is usually determined more by architecture than by the choice of rendering library.

---

## Relevant Ecosystem Components

### three.js

Recommended baseline technology for evaluation.

Licence: MIT

### Threlte

Svelte integration layer for three.js.

Relevant because existing development experience is centred on Svelte.

Licence: MIT

### React Three Fiber

Widely used React abstraction over three.js.

Strong ecosystem but implies adoption of React.

Licence: MIT

### That Open Engine

Digital-twin and BIM-oriented tooling focused on metadata, hierarchy, selection and engineering workflows.

Open-source core with commercial ecosystem.

### xeokit

Engineering and BIM viewer focused on large models and metadata-driven interaction.

Open-source technology with commercial offerings around it.

### CesiumJS

Particularly relevant for large-scale scene streaming and hierarchical level-of-detail management.

Apache 2.0 licence.

Commercial cloud services are optional.

---

## Current Working View

At this stage, the most productive line of investigation appears to be:

1. Understand the source geometry and asset data.
2. Understand hierarchy, drill-down and interaction requirements.
3. Evaluate asset and metadata architecture.
4. Evaluate transient-event visualisation approaches.
5. Use three.js as the baseline rendering layer.
6. Investigate digital-twin and BIM ecosystems for reusable architectural patterns.

The current evidence suggests that the dominant architectural risks lie above the rendering layer rather than within it.