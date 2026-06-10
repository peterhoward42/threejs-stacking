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
	@echo "  make dev STEP=4     Launch curriculum step 4"
	@echo "  make dev STEP=5     Launch curriculum step 5"
	@echo "  make dev STEP=6     Launch curriculum step 6"
	@echo "  make dev STEP=7     Launch curriculum step 7"
	@echo "  make dev STEP=8     Launch curriculum step 8"
	@echo "  make dev STEP=9     Launch curriculum step 9"
	@echo "  make dev STEP=10    Launch curriculum step 10"
	@echo "  make dev STEP=11    Launch curriculum step 11"
	@echo "  make dev STEP=12    Launch curriculum step 12"
	@echo "  make dev STEP=13    Launch curriculum step 13"
	@echo "  make dev STEP=14    Launch curriculum step 14"
	@echo "  make dev STEP=15    Launch curriculum step 15"
	@echo "  make dev STEP=16    Launch curriculum step 16"
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
