# Animated Fiesta — canonical command surface (see .ai-rules/rules/07-command-surface.md)
.DEFAULT_GOAL := help
.PHONY: help install dev build preview check clean

help: ## List available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start the Vite dev server (http://localhost:5173)
	npm run dev

build: ## Type-check and produce a production bundle in dist/
	npm run build

preview: ## Serve the production build locally
	npm run preview

check: ## Type-check only (tsc --noEmit)
	npm run check

clean: ## Remove build output and installed dependencies
	rm -rf dist node_modules
