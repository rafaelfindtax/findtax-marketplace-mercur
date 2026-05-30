# =============================================================================
# Mercur Marketplace — atalhos de operação local
#
# Uso:
#   make up              # sobe tudo em modo dev (com hot reload)
#   make down            # derruba tudo
#   make logs            # logs combinados
#   make logs SVC=backend
#   make migrate         # roda migrations do Medusa
#   make seed            # popula o banco com dados de exemplo
#   make admin           # cria usuário admin (admin@test.com / supersecret)
#   make backend-shell   # abre shell no container backend
#   make psql            # abre psql no container postgres
#   make rebuild         # rebuild completo das imagens
#   make clean           # remove containers e volumes (DESTRÓI DADOS!)
# =============================================================================

COMPOSE := docker compose
SVC ?=

.PHONY: help up up-prod down restart logs ps build rebuild \
        migrate seed admin backend-shell admin-shell vendor-shell storefront-shell \
        psql redis-cli minio-console clean ps-mercur

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Sobe tudo em modo desenvolvimento (com hot reload)
	$(COMPOSE) up -d
	@echo ""
	@echo "✅ Serviços disponíveis em:"
	@echo "   Backend API     -> http://localhost:9000"
	@echo "   Admin Panel     -> http://localhost:5173"
	@echo "   Vendor Panel    -> http://localhost:7001"
	@echo "   Storefront      -> http://localhost:3000"
	@echo "   MinIO Console   -> http://localhost:9101 (minioadmin / minioadmin)"
	@echo ""
	@echo "👉 Próximos passos: make migrate && make admin"

up-prod: ## Sobe sem o override (modo prod-like, sem hot reload)
	$(COMPOSE) -f docker-compose.yml up -d --build

down: ## Derruba todos os containers
	$(COMPOSE) down

restart: ## Reinicia todos os serviços
	$(COMPOSE) restart $(SVC)

logs: ## Tail dos logs (use SVC=backend para um serviço específico)
	$(COMPOSE) logs -f $(SVC)

ps: ## Lista containers
	$(COMPOSE) ps

build: ## Build das imagens
	$(COMPOSE) build

rebuild: ## Rebuild completo (sem cache)
	$(COMPOSE) build --no-cache

# ----- Operações Medusa ------------------------------------------------------
# Usamos `run --rm` (container efêmero) em vez de `exec` (container existente),
# para que migrations possam rodar ANTES do backend principal subir — o backend
# não bootstrap a sem o schema do banco já existir.

migrate: ## Roda migrations do Medusa (cria/atualiza schema)
	$(COMPOSE) run --rm --no-deps backend pnpm exec medusa db:migrate

seed: ## Popula o banco com dados de exemplo (regions, currencies, produtos)
	$(COMPOSE) run --rm --no-deps backend pnpm seed

seed-vendor: ## Cria seller (vendor) + produtos vinculados (necessário para Algolia/storefront)
	$(COMPOSE) exec backend pnpm exec medusa exec ./src/scripts/seed-vendor.ts

# ----- FINDTAX Marketplace (setup customizado) -------------------------------

findtax-setup: ## Importa sellers + produtos do CSV (FINDTAX/Brazil/BRL) — idempotente
	$(COMPOSE) exec backend pnpm exec medusa exec ./src/scripts/seed-findtax.ts
	@echo ""
	@echo "▶ Disparando re-sync Algolia…"
	@$(MAKE) algolia-sync
	@echo ""
	@echo "✅ FINDTAX pronto. Abra http://localhost:3000"

findtax-reset: ## ⚠️  Apaga sellers + produtos + logística via SQL (preserva regions/store/admin)
	$(COMPOSE) exec -T postgres psql -U postgres -d mercurjs < backend/src/scripts/findtax/reset.sql

findtax-countries: ## Garante geo_zones (BR) + inventory_levels (cadeia supported_countries no Algolia)
	$(COMPOSE) exec backend pnpm exec medusa exec ./src/scripts/findtax-countries.ts
	@echo ""
	@echo "▶ Re-sync Algolia para atualizar supported_countries…"
	@$(MAKE) algolia-sync

findtax-categories: ## Cria árvore de categorias (6+9) + vincula produtos a Tecnologias > Soluções Fiscais
	$(COMPOSE) exec backend pnpm exec medusa exec ./src/scripts/findtax-categories.ts
	@echo ""
	@echo "▶ Re-sync Algolia para reindexar produtos com categorias…"
	@$(MAKE) algolia-sync

findtax-bootstrap: ## Reset total + setup novo (recriação completa do marketplace)
	@echo "▶ 1/2 RESET…"
	@$(MAKE) findtax-reset
	@echo ""
	@echo "▶ 2/2 SETUP…"
	@$(MAKE) findtax-setup

# ----- Deploy (Railway / outro Postgres) ------------------------------------

findtax-dump: ## Gera backend/src/sample/findtax-seed.sql a partir do banco local
	@bash backend/src/scripts/findtax/dump.sh

findtax-restore: ## Aplica findtax-seed.sql em outro Postgres (TARGET_URL="postgres://...")
	@bash backend/src/scripts/findtax/restore.sh "$(TARGET_URL)"

findtax-countries-sql: ## Aplica setup-countries.sql direto via psql (default: banco local; passe TARGET_URL para remoto)
	@if [ -n "$(TARGET_URL)" ]; then \
		echo "▶ Aplicando setup-countries.sql em $(TARGET_URL)…"; \
		docker run --rm -i -v "$$(pwd)/backend/src/scripts/findtax/setup-countries.sql:/setup-countries.sql:ro" postgres:16-alpine psql "$(TARGET_URL)" -v ON_ERROR_STOP=1 -f /setup-countries.sql; \
	else \
		echo "▶ Aplicando setup-countries.sql no banco LOCAL…"; \
		$(COMPOSE) exec -T postgres psql -U postgres -d mercurjs < backend/src/scripts/findtax/setup-countries.sql; \
	fi

findtax-categories-sql: ## Aplica setup-categories.sql direto via psql (default: banco local; passe TARGET_URL para remoto)
	@if [ -n "$(TARGET_URL)" ]; then \
		echo "▶ Aplicando setup-categories.sql em $(TARGET_URL)…"; \
		docker run --rm -i -v "$$(pwd)/backend/src/scripts/findtax/setup-categories.sql:/setup-categories.sql:ro" postgres:16-alpine psql "$(TARGET_URL)" -v ON_ERROR_STOP=1 -f /setup-categories.sql; \
	else \
		echo "▶ Aplicando setup-categories.sql no banco LOCAL…"; \
		$(COMPOSE) exec -T postgres psql -U postgres -d mercurjs < backend/src/scripts/findtax/setup-categories.sql; \
	fi

admin: ## Cria usuário admin (admin@test.com / supersecret)
	$(COMPOSE) run --rm --no-deps backend pnpm exec medusa user -e admin@test.com -p supersecret

bootstrap: ## Sequência completa: migrate + seed + admin (use após `make up`)
	@echo "▶ Rodando migrations…"
	@$(MAKE) migrate
	@echo "▶ Populando dados de exemplo…"
	@$(MAKE) seed
	@echo "▶ Criando admin…"
	@$(MAKE) admin
	@echo "✅ Bootstrap concluído. Reinicie o backend: make restart SVC=backend"

# ----- Algolia ---------------------------------------------------------------
# Login admin → token JWT → chama o endpoint do plugin Mercur Algolia.
# Sobrescreva ADMIN_EMAIL/ADMIN_PASS se usar credenciais diferentes:
#   make algolia-sync ADMIN_EMAIL=outro@admin.com ADMIN_PASS=outrasenha

ADMIN_EMAIL ?= admin@test.com
ADMIN_PASS ?= supersecret
BACKEND_URL ?= http://localhost:9000

define _LOGIN_TOKEN
curl -sX POST $(BACKEND_URL)/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"$(ADMIN_EMAIL)","password":"$(ADMIN_PASS)"}' \
| (command -v jq >/dev/null 2>&1 && jq -r .token || sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
endef

algolia-init: ## Cria o índice "products" no Algolia (idempotente)
	$(COMPOSE) exec backend npx tsx src/scripts/init-algolia.ts

algolia-status: ## Mostra status do índice Algolia (appId + se o índice existe)
	@TOKEN=$$($(_LOGIN_TOKEN)); \
	if [ -z "$$TOKEN" ] || [ "$$TOKEN" = "null" ]; then \
		echo "❌ Falha no login admin. Verifique ADMIN_EMAIL/ADMIN_PASS e se o backend está de pé."; exit 1; \
	fi; \
	curl -sX GET $(BACKEND_URL)/admin/algolia -H "Authorization: Bearer $$TOKEN" | \
	(command -v jq >/dev/null 2>&1 && jq . || cat)

algolia-sync: ## Dispara re-sync completo de produtos para o Algolia
	@TOKEN=$$($(_LOGIN_TOKEN)); \
	if [ -z "$$TOKEN" ] || [ "$$TOKEN" = "null" ]; then \
		echo "❌ Falha no login admin. Verifique ADMIN_EMAIL/ADMIN_PASS e se o backend está de pé."; exit 1; \
	fi; \
	echo "▶ Disparando syncAlgoliaWorkflow…"; \
	curl -sX POST $(BACKEND_URL)/admin/algolia -H "Authorization: Bearer $$TOKEN" | \
	(command -v jq >/dev/null 2>&1 && jq . || cat); \
	echo ""; \
	echo "✅ Sync iniciado em background. Acompanhe: make logs SVC=backend"

# ----- Shells ----------------------------------------------------------------

backend-shell: ## Shell no container backend
	$(COMPOSE) exec backend sh

admin-shell:
	$(COMPOSE) exec admin-panel sh

vendor-shell:
	$(COMPOSE) exec vendor-panel sh

storefront-shell:
	$(COMPOSE) exec storefront sh

# ----- Infra -----------------------------------------------------------------

psql: ## Abre psql no container postgres
	$(COMPOSE) exec postgres psql -U postgres -d mercurjs

redis-cli: ## Abre redis-cli
	$(COMPOSE) exec redis redis-cli

minio-console: ## Abre o console MinIO no browser
	@command -v open >/dev/null 2>&1 && open http://localhost:9101 || xdg-open http://localhost:9101

# ----- Limpeza ---------------------------------------------------------------

clean: ## Remove containers + volumes (⚠️ apaga dados!)
	$(COMPOSE) down -v
	@echo "🧹 Containers e volumes removidos."
