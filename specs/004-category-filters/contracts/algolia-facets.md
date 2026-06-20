# Contract — Algolia: Facetas por Seção

A busca facetada usa o índice `products` (Algolia). Cada seção da UI consome uma faceta.

## Facetas usadas pela UI

| Seção (paramKey) | Atributo de faceta | No índice hoje? |
|------------------|--------------------|-----------------|
| `category` | `categories.name` | ✅ sim |
| `seller` | `seller.handle` (opc. `seller.name`) | ✅ handle |
| `name` | `title` (searchable facet) | ✅ sim |
| `reviewed` | `average_rating` | ✅ sim |
| `erp` | atributo novo (ex.: `attribute_values.value` ou campo dedicado) | ⚠️ fase 2 |
| `delivery` | atributo novo | ⚠️ fase 2 |

Config atual (`backend/algolia-config.json` → `attributesForFaceting`):
`average_rating, filterOnly(categories.id), categories.name, seller.handle, seller.store_status, filterOnly(supported_countries), searchable(title), variants.color, variants.condition, variants.prices.currency_code, variants.size`.

## Mudanças de índice (fase 2 — ERP / Modelo de Entrega)

1. Criar atributos de produto "Integrações com ERP" e "Modelo de Entrega" (is_filterable, possible_values) e atribuir valores a produtos.
2. **Verificar** se o plugin `@mercurjs/algolia` envia `attribute_values` ao registro do índice (ver quickstart §Verificação). 
   - Se **sim**: adicionar a faceta correspondente (ex.: `attribute_values.value` ou faceta por nome) a `attributesForFaceting`.
   - Se **não**: implementar subscriber/transform custom (ou patch) que inclua os atributos como campos facetáveis dedicados (ex.: `erp_integrations`, `delivery_models`).
3. Atualizar `attributesForFaceting` em `backend/algolia-config.json` e **reindexar** (re-rodar `init-algolia` / re-sync de produtos).
4. (Opcional) Adicionar `seller.name` a `attributesForFaceting` se "Nome do Fornecedor" deve exibir o nome em vez do handle.

## Mapeamento URL → filtro (frontend)

`get-faced-filters.ts` (`getOption`) MUST mapear as chaves de URL para os atributos:
`category→categories.name`, `seller→seller.handle`, `name→title`, `reviewed→average_rating`, `erp→<erp_facet>`, `delivery→<delivery_facet>`.
Seleção múltipla na mesma seção = operador "or" (padrão atual).

## Invariantes

- Contagens exibidas vêm de `useRefinementList` e refletem o resultado ao aplicar a opção (SC-006).
- Seções com faceta inexistente/sem valores ⇒ `items: []` ⇒ seção vazia (não some) (FR-011).
