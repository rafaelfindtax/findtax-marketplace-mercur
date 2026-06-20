---
description: "Task list for Filtros Facetados na Página de Categorias"
---

# Tasks: Filtros Facetados na Página de Categorias

**Input**: Design documents from `/specs/004-category-filters/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Não solicitados na spec (sem TDD). Validação manual via quickstart.md.

**Organization**: Tasks por user story. Frontend (US1–US4) é entregável independentemente; a **Fase 2 (backend)** habilita os dados das facetas "Integrações com ERP" e "Modelo de Entrega" e pode rodar em paralelo (com risco do plugin closed-source).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem dependências pendentes)
- **[Story]**: US1, US2, US3, US4

## Path Conventions

- Storefront: `storefront/src/...`. Backend: `backend/...`.

---

## Phase 1: Setup

- [X] T001 Reler os componentes/padrões atuais de filtro para confirmar o ponto de mudança: `storefront/src/components/sections/ProductListing/AlgoliaProductsListing.tsx`, `storefront/src/components/organisms/ProductSidebar/AlgoliaProductSidebar.tsx`, `storefront/src/hooks/useFilters.tsx`, `storefront/src/lib/helpers/get-faced-filters.ts`, `storefront/src/components/cells/ActiveFilterElement/ActiveFilterElement.tsx`.

**Checkpoint**: Padrão atual confirmado.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Bloqueia todas as user stories de frontend.

- [X] T002 [P] Criar config ordenada das 6 seções em `storefront/src/const/category-filters.ts` (campos: `key,label,attribute,paramKey,alwaysVisible`; ordem e atributos conforme data-model.md; `erp`/`delivery` com atributo placeholder até a Fase 2).
- [X] T003 [P] Criar componente genérico `storefront/src/components/cells/AlgoliaRefinementFilter/AlgoliaRefinementFilter.tsx` (props `label,attribute,paramKey,defaultOpen`): usa `useRefinementList({attribute, operator:"or", limit})` + `useFilters(paramKey)`; renderiza `Accordion`/título + `FilterCheckboxOption` (rótulo + contagem); **sempre** renderiza o título/divisória mesmo com `items: []` (estado vazio) — FR-011/R10.
- [X] T004 [P] Estender `storefront/src/lib/helpers/get-faced-filters.ts` (`getOption`) para mapear as novas chaves → atributos Algolia: `category→categories.name`, `seller→seller.handle`, `name→title`, `reviewed→average_rating`, `erp→<erp_facet>`, `delivery→<delivery_facet>`.

**Checkpoint**: Base pronta (config + componente genérico + mapeamento).

---

## Phase 3: User Story 1 - Refinar a busca com filtros facetados (Priority: P1) 🎯 MVP

**Goal**: As 6 seções aparecem na ordem, com checkbox+contagem, e refinam a grade automaticamente nas duas rotas de categoria.

**Independent Test**: Em `/br/categories` e `/br/categories/{category}`, ver as 6 seções na ordem com contagens; marcar opções refina os produtos automaticamente.

- [X] T005 [US1] Em `storefront/src/components/organisms/ProductSidebar/AlgoliaProductSidebar.tsx`, substituir as seções atuais (color/size/condition/price) pela renderização das 6 seções a partir de `const/category-filters.ts`, usando `AlgoliaRefinementFilter`, com **divisória** entre seções e **ordem fixa** (FR-002/FR-003/FR-004/FR-005).
- [X] T006 [US1] Em `storefront/src/components/sections/ProductListing/AlgoliaProductsListing.tsx`, garantir que o sidebar é sempre renderizado nas duas rotas e que a seleção aplica automaticamente via `<Configure filters={getFacedFilters(...)}>` (sem botão "aplicar") (FR-001/FR-006).
- [X] T007 [US1] Validar (quickstart §Fase 1): seções Categorias/Fornecedor/Nome/Produtos Avaliados exibem opções com contagem e refinam a grade ao clicar, em ambas as rotas (CA001/CA002/SC-001/SC-002/SC-006).

**Checkpoint**: MVP — filtros visíveis e funcionais (facetas existentes).

---

## Phase 4: User Story 2 - Tags dos filtros + limpeza (Priority: P1)

**Goal**: Filtros selecionados viram tags no topo, removíveis individualmente, com ação "Limpar filtros".

**Independent Test**: Selecionar 2+ filtros → tags no topo; remover 1 tag atualiza a busca; "Limpar filtros" volta todos os produtos.

- [X] T008 [US2] Em `storefront/src/components/cells/ActiveFilterElement/ActiveFilterElement.tsx`, adicionar os rótulos pt-BR das novas chaves em `filtersLabels` (`category,seller,name,erp,delivery,reviewed`) e garantir a remoção individual de cada tag (FR-007/FR-008/CA004).
- [X] T009 [US2] Em `AlgoliaProductsListing.tsx`, garantir que `ProductListingActiveFilters` (tags) e a ação **"Limpar filtros"** aparecem no topo da página, conforme o protótipo (FR-007/FR-009).
- [X] T010 [US2] Validar (quickstart): tags aparecem; remover tag atualiza a busca; "Limpar filtros" reseta para todos os produtos (CA004/SC-004/SC-005).

**Checkpoint**: Controle de filtros (tags/limpar) completo.

---

## Phase 5: User Story 3 - Sem resultados / erro (Priority: P2)

**Goal**: Mensagem exata quando filtros não retornam produtos ou em erro.

**Independent Test**: Combinação de filtros sem produtos → mensagem exata.

- [X] T011 [US3] Em `AlgoliaProductsListing.tsx`, exibir exatamente **"Nenhum produto encontrado para o filtro selecionado."** quando não há resultados e também em caso de erro ao filtrar, mantendo painel/tags acessíveis (FR-010).
- [X] T012 [US3] Validar (quickstart): combinação sem produtos mostra a mensagem; em erro idem; página segue utilizável (CA003/SC-003).

**Checkpoint**: Estado vazio/erro tratado.

---

## Phase 6: User Story 4 - Seções de filtro sempre visíveis (Priority: P2)

**Goal**: As 6 seções aparecem na ordem mesmo sem dados (inclui ERP/Modelo de Entrega vazias antes da Fase 2).

**Independent Test**: Sem dados de ERP/Entrega, as seções ainda aparecem na ordem correta.

- [X] T013 [US4] Confirmar/ajustar em `AlgoliaRefinementFilter` (T003) que a seção renderiza título+divisória com estado vazio quando `items: []`, e que `AlgoliaProductSidebar` mapeia **todas** as 6 entradas da config (não filtra seções vazias) (FR-011/SC-007).
- [X] T014 [US4] Validar (quickstart): as 6 seções aparecem na ordem em ambas as rotas; ERP e Modelo de Entrega aparecem vazias sem quebrar o layout (SC-007).

**Checkpoint**: Layout estável e completo independentemente de dados.

---

## Phase 7: Backend (Fase 2 — dependência das facetas ERP / Modelo de Entrega)

**Status**: Habilita os DADOS de "Integrações com ERP" e "Modelo de Entrega". Pode rodar em paralelo ao frontend; ⚠️ risco: transform do plugin `@mercurjs/algolia` é closed-source.

- [ ] T015 Verificar se o índice Algolia já recebe `attribute_values` (inspecionar um registro real do índice — quickstart §Verificação). Registrar o formato (ex.: `attribute_values.value`) ou a ausência.
- [ ] T016 Criar atributos de produto "Integrações com ERP" e "Modelo de Entrega" (is_filterable, possible_values) e atribuir valores a produtos — via `backend/src/scripts/seed-category-attributes.ts` (novo) ou admin-panel.
- [ ] T017 Tornar os atributos facetáveis: adicionar a faceta correspondente a `backend/algolia-config.json` (`attributesForFaceting`); se o plugin não enviar `attribute_values`, implementar subscriber/transform custom no backend; aplicar config e **reindexar** (`init-algolia` + re-sync).
- [ ] T018 Apontar `attribute` das seções `erp`/`delivery` para as facetas reais em `storefront/src/const/category-filters.ts` e `get-faced-filters.ts`; validar que essas seções listam opções com contagem e filtram a grade.

**Checkpoint**: ERP/Modelo de Entrega filtrando de fato.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T019 Conferir fidelidade ao protótipo `specs/design/prototype/filtros-faces-category-page.png` (filtros à esquerda, contagem à direita de cada opção, divisórias, tags+"Limpar filtros" no topo) em desktop e mobile (FR-013/SC-008).
- [X] T020 Rodar `pnpm build`/lint do storefront; rebuild limpo no Docker/macOS (`rm -rf /app/.next/*` + restart) e executar a checklist final do quickstart.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências.
- **Foundational (Fase 2)**: T002/T003/T004 são [P] (arquivos diferentes); **bloqueiam** US1–US4.
- **US1 (Fase 3)**: após Foundational.
- **US2 (Fase 4)**, **US3 (Fase 5)**: após US1 (compartilham `AlgoliaProductsListing.tsx`).
- **US4 (Fase 6)**: depende de T003 (componente genérico) e T005 (render das seções).
- **Backend (Fase 7)**: independente do frontend; T018 conecta os dois (depende de T017 + T002/T004).
- **Polish (Fase 8)**: após as histórias desejadas.

### ⚠️ Same-file constraint

`AlgoliaProductsListing.tsx` é editado em T006 (US1), T009 (US2) e T011 (US3) → **sequencial** (não [P] entre si). `AlgoliaProductSidebar.tsx` em T005/T013 → sequencial.

### Parallel Opportunities

- Fase 2: T002, T003, T004 em paralelo.
- Fase 7 (backend) em paralelo com Fases 3–6 (frontend), até T018 (integração).
- Validações (T007/T010/T012/T014) após suas implementações.

---

## Implementation Strategy

### MVP First (US1)
1. Fase 1 → Fase 2 → Fase 3 (T001–T007).
2. **STOP & VALIDATE**: 6 seções visíveis e refinando (facetas existentes).
3. Demo.

### Incremental Delivery
1. US1 (filtros + refino) → MVP (CA001/CA002).
2. US2 (tags + limpar) → CA004.
3. US3 (sem resultados) → CA003.
4. US4 (seções sempre visíveis) → SC-007.
5. Fase 7 (backend) → ERP/Entrega filtrando.
6. Polish (design + build).

---

## Notes

- Sem testes automatizados (não solicitados); validação manual via quickstart.
- Reuso máximo do padrão Algolia existente (`useRefinementList`/`useFilters`/`getFacedFilters`/chips); 1 componente genérico em vez de 6 cells.
- Substitui os filtros apparel (color/size/condition/price) — irrelevantes para o catálogo.
- Risco isolado na Fase 7: transform do `@mercurjs/algolia` (closed-source) — T015 é a verificação que define o caminho (config simples vs subscriber custom).
- Docker/macOS: limpar `.next` + restart para o bundle de cliente refletir mudanças.
