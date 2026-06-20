# Quickstart — Filtros Facetados na Página de Categorias

Pré-requisito: stack rodando (`storefront` 3000, `backend` 9000, Algolia configurado). Janela anônima para evitar ruído de extensões.

## Fase 1 — Frontend (4 facetas já existentes + 2 seções vazias)

1. Criar config das seções em `storefront/src/const/category-filters.ts` (ordem/labels/atributos/paramKeys — ver data-model.md).
2. Criar `storefront/src/components/cells/AlgoliaRefinementFilter/AlgoliaRefinementFilter.tsx` (genérico; `useRefinementList` + `FilterCheckboxOption`; sempre renderiza o título mesmo com `items: []`).
3. `AlgoliaProductSidebar.tsx`: substituir as seções atuais (color/size/condition/price) pelas 6 seções (map da config + divisórias, na ordem).
4. `get-faced-filters.ts`: mapear `category, seller, name, reviewed, erp, delivery` → atributos Algolia.
5. `ActiveFilterElement.tsx`: adicionar rótulos pt-BR das novas chaves em `filtersLabels`.
6. `AlgoliaProductsListing.tsx`: trocar a mensagem de sem-resultados por **"Nenhum produto encontrado para o filtro selecionado."** (também em erro); garantir tags/"Limpar filtros" no topo e sidebar sempre renderizado.
7. Recarregar (Docker/macOS — file-watch instável): `docker exec mercur-storefront sh -c 'rm -rf /app/.next/*'` + `docker compose restart storefront`.

### Validar (Fase 1)
1. Abrir `http://localhost:3000/br/categories` e `http://localhost:3000/br/categories/{category}`.
2. Conferir: as **6 seções** aparecem na ordem, com divisórias; ERP e Modelo de Entrega aparecem **vazias** (FR-011/SC-007).
3. Marcar opções em Categorias/Fornecedor/Nome/Produtos Avaliados → grade refina automaticamente; contagens visíveis (CA001/CA002).
4. Tags aparecem no topo; remover uma tag atualiza a busca; "Limpar filtros" volta todos os produtos (CA004/SC-005).
5. Selecionar combinação sem produtos → mensagem **"Nenhum produto encontrado para o filtro selecionado."** (CA003).

## Fase 2 — Backend (facetas ERP / Modelo de Entrega)

### Verificação (decisiva) — o índice já traz attribute_values?
```bash
# Inspecionar um registro real no índice Algolia (app/admin) ou via API:
# Procurar no objeto do produto por "attribute_values" (e seu formato).
# Se ausente, o plugin @mercurjs/algolia NÃO envia atributos -> precisa subscriber/transform custom.
```

### Passos
1. Criar atributos "Integrações com ERP" e "Modelo de Entrega" (is_filterable, possible_values) e atribuir valores a produtos — via admin-panel ou script `backend/src/scripts/seed-category-attributes.ts`.
2. Garantir que cheguem ao índice como faceta:
   - se `attribute_values` já vai ao índice → adicionar a faceta (ex.: `attribute_values.value`) em `backend/algolia-config.json`;
   - senão → implementar transform/subscriber custom que exponha campos facetáveis dedicados.
3. Aplicar config e reindexar:
   ```bash
   docker compose exec backend pnpm exec medusa exec ./src/scripts/init-algolia.ts   # aplica algolia-config.json
   # + re-sync/reindex dos produtos (conforme mecanismo do plugin)
   ```
4. Apontar `attribute` das seções `erp`/`delivery` (na config do frontend e no `get-faced-filters`) para as facetas reais.

### Validar (Fase 2)
- As seções "Integrações com ERP" e "Modelo de Entrega" passam a listar opções com contagem e a filtrar a grade.

## Critérios de aceite rápidos

- [ ] 6 seções na ordem, com divisórias, nas duas rotas de categoria. (CA001/SC-001/SC-007)
- [ ] Checkbox + contagem por opção; refino automático ao clicar. (CA002/SC-002/SC-006)
- [ ] Tags no topo; remoção individual; "Limpar filtros" reseta. (CA004/SC-004/SC-005)
- [ ] Mensagem exata quando sem resultados/erro. (CA003/SC-003)
- [ ] ERP/Modelo de Entrega aparecem mesmo vazias (fase 1) e filtram após a fase 2. (FR-011)
- [ ] Identidade visual FIND e dinâmica do protótipo. (FR-013)
