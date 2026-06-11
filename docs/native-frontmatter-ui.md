# Native experiments — in-app demo chooser (UX proposal)

> Status: proposal — decisions complete; ready to implement.

## Context

`experiments/native` is a curriculum of **25 isolated Three.js demos**. Each demo:

1. Names a concept (header title + lede)
2. Shows it visually (canvas)
3. Offers HUD controls to play with it
4. Lives in readable source (`src/steps/NN-….js`)

Today, **which demo runs** is chosen outside the UI:


| Affordance     | Example            | Behaviour                                            |
| -------------- | ------------------ | ---------------------------------------------------- |
| Makefile / env | `make dev STEP=10` | Sets `VITE_STEP`; page loads straight into that step |
| URL query      | `/?step=10`        | Overrides env; same single-step mount                |
| Default        | (neither set)      | Falls back to **step 1**                             |


The shell header already surfaces per-step copy from each module’s `meta`:

```text
native — step 10: Raycasting and mesh picking
Pointer NDC feeds Raycaster; hover highlight and click selection…
```

Your longer conceptual notes live separately in `[docs/capture/native.md](capture/native.md)` — mental-model bullets, stack implications, open questions. They are **not** shown in the app today.

**Proposal:** replace external step selection as the primary workflow with a **dedicated in-app chooser view**, while keeping deep links and clean teardown between demos.

---

## Goals

- **Discoverability** — someone opening `make dev` (no `STEP=`) should see all 25 topics, not land silently on step 1.
- **Context before commit** — each list entry combines the existing header text *and* your capture notes so the chooser is useful for learning/review, not just a numbered index.
- **One demo at a time** — preserve the isolation requirement from `[docs/planning/native.md](planning/native.md)`: mount exactly one step, dispose on leave.
- **Easy return** — from any demo, one obvious control back to the chooser.
- **Low ceremony** — this is a local learning lab, not a product shell; avoid building a full design system for navigation.

## Non-goals (for now)

- Cross-step feature accumulation (still one demo = one scene).
- In-demo “next / previous step” carousel (optional later; not recommended as v1 — blurs isolation).
- Replacing the HUD or step source layout.

---

## Recommended model: two views, one app

Treat the app as two top-level **modes** managed by the existing thin shell (`App.svelte`), not 25 separate HTML entries.

```text
┌─────────────────────────────────────────────────────────────┐
│  MODE: menu                     MODE: demo                  │
│  Scrollable index of 25 cards   Current header + workspace  │
│  No WebGL mounted               Canvas + HUD (as today)     │
└─────────────────────────────────────────────────────────────┘
         │  "Open demo" on card N                │
         └──────────────────────────────────────►│
         ◄──────────────────────────────────────┘
              "All demos" in header
```

### Why a full-page menu (not a persistent sidebar)

- The demo layout is **viewport-locked** (`100dvh`, no page scroll). A 25-item sidebar would dominate the canvas or require horizontal squeeze on the HUD.
- Capture notes are **multi-line prose** — they need vertical space; a menu page can scroll without fighting the canvas.
- Sidebar remains viable as a **future enhancement** for quick jumps while inside a demo; not needed for v1.

---

## Menu view — layout

### Page chrome

```text
┌──────────────────────────────────────────────────────────────┐
│  native — Three.js capability experiments                    │
│  Pick a topic: name the concept → see it → play → read code  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌─ 01 ─────────────────────────────────────────────────┐   │
│  │  Scene graph and transforms                          │   │
│  │  Nested groups rotate at different rates…  (meta)    │   │
│  │  • Object scene supports parent/child…     (capture)  │   │
│  │  • Transforms compound down the tree…                │   │
│  │                              [ Open demo → ]         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─ 02 ─ … ─────────────────────────────────────────────┐   │
│  … (scroll)                                                  │
└──────────────────────────────────────────────────────────────┘
```

### Each card shows


| Layer      | Source                                               | Role on card                                                      |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Step badge | `meta.step`                                          | `01` … `25` — scannable order                                     |
| Title      | `meta.title`                                         | Same string as demo header h1                                     |
| Lede       | `meta.description`                                   | 1–2 lines, muted — “what you’ll see in the canvas”                |
| Notes      | `docs/capture/native.md` section for that experiment | Bulleted excerpt (2–4 bullets) — “why this matters for the stack” |
| CTA        | —                                                    | Primary button: **Open demo** (or **Launch step 10**)             |


**Card click behaviour:** **CTA only** — only the **Open demo** button navigates; card body is for reading and expanding notes. Avoids mis-clicks while scrolling.

### List structure

**Flat list** — 25 cards in step order, no section headings or grouping in v1.

---

## Demo view — changes to existing shell

Keep the current workspace (canvas + HUD). Adjust the **header** only:

```text
┌──────────────────────────────────────────────────────────────┐
│  ← All demos          step 10 · Raycasting and mesh picking  │
│  Pointer NDC feeds Raycaster… (meta.description, as today)     │
└──────────────────────────────────────────────────────────────┘
│  canvas                              │  HUD                   │
```

- **← All demos** — text button or link, left-aligned; returns to menu mode.
- Drop the redundant `native —` prefix on the demo header (the menu page owns the series title).
- **No** next/previous chevrons in v1 — use the menu for intentional jumps; avoids accidental cross-step state leaks.

### Concept notes on demo view

Add a collapsible **“Concept notes”** panel under the lede (full capture section from catalog, **collapsed by default**). Menu cards remain the primary place to browse notes before opening a demo; the demo panel is for reference while playing with controls.

---

## Navigation and URL strategy

### Recommended URL contract


| URL         | View                       |
| ----------- | -------------------------- |
| `/` or `/?` | Menu (no step mounted)     |
| `/?step=N`  | Demo N (current behaviour) |


**On “Open demo”:** navigate to `/?step=N`. **Full page reload is acceptable for v1** (`location.assign` or equivalent) — simpler than client-side teardown/re-mount.

**On “All demos”:** navigate to `/` (no `step` query). Reload acceptable.

### What happens to `make dev STEP=N` and `VITE_STEP`


| Option                                                                        | Pros                                      | Cons                     |
| ----------------------------------------------------------------------------- | ----------------------------------------- | ------------------------ |
| **Keep as deep-link default** — env sets initial `?step=N` on first load only | Scripts/AI can still open a specific step | Two ways to enter a demo |
| ~~Deprecate in favour of menu-only~~                                          | ~~Single mental model~~                   | ~~Lose one-liner~~       |
| ~~Keep env but redirect~~                                                     | ~~Compromise~~                            | ~~Slightly odd~~         |


**Decision:** **menu-only entry** — deprecate `make dev STEP=N` and `VITE_STEP`. One way in: open the app → menu → pick a demo. Keep `?step=N` in the URL only as an *in-app* navigation affordance (Open demo updates the query; bookmarks still work). Remove Makefile `STEP=` and env wiring from dev/build/preview.

### Browser back button

Back from demo → menu *may* work via History API if we use `pushState`; not a v1 requirement — explicit **← All demos** is sufficient.

---

## Content model — where copy lives

Today copy is split:

```text
src/steps/NN-….js     →  export const meta = { title, description }
docs/capture/native.md →  ## … (experiment N) + bullets
```

For the chooser, something must **join** these for all 25 steps without loading every WebGL module up front.

**Decision:** **`src/curriculum.js`** (or similar) is the single source of truth for all UI copy — title, lede, and full capture notes. One-time migration: adopt text from `docs/capture/native.md` and each step’s `meta` into the catalog; step modules **re-export** `meta` from the catalog (or import from it) so header/HUD stay in sync. `capture/native.md` is no longer maintained for copy — it can remain in the repo as archival/shareable prose for public deployment, but the app does not read it at runtime.

**Card notes UX:** show a **trimmed excerpt by default**; **“Read more” expands to the full capture section** on the card (not a separate page).

---

## Switching demos — lifecycle

Must preserve today’s dispose contract:

```text
User on demo 5 → chooses demo 12 (from menu after back, or future in-demo jump)
  1. call stepApi.dispose()  (geometries, materials, rAF, listeners)
  2. unmount HUD / overlay for step 5
  3. load step 12 module + HUD
  4. mount into fresh canvas host
```

Menu mode: **no** Three.js renderer allocated (or dispose any preview if added later).

Show a brief **loading state** on the canvas area when swap takes > ~100ms (lazy chunks for step modules already exist).

---

## Visual / interaction tone

Match existing dark shell (`#111118`, `#2a2a36` borders, system-ui, compact header). Menu cards:

- Same border/subtle background as HUD panels (`hud.css` vocabulary)
- Primary CTA: solid accent (reuse HUD button styling if present)
- Step badge: monospace or tabular nums for alignment

No thumbnails/screenshots in v1 — 25 static captures are maintenance-heavy; title + notes are enough for a learning index.

---

## User flows

### Flow 1 — first visit (default dev)

```text
make dev  →  browser opens /
          →  menu lists 25 cards with meta + capture excerpts
          →  user reads card 9, clicks Open demo
          →  URL ?step=9, demo mounts, header shows ← All demos
          →  user plays with HUD, reads code in editor
          →  ← All demos  →  menu, WebGL torn down
```

### Flow 2 — bookmark / shared URL

```text
User opens /?step=10  →  demo 10 directly (skip menu)
                      →  ← All demos still available
```

---

## Alternatives considered


| Alternative                            | Why not primary                                                 |
| -------------------------------------- | --------------------------------------------------------------- |
| Persistent left rail with 25 links     | Crowds canvas/HUD; poor fit for long capture text               |
| Modal picker overlay on top of demo    | Hides canvas; awkward with viewport lock                        |
| Separate `index.html` per step         | Contradicts single dev server + lazy `step.js` registry         |
| Default stays step 1, menu as `/?menu` | Hides the index; repeats today’s “silent default” problem       |
| Next/Prev step in header               | Encourages treating curriculum as one app; weaker isolation cue |


---

## Resolved decisions

| # | Topic | Decision |
|---|-------|----------|
| — | Entry / Makefile | **Menu-only.** Deprecate `STEP=` / `VITE_STEP`. `make dev` → `/` → menu. |
| — | Copy source | **`curriculum.js`** owns all UI text; migrate from capture doc + step `meta`; step modules re-export. |
| — | Card notes (menu) | **Expandable:** excerpt default, “Read more” reveals full capture section. |
| — | Browser back | **Not required** for v1; ← All demos is enough. |
| 1 | Default entry | **Yes** — menu at `/` with no `step`. |
| 2 | Card click | **CTA only** — Open demo button navigates; card body does not. |
| 3 | Section groupings | **Flat list** — 25 cards in order, no themed headings. |
| 4 | Concept notes (demo) | **Collapsible panel** under lede, collapsed by default. |
| 5 | Step swap | **Reload OK** — full navigation between menu ↔ demo is fine for v1. |
| 6 | `make dev STEP=N` | **No** — removed; use menu or bookmark `/?step=N`. |
| 7 | Search/filter | **Not in v1.** |
| 8 | Last visited highlight | **Not needed.** |
| 9 | Step 25 badge | **None** — same treatment as other cards. |

---

## Suggested implementation phases (for later)

**Phase 1 — navigation skeleton**

- Menu vs demo mode in `App.svelte`
- URL ↔ mode sync; `← All demos`; default `/` → menu
- Placeholder cards (title only) from existing `STEP_MODULES` keys

**Phase 2 — content**

- Catalog wiring: meta + capture excerpts for all 25
- Card layout, scroll container, CTA

**Phase 3 — polish**

- Loading state on demo mount (if client-side swap added later)
- Collapsible “Concept notes” on demo view
- README/Makefile docs update; remove `STEP=` / `VITE_STEP`

---

## Appendix — card copy sketch (steps 1–3)

Illustrates how meta + capture combine on one card. Full set would mirror all sections in `[capture/native.md](capture/native.md)`.

### 01 — Scene graph and transforms

**Lede:** Nested groups rotate at different rates. Local transforms are relative to the parent; world values compound down the chain.

**Capture excerpt:**

- Object scene supports parent/child relationships; each node has a transform.
- Transforms are inherited down the tree — the demo’s kinematic chain compounds rotations.

### 02 — Cameras and projection

**Lede:** Side-by-side perspective and orthographic views of the same scene; adjust fov, near/far, frustum.

**Capture excerpt:**

- Position the camera, define frustum, choose perspective vs orthographic.
- Near/far planes clip along the view axis (distinct from frustum culling).

### 03 — Built-in geometry and BufferGeometry anatomy

**Lede:** Primitive gallery; inspect attributes (position, normal, uv) and index.

**Capture excerpt:**

- Built-in meshes: box, sphere, cylinder, cone, torus, plane, etc.
- Programmatic access to geometric properties per object.

---

## Relation to learning workflow

Your stated loop in `[capture/native.md](capture/native.md)`:

> Name the concept → See it visually → Play with controls → Scan the code

The chooser explicitly supports **step 0: name and frame the concept** before mounting WebGL. The demo view supports steps 2–4 unchanged. Code scanning stays in the editor (link to `src/steps/…` is optional future enhancement — e.g. “View source” opens file path in footer).