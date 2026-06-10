.PHONY: help install dev build preview

STEP ?= 1

help:
	@echo "native — bare Three.js + Svelte curriculum"
	@echo ""
	@echo "  make install        Install dependencies"
	@echo "  make dev            Run dev server (STEP=$(STEP))"
	@echo "  make dev STEP=1     Launch curriculum step 1"
	@echo "  make dev STEP=2     Launch curriculum step 2"
	@echo "  make dev STEP=3     Launch curriculum step 3"
	@echo "  make build          Production build"
	@echo "  make preview        Preview production build"
	@echo ""
	@echo "  Override step in the browser with ?step=N"

install:
	npm install

dev: install
	VITE_STEP=$(STEP) npm run dev

build: install
	VITE_STEP=$(STEP) npm run build

preview: build
	npm run preview
