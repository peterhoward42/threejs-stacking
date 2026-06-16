# Down-selection: BIM viewer stacks

## Purpose

This report records the down-selection reasoning for the next phase of experiments in this repo. It follows the package surveys in [`docs/planning/catalogue-of-third-party-packages.md`](../planning/catalogue-of-third-party-packages.md) and the client brief in [`docs/context.md`](../context.md).

The question is not which rendering library to use — three.js remains the baseline for native learning and for stacks that build on it. The question is which **third-party BIM / engineering viewer platform** deserves focused coding experiments next, and whether any other package belongs at the same decision tier.

---

## Client context (what the choice must serve)

The envisioned application is a digital-twin-style facility viewer, not a static 3D demo. Core requirements include:

- Representation of a real-world industrial plant.
- Hierarchical navigation across physical scales.
- Selection and interaction with engineering assets in situ.
- Overlay of temporal and transient phenomena (e.g. methane leak plumes).
- Integration with operational and analytical data sources.

The client currently uses AutoCAD-based demonstration tooling. The dominant architectural risks lie **above** the rendering layer: asset hierarchy, metadata, conversion pipelines, selection models, streaming/LOD, and analytical overlays.

Two packages in the catalogue address the same class of problem — **large AECO models in the browser with metadata-driven interaction** — at a depth that raw three.js does not:

| Package | Position in stack |
|---------|-------------------|
| **That Open Engine** | BIM/digital-twin layer **on top of** three.js |
| **xeokit** | Standalone WebGL BIM engine (**not** a three.js layer) |

Both are the obvious next dig. This report states how to choose between them, what they do not solve, and whether a third contender belongs at the same tier.

---

## Comparative assessment: That Open Engine vs xeokit

### Shared ground

Both fit when:

- Primary data is building or infrastructure geometry with per-element metadata.
- Users need viewer workflows: sectioning, isolation, measurement, highlighting, filtering by type or property.
- Models are too large for naive single-file GLTF loading.
- The goal is a BIM or digital-twin **viewer shell**, not a general three.js curriculum canvas.

Both require an **offline or server-side conversion step** before the browser loads at scale. Neither directly ingests the client's current AutoCAD workflow; geometry must be exchanged via IFC, glTF, point clouds, or other converted formats.

Both are **framework-agnostic** — a Svelte HUD (this repo's UI constraint) can wrap either bootstrap without adopting React or Threlte.

Both **largely replace** the native curriculum's hand-rolled scene graph, loader callbacks, raycasting, clipping, and disposal patterns for BIM workloads. Conceptual skills from the native steps transfer; step **code** does not (especially for xeokit, which has no `THREE.*` render path).

### Material differences

| Dimension | That Open Engine | xeokit |
|-----------|------------------|--------|
| **Rendering foundation** | three.js (`SimpleRenderer`, `Object3D`, materials, lights) | Own WebGL renderer (SceneJS / xeogl lineage) |
| **Canonical model pipeline** | IFC → **Fragments** (`.frag`, FlatBuffers, `web-ifc`, worker-backed loading) | IFC and others → **XKT** via `xeokit-convert` |
| **Application architecture** | `Components` registry + `Worlds` (scene + camera + renderer bundles) | Data graph, scene representation, viewer (visual state), renderer (pluggable backend) |
| **Time to first viewer** | More assembly; turnkey wrappers exist but are That Open-based (e.g. `@ifc-viewer/core`) | Strong turnkey path via **`xeokit-bim-viewer`** |
| **Federation & precision** | Strong for BIM; multi-model and geospatial are possible but not the central story | Federation, full double-precision coordinates, and point clouds are first-class |
| **BCF / collaboration** | Not a catalogue centrepiece | Documented **BCF Viewpoints** |
| **Import breadth** | IFC-centric (`.frag` idiomatic); GLTF as escape hatch | IFC, glTF, CityJSON, LAS/LAZ, OBJ, STL, 3DXML, dotBIM, XKT, and more |
| **Licensing** | `@thatopen/*` packages **MIT**; `web-ifc` peer **MPL 2.0** (file-level copyleft on parser modifications) | **AGPL-3.0** (network copyleft); commercial licence available from Creoox AG |
| **Fit with this repo** | Preserves three.js as rendering foundation; compounds native curriculum and future Threlte work | Forks the rendering story; native step code does not run on xeokit |

### What the client context adds

**AutoCAD heritage does not resolve the fork.** Both stacks assume converted geometry. IFC is the natural open-BIM exchange path. Industrial plant data may also arrive as glTF, laser scans, or vendor-specific exports — xeokit's broader import surface is a genuine advantage when sources are heterogeneous. That Open is stronger when the bet is **IFC plus rich element metadata and standard BIM workflows** (spatial structure, property sets, classification).

**Neither package delivers the full digital twin.** Hierarchy navigation, semantic selection, sectioning, and property inspection — yes. Asset graph vs render graph ownership, drill-down across physical scales, methane plumes, and live operational feeds — still application concerns. Both provide a **viewer kernel**, not twin orchestration.

**Licence matters even during experimentation.** This repo is not production code, but it evaluates a **potential production architecture**. AGPL on xeokit is the single largest non-technical reason to prefer That Open unless xeokit-specific wins (performance, conversion ergonomics, BCF, federation) prove decisive — or the client accepts a commercial Creoox licence.

---

## Recommendation

### Default path: That Open Engine first

That Open Engine is the recommended **primary** experiment track because it:

1. **Aligns with the repo's architectural bet** — three.js as rendering foundation, native curriculum as shared vocabulary, Svelte HUD without a framework bridge on the canvas.
2. **Preserves skill compounding** — debugging, custom materials, shaders, and non-BIM geometry can coexist in the same three.js scene; skills from `experiments/native` transfer directly.
3. **Carries a production-friendly licence posture** — MIT core with MPL 2.0 only on the IFC parser peer dependency.
4. **Matches the IFC / open-BIM digital-twin viewer pattern** described in the client brief when metadata-driven building or infrastructure models are the primary content.

### Secondary path: xeokit as benchmark, not assumed winner

xeokit remains worth a **focused parallel spike** to empirically validate:

- Conversion pipeline pain (IFC → XKT size, time, fidelity).
- Load time and interaction latency on representative models.
- Turnkey viewer UX (`xeokit-bim-viewer`) vs hand-assembled That Open.
- Whether federation, point clouds, or BCF workflows matter for this client.

Treat **AGPL obligations** and **engine fork from three.js** as explicit exit criteria when interpreting xeokit results — strong performance alone does not override them if production is in scope.

### Suggested experiment design

Run two small, parallel spikes against the **same source asset** (or the same IFC through both pipelines). Scope each to the same five interactions:

1. Orbit / navigate.
2. Pick an element.
3. Isolate / hide by category or selection.
4. Section / clip.
5. Inspect properties (element ID, property sets).

Score on observable criteria, not API elegance alone:

| Criterion | What to observe |
|-----------|-----------------|
| Conversion | Time, output size, fidelity, operational complexity |
| Load | Time to interactive, memory feel |
| Interaction | Pick latency, sectioning UX, tree navigation |
| Extension | How painful is a custom non-BIM overlay (e.g. a plume placeholder)? |
| Repo fit | How much native / shared code carries over? |

That Open spike: `Components` + `World` + `IfcLoader` / `FragmentsManager` + minimal Svelte property panel.

xeokit spike: `xeokit-bim-viewer` or minimal SDK viewer with equivalent interactions.

---

## What neither stack solves (sibling concerns, not competitors)

The catalogue already covers packages that address **adjacent** high-impact concerns. None replaces the That Open / xeokit fork for **in-browser BIM model viewing**, but all matter for the complete client vision:

| Concern | Catalogue entry | Role |
|---------|-----------------|------|
| Methane plumes, sensor fields, heatmaps, flow overlays | **deck.gl** | Analytical / spatiotemporal visualisation over map or site coordinates |
| Globe-scale site context, terrain, hierarchical streaming | **CesiumJS** | Georeferenced facility framing via 3D Tiles, terrain, imagery |
| Declarative scene composition in Svelte | **Threlte** | UI-framework bridge over three.js — relevant later, not instead of a BIM engine |
| 3D Tiles inside an existing three.js app | **3DTilesRendererJS** (not catalogued in depth) | Partial geospatial streaming without adopting Cesium wholesale |

**Practical composition model:** That Open (or xeokit) for the **building / equipment model**; deck.gl and/or Cesium for **site context and transient overlays** — deliberate glue, not built-in fusion.

---

## Fresh scan: other packages at the same impact tier?

For **"large facility model + metadata + interaction in the browser"**, no other open package clearly belongs **beside** That Open and xeokit as a third full alternative worth the same depth of coding experiment **at this stage**. The following are noted so the fork is not treated as a false binary.

### Tier 1 — same problem class (BIM / engineering viewer)

| Candidate | Notes |
|-----------|-------|
| **That Open Engine** / **xeokit** | Primary fork; surveyed in catalogue |
| **IFC-lite** (`ifc-lite`) | Emerging (2025–2026): Rust/WASM core, WebGPU renderer, explicit **three.js integration** path, claims strong parse/tessellation performance. Younger ecosystem; less proven at enterprise scale — **watch list**, not yet experiment-tier |
| **Autodesk Platform Services (Forge Viewer)** | Industry default for web viewing of CAD/AEC-derived models; highly relevant given client AutoCAD heritage. Commercial, cloud-shaped, not aligned with this OSS experiment repo — worth raising in **client** conversations, not the next repo experiment |
| **Flinker IFC Viewer SDK** | Embeddable turnkey IFC viewer (BCF, IDS, federation). Commercial SDK; you integrate a product, not own a stack |
| **`@ifc-viewer/core`** | Production-ready turnkey viewer — **built on That Open**, not a separate engine. Useful as a reference implementation for a That Open spike, not a third stack |

### Tier 2 — different primary job, high impact on the full twin

| Candidate | Notes |
|-----------|-------|
| **Speckle** | Data interoperability and federated multi-tool workflows; viewer is secondary to the platform. Relevant if the problem is cross-application pipelines and collaboration, less if a single converted plant model is the core |
| **CesiumJS** | Already catalogued; site-scale streaming and georeferencing |
| **deck.gl** | Already catalogued; analytical overlays |
| **iTowns** | INRIA; three.js-based geospatial + 3D Tiles; less BIM-metadata mature than That Open |

### Tier 3 — wrong layer for this decision

**React Three Fiber**, **drei**, **Threlte**, **react-three-rapier** — UI composition over three.js. Valuable after or alongside a BIM engine choice; they do not substitute for That Open or xeokit.

---

## Decision summary

| Question | Conclusion |
|----------|------------|
| Is That Open vs xeokit the right next fork? | **Yes** — both attack engineering meaning on large models, which raw three.js leaves entirely to the application |
| Which to dig into first? | **That Open Engine** — repo alignment, three.js compounding, licence posture |
| Is xeokit still worth coding against? | **Yes** — as an empirical benchmark and UX reference, with AGPL and engine fork as explicit constraints |
| Is there a third package at the same tier? | **Not currently** — IFC-lite on watch; APS/Forge relevant commercially; Speckle/Cesium/deck.gl address adjacent twin concerns |
| Does either choice settle the full twin? | **No** — plumes, ops data, and multi-scale site context need sibling layers |

---

## References

- Client brief and architectural observation: [`docs/context.md`](../context.md)
- Repo operating constraints: [`docs/init.md`](../init.md)
- Package surveys (That Open, xeokit, CesiumJS, deck.gl, R3F, Threlte): [`docs/planning/catalogue-of-third-party-packages.md`](../planning/catalogue-of-third-party-packages.md)
- Native three.js baseline and curriculum: [`docs/capture/native.md`](native.md), `experiments/native/`
