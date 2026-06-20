<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/004-category-filters/plan.md`

Active feature: **Filtros Facetados na Página de Categorias** (`004-category-filters`)
- Spec: `specs/004-category-filters/spec.md`
- Plan + design artifacts: `specs/004-category-filters/` (research.md, data-model.md, contracts/, quickstart.md)
- Escopo: storefront (react-instantsearch/Algolia) — painel de 6 seções de filtro em ordem fixa
  (Categorias, Fornecedor, Nome do Produto, Integrações ERP, Modelo de Entrega, Produtos Avaliados),
  checkbox+contagem, auto-aplicar, tags no topo (remoção individual + "Limpar filtros"), mensagem
  "Nenhum produto encontrado para o filtro selecionado.". Reusa useRefinementList/useFilters/
  getFacedFilters/ActiveFilterElement; novo componente genérico `AlgoliaRefinementFilter` + config
  `const/category-filters.ts`. Substitui filtros apparel (color/size/condition/price).
- ⚠️ Fase 2 (backend): facetas "Integrações com ERP" e "Modelo de Entrega" não existem no índice;
  criar atributos + indexar (risco: transform do plugin @mercurjs/algolia é closed-source). Seções
  aparecem vazias até lá (FR-011).

Related/previous: `003-default-review-stars`, `002-seller-review-stars-plp` (implementadas), `001-home-plans-update` (pausada).
<!-- SPECKIT END -->
