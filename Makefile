.PHONY: help install dev dev-native build preview

help:
	@echo "threejs-stacking"
	@echo ""
	@echo "  make install        Install root + experiment dependencies"
	@echo "  make dev            Run portal (/) + native (/native/) dev servers"
	@echo "  make dev-native     Run native experiment dev server at /"
	@echo "  make build          Production build (portal + experiments → dist/)"
	@echo "  make preview        Preview production portal at /"
	@echo ""
	@echo "  Native curriculum:  cd experiments/native && make dev"

install:
	npm install

dev: install
	npm run dev

dev-native: install
	npm run dev:native

build: install
	npm run build

preview: build
	npm run preview
