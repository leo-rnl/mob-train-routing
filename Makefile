# =============================================================================
# MOB Train Routing - Makefile
# =============================================================================
# Usage:
#   make dev      - Start development environment
#   make prod     - Start production environment (with HTTPS)
#   make down     - Stop all containers
#   make logs     - View container logs
#   make clean    - Remove all containers and volumes
# =============================================================================

.PHONY: dev dev-init prod prod-init down logs clean help

# Default target
.DEFAULT_GOAL := help

# -----------------------------------------------------------------------------
# Development
# -----------------------------------------------------------------------------

dev: dev-init ## Start development environment
	@echo "Starting development environment..."
	@docker compose --env-file .env.docker up -d
	@echo ""
	@echo "Development environment ready:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API:      http://localhost:8000"

dev-init: ## Initialize development environment (.env.docker)
	@if [ ! -f .env.docker ]; then \
		echo "Creating .env.docker from .env.docker.example..."; \
		cp .env.docker.example .env.docker; \
	fi

# -----------------------------------------------------------------------------
# Production
# -----------------------------------------------------------------------------

prod: prod-init ## Start production environment with HTTPS
	@echo "Starting production environment..."
	@docker compose -f docker-compose.prod.yml up -d --build
	@echo ""
	@echo "Production environment ready:"
	@echo "  Frontend: https://localhost"
	@echo "  API:      https://localhost/api/v1"
	@echo "  Traefik:  http://localhost:8080"

prod-init: ## Initialize production (certificates + .env)
	@# Generate certificates if missing
	@if [ ! -f traefik/certs/localhost.crt ]; then \
		echo "Generating self-signed certificates..."; \
		./traefik/generate-certs.sh; \
	else \
		echo "Certificates already exist, skipping generation."; \
	fi
	@# Copy .env if missing
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		echo ""; \
		echo "WARNING: Please review .env and set secure values for:"; \
		echo "  - APP_KEY (generate with: php artisan key:generate --show)"; \
		echo "  - POSTGRES_PASSWORD"; \
		echo ""; \
	else \
		echo ".env already exists, skipping copy."; \
	fi

# -----------------------------------------------------------------------------
# Common
# -----------------------------------------------------------------------------

down: ## Stop all containers
	@echo "Stopping containers..."
	@docker compose down 2>/dev/null || true
	@docker compose -f docker-compose.prod.yml down 2>/dev/null || true
	@echo "All containers stopped."

logs: ## View container logs (use SERVICE=name to filter)
ifdef SERVICE
	@docker compose logs -f $(SERVICE) 2>/dev/null || docker compose -f docker-compose.prod.yml logs -f $(SERVICE)
else
	@docker compose logs -f 2>/dev/null || docker compose -f docker-compose.prod.yml logs -f
endif

clean: down ## Remove all containers and volumes
	@echo "Removing volumes..."
	@docker compose down -v 2>/dev/null || true
	@docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
	@echo "Clean complete."

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------

help: ## Show this help
	@echo "MOB Train Routing - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make dev          Start development environment"
	@echo "  make prod         Start production with HTTPS"
	@echo "  make logs         View all logs"
	@echo "  make logs SERVICE=backend   View backend logs only"
