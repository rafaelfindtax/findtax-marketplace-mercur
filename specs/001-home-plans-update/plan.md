# Implementation Plan: Atualização da Área de Planos da Home Page

**Branch**: `001-home-plans-update` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-home-plans-update/spec.md`

## Summary

Substituir a área de planos da home page (hoje exibida pela seção reaproveitada `ShopByStyleSection` — "NOSSOS PLANOS") por uma seção dedicada, fiel ao design de referência da FIND, com três planos (Profissional / Tax Partner em destaque / Corporativo). O conteúdo dos planos passa a ser **gerenciável por administradores** e **persistido no backend**, com o conteúdo de referência usado como **seed default**.

Abordagem técnica: criar um **módulo customizado `plans`** no backend Medusa v2 (entidades `Plan` e `Benefit`), expor endpoints **`/admin/plans`** (CRUD) e **`/store/plans`** (leitura pública), adicionar uma **página de gerenciamento no admin-panel** (dashboard Medusa ejetado) e uma **nova seção data-driven no storefront** que consome `/store/plans`. Conteúdo default semeado via script de seed.

## Technical Context

**Language/Version**: TypeScript (Node ≥ 20). Backend Medusa 2.10.2; Storefront Next.js 15.1.6 / React 19; Admin-panel = `@medusajs/dashboard` ejetado (Vite 5 + React 18 + react-router-dom 6).

**Primary Dependencies**: `@medusajs/framework` 2.10.2 (módulos, http, utils), `@medusajs/js-sdk`, `@medusajs/ui` 4.x + `@tanstack/react-query` 5.x (admin-panel), Tailwind (storefront).

**Storage**: PostgreSQL (via módulo Medusa + MikroORM, migrations geradas por `medusa db:generate plans`).

**Testing**: Validação manual via quickstart + verificação de endpoints com curl; sem framework de testes configurado no repo (não introduzir um nesta feature). Lint/build existentes (`pnpm build`).

**Target Platform**: Aplicação web containerizada (docker-compose): `backend` (9000), `storefront` (3000), `admin-panel` (5173), Postgres/Redis/MinIO.

**Project Type**: Web — múltiplos apps (backend + storefront + admin-panel).

**Performance Goals**: Leitura de `/store/plans` cacheável (force-cache + revalidate ~3600s, padrão das demais seções da home); a seção não deve degradar o tempo de render da home.

**Constraints**: `/store/plans` exige `x-publishable-api-key` (padrão Medusa store API). Admin nativo do Medusa está **desabilitado** (`admin: { disable: true }`); a UI de gestão vai no **admin-panel** ejetado. Conteúdo em pt-BR. No máximo um plano em destaque por vez.

**Scale/Scope**: Conjunto pequeno (≈3 planos, poucos benefícios por plano). Escopo: backend (módulo + APIs + seed), admin-panel (1 página de gestão), storefront (1 seção + 1 data function + tipos). Sem pagamento/contratação.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do projeto (`.specify/memory/constitution.md`) ainda é um **template não ratificado** (apenas placeholders), portanto não define princípios verificáveis. Nenhum gate específico aplicável.

Princípios pragmáticos adotados, alinhados ao código existente:
- **Reuso de padrões**: seguir os padrões já presentes (módulo como `minio-file`; rotas como `api/store/custom`; seção/data-layer como `HomeProductSection`/`lib/data`).
- **Sem complexidade desnecessária**: módulo único `plans` com duas entidades; sem links entre módulos (não há relação com Product/Region nesta versão).
- **Consistência visual**: storefront usa tokens Tailwind/`cn()` existentes; admin usa `@medusajs/ui`.

✅ Sem violações. Tabela de Complexity Tracking não necessária.

## Project Structure

### Documentation (this feature)

```text
specs/001-home-plans-update/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md        # Fase 1 — entidades Plan/Benefit
├── quickstart.md        # Fase 1 — como rodar/validar
├── contracts/           # Fase 1 — contratos de API
│   ├── store-plans.md   #   GET /store/plans
│   └── admin-plans.md   #   CRUD /admin/plans
└── checklists/
    └── requirements.md  # (criado no /speckit-specify)
```

### Source Code (repository root)

```text
backend/
├── medusa-config.ts                      # [MOD] registrar { resolve: "./src/modules/plans" }
└── src/
    ├── modules/plans/
    │   ├── models/plan.ts                # [NEW] model.define("plan", ...)
    │   ├── models/benefit.ts             # [NEW] model.define("plan_benefit", ...) + relação
    │   ├── service.ts                    # [NEW] MedusaService({ Plan, Benefit }) + regra de destaque único
    │   ├── index.ts                      # [NEW] Module(PLANS_MODULE, { service })
    │   └── migrations/                   # [NEW] geradas por `medusa db:generate plans`
    ├── api/
    │   ├── admin/plans/route.ts          # [NEW] GET (lista) / POST (cria)
    │   ├── admin/plans/[id]/route.ts     # [NEW] GET / POST (atualiza) / DELETE
    │   ├── store/plans/route.ts          # [NEW] GET (apenas ativos, ordenados, com benefícios)
    │   └── middlewares.ts                # [MOD/NEW] validators (zod) p/ payloads admin
    └── scripts/
        └── seed-plans.ts                 # [NEW] semeia os 3 planos default (idempotente)

admin-panel/                              # dashboard Medusa ejetado (UI de gestão)
└── src/
    ├── routes/plans/                     # [NEW] página(s) de gestão de planos
    │   ├── plan-list/                    #   listar + reordenar + ativar/desativar + destacar
    │   ├── plan-create/                  #   criar
    │   └── plan-edit/                    #   editar (campos + benefícios)
    ├── hooks/api/plans.ts                # [NEW] react-query hooks -> /admin/plans (js-sdk)
    └── (registro de rota + item de menu)  # [MOD] conforme convenção do dashboard

storefront/
└── src/
    ├── app/[locale]/(main)/page.tsx       # [MOD] trocar <ShopByStyleSection/> por <PlansSection/>
    ├── components/sections/
    │   ├── PlansSection/PlansSection.tsx  # [NEW] section async (server component)
    │   └── index.ts                       # [MOD] exportar PlansSection
    ├── components/organisms/PlanCard/      # [NEW] card de plano (reusa Button/cn/LocalizedClientLink)
    ├── lib/data/plans.ts                   # [NEW] listPlans() -> sdk.client.fetch("/store/plans")
    └── types/plans.ts                      # [NEW] tipos Plan/Benefit do storefront
```

**Structure Decision**: Web multi-app. O backend é a fonte da verdade (módulo `plans` + APIs). A gestão vive no **admin-panel** ejetado (admin nativo desabilitado). O storefront consome `/store/plans` numa nova seção que **substitui** a `ShopByStyleSection` na home. Conteúdo default via `seed-plans.ts`.

## Complexity Tracking

> Não aplicável — Constitution Check sem violações.
