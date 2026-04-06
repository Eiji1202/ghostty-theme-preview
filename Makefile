.PHONY: start serve help themes

PORT ?= 8080

# Local preview (avoids file:// CORS; open via http://)
start:
	@echo "→ http://localhost:$(PORT)/index.html"
	python3 -m http.server $(PORT)

# Regenerate themes.json (requires Ghostty theme sources — see generate.py)
themes:
	python3 generate.py

help:
	@echo "Targets:"
	@echo "  make start   HTTP server on port $(PORT) (override: make start PORT=3000)"
	@echo "  make serve   same as start"
	@echo "  make themes  run generate.py"
	@echo "  make help    this message"
