# Implementation Plan: Filtros Facetados na Página de Categorias

**Branch**: `004-category-filters` | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-category-filters/spec.md`

## Summary

Exibir, nas páginas de categoria (`/{locale}/categories` e `/{locale}/categories/{category}`), um painel de filtros facetados à esquerda com 6 seções em ordem fixa (Categorias do Produto, Nome do Fornecedor, Nome do Produto, Integrações com ERP, Modelo de Entrega, Produtos Avaliados), checkboxes com contagem, aplicação automática, tags dos filtros no topo (removíveis + "Limpar filtros") e a mensagem "Nenhum produto encontrado para o filtro selecionado." quando vazio/erro. As seções sempre aparecem, mesmo sem dados.

Abordagem técnica: a vitrine **já usa Algolia/react-instantsearch** com o padrão de refinamento (`useRefinementList` para opções+contagem, `useFilters` para estado na URL, `getFacedFilters` para o filtro do `Configure`, e `ProductListingActiveFilters`/`ActiveFilterElement` para as tags + "Clear All"). O trabalho é majoritariamente **frontend**: substituir os filtros atuais (color/size/condition/price — irrelevantes para o catálogo tributário/software) por um **componente genérico de refinamento** reutilizado nas 6 seções, com rótulos amigáveis e ordem fixa, garantindo que cada seção apareça mesmo quando a faceta não tem valores.

Há uma **dependência de backend** para 2 facetas que ainda não existem no índice: **"Integrações com ERP"** e **"Modelo de Entrega"**. Essas seções aparecem (vazias) imediatamente (FR-011) e passam a filtrar quando os atributos forem criados e indexados como facetas no Algolia — entregue em uma fase separada por envolver o plugin `@mercurjs/algolia` (transform closed-source; requer verificação).

## Technical Context

**Language/Version**: TypeScript / React 19 (Next.js 15 App Router), storefront. Backend Medusa 2.10.2 (apenas para a fase de facetas ERP/Entrega).

**Primary Dependencies**: `react-instantsearch` / `react-instantsearch-nextjs`, `algoliasearch` (lite client) no storefront; plugin `@mercurjs/algolia` + `backend/algolia-config.json` no backend. Componentes existentes: `useRefinementList`, `useFilters`, `getFacedFilters`, `FilterCheckboxOption`, `Checkbox`, `Chip`, `Accordion`, `ProductListingActiveFilters`/`ActiveFilterElement`.

**Storage**: Estado dos filtros na **URL** (search params) — padrão atual (`useFilters`/`useUpdateSearchParams`). Sem persistência nova no frontend. Facetas vivem no índice Algolia (config no backend).

**Testing**: Validação manual via quickstart (categorias geral e específica; selecionar/limpar filtros; contagem; sem-resultados) + lint/build. Sem framework de testes no repo.

**Target Platform**: Storefront web (container `storefront`, 3000); índice Algolia (config aplicada pelo backend via `init-algolia`).

**Project Type**: Web — frontend (storefront) + dependência de backend/índice para 2 facetas.

**Performance Goals**: Refinamento percebido como instantâneo (NFR-002/SC-008) — o InstantSearch já atualiza resultados/contagens client-side por faceta.

**Constraints**: Manter identidade visual FIND e a dinâmica do protótipo (FR-013); ordem fixa das 6 seções (FR-002); seções sempre visíveis mesmo vazias (FR-011); mensagem exata de sem-resultados (FR-010). Os filtros operam sobre as facetas do Algolia (NFR-001).

**Scale/Scope**: Catálogo pequeno/médio. Frontend: substituir o conteúdo do sidebar por 6 seções (1 componente genérico reutilizado) + ajustes em mapeamento/labels/mensagem. Backend (fase 2): criar 2 atributos + indexá-los como facetas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição (`.specify/memory/constitution.md`) é template não ratificado — sem gates específicos.

Princípios pragmáticos:
- **Reuso**: usar o padrão de refinamento já existente (`useRefinementList` + `useFilters` + `getFacedFilters` + chips). Criar **um** componente genérico de seção em vez de 6 quase-duplicados.
- **Mínima superfície**: a maior parte é configuração (lista ordenada de seções) + substituição do conteúdo do sidebar.
- **Degradação graciosa**: seções sem faceta/valores aparecem vazias; sem-resultados mostra mensagem; nada quebra a página.

✅ Sem violações. Complexity Tracking não necessária.

## Project Structure

### Documentation (this feature)

```text
specs/004-category-filters/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões
├── data-model.md        # Fase 1 — config das seções + atributos backend
├── quickstart.md        # Fase 1 — como rodar/validar (inclui indexação)
├── contracts/
│   ├── filter-ui.md     # contrato de UI do painel/tags/mensagem
│   └── algolia-facets.md# facetas por seção + mudanças no índice
└── checklists/
    └── requirements.md  # (criado no /speckit-specify)
```

### Source Code (repository root)

```text
storefront/src/
├── const/
│   └── category-filters.ts                 # [NEW] config ordenada das 6 seções (key,label,attribute,paramKey,alwaysVisible)
├── components/
│   ├── organisms/
│   │   ├── ProductSidebar/AlgoliaProductSidebar.tsx     # [MOD] renderiza as 6 seções (componente genérico), com divisórias e ordem fixa
│   │   └── ProductListingActiveFilters/ProductListingActiveFilters.tsx  # [MOD/REUSE] tags no topo + "Limpar filtros"
│   ├── cells/
│   │   ├── ActiveFilterElement/ActiveFilterElement.tsx # [MOD] rótulos amigáveis (pt-BR) p/ as novas chaves
│   │   └── AlgoliaRefinementFilter/                     # [NEW] seção genérica: useRefinementList(attribute) + FilterCheckboxOption + estado vazio
│   └── sections/ProductListing/
│       ├── AlgoliaProductsListing.tsx      # [MOD] mensagem exata de sem-resultados + barra de filtros/tags no topo + sempre renderizar sidebar
│       └── ProductListing.tsx              # [MOD opcional] fallback não-Algolia (fora do escopo principal)
└── lib/helpers/get-faced-filters.ts        # [MOD] mapear novas chaves -> atributos Algolia (category, seller, name, erp, delivery, reviewed)

backend/                                    # [FASE 2 — dependência ERP/Entrega]
├── algolia-config.json                     # [MOD] adicionar facetas (atributos ERP/Entrega; opc. seller.name) em attributesForFaceting
└── src/scripts/seed-category-attributes.ts # [NEW] cria atributos "Integrações com ERP" e "Modelo de Entrega" (is_filterable, possible_values) + valores em produtos
```

**Structure Decision**: Web, foco no storefront. As duas páginas de categoria já renderizam `AlgoliaProductsListing`; portanto, alterar o sidebar (e o mapeamento/tags/mensagem) cobre as duas rotas de uma vez (FR-001). Um único componente genérico de seção (`AlgoliaRefinementFilter`) é reutilizado para as 6 seções, parametrizado por uma config ordenada — garante ordem fixa (FR-002), divisórias (FR-003), contagem (FR-005) e estado vazio sempre visível (FR-011). A fase de backend (atributos ERP/Entrega + indexação) é isolada e só afeta o conteúdo (valores/contagens) dessas duas seções.

## Faceta por seção (resumo) 

| # | Seção (rótulo) | Atributo Algolia | Status |
|---|----------------|------------------|--------|
| 1 | Categorias do Produto | `categories.name` | ✅ já facetado |
| 2 | Nome do Fornecedor | `seller.handle` (opc. add `seller.name`) | ✅ já facetado (handle) |
| 3 | Nome do Produto | `title` (searchable facet) | ✅ já facetado |
| 4 | Integrações com ERP | atributo novo (ex.: `attribute_values`/campo dedicado) | ⚠️ fase 2 (criar + indexar) |
| 5 | Modelo de Entrega | atributo novo | ⚠️ fase 2 (criar + indexar) |
| 6 | Produtos Avaliados | `average_rating` | ✅ já facetado |

## Complexity Tracking

> Não aplicável — Constitution Check sem violações.
