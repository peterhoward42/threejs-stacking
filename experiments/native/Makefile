.PHONY: help install dev build preview

help:
	@echo "native — bare Three.js + Svelte"
	@echo ""
	@echo "  make install   Install dependencies"
	@echo "  make dev       Run dev server"
	@echo "  make build     Production build"
	@echo "  make preview   Preview production build"

install:
	npm install

dev: install
	npm run dev

build: install
	npm run build

preview: build
	npm run preview
