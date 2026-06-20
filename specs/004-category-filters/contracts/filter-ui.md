# Contract — UI: Painel de Filtros, Tags e Mensagens

Sem API nova no frontend (usa Algolia via react-instantsearch). Contrato de UI/comportamento.

## Painel de filtros (sidebar, conforme protótipo)

- Renderizado nas páginas `/{locale}/categories` e `/{locale}/categories/{category}` (FR-001).
- 6 seções, **na ordem fixa** (FR-002), cada uma com **título** e **divisória** (FR-003):
  1. Categorias do Produto · 2. Nome do Fornecedor · 3. Nome do Produto · 4. Integrações com ERP · 5. Modelo de Entrega · 6. Produtos Avaliados.
- Cada opção = **checkbox** + rótulo + **contagem à direita** (ex.: `Evollux (4)`) (FR-004/FR-005).
- Seleção/desmarcação aplica o filtro **automaticamente** (sem botão "aplicar") (FR-006).
- Seções sem opções **ainda aparecem** (título + estado vazio), preservando ordem/divisória (FR-011).

Componente genérico: `AlgoliaRefinementFilter({ label, attribute, paramKey, defaultOpen })`
- usa `useRefinementList({ attribute, operator: "or", limit })` para opções+contagem;
- usa `useFilters(paramKey)` para `isFilterActive`/`updateFilters` (estado na URL);
- renderiza `FilterCheckboxOption` por item; **sempre** renderiza o título mesmo com `items: []`.

## Tags dos filtros (topo) + limpar

- Cada filtro selecionado aparece como **tag** no topo (`ProductListingActiveFilters` → `ActiveFilterElement` → `Chip`) (FR-007).
- Cada tag tem "✕" para **remoção individual** → atualiza a busca removendo só aquele filtro (FR-008/CA004).
- Ação **"Limpar filtros"** remove todos os filtros e recarrega com todos os produtos (FR-009/SC-005).
- `filtersLabels` (em `ActiveFilterElement`) MUST mapear as novas chaves para rótulos pt-BR:
  `category→"Categorias do Produto"`, `seller→"Nome do Fornecedor"`, `name→"Nome do Produto"`, `erp→"Integrações com ERP"`, `delivery→"Modelo de Entrega"`, `reviewed→"Produtos Avaliados"`.

## Mensagem de sem-resultados / erro

- Quando não há produtos para os filtros **ou** em caso de erro, exibir exatamente:
  **"Nenhum produto encontrado para o filtro selecionado."** (FR-010/CA003)
- A página permanece utilizável (painel e tags acessíveis para ajustar).

## Estado e consistência

- Filtros vivem na URL (search params) via `useFilters`/`useUpdateSearchParams`.
- Painel, tags e grade derivam da URL ⇒ recarregar mantém tudo consistente (FR-012).

## Invariantes

- A grade de produtos só exibe itens que atendem aos filtros ativos (CA002/SC-002).
- Nenhuma das 6 seções some por falta de dados (SC-007).
- Visual e dinâmica conforme protótipo e identidade FIND (FR-013).
