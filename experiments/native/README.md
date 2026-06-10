# native

Bare Three.js with a Svelte UI. No third-party scene graph or orchestration layer—baseline for comparing later experiments.

## Demo

A lit, rotating cube rendered in a full-viewport WebGL canvas.

## Commands

```sh
make install   # once
make dev       # http://localhost:5173
make build
make preview
```

## Layout

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
    └── App.svelte
```
