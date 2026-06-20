# Data Model — Filtros Facetados na Página de Categorias

A feature é majoritariamente de UI sobre facetas Algolia. "Dados" = (a) config das seções no frontend e (b) atributos de produto no backend (fase 2).

## Frontend: configuração das seções de filtro

`storefront/src/const/category-filters.ts` — lista **ordenada** que dirige a renderização.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `key` | string | identificador interno da seção |
| `label` | string | rótulo exibido (pt-BR), ex.: "Nome do Fornecedor" |
| `attribute` | string | atributo de faceta no Algolia (ex.: `categories.name`) |
| `paramKey` | string | chave usada na URL e nas tags (ex.: `seller`) |
| `alwaysVisible` | boolean | `true` — seção renderiza mesmo sem opções (FR-011) |

**Ordem fixa (FR-002)**:

```
1. { key: "category",  label: "Categorias do Produto", attribute: "categories.name", paramKey: "category" }
2. { key: "seller",    label: "Nome do Fornecedor",    attribute: "seller.handle",   paramKey: "seller" }
3. { key: "name",      label: "Nome do Produto",       attribute: "title",            paramKey: "name" }
4. { key: "erp",       label: "Integrações com ERP",   attribute: "<erp_facet>",      paramKey: "erp" }      // fase 2
5. { key: "delivery",  label: "Modelo de Entrega",     attribute: "<delivery_facet>", paramKey: "delivery" } // fase 2
6. { key: "reviewed",  label: "Produtos Avaliados",    attribute: "average_rating",   paramKey: "reviewed" }
```

## Entidade derivada (runtime): Opção de Filtro

Vinda de `useRefinementList(attribute)` (por seção):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `label` | string | valor da faceta (ex.: "Evollux") |
| `count` | number | nº de produtos para a opção (exibido à direita) |
| `isRefined` | boolean | se está selecionada (sincronizada com a URL via `useFilters`) |

> Seção com `items: []` ⇒ renderizar título + estado vazio (sem opções), preservando ordem/divisória (FR-011).

## Entidade: Filtro Ativo (Tag)

Derivada dos search params (via `ProductListingActiveFilters`):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `paramKey` | string | seção do filtro (mapeada a rótulo pt-BR) |
| `value` | string | valor selecionado |
| (ação) | — | remoção individual (✕) → desmarca aquele valor; "Limpar filtros" → remove todos |

## Backend (fase 2): Atributos de produto para ERP/Entrega

Atributos via módulo de atributos do MercurJS (já consumido como `attribute_values`):

- **Atributo "Integrações com ERP"**: `is_filterable = true`, `ui_component` = select/multivalue, `possible_values` = ex.: SAP, Oracle, TOTVS, etc.
- **Atributo "Modelo de Entrega"**: `is_filterable = true`, `possible_values` = ex.: SaaS/Nuvem, On-premise, Híbrido, etc.

**Indexação**: garantir que esses valores cheguem ao índice como **faceta** (campo dedicado ou `attribute_values.*`) e adicioná-los a `attributesForFaceting` em `backend/algolia-config.json`; reindexar. (Ver risco do plugin closed-source em research R7.)

> "Produtos Avaliados" reutiliza `average_rating` (já indexado/derivado das reviews) — sem novo atributo. "Categorias/Fornecedor/Nome" já existem como facetas.
