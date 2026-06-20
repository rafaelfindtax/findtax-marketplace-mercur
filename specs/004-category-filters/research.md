# Research — Filtros Facetados na Página de Categorias

Fase 0. Decisões com base no código real (storefront react-instantsearch + backend Algolia).

## R1. Reutilizar o padrão de refinamento existente

- **Decision**: Usar o padrão já estabelecido: `useRefinementList({ attribute, operator: "or" })` para obter opções+contagem; `useFilters(paramKey)` para alternar a seleção na URL; `getFacedFilters(searchParams)` para montar o `filters` do `<Configure>`; `ProductListingActiveFilters`/`ActiveFilterElement` para as tags + "Clear All".
- **Rationale**: Tudo isso já existe e funciona para color/size/condition/price. Reaproveitar garante consistência e reduz risco.
- **Alternatives considered**: Usar a refinação nativa do `useRefinementList` (em vez do `getFacedFilters`) — rejeitado para não divergir do padrão atual (estado na URL + Configure).

## R2. Substituir os filtros atuais (apparel) pelas 6 seções de negócio

- **Decision**: Substituir as seções atuais do `AlgoliaProductSidebar` (color/size/condition/price) pelas 6 seções da spec. 
- **Rationale**: O catálogo da FIND é de soluções tributárias/software; cor/tamanho/condição não se aplicam. A spec e o protótipo definem outro conjunto.
- **Alternatives considered**: Manter os antigos e adicionar os novos — rejeitado: poluiria a UI com filtros sem sentido para o catálogo.

## R3. Componente genérico de seção + config ordenada

- **Decision**: Criar `AlgoliaRefinementFilter` (props: `label`, `attribute`, `paramKey`, `defaultOpen`) que renderiza `Accordion`/título + lista de `FilterCheckboxOption` (label + contagem) via `useRefinementList`, e **sempre** renderiza a seção (com estado vazio quando `items` é vazio). Definir a ordem/labels/atributos em `storefront/src/const/category-filters.ts`.
- **Rationale**: Evita 6 componentes quase idênticos; centraliza ordem (FR-002), divisórias (FR-003) e a regra "sempre visível" (FR-011).
- **Alternatives considered**: 6 cells dedicadas (padrão atual color/size/...) — rejeitado por duplicação.

## R4. Mapeamento de facetas e o que já existe

- **Decision**: Mapear (em `get-faced-filters.ts` e na config):
  - Categorias do Produto → `categories.name` ✅
  - Nome do Fornecedor → `seller.handle` ✅ (valores são handles; ver R5)
  - Nome do Produto → `title` ✅ (faceta searchable)
  - Produtos Avaliados → `average_rating` ✅
  - Integrações com ERP → atributo novo (fase 2)
  - Modelo de Entrega → atributo novo (fase 2)
- **Rationale**: 4 das 6 facetas já estão em `backend/algolia-config.json` (`attributesForFaceting`).
- **Fonte**: `attributesForFaceting`: `average_rating, categories.id, categories.name, seller.handle, seller.store_status, supported_countries, title, variants.*`.

## R5. "Nome do Fornecedor" — handle vs nome

- **Decision**: Exibir a seção usando `seller.handle` (já facetado). Opcionalmente, adicionar `seller.name` como faceta no backend para mostrar o nome amigável.
- **Rationale**: Apenas `seller.handle` é facetado hoje (o protótipo mostra `seller.handle: evollux`). Para entregar já, usar handle; recomendar `seller.name` como melhoria.
- **Alternatives considered**: Bloquear até ter `seller.name` — desnecessário; handle já entrega a função.

## R6. "Nome do Produto" como faceta de checkbox

- **Decision**: Usar `title` como faceta (uma opção por título, contagem normalmente 1), conforme o protótipo (`Monitor (1)`, `Prime (1)`…).
- **Rationale**: É o que o protótipo e o usuário pedem; `searchable(title)` já é facetável.
- **Observação**: Em catálogos grandes essa seção pode ter muitas opções; o `useRefinementList` tem `limit` + "Show more" (já usado no padrão atual).

## R7. ERP / Modelo de Entrega — dependência de backend (fase 2) e risco do plugin

- **Decision**: As seções 4 e 5 aparecem **vazias** desde já (FR-011). Para filtrarem de fato, é preciso: (a) criar os atributos de produto "Integrações com ERP" e "Modelo de Entrega" (is_filterable, possible_values) e atribuir valores aos produtos; (b) garantir que cheguem ao índice como **facetas**; (c) adicioná-los a `attributesForFaceting` em `backend/algolia-config.json`; (d) reindexar.
- **Risco**: O transform do plugin `@mercurjs/algolia` (closed-source) pode **não** enviar `attribute_values` ao Algolia. **Verificação obrigatória** (quickstart): inspecionar um registro real no índice para ver se `attribute_values` está presente e em que formato (ex.: `attribute_values.value`/`attribute_values.name`). Se não estiver, será necessário um subscriber/transform custom ou patch do plugin.
- **Rationale**: Isola a incerteza de backend sem bloquear a entrega do frontend (que funciona para as 4 facetas existentes e mostra as 2 seções vazias).
- **Alternatives considered**: Modelar ERP/Entrega como tags/`type`/`collection` já indexados — possível atalho se mapearem ao negócio; avaliar no planejamento de backend.

## R8. Tags dos filtros + limpar tudo + mensagem de vazio

- **Decision**: Reusar `ProductListingActiveFilters`/`ActiveFilterElement` (chips com remoção individual) e a ação "Clear All" já existentes; adicionar os rótulos pt-BR das novas chaves em `filtersLabels`. Trocar a mensagem de sem-resultados de `AlgoliaProductsListing` para o texto exato **"Nenhum produto encontrado para o filtro selecionado."** (FR-010), exibida também em erro.
- **Rationale**: Cobre CA003/CA004 reusando o que existe; muda apenas labels e a string.

## R9. Estado na URL e consistência ao recarregar

- **Decision**: Manter o estado dos filtros em search params (via `useFilters`/`useUpdateSearchParams`), como hoje. As tags e o painel derivam da URL, garantindo consistência ao recarregar (FR-012).
- **Rationale**: Padrão já adotado; sem mudança estrutural.

## R10. Seção sempre visível mesmo com `items` vazio

- **Decision**: O `AlgoliaRefinementFilter` deve renderizar título+divisória **mesmo** quando `useRefinementList` retorna `items: []` (estado vazio, sem opções clicáveis), garantindo FR-011 e a ordem das 6 seções.
- **Rationale**: O padrão atual tende a mapear `items` (some quando vazio); precisamos renderizar a seção explicitamente.

## Itens NEEDS CLARIFICATION

Nenhum bloqueante. A dependência ERP/Entrega (R7) está documentada e isolada em fase 2; o frontend é entregável independentemente. Verificação do formato `attribute_values` no índice é passo do quickstart.
