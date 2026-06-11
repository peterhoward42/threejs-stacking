.PHONY: help install dev build preview

help:
	@echo "native — bare Three.js + Svelte curriculum"
	@echo ""
	@echo "  make install        Install dependencies"
	@echo "  make dev            Run dev server (opens demo chooser at /)"
	@echo "  make build          Production build"
	@echo "  make preview        Preview production build"
	@echo ""
	@echo "  Open a specific demo in the browser with ?step=N"

install:
	npm install

dev: install
	npm run dev

build: install
	npm run build

preview: build
	npm run preview
