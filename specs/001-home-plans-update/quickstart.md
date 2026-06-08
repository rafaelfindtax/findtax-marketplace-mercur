# Quickstart — Plans (dev & validação)

Pré-requisito: stack rodando via docker-compose (`backend` 9000, `storefront` 3000, `admin-panel` 5173, Postgres/Redis/MinIO). Veja `make up` / `docker compose up -d`.

## 1. Backend — módulo, migração e seed

```bash
# Registrar o módulo em backend/medusa-config.ts:  modules: [ { resolve: "./src/modules/plans" }, ... ]

# Gerar e aplicar a migração do módulo
docker compose exec backend pnpm exec medusa db:generate plans
docker compose exec backend pnpm exec medusa db:migrate

# Semear os 3 planos default (idempotente)
docker compose exec backend pnpm exec medusa exec ./src/scripts/seed-plans.ts
```

## 2. Verificar a API

```bash
# Store (público) — precisa da publishable key
KEY=$(docker exec mercur-postgres psql -U postgres -d mercurjs -t -A \
  -c "SELECT token FROM api_key WHERE type='publishable' AND revoked_at IS NULL LIMIT 1;")
curl -s -H "x-publishable-api-key: $KEY" http://localhost:9000/store/plans | head -c 600

# Admin (autenticado) — obter token e listar
TOKEN=$(curl -sX POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"supersecret"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:9000/admin/plans | head -c 600
```

Esperado: `GET /store/plans` retorna os 3 planos ativos (Tax Partner com `is_highlighted: true`), ordenados por `rank`, cada um com `benefits`.

## 3. Admin-panel — gestão

1. Abrir `http://localhost:5173`, autenticar (`admin@test.com` / `supersecret`).
2. Acessar a página **Plans** (novo item de menu/rota).
3. Validar fluxos (mapeiam às User Stories / FRs):
   - Editar valor/texto/benefício de um plano e salvar → muda na home. (US2, FR-015/016)
   - Marcar outro plano como destaque → o anterior deixa de ser destaque. (FR-017)
   - Reordenar planos / desativar um plano. (FR-018)

## 4. Storefront — seção na home

```bash
# Após implementar PlansSection + lib/data/plans.ts + troca em page.tsx
docker compose up -d --force-recreate storefront   # recarrega caso necessário
```

1. Abrir `http://localhost:3000` (incognito p/ evitar ruído de extensão).
2. Conferir a área de planos: cabeçalho ("#estounaFIND!" + "Comece junto com a gente essa jornada!" + "Planos"), 3 cards lado a lado, Tax Partner em destaque, listas de benefícios com checks (e marcador especial nos destacados), botões com os rótulos corretos. (US1, FR-001..010)
3. Clicar cada CTA → destino correto. (FR-006/007/008, SC-002)
4. Reduzir a viewport p/ ~360px → cards empilham, legíveis, botões acionáveis. (US4, SC-003)
5. Editar um plano no admin-panel e revalidar a home (respeitando o cache de ~1h; forçar refresh/rebuild se necessário). (SC-006)

## 5. Critérios de aceite rápidos

- [ ] `/store/plans` retorna apenas ativos, ordenados, com benefícios. (FR-011)
- [ ] Instalação nova mostra os 3 planos default. (FR-020, SC-007)
- [ ] No máximo 1 plano em destaque após qualquer edição. (FR-017)
- [ ] Home exibe a nova seção no lugar da antiga "NOSSOS PLANOS". (FR-001, R7)
- [ ] CTAs sem links quebrados. (SC-002)
- [ ] Responsivo e acessível (teclado/contraste). (FR-010/013, SC-003/005)
