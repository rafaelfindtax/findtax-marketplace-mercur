# Research — Atualização da Área de Planos da Home Page

Fase 0. Resolve as incógnitas técnicas e registra decisões baseadas nos padrões reais do repositório.

## R1. Onde mora a UI de gestão "admin-manageable"?

- **Decision**: Construir a UI no **`admin-panel`** (dashboard Medusa ejetado, `@medusajs/dashboard`), como uma página de rota dedicada usando `@medusajs/ui` + `@tanstack/react-query` chamando os endpoints `/admin/plans`.
- **Rationale**: O admin nativo do Medusa está **desabilitado** em `backend/medusa-config.ts` (`admin: { disable: true }`); logo, widgets/rotas em `backend/src/admin/` não são servidos. O `admin-panel` é a interface administrativa real (porta 5173) e tem o código-fonte completo, com `react-router-dom`, react-query e `@medusajs/ui` já disponíveis e o sistema `virtual:medusa/routes`.
- **Alternatives considered**:
  - *Reabilitar o admin nativo do Medusa e usar admin-extensions* — rejeitado: muda a estratégia de admin da plataforma Mercur e duplicaria interfaces.
  - *Gerir apenas via API/SQL sem UI* — rejeitado: contraria FR-014 (gestão via painel, sem código).

## R2. Modelagem: módulo customizado vs. reuso de entidade existente

- **Decision**: Criar **módulo customizado `plans`** com duas entidades: `Plan` e `Benefit` (1‑para‑N), seguindo o padrão de `backend/src/modules/minio-file` (estrutura `index.ts` + `service.ts` + `models/`).
- **Rationale**: Planos são um conceito de conteúdo de marketing próprio, sem relação com Product/Pricing do Medusa nesta versão. Módulo isolado mantém o domínio simples e migrável (`medusa db:generate plans`).
- **Alternatives considered**:
  - *Reaproveitar Product/Price/SalesChannel* — rejeitado: acoplamento indevido; "R$ 5.000"/"sob demanda" são rótulos de marketing, não preços transacionáveis.
  - *Plano com benefícios como JSON embutido* — rejeitado em favor de entidade `Benefit` separada para permitir ordenação/flag de destaque por item (FR-016) de forma estruturada.

## R3. Endpoints de API

- **Decision**:
  - **Store** (público, leitura): `GET /store/plans` → retorna apenas planos **ativos**, **ordenados por `rank`**, com benefícios ordenados. Requer `x-publishable-api-key` (padrão store API).
  - **Admin** (CRUD): `GET/POST /admin/plans`, `GET/POST(update)/DELETE /admin/plans/:id`. Benefícios gerenciados **embutidos** no payload do plano (replace-all na atualização) para simplicidade.
- **Rationale**: Segue o roteamento por arquivos do Medusa (`api/store/custom/route.ts`, `api/admin/custom/route.ts`). Update via `POST /:id` é a convenção Medusa. Benefícios embutidos evitam um CRUD aninhado extra para um conjunto pequeno.
- **Alternatives considered**: Endpoints dedicados `/admin/plans/:id/benefits` — adiáveis; não necessários para o volume atual.

## R4. Validação e regra de "destaque único"

- **Decision**: Validar payloads admin com **zod** via `defineMiddlewares` em `backend/src/api/middlewares.ts` (padrão Medusa). A regra "no máximo um plano em destaque" (FR-017) é aplicada na **camada de serviço**: ao marcar um plano como destacado, desmarcar os demais na mesma operação.
- **Rationale**: Mantém a invariante no backend, independente da UI. zod é o validador padrão do Medusa v2.
- **Alternatives considered**: Forçar unicidade só na UI — rejeitado (frágil; API ficaria inconsistente).

## R5. Cache e consumo no storefront

- **Decision**: `storefront/src/lib/data/plans.ts` com `"use server"`, usando `sdk.client.fetch<{ plans }>("/store/plans", { cache: "force-cache", next: { ...getCacheOptions("plans"), revalidate: 3600 } })`, com `.catch` retornando lista vazia (degradação graciosa). A `PlansSection` é um **server component async** que chama `listPlans()`.
- **Rationale**: Espelha exatamente `lib/data/regions.ts`/`categories.ts`. Conteúdo muda pouco; cache de 1h é adequado e mantém a home rápida (alinha SC e Constraints).
- **Alternatives considered**: Sem cache (`no-cache`) — desnecessário e mais lento. Revalidação por tag/webhook — fora de escopo; revalidate temporal basta.

## R6. Conteúdo default (seed)

- **Decision**: `backend/src/scripts/seed-plans.ts` (rodável com `medusa exec`) cria os 3 planos de referência **de forma idempotente** (não duplica se já existirem, ex.: checagem por nome). Conteúdo conforme a seção "Content Reference" da spec, com Tax Partner `is_highlighted = true`.
- **Rationale**: Atende FR-020/SC-007 (instalação nova já preenchida). Idempotência evita duplicar em re-execuções/CI.
- **Alternatives considered**: Inserir no `seed.ts` principal — possível, mas script dedicado é mais claro e reexecutável isoladamente; pode ser também chamado pelo fluxo de bootstrap.

## R7. Substituição da seção atual na home

- **Decision**: Na `storefront/.../(main)/page.tsx`, **substituir** `<ShopByStyleSection />` por `<PlansSection locale={locale} />`. Não remover o componente `ShopByStyleSection` do código nesta feature (apenas deixar de usá-lo na home), para evitar efeitos colaterais; remoção pode ser limpeza futura.
- **Rationale**: A "área de planos" atual é a `ShopByStyleSection` ("NOSSOS PLANOS"); a feature pede atualizá-la. Menor risco mantendo o componente antigo órfão até confirmação.
- **Alternatives considered**: Excluir o componente já — adiável; fora do escopo mínimo.

## R8. Escopo de variação por região/locale

- **Decision**: Planos são **globais** (um único conjunto, pt‑BR) nesta versão; não variam por região/locale.
- **Rationale**: A spec assume pt‑BR e não menciona variação regional. Mantém modelo simples; a `PlansSection` recebe `locale` apenas para links localizados quando o destino for interno.
- **Alternatives considered**: Planos por região — adiável; exigiria relação com Region e multiplicaria conteúdo sem demanda atual.

## Resumo de itens NEEDS CLARIFICATION

Nenhum pendente — todas as incógnitas técnicas foram resolvidas acima com base nos padrões do repositório e nas assunções já registradas na spec.
